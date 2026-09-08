# S114 · las DOS versiones de TypeScript del monorepo — de dónde vienen, y por qué unificar es una decisión ABIERTA

> **A, al armar el 2º candidato de S114. Medición de F (8-sep-2026). El founder
> RETIRÓ la firma que decía «deliberado por Expo SDK 57»: era una hipótesis, no
> un hecho, y no se escribe una razón inventada en un archivo que existe para que
> nadie vuelva a medir.**

## El hecho

- **Las dos apps Expo (`apps/cliente`, `apps/prestador`) declaran TypeScript `~6.0.3`.**
- **Los cuatro packages (`api`, `ui`, `domain`, `i18n`) y el `package.json` raíz declaran `~5.9.x`.**
- Los packages exponen `./src/index.ts` como **fuente cruda** (`main: ./src/index.ts`):
  el programa de cada app incluye **378 archivos de `packages/*/src` por symlink de
  pnpm (no vía `node_modules`)**, así que **el mismo `.ts` se compila con TS 6.0.3
  cuando lo corre una app, y con 5.9.3 cuando lo corre su propio package.**

## De dónde viene, MEDIDO — nadie la decidió

🔴 **NO es una decisión de nadie. Es lo que dejó `create-expo-app` el día del scaffold.**

- **Las cuatro versiones vienen del MISMO commit:** `98e14c97` · 5-jul-2026 ·
  *«chore: scaffold monorepo — apps Expo, packages, tipos, skills (S43-B0)»*.
  El generador de Expo puso `~6.0.3` en las apps; el resto del scaffold puso `~5.9.0`.
- **La línea de `apps/cliente` nunca se tocó desde entonces** (`git log -L` sobre
  esa línea: un solo commit, el scaffold).
- **Expo 57.0.4 NO exige TypeScript 6.** No declara `typescript` ni en
  `peerDependencies` ni en `devDependencies` — ni `expo` ni `expo-router`. **No
  hay tal requisito.** El corte «apps Expo vs. todo lo demás» es limpio porque son
  dos mitades del scaffold, no porque alguien lo haya elegido.

## Hoy no rompe nada — y por qué correr los cuatro typechecks ES la cobertura completa

F lo midió con una sonda (revertida en el acto): metió un `error TS` en
`packages/ui/src/tokens/spacing.ts` y corrió el typecheck de `apps/cliente` (6.0.3)
→ **exit 2, reportado con su ruta real**. ⇒ **estar en el programa no bastaba;
está probado que se REPORTAN.**

| workspace | tsc | resultado |
|---|---|---|
| @epetplace/api · ui · i18n | 5.9.3 | ✓ exit 0 |
| apps/cliente · apps/prestador | 6.0.3 | ✓ exit 0 |
| @epetplace/domain | 5.9.3 | 🔴 rojo PRE-EXISTENTE de S45 (`@types/*` en `node_modules`, cero en código de domain; igual en `origin/main`) |

⇒ **Los mismos `packages/*/src` compilan limpio bajo las dos versiones.** Correr
los cuatro typechecks que ya existen **es la cobertura de las dos versiones — no
hace falta ningún gate nuevo.**

## La línea que se puede escribir (y la que NO)

**NO escribir:** «la divergencia es deliberada porque Expo SDK 57 exige TS 6».
Es falso (medido) y quedaría en un archivo que existe para que nadie re-mida — el
día que alguien necesite unificar encontraría una prohibición fundada en un
requisito que no existe.

**SÍ, y es lo cierto:** la divergencia **viene del scaffold `98e14c97`, nadie la
decidió, Expo no la exige, hoy no rompe nada** (los cuatro typechecks en 0), y
**unificar es una decisión abierta que todavía nadie tomó.** Si alguien la unifica
—subir los packages a 6.0.x o bajar las apps a 5.9.x—, que **corra los gates de las
dos versiones sobre el candidato integrado ANTES**: cada typecheck por separado
saldría verde igual, y el que rompe es el cruce.
