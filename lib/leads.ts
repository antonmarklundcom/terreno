import type { LeadInput } from './types';
import { SERVER_ENV } from './config';
import { getListingBySlug } from './listings-repo';
import { listingContactNumber } from './whatsapp';

/**
 * Single lead orchestrator. All leads — listing_contact, valuation, service —
 * converge here. Responsibilities:
 *   1. Resolve routing (WhatsApp number) by owner_type.
 *   2. Fan out to GHL + Google Sheets in parallel (Promise.allSettled), each
 *      with 3× exponential-backoff retries.
 *
 * Logger failure must NEVER fail the user's action. When the webhook env vars
 * are unset, we skip silently and degrade gracefully (WhatsApp still works).
 */

export interface LeadResult {
  ok: true;
  /** Destination WhatsApp number (digits) the front-end can deep-link to. */
  wa_number: string;
  loggers: Array<{
    name: string;
    status: 'fulfilled' | 'rejected' | 'skipped';
  }>;
}

async function postWithRetry(
  url: string,
  body: unknown,
  retries = 3,
): Promise<void> {
  let attempt = 0;
  // 3 attempts, backoff 200ms, 400ms, 800ms.
  for (;;) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return;
    } catch (err) {
      attempt += 1;
      if (attempt > retries) throw err;
      await new Promise((r) => setTimeout(r, 200 * 2 ** (attempt - 1)));
    }
  }
}

async function resolveWaNumber(input: LeadInput): Promise<string> {
  // valuation & service always reach our pipeline; resolved client-side from
  // NEXT_PUBLIC_WHATSAPP. Only listing_contact needs server-side resolution by
  // owner_type, since that depends on the listing's owner.
  if (input.tipo_lead === 'listing_contact' && input.listing_slug) {
    const listing = await getListingBySlug(input.listing_slug);
    if (listing) return listingContactNumber(listing);
  }
  // Fallback to our number (also the casa_propia / valuation / service case).
  return (
    (typeof process !== 'undefined' &&
      process.env.NEXT_PUBLIC_WHATSAPP?.replace(/[^0-9]/g, '')) ||
    ''
  );
}

export async function processLead(input: LeadInput): Promise<LeadResult> {
  const wa_number = await resolveWaNumber(input);

  const enriched = {
    ...input,
    wa_number,
    received_at: new Date().toISOString(),
  };

  const jobs: Array<{ name: string; url?: string }> = [
    { name: 'ghl', url: SERVER_ENV.ghlWebhookUrl },
    { name: 'sheets', url: SERVER_ENV.sheetsWebhookUrl },
  ];

  const results = await Promise.allSettled(
    jobs.map((j) =>
      j.url
        ? postWithRetry(j.url, enriched)
        : Promise.reject(new Error('skip')),
    ),
  );

  const loggers = jobs.map((j, i) => {
    if (!j.url) return { name: j.name, status: 'skipped' as const };
    return {
      name: j.name,
      status: results[i].status,
    };
  });

  return { ok: true, wa_number, loggers };
}
