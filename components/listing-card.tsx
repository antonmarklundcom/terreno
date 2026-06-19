import Link from 'next/link';
import type { Listing } from '@/lib/types';
import {
  formatUsd,
  formatGs,
  formatSuperficie,
  precioPorUnidad,
  isDestacado,
  tipoLabel,
} from '@/lib/format';
import { SITE } from '@/lib/config';
import { MapThumb } from './map-thumb';
import {
  TipoPill,
  TituloBadge,
  DestacadoBadge,
  FinanciacionTag,
  ServicioChip,
} from './badges';
import { PinIcon } from './icons';

function priceLine(listing: Listing) {
  const per = precioPorUnidad(listing);
  if (listing.tipo === 'loteamiento' && listing.loteamiento) {
    return {
      price: `desde ${formatUsd(listing.loteamiento.precio_desde)}`,
      per: per.label,
    };
  }
  return { price: formatUsd(listing.precio.monto), per: per.label };
}

/** Vertical card — featured strip and mobile results list. */
export function ListingCard({ listing }: { listing: Listing }) {
  const { price, per } = priceLine(listing);
  const destacado = SITE.featuredBadges && isDestacado(listing);
  const ubic = [listing.ubicacion.ciudad, listing.ubicacion.barrio, listing.ubicacion.departamento]
    .filter(Boolean)
    .join(' · ');

  return (
    <Link
      href={`/terreno/${listing.slug}`}
      className="card group block overflow-hidden transition-shadow hover:shadow-raised"
    >
      <div className="relative h-[158px] bg-map-sand">
        <MapThumb seed={listing.slug} withPin className="absolute inset-0" />
        <div className="absolute left-2.5 top-2.5 flex gap-1.5">
          <TipoPill tipo={listing.tipo} />
          {destacado && <DestacadoBadge />}
        </div>
        <div className="absolute right-2.5 top-2.5">
          <TituloBadge estado={listing.estado_titulo} />
        </div>
      </div>

      <div className="p-3.5">
        <div className="flex items-baseline justify-between gap-2">
          <div className="tnum text-[19px] font-bold tracking-tight2">{price}</div>
          <div className="tnum text-[13px] font-semibold text-brand">{per}</div>
        </div>
        <div className="tnum mt-0.5 text-[12px] text-ink-faint">
          ≈ {formatGs(listing.precio.monto)}
        </div>

        <div className="mt-2 text-[15px] font-semibold">{listing.titulo}</div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[13px] text-ink-muted">
          <span className="text-ink-faint">
            <PinIcon size={13} />
          </span>
          {ubic}
        </div>

        <div className="mt-2.5 text-[13px] font-semibold text-ink-soft">
          {listing.tipo === 'loteamiento' && listing.loteamiento
            ? `${listing.loteamiento.lotes_disponibles} lotes disponibles`
            : formatSuperficie(listing.tipo, listing.superficie_m2)}
        </div>

        {listing.servicios.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {listing.servicios.slice(0, 4).map((s) => (
              <ServicioChip key={s} servicio={s} />
            ))}
          </div>
        )}

        <div className="mt-3 border-t border-line-soft pt-2.5">
          <FinanciacionTag financiacion={listing.financiacion} />
        </div>
      </div>
    </Link>
  );
}

/** Horizontal card — desktop results list (200px map left, data right). */
export function ListingRow({ listing }: { listing: Listing }) {
  const { price, per } = priceLine(listing);
  const destacado = SITE.featuredBadges && isDestacado(listing);
  const ubic = [listing.ubicacion.ciudad, listing.ubicacion.departamento]
    .filter(Boolean)
    .join(' · ');

  return (
    <Link
      href={`/terreno/${listing.slug}`}
      className="card flex overflow-hidden transition-shadow hover:shadow-raised"
    >
      <div className="relative w-[200px] flex-none bg-map-sand">
        <MapThumb seed={listing.slug} withPin className="absolute inset-0 h-full" />
        <div className="absolute left-2 top-2 flex flex-col gap-1.5">
          <TipoPill tipo={listing.tipo} />
          {destacado && <DestacadoBadge />}
        </div>
      </div>
      <div className="min-w-0 flex-1 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <div className="tnum text-[18px] font-bold tracking-tight2">{price}</div>
          <div className="tnum text-[12.5px] font-semibold text-brand">{per}</div>
        </div>
        <div className="tnum mt-0.5 text-[11.5px] text-ink-faint">
          ≈ {formatGs(listing.precio.monto)}
        </div>
        <div className="mt-1.5 text-[14.5px] font-semibold">{listing.titulo}</div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-ink-muted">
          <span className="text-ink-faint">
            <PinIcon size={12} />
          </span>
          {ubic}
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] font-semibold text-ink-soft">
          <span>
            {listing.tipo === 'loteamiento' && listing.loteamiento
              ? `desde ${formatSuperficie(listing.tipo, listing.superficie_m2)}`
              : formatSuperficie(listing.tipo, listing.superficie_m2)}
          </span>
          {listing.estado_titulo === 'con_titulo' && (
            <span className="inline-flex items-center gap-1 text-brand">Con título</span>
          )}
          <span className="font-medium text-ink-muted">
            {listing.financiacion === 'cuotas' ? 'Cuotas' : 'Contado'}
          </span>
        </div>
      </div>
    </Link>
  );
}

export { tipoLabel };
