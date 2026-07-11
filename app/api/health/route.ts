import { NextResponse } from 'next/server';
import { getListings } from '@/lib/listings-repo';

export const dynamic = 'force-dynamic';

const STARTED_AT = Date.now();

/**
 * GET /api/health — uptime + data-source signal, designed to be read with
 * `curl https://terreno.com.py/api/health | jq`. This is the one endpoint the
 * founder hits to know the box is alive.
 *
 * M0: reports process uptime and the live listing count served through the
 * repo seam (proves the data path renders). The `source` is `seed` until M1
 * swaps `fetchSource()` to MySQL. The `sync` block is a placeholder until M2
 * wires the importer counters + last-sync age (ARCHITECTURE §5, §12).
 */
export async function GET() {
  const now = Date.now();
  let listings = 0;
  let dataOk = true;

  try {
    listings = (await getListings()).length;
  } catch {
    dataOk = false;
  }

  const body = {
    status: dataOk ? ('ok' as const) : ('degraded' as const),
    time: new Date(now).toISOString(),
    uptime_s: Math.round((now - STARTED_AT) / 1000),
    data: {
      // M1 flips this to 'db' (with 'seed' as the fallback marker).
      source: 'seed' as const,
      ok: dataOk,
      listings,
    },
    // M2 fills these in from the importer run counters.
    sync: {
      enabled: false,
      last_run_at: null,
      last_age_s: null,
      counters: null,
    },
  };

  return NextResponse.json(body, {
    status: dataOk ? 200 : 503,
    headers: { 'cache-control': 'no-store' },
  });
}
