/**
 * Diccionario inglés del dueño — espejo exigible del español.
 * Voz emocional: NO se traduce acá sin gate del founder (patrón
 * D-300); lo funcional (botones, labels) se traduce directo.
 */

import type { Espejo } from '@epetplace/i18n';

import type { clienteEs } from './es';

export const clienteEn = {
  bienvenida: {
    crearCuenta: 'Create account',
    yaTengoCuenta: 'I already have an account',
  },
  ajustes: {
    titulo: 'Settings',
    confirmacionCierre: 'Signing out? Your data stays saved.',
    cerrarSesion: 'Sign out',
    cancelar: 'Cancel',
  },
} as const satisfies Espejo<typeof clienteEs>;
