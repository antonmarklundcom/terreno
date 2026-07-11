# Migration note for propia.node — terreno.com.py cross-posting

> Hand this file to a propia.node session. It lists the **minimal** changes
> propia needs so land listings flow both ways with terreno.com.py.
> Full context: `ARCHITECTURE.md` in `antonmarklundcom/terreno` (§3, §5, §7).
> Written without read access to propia.node — where this note guesses at
> propia internals it says so; the implementing session should map each item
> onto the real `src/db/schema.ts`, `src/config/verticals.ts` and existing
> importer machinery.

## Shared contract (summary)

- **Mechanism:** feed + importer, both directions, through the
  `listing_sources` dedup pipeline (`dedup_key` identity, `content_hash`
  change-skip). No shared database, no cross-DB writes.
- **Loop guard:** each site's feed exports **only its own-origin listings**
  (rows NOT created by an importer). Never re-export imports.
- **Identity:** `dedup_key = 'propia:{listing_id}'` / `'terreno:{listing_id}'`,
  immutable. `canonical_slug` travels in the feed and is reused verbatim by
  the importer (suffix on collision).
- **Cadence:** cron every 15 min, full-snapshot feeds (land volume is small),
  idempotent upserts. Absent-from-feed → pause locally, never delete.
- **Shared secret:** one `FEED_SHARED_SECRET` env var on both sites, sent as
  `Authorization: Bearer …`.

## Changes propia needs

### 1. Feed endpoint (required for terreno M2)

`GET /api/feed/terreno` — token-gated, returns published, propia-origin
listings with land property types only
(`property_type ∈ {terreno, quinta, …}` — take the exact land-adjacent set
from `src/config/verticals.ts`; that file is the source of truth).

Payload per listing (v1): `dedup_key`, `canonical_slug`, `content_hash`,
`status`, `tipo`, `titulo`, `descripcion`, `ubicacion` (departamento, ciudad,
barrio?, lat, lng), `superficie_m2`, `precio {monto, moneda}`, `frente_m?`,
`fondo_m?`, `esquina`, `servicios[]`, `estado_titulo`, `financiacion`,
`owner {tipo, nombre, telefono_wa, inmobiliaria?}`, `images[]`,
`updated_at` — wrapped in `{ version: 1, site, generated_at, listings }`.
If propia doesn't store some land field (e.g. `frente_m`, `esquina`), emit it
as null/absent; terreno tolerates gaps. `content_hash` = sha256 of the
normalized payload object (same normalization terreno uses — deterministic
key order, nulls stripped).

### 2. Importer source: terreno (required for terreno M3)

Register `terreno` as a new source in propia's existing ingest pipeline:
cron-fetch `https://terreno.com.py/api/feed/listings`, upsert via
`listing_sources` (`source='terreno'`, `dedup_key` from feed, skip on
unchanged `content_hash`, pause on absent). Map terreno `tipo` → propia
`property_type` (lote_urbano/terreno_comercial/loteamiento → terreno;
campo → campo?; quinta → quinta — align with verticals.ts). Imported
listings are flagged so they are **excluded from propia's own feed** (loop
guard) — reuse whatever origin/source marker the pipeline already has.

### 3. Canonical + sitemap rule (required for terreno M3)

One rule: **terreno.com.py is canonical for all land listings.**

- Propia land-listing **detail pages** emit
  `<link rel="canonical" href="https://terreno.com.py/terreno/{canonical_slug}">`
  (deterministic — the slug is shared via the feeds; for propia-origin
  listings it's propia's own slug).
- Exclude land-listing detail URLs from propia's sitemap. Browse/search/
  landing pages are untouched and stay self-canonical.

### 4. Leads: nothing structural

Leads are **not** synced. Propia keeps processing its own leads; if a land
lead is captured on propia, it stays in propia's pipeline with propia's
existing `leads.vertical` attribution. Optional (only if trivially cheap):
add `origin_site` alongside `vertical` for symmetry with terreno's schema.

### 5. Publishing: nothing

Propia's `/publicar` is the shared publish wizard — land listings published
there reach terreno via the feed automatically. Optional nice-to-have: accept
a query param to preselect a land property type, so terreno's "Publicá tu
terreno" link deep-links into the right step.

### 6. Env additions

```bash
FEED_SHARED_SECRET=…                                   # same value as terreno
TERRENO_FEED_URL=https://terreno.com.py/api/feed/listings
```

## Sequencing

1. Propia ships **#1 (feed)** → unblocks terreno M2 (inbound sync).
2. Propia ships **#2 (importer) + #3 (canonical/sitemap)** → terreno M3
   verifies both directions end-to-end.
3. #5 nice-to-have any time.

Each is small and independently deployable; #1 alone is enough to start.
