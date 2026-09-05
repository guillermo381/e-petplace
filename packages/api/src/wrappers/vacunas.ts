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

/**
 * 🔴 `D-008` PAGADA (S113-D-2.2): el vocabulario de vacunas ya **no vive en el
 * código**. Sale de `cat_vacunas` —hoy 7 filas: `antirrabica` · `giardia` ·
 * `leptospirosis` · `leucemia_felina` · `multiple` · `tos_perreras` ·
 * `triple_felina`— y **por eso los dos campos de abajo son `string`, no una
 * unión cerrada.**
 *
 * *Codificar el vocabulario acá reintroduciría, un piso más afuera, la misma
 * fragilidad que se acaba de sacar de la edge: el día que A agregue una vacuna
 * al catálogo, una unión cerrada en el cliente rechazaría una fila válida.*
 * El vocabulario se cierra donde vive el dato, no donde se dibuja.
 */
export type TipoVacuna = string;

/** Cuánto se fía el modelo de ESA fila. **`baja` no es un descarte: es una
 *  fila que la familia tiene que mirar con atención.** */
export type ConfianzaExtraccion = 'alta' | 'media' | 'baja';

/** QUÉ MARCA FÍSICA prueba que la vacuna se aplicó — y nada más. *Dónde estaba
 *  la fecha es otra pregunta y tiene su propio campo.* `impreso` es el registro
 *  que la clínica imprimió ya aplicado; un renglón impreso EN BLANCO no es
 *  esto: eso es `plan_impreso`. */
export type EvidenciaAplicacion = 'sticker' | 'sello' | 'manuscrito' | 'impreso';

/** Una vacuna que el carnet dice que SE APLICÓ. Ilegible = null, jamás ''.
 *
 *  ⚠️ **`laboratorio` y `vencimiento_biologico` se extraen y NO se persisten
 *  todavía**: las columnas existen en `evento_vacuna_aplicada`, pero la RPC
 *  `registrar_vacunas_de_carnet` **no las acepta** (medido S113-D). Se muestran
 *  en la confirmación; hasta que A ensanche la RPC, se pierden al guardar.
 *  *Se dice acá para que nadie las dé por guardadas.* */
export interface VacunaExtraida {
  /** 🔴 NULLABLE por firma del founder (S113-D-2.4): hay renglones donde HAY
   *  una vacuna y su nombre no se lee. La fila viaja igual, con fecha y lote,
   *  y **la pantalla obliga a completar el nombre antes de guardar** — la
   *  columna sigue `NOT NULL` en la base. *Una fila corregible vale más que
   *  una que desaparece en silencio.* */
  nombre: string | null;
  /** `YYYY-MM-DD` · `YYYY-MM` · `--MM-DD` · null. **Lo que el carnet trae.** */
  fecha_aplicada: string | null;
  /** Cuál de las tres formas es `fecha_aplicada`. `null` ⟺ la fecha es null. */
  fecha_aplicada_precision: PrecisionFecha | null;
  /** 🔴 La transcripción EXACTA de lo que el carnet trae («FEB 2023»,
   *  «26 JUN»). **La pantalla la muestra al lado del campo** — es lo que le
   *  permite a la persona ver de dónde salió la fecha sin ir a buscar el
   *  papel. Y es lo que la edge usa para comprobar la precisión sin creerle al
   *  modelo. */
  fecha_literal: string | null;
  fecha_proxima_precision: PrecisionFecha | null;
  fecha_proxima_literal: string | null;
  /** DERIVADO por la edge, no por el modelo: `'fecha'` cuando el literal no
   *  sostiene la precisión declarada — o sea, cuando el modelo completó algo.
   *  La fila viene además con `confianza: 'baja'`. */
  dudosa: 'fecha' | null;
  /** Sólo si está ESCRITA; jamás calculada. Mismas tres formas. */
  fecha_proxima: string | null;
  lote: string | null;
  laboratorio: string | null;
  via: ViaAdministracion | null;
  /** Antes `veterinario_nombre_externo`. Mismo dato, nombre del contrato. */
  veterinario: string | null;
  /** La fecha del STICKER: vence el FRASCO, no la aplicación. `05-2025` sin
   *  día ⇒ null — el día no se inventa. */
  vencimiento_biologico: string | null;
  /** Código de `cat_vacunas`, o `null` si el modelo no pudo mapear el nombre
   *  comercial con certeza. **Un código «probable» no existe**: null se corrige
   *  mirando el carnet, un código equivocado entra al plan vacunal como hecho. */
  vacuna_codigo: string | null;
  /** TODOS los códigos contra los que protege esta aplicación — una combinada
   *  cubre varias. **Vacío es «no estoy seguro»**, y es una respuesta válida:
   *  una cobertura inventada le dice al plan vacunal que la mascota está
   *  protegida contra algo que quizá no recibió. */
  cubre: string[];
  /** El NOMBRE del código, **derivado por la edge** desde `cat_vacunas` — el
   *  modelo no lo escribe. Es el campo que la RPC de escritura ya guarda. */
  tipo_vacuna: TipoVacuna | null;
  confianza: ConfianzaExtraccion;
  evidencia: EvidenciaAplicacion;
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

/**
 * 🔴 Formas de fecha que la extracción puede devolver — **el carnet trae lo que
 * trae y el día no se inventa** (firma del founder, S113-D-2.5):
 *   `YYYY-MM-DD` → 'dia'  ·  `YYYY-MM` → 'mes'  ·  `--MM-DD` → 'sin_anio'
 *
 * ⚠️ **No es el vocabulario de `mascotas`** (`exacta|aproximada|estimada`): ése
 * no puede expresar `sin_anio`, y un carnet perfectamente trae «26 JUN» y nada
 * más. Mapeo: `dia`≈`exacta` · `mes`≈`aproximada` · `sin_anio` **sin equivalente**.
 */
export type PrecisionFecha = 'dia' | 'mes' | 'sin_anio';

const FORMAS_FECHA: Record<PrecisionFecha, RegExp> = {
  dia: /^\d{4}-\d{2}-\d{2}$/,
  mes: /^\d{4}-\d{2}$/,
  sin_anio: /^--\d{2}-\d{2}$/,
};

const precisionDe = (v: string): PrecisionFecha | null =>
  (Object.keys(FORMAS_FECHA) as PrecisionFecha[]).find((p) => FORMAS_FECHA[p].test(v)) ?? null;

function campoTexto(v: unknown): v is string | null {
  return v === null || (typeof v === 'string' && v.trim().length > 0);
}

/** Fecha parcial o completa, o null. Nunca una forma libre. */
function campoFechaParcial(v: unknown): v is string | null {
  return v === null || (typeof v === 'string' && precisionDe(v) !== null);
}

const VIAS: readonly string[] = ['subcutanea', 'intramuscular', 'intranasal', 'oral'];
const CONFIANZAS: readonly string[] = ['alta', 'media', 'baja'];
const EVIDENCIAS: readonly string[] = ['sticker_con_fecha', 'sello', 'manuscrito', 'impreso'];

const enListaOnull = (v: unknown, lista: readonly string[]): boolean =>
  v === null || (typeof v === 'string' && lista.includes(v));

/** Espejo EXACTO del validador de la edge. Que las dos puntas exijan lo mismo
 *  es lo que hace que «cumple el contrato» signifique una sola cosa. */
function esVacunaExtraida(v: unknown): v is VacunaExtraida {
  if (!esObj(v)) return false;
  return (
    campoTexto(v.nombre) &&
    // Espejo del ancla de la edge: sin nombre, hace falta fecha o lote.
    !(v.nombre === null && v.fecha_aplicada === null && v.lote === null) &&
    campoFechaParcial(v.fecha_aplicada) &&
    campoFechaParcial(v.fecha_proxima) &&
    campoFechaParcial(v.vencimiento_biologico) &&
    // Espejo del guard de la edge: la precisión coincide con la forma, y las
    // dos son null juntas.
    (v.fecha_aplicada === null
      ? v.fecha_aplicada_precision === null
      : v.fecha_aplicada_precision === precisionDe(v.fecha_aplicada as string)) &&
    (v.fecha_proxima === null
      ? v.fecha_proxima_precision === null
      : v.fecha_proxima_precision === precisionDe(v.fecha_proxima as string)) &&
    campoTexto(v.fecha_literal) &&
    campoTexto(v.fecha_proxima_literal) &&
    (v.dudosa === null || v.dudosa === 'fecha') &&
    campoTexto(v.lote) &&
    campoTexto(v.laboratorio) &&
    campoTexto(v.veterinario) &&
    enListaOnull(v.via, VIAS) &&
    // `vacuna_codigo` y `tipo_vacuna` NO se validan contra una lista de acá: su
    // lista blanca es `cat_vacunas` y ya la exigió la edge contra la fuente.
    // Repetirla en el cliente sería una segunda copia que envejece sola.
    campoTexto(v.vacuna_codigo) &&
    Array.isArray(v.cubre) && v.cubre.every((c) => typeof c === 'string' && c.length > 0) &&
    campoTexto(v.tipo_vacuna) &&
    typeof v.confianza === 'string' && CONFIANZAS.includes(v.confianza) &&
    typeof v.evidencia === 'string' && EVIDENCIAS.includes(v.evidencia)
  );
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

  if (!esObj(data) || !Array.isArray(data.vacunas) || !Array.isArray(data.plan_impreso)) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES_EXTRACCION.datos_inconsistentes };
  }
  const vacunas: VacunaExtraida[] = [];
  for (const item of data.vacunas) {
    if (!esVacunaExtraida(item)) {
      return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES_EXTRACCION.datos_inconsistentes };
    }
    vacunas.push({
      nombre: item.nombre,
      fecha_aplicada: item.fecha_aplicada,
      fecha_aplicada_precision: item.fecha_aplicada_precision,
      fecha_literal: item.fecha_literal,
      fecha_proxima_precision: item.fecha_proxima_precision,
      fecha_proxima_literal: item.fecha_proxima_literal,
      dudosa: item.dudosa,
      fecha_proxima: item.fecha_proxima,
      lote: item.lote,
      laboratorio: item.laboratorio,
      via: item.via,
      veterinario: item.veterinario,
      vencimiento_biologico: item.vencimiento_biologico,
      vacuna_codigo: item.vacuna_codigo,
      cubre: item.cubre,
      tipo_vacuna: item.tipo_vacuna,
      confianza: item.confianza,
      evidencia: item.evidencia,
    });
  }
  const plan_impreso: FilaPlanImpreso[] = [];
  for (const fila of data.plan_impreso) {
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
