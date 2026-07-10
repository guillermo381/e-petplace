/**
 * Persistencia de la preferencia de idioma EN DISPOSITIVO (decisión
 * founder S51: default = locale del dispositivo; el override del
 * usuario vive en AsyncStorage). La sincronización a DB es scope del
 * ciclo B1 completo, no de este riel.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { esIdiomaSoportado, type IdiomaSoportado } from './idiomas';

const CLAVE_PREFERENCIA = 'epetplace.idioma';

/**
 * Preferencia guardada, o null si no hay (o si storage falla: una
 * preferencia ilegible no puede tumbar el arranque — se cae al default
 * DE DISEÑO, el locale del dispositivo, y se loggea literal).
 */
export async function leerPreferenciaIdioma(): Promise<IdiomaSoportado | null> {
  try {
    const valor = await AsyncStorage.getItem(CLAVE_PREFERENCIA);
    return valor !== null && esIdiomaSoportado(valor) ? valor : null;
  } catch (e) {
    console.warn('[i18n] no se pudo leer la preferencia de idioma:', e);
    return null;
  }
}

/** Propaga el error: el caller decide la voz si la preferencia no se pudo guardar. */
export async function guardarPreferenciaIdioma(idioma: IdiomaSoportado): Promise<void> {
  await AsyncStorage.setItem(CLAVE_PREFERENCIA, idioma);
}
