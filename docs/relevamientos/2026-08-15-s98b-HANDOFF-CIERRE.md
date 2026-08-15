# S98-B · HANDOFF DE CIERRE — packages/ui · tokens · el lint y los jueces

**Fecha:** 15-ago-2026 · **Territorio:** `packages/ui` · tokens · el lint y
los jueces (criterio, no lista de archivos).

> **ESTO ES LO VIVO, NO LA HISTORIA.** El registro histórico —lo entregado,
> los choques, el arco de `Celda` en seis vueltas y **las 18 lecciones**—
> vive en **`docs/relevamientos/2026-08-14-s97b-VOLCADO-CIERRE.md`** y no se
> duplica acá. Si algo de abajo no se entiende, la explicación está ahí.

> ⚠️ **El teléfono no fue mío en toda la etapa.** Nada de lo entregado tiene
> gate en dispositivo hecho por B; lo que se verificó en aparato lo hizo A y
> está dicho abajo por su nombre.

---

## §1 · LA COLA, CON ESTADO EXACTO

### 🟡 D-813 — la baldosa elegida: borde teal, relleno magenta
**Es de mi pieza y su diagnóstico ya está completo — la cura es corta.**
Ficha viva en `DEUDAS_CANONICAS.md` (medida por A **muestreando el píxel en
dispositivo**, no de ojo).

```
packages/ui/src/components/SelectorEspecie.tsx:111-119

const fondo = conCapa ? theme.capaBg.comunidad : …   ← FIJO (capa MARCA/AFECTO)
const borde = conCapa ? acentoEleccion         : …   ← accent.control (por casa)
```

**Las dos mitades de la misma señal en desacuerdo**, y en la app donde
`§15b.1` firmó que *el magenta vive SOLO en la marca*. **`accent.control`
está bien resuelto** (`themes/index.ts:137` le da `tealDark` al prestador) y
**el borde lo obedece; el relleno no lo consulta.**

🔴 **Por qué no se veía antes, y es lo que hay que no perder:** la pieza
**nació para el CLIENTE, donde los dos tokens COINCIDEN.** El acoplamiento
era invisible hasta que la montó una casa donde difieren. *Es la misma
familia que D-806: compartir el componente no alcanzó — lo que divergió fue
el contexto donde se monta.*

### 🟡 Reduce-motion — el censo existe, la cura pieza por pieza no
**Solo 4 de 63 piezas miran `useReducedMotion`**: `Destape`, `BarraTabs`,
`PuertaDeOficio` y `Entrada` (esta última curada en la etapa — era **el
portador de la entrada de toda la casa** y miraba solo `memorial`, así que
quien pedía menos movimiento seguía viendo `FadeInDown` en cada pantalla).
Barrer las 59 restantes es **tanda con censo propio**, no un renglón.

### 🔴 El gate por ícono del ⓘ — montado y esperando al founder
`info` está en el registry (glifo **46**) y **sus DOS variantes —con y sin
huella— están montadas en la galería a 21 y 44 px junto a cinco vecinos**
(§6b), con la pregunta escrita al lado: ***¿el ⓘ y el salvavidas se
distinguen a 21 px?*** Si no, sobra uno.

**Mi voto está en el código con su argumento GEOMÉTRICO** (no estético): en
`ayuda` la huella va en `x 9.3 · y 9.5` —el centro exacto— y en el ⓘ ese
centro lo ocupan la barra y el punto. Precedente: **`ia` también va sin
huella, excepción FIRMADA S53**.

☠️ **Con esa firma cierra también la categoría «glifo de control»**, nombrada
desde **S79** y con gate pendiente desde entonces: este ⓘ es su primer
habitante.

### 🟡 Lo chico que queda anotado
- **2 radios de 9×9** a firma (`prestador/(tabs)/mascotas.tsx:426,480`). De
  los «7» originales, **4 eran círculos** (curados) y **1 es el squircle 32 %
  FIRMADO de S53** — no es desvío, es la ley aplicada.
- **`DIRECCION_ARTE` §5.4** todavía lista el **overshoot de la huella de tab**
  como *candidata sin firma*; **la mesa lo firmó el 14-ago** y ya vive en
  `BarraTabs` sin prop de gate. Enmienda pendiente en el doc de A.

---

## §2 · LO QUE ESPERO DE OTROS

**NADA BLOQUEANTE**, y es cierto al momento de cerrar:

- **A** tiene el ascenso de D-806 (`resolverUrlRaza` en `packages/api`) — **no
  es mío**: es un resolvedor de URL de bucket y meterlo en `ui` sería una
  dependencia de infraestructura escondida en el vocabulario visual. C y yo
  llegamos a esa conclusión por separado.
- **Los gates del founder** (§4) no bloquean trabajo: bloquean *declarar
  verde*.

---

## §3 · LAS LEYES QUE LA SUCESORA HEREDA DE NACIMIENTO

**⚖️ La raíz de una pieza es DUEÑA DE SU ESPACIO — y el espacio son DOS
dimensiones.** Delegar la geometría a un hijo deja a la pieza a merced de
cómo la envuelvan. *(La misma `Baldosa` colapsaba a 0 en web y se estiraba a
800 px en Android por declarar una sola.)*

**⚖️ La ausencia no tiene comportamiento portable; la declaración sí.**
⇒ **Probar en las dos plataformas LO QUE NO ESTÁ DECLARADO** — que es una
lista corta y accionable, a diferencia de «probar todo en las dos». *El
verde de una plataforma no viaja a la otra, pero tampoco el rojo.*

**⚖️ Un rango declarado sin un consumidor en su tope es una promesa sin
probar** (lección ⑱). El contrato del `Destape` decía «3 a 5» y con cinco no
entraba; el caso nació el día que la lista dejó de ser fija.
⇒ **Pregunta accionable para toda pieza con rango: ¿existe HOY un consumidor
en el TOPE? Si no, el tope es prosa.**

**⚖️ Un contador que no da cero es una PREGUNTA, no un residuo.** (Un grep de
verificación devolvió `1` y lo dejé pasar: era el patrón viejo vivo en el
header del mismo archivo.)

**⚖️ Las curas de forma cierran POR CONSTRUCCIÓN, jamás por margen.** Tres
márgenes rechazados en un día: **7 px** (el patrón de grilla `47 %`), **0,8
px** (su reemplazo `48 %`, que fallaba SIEMPRE en vez de a veces) y **64 px**
(comprimir la tira del destape, que una traducción más larga se come).
*Un patrón que se comporta distinto según cuánto sobre no es un patrón: es
una coincidencia documentada.*

**⚖️ Un token puesto no es un token aplicado.** Tres casos en la etapa de un
valor escrito que **otro pisa en silencio**, los tres pasando typecheck, lint
y WCAG: el `flexShrink` que no encogía nada · el `overflow` que se comía la
elipsis del `Text` · el alfa del 7 % de la luz, pisado por el estilo animado
(se dibujaba al 100 %).

---

## §4 · EL ESTADO DE LOS INSTRUMENTOS

| Instrumento | Estado |
|---|---|
| **`verify:diseno`** | **VERDE · 32 auto-pruebas** (empezó la etapa en 26). Nacieron R36 (ritmo) · R37 (radios) · R38 (separadores) · R39 (escala) · R40 (placeholders sin firma) |
| **El tercer guard estructural** | `corridas → REGLAS` — nació porque **R35 corría sin estar registrada** y era invisible para los otros dos |
| **R30** | **en 0**, con **57 paths** del registry vigilados. *Disparó solo al poblar `info` y cazó el clon local — y de paso que estaba MUERTO* |
| **El registry** | **46 glifos**, medidos por **las DOS vías** con el mismo conjunto |
| **La galería** | con **testigo de layout** bajo cada grilla y **ancho real** (190 px baldosa · 340 px `Celda`) — *una galería cómoda prueba una versión cómoda de la pieza* |
| **`packages/ui/CLAUDE.md`** | contadores **re-medidos**: 65 componentes · R17 88 exportaciones · 46 glifos |
| **WCAG** | **178 / 0** con la escala y el peso nuevos |

⚠️ **El límite de todos ellos, medido nueve veces en la etapa:** `tsc`,
`verify:diseno` y WCAG **no ven** un truncado, un solapamiento, un corte
mudo, un rol de a11y mentido ni una grilla colapsada. **Dieron VERDE sobre
los nueve defectos reales**, que los encontró gente montando la pantalla.
*El lint protege contra lo que ya sabemos nombrar.*

---

## §5 · PUNTEROS

- **El registro histórico de la etapa:** `docs/relevamientos/2026-08-14-s97b-VOLCADO-CIERRE.md` (18 lecciones)
- **El Norte y su ley:** `DIRECCION_ARTE` **§13** — depósito verbatim, con la enmienda de **N10** y su **escala de ceremonia** (~3000 ms) ya escrita por A. Su hermana mecánica son **R36–R39**.
- **La regla de voz y la escala:** `packages/ui/src/tokens/typography.ts` (N1 ejecutada: `sm` 14 · `base` 16 · `md` 20)
- **Las cuentas de prueba:** `docs/relevamientos/2026-08-13-s97a-matriz-cuentas-prueba.md` — ⚠️ **`vendedorpuro` NO entra con la clave del keychain** (dato de C en su handoff; el keychain no tiene mapa propio: vive en los handoffs de A y C)
- **Los handoffs hermanos vivos:** `2026-08-15-s97a-HANDOFF-CIERRE-2.md` (A) · `2026-08-14-s98c-HANDOFF-CIERRE-2.md` (C)

---

## §6 · LO QUE SOLO CIERRA UN TELÉFONO

Ninguno lo puede cerrar un instrumento mío, y por eso encabezan:

1. **🔴 La escala de N1 — 330 sitios cambiaron de tamaño.** El riesgo es de
   **layout, no de tipo**, y ningún gate lo ve.
2. **Las baldosas curadas** (D-804 + D-805 juntas): cuadradas y en dos
   columnas.
3. **`Entrada` reimplementada** — dejó las layout animations; *«se ve igual»
   es exactamente lo que solo un teléfono confirma*. A la puso como **ojo
   transversal** de su circuito.
4. **El peso del título de `Baldosa`** (`cuerpo`/16). Si falta peso, la salida
   es **variante nueva con gate** (Ley 11), jamás un `style` inline.
5. **El glifo `atender` a 21 px** — riesgo declarado (la diagonal puede
   fundirse con la jamba) y **recambio ya elegido: el vano sin hoja**.

✅ **Cerrados en aparato por A durante la etapa:** **D-801** (la luz mide
`#ECF4F2` sobre papel `#F0F8F6` — un velo, no un disco opaco) y **el ritual
de ~3000 ms**, capturado en 14 frames.

---

**Medido al cierre:** árbol en **0** · `HEAD == origin/main` · `tsc`
ui/cliente = 0 · `verify:diseno` **VERDE, 32 auto-pruebas** · **WCAG 178/0** ·
todo en `origin/main` verificado **por contenido**.
