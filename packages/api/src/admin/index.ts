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
  resolverCaso,
  responderEnCaso,
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
} from './postventa';

export { initApi, getClient, uidActual } from '../client';
export type { ResultadoWrapper } from '../resultado';
