/**
 * El filtro del DIBUJO del track (S81, D-578 ①②).
 *
 * S81 (pedido de B a A, enmienda 76(d) declarada): la implementación
 * SUBIÓ a @epetplace/domain (filtroTrack.ts) porque el CÁLCULO de
 * distancia (Vitales) consume la misma verdad — dibujo y cálculo jamás
 * pueden divergir en qué punto es outlier. Este archivo queda como
 * frontera de compatibilidad: mismo path, mismos nombres, UNA sola
 * implementación. La letra completa (reglas a-c, umbral calibrado con
 * número, la ley "el crudo no se toca") vive con el código en domain.
 */

import { filtrarTrack } from '@epetplace/domain'

import type { PuntoLatLng } from './MapaRecorrido.tipos'

export { distanciaM, VELOCIDAD_MAX_MS } from '@epetplace/domain'

export function filtrarTrackDibujo(puntos: PuntoLatLng[]): PuntoLatLng[] {
  return filtrarTrack(puntos)
}
