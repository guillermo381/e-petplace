# S89-B · EL PAQUETE DEL GATE ÚNICO — la campana: un dedo, tres cierres

> **Orden de apertura S89-B ②.** Al mismo ojo del founder viajan: **el ORO**
> (enmienda ⑦, medición servida) · **el estudio 10/12/14** (el mínimo legible
> de la huella) · **el defecto huella-invisible-en-muro**. Todo vive en UNA
> sección de la galería — el gate es un scroll y una mirada.
>
> **⚠️ Y UN HALLAZGO NUEVO de armar este paquete, que el gate necesita saber
> ANTES de mirar: la cura del defecto NO está aplicada en el producto del
> prestador** (§ Cierre 3 abajo, con el literal y el pedido a C).

---

## Las rutas

| qué | dónde |
|---|---|
| capturas de la sección (galería, web 420px, tres temas) | `scripts/capturas/s89-b-gate-campana/seccion-campana-{claro,oscuro,memorial}.png` |
| la superficie viva (dispositivo o web) | galería del prestador `/gallery` → sección **«Badge (S88) — el contador de novedades sobre un ícono»** (una sola sección contiene los tres cierres) |
| la medición del oro con sus declaraciones de ley | `docs/relevamientos/2026-08-06-s89b-MEDICION-oro-campana.md` |
| el instrumento (reproducible) | `scripts/medir-oro-campana.mjs` · capturas: `scripts/captura-s89b-gate-campana.mjs` |

*Nota de captura: el toast rojo al pie de la captura clara («button cannot
contain a nested…») es la clase D-311 — artefacto dev de RN-web, no viaja a
ningún bundle. Cero errores JS en las tres corridas.*

---

## Cierre 1 — EL ORO (enmienda ⑦)

**Qué mirar:** la fila **«estudio del ORO #FCBC1D»** (última de la sección):
la huella ORO sobre las cuatro superficies, cada una con su ratio medido.

- **La pregunta para el ojo:** ¿la huella oro se lee COMO NOVEDAD de un
  vistazo sobre el **muro claro (3.41)**? Es la superficie más justa — hoy el
  papel da 5.51 ahí. Muro noche (5.95) y memorial (10.40) son holgados.
- **Papel (1.62 ✗) no es pregunta de ojo — es decisión de mesa:** el rojo se
  muestra A PROPÓSITO (mismo precedente que el par del defecto). La medición
  declara la salida natural: sobre papel la huella conserva una respuesta
  legible; el oro rige donde contrasta. Lo firma el founder.
- **Lo que este gate NO cierra solo — el choque §15b.2** (medición §②): el
  oro sobre el muro claro (3.41) cae DEBAJO del 3.77 que §15b.2 ya prohibió
  como acento funcional sobre el muro. **Si el founder firma el oro sobre el
  muro, §15b.2 gana su excepción EN SU ARCHIVO** (precedente del magenta,
  S83) — si no, el oro sobre el muro claro no rige.
- **El pintado ocurre DESPUÉS de este gate, nunca antes.** Las tres
  condiciones firmadas viajan intactas: jamás un número · jamás rojo de
  alarma · jamás anima.

## Cierre 2 — EL ESTUDIO 10/12/14 (el mínimo legible)

**Qué mirar:** la fila `10 · 12 · 14` (entre el par del defecto y el estudio
del oro). La pieza eligió **12** (`LADO_HUELLA`); la condición de la lámina
dice *«tamaño mínimo legible VERIFICADO EN DISPOSITIVO»* — el founder ya vio
la campana viva en las dos apps sin objetar tamaño (S88); **este es el cierre
FORMAL de esa condición: una mirada y una palabra.**

- La fila pinta la huella en el acento del tema activo (el toggle de la
  galería la muestra en las tres casas).
- **Si la enmienda ⑦ se firma, el tamaño se re-mira EN ORO** — el estudio del
  oro está en el mismo cuadro, a un renglón: las dos decisiones se toman
  viéndose.

## Cierre 3 — EL DEFECTO huella-invisible-en-muro

**Qué mirar:** el par sobre los dos muros (claro y noche): **izquierda el
defecto reproducido a propósito** (`superficie` por default sobre el muro —
la huella se funde, acento ≡ muro, 1.00) · **derecha la cura**
(`superficie="muro"` → papel, §15b.2: 5.51 / 9.61).

### 🔴 EL HALLAZGO — la cura vive en la pieza y en el cliente; el PRESTADOR no la pasa

Medido en esta sesión, con el literal:

- `packages/ui/src/components/Badge.tsx` — la regla existe (muro → papel). ✓
- `apps/cliente/src/app/(tabs)/hogar/index.tsx:580` — el cliente la pasa:
  `superficie={esMemorial ? 'clara' : 'muro'}`. ✓
- **`apps/prestador/src/components/techo-oficio.tsx:431`** — el prestador
  monta `<Badge n={…} forma="huella">` **SIN `superficie`** ⇒ la huella
  resuelve a `accent.active`, y `lightOficio.accent.active = palette.tealDark`
  (`packages/ui/src/themes/index.ts:137`) **≡ el hex del muro** ⇒
  **la huella del prestador en CLARO es INVISIBLE HOY en producto (1.00).**
  En oscuro se salva de rebote (`darkOficio.active` = teal puro, 6.57 sobre
  tealDarkNoche) — por eso ningún ojo lo vio: el defecto solo existe en
  claro Y con avisos sin leer.

Es exactamente la clase que el propio `techo-oficio.tsx` documenta para la
`Insignia` de cohorte (~línea 334): *«una prop cuyo olvido no rompe nada y no
se ve — la regla del muro vive con el muro»*.

**PEDIDO A C (autocontenido, una palabra en la línea 431):**

```tsx
<Badge n={avisosSinLeer === true ? 1 : 0} forma="huella" superficie="muro">
```

*(Si la enmienda ⑦ se firma, la respuesta del Badge sobre el muro puede pasar
de papel a oro — pero eso es el PINTADO, después de su gate. La prop faltante
es defecto HOY con la letra de HOY: no espera al oro.)*

**Candidato de guard (declarado, no construido — decide la mesa):** en apps,
todo montaje de `forma="huella"` DECLARA `superficie` explícita — el default
silencioso es exactamente el olvido que no se ve. Hoy daría: prestador ROJO
(el defecto real) · cliente VERDE. No se construyó en esta sesión para no
pintar rojo el verdicto compartido por un defecto que ya viaja con pedido;
si C lo cura y la mesa lo quiere, es una regla de diez líneas sobre la
maquinaria de R32.

---

## ✅ EJECUTADO (S89, orden 2 del founder — «salta la fila: defecto vivo en producción»)

La orden llegó dirigida a C con el detalle de este paquete; **se ejecutó en
esta pista (B) por adjudicación directa del founder, con el cruce de
territorio DECLARADO** — al momento de ejecutar, la sesión C estaba VIVA en
su worktree (commits `96fd21e` → `b93b310`, minutos antes) avanzando su orden
de apertura, y dos manos en un mismo árbol son una carrera: la cura se aplicó
acá, donde no escribe nadie más. Si C también la aplica, el merge es la misma
palabra en la misma línea — trivial para A.

- **La cura:** `techo-oficio.tsx` — `superficie="muro"` en el montaje del
  Badge + el comentario con la regla y su porqué medido (1.00 → 5.51/9.61).
  Restaura lámina firmada: no pide gate nuevo; el ojo del founder la ve en
  el gate único del bundle.
- **El par que fija la regla:** nace **R33** en `verify:diseno` («la
  superficie de la huella se declara») — en apps, todo `forma="huella"`
  declara `superficie`; el default silencioso murió. Con fixture propio en
  la auto-prueba (25 reglas encendieron) y **el discriminador corrido sobre
  el montaje REAL: la versión pre-cura sale ROJA (1/1 montaje), la curada
  VERDE (0/1)**. Condición de muerte escrita: si `Badge` vuelve `superficie`
  obligatoria por tipo con `forma="huella"`, el tsc la cubre y R33 se retira
  con lápida.
- Verificación (cero dedos, regla 87): tsc ×3 verde · `verify:diseno` VERDE ·
  `verdicto.mjs` TODO VERDE.

---

# ⚖️ VERSIÓN FINAL (S89, orden 4) — EL ORO, FIRMADO POR EL FOUNDER

**La firma, sobre la medición de este paquete:** el oro **RIGE** en **muro
claro** (3.41 — con la excepción a §15b.2 que **A escribe** con el precedente
magenta S83), **muro noche** (5.95) y **el degradado del cliente** (peor
punto 3.33). Sobre **papel** (1.62, no pasa) y en **memorial** (no se celebra)
**la huella queda como hoy** — *la letra ganó al número*.

**El pintado, ejecutado por riel (no por caso):** `Badge forma="huella"` con
`superficie="muro"` pinta `palette.ctaOro` (fuente única de hex, jamás
inline) — salvo memorial, donde conserva papel; `superficie="clara"` conserva
el acento por casa. R33 ya obliga la superficie explícita en apps, así que
ningún montaje decide su color. Las tres condiciones firmadas viajan
intactas: **jamás un número · jamás rojo de alarma · jamás anima.**

**El instrumento se reforzó, no se ablandó:** los pares
`huella-novedad oro (ctaOro)/MURO` entraron a `verify-diseno-pares` (clase
fill, mín 3) en los cuatro temas del corpus — 3.41 claro/lightOficio · 5.95
dark/darkOficio, **todos en verde sin excepción nueva**: si el oro o el muro
se mueven, el número no muere en silencio. WCAG 178/0 intacto ·
`verdicto.mjs` TODO VERDE.

**Capturas re-tomadas con el oro pintado** (mismas rutas,
`scripts/capturas/s89-b-gate-campana/seccion-campana-{claro,oscuro,memorial}.png`
— el diff de git conserva el antes).

## Lo que mira el ojo del founder en el gate único del bundle

1. **El oro en las superficies firmadas** — la campana del techo del
   prestador (claro y oscuro) y la del Hogar del cliente sobre el degradado:
   la huella es ORO y se lee como novedad. En la galería, el par del defecto
   y la fila del oro lo muestran lado a lado; en memorial, el toggle muestra
   papel — no se celebra, por construcción.
2. **El estudio 10/12/14** — el cierre formal del «tamaño mínimo legible» de
   la lámina: 12 es la elegida de la pieza; el estudio del oro está a un
   renglón para mirar el tamaño EN oro.
3. **La huella del techo ya visible** — la cura de la orden 2: antes
   invisible en claro (1.00), ahora oro 3.41; R33 impide que el olvido
   vuelva callado.
