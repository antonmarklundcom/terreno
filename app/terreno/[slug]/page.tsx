import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllSlugs, getListingBySlug } from '@/lib/listings-repo';
import {
  formatUsd,
  formatGs,
  formatSuperficie,
  precioPorUnidad,
  formatFechaLarga,
  tipoLabel,
  FINANCIACION_LABEL,
} from '@/lib/format';
import { listingWaLink, listingContactNumber } from '@/lib/whatsapp';
import { listingJsonLd, breadcrumbJsonLd } from '@/lib/jsonld';
import { SITE } from '@/lib/config';
import type { Servicio } from '@/lib/types';
import { DetailMap } from '@/components/detail-map';
import { JsonLd } from '@/components/json-ld';
import { WaButton } from '@/components/wa-button';
import { TipoPill, TituloBadge, ServicioBadge } from '@/components/badges';
import {
  PinIcon,
  ShieldCheck,
  CardIcon,
  ChevronLeft,
  ChevronRight,
  CameraIcon,
  ShareIcon,
  HeartIcon,
  PhoneIcon,
} from '@/components/icons';

export const revalidate = 300; // SSG + ISR

const ALL_SERVICIOS: Servicio[] = [
  'agua',
  'energia',
  'desague',
  'asfalto',
  'empedrado',
  'internet',
];

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) return { title: 'Terreno no encontrado' };
  const per = precioPorUnidad(listing);
  const title = `${listing.titulo} — ${formatUsd(listing.precio.monto)}`;
  const description = `${tipoLabel(listing.tipo)} en ${listing.ubicacion.ciudad}, ${listing.ubicacion.departamento}. ${formatSuperficie(listing.tipo, listing.superficie_m2)} · ${per.label} · ${listing.estado_titulo === 'con_titulo' ? 'Con título' : 'Título en proceso'}.`;
  return {
    title,
    description,
    alternates: { canonical: `/terreno/${listing.slug}` },
    openGraph: { title, description, images: [listing.images[0]] },
  };
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4">
      <div className="eyebrow">{label}</div>
      <div className="tnum mt-0.5 text-[16px] font-bold">{value}</div>
    </div>
  );
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) notFound();

  const per = precioPorUnidad(listing);
  const waLink = listingWaLink(listing);
  const waNumber = listingContactNumber(listing);
  const ubic = [
    listing.ubicacion.ciudad,
    listing.ubicacion.barrio,
    listing.ubicacion.departamento,
  ]
    .filter(Boolean)
    .join(' · ');
  const isLoteamiento = listing.tipo === 'loteamiento' && listing.loteamiento;

  return (
    <div className="pb-24">
      <JsonLd data={listingJsonLd(listing)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Inicio', url: SITE.url },
          { name: 'Buscar', url: `${SITE.url}/buscar` },
          { name: listing.titulo, url: `${SITE.url}/terreno/${listing.slug}` },
        ])}
      />

      <div className="container-page max-w-2xl">
        {/* Top actions */}
        <div className="flex items-center justify-between py-3">
          <Link href="/buscar" aria-label="Volver" className="text-ink">
            <ChevronLeft size={22} />
          </Link>
          <div className="flex gap-4 text-ink">
            <button type="button" aria-label="Compartir">
              <ShareIcon size={20} />
            </button>
            <button type="button" aria-label="Guardar">
              <HeartIcon size={20} />
            </button>
          </div>
        </div>

        {/* PRIMARY map */}
        <div className="relative h-[260px] overflow-hidden rounded-card bg-map-sand">
          <DetailMap
            lat={listing.ubicacion.lat}
            lng={listing.ubicacion.lng}
            polygon={listing.ubicacion.polygon}
            label={formatUsd(listing.precio.monto)}
            className="absolute inset-0"
          />
          <div className="pointer-events-none absolute left-3 top-3">
            <TipoPill tipo={listing.tipo} />
          </div>
          <div className="pointer-events-none absolute right-3 top-3">
            <TituloBadge estado={listing.estado_titulo} />
          </div>
        </div>

        {/* Title + price */}
        <div className="pt-5">
          <h1 className="text-[22px] font-bold leading-tight tracking-tight2">
            {listing.titulo}
          </h1>
          <div className="mt-1 flex items-center gap-1.5 text-[14px] text-ink-muted">
            <span className="text-ink-faint">
              <PinIcon size={14} />
            </span>
            {ubic}
          </div>
          <div className="mt-3.5 flex items-baseline gap-2.5">
            <div className="tnum text-[28px] font-bold tracking-tight2">
              {isLoteamiento
                ? `desde ${formatUsd(listing.loteamiento!.precio_desde)}`
                : formatUsd(listing.precio.monto)}
            </div>
            <div className="tnum text-[14px] font-semibold text-brand">
              {per.label}
            </div>
          </div>
          <div className="tnum mt-0.5 text-[13px] text-ink-faint">
            ≈{' '}
            {formatGs(
              isLoteamiento
                ? listing.loteamiento!.precio_desde
                : listing.precio.monto,
            )}
          </div>
        </div>

        {/* Key facts / loteamiento aggregate */}
        {isLoteamiento ? (
          <div className="mt-4 overflow-hidden rounded-card border border-line bg-surface">
            <div className="grid grid-cols-2">
              <div className="border-b border-r border-line-soft">
                <Fact
                  label="Lotes disponibles"
                  value={`${listing.loteamiento!.lotes_disponibles} de ${listing.loteamiento!.lotes_total}`}
                />
              </div>
              <div className="border-b border-line-soft">
                <Fact
                  label="Desde"
                  value={formatUsd(listing.loteamiento!.precio_desde)}
                />
              </div>
              <div className="border-r border-line-soft">
                <Fact
                  label="Superficie desde"
                  value={formatSuperficie(listing.tipo, listing.superficie_m2)}
                />
              </div>
              <div>
                <Fact
                  label="Cuota desde"
                  value={
                    listing.loteamiento!.cuota_desde
                      ? formatUsd(listing.loteamiento!.cuota_desde)
                      : 'A convenir'
                  }
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-card border border-line bg-surface">
            <div className="grid grid-cols-2 divide-x divide-line-soft [&>*:nth-child(-n+4)]:border-b [&>*]:border-line-soft">
              <Fact
                label="Superficie"
                value={formatSuperficie(listing.tipo, listing.superficie_m2)}
              />
              <Fact label="Precio / unidad" value={per.label} />
              <Fact
                label="Frente"
                value={
                  listing.dimensiones?.frente_m
                    ? `${listing.dimensiones.frente_m} m`
                    : '—'
                }
              />
              <Fact
                label="Dimensiones"
                value={
                  listing.dimensiones?.frente_m && listing.dimensiones?.fondo_m
                    ? `${listing.dimensiones.frente_m} × ${listing.dimensiones.fondo_m} m`
                    : '—'
                }
              />
              <Fact label="Esquina" value={listing.esquina ? 'Sí' : 'No'} />
              <Fact
                label="Financiación"
                value={FINANCIACION_LABEL[listing.financiacion]}
              />
            </div>
          </div>
        )}

        {/* Trust badges */}
        <div className="mt-4 flex gap-2.5">
          <div className="flex flex-1 items-center gap-2.5 rounded-card border border-trust-borderAlt bg-brand-tint p-3">
            <div className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-tile bg-brand text-white">
              <ShieldCheck size={16} />
            </div>
            <div>
              <div className="text-[13px] font-bold text-brand">
                {listing.estado_titulo === 'con_titulo'
                  ? 'Con título'
                  : 'Título en proceso'}
              </div>
              <div className="text-[11px] text-ink-muted">
                {listing.estado_titulo === 'con_titulo'
                  ? 'Verificado'
                  : 'En trámite'}
              </div>
            </div>
          </div>
          <div className="flex flex-1 items-center gap-2.5 rounded-card border border-amber-border bg-amber-bg p-3">
            <div className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-tile bg-amber text-white">
              <CardIcon size={16} />
            </div>
            <div>
              <div className="text-[13px] font-bold text-amber-ink">
                {FINANCIACION_LABEL[listing.financiacion]}
              </div>
              <div className="text-[11px] text-ink-muted">
                {listing.financiacion === 'cuotas'
                  ? 'Planes disponibles'
                  : 'Pago único'}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-6">
          <h2 className="section-h">Descripción</h2>
          <p className="mt-2.5 text-[15px] leading-relaxed text-ink-prose">
            {listing.descripcion}
          </p>
        </div>

        {/* Servicios */}
        <div className="mt-6">
          <h2 className="section-h">Servicios disponibles</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {ALL_SERVICIOS.map((s) => (
              <ServicioBadge
                key={s}
                servicio={s}
                available={listing.servicios.includes(s)}
              />
            ))}
          </div>
        </div>

        {/* Photos (secondary) */}
        <div className="mt-6">
          <div className="mb-2.5 flex items-baseline justify-between">
            <h2 className="section-h">Fotos del lote</h2>
            <span className="text-[12px] text-ink-faint">referenciales</span>
          </div>
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex h-20 w-[108px] flex-none items-center justify-center rounded-[10px] border border-line-cool bg-fill-track text-ink-faintest"
              >
                <CameraIcon size={20} />
              </div>
            ))}
          </div>
        </div>

        {/* Services cross-sell */}
        <div className="mt-6 rounded-card border border-trust-border bg-trust-bg p-5">
          <div className="text-[15px] font-bold leading-snug">
            ¿Necesitás un tasador o revisión legal?
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
            Verificamos límites, frente y estado de título antes de que firmes.
            Pedilo y coordinamos un profesional local.
          </p>
          <div className="mt-3.5 flex flex-col gap-2">
            {['Revisión de título', 'Agrimensura / límites'].map((label) => (
              <Link
                key={label}
                href="/servicios"
                className="flex items-center justify-between rounded-[10px] border border-trust-border bg-surface px-3.5 py-3 text-[14px] font-semibold hover:border-brand/40"
              >
                {label}
                <span className="text-brand">
                  <ChevronRight size={16} />
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Posted date */}
        <p className="mt-6 text-[12px] text-ink-faint">
          Publicado por {listing.owner.inmobiliaria ?? listing.owner.nombre} ·
          Actualizado el {formatFechaLarga(listing.updated_at)}
        </p>
      </div>

      {/* Sticky contact bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line-soft bg-surface">
        <div className="container-page max-w-2xl flex gap-2.5 py-3">
          <a
            href={`tel:+${waNumber}`}
            aria-label="Llamar"
            className="flex h-12 w-[52px] flex-none items-center justify-center rounded-[11px] border border-line-cool text-ink"
          >
            <PhoneIcon size={20} />
          </a>
          <WaButton
            href={waLink}
            className="btn-whatsapp flex-1"
            lead={{ tipo_lead: 'listing_contact', listing_slug: listing.slug }}
          >
            Contactar por WhatsApp
          </WaButton>
        </div>
      </div>
    </div>
  );
}
