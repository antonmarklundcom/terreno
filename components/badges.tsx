import type { EstadoTitulo, Financiacion, Servicio, Tipo } from '@/lib/types';
import { tipoLabel, servicioLabel } from '@/lib/format';
import { CheckIcon, DashIcon } from './icons';

/** Type pill (white chip over the map). */
export function TipoPill({ tipo }: { tipo: Tipo }) {
  return (
    <span className="inline-flex items-center rounded-pill bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-ink-soft">
      {tipoLabel(tipo)}
    </span>
  );
}

/** Title-status badge over the map (green con título / amber en proceso). */
export function TituloBadge({ estado }: { estado: EstadoTitulo }) {
  if (estado === 'con_titulo') {
    return (
      <span className="inline-flex items-center gap-1 rounded-pill bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-brand">
        <CheckIcon size={12} />
        Con título
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-pill bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-amber">
      Título en proceso
    </span>
  );
}

export function DestacadoBadge() {
  return (
    <span className="inline-flex items-center rounded-pill bg-ink/85 px-2.5 py-1 text-[11px] font-semibold text-white">
      Destacado
    </span>
  );
}

export function FinanciacionTag({ financiacion }: { financiacion: Financiacion }) {
  return (
    <span className="rounded-tile border border-brand/20 bg-brand-tint px-2.5 py-1 text-[11.5px] font-semibold text-brand">
      {financiacion === 'cuotas' ? 'Cuotas' : 'Contado'}
    </span>
  );
}

/** Small servicio chip used on cards. */
export function ServicioChip({ servicio }: { servicio: Servicio }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-tile bg-fill-warm px-2 py-1 text-[11.5px] text-ink-soft">
      <span className="text-brand">
        <CheckIcon size={11} />
      </span>
      {servicioLabel(servicio)}
    </span>
  );
}

/** Servicio badge (detail page); muted with a dash when unavailable. */
export function ServicioBadge({
  servicio,
  available,
}: {
  servicio: Servicio;
  available: boolean;
}) {
  if (available) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-[10px] border border-line bg-surface px-3 py-2 text-[13px] text-ink">
        <span className="text-brand">
          <CheckIcon size={13} />
        </span>
        {servicioLabel(servicio)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-[10px] border border-line-soft bg-canvas px-3 py-2 text-[13px] text-ink-faint">
      <DashIcon size={13} />
      {servicioLabel(servicio)}
    </span>
  );
}
