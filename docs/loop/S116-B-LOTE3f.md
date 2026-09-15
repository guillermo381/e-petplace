# S116-B · LOTE 3f — los tres pedidos de C, y **el «Agregar» medido en píxeles**

**Rama `pista/s116-b-05`.**

**Gates:** `verify:diseno` VERDE (81) · `verify:contrast` 479/0 · `verify:catalogo-v5` VERDE · `verify:techos-locales` VERDE · `tsc` 0 en las cuatro.

---

## ① `Cabecera.antetituloVoz` — el antetítulo aprende a decir un dato

`'rotulo'` (default, lo de siempre: sans bold 11 en mayúsculas con tracking) · **`'dato'`** (la receta `dato`: mono, minúsculas, sin tracking).

**Acepté la forma que propuso C y no un `ReactNode`, con su razón:** *un slot libre ahí deja que cada pantalla elija su tipografía encima de la banda, y eso es justo lo que la cabecera cerró.*

⚠️ **Y no era un defecto de la pieza:** `antetitulo` nació como **rótulo** y lo dice su comentario. *Lo que apareció después es un segundo uso —una línea de contexto que es un dato— que cuando se escribió no existía.* **Ningún consumidor cambia**: el default es el de hoy.

## ② `Celda.metadata` — el hermano en sans

Mismo lugar y misma alineación que `metadataMono`, **en sans y sin `toLowerCase()`**: *el riel entrega «Mar 15 sept» y una fecha de familia no se minuscula — se muestra como la escribió quien la formateó.*

**Tomé la opción (a) de C, que era su voto.** ⚠️ **Y `metadataMono` no se toca ni se jubila:** los minutos, los montos y los folios **siguen siendo voz de máquina**. *Lo que cambió no es la prop: es que una fecha de cita dejó de ser metadata.*

## ③ `HojaContenido.scrollRef` — revisado, **me lo quedo tal cual**

**Nace de una pérdida silenciosa:** seis pantallas tenían un `ref` para llevar el ojo a un lugar, y ese `ref` **no entra por `scroll`**. Sin la puerta, **el `scrollTo` deja de hacer nada sin que nada falle** — el botón responde, el estado cambia, la pantalla no se mueve.

✅ **Lo acepto sin cambios y digo por qué:** es **un pase, no una capacidad**, y **deja cerrado exactamente lo que debe**: `bounces`, `overScrollMode` y `onScroll` siguen fuera, *porque del último depende el fundido del fondo*. **Ensancha la puerta sin soltar la llave.**

**Sobre la jubilación de `R14` que C declara en el mismo buzón: la respaldo.** Vigilaba `SOLAPE_RECO < RESPIRO_BANDA`, dos constantes del techo local que este lote borró. *Una regla que no puede producir su rojo no está midiendo*, y dejarla roja frenaría el pre-commit de las cuatro pistas por algo que no es de ninguna.

---

## ④ EL «AGREGAR» — medido en píxeles, **y en este árbol NO desborda**

📷 `lote3f-rejilla-agregar-medido.png` — rejilla de cuatro, emulador de tres botones, 360 dp.

**Columna derecha, medido sobre el PNG (1080 px, densidad 3):**

```
tarjeta blanca   x = 565 .. 1025
botón «Agregar»  x = 599 ..  993
                 ─────────────────
margen izquierdo   599 − 565 =  34 px = 11,3 dp
margen derecho    1025 − 993 =  32 px = 10,7 dp     (spacing[3] = 12 dp)
aire abajo                              28,0 dp
```

⇒ **El borde izquierdo del botón está a la derecha del de la tarjeta y el derecho a la izquierda del suyo, como pediste que verificara.** Los dos márgenes son simétricos y dan el relleno del contenedor; **hay aire abajo**.

🔴 **No “lo arreglé”, y esa es la decisión:** el árbol de esta rama ya trae el `xs` y el `paddingBottom` del lote 13. **Tu captura tiene que ser de un bundle sin ese lote** — *cambiar valores que la medición dice que están bien es la forma más rápida de romper lo que ya andaba, y esta tarjeta lleva cinco iteraciones de eso.*

⚠️ **Lo que mi medición NO prueba, dicho:** midió **un ancho** (360 dp) y **una tarjeta**. *Si tu teléfono es más angosto, el desborde puede existir y este número no lo vería.* Si lo seguís viendo sobre un bundle que incluya el lote 13, mandame el ancho de tu pantalla y lo mido ahí.

### El censo que pediste: ninguna otra tarjeta tiene el patrón

De las piezas con `<Boton>` adentro de una superficie de tarjeta, **ninguna monta un botón `bloque` dentro de un contenedor con relleno propio salvo `TarjetaProducto`**:

| pieza | botones `bloque` | relleno del contenedor |
|---|--:|---|
| `TarjetaProducto` | 7 | `padding: spacing[3]` |
| `TarjetaHoy` | 1 | `padding: spacing[4]` |
| `TarjetaFactura` | 0 | `padding: spacing[4]` |
| `FichaAdoptable` | 7 | `paddingHorizontal: spacing[5]` |
| `VitrinaRefugio` | 0 | `padding: spacing[5]` |

*Las cuatro que sí llevan botón lo montan dentro de un contenedor con su padding — el mismo patrón que medí acá.* **El desborde no es una clase: si existe, es de esta tarjeta en un ancho que no medí.**
