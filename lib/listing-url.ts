import type { Listing } from './types';

/**
 * THE listing-URL contract, in one file (playbook rule: URL logic lives in a
 * single module). Detail pages are `/terreno/{slug}-{publicId}`: the slug is
 * cosmetic/SEO, the trailing 10-char public_id is the identity the route
 * resolves by. Pure string logic only — safe to import from client components.
 */

/** The `[slug]` route-param value: `{slug}-{publicId}`. */
export function listingSlugParam(listing: Pick<Listing, 'slug' | 'public_id'>) {
  return `${listing.slug}-${listing.public_id}`;
}

/** Site-relative detail path, e.g. `/terreno/lote-esquina-luque-ab12cd34ef`. */
export function listingPath(listing: Pick<Listing, 'slug' | 'public_id'>) {
  return `/terreno/${listingSlugParam(listing)}`;
}

/**
 * Extract the public_id from a route param. The id is always the trailing
 * `-{10 hex}` segment, so this is robust to hyphens anywhere in the slug.
 * Returns null when the param has no id suffix (legacy/garbage URL).
 */
export function publicIdFromParam(param: string): string | null {
  const m = param.match(/-([0-9a-f]{10})$/);
  return m ? m[1] : null;
}
