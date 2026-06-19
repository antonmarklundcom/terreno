import { z } from 'zod';
import type { Servicio } from './types';

/** zod schemas — every API input is validated through these. */

export const tipoSchema = z.enum([
  'lote_urbano',
  'terreno_comercial',
  'campo',
  'quinta',
  'loteamiento',
]);

export const servicioSchema = z.enum([
  'agua',
  'energia',
  'desague',
  'asfalto',
  'empedrado',
  'internet',
]);

export const financiacionSchema = z.enum(['contado', 'cuotas']);
export const estadoTituloSchema = z.enum(['con_titulo', 'en_proceso']);

/** Coerce a comma-separated or repeated query param into a Servicio[]. */
function parseServicios(value: unknown): Servicio[] | undefined {
  if (value == null) return undefined;
  const raw = Array.isArray(value) ? value : String(value).split(',');
  const parsed = raw
    .map((v) => v.trim())
    .filter(Boolean)
    .map((v) => servicioSchema.safeParse(v))
    .filter((r): r is { success: true; data: Servicio } => r.success)
    .map((r) => r.data);
  return parsed.length ? parsed : undefined;
}

const numeric = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v) => {
    if (v == null || v === '') return undefined;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : undefined;
  });

const boolish = z
  .union([z.string(), z.boolean()])
  .optional()
  .transform((v) => v === true || v === 'true' || v === '1');

/** Listing-filter query params (mirrors the filter rail + API contract). */
export const listingQuerySchema = z.object({
  tipo: tipoSchema.optional(),
  departamento: z.string().min(1).optional(),
  ciudad: z.string().min(1).optional(),
  barrio: z.string().min(1).optional(),
  sup_min: numeric,
  sup_max: numeric,
  precio_min: numeric,
  precio_max: numeric,
  servicios: z.unknown().transform(parseServicios),
  financiacion: financiacionSchema.optional(),
  estado_titulo: estadoTituloSchema.optional(),
  destacado: boolish,
  page: numeric,
  per_page: numeric,
});

/** Lead intake — discriminated by tipo_lead. */
const contactoSchema = z
  .object({
    nombre: z.string().max(120).optional(),
    telefono: z.string().max(40).optional(),
    email: z.string().email().max(160).optional().or(z.literal('')),
    mensaje: z.string().max(2000).optional(),
  })
  .optional();

const ubicacionSchema = z
  .object({
    departamento: z.string().max(80).optional(),
    ciudad: z.string().max(80).optional(),
    barrio: z.string().max(80).optional(),
  })
  .optional();

export const leadSchema = z.object({
  tipo_lead: z.enum(['listing_contact', 'valuation', 'service']),
  contacto: contactoSchema,
  ubicacion: ubicacionSchema,
  superficie_m2: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v == null || v === '') return undefined;
      const n = typeof v === 'number' ? v : Number(v);
      return Number.isFinite(n) ? n : undefined;
    }),
  listing_slug: z.string().max(200).optional(),
  servicio: z.string().max(80).optional(),
  source: z.string().max(200).optional(),
});

export type LeadParsed = z.infer<typeof leadSchema>;
export type ListingQueryParsed = z.infer<typeof listingQuerySchema>;
