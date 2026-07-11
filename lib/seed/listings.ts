import type { Listing, OwnerType, Servicio } from '@/lib/types';
import { kebab } from '@/lib/slug';
import { deterministicPublicId } from '@/lib/public-id';

/**
 * Versioned seed data — the permanent DB fallback and the dev/import fixture.
 *
 * IMPORTANT: nothing outside `lib/listings-repo.ts` may import this file.
 * The repo reads it when the MySQL source is unreachable (§4) and
 * `scripts/import-seed.ts` loads it into the DB. Edit listings here; keep
 * lat/lng realistic so map pins land in the right city.
 */

const PLACEHOLDER = '/placeholder-lote.svg';

// Deterministic time base so SSG output is stable across builds.
const BASE = Date.UTC(2026, 5, 1); // 2026-06-01
const DAY = 86_400_000;
const ago = (days: number) => BASE - days * DAY;
const future = (days: number) => BASE + days * DAY;

type Seed = Omit<
  Listing,
  'id' | 'public_id' | 'slug' | 'origin' | 'status' | 'images'
> & {
  id?: string;
  slug?: string;
};

let counter = 0;
function build(seed: Seed): Listing {
  counter += 1;
  const id = seed.id ?? `t-${String(counter).padStart(3, '0')}`;
  const slug = seed.slug ?? `${kebab(seed.titulo)}-${id}`;
  return {
    ...seed,
    id,
    // Deterministic so a seed re-import is always a no-op (§12 gate).
    public_id: deterministicPublicId(id),
    slug,
    origin: 'local',
    images: [PLACEHOLDER],
    status: 'published',
  };
}

// Reusable owners ---------------------------------------------------------
const broker = (
  nombre: string,
  inmobiliaria: string,
  telefono_wa: string,
): { owner_type: OwnerType; owner: Listing['owner'] } => ({
  owner_type: 'broker',
  owner: { nombre, inmobiliaria, telefono_wa },
});
const propia = (
  nombre: string,
  telefono_wa: string,
): { owner_type: OwnerType; owner: Listing['owner'] } => ({
  owner_type: 'casa_propia',
  owner: { nombre, telefono_wa },
});

const S = (...s: Servicio[]): Servicio[] => s;

// Square-ish polygon helper for a few parcels.
function rect(lat: number, lng: number, dLat: number, dLng: number) {
  return {
    type: 'Polygon' as const,
    coordinates: [
      [
        [lng - dLng, lat - dLat],
        [lng + dLng, lat - dLat],
        [lng + dLng, lat + dLat],
        [lng - dLng, lat + dLat],
        [lng - dLng, lat - dLat],
      ],
    ],
  };
}

export const SEED_LISTINGS: Listing[] = [
  // ===================== CENTRAL — Luque =====================
  build({
    ...broker('Carla Giménez', 'Tierra Firme Inmobiliaria', '595981445120'),
    tipo: 'lote_urbano',
    titulo: 'Lote en San Isidro',
    descripcion:
      'Lote urbano en zona residencial consolidada de San Isidro, Luque. Calle empedrada, a tres cuadras de la avenida principal. Ideal para vivienda familiar. Con título al día y posibilidad de cuotas.',
    ubicacion: {
      departamento: 'Central',
      ciudad: 'Luque',
      barrio: 'San Isidro',
      lat: -25.2701,
      lng: -57.4889,
      polygon: rect(-25.2701, -57.4889, 0.00015, 0.0001),
    },
    superficie_m2: 360,
    precio: { monto: 28500, moneda: 'USD' },
    dimensiones: { frente_m: 12, fondo_m: 30 },
    esquina: false,
    servicios: S('agua', 'energia', 'asfalto', 'internet'),
    estado_titulo: 'con_titulo',
    financiacion: 'cuotas',
    featured_until: future(45),
    created_at: ago(18),
    updated_at: ago(3),
  }),
  build({
    ...broker('Carla Giménez', 'Tierra Firme Inmobiliaria', '595981445120'),
    tipo: 'lote_urbano',
    titulo: 'Terreno esquina en Laguna Grande',
    descripcion:
      'Terreno en esquina sobre calle empedrada en Laguna Grande, Luque. Excelente para comercio o vivienda. Servicios de agua y energía disponibles sobre la línea.',
    ubicacion: {
      departamento: 'Central',
      ciudad: 'Luque',
      barrio: 'Laguna Grande',
      lat: -25.2543,
      lng: -57.4701,
    },
    superficie_m2: 450,
    precio: { monto: 39000, moneda: 'USD' },
    dimensiones: { frente_m: 15, fondo_m: 30 },
    esquina: true,
    servicios: S('agua', 'energia', 'empedrado'),
    estado_titulo: 'con_titulo',
    financiacion: 'contado',
    created_at: ago(31),
    updated_at: ago(9),
  }),
  build({
    ...propia('Diego Benítez', '595971220845'),
    tipo: 'lote_urbano',
    titulo: 'Lote sobre asfaltado en Mora Cué',
    descripcion:
      'Vendo lote propio en Mora Cué, Luque, sobre calle asfaltada. Zona en pleno crecimiento, a minutos del aeropuerto. Documentación en regla.',
    ubicacion: {
      departamento: 'Central',
      ciudad: 'Luque',
      barrio: 'Mora Cué',
      lat: -25.2812,
      lng: -57.4955,
    },
    superficie_m2: 300,
    precio: { monto: 24000, moneda: 'USD' },
    dimensiones: { frente_m: 10, fondo_m: 30 },
    esquina: false,
    servicios: S('agua', 'energia', 'asfalto', 'desague', 'internet'),
    estado_titulo: 'con_titulo',
    financiacion: 'contado',
    created_at: ago(12),
    updated_at: ago(12),
  }),

  // ===================== CENTRAL — Mariano Roque Alonso =====================
  build({
    ...broker('Óscar Vera', 'Vera Negocios Inmobiliarios', '595985330112'),
    tipo: 'lote_urbano',
    titulo: 'Lote en barrio cerrado, Mariano Roque Alonso',
    descripcion:
      'Lote en loteamiento con seguridad y calles internas empedradas en Mariano Roque Alonso. Agua y energía garantizadas. Financiación en cuotas hasta 48 meses.',
    ubicacion: {
      departamento: 'Central',
      ciudad: 'Mariano Roque Alonso',
      barrio: 'Santa Rosa',
      lat: -25.2009,
      lng: -57.5331,
    },
    superficie_m2: 400,
    precio: { monto: 31000, moneda: 'USD' },
    dimensiones: { frente_m: 12.5, fondo_m: 32 },
    esquina: false,
    servicios: S('agua', 'energia', 'empedrado', 'internet'),
    estado_titulo: 'con_titulo',
    financiacion: 'cuotas',
    featured_until: future(20),
    created_at: ago(22),
    updated_at: ago(5),
  }),
  build({
    ...broker('Óscar Vera', 'Vera Negocios Inmobiliarios', '595985330112'),
    tipo: 'terreno_comercial',
    titulo: 'Terreno comercial sobre Ruta Transchaco',
    descripcion:
      'Amplio terreno comercial con frente sobre la Ruta Transchaco, Mariano Roque Alonso. Altísima visibilidad y tránsito. Ideal para showroom, depósito o local.',
    ubicacion: {
      departamento: 'Central',
      ciudad: 'Mariano Roque Alonso',
      barrio: 'Zona Industrial',
      lat: -25.1955,
      lng: -57.5402,
    },
    superficie_m2: 1200,
    precio: { monto: 240000, moneda: 'USD' },
    dimensiones: { frente_m: 30, fondo_m: 40 },
    esquina: true,
    servicios: S('agua', 'energia', 'desague', 'asfalto', 'internet'),
    estado_titulo: 'con_titulo',
    financiacion: 'contado',
    created_at: ago(40),
    updated_at: ago(14),
  }),

  // ===================== CENTRAL — Limpio =====================
  build({
    ...propia('Marta Riquelme', '595982901447'),
    tipo: 'lote_urbano',
    titulo: 'Lote económico en Limpio centro',
    descripcion:
      'Lote propio a pocas cuadras del centro de Limpio. Buen acceso, colectivo en la esquina. Apto para construir ya. Acepto parte en efectivo y saldo en cuotas a convenir.',
    ubicacion: {
      departamento: 'Central',
      ciudad: 'Limpio',
      barrio: 'Santa Librada',
      lat: -25.1689,
      lng: -57.4912,
    },
    superficie_m2: 312,
    precio: { monto: 17500, moneda: 'USD' },
    dimensiones: { frente_m: 12, fondo_m: 26 },
    esquina: false,
    servicios: S('agua', 'energia'),
    estado_titulo: 'en_proceso',
    financiacion: 'cuotas',
    created_at: ago(8),
    updated_at: ago(8),
  }),

  // ===================== CENTRAL — Capiatá =====================
  build({
    ...broker('Liz Caballero', 'Inmobiliaria Surubi’i', '595991556023'),
    tipo: 'lote_urbano',
    titulo: 'Lote en Capiatá sobre Acceso Sur',
    descripcion:
      'Lote bien ubicado a 600 m del Acceso Sur, Capiatá. Zona comercial en expansión, todos los servicios disponibles. Título individual.',
    ubicacion: {
      departamento: 'Central',
      ciudad: 'Capiatá',
      barrio: 'San Antonio',
      lat: -25.3551,
      lng: -57.3449,
    },
    superficie_m2: 384,
    precio: { monto: 26000, moneda: 'USD' },
    dimensiones: { frente_m: 12, fondo_m: 32 },
    esquina: false,
    servicios: S('agua', 'energia', 'asfalto', 'desague', 'internet'),
    estado_titulo: 'con_titulo',
    financiacion: 'cuotas',
    created_at: ago(27),
    updated_at: ago(7),
  }),

  // ===================== CENTRAL — Ñemby =====================
  build({
    ...broker('Liz Caballero', 'Inmobiliaria Surubi’i', '595991556023'),
    tipo: 'lote_urbano',
    titulo: 'Lote alto en Cerro Ñemby',
    descripcion:
      'Lote en zona alta de Ñemby con excelente vista, suelo firme y sin riesgo de inundación. Barrio residencial tranquilo. Con título.',
    ubicacion: {
      departamento: 'Central',
      ciudad: 'Ñemby',
      barrio: 'Pa’i Ñu',
      lat: -25.3941,
      lng: -57.5366,
    },
    superficie_m2: 420,
    precio: { monto: 33500, moneda: 'USD' },
    dimensiones: { frente_m: 14, fondo_m: 30 },
    esquina: false,
    servicios: S('agua', 'energia', 'empedrado'),
    estado_titulo: 'con_titulo',
    financiacion: 'contado',
    created_at: ago(16),
    updated_at: ago(16),
  }),

  // ===================== CENTRAL — San Lorenzo =====================
  build({
    ...broker('Hugo Páez', 'Páez Propiedades', '595981772390'),
    tipo: 'terreno_comercial',
    titulo: 'Esquina comercial en San Lorenzo',
    descripcion:
      'Terreno en esquina sobre avenida de doble mano en San Lorenzo. Ideal para local, farmacia o entidad financiera. Todos los servicios.',
    ubicacion: {
      departamento: 'Central',
      ciudad: 'San Lorenzo',
      barrio: 'Villa del Maestro',
      lat: -25.3401,
      lng: -57.5089,
    },
    superficie_m2: 600,
    precio: { monto: 145000, moneda: 'USD' },
    dimensiones: { frente_m: 20, fondo_m: 30 },
    esquina: true,
    servicios: S('agua', 'energia', 'desague', 'asfalto', 'internet'),
    estado_titulo: 'con_titulo',
    financiacion: 'contado',
    featured_until: future(30),
    created_at: ago(35),
    updated_at: ago(2),
  }),
  build({
    ...propia('Sergio Ortiz', '595972648110'),
    tipo: 'lote_urbano',
    titulo: 'Lote residencial en San Lorenzo',
    descripcion:
      'Vendo lote en zona residencial de San Lorenzo, cerca de la UNA. Calle asfaltada, ideal para alquiler estudiantil o vivienda. Título propio.',
    ubicacion: {
      departamento: 'Central',
      ciudad: 'San Lorenzo',
      barrio: 'San Miguel',
      lat: -25.3478,
      lng: -57.5201,
    },
    superficie_m2: 330,
    precio: { monto: 29000, moneda: 'USD' },
    dimensiones: { frente_m: 11, fondo_m: 30 },
    esquina: false,
    servicios: S('agua', 'energia', 'asfalto', 'internet'),
    estado_titulo: 'con_titulo',
    financiacion: 'contado',
    created_at: ago(10),
    updated_at: ago(10),
  }),

  // ===================== CENTRAL — Fernando de la Mora =====================
  build({
    ...broker('Hugo Páez', 'Páez Propiedades', '595981772390'),
    tipo: 'lote_urbano',
    titulo: 'Lote en Fernando de la Mora zona norte',
    descripcion:
      'Lote en zona norte de Fernando de la Mora, a metros de la Ruta Mariscal Estigarribia. Excelente conexión con Asunción. Con título.',
    ubicacion: {
      departamento: 'Central',
      ciudad: 'Fernando de la Mora',
      barrio: 'Zona Norte',
      lat: -25.3196,
      lng: -57.5402,
    },
    superficie_m2: 360,
    precio: { monto: 42000, moneda: 'USD' },
    dimensiones: { frente_m: 12, fondo_m: 30 },
    esquina: false,
    servicios: S('agua', 'energia', 'desague', 'asfalto', 'internet'),
    estado_titulo: 'con_titulo',
    financiacion: 'contado',
    created_at: ago(19),
    updated_at: ago(6),
  }),

  // ===================== CENTRAL — Lambaré =====================
  build({
    ...broker('Patricia Núñez', 'Núñez & Asociados', '595983114567'),
    tipo: 'lote_urbano',
    titulo: 'Lote sobre avenida en Lambaré',
    descripcion:
      'Lote con frente sobre avenida en Lambaré, apto comercial o vivienda. Zona consolidada con todos los servicios. Título individual al día.',
    ubicacion: {
      departamento: 'Central',
      ciudad: 'Lambaré',
      barrio: 'Santa Ana',
      lat: -25.3461,
      lng: -57.6063,
    },
    superficie_m2: 400,
    precio: { monto: 52000, moneda: 'USD' },
    dimensiones: { frente_m: 13, fondo_m: 31 },
    esquina: false,
    servicios: S('agua', 'energia', 'desague', 'asfalto', 'internet'),
    estado_titulo: 'con_titulo',
    financiacion: 'contado',
    created_at: ago(24),
    updated_at: ago(11),
  }),

  // ===================== CENTRAL — Areguá (quintas) =====================
  build({
    ...broker('Patricia Núñez', 'Núñez & Asociados', '595983114567'),
    tipo: 'quinta',
    titulo: 'Quinta con arboleda en Areguá',
    descripcion:
      'Quinta de 5.000 m² con arboleda natural y vista a la zona del lago en Areguá. Ideal para casa quinta o proyecto de descanso. Terreno alto y firme.',
    ubicacion: {
      departamento: 'Central',
      ciudad: 'Areguá',
      barrio: 'Estanzuela',
      lat: -25.3122,
      lng: -57.4205,
      polygon: rect(-25.3122, -57.4205, 0.0006, 0.0005),
    },
    superficie_m2: 5000,
    precio: { monto: 65000, moneda: 'USD' },
    esquina: false,
    servicios: S('agua', 'energia', 'internet'),
    estado_titulo: 'con_titulo',
    financiacion: 'contado',
    featured_until: future(25),
    created_at: ago(33),
    updated_at: ago(4),
  }),
  build({
    ...propia('Elena Vargas', '595961338721'),
    tipo: 'quinta',
    titulo: 'Quinta sobre ruta a Areguá',
    descripcion:
      'Quinta propia de 3.000 m² sobre ruta empedrada camino a Areguá. Con pozo artesiano y energía. Perfecta para fin de semana. Vendo por viaje.',
    ubicacion: {
      departamento: 'Central',
      ciudad: 'Areguá',
      barrio: 'Caacupemí',
      lat: -25.3061,
      lng: -57.4312,
    },
    superficie_m2: 3000,
    precio: { monto: 38000, moneda: 'USD' },
    esquina: false,
    servicios: S('agua', 'energia'),
    estado_titulo: 'con_titulo',
    financiacion: 'contado',
    created_at: ago(14),
    updated_at: ago(14),
  }),

  // ===================== CENTRAL — Itauguá =====================
  build({
    ...broker('Carla Giménez', 'Tierra Firme Inmobiliaria', '595981445120'),
    tipo: 'lote_urbano',
    titulo: 'Lote en Itauguá sobre Ruta 2',
    descripcion:
      'Lote a 300 m de la Ruta 2 en Itauguá. Zona comercial con mucho movimiento. Agua y energía. Apto vivienda o pequeño comercio.',
    ubicacion: {
      departamento: 'Central',
      ciudad: 'Itauguá',
      barrio: 'San Roque',
      lat: -25.3925,
      lng: -57.3548,
    },
    superficie_m2: 375,
    precio: { monto: 21000, moneda: 'USD' },
    dimensiones: { frente_m: 12.5, fondo_m: 30 },
    esquina: false,
    servicios: S('agua', 'energia', 'asfalto'),
    estado_titulo: 'con_titulo',
    financiacion: 'cuotas',
    created_at: ago(9),
    updated_at: ago(9),
  }),

  // ===================== CENTRAL — Villa Elisa =====================
  build({
    ...broker('Patricia Núñez', 'Núñez & Asociados', '595983114567'),
    tipo: 'lote_urbano',
    titulo: 'Lote en Villa Elisa zona residencial',
    descripcion:
      'Lote en barrio residencial tranquilo de Villa Elisa, calle asfaltada y todos los servicios. A minutos de la Costanera Sur. Con título.',
    ubicacion: {
      departamento: 'Central',
      ciudad: 'Villa Elisa',
      barrio: 'San Miguel',
      lat: -25.3641,
      lng: -57.5912,
    },
    superficie_m2: 348,
    precio: { monto: 37000, moneda: 'USD' },
    dimensiones: { frente_m: 12, fondo_m: 29 },
    esquina: false,
    servicios: S('agua', 'energia', 'desague', 'asfalto', 'internet'),
    estado_titulo: 'con_titulo',
    financiacion: 'contado',
    created_at: ago(21),
    updated_at: ago(8),
  }),

  // ===================== ASUNCIÓN =====================
  build({
    ...broker('Rodrigo Ayala', 'Capital Urbano', '595981009934'),
    tipo: 'lote_urbano',
    titulo: 'Terreno en Mburucuyá, Asunción',
    descripcion:
      'Excelente terreno en el barrio Mburucuyá, Asunción. Zona residencial premium, cerca de avenidas principales y shoppings. Apto para edificio o vivienda de categoría.',
    ubicacion: {
      departamento: 'Asunción',
      ciudad: 'Asunción',
      barrio: 'Mburucuyá',
      lat: -25.3019,
      lng: -57.5742,
    },
    superficie_m2: 600,
    precio: { monto: 168000, moneda: 'USD' },
    dimensiones: { frente_m: 20, fondo_m: 30 },
    esquina: false,
    servicios: S('agua', 'energia', 'desague', 'asfalto', 'internet'),
    estado_titulo: 'con_titulo',
    financiacion: 'contado',
    featured_until: future(40),
    created_at: ago(29),
    updated_at: ago(1),
  }),
  build({
    ...broker('Rodrigo Ayala', 'Capital Urbano', '595981009934'),
    tipo: 'terreno_comercial',
    titulo: 'Terreno comercial sobre Avda. España',
    descripcion:
      'Terreno comercial con frente sobre Avenida España, Asunción. Ubicación inmejorable para oficinas o local de alto nivel. Título perfecto.',
    ubicacion: {
      departamento: 'Asunción',
      ciudad: 'Asunción',
      barrio: 'Recoleta',
      lat: -25.2911,
      lng: -57.5841,
    },
    superficie_m2: 850,
    precio: { monto: 420000, moneda: 'USD' },
    dimensiones: { frente_m: 17, fondo_m: 50 },
    esquina: true,
    servicios: S('agua', 'energia', 'desague', 'asfalto', 'internet'),
    estado_titulo: 'con_titulo',
    financiacion: 'contado',
    created_at: ago(44),
    updated_at: ago(13),
  }),
  build({
    ...propia('Andrés Ramírez', '595971554208'),
    tipo: 'lote_urbano',
    titulo: 'Lote en Sajonia, Asunción',
    descripcion:
      'Vendo terreno propio en Sajonia, Asunción. Zona tradicional y bien conectada. Apto para vivienda o renta. Documentación lista para escriturar.',
    ubicacion: {
      departamento: 'Asunción',
      ciudad: 'Asunción',
      barrio: 'Sajonia',
      lat: -25.3061,
      lng: -57.6361,
    },
    superficie_m2: 432,
    precio: { monto: 95000, moneda: 'USD' },
    dimensiones: { frente_m: 14.4, fondo_m: 30 },
    esquina: false,
    servicios: S('agua', 'energia', 'desague', 'asfalto', 'internet'),
    estado_titulo: 'con_titulo',
    financiacion: 'contado',
    created_at: ago(17),
    updated_at: ago(17),
  }),

  // ===================== CORDILLERA — San Bernardino =====================
  build({
    ...broker('Verónica Fleitas', 'Lago Azul Propiedades', '595985447781'),
    tipo: 'quinta',
    titulo: 'Quinta a 4 cuadras del lago, San Bernardino',
    descripcion:
      'Quinta de 2.500 m² a cuatro cuadras del Lago Ypacaraí en San Bernardino. Zona de quintas y casas de descanso. Terreno alto con arboleda. Con título.',
    ubicacion: {
      departamento: 'Cordillera',
      ciudad: 'San Bernardino',
      barrio: 'Centro',
      lat: -25.2841,
      lng: -57.3019,
    },
    superficie_m2: 2500,
    precio: { monto: 85000, moneda: 'USD' },
    esquina: false,
    servicios: S('agua', 'energia', 'empedrado', 'internet'),
    estado_titulo: 'con_titulo',
    financiacion: 'contado',
    featured_until: future(50),
    created_at: ago(38),
    updated_at: ago(2),
  }),
  build({
    ...broker('Verónica Fleitas', 'Lago Azul Propiedades', '595985447781'),
    tipo: 'lote_urbano',
    titulo: 'Lote en loteamiento de San Bernardino',
    descripcion:
      'Lote en loteamiento con calles internas y portón de acceso en San Bernardino. A 10 minutos del centro. Financiación en cuotas sin interés.',
    ubicacion: {
      departamento: 'Cordillera',
      ciudad: 'San Bernardino',
      barrio: 'Ypucú',
      lat: -25.2761,
      lng: -57.3122,
    },
    superficie_m2: 480,
    precio: { monto: 33000, moneda: 'USD' },
    dimensiones: { frente_m: 16, fondo_m: 30 },
    esquina: false,
    servicios: S('agua', 'energia', 'empedrado'),
    estado_titulo: 'en_proceso',
    financiacion: 'cuotas',
    created_at: ago(20),
    updated_at: ago(20),
  }),

  // ===================== CORDILLERA — Caacupé / Atyrá =====================
  build({
    ...propia('Mónica Duarte', '595961772009'),
    tipo: 'quinta',
    titulo: 'Quinta con naranjos en Atyrá',
    descripcion:
      'Quinta propia de 8.000 m² con plantación de naranjos en Atyrá, la ciudad más limpia del país. Clima privilegiado, ideal para retiro. Con pozo y energía.',
    ubicacion: {
      departamento: 'Cordillera',
      ciudad: 'Atyrá',
      lat: -25.2641,
      lng: -57.1742,
    },
    superficie_m2: 8000,
    precio: { monto: 52000, moneda: 'USD' },
    esquina: false,
    servicios: S('agua', 'energia'),
    estado_titulo: 'con_titulo',
    financiacion: 'contado',
    created_at: ago(26),
    updated_at: ago(26),
  }),

  // ===================== PARAGUARÍ =====================
  build({
    ...broker('Néstor Acosta', 'Acosta Campos', '595984220715'),
    tipo: 'campo',
    titulo: 'Campo agrícola en Carapeguá',
    descripcion:
      'Campo de 28 hectáreas apto agricultura y ganadería en Carapeguá, Paraguarí. Acceso por camino empedrado, parte con monte y parte despejado. Aguada natural.',
    ubicacion: {
      departamento: 'Paraguarí',
      ciudad: 'Carapeguá',
      lat: -25.7841,
      lng: -57.2361,
      polygon: rect(-25.7841, -57.2361, 0.004, 0.004),
    },
    superficie_m2: 280000,
    precio: { monto: 196000, moneda: 'USD' },
    esquina: false,
    servicios: S('agua', 'energia', 'empedrado'),
    estado_titulo: 'con_titulo',
    financiacion: 'contado',
    created_at: ago(41),
    updated_at: ago(12),
  }),
  build({
    ...broker('Néstor Acosta', 'Acosta Campos', '595984220715'),
    tipo: 'quinta',
    titulo: 'Quinta al pie del cerro en Pirayú',
    descripcion:
      'Quinta de 1 hectárea al pie de los cerros de Pirayú, Paraguarí. Vista panorámica, suelo firme. Ideal proyecto turístico o casa de campo.',
    ubicacion: {
      departamento: 'Paraguarí',
      ciudad: 'Pirayú',
      lat: -25.4612,
      lng: -57.2519,
    },
    superficie_m2: 10000,
    precio: { monto: 45000, moneda: 'USD' },
    esquina: false,
    servicios: S('agua', 'energia', 'empedrado'),
    estado_titulo: 'con_titulo',
    financiacion: 'cuotas',
    created_at: ago(28),
    updated_at: ago(15),
  }),

  // ===================== CAAGUAZÚ =====================
  build({
    ...broker('Gustavo Maidana', 'Maidana Rural', '595985660238'),
    tipo: 'campo',
    titulo: 'Campo ganadero en Coronel Oviedo',
    descripcion:
      'Campo de 60 hectáreas con pasturas implantadas y alambrado perimetral en Coronel Oviedo, Caaguazú. Tajamar, manga y corral. Ideal cría y recría.',
    ubicacion: {
      departamento: 'Caaguazú',
      ciudad: 'Coronel Oviedo',
      lat: -25.4461,
      lng: -56.4402,
      polygon: rect(-25.4461, -56.4402, 0.006, 0.006),
    },
    superficie_m2: 600000,
    precio: { monto: 300000, moneda: 'USD' },
    esquina: false,
    servicios: S('agua', 'energia'),
    estado_titulo: 'con_titulo',
    financiacion: 'contado',
    featured_until: future(35),
    created_at: ago(36),
    updated_at: ago(3),
  }),
  build({
    ...propia('Ramón Cáceres', '595972881400'),
    tipo: 'campo',
    titulo: 'Fracción de campo en Caaguazú',
    descripcion:
      'Vendo fracción propia de 12 hectáreas en Caaguazú, sobre camino de todo tiempo. Apto agricultura familiar. Parte cultivable y parte con monte nativo.',
    ubicacion: {
      departamento: 'Caaguazú',
      ciudad: 'Caaguazú',
      lat: -25.4612,
      lng: -56.0202,
    },
    superficie_m2: 120000,
    precio: { monto: 66000, moneda: 'USD' },
    esquina: false,
    servicios: S('agua'),
    estado_titulo: 'en_proceso',
    financiacion: 'contado',
    created_at: ago(23),
    updated_at: ago(23),
  }),

  // ===================== CONCEPCIÓN =====================
  build({
    ...broker('Gustavo Maidana', 'Maidana Rural', '595985660238'),
    tipo: 'campo',
    titulo: 'Campo ganadero en Horqueta',
    descripcion:
      'Campo de 45 hectáreas en Horqueta, Concepción. Totalmente alambrado, con aguadas y buena pastura. Camino empedrado de acceso. Excelente para ganadería.',
    ubicacion: {
      departamento: 'Concepción',
      ciudad: 'Horqueta',
      lat: -23.3412,
      lng: -57.0602,
      polygon: rect(-23.3412, -57.0602, 0.005, 0.005),
    },
    superficie_m2: 450000,
    precio: { monto: 135000, moneda: 'USD' },
    esquina: false,
    servicios: S('agua', 'energia', 'empedrado'),
    estado_titulo: 'con_titulo',
    financiacion: 'contado',
    created_at: ago(30),
    updated_at: ago(10),
  }),
  build({
    ...broker('Gustavo Maidana', 'Maidana Rural', '595985660238'),
    tipo: 'campo',
    titulo: 'Estancia en Concepción',
    descripcion:
      'Estancia de 200 hectáreas en Concepción, con casco, galpón y aguadas permanentes. Campo mixto apto ganadería y reforestación. Título perfecto.',
    ubicacion: {
      departamento: 'Concepción',
      ciudad: 'Concepción',
      lat: -23.4061,
      lng: -57.4341,
    },
    superficie_m2: 2000000,
    precio: { monto: 700000, moneda: 'USD' },
    esquina: false,
    servicios: S('agua', 'energia'),
    estado_titulo: 'con_titulo',
    financiacion: 'contado',
    created_at: ago(47),
    updated_at: ago(18),
  }),

  // ===================== GUAIRÁ =====================
  build({
    ...propia('Lucía Brítez', '595961447802'),
    tipo: 'lote_urbano',
    titulo: 'Lote en Villarrica centro',
    descripcion:
      'Lote propio a cinco cuadras de la plaza de Villarrica, Guairá. Zona urbana con todos los servicios. Ideal vivienda o comercio. Escritura al día.',
    ubicacion: {
      departamento: 'Guairá',
      ciudad: 'Villarrica',
      barrio: 'Centro',
      lat: -25.7811,
      lng: -56.4441,
    },
    superficie_m2: 420,
    precio: { monto: 28000, moneda: 'USD' },
    dimensiones: { frente_m: 14, fondo_m: 30 },
    esquina: false,
    servicios: S('agua', 'energia', 'desague', 'asfalto', 'internet'),
    estado_titulo: 'con_titulo',
    financiacion: 'contado',
    created_at: ago(13),
    updated_at: ago(13),
  }),

  // ===================== ALTO PARANÁ =====================
  build({
    ...broker('Wilson Closs', 'Este Inmobiliaria', '595983990114'),
    tipo: 'terreno_comercial',
    titulo: 'Esquina comercial Km 7, Ciudad del Este',
    descripcion:
      'Terreno comercial en esquina sobre la zona del Km 7, Ciudad del Este. Altísimo tránsito comercial. Apto local, galería o depósito. Con título.',
    ubicacion: {
      departamento: 'Alto Paraná',
      ciudad: 'Ciudad del Este',
      barrio: 'Km 7',
      lat: -25.5119,
      lng: -54.6361,
    },
    superficie_m2: 800,
    precio: { monto: 190000, moneda: 'USD' },
    dimensiones: { frente_m: 20, fondo_m: 40 },
    esquina: true,
    servicios: S('agua', 'energia', 'desague', 'asfalto', 'internet'),
    estado_titulo: 'con_titulo',
    financiacion: 'cuotas',
    featured_until: future(28),
    created_at: ago(32),
    updated_at: ago(4),
  }),
  build({
    ...broker('Wilson Closs', 'Este Inmobiliaria', '595983990114'),
    tipo: 'lote_urbano',
    titulo: 'Lote residencial en Hernandarias',
    descripcion:
      'Lote en barrio residencial de Hernandarias, Alto Paraná, cerca de la Itaipú. Zona tranquila, calle empedrada. Apto vivienda. Con título.',
    ubicacion: {
      departamento: 'Alto Paraná',
      ciudad: 'Hernandarias',
      barrio: 'San Blas',
      lat: -25.4061,
      lng: -54.6402,
    },
    superficie_m2: 450,
    precio: { monto: 27000, moneda: 'USD' },
    dimensiones: { frente_m: 15, fondo_m: 30 },
    esquina: false,
    servicios: S('agua', 'energia', 'empedrado', 'internet'),
    estado_titulo: 'con_titulo',
    financiacion: 'cuotas',
    created_at: ago(15),
    updated_at: ago(15),
  }),

  // ===================== ITAPÚA =====================
  build({
    ...broker('Mariela Schaerer', 'Sur Propiedades', '595985221903'),
    tipo: 'lote_urbano',
    titulo: 'Lote en zona alta de Encarnación',
    descripcion:
      'Lote en zona alta y residencial de Encarnación, Itapúa, cerca de la circunvalación. Excelente para vivienda. Todos los servicios. Con título.',
    ubicacion: {
      departamento: 'Itapúa',
      ciudad: 'Encarnación',
      barrio: 'San Pedro',
      lat: -27.3261,
      lng: -55.8761,
    },
    superficie_m2: 400,
    precio: { monto: 35000, moneda: 'USD' },
    dimensiones: { frente_m: 13.3, fondo_m: 30 },
    esquina: false,
    servicios: S('agua', 'energia', 'desague', 'asfalto', 'internet'),
    estado_titulo: 'con_titulo',
    financiacion: 'contado',
    created_at: ago(25),
    updated_at: ago(9),
  }),

  // ===================== LOTEAMIENTOS =====================
  build({
    ...broker('Mariela Schaerer', 'Sur Propiedades', '595985221903'),
    tipo: 'loteamiento',
    titulo: 'Loteamiento Cambyretá',
    descripcion:
      'Loteamiento con calles empedradas, energía y agua sobre cada lote en Cambyretá, Encarnación. Lotes desde 300 m². Cuotas accesibles sin interés y sin entrada inicial.',
    ubicacion: {
      departamento: 'Itapúa',
      ciudad: 'Encarnación',
      barrio: 'Cambyretá',
      lat: -27.2841,
      lng: -55.8361,
    },
    superficie_m2: 300,
    precio: { monto: 12900, moneda: 'USD' },
    esquina: false,
    servicios: S('agua', 'energia', 'asfalto'),
    estado_titulo: 'en_proceso',
    financiacion: 'cuotas',
    loteamiento: {
      lotes_total: 120,
      lotes_disponibles: 47,
      precio_desde: 12900,
      cuota_desde: 290,
      moneda: 'USD',
    },
    featured_until: future(60),
    created_at: ago(34),
    updated_at: ago(1),
  }),
  build({
    ...broker('Óscar Vera', 'Vera Negocios Inmobiliarios', '595985330112'),
    tipo: 'loteamiento',
    titulo: 'Loteamiento Las Lomas, Luque',
    descripcion:
      'Nuevo loteamiento Las Lomas en Luque, con portón de acceso, calles empedradas y áreas verdes. Lotes desde 360 m². Plan de cuotas en guaraníes a 60 meses.',
    ubicacion: {
      departamento: 'Central',
      ciudad: 'Luque',
      barrio: 'Loma Merlo',
      lat: -25.2901,
      lng: -57.4761,
    },
    superficie_m2: 360,
    precio: { monto: 18500, moneda: 'USD' },
    esquina: false,
    servicios: S('agua', 'energia', 'empedrado'),
    estado_titulo: 'en_proceso',
    financiacion: 'cuotas',
    loteamiento: {
      lotes_total: 86,
      lotes_disponibles: 31,
      precio_desde: 18500,
      cuota_desde: 350,
      moneda: 'USD',
    },
    created_at: ago(11),
    updated_at: ago(11),
  }),
  build({
    ...broker('Liz Caballero', 'Inmobiliaria Surubi’i', '595991556023'),
    tipo: 'loteamiento',
    titulo: 'Loteamiento Tava’i, Capiatá',
    descripcion:
      'Loteamiento Tava’i en Capiatá, a pasos del Acceso Sur. Lotes desde 300 m² con agua y energía. Ideal primera vivienda. Financiación directa con la desarrolladora.',
    ubicacion: {
      departamento: 'Central',
      ciudad: 'Capiatá',
      barrio: 'Tava’i',
      lat: -25.3601,
      lng: -57.3361,
    },
    superficie_m2: 300,
    precio: { monto: 14500, moneda: 'USD' },
    esquina: false,
    servicios: S('agua', 'energia'),
    estado_titulo: 'en_proceso',
    financiacion: 'cuotas',
    loteamiento: {
      lotes_total: 64,
      lotes_disponibles: 22,
      precio_desde: 14500,
      cuota_desde: 270,
      moneda: 'USD',
    },
    created_at: ago(7),
    updated_at: ago(7),
  }),
  build({
    ...broker('Néstor Acosta', 'Acosta Campos', '595984220715'),
    tipo: 'loteamiento',
    titulo: 'Loteamiento Cerro Verde, Paraguarí',
    descripcion:
      'Loteamiento Cerro Verde en Paraguarí, con vista a los cerros y calles internas. Lotes amplios desde 450 m². Cuotas en guaraníes accesibles a largo plazo.',
    ubicacion: {
      departamento: 'Paraguarí',
      ciudad: 'Paraguarí',
      barrio: 'Cerro Verde',
      lat: -25.6312,
      lng: -57.1461,
    },
    superficie_m2: 450,
    precio: { monto: 9900, moneda: 'USD' },
    esquina: false,
    servicios: S('agua', 'energia'),
    estado_titulo: 'en_proceso',
    financiacion: 'cuotas',
    loteamiento: {
      lotes_total: 95,
      lotes_disponibles: 58,
      precio_desde: 9900,
      cuota_desde: 190,
      moneda: 'USD',
    },
    created_at: ago(6),
    updated_at: ago(6),
  }),

  // ===================== extra lotes for depth =====================
  build({
    ...broker('Hugo Páez', 'Páez Propiedades', '595981772390'),
    tipo: 'lote_urbano',
    titulo: 'Lote en San Antonio, Central',
    descripcion:
      'Lote sobre calle empedrada en San Antonio, Central, cerca de la costanera. Zona tranquila en crecimiento. Apto vivienda. Con título individual.',
    ubicacion: {
      departamento: 'Central',
      ciudad: 'San Antonio',
      barrio: 'San Roque',
      lat: -25.4061,
      lng: -57.5602,
    },
    superficie_m2: 360,
    precio: { monto: 23000, moneda: 'USD' },
    dimensiones: { frente_m: 12, fondo_m: 30 },
    esquina: false,
    servicios: S('agua', 'energia', 'empedrado'),
    estado_titulo: 'con_titulo',
    financiacion: 'cuotas',
    created_at: ago(5),
    updated_at: ago(5),
  }),
  build({
    ...propia('Fátima Rojas', '595971009662'),
    tipo: 'lote_urbano',
    titulo: 'Lote en Capiatá zona escolar',
    descripcion:
      'Vendo lote propio en Capiatá, frente a zona escolar, calle empedrada. Ideal para vivienda familiar. Acepto financiación parcial. Título en regla.',
    ubicacion: {
      departamento: 'Central',
      ciudad: 'Capiatá',
      barrio: 'Mbocayaty',
      lat: -25.3501,
      lng: -57.3502,
    },
    superficie_m2: 330,
    precio: { monto: 19500, moneda: 'USD' },
    dimensiones: { frente_m: 11, fondo_m: 30 },
    esquina: false,
    servicios: S('agua', 'energia'),
    estado_titulo: 'con_titulo',
    financiacion: 'cuotas',
    created_at: ago(4),
    updated_at: ago(4),
  }),
  build({
    ...broker('Verónica Fleitas', 'Lago Azul Propiedades', '595985447781'),
    tipo: 'quinta',
    titulo: 'Quinta en Caacupé',
    descripcion:
      'Quinta de 4.000 m² en Caacupé, Cordillera, con arboleda y arroyo cercano. Clima fresco, ideal casa de descanso. Acceso por camino empedrado. Con título.',
    ubicacion: {
      departamento: 'Cordillera',
      ciudad: 'Caacupé',
      lat: -25.3861,
      lng: -57.1402,
    },
    superficie_m2: 4000,
    precio: { monto: 42000, moneda: 'USD' },
    esquina: false,
    servicios: S('agua', 'energia', 'empedrado'),
    estado_titulo: 'con_titulo',
    financiacion: 'contado',
    created_at: ago(3),
    updated_at: ago(3),
  }),
  build({
    ...broker('Patricia Núñez', 'Núñez & Asociados', '595983114567'),
    tipo: 'terreno_comercial',
    titulo: 'Terreno comercial en Capiatá sobre ruta',
    descripcion:
      'Terreno comercial con frente sobre la Ruta 1 en Capiatá. Apto estación, depósito o local de gran porte. Servicios completos. Con título.',
    ubicacion: {
      departamento: 'Central',
      ciudad: 'Capiatá',
      barrio: 'Ruta 1',
      lat: -25.3461,
      lng: -57.3361,
    },
    superficie_m2: 1500,
    precio: { monto: 180000, moneda: 'USD' },
    dimensiones: { frente_m: 30, fondo_m: 50 },
    esquina: false,
    servicios: S('agua', 'energia', 'desague', 'asfalto', 'internet'),
    estado_titulo: 'con_titulo',
    financiacion: 'contado',
    created_at: ago(39),
    updated_at: ago(16),
  }),
  build({
    ...broker('Rodrigo Ayala', 'Capital Urbano', '595981009934'),
    tipo: 'lote_urbano',
    titulo: 'Lote en Las Mercedes, Asunción',
    descripcion:
      'Lote en el barrio Las Mercedes, Asunción, zona residencial de alto nivel. Apto vivienda o renta. Todos los servicios y excelente conexión. Con título.',
    ubicacion: {
      departamento: 'Asunción',
      ciudad: 'Asunción',
      barrio: 'Las Mercedes',
      lat: -25.2961,
      lng: -57.5961,
    },
    superficie_m2: 500,
    precio: { monto: 145000, moneda: 'USD' },
    dimensiones: { frente_m: 16.6, fondo_m: 30 },
    esquina: false,
    servicios: S('agua', 'energia', 'desague', 'asfalto', 'internet'),
    estado_titulo: 'con_titulo',
    financiacion: 'contado',
    created_at: ago(42),
    updated_at: ago(13),
  }),
  build({
    ...propia('Cristian López', '595972330988'),
    tipo: 'lote_urbano',
    titulo: 'Lote en Ñemby sobre empedrado',
    descripcion:
      'Vendo lote propio en Ñemby sobre calle empedrada, zona residencial tranquila. Apto construir de inmediato. Documentación al día. Recibo vehículo en parte de pago.',
    ubicacion: {
      departamento: 'Central',
      ciudad: 'Ñemby',
      barrio: 'Taywa Roga',
      lat: -25.4001,
      lng: -57.5402,
    },
    superficie_m2: 312,
    precio: { monto: 22000, moneda: 'USD' },
    dimensiones: { frente_m: 12, fondo_m: 26 },
    esquina: false,
    servicios: S('agua', 'energia', 'empedrado'),
    estado_titulo: 'con_titulo',
    financiacion: 'contado',
    created_at: ago(2),
    updated_at: ago(2),
  }),
  build({
    ...broker('Mariela Schaerer', 'Sur Propiedades', '595985221903'),
    tipo: 'campo',
    titulo: 'Campo agrícola en Itapúa',
    descripcion:
      'Campo de 35 hectáreas apto agricultura mecanizada en zona de Itapúa. Suelo de primera, totalmente cultivable. Camino de todo tiempo. Con título.',
    ubicacion: {
      departamento: 'Itapúa',
      ciudad: 'Encarnación',
      lat: -27.2461,
      lng: -55.7961,
      polygon: rect(-27.2461, -55.7961, 0.004, 0.005),
    },
    superficie_m2: 350000,
    precio: { monto: 245000, moneda: 'USD' },
    esquina: false,
    servicios: S('agua', 'energia'),
    estado_titulo: 'con_titulo',
    financiacion: 'contado',
    created_at: ago(37),
    updated_at: ago(12),
  }),
  build({
    ...broker('Carla Giménez', 'Tierra Firme Inmobiliaria', '595981445120'),
    tipo: 'lote_urbano',
    titulo: 'Lote en Mariano Roque Alonso centro',
    descripcion:
      'Lote a cuatro cuadras del centro de Mariano Roque Alonso, calle asfaltada. Apto vivienda o comercio chico. Servicios completos. Con título.',
    ubicacion: {
      departamento: 'Central',
      ciudad: 'Mariano Roque Alonso',
      barrio: 'Centro',
      lat: -25.2061,
      lng: -57.5302,
    },
    superficie_m2: 384,
    precio: { monto: 34000, moneda: 'USD' },
    dimensiones: { frente_m: 12, fondo_m: 32 },
    esquina: false,
    servicios: S('agua', 'energia', 'desague', 'asfalto', 'internet'),
    estado_titulo: 'con_titulo',
    financiacion: 'contado',
    created_at: ago(1),
    updated_at: ago(1),
  }),
];
