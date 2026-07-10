/**
 * Momento vital (S51-B2.3) — cálculo puro sobre los umbrales de
 * cat_especies_perfil (momentos_vitales_jsonb, relevados en DB viva).
 * Devuelve el CÓDIGO del modelo; la voz la pone la pantalla por el
 * riel (Ley 3: M1..M7 jamás visibles).
 *
 * v1 usa el umbral default de la especie (los rangos por tamaño de
 * raza quedan para cuando el producto sepa el tamaño con datos, no
 * por adivinanza — L-139).
 */

export type MomentoVital = 'M1' | 'M2' | 'M3' | 'M4' | 'M5' | 'M6';

export type UmbralesMomentoVital = {
  m2InicioMeses: number;
  m3InicioMeses: number;
  m5InicioMeses: number;
};

export function edadEnMeses(fechaNacimientoIso: string, hoy: Date): number | null {
  const [a, m, d] = fechaNacimientoIso.split('-').map(Number);
  if (!a || !m || !d) return null;
  const meses = (hoy.getFullYear() - a) * 12 + (hoy.getMonth() + 1 - m) - (hoy.getDate() < d ? 1 : 0);
  return meses >= 0 ? meses : null;
}

export function calcularMomentoVital(entrada: {
  edadMeses: number | null;
  tieneCondicionCronica: boolean;
  esMemorial: boolean;
  umbrales: UmbralesMomentoVital;
}): MomentoVital | null {
  if (entrada.esMemorial) return 'M6';
  // M4 (cuidado especial) preside sobre la edad: la condición manda.
  if (entrada.tieneCondicionCronica) return 'M4';
  if (entrada.edadMeses === null) return null; // sin fecha: null honesto
  const { m2InicioMeses, m3InicioMeses, m5InicioMeses } = entrada.umbrales;
  if (entrada.edadMeses >= m5InicioMeses) return 'M5';
  if (entrada.edadMeses >= m3InicioMeses) return 'M3';
  if (entrada.edadMeses >= m2InicioMeses) return 'M2';
  return 'M1';
}
