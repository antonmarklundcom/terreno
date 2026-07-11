import { createHash, randomBytes } from 'node:crypto';

/**
 * public_id — the stable 10-char identity in listing URLs ({slug}-{publicId}),
 * mirroring propia's `listings.public_id` (char(10)). The slug is cosmetic and
 * may change; the public_id never does, so it is what the detail route resolves
 * by. Server-only (uses node:crypto) — never import from a client component.
 */

const LEN = 10;

/** Random id for newly created listings (admin/CSV intake). */
export function randomPublicId(): string {
  return randomBytes(16).toString('hex').slice(0, LEN);
}

/**
 * Deterministic id derived from a stable key (e.g. a seed row id). Keeping it
 * deterministic is what makes the seed re-import a no-op: the same seed row
 * always maps to the same public_id, so nothing changes on a re-run.
 */
export function deterministicPublicId(key: string): string {
  return createHash('sha256').update(key).digest('hex').slice(0, LEN);
}
