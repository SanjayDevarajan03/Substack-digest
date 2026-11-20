import { emailSender } from "../services/emailSender";
import { users } from "../db/schema";
import { db } from "../db/client";
import { eq } from "drizzle-orm";

export interface User {
    email: string | undefined;
    handles: string[] | undefined;
}

export async function runDigestForUser(email: string, scheduledDate: Date) {
    const result = await db.select().from(users).where(eq(users.email, email));
    const user = result[0];
    if (!user) {
        console.log("Invalid user.");
        return;
    }

    try {
        await emailSender(user.email, user.cadence, scheduledDate);
    } catch (error) {
        console.error(
            `runDigestForUser: digest run failed for ${user.email}`,
            error,
        );
    }
}
