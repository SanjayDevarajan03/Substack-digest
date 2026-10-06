import Parser from "rss-parser";

// Initializing the parser
//const parser = new Parser({ timeout: 15000 });

const parser = new Parser({ timeout: 15000 });

/*export class FeedFetcherError extends Error {
    constructor(public readonly handle: string, cause: unknown) {
        super(`Failed to fetch/parse feed for handle "${handle}"): ${cause instanceof Error ? cause.message: String(cause)}`);
        this.name;
    }
}*/

/*export class FeedFetcherError extends Error {
    constructor(public readonly handle: string, cause: unknown) {
        super(`Failed to fetch/parse feed for handle "${handle}"): ${cause instanceof Error ? cause.message: String(cause)}`);
        this.name = 'FeedFetchError';
    }
}*/

export class FeedFetcherError extends Error {
    constructor(
        public readonly handle: string,
        cause: unknown,
    ) {
        super(
            `Failed to fetch/parse feed for handle "${handle}"): ${cause instanceof Error ? cause.message : String(cause)}`,
        );
    }
}

interface FeedItem {
    handle: string | undefined;
    title: string | undefined;
    link: string | undefined;
    pubDate: string | undefined;
    content: string | undefined;
}

// this just gets the feedurl
export function getFeedUrl(handle: string): string {
    //const username = handle.trim().replace("/^@/", "")
    const username = handle.trim().replace(/^@/, "");
    if (!username) {
        throw new Error("Invalid substack handle");
    }
    const feedUrl = `https://${username}.substack.com/feed`;
    return feedUrl;
}

function handleFormatCheck(handle: string): boolean {
    const username = handle.trim().replace(/^@/, "").toLowerCase();

    // lowercase letters, digits, hyphens; can't start or end with a hyphen
    const validHandlePattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

    return validHandlePattern.test(username);
}

async function checkExistence(handle: string) {
    try {
        const feedUrl = getFeedUrl(handle);
        const response = await fetch(feedUrl);
        return response.status;
    } catch (error) {
        console.log("Invalid handle:", error);
        return;
    }
}

export async function isValidHandle(handle: string): Promise<boolean> {
    if (!handleFormatCheck(handle)) {
        return false;
    }

    const handle_status = await checkExistence(handle);

    if (handle_status === undefined) {
        return false;
    }
    return handle_status >= 200 && handle_status < 300;
}

// Throws FeedFetchError on failure instead of swallowing it, so callers can
// tell "feed fetched but has no new articles" (empty array) apart from
// "couldn't fetch the feed at all" (and log/report that distinctly).
export async function feedFetcher(handles: string[] = []): Promise<FeedItem[]> {
    const allFeedItems: FeedItem[] = [];
    for (const handle of handles) {
        if (!handle) {
            console.log("No handle.");
            continue;
        }
        try {
            const feed = await parser.parseURL(getFeedUrl(handle));
            const feedItems: FeedItem[] = feed.items.map((item) => ({
                handle: handle,
                title: item.title,
                link: item.link,
                pubDate: item.pubDate,
                content: item.content,
            }));
            allFeedItems.push(...feedItems);
        } catch (error) {
            console.log(handle, error);
            continue;
        }
    }
    return allFeedItems;
}
//console.log(await feedFetcher(["sanjaydevarajan", "alexw"]));
