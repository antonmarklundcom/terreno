import type { Metadata } from 'next';
import { getFacets } from '@/lib/listings-repo';
import { ValuationForm } from '@/components/valuation-form';
import { ParcelMotif } from '@/components/seller-cta-card';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Vendé tu terreno — Tasación gratis',
  description:
    'Lo valuamos, lo publicamos y lo vendemos por vos. Tasación gratis en 48 h con datos reales de tu zona. Pagás comisión sólo cuando se vende.',
  alternates: { canonical: '/vender' },
};

const STATS = [
  { n: '0%', l: 'hasta que se venda' },
  { n: '48 h', l: 'tasación inicial' },
  { n: '17', l: 'departamentos' },
];

const STEPS = [
  {
    t: 'Valuamos tu terreno',
    d: 'Cruzamos superficie, ubicación y ventas recientes de la zona. Sin costo.',
  },
  {
    t: 'Lo publicamos bien',
    d: 'Mapa, medidas y título verificado. Aparece ante compradores reales.',
  },
  {
    t: 'Vendemos por vos',
    d: 'Filtramos consultas, coordinamos visitas y te acompañamos hasta la escritura.',
  },
];

export default async function VenderPage() {
  const facets = await getFacets();

  return (
    <div>
      {/* Hero — intro + trust on the left, form card on the right at lg+. */}
      <section id="top" className="relative overflow-hidden bg-brand-dark text-white">
        <ParcelMotif opacity={0.4} />
        <div className="container-page relative py-10 lg:py-16">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div>
              <div className="mb-3 flex items-center gap-2 text-[12.5px] font-bold tracking-wide text-[#9fd3b6]">
                <span className="h-[7px] w-[7px] rounded-full bg-[#9fd3b6]" />
                VENDÉ TU TERRENO
              </div>
              <h1 className="text-[27px] font-bold leading-[1.12] tracking-h1 sm:text-[34px] lg:text-[40px]">
                Lo valuamos, lo publicamos y lo vendemos por vos.
              </h1>
              <p className="mt-2.5 max-w-md text-[14.5px] leading-relaxed text-[#bcd6c5] sm:text-[15.5px]">
                Tasación gratis con datos reales de tu zona. Vos sólo pagás comisión
                cuando se vende.
              </p>
              {/* Trust stats — alongside the intro on the dark band. */}
              <div className="mt-7 grid grid-cols-3 gap-2.5 lg:max-w-md">
                {STATS.map((s) => (
                  <div
                    key={s.l}
                    className="rounded-card border border-white/15 bg-white/5 p-3.5 text-center"
                  >
                    <div className="tnum text-[19px] font-bold text-white">{s.n}</div>
                    <div className="mt-0.5 text-[11.5px] leading-tight text-[#bcd6c5]">
                      {s.l}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lead form card */}
            <div className="lg:justify-self-end lg:w-full lg:max-w-md">
              <ValuationForm facets={facets} />
            </div>
          </div>
        </div>
      </section>

      <div className="container-page max-w-3xl py-12 lg:py-16">
        {/* How it works */}
        <section>
          <h2 className="mb-4 text-[18px] font-bold tracking-h2 lg:text-[22px]">Cómo funciona</h2>
          <ol className="flex flex-col">
            {STEPS.map((step, i) => (
              <li key={step.t} className="flex gap-3.5">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand text-[14px] font-bold text-white">
                    {i + 1}
                  </div>
                  {i < STEPS.length - 1 && <div className="w-0.5 flex-1 bg-trust-border" />}
                </div>
                <div className="pb-5">
                  <div className="text-[15px] font-bold">{step.t}</div>
                  <div className="mt-0.5 text-[13px] leading-relaxed text-ink-muted">
                    {step.d}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Testimonial */}
        <section className="mt-4 rounded-card border border-trust-border bg-trust-bg p-5">
          <p className="text-[15px] font-medium leading-relaxed">
            “Tenía un campo en Concepción parado hace dos años. Lo tasaron, lo
            publicaron con el mapa y se vendió en cuatro meses.”
          </p>
          <div className="mt-3 flex items-center gap-2.5">
            <div className="h-[34px] w-[34px] rounded-full bg-map-field2" />
            <div>
              <div className="text-[13px] font-bold">Rodrigo A.</div>
              <div className="text-[12px] text-ink-muted">Vendió 45 ha · Concepción</div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mt-12 rounded-card bg-brand-dark p-6 text-center text-white lg:p-8">
          <div className="text-[18px] font-bold tracking-h2">¿Listo para vender?</div>
          <p className="mt-1.5 text-[13px] text-[#bcd6c5]">
            Empezá con una tasación gratis hoy.
          </p>
          <a href="#top" className="btn-light mt-3.5 inline-flex">
            Calcular el valor de mi terreno
          </a>
        </section>
      </div>
    </div>
  );
}
