/**
 * LA FRONTERA DE SUBIDA (S84-A5) — extraída de `subir-logo.ts`, que la
 * tenía entera adentro y por eso no se podía reusar.
 *
 * ── QUÉ SE EXTRAJO Y QUÉ NO ──────────────────────────────────────────
 * `subir-logo.ts` estaba **bien hecho**: dos pasos con huérfano
 * recuperable, lectura por la frontera de `packages/ui` (L-137), formato
 * por **magic numbers** y no por extensión, causa LITERAL en el log +
 * tipada para la voz. **Nada de eso se tira — es el molde.**
 *
 * Lo que no se extendía era su FORMA: el paso 2 estaba **soldado a la
 * columna** (`actualizarPerfilPrestador({foto_url})`). Acá el paso 1
 * —leer · validar formato · validar tamaño · subir con nombre único— pasa
 * a ser UNA función, y **el paso 2 lo pone cada consumidor**: el logo
 * escribe una columna, la galería inserta una fila.
 *
 * Molde: `leerBytes`/`leerBase64` de `packages/ui` (S61-B10) — una
 * frontera única y los llamadores dejando de tragar la causa.
 *
 * ── LO QUE NO CAMBIA PARA EL LOGO (el freno de la orden) ─────────────
 * El logo conserva **byte por byte** su comportamiento observable: mismo
 * bucket (`avatars`), mismo techo (5 MB), **PNG-only con su porqué**,
 * mismo patrón de path (`<uid>/logo-negocio-<ts>.png`), mismas causas
 * tipadas y mismo huérfano recuperable. **La galería no le impone nada:**
 * los formatos y el techo son PARÁMETRO, no constante compartida —
 * ampliar el bucket de la galería a video no le abre el suyo al logo.
 */

import { Platform } from 'react-native';
import { leerBytes } from '@epetplace/ui';
import { getClient } from '@epetplace/api';

/** Las causas del paso 1. `formato_no_permitido` reemplaza al viejo
 *  `formato_no_png`: el mensaje concreto lo pone el consumidor, que es
 *  el que sabe qué formatos pidió. */
export type CausaSubida =
  | 'sin_sesion'
  | 'lectura'
  | 'archivo_grande'
  | 'formato_no_permitido'
  | 'red'
  | 'servidor';

export type ResultadoSubida =
  | { ok: true; path: string }
  | {
      ok: false;
      causa: CausaSubida;
      mensaje: string;
      /** path ya subido — el reintento salta el paso de subida. */
      storagePath?: string;
      /** el mime detectado, para que el consumidor arme su voz. */
      detectado?: string;
    };

/**
 * El formato sale de los BYTES (magic numbers), jamás de una extensión
 * inventada: la galería entrega el archivo ORIGINAL y mentirle el
 * contentType al bucket es basura persistida.
 * PNG `89 50 4E 47` · WEBP `RIFF….WEBP` · MP4/MOV por el box `ftyp`
 * en el offset 4 · resto = JPEG (la cámara).
 */
export function formatoDeBytes(bytes: ArrayBuffer): { contentType: string; extension: string } {
  const b = new Uint8Array(bytes.slice(0, 12));
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    return { contentType: 'image/png', extension: 'png' };
  }
  if (
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) {
    return { contentType: 'image/webp', extension: 'webp' };
  }
  // ISO-BMFF: los bytes 4..7 son 'ftyp'. Cubre mp4 y mov — los dos que el
  // bucket de la galería acepta. La marca fina (`isom`/`qt  `) va en 8..11.
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) {
    const esQuickTime = b[8] === 0x71 && b[9] === 0x74; // 'qt'
    return esQuickTime
      ? { contentType: 'video/quicktime', extension: 'mov' }
      : { contentType: 'video/mp4', extension: 'mp4' };
  }
  return { contentType: 'image/jpeg', extension: 'jpg' };
}

function esErrorDeRed(mensaje: string): boolean {
  return /network|failed to fetch|fetch failed|timeout/i.test(mensaje);
}

export interface EntradaSubida {
  uri: string;
  bucket: string;
  /** Prefijo del nombre dentro de la carpeta del usuario. El path final
   *  es `<uid>/<prefijo>-<timestamp>.<ext>` — la carpeta es `auth.uid()`
   *  porque **las policies de los dos buckets gatean por ella**. */
  prefijo: string;
  maxBytes: number;
  /** Whitelist de contentType. Un formato fuera de la lista **rebota
   *  ANTES de subir**: un archivo que no vamos a mostrar no ocupa el
   *  bucket. */
  formatosPermitidos: readonly string[];
  /** reintento post-subida: salta el paso 1. */
  storagePath?: string;
  /** para el log — distingue quién falló cuando hay dos consumidores. */
  etiqueta: string;
}

/** PASO 1, compartido. El paso 2 (registrar) es de cada consumidor. */
export async function subirArchivo(input: EntradaSubida): Promise<ResultadoSubida> {
  if (input.storagePath) return { ok: true, path: input.storagePath };

  const { data: auth } = await getClient().auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { ok: false, causa: 'sin_sesion', mensaje: 'No hay sesión activa.' };

  let bytes: ArrayBuffer;
  try {
    bytes = await leerBytes(input.uri);
  } catch (e) {
    const lit = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    console.error(`[${input.etiqueta}] LECTURA falló (${Platform.OS}) · uri=${input.uri.slice(0, 80)} · ${lit}`);
    return { ok: false, causa: 'lectura', mensaje: lit };
  }

  if (bytes.byteLength > input.maxBytes) {
    console.error(`[${input.etiqueta}] archivo_grande pre-check =`, bytes.byteLength, 'bytes');
    const mb = Math.round(input.maxBytes / (1024 * 1024));
    return { ok: false, causa: 'archivo_grande', mensaje: `El archivo supera el máximo de ${mb}MB.` };
  }

  const { contentType, extension } = formatoDeBytes(bytes);
  if (!input.formatosPermitidos.includes(contentType)) {
    console.error(`[${input.etiqueta}] formato_no_permitido · detectado=${contentType}`);
    return {
      ok: false,
      causa: 'formato_no_permitido',
      mensaje: `Ese formato no se puede subir (llegó ${extension}).`,
      detectado: contentType,
    };
  }

  const path = `${userId}/${input.prefijo}-${Date.now()}.${extension}`;
  const { error } = await getClient()
    .storage.from(input.bucket)
    .upload(path, bytes, { contentType, upsert: false });

  if (error) {
    console.error(`[${input.etiqueta}] SUBIDA falló · bucket=${input.bucket} · ${error.message}`);
    return {
      ok: false,
      causa: esErrorDeRed(error.message) ? 'red' : 'servidor',
      mensaje: error.message,
      // sin path: la subida no llegó a existir, el reintento empieza de cero
    };
  }
  return { ok: true, path };
}

/**
 * BORRA BYTES de verdad — la mitad que `quitarLogoNegocio` nunca tuvo
 * (declaraba el huérfano en su propio comentario, clase D-303).
 *
 * **Se llama DESPUÉS de borrar la fila, nunca antes**, y el orden es una
 * decisión: si se borraran los bytes primero y fallara la fila, quedaría
 * una foto **rota en pantalla**; al revés queda un byte huérfano, que es
 * **invisible**. Entre dos fallas parciales se elige la que el usuario no
 * ve.
 *
 * Su fallo NO se propaga como error de la operación: la foto ya
 * desapareció de la galería, que es lo que el usuario pidió. Se loguea
 * con su literal para que el huérfano sea rastreable.
 */
export async function borrarBytes(bucket: string, paths: string[]): Promise<{ ok: boolean; huerfanos: string[] }> {
  if (paths.length === 0) return { ok: true, huerfanos: [] };
  const { error } = await getClient().storage.from(bucket).remove(paths);
  if (error) {
    console.error(`[borrar-bytes] quedaron HUÉRFANOS en ${bucket} · ${paths.join(', ')} · ${error.message}`);
    return { ok: false, huerfanos: paths };
  }
  return { ok: true, huerfanos: [] };
}
