/**
 * guarderia-cableado.ts — DONDE EL MÓDULO DEJA DE ESTAR INERTE (S107-D).
 *
 * Las piezas de D nacieron con sus dependencias **inyectadas en `null`** (molde
 * S91): la cola guardaba y lo decía (`motor_no_cableado`) mientras el motor de
 * A no existía. Acá se enchufan — **en un solo archivo, a propósito**: el día
 * que una firma del motor cambie, el compilador lo dice en un lugar y no en
 * cinco.
 *
 * ── VERIFICADO CONTRA EL OBJETO ANTES DE ENCHUFAR (29-ago) ───────────────
 * No contra el contrato escrito ni contra el wrapper, sino contra la función
 * viva (`pg_get_function_arguments` + el cuerpo):
 *
 *  ✅ `guarderia_media` con `UNIQUE (prestador_id, clave_idempotencia)` y
 *     `publicar_media_guarderia` **devolviendo `ya_existia`** — el reintento es
 *     un ÉXITO, que es lo que esta cola necesitaba para no distinguir «falló»
 *     de «ya estaba» con un timeout ambiguo.
 *  ✅ `guarderia_tramo_punto` con **PK `tramo_id`** y `registrar_punto_vivo`
 *     **con `ON CONFLICT`** — o sea **UPSERT: pisa, no acumula**. *Con `INSERT`
 *     la traza volvía por la puerta de atrás y toda la cura del escritor se
 *     perdía.* El pedido entró tal cual.
 *  ✅ `guarderia_actas` con `UNIQUE (estadia_id, direccion)` y
 *     `levantar_acta_guarderia` devolviendo `ya_existia`.
 *  🔴 **El productor del digest NO existe**: `cat_notificacion_tipos` tiene
 *     **0 filas en categoría `resumen`** (medido dos veces, con main mergeado).
 *     ⇒ `avisar` **sigue en `null`, y esa es la decisión correcta**: ver abajo.
 */

import {
  publicarMediaGuarderia,
  levantarActaGuarderia,
  registrarPuntoVivo,
} from '@epetplace/api';
import type { PublicarMedia, AvisarMediaPublicada } from './motor-media';
import type { LevantarActa } from './cola-actas';
import type { EmitirPunto } from './use-punto-vivo';

/**
 * ① y ② · La media. `claveIdempotencia` viaja desde la cola —nace antes del
 * primer intento y se reusa—, y `ya_existia` se traduce a éxito.
 *
 * ⚠️ **Traducción declarada:** el motor ancla por **`capturadaEn`** (instante),
 * no por `fecha` (día) como decía el contrato escrito. La cola ya guarda el
 * instante de captura, así que no hay dato que inventar — *pero conviene
 * saberlo: el día de la estadía lo deriva el servidor del instante, y eso lo
 * vuelve dueño del huso horario, que es donde debe vivir.*
 */
export function cablearPublicarMedia(prestadorId: string): PublicarMedia {
  return async (entrada) => {
    const r = await publicarMediaGuarderia({
      prestadorId,
      claveIdempotencia: entrada.claveIdempotencia,
      tipo: entrada.tipo,
      archivoUrl: entrada.archivoUrl,
      duracionS: entrada.duracionS ?? null,
      mascotaIds: entrada.mascotaIds,
      capturadaEn: entrada.capturadaEn,
    });
    if (!r.ok) return { ok: false, codigo: r.codigo, mensaje: r.mensaje };
    return { ok: true, mediaId: r.data.mediaId, eventoIds: [], ya_existia: r.data.yaExistia };
  };
}

/**
 * ③ · El acta. `claveIdempotencia` = el id local del acta, que **ya cumple la
 * regla**: nace con el acta, antes del primer intento, y se reusa en cada
 * reintento.
 */
export function cablearLevantarActa(): LevantarActa {
  return async (entrada) => {
    const r = await levantarActaGuarderia({
      estadiaId: entrada.estadiaId,
      direccion: entrada.direccion,
      carnetVerificado: entrada.carnetVerificado,
      objetos: entrada.objetos,
      observaciones: entrada.observaciones,
      cerradaEn: entrada.levantadaEn,
      claveIdempotencia: entrada.claveIdempotencia,
    });
    if (!r.ok) return { ok: false, codigo: r.codigo, mensaje: r.mensaje };
    return { ok: true, actaId: r.data.actaId, ya_existia: r.data.yaExistia };
  };
}

/**
 * ④ · El punto vivo. `lat/lng` → `lat/lon`: **el motor dice `lon`**, y se
 * traduce acá y no en el hook — *el nombre del campo del servidor no tiene por
 * qué subir hasta el hook que mira el GPS.*
 *
 * 🔴 El escritor es **UPSERT sobre `tramo_id`** (verificado): cada punto pisa
 * al anterior y **no queda traza**. Es la mitad del escritor de la regla de
 * privacidad; la otra —que el lector devuelva un punto y nunca una lista— la
 * cumple `obtener_punto_vivo`.
 */
export function cablearEmitirPunto(): EmitirPunto {
  return async (tramoId, punto) => {
    const r = await registrarPuntoVivo({
      tramoId,
      lat: punto.lat,
      lon: punto.lng,
      vistoEn: new Date(punto.t).toISOString(),
    });
    if (!r.ok) throw new Error(`${r.codigo}: ${r.mensaje}`);
  };
}

/**
 * ⑤ · El aviso — 🔴 **SIGUE EN `null`, Y NO POR OLVIDO.**
 *
 * Medido: **cero tipos en la categoría `resumen`** del catálogo de
 * notificaciones. El molde existe desde el día uno (nació para el volumen de
 * despensa) y **nunca tuvo productor**.
 *
 * **Por qué no se cablea igual «para que algo salga»:** sin el tipo de digest,
 * el único camino disponible sería mandar la media por `operacion` — que es
 * **una push por foto** (lo que la firma prohíbe) **y** consumir el techo de
 * `20/24 h` que necesitan las de tramo y acta, silenciando en el camino el
 * aviso de que el animal llegó a casa. *La opción «que salga algo» no es más
 * pobre que esperar: es peor que no avisar.*
 *
 * ⇒ Queda `null`. La cola publica igual —el aviso **nunca** frena la
 * publicación— y el dueño ve la media en el hilo cuando abre la app.
 */
export const AVISAR_MEDIA: AvisarMediaPublicada | null = null;
