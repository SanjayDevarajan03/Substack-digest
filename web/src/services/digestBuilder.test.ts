import { describe, it, expect } from "vitest";
import { matchesCadence } from "./digestBuilder";

// "today" is built the same way production code builds it — new Date(),
// never a parsed string — and pubDate uses the real RFC 2822 format
// rss-parser actually returns (e.g. "Fri, 30 Oct 2026 12:00:00 GMT"),
// not a bare "YYYY-MM-DD" string, so these tests exercise real time
// precision instead of accidentally-matching date-only arithmetic.
describe("matchesCadence", () => {
    const today = new Date(2026, 9, 30, 12, 0, 0); // Oct 30 2026, local noon

    // daily
    it("does the expected thing for valid input.", () => {
        const pubDate = "Fri, 30 Oct 2026 12:00:00 GMT";
        const result = matchesCadence(pubDate, "daily", today);
        const expectedOutput = true;
        expect(result).toBe(expectedOutput);
    });

    it("rejects invalid input", () => {
        const pubDate = "Wed, 28 Oct 2026 12:00:00 GMT";
        const result = matchesCadence(pubDate, "daily", today);
        expect(result).toBe(false);
    });

    // weekly
    it("does the expected thing for valid input.", () => {
        const pubDate = "Wed, 28 Oct 2026 12:00:00 GMT";
        const result = matchesCadence(pubDate, "weekly", today);
        const expectedOutput = true;
        expect(result).toBe(expectedOutput);
    });

    // Past the 7-day threshold
    it("rejects a date past the 7-day window", () => {
        const pubDate = "Wed, 21 Oct 2026 12:00:00 GMT";
        const result = matchesCadence(pubDate, "weekly", today);
        expect(result).toBe(false);
    });

    // Future-case
    it("Rejects a future publishing date", () => {
        const pubDate = "Sat, 31 Oct 2026 12:00:00 GMT";
        const result = matchesCadence(pubDate, "weekly", today);
        expect(result).toBe(false);
    });

    // monthly
    it("does the expected thing for valid input.", () => {
        const pubDate = "Fri, 09 Oct 2026 12:00:00 GMT";
        const result = matchesCadence(pubDate, "monthly", today);
        const expectedOutput = true;
        expect(result).toBe(expectedOutput);
    });

    it("rejects a date past the 1-month window", () => {
        const pubDate = "Mon, 21 Sep 2026 12:00:00 GMT";
        const result = matchesCadence(pubDate, "monthly", today);
        expect(result).toBe(false);
    });

    it("Rejects a future publishing date", () => {
        const pubDate = "Sat, 21 Nov 2026 12:00:00 GMT";
        const result = matchesCadence(pubDate, "monthly", today);
        expect(result).toBe(false);
    });
});
