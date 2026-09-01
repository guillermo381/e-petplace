/**
 * EL VIAJE ABIERTO — lo que sobrevive a cerrar la app (S110-C).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DEL RECORRIDO: *«Si cierro y abro la app a mitad del viaje, el viaje sigue
 * donde estaba. No me pide empezar de nuevo.»*
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **Qué guarda, y por qué tan poco:** el `tramoId` y su dirección. **Nada más.**
 * Los conteos —cuántos a bordo, cuántos faltan— **no se guardan: se derivan del
 * roster** que el motor devuelve.
 *
 * 🔴 *Un contador guardado acá sería una segunda verdad sobre cuántos animales
 * subieron, y la primera ya la tiene el servidor.* El día que las dos
 * divergieran —una subida que falló, un reintento tarde— la pantalla mostraría
 * la copia y el motor tendría la otra. **Ninguna pantalla declara un estado por
 * su cuenta:** acá eso se cumple no guardándolo.
 *
 * ── POR QUÉ EL VIAJE ES LOCAL Y EL TRAMO ES DEL SERVIDOR ────────────────
 * El tramo **ya vive en el motor** (`abrir_tramo_guarderia`, idempotente por
 * `(prestador, fecha, dirección)`). Esto no lo duplica: guarda **cuál de los
 * tramos abiertos está siguiendo ESTE teléfono**, que es lo único que el
 * servidor no puede saber. *Si mañana se pierde este archivo, el tramo sigue
 * abierto y se vuelve a atar pidiéndolo de nuevo — `yaExistia: true` con el
 * mismo id.* Perder esto cuesta un toque, no un dato.
 *
 * ── LA REGLA DEL DÍA, y no es prolijidad ────────────────────────────────
 * 🔴 **Un viaje de ayer no se sigue hoy.** Si la fecha guardada no es la de
 * hoy, `leerViaje` devuelve `null` y lo borra. *Un cuidador que abre la app a
 * la mañana con el viaje de ayer colgado marcaría «llegamos» sobre animales que
 * ya volvieron a su casa* — y el motor lo rebotaría por transición ilegal, pero
 * recién después de que la pantalla se lo ofreciera. **La puerta no ofrece lo
 * que va a rechazar** (Ley 23).
 */

import { almacenActual, enFila } from './almacen';

const CLAVE = 'epp.viaje_guarderia.v1';

export type DireccionViaje = 'recogida' | 'devolucion';

export interface ViajeAbierto {
  /** El tramo del motor. Sin esto no hay punto vivo ni actos que atar. */
  tramoId: string;
  direccion: DireccionViaje;
  /** `YYYY-MM-DD` local del lugar. Su día — ver la regla del día. */
  fecha: string;
  prestadorId: string;
  /** Cuándo se abrió, en el aparato. Sólo para el forense. */
  abiertoEn: number;
}

function esViaje(x: unknown): x is ViajeAbierto {
  if (typeof x !== 'object' || x === null) return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.tramoId === 'string' &&
    (r.direccion === 'recogida' || r.direccion === 'devolucion') &&
    typeof r.fecha === 'string' &&
    typeof r.prestadorId === 'string'
  );
}

/**
 * El viaje que este teléfono está siguiendo, o `null`.
 *
 * ⚠️ **`hoy` entra por parámetro y no se calcula acá.** La pantalla ya tiene su
 * fecha local —`toISOString()` en Guayaquil devuelve el día siguiente pasadas
 * las 19:00— y **dos formas de saber qué día es se contradicen en el peor
 * momento**: justo a la tarde, que es cuando se devuelven los animales.
 */
export async function leerViaje(hoy: string): Promise<ViajeAbierto | null> {
  try {
    const a = almacenActual();
    if (a === null) return null;
    const txt = await a.getItem(CLAVE);
    /* `''` es el borrado: la interfaz `Almacen` sólo tiene `getItem`/`setItem`,
       así que borrar es escribir vacío. Se atrapa ACÁ y no en el `catch` —
       `JSON.parse('')` lanza, y un log de error sobre un borrado normal
       envenena el forense: la próxima vez que alguien lea esos errores
       buscando una falla real, encuentra ruido que él mismo produjo. */
    if (txt === null || txt === '') return null;
    const dato: unknown = JSON.parse(txt);
    if (!esViaje(dato)) {
      await borrarViaje();
      return null;
    }
    /* La regla del día: un viaje de ayer no se sigue hoy. */
    if (dato.fecha !== hoy) {
      await borrarViaje();
      return null;
    }
    return dato;
  } catch (e) {
    /* Un almacén ilegible no puede frenar la jornada: se reporta y se sigue sin
       viaje, que es el estado del que siempre se puede salir con un toque. */
    console.error(`[viaje-guarderia] LECTURA falló · ${String(e)}`);
    return null;
  }
}

export async function guardarViaje(v: ViajeAbierto): Promise<void> {
  const a = almacenActual();
  if (a === null) throw new Error('viaje-guarderia: sin almacén — el viaje no quedó guardado');
  await enFila(async () => {
    await a.setItem(CLAVE, JSON.stringify(v));
  });
}

export async function borrarViaje(): Promise<void> {
  const a = almacenActual();
  if (a === null) return;
  await enFila(async () => {
    await a.setItem(CLAVE, '');
  });
}
