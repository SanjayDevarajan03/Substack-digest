import { summarizeArticles } from "./summarizer";
import type { SummaryResult } from "./summarizer";
import { getAllArticles } from "./articleParser";

export async function digestBuilder(
    handles: string[] = [],
    cadence: string,
): Promise<SummaryResult[]> {
    if (!cadence || cadence === "") {
        console.log("Please enter a cadence.");
        return [];
    }

    const todayDate = new Date();

    // Fetch raw articles (cheap — RSS + scrape, no Groq calls yet) and
    // filter by cadence BEFORE summarizing, so Groq is only ever called on
    // articles that will actually end up in the digest.
    const articles = await getAllArticles(handles);
    console.log(articles.length);
    console.log('Handles', handles);

    const matchingArticles = articles.filter((article) => {
        if (!article.pubDate) return false;
        // Pass the real timestamp through untouched — weekly/monthly need
        // full time precision for their rolling windows, and daily derives
        // its own calendar date from this via toDateString() internally.
        return matchesCadence(article.pubDate, cadence, todayDate);
    });
    console.log(matchingArticles.length);
    console.log(matchingArticles.map((a) => a.pubDate));
    return await summarizeArticles(matchingArticles);
}

export function matchesCadence(
    pubDate: string,
    cadence: string,
    today: Date,
): boolean {
    // the same date-string-building + if/else logic that's currently inline
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const lastMonthDate = new Date(today);
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
    // Handle the JavaScript 31st-day edge-case safety check
    if (lastMonthDate.getDate() !== today.getDate()) {
        lastMonthDate.setDate(0); // Rolls back to the last day of the previous month safely
    }

    const newpubDate1 = new Date(pubDate);
    if (cadence.toLowerCase() === "daily") {
        return newpubDate1.toDateString() === today.toDateString();
    }
    if (cadence.toLowerCase() === "weekly") {
        return newpubDate1 > oneWeekAgo && newpubDate1 <= today;
    }
    if (cadence.toLowerCase() === "monthly") {
        return newpubDate1 >= lastMonthDate && newpubDate1 <= today;
    }
    return false;
}
