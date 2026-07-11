# Migration note for propia.node — terreno.com.py cross-posting

> Hand this file to a propia.node session; it is written to be implemented
> from this note alone. Reconciled against propia.node `main @ cdd2478`
> (schema.ts, verticals.ts, crm.ts, import/{types,normalize,upsert}.ts,
> urls.ts, ARCHITECTURE.md) and the `listing-site-hostinger` SKILL.md (on
> branch `claude/panel-auth-admin-review-dashboard-v5190h`).
> Full terreno-side contract: `ARCHITECTURE.md` in `antonmarklundcom/terreno`
> (§3 decision, §5 sync contract, §7 canonical rule).

## Context — one honest paragraph first

Propia's skill (Rule 0) and ARCHITECTURE v2 treat terreno.com.py as a
pre-declared **disabled vertical** of propia's engine. The founder has
decided otherwise: terreno.com.py runs as its **own app + own DB** in
`antonmarklundcom/terreno` (land-specific schema propia doesn't carry:
frente/fondo, esquina, estado_titulo, financiación, servicios, polygon;
different map-first UI). The `VERTICALS["terreno.com.py"]` entry therefore
stays `enabled: false` **permanently** — DNS for terreno.com.py points at
the terreno app, never at propia. Cross-posting happens by feed + importer
through the existing `normalize → dedup → upsert` pipeline; cross-posting
is just another import source. Items below are propia's half.

## Shared contract (what both sides agree on)

- **Wire = propia's `RawListing`** (`src/lib/import/types.ts`) minus
  `source`, plus extension keys (`publicId`, `slugText`, `contactName`,
  `landExtras`) that propia **ignores on intake** and **emits where it
  can** (propia can emit `publicId`/`slugText`/`contactName`; it has no
  data for `landExtras` — omit it). Unknown keys must never fail parsing.
- **No hashes on the wire.** Each side computes `content_hash` and
  `dedup_key` with `normalize.ts` (terreno runs a verbatim port), so
  dedup semantics are identical on both sides by construction.
- **Cross-system identity** = `(source, source_external_id)` where
  `source_external_id` is the **origin site's `public_id`**.
- **Shared-public_id rule:** a cross-posted listing keeps the origin's
  `public_id` and slug on both sites (see item 2c) — this is what makes
  the cross-domain canonical URL constructible without lookups.
- **Loop guard:** each site's feed exports only listings that have **no**
  `listing_sources` row from the cross-import source.
- **Cadence:** 15-min cron, full snapshot, published+venta only,
  absent-from-feed → pause (via `last_seen_at`), never delete.
- **Land set:** `property_type IN ('terreno','quinta')` (confirmed: the
  only land-shaped values in propia's enum).
- **Auth:** `Authorization: Bearer $FEED_SHARED_SECRET`, same secret both
  directions.

## Changes propia needs (in implementation order)

### 1. Schema: one enum value *(unblocks terreno M2 together with #2)*

`src/db/schema.ts` → `listingSources.source` enum: add `"import_terreno"`.
Same addition to `ListingSource` in `src/lib/import/types.ts`. Generate +
run the Drizzle migration (MySQL enum extension — additive, safe).

### 2. Feed endpoint *(unblocks terreno M2)*

New route `app/api/feed/terreno/route.ts` — `GET`, reject unless
`Authorization: Bearer ${process.env.FEED_SHARED_SECRET}` (401), then:

- Query: `listings` where `status='published'` AND `operation='venta'`
  AND `propertyType IN ('terreno','quinta')` AND `id NOT IN (SELECT
  listing_id FROM listing_sources WHERE source='import_terreno')`.
- Map each row → wire shape: `sourceExternalId: publicId`,
  `sourceUrl: 'https://propia.com.py' + listingUrl(listing)` (from
  `src/lib/urls.ts`), `operation`, `propertyType`, `title`,
  `descriptionEs`, `priceAmount: Number(priceAmount)`, `priceCurrency`,
  `landM2: Number(landM2)` (fall back to `areaM2` if `landM2` NULL),
  `locationFullSlug` (join `locations.fullSlug`), `locationName`,
  `lat`/`lng` as numbers, `contactPhone` (agent.whatsapp →
  agency.whatsapp → owner user's whatsapp, first non-null),
  `contactName` (same precedence, name), `imageUrls` (listing_images by
  position; r2Key passed through `imageUrl()` so it's a fetchable URL),
  `publicId`, `slugText: slug`.
- Envelope: `{ version: 1, site: 'propia.com.py', generatedAt, listings }`.
- No pagination (full snapshot; land volume is small). Set
  `cache-control: no-store`.

### 3. Importer: terreno as a source *(for terreno M3)*

`scripts/import-terreno.ts` (hPanel cron, 15 min, `npx tsx` — same pattern
as other jobs):

a. Fetch `${TERRENO_FEED_URL}` with the Bearer secret; validate
   `version === 1` (fail loudly otherwise — log + nonzero exit).
b. Adapt rows → `RawListing`: `source: 'import_terreno'`,
   `sourceExternalId: row.publicId`, rest passes through (drop
   `landExtras`/extension keys). All rows arrive `propertyType`
   `'terreno'|'quinta'` already.
c. Call the existing `importListings(db, rows, { publish: true })` —
   feed rows were already published at origin, so they skip
   `pending_review` (same trust level as white-glove batches). **One small
   change to `upsert.ts`:** `insertListing` gains optional overrides so
   branch (3) creates with the feed's identity instead of generating:
   ```ts
   // upsert.ts — insertListing(...): use raw.publicId / raw.slugText when provided
   const publicId = raw.publicId ?? makePublicId();
   const slug = raw.slugText ?? slugify(raw.title);
   ```
   (add `publicId?: string; slugText?: string` to `RawListing`; existing
   adapters simply don't set them). Branches (1) update and (2) dedup-attach
   need no changes.
d. Pause pass: propia listings whose **only** `listing_sources` row is
   `import_terreno` and whose `last_seen_at` < run start →
   `status='paused'`.
e. Log the `ImportReport` counters.

### 4. Canonical + sitemap rule *(for terreno M3 — needs founder sign-off)*

⚠️ This **amends ARCHITECTURE.md v2 amendment #1** ("listing detail pages
are canonical on propia from day one") for the land subset, and the
skill's "canonical on the primary domain only" rule. Founder has decided:
**terreno.com.py is canonical for all land listings** (exact-match domain
strategy — a land site that canonicalizes away can never rank). Record the
amendment in propia's ARCHITECTURE.md when implementing.

- On the listing detail page: when
  `propertyType IN ('terreno','quinta')`, emit
  `<link rel="canonical" href="https://terreno.com.py/terreno/${slug}-${publicId}">`
  instead of the self-canonical. Deterministic from propia's own row —
  no lookup — because of the shared-public_id rule (2c/3c).
- Sitemap generator: exclude those listings from the listing-detail
  chunk. Category/landing/guide pages unchanged (rule covers detail pages
  only).

### 5. Env additions

```bash
FEED_SHARED_SECRET=…          # same value configured on terreno
TERRENO_FEED_URL=https://terreno.com.py/api/feed/listings
```

### 6. Optional, any time

- `verticals.ts`: update the terreno entry's filter to
  `['terreno','quinta']` and comment that terreno.com.py is served by its
  own app (`antonmarklundcom/terreno`), entry stays `enabled: false`.
- `/publicar`: accept a query param (e.g. `?tipo=terreno`) to preselect
  property type — terreno's "Publicá tu terreno" link deep-links into it.
- Leads: **no changes required.** `leads.vertical` already attributes the
  capturing domain; land leads captured on propia stay in propia's
  pipeline. (Terreno's own DB adds an `origin_site` column on its side
  only.)

## What propia must NOT do

- Do not enable the terreno vertical or point terreno.com.py DNS at
  propia's app.
- Do not export listings that have an `import_terreno` source row (loop
  guard).
- Do not regenerate slug/public_id for terreno-origin listings on update
  (URL identity is a permanent SEO contract on both sites).

## Sequencing

1. **#1 + #2 + #5** → terreno M2 (inbound) can start.
2. **#3 + #4** → terreno M3 verifies both directions + canonicals
   end-to-end.
3. **#6** whenever convenient.
