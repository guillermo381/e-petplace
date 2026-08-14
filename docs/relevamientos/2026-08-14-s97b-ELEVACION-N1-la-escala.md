# S97+-B · ELEVACIÓN CON COSTO — N1, LA ESCALA

**Fecha:** 14-ago-2026 · **De:** pista B · **Para:** la mesa · **Estado:**
🔴 **NO EJECUTADA — espera firma.** Todo lo demás del Norte que era línea
de token ya está ejecutado y commiteado; **esto no lo es, y el porqué es
el contenido de este documento.**

> **La orden decía:** *«medí las dos vías y ejecutá la más barata que
> cumpla el Norte; si las dos son caras, elevá con números».* Las dos son
> caras, y hay un tercer problema que ninguna de las dos resuelve.

---

## §1 · LO QUE N1 PIDE CONTRA LO QUE HAY

| N1 pide | Hoy | ¿Existe el valor? |
|---|---|---|
| cuerpo **16/24** | `cuerpo` = 15, **sin lineHeight** | 🔴 **16 NO existe** en la escala |
| secundario **14/20** | `apoyo` = 13 / 20.8 | 🔴 **14 NO existe** |
| título de sección **20/26 peso 600** | `seccion` = 18, medium **500** | 🔴 **20 NO existe** · 🔴 **peso 600 NO está cargado** |
| título de pantalla **28/34 peso 700** | `titulo` = 28, light **300** | ✅ 28 existe · 🔴 **700 choca con letra firmada** |

**De los cuatro tamaños que N1 nombra, tres no existen en la escala** —
que es `11 · 13 · 15 · 18 · 22 · 28 · 32 · 38 · 48 · 56 · 68`, declarada
«Escala v3.1 intacta» en `typography.ts`.

⇒ **N1 no es un ajuste de dos valores: es una reforma de la escala
tipográfica.** Por eso se eleva.

---

## §2 · LA BIFURCACIÓN, MEDIDA (los dos caminos y sus números)

### Vía A — mover el VALOR de los tokens
`sm: 13→14` · `base: 15→16` · `md: 18→20`.

- **Costo de edición: 3 líneas.**
- **Blast radius medido: 330 sitios** — `size.sm` **208** · `size.base`
  **92** · `size.md` **30**.
- Todo lo que hoy dice «secundario» pasa a 14 y todo lo que dice
  «cuerpo» pasa a 16, **con y sin `Texto`**. Coherencia total.
- **El riesgo real no es el tamaño: es el layout.** +1 y +2 px sobre 330
  sitios mueve truncados, alturas de fila y saltos de línea en pantallas
  que nadie va a volver a mirar una por una.

### Vía B — tokens nuevos + cambiar qué usa `Texto`
Agregar 14/16/20 a la escala y re-apuntar las recetas de `Texto`.

- **Costo de edición: ~6 líneas.**
- **🔴 Y FABRICA DIVERGENCIA, que es lo que la descarta:** solo alcanza a
  quien monta `Texto`. Los **330 usos directos** quedan en la escala
  vieja ⇒ una pantalla con `<Texto variante="apoyo">` diría **14** y la
  de al lado con `size.sm` inline diría **13**.
- *Hoy la casa es consistente en el valor equivocado. La vía B la deja
  inconsistente — que es peor que no hacer nada.*

**⇒ Entre las dos, A. Pero A no es «barata»: es de 3 líneas y 330
consecuencias visuales sin gate.** Ninguna de las dos se ejecuta sin
firma.

---

## §3 · LOS DOS CHOQUES QUE NINGUNA VÍA RESUELVE

Estos no se arreglan moviendo tokens — son de letra.

### ① El peso 700 del título choca con la REGLA DE VOZ FIRMADA

`typography.ts` la declara **vinculante (B1 firmado)**:

> *«Voz humana = DM Sans **300/400** en tamaños lg+.»*

`Texto.titulo` es **light 300 a 28px** por diseño, y §1 de
`DIRECCION_ARTE` lo sostiene. **N1 pide 700 para ese mismo registro.**

No es un número: **invierte el registro de la voz humana de la casa.**
Ejecutarlo en silencio sería resolver un choque contra letra firmada sin
declararlo — justo lo que el precedente S63 prohíbe.

**Decide la mesa:** ¿el título de pantalla deja de ser voz humana y pasa
a ser peso? Si sí, la regla de voz de `typography.ts` se enmienda **en su
archivo**, no solo en la práctica.

### ② El peso 600 no está cargado — y tiene precio medido

`fonts.ts` carga **300 · 400 · 500 · 700**. El 600 no está.

- ✅ **`@expo-google-fonts/dm-sans/600SemiBold` existe** en
  `node_modules` — no hay que buscar nada.
- 💰 **Costo medido: 55 KB** (el .ttf, exactamente lo que pesa el 500).
  Viaja por OTA, no exige build nativa.
- ⚠️ **Contexto que lo vuelve una decisión y no un trámite:** S94-PERF
  acaba de sacar **2,37 MB** de fuentes de cada app, y la lección que
  dejó fue que *el peso no entra por el mapa sino por la forma del
  import*. El import por peso ya está resuelto acá, así que 55 KB es 55
  KB — pero es una fuente nueva tres semanas después de esa limpieza.

**Y la alternativa gratis, que hay que descartar a propósito:** hoy
`seccion` es **500**. La distancia 500→600 es el escalón más chico de la
familia. **Si el objetivo de N1 es que el rótulo de sección pese más, subirlo
a `700` (ya cargado) cuesta CERO KB** y da más contraste que el 600. La
mesa elige entre *el número que dijo el Norte* y *el que no agrega peso
al bundle*.

---

## §4 · LO QUE SE EJECUTÓ SIN FIRMA (para que no se confunda con esto)

Todo lo del Norte que **sí** era línea de token está hecho y verde:

- **N10 tokenizado** — `motion.duration.micro|estandar|grande`. De las
  tres duraciones que N10 declara «cerradas», solo el 150 existía: el 300
  vivía como constante privada dentro de `Entrada` y el 520 no existía en
  ninguna parte.
- **`opacity.luzDeEsquina`** (7%, §9bis.2 firmada) — su propia enmienda
  S82 exige que el valor salga del token y se escribió para el color,
  dejando el alfa suelto.
- **Los `gap: 2` de `packages/ui` → `spacing[0.5]`** — el token vale
  exactamente 2: **cero cambio visual**, cierra una fila abierta del censo
  token-vs-mano de S97.
- **Las cuatro reglas del Norte en `verify:diseno`** (R36·R37·R38·R39),
  ratchet, con su discriminador corrido contra el código real.

---

## §5 · N4 — LO QUE QUEDA, CON DUEÑO (no es de B)

R37 mide **20 radios crudos** en `apps/`, y son **dos problemas
distintos** que se pagan distinto:

**(a) 13 píldoras a mano — `borderRadius: 999` cuando `radius.full` es
9999.** Las dos clampean igual, **por eso nadie lo vio nunca**: el
defecto no es visual, es que la píldora de la casa dejó de tener un solo
dueño. **Cura mecánica, cero cambio visual, una línea cada una.**
Territorio de C y D — se declara y se pide, no se invade:

- `cliente/…/hogar/index.tsx` → 1188 · 1298 · 1338 · 1389 · 1397
- `cliente/…/hogar/mascota/[mascotaId].tsx` → 855 · 868 · 881 · 895 · 927 · 961
- `cliente/src/components/flecha-volver.tsx:40`
- `prestador/src/components/flecha-volver.tsx:40`

**(b) 7 valores que no existen en ninguna escala** — `36` · `5` ×4 · `2`
×2. **Estos SÍ cambian el dibujo al curarse** ⇒ su cura es de gate, no de
reemplazo:

- `cliente/…/hogar/index.tsx:1259` → **36**
- `prestador/…/paseo/index.tsx:250` · `grooming/index.tsx:273` ·
  `adiestramiento/index.tsx:234` · `veterinaria/index.tsx:240` → **5**
  *(el mismo patrón repetido en los cuatro oficios — se cura una vez y
  se propaga, o no se cura)*
- `prestador/…/(tabs)/mascotas.tsx:426 · 480` → **2**

**Y uno en `packages/ui` que B decidió NO tocar:**
`SelectorDia.tsx:227` → **`borderRadius: 22`**. La escala tiene 20 y 24;
22 está justo en el medio. **Llegó verbatim de la lámina FIRMADA de la
rueda D3** (S85, «su física firmada que viajó verbatim»). *Cambiar la
forma de una pieza firmada por prolijidad de lint es exactamente lo que
esta casa prohíbe* — queda declarado, visible en cada corrida del
ratchet, y se mueve con firma o no se mueve.

---

## §6 · EL VOTO DE B, para que la mesa tenga algo que aceptar o rechazar

1. **La escala (16/14/20): VÍA A, y con gate en dispositivo.** Es la
   única que no fabrica divergencia. Pero **330 sitios sin ojo encima es
   demasiado para una tanda sin teléfono** — mi voto es que entre en un
   lote con gate, no al pasar.
2. **El peso de `seccion`: 700, no 600.** Cuesta 0 KB, ya está cargado, y
   da más contraste que el escalón más chico de la familia. Si la mesa
   quiere el 600 exacto, son 55 KB y se paga sin drama — pero que se pague
   sabiendo.
3. **El peso 700 del TÍTULO: NO, sin enmienda explícita de la regla de
   voz.** Es el único punto de N1 que no es una escala sino una
   inversión de registro: hoy el título de pantalla es la voz humana de
   la casa en 300 light. Si cambia, cambia por firma y se escribe en
   `typography.ts`, no se deduce de una pantalla.
4. **N4 (a): que C y D lo barran** — 13 líneas, cero riesgo.
   **N4 (b) y el 22 de SelectorDia: gate.**

*Ninguno de los cuatro está ejecutado. Los cuatro esperan.*
