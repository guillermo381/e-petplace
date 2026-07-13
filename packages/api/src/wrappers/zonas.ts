// ZONAS DE COBERTURA del prestador — S58/D-331, contrato mínimo v1
// DECLARATIVA (decisión founder S58): la fila declara "cubre esta
// ciudad"; el motor de slots/oferta NO filtra todavía (D-367, disparo
// propio). Jerarquía CIUDAD → zonas colgando de country_config vía
// cat_ciudades (un prestador puede cubrir Bogotá Y Quito — cruza país).
// La RLS es la puerta: el prestador escribe LAS SUYAS
// (prestador_zonas_own); lectura de las declaradas de prestadores
// ACTIVOS para todo authenticated (prestador_zonas_public — la ficha
// del paseador dirá "Cubre: …" cuando su pantalla se toque).

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const CODIGOS_ERROR_ZONAS = ['error_zonas', 'zona_duplicada', 'no_autorizado'] as const;
export type CodigoErrorZonas = (typeof CODIGOS_ERROR_ZONAS)[number];

const MENSAJES: Record<CodigoErrorZonas, string> = {
  error_zonas: 'No pudimos leer las zonas de cobertura. Probá de nuevo.',
  zona_duplicada: 'Esa ciudad ya está en tu cobertura.',
  no_autorizado: 'No podés editar la cobertura de otro prestador.',
};

function mapeoError(codigo: string | null): { ok: false; codigo: CodigoErrorZonas; mensaje: string } {
  // PostgREST entrega el SQLSTATE en error.code: 23505 = UNIQUE
  // (uq_prestador_zonas), 42501 = RLS (own/with_check).
  const c: CodigoErrorZonas =
    codigo === '23505' ? 'zona_duplicada' : codigo === '42501' ? 'no_autorizado' : 'error_zonas';
  return { ok: false, codigo: c, mensaje: MENSAJES[c] };
}

export interface CiudadCatalogo {
  id: string;
  country_code: string;
  nombre: string;
}

export interface ZonaCobertura {
  id: string;
  ciudad: CiudadCatalogo;
}

/** El catálogo de ciudades activas (cat_ciudades), opcionalmente por país. */
export async function obtenerCatalogoCiudades(
  countryCode?: string,
): Promise<ResultadoWrapper<CiudadCatalogo[], CodigoErrorZonas>> {
  let q = getClient()
    .from('cat_ciudades')
    .select('id, country_code, nombre')
    .eq('activo', true)
    .order('country_code')
    .order('nombre');
  if (countryCode !== undefined) q = q.eq('country_code', countryCode);
  const { data, error } = await q;
  if (error) return mapeoError(error.code);
  const ciudades: CiudadCatalogo[] = [];
  for (const fila of data ?? []) {
    if (typeof fila.id !== 'string' || typeof fila.nombre !== 'string') {
      return mapeoError(null);
    }
    ciudades.push({ id: fila.id, country_code: fila.country_code, nombre: fila.nombre });
  }
  return { ok: true, data: ciudades };
}

// El shape del join anidado de PostgREST (guard L-124: verificado, no calcado)
function parseZonas(data: unknown): ZonaCobertura[] | null {
  if (!Array.isArray(data)) return null;
  const zonas: ZonaCobertura[] = [];
  for (const fila of data) {
    const f = fila as { id?: unknown; ciudad?: unknown };
    const c = f.ciudad as { id?: unknown; country_code?: unknown; nombre?: unknown } | null;
    if (typeof f.id !== 'string' || c === null || typeof c !== 'object') return null;
    if (typeof c.id !== 'string' || typeof c.country_code !== 'string' || typeof c.nombre !== 'string') return null;
    zonas.push({ id: f.id, ciudad: { id: c.id, country_code: c.country_code, nombre: c.nombre } });
  }
  return zonas;
}

const SELECT_ZONA = 'id, ciudad:cat_ciudades(id, country_code, nombre)';

/** Las zonas declaradas de UN prestador (lectura del cliente y de la
 *  ficha — la RLS ya filtra: solo prestadores ACTIVOS, salvo el propio). */
export async function obtenerZonasDePrestador(
  prestadorId: string,
): Promise<ResultadoWrapper<ZonaCobertura[], CodigoErrorZonas>> {
  const { data, error } = await getClient()
    .from('prestador_zonas')
    .select(SELECT_ZONA)
    .eq('prestador_id', prestadorId)
    .order('created_at');
  if (error) return mapeoError(error.code);
  const zonas = parseZonas(data);
  if (zonas === null) return mapeoError(null);
  return { ok: true, data: zonas };
}

/** Declara una ciudad en la cobertura del prestador (RLS: solo la propia). */
export async function agregarZonaCobertura(input: {
  prestador_id: string;
  ciudad_id: string;
}): Promise<ResultadoWrapper<ZonaCobertura, CodigoErrorZonas>> {
  const { data, error } = await getClient()
    .from('prestador_zonas')
    .insert({ prestador_id: input.prestador_id, ciudad_id: input.ciudad_id })
    .select(SELECT_ZONA)
    .single();
  if (error) return mapeoError(error.code);
  const zonas = parseZonas([data]);
  if (zonas === null || zonas.length !== 1) return mapeoError(null);
  return { ok: true, data: zonas[0] };
}

/** Quita una ciudad de la cobertura (borrado real: v1 declarativa —
 *  presencia = declarada; RLS: solo la propia). */
export async function quitarZonaCobertura(
  zonaId: string,
): Promise<ResultadoWrapper<{ id: string }, CodigoErrorZonas>> {
  const { data, error } = await getClient()
    .from('prestador_zonas')
    .delete()
    .eq('id', zonaId)
    .select('id');
  if (error) return mapeoError(error.code);
  // RLS silencia el delete ajeno (0 filas) — se reporta honesto
  if (!Array.isArray(data) || data.length !== 1 || typeof data[0]?.id !== 'string') {
    return { ok: false, codigo: 'no_autorizado', mensaje: MENSAJES.no_autorizado };
  }
  return { ok: true, data: { id: data[0].id } };
}
