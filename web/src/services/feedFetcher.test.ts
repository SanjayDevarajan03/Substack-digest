import { describe, it, expect } from "vitest";
import { getFeedUrl, handleFormatCheck } from "./feedFetcher";

describe("getFeedUrl", () => {
    it("does the expected thing for valid input", () => {
        const result = getFeedUrl("sanjaydevarajan");
        const expectedOutput = "https://sanjaydevarajan.substack.com/feed";
        expect(result).toBe(expectedOutput);
    });

    it("rejects invalid input", () => {
        expect(() => getFeedUrl("")).toThrow();
    });
});

describe("handleFormatCheck", () => {
    it("does the expected thing for valid input", () => {
        const result = handleFormatCheck("SaNJAYDevarajan");
        const expectedOutput = true;
        expect(result).toBe(expectedOutput);
    });

    it("rejects invalid input", () => {
        const result = handleFormatCheck("#((D#D#D");
        expect(result).toBe(false);
    });
});
