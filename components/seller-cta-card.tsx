import Link from 'next/link';
import { ArrowRight } from './icons';

/** Dark forest seller CTA — visually equal in weight to the buyer search card. */
export function SellerCtaCard() {
  return (
    <div className="relative overflow-hidden rounded-card bg-brand-dark p-5 text-white">
      <ParcelMotif />
      <div className="relative">
        <div className="mb-2 flex items-center gap-2 text-[13px] font-bold text-[#9fd3b6]">
          <span className="h-[7px] w-[7px] rounded-full bg-[#9fd3b6]" />
          Vendé tu terreno
        </div>
        <div className="mb-1.5 text-[22px] font-bold leading-tight tracking-tight2">
          Conocé el valor real de tu terreno
        </div>
        <p className="mb-4 text-[13.5px] leading-relaxed text-[#bcd6c5]">
          Lo valuamos con datos de la zona, lo publicamos y lo vendemos por vos.
          Tasación sin costo.
        </p>
        <Link href="/vender" className="btn-light">
          Calcular valor gratis
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

/** Faint parcel-grid SVG motif used on dark forest surfaces. */
export function ParcelMotif({ opacity = 0.5 }: { opacity?: number }) {
  return (
    <div className="absolute inset-0" style={{ opacity }} aria-hidden>
      <svg
        viewBox="0 0 360 160"
        preserveAspectRatio="xMidYMid slice"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g stroke="#2f6a4d" strokeWidth="1" fill="none">
          <line x1="60" y1="0" x2="60" y2="160" />
          <line x1="140" y1="0" x2="140" y2="160" />
          <line x1="240" y1="0" x2="240" y2="160" />
          <line x1="320" y1="0" x2="320" y2="160" />
          <line x1="0" y1="48" x2="360" y2="48" />
          <line x1="0" y1="108" x2="360" y2="108" />
        </g>
        <polygon
          points="140,48 240,48 240,108 140,108"
          fill="#2f7a55"
          fillOpacity="0.55"
        />
      </svg>
    </div>
  );
}
