import { describe, it, expect, beforeEach, vi } from "vitest";
import {
    getAllUsers,
    validateUser,
    insertUserTx,
    getUserByEmail,
    deleteUserByEmail,
    updateUserTx,
    TimeValidationError,
    DayValidationError,
    MonthValidationError,
    DateOfMonthValidationError,
    CadenceValidationError,
} from "./user";
import type { Tx } from "../db/client";

const {
    mockSelectWhere,
    mockFromAwait,
    mockInsertValues,
    mockDeleteWhere,
    mockUpdateWhere,
    mockSet,
    mockIsValidHandle,
} = vi.hoisted(() => {
    const mockUpdateWhere = vi.fn();
    const mockSet = vi.fn(() => ({ where: mockUpdateWhere }));
    return {
        mockSelectWhere: vi.fn(),
        mockFromAwait: vi.fn(),
        mockInsertValues: vi.fn(),
        mockDeleteWhere: vi.fn(),
        mockUpdateWhere,
        mockSet,
        mockIsValidHandle: vi.fn(),
    };
});

vi.mock("../db/client", () => ({
    db: {
        // .from(...) needs to work two ways: getUserByEmail chains .where(...)
        // off it, while getAllUsers awaits it directly with no .where() call
        // at all — so it's both chainable and thenable (awaitable) at once.
        select: () => ({
            from: () => ({
                where: mockSelectWhere,
                then: (onFulfilled: any, onRejected: any) =>
                    mockFromAwait().then(onFulfilled, onRejected),
            }),
        }),
        insert: () => ({ values: mockInsertValues }),
        delete: () => ({ where: mockDeleteWhere }),
        update: () => ({ set: mockSet }),
    },
}));

vi.mock("../services/feedFetcher", () => ({
    isValidHandle: mockIsValidHandle,
}));



describe("getAllUsers", () => {
    beforeEach(() => {
        mockFromAwait.mockReset();
    });

    it("returns every row the db resolves", async () => {
        mockFromAwait.mockResolvedValue([
            { email: "a@example.com" },
            { email: "b@example.com" },
        ]);
        const result = await getAllUsers();
        expect(result).toEqual([
            { email: "a@example.com" },
            { email: "b@example.com" },
        ]);
    });
});

describe("validateUser", () => {
    it("accepts a valid daily schedule", () => {
        expect(() => validateUser("daily", "12:00")).not.toThrow();
    });

    it("accepts a valid monthly schedule", () => {
        expect(() =>
            validateUser("monthly", "12:00", undefined, "March", "15"),
        ).not.toThrow();
    });

    it("rejects an invalid digest cadence", () => {
        expect(() => validateUser("hourly", "12:00")).toThrow(
            CadenceValidationError,
        );
    });

    it("rejects 'immediate' as a digest cadence (per-writer only)", () => {
        expect(() => validateUser("immediate", "12:00")).toThrow(
            CadenceValidationError,
        );
    });

    it("rejects an invalid time format", () => {
        expect(() => validateUser("daily", "1:00")).toThrow(
            TimeValidationError,
        );
    });

    it("rejects an invalid day for weekly cadence", () => {
        expect(() => validateUser("weekly", "12:00", "Someday")).toThrow(
            DayValidationError,
        );
    });

    it("rejects an invalid month for monthly cadence", () => {
        expect(() =>
            validateUser("monthly", "12:00", undefined, "Smarch"),
        ).toThrow(MonthValidationError);
    });

    it("rejects a dateOfMonth out of range for the given month", () => {
        expect(() =>
            validateUser("monthly", "12:00", undefined, "February", "31"),
        ).toThrow(DateOfMonthValidationError);
    });
});

describe("insertUserTx", () => {
    const mockRun = vi.fn();
    // Stand-in for the tx object db.transaction passes in — only the
    // insert(...).values(...).run() chain insertUserTx uses.
    const fakeTx = { insert: () => ({ values: mockInsertValues }) } as unknown as Tx;
    beforeEach(() => {
        mockRun.mockReset();
        mockInsertValues.mockReset().mockReturnValue({ run: mockRun });
    });

    it("writes the user row and actually executes it with .run()", () => {
        insertUserTx(
            fakeTx,
            "test@example.com",
            ["sanjaydevarajan"],
            "daily",
            "12:00",
        );
        expect(mockInsertValues).toHaveBeenCalledWith({
            email: "test@example.com",
            handles: ["sanjaydevarajan"],
            cadence: "daily",
            day: undefined,
            time: "12:00",
            month: undefined,
            dateOfMonth: undefined,
        });
        expect(mockRun).toHaveBeenCalledOnce();
    });
});

describe("getUserByEmail", () => {
    beforeEach(() => {
        mockSelectWhere.mockReset();
    });

    it("returns whatever the db resolves", async () => {
        mockSelectWhere.mockResolvedValue([{ email: "test@example.com" }]);
        const result = await getUserByEmail("test@example.com");
        expect(result).toEqual([{ email: "test@example.com" }]);
    });

    it("returns an empty array when no user matches", async () => {
        mockSelectWhere.mockResolvedValue([]);
        const result = await getUserByEmail("nobody@example.com");
        expect(result).toEqual([]);
    });
});

describe("insertUserTx", () => {
    const mockRun = vi.fn();
    // Stand-in for the tx object db.transaction passes in — only the
    // insert(...).values(...).run() chain insertUserTx uses.
    const fakeTx = { insert: () => ({ values: mockInsertValues }) } as unknown as Tx;
    beforeEach(() => {
        mockRun.mockReset();
        mockInsertValues.mockReset().mockReturnValue({ run: mockRun });
    });

    it("writes the user row and actually executes it with .run()", () => {
        insertUserTx(
            fakeTx,
            "test@example.com",
            ["sanjaydevarajan"],
            "daily",
            "12:00",
        );
        expect(mockInsertValues).toHaveBeenCalledWith({
            email: "test@example.com",
            handles: ["sanjaydevarajan"],
            cadence: "daily",
            day: undefined,
            time: "12:00",
            month: undefined,
            dateOfMonth: undefined,
        });
        expect(mockRun).toHaveBeenCalledOnce();
    });
});

describe("deleteUserByEmail", () => {
    const mockRun = vi.fn();
    const fakeTx = { delete: () => ({ where: mockDeleteWhere }) } as unknown as Tx;

    beforeEach(() => {
        mockRun.mockReset().mockReturnValue({ changes: 1 });
        mockDeleteWhere.mockReset().mockReturnValue({ run: mockRun });
    });

    it("executes the delete with .run() and returns its result", () => {
        const result = deleteUserByEmail(fakeTx, "test@example.com");
        expect(mockRun).toHaveBeenCalledOnce();
        expect(result).toEqual({ changes: 1 });
    });
});

// Validation for updates is validateUser's job (tested above) — the route
// runs it before the transaction — so these only cover the write itself.
describe("updateUserTx", () => {
    const mockRun = vi.fn();
    const fakeTx = { update: () => ({ set: mockSet }) } as unknown as Tx;

    beforeEach(() => {
        mockRun.mockReset().mockReturnValue({ changes: 1 });
        mockSet.mockClear();
        mockUpdateWhere.mockReset().mockReturnValue({ run: mockRun });
    });

    it("sets the full schedule and executes it with .run()", () => {
        const result = updateUserTx(
            fakeTx,
            "test@example.com",
            ["sanjaydevarajan"],
            "weekly",
            "09:00",
            "Monday",
        );
        expect(mockSet).toHaveBeenCalledWith({
            handles: ["sanjaydevarajan"],
            cadence: "weekly",
            time: "09:00",
            day: "Monday",
            month: null,
            dateOfMonth: null,
        });
        expect(mockRun).toHaveBeenCalledOnce();
        expect(result).toEqual({ changes: 1 });
    });

    it("clears old monthly fields when switching to daily", () => {
        updateUserTx(fakeTx, "test@example.com", ["a"], "daily", "09:00", "", "", "");
        expect(mockSet).toHaveBeenCalledWith(
            expect.objectContaining({ day: null, month: null, dateOfMonth: null }),
        );
    });

    it("never changes the email", () => {
        updateUserTx(fakeTx, "test@example.com", ["a"], "daily", "09:00");
        expect(mockSet).toHaveBeenCalledWith(
            expect.not.objectContaining({ email: expect.anything() }),
        );
    });

    it("reports changes: 0 when no user matches (route turns this into 404)", () => {
        mockRun.mockReturnValue({ changes: 0 });
        const result = updateUserTx(fakeTx, "nobody@example.com", ["a"], "daily", "09:00");
        expect(result).toEqual({ changes: 0 });
    });
});
