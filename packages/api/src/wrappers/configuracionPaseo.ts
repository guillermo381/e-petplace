// Configuración del servicio de paseo — S55-B (B2, decisión founder S55:
// el prestador gobierna su propia oferta).
//
// MODELO CERRADO: duraciones = menú canónico 30/60/120/180/240/300 (máx
// 300 — más de 5 h es guardería, no paseo). Precio POR BLOQUE. La
// recurrencia/paquete mensual es capa posterior (MODELO_FINANCIERO v2.5
// + política P14 + motor — NO vive acá).
//
// MOTOR DE OCUPACIÓN POR VENTANA: el hallazgo S55-B (la cita no guardaba
// duración; crear_bloqueo validaba cupo solo sobre el slot → doble-booking
// parcial en bloques >30') lo curó la Sesión A en S55-A B2 — verificado
// LITERAL contra DB viva antes de levantar la guarda temporal de esta
// tanda: la cita guarda duracion_minutos, la ventana completa se valida
// contra la franja y _agenda_ocupacion cuenta el máximo solape. Todos
// los bloques del menú nacen ofertables.
//
// Camino de escritura relevado y PROBADO S55-B (sonda con ROLLBACK):
// el owner escribe directo por RLS (prestador_servicios_own /
// prestador_horarios_own, ALL con WITH CHECK por prestadores.user_id).
// La RLS es la puerta — cero RPC nueva, cero L-140 acá.

import { getClient, uidActual } from '../client';
import type { Database } from '../database.types';
import type { ResultadoWrapper } from '../resultado';
import { resolverPersonaDeFranja } from './titular';

type UpdateOferta = Database['public']['Tables']['prestador_servicios']['Update'];
type UpdateFranja = Database['public']['Tables']['prestador_horarios']['Update'];

const MENSAJES = {
  sin_sesion:             'No hay sesión activa.',
  bloque_invalido:        'Esa duración no está en el menú de paseos.',
  precio_invalido:        'El precio tiene que ser mayor a cero.',
  bloque_duplicado:       'Ya ofreces un paseo de esa duración.',
  precio_plan_invalido:   'El precio del plan tiene que ser mayor a cero. Déjalo vacío si no ofreces plan.',
  precio_mensual_plan_invalido: 'El precio mensual del plan tiene que ser mayor a cero. Déjalo vacío si no ofreces plan.',
  precio_paquete_invalido: 'El precio por salida del paquete tiene que ser mayor a cero. Déjalo vacío si no ofreces paquete.',
  rango_horario_invalido: 'La hora de fin tiene que ser después de la de inicio.',
  franja_solapada:        'Esa franja se cruza con una que ya tienes ese día.',
  /* ⚠️ EL MENSAJE ES PARTE DEL GUARD (candidata #21, y acá cobró).
     Decía «entre 1 y 4» — un literal que sobrevivió a la cura del PREDICADO en
     S85-A18: el guard pasó a validar contra el techo del catálogo (hoy 10) y
     el texto siguió anunciando 4. **Es D-622 en el otro sentido: no calla —
     HABLA, y dice el número equivocado.** Y su modo de falla es de los peores:
     el prestador lee un tope que la casa ya no aplica, y no tiene forma de
     saber que el rebote le miente.
     Ahora el número se INTERPOLA del mismo valor contra el que se validó, así
     que no pueden divergir otra vez — es la misma receta que `contrasena_debil`
     usa con MIN_LARGO. Cuando D-638 (d) llegue, el techo será el del servicio y
     este mensaje lo dirá solo, sin tocarlo. */
  cupo_invalido:          'Ese cupo está fuera de lo permitido.',
  dia_invalido:           'El día no es válido.',
  empleado_invalido:      'Esa persona no trabaja en tu negocio.',
  no_encontrada:          'No encontramos ese registro tuyo.',
  datos_inconsistentes:   'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:      'Ocurrió un error inesperado. Prueba de nuevo.',
} as const;

export type CodigoErrorConfiguracionPaseo = keyof typeof MENSAJES;

type Falla = { ok: false; codigo: CodigoErrorConfiguracionPaseo; mensaje: string };
function falla(codigo: CodigoErrorConfiguracionPaseo): Falla {
  return { ok: false, codigo, mensaje: MENSAJES[codigo] };
}

/** El menú canónico de bloques (decisión founder S55). El 30 es la "Salida corta" (voz firmada S56). */
export const BLOQUES_PASEO = [30, 60, 120, 180, 240, 300] as const;
export type BloquePaseo = (typeof BLOQUES_PASEO)[number];

export interface OfertaPaseoPropia {
  id: string;
  duracionMinutos: number;
  precio: number;
  /**
   * JUBILADA (S79, reforma del plan mensual): el per-salida del plan
   * murió del camino de cobro — el motor no la lee. Se conserva en el
   * shape solo mientras el taller de B migra su campo (pedido S79);
   * escribirla YA NO afecta ningún cobro. NO consumir en código nuevo.
   */
  precioPlan: number | null;
  /**
   * S79 (reforma): el precio del PERÍODO mensual del plan — la
   * suscripción. null = el prestador NO ofrece plan en este bloque
   * (contratar rebota `plan_no_ofrecido`; jamás fallback al suelto).
   */
  precioMensualPlan: number | null;
  /**
   * Precio POR SALIDA cuando el bloque se compra como PAQUETE de salidas
   * (D-343, S57 — patrón idéntico a precioPlan: columna
   * prestador_servicios.precio_paquete, SIN CHECK relacional).
   * null = el prestador NO ofrece paquete en este bloque; la superficie
   * de compra del dueño no aparece. Presets 5/10/15 fijos por letra
   * (MODELO_PASEO §6bis) — el prestador configura SOLO este precio.
   */
  precioPaquete: number | null;
  nombre: string | null;
  descripcion: string | null;
  activo: boolean;
}

export interface FranjaHorario {
  id: string;
  /** 0=Domingo … 6=Sábado (regla 32, sin transformaciones). */
  diaSemana: number;
  /** 'HH:MM' */
  horaInicio: string;
  horaFin: string;
  duracionSlotMinutos: number;
  maxCitasPorSlot: number;
  activo: boolean;
  /**
   * EL TOPE que la plataforma permite para `maxCitasPorSlot` — **el mayor
   * `cupo_techo` entre los oficios ACTIVOS de este prestador** (S85, D-638).
   *
   * ⚠️ **ES UNA PROPIEDAD DEL PRESTADOR, NO DE LA FRANJA — y viaja repetida en
   * cada fila solo por transporte.** Las 56 franjas vivas son UNIVERSALES
   * (`servicio_id IS NULL`, `modo_horarios='universal'`), así que **una franja
   * no sabe de qué oficio es** y la pregunta *"¿cuál es el tope de esta
   * franja?"* no tiene respuesta única: la de Paseos Andres sirve a paseo
   * (techo 10), grooming (1), grooming_completo (1) y adiestramiento (1).
   *
   * **⇒ LA SUPERFICIE TIENE QUE DECIRLO, no esconderlo** (condición de la
   * mesa): *con franjas universales el tope es del PRESTADOR, no de la
   * franja.* Un control que muestre 10 sin esa aclaración **miente para tres
   * de los cuatro oficios** de ese prestador — el `LEAST` del motor les seguirá
   * dando 1.
   *
   * ☠️ **ES UN PALIATIVO DE D-638, y se dice con esa palabra para que nadie lo
   * lea como la solución final.** **La respuesta buena es (D): franjas POR
   * SERVICIO** — ahí la pregunta tiene respuesta única y este campo deja de
   * existir. *Mientras tanto, esto es lo más cerca de la verdad que el dato
   * universal permite, y por eso se acepta: sin él la app hardcodea el número,
   * que envejece con el próximo cambio de techo.*
   *
   * `1` cuando el prestador no tiene oficios activos con techo declarado — que
   * es el default correcto (exclusivo), no un fallback inventado.
   */
  cupoTechoMaximo: number;
}

function aHoraCorta(v: string): string {
  return v.slice(0, 5);
}

function mapearOferta(fila: {
  id: string;
  duracion_minutos: number | null;
  precio: number;
  precio_plan: number | null;
  precio_mensual_plan: number | null;
  precio_paquete: number | null;
  nombre_custom: string | null;
  descripcion: string | null;
  activo: boolean;
}): OfertaPaseoPropia {
  return {
    id: fila.id,
    duracionMinutos: fila.duracion_minutos ?? 30,
    precio: fila.precio,
    precioPlan: fila.precio_plan,
    precioMensualPlan: fila.precio_mensual_plan,
    precioPaquete: fila.precio_paquete,
    nombre: fila.nombre_custom,
    descripcion: fila.descripcion,
    activo: fila.activo,
  };
}

const SELECT_OFERTA = 'id, duracion_minutos, precio, precio_plan, precio_mensual_plan, precio_paquete, nombre_custom, descripcion, activo';

/** Los bloques de paseo del prestador propio, del más corto al más largo. */
export async function obtenerOfertasPaseoPropias(
  prestadorId: string,
): Promise<ResultadoWrapper<OfertaPaseoPropia[], CodigoErrorConfiguracionPaseo>> {
  if ((await uidActual()) === null) return falla('sin_sesion');

  const { data, error } = await getClient()
    .from('prestador_servicios')
    .select(SELECT_OFERTA)
    .eq('prestador_id', prestadorId)
    .eq('tipo_servicio', 'paseo')
    .order('duracion_minutos', { ascending: true });

  if (error || !Array.isArray(data)) return falla('error_desconocido');
  return { ok: true, data: data.map(mapearOferta) };
}

export interface InputCrearOfertaPaseo {
  prestadorId: string;
  duracionMinutos: number;
  precio: number;
  /** JUBILADA S79 (ver shape) — solo mientras B migra el taller. */
  precioPlan?: number | null;
  /** S79: precio del MES del plan; ausente/null = sin plan en este bloque. */
  precioMensualPlan?: number | null;
  /** Precio por salida en paquete; ausente/null = sin paquete en este bloque (D-343). */
  precioPaquete?: number | null;
  nombre?: string;
  descripcion?: string;
}

/** Crea un bloque del menú canónico. Nace activo (ofertable al cliente). */
export async function crearOfertaPaseo(
  input: InputCrearOfertaPaseo,
): Promise<ResultadoWrapper<OfertaPaseoPropia, CodigoErrorConfiguracionPaseo>> {
  if ((await uidActual()) === null) return falla('sin_sesion');

  if (!BLOQUES_PASEO.includes(input.duracionMinutos as BloquePaseo)) return falla('bloque_invalido');
  if (!Number.isFinite(input.precio) || input.precio <= 0) return falla('precio_invalido');
  if (
    input.precioPlan !== undefined &&
    input.precioPlan !== null &&
    (!Number.isFinite(input.precioPlan) || input.precioPlan <= 0)
  ) {
    return falla('precio_plan_invalido');
  }
  if (
    input.precioMensualPlan !== undefined &&
    input.precioMensualPlan !== null &&
    (!Number.isFinite(input.precioMensualPlan) || input.precioMensualPlan <= 0)
  ) {
    return falla('precio_mensual_plan_invalido');
  }
  if (
    input.precioPaquete !== undefined &&
    input.precioPaquete !== null &&
    (!Number.isFinite(input.precioPaquete) || input.precioPaquete <= 0)
  ) {
    return falla('precio_paquete_invalido');
  }

  // un bloque por duración: el schema no tiene UNIQUE (relevado S55) —
  // la unicidad se cuida acá y el gate del founder la ratifica en UI
  const { data: existentes, error: errLectura } = await getClient()
    .from('prestador_servicios')
    .select('id, duracion_minutos')
    .eq('prestador_id', input.prestadorId)
    .eq('tipo_servicio', 'paseo');
  if (errLectura || !Array.isArray(existentes)) return falla('error_desconocido');
  if (existentes.some((f) => (f.duracion_minutos ?? 30) === input.duracionMinutos)) {
    return falla('bloque_duplicado');
  }

  const { data, error } = await getClient()
    .from('prestador_servicios')
    .insert({
      prestador_id: input.prestadorId,
      tipo_servicio: 'paseo',
      duracion_minutos: input.duracionMinutos,
      precio: input.precio,
      precio_plan: input.precioPlan ?? null,
      precio_mensual_plan: input.precioMensualPlan ?? null,
      precio_paquete: input.precioPaquete ?? null,
      nombre_custom: input.nombre?.trim() || null,
      descripcion: input.descripcion?.trim() || null,
      activo: true,
      especies_compatibles: ['perro'],
    })
    .select(SELECT_OFERTA)
    .single();

  if (error || data === null) return falla('error_desconocido');
  return { ok: true, data: mapearOferta(data) };
}

export interface InputActualizarOfertaPaseo {
  id: string;
  precio?: number;
  /** number = precio por salida del plan · null = quitar el plan del bloque · ausente = no tocar. */
  precioPlan?: number | null;
  /** S79: precio del MES del plan; null = deja de ofrecer plan. */
  precioMensualPlan?: number | null;
  /** number = precio por salida del paquete · null = quitar el paquete del bloque · ausente = no tocar. */
  precioPaquete?: number | null;
  nombre?: string | null;
  descripcion?: string | null;
  activo?: boolean;
}

/**
 * Edita precio/nombre/descripción o pausa/reactiva. El precio nuevo rige
 * SOLO holds futuros: el snapshot de crear_bloqueo_agenda protege lo ya
 * creado (MODELO_FINANCIERO §3.2 — garantizado server-side, relevado S55).
 */
export async function actualizarOfertaPaseo(
  input: InputActualizarOfertaPaseo,
): Promise<ResultadoWrapper<OfertaPaseoPropia, CodigoErrorConfiguracionPaseo>> {
  if ((await uidActual()) === null) return falla('sin_sesion');

  if (input.precio !== undefined && (!Number.isFinite(input.precio) || input.precio <= 0)) {
    return falla('precio_invalido');
  }
  if (
    input.precioPlan !== undefined &&
    input.precioPlan !== null &&
    (!Number.isFinite(input.precioPlan) || input.precioPlan <= 0)
  ) {
    return falla('precio_plan_invalido');
  }
  if (
    input.precioMensualPlan !== undefined &&
    input.precioMensualPlan !== null &&
    (!Number.isFinite(input.precioMensualPlan) || input.precioMensualPlan <= 0)
  ) {
    return falla('precio_mensual_plan_invalido');
  }
  if (
    input.precioPaquete !== undefined &&
    input.precioPaquete !== null &&
    (!Number.isFinite(input.precioPaquete) || input.precioPaquete <= 0)
  ) {
    return falla('precio_paquete_invalido');
  }

  const cambios: UpdateOferta = {};
  if (input.precio !== undefined) cambios.precio = input.precio;
  if (input.precioPlan !== undefined) cambios.precio_plan = input.precioPlan;
  if (input.precioMensualPlan !== undefined) cambios.precio_mensual_plan = input.precioMensualPlan;
  if (input.precioPaquete !== undefined) cambios.precio_paquete = input.precioPaquete;
  if (input.nombre !== undefined) cambios.nombre_custom = input.nombre?.trim() || null;
  if (input.descripcion !== undefined) cambios.descripcion = input.descripcion?.trim() || null;
  if (input.activo !== undefined) cambios.activo = input.activo;

  const { data, error } = await getClient()
    .from('prestador_servicios')
    .update(cambios)
    .eq('id', input.id)
    .select(SELECT_OFERTA)
    .maybeSingle();

  if (error) return falla('error_desconocido');
  // sin fila tocada = no era tuya o no existe — jamás no-op silencioso (cura T4 S54)
  if (data === null) return falla('no_encontrada');
  return { ok: true, data: mapearOferta(data) };
}

const SELECT_FRANJA = 'id, dia_semana, hora_inicio, hora_fin, duracion_slot_minutos, max_citas_por_slot, activo';

/** El mensaje de `cupo_invalido`, con el TECHO REAL adentro. Se construye en
 *  vez de vivir en `MENSAJES` porque **su número no es una constante**: sale
 *  del catálogo, y un texto fijo volvería a divergir del predicado el día que
 *  el catálogo cambie — que es exactamente lo que acaba de pasar. */
function mensajeCupoInvalido(techo: number): string {
  return techo <= 1
    ? 'Este horario admite una sola cita a la vez.'
    : `El cupo tiene que ser entre 1 y ${techo}.`;
}

/**
 * EL TOPE DEL PRESTADOR — el mayor `cupo_techo` entre sus oficios ACTIVOS.
 *
 * Interno a propósito: **no es un lector nuevo de la puerta única**, es el
 * cálculo que `FranjaHorario.cupoTechoMaximo` necesita, en UN solo lugar. *Si
 * viviera copiado en los cuatro sitios que devuelven una franja, el día que el
 * criterio cambie (D-638 → franjas por servicio) quedarían tres viejos.*
 *
 * Devuelve `1` si falla o si no hay oficios con techo: es el default exclusivo
 * del motor, no un número inventado.
 */
async function techoMaximoDe(prestadorId: string): Promise<number> {
  const { data, error } = await getClient()
    .from('prestador_servicios')
    .select('tipo_servicio, tipos_servicio!inner(cupo_techo)')
    .eq('prestador_id', prestadorId)
    .eq('activo', true);
  if (error || !Array.isArray(data)) return 1;
  let max = 1;
  for (const fila of data) {
    const v = (fila as { tipos_servicio?: { cupo_techo?: number | null } | null }).tipos_servicio?.cupo_techo;
    if (typeof v === 'number' && v > max) max = v;
  }
  return max;
}

function mapearFranja(fila: {
  id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  duracion_slot_minutos: number;
  max_citas_por_slot: number | null;
  activo: boolean;
}, cupoTechoMaximo: number): FranjaHorario {
  return {
    id: fila.id,
    cupoTechoMaximo,
    diaSemana: fila.dia_semana,
    horaInicio: aHoraCorta(fila.hora_inicio),
    horaFin: aHoraCorta(fila.hora_fin),
    duracionSlotMinutos: fila.duracion_slot_minutos,
    maxCitasPorSlot: fila.max_citas_por_slot ?? 1,
    activo: fila.activo,
  };
}

/**
 * Las franjas GENERALES (servicio_id NULL) de UNA PERSONA del negocio.
 *
 * S78-A2 (D-540): `empleadoId` ausente = el TITULAR — el contrato V0
 * intacto para los consumidores vivos. Presente = la jornada de esa
 * persona, que es lo que destraba al segundo profesional.
 */
export async function obtenerFranjasHorario(
  prestadorId: string,
  empleadoId?: string,
): Promise<ResultadoWrapper<FranjaHorario[], CodigoErrorConfiguracionPaseo>> {
  if ((await uidActual()) === null) return falla('sin_sesion');

  const personaId = await resolverPersonaDeFranja(prestadorId, empleadoId);
  if (personaId === null) return falla(empleadoId === undefined ? 'error_desconocido' : 'empleado_invalido');

  /* Dos consultas y NO un join: PostgREST no puede saltar
     prestador_horarios → prestador_servicios → tipos_servicio en un solo
     select (no hay FK entre la franja universal y el tipo — justamente
     porque la franja no es de un oficio, que es D-638 entero). El techo se
     resuelve aparte y se reparte a las filas. */
  /* En paralelo y NO por join: PostgREST no puede saltar
     prestador_horarios → prestador_servicios → tipos_servicio en un solo
     select — no hay FK entre la franja universal y el tipo, justamente
     porque la franja NO es de un oficio (D-638 entero en una línea).

     ⚠️ Y UN FALLO DEL TECHO NO TUMBA LAS FRANJAS: `techoMaximoDe` cae a 1 en
     vez de propagar el error. El techo es una AYUDA de la superficie (cuánto
     puede pedir); las franjas son EL DATO. *Caer entero por no poder calcular
     una ayuda le sacaría al prestador su horario para no poder decirle su
     tope.* */
  const [franjas, cupoTechoMaximo] = await Promise.all([
    getClient()
      .from('prestador_horarios')
      .select(SELECT_FRANJA)
      .eq('prestador_id', prestadorId)
      .is('servicio_id', null)
      .eq('empleado_id', personaId)
      .order('dia_semana', { ascending: true })
      .order('hora_inicio', { ascending: true }),
    techoMaximoDe(prestadorId),
  ]);

  if (franjas.error || !Array.isArray(franjas.data)) return falla('error_desconocido');
  return { ok: true, data: franjas.data.map((f) => mapearFranja(f, cupoTechoMaximo)) };
}

export interface InputCrearFranja {
  prestadorId: string;
  /** La PERSONA dueña de la franja. Ausente = el titular (contrato V0). */
  empleadoId?: string;
  /** 0=Domingo … 6=Sábado (regla 32). */
  diaSemana: number;
  /** 'HH:MM' en la grilla de 30 (v1: grilla fija). */
  horaInicio: string;
  horaFin: string;
  maxCitasPorSlot: number;
}

const HORA_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Agrega una franja general A UNA PERSONA. El SOLAPE se valida acá contra
 * TODAS las franjas del día DE ESA PERSONA (activas y pausadas — una
 * pausada que se reactive no puede chocar): el UNIQUE del schema no
 * protege con servicio_id NULL (relevado S55: NULLs no colisionan).
 *
 * S78-A2: el solape es POR PERSONA y eso es lo correcto, no una
 * simplificación — dos personas del mismo negocio SE PISAN LEGALMENTE en
 * el reloj (D-409, firmada S70: la ocupación protege el cuerpo, no la
 * agenda). El motor ya lo trata así: `_agenda_ocupacion(p_empleado_id,…)`
 * cuenta por persona y las lectoras UNEN ventanas (A0, literal).
 */
export async function crearFranjaHorario(
  input: InputCrearFranja,
): Promise<ResultadoWrapper<FranjaHorario, CodigoErrorConfiguracionPaseo>> {
  if ((await uidActual()) === null) return falla('sin_sesion');

  if (!Number.isInteger(input.diaSemana) || input.diaSemana < 0 || input.diaSemana > 6) {
    return falla('dia_invalido');
  }
  if (!HORA_RE.test(input.horaInicio) || !HORA_RE.test(input.horaFin)) return falla('rango_horario_invalido');
  if (input.horaFin <= input.horaInicio) return falla('rango_horario_invalido');
  /* ☠️ EL `> 4` HARDCODEADO MUERE ACÁ TAMBIÉN (S85). Eran CUATRO guards con el
     mismo número copiado; con `cupo_techo` del paseo en 10, los cuatro habrían
     rebotado `cupo_invalido` sobre un valor que el motor acepta. El tope se
     PREGUNTA al catálogo, no se recuerda. */
  const techoCrear = await techoMaximoDe(input.prestadorId);
  if (!Number.isInteger(input.maxCitasPorSlot) || input.maxCitasPorSlot < 1 || input.maxCitasPorSlot > techoCrear) {
    return { ok: false, codigo: 'cupo_invalido', mensaje: mensajeCupoInvalido(techoCrear) };
  }

  const personaId = await resolverPersonaDeFranja(input.prestadorId, input.empleadoId);
  if (personaId === null) {
    return falla(input.empleadoId === undefined ? 'error_desconocido' : 'empleado_invalido');
  }

  const { data: delDia, error: errDia } = await getClient()
    .from('prestador_horarios')
    .select('id, hora_inicio, hora_fin')
    .eq('prestador_id', input.prestadorId)
    .is('servicio_id', null)
    .eq('empleado_id', personaId)
    .eq('dia_semana', input.diaSemana);
  if (errDia || !Array.isArray(delDia)) return falla('error_desconocido');
  const solapa = delDia.some(
    (f) => input.horaInicio < aHoraCorta(f.hora_fin) && input.horaFin > aHoraCorta(f.hora_inicio),
  );
  if (solapa) return falla('franja_solapada');

  const { data, error } = await getClient()
    .from('prestador_horarios')
    .insert({
      prestador_id: input.prestadorId,
      empleado_id: personaId,
      dia_semana: input.diaSemana,
      hora_inicio: input.horaInicio,
      hora_fin: input.horaFin,
      duracion_slot_minutos: 30,
      max_citas_por_slot: input.maxCitasPorSlot,
      activo: true,
    })
    .select(SELECT_FRANJA)
    .single();

  if (error || data === null) return falla('error_desconocido');
  return { ok: true, data: mapearFranja(data, techoCrear) };
}

export interface InputActualizarFranja {
  id: string;
  activo?: boolean;
  maxCitasPorSlot?: number;
}

/** Pausa/reactiva una franja o cambia su cupo de paseos simultáneos. */
export async function actualizarFranjaHorario(
  input: InputActualizarFranja,
): Promise<ResultadoWrapper<FranjaHorario, CodigoErrorConfiguracionPaseo>> {
  if ((await uidActual()) === null) return falla('sin_sesion');

  /* ☠️ ACÁ VIVÍA UN `> 4` HARDCODEADO, y era el freno REAL del caso del
     founder — más que el cupo de las franjas.
     Con `cupo_techo` del paseo en 10 (firma del 3-ago), este guard **habría
     rebotado `cupo_invalido` al intentar subir a 5..10**: el motor permitía y
     la puerta única no. *Un número de plataforma copiado en un wrapper es
     letra muerta el día que la plataforma cambia — y su modo de falla es el
     peor, porque el rebote llega tipado y creíble.*
     Ahora el tope se PREGUNTA, no se recuerda. */
  const franjaPrevia = await getClient()
    .from('prestador_horarios')
    .select('prestador_id')
    .eq('id', input.id)
    .maybeSingle();
  if (franjaPrevia.error) return falla('error_desconocido');
  if (franjaPrevia.data === null) return falla('no_encontrada');

  const techo = await techoMaximoDe(franjaPrevia.data.prestador_id);

  if (
    input.maxCitasPorSlot !== undefined &&
    (!Number.isInteger(input.maxCitasPorSlot) || input.maxCitasPorSlot < 1 || input.maxCitasPorSlot > techo)) {
    return { ok: false, codigo: 'cupo_invalido', mensaje: mensajeCupoInvalido(techo) };
  }

  const cambios: UpdateFranja = {};
  if (input.activo !== undefined) cambios.activo = input.activo;
  if (input.maxCitasPorSlot !== undefined) cambios.max_citas_por_slot = input.maxCitasPorSlot;

  const { data, error } = await getClient()
    .from('prestador_horarios')
    .update(cambios)
    .eq('id', input.id)
    .select(SELECT_FRANJA)
    .maybeSingle();

  if (error) return falla('error_desconocido');
  if (data === null) return falla('no_encontrada');
  return { ok: true, data: mapearFranja(data, techo) };
}

export interface InputEditarFranja {
  id: string;
  prestadorId: string;
  /** La PERSONA dueña de la franja. Ausente = el titular (contrato V0). */
  empleadoId?: string;
  /** 'HH:MM' en la grilla de 30 (misma grilla del alta). */
  horaInicio: string;
  horaFin: string;
  maxCitasPorSlot?: number;
  activo?: boolean;
}

/**
 * EDITA UNA FRANJA EN SU LUGAR (S61-B5, D-391 — muere el eliminar+crear).
 * Función NUEVA aditiva: actualizarFranjaHorario (activo/cupo) queda
 * intacta. Valida el SOLAPE contra las franjas del día EXCLUYENDO la
 * propia (la misma exclusión que D-349 puso en el motor de agenda) — el
 * chequeo y la escritura viven JUNTOS para que no diverjan. El día es
 * de LA FILA (se lee por id): la edición no mueve la franja de día.
 * MISMO nivel de garantía que crearFranjaHorario: el chequeo vive en la
 * puerta única porque el UNIQUE del schema no protege con servicio_id
 * NULL (relevado S55); el candado server-side sería cirugía de motor —
 * pedido a la A si la mesa lo dispara.
 */
export async function editarFranjaHorario(
  input: InputEditarFranja,
): Promise<ResultadoWrapper<FranjaHorario, CodigoErrorConfiguracionPaseo>> {
  if ((await uidActual()) === null) return falla('sin_sesion');

  if (!HORA_RE.test(input.horaInicio) || !HORA_RE.test(input.horaFin)) return falla('rango_horario_invalido');
  if (input.horaFin <= input.horaInicio) return falla('rango_horario_invalido');
  /* ☠️ EL `> 4` HARDCODEADO MUERE ACÁ TAMBIÉN (S85). Eran CUATRO guards con el
     mismo número copiado; con `cupo_techo` del paseo en 10, los cuatro habrían
     rebotado `cupo_invalido` sobre un valor que el motor acepta. El tope se
     PREGUNTA al catálogo, no se recuerda. */
  const techoEditar = await techoMaximoDe(input.prestadorId);
  if (
    input.maxCitasPorSlot !== undefined &&
    (!Number.isInteger(input.maxCitasPorSlot) || input.maxCitasPorSlot < 1 || input.maxCitasPorSlot > techoEditar)) {
    return { ok: false, codigo: 'cupo_invalido', mensaje: mensajeCupoInvalido(techoEditar) };
  }

  const { data: fila, error: errFila } = await getClient()
    .from('prestador_horarios')
    .select('id, dia_semana')
    .eq('id', input.id)
    .maybeSingle();
  if (errFila) return falla('error_desconocido');
  if (fila === null) return falla('no_encontrada');

  // S78-A2: el solape se valida contra las franjas de LA MISMA PERSONA.
  const personaId = await resolverPersonaDeFranja(input.prestadorId, input.empleadoId);
  if (personaId === null) {
    return falla(input.empleadoId === undefined ? 'error_desconocido' : 'empleado_invalido');
  }

  const { data: delDia, error: errDia } = await getClient()
    .from('prestador_horarios')
    .select('id, hora_inicio, hora_fin')
    .eq('prestador_id', input.prestadorId)
    .is('servicio_id', null)
    .eq('empleado_id', personaId)
    .eq('dia_semana', fila.dia_semana)
    .neq('id', input.id);
  if (errDia || !Array.isArray(delDia)) return falla('error_desconocido');
  const solapa = delDia.some(
    (f) => input.horaInicio < aHoraCorta(f.hora_fin) && input.horaFin > aHoraCorta(f.hora_inicio),
  );
  if (solapa) return falla('franja_solapada');

  const cambios: UpdateFranja = { hora_inicio: input.horaInicio, hora_fin: input.horaFin };
  if (input.activo !== undefined) cambios.activo = input.activo;
  if (input.maxCitasPorSlot !== undefined) cambios.max_citas_por_slot = input.maxCitasPorSlot;

  const { data, error } = await getClient()
    .from('prestador_horarios')
    .update(cambios)
    .eq('id', input.id)
    .select(SELECT_FRANJA)
    .maybeSingle();

  if (error) return falla('error_desconocido');
  if (data === null) return falla('no_encontrada');
  return { ok: true, data: mapearFranja(data, techoEditar) };
}

/**
 * Quita una franja. Las franjas son CONFIGURACIÓN de disponibilidad, no
 * historia — borrarlas es legal (la regla 7.8 protege eventos y plata);
 * las citas ya confirmadas no dependen de la franja (relevado S55).
 */
export async function eliminarFranjaHorario(
  id: string,
): Promise<ResultadoWrapper<{ id: string }, CodigoErrorConfiguracionPaseo>> {
  if ((await uidActual()) === null) return falla('sin_sesion');

  const { data, error } = await getClient()
    .from('prestador_horarios')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) return falla('error_desconocido');
  if (data === null) return falla('no_encontrada');
  return { ok: true, data: { id: data.id } };
}
