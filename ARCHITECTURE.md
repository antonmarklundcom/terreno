# ARCHITECTURE — terreno.com.py

> **Status: PLAN v2 (reconciled against propia.node @ `cdd2478`), awaiting
> founder review. Supersedes the JetEngine/WordPress "Phase 2" direction in
> the current README.** This document is the contract; when code and this
> file disagree, fix one of them in the same PR.
>
> terreno.com.py is the land-only sibling of **propia.com.py**
> (`antonmarklundcom/propia.node`). It follows propia's playbook
> (`.claude/skills/listing-site-hostinger/SKILL.md`, on branch
> `claude/panel-auth-admin-review-dashboard-v5190h` — not yet merged to
> propia main) and reuses propia's proven machinery: the
> `normalize → dedup → upsert` import pipeline, `listing_sources`
> provenance, the `crm.ts` CrmProvider boundary, `leads.vertical`
> attribution, and rails-first milestones with STOP gates.
>
> Companion: `docs/PROPIA-MIGRATION.md` — the exact changes propia.node
> needs for cross-posting (implementable from that note alone).

## 0. Reconciliation summary (v1 → v2)

Every `[VERIFY vs propia.node]` marker from v1 is resolved below. Three of
the original assumptions were **wrong**, not just unverified:

| # | v1 assumed | propia's reality | Consequence |
| --- | --- | --- | --- |
| **W1** | `dedup_key = '{origin_site}:{id}'` — a global cross-site identity | `dedup_key = sha1(canonPhone \| priceBucket($5k) \| areaBucket(10m²) \| locationId \| operation \| propertyType)` — a **site-local, deliberately fuzzy content identity**. Cross-system identity is the **unique `(source, source_external_id)` pair** | The whole §5 sync contract is rewritten. The feed carries no dedup keys at all; each side computes both hashes locally with the same ported algorithm (`normalize.ts`) |
| **W2** | `content_hash` = sha256 of the whole normalized payload, transmitted in the feed | `sha1(title\|priceUsd\|areaM2\|landM2\|bedrooms\|bathrooms\|descriptionEs\|propertyState)`, `char(40)`, **computed by the receiving importer**, never transmitted | Feed payload is raw fields only (propia's `RawListing` shape) |
| **W3** | Cross-posted identity travels as `canonical_slug`, suffix on collision | propia's URL identity is `public_id` (10-char) + cosmetic slug: `/propiedad/{slug}-{public_id}`; slug never recomputed | Replaced by the **shared-public_id rule** (§5.3, §7); terreno adopts the `{slug}-{public_id}` URL pattern before launch |

Also corrected (smaller): leads — propia's `vertical` **is** the capture
domain, so v1's separate `capture_site` column is redundant and dropped;
locations — the dedup key needs a `locations` hierarchy with `full_slug`,
so terreno adopts propia's locations table instead of denormalized
departamento/ciudad strings; price — terreno adopts propia's
`price_amount/price_currency/price_usd(write-normalized)` triple; status —
terreno adopts propia's full lifecycle enum; cron — hPanel cron runs
`npx tsx scripts/*.ts` directly (skill pattern), not token-gated HTTP
routes.

**Declared divergences from the playbook** (deliberate, with reasons):
**D1** two-repo split vs skill Rule 0 (§3), **D2** canonical policy for
land listings (§7), **D3** terreno-only land columns → lossy propia
round-trip (§4), **D4** `leadType` union extended with `service` (§8),
**D5** terreno's own `leads.origin_site` column (§8).

## 1. What this site is

A Paraguay land portal — **lotes, terrenos comerciales, campos, quintas,
loteamientos**. Three businesses in one:

1. **Listing portal** — brokers and owners list land (free at launch).
2. **Seller-acquisition funnel** — "Vendé tu terreno" valuation flow; our
   own commission business, the priority revenue path.
3. **Content + services hub** — guides and a directory (tasador, escribano,
   agrimensor).

Voice: **voseo es-PY**, WhatsApp-first, one canonical strings approach —
never neutral-Spanish variants. Land vocabulary only — never
dormitorios/baños; what matters is **superficie, frente/fondo, esquina,
servicios, título al día (estado_titulo), financiación del vendedor**.
Prices US$ primary / Gs. secondary. Design: calm Scandinavian minimalism,
**map + key data are the hero; photos secondary**
(`docs/DESIGN_HANDOFF.md` is the design source of truth).

Maintained by a solo founder + Claude Code. Every choice below optimizes
for **one person being able to debug it with curl at 11pm**.

**Model policy** (matching propia's): **Fable 5** — architecture, schema,
the expensive-to-unwind problems, STOP-gate reviews. **Opus 4.8** — heavy
implementation (DB layer, sync pipeline, CRM boundary). **Sonnet 5** —
templated work (pages, forms, copy wiring). Every milestone ends in a STOP
gate the founder clears; no session starts the next milestone past a gate.

## 2. Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | Next.js 15 (App Router) + TypeScript strict | Already built; SSR + ISR + route handlers — **never `output: 'export'`** |
| Styling | Tailwind CSS, tokens in `tailwind.config.ts` | Components read the theme, never hardcoded hex |
| Maps | MapLibre GL JS + free Carto/OSM raster tiles | No API key, no billing |
| DB | **MySQL 8 (Hostinger plan) + Drizzle ORM** | Terreno's **own database + own DB user** — never propia's DB (§3). No stored procs, no MySQL-only JSON tricks: the Postgres escape hatch stays open (propia rule) |
| Local dev DB | `docker-compose.yml` MySQL 8 + documented no-DB verify path | Skill day-0 item; cloud sessions may lack Docker → unit tests over pure logic + `next build` must suffice |
| Validation | zod on every API input | Existing rule |
| CRM | GoHighLevel via `lib/crm.ts` (`CrmProvider` interface) | Port of propia's `src/lib/crm.ts` incl. ConsoleCrm dev fallback (§8) |
| Hosting | Hostinger Cloud — **own Node.js app**, domain terreno.com.py | Same plan as propia, separate app + deploy. Brazil/São Paulo region |
| DB pool | mysql2, `connectionLimit: 8` max | Hostinger caps concurrent MySQL connections per user (skill) |
| Cron | hPanel cron → `npx tsx scripts/<job>.ts` | Skill pattern; every job idempotent + re-runnable |
| Images | Feed image URLs stored as-is, display-only (v1) | Mirrors propia's interim r2Key-holds-URL pattern; R2 pass later if terreno hosts own uploads |
| CI | lint + typecheck + test + build + `npm audit --audit-level=high` | Day-0 rails, PR #1 (M0); skill's exact workflow shape |
| Node | 22.x LTS | Pinned in CI and hPanel |

## 3. The one big decision: how the two sites share listings

### Requirement

- A land listing published on propia.com.py must appear on
  terreno.com.py and vice versa. Land-adjacent set **confirmed against
  propia's `property_type` enum: `['terreno','quinta']`** (propia has no
  campo/lote/loteamiento types — mapping in §5.4).
- Re-syncs idempotent — no duplicate-listing chaos.
- One founder operates both sites.

### ⚠️ DIVERGENCE D1 — the playbook says don't build this

This must be stated plainly. Propia's skill file, Rule 0:

> "Same inventory domain, different slice/brand (terreno.com.py = propia's
> terrenos…) → **it's a vertical config flip in the existing repo**…
> Never fork the repo for these."

and its "Connecting multiple domains" section:

> "do NOT stand up a second app that 'fetches' listings from the first. A
> second deployment sharing data means an internal API, auth between apps,
> cache/sync drift, and double ops."

Propia's own ARCHITECTURE.md (v2 amendments) dropped the terreno beachhead
and pre-declared `terreno.com.py` in `src/config/verticals.ts` as a
**disabled vertical** (`filters: {property_type:["terreno"]}, copy:"land",
enabled:false`) — i.e. propia's standing plan was to serve terreno.com.py
from propia's engine as a config flip.

**This plan overrides that, per the founder's explicit decision**, on these
grounds:

1. **Terreno is closer to the skill's "different schema → new repo" branch
   than to a pure slice.** Propia's listings table cannot represent what
   makes a land portal good: no `frente_m`/`fondo_m`, no `esquina`, no
   `estado_titulo`, no `financiacion`, no `servicios` facets, no parcel
   `polygon`. Terreno's tipo taxonomy (lote urbano / campo / quinta /
   loteamiento) collapses to two propia enum values. A vertical flip would
   ship a land site that can't filter on frente or título al día.
2. **The frontends diverge on purpose** — map-first cards, land facets,
   a services/guides hub. Host-based theming of genuinely different UIs in
   one App Router tree taxes every future change to either site.
3. **Blast-radius isolation** for a solo founder: a broken terreno deploy
   never takes down propia (the revenue site), and vice versa.

The skill's costs are real and accepted knowingly: sync machinery (bounded
— it's propia's proven pipeline reused), a shared secret between apps,
~15 min content lag, double deploy ops.
**Reconsider triggers:** propia grows the land-specific columns; the
frontends converge; sync debugging eats founder time; a third
cross-posting domain appears. The shared-public_id rule (§5.3) keeps a
later merge cheap.

Consequence for propia: its `verticals.ts` terreno entry **stays
`enabled: false` permanently**; terreno.com.py DNS points at the terreno
app. (Unknown/disabled hosts on propia's middleware resolve to propia, so
nothing breaks if DNS ever misroutes.)

### Mechanism, weighed

**(a) Shared MySQL database** — rejected: every propia Drizzle migration
becomes a silent breaking change to terreno with forced lockstep deploys;
terreno writing into propia's tables bypasses propia's app-level invariants
(review queue, slug/public_id discipline, dedup); two apps against one DB
user compound Hostinger's per-user connection cap; no blast-radius
isolation.

**(b) Feed + importer (chosen)** — each site exposes a token-gated JSON
feed of its **own-origin published** land listings in propia's `RawListing`
wire shape; the other ingests on a 15-min cron through the **same
`normalize → dedup → upsert` pipeline propia already runs** for
InfoCasas/Clasipar/white-glove. Cross-posting is literally one more import
source. Schemas stay decoupled behind a versioned wire contract; re-runs
are idempotent by construction (propia's M2 gate: "importer re-runs produce
zero duplicates"); the whole contract is debuggable with
`curl -H "Authorization: Bearer …" $FEED | jq`.

## 4. Data model

Terreno's **own MySQL database** (`terreno_prod`, own user) on the shared
Hostinger plan. Drizzle ORM, migrations in-repo. Names below are the
**confirmed propia conventions** adopted wherever the concept is shared,
so feed mapping stays mechanical.

```
listings                          -- wide + denormalized, propia pattern
  id (bigint pk), public_id CHAR(10) UNIQUE,   -- URL identity, propia's makePublicId()
  slug VARCHAR(180),                            -- cosmetic, never recomputed
  origin ENUM('local','propia'),                -- who authored it (feed loop guard, §5.2)
  tipo ENUM('lote_urbano','terreno_comercial','campo','quinta','loteamiento'),
  status ENUM('draft','pending_review','published','paused','sold','removed'),
                                                -- propia lifecycle (minus 'rented'; land v1 is venta-only)
  title VARCHAR(180), description_es TEXT,
  price_amount DECIMAL(14,2), price_currency ENUM('USD','PYG'),
  price_usd DECIMAL(12,2),                      -- normalized AT WRITE TIME; ALL filtering uses it (propia rule)
  superficie_m2 DECIMAL(12,2),                  -- canonical unit m²; ↔ propia listings.land_m2
  frente_m, fondo_m DECIMAL(8,2)?,              -- terreno-only (D3)
  esquina BOOL,                                 -- terreno-only (D3)
  servicios JSON,                               -- display+facet; terreno-only (D3)
  estado_titulo ENUM('con_titulo','en_proceso')?,   -- terreno-only (D3); NULL for imports
  financiacion ENUM('contado','cuotas')?,           -- terreno-only (D3); NULL for imports
  loteamiento_aggregate JSON?,
  location_id fk NOT NULL,                      -- deepest known level (propia pattern)
  lat DECIMAL(9,6)?, lng DECIMAL(9,6)?, polygon JSON?,
  owner_id fk,                                  -- → owners
  images JSON,                                  -- URL list, display-only v1
  featured_until DATETIME?,                     -- site-local monetization; NEVER synced
  published_at, created_at, updated_at
  INDEX idx_search (status, tipo, location_id, price_usd)
  INDEX idx_geo (status, lat, lng)

locations                         -- propia's hierarchy table, same shape
  id, parent_id, level ENUM('pais','departamento','ciudad','barrio'),
  name, slug, full_slug UNIQUE,                 -- 'central/luque' — feed location key (§5)
  lat?, lng?, listing_counts JSON               -- cached; powers facets + thin-page rule

listing_sources                   -- byte-for-byte propia's table
  id, listing_id fk,
  source ENUM('seed','manual','import_propia'),
  source_url VARCHAR(600)?, source_external_id VARCHAR(120)?,
  content_hash CHAR(40),                        -- sha1, computed by OUR importer (normalize.ts port)
  dedup_key CHAR(40),                           -- sha1(phone|price_bucket|m2_bucket|location_id|operation|tipo)
  first_seen_at, last_seen_at                   -- absent-from-feed → pause via last_seen_at
  UNIQUE uq_source (source, source_external_id)
  INDEX idx_dedup (dedup_key)

owners
  id, nombre, telefono_wa, inmobiliaria?, tipo ENUM('broker','casa_propia')

leads                             -- propia's shape + terreno extensions
  id, lead_type ENUM('buyer','seller','valuation','service'),   -- D4: 'service' is terreno-only
  vertical VARCHAR(40) DEFAULT 'terreno',       -- propia semantics: the CAPTURING domain
  origin_site VARCHAR(40)?,                     -- D5: listing's origin ('terreno'|'propia') for cross-post attribution
  listing_id fk?, name?, whatsapp NOT NULL, email?, message?, utm JSON?,
  routed_to ENUM('agent','internal'),           -- propia enum subset: broker→'agent', casa_propia/valuation/service→'internal'
  ghl_contact_id VARCHAR(80)?,                  -- set from the GHL webhook response (propia pattern)
  created_at
```

**DIVERGENCE D3 (accepted):** the terreno-only columns (frente, fondo,
esquina, servicios, estado_titulo, financiacion, polygon) do not exist in
propia's schema. Propia-origin listings arrive with them NULL (UI renders
gaps gracefully); terreno-origin listings lose them on propia (propia shows
its normal card). Round-trip is lossy for these fields, by design — the
alternative is growing propia's schema, which is propia's call, not ours.

`lib/types.ts`'s `Listing` stays the app-facing domain model (add `origin`,
`publicId`; ubicacion names resolve from `locations`). The **data seam rule
is unchanged**: `lib/listings-repo.ts` is the sole data-access point; M1
swaps its `fetchSource()` to MySQL; the typed seed remains a permanent
fallback (DB down → site still renders). Nothing else imports `lib/seed/*`
or the db client.

## 5. Cross-posting sync contract (rewritten post-reconciliation)

### 5.1 Wire format = propia's `RawListing`

Each site exposes `GET /api/feed/listings` — `Authorization: Bearer
$FEED_SHARED_SECRET` — a full snapshot (land volume is small; snapshots
maximize idempotency) of **own-origin, `status='published'`,
`operation='venta'`** land listings:

```jsonc
{ "version": 1, "site": "terreno.com.py", "generatedAt": "…",
  "listings": [ {
      // ---- exactly propia's RawListing fields (src/lib/import/types.ts),
      // ---- minus `source` (the importer sets its own):
      "sourceExternalId": "k3j9x2m4qa",       // = origin public_id (identity within the source)
      "sourceUrl": "https://terreno.com.py/terreno/lote-esquina-luque-k3j9x2m4qa",
      "operation": "venta",
      "propertyType": "terreno",              // WIRE VOCABULARY IS PROPIA'S ENUM (§5.4)
      "title": "…", "descriptionEs": "…",
      "priceAmount": 45000, "priceCurrency": "USD",
      "landM2": 360,                           // ← terreno superficie_m2
      "locationFullSlug": "central/luque",     // resolved to each side's own location_id
      "locationName": "Luque",
      "lat": -25.27, "lng": -57.49,
      "contactPhone": "595981123456",          // feeds dedup_key; feed is token-gated
      "imageUrls": ["…"],
      // ---- extensions (receivers ignore unknown keys):
      "publicId": "k3j9x2m4qa", "slugText": "lote-esquina-luque",
      "contactName": "Inmo García",
      "landExtras": { "frenteM": 12, "fondoM": 30, "esquina": true,
        "servicios": ["agua","energia"], "estadoTitulo": "con_titulo",
        "financiacion": "cuotas", "tipoTerreno": "lote_urbano" }
  } ] }
```

No hashes travel on the wire (**W1/W2 fix**): each importer computes
`content_hash` and `dedup_key` locally with a **verbatim port of propia's
`src/lib/import/normalize.ts`** (`canon`, `canonPhone`, `toPriceUsd`,
`priceBucket` $5k, `areaBucket` 10m², `contentHash`, `dedupKey`) — same
sha1 recipes on both sides, so a listing that reaches a site through two
paths (e.g. scraped by propia from Clasipar AND cross-posted from terreno)
collapses via `dedup_key` exactly like any other multi-source listing.
`landExtras` is **excluded from `contentHash`** on the propia side by
construction (propia's hash doesn't know those fields); terreno's port
keeps the hash recipe identical so change-detection agrees on both sides —
land-extras-only edits therefore don't re-publish on propia, which is
correct (propia can't render them anyway).

### 5.2 Importer semantics = propia's `upsert.ts` decision tree, verbatim

Per feed row (`source='import_propia'` on terreno, `'import_terreno'` on
propia):

1. **`(source, source_external_id)` already seen?** → `content_hash`
   identical: bump `last_seen_at` only *(unchanged)*; changed: update the
   source-controlled listing fields + hash *(updated)*.
2. **Else `dedup_key` matches an existing listing (any source)?** → attach
   a new `listing_sources` row to that listing, don't create *(deduped)*.
3. **Else create** + source row *(created)* — with `publish: true`
   (feed rows were already reviewed/published at origin; skipping
   `pending_review` mirrors propia's trusted-batch option).

**Pause pass** (after each run): listings whose *only* source is the
cross-import source and whose `last_seen_at` predates this run →
`status='paused'` (unpublished at origin). Never hard-delete.

**Loop guard:** each feed exports only listings with **no**
`listing_sources` row from the cross-import source. (Edge accepted: a
propia-scraped listing that dedup-matches an inbound terreno row gains an
`import_terreno` source row and drops out of propia's feed — safe
direction: no echo, no duplicate.)

**Runner:** `scripts/sync-import.ts`, hPanel cron every 15 min (skill
pattern — direct `npx tsx`, not an HTTP route). Idempotent; writes
`{created,updated,unchanged,deduped,skipped,paused}` counters to a
`sync_runs` log table surfaced at `/api/health`. On change, ping
`/api/revalidate` (token) for ISR.

### 5.3 Shared-public_id rule (W3 fix)

Cross-posted listings **keep the origin's `public_id` and slug on both
sites**. Terreno's importer inserts with the feed's `publicId`/`slugText`;
propia's importer does the same (one-line `insertListing` override — see
migration note). This makes every canonical URL **deterministically
constructible from either site's own row** (§7) with propia's
`urls.ts`-style builder — no lookup tables, no collision suffixes
(public_id collisions are ~nil by construction).

### 5.4 Type mapping (propia enum ⇄ terreno tipo)

| terreno tipo → wire `propertyType` | wire → terreno tipo |
| --- | --- |
| `lote_urbano`, `terreno_comercial`, `campo`, `loteamiento` → `terreno` | `terreno` → `landExtras.tipoTerreno` when present; else heuristic: `landM2 ≥ 10 000` → `campo`, else `lote_urbano` |
| `quinta` → `quinta` | `quinta` → `quinta` |

Propia's feed filter is `propertyType IN ('terreno','quinta')` — the
confirmed land-adjacent set (propia's enum has nothing else land-shaped).
Inbound owner mapping: `contactName`/`contactPhone` → `owners` row,
`tipo='broker'` default (FSBO-vs-broker isn't knowable from the wire;
broker routing is the safe default — leads go to the listed contact).

## 6. URL scheme

Change from the built v1: listing detail adopts propia's
identity pattern **before launch** (permanent SEO contract, cheap now,
impossible later):

| Route | Rendering | Purpose |
| --- | --- | --- |
| `/` | SSG | Home: dual-path browse + sell |
| `/buscar` | SSR | Search — split map + list, URL-driven filters |
| **`/terreno/{slug}-{publicId}`** | SSG + ISR | Listing detail (was `/terreno/[slug]`); parse/build in `lib/urls.ts` — one file, propia pattern |
| `/[tipo]/[departamento]` · `/[tipo]/[departamento]/[ciudad]` | SSG + ISR | Programmatic SEO landings (tipos pluralized: lotes, campos, quintas, loteamientos, terrenos-comerciales) |
| `/vender` | SSG + ISR | Seller/valuation funnel |
| `/guias`, `/guias/[slug]`, `/servicios` | SSG + ISR | Content hub |
| `/publicar` | SSG | Thin page → propia's `/publicar` (§9) |
| `/api/v1/listings…`, `/api/leads`, `/api/v1/leads` | handlers | Public API + lead intake |
| `/api/feed/listings` | handler | Outbound sync feed (Bearer token) |
| `/api/health` | handler | Uptime + last-sync age + run counters |
| `/api/revalidate` | handler | Token-gated ISR, pinged by `scripts/sync-import.ts` |

Landing pages with zero listings stay `noindex` (v1 rule; graduate to
propia's full indexability rule — count ≥ 3 → index+sitemap, 1–2 →
noindex,follow, 0 → 410/parent — in ONE module consumed by both templates
and sitemap, per the skill).

## 7. Canonical / SEO policy — one rule (DIVERGENCE D2)

**terreno.com.py is canonical for every land listing, on both sites,
regardless of where it was published.**

- **terreno** detail pages: self-canonical
  (`https://terreno.com.py/terreno/{slug}-{publicId}`); all published
  listings in terreno's sitemap.
- **propia** detail pages where `propertyType ∈ ('terreno','quinta')`:
  render normally, emit cross-domain
  `<link rel="canonical" href="https://terreno.com.py/terreno/{slug}-{public_id}">`
  — constructible from propia's **own** row thanks to the shared-public_id
  rule — and drop out of propia's sitemap. Browse/category/guide pages on
  both sites stay self-canonical (the rule covers detail pages only).

This **amends propia's stated policy** ("listing detail pages exist
canonically on propia.com.py only" / skill: "canonical on the primary
domain only"). The skill's rule assumed feeder domains are doors on
propia's engine; terreno is instead the primary brand *for land*, and an
exact-match domain that canonicalizes its inventory away can never rank —
defeating its reason to exist. Same owner, one deterministic rule, no
duplicate-content exposure. Cost accepted: propia cedes land-detail SERPs
to terreno. This needs explicit sign-off in the propia repo (migration
note item 4) since it edits propia's contract.

Per-domain launch checklist from the skill applies to terreno at M0:
DNS → hPanel domain + SSL → distinct copy → verify canonicals → submit
terreno's sitemap in its own Search Console property.

## 8. Leads & CRM boundary

**Rule: the capturing site processes the lead; leads are never synced.**
Listings sync; leads don't. Land leads captured on propia stay in propia's
pipeline (its `vertical` column already attributes the capturing domain —
confirmed semantics: "which domain captured it").

- `lib/crm.ts` is a **port of propia's `src/lib/crm.ts`**: the
  `CrmProvider` interface (`pushLead(lead): Promise<CrmResult>`,
  `sendOtp(whatsapp, code)` — kept for interface compatibility even though
  terreno v1 has no OTP flow), `GhlProvider` posting
  `{event:'lead', …payload}` to `GHL_WEBHOOK_URL`, **`ConsoleCrm` fallback
  when the env var is unset** (dev needs no GHL), `CrmResult.contactId` →
  `leads.ghl_contact_id`. Nothing outside this file knows GHL exists.
- Payload = propia's `LeadPayload` shape (name/whatsapp/email/message/utm,
  `listing: {publicId, title, url, priceUsd, operation}`), with
  `vertical: 'terreno'` and two declared extensions: **D4** `leadType`
  union adds `'service'` (terreno's services directory; propia's enum
  lacks it — stays terreno-local, GHL just receives the string) and
  **D5** `originSite` (`'terreno' | 'propia'`, from the listing's
  `origin`) — the cross-post attribution the founder filters GHL by.
  `routedTo`: broker listings → `'agent'`, everything else → `'internal'`
  (propia's enum values).
- Propia's ordering adopted: **DB row first** (source of truth for the
  money report), then `pushLead`. Existing terreno resilience rules stay:
  CRM/logger failure never fails the user's WhatsApp action; broker
  `listing_contact` → broker's WhatsApp, casa_propia/valuation/service →
  our number. Cross-posted listings route identically because
  `contactPhone` travels in the feed.
- Sheets fan-out stays in the `lib/leads.ts` orchestrator (it's a logger,
  not a CRM; doesn't belong behind the CrmProvider interface).

## 9. Publishing

**Reuse propia's `/publicar` wizard. No wizard in this repo.** Terreno's
`/publicar` is a thin voseo page linking to propia's wizard (optional
query param to preselect a land type — migration note item 6). The listing
publishes into propia, clears propia's review queue, and the M2 importer
lands it on terreno within one cron tick. The terreno→propia direction
still exists for founder-created `origin='local'` inventory (admin/CLI —
the casa_propia stock) via terreno's feed. `/vender` (valuation funnel)
is unchanged — a lead flow, not a publish flow. Build a native wizard only
if funnel data proves land sellers bounce off the propia-branded one.

## 10. Environment variables

```bash
# minimum viable (site builds and runs on these alone — existing rule)
NEXT_PUBLIC_SITE_URL=https://terreno.com.py
NEXT_PUBLIC_WHATSAPP=5959…
NEXT_PUBLIC_BUSINESS_NAME=Terreno
NEXT_PUBLIC_FEATURE_FEATURED_BADGES=true

# M1
DATABASE_URL=mysql://terreno_user:…@…/terreno_prod
USD_TO_PYG=7300                  # write-time price_usd normalization (propia pattern)

# M2/M3 sync
PROPIA_FEED_URL=https://propia.com.py/api/feed/terreno
FEED_SHARED_SECRET=…             # same value both sites, both directions
REVALIDATE_TOKEN=…

# M4
GHL_WEBHOOK_URL=…                # consumed ONLY by lib/crm.ts (unset → ConsoleCrm)
SHEETS_WEBHOOK_URL=…
```

Non-minimum vars self-disable when empty (existing rule).
**Deleted: all `JETENGINE_*` vars.**

## 11. Audit of existing repo — keep / rewrite / delete

**KEEP:** `app/` routes and `components/` (design done, on-brand),
`docs/DESIGN_HANDOFF.md`, `docs/Terreno.dc.html`, `tailwind.config.ts`,
`lib/format.ts`, `lib/whatsapp.ts`, `lib/jsonld.ts`, `lib/validation.ts`,
`lib/parse-body.ts`, `lib/seed/*` (becomes DB fallback + fixtures), the
data-seam rule and `listings-repo.ts` public signatures, lead routing
rules and resilience behavior.

**REWRITE:**
- `lib/listings-repo.ts` internals — M1: Drizzle/MySQL, seed fallback;
  delete the JetEngine pseudo-code block.
- `lib/types.ts` — add `origin`, `publicId`; price triple; status enum.
- `lib/slug.ts` → `lib/urls.ts` — one-file build+parse incl.
  `listingUrl({slug, publicId})` and `parseListingPublicId` (propia
  pattern); `/terreno/[slug]` route param handling updated.
- `lib/leads.ts` — M4: extract GHL into `lib/crm.ts` port; DB-first lead
  row; payload per §8.
- `README.md` — M1: purge all JetEngine/WordPress/panel.terreno.com.py
  content; point here.
- `.github/workflows/ci.yml` — M0: typecheck + lint + test + build +
  `npm audit --audit-level=high` (skill's exact job).
- `app/api/revalidate/route.ts` — caller is our sync script, not a WP
  webhook.

**DELETE:** `JETENGINE_*` env block; every JetEngine/WP reference
(`grep -rni jetengine` returns zero after M1).

**MISSING (M0 adds — skill day-0 items absent today):** ESLint flat
config (`next lint` currently unconfigurable), Prettier, vitest + first
pure-logic tests, `docker-compose.yml` (local MySQL 8), audit step in CI,
`/api/health`, seed CSV + idempotent importer story, SessionStart/no-DB
verify path for cloud sessions. Keep build toolchain in `dependencies`
(hard-won Hostinger lesson, PR #3).

## 12. Milestones (sequential, STOP gates, no dates)

### M0 — Rails + real deploy *(Sonnet 5; Fable 5 reviews the gate)* — PR #1
ESLint flat config + Prettier + vitest with first pure-logic tests
(**urls build/parse, price normalization, the normalize.ts port:
canon/canonPhone/buckets/hashes — these test files ARE the no-DB verify
path**) + CI per skill + `docker-compose.yml` + `/api/health`. Deploy the
current seed-powered site to Hostinger as its own Node.js app (git deploy,
Node 22, Brazil region), attach terreno.com.py + SSL. Delete `JETENGINE_*`.
**STOP:** CI green; site live on the domain; deploys boring.

### M1 — Schema live + seam swap *(Opus 4.8)*
`terreno_prod` DB + user; Drizzle schema per §4; `locations` seeded
(propia's OSM/GeoNames × Tu Lugar approach — or a one-off export of
propia's locations rows, coordinated); seed-listing importer
(`source='seed'`, idempotent); `fetchSource()` → DB with seed fallback;
URL migration to `{slug}-{publicId}`; README rewrite.
**STOP (propia's 10x rule):** schema reviewed against every UI element and
page type; production renders from DB; DB kill → seed fallback proven;
seed re-import = zero changes.

### M2 — Inbound sync: propia → terreno *(Opus 4.8)*
Prereq: propia ships migration-note items 1–2 (enum value + feed).
Verbatim ports of `normalize.ts` + the `upsert.ts` decision tree; feed
adapter; pause pass; `scripts/sync-import.ts` + 15-min hPanel cron;
counters in `/api/health`; ISR revalidate on change. Tests: fixture feed
imported twice → second run all-unchanged; one mutated field → exactly one
update; dedup-collision fixture → attach, not create.
**STOP:** a land listing published on propia appears on terreno within
15 min **in production**; re-syncs create zero duplicates; pausing at
origin pauses the copy.

### M3 — Outbound feed + canonical contract *(Opus 4.8)*
`/api/feed/listings` (§5.1, loop guard); `lib/urls.ts` canonical builder;
self-canonicals + sitemap on terreno. Propia lands migration-note items
3–4; verify both directions end-to-end.
**STOP:** founder-created terreno listing appears on propia; `curl` shows
correct canonicals on both sites' detail pages; propia's sitemap has no
land detail URLs; terreno's has all of them; both Search Console
properties registered.

### M4 — CRM boundary + attribution *(Opus 4.8)*
`lib/crm.ts` port (CrmProvider/GhlProvider/ConsoleCrm); DB-first lead rows;
payload per §8 with `originSite`; wire real `GHL_WEBHOOK_URL`.
**STOP:** test lead on a propia-origin listing captured on terreno lands in
GHL with `vertical='terreno'`, `originSite='propia'`, correct broker
WhatsApp routing; GHL outage doesn't break the WhatsApp button.

### M5 — Publishing link + es-PY copy audit *(Sonnet 5)*
Thin `/publicar` → propia wizard; full voseo pass (publicá, vendé,
encontrá); land-vocabulary audit; WhatsApp CTA wording.
**STOP → LAUNCH:** end-to-end demo — publish on propia → live on both
sites → lead on terreno → GHL with attribution.
