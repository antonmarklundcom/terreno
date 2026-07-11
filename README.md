# terreno.com.py

A land-only real-estate portal for Paraguay — **lotes, campos, quintas y
loteamientos**. It is three things at once:

1. **A listing portal** brokers list land on (free at launch).
2. **A seller-acquisition / valuation funnel** — our own commission business
   (“Vendé tu terreno”), the priority revenue path.
3. **A content + services hub** — investment guides and a directory of
   land-related services (tasador, escribano, agrimensor).

Spanish UI (voseo es-PY), mobile-first (designed at 360 px), prices in **US$
primary / Gs. secondary**. House style: calm Scandinavian minimalism — the
**map + key data are the hero of every card and detail page; photos are
secondary**.

> **The architecture contract is [`ARCHITECTURE.md`](ARCHITECTURE.md).** It is
> the founder-reviewed source of truth for the stack, data model, the two-repo
> split with propia.com.py, the cross-posting sync design, and the milestone
> plan with STOP gates. When code and that file disagree, one of them is fixed
> in the same PR. Design source of truth:
> [`docs/DESIGN_HANDOFF.md`](docs/DESIGN_HANDOFF.md) and the prototype
> [`docs/Terreno.dc.html`](docs/Terreno.dc.html) — design tokens are wired into
> [`tailwind.config.ts`](tailwind.config.ts); components read the theme, never
> hardcoded hex.

## Stack

- **Next.js 15** (App Router) + **TypeScript** (strict) + **Tailwind CSS**
- **MapLibre GL JS** + free Carto raster tiles (no API key, no billing)
- **zod** on every API input
- **MySQL + Drizzle ORM** — terreno's own database; the checked-in seed is the
  permanent fallback (DB unreachable → the site still renders)
- Node **22.x** (LTS), hosted on Hostinger Cloud (own Node.js app)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill the MINIMUM VIABLE subset (see below)
npm run dev                  # http://localhost:3000 (runs on the seed, no DB)
npm run build && npm start   # production build
```

Verification rails (run in CI on every push/PR):

```bash
npm run lint         # ESLint flat config (next preset + prettier)
npm run typecheck    # strict TS, no emit
npm test             # vitest — pure-logic + repo suite over the seed (no DB)
npm run build        # next build
npm run format       # prettier --write (format:check verifies)
```

### Database (own MySQL, Drizzle)

The site runs with **zero DB** on the seed. Point it at MySQL by setting
`DATABASE_URL`; `fetchSource()` then reads the DB and falls back to the seed on
any failure (§4).

```bash
export DATABASE_URL="mysql://terreno:terreno@127.0.0.1:3306/terreno_dev"
npm run db:migrate       # apply drizzle/ migrations
npm run db:import-seed    # idempotent: load the seed into the DB (re-run = no-op)
npm run db:studio         # browse/edit rows (Drizzle Studio — founder intake)
npm run test:db           # DB-backed idempotency suite (needs DATABASE_URL)
```

Schema lives in [`lib/db/schema.ts`](lib/db/schema.ts); migrations in `drizzle/`
(generate with `npm run db:generate`). Field names align with propia's schema
so the future cross-posting feed maps mechanically (ARCHITECTURE.md §4, §5).

## Routes

| Route | Rendering | Purpose |
| --- | --- | --- |
| `/` | SSG | Home (dual-path browse + sell) |
| `/buscar` | SSR (dynamic) | Search results — split map + list, URL-driven filters |
| `/terreno/{slug}-{publicId}` | SSG + ISR | Listing detail (map-first); identity is the trailing 10-char `public_id` |
| `/[tipo]/[departamento]` | SSG + ISR | Programmatic SEO landing (e.g. `/lotes/central`) |
| `/[tipo]/[departamento]/[ciudad]` | SSG + ISR | e.g. `/lotes/central/luque` |
| `/vender` | SSG + ISR | Seller / valuation funnel |
| `/guias`, `/guias/[slug]` | SSG + ISR | Investment guides |
| `/servicios` | SSG + ISR | Services hub |
| `/como-funciona`, `/sobre-nosotros`, `/legal/[slug]` | SSG | Static pages |
| `/api/v1/listings`, `/api/v1/listings/[slug]` | Route handler | App-first listings API |
| `/api/leads`, `/api/v1/leads` | Route handler | Lead intake / orchestrator |
| `/api/revalidate` | Route handler | On-demand ISR webhook (token-gated) |
| `/api/health` | Route handler | Uptime + data-source signal (curl-friendly) |
| `/sitemap.xml`, `/robots.txt` | Generated | From repo data |

`[tipo]` slugs: `lotes` · `terrenos-comerciales` · `campos` · `quintas` ·
`loteamientos`. Geography slugs are kebab-cased Spanish names. Landing pages
with **zero** matching listings are `noindex`.

## The data seam (most important architectural rule)

`lib/listings-repo.ts` is the **sole** data-access point for listings. Every
page and every API route reads listings only through it:

```ts
getListings(filters?)          // filtered list
getListingsResult(filters?)    // { data, total, facets } — the API contract
getListingByPublicId(publicId) // detail-page identity resolver
getListingBySlug(slug)         // cosmetic-slug lookup / back-compat
getFeaturedListings(limit?)
getFacets()                    // departamentos → ciudades → barrios cascade + counts
getSourceStatus()              // which source served (db | seed) — for /api/health
```

- **The source is MySQL, the seed is the fallback.** `fetchSource()` reads
  published rows from the DB when `DATABASE_URL` is set and falls back to
  `lib/seed/listings.ts` on any failure — so the site always renders (§4).
  DB row → `Listing` mapping lives inside the seam (`lib/db/map.ts`); nothing
  outside the repo module imports the seed or the db client:

  ```bash
  # returns nothing but the repo itself:
  grep -rn "seed/listings\|db/client" app components lib | grep -v "lib/listings-repo.ts"
  ```

- **All listing data is fetched server-side** (Server Components / route
  handlers). The map and filters are Client Components for interactivity only —
  they receive data as props. There is no client-side `fetch()` of listing data
  anywhere, so crawlers always get fully-rendered HTML.

- **Listing URLs are `{slug}-{publicId}`.** The slug is cosmetic/SEO; the
  trailing 10-char `public_id` is the stable identity the detail route resolves
  by. Build/parse live in one file, [`lib/listing-url.ts`](lib/listing-url.ts).

### Editing seed data

Edit `lib/seed/listings.ts`. Keep **`lat`/`lng` realistic** so map pins land in
the right city. `superficie` is always stored in **m²** (canonical); hectáreas
and `precio/m²` are derived at display time. `featured_until` is a Unix
timestamp (a listing is “Destacado” only while it is in the future). Guides live
in `lib/seed/guides.ts`, the service directory in `lib/seed/services.ts`.

## Leads & WhatsApp routing

All leads converge on a single orchestrator (`lib/leads.ts`, exposed at
`POST /api/leads` and `POST /api/v1/leads`) discriminated by `tipo_lead`.
WhatsApp routing depends on `owner_type`:

| Lead | Condition | WhatsApp goes to |
| --- | --- | --- |
| `listing_contact` | listing `owner_type === 'broker'` | the **broker** (`owner.telefono_wa`) |
| `listing_contact` | listing `owner_type === 'casa_propia'` | **our** number (`NEXT_PUBLIC_WHATSAPP`) |
| `valuation` | — | **our** number / pipeline |
| `service` | — | **our** number / pipeline |

On every lead the orchestrator fans out to **GHL + Google Sheets in parallel**
(`Promise.allSettled`, 3× exponential-backoff retries). **Logger failure never
fails the user’s action**; when `GHL_WEBHOOK_URL` / `SHEETS_WEBHOOK_URL` are
unset the fan-out is skipped silently and WhatsApp still works. The WhatsApp
button uses `navigator.sendBeacon()` so logging survives the page leaving, and
the API parses JSON from the raw text body to support it.

## Environment variables

Minimum-viable subset the site **builds and runs on alone**:

```bash
NEXT_PUBLIC_SITE_URL=https://terreno.com.py
NEXT_PUBLIC_WHATSAPP=595981000000          # our number
NEXT_PUBLIC_BUSINESS_NAME=Terreno
NEXT_PUBLIC_FEATURE_FEATURED_BADGES=true
```

Everything else (`DATABASE_URL`, `GHL_WEBHOOK_URL`, `SHEETS_WEBHOOK_URL`,
`REVALIDATE_TOKEN`, and the deferred sync vars) self-disables when empty. See
[`.env.example`](.env.example) and ARCHITECTURE.md §10. Secrets live in the host
panel, never in the repo.

## Deployment (Hostinger managed Node.js Web App)

**Never** use `output: 'export'` — we need SSR + ISR + route handlers.

1. hPanel → **Websites → Add Website → Node.js Apps → Import Git Repository**.
2. Branch `main`, **Next.js** preset, root `./`, build `npm run build`, start
   `npm run start`.
3. Node version = **22.x** (LTS, not the newest major).
4. Add the minimum-viable env vars above.
5. **Deploy**, then attach `terreno.com.py` and enable SSL in hPanel.
6. Health check: `curl https://terreno.com.py/api/health` returns
   `{"status":"ok",…}`.

CI (`.github/workflows/ci.yml`) runs lint → typecheck → test → build →
`npm audit --audit-level=high` on every push and PR.

## Milestones

The build is sequential with STOP gates — see ARCHITECTURE.md §12. **M0**
(rails + deploy) and **M1** (own MySQL DB + seam swap) make terreno a fully
standalone site. **M2–M3** (cross-posting sync with propia.com.py) are
deliberately deferred; `docs/PROPIA-MIGRATION.md` is the note handed to a
propia.node session when that work begins.
