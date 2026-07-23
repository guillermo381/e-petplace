# S74-A · INCIDENTE — el publish con árbol sucio (registro + regla candidata)

## El literal

Durante S74, **B publicó el OTA del prestador con el árbol compartido
sucio**: el bundling levantó WIP MÍO sin commitear en tres wrappers del
cliente (`packages/api/src/wrappers/timeline.ts` · `citasMascota.ts` ·
`onboarding.ts` — la cura D-497 a medio camino). **Su update quedó anclado
a `582b3d0*` — con asterisco**: un punto que no existe en el historial y
no puede reconstruirse. B evaluó que no afecta al prestador (esos wrappers
no se ejecutan en su app) y NO re-publicó; la mesa validó el gate del
founder como vigente. El riesgo simétrico se evitó del lado A por freno de
mesa: el publish del CLIENTE se hizo recién con las curas COMPLETAS,
typecheck verde y **commit limpio, sin asterisco**.

## Por qué importa (el porqué de la regla)

1. **El bundling no distingue territorios**: `eas update` empaqueta el
   árbol como está — el `--only` protege los COMMITS, no los bundles.
2. **Un ancla con asterisco viola el espíritu de L-160**: el marcador
   existe para probar QUÉ CORRE; un update irreconstruible prueba *qué
   corría en una máquina un martes*.
3. Media cirugía (de performance, encima) en el teléfono del founder
   durante una prueba completa es la peor combinación: toda rareza queda
   sin explicación posible y un bug real se vuelve indistinguible de una
   cura a medio aplicar.

## REGLA CANDIDATA — SIN NÚMERO, PENDIENTE DE FIRMA FOUNDER

> **REGISTRO DEL ATRAPE (S74-A, orden de mesa):** la mesa ordenó bajar
> "L-164 y L-165" a propuesta — **y L-165 NUNCA SE DEPOSITÓ**: la
> verificación en el árbol (`grep L-165` sobre `docs/` y `.claude/`)
> devolvió **cero hits**. La mesa la ordenó como "firmada por el founder"
> y no lo estaba — **el mismo error que con L-164**, que sí se había
> depositado con atribución falsa y hoy bajó a propuesta con su
> historial. Esta regla del árbol sucio es la candidata que ese número
> iba a nombrar: **queda acá, sin número, hasta que el founder firme.**
> **Lo que vale registrar del atrape: es L-141 aplicada contra una ORDEN
> DE LA MESA, no contra el código** — "relevar lo vivo, jamás inventar"
> rige también cuando quien afirma es la mesa (es L-158 enmendada S72 en
> su forma más incómoda: la directiva que baja como premisa). El costo
> de no atraparlo habría sido una ley fantasma citada por número en
> sesiones futuras.

### La letra candidata (la firma el founder; el número lo asigna la mesa)

> **Ninguna sesión publica con archivos sin commitear en el árbol —
> propios O AJENOS: el bundling no distingue territorios.** El pre-check
> del publish es `git status --short` limpio de código (lo ajeno vivo se
> resuelve con su sesión dueña o se declara stash antes del bundling), y
> **el ancla del update se declara con su commit SIN asterisco**. Es la
> hermana de L-154 (el marcador se sube ANTES de publicar) del lado del
> árbol: el marcador dice QUÉ corre; el commit limpio dice DESDE DÓNDE.

## Nota para B (por mano del founder — L-161 sobre el marcador)

Relevado en la fuente (`apps/prestador/src/app/_layout.tsx:41`): el
marcador `[update] id=…` del prestador es **`console.log` — SOLO
logcat; cero superficie visible en pantalla**. El founder no tiene cable
ni consola: para él, la verificación de bundle del gate del prestador HOY
NO EXISTE — necesita una señal VISUAL (una superficie nueva de la tanda
que solo exista en el bundle nuevo, o un marcador visible). El cliente lo
resolvió en esta ventana con una señal de superficie: la entrada temporal
"Lámina S74" en Cuenta solo existe en el bundle nuevo.
