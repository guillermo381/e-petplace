// Salud del expediente — LOS PRODUCTORES DEL DUEÑO (S82-A r4): los tres
// motores que el gate descubrió por ausencia ("Cómo está hoy" con 3 de 4
// celdas en Sin registro porque el producto no producía esos datos).
//
//   · registrarDesparasitacion — el 2º tipo fecha-sola (D-312 sonó)
//   · declararSinAlergiasConocidas — "sin registro" ≠ "ninguna conocida"
//   · registrarPesoMascota — la puerta de la SERIE (el motor ya existía)
//   · obtenerHistoriaPeso — el lector de la serie (sin serie no se puede
//     decir "estable 6 meses"; el cálculo es de domain/pantalla)
//
// Todas las puertas son molde P19 (DEFINER + familiar adulto + errores
// tipados, verificadas E2E con JWT real y ROLLBACK — L-114).

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJE_ERROR = 'No pudimos guardar. Revisa tu conexión y prueba de nuevo.';

export type CodigoErrorSalud =
  | 'sin_sesion'
  | 'sin_acceso'
  | 'producto_requerido'
  | 'tipo_invalido'
  | 'fecha_futura'
  | 'orden_fechas_invalido'
  | 'peso_invalido'
  | 'metodo_invalido'
  | 'error_lectura'
  | 'desconocido';

// L-115: la RPC levanta 'codigo: detalle' — se normaliza por startsWith.
function codigoSalud(mensaje: string): CodigoErrorSalud {
  if (mensaje.startsWith('auth_required')) return 'sin_sesion';
  if (mensaje.startsWith('no_access_to_mascota')) return 'sin_acceso';
  // S91: `obtener_serie_peso` levanta 'sin_acceso' directo (el código de la
  // casa). Las dos formas se normalizan al mismo código del wrapper: la UI
  // no debería tener que saber cuál RPC eligió qué palabra.
  if (mensaje.startsWith('sin_acceso')) return 'sin_acceso';
  if (mensaje.startsWith('producto_requerido')) return 'producto_requerido';
  if (mensaje.startsWith('tipo_invalido')) return 'tipo_invalido';
  if (mensaje.startsWith('fecha_futura')) return 'fecha_futura';
  if (mensaje.startsWith('orden_fechas_invalido')) return 'orden_fechas_invalido';
  if (mensaje.startsWith('peso_invalido')) return 'peso_invalido';
  if (mensaje.startsWith('metodo_invalido')) return 'metodo_invalido';
  return 'desconocido';
}

export type TipoDesparasitacion = 'interna' | 'externa' | 'mixta';

/** S113-A — CONTRA QUÉ fue la desparasitación. Vocabulario cerrado, copiado del
 *  CHECK `chk_desparasitacion_plagas` de `evento_desparasitacion_aplicada`.
 *
 *  ⚠️ **Convive con `TipoDesparasitacion` y no lo reemplaza:** `tipo` dice
 *  DÓNDE actúa el producto (interna/externa/mixta) y `plagas` dice CONTRA QUÉ.
 *  *«externa» no distingue pulgas de garrapatas — ésa es la razón por la que
 *  la columna existe.* */
export type PlagaTratada = 'pulgas' | 'garrapatas' | 'mosquitos' | 'internos';

/** Registra una desparasitación declarada por la familia (evento del
 *  expediente con su próxima fecha — molde de vacunas). El padre nace
 *  por trigger con procedencia declarado_por_familia. */
export async function registrarDesparasitacion(
  mascotaId: string,
  datos: {
    producto: string;
    tipo?: TipoDesparasitacion;
    fecha_aplicada?: string;
    fecha_proxima?: string;
    notas?: string;
    /** ⭐ S113-A — la RPC lo acepta desde A3 y el wrapper **no lo exponía**:
     *  el dato viajaba a la puerta y no había forma de mandarlo desde la app.
     *  *Entregada ≠ montada.*
     *
     *  Omitirlo ⇒ `NULL` (*no se declaró*). Un array vacío es legal en el
     *  motor pero **rebota** con `plagas_vacio`: `{}` diría «no trataba
     *  ninguna plaga», que no es un hecho posible. */
    plagas?: readonly PlagaTratada[];
  },
): Promise<ResultadoWrapper<{ id: string; mascota_id: string }, CodigoErrorSalud>> {
  const { data, error } = await getClient().rpc('registrar_desparasitacion', {
    p_mascota_id: mascotaId,
    p_producto: datos.producto,
    ...(datos.tipo !== undefined ? { p_tipo: datos.tipo } : null),
    ...(datos.fecha_aplicada !== undefined ? { p_fecha_aplicada: datos.fecha_aplicada } : null),
    ...(datos.fecha_proxima !== undefined ? { p_fecha_proxima: datos.fecha_proxima } : null),
    ...(datos.notas !== undefined ? { p_notas: datos.notas } : null),
    /* Se manda sólo si vino: la RPC tiene DEFAULT NULL y mandar `null`
       explícito y omitir son lo mismo para ella — pero omitir deja el
       parámetro fuera de la llamada, que es lo que hacen los otros cuatro. */
    /* `[...]` a propósito: la firma pública es `readonly` —lo correcto para
       quien llama, que no debería poder mutar lo que pasó— y el tipo generado
       pide un array mutable. La copia vive sólo acá, en el borde. */
    ...(datos.plagas !== undefined ? { p_plagas: [...datos.plagas] } : null),
  });
  if (error) return { ok: false, codigo: codigoSalud(error.message), mensaje: MENSAJE_ERROR };
  const o = data as Record<string, unknown> | null;
  if (o === null || typeof o !== 'object' || o.ok !== true || typeof o.id !== 'string' || typeof o.mascota_id !== 'string') {
    return { ok: false, codigo: 'desconocido', mensaje: MENSAJE_ERROR };
  }
  return { ok: true, data: { id: o.id, mascota_id: o.mascota_id } };
}

/** Declara el hecho clínico "NINGUNA alergia conocida" (S82: distinto de
 *  "sin registro" — sin esta declaración la pantalla miente). Idempotente:
 *  re-declarar refresca fecha y autor. La PRECEDENCIA la aplica el lector
 *  (perfilMascota): una lista de alergias NO vacía le gana. */
export async function declararSinAlergiasConocidas(
  mascotaId: string,
): Promise<ResultadoWrapper<{ mascota_id: string; declarada_en: string }, CodigoErrorSalud>> {
  const { data, error } = await getClient().rpc('declarar_sin_alergias_conocidas', {
    p_mascota_id: mascotaId,
  });
  if (error) return { ok: false, codigo: codigoSalud(error.message), mensaje: MENSAJE_ERROR };
  const o = data as Record<string, unknown> | null;
  if (o === null || typeof o !== 'object' || o.ok !== true || typeof o.mascota_id !== 'string' || typeof o.declarada_en !== 'string') {
    return { ok: false, codigo: 'desconocido', mensaje: MENSAJE_ERROR };
  }
  return { ok: true, data: { mascota_id: o.mascota_id, declarada_en: o.declarada_en } };
}

export type MetodoPeso = 'bascula_clinica' | 'bascula_casa' | 'estimacion';

/** Registra un peso en la SERIE (evento_peso_medicion — el motor
 *  pre-existente S66/S70: el padre y la propagación al snapshot son de
 *  sus triggers). Rango 0–150 kg en la puerta, tipado. */
export async function registrarPesoMascota(
  mascotaId: string,
  datos: { peso_kg: number; metodo?: MetodoPeso; fecha?: string; notas?: string },
): Promise<ResultadoWrapper<{ id: string; mascota_id: string; peso_kg: number }, CodigoErrorSalud>> {
  const { data, error } = await getClient().rpc('registrar_peso_mascota', {
    p_mascota_id: mascotaId,
    p_peso_kg: datos.peso_kg,
    ...(datos.metodo !== undefined ? { p_metodo: datos.metodo } : null),
    ...(datos.fecha !== undefined ? { p_fecha: datos.fecha } : null),
    ...(datos.notas !== undefined ? { p_notas: datos.notas } : null),
  });
  if (error) return { ok: false, codigo: codigoSalud(error.message), mensaje: MENSAJE_ERROR };
  const o = data as Record<string, unknown> | null;
  if (
    o === null ||
    typeof o !== 'object' ||
    o.ok !== true ||
    typeof o.id !== 'string' ||
    typeof o.mascota_id !== 'string' ||
    typeof o.peso_kg !== 'number'
  ) {
    return { ok: false, codigo: 'desconocido', mensaje: MENSAJE_ERROR };
  }
  return { ok: true, data: { id: o.id, mascota_id: o.mascota_id, peso_kg: o.peso_kg } };
}

export interface PesoDeLaSerie {
  peso_kg: number;
  /** timestamptz ISO de la medición. */
  fecha: string;
  metodo: string | null;
  /** true si la midió un prestador (báscula clínica del negocio). */
  de_prestador: boolean;
}

/** La HISTORIA de peso (serie fechada, más nueva primero). El juicio
 *  "estable N meses" es de domain/pantalla — este lector solo trae la
 *  verdad ordenada. RLS: user_tiene_acceso_a_mascota. */
export async function obtenerHistoriaPeso(
  mascotaId: string,
): Promise<ResultadoWrapper<PesoDeLaSerie[], CodigoErrorSalud>> {
  const r = await getClient()
    .from('evento_peso_medicion')
    .select('peso_kg, fecha_medicion, metodo_medicion, prestador_id')
    .eq('mascota_id', mascotaId)
    .order('fecha_medicion', { ascending: false })
    .limit(100);
  if (r.error) return { ok: false, codigo: 'error_lectura', mensaje: MENSAJE_ERROR };
  return {
    ok: true,
    data: r.data.map((p) => ({
      peso_kg: p.peso_kg,
      fecha: p.fecha_medicion,
      metodo: p.metodo_medicion,
      de_prestador: p.prestador_id !== null,
    })),
  };
}

// ── S82 r7 · EL PLAN BASE DE VACUNAS (el hueco más grande del producto) ──

/** El estado de UNA vacuna DEL PLAN — incluye lo que FALTA, que es
 *  justamente lo que antes no se podía computar (cat_vacunas era
 *  vocabulario sin periodicidad ni obligatoriedad). */
export type EstadoPlanVacuna =
  | 'al_dia'
  | 'vencida'
  /** hay aplicación pero no se puede saber la próxima (sin periodicidad
   *  y sin fecha capturada) — se dice, no se inventa. */
  | 'sin_fecha'
  | 'nunca_aplicada'
  /** por edad todavía no toca: JAMÁS se muestra como falta. */
  | 'aun_no_corresponde'
  /** S113-A · A5 — vence dentro de la ventana (30 días por default).
   *  ⚠️ El umbral es una ELECCIÓN, no una medición: no hay ninguno escrito
   *  en la casa. Viaja como parámetro para poder moverlo. */
  | 'vence_en';

export interface VacunaDelPlan {
  vacuna_codigo: string;
  nombre: string;
  obligatoria: boolean;
  periodicidad_meses: number | null;
  ultima_aplicada: string | null;
  proxima: string | null;
  /** true = la próxima la DERIVÓ la casa (última + periodicidad); false =
   *  la capturó el carnet. La capturada SIEMPRE gana a la derivada; la
   *  superficie puede decir la diferencia si quiere (L-139). */
  proxima_es_derivada: boolean;
  estado: EstadoPlanVacuna;
  /** S113-A · A5 — la columna existía en `cat_plan_vacunal` y no viajaba. */
  exigida_guarderia: boolean;
  /** S113-A · A5 — cuántas vacunas de ESTA mascota no se pudieron atar al
   *  plan porque no tienen `vacuna_codigo`. **Igual en todas las filas**: es
   *  un dato de la mascota, no de la vacuna. *Sin él, una vacuna que la
   *  familia SÍ puso se lee como «nunca_aplicada» y nadie se entera.* */
  aplicadas_sin_clasificar: number;
}

/* 🔴 ESTA LISTA ES UN FILTRO, NO UNA DECLARACIÓN — y por eso agregar un estado
   en el motor sin agregarlo acá es una PÉRDIDA SILENCIOSA: el guard de shape
   descarta la fila entera (`continue`), el wrapper devuelve ok, y la vacuna
   simplemente no aparece. Sin error, sin log, sin síntoma.
   `vence_en` entra acá EN EL MISMO ACTO en que nació en la migración. */
const ESTADOS_PLAN: readonly string[] = [
  'al_dia',
  'vencida',
  'sin_fecha',
  'nunca_aplicada',
  'aun_no_corresponde',
  'vence_en',
];

/** El plan vacunal de una mascota: UNA FILA POR VACUNA QUE SU ESPECIE
 *  NECESITA — aplicadas y faltantes. Es el lector que habilita el tablero
 *  de vacunas, la grilla "Cómo está hoy" y la fila de recomendación del
 *  Hogar (que hoy solo podía computar citas). */
export async function obtenerPlanVacunal(
  mascotaId: string,
  /** El día de la FAMILIA, en formato `YYYY-MM-DD`. Lo manda el aparato, que
   *  es el único que lo sabe: **la casa no guarda la zona horaria de la
   *  familia en ningún lado** (medido 9-sep — `hoy_local()` es Guayaquil fijo
   *  y las cinco columnas `zona_horaria` que existen son del negocio).
   *  Omitirlo cae a `hoy_local()`, y eso se dice en vez de disimularse. */
  hoy?: string,
  /** Días de anticipación para el estado `vence_en`. Elección, no medición. */
  ventanaDias?: number,
): Promise<ResultadoWrapper<VacunaDelPlan[], CodigoErrorSalud>> {
  const { data, error } = await getClient().rpc('obtener_plan_vacunal', {
    p_mascota_id: mascotaId,
    ...(hoy !== undefined ? { p_hoy: hoy } : {}),
    ...(ventanaDias !== undefined ? { p_ventana_dias: ventanaDias } : {}),
  });
  if (error) return { ok: false, codigo: codigoSalud(error.message), mensaje: MENSAJE_ERROR };
  if (!Array.isArray(data)) return { ok: false, codigo: 'desconocido', mensaje: MENSAJE_ERROR };

  const filas: VacunaDelPlan[] = [];
  for (const f of data as Record<string, unknown>[]) {
    // guard de shape contra el retorno REAL (L-124): una fila que no
    // cierra se DESCARTA, jamás se completa con inventos.
    if (
      typeof f.vacuna_codigo !== 'string' ||
      typeof f.nombre !== 'string' ||
      typeof f.obligatoria !== 'boolean' ||
      typeof f.estado !== 'string' ||
      !ESTADOS_PLAN.includes(f.estado)
    ) {
      continue;
    }
    filas.push({
      vacuna_codigo: f.vacuna_codigo,
      nombre: f.nombre,
      obligatoria: f.obligatoria,
      periodicidad_meses: typeof f.periodicidad_meses === 'number' ? f.periodicidad_meses : null,
      ultima_aplicada: typeof f.ultima_aplicada === 'string' ? f.ultima_aplicada : null,
      proxima: typeof f.proxima === 'string' ? f.proxima : null,
      proxima_es_derivada: f.proxima_es_derivada === true,
      estado: f.estado as EstadoPlanVacuna,
      exigida_guarderia: f.exigida_guarderia === true,
      aplicadas_sin_clasificar:
        typeof f.aplicadas_sin_clasificar === 'number' ? f.aplicadas_sin_clasificar : 0,
    });
  }
  return { ok: true, data: filas };
}

// ── S91 (P2 de la lámina del perfil) · LA CURVA, no el vigente ─────────
// El motor de escritura ya existía (`registrarPesoMascota`, arriba): una
// FILA por medición, con su fecha y su método. Lo que faltaba era LEER la
// serie — el perfil traía `peso_clinico_kg`, que es el VIGENTE, así que la
// curva que la letra promete a Coach y vet no tenía de dónde leerse.

export interface MedicionPeso {
  /** ISO — `evento_peso_medicion.fecha_medicion`. */
  fecha: string;
  peso_kg: number;
  /** 'bascula_casa' · 'bascula_clinica' · … — el método declarado. */
  metodo: string | null;
  /** DERIVADO de quién lo registró, y no es adorno: una curva que mezcla
   *  báscula de casa con báscula de clínica sin decir cuál es cuál invita a
   *  leer una tendencia que no existe. */
  origen: 'familia' | 'prestador';
}

/** La serie de peso, de la más reciente a la más vieja.
 *  Serie vacía NO es error: una mascota sin pesajes es el caso normal. */
export async function obtenerSeriePeso(
  mascotaId: string,
  limite = 60,
): Promise<ResultadoWrapper<MedicionPeso[], CodigoErrorSalud>> {
  const { data, error } = await getClient().rpc('obtener_serie_peso', {
    p_mascota_id: mascotaId,
    p_limite: limite,
  });
  if (error) return { ok: false, codigo: codigoSalud(error.message), mensaje: MENSAJE_ERROR };
  if (!Array.isArray(data)) {
    return { ok: false, codigo: 'error_lectura', mensaje: MENSAJE_ERROR };
  }
  return {
    ok: true,
    data: data.flatMap((f) => {
      const peso = typeof f.peso_kg === 'number' ? f.peso_kg : Number(f.peso_kg);
      // Una fila sin fecha o sin peso no es una medición: se OMITE en vez de
      // viajar como null y romper la curva del consumidor.
      if (typeof f.fecha !== 'string' || !Number.isFinite(peso)) return [];
      return [{
        fecha: f.fecha,
        peso_kg: peso,
        metodo: typeof f.metodo === 'string' ? f.metodo : null,
        origen: f.origen === 'prestador' ? ('prestador' as const) : ('familia' as const),
      }];
    }),
  };
}

// ── EL RECUERDO DE LA FAMILIA (S113-A, lote 0) ──────────────────────────────

export interface RecuerdoInput {
  mascotaId: string;
  /** PATH del bucket `mascotas` (jamás URL), tal como lo devuelve el subidor
   *  de la app. La foto se sube ANTES, por la puerta única de Storage; acá
   *  viaja sólo el puntero. */
  fotoPath?: string;
  texto?: string;
  /** `YYYY-MM-DD`. Omitirla = hoy, resuelto en el SERVIDOR. */
  fecha?: string;
}

const CODIGOS_RECUERDO = [
  'acceso_denegado',
  'sin_acceso_mascota',
  'recuerdo_vacio',
  'foto_invalida',
  'fecha_futura',
  'error_desconocido',
] as const;
export type CodigoErrorRecuerdo = (typeof CODIGOS_RECUERDO)[number];

const MENSAJES_RECUERDO: Record<CodigoErrorRecuerdo, string> = {
  acceso_denegado:    'Tu sesión no está activa. Inicia sesión de nuevo.',
  sin_acceso_mascota: 'No tienes acceso a esta mascota.',
  recuerdo_vacio:     'Escribe algo o agrega una foto.',
  foto_invalida:      'No pudimos guardar la foto. Prueba de nuevo.',
  fecha_futura:       'Esa fecha todavía no llegó.',
  error_desconocido:  'No pudimos guardar el recuerdo. Prueba de nuevo.',
};

/**
 * Guarda un recuerdo de la familia en el expediente.
 *
 * **Vive en `evento_hito_narrativo`, y eso es lo que lo hace visible.** Medido:
 * `timeline.ts` discrimina `tipo === 'hito_narrativo' && datos.clave_hito`, y
 * `nota_dueno` no lo lee ningún lector — *un recuerdo invisible en la Línea de
 * Vida no es un recuerdo.* El evento nace con `clave_hito: 'recuerdo_familia'`.
 *
 * `texto` y `fotoPath` son los dos opcionales, pero **el servidor rebota si no
 * viene ninguno**: un recuerdo sin nada es una fila vacía en la vida de una
 * familia.
 *
 * La foto se sube ANTES por la puerta única de Storage (bucket `mascotas`,
 * carpeta del dueño) y acá viaja el PATH — el servidor verifica que sea un
 * path y que esté en la carpeta de quien escribe, no una URL ni una carpeta
 * ajena.
 *
 * Procedencia `declarado_por_familia` y `modo_captura` `tecleado` los estampa
 * el servidor: no son parámetros porque por esta puerta no entra nadie más.
 */
export async function registrarRecuerdoFamilia(
  input: RecuerdoInput,
): Promise<ResultadoWrapper<{ hitoId: string; eventoId: string }, CodigoErrorRecuerdo>> {
  const { data, error } = await getClient().rpc('registrar_recuerdo_familia', {
    p_mascota_id: input.mascotaId,
    ...(input.texto !== undefined ? { p_texto: input.texto } : null),
    ...(input.fecha !== undefined ? { p_fecha: input.fecha } : null),
    ...(input.fotoPath !== undefined ? { p_foto_url: input.fotoPath } : null),
  });

  if (error) {
    const raw = error.message;
    // Normalización por PREFIJO: el motor manda 'foto_invalida: <por qué>'.
    const codigo =
      raw.startsWith('auth_required') ? 'acceso_denegado'
      : (CODIGOS_RECUERDO.find((c) => raw.startsWith(c)) ?? 'error_desconocido');
    return { ok: false, codigo, mensaje: MENSAJES_RECUERDO[codigo] };
  }

  const o = data as Record<string, unknown> | null;
  if (o === null || typeof o !== 'object' || o.ok !== true
      || typeof o.hito_id !== 'string' || typeof o.evento_id !== 'string') {
    return { ok: false, codigo: 'error_desconocido', mensaje: MENSAJES_RECUERDO.error_desconocido };
  }
  return { ok: true, data: { hitoId: o.hito_id, eventoId: o.evento_id } };
}
