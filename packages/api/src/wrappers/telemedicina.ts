/**
 * ═══ TELEMEDICINA — la puerta única del quinto oficio ═════════════════════
 *
 * **Letra:** `docs/LETRA_TELEMEDICINA.md` v1.1 · acta de CP1 (10 firmas).
 * **Motor:** migraciones `20260826200000` → `20260826260000` (S106-A).
 *
 * ─── LO QUE ESTE ARCHIVO NO TIENE, y es a propósito ──────────────────────
 *
 * 🔴 **No hay wrapper de `puede_entrar_a_videollamada`.** Esa RPC es
 * `service_role` y la llama **`video-token` desde el servidor**, jamás una
 * app. *Un wrapper suyo acá sería una puerta a algo que la casa decidió que
 * no tuviera puerta de cliente* — y su `p_user_id` es un parámetro, así que
 * exponerla dejaría preguntar por citas ajenas.
 *
 * 🔴 **El consentimiento de la teleconsulta NO vive acá.** Viaja como
 * `acepta_teleconsulta` dentro de `crearBloqueoAgenda` (`agendamiento.ts`),
 * en el MISMO acto que el hold. *Si tuviera función propia serían dos
 * llamadas, y dos llamadas es exactamente el estado que el motor volvió
 * inexpresable.*
 *
 * ─── LA VOZ ──────────────────────────────────────────────────────────────
 * Tuteo neutro (regla 27 / decisión founder S51; `R66` con baseline 0).
 * **La promesa de devolución dice «a tu medio de pago» y JAMÁS «al
 * instante»** — la ejecuta una persona en el panel del proveedor.
 */

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

/* ── Códigos ────────────────────────────────────────────────────────────── */

const CODIGOS_ERROR_TELEMEDICINA = [
  'acceso_denegado',
  'cita_no_encontrada',
  'cita_no_es_teleconsulta',
  'cita_estado_invalido',
  'ventana_cancelacion_vencida',
  'no_es_el_prestador_de_la_cita',
  'usar_cancelar_teleconsulta',
  'servicio_invalido',
  'no_access_to_prestador',
] as const;

export type CodigoErrorTelemedicina = (typeof CODIGOS_ERROR_TELEMEDICINA)[number];

const MENSAJES: Record<
  CodigoErrorTelemedicina | 'error_desconocido' | 'datos_inconsistentes',
  string
> = {
  acceso_denegado: 'No tienes acceso para hacer esto.',
  cita_no_encontrada: 'Esta consulta no existe o ya no es accesible.',
  cita_no_es_teleconsulta: 'Esta cita no es una videoconsulta.',
  // La voz no dice CUÁL estado: el detalle viaja en el código del motor y
  // la pantalla decide cuánto contar según dónde esté parada.
  cita_estado_invalido: 'Esta consulta ya no está en un estado que permita hacer esto.',
  // 🔴 La ventana la dice el CATÁLOGO, no esta cadena. Si la pantalla quiere
  // nombrar los minutos, los lee del motor — hardcodearlos acá los volvería
  // mentira el día que el founder mueva el parámetro.
  ventana_cancelacion_vencida:
    'Ya pasó el momento de cancelar sin costo. Escríbenos y lo vemos.',
  no_es_el_prestador_de_la_cita: 'Solo quien atiende esta consulta puede marcarla.',
  // Error de integración, no del usuario: la pantalla vieja llamó a la
  // puerta genérica. La voz manda a reintentar, no a "elegir otra hora".
  usar_cancelar_teleconsulta: 'No pudimos completar la acción. Prueba de nuevo.',
  servicio_invalido: 'Este servicio no está disponible.',
  no_access_to_prestador: 'No tienes acceso a este negocio.',
  datos_inconsistentes: 'La respuesta del servidor no tiene la forma esperada.',
  error_desconocido: 'Ocurrió un error inesperado. Prueba de nuevo.',
};

function normalizar(raw: string): CodigoErrorTelemedicina | 'error_desconocido' {
  if (raw === 'auth_required') return 'acceso_denegado';
  // L-115: los códigos vienen con sufijo ': <detalle>' — se normaliza por
  // PREFIJO, jamás por igualdad.
  for (const codigo of CODIGOS_ERROR_TELEMEDICINA) {
    if (raw.startsWith(codigo)) return codigo;
  }
  return 'error_desconocido';
}

function aError<T>(raw: string): ResultadoWrapper<T, CodigoErrorTelemedicina> {
  const codigo = normalizar(raw);
  return { ok: false, codigo, mensaje: MENSAJES[codigo] };
}

type Obj = Record<string, unknown>;
const esObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

/* ── §6/§8 · LA HABILITACIÓN ────────────────────────────────────────────── */

export interface MinimosAceptados {
  prestador_id: string;
  servicio: string;
  /** La versión del texto de mínimos que quedó registrada. La pone el
   *  servidor — la pantalla no la manda ni la elige. */
  version: string;
  aceptado_en: string;
}

/**
 * El prestador acepta los mínimos declarados de §6 al prender el servicio.
 *
 * **Idempotente**: aceptar dos veces la misma versión no es un error — es la
 * misma verdad dicha dos veces, y la primera fecha es la que vale.
 *
 * ⚠️ **Sin esto, su oferta de telemedicina NO SE PUBLICA** — el gate vive en
 * la lectura de la vitrina, así que alcanza también a ofertas que ya estaban
 * prendidas desde antes de que los mínimos existieran.
 */
export async function aceptarMinimosServicio(
  prestadorId: string,
  servicioCodigo: string,
): Promise<ResultadoWrapper<MinimosAceptados, CodigoErrorTelemedicina>> {
  const { data, error } = await getClient().rpc('aceptar_minimos_servicio', {
    p_prestador_id: prestadorId,
    p_servicio_codigo: servicioCodigo,
  });
  if (error) return aError(error.message);
  if (!esObj(data)) return aError('datos_inconsistentes');
  const o = data;
  if (
    o.ok !== true ||
    typeof o.prestador_id !== 'string' ||
    typeof o.servicio !== 'string' ||
    typeof o.version !== 'string' ||
    typeof o.aceptado_en !== 'string'
  ) {
    return aError('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      prestador_id: o.prestador_id,
      servicio: o.servicio,
      version: o.version,
      aceptado_en: o.aceptado_en,
    },
  };
}

/**
 * ¿Este negocio ya aceptó los mínimos VIGENTES de este servicio?
 *
 * 🔴 **«Prendido sin aceptación» se lee combinando DOS cosas, no una:**
 * `prestador_servicios.reservable === true` **y** este lector en `false`.
 * *La oferta está prendida y no se publica* — y la pantalla debería decir
 * eso, no apagarla: apagarla mentiría sobre lo que el prestador configuró.
 *
 * ⚠️ Devuelve `false` también cuando el TEXTO de los mínimos cambia de
 * versión, y está bien: aceptó otro texto.
 */
export async function prestadorAceptoMinimos(
  prestadorId: string,
  servicioCodigo: string,
): Promise<ResultadoWrapper<boolean, CodigoErrorTelemedicina>> {
  const { data, error } = await getClient().rpc('prestador_acepto_minimos', {
    p_prestador_id: prestadorId,
    p_servicio_codigo: servicioCodigo,
  });
  if (error) return aError(error.message);
  if (typeof data !== 'boolean') return aError('datos_inconsistentes');
  return { ok: true, data };
}

/* ── §4 · LA VENTANA, PARA DECIRLA ANTES ────────────────────────────────── */

/**
 * Los minutos de ventana de cancelación de un tipo de servicio.
 *
 * 🔴 **Existe para que la pantalla pueda DECIR la ventana antes de cancelar,
 * sin hardcodearla.** Hasta ahora el número solo volvía dentro del resultado
 * de `cancelarTeleconsulta` — o sea, *después*, que es cuando ya no sirve
 * para avisar.
 *
 * *Un `30` escrito en la app envejece el día que el founder mueva el
 * parámetro, y su modo de falla es el peor: la pantalla sigue diciendo un
 * número con toda confianza y el motor rebota por otro.*
 *
 * Hoy devuelve **30** para `telemedicina` y **1440** (24 h) para el resto.
 * Un tipo desconocido cae al default de 1440 — el motor es fail-safe hacia
 * el lado seguro, jamás hacia «sin ventana».
 */
export async function ventanaCancelacionMinutos(
  tipoServicio: string,
): Promise<ResultadoWrapper<number, CodigoErrorTelemedicina>> {
  const { data, error } = await getClient().rpc('_ventana_cancelacion_minutos', {
    p_tipo_servicio: tipoServicio,
  });
  if (error) return aError(error.message);
  if (typeof data !== 'number' || !Number.isFinite(data)) return aError('datos_inconsistentes');
  return { ok: true, data };
}

/* ── §5 · LA CONSULTA QUE SE CORTA ──────────────────────────────────────── */

export interface ResultadoDevolucion {
  cita_id: string;
  estado: string;
  /** `true` si quedó una solicitud para que soporte devuelva la plata.
   *  `false` si no había nada que devolver (la cita no estaba pagada). */
  devolucion_registrada: boolean;
  monto: number | null;
}

/**
 * §5 — el veterinario marca que la consulta no se pudo realizar.
 *
 * 🔴 **NO se investiga de quién fue la culpa, y es deliberado**: el sistema
 * no mide la conexión de nadie, así que no puede atribuirla. *Un proceso de
 * disputa sobre un hecho que nadie registró produce una resolución
 * arbitraria con apariencia de justicia.*
 *
 * ⚠️ **La pantalla no debe sugerir que el sistema sabe qué falló.** No lo
 * sabe y no puede saberlo.
 *
 * **La plata vuelve al MEDIO DE PAGO, gestionada por soporte** — el sistema
 * REGISTRA la solicitud, no la ejecuta ni la promete.
 */
export async function marcarTeleconsultaNoRealizable(
  citaId: string,
  detalle?: string,
): Promise<ResultadoWrapper<ResultadoDevolucion, CodigoErrorTelemedicina>> {
  const { data, error } = await getClient().rpc('marcar_teleconsulta_no_realizable', {
    p_cita_id: citaId,
    ...(detalle !== undefined ? { p_detalle: detalle } : null),
  });
  if (error) return aError(error.message);
  if (!esObj(data)) return aError('datos_inconsistentes');
  const o = data;
  if (
    o.ok !== true ||
    typeof o.cita_id !== 'string' ||
    typeof o.estado !== 'string' ||
    typeof o.devolucion_registrada !== 'boolean'
  ) {
    return aError('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      cita_id: o.cita_id,
      estado: o.estado,
      devolucion_registrada: o.devolucion_registrada,
      monto: typeof o.monto === 'number' ? o.monto : null,
    },
  };
}

/* ── §4 · LA CANCELACIÓN EN VENTANA ─────────────────────────────────────── */

export interface ResultadoCancelacionTeleconsulta extends ResultadoDevolucion {
  /** Los minutos de ventana que rigieron. Sale del CATÁLOGO — la pantalla
   *  lo usa para hablar en vez de hardcodear un 30 que puede envejecer. */
  ventana_minutos: number;
  /** `'medio_de_pago_por_soporte'` cuando hay plata que devolver.
   *  🔴 Existe **para que la voz no invente**: la promesa firmada es «a tu
   *  medio de pago» con plazo honesto, JAMÁS «al instante» ni «como saldo». */
  via_devolucion: string | null;
}

/**
 * §4 — la familia cancela su videoconsulta sin penalidad.
 *
 * **La ventana la dice el motor** (`tipos_servicio.ventana_cancelacion_minutos`,
 * hoy 30 min para telemedicina). Fuera de ella rebota
 * `ventana_cancelacion_vencida`.
 *
 * ⚠️ **`cancelarCitaSuelta` YA NO acepta teleconsultas** — rebota
 * `usar_cancelar_teleconsulta`. Si una pantalla vieja llamaba a la genérica,
 * hay que rutearla acá. *Dos puertas para el mismo acto es una puerta que
 * nadie vigila.*
 */
export async function cancelarTeleconsulta(
  citaId: string,
): Promise<ResultadoWrapper<ResultadoCancelacionTeleconsulta, CodigoErrorTelemedicina>> {
  const { data, error } = await getClient().rpc('cancelar_teleconsulta', {
    p_cita_id: citaId,
  });
  if (error) return aError(error.message);
  if (!esObj(data)) return aError('datos_inconsistentes');
  const o = data;
  if (
    o.ok !== true ||
    typeof o.cita_id !== 'string' ||
    typeof o.estado !== 'string' ||
    typeof o.ventana_minutos !== 'number' ||
    typeof o.devolucion_registrada !== 'boolean'
  ) {
    return aError('datos_inconsistentes');
  }
  return {
    ok: true,
    data: {
      cita_id: o.cita_id,
      estado: o.estado,
      ventana_minutos: o.ventana_minutos,
      devolucion_registrada: o.devolucion_registrada,
      monto: typeof o.monto === 'number' ? o.monto : null,
      via_devolucion: typeof o.via_devolucion === 'string' ? o.via_devolucion : null,
    },
  };
}

/* ── S106-A t2 · LA CONFIGURACIÓN DE VIDEO ─────────────────────────────────
 *
 * 🔴 **EL BITRATE NO ES UNA CONSTANTE DE APP.** Un número horneado en el
 *    bundle sólo se mueve publicando, y el eje que corta primero en el plan de
 *    video son los GB — o sea que el día que haya que bajarlo, hay que poder
 *    bajarlo HOY.
 *
 * ⚠️ **No confundir con los 1,5 Mbps de `LETRA_TELEMEDICINA` §6**: ésos son
 *    requisito de la **conexión del profesional**, que el sistema declara y no
 *    mide. **No son promesa de calidad del stream.** *Son dos números sobre
 *    dos cosas distintas, y confundirlos haría que bajar el consumo se lea
 *    como romper la letra.*
 */
export interface ConfigVideo {
  /** kbps. **Nunca llega null**: el default vive en el cuerpo de la función. */
  bitrateKbps: number;
}

export async function obtenerConfigVideo(): Promise<
  ResultadoWrapper<ConfigVideo, 'no_se_pudo_completar'>
> {
  const { data, error } = await getClient().rpc('obtener_config_video');
  if (error) return { ok: false, codigo: 'no_se_pudo_completar', mensaje: error.message };

  const d = (data ?? {}) as Record<string, unknown>;
  const n = typeof d.bitrate_kbps === 'number' ? d.bitrate_kbps : Number(d.bitrate_kbps);
  if (!Number.isFinite(n) || n <= 0) {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: 'bitrate_invalido' };
  }
  return { ok: true, data: { bitrateKbps: n } };
}

/* ── LA VERIFICACIÓN PROFESIONAL ─────────────────────────────────────────── */

/**
 * ¿Este negocio tiene su verificación profesional aprobada?
 *
 * 🔴 **EXISTE PARA QUE LA PANTALLA NO TENGA QUE CHOCAR PARA ENTERARSE.** El
 * gate ya era ley desde S79 —`trg_ps_verificacion_profesional` rebota
 * `verificacion_profesional_pendiente` al activar cualquier servicio cuyo tipo
 * pida validación, telemedicina incluida— pero **no había forma de
 * preguntar**: la única manera de saberlo era intentar y fallar.
 *
 * > *Un toggle que se mueve y rebota promete una acción que el servidor va a
 * > negar. La Ley 23 pide lo contrario: la puerta no ofrece lo que va a
 * > rechazar.*
 *
 * El servidor devuelve el **espejo exacto** del predicado del trigger, y su
 * migración lo ejerce con un discriminador de no-divergencia (los dos corren
 * contra el mismo prestador y tienen que coincidir).
 *
 * ⚠️ **Su `false` NO es un permiso denegado: es un requisito pendiente.** La
 * voz correcta nombra el camino («subí tu título o tu registro»), jamás
 * «no tienes acceso». *Confundir un trámite con una prohibición manda al vet
 * a soporte a discutir permisos que nadie le quitó.*
 *
 * ⚠️ Y su `true` dice **«tiene el documento aprobado»**, jamás «puede activar
 * telemedicina»: los mínimos de §6 son una condición aparte, y la mide
 * `prestadorAceptoMinimos`.
 */
export async function prestadorTieneVerificacionProfesional(
  prestadorId: string,
): Promise<ResultadoWrapper<boolean, 'no_se_pudo_completar'>> {
  const { data, error } = await getClient().rpc('prestador_verificacion_profesional', {
    p_prestador_id: prestadorId,
  });
  if (error) return { ok: false, codigo: 'no_se_pudo_completar', mensaje: error.message };
  /* 🔴 Un `null` NO se degrada a `false`. «No pude averiguarlo» y «no está
     verificado» son dos cosas distintas, y colapsarlas le diría a un vet
     verificado que le falta un trámite que ya hizo. */
  if (typeof data !== 'boolean') {
    return { ok: false, codigo: 'datos_inconsistentes', mensaje: 'veredicto_no_booleano' };
  }
  return { ok: true, data };
}
