/**
 * Deterministic stylized map SVG — ported from the prototype's makeMapSVG.
 * Used for card thumbnails and content heroes: it keeps the calm neutral map
 * aesthetic ("map is the hero") with zero network cost and full SSR support.
 * The listing detail + search pages use a real interactive MapLibre map.
 */

function rng(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Stable numeric seed from a string id. */
export function seedFrom(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) % 2147483647;
  }
  return h || 1;
}

export function makeMapSvg(
  seed: number,
  w = 240,
  h = 160,
  withPin = false,
): string {
  const r = rng(seed);
  const sand = '#ece6d9';
  const accent = '#1f6b4a';
  const fields = ['#dce5d1', '#d3ddc6', '#e3e9da'];
  let p = '';

  for (let i = 0; i < 3; i += 1) {
    const x = r() * w;
    const y = r() * h;
    const s = w * (0.45 + r() * 0.5);
    p += `<rect x="${(x - s / 2).toFixed(0)}" y="${(y - s / 2).toFixed(0)}" width="${s.toFixed(0)}" height="${s.toFixed(0)}" rx="${(s * 0.18).toFixed(0)}" fill="${fields[i]}" opacity="0.9" transform="rotate(${(r() * 40 - 20).toFixed(1)} ${x.toFixed(0)} ${y.toFixed(0)})"/>`;
  }

  if (r() > 0.5) {
    const y = h * (0.3 + r() * 0.4);
    p += `<path d="M0 ${y.toFixed(0)} C ${(w * 0.3).toFixed(0)} ${(y - h * 0.15).toFixed(0)}, ${(w * 0.6).toFixed(0)} ${(y + h * 0.2).toFixed(0)}, ${w} ${(y - h * 0.05).toFixed(0)}" stroke="#cfe0e6" stroke-width="${(h * 0.06).toFixed(0)}" fill="none" stroke-linecap="round"/>`;
  }

  let grid = '';
  const gx = w / 6;
  const gy = h / 6;
  for (let i = 1; i < 6; i += 1) {
    grid += `<line x1="${(i * gx).toFixed(0)}" y1="0" x2="${(i * gx).toFixed(0)}" y2="${h}"/><line x1="0" y1="${(i * gy).toFixed(0)}" x2="${w}" y2="${(i * gy).toFixed(0)}"/>`;
  }
  p += `<g stroke="#d6cfbe" stroke-width="1" opacity="0.55">${grid}</g>`;

  const ry = h * (0.5 + (r() * 0.3 - 0.15));
  p += `<path d="M0 ${ry.toFixed(0)} L ${w} ${(ry + (r() * 40 - 20)).toFixed(0)}" stroke="#ffffff" stroke-width="${(h * 0.05).toFixed(0)}" fill="none"/>`;
  const rx = w * (0.4 + r() * 0.3);
  p += `<path d="M${rx.toFixed(0)} 0 L ${(rx + (r() * 30 - 15)).toFixed(0)} ${h}" stroke="#ffffff" stroke-width="${(h * 0.038).toFixed(0)}" fill="none"/>`;

  const cx = w * (0.42 + r() * 0.16);
  const cy = h * (0.42 + r() * 0.16);
  const pw = w * 0.24;
  const ph = h * 0.22;
  const sk = r() * 8 - 4;
  p += `<polygon points="${(cx - pw / 2).toFixed(0)},${(cy - ph / 2 + sk).toFixed(0)} ${(cx + pw / 2).toFixed(0)},${(cy - ph / 2 - sk).toFixed(0)} ${(cx + pw / 2).toFixed(0)},${(cy + ph / 2 + sk).toFixed(0)} ${(cx - pw / 2).toFixed(0)},${(cy + ph / 2 - sk).toFixed(0)}" fill="${accent}" fill-opacity="0.16" stroke="${accent}" stroke-width="2"/>`;

  if (withPin) {
    p += `<g transform="translate(${cx.toFixed(0)} ${cy.toFixed(0)})"><path d="M0 -16 C 9 -16 13 -6 0 8 C -13 -6 -9 -16 0 -16 Z" fill="${accent}"/><circle cx="0" cy="-8" r="3.6" fill="#fff"/></g>`;
  }

  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><rect width="${w}" height="${h}" fill="${sand}"/>${p}</svg>`;
}
