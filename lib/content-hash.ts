import { createHash } from 'node:crypto';

/**
 * Deterministic content hashing for the listing_sources dedup pipeline (§5):
 * the same logical payload always hashes to the same sha256, so a re-import of
 * unchanged data is a no-op. Canonicalization = recursively sorted keys with
 * null/undefined stripped, so key order and absent-vs-null never change the
 * hash. This is the same normalization the cross-posting feed will use.
 */

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

function canonical(value: unknown): Json {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.map(canonical);
  if (typeof value === 'object') {
    const out: { [k: string]: Json } = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      const v = canonical((value as Record<string, unknown>)[key]);
      if (v !== null) out[key] = v; // strip null/undefined for stable identity
    }
    return out;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  return String(value);
}

/** sha256 (hex) of the canonicalized payload. */
export function contentHash(payload: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(canonical(payload)))
    .digest('hex');
}
