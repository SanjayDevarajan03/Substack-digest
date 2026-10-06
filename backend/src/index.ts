//import { feedFetcher } from './services/feedFetcher.js';
import { buildCronExpression } from "./jobs/scheduler.js";
import { type User } from "./jobs/runDigest.js";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { digestBuilder } from "./services/digestBuilder.js";
import { emailSender } from "./services/emailSender.js";
//import { users } from "../db/schema.js";
import { getAllUsers, getUserByEmail, insertUser } from "./models/user.js";

export async function final_pipeline(
    email: string,
    cadence: string,
    day: string,
    time: string,
    month: string,
) {
    const cronJob = await buildCronExpression(cadence, day, time, month, email);
    //console.log(cronJob);
    return cronJob;
}

const rl = readline.createInterface({ input, output });
const email: string = await rl.question(
    "What is the email that you want the digest to be sent to? ",
);

const user = await getUserByEmail(email);
if (!user[0] || user.length === 0) {
    throw new Error("User does not exist");
} else {
    const all_users = await getAllUsers();

    rl.close();
    for (const all_user of all_users) {
        if (user[0].email === all_user.email) {
            const cronJob = await final_pipeline(
                all_user.email,
                all_user.cadence,
                all_user.day ?? "",
                all_user.time,
                all_user.month ?? "",
            );
            if (!cronJob) {
                console.log("Failed to schedule digest");
            }
        }
    }
}

//console.log(cronJob);
//console.log(await digestBuilder(["sanjaydevarajan"], "daily"));

// only for testing, remove this when we do the actual thing
//process.exit(0)
