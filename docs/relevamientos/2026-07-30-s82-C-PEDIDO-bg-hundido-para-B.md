# PEDIDO A B — EL SLOT `bg.hundido`

> **De C a B, autocontenido** (regla S54: un pedido entre pistas viaja
> como texto completo, jamás como referencia a un reporte ajeno).
> **C NO lo construye: `packages/ui` es frontera cerrada para esta pista.**
> Origen: S82-C r18 (la pata que se apoya y el chip que cede) + la
> advertencia del founder — *"overlay es superficie neutra, no hundido.
> Son dos roles y hoy comparten token."*

---

## 1 · EL PROBLEMA, EN UNA LÍNEA

**No existe un registro de HUECO en el sistema.** El contrato de
`elevacion` tiene exactamente dos niveles —`reposo` y `elevada`— y los
dos son *hacia arriba*. Lo que la casa llama "hundido" es una
**convención de superficie** sobre `bg.overlay`… **y esa convención
solo es válida en claro.**

## 2 · LA MEDICIÓN (hecha por C, para que B no la repita)

¿Qué token lee como HUNDIDO —más oscuro que la tarjeta— en cada tema?

| tema | `bg.card` | `bg.overlay` | veredicto |
|---|---|---|---|
| claro | `#FFFFFF` | `#EDEBF5` · paso 1.18 | **más oscuro ✓ hunde** |
| oscuro | `#0D0D12` | `#1A1A24` · paso 1.12 | más claro ✗ **ELEVA** |
| memorial | `#141A14` | `#141A14` · paso 1.00 | idéntico ✗ **no dice nada** |

`bg.base`, en cambio, hunde en los tres: 1.10 / 1.05 / 1.10.

## 3 · LOS DOS ROLES QUE HOY COMPARTEN TOKEN — con su censo

**71 usos de `bg.overlay` en 33 archivos.** El reparto NO es parejo, y
esto es lo que hace barato el pedido:

- **Rol HUNDIDO — 3 componentes.** `SelectorSegmentado` (el riel) ·
  `SliderPrecio` (el riel) · `StepperCantidad` (los botones −/+).
- **Rol SUPERFICIE NEUTRA — los 57 usos restantes** (placas tenues,
  chips en reposo, cajas neutras). Es el rol que B re-declaró en su r22.

**Migrar el slot toca 3 componentes, no 33.**

## 4 · EL HALLAZGO QUE JUSTIFICA EL SLOT MEJOR QUE MI CASO

**Ya hay una rama por tema adentro de `packages/ui`, por esta misma
razón.** `SelectorSegmentado.tsx:91`:

```ts
const superficieActiva = theme.mode === 'light' ? theme.bg.card : theme.border.default
```

Esa línea existe porque en oscuro la superficie que en claro se resuelve
sola **se invierte** — exactamente el problema de este pedido. O sea que
**no es "C necesita un token": es la SEGUNDA aparición del mismo hueco**,
y la primera vive en un componente firmado y publicado.

**Y hay una consecuencia viva que conviene mirar:** los rieles de
`SliderPrecio` y los botones de `StepperCantidad` **no** tienen esa
rama. Si su "riel hundido" es `bg.overlay` y en oscuro `overlay` es más
claro que la tarjeta, **en oscuro esos rieles leen elevados, no
hundidos.** No lo verifiqué en pantalla —es de B— pero la aritmética
está arriba y el sitio exacto también.

## 5 · LO QUE C PROPONE (y B decide)

Un slot `bg.hundido` por tema, con estos valores medidos:

| tema | valor propuesto | por qué |
|---|---|---|
| claro | `palette.light3` (`#EDEBF5`) | **es el valor de hoy**: claro no cambia en nada |
| oscuro | `palette.dark0` (`#050508`) | único que baja respecto de `card` |
| memorial | `palette.memorialDark0` (`#0A0E0A`) | ídem |

**⚠️ EL LÍMITE HONESTO, para que el slot no prometa lo que no puede:**
`bg.hundido` significa *"superficie que lee POR DEBAJO de `bg.card`"*.
Para un elemento apoyado **sobre la página** (no dentro de una tarjeta),
en oscuro no hay nada más abajo que la página misma: ahí el hundimiento
lo carga la **pérdida de elevación**, no el color. Es un límite del
medio, no del token.

## 6 · LA RAMA LOCAL DE C, CON SU CONDICIÓN DE MUERTE

Vive en `apps/cliente/src/components/filtro-pills.tsx` (el chip elegido
que cede bajo la pata):

```ts
backgroundColor: elegido
  ? theme.mode === 'light' ? theme.bg.overlay : theme.bg.base
  : theme.bg.card,
```

**☠️ Se retira el día que exista `bg.hundido`** — la rama se reemplaza
por el slot y el comentario que la explica se borra con ella. **Quién lo
retira: C** (es su pieza), **en el commit que consuma el slot**. Si
`FiltroPills` se promueve a `packages/ui` antes que eso, se retira en la
promoción y lo hace B.

## 7 · COSTO HONESTO

- Nace el slot en los 3 temas + el tipo: chico, pero es `Theme` — y
  `Theme` se DERIVA de los temas concretos, así que **cae en D-582**
  (probable cast, o la interfaz declarada que esa deuda ya propone).
- Migrar los 3 consumidores del rol hundido: chico.
- Los 57 del rol neutro **no se tocan** — se quedan en `bg.overlay`, que
  después de esto queda con UN solo rol y su nombre deja de mentir.
- Re-medir contraste: el cambio es de superficie, no de texto; hay que
  correr `verify:contrast` igual y declarar el resultado.
