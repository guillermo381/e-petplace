/**
 * La instancia i18next del ecosistema — puerta única del riel.
 * Idioma inicial: override persistido > locale del dispositivo > es.
 */

import i18next, { type i18n } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { idiomaDelDispositivo } from './deteccion';
import { IDIOMA_FALLBACK, type IdiomaSoportado } from './idiomas';
import { guardarPreferenciaIdioma, leerPreferenciaIdioma } from './persistencia';
import type { RecursosPorIdioma } from './tipos';

let instancia: i18n | null = null;

export async function inicializarI18n(recursos: RecursosPorIdioma): Promise<i18n> {
  if (instancia) return instancia;

  const preferencia = await leerPreferenciaIdioma();
  const inicial: IdiomaSoportado = preferencia ?? idiomaDelDispositivo();

  const inst = i18next.createInstance();
  await inst.use(initReactI18next).init({
    lng: inicial,
    fallbackLng: IDIOMA_FALLBACK,
    resources: recursos,
    interpolation: { escapeValue: false }, // React ya escapa
    returnNull: false,
    returnEmptyString: false,
  });

  instancia = inst;
  return inst;
}

/**
 * Cambia el idioma vivo Y persiste el override en dispositivo.
 * Rechaza si la persistencia falla — el caller pone la voz del error.
 */
export async function cambiarIdioma(idioma: IdiomaSoportado): Promise<void> {
  if (!instancia) throw new Error('cambiarIdioma antes de inicializarI18n');
  await instancia.changeLanguage(idioma);
  await guardarPreferenciaIdioma(idioma);
}

/** El idioma vivo de la instancia (S55-B3: la sync D-316 compara contra
 *  esto antes de pisar el cache local con la preferencia de DB). */
export function obtenerIdiomaActual(): IdiomaSoportado {
  const vivo = instancia?.language;
  return vivo === 'en' ? 'en' : IDIOMA_FALLBACK;
}
