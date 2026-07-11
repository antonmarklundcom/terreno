import { eq } from 'drizzle-orm';
import type {
  Facets,
  Listing,
  ListingFilters,
  ListingsResult,
  Servicio,
  Tipo,
} from './types';
import { SEED_LISTINGS } from './seed/listings';
import { USD_TO_PYG, isDestacado } from './format';
import { DB_ENABLED, getDb } from './db/client';
import { listings as listingsTable, owners as ownersTable } from './db/schema';
import { rowToListing } from './db/map';

/**
 * THE SEAM. This is the SOLE data-access point for listings. Every page and
 * every API route reads listings only through this module — nothing else may
 * import `lib/seed/*` or the db client.
 *
 * `fetchSource()` reads published listings from terreno's own MySQL DB via
 * Drizzle when DATABASE_URL is set, and falls back to the checked-in seed on
 * ANY failure (DB unreachable, query error) or when the DB is disabled — so
 * the site always renders (§4). The seed is also the dev fixture and what
 * `scripts/import-seed.ts` loads into the DB.
 */

const DEFAULT_PER_PAGE = 24;

// ---------------------------------------------------------------------------
// Source layer — the only place that knows where raw data comes from.
// ---------------------------------------------------------------------------
async function fetchFromDb(): Promise<Listing[]> {
  const db = getDb();
  const rows = await db
    .select({ listing: listingsTable, owner: ownersTable })
    .from(listingsTable)
    .leftJoin(ownersTable, eq(listingsTable.ownerId, ownersTable.id))
    .where(eq(listingsTable.status, 'published'));
  return rows.map((r) => rowToListing(r.listing, r.owner));
}

async function fetchSource(): Promise<Listing[]> {
  if (DB_ENABLED) {
    try {
      return await fetchFromDb();
    } catch (err) {
      // Permanent fallback: a DB outage must never take the site down (§4).
      console.error('[listings-repo] DB read failed, serving seed:', err);
    }
  }
  return SEED_LISTINGS;
}

/**
 * Which source actually served, for `/api/health`. Distinguishes DB-serving
 * from a seed fallback (DB enabled but unreachable) so the founder can see a
 * degraded DB even while the site keeps rendering.
 */
export async function getSourceStatus(): Promise<{
  source: 'db' | 'seed';
  db_enabled: boolean;
  fallback: boolean;
  listings: number;
}> {
  if (DB_ENABLED) {
    try {
      const rows = await fetchFromDb();
      return {
        source: 'db',
        db_enabled: true,
        fallback: false,
        listings: rows.length,
      };
    } catch {
      return {
        source: 'seed',
        db_enabled: true,
        fallback: true,
        listings: SEED_LISTINGS.length,
      };
    }
  }
  return {
    source: 'seed',
    db_enabled: false,
    fallback: false,
    listings: SEED_LISTINGS.length,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function toUsd(monto: number, moneda: 'USD' | 'PYG'): number {
  return moneda === 'USD' ? monto : monto / USD_TO_PYG;
}

function matches(listing: Listing, f: ListingFilters, now: number): boolean {
  if (f.tipo && listing.tipo !== f.tipo) return false;
  if (f.departamento && listing.ubicacion.departamento !== f.departamento)
    return false;
  if (f.ciudad && listing.ubicacion.ciudad !== f.ciudad) return false;
  if (f.barrio && listing.ubicacion.barrio !== f.barrio) return false;

  if (typeof f.sup_min === 'number' && listing.superficie_m2 < f.sup_min)
    return false;
  if (typeof f.sup_max === 'number' && listing.superficie_m2 > f.sup_max)
    return false;

  const priceUsd = toUsd(listing.precio.monto, listing.precio.moneda);
  if (typeof f.precio_min === 'number' && priceUsd < f.precio_min) return false;
  if (typeof f.precio_max === 'number' && priceUsd > f.precio_max) return false;

  if (f.servicios && f.servicios.length > 0) {
    const has = new Set(listing.servicios);
    if (!f.servicios.every((s) => has.has(s))) return false;
  }

  if (f.financiacion && listing.financiacion !== f.financiacion) return false;
  if (f.estado_titulo && listing.estado_titulo !== f.estado_titulo)
    return false;
  if (f.destacado && !isDestacado(listing, now)) return false;

  return true;
}

/** Featured first (while live), then most-recently updated. */
function sortListings(a: Listing, b: Listing, now: number): number {
  const fa = isDestacado(a, now) ? 1 : 0;
  const fb = isDestacado(b, now) ? 1 : 0;
  if (fa !== fb) return fb - fa;
  return b.updated_at - a.updated_at;
}

// ---------------------------------------------------------------------------
// Public API — the contract pages and routes depend on.
// ---------------------------------------------------------------------------

export async function getListings(
  filters: ListingFilters = {},
): Promise<Listing[]> {
  const now = Date.now();
  const all = await fetchSource();
  return all
    .filter((l) => matches(l, filters, now))
    .sort((a, b) => sortListings(a, b, now));
}

/** Paginated result matching the /api/v1/listings contract. */
export async function getListingsResult(
  filters: ListingFilters = {},
): Promise<ListingsResult> {
  const filtered = await getListings(filters);
  const total = filtered.length;
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.max(1, filters.per_page ?? DEFAULT_PER_PAGE);
  const start = (page - 1) * perPage;
  const data = filtered.slice(start, start + perPage);
  const facets = await getFacets();
  return { data, total, facets };
}

export async function getListingBySlug(slug: string): Promise<Listing | null> {
  const all = await fetchSource();
  return all.find((l) => l.slug === slug) ?? null;
}

/**
 * Resolve by the stable public_id — the identity carried in the URL
 * ({slug}-{public_id}). This is what the detail route uses; the slug is
 * cosmetic and may collide, public_id never does.
 */
export async function getListingByPublicId(
  publicId: string,
): Promise<Listing | null> {
  const all = await fetchSource();
  return all.find((l) => l.public_id === publicId) ?? null;
}

export async function getFeaturedListings(limit = 8): Promise<Listing[]> {
  const now = Date.now();
  const all = await fetchSource();
  const featured = all
    .filter((l) => isDestacado(l, now))
    .sort((a, b) => b.updated_at - a.updated_at);
  // Top up with recent listings if there aren't enough live featured ones.
  if (featured.length < limit) {
    const ids = new Set(featured.map((l) => l.id));
    const filler = all
      .filter((l) => !ids.has(l.id))
      .sort((a, b) => b.updated_at - a.updated_at);
    featured.push(...filler);
  }
  return featured.slice(0, limit);
}

export async function getAllSlugs(): Promise<string[]> {
  const all = await fetchSource();
  return all.map((l) => l.slug);
}

/** Route-param values ({slug}-{public_id}) for generateStaticParams. */
export async function getAllListingParams(): Promise<string[]> {
  const all = await fetchSource();
  return all.map((l) => `${l.slug}-${l.public_id}`);
}

/** Departamentos → ciudades → barrios cascade, plus tipo & servicio counts. */
export async function getFacets(): Promise<Facets> {
  const all = await fetchSource();

  type CiudadAcc = { count: number; barrios: Map<string, number> };
  const deptos = new Map<
    string,
    { count: number; ciudades: Map<string, CiudadAcc> }
  >();
  const tipos = new Map<Tipo, number>();
  const servicios = new Map<Servicio, number>();

  for (const l of all) {
    const { departamento, ciudad, barrio } = l.ubicacion;

    let d = deptos.get(departamento);
    if (!d) {
      d = { count: 0, ciudades: new Map() };
      deptos.set(departamento, d);
    }
    d.count += 1;

    let c = d.ciudades.get(ciudad);
    if (!c) {
      c = { count: 0, barrios: new Map() };
      d.ciudades.set(ciudad, c);
    }
    c.count += 1;

    if (barrio) {
      c.barrios.set(barrio, (c.barrios.get(barrio) ?? 0) + 1);
    }

    tipos.set(l.tipo, (tipos.get(l.tipo) ?? 0) + 1);
    for (const s of l.servicios) {
      servicios.set(s, (servicios.get(s) ?? 0) + 1);
    }
  }

  const collator = new Intl.Collator('es');
  const byName = <T extends { nombre: string }>(a: T, b: T) =>
    collator.compare(a.nombre, b.nombre);

  return {
    departamentos: [...deptos.entries()]
      .map(([nombre, d]) => ({
        nombre,
        count: d.count,
        ciudades: [...d.ciudades.entries()]
          .map(([cn, c]) => ({
            nombre: cn,
            count: c.count,
            barrios: [...c.barrios.entries()]
              .map(([bn, bc]) => ({ nombre: bn, count: bc }))
              .sort(byName),
          }))
          .sort(byName),
      }))
      .sort(byName),
    tipos: [...tipos.entries()].map(([tipo, count]) => ({ tipo, count })),
    servicios: [...servicios.entries()].map(([servicio, count]) => ({
      servicio,
      count,
    })),
  };
}
