# S114-F · TANDA 1 — LA FRONTERA Y LA PRIMERA PUERTA

**Rama:** `pista/s114-f-1.0` @ **`4bf796d4`** (verificado por SHA contra origin)
**Worktree:** `e-petplace-s114-f` · nace de `main` @ `c72ea582`
**Legado:** `e-petplace-admin` @ **`79a6cbb`** — *commiteado y **sin pushear**: el push es del founder*
**Fecha:** 7-sep-2026. Alcance firmado: `docs/LETRA_PORTAL_ADMIN.md` v1.0.
Piso medido: `docs/loop/S114-F-RELEVAMIENTO.md`.

---

## Lo entregado

| | |
|---|---|
| **F0** | Letra depositada verbatim en `docs/LETRA_PORTAL_ADMIN.md` |
| **F1** | **Tabla de frontera en la letra, §2.4** — 29 filas de pantalla + 15 de función administrativa |
| **F2** | `apps/admin` — React 19 + Vite 8, auth + gate, layout, ruteo, sesión. **Rojo probado por camino real** |
| **F3** | Liquidación al prestador: 3 wrappers + 1 migración con puerta gateada + pantalla |
| **F4** | Dos retiros con lápida en el legado (`src/LAPIDAS.md`) |
| **F5** | `docs/loop/S114-F-PEDIDOS-A.md` — y el ítem principal **ya estaba curado** |

---

## 🔴 EL ROJO DE F2, PROBADO POR CAMINO REAL

La consigna pedía que un usuario sin fila en `admin_users` no pueda ver ninguna
ruta, **probado por camino real y no por un guard de front**. Corrido con la
cuenta de prueba del llavero (no impresa), contra producción:

```
is_admin()                          → false
POST /rpc/admin_generar_liquidacion → {"code":"P0001","message":"no_sos_admin"}
admin_users                         → HTTP 200 · 0 filas
liquidaciones                       → HTTP 200 · 0 filas
```

### El discriminador, que es lo que hace que esto valga

Un «0 filas» solo probaría que no hay datos. Lo que prueba que **la RLS filtra**
es la diferencia entre lo que hay y lo que ve:

```
                        en la base    ve el no-admin
eventos_economicos          36              35
cuentas_comerciales         15               1     ← el más fuerte
prestadores                 12              11
```

**⚠️ Y el resultado NO salió limpio a la primera: el no-admin vio 35 eventos.**
Antes de declarar nada lo medí: los 35 son de **una sola** cuenta comercial
cuyo `owner_profile_id` **es su propio uid** («Paseos Andres»). No es fuga — es
la policy `owner_select_own_eventos`, o sea el prestador viendo su propia plata,
que es exactamente el diseño de `MODELO_FINANCIERO` §4.5 y lo que hace posible
Liquidaciones v1 en la app del prestador.

🔴 **Por eso la afirmación honesta son DOS, y no una:**
1. **El front** bloquea la ruta (estado `no_admin`, con su porqué y salida).
2. **El servidor** garantiza que, aunque alguien saltee el front, **no ve datos
   ajenos**: vería su propio negocio y nada más — 1 cuenta de 15.

*«No ve ninguna ruta» es del front y es cortesía; «no ve la mesa de
operaciones» es del servidor y es la defensa. Decir sólo la primera sería
atribuirle al guard un mérito que es de la RLS.*

---

## F3 · La primera puerta

**Leído ANTES de dibujar:** `MODELO_FINANCIERO` §4.1, §4.3 y Decisión B.
La agrupación es **por cuenta+país+período** (Decisión B), no por prestador:
un actor multi-sede cobra **una sola transferencia**, y por eso la tabla
muestra los nombres de sus prestadores dentro de la fila de la cuenta.

### La medición que cambió el diseño de la pantalla

```
citas con estado_reserva='pagada' ……………… 329
de ésas, SIN evento económico ………………………… 293   (89 %)
eventos_economicos (todos pendientes) ………  36
liquidaciones en toda la historia ……………………   0
```
*(comando: `supabase db query` sobre `evento_cita_servicio` y `eventos_economicos`)*

⇒ **`$0` no habría sido «vacío»: habría sido falso.** Un prestador con citas
cobradas y sin eventos no tiene «nada que cobrar» — tiene plata cobrada que el
motor todavía no devengó. Por eso la pantalla muestra **dos magnitudes**:

- **A liquidar** — lo que ya tiene evento y se puede pagar hoy
- **Cobrado sin devengar** — citas pagadas cuyo evento no existe todavía

y una banda que **preside** cuando hay hueco, diciendo que esos importes **no
se pueden liquidar** porque el evento es lo que fija cuánto le toca a cada uno.
**La pantalla no cura el hueco: lo hace decible**, como pedía el encargo.

El tipo lo hace exigible: `VacioQueHabla` recibe `porque` **obligatorio** — no
se puede compilar un vacío mudo.

### La puerta que no existía

```
has_function_privilege('authenticated','generar_liquidacion(...)') = false
has_function_privilege('anon',         'generar_liquidacion(...)') = false
```

**`generar_liquidacion` no era llamable desde ninguna superficie web.** Por eso
hay 36 eventos pendientes y cero liquidaciones en la historia: no es que nadie
quisiera pagar — **no había puerta**.

Migración `20260911500000_s114f_puerta_liquidacion.sql`, **con su reversa
escrita ANTES** (`docs/relevamientos/S114-F-REVERSA-…sql`) y **76(g) declarada:
NO RIGE** (DDL aditiva, sin backfill).

- Crea `admin_generar_liquidacion` con gate `is_admin()` — **el de la casa**, no uno nuevo.
- **NO le concede EXECUTE a `generar_liquidacion`**: abrirla directo dejaría a
  cualquier `authenticated` liquidando cuentas ajenas (es DEFINER y no tiene
  gate propio, medido).
- Rebota hablado y tipado: `cuenta_no_activa`, `sin_eventos_en_periodo`,
  `periodo_invertido`, `periodo_incompleto`.
- **Holdback fijo en 0, y es decisión:** la retención no está firmada en ninguna
  letra. *Exponer una perilla que nadie decidió es invitar a que alguien elija
  un número en una pantalla y eso se vuelva política sin firma.*

**Cinturón corrido dentro de la migración, con discriminador:**
```
CINTURON OK: anon=f authenticated=t motor_interno_abierto=f
```
El tercer número es el que importa: si `generar_liquidacion` quedara abierta a
`authenticated`, el gate sería salteable y el cinturón aborta.

**Verificado después contra el objeto** (no contra el «Finished» del push):
`existe=1 · puerta_anon=false · puerta_auth=true · tiene_gate=true · motor_interno_auth=false`.

---

## La frontera con A, respetada al pie

- Wrappers **sólo** bajo `packages/api/src/admin/` (3 archivos, 430 líneas).
- **`packages/api/src/index.ts` NO se tocó.** Por eso `src/admin/` lleva su
  propio barrel y `apps/admin` entra por alias de Vite. *Si A quisiera
  exponerlo desde el índice, es un re-export de una línea y esta frontera
  desaparece sin romper nada.*
- `database.types.ts` **no se regeneró** (es generado y vive fuera de mi
  territorio) ⇒ la llamada va por un cast **declarado en el propio archivo**,
  con el pedido de `gen:types` nombrado adentro.
- Typecheck `apps/admin`: **verde**. Typecheck `packages/api`: los 2 errores
  que salen son de `@epetplace/domain` sin construir, en archivos que no son
  míos — **pre-existentes**.
- Build: **199,83 kB** (63,22 kB gzip). *El legado pesa 1,9 MB.*

---

## F4 · Los dos retiros

Borrados `src/pages/Adopcion.tsx` (1.514 líneas) y `src/pages/Notificaciones.tsx`
(953), con sus rutas e items de menú. **Lápida en `e-petplace-admin/src/LAPIDAS.md`
con el porqué y sus números**, más una lápida corta en el lugar del import de
`App.tsx` — donde va a mirar quien busque la pantalla.

El legado **compila verde** tras los retiros (`npx tsc -b`, sin salida).

**Lo que la lápida declara y no se tocó:** `Dashboard.tsx` sigue leyendo
`solicitudes_adopcion` (modelo viejo, en 0), y `Layout.tsx`/`Mensajes.tsx`
siguen suscribiéndose a `mensajes_admin_seller`, que no existe. **Son roturas
distintas y fuera del alcance de estos dos retiros.**

---

## F5 · El pedido que no hizo falta

El encargo decía *«anotá y no cures: `otorgar_puntos` quedó con D-314 a
medias»*. **Lo medí antes de escribir la nota y ya estaba curado por A** ese
mismo día (`tiene_gate=true`, `anon=false`), con el rojo producido por camino
real: HTTP 204 y 999 puntos escritos por una cuenta no-admin.

🔴 **Se deja escrito que no hay pedido, en vez de borrar el ítem** — si
desapareciera, la próxima lectura del encargo mandaría a A a curar lo que
acababa de curar.

---

## 🔴 LO QUE NO PUDE MEDIR, Y LO QUE QUEDA AMBIGUO

- **La pantalla no se abrió en un navegador.** Compila, buildea y sus wrappers
  se probaron contra la base por camino real, pero **nadie la vio**. El
  veredicto visual es del founder y **no lo doy por pasado**.
- **No se generó ninguna liquidación de verdad.** El rebote de la puerta está
  probado (`no_sos_admin`); **el camino feliz no**: hacerlo mueve 36 eventos
  reales a `liquidado` y crea una liquidación sobre plata de un tercero. *Eso
  es un acto de operación, no una prueba de F* — y su modo de falla es que un
  prestador aparezca cobrado sin haber cobrado.
- **El rastro de uso sigue ambiguo, igual que en el relevamiento.**
  `prestador_documentos` tiene 8 de 11 revisados (última 15-ago) y **no puedo
  distinguir si lo hizo el admin o alguien por SQL**. Es el dato que más pesa
  para la tanda 2 (verificación de prestadores) y sigue sin resolverse.
- **`liquidaciones` tiene 0 filas históricas**, así que la pantalla nunca se vio
  con una liquidación ya generada. El estado «después de generar» está escrito
  y **no observado**.
- **No verifiqué el efecto de los retiros en el deploy del legado.** Compila,
  pero no tengo acceso al dashboard de Vercel: **no vi el deploy resultante**.
- **La copia de tokens es una deuda declarada, no medida:** `apps/admin/src/tokens.ts`
  copia los valores de `packages/ui/src/tokens/`. Si la casa cambia un hex,
  este archivo no se entera. La cura —sacar los tokens a un paquete sin RN— es
  territorio de B, no de F.

---

## Operativo

- **1 migración** aplicada y verificada contra el objeto · reversa escrita ANTES · 76(g) declarada NO RIGE.
- **Archivos nuevos:** `apps/admin/` (13) · `packages/api/src/admin/` (3) · letra · 3 docs de loop · 1 reversa.
- **Legado:** 2 archivos borrados, 3 modificados, 1 lápida nueva. **Cero cambios más**, como pedía el encargo.
- ⚠️ **Las 5 migraciones de A copiadas al worktree para desbloquear `db push` NO se commitean.**

---

# ADENDA · EL PUSH DEL LEGADO (7-sep-2026)

`e-petplace-admin` tenía **dos** commits sin empujar. Se midió el ajeno **antes**
de empujar nada, y se empujaron como **actos separados**.

## ① El commit de Placas — MEDIDO, **NO obsoleto**, empujado

`c0aee5e` · «Placas · los lotes de códigos se crean acá (S113 fase 3)» ·
3 archivos, **167 líneas, todas aditivas**.

**Corrección de premisa, con el dato:** no estuvo *semanas* sin salir — es del
**7-sep 00:02**, unas 18 horas antes de empujarlo. *Lo que sí estuvo meses
quieto es el repo: el commit anterior es del 10 de mayo.* Son dos cosas
distintas y la segunda es la que engaña.

**Contra qué modelo apunta, medido contra la base viva:**

| lo que la pantalla usa | estado |
|---|---|
| `pasaporte_lote` → `id, nombre, cantidad, proveedor, creado_en` | ✅ existe, las 6 columnas |
| `crear_lote_placas(p_nombre text, p_cantidad integer, p_proveedor text)` | ✅ firma exacta |
| `listar_placas_de_lote(p_lote_id uuid)` | ✅ firma exacta |
| gate de las dos | ✅ `is_admin` en el cuerpo · `anon=false` · `auth=true` |
| rebote por camino real como no-admin | ✅ `42501 solo_admin` · tabla `HTTP 403` |

**Y lo decisivo: ninguna migración posterior tocó el modelo.** El único archivo
que menciona `pasaporte_lote` / `crear_lote_placas` / `listar_placas_de_lote` en
todo el monorepo es `20260909680000_s113a_placas.sql`, **la que las creó**.

⇒ **No es el caso de adopción ni de notificaciones.** Esas dos apuntaban a un
modelo que se movió debajo. Ésta apunta a un modelo **intacto**. Se empujó.

### 🔴 Pero apareció otra cosa, y no es obsolescencia: un defecto DE ORIGEN

Cotejando el contrato de salida con lo que la pantalla consume:

```
listar_placas_de_lote devuelve : { serie, token, activada }      ← booleano
Placas.tsx declara y consume   : { serie, token, activada_en, mascota_id }
```

**`mascota_id` no existe en la respuesta, y `activada_en` tampoco** (el campo se
llama `activada`). Efecto medido por lectura:

- `Placas.tsx:93` — `placas.filter((p) => p.mascota_id === null).length`
  ⇒ `undefined === null` es **false** ⇒ **el contador «libres» da 0 siempre**,
  aunque el lote entero esté sin activar.
- `Placas.tsx:151` — `{p.mascota_id ? '· activada' : ''}`
  ⇒ `undefined` es falsy ⇒ **nunca marca una placa como activada**.

**No es deriva: la función y la pantalla nacieron el mismo día, en S113.** La
función siempre devolvió esos tres campos. *La pantalla nació con el defecto.*

**Por qué se empujó igual, y no es indulgencia:**
1. Es **aditivo**: no rompe nada de lo que ya funcionaba.
2. **Lo esencial funciona**: crear el lote, listar, y el **CSV con los tokens** —
   que es lo único que no se puede regenerar— sale correcto.
3. **Cero lotes creados en la historia** (`select count(*) from pasaporte_lote` = 0)
   ⇒ el defecto **nunca mostró un número mal a nadie**.
4. No escribe nada mal: los dos campos rotos son de **lectura**.
5. Y `79a6cbb` es **hijo** de `c0aee5e`: no empujarlo bloqueaba también el retiro,
   y separarlos exigía reescribir historia por dos indicadores.

**Cura propuesta, NO aplicada** (fuera del alcance de esta tanda, que dice «cero
cambios al legado salvo los dos retiros»): es de **dos líneas** y usa el campo
que sí viene —

```
type Placa = { token: string; serie: number; activada: boolean }
const libres = placas.filter((p) => !p.activada).length
{p.serie}. {p.token} {p.activada ? '· activada' : ''}
```

*El tipo declarado es lo que hizo invisible el defecto: TypeScript no valida la
forma de un `jsonb` en runtime, así que declarar `mascota_id` en el tipo lo
volvió cierto para el compilador y falso para la pantalla.*

## ② Los dos actos, verificados por SHA contra origin

```
ANTES   origin/main = 79eb141   (10-may-2026)

acto 1  c0aee5e  Placas · S113 fase 3
        local c0aee5e0844e1bbf... == origin c0aee5e0844e1bbf...   ✅

acto 2  79a6cbb  Retiro de Adopcion y Notificaciones · S114-F
        local 79a6cbb82c786353... == origin 79a6cbb82c786353...   ✅

DESPUÉS  commits sin pushear = 0
```

⚠️ **Efecto declarado:** el legado **despliega solo en Vercel al push a `main`**
(su README y `vercel.json`). Con estos dos actos, el retiro de Adopción y
Notificaciones **y** la pantalla de Placas entran al deploy. **No verifiqué el
deploy resultante** — no tengo acceso al dashboard de Vercel.
