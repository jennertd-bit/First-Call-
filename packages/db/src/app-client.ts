import { sql } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Runtime client for tenant-facing queries. Connects as the non-superuser
 * `firstcall_app` role (APP_DATABASE_URL) so RLS policies are enforced — the
 * privileged migration/seed client (./client) must never serve user requests.
 */
const connectionString =
  process.env.APP_DATABASE_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("APP_DATABASE_URL (or DATABASE_URL) is not set");
}

const client = postgres(connectionString, { prepare: false });

export const appDb = drizzle(client, { schema });
export type AppDb = PostgresJsDatabase<typeof schema>;

/**
 * Run a callback inside a transaction with `app.tenant_id` bound to the GUC
 * RLS reads (see rls.sql). Every tenant-facing query MUST go through this so
 * the DB backstop applies even if a query forgets its tenant filter.
 *
 * `tenantId` is resolved server-side from the session — never from the client.
 */
export async function withTenant<T>(
  tenantId: string,
  fn: (tx: AppDb) => Promise<T>,
): Promise<T> {
  return appDb.transaction(async (tx) => {
    await tx.execute(
      sql`select set_config('app.tenant_id', ${tenantId}, true)`,
    );
    return fn(tx as unknown as AppDb);
  });
}
