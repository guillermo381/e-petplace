/**
 * Riel i18n del prestador (S51-B1a): registra los namespaces por dueño —
 * `prestador` (este app) + `ui` (la voz de @epetplace/ui) — y expone el
 * hook tipado del app. Keys inexistentes rompen el typecheck.
 */

import { crearUseTraduccion, type RecursosPorIdioma } from '@epetplace/i18n';
import { recursosUi } from '@epetplace/ui';

import { prestadorEn } from './en';
import { prestadorEs } from './es';

export const recursos: RecursosPorIdioma = {
  es: { prestador: prestadorEs, ui: recursosUi.es },
  en: { prestador: prestadorEn, ui: recursosUi.en },
};

export const useTraduccion = crearUseTraduccion<typeof prestadorEs>('prestador');
