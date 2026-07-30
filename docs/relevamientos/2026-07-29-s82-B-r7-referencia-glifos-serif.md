# S82-B r7 · LA REFERENCIA IMPORTADA — los dos glifos de control + el freno de la serif

**Sesión B · 29-jul-2026.** Fuente: `~/Downloads/design/handoff/e-petplace/project/`
— **`ficha-mascota.html` + `ficha-mascota.js`** (los dos archivos del proyecto de
Claude Design que la orden nombra; el fetch de la URL dio **403**, llegaron por
Downloads — mismo camino que la lámina de C, L-142). Archivos declarados (76h):
`packages/ui/src/components/Icono.tsx` · `packages/ui/src/gallery/TokenGallery.tsx`
· este reporte. **CERO pantalla tocada** (la orden lo prohíbe explícitamente) ·
**los hexes del CSS descartados enteros** — no se leyó ni un color de ahí.

## 1. LOS DOS GLIFOS — el hueco estaba DECLARADO en el código de C

El censo antes de construir encontró la deuda escrita por su propia dueña, en
`hogar/mascota/[mascotaId].tsx:370-375`:

> *"Los textos Editar/Compartir son PROVISIONALES hasta la imagen (sin glifos:
> el set no tiene lápiz ni compartir — cero genéricos, Ley 12)."*

Nacen en el registry (**los dos primeros GLIFOS DE CONTROL de la casa**):

| Nombre | Trazo importado (literal de la referencia) | Nota de B |
|---|---|---|
| `lapiz` | `M15.5 4.5 19.5 8.5 8 20H4v-4z` | **+ el corte del bisel** (`M13.6 6.4 17.6 10.4`): sin él, a 21px la punta se lee como un triángulo mudo. Es la única adición y se declara. |
| `compartir` | `M12 15V4` · `M8 7.6 12 3.6l4 4` · `M5 14v5.5h14V14` | Literal, cero cambios. La flecha que SALE de la bandeja (convención de plataforma), jamás el grafo de nodos — ese es de red social, no de un expediente. |

- **CONVERGENCIA MEDIDA:** el `stroke-width: 1.9` de la referencia es
  **exactamente** el `TRAZO` del registry (Ley 12) — cero traducción.
- **SIN HUELLA, y el criterio VIAJÓ CON LA REFERENCIA** (no lo inventé):
  *"Trazo 1.9, sin huella: no son objetos del oficio, son controles."*
- **CHOQUE DECLARADO:** Ley 12 pide "objeto del oficio + UNA huella rellena" —
  su letra habla de glifos de OFICIO; la categoría de CONTROL es **§6bis de
  DIRECCION_ARTE, PENDIENTE DESDE S78** (el glifo del micrófono la pidió
  primero). **Estos dos NO la fundan y su letra NO se escribió** (regla 80: la
  ley va después del gate). Color: TINTA en los dos registros — un control no
  pertenece a una capa; pedirle `registro="capa"` resuelve a tinta a propósito.
- **El typecheck cazó lo que la prosa no:** `IconoNombre` alimenta DOS
  `Record` (dibujantes y colores) — el segundo faltaba y `tsc` salió rojo. Es
  la clase de verificación que L-192 pide, funcionando gratis.
- **Gate por ícono A 21px: PENDIENTE** — ya montados en la galería, fila de 21
  (§2.9). Si la punta o la bandeja no se leen ahí, se simplifican. **Cuando el
  founder los firme, los textos provisionales de C migran (su territorio).**

## 2. LA VOZ SERIF — FRENO DECLARADO, no implementada

Lo que la referencia hace (literal, `ficha-mascota.html:35` y `:107`):

- `.voz` = **Newsreader, serif, itálica, 17.5px, interlineado 1.5**, en tinta
  secundaria. Texto de ejemplo: *«Su expediente se completa de a poco. Cada
  dato que sumás es uno menos que hay que adivinar en una urgencia.»* ·
  *«Esta semana caminó más que la pasada.»*
- Su nota de diseño: *"La serif itálica dice lo que el producto PIENSA — y no
  es microcopy gris de 11px. El mono dice lo verificable y los rótulos. La sans
  se queda con lo que se toca."* (+ el nombre de la mascota en serif a 48).

**POR QUÉ NO LA IMPLEMENTÉ (freno del bloque permanente — contradice letra
FIRMADA):** Ley 3 es firmada y dice **DM Sans única familia UI**; `fonts.ts`
lo repite en su cabecera (*"SIN Playfair, decisión B1"*) y la skill lo pone como
ejemplo INCORRECTO explícito (*"Playfair NO está en v4, no instalarla"*).
Una serif es **enmienda a Ley 3 + una familia nueva** (`@expo-google-fonts/…`
— dep de ASSET, no módulo nativo: probablemente OTA-able, pero el pre-check
L-134 es obligatorio y no lo declara esta sesión).

**EL HALLAZGO QUE SÍ IMPORTA, y es importable sin la fuente:** la referencia no
propone una fuente — propone **un REGISTRO que no tenemos**. Ley 3 asigna sans
(humano/UI), mono (máquina) y la escala display; **nada porta "lo que el
producto piensa"**. Hoy esa voz pide prestado `Texto apoyo` — sans secundario
13px, que es *exactamente* el "microcopy gris" que la referencia critica.
**Y esto cierra un círculo: es la MISMA candidata que C cobró tres veces esta
sesión** ("las voces que la API de `Texto` no tiene") — ahora tiene nombre,
ejemplo y diagnóstico. **Es material de MESA** (enmienda a Ley 3 con gate en
dispositivo), jamás una prop metida al pasar.

## 3. Verificación

`tsc` packages/ui **exit 0** (tras la cura que él mismo cazó) ·
`verify:diseno` **VERDE exit real 0, 16 reglas** — nota de método: un
`EXIT-LINT=1` intermedio fue mi `cd` persistido (el script no vive en
`packages/ui`), no un fallo del lint; corregido leyendo el exit en su cwd
(L-191/L-166 cobrando de nuevo, esta vez a mí).

## Para el gate del founder

1. **`lapiz` y `compartir` a 21px** en la galería (gate por ícono, §2.9) — con
   la pregunta puntual: ¿el corte del bisel del lápiz sobrevive a 21, o la
   punta se simplifica?
2. **La serif como REGISTRO** (no como fuente): ¿el producto gana una voz
   propia? Si sí, es enmienda a Ley 3 + elección de familia + L-134.
