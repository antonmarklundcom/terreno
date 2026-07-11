import { NextResponse } from 'next/server';
import { getSourceStatus } from '@/lib/listings-repo';

export const dynamic = 'force-dynamic';

const STARTED_AT = Date.now();

/**
 * GET /api/health — uptime + data-source signal, designed to be read with
 * `curl https://terreno.com.py/api/health | jq`. This is the one endpoint the
 * founder hits to know the box is alive.
 *
 * Reports which source actually served: `db` when MySQL is serving, or `seed`
 * with `fallback: true` when the DB is enabled but unreachable (the site still
 * renders — §4). HTTP is 200 whenever listings render; `degraded` flags a
 * DB fallback so monitoring notices without paging (the site is still up).
 * The `sync` block is a placeholder until M2 wires importer counters (§5).
 */
export async function GET() {
  const now = Date.now();

  let data;
  try {
    data = await getSourceStatus();
  } catch {
    data = {
      source: 'seed' as const,
      db_enabled: true,
      fallback: true,
      listings: 0,
    };
  }

  const degraded = data.fallback || data.listings === 0;

  const body = {
    status: degraded ? ('degraded' as const) : ('ok' as const),
    time: new Date(now).toISOString(),
    uptime_s: Math.round((now - STARTED_AT) / 1000),
    data,
    // M2 fills these in from the importer run counters.
    sync: {
      enabled: false,
      last_run_at: null,
      last_age_s: null,
      counters: null,
    },
  };

  return NextResponse.json(body, {
    // Site renders (via DB or seed) → 200. Only a total data failure is 503.
    status: data.listings > 0 ? 200 : 503,
    headers: { 'cache-control': 'no-store' },
  });
}
