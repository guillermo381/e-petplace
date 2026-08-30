// Configuración de guardería — S107-A (el cupo del lugar y sus dos franjas).
//
// Contrato: `docs/contratos/s107-contrato-cupo-franja-estadia.md`.
// Censo que lo funda: `docs/loop/S107-A-CENSO.md`.
//
// 🔴 EL CUPO ES DEL LUGAR Y SE CUENTA POR DÍA, jamás sobre la grilla de agenda
// (`BRIEF_S107` §2 ②). Es traducción del molde vivo de la despensa
// (`cupo_reparto_del_dia`), no diseño nuevo: la excepción GANA al patrón y un
// cancelado devuelve su lugar.
//
// 🔴 Y LAS FRANJAS NO SON TURNOS: son dos ventanas por día (recogida /
// devolución). No se rebanan en slots de 30 minutos — el dueño no elige hora
// exacta, acuerda dentro de la ventana.
//
// La escritura va por RPC (patrón S95-G2: sin policy de escritura, la única vía
// es la función que valida). La lectura de franjas es INVOKER: la gobierna la
// RLS de la tabla, que ya distingue al público del titular.

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

const MENSAJES = {
  franja_no_existe:  'No encontramos esa franja.',
  franjas_invalidas: 'Esas franjas no son válidas.',


  /* ✏️ S107-A · CENSADOS CONTRA EL MOTOR, no agregados de a uno.
     C reportó que `fecha_no_ofertable` llegaba como `error_desconocido`; al
     medir **el motor de guardería lanza 37 códigos y 17 no estaban tipados en
     ningún wrapper** — casi la mitad.
     🔴 **Un código sin tipar no es un mensaje feo: es un HECHO que se vuelve
     indistinguible de una caída de red.** La víspera —la regla más normal del
     producto— se veía igual que un error inesperado, y la pantalla no podía
     ofrecer «elegí otro día» porque no sabía que ése era el problema. */
  tope_de_urgencia_invalido:   'Ese tope de urgencia no es válido.',

  no_gestionas_este_prestador: 'No administras este negocio.',
  capacidad_invalida:          'La capacidad tiene que ser mayor a cero.',
  espacio_no_existe:           'No encontramos ese espacio.',
  tipo_de_franja_invalido:     'La franja tiene que ser de recogida o de devolución.',
  franja_invertida:            'La hora de fin tiene que ser después de la de inicio.',
  /* 🔴 La voz dice QUÉ está mal, no «revisá los datos»: el prestador tiene que
     poder corregirlo sin adivinar cuál de las dos ventanas mover. */
  franjas_se_cruzan:           'La devolución no puede empezar antes de que termine la recogida.',
  rango_invertido:             'La fecha de fin es anterior a la de inicio.',
  rango_demasiado_largo:       'Se pueden consultar hasta 62 días por vez.',
  tamano_de_paquete_invalido:  'Los paquetes son de 5, 10 o 15 estadías.',
  sin_sesion:                  'No hay sesión activa.',
  datos_inconsistentes:        'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido:           'Ocurrió un error inesperado. Prueba de nuevo.',
} as const;

export type CodigoErrorGuarderiaConfig = keyof typeof MENSAJES;
const CODIGOS = Object.keys(MENSAJES) as CodigoErrorGuarderiaConfig[];

/** L-115: el motor levanta `codigo: detalle`, así que se normaliza por prefijo. */
function fallo<T>(raw: string): ResultadoWrapper<T, CodigoErrorGuarderiaConfig> {
  if (raw === 'auth_required') return fallaCodigo('sin_sesion');
  for (const codigo of CODIGOS) {
    if (raw.startsWith(codigo)) return fallaCodigo(codigo);
  }
  return fallaCodigo('error_desconocido');
}
function fallaCodigo<T>(
  codigo: CodigoErrorGuarderiaConfig,
): ResultadoWrapper<T, CodigoErrorGuarderiaConfig> {
  return { ok: false, codigo, mensaje: MENSAJES[codigo] };
}

/** 0=Domingo … 6=Sábado (regla 32, sin transformaciones). */
export type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type TipoFranjaGuarderia = 'recogida' | 'devolucion';

export interface FranjaGuarderia {
  tipo: TipoFranjaGuarderia;
  /** 'HH:MM:SS' tal como lo devuelve el motor. */
  desde: string;
  hasta: string;
  diasSemana: DiaSemana[];
  zonaHoraria: string;
}

/**
 * 🔴 CUATRO CASOS, NO DOS — firma de la mesa (29-ago): **capacidad 0 NO es
 * «lleno»**. Si el motor no los distinguiera, la pantalla no lo podría inferir
 * sin mentir: los dos llegan como `disponible = 0`.
 */
export type EstadoCupoDia =
  /** ese día ya pasó */               'pasado'
  /** las reservas entran desde mañana */ | 'mismo_dia'
  /** ese día NO abren */              | 'no_opera'
  /** abren, pero se llenó */          | 'sin_lugar'
  /** hay lugar */                     | 'elegible';

export interface CupoDiaGuarderia {
  /** 'YYYY-MM-DD' — FECHA LOCAL DEL LUGAR, jamás derivada de un timestamp UTC. */
  fecha: string;
  capacidad: number;
  consumido: number;
  disponible: number;
  /**
   * 🔴 La capacidad bajó por debajo de lo ya prometido. **El motor jamás
   * cancela una reserva por esto**: lo declara para que el prestador lo vea.
   * *Un día sobrevendido que se resuelve solo es un día en que alguien se
   * queda sin lugar sin que nadie lo decida.*
   */
  sobrevendido: boolean;
  /** El motivo, ya resuelto por el server. La pantalla lo PINTA, no lo deduce. */
  estado: EstadoCupoDia;
}

// ── ESCRITURA ───────────────────────────────────────────────────────────────

export async function definirEspacioGuarderia(params: {
  prestadorId: string;
  nombre: string;
  capacidadPorDia: number;
  diasOperacion?: DiaSemana[];
  activo?: boolean;
}): Promise<ResultadoWrapper<{ espacioId: string }, CodigoErrorGuarderiaConfig>> {
  const { data, error } = await getClient().rpc('definir_espacio_guarderia', {
    p_prestador_id: params.prestadorId,
    p_nombre: params.nombre,
    p_capacidad_por_dia: params.capacidadPorDia,
    p_dias_operacion: params.diasOperacion ?? undefined,
    p_activo: params.activo ?? true,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const id = (data as Record<string, unknown>).espacio_id;
  if (typeof id !== 'string') return fallaCodigo('datos_inconsistentes');
  return { ok: true, data: { espacioId: id } };
}

export async function declararExcepcionEspacioGuarderia(params: {
  espacioId: string;
  /** 'YYYY-MM-DD' */
  fecha: string;
  /** true = abre aunque el patrón diga que no; false = cierra aunque diga que sí. */
  disponible: boolean;
  motivo?: string;
}): Promise<ResultadoWrapper<true, CodigoErrorGuarderiaConfig>> {
  const { data, error } = await getClient().rpc('declarar_excepcion_espacio_guarderia', {
    p_espacio_id: params.espacioId,
    p_fecha: params.fecha,
    p_disponible: params.disponible,
    p_motivo: params.motivo ?? undefined,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  if ((data as Record<string, unknown>).ok !== true) return fallaCodigo('datos_inconsistentes');
  return { ok: true, data: true };
}

export async function definirFranjaGuarderia(params: {
  prestadorId: string;
  tipo: TipoFranjaGuarderia;
  /** 'HH:MM' o 'HH:MM:SS' */
  desde: string;
  hasta: string;
  diasSemana?: DiaSemana[];
  zonaHoraria?: string;
}): Promise<ResultadoWrapper<{ franjaId: string }, CodigoErrorGuarderiaConfig>> {
  const { data, error } = await getClient().rpc('definir_franja_guarderia', {
    p_prestador_id: params.prestadorId,
    p_tipo: params.tipo,
    p_desde: params.desde,
    p_hasta: params.hasta,
    p_dias_semana: params.diasSemana ?? undefined,
    p_zona_horaria: params.zonaHoraria ?? 'America/Guayaquil',
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const id = (data as Record<string, unknown>).franja_id;
  if (typeof id !== 'string') return fallaCodigo('datos_inconsistentes');
  return { ok: true, data: { franjaId: id } };
}

// ── LECTURA ─────────────────────────────────────────────────────────────────

export async function obtenerFranjasGuarderia(
  prestadorId: string,
): Promise<ResultadoWrapper<FranjaGuarderia[], CodigoErrorGuarderiaConfig>> {
  const { data, error } = await getClient().rpc('obtener_franjas_guarderia', {
    p_prestador_id: prestadorId,
  });
  if (error) return fallo(error.message);
  if (!Array.isArray(data)) return fallaCodigo('datos_inconsistentes');
  const salida: FranjaGuarderia[] = [];
  for (const f of data) {
    if (typeof f !== 'object' || f === null) return fallaCodigo('datos_inconsistentes');
    const r = f as Record<string, unknown>;
    if (r.tipo !== 'recogida' && r.tipo !== 'devolucion') return fallaCodigo('datos_inconsistentes');
    if (typeof r.desde !== 'string' || typeof r.hasta !== 'string') return fallaCodigo('datos_inconsistentes');
    if (!Array.isArray(r.dias_semana)) return fallaCodigo('datos_inconsistentes');
    salida.push({
      tipo: r.tipo,
      desde: r.desde,
      hasta: r.hasta,
      diasSemana: r.dias_semana as DiaSemana[],
      zonaHoraria: typeof r.zona_horaria === 'string' ? r.zona_horaria : 'America/Guayaquil',
    });
  }
  return { ok: true, data: salida };
}

/**
 * El cupo de un rango **en UN SOLO VIAJE**.
 *
 * 🔴 Existe como RPC de rango a propósito: el calendario pinta un mes, y
 * resolverlo llamando treinta veces al de un día son treinta viajes — el peaje
 * fijo de ~150 ms por petición que S94-PERF midió (*«no hay consultas que
 * optimizar, hay viajes que eliminar»*).
 */
export async function obtenerCupoGuarderia(
  prestadorId: string,
  /** 'YYYY-MM-DD' */
  desde: string,
  hasta: string,
): Promise<ResultadoWrapper<CupoDiaGuarderia[], CodigoErrorGuarderiaConfig>> {
  const { data, error } = await getClient().rpc('cupo_guarderia_del_rango', {
    p_prestador_id: prestadorId,
    p_desde: desde,
    p_hasta: hasta,
  });
  if (error) return fallo(error.message);
  if (!Array.isArray(data)) return fallaCodigo('datos_inconsistentes');
  const salida: CupoDiaGuarderia[] = [];
  for (const d of data) {
    if (typeof d !== 'object' || d === null) return fallaCodigo('datos_inconsistentes');
    const r = d as Record<string, unknown>;
    if (typeof r.fecha !== 'string') return fallaCodigo('datos_inconsistentes');
    if (typeof r.capacidad !== 'number' || typeof r.consumido !== 'number') {
      return fallaCodigo('datos_inconsistentes');
    }
    if (typeof r.disponible !== 'number' || typeof r.sobrevendido !== 'boolean') {
      return fallaCodigo('datos_inconsistentes');
    }
    if (typeof r.estado !== 'string') return fallaCodigo('datos_inconsistentes');
    salida.push({
      fecha: r.fecha,
      capacidad: r.capacidad,
      consumido: r.consumido,
      disponible: r.disponible,
      sobrevendido: r.sobrevendido,
      estado: r.estado as EstadoCupoDia,
    });
  }
  return { ok: true, data: salida };
}

// ── LOS PAQUETES 5·10·15 ────────────────────────────────────────────────────
//
// 🔴 Tres tamaños FIJOS, cada uno con su precio y su interruptor. El prestador
// enciende los que quiera — ninguno, uno, dos o los tres.
//
// 🔴 LA ARITMÉTICA NO VIVE ACÁ: `equivalenciaDePaquete()` de `packages/ui` es
// la única cuenta. *Si se duplicara, las dos superficies podrían dar números
// distintos y el prestador vendería un descuento que la familia no ve.*

export type TamanoPaquete = 5 | 10 | 15;

export interface PaqueteGuarderia {
  tamano: TamanoPaquete;
  precio: number;
  /**
   * `false` = apagado **con su precio guardado**. No estar en la respuesta es
   * otra cosa: nunca se encendió. **Son dos estados distintos y la pantalla
   * los puede distinguir sin preguntar.**
   */
  activo: boolean;
}

export async function definirPaqueteGuarderia(params: {
  prestadorId: string;
  tamano: TamanoPaquete;
  precio: number;
  activo?: boolean;
}): Promise<ResultadoWrapper<{ paqueteId: string }, CodigoErrorGuarderiaConfig>> {
  const { data, error } = await getClient().rpc('definir_paquete_guarderia', {
    p_prestador_id: params.prestadorId,
    p_tamano: params.tamano,
    p_precio: params.precio,
    p_activo: params.activo ?? true,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const id = (data as Record<string, unknown>).paquete_id;
  if (typeof id !== 'string') return fallaCodigo('datos_inconsistentes');
  return { ok: true, data: { paqueteId: id } };
}

export async function obtenerPaquetesGuarderia(
  prestadorId: string,
): Promise<ResultadoWrapper<PaqueteGuarderia[], CodigoErrorGuarderiaConfig>> {
  const { data, error } = await getClient().rpc('obtener_paquetes_guarderia', {
    p_prestador_id: prestadorId,
  });
  if (error) return fallo(error.message);
  if (!Array.isArray(data)) return fallaCodigo('datos_inconsistentes');
  const salida: PaqueteGuarderia[] = [];
  for (const p of data) {
    if (typeof p !== 'object' || p === null) return fallaCodigo('datos_inconsistentes');
    const r = p as Record<string, unknown>;
    if (typeof r.tamano !== 'number' || typeof r.precio !== 'number') {
      return fallaCodigo('datos_inconsistentes');
    }
    if (r.tamano !== 5 && r.tamano !== 10 && r.tamano !== 15) {
      return fallaCodigo('datos_inconsistentes');
    }
    salida.push({ tamano: r.tamano, precio: r.precio, activo: r.activo !== false });
  }
  return { ok: true, data: salida };
}

/* ═══════════════════════════════════════════════════════════════════════════
   RETIRAR Y REEMPLAZAR FRANJAS — cambiar de horario es UN acto
   ═══════════════════════════════════════════════════════════════════════════
   🔴 **Antes no había camino para retirar una franja** (`activo` existía y el
   wrapper no lo exponía), así que cambiar de horario dejaba **dos ventanas
   contradictorias vivas** y la lista de la familia leía las dos. *El prestador
   creía haber cambiado su horario y en realidad había agregado uno.*
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Retira UNA franja. **Soft: `activo = false`, jamás DELETE** — *una franja
 * borrada se lleva la historia de por qué un día pasado tenía esa ventana.*
 *
 * ⚠️ **No frena dejar el tipo sin ventanas, pero lo DICE** en
 * `sinVentanasDeEseTipo`. *Frenarlo trabaría al prestador a mitad de un cambio;
 * callarlo lo dejaría publicado sin horario sin enterarse.* Qué hacer con ese
 * dato es de la pantalla.
 */
export async function retirarFranjaGuarderia(
  franjaId: string,
): Promise<ResultadoWrapper<{ tipo: string; sinVentanasDeEseTipo: boolean }, CodigoErrorGuarderiaConfig>> {
  const { data, error } = await getClient().rpc('retirar_franja_guarderia', {
    p_franja_id: franjaId,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  return {
    ok: true,
    data: {
      tipo: typeof r.tipo === 'string' ? r.tipo : '',
      sinVentanasDeEseTipo: r.sin_ventanas_de_ese_tipo === true,
    },
  };
}

/**
 * 🔴 **CAMBIAR DE PATRÓN EN UN SOLO ACTO.** Retira todas las franjas de ese
 * tipo y define las nuevas **en la misma transacción**.
 *
 * *Hacerlo con dos llamadas deja una ventana —de milisegundos, o de minutos si
 * la segunda falla— **en la que el lugar no tiene horario o tiene dos**. Y en el
 * medio puede entrar una reserva.* **Un cambio de patrón es una sola decisión
 * del prestador; que sea un solo acto no es comodidad, es correctitud.**
 *
 * **Un array vacío es un retiro total DECLARADO**, no un error: el prestador
 * puede dejar de ofrecer ese tramo.
 */
export async function reemplazarFranjasGuarderia(params: {
  prestadorId: string;
  tipo: 'recogida' | 'devolucion';
  franjas: { desde: string; hasta: string; dias_semana: number[]; zona_horaria?: string }[];
}): Promise<ResultadoWrapper<{ definidas: number; sinVentanasDeEseTipo: boolean }, CodigoErrorGuarderiaConfig>> {
  const { data, error } = await getClient().rpc('reemplazar_franjas_guarderia', {
    p_prestador_id: params.prestadorId,
    p_tipo: params.tipo,
    p_franjas: params.franjas,
  });
  if (error) return fallo(error.message);
  if (typeof data !== 'object' || data === null) return fallaCodigo('datos_inconsistentes');
  const r = data as Record<string, unknown>;
  return {
    ok: true,
    data: {
      definidas: typeof r.definidas === 'number' ? r.definidas : 0,
      sinVentanasDeEseTipo: r.sin_ventanas_de_ese_tipo === true,
    },
  };
}
