// Catálogos (S45-B4): lecturas de cat_* — regla 21: el catálogo manda,
// jamás hardcodear especies en el front.

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJE_ERROR = 'No pudimos cargar el catálogo. Prueba de nuevo.';

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

// ── S91 · D-379: el catálogo de razas ────────────────────────────────
// LA LETRA, antes que el código: el catálogo SUGIERE, el dueño CONFIRMA.
// Este lector alimenta el tipeo predictivo del alta; lo que el dueño
// escriba viaja TEXTO LIBRE a la RPC (`raza`), se parezca o no a una
// fila de acá — «Mestizo» y «No sé» son respuesta de primera clase.
// Un acuario NO usa este lector (su campo dos es el tipo de agua).

export interface RazaCatalogo {
  slug: string;
  /** Nombre VERBATIM del mapeo, con sus acentos y ñ. Jamás
   *  des-slugificado: es «Cacatúa Alba», no «Cacatua Alba». */
  nombre: string;
  /** Path en el bucket público `especies-razas`:
   *  '<especie>/<slug>.webp'. La URL la compone la superficie. */
  ruta_imagen: string;
}

/** Razas activas de UNA especie, alfabéticas por nombre.
 *  RLS: cat_razas_select_publica. Especie sin razas = lista vacía
 *  (no es error: la superficie ofrece «Mestizo / No sé» igual). */
export async function obtenerRazasDeEspecie(
  especie: string,
): Promise<ResultadoWrapper<RazaCatalogo[], 'error_catalogo'>> {
  const { data, error } = await getClient()
    .from('cat_razas')
    .select('slug, nombre, ruta_imagen')
    .eq('especie', especie)
    .eq('activo', true)
    .order('nombre', { ascending: true });

  if (error) return { ok: false, codigo: 'error_catalogo', mensaje: MENSAJE_ERROR };
  if (!Array.isArray(data)) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJE_ERROR };
  }
  return {
    ok: true,
    data: data.map((r) => ({
      slug: r.slug,
      nombre: r.nombre,
      ruta_imagen: r.ruta_imagen,
    })),
  };
}

// ── S91 · LOS RESOLVERS DE LA GALERÍA `especies-razas` ────────────────
// Hermanos de `resolverUrlLogoNegocio` / `resolverUrlGaleriaPrestador`
// (`wrappers/prestador.ts`) y con SU MISMO CUERPO: el SDK resuelve la URL
// pública. No se arma el string a mano desde `process.env` — dos maneras de
// componer la misma URL es como nacen las divergencias que nadie ve hasta
// que una de las dos queda vieja.
//
// POR QUÉ NACEN ACÁ Y NO EN LA PANTALLA: tenían DOS pretendientes a la vez
// —el chip de raza del alta (D, que dejó un puente declarado en
// `apps/cliente/src/components/alta/imagen-raza.ts`) y el filtro por especie
// del histórico (B, que lo ELEVÓ en vez de improvisarlo con un glifo
// cualquiera)—. Dos consumidores de la misma URL en dos apps distintas es
// exactamente la definición de pieza compartida.
//
// El bucket es PÚBLICO (111 objetos: 105 razas + 6 genéricos, origen-IA
// firmado — ficha D-288), así que esto no pega a la red: compone.

const BUCKET_ESPECIES_RAZAS = 'especies-razas';

/** La cara de UNA raza. `slug` es el del catálogo (`cat_razas.slug`),
 *  JAMÁS uno derivado del texto que alguien tipeó: «Pastor Alemán» a mano
 *  puede dar `pastor-aleman` (existe) o `ovejero-aleman` (no), y una URL que
 *  acierta a veces muestra una cara equivocada — peor que ninguna. */
export function resolverUrlRaza(
  especie: string | null,
  slug: string | null,
): string | null {
  if (!especie || !slug) return null;
  return resolverUrlRutaEspecies(`${especie}/${slug}.webp`);
}

/** La cara de la ESPECIE — el escalón de fallback cuando hay especie pero no
 *  raza elegida.
 *  ⚠️ Medido al sembrar: las SEIS especies que el alta ofrece tienen su
 *  `generico.webp`; **`reptil` NO lo tiene** (404 verificado) — y desde S91
 *  reptil está apagado estructuralmente, así que no debería llegar acá. */
export function resolverUrlGenericaEspecie(especie: string | null): string | null {
  if (!especie) return null;
  return resolverUrlRutaEspecies(`${especie}/generico.webp`);
}

/** Desde el PATH que el catálogo YA trae (`cat_razas.ruta_imagen`).
 *  Se prefiere sobre `resolverUrlRaza` cuando la fila está a mano: ahí el
 *  path es un DATO, no una convención re-armada de dos pedazos — si mañana
 *  una raza tuviera su imagen en otro lado, ésta la encuentra y la otra no. */
export function resolverUrlRutaEspecies(ruta: string | null): string | null {
  if (ruta === null || ruta.length === 0) return null;
  return getClient().storage.from(BUCKET_ESPECIES_RAZAS).getPublicUrl(ruta).data.publicUrl;
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
