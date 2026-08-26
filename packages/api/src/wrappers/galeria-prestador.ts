/**
 * LA GALERÍA DEL PRESTADOR (S84-A5) — puerta única sobre
 * `prestador_fotos` y la RPC de reorden.
 *
 * ── LA PORTADA ES EL ORDEN MÍNIMO ────────────────────────────────────
 * **No existe `es_portada` y no se va a agregar.** Un flag separado del
 * orden permite dos estados imposibles —«dos portadas» y «la portada no
 * es la primera»—; derivarla de `MIN(orden)` los vuelve inexpresables, y
 * el `UNIQUE (prestador_id, orden)` es lo que lo garantiza en la fuente.
 * Consecuencia práctica para quien consuma esto: **la portada es
 * `fotos[0]` después de ordenar por `orden`. No hay que preguntarla.**
 *
 * ── EL BORRADO BORRA BYTES, Y EL ORDEN DE LOS DOS PASOS ES DECISIÓN ──
 * `borrarFotoGaleria` devuelve el `path` **para que la app borre los
 * bytes DESPUÉS** (`borrarBytes` de `subir-imagen.ts`). No se hace acá
 * porque `packages/api` no habla con storage en ningún wrapper — la
 * frontera de archivos es de la app (L-137).
 * **Fila primero, bytes después:** al revés, un fallo dejaría una foto
 * *rota en pantalla*; así deja un byte huérfano, que es *invisible*.
 * Entre dos fallas parciales se elige la que el usuario no ve.
 *
 * ── RLS ──────────────────────────────────────────────────────────────
 * Lectura: vitrina de negocio `activo` (o el propio titular). Escritura:
 * **titular-only** (D-513). Nada de esto se gatea acá: la puerta es la
 * RLS, y este wrapper solo traduce sus fallos a voz.
 */

import { getClient, uidActual } from '../client';
import type { ResultadoWrapper } from '../resultado';

const CODIGOS_ERROR_GALERIA = [
  'sin_sesion',
  'sin_permiso',
  'lista_invalida',
  'error_desconocido',
] as const;
export type CodigoErrorGaleria = (typeof CODIGOS_ERROR_GALERIA)[number];

const MENSAJES: Record<CodigoErrorGaleria, string> = {
  sin_sesion:        'No hay sesión activa.',
  // la RLS es titular-only: el rebote se dice como lo que es, no como
  // "error inesperado" (L-178: un permiso denegado se lee coherente).
  sin_permiso:       'Solo el titular del negocio puede editar la galería.',
  lista_invalida:    'La lista de fotos no coincide con la galería. Vuelve a cargarla.',
  error_desconocido: 'Ocurrió un error inesperado. Prueba de nuevo.',
};

export interface FotoGaleria {
  id: string;
  /** PATH en el bucket `prestador-galeria`, jamás una URL absoluta
   *  (CHECK en la tabla). Se resuelve al pintar. */
  url: string;
  orden: number;
  creado_en: string;
}

/** Ordenadas por `orden` ⇒ **`[0]` es la portada**. */
export async function listarFotosGaleria(
  prestadorId: string,
): Promise<ResultadoWrapper<FotoGaleria[], CodigoErrorGaleria>> {
  const { data, error } = await getClient()
    .from('prestador_fotos')
    .select('id, url, orden, creado_en')
    .eq('prestador_id', prestadorId)
    .order('orden', { ascending: true });

  if (error) return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  return { ok: true, data: data ?? [] };
}

/**
 * Agrega una foto YA SUBIDA (paso 2 de la frontera). El orden es
 * `max+1`, así que **la primera foto de una galería vacía nace siendo la
 * portada** sin que nadie lo pida.
 *
 * ⚠️ Dos agregados simultáneos pueden calcular el mismo `max`; el
 * `UNIQUE` hace que **uno de los dos rebote** en vez de crear dos filas
 * empatadas. Es el comportamiento correcto —la galería nunca queda con
 * portada ambigua— y el reintento es del llamador. *Se declara porque el
 * síntoma (una subida que "no aparece") es más raro que su causa.*
 */
export async function agregarFotoGaleria(
  prestadorId: string,
  path: string,
): Promise<ResultadoWrapper<FotoGaleria, CodigoErrorGaleria>> {
  const uid = await uidActual();
  if (!uid) return { ok: false, codigo: 'sin_sesion', mensaje: MENSAJES.sin_sesion };

  const { data: ultima, error: errorMax } = await getClient()
    .from('prestador_fotos')
    .select('orden')
    .eq('prestador_id', prestadorId)
    .order('orden', { ascending: false })
    .limit(1);

  if (errorMax) return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  const siguiente = (ultima?.[0]?.orden ?? -1) + 1;

  const { data, error } = await getClient()
    .from('prestador_fotos')
    .insert({ prestador_id: prestadorId, url: path, orden: siguiente })
    .select('id, url, orden, creado_en')
    .single();

  if (error !== null || data === null) {
    // 42501 = la RLS rebotó ⇒ no es titular. Se distingue: decirle
    // "error inesperado" a quien no tiene permiso es rebotar mintiendo.
    if (error?.code === '42501') {
      return { ok: false, codigo: 'sin_permiso', mensaje: MENSAJES.sin_permiso };
    }
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }
  return { ok: true, data };
}

/**
 * MARCAR PORTADA en O(1): le da el orden `min - 1`.
 *
 * **Por qué así y no renumerando:** renumerar bajo el `UNIQUE` exige la
 * danza de dos pasadas (eso es `reordenarFotosGaleria`, y por eso vive en
 * la DB). Para el gesto más común —*"que esta sea la portada"*— basta con
 * un UPDATE que **no puede colisionar con nadie**, porque `min-1` está
 * libre por definición.
 *
 * Deja huecos en la numeración, y **eso es correcto a propósito**: el
 * contrato es *"la portada es el mínimo"*, no *"los órdenes son
 * consecutivos"*. `reordenarFotosGaleria` normaliza a 0..N-1 cuando el
 * usuario reordena de verdad.
 */
export async function marcarComoPortada(
  prestadorId: string,
  fotoId: string,
): Promise<ResultadoWrapper<null, CodigoErrorGaleria>> {
  const uid = await uidActual();
  if (!uid) return { ok: false, codigo: 'sin_sesion', mensaje: MENSAJES.sin_sesion };

  const { data: primera, error: errorMin } = await getClient()
    .from('prestador_fotos')
    .select('id, orden')
    .eq('prestador_id', prestadorId)
    .order('orden', { ascending: true })
    .limit(1);

  if (errorMin) return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  const actual = primera?.[0];
  // ya es la portada: no se escribe nada. Un UPDATE que no cambia nada
  // igual toca `updated_at` y gasta un viaje.
  if (actual === undefined || actual.id === fotoId) return { ok: true, data: null };

  const { error } = await getClient()
    .from('prestador_fotos')
    .update({ orden: actual.orden - 1 })
    .eq('id', fotoId)
    .eq('prestador_id', prestadorId);

  if (error) {
    if (error.code === '42501') return { ok: false, codigo: 'sin_permiso', mensaje: MENSAJES.sin_permiso };
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }
  return { ok: true, data: null };
}

/**
 * REORDENAR — la lista COMPLETA, en el orden deseado. `ids[0]` queda de
 * portada: **el orden y la portada son el mismo dato**, así que no se
 * pasan por separado (dos argumentos podrían contradecirse).
 *
 * Va por RPC porque renumerar bajo el `UNIQUE` **atraviesa estados
 * intermedios inválidos** y desde el cliente serían N viajes sin
 * transacción. La RPC lo hace en dos pasadas dentro de una sola.
 */
export async function reordenarFotosGaleria(
  prestadorId: string,
  idsEnOrden: string[],
): Promise<ResultadoWrapper<null, CodigoErrorGaleria>> {
  const uid = await uidActual();
  if (!uid) return { ok: false, codigo: 'sin_sesion', mensaje: MENSAJES.sin_sesion };
  if (idsEnOrden.length === 0) {
    return { ok: false, codigo: 'lista_invalida', mensaje: MENSAJES.lista_invalida };
  }

  const { error } = await getClient().rpc('reordenar_fotos_prestador', {
    p_prestador_id: prestadorId,
    p_ids: idsEnOrden,
  });

  if (error) {
    // los tres rebotes tipados de la RPC dicen lo mismo hacia el usuario:
    // su lista no coincide con la galería y hay que recargarla.
    if (/lista_vacia|lista_incompleta|foto_ajena/.test(error.message)) {
      return { ok: false, codigo: 'lista_invalida', mensaje: MENSAJES.lista_invalida };
    }
    if (/reorden_incompleto/.test(error.message) || error.code === '42501') {
      return { ok: false, codigo: 'sin_permiso', mensaje: MENSAJES.sin_permiso };
    }
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }
  return { ok: true, data: null };
}

/**
 * Borra la FILA y **devuelve el path** para que la app borre los bytes
 * (ver la cabecera: fila primero, bytes después, y por qué).
 *
 * Si la fila no existía, devuelve `path: null` y `ok` — borrar dos veces
 * lo mismo no es un error para quien mira la pantalla.
 */
export async function borrarFotoGaleria(
  prestadorId: string,
  fotoId: string,
): Promise<ResultadoWrapper<{ path: string | null }, CodigoErrorGaleria>> {
  const uid = await uidActual();
  if (!uid) return { ok: false, codigo: 'sin_sesion', mensaje: MENSAJES.sin_sesion };

  const { data, error } = await getClient()
    .from('prestador_fotos')
    .delete()
    .eq('id', fotoId)
    .eq('prestador_id', prestadorId)
    .select('url');

  if (error) {
    if (error.code === '42501') return { ok: false, codigo: 'sin_permiso', mensaje: MENSAJES.sin_permiso };
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES.error_desconocido };
  }
  return { ok: true, data: { path: data?.[0]?.url ?? null } };
}
