import { NextResponse } from 'next/server';
import { SERVER_ENV } from '@/lib/config';
import { parseJsonBody } from '@/lib/parse-body';

export const dynamic = 'force-dynamic';

/**
 * POST /api/revalidate — on-demand ISR webhook STUB for Build 1.
 *
 * Token-gated and idempotent, but a no-op for now. In the JetEngine phase a WP
 * webhook will call this with the token to trigger revalidatePath/Tag for the
 * affected listing(s). Until REVALIDATE_TOKEN is set, the endpoint reports that
 * revalidation is disabled instead of doing anything.
 */
export async function POST(req: Request) {
  const token = SERVER_ENV.revalidateToken;

  if (!token) {
    // Feature self-disables when the token is unset.
    return NextResponse.json({
      ok: true,
      revalidated: false,
      reason: 'disabled',
    });
  }

  const provided =
    req.headers.get('x-revalidate-token') ??
    new URL(req.url).searchParams.get('token');

  if (provided !== token) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Parse (and ignore) the body so malformed payloads don't 500.
  await parseJsonBody(req);

  // Build 1: intentionally a no-op. Phase 2 will call revalidatePath/Tag here.
  return NextResponse.json({ ok: true, revalidated: false, stub: true });
}
