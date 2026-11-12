//import { Resend } from 'resend';
import { digestBuilder } from "./digestBuilder";
import { isValidHandle } from "./feedFetcher";
import DigestEmail from "../emails/DigestEmail";
import { createElement } from "react";
import { render } from "@react-email/render";
import { google, Auth } from "googleapis";

async function loadAuthClient() {
    return new Auth.UserRefreshClient({
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
    });
}

export async function emailSender(
    email: string,
    handles: string[] = [],
    cadence: string,
    scheduledDate: Date,
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

    //const input_rl = readline.createInterface({input, output});
    //const handle: string = await input_rl.question("Enter the handles from which you want the digest?")
    for (const handle of handles) {
        const valid_handle = await isValidHandle(handle);
        if (valid_handle === false) {
            console.log(`${handle} is invalid. Please enter a valid handle`);
            continue;
        }
    }

    let articles;
    try {
        articles = await digestBuilder(handles, cadence);
    } catch (error) {
        console.error(
            `emailSender: skipping send to ${email} - failed to build digest for "${handles}":`,
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
        "Subject: Substack Digest",
        "Content-Type: text/html; charset=utf-8",
        "",
        htmlBody,
    ].join("\r\n");

    const encodedEmail = Buffer.from(rawMessage).toString("base64url");

    const auth = await loadAuthClient();
    const gmail = google.gmail({ version: "v1", auth });

    const response = await gmail.users.messages.send({
        userId: "me",
        requestBody: { raw: encodedEmail },
    });
    console.log("Email sent:", response.data.id);
}
