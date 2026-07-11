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
- **MySQL + Drizzle ORM** — terreno's own database (lands in M1; today the site
  runs on the checked-in seed)
- Node **22.x** (LTS), hosted on Hostinger Cloud (own Node.js app)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill the MINIMUM VIABLE subset (see below)
npm run dev                  # http://localhost:3000
npm run build && npm start   # production build
```

Verification rails (run in CI on every push/PR):

```bash
npm run lint         # ESLint flat config (next preset + prettier)
npm run typecheck    # strict TS, no emit
npm test             # vitest — pure-logic unit tests (no DB needed)
npm run build        # next build
npm run format       # prettier --write (format:check verifies)
```

## Routes

| Route | Rendering | Purpose |
| --- | --- | --- |
| `/` | SSG | Home (dual-path browse + sell) |
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
getListings(filters?)        // filtered list
getListingsResult(filters?)  // { data, total, facets } — the API contract
getListingBySlug(slug)
getFeaturedListings(limit?)
getFacets()                  // departamentos → ciudades → barrios cascade + counts
```

- **Today** the repo reads from `lib/seed/listings.ts` (a typed seed array).
  Nothing else imports the seed — enforced and verifiable:

  ```bash
  # returns nothing but the repo itself:
  grep -rn "seed/listings" app components lib | grep -v "lib/listings-repo.ts"
  ```

- **All listing data is fetched server-side** (Server Components / route
  handlers). The map and filters are Client Components for interactivity only —
  they receive data as props. There is no client-side `fetch()` of listing data
  anywhere, so crawlers always get fully-rendered HTML.

- **M1 swaps the source, not the shape.** `fetchSource()` becomes a MySQL
  read through Drizzle, with the seed kept as a **permanent fallback** (DB
  unreachable → the site still renders). That is a single-file change inside
  `lib/listings-repo.ts` — never a frontend rebuild. See ARCHITECTURE.md §4.

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
