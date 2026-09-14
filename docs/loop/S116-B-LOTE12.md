# S116-B · LOTE 12 — `D-1116` y el disco que se copió por estar solamente expuesto

**Rama `pista/s116-b-05`.**

**Gates:** `verify:diseno` VERDE (81 reglas) · `verify:contrast` **464/0** · `verify:catalogo-v5` VERDE (**34 piezas en 29 entradas**) · `verify:reduced-motion` VERDE · `verify:isotipo-path` VERDE · `tsc` 0 en las cuatro.

---

## ① `D-1116` — LAS CINCO FILAS CIERRAN, Y LA CURA VA EN EL ABANICO

**Medido antes de tocar:** `BotonAsistente:299` envolvía `onPreguntar` (`setAbanicoAbierto(false)` y después la acción), y `atajos={props.atajos}` viajaba **crudo** hasta `AbanicoAsistente:178`, que los llamaba directo. **Una fila envuelta, cuatro sin envolver.**

**Se curó en el abanico y no en el padre**, y la razón es de forma, no de gusto:

> **Cuando el que envuelve es el padre, hay que acordarse de envolver cada lista nueva — y el que no se acuerde no rompe nada visible.** Deja el abanico abierto encima de la pantalla a la que acaba de llevar, que es un defecto sin excepción, sin log y sin stack.

Envolviendo adentro (`cerrarYLuego`), **una fila que no cierre se vuelve inexpresable**: no hay forma de agregar una sin pasar por ahí. El padre dejó de envolver — *dos envolturas no sólo cierran dos veces: dejan creer que el responsable es el otro, que es exactamente el reparto que produjo el defecto.*

⚠️ **El orden es parte de la cura: cierra PRIMERO, navega DESPUÉS.** Al revés, la navegación desmonta el abanico y el `setState` cae sobre un componente que ya no está.

**Control que lo prueba, reproducible:**

```
$ grep -n "onPress=" packages/ui/src/components/AbanicoAsistente.tsx
 96:        onPress={onPress}              ← el Pressable interno de la fila (recibe el ya envuelto)
160:      onPress={onCerrar}               ← el velo
184:          onPress={cerrarYLuego(onPreguntar)}
192:          onPress={cerrarYLuego(a.onPress)}

$ grep -c "onPress={\(onPreguntar\|a\.onPress\)}" …   →  0   (filas sin envolver)
```

⚠️ **Sin captura, y lo digo en vez de omitirlo.** Es un defecto de **lógica**, no de píxeles: una foto del abanico cerrado no distingue «cerró al tocar» de «no se abrió». **El control de arriba prueba más que la captura** — y el camino al abanico sigue siendo el que el lote 11 declaró intransitable (la app monta la variante sin `atajos`; la entrada de galería vive a ~9 % de un scroll sin índice).

---

## ② `DiscoVidrio` SALE COMO PIEZA — y el hallazgo es POR QUÉ hizo falta

**El disco ya estaba expuesto desde el lote 2** como `Cabecera.Disco`, **con un comentario que pedía literalmente lo que después pasó**: *«que quien monte la acción derecha use EL de la cabecera y no dibuje otro (el molde de R57: la superficie es UNA)»*.

**C lo copió igual** para el carrito de la Despensa. Y no fue descuido:

> 🔴 **EXPONER NO ES PUBLICAR.** Una propiedad estática no entra al índice del paquete, no tiene entrada de catálogo, no tiene fila en la galería y **no aparece en un autocompletado de `@epetplace/ui`**. Para quien no leyó ese archivo **es indistinguible de una pieza privada** — y la salida barata siempre es volver a dibujarla.

*El comentario que pedía no copiarla vivía adentro del único archivo que hay que abrir para enterarse de que existe.*

**Lo hecho:** la pieza se **mueve** (no se copia) a `packages/ui/src/components/DiscoVidrio.tsx`, sale por el índice, gana entrada de catálogo y **fila propia en la galería**. `Cabecera` la importa y sus dos usos —volver y carrito— quedan intactos.

☠️ **`Cabecera.Disco` queda como alias con su condición de muerte escrita**: se retira cuando su último consumidor migre. *No se corta hoy porque hay ramas en vuelo que lo montan así, y romperlas a mitad de sesión cuesta más que el alias* — pero **dos puertas al mismo disco son justamente lo que produjo la copia**, y por eso el alias nace con fecha y no como segunda opción.

**Dos cosas que la entrada del catálogo dice y el código solo no decía:**
- ⚠️ **Su material exige ciruela debajo:** es blanco al 16 %. **Sobre lienzo no se ve** — montarlo en fondo claro *no lo muestra mal: lo muestra ausente*. Por eso su fila de galería va sobre un bloque ciruela y no sobre el fondo de la galería.
- **Sin `onPress` es contenedor** (no anuncia toque ni toma rol); con `onPress` es botón.

⚠️ **La cuenta de consumidores queda en CERO y el cero es el dato:** `Cabecera` la monta dentro de `packages/ui`, que el gate no cuenta. **Deja de ser cero cuando el carrito de la Despensa migre de su copia a esta pieza** — que es lo único que falta para que *el carrito sea uno*, y es de C.

---

## ③ COLA VIVA

- 🟡 **Buzón de C — los rectángulos invertidos del abanico (accesibilidad).** Anotado, **sin medir todavía**: entra en el próximo lote con su relevamiento propio. *No lo toco de oído: un arreglo de accesibilidad hecho sobre una descripción de segunda mano es indistinguible de uno hecho sobre el defecto equivocado.*
- 🟡 **El abanico sigue sin existir en la app** (`_layout.tsx:145` monta la variante sin `atajos`) — cableado de C, y es la mitad que falta para que el founder vea el fan.
- 🟡 **La onda con teclado arriba/abajo** sigue sin captura: vive en las pantallas de acceso y el emulador está con sesión abierta, compartida con las otras pistas.
