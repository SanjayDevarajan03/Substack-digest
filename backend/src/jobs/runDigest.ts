import { emailSender } from "../services/emailSender.js";
import { users } from "../db/schema.js";
import { db } from "../db/client.js";
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
    if (!user.email || !user.handles || user.handles.length === 0) {
        console.log("Incomplete user settings, skipping digest.");
        return;
    }

    try {
        await emailSender(
            user.email,
            user.handles,
            user.cadence,
            scheduledDate,
        );
    } catch (error) {
        console.error(
            `runDigestForUser: digest run failed for ${user.email} (${user.handles}):`,
            error,
        );
    }
}
