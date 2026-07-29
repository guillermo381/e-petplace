# S81-B5 · EL CENSO DEL SELECTOR — y el peor caso redibujado en el lenguaje aprobado

**Sesión B · 29-jul-2026 · CERO construcción.** La lámina v2 vive en
`2026-07-29-s81-B5-laminas-lenguaje-aprobado.html`. El founder firma viendo.

---

## 1. ¿Qué dibuja las píldoras de la reserva? — UN solo componente

**`SelectorOpcion` en sus modos — los CUATRO pasos, mismo archivo**
(`apps/cliente/src/app/(tabs)/explorar/paseo/index.tsx`):

| Paso | Línea | Modo |
|---|---|---|
| mascota | `:275` | `entidad` (entity chip S73) |
| duración | `:292` | `disposicion="grilla"` |
| día | `:311` | `disposicion="tira"` |
| hora | `:351` | `disposicion="grilla"` |

**Precisión de vocabulario (Ley 21): NO son píldoras.** Todo chip no-entidad
es **rectángulo suave `radius.suave` 10** (`SelectorOpcion.tsx:284`, con el
comentario de la ley al lado: *"la píldora quedó para lo que INFORMA —
Insignia intacta"*). La píldora percibida es el rectángulo 10 con alto 44 y
etiquetas cortas.

## 2. Qué prop separa qué — y el reparto de consumidores

**La piel la separa UNA prop: `entidad`** (contorno fusionado + elevación +
avatar + lleno magentaDark al elegir) vs el chip estándar (borde 1.5
`border.subtle` + `bg.card`). **`disposicion` es LAYOUT, jamás piel** (fila /
tira / grilla / columnas comparten anatomía de chip idéntica). No hay una
"card con borde" distinta del "chip píldora": son el mismo nodo con la misma
piel.

**El censo, DOS escalas declaradas (patrón de los contadores de componentes):**

- **Por INSTANCIA JSX (medido S81-B5, script sobre `<SelectorOpcion` en ambas
  apps): 77** — `fila` 28 · `grilla` 27 · `tira` 16 · `entidad` 4 ·
  `columnas` 2; con `multiple` 15 de las 77; cliente 38 · prestador 39. La
  lista archivo:línea completa quedó en el output del script (sesión B) y es
  regenerable con el mismo grep.
- **Por CONSUMIDOR DE SUPERFICIE (el "32" de D-499):** el censo S73
  (`2026-07-22-s73a-censo-relleno-contorno.md`) cuenta **32 filas de
  superficie** — agrupa los selectores de una pantalla en una fila (p.ej.
  "explorar/paseo: mascota · duración · día · hora" = 1-2 filas) e incluye la
  galería como fila 32 (N/A herramienta). **Las dos escalas son correctas y
  miden cosas distintas** — que nadie "corrija" una con la otra.

**La anatomía literal del reposo aprobado** (para que la lámina no invente):
alto 44 (`ALTO`, `:42`) · padding H 16 (`spacing[4]`) · radio 10 · borde 1.5
(`BORDE`, `:41`) `border.subtle` = `rgba(0,0,0,.05)` (light `:149`) · fondo
`bg.card` `#FFFFFF` · label DM Sans **medium 13** (`size.sm`) **UNA LÍNEA**
(`numberOfLines={columna ? undefined : 1}` — en grilla NO envuelve, medido) ·
elegido TONAL control: tinte `capaBg.comunidad` = `pinkAlpha08`
`rgba(255,0,175,.08)` + borde `accent.control` `#8E1F68` + texto `#8E1F68`.

> **Corrección declarada sobre la lámina B4:** su panel (a) usó borde
> `#E3E0EF` (border.default) y tinte magenta 8% aproximado a mano — el
> literal aprobado es `border.subtle rgba(0,0,0,.05)` y `pinkAlpha08`. La
> lámina v2 es la EXACTA; la B4 queda como exploración de intensidades, no
> como referencia de anatomía.

## 3. ¿Fragmentación? — NO

No hay segunda pieza. Los cuatro pasos de la reserva, la bitácora, los
talleres del prestador, los durantes y las preferencias dibujan chips con el
MISMO componente. La única bifurcación de piel es la prop `entidad`, que es
espec firmada (S73), no fragmentación. **La casilla 3 de la tanda queda
VACÍA — nada que nombrar.**

## 4. El peor caso EN EL LENGUAJE APROBADO (lámina v2)

Dos marcos, cero variable escondida:

1. **El hábitat aprobado — 3 hermanos** (el set chico típico de la reserva,
   tratamiento exacto).
2. **El MISMO lenguaje a N=23** — los 23 `nombre_familia` reales de
   `cat_objetivos_adiestramiento` (DB viva, mismo set y mismos 3 elegidos que
   B4), en grilla con el chip literal.

**La pregunta que el founder firma viendo: ¿la pieza que funciona con 3
hermanos sobrevive a 23?** Registro honesto impreso en la lámina: en grilla
el label es UNA línea — los nombres largos de la voz de familia hacen chips
anchos y filas de 1-2 chips; eso ES el lenguaje aprobado a 23, no un defecto
del dibujo. (La pantalla viva de la bitácora ya vive en este lenguaje — la
lámina v2 es su espejo fiel; la B4 exploraba intensidades alternativas.)

## Nota de encadenamiento (B4 → B5)

Si el founder firma que el lenguaje aprobado NO sobrevive a 23, las láminas
B4 (b)/(c) son las intensidades alternativas ya dibujadas del MISMO set — y
la regla de decisión de la mesa (el árbitro = el catálogo, 19.8 sin firma)
queda con todos sus datos sobre la mesa. **Cero construcción hasta esa
firma; `SelectorOpcion` no se toca.**
