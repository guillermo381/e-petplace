/**
 * Fábrica del hook tipado por namespace — el mecanismo que hace las
 * keys EXIGIBLES. Cada dueño de diccionario (app o packages/ui) crea
 * su hook contra SU diccionario español; una clave inexistente rompe
 * el typecheck del dueño, sin colisiones entre paquetes (una module
 * augmentation global de i18next no admite dueños múltiples: dos
 * declaraciones de CustomTypeOptions.resources chocan).
 */

import { useTranslation } from 'react-i18next';

import { esIdiomaSoportado, IDIOMA_FALLBACK, type IdiomaSoportado } from './idiomas';
import type { ClaveDe, Diccionario } from './tipos';

export type TraductorTipado<D extends Diccionario> = (
  clave: ClaveDe<D>,
  valores?: Record<string, string | number>,
) => string;

export function crearUseTraduccion<D extends Diccionario>(namespace: string) {
  return function useTraduccion(): { t: TraductorTipado<D>; idioma: IdiomaSoportado } {
    const { t, i18n } = useTranslation(namespace);
    return {
      // Frontera única de tipos del riel (excepción regla 34 documentada):
      // el t runtime de i18next es más laxo que el contrato tipado que
      // imponemos; angostarlo acá es lo que hace exigibles las keys.
      t: t as unknown as TraductorTipado<D>,
      idioma: esIdiomaSoportado(i18n.language) ? i18n.language : IDIOMA_FALLBACK,
    };
  };
}
