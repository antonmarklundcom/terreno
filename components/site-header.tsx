import Link from 'next/link';
import { Wordmark } from './wordmark';
import { MobileMenu } from './mobile-menu';
import { SearchIcon } from './icons';

const NAV = [
  { href: '/buscar', label: 'Comprar' },
  { href: '/vender', label: 'Vender' },
  { href: '/servicios', label: 'Servicios' },
  { href: '/guias', label: 'Guías' },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line-soft bg-surface/95 backdrop-blur">
      <div className="container-page flex h-[60px] items-center justify-between gap-4">
        <Wordmark className="text-[19px]" />

        <nav className="hidden items-center gap-7 text-sm font-medium text-ink-soft md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-brand">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/vender"
            className="hidden rounded-[10px] bg-brand-dark px-4 py-2.5 text-[13.5px] font-semibold text-white hover:brightness-110 md:inline-flex"
          >
            Vendé tu terreno
          </Link>
          <Link
            href="/buscar"
            aria-label="Buscar terrenos"
            className="text-ink md:hidden"
          >
            <SearchIcon size={20} />
          </Link>
          <MobileMenu items={NAV} />
        </div>
      </div>
    </header>
  );
}
