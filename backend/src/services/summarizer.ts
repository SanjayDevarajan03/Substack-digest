import { getAllArticles } from "./articleParser.js";
import Groq from "groq-sdk";
import "dotenv/config";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface SummaryResult {
    link: string;
    pubDate: string | undefined;
    summary: string;
}

export async function summarizer(handle: string): Promise<SummaryResult[]> {
    const articles = await getAllArticles([handle]);

    // Pre-size to articles.length (carrying link/pubDate through immediately)
    // so a skipped article leaves its original index intact instead of
    // shrinking/shifting the array, which would misalign results.
    const finalSummaries: SummaryResult[] = articles.map((article) => ({
        link: article.link,
        pubDate: article.pubDate,
        summary: "",
    }));

    const indexedArticles: { index: number; content: string }[] = [];
    articles.forEach((article, index) => {
        if (article.content === undefined) {
            console.log("Invalid article. Skipping!");
            return;
        }
        indexedArticles.push({ index, content: article.content });
    });

    const chunkSize = 3;
    for (let i = 0; i < indexedArticles.length; i += chunkSize) {
        const chunk = indexedArticles.slice(i, i + chunkSize);
        const results = await Promise.all(
            chunk.map(async ({ index, content }) => {
                const response = await summaryWithRetry(content);
                return {
                    index,
                    summary: response?.choices[0]?.message?.content ?? "",
                };
            }),
        );

        results.forEach(({ index, summary }) => {
            const entry = finalSummaries[index];
            if (entry) {
                entry.summary = summary;
            }
        });

        // Pause between batches so Groq is not hit with too many requests at once
        await delay(100);
    }
    return finalSummaries;
}

async function summaryWithRetry(article: string | undefined) {
    let attempts: number = 0;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
        try {
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    {
                        role: "user",
                        content: `Summarize the following article in 3 lines or less:\n\n${article}`,
                    },
                ],
                model: "openai/gpt-oss-120b",
            });
            return chatCompletion;
        } catch (error) {
            attempts++;
            console.error(`Attempt ${attempts}/${maxAttempts} failed.`);
            if (error instanceof Groq.APIError) {
                if (error.status === 429) {
                    console.error("Rate Limit hit! Too many requests.");
                    console.log(
                        `Retry after: ${error.headers?.["retry-after"]} seconds`,
                    );
                    await delay(
                        Number(error.headers?.["retry-after"] ?? 5) * 1000,
                    );
                    continue;
                }
                if (error.status !== undefined && error.status < 500) {
                    // Non-retryable client error (bad request, auth, etc.) — retrying won't help.
                    console.error(
                        `Non-retryable API error (status ${error.status}), giving up on this article.`,
                    );
                    break;
                }
            }
            // Fallback for non-API errors (network blips, timeouts) — just retry.
            console.error("Unexpected error:", error);
        }
    }
    console.error(
        `Failed to summarize article after ${attempts} attempt(s); marking as skipped.`,
    );
    return undefined;
}
