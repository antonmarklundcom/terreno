import { makeMapSvg, seedFrom } from '@/lib/map-svg';

/**
 * Static stylized map thumbnail (Server Component, no JS, no network).
 * Used as the visual hero on cards and content heroes.
 */
export function MapThumb({
  seed,
  withPin = false,
  className,
  w = 240,
  h = 160,
}: {
  seed: string;
  withPin?: boolean;
  className?: string;
  w?: number;
  h?: number;
}) {
  const svg = makeMapSvg(seedFrom(seed), w, h, withPin);
  return (
    <div
      className={className}
      aria-hidden
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
