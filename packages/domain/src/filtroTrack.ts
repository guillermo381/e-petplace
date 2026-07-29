/**
 * EL FILTRO DEL TRACK (S81, D-578) — LA PIEZA ÚNICA.
 *
 * Nació en packages/ui (MapaRecorrido.filtro.ts, S81-B1) como filtro del
 * DIBUJO; S81 lo sube a domain porque el CÁLCULO de distancia (Vitales)
 * consume la misma verdad — dibujo y cálculo jamás pueden divergir en qué
 * punto es outlier (pedido de B, S81; el número que lo ordenó: la
 * distancia CRUDA del paseo del 28-jul daba 4820 m contra 3360 m
 * filtrados — +30.3% por UN solo outlier; el en-curso del 29-jul, +48%).
 * packages/ui re-exporta desde acá — UNA implementación, cero copias.
 *
 * LA LEY: el crudo NO se toca — el filtro corre al LEER (dibujar o
 * calcular), jamás al guardar (el track de DB es evidencia).
 *
 * Reglas, en orden (implementación VERBATIM de S81-B1):
 *  a) ORDENAR por `t` antes de juzgar (sort estable; puntos sin `t`
 *     conservan su posición relativa — no se inventa un orden).
 *  b) DESCARTAR un punto SOLO si la velocidad implícita de sus DOS
 *     aristas (llegada Y salida) supera VELOCIDAD_MAX_MS. Una sola
 *     arista rápida no condena: puede ser el vecino el que salta.
 *     Corolario estructural: el primer y el último punto tienen UNA
 *     arista — jamás se descartan.
 *  c) Punto sin `t` = velocidad no computable = NO excede (el filtro
 *     solo juzga lo que puede medir, principio L-139).
 *
 * Umbral: 15 m/s (54 km/h) — muy por encima de todo paseo real y por
 * debajo de la púa GPS típica. Calibrado CON NÚMERO (S81-B1 sobre los 12
 * tracks reales: 26/1355 descartados, todos con aristas 15.8-108.9 m/s;
 * A-S81-2 lo re-midió por SQL espejo con el mismo veredicto). Se
 * recalibra con medición, jamás a ojo (L-131).
 */

export interface PuntoTrackFiltrable {
  lat: number;
  lng: number;
  /** ISO timestamp de la lectura. Sin él, el punto no se juzga. */
  t?: string;
}

export const VELOCIDAD_MAX_MS = 15;

const RADIO_TIERRA_M = 6_371_000;

/** Haversine en metros. */
export function distanciaM(a: PuntoTrackFiltrable, b: PuntoTrackFiltrable): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const sLat = Math.sin(dLat / 2);
  const sLng = Math.sin(dLng / 2);
  const h = sLat * sLat + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * sLng * sLng;
  return 2 * RADIO_TIERRA_M * Math.asin(Math.sqrt(h));
}

/**
 * Velocidad implícita de la arista a→b en m/s.
 * null = no computable (algún extremo sin `t`): no excede por regla (c).
 * dt<=0 con distancia >0 = teletransporte: Infinity (excede).
 * dt<=0 con distancia 0 = punto repetido (flush duplicado S62): 0.
 */
function velocidadArista(a: PuntoTrackFiltrable, b: PuntoTrackFiltrable): number | null {
  if (!a.t || !b.t) return null;
  const ta = Date.parse(a.t);
  const tb = Date.parse(b.t);
  if (Number.isNaN(ta) || Number.isNaN(tb)) return null;
  const d = distanciaM(a, b);
  const dt = (tb - ta) / 1000;
  if (dt <= 0) return d === 0 ? 0 : Infinity;
  return d / dt;
}

export function filtrarTrack<P extends PuntoTrackFiltrable>(puntos: P[]): P[] {
  // Con <3 puntos ningún punto tiene dos aristas: no hay veredicto posible.
  if (puntos.length < 3) return puntos;

  // (a) orden por t — sort nativo es estable: los sin-t no se mueven.
  const orden = [...puntos].sort((p, q) => {
    if (!p.t || !q.t) return 0;
    return Date.parse(p.t) - Date.parse(q.t);
  });

  // Velocidad de cada arista i→i+1, una sola pasada.
  const v: (number | null)[] = [];
  for (let i = 0; i < orden.length - 1; i++) v.push(velocidadArista(orden[i], orden[i + 1]));

  // (b) ambas aristas por encima del umbral — sobre la secuencia original,
  // sin cascada: el veredicto de cada punto se toma contra sus vecinos crudos.
  const excede = (x: number | null) => x !== null && x > VELOCIDAD_MAX_MS;
  return orden.filter((_, i) => {
    if (i === 0 || i === orden.length - 1) return true;
    return !(excede(v[i - 1]) && excede(v[i]));
  });
}
