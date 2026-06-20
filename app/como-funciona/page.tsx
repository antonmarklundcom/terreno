import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, LayersIcon, UsersIcon } from '@/components/icons';

export const metadata: Metadata = {
  title: 'Cómo funciona',
  description:
    'Cómo funciona terreno.com.py: comprá tierra con datos verificados —mapa, superficie y título— o vendé tu terreno con nuestro acompañamiento.',
  alternates: { canonical: '/como-funciona' },
};

const PILARES = [
  {
    icon: LayersIcon,
    titulo: 'El mapa y los datos primero',
    texto:
      'La tierra no se vende con fotos lindas: se vende con ubicación, superficie y precio claros. Por eso cada publicación pone el mapa y los datos al frente.',
  },
  {
    icon: ShieldCheck,
    titulo: 'Título y medidas verificados',
    texto:
      'Revisamos el estado de título y mostramos superficie, frente y límites sobre un mapa real antes de publicar.',
  },
  {
    icon: UsersIcon,
    titulo: 'Acompañamiento local',
    texto:
      'Coordinamos tasadores, escribanos y agrimensores en cada departamento para que compres o vendas con seguridad.',
  },
];

export default function ComoFuncionaPage() {
  return (
    <div className="container-page max-w-prose py-8 sm:py-12">
      <h1 className="text-[27px] font-bold tracking-h1 sm:text-[32px]">Cómo funciona</h1>
      <p className="mt-3 text-[15.5px] leading-relaxed text-ink-prose">
        terreno.com.py es el portal de tierras de Paraguay. Reunimos lotes,
        campos, quintas y loteamientos con información clara, y acompañamos tanto
        a quien compra como a quien vende.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {PILARES.map(({ icon: Icon, titulo, texto }) => (
          <div key={titulo} className="flex items-start gap-3.5 rounded-card border border-line bg-surface p-5">
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-tile bg-trust-icon text-brand">
              <Icon size={18} />
            </div>
            <div>
              <div className="text-[16px] font-bold">{titulo}</div>
              <p className="mt-1 text-[14px] leading-relaxed text-ink-muted">{texto}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-2.5 sm:grid-cols-2">
        <Link href="/buscar" className="btn-primary">
          Buscar terrenos
        </Link>
        <Link href="/vender" className="btn-dark">
          Vendé tu terreno
        </Link>
      </div>
    </div>
  );
}
