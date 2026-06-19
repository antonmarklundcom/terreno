import type { Config } from 'tailwindcss';

/**
 * Design tokens for terreno.com.py — sourced verbatim from the "Design Tokens"
 * section of README.md (the design handoff) and the Terreno.dc.html prototype.
 *
 * House style: calm Scandinavian minimalism — generous whitespace, strong type
 * hierarchy, one confident forest-green accent on warm neutrals. These tokens
 * are the single source of truth; components read the theme, never hardcode hex.
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1f6b4a', // forest green accent
          dark: '#184e36', // dark forest (seller surfaces)
          ink: '#18573c', // text-on-tint
          tint: '#eef3ef', // accent tint bg
        },
        trust: {
          bg: '#f1f4ef', // trust-band / green-tinted card bg
          border: '#e2e9e1',
          borderAlt: '#dbe7df',
          icon: '#e1ece5', // icon tile bg
        },
        canvas: '#fafaf9', // page bg
        surface: '#ffffff', // white surface
        fill: {
          DEFAULT: '#fafaf9', // subtle input fill
          warm: '#f3f1ea',
          track: '#eceae3', // segmented control track
        },
        ink: {
          DEFAULT: '#16170f', // primary text
          prose: '#33352c', // long-form body
          soft: '#4a4c43', // chip / secondary label text
          muted: '#6f7167',
          faint: '#9a9b92',
          faintest: '#b3b4aa',
        },
        line: {
          DEFAULT: '#e9e6df',
          warm: '#e7e3da',
          soft: '#efece5',
          cool: '#e3e0d8',
        },
        dark: '#16170f', // footer
        amber: {
          DEFAULT: '#a9772a', // financing / en proceso
          ink: '#8a5f1f',
          bg: '#f3f1ea',
          border: '#e6e2d8',
        },
        whatsapp: '#25D366',
        // Map palette (used by the MapLibre style + SVG fallbacks).
        map: {
          sand: '#ece6d9',
          bosque: '#e4ebdd',
          field1: '#dce5d1',
          field2: '#d3ddc6',
          field3: '#e3e9da',
          grid: '#d6cfbe',
          water: '#cfe0e6',
        },
      },
      fontFamily: {
        sans: ['var(--font-schibsted)', 'system-ui', 'sans-serif'],
      },
      fontFeatureSettings: {
        tabular: '"tnum" 1',
      },
      letterSpacing: {
        h1: '-0.025em',
        h2: '-0.015em',
        tight2: '-0.02em',
        eyebrow: '0.05em',
      },
      borderRadius: {
        tile: '8px', // small tiles 7-9px
        DEFAULT: '10px', // inputs / buttons 9-11px
        card: '14px', // cards 12-16px
        pill: '20px', // chips / pills
        sheet: '18px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,.08)',
        raised: '0 4px 18px rgba(22,23,15,.05)',
        float: '0 8px 28px rgba(22,23,15,.1)',
        pin: '0 2px 8px rgba(0,0,0,.2)',
        focus: '0 0 0 3px rgba(31,107,74,0.18)',
      },
      maxWidth: {
        content: '1200px',
        prose: '68ch',
      },
    },
  },
  plugins: [],
};

export default config;
