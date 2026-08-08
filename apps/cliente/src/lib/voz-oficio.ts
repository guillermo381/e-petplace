/**
 * LA VOZ DE OFICIO — de la categoría del motor a la palabra de la familia
 * (S91-C, firma del founder: «la voz de servicios es tuya»).
 *
 * ── POR QUÉ ESTO EXISTE Y NO ES UN `switch` EN LA PANTALLA ──────────────
 * La vista pública devuelve CÓDIGOS (`veterinario`, `paseo`…). Ley 3: el
 * código de motor no se pinta jamás. Y la traducción vive en UN lugar
 * porque va a tener DOS consumidores el mismo día —el preview de la fila y
 * la ficha completa—: dos pantallas armando la misma frase no divergen el
 * primer día, divergen el mes que viene, y el que divergió no se entera.
 * (Es el argumento con el que `FichaPrestador` se negó a recibir la
 * etiqueta de cohorte ya compuesta.)
 *
 * ── LA REGLA, QUE ES ESPEJO DEL PRESTADOR Y NO UNA INVENCIÓN ────────────
 * `emergencia` y `telemedicina` son CATEGORÍAS PROPIAS en `tipos_servicio`,
 * pero el espejo del prestador las muestra como **Veterinaria** (su lector
 * es `obtenerMundoVeterinariaPropio`, que agrupa por `es_medico`). Mapear
 * por categoría a secas diría «Emergencia» y «Telemedicina» como oficios
 * sueltos donde el prestador ve «Veterinaria» — y las dos fichas dejarían
 * de ser idénticas, que es lo único que la firma pide.
 *
 * El canon ya lo había cazado una vez, en S69, con estas palabras: *«el día
 * clínico se compone por `es_medico = true`, JAMÁS por categoría — filtrar
 * por categoría perdía telemedicina/urgencias»*. Acá se cumple lo mismo con
 * la forma que la vista pública sí entrega.
 *
 * ── LO QUE NO TIENE VOZ, NO HABLA ──────────────────────────────────────
 * `hospedaje` y `otro` NO tienen oficio en las cuatro que el prestador
 * muestra. Devuelven `null` y la superficie los OMITE — jamás el código
 * crudo. Un oficio sin voz es silencio honesto, no `«otro»` en pantalla.
 */

import type { ServicioPublico } from '@epetplace/api';

/** Las claves de voz que YA existen en la casa (`hogar.rail*`) — no nacen
 *  cuatro keys nuevas con los mismos literales: eso sería clonar la voz y
 *  dejar dos lugares donde cambiarla. */
type ClaveVoz = 'hogar.railPaseos' | 'hogar.railEstetica' | 'hogar.railAdiestramiento' | 'hogar.railVet';

/**
 * EXHAUSTIVO POR CONSTRUCCIÓN sobre las categorías VIVAS de
 * `tipos_servicio` (medidas contra la DB, 8-ago-2026: adiestramiento ·
 * emergencia · grooming · hospedaje · otro · paseo · telemedicina ·
 * veterinario).
 *
 * ⚠️ Una categoría NUEVA cae en el `undefined` del `Record` y sale MUDA, no
 * cruda — que es el fallo correcto. El día que nazca la quinta familia, su
 * voz se decide acá y en ningún otro lado.
 */
const VOZ_POR_CATEGORIA: Record<string, ClaveVoz | null> = {
  paseo: 'hogar.railPaseos',
  grooming: 'hogar.railEstetica',
  adiestramiento: 'hogar.railAdiestramiento',
  // Las TRES clínicas caen en la misma voz — ver la regla de arriba.
  veterinario: 'hogar.railVet',
  emergencia: 'hogar.railVet',
  telemedicina: 'hogar.railVet',
  // Sin voz en las cuatro del prestador: silencio, jamás el código.
  hospedaje: null,
  otro: null,
};

/** El ORDEN es fijo y no depende de lo que el negocio tenga cargado: si se
 *  ordenara por presencia, la misma ficha cambiaría de forma al activar un
 *  oficio. Es el criterio literal del espejo. */
const ORDEN: readonly ClaveVoz[] = [
  'hogar.railPaseos',
  'hogar.railEstetica',
  'hogar.railAdiestramiento',
  'hogar.railVet',
];

/**
 * Las voces de oficio de un negocio, sin repetir y en orden fijo.
 * `traducir` es el `t` del consumidor — la voz vive en el diccionario, no
 * acá (Ley 3: esta pieza decide QUÉ oficio, jamás cómo se dice).
 */
export function vozDeOficios(
  servicios: readonly ServicioPublico[],
  traducir: (clave: ClaveVoz) => string,
): string[] {
  const presentes = new Set<ClaveVoz>();
  for (const s of servicios) {
    if (s.categoria === null) continue;
    const clave = VOZ_POR_CATEGORIA[s.categoria];
    if (clave) presentes.add(clave);
  }
  return ORDEN.filter((c) => presentes.has(c)).map(traducir);
}

/**
 * El «desde» del preview: el precio MÁS BAJO entre los servicios con
 * precio. Null si ninguno lo tiene — y ahí la superficie omite la línea en
 * vez de decir «desde $0», que sería una oferta que no existe.
 */
export function precioDesde(servicios: readonly ServicioPublico[]): number | null {
  const precios = servicios
    .map((s) => s.precio)
    .filter((p): p is number => typeof p === 'number' && p > 0);
  return precios.length === 0 ? null : Math.min(...precios);
}
