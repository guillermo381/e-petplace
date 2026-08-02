# S83 · CENSO DE ENMIENDAS DE LEY

> **Para qué existe:** que nadie construya contra letra que ya no rige. Molde: el
> censo de S82.
>
> **Cada entrada trae: origen · fecha · QUÉ MURIÓ con ella · estatuto.**
> **Estatuto FIRMADA = rige. CANDIDATA = NO rige** (regla 80: la ley se escribe
> después del resultado firmado).
>
> **Procedencia marcada:** **(A)** medido por la pista A · **(B)/(C)** reportado
> por quien lo midió · **(founder)** firma en dispositivo.

---

# PARTE I — LAS FIRMADAS (RIGEN)

## 1 · §15b.0 GANA SU TERCER VERBO — CUENTA
**Origen:** firma founder, 31-jul-2026 · **Vive en:** `DISEÑO_EXPERIENCIA` §15b.0

> *"**CUENTA es tu relación con la plataforma: identidad, plata que entra,
> acceso.** El discriminador es medible: **si la familia no lo ve y no configura
> la oferta, es Cuenta**."*

Los tres verbos quedan: **HOY hace · NEGOCIO ofrece · CUENTA es tu relación con
nosotros.**

**LO QUE LO HACE DISTINTO DE LOS OTROS DOS: su discriminador SE PUEDE CORRER.**
El juez es **`v_prestadores_publicos`** (medición de C16) — *"¿la familia lo
ve?"* no se opina, se consulta la vista. **Y la regla que lo vuelve exigible:
cuando el juez y la intuición discrepan, GANA EL JUEZ; si la vista está mal, se
enmienda LA VISTA** — que es un acto declarado, no una interpretación.

**QUÉ MURIÓ:** que "dónde va esto" fuera criterio opinable en el borde. Y **"Tu
cuenta" como nombre de celda**: pasa a ser el nombre de la TAB, y **ninguna celda
adentro lo lleva** (un contenedor y su contenido no comparten nombre).

**Estrenó con un caso real el mismo día:** corrido sobre los cuatro campos de
contacto, **la vista dice que no los expone** → D-601.

## 2 · UN TINTE POR CASA, EN LOS DOS TEMAS
**Origen:** firma founder, 1-ago-2026 (B33/B34) · **Vive en:** `palette.ts` +
`themes/index.ts` + R16

**`papelTapizOficio` `#F4F8F6`** en claro (**teal puro al 3% sobre `light0` — la
misma receta del magenta del cliente**) y **`tapizDarkOficio`** en oscuro. El
tapiz del cliente quedó al **5%** tras el gate (B32: el 8% duró un gate — *"muy
pesado"*).

**QUÉ MURIÓ — y es letra firmada DOS VECES en S82:** *"el prestador NO recibe
tinte. Es fondo del cliente"* (orden founder r8 §5 y r9 §4). **DEROGADA.**
Marcada como tal, con su fecha, **en el propio JSDoc de `lightOficio`** — donde
engañaba a quien greppeara el comentario en vez del valor (A).

**R16 ENMENDADA EN EL MISMO ACTO**, y **verificada por sabotaje (A), las tres
mitades en `exit 1`**: el brazo claro · el oscuro · **y un brazo NUEVO que B
agregó sin que nadie se lo pidiera** — *"papelTapiz y papelTapizOficio son el
MISMO hex: la separación es de nombre y no de color"*. **Sin ese tercer brazo, la
enmienda quedaba decorativa: separar dos casas por nombre con el mismo valor
habría pasado en verde.**

## 3 · EL GLOW ES DE LAS DOS CASAS, DARK-ONLY
**Origen:** firma founder, 1-ago-2026 (B34/B29)

El octavo slot **`accent.atmosfera`** — cada casa en su color (`pink` el cliente
· el verde del oficio · `textMemorialDark` en memorial).

**Nota que la enmienda deja explícita: `dark-only` es FIRMA DEL FOUNDER, no
default heredado** (B29 lo pasó *"de DEFAULT a LETRA FIRMADA"`). La diferencia
importa: un default se cambia sin ceremonia; **una letra firmada se enmienda**.

**QUÉ MURIÓ:** que el glow fuera del cliente y el prestador quedara sin
atmósfera.

## 4 · LOS OCHO SLOTS *(qué resuelve cada uno)*
**Origen:** acumulados S82→S83 · **Vive en:** `themes/index.ts`

| # | slot | qué resuelve |
|---|---|---|
| 1 | `bg.base` | el fondo: **un tinte por casa** (§2) |
| 2 | `accent.cta` | oro el cliente · tealDark el oficio |
| 3 | `accent.ctaTexto` | el par del anterior |
| 4 | `accent.ctaElevado` | el relieve del CTA, **solo del cliente** |
| 5 | `accent.control` | el acento de ELECCIÓN (B6), en **sus dos registros** |
| 6 | `accent.active` | el estado ACTIVO — **cerró D-598** (B13) |
| 7 | `accent.marcaEleccion` | el color de LA PATA (B19) |
| 8 | `accent.atmosfera` | el glow por casa (B34) |

**QUÉ MURIÓ con el mecanismo:** que reusar una pieza del cliente exigiera
**acordarse** de pasarle el color correcto en cada consumidor. **Ahora el tema
decide y el componente no sabe en qué app corre.**

## 5 · D-598 ARBITRADA — gana §15b.1
**Origen:** firma founder en dispositivo, 31-jul · **Vive en:** `themes` +
`CLAUDE.md:160`

**Gana `§15b.1`**: *un acento de oficio para TODO estado y control funcional; el
magenta vive SOLO en la marca.*

**QUÉ MURIÓ:** la **posición de mesa de S72** (*"`accent.active` es reserva de
MARCA… se deja como está… que el prestador vea magenta en focus y en la tab
activa NO es desvío"*). **Enmendada y derogada EN SU ARCHIVO** (`CLAUDE.md:160`),
con el texto original conservado como registro — porque **dos letras firmadas que
se contradicen son peores que una equivocada: cualquiera cita la que le conviene
y está "en regla"**.

**Nota justa: S72 previó su propia salida** (*"si el founder lo quisiera teal
algún día, es enmienda de tema+ley"*). Lo que faltaba no era el argumento: **era
la firma sobre píxeles.**

**Y la pata:** comunica *"este es el seleccionado"* y **va en el teal del
oficio** (B19 ④).

## 6 · EL AGUA ENTERA — la receta del Hogar
**Origen:** firma founder (B21/B22) · **Vive en:** `MarcaDeAgua`

La variante del Hogar pasa a ser **el default**, y la escala del tapiz gana sus
tres niveles.

**QUÉ MURIÓ:** las **tres implementaciones inline con anatomías distintas** que
D-597 censó (0.06/210/entera · 0.04/1000/sangrada · 0.03/280/esquina) — más el
JSDoc que declaraba muerta una variante que el Hogar estaba pintando.

> **⚠️ EL CHOQUE QUE ABRE, Y QUEDA ABIERTO — NO RESUELTO:** **una silueta entera
> IDENTIFICA**, y eso toca la **LEY 4**. **Vuelve a la mesa.** Se marca acá para
> que nadie lo tome por resuelto: **el agua entera está firmada; su relación con
> la Ley 4 no.**

## 7 · EL RASTRO DEL ESPEJO MUERE
**Origen:** firma founder **en pantalla, contra la lámina** (C34)

**QUÉ MURIÓ:** el rastro que la lámina proponía. **Y el precedente que deja es lo
que importa: la pantalla real le ganó a la lámina en su primer choque directo** —
que es exactamente lo que la enmienda del método (§1.1 del acta) predecía.

## 8 · EL LOGO SOLO PNG
**Origen:** medición + decisión, S83 (C)

**QUÉ MURIÓ:** **"Tomar foto"** como camino de logo — **consecuencia honrada, no
efecto colateral**: si el SVG no entra por medición, el camino que lo suponía se
retira en vez de quedar prometiendo.

*(El porqué medido del SVG lo reportó C; A no lo re-midió y lo cita como suyo.)*

---

# PARTE II — LAS PROPUESTAS **SIN FIRMA** (NO RIGEN)

> **Ninguna de éstas es ley.** Están acá para que se firmen o se cierren, no para
> que se citen como criterio.

## 9 · Candidata #15 — UNA REGLA CON AUTO-PRUEBA PUEDE TENER BRAZOS QUE NO SALEN ROJOS
*(el guard del guard)* — **40 brazos, 8 decorativos, en DOS familias** (censo de
B). **B7 los pagó**, así que su costo dejó de ser hipotético: **lo que queda por
firmar no es "¿vale la pena?" sino "¿es ley de acá en adelante?"**

## 10 · Candidata #16 — UN GREP POR LA PROP MIDE QUIÉN LA PASA, NO QUÉ SE RENDERIZA
De la **autocorrección de B**: el censo por prop dio cero consumidores; el censo
por render encontró **tres aguas inline**. **L-192 en el método de búsqueda.**

## 11 · Candidata #17 — RAZONAR EL EFECTO DE UN TOKEN NO ES MEDIRLO
**Tres casos en un turno, uno de esta mesa** (A calculó a mano sobre un
`#FAF9F7` que **ya no era el fondo**). **Su modo de falla es un número
plausible.**

## 12 · EL REFACTOR GENÉRICO DE BRAZOS
**Con su costo dimensionado** por B. Sin firma.

## 13 · LAS FICHAS NOMBRAN TERRITORIO, NO PISTA
*"Quien toque `apps/prestador`"* no caduca; *"C"* caduca al próximo reparto — **y
caduca en silencio**. **Firmarla ANTES de barrer** ahorra barrer dos veces.

---

## APÉNDICE · LO QUE **NO** ES ENMIENDA Y CONVIENE NO CONFUNDIR

- **La regla de las piezas** (§4 de la orden de cierre) es **ley nueva firmada**,
  no enmienda de una anterior — vive en el acta y en D-597.
- **El paso ⓪** y **el cuarto estado** son enmiendas de **CONTRATO** (reglas 82 y
  84), no de letra de diseño: viven en `CONTRATO_TRABAJO` v1.24.
- **D-611 cerrada** no es una enmienda: es una ficha que se pagó.
