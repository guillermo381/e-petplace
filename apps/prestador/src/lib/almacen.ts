/**
 * almacen.ts — el disco del teléfono, inyectable (S107-D).
 *
 * `require` en try/catch, patrón de `bloqueo-biometrico.ts` (S104): si el
 * nativo no está en el build queda `null` y quien lo use **lo dice** en vez de
 * crashear al montar.
 *
 * Vive aparte porque **dos colas lo comparten** (media y actas) y porque el
 * hueco de inyección es lo que las vuelve probables en banco — *una cola cuyo
 * modo de falla es perder trabajo tiene que poder fallar en un banco antes que
 * en la calle* (L-192).
 */

export interface Almacen {
  getItem(clave: string): Promise<string | null>;
  setItem(clave: string, valor: string): Promise<void>;
}

let almacen: Almacen | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  almacen = require('@react-native-async-storage/async-storage').default as Almacen;
} catch {
  almacen = null;
}

/** Solo para el arnés. En la app el default (AsyncStorage) ya está puesto. */
export function configurarAlmacen(a: Almacen): void {
  almacen = a;
}

export function almacenActual(): Almacen | null {
  return almacen;
}

/**
 * Cerrojo compartido: leer-mutar-escribir sin serializar pierde la primera de
 * dos mutaciones seguidas. Es UNO para las dos colas — cada una tiene su clave
 * en disco, pero el patrón de escritura es el mismo y un cerrojo por módulo no
 * protege de nada que valga.
 */
let cerrojo: Promise<unknown> = Promise.resolve();

export function enFila<T>(tarea: () => Promise<T>): Promise<T> {
  const proximo = cerrojo.then(tarea, tarea);
  cerrojo = proximo.catch(() => undefined);
  return proximo;
}
