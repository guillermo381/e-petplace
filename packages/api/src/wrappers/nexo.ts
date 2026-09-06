// Puerta única de Nexo: `coach`, `coach-parte` y la bóveda (S113-D, lote 2.0).
// Molde literal del wrapper de razas: errores tipados por código y guard de
// shape contra el contrato de cada edge.
//
// 🔴 POR QUÉ ESTE ARCHIVO EXISTE, Y NO ES BUROCRACIA. Las tres edges estaban
// construidas, medidas y desplegadas, **y ninguna app podía llamarlas**: la
// casa entra a la DB y a las functions SÓLO por acá. Es `L-318` —*motor sin
// puerta*— la lección que este monorepo se cobró cuatro veces en un día.
//
// ── LO QUE ESTA PUERTA NO HACE, y es la mitad del contrato ────────────────
// · **No guarda la propuesta de memoria.** Llega como propuesta y se muestra;
//   la escribe la familia confirmando. *Una propuesta que el cliente guarda
//   solo deja de ser una propuesta.*
// · **No busca.** Cuando `intencion === 'busqueda'` devuelve la consulta: la
//   pantalla la resuelve con el buscador de la familia, con SU sesión.
// · **No interpreta un resultado de laboratorio.** Transcribe. Ver la ley en
//   `supabase/functions/extract-papel/index.ts`.

import { FunctionsHttpError } from '@supabase/supabase-js';

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

type Obj = Record<string, unknown>;
const esObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

// ── NEXO CONTESTA ──────────────────────────────────────────────────────────

export type IntencionNexo = 'busqueda' | 'dato' | 'narrativa' | 'fuera';
export type NivelSemaforo = 'casa' | 'semana' | 'ya';

/** 🔴 Espejo EXACTO de la lista blanca de la edge. No es una segunda fuente:
 *  la edge YA anuló lo que no estaba en la suya, y esto sólo evita que un nivel
 *  inventado llegue a pintarse si algún día las dos se separan.
 *  (`verify:vocabularios` existe porque una copia así se quedó vieja.) */
const NIVELES: readonly string[] = ['casa', 'semana', 'ya'];

export interface Semaforo {
  nivel: NivelSemaforo;
  /** En palabras de la familia o del carnet. Nunca un nombre de enfermedad. */
  motivo: string | null;
}

/** Las cuatro puertas del expediente. **Cada una se guarda por su camino**, y
 *  `medico` no es una etiqueta más: lo que entra ahí lo lee un veterinario como
 *  historia clínica. Por eso la edge, ante una clase que no reconoce, **cae a
 *  `rasgo`** —lo más inocuo— en vez de a la más grave. */
export type ClaseMemoria = 'comportamiento' | 'rasgo' | 'medico' | 'recuerdo';

export interface PropuestaMemoria {
  hecho: string;
  clase: ClaseMemoria;
}

export interface RespuestaNexo {
  /** `null` SÓLO cuando `intencion === 'busqueda'`. */
  respuesta: string | null;
  fuente: 'plantilla' | 'modelo' | 'router' | 'router_caido';
  plantilla?: string;
  intencion: IntencionNexo;
  /** Con `busqueda`: lo que hay que buscar. Lo resuelve la pantalla. */
  consulta?: string;
  semaforo: Semaforo | null;
  /** Se PROPONE. La guarda la familia confirmando, con `confirmado_de_ia`.
   *  🔴 **Este wrapper NO la guarda**, y no es un olvido: guardarla acá la
   *  volvería una afirmación del sistema sobre la mascota de alguien. */
  propuesta_memoria: PropuestaMemoria | null;
  /** `true` en el primer turno del hilo. */
  aviso_ia: boolean;
}

export interface InputPreguntarANexo {
  mascotaId: string;
  texto: string;
  hilo?: { rol: 'nexo' | 'familia'; texto: string }[];
}

const CODIGOS_NEXO = [
  'cuerpo_invalido', 'sin_sesion', 'sin_acceso', 'memorial',
  'contexto_no_disponible', 'texto_muy_largo', 'error_modelo',
  'datos_inconsistentes', 'error_desconocido',
] as const;
export type CodigoErrorNexo = (typeof CODIGOS_NEXO)[number];

const MENSAJES: Record<CodigoErrorNexo, string> = {
  cuerpo_invalido: 'Escríbeme algo para poder contestarte.',
  sin_sesion: 'Inicia sesión para hablar con Nexo.',
  sin_acceso: 'No encontramos esa mascota.',
  // 🔴 No es un error: es la respuesta correcta. Nexo NO EXISTE en memorial,
  // y la pantalla decide qué mostrar en su lugar — la voz viene en el cuerpo.
  memorial: 'Acá está su vida, entera.',
  contexto_no_disponible: 'No pudimos leer su expediente todavía.',
  texto_muy_largo: 'Escríbeme algo más corto.',
  error_modelo: 'No pude contestarte ahora. Prueba de nuevo en un momento.',
  datos_inconsistentes: 'La respuesta llegó incompleta.',
  error_desconocido: 'Algo falló. Prueba de nuevo.',
};

/** Devuelve el código tipado del cuerpo de error, o null si no lo trae. */
async function codigoDe<T extends string>(
  error: unknown, validos: readonly string[],
): Promise<T | null> {
  if (!(error instanceof FunctionsHttpError)) return null;
  try {
    const cuerpo: unknown = await error.context.json();
    const codigo = esObj(cuerpo) ? cuerpo.codigo : null;
    if (typeof codigo === 'string' && validos.includes(codigo)) return codigo as T;
  } catch {
    // body no-JSON: cae al error_desconocido de quien llama.
  }
  return null;
}

function esSemaforo(v: unknown): v is Semaforo {
  return esObj(v) && typeof v.nivel === 'string' && NIVELES.includes(v.nivel) &&
    (v.motivo === null || typeof v.motivo === 'string');
}

/** Le pregunta a Nexo sobre UNA mascota. El contexto lo lee el servidor. */
export async function preguntarANexo(
  input: InputPreguntarANexo,
): Promise<ResultadoWrapper<RespuestaNexo, CodigoErrorNexo>> {
  const { data, error } = await getClient().functions.invoke('coach', {
    body: { mascotaId: input.mascotaId, texto: input.texto, hilo: input.hilo },
  });
  if (error) {
    const c = await codigoDe<CodigoErrorNexo>(error, CODIGOS_NEXO);
    return { ok: false, codigo: c ?? 'error_desconocido', mensaje: MENSAJES[c ?? 'error_desconocido'] };
  }
  if (!esObj(data) || typeof data.aviso_ia !== 'boolean' ||
      typeof data.intencion !== 'string' ||
      !(['busqueda', 'dato', 'narrativa', 'fuera'] as string[]).includes(data.intencion) ||
      !(data.respuesta === null || typeof data.respuesta === 'string')) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES.datos_inconsistentes };
  }
  const CLASES: readonly string[] = ['comportamiento', 'rasgo', 'medico', 'recuerdo'];
  const p = data.propuesta_memoria;
  const propuesta: PropuestaMemoria | null =
    esObj(p) && typeof p.hecho === 'string' && p.hecho.trim() !== '' &&
    typeof p.clase === 'string' && CLASES.includes(p.clase)
      ? { hecho: p.hecho, clase: p.clase as ClaseMemoria }
      : null;
  return {
    ok: true,
    data: {
      respuesta: data.respuesta,
      fuente: data.fuente as RespuestaNexo['fuente'],
      plantilla: typeof data.plantilla === 'string' ? data.plantilla : undefined,
      intencion: data.intencion as IntencionNexo,
      consulta: typeof data.consulta === 'string' ? data.consulta : undefined,
      // Un semáforo que no cumple la forma NO se degrada a un nivel: se anula.
      // Inventar la urgencia en cualquier dirección es peor que no mostrarla.
      semaforo: esSemaforo(data.semaforo) ? data.semaforo : null,
      propuesta_memoria: propuesta,
      aviso_ia: data.aviso_ia,
    },
  };
}

// ── EL PARTE DEL DÍA ───────────────────────────────────────────────────────

export interface ParteDelDia {
  parte: string;
  fuente: 'plantilla' | 'modelo' | 'plantilla_de_respaldo';
  avisos: number;
}

/** 🔴 `null` es la respuesta MÁS FRECUENTE y no es un error: **hoy no hay
 *  nada que decir**. La edge devuelve 204 sin cuerpo justamente para que nadie
 *  pinte una tarjeta vacía. *Avisar todo enseña a ignorar los avisos.* */
export async function obtenerParteDelDia(
  mascotaId: string,
): Promise<ResultadoWrapper<ParteDelDia | null, CodigoErrorNexo>> {
  const { data, error } = await getClient().functions.invoke('coach-parte', {
    body: { mascotaId },
  });
  if (error) {
    const c = await codigoDe<CodigoErrorNexo>(error, CODIGOS_NEXO);
    return { ok: false, codigo: c ?? 'error_desconocido', mensaje: MENSAJES[c ?? 'error_desconocido'] };
  }
  // 204: silencio. `invoke` lo entrega como null o cadena vacía.
  if (data === null || data === undefined || data === '') return { ok: true, data: null };
  if (!esObj(data) || typeof data.parte !== 'string' || typeof data.avisos !== 'number') {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES.datos_inconsistentes };
  }
  return {
    ok: true,
    data: { parte: data.parte, fuente: data.fuente as ParteDelDia['fuente'], avisos: data.avisos },
  };
}

// ── LA BÓVEDA ──────────────────────────────────────────────────────────────

export type ClasePapel = 'examen' | 'receta' | 'informe';

export interface FilaPapel {
  nombre: string | null;
  /** Del examen. **El valor se muestra con su referencia y NADA MÁS**: la app
   *  no dice si está alto o bajo. Eso lo dice un veterinario. */
  valor: string | null;
  unidad: string | null;
  referencia: string | null;
  /** De la receta. */
  dosis: string | null;
  frecuencia: string | null;
  hasta_cuando: string | null;
  /** Lo que el papel dice, tal cual. Deja comprobar la lectura sin reabrirlo. */
  literal: string | null;
  fecha: string | null;
  fecha_precision: 'dia' | 'mes' | 'sin_anio' | null;
  evidencia: string | null;
  confianza: 'alta' | 'media' | 'baja';
  /** Del informe: el resumen. */
  nota: string | null;
  clase: string;
  /** `'incompleta'` = algo no se pudo leer y la persona lo completa. */
  dudosa: 'incompleta' | null;
}

export interface LecturaDePapel {
  clase: ClasePapel | null;
  fecha_documento: string | null;
  emisor: string | null;
  modo_captura: 'foto' | 'pdf';
  filas: FilaPapel[];
  /** Las que no cumplían el contrato, con su motivo. Que existan no rompe la
   *  lectura: **lo que falta no tumba la tanda.** */
  filas_descartadas: { indice: number; motivo: string }[];
}

const CODIGOS_PAPEL = [
  'cuerpo_invalido', 'sin_sesion', 'archivo_invalido', 'extraccion_fallida',
  'error_modelo', 'datos_inconsistentes', 'error_desconocido',
] as const;
export type CodigoErrorPapel = (typeof CODIGOS_PAPEL)[number];

const MENSAJES_PAPEL: Record<CodigoErrorPapel, string> = {
  cuerpo_invalido: 'Elige un archivo para leer.',
  sin_sesion: 'Inicia sesión para traer papeles.',
  archivo_invalido: 'Ese archivo es muy grande. Prueba con uno más liviano.',
  extraccion_fallida: 'No pudimos leer el papel. Prueba con otra foto.',
  error_modelo: 'No pudimos leer el papel ahora. Prueba de nuevo en un momento.',
  datos_inconsistentes: 'La lectura llegó incompleta.',
  error_desconocido: 'Algo falló. Prueba de nuevo.',
};

export interface InputLeerPapel {
  imageBase64: string;
  /** `image/jpeg` · `image/png` · `image/webp` · `application/pdf`. */
  mediaType?: string;
}

/** Lee un examen, una receta o un informe. **Transcribe, jamás interpreta.**
 *  Lo que devuelve va a una pantalla donde **la persona confirma**. */
export async function leerPapel(
  input: InputLeerPapel,
): Promise<ResultadoWrapper<LecturaDePapel, CodigoErrorPapel>> {
  const { data, error } = await getClient().functions.invoke('extract-papel', {
    body: { imageBase64: input.imageBase64, mediaType: input.mediaType },
  });
  if (error) {
    const c = await codigoDe<CodigoErrorPapel>(error, CODIGOS_PAPEL);
    return { ok: false, codigo: c ?? 'error_desconocido', mensaje: MENSAJES_PAPEL[c ?? 'error_desconocido'] };
  }
  if (!esObj(data) || !Array.isArray(data.filas) || !Array.isArray(data.filas_descartadas) ||
      typeof data.modo_captura !== 'string') {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES_PAPEL.datos_inconsistentes };
  }
  return {
    ok: true,
    data: {
      clase: (data.clase ?? null) as ClasePapel | null,
      fecha_documento: (data.fecha_documento ?? null) as string | null,
      emisor: (data.emisor ?? null) as string | null,
      modo_captura: data.modo_captura as LecturaDePapel['modo_captura'],
      filas: data.filas as FilaPapel[],
      filas_descartadas: data.filas_descartadas as LecturaDePapel['filas_descartadas'],
    },
  };
}
