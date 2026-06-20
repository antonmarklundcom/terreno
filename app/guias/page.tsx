import type { Metadata } from 'next';
import Link from 'next/link';
import { SEED_GUIDES } from '@/lib/seed/guides';
import { ChevronRight } from '@/components/icons';

export const metadata: Metadata = {
  title: 'Guías para invertir en tierra',
  description:
    'Guías prácticas para comprar, vender e invertir en terrenos en Paraguay: cómo verificar títulos, comparar precio por m², entender loteamientos y campos.',
  alternates: { canonical: '/guias' },
};

export default function GuiasPage() {
  const [lead, ...rest] = SEED_GUIDES;
  return (
    <div className="container-page max-w-4xl py-8 sm:py-12">
      <h1 className="text-[27px] font-bold tracking-h1 sm:text-[32px] lg:text-[38px]">
        Guías para invertir
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-muted sm:text-[16px]">
        Todo lo que conviene saber antes de comprar o vender tierra en Paraguay.
      </p>

      <Link
        href={`/guias/${lead.slug}`}
        className="card mt-8 block overflow-hidden p-5 transition-shadow hover:shadow-raised sm:p-7"
      >
        <span className="rounded-pill bg-brand-tint px-2.5 py-1 text-[11px] font-bold uppercase tracking-eyebrow text-brand">
          Guía · {lead.categoria}
        </span>
        <div className="mt-3 text-[20px] font-bold leading-tight tracking-h2 sm:text-[24px]">
          {lead.titulo}
        </div>
        <p className="mt-2 max-w-prose text-[14px] leading-relaxed text-ink-muted sm:text-[15px]">
          {lead.resumen}
        </p>
        <div className="mt-3 text-[12.5px] text-ink-faint">
          Actualizado · {lead.fecha} · {lead.lectura_min} min de lectura
        </div>
      </Link>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {rest.map((g) => (
          <Link
            key={g.slug}
            href={`/guias/${g.slug}`}
            className="card flex items-center justify-between gap-3 p-4 transition-shadow hover:shadow-raised"
          >
            <div>
              <div className="text-[14.5px] font-semibold leading-snug">{g.titulo}</div>
              <div className="mt-0.5 text-[12.5px] text-ink-faint">
                {g.categoria} · {g.lectura_min} min
              </div>
            </div>
            <span className="flex-none text-ink-faintest">
              <ChevronRight size={16} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
