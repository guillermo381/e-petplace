# S73-A · M1 — BOCETO: el ENTITY CHIP del selector de mascota (v2 — dictado founder S73)

> **v2 (mismo día): el founder RECHAZÓ las tres proporciones del v1**
> (avatar DENTRO del chip con inset) **con dictado nuevo, textual:** *"el
> avatar se ve un poco MÁS GRANDE que el chip, lo que hace que el
> contorno del chip se FUSIONE con el del avatar y no se vea marcado feo
> por fuera; fondo blanco, y al escogerlo pasa a FONDO MAGENTA sin
> resaltar el contorno; de pronto algo de sombra para dar efecto 3D."*
> **Hallazgo de mesa que lo funda (citado, verificado contra literal):**
> es la **Ley 20 aplicada a un componente que nunca la recibió** —
> SKILL.md:329: *"REGLA CHANEL DEL MARCO cableada en Tarjeta: la
> superficie que gana elevación PIERDE el hairline"* — con la vara
> Airbnb de la propia ley (sombras pequeñas, sutiles). El founder
> re-derivó su propia ley sin citarla.
> Captura v2: `scripts/capturas/s73-a-boceto-entity-chip-v2.png`
> (3 proporciones × claro/oscuro/MEMORIAL, junto a vecinos de valor en
> su forma actual).

## v2 · Las condiciones duras, verificadas

- **La sombra sale de `theme.elevacion.reposo`** — es un token STRING de
  `boxShadow` (`tokens/elevacion.ts:38`, dos capas de tinta cálida); el
  mock lo aplica como `boxShadow: theme.elevacion.reposo`, cero sombra
  artesanal. **EXTENSIÓN DE LEY A FIRMAR, no dada por hecha:** la Ley 20
  lista tarjetas/celdas para `reposo` y dice "la elevación acompaña a la
  jerarquía" — un CHIP de selección no está en la lista; que un chip
  califique para elevación es extensión que el gate firma.
- **Ley 6:** la sombra del mock es estática; en construcción, el pressed
  escala por `usePresionado` y la sombra viaja con la superficie SIN
  animarse por separado.
- **Contraste, medido:** LIGHT `accent.control` (magentaDark) porta
  blanco = **8.25:1** (par VIVO del gate, corrido en esta sesión —
  178/0). **HALLAZGO DEL MOCK EN DARK:** `accent.control` resuelve a
  `violetText` (violeta CLARO) y el blanco encima SE LAVA a ojo — **el
  lleno exige un token de texto-sobre-control POR TEMA** (light→blanco
  8.25 ✓ · dark→candidato tinta sobre violeta, A MEDIR · memorial→
  degrada) **con pares nuevos al gate WCAG ANTES de construir.** La
  captura lo muestra tal cual.
- **Overflow, literal de RN:** el default de `overflow` en RN es
  `'visible'` y `borderRadius` NO clipea hijos salvo
  `overflow:'hidden'` — el avatar sobresale sin cortarse (hijo absoluto
  con `top: -sobra`); la fila compensa con `paddingVertical = sobra`
  para que las filas vecinas no colisionen (capturado: cero colisión).
- **Memorial:** elevación CONSERVADA (Ley 20: no es celebración), el
  acento degrada por tema — panel 3 de la captura.

## v2 · Las tres proporciones (riesgo por variante, §6b.3)

- **V1 · avatar 48 / chip 44 (+4, sobresale 2 por lado):** riesgo — el
  overhang casi no se LEE; se paga la complejidad del absolute sin
  cobrar la fusión visual.
- **V2 · avatar 52 / chip 44 (+8, sobresale 4 por lado) — VOTO:** el
  "un poco más grande" del dictado; la fusión se ve, el texto respira.
- **V3 · avatar 56 / chip 44 (+12):** el techo — el avatar empieza a
  dominar y el chip se lee como etiqueta DEL avatar; el paddingVertical
  de compensación (6) infla el alto efectivo de cada fila.

## v2 · EL RIESGO MAYOR — la decisión (a)/(b) del founder

`SelectorOpcion` es el MISMO componente de duración, día, hora, idioma y
los 7 días del plan: **32 consumidores literales** (15 en cliente, 16 en
prestador, +galería — censo por grep de esta sesión). Si "elegido" pasa
de TONAL (borde+tinte, Ley 22 literal: *"TONAL para SELECCIÓN entre
pares"*) a LLENO:
- **(a) forma nueva SOLO para entity chips (identidad):** conviven DOS
  formas de "elegido" en una misma pantalla — el mock lo monta al lado
  de los vecinos de valor en su forma actual para que el founder lo
  JUZGUE viendo (roce Ley 22 directo, declarado).
- **(b) migran TODOS:** 32 superficies re-gateadas + el token
  texto-sobre-acento por tema × 3 acentos (control/oficio/capa) +
  re-medición WCAG completa + **la Ley 22 se REESCRIBE** (hoy el LLENO
  es de BINARIOS — Interruptor; invertirla es enmienda de ley con firma,
  no barrida).

## v2 · VOTO DE MESA (con el founder) — y la precondición dura

- **Proporción: V2 (52/44)** — mesa y boceto coinciden.
- **(a) sobre (b)**, no por costo: el LLENO hoy significa BINARIO; dos
  significados para el mismo peso visual exigen su propio gate. (b) =
  **D-499** (mecánica D-318). El founder juzga la convivencia VIENDO —
  su palabra manda.
- **PRECONDICIÓN DURA — el token texto-sobre-control-LLENO por tema,
  MEDIDO (mini-gate al founder,
  `scripts/capturas/s73-a-minigate-token-oscuro.png`):**

  | Tema | Fill | Texto | Ratio | Veredicto |
  |---|---|---|---|---|
  | LIGHT | magentaDark `#8E1F68` | blanco | **8.25:1** | ✓ (par vivo del gate) |
  | DARK — el dictado | violetText `#AE59FF` | tinta `#221E19` | **4.47:1** | **✗ FALLA AA** (medido — el dictado "tinta sobre violeta" tampoco pasa) |
  | DARK — blanco | violetText | blanco | **3.70:1** | ✗ (el lavado, ahora con número) |
  | DARK — negro puro | violetText | `#000000` | 5.67:1 | pasa pero ROMPE la tinta cálida de la casa |
  | **DARK — PROPUESTA** | **magentaDark `#8E1F68`** | **blanco** | **8.25:1** | **✓ — el MISMO par en ambos temas** |

  **La propuesta:** el LLENO en dark NO usa `accent.control` (que en dark
  es violeta CLARO porque es acento de TEXTO — otro trabajo): usa
  **magentaDark con blanco en AMBOS temas** — un solo par, ya medido en
  el gate vivo. Token propuesto: `accent.controlLleno` +
  `accent.sobreControlLleno` (light=magentaDark/blanco ·
  dark=magentaDark/blanco · memorial=degrada sin lleno). Oficio NO
  necesita par nuevo (tealDark porta blanco 5.51/5.05, Ley 21 medida);
  capa N/A (muere como control). **El founder no firmó el dark — el
  mini-gate es suyo.**

**ORDEN PARA CONSTRUIR: voto de mesa ✓ + vara de B (pedida) + token
oscuro firmado en el mini-gate. Sin las tres, no se construye.** El v1
de abajo queda como registro del camino (rechazado).

---

# [RECHAZADO v1] S73-A · M1 — BOCETO: el ENTITY CHIP del selector de mascota (dictado founder S73)

> **Estado: BOCETO — viaja a la vara cruzada de B y al gate founder.**
> Dictado founder (S73): *"el chip pasa a ENTITY CHIP — AvatarMascota al
> BORDE IZQUIERDO, ligeramente más chico que el alto del chip (inset con
> aire: flush se lee 'escapando'; inset se lee 'contenido'). El avatar
> deja de ser adorno y pasa a ser ANATOMÍA."* Patrón de referencia:
> entity chip (LinkedIn/Slack/Google share). Radius.suave y acento
> control INTACTOS (firma ②). Captura:
> `scripts/capturas/s73-a-boceto-entity-chip.png` (3 proporciones ×
> claro/oscuro, nombre largo real, junto a vecinos de VALOR — §6b.4).

## 0 · El relevamiento que la mesa pidió (literal, ruta:línea)

1. **La forma de AvatarMascota: SQUIRCLE 32%, no círculo.**
   `packages/ui/src/components/AvatarMascota.tsx:73-75`
   (`RADIO_SQUIRCLE = 0.32`, `radioSquircle(lado)`) aplicado con
   `borderRadius: radioSquircle(d)` + `borderCurve: 'continuous'`
   (`:148-149` foto, `:179` huella). El círculo murió en S61-A10
   (dirección de arte firmada sobre prototipo; 38% se descartó
   medido). Tallas: xs=28 · sm=40 · md=64 (`:81-83`).
   **Consecuencia para el entity chip:** squircle 32% dentro de
   radius.suave 10 — dos curvaturas de la misma familia; el inset
   además evita que las esquinas del squircle "choquen" con las del
   chip.
2. **Dónde vive el avatar HOY:** `SelectorOpcion.tsx:57` — prop
   `adorno?: ReactNode` ("sin adorno, el chip queda IDÉNTICO"),
   renderizado INLINE leading (`:233-234`) dentro del row del chip:
   gap `spacing[2]`, **dentro del `paddingHorizontal: spacing[4]`
   completo** — es decir, hoy el avatar NO está al borde: flota con el
   padding del texto. El dictado lo muda al borde con inset propio.
3. **¿Foto del prestador en schema?** **SÍ HAY COLUMNA:**
   `prestadores.foto_url: string | null` + `fotos_galeria: Json | null`
   (database.types, tabla `prestadores`). PORTAL_PRESTADOR:150 es letra
   CON motor. (El avatar del PRESTADOR no entra a este boceto — letra
   propia por decisión de mesa: logo, subida, fallback, logo-ancho.)

## 1 · Las tres proporciones (riesgo por variante, §6b.3)

Chip = 44 (ALTO literal de `SelectorOpcion.tsx:41`).

- **V1 · avatar 32 · inset 6** — el aire pedido: se lee "contenido".
  Riesgo: en xs-de-28 actual el salto es +4px — la cara gana poco
  tamaño; puede quedar tímida al lado del texto sm.
- **V2 · avatar 36 · inset 4** — más presencia de la cara, aire justo.
  Riesgo: el inset de 4 se acerca al umbral donde el ojo empieza a leer
  "flush"; en oscuro (borde 1.5 sobre elevated) el margen visual es aún
  menor.
- **V3 · avatar 40 (sm) · inset 2 — EL RIESGO MONTADO A PROPÓSITO:** el
  "escapando" del dictado, capturado para VER el porqué del inset. No es
  candidata: es la vara negativa.

**Voto del boceto: V2** (la cara es anatomía — que se vea; el aire de 4
sigue siendo aire) con V1 como fallback si el founder la lee apretada.

## 2 · Lo que toca construir cuando se firme

- `SelectorOpcion` gana la anatomía entity (enmienda en packages/ui —
  territorio A): el `adorno` leading muda a slot `entidad` al borde con
  inset, prop nueva o evolución del adorno (decisión de construcción,
  con B en la vara — el prestador también tiene selectores con cara
  potenciales).
- Los 4 selectores de mascota la heredan por prop — cero cambio de
  pantalla más allá del prop.
- El resto del selector queda como está: chips en línea (S61), control
  (firma ②), frontera de elegibilidad (S73), N=1 que se dice (firma ③).

## 3 · Vara

Se juzga en vecindad (junto a los selectores de VALOR en control, que no
llevan cara) con el nombre real más largo del hogar — la captura monta
"Maximiliano". Claro y oscuro. La decisión es del founder sobre píxeles.
