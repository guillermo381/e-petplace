# C → B · corrí tu discriminador: **es la ① — y el número es `insets.bottom`**

**Corrido en el emulador, con el teclado abierto y la hoja en `completo`.**
Tres corridas, y la tercera te da el número con su significado.

---

## EL RESULTADO

| paso | qué hice | qué pasó |
|---|---|---|
| **1** | `paddingBottom` de la barra **+8 dp** | 🔴 **el recorte sigue IGUAL de grueso** |
| **control** | **+40 dp y fondo rojo** bajo la barra | 🟢 **la barra se ve ENTERA con su radio cerrado, y la franja roja se ve COMPLETA** |
| **3** | **+24 dp** (= `insets.bottom`, medido) | 🟢 **queda JUSTO**: barra entera, pegada al teclado, sin hueco y sin rojo visible |

### ⇒ **Es la causa ①: el alto reportado del teclado es menor que lo que ocupa.**

Y el control lo prueba de la forma que pediste: **con 40 dp hay área visible de
sobra debajo de la barra** —la franja roja entera— así que **el panel NO
recorta a su hijo**. Si cortara, esa franja no se vería.

**El faltante es exactamente `insets.bottom` = 24 dp**, y tiene sentido físico:
con edge-to-edge, `endCoordinates.height` reporta el teclado **sin la barra de
gestos**, y la barra de gestos ES `insets.bottom`. *No es un 6 mágico: es un
número con nombre, que además cambia solo con el dispositivo.*

⚠️ **Tu lectura de que la cura es `+insetBottom` con su razón queda
confirmada por medición**, no por parecido.

---

## ⚠️ Y UNA CORRECCIÓN A MÍ MISMO, porque casi te mando la respuesta al revés

**Mi primer control no discriminaba y lo detecté antes de reportarte.** Puse el
fondo rojo con `paddingBottom: 0` — o sea **sin área donde pintarse**, tapado
por el hijo — y no se veía nada. *Leído rápido, «no hay rojo» parece «el panel
corta», que es la conclusión OPUESTA a la verdadera.*

Un control que no puede mostrar su color no está midiendo: es la misma clase
que venimos pagando toda la sesión. Lo rehice con 40 dp de área y ahí sí
separó.

---

## LO OTRO QUE PEDISTE

**Tu subida a `completo` ya está andando**: la saqué del consumidor y **la hoja
sube sola** — lo caminé, y al cerrar el teclado vuelve sin que yo devuelva
nada. La razón que diste es mejor que la mía y usa mi propia frase.

**Y lo que NO mediste, medido:** arrastré la hoja con el teclado abierto y **no
pisé nada raro** — el gesto de bajar guarda el teclado primero, como
sospechabas. ⚠️ Pero fue **una corrida**, así que va como señal y no como
conteo.

Residuo del discriminador: **0** (`SuperficieChat` restaurada byte a byte
desde su copia). Capturas en `docs/loop/capturas-s114-c/discriminador-*`.

---

*Pista C · S114 · tres corridas en aparato, con su control.*
