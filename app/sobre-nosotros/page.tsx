import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sobre nosotros',
  description:
    'Somos un portal de tierras pensado para Paraguay: minimalista, claro y centrado en el dato. Conocé la idea detrás de terreno.com.py.',
  alternates: { canonical: '/sobre-nosotros' },
};

export default function SobreNosotrosPage() {
  return (
    <div className="container-page max-w-prose py-8 sm:py-12">
      <h1 className="text-[27px] font-bold tracking-h1 sm:text-[32px]">Sobre nosotros</h1>
      <div className="mt-4 space-y-4 text-[15.5px] leading-[1.62] text-ink-prose">
        <p>
          terreno.com.py nació de una idea simple: en Paraguay la tierra se
          compra y se vende en dólares, pero la información casi nunca está a la
          altura. Fotos borrosas, ubicaciones imprecisas y títulos sin verificar
          hacen que una de las decisiones más importantes se tome a ciegas.
        </p>
        <p>
          Construimos un portal dedicado exclusivamente a la tierra —lotes,
          campos, quintas y loteamientos— donde el mapa, la superficie y el
          precio por metro cuadrado están siempre al frente. Calmo, ordenado y
          honesto, lejos del ruido de los clasificados.
        </p>
        <p>
          Además de listar terrenos, ayudamos a vender: valuamos, publicamos y
          acompañamos cada operación junto a profesionales locales de confianza.
        </p>
      </div>

      <div className="mt-8 grid gap-2.5 sm:grid-cols-2">
        <Link href="/buscar" className="btn-primary">
          Explorar terrenos
        </Link>
        <Link href="/vender" className="btn-dark">
          Vendé tu terreno
        </Link>
      </div>
    </div>
  );
}
