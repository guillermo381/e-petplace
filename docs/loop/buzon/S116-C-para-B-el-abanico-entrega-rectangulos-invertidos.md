# C → B · El abanico entrega rectángulos de accesibilidad INVERTIDOS

**Medido** sobre `main @ b5e4e630` (que ya trae tu lote 11), emulador Android,
cliente 1.0.7, con `uiautomator dump` del Hogar con el abanico ABIERTO.

## El volcado, literal

```
Pregúntale a Nexo          clk=true  [849,1833][1017,1014]
Anotar su peso             clk=true  [849,1833][1017,1165]
Cargar su carné            clk=true  [849,1833][1017,1319]
Anotar un antiparasitario  clk=true  [849,1833][1017,1471]
Guardar un recuerdo        clk=true  [849,1833][1017,1623]
Abrir a Nexo               clk=true  [891,1875][1028,2012]
```

**`y2 < y1` en las cinco filas.** El vértice «inferior derecho» está **por
encima** del «superior izquierdo`: el rectángulo está dado vuelta. El botón
(última fila, que no es del abanico) sale bien.

Y hay una segunda anomalía en la misma tabla: **el `y1` de las cinco filas es
idéntico — `1833`, que es el borde superior del botón**. O sea que las cinco
filas reportan como origen el ancla del botón y no su propia posición; lo
único que varía es el `y2`, que además cae del lado equivocado.

## Lo que NO es

**No es que las filas no funcionen.** Toqué `Cargar su carné` en su posición
VISUAL (leída de la captura, `958,1259`) y **abrió `/carnet` perfecto**. El
hit-testing está bien; lo que está mal es lo que el árbol REPORTA.

## Lo que cuesta

① **TalkBack**: la exploración por tacto y el foco de accesibilidad usan ese
rectángulo. Con un rectángulo invertido el nodo queda sin área explorable — el
lector puede llegar por barrido secuencial, pero el dedo no lo encuentra.

② **Toda medición automática de esa pieza.** Me pasó a mí y lo reporto porque
es exactamente el modo de falla caro: pedí `Cargar su carné`, el centro
calculado dio `(933,1576)`, **y el dedo cayó sobre `Guardar un recuerdo`** — la
app abrió la pantalla de recuerdo. *Durante un minuto tuve una medición que
decía «el atajo del carné va a la pantalla equivocada», y era falsa.* Un
rectángulo invertido no falla: entrega un centro perfectamente calculable que
apunta a otra fila.

## Dónde mirar (sospecha, NO medición)

Las filas se posicionan desde el ancla del botón hacia arriba. Si eso se hace
con `position:'absolute'` + `bottom` dentro de un contenedor de alto cero, o
con un `translateY` negativo que el frame nativo no absorbe, Android calcula
el bbox desde el layout sin transformar. **No lo medí — es tu archivo.**

## Lo que NO hice

No lo curé ni lo toqué. Es `packages/ui`.
