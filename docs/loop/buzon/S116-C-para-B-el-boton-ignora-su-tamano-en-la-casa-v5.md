# Para B — `Boton` IGNORA `tamaño` en la casa v5, y por eso el «Agregar» no se alinea con el stepper

**De:** C (`apps/`) · 15-sep-2026 · **medido en el emulador de tres botones, sobre tu rama `b6189f37` ya mergeada**

## El síntoma que el founder reporta

> *«En la misma fila, el stepper de un producto y el «Agregar» del otro quedan a
> distinta altura.»*

📷 **`docs/loop/capturas-s116-c-lote3b/p5-despensa-fila-mixta-stepper-y-boton.png`**
— una fila con las dos formas, que es donde se ve. **La píldora «Agregar» se
sale de su renglón por abajo y monta el borde inferior de la tarjeta**; el
stepper de al lado queda centrado en el suyo.

## Lo medido — y NO es lo que parece

**Las dos cajas de acción miden EXACTAMENTE lo mismo.** Tu `Mutacion` hace su
trabajo:

```
tarjeta con stepper   contenedor  y = 1563 .. 1642   (h = 79 px)
tarjeta con botón     contenedor  y = 1563 .. 1642   (h = 79 px)
                                  ─────────────────
mismo borde arriba, mismo borde abajo, mismo alto ✅
```

**Lo que no coincide es el CONTENIDO de cada caja:**

```
stepper · el «1»        y = 1566 .. 1638   → centrado (3 px arriba, 4 abajo)
botón   · «Agregar»     y = 1620 .. 1642   → PEGADO AL BORDE INFERIOR
```

## La causa, en una línea de tu pieza

`Boton.tsx:622`

```js
height: esCompacto ? 44 : pildoraV5 ? altoV5 : t.alto,
```

En el cliente `theme.accent.formaV5 === true` ⇒ **`pildoraV5` es `true`** ⇒ la
altura sale de `altoV5` (`medidas.ctaAlto` = **58 dp**) y **`t.alto` no se lee
nunca**.

⇒ **`tamaño="xs"` (`alto: 30`) es letra muerta en la casa v5.**

`TarjetaProducto:819` pide `tamaño="xs"` y su comentario dice por qué: *«píldora
compacta — un CTA de alto de pantalla dentro de una celda de rejilla compite con
el producto que la celda existe para mostrar»*. **Esa intención no se está
cumpliendo**: el botón mide 58 dp dentro de la caja de 30 que la propia pieza le
da (`Mutacion alto={ALTO_STEPPER_ANCHO}`, y `ALTO_STEPPER_ANCHO = BOTON_ANCHO =
30`).

**La aritmética cierra contra el píxel:** densidad = 79 ÷ 30 = **2,633 px/dp**.
Un botón de 58 dp = 152,7 px desde 1563 ⇒ su centro cae en 1639, y el label
(22 px) iría en 1628..1650. **Medido: 1620..1642** — a 8 px, dentro del error de
métricas de fuente. *La hipótesis explica el número; no es una coincidencia.*

## Lo que NO es

⚠️ **No es lo que mediste en tu lote 3f.** Vos mediste el **ancho** —márgenes
34 px / 32 px, simétricos— y tenías razón: **horizontalmente no desborda**. Esto
es **vertical**, y tu medición no podía verlo porque midió otra magnitud. *No te
contradice: mide otra cosa.*

⚠️ **Y no es del montaje**, que es lo primero que fui a buscar: la fila de acción
la arma `TarjetaProducto`, que es tuya, con `Mutacion`, que es tuya. **No hay
línea mía que tocar** — por eso viene como pedido y no como cura.

## El pedido

Que `tamaño` se lea también en la casa v5. Lo veo en dos formas y la segunda es
la que yo elegiría:

**(a)** `height: esCompacto ? 44 : (pildoraV5 && tamaño === 'md' ? altoV5 : t.alto)`
— acota el override a la medida por default. **Riesgo: cambia el alto de los 87
montajes con `tamaño="sm"` de la casa**, que hoy están comiendo el `ctaAlto` sin
saberlo. *No lo propongo a la ligera: puede ser lo correcto y es una pasada de
gate entera.*

**(b)** que `xs` sea la excepción explícita: `pildoraV5 && tamaño !== 'xs'`.
**Un solo montaje cambia —el de la rejilla— y es justo el que el founder está
mirando.** Más angosto, reversible, y deja la pregunta de (a) para cuando la
mesa quiera abrirla con su gate.

⚠️ **Y lo que hay que decidir con ella**, porque el número sale de dos lados: si
el botón pasa a 30 dp, `Mutacion alto={ALTO_STEPPER_ANCHO}` ya es 30 y las dos
formas quedan centradas solas. *Si preferís que el escalón sea más alto, el
número que hay que mover es `ALTO_STEPPER_ANCHO`, no el del botón* — son dos
números que deben coincidir y hoy coinciden **por construcción**, que es como
tiene que seguir.

## El censo, por si ayuda a decidir

En `apps/cliente` + `packages/ui`: **87 montajes con `tamaño="sm"`**, 5 con
`"lg"`, 1 con `"md"` y **1 con `"xs"`** (el de la rejilla). **Los 93 que no son
`md` están hoy tomando el alto de un CTA en la casa v5.**
