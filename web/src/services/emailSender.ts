//import { Resend } from 'resend';
import { digestBuilder } from "./digestBuilder";
import DigestEmail from "../emails/DigestEmail";
import { createElement } from "react";
import { render } from "@react-email/render";
import { google, Auth } from "googleapis";
import { subscriptions } from "../db/schema";
import { db } from "../db/client";
import { and, eq } from "drizzle-orm";

async function loadAuthClient() {
    return new Auth.UserRefreshClient({
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
    });
}

export async function emailSender(
    email: string,
    cadence: string,
    scheduledDate: Date
) {
    const today = new Date();
    if (Number.isNaN(scheduledDate.getTime()) || scheduledDate <= today) {
        console.log("Please enter a valid date");
        return;
    }

    if (!email.includes("@")) {
        console.log("Invalid email");
        return;
    }

    
    // Handles are validated when a subscription is saved (models/subscripitions.ts)
    // and digestBuilder reads them from the subscriptions table itself.
    let articles;
    try {
        articles = await digestBuilder(email, cadence);
    } catch (error) {
        console.error(
            `emailSender: skipping send to ${email} - failed to build digest`,
            error,
        );
        return;
    }

    if (articles.length === 0) {
        console.log("No published posts from the creators.");
        return;
    }

    const htmlBody = await render(createElement(DigestEmail, { articles }));

    const rawMessage = [
        `To: ${email}`,
        "Subject: Readloop Digest",
        "Content-Type: text/html; charset=utf-8",
        "",
        htmlBody,
    ].join("\r\n");

    const encodedEmail = Buffer.from(rawMessage).toString("base64url");

    const auth = await loadAuthClient();
    const gmail = google.gmail({ version: "v1", auth });

    const response = await gmail.users.messages.send({
        userId: "me",
        requestBody: { raw: encodedEmail } ,
    });
    if (response.data.id) {
        const sentMessage = await gmail.users.messages.get({
            userId: "me",
            id: response.data.id,
            format: "minimal"
        })
    
        const sentAt = new Date(Number(sentMessage.data.internalDate));
        const handles = await db
        .select({ handle: subscriptions.handle })
        .from(subscriptions)
        .where(eq(subscriptions.userEmail, email));
        for (const { handle } of handles) {
            await db
            .update(subscriptions)
            .set({ lastSentAt: sentAt })
            .where(
                and(
                    eq(subscriptions.userEmail, email),
                    eq(subscriptions.cadence, cadence),
                    eq(subscriptions.handle, handle)
                )
            );
        }
       
    }
    console.log("Email sent:", response.data.id);
}
