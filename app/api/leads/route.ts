import { NextResponse } from 'next/server';
import { leadSchema } from '@/lib/validation';
import { processLead } from '@/lib/leads';
import { parseJsonBody } from '@/lib/parse-body';
import type { LeadInput } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/leads — the single internal orchestrator. All leads converge here
 * (listing_contact | valuation | service). Parses JSON from the raw text body
 * so navigator.sendBeacon() works on the WhatsApp click handler.
 *
 * Logger failures never fail the user's action: processLead degrades
 * gracefully and we always return ok.
 */
export async function POST(req: Request) {
  const body = await parseJsonBody(req);
  if (body === null) {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await processLead(parsed.data as LeadInput);
    return NextResponse.json(result);
  } catch {
    // Never surface logger problems to the user.
    return NextResponse.json({ ok: true, degraded: true });
  }
}
