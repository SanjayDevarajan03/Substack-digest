import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
    email: text("email").primaryKey(),
    handles: text("handles", { mode: "json" }).$type<string[]>().notNull(),
    cadence: text("cadence").notNull(),
    day: text("day"),
    time: text("time").notNull(),
    month: text("month"),
    dateOfMonth: text("date_of_month"),
});

export const subscriptions = sqliteTable(
    "subscriptions", {
        userEmail: text("email").notNull(),
        handle: text("handle").notNull(),
        cadence: text("cadence").notNull(),
        // null = this source has never been included in a sent digest.
        lastSentAt: integer("last_sent_at", { mode: "timestamp" }),
    },
    (table) => [
        primaryKey({
            columns: [table.userEmail, table.handle]
        }),
    ]
)
