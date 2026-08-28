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

// ══════════════════ EL CONTRATO QUE ESPERA A LA PISTA A ════════════════════

export interface EntradaRegistroMedia {
  /** Ya subido. El registro NUNCA sube: son dos pasos por diseño. */
  storagePath: string;
  bucket: string;
  mimeType: string;
  tamanoBytes: number;
  tipo: 'foto' | 'clip';
  duracionSegundos?: number;
  /** El día. El servidor valida el conjunto contra SU roster — no la app. */
  estadiaId: string;
  /** 🔴 LAS N ETIQUETAS. Mínimo 1. Cada una recibe su evento apuntando al
   *  MISMO objeto de storage: un byte, N lecturas. */
  mascotaIds: string[];
}

/**
 * Lo que la app necesita de A. Requisitos duros, en el orden en que importan:
 *  1. **Idempotente por `storagePath`** — el reintento de la cola no puede
 *     duplicar eventos, y la cola reintenta por diseño.
 *  2. **Valida el conjunto contra el roster del día** — una mascota ajena
 *     rebota TIPADA, jamás pasa.
 *  3. Devuelve los ids creados, para que la pantalla pueda confirmar sin
 *     re-preguntar.
 */
export type RegistrarMediaEtiquetada = (
  entrada: EntradaRegistroMedia,
) => Promise<
  | { ok: true; mediaId: string; eventoIds: string[] }
  | { ok: false; codigo: string; mensaje: string }
>;

/**
 * El aviso, después de publicar.
 *
 * 🔴 **LA AGRUPACIÓN NO PUEDE VIVIR ACÁ, y la razón es estructural, no una
 * preferencia:** dos cuidadores subiendo fotos del mismo animal desde dos
 * teléfonos no pueden coordinar un digest local, y un tercero que abre la app
 * más tarde tampoco. **Agrupa el servidor o no agrupa nadie.** La app solo
 * declara el hecho; el reparto firmado por la mesa (media → `resumen`
 * agrupada; tramo y acta → operativas e inmediatas, sin competir por el techo)
 * lo aplica el motor de A.
 */
export type AvisarMediaPublicada = (aviso: {
  estadiaId: string;
  mascotaIds: string[];
  tipo: 'foto' | 'clip';
}) => Promise<void>;

export interface DepsMotorMedia {
  prestadorId: string;
  /** Buckets vigentes; los define A. Hoy los del paseo/adiestramiento sirven
   *  de molde y la forma del path es la misma. */
  bucketFoto: string;
  bucketClip: string;
  /** null = todavía no existe (pedido D→A ①). La cola guarda y lo dice. */
  registrar: RegistrarMediaEtiquetada | null;
  /** null = todavía no existe (pedido D→A ③). El aviso NO frena la
   *  publicación: la media ya está en el hilo del dueño. */
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
      if (!deps.registrar) {
        // INERTE y declarado: la media queda guardada y la pantalla puede
        // decir la verdad sin inventar una falla de red que no ocurrió.
        return {
          ok: false as const,
          causa: 'motor_no_cableado' as CausaFalla,
          mensaje: 'el registro de media etiquetada todavía no existe (pedido D→A ①)',
        };
      }

      const esClip = item.tipo === 'clip';
      const r = await deps.registrar({
        storagePath,
        bucket: esClip ? deps.bucketClip : deps.bucketFoto,
        mimeType: esClip ? tipoDeClip(item.uri).mime : 'image/jpeg',
        tamanoBytes: item.bytes ?? 0,
        tipo: item.tipo,
        duracionSegundos: item.duracionS,
        estadiaId: item.estadiaId,
        mascotaIds: item.mascotaIds,
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
          await deps.avisar({ estadiaId: item.estadiaId, mascotaIds: item.mascotaIds, tipo: item.tipo });
        } catch (e) {
          console.error(`[motor-media] el aviso falló y NO frena la publicación · ${String(e)}`);
        }
      }

      return { ok: true as const };
    },
  };
}
