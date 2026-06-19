import type { Metadata, Viewport } from 'next';
import { Schibsted_Grotesk } from 'next/font/google';
import './globals.css';
import { SITE } from '@/lib/config';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

const schibsted = Schibsted_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-schibsted',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — Terrenos, lotes y campos en Paraguay`,
    template: `%s · ${SITE.name}`,
  },
  description:
    'Portal de terrenos en Paraguay: lotes, campos, quintas y loteamientos. Mapa, superficie, precio y precio/m² al frente. Comprá tierra con datos claros o vendé tu terreno con nosotros.',
  applicationName: SITE.name,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'es_PY',
    siteName: SITE.name,
    url: SITE.url,
    title: `${SITE.name} — Terrenos, lotes y campos en Paraguay`,
    description:
      'Comprá o vendé tierra en Paraguay con datos claros: mapa, superficie, precio y precio/m².',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#1F5F4B',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-PY" className={schibsted.variable}>
      <body className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
