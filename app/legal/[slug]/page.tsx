import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SITE } from '@/lib/config';

interface LegalDoc {
  titulo: string;
  descripcion: string;
  intro: string;
  secciones: Array<{ h: string; p: string }>;
}

const DOCS: Record<string, LegalDoc> = {
  privacidad: {
    titulo: 'Política de privacidad',
    descripcion: 'Cómo tratamos tus datos en terreno.com.py.',
    intro:
      'Tu privacidad nos importa. Esta política explica qué datos recopilamos y cómo los usamos cuando navegás o nos contactás.',
    secciones: [
      {
        h: 'Qué datos recopilamos',
        p: 'Cuando completás un formulario o nos escribís por WhatsApp, guardamos los datos que nos compartís (nombre, teléfono, ubicación del terreno) con el único fin de responder tu consulta.',
      },
      {
        h: 'Cómo los usamos',
        p: 'Usamos tus datos para contactarte, valuar o publicar tu terreno y coordinar servicios. No vendemos tu información a terceros.',
      },
      {
        h: 'Tus derechos',
        p: 'Podés pedir el acceso, la corrección o la eliminación de tus datos en cualquier momento escribiéndonos.',
      },
    ],
  },
  terminos: {
    titulo: 'Términos y condiciones',
    descripcion: 'Las reglas de uso de terreno.com.py.',
    intro:
      'Al usar terreno.com.py aceptás estos términos. Te pedimos leerlos con atención.',
    secciones: [
      {
        h: 'Uso del portal',
        p: 'Las publicaciones son informativas y referenciales. Verificá siempre la superficie, los límites y el estado de título antes de cualquier operación.',
      },
      {
        h: 'Responsabilidad',
        p: 'No somos parte de las operaciones entre compradores y vendedores. Hacemos nuestro mejor esfuerzo por mostrar datos correctos, pero no garantizamos la exactitud de cada publicación.',
      },
      {
        h: 'Contacto',
        p: 'Ante cualquier duda sobre estos términos, escribinos y con gusto te ayudamos.',
      },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(DOCS).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = DOCS[slug];
  if (!doc) return { title: 'Documento legal' };
  return {
    title: doc.titulo,
    description: doc.descripcion,
    alternates: { canonical: `/legal/${slug}` },
    robots: { index: true, follow: true },
  };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = DOCS[slug];
  if (!doc) notFound();

  return (
    <div className="container-page max-w-prose py-8 sm:py-12">
      <h1 className="text-[27px] font-bold tracking-h1 sm:text-[32px]">{doc.titulo}</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">{doc.intro}</p>
      <div className="mt-6 space-y-6">
        {doc.secciones.map((s) => (
          <section key={s.h}>
            <h2 className="text-[17px] font-bold tracking-h2">{s.h}</h2>
            <p className="mt-1.5 text-[15px] leading-[1.62] text-ink-prose">{s.p}</p>
          </section>
        ))}
      </div>
      <p className="mt-8 text-[12.5px] text-ink-faint">
        {SITE.name} · Última actualización: junio 2026.
      </p>
    </div>
  );
}
