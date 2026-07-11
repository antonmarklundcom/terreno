/**
 * terreno.com.py — Drizzle schema for terreno's OWN MySQL database (§4).
 *
 * Field names align with propia's `src/db/schema.ts` wherever a concept is
 * shared, so the future feed mapping stays mechanical. Rules kept from the
 * playbook: all filtering on indexed scalar columns; JSON columns are
 * display-only; no MySQL-only tricks (Postgres escape hatch stays open).
 *
 * Reconciliation notes vs propia:
 *  - `public_id` char(10) + cosmetic `slug` — identical URL identity contract.
 *  - `price_usd` normalized at write time — propia's filtering column.
 *  - `listing_sources.dedup_key` is the READABLE '{site}:{id}' key and
 *    `content_hash` is sha256 (ARCHITECTURE §5 + the migration note — the feed
 *    contract), which is what propia emits in the feed even though propia
 *    hashes its own internal keys.
 */
import {
  bigint,
  boolean,
  char,
  datetime,
  decimal,
  index,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

const id = () =>
  bigint('id', { mode: 'number', unsigned: true }).autoincrement().primaryKey();
const fk = (name: string) => bigint(name, { mode: 'number', unsigned: true });
const createdAt = () =>
  datetime('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`);

/* ------------------------------------------------------------------ */
/* owners — brokers and casa_propia sellers                            */
/* ------------------------------------------------------------------ */

export const owners = mysqlTable('owners', {
  id: id(),
  nombre: varchar('nombre', { length: 140 }).notNull(),
  telefonoWa: varchar('telefono_wa', { length: 30 }).notNull(),
  inmobiliaria: varchar('inmobiliaria', { length: 160 }),
  tipo: mysqlEnum('tipo', ['broker', 'casa_propia']).notNull(),
  createdAt: createdAt(),
});

/* ------------------------------------------------------------------ */
/* locations — hierarchy powering the /[tipo]/[departamento]/[ciudad]  */
/* SEO landings and (future) cached listing_counts thin-page rule.     */
/* ------------------------------------------------------------------ */

export const locations = mysqlTable(
  'locations',
  {
    id: id(),
    parentId: fk('parent_id'),
    level: mysqlEnum('level', [
      'pais',
      'departamento',
      'ciudad',
      'barrio',
    ]).notNull(),
    name: varchar('name', { length: 120 }).notNull(),
    slug: varchar('slug', { length: 140 }).notNull(),
    fullSlug: varchar('full_slug', { length: 300 }).notNull().unique(),
    lat: decimal('lat', { precision: 9, scale: 6 }),
    lng: decimal('lng', { precision: 9, scale: 6 }),
    // Cached {tipo: count} refreshed by cron; powers the thin-page rule later.
    listingCounts: json('listing_counts'),
  },
  (t) => [index('idx_parent').on(t.parentId, t.level)],
);

/* ------------------------------------------------------------------ */
/* listings — wide, denormalized where it serves filtering             */
/* ------------------------------------------------------------------ */

export const listings = mysqlTable(
  'listings',
  {
    id: id(),
    publicId: char('public_id', { length: 10 }).notNull().unique(),
    slug: varchar('slug', { length: 180 }).notNull(),
    origin: mysqlEnum('origin', ['local', 'propia']).notNull().default('local'),

    ownerType: mysqlEnum('owner_type', ['broker', 'casa_propia']).notNull(),
    ownerId: fk('owner_id'),

    tipo: mysqlEnum('tipo', [
      'lote_urbano',
      'terreno_comercial',
      'campo',
      'quinta',
      'loteamiento',
    ]).notNull(),
    titulo: varchar('titulo', { length: 180 }).notNull(),
    descripcion: text('descripcion').notNull(),

    // Geo: denormalized strings are the render source of truth; location_id
    // links to the taxonomy for landing pages / counts.
    locationId: fk('location_id'),
    departamento: varchar('departamento', { length: 120 }).notNull(),
    ciudad: varchar('ciudad', { length: 120 }).notNull(),
    barrio: varchar('barrio', { length: 120 }),
    lat: decimal('lat', { precision: 9, scale: 6 }).notNull(),
    lng: decimal('lng', { precision: 9, scale: 6 }).notNull(),
    polygon: json('polygon'),

    superficieM2: decimal('superficie_m2', {
      precision: 12,
      scale: 2,
    }).notNull(),
    precioMonto: decimal('precio_monto', { precision: 14, scale: 2 }).notNull(),
    precioMoneda: mysqlEnum('precio_moneda', ['USD', 'PYG']).notNull(),
    // Normalized at write time; ALL price filtering uses this (propia pattern).
    priceUsd: decimal('price_usd', { precision: 12, scale: 2 }).notNull(),

    frenteM: decimal('frente_m', { precision: 8, scale: 2 }),
    fondoM: decimal('fondo_m', { precision: 8, scale: 2 }),
    esquina: boolean('esquina').notNull().default(false),
    servicios: json('servicios').notNull(),
    estadoTitulo: mysqlEnum('estado_titulo', [
      'con_titulo',
      'en_proceso',
    ]).notNull(),
    financiacion: mysqlEnum('financiacion', ['contado', 'cuotas']).notNull(),
    loteamiento: json('loteamiento'),
    images: json('images').notNull(),

    featuredUntil: datetime('featured_until'), // paid placement gating
    status: mysqlEnum('status', ['published', 'paused', 'sold'])
      .notNull()
      .default('published'),

    createdAt: createdAt(),
    updatedAt: datetime('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index('idx_search').on(t.status, t.tipo, t.locationId, t.priceUsd),
    index('idx_geo').on(t.status, t.lat, t.lng),
    index('idx_fresh').on(t.status, t.updatedAt),
    index('idx_slug').on(t.slug),
    index('idx_owner').on(t.ownerId),
  ],
);

/* ------------------------------------------------------------------ */
/* listing_sources — provenance + idempotency (mirrors propia)         */
/* ------------------------------------------------------------------ */

export const listingSources = mysqlTable(
  'listing_sources',
  {
    id: id(),
    listingId: fk('listing_id').notNull(),
    source: mysqlEnum('source', ['seed', 'admin', 'propia']).notNull(),
    sourceId: varchar('source_id', { length: 120 }),
    // Global identity '{origin_site}:{origin_id}', e.g. 'seed:t-001'. Readable.
    dedupKey: varchar('dedup_key', { length: 120 }).notNull(),
    // sha256 of the normalized payload (feed contract, §5).
    contentHash: char('content_hash', { length: 64 }).notNull(),
    firstSeenAt: datetime('first_seen_at').notNull(),
    lastSeenAt: datetime('last_seen_at').notNull(),
    lastChangedAt: datetime('last_changed_at').notNull(),
  },
  (t) => [
    uniqueIndex('uq_dedup').on(t.dedupKey),
    index('idx_listing').on(t.listingId),
  ],
);

/* ------------------------------------------------------------------ */
/* leads — schema defined now (§4); persistence wired in M4 (crm.ts)   */
/* ------------------------------------------------------------------ */

export const leads = mysqlTable(
  'leads',
  {
    id: id(),
    tipoLead: mysqlEnum('tipo_lead', [
      'listing_contact',
      'valuation',
      'service',
    ]).notNull(),
    vertical: varchar('vertical', { length: 40 }).notNull().default('terreno'),
    captureSite: varchar('capture_site', { length: 80 }).notNull(),
    originSite: varchar('origin_site', { length: 80 }),
    listingId: fk('listing_id'),
    listingDedupKey: varchar('listing_dedup_key', { length: 120 }),
    contacto: json('contacto'),
    payload: json('payload'),
    sourcePage: varchar('source_page', { length: 200 }),
    crmStatus: mysqlEnum('crm_status', ['pending', 'sent', 'failed'])
      .notNull()
      .default('pending'),
    createdAt: createdAt(),
  },
  (t) => [
    index('idx_listing').on(t.listingId),
    index('idx_crm').on(t.crmStatus, t.createdAt),
  ],
);
