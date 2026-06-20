import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFacets, getListings } from '@/lib/listings-repo';
import { tipoFromSlug, tipoToSlug, kebab, TIPO_PLURAL } from '@/lib/slug';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { SITE } from '@/lib/config';
import { JsonLd } from '@/components/json-ld';
import { ListingCard } from '@/components/listing-card';

export const revalidate = 600;

export async function generateStaticParams() {
  // Prerender only tipo×departamento×ciudad combos that have ≥1 listing.
  const all = await getListings();
  const seen = new Set<string>();
  const params: Array<{ tipo: string; departamento: string; ciudad: string }> = [];
  for (const l of all) {
    const key = `${l.tipo}|${l.ubicacion.departamento}|${l.ubicacion.ciudad}`;
    if (seen.has(key)) continue;
    seen.add(key);
    params.push({
      tipo: tipoToSlug(l.tipo),
      departamento: kebab(l.ubicacion.departamento),
      ciudad: kebab(l.ubicacion.ciudad),
    });
  }
  return params;
}

async function resolve(tipoSlug: string, deptoSlug: string, ciudadSlug: string) {
  const tipo = tipoFromSlug(tipoSlug);
  if (!tipo) return null;
  const facets = await getFacets();
  const depto = facets.departamentos.find((d) => kebab(d.nombre) === deptoSlug);
  if (!depto) return null;
  const ciudad = depto.ciudades.find((c) => kebab(c.nombre) === ciudadSlug);
  if (!ciudad) return null;
  const listings = await getListings({
    tipo,
    departamento: depto.nombre,
    ciudad: ciudad.nombre,
  });
  return { tipo, departamento: depto.nombre, ciudad: ciudad.nombre, listings };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tipo: string; departamento: string; ciudad: string }>;
}): Promise<Metadata> {
  const { tipo, departamento, ciudad } = await params;
  const r = await resolve(tipo, departamento, ciudad);
  if (!r) return { title: 'No encontrado' };
  const plural = TIPO_PLURAL[r.tipo];
  const title = `Venta de ${plural} en ${r.ciudad}`;
  const description = `${r.listings.length} ${plural} en venta en ${r.ciudad}, ${r.departamento}. Mapa, superficie, precio y precio/m² al frente.`;
  return {
    title,
    description,
    alternates: { canonical: `/${tipo}/${departamento}/${ciudad}` },
    robots:
      r.listings.length === 0
        ? { index: false, follow: true }
        : { index: true, follow: true },
  };
}

export default async function LandingCiudadPage({
  params,
}: {
  params: Promise<{ tipo: string; departamento: string; ciudad: string }>;
}) {
  const { tipo, departamento, ciudad } = await params;
  const r = await resolve(tipo, departamento, ciudad);
  if (!r) notFound();

  const plural = TIPO_PLURAL[r.tipo];

  return (
    <div className="container-page max-w-2xl py-8 sm:py-12">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Inicio', url: SITE.url },
          { name: r.departamento, url: `${SITE.url}/${tipo}/${departamento}` },
          { name: r.ciudad, url: `${SITE.url}/${tipo}/${departamento}/${ciudad}` },
        ])}
      />

      <nav className="text-[12.5px] text-ink-faint">
        <Link href={`/${tipo}/${departamento}`} className="hover:text-brand">
          {r.departamento}
        </Link>{' '}
        / {r.ciudad}
      </nav>

      <h1 className="mt-2 text-[27px] font-bold capitalize tracking-h1 sm:text-[32px]">
        Venta de {plural} en {r.ciudad}
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
        {r.listings.length > 0
          ? `${r.listings.length} ${plural} en venta en ${r.ciudad}, ${r.departamento}, con mapa, superficie y precio por metro cuadrado al frente.`
          : `Por ahora no tenemos ${plural} publicados en ${r.ciudad}. Probá en ${r.departamento} o avisanos qué buscás.`}
      </p>

      <div className="mt-6 grid gap-3.5 sm:grid-cols-2">
        {r.listings.map((l) => (
          <ListingCard key={l.id} listing={l} />
        ))}
      </div>

      <div className="mt-8">
        <Link
          href={`/buscar?tipo=${r.tipo}&departamento=${encodeURIComponent(r.departamento)}&ciudad=${encodeURIComponent(r.ciudad)}`}
          className="btn-secondary"
        >
          Ver en el mapa
        </Link>
      </div>
    </div>
  );
}
