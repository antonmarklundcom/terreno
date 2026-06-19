'use client';

import { useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Facets, Servicio, Tipo } from '@/lib/types';
import { servicioLabel, tipoLabel } from '@/lib/format';
import { ChevronDown } from './icons';

const TIPOS: Tipo[] = [
  'lote_urbano',
  'terreno_comercial',
  'campo',
  'quinta',
  'loteamiento',
];
const SERVICIOS: Servicio[] = [
  'agua',
  'energia',
  'desague',
  'asfalto',
  'internet',
];

function UnitToggle({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1 rounded-tile bg-fill-track p-[3px]">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-[6px] px-2.5 py-1 text-[11.5px] font-semibold transition-colors ${
            value === o.value ? 'bg-white text-ink' : 'text-ink-muted'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Section({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-line-soft pt-5 first:border-t-0 first:pt-0">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="text-[13px] font-bold">{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}

export function SearchFilters({
  facets,
  onApplied,
}: {
  facets: Facets;
  onApplied?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [supUnit, setSupUnit] = useState<'m2' | 'ha'>(
    sp.get('tipo') === 'campo' ? 'ha' : 'm2',
  );

  const current = useMemo(
    () => ({
      departamento: sp.get('departamento') ?? '',
      ciudad: sp.get('ciudad') ?? '',
      barrio: sp.get('barrio') ?? '',
      tipo: (sp.get('tipo') ?? '') as Tipo | '',
      sup_min: sp.get('sup_min') ?? '',
      sup_max: sp.get('sup_max') ?? '',
      precio_min: sp.get('precio_min') ?? '',
      precio_max: sp.get('precio_max') ?? '',
      servicios: (sp.get('servicios') ?? '').split(',').filter(Boolean),
      financiacion: sp.get('financiacion') ?? '',
      estado_titulo: sp.get('estado_titulo') ?? '',
    }),
    [sp],
  );

  const update = useCallback(
    (patch: Record<string, string | undefined>) => {
      const params = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v == null || v === '') params.delete(k);
        else params.set(k, v);
      }
      params.delete('page');
      router.push(`${pathname}?${params.toString()}`);
      onApplied?.();
    },
    [sp, pathname, router, onApplied],
  );

  const ciudades =
    facets.departamentos.find((d) => d.nombre === current.departamento)?.ciudades ??
    [];
  const barrios = ciudades.find((c) => c.nombre === current.ciudad)?.barrios ?? [];

  const toM2 = (raw: string) => {
    if (!raw) return undefined;
    const n = Number(raw);
    if (!Number.isFinite(n)) return undefined;
    return String(supUnit === 'ha' ? n * 10_000 : n);
  };
  const fromM2 = (raw: string) => {
    if (!raw) return '';
    const n = Number(raw);
    return supUnit === 'ha' ? String(n / 10_000) : raw;
  };

  function toggleServicio(s: Servicio) {
    const set = new Set(current.servicios);
    if (set.has(s)) set.delete(s);
    else set.add(s);
    update({ servicios: [...set].join(',') });
  }

  function clearAll() {
    router.push(pathname);
    onApplied?.();
  }

  return (
    <div className="flex flex-col gap-5">
      <Section
        title="Ubicación"
        right={
          <button
            type="button"
            onClick={clearAll}
            className="text-[13px] font-semibold text-brand"
          >
            Limpiar
          </button>
        }
      >
        <div className="flex flex-col gap-2">
          <LocSelect
            label="Departamento"
            value={current.departamento}
            placeholder="Todos"
            options={facets.departamentos.map((d) => ({
              value: d.nombre,
              label: `${d.nombre} (${d.count})`,
            }))}
            onChange={(v) =>
              update({ departamento: v, ciudad: undefined, barrio: undefined })
            }
          />
          <LocSelect
            label="Ciudad / Distrito"
            value={current.ciudad}
            placeholder="Todas"
            disabled={!current.departamento}
            options={ciudades.map((c) => ({
              value: c.nombre,
              label: `${c.nombre} (${c.count})`,
            }))}
            onChange={(v) => update({ ciudad: v, barrio: undefined })}
          />
          {barrios.length > 0 && (
            <LocSelect
              label="Barrio · opcional"
              value={current.barrio}
              placeholder="Todos"
              disabled={!current.ciudad}
              options={barrios.map((b) => ({
                value: b.nombre,
                label: `${b.nombre} (${b.count})`,
              }))}
              onChange={(v) => update({ barrio: v })}
            />
          )}
        </div>
      </Section>

      <Section title="Tipo">
        <div className="flex flex-wrap gap-1.5">
          {TIPOS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() =>
                update({ tipo: current.tipo === t ? undefined : t })
              }
              className={`chip ${current.tipo === t ? 'chip-active' : ''}`}
            >
              {tipoLabel(t)}
            </button>
          ))}
        </div>
      </Section>

      <Section
        title="Superficie"
        right={
          <div className="w-[120px]">
            <UnitToggle
              value={supUnit}
              options={[
                { value: 'm2', label: 'm²' },
                { value: 'ha', label: 'ha' },
              ]}
              onChange={(v) => setSupUnit(v as 'm2' | 'ha')}
            />
          </div>
        }
      >
        <RangeRow
          minLabel="mín."
          maxLabel="máx."
          minDefault={fromM2(current.sup_min)}
          maxDefault={fromM2(current.sup_max)}
          onMin={(v) => update({ sup_min: toM2(v) })}
          onMax={(v) => update({ sup_max: toM2(v) })}
        />
      </Section>

      <Section
        title="Precio"
        right={<span className="text-[11px] font-semibold text-ink-faint">US$</span>}
      >
        <RangeRow
          minLabel="US$ mín."
          maxLabel="US$ máx."
          minDefault={current.precio_min}
          maxDefault={current.precio_max}
          onMin={(v) => update({ precio_min: v || undefined })}
          onMax={(v) => update({ precio_max: v || undefined })}
        />
      </Section>

      <Section title="Servicios">
        <div className="flex flex-col gap-2.5">
          {SERVICIOS.map((s) => {
            const checked = current.servicios.includes(s);
            return (
              <label
                key={s}
                className="flex cursor-pointer items-center gap-2.5 text-[13.5px]"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleServicio(s)}
                  className="h-[18px] w-[18px] rounded-[5px] accent-brand"
                />
                {servicioLabel(s, true)}
              </label>
            );
          })}
        </div>
      </Section>

      <Section title="Financiación">
        <Toggle2
          value={current.financiacion}
          options={[
            { value: 'contado', label: 'Contado' },
            { value: 'cuotas', label: 'Cuotas' },
          ]}
          onChange={(v) => update({ financiacion: v })}
        />
      </Section>

      <Section title="Estado de título">
        <Toggle2
          value={current.estado_titulo}
          options={[
            { value: 'con_titulo', label: 'Con título' },
            { value: 'en_proceso', label: 'En proceso' },
          ]}
          onChange={(v) => update({ estado_titulo: v })}
        />
      </Section>
    </div>
  );
}

function LocSelect({
  label,
  value,
  placeholder,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-2 rounded-[9px] border border-line-warm bg-fill px-3 py-2.5 text-[14px] font-medium">
      <select
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-transparent outline-none disabled:text-ink-faint"
      >
        <option value="">{`${label}: ${placeholder}`}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none text-ink-faint">
        <ChevronDown size={13} />
      </span>
    </label>
  );
}

function RangeRow({
  minLabel,
  maxLabel,
  minDefault,
  maxDefault,
  onMin,
  onMax,
}: {
  minLabel: string;
  maxLabel: string;
  minDefault: string;
  maxDefault: string;
  onMin: (v: string) => void;
  onMax: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        inputMode="numeric"
        defaultValue={minDefault}
        placeholder={minLabel}
        onBlur={(e) => onMin(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onMin((e.target as HTMLInputElement).value)}
        className="tnum w-full rounded-[8px] border border-line-warm bg-fill px-2.5 py-2 text-[13px] outline-none focus:border-brand"
      />
      <span className="text-ink-faintest">—</span>
      <input
        type="number"
        inputMode="numeric"
        defaultValue={maxDefault}
        placeholder={maxLabel}
        onBlur={(e) => onMax(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onMax((e.target as HTMLInputElement).value)}
        className="tnum w-full rounded-[8px] border border-line-warm bg-fill px-2.5 py-2 text-[13px] outline-none focus:border-brand"
      />
    </div>
  );
}

function Toggle2({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <div className="flex gap-2">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(active ? undefined : o.value)}
            className={`flex-1 rounded-[9px] border px-3 py-2 text-center text-[13px] font-semibold transition-colors ${
              active
                ? 'border-brand bg-brand-tint text-brand'
                : 'border-line-cool text-ink-soft'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
