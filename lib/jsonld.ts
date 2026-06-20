import type { GuideArticle, Listing } from './types';
import { SITE } from './config';
import { tipoLabel, formatSuperficie } from './format';

/** JSON-LD builders for SEO structured data. */

export function listingJsonLd(listing: Listing) {
  const url = `${SITE.url}/terreno/${listing.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: listing.titulo,
    description: listing.descripcion,
    image: `${SITE.url}${listing.images[0]}`,
    category: tipoLabel(listing.tipo),
    url,
    offers: {
      '@type': 'Offer',
      price: listing.precio.monto,
      priceCurrency: listing.precio.moneda,
      availability: 'https://schema.org/InStock',
      url,
    },
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Superficie',
        value: formatSuperficie(listing.tipo, listing.superficie_m2),
      },
      {
        '@type': 'PropertyValue',
        name: 'Estado de título',
        value:
          listing.estado_titulo === 'con_titulo' ? 'Con título' : 'En proceso',
      },
    ],
    areaServed: {
      '@type': 'Place',
      name: `${listing.ubicacion.ciudad}, ${listing.ubicacion.departamento}`,
      geo: {
        '@type': 'GeoCoordinates',
        latitude: listing.ubicacion.lat,
        longitude: listing.ubicacion.lng,
      },
    },
  };
}

export function articleJsonLd(article: GuideArticle) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.titulo,
    description: article.resumen,
    articleSection: article.categoria,
    url: `${SITE.url}/guias/${article.slug}`,
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      url: SITE.url,
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}
