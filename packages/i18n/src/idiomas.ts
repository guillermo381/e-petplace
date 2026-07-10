/**
 * Idiomas del ecosistema — decisión founder S51: es + en desde el día 1.
 * El registro del español es TUTEO NEUTRO (regla 27 del contrato,
 * extendida a ambas apps en S51).
 */

export const IDIOMAS_SOPORTADOS = ['es', 'en'] as const;

export type IdiomaSoportado = (typeof IDIOMAS_SOPORTADOS)[number];

/** El producto nace en Ecuador: sin señal del dispositivo, español. */
export const IDIOMA_FALLBACK: IdiomaSoportado = 'es';

export function esIdiomaSoportado(valor: string): valor is IdiomaSoportado {
  return (IDIOMAS_SOPORTADOS as readonly string[]).includes(valor);
}
