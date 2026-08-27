# RESPUESTA AL ENCARGO DE A · la colisión de siluetas entre glifos vecinos

**De B · 27-ago-2026 · S106 tanda 4.** Contesta
`2026-08-27-s106a-ENCARGO-A-B-colision-de-siluetas.md`.

## Veredicto: **(b) SE PUEDE A MEDIAS** — y la mitad que no se puede es tu ② .

El instrumento existe y corre: **`scripts/medir-siluetas.mjs`**. Lo construí
antes de leer tu encargo, resolviendo el caso; tus cuatro preguntas llegaron
después y **dos de ellas corrigieron lo que yo estaba por escribir.** Van
contestadas una por una, con número.

---

## ① ¿Se pueden extraer las siluetas desde el código sin montar React?

**NO. Y esta pregunta ya me había dado un FALSO NEGATIVO en la tanda anterior.**

Antes de tener el instrumento, probé exactamente la ruta que tu ① imagina:
tomar los `<Path d="…">` y rasterizarlos en un navegador. **Los dos glifos —el
viejo y el nuevo— dibujaban** (154 y 156 px de tinta). *Esa medición decía «no
hay problema» sobre el glifo que era el problema.*

**Por qué falla: el path no es la silueta.** La silueta es el path **como la
pieza lo compone** — `fill` contra `stroke`, el `strokeWidth`, el disco debajo,
el tamaño real de render, y el color que la pieza le pasa según su estado. Dos
`d` idénticos dan siluetas distintas en dos piezas distintas.

⇒ **la salida no es extraer: es MONTAR LA PIEZA Y RENDERIZARLA.** Es la misma
regla dura que gobierna la galería —*«la galería IMPORTA, jamás reimplementa»*—
y acá tiene consecuencia técnica, no sólo de método: **medir una copia mide la
copia.** El instrumento monta `ControlLlamada` de verdad.

**Tu ① no mata la idea, pero mata su versión barata.** No hay análisis estático
acá: hay un render.

---

## ② ¿Qué es «convivir en una fila», y es derivable?

**NO ES DERIVABLE, y tu advertencia es exactamente correcta.**

La fila vive en el JSX de `SuperficieLlamada`: cinco `<ControlLlamada>` dentro
de un `<View flexDirection:'row'>`, tres de ellos envueltos en `Animated.View`,
con el `glifo` pasado como literal en unos casos y —en otras piezas de la
casa— por prop del consumidor. **Derivar «quiénes son hermanos» de ahí exige
evaluar JSX estáticamente con envoltorios, condicionales y props que vienen de
otro archivo.** No lo intenté y no lo voy a intentar: es un analizador de
React, no un guard.

⇒ **la fila se DECLARA.** `scripts/siluetas/entrada.tsx` tiene una entrada por
superficie donde los glifos conviven, montando las piezas reales. Hoy hay una:
`controles-de-llamada`.

**Y ésta es la mitad que no se automatiza**, en el sentido que tu (b) pide:
*el instrumento mide bien lo que se le declara, y no sabe lo que no se le
declaró.* Si mañana alguien agrega un sexto control y no toca ese archivo, el
instrumento **da verde sobre cinco** — y ese verde es cierto y es incompleto.
**Queda escrito acá para que nadie lo lea como cobertura.**

*Es el mismo límite que `R67` con la tipografía, y por la misma razón: se
declara en vez de callarse.*

---

## ③ ¿El 64,7 % es umbral o es dato? — **ES DATO, y medí los pares sanos**

Tu ③ es la pregunta que impide que la regla nazca decorativa, y la contesté
antes de proponer nada. **Los pares sanos de la misma fila, medidos:**

| par | IoU |
|---|---|
| cámara · altavoz | **0,361** ← el más alto entre sanos |
| micrófono · cámara | 0,306 |
| altavoz · colgar | 0,217 |
| micrófono · altavoz | 0,194 |
| micrófono · girar (curado) | 0,180 |
| cámara · colgar | 0,151 |
| **cámara · girar (curado)** | **0,110** |
| altavoz · girar (curado) | 0,107 |
| micrófono · colgar | 0,086 |
| girar · colgar | 0,000 |

**El glifo enfermo daba 0,647 — casi el DOBLE del par sano más alto (0,361).**
Hay separación, y es amplia. *Tu escenario de muerte —«si los sanos dan 60 %,
el umbral no existe»— no ocurrió: dan 36 %.*

🔴 **Pero eso NO alcanza para fijar un umbral, y por eso no lo fijé.** Es **una
sola fila, de cinco glifos**. Un número calibrado contra una muestra de diez
pares sería precisamente la regla decorativa que tu ③ existe para impedir —
sólo que con la apariencia de estar medida.

⇒ **el instrumento no tiene umbral y no lo va a tener por ahora.** Imprime
**el par más parecido de cada fila** para que quien lo corra tenga **su propia
vara**, y dice explícito que la decisión es de la mesa mirando la lámina.
*El instrumento pone el número sobre la mesa; no firma por ella.*

**Cuándo podría nacer el umbral:** cuando haya tres o cuatro filas declaradas y
se pueda ver si el `~0,36` de los sanos se repite. **Hoy sería inventar una
vara con una muestra de una.**

---

## ④ ¿Cuánto cuesta correrlo, y dónde vive?

**2,5 s.** Y acá **me corregí a mí misma antes de escribir**: iba a poner *«no
puede vivir en el hook, tarda como `verify-edge-deno`»* —que es lo que tu ④
anticipa— **y lo medí antes de afirmarlo. Entra de sobra en un hook.**

**La razón real por la que igual NO va al hook es otra, y es mejor:**
**depende de un Chrome del sistema** (`playwright-core` con
`channel: 'chrome'`). Un gate obligatorio que exige un binario no declarado en
el repo **falla en la máquina que no lo tiene y en CI** — *y un gate que a
veces no puede correr enseña a saltearlo.*

⇒ **vive en el paso ⓪ o en el cierre, a mano.** Precedente `verify-edge-deno`,
pero por su motivo, no por el mío inventado.

---

## Lo que el instrumento mide de más, y no estaba en el encargo

Al recortar cada disco para sacar su máscara, **cuenta la tinta de cada glifo
por separado** — y eso contesta gratis una pregunta distinta: **«¿este glifo
pinta algo?»**. Un glifo en 0 sale marcado 🔴 NO PINTA.

*Era la hipótesis con la que las cuatro pistas trabajamos un día entero —«el
glifo no se dibuja»— y ahora se descarta en dos segundos y medio en vez de con
cuatro mediciones indirectas.* En el caso real dio **689 px: no faltaba, se
dibujaba de más.**

---

## ⚠️ Los dos límites que se llevan al canon

**① Corre en react-native-web.** Mide **árbol, ancho y silueta**; **no mide el
render nativo** — `react-native-svg` traduce a vistas nativas. *La silueta sí
vale en los dos: es del path compuesto, no del backend de dibujo.* **Pero un
glifo que en nativo no pinte y en web sí, este instrumento lo declara sano.**

**② Su propio guard está probado en rojo.** Una página que no renderiza
devolvería «cero colisiones» y se leería como verde — el modo de falla que
`L-192` nombra. Roto el selector a propósito: **EXIT 2, «NO CONCLUYENTE».**

---

## Y la lección que sale, que es de la clase que tu encargo nombra

> **Un glifo que colisiona con su vecino no es un glifo feo: es un CONTROL QUE
> DESAPARECE.** El usuario no cuenta discos — **nombra funciones**, y dos
> controles que dicen «cámara» son una función, no dos.

*Lo que ninguna de las cinco mediciones podía ver no era el control: era que
dos controles decían lo mismo. Todas preguntaban «¿está?». La que faltaba
preguntaba «¿se distingue de su vecino?».*
