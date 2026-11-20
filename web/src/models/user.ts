import { users } from "../db/schema";
import { db, type Tx } from "../db/client";
import { eq } from "drizzle-orm";
import { isValidHandle } from "../services/feedFetcher";

export class TimeValidationError extends Error {}
export class HandleValidationError extends Error {}
export class DayValidationError extends Error {}
export class MonthValidationError extends Error {}
export class DateOfMonthValidationError extends Error {}
export class CadenceValidationError extends Error {}

// Cadences for when the whole digest email goes out. "immediate" is a
// per-writer option only (see models/subscriptions.ts), not a digest schedule.
const DIGEST_CADENCES = ["daily", "weekly", "monthly"];

export async function getAllUsers() {
    const all_users = await db.select().from(users);
    return all_users;
    //const handles = JSON.parse(all_users[0].handles);
}

// Step 1 of signup: checks the users-row fields (the digest schedule) and
// throws on the first problem. Never touches the database. Handles are
// validated separately, per writer, by validateSubscription.
export function validateUser(
    cadence: string,
    time: string,
    day?: string,
    month?: string,
    dateOfMonth?: string,
) {
    if (!DIGEST_CADENCES.includes(cadence.trim().toLowerCase())) {
        throw new CadenceValidationError(
            `Invalid digest cadence. Options: ${DIGEST_CADENCES.join(", ")}`,
        );
    }

    const cleanTime = time.trim();
    const timePattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timePattern.test(cleanTime)) {
        throw new TimeValidationError(
            "Enter the time in 24 hr format - HH:MM.",
        );
    }

    const daysOfWeekMap = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ];

    const monthsOfYear = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    if (cadence.toLowerCase() === "monthly") {
        const monthIndex = monthsOfYear.findIndex(
            (m) => m.toLowerCase() === month?.toLowerCase(),
        );

        if (monthIndex === -1) {
            throw new MonthValidationError("Invalid Month");
        }

        const currentYear = new Date().getFullYear();

        const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();

        if (dateOfMonth !== undefined) {
            if (
                Number(dateOfMonth.trim().slice(0, 2)) < 1 ||
                Number(dateOfMonth.trim().slice(0, 2)) > daysInMonth
            ) {
                throw new DateOfMonthValidationError(
                    `Invalid Date: ${dateOfMonth}`,
                );
            }
        }
    }

    if (
        day &&
        !daysOfWeekMap.some((d) => d.toLowerCase() === day.toLowerCase())
    ) {
        throw new DayValidationError("Invalid day of the week");
    }
}


/*export function insertUserTx(
    tx: Tx,
    email: string,
    handles: string[],
    cadence: string,
    time: string,
    day?: string,
    monht?: string,
    dateOfMonth?: string
) {
    tx.insert(users).values({
        email: email,
        handles: handles,
        cadence: cadence,
        day: day,
        time: time,
        month: monht,
        dateOfMonth: dateOfMonth
    }).run();
}*/

export function insertUserTx(
    tx: Tx,
    email: string,
    handles: string[],
    cadence: string,
    time: string,
    day?: string,
    month?: string,
    dateOfMonth?: string
) {
    tx.insert(users).values({
        email: email,
        handles: handles,
        cadence: cadence,
        time: time,
        day: day,
        month: month,
        dateOfMonth: dateOfMonth
    }).run()
}

export async function getUserByEmail(email: string) {
    //const rows = await db.select({ email: users.email }).from(users);
    const user = await db.select().from(users).where(eq(users.email, email));
    return user;
}

export function deleteUserByEmail(tx: Tx, email: string) {
    //const rows = await db.select({ email: users.email }).from(users);
    return tx.delete(users).where(eq(users.email, email)).run();
}


// Write only, for PUT: replaces the whole schedule on an existing users row.
// Call inside db.transaction((tx) => ...) AFTER validateUser has passed.
// Email is never changed here — it's the Google account identity.
// Empty day/month/dateOfMonth are stored as null so switching e.g. monthly
// -> daily clears the old monthly settings instead of leaving them behind.
// Returns the RunResult; `changes === 0` means no user with that email.
export function updateUserTx(
    tx: Tx,
    email: string,
    handles: string[],
    cadence: string,
    time: string,
    day?: string,
    month?: string,
    dateOfMonth?: string,
) {
    return tx
        .update(users)
        .set({
            handles: handles,
            cadence: cadence,
            time: time,
            day: day || null,
            month: month || null,
            dateOfMonth: dateOfMonth || null,
        })
        .where(eq(users.email, email))
        .run();
}
