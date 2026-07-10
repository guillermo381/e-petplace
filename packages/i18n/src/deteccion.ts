/**
 * Detección del idioma del dispositivo (expo-localization, patrón de
 * los docs oficiales SDK 57). Un locale no soportado cae al fallback
 * del producto (es) — eso es el diseño, no un fallback silencioso.
 */

import { getLocales } from 'expo-localization';

import { esIdiomaSoportado, IDIOMA_FALLBACK, type IdiomaSoportado } from './idiomas';

export function idiomaDelDispositivo(): IdiomaSoportado {
  const codigo = getLocales()[0]?.languageCode;
  return codigo && esIdiomaSoportado(codigo) ? codigo : IDIOMA_FALLBACK;
}
