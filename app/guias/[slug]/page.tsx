import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SEED_GUIDES } from '@/lib/seed/guides';
import { articleJsonLd } from '@/lib/jsonld';
import { JsonLd } from '@/components/json-ld';
import { MapThumb } from '@/components/map-thumb';
import { ChevronRight } from '@/components/icons';

export const revalidate = 3600;

const RELATED = [
  'Revisión de título',
  'Agrimensura de límites',
  'Tasación de mercado',
];

export function generateStaticParams() {
  return SEED_GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = SEED_GUIDES.find((g) => g.slug === slug);
  if (!article) return { title: 'Guía no encontrada' };
  return {
    title: article.titulo,
    description: article.resumen,
    alternates: { canonical: `/guias/${article.slug}` },
    openGraph: {
      type: 'article',
      title: article.titulo,
      description: article.resumen,
    },
  };
}

export default async function GuiaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = SEED_GUIDES.find((g) => g.slug === slug);
  if (!article) notFound();

  return (
    <div className="container-page max-w-prose py-6 sm:py-10">
      <JsonLd data={articleJsonLd(article)} />

      <Link href="/guias" className="text-[13px] font-semibold text-ink-muted">
        ← Guías
      </Link>

      <header className="mt-4">
        <span className="rounded-pill bg-brand-tint px-2.5 py-1 text-[11px] font-bold uppercase tracking-eyebrow text-brand">
          Guía · {article.categoria}
        </span>
        <h1 className="mt-3.5 text-[27px] font-bold leading-[1.14] tracking-h1 sm:text-[32px]">
          {article.titulo}
        </h1>
        <div className="mt-3.5 flex items-center gap-2.5 text-[12.5px] text-ink-faint">
          <span>Actualizado · {article.fecha}</span>
          <span className="h-[3px] w-[3px] rounded-full bg-ink-faintest" />
          <span>{article.lectura_min} min de lectura</span>
        </div>
      </header>

      <div className="relative mt-5 h-[150px] overflow-hidden rounded-card bg-map-sand">
        <MapThumb seed={article.slug} className="absolute inset-0" />
      </div>

      {/* Prose */}
      <article className="mt-6">
        {article.cuerpo.map((block, i) => {
          if (block.tipo === 'subtitulo') {
            return (
              <h2 key={i} className="mt-7 text-[19px] font-bold tracking-h2">
                {block.texto}
              </h2>
            );
          }
          if (block.tipo === 'cita') {
            return (
              <div
                key={i}
                className="my-6 rounded-r-card border-l-[3px] border-brand bg-trust-bg p-4"
              >
                <div className="mb-1 text-[13px] font-bold text-brand">
                  Señal de alerta
                </div>
                <p className="text-[14.5px] leading-relaxed text-ink-prose">
                  {block.texto}
                </p>
              </div>
            );
          }
          if (block.tipo === 'lista') {
            return (
              <ol key={i} className="my-5 flex flex-col gap-3.5">
                {block.items.map((it, j) => (
                  <li key={j} className="flex gap-3">
                    <span className="flex h-6 w-6 flex-none items-center justify-center rounded-tile bg-brand-tint text-[13px] font-bold text-brand">
                      {j + 1}
                    </span>
                    <span className="text-[15px] leading-relaxed text-ink-prose">
                      {it}
                    </span>
                  </li>
                ))}
              </ol>
            );
          }
          return (
            <p
              key={i}
              className="mb-4 text-[15.5px] leading-[1.62] text-ink-prose"
            >
              {block.texto}
            </p>
          );
        })}
      </article>

      {/* Related services */}
      <aside className="mt-8 rounded-card border border-line bg-surface p-5">
        <div className="mb-3 text-[13px] font-bold uppercase tracking-eyebrow text-ink-faint">
          Servicios relacionados
        </div>
        <div className="flex flex-col">
          {RELATED.map((label, i) => (
            <Link
              key={label}
              href="/servicios"
              className={`flex items-center justify-between py-2.5 text-[14.5px] font-semibold ${
                i > 0 ? 'border-t border-line-soft' : ''
              }`}
            >
              {label}
              <span className="text-brand">
                <ChevronRight size={16} />
              </span>
            </Link>
          ))}
        </div>
      </aside>

      {/* Soft dual CTA */}
      <div className="mt-5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-3 rounded-card border border-trust-border bg-trust-bg p-4">
          <div>
            <div className="text-[15px] font-bold">¿Buscás terreno?</div>
            <div className="mt-0.5 text-[13px] text-ink-muted">
              Explorá lotes con título verificado.
            </div>
          </div>
          <Link href="/buscar" className="btn-primary flex-none px-4 py-2.5">
            Buscar
          </Link>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-card bg-brand-dark p-4 text-white">
          <div>
            <div className="text-[15px] font-bold">¿Tenés un terreno?</div>
            <div className="mt-0.5 text-[13px] text-[#bcd6c5]">
              Tasación gratis en 48 h.
            </div>
          </div>
          <Link href="/vender" className="btn-light flex-none px-4 py-2.5">
            Vender
          </Link>
        </div>
      </div>
    </div>
  );
}
