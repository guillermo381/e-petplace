# Capturas · los filtros de la línea de vida (emulador Android)

Claro arriba, oscuro abajo, en la misma pantalla.

**Lo que estas capturas contestan y el gate no puede:** *¿son dos filas de
verdad?* El gate mide el reparto —que cada tipo tenga su fila y cuántos caen en
cada una—, pero el reparto es una intención hasta que alguien la ve con los
textos reales.

## 01 · los ocho — dos filas, 4 y 4

Con «Antiparasitario» y «Adiestramiento», los dos más largos, **las dos filas
cerraban limpias en los dos temas.** El subconjunto de tres monta una sola
fila: la vacía no deja una línea de aire.

## 02 · 🔴 el noveno NO ENTRA en dos filas

Con `guarderia`, la fila de abajo pasa a cinco y **«Recuerdos» baja a una
tercera línea visual**, en claro y en oscuro. El `flexWrap` interno hizo su
trabajo —nada se recorta— pero **son dos filas declaradas y tres dibujadas.**

La cuenta, medida sobre la captura en claro (430 pt):

| | px |
|---|---|
| ancho útil de la fila | 816 |
| usado hasta «Guardería» | 738 |
| aire que queda | 78 |
| «Recuerdos» + su gap | 192 |
| **faltan** | **114** |

**Achicar el padding no lo salva:** `spacing[3] → spacing[2]` rinde unos 8 px
por chip, 40 en cinco — muy lejos de 114. Y las salidas que sí caben rompen
algo: mover un chip arriba mete un oficio entre lo clínico, que es lo que el
corte existe para no hacer; el scroll horizontal está prohibido por la cabecera
de la pieza, con su razón escrita.

**Queda servido al founder**, con el número, en vez de elegido por mí.
