/**
 * motor-media.ts — EL MOTOR DE SUBIDA DE LA COLA (S107-D).
 *
 * Es la implementación concreta de `MotorDeSubida`: el paso 1 (bytes a
 * Storage) es **real y completo**; el paso 2 (registrar la media con sus N
 * etiquetas) y el aviso **entran inyectados**, porque son de la pista A.
 *
 * ── POR QUÉ EL PASO 1 SE PUEDE HACER HOY Y EL 2 NO ───────────────────────
 * Subir bytes a un bucket privado con path `{prestador_id}/…` ya está resuelto
 * y probado desde S44 (`subir-evidencia.ts`) — las policies validan el primer
 * segmento del path con `split_part`, así que la forma del path **no es
 * cosmética**. Registrar UNA media contra N animales, en cambio, **no existe**:
 * `evento_archivo_adjunto.evento_padre_id` es NOT NULL y fuerza una fila por
 * animal (medido: 4 filas, 4 paths, **0 compartidos** en toda la base). Ese es
 * el pedido D→A ①, y hasta que exista este motor **no publica: guarda.**
 *
 * ── EL CONTRATO DE A, ESCRITO COMO TIPO Y NO COMO PROSA ──────────────────
 * `RegistrarMediaEtiquetada` de abajo **es** el pedido, en la forma en que la
 * app lo va a consumir. Un contrato en un tipo lo verifica el compilador el día
 * que se cablea; un contrato en un párrafo no lo verifica nadie.
 */

import { leerBytes } from '@epetplace/ui';
import { getClient } from '@epetplace/api';
import type { CausaFalla, ItemMedia, MotorDeSubida } from './cola-media';

/** iOS graba .mov; Android, .mp4. El MIME dice la verdad del archivo — los
 *  tres los admite el bucket de video (relevado de la migración de S63). */
function tipoDeClip(uri: string): { ext: string; mime: string } {
  return /\.mov$/i.test(uri) ? { ext: 'mov', mime: 'video/quicktime' } : { ext: 'mp4', mime: 'video/mp4' };
}

function esErrorDeRed(mensaje: string): boolean {
  return /network|failed to fetch|fetch failed|timeout/i.test(mensaje);
}

// ══════════════════ EL CONTRATO DE A, YA PUBLICADO ═════════════════════════
// `docs/contratos/s107-contrato-media-durante.md` (28-ago). Lo que estaba acá
// era MI propuesta escrita como tipo; ahora existe la oficial y **manda la de
// A**. Diferencias que importan y por las que esto se reescribió en vez de
// convivir: el contrato guarda `archivo_url` (no bucket+path por separado) y
// ancla por **`fecha`** — el `estadia_id` de cada etiqueta lo resuelve el
// SERVIDOR por (mascota, fecha), que es más angosto que mandárselo desde acá.
// *Dos contratos para la misma puerta es peor que uno equivocado: cualquiera
// cita el que le conviene.*

// El techo del clip vive en `cola-media.ts`, en la PUERTA. Acá no se
// redeclara: dos constantes con el mismo nombre y distinto dueño es cómo se
// desincronizan los topes.

export interface EntradaPublicarMedia {
  /** 🔴 Obligatoria en la firma, y por eso no la olvida nadie: *una
   *  idempotencia opcional la olvida el primer consumidor apurado, y el modo
   *  de falla es silencioso.* La genera la cola antes del primer intento. */
  claveIdempotencia: string;
  /** Ya subido — el registro NUNCA sube: son dos pasos por diseño. */
  archivoUrl: string;
  tipo: 'foto' | 'clip';
  duracionS?: number;
  /** 🔴 LAS N ETIQUETAS. Mínimo 1: sin etiquetas rebota `media_sin_etiquetas`.
   *  Cada una recibe su evento apuntando al MISMO archivo. */
  mascotaIds: string[];
  /**
   * 🔴 EL INSTANTE de la captura (ISO), no el día.
   *
   * Corregido al cablear: el contrato escrito decía `fecha` y **la función viva
   * pide `p_capturada_en timestamptz`**. La diferencia no es cosmética — **el
   * día lo deriva el servidor del instante**, y eso lo vuelve dueño del huso
   * horario, que es donde tiene que vivir. *Lo cazó el compilador en el
   * cableado, que es exactamente para lo que ese archivo existe.*
   */
  capturadaEn: string;
}

/**
 * `publicarMedia` del contrato §②: crea la media, sus N etiquetas y sus N
 * eventos **en una sola transacción**.
 *
 * ✅ **Idempotente, y adoptado en el contrato** (corrección de D, 28-ago): el
 * segundo intento **no rebota — devuelve la media que ya existe** con
 * `ya_existia: true`. Eso es lo que la cola necesitaba: *un reintento que
 * rebota obliga a distinguir «falló» de «ya estaba», y esa distinción es justo
 * la que no se puede hacer con un timeout ambiguo.*
 */
export type PublicarMedia = (
  entrada: EntradaPublicarMedia,
) => Promise<
  | { ok: true; mediaId: string; eventoIds: string[]; ya_existia?: boolean }
  | { ok: false; codigo: string; mensaje: string }
>;

/* ☠️ ── AQUÍ VIVIÓ `AvisarMediaPublicada`, Y MURIÓ AL MEDIR SU PUERTA ──────
   Este módulo tuvo un quinto punto de inyección: un `avisar` que la app
   llamaba al publicar, para que el dueño se enterara.

   **Medido el 29-ago, contra el objeto:** el productor del digest existe
   (`encolar_resumen_media_guarderia`), **no recibe argumentos**, lo corre un
   **cron cada 15 minutos** agrupando por (mascota, día) — y la migración
   `20260829190000_s107a_digest_acl` **REVOCÓ `authenticated`** de esa función,
   a propósito.

   ⇒ **La app no tiene puerta, y no debe tenerla.** El disparo desde el cliente
   no es que esté cerrado por ahora: **sobra**. Y sobra por la razón que este
   mismo módulo venía escribiendo desde el censo — *dos teléfonos subiendo media
   del mismo animal no pueden coordinar un digest entre ellos; agrupa el
   servidor o no agrupa nadie*. **El servidor agrupa.** El cron ve la media de
   todos los aparatos; esta app solo ve la suya.

   ☠️ Se retira en vez de dejarse en `null`: *un puente que sobrevive a su río
   manda al próximo a construir otro* (`L-395`). Quien busque acá el aviso, que
   lo busque en el cron.
   ── FIN DE LA LÁPIDA ─────────────────────────────────────────────────── */

export interface DepsMotorMedia {
  prestadorId: string;
  /** Buckets vigentes; los define A. Hoy los del paseo/adiestramiento sirven
   *  de molde y la forma del path es la misma. */
  bucketFoto: string;
  bucketClip: string;
  /** null = el wrapper todavía no existe (contrato publicado, migración y
   *  `publicarMedia` **aún no**: medido el 28-ago — cero migraciones
   *  `guarderia_media`, cero wrappers). La cola guarda y lo dice. */
  publicar: PublicarMedia | null;
}

// ══════════════════ EL MOTOR ═══════════════════════════════════════════════

export function crearMotorMedia(deps: DepsMotorMedia): MotorDeSubida {
  return {
    async subir(item: ItemMedia) {
      const esClip = item.tipo === 'clip';
      const { ext, mime } = esClip ? tipoDeClip(item.uri) : { ext: 'jpg', mime: 'image/jpeg' };
      const bucket = esClip ? deps.bucketClip : deps.bucketFoto;
      // El primer segmento es el prestador: lo exigen las policies de storage
      // (`split_part`) y el RPC de registro. No es organización: es el permiso.
      const path = `${deps.prestadorId}/guarderia-${item.tipo}-${item.id}.${ext}`;

      let bytes: ArrayBuffer;
      try {
        bytes = await leerBytes(item.uri);
      } catch (e) {
        const lit = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
        console.error(`[motor-media] LECTURA falló · uri=${item.uri.slice(0, 80)} · ${lit}`);
        return { ok: false as const, causa: 'lectura' as CausaFalla, mensaje: lit };
      }

      // `upsert: false`: si el path ya existe, el reintento NO pisa el objeto.
      // El path lleva el id local del ítem, así que reintentar el MISMO ítem
      // colisiona a propósito — y esa colisión se lee como "ya está subido".
      const { error } = await getClient()
        .storage.from(bucket)
        .upload(path, bytes, { contentType: mime, upsert: false });

      if (error) {
        const yaEstaba = /exists|duplicate/i.test(error.message);
        if (yaEstaba) {
          console.log(`[motor-media] el objeto ya estaba subido · ${path} — se sigue al registro`);
          return { ok: true as const, storagePath: path, bytes: bytes.byteLength };
        }
        console.error(`[motor-media] SUBIDA falló · bucket=${bucket} · ${error.message}`);
        return {
          ok: false as const,
          causa: (esErrorDeRed(error.message) ? 'red' : 'servidor') as CausaFalla,
          mensaje: error.message,
        };
      }

      return { ok: true as const, storagePath: path, bytes: bytes.byteLength };
    },

    async registrar(item: ItemMedia, storagePath: string) {
      if (!deps.publicar) {
        // INERTE y declarado: la media queda guardada y la pantalla puede
        // decir la verdad sin inventar una falla de red que no ocurrió.
        return {
          ok: false as const,
          causa: 'motor_no_cableado' as CausaFalla,
          mensaje: 'publicarMedia todavía no existe (contrato §② publicado, wrapper pendiente)',
        };
      }

      const r = await deps.publicar({
        claveIdempotencia: item.claveIdempotencia,
        archivoUrl: storagePath,
        tipo: item.tipo,
        duracionS: item.duracionS,
        mascotaIds: item.mascotaIds,
        // El instante REAL de la captura, no el de la subida: entre los dos
        // puede haber horas sin señal, y el hilo del dueño ordena por cuándo
        // pasó, no por cuándo llegó.
        capturadaEn: new Date(item.creadoEn).toISOString(),
      });

      if (!r.ok) {
        return {
          ok: false as const,
          causa: (esErrorDeRed(r.mensaje) ? 'red' : 'registro') as CausaFalla,
          mensaje: `${r.codigo}: ${r.mensaje}`,
        };
      }

      return { ok: true as const, mediaId: r.mediaId };
    },
  };
}
