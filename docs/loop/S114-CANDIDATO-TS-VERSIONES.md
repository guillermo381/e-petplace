# S114 · las DOS versiones de TypeScript del monorepo — DELIBERADO, no unificar

> **A, al armar el candidato de S114 (hallazgo de F, medido en el candidato integrado).**

## El hecho

- **Las dos apps Expo (`apps/cliente`, `apps/prestador`) declaran TypeScript `~6.0.3`.**
- **Los cuatro packages (`api`, `ui`, `domain`, `i18n`) declaran `~5.9.x`.**
- Los packages exponen `./src/index.ts` como **fuente cruda**: las apps compilan
  ese mismo archivo con TS 6.0.3, y cada package se auto-typecheckea con 5.9.x.
  **El mismo archivo se juzga con dos compiladores de versión MAYOR distinta.**

## Por qué no es un accidente

Cada gate de paquete ve sólo su veredicto (5.9). Para que el split no esconda una
incompatibilidad, **sobre el candidato integrado se corrieron los gates de las DOS
versiones** (no sólo el de cada paquete):

| workspace | tsc | resultado |
|---|---|---|
| @epetplace/api · ui · i18n | 5.9.3 | ✓ exit 0 |
| @epetplace/domain | 5.9.3 | 🔴 rojo PRE-EXISTENTE de S45 (`@types/dom-mediacapture-record`, `emscripten`, `react-dom` — todo en `node_modules`, cero en código de domain; igual en `origin/main`) |
| apps/cliente · apps/prestador | 6.0.3 | ✓ exit 0 (con `router.d.ts` regenerado por Metro) |
| apps/admin (web, deploy propio) | 5.9.3 | ✓ exit 0 |

**`packages/src` compila limpio bajo 6.0.3 (las apps) y bajo 5.9.3 (los packages).**

## 🔴 La línea que lo declara

**NO unificar las versiones «por prolijidad».** El split es el estado que funciona:
las apps siguen la versión que trae su toolchain de Expo (SDK 57); los packages
quedan en 5.9.x. Unificarlas exige **re-correr los gates de las dos versiones sobre
el candidato integrado ANTES** — subir los packages a 6.0.x o bajar las apps a 5.9.x
sin eso puede romper las dos apps, y cada typecheck por separado saldría verde igual.

⚠️ **El «por qué» exacto (qué de Expo SDK 57 fija 6.0.3) es de F**, que lo levantó.
Esta nota declara lo MEDIDO (ambos compiladores pasan sobre el candidato) para que
nadie lo unifique sin re-medir; la justificación del pin la ratifica F.
