// Wrappers del PAQUETE DE SALIDAS (S57-A2 — D-343, espec firmada:
// MODELO_PASEO v1.3 §6bis + financiero v2.7 Decisión T/7.15 + P16).
// La plata: UN pago simulado declarado al comprar — jamás toca el ledger;
// reservar confirma la cita SIN pago (el pago fue el del paquete, tercer
// escritor del invariante 'pagada'); cancelar ≥2 h devuelve la salida al
// saldo. El server manda (comprar_paquete_salidas / reservar_salida_paquete
// / cancelar_reserva_paquete — migración 20260712180000); acá solo viaja
// el contrato. Patrón canónico: códigos tipados + normalización por
// prefijo (L-115) + guards contra el retorno REAL (L-124).

import { getClient, misFamiliasVigentes, uidActual } from '../client';
import type { ResultadoWrapper } from '../resultado';
/* La marca de «se venció la ventana de pago» se DERIVA con la función de la
   casa, jamás con una copia — S108-A la exporta para eso. */
import { bonoNoPagadoATiempo } from './pagos-espera';

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
  // S82-A r17b: los lectores del hub exigen sesión para poder declarar
  // desde qué rol preguntan (ver `obtenerMisPaquetesSalidas`).
  'sin_sesion',
  // …y si la membresía familiar no se puede leer, el saldo NO se pinta
  // vacío: se dice que falló (L-178 — un fallo jamás se disfraza de
  // "no tenés paquetes", que es mentira con cara de dato).
  'error_familia',
] as const;

export type CodigoErrorPaquete = (typeof CODIGOS_ERROR_PAQUETE)[number];

const MENSAJES_ERROR_PAQUETE: Record<
  CodigoErrorPaquete | 'error_desconocido' | 'datos_inconsistentes',
  string
> = {
  acceso_denegado:       'No tienes acceso para hacer esto.',
  sin_familia:           'Tu hogar todavía no está creado — completa el registro primero.',
  mascota_no_elegible:   'El paseo es para perros — esta mascota no puede reservarlo.',
  preset_invalido:       'Los paquetes son de 5, 10 o 15 salidas.',
  prestador_inactivo:    'Este paseador no está disponible.',
  servicio_no_disponible: 'Este servicio ya no está disponible.',
  paquete_no_disponible: 'Este paseador no ofrece paquetes para esta duración.',
  pago_no_disponible:    'Este paseador todavía no puede recibir pagos por la app.',
  sin_saldo_paquete:     'No te quedan salidas en el paquete para esa fecha.',
  slot_invalido:         'El horario elegido no es válido.',
  slot_en_pasado:        'Ese horario ya pasó — elige otro.',
  fuera_de_horario:      'El paseador no atiende en ese horario.',
  slot_ocupado:          'Ese horario acaba de ocuparse — elige otro.',
  prestador_no_disponible: 'El paseador no está disponible en esa fecha — elige otra.',
  cita_no_encontrada:    'La salida no existe o ya no es accesible.',
  cita_no_es_de_paquete: 'Esa salida no es parte de un paquete.',
  cita_estado_invalido:  'Esa salida ya no se puede cancelar.',
  ventana_vencida:       'Faltan menos de 2 horas — esta salida ya no se puede cancelar.',
  sin_sesion:            'No hay sesión activa.',
  error_familia:         'No pudimos leer tu hogar — prueba de nuevo.',
  datos_inconsistentes:  'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:     'Ocurrió un error inesperado. Prueba de nuevo.',
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

// ── El saldo visible (lecturas que DECLARAN el rol del que pregunta) ────────

/**
 * El filtro de PostgREST que espeja, literal, la pata del dueño de
 * `bonos_pet_parent_own`: `user_id = auth.uid() OR familia_id IN (…)`.
 *
 * Una sola verdad para los dos lectores del hub — si mañana la policy
 * gana una pata, se cambia acá y los dos la heredan (la alternativa era
 * clonar el predicado en dos sitios, que es exactamente cómo nacen las
 * divergencias que esta sesión viene curando).
 */
/**
 * ✏️ EXPORTADA en S107-A. La usa también el lector de paquetes de guardería.
 * 🔴 **No se re-implementa allá:** este filtro decide QUIÉN ve el saldo de un
 * hogar, y dos copias del mismo criterio de acceso divergen — la que se olvide
 * de la pata `familia_id` deja a media familia sin ver su propio paquete.
 */
export async function puertaDelDueno(): Promise<
  { ok: true; filtro: string } | { ok: false; codigo: 'sin_sesion' | 'error_familia' }
> {
  const uid = await uidActual();
  if (uid === null) return { ok: false, codigo: 'sin_sesion' };
  const fam = await misFamiliasVigentes();
  if (!fam.ok) return { ok: false, codigo: 'error_familia' };
  const patas = [`user_id.eq.${uid}`];
  // `familia_id.in.()` con lista vacía es sintaxis inválida — sin
  // familias, la pata simplemente no existe (y la del comprador alcanza).
  if (fam.familias.length > 0) patas.push(`familia_id.in.(${fam.familias.join(',')})`);
  return { ok: true, filtro: patas.join(',') };
}

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
  /**
   * ⭐ **S108-C-4 · EL PAGO, que este lector no traía.** El crudo de la base:
   * `pendiente` · `pagado` · `reembolsado`.
   *
   * 🔴 Sin él, **la superficie no podía decidir por pago aunque el docstring de
   * abajo diga que decide ella**: el dato no llegaba. Y con el bono a punto de
   * nacer `pendiente`, eso deja un paquete NO PAGADO pintándose como saldo
   * gastable — *la misma rotura que S108-A ya curó del lado de guardería.*
   * Espejo exacto de `PaqueteCompradoGuarderia.estadoPago`.
   */
  estadoPago: string;
  /**
   * `true` cuando el paquete murió porque **se venció su ventana de pago**, no
   * por un reverso ni por saldo vencido. *«No llegaste a pagarlo» y «te
   * devolvimos la plata» son dos finales que la familia vive distinto.*
   *
   * Se deriva con `bonoNoPagadoATiempo`, **la misma función que usa guardería**
   * — no se reimplementa la marca: *dos derivaciones de la misma verdad son dos
   * lugares donde una puede quedarse vieja.*
   */
  noPagadoATiempo: boolean;
}

/**
 * Los paquetes del dueño (todos los estados — la superficie decide qué pinta).
 *
 * ══ POR QUÉ DECLARA SU ROL EN VEZ DE APOYARSE EN LA RLS ══
 * (S82-A r17b — hermano exacto de `obtenerMisPlanesPaseo`, mismo defecto
 *  y MISMA PANTALLA; reporte en
 *  `docs/relevamientos/2026-07-31-s82a-r17-suscripciones.md`)
 *
 * `bonos` tiene **CUATRO puertas de lectura** —dueño, prestador,
 * empleado, admin— y las cuatro son correctas. Este lector dice "MIS
 * paquetes" y hasta hoy no declaraba desde cuál preguntaba: en una
 * cuenta de **doble papel** (dueño Y paseador, el caso normal de un
 * groomer con perro) el hub de la familia pintaba el saldo de los
 * paquetes que esa persona **VENDIÓ**.
 *
 * **EL FILTRO ES EL ESPEJO DEL PREDICADO, NO UN `.eq('user_id')`** — y
 * esa es la diferencia con el plan. La puerta del dueño de `bonos` tiene
 * DOS patas (`user_id = auth.uid() OR familia_id IN (mis vigentes)`)
 * porque **el paquete es DEL HOGAR** (v1.4 §6bis): quien compra y quien
 * usa pueden ser distintos. Filtrar por comprador habría escondido el
 * saldo al resto de la familia — un defecto peor que el curado. Medir el
 * literal antes de elegir la columna fue lo que lo evitó.
 */
export async function obtenerMisPaquetesSalidas(): Promise<
  ResultadoWrapper<PaqueteSalidas[], CodigoErrorPaquete>
> {
  const supabase = getClient();
  const puerta = await puertaDelDueno();
  if (!puerta.ok) return { ok: false, codigo: puerta.codigo, mensaje: MENSAJES_ERROR_PAQUETE[puerta.codigo] };
  const { data, error } = await supabase
    .from('bonos')
    .select('id, prestador_id, prestador_servicio_id, mascota_id, estado, unidades_total, unidades_usadas, duracion_minutos, precio_por_unidad, fecha_compra, fecha_vencimiento, estado_pago, pago_metadata')
    .eq('tipo_servicio', 'paseo')
    .or(puerta.filtro)
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
      estadoPago: typeof fila.estado_pago === 'string' ? fila.estado_pago : '',
      noPagadoATiempo: bonoNoPagadoATiempo(fila.pago_metadata),
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
 * el paquete es del hogar y la mascota se elige por reserva, así que el
 * saldo lo ve toda la familia. null honesto si no hay ninguno.
 *
 * DECLARA SU ROL igual que su hermano (r17b), y acá el borde es MÁS
 * filoso: este lector está keyed por prestador, no por dueño, y alimenta
 * el flujo de COMPRA/RESERVA. Un dueño que además es paseador, mirando
 * su propia oferta, veía **sumado el saldo de los paquetes que le
 * compraron sus clientes** — un número ajeno entrando a una pantalla
 * donde decide plata. La clave del ancla no protege: solo acota.
 */
export async function obtenerSaldoPaquete(input: {
  prestador_id: string;
  prestador_servicio_id: string;
}): Promise<ResultadoWrapper<SaldoPaquete | null, CodigoErrorPaquete>> {
  const supabase = getClient();
  const puerta = await puertaDelDueno();
  if (!puerta.ok) return { ok: false, codigo: puerta.codigo, mensaje: MENSAJES_ERROR_PAQUETE[puerta.codigo] };
  const hoy = new Intl.DateTimeFormat('en-CA').format(new Date());
  const { data, error } = await supabase
    .from('bonos')
    .select('unidades_total, unidades_usadas, fecha_vencimiento, duracion_minutos')
    .eq('tipo_servicio', 'paseo')
    .eq('prestador_id', input.prestador_id)
    .eq('prestador_servicio_id', input.prestador_servicio_id)
    .eq('estado', 'activo')
    .eq('estado_pago', 'pagado')
    .gte('fecha_vencimiento', hoy)
    .or(puerta.filtro);
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

