'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Facets, Listing } from '@/lib/types';
import { formatUsdCompact } from '@/lib/format';
import { ListingCard, ListingRow } from './listing-card';
import { SearchFilters } from './search-filters';
import { SlidersIcon, LayersIcon } from './icons';
import type { MapMarker } from './listing-map';

// Map is lazy-loaded (client only) — keep listing data server-fetched.
const ListingMap = dynamic(() => import('./listing-map'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-map-sand" />,
});

export function SearchView({
  listings,
  total,
  facets,
  summary,
}: {
  listings: Listing[];
  total: number;
  facets: Facets;
  summary: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const [sheetOpen, setSheetOpen] = useState(false);

  const markers: MapMarker[] = useMemo(
    () =>
      listings.map((l) => ({
        id: l.id,
        lng: l.ubicacion.lng,
        lat: l.ubicacion.lat,
        label: formatUsdCompact(
          l.tipo === 'loteamiento' && l.loteamiento
            ? l.loteamiento.precio_desde
            : l.precio.monto,
        ),
        href: `/terreno/${l.slug}`,
      })),
    [listings],
  );

  const center: [number, number] | undefined = listings.length
    ? [listings[0].ubicacion.lng, listings[0].ubicacion.lat]
    : undefined;

  const resultsHeader = (
    <div className="flex items-center justify-between">
      <div className="text-[15px] font-semibold">
        <span className="tnum font-bold">{total}</span>{' '}
        {total === 1 ? 'terreno' : 'terrenos'}
      </div>
      <div className="text-[13px] text-ink-muted">{summary}</div>
    </div>
  );

  return (
    <>
      {/* ===== Desktop: 3-column split ===== */}
      <div className="hidden lg:flex lg:h-[calc(100vh-60px)]">
        <aside className="w-[300px] flex-none overflow-y-auto border-r border-line-soft bg-surface p-5 xl:w-[320px]">
          <SearchFilters facets={facets} />
        </aside>
        <section className="w-[440px] flex-none overflow-y-auto border-r border-line-soft bg-canvas xl:w-[500px]">
          <div className="sticky top-0 z-10 bg-canvas px-5 py-3.5">
            {resultsHeader}
          </div>
          <div className="flex flex-col gap-3.5 px-5 pb-8">
            {listings.map((l) => (
              <div
                key={l.id}
                onMouseEnter={() => setSelectedId(l.id)}
                onMouseLeave={() => setSelectedId(null)}
              >
                <ListingRow listing={l} />
              </div>
            ))}
            {listings.length === 0 && <EmptyState />}
          </div>
        </section>
        <section className="relative flex-1">
          <ListingMap
            markers={markers}
            center={center}
            selectedId={selectedId}
            onHover={setSelectedId}
            fitToMarkers
            className="absolute inset-0"
          />
        </section>
      </div>

      {/* ===== Mobile / tablet ===== */}
      <div className="lg:hidden">
        <div className="sticky top-[60px] z-20 flex items-center gap-2 overflow-x-auto border-b border-line-soft bg-surface px-4 py-2.5">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="inline-flex flex-none items-center gap-1.5 rounded-pill bg-ink px-3 py-1.5 text-[12.5px] font-semibold text-white"
          >
            <SlidersIcon size={13} />
            Filtros
          </button>
          <button
            type="button"
            onClick={() =>
              setMobileView((v) => (v === 'list' ? 'map' : 'list'))
            }
            className="inline-flex flex-none items-center gap-1.5 rounded-pill border border-line-cool bg-surface px-3 py-1.5 text-[12.5px] font-medium text-ink-soft"
          >
            <LayersIcon size={13} />
            {mobileView === 'list' ? 'Ver mapa' : 'Ver lista'}
          </button>
        </div>

        {mobileView === 'map' ? (
          <div className="relative h-[calc(100vh-112px)]">
            <ListingMap
              markers={markers}
              center={center}
              selectedId={selectedId}
              onSelect={setSelectedId}
              fitToMarkers
              className="absolute inset-0"
            />
          </div>
        ) : (
          <div className="container-page max-w-2xl py-4">
            <div className="mb-3">{resultsHeader}</div>
            <div className="flex flex-col gap-3.5">
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
              {listings.length === 0 && <EmptyState />}
            </div>
          </div>
        )}

        {sheetOpen && (
          <div
            className="fixed inset-0 z-50 bg-ink/30"
            onClick={() => setSheetOpen(false)}
          >
            <div
              className="absolute inset-x-0 bottom-0 top-12 overflow-y-auto rounded-t-sheet bg-surface"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mt-2.5 h-1 w-9 rounded bg-line-cool" />
              <div className="flex items-center justify-between border-b border-line-soft px-5 py-3.5">
                <div className="text-[17px] font-bold">Filtros</div>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="text-[13px] font-semibold text-brand"
                >
                  Cerrar
                </button>
              </div>
              <div className="p-5 pb-8">
                <SearchFilters
                  facets={facets}
                  onApplied={() => setSheetOpen(false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function EmptyState() {
  return (
    <div className="rounded-card border border-line bg-surface p-8 text-center">
      <div className="text-[15px] font-semibold">No encontramos terrenos</div>
      <p className="mt-1 text-[13px] text-ink-muted">
        Probá ampliar la zona o quitar algún filtro.
      </p>
    </div>
  );
}
