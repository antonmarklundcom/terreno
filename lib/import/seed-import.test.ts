import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { closeDb, DB_ENABLED, getDb } from '@/lib/db/client';
import { SEED_LISTINGS } from '@/lib/seed/listings';
import { getListings } from '@/lib/listings-repo';
import { importSeed } from './seed-import';

/**
 * DB-backed idempotency test — the §12 M1 gate as an assertion. Runs only when
 * DATABASE_URL is set (the MySQL service container in CI); skipped on the
 * no-DB verify path so pure-logic sessions still get a green suite.
 */
describe.skipIf(!DB_ENABLED)('importSeed (MySQL)', () => {
  const db = DB_ENABLED ? getDb() : (null as never);

  beforeAll(async () => {
    // Start from a clean slate so the test is repeatable.
    for (const t of ['listing_sources', 'listings', 'locations', 'owners']) {
      await db.execute(sql.raw(`DELETE FROM ${t}`));
    }
  });

  afterAll(async () => {
    await closeDb();
  });

  it('first import inserts every seed row', async () => {
    const r = await importSeed(db, SEED_LISTINGS);
    expect(r.inserted).toBe(SEED_LISTINGS.length);
    expect(r.updated).toBe(0);
  });

  it('re-import of unchanged data is a pure no-op', async () => {
    const r = await importSeed(db, SEED_LISTINGS);
    expect(r.inserted).toBe(0);
    expect(r.updated).toBe(0);
    expect(r.unchanged).toBe(SEED_LISTINGS.length);
    expect(r.paused).toBe(0);
  });

  it('a single changed field yields exactly one update', async () => {
    const mutated = SEED_LISTINGS.map((l, i) =>
      i === 0 ? { ...l, titulo: `${l.titulo} (actualizado)` } : l,
    );
    const r = await importSeed(db, mutated);
    expect(r.updated).toBe(1);
    expect(r.unchanged).toBe(SEED_LISTINGS.length - 1);
    expect(r.inserted).toBe(0);
  });

  it('the repo now renders from the DB (fetchSource → MySQL)', async () => {
    // DATABASE_URL is set for this run, so the seam reads the DB, not the seed.
    const rows = await getListings();
    expect(rows.length).toBe(SEED_LISTINGS.length);
    // Spot-check the DB→Listing mapping on a known row.
    const sample = rows.find((l) => l.tipo === 'campo');
    expect(sample).toBeDefined();
    expect(sample!.public_id).toMatch(/^[0-9a-f]{10}$/);
    expect(sample!.owner.telefono_wa).not.toBe('');
    expect(sample!.precio.monto).toBeGreaterThan(0);
    // lat/lng must survive the round-trip at full precision (decimal(9,6)),
    // or map pins drift ~1km. Compare against the seed source of truth.
    const seed = SEED_LISTINGS.find((l) => l.public_id === sample!.public_id)!;
    expect(sample!.ubicacion.lat).toBeCloseTo(seed.ubicacion.lat, 5);
    expect(sample!.ubicacion.lng).toBeCloseTo(seed.ubicacion.lng, 5);
  });

  it('no duplicate public_ids after repeated imports', async () => {
    const [rows] = await db.execute(
      sql.raw(
        'SELECT COUNT(*) AS total, COUNT(DISTINCT public_id) AS distinct_ids FROM listings',
      ),
    );
    const row = (
      rows as unknown as Array<{ total: number; distinct_ids: number }>
    )[0];
    expect(row.total).toBe(SEED_LISTINGS.length);
    expect(row.distinct_ids).toBe(SEED_LISTINGS.length);
  });
});
