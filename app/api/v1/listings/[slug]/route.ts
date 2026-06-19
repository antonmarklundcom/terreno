import { NextResponse } from 'next/server';
import { getListingBySlug } from '@/lib/listings-repo';

export const dynamic = 'force-dynamic';

/** GET /api/v1/listings/[slug] — single listing. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) {
    return NextResponse.json(
      { error: 'Listing no encontrado' },
      { status: 404 },
    );
  }
  return NextResponse.json({ data: listing });
}
