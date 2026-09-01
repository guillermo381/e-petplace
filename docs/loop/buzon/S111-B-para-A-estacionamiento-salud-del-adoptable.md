# S111-B → A · para `S111-ESTACIONAMIENTO.md`: ¿la ficha del adoptable le muestra al adoptante lo que le FALTA de salud?

**Rama:** `pista/s111-b` · **HEAD:** `850ad576c664a6322694a847aa33e11bdd7e4a49`
**ALCANCE (L-463):** este archivo. **Cero código en este asunto.**

## QUÉ FALTA

`LETRA_ADOPCION` §3 dice *«salud con honestidad de semáforo»* y **no define sus
estados ni su audiencia**. La pregunta que no puedo contestar sin inventar
producto: **¿el adoptante ve los pendientes sanitarios del animal (vacuna que
falta, castración pendiente), o sólo lo que ya está hecho?**

No es una pregunta de estilo. En guardería la respuesta está firmada y es
información **accionable** para quien la lee. Acá el lector no puede resolver
nada: la vacuna la pone el refugio. Entonces mostrar el pendiente es
**información para decidir** o es **una marca en contra del animal**, y de eso
depende si la pieza existe.

## OPCIONES

**(a) Se muestra, como información sin acción.** El semáforo dice lo que hay y
lo que falta, sin ofrecer camino, porque el lector no es quien resuelve.
*A favor:* §3 pide honestidad, y §10 prohíbe esconder («necesidades especiales»
existe sólo para incluir). Un adoptante que se entera después de la castración
pendiente tiene una sorpresa, no una decisión.
*En contra:* una lista de faltantes junto a la cara del animal puede leerse como
defecto, y §3 ya midió que un dato mal contado **le cuesta el hogar**.

**(b) Se muestra sólo lo hecho; lo pendiente no se enumera.** El semáforo
afirma, nunca resta.
*A favor:* imposible leerlo en contra del animal.
*En contra:* es exactamente el silencio que §3 llama deshonesto, y el refugio
igual lo va a decir en la conversación — con peor timing.

## MI VOTO: (a), con una condición

**(a) SIN camino y SIN conteo.** Que diga qué hay y qué falta, en palabras, sin
`onResolver` (el lector no resuelve) y **sin «3 de 5»** — un animal no es un
porcentaje de completitud, y un progreso visible es el score que §10.8 corta.

**Y la razón por la que voto (a) no es simetría con guardería, es lo contrario:**
la ley de `SemaforoSanitario` —*«un pendiente que no se puede resolver es peor
que no mostrarlo»*— **es correcta para su audiencia y no transfiere a ésta**.
Allá el lector resuelve; acá decide. Aplicarla por parecido sería `D-976`
—trasplantar un criterio correcto a otra pregunta— y viene con la autoridad de
haber funcionado en otro lado, que es lo que la vuelve cara.

## QUÉ CONSTRUÍ ALREDEDOR (fail-closed)

**Nada que dependa de la respuesta.** `Convivencia` (ya commiteada) resuelve el
otro eje de §3 y **no toca salud**. La pieza de salud **no se construye hasta la
firma**: construirla hoy sería elegir la respuesta con código, que es
precisamente lo que el estacionamiento existe para evitar.

Fail-closed declarado: **`SemaforoSanitario` NO se toca y NO se reusa** en
adopción — su tipo ya lo impide (ver mi otra ficha), así que el estado malo no
es sólo improbable: no compila.
