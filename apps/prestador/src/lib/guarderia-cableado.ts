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
  ✅ **El productor del digest ya vive** — tipo `guarderia_media_resumen`, cron
 *     cada 15 min, y **4 cuentas sembradas en `in_app`** (la ① firmada, sin la
 *     cual el aviso no le habría llegado a nadie **en silencio**).
 *     ⇒ `avisar` **no se cableó: se RETIRÓ** — la app no tiene puerta ni debe
 *     tenerla. Ver la lápida al pie.
 */

import {
  publicarMediaGuarderia,
  levantarActaGuarderia,
  marcarABordo,
  marcarEntregada,
  registrarPuntoVivo,
} from '@epetplace/api';
import type { PublicarMedia } from './motor-media';
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
/* ⚠️ **SIN CONSUMIDOR DESDE S110-C — medido, no supuesto** (0 importadores
   reales; el censo por texto daba 1 porque contaba una mención en un
   comentario: `L-170` en vivo).

   **No se borra, y la razón no es cortesía:** levanta el acta **sin mover el
   estado**, y ése es el camino correcto el día que haya que registrar un acta
   que NO es un acto del día — una corrección, o un acta de un tramo que ya
   cerró. Su reemplazo (`cablearActoUnico`) hace las dos cosas juntas a
   propósito, y para eso no sirve.

   ☠️ **Disparo de muerte:** si al cerrar el frente de guardería sigue sin
   consumidor y la mesa no abrió el caso del acta-sin-acto, se retira. */
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
 * ⑤ · **EL ACTO ÚNICO POR LA COLA** — el que hace que el sin-señal exista (S110-C).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **POR QUÉ NACE, y es un defecto que casi entrego:** al llegar el motor de
 * S110-A cableé `marcarABordo` **directo desde la pantalla**, y con eso perdí
 * el camino que la cola existía para dar. *Con el teléfono sin señal en la
 * puerta de una casa, la llamada falla y el acta no se levanta* — y el
 * recorrido del founder dice, literal: **«Si no hay señal, la hoja baja igual y
 * me lo dice»**.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * La cura no fue volver atrás al acta sola: **es que la cola reproduzca EL
 * ACTO**, no el acta. Y se pudo porque las dos piezas encajan sin forzar nada:
 *
 * · `LevantarActa` ya lleva **`levantadaEn`** —la hora de la puerta, sellada al
 *   crear el acta local— y **`claveIdempotencia`**;
 * · `marcarABordo`/`marcarEntregada` reciben **`ocurridoEn`** y
 *   **`claveIdempotencia`**, y **la idempotencia es por (estadía, ACTO)**, así
 *   que *un reintento tarde devuelve el original con su hora en vez de
 *   rebotar* — incluso si la estadía ya avanzó.
 *
 * ⇒ **El acta se levanta en la puerta con su hora, y el ACTO ENTERO —acta más
 * estado— viaja solo cuando hay señal, sin duplicar y sin mentir el reloj.**
 * *Las dos mitades que parecían excluyentes eran la misma pieza vista de dos
 * lados.*
 *
 * ⚠️ **Consecuencia declarada, y no es menor:** el estado del día **no se mueve
 * hasta que el acto viaja**. Con señal es inmediato; sin señal, el animal
 * figura en su casa hasta que haya. *Es la verdad y no un retraso disimulado:
 * el motor no puede saber lo que todavía no le contaron.* La alternativa
 * —mover el estado local y sincronizar después— es la que produce dos verdades
 * sobre dónde está un animal, y ésa no se toma sin firma.
 */
export function cablearActoUnico(): LevantarActa {
  return async (entrada) => {
    const payload = {
      carnetVerificado: entrada.carnetVerificado,
      objetos: entrada.objetos,
      observaciones: entrada.observaciones,
      /* `levantadaEn` ES la hora de la puerta: nace en el aparato al crear el
         acta local, no al viajar. El servidor no la pisa y guarda la suya
         aparte para auditar. */
      ocurridoEn: entrada.levantadaEn,
      claveIdempotencia: entrada.claveIdempotencia,
    };
    const r =
      entrada.direccion === 'recogida'
        ? await marcarABordo(entrada.estadiaId, payload)
        : await marcarEntregada(entrada.estadiaId, payload);
    if (!r.ok) return { ok: false, codigo: r.codigo, mensaje: r.mensaje };
    /* `actaYaExistia` y no `yaEstaba`: la cola pregunta por SU acta —si ya
       viajó, deja de reintentarla—, no por el estado de la estadía. Son dos
       hechos distintos y el motor los devuelve separados a propósito. */
    return { ok: true, actaId: r.data.actaId, ya_existia: r.data.actaYaExistia };
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

/* ☠️ ── EL QUINTO PUNTO NO SE CABLEÓ: SE RETIRÓ ──────────────────────────
   `avisar` era el único que quedaba en `null`, y la orden era cablearlo.
   **La medición dijo otra cosa, y se siguió la medición:**

   · `encolar_resumen_media_guarderia()` — **sin argumentos**, DEFINER,
     disparada por el **cron `resumen-media-guarderia` cada 15 min**;
   · `20260829190000_s107a_digest_acl` **REVOCÓ `authenticated`** de ella.

   ⇒ **No hay puerta desde la app, y es deliberado.** Cablear algo acá exigiría
   pedir que se abra lo que A cerró a propósito — y para nada: el cron ya ve la
   media de TODOS los aparatos, que es justo lo que un teléfono no puede.

   **Las dos reglas que la mesa marcó, respetadas por CONSTRUCCIÓN y no por
   cuidado:** el aviso no dice el número y diez fotos son un aviso — **porque
   esta app no compone ninguna voz ni cuenta nada**. Lo hacen el encolado y el
   dedup por (mascota, día). *La forma más segura de no escribir «3 fotos» es
   no tener dónde escribirlo.*

   ✅ Y la razón por la que el retiro es seguro: **la publicación nunca dependió
   del aviso.** El motor publica y termina; el dueño ve la media en el hilo al
   abrir, y el push llega por su cuenta cuando el cron pasa.
   ── FIN DE LA LÁPIDA ─────────────────────────────────────────────────── */
