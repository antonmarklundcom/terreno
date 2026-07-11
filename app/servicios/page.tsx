import type { Metadata } from 'next';
import { SERVICE_CATEGORIES, SEED_SERVICES } from '@/lib/seed/services';
import { serviceWaLink } from '@/lib/whatsapp';
import { WaButton } from '@/components/wa-button';
import { ShieldCheck } from '@/components/icons';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Servicios para terrenos: tasador, escribano, agrimensor',
  description:
    'Conectamos con tasadores, escribanos y agrimensores para comprar o vender tierra con seguridad: valuación, revisión de título y agrimensura de límites.',
  alternates: { canonical: '/servicios' },
};

export default function ServiciosPage() {
  return (
    <div className="container-page py-8 sm:py-12">
      <div className="max-w-2xl">
        <h1 className="text-[27px] font-bold tracking-h1 sm:text-[32px] lg:text-[38px]">
          Servicios
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-muted sm:text-[16px]">
          Antes de comprar o vender, coordinamos profesionales de confianza en
          tu zona. Pedí el servicio y te ponemos en contacto.
        </p>
      </div>

      <div className="mt-8 grid items-start gap-6 lg:mt-10 lg:grid-cols-3 lg:gap-5">
        {SERVICE_CATEGORIES.map((cat) => {
          const providers = SEED_SERVICES.filter(
            (s) => s.categoria === cat.categoria,
          );
          return (
            <section
              key={cat.categoria}
              className="flex flex-col rounded-card border border-line bg-surface p-5"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-tile bg-trust-icon text-brand">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h2 className="text-[17px] font-bold tracking-h2">
                    {cat.titulo}
                  </h2>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-ink-muted">
                    {cat.explicacion}
                  </p>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-ink-faint">
                    <span className="font-semibold text-ink-soft">
                      ¿Cuándo?
                    </span>{' '}
                    {cat.cuando}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2.5">
                {providers.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-[10px] border border-line-soft bg-canvas p-3.5"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="text-[14.5px] font-bold">{p.nombre}</div>
                      <div className="text-[12px] text-ink-faint">{p.zona}</div>
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
                      {p.descripcion}
                    </p>
                  </div>
                ))}
              </div>

              <WaButton
                href={serviceWaLink(cat.titulo)}
                className="btn-whatsapp mt-5 w-full"
                lead={{
                  tipo_lead: 'service',
                  servicio: cat.titulo,
                  source: '/servicios',
                }}
              >
                Pedir {cat.titulo.toLowerCase()}
              </WaButton>
            </section>
          );
        })}
      </div>
    </div>
  );
}
