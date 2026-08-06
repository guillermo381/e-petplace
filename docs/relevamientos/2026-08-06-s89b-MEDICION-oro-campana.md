# S89-B · LA MEDICIÓN DEL ORO — enmienda ⑦ (la huella de la campana a #FCBC1D)

> ⚖️ **FIRMADA (S89, orden 4 del founder) — sobre esta medición:** el oro
> RIGE en muro claro (con la excepción §15b.2 que escribe A, precedente
> magenta S83), muro noche y el degradado del cliente; sobre papel y en
> memorial la huella queda como hoy — *la letra ganó al número*. El pintado
> y el paquete final: `2026-08-06-s89b-PAQUETE-gate-campana.md`.

> **Orden de apertura S89-B ①.** La enmienda ⑦ (firmada founder) manda la
> huella de la campana a ORO `#FCBC1D`. Esto es la MEDICIÓN previa al pintado
> — **el pintado espera su gate; este depósito es la medición**. Las tres
> condiciones firmadas viajan intactas: **jamás un número · jamás rojo de
> alarma · jamás anima** (el oro no toca ninguna de las tres).
>
> **Instrumento:** `scripts/medir-oro-campana.mjs` — matemática copiada
> LITERAL de `verify-contrast.ts` (S43) y **autovalidada contra dos pares
> firmados antes de imprimir nada** (papel/tealDark 5.51 · tealDarkNoche/papel
> 9.61 — reproduce ambos al centésimo). Mínimo legible: **3.0** (WCAG 1.4.11
> no-textual — el mismo piso que `verify-diseno-pares` usa para fill/canto).

---

## La tabla

| superficie | par | ratio | veredicto (mín 3.0) |
|---|---|---|---|
| **muro claro** (tealDark `#0A7268`) | oro / muro | **3.41** | ✓ pasa — con choque de letra declarado abajo (§15b.2) |
| **muro noche** (tealDarkNoche `#0A4A44`) | oro / muro noche | **5.95** | ✓ pasa |
| **papel** (light0 `#FAF9F7`) | oro / papel | **1.62** | ✗ **NO PASA — se declara, decide la mesa. El mínimo no se rompe: sobre papel el oro NO se pinta hasta que la mesa diga su respuesta** |
| **memorial** (bg.card memorialDark1 `#141A14`) | oro / memorial | **10.40** | ✓ pasa numéricamente — con tensión de ley declarada abajo |

**Referencia — lo que la huella pinta HOY** (`superficie="muro"` → papel §15b.2):
papel sobre muro claro **5.51** · papel sobre muro noche **9.61**. *El oro pasa
el mínimo en los dos muros pero BAJA la legibilidad respecto de hoy (3.41 vs
5.51 · 5.95 vs 9.61). No es un veredicto — es el dato que el ojo del founder
va a estar comparando en el gate.*

### Medición DECLARADA fuera de la lista de la orden — el gradiente del cliente

La orden nombra cuatro superficies; la campana del **cliente** vive hoy sobre
el **gradiente firma** del techo del Hogar (`hogar/index.tsx`,
`superficie="muro"`). Medirla ahí no es opcional — es donde el dedo la toca.
Regla del peor punto (precedente `verify-contrast`):

| stop | par | ratio |
|---|---|---|
| pinkDark `#C4008A` | oro / stop | **3.33** ← peor punto |
| violetDark `#7C2DD4` | oro / stop | 3.88 |
| tealDark `#0A7268` | oro / stop | 3.41 |

**Peor punto 3.33 ≥ 3.0: pasa**, justo. (Hoy el papel da 5.51 en su peor
punto — mismo comentario que arriba: pasa, pero baja.)

---

## Lo que se DECLARA a la mesa (tres cosas; ninguna se resuelve acá)

### ① El rojo de PAPEL (1.62)

Sobre papel el oro es ilegible — es la misma física por la que E1 de S82 le
puso al CTA oro el **label en TINTA** (el oro nunca portó texto ni gráfica
funcional sobre papel; palette lo documenta en `ctaOro`). Hoy **ningún montaje
del producto pinta la huella sobre papel** (prestador = muro; cliente =
gradiente; memorial = techo plano oscuro), así que el rojo no está en ninguna
pantalla — está en el CONTRATO: si el pintado hace la huella oro **en todas
las superficies**, la primera pantalla clara que monte la campana nace con una
huella invisible. **La regla de superficie del Badge ya existe para esto**
(`superficie` decide el color): la respuesta natural es que sobre papel la
huella conserve una respuesta legible (p. ej. el acento por casa, lo de hoy) y
el oro rija donde contrasta. **Eso es letra, no medición — lo firma el
founder.**

### ② El choque con §15b.2 — dos letras firmadas no pueden convivir calladas

`DISEÑO_EXPERIENCIA` §15b.2 (firmada S61, medida): *«sobre el muro el acento
funcional es PAPEL — teal puro 3.77 **prohibido**»*. El oro sobre el muro
claro da **3.41 — MENOS que el 3.77 que esa letra ya prohibió**. La enmienda
⑦ es más nueva y específica (la huella-novedad de la campana); §15b.2 es
general y sigue firmada. **Precedente S83 (el magenta): dos letras firmadas
que se contradicen son peores que una equivocada — cualquiera cita la que le
conviene y está «en regla».** Si el founder firma el oro sobre el muro, §15b.2
gana su excepción EN SU ARCHIVO (como se enmendó el magenta: en su lugar, no
solo en la ficha); si no la gana, el oro sobre el muro claro no rige. **Decide
la mesa — acá solo se deja medido que el número cae del lado prohibido de la
letra vigente.**

### ③ Memorial — pasa el número, la ley es otra pregunta

10.40 es holgado. Pero la casa tiene letra de que **memorial no se celebra**
(el CTA memorial es tinta plana; el gradiente muere; nada rebota) y el oro es
EL color de celebración del cliente (E1). Además la lámina de la campana ya
dice que **el memorial CALLA** (lo que el motor descartó no aparece). Hoy el
montaje memorial usa `superficie='clara'` → la huella degrada al acento del
tema (tinta). **Si la enmienda ⑦ alcanza a memorial o si memorial conserva su
degradación a tinta es decisión de ley, no de contraste** — el número queda
servido para cualquiera de las dos.

---

## Nota de alcance

- Mediciones sobre hex planos de `palette` (cero alpha involucrado — la
  huella es fill pleno y las superficies son opacas); la regla de peor punto
  del gradiente aplicada por stop, como en `verify-contrast`.
- El instrumento queda en el repo (`scripts/medir-oro-campana.mjs`) con su
  autovalidación: si alguien toca la matemática o los hex firmados, el script
  se niega a reportar antes que reportar desde una regla rota (L-197).
