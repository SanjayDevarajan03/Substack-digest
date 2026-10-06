import { users } from "../db/schema.js";
import { db } from "../db/client.js";
import { eq } from "drizzle-orm";
import { isValidHandle } from "../services/feedFetcher.js";

export async function getAllUsers() {
    const all_users = await db.select().from(users);
    return all_users;
    //const handles = JSON.parse(all_users[0].handles);
}

export async function insertUser(
    email: string,
    handles: string[],
    cadence: string,
    time: string,
    day?: string,
    month?: string,
) {
    for (const handle of handles) {
        if (!isValidHandle(handle)) {
            console.log(handle, " is invalid. Please enter a valid handle.");
            return;
        }
    }
    await db.insert(users).values({
        email: email,
        handles: handles,
        cadence: cadence,
        day: day,
        time: time,
        month: month,
    });
}

export async function getUserByEmail(email: string) {
    //const rows = await db.select({ email: users.email }).from(users);
    const user = await db.select().from(users).where(eq(users.email, email));
    return user;
}

export async function deleteUserByEmail(email: string) {
    //const rows = await db.select({ email: users.email }).from(users);
    const result = await db.delete(users).where(eq(users.email, email));
    return result;
}

export async function updateUserEmail(oldEmail: string, newEmail: string) {
    const result = db
        .update(users)
        .set({ email: newEmail })
        .where(eq(users.email, oldEmail));
    return result;
}

export async function updateHandles(email: string, newHandles: string[]) {
    const user = await db.select().from(users).where(eq(users.email, email));
    if (!user[0]) {
        throw new Error("User not found.");
    }

    const existingHandles: string[] = user[0].handles;
    const updatedHandles = [...existingHandles, ...newHandles];

    const result = await db
        .update(users)
        .set({ handles: updatedHandles })
        .where(eq(users.email, email));
    return result;
}

export async function updateTime(email: string, updatedTime: string) {
    const result = await db
        .update(users)
        .set({ time: updatedTime })
        .where(eq(users.email, email));
    return result;
}

export async function updateCadence(email: string, updatedCadence: string) {
    const result = await db
        .update(users)
        .set({ cadence: updatedCadence })
        .where(eq(users.email, email));
    return result;
}

//await deleteUserByEmail("sanjay.devarajan02@gmail.com");
//console.log(result);

console.log(await getAllUsers());

/*await insertUser(
    "sanjay.devarajan02@gmail.com",
    ["sanjaydevarajan"],
    "daily",
    "12:00",
    "",
    "",
);*/
