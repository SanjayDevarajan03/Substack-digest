import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
    email: text("email").primaryKey(),
    handles: text("handles", { mode: "json" }).$type<string[]>().notNull(),
    cadence: text("cadence").notNull(),
    day: text("day"),
    time: text("time").notNull(),
    month: text("month"),
});
