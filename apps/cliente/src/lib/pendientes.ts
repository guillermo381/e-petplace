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
 * ── ⚠️ SON SEIS CLASES, NO TRES — corrección de mi propia medición ──────────
 * Mi volcado del 8-ago decía que el badge contaba `sol-` · `pre-` · `coord-`.
 * **Es falso: el código siempre contó seis.** Leí las tres primeras del `map`
 * y no seguí hasta el final del arreglo. Es el caso limpio de L-198 —*una letra
 * que describe de MENOS es la que ningún guard puede ver*, porque todo lo que
 * mide compara contra lo que la letra dice, no contra lo que el motor hace.
 * Por eso las seis están enumeradas acá abajo, con su nombre y su fuente.
 *
 * ── 🔎 HALLAZGO DECLARADO, NO RESUELTO (va al gate) ─────────────────────────
 * De las seis, **`cita` es INFORMACIÓN, no una acción pendiente**: una cita ya
 * agendada no espera nada del dueño. Entra en la cuenta porque el badge del
 * Hogar siempre significó *«hay N cosas tuyas en esta lista»*, no *«tenés N
 * cosas por resolver»* — y esa superficie ya pasó gate del founder.
 *
 * **No lo cambio por mi cuenta y ésa es la decisión**: angostar la definición
 * movería un número que el founder ya aceptó en el Hogar. Lo que sí depende de
 * esto es **la VOZ** de la cuenta en el perfil, y por eso la voz va como
 * propuesta al gate y no como hecho: si el founder elige «N por resolver», hay
 * que sacar `cita` de la cuenta; si elige «N cosas de {nombre}», la definición
 * queda como está. **Una sola pregunta decide las dos.**
 */

/** Las seis clases, con el prefijo de `key` que usan las filas del Hogar. */
export type ClasePendiente =
  /** `sol-` · autorización del mostrador esperando al dueño. */
  | 'solicitud'
  /** `pre-` · presupuesto clínico enviado, sin respuesta. */
  | 'presupuesto'
  /** `coord-` · cita firme sin fecha: falta coordinar. */
  | 'porCoordinar'
  /** `vac-` · vacuna venciendo o vencida (jamás emergencia: ésa no es fila). */
  | 'vacuna'
  /** `cita-` · la próxima cita. ⚠️ INFORMACIÓN — ver el hallazgo de arriba. */
  | 'cita'
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
  /** Las tres derivadas salen de `obtenerEstadoHogar`, ya resueltas por quien
   *  llama — acá no se re-calcula `calcularVozHogar`: esa voz es del riel del
   *  Hogar y duplicarla sería el mismo error que esta pieza viene a evitar. */
  tieneAlertaDeVacuna: boolean;
  tieneProximaCita: boolean;
  sinNingunaVacuna: boolean;
}

/**
 * Qué clases están pendientes para UNA mascota. Devuelve la lista y no un
 * número porque **el número solo se puede auditar si se puede ver de qué está
 * hecho**: un `3` no dice nada; `['presupuesto','vacuna','cita']` se discute.
 */
export function pendientesDeMascota(
  mascotaId: string,
  fuentes: FuentesDePendientes,
): ClasePendiente[] {
  const clases: ClasePendiente[] = [];
  for (const s of fuentes.solicitudes) if (s.mascotaId === mascotaId) clases.push('solicitud');
  for (const p of fuentes.presupuestos) if (p.mascotaId === mascotaId) clases.push('presupuesto');
  for (const c of fuentes.porCoordinar) if (c.mascotaId === mascotaId) clases.push('porCoordinar');
  if (fuentes.tieneAlertaDeVacuna) clases.push('vacuna');
  if (fuentes.tieneProximaCita) clases.push('cita');
  if (fuentes.sinNingunaVacuna) clases.push('carnet');
  return clases;
}

/** El número, para las superficies que solo muestran una cuenta. */
export function contarPendientesDe(mascotaId: string, fuentes: FuentesDePendientes): number {
  return pendientesDeMascota(mascotaId, fuentes).length;
}
