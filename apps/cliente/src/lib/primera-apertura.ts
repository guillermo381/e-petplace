/**
 * LA PRIMERA APERTURA DEL APARATO — y el piso de permanencia del splash.
 *
 * ── POR QUÉ EXISTE ───────────────────────────────────────────────────────
 * 00 tiene una coreografía entera —la nariz que se asienta, el halo, los seis
 * personajes entrando escalonados, la rotación— y **en el recorrido real no se
 * ve ninguna**: medido en el emulador, el splash dura **menos de un segundo**,
 * porque sale en el acto cuando la sesión resuelve.
 *
 * Eso está bien casi siempre, y la propia pantalla lo firma: *«hacer esperar a
 * alguien para terminar una animación es cobrarle el adorno»*. **Pero la
 * primera vez que alguien abre la app no está esperando nada todavía** — no
 * tiene sesión, no tiene mascota, no viene a hacer una tarea. Ahí el momento de
 * marca no le cuesta: es lo único que hay.
 *
 * ⇒ **piso SOLO en la primera apertura de ESTE aparato. Después, instantáneo
 * como hoy.** (Firma del founder, 14-sep-2026.)
 *
 * ── POR QUÉ ES DEL APARATO Y NO DE LA CUENTA ─────────────────────────────
 * Va en `AsyncStorage`, igual que el candado biométrico: *«el candado protege
 * ESTE teléfono»*. La primera apertura es un hecho del aparato, no de quien se
 * loguea — alguien que instala de nuevo la app en otro teléfono **vuelve a ver
 * la marca**, y eso es lo correcto: es su primera vez ahí.
 *
 * ── EL FALLO NO CUESTA LA APP ────────────────────────────────────────────
 * Si `AsyncStorage` no contesta, se asume **que NO es la primera apertura**.
 * *Entre mostrar la marca de más y demorar un arranque que alguien está
 * esperando, se elige no demorar* — y el modo de falla del otro lado sería el
 * peor: un piso de dos segundos en CADA apertura, para siempre, sin que nada
 * falle visiblemente.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { PISO_SPLASH_PRIMERA_APERTURA_MS } from './config-arranque';

/** Misma familia de claves que el resto de las preferencias locales. */
const CLAVE = 'epp.primera_apertura_vista';

/**
 * ¿Es la PRIMERA apertura de este aparato? **Marca en el mismo acto**, para que
 * no haya una ventana donde dos llamadas devuelvan `true`.
 */
export async function esPrimeraAperturaDelAparato(): Promise<boolean> {
  try {
    const visto = await AsyncStorage.getItem(CLAVE);
    if (visto !== null) return false;
    await AsyncStorage.setItem(CLAVE, new Date().toISOString());
    return true;
  } catch {
    // Ver la cabecera: ante la duda, NO se demora el arranque.
    return false;
  }
}

/**
 * El piso de permanencia que corresponde a esta apertura: el de config si es la
 * primera, **cero** si no. Devuelve una promesa que se resuelve cuando el piso
 * se cumplió — el splash la espera EN PARALELO con la sesión, no en fila.
 */
export async function pisoDePermanenciaMs(): Promise<number> {
  return (await esPrimeraAperturaDelAparato()) ? PISO_SPLASH_PRIMERA_APERTURA_MS : 0;
}
