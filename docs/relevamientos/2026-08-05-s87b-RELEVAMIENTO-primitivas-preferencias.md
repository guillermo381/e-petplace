# S87-B · RELEVAMIENTO — primitivas para la superficie de PREFERENCIAS

> **HALLAZGOS, NUNCA VEREDICTOS.** Esto mide qué hay y qué falta. **No
> propone una pantalla, no construye nada, y no decide**: la lámina no
> está firmada y nada se construye contra lámina ausente.
>
> **Medido el 5-ago-2026 contra el objeto** — `packages/ui/src`,
> `apps/*/src`, `docs/MODELO_NOTIFICACIONES.md` — sobre `pista/s87-b`,
> ancla `a086501`. **Jamás contra la letra de un resumen** (L-166).

---

## 0 · LA LETRA QUE GOBIERNA, leída en su archivo

`MODELO_NOTIFICACIONES` **§6**, textual:

> *«La superficie de Ajustes (las dos apps, y las que vengan): una
> pantalla, **categorías como filas, canales como columnas**. Voz honesta
> — se dice qué NO se puede apagar y **por qué**, jamás un toggle muerto
> que el usuario toca y no obedece (Ley 23).»*

Y la unidad del dato, también §6: **`(persona, categoría, canal)`** —
*«ni global, ni por canal solo»*.

**LAS DOS CLASES DE FILA salen de §3, y son la razón de la pregunta de la
mesa:**

| categoría | ¿apagable? | ⇒ forma de la fila |
|---|---|---|
| `seguridad_cuenta` | **NO** (canal sí elegible) | **sin toggle de existencia** |
| `salud_seguridad` | **NO** (canal sí elegible) | **sin toggle de existencia** |
| `saldo_pagado` *(enmienda S80, a la firma)* | **NO en existencia** — sí en canal | **sin toggle de existencia** |
| `operacion` | sí, por canal | con existencia |
| `relacional` | sí, por canal | con existencia |
| `comercial` | sí (OFF por default en todo canal) | con existencia |

**Los canales de §7 son TRES:** `push` · `email` · `whatsapp`.
⇒ **la matriz de la letra es ~6 filas × 3 columnas.**

---

## 1 · LO QUE YA EXISTE Y CORRE HOY — las dos pantallas, medidas

**`apps/cliente/.../cuenta/preferencias.tsx`** *(S55-B3, D-316)*

- Idioma con **`SelectorOpcion acento="control"`** (2 opciones).
- Notificaciones **por GRUPO en voz humana** — 3 grupos (`citas` ·
  `cuidado` · `novedades`) mapeados a tipos del vocabulario.
- **Cada grupo es UNA `Tarjeta` con una fila armada a mano**: `View`
  `flexDirection:'row'` + `Text` crudo + **`Interruptor`** a la derecha,
  y un `Text` de detalle debajo.
- **Cero dimensión de canal.** Hoy el toggle es **existencia** pura.

**`apps/prestador/.../cuenta/preferencias.tsx`** *(S57-B, P17)*

- Idioma con `SelectorOpcion`. **Notificaciones: la sección dice
  «Pronto»** — el vocabulario de tipos del lado prestador **no existe**, y
  el archivo declara por qué (inventarlo sería catálogo imaginado, L-084).

> ⇒ **La superficie de la letra §6 NO existe todavía en ninguna de las dos
> apps.** Lo que existe es su antepasado de UNA dimensión.

---

## 2 · EL INVENTARIO — qué pieza cubre qué, medido contra el contrato de cada una

*(53 archivos en `packages/ui/src/components`; se listan solo los que
tocan esta superficie.)*

| pieza | qué contrato tiene HOY | ¿sirve para la matriz? |
|---|---|---|
| **`SelectorOpcion`** | chips; `multiple` + `seleccionadas[]` desde S56 (los 7 días L·M·X·J·V·S·D); `disposicion: fila\|tira\|grilla\|columnas`; `acento: control\|oficio`; `etiquetaVisible` | **SÍ — es la columna de canales.** `multiple` es exactamente «elegí por qué canales», con `accessibilityRole=checkbox` por chip. **Cero componente nuevo por este lado** (insumo de mesa confirmado contra el objeto) |
| **`Interruptor`** | `encendido` · `onCambio` · `etiqueta` (a11y) · `registro: control\|oficio` | **SÍ, para la existencia** — y **solo** ahí. Su JSDoc queda intacto |
| **`Tarjeta`** | superficie con `elevacion.reposo` | sí — el contenedor de la fila |
| **`Texto`** | 7 variantes (`titulo`·`seccion`·`cuerpo`·`apoyo`·`dato`·`datoMd`·`voz`) + `color` semántico | sí — **el título y la voz del porqué** |
| **`Celda`** | `titulo` · `subtitulo` · `inicio?` · **`fin?: ReactNode`** · `densidad` | **SÍ, y es el hallazgo #1 de abajo**: ya porta «rótulo + control al final» |
| **`FilaDato`** | `etiqueta` + `valor: ReactNode`, `disposicion: vertical\|horizontal` | **técnicamente sí, semánticamente NO** — su contrato dice *«el valor ya resuelto… formateado»*: es un **DATO**, no un control. Meter un `Interruptor` en el slot de valor lo convierte en otra cosa |
| **`SelectorSegmentado`** | selección única entre 2-3 segmentos | no — la matriz es multi-selección por fila |
| **`TarjetaEstado`** | `encendido` + rol `checkbox\|radio\|button`; **sin `onPress` = estática** | posible para «canal ON/OFF» como tarjeta, pero es pieza de **oferta/franja**, no de ajuste |
| **`TresNumeros`** | tres columnas de CIFRAS sobre el muro | **no** — es display del techo, no control |
| **`CeldaNavegacion`** | navegación / despliegue (`direccion`) | solo si la categoría **entra** a su propio detalle |

> **NO existe en `packages/ui` ninguna primitiva de MATRIZ, TABLA o
> GRILLA-DE-CONTROLES.** Medido: cero. *La casa nunca necesitó una.*

---

## 3 · LA PREGUNTA DE LA MESA, contestada con la medición

> *«¿Qué pieza existente porta la fila SIN toggle (¿`Tarjeta` + `Texto`
> alcanzan, o falta algo?)»*

**Alcanzan — compositivamente.** La fila sin toggle es
`Tarjeta` → `Texto` (título) + `Texto variante="apoyo"` (la voz del
porqué) + `SelectorOpcion multiple` (los canales). **Las cuatro piezas
existen y ninguna necesita ensancharse para eso.**

**Y ahí termina lo que la medición sostiene.** Lo que sigue es lo que la
medición ENCONTRÓ, y es una pregunta distinta que la lámina va a tener que
contestar igual:

### HALLAZGO #1 — la fila «rótulo + control» está **armada a mano 16 veces**, y la casa tiene una pieza que la porta

Censo de los **21 consumidores de `<Interruptor>`** en las dos apps
(`packages/ui/gallery` aparte):

| cómo está armada la fila | cuántas |
|---|---|
| **`View flexDirection:'row'` + `Text` crudo, a mano** | **16** |
| **`Celda fin={<Interruptor/>}`** — la pieza de la casa | **1** *(`cliente/components/talla-pelaje-hoja.tsx:112`)* |
| otras formas (dentro de otra anatomía) | 4 |

**Las 16, con su literal:** `cuenta/preferencias.tsx:169` ·
`plan-hoja.tsx:239` · `paseo/taller.tsx:617,660,700` ·
`negocio/equipo.tsx:559,846` · `grooming/taller.tsx:634,693,728,737,752` ·
`adiestramiento/taller.tsx:550,915` · `veterinaria/procedimientos.tsx:308`
· `veterinaria/taller.tsx:597`.

> **Esto NO es una propuesta de componente nuevo** — es el dato que Ley 11
> pide antes de decidir: **la anatomía ya se repite 16 veces y `Celda` ya
> la cubre en una.** *Si la lámina de preferencias vuelve a armarla a
> mano, van a ser 17.* **Qué hacer con eso es de la lámina y del founder**,
> y hay al menos dos caminos honestos —consumir `Celda`, o que nazca la
> fila de ajuste— que esta medición **no** adjudica.

### HALLAZGO #2 — la dimensión CANAL no tiene dato debajo

`user_notificacion_prefs` guarda **por tipo**, con el contrato B4 *«fila
ausente = habilitada»*. **La unidad de §6 es `(persona, categoría,
canal)`.** ⇒ la columna de canales **hoy no tiene dónde escribirse**.
*Territorio de A; se declara como precondición, no como pedido.*

### HALLAZGO #3 — el ancho: tres columnas de canal en un teléfono · **MEDIDO** *(pedido de mesa, 5-ago)*

**MÉTODO — el instrumento vive en el repo: `scripts/medir-chips-canal.mjs`**
*(depositado por adjudicación de mesa: los bordes son de 6 y 5 píxeles, y
las keys de voz de los canales todavía no nacen ⇒ **esto se vuelve a
correr** cuando existan las etiquetas reales).* La geometría sale del
objeto (`SelectorOpcion.tsx` + tokens); el ancho del texto se mide con
**la fuente real** — `DMSans_500Medium.ttf` de `@expo-google-fonts`,
cargada en Chrome headless.

**LA MEDICIÓN LLEVA SU PROPIO DISCRIMINADOR, y no es decorativo — se
cobró en la primera corrida:** sin `document.fonts.check()` el canvas cae
al fallback del sistema y devuelve números **creíbles y falsos**
(«WhatsApp» **56px** con el fallback · **65px** con DM Sans). *Se cazó
porque el MISMO string dio dos anchos distintos entre juegos.* Es la
familia L-194→L-199 exacta, y por eso el chequeo quedó adentro del
script: **si la fuente no carga, sale ROJO y no mide** (L-197).

> **Y una corrección que entró AL DEPOSITARLO, que vale más que el
> script:** con el payload de la fuente corrupto, `fonts.load()` **lanza**
> y el script moría con un stack trace de Playwright — *exit 1 correcto y
> mensaje que no decía nada*. Ahora los dos modos de falla (lanza · o
> `check` da false) van al **mismo rojo hablado**. **El mensaje de un
> guard es parte del guard:** sin eso, el próximo que lo corra lee
> «NetworkError» y va a buscar el problema en su red.

**LA ARITMÉTICA, con sus términos:**
`disponible = ancho − 40 (padding de pantalla) − 24 (Tarjeta 'normal')` ·
`requerido = Σtexto + 3×32 (padX del chip) + 2×8 (gap)`

**① A ESCALA DE FUENTE POR DEFAULT, LOS TRES ENTRAN EN TODOS LOS ANCHOS —
incluido 320dp.** *(«Push» 30 · «Correo» 43 · «Email» 33 · «WhatsApp» 65)*

| juego | requerido | 320dp | 360dp | 393dp | 412dp | 448dp *(emulator, medido con adb)* |
|---|---|---|---|---|---|---|
| **es** `Push · Correo · WhatsApp` | 250px | ✓ **+6** | ✓ +46 | ✓ +79 | ✓ +98 | ✓ +134 |
| **en** `Push · Email · WhatsApp` | 240px | ✓ +16 | ✓ +56 | ✓ +89 | ✓ +108 | ✓ +144 |

> **La respuesta corta es SÍ, y la holgura de 320dp es SEIS PÍXELES.** No
> es «entra cómodo»: es «entra».

**② Y ACÁ ESTÁ EL DATO QUE CAMBIA LA CONVERSACIÓN — la escala de fuente
del sistema.** Medido: **`allowFontScaling` NO está apagado** en
`SelectorOpcion` (solo lo apagan `Cronometro` y una pieza del perfil), y
**no existe `maxFontSizeMultiplier` en ningún lado del repo**. ⇒ el texto
del chip crece con el ajuste del SO **y el padding no**.

| escala | qué es | 320dp | 360dp | 393dp | 412dp |
|---|---|---|---|---|---|
| ×1.00 | default | ✓ | ✓ | ✓ | ✓ |
| ×1.15 | Android «Grande» | **✗ −15** | ✓ +25 | ✓ +58 | ✓ +77 |
| ×1.30 | Android «El más grande» *(tope del ajuste normal)* | ✗ −35 | ✓ **+5** | ✓ +38 | ✓ +57 |
| ×1.50 | Samsung / accesibilidad | ✗ −63 | **✗ −23** | ✓ +10 | ✓ +29 |
| ×2.00 | iOS Dynamic Type accesibilidad | ✗ | ✗ | ✗ | ✗ |

*(valores del juego `es`, el más ancho de los dos cortos.)*

**③ QUÉ PASA CUANDO NO ENTRA, medido en el contrato y no supuesto:**
`disposicion='fila'` es **`flexWrap:'nowrap'`** y su etiqueta va con
**`numberOfLines={1}`** ⇒ **trunca con elipsis. No envuelve.** Y el chip
usa **`height: ALTO` fijo** (44) — a diferencia de `'columnas'`, que usa
`minHeight` justamente para dejar envolver. **El canal que trunca primero
es «WhatsApp»**, que es el más largo, es marca, y **no se puede acortar ni
traducir.**

**④ LA ALTERNATIVA YA EXISTE EN LA MISMA PIEZA, y no es un componente
nuevo:** `disposicion='grilla'` tiene **`flexWrap:'wrap'`** y `flexGrow 0`
⇒ los chips van a **ancho de contenido y bajan de línea** en vez de
truncar. Pierde la retícula de tres columnas alineadas; gana que **ninguna
etiqueta se corte a ninguna escala.**

> **LO QUE ESTO NO DECIDE:** cuál de las dos disposiciones usa la lámina,
> si se apaga el escalado (que sería empujar accesibilidad hacia atrás), o
> si se acota con `maxFontSizeMultiplier`. **Son tres decisiones distintas
> y las tres son de la lámina.** Lo que la medición aporta es que **la
> pregunta no era «¿entran?» sino «¿entran cuando alguien agranda la
> letra?»** — y ahí la respuesta cambia según el ancho.

> ⚠️ **EL LÍMITE DE ESTA MEDICIÓN, declarado:** es canvas en Chrome con la
> fuente real, **no un render de React Native en un aparato**. El
> *shaping* de RN puede diferir en algún píxel. **Los bordes de ±6px
> (320dp default) y +5px (360dp ×1.30) están DENTRO de ese margen de
> error** — esos dos casos hay que verlos en pantalla antes de apoyar
> nada en ellos (L-143).

### HALLAZGO #4 — la voz honesta de §6 no tiene keys

*«Se dice qué NO se puede apagar y por qué»* exige **una voz por categoría
no apagable** (3 de las 6). **Medido: no existen** en los diccionarios de
ninguna de las dos apps. *Es letra de la lámina, no de esta medición.*

---

## 4 · LO QUE ESTE RELEVAMIENTO **NO** MIDIÓ, declarado

- **No se midió en pantalla.** Todo lo de acá es contra el código, la
  letra y la fuente real en canvas. **Ningún píxel de React Native se vio.**
- **No se midió el lado prestador de la matriz** más allá de constatar que
  su vocabulario de tipos no existe.
- **No se midió a11y de la matriz** (cómo lee un lector de pantalla una
  grilla de checkboxes con encabezado de columna). *Es una pregunta real y
  queda abierta.*
- **No se tocó nada.** Cero archivos de `packages/ui` modificados por este
  relevamiento.
