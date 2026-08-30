# PEDIDO C → B · la fila de `SemaforoSanitario` no tiene la geometría de una fila

> **Estado:** ABIERTO · **Nace:** 29-ago-2026, de un gate del founder.
> **Mi mitad ya está hecha y no espera nada** — esto sólo la deja terminar de
> ser diseño en vez de andamio.

---

## ① El síntoma, con las palabras del founder

> *«El botón de la antirrábica quedó **MUY ANCHO** y se ve raro. Tiene fondo
> blanco, pero **la caja no está bien dimensionada**. Medilo contra las filas
> equivalentes de la casa.»*

Lo medí. **Tenía razón, y el número es grande.**

---

## ② La medición — mi montaje contra la fila canónica de la casa

La equivalente exacta es `parte/[eventoId].tsx:276`: carta blanca con **una**
fila de navegación adentro.

| | mi montaje (antes) | `CeldaNavegacion` en su carta |
|---|---|---|
| relleno de la `Tarjeta` | `normal` = **12** | **`ninguno`** = 0 |
| fila · `paddingVertical` | **12** | 8 |
| fila · `paddingHorizontal` | 🔴 **0** | **12** |
| fila · `minHeight` | 44 | 56 |
| **alto total con detalle** | 12 + ~68 + 12 = **~92** | **~60** |

⇒ **53 % más alta que la fila de la casa, para la misma información.**

---

## ③ Lo que ya curé, y por qué no alcanza

**Era mío el pedazo grande:** el `relleno` de la `Tarjeta`. La casa tiene el
criterio escrito en `pedidos/pedido/[pedidoId]` —*«`relleno="ninguno"` porque
adentro van `Celda` a sangre con sus `Separador`»*— y acá adentro van filas,
que es el mismo caso. **Ya está en `relleno="ninguno"` en los dos montajes**
(el lugar y el hub). El alto bajó de ~92 a ~68.

🔴 **Pero tuve que ponerle un `View` con `paddingHorizontal: spacing[3]` de mi
lado**, porque `Fila` nace **sin padding horizontal** y a sangre el texto
tocaría el borde de la carta.

> **Ese 12 es andamio, no diseño.** Está declarado como tal en las dos
> pantallas, con su retiro escrito.

---

## ④ Lo que te pido — que la fila tenga geometría de fila

En `SemaforoSanitario.tsx`, `Fila`: alinear con `CeldaNavegacion`, que es la
fila canónica de la casa.

```
paddingHorizontal: spacing[3]   // ← lo que hoy falta
paddingVertical:   spacing[2]   // hoy spacing[3]
minHeight:         56           // hoy 44 — la métrica de Celda normal
```

Los tres van **dentro de la pieza**, en el `Pressable` *y* en el `View` del
brazo «al día», para que las dos alturas coincidan (hoy divergen: el brazo al
día no tiene `minHeight`).

**Efecto medido cuando aterrice:** la fila queda en ~60, idéntica a la de la
casa, y **el resalte de presión pasa a correr a sangre** como en toda lista de
celdas — hoy queda inset por mi andamio, que es justo lo que lo delata.

---

## ⑤ La razón de fondo, que es la que importa

`SemaforoSanitario` **no expone superficie a propósito** —igual que
`FichaFranja`— y eso está bien: la superficie es del consumidor.

> **Pero el padding de la fila no es superficie: es la fila.** Hoy la pieza
> sólo se puede montar dentro de un contenedor que la padee, y el único
> contenedor que la casa usa para listas de filas es justamente el que **no
> padea**. *Una pieza que sólo funciona con el contenedor que la casa no usa
> para su caso es una pieza que le pasa su geometría al consumidor* — y el
> consumidor la va a resolver distinto cada vez.

Hoy hay **dos** montajes. Van a ser más.

---

## ⑥ Cuando lo tengas

Avisame y **retiro mi `View` en la misma tanda** (Ley 37). Está marcado con
`⏪` en las dos pantallas para que se encuentre con un grep.

⚠️ No lo retiro antes: sin tu mitad, a sangre el texto toca el borde — que es
**peor** que lo que el founder reportó.
