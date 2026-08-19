# GATE A CUATRO MANOS — S100d·bis · el founder mira, B maneja

> **Decisión del founder:** el gate se hace ACOMPAÑADO. *«Ella puede ver cosas
> que yo no noto, y yo cosas que ella no ve.»* **B mide lo que él siente; él
> siente lo que B no puede medir.**
>
> 🔴 **Este archivo se escribe A MEDIDA, no al final.** Lo que viva solo en el
> chat se pierde si la sesión se compacta — **y el acta es la fuente de la
> vuelta siguiente.**

## ⓪ EL OBJETO — verificado ANTES de tocar nada (paso ①)

**Se verifican DOS cosas, no una. Hoy nos costó una vuelta entera confundirlas:**

| qué | medido |
|---|---|
| **qué app está instalada** | **119 MB ⇒ PREVIEW** (dev build ~248) |
| **qué bundle corre** | `update 01a01807-7afa-7d35-b21c-fab983cb3e9f · embedded=false · preview` |
| a qué publicación pertenece | group **`758baa31`** · ancla **`42dadfab`** · las cuatro ramas contenidas |

⚠️ **Por qué las dos:** a las 19:16 leí `01a0175e` correctamente y **a las 20:12
la app dejó de ser ésa** (el dev build de D la reemplazó). *Un positivo propio,
medido con las propias manos, es el que menos se vuelve a mirar — y es donde
entra.* **El paso ① no vale para toda la sesión: vale hasta que algo lo
invalide, y nada avisa cuando eso pasa.**

## LOS TRES AVISOS DADOS AL FOUNDER ANTES DE EMPEZAR

1. 🔴 **El fondo cambia TODAS las pantallas de las DOS apps**, incluidas decenas
   que ninguna pista tocó. **Si algo se ve raro en una superficie que nadie
   tocó, la primera sospecha es el fondo, no una regresión.**
   ✅ **Y es barato de ajustar:** `palette.ts` — `papelTapiz` (:294) y
   `papelTapizOficio` (:261). **Un valor y una corrida, no una vuelta.**
2. **El Hogar dice 12 y «Tus pedidos» perdió cuatro tarjetas** — es la cura de
   la fuga entre cuentas, no una regresión. Entre las que se van hay **una sin
   miniatura**, que era uno de los pocos ejemplares vivos de ese fallback.
3. **«Está tardando más de lo previsto» va a salir casi siempre** — 27 de 30
   pedidos con la ventana vencida (tráfico de prueba viejo). ⚠️ **Y el umbral de
   20 min NO está calibrado contra comportamiento:** sale del 8 % de la ventana
   más angosta, porque **hay UNA sola entrega con ventana en toda la base** y
   llegó 20 h antes. *Es un supuesto, no una medición.*

## LAS DOS CATEGORÍAS — no se mezclan en el veredicto

| **VISTO EN APARATO** | **CONSTRUIDO SIN OJO** |
|---|---|
| EN CAMINO entera (24①②③④) · la escalera (23) · la ficha del repartidor (25) · pedidos en el Hogar (30) · los tres topes · el scroll de la hoja · el chip magenta · el campo tipeable de la ficha | **todo lo de B de esta tanda**: el fondo · el stepper en su 4ª forma · el flotante en el shell · los headers · el arbitraje de gestos · la tira · el título · **y** Pedidos reestructurado · el canal de adquisición · la ventana vencida |

---

# ① LA PASADA DEL FONDO — solo el fondo, sin opinar de nada más

> **Orden del founder:** es lo de mayor alcance y **tiñe el juicio de todo lo
> demás**, así que se mira solo, primero.

*(se completa durante el recorrido)*

| pantalla | qué vio el founder (literal) | qué vio/midió B | veredicto |
|---|---|---|---|
| Hogar | *(pendiente)* | **fondo `246,246,246` = `#F6F6F6` exacto · carta `255,255,255`** — capura calibrada contra la carta blanca | — |

⚠️ **UN ERROR MÍO, CAZADO ANTES DE MOSTRARLO COMO BUENO:** mi primera muestra
dio **`238-240`** y estuve a un paso de reportar que el fondo no era el firmado.
**El muestreo estaba mal, no el color:** los puntos caían en los **bordes** de la
pantalla, donde viven las sombras de las cartas. *Calibrar contra un blanco
conocido —la carta a `255` exacto— es lo que probó que la captura era fiel.*
**Una muestra tomada en el lugar equivocado no da un número equivocado: da el
número correcto de otra cosa.**

---

# ② EL RECORRIDO, punto por punto

*(se completa durante el recorrido — cada hallazgo con su número del gate,
quién lo vio (**F** / **B** / **los dos**) y el literal del founder)*

| # | punto | veredicto | quién | literal |
|---|---|---|---|---|
| — | **la tira de presentaciones** (rojo posterior al corte) | ✅ **CERRADO CON OJO** | C, en aparato | los tres chips **−48 px** con el arrastre horizontal · contra-caso vertical 1251→680 · *«se movió TODO lo que había»* |
| — | **H-205** (el título repetido) | ✅ **CERRADO CON OJO** | C, en aparato | *«el nombre aparece una sola vez»* · el nodo del lector conservado |
| — | la carta blanca sobre `#F6F6F6` | ✅ visto | C | se lee como superficie, no como parche |

## 🔴 LA TRAMPA QUE C CAZÓ Y QUE CASI INVIERTE UN VEREDICTO

**Su primer arrastre fue `900 → 200` y la app NAVEGÓ a «Tus pedidos»:** el gesto
arrancó a **180 px del borde derecho**, dentro de la **zona del «atrás» de
Android**, y se lo comió el sistema.

> **Si se hubiera quedado con esa corrida, el volcado decía «la tira no se
> movió» —y era CIERTO— y el reporte habría sido «la cura de B falló».** *No
> habría sido un error de lectura: el número era correcto y contestaba otra
> pregunta.*

**Lo cazó que LA PANTALLA HABÍA CAMBIADO, no la posición de los chips.** ⇒ el
instrumento gana un guard: **todo arrastre verifica que sigue en la misma
pantalla antes de creerle a su Δ.**

⚠️ **Es la CUARTA vez en la jornada que el instrumento produce el rojo que uno
temía** (la paráfrasis de la voz · el selector viejo · el `goto` que reiniciaba
el carrito · el borde). **Cuatro formas distintas de lo mismo: el aparato midió
bien y la pregunta estaba mal.**

---

# ③ LA MICROANIMACIÓN DEL STEPPER — el juicio que B no puede dar

**No se pudo filmar:** cada `screencap` del aparato tarda ~400 ms y la
transición dura menos; se dispararon seis cuadros seguidos y **los seis salieron
en el mismo estado**. No hay `ffmpeg` en la máquina.

**Lo que sí está medido es la CONDICIÓN que la hace posible** —que los dos
estados ocupen la misma caja (Laika: botón 130,8×28,8 · control 129,0×27,4)—
**no que se vea bien.** *Con cajas distintas no hay transformación: hay
reemplazo.*

⇒ **veredicto del founder:** *(pendiente)*

---

# ⚠️ LO QUE NO SE PUEDE CERRAR EN ESTE OBJETO

*(se completa)*
