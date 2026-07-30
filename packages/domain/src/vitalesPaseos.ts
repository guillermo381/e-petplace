/**
 * Vitales de paseos (S53-B2c) — cálculo puro sobre los tracks REALES.
 * La comparativa "caminó más que los 7 días anteriores" es ESTRICTA
 * (L-139): solo true si AMBAS ventanas tienen salidas y la actual
 * superó a la anterior en distancia — jamás una lectura sin respaldo.
 */

import { filtrarTrackTramos } from './filtroTrack';

/** `t` (S81): habilita el filtro de outliers — un punto sin timestamp
 *  no se juzga y suma como siempre (regla (c) del filtro). */
export type PuntoTrack = { lat: number; lng: number; t?: string };

export type PaseoVital = {
  /** ISO timestamp del cierre (o inicio si no cerró con timestamp). */
  fecha: string;
  duracionMin: number | null;
  puntos: PuntoTrack[];
};

export type VitalesPaseos = {
  totalSalidas: number;
  ultimaSalida: string | null;
  /** S82 r7: EL TAMAÑO REAL de la ventana calculada (7 por default). La
   *  pantalla lo necesita para rotular sin suponer. */
  ventanaDias: number;
  /** Ventana rodante: últimos `ventanaDias` días desde `hoy`. */
  salidasVentana: number;
  kmVentana: number;
  minVentana: number;
  /** Los `ventanaDias` ANTERIORES a la ventana actual. */
  salidasVentanaAnterior: number;
  kmVentanaAnterior: number;
  /** @deprecated S82 r7 — alias de los campos `*Ventana`, conservados
   *  para no romper al consumidor vivo (el perfil). Mienten en cuanto la
   *  ventana deja de ser 7: usar los nuevos. Mismo patrón que los alias
   *  'sm'/'md' de Tarjeta (S58). */
  salidas7d: number;
  km7d: number;
  min7d: number;
  salidas7dAnteriores: number;
  km7dAnteriores: number;
  /** true SOLO con respaldo: ambas ventanas con salidas y actual > anterior. */
  caminoMasQueAnterior: boolean;
  /** km por día de la ventana actual — el ÚLTIMO índice es hoy y el
   *  primero es hace `ventanaDias - 1` días. Largo = `ventanaDias`.
   *  Días sin salida = 0 (la barra base los dice tal cual, L-139). */
  kmPorDia: number[];
};

const R_TIERRA_KM = 6371;

function haversineKm(a: PuntoTrack, b: PuntoTrack): number {
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R_TIERRA_KM * Math.asin(Math.sqrt(h));
}

export function distanciaTrackKm(puntos: PuntoTrack[]): number {
  // S81 (pedido B): el CÁLCULO consume LA MISMA pieza que el dibujo —
  // filtroTrack.ts, jamás dos filtros que se desincronizan. El número
  // que lo ordenó: un solo outlier inflaba el Vitales +30.3% (A-S81-2).
  // S81 (el corte llega al dibujo): la distancia suma DENTRO de cada
  // tramo y JAMÁS entre tramos — coser tramos es inventar recorrido.
  let km = 0;
  for (const tramo of filtrarTrackTramos(puntos)) {
    for (let i = 1; i < tramo.length; i++) km += haversineKm(tramo[i - 1], tramo[i]);
  }
  return km;
}

/**
 * S82 r7 — LA VENTANA ES PARÁMETRO (antes estaba cableada a 7 y la
 * pantalla componía por su cuenta, con el costo de que la barra y la
 * comparativa SOLO existían en 7 días — reporte de C).
 *
 * `ventanaDias` gobierna las TRES cosas a la vez, que es el punto: el
 * agregado de la ventana actual, el de la ventana anterior (misma
 * longitud, inmediatamente previa — la comparativa solo es honesta
 * contra un período igual) y el largo de `kmPorDia`. Se clampea a
 * 1..365: una ventana de 0 días haría dividir por nada y una de 10 años
 * no es una lectura, es un archivo.
 *
 * Retrocompatible: el default sigue siendo 7 y los campos `*7d` viven
 * como alias deprecados.
 */
export function calcularVitales(paseos: PaseoVital[], hoy: Date, ventanaDias = 7): VitalesPaseos {
  const ahora = hoy.getTime();
  const DIA = 24 * 60 * 60 * 1000;
  const v = Math.max(1, Math.min(365, Math.floor(ventanaDias)));
  const corteActual = ahora - v * DIA;
  const corteAnterior = ahora - 2 * v * DIA;

  let ultimaSalida: string | null = null;
  let salidasVentana = 0;
  let kmVentana = 0;
  let minVentana = 0;
  let salidasVentanaAnterior = 0;
  let kmVentanaAnterior = 0;
  const kmPorDia = new Array<number>(v).fill(0);

  for (const p of paseos) {
    const ts = new Date(p.fecha).getTime();
    if (Number.isNaN(ts)) continue;
    if (ultimaSalida === null || p.fecha > ultimaSalida) ultimaSalida = p.fecha;
    const km = distanciaTrackKm(p.puntos);
    if (ts >= corteActual) {
      salidasVentana += 1;
      kmVentana += km;
      minVentana += p.duracionMin ?? 0;
      const diasAtras = Math.min(v - 1, Math.max(0, Math.floor((ahora - ts) / DIA)));
      kmPorDia[v - 1 - diasAtras] += km;
    } else if (ts >= corteAnterior) {
      salidasVentanaAnterior += 1;
      kmVentanaAnterior += km;
    }
  }

  return {
    totalSalidas: paseos.length,
    ultimaSalida,
    ventanaDias: v,
    salidasVentana,
    kmVentana,
    minVentana,
    salidasVentanaAnterior,
    kmVentanaAnterior,
    // alias deprecados — mismos valores, nombres viejos (no rompen al
    // consumidor vivo mientras migra)
    salidas7d: salidasVentana,
    km7d: kmVentana,
    min7d: minVentana,
    salidas7dAnteriores: salidasVentanaAnterior,
    km7dAnteriores: kmVentanaAnterior,
    caminoMasQueAnterior:
      salidasVentana > 0 && salidasVentanaAnterior > 0 && kmVentana > kmVentanaAnterior,
    kmPorDia,
  };
}
