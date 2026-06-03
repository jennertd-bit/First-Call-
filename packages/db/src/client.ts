import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

// Lazily initialise the privileged connection. Importing this module must NOT
// require DATABASE_URL — only *using* the client does. This keeps `next build`
// (which evaluates the route module graph while collecting page data) from
// crashing when the DB env isn't present at build time; the connection string
// only has to exist at request time.
let instance: DrizzleDb | undefined;

function getDb(): DrizzleDb {
  if (!instance) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    // Single shared connection. In serverless, prefer the Supabase pooler URL.
    const client = postgres(connectionString, { prepare: false });
    instance = drizzle(client, { schema });
  }
  return instance;
}

export const db = new Proxy({} as DrizzleDb, {
  get(_target, prop, receiver) {
    const real = getDb();
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export type Db = DrizzleDb;
