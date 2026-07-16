// LA OFERTA DEL ADIESTRADOR (S63-B) — el taller de configuración sobre
// el motor de la A (migración 20260715180000, gate aprobado):
//   · prestador_servicios tipo 'adiestramiento' (relevado vivo: techo
//     tipos_servicio.especies_elegibles = ["perro"], §2 del modelo) —
//     el precio de la fila ES la sesión suelta (§4, sin matriz).
//   · prestador_programas (satélite, RLS pp_own completa — escritura
//     DIRECTA, sin RPC): CHECKs relevados del DDL — nivel
//     basico|medio|experto|especialidad · n_sesiones 2-30 ·
//     precio > 0 · vigencia_dias >= (n-1)*7 · duración % 15.
//
// EL GUARD DEL FANTASMA (hallazgo del gate Bloque 2): el resolutor
// filtra `especies_compatibles IS NULL OR ? especie` — el default '[]'
// no matchea NINGUNA rama: oferta en DB, invisible al dueño. La puerta
// única lo hace IMPOSIBLE: guardar exige especies no-vacías (código
// tipado 'especies_sin_declarar'), jamás default silencioso.

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

export const TIPO_ADIESTRAMIENTO = 'adiestramiento';

export const NIVELES_PROGRAMA = ['basico', 'medio', 'experto', 'especialidad'] as const;
export type NivelPrograma = (typeof NIVELES_PROGRAMA)[number];

/** §12.4: rangos SUGERIDOS por nivel (ayuda de UI, jamás límite duro —
 *  el CHECK real es 2-30). Especialidad no tiene rango canónico. */
export const RANGO_SUGERIDO_POR_NIVEL: Partial<Record<NivelPrograma, { min: number; max: number }>> = {
  basico: { min: 6, max: 8 },
  medio: { min: 8, max: 10 },
  experto: { min: 10, max: 12 },
};

export type CodigoErrorOfertaAdiestramiento =
  | 'especies_sin_declarar'
  | 'oferta_inexistente'
  | 'sesiones_fuera_de_rango'
  | 'vigencia_no_cubre_cadencia'
  | 'duracion_invalida'
  | 'precio_invalido'
  | 'nombre_vacio'
  | 'programa_fuera_de_oficio'
  | 'error_desconocido';

const MENSAJES: Record<CodigoErrorOfertaAdiestramiento, string> = {
  especies_sin_declarar: 'Declara con qué especies trabajas antes de publicar la oferta.',
  oferta_inexistente: 'Guarda tu oferta antes de agregar programas.',
  sesiones_fuera_de_rango: 'Un programa va de 2 a 30 sesiones.',
  vigencia_no_cubre_cadencia: 'La vigencia tiene que cubrir la cadencia semanal de las sesiones.',
  duracion_invalida: 'La duración de la sesión va en pasos de 15 minutos.',
  precio_invalido: 'El precio del programa tiene que ser mayor a cero.',
  nombre_vacio: 'El programa necesita un nombre.',
  programa_fuera_de_oficio: 'El programa solo puede colgar de una oferta de adiestramiento.',
  error_desconocido: 'No pudimos guardar. Intenta de nuevo.',
};

// Los CHECKs de DB viajan como nombre de constraint en el 23514 (o como
// código propio en el trigger de oficio) — mapeo por inclusión, tipado.
const CHECK_A_CODIGO: [string, CodigoErrorOfertaAdiestramiento][] = [
  ['chk_programa_vigencia_cubre_cadencia', 'vigencia_no_cubre_cadencia'],
  ['chk_programa_n_sesiones', 'sesiones_fuera_de_rango'],
  ['chk_programa_duracion', 'duracion_invalida'],
  ['chk_programa_precio', 'precio_invalido'],
  ['chk_programa_vigencia', 'vigencia_no_cubre_cadencia'],
  ['chk_programa_nombre', 'nombre_vacio'],
  ['programa_fuera_de_oficio', 'programa_fuera_de_oficio'],
];

function falloDe<T>(mensajeOriginal: string): ResultadoWrapper<T, CodigoErrorOfertaAdiestramiento> {
  const codigo = CHECK_A_CODIGO.find(([marca]) => mensajeOriginal.includes(marca))?.[1] ?? 'error_desconocido';
  return { ok: false, codigo, mensaje: MENSAJES[codigo] };
}

function fallo<T>(codigo: CodigoErrorOfertaAdiestramiento): ResultadoWrapper<T, CodigoErrorOfertaAdiestramiento> {
  return { ok: false, codigo, mensaje: MENSAJES[codigo] };
}

export interface OfertaAdiestramientoPropia {
  id: string;
  activo: boolean;
  /** Precio de la SESIÓN SUELTA (§4). null = fila legacy sin precio. */
  precio: number | null;
  duracionMinutos: number | null;
  /** El acote declarado. [] = EL FANTASMA (solo posible por fuera de
   *  esta puerta — la UI lo trata como sin declarar). */
  especies: string[];
}

export interface ProgramaAdiestramientoPropio {
  id: string;
  nivel: NivelPrograma;
  nombre: string;
  descripcion: string | null;
  nSesiones: number;
  precioPrograma: number;
  vigenciaDias: number;
  duracionMinutosSesion: number;
  activo: boolean;
}

function esNivel(v: string): v is NivelPrograma {
  return (NIVELES_PROGRAMA as readonly string[]).includes(v);
}

function normalizarEspecies(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((e): e is string => typeof e === 'string') : [];
}

export interface MundoAdiestramientoPropio {
  oferta: OfertaAdiestramientoPropia | null;
  programas: ProgramaAdiestramientoPropio[];
}

export async function obtenerOfertaAdiestramientoPropia(
  prestadorId: string,
): Promise<ResultadoWrapper<MundoAdiestramientoPropio, CodigoErrorOfertaAdiestramiento>> {
  const cliente = getClient();
  const rOferta = await cliente
    .from('prestador_servicios')
    .select('id, activo, precio, duracion_minutos, especies_compatibles')
    .eq('prestador_id', prestadorId)
    .eq('tipo_servicio', TIPO_ADIESTRAMIENTO)
    .maybeSingle();
  if (rOferta.error) return falloDe(rOferta.error.message);
  if (rOferta.data === null) return { ok: true, data: { oferta: null, programas: [] } };

  const rProgramas = await cliente
    .from('prestador_programas')
    .select('id, nivel, nombre, descripcion, n_sesiones, precio_programa, vigencia_dias, duracion_minutos_sesion, activo')
    .eq('prestador_servicio_id', rOferta.data.id)
    .order('created_at', { ascending: true });
  if (rProgramas.error) return falloDe(rProgramas.error.message);

  return {
    ok: true,
    data: {
      oferta: {
        id: rOferta.data.id,
        activo: rOferta.data.activo,
        precio: rOferta.data.precio,
        duracionMinutos: rOferta.data.duracion_minutos,
        especies: normalizarEspecies(rOferta.data.especies_compatibles),
      },
      programas: rProgramas.data
        .filter((p) => esNivel(p.nivel))
        .map((p) => ({
          id: p.id,
          nivel: p.nivel as NivelPrograma,
          nombre: p.nombre,
          descripcion: p.descripcion,
          nSesiones: p.n_sesiones,
          precioPrograma: p.precio_programa,
          vigenciaDias: p.vigencia_dias,
          duracionMinutosSesion: p.duracion_minutos_sesion,
          activo: p.activo,
        })),
    },
  };
}

export interface GuardarOfertaAdiestramientoInput {
  prestadorId: string;
  /** La fila existente o null si jamás se guardó. */
  ofertaId: string | null;
  activo: boolean;
  /** Sesión suelta (§4). */
  precio: number;
  duracionMinutos: number;
  /** OBLIGATORIO no-vacío — el guard del fantasma vive acá. */
  especies: string[];
}

export async function guardarOfertaAdiestramiento(
  input: GuardarOfertaAdiestramientoInput,
): Promise<ResultadoWrapper<OfertaAdiestramientoPropia, CodigoErrorOfertaAdiestramiento>> {
  if (input.especies.length === 0) return fallo('especies_sin_declarar');
  const cliente = getClient();
  const valores = {
    activo: input.activo,
    precio: input.precio,
    duracion_minutos: input.duracionMinutos,
    especies_compatibles: input.especies,
  };
  const r =
    input.ofertaId === null
      ? await cliente
          .from('prestador_servicios')
          .insert({ prestador_id: input.prestadorId, tipo_servicio: TIPO_ADIESTRAMIENTO, ...valores })
          .select('id, activo, precio, duracion_minutos, especies_compatibles')
          .single()
      : await cliente
          .from('prestador_servicios')
          .update(valores)
          .eq('id', input.ofertaId)
          .select('id, activo, precio, duracion_minutos, especies_compatibles')
          .single();
  if (r.error || r.data === null) return falloDe(r.error?.message ?? '');
  return {
    ok: true,
    data: {
      id: r.data.id,
      activo: r.data.activo,
      precio: r.data.precio,
      duracionMinutos: r.data.duracion_minutos,
      especies: normalizarEspecies(r.data.especies_compatibles),
    },
  };
}

export interface GuardarProgramaAdiestramientoInput {
  /** La oferta madre — el programa es su satélite. */
  ofertaId: string;
  /** null = programa nuevo. */
  programaId: string | null;
  nivel: NivelPrograma;
  nombre: string;
  descripcion?: string;
  nSesiones: number;
  precioPrograma: number;
  vigenciaDias: number;
  duracionMinutosSesion: number;
  activo: boolean;
}

export async function guardarProgramaAdiestramiento(
  input: GuardarProgramaAdiestramientoInput,
): Promise<ResultadoWrapper<ProgramaAdiestramientoPropio, CodigoErrorOfertaAdiestramiento>> {
  if (input.nombre.trim().length === 0) return fallo('nombre_vacio');
  const cliente = getClient();
  const valores = {
    nivel: input.nivel,
    nombre: input.nombre.trim(),
    descripcion: input.descripcion?.trim() || null,
    n_sesiones: input.nSesiones,
    precio_programa: input.precioPrograma,
    vigencia_dias: input.vigenciaDias,
    duracion_minutos_sesion: input.duracionMinutosSesion,
    activo: input.activo,
  };
  const seleccion = 'id, nivel, nombre, descripcion, n_sesiones, precio_programa, vigencia_dias, duracion_minutos_sesion, activo';
  const r =
    input.programaId === null
      ? await cliente
          .from('prestador_programas')
          .insert({ prestador_servicio_id: input.ofertaId, ...valores })
          .select(seleccion)
          .single()
      : await cliente
          .from('prestador_programas')
          .update(valores)
          .eq('id', input.programaId)
          .select(seleccion)
          .single();
  if (r.error || r.data === null) return falloDe(r.error?.message ?? '');
  if (!esNivel(r.data.nivel)) return fallo('error_desconocido');
  return {
    ok: true,
    data: {
      id: r.data.id,
      nivel: r.data.nivel,
      nombre: r.data.nombre,
      descripcion: r.data.descripcion,
      nSesiones: r.data.n_sesiones,
      precioPrograma: r.data.precio_programa,
      vigenciaDias: r.data.vigencia_dias,
      duracionMinutosSesion: r.data.duracion_minutos_sesion,
      activo: r.data.activo,
    },
  };
}
