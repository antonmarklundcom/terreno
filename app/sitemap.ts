import type { MetadataRoute } from 'next';
import { getFacets, getListings } from '@/lib/listings-repo';
import { SEED_GUIDES } from '@/lib/seed/guides';
import { tipoToSlug, kebab } from '@/lib/slug';
import { SITE } from '@/lib/config';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url;
  const [listings, facets] = await Promise.all([getListings(), getFacets()]);

  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/buscar',
    '/vender',
    '/guias',
    '/servicios',
    '/como-funciona',
    '/sobre-nosotros',
    '/legal/privacidad',
    '/legal/terminos',
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));

  const listingRoutes: MetadataRoute.Sitemap = listings.map((l) => ({
    url: `${base}/terreno/${l.slug}`,
    lastModified: new Date(l.updated_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const guideRoutes: MetadataRoute.Sitemap = SEED_GUIDES.map((g) => ({
    url: `${base}/guias/${g.slug}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  // Programmatic landings — only those with ≥1 matching listing.
  const landingRoutes: MetadataRoute.Sitemap = [];
  for (const t of facets.tipos) {
    const tipoSlug = tipoToSlug(t.tipo);
    for (const d of facets.departamentos) {
      const deptoListings = listings.filter(
        (l) => l.tipo === t.tipo && l.ubicacion.departamento === d.nombre,
      );
      if (deptoListings.length === 0) continue;
      landingRoutes.push({
        url: `${base}/${tipoSlug}/${kebab(d.nombre)}`,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
      for (const c of d.ciudades) {
        const cityCount = deptoListings.filter(
          (l) => l.ubicacion.ciudad === c.nombre,
        ).length;
        if (cityCount === 0) continue;
        landingRoutes.push({
          url: `${base}/${tipoSlug}/${kebab(d.nombre)}/${kebab(c.nombre)}`,
          changeFrequency: 'weekly',
          priority: 0.5,
        });
      }
    }
  }

  return [...staticRoutes, ...listingRoutes, ...guideRoutes, ...landingRoutes];
}
