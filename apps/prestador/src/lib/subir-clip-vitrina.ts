/**
 * EL CLIP DE LA VITRINA (S84-A6) — **el tercer consumidor de la frontera**
 * (`subir-imagen.ts`), junto al logo y a la galería.
 *
 * ⚠️ NO CONFUNDIR CON `subir-clip.ts`, que ya existía (S63): ése es el
 * clip de **adiestramiento** —bucket `adiestramiento-clips`, privado,
 * 50 MB, registrado por RPC porque sin registro es invisible para el
 * dueño—. **Otro dominio, otro bucket, otro paso 2.** Por eso este
 * archivo nace con nombre propio en vez de ensanchar aquél: son dos
 * cosas que se parecen y no son la misma.
 *
 * UNO SOLO por negocio, y por eso es COLUMNA y no tabla (`clip_url`).
 * Vive en el mismo bucket que las fotos (`prestador-galeria`), que nació
 * aceptando `video/mp4` y `video/quicktime` con techo de 10 MB — el único
 * clip real medido en la casa pesa 6.7 MB.
 *
 * ── ⚠️ LOS ≤30 s NO SE VALIDAN ACÁ, Y SE DICE EN VEZ DE FINGIRLO ─────
 * La letra fija el clip en **≤30 s** (coincide con el precedente vivo de
 * adiestramiento, S63: techo duro 3×30 s). **Esta capa no puede
 * comprobarlo:** la duración no está en los magic numbers y **no se
 * deduce del tamaño** —un clip de 30 s en alta calidad pesa más que uno
 * de dos minutos comprimido—; leer la metadata de un MP4 exige el módulo
 * de video, que **no viaja en este OTA** (es build nativa, va con D-617).
 *
 * **Lo que SÍ acota hoy es el TECHO DE BYTES**, que es un límite real
 * aunque no sea el de la letra. *Prometer una validación de duración que
 * no existe sería peor que declarar el hueco* — es el verosímil-falso de
 * L-139. Cuando el módulo llegue, el guard entra acá y esta nota muere.
 *
 * ── EL BORRADO SÍ BORRA BYTES ────────────────────────────────────────
 * A diferencia del logo (que es identidad, y cuyo bucket ni siquiera
 * tiene policy de DELETE — D-616), el clip vive en `prestador-galeria`,
 * que nació con las cuatro policies. Un clip que el prestador reemplazó o
 * quitó **no es identidad: es material que él sacó**, y se va de verdad.
 */

import { actualizarPerfilPrestador, obtenerMiPrestador } from '@epetplace/api';
import { subirArchivo, borrarBytes, type CausaSubida } from './subir-imagen';

const BUCKET = 'prestador-galeria';
/** El techo del BUCKET, espejado acá para decirlo ANTES del round-trip.
 *  Si divergieran, gana el bucket y el usuario vería un error de
 *  servidor en vez de una voz — por eso se escriben mirándose. */
const MAX_BYTES = 10 * 1024 * 1024;
const FORMATOS = ['video/mp4', 'video/quicktime'] as const;

export type CausaSubidaClipVitrina = Exclude<CausaSubida, 'formato_no_permitido'> | 'formato_no_video';

export type ResultadoSubidaClipVitrina =
  | { ok: true; path: string }
  | { ok: false; causa: CausaSubidaClipVitrina; mensaje: string; storagePath?: string };

/**
 * Sube el clip y lo registra. **Reemplaza al anterior y borra sus bytes.**
 * El orden es el mismo que en la galería y por la misma razón: primero se
 * registra el nuevo, después se borra el viejo. Al revés, un fallo entre
 * los dos pasos dejaría al prestador **sin clip y sin archivo**; así, lo
 * peor que queda es un huérfano invisible.
 */
export async function subirClipVitrina(input: {
  uri: string;
  /** reintento post-subida: salta el paso 1. */
  storagePath?: string;
}): Promise<ResultadoSubidaClipVitrina> {
  // el anterior se lee ANTES de pisarlo: después del UPDATE ya no hay
  // forma de saber qué path había, y el huérfano sería para siempre.
  const previo = await obtenerMiPrestador();
  const clipViejo = previo.ok ? previo.data.clip_url : null;

  const r = await subirArchivo({
    uri: input.uri,
    bucket: BUCKET,
    prefijo: 'clip-vitrina',
    maxBytes: MAX_BYTES,
    formatosPermitidos: FORMATOS,
    storagePath: input.storagePath,
    etiqueta: 'subir-clip-vitrina',
  });

  if (!r.ok) {
    if (r.causa === 'formato_no_permitido') {
      return { ok: false, causa: 'formato_no_video', mensaje: 'El clip tiene que ser un video (MP4 o MOV).' };
    }
    if (r.causa === 'archivo_grande') {
      return { ok: false, causa: 'archivo_grande', mensaje: 'El clip supera el máximo de 10MB.' };
    }
    return { ok: false, causa: r.causa, mensaje: r.mensaje, storagePath: r.storagePath };
  }

  // PASO 2 — el del clip: UNA columna (como el logo; la galería inserta fila).
  const reg = await actualizarPerfilPrestador({ clip_url: r.path });
  if (!reg.ok) {
    console.error(`[subir-clip-vitrina] REGISTRO falló · ${reg.mensaje}`);
    return { ok: false, storagePath: r.path, causa: 'servidor', mensaje: reg.mensaje };
  }

  // el viejo se va DESPUÉS de que el nuevo quedó registrado.
  if (clipViejo !== null && clipViejo !== r.path) {
    await borrarBytes(BUCKET, [clipViejo]);
  }
  return { ok: true, path: r.path };
}

/** Quitar el clip: `clip_url` a NULL ('' pasa por `aNull` del wrapper) y
 *  **los bytes se borran** (ver la cabecera: no es identidad). */
export async function quitarClipVitrina(): Promise<{ ok: boolean; mensaje?: string }> {
  const previo = await obtenerMiPrestador();
  const clipViejo = previo.ok ? previo.data.clip_url : null;

  const r = await actualizarPerfilPrestador({ clip_url: '' });
  if (!r.ok) {
    console.error(`[subir-clip-vitrina] QUITAR falló · ${r.mensaje}`);
    return { ok: false, mensaje: r.mensaje };
  }
  if (clipViejo !== null) await borrarBytes(BUCKET, [clipViejo]);
  return { ok: true };
}
