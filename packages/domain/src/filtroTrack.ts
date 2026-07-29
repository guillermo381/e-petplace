/**
 * EL FILTRO DEL TRACK (S81, D-578) — LA PIEZA ÚNICA, v2: LA REGLA DE
 * SEGMENTOS (orden de mesa S81 sobre la medición de los extremos).
 *
 * La v1 (dos aristas >15 m/s condenan el punto) cazaba PÚAS de un punto
 * y la medición la venció con el caso vivo del 28-jul: una MESETA
 * FANTASMA (2+ puntos seguidos en la misma posición falsa) retiene la
 * arista de salida y el salto sobrevive con una sola arista rápida
 * (185.7 m y 593.0 m de trazo falso en el último minuto del paseo).
 *
 * LA REGLA v2, por segmentos:
 *  1. ORDENAR por `t`. Marcar como CORTE toda arista con v > 15 m/s
 *     **Y** Δt < 120 s. (Los dos, no uno: Δt largo es HUECO DE
 *     CAPTURA — otra cosa; no se descarta, no se inventa línea.)
 *  2. PARTIR en segmentos por los cortes. El DOMINANTE = más puntos.
 *  3. DESCARTAR solo segmentos MENORES al 5% del dominante.
 *     ⚠️ Si quedan DOS (o más) segmentos grandes, NO se descarta
 *     NINGUNO: es hueco real y se declara — perder recorrido bueno es
 *     peor que dibujar de más.
 *  4. EL CRUDO INTACTO: se filtra al LEER (dibujar o calcular), jamás
 *     al guardar (el track de DB es evidencia).
 *
 * Punto sin `t` = arista no computable = NO es corte (el filtro solo
 * juzga lo que puede medir, principio L-139).
 *
 * Umbrales calibrados CON NÚMERO, jamás a ojo (L-131): 15 m/s (54 km/h,
 * sobre todo paseo real y bajo la púa GPS típica — v1, S81-B1 sobre los
 * 12 tracks) · 120 s de Δt (el gap de captura medido en los tracks
 * reales arranca en ~350 s; el salto de fix vive en 5-40 s) · 5%
 * (la meseta fantasma medida es de 2 puntos contra dominantes de
 * 400+ — 0.5%; un tramo real de recorrido nunca es tan chico).
 * Consumidores: MapaRecorrido (dibujo, vía re-export en packages/ui) y
 * distanciaTrackKm (cálculo, vitalesPaseos.ts) — UNA implementación.
 */

export interface PuntoTrackFiltrable {
  lat: number;
  lng: number;
  /** ISO timestamp de la lectura. Sin él, la arista no se juzga. */
  t?: string;
}

export const VELOCIDAD_MAX_MS = 15;
export const DELTA_T_CORTE_S = 120;
export const FRACCION_SEGMENTO_MENOR = 0.05;

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
 * ¿La arista a→b es un CORTE? Solo si es rápida (v > 15 m/s) Y corta
 * en tiempo (Δt < 120 s). Δt ≥ 120 s = hueco de captura: no corta.
 * Sin `t` en algún extremo: no computable, no corta (L-139).
 * dt <= 0 con distancia > 0 = teletransporte: corta.
 */
function esCorte(a: PuntoTrackFiltrable, b: PuntoTrackFiltrable): boolean {
  if (!a.t || !b.t) return false;
  const ta = Date.parse(a.t);
  const tb = Date.parse(b.t);
  if (Number.isNaN(ta) || Number.isNaN(tb)) return false;
  const dt = (tb - ta) / 1000;
  if (dt >= DELTA_T_CORTE_S) return false;
  const d = distanciaM(a, b);
  if (dt <= 0) return d > 0;
  return d / dt > VELOCIDAD_MAX_MS;
}

/** El detalle del análisis — para quien tenga que DECLARAR (regla 3). */
export interface FiltroTrackDetalle<P extends PuntoTrackFiltrable> {
  /** LOS TRAMOS conservados (S81: el corte LLEGA al dibujo — un track
   *  con cortes son VARIOS tramos, jamás uno; lo plano fabrica la
   *  COSTURA que vuelve a coser los saltos descartados). */
  tramos: P[][];
  /** Compatibilidad: los tramos aplanados — SOLO para quien cuenta
   *  puntos. Dibujo y distancia consumen `tramos`. */
  puntos: P[];
  nSegmentos: number;
  descartados: number;
  /** true = 2+ segmentos grandes: hueco real, nada se descartó. */
  huecoReal: boolean;
  /** Puntos SIN `t` (no juzgables). Un punto suelto sin t es tolerable
   *  (legado); un track ENTERO sin t es contrato roto y LANZA (abajo). */
  sinT: number;
}

/**
 * EL ASSERT DEL CONTRATO (S81, L-192 — "todo chequeo tiene que poder
 * salir ROJO"): un track con >0 puntos donde el 100% llega SIN `t` no
 * es dato legado — es CONTRATO INCUMPLIDO (la key del jsonb es `t` y
 * el emisor la garantiza; lo que produce un track entero sin t es un
 * RENAME silencioso aguas arriba — el mismatch ts/t costó tres rondas
 * en S81). Antes de esto, esa falla era MUDA: cero cortes, un tramo,
 * la costura de vuelta, y nadie se enteraba.
 */
function assertContratoT(puntos: readonly PuntoTrackFiltrable[], sinT: number): void {
  if (puntos.length > 0 && sinT === puntos.length) {
    throw new Error(
      `track_sin_timestamps: ${puntos.length} puntos y NINGUNO trae 't' — contrato roto (¿rename silencioso aguas arriba?), no dato legado`,
    );
  }
}

export function filtrarTrackDetalle<P extends PuntoTrackFiltrable>(puntos: P[]): FiltroTrackDetalle<P> {
  const sinT = puntos.reduce((n, p) => n + (p.t ? 0 : 1), 0);
  assertContratoT(puntos, sinT);
  if (puntos.length < 2) {
    return {
      tramos: puntos.length > 0 ? [puntos] : [],
      puntos,
      nSegmentos: puntos.length,
      descartados: 0,
      huecoReal: false,
      sinT,
    };
  }

  // 1. orden por t — sort nativo es estable: los sin-t no se mueven.
  const orden = [...puntos].sort((p, q) => {
    if (!p.t || !q.t) return 0;
    return Date.parse(p.t) - Date.parse(q.t);
  });

  // 2. partir en segmentos por los cortes.
  const segmentos: P[][] = [[orden[0]]];
  for (let i = 1; i < orden.length; i++) {
    if (esCorte(orden[i - 1], orden[i])) segmentos.push([orden[i]]);
    else segmentos[segmentos.length - 1].push(orden[i]);
  }
  if (segmentos.length === 1) {
    return { tramos: segmentos, puntos: orden, nSegmentos: 1, descartados: 0, huecoReal: false, sinT };
  }

  // 3. dominante y clasificación.
  const dominante = Math.max(...segmentos.map((s) => s.length));
  const grandes = segmentos.filter((s) => s.length >= dominante * FRACCION_SEGMENTO_MENOR);
  if (grandes.length >= 2) {
    // Hueco real: NO se descarta ninguno — se declara. Y los cortes
    // IGUAL parten el dibujo: todos los segmentos, cada uno su tramo.
    return {
      tramos: segmentos,
      puntos: orden,
      nSegmentos: segmentos.length,
      descartados: 0,
      huecoReal: true,
      sinT,
    };
  }
  const conservados = grandes.flat();
  return {
    tramos: grandes,
    puntos: conservados,
    nSegmentos: segmentos.length,
    descartados: orden.length - conservados.length,
    huecoReal: false,
    sinT,
  };
}

/** LOS TRAMOS conservados — el consumo canónico de dibujo y distancia:
 *  una línea POR TRAMO, la distancia suma DENTRO de cada tramo y jamás
 *  entre tramos. Donde hubo corte hay HUECO — que es la verdad: no
 *  sabemos por dónde fue. */
export function filtrarTrackTramos<P extends PuntoTrackFiltrable>(puntos: P[]): P[][] {
  return filtrarTrackDetalle(puntos).tramos;
}

/** Compatibilidad (plano): SOLO para quien cuenta puntos — lo plano es
 *  lo que fabrica la costura; dibujo y distancia usan los TRAMOS. */
export function filtrarTrack<P extends PuntoTrackFiltrable>(puntos: P[]): P[] {
  return filtrarTrackDetalle(puntos).puntos;
}
