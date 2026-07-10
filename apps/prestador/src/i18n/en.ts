/**
 * Diccionario inglés del prestador — espejo exigible del español.
 * Voz emocional: NO se traduce acá sin gate del founder (patrón
 * D-300); lo funcional (botones, labels) se traduce directo.
 */

import type { Espejo } from '@epetplace/i18n';

import type { prestadorEs } from './es';

export const prestadorEn = {
  agenda: {
    saludo: 'Your walks for today',
  },
} as const satisfies Espejo<typeof prestadorEs>;
