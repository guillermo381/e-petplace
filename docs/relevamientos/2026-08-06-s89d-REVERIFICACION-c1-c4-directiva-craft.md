# S89-D · RE-VERIFICACIÓN C1-C4 — DIRECTIVA_CRAFT_CLIENTE §2.6

> **Territorio D (apps/cliente) · SOLO MEDICIÓN — ninguna cura se
> ejecuta** (la directiva no autoriza construir; el Bloque A tiene sus
> gates propios). Medido contra el código vivo del worktree
> (`pista/s87-d`, 6-ago-2026), con el método declarado en cada punto.

---

## 0 · EL FRENO QUE GOBIERNA ESTE DEPÓSITO: C1, C2 Y C4 SON NÚMEROS SIN LETRA

**Medido antes de medir las curas — y cambia el entregable.** El único
literal del Bloque C en TODO el repo es:

```
C1-C4 · curas en pantallas de reserva. C3 · voseo.
⚠️ Medidas el 26-jul, ANTES de S79. Re-verificar contra fuente.
```

- `grep -r "pantallas de reserva" docs/` → **1 ocurrencia: la propia
  directiva.** Ningún relevamiento, acta ni brief describe qué son
  C1, C2 o C4.
- `git show bef6afd` (el depósito ORIGINAL de S80-A6): el Bloque C
  **ya nació con estas dos líneas** — no hubo condensación posterior
  que recuperar del historial.
- El acta hermana de los porqués (`ACTA_DISENO_CRAFT.md`) **NO
  EXISTE** — declarado en el header de la propia directiva (hueco 1).

> ### ⇒ **C1, C2 y C4 no se pueden re-verificar: un defecto que no
> está escrito no tiene contra qué medirse.** Declararlos VIGENTE
> o SUPERADA exigiría **inventar el defecto** — L-139 de manual.
> Es el patrón A7, y la propia directiva ya dijo cómo se trata:
> *«número sin letra — no se reconstruye; nace cuando su literal
> llegue»* (§0bis, protocolo D-434/D-435).

**Estado depositado: C1 · C2 · C4 = SIN LETRA MEDIBLE.** El literal
se PIDE a la mesa (freno 76b/L-142 — la letra anunciada sin literal
se re-emite como texto autocontenido, jamás se deduce). Si la sesión
del 26-jul vive en notas del founder/arquitecto fuera del repo, ese
es el texto que falta; hasta que llegue, estos tres números no
autorizan ni bloquean nada.

---

## 1 · C3 («voseo» · pantallas de reserva) — MEDIDA ENTERA

**La única con letra medible.** Alcance leído de su literal: voseo en
las pantallas de reserva del cliente. Vara: **L-172** (tres clases —
tilde final case-insensitive · vos conjugado · enclítico sin tilde),
DOS pasadas de patrón (lista curada + lista ampliada: 33 imperativos
voseantes + 8 enclíticos), sobre las cuatro ubicaciones que tocan
este flujo:

**El universo medido (17 archivos de pantalla + 3 fuentes de voz):**
las 16 pantallas de `(tabs)/explorar/` (4 oficios × index ·
disponibles · checkout + `paseo/paquete` + `adiestramiento/
confirmar-programa` + `_layout`) + el `components/checkout-reserva.tsx`
compartido (S60, consumido por los 4 checkouts) + `src/i18n/es.ts`
ENTERO + `packages/ui/src/i18n/es.ts`.

| ubicación | voseo (3 clases) |
|---|---|
| hardcodeos `.tsx` del flujo (17 archivos) | **0** |
| `apps/cliente/src/i18n/es.ts` — keys del flujo | **0** *(el ÚNICO voseo de todo el diccionario es `avisos.vacio` «No tenés avisos» — campana, fuera de reserva, literal FIRMADO de lámina §4, ya en mesa como decisión ① del lote S89-D)* |
| `packages/ui/src/i18n/es.ts` | **0** (re-verificado — coincide con el CERO de S77) |
| `packages/api` vía `r.mensaje` | **VIVO — ver abajo** |

**El residuo, con su dueño:** el flujo de reserva pinta `r.mensaje`
en **6 sitios** —

```
paseo/disponibles.tsx:152 · :191
grooming/disponibles.tsx:114
veterinaria/disponibles.tsx:135
adiestramiento/disponibles.tsx:109
adiestramiento/confirmar-programa.tsx:105
```

— el canal exacto de **D-539 + su enmienda S86**: en camino de error,
estas pantallas hablan con la voz de `packages/api` (voseo, español
fijo). **No es deuda nueva ni de esta directiva: la clase está
censada y adjudicada** (las tres curas posibles viven en la enmienda
S86, ninguna firmada; la mesa de D-539 la arbitra).

> ### **VEREDICTO C3: SUPERADA en la voz PROPIA de las pantallas —
> el defecto MUTÓ de las pantallas al canal compartido, que ya
> tiene dueño (D-539).**
> Lo que S79→S82 dejaron (la migración al riel + el rediseño de los
> cuatro oficios con la gramática canónica) limpió los strings del
> flujo: cero voseo propio en las tres clases. Lo que sobrevive no
> vive en estas pantallas — entra por `r.mensaje`, y curarlo acá
> sería curar el síntoma en 6 sitios cuando D-539 ya nombra la
> enfermedad. **Cero curas ejecutadas** (la orden no lo autoriza).

**Límite declarado del método (L-166):** el alcance de C3 se leyó de
su ÚNICA letra («voseo» × «pantallas de reserva»). Si el 26-jul se
midió bajo ese número algo distinto de los strings de esas pantallas,
ese literal no está en el repo — y entonces vale para C3 el mismo
freno del §0.

---

## RESUMEN PARA LA MESA

| cura | estado depositado |
|---|---|
| **C1** | **SIN LETRA MEDIBLE** — se pide el literal (76b); no se declara estado |
| **C2** | **SIN LETRA MEDIBLE** — ídem |
| **C3** | **SUPERADA** (voz propia del flujo: 0 en tres clases × cuatro ubicaciones) **con residuo MUTADO al canal `r.mensaje` — adjudicado a D-539/S86** (6 sitios listados) |
| **C4** | **SIN LETRA MEDIBLE** — ídem C1 |

**Sugerencia de letra (de mesa, no mía):** si el literal de C1/C2/C4
no aparece, el Bloque C de la directiva puede quedar enmendado a lo
que este depósito midió — tres números vacíos tratados como A7 y una
C3 cerrada con su residuo apuntando a D-539. La enmienda es de la
escritora (A), no de esta pista.

**Origen: S89-D orden 2 · ① · medición 6-ago-2026.**
