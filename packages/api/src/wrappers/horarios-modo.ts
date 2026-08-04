// D-386 — LA ELECCIÓN DE MODO DE HORARIOS (S62-B, sobre el motor de la
// Sesión A: migración 20260715130000, commit 5b4a39c).
//
// La letra founder S60: el prestador con varios oficios ELIGE — horarios
// por servicio O franjas universales; jamás mezcladas. El motor lo hace
// invariante (guard por triggers en la fuente + RPC elegir_modo_horarios
// + UNIQUE NULLS NOT DISTINCT); acá vive la puerta única del app.
//
// Camino de escritura del MODO: SOLO la RPC (SECURITY DEFINER, resuelve
// el prestador por auth.uid()) — jamás UPDATE directo. Las FRANJAS se
// siguen escribiendo directo por RLS (camino probado S55-B); los guards
// de DB pueden rebotar franja_especifica_en_modo_universal /
// franja_universal_en_modo_por_servicio (ERRCODE 23514) si un camino
// contradice el modo — acá se normalizan por startsWith (L-115).
//
// GRANULARIDAD (decisión founder S62, opción (b)): servicio_id es la
// OFERTA de prestador_servicios (en paseo, una por bloque). La UI
// presenta la elección a nivel del OFICIO y REPLICA la franja a las
// ofertas que el prestador marque — la franja por oferta individual no
// se expone (Ley 3: ningún paseador piensa "los lunes atiendo paseos
// de 30 pero no de 60").

import { getClient, uidActual } from '../client';
import type { ResultadoWrapper } from '../resultado';
import { resolverPersonaDeFranja } from './titular';

const MENSAJES = {
  sin_sesion:                    'No hay sesión activa.',
  modo_invalido:                 'Esa organización de agenda no existe.',
  prestador_no_encontrado:       'No encontramos tu negocio.',
  franjas_del_otro_modo_existen: 'Todavía tienes franjas guardadas con la organización actual.',
  franja_especifica_en_modo_universal:
    'Tu agenda está en "una agenda para todo" — una franja por servicio no se puede guardar así.',
  franja_universal_en_modo_por_servicio:
    'Tu agenda está organizada por servicio — una franja general no se puede guardar así.',
  franja_duplicada:              'Esa franja ya existe tal cual ese día.',
  franja_solapada:               'Esa franja se cruza con una que ya tienes ese día.',
  rango_horario_invalido:        'La hora de fin tiene que ser después de la de inicio.',
  dia_invalido:                  'El día no es válido.',
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
  cupo_invalido:                 'Ese cupo está fuera de lo permitido.',
  empleado_invalido:             'Esa persona no trabaja en tu negocio.',
  // S68-B8: los errores tipados de la conversión (RPC A9) con voz propia
  sin_franjas_generales:         'No tienes franjas generales para convertir.',
  sin_servicios_activos:         'Activa al menos un servicio con agenda antes de convertir.',
  datos_inconsistentes:          'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:             'Ocurrió un error inesperado. Prueba de nuevo.',
} as const;

export type CodigoErrorModoHorarios = keyof typeof MENSAJES;

type Falla = { ok: false; codigo: CodigoErrorModoHorarios; mensaje: string };
function falla(codigo: CodigoErrorModoHorarios): Falla {
  return { ok: false, codigo, mensaje: MENSAJES[codigo] };
}

export type ModoHorarios = 'universal' | 'por_servicio';

/** Los códigos que la RPC / los guards de DB emiten por RAISE — se
 *  normalizan por startsWith (L-115). auth_required mapea a sin_sesion
 *  (la voz de la casa para ese estado). */
const CODIGOS_SERVIDOR: [prefijo: string, codigo: CodigoErrorModoHorarios][] = [
  ['auth_required', 'sin_sesion'],
  ['modo_invalido', 'modo_invalido'],
  ['prestador_no_encontrado', 'prestador_no_encontrado'],
  ['franjas_del_otro_modo_existen', 'franjas_del_otro_modo_existen'],
  ['franja_especifica_en_modo_universal', 'franja_especifica_en_modo_universal'],
  ['franja_universal_en_modo_por_servicio', 'franja_universal_en_modo_por_servicio'],
  // S68-B8 (RPC A9): la conversión dice su porqué tipado
  ['sin_franjas_generales', 'sin_franjas_generales'],
  ['sin_servicios_activos', 'sin_servicios_activos'],
];

function normalizarError(mensaje: string): Falla {
  for (const [prefijo, codigo] of CODIGOS_SERVIDOR) {
    if (mensaje.startsWith(prefijo)) return falla(codigo);
  }
  if (mensaje.includes('duplicate key')) return falla('franja_duplicada');
  return falla('error_desconocido');
}

/** El modo vigente del prestador (prestadores.modo_horarios). */
export async function obtenerModoHorarios(
  prestadorId: string,
): Promise<ResultadoWrapper<ModoHorarios, CodigoErrorModoHorarios>> {
  if ((await uidActual()) === null) return falla('sin_sesion');

  const { data, error } = await getClient()
    .from('prestadores')
    .select('modo_horarios')
    .eq('id', prestadorId)
    .maybeSingle();

  if (error) return normalizarError(error.message);
  if (data === null) return falla('prestador_no_encontrado');
  if (data.modo_horarios !== 'universal' && data.modo_horarios !== 'por_servicio') {
    return falla('datos_inconsistentes');
  }
  return { ok: true, data: data.modo_horarios };
}

/**
 * Escribe la elección — EL camino único (RPC elegir_modo_horarios).
 * franjas_del_otro_modo_existen = el prestador todavía tiene franjas
 * del modo viejo: la UI ofrece eliminarlas y reintentar, o cancelar.
 */
export async function elegirModoHorarios(
  modo: ModoHorarios,
): Promise<ResultadoWrapper<ModoHorarios, CodigoErrorModoHorarios>> {
  if ((await uidActual()) === null) return falla('sin_sesion');

  const { data, error } = await getClient().rpc('elegir_modo_horarios', { p_modo: modo });

  if (error) return normalizarError(error.message);
  if (data !== 'universal' && data !== 'por_servicio') return falla('datos_inconsistentes');
  return { ok: true, data };
}

/**
 * LA IDA DE LA CONVERSIÓN (S68-B8, firma founder sobre el hallazgo del
 * gate — CONECTADA tras verificar A9 aplicada contra DB viva,
 * migración 20260718003000): las franjas generales pasan a vivir en
 * CADA servicio — no se borra nada; desde ahí cada servicio se ajusta
 * por separado. UNA transacción del lado del motor: snapshot → mueren
 * las generales → elegir_modo_horarios (su ÚNICO escritor, D-386
 * intacta) → réplica día × oferta cobrable activa (activa Y
 * reservable), conservando persona/horas/cupo/estado.
 * Guard verificado en el functiondef: sin generales no hay qué
 * convertir (cubre la idempotencia — la segunda llamada rebota tipada).
 */
export async function convertirHorariosAPorServicio(): Promise<
  ResultadoWrapper<{ franjasConvertidas: number; servicios: number }, CodigoErrorModoHorarios>
> {
  if ((await uidActual()) === null) return falla('sin_sesion');

  const { data, error } = await getClient().rpc('convertir_horarios_a_por_servicio');

  if (error) return normalizarError(error.message);
  // guard de shape contra el retorno REAL (jsonb del functiondef, L-124)
  if (
    typeof data !== 'object' ||
    data === null ||
    Array.isArray(data) ||
    typeof (data as Record<string, unknown>).franjas_convertidas !== 'number' ||
    typeof (data as Record<string, unknown>).servicios !== 'number'
  ) {
    return falla('datos_inconsistentes');
  }
  const forma = data as { franjas_convertidas: number; servicios: number };
  return { ok: true, data: { franjasConvertidas: forma.franjas_convertidas, servicios: forma.servicios } };
}

/**
 * Borra TODAS las franjas DE UNA PERSONA (generales y por servicio). Es
 * el camino de "eliminar tus franjas actuales y empezar de nuevo" del
 * cambio de modo — las franjas son configuración, no historia (regla 7.8
 * protege eventos).
 *
 * S78-A2: sigue borrando SOLO las de la persona indicada; ausente = el
 * titular. **El borrado jamás es del negocio entero** — esa amplitud
 * sería nueva y peligrosa (una persona limpiando su agenda no puede
 * vaciar la de sus compañeros), y el cambio de modo se aplica por
 * persona igual que las franjas.
 */
export async function eliminarFranjasPrestador(
  prestadorId: string,
  empleadoId?: string,
): Promise<ResultadoWrapper<{ eliminadas: number }, CodigoErrorModoHorarios>> {
  if ((await uidActual()) === null) return falla('sin_sesion');

  const personaId = await resolverPersonaDeFranja(prestadorId, empleadoId);
  if (personaId === null) return falla(empleadoId === undefined ? 'error_desconocido' : 'empleado_invalido');

  const { data, error } = await getClient()
    .from('prestador_horarios')
    .delete()
    .eq('prestador_id', prestadorId)
    .eq('empleado_id', personaId)
    .select('id');

  if (error) return normalizarError(error.message);
  return { ok: true, data: { eliminadas: Array.isArray(data) ? data.length : 0 } };
}

export interface FranjaHorarioServicio {
  id: string;
  /** La OFERTA dueña de la franja (prestador_servicios.id). */
  servicioId: string;
  /** 0=Domingo … 6=Sábado (regla 32). */
  diaSemana: number;
  /** 'HH:MM' */
  horaInicio: string;
  horaFin: string;
  duracionSlotMinutos: number;
  maxCitasPorSlot: number;
  activo: boolean;
  /**
   * EL TOPE que la plataforma permite para `maxCitasPorSlot` — **gemelo exacto
   * de `FranjaHorario.cupoTechoMaximo`, y viaja acá por la misma razón:** las
   * dos formas de franja las consume **la misma sección** (`seccion-horarios`,
   * los cuatro talleres), así que **un campo que existe en una y no en la otra
   * no es un detalle de tipos: rompe las cuatro pantallas.**
   *
   * *Es exactamente el patrón que el método nombra —el motor se adelanta a su
   * wrapper— y acá se pagó en el mismo turno: nació en `FranjaHorario` y dejó
   * `tsc apps/prestador` en rojo con 6 errores hasta que su gemela lo tuvo.*
   *
   * ⚠️ **Hoy vale lo mismo en las dos**: el mayor `cupo_techo` entre los
   * oficios ACTIVOS del prestador. **Bajo (d) —franjas por servicio— esta
   * forma podría afinarlo al techo de SU servicio**, que es un dato que ella sí
   * tiene y la universal no. *No se hace ahora porque hoy hay CERO franjas por
   * servicio vivas (`modo_horarios` = 'universal' en todos), y afinar un camino
   * que nadie recorre es construir a ciegas.*
   */
  cupoTechoMaximo: number;
}

const SELECT_FRANJA_SERVICIO =
  'id, servicio_id, dia_semana, hora_inicio, hora_fin, duracion_slot_minutos, max_citas_por_slot, activo';

function aHoraCorta(v: string): string {
  return v.slice(0, 5);
}

function mapearFranjaServicio(fila: {
  id: string;
  servicio_id: string | null;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  duracion_slot_minutos: number;
  max_citas_por_slot: number | null;
  activo: boolean;
}, cupoTechoMaximo: number): FranjaHorarioServicio {
  return {
    cupoTechoMaximo,
    id: fila.id,
    servicioId: fila.servicio_id ?? '',
    diaSemana: fila.dia_semana,
    horaInicio: aHoraCorta(fila.hora_inicio),
    horaFin: aHoraCorta(fila.hora_fin),
    duracionSlotMinutos: fila.duracion_slot_minutos,
    maxCitasPorSlot: fila.max_citas_por_slot ?? 1,
    activo: fila.activo,
  };
}

/**
 * Las franjas POR SERVICIO de las ofertas dadas, DE UNA PERSONA.
 * S78-A2: `empleadoId` ausente = el titular (contrato V0).
 */
/** El mensaje de `cupo_invalido`, con el TECHO REAL adentro. Se construye en
 *  vez de vivir en `MENSAJES` porque **su número no es una constante**: sale
 *  del catálogo, y un texto fijo volvería a divergir del predicado el día que
 *  el catálogo cambie — que es exactamente lo que acaba de pasar. */
function mensajeCupoInvalido(techo: number): string {
  return techo <= 1
    ? 'Este horario admite una sola cita a la vez.'
    : `El cupo tiene que ser entre 1 y ${techo}.`;
}

/** El tope del prestador — gemelo declarado del de `configuracionPaseo`.
 *  ⚠️ **Dos cuerpos del MISMO cálculo, y se declara en vez de esconderse:**
 *  viven en wrappers distintos y no hay dónde compartirlo sin crear un módulo
 *  para tres líneas. **Su condición de unificación es D-638 (d):** cuando las
 *  franjas sean POR SERVICIO, el techo sale del servicio de la franja y los dos
 *  desaparecen juntos. Hasta entonces, si uno cambia el otro también. */
async function techoMaximoDeServicios(prestadorId: string): Promise<number> {
  /* DOS CONSULTAS, NO UN EMBED — y el porqué es una medición, no un estilo.
     La versión anterior usaba `tipos_servicio!inner(cupo_techo)`, y
     **`prestador_servicios` NO tiene FK a `tipos_servicio`** (medido: su única
     FK es a `prestadores`; `tipo_servicio` es texto libre contra
     `tipos_servicio.codigo` desde V0). Sin FK, PostgREST **no puede resolver el
     embed** ⇒ el `select` devolvía error SIEMPRE.

     ☠️ Y LA PARTE QUE COSTÓ CARO NO FUE EL EMBED: fue el `return 1` que lo
     tragaba. Estaba escrito a propósito, como degradación "honesta" —*el techo
     es una ayuda, las franjas son el dato*—. **Pero un catch-all pensado para un
     fallo OCASIONAL se volvió el ÚNICO camino**, y devolvía un valor legítimo y
     plausible: no rompía nada, no tiraba error, y el taller mostraba
     "Hasta 1 en simultáneo" con toda naturalidad. **Convirtió un error visible
     en un dato falso creíble** — L-192 en su forma más cara.

     ⇒ **UN FALLO DE LECTURA DEL TECHO NO PUEDE DEVOLVER UN TECHO.** Devuelve
     `0`, que significa **"no sé"** y no es un techo posible. La superficie ya
     distingue los dos estados (`cupoTecho: 0` de C): con `0` el control **deja
     subir** y **el servidor sigue siendo la autoridad** (Ley 23 — la puerta no
     promete lo que no puede sostener, pero tampoco prohíbe por no saber). */
  const cliente = getClient();

  const ofertas = await cliente
    .from('prestador_servicios')
    .select('tipo_servicio')
    .eq('prestador_id', prestadorId)
    .eq('activo', true);
  if (ofertas.error || !Array.isArray(ofertas.data)) return 0;

  const codigos = [...new Set(ofertas.data.map((o) => o.tipo_servicio).filter((c): c is string => typeof c === 'string'))];
  /* Sin ofertas activas NO es un fallo: es un prestador sin oferta, y su techo
     REAL es 1 (exclusivo). Se distingue del `0` a propósito — uno es "no sé",
     el otro es "sé, y es uno". */
  if (codigos.length === 0) return 1;

  const techos = await cliente
    .from('tipos_servicio')
    .select('codigo, cupo_techo')
    .in('codigo', codigos);
  if (techos.error || !Array.isArray(techos.data)) return 0;

  let max = 1;
  for (const t of techos.data) {
    if (typeof t.cupo_techo === 'number' && t.cupo_techo > max) max = t.cupo_techo;
  }
  return max;
}

export async function obtenerFranjasDeServicios(
  prestadorId: string,
  servicioIds: string[],
  empleadoId?: string,
): Promise<ResultadoWrapper<FranjaHorarioServicio[], CodigoErrorModoHorarios>> {
  if ((await uidActual()) === null) return falla('sin_sesion');
  if (servicioIds.length === 0) return { ok: true, data: [] };

  const personaId = await resolverPersonaDeFranja(prestadorId, empleadoId);
  if (personaId === null) return falla(empleadoId === undefined ? 'error_desconocido' : 'empleado_invalido');

  const { data, error } = await getClient()
    .from('prestador_horarios')
    .select(SELECT_FRANJA_SERVICIO)
    .eq('prestador_id', prestadorId)
    .in('servicio_id', servicioIds)
    .eq('empleado_id', personaId)
    .order('dia_semana', { ascending: true })
    .order('hora_inicio', { ascending: true });

  if (error) return normalizarError(error.message);
  if (!Array.isArray(data)) return falla('datos_inconsistentes');
  const techo = await techoMaximoDeServicios(prestadorId);
  return { ok: true, data: data.map((f) => mapearFranjaServicio(f, techo)) };
}

export interface InputCrearFranjaServicio {
  prestadorId: string;
  /** La PERSONA dueña de la franja. Ausente = el titular (contrato V0). */
  empleadoId?: string;
  /** La OFERTA (prestador_servicios.id) dueña de la franja. */
  servicioId: string;
  /** 0=Domingo … 6=Sábado (regla 32). */
  diaSemana: number;
  /** 'HH:MM' en la grilla de 30 (v1: grilla fija). */
  horaInicio: string;
  horaFin: string;
  maxCitasPorSlot: number;
}

const HORA_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Agrega una franja POR SERVICIO. El solape se pre-valida SOLO contra
 * las franjas de LA MISMA oferta (dos ofertas distintas con franjas a
 * la misma hora es LEGAL — cada una tiene su agenda; la ocupación del
 * motor sigue global, cláusula del arquitecto). La anti-duplicación
 * exacta vive en DB (UNIQUE NULLS NOT DISTINCT); el guard de modo
 * rebota tipado si el modo vigente no es por_servicio.
 */
export async function crearFranjaServicio(
  input: InputCrearFranjaServicio,
): Promise<ResultadoWrapper<FranjaHorarioServicio, CodigoErrorModoHorarios>> {
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
  const techoCrear = await techoMaximoDeServicios(input.prestadorId);
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
    .eq('servicio_id', input.servicioId)
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
      servicio_id: input.servicioId,
      dia_semana: input.diaSemana,
      hora_inicio: input.horaInicio,
      hora_fin: input.horaFin,
      duracion_slot_minutos: 30,
      max_citas_por_slot: input.maxCitasPorSlot,
      activo: true,
    })
    .select(SELECT_FRANJA_SERVICIO)
    .single();

  if (error) return normalizarError(error.message);
  if (data === null) return falla('error_desconocido');
  return { ok: true, data: mapearFranjaServicio(data, techoCrear) };
}
