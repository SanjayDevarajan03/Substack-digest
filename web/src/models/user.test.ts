import { describe, it, expect, beforeEach, vi } from "vitest";

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

import {
    getAllUsers,
    insertUser,
    getUserByEmail,
    deleteUserByEmail,
    updateAll,
    HandleValidationError,
    TimeValidationError,
    DayValidationError,
    MonthValidationError,
    DateOfMonthValidationError,
} from "./user";

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

describe("insertUser", () => {
    beforeEach(() => {
        mockIsValidHandle.mockReset().mockResolvedValue(true);
        mockInsertValues.mockReset().mockResolvedValue(undefined);
    });

    it("inserts a valid daily user", async () => {
        await insertUser(
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
    });

    it("rejects an invalid handle", async () => {
        mockIsValidHandle.mockResolvedValue(false);
        await expect(
            insertUser("test@example.com", ["badhandle"], "daily", "12:00"),
        ).rejects.toThrow(HandleValidationError);
        expect(mockInsertValues).not.toHaveBeenCalled();
    });

    it("rejects an invalid time format", async () => {
        await expect(
            insertUser("test@example.com", ["sanjaydevarajan"], "daily", "1:00"),
        ).rejects.toThrow(TimeValidationError);
    });

    it("rejects an invalid day for weekly cadence", async () => {
        await expect(
            insertUser(
                "test@example.com",
                ["sanjaydevarajan"],
                "weekly",
                "12:00",
                "Someday",
            ),
        ).rejects.toThrow(DayValidationError);
    });

    it("rejects an invalid month for monthly cadence", async () => {
        await expect(
            insertUser(
                "test@example.com",
                ["sanjaydevarajan"],
                "monthly",
                "12:00",
                undefined,
                "Smarch",
            ),
        ).rejects.toThrow(MonthValidationError);
    });

    it("rejects a dateOfMonth out of range for the given month", async () => {
        await expect(
            insertUser(
                "test@example.com",
                ["sanjaydevarajan"],
                "monthly",
                "12:00",
                undefined,
                "February",
                "31",
            ),
        ).rejects.toThrow(DateOfMonthValidationError);
    });

    it("accepts a valid monthly user", async () => {
        await insertUser(
            "test@example.com",
            ["sanjaydevarajan"],
            "monthly",
            "12:00",
            undefined,
            "March",
            "15",
        );
        expect(mockInsertValues).toHaveBeenCalledWith(
            expect.objectContaining({ month: "March", dateOfMonth: "15" }),
        );
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

describe("deleteUserByEmail", () => {
    beforeEach(() => {
        mockDeleteWhere.mockReset();
    });

    it("calls db.delete and returns the result", async () => {
        mockDeleteWhere.mockResolvedValue({ changes: 1 });
        const result = await deleteUserByEmail("test@example.com");
        expect(result).toEqual({ changes: 1 });
    });
});

describe("updateAll", () => {
    beforeEach(() => {
        mockIsValidHandle.mockReset().mockResolvedValue(true);
        mockSet.mockClear();
        mockUpdateWhere.mockReset().mockResolvedValue({ changes: 1 });
    });

    it("only includes fields that were actually provided", async () => {
        await updateAll(
            "test@example.com",
            undefined,
            undefined,
            "weekly",
            undefined,
        );
        expect(mockSet).toHaveBeenCalledWith({ cadence: "weekly" });
    });

    it("includes multiple provided fields together", async () => {
        await updateAll(
            "test@example.com",
            undefined,
            ["sanjaydevarajan"],
            undefined,
            "09:00",
        );
        expect(mockSet).toHaveBeenCalledWith({
            handles: ["sanjaydevarajan"],
            time: "09:00",
        });
    });

    it("rejects an invalid handle in the update", async () => {
        mockIsValidHandle.mockResolvedValue(false);
        await expect(
            updateAll("test@example.com", undefined, ["badhandle"]),
        ).rejects.toThrow(HandleValidationError);
        expect(mockSet).not.toHaveBeenCalled();
    });

    it("rejects an invalid time format in the update", async () => {
        await expect(
            updateAll(
                "test@example.com",
                undefined,
                undefined,
                undefined,
                "9am",
            ),
        ).rejects.toThrow(TimeValidationError);
    });

    it("rejects an invalid day in the update", async () => {
        await expect(
            updateAll(
                "test@example.com",
                undefined,
                undefined,
                undefined,
                undefined,
                "Someday",
            ),
        ).rejects.toThrow(DayValidationError);
    });

    it("rejects an invalid month when cadence is monthly", async () => {
        await expect(
            updateAll(
                "test@example.com",
                undefined,
                undefined,
                "monthly",
                undefined,
                undefined,
                "Smarch",
            ),
        ).rejects.toThrow(MonthValidationError);
    });

    it("rejects an out-of-range dateOfMonth when cadence is monthly", async () => {
        await expect(
            updateAll(
                "test@example.com",
                undefined,
                undefined,
                "monthly",
                undefined,
                undefined,
                "February",
                "30",
            ),
        ).rejects.toThrow(DateOfMonthValidationError);
    });

    it("updates the email when newEmail is provided", async () => {
        await updateAll("old@example.com", "new@example.com");
        expect(mockSet).toHaveBeenCalledWith({ email: "new@example.com" });
    });
});
