# FICHAS `D-984` · `D-985` + LECCIÓN `L-440`
### S107-CERT · 30-ago-2026 — depositadas al cerrar la jornada

> Números verificados libres **POR GREP** contra `docs/` antes de numerar
> (tope real `D-983` · `L-439`; `L-714` sigue descartado por su propia ficha).
> **Control positivo corrido:** `D-983` → 4 ocurrencias, `D-984`/`D-985`/`L-440`
> → 0. *Un censo que devuelve vacío se prueba antes contra un caso con
> resultado conocido.*

---

# `L-440` — **PEOR QUE NO TENER VOZ ES TENER LA VOZ DE OTRO**

> ## Un código de error que el consumidor no reconoce no llega mudo: llega **disfrazado del genérico**. Y el genérico suele decir justo lo contrario de lo que pasó.

## El caso, medido el 30-ago

La edge `pagos-borrar-tarjeta` devolvía **doce** códigos. El wrapper que la
consume declaraba **ocho**, y su `includes` mandaba todo lo demás al fallback
`error_borrado`, cuya voz es:

> *«No pudimos borrarla. Prueba de nuevo en un momento.»*

Entre los cuatro que faltaban estaba **`tarjeta_con_plan_activo`** — el freno A′,
nacido dos días antes, que impide borrar la tarjeta que paga un plan de
guardería activo.

⇒ **Un freno que funcionó perfecto se habría leído como una falla transitoria**,
e invitaba a reintentar algo que **va a rebotar siempre**. *No es que faltara la
voz: es que hablaba la voz equivocada, y la equivocada era tranquilizadora.*

⚠️ **Y el costo estaba a punto de cobrarse en un gate.** El founder lo había
previsto al revés —*«va a mostrar un código sin texto; si sale un genérico, no es
que el freno falló»*— y habría interpretado como *«falta la voz»* algo que era
**«el código no llega»**. *Su hipótesis benigna habría tapado el defecto.*

## Por qué esta clase envejece en silencio, que es lo que la hace peligrosa

| | |
|---|---|
| **el que agrega el código** | escribe en la edge; **no ve** la lista del wrapper |
| **el que lee la lista** | ve ocho nombres plausibles y **no tiene con qué compararlos** |
| **el compilador** | **no cruza el borde de la red**: los dos lados compilan perfecto |
| **el gate** | verde: nada falla, sólo dice otra cosa |

> ### **Ningún typecheck cruza un cable.** Dos vocabularios que viven en dos
> archivos y se hablan por HTTP divergen en cuanto uno de los dos crece, y la
> divergencia **no produce un error: produce un mensaje.**

## La regla

**Todo mapa de códigos se re-mide contra su emisor cada vez que al emisor se le
agrega un rebote** — no se recuerda, se mide (`grep "codigo:"` sobre la edge).

Y su corolario, que es el que ordena el diseño: **el fallback de un mapa de
códigos no puede tener una voz que sugiera una acción.** *«Probá de nuevo» es una
instrucción; si el código real decía «esto no se puede», la instrucción es
falsa.* Un fallback honesto dice que algo salió mal y **no promete que reintentar
sirva.**

## 🔴 SU LUGAR EN EL DÍA — es la TERCERA versión de la misma clase

Las tres, el mismo día, y las tres sobre **rastros que no llegan**:

1. **`D-961`** — un alta que falla **no deja ningún rastro**: queda `pendiente`
   sin motivo, indistinguible de una en curso. *La pantalla decía un genérico
   tibio sobre algo que sí tenía explicación.*
2. **La voz de «ya la tenías»** — el motivo crudo del proveedor llegaba y **se
   descartaba** por no matchear exacto. Curado con matcheo tolerante **y
   fallback**, porque el texto del proveedor puede cambiar sin avisar.
3. **Esta** — el código llegaba entero y **el mapa lo tiraba**.

⇒ *No es que el sistema no supiera qué pasó: lo supo las tres veces, y las tres
veces la información murió en un borde distinto del mismo camino.* **El defecto
no está en ninguna de las tres piezas: está en que nadie mide los bordes.**

---

# `D-984` — 🟠 **¿CUÁNTOS MAPAS DE CÓDIGOS HAY EN LA CASA, Y CUÁNTOS ESTÁN AL DÍA?**

*(pregunta del founder, 30-ago, al leer la cura de `L-440`)*

> **«Si éste estaba viejo, no hay razón para pensar que es el único. Un mapa que
> envejece en silencio es exactamente lo que acabás de describir.»**

## Qué hay que medir — y NO se midió hoy, a propósito

Un censo, no una cura:

1. **Cuántos wrappers declaran un vocabulario cerrado de códigos** (la forma
   `const CODIGOS_* = [...] as const` + `includes` + fallback).
2. **Para cada uno, su emisor** — edge function o RPC — y **el diff de conjuntos
   en las dos direcciones**:
   · **códigos del emisor que el mapa NO tiene** ⇒ caen al genérico. **Ésta es
     `L-440` y es la que hace daño.**
   · **códigos del mapa que el emisor ya NO emite** ⇒ ramas muertas. Menos
     grave, pero *una rama que nunca corre es una rama que nadie prueba*.
3. 🔴 **Y por cada faltante, la pregunta que decide la gravedad: ¿QUÉ DICE el
   fallback?** *Un fallback que dice «algo salió mal» pierde información; uno que
   dice «probá de nuevo» **da una instrucción falsa**. Son dos severidades
   distintas y el censo tiene que separarlas.*

## Lo que ya se sabe sin correr el censo

- **El caso confirmado es 1 de 1 mirado**: el único mapa que se auditó estaba
  viejo. *No es una muestra — es que nunca se había mirado ninguno.*
- **El camino de pagos es el de mayor exposición**: sus rebotes deciden si
  alguien puede pagar, y su fallback típico invita a reintentar.

## Por qué no se cura con un tipo compartido, y hay que decirlo antes

La salida obvia —**un tipo en `packages/api` que las dos puntas importen**— **no
existe para las edges**: corren en Deno, se despliegan aparte y **no comparten
build con el monorepo**. *Un `import` no las une; sólo las uniría un generador o
un gate.*

⇒ **La cura probable es un gate**, hermano de `verify-edge-deno`: extraer los
`codigo:` de cada edge y contrastarlos con el `CODIGOS_*` de su wrapper.
⚠️ **Y con la trampa de esa familia declarada de antemano: el emparejamiento
edge↔wrapper hoy es por convención de nombre, no por dato.** *Un gate que no
encuentra el par de un wrapper daría verde sobre él* — que es exactamente
`L-437` (*un censo por patrón acota, no cierra*). **Tiene que declarar los
huérfanos, no saltearlos.**

**Dueño:** quien abra el próximo frente de pagos. **Disparo:** antes de agregar
un rebote nuevo a cualquier edge de plata.

---

# `D-985` — 🟡 **EL `onError` DEL WEBVIEW NO EXISTE, Y NO ES CABLEAR DOS HANDLERS**

*(desprendida del rastro de `D-961`; se ficha para que su tamaño real no se
vuelva a estimar de memoria)*

## El hueco

La página del alta (`apps/pagos-web`) se carga en un WebView **sin `onError` ni
`onHttpError`**. ⇒ **una carga fallida es invisible por diseño**: no hay rastro,
no hay voz, y el alta queda `pendiente` sin motivo — *el mismo desenlace que
`D-961` acaba de cerrar por el otro camino.*

## 🔴 POR QUÉ NO ES BARATO, medido

El rastro que habría que escribir **no tiene puerta abierta desde ahí**:

| | |
|---|---|
| la edge `pagos-alta-tarjeta` | **rebota sin `Origin`** — y el WebView que no cargó no tiene origen |
| la RPC `anotar_incidente_alta` | **`authenticated` NO la puede ejecutar** (medido: `false`) |

⇒ **Hay que abrir una puerta que está cerrada a propósito, de uno de los dos
lados.** *Cuál se abre es decisión de mesa, no de quien construye: las dos
aflojan un gate de seguridad para poder anotar un fallo.*

**Disparo:** la decisión de mesa sobre cuál puerta. **No antes** — construir el
handler sin destino sería `L-318` en su forma más cara: un motor sin puerta que
además parece resuelto.
