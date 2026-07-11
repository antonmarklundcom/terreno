import type { SVGProps } from 'react';

/**
 * Inline single-stroke icons matching the prototype's Feather/Lucide style.
 * Stroke inherits `currentColor`; size via width/height props.
 */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base(size = 20, props: IconProps): SVGProps<SVGSVGElement> {
  const { size: _s, ...rest } = props;
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    ...rest,
  };
}

export function SearchIcon({ size, ...p }: IconProps) {
  return (
    <svg {...base(size ?? 20, p)}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function MenuIcon({ size, ...p }: IconProps) {
  return (
    <svg {...base(size ?? 22, p)}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export function ChevronDown({ size, ...p }: IconProps) {
  return (
    <svg {...base(size ?? 14, p)} strokeWidth={2.2}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function ChevronRight({ size, ...p }: IconProps) {
  return (
    <svg {...base(size ?? 16, p)} strokeWidth={2.2}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function ChevronLeft({ size, ...p }: IconProps) {
  return (
    <svg {...base(size ?? 22, p)}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export function CheckIcon({ size, ...p }: IconProps) {
  return (
    <svg {...base(size ?? 13, p)} strokeWidth={3}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function DashIcon({ size, ...p }: IconProps) {
  return (
    <svg {...base(size ?? 13, p)} strokeWidth={2.4}>
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function PinIcon({ size, ...p }: IconProps) {
  return (
    <svg {...base(size ?? 14, p)}>
      <path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function ShareIcon({ size, ...p }: IconProps) {
  return (
    <svg {...base(size ?? 20, p)}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" />
      <line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
    </svg>
  );
}

export function HeartIcon({ size, ...p }: IconProps) {
  return (
    <svg {...base(size ?? 20, p)}>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

export function PhoneIcon({ size, ...p }: IconProps) {
  return (
    <svg {...base(size ?? 20, p)}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export function ShieldCheck({ size, ...p }: IconProps) {
  return (
    <svg {...base(size ?? 17, p)} strokeWidth={2.2}>
      <path d="M9 12l2 2 4-4" />
      <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" />
    </svg>
  );
}

export function LayersIcon({ size, ...p }: IconProps) {
  return (
    <svg {...base(size ?? 17, p)} strokeWidth={2.2}>
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  );
}

export function UsersIcon({ size, ...p }: IconProps) {
  return (
    <svg {...base(size ?? 17, p)} strokeWidth={2.2}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    </svg>
  );
}

export function SlidersIcon({ size, ...p }: IconProps) {
  return (
    <svg {...base(size ?? 13, p)} strokeWidth={2.2}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="7" y1="12" x2="17" y2="12" />
      <line x1="10" y1="18" x2="14" y2="18" />
    </svg>
  );
}

export function CardIcon({ size, ...p }: IconProps) {
  return (
    <svg {...base(size ?? 16, p)} strokeWidth={2.2}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}

export function ArrowRight({ size, ...p }: IconProps) {
  return (
    <svg {...base(size ?? 16, p)} strokeWidth={2.2}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export function CameraIcon({ size, ...p }: IconProps) {
  return (
    <svg {...base(size ?? 20, p)} strokeWidth={1.8}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** WhatsApp brand glyph (filled). */
export function WhatsAppGlyph({
  size = 20,
  ...p
}: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="currentColor"
      {...p}
    >
      <path d="M16 .5C7.5.5.6 7.4.6 15.9c0 2.8.7 5.4 2 7.8L.5 31.5l8-2.1c2.3 1.2 4.8 1.9 7.5 1.9 8.5 0 15.4-6.9 15.4-15.4S24.5.5 16 .5zm0 28.1c-2.4 0-4.7-.6-6.7-1.8l-.5-.3-4.8 1.3 1.3-4.6-.3-.5c-1.3-2.1-2-4.5-2-7 0-7.1 5.8-12.9 12.9-12.9S28.9 8.9 28.9 16 23.1 28.6 16 28.6zm7.1-9.4c-.4-.2-2.3-1.1-2.6-1.3-.4-.1-.6-.2-.9.2-.3.4-1 1.3-1.2 1.5-.2.2-.4.3-.8.1-.4-.2-1.6-.6-3.1-1.9-1.1-1-1.9-2.3-2.2-2.7-.2-.4 0-.6.2-.8.2-.2.4-.4.5-.7.2-.2.2-.4.4-.6.1-.3 0-.5 0-.7s-.9-2.1-1.2-2.9c-.3-.7-.6-.6-.8-.6h-.7c-.2 0-.6.1-1 .5-.3.4-1.3 1.3-1.3 3.1s1.3 3.6 1.5 3.9c.2.2 2.6 4 6.3 5.6.9.4 1.6.6 2.1.8.9.3 1.7.2 2.3.1.7-.1 2.3-.9 2.6-1.8.3-.9.3-1.6.2-1.8-.1-.1-.3-.2-.7-.4z" />
    </svg>
  );
}
