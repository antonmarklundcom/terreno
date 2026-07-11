import { getDb, DB_ENABLED } from '@/lib/db/client';
import { SEED_LISTINGS } from '@/lib/seed/listings';
import { importSeed } from '@/lib/import/seed-import';

/**
 * CLI: load the checked-in seed into terreno's DB, idempotently. Run after
 * migrations:
 *   DATABASE_URL=mysql://… npx tsx scripts/import-seed.ts
 * Re-running is a no-op on unchanged rows (§12 gate). This is terreno's
 * white-glove intake path until a public wizard exists (see §9 open question).
 */
async function main() {
  if (!DB_ENABLED) {
    console.error('DATABASE_URL is not set — nothing to import into.');
    process.exit(1);
  }
  const counters = await importSeed(getDb(), SEED_LISTINGS);
  console.log('[import-seed]', JSON.stringify(counters));
  process.exit(0);
}

main().catch((err) => {
  console.error('[import-seed] failed:', err);
  process.exit(1);
});
