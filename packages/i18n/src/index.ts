/**
 * @epetplace/i18n — riel de internacionalización (S51-B1a).
 *
 * Puerta única: instancia i18next, detección de locale (expo-localization),
 * persistencia del override en dispositivo (AsyncStorage) y keys tipadas
 * exigibles. Diccionarios por DUEÑO: cada app registra los suyos y el
 * namespace `ui` que publica @epetplace/ui.
 */

export { IDIOMAS_SOPORTADOS, IDIOMA_FALLBACK, esIdiomaSoportado, type IdiomaSoportado } from './idiomas';
export { cambiarIdioma, inicializarI18n } from './instancia';
export { idiomaDelDispositivo } from './deteccion';
export { ProveedorI18n } from './ProveedorI18n';
export { crearUseTraduccion, type TraductorTipado } from './useTraduccion';
export type { ClaveDe, Diccionario, Espejo, RecursosPorIdioma } from './tipos';
export { fechaCortaMono } from './fechas';
