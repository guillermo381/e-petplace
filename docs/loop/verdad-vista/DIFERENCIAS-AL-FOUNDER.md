# Las dos manos, por número de fila — lo que hay que arbitrar

> Producido por E con `scripts/ia/diferencias-por-fila.mjs`. Empareja por
> **número de fila** y no por nombre, y resuelve dos alias de campo. Los dos
> leímos en el mismo orden, así que la fila `n` es la misma fila para los dos.

**Por qué no alcanzaba el cotejo por nombre** (`cotejar-verdad.mjs`, de D):
① **alias de campo** — D escribe `lote_visible`, E escribe `lote`; el cotejo
compara `lote` ⇒ **todos los lotes de D salían `null`** y aparecían como
desacuerdo. ② **granularidad del nombre** — «Peek'o» vs «Peek» ⇒ los lee como
filas distintas. Con eso, su salida sobre estos archivos era casi puro ruido:
reportaba 14 puntos, y 7 de ellos eran el campo `confianza`, que D no usa.

---

## Documento A — `carnet-1783564367515.jpg`

### ✅ Los dos contamos **15 filas**, y hay **CERO contradicciones**

Ninguna fila tiene a los dos leyendo y diciendo cosas distintas. Las
diferencias son **complementarias**: uno leyó algo que el otro no pudo.

| | |
|---|---|
| **sólo D lo leyó** | lotes de las filas **4** (`46559A`), **11** (`350918`), **13** (`35099A`), **14** (`46067A`), **15** (`185191`) |
| **sólo E lo leyó** | vencimientos de las filas **2** (`OCT/21`) y **6** (`MAY/23`) |
| nombre escrito distinto | filas 4, 11, 15 — no es desacuerdo de lectura |

**Fila 11 es la única que merece el ojo:** D lee «Recombitek (sticker beige)»
con lote `350918`; yo dije **«sticker no identificable»** y lote `null`. *Los
dos vimos la fila y su fecha; lo que cambia es si el producto se puede nombrar.*

### 🔴 Y lo que este documento decide, más allá del arbitraje

**La base tiene UNA fila aceptada y el carnet tiene QUINCE — y los dos lo
contamos igual, por separado.** Cuando el extractor devolvió 12, **no estaba
inventando: estaba acertando**, y la verdad de aceptación era la equivocada.

⇒ **el caso «1 → 12» no es un caso de invención.** Todo número de invención
calculado contra la verdad de aceptación de este carnet estaba midiendo el
error del expediente, no el del modelo.

---

## Documento B — el carnet plegable (4 fotos según D, **7 según E**)

### 🔴 Los conteos NO coinciden: **D = 8 · E = 7**

Es exactamente la duda que declaré antes de ver su archivo. D separa **Canigen
LR** y **Canigen MHA₂PPi** en dos filas (su fila 7 y su fila 8, con la **misma
fecha `2024-07-06` y el mismo lote `9B2F`**); yo las conté como **una sola
aplicación** por compartir lote.

**Es la pregunta a firmar: dos stickers Virbac con el mismo lote, ¿una dosis o
dos?** No la decidimos ninguno de los dos — yo la dejé escrita en
`lo_que_NO_pude_leer` y él la resolvió partiendo. *(Y mi octavo valor manuscrito
sin asignar, el `15/JUL`, sigue sin dueño: no es la fila 8 de D, porque la suya
tiene fecha 06-07-2024.)*

### Las 8 «contradicciones» son en su mayoría de FORMATO, no de lectura

| filas | campo | D | E | qué es |
|---|---|---|---|---|
| 1, 2, 3 | vencimiento | `2024-04-25` · `2024-09-04` · `2024-03-03` | `25APR24` · `04 SEP 24` · `03/MAR/24` | **el mismo dato**: él normaliza a ISO, yo dejo el literal impreso |
| **5** | vencimiento | `2024-05-31` | `05-2024` | 🔴 **diferencia real**: el sticker imprime **sólo mes-año**; el día 31 no está escrito |
| 4, 5, 6, 7 | `evidencia` | `sticker_con_fecha` | `manuscrito` | 🔴 **el vocabulario es ambiguo** — abajo |

### 🔴 `evidencia`: dos lectores cuidadosos, 4 a 0

En este carnet el **sticker no trae la fecha de aplicación** (sólo la validez
del frasco): la fecha está **escrita a mano** en la columna FECHA, al costado.
D lo llamó `sticker_con_fecha`; yo `manuscrito`. **Ninguno de los dos está
distraído: el vocabulario no distingue este caso.**

**Consecuencia para la matriz:** el prompt v2 le pide al modelo que emita
`evidencia`. **Si dos humanos que leen el mismo carnet con la misma regla se
parten 4 a 0, puntuar al modelo en ese campo es puntuarlo contra una moneda al
aire.** ⇒ en la tabla que sigue, `evidencia` se reporta **descriptivo y NO se
puntúa**, y se declara por qué.

---

## Lo que hay que firmar

1. **Documento B: ¿Canigen LR + MHA₂PPi con el mismo lote son una dosis o dos?**
   (decide si la verdad de B tiene 7 u 8 filas)
2. **Documento B fila 5: ¿el vencimiento es `05-2024` o `2024-05-31`?**
   (o sea: ¿se completa el día cuando el sticker no lo imprime?)
3. **Documento A fila 11: ¿el producto se puede nombrar «Recombitek» o queda ilegible?**
4. **El vocabulario de `evidencia`**: sticker sin fecha + fecha manuscrita al
   costado, ¿qué es?
5. **Documento B: el `15/JUL` sin fila.** Ninguna de las dos manos lo asignó.
