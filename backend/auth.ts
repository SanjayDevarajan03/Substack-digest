/*import fs from "fs/promises";
import path from "path";
import { authenticate } from "@google-cloud/local-auth";

const SCOPES = ["https://www.googleapis.com/auth/gmail.send"];
const CREDENTIALS_PATH = path.join(process.cwd(), "client_secret_672796307658-df7bvrsfhje76u7b1539ji6kiun25qu5.apps.googleusercontent.com.json")
const TOKEN_PATH = path.join(process.cwd(), "token.json");

async function saveToken(refreshToken: string) {
    const content = await fs.readFile(CREDENTIALS_PATH,  "utf8");
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;

    const payload = JSON.stringify({
        type: "authorized_user",
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: refreshToken,
    });

    await fs.writeFile(TOKEN_PATH, payload);
    console.log(`Token saved to ${TOKEN_PATH}`);
}


async function main() {
    const client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH
    });

    if (!client.credentials.refresh_token) {
        console.error(
            "No refresh token received. Revoke access at https://myaccount.google.com/permissions and run this script again."
        );
        return;
    }

    await saveToken(client.credentials.refresh_token);
    console.log("Authorization complete.");
}

main().catch(console.error);*/



import fs from "fs/promises";
import path from "path";
import { authenticate } from "@google-cloud/local-auth";

const SCOPES = ["https://www.googleapis.com/auth/gmail.send"];
const CREDENTIALS_PATH = path.join(process.cwd(), "client_secret_672796307658-df7bvrsfhje76u7b1539ji6kiun25qu5.apps.googleusercontent.com.json")
const TOKEN_PATH = path.join(process.cwd(), "token.json");

async function saveToken(refreshToken: string) {
    const content = await fs.readFile(CREDENTIALS_PATH, "utf8");
    const keys = JSON.parse(content);
    const key = keys.installed ||keys.web;

    const payload = JSON.stringify({
        type: "authorized_user",
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: refreshToken
    })

    await fs.writeFile(TOKEN_PATH, payload);
    console.log(`Token saved to ${TOKEN_PATH}`);
}

async function main() {
    const client = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH
    });

    if (!client.credentials.refresh_token) {
        console.error(
            "No refresh token received. Revoke access at https://myaccount.google.com/permissions and run this script again."
        );
        return;
    }

    await saveToken(client.credentials.refresh_token);
    console.log("Authorization complete.");
}

main().catch(console.error);


