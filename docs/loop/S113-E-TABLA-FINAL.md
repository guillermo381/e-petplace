# S113-E · la tabla final por la edge, y los ocho puntos que esperan firma

---

## ① ¿Antes o después? — **ANTES, con un anclaje declarado**

*El cotejo se llama distinto en cada caso, así que va primero y sin adornos.*

**Documento B — limpio.** Lo transcribí en la adenda anterior, **antes de que
existiera `verdad-vista/`** y antes de tener noticia de que D hubiera
transcripto nada. Cero exposición.

**Documento A — segunda mano intacta, con UNA cosa que yo ya sabía.** No abrí
`documento-A--D.json` hasta después de escribir el mío (los dos míos declaran
`sin_ver_la_de_D: true`). Pero **sí leí `DOCUMENTOS.md` antes**, que era
necesario para saber *cuáles* eran los documentos — y ese archivo **nombra al
veterinario que firma el documento A**. O sea que ese dato lo tenía antes de
abrir la imagen. Lo leí igual en la foto (está impreso en las quince filas),
pero **no es una lectura independiente y no cuenta como coincidencia.**

**Un anclaje menor más:** el *control* de `cotejar-verdad.mjs` —la herramienta,
no la mano— trae tres valores de ejemplo del documento B. Los leí **después** de
haber transcripto B, y coinciden con lo que ya tenía escrito.

⇒ **Es un cotejo de dos manos en todo salvo el nombre del veterinario del
documento A, que es una sola lectura con eco.**

---

## ② El lugar compartido pasa a ser un git local

`~/.epetplace/ia-conjuntos/` · `git init`, **cero remotos**, primer commit
`96a6040` con las cuatro manos y `FIRMAS.json`. Las **imágenes quedan fuera**
(`.gitignore`): son fotos de animales reales y lo que hay que auditar es *lo que
se leyó de ellas*, no ellas.

**Lo que el versionado agrega sobre la firma sola:** con `FIRMAS.json` se sabe
**QUE** una mano cambió; con los commits se sabe **CUÁNDO**, respecto de qué
cotejo, y **qué decía antes**. *La firma detecta; la historia explica.*

**Regla: cada mano nueva o corregida es UN commit, y se re-firma en el mismo
acto** — una firma que queda vieja convierte al gate en un rojo falso, que es
peor que no tenerlo.

---

## ③ La tabla final — v2 **por la edge desplegada** (version 72), contra la referencia de dos manos

5 imágenes · **43 filas de referencia** · Sonnet 5 (la edge **rechaza** que el
cliente elija modelo: `«El modelo no se elige desde el cliente»`).

| campo | exactitud | |
|---|---|---|
| nombre | **97,1%** | 34/35 |
| fecha aplicada | **88,9%** | 24/27 · 8 sin verdad |
| fecha próxima | **100%** | 8/8 · 27 sin verdad |
| lote | **75,9%** | 22/29 · 6 sin verdad |
| veterinario | **92,3%** | 12/13 · 22 sin verdad |
| tipo de vacuna | **no se puntúa** | ninguna mano lo transcribió ⇒ sin referencia |
| **invención** | **25,5%** | 12 de 47 filas devueltas |
| recall de filas | **81,4%** | 35/43 visibles |
| **plan impreso** | **0 filas** | ver abajo |
| latencia | **p50 9.271 ms · p95 13.437 ms** | (modelo: p50 8.212 · p95 12.949) |
| **costo** | **$0,02236 por carnet** | $0,11181 los cinco · REAL, de `ia_uso` |

### La edge no agrega nada raro, y eso está medido

Misma referencia, mismo prompt, por **API directa** contra por **edge**:

| | nombre | fecha | lote | invención | p95 | costo |
|---|---|---|---|---|---|---|
| API directa | 94,6% | 89,7% | 74,2% | 21,3% | 12.440 ms | $0,02194 |
| **edge (v72)** | 97,1% | 88,9% | 75,9% | 25,5% | 13.437 ms | $0,02236 |

⇒ **las dos vías miden lo mismo dentro del ruido de dos corridas.** El ~1 s de
diferencia en p95 es la red y el base64 subiendo; el costo, idéntico.

### `plan_impreso` en 0 — y ahora se puede decir POR QUÉ

Mi arnés avisaba con dos hipótesis: *«o el conjunto no tiene renglones de plan,
o la edge no es la v2»*. **Se puede cerrar la primera**: la respuesta de la edge
trae la clave `plan_impreso` ⇒ **es la v2**. ⇒ **estos dos documentos no tienen
renglones de plan sin usar**: todas sus filas llevan sticker, fecha y firma.
*El campo no se ejerció acá — no es que no funcione: es que no había qué separar.*

### 🔴 Lo que esta tabla NO dice

- **No hay comparación v1 vs v2 sobre esta referencia.** La corrida de v1 que
  tengo se puntuó contra la *verdad de aceptación*, que resultó equivocada. Y la
  edge ya es v2, así que rehacer v1 exige llamarla por API. **Se puede; no está
  hecho.**
- **`tipo_vacuna` no se midió**: ninguna mano lo transcribió.
- **Los ocho puntos de abajo no se puntúan** hasta la firma ⇒ **estos números
  son un PISO**: cuando se firmen, sólo pueden subir o quedar igual.
- **4 de las 5 imágenes son el MISMO documento.** Como casos independientes esto
  vale **dos**; lo que agrega la repetición es robustez a la captura, no tamaño
  de muestra.

---

## ④ Los ocho puntos que esperan tu firma

> Cada uno con **las dos lecturas** y **qué mirar**. Sin nombres de personas ni
> teléfonos. Salen de `pnpm verify:cotejo --doc A` y `--doc B`.

### Documento A — el de dos páginas (`PROGRAMA DE VACUNACIÓN`)

**1 · Fila 11: ¿el producto se puede nombrar, o queda ilegible?**
- **D:** «Recombitek (sticker beige)», lote `350918`
- **E:** «(sticker no identificable)», lote `null`
- **Qué mirar:** página **derecha**, tercer bloque contando desde arriba — el
  sticker chico y claro que está **entre** el de fondo azul y el rojo, en la
  fila cuya fecha es `15/03/23` y su próxima `15/03/24`. La pregunta es sólo si
  a esa resolución se lee la marca y un lote de seis dígitos.
- *Las otras 14 filas de este documento: **cero contradicciones**. Los dos
  contamos 15.*

### Documento B — el plegable vertical con stickers

**2 · El CONTEO: 8 (D) contra 7 (E).** *Es la decisión madre — el punto 8 es su
otra cara.*
- **D:** dos filas — un producto contra leptospirosis+rabia y otro polivalente
- **E:** **una** fila, porque los dos stickers comparten el **mismo lote**
- **Qué mirar:** al **pie** del carnet, los dos stickers de la misma marca,
  ambos con lote `9B2F` y vencimiento `FEB 25`, contra la fecha `06 07 2024`.
  **¿Dos stickers con el mismo lote y la misma fecha son una dosis o dos?**

**3 · Fila 5, el vencimiento: ¿se completa el día que no está impreso?**
- **D:** `2024-05-31` · **E:** `05-2024`
- **Qué mirar:** el sticker azul de la vacuna polivalente imprime **`05-2022
  05-2024`** — mes y año, **sin día**. La pregunta no es qué dice: es si la
  regla de la casa permite completar el último día del mes.
- *Ojo: otros tres vencimientos que parecían desacuerdo NO lo son — son la misma
  fecha en otro formato (`25APR24` = `2024-04-25`). El cotejo ya los colapsó.*

**4 · Fila 4 — `evidencia`** · **5 · Fila 5** · **6 · Fila 6** · **7 · Fila 7**
- **D:** `sticker_con_fecha` (en la fila 7: `sello`) · **E:** `manuscrito`
- **Qué mirar:** en este carnet **el sticker NO trae la fecha de aplicación** —
  sólo la validez del frasco. La fecha está **escrita a mano en la columna
  FECHA**, al costado. **Ninguno de los dos está distraído: el vocabulario no
  tiene un valor para «hay sticker Y la fecha es manuscrita».**
- 🔴 **Y esto no es sólo del carnet: el prompt v2 le pide al modelo que emita
  `evidencia`.** Si dos lectores con la misma regla se parten **4 a 0**,
  puntuar al modelo ahí es puntuarlo contra una moneda al aire. **Por eso no lo
  puntué**, y por eso conviene decidirlo aunque el carnet ya esté resuelto.
  *(De hecho el modelo declaró `sticker_con_fecha` en 45 de 47 filas — o sea que
  eligió el mismo lado que D.)*

**8 · Fila 8: el nombre.** D tiene una octava fila; E no tiene fila 8.
- **Es el punto 2 visto desde el otro lado** — se resuelve con la misma firma.

### Y una cosa que ninguna de las dos manos asignó

En el documento B hay **un valor manuscrito de más**: cuento **7 rótulos FECHA y
7 grupos de stickers, pero OCHO valores escritos a mano**. El que sobra dice
`15/JUL` y está debajo de la fecha de la fila 6, en la misma posición donde las
filas 4 y 5 escriben la suya. **Lo verifiqué en las siete fotos: en todas se ve
igual.** Puede ser la próxima dosis de esa fila, una aplicación cuyo sticker no
está pegado, o la fecha real de la fila 6. **No lo decidí, y no ajusté mi
conteo a 8 para que cerrara con la base.** D lo marca en su `nota` como decisión
de criterio, no de lectura — coincidimos en no resolverlo.
