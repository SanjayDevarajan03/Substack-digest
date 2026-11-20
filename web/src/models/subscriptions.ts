import { subscriptions } from "../db/schema";
import { db, type Tx } from "../db/client";
import { eq,and } from "drizzle-orm";
import { isValidHandle } from "../services/feedFetcher";
import { HandleValidationError, CadenceValidationError } from "./user";

// Defined once in user.ts (like HandleValidationError) so instanceof checks
// in the route match no matter which model threw it.
export { CadenceValidationError };



export async function getAllSubscriptions() {
    const all_users = await db.select().from(subscriptions);
    return all_users;
}

export async function validateSubscription(handle: string, cadence: string) {
    const cadence_list = ['monthly', 'weekly', 'immediate', 'daily']
    if (!cadence_list.includes(cadence.trim().toLowerCase())) {
        throw new CadenceValidationError(`Invalid cadence. Please enter a valid cadence: ${cadence_list}`)
    }

    if (!(await isValidHandle(handle))) {
        throw new HandleValidationError(`Invalid handle: ${handle}`)
    }
}

// Write only — call inside db.transaction((tx) => ...) after
// validateSubscription has passed for this handle/cadence.
export function insertSubscriptionTx(
    tx: Tx,
    email: string,
    handle: string,
    cadence: string,
    lastSentAt: Date | null = null,
) {
    tx.insert(subscriptions)
        .values({
            userEmail: email,
            handle: handle,
            cadence: cadence.trim().toLowerCase(),
            lastSentAt: lastSentAt,
        })
        .run();
}

export async function getSubscriptionByEmail(email: string) {
    const subscription = await db.select().from(subscriptions).where(eq(subscriptions.userEmail, email))
    return subscription
}

export async function getSubscriptionByEmailAndHandle(email: string, handle: string) {
    const subscription = await db.select().from(subscriptions).where(and(
        eq(subscriptions.userEmail, email),
        eq(subscriptions.handle, handle)
    ));
    return subscription
}

export function deleteSubscriptionByEmail(tx: Tx, email: string) {
    return tx.delete(subscriptions).where(
        eq(subscriptions.userEmail, email)
    ).run();
}

export function deleteSubscriptionByEmailAndHandle(tx: Tx, email: string, handle: string) {
    tx.delete(subscriptions).where(and(
        eq(subscriptions.userEmail, email),
        eq(subscriptions.handle, handle)
    )).run();
}

// Read inside a transaction (sync, .all()) — PUT uses this so the "what's
// saved now" list and the writes based on it happen in one atomic step.
export function getSubscriptionsTx(tx: Tx, email: string) {
    return tx
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userEmail, email))
        .all();
}

// Changes only the cadence of one existing subscription. Email, handle and
// lastSentAt are deliberately left alone.
export function updateSubscriptionCadenceTx(
    tx: Tx,
    email: string,
    handle: string,
    cadence: string,
) {
    tx.update(subscriptions)
        .set({ cadence: cadence.trim().toLowerCase() })
        .where(
            and(
                eq(subscriptions.userEmail, email),
                eq(subscriptions.handle, handle),
            ),
        )
        .run();
}

export interface SubscriptionInput {
    handle: string;
    cadence: string;
}

// Pure function (no database): given what's saved now and what the user just
// submitted, work out the minimal set of changes. Writers present in both with
// the same cadence appear in none of the lists, so their rows — and their
// lastSentAt — are never touched.
export function diffSubscriptions(
    current: SubscriptionInput[],
    incoming: SubscriptionInput[],
) {
    const currentByHandle = new Map(current.map((s) => [s.handle, s]));
    const incomingByHandle = new Map(incoming.map((s) => [s.handle, s]));

    const toRemove = current.filter((s) => !incomingByHandle.has(s.handle));
    const toAdd = incoming.filter((s) => !currentByHandle.has(s.handle));
    const toChange = incoming.filter((s) => {
        const existing = currentByHandle.get(s.handle);
        return existing !== undefined && existing.cadence !== s.cadence;
    });

    return { toRemove, toAdd, toChange };
}

