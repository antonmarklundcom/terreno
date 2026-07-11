/**
 * Domain type model for terreno.com.py.
 *
 * These types are the contract for the data seam. The `Listing` shape is
 * designed to mirror the future JetEngine REST response so that swapping the
 * data source is a single-file change inside `lib/listings-repo.ts`.
 *
 * No `any` allowed in this file — it is the canonical domain model.
 */

import type { Polygon } from 'geojson';

export type Tipo =
  'lote_urbano' | 'terreno_comercial' | 'campo' | 'quinta' | 'loteamiento';

export type Moneda = 'USD' | 'PYG';

export type Servicio =
  'agua' | 'energia' | 'desague' | 'asfalto' | 'empedrado' | 'internet';

export type EstadoTitulo = 'con_titulo' | 'en_proceso';

export type Financiacion = 'contado' | 'cuotas';

/** Drives lead routing — see lib/leads.ts. */
export type OwnerType = 'broker' | 'casa_propia';

export interface ListingOwner {
  nombre: string;
  /** WhatsApp number in international format, digits only (e.g. 595981123456). */
  telefono_wa: string;
  inmobiliaria?: string;
}

export interface ListingUbicacion {
  departamento: string;
  /** Distrito. */
  ciudad: string;
  /** Urban only; rural stops at distrito. */
  barrio?: string;
  lat: number;
  lng: number;
  /** Optional parcel outline; render a pin if absent. */
  polygon?: Polygon;
}

export interface ListingPrecio {
  monto: number;
  moneda: Moneda;
}

export interface ListingDimensiones {
  frente_m?: number;
  fondo_m?: number;
}

/**
 * Loteamiento-only aggregate fields. Build 1 models loteamiento as a `tipo`,
 * not a parent/child relation.
 */
export interface LoteamientoAggregate {
  lotes_total: number;
  lotes_disponibles: number;
  precio_desde: number;
  cuota_desde?: number;
  moneda: Moneda;
}

export interface Listing {
  id: string;
  slug: string;
  owner_type: OwnerType;
  owner: ListingOwner;
  tipo: Tipo;
  titulo: string;
  descripcion: string;
  ubicacion: ListingUbicacion;
  /** CANONICAL unit, always m². */
  superficie_m2: number;
  precio: ListingPrecio;
  // precio_m2 is DERIVED (monto / superficie_m2) — compute, never store.
  dimensiones?: ListingDimensiones;
  esquina: boolean;
  servicios: Servicio[];
  estado_titulo: EstadoTitulo;
  financiacion: Financiacion;
  loteamiento?: LoteamientoAggregate;
  /** Build 1: same placeholder for ALL listings. */
  images: string[];
  /** Unix ts — timestamp gating, NOT a boolean. */
  featured_until?: number;
  status: 'published';
  created_at: number;
  updated_at: number;
}

/** Filters accepted by the repo and mirrored by the URL / API query params. */
export interface ListingFilters {
  tipo?: Tipo;
  departamento?: string;
  ciudad?: string;
  barrio?: string;
  sup_min?: number;
  sup_max?: number;
  precio_min?: number;
  precio_max?: number;
  /** USD-normalised comparison handled in the repo. */
  servicios?: Servicio[];
  financiacion?: Financiacion;
  estado_titulo?: EstadoTitulo;
  destacado?: boolean;
  page?: number;
  per_page?: number;
}

/** Facet cascade for the location selector + tipo counts. */
export interface Facets {
  departamentos: Array<{
    nombre: string;
    count: number;
    ciudades: Array<{
      nombre: string;
      count: number;
      barrios: Array<{ nombre: string; count: number }>;
    }>;
  }>;
  tipos: Array<{ tipo: Tipo; count: number }>;
  servicios: Array<{ servicio: Servicio; count: number }>;
}

export interface ListingsResult {
  data: Listing[];
  total: number;
  facets: Facets;
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

export type TipoLead = 'listing_contact' | 'valuation' | 'service';

export interface LeadContacto {
  nombre?: string;
  telefono?: string;
  email?: string;
  mensaje?: string;
}

export interface LeadUbicacion {
  departamento?: string;
  ciudad?: string;
  barrio?: string;
}

export interface LeadInput {
  tipo_lead: TipoLead;
  contacto?: LeadContacto;
  ubicacion?: LeadUbicacion;
  /** For valuation leads. */
  superficie_m2?: number;
  /** For listing_contact leads. */
  listing_slug?: string;
  /** For service leads. */
  servicio?: string;
  /** Free-form source page for analytics. */
  source?: string;
}

// ---------------------------------------------------------------------------
// Content (guides)
// ---------------------------------------------------------------------------

export interface GuideArticle {
  slug: string;
  titulo: string;
  resumen: string;
  /** ISO-ish display date. */
  fecha: string;
  /** Reading time in minutes. */
  lectura_min: number;
  categoria: string;
  /** Body as ordered blocks for a calm long-form template. */
  cuerpo: Array<
    | { tipo: 'parrafo'; texto: string }
    | { tipo: 'subtitulo'; texto: string }
    | { tipo: 'lista'; items: string[] }
    | { tipo: 'cita'; texto: string }
  >;
}

export interface ServiceProvider {
  id: string;
  nombre: string;
  categoria: ServiceCategoria;
  descripcion: string;
  zona: string;
  telefono_wa?: string;
}

export type ServiceCategoria = 'tasador' | 'escribano' | 'agrimensor';
