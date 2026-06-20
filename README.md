# terreno.com.py

A land-only real-estate portal for Paraguay — **lotes, campos, quintas y
loteamientos**. It is three things at once:

1. **A listing portal** brokers list land on (free at launch).
2. **A seller-acquisition / valuation funnel** — our own commission business
   (“Vendé tu terreno”), the priority revenue path.
3. **A content + services hub** — investment guides and a directory of
   land-related services (tasador, escribano, agrimensor).

Spanish UI, mobile-first (designed at 360 px), prices in **US$ primary / Gs.
secondary**. House style: calm Scandinavian minimalism — the **map + key data
are the hero of every card and detail page; photos are secondary**.

> Design source of truth: [`docs/DESIGN_HANDOFF.md`](docs/DESIGN_HANDOFF.md) and
> the prototype [`docs/Terreno.dc.html`](docs/Terreno.dc.html). Design tokens are
> wired into [`tailwind.config.ts`](tailwind.config.ts) — components read the
> theme, never hardcoded hex.

## Stack

- **Next.js 15** (App Router) + **TypeScript** (strict) + **Tailwind CSS**
- **MapLibre GL JS** + free Carto raster tiles (no API key, no billing)
- **zod** on every API input
- Node **22.x** (LTS)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill the MINIMUM VIABLE subset (see below)
npm run dev                  # http://localhost:3000
npm run build && npm start   # production build
npm run typecheck            # strict TS, no emit
```

## Routes

| Route | Rendering | Purpose |
| --- | --- | --- |
| `/` | SSG | Home (Option A: dual-path browse + sell) |
| `/buscar` | SSR (dynamic) | Search results — split map + list, URL-driven filters |
| `/terreno/[slug]` | SSG + ISR | Listing detail (map-first) |
| `/[tipo]/[departamento]` | SSG + ISR | Programmatic SEO landing (e.g. `/lotes/central`) |
| `/[tipo]/[departamento]/[ciudad]` | SSG + ISR | e.g. `/lotes/central/luque` |
| `/vender` | SSG + ISR | Seller / valuation funnel |
| `/guias`, `/guias/[slug]` | SSG + ISR | Investment guides |
| `/servicios` | SSG + ISR | Services hub |
| `/como-funciona`, `/sobre-nosotros`, `/legal/[slug]` | SSG | Static pages |
| `/api/v1/listings`, `/api/v1/listings/[slug]` | Route handler | App-first listings API |
| `/api/leads`, `/api/v1/leads` | Route handler | Lead intake / orchestrator |
| `/api/revalidate` | Route handler | On-demand ISR webhook (Phase 2 stub) |
| `/sitemap.xml`, `/robots.txt` | Generated | From repo data |

`[tipo]` slugs: `lotes` · `terrenos-comerciales` · `campos` · `quintas` ·
`loteamientos`. Geography slugs are kebab-cased Spanish names. Landing pages
with **zero** matching listings are `noindex`.

## The data seam (most important architectural rule)

`lib/listings-repo.ts` is the **sole** data-access point for listings. Every
page and every API route reads listings only through it:

```ts
getListings(filters?)        // filtered list
getListingsResult(filters?)  // { data, total, facets } — the API contract
getListingBySlug(slug)
getFeaturedListings(limit?)
getFacets()                  // departamentos → ciudades → barrios cascade + counts
```

- **Build 1** reads from `lib/seed/listings.ts` (a typed seed array, ~40
  listings). Nothing else imports the seed — enforced and verifiable:

  ```bash
  # returns nothing but the repo itself:
  grep -rn "seed/listings" app components lib | grep -v "lib/listings-repo.ts"
  ```

- **All listing data is fetched server-side** (Server Components / route
  handlers). The map and filters are Client Components for interactivity only —
  they receive data as props. There is no client-side `fetch()` of listing data
  anywhere, so crawlers always get fully-rendered HTML.

### How the JetEngine swap will work (Phase 2)

The `Listing` shape and the repo signatures already mirror the future JetEngine
REST response, so switching data sources is a **single-file change** inside
`lib/listings-repo.ts` — never a frontend rebuild. Implement `fetchSource()`
against `panel.terreno.com.py` (WP Application Password auth) and **keep the
seed fallback permanently**: if the backend is unreachable, the repo falls back
to the seed and the site still renders. See the commented pseudo-code in
`fetchSource()`.

### Editing seed data

Edit `lib/seed/listings.ts`. Each listing is built with a small internal helper;
keep **`lat`/`lng` realistic** so map pins land in the right city. `superficie`
is always stored in **m²** (canonical); hectáreas and `precio/m²` are derived at
display time. `featured_until` is a Unix timestamp (a listing is “Destacado”
only while it is in the future). Guides live in `lib/seed/guides.ts`, the service
directory in `lib/seed/services.ts`.

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

Everything else (`GHL_WEBHOOK_URL`, `SHEETS_WEBHOOK_URL`, `REVALIDATE_TOKEN`,
and the `JETENGINE_*` Phase-2 vars) self-disables when empty. See
[`.env.example`](.env.example). Secrets live in the host panel, never in the repo.

## Deployment (Hostinger managed Node.js Web App)

> Document-only for Build 1 — do not deploy from here. **Never** use
> `output: 'export'` (we need SSR + ISR + route handlers).

1. hPanel → **Websites → Add Website → Node.js Apps → Import Git Repository**.
2. Branch `main`, **Next.js** preset, root `./`.
3. Node version = current LTS (**22.x**, not the newest major).
4. Add env vars from the `.env.example` minimum subset.
5. **Deploy**, then attach the domain.
6. Standard `build` / `start` scripts. CI runs `npm ci && npm run build` on every
   push (`.github/workflows/ci.yml`).

## Operations — who responds to leads

- **Valuation & service leads → our pipeline.** These always reach our WhatsApp
  number / CRM; our team responds, valuates and coordinates the partner.
- **Broker listing contacts → the broker’s WhatsApp.** We connect the buyer
  directly to the broker who owns the listing.
- **`casa_propia` listing contacts → our pipeline.** Owner-direct listings route
  to us so we can broker the sale.

## Phase 2 (not built now)

- Wire `lib/listings-repo.ts` `fetchSource()` to the JetEngine REST API on
  `panel.terreno.com.py` (WP Application Password); keep the seed fallback.
- On-demand ISR via `/api/revalidate`, triggered by a WP webhook (token-gated).
- Decide loteamiento parent/child modeling before bulk seeding in JetEngine
  (Build 1 models `loteamiento` as a `tipo`, not a parent/child relation).
- Turn on the GHL + Sheets fan-out.
- Flip `featured_until` from a visual badge to a paid placement.
