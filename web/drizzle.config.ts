/*import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/db/schema.ts",
    out: "./src/db/migrations",
    dialect: "sqlite",
    dbCredentials: {
        url: "./src/db/digest.db",
    },
});*/

import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/db/schema.ts",
    out: "./src/db/migrations",
    dialect: "sqlite",
    dbCredentials: {
        url: "./src/db/digest.db",
    },
});
