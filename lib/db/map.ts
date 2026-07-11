import type { InferSelectModel } from 'drizzle-orm';
import type { Polygon } from 'geojson';
import type {
  Financiacion,
  Listing,
  ListingOwner,
  LoteamientoAggregate,
  Moneda,
  Servicio,
  Tipo,
} from '@/lib/types';
import type { listings, owners } from './schema';

/**
 * Map a DB listings row (+ its joined owner) to the app-facing `Listing`
 * domain model. This conversion lives inside the repo seam — nothing outside
 * the repo module sees DB row shapes. Decimals arrive as strings from mysql2;
 * datetimes as JS `Date`; JSON columns already parsed.
 */

type ListingRow = InferSelectModel<typeof listings>;
type OwnerRow = InferSelectModel<typeof owners>;

const num = (v: string | number | null): number =>
  v == null ? 0 : typeof v === 'number' ? v : Number(v);

const ms = (d: Date | null): number => (d ? d.getTime() : 0);

/**
 * Read a JSON column. MySQL 8 returns JSON columns already parsed; MariaDB
 * (JSON = LONGTEXT alias) returns a string. Handle both so the same code runs
 * against the CI service container and a local MariaDB.
 */
function json<T>(v: unknown): T | null {
  if (v == null) return null;
  if (typeof v === 'string') {
    try {
      return JSON.parse(v) as T;
    } catch {
      return null;
    }
  }
  return v as T;
}

export function rowToListing(
  row: ListingRow,
  ownerRow: OwnerRow | null,
): Listing {
  const owner: ListingOwner = {
    nombre: ownerRow?.nombre ?? '',
    telefono_wa: ownerRow?.telefonoWa ?? '',
    ...(ownerRow?.inmobiliaria ? { inmobiliaria: ownerRow.inmobiliaria } : {}),
  };

  const frente = row.frenteM == null ? undefined : num(row.frenteM);
  const fondo = row.fondoM == null ? undefined : num(row.fondoM);

  return {
    id: String(row.id),
    public_id: row.publicId,
    slug: row.slug,
    origin: row.origin,
    owner_type: row.ownerType,
    owner,
    tipo: row.tipo as Tipo,
    titulo: row.titulo,
    descripcion: row.descripcion,
    ubicacion: {
      departamento: row.departamento,
      ciudad: row.ciudad,
      ...(row.barrio ? { barrio: row.barrio } : {}),
      lat: num(row.lat),
      lng: num(row.lng),
      ...(json<Polygon>(row.polygon)
        ? { polygon: json<Polygon>(row.polygon) as Polygon }
        : {}),
    },
    superficie_m2: num(row.superficieM2),
    precio: { monto: num(row.precioMonto), moneda: row.precioMoneda as Moneda },
    ...(frente != null || fondo != null
      ? { dimensiones: { frente_m: frente, fondo_m: fondo } }
      : {}),
    esquina: Boolean(row.esquina),
    servicios: json<Servicio[]>(row.servicios) ?? [],
    estado_titulo: row.estadoTitulo,
    financiacion: row.financiacion as Financiacion,
    ...(json<LoteamientoAggregate>(row.loteamiento)
      ? { loteamiento: json<LoteamientoAggregate>(row.loteamiento)! }
      : {}),
    images: json<string[]>(row.images) ?? [],
    ...(row.featuredUntil ? { featured_until: ms(row.featuredUntil) } : {}),
    status: 'published',
    created_at: ms(row.createdAt),
    updated_at: ms(row.updatedAt),
  };
}
