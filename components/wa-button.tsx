'use client';

import type { ReactNode } from 'react';
import type { LeadInput } from '@/lib/types';
import { WhatsAppGlyph } from './icons';

/**
 * WhatsApp action button. On click it:
 *   1. Fires a lead to /api/leads via navigator.sendBeacon (leave-page-safe).
 *   2. Opens the wa.me deep link.
 *
 * Logging is best-effort and must never block the user — if sendBeacon is
 * unavailable or fails, we still open WhatsApp.
 */
export function WaButton({
  href,
  lead,
  children,
  className = 'btn-whatsapp w-full',
  withGlyph = true,
}: {
  href: string;
  lead: LeadInput;
  children: ReactNode;
  className?: string;
  withGlyph?: boolean;
}) {
  function handleClick() {
    try {
      const payload = JSON.stringify({
        ...lead,
        source:
          lead.source ??
          (typeof window !== 'undefined'
            ? window.location.pathname
            : undefined),
      });
      if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
        const blob = new Blob([payload], { type: 'text/plain' });
        navigator.sendBeacon('/api/leads', blob);
      } else {
        void fetch('/api/leads', {
          method: 'POST',
          body: payload,
          keepalive: true,
        });
      }
    } catch {
      // Logging is best-effort; never block the WhatsApp action.
    }
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={className}
    >
      {withGlyph && <WhatsAppGlyph size={20} />}
      {children}
    </a>
  );
}
