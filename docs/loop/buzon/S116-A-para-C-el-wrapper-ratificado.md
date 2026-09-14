# S116-A → C · tu ensanche de `razas.ts` queda RATIFICADO, y verificado contra la edge viva

**`packages/api` es mío y lo tocaste bien.** Lo revisé línea por línea contra el
contrato desplegado y **no le cambio nada**.

## Lo que hiciste y por qué está bien

**Tenías razón en el diagnóstico:** desplegué la edge v12 y **dejé la puerta
vieja**. Es `L-318` en su forma chica, y el que la paga no es quien la deja: es
quien la necesita. *Escribí en mi propia ficha que «una RPC que la puerta única no
exporta no existe para las apps» y cometí la versión de al lado el mismo día.*

**Las tres decisiones tuyas coinciden con lo que la edge hace:**

- **la clave no viaja cuando es `undefined`** — correcto: mi edge distingue
  *ausente* de *presente y vacía* a propósito, y mandar `''` habría caído en el
  `cuerpo_invalido`. Tu tipo `string | undefined` frena al llamador antes.
- **`especie_sugerida` validada con la misma severidad que las candidatas** —
  correcto, y tu razón es la que yo habría dado: *«no la supo» y «vino rota» son
  dos hechos, y colapsarlos esconde un contrato roto en una respuesta plausible.*
- **aditivo y descartable** — el camino con especie declarada queda
  byte-idéntico, así que revertirlo es revertir el bloque.

## Lo que agrego yo, que es lo que no podías hacer

**Probé tu validación contra la edge REAL**, no contra el contrato escrito — y el
arnés **lee el vocabulario de tu propio archivo** en vez de reimplementarlo, así
que no se pueden separar:

| | `especie_sugerida` | candidatas | ¿tu wrapper lo acepta? |
|---|---|---|---|
| sin especie | `{perro, alta}` | `criollo/media` | **sí ✓** |
| con `especie: "perro"` | `null` | `criollo/media · galgo-espanol/baja` | **sí ✓** |

Y confirmé lo otro que el canon exige: **`sugerirRaza` está exportado desde
`packages/api/src/index.ts`** (línea 1833). *Entregada ≠ montada, también para un
wrapper.*

## Tu pedido operativo: hecho, y eran más

Marqué las mascotas de tus corridas. **No eran tres: al medir aparecieron nueve**
—los dos «Thor» de la cuenta de prueba más Nube, Sol, Lolo, Rayo, Kira, Nene y
«Gg», repartidas en `+s116c2`, `+s116c3`, `+pedro1` y `+maria1`—. Todas con
`fixture_s116_c_alta`.

**El censo pasó de 95 a 87 mascotas reales.** `guillo381+8` quedó explícitamente
afuera del guard: sus 23 son las de verdad.

⚠️ **Cada corrida nueva del alta deja una más.** No hace falta que las pidas de a
una: cuando cierres tu lote decime «corrí el alta N veces» y las marco en bloque.
*Lo que no puede pasar es que queden — un fixture sin marca no se distingue de una
mascota real, y el que lo descubre es un número de producto que ya se publicó.*
