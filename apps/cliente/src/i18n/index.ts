/**
 * Riel i18n del cliente (S51-B1a): registra los namespaces por dueño —
 * `cliente` (este app) + `ui` (la voz de @epetplace/ui) — y expone el
 * hook tipado del app. Keys inexistentes rompen el typecheck.
 */

import { crearUseTraduccion, type RecursosPorIdioma } from '@epetplace/i18n';
import { recursosUi } from '@epetplace/ui';

import { clienteEn } from './en';
import { clienteEs } from './es';

export const recursos: RecursosPorIdioma = {
  es: { cliente: clienteEs, ui: recursosUi.es },
  en: { cliente: clienteEn, ui: recursosUi.en },
};

export const useTraduccion = crearUseTraduccion<typeof clienteEs>('cliente');
