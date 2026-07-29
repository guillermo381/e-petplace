/**
 * Vitales de paseos (S53-B2c) — cálculo puro sobre los tracks REALES.
 * La comparativa "caminó más que los 7 días anteriores" es ESTRICTA
 * (L-139): solo true si AMBAS ventanas tienen salidas y la actual
 * superó a la anterior en distancia — jamás una lectura sin respaldo.
 */

import { filtrarTrack } from './filtroTrack';

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
  /** Ventana rodante: últimos 7 días desde `hoy`. */
  salidas7d: number;
  km7d: number;
  min7d: number;
  /** Los 7 días ANTERIORES a la ventana actual. */
  salidas7dAnteriores: number;
  km7dAnteriores: number;
  /** true SOLO con respaldo: ambas ventanas con salidas y actual > anterior. */
  caminoMasQueAnterior: boolean;
  /** km por día de la ventana actual — índice 0 = hace 6 días, 6 = hoy.
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
  const limpios = filtrarTrack(puntos);
  let km = 0;
  for (let i = 1; i < limpios.length; i++) km += haversineKm(limpios[i - 1], limpios[i]);
  return km;
}

export function calcularVitales(paseos: PaseoVital[], hoy: Date): VitalesPaseos {
  const ahora = hoy.getTime();
  const DIA = 24 * 60 * 60 * 1000;
  const corte7d = ahora - 7 * DIA;
  const corte14d = ahora - 14 * DIA;

  let ultimaSalida: string | null = null;
  let salidas7d = 0;
  let km7d = 0;
  let min7d = 0;
  let salidas7dAnteriores = 0;
  let km7dAnteriores = 0;
  const kmPorDia = [0, 0, 0, 0, 0, 0, 0];

  for (const p of paseos) {
    const ts = new Date(p.fecha).getTime();
    if (Number.isNaN(ts)) continue;
    if (ultimaSalida === null || p.fecha > ultimaSalida) ultimaSalida = p.fecha;
    const km = distanciaTrackKm(p.puntos);
    if (ts >= corte7d) {
      salidas7d += 1;
      km7d += km;
      min7d += p.duracionMin ?? 0;
      const diasAtras = Math.min(6, Math.max(0, Math.floor((ahora - ts) / DIA)));
      kmPorDia[6 - diasAtras] += km;
    } else if (ts >= corte14d) {
      salidas7dAnteriores += 1;
      km7dAnteriores += km;
    }
  }

  return {
    totalSalidas: paseos.length,
    ultimaSalida,
    salidas7d,
    km7d,
    min7d,
    salidas7dAnteriores,
    km7dAnteriores,
    caminoMasQueAnterior: salidas7d > 0 && salidas7dAnteriores > 0 && km7d > km7dAnteriores,
    kmPorDia,
  };
}
