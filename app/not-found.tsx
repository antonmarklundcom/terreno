import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-page max-w-prose py-20 text-center">
      <div className="text-[13px] font-bold uppercase tracking-eyebrow text-brand">
        Error 404
      </div>
      <h1 className="mt-2 text-[27px] font-bold tracking-h1">
        No encontramos esta página
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
        El terreno o la página que buscás no está disponible. Probá buscar de
        nuevo o volvé al inicio.
      </p>
      <div className="mt-6 flex justify-center gap-2.5">
        <Link href="/buscar" className="btn-primary">
          Buscar terrenos
        </Link>
        <Link href="/" className="btn-secondary">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
