import { drizzle, type MySql2Database } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

/**
 * The MySQL connection, lazily created and guarded. When DATABASE_URL is unset
 * the site runs entirely on the seed fallback (§4) — no pool is ever
 * constructed, so `next build` and dev work with zero DB. Pool is small
 * (≤5) because Hostinger shared MySQL is connection-stingy (playbook).
 */

export const DB_ENABLED = Boolean(process.env.DATABASE_URL?.trim());

let cachedPool: mysql.Pool | null = null;
let cached: MySql2Database<typeof schema> | null = null;

export function getDb(): MySql2Database<typeof schema> {
  if (!DB_ENABLED) {
    throw new Error('DATABASE_URL is not set — DB is disabled');
  }
  if (!cached) {
    cachedPool = mysql.createPool({
      uri: process.env.DATABASE_URL,
      connectionLimit: 5,
      // Keep JSON columns as parsed values, dates as JS Dates.
      timezone: 'Z',
    });
    cached = drizzle(cachedPool, { schema, mode: 'default' });
  }
  return cached;
}

/** Close the pool (tests/scripts; lets the process exit cleanly). */
export async function closeDb(): Promise<void> {
  if (cachedPool) {
    await cachedPool.end();
    cachedPool = null;
    cached = null;
  }
}

export { schema };
