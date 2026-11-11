import "dotenv/config";
import { emailSender } from "../src/services/emailSender";

async function main() {
    await emailSender(
        "sanjay.devarajan3@gmail.com",
        ["alexw", "hubermanlab"],
        "monthly",
        new Date(Date.now() + 120 * 1000),
    );
}

main().catch(console.error);
