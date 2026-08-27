# S106 · PISTA B · CIERRE — lo que la próxima sesión necesita

**27-ago-2026 · rama `pista/s106-b5` desde `origin/main` = `7958fb09`, en origin
verificada por SHA.** Territorio: `packages/ui` + instrumentos.

---

## 🔴 ANTES QUE NADA: UN ÍTEM DEL PEDIDO DE CIERRE NO EXISTE DE MI LADO

El pedido incluye *«la ficha del voseo con sus tres hipótesis de origen y su
disparo»*. **No la tengo, no la escribí, y no la voy a reconstruir.**

**Medido antes de decirlo** (grep sobre `docs/loop/S106-*` y
`DEUDAS_CANONICAS.md`): **el voseo de S106 no es de B.**

| qué | de quién |
|---|---|
| baseline de `R66` y las 4 cadenas en voseo que `R66` le cazó | **C** (`S106-C.md:90` y `:572`) |
| los 160 voseos de `packages/api` curados | **A** (S105) |
| la cura de `lib-voz.mjs` que tapó el agujero de `R66` | **A** (`69fb7377`) |
| **lo único mío**: re-verificar esa cura en las dos direcciones | B (`S106-B.md:89`) |

**Lo mío, entero, es esto y no da para una ficha:** re-medí la cura de A en vez
de citarla — `notás` → HIT · `llevala` → HIT · `creés` → HIT · **el §3 en tuteo
completo → vacío, cero falso positivo.** *Antes de esa cura, el §3 no podía
pasar `R66` y `R67` al mismo tiempo sin que uno de los dos mintiera.*

⇒ **si la ficha hace falta, el pedido va a C o a A con su literal.** *Escribir
tres hipótesis de origen que nadie midió, en el archivo donde la próxima sesión
va a buscar por qué existe una deuda, es exactamente el defecto que esta casa
paga cuando una letra viaja por referencia y no por texto.*

---

## ① `R68` — verde, con su fixture del caso real

**Nace de tres crashes de la misma familia:** un worklet de gesto llamando
código del componente. La regla mide **cualquier llamada a algo del componente
dentro de un worklet de gesto**, no el caso puntual.

**Sus tres exenciones, medidas contra el código vivo:** `.runOnJS(true)` en la
cadena · funciones que declaran `'worklet'` · `scheduleOnRN` y palabras clave.

🔴 **Y su defecto propio, que lo cazó su auto-prueba:** la primera versión usaba
`(^|[^\w$.])`, que **consume** el carácter previo — después de casar `runOnJS(`
el índice quedaba sobre `masCercana(` sin carácter delante, así que **la regla
no podía ver el argumento que la hizo nacer**. Curado con lookbehind real.

> *Un guard que falla contra su propio caso testigo no es un guard: es una regla
> que devuelve verde.*

**`verify:diseno`: VERDE, 59 reglas.**

---

## ② La colisión de siluetas — **veredicto (b)**, con instrumento

Depósito completo: `docs/relevamientos/2026-08-27-s106b-RESPUESTA-colision-de-siluetas.md`.
Instrumento: **`scripts/medir-siluetas.mjs`** + `scripts/siluetas/entrada.tsx`.

**Se puede a medias. La mitad que no se puede es la ② del encargo de A:**
*«convivir en una fila» no es derivable del JSX* —exige evaluar envoltorios,
condicionales y props de otro archivo: es un analizador de React, no un guard—
⇒ **la fila se DECLARA.** *El instrumento mide bien lo que se le declara y **no
sabe lo que no se le declaró**: si alguien agrega un sexto control y no toca ese
archivo, el verde es cierto e incompleto.* Escrito para que nadie lo lea como
cobertura.

**Las otras tres, en una línea cada una:**
- **①** extraer del código **no sirve** — ya me dio un falso negativo: rasterizados
  los `d` sueltos, el glifo enfermo y el sano dibujaban los dos. *El path no es
  la silueta: la silueta es el path **como la pieza lo compone**.* ⇒ se monta la
  pieza real y se renderiza.
- **③** es **dato, no umbral** — y por eso el instrumento **no tiene umbral**:
  imprime el par más parecido de cada fila para que cada quien tenga su vara.
- **④** **2,5 s.** *Iba a escribir «caro como `verify-edge-deno`» y lo medí antes.*
  No va al hook por otra razón: **depende de un Chrome del sistema**, y un gate
  que a veces no puede correr enseña a saltearlo.

**Guard probado en rojo** (L-192): una página que no renderiza devolvería «cero
colisiones» y se leería como verde. Roto el selector a propósito ⇒ **EXIT 2, NO
CONCLUYENTE.**

**De regalo:** cuenta la tinta por glifo, así que contesta gratis *«¿este glifo
pinta algo?»* (0 ⇒ 🔴 NO PINTA). *Era la hipótesis con la que cuatro pistas
trabajamos un día entero — y era falsa: girar pintaba **689 px**, el más
entintado de la fila.*

---

## ③ 🔴 LOS DOS NÚMEROS CORREGIDOS — y por qué un número viejo es peor que ninguno

Los dos venían en el plan de cierre y **los dos los cambié yo**. Re-medidos hoy
contra el objeto.

### El ancho de la barra: **300 de 320**, no 316

El 316 era con `md = 52`. **Lo bajé a 48** y está en main:
`4×48 + 60 + 4×12 = **300**` ⇒ **10 px por lado en un teléfono de 320**, no 2.

**La conclusión sobrevive y es la que importa:** un sexto control da
`5×48 + 60 + 5×12 = **360**` ⇒ **no entra ni en un teléfono de 360.**

### La vara de colisión: **0,361**, no 0,306

`0,306` es `micrófono · cámara`. **El par sano MÁS ALTO es `cámara · altavoz` =
0,361**, y una vara tiene que ser el más alto. *Puesta en 0,306, marcaría como
colisión un par que está bien.* (El glifo enfermo daba **0,647**: casi el doble
de la vara buena. La separación es amplia con cualquiera de los dos números —
lo que se rompe es el umbral, no el diagnóstico.)

### 🔴 La razón, que es lo que se lleva al canon

> **Un número viejo es más peligroso que ninguno, porque el viejo se usa.**
> Nadie decide con un dato ausente: lo va a buscar. **Con un dato viejo se
> decide de inmediato y sin fricción** — y los dos de acá tienen la forma más
> traicionera: *el viejo y el bueno llevan a la misma conclusión*, así que el
> error **no produce síntoma** y sobrevive a la revisión.

**El caso concreto:** con «316 de 320» la mesa cree que hay **2 px** de margen,
que es justo el margen que invita a apretar el gap — **y hay 10.** La decisión
que sale de los dos números es la misma («un sexto no cabe») **por razones
distintas**, y la que se archiva es la razón, no la decisión.

*Es la misma familia que `L-141`: una cifra derivada, escrita al lado de su
objeto, decae mientras el objeto no.* **⇒ el ancho se lee de
`SuperficieLlamada` y la vara se corre con `medir-siluetas`; ninguno de los dos
se cita de un plan.**

---

## ④ LO QUE QUEDÓ SIN GATE EN DISPOSITIVO — de mi lado

**Ninguna de las dos curas de hoy fue vista por el founder en el aparato.**

| pieza | verificado por | falta |
|---|---|---|
| **el glifo de girar cámara** | react-native-web: árbol, tinta, IoU 0,647 → 0,110 | **el ojo en el aparato** |
| **el asa** (`AsaModal`) | typecheck · WCAG · lámina en banco | **el ojo en el aparato** |

🔴 **Y en este defecto puntualmente el aparato pesa más que de costumbre:**
*cinco mediciones estáticas dieron verde y el ojo del founder vio lo que ninguna
podía ver.* **Mi medición corrió en react-native-web** — prueba árbol, ancho y
silueta; **no prueba el render nativo**, porque `react-native-svg` traduce a
vistas nativas. *La colisión sí vale en los dos (es del path compuesto), pero un
glifo que en nativo no pinte y en web sí, mi instrumento lo declara sano.*

**Precondición del gate:** el bundle tiene que llevar `4f05862a` (la vuelta
sola) y `9aa9fee5` (el asa), **verificado por el ancla del publish, no de
memoria.**

### Contratos míos en ROJO a propósito, esperando a C
- `onAltavoz` y `vozControles.altavoz` **obligatorias** en `SuperficieLlamada`.
- `AccionQueLleva`, esperando el reemplazo en `checkout-reserva.tsx:331`.

### Lo que medí y no curé, con dueño
**La galería sigue caída en web:** HTTP 500,
`requireNativeComponent is not a function` (`@livekit/react-native-webrtc`).
🔴 **Mis nueve piezas de videollamada ESTÁN en `TokenGallery` y la galería no
renderiza desde que entró LiveKit** ⇒ *estuvieron en la galería y no se pudieron
mirar nunca fuera de una llamada real.* **«Está en la galería» era cierto y era
inútil** — y eso explica la forma del defecto de hoy. Es de **C**: hace falta un
alias de metro; **el stub de `livekit.web.ts` NO alcanza (medido en t3)**, porque
expo-router bundlea todas las rutas.

*Mientras tanto, `medir-siluetas` es la única superficie donde estas piezas se
pueden mirar sin una llamada.*

---

## ⑤ LAS DOS LEYES QUE DEJA MI LADO

> **① Un glifo que colisiona con su vecino no es un glifo feo: es un CONTROL QUE
> DESAPARECE.** El usuario no cuenta discos — **nombra funciones**, y dos
> controles que dicen «cámara» son una función, no dos. *Un glifo nuevo se mide
> **por colisión contra sus vecinos de fila**, no sólo por legibilidad.*

> **② Un control que se toca no puede vestirse como uno que se arrastra.** El
> agarre del asa anunciaba un gesto que la pieza no implementa (`onPress`) —
> Ley 23 exacta. Salió.

**Y una nota de método de las dos curas de hoy, que es la misma en las dos:**
*ninguna de las dos causas era la que el reporte parecía nombrar.* El founder
dijo «no está» y **estaba, pintando de más**; dijo «una rayita» y **el tamaño
era el correcto**. En los dos casos la queja era **cierta** y **su explicación
obvia era falsa** — lo que la resolvió fue medir lo que la queja describe
(¿se distingue? ¿se entiende qué hay abajo?), no lo que la queja parece culpar.

---

## ⑥ ESTADO AL CERRAR

| | |
|---|---|
| `verify:diseno` | **VERDE · 59 reglas** |
| typecheck (4 paquetes) | **VERDE** |
| WCAG | **391 pares · 0 fallos** |
| `medir-siluetas` | verde, con su rojo probado |
| ramas | `pista/s106-b4` (mergeada, con `node_modules`) · `pista/s106-b5`, las dos en origin por SHA |
| árboles | limpios |

**Sin tocar** nada de lo abierto de S105.
