import { summarizer } from "./summarizer.js";
import type { SummaryResult } from "./summarizer.js";

/*export async function digestBuilder(handle: string, cadence: string) {
    let feedData;
    try {
        feedData = await feedFetcher(handle);
    } catch(error) {
        console.error(`digestBuilder: could not build digest for "${handle}" (${cadence}) - feed fetch failed:`, error);
        throw error;
    }
    
    const links = feedData.map((item) => item.link);
    const summarizedArticles = await summarizer(handle);
    const summarizedList: (string | undefined)[][] = [];
    const pubDate = feedData.map((item) => item.pubDate);
    //console.log(pubDate);

    //const rl = readline.createInterface({input, output});
    //const option: string = await rl.question("Which option, do you prefer: Daily, Weekly or Monthly.Please enter the option: ");
    //const time_option = await rl.question("Enter the time you want the digest to be sent: ");

    //const today: string | undefined = new Date().toISOString().split('T')[0];
    const todayDate = new Date();
    const today = todayDate.toISOString().slice(0, 10)
    const oneWeekAgo = new Date(todayDate);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const one_week_ago = oneWeekAgo.toISOString().slice(0, 10);
    //const today_day: string = todayDate.toLocaleDateString('en-US', { weekday: 'long' });
    const formattedPubDates = pubDate
        .filter((date): date is string => date !== undefined)
        .map((date) => {
            const dateObject = new Date(date);
            return dateObject.toISOString().split('T')[0];
        });

    //console.log(formattedPubDates);
      
    if (cadence.toLowerCase() === "daily") {
        for (let i = 0; i < formattedPubDates.length; i++) {
            if (formattedPubDates[i] === today) {
                summarizedList.push([summarizedArticles[i], links[i]]);
            } else {
                continue;
            }
        }
    }

    if (cadence.toLowerCase() === "weekly") {
        for (let i = 0; i < formattedPubDates.length; i++) {
            const pubDateStr = formattedPubDates[i];
            if (pubDateStr && pubDateStr <= today && pubDateStr > one_week_ago) {
                summarizedList.push([summarizedArticles[i], links[i]]);
            }
        }
    }

    if (cadence.toLowerCase() === "monthly") {
        const nextMonthDate = new Date(todayDate);
        nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
        //const nextMonth = nextMonthDate.toISOString().slice(0, 10)
        const todayStr = todayDate.toISOString().slice(0, 10);
        const lastMonthDate = new Date(todayDate);
        lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
        
        // Handle the JavaScript 31st-day edge-case safety check
        if (lastMonthDate.getDate() !== todayDate.getDate()) {
            lastMonthDate.setDate(0); // Rolls back to the last day of the previous month safely
        }
        const lastMonthStr = lastMonthDate.toISOString().slice(0, 10); // "YYYY-MM-DD"

        // 4. Filter the articles published within the last month
        for (let i = 0; i < formattedPubDates.length; i++) {
            const pubDateStr = formattedPubDates[i];
            
            // Check if the article falls between [One Month Ago] and [Today]
            if (pubDateStr && pubDateStr >= lastMonthStr && pubDateStr <= todayStr) {
                summarizedList.push([summarizedArticles[i], links[i]]);
            }
        }
    }
    return summarizedList;
}*/

export async function digestBuilder(
    handles: string[] = [],
    cadence: string,
): Promise<SummaryResult[]> {
    if (!cadence || cadence === "") {
        console.log("Please enter a cadence.");
        return [];
    }
    const allSummarized: SummaryResult[] = [];

    const todayDate = new Date();
    const today = todayDate.toISOString().slice(0, 10);

    const oneWeekAgo = new Date(todayDate);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const one_week_ago = oneWeekAgo.toISOString().slice(0, 10);

    const lastMonthDate = new Date(todayDate);
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
    // Handle the JavaScript 31st-day edge-case safety check
    if (lastMonthDate.getDate() !== todayDate.getDate()) {
        lastMonthDate.setDate(0); // Rolls back to the last day of the previous month safely
    }
    const lastMonthStr = lastMonthDate.toISOString().slice(0, 10);

    for (const handle of handles) {
        // summarizer already threads link/pubDate/summary through from
        // getAllArticles, so no separate feedFetcher call is needed here.
        const summarizedArticles = await summarizer(handle);

        for (const article of summarizedArticles) {
            if (!article.pubDate) continue;
            const pubDateStr = new Date(article.pubDate)
                .toISOString()
                .slice(0, 10);

            if (cadence.toLowerCase() === "daily" && pubDateStr === today) {
                allSummarized.push(article);
            } else if (
                cadence.toLowerCase() === "weekly" &&
                pubDateStr <= today &&
                pubDateStr > one_week_ago
            ) {
                allSummarized.push(article);
            } else if (
                cadence.toLowerCase() === "monthly" &&
                pubDateStr >= lastMonthStr &&
                pubDateStr <= today
            ) {
                allSummarized.push(article);
            }
        }
    }

    return allSummarized;
}

//const currentDate: string | undefined = new Date().toISOString().split('T')[0];
//console.log(await digestBuilder([""], "daily")); // Output: "2026-08-21"

//console.timeEnd("PerformanceTimer");
