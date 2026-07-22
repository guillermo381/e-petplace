# S73-A · M1 — BOCETO: el ENTITY CHIP del selector de mascota (dictado founder S73)

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
