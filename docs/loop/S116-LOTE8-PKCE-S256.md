# El cambio que devuelve PKCE a `s256` — `D-1101`, listo para aplicar

**No se aplica en este lote y acá está por qué:** el archivo que lo hace importa
`expo-crypto`, que está **anotado y no instalado** (punto 5a). Un `.ts` que
importa un módulo ausente no compila, así que escribirlo hoy dejaría los cuatro
typechecks en rojo por una dependencia que la mesa todavía no autorizó a instalar.
*Se deja escrito entero, medido contra el código real de `auth-js`, para que
aplicarlo sea copiar un archivo y borrar otro.*

## Lo que hay que hacer, en orden

1. `cd apps/cliente && npx expo install expo-crypto` — actualiza el lockfile y
   **destraba `pnpm install --frozen-lockfile`**, que el punto 5a rompió a
   propósito.
2. Crear `apps/cliente/src/lib/crypto-nativo.ts` con el contenido de abajo.
3. En `apps/cliente/src/app/_layout.tsx`, cambiar el import por efecto
   `'@/lib/crypto-getrandomvalues'` por `'@/lib/crypto-nativo'` — **y en el mismo
   lugar de la lista**: los imports se izan, y este tiene que correr antes que
   el que crea el cliente de auth.
4. Borrar `apps/cliente/src/lib/crypto-getrandomvalues.ts` dejando su lápida.
5. **Verificar en el aparato, que es lo único que cierra `D-1101`:** crear una
   cuenta y confirmar que **NO** aparece en el log
   `WebCrypto API is not supported. Code challenge method will default to use
   plain instead of sha256.` *Su ausencia es la prueba; el alta funciona con las
   dos.*

## El archivo

```ts
/**
 * `crypto` NATIVO — el destino de `D-1101`, y el final del puente.
 *
 * Reemplaza a `crypto-getrandomvalues.ts`, que fabricaba `getRandomValues`
 * con `crypto.randomUUID()` y **dejaba el desafío PKCE en `plain`** porque
 * `crypto.subtle` no existe en Hermes.
 *
 * ── LO QUE `auth-js` PIDE, leído de su código y no de su documentación ────
 * `dist/main/lib/helpers.js`:
 *   · `crypto.getRandomValues(array)` — para el verificador.
 *   · `crypto.subtle.digest('SHA-256', bytes)` → `ArrayBuffer`, awaitado.
 *   · el guard es `typeof crypto.subtle !== 'undefined'` ⇒ **alcanza con
 *     definir `digest`**. No se fabrica el resto de la WebCrypto: una
 *     `SubtleCrypto` a medias que dice ser completa es peor que una ausente.
 */
import * as Crypto from 'expo-crypto'

function instalar(): void {
  const g = globalThis as unknown as {
    crypto?: { getRandomValues?: unknown; subtle?: unknown }
  }
  if (g.crypto === undefined) return

  /* Si el runtime ya los trae, NO se pisan: el día que Hermes los implemente,
     este archivo deja de hacer nada solo — que es como muere un polyfill. */
  if (typeof g.crypto.getRandomValues !== 'function') {
    Object.defineProperty(g.crypto, 'getRandomValues', {
      value: Crypto.getRandomValues,
      writable: true,
      configurable: true,
    })
  }

  if (g.crypto.subtle === undefined) {
    Object.defineProperty(g.crypto, 'subtle', {
      value: {
        /** Sólo `digest`, y sólo SHA-256 y SHA-512: lo que la casa usa. Un
         *  algoritmo que no está NO se aproxima — se rebota. */
        async digest(algoritmo: string | { name: string }, datos: BufferSource) {
          const nombre = (typeof algoritmo === 'string' ? algoritmo : algoritmo.name).toUpperCase()
          const mapa: Record<string, Crypto.CryptoDigestAlgorithm> = {
            'SHA-256': Crypto.CryptoDigestAlgorithm.SHA256,
            'SHA-512': Crypto.CryptoDigestAlgorithm.SHA512,
          }
          const alg = mapa[nombre]
          if (alg === undefined) throw new Error(`crypto.subtle.digest: ${nombre} no está implementado`)
          const vista = ArrayBuffer.isView(datos)
            ? new Uint8Array(datos.buffer, datos.byteOffset, datos.byteLength)
            : new Uint8Array(datos)
          return await Crypto.digest(alg, vista)
        },
      },
      writable: true,
      configurable: true,
    })
  }
}

/* Se instala al importarse, por la misma razón que el puente: los imports se
   izan, así que una llamada escrita en el entry correría DESPUÉS del import
   que crea el cliente de auth. */
instalar()
```

## ⚠️ Lo único que este archivo NO puede prometer

`Crypto.digest` y `Crypto.getRandomValues` son la API de `expo-crypto` **según
su documentación, no según una medición**: el módulo no está instalado, así que
no se pudo abrir su `.d.ts`. **Al instalarlo, lo primero es abrir
`node_modules/expo-crypto/build/Crypto.types.d.ts` y confirmar los dos nombres.**
*Si difieren, lo que cambia son dos líneas; lo que no cambia es el diseño —
`subtle` con un solo método y sin aproximar algoritmos.*
