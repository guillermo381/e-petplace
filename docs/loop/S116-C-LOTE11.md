# S116-C · LOTE 11 — el parte

**CAPTURAS: `docs/loop/capturas-s116-c-lote11/`**

Rama `pista/s116-c-05` · sobre `origin/main @ ba205d8d` (el lote 13 de B, traído
en este lote). Aparato: AVD propio `s114_C` (`emulator-5578`), **barra de tres
botones**, cliente 1.0.7, bundle fresco.

**Gates:** `tsc apps/cliente` **0** · `verify:diseno` **VERDE, 81 reglas**.

---

## LA TABLA

| # | qué | captura | estado |
|---|---|---|---|
| 1 | la fila pareja de la Despensa | `p1-despensa-fila-pareja.png` · `p1b-fila-nombres-dispares.png` | ✅ medido |
| 2 | 03 sin teclado / con teclado | `p2-03-onda-sin-teclado.png` · `p2b-03-onda-con-teclado.png` | ✅ medido |
| 3 | 05 sin teclado / con teclado | `p3-05-onda-sin-teclado.png` · `p3b-05-onda-con-teclado.png` | ✅ medido |
| 🔴 | **las dos flechas de volver murieron otra vez** | (el árbol, en el buzón) | **regresión de `packages/ui`, contesta `D-1118`** |

---

## ① LA FILA PAREJA — y `estira` era la palabra que faltaba

**Aplicado:** `<Entrada estira orden={…}>` en `grillaProductos`, que es
literalmente lo que B pidió.

**El par exacto del defecto que reporté en el lote 10, re-medido:**

| | lote 10 | ahora |
|---|---|---|
| Advantage Perros 25-40 kg (con «Agregar») | **978** | **978** |
| Advantage Perros 4-10 kg («Sin stock») | **868** | **978** |

**`p1-despensa-fila-pareja.png`** — la de «Sin stock» ya no termina antes: su
bloque de precio baja y los dos pies quedan a ras. En la fila de arriba, las dos
con botón, los dos «Agregar» caen en **`y=871..960`, el mismo píxel**.

**`p1b-fila-nombres-dispares.png`** — «Adulto Razas Medianas Grandes» (**2
líneas**) junto a «Adulto Small Breed» (**1 línea**): **1017 y 1017**, y los dos
«Agregar» en **`y=1947..2036`**. La de nombre corto reparte el sobrante como aire
sobre el precio, que es lo que tiene que hacer.

⚠️ **«Tres líneas» no es expresable, y lo mido en vez de fingir que lo probé:**
`TarjetaProducto:558` pinta el nombre con **`numberOfLines={2}`**. El caso extremo
que la pieza permite es **1 contra 2**, y ése es el que está capturado. *Si la
mesa quiere tres, es una línea de la pieza y es de B.*

**Y una corrección a mi propio lote 10**, porque importa para el próximo censo:
yo medí que la celda se estira y la tarjeta no la llena, y localicé **UN** corte
(`Entrada`). **Eran DOS.** El otro vive en `TarjetaProducto`, en el
`Animated.View` de `usePresionado` — *ese eslabón lo pone la primitiva de
presión, no el autor de la tarjeta: es invisible al leer la pieza.* Lo encontró
B. **Mi medición era correcta y mi censo estaba incompleto.**

---

## ② y ③ LA ONDA, CON NÚMEROS Y NO CON ADJETIVOS

Mi envoltorio absoluto del lote 10 **murió**: B se llevó la geometría adentro de
la pieza, y **un absoluto se ancla al padding box de su padre** ⇒ mi `View`
(alto 0) habría vuelto a ser el ancla. Ahora se monta pelada, hermana de la hoja.
Con eso **muere también mi excepción de `R53`, esta vez de verdad**: ya no hay
ningún `absolute + bottom:0` escrito por esas pantallas. *Lo escribí dos veces
—en el 3i y en el 10— y las dos fue falso.*

**Sin teclado — borde a borde, medido en los píxeles físicos:**

```
03 · y=2100 · x=0 (209,7,136)   x=1079 (209,7,136)
03 · y=2270 · x=0 (209,7,136)   x=1079 (209,7,136)
05 · y=2100 · x=0 (209,7,136)   x=1079 (209,7,136)
```

Las dos columnas extremas de la pantalla, en tres filas distintas: **magenta
puro**. Cero margen.

**Los CTA, enteros sobre la ola:** 03 → «Entrar» y el botón de Google completos
sin scroll. 05 → con la hoja al fondo, «Crear mi cuenta», Google, los legales y
«Ya tengo cuenta», los cuatro.

**Con teclado — cero magenta, contado y no mirado:** barrí las dos capturas
muestreando cada 7 px y busqué el magenta de la onda (`#D10788`):

```
p2b-03-onda-con-teclado.png   magenta = 0 px
p3b-05-onda-con-teclado.png   magenta = 0 px
```

### ⚠️ «Hasta el piso»: llega, y lo que se ve encima es del sistema

Los últimos **126 px (42 dp)** no se leen magenta sino `(250,231,243)`. **No es
que la onda se quede corta — es la franja de contraste que Android pinta sobre la
barra de tres botones**, y la aritmética lo dice sola:

```
magenta (209,7,136) mezclado con blanco a α:
   209 + (255-209)·α = 250  ⇒ α = 0,89
     7 + (255-  7)·α = 231  ⇒ α = 0,90
   136 + (255-136)·α = 243  ⇒ α = 0,90
```

**Los tres canales dan el mismo α.** Un velo blanco al 90 % explica los tres a la
vez; una coincidencia en tres canales no.

**Y el control lo confirma:** en la Despensa, donde lo que hay bajo la barra es el
blanco del tab bar, esa misma franja mide **(255,255,255)** — blanco puro, o sea
que **la app SÍ dibuja debajo de la barra** y lo que cambia es sólo lo que hay
abajo. *Si la app no pintara ahí, las dos pantallas tendrían el mismo color de
fondo en esa franja, y no lo tienen.*

⇒ **apagarlo es `navigationBarContrastEnforced`, config nativa: cambia TODAS las
pantallas y exige build.** No lo toco; queda medido para que la mesa decida.

---

## 🔴 LAS DOS FLECHAS DE VOLVER MURIERON OTRA VEZ — y esto contesta `D-1118`

A abrió `D-1118` al mergear el lote 13, con la pregunta exacta:

> *«Si el `zIndex` de Android reordena también el despacho de toques, la flecha
> de volver vuelve a morir — y eso lo dice un aparato, no una lectura.»*

**Lo dijo el aparato.** Toqué el centro del nodo `Volver` en 03 y en 05 (crudo y
por texto, cinco lecturas a 1,2 s cada una): **ninguna de las dos navega.** El
«atrás» de Android sí — o sea que la navegación está sana y **lo que no llega es
el toque**.

**La causa es la misma de `D-1113` (mi lote 7):** el `ScrollView` de
`HojaContenido` cubre la pantalla entera. Entonces se curó poniendo `fondo`
DESPUÉS del scroll; el `zIndex: 1` del lote 13 **gana sobre el orden del árbol** y
el scroll vuelve arriba. *La cura de pintado y la cura de toque se pisan porque
son la misma capa.*

⚠️ **Y hay un hallazgo de instrumento dentro:** el volcado de accesibilidad
muestra el botón `Volver` como **el último nodo del punto** —o sea arriba— y el
toque igual no le llega. *Un árbol que muestra el nodo correcto arriba no prueba
que ese nodo reciba el toque.* Es la segunda vez en dos lotes que el volcado dice
una cosa y el dedo otra.

**NO lo curé, y no por comodidad: las dos salidas obvias rompen la otra mitad** —
`zIndex: 2` en el fondo devuelve el toque **y pinta la `Cabecera` encima de la
hoja**; quitar el `zIndex` del scroll devuelve el defecto que el founder le
reportó a B. La salida está adentro de esa pieza y es de B. Va al buzón con el
volcado, el alcance y una propuesta:
`docs/loop/buzon/S116-C-para-B-el-zindex-mato-las-flechas.md`.

**Alcance, para dimensionarlo:** toda pantalla con algo tocable en `fondo` —hoy
`login`, `registro` y `recuperar`, **que son la puerta de entrada al producto**.

---

## LO QUE NO HICE

· **Curar las flechas** — `packages/ui`, con las dos salidas obvias descartadas y
  la razón de cada una. Al buzón.
· **Apagar el velo de la barra de navegación** — config nativa, toca todas las
  pantallas, exige build.
· **Forzar tres líneas de nombre** — la pieza las capa en dos (`:558`).
