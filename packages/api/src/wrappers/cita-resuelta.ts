/**
 * S105-A · LA CITA RESUELTA — el lector que contesta CUALQUIERA SEA SU ESTADO.
 *
 * **Por qué existe, y no es un lector más:** ningún wrapper resolvía una cita
 * por id sin filtrar por estado. Los que reciben `citaId` son de ACCIÓN
 * (confirmar, iniciar, completar, cancelar) o de un oficio puntual. ⇒ una
 * pantalla que abría una cita cancelada **no podía distinguir «no existe» de
 * «existe y está cancelada»**, y la única voz posible era la conjetura
 * *«puede haberse movido o cancelado»*.
 *
 * 🔴 **DÓNDE SE USA, Y DÓNDE NO — la regla es de superficie, no de estado:**
 *
 * > *Una cita cancelada aparece SÓLO donde la superficie promete contar lo que
 * > **PASÓ**. Donde promete lo que **VIENE**, excluirla es correcto — y en una
 * > agenda de trabajo es obligatorio.*
 *
 * Por eso este lector es para el **DETALLE**, jamás para listas ni agendas.
 * `obtener_jornada_recepcion` sigue excluyendo `cancelada` **por la ley §13**
 * (*«la agenda solo contiene verdad firme»*), escrita en su propio cuerpo — y
 * los cuatro lectores de «lo que viene» también. **Ninguno de los 16 sitios
 * censados cambió.** *La persona fue a preguntar al detalle, no a la agenda.*
 */

import { getClient } from '../client';
import type { ResultadoWrapper } from '../resultado';

export type CodigoCitaResuelta =
  | 'sin_sesion'
  /**
   * 🔴 **AMBIGUO A PROPÓSITO: «no existe» y «es de otro» dan ESTE MISMO
   * código.** Si la puerta distinguiera, la diferencia misma le confirmaría a
   * un tercero que esa cita existe — la convertiría en un oráculo. *La voz de
   * pantalla tiene que ser igual de ambigua: afinarla deshace el gate desde el
   * lado del texto.* (Mismo criterio que `compra_no_existe` en DeUna.)
   */
  | 'cita_no_existe';

/**
 * Por qué se canceló. **Hoy hay dos causas vivas que escriben el mismo estado**
 * y sin esto la pantalla no puede distinguirlas.
 */
export type CausaCancelacion =
  /** El proveedor devolvió el cobro y el motor canceló el compromiso. */
  | 'pago_reversado'
  /** La cita murió con el período de su plan. */
  | 'cierre_de_plan'
  /** Hay un motivo registrado, pero no es de las dos conocidas. */
  | 'otra'
  /**
   * 🔴 **NO ES «otra» NI UN HUECO QUE HAYA QUE TAPAR.** Hay citas canceladas
   * **antes** de que nadie guardara el porqué. *Colapsarla con `otra`
   * afirmaría que hubo una razón registrada.* **La pantalla dice lo que sabe.**
   */
  | 'desconocida';

export type CitaResuelta = {
  citaId: string;
  estado: string;
  estadoReserva: string | null;
  fecha: string;
  hora: string;
  tipoServicio: string | null;
  prestadorId: string | null;
  mascotaId: string | null;
  cancelada: boolean;
  /** `null` cuando la cita **no** está cancelada. */
  causaCancelacion: CausaCancelacion | null;
  /**
   * El motivo tal como quedó guardado. Útil para forense, no para pintar.
   *
   * ⚠️ **NO es la columna `motivo` de la cita** — ésa es el motivo de CONSULTA
   * que escribió la familia al reservar (*«cojea de la pata trasera»*). Este
   * sale de `metadata`. *Confundirlas pondría el síntoma del perro donde va la
   * razón de un movimiento de plata, y no lo cazaría ningún typecheck: los dos
   * son texto.*
   */
  motivoCrudo: string | null;
  /** Instante del reverso, sólo cuando la causa es `pago_reversado`. */
  canceladaEn: string | null;
};

function esObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function esCausa(v: unknown): v is CausaCancelacion {
  return v === 'pago_reversado' || v === 'cierre_de_plan'
      || v === 'otra' || v === 'desconocida';
}

function fallo(
  mensaje: string, codigo?: CodigoCitaResuelta,
): ResultadoWrapper<CitaResuelta, CodigoCitaResuelta> {
  return { ok: false, codigo: codigo ?? 'error_desconocido', mensaje };
}

/**
 * Resuelve UNA cita por id, sin filtrar por estado.
 *
 * Gate del servidor: la familia (por acceso a la mascota), quien atiende (por
 * prestador) o admin. Cualquier otro recibe `cita_no_existe`.
 */
export async function leerCitaResuelta(
  citaId: string,
): Promise<ResultadoWrapper<CitaResuelta, CodigoCitaResuelta>> {
  const { data, error } = await getClient().rpc('obtener_cita_resuelta', {
    p_cita_id: citaId,
  });
  if (error) return fallo(error.message);
  if (!esObj(data)) return fallo('datos_inconsistentes');

  if (data.ok !== true) {
    const c = typeof data.codigo === 'string' ? data.codigo : 'error_desconocido';
    return fallo(c, c === 'sin_sesion' || c === 'cita_no_existe' ? c : undefined);
  }

  if (
    typeof data.cita_id !== 'string' ||
    typeof data.estado !== 'string' ||
    typeof data.fecha !== 'string' ||
    typeof data.hora !== 'string' ||
    typeof data.cancelada !== 'boolean'
  ) {
    return fallo('datos_inconsistentes');
  }

  /* 🔴 LA CAUSA SE VALIDA CONTRA EL VOCABULARIO, no se castea.
     Si el server agregara una causa nueva, un `as CausaCancelacion` la dejaría
     pasar y la pantalla la mapearía a `undefined` — **muda justo en el caso que
     menos sabemos explicar**. Acá una causa desconocida cae en
     `datos_inconsistentes`, que es una voz que sí existe. */
  const causa = data.causa_cancelacion;
  if (causa !== null && causa !== undefined && !esCausa(causa)) {
    return fallo('datos_inconsistentes');
  }
  /* Y el invariante al revés: **cancelada ⇒ hay causa**. Sin esto, una cita
     cancelada sin causa se pintaría igual que una no cancelada. */
  if (data.cancelada === true && !esCausa(causa)) {
    return fallo('datos_inconsistentes');
  }

  return {
    ok: true,
    data: {
      citaId: data.cita_id,
      estado: data.estado,
      estadoReserva: typeof data.estado_reserva === 'string' ? data.estado_reserva : null,
      fecha: data.fecha,
      hora: data.hora,
      tipoServicio: typeof data.tipo_servicio === 'string' ? data.tipo_servicio : null,
      prestadorId: typeof data.prestador_id === 'string' ? data.prestador_id : null,
      mascotaId: typeof data.mascota_id === 'string' ? data.mascota_id : null,
      cancelada: data.cancelada,
      causaCancelacion: esCausa(causa) ? causa : null,
      motivoCrudo: typeof data.motivo_crudo === 'string' ? data.motivo_crudo : null,
      canceladaEn: typeof data.cancelada_en === 'string' ? data.cancelada_en : null,
    },
  };
}
