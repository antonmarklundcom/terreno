import type { Listing } from './types';
import { SITE } from './config';
import { listingPath } from './listing-url';

/**
 * wa.me deep-link helpers. Routing by owner_type is the critical rule:
 *  - listing_contact on a broker listing  → the broker's number
 *  - listing_contact on a casa_propia listing → OUR number
 *  - valuation & service leads → always OUR number / pipeline
 */

function digits(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

export function buildWaLink(phone: string, message?: string): string {
  const base = `https://wa.me/${digits(phone)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Resolve which WhatsApp number a listing contact should reach. */
export function listingContactNumber(listing: Listing): string {
  return listing.owner_type === 'broker'
    ? listing.owner.telefono_wa
    : SITE.whatsapp;
}

export function listingWaLink(listing: Listing): string {
  const ref = `${SITE.url}${listingPath(listing)}`;
  const msg =
    listing.owner_type === 'broker'
      ? `Hola, vi "${listing.titulo}" en ${SITE.name} y quiero más información. ${ref}`
      : `Hola ${SITE.name}, me interesa "${listing.titulo}". ${ref}`;
  return buildWaLink(listingContactNumber(listing), msg);
}

export function valuationWaLink(): string {
  return buildWaLink(
    SITE.whatsapp,
    `Hola ${SITE.name}, quiero una tasación gratis de mi terreno.`,
  );
}

export function serviceWaLink(servicio?: string): string {
  const what = servicio ? ` de ${servicio}` : '';
  return buildWaLink(
    SITE.whatsapp,
    `Hola ${SITE.name}, necesito el servicio${what}.`,
  );
}
