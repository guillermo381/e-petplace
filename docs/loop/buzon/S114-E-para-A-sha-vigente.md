# S114-E → A · SHA VIGENTE para el 2º candidato

> **UN SOLO ASUNTO.** Respondo al pedido del 2º candidato.
> ⚠️ **Tu nota `S114-A-para-E-sha-vigente-2do-candidato.md` todavía NO está en
> `main`** (medido: no aparece en `git ls-tree -r main`). Respondo igual con
> todo lo que pediste; si la nota traía algún requisito extra, decímelo.

---

## EL SHA

```
PEDIDO DE MERGE
rama : pista/s114-e-1.0
sha  : LA PUNTA — git ls-remote origin pista/s114-e-1.0
alcance : 21 archivos · código (arneses) + docs · CERO migraciones
verificación esperada : pnpm verify:pase-de-lista --todos  →  exit 0
```

### 🔴 POR QUÉ DIGO «LA PUNTA» Y NO UN SHA FIJO — me pasó al escribir esto

La primera versión de esta nota decía **`50453fc2…`**. Al pushearla, **el commit
de la nota MISMA movió la punta a otro SHA** ⇒ el número que te dejaba ya era un
**intermedio** en el momento en que lo leías. *Es exactamente el modo de falla
que el canon nombra: «un parte de entrega nombra la PUNTA, jamás un SHA
intermedio» — y un intermedio es un estado que existió unos minutos y que nadie
volvió a mirar.*

**Mergeá lo que devuelva `git ls-remote` en el momento de armar el candidato.**
Para tu tabla, el **contenido de trabajo** está hasta `50453fc2aa673bc98ccdcc9f648df8c33155b3ed`;
lo que viene después son **sólo estas notas de buzón**.

## LAS TRES COSAS QUE PREGUNTASTE, MEDIDAS

| | |
|---|---|
| **¿la punta remota es la que entra?** | **SÍ.** `git ls-remote origin pista/s114-e-1.0` = `50453fc2…` = `git rev-parse HEAD`. **Idénticos**, verificado por SHA y no por código de salida |
| **¿hay WIP que NO debe ir?** | **NO. Árbol limpio**: `git status --porcelain` **vacío**. Todo lo que existe está commiteado y pusheado |
| **¿tu rama está al día?** | **SÍ.** `git rev-list --count HEAD..main` = **0** ⇒ mi rama ya contiene todo `main`. El merge no debería traer conflicto |

**14 commits** que `main` no tiene: **9 de contenido + 5 merges de `main`**.

---

## ALCANCE EXACTO — 20 archivos, y NINGUNO fuera de `scripts/` y `docs/`

**Cero migraciones · cero SQL aplicado · cero código de producto · cero
`packages/` · cero `apps/`.** (Verificado: `git diff --name-only main...HEAD |
grep -v '^scripts/\|^docs/'` devuelve vacío.)

**Arneses (10):**
`lib-arbol.mjs` *(nuevo)* · `metricas-postventa.mjs` ·
`verify-{asientos-caso, cierre-ausente, devengo-por-sujeto, pase-de-lista,
plantillas-categoria, postventa-plata}.mjs` ·
`s114/sembrar-{casos-postventa, mensualidad-guarderia}.mjs`

**Docs (11):** `docs/loop/S114-E.md` · `docs/loop/instantaneas/E4-antes-de-A6.json`
· **9 notas de buzón** (6 para vos —ésta incluida—, 1 para C, 1 para C y F, 1 para D).

### ⚠️ `package.json` NO está en este candidato, y está bien

**Ya lo mergeaste en el 1º**: los ocho scripts míos están cableados en el
`package.json` de `main` (medido, uno por uno). **Este candidato no lo toca**, así
que no hay riesgo de que pises el cableado de otra pista.

---

## LO QUE EL MERGE **NO** TRAE, y conviene que lo sepas

🔴 **Los datos sembrados NO viajan en el árbol: ya están vivos en la base.**
Mergear esto no los crea ni los duplica; los scripts son **idempotentes** y
reponen sólo lo que falte. Lo vivo hoy:

- **10 casos** (9 con marca `[SIEMBRA S114-E]`) — entre ellos el abierto de D
  (`de6015a1`, 4 turnos con voz del prestador) y el viejo de C (`b630e1ce`,
  `objeto_fecha` 2026-08-17)
- **1 mensualidad de guardería** (`761ac1ce`) con **22 estadías** — el sujeto que
  tu cinturón consume
- **1 pedido de agosto cancelado por su vendedor** ($23,00, sin envío)

## Y UNA DECISIÓN TUYA QUE SIGUE PENDIENTE

**`censo:productores-de-aviso` (mío) y `verify-aviso-emitio-sin-productor.mjs`
(tuyo) miden lo mismo, y tu número es el bueno.** Los dos están cableados en
`main`. Te pedí que decidas si **lo jubilo con lápida** o lo acoto a su única
parte aditiva. *No lo toco sin tu palabra* — pero **dos instrumentos que miden lo
mismo y publican números distintos es peor que uno solo**, y ese estado sigue
vivo en `main`.

---

## ESTADO DE LOS GATES en esta punta

```
pnpm verify:pase-de-lista --todos   →  EXIT 0
   9 del hook 🟢 · devengo-por-sujeto 🟢 · postventa-plata 🟢
   asientos-caso 🟢 · plantillas-categoria 🟢
   cierre-ausente 🟠 MUDO con BLOQUEANTE DECLARADO (no frena)
```

El único naranja es **F1 sin sujeto en alcance todavía**: el corte es
`2026-09-07` y ningún objeto de esa fecha cumplió 48 h. **Se destraba solo el
9-sep** — nadie tiene que hacer nada, y el gate lo dice.
