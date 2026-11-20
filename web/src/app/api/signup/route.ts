import { NextResponse, NextRequest } from "next/server";
import {
    getUserByEmail,
    validateUser,
    insertUserTx,
    updateUserTx,
    deleteUserByEmail,
    HandleValidationError,
    TimeValidationError,
    DateOfMonthValidationError,
    DayValidationError,
    MonthValidationError,
} from "@/models/user";
import { db } from "@/db/client";
import {
    validateSubscription,
    insertSubscriptionTx,
    updateSubscriptionCadenceTx,
    deleteSubscriptionByEmailAndHandle,
    deleteSubscriptionByEmail,
    diffSubscriptions,
    CadenceValidationError,
    getSubscriptionsTx,
    type SubscriptionInput,
} from "@/models/subscriptions";
import { buildCronExpression, cancelSchedule } from "../../../jobs/scheduler";
import { auth } from "@/auth";

// Thrown inside the PUT transaction when there's no users row to update, so
// the transaction rolls back and the route can answer 404.
class UserNotFoundError extends Error {}

// What the settings page sends on PUT. Typing it (instead of leaving
// request.json() as `any`) lets tsc catch wrong/swapped arguments below.
interface UpdateBody {
    email?: string;
    subscriptions?: SubscriptionInput[];
    cadence?: string;
    time?: string;
    day?: string;
    month?: string;
    dateOfMonth?: string;
}

export async function POST(request: Request) {
    const session = await auth();
    const body = await request.json();
    //const parse = JSON.parse(content);
    const { email, subscriptions: subs, cadence, time, day, month, dateOfMonth } = body;


    if (!session?.user?.email) {
        return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    if (session.user.email !== email) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!email || !Array.isArray(subs) || subs.length === 0 || !cadence || !time) {
        return NextResponse.json(
            { error: "Missing required fields: email, handles, cadence, time" },
            { status: 400 },
        );
    }

    try {
        validateUser(cadence,time, day, month, dateOfMonth);
    

        for (const sub of subs) {
            await validateSubscription(sub.handle, sub.cadence)
        }
    } catch(error) {
        if (
            error instanceof CadenceValidationError ||
            error instanceof HandleValidationError ||
            error instanceof TimeValidationError ||
            error instanceof DayValidationError ||
            error instanceof MonthValidationError ||
            error instanceof DateOfMonthValidationError
        ) {
            return NextResponse.json({error: error.message}, {status: 400});
        }
        return NextResponse.json({ error: "Invalid Input"}, {status: 400})
    }
    try {
        db.transaction((tx) => {
            insertUserTx(
                tx,
                email,
                subs.map((s: { handle: string }) => s.handle),
                cadence,
                time,
                day,
                month,
                dateOfMonth
            );
            for (const sub of subs) {
              insertSubscriptionTx(
                tx,
                email,
                sub.handle,
                sub.cadence
              );
            }
        });

    } catch(error) {
        if (error instanceof Error && "code" in error &&  error?.code === "SQLITE_CONSTRAINT_PRIMARYKEY") {
            return NextResponse.json({ error: 'An account with this email already exists.'}, { status: 409 });
        }
        return NextResponse.json({error: 'Something went wrong while saving your subscription.' }, {status: 500})
        
    }
    
      
    try {
        await buildCronExpression(
            email,
            cadence,
            day,
            time,
            month,
            dateOfMonth,
        );
    } catch (error) {
        if (
            error instanceof HandleValidationError ||
            error instanceof TimeValidationError ||
            error instanceof DayValidationError ||
            error instanceof MonthValidationError ||
            error instanceof DateOfMonthValidationError ||
            error instanceof CadenceValidationError
        ) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    return NextResponse.json({ message: "User created" }, { status: 201 });
}

export async function GET(request: NextRequest) {
    const session = await auth();

    // Identity always comes from the session, never from client-supplied
    // input — otherwise any signed-in user could read anyone else's data
    // just by passing a different email in the query string.
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const user = await getUserByEmail(session.user.email);
    if (!user[0]) {
        return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    return NextResponse.json(user[0]);
}

// Replaces the user's whole settings (the settings page always sends the full
// form). Email can't be changed — it's the Google account identity.
export async function PUT(request: Request) {
    const session = await auth();
    const body: UpdateBody = await request.json();
    const { email, subscriptions: subs, cadence, time, day, month, dateOfMonth } =
        body;

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    if (session.user.email !== email) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (
        !email ||
        !Array.isArray(subs) ||
        subs.length === 0 ||
        subs.some((s) => !s?.handle || !s?.cadence) ||
        !cadence ||
        !time
    ) {
        return NextResponse.json(
            { error: "Missing required fields: email, subscriptions, cadence, time" },
            { status: 400 },
        );
    }

    // Normalize and de-duplicate by handle, so "Stratechery" and
    // "stratechery " are the same writer and can't trip the primary key.
    const incoming: SubscriptionInput[] = [
        ...new Map(
            subs.map((s) => {
                const handle = s.handle.trim().toLowerCase();
                return [handle, { handle, cadence: s.cadence.trim().toLowerCase() }];
            }),
        ).values(),
    ];

    // Step 1: validate everything (network calls allowed). Nothing written yet.
    try {
        validateUser(cadence, time, day, month, dateOfMonth);
        for (const sub of incoming) {
            await validateSubscription(sub.handle, sub.cadence);
        }
    } catch (error) {
        if (
            error instanceof CadenceValidationError ||
            error instanceof HandleValidationError ||
            error instanceof TimeValidationError ||
            error instanceof DayValidationError ||
            error instanceof MonthValidationError ||
            error instanceof DateOfMonthValidationError
        ) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Step 2: all writes in one synchronous transaction — all or nothing.
    try {
        db.transaction((tx) => {
            const result = updateUserTx(
                tx,
                email,
                incoming.map((s) => s.handle),
                cadence,
                time,
                day,
                month,
                dateOfMonth,
            );
            if (result.changes === 0) {
                throw new UserNotFoundError();
            }

            const current = getSubscriptionsTx(tx, email);
            const { toRemove, toAdd, toChange } = diffSubscriptions(current, incoming);

            for (const sub of toRemove) {
                deleteSubscriptionByEmailAndHandle(tx, email, sub.handle);
            }
            for (const sub of toAdd) {
                insertSubscriptionTx(tx, email, sub.handle, sub.cadence);
            }
            for (const sub of toChange) {
                updateSubscriptionCadenceTx(tx, email, sub.handle, sub.cadence);
            }
        });
    } catch (error) {
        if (error instanceof UserNotFoundError) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        console.error("PUT /api/signup: transaction failed:", error);
        return NextResponse.json(
            { error: "Something went wrong while saving your settings." },
            { status: 500 },
        );
    }

    // Step 3: reschedule only after the database change has committed.
    try {
        await buildCronExpression(
            email,
            cadence,
            day ?? "",
            time,
            month ?? "",
            dateOfMonth ?? "",
        );
    } catch (error) {
        if (
            error instanceof HandleValidationError ||
            error instanceof TimeValidationError ||
            error instanceof DayValidationError ||
            error instanceof MonthValidationError ||
            error instanceof DateOfMonthValidationError ||
            error instanceof CadenceValidationError
        ) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ message: "User updated" }, { status: 200 });
}

export async function DELETE(request: Request) {
    const session = await auth();
    const body = await request.json();
    const { email } = body;

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    if (session.user.email !== email) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!email) {
        return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }
    try {
        db.transaction((tx) => {
            deleteSubscriptionByEmail(tx, email);
            deleteUserByEmail(tx, email);
        })
    } catch(error) {
        return NextResponse.json(
            { error: "Could not delete account" },
            { status: 500 },
        );
    }
    cancelSchedule(email);
    return NextResponse.json(
        { message: "User deleted successfully" },
        { status: 200 },
    );
}
