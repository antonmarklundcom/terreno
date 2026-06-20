import { NextRequest, NextResponse } from 'next/server';
import { listingQuerySchema } from '@/lib/validation';
import { getListingsResult } from '@/lib/listings-repo';
import type { ListingFilters } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/listings — list/filter listings. App-first contract:
 * returns { data, total, facets }. The web pages and the future app share it.
 */
export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = listingQuerySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Parámetros inválidos', issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const filters = parsed.data as ListingFilters;
  const result = await getListingsResult(filters);
  return NextResponse.json(result);
}
