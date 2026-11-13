/*import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema'; // Import your schema file if you have one

// 1. Create the native better-sqlite3 database instance
// For a local file database: pass the file path (e.g., 'sqlite.db')
// For an in-memory database (erased on restart): pass ':memory:'
const sqlite = new Database('sqlite.db');

// 2. Initialize Drizzle with the sqlite instance
export const db = drizzle(sqlite, { schema });*/
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "path";

const sqlite = new Database(
    path.join(process.cwd(), "data/digest.db"),
);

export const db = drizzle(sqlite, { schema });
