/**
 * LA FRONTERA DE F DENTRO DE `packages/api` (letra §3③).
 *
 * F escribe **sólo** bajo `packages/api/src/admin/`. `packages/api/src/index.ts`
 * es de A y NO se toca — por eso este barrel existe: `apps/admin` entra por
 * acá, con alias, en vez de por el índice del paquete.
 *
 * *Si algún día A quiere exponer esto desde el índice del paquete, es un
 * re-export de una línea y esta frontera desaparece sin romper nada.*
 */

export { esAdmin } from './sesion';
export type { CodigoErrorAdmin } from './sesion';

export {
  obtenerCuentasLiquidables,
  obtenerEventosDeCuenta,
  generarLiquidacion,
} from './liquidaciones';
export type {
  FilaLiquidable,
  EventoDetalle,
  CodigoErrorLiquidacion,
  CodigoErrorGenerar,
} from './liquidaciones';

export {
  obtenerBandejaCasos,
  obtenerHojaDelCaso,
  /* 🔴 `tomarCaso` va acá y no en el archivo solo: una función que la puerta
     única no exporta NO EXISTE para la app — es `L-318`, motor sin puerta.
     Casi la dejo afuera. */
  tomarCaso,
  resolverCaso,
  responderEnCaso,
  /* La propuesta de Nexo. Mismo motivo que `tomarCaso`: sin esta línea la
     capacidad existe y la pantalla no la alcanza. */
  pedirPropuestaDelCaso,
  ETAPAS_ABIERTAS,
  ETAPAS_FINALES,
} from './postventa';
export type {
  FilaBandeja,
  HojaDelCaso,
  MensajeCaso,
  PlataDelCaso,
  AlcanceResolucion,
  CodigoErrorPostventa,
  CodigoErrorResolver,
  PropuestaDelCaso,
  ResultadoPropuesta,
} from './postventa';

export { initApi, getClient, uidActual } from '../client';
export type { ResultadoWrapper } from '../resultado';
