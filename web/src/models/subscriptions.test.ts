import { describe, it, expect, vi } from "vitest";

// subscriptions.ts imports the real db client (which opens data/digest.db)
// and feedFetcher (network) at module load — stub both; diffSubscriptions
// itself is pure and uses neither.
vi.mock("../db/client", () => ({ db: {} }));
vi.mock("../services/feedFetcher", () => ({ isValidHandle: vi.fn() }));

import { diffSubscriptions } from "./subscriptions";

describe("diffSubscriptions", () => {
    const current = [
        { handle: "stratechery", cadence: "daily" },
        { handle: "platformer", cadence: "weekly" },
    ];

    it("returns nothing to do when nothing changed", () => {
        expect(diffSubscriptions(current, current)).toEqual({
            toRemove: [],
            toAdd: [],
            toChange: [],
        });
    });

    it("adds a new writer without touching existing ones", () => {
        const incoming = [...current, { handle: "noahpinion", cadence: "daily" }];
        expect(diffSubscriptions(current, incoming)).toEqual({
            toRemove: [],
            toAdd: [{ handle: "noahpinion", cadence: "daily" }],
            toChange: [],
        });
    });

    it("removes a writer that's no longer in the list", () => {
        const incoming = [{ handle: "stratechery", cadence: "daily" }];
        expect(diffSubscriptions(current, incoming)).toEqual({
            toRemove: [{ handle: "platformer", cadence: "weekly" }],
            toAdd: [],
            toChange: [],
        });
    });

    it("changes only the cadence of a writer kept in the list", () => {
        const incoming = [
            { handle: "stratechery", cadence: "daily" },
            { handle: "platformer", cadence: "monthly" },
        ];
        expect(diffSubscriptions(current, incoming)).toEqual({
            toRemove: [],
            toAdd: [],
            toChange: [{ handle: "platformer", cadence: "monthly" }],
        });
    });

    it("handles add, remove and change together", () => {
        const incoming = [
            { handle: "platformer", cadence: "daily" },
            { handle: "noahpinion", cadence: "weekly" },
        ];
        expect(diffSubscriptions(current, incoming)).toEqual({
            toRemove: [{ handle: "stratechery", cadence: "daily" }],
            toAdd: [{ handle: "noahpinion", cadence: "weekly" }],
            toChange: [{ handle: "platformer", cadence: "daily" }],
        });
    });

    it("treats a first save (nothing stored yet) as all adds", () => {
        expect(diffSubscriptions([], current)).toEqual({
            toRemove: [],
            toAdd: current,
            toChange: [],
        });
    });
});
