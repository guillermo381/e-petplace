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

/** MODELO_PASEO v1.4 §1bis — especies elegibles de una CATEGORÍA de
 *  servicio (fuente de verdad: tipos_servicio.especies_elegibles).
 *  null = todas las especies (multi-especie de nacimiento). La UI
 *  FILTRA con esto; la DB manda igual (guard mascota_no_elegible).
 *  Nota: las filas de una categoría comparten config (seed S57) — se
 *  toma la primera no-nula. */
export async function obtenerEspeciesElegibles(
  categoria: string,
): Promise<ResultadoWrapper<string[] | null, 'error_catalogo'>> {
  const { data, error } = await getClient()
    .from('tipos_servicio')
    .select('especies_elegibles')
    .eq('categoria', categoria)
    .eq('activo', true);
  if (error) {
    return { ok: false, codigo: 'error_catalogo', mensaje: MENSAJE_ERROR };
  }
  for (const fila of data ?? []) {
    if (Array.isArray(fila.especies_elegibles)) {
      return { ok: true, data: fila.especies_elegibles.map(String) };
    }
  }
  return { ok: true, data: null };
}

// ── S74-B (recepción v1, E5 de la vara): los umbrales del momento vital
// por especie — el patrón literal de adiestramiento-antes.ts (guard de
// shape L-124 sobre momentos_vitales_jsonb). La ETAPA se computa
// client-side (packages/domain calcularMomentoVital); acá solo el dato.
// El tipo UmbralesEspecie ya VIVE en perfilMascota (L-150: una verdad) — se reusa. ──
import type { UmbralesEspecie } from './perfilMascota';

export async function obtenerUmbralesMomentoVital(
  especieCodigo: string,
): Promise<ResultadoWrapper<UmbralesEspecie | null, 'error_catalogo'>> {
  const { data, error } = await getClient()
    .from('cat_especies_perfil')
    .select('momentos_vitales_jsonb')
    .eq('especie_codigo', especieCodigo)
    .maybeSingle();
  if (error) return { ok: false, codigo: 'error_catalogo', mensaje: MENSAJE_ERROR };
  const jsonb: unknown = data?.momentos_vitales_jsonb;
  if (typeof jsonb !== 'object' || jsonb === null) return { ok: true, data: null };
  const o = jsonb as Record<string, unknown>;
  const m2 = o['M2_inicio_meses'];
  const m3 = o['M3_inicio_meses'];
  const m5 = o['M5_inicio_meses'];
  if (typeof m2 !== 'number' || typeof m3 !== 'number' || typeof m5 !== 'number') {
    return { ok: true, data: null }; // shape desconocido: null honesto, jamás inventar
  }
  return { ok: true, data: { m2InicioMeses: m2, m3InicioMeses: m3, m5InicioMeses: m5 } };
}
