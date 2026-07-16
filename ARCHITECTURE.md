# ARCHITECTURE — terreno.com.py

> **Authored by Fable 5 (planning/architecture model) for handoff to
> Sonnet 5 / Opus 4.8 build sessions.** Last revised 2026-07-16, after
> founder review of M0–M1 and the CRM/admin scope decision (§8).
>
> **Status: CONTRACT + LIVE. M0 and M1 are shipped (PRs #5–#7) and the site
> is live on Hostinger.** This document is the contract; when code and this
> file disagree, fix one of them in the same PR. Supersedes the old
> JetEngine/WordPress direction (removed in M1).
>
> terreno.com.py is the land-only sibling of **propia.com.py**
> (`antonmarklundcom/propia.node`). It follows the shared playbook — vendored
> in this repo at `.claude/skills/listing-site-hostinger/SKILL.md` — and
> reuses propia's proven patterns: `listing_sources` provenance with
> `content_hash` + `dedup_key`, a `crm.ts` CRM boundary, `leads.vertical`
> attribution, and rails-first milestones with STOP gates.
>
> The original schema `[VERIFY vs propia.node]` flags were **resolved in
> M1**: `lib/db/schema.ts` was reconciled against propia's real
> `src/db/schema.ts` (see PR #7). Still open: the exact land-type set from
> propia's `verticals.ts` (§3, §5 rule 6) — resolved by the propia session
> that implements `docs/PROPIA-MIGRATION.md`.

## 0. Model tiering — who does what

One rule for every future session in this repo:

| Model | Use for | Never for |
| --- | --- | --- |
| **Fable 5** | Architecture, spec/schema decisions, cross-repo contract changes (feed shape, canonical rule), gap analysis, milestone STOP-gate reviews, revising this document | Routine implementation — don't burn Fable time on mechanical build work |
| **Opus 4.8** | The hardest single problems: sync dedup/upsert semantics (M4), admin auth, anything where a subtle bug corrupts data | Templated page/CRUD work |
| **Sonnet 5** | Everything else — most milestone build sessions, pages, CRUD, copy, tests, wiring | Changing this contract or the feed/canonical contract |

Each milestone below names its default model. A build session that discovers
the contract is wrong stops and escalates to a Fable session rather than
improvising.

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
| CRM / leads | **Local-first**: leads persist to terreno's own `leads` table + founder admin backend (§8, §8b) | GHL stays an optional, env-gated adapter behind `lib/crm.ts` — connect later, zero code change |
| Admin | `/admin` in this app — password-gated listings CRUD + leads inbox (§8b) | Replaces Drizzle Studio as founder intake |
| Hosting | Hostinger Cloud — **own Node.js app**, domain terreno.com.py | Same plan as propia, separate app + separate deploy |
| Cron | hPanel cron → token-gated route handlers | No long-running workers on managed Node |
| CI | GitHub Actions: lint + typecheck + test + build | Day-0 rails land in PR #1 (M0) |
| Node | 22.x LTS | Pinned in CI and hPanel (M0) |

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
(reconciled against propia's real `src/db/schema.ts` in M1 — see PR #7;
`lib/db/schema.ts` is now the source of truth for terreno's shapes).

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

## 8. Leads — local-first, CRM optional

**Founder decision (2026-07-16): no GHL for now. Terreno gets its own
working admin backend; GHL becomes an optional adapter to connect later.**

**Rule: the capturing site processes the lead; leads are never synced between
sites.** Listings sync; leads don't.

- **The local `leads` table is the system of record.** Every lead submitted
  through `/api/leads` / `/api/v1/leads` is written to terreno's own DB
  first (with the seed-fallback caveat: if the DB is unreachable the
  WhatsApp action still succeeds and the miss is logged — the DB write is a
  logger, not a gate).
- Every lead carries `vertical: 'terreno'` (propia's `leads.vertical`
  pattern) plus **`capture_site`** ('terreno.com.py' here) and
  **`origin_site`** (from the listing's `origin` — this is how the origin
  site gets attribution for leads on cross-posted listings), and
  `listing_dedup_key` when applicable.
- `lib/crm.ts` is still created, as the **only** module that would ever talk
  to GHL — but it is a thin, env-gated adapter: `GHL_WEBHOOK_URL` unset
  (the current state) → it self-disables and the lead simply lives in the
  local table + admin inbox. Connecting GHL later is setting one env var,
  not a code change. The `crm_status` column tracks
  `pending|sent|failed|disabled`.
- Existing routing table stays: `listing_contact` on a broker listing →
  broker's WhatsApp; `casa_propia` listings, valuation and service leads →
  our number. Broker WhatsApp routing works identically for cross-posted
  listings because `owner.telefono_wa` travels in the feed.
- Existing resilience rules stay: fan-out via `Promise.allSettled` with
  retries; **no logger/CRM/DB failure ever fails the user's WhatsApp
  action**; unset env vars self-disable.

## 8b. Admin backend (`/admin`)

The founder's operating console — replaces Drizzle Studio as the intake and
lead-handling tool. Scope is deliberately small: one operator, no roles, no
multi-tenancy.

- **Auth:** single shared password (`ADMIN_PASSWORD`) → signed httpOnly
  session cookie (`AUTH_SECRET`), constant-time compare, rate-limited login,
  middleware-guarded `/admin/*` and `/api/admin/*`. No user table, no OAuth.
  If either env var is unset, `/admin` 404s (self-disable rule).
- **Listings CRUD:** create/edit/pause/mark-sold local (`origin='local'`)
  listings — the casa_propia inventory and broker intake. Form mirrors the
  `Listing` domain model (tipo, ubicación + map pin, superficie, precio,
  frente/fondo/esquina, servicios, estado_titulo, financiación, images,
  status). Writes go through the same validation (`lib/validation.ts`) as
  the public API. Creating/editing triggers `/api/revalidate` for the
  affected pages. Imported (`origin='propia'`) listings are **read-only**
  here — they're owned by the origin site.
- **Leads inbox:** newest-first table of the `leads` rows — contacto,
  tipo_lead, listing link, origin_site, created_at — with a simple worked/
  not-worked toggle (one status column, not a pipeline). This is the
  revenue-path tool: valuation leads from `/vender` land here.
- **Featured toggle:** set/clear `featured_until` per listing (timestamp
  gating stays; still no billing — commission-only at launch, founder
  decision 2026-07-16).
- **Sync panel (after M4/M5):** last-sync age + counters, re-using
  `/api/health` data, plus a "run import now" button hitting
  `/api/sync/import`.
- Images: keep it primitive — paste image URLs at first (same as seed rows).
  A real upload pipeline is post-launch unless it proves blocking.

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
- **The admin backend (§8b) is now also an intake path:** brokers who reach
  the founder by WhatsApp get their listing entered in `/admin` directly
  (`origin='local'`), no wizard needed. This further lowers the urgency of a
  native wizard.
- Build a native terreno wizard only if the funnel data ever proves land
  sellers bounce off the propia-branded wizard. Not before.

## 10. Environment variables

```bash
# minimum viable (site builds and runs on these alone — existing rule)
NEXT_PUBLIC_SITE_URL=https://terreno.com.py
NEXT_PUBLIC_WHATSAPP=5959…
NEXT_PUBLIC_BUSINESS_NAME=Terreno
NEXT_PUBLIC_FEATURE_FEATURED_BADGES=true

# M1 (live)
DATABASE_URL=mysql://terreno_user:…@localhost/terreno_prod

# M2 admin backend
ADMIN_PASSWORD=…             # /admin login; unset → /admin self-disables
AUTH_SECRET=…                # signs the session cookie

# M4/M5 sync
PROPIA_FEED_URL=https://propia.com.py/api/feed/terreno
FEED_SHARED_SECRET=…         # same secret both directions
SYNC_TOKEN=…                 # cron → /api/sync/import
REVALIDATE_TOKEN=…

# optional — connect later, code self-disables while unset
GHL_WEBHOOK_URL=…            # consumed ONLY by lib/crm.ts
SHEETS_WEBHOOK_URL=…
```

Everything non-minimum self-disables when empty (existing rule, kept).
**Deleted: all `JETENGINE_*` vars.**

## 11. Current status — built vs. missing (audited 2026-07-16)

**✅ DONE — M0 (PR #6) and M1 (PR #7), site live on Hostinger:**
- Full seed-powered frontend: home, `/buscar` split map+list, listing detail
  at `/terreno/{slug}-{publicId}`, programmatic SEO landings, `/vender`
  funnel, `/guias`, `/servicios`, static pages, sitemap/robots, JSON-LD.
- Rails: ESLint + Prettier + Vitest + full CI (lint → typecheck → test →
  build, plus a MySQL service container for the DB suite); `/api/health`
  with real data-source signal.
- Own MySQL + Drizzle (`lib/db/schema.ts`, reconciled against propia's real
  schema): `listings`, `locations`, `owners`, `listing_sources`, `leads`.
  Seam swapped — `fetchSource()` reads the DB, seed is the permanent
  fallback. Idempotent seed importer (re-run = zero changes). JetEngine/WP
  direction fully removed.
- Lead orchestrator (`lib/leads.ts`): WhatsApp routing by owner_type,
  resilient env-gated webhook fan-out.

**❌ MISSING to launch (the remaining milestones, in order):**
1. Admin backend `/admin` (§8b) — auth, listings CRUD, leads inbox,
   featured toggle. *(Nothing exists; intake is currently Drizzle Studio.)*
2. Local lead persistence + attribution + `lib/crm.ts` adapter (§8) —
   leads currently fan out to unset webhooks and are stored nowhere.
3. Both sync halves (§5): `/api/feed/listings` outbound and
   `/api/sync/import` inbound. *(`lib/content-hash.ts` and the
   `listing_sources` table already exist — the pipeline around them
   doesn't.)*
4. Propia-side work (separate repo, status unknown as of this revision):
   feed endpoint, terreno importer source, canonical/sitemap rule —
   `docs/PROPIA-MIGRATION.md` is the handoff.
5. `/publicar` page, full es-PY copy audit, end-to-end launch verification.

## 12. Milestones (sequential, each ends at a STOP gate)

Each milestone is one PR (or a small stack), CI green, founder reviews at
the STOP gate before the next begins. No milestone starts early. Default
build model is named per milestone (§0); Fable 5 reviews every STOP gate.

**Re-sequencing note (2026-07-16):** sync moved *after* admin + leads.
Propia's side of the sync hasn't started and its timeline is unknown, while
admin + lead persistence are unblocked and sit directly on the revenue path
(`/vender` leads currently aren't stored anywhere). Both sync halves are
built and tested terreno-side against fixture feeds, so only the final
end-to-end gate depends on propia.

### ~~M0 — Rails + real deploy~~ ✅ shipped (PR #6)
### ~~M1 — MySQL + seam swap~~ ✅ shipped (PR #7)

### M2 — Admin backend (build: Sonnet 5; auth review: Opus 4.8)
`/admin` per §8b: password login (signed cookie, rate-limited,
self-disabling), local-listings CRUD through existing validation, leads
inbox, `featured_until` toggle, revalidate-on-write. Tests: auth middleware
(no cookie → redirect; bad password → rate limit), CRUD round-trip in the
DB suite.
**STOP gate:** founder creates a real listing through `/admin` on
production and it renders on the live site; `/admin` with env vars unset
404s; a wrong password five times gets rate-limited.

### M3 — Lead persistence + CRM adapter (build: Sonnet 5)
Leads write to the local `leads` table first (system of record), carrying
`vertical='terreno'`, `capture_site`, `origin_site`, `listing_dedup_key`;
extract webhook calls into env-gated `lib/crm.ts` (`crm_status` tracked;
everything self-disables while unset). Leads appear in the M2 inbox.
**STOP gate:** a `/vender` valuation lead submitted on production shows up
in the `/admin` leads inbox with correct attribution; killing the DB still
leaves the WhatsApp button working.

### M4 — Sync engine, both halves, fixture-verified (build: Opus 4.8 —
dedup/upsert semantics are the highest-risk code in the repo)
Outbound `/api/feed/listings` (token, `origin='local'` only, §5 shape) and
inbound `lib/sync/import.ts` + `/api/sync/import` (token) with full §5
dedup semantics, propia `property_type` → terreno `tipo` mapping, ISR
revalidate on change, sync counters in `/api/health`. Verified entirely
against fixture feeds: import twice → second run all-unchanged; mutate one
field → exactly one update; absent → paused; imported rows never re-export.
**STOP gate:** fixture round-trip green in CI; `curl` of the live feed shows
the §5 shape with only local listings; founder approves the feed contract
as final before it's handed to propia.

### M5 — Propia integration + canonical contract (blocked on propia.node;
terreno-side: Sonnet 5)
Hand `docs/PROPIA-MIGRATION.md` to a propia.node session (its feed, its
terreno importer source, its cross-domain canonical + sitemap exclusion —
§7). Then terreno-side: hPanel cron (15 min) on `/api/sync/import`,
`PROPIA_FEED_URL` + `FEED_SHARED_SECRET` set both sides, sync panel in
`/admin`.
**STOP gate (in production, not just tests):** a land listing published on
propia appears on terreno within 15 min and vice versa; re-syncs create no
duplicates; `curl` shows terreno-canonical on both sites' land detail
pages; propia's sitemap contains no land detail URLs, terreno's contains
all of them.

### M6 — Publish link, copy audit, launch (build: Sonnet 5)
Thin `/publicar` → propia's wizard (with `/admin` as the WhatsApp-intake
alternative, §9). Full copy pass: voseo everywhere (publicá, vendé,
encontrá), land-vocabulary audit, WhatsApp CTA wording. Final SEO sweep:
canonicals, `noindex` on empty landings, JSON-LD validity.
**STOP gate = launch:** end-to-end demo — landowner publishes on propia →
listing on both sites → lead captured on terreno → visible in `/admin`
with `origin_site='propia.com.py'` and correct broker WhatsApp routing.

### Estimated effort to launch
Four build sessions in this repo (M2, M3, M4, M6 — one each; M5's
terreno-side is small enough to fold into M4's session or a short
follow-up) **plus one propia.node session** for the migration note. M5's
end-to-end gate is the only external dependency.

---

*Companion doc: `docs/PROPIA-MIGRATION.md` — the minimal changes propia.node
needs (feed endpoint, importer source, canonical/sitemap rule) to be handed
to a propia session before M5's gate.*
