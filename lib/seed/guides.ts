import type { GuideArticle } from '@/lib/types';

/**
 * Seed content for /guias. Build 1 ships typed article objects; a later phase
 * can swap these for MDX or CMS-driven content behind the same shape.
 */
export const SEED_GUIDES: GuideArticle[] = [
  {
    slug: 'como-verificar-titulo-terreno-paraguay',
    titulo: 'Cómo verificar el título de un terreno en Paraguay',
    resumen:
      'Antes de señar un terreno conviene confirmar quién es el propietario y que el inmueble no tenga deudas ni litigios. Te explicamos los tres documentos clave.',
    fecha: 'jun 2026',
    lectura_min: 6,
    categoria: 'Títulos',
    cuerpo: [
      {
        tipo: 'parrafo',
        texto:
          'Antes de señar un terreno conviene confirmar que quien vende es realmente el propietario y que el inmueble no tiene deudas ni litigios. En Paraguay esto se hace con tres documentos básicos y una visita a la zona.',
      },
      { tipo: 'subtitulo', texto: 'Los tres documentos clave' },
      {
        tipo: 'lista',
        items: [
          'Certificado de Condiciones de Dominio — emitido por la Dirección de Registros Públicos; muestra el titular actual y si hay hipotecas o embargos.',
          'Cédula del inmueble — la identificación catastral del Servicio Nacional de Catastro, con la superficie oficial.',
          'Última transferencia — la escritura por la cual el vendedor adquirió el lote, pasada por escribanía.',
        ],
      },
      {
        tipo: 'cita',
        texto:
          'Si el vendedor sólo ofrece un “contrato privado” sin escritura ni datos de registro, frená la operación hasta verificar el dominio.',
      },
      { tipo: 'subtitulo', texto: 'Confirmá los límites en el terreno' },
      {
        tipo: 'parrafo',
        texto:
          'La superficie del título no siempre coincide con lo que se ve. Un agrimensor mide frente, fondo y mojones, y confirma que el polígono real corresponde a la cédula catastral antes de firmar.',
      },
    ],
  },
  {
    slug: 'invertir-en-tierra-paraguay-guia-2026',
    titulo: 'Invertir en tierra en Paraguay: guía 2026',
    resumen:
      'Por qué la tierra sigue siendo una de las inversiones más sólidas del país, qué zonas crecen más rápido y cómo entrar sin sorpresas.',
    fecha: 'jun 2026',
    lectura_min: 8,
    categoria: 'Inversión',
    cuerpo: [
      {
        tipo: 'parrafo',
        texto:
          'La tierra en Paraguay se cotiza en dólares y, a diferencia de otros activos, no se devalúa con la inflación local. En los corredores de crecimiento del Departamento Central y en zonas turísticas como la Cordillera, los lotes con título suben de valor año a año.',
      },
      { tipo: 'subtitulo', texto: 'Dónde está creciendo la demanda' },
      {
        tipo: 'lista',
        items: [
          'Corredor norte de Central: Mariano Roque Alonso, Limpio y Luque, empujados por nuevas avenidas y el aeropuerto.',
          'Zona de lagos: San Bernardino y Areguá, con fuerte demanda de quintas.',
          'Itapúa y Alto Paraná, por el movimiento comercial y la conexión regional.',
        ],
      },
      { tipo: 'subtitulo', texto: 'Cómo entrar con el pie derecho' },
      {
        tipo: 'parrafo',
        texto:
          'Comprá siempre con título verificado, confirmá los límites con un agrimensor y compará el precio por metro cuadrado con otros lotes de la misma zona. Un buen precio/m² es la mejor señal de una inversión sana.',
      },
      {
        tipo: 'cita',
        texto:
          'La regla de oro: nunca pagues el total antes de tener la escritura y la medición en mano.',
      },
    ],
  },
  {
    slug: 'que-hace-un-agrimensor',
    titulo: '¿Qué hace un agrimensor y cuándo lo necesitás?',
    resumen:
      'El agrimensor es quien confirma que el terreno que comprás es exactamente el que figura en el título. Cuándo conviene llamarlo y qué te entrega.',
    fecha: 'may 2026',
    lectura_min: 5,
    categoria: 'Servicios',
    cuerpo: [
      {
        tipo: 'parrafo',
        texto:
          'El agrimensor es el profesional habilitado para medir un inmueble y confirmar que sus límites, frente y superficie coinciden con la cédula catastral y el título. Sin esa verificación, podés estar comprando metros que no existen.',
      },
      { tipo: 'subtitulo', texto: 'Cuándo conviene contratarlo' },
      {
        tipo: 'lista',
        items: [
          'Antes de comprar un lote o campo, para confirmar la superficie real.',
          'Cuando querés dividir o unificar terrenos (fraccionamiento).',
          'Si hay dudas sobre los mojones o un conflicto de límites con un vecino.',
        ],
      },
      {
        tipo: 'parrafo',
        texto:
          'El resultado es un plano de mensura firmado, que sirve para escriturar y para inscribir cualquier cambio en Catastro y Registros Públicos.',
      },
    ],
  },
  {
    slug: 'comprar-lote-en-cuotas-paraguay',
    titulo: 'Comprar un lote en cuotas: lo que hay que saber',
    resumen:
      'Los loteamientos ofrecen entrada baja y cuotas en guaraníes, pero conviene leer la letra chica. Qué revisar antes de firmar el contrato.',
    fecha: 'may 2026',
    lectura_min: 6,
    categoria: 'Financiación',
    cuerpo: [
      {
        tipo: 'parrafo',
        texto:
          'Los loteamientos hicieron accesible la compra de tierra: con poca entrada y cuotas mensuales en guaraníes, muchas familias acceden a su primer lote. Pero el modelo tiene particularidades que conviene entender.',
      },
      { tipo: 'subtitulo', texto: 'Qué revisar antes de firmar' },
      {
        tipo: 'lista',
        items: [
          'En qué momento se transfiere el título: la mayoría escritura recién al terminar de pagar.',
          'Si la cuota es fija o se ajusta, y qué pasa si te atrasás.',
          'El estado de los servicios prometidos (agua, energía, empedrado) y los plazos de obra.',
        ],
      },
      {
        tipo: 'cita',
        texto:
          'Pedí siempre el contrato por escrito y confirmá que el loteamiento esté aprobado por la municipalidad.',
      },
      {
        tipo: 'parrafo',
        texto:
          'Bien elegido, un loteamiento es una puerta de entrada razonable. La clave está en comparar el precio/m² final contra lotes con título inmediato de la misma zona.',
      },
    ],
  },
  {
    slug: 'campos-en-paraguay-ganaderia-vs-agricultura',
    titulo: 'Campos en Paraguay: ganadería vs. agricultura',
    resumen:
      'No todos los campos sirven para lo mismo. Cómo leer el suelo, el acceso y las mejoras para saber si un campo es ganadero o agrícola.',
    fecha: 'abr 2026',
    lectura_min: 7,
    categoria: 'Campos',
    cuerpo: [
      {
        tipo: 'parrafo',
        texto:
          'Cuando se compra un campo, el precio por hectárea depende casi totalmente de su aptitud: un campo agrícola de suelo profundo vale mucho más que un campo ganadero de la misma extensión. Saber distinguirlos evita pagar de más o esperar rindes que no llegan.',
      },
      { tipo: 'subtitulo', texto: 'Señales de un campo agrícola' },
      {
        tipo: 'lista',
        items: [
          'Suelo profundo y bien drenado, sin afloramientos rocosos.',
          'Topografía plana o de lomadas suaves, apta para maquinaria.',
          'Cercanía a silos, acopios y caminos de todo tiempo.',
        ],
      },
      { tipo: 'subtitulo', texto: 'Qué mirar en un campo ganadero' },
      {
        tipo: 'parrafo',
        texto:
          'Para ganadería importan las aguadas permanentes, la calidad de la pastura, el alambrado perimetral y las mejoras como mangas, corrales y tajamares. Un campo con buenas mejoras se valoriza y produce desde el primer día.',
      },
    ],
  },
  {
    slug: 'precio-por-metro-cuadrado-como-comparar',
    titulo: 'Precio por m²: la forma correcta de comparar terrenos',
    resumen:
      'Dos lotes con el mismo precio pueden ser muy distintos. Por qué el precio/m² es la métrica que iguala la cancha y cómo usarla.',
    fecha: 'abr 2026',
    lectura_min: 4,
    categoria: 'Inversión',
    cuerpo: [
      {
        tipo: 'parrafo',
        texto:
          'El precio total de un terreno dice poco por sí solo. Lo que realmente permite comparar es el precio por metro cuadrado: dividir el precio entre la superficie pone a todos los lotes en la misma escala.',
      },
      { tipo: 'subtitulo', texto: 'Cómo se calcula' },
      {
        tipo: 'parrafo',
        texto:
          'Es simple: precio dividido superficie. Un lote de US$ 28.500 y 360 m² cuesta US$ 79/m². En terreno.com.py mostramos este número en cada publicación, justamente para que puedas comparar de un vistazo.',
      },
      {
        tipo: 'cita',
        texto:
          'En campos se usa el precio por hectárea; el principio es el mismo: igualar la cancha antes de comparar.',
      },
      {
        tipo: 'parrafo',
        texto:
          'Una vez que tenés el precio/m² de varias opciones, las diferencias de ubicación, servicios y estado de título explican por qué uno vale más que otro.',
      },
    ],
  },
];
