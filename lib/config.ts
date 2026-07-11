/**
 * Runtime configuration derived from environment variables.
 * Everything here must degrade gracefully when the variable is unset —
 * the site builds and runs on the "minimum viable" subset alone (see .env.example).
 */

function clean(value: string | undefined): string | undefined {
  const v = value?.trim();
  return v && v.length > 0 ? v : undefined;
}

export const SITE = {
  url: clean(process.env.NEXT_PUBLIC_SITE_URL) ?? 'https://terreno.com.py',
  name: clean(process.env.NEXT_PUBLIC_BUSINESS_NAME) ?? 'Terreno',
  /** Our own WhatsApp number — used for casa_propia, valuation and service leads. */
  whatsapp: clean(process.env.NEXT_PUBLIC_WHATSAPP) ?? '595000000000',
  /** Visual-only featured badges at launch. */
  featuredBadges:
    clean(process.env.NEXT_PUBLIC_FEATURE_FEATURED_BADGES) !== 'false',
} as const;

/** Server-only secrets. Never expose these to the client. */
export const SERVER_ENV = {
  ghlWebhookUrl: clean(process.env.GHL_WEBHOOK_URL),
  sheetsWebhookUrl: clean(process.env.SHEETS_WEBHOOK_URL),
  revalidateToken: clean(process.env.REVALIDATE_TOKEN),
} as const;
