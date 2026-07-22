# S74-B · VARA CRUZADA M2 — EL ENTITY CHIP **CONSTRUIDO** (V2 provisional)

> Objeto: el chip como quedó en código (`771b7b3` y sucesores), no el
> boceto — la vara `7fca3d9` fue sobre el boceto; orden invertido
> declarado y aceptado por mesa. Fuentes leídas literal:
> `packages/ui/src/components/SelectorOpcion.tsx` ·
> `packages/ui/src/components/AvatarMascota.tsx` ·
> `packages/ui/src/themes/dark.ts` / `palette.ts` · los 4 consumidores de
> `apps/cliente/(tabs)/explorar/*/index.tsx` · `DIRECCION_ARTE.md` §7 ·
> Ley 20 de la skill · el registro del hold. CERO escritura fuera de mis
> rutas: toda cura es PEDIDO A A.

## VEREDICTO: **APTO CON ENMIENDAS** (4 numeradas; ninguna bloquea el gate en dispositivo — E1/E3 son higiene, E2 es decisión chica, E4 es condicional al gate Android)

---

## Punto 1 · borderCurve — SÍ, la forma construida depende de él (en el AVATAR)

- El CHIP no usa `borderCurve`: sus esquinas son `borderRadius` simples
  (`SelectorOpcion.tsx:271-274` — CHIP/2 izquierdas, `radius.suave`
  derechas) → idénticas en iOS y Android.
- El AVATAR sí: `AvatarMascota.tsx:157` y `:193` — `borderCurve:
  'continuous'` sobre `borderRadius: radioSquircle(d)`
  (`RADIO_SQUIRCLE = 0.32`, `:76-78`). **`borderCurve` es solo iOS: en el
  Android del founder el avatar es esquina circular simple al 32%**, y la
  FUSIÓN de la lengüeta (el semicírculo del chip DENTRO de la silueta del
  avatar, `:268-274`) pierde la suavidad continua que las capturas web
  (Chromium ≈ curva continua) sí mostraban. **La firma V1/V2 es EN
  DISPOSITIVO Android (D-284)** — la E1 de mi vara de boceto sigue viva y
  ahora está anclada al objeto.
- **Camino sin borderCurve, relevado ANTES de proponer:** la única
  primitiva squircle de la casa ES esta receta (borderRadius 0.32 +
  borderCurve; `SelectorAvatar.tsx:141-145` la copia con el comentario
  "una sola definición, regla 37"). No existe superellipse SVG en
  `brand/` ni en componentes (`Huella`/`Guijarro` son paths de marca, no
  contenedores de recorte). El camino posible: ClipPath superellipse con
  `react-native-svg` (peer VIVO — Huella/Icono ya lo usan) DENTRO de
  `AvatarMascota`, una sola definición para las 6 tallas. → **E4,
  CONDICIONAL** (abajo): no se propone cura sin síntoma confirmado.

## Punto 2 · La dirección §7 — CUMPLIDA en light/dark; UNA tensión en memorial

- **Color completo:** elegido = `fondoEntidad = accent.controlLleno`
  (`SelectorOpcion.tsx:203-209`; `themes/dark.ts` y `light.ts`:
  `controlLleno: palette.magentaDark` + `sobreControlLleno: '#FFFFFF'`,
  la opción B firmada). ✓
- **Cero borde + sombra:** la rama entidad con lleno pone SOLO
  `boxShadow: theme.elevacion.reposo` (`:284-285`) — ningún hairline
  sobrevive en el camino entity de light/dark, elegido o no. ✓ (Ley 20
  cumplida: elevación sin hairline.)
- **REGISTRO (no enmienda):** en dark `elevacion.reposo` resuelve a
  contacto mínimo (token por diseño, packages/ui CLAUDE.md) — el "con
  sombra" de §7 es casi nulo en dark. El founder firmó las capturas dark
  así; se registra para que nadie lo reporte como bug.
- **E2 — memorial:** la rama de degradación (`:286`) pone `borderWidth:
  BORDE, borderColor` **Y** `boxShadow` JUNTOS. La letra de Ley 20: *"la
  superficie que gana elevación PIERDE el hairline"*. La degradación
  declarada ("tonal con borde, elevación conservada") convive mal con esa
  letra — borde y elevación a la vez es el tercer peso que la ley mata.

## Punto 3 · Los cuatro bordes de la ley del ancho, COMO CONSTRUIDOS — coinciden con el hold

| Borde | El código HOY | ¿Coincide con el hold? |
|---|---|---|
| N=3 la huérfana | `justifyContent: 'flex-start'` salvo N=1 (`:394`) → huérfana en COLUMNA izquierda a 48% | SÍ — el hold la montó como pregunta abierta (columna vs centrada); el código tiene el default COLUMNA elegido y **la firma del founder sobre ese borde sigue abierta** (registro, no hallazgo) |
| N≥5 | ENVUELVE siempre (`flexWrap: 'wrap'` cuando entidad, `:388`) — la alternativa 'tira' queda declarada como pregunta EN el comentario (`:385-387`) | SÍ — "envuelve siempre, firma pendiente" es exactamente el estado del código |
| maxWidth 240 | Construido (`:233`), comentado como PROPUESTA (`:231`) | SÍ |
| Nombre largo | **TRUNCA**: `numberOfLines={columna ? undefined : 1}` (`:301`; entidad no es columna → 1 línea) | SÍ — el montaje decía "trunca" |

**Sin divergencia código-vs-hold en este punto.** Los dos bordes con
firma abierta (huérfana · envolver-vs-tira) tienen default elegido y
pregunta declarada en el propio código.

## Punto 4 · La proporción 52/44 provisional — SEMÁNTICAMENTE sí, ESTRUCTURALMENTE cara de cambiar

- Los comentarios la declaran provisional en ambos lados:
  `AvatarMascota.tsx:85-88` (*"V2 PROVISIONAL… se cierra en dispositivo
  con foto real"*) y `SelectorOpcion.tsx:210` (*"(V2 provisional)"*).
  Nada la trata como firmada. ✓
- **E3:** el `52` vive TIPEADO en tres sitios de `SelectorOpcion`
  (`:266` `paddingLeft: 52 + spacing[2]` · `:294` `width: 52, height:
  52`) más `DIAMETRO.entidad` en `AvatarMascota.tsx:88`, y
  `SOBRA_ENTIDAD = 4` (`:210`) es la derivada `(52−44)/2` escrita como
  literal. Cerrar el provisional en otra proporción = editar 2 archivos /
  5 sitios a mano sincronizados — la clase exacta de L-159 (el número que
  driftea). Provisional debería ser BARATO de cerrar.

## Punto 5 · El contraste — el número construido ES el registrado (recomputado)

`magentaDark #8E1F68` vs `dark0` (base) = **2.47** · vs `dark1` (card) =
**2.35** · vs `dark2` (elevated — el fondo del chip NO elegido en dark,
`:207`) = **2.24** · blanco sobre el lleno = **8.25**. Recomputado por
luminancia relativa WCAG contra los hex vivos de `palette.ts:41-44,87-89`.
**El registro del hold (2.24–2.47 con atenuante; el blanco 8.25 carga el
estado) es exactamente lo construido — sin cambio.** Sigue bajo el 3:1
no-textual con el atenuante firmado por el ojo del founder; sube a deuda
si un usuario real lo reporta (letra del hold, intacta).

**E1 — el hallazgo de este punto:** el JSDoc de `SelectorOpcion.tsx:113`
dice *"dark usa pinkDark — magentaDark se hunde, medido"*. **FALSO contra
el objeto:** `themes/dark.ts` construye `controlLleno:
palette.magentaDark` (la opción B que el founder firmó). El comentario es
resto de una iteración pre-firma; un lector futuro podría "corregir" el
tema a pinkDark citándolo — la clase exacta de prosa-que-miente (L-141 en
código).

---

## ENMIENDAS (todas PEDIDO A A — B no escribe una línea en packages/ui)

1. **E1 · PEDIDO A A (una línea, higiene):** reescribir el JSDoc
   `SelectorOpcion.tsx:113` a la verdad firmada — dark usa magentaDark
   (opción B, registro 2.24–2.47 con atenuante). El comentario hoy
   contradice `themes/dark.ts:60-61`.
2. **E2 · PEDIDO A A (decisión chica, con voto):** memorial
   (`SelectorOpcion.tsx:286`) porta borde + boxShadow juntos, contra la
   letra de Ley 20. Voto de esta vara: memorial conserva el BORDE y
   pierde la SOMBRA — la elevación es parte de la presencia §7, y
   memorial no celebra; el borde tonal ya dice el estado. Si la mesa
   prefiere lo inverso, la cura es igual de barata — lo ilegal es el
   tercer peso.
3. **E3 · PEDIDO A A (chico, paga futuro):** derivar la proporción en UNA
   constante por archivo (`const AVATAR_ENTIDAD = 52` en SelectorOpcion
   usada en `:266/:294` + `SOBRA_ENTIDAD = (AVATAR_ENTIDAD − ALTO) / 2`)
   para que cerrar el provisional 52/44 sea un cambio de un número por
   archivo, no una cacería de literales.
4. **E4 · CONDICIONAL AL GATE ANDROID (no ejecutar hoy):** si el founder
   confirma en SU dispositivo que la fusión atenuada por la ausencia de
   `borderCurve` duele (punto 1), el camino relevado es ClipPath
   superellipse con react-native-svg dentro de `AvatarMascota` (una sola
   definición, 6 tallas, peer vivo). Sin ese síntoma confirmado, NO se
   toca la primitiva — cura sin síntoma sería el verosímil-falso de
   diseño.

**Registros sin enmienda:** N=3 huérfana y envolver-vs-tira con default
elegido y firma founder abierta (el gate los cierra) · sombra dark de
contacto mínimo por diseño del token.
