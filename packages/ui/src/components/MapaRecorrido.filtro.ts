/**
 * El filtro del DIBUJO del track (S81, D-578 ①②) — compartido por la
 * implementación nativa y por el script de medición.
 *
 * LA LEY: el crudo NO se toca — el filtro corre al dibujar, jamás al
 * guardar (el track de DB es evidencia; el dibujo es lectura).
 *
 * Reglas, en orden:
 *  a) ORDENAR por `t` antes de trazar (sort estable; puntos sin `t`
 *     conservan su posición relativa — no se inventa un orden).
 *  b) DESCARTAR un punto SOLO si la velocidad implícita de sus DOS
 *     aristas (llegada Y salida) supera VELOCIDAD_MAX_MS. Una sola
 *     arista rápida no condena: puede ser el vecino el que salta.
 *     Corolario estructural: el primer y el último punto tienen UNA
 *     arista — jamás se descartan.
 *  c) El encuadre (fitToCoordinates) se hace SOBRE EL SET FILTRADO —
 *     eso vive en MapaRecorrido.tsx, que consume este resultado.
 *  d) Punto sin `t` = velocidad no computable = NO excede (el filtro
 *     solo juzga lo que puede medir, principio L-139).
 *
 * Umbral: 15 m/s (54 km/h) — muy por encima de todo paseo real y por
 * debajo de la púa GPS típica (saltos de cientos de metros en segundos).
 * Se recalibra CON EL NÚMERO del reporte de medición, jamás a ojo (L-131).
 */

import type { PuntoLatLng } from './MapaRecorrido.tipos'

export const VELOCIDAD_MAX_MS = 15

const RADIO_TIERRA_M = 6_371_000

/** Haversine en metros. */
export function distanciaM(a: PuntoLatLng, b: PuntoLatLng): number {
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLng = (b.lng - a.lng) * rad
  const sLat = Math.sin(dLat / 2)
  const sLng = Math.sin(dLng / 2)
  const h =
    sLat * sLat + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * sLng * sLng
  return 2 * RADIO_TIERRA_M * Math.asin(Math.sqrt(h))
}

/**
 * Velocidad implícita de la arista a→b en m/s.
 * null = no computable (algún extremo sin `t`): no excede por regla (d).
 * dt<=0 con distancia >0 = teletransporte: Infinity (excede).
 * dt<=0 con distancia 0 = punto repetido (flush duplicado S62): 0.
 */
function velocidadArista(a: PuntoLatLng, b: PuntoLatLng): number | null {
  if (!a.t || !b.t) return null
  const ta = Date.parse(a.t)
  const tb = Date.parse(b.t)
  if (Number.isNaN(ta) || Number.isNaN(tb)) return null
  const d = distanciaM(a, b)
  const dt = (tb - ta) / 1000
  if (dt <= 0) return d === 0 ? 0 : Infinity
  return d / dt
}

export function filtrarTrackDibujo(puntos: PuntoLatLng[]): PuntoLatLng[] {
  // Con <3 puntos ningún punto tiene dos aristas: no hay veredicto posible.
  if (puntos.length < 3) return puntos

  // (a) orden por t — sort nativo es estable: los sin-t no se mueven.
  const orden = [...puntos].sort((p, q) => {
    if (!p.t || !q.t) return 0
    return Date.parse(p.t) - Date.parse(q.t)
  })

  // Velocidad de cada arista i→i+1, una sola pasada.
  const v: (number | null)[] = []
  for (let i = 0; i < orden.length - 1; i++) v.push(velocidadArista(orden[i], orden[i + 1]))

  // (b) ambas aristas por encima del umbral — sobre la secuencia original,
  // sin cascada: el veredicto de cada punto se toma contra sus vecinos crudos.
  const excede = (x: number | null) => x !== null && x > VELOCIDAD_MAX_MS
  return orden.filter((_, i) => {
    if (i === 0 || i === orden.length - 1) return true
    return !(excede(v[i - 1]) && excede(v[i]))
  })
}
