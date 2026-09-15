/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DE QUÉ OFICIO ES ESTE SERVICIO — **un solo lugar** (S116-C · lote 5)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * `glifoDeOficio` traduce oficio → glifo. Esto traduce **el vocabulario del
 * MOTOR → oficio**, que es el paso anterior y no existía.
 *
 * ── POR QUÉ NO ALCANZA CON `esOficio(categoria)`, medido ────────────────────
 * Las ocho categorías vivas de `tipos_servicio` son:
 *
 *   adiestramiento · emergencia · grooming · hospedaje · otro · paseo ·
 *   telemedicina · veterinario
 *
 * y **dos no coinciden con el vocabulario de la casa**:
 *
 *   ① `veterinario` (motor) ≠ `veterinaria` (oficio). *Una letra, y
 *      `esOficio('veterinario')` devuelve `false`* ⇒ sin este mapa, la clínica
 *      no aparecería en su propia grilla y nadie vería un error.
 *
 *   ② 🔴 **`hospedaje` es AMBIGUA a nivel categoría: adentro conviven
 *      guardería y hotel** (`guarderia_dia`, `guarderia_mensual`, `hotel`,
 *      `hotel_dia`, `hotel_noche`). *Son DOS oficios distintos —la letra lo
 *      dice: «la noche NO es guardería: es hotel, y es otro servicio con su
 *      propia letra»— y decidirlo por la categoría los fusionaría.* ⇒ **acá se
 *      decide por el CÓDIGO**, que es donde el motor sí los separa.
 *
 * ── LO QUE DEVUELVE `null`, y es una respuesta ──────────────────────────────
 * `emergencia` y `otro` **no son oficios de vitrina**: la emergencia no se
 * agenda (`reservable=false`) y `otro` es el cajón del motor. *Devolver un
 * oficio genérico para ellos los pondría en la grilla prometiendo algo que no
 * se puede tocar.*
 */

import { esOficio, type Oficio } from '@epetplace/ui';

/** Lo mínimo que hace falta para decidir: el código y su categoría — las dos
 *  columnas que `ServicioPublico` ya trae. */
export interface ServicioClasificable {
  tipo: string;
  categoria: string | null;
}

/** El oficio de un servicio, o `null` si no es de vitrina. */
export function oficioDeServicio(s: ServicioClasificable): Oficio | null {
  /* ① El caso ambiguo PRIMERO: si se dejara al final, `hospedaje` caería en el
     `esOficio` de abajo —que lo rechaza— y guardería desaparecería. */
  if (s.categoria === 'hospedaje') {
    if (s.tipo.startsWith('guarderia')) return 'guarderia';
    if (s.tipo.startsWith('hotel')) return 'hotel';
    return null;
  }
  /* ② La letra que no coincide. Se escribe como caso y no como `replace`:
     *un arreglo de cadena acertaría acá y volvería a fallar con el próximo.* */
  if (s.categoria === 'veterinario') return 'veterinaria';
  /* ③ El resto coincide, y `esOficio` lo VERIFICA en vez de asumirlo — es el
     guard que la casa ya escribió para este borde. */
  if (s.categoria !== null && esOficio(s.categoria)) return s.categoria;
  return null;
}

/**
 * La distancia en km entre dos puntos. **Vive acá y no en la pantalla** porque
 * la va a necesitar cada superficie que liste negocios.
 *
 * ⚠️ **Es la distancia a la ZONA, no a la puerta** — `v_prestadores_publicos`
 * entrega un centro desplazado estable por id (S84, que cerró la fuga de la
 * coordenada exacta). *Redondear a un decimal no es cosmético: decir «a 1,23
 * km» de un punto deliberadamente aproximado afirmaría una precisión que el
 * dato no tiene.*
 */
export function distanciaKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
