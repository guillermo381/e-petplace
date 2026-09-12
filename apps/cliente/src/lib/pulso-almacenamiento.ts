/**
 * EL PUENTE ENTERO — sonda temporal de `D-1074`. **Cuenta cruces, nada más.**
 *
 * 🔴 POR QUÉ NO ALCANZABA CON EL DE LA SESIÓN. El adapter que `initApi` envuelve
 * cubre sólo lo que hace `auth-js`. **AsyncStorage lo usan además nueve piezas
 * de esta app** —i18n, el carrito, el bloqueo biométrico, la marca de compra
 * del shell de tabs, los «ahora no», el censo— y cualquiera de ellas podría
 * estar cruzando al nativo en bucle sin generar una sola petición.
 *
 * *Un bucle que lee del almacenamiento y no sale a la red es el único que
 * explica las CERO resoluciones de DNS durante los 2 min 24 s de crecimiento.*
 *
 * ⚠️ SE PARCHEA EL SINGLETON, y por eso se importa PRIMERO en el layout raíz:
 * `AsyncStorage` es un objeto único y envolverle los métodos alcanza a todos
 * sus consumidores sin tocar ni uno. Es intrusivo a propósito — y es la única
 * forma de medir a los que no conozco.
 *
 * 🔴 **NUNCA registra la clave ni el valor.** Sólo el nombre de la operación.
 * En este puente vive la sesión de Supabase, que es una credencial.
 *
 * Se retira con la ficha.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pulsoPuente } from '@epetplace/api';

type Metodo =
  | 'getItem' | 'setItem' | 'removeItem' | 'mergeItem'
  | 'multiGet' | 'multiSet' | 'multiRemove' | 'getAllKeys' | 'clear';

const METODOS: Metodo[] = [
  'getItem', 'setItem', 'removeItem', 'mergeItem',
  'multiGet', 'multiSet', 'multiRemove', 'getAllKeys', 'clear',
];

let parcheado = false;

export function medirPuenteDeAlmacenamiento(): void {
  if (parcheado) return;
  parcheado = true;
  const obj = AsyncStorage as unknown as Record<string, unknown>;
  for (const m of METODOS) {
    const original = obj[m];
    if (typeof original !== 'function') continue;
    const fn = original as (...a: unknown[]) => unknown;
    obj[m] = (...args: unknown[]) => {
      /* `multiGet` de 50 claves es UN cruce: lo que se mide es el viaje al
         nativo, que es lo que asigna — no cuántas claves trajo. */
      pulsoPuente(m);
      return fn.apply(AsyncStorage, args);
    };
  }
}

/* Efecto de módulo: tiene que correr ANTES de `@/lib/api`, que ya usa el
   puente al arrancar. Por eso este archivo se importa PRIMERO en el raíz. */
medirPuenteDeAlmacenamiento();
