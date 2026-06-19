import type { Tipo } from './types';

/**
 * Slug helpers for programmatic SEO routes (/[tipo]/[departamento]/[ciudad]).
 * Geography slugs are kebab-cased Spanish names; tipo slugs are fixed.
 */

export function kebab(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .toLowerCase()
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** URL slug ↔ Tipo. */
export const TIPO_SLUGS: Record<string, Tipo> = {
  lotes: 'lote_urbano',
  'terrenos-comerciales': 'terreno_comercial',
  campos: 'campo',
  quintas: 'quinta',
  loteamientos: 'loteamiento',
};

export const TIPO_TO_SLUG: Record<Tipo, string> = {
  lote_urbano: 'lotes',
  terreno_comercial: 'terrenos-comerciales',
  campo: 'campos',
  quinta: 'quintas',
  loteamiento: 'loteamientos',
};

/** Plural noun for landing-page copy, e.g. "lotes en Luque". */
export const TIPO_PLURAL: Record<Tipo, string> = {
  lote_urbano: 'lotes',
  terreno_comercial: 'terrenos comerciales',
  campo: 'campos',
  quinta: 'quintas',
  loteamiento: 'loteamientos',
};

export function tipoFromSlug(slug: string): Tipo | null {
  return TIPO_SLUGS[slug] ?? null;
}

export function tipoToSlug(tipo: Tipo): string {
  return TIPO_TO_SLUG[tipo];
}
