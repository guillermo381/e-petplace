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
  /** Ya subido — el registro NUNCA sube: son dos pasos por diseño. */
  archivoUrl: string;
  tipo: 'foto' | 'clip';
  duracionS?: number;
  /** 🔴 LAS N ETIQUETAS. Mínimo 1: sin etiquetas rebota `media_sin_etiquetas`.
   *  Cada una recibe su evento apuntando al MISMO archivo. */
  mascotaIds: string[];
  /** El día de la estadía, local del lugar (`YYYY-MM-DD`). */
  fecha: string;
}

/**
 * `publicarMedia` del contrato §②: crea la media, sus N etiquetas y sus N
 * eventos **en una sola transacción**.
 *
 * ⚠️ Lo que la app NO puede asumir y por eso la cola igual reintenta: el
 * contrato no declara idempotencia por `archivo_url`. **Se pidió** (era el
 * requisito ① de mi pedido D→A) y hasta que esté escrita, un reintento tras un
 * timeout ambiguo podría duplicar eventos. *Está anotado, no supuesto.*
 */
export type PublicarMedia = (
  entrada: EntradaPublicarMedia,
) => Promise<
  | { ok: true; mediaId: string; eventoIds: string[] }
  | { ok: false; codigo: string; mensaje: string }
>;

/**
 * El aviso, después de publicar.
 *
 * 🔴 **LA AGRUPACIÓN NO VIVE ACÁ, y la mesa lo ratificó** (contrato §④bis):
 * dos teléfonos subiendo media del mismo animal no coordinan un digest entre
 * ellos — *cada aparato sabe lo que él subió y nada más*, así que agrupar en el
 * cliente produce «1 foto nueva» tres veces, que es el «una push por foto» que
 * la firma prohíbe. **Agrupa el servidor.** La app solo declara el hecho.
 */
export type AvisarMediaPublicada = (aviso: {
  fecha: string;
  mascotaIds: string[];
  tipo: 'foto' | 'clip';
}) => Promise<void>;

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
  /** null = todavía no existe. El aviso NO frena la publicación: la media ya
   *  está en el hilo del dueño. */
  avisar?: AvisarMediaPublicada | null;
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
        archivoUrl: storagePath,
        tipo: item.tipo,
        duracionS: item.duracionS,
        mascotaIds: item.mascotaIds,
        fecha: item.fecha,
      });

      if (!r.ok) {
        return {
          ok: false as const,
          causa: (esErrorDeRed(r.mensaje) ? 'red' : 'registro') as CausaFalla,
          mensaje: `${r.codigo}: ${r.mensaje}`,
        };
      }

      // El aviso va DESPUÉS y no puede tumbar la publicación: si falla, la
      // media ya está en el hilo del dueño y el ítem no debe volver a la cola
      // (volvería a registrar, y eso sí duplicaría). Se registra y se sigue.
      if (deps.avisar) {
        try {
          await deps.avisar({ fecha: item.fecha, mascotaIds: item.mascotaIds, tipo: item.tipo });
        } catch (e) {
          console.error(`[motor-media] el aviso falló y NO frena la publicación · ${String(e)}`);
        }
      }

      return { ok: true as const };
    },
  };
}
