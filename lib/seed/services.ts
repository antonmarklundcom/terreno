import type { ServiceCategoria, ServiceProvider } from '@/lib/types';

/**
 * Seed directory for /servicios. Partner providers per category. Build 1 keeps
 * a small curated set; later this can come from the backend behind the repo.
 */

export interface ServiceCategoryInfo {
  categoria: ServiceCategoria;
  titulo: string;
  explicacion: string;
  cuando: string;
}

export const SERVICE_CATEGORIES: ServiceCategoryInfo[] = [
  {
    categoria: 'tasador',
    titulo: 'Tasación de mercado',
    explicacion:
      'Un tasador determina el valor real de un terreno cruzando superficie, ubicación, servicios y ventas recientes de la zona. Te da un número defendible para comprar, vender o garantizar un crédito.',
    cuando:
      'Antes de poner un precio de venta, al negociar una compra o cuando un banco lo exige.',
  },
  {
    categoria: 'escribano',
    titulo: 'Revisión de título y escrituración',
    explicacion:
      'El escribano (notario) verifica el estado de dominio, redacta la escritura pública y la inscribe en Registros Públicos. Es quien da seguridad jurídica a la operación.',
    cuando:
      'Antes de señar, para revisar el dominio; y al cerrar, para escriturar a tu nombre.',
  },
  {
    categoria: 'agrimensor',
    titulo: 'Agrimensura de límites',
    explicacion:
      'El agrimensor mide el terreno, confirma frente, fondo y mojones, y verifica que el polígono real coincida con la cédula catastral. Entrega un plano de mensura firmado.',
    cuando:
      'Antes de comprar un lote o campo, al fraccionar o ante un conflicto de límites.',
  },
];

export const SEED_SERVICES: ServiceProvider[] = [
  {
    id: 's-001',
    nombre: 'Estudio Vera & Asociados',
    categoria: 'tasador',
    descripcion:
      'Tasaciones de lotes urbanos y campos en todo el Departamento Central y Cordillera. Informe con respaldo de datos de zona en 48 h.',
    zona: 'Central · Cordillera',
    telefono_wa: '595981445120',
  },
  {
    id: 's-002',
    nombre: 'Tasaciones del Sur',
    categoria: 'tasador',
    descripcion:
      'Valuación de campos agrícolas y ganaderos en Itapúa, Alto Paraná y Caaguazú. Especialistas en suelo y aptitud productiva.',
    zona: 'Itapúa · Alto Paraná',
    telefono_wa: '595985221903',
  },
  {
    id: 's-003',
    nombre: 'Escribanía Núñez',
    categoria: 'escribano',
    descripcion:
      'Revisión de condiciones de dominio, estudio de títulos y escrituración de inmuebles. Atención en Asunción y Gran Asunción.',
    zona: 'Asunción · Central',
    telefono_wa: '595983114567',
  },
  {
    id: 's-004',
    nombre: 'Notaría Schaerer',
    categoria: 'escribano',
    descripcion:
      'Escrituración de lotes y loteamientos, transferencias y constitución de garantías en Encarnación y zona sur.',
    zona: 'Itapúa',
    telefono_wa: '595985221903',
  },
  {
    id: 's-005',
    nombre: 'Agrimensura Acosta',
    categoria: 'agrimensor',
    descripcion:
      'Mensuras, fraccionamientos y replanteo de mojones para lotes y campos. Planos aptos para Catastro y Registros Públicos.',
    zona: 'Paraguarí · Central',
    telefono_wa: '595984220715',
  },
  {
    id: 's-006',
    nombre: 'Geomensura Este',
    categoria: 'agrimensor',
    descripcion:
      'Agrimensura de campos y lotes en Alto Paraná y Canindeyú. Medición con GPS de precisión y entrega de polígono georreferenciado.',
    zona: 'Alto Paraná',
    telefono_wa: '595983990114',
  },
];
