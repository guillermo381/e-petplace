# Capturas S113-B · 2.2 «El perfil como tablero»

Receta: `ARRANQUE8 20:57:16` → `Android Bundled 8022ms (2997 modules)` 20:57:49,
`adb -s emulator-5554`, deep link con el **`&` escapado**, captura y volcado
juntos, y cada pantalla con su control de modo. Sonda **retirada** y verificada.

## 🔴 Dos defectos que sólo se ven mirando, y ningún gate veía

**① El orbe de «Hoy» se dibujaba ENCIMA del texto.** `OrbeCoach` pinta sus
capas en `position:'absolute'`: **sin una caja de tamaño fijo colapsa a 0 en el
flujo** y aparece sobre lo que sigue. En `FilaAcciones` no pasaba porque ahí
vive dentro de un disco de 48 — *una pieza que no ocupa lugar propio no se nota
rota hasta que tiene un vecino.*

**② Los chips del antiparasitario salían cortados y encimados** («garrapat…»).
Estaban al lado del dato, y *un gráfico ocupa lo que se le da; una tira de
palabras ocupa lo que necesita, y en media columna no entra.* Ahora van debajo,
a todo el ancho, y sólo ellos: los otros tres dibujos siguen a la derecha.

El antes es `01-tablero-claro`; el después, `despues-tablero-*`.

## Lo que las capturas prueban

**🟢 Sin dato no hay gráfico ni cero:** *Medicación* dice «Sin registro» **en
apoyo**, no en display — y no dibuja nada. *Citas* recibe una serie de un solo
punto y **no dibuja línea**: una recta de un punto diría «estable», que nadie
afirmó.

**🟢 La v2 punteada anuncia sin prometer**, y **no se puede tocar**: no es un
botón apagado, es una tarjeta que no es un botón.

**🟢 El anillo de «Conociéndolo» no tiene número.** La voz lo dice
—*«Ya conocemos a Thor casi como vos»*— y la fracción **entra sólo como
geometría**: el tipo no la deja llegar a un `Texto` (`MODELO_LOYALTY` §3).

**🟢 «Pasaporte» está atenuado y dice por qué al tocarlo** — no es un disco
gris y mudo.

**🟢 En memorial** (`03`) las tarjetas de dato **quedan** y pierden su dibujo;
el «Hoy», «Conociéndolo» y la acción de Nexo **no se dibujan**. *El dato de una
vida que terminó sigue siendo cierto; lo que se apaga es lo que empuja a
actuar.*

## 🔴 B6 · el tercer defecto que sólo se ve mirando: **medio par de color**

Receta del B6: Metro **en el puerto propio de B (8092)** — `ARRANQUE_B 21:12:17`
→ `Android Bundled 12479ms (2998 modules)` **21:12:40**, `adb -s emulator-5554`,
control de modo en la pantalla, sonda retirada y `git status --porcelain apps/`
vacío.

**La franja de seguridad quedaba ILEGIBLE en memorial**, y el número lo dice:

| tema | fondo | tinta | contraste |
|---|---|---|---|
| claro | `(250,246,232)` | `(29,26,46)` | **15.66:1** |
| memorial **antes** | `(250,246,232)` | `(232,220,200)` | **1.25:1** |
| memorial **curado** | `(250,246,232)` | `(42,42,31)` | **13.39:1** |

**La causa no era el tema: era la pieza usando MEDIO PAR.** `bg.warm` es un
papel **claro en los tres temas** y `text.warm` es su tinta; en memorial la
tinta *del tema* es clara —para fondo oscuro—, así que pintar el fondo cálido y
escribir con la default deja la letra encima de sí misma. *En claro y en oscuro
se ve perfecto: dos de los tres temas tapan el defecto, y por eso ningún ojo lo
caza.*

**⚠️ Y el instrumento estaba bien todo el tiempo.** `verify:contrast` declara
`text.warm / bg.warm` desde hace sesiones y **estaba verde con razón**: medía el
par correcto. *Un gate de pares no puede ver qué token PINTA una pieza* — por
eso el `⑭` nuevo mide eso, sobre **todas** las piezas del archivo y no sobre la
mía: el día que otra pinte `bg.warm` la va a medir sola.

**Y faltaba la puerta:** `text.warm` existe en los tres temas desde S43-B2
—donde se curó **esta misma clase**, con un `1.00:1` anotado en el comentario—
y **`TextoColor` no lo ofrecía**. *La mitad del par tenía motor y no tenía
puerta* (`L-318`), así que la única forma de pintar ese fondo era usarlo mal.

## Lo que prueba el B6

**🟢 El hero pasa de ~340 a ~120 de alto** y sigue presidiendo: retrato a la
izquierda en la escala de la casa (`lg`), nombre y meta al lado.
⏪ Acá hubo un `RETRATO = 88` exportado y **era un número inventado** —
`AvatarMascota` va por nombres (`md` 64, `lg` 96) y 88 no existe en esa escala.
*Una pieza que nombra su propio tamaño abre una segunda escala que compite con
la de la casa.*

**🟢 La franja resume en UNA línea** con su «Ver 3» y el chevron en la misma
fila. El truncado acá **sí** va —y es lo contrario del «Contanos»—: *este texto
es un resumen y su contenido entero está a un toque en el mismo lugar; aquél era
una invitación cuyo verbo se comía el corte.*

**🟢 En memorial el hero se dibuja y la pastilla no.** *Quién fue no se apaga;
lo que no tiene sentido es reportar un cuidado al día.*

## El índice

| archivo | qué prueba |
|---|---|
| `01/02-tablero` | el tablero entero — **antes** de las dos curas |
| `03-tablero-memorial` | qué queda y qué se apaga |
| `04/05-peso` | la serie con punto lleno (clínica) y hueco (casa), y su tabla |
| `despues-tablero-*` | el **después**: orbe en su caja, chips completos |
| `06/07/08-hero-franja-*` | **B6** en los tres temas — hero compacto, franja de una línea, y el par cálido curado |
