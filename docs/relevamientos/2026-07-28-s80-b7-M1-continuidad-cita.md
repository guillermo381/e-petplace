# S80-B7 · M1 — LA CONTINUIDAD: lista del día → la cita (UNA pantalla)

> Boceto ANTES de composición (mecánica M1, exigida por el propio B7).
> El experimento es de MEDICIÓN: el costo real de la transición de
> elemento compartido antes de prometerla para 26 pantallas.
> Ley que lo gobierna: `DIRECCION_ARTE` §9.6 (el origen y el destino
> son parte del dato) + la física §5.2 (`cubic-bezier(.32,.72,0,1)`).

## 1. LO MEDIDO (el costo real, contra el paquete INSTALADO — no docs)

**Reanimated 4.5.0 (workspace, pnpm raíz). La API de Shared Element
Transitions EXISTE en 4.5:**

- `sharedTransitionTag` vivo en `AnimatedComponent` (censo de src:
  `createAnimatedComponent/AnimatedComponent.tsx`, `commonTypes.ts`,
  `UpdateLayoutAnimations.ts`).
- `SharedTransition` (clase, `layoutReanimation/SharedTransition.ts`)
  exportada del index — extiende `ComplexAnimationBuilder` ⇒ acepta
  `.duration()` y `.easing()`; **default 500 ms** (`durationV = 500` en
  el build) — la física de la casa exige override explícito a **340 ms
  + bezier(.32,.72,0,1)**. Su worklet interpola source→target por key
  (transform con TODO declarado en fuente: *"do proper transform
  interpolation"* — interpolación de transform INCOMPLETA, riesgo
  declarado).
- **PIEZA NUEVA de la reimplementación REA4: `SharedTransitionBoundary`
  (`{ isActive, children }`,** monta un host nativo
  `REASharedTransitionBoundaryProvider` con `display: 'contents'`**).
  Su contrato NO está documentado dentro del paquete** — presumiblemente
  delimita el árbol que participa de la transición y `isActive` la
  habilita. **Es LA incógnita del costo: dónde se monta (¿pantalla?
  ¿navigator?) y qué pasa si falta, solo lo dice el dispositivo.**
- **RN-web: SET no aplica** — el smoke web no puede gatear esto; el
  gate es SOLO dispositivo (build 1.0.3 + OTA runtime 1.0.3).

**Los hechos de las superficies (medidos en fuente):**

- La "tarjeta" de la lista **no es Tarjeta: es `Celda` interactiva**
  (`(tabs)/index.tsx:348-`), dentro del grupo del día. Navega
  `router.push('/cita/[citaId]')` (fila paseo).
- **El CANTO no existe hoy en esas filas** (B6 midió: 0 `borderWidth`
  en el HOY). El canto de capa (§9.1-9.2) NACE con este experimento —
  la fila de servicio lo lleva AL BORDE (§9.2: propiedad del TIPO).
- El archivo de la lista (`index.tsx`) está CALIENTE: B3 lo tocó hoy
  (`3f08a9c`, el gate del módulo de preparación).

## 2. EL BOCETO (§1c)

**Qué:** al tocar una fila de paseo del HOY, el CANTO de la fila viaja
y se convierte en el canto de la cabecera del detalle (`/cita/[citaId]`).
Al volver, **regresa a SU fila** — §9.6: si el usuario no sabe a qué
fila volvió, la transición falló.

- **El elemento compartido ES el canto** (B7 verbatim: "es lo que dice
  'esto es aquello'"): tira vertical al borde izquierdo, `capa.cuidado`
  degradada EN ALFA (§9.1 — canto de CAPA, un tono), `radius` heredado
  de la esquina de la fila. Tag: `` `canto-cita-${id}` `` (único por
  fila Y por pantalla — dos citas jamás comparten tag).
- **Física:** `SharedTransition` con `.duration(340)` +
  `.easing(Easing.bezier(0.32, 0.72, 0, 1))` — §5.2, ya canónica. El
  default de 500 ms NO se acepta en silencio.
- **Dosis:** cero color nuevo, cero token nuevo — `capa.cuidado` y
  radios existentes. El canto en la fila es la primera aplicación de
  §9.1 en el prestador: **eso pide su gate de craft en dispositivo**
  (L-143: píxeles, no prosa).

## 3. ESTADOS (declarados, no supuestos)

1. **Fila `en_curso`** (CitaEnVivo con glow): **en v1 el canto NO
   convive con el glow** — un solo elemento vivo por pantalla (ley del
   glow S43); la fila en vivo transiciona SIN canto (fade default).
   Decisión declarada, reversible en gate.
2. **Vuelta con la lista re-fetcheada y la cita YA NO está** (se cerró
   desde el detalle): el destino del regreso no existe → la transición
   DEGRADA a fade. Es el caso borde de §9.6 — se declara, no se
   esconde: no hay fila a la que volver porque el trabajo terminó.
3. **Filtro por oficio activo:** la fila puede estar filtrada al
   volver → mismo tratamiento que (2).
4. **Web:** sin SET — navegación normal (el smoke no miente: no gatea
   motion).

## 4. QUÉ FALTA PARA COMPONER (el M1 es el gate, no un trámite)

1. **La vara sobre este boceto** (M2 cruzada / mesa — L-153: la vara no
   la declara quien construye). Decide especialmente: el canto naciendo
   en el HOY (píxeles nuevos en la pantalla más vista del prestador) y
   la convivencia canto/glow.
2. **La adjudicación del archivo caliente** (`index.tsx` es de B hoy —
   3 commits suyos en la fecha; 76(f2) exige coordinar el hunk, no
   pisarlo).
3. Con ①+②: la composición es acotada — wrapper `Animated.View` con
   tag en DOS sitios + el canto + la config de transición; el costo
   grande ya está pagado (esta medición).

## 5. El veredicto de costo (la pregunta que B7 hace)

**El mecanismo EXISTE en el stack instalado y la física es
configurable a la de la casa — pero es EXPERIMENTAL, con una pieza de
contrato no documentado (`SharedTransitionBoundary`), interpolación de
transform declarada incompleta en fuente, y gate imposible fuera de
dispositivo.** Prometerlo para 26 pantallas ANTES del veredicto en
dispositivo de esta UNA sería exactamente el patrón que L-153/regla 77
prohíben. La promesa correcta hoy: UNA pantalla, gate founder, y el
número (jank, frames, fallos de tag) decide si escala.
