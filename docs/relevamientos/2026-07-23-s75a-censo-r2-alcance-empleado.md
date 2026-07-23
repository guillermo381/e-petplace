# S75-A7 · CENSO DE ALCANCE DE R2 (`obtenerMiCuentaComercial`) × los gates de B2 — ANTES DEL PUBLISH

> El cruce que B no podía ver sola: **R1 (A1) ya abrió la puerta** (ver A6), así
> que las 19 consumidoras de R2 pasan a ser **alcanzables por un empleado
> activo**. R2 resuelve por `owner_profile_id` (owner-only) — a un empleado
> no-owner le devuelve `ok:false / data:null`. Los gates de B2 (`a764563`)
> cubren **solo NEGOCIO + los 4 talleres**. Todo lo demás queda descubierto.

## 1. QUÉ GATEA B2 (literal, `useSoloGestorDenegado`)

`grep` de `useSoloGestorDenegado`: `(tabs)/negocio.tsx` · `paseo/taller.tsx` ·
`grooming/taller.tsx` · `adiestramiento/taller.tsx` · `veterinaria/taller.tsx`
(+ el hook en `lib/gate-gestor.ts`). Más el gate de AUSENCIA del tab NEGOCIO en
el bar. **Cobertura: NEGOCIO + los 4 talleres de oficio.**

## 2. LAS 19 CONSUMIDORAS DE R2, CRUZADAS

**⛔ ROMPEN — R2 null ⇒ pantalla de error (alcanzables por no-gestor, FUERA de NEGOCIO):**

| Ruta | Tab / origen | Línea que rompe |
|---|---|---|
| `veterinaria/mostrador/autorizar.tsx` | **HOY → "Registrar atención"** (EL TRABAJO DE RECEPCIÓN) | `:109 if (!cuenta.ok \|\| cuenta.data === null) { setErrorCarga(true) }` |
| `veterinaria/consulta/[citaId].tsx` | HOY → atención clínica | `:201 setErrorCarga(true)` |
| `veterinaria/coordinar/[citaId].tsx` | HOY → coordinar | `:118 setEstado({ fase: 'error' })` |
| `veterinaria/movimiento.tsx` | HOY → movimiento | `:60 setPantalla({ estado: 'error' })` |
| `cuenta-comercial/index.tsx` | la plata | `:58 setCuenta('error')` |
| `cuenta-comercial/bancarios.tsx` | la plata | `:79 setBase('error')` |

**🟡 DEGRADAN — R2 null ⇒ best-effort, la pantalla sigue (null honesto):**

| Ruta | Tab | Cómo degrada |
|---|---|---|
| `(tabs)/index.tsx` | **HOY** | `:537` comentario literal *"Su error NO rompe la jornada"* — sin la sección "por coordinar" del mostrador |
| `(tabs)/cuenta/perfil.tsx` | **CUENTA** | `:110-115` `if (rCuenta.ok && …) …; else setVisible(null)` — la fila de estado no aparece |
| `veterinaria/cita/[citaId].tsx` | HOY | `:127 if (cta.ok && cta.data) { …presupuestos }` — sin presupuestos |
| `veterinaria/presupuesto/nuevo.tsx` | HOY | `:81 if (cta.ok && cta.data) setCuentaId` — no puede crear (incompleto, no error) |
| `paseo/index.tsx` · `grooming/index.tsx` · `adiestramiento/index.tsx` | hubs de oficio | el guard mira `rOfertas/rFranjas`, no la cuenta directa |
| `liquidaciones.tsx` | la plata | el guard mira `rEventos/rLiquidaciones` |

**✅ GATEADAS por B2 (un no-gestor no las alcanza):** `(tabs)/negocio.tsx` +
los 4 `*/taller.tsx`.

## 3. EL VEREDICTO PARA EL PUBLISH

**Hay ≥6 pantallas que ROMPEN para un empleado no-gestor, fuera de NEGOCIO — y
una es el corazón del E2E: `veterinaria/mostrador/autorizar.tsx`, el "Registrar
atención" de la recepcionista.** R2 es el SEGUNDO MURO que D-512 ya nombraba
(*"`obtenerMiCuentaComercial` por `owner_profile_id`, 19 pantallas"*), y **no se
tocó en S75 por decisión founder** (R2/administrador fuera del v1).

**Para el E2E de la recepcionista, camino por camino:**
- **HOY** → degrada (✓ funciona sin la sección de coordinar).
- **CUENTA** → degrada (✓).
- **"Registrar atención" (mostrador)** → **ROMPE** (`setErrorCarga`). Es su
  trabajo, y es lo primero que una recepcionista toca después de HOY.

**Esto se decide antes del gate, jamás en vivo (mandato de mesa):**
- **Opción A — GATEAR la navegación:** el mostrador y las pantallas de atención
  que llaman R2 se cierran a no-owner con voz honesta (Ley 23), como B hizo con
  NEGOCIO. Pero el mostrador ES de recepción — cerrárselo contradice A3.4 (la
  recepción recibe). El problema real es que el mostrador **necesita el
  `cuenta_comercial_id` y lo resuelve por owner**, cuando debería resolverlo por
  el NEGOCIO del empleado (R1 ya lo trae: `cuenta_comercial_id` entró a
  `MiPrestador` en A1). **La cura correcta del mostrador es migrar su resolución
  de R2 a R1** — no gatearlo.
- **Opción B — DECLARAR el alcance del E2E:** el gate del founder de S75 se
  limita a HOY + CUENTA + el handshake (que degradan/funcionan), y el mostrador
  con empleado queda para cuando R2→R1 se migre. El E2E de recepción completo
  espera esa migración.

**Recomendación de la sesión (no decisión):** el mostrador es demasiado central
para el E2E de recepción como para dejarlo roto o declararlo afuera — pero
migrar 6 pantallas de R2→R1 es trabajo de arco, no de pre-publish. **Para el
publish de HOY: Opción B (declarar el alcance), con la migración R2→R1 del
mostrador como el primer ítem del arco de equipo v2** (nace deuda, ver abajo).
La decisión es de mesa.

## 4. VERIFICACIÓN

`grep` de `obtenerMiCuentaComercial` (19 archivos), `useSoloGestorDenegado` (5
+ hook), y lectura del patrón de uso (`if (!cta.ok …) → error` vs
`if (cta.ok && …) → best-effort`) en cada consumidora. Cero escritura.
