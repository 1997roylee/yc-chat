import { defineConfig } from "drizzle-kit";

const isProduction = process.env.NODE_ENV === "production" || !!process.env.POSTGRES_URL;

export default isProduction
  ? defineConfig({
      schema: "./src/lib/db/schema.pg.ts",
      out: "./drizzle/pg",
      dialect: "postgresql",
      dbCredentials: {
        url: process.env.POSTGRES_URL!,
      },
    })
  : defineConfig({
      schema: "./src/lib/db/schema.ts",
      out: "./drizzle/sqlite",
      dialect: "sqlite",
      dbCredentials: {
        url: "./data/hn.db",
      },
    });
