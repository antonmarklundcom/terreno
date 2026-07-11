import { describe, expect, it } from 'vitest';
import type { Listing } from './types';
import { SITE } from './config';
import {
  buildWaLink,
  listingContactNumber,
  listingWaLink,
  valuationWaLink,
  serviceWaLink,
} from './whatsapp';

/**
 * WhatsApp routing by owner_type is THE critical lead rule (ARCHITECTURE §8):
 * broker listing contacts reach the broker; everything else reaches our
 * number. A regression here silently sends leads to the wrong phone.
 */

function listing(over: Partial<Listing> = {}): Listing {
  return {
    id: 't-001',
    public_id: 'ab12cd34ef',
    slug: 'lote-x-t-001',
    origin: 'local',
    owner_type: 'broker',
    owner: { nombre: 'Corredor', telefono_wa: '595971111111' },
    tipo: 'lote_urbano',
    titulo: 'Lote esquina',
    descripcion: '',
    ubicacion: { departamento: 'Central', ciudad: 'Luque', lat: 0, lng: 0 },
    superficie_m2: 360,
    precio: { monto: 30000, moneda: 'USD' },
    esquina: true,
    servicios: [],
    estado_titulo: 'con_titulo',
    financiacion: 'contado',
    images: [],
    status: 'published',
    created_at: 0,
    updated_at: 0,
    ...over,
  };
}

describe('buildWaLink', () => {
  it('strips non-digits and URL-encodes the message', () => {
    const link = buildWaLink('+595 (981) 000-000', 'Hola, ¿está disponible?');
    expect(link).toBe(
      'https://wa.me/595981000000?text=Hola%2C%20%C2%BFest%C3%A1%20disponible%3F',
    );
  });
  it('omits the query when there is no message', () => {
    expect(buildWaLink('595981000000')).toBe('https://wa.me/595981000000');
  });
});

describe('listingContactNumber', () => {
  it('routes broker listings to the broker number', () => {
    expect(listingContactNumber(listing({ owner_type: 'broker' }))).toBe(
      '595971111111',
    );
  });
  it('routes casa_propia listings to our number', () => {
    expect(listingContactNumber(listing({ owner_type: 'casa_propia' }))).toBe(
      SITE.whatsapp,
    );
  });
});

describe('listingWaLink', () => {
  it('targets the broker number and includes the listing URL', () => {
    const link = listingWaLink(listing({ owner_type: 'broker' }));
    expect(link.startsWith('https://wa.me/595971111111?text=')).toBe(true);
    expect(decodeURIComponent(link)).toContain(
      `${SITE.url}/terreno/lote-x-t-001`,
    );
  });
  it('targets our number for casa_propia listings', () => {
    const link = listingWaLink(listing({ owner_type: 'casa_propia' }));
    expect(link.startsWith(`https://wa.me/${SITE.whatsapp}?text=`)).toBe(true);
  });
});

describe('valuation & service links', () => {
  it('always target our pipeline number', () => {
    expect(valuationWaLink().startsWith(`https://wa.me/${SITE.whatsapp}`)).toBe(
      true,
    );
    expect(
      serviceWaLink('agrimensor').startsWith(`https://wa.me/${SITE.whatsapp}`),
    ).toBe(true);
  });
  it('names the requested service in the message', () => {
    expect(decodeURIComponent(serviceWaLink('escribano'))).toContain(
      'escribano',
    );
  });
});
