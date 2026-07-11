import { describe, expect, it } from 'vitest';
import { contentHash } from './content-hash';

/**
 * content_hash is the change-detector for the dedup pipeline (§5). It MUST be
 * stable across key order and null/absent differences, or every re-import
 * would look "changed" and idempotency would break.
 */

describe('contentHash', () => {
  it('is deterministic for the same payload', () => {
    const a = { titulo: 'Lote', precio: { monto: 30000, moneda: 'USD' } };
    expect(contentHash(a)).toBe(contentHash({ ...a }));
  });

  it('ignores key order', () => {
    expect(contentHash({ a: 1, b: 2 })).toBe(contentHash({ b: 2, a: 1 }));
  });

  it('treats null and absent as equivalent', () => {
    expect(contentHash({ a: 1, b: null })).toBe(contentHash({ a: 1 }));
  });

  it('changes when a value changes', () => {
    expect(contentHash({ precio: 30000 })).not.toBe(
      contentHash({ precio: 31000 }),
    );
  });

  it('returns a 64-char sha256 hex string', () => {
    expect(contentHash({ x: 1 })).toMatch(/^[0-9a-f]{64}$/);
  });
});
