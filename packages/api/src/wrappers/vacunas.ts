// Wrappers del carnet de vacunas (S46-B1.1): extracción vía Edge Function
// extract-vacuna (re-targeteada S46, errores tipados por status) +
// escritura atómica vía RPC registrar_vacunas_de_carnet (SECURITY
// INVOKER — la RLS del dueño es la puerta, relevada en S46-B1.0).
// Guards de shape contra el retorno REAL verificado con
// pg_get_functiondef y contra el contrato de la function (L-124).
// SIN UI todavía: la decisión de flujo del founder sigue abierta.

import { FunctionsHttpError } from '@supabase/supabase-js';

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

type Obj = Record<string, unknown>;

function esObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null;
}

// ── Extracción (Edge Function extract-vacuna) ────────────────────────────────

/** Vía de administración. **Vocabulario CERRADO por el CHECK real de
 *  `evento_vacuna_aplicada.via_administracion`** (medido S113-D, no copiado
 *  de un doc): fuera de esta lista la RPC de escritura rebota `item_invalido`. */
export type ViaAdministracion = 'subcutanea' | 'intramuscular' | 'intranasal' | 'oral';

/** Proto-catálogo de S48 (enmienda `D-008`). Se CONSERVA: está poblado en 22
 *  de las 32 filas reales — quitarlo sería perder un dato ya confirmado. */
export type TipoVacuna =
  | 'antirrábica' | 'múltiple' | 'tos de las perreras' | 'leptospirosis'
  | 'giardia' | 'triple felina' | 'leucemia felina';

/** Cuánto se fía el modelo de ESA fila. **`baja` no es un descarte: es una
 *  fila que la familia tiene que mirar con atención.** */
export type ConfianzaExtraccion = 'alta' | 'media' | 'baja';

/** Qué vio el modelo que prueba que la vacuna se APLICÓ. `impreso` es el
 *  registro que la clínica imprimió ya aplicado — un renglón impreso EN
 *  BLANCO no es esto: eso es `plan_impreso`. */
export type EvidenciaAplicacion = 'sticker_con_fecha' | 'sello' | 'manuscrito' | 'impreso';

/** Una vacuna que el carnet dice que SE APLICÓ. Ilegible = null, jamás ''.
 *
 *  ⚠️ **`laboratorio` y `vencimiento_biologico` se extraen y NO se persisten
 *  todavía**: las columnas existen en `evento_vacuna_aplicada`, pero la RPC
 *  `registrar_vacunas_de_carnet` **no las acepta** (medido S113-D). Se muestran
 *  en la confirmación; hasta que A ensanche la RPC, se pierden al guardar.
 *  *Se dice acá para que nadie las dé por guardadas.* */
export interface VacunaExtraida {
  /** 🔴 **NULL es válido** (firma del founder, 5-sep-2026): un renglón real que
   *  el modelo no supo nombrar sigue siendo una vacuna que la persona tiene
   *  delante. **La pantalla la dibuja pidiendo que se complete** — es la ley de
   *  la casa: *lo que falta lo completa la familia, y se dice dónde no pudimos.*
   *  ⚠️ Y el tipo lo dice **a propósito**: si fuera `string`, el consumidor no
   *  tendría cómo saber que puede faltar, y lo pintaría vacío sin pedirlo. */
  nombre: string | null;
  /** YYYY-MM-DD o null. Sin día, mes Y año ⇒ null (L-139). */
  fecha_aplicada: string | null;
  /** YYYY-MM-DD o null. Sólo si está ESCRITA; jamás calculada. */
  fecha_proxima: string | null;
  lote: string | null;
  laboratorio: string | null;
  via: ViaAdministracion | null;
  /** Antes `veterinario_nombre_externo`. Mismo dato, nombre del contrato. */
  veterinario: string | null;
  /** La fecha del STICKER: vence el FRASCO, no la aplicación. `05-2025` sin
   *  día ⇒ null — el día no se inventa. */
  vencimiento_biologico: string | null;
  tipo_vacuna: TipoVacuna | null;
  confianza: ConfianzaExtraccion;
  /** ⚠️ **NULLABLE, y es una desviación DECLARADA del contrato de D.**
   *  La v1 —la que las familias tienen hoy— no devuelve `evidencia`, y el
   *  catálogo de D no tiene un valor para «no sé». *Mapearla a `'impreso'`
   *  sería inventar la prueba de que algo se aplicó, que es exactamente el
   *  defecto que este lote entero vino a curar (L-139).* NULL y se dice. */
  evidencia: EvidenciaAplicacion | null;
}

/** Un renglón del PLAN que el carnet trae impreso de fábrica, sin marca de
 *  aplicación. **No es una vacuna: es el formulario.** */
export interface FilaPlanImpreso {
  nombre: string;
}

/** Lo que devuelve la lectura de un carnet: lo aplicado y lo que sólo estaba
 *  impreso. **Los dos canastos existen justamente para que el segundo no se
 *  cuele en el primero** (S113-D: un carnet de UNA vacuna devolvía DOCE). */
export interface LecturaDeCarnet {
  vacunas: VacunaExtraida[];
  plan_impreso: FilaPlanImpreso[];
}

export interface InputExtraerVacunas {
  imageBase64: string;
  /** Default de la function: image/jpeg. */
  mediaType?: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
}

const CODIGOS_ERROR_EXTRACCION = [
  'imagen_invalida',
  'configuracion_faltante',
  'error_modelo',
  'extraccion_fallida',
] as const;

export type CodigoErrorExtraccion = (typeof CODIGOS_ERROR_EXTRACCION)[number];

const MENSAJES_EXTRACCION: Record<
  CodigoErrorExtraccion | 'error_desconocido' | 'datos_inconsistentes',
  string
> = {
  imagen_invalida:        'La foto no se pudo procesar. Prueba con otra foto del carnet.',
  configuracion_faltante: 'El servicio de lectura no está disponible en este momento.',
  error_modelo:           'No pudimos leer el carnet ahora. Prueba de nuevo en un rato.',
  extraccion_fallida:     'No pudimos entender el carnet. Prueba con una foto más nítida y completa.',
  datos_inconsistentes:   'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:      'Ocurrió un error inesperado. Prueba de nuevo.',
};

const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/;

function campoTexto(v: unknown): v is string | null {
  return v === null || (typeof v === 'string' && v.trim().length > 0);
}

function campoFecha(v: unknown): v is string | null {
  return v === null || (typeof v === 'string' && RE_FECHA.test(v));
}

const VIAS: readonly string[] = ['subcutanea', 'intramuscular', 'intranasal', 'oral'];
const TIPOS: readonly string[] = [
  'antirrábica', 'múltiple', 'tos de las perreras', 'leptospirosis',
  'giardia', 'triple felina', 'leucemia felina',
];
const CONFIANZAS: readonly string[] = ['alta', 'media', 'baja'];
const EVIDENCIAS: readonly string[] = ['sticker_con_fecha', 'sello', 'manuscrito', 'impreso'];

const enListaOnull = (v: unknown, lista: readonly string[]): boolean =>
  v === null || (typeof v === 'string' && lista.includes(v));

/** Espejo EXACTO del validador de la edge. Que las dos puntas exijan lo mismo
 *  es lo que hace que «cumple el contrato» signifique una sola cosa. */
/* ══ DE GUARD A NORMALIZADOR — S113-A, forzado por la vuelta a la v1 ═════════
 *
 * 🔴 EL HECHO QUE LO OBLIGA, medido contra la edge DESPLEGADA (9-sep): la v1
 * devuelve `{ vacunas: [...] }` y **nada más** — sin `plan_impreso`, y cada
 * fila con `nombre, fecha_aplicada, fecha_proxima, veterinario_nombre_externo,
 * tipo_vacuna, lote`. **No manda `confianza`, ni `evidencia`, ni `laboratorio`,
 * ni `via`, ni `vencimiento_biologico`.**
 *
 * Con el guard tal cual estaba, **cada fila se rechazaba y todo carnet caía en
 * `sin_vacunas`**: la lectura quedaba muerta en el aparato de las familias.
 *
 * ⚠️ LA DISTINCIÓN QUE HACE HONESTO ESTO — y es la única razón por la que un
 * normalizador no es un relajamiento: se separa **AUSENTE** de **MAL**.
 * · Ausente ⇒ el valor honesto (null, o `'baja'` para la confianza). *La v1
 *   nunca separó plan de aplicación: nada de lo que devuelve merece más que
 *   «baja», y eso no es un relleno, es el dato.*
 * · Mal ⇒ **se sigue rechazando la fila entera**: una `via` fuera del catálogo
 *   o una fecha que no es fecha no se «normalizan» a null, porque eso taparía
 *   un modelo devolviendo basura. *Perdonar lo que falta no es perdonar lo que
 *   está mal.*
 */
function normalizarVacuna(v: unknown): VacunaExtraida | null {
  if (!esObj(v)) return null;
  /* 🔴 `nombre` NULL ES UNA FILA VÁLIDA (firma del founder, 5-sep-2026).
     ⏪ Antes se descartaba, y eso era la ley de hoy al revés: *«hacemos lo mejor
     que podamos; lo que falta lo completa la familia»*. Una fila sin nombre pero
     con fecha o lote **es un renglón real del carnet** que el modelo no supo
     nombrar — y la pieza de B ya la dibuja pidiendo que se complete. *Tirarla
     no evitaba un dato malo: perdía una vacuna que la persona tiene delante.*
     Lo único que se rechaza es lo MALFORMADO (abajo). */
  if (v.nombre !== undefined && v.nombre !== null && typeof v.nombre !== 'string') return null;

  // MAL ⇒ se rechaza la fila (no se normaliza).
  if (!campoFecha(v.fecha_aplicada) || !campoFecha(v.fecha_proxima)) return null;
  if (v.vencimiento_biologico !== undefined && !campoFecha(v.vencimiento_biologico)) return null;
  if (v.lote !== undefined && !campoTexto(v.lote)) return null;
  if (v.laboratorio !== undefined && !campoTexto(v.laboratorio)) return null;
  if (v.via !== undefined && !enListaOnull(v.via, VIAS)) return null;
  if (!enListaOnull(v.tipo_vacuna, TIPOS)) return null;
  if (v.confianza !== undefined && !(typeof v.confianza === 'string' && CONFIANZAS.includes(v.confianza))) return null;
  if (v.evidencia !== undefined && !(typeof v.evidencia === 'string' && EVIDENCIAS.includes(v.evidencia))) return null;

  /* `veterinario` en el contrato de D; `veterinario_nombre_externo` en la v1.
     Se leen las dos y gana la del contrato: la v1 es la que se está dejando
     atrás, no la que manda. */
  const vet = campoTexto(v.veterinario) && typeof v.veterinario === 'string'
    ? v.veterinario
    : (typeof v.veterinario_nombre_externo === 'string' ? v.veterinario_nombre_externo : null);

  return {
    nombre: typeof v.nombre === 'string' && v.nombre.trim().length > 0 ? v.nombre : null,
    fecha_aplicada: (v.fecha_aplicada as string | null) ?? null,
    fecha_proxima: (v.fecha_proxima as string | null) ?? null,
    lote: (v.lote as string | null) ?? null,
    laboratorio: (v.laboratorio as string | null) ?? null,
    via: (v.via as ViaAdministracion | null) ?? null,
    veterinario: vet,
    vencimiento_biologico: (v.vencimiento_biologico as string | null) ?? null,
    tipo_vacuna: (v.tipo_vacuna as TipoVacuna | null) ?? null,
    /* 🔴 AUSENTE ⇒ 'baja', y es el DATO, no un default cómodo: la v1 no
       distingue una aplicación de un renglón del plan impreso, así que ninguna
       de sus filas está probada. Firmar «baja» es decir la verdad. */
    confianza: (v.confianza as ConfianzaExtraccion | undefined) ?? 'baja',
    evidencia: (v.evidencia as EvidenciaAplicacion | undefined) ?? null,
  };
}


function esFilaPlan(v: unknown): v is FilaPlanImpreso {
  return esObj(v) && typeof v.nombre === 'string' && v.nombre.trim().length > 0;
}

/** Lee el carnet. `vacunas: []` con `plan_impreso` poblado es un resultado
 *  HONESTO y frecuente: un carnet nuevo, con su plan impreso y ninguna
 *  aplicación todavía. Los fallos llegan siempre como error tipado (regla 36). */
export async function extraerVacunasDeCarnet(
  input: InputExtraerVacunas,
): Promise<ResultadoWrapper<LecturaDeCarnet, CodigoErrorExtraccion>> {
  const { data, error } = await getClient().functions.invoke('extract-vacuna', {
    body: { imageBase64: input.imageBase64, mediaType: input.mediaType },
  });

  if (error) {
    // La function responde errores como { codigo, mensaje } con status
    // de error; functions-js los entrega como FunctionsHttpError con la
    // Response sin consumir en .context.
    if (error instanceof FunctionsHttpError) {
      try {
        const cuerpo: unknown = await error.context.json();
        const codigo = esObj(cuerpo) ? cuerpo.codigo : null;
        if (
          typeof codigo === 'string' &&
          (CODIGOS_ERROR_EXTRACCION as readonly string[]).includes(codigo)
        ) {
          const c = codigo as CodigoErrorExtraccion;
          return { ok: false, codigo: c, mensaje: MENSAJES_EXTRACCION[c] };
        }
      } catch {
        // body no-JSON: cae al error_desconocido de abajo.
      }
    }
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES_EXTRACCION.error_desconocido };
  }

  /* `plan_impreso` AUSENTE ⇒ `[]`. Es la v1, que no lo tiene; exigirlo acá
     dejaría la lectura muerta en el aparato de las familias (medido). Lo que
     NO se perdona es que venga y no sea un array: eso es una respuesta rota. */
  if (!esObj(data) || !Array.isArray(data.vacunas)
      || (data.plan_impreso !== undefined && !Array.isArray(data.plan_impreso))) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES_EXTRACCION.datos_inconsistentes };
  }
  const vacunas: VacunaExtraida[] = [];
  let descartadas = 0;
  for (const item of data.vacunas) {
    /* 🔴 EL DESCARTE ES **POR FILA**, no por lote (firma del founder).
       ⏪ Antes un `return` cortaba acá y **una fila malformada tiraba las
       ocho**. Medido el mismo día en la edge v2.3: el carnet del founder daba
       422 por su ítem 4 y se perdían las otras siete. *Convertir un campo
       faltante en un carnet ilegible es el peor cambio posible: la persona ve
       un carnet lleno y la app le dice que no leyó nada.*
       La fila mala **se descarta y se cuenta**; el resto llega. */
    const fila = normalizarVacuna(item);
    if (fila === null) {
      descartadas += 1;
      continue;
    }
    vacunas.push(fila);
  }
  /* ⚠️ El único caso que sigue siendo `datos_inconsistentes`: **vinieron filas y
     no sobrevivió ninguna**. *Descartar todo en silencio devolvería «no hay
     vacunas» sobre un carnet que sí traía renglones — la ausencia disfrazada de
     hecho que la ley prohíbe.* Un array vacío de origen NO entra acá: ése es un
     carnet sin aplicaciones, y es un resultado honesto. */
  if (data.vacunas.length > 0 && vacunas.length === 0) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES_EXTRACCION.datos_inconsistentes };
  }

  const plan_impreso: FilaPlanImpreso[] = [];
  /* La v1 no manda el canasto. `?? []` es el ÚNICO lugar donde la ausencia se
     vuelve lista vacía, y es correcto: *la v1 no es que tenga un plan impreso
     vacío — es que no sabe distinguirlo, y por eso todas sus filas llegan con
     confianza «baja».* El día que la v2.1 lo mande, esta línea no cambia. */
  for (const fila of (data.plan_impreso as unknown[] | undefined) ?? []) {
    if (!esFilaPlan(fila)) {
      return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES_EXTRACCION.datos_inconsistentes };
    }
    plan_impreso.push({ nombre: fila.nombre });
  }
  return { ok: true, data: { vacunas, plan_impreso } };
}

// ── Escritura (RPC registrar_vacunas_de_carnet) ──────────────────────────────

/** type (no interface): la index signature implícita lo hace asignable a Json. */
export type VacunaCarnetInput = {
  nombre: string;
  fecha_aplicada?: string | null;
  fecha_proxima?: string | null;
  veterinario_nombre_externo?: string | null;
  tipo_vacuna?: string | null;
  lote?: string | null;
  /** Opcional (el output de extracción no la trae); la RPC la valida
   *  contra el CHECK real de la tabla. */
  via_administracion?: string | null;
};

export interface InputRegistrarVacunas {
  mascota_id: string;
  vacunas: VacunaCarnetInput[];
  /** PATH del carnet en el bucket mascotas (carpeta del dueño) — el
   *  MISMO respalda las N filas del lote (D-308, S47-B1.2). Nullable:
   *  la carga sin foto es primera clase. */
  archivo_url?: string | null;
}

export interface ResultadoRegistrarVacunas {
  mascota_id: string;
  insertadas: number;
  ids: string[];
  archivo_url: string | null;
}

const CODIGOS_ERROR_REGISTRO = [
  'acceso_denegado',
  'sin_acceso_mascota',
  'vacunas_vacias',
  'item_invalido',
  'archivo_invalido',
] as const;

export type CodigoErrorRegistroVacunas = (typeof CODIGOS_ERROR_REGISTRO)[number];

/** Error del registro: union espejo de los RAISE + `indice_item`
 *  (1-based) cuando la RPC señaló QUÉ ítem del lote es el inválido —
 *  la pantalla de revisión marca ESA ficha como rechazada (B4). */
export type ErrorRegistrarVacunas = {
  ok: false;
  codigo: CodigoErrorRegistroVacunas | 'error_desconocido' | 'datos_inconsistentes';
  mensaje: string;
  indice_item?: number;
};

export type ResultadoRegistroVacunas =
  | { ok: true; data: ResultadoRegistrarVacunas }
  | ErrorRegistrarVacunas;

const MENSAJES_REGISTRO: Record<
  CodigoErrorRegistroVacunas | 'error_desconocido' | 'datos_inconsistentes',
  string
> = {
  acceso_denegado:      'Tu sesión no está activa. Iniciá sesión de nuevo.',
  sin_acceso_mascota:   'No tienes acceso a esta mascota.',
  vacunas_vacias:       'No hay vacunas para registrar.',
  item_invalido:        'Una de las vacunas del carnet no es válida. Revisa los datos e intenta de nuevo.',
  archivo_invalido:     'La foto del carnet no se pudo vincular. Prueba de nuevo.',
  datos_inconsistentes: 'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:    'Ocurrió un error inesperado. Prueba de nuevo.',
};

function normalizarCodigoRegistro(raw: string): CodigoErrorRegistroVacunas | 'error_desconocido' {
  if (raw.startsWith('auth_required')) return 'acceso_denegado';
  // 'item_invalido: <índice>: <motivo>' — normalización por prefijo (L-115).
  for (const codigo of CODIGOS_ERROR_REGISTRO) {
    if (raw.startsWith(codigo)) return codigo;
  }
  return 'error_desconocido';
}

/** 'item_invalido: <n>: <motivo>' → n (1-based); undefined si no vino. */
function indiceDeItemInvalido(raw: string): number | undefined {
  const m = raw.match(/^item_invalido: (\d+):/);
  return m ? Number(m[1]) : undefined;
}

/** Registra en bloque las vacunas de un carnet. ATÓMICA: una fila mala
 *  = cero filas escritas (asserts S46-B1.1/S47-B1.2). El trigger de la
 *  tabla crea los eventos padre — el timeline las ve solo. */
export async function registrarVacunasDeCarnet(
  input: InputRegistrarVacunas,
): Promise<ResultadoRegistroVacunas> {
  const { data, error } = await getClient().rpc('registrar_vacunas_de_carnet', {
    p_mascota_id:  input.mascota_id,
    p_vacunas:     input.vacunas,
    p_archivo_url: input.archivo_url ?? undefined,
  });

  if (error) {
    const codigo = normalizarCodigoRegistro(error.message);
    const indice = codigo === 'item_invalido' ? indiceDeItemInvalido(error.message) : undefined;
    return {
      ok: false,
      codigo,
      mensaje: MENSAJES_REGISTRO[codigo],
      ...(indice !== undefined ? { indice_item: indice } : null),
    };
  }

  // Shape del retorno REAL (pg_get_functiondef S47-B1.2):
  // { ok: true, mascota_id, insertadas, ids, archivo_url }.
  if (
    !esObj(data) ||
    data.ok !== true ||
    typeof data.mascota_id !== 'string' ||
    typeof data.insertadas !== 'number' ||
    !Array.isArray(data.ids) ||
    (data.archivo_url !== null && typeof data.archivo_url !== 'string')
  ) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES_REGISTRO.datos_inconsistentes };
  }
  const ids: string[] = [];
  for (const id of data.ids) {
    if (typeof id !== 'string') {
      return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES_REGISTRO.datos_inconsistentes };
    }
    ids.push(id);
  }
  return {
    ok: true,
    data: {
      mascota_id: data.mascota_id,
      insertadas: data.insertadas,
      ids,
      archivo_url: data.archivo_url as string | null,
    },
  };
}

// ── Lectura: la vacuna detrás de un nodo del timeline (S47-B1.2 C) ───────────

export interface VacunaDeEvento {
  id: string;
  nombre_vacuna: string;
  tipo_vacuna: string | null;
  fecha_aplicada: string | null;
  fecha_proxima: string | null;
  veterinario_nombre_externo: string | null;
  lote: string | null;
  /** PATH del carnet en el bucket mascotas, o null (carga sin foto). */
  archivo_url: string | null;
}

const MENSAJE_VACUNA_EVENTO = 'No pudimos cargar la vacuna. Prueba de nuevo.';

/** La fila tipada detrás de un evento vacuna_aplicada del timeline.
 *  RLS vacuna_select (user_tiene_acceso_a_mascota) es el guard. */
export async function obtenerVacunaPorEvento(
  eventoId: string,
): Promise<ResultadoWrapper<VacunaDeEvento, 'vacuna_no_encontrada'>> {
  const { data, error } = await getClient()
    .from('evento_vacuna_aplicada')
    .select('id, nombre_vacuna, tipo_vacuna, fecha_aplicada, fecha_proxima, veterinario_nombre_externo, lote, archivo_url')
    .eq('evento_id', eventoId)
    .maybeSingle();

  if (error) return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJE_VACUNA_EVENTO };
  if (data === null) {
    return { ok: false, codigo: 'vacuna_no_encontrada', mensaje: 'Esta vacuna ya no está disponible.' };
  }
  return {
    ok: true,
    data: {
      id: data.id,
      nombre_vacuna: data.nombre_vacuna,
      tipo_vacuna: data.tipo_vacuna ?? null,
      fecha_aplicada: data.fecha_aplicada ?? null,
      fecha_proxima: data.fecha_proxima ?? null,
      veterinario_nombre_externo: data.veterinario_nombre_externo ?? null,
      lote: data.lote ?? null,
      archivo_url: data.archivo_url ?? null,
    },
  };
}
