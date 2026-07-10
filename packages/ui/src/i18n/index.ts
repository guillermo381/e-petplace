/**
 * Namespace `ui` — la voz de los componentes del design system nace
 * bilingüe EN el paquete que la posee. Las apps lo registran al
 * inicializar el riel (RecursosPorIdioma lo exige por tipo).
 */

import { crearUseTraduccion } from '@epetplace/i18n';

import { uiEn } from './en';
import { uiEs } from './es';

export const recursosUi = { es: uiEs, en: uiEn } as const;

/** Hook interno de los componentes de @epetplace/ui — keys tipadas contra uiEs. */
export const useTraduccionUi = crearUseTraduccion<typeof uiEs>('ui');
