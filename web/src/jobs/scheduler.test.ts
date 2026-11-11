import { describe, it, expect, beforeEach } from "vitest";
import { buildCronExpression } from "./scheduler";
import {
    TimeValidationError,
    DateOfMonthValidationError,
    DayValidationError,
    MonthValidationError,
} from "../models/user";
import { vi } from 'vitest';

const {mockEmail, mockHandles, mockCadence, mockDay, mockTime, mockMonth, mockDateOfMonth, mockWhere} = vi.hoisted(() => ({
    mockEmail: vi.fn(),
    mockHandles: vi.fn(),
    mockCadence: vi.fn(),
    mockDay: vi.fn(),
    mockTime: vi.fn(),
    mockMonth: vi.fn(),
    mockDateOfMonth: vi.fn(),
    mockWhere: vi.fn(),
}));

vi.mock("../db/client", () => {
    return {
        db: {
            select: vi.fn(() => ({
                from: vi.fn(() => ({
                    where: mockWhere
                }))
            }))
        }
    }
})

describe("buildCronExpression", () => {
    beforeEach(() => {
        mockEmail.mockReset();
        mockHandles.mockReset();
        mockCadence.mockReset();
        mockDay.mockReset();
        mockTime.mockReset();
        mockMonth.mockReset();
        mockDateOfMonth.mockReset();
        mockWhere.mockReset();
    });

    // daily
    it("Describes a valid daily input", async () => {
        mockWhere.mockResolvedValue([{email:"sanjay.devarajan02@gmail.com", handles: "sanjaydevarajan", cadence: "daily", day: "", time: "12:00", month:"", dateOfMonth:""}])

        const result = await buildCronExpression(
            "sanjay.devarajan02@gmail.com",
            "daily",
            "",
            "12:00",
            "",
            "",
        );
        expect(result?.getStatus()).toBe("idle");
    })

    it("Rejects an invalid daily input", async () => {
        mockWhere.mockResolvedValue([{email:"sanjay.devarajan02@gmail.com", handles: "sanjaydevarajan", cadence: "daily", day: "", time: "12:00", month:"", dateOfMonth:""}])
        await expect(buildCronExpression(
            "sanjay.devarajan02@gmail.com",
            "daily",
            "",
            "1:00",
            "",
            "",
        )).rejects.toThrow(TimeValidationError);
    })

    // weekly
    it("Describes a valid weekly input", async () => {
        mockWhere.mockResolvedValue([{email:"sanjay.devarajan02@gmail.com", handles: "sanjaydevarajan", cadence: "weekly", day: "", time: "12:00", month:"", dateOfMonth:""}])

        const result = await buildCronExpression(
            "sanjay.devarajan02@gmail.com",
            "weekly",
            "Monday",
            "12:00",
            "",
            "",
        );
        expect(result?.getStatus()).toBe("idle");
    })

    it("Rejects an invalid weekly input", async () => {
        mockWhere.mockResolvedValue([{email:"sanjay.devarajan02@gmail.com", handles: "sanjaydevarajan", cadence: "daily", day: "", time: "12:00", month:"", dateOfMonth:""}])
        await expect(buildCronExpression(
            "sanjay.devarajan02@gmail.com",
            "weekly",
            "Goodday",
            "12:00",
            "",
            "",
        )).rejects.toThrow(DayValidationError);
    })

    // monthly
    it("Describes a valid monthly input", async () => {
        mockWhere.mockResolvedValue([{email:"sanjay.devarajan02@gmail.com", handles: "sanjaydevarajan", cadence: "weekly", day: "", time: "12:00", month:"", dateOfMonth:""}])

        const result = await buildCronExpression(
            "sanjay.devarajan02@gmail.com",
            "monthly",
            "",
            "12:00",
            "January",
            "12",
        );
        expect(result?.getStatus()).toBe("idle");
    })

    it("Rejects an invalid monthly input", async () => {
        mockWhere.mockResolvedValue([{email:"sanjay.devarajan02@gmail.com", handles: "sanjaydevarajan", cadence: "daily", day: "", time: "12:00", month:"", dateOfMonth:""}])
        await expect(buildCronExpression(
            "sanjay.devarajan02@gmail.com",
            "monthly",
            "",
            "12:00",
            "Jan",
            "12",
        )).rejects.toThrow(MonthValidationError);
    })
})