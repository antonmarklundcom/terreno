import { describe, expect, it } from 'vitest';
import type { Listing } from './types';
import { USD_TO_PYG, isDestacado } from './format';
import {
  getListings,
  getListingsResult,
  getListingBySlug,
  getFeaturedListings,
  getAllSlugs,
  getFacets,
} from './listings-repo';

/**
 * The repo is THE seam (ARCHITECTURE §4). These exercise the filter/sort/facet
 * logic against the real seed via the public API only (nothing imports the
 * seed directly). Assertions are invariants, not hardcoded seed counts, so
 * they survive seed edits and — after M1 — a swap to the DB source.
 */

function toUsd(l: Listing): number {
  return l.precio.moneda === 'USD'
    ? l.precio.monto
    : l.precio.monto / USD_TO_PYG;
}

describe('getListings — filtering', () => {
  it('filters by tipo', async () => {
    const rows = await getListings({ tipo: 'campo' });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((l) => l.tipo === 'campo')).toBe(true);
  });

  it('normalizes PYG prices to USD for the price ceiling', async () => {
    const cap = 50_000;
    const rows = await getListings({ precio_max: cap });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((l) => toUsd(l) <= cap)).toBe(true);
  });

  it('applies a superficie floor in m²', async () => {
    const rows = await getListings({ sup_min: 10_000 });
    expect(rows.every((l) => l.superficie_m2 >= 10_000)).toBe(true);
  });

  it('requires ALL selected servicios (AND semantics)', async () => {
    const rows = await getListings({ servicios: ['agua', 'energia'] });
    expect(rows.length).toBeGreaterThan(0);
    expect(
      rows.every(
        (l) => l.servicios.includes('agua') && l.servicios.includes('energia'),
      ),
    ).toBe(true);
  });

  it('combines filters (tipo + estado_titulo)', async () => {
    const rows = await getListings({
      tipo: 'lote_urbano',
      estado_titulo: 'con_titulo',
    });
    expect(
      rows.every(
        (l) => l.tipo === 'lote_urbano' && l.estado_titulo === 'con_titulo',
      ),
    ).toBe(true);
  });

  it('returns everything when no filters are given', async () => {
    const all = await getListings();
    expect(all.length).toBeGreaterThan(10);
  });
});

describe('getListings — sorting', () => {
  it('places live featured listings before the rest', async () => {
    const now = Date.now();
    const rows = await getListings();
    const firstNonFeatured = rows.findIndex((l) => !isDestacado(l, now));
    if (firstNonFeatured === -1) return; // all featured — nothing to prove
    // No featured listing may appear after the first non-featured one.
    const tail = rows.slice(firstNonFeatured);
    expect(tail.some((l) => isDestacado(l, now))).toBe(false);
  });
});

describe('getListingsResult — pagination', () => {
  it('slices by page/per_page and reports the unpaginated total', async () => {
    const all = await getListings();
    const perPage = 5;
    const page1 = await getListingsResult({ per_page: perPage, page: 1 });
    expect(page1.total).toBe(all.length);
    expect(page1.data.length).toBe(Math.min(perPage, all.length));
    expect(page1.data[0].id).toBe(all[0].id);

    const page2 = await getListingsResult({ per_page: perPage, page: 2 });
    expect(page2.data[0]?.id).toBe(all[perPage]?.id);
  });
});

describe('getListingBySlug', () => {
  it('finds a known slug and returns null for an unknown one', async () => {
    const slugs = await getAllSlugs();
    const hit = await getListingBySlug(slugs[0]);
    expect(hit?.slug).toBe(slugs[0]);
    expect(await getListingBySlug('no-such-slug-xyz')).toBeNull();
  });
});

describe('getFeaturedListings', () => {
  it('returns at most the requested limit and leads with featured', async () => {
    const now = Date.now();
    const rows = await getFeaturedListings(6);
    expect(rows.length).toBeLessThanOrEqual(6);
    const liveFeatured = (await getListings()).filter((l) =>
      isDestacado(l, now),
    );
    if (liveFeatured.length > 0) {
      expect(isDestacado(rows[0], now)).toBe(true);
    }
  });

  it('tops up with non-featured filler without duplicates', async () => {
    const rows = await getFeaturedListings(8);
    const ids = new Set(rows.map((l) => l.id));
    expect(ids.size).toBe(rows.length);
  });
});

describe('getAllSlugs', () => {
  it('returns unique, non-empty slugs', async () => {
    const slugs = await getAllSlugs();
    expect(slugs.length).toBeGreaterThan(0);
    expect(slugs.every((s) => s.length > 0)).toBe(true);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe('getFacets', () => {
  it('tipo counts sum to the total listing count', async () => {
    const all = await getListings();
    const facets = await getFacets();
    const sum = facets.tipos.reduce((n, t) => n + t.count, 0);
    expect(sum).toBe(all.length);
  });

  it('departamento counts equal the sum of their ciudad counts', async () => {
    const facets = await getFacets();
    for (const d of facets.departamentos) {
      const ciudadSum = d.ciudades.reduce((n, c) => n + c.count, 0);
      expect(ciudadSum).toBe(d.count);
    }
  });

  it('sorts departamentos alphabetically (es collation)', async () => {
    const facets = await getFacets();
    const names = facets.departamentos.map((d) => d.nombre);
    const sorted = [...names].sort((a, b) =>
      new Intl.Collator('es').compare(a, b),
    );
    expect(names).toEqual(sorted);
  });
});
