import cron from "node-cron";
import { runDigestForUser, type User } from "./runDigest";
import { users } from "../db/schema";
import { db } from "../db/client";
import { eq } from "drizzle-orm";
import {
    TimeValidationError,
    DateOfMonthValidationError,
    DayValidationError,
    MonthValidationError,
} from "../models/user";

const activeTasks = new Map<string, ReturnType<typeof cron.schedule>>();

function getDaysInMonth(monthNumber: number, year: number): number {
    return new Date(year, monthNumber, 0).getDate();
}

export async function buildCronExpression(
    email: string,
    cadence: string,
    day: string,
    time: string,
    month: string,
    dateOfMonth: string,
) {
    if (activeTasks.get(email)) {
        activeTasks.get(email)?.stop();
    }
    const result = await db.select().from(users).where(eq(users.email, email));
    const user = result[0];
    if (!user) {
        throw new Error("Invalid user.");
    }
    const cleanTime = time.trim();
    const timePattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timePattern.test(cleanTime)) {
        throw new TimeValidationError(
            "Please enter the time in HH:MM and 24 hr format.",
        );
    }

    const [hours = "", minutes = ""] = cleanTime.split(":");

    const cadence_list = ["daily", "weekly", "monthly"] as const;
    if (
        !cadence_list.includes(
            cadence.toLowerCase() as (typeof cadence_list)[number],
        )
    ) {
        throw new Error(
            "Please enter a valid cadence. Options: [daily, monthly, weekly]",
        );
    }

    const daysOfWeekMap: Record<string, number> = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
    };

    const monthMap: Record<string, number> = {
        January: 1,
        February: 2,
        March: 3,
        April: 4,
        May: 5,
        June: 6,
        July: 7,
        August: 8,
        September: 9,
        October: 10,
        November: 11,
        December: 12,
    };

    if (cadence.toLowerCase() === "daily") {
        const task = cron.schedule(`${minutes} ${hours} * * *`, () => {
            runDigestForUser(
                user.email,
                new Date(Date.now() + 60 * 1000),
            ).catch(console.error);
            //const timestamp = new Date().toISOString();
            //console.log(`[${timestamp}] Cron job executed successfully.`);
        });
        task.start();
        activeTasks.set(email, task);
        return task;
    }

    if (cadence.toLowerCase() === "weekly") {
        if (daysOfWeekMap[day] === undefined) {
            throw new DayValidationError(
                "Please enter a valid day. Options: [Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday]",
            );
        }
        const task = cron.schedule(
            `${minutes} ${hours} * * ${daysOfWeekMap[day]}`,
            () => {
                runDigestForUser(
                    user.email,
                    new Date(Date.now() + 60 * 1000),
                ).catch(console.error);
            },
        );

        task.start();
        activeTasks.set(email, task);
        return task;
    }

    if (cadence.toLowerCase() === "monthly") {
        const formatted_month =
            month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
        const month_number = monthMap[formatted_month];
        if (month_number === undefined) {
            throw new MonthValidationError(
                "Please enter a valid month. Options: [January, February, March, April, May, June, July, August, September, October, November, December]",
            );
        }
        const currentYear: number = new Date().getFullYear();
        const daysInMonth = getDaysInMonth(month_number, currentYear);
        const clean_date = Number(dateOfMonth.trim().slice(0, 2));

        if (
            Number.isNaN(clean_date) ||
            clean_date > daysInMonth ||
            clean_date < 1
        ) {
            throw new DateOfMonthValidationError(
                `Please enter a valid date. ${formatted_month} only has ${daysInMonth} days.`,
            );
        }

        const task = cron.schedule(
            `${minutes} ${hours} ${clean_date} * *`,
            () => {
                const today = new Date();
                const currentDaysInMonth = getDaysInMonth(
                    today.getMonth() + 1,
                    today.getFullYear(),
                );
                const scheduledDay = Math.min(clean_date, currentDaysInMonth);
                if (today.getDate() === scheduledDay) {
                    runDigestForUser(
                        user.email,
                        new Date(Date.now() + 60 * 1000),
                    ).catch(console.error);
                }
            },
        );
        task.start();
        activeTasks.set(email, task);
        return task;
    }
}
console.log("Cron job scheduler initialized...");
