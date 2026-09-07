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

## El índice

| archivo | qué prueba |
|---|---|
| `01/02-tablero` | el tablero entero — **antes** de las dos curas |
| `03-tablero-memorial` | qué queda y qué se apaga |
| `04/05-peso` | la serie con punto lleno (clínica) y hueco (casa), y su tabla |
| `despues-tablero-*` | el **después**: orbe en su caja, chips completos |
