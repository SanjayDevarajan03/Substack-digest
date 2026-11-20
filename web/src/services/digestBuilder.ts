import { summarizeArticles } from "./summarizer";
import { getAllArticles } from "./articleParser";
import { subscriptions, users } from "../db/schema";
import { db } from "../db/client";
import type { ArticleResult } from "./articleParser";
import { eq } from "drizzle-orm";
import type { SummaryResult } from "./summarizer";


export async function digestBuilder(
    email: string, cadence: string
): Promise<SummaryResult[]> {
    const todayDate = new Date();
    const result: ArticleResult[] = [];
    const rows = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userEmail, email));

    // Fetch raw articles (cheap — RSS + scrape, no Groq calls yet) and
    // filter by each subscription's own cadence BEFORE summarizing, so Groq
    // is only ever called on articles that will actually end up in the digest.
    for (const subscription of rows) {
        const articles = await getAllArticles(subscription.handle, cadence);
        const matchingArticles = articles.filter(
            (article) =>
                article.pubDate &&
                matchesCadence(article.pubDate, subscription.cadence,todayDate, subscription.lastSentAt),
        );
        result.push(...matchingArticles);
    }
    return await summarizeArticles(result);
}

export function matchesCadence(
    pubDate: string,
    cadence: string,
    today: Date,
    lastSentAt: Date | null
) {
    if (!pubDate) {
        throw new Error("Invalid publishing date");
    }
    // the same date-string-building + if/else logic that's currently inline
    const oneDayAgo = new Date(today);
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const lastMonthDate = new Date(today);
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
    // Handle the JavaScript 31st-day edge-case safety check
    if (lastMonthDate.getDate() !== today.getDate()) {
        lastMonthDate.setDate(0); // Rolls back to the last day of the previous month safely
    }

    const newpubDate1 = new Date(pubDate);
    //const pubDateMs = newpubDate1 instanceof Date ? newpubDate1.getTime() : newpubDate1
    if (lastSentAt) {
        if (cadence.trim().toLowerCase() === "daily" || cadence.trim().toLowerCase() === "weekly" || cadence.trim().toLowerCase() === "monthly") {
            return newpubDate1 > lastSentAt && newpubDate1 <= today;
        }
    } else {
        if (cadence.trim().toLowerCase() === "daily") {
            return newpubDate1 > oneDayAgo && newpubDate1 <= today;
        }
        if (cadence.trim().toLowerCase() === "weekly") {
            return newpubDate1 > oneWeekAgo && newpubDate1 <= today;
        }
        if (cadence.trim().toLowerCase() === "monthly") {
            return newpubDate1 >= lastMonthDate && newpubDate1 <= today;
        }
        return false;
    }
    return false;
}


/*const today  = new Date();
console.log(await matchesCadence("sanjay.devarajana02@gmail.com", "November 13th 2026","monthly", today))*/

/*const rows = await db
        .select()
        .from(users)
        .where(eq(users.email, "sanjay.devarajan02@gmail.com"));


const rows1 = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userEmail, "sanjay.devarajan02@gmail.com"));


for (const row1 of rows1) {
    console.log(row1);
}

for (const row of rows) {
    console.log(row);
}*/