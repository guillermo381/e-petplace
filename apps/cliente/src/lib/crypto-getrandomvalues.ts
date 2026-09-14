/**
 * `crypto.getRandomValues` — EL POLYFILL QUE DESTRABA EL ALTA (`D-1098`).
 *
 * ── QUÉ SE MIDIÓ, en el aparato, el 13-sep-2026 ──────────────────────────
 * Con una sonda dentro de 05, sobre el emulador propio:
 *
 *     crypto=object  getRandomValues=undefined  subtle=undefined
 *     TextEncoder=function  btoa=function
 *     crypto own=randomUUID   randomUUID=function
 *     crypto.getRandomValues(new Uint32Array(4))
 *       → TypeError: undefined is not a function
 *
 * ⇒ **Hermes define `crypto` con UNA sola propiedad: `randomUUID`.**
 *
 * ── POR QUÉ ROMPÍA EL ALTA Y NO EL LOGIN, que era el enigma de tres vueltas ──
 * `auth-js` guarda así: `if (typeof crypto === 'undefined') { …fallback… }` y
 * después llama `crypto.getRandomValues(array)`. **El guard pregunta por el
 * objeto, no por el método** — y acá el objeto SÍ está ⇒ el fallback nunca
 * entra y se llama a una función que no existe.
 *
 * Ese camino lo toma `signUp` **sólo porque el cliente usa `flowType: 'pkce'`**
 * (que a su vez es lo que el flujo de Google exige). `signInWithPassword` no
 * toca PKCE **y por eso funcionaba**. Ésa es toda la asimetría: no era el
 * resolvedor, ni el receptor, ni el servidor —el POST a `/auth/v1/signup` con
 * la misma anon key devuelve **HTTP 200**—, era una primitiva ausente.
 *
 * ── POR QUÉ VIVE ACÁ Y NO EN `packages/api` ─────────────────────────────
 * Un polyfill de una API del runtime es asunto del ENTRY de la app: es donde
 * siempre vivieron en RN, y donde corre una sola vez antes que nada. En la
 * puerta única tendría que correr en cada import.
 *
 * ── DE DÓNDE SALE LA ENTROPÍA, declarado porque es una decisión ──────────
 * De `crypto.randomUUID()`, que **por especificación es criptográficamente
 * aleatorio**. Un UUID v4 trae ~122 bits impredecibles: se le descartan los
 * nibbles fijos (la versión) y el resto se usa como bytes. No se usa
 * `Math.random()` en ningún caso — *eso sí sería debilitar el verificador
 * PKCE, y sería una decisión de seguridad que esta pista no toma.*
 *
 * ⚠️ **ES UN PUENTE, NO EL DESTINO, y lo declara para que nadie lo olvide:**
 * lo correcto es el polyfill nativo (`react-native-get-random-values` o
 * `expo-crypto`), que **no viaja por OTA** —es dependencia nativa y necesita
 * BUILD—, y su tren natural es el mismo de `D-1100` y `D-1093`. Esto lo
 * reemplaza el día que ese tren salga; hasta entonces, el alta funciona.
 * La ficha con la medición completa queda para A, que es dueña de `D-1098`.
 */

function bytesDeUnUuid(): number[] {
  // 8-4-4-4-12; sin guiones son 32 nibbles. El nibble 12 es la versión ('4'),
  // fijo por spec: se descarta para no meter un byte predecible en la mezcla.
  const hex = (globalThis as { crypto: { randomUUID(): string } }).crypto
    .randomUUID()
    .replace(/-/g, '');
  const utiles = hex.slice(0, 12) + hex.slice(13);
  const bytes: number[] = [];
  for (let i = 0; i + 1 < utiles.length; i += 2) {
    bytes.push(parseInt(utiles.slice(i, i + 2), 16));
  }
  return bytes;
}

function instalar(): void {
  const g = globalThis as unknown as {
    crypto?: { randomUUID?: () => string; getRandomValues?: unknown };
  };
  // Si el runtime (o una build nativa futura) ya lo trae, NO se pisa.
  if (typeof g.crypto?.getRandomValues === 'function') return;
  // Sin `randomUUID` no hay fuente honesta: se deja como está y `auth-js`
  // fallará donde siempre — *fabricar entropía con `Math.random()` para que
  // «no falle» es exactamente el silencio que esta cura vino a sacar.*
  if (typeof g.crypto?.randomUUID !== 'function') return;

  const impl = <T extends ArrayBufferView | null>(array: T): T => {
    if (array === null) return array;
    const vista = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
    let pool: number[] = [];
    for (let i = 0; i < vista.length; i++) {
      if (pool.length === 0) pool = bytesDeUnUuid();
      vista[i] = pool.pop() as number;
    }
    return array;
  };

  Object.defineProperty(g.crypto, 'getRandomValues', {
    value: impl,
    writable: true,
    configurable: true,
  });
}

/* 🔴 SE INSTALA AL IMPORTARSE, y no es estilo: **los `import` se izan**. Si
   esto se exportara como función para llamarla desde el entry, el
   `import '@/lib/api'` de ese mismo archivo —que crea el cliente de auth—
   correría ANTES que la llamada, por más arriba que estuviera escrita. El
   orden de ejecución entre módulos lo da el orden de los IMPORTS, no el de
   las líneas. *Escrito al revés compila igual y no cura nada.* */
instalar();
