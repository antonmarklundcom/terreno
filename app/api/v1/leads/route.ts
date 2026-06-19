import { NextResponse } from 'next/server';
import { leadSchema } from '@/lib/validation';
import { processLead } from '@/lib/leads';
import { parseJsonBody } from '@/lib/parse-body';
import type { LeadInput } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/leads — public, versioned lead intake (app-first contract).
 * Delegates to the same orchestrator as /api/leads.
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
    return NextResponse.json({ ok: true, degraded: true });
  }
}
