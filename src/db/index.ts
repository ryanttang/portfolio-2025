import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://portfolio:portfolio@127.0.0.1:55432/portfolio";

const globalForDb = globalThis as unknown as {
  pgClient: ReturnType<typeof postgres> | undefined;
};

function createClient() {
  return postgres(connectionString, {
    max: 10,
    prepare: false, // Neon-friendly
  });
}

export const client = globalForDb.pgClient ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgClient = client;
}

export const db = drizzle(client, { schema });
