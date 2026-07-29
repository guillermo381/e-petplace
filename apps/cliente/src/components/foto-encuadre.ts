/**
 * foto-encuadre — la matemática del encuadre de la foto de mascota
 * (S82-A; lámina-acuerdo docs/laminas/2026-07-29-s82-foto-onboarding.html).
 *
 * SEMÁNTICA (la de la lámina, normalizada a la foto):
 *   cx, cy ∈ [0,1] — centro del recorte como fracción del ancho/alto.
 *   z ∈ [1,3]      — zoom sobre el lado base min(iw,ih); lado = base/z.
 *
 * EL AIRE POR SUPERFICIE ES CONSTANTE DE CÓDIGO, JAMÁS DE BASE (mandato
 * S82): el perfil respeta tu centro y ABRE el plano (1.75); todo lo
 * chico usa el encuadre exacto (1).
 *
 * Todas las funciones de layout llevan 'worklet': las previews del
 * editor las llaman desde useAnimatedStyle (UI thread) y las pantallas
 * desde JS — una sola implementación para ambos hilos.
 *
 * CANDIDATA PARA B (anotada, cero packages/ui esta sesión): cuando las
 * superficies reales adopten el encuadre, esta matemática + el marco
 * (FotoEncuadrada de EncuadreFoto.tsx) se promueven a packages/ui y
 * AvatarMascota gana `encuadre` — hoy AvatarMascota pinta cover ciego.
 */

export interface Encuadre {
  cx: number;
  cy: number;
  z: number;
}

export interface DimFoto {
  iw: number;
  ih: number;
}

/** El default canónico de la lámina — espejo de los DEFAULT de DB. */
export const ENCUADRE_DEFAULT: Encuadre = { cx: 0.5, cy: 0.42, z: 1.3 };

export const Z_MIN = 1;
export const Z_MAX = 3;

/** Aire por superficie — perfil abre el plano, el resto usa el encuadre exacto. */
export const AIRE = { perfil: 1.75, resto: 1 } as const;

/** Tamaños por superficie (mandato S82 / lámina). */
export const TAMANO_SUPERFICIE = {
  perfil: 132,
  hogar: 58,
  salaVet: 44,
  chip: 38,
  fila: 36,
  pin: 40,
} as const;

/** Lado del visor del editor (lámina: 248, squircle 32%). */
export const LADO_VISOR = 248;

function clampNum(v: number, min: number, max: number): number {
  'worklet';
  return Math.max(min, Math.min(max, v));
}

/** Lado del recorte en px de la foto original. */
export function ladoRecorte(dim: DimFoto, z: number): number {
  'worklet';
  return Math.min(dim.iw, dim.ih) / z;
}

/** Cuánto puede moverse el centro (fracción) antes de que el recorte
 *  salga de la foto. En z=1 es ~0 en el eje corto. */
export function margen(dim: DimFoto, z: number): { x: number; y: number } {
  'worklet';
  const s = ladoRecorte(dim, z);
  return { x: (dim.iw - s) / 2 / dim.iw, y: (dim.ih - s) / 2 / dim.ih };
}

/** Clamp del mandato: el recorte JAMÁS sale de la foto. */
export function clampEncuadre(dim: DimFoto, e: Encuadre): Encuadre {
  'worklet';
  const z = clampNum(e.z, Z_MIN, Z_MAX);
  const m = margen(dim, z);
  return {
    cx: clampNum(e.cx, 0.5 - m.x, 0.5 + m.x),
    cy: clampNum(e.cy, 0.5 - m.y, 0.5 + m.y),
    z,
  };
}

/** En zoom 1 no hay margen — el texto de ayuda tiene que decirlo. */
export function hayMargen(dim: DimFoto, z: number): boolean {
  'worklet';
  const m = margen(dim, z);
  return m.x > 0.002 || m.y > 0.002;
}

export interface LayoutMarco {
  width: number;
  height: number;
  left: number;
  top: number;
}

/** El layout de la foto dentro de un marco de lado L (la función `poner`
 *  de la lámina): con aire >1 el recorte se ensancha alrededor del MISMO
 *  centro (nunca más allá de la foto) y el centro se re-clampea. */
export function layoutMarco(dim: DimFoto, e: Encuadre, L: number, aire: number): LayoutMarco {
  'worklet';
  const base = Math.min(dim.iw, dim.ih);
  const s = Math.min((base / e.z) * aire, base);
  const k = L / s;
  const px = clampNum(e.cx * dim.iw, s / 2, dim.iw - s / 2);
  const py = clampNum(e.cy * dim.ih, s / 2, dim.ih - s / 2);
  return {
    width: dim.iw * k,
    height: dim.ih * k,
    left: -(px - s / 2) * k,
    top: -(py - s / 2) * k,
  };
}

/** Radio del avatar SUELTO: squircle 32% (DIRECCION_ARTE S61-A10). */
export function radioSquircle(lado: number): number {
  'worklet';
  return Math.round(lado * 0.32);
}

/** El alto canónico del chip (espejo de AvatarMascota — target táctil). */
const ALTO_CHIP = 44;

/** Radio del avatar ANIDADO en chip (regla 21b, firmada S74): deriva del
 *  CONTENEDOR — la pantalla declara la POSICIÓN, jamás el número.
 *  Reproduce los radios de la lámina: chip 38 → 19 · pin 40 → 20. */
export function radioEnChip(lado: number): number {
  'worklet';
  return Math.round(ALTO_CHIP / 2 - Math.abs(ALTO_CHIP - lado) / 2);
}

export type PosicionMarco = 'suelto' | 'chip';

/** El radio por POSICIÓN declarada (regla 21b). */
export function radioPorPosicion(posicion: PosicionMarco, lado: number): number {
  'worklet';
  return posicion === 'chip' ? radioEnChip(lado) : radioSquircle(lado);
}
