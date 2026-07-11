import { describe, expect, it } from 'vitest';
import type { Tipo } from './types';
import {
  kebab,
  tipoFromSlug,
  tipoToSlug,
  TIPO_SLUGS,
  TIPO_TO_SLUG,
} from './slug';

/**
 * URL builders/parsers are pure and are an SEO contract — a slug that changes
 * shape silently breaks indexed programmatic pages. Test them the day they
 * exist (playbook Day-0 rule).
 */

describe('kebab', () => {
  it('lowercases, strips accents and spaces to single hyphens', () => {
    expect(kebab('San Lorenzo')).toBe('san-lorenzo');
    expect(kebab('Ñemby')).toBe('nemby');
    expect(kebab('Área Comercial')).toBe('area-comercial');
  });
  it('collapses runs of separators and trims edge hyphens', () => {
    expect(kebab('  Luque -- Centro  ')).toBe('luque-centro');
    expect(kebab('Ruta 2, km 18')).toBe('ruta-2-km-18');
  });
});

describe('tipo <-> slug', () => {
  const tipos: Tipo[] = [
    'lote_urbano',
    'terreno_comercial',
    'campo',
    'quinta',
    'loteamiento',
  ];

  it('round-trips every tipo through its slug', () => {
    for (const t of tipos) {
      expect(tipoFromSlug(tipoToSlug(t))).toBe(t);
    }
  });

  it('exposes the exact ARCHITECTURE §6 slug set', () => {
    expect(Object.keys(TIPO_SLUGS).sort()).toEqual(
      [
        'campos',
        'loteamientos',
        'lotes',
        'quintas',
        'terrenos-comerciales',
      ].sort(),
    );
  });

  it('maps forward and back are inverses', () => {
    for (const [slug, tipo] of Object.entries(TIPO_SLUGS)) {
      expect(TIPO_TO_SLUG[tipo]).toBe(slug);
    }
  });

  it('returns null for an unknown slug', () => {
    expect(tipoFromSlug('mansiones')).toBeNull();
    expect(tipoFromSlug('')).toBeNull();
  });
});
