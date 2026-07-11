import { NextResponse } from 'next/server';
import { getListingByPublicId, getListingBySlug } from '@/lib/listings-repo';
import { publicIdFromParam } from '@/lib/listing-url';

export const dynamic = 'force-dynamic';

/** GET /api/v1/listings/[slug] — single listing. Accepts {slug}-{public_id}
 * or a bare slug (identity is the trailing public_id when present). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const publicId = publicIdFromParam(slug);
  const listing = publicId
    ? ((await getListingByPublicId(publicId)) ?? (await getListingBySlug(slug)))
    : await getListingBySlug(slug);
  if (!listing) {
    return NextResponse.json(
      { error: 'Listing no encontrado' },
      { status: 404 },
    );
  }
  return NextResponse.json({ data: listing });
}
