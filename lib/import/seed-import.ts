import { and, eq } from 'drizzle-orm';
import type { MySql2Database } from 'drizzle-orm/mysql2';
import type { Listing } from '@/lib/types';
import { USD_TO_PYG } from '@/lib/format';
import { kebab } from '@/lib/slug';
import { contentHash } from '@/lib/content-hash';
import * as schema from '@/lib/db/schema';

/**
 * Idempotent seed → DB import, the same dedup pipeline the cross-posting
 * importer will reuse (§5): identity is `listing_sources.dedup_key`
 * ('seed:{id}'), change detection is `content_hash`. Re-running on unchanged
 * data only touches `last_seen_at` — the listing rows are never rewritten
 * (the §12 gate: "seed import re-run = zero changes").
 */

type Db = MySql2Database<typeof schema>;

export interface ImportCounters {
  fetched: number;
  inserted: number;
  updated: number;
  unchanged: number;
  paused: number;
}

const dec = (n: number): string => n.toFixed(2);
// lat/lng are decimal(9,6) — a 2-decimal round would move a pin by ~1 km.
const coord = (n: number): string => n.toFixed(6);

function toUsd(monto: number, moneda: 'USD' | 'PYG'): number {
  return moneda === 'USD' ? monto : monto / USD_TO_PYG;
}

/** Business fields that define a listing's identity for change detection. */
function hashPayload(l: Listing): string {
  return contentHash({
    public_id: l.public_id,
    slug: l.slug,
    origin: l.origin,
    tipo: l.tipo,
    titulo: l.titulo,
    descripcion: l.descripcion,
    owner_type: l.owner_type,
    owner: l.owner,
    ubicacion: l.ubicacion,
    superficie_m2: l.superficie_m2,
    precio: l.precio,
    dimensiones: l.dimensiones,
    esquina: l.esquina,
    servicios: l.servicios,
    estado_titulo: l.estado_titulo,
    financiacion: l.financiacion,
    loteamiento: l.loteamiento,
    images: l.images,
    featured_until: l.featured_until,
    status: l.status,
  });
}

async function upsertOwner(db: Db, l: Listing): Promise<number> {
  const [existing] = await db
    .select({ id: schema.owners.id })
    .from(schema.owners)
    .where(
      and(
        eq(schema.owners.telefonoWa, l.owner.telefono_wa),
        eq(schema.owners.tipo, l.owner_type),
      ),
    )
    .limit(1);
  if (existing) return existing.id;
  const [{ id }] = await db
    .insert(schema.owners)
    .values({
      nombre: l.owner.nombre,
      telefonoWa: l.owner.telefono_wa,
      inmobiliaria: l.owner.inmobiliaria ?? null,
      tipo: l.owner_type,
    })
    .$returningId();
  return id;
}

async function upsertLocation(
  db: Db,
  level: 'departamento' | 'ciudad' | 'barrio',
  name: string,
  slug: string,
  fullSlug: string,
  parentId: number | null,
  lat: number | null,
  lng: number | null,
): Promise<number> {
  const [existing] = await db
    .select({ id: schema.locations.id })
    .from(schema.locations)
    .where(eq(schema.locations.fullSlug, fullSlug))
    .limit(1);
  if (existing) return existing.id;
  const [{ id }] = await db
    .insert(schema.locations)
    .values({
      parentId,
      level,
      name,
      slug,
      fullSlug,
      lat: lat == null ? null : coord(lat),
      lng: lng == null ? null : coord(lng),
    })
    .$returningId();
  return id;
}

/** Walk departamento → ciudad → barrio, returning the deepest location id. */
async function resolveLocation(db: Db, l: Listing): Promise<number> {
  const { departamento, ciudad, barrio, lat, lng } = l.ubicacion;
  const depSlug = kebab(departamento);
  const depId = await upsertLocation(
    db,
    'departamento',
    departamento,
    depSlug,
    depSlug,
    null,
    null,
    null,
  );
  const ciuSlug = kebab(ciudad);
  const ciuFull = `${depSlug}/${ciuSlug}`;
  const ciuId = await upsertLocation(
    db,
    'ciudad',
    ciudad,
    ciuSlug,
    ciuFull,
    depId,
    lat,
    lng,
  );
  if (barrio) {
    const barSlug = kebab(barrio);
    return upsertLocation(
      db,
      'barrio',
      barrio,
      barSlug,
      `${ciuFull}/${barSlug}`,
      ciuId,
      null,
      null,
    );
  }
  return ciuId;
}

/** Column values for insert/update (excludes id, public_id, created_at). */
function listingValues(l: Listing, ownerId: number, locationId: number) {
  const d = l.dimensiones;
  return {
    slug: l.slug,
    origin: l.origin,
    ownerType: l.owner_type,
    ownerId,
    tipo: l.tipo,
    titulo: l.titulo,
    descripcion: l.descripcion,
    locationId,
    departamento: l.ubicacion.departamento,
    ciudad: l.ubicacion.ciudad,
    barrio: l.ubicacion.barrio ?? null,
    lat: coord(l.ubicacion.lat),
    lng: coord(l.ubicacion.lng),
    polygon: l.ubicacion.polygon ?? null,
    superficieM2: dec(l.superficie_m2),
    precioMonto: dec(l.precio.monto),
    precioMoneda: l.precio.moneda,
    priceUsd: dec(toUsd(l.precio.monto, l.precio.moneda)),
    frenteM: d?.frente_m == null ? null : dec(d.frente_m),
    fondoM: d?.fondo_m == null ? null : dec(d.fondo_m),
    esquina: l.esquina,
    servicios: l.servicios,
    estadoTitulo: l.estado_titulo,
    financiacion: l.financiacion,
    loteamiento: l.loteamiento ?? null,
    images: l.images,
    featuredUntil: l.featured_until ? new Date(l.featured_until) : null,
    status: l.status,
    updatedAt: new Date(l.updated_at),
  };
}

export async function importSeed(
  db: Db,
  list: Listing[],
): Promise<ImportCounters> {
  const counters: ImportCounters = {
    fetched: list.length,
    inserted: 0,
    updated: 0,
    unchanged: 0,
    paused: 0,
  };
  const seen = new Set<string>();

  for (const l of list) {
    const dedupKey = `seed:${l.id}`;
    seen.add(dedupKey);
    const hash = hashPayload(l);
    const now = new Date();

    const [src] = await db
      .select()
      .from(schema.listingSources)
      .where(eq(schema.listingSources.dedupKey, dedupKey))
      .limit(1);

    if (!src) {
      const ownerId = await upsertOwner(db, l);
      const locationId = await resolveLocation(db, l);
      const [{ id: listingId }] = await db
        .insert(schema.listings)
        .values({
          ...listingValues(l, ownerId, locationId),
          publicId: l.public_id,
          createdAt: new Date(l.created_at),
        })
        .$returningId();
      await db.insert(schema.listingSources).values({
        listingId,
        source: 'seed',
        sourceId: l.id,
        dedupKey,
        contentHash: hash,
        firstSeenAt: now,
        lastSeenAt: now,
        lastChangedAt: now,
      });
      counters.inserted += 1;
    } else if (src.contentHash === hash) {
      // Unchanged: touch last_seen_at only. The listing row is NOT rewritten.
      await db
        .update(schema.listingSources)
        .set({ lastSeenAt: now })
        .where(eq(schema.listingSources.id, src.id));
      counters.unchanged += 1;
    } else {
      const ownerId = await upsertOwner(db, l);
      const locationId = await resolveLocation(db, l);
      await db
        .update(schema.listings)
        .set(listingValues(l, ownerId, locationId))
        .where(eq(schema.listings.id, src.listingId));
      await db
        .update(schema.listingSources)
        .set({ contentHash: hash, lastSeenAt: now, lastChangedAt: now })
        .where(eq(schema.listingSources.id, src.id));
      counters.updated += 1;
    }
  }

  // §5 rule 4: seed-origin listings no longer present → pause, never delete.
  const seedSources = await db
    .select()
    .from(schema.listingSources)
    .where(eq(schema.listingSources.source, 'seed'));
  for (const s of seedSources) {
    if (!seen.has(s.dedupKey)) {
      await db
        .update(schema.listings)
        .set({ status: 'paused' })
        .where(eq(schema.listings.id, s.listingId));
      counters.paused += 1;
    }
  }

  return counters;
}
