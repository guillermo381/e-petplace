# S116-B · LOTE 9 — la etiqueta y el valor, cada uno con su renglón

**Rama `pista/s116-b-05`.** Gates: `verify:etiqueta-dentro` VERDE (④ en 0) · `verify:diseno` VERDE (80) · `verify:contrast` 504/0 · `verify:catalogo-v5` VERDE (49) · `tsc` 0 en las cuatro.

---

## ① EL DEFECTO NO ERA UN SOLAPE DE PÍXELES: EL INPUT SE APLASTABA

**Lo primero fue medirlo, y la medición corrigió el enunciado.** Con la etiqueta arriba:

| | antes | después |
|---|---|---|
| etiqueta «Tu nombre» | 883–920 (12,3 dp) | 863–900 (12,3 dp) |
| **`EditText` con valor** | 920–953 · **11,0 dp** | 900–969 · **23,0 dp** |
| solape | 0 px | 0 px |

**Los bounds nunca se solapaban: el input estaba aplastado a la mitad de su alto**, y el texto quedaba recortado contra la etiqueta. *El síntoma que se ve —«la etiqueta tapa el texto»— y la causa —«el valor no tiene dónde dibujarse»— son el mismo píxel visto desde dos lados.*

## ② LA CAUSA: UN `flex: 1` QUE CAMBIÓ DE EJE SIN CAMBIAR DE LÍNEA

Hasta el lote 6 el `TextInput` era **hijo directo de la FILA**, así que su `flex: 1` repartía el **ancho**. **El lote 6 lo metió dentro de una COLUMNA** para alojar la etiqueta — y ahí el mismo `flex: 1` pasó a repartir el **ALTO**, peleándole el renglón a la etiqueta.

🔴 ***El `flex` no se movió ni cambió de valor: le cambiaron el padre.*** Es la clase de defecto que **no se ve leyendo el diff, porque la línea no está en el diff** — y por eso lo encontró un dedo en un teléfono y no una relectura.

**La cura son dos cosas, y una sola no alcanza:**
1. **`flex` sólo en multilínea** — ahí el alto sí se reparte y es lo que se quiere. Sin multilínea, el ancho ya lo da la columna: en un contenedor columna los hijos se estiran solos.
2. **Alto EXPLÍCITO del interior: `ALTO_INTERIOR_CAMPO_V5` = 38** (etiqueta 14 + línea 24). *Con el alto fijo en la suma de sus dos hijos no hay nada que `center` reparta, así que la etiqueta no puede comerle lugar al valor pase lo que pase.* ⏪ Había un `minHeight` de **una sola línea**, y eso dejaba la decisión al reparto — de ahí salió el defecto.

## ③ LA MEDICIÓN QUE LA ORDEN PIDE — cero solape en las tres

| pantalla | etiqueta | valor | solape |
|---|---|---|---|
| **05** · registro, texto largo | 863–900 | 900–969 (**23,0 dp**) | **0 px** |
| **alta** · datos básicos | 650–687 | 687–757 (**23,3 dp**) | **0 px** |
| **`CampoFecha`** · antiparasitario | 1264–1301 | 1301–1370 (**23,0 dp**) | **0 px** |

Las cajas **se tocan y no se pisan**: el borde inferior de la etiqueta es el borde superior del valor.

⚠️ **`CampoFecha` ya cumplía sin tocarlo** — su cuerpo es un `<Text>` sin `flex`, así que nunca entró en la pelea. Se midió igual: *una pieza hermana que «debería estar bien» y no se mide es una suposición con forma de verificación.*

## ④ LAS CAPTURAS — tres estados × tres pantallas
`lote9-05-a-vacio` · `lote9-05-b-foco-vacio` · `lote9-05-c-foco-texto` · `lote9-03-a-vacio` · `lote9-03-b-foco` · `lote9-alta-a-vacio` · `lote9-alta-b-foco-vacio` · `lote9-alta-c-foco-texto`.

## ⑤ LO QUE SIGUE EN LA COLA
El buzón de C (la capa del mapa y el fling de la Hoja) queda **sin empezar** — entra después de esto, como estaba ordenado. El punto 3 de ese buzón (la onda) **no tiene nada que curar en la pieza**: es corrección de atribución del píxel y se apaga por config nativa, lote 8 de A.
