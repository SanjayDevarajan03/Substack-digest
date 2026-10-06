import cron from "node-cron";
import { runDigestForUser, type User } from "./runDigest.js";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { users } from "../db/schema.js";
import { db } from "../db/client.js";
import { eq } from "drizzle-orm";

function getDaysInMonth(monthNumber: number, year: number): number {
    return new Date(year, monthNumber, 0).getDate();
}

export async function buildCronExpression(
    cadence: string,
    day: string,
    time: string,
    month: string,
    email: string,
) {
    const result = await db.select().from(users).where(eq(users.email, email));
    const user = result[0];
    if (!user) {
        console.log("Invalid user.");
        return;
    }
    const cleanTime = time.trim();
    const timePattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timePattern.test(cleanTime)) {
        console.log("Please enter the time in HH:MM and 24 hr format.");
        return;
    }

    const [hours = "", minutes = ""] = cleanTime.split(":");

    const cadence_list = ["daily", "weekly", "monthly"] as const;
    if (
        !cadence_list.includes(
            cadence.toLowerCase() as (typeof cadence_list)[number],
        )
    ) {
        console.log(
            "Please enter a valid cadence. Options: [daily, monthly, weekly]",
        );
        return;
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

    //const date = parse(`${time}`, "h:mm A");
    //const timestamp_hour = date.getHours();
    //const timestamp_minute = date.getMinutes();

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
        return task;
    }

    if (cadence.toLowerCase() === "weekly") {
        if (daysOfWeekMap[day] === undefined) {
            console.log(
                "Please enter a valid day. Options: [Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday]",
            );
            return;
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
        return task;
    }

    if (cadence.toLowerCase() === "monthly") {
        const formatted_month =
            month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
        const month_number = monthMap[formatted_month];
        if (month_number === undefined) {
            console.log(
                "Please enter a valid month. Options: [January, February, March, April, May, June, July, August, September, October, November, December]",
            );
            return;
        }
        const currentYear: number = new Date().getFullYear();
        const daysInMonth = getDaysInMonth(month_number, currentYear);

        const rl = readline.createInterface({ input, output });
        const timestamp_date: string = await rl.question(
            "Please enter the date when you want to receive the digest every month?",
        );
        const clean_date = Number(timestamp_date.trim().slice(0, 2));

        if (clean_date > daysInMonth) {
            console.log(
                `Please enter a valid date. ${formatted_month} only has ${daysInMonth} days.`,
            );
            return;
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
        return task;
    }
}
console.log("Cron job scheduler initialized...");
