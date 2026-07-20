// La RESERVA DE GROOMING del lado DUEÑO (S60-A1, MODELO_GROOMING §2/§5/§6/§7
// sobre el chasis del paseo). Patrón canónico del monorepo (ver
// agendamiento.ts): códigos tipados + normalización por prefijo (L-115) +
// guards de shape contra el RETURNS real de la migración 20260714020000
// (L-124) + ResultadoWrapper discriminated union.
//
// Decisiones que este archivo implementa (visto del arquitecto S60):
// - El PRECIO y la DURACIÓN llegan RESUELTOS del server (servicio × talla
//   del perfil + extra si pelaje largo) — el cliente pinta, JAMÁS calcula.
//   La duración no es menú del dueño: es consecuencia (§6).
// - talla_no_declarada es RED, no flujo: la puerta TallaPelajeHoja declara
//   antes de pedir precios personalizados (declararTallaPelaje, molde P19).
// - El DÓNDE viaja en el QUIÉN (direccion/ciudad de la sede, NULL honesto —
//   grooming v1 es EN EL LOCAL, D-380).
// - El hold y el pago son los del chasis compartido: crearBloqueoAgenda y
//   confirmarCitaPagada de agendamiento.ts se consumen TAL CUAL.

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

// ── Talla y pelaje del perfil (espejo de los CHECKs de mascotas) ────────────

export const TALLAS_MASCOTA = ['S', 'M', 'L'] as const;
export type TallaMascota = (typeof TALLAS_MASCOTA)[number];

export const PELAJES_MASCOTA = ['normal', 'largo'] as const;
export type PelajeMascota = (typeof PELAJES_MASCOTA)[number];

// ── Códigos de error (verificados contra los RAISE de cada body) ────────────

const CODIGOS_ERROR_GROOMING_RESERVA = [
  'acceso_denegado',
  // §3: la mascota aún no declaró talla — la UI pregunta, jamás adivina.
  'talla_no_declarada',
  // §5: techo perro+gato (o el acote del groomer); la UI filtra, la DB manda.
  'mascota_no_elegible',
  'servicio_invalido',
  'slot_invalido',
  'talla_invalida',
  'pelaje_invalido',
  'mascota_sin_familia',
] as const;

export type CodigoErrorGroomingReserva =
  (typeof CODIGOS_ERROR_GROOMING_RESERVA)[number];

const MENSAJES: Record<
  CodigoErrorGroomingReserva | 'error_desconocido' | 'datos_inconsistentes',
  string
> = {
  acceso_denegado:      'No tenés acceso para hacer esto.',
  talla_no_declarada:   'Falta declarar la talla de tu mascota.',
  mascota_no_elegible:  'El grooming todavía no está disponible para esta mascota.',
  servicio_invalido:    'Este servicio ya no está disponible.',
  slot_invalido:        'El horario elegido no es válido.',
  talla_invalida:       'La talla elegida no es válida.',
  pelaje_invalido:      'El pelaje elegido no es válido.',
  mascota_sin_familia:  'Esta mascota todavía no tiene una familia armada.',
  datos_inconsistentes: 'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:    'Ocurrió un error inesperado. Probá de nuevo.',
};

function normalizarCodigo(raw: string): CodigoErrorGroomingReserva | 'error_desconocido' {
  if (raw === 'auth_required' || raw.startsWith('no_access_to_mascota')) {
    return 'acceso_denegado';
  }
  if (raw.startsWith('ventana_invalida')) return 'slot_invalido';
  // Códigos con sufijo ': <detalle>' — normalizar por prefijo (L-115).
  for (const codigo of CODIGOS_ERROR_GROOMING_RESERVA) {
    if (raw.startsWith(codigo)) return codigo;
  }
  return 'error_desconocido';
}

function fallo<T>(
  mensajeOriginal: string,
): ResultadoWrapper<T, CodigoErrorGroomingReserva> {
  const codigo = normalizarCodigo(mensajeOriginal);
  return { ok: false, codigo, mensaje: MENSAJES[codigo] };
}

type Obj = Record<string, unknown>;

function esObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null;
}

// ── A · La oferta comprable para SU mascota (selector de servicio) ──────────

export interface OfertaGrooming {
  /** 'grooming' (Baño) | 'grooming_completo' (Baño y corte). */
  tipo_servicio: string;
  /** Voz canónica del catálogo maestro (no la custom por groomer). */
  servicio_nombre: string;
  /** Mínimo REAL entre groomers cobrables, YA resuelto por la talla del
   *  perfil (+ extra si pelaje largo; + recargo si modalidad domicilio).
   *  El server congela al reservar. */
  desde_precio: number;
  /** true = hay más de un precio entre groomers → la UI dice "desde". */
  varia: boolean;
  /** S61 D-392: las modalidades del AGREGADO (sin filtrar por la
   *  elegida) — el selector del QUÉ pregunta SOLO si existen ambas. */
  atiende_local: boolean;
  atiende_domicilio: boolean;
  /** MIN del recargo entre groomers con domicilio (server-side);
   *  null = ninguno atiende domicilio. */
  recargo_domicilio_desde: number | null;
  /** S61-A13 (escalera del precio honesto): true = el recargo VARÍA
   *  entre groomers → la UI dice "desde", jamás un exacto que miente. */
  recargo_domicilio_varia: boolean;
}

/** S61 D-392: la modalidad de la reserva grooming. */
export type ModalidadGrooming = 'local' | 'domicilio';

/** Los comprables del menú de dos capas realmente ofertados HOY por
 *  groomers cobrables (7.13), con el "desde" de ESTA mascota. */
export async function obtenerOfertaGrooming(
  mascotaId: string,
  modalidad: ModalidadGrooming = 'local',
): Promise<ResultadoWrapper<OfertaGrooming[], CodigoErrorGroomingReserva>> {
  const { data, error } = await getClient().rpc('obtener_oferta_grooming', {
    p_mascota_id: mascotaId,
    p_modalidad: modalidad,
  });

  if (error) return fallo(error.message);
  if (!Array.isArray(data)) return fallo('datos_inconsistentes');
  const ofertas: OfertaGrooming[] = [];
  for (const fila of data) {
    if (
      !esObj(fila) ||
      typeof fila.tipo_servicio !== 'string' ||
      typeof fila.servicio_nombre !== 'string' ||
      typeof fila.desde_precio !== 'number' ||
      typeof fila.varia !== 'boolean' ||
      typeof fila.atiende_local !== 'boolean' ||
      typeof fila.atiende_domicilio !== 'boolean'
    ) {
      return fallo('datos_inconsistentes');
    }
    ofertas.push({
      tipo_servicio: fila.tipo_servicio,
      servicio_nombre: fila.servicio_nombre,
      desde_precio: fila.desde_precio,
      varia: fila.varia,
      atiende_local: fila.atiende_local,
      atiende_domicilio: fila.atiende_domicilio,
      recargo_domicilio_desde:
        typeof fila.recargo_domicilio_desde === 'number' ? fila.recargo_domicilio_desde : null,
      recargo_domicilio_varia: fila.recargo_domicilio_varia === true,
    });
  }
  return { ok: true, data: ofertas };
}

// ── A2 · La oferta PÚBLICA — el peldaño 0, sin mascota (S61-A5 cura 3,
// letra founder: los comprables se ven SIEMPRE con su "desde") ──────────────

export interface OfertaGroomingPublica {
  /** 'grooming' | 'grooming_completo' — la voz la pone el riel (vozServicio). */
  tipo_servicio: string;
  /** El mínimo REAL entre TODAS las tallas de las ofertas visibles —
   *  filas reales de prestador_servicio_tallas, jamás cálculo de precio
   *  (el min es selección sobre precios del server, precedente del
   *  "desde" del paseo en el CUÁNDO). */
  desde_precio: number;
  varia: boolean;
}

/**
 * VARIANTE DE LECTURA (la RPC obtener_oferta_grooming EXIGE mascota y
 * talla — relevado): lee por la RLS pública ps_public/pst_public
 * (oferta ACTIVA de prestador ACTIVO). CAVEAT DECLARADO: el gate 7.13
 * completo (cuenta comercial cobrable) vive en el MOTOR y esta lectura
 * no lo replica — un prestador activo sin cuenta cobrable pintaría su
 * "desde" en el peldaño 0 (hoy: cero casos, seeds relevados); al elegir
 * mascota, la verdad firme del motor manda como siempre.
 */
export async function obtenerOfertaGroomingPublica(): Promise<
  ResultadoWrapper<OfertaGroomingPublica[], CodigoErrorGroomingReserva>
> {
  const { data, error } = await getClient()
    .from('prestador_servicio_tallas')
    .select('precio, prestador_servicios!inner(tipo_servicio)')
    .in('prestador_servicios.tipo_servicio', ['grooming', 'grooming_completo']);

  if (error) return fallo(error.message);
  if (!Array.isArray(data)) return fallo('datos_inconsistentes');

  const porTipo = new Map<string, number[]>();
  for (const fila of data) {
    if (!esObj(fila) || typeof fila.precio !== 'number' || !esObj(fila.prestador_servicios)) continue;
    const tipo = fila.prestador_servicios.tipo_servicio;
    if (typeof tipo !== 'string') continue;
    const lista = porTipo.get(tipo) ?? [];
    lista.push(fila.precio);
    porTipo.set(tipo, lista);
  }
  const ofertas: OfertaGroomingPublica[] = [...porTipo.entries()]
    .map(([tipo, precios]) => ({
      tipo_servicio: tipo,
      desde_precio: Math.min(...precios),
      varia: new Set(precios).size > 1,
    }))
    .sort((a, b) => a.desde_precio - b.desde_precio);
  return { ok: true, data: ofertas };
}

// ── B · Inicios disponibles para la grilla del CUÁNDO ───────────────────────
// La duración NO viaja: cada groomer aporta inicios con SU duración de la
// combinación servicio × talla (motor de ventana intacto, §6).

export interface InputIniciosGrooming {
  /** 'YYYY-MM-DD'. */
  fecha: string;
  tipo_servicio: string;
  mascota_id: string;
  /** S61 D-392: default 'local' (comportamiento de siempre). */
  modalidad?: ModalidadGrooming;
}

/** Horas de inicio 'HH:MM' donde ALGÚN groomer puede la ventana entera. */
export async function obtenerIniciosGrooming(
  input: InputIniciosGrooming,
): Promise<ResultadoWrapper<string[], CodigoErrorGroomingReserva>> {
  const { data, error } = await getClient().rpc('obtener_inicios_grooming_disponibles', {
    p_fecha: input.fecha,
    p_tipo_servicio: input.tipo_servicio,
    p_mascota_id: input.mascota_id,
    p_modalidad: input.modalidad ?? 'local',
  });

  if (error) return fallo(error.message);
  if (!Array.isArray(data)) return fallo('datos_inconsistentes');
  const horas: string[] = [];
  for (const fila of data) {
    if (!esObj(fila) || typeof fila.hora !== 'string') {
      return fallo('datos_inconsistentes');
    }
    horas.push(fila.hora.slice(0, 5));
  }
  return { ok: true, data: horas };
}

// ── C · El QUIÉN con el precio resuelto (condición 2 del visto) ─────────────

export interface GroomerDisponible {
  prestador_id: string;
  /** prestador_servicios.id — el identificador de la OFERTA para el hold. */
  prestador_servicio_id: string;
  prestador_nombre: string;
  servicio_nombre: string;
  /** RESUELTO server-side: matriz servicio × talla + extra pelaje largo.
   *  El checkout muestra el snapshot del hold; este número es el espejo. */
  precio: number;
  /** La duración de la combinación — consecuencia, jamás menú (§6). */
  duracion_minutos: number;
  /** El DÓNDE (grooming v1 = en el local): dirección de la sede, o null
   *  honesto si el groomer aún no la declaró. */
  direccion: string | null;
  ciudad: string | null;
  /** S61 D-392: EL DESGLOSE server-side — el checkout lo DECLARA, jamás
   *  lo calcula: precio == precio_base + extra_pelaje + recargo_domicilio. */
  precio_base: number;
  extra_pelaje: number;
  recargo_domicilio: number;
}

export interface InputGroomersDisponibles {
  /** 'YYYY-MM-DD'. */
  fecha: string;
  /** 'HH:MM' — un inicio de la grilla. */
  hora: string;
  tipo_servicio: string;
  mascota_id: string;
  /** S61 D-392: default 'local' (comportamiento de siempre). */
  modalidad?: ModalidadGrooming;
}

/** Groomers cobrables que pueden la ventana entera en ese inicio, con
 *  precio/duración de ESTA mascota y el dónde de su local. */
export async function obtenerGroomersDisponibles(
  input: InputGroomersDisponibles,
): Promise<ResultadoWrapper<GroomerDisponible[], CodigoErrorGroomingReserva>> {
  const { data, error } = await getClient().rpc('obtener_groomers_disponibles', {
    p_fecha: input.fecha,
    p_hora: input.hora,
    p_tipo_servicio: input.tipo_servicio,
    p_mascota_id: input.mascota_id,
    p_modalidad: input.modalidad ?? 'local',
  });

  if (error) return fallo(error.message);
  if (!Array.isArray(data)) return fallo('datos_inconsistentes');
  const groomers: GroomerDisponible[] = [];
  for (const fila of data) {
    if (
      !esObj(fila) ||
      typeof fila.prestador_id !== 'string' ||
      typeof fila.prestador_servicio_id !== 'string' ||
      typeof fila.prestador_nombre !== 'string' ||
      typeof fila.servicio_nombre !== 'string' ||
      typeof fila.precio !== 'number' ||
      typeof fila.duracion_minutos !== 'number'
    ) {
      return fallo('datos_inconsistentes');
    }
    groomers.push({
      prestador_id: fila.prestador_id,
      prestador_servicio_id: fila.prestador_servicio_id,
      prestador_nombre: fila.prestador_nombre,
      servicio_nombre: fila.servicio_nombre,
      precio: fila.precio,
      duracion_minutos: fila.duracion_minutos,
      direccion: typeof fila.direccion === 'string' && fila.direccion.length > 0 ? fila.direccion : null,
      ciudad: typeof fila.ciudad === 'string' && fila.ciudad.length > 0 ? fila.ciudad : null,
      precio_base: typeof fila.precio_base === 'number' ? fila.precio_base : fila.precio,
      extra_pelaje: typeof fila.extra_pelaje === 'number' ? fila.extra_pelaje : 0,
      recargo_domicilio: typeof fila.recargo_domicilio === 'number' ? fila.recargo_domicilio : 0,
    });
  }
  return { ok: true, data: groomers };
}

// ── C2 · Los groomings del hogar (el hub del dueño, S60-A4) ─────────────────
// Lectura DIRECTA por RLS (cero RPC): evento_cita_servicio (solo-dueño) +
// tipos_servicio (ts_public) + prestadores (prestadores_public: el DÓNDE
// ya sembrado en A2) + mascotas (familia) + evento_atencion (acceso por
// mascota — el parte del cierre navega por atencion_id).

export interface GroomingDelHogar {
  cita_id: string;
  /** 'YYYY-MM-DD'. */
  fecha: string;
  /** 'HH:MM'. */
  hora: string;
  /** confirmada | en_curso | completada — solo ciclo de pago vivo. */
  estado: string;
  tipo_servicio: string;
  servicio_nombre: string;
  duracion_minutos: number;
  precio: number | null;
  mascota_id: string | null;
  mascota_nombre: string | null;
  prestador_nombre: string | null;
  /** El DÓNDE (v1 en el local) — null honesto sin dirección declarada. */
  direccion: string | null;
  ciudad: string | null;
  /** SOLO si el grooming cerró con calidad: navega al parte. */
  atencion_id: string | null;
}

/** Las citas de grooming del hogar (verdad firme: solo pagadas). La
 *  superficie decide el corte Próximos/Historial. */
export async function obtenerMisGroomings(): Promise<
  ResultadoWrapper<GroomingDelHogar[], CodigoErrorGroomingReserva>
> {
  const cliente = getClient();
  const [tipos, citas] = await Promise.all([
    cliente.from('tipos_servicio').select('codigo, nombre').eq('categoria', 'grooming'),
    cliente
      .from('evento_cita_servicio')
      .select('id, fecha, hora, estado, duracion_minutos, precio, prestador_id, mascota_id, tipo_servicio, estado_reserva')
      .in('estado', ['confirmada', 'en_curso', 'completada'])
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true }),
  ]);
  if (tipos.error || citas.error) return fallo('error');
  const nombrePorCodigo = new Map(tipos.data.map((t) => [t.codigo, t.nombre]));

  const filas = (citas.data ?? []).filter(
    (c) =>
      c.tipo_servicio !== null &&
      nombrePorCodigo.has(c.tipo_servicio) &&
      // verdad firme del hub: solo el ciclo de pago vivo (el hold nunca
      // pagado no es una sesión)
      c.estado_reserva === 'pagada' &&
      // S72-A: una sesión de grooming pagada tiene fecha firme; una fila
      // sin fecha es data rota, no una sesión — fuera antes de String(null).
      c.fecha !== null,
  );
  if (filas.length === 0) return { ok: true, data: [] };

  const prestadorIds = [...new Set(filas.map((c) => c.prestador_id).filter((v): v is string => v !== null))];
  const mascotaIds = [...new Set(filas.map((c) => c.mascota_id).filter((v): v is string => v !== null))];
  const citaIds = filas.map((c) => c.id);

  const [prestadores, mascotas, atenciones] = await Promise.all([
    prestadorIds.length > 0
      ? cliente.from('prestadores').select('id, nombre_comercial, direccion, ciudad').in('id', prestadorIds)
      : Promise.resolve({ data: [], error: null }),
    mascotaIds.length > 0
      ? cliente.from('mascotas').select('id, nombre').in('id', mascotaIds)
      : Promise.resolve({ data: [], error: null }),
    cliente
      .from('evento_atencion')
      .select('id, cita_id')
      .in('cita_id', citaIds)
      .eq('estado', 'cerrada_con_calidad'),
  ]);
  if (prestadores.error || mascotas.error || atenciones.error) return fallo('error');

  const prestadorPorId = new Map((prestadores.data ?? []).map((p) => [p.id, p]));
  const mascotaPorId = new Map((mascotas.data ?? []).map((m) => [m.id, m.nombre]));
  const atencionPorCita = new Map((atenciones.data ?? []).map((a) => [a.cita_id, a.id]));

  return {
    ok: true,
    data: filas.map((c) => {
      const pr = c.prestador_id !== null ? prestadorPorId.get(c.prestador_id) : undefined;
      const tipo = c.tipo_servicio ?? '';
      return {
        cita_id: c.id,
        fecha: String(c.fecha),
        hora: String(c.hora).slice(0, 5),
        estado: c.estado ?? '',
        tipo_servicio: tipo,
        servicio_nombre: nombrePorCodigo.get(tipo) ?? tipo,
        duracion_minutos: Number(c.duracion_minutos),
        precio: c.precio === null ? null : Number(c.precio),
        mascota_id: c.mascota_id ?? null,
        mascota_nombre: c.mascota_id !== null ? mascotaPorId.get(c.mascota_id) ?? null : null,
        prestador_nombre: pr?.nombre_comercial ?? null,
        direccion: pr !== undefined && typeof pr.direccion === 'string' && pr.direccion.length > 0 ? pr.direccion : null,
        ciudad: pr !== undefined && typeof pr.ciudad === 'string' && pr.ciudad.length > 0 ? pr.ciudad : null,
        atencion_id: atencionPorCita.get(c.id) ?? null,
      };
    }),
  };
}

// ── D · Declarar talla y pelaje (la pregunta única de §3, molde P19) ────────

export interface TallaPelajeDeclarados {
  mascota_id: string;
  talla: TallaMascota;
  pelaje: PelajeMascota;
}

/** Declara (o EDITA — §3: "editables siempre") talla y pelaje en el PERFIL.
 *  Sirve las dos superficies: la Hoja de la reserva y la edición desde el
 *  perfil de la mascota. A diferencia de la social (P19), acá no hay rama
 *  que frene: declarar SIEMPRE continúa. */
export async function declararTallaPelaje(
  mascotaId: string,
  talla: TallaMascota,
  pelaje: PelajeMascota,
): Promise<ResultadoWrapper<TallaPelajeDeclarados, CodigoErrorGroomingReserva>> {
  const { data, error } = await getClient().rpc('declarar_talla_pelaje', {
    p_mascota_id: mascotaId,
    p_talla: talla,
    p_pelaje: pelaje,
  });

  if (error) return fallo(error.message);
  const o = data as Record<string, unknown> | null;
  if (
    o === null ||
    typeof o !== 'object' ||
    o.ok !== true ||
    typeof o.mascota_id !== 'string' ||
    (o.talla !== 'S' && o.talla !== 'M' && o.talla !== 'L') ||
    (o.pelaje !== 'normal' && o.pelaje !== 'largo')
  ) {
    return fallo('datos_inconsistentes');
  }
  return {
    ok: true,
    data: { mascota_id: o.mascota_id, talla: o.talla, pelaje: o.pelaje },
  };
}
