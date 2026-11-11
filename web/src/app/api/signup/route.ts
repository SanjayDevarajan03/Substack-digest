import { NextResponse, NextRequest } from "next/server";
import {
    getAllUsers,
    getUserByEmail,
    insertUser,
    updateAll,
    deleteUserByEmail,
    HandleValidationError,
    TimeValidationError,
    DateOfMonthValidationError,
    DayValidationError,
    MonthValidationError,
} from "@/models/user";
import { buildCronExpression } from "../../../jobs/scheduler";
import { auth } from "@/auth";

export async function POST(request: Request) {
    const session = await auth();
    const body = await request.json();
    //const parse = JSON.parse(content);
    const { email, handles, cadence, time, day, month, dateOfMonth } = body;

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    if (session.user.email !== email) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!email || !handles || !cadence || !time) {
        return NextResponse.json(
            { error: "Missing required fields: email, handles, cadence, time" },
            { status: 400 },
        );
    }

    try {
        await insertUser(
            email,
            handles,
            cadence,
            time,
            day,
            month,
            dateOfMonth,
        );
    } catch (error) {
        return NextResponse.json(
            {
                error:
                    error instanceof Error ? error.message : "Invalid handle",
            },
            { status: 400 },
        );
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
            error instanceof DateOfMonthValidationError
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

export async function PATCH(request: Request) {
    const session = await auth();
    const body = await request.json();
    const { email, handles, cadence, time, newEmail, day, month, dateOfMonth } =
        body;

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    if (session.user.email !== email) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!email) {
        return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    if (
        handles === undefined &&
        cadence === undefined &&
        time === undefined &&
        newEmail === undefined
    ) {
        return NextResponse.json(
            { error: "No fields to update" },
            { status: 400 },
        );
    }

    // email is always the current/lookup identifier; newEmail (if present)
    // is the value to change it to — kept separate so they're never confused.
    try {
        await updateAll(
            email,
            newEmail,
            handles,
            cadence,
            time,
            day,
            month,
            dateOfMonth,
        );
    } catch (error) {
        if (
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
            error instanceof DateOfMonthValidationError
        ) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ message: "User updated" }, { status: 200 });
}

export async function PUT(request: Request) {
    const session = await auth();
    const body = await request.json();
    const { email, newEmail, handles, cadence, time, day, month, dateOfMonth } =
        body;

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    if (session.user.email !== email) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!email || !handles || !cadence || !time) {
        return NextResponse.json(
            {
                error: "Missing required field: email, handles, cadence,time, day, month",
            },
            { status: 400 },
        );
    }
    try {
        await updateAll(
            email,
            newEmail,
            handles,
            cadence,
            time,
            day,
            month,
            dateOfMonth,
        );
    } catch (error) {
        if (
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

    return NextResponse.json(
        { message: "User details updated successfully" },
        { status: 200 },
    );
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

    await deleteUserByEmail(email);
    return NextResponse.json(
        { message: "User deleted successfully" },
        { status: 200 },
    );
}
