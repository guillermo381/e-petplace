# `D-1098` — LA CAUSA, MEDIDA EN EL APARATO. No era el resolvedor, ni el receptor, ni el servidor.

**De:** pista C · **Para:** A (dueña de `D-1098`) · **13-sep-2026**
**Dónde se midió:** emulador propio `emulator-5578`, Metro propio `:8097`, árbol
`pista/s116-c-03b`, bundle fresco confirmado por `Android Bundled … (3097 modules)`
y `Starting project at …/e-petplace-s116-c03/apps/cliente`.

---

## ① La medición, con la sonda adentro de 05

Una sonda temporal en `registro.tsx`, **antes** de llamar al motor, sobre las
primitivas que PKCE necesita:

```
[D1098] crypto=object  getRandomValues=undefined  subtle=undefined
        TextEncoder=function  btoa=function
[D1098] crypto keys=randomUUID  own=randomUUID  randomUUID=function
[D1098] crypto.getRandomValues(new Uint32Array(4))
        → TypeError: undefined is not a function
```

⇒ **Hermes define `crypto` con UNA sola propiedad: `randomUUID`.**

## ② Por qué eso rompía el alta y NO el login — el enigma de las tres vueltas

`auth-js` (`lib/helpers.js`, `generatePKCEVerifier`) guarda así:

```js
if (typeof crypto === 'undefined') { …fallback con Math.random… }
crypto.getRandomValues(array);          // ← acá lanza
```

**El guard pregunta por el OBJETO, no por el MÉTODO.** Y acá el objeto sí está,
así que el fallback nunca entra y se llama a una función que no existe.

Ese camino lo toma `signUp` **sólo porque el cliente declara `flowType: 'pkce'`**
(`packages/api/src/client.ts`, puesto para que funcione Google):

```js
if (this.flowType === 'pkce') {
  [codeChallenge, codeChallengeMethod] = await getCodeChallengeAndMethod(...);
}
```

**`signInWithPassword` no toca PKCE.** Ésa es toda la asimetría — la misma que
las tres vueltas anteriores intentaron explicar por el resolvedor, por el
receptor y por el bundle.

## ③ Lo que esto DESCARTA, con su evidencia

| hipótesis | queda | por qué |
|---|---|---|
| `resolverMetodo` perdía el receptor | ☠️ | A lo retiró y el `TypeError` siguió, con la llamada **directa** |
| el método no está en el cliente | ☠️ | está: la excepción viene de DENTRO de `signUp`, no de invocarlo |
| el servidor rechaza | ☠️ | `POST /auth/v1/signup` con la misma anon key devuelve **HTTP 200** |
| el bundle no lleva `signUp` | ⚠️ **no concluyente, y lo declaro** | la sonda fue `strings` sobre el `.hbc` y dio 0 — **pero también da 0 para `signInWithPassword`, que demostrablemente funciona**: el instrumento no sirve contra bytecode Hermes. *No es un cero: es un instrumento ciego.* |

## ④ Lo que C montó para poder seguir, y es UN PUENTE

`apps/cliente/src/lib/crypto-getrandomvalues.ts` — polyfill de
`crypto.getRandomValues` derivado de `crypto.randomUUID()`, que **por spec es
criptográficamente aleatorio**. Se le descartan los nibbles fijos (la versión) y
el resto se usa como bytes. **Cero `Math.random()`** — eso sí debilitaría el
verificador PKCE y es una decisión que esta pista no toma.

Vive en el ENTRY de la app **como import por efecto y arriba de `@/lib/api`**,
porque los imports se izan: una llamada escrita entre medio correría DESPUÉS de
que `initApi` cree el cliente, y no curaría nada.

**Verificado en el aparato**: con el polyfill, `signUp` pasa y el recorrido
entero corre (01 → 02 → 05 → 05b → código → onboarding → alta → 10), con cuenta
real `guillo381+s116c2@gmail.com` confirmada por código del correo.

⚠️ **Es puente, no destino.** Lo correcto es el polyfill nativo
(`react-native-get-random-values` o `expo-crypto`) — **ninguno está instalado en
el monorepo** (medido) y **no viajan por OTA**: son dependencia nativa y piden
BUILD. Su tren natural es el mismo de `D-1100` y `D-1093`.

**La decisión es tuya:** dejar el puente hasta ese tren, o traer el nativo.
Lo que no se puede es volver a `flowType: 'implicit'` — eso rompe Google.

## ⑤ El residuo que el polyfill NO cura, y se declara

Con el polyfill puesto, `auth-js` imprime:

```
WARN  WebCrypto API is not supported. Code challenge method will default to
      use plain instead of sha256.
```

⇒ **el desafío PKCE viaja en `plain`, no en `s256`**, porque `crypto.subtle`
tampoco existe. Eso `auth-js` lo maneja solo y no rompe nada, pero **es una
propiedad de seguridad más débil de la que el flujo supone**, y el polyfill
nativo la recupera de una. Va acá para que la decisión de ④ se tome sabiéndolo.
