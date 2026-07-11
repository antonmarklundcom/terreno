import { describe, expect, it } from 'vitest';
import type { Listing } from './types';
import {
  USD_TO_PYG,
  formatUsd,
  formatGs,
  formatUsdCompact,
  formatPrecio,
  usesHectares,
  formatSuperficie,
  precioPorUnidad,
  isDestacado,
  formatFecha,
} from './format';

/**
 * Money + superficie math is pure and load-bearing (every card, pin and
 * detail page derives price/m² and hectárea display from it). These are the
 * day-0 tests the playbook demands for money logic.
 */

// Minimal Listing factory — only the fields the format helpers read.
function listing(over: Partial<Listing> = {}): Listing {
  return {
    id: 't-001',
    slug: 'lote-x-t-001',
    owner_type: 'broker',
    owner: { nombre: 'X', telefono_wa: '595981000000' },
    tipo: 'lote_urbano',
    titulo: 'Lote',
    descripcion: '',
    ubicacion: { departamento: 'Central', ciudad: 'Luque', lat: 0, lng: 0 },
    superficie_m2: 360,
    precio: { monto: 30000, moneda: 'USD' },
    esquina: false,
    servicios: [],
    estado_titulo: 'con_titulo',
    financiacion: 'contado',
    images: [],
    status: 'published',
    created_at: 0,
    updated_at: 0,
    ...over,
  };
}

describe('formatUsd', () => {
  it('rounds and groups with es-PY thousands separator', () => {
    expect(formatUsd(28500)).toBe('US$ 28.500');
    expect(formatUsd(1234567.8)).toBe('US$ 1.234.568');
    expect(formatUsd(0)).toBe('US$ 0');
  });
});

describe('formatGs', () => {
  it('converts USD to Gs at the fixed display rate', () => {
    expect(formatGs(100)).toBe(
      `Gs. ${(100 * USD_TO_PYG).toLocaleString('es-PY')}`,
    );
    // 100 USD -> 730.000 Gs
    expect(formatGs(100)).toBe('Gs. 730.000');
  });
});

describe('formatUsdCompact', () => {
  it('keeps one decimal below 100k and rounds whole above', () => {
    expect(formatUsdCompact(28500)).toBe('US$ 28,5k');
    expect(formatUsdCompact(190000)).toBe('US$ 190k');
  });
  it('falls back to full format under 1000', () => {
    expect(formatUsdCompact(900)).toBe('US$ 900');
  });
});

describe('formatPrecio', () => {
  it('formats PYG amounts directly without conversion', () => {
    expect(formatPrecio(730000, 'PYG')).toBe('Gs. 730.000');
    expect(formatPrecio(30000, 'USD')).toBe('US$ 30.000');
  });
});

describe('usesHectares', () => {
  it('is true for campos and for any parcel >= 1 ha', () => {
    expect(usesHectares('campo', 5000)).toBe(true);
    expect(usesHectares('lote_urbano', 10_000)).toBe(true);
    expect(usesHectares('lote_urbano', 9_999)).toBe(false);
  });
});

describe('formatSuperficie', () => {
  it('shows m² for small urban lots', () => {
    expect(formatSuperficie('lote_urbano', 360)).toBe('360 m²');
  });
  it('shows hectáreas for campos, trimming trailing zeros', () => {
    expect(formatSuperficie('campo', 20_000)).toBe('2 ha');
    expect(formatSuperficie('campo', 25_000)).toBe('2,5 ha');
  });
});

describe('precioPorUnidad', () => {
  it('derives price per m² for urban lots (never stored)', () => {
    const r = precioPorUnidad(
      listing({ superficie_m2: 300, precio: { monto: 30000, moneda: 'USD' } }),
    );
    expect(r.unidad).toBe('m²');
    expect(r.valor).toBe(100);
    expect(r.label).toBe('US$ 100/m²');
  });
  it('derives price per ha for campos', () => {
    const r = precioPorUnidad(
      listing({
        tipo: 'campo',
        superficie_m2: 100_000, // 10 ha
        precio: { monto: 200000, moneda: 'USD' },
      }),
    );
    expect(r.unidad).toBe('ha');
    expect(r.valor).toBe(20000);
    expect(r.label).toBe('US$ 20.000/ha');
  });
  it('guards against divide-by-zero superficie', () => {
    const r = precioPorUnidad(listing({ superficie_m2: 0 }));
    expect(r.valor).toBe(0);
  });
});

describe('isDestacado', () => {
  const now = 1_000_000;
  it('is true only while featured_until is in the future', () => {
    expect(isDestacado(listing({ featured_until: now + 1 }), now)).toBe(true);
    expect(isDestacado(listing({ featured_until: now - 1 }), now)).toBe(false);
    expect(isDestacado(listing({ featured_until: undefined }), now)).toBe(
      false,
    );
  });
});

describe('formatFecha', () => {
  it('renders abbreviated es-PY month + year', () => {
    // Mid-month so the local-time month is stable regardless of CI timezone.
    expect(formatFecha(Date.UTC(2026, 5, 15))).toBe('jun 2026');
  });
});
