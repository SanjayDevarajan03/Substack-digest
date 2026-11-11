//import { Resend } from 'resend';
import { digestBuilder } from "./digestBuilder";
import { isValidHandle } from "./feedFetcher";
import DigestEmail from "../emails/DigestEmail";
import { createElement } from "react";
import { render } from "@react-email/render";
import { google, Auth } from "googleapis";
import path from "path";
import fs from "fs/promises";

//const resend = new Resend(process.env.RESEND_API_KEY);
//const CREDENTIALS_PATH = path.join(process.cwd(), "client_secret_672796307658-df7bvrsfhje76u7b1539ji6kiun25qu5.apps.googleusercontent.com.json")
//const content = await fs.readFile(CREDENTIALS_PATH, "utf8");
//const token = JSON.parse(content);
const TOKEN_PATH = path.join(process.cwd(), "token.json");
//const auth_client

async function loadAuthClient() {
    const content = await fs.readFile(TOKEN_PATH, "utf8");
    const credentials = JSON.parse(content);
    return new Auth.UserRefreshClient({
        clientId: credentials.client_id,
        clientSecret: credentials.client_secret,
        refreshToken: credentials.refresh_token,
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
