# S80-B8 · M2 — el canto en el HOY + la continuidad (respuesta a la vara)

> Segunda pasada sobre el M1 de B7 (`2026-07-28-s80-b7-M1-continuidad-cita.md`),
> con las dos firmas de B8: ① index.tsx sigue mío, HUNK ADITIVO — el gate
> de `3f08a9c` no se toca, no se reordena, no se envuelve; ② la vara M2
> con sus cuatro puntos, respondidos abajo UNO POR UNO. Leyes leídas:
> DIRECCION_ARTE v1.2 §8.1-8.6 · §9.1-9.6 · movimiento vigente ⑤.

## Respuesta a la vara, punto por punto

**1. La prueba de tapar el texto (§9.4) — y el límite del registry,
declarado en vez de maquillado.** El canto es POR CAPA, con el MISMO
mapa que el registry de `Icono` (la fuente única, L-175 — nadie inventa
un color): paseo → `capa.cuidado` (teal) · veterinaria →
`capa.identidad` (verde vital) · grooming → `status.warning` (ocre).
Con la fila típica de tres oficios (vet + grooming + paseo), tapado el
texto se distinguen TRES tonos: la prueba pasa. **EL LÍMITE:
adiestramiento comparte `cuidado` con paseo EN EL REGISTRY** (Icono.tsx:361
— `training: cuidado`, decisión S78 viva). Un paseo y una sesión de
adiestramiento en fila comparten canto; los distingue el glifo b′ que la
fila YA porta en `fin`. El canto dice la CAPA — que es la verdad que el
sistema tiene—; si el gate del founder exige que diga el OFICIO, la
enmienda es del REGISTRY (capa nueva para training, decisión de mesa),
jamás un hex local de esta pantalla.

**2. El barrido (§9.2):** hoy el oficio vive SOLO en el glifo de 21px al
final de la fila — leer la jornada exige fijar el ojo fila por fila en la
esquina derecha. El canto al borde IZQUIERDO es pre-atencional: el ojo
agrupa por color antes de leer. Es exactamente el trabajo de §9.2
("distingue entre hermanos") — y el glifo no muere: canto = barrido,
glifo = confirmación puntual (Ley 12: el glifo marca lo que varía).

**3. El Día 1 con UNA fila:** el canto se queda — §9.2 verbatim:
propiedad del TIPO, no del instante. Con una sola fila el canto no
compara: DICE ("esto es trabajo de paseo"), la misma voz que el glifo ya
daba. No es arbitrario porque no es ornamento condicional: toda fila de
servicio lo lleva siempre, incluidas las plegadas de "Ya atendidas".

**4. El riesgo de densidad — MEDIDO: la Celda NO crece.** El canto es
una tira ABSOLUTA de **3px de ancho** al borde izquierdo de la fila,
alto = alto de la fila (top 0 / bottom 0), DEBAJO del contenido: cero
padding nuevo, cero alto nuevo, cero reflujo — el `inicio` (avatar) ya
tiene `spacing[3]` de padding izquierdo de la Celda y 3px no lo tocan.
Las esquinas: el grupo del día es `Tarjeta relleno="ninguno"` que YA
recorta (`overflow: 'hidden'`, Tarjeta.tsx:103) — la primera y la última
fila heredan la curva del contenedor gratis. **Si el gate en dispositivo
dice que 3px no se leen, la respuesta es subir el ANCHO de la tira,
jamás agrandar la Celda** — y ese ajuste es de este mismo gate, no una
tanda de densidad.

## ③ La fila `en_curso` — la vara tiene razón; el desvío del M1 se retira

El estado 1 del M1 ("la fila en vivo transiciona sin canto") leía la ley
del glow como si el canto fuera un elemento VIVO. No lo es: **el glow
cuenta elementos VIVOS (que respiran/brillan); el canto es tinta
ESTÁTICA — no anima, no late, no compite por esa contabilidad.** La fila
`en_curso` LLEVA su canto como todas (§9.2: si la única sin canto es la
viva, el sistema dice "esta no tiene oficio" — falso). Lo que la fila en
vivo NO lleva en v1 es el **tag de transición**: el elemento compartido
vivo es UNO por experimento (la fila tocada), y la fila en curso navega
con su fade default — desvío §6b declarado con su porqué: el experimento
mide UNA transición limpia; sumar glow+SET en la primera corrida
contamina el número que B7 pide. Reversible en gate.

## La composición (acotada al M1 §4.3 + firma ①)

1. **`components/canto-oficio.tsx` (NUEVA, anatomía LOCAL — patrón
   TarjetaEstado/GateRoto: NO entra a packages/ui; su promoción se
   coordina, L-175):** `CantoOficio({ color, tag? })` — tira absoluta
   izquierda de 3px, `LinearGradient` vertical `[color → transparente]`
   (§9.1: un tono degradado EN ALFA; `expo-linear-gradient` ya es dep
   de la app). Con `tag`: se envuelve en `Animated.View` con
   `sharedTransitionTag` + `transicionCanto` exportada:
   `SharedTransition.duration(340).easing(Easing.bezier(.32,.72,0,1))`
   (el default 500 del builder NO se acepta — verificado en fuente
   instalada, `durationV = 500`).
2. **`(tabs)/index.tsx` — ADITIVO, solo FilaCita:** la Celda se envuelve
   en un View relativo con el canto detrás; color por el mapa del
   registry vía theme (guard memorial espejo del de Icono: sin `capa` en
   el tema → `text.secondary`, nada celebra). El tag SOLO en la fila de
   paseo no-viva (`canto-cita-${id}` — la ruta del experimento,
   `/cita/[citaId]`). **El bloque del gate de preparación (3f08a9c) no
   se toca — verificable en el diff.** FilaSalida y "Por coordinar"
   quedan FUERA (compuesto y bandeja: su canto se decide después del
   gate de esta anatomía — una anatomía, un gate).
3. **`cita/[citaId]/index.tsx`:** el destino — el canto en el bloque
   hero de la mascota (tira izquierda del bloque, mismo tag con el
   citaId, mismo color cuidado). §9.6: al volver, el canto regresa a SU
   fila; si la fila ya no está (cita cerrada / filtro), degrada a fade
   — los estados 2-4 del M1 quedan tal cual.

**Movimiento vigente aplicado (⑤):** transición compartida 340 ms
bezier(.32,.72,0,1); cero animación de entrada nueva en esta tanda (la
entrada 45/300/15 rige para quien componga entradas — acá no nace
ninguna); presión: la Celda ya la trae por su pressed canónico — el
0.972 retirado no aparece.

**Gate en dispositivo (regla 77, el número que B7 pide):** doble
reinicio, y el veredicto tiene DOS partes — el craft del canto (¿3px se
leen? ¿el barrido mejora? ¿la fila en vivo con canto+glow no grita?) y
el costo de la transición (jank/frames/tags huérfanos; si
`SharedTransitionBoundary` resulta precondición no documentada, el
experimento lo reporta como número, no lo tapa). El canto es OTA-legal
(JS puro); el SET también (reanimated ya instalado).
