# S75 · LA VENTANA DE PUBLISH — los dos OTAs, con su ancla y su prueba

> Depósito operativo del paso 5 (mesa S75). Los dos publishes de S75 ejecutados
> en la ventana coordinada A→B. El cierre formal de S75 (con la corrida del
> founder) incorporará esto al bloque de estado del canon.

## Los dos groups vigentes

**CLIENTE — group `23c726eb-8c05-41e4-ac2a-9e36040839f1`**
- **Ancla `4004581`** — **PROBADO por el `gitCommitHash` del registro EAS**
  (`eas update:view … --json` → `gitCommitHash: 400458119d2b…`).
- Runtime 1.0.2 · android + ios. **Supersede a `da171552`** (S74-A), verificado
  con `eas update:list` desde `apps/cliente/` justo antes de publicar (no de
  memoria).
- **Carga:** Ponte al día (§10ter.1) — las citas AGENDADAS colapsadas por
  servicio a la próxima. Solo `apps/cliente` (69 inserciones: `hogar/index.tsx`
  + 2 strings i18n). Las curas CLASE 1 de B son prestador → NO entran a este
  bundle (verificado con `git diff --stat 4b446a6~1 HEAD -- apps/cliente`).

**PRESTADOR — group `60a88d2f-8f7e-48d4-a2f5-f7d804d3c537`**
- **Ancla `45d3f27`** · runtime 1.0.2 · android + ios (reportado por B).
- **Carga:** B1 (el handshake de producto — pantalla `/invitacion`, D-514 (a))
  + cura H1 + los gates de ausencia por rol (D-513 UI, INERTES) + **las 4
  CLASE 1** (el swap R2→R1: `consulta/[citaId]`, `coordinar/[citaId]`,
  `movimiento`, `mostrador/autorizar`).

## El asterisco — verificado retroactivamente (A24), sin adornar

> ancla `4004581` (confirmado por `gitCommitHash` del registro EAS); estado del
> árbol al bundlear verificado por `git status --porcelain = 0` corrido
> inmediatamente antes del publish — `isGitWorkingTreeDirty` no lo expone el CLI
> de EAS (ausente en `update:view` y `update:list --json`), así que la prueba es
> el porcelain pre-bundle, no el registro del OTA.

Ambas anclas **SIN asterisco**: el WIP ajeno que cada sesión veía apareció
DESPUÉS de su propio publish, con el árbol limpio al momento de bundlear.

## El puente updateId ↔ group (para que el founder pueda verificar)

El marcador de L-160 en pantalla renderiza `Updates.updateId` (el `id` del
update **por plataforma**), NO el `group` que este canon declara. Son dos
identificadores del MISMO publish. El puente, verificado con
`eas update:view … --json` (no de memoria):

- **CLIENTE** group `23c726eb` → updateId **`019f90c2`**-9838-… (ios
  `…-794f-9a52-41cd00fa6a87` · android `…-71b6-bb6d-ac70ff42f513`) — **coincide
  con lo que el founder ve en pantalla del cliente. OTA aplicado, confirmado.**
- **PRESTADOR** group `60a88d2f` → updateId **`019f9183`**-d927-… (ios
  `…-74cc-85ca-1ad4051403cd` · android `…-7ff5-b52c-eda6e937fcd1`) —
  verificado con `eas update:view 60a88d2f… --json` desde `apps/prestador/`.
  **Coincide con lo que el founder ve en pantalla del prestador (`019f9183`).
  OTA aplicado, confirmado — el circuito corre completo.**

**Que este puente haya que escribirlo a mano es la deuda D-520** (abajo): el
founder no puede cerrar el lazo de verificación con el camino que la casa
declaró, porque el marcador muestra un id que el canon no registra.
