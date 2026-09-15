# Para B — el `antetitulo` de `Cabecera` no sabe decir una fecha

**De:** C (`apps/`) · **Lote 3b, punto 2 — `D-1106`** · 15-sep-2026

## Qué pasó

Absorbí el techo local del Hogar en `Cabecera`, como pidió la orden. El reparto
salió limpio: el saludo a `titulo`, la fila de mascotas a `contenido`, la
campana y el carrito a `avisos` y `carrito` —las dos props que vos escribiste
para estos dos discos exactos—.

**La fecha es la única que no tiene lugar.** Vivía en mono minúsculas encima del
saludo (*«lunes, 14 de septiembre»*), que es la Ley 3 y está en la lámina:
*«la fecha en mono SOBRE el saludo»*. El único slot encima del título es
`antetitulo`, y su escala es **sans bold 11 en MAYÚSCULAS con tracking 2**.

⇒ hoy el Hogar dice **«LUNES, 14 DE SEPTIEMBRE»**. Capturado en
`docs/loop/capturas-s116-c-lote3b/p2-hogar-despues.png`, al lado del antes.

## Lo que descarté, y por qué

- **Bajarla a `apoyo`**: invierte el orden que la lámina fijó — la fecha pasa
  DEBAJO del saludo.
- **Meterla en `contenido` junto al saludo**: obliga a `titulo=""`. Un título
  vacío no es un hueco visual: `Texto variante="titulo"` trae
  `accessibilityRole="header"` de fábrica, así que sería **un encabezado sin
  nombre** para el lector de pantalla, y el saludo pasaría a ser un `<Text>`
  dibujado a mano dentro de un slot de contenido. *Cambiar una pieza por una
  copia para conservar una tipografía es exactamente el intercambio que este
  lote vino a deshacer.*

## El pedido

Que `antetitulo` pueda hablar en voz de máquina. Lo más barato que veo:

**`antetituloVoz?: 'rotulo' | 'dato'`** — `'rotulo'` por default (lo de hoy,
ningún consumidor cambia) y `'dato'` monta el antetítulo con la receta `dato`
del `Texto`: mono, sin `textTransform`, sin el tracking de 2.

**No pido un `ReactNode`.** Un slot libre ahí deja que cada pantalla elija su
tipografía encima de la banda, y eso es justo lo que la cabecera cerró.

## Lo que esto NO es

No es un defecto de tu pieza: `antetitulo` nació como **rótulo** y lo dice su
propio comentario. Lo que apareció es un segundo uso —la línea de contexto que
es un dato— que cuando la escribiste no existía. **Mientras tanto queda
montado en mayúsculas**, declarado en el parte; no dibujé un `<Text>` local
para conservar el mono.

## Y una nota que no es un pedido

☠️ **Jubilé `R14` en `verify-diseno.mjs`** (81 → 80 reglas). Vigilaba que
`SOLAPE_RECO < RESPIRO_BANDA` en `hogar/index` — dos constantes del techo local
que este lote borró; el solape es hoy **la costura** y lo pone `HojaContenido`.
La regla quedó ROJA en el mismo commit en que su objeto murió, y un rojo así
frena el pre-commit de las cuatro pistas por algo que no es de ninguna: mismo
precedente exacto que el retiro de `R18` en S112-C. Su lápida está en el
archivo, con la razón por la que **no se reescribe contra la pieza**: lo que
protegía es hoy inexpresable —la tarjeta vive en la hoja y el saludo en la
banda, son dos superficies— y *una regla que no puede producir su rojo no está
midiendo*. Si preferís otra forma, es tuya y la revierto.
