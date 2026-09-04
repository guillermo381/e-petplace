/**
 * S91-D · A8 — LO QUE LE ESPERA A UNA MASCOTA, CONTADO EN UN SOLO LUGAR.
 *
 * ── POR QUÉ EXISTE, y es letra de mesa ──────────────────────────────────────
 * El cómputo vivía inline en `hogar/index.tsx` (`pendientesDe`, derivado de las
 * filas de «Ponte al día»). Cuando el perfil necesitó el mismo número, la mesa
 * adoptó la regla antes de que existiera el segundo consumidor: **el perfil
 * jamás lo re-implementa.** Dos pantallas que escriben la misma definición no
 * divergen el día que se escriben — divergen tres sesiones después, cuando
 * alguien agrega una clase de pendiente en una y no en la otra, y **las dos
 * siguen compilando y las dos siguen mostrando un número creíble**.
 *
 * ── ⚠️ LA MEDICIÓN QUE CORRIGIÓ A MI PROPIA LETRA ──────────────────────────
 * Mi volcado del 8-ago decía que el badge contaba `sol-` · `pre-` · `coord-`.
 * **Era falso: el código contaba SEIS.** Leí las tres primeras del `map` y no
 * seguí hasta el final del arreglo. Es el caso limpio de L-198 —*una letra que
 * describe de MENOS es la que ningún guard puede ver*, porque todo lo que mide
 * compara contra lo que la letra dice, no contra lo que el motor hace. Por eso
 * las clases están ENUMERADAS acá abajo, una por una: el conteo que no se
 * puede leer no se puede auditar.
 *
 * ── ✅ FIRMADO: SON CINCO, PORQUE LA VOZ LO DECIDIÓ ─────────────────────────
 * El conteo nació con SEIS clases y yo declaré el roce sin resolverlo: **`cita`
 * es INFORMACIÓN, no una acción pendiente** — una cita ya agendada no espera
 * nada del dueño. Entraba porque el badge del Hogar significaba *«hay N cosas
 * tuyas en esta lista»*, y esa superficie ya había pasado gate.
 *
 * La mesa firmó **«N por resolver»**, y esa voz obliga: lo que se nombra
 * *resolver* no puede incluir algo que no se resuelve. **`cita` SALE.** Por eso
 * la pregunta era una sola y decidía las dos cosas — la voz y la definición no
 * son capas separadas: **una voz honesta es una restricción sobre el dato**.
 *
 * ⚠️ Y sale para LAS DOS superficies, no solo para el perfil: el badge del
 * Hogar consume esta misma pieza. Dejar que el Hogar contara seis y el perfil
 * cinco sería exactamente la divergencia que esta lib existe para impedir —
 * con el agravante de que esta vez la habría metido yo, a sabiendas.
 */

/** LAS CINCO, con el prefijo de `key` que usan las filas del Hogar. */
export type ClasePendiente =
  /** `sol-` · autorización del mostrador esperando al dueño. */
  | 'solicitud'
  /** `pre-` · presupuesto clínico enviado, sin respuesta. */
  | 'presupuesto'
  /** `coord-` · cita firme sin fecha: falta coordinar. */
  | 'porCoordinar'
  /** `vac-` · vacuna venciendo o vencida (jamás emergencia: ésa no es fila). */
  | 'vacuna'
  /** `carnet-` · todavía sin una sola vacuna cargada. */
  | 'carnet';

/**
 * LAS FUENTES, en la forma MÍNIMA que el conteo necesita.
 *
 * Pide `{ mascotaId }` y no los tipos completos de los wrappers a propósito:
 * así la pieza no se acopla a `PresupuestoFamilia` ni a `SolicitudPendiente`, y
 * el día que uno de esos contratos gane un campo, esto no se entera. Lo que
 * cuenta es la PERTENENCIA a una mascota, nada más.
 */
export interface FuentesDePendientes {
  solicitudes: readonly { readonly mascotaId: string | null }[];
  presupuestos: readonly { readonly mascotaId: string | null }[];
  porCoordinar: readonly { readonly mascotaId: string | null }[];
  /** Las dos derivadas salen de `obtenerEstadoHogar`, ya resueltas por quien
   *  llama — acá no se re-calcula `calcularVozHogar`: esa voz es del riel del
   *  Hogar y duplicarla sería el mismo error que esta pieza viene a evitar.
   *
   *  ⚠️ `tieneProximaCita` YA NO ESTÁ, y su ausencia es la firma: una cita
   *  agendada no se resuelve. Si vuelve, vuelve con su voz. */
  tieneAlertaDeVacuna: boolean;
  sinNingunaVacuna: boolean;
  /**
   * 🔴 **`D-1026` — LA LIB LEE EL MISMO HECHO QUE TODO LO DEMÁS.** El globo de
   * la tira del Hogar seguía diciendo «1» sobre una mascota que ya no está, y
   * **quien lo destapó fue el cotejo de dev de esta misma casa**: las filas ya
   * filtraban por mascota y la lib no, así que la consola avisó *«las filas
   * dicen 0 y la lib 1»*. Ese aviso existía para cazar una clase de fila
   * nueva; cazó una asimetría entre dos curas.
   *
   * Va acá y no en el llamador porque **la lib es la pieza compartida**: curar
   * al que llama deja al próximo consumidor contando de nuevo. Y es
   * OBLIGATORIO a propósito — el compilador le pide el dato a cada superficie,
   * que es la única forma de que ninguna se olvide.
   */
  enMemoria: boolean;
}

/**
 * Qué clases están pendientes para UNA mascota. Devuelve la lista y no un
 * número porque **el número solo se puede auditar si se puede ver de qué está
 * hecho**: un `3` no dice nada; `['presupuesto','vacuna','carnet']` se discute.
 */
export function pendientesDeMascota(
  mascotaId: string,
  fuentes: FuentesDePendientes,
): ClasePendiente[] {
  /* Nada se le resuelve a quien ya no está: no es que las clases den cero, es
     que la pregunta no aplica (`A3.9` · `MODELO_LOYALTY §7.1`). */
  if (fuentes.enMemoria) return [];
  const clases: ClasePendiente[] = [];
  for (const s of fuentes.solicitudes) if (s.mascotaId === mascotaId) clases.push('solicitud');
  for (const p of fuentes.presupuestos) if (p.mascotaId === mascotaId) clases.push('presupuesto');
  for (const c of fuentes.porCoordinar) if (c.mascotaId === mascotaId) clases.push('porCoordinar');
  if (fuentes.tieneAlertaDeVacuna) clases.push('vacuna');
  if (fuentes.sinNingunaVacuna) clases.push('carnet');
  return clases;
}

/** El número, para las superficies que solo muestran una cuenta. */
export function contarPendientesDe(mascotaId: string, fuentes: FuentesDePendientes): number {
  return pendientesDeMascota(mascotaId, fuentes).length;
}
