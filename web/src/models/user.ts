import { users } from "../db/schema";
import { db } from "../db/client";
import { eq } from "drizzle-orm";
import { isValidHandle } from "../services/feedFetcher";

export class TimeValidationError extends Error {}
export class HandleValidationError extends Error {}
export class DayValidationError extends Error {}
export class MonthValidationError extends Error {}
export class DateOfMonthValidationError extends Error {}

export async function getAllUsers() {
    const all_users = await db.select().from(users);
    return all_users;
    //const handles = JSON.parse(all_users[0].handles);
}

export async function insertUser(
    email: string,
    handles: string[],
    cadence: string,
    time: string,
    day?: string,
    month?: string,
    dateOfMonth?: string,
) {
    for (const handle of handles) {
        if (!(await isValidHandle(handle))) {
            throw new HandleValidationError(`Invalid handle: ${handle}`);
        }
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

    await db.insert(users).values({
        email: email,
        handles: handles,
        cadence: cadence,
        day: day,
        time: time,
        month: month,
        dateOfMonth: dateOfMonth,
    });
}

export async function getUserByEmail(email: string) {
    //const rows = await db.select({ email: users.email }).from(users);
    const user = await db.select().from(users).where(eq(users.email, email));
    return user;
}

export async function deleteUserByEmail(email: string) {
    //const rows = await db.select({ email: users.email }).from(users);
    const result = await db.delete(users).where(eq(users.email, email));
    return result;
}

// Shared by PUT (route validates every field is present first, so this ends
// up setting all of them) and PATCH (only whichever fields were sent get
// included) — one atomic update either way.
export async function updateAll(
    oldEmail: string,
    newEmail?: string,
    updatedHandles?: string[],
    updatedCadence?: string,
    updatedTime?: string,
    updatedDay?: string,
    updatedMonth?: string,
    updatedDateOfMonth?: string,
) {
    //const user = await db.select().from(users).where(eq(users.email, oldEmail));

    if (updatedHandles !== undefined) {
        for (const handle of updatedHandles) {
            if (!(await isValidHandle(handle))) {
                throw new HandleValidationError(`Invalid handle: ${handle}`);
            }
        }
    }

    if (updatedTime !== undefined) {
        const cleanTime = updatedTime.trim();
        const timePattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timePattern.test(cleanTime)) {
            throw new TimeValidationError(
                "Enter the time in 24 hr format - HH:MM.",
            );
        }
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

    if (
        updatedDay &&
        !daysOfWeekMap.some(
            (day) => day.toLowerCase() === updatedDay.toLowerCase(),
        )
    ) {
        throw new DayValidationError("Invalid day of the week");
    }

    if (
        updatedCadence !== undefined &&
        updatedCadence.toLowerCase() === "monthly"
    ) {
        const monthIndex = monthsOfYear.findIndex(
            (m) => m.toLowerCase() === updatedMonth?.toLowerCase(),
        );

        if (monthIndex === -1) {
            throw new MonthValidationError("Invalid Month");
        }

        const currentYear = new Date().getFullYear();
        const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();

        if (updatedDateOfMonth !== undefined) {
            if (
                Number(updatedDateOfMonth.trim().slice(0, 2)) < 1 ||
                Number(updatedDateOfMonth.trim().slice(0, 2)) > daysInMonth
            ) {
                throw new DateOfMonthValidationError(
                    `Invalid Date: ${updatedDateOfMonth}`,
                );
            }
        }
    }

    const result = await db
        .update(users)
        .set({
            ...(newEmail !== undefined && { email: newEmail }),
            ...(updatedHandles !== undefined && { handles: updatedHandles }),
            ...(updatedCadence !== undefined && { cadence: updatedCadence }),
            ...(updatedTime !== undefined && { time: updatedTime }),
            ...(updatedDay !== undefined && { day: updatedDay }),
            ...(updatedMonth !== undefined && { month: updatedMonth }),
            ...(updatedDateOfMonth !== undefined &&
                updatedDateOfMonth !== "" && {
                    dateOfMonth: updatedDateOfMonth,
                }),
        })
        .where(eq(users.email, oldEmail));

    return result;
}
