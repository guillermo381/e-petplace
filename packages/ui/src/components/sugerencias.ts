/**
 * EL TIPEO PREDICTIVO — la FORMA, una sola vez (S91-B, insumo de D).
 *
 * De dónde sale: el patrón vivía INLINE en `hogar/bitacora.tsx` desde S65,
 * probado en dispositivo y con su gate del founder pasado. El alta de
 * mascota (lámina S91) necesita lo mismo para la RAZA. La orden fue
 * explícita y es la de §6 del método: **se generaliza, no se clona.**
 *
 * ── QUÉ SE COMPARTE Y QUÉ NO ─────────────────────────────────────────
 * Se comparte el MATCHING (cómo se decide qué se parece a lo tecleado).
 * NO se comparte la voz ni el render: la bitácora propone chips que se
 * marcan de a muchos; el alta propone UNA raza que llena un campo. Son
 * dos interacciones distintas sobre el mismo matcher, y por eso la
 * frontera está acá y no en un componente — un componente habría sido
 * el de la bitácora, y D habría tenido que construir el suyo igual.
 *
 * ── POR QUÉ EN `ui` Y NO EN `domain`, con su precedente ──────────────
 * `MapaRecorrido.filtro.ts` documenta la mudanza inversa: el filtro del
 * track SUBIÓ a `@epetplace/domain` porque su cálculo tenía un consumidor
 * FUERA de la UI (Vitales) y dibujo y cálculo no podían divergir. Acá los
 * dos consumidores son pantallas y no hay regla de negocio: esto es una
 * afordancia de entrada de texto, no una verdad del dominio.
 * **El criterio de mudanza queda escrito para no re-discutirlo: el día
 * que un consumidor NO-UI necesite este matching, sube a `domain` y este
 * archivo queda de frontera** — exactamente como hizo su vecino.
 *
 * ── LOS DOS PERILLAS, Y CADA UNA TIENE SU CASO MEDIDO ────────────────
 * Los defaults son los de la bitácora, así que su comportamiento no
 * cambia por generalizarse (brazo 2 del fixture).
 *
 * · `minimoDeLetras` (default 4) — la bitácora matchea FRASES («cuando
 *   salimos lloró»), donde 4 filtra las palabras de relleno. Un catálogo
 *   de NOMBRES no puede usar 4: «lab» son tres letras y es como se busca
 *   «Labrador». Con el default, D no habría podido usar esto.
 * · `modo` (default 'contiene') — bajar el mínimo sin cambiar el modo
 *   sería peor que no bajarlo: con 'contiene', «lab» matchea cualquier
 *   voz que lleve esas letras en el medio. `'empieza'` exige que la
 *   palabra tecleada sea PREFIJO de alguna palabra de la voz, que es
 *   como se busca un nombre. **Las dos perillas se mueven juntas.**
 */

export type ModoDeCoincidencia = 'contiene' | 'empieza';

/** Los defaults SON los de la bitácora: generalizar no cambia su conducta. */
const MINIMO_POR_DEFECTO = 4;
const TOPE_POR_DEFECTO = 4;

export interface MatchingDeTexto {
  /** Largo mínimo de una palabra tecleada para que cuente. Default 4. */
  minimoDeLetras?: number;
  /** Cómo se compara contra la voz del ítem. Default 'contiene'. */
  modo?: ModoDeCoincidencia;
}

interface ConCorpus<T> extends MatchingDeTexto {
  /** Lo que el usuario tecleó. */
  texto: string;
  /** La voz del ítem EN EL IDIOMA ACTIVO — la pone la casa, no esta pieza. */
  vozDe: (item: T) => string;
}

/**
 * Minúsculas y sin acentos. `ñ` cae a `n` por la misma vía (su NFD es
 * `n` + tilde combinante, que entra en el rango que se borra) — así
 * «Pastor alemán» se encuentra tecleando sin tildes, que es como se
 * teclea en un teléfono.
 */
export function normalizarVoz(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Las palabras útiles de lo tecleado, ya normalizadas. */
export function palabrasDeBusqueda(s: string, opciones: MatchingDeTexto = {}): string[] {
  const minimo = opciones.minimoDeLetras ?? MINIMO_POR_DEFECTO;
  return normalizarVoz(s)
    .split(/[^a-z0-9]+/)
    .filter((p) => p.length >= minimo);
}

/** Las palabras de la VOZ se parten sin mínimo: una voz de tres letras
 *  tiene que seguir siendo alcanzable por un prefijo de tres. */
function palabrasDeLaVoz(vozNormalizada: string): string[] {
  return vozNormalizada.split(/[^a-z0-9]+/).filter((p) => p.length > 0);
}

/** Cuántas de las palabras tecleadas aparecen en esta voz. El PUNTAJE es
 *  el conteo, no un booleano: una palabra común («cuando») no puede
 *  desplazar a la coincidencia específica dentro del tope. */
export function puntajeDeCoincidencia(
  voz: string,
  palabras: readonly string[],
  opciones: MatchingDeTexto = {},
): number {
  const modo = opciones.modo ?? 'contiene';
  const vozNorm = normalizarVoz(voz);
  if (modo === 'contiene') {
    return palabras.filter((p) => vozNorm.includes(p)).length;
  }
  const deLaVoz = palabrasDeLaVoz(vozNorm);
  return palabras.filter((p) => deLaVoz.some((w) => w.startsWith(p))).length;
}

/**
 * LAS SUGERENCIAS — los mejores `tope` ítems para lo tecleado.
 *
 * Sin palabras útiles devuelve VACÍO (no propone el catálogo entero: una
 * lista que aparece sola no es una sugerencia, es ruido). El orden es por
 * puntaje descendente y el empate conserva el orden del corpus — el sort
 * de JS es estable desde ES2019 y acá eso es contrato, no casualidad.
 */
export function sugerir<T>(
  items: readonly T[],
  opciones: ConCorpus<T> & { tope?: number },
): T[] {
  const palabras = palabrasDeBusqueda(opciones.texto, opciones);
  if (palabras.length === 0) return [];
  return items
    .map((item) => ({ item, puntaje: puntajeDeCoincidencia(opciones.vozDe(item), palabras, opciones) }))
    .filter((s) => s.puntaje > 0)
    .sort((a, b) => b.puntaje - a.puntaje)
    .slice(0, opciones.tope ?? TOPE_POR_DEFECTO)
    .map((s) => s.item);
}

/**
 * MOSTRAR PRIMERO, JAMÁS ESCONDER — las coincidencias suben al frente y
 * el resto sigue abajo, alcanzable. Es la letra del filtro de la bitácora
 * (S65→S81) y vale para todo catálogo que el usuario ya conoce de vista:
 * esconder lo que no matchea castiga al que se equivocó de palabra.
 *
 * Sin texto útil, o sin ninguna coincidencia, devuelve la lista TAL CUAL
 * (los dos casos dan el mismo resultado a propósito: un filtro que no
 * encontró nada no debe vaciar la pantalla).
 */
export function coincidenciasPrimero<T>(items: readonly T[], opciones: ConCorpus<T>): T[] {
  const palabras = palabrasDeBusqueda(opciones.texto, opciones);
  if (palabras.length === 0) return [...items];
  const con = items.filter((i) => puntajeDeCoincidencia(opciones.vozDe(i), palabras, opciones) > 0);
  if (con.length === 0) return [...items];
  return [...con, ...items.filter((i) => !con.includes(i))];
}
