# S81-C6 — El "botón blanco" del estado de pelaje: MEDIDO — no es un caso, es una CLASE (cero cura)

> **Sesión C-S81 (29 Jul 2026).** Las tres preguntas de la orden, con
> literal. Vara: *"un CTA tiene que verse tocable sin que nadie lo
> explique."*

## 1. ¿Qué componente es?

**Ni Boton ni artesanal: es `Celda interactiva` (rol button) envuelta
en `Tarjeta relleno="ninguno"` SIN elevación explícita** —
`grooming/cita/[citaId]/durante.tsx:299` (recibir) y `:345` (entregar).
Su señal tocable en reposo era LA PIEL DE LA TARJETA; la Celda solo
resalta al presionar (su ley S43) y no lleva chevron (no es
CeldaNavegacion).

## 2. ¿Cuál es el CTA primario por ley?

**Ley 21 (enmienda S63, FIRMADA): el CTA primario del prestador ancla
al oficio — tealDark vía `accent.cta`** (el raíz pasa `cta="oficio"`;
`Boton primario` consume el slot). En esta pantalla el primario ES
"Terminar el grooming" (Boton primario bloque, tealDark). **El estado
de pelaje nunca fue ni debe verse primario**: su trabajo es ELEGIR un
valor (abre una Hoja). El "botón blanco" que el founder vio no es un
primario mal pintado — es un elegidor que perdió su señal de tocable.

## 3. LA HIPÓTESIS — CONFIRMADA: cambió de piel con el flip, y es una CLASE

- **El flip `f1c60e1` tocó SOLO `packages/ui/Tarjeta.tsx` (+lint)** —
  `git show --stat` lo prueba. El default pasó de `'plana'` (**hairline,
  sin sombra**) a `'reposo'` (**sombra; la regla Chanel del marco MATA
  el hairline**). Fuente: `Tarjeta.tsx:80` (`elevacion = 'reposo'`) y
  el propio JSDoc del flip.
- **La pieza del estado de pelaje NO tiene `elevacion=` → heredó el
  cambio sin que su archivo cambiara** (los commits posteriores sobre
  ese archivo son migraciones de texto mías, medido por `git log`).
  ANTES: caja blanca con borde sutil (la señal). DESPUÉS: caja blanca
  con sombra suave sobre papel — la sombra a ese tamaño no lee como
  affordance y queda el "botón blanco" que no se ve tocable.

**EL CENSO DE LA CLASE (script sobre ambas apps: tag `<Tarjeta` sin
`elevacion=` que es `interactiva` o envuelve `Celda interactiva` en su
ventana):** **22 tocables cambiaron de piel con el flip.**

| App | Tarjeta interactiva default | Celda interactiva en Tarjeta default |
|---|---|---|
| prestador | 0 | **10** — paseo/taller:892 · negocio/equipo:499 · **grooming durante:299 y :345 (el caso del founder)** · vet/procedimientos:239 · cuenta-comercial/bancarios:196 · nueva:201 · seccion-horarios:993/1034/1176 |
| cliente | **3** — explorar/index:159 · mascota/[id]:395 y :410 | **9** — los 4 "disponibles" (paseo:345 · grooming:179 · adiestramiento:192 · vet:230) · paseo/paquete:102 · hogar/grooming:146 · hogar/paseos:458 · mascota/[id]:526 y :548 |

**Matiz para la mesa (no todos duelen igual):** las filas de LISTA
(disponibles, hubs) conservan affordance por convención de lista y
contenido; el síntoma agudo es el **elegidor SOLITARIO** (estado de
pelaje, las filas de seccion-horarios, bancarios/nueva) — una caja
blanca sola cuya única señal ERA el borde. El flip en sí está firmado
(A6+§7 de fábrica, y las 7 `plana` declaradas quedaron como
excepciones con dueño); lo que este censo agrega es la dimensión que
esa pasada no miró: **la elevación era también la AFFORDANCE de 22
tocables**, y `reposo` sobre papel no la repone a tamaño chico.

**Contexto de totales:** prestador 86 Tarjetas default / 41 explícitas
· cliente 42 / 14 — los 22 son la intersección tocable, no el stock.

Cero cura (mandato). Los caminos posibles son de mesa: señal por
anatomía (chevron/glifo — 19.7), `plana` declarada para elegidores,
o una pieza de "elegidor" con dueño. Con el literal se decide.
