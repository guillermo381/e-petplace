/**
 * La voz del design system en inglés — espejo EXIGIBLE del español:
 * una clave faltante o sobrante rompe el typecheck (Espejo<typeof uiEs>).
 */

import type { Espejo } from '@epetplace/i18n';

import type { uiEs } from './es';

export const uiEn = {
  lineaDeVida: {
    cargando: 'Loading the timeline',
    cargarMas: 'Load more',
    reintentar: 'Try again',
    errorCargarMas: "We couldn't load more moments.",
  },
} as const satisfies Espejo<typeof uiEs>;
