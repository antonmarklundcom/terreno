# Handoff: terreno.com.py — Land Portal (5 screens)

## Overview
A premium, map- and data-forward portal for **land only** (lotes, campos, quintas, loteamientos) in Paraguay. UI in Spanish, mobile-first (designed at 360px), US$ as primary currency with Gs. secondary. Serves three audiences from the home page: **buyers**, **sellers** (valuation/commission funnel), and **readers** (investment guides). House style: calm Scandinavian minimalism — generous whitespace, strong type hierarchy, one confident forest-green accent on warm neutrals.

Land-specific design law followed throughout: **the map + key data are the hero of every card and detail page; photos are secondary.**

## About the Design Files
The file in this bundle (`Terreno.dc.html`) is a **design reference created in HTML** — a prototype showing intended look and behavior, not production code to ship directly. It is authored as a "Design Component" (a streaming HTML format) and lays out all screens as labeled frames on one canvas for review.

Your task is to **recreate these designs in the target codebase's existing environment** (React, Vue, SwiftUI, native, etc.) using its established patterns, component library, and conventions. If no environment exists yet, choose the most appropriate framework for the project and implement the designs there. Do not copy the `.dc.html` markup verbatim.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, copy, and interactions are specified. Recreate the UI faithfully using the codebase's existing libraries. The one element to treat as a placeholder is the **map**: in the prototype it is a stylized SVG schematic (sand base, soft field polygons, roads, parcel grid, highlighted parcel polygon, teardrop pin). In production, replace it with a real interactive map (Mapbox / MapLibre / Google Maps) styled to match the calm neutral palette, with the listing's parcel polygon + price pins overlaid.

## Screens / Views

### 1. Home (two variations)
**Purpose:** Make all three audiences obvious; give buyers and sellers an equally prominent primary path.

**Option A — vertical dual-path (recommended primary):**
- App bar: wordmark `terreno.com.py` (".com.py" in muted gray), search + hamburger icons.
- H1 + subhead.
- **Buyer search card** (white, 14px radius, soft shadow): a location **cascade** of three select-style fields — Departamento → Ciudad/Distrito → Barrio/Zona (Barrio labeled "opcional", muted). Below: **Tipo** chips (Lote urbano · Terreno comercial · Campo · Quinta · Loteamiento) — first selected (green fill). Full-width green "Buscar terrenos" button with search icon.
- **Seller CTA card** (dark forest `#184e36`, faint parcel-grid SVG motif): eyebrow "Vendé tu terreno", H "Conocé el valor real de tu terreno", subhead, white "Calcular valor gratis" button. Must be visually equal in weight to the search card — not a footer link.
- **Destacados** featured strip: horizontally-scrolling listing cards (map thumb + price + area + per-unit + title + location).
- **Trust band** ("Por qué confiar"): light green-tinted card, 3 items with icon tiles — Título verificado / Medidas y límites claros / Acompañamiento local.
- **Guías para invertir**: list of 3 article links (chevron rows).
- **Servicios**: 2×2 grid — Tasación / Revisión de título / Agrimensura / Financiación.
- Footer: dark `#16170f`, wordmark + nav links.

**Option B — tabbed hero (alternative to explore):**
- Map-motif hero header with H1 overlaid (gradient fade to page bg at bottom).
- Segmented control **Comprar / Vender** (pill track `#eceae3`, active thumb white). Switching tabs swaps the hero body: Comprar → cascade + tipo chips + search button; Vender → short pitch + ubicación/superficie fields + green "Quiero mi tasación gratis" + WhatsApp button. (Interactive in the prototype.)

### 2. Search Results (mobile + desktop)
**Purpose:** Hemnet-signature split of interactive map + listing list, with a full filter rail.

**Mobile:** back arrow + search-summary pill (Central · Luque / Lote urbano); horizontally-scrolling filter chips ("Filtros" pill is dark/active, then Superficie / Precio / Servicios); a **map peek** (~140px) with price pins and a "Ver mapa completo" button; results header ("128 terrenos" + sort dropdown); vertical list of full listing cards.

**Mobile Filters sheet:** bottom-sheet over a dimmed scrim, grab handle, "Filtros" title + "Limpiar". Sections: Ubicación (cascade), Tipo (chips), **Superficie** (unit toggle m²/ha + min/max), **Precio** (currency toggle US$/Gs. + min/max), **Servicios** (checkboxes: Agua/ESSAP, Energía/ANDE, Desagüe, Asfalto/empedrado, Internet — first two checked), **Financiación** (Contado/Cuotas toggle), **Estado de título** (Con título/En proceso toggle). Sticky footer button "Ver 128 terrenos".

**Desktop (1280×840):** top nav (wordmark, compound search box with Depto/Ciudad/Tipo + green search button, right-side links + "Vendé tu terreno" button). Body is a 3-column split:
- **Filter rail** (262px, white, scrolls): Superficie (unit toggle) / Precio / Servicios (checkboxes) / Financiación / Estado de título.
- **List pane** (560px, page-bg, scrolls): sticky results header; vertical list of **horizontal** cards (200px map on left, data on right).
- **Map pane** (flex-fill): large map with price pins, +/− zoom control, and a "Buscar al mover el mapa" toggle (on).

### 3. Listing Detail (mobile)
**Purpose:** Sell a single parcel; map primary, photos secondary.
- App bar: back / share / save icons.
- **PRIMARY large map** (260px) with type pill, "Con título" badge, dimension labels ("12 m de frente", "30 m"), "Ampliar mapa" button.
- Title (H1) + location row (pin).
- **Price block**: `US$ 28.500` (28px bold) + `US$ 79/m²` (green) + `≈ Gs. 208.050.000` (muted).
- **Key-facts grid** (2-col, bordered cells): Superficie / Precio/m² / Frente / Dimensiones / Esquina / Financiación.
- **Trust badges** (2 side by side): "Con título" (green tile, shield-check) + "Cuotas" (amber tile, card icon, "Hasta 60 meses").
- **Servicios**: pill badges with green checks; unavailable services muted with a dash.
- **SECONDARY photos**: small horizontally-scrolling 108×80 placeholder thumbs labeled "Fotos del lote · 4 fotos · referenciales".
- **Services cross-sell** (green-tinted card): "¿Necesitás un tasador o revisión legal?" → rows for Revisión de título / Agrimensura.
- **Sticky bottom contact bar**: phone-icon button + full-width green **WhatsApp** button "Contactar por WhatsApp".

### 4. Seller / Valuation Landing (mobile)
**Purpose:** Conversion page (the commission business), not a listing page.
- Dark forest app bar + **hero** (`#184e36`, parcel-grid SVG motif): eyebrow "VENDÉ TU TERRENO", H1 "Lo valuamos, lo publicamos y lo vendemos por vos.", subhead.
- **Lead form card** overlapping the hero (negative top margin, strong shadow): Depto + Ciudad selects, Superficie + unit toggle (m²/ha), Nombre, WhatsApp/teléfono; green "Quiero mi tasación gratis" button; "o" divider; green WhatsApp button.
- **Trust signals** row: 0% (hasta que se venda) / 48 h (tasación) / 17 (departamentos).
- **Cómo funciona**: numbered timeline (1 Valuamos · 2 Publicamos · 3 Vendemos por vos).
- **Testimonial** card.
- **Final CTA** (dark forest, centered).

### 5. Investment Article Template (mobile)
**Purpose:** Long-form SEO/content with calm typography.
- App bar (back / "Guías" / share).
- Header: category pill ("Guía · Títulos"), H1, meta (date · reading time).
- Calm map hero (rounded, 150px).
- **Prose**: lead paragraph, H2s, a numbered "three documents" list, an accent **callout** (left green border, "Señal de alerta"), more body.
- **Related-services sidebar** (bordered card): Revisión de título / Agrimensura de límites / Tasación de mercado.
- **Soft dual CTA**: "¿Buscás terreno?" (light, green Buscar button) + "¿Tenés un terreno?" (dark forest, white Vender button).

## Interactions & Behavior
- **Location cascade**: Departamento → Ciudad/Distrito → Barrio/Zona. Barrio only exists for urban land; rural land stops at distrito (hide/disable Barrio for rural). Each level filters the next.
- **Tipo selector**: single-select chips (Lote urbano · Terreno comercial · Campo · Quinta · Loteamiento).
- **Unit-aware filters**: superficie input unit toggles m² (lotes) ↔ ha (campos); the active unit drives min/max placeholders and listing display.
- **Currency**: US$ primary everywhere; Gs. shown as secondary line (toggleable — the prototype exposes a `showGs` flag).
- **Home Option B** segmented control swaps hero content (Comprar/Vender) in place.
- **Search**: filter rail/sheet applies; desktop "Buscar al mover el mapa" re-queries on map pan; clicking a listing → detail; price pins ↔ list hover sync (recommended).
- **WhatsApp** buttons open `wa.me` deep links (phone-first market — keep these prominent on detail + seller pages).
- Map pins: active/selected state darker (`#16170f` bg, white text); others white bg, dark text.

## State Management
- Search query: `{ departamento, ciudad, barrio?, tipo, superficieMin, superficieMax, unidad (m²|ha), precioMin, precioMax, moneda (USD|PYG), servicios[], financiacion, estadoTitulo }`.
- Results list + map viewport (bounds → re-query when "search on map move" is on).
- Selected/hovered listing id (list ↔ map sync).
- Home Option B: `heroTab ∈ {comprar, vender}`.
- Seller + contact forms: field state + validation; submit → lead/CRM endpoint.
- Listing detail: fetched by id; gallery + map data.

## Design Tokens

**Colors**
- Accent (forest green): `#1f6b4a` · dark `#184e36` · darkest text-on-tint `#18573c`/`#8a5f1f`
- Accent tint bg: `#eef3ef` · trust-band bg `#f1f4ef` · trust border `#e2e9e1` / `#dbe7df`
- Page bg: `#fafaf9` · review canvas bg `#e7e5df`
- Surface white: `#ffffff` · subtle fill `#fafaf9` / `#f3f1ea` / `#eceae3`
- Ink (primary text): `#16170f` · prose body `#33352c` · muted `#6f7167` · faint `#9a9b92` · faintest `#b3b4aa`
- Borders: `#e9e6df` / `#e7e3da` / `#efece5` / `#e3e0d8`
- Footer / dark: `#16170f`
- Amber (financing/proceso): `#a9772a` / `#8a5f1f`
- WhatsApp: `#25D366`
- Map palette: sand `#ece6d9` (Bosque variant `#e4ebdd`); fields `#dce5d1` / `#d3ddc6` / `#e3e9da`; roads `#ffffff`; parcel grid `#d6cfbe`; water `#cfe0e6`; highlighted parcel = accent at 16% fill, 2px accent stroke.

**Typography**
- Family: **Schibsted Grotesk** (Google Fonts), weights 400/500/600/700/800. Use tabular figures for prices/data.
- H1 (hero): 25–28px / 700 / letter-spacing −0.025em / line-height ~1.12, `text-wrap: balance`.
- Section H: 17–19px / 700 / −0.015em.
- Price (detail): 28px / 700. Card price: 18–19px / 700.
- Body: 14–15.5px / 400–500 / line-height 1.5–1.62.
- Eyebrow/label: 10–11px / 700 / uppercase / letter-spacing 0.03–0.05em / muted.

**Spacing & shape**
- Mobile frame width 360px; screen padding 16px (prose 20px).
- Radii: chips/pills 20px; inputs/buttons 9–11px; cards 12–16px; small tiles 7–9px.
- Shadows: card `0 1px 3px rgba(0,0,0,.08)`; raised card `0 4px 18px rgba(22,23,15,.05)`; floating form `0 8px 28px rgba(22,23,15,.1)`; map pins `0 2–3px 8–10px rgba(0,0,0,.2)`.
- Hit targets ≥ 44px on mobile.

## Assets
- **Fonts**: Schibsted Grotesk via Google Fonts.
- **Icons**: inline single-stroke SVGs (search, hamburger, chevron, check, pin, share, heart, phone, shield-check, layers, sliders, arrows) — replace with the codebase's icon set (e.g. Lucide/Feather — these match the stroke style).
- **WhatsApp logo**: inline SVG path included; use the official brand glyph.
- **Maps**: stylized SVG placeholder — replace with a real map provider (see Fidelity). No real photos used; listing photos are intentionally secondary placeholders.

## Files
- `Terreno.dc.html` — the full design (all 5 screens + Home variation B + mobile/desktop search), in this bundle. Listing data and the map-SVG generator live in its embedded logic class (`renderVals()` / `makeMapSVG`).
