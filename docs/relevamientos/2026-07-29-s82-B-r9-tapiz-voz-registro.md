# S82-B r9 · PAPEL TAPIZ preparado-apagado · LA VOZ del producto · el guard R16

**Sesión B · 29-jul-2026.** Archivos (76h): `packages/ui/src/tokens/palette.ts` ·
`themes/light.ts` · `tokens/typography.ts` · `fonts.ts` ·
`components/Texto.tsx` · `gallery/TokenGallery.tsx` · `scripts/verify-diseno.mjs`
· este reporte. **Cero pantallas tocadas.**

**El zip de láminas NO estaba al abrir** (medido: `docs/laminas/` con los mismos
6 archivos; el único hit de "tapiz" en todo el repo es mi propio reporte r8) →
sigo con los cuatro candidatos, como la orden autoriza. El quinto entra cuando
llegue: es UNA línea en `papelTapizCandidatos`.

## 1. EL TOKEN — `palette.papelTapiz`, y NACE APAGADO

Entra como la orden pide: **`bg.base` del tema claro resuelve a `papelTapiz`** y
**`light0` queda INTACTO** (tu punto 1 resuelve mi hallazgo: no se toca un token
de dos consumidores para cambiar uno — `accent.ctaTexto` no se tiñe).

**Pero nace con el valor de `light0` — apagado, cero cambio visual.** El porqué
es una TENSIÓN REAL entre dos puntos de tu propia orden, y la declaro en vez de
elegir en silencio: el punto 1 pide que `bg.base` resuelva a `papelTapiz` **ya**,
y el punto 4 pide que la separación del prestador se construya **con el valor
firmado, no antes**. Con un color encendido hoy, el prestador —que monta el mismo
`lightTheme`— recibiría el tinte que el punto 5 de r8 le prohíbe. Con el apagado:
el cableado vive, el color espera su firma, y nadie recibe nada. Patrón de la
casa (preparado-apagado, D-456/D-579). **Reversa: una línea** (`papelTapiz` a
`light0`, que es donde está).

## 2. EL VALOR NO SE DECIDIÓ — la lámina de gate está montada

Los candidatos van al teléfono como pediste: **sección nueva en la galería**
(`/gallery`, alcanzable por URL en ambas apps — la herramienta ya existía, no
nace pantalla). El switch pinta el panel ENTERO con el candidato: **el tinte se
juzga en contexto, jamás como muestra al lado de otra.** En el panel viven, todo
junto para una sola pasada: los 5 candidatos (papel + 2/3/4/5%) · el agua en sus
**dos alfas vivos** · los dos glifos de control a **21 y 28** · y la variante
`voz` estrenada con la frase de la referencia.

Nota de composición declarada: el switch es `SelectorOpcion` y **no**
`SelectorSegmentado` — cinco candidatos es elegir un VALOR, no cambiar de vista
(Ley 19.3 acota el segmento a 2-3, y su propio dev-warn lo dice).

## 3. ⚠️ CORRECCIÓN A MI PROPIA MEDICIÓN DE r8 — el tinte SÍ tiene costo

**En r8 te dije "cero pares caen bajo mínimo". Era incompleto, y lo cazó el
lint.** Mi script de r8 midió los pares texto/**`bg.base` directo**; los que
caen son los de texto sobre **TINTE** (`successBg`/`warningBg` son rgba con
alpha, y el tinte se composita SOBRE `bg.base` — al mover el fondo, se mueve el
tinte y con él el par). R12, que mide sobre el tema VIVO aplanado, lo destapó en
la prueba de fuego. Re-medido con los valores **reales** de `palette.ts` (mi
primer intento usó ochre de memoria — L-166 cobrando otra vez, ahora a mí):

| Fondo | successText/Bg | warningText/Bg | dangerText/Bg |
|---|---|---|---|
| **papel (hoy)** | 4.59 | **4.50** (al filo) | 4.69 |
| 2% | 4.47 ✗ | 4.39 ✗ | 4.56 |
| **3%** | 4.42 ✗ | 4.35 ✗ | 4.51 |
| 4% | 4.34 ✗ | 4.28 ✗ | 4.43 ✗ |
| 5% | 4.29 ✗ | 4.24 ✗ | 4.38 ✗ |

**Lectura honesta:** `warningText` ya vive **al filo exacto** (4.50) SIN tinte —
cualquier tinte lo tumba. Encender el tapiz exige, en el mismo acto, **un paso
más oscuro en `successText` y `warningText`** (exactamente la cirugía que
`dangerText` recibió en r5). Servido y medido con el 3%:

- `successText` `#1E7A33` → **`#1B6E2E`** (4.42 → **5.18**)
- `warningText` `#925F0C` → **`#875809`** (4.35 → **4.90**)

Con 4-5% cae además `dangerText` (recién curado) — **argumento medido a favor de
2-3%**, que se suma a mi recomendación del ojo. El costo no es prohibitivo: son
dos pasos de rampa, la misma operación ya firmada dos veces.

## 4. R16 — EL GUARD QUE MECANIZA "EL PRESTADOR NO RECIBE TINTE"

El modo de fallo que cierra es **el silencio**: el día que alguien encienda el
valor firmado, el prestador se tiñe solo y nadie lo nota hasta un gate. R16:
**si `papelTapiz !== light0`, `lightOficio` TIENE que pisar `bg.base` a
`light0`**. Hoy informa `tapiz=apagado · separación-prestador=no construida` y
pasa; cuando el color llegue, **exige la separación en el mismo acto** (patrón
del guard de la vitrina S78: el orden nombra el artefacto que abre).

**ROJO PRODUCIDO, y pagó doble:** encendí el 3% en `palette.ts` sin construir la
separación → **exit 1 con TRES fallos**: R16 (el prestador se teñía) + los DOS
pares de status del §3 que yo había declarado sanos. Restaurado y verde. *La
prueba de fuego no confirmó lo que esperaba: encontró lo que me faltaba.*

**Buena noticia para el día de la firma:** `lightOficio` (el tema del prestador)
**ya existe** en `themes/index.ts` — la separación es un `bg: { ...lightTheme.bg,
base: palette.light0 }` adentro de ese objeto. Una línea, cuando haya valor.

## 5. LA VOZ DEL PRODUCTO — `Texto variante="voz"`, capacidad aditiva

Tu reencuadre ejecutado: **no falta tipografía, faltaba REGISTRO.** Construido
DENTRO de DM Sans:

- **Itálica REAL** (`DMSans_400Regular_Italic`) del **mismo paquete ya
  instalado** (`@expo-google-fonts/dm-sans ^0.4.1`): **cero dep nueva, cero
  módulo nativo ⇒ cero L-134** (asset del bundle, viaja por OTA). **Ley 3
  INTACTA** — sigue siendo DM Sans, familia única de UI.
- Por qué la itálica se CARGA y no se sintetiza con `fontStyle`: el sintético no
  es consistente entre plataformas (Android no lo hace como iOS). En RN el
  archivo se elige por `fontFamily`.
- La receta: **itálica · md/18 · interlineado de prosa (1.6) · tinta
  secundaria.** El 18 la pone por encima del cuerpo (15): la voz no es nota al
  pie. El interlineado, porque es la única variante con dos o tres líneas por
  diseño. La tinta secundaria, porque piensa en voz baja sin desaparecer como el
  `apoyo` —que es justo el "microcopy gris" que la referencia critica.
- **Su prueba, escrita en el JSDoc:** *si la frase la podría haber dicho el
  producto sobre la mascota, es `voz`; si describe un control, no lo es.*
- **Aditiva de verdad: cero pantallas cambian** hasta que alguien la use.

### Dónde se puede VER una vez (tu pedido del punto 6)

**Hoy, ya: en la galería** — `/gallery` → la sección ⭐ GATE S82-B r9, con la
frase de la referencia (*"Su expediente se completa de a poco…"*) sobre cada
candidato de fondo. **En producto: en NINGUNA pantalla todavía** (es aditiva y
no toqué pantallas). La candidata natural es **el perfil de mascota** —donde la
referencia la ubica, sobre el expediente incompleto—, y es **de C**: cuando
firmes el registro, ella la usa en una línea (`<Texto variante="voz">`).

## 6. Lo que NO toqué, y por qué

- **El agua (punto 5):** tu corrección aceptada — si algo se mueve, sube el
  PERFIL (0.04 → 0.06), nunca baja el Hogar que acabás de firmar. **No lo
  ejecuté**: vive en dos pantallas de C y esta orden dice cero pantallas. En la
  lámina de gate se ven los dos alfas sobre cada candidato, así que entra al
  gate junto con el tinte, como pediste.
- **El oscuro (punto 3):** no se toca. Voto (a) ratificado por vos.
- **La separación por slot (punto 4):** con el valor firmado. R16 la exige.

## 7. Verificación

`verify:contrast` **178 pares / 0 fallos** (obligatorio por tocar tokens/themes)
· `verify:diseno` **VERDE exit real 0 · 17 reglas** (15 encendieron en
auto-prueba + R9 informativa + R16 nueva) · `tsc` **packages/ui 0** ·
**prestador 0** · **cliente 2 por WIP AJENO** (`vacunas/[mascotaId].tsx` de la
pista A, su commit `672a67e`: un idioma como `string` y el
`transitionTimingFunction` de Reanimated en un `View` de RN — cero errores en
archivos míos, atribución verificada).

Nota de método contra mí: **dos veces** en esta ronda leí un exit falso por
`cd` persistido (el script no existe dentro de `packages/ui`). Los exits del
reporte son los del comando en su cwd correcto (L-191).

## Para el gate en dispositivo — la pasada única

1. **El candidato de papel tapiz** (5 opciones, el switch los pinta enteros).
2. **El agua** 4% vs 6% sobre el elegido — y la unificación al 6%.
3. **`lapiz` y `compartir` a 21px** (§2.9): ¿sobrevive el corte del bisel?
4. **La voz del producto** en itálica sobre el fondo elegido.

Al firmar el candidato: token + separación por slot + los dos pasos de
`successText`/`warningText` + `verify:contrast` completo, en una ronda.
