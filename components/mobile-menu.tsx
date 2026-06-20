'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MenuIcon } from './icons';

export function MobileMenu({
  items,
}: {
  items: Array<{ href: string; label: string }>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="Abrir menú"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-11 items-center justify-center text-ink"
      >
        <MenuIcon size={22} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-ink/30"
          onClick={() => setOpen(false)}
        >
          <nav
            className="absolute right-0 top-0 flex h-full w-72 max-w-[80%] flex-col gap-1 bg-surface p-5 shadow-float"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                aria-label="Cerrar menú"
                onClick={() => setOpen(false)}
                className="text-2xl leading-none text-ink-muted"
              >
                ×
              </button>
            </div>
            {items.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-[10px] px-3 py-3 text-[15px] font-medium text-ink hover:bg-canvas"
              >
                {n.label}
              </Link>
            ))}
            <Link
              href="/vender"
              onClick={() => setOpen(false)}
              className="btn-dark mt-2"
            >
              Vendé tu terreno
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
