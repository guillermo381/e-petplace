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
