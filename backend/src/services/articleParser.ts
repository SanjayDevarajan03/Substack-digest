import { feedFetcher } from "./feedFetcher.js";
import * as cheerio from "cheerio";

const ARTIICLE_FETCH_TIMEOUT_MS = 15000;

/*async function main(handle: string) {
    const feedData = await feedFetcher(handle)

    return feedData;
}*/

export interface ArticleResult {
    link: string;
    pubDate: string | undefined;
    content: string | undefined;
}

async function getHTML(url: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(
        () => controller.abort(),
        ARTIICLE_FETCH_TIMEOUT_MS,
    );
    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
            },
            signal: controller.signal,
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.text();
    } finally {
        clearTimeout(timeout);
    }
}

// Fetches and extracts a single article's body text. Failures here (dead
// link, timeout, unexpected page shape) are caught and logged rather than
// thrown, so one bad article doesn't take down the whole batch it's in.
export async function getArticleContent(
    post_link: string | undefined,
): Promise<string | undefined> {
    if (!post_link) {
        console.log("Post link not available.");
        return;
    }

    try {
        const html = await getHTML(post_link);
        const $ = cheerio.load(html);

        let preloads: any;

        $("script").each((_, el) => {
            const js = $(el).html();
            const match =
                js && js.match(/window\._preloads\s*=\s*JSON\.parse\("(.+)"\)/);
            if (match) {
                preloads = JSON.parse(JSON.parse(`"${match[1]}"`));
            }
        });

        if (!preloads) {
            console.log(`Could not find preloads data on ${post_link}`);
            return;
        }

        const post = preloads.post;
        const $body = cheerio.load(post.body_html);

        if (post.audience === "everyone") {
            return $body.text();
        } else {
            return "";
        }
    } catch (error) {
        console.error(`Failed to fetch/parse article at ${post_link}:`, error);
        return;
    }
}

async function batch_links<T>(items: T[] | undefined): Promise<T[][]> {
    const linklist: T[][] = [];
    const batch: T[] = [];
    if (!items) {
        return linklist;
    }

    for (const item of items) {
        batch.push(item);
        if (batch.length % 3 === 0) {
            linklist.push(batch.slice());
            batch.length = 0;
        }
    }

    if (batch.length > 0) {
        linklist.push(batch.slice());
    }

    return linklist;
}

export async function getAllArticles(
    handles: string[] = [],
): Promise<ArticleResult[]> {
    const feedData = await feedFetcher(handles);
    // Keep link + pubDate paired together (instead of extracting a bare
    // links array) so both survive alongside the fetched content below —
    // downstream callers (summarizer, digestBuilder) need all three and
    // shouldn't have to re-fetch the feed just to get pubDate/link back.
    const linkedItems = feedData.flatMap((item) =>
        item.link ? [{ link: item.link, pubDate: item.pubDate }] : [],
    );

    const batches = await batch_links(linkedItems);

    const allArticles: ArticleResult[] = [];
    for (const batch of batches) {
        const batchResults = await Promise.all(
            batch.map(async ({ link, pubDate }) => {
                const content = await getArticleContent(link);
                return { link, pubDate, content };
            }),
        );
        allArticles.push(...batchResults);
    }
    return allArticles;
}

/*console.log(
    await getAllArticles([
        "sanjaydevarajan",
        "alexw",
        "demishassabis",
        "hubermanlab",
        "thedankoe",
    ]),
);*/
