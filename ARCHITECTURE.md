# ARCHITECTURE — terreno.com.py

> **Status: PLAN, awaiting founder review. Supersedes the JetEngine/WordPress
> "Phase 2" direction described in the current README.** This document is the
> contract; when code and this file disagree, fix one of them in the same PR.
>
> terreno.com.py is the land-only sibling of **propia.com.py**
> (`antonmarklundcom/propia.node`). It follows the same playbook
> (`.claude/skills/listing-site-hostinger/SKILL.md` in propia.node) and reuses
> propia's proven patterns: `listing_sources` provenance with
> `content_hash` + `dedup_key`, a `crm.ts` CRM boundary, `leads.vertical`
> attribution, and rails-first milestones with STOP gates.

> ⚠️ **Verification note.** This plan was written without read access to
> propia.node (session repo scope denied the add). Every place where terreno
> must byte-for-byte match propia is marked **`[VERIFY vs propia.node]`**.
> Resolve all of these against propia's actual `SKILL.md`,
> `ARCHITECTURE.md`, `src/db/schema.ts`, `src/config/verticals.ts` and
> `src/lib/crm.ts` in the first implementation session — before M1 merges.

---

## 1. What this site is

A Paraguay land portal — **lotes, terrenos comerciales, campos, quintas,
loteamientos**. Three businesses in one:

1. **Listing portal** — brokers and owners list land (free at launch).
2. **Seller-acquisition funnel** — "Vendé tu terreno" valuation flow; our own
   commission business, the priority revenue path.
3. **Content + services hub** — guides and a directory (tasador, escribano,
   agrimensor).

Voice: **voseo es-PY**, WhatsApp-first. Land vocabulary only — never
dormitorios/baños; the facts that matter are **superficie, frente/fondo,
esquina, servicios, título al día (estado_titulo), financiación del
vendedor**. Prices US$ primary / Gs. secondary. Design: calm Scandinavian
minimalism, **map + key data are the hero; photos secondary**
(`docs/DESIGN_HANDOFF.md` is the design source of truth).

Maintained by a solo founder + Claude Code. Every architectural choice below
optimizes for **one person being able to debug it with curl at 11pm**.

## 2. Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | Next.js 15 (App Router) + TypeScript strict | Already built; SSR + ISR + route handlers — **never `output: 'export'`** |
| Styling | Tailwind CSS, tokens in `tailwind.config.ts` | Components read the theme, never hardcoded hex |
| Maps | MapLibre GL JS + Carto raster tiles | No API key, no billing |
| DB | **MySQL (Hostinger Cloud plan) + Drizzle ORM** | Terreno's **own database + own DB user** on the shared plan — never propia's DB (§4) |
| Validation | zod on every API input | Already the rule |
| CRM | GoHighLevel via `lib/crm.ts` boundary | Port of propia's `src/lib/crm.ts` pattern (§8) `[VERIFY vs propia.node]` |
| Hosting | Hostinger Cloud — **own Node.js app**, domain terreno.com.py | Same plan as propia, separate app + separate deploy |
| Cron | hPanel cron → token-gated route handlers | No long-running workers on managed Node |
| CI | GitHub Actions: lint + typecheck + test + build | Day-0 rails land in PR #1 (M0) |
| Node | 22.x LTS | Pin in CI and hPanel `[VERIFY vs propia.node SKILL.md for exact pin]` |

## 3. The one big decision: how the two sites share listings

### Requirement

- A land listing (`property_type ∈ {terreno, quinta, …land-adjacent}`
  `[VERIFY exact set vs propia's verticals.ts]`) published on propia.com.py
  must appear on terreno.com.py, and vice versa.
- Re-syncs must be idempotent — no duplicate-listing chaos.
- One founder operates both sites.

### Options weighed

**(a) Shared MySQL database** — both apps point at one Hostinger DB; terreno
reads `WHERE property_type IN ('terreno','quinta',…)`.

- ✅ Zero sync lag, zero sync code.
- ❌ **Schema coupling is the killer.** Propia's schema is owned by propia's
  Drizzle migrations. Every propia migration becomes a potential silent
  breaking change to terreno, discovered only in production, and forces
  lockstep deploys of two apps — the worst possible failure mode for a solo
  founder.
- ❌ Terreno→propia cross-posting means terreno **writes into propia's
  tables**, bypassing every invariant propia enforces in app code
  (slug rules, moderation state, dedup logic).
- ❌ Two apps × connection pools against one Hostinger MySQL user hits
  `max_user_connections` limits on shared plans; separate DBs with separate
  users isolate this.
- ❌ No blast-radius isolation: one bad migration or runaway query degrades
  both sites at once.

**(b) Feed + importer sync** — each site exposes a token-gated JSON feed of
its **own-origin** listings; the other site ingests it on a cron through the
`listing_sources` dedup pipeline (`content_hash` change detection,
`dedup_key` identity).

- ✅ **The feed is a versioned contract; the schemas stay decoupled.** Propia
  can migrate its internals freely as long as the feed keeps its shape.
- ✅ Idempotent by construction — this is exactly what propia's
  `listing_sources` pipeline was built for; cross-posting is "just another
  source". No new machinery, a proven one.
- ✅ Debuggable with `curl $FEED_URL | jq` — one founder can see the entire
  contract in one command.
- ✅ Failure isolation: if a feed is down, the other site serves stale
  cross-posted listings and keeps working.
- ❌ Sync lag = cron interval (15 min). Land listings change slowly;
  acceptable.
- ❌ Two crons to babysit. Mitigated: idempotent re-runs mean a missed tick
  costs nothing; a `/api/health` check reports last-sync age.

### Decision: **(b) Feed + importer, both directions.**

Schema decoupling and idempotency-by-construction outweigh 15 minutes of sync
lag for an asset class where listings live for months. Shared DB optimizes the
thing that doesn't matter (lag) at the cost of the thing that does (a solo
founder's ability to change either site without breaking the other).

### The honest question: should terreno be a separate repo at all?

The alternative — serve terreno.com.py as a **vertical of propia.node**
(host-based routing in one app, one DB, zero sync) — was seriously considered.
It eliminates this entire section: no feeds, no crons, no cross-domain
canonical juggling. If the two sites shared a design system and page
structure, it would win.

**Recommendation: keep the split**, for three reasons:

1. **The frontends diverge on purpose.** Terreno is map-first with
   land-specific facets (superficie, frente, esquina, estado_titulo,
   financiación); its cards, detail pages, search UX and copy are not
   propia's with a different logo. Host-based theming of genuinely different
   UIs in one App Router tree makes *every* future change to either site
   more expensive.
2. **Retrofit cost lands on propia.** Multi-domain routing (middleware host
   rewrites, per-host sitemaps/robots/canonicals, per-host ISR) is a
   structural refactor of the working, revenue-adjacent site — riskier than
   adding one read-only feed endpoint to it.
3. **Blast-radius isolation.** Separate deploys mean a broken terreno
   experiment never takes down propia, and vice versa.

**Reconsider the split if:** the two frontends converge to shared components,
or sync ops start eating real founder time, or a third vertical domain
appears (three sync meshes is where feeds stop scaling and a single
multi-domain app wins). This is a two-way door: the feed contract makes a
later merge *easier*, because listing identity (`dedup_key`) is already
global.

## 4. Data model

Terreno's **own MySQL database** (`terreno_prod`, own user) on the shared
Hostinger plan. Drizzle ORM, migrations in-repo. Small pool (≤5 connections,
mysql2) — Hostinger shared MySQL is connection-stingy.

Field naming and table shapes must align with propia's `src/db/schema.ts`
wherever the concept is shared, so the feed mapping stays mechanical
**`[VERIFY every table below vs propia.node schema before M1 merges]`**.

```
listings
  id (pk), slug (unique), origin ENUM('local','propia'),
  owner_type ENUM('broker','casa_propia'), owner_id (fk),
  tipo ENUM('lote_urbano','terreno_comercial','campo','quinta','loteamiento'),
  titulo, descripcion,
  departamento, ciudad, barrio?, lat, lng, polygon? (JSON),
  superficie_m2 (canonical unit — m², always),        -- precio_m2 is DERIVED, never stored
  precio_monto, precio_moneda ENUM('USD','PYG'),
  frente_m?, fondo_m?, esquina BOOL,
  servicios (JSON array), estado_titulo ENUM('con_titulo','en_proceso'),
  financiacion ENUM('contado','cuotas'),
  loteamiento_aggregate? (JSON),
  images (JSON array),
  featured_until? (unix ts — timestamp gating, not a boolean),
  status ENUM('published','paused','sold'),
  created_at, updated_at

listing_sources        -- provenance + idempotency; mirrors propia's table
  id (pk), listing_id (fk),
  source VARCHAR        -- 'seed' | 'admin' | 'propia'
  source_id VARCHAR     -- id in the source system
  dedup_key VARCHAR (unique)   -- global identity: '{origin_site}:{origin_id}'
  content_hash CHAR(64)        -- sha256 of the normalized feed payload
  first_seen_at, last_seen_at, last_changed_at

owners
  id (pk), nombre, telefono_wa, inmobiliaria?, tipo ENUM('broker','casa_propia')

leads
  id (pk), tipo_lead ENUM('listing_contact','valuation','service'),
  vertical VARCHAR DEFAULT 'terreno',   -- propia's leads.vertical pattern
  capture_site VARCHAR,                 -- 'terreno.com.py' (always, here)
  origin_site VARCHAR,                  -- listing's origin ('terreno.com.py' | 'propia.com.py')
  listing_id?, listing_dedup_key?,
  contacto (JSON), payload (JSON), source_page?,
  crm_status ENUM('pending','sent','failed'), created_at
```

The existing `lib/types.ts` `Listing` shape is kept as the app-facing domain
model (it already encodes every land-specific field correctly); the DB rows
map to it inside the repo seam. Add `origin: 'local' | 'propia'` to it.

### The data seam (unchanged rule, new source)

`lib/listings-repo.ts` stays the **sole** data-access point. M1 swaps its
`fetchSource()` from the seed array to MySQL; the seed remains a permanent
fallback (DB unreachable → site still renders). Nothing outside the repo
module may import `lib/seed/*` or the db client.

## 5. Cross-posting sync contract

Both sites implement the same two halves:

**Feed (outbound):** `GET /api/feed/listings` — token-gated
(`Authorization: Bearer $FEED_SHARED_SECRET`), returns a full snapshot
(land volume is small; snapshots beat pagination for idempotency):

```json
{ "version": 1, "site": "terreno.com.py", "generated_at": "...",
  "listings": [ {
      "dedup_key": "terreno:123", "canonical_slug": "lote-esquina-luque-360m2",
      "content_hash": "sha256:...", "status": "published",
      "tipo": "lote_urbano", "titulo": "...", "descripcion": "...",
      "ubicacion": {...}, "superficie_m2": 360, "precio": {...},
      "frente_m": 12, "esquina": true, "servicios": [...],
      "estado_titulo": "con_titulo", "financiacion": "cuotas",
      "owner": { "tipo": "broker", "nombre": "...", "telefono_wa": "..." },
      "images": [...], "updated_at": "..."
  } ] }
```

**Rules (both sites, non-negotiable):**

1. **A feed contains only `origin='local'` listings.** Imported listings are
   never re-exported — this is the loop/echo guard.
2. `dedup_key = '{origin_site_short}:{origin_listing_id}'` is the global
   identity, immutable for the life of the listing.
3. Importers upsert by `dedup_key`: unknown → insert; known +
   `content_hash` unchanged → touch `last_seen_at` only; known + hash changed
   → update. **Re-running a sync is always a no-op on unchanged data.**
4. Listings present locally (for that source) but absent from the feed →
   mark `status='paused'` (unpublished at origin), never hard-delete.
5. `canonical_slug` from the origin is used verbatim; on local collision,
   suffix `-2`, `-3`… (dedup_key still disambiguates identity).
6. Only land types cross to terreno: propia's feed filters
   `property_type ∈ {terreno, quinta, …}` `[VERIFY vs verticals.ts]`;
   terreno's listings are all land, so its feed sends everything local.
7. Feed `version` field; breaking changes bump it and importers refuse
   unknown majors loudly (health check, not silent skips).

**Importer (inbound):** `POST /api/sync/import` (token-gated), invoked by an
hPanel cron **every 15 min**. Pulls the sibling feed, runs the upsert above,
records `{fetched, inserted, updated, unchanged, paused}` counters readable at
`/api/health`.

## 6. URL scheme (unchanged — already built)

| Route | Rendering | Purpose |
| --- | --- | --- |
| `/` | SSG | Home: dual-path browse + sell |
| `/buscar` | SSR | Search — split map + list, URL-driven filters |
| `/terreno/[slug]` | SSG + ISR | Listing detail (map-first) |
| `/[tipo]/[departamento]` and `/[tipo]/[departamento]/[ciudad]` | SSG + ISR | Programmatic SEO landings |
| `/vender` | SSG + ISR | Seller/valuation funnel |
| `/guias`, `/guias/[slug]`, `/servicios` | SSG + ISR | Content hub |
| `/publicar` | SSG | Thin page → links to propia's `/publicar` (§9) |
| `/api/v1/listings…`, `/api/leads`, `/api/v1/leads` | handlers | Public API + lead intake |
| `/api/feed/listings` | handler | Outbound sync feed (token) |
| `/api/sync/import` | handler | Inbound importer (token, cron) |
| `/api/health` | handler | Uptime + last-sync age + counters |
| `/api/revalidate` | handler | Token-gated on-demand ISR, called by the importer after changes |

`[tipo]` slugs: `lotes` · `terrenos-comerciales` · `campos` · `quintas` ·
`loteamientos`. Landing pages with zero listings are `noindex`.

## 7. Canonical / SEO policy — one rule

**terreno.com.py is canonical for every land listing, on both sites,
regardless of where it was published.**

Rationale: terreno.com.py is an exact-match domain whose entire reason to
exist is owning land SERPs. "Canonical = origin site" would split link equity
arbitrarily by where the lister happened to click publish; "propia always"
would make terreno permanently unrankable and pointless. One deterministic
rule, no per-listing judgment.

Concretely:

- **terreno** listing detail pages: self-canonical
  (`https://terreno.com.py/terreno/{slug}`). All published listings in
  terreno's sitemap.
- **propia** land-listing detail pages: render normally (good UX, internal
  links intact) but emit cross-domain
  `<link rel="canonical" href="https://terreno.com.py/terreno/{slug}">` and
  are **excluded from propia's sitemap**. The mapping is deterministic
  because `canonical_slug` travels in the feed both ways.
- Browse/search/landing pages are site-specific content and stay
  self-canonical on each site — the rule applies to listing **detail** pages
  only.
- Cost acknowledged: propia cedes land-SERP presence to terreno. Same owner,
  and terreno converts better for land — that's the strategy, not a bug.

## 8. Leads & CRM boundary

**Rule: the capturing site processes the lead; leads are never synced between
sites.** Listings sync; leads don't.

- `lib/crm.ts` is the **only** module that talks to GHL — a port of propia's
  `src/lib/crm.ts` boundary `[VERIFY signatures vs propia.node]`. Everything
  else (route handlers, `lib/leads.ts` orchestrator) calls `crm.ts`; no GHL
  URL appears anywhere else.
- Every lead carries `vertical: 'terreno'` (propia's `leads.vertical`
  pattern) plus **`capture_site`** ('terreno.com.py' here) and
  **`origin_site`** (from the listing's `origin` — this is how the origin
  site gets attribution for leads on cross-posted listings). One GHL account,
  one land pipeline; the founder filters/reports by these fields.
- Existing routing table stays: `listing_contact` on a broker listing →
  broker's WhatsApp; `casa_propia` listings, valuation and service leads →
  our number/pipeline. Broker WhatsApp routing works identically for
  cross-posted listings because `owner.telefono_wa` travels in the feed.
- Existing resilience rules stay: fan-out via `Promise.allSettled` with
  retries; **logger/CRM failure never fails the user's WhatsApp action**;
  unset env vars self-disable. New: leads are also written to the local
  `leads` table (with `crm_status`) so nothing is lost when GHL is down.

## 9. Publishing

**Cheapest correct answer: reuse propia's `/publicar`. No wizard in this
repo.**

- terreno.com.py gets a thin `/publicar` page ("Publicá tu terreno gratis")
  that links to propia's wizard (pre-selecting a land type if propia's
  wizard supports a query param — nice-to-have, not required). The listing
  publishes into propia, and the M2 importer brings it to terreno within one
  cron tick.
- The **terreno→propia direction still exists and matters**: listings the
  founder creates directly in terreno (admin/CLI-seeded `origin='local'`
  rows — the casa_propia inventory) flow out through terreno's feed to
  propia's importer.
- Terreno's `/vender` valuation funnel is unchanged — that's a lead flow,
  not a publish flow.
- Build a native terreno wizard only if the funnel data ever proves land
  sellers bounce off the propia-branded wizard. Not before.

## 10. Environment variables

```bash
# minimum viable (site builds and runs on these alone — existing rule)
NEXT_PUBLIC_SITE_URL=https://terreno.com.py
NEXT_PUBLIC_WHATSAPP=5959…
NEXT_PUBLIC_BUSINESS_NAME=Terreno
NEXT_PUBLIC_FEATURE_FEATURED_BADGES=true

# M1
DATABASE_URL=mysql://terreno_user:…@localhost/terreno_prod

# M2/M3 sync
PROPIA_FEED_URL=https://propia.com.py/api/feed/terreno
FEED_SHARED_SECRET=…         # same secret both directions
SYNC_TOKEN=…                 # cron → /api/sync/import
REVALIDATE_TOKEN=…

# M4
GHL_WEBHOOK_URL=…            # consumed ONLY by lib/crm.ts
SHEETS_WEBHOOK_URL=…
```

Everything non-minimum self-disables when empty (existing rule, kept).
**Deleted: all `JETENGINE_*` vars.**

## 11. Audit of existing repo — keep / rewrite / delete

The repo contains a complete, well-built seed-powered frontend (PRs #1–#4).
This plan keeps most of it and kills the WordPress direction.

**KEEP (as-is):**
- `app/` routes, `components/`, `tailwind.config.ts`, `docs/DESIGN_HANDOFF.md`,
  `docs/Terreno.dc.html` — the design and pages are done and on-brand.
- `lib/types.ts` domain model (add `origin` field), `lib/format.ts`,
  `lib/slug.ts`, `lib/whatsapp.ts`, `lib/jsonld.ts`, `lib/validation.ts`,
  `lib/parse-body.ts`, `lib/seed/*` (seed becomes the permanent DB fallback +
  dev fixture).
- The data-seam rule and `lib/listings-repo.ts` public API (signatures
  unchanged).
- Lead routing rules and resilience behavior in `lib/leads.ts`.

**REWRITE:**
- `lib/listings-repo.ts` `fetchSource()` internals — M1: MySQL via Drizzle,
  seed fallback. Delete the JetEngine pseudo-code comment block.
- `lib/leads.ts` — M4: extract GHL calls into new `lib/crm.ts`; add
  `vertical`/`capture_site`/`origin_site` and local `leads`-table persistence.
- `README.md` — M1: remove all JetEngine/WordPress/"Phase 2" content
  (§"How the JetEngine swap will work", panel.terreno.com.py, WP Application
  Passwords, the Phase-2 list); point to this file as the contract.
- `.github/workflows/ci.yml` — M0: add lint + typecheck + test jobs (today it
  only builds).
- `app/api/revalidate/route.ts` — repurpose: caller is our importer, not a WP
  webhook.

**DELETE:**
- `JETENGINE_*` block in `.env.example`.
- Every remaining reference to JetEngine / panel.terreno.com.py / WP
  Application Passwords (`grep -rn jetengine -i` must return zero after M1).

**MISSING (added by M0 — day-0 rails the skill demands, absent today):**
- No ESLint config (`next lint` script exists but no eslint dep/config),
  no Prettier, no test runner, no tests, no lint/typecheck/test in CI,
  no `/api/health`, `devDependencies` is empty (build toolchain was moved to
  `dependencies` for Hostinger — keep that, it was learned the hard way in
  PR #3 `[VERIFY vs SKILL.md]`).

## 12. Milestones (sequential, each ends at a STOP gate)

Each milestone is one PR (or a small stack), CI green, founder reviews at the
STOP gate before the next begins. No milestone starts early.

### M0 — Rails + real deploy (PR #1 of this plan)
ESLint (flat config, next preset) + Prettier + Vitest with first real tests
(listings-repo filtering/facets, lead routing) + CI = lint → typecheck →
test → build. Add `/api/health`. **Deploy the current seed-powered site to
Hostinger** as its own Node.js app (hPanel → Git import, branch `main`,
Node 22.x, minimum-viable env vars), attach terreno.com.py, verify SSR/ISR
live. Delete `JETENGINE_*` from `.env.example`.
**STOP gate:** CI green on PR; https://terreno.com.py serves the seed site;
founder approves.

### M1 — MySQL + seam swap
Create `terreno_prod` DB + user in hPanel. Drizzle schema (§4) — **first
reconcile field names against propia's `src/db/schema.ts`** — migrations,
`scripts/import-seed.ts` (idempotent: seed rows get
`listing_sources.source='seed'`, dedup_key `seed:{id}`). Swap
`fetchSource()` to DB with seed fallback. Repo tests run against MySQL in CI
(service container). Rewrite README.
**STOP gate:** production renders from DB; killing the DB still renders the
site (fallback proven); seed import re-run = zero changes.

### M2 — Inbound sync: propia → terreno
Prereq: propia ships its feed (see `docs/PROPIA-MIGRATION.md` — hand to a
propia.node session first). Build `lib/sync/import.ts` + `/api/sync/import`
+ hPanel cron (15 min). Full dedup semantics of §5, type mapping
propia `property_type` → terreno `tipo`, ISR revalidate on change, sync
counters in `/api/health`. Tests: fixture feed → import twice → second run
all-unchanged; mutate one field → exactly one update.
**STOP gate:** a land listing published on propia.com.py appears on
terreno.com.py within 15 min; re-syncs create no duplicates (demonstrated in
prod, not just tests).

### M3 — Outbound feed + canonical/SEO contract
`/api/feed/listings` (token, `origin='local'` only, §5 shape). Terreno side
of §7: self-canonicals verified, sitemap = published listings + landings with
listings. (Propia's importer + canonical/sitemap changes happen in
propia.node per the migration note — coordinate, then verify end-to-end.)
**STOP gate:** a founder-created terreno listing appears on propia.com.py;
`curl` shows correct canonicals on both sites' detail pages; propia sitemap
contains no land detail URLs, terreno's contains all of them.

### M4 — CRM boundary + attribution
Port `lib/crm.ts` from propia's pattern. Leads persist locally, then fan out;
payload carries `vertical='terreno'`, `capture_site`, `origin_site`,
`listing_dedup_key`. Wire real `GHL_WEBHOOK_URL`.
**STOP gate:** test lead on a cross-posted (propia-origin) listing from
terreno.com.py lands in GHL with `origin_site='propia.com.py'` and correct
broker WhatsApp routing; a GHL outage does not break the WhatsApp button.

### M5 — Publishing link + es-PY copy audit
Thin `/publicar` → propia's wizard. Full copy pass: voseo everywhere
(publicá, vendé, encontrá), land vocabulary audit, WhatsApp CTA wording.
**STOP gate:** end-to-end demo — landowner publishes on propia → listing on
both sites → lead captured on terreno → GHL with attribution. Launch.

---

*Companion doc: `docs/PROPIA-MIGRATION.md` — the minimal changes propia.node
needs (feed endpoint, importer source, canonical/sitemap rule) to be handed
to a propia session before M2.*
