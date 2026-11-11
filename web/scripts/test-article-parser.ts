import { getArticleContent } from "../src/services/articleParser";

async function main() {
    const content = await getArticleContent(
        "https://demishassabis.substack.com/p/a-framework-for-frontier-ai-and-the-dawning-of-a-new-age",
    );
    console.log("Content length:", content?.length);
    console.log("First 300 chars:", content?.slice(0, 300));
}

main().catch(console.error);
