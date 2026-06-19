import Link from 'next/link';
import { Wordmark } from './wordmark';
import { SITE } from '@/lib/config';

const COLS: Array<{ title: string; links: Array<{ href: string; label: string }> }> = [
  {
    title: 'Comprar',
    links: [
      { href: '/buscar', label: 'Buscar terrenos' },
      { href: '/lotes/central', label: 'Lotes en Central' },
      { href: '/campos/concepcion', label: 'Campos en Concepción' },
    ],
  },
  {
    title: 'Vender',
    links: [
      { href: '/vender', label: 'Vendé tu terreno' },
      { href: '/como-funciona', label: 'Cómo funciona' },
    ],
  },
  {
    title: 'Recursos',
    links: [
      { href: '/guias', label: 'Guías para invertir' },
      { href: '/servicios', label: 'Servicios' },
      { href: '/sobre-nosotros', label: 'Sobre nosotros' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/legal/privacidad', label: 'Privacidad' },
      { href: '/legal/terminos', label: 'Términos' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-dark text-ink-faint">
      <div className="container-page py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Wordmark className="text-lg text-white" tld="text-ink-muted" />
            <p className="mt-3 max-w-[280px] text-[12.5px] leading-relaxed text-ink-faint">
              El portal de tierras de Paraguay. Lotes, campos, quintas y
              loteamientos con datos verificados.
            </p>
          </div>
          {COLS.map((col) => (
            <div key={col.title}>
              <div className="mb-3 text-[12.5px] font-bold uppercase tracking-wide text-ink-muted">
                {col.title}
              </div>
              <ul className="space-y-2.5 text-[13px]">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-white/10 pt-6 text-[12px] text-ink-muted">
          © {new Date().getFullYear()} {SITE.name}. Hecho en Paraguay.
        </div>
      </div>
    </footer>
  );
}
