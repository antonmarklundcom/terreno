import type { Listing, Moneda, Tipo } from './types';

/**
 * Display / unit logic. Superficie is ALWAYS stored in m²; campos (and large
 * parcels) are shown in hectáreas. Precio/m² is DERIVED, never stored.
 */

/** Fixed display rate for the secondary Gs. line (US$ → PYG). Display-only. */
export const USD_TO_PYG = 7300;

const TIPO_LABEL: Record<Tipo, string> = {
  lote_urbano: 'Lote urbano',
  terreno_comercial: 'Terreno comercial',
  campo: 'Campo',
  quinta: 'Quinta',
  loteamiento: 'Loteamiento',
};

export function tipoLabel(tipo: Tipo): string {
  return TIPO_LABEL[tipo];
}

const SERVICIO_LABEL: Record<string, string> = {
  agua: 'Agua',
  energia: 'Energía',
  desague: 'Desagüe',
  asfalto: 'Asfalto',
  empedrado: 'Empedrado',
  internet: 'Internet',
};

/** Longer labels used in the filter rail / sheet. */
const SERVICIO_LABEL_LARGO: Record<string, string> = {
  agua: 'Agua / ESSAP',
  energia: 'Energía / ANDE',
  desague: 'Desagüe',
  asfalto: 'Asfalto / empedrado',
  empedrado: 'Empedrado',
  internet: 'Internet',
};

export function servicioLabel(servicio: string, largo = false): string {
  const map = largo ? SERVICIO_LABEL_LARGO : SERVICIO_LABEL;
  return map[servicio] ?? servicio;
}

export const ESTADO_TITULO_LABEL = {
  con_titulo: 'Con título',
  en_proceso: 'Título en proceso',
} as const;

export const FINANCIACION_LABEL = {
  contado: 'Contado',
  cuotas: 'Cuotas',
} as const;

/** es-PY uses "." as the thousands separator, matching the prototype. */
function groupNumber(value: number, maxFractionDigits = 0): string {
  return new Intl.NumberFormat('es-PY', {
    maximumFractionDigits: maxFractionDigits,
  }).format(value);
}

export function formatUsd(monto: number): string {
  return `US$ ${groupNumber(Math.round(monto))}`;
}

export function formatGs(montoUsd: number): string {
  const pyg = Math.round(montoUsd * USD_TO_PYG);
  return `Gs. ${groupNumber(pyg)}`;
}

/** Compact price for map pins, e.g. "US$ 28,5k" / "US$ 190k". */
export function formatUsdCompact(monto: number): string {
  if (monto >= 1000) {
    const k = monto / 1000;
    const rounded = k >= 100 ? Math.round(k) : Math.round(k * 10) / 10;
    return `US$ ${groupNumber(rounded, 1)}k`;
  }
  return formatUsd(monto);
}

export function formatPrecio(monto: number, moneda: Moneda): string {
  return moneda === 'USD'
    ? formatUsd(monto)
    : `Gs. ${groupNumber(Math.round(monto))}`;
}

/** Campos and parcels ≥ 1 ha are shown in hectáreas. */
export function usesHectares(tipo: Tipo, superficie_m2: number): boolean {
  return tipo === 'campo' || superficie_m2 >= 10_000;
}

export function formatSuperficie(tipo: Tipo, superficie_m2: number): string {
  if (usesHectares(tipo, superficie_m2)) {
    const ha = superficie_m2 / 10_000;
    return `${groupNumber(ha, 2).replace(/[.,]00$/, '')} ha`;
  }
  return `${groupNumber(superficie_m2)} m²`;
}

/** Derived precio/m² (or precio/ha for campos), in the listing's moneda. */
export function precioPorUnidad(listing: Listing): {
  valor: number;
  unidad: 'm²' | 'ha';
  label: string;
} {
  const ha = usesHectares(listing.tipo, listing.superficie_m2);
  const divisor = ha ? listing.superficie_m2 / 10_000 : listing.superficie_m2;
  const valor = divisor > 0 ? listing.precio.monto / divisor : 0;
  const moneda = listing.precio.moneda;
  const prefix = moneda === 'USD' ? 'US$ ' : 'Gs. ';
  const unidad = ha ? 'ha' : 'm²';
  return {
    valor,
    unidad,
    label: `${prefix}${groupNumber(Math.round(valor))}/${unidad}`,
  };
}

/** A listing is "Destacado" only while featured_until is in the future. */
export function isDestacado(listing: Listing, now = Date.now()): boolean {
  return (
    typeof listing.featured_until === 'number' && listing.featured_until > now
  );
}

const MESES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

export function formatFecha(ts: number): string {
  const d = new Date(ts);
  return `${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatFechaLarga(ts: number): string {
  const d = new Date(ts);
  return `${d.getDate()} de ${MESES[d.getMonth()]}. ${d.getFullYear()}`;
}
