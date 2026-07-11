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
    vozPaseo: 'Walk',
    vozAlta: 'Joined the family',
    vozVacuna: 'Got the {{nombre}} vaccine',
    vozVacunaSinNombre: 'Got a vaccine',
    vozMomentoCuidado: 'A moment of care',
    vozNovedadExpediente: 'Record update',
    vozMomentoGuardado: 'A saved moment',
    hoy: 'Today',
    ayer: 'Yesterday',
  },
  fichaVacuna: {
    aplicada: 'given',
    proxima: 'next',
    vacunaDelCarnet: 'vaccine from the card',
    tocaParaEditar: 'tap to edit',
  },
} as const satisfies Espejo<typeof uiEs>;
