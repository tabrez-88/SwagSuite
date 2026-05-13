import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import type { NeonDatabase } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

let _pool: Pool | null = null;
let _db: NeonDatabase<typeof schema> | null = null;

function getPool(): Pool {
  if (!_pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?",
      );
    }
    _pool = new Pool({ connectionString: process.env.DATABASE_URL.trim() });
  }
  return _pool;
}

function getDb(): NeonDatabase<typeof schema> {
  if (!_db) {
    _db = drizzle({ client: getPool(), schema });
  }
  return _db;
}

export const pool = new Proxy({} as Pool, {
  get(_, prop) { return (getPool() as any)[prop]; }
});

export const db = new Proxy({} as NeonDatabase<typeof schema>, {
  get(_, prop) { return (getDb() as any)[prop]; }
});