// Wrappers del PAQUETE DE SALIDAS (S57-A2 — D-343, espec firmada:
// MODELO_PASEO v1.3 §6bis + financiero v2.7 Decisión T/7.15 + P16).
// La plata: UN pago simulado declarado al comprar — jamás toca el ledger;
// reservar confirma la cita SIN pago (el pago fue el del paquete, tercer
// escritor del invariante 'pagada'); cancelar ≥2 h devuelve la salida al
// saldo. El server manda (comprar_paquete_salidas / reservar_salida_paquete
// / cancelar_reserva_paquete — migración 20260712180000); acá solo viaja
// el contrato. Patrón canónico: códigos tipados + normalización por
// prefijo (L-115) + guards contra el retorno REAL (L-124).

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

// ── Códigos de error (verificados contra los RAISE de cada body) ────────────

const CODIGOS_ERROR_PAQUETE = [
  'acceso_denegado',
  'sin_familia',
  'mascota_no_elegible',
  'preset_invalido',
  'prestador_inactivo',
  'servicio_no_disponible',
  'paquete_no_disponible',
  'pago_no_disponible',
  'sin_saldo_paquete',
  'slot_invalido',
  'slot_en_pasado',
  'fuera_de_horario',
  'slot_ocupado',
  'prestador_no_disponible',
  'cita_no_encontrada',
  'cita_no_es_de_paquete',
  'cita_estado_invalido',
  'ventana_vencida',
] as const;

export type CodigoErrorPaquete = (typeof CODIGOS_ERROR_PAQUETE)[number];

const MENSAJES_ERROR_PAQUETE: Record<
  CodigoErrorPaquete | 'error_desconocido' | 'datos_inconsistentes',
  string
> = {
  acceso_denegado:       'No tenés acceso para hacer esto.',
  sin_familia:           'Tu hogar todavía no está creado — completá el registro primero.',
  mascota_no_elegible:   'El paseo es para perros — esta mascota no puede reservarlo.',
  preset_invalido:       'Los paquetes son de 5, 10 o 15 salidas.',
  prestador_inactivo:    'Este paseador no está disponible.',
  servicio_no_disponible: 'Este servicio ya no está disponible.',
  paquete_no_disponible: 'Este paseador no ofrece paquetes para esta duración.',
  pago_no_disponible:    'Este paseador todavía no puede recibir pagos por la app.',
  sin_saldo_paquete:     'No te quedan salidas en el paquete para esa fecha.',
  slot_invalido:         'El horario elegido no es válido.',
  slot_en_pasado:        'Ese horario ya pasó — elegí otro.',
  fuera_de_horario:      'El paseador no atiende en ese horario.',
  slot_ocupado:          'Ese horario acaba de ocuparse — elegí otro.',
  prestador_no_disponible: 'El paseador no está disponible en esa fecha — elegí otra.',
  cita_no_encontrada:    'La salida no existe o ya no es accesible.',
  cita_no_es_de_paquete: 'Esa salida no es parte de un paquete.',
  cita_estado_invalido:  'Esa salida ya no se puede cancelar.',
  ventana_vencida:       'Faltan menos de 2 horas — esta salida ya no se puede cancelar.',
  datos_inconsistentes:  'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:     'Ocurrió un error inesperado. Probá de nuevo.',
};

function normalizarCodigo(raw: string): CodigoErrorPaquete | 'error_desconocido' {
  if (raw === 'auth_required' || raw === 'no_access_to_mascota') return 'acceso_denegado';
  // Errores del lado prestador/motor: un solo hecho honesto para el dueño.
  if (
    raw.startsWith('cuenta_sin_rol_activo') ||
    raw.startsWith('cuenta_no_activa') ||
    raw.startsWith('prestador_sin_cuenta_comercial') ||
    raw.startsWith('sin_fee_config')
  ) {
    return 'pago_no_disponible';
  }
  for (const codigo of CODIGOS_ERROR_PAQUETE) {
    if (raw.startsWith(codigo)) return codigo;
  }
  return 'error_desconocido';
}

function mapeoError<T>(mensajeOriginal: string): ResultadoWrapper<T, CodigoErrorPaquete> {
  const codigo = normalizarCodigo(mensajeOriginal);
  return { ok: false, codigo, mensaje: MENSAJES_ERROR_PAQUETE[codigo] };
}

type Obj = Record<string, unknown>;
function esObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null;
}

/** Los presets del paquete — EN LETRA (MODELO_PASEO §6bis.1), espejo del CHECK server-side. */
export const PRESETS_PAQUETE = [5, 10, 15] as const;
export type PresetPaquete = (typeof PRESETS_PAQUETE)[number];

// ── Comprar (la compra ES la renovación: el rollover lo decide el server) ────

export interface ComprarPaqueteInput {
  prestador_id: string;
  /** prestador_servicios.id — la oferta del bloque elegida en el flujo. */
  prestador_servicio_id: string;
  unidades: PresetPaquete;
}

export interface PaqueteComprado {
  bono_id: string;
  unidades: number;
  precio_por_unidad: number;
  total: number;
  /** La vigencia MENSUAL declarada — la superficie de compra la dice. */
  vence_el: string;
  /** Salidas sin usar del paquete anterior que se sumaron (rollover P16e). */
  salidas_rollover: number;
  saldo_total: number;
}

/**
 * Compra el paquete: UN pago simulado declarado (jamás toca el ledger —
 * Decisión T). EL PAQUETE ES DEL HOGAR (v1.4 §6bis.1): sin mascota — la
 * mascota se elige en cada reserva. COMPRAR NO ES RESERVAR (§6bis.2bis):
 * el server jamás crea citas acá. Si hay un paquete vigente con saldo
 * del mismo ancla, sus salidas SE SUMAN (rollover server-side, FIFO a
 * precio de origen). El total y la vigencia vuelven del server.
 */
export async function comprarPaqueteSalidas(
  input: ComprarPaqueteInput,
): Promise<ResultadoWrapper<PaqueteComprado, CodigoErrorPaquete>> {
  const supabase = getClient();
  const { data, error } = await supabase.rpc('comprar_paquete_salidas', {
    p_prestador_id: input.prestador_id,
    p_servicio_id: input.prestador_servicio_id,
    p_unidades: input.unidades,
  });
  if (error) return mapeoError(error.message);

  const o = data as Obj | null;
  if (
    !esObj(o) || o.ok !== true ||
    typeof o.bono_id !== 'string' ||
    typeof o.vence_el !== 'string'
  ) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES_ERROR_PAQUETE.datos_inconsistentes };
  }
  return {
    ok: true,
    data: {
      bono_id: o.bono_id,
      unidades: Number(o.unidades),
      precio_por_unidad: Number(o.precio_por_unidad),
      total: Number(o.total),
      vence_el: o.vence_el,
      salidas_rollover: Number(o.salidas_rollover),
      saldo_total: Number(o.saldo_total),
    },
  };
}

// ── Reservar contra saldo (comprar NO es reservar — §6bis) ──────────────────

export interface ReservarSalidaInput {
  prestador_id: string;
  prestador_servicio_id: string;
  mascota_id: string;
  /** yyyy-mm-dd — del CUÁNDO de siempre (motor de ventana). */
  fecha: string;
  /** HH:MM */
  hora: string;
}

export interface SalidaReservada {
  cita_id: string;
  bono_id: string;
  fecha: string;
  hora: string;
  saldo_restante: number;
}

/**
 * Reserva una salida CONTRA EL SALDO: la cita nace firme y cubierta SIN
 * pago (el pago fue el del paquete — invariante ampliado S57). El server
 * elige el bono FIFO (las salidas más viejas primero, a su precio de origen).
 */
export async function reservarSalidaPaquete(
  input: ReservarSalidaInput,
): Promise<ResultadoWrapper<SalidaReservada, CodigoErrorPaquete>> {
  const supabase = getClient();
  const { data, error } = await supabase.rpc('reservar_salida_paquete', {
    p_prestador_id: input.prestador_id,
    p_servicio_id: input.prestador_servicio_id,
    p_mascota_id: input.mascota_id,
    p_fecha: input.fecha,
    p_hora: input.hora,
  });
  if (error) return mapeoError(error.message);

  const o = data as Obj | null;
  if (!esObj(o) || o.ok !== true || typeof o.cita_id !== 'string') {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES_ERROR_PAQUETE.datos_inconsistentes };
  }
  return {
    ok: true,
    data: {
      cita_id: o.cita_id,
      bono_id: String(o.bono_id),
      fecha: String(o.fecha),
      hora: String(o.hora),
      saldo_restante: Number(o.saldo_restante),
    },
  };
}

/** P16(b): con ≥2 h la salida VUELVE al saldo y la franja se libera. */
export async function cancelarReservaPaquete(
  citaId: string,
): Promise<ResultadoWrapper<{ saldo: number }, CodigoErrorPaquete>> {
  const supabase = getClient();
  const { data, error } = await supabase.rpc('cancelar_reserva_paquete', { p_cita_id: citaId });
  if (error) return mapeoError(error.message);
  const o = data as Obj | null;
  if (!esObj(o) || o.ok !== true) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES_ERROR_PAQUETE.datos_inconsistentes };
  }
  return { ok: true, data: { saldo: Number(o.saldo) } };
}

// ── El saldo visible (lecturas por RLS solo-comprador) ──────────────────────

export interface PaqueteSalidas {
  id: string;
  prestador_id: string;
  /** La oferta del bloque (prestador_servicios.id) — null si el prestador la borró. */
  prestador_servicio_id: string | null;
  mascota_id: string | null;
  estado: string;
  unidades_total: number;
  unidades_usadas: number;
  saldo: number;
  duracion_minutos: number | null;
  precio_por_unidad: number | null;
  fecha_compra: string;
  /** La vigencia declarada al comprar (§6bis.2). */
  fecha_vencimiento: string | null;
}

/** Los paquetes del dueño (todos los estados — la superficie decide qué pinta). */
export async function obtenerMisPaquetesSalidas(): Promise<
  ResultadoWrapper<PaqueteSalidas[], CodigoErrorPaquete>
> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('bonos')
    .select('id, prestador_id, prestador_servicio_id, mascota_id, estado, unidades_total, unidades_usadas, duracion_minutos, precio_por_unidad, fecha_compra, fecha_vencimiento')
    .eq('tipo_servicio', 'paseo')
    .order('fecha_compra', { ascending: false });
  if (error) return mapeoError(error.message);

  const paquetes: PaqueteSalidas[] = [];
  for (const fila of data ?? []) {
    if (typeof fila.id !== 'string' || typeof fila.estado !== 'string') {
      return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES_ERROR_PAQUETE.datos_inconsistentes };
    }
    paquetes.push({
      id: fila.id,
      prestador_id: fila.prestador_id,
      prestador_servicio_id: fila.prestador_servicio_id ?? null,
      mascota_id: fila.mascota_id ?? null,
      estado: fila.estado,
      unidades_total: Number(fila.unidades_total),
      unidades_usadas: Number(fila.unidades_usadas),
      saldo: Number(fila.unidades_total) - Number(fila.unidades_usadas),
      duracion_minutos: fila.duracion_minutos === null ? null : Number(fila.duracion_minutos),
      precio_por_unidad: fila.precio_por_unidad === null ? null : Number(fila.precio_por_unidad),
      fecha_compra: String(fila.fecha_compra),
      fecha_vencimiento: fila.fecha_vencimiento === null ? null : String(fila.fecha_vencimiento),
    });
  }
  return { ok: true, data: paquetes };
}

export interface SaldoPaquete {
  saldo: number;
  /** El vencimiento más próximo entre los bonos que aportan saldo. */
  vence_el: string | null;
  duracion_minutos: number | null;
}

/**
 * El saldo VIGENTE del ancla (prestador + oferta) — DEL HOGAR (v1.4):
 * la RLS familiar decide qué bonos ve el usuario; la mascota ya no
 * participa del saldo. null honesto si no hay ninguno.
 */
export async function obtenerSaldoPaquete(input: {
  prestador_id: string;
  prestador_servicio_id: string;
}): Promise<ResultadoWrapper<SaldoPaquete | null, CodigoErrorPaquete>> {
  const supabase = getClient();
  const hoy = new Intl.DateTimeFormat('en-CA').format(new Date());
  const { data, error } = await supabase
    .from('bonos')
    .select('unidades_total, unidades_usadas, fecha_vencimiento, duracion_minutos')
    .eq('tipo_servicio', 'paseo')
    .eq('prestador_id', input.prestador_id)
    .eq('prestador_servicio_id', input.prestador_servicio_id)
    .eq('estado', 'activo')
    .eq('estado_pago', 'pagado')
    .gte('fecha_vencimiento', hoy);
  if (error) return mapeoError(error.message);

  let saldo = 0;
  let vence: string | null = null;
  let duracion: number | null = null;
  for (const fila of data ?? []) {
    saldo += Number(fila.unidades_total) - Number(fila.unidades_usadas);
    const v = fila.fecha_vencimiento === null ? null : String(fila.fecha_vencimiento);
    if (v !== null && (vence === null || v < vence)) vence = v;
    if (duracion === null && fila.duracion_minutos !== null) duracion = Number(fila.duracion_minutos);
  }
  if (saldo <= 0) return { ok: true, data: null };
  return { ok: true, data: { saldo, vence_el: vence, duracion_minutos: duracion } };
}

export interface PaseadorConPaquete {
  prestador_id: string;
  prestador_servicio_id: string;
  prestador_nombre: string;
  servicio_nombre: string;
  duracion_minutos: number;
  precio: number;
  precio_paquete: number;
}

/**
 * Los paseadores que OFRECEN paquete para una duración — SIN ventana
 * (v1.4 §6bis.2bis: comprar no es reservar, la compra jamás exige
 * fecha/hora). Server-side por 7.13: no se oferta quien no puede
 * cobrar. p_servicio_id filtra a UNA oferta (la renovación del hub).
 */
export async function obtenerPaseadoresConPaquete(input: {
  duracion_minutos?: number;
  prestador_servicio_id?: string;
}): Promise<ResultadoWrapper<PaseadorConPaquete[], CodigoErrorPaquete>> {
  const supabase = getClient();
  const { data, error } = await supabase.rpc('obtener_paseadores_con_paquete', {
    p_duracion_minutos: input.duracion_minutos,
    p_servicio_id: input.prestador_servicio_id,
  });
  if (error) return mapeoError(error.message);
  const filas: PaseadorConPaquete[] = [];
  for (const f of (data ?? []) as Obj[]) {
    if (typeof f.prestador_id !== 'string' || typeof f.prestador_servicio_id !== 'string') {
      return { ok: false, codigo: 'datos_inconsistentes', mensaje: MENSAJES_ERROR_PAQUETE.datos_inconsistentes };
    }
    filas.push({
      prestador_id: f.prestador_id,
      prestador_servicio_id: f.prestador_servicio_id,
      prestador_nombre: String(f.prestador_nombre),
      servicio_nombre: String(f.servicio_nombre),
      duracion_minutos: Number(f.duracion_minutos),
      precio: Number(f.precio),
      precio_paquete: Number(f.precio_paquete),
    });
  }
  return { ok: true, data: filas };
}

