'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Facets, Tipo } from '@/lib/types';
import { tipoLabel } from '@/lib/format';
import { ChevronDown, SearchIcon } from './icons';

const TIPOS: Tipo[] = [
  'lote_urbano',
  'terreno_comercial',
  'campo',
  'quinta',
  'loteamiento',
];

function Select({
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
    <label className="select-shell">
      <span className="min-w-0 flex-1">
        <span className="eyebrow block">{label}</span>
        <select
          aria-label={label}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="mt-0.5 w-full appearance-none bg-transparent text-[15px] font-medium text-ink outline-none disabled:text-ink-faint"
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </span>
      <span className="pointer-events-none text-ink-faint">
        <ChevronDown size={14} />
      </span>
    </label>
  );
}

export function BuyerSearch({ facets }: { facets: Facets }) {
  const router = useRouter();
  const [departamento, setDepartamento] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [barrio, setBarrio] = useState('');
  const [tipo, setTipo] = useState<Tipo | ''>('lote_urbano');

  const ciudades = useMemo(
    () =>
      facets.departamentos.find((d) => d.nombre === departamento)?.ciudades ??
      [],
    [facets, departamento],
  );
  const barrios = useMemo(
    () => ciudades.find((c) => c.nombre === ciudad)?.barrios ?? [],
    [ciudades, ciudad],
  );

  function submit() {
    const params = new URLSearchParams();
    if (departamento) params.set('departamento', departamento);
    if (ciudad) params.set('ciudad', ciudad);
    if (barrio) params.set('barrio', barrio);
    if (tipo) params.set('tipo', tipo);
    router.push(`/buscar?${params.toString()}`);
  }

  return (
    <div className="card-raised p-4">
      <div className="mb-3 flex items-center gap-2 text-[13px] font-bold text-ink">
        <span className="h-[7px] w-[7px] rounded-full bg-brand" />
        Comprar terreno
      </div>

      <div className="flex flex-col gap-2">
        <Select
          label="Departamento"
          value={departamento}
          placeholder="Todos los departamentos"
          options={facets.departamentos.map((d) => ({
            value: d.nombre,
            label: `${d.nombre} (${d.count})`,
          }))}
          onChange={(v) => {
            setDepartamento(v);
            setCiudad('');
            setBarrio('');
          }}
        />
        <Select
          label="Ciudad / Distrito"
          value={ciudad}
          placeholder="Todas las ciudades"
          disabled={!departamento}
          options={ciudades.map((c) => ({
            value: c.nombre,
            label: `${c.nombre} (${c.count})`,
          }))}
          onChange={(v) => {
            setCiudad(v);
            setBarrio('');
          }}
        />
        {barrios.length > 0 && (
          <Select
            label="Barrio / Zona · opcional"
            value={barrio}
            placeholder="Todos los barrios"
            disabled={!ciudad}
            options={barrios.map((b) => ({
              value: b.nombre,
              label: `${b.nombre} (${b.count})`,
            }))}
            onChange={setBarrio}
          />
        )}
      </div>

      <div className="eyebrow mt-4 mb-2">Tipo de terreno</div>
      <div className="flex flex-wrap gap-1.5">
        {TIPOS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTipo((cur) => (cur === t ? '' : t))}
            className={`chip ${tipo === t ? 'chip-active' : ''}`}
          >
            {tipoLabel(t)}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={submit}
        className="btn-primary mt-4 w-full"
      >
        <SearchIcon size={18} />
        Buscar terrenos
      </button>
    </div>
  );
}
