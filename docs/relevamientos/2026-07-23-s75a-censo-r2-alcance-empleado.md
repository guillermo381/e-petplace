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

## 2. LAS 19 CONSUMIDORAS — TABLA COMPLETA CON LA COLUMNA QUE DECIDE

**⛔ ROMPEN (R2 null ⇒ pantalla de error) — SON EXACTAMENTE 6:**

| # | Ruta:línea | QUÉ USA DE R2 | CLASE | Camino / alcance |
|---|---|---|---|---|
| 1 | `veterinaria/consulta/[citaId].tsx:201` | `cta.data.id` (`:206`) + `cta.data.countryCode` (`:207`) | **1** — `id`→R1 directo; `countryCode`→`prestador.country_code` de R1 (coincide en unipersonal) | HOY→`cita/[citaId]:285`→consulta. **EN EL CIRCUITO** (el prestador atiende la consulta agendada) |
| 2 | `veterinaria/mostrador/autorizar.tsx:110` | `cuenta.data.id` (`:115`) — nada más | **1** — solo `cuenta_comercial_id` | walk-in (`mostrador/index:172`, `nueva:136`). **NO en el circuito de cita agendada** |
| 3 | `veterinaria/coordinar/[citaId].tsx:117` | `cta.data.id` (`:121`) | **1** — solo id | HOY→coordinar (`index:1003`), para `por_coordinar`. **NO en el circuito** (founder 0 por_coordinar) |
| 4 | `veterinaria/movimiento.tsx:60` | `cta.data.id` (`:64`) | **1** — solo id | SOLO desde `negocio.tsx:346`. **Gateada de facto** (NEGOCIO no aparece al no-gestor) |
| 5 | `cuenta-comercial/index.tsx:58` | `r.data` ENTERO (renderiza la cuenta) | **2** — campos de `cuentas_comerciales` | desde `negocio:322`/`liquidaciones:218`. **Gateada de facto** + owner-only correcto |
| 6 | `cuenta-comercial/bancarios.tsx:79` | `.id` + `.countryCode` + datos bancarios | **2** — datos bancarios (Decisión L) | idem. **Gateada de facto** + owner-only correcto |

**🟡 DEGRADAN (R2 null ⇒ best-effort, la pantalla sigue) — 8:**

| Ruta | Tab | Cómo degrada |
|---|---|---|
| `(tabs)/index.tsx:537` | **HOY** | comentario literal *"Su error NO rompe la jornada"* — sin la sección "por coordinar" del mostrador |
| `(tabs)/cuenta/perfil.tsx:110` | **CUENTA** | `if (rCuenta.ok && …) …; else setVisible(null)` — la fila de estado no aparece |
| `veterinaria/cita/[citaId].tsx:127` | HOY | `if (cta.ok && cta.data) { …presupuestos }` — sin presupuestos |
| `veterinaria/presupuesto/nuevo.tsx:81` | HOY | `if (cta.ok && cta.data) setCuentaId` — incompleto, no error |
| `paseo/index.tsx:106` · `grooming/index.tsx:104` · `adiestramiento/index.tsx:93` | hubs de oficio | el guard mira `rOfertas/rFranjas`, no la cuenta directa |
| `liquidaciones.tsx:105` | la plata | el guard mira `rEventos/rLiquidaciones` |

**✅ GATEADAS por B2 (por rol, no de facto):** `(tabs)/negocio.tsx` +
`paseo/taller` · `grooming/taller` · `adiestramiento/taller` · `veterinaria/taller`.

**Cuenta: 6 rompen + 8 degradan + 5 gateadas por B2 = 19.** ✓

## 3. EL VEREDICTO, CONTRA EL CRITERIO DE MESA (el OTA lleva lo que el circuito TOCA)

**De las 6 que rompen, solo UNA está en el circuito de la cita agendada del
founder: `veterinaria/consulta/[citaId].tsx` (la pantalla donde el prestador
ATIENDE la consulta que el founder reservó desde el cliente).** Es CLASE 1.

- Las otras dos CLASE 1 alcanzables (`autorizar` walk-in, `coordinar`
  por_coordinar) **no están en el circuito** de una cita agendada.
- `movimiento` y las dos `cuenta-comercial/*` (CLASE 2) **están gateadas de
  facto** — su único camino es desde NEGOCIO, que no aparece al no-gestor.

**Por lo tanto, la pregunta que fija el alcance del OTA es UNA:**
**¿el gate del founder llega a que el EMPLEADO atienda la consulta, o se detiene
en el handshake (el empleado entra a HOY)?**

- **Si se detiene en el handshake:** nada del circuito rompe — HOY degrada,
  CUENTA degrada, el handshake es pantalla nueva. **El OTA sale; las CLASE 1 se
  declaran en D-517.**
- **Si el empleado atiende:** `consulta/[citaId]` rompe. La cura es **CLASE 1 =
  swap R2→R1** (R1 ya trae `cuenta_comercial_id` desde A1) — **las 4 CLASE 1
  juntas son ~media hora, cero migración**, no un arco. Se curan antes del OTA.

Las 2 CLASE 2 (`cuenta-comercial/*`) NO se tocan: son gestión de la plata,
owner-only correcto, gateadas de facto por NEGOCIO — v2 con migración + OK
founder si algún día el administrador las gestiona.

**El mostrador `autorizar` (walk-in) es CLASE 1 pero NO circuito de cita
agendada** — se cura en la misma tanda de swap cuando el E2E de recepción
walk-in entre, no bloquea el circuito del gate de S75.

## 4. VERIFICACIÓN

`grep` de `obtenerMiCuentaComercial` (19 archivos), `useSoloGestorDenegado` (5
+ hook), y lectura del patrón de uso (`if (!cta.ok …) → error` vs
`if (cta.ok && …) → best-effort`) en cada consumidora. Cero escritura.
