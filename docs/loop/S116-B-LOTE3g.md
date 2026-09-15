# S116-B · LOTE 3g — `tamaño` era letra muerta: el botón medía el alto de otro

**Rama `pista/s116-b-05`.**

**Gates:** `verify:diseno` VERDE (80) · `verify:contrast` 479/0 · `verify:catalogo-v5` VERDE · `verify:techos-locales` VERDE · **`verify:boton-alto` NUEVO, verde con su rojo probado** · `tsc` 0 en las cuatro.

---

## ① LA CAUSA, confirmada contra el objeto

```js
// Boton.tsx:622, antes
height: esCompacto ? 44 : pildoraV5 ? altoV5 : t.alto
```

**En la casa v5 `pildoraV5` es SIEMPRE true** (`accent.formaV5`: `true` en light y dark del cliente) ⇒ **`t.alto` era inalcanzable**. El botón medía **58** pidiera el tamaño que pidiera.

> 🔴 **La clase: un valor que el tipo acepta, el editor autocompleta y el render IGNORA.** No hay error, no hay warning, no hay pantalla rota — **hay un botón del alto de otro**. En una celda de rejilla eso es un `xs` de 30 midiendo 58 **dentro de una caja de 30**, y se sale por abajo.

⚠️ **Y por eso mi medición del 3f decía «no desborda» y era correcta: medía el ANCHO, que estaba bien.** *Seis tandas buscando el defecto en el eje equivocado — lo encontró C mirando la caja que lo contiene, no el botón.*

## ② LA CURA — `tamaño` pasa a ser opcional de verdad

```js
height: esCompacto ? 44 : tamaño !== undefined ? t.alto : pildoraV5 ? altoV5 : t.alto
```

**El default dejó de ser `'md'`.** *Con un default, «pedí md» y «no pedí nada» eran indistinguibles — y sin esa distinción no hay forma de que el tamaño gane sin romperle el alto a los CTA que nunca lo pidieron.* Sin pedirlo manda la letra v5 (el CTA de la casa, intacto); pidiéndolo manda lo pedido.

## ③ LA REGLA QUE NO SE PUEDE EVITAR — `verify:boton-alto`

**No busca la línea: la EJECUTA.** Extrae la expresión del `height` y la tabla `TAMAÑOS` del archivo, y **evalúa la expresión** con `pildoraV5=true` para cada tamaño, exigiendo que dé el alto de ese tamaño. *Un lint de texto sobre esa línea se esquiva con cualquier reescritura; éste sólo se esquiva escribiendo un `height` que de verdad respete el tamaño.*

**Rojo probado** restaurando la expresión vieja — y dice el defecto entero:

```
✗ tamaño="xs": se pide 30 y el height da 58
✗ tamaño="sm": se pide 36 y el height da 58
✗ tamaño="md": se pide 48 y el height da 58
✗ tamaño="lg": se pide 56 y el height da 58
```

⚠️ **Su verde dice «el tamaño pedido llega al `height`», jamás «el botón se ve bien».** Eso lo decide el ojo.

## ④ QUÉ CAMBIA EN LOS 93 — y **el prestador NO cambia**

| dónde | `sm` | `lg` | `xs` | ¿cambia? |
|---|--:|--:|--:|---|
| `packages/ui` | 56 | 6 | 1 | **sí**, donde se monte en casa v5 |
| `apps/cliente` | 31 | 0 | 0 | **sí** |
| `apps/prestador` | 76 | 3 | 0 | **NO** |

🔴 **El prestador no cambia, y la razón es medible:** `accent.formaV5` es **`false`** en su tema (`themes/index.ts:230`) y en memorial ⇒ **ahí `t.alto` ya mandaba**. *El defecto sólo existía donde la píldora v5 gana, que es exactamente la casa del cliente.*

**Lo que cambia en los ~94 del cliente + ui:** dejan de medir 58 y pasan a medir lo que pedían — **`sm` baja 22 dp · `lg` baja 2 · `xs` baja 28**. *No es un cambio estético que yo introduzco: es que por primera vez hacen lo que su montaje dice.*

---

## ⑤ EL JUICIO A OJO, que es lo que pediste

📷 `lote3g-stepper-y-agregar-misma-fila.png` — el stepper y el «Agregar» en la misma fila.

**Medido después de la cura** (columna derecha, 360 dp): **alto ~30 dp** (era 58) · margen izq **14,3 dp** · der **14,0 dp** · aire abajo **28 dp**.

**Mi respuesta: de ALTO ya no se ve grande — se lee como una píldora, no como un CTA de pantalla.** Y **no lo bajo más**, con su razón:

> **El stepper de al lado mide lo mismo.** Bajar el botón lo desalinearía de su propio hermano en la misma fila — *y que los dos estados ocupen la misma caja es la letra que S100d·bis firmó después de cuatro iteraciones.* **Bajarlo ahora sería ganar un defecto para curar otro que ya no está.**

⚠️ **Lo que SÍ veo que sigue pesando, y no es el alto: el relleno.** Al lado del stepper —tres piezas sueltas con blanco entre medio— el «Agregar» es **una barra magenta plena de borde a borde**, y pesa más que su vecino aunque midan igual. **La palanca de eso es la variante, no el tamaño** (un secundario tonal en lugar del primario pleno), y **eso es decisión tuya: no la tomo por mi cuenta.**
