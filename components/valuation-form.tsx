'use client';

import { useMemo, useState } from 'react';
import type { Facets } from '@/lib/types';
import { valuationWaLink } from '@/lib/whatsapp';
import { WaButton } from './wa-button';
import { ChevronDown } from './icons';

/**
 * Valuation lead form (the commission funnel). Submits to /api/leads with
 * tipo_lead: 'valuation'. WhatsApp shortcut always reaches our pipeline.
 */
export function ValuationForm({ facets }: { facets: Facets }) {
  const [departamento, setDepartamento] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [superficie, setSuperficie] = useState('');
  const [unidad, setUnidad] = useState<'m2' | 'ha'>('m2');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const ciudades = useMemo(
    () => facets.departamentos.find((d) => d.nombre === departamento)?.ciudades ?? [],
    [facets, departamento],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    const superficie_m2 = superficie
      ? Number(superficie) * (unidad === 'ha' ? 10_000 : 1)
      : undefined;
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          tipo_lead: 'valuation',
          ubicacion: { departamento, ciudad },
          superficie_m2,
          contacto: { nombre, telefono },
          source: '/vender',
        }),
      });
      setStatus(res.ok ? 'sent' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="card-raised p-6 text-center">
        <div className="text-[18px] font-bold">¡Recibido! 🌱</div>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">
          Te vamos a contactar en menos de 48&nbsp;h con la tasación de tu
          terreno. Si querés, escribinos ahora por WhatsApp.
        </p>
        <WaButton
          href={valuationWaLink()}
          className="btn-whatsapp mt-4 w-full"
          lead={{ tipo_lead: 'valuation', source: '/vender' }}
        >
          Escribinos por WhatsApp
        </WaButton>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card-raised p-[18px]">
      <div className="text-[16px] font-bold">Pedí tu tasación gratis</div>
      <div className="mb-4 mt-1 text-[12.5px] text-ink-muted">
        Respuesta en menos de 48&nbsp;h.
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex gap-2.5">
          <SelectField
            label="Departamento"
            value={departamento}
            options={facets.departamentos.map((d) => d.nombre)}
            onChange={(v) => {
              setDepartamento(v);
              setCiudad('');
            }}
          />
          <SelectField
            label="Ciudad"
            value={ciudad}
            disabled={!departamento}
            options={ciudades.map((c) => c.nombre)}
            onChange={setCiudad}
          />
        </div>

        <div className="flex gap-2.5">
          <input
            type="number"
            inputMode="numeric"
            required
            value={superficie}
            onChange={(e) => setSuperficie(e.target.value)}
            placeholder="Superficie"
            className="field tnum flex-1"
          />
          <div className="flex flex-none items-center gap-1 self-stretch rounded-[10px] bg-fill-track p-[3px]">
            {(['m2', 'ha'] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnidad(u)}
                className={`rounded-[7px] px-3 text-[12.5px] font-semibold ${
                  unidad === u ? 'bg-white text-ink' : 'text-ink-muted'
                }`}
              >
                {u === 'm2' ? 'm²' : 'ha'}
              </button>
            ))}
          </div>
        </div>

        <input
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Tu nombre"
          className="field"
        />
        <input
          required
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="WhatsApp / teléfono"
          className="field"
        />
      </div>

      <button type="submit" disabled={status === 'sending'} className="btn-primary mt-3.5 w-full">
        {status === 'sending' ? 'Enviando…' : 'Quiero mi tasación gratis'}
      </button>

      {status === 'error' && (
        <p className="mt-2 text-center text-[12.5px] text-amber-ink">
          No pudimos enviar. Probá por WhatsApp.
        </p>
      )}

      <div className="my-3 flex items-center gap-2.5">
        <div className="h-px flex-1 bg-line-soft" />
        <span className="text-[11.5px] text-ink-faintest">o</span>
        <div className="h-px flex-1 bg-line-soft" />
      </div>

      <WaButton
        href={valuationWaLink()}
        className="btn-whatsapp w-full"
        lead={{ tipo_lead: 'valuation', source: '/vender' }}
      >
        Escribinos por WhatsApp
      </WaButton>
    </form>
  );
}

function SelectField({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-1 items-center justify-between gap-1.5 rounded-[10px] border border-line-warm bg-fill px-3 py-3 text-[14px]">
      <select
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-transparent outline-none disabled:text-ink-faint"
      >
        <option value="">{label}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <span className="pointer-events-none text-ink-faint">
        <ChevronDown size={13} />
      </span>
    </label>
  );
}
