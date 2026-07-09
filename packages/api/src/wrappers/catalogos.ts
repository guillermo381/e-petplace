// Catálogos (S45-B4): lecturas de cat_* — regla 21: el catálogo manda,
// jamás hardcodear especies en el front.

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJE_ERROR = 'No pudimos cargar el catálogo. Probá de nuevo.';

export interface EspecieCatalogo {
  codigo: string;
  nombre: string;
}

export interface NovedadPaseoCatalogo {
  codigo: string;
  /** Voz de la familia (Ley 3, D-300: nombre_familia con fallback a
   *  nombre) — ej: "Hizo sus necesidades con normalidad". */
  nombre: string;
}

/** Catálogo de novedades del paseo (codigo→voz de la familia), orden
 *  de display. Insumo del detalle del timeline del dueño (S45-B5.3).
 *  La voz de picker del prestador es `nombre` y vive en
 *  obtenerNovedadesPaseo (paseo.ts). */
export async function obtenerCatalogoNovedadesPaseo(): Promise<
  ResultadoWrapper<NovedadPaseoCatalogo[], 'error_catalogo'>
> {
  const { data, error } = await getClient()
    .from('cat_novedades_paseo')
    .select('codigo, nombre, nombre_familia')
    .order('orden_display', { ascending: true });

  if (error) return { ok: false, codigo: 'error_catalogo', mensaje: MENSAJE_ERROR };
  if (!Array.isArray(data)) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJE_ERROR };
  }
  return {
    ok: true,
    data: data.map((n) => ({ codigo: n.codigo, nombre: n.nombre_familia ?? n.nombre })),
  };
}

/** Las especies activas del catálogo (post-D-287: las 6 familias F1),
 *  en orden de display. RLS: cat_especies_select_publica. */
export async function obtenerEspeciesActivas(): Promise<
  ResultadoWrapper<EspecieCatalogo[], 'error_catalogo'>
> {
  const { data, error } = await getClient()
    .from('cat_especies')
    .select('codigo, nombre')
    .eq('activo', true)
    .order('orden_display', { ascending: true });

  if (error) return { ok: false, codigo: 'error_catalogo', mensaje: MENSAJE_ERROR };
  if (!Array.isArray(data)) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJE_ERROR };
  }
  return { ok: true, data: data.map((e) => ({ codigo: e.codigo, nombre: e.nombre })) };
}
