import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFacets, getListings } from '@/lib/listings-repo';
import { tipoFromSlug, tipoToSlug, kebab, TIPO_PLURAL } from '@/lib/slug';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { SITE } from '@/lib/config';
import { JsonLd } from '@/components/json-ld';
import { ListingCard } from '@/components/listing-card';

export const revalidate = 600; // SSG + ISR

export async function generateStaticParams() {
  // Prerender only tipo×departamento combos that have ≥1 listing; empty combos
  // still render on demand (with noindex) via dynamicParams.
  const all = await getListings();
  const seen = new Set<string>();
  const params: Array<{ tipo: string; departamento: string }> = [];
  for (const l of all) {
    const key = `${l.tipo}|${l.ubicacion.departamento}`;
    if (seen.has(key)) continue;
    seen.add(key);
    params.push({
      tipo: tipoToSlug(l.tipo),
      departamento: kebab(l.ubicacion.departamento),
    });
  }
  return params;
}

async function resolve(tipoSlug: string, deptoSlug: string) {
  const tipo = tipoFromSlug(tipoSlug);
  if (!tipo) return null;
  const facets = await getFacets();
  const depto = facets.departamentos.find((d) => kebab(d.nombre) === deptoSlug);
  if (!depto) return null;
  const listings = await getListings({ tipo, departamento: depto.nombre });
  return { tipo, departamento: depto.nombre, listings };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tipo: string; departamento: string }>;
}): Promise<Metadata> {
  const { tipo, departamento } = await params;
  const r = await resolve(tipo, departamento);
  if (!r) return { title: 'No encontrado' };
  const plural = TIPO_PLURAL[r.tipo];
  const title = `Venta de ${plural} en ${r.departamento}`;
  const description = `${r.listings.length} ${plural} en venta en ${r.departamento}, Paraguay. Mapa, superficie, precio y precio/m² al frente.`;
  return {
    title,
    description,
    alternates: { canonical: `/${tipo}/${departamento}` },
    robots:
      r.listings.length === 0
        ? { index: false, follow: true }
        : { index: true, follow: true },
  };
}

export default async function LandingDeptoPage({
  params,
}: {
  params: Promise<{ tipo: string; departamento: string }>;
}) {
  const { tipo, departamento } = await params;
  const r = await resolve(tipo, departamento);
  if (!r) notFound();

  const plural = TIPO_PLURAL[r.tipo];
  const ciudades = [
    ...new Set(r.listings.map((l) => l.ubicacion.ciudad)),
  ];

  return (
    <div className="container-page max-w-2xl py-8 sm:py-12">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Inicio', url: SITE.url },
          { name: r.departamento, url: `${SITE.url}/${tipo}/${departamento}` },
        ])}
      />

      <nav className="text-[12.5px] text-ink-faint">
        <Link href="/buscar" className="hover:text-brand">
          Buscar
        </Link>{' '}
        / <span className="capitalize">{plural}</span> / {r.departamento}
      </nav>

      <h1 className="mt-2 text-[27px] font-bold capitalize tracking-h1 sm:text-[32px]">
        Venta de {plural} en {r.departamento}
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
        {r.listings.length > 0
          ? `Encontrá ${r.listings.length} ${plural} en venta en ${r.departamento}. Cada publicación muestra el mapa, la superficie y el precio por metro cuadrado para que compares con datos claros.`
          : `Por ahora no tenemos ${plural} publicados en ${r.departamento}. Mirá otras zonas o avisanos qué buscás.`}
      </p>

      {ciudades.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {ciudades.map((c) => (
            <Link
              key={c}
              href={`/${tipo}/${departamento}/${kebab(c)}`}
              className="chip"
            >
              {c}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-3.5 sm:grid-cols-2">
        {r.listings.map((l) => (
          <ListingCard key={l.id} listing={l} />
        ))}
      </div>

      <div className="mt-8">
        <Link
          href={`/buscar?tipo=${r.tipo}&departamento=${encodeURIComponent(r.departamento)}`}
          className="btn-secondary"
        >
          Ver en el mapa
        </Link>
      </div>
    </div>
  );
}
