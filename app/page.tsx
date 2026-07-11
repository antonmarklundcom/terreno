import Link from 'next/link';
import type { Metadata } from 'next';
import { getFacets, getFeaturedListings } from '@/lib/listings-repo';
import { SEED_GUIDES } from '@/lib/seed/guides';
import { BuyerSearch } from '@/components/buyer-search';
import { SellerCtaCard } from '@/components/seller-cta-card';
import { ListingCard } from '@/components/listing-card';
import {
  ChevronRight,
  ShieldCheck,
  LayersIcon,
  UsersIcon,
} from '@/components/icons';

export const metadata: Metadata = {
  title: 'Terrenos en Paraguay, con datos claros',
  description:
    'Comprá lotes, campos, quintas y loteamientos en Paraguay con mapa, superficie, precio y precio/m² al frente. O vendé tu terreno: lo valuamos, publicamos y vendemos por vos.',
  alternates: { canonical: '/' },
};

const TRUST = [
  {
    icon: ShieldCheck,
    titulo: 'Título verificado',
    texto: 'Revisamos el estado de título antes de publicar.',
  },
  {
    icon: LayersIcon,
    titulo: 'Medidas y límites claros',
    texto: 'Superficie, frente y ubicación sobre mapa real.',
  },
  {
    icon: UsersIcon,
    titulo: 'Acompañamiento local',
    texto: 'Tasadores y agrimensores en cada departamento.',
  },
];

const SERVICIOS = [
  { titulo: 'Tasación', texto: 'Valor de mercado con datos de la zona.' },
  {
    titulo: 'Revisión de título',
    texto: 'Verificación legal antes de comprar.',
  },
  { titulo: 'Agrimensura', texto: 'Medición de límites y frente.' },
  { titulo: 'Financiación', texto: 'Comparar contado y cuotas.' },
];

export default async function HomePage() {
  const [facets, featured] = await Promise.all([
    getFacets(),
    getFeaturedListings(6),
  ]);
  const guides = SEED_GUIDES.slice(0, 3);

  return (
    <div className="container-page py-8 sm:py-12">
      {/* Hero */}
      <section className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
        <h1 className="text-[26px] font-bold leading-[1.12] tracking-h1 sm:text-[32px] lg:text-[40px]">
          Terrenos en Paraguay, con datos claros.
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-muted sm:text-[16px]">
          Lotes, campos, quintas y loteamientos — ubicación, superficie y título
          verificados, sin vueltas.
        </p>
      </section>

      {/* Dual path — balanced two-column band on lg+, stacked on mobile. */}
      <section className="mt-6 grid items-start gap-3.5 lg:mt-8 lg:grid-cols-2 lg:gap-5">
        <BuyerSearch facets={facets} />
        <SellerCtaCard />
      </section>

      {/* Featured — carousel on mobile, responsive grid on desktop. */}
      <section className="mt-12 lg:mt-16">
        <div className="mb-3.5 flex items-baseline justify-between">
          <h2 className="section-h">Destacados</h2>
          <Link href="/buscar" className="text-[13px] font-semibold text-brand">
            Ver todos
          </Link>
        </div>
        <div className="-mx-5 grid auto-cols-[260px] grid-flow-col gap-3 overflow-x-auto px-5 pb-1.5 sm:mx-0 sm:auto-cols-fr sm:grid-flow-row sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-3 xl:grid-cols-4">
          {featured.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      </section>

      {/* Trust band */}
      <section className="mt-12 rounded-card border border-trust-border bg-trust-bg p-5 sm:p-6 lg:mt-16 lg:p-8">
        <h2 className="mb-4 section-h lg:mb-6">Por qué confiar en nosotros</h2>
        <div className="grid gap-4 sm:grid-cols-3 lg:gap-8">
          {TRUST.map(({ icon: Icon, titulo, texto }) => (
            <div key={titulo} className="flex items-start gap-3">
              <div className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-tile bg-trust-icon text-brand">
                <Icon size={17} />
              </div>
              <div>
                <div className="text-[14px] font-semibold">{titulo}</div>
                <div className="text-[13px] leading-snug text-ink-muted">
                  {texto}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Guides + Services — two-column composition on lg+. */}
      <div className="mt-12 grid gap-12 lg:mt-16 lg:grid-cols-2 lg:gap-10">
        {/* Guides */}
        <section>
          <div className="mb-3.5 flex items-baseline justify-between">
            <h2 className="section-h">Guías para invertir</h2>
            <Link
              href="/guias"
              className="text-[13px] font-semibold text-brand"
            >
              Ver todas
            </Link>
          </div>
          <div className="overflow-hidden rounded-card border border-line">
            {guides.map((g, i) => (
              <Link
                key={g.slug}
                href={`/guias/${g.slug}`}
                className={`flex items-center justify-between gap-2.5 bg-surface p-3.5 hover:bg-canvas ${
                  i > 0 ? 'border-t border-line-soft' : ''
                }`}
              >
                <span className="text-[14px] font-medium leading-snug">
                  {g.titulo}
                </span>
                <span className="text-ink-faintest">
                  <ChevronRight size={16} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Services */}
        <section>
          <div className="mb-3.5 flex items-baseline justify-between">
            <h2 className="section-h">Servicios</h2>
            <Link
              href="/servicios"
              className="text-[13px] font-semibold text-brand"
            >
              Ver todos
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {SERVICIOS.map((s) => (
              <Link
                key={s.titulo}
                href="/servicios"
                className="rounded-card border border-line bg-surface p-3.5 hover:border-brand/30"
              >
                <div className="text-[14px] font-semibold">{s.titulo}</div>
                <div className="mt-0.5 text-[12.5px] leading-snug text-ink-muted">
                  {s.texto}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
