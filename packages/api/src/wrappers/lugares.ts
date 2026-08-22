// ═══════════════════════════════════════════════════════════════════════
// lugares.ts — EL CONTRATO DE PLACES (S79-A2, LETRA_PERFIL_S79 §2).
//
// Publicado CONTRATO-PRIMERO para que B construya sin esperar (mandato
// Tanda 2). Las dos superficies (la sede del prestador — B — y el hogar
// del cliente — A4) consumen ESTE contrato; ninguna habla con Google
// directo.
//
// Arquitectura: Edge Function `lugares` (server-side; la API key de
// Places vive en Deno.env del proyecto, JAMÁS en el cliente — la única
// key del árbol es la de Maps Android, D-289, y no sirve para esto).
// Hasta que el founder cree el secret GOOGLE_PLACES_API_KEY, TODO
// devuelve `sin_configuracion` — honesto, jamás silencioso (regla 36).
//
// LAS TRES LEYES DE ESTE CONTRATO (LETRA_PERFIL_S79 §2.2, firma founder):
//  1. `resolverLugar` JAMÁS devuelve ok sin lat/lon numéricos reales —
//     "no encontramos tu dirección" nunca guarda coordenadas inventadas
//     (L-139). Si Google no trae location ⇒ `lugar_invalido`.
//  2. La sesión de búsqueda CIERRA SIEMPRE con Place Details: elegir una
//     predicción obliga a `resolverLugar` con la MISMA `sesion` (así
//     Google factura sesión, no requests sueltos — y el flujo no puede
//     quedarse con un placeId sin resolver).
//  3. `buscarLugares` solo — sin resolver — no produce coordenadas:
//     las predicciones no traen lat/lon a propósito.
//
// Flujo canónico de una superficie:
//   const sesion = crearSesionLugares();
//   … por cada tecleo (debounced): buscarLugares({ texto, sesion, lat?, lon? })
//   … al elegir: resolverLugar({ placeId, sesion })  ← cierra la sesión
//   … al guardar: el texto + ciudad + lat/lon del LugarResuelto.
//   … si el usuario EDITA el texto a mano después de resolver: las
//     coordenadas MUEREN con el texto que las parió (§2.2) — la
//     superficie descarta el LugarResuelto y guarda lat/lon null.
// ═══════════════════════════════════════════════════════════════════════

import { FunctionsHttpError } from '@supabase/supabase-js';

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

// ── El contrato de tipos (lo que B importa hoy) ──────────────────────────

/** Una predicción de Autocomplete. SIN coordenadas a propósito (ley 3). */
export interface PrediccionLugar {
  placeId: string;
  /** La línea principal ("Av. de los Shyris 1234"). */
  textoPrincipal: string;
  /** El contexto ("Quito, Ecuador") — null si Google no lo separó. */
  textoSecundario: string | null;
}

/** El cierre de la sesión: la dirección RESUELTA con coordenadas REALES. */
export interface LugarResuelto {
  placeId: string;
  /** La dirección formateada por Google — el texto que se persiste. */
  direccion: string;
  /** `locality` de Google ("Quito") — null honesto si no vino. */
  ciudad: string | null;
  /** SIEMPRE números reales de Google — jamás inventados (ley 1). */
  lat: number;
  lon: number;
}

export const CODIGOS_ERROR_LUGARES = [
  'sin_sesion',
  'sin_configuracion',
  'entrada_invalida',
  'lugar_invalido',
  'google_rechazo',
  'red',
] as const;

export type CodigoErrorLugares =
  | (typeof CODIGOS_ERROR_LUGARES)[number]
  | 'error_desconocido';

const MENSAJES: Record<CodigoErrorLugares, string> = {
  sin_sesion: 'No hay sesión activa.',
  // La voz honesta del preparado-apagado: la búsqueda de direcciones
  // todavía no está habilitada en este entorno.
  sin_configuracion: 'La búsqueda de direcciones no está disponible por ahora. Podés escribirla a mano.',
  entrada_invalida: 'Revisá lo que escribiste e intentá de nuevo.',
  lugar_invalido: 'No pudimos ubicar esa dirección en el mapa. Elegí otra o escribila a mano.',
  google_rechazo: 'El buscador de direcciones rechazó la consulta. Probá de nuevo en un momento.',
  red: 'Revisá tu conexión e intentá de nuevo.',
  error_desconocido: 'Ocurrió un error inesperado. Probá de nuevo.',
};

// ── Sesión de búsqueda (token de facturación por sesión de Google) ───────

/** Un token nuevo POR sesión de tipeo (se descarta al resolver o cancelar). */
export function crearSesionLugares(): string {
  // v4-shape; no necesita fuerza criptográfica — es un token de
  // agrupación de facturación, no un secreto.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ── Helpers de forma ─────────────────────────────────────────────────────

function esObj(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

async function codigoDeErrorInvoke(error: unknown): Promise<CodigoErrorLugares> {
  if (error instanceof FunctionsHttpError) {
    try {
      const cuerpo: unknown = await error.context.json();
      const codigo = esObj(cuerpo) ? cuerpo.codigo : null;
      if (
        typeof codigo === 'string' &&
        (CODIGOS_ERROR_LUGARES as readonly string[]).includes(codigo)
      ) {
        return codigo as CodigoErrorLugares;
      }
    } catch {
      // body no-JSON: cae abajo.
    }
    return 'error_desconocido';
  }
  // FunctionsFetchError / relay: la red es la causa más probable.
  return 'red';
}

function fallo<T>(codigo: CodigoErrorLugares): ResultadoWrapper<T, CodigoErrorLugares> {
  /* 🔴 EL FALLBACK NO ES PRUDENCIA: es que el `as` de arriba puede producir una
  clave que el mapa no tiene. `ResultadoWrapper` agrega `error_desconocido` y
  `datos_inconsistentes` a TODO wrapper, y un código nuevo del servidor entra
  igual por el cast ⇒ sin esto, `mensaje` sale `undefined` y **la voz queda
  MUDA justo en el fallo que menos sabemos explicar** (S103-C, `L-369`).
  Cae al genérico del propio mapa — jamás se inventa una causa. */
  return { ok: false, codigo, mensaje: MENSAJES[codigo] ?? MENSAJES.error_desconocido };
}

// ── Búsqueda (Autocomplete) ──────────────────────────────────────────────

export interface BuscarLugaresInput {
  texto: string;
  /** El token de crearSesionLugares() — el MISMO para toda la sesión de tipeo. */
  sesion: string;
  /** Sesgo opcional de cercanía (p. ej. la última ubicación conocida). */
  lat?: number;
  lon?: number;
}

/**
 * Predicciones para lo tipeado. `data: []` es resultado honesto (nada
 * matcheó, o texto demasiado corto — el guard local evita spamear la API).
 */
export async function buscarLugares(
  input: BuscarLugaresInput,
): Promise<ResultadoWrapper<PrediccionLugar[], CodigoErrorLugares>> {
  const texto = input.texto.trim();
  if (texto.length < 3) return { ok: true, data: [] };
  if (!input.sesion) return fallo('entrada_invalida');

  const { data, error } = await getClient().functions.invoke('lugares', {
    body: {
      accion: 'buscar',
      texto,
      sesion: input.sesion,
      lat: input.lat ?? null,
      lon: input.lon ?? null,
    },
  });

  if (error) return fallo(await codigoDeErrorInvoke(error));

  if (!esObj(data) || !Array.isArray(data.predicciones)) {
    return fallo('error_desconocido');
  }
  const predicciones: PrediccionLugar[] = [];
  for (const p of data.predicciones) {
    if (
      !esObj(p) ||
      typeof p.place_id !== 'string' ||
      typeof p.texto_principal !== 'string'
    ) {
      return fallo('error_desconocido');
    }
    predicciones.push({
      placeId: p.place_id,
      textoPrincipal: p.texto_principal,
      textoSecundario: typeof p.texto_secundario === 'string' ? p.texto_secundario : null,
    });
  }
  return { ok: true, data: predicciones };
}

// ── Resolución (Place Details — el cierre obligatorio de la sesión) ──────

export interface ResolverLugarInput {
  placeId: string;
  /** La MISMA sesión de la búsqueda que produjo el placeId (ley 2). */
  sesion: string;
}

/**
 * Resuelve una predicción a dirección + coordenadas REALES. Es el ÚNICO
 * productor de lat/lon del contrato: si Google no trae location, el
 * resultado es `lugar_invalido` — jamás un ok a medias (ley 1, L-139).
 */
export async function resolverLugar(
  input: ResolverLugarInput,
): Promise<ResultadoWrapper<LugarResuelto, CodigoErrorLugares>> {
  if (!input.placeId || !input.sesion) return fallo('entrada_invalida');

  const { data, error } = await getClient().functions.invoke('lugares', {
    body: { accion: 'resolver', place_id: input.placeId, sesion: input.sesion },
  });

  if (error) return fallo(await codigoDeErrorInvoke(error));

  if (
    !esObj(data) ||
    typeof data.place_id !== 'string' ||
    typeof data.direccion !== 'string' ||
    data.direccion.trim() === '' ||
    typeof data.lat !== 'number' ||
    typeof data.lon !== 'number' ||
    !Number.isFinite(data.lat) ||
    !Number.isFinite(data.lon)
  ) {
    // La ley 1 en el guard del cliente: forma incompleta = lugar
    // inválido; acá no se rellena nada.
    return fallo('lugar_invalido');
  }

  return {
    ok: true,
    data: {
      placeId: data.place_id,
      direccion: data.direccion,
      ciudad: typeof data.ciudad === 'string' && data.ciudad.trim() !== '' ? data.ciudad : null,
      lat: data.lat,
      lon: data.lon,
    },
  };
}
