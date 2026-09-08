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

---

# ADENDA 2 · LA CURA DE PLACAS (excepción nombrada, firma del founder)

**Autorizada como excepción al «cero cambios al legado» de la tanda 1.** Razón,
verbatim del founder: *«es un defecto conocido, de dos líneas, en un repo que
acaba de despertar después de cuatro meses — y lo que sobrevive a una sesión así
sobrevive a octubre.»*

**Legado `e-petplace-admin` @ `f1db76e`** — acto propio, empujado y verificado.

## Qué se curó, y por qué fueron TRES cambios y no dos

| # | dónde | antes | ahora |
|---|---|---|---|
| ① | `type Placa` | `activada_en: string \| null; mascota_id: string \| null` | `activada: boolean` |
| ② | `Placas.tsx:93` | `p.mascota_id === null` | `!p.activada` |
| ③ | `Placas.tsx:151` | `p.mascota_id ? '· activada' : ''` | `p.activada ? …` |

🔴 **El tipo NO es un tercer cambio cosmético: es la causa.** Curar sólo los dos
consumos dejaba viva la razón por la que el defecto era invisible — el compilador
seguiría dando por ciertos dos campos que no viajan, y el próximo que escriba
`p.mascota_id` en ese archivo no encontraría ninguna resistencia. **El tipo ahora
es copia literal del `jsonb_build_object` de la función.**

`tsc -b` verde · `npm run build` verde.

## La lección — `L-498`

Depositada en `docs/DEUDAS_CANONICAS.md`. **Número pedido con
`pnpm proximo:ficha`, no elegido** (`L-: tope L-497 · PROXIMO LIBRE L-498`).

> ***Un tipo declarado sobre un `jsonb` es cierto para el compilador y falso para
> la pantalla.*** TypeScript no valida forma en runtime, así que escribir un
> campo en el tipo **lo hace existir para todos menos para el usuario**: el
> compilador lo ve, el editor lo autocompleta, el revisor lo lee como si
> viniera — y la única que sabe la verdad es la pantalla, que no habla.

**Lo que la hace cara: no falla.** No hay excepción ni rojo; hay dos números
plausibles. Un `0` en «placas libres» se lee como dato, no como síntoma. Es
*verosímil-falso* (L-139) entrando por una puerta nueva: **no por lo que un
modelo inventa, sino por lo que el tipo promete.**

⚠️ **Ningún gate de la casa lo ve, y queda escrito:** el typecheck da verde
—el tipo es coherente consigo mismo—, el build sale, y `verify:diseno` no mira
contratos. Lo cazó cotejar a mano el `jsonb_build_object` contra los campos
consumidos.

⇒ **La regla:** el tipo de un retorno `jsonb` **se copia del
`jsonb_build_object` de la función, no se escribe de memoria**. Y su corolario,
que no es sobre `jsonb`: vale para toda frontera donde el tipo lo declara el
**consumidor** y no el productor — `RETURNS record`, un `as` sobre un `fetch`,
un `JSON.parse`. *Donde el tipo se escribe a mano, el contrato se mide contra el
productor o no se mide.*

## Los tres actos del legado, verificados por SHA

```
c0aee5e  Placas · S113 fase 3                      (medido antes de empujar)
79a6cbb  Retiro de Adopcion y Notificaciones       (S114-F · F4)
f1db76e  Placas · la cura del contador             (excepción nombrada)
         local f1db76e6b34e5c23... == origin f1db76e6b34e5c23...   ✅
         commits sin pushear = 0
```

⚠️ **Sigue sin verificarse el deploy**: el legado despliega solo en Vercel al
push a `main`, y no tengo acceso al dashboard. **Tres pushes ⇒ tres deploys**, y
no vi ninguno.

---

# ADENDA 3 · DÓNDE QUEDA PUBLICADO Y QUÉ SALIÓ

## 🔴 La URL: el repo la dice MAL, y el dato correcto se midió

**El repo NO tiene `.vercel/project.json`** — y **`.vercel` tampoco está en el
`.gitignore`**, así que no es que esté oculto: nunca se linkeó desde este árbol.
`vercel.json` sólo tiene el rewrite de SPA. Lo único que declara un dominio son
dos lugares, y **los dos dicen lo mismo y es la URL equivocada**:

```
CLAUDE.md:4        > Deploy: https://e-petplace-admin-git-main-guillo381-8993s-projects.vercel.app
Login.tsx:47       redirectTo: 'https://e-petplace-admin-git-main-...vercel.app'
```

**Medidas las dos:**

| URL | resultado |
|---|---|
| `e-petplace-admin-git-main-…vercel.app` *(la que el repo declara)* | **HTTP 200 · 338.841 bytes de la pantalla de Vercel**: «Log in to Vercel», «Protected Deployment», «SSO» |
| **`e-petplace-admin.vercel.app`** | **HTTP 200 · 466 bytes — la app**, con nuestro `<title>e-petplace-admin</title>`, `#root` y el bundle compilado |

⇒ **EL DOMINIO DE PRODUCCIÓN ES `https://e-petplace-admin.vercel.app`.** La que
el repo llama «Deploy» es una **URL de deployment de rama con Deployment
Protection**: no sirve la app, sirve el login de Vercel.

*(No hay dominio custom: `admin.epetplace.com` no resuelve · `www.epetplace.com/admin` da 404.)*

### 🔴 Y eso rompe algo vivo: el login con Google

El bundle **publicado** contiene, literal:

```js
signInWithOAuth({provider:`google`,options:{redirectTo:`https://e-petplace-admin-git-main-…vercel.app`}})
```

⇒ **quien entre por «Continuar con Google» desde producción aterriza en la
pantalla de login de Vercel, no en el admin.** El login por email/contraseña no
usa `redirectTo` y **sí funciona**.

**No lo curé:** la excepción firmada era para Placas. Es una línea, y va con la
decisión de qué URL es la canónica —que es del founder, no mía.

## Qué salió con los pushes — medido sobre el BUNDLE, no sobre las rutas

⚠️ **Por qué no se verifica pidiendo `/adopcion`:** `vercel.json` reescribe
`/(.*)` a `/`, así que **toda ruta devuelve el mismo `index.html` con HTTP 200**.
*Un 200 en `/adopcion` no probaría que la pantalla existe, y un 200 tampoco
probaría que se fue.* La verificación real es sobre el JS publicado.

Bundle medido: `/assets/index-DXeDj3p_.js` · 1.854.729 chars.

```
① LAS DOS RETIRADAS — deben estar AUSENTES
   Adoptadas este mes ✅   Entrevista programada ✅   adopcion_seguimiento ✅
   mascotas_adopcion  ✅   Asunto del email      ✅   Enviadas este mes    ✅
   Cita recordatorio  ✅   Editar mascota        ✅            → 8 de 8 AUSENTES

② PLACAS — debe estar PRESENTE
   crear_lote_placas ✅  listar_placas_de_lote ✅  pasaporte_lote ✅
   "Proveedor de impresión" ✅  "Crear un lote" ✅   → 5 de 5 PRESENTES

③ CONTROL POSITIVO — pantallas que siguen
   "Activar todas las zonas" ✅  Arrepentimiento ✅
   Liquidaciones (6) ✅  Gamificación (3) ✅          → el instrumento SÍ encuentra
```

**Sin el bloque ③ el ① no valdría nada:** ocho ausencias podrían ser un
buscador roto. El control positivo prueba que encuentra cuando hay.

> ⚠️ **Un instrumento propio salió mal y se declara:** la primera corrida usó
> `grep -c … || echo 0`, que imprime **dos** ceros cuando no encuentra —
> `grep` ya emite `0` y el `||` agrega otro— y mi test leía `"0\n0"` como
> «presente». **Los ocho retirados salieron 🔴 PRESENTE, y era falso.** Se rehízo
> con un contador limpio. *Un instrumento que reporta lo contrario de la verdad
> no falla: contesta.*

## Estado del tercer deploy (la cura de Placas)

**El bundle publicado corresponde a `79a6cbb`** (los retiros), **no a
`f1db76e`** (la cura). Medido en el propio bundle:

```
fragmento de Placas en producción: filter(e=>e.mascota_id===null)   ← el defecto, vivo
```

**El auto-deploy SÍ funciona** —ese mismo bundle ya trae Placas, que sólo salió
con mi push de `c0aee5e`— así que lo que falta es que corra el tercero.
**Hash esperado cuando salga: `index-Px6202vT.js`** (build local de `f1db76e`,
verificado: `.mascota_id`=0 · `.activada`=1 en el fragmento de Placas).

🔴 **Se deja escrito en vez de darlo por hecho:** *pushear no es desplegar.* Si
hubiera asumido que el push implica el deploy, habría reportado la cura como
viva en producción cuando el defecto todavía está sirviéndose.

### 🔴 A los 12 minutos NO había salido — y eso ya no es «esperá un poco»

```
commit de la cura   f1db76e   20:03:52 -05
última medición               20:15:55 -05   → 12 min 03 s
bundle servido                index-DXeDj3p_.js  (sin la cura), en 9 sondeos
```

**El build tarda 628 ms.** Doce minutos sin cambiar el bundle **no es latencia
de build**: o el deploy está en cola, o falló, o el auto-deploy no disparó esta
vez. **No lo puedo distinguir sin el dashboard de Vercel**, y no voy a elegir
una de las tres.

*Hipótesis no medida, anotada como hipótesis:* el proyecto podría estar tocando
el techo de deploys de Vercel (ventana móvil de 24 h) — le pasó a `pagos-web` en
S105. **Fueron tres pushes en 90 minutos sobre un repo que llevaba cuatro meses
sin desplegar.** No lo verifiqué.

**Lo que hay que mirar en el dashboard**, en este orden: ¿hay un deployment para
`f1db76e`? ¿en qué estado? Si dice *Error*, el log dice por qué; si no existe,
el auto-deploy no disparó; si dice *Queued*, alcanza con esperar.

**Y lo que sí está verificado y no depende de eso:** los dos retiros **ya están
en producción** y Placas **ya carga**. La cura de las dos líneas es lo único que
falta llegar.

---

# TANDA 2 (7-sep-2026)

## ① EL DESPLIEGUE — ✅ SALIÓ, y verificado en producción

**Bundle en producción: `index-fK9Opg5L.js`** (antes `index-DXeDj3p_.js`).

```
¿trae la cura de Placas?
  .mascota_id en el fragmento de Placas ……… 0   ✅
  .activada   en el fragmento de Placas ……… 1   ✅
  el contador ahora ……… filter(e=>!e.activada)  ✅

¿trae la URL canónica?
  URL de rama (protegida) ……… 0 ocurrencias     ✅
  URL canónica ……………………………… 1 ocurrencia      ✅

control: los retiros siguen
  "Adoptadas este mes" AUSENTE · "Asunto del email" AUSENTE   ✅
```

🔴 **Y una corrección a mi propia predicción, que explica la espera:** yo esperaba
`index-Px6202vT.js` —el build de `f1db76e` sola— y **nunca iba a aparecer**.
Vercel desplegó **el último commit**, no cada uno: el deploy que salió es de
`73b275c`, que contiene la cura **y** la corrección de URL juntas. *Predije el
hash de un commit intermedio; el deploy sigue la punta.* Es la misma clase que
`L-487`: la medición era correcta y el salto fue mío.

**No hizo falta evidencia del dashboard.** La demora total fue de ~50 min para
un build de 628 ms, y sigue sin explicación medida — pero **el resultado se
verificó por contenido, que era lo que importaba.**

## ② LA URL CANÓNICA — corregida y desplegada

`https://e-petplace-admin.vercel.app`, firma del founder. **Excepción nombrada**,
como la de Placas. Legado `73b275c`.

⚠️ **Eran DOS lugares, no tres:** «el `redirectTo` de `signInWithOAuth`» y
«`Login.tsx:47`» **son la misma línea**. Los dos reales eran `Login.tsx` y
`CLAUDE.md:4`; la URL de rama quedó sólo en `CLAUDE.md` **marcada como NO USAR
con su razón**, para que nadie la reponga.

**El camino de entrada roto está curado en producción:** el bundle publicado ya
no lleva la URL protegida.

## ③ EL ASIENTO DE LA CASA — la bandeja y la Hoja

### El candado de §9, medido antes de escribir una línea

```
grants de casos_postventa a authenticated ……… SELECT   ← y nada más
grants de caso_mensajes  a authenticated ……… SELECT
INSERT directo por camino real ……… HTTP 403 · 42501 permission denied
policy de tres asientos ……… familia = auth.uid() OR es_mi_prestador(...) OR is_admin()
```

⇒ **El `REVOKE` de §9.1 está aplicado y probado por camino real.** Esta capa **no
podría** escribir directo aunque quisiera. Y **el «rol casa» de §9.2 ES
`is_admin()`** — el mismo gate del resto del portal, no uno nuevo: dos
definiciones de «quién es la casa» divergirían.

### Lo que la Hoja muestra (§6), y de dónde sale cada cosa

`leer_caso` trae el caso y el objeto, pero **no** la plata, ni el devengo, ni los
90 días, ni la propuesta. La capa junta cinco fuentes:

| §6 pide | de dónde sale |
|---|---|
| el objeto con su evidencia | `leer_caso` → `objeto{tipo,id,titulo,fecha}` |
| el hilo entero | `leer_mensajes_caso` (cursor compuesto, 200) |
| **cuánto se pagó** | del objeto **por tipo** — no hay campo común |
| **cuánto se puede devolver** | techo = lo pagado |
| **si tiene devengo** | `_caso_tiene_devengo` — la pregunta al OBJETO, como hace `caso_resolver` |
| casos de familia / prestador en 90 días | `casos_postventa` por RLS, sin contar éste |
| **la propuesta, marcada como propuesta** | 🔴 **no existe** — ver abajo |

**Decidir es un toque:** tres alcances medidos del cuerpo de `caso_resolver`
(`total` · `parcial` · `sin_devolucion`), la parcial exige monto, y **queda
`decidido_por`**. No se escribe estado a mano: la RPC pregunta el devengo y llama
a `aplicar_reembolso`, que reversa la comisión proporcionalmente. *Escribir el
estado a mano dejaría plata sin reversar y el caso diría que sí.*

### 🔴 La propuesta de la máquina NO existe, y la Hoja lo dice

Censado en `pg_proc`: no hay ninguna función de propuesta de postventa (las que
aparecen —`proponer_memoria_coach`, `proponer_sku_vendedor`— son de otros
dominios). **Por eso `propuesta` viaja como `null` y su lugar en la Hoja explica
que todavía no hay motor**, en vez de quedar vacío o —peor— mostrar una
heurística escrita por mí que se leería como si fuera del sistema. *Una
propuesta inventada acá tendría autoridad de máquina sobre plata de un tercero,
y no la respalda nadie.*

### Los vacíos que hablan — ninguno es mudo

- **Bandeja sin casos:** *«el motor está construido y gateado, pero sus puertas
  —las pantallas desde donde una familia abre un caso— todavía no están en las
  apps: hasta que existan, esta bandeja no puede recibir nada. No es que
  estemos filtrando: no hay filas.»* (`casos_postventa` = **0 filas**, medido.)
- **Hilo vacío · plata que no se pudo determinar · propuesta ausente:** cada uno
  con su razón. `PlataDelCaso.porQueNoSeSabe` es un campo, no un comentario:
  **`pagado` es `null` con su motivo, jamás `0`** — *un 0 en «lo pagado» se lee
  como «esto fue gratis» y decide una devolución mal.*
- **El botón de decidir apagado dice por qué** lo está (`L-424`).
- Y `estadia` **no tiene lector de monto** en esta capa: se declara y la casa
  resuelve indicando el monto a mano, que es lo que `parcial` acepta.

### 🔴 EL ROJO SALIÓ PARCIAL, Y SE DECLARA ASÍ

```
✅ PROBADO   INSERT directo a casos_postventa → 403 · 42501   (el candado de §9.1)
🔴 NO PROBADO  que un no-admin no pueda RESOLVER un caso
```

`caso_resolver` con un uuid inventado devolvió **`caso_no_existe`**, no
`no_podes_resolver`: **el gate de actor está DESPUÉS de buscar el caso**, así
que con un caso inexistente **no se llega a evaluarlo**. Y no hay casos reales
(0 filas) contra los que probarlo.

*Leí el gate en el cuerpo de la función y está bien escrito —`is_admin()`→casa,
`es_mi_prestador`→prestador, si no `no_podes_resolver`— **pero leerlo no es
probarlo** (`L-321`: «el permiso está revocado» es una lectura; «rebotó con
42501» es un hecho).* **Queda pendiente y es del primer caso real.**

### La frontera y los tipos

Wrappers **sólo** bajo `packages/api/src/admin/` (4 archivos). `index.ts` del
paquete **sin tocar**.

🔴 **`casos_postventa` tampoco está en `database.types.ts`** —igual que
`admin_generar_liquidacion`—, así que la lectura va por un cast. **Y el shape se
declaró COPIADO de `information_schema.columns`, no de memoria**: es `L-498` en
su forma preventiva, y está escrito en el archivo que **lo correcto es que este
bloque MUERA con `gen:types`**, no que se mantenga a mano. El pedido a A sube de
prioridad: ahora cubre la puerta de liquidación **y** todo postventa.

Typecheck `apps/admin` verde · `packages/api` verde · build 199,89 kB.

---

# ADENDA 4 · `admin.epetplace.com` — el founder tenía razón, y falta UNA cosa

**Mi medición anterior decía «no resuelve» y era verdadera pero incompleta.** El
founder ve el dominio asignado en el dashboard; las dos cosas son ciertas a la
vez, y la diferencia importa.

## ① La medición, en tres capas

```
DNS   admin.epetplace.com  → NXDOMAIN en 8.8.8.8, 1.1.1.1 y 9.9.9.9
      (no es caché local: los tres resolvers públicos coinciden)
      control: www.epetplace.com → cname.vercel-dns.com ✅ el instrumento discrimina

TLS   https vía la IP de Vercel → curl (35) SSL_ERROR_SYSCALL
      Vercel no pudo emitir el certificado: no puede verificar un dominio sin DNS

HTTP  http vía 76.76.21.21 con Host: admin.epetplace.com
      → HTTP 200 · 466 bytes · **es NUESTRA app** (mismo index.html)
      control: mismo método sobre www → HTTP 200 · 52.905 bytes ✅
```

## El diagnóstico, que separa lo que está bien de lo que falta

| capa | estado |
|---|---|
| **Vercel** | ✅ **el dominio está asignado y ya sirve la app** — probado con Host header |
| **DNS** | 🔴 **NXDOMAIN: el registro no existe** |
| **TLS** | 🔴 sin certificado, **como consecuencia** del DNS |

**Por qué falta:** los nameservers de `epetplace.com` son
`ns1/ns2.dns-parking.com` — **Hostinger, no Vercel DNS**. Vercel no controla la
zona, así que **no puede crear el registro solo**. Alguien ya creó el de `www`
a mano (por eso `www` funciona); falta el de `admin`.

**La cura es un registro en Hostinger**, idéntico al que `www` ya tiene:

```
CNAME   admin   →   cname.vercel-dns.com
```

*(o `A admin → 76.76.21.21`; el CNAME es lo que el propio dominio ya usa para `www`).*

## 🔴 ② POR QUÉ NO CAMBIÉ LA URL — y no es cautela, es que rompería

El founder pidió la medición **antes** de tocar. La medición dice **que todavía
no**: apuntar el `redirectTo` a `https://admin.epetplace.com` hoy dejaría el
login con Google **peor que antes**. Hoy aterriza en una pantalla de Vercel;
con NXDOMAIN el navegador diría «no se puede acceder a este sitio».

*El criterio del founder es correcto —un dominio propio sobrevive a un cambio de
proveedor y una URL de `.vercel.app` no— y por eso esto es un «todavía no», no
un «no».* **En cuanto el CNAME exista y el certificado se emita, se cambia en
los dos lugares reales** (`Login.tsx` y `CLAUDE.md`) **y se verifica igual que
esta vez: por contenido del bundle publicado.**

## ③ La cura de Placas — SÍ está en producción

**Y la pregunta llevaba una premisa mía equivocada, que corrijo:** esperar
`index-Px6202vT.js` era un error **de mi parte**. Ese hash era el build de
`f1db76e` *sola*, y **Vercel despliega la punta, no cada commit**. El deploy que
salió es de **`73b275c`**, que trae la cura **y** la corrección de URL juntas.

```
bundle en producción: index-fK9Opg5L.js
  .mascota_id en el fragmento de Placas ……… 0   ✅
  contador ahora ……………… filter(e=>!e.activada)  ✅
  URL de rama en el bundle ………………………………… 0   ✅
  los retiros siguen ausentes …………………………… ✅
```

*Predije el hash de un commit intermedio y esperé un hash que nunca iba a
existir. La medición del deploy era correcta; el salto fue mío* — misma clase
que `L-487`.

---

# RATIFICACIÓN DE MESA (7-sep-2026) — lo que queda esperando, con su bloqueante

*Se escribe con el bloqueante NOMBRADO, no como «pendiente»: una deuda con su
bloqueante escrito alguien la destraba; una «pendiente» espera para siempre.*

## ① La URL canónica — ESPERANDO EL CNAME

**El «todavía no» quedó ratificado por el founder.** Cambiar el `redirectTo`
hoy dejaría el login con Google **peor que ahora**.

| | |
|---|---|
| **Bloqueante** | `CNAME admin → cname.vercel-dns.com` en **Hostinger** (idéntico al de `www`) |
| **Dueño** | founder |
| **Verificado al escribir esto** | `dig @1.1.1.1 admin.epetplace.com` → **sin registro** · control `www` → `cname.vercel-dns.com.` ✅ |
| **Qué se hace cuando resuelva** | cambiar en los **dos** lugares (`Login.tsx` y `CLAUDE.md`) y **verificar por contenido del bundle publicado**, igual que esta vez |
| **Cómo saber que ya se puede** | el DNS resuelve **y** `https://admin.epetplace.com` responde 200 con certificado (hoy el TLS falla *como consecuencia* del DNS, no aparte) |

**Y la razón de fondo, que es del founder y es correcta:** un dominio propio
sobrevive a un cambio de proveedor; una URL `.vercel.app` no.

## ③ El rojo del gate de resolver — ESPERANDO CASOS

```
✅ PROBADO      INSERT directo a casos_postventa → 403 · 42501
🔴 NO PROBADO   que un no-admin no pueda RESOLVER un caso
```

**Por qué no se pudo:** el gate de actor de `caso_resolver` está **después** de
buscar el caso, así que con un uuid inventado corta en `caso_no_existe` y
**nunca se llega a evaluarlo**. Con `casos_postventa` en **0 filas**, no había
contra qué medirlo.

| | |
|---|---|
| **Bloqueante** | el **asiento de prueba de la casa** que entrega A (adenda 13) + **casos sembrados por E** |
| **Qué se corre** | `caso_resolver` sobre un caso REAL con sesión no-admin ⇒ tiene que rebotar **`no_podes_resolver`**, no `caso_no_existe` |
| **Por qué importa el discriminador** | *`caso_no_existe` y `no_podes_resolver` son dos rebotes distintos, y sólo el segundo prueba el gate.* Un rebote no es una medición si no se sabe cuál rebote es |

**Leí el gate en el cuerpo y está bien escrito** —`is_admin()`→casa,
`es_mi_prestador`→prestador, si no `no_podes_resolver`— **pero leerlo no es
probarlo** (`L-321`).

## ② La lección — `L-499`

Depositada en `docs/DEUDAS_CANONICAS.md`. Número **pedido** con
`pnpm proximo:ficha` (`tope L-498 · próximo libre L-499`), verificado que
aparece una sola vez.

> ***Medir sólo la capa que falla da un diagnóstico verdadero e inútil.***
> «No resuelve» y «existe en el proveedor y no en el DNS» son diagnósticos
> distintos que llevan a acciones distintas.

**Lo que la hace peligrosa y no sólo incompleta:** un diagnóstico verdadero **no
se siente como un error**, así que nadie lo verifica. *Un diagnóstico falso se
choca contra la realidad; uno verdadero-e-inútil se archiva.* Su regla: ante una
capa que falla, se mide la de arriba y la de abajo **antes de nombrar la causa**
— y en red la técnica que las separa es pedirle al servidor con el `Host`
correcto **salteando el DNS**.

---

# ADENDA 5 · EL CNAME, EL DISCRIMINADOR, Y UN DOMINIO APUNTANDO A LA NADA

## ③ EL ROJO PARCIAL — ✅ COMPLETO, con sus DOS mitades

El founder entregó las dos llaves que faltaban: el asiento de casa (A, adenda 13)
y tres casos sembrados por E. **Ahora sí se puede saber cuál rebote es.**

Caso usado: **`9860ef35`** — pedido · `producto_en_mal_estado` · clase 3 ·
etapa `con_casa` · **el único de los tres que estaba sin resolver**.

```
MITAD 1 · cuenta de prueba (is_admin=false, ni familia ni prestador del caso)
  caso_resolver → {"ok": false, "codigo": "no_podes_resolver"}   ← EL GATE
  leer_caso     → {"ok": false, "codigo": "no_es_tuyo"}          ← EL GATE

MITAD 2 · cuenta de casa (is_admin=true)
  is_admin      → true
  leer_caso     → ok:true · clase 3 · etapa con_casa
  caso_resolver → ok:true · etapa "resuelto" · tenia_devengo:false
```

🔴 **Por qué hacían falta las DOS, y no alcanzaba con el rebote:** *un gate que
le niega a TODOS también rebota.* La mitad 1 sola probaba que algo frenaba; sólo
la mitad 2 prueba que **discrimina**. Y la mitad 1 ya no es `caso_no_existe`
—el rebote inútil de la tanda anterior— sino `no_podes_resolver` **sobre un caso
que existe**: ahora se sabe cuál rebote es.

### Y §6 verificado sobre el hecho, no sobre la promesa

```
decidido_por        = a0d19727   ← quedó escrito quién decidió
etapa / estado_final = resuelto
resolucion_alcance  = sin_devolucion
mensajes en el hilo = 2          ← el hecho entró al hilo
eventos del objeto  = 0          ← NO movió plata
```

**La escritura se hizo con cuidado y se declara:** antes de resolver medí
`_caso_tiene_devengo` → `NULL`, y usé `sin_devolucion`, que pone `camino = NULL`.
*Sobre un caso de prueba, sin devengo y sin mover plata* — no sobre un objeto
real de una familia.

## ① EL CNAME — DNS ✅ · TLS 🔴 todavía

```
DNS   8.8.8.8         → cname.vercel-dns.com ✅
      9.9.9.9         → cname.vercel-dns.com ✅
      208.67.222.222  → cname.vercel-dns.com ✅
      resolver local  → 76.76.21.93          ✅
      1.1.1.1         → NXDOMAIN  ← caché negativo suyo; control: www SÍ resuelve ahí

TLS   no peer certificate available   🔴
      control: www.epetplace.com → issuer=Let's Encrypt ✅ (el instrumento discrimina)
```

**Vercel todavía no emitió el certificado.** Es la capa 2 y depende de que Vercel
verifique el dominio; el DNS ya está para la mayoría de los resolvers.

🔴 **Por eso ② NO se ejecutó todavía, y es la misma razón de antes:** apuntar el
`redirectTo` a `https://admin.epetplace.com` sin certificado daría un error de
TLS en el navegador — **peor que la pantalla de Vercel de hoy**. *No concluyo
«no anda» sobre una capa: el DNS está, el TLS falta, y falta porque va después.*

**Se ejecuta en cuanto el certificado exista**, con la verificación de siempre:
cero ocurrencias de la URL vieja en el bundle publicado.

### 🔴 ACTUALIZACIÓN 21:37 — el DNS terminó, el certificado no sale, y qué falta mirar

**Aplicando `L-499`: en vez de concluir sobre la capa que falla, medí las de al
lado. Las dos están bien.**

```
CAPA 1 · DNS ……… 1.1.1.1 → cname.vercel-dns.com   ✅ (el caché negativo expiró)
                  9.9.9.9 → cname.vercel-dns.com   ✅
                  → LA PROPAGACIÓN TERMINÓ

CAPA 3 · Vercel … http://admin.epetplace.com → 200 · 466 bytes · NUESTRA APP  ✅
                  CONTROL: http://pagos.epetplace.com → 404 DEPLOYMENT_NOT_FOUND
                  → el método DISCRIMINA: admin está asignado, pagos no

CAPA 2 · TLS …… no peer certificate available                                  🔴
```

⇒ **El dominio está completo en las dos puntas: el DNS resuelve y Vercel lo
sirve. Falta sólo que Vercel emita el certificado**, que es un acto suyo y
asíncrono.

**~18 minutos desde el primer sondeo, ~5 desde que el DNS terminó de propagar.**
**No adivino la causa.** Lo que se puede pensar sin medir —que quedó en backoff
tras los intentos fallidos de cuando el DNS no existía— **es una hipótesis, no
un dato**, y no la uso.

🔴 **LA EVIDENCIA QUE FALTA, y está en el dashboard de Vercel** — Project →
Settings → Domains → `admin.epetplace.com`:

1. **¿Qué dice debajo del dominio?** «Valid Configuration» ⇒ sólo hay que
   esperar · «Invalid Configuration» ⇒ Vercel todavía no ve el DNS y hay un
   botón **Refresh** que fuerza el reintento · un error de certificado ⇒ lo dice
   ahí con su motivo.
2. **¿Hay un botón «Refresh» / «Renew Certificate»?** Si lo hay, tocarlo es el
   acto que destraba — Vercel no reintenta inmediatamente después de un fallo.

*Con eso se sabe si es esperar o si es un toque.*

## 🔴 ④ `pagos.epetplace.com` — DOMINIO PUBLICADO APUNTANDO A LA NADA

```
DNS   8.8.8.8 y 1.1.1.1 → cname.vercel-dns.com   ✅ resuelve
TLS   no peer certificate available               🔴
HTTP  vía 76.76.21.98 → 404 · "The deployment could not be found on Vercel"
                             DEPLOYMENT_NOT_FOUND
```

⇒ **El CNAME está cargado y el dominio NO está asignado a ningún proyecto de
Vercel.** Es exactamente lo que el founder quería saber antes de octubre.

**Y es el espejo de `admin`, lo que lo vuelve fácil de recordar:**

| | DNS | asignado en Vercel |
|---|---|---|
| `admin.epetplace.com` | ✅ (recién) | ✅ ya estaba |
| `pagos.epetplace.com` | ✅ | 🔴 **falta** |

*Las dos mitades del mismo trámite, cada una faltando en un dominio distinto.*

**Dónde vive pagos-web hoy, medido:** `epetplace-pagos-stg.vercel.app` →
**HTTP 200 · 63.938 bytes**. La pieza de S105 **está viva**, sólo que en la URL
de Vercel. Lo confirma `MOTOR_DE_PAGOS_ESTADO.md:266`.

**Contexto que encontré y explica el estado:** `pagos.epetplace.com` es el **host
productivo** declarado del motor de pagos, con *«CNAME firmado, sin ejecutar»*
anotado en `S101-B.md` como pendiente del founder. **El CNAME sí se ejecutó; la
asignación en Vercel no.** Media ejecución.

**Hoy no rompe nada** —ningún código del monorepo ni del legado apunta ahí, sólo
documentos— **pero está declarado como el host productivo**, así que alguien lo
va a usar. Asignarlo al proyecto de `pagos-web` es un acto del dashboard.

> ⚠️ **Un instrumento propio salió mal otra vez y se declara:** la primera
> medición de `pagos` leyó `<title>Thor</title>` de `/tmp/pg.html` — **residuo de
> una corrida anterior**, con `bytes=0` en la misma línea. *Un archivo que no se
> sobrescribe se lee como si fuera de ahora.* Se repitió borrando el archivo
> antes, y ahí apareció el `DEPLOYMENT_NOT_FOUND`. Misma clase que el volcado de
> `uiautomator` que la casa ya tiene medido.

---

# ADENDA 6 · EL CERTIFICADO SALIÓ Y LA URL CANÓNICA ES EL DOMINIO PROPIO

**El dashboard cerró el diagnóstico:** `admin.epetplace.com` estaba en
**«Generating SSL Certificate»** con la configuración correcta — no *Invalid*,
sin backoff, nada que forzar. **Las tres capas que medí eran exactas y sólo
faltaba esperar.**

## Las tres capas, verdes

```
DNS   1.1.1.1 → cname.vercel-dns.com                                    ✅
TLS   subject=CN=admin.epetplace.com
      issuer=C=US, O=Let's Encrypt, CN=YR2
      notBefore Sep 8 01:46:04 2026  ·  notAfter Dec 7 01:46:03 2026    ✅
HTTP  200 · 466 bytes · nuestra app                                     ✅
```

**Y verificado en un navegador real, no sólo con `curl`:** `https://admin.epetplace.com`
carga, el router redirige a `/login`, y se ve el portal con sus dos caminos de
entrada (email/contraseña y «Entrar con Google»).

## ② Ejecutado — legado `8934a30`

La URL canónica pasa a **`https://admin.epetplace.com`**, y es su **tercera y
última forma**:

| | |
|---|---|
| ~~`…-git-main-…vercel.app`~~ | URL de rama **con Deployment Protection** — devolvía el login de Vercel y **rompía el login con Google** |
| ~~`e-petplace-admin.vercel.app`~~ | URL del proyecto: funcionaba, pero muere con el proveedor |
| **`admin.epetplace.com`** | **dominio propio — sobrevive a un cambio de proveedor** |

Cambiada en los dos lugares reales (el `redirectTo` de `signInWithOAuth` en
`Login.tsx`, y la línea `Deploy` de `CLAUDE.md`). La anterior queda **sólo como
nota** diciendo que también responde, para que nadie la crea rota.

🔴 **El script del cambio llevaba una guarda que abortaba si el certificado no
existía.** No hizo falta que disparara — pero estaba, y ésa es la razón de
ponerla: *la orden de no tocar antes de tiempo no puede depender de que yo me
acuerde en el momento.*

## Pendiente inmediato

**El deploy de `8934a30` todavía no salió** (producción sirve
`index-fK9Opg5L.js`; se espera `index-B4k1WxEH.js`). Hasta que salga:

- la verificación por bundle —cero ocurrencias de la URL vieja— **no se puede
  correr todavía**;
- y **③ tampoco**: probar «Entrar con Google» **ahora** mediría el bundle
  anterior, cuyo `redirectTo` es `e-petplace-admin.vercel.app`. *Eso daría verde
  y no probaría lo que hay que probar.* Se corre contra el bundle nuevo.

---

# ADENDA 7 · 🔴 FRENO — `pagos.epetplace.com` NO se puede asignar todavía

**Medido sin cambiar nada, antes de la firma del founder.**

## ① `epetplace-pagos-stg` ES staging — y no lo digo por el nombre

El nombre podría ser heredado. **Lo que lo prueba es el `config.js` que el
propio sitio publica**, generado por su build desde las variables del proyecto
de Vercel:

```js
// https://epetplace-pagos-stg.vercel.app/config.js  · HTTP 200 · 425 bytes
var CONFIG = {
  "MODO": "stg",                              // ← el ambiente, explícito
  "APP_CODE": "EPETPLACESTG-EC-CLIENT",       // ← credencial de STAGING de Nuvei
  "APP_KEY":  "…",                            // (pública por diseño, juego CLIENT)
  "API_ALTA": "https://zyltipqscdsdsxnjclhp.supabase.co/functions/v1/pagos-alta-tarjeta",
  …
};
```

🔴 **Y el dato que cambia cómo se lee todo esto: el ambiente NO lo define el
repo — lo define la variable `PAGOS_MODO` del proyecto de Vercel**, con default
`stg` (README de `apps/pagos-web`, tabla de variables). *El mismo código es
staging o producción según el proyecto que lo despliegue.* Por eso la pregunta
no se contesta leyendo el repo: se contesta leyendo **qué publicó el build**.

⇒ **Es staging de verdad, en las dos puntas: el modo del SDK y las credenciales
del proveedor.**

## ② NO existe un proyecto de producción

```
epetplace-pagos.vercel.app        → 404
epetplace-pagos-prod.vercel.app   → 404
pagos-epetplace.vercel.app        → 404
epetplace-pagos-web.vercel.app    → 404
CONTROL epetplace-pagos-stg       → 200   ← el método discrimina

menciones en TODO el repo: `epetplace-pagos-stg` ×19 · cualquier otro nombre ×0
```

⚠️ **Limitación declarada:** un 404 en `<nombre>.vercel.app` **no prueba que un
proyecto no exista** — puede existir sin deployment, o con otro nombre que no
adiviné. **Sólo el dashboard lista proyectos.** Lo que sí es concluyente es la
otra mitad: **en todo el repo no hay una sola referencia a un proyecto de pagos
que no sea el de staging.**

## 🔴 EL FRENO, que es la respuesta a la pregunta del founder

**Lo que falta no es asignar el dominio: es que exista el proyecto de
producción.** Asignar `pagos.epetplace.com` a `epetplace-pagos-stg` haría que
**el subdominio de pagos de la marca sirva el SDK en modo `stg` con credenciales
`EPETPLACESTG`** — y lo peor es que *se vería perfecto*: la página carga, el
formulario monta, el usuario tipea su tarjeta.

*Es la misma clase de mezcla que dos WABAs homónimas: dos ambientes con el mismo
nombre visible, y el que decide cuál es no es el que mira la URL.*

**Y no es hipotético para octubre:** `DEFINICION_SOFTLAUNCH` §3.5 tiene abiertas
—de terceros— las **credenciales productivas** y el **host productivo**. Este
dominio ES ese host. Apuntarlo a staging cerraría la ficha sin cerrar el hecho.

## ③ El servicio está VIVO y la app del cliente lo consume

**No es un resto que nadie mantiene.**

```
https://epetplace-pagos-stg.vercel.app/       → 200 · 63.938 bytes
                       /config.js             → 200 · 425 bytes
carga: jquery 3.7.1 · cdn.paymentez.com/ccapi/sdk/payment_stable.min.js · ./config.js
```

**Quién lo abre, rastreado hasta la app:**

```
apps/cliente/src/app/pagos/alta-tarjeta.tsx:30   const BASE = process.env.EXPO_PUBLIC_PAGOS_ALTA_URL
apps/cliente/src/lib/pagos/alta-tarjeta.ts:23    idem
apps/cliente/.../cuenta/index.tsx:68             la celda de pagos SÓLO se dibuja si la variable existe
```

y esa variable **vive en el environment `development` de EAS** (S101-B) y
**apunta a `epetplace-pagos-stg.vercel.app`** (medido en S101-D §④).

⇒ **Es la página que abre el navegador cuando una familia guarda su tarjeta.**
En el repo la URL sólo aparece en scripts de ensayo y documentos porque **la app
no la lleva escrita: la lleva en una variable de EAS.** *Buscarla por grep en el
código habría dado «nadie la usa», y es falso.*

⚠️ **Y un cruce que conviene tener a la vista:** su `API_ALTA` apunta a
`zyltipqscdsdsxnjclhp` — **la base de producción**. Es coherente con lo que el
canon declara (*el ambiente es sandbox de punta a punta*), pero significa que
**hoy staging de Nuvei escribe contra la base real**, y eso es lo que hay que
separar al crear el proyecto productivo.

## Lo que le sirve al founder para decidir

| | |
|---|---|
| **Asignar `pagos.epetplace.com` a `epetplace-pagos-stg`** | 🔴 **NO** — pondría el dominio de pagos de la marca sobre el SDK en modo `stg` con credenciales de staging |
| **Crear el proyecto de producción y asignarlo ahí** | ✅ el camino — necesita las credenciales productivas de Nuvei, que §3.5 declara pendientes de terceros |
| **Dejar el dominio sin asignar hasta entonces** | 🟡 hoy devuelve `DEPLOYMENT_NOT_FOUND`, que es feo pero **honesto**: nadie puede tipear una tarjeta ahí |

*El founder tiene razón en que un subdominio de la marca devolviendo un error de
Vercel es peor que uno que no existe. **Pero servir staging desde él es peor que
las dos cosas**, porque deja de avisar.*

---

# ADENDA 8 · MI SONDEO DISPARÓ EL ANTI-BOT DE VERCEL

**Sondeé `admin.epetplace.com` cada 45-60 s durante ~15 min esperando el deploy.
A las 22:02 empezó a devolver HTTP 403 · «Vercel Security Checkpoint».**

```
admin.epetplace.com          → 403  (Vercel Security Checkpoint)
e-petplace-admin.vercel.app  → 200  ← MISMO PROYECTO, sin bloqueo
```

⇒ **El sitio está bien: lo bloqueado era mi acceso.** El control por el otro
dominio del mismo proyecto lo separa sin ambigüedad.

## Un usuario real NO se ve afectado — medido, no supuesto

Abrí el dominio en el navegador conectado: apareció *«Estamos verificando tu
navegador»* y **se resolvió solo en menos de 8 segundos** — título
`e-petplace-admin`, URL `/login`. **El checkpoint es contra clientes sin JS
(`curl`), no contra personas.**

## 🔴 Dos defectos propios, los dos declarados

**① Mi watcher dio un falso positivo.** La condición era
`if [ "$H" != "index-fK9Opg5L.js" ]`, y **una cadena VACÍA también es distinta**:
cuando el 403 hizo que no hubiera bundle que extraer, el watcher anunció
**«✅ DEPLOY NUEVO ·  · 22:02:00»** — con el hash vacío en el mensaje.

> *Un comparador de desigualdad trata «cambió» y «no pude leerlo» como la misma
> cosa.* La forma correcta es exigir el valor esperado (`= "index-B4k1WxEH.js"`)
> **o** validar que la lectura no vino vacía antes de compararla. **Lo cazó que
> el propio mensaje imprimiera el hash y saliera en blanco** — si sólo hubiera
> dicho «DEPLOY NUEVO», me lo creía.

**② Medir muy seguido cambió lo medido.** No es una anécdota de Vercel: **todo
sondeo agresivo sobre un servicio con protección puede alterar su respuesta**, y
entonces el instrumento deja de medir el sujeto y empieza a medir su reacción a
ser medido. ⇒ **el sondeo de un deploy se espacia** (2-5 min, no 45 s) **y, si
hay dos dominios sobre el mismo proyecto, se sondea el que NO es el que
importa** — así el que importa queda limpio para la verificación final.

*(Y lo que lo vuelve barato de curar: había un control disponible todo el tiempo
—el otro dominio— y sirvió tanto para diagnosticar como para seguir midiendo.)*

## Estado del deploy

**`8934a30` sigue sin salir**, medido por el dominio no bloqueado:
`e-petplace-admin.vercel.app` → `index-fK9Opg5L.js`, 23 min después del push.
El anterior había tardado ~50 min. **Sigue esperando, y desde ahora se sondea
espaciado y por el otro dominio.**

---

# ADENDA 9 · EL CHECKPOINT DE VERCEL — qué es, y qué significa para el pasaporte

**Medido sin cambiar nada y sin volver a sondear en ráfaga** (una request por
dominio; el umbral NO se prueba a propósito — ver el final).

## Es defensa AUTOMÁTICA de la plataforma, no configuración del proyecto

**El discriminador es limpio y no necesita el dashboard:**

```
admin.epetplace.com          → 403 · x-vercel-mitigated: challenge
e-petplace-admin.vercel.app  → 200 · sin header de mitigación
                               ↑ EL MISMO PROYECTO
```

⇒ **Si fuera «Attack Challenge Mode» —que se enciende por proyecto— aplicaría a
TODOS sus dominios.** No aplica al otro. **No es configuración del proyecto.**

Y la plataforma lo dice con todas las letras en su propio header:

```
x-vercel-mitigated: challenge
x-vercel-challenge-token: 2.1788836897.60.…
cache-control: private, no-store, max-age=0
```

**`mitigated`** es el vocabulario de una mitigación reactiva, no de una política
declarada. Se suma la evidencia temporal: **las primeras ~15 requests pasaron
bien** y el 403 apareció después — *una configuración no espera quince
requests.*

## Dónde aplica hoy

| dominio | estado | mitigación |
|---|---|---|
| `admin.epetplace.com` | 403 | 🔴 **activa** (la disparé yo) |
| `www.epetplace.com` | 200 | ✅ **no** — con y sin UA de navegador |
| `e-petplace-admin.vercel.app` | 200 | ✅ no |
| `epetplace-pagos-stg.vercel.app` | 200 | ✅ no |
| `pagos.epetplace.com` | 000 | — no llega a evaluarse: **no tiene certificado** |

**Es por (IP × dominio), no por proyecto ni por cuenta.** Mi IP quedó marcada
para `admin.epetplace.com` y para nada más.

## 🔴 Lo que importa para octubre: el pasaporte con QR

El QR apunta a **`https://www.epetplace.com/p/{token}`** (`Placas.tsx:30`).
Medido:

```
GET /p/<token inexistente>  → 404 · 2.606 bytes · <title>Pasaporte</title>
                              x-vercel-cache: MISS
                              SIN x-vercel-mitigated
```

**La página existe, responde, y hoy no tiene checkpoint.**

**Pero la respuesta honesta a la pregunta del founder es que el riesgo NO está
descartado, y por dos razones medidas:**

1. **La mitigación es automática y por frecuencia** — no hay que encenderla para
   que aparezca: apareció sola en `admin` sin que nadie la configurara. *Lo que
   protege a `www` hoy no es una exención: es que nadie le mandó una ráfaga.*
2. **`x-vercel-cache: MISS` en `/p/`** ⇒ **cada lectura de pasaporte va al
   origen**, no se sirve de caché. Una ráfaga de lecturas es una ráfaga de
   requests reales — exactamente el patrón que dispara la mitigación.

⚠️ **Y el detalle que lo vuelve peor de lo que suena para este caso concreto:**
un pasaporte se lee **desde el teléfono de quien encontró a la mascota**,
muchas veces **desde la misma red** (una veterinaria, un refugio, un evento).
*Varias lecturas seguidas desde una IP compartida son, para el mitigador, una
ráfaga desde una IP.* **Y el checkpoint le pide JavaScript al navegador** — mi
prueba mostró que un navegador real lo resuelve en <8 s, pero **son 8 segundos
en el peor momento posible**: alguien con un animal perdido en la mano.

## Lo que NO medí, y por qué

- **El umbral exacto** (cuántas requests por minuto disparan la mitigación).
  **No se prueba: probarlo es dispararlo**, y hacerlo sobre `www.epetplace.com`
  sería dejar el sitio público con un checkpoint activo por mi culpa. *La
  medición cuesta exactamente el daño que se quiere evitar.*
- **Si el proyecto tiene reglas de firewall configuradas.** El discriminador
  descarta el *Attack Challenge Mode* global, **pero una regla puntual del
  Firewall sí viviría en el dashboard** — Settings → Security/Firewall es lo que
  lo diría.
- **Cuánto dura.** El token trae `…60…`, que *parece* un TTL en segundos, pero
  la mitigación seguía activa mucho después. **No lo afirmo: no lo medí.**

## Lo que se puede hacer antes de octubre, para la mesa

*(No lo ejecuto: es decisión y es del dashboard.)*

- **Caché en `/p/`.** Hoy es `MISS`: si la página del pasaporte se pudiera servir
  cacheada, la ráfaga no llegaría al origen y no parecería un ataque. Es la cura
  que ataca la causa y no el síntoma.
- **Verificar en Settings → Firewall** si hay reglas propias, y si el plan
  permite excluir `/p/` de la mitigación.
- **Y no dejar el descubrimiento para octubre:** esto se prueba con una ráfaga
  controlada contra `/p/` **antes** de que haya placas en la calle, sabiendo que
  la prueba deja el dominio marcado un rato.

---

# ADENDA 10 · 🔴 CORRECCIÓN — `/p/` YA ESTÁ CACHEADO. Mi «MISS» midió el caso equivocado

**El founder pidió cachear `/p/{token}` sobre un dato que yo reporté, y el dato
estaba mal.** Se corrige acá, con la medición que lo prueba.

## Lo que ya existe, desde S113-A

`epetplace-web/src/pages/p/[token].astro` **ya trae el caché**, con su razón
escrita al lado:

```js
// Cache corto: si la familia marca «perdida», esto tiene que decirlo casi ya.
Astro.response.headers.set('Cache-Control',
  estado === 'activo' ? 'public, max-age=60' : 'no-store')
```

## Y funciona — medido con un token REAL, dos requests

```
REQUEST 1   HTTP 200 · cache-control: public, max-age=60 · x-vercel-cache: MISS · age: 0
REQUEST 2   HTTP 200 · cache-control: public, max-age=60 · x-vercel-cache: HIT  · age: 3
   (3 segundos después)
```

⇒ **El CDN de Vercel sí cachea el pasaporte activo.** Una ráfaga de N lecturas
dentro de la ventana es **1 sola request al origen**, no N. *La protección que
el founder pedía construir ya estaba construida.*

## 🔴 Por qué me equivoqué, y es la misma lección de hoy

**Medí `/p/` con un token INEXISTENTE.** Ese caso cae en la otra rama del
ternario —`no-store`— y por eso dio `MISS`. **Reporté «cada lectura va al
origen» generalizando desde el único caso que jamás se cachea, y con razón: un
404 cacheado escondería una placa recién activada.**

> **Es `L-499` otra vez, y en su forma más incómoda: la escribí hoy.** Medí una
> rama del código y saqué una conclusión sobre la otra. *El dato era verdadero
> —ese request fue un MISS— y la afirmación que construí encima era falsa.*

**Lo que lo habría evitado:** un token válido cuesta una consulta, y la había
hecho tres veces esa misma tarde para otras cosas. **No fue falta de acceso: fue
no preguntarme si el caso que tenía a mano era el caso que importaba.**

⚠️ **Y una hipótesis mía que también cayó:** pensé que haría falta `s-maxage`
porque «`max-age` es del navegador y `s-maxage` del CDN». **Medido: Vercel usa
`max-age` como TTL de CDN cuando no hay `s-maxage`.** El `HIT` lo prueba.

## ① El TTL, y qué pasa cuando el dueño cambia algo

**60 segundos, y no lo elegí yo: ya estaba, con su razón.**

| | |
|---|---|
| **Ventana** | 60 s |
| **Ráfaga de 100 lecturas en un minuto** | **1** request al origen |
| **La familia marca «perdida»** | se ve en **≤ 60 s** en cualquier lectura nueva |
| **Token inexistente o revocado** | `no-store` — **jamás se cachea**, y es correcto: una placa recién activada tiene que dejar de decir «esta placa espera a su mascota» al instante |

*El TTL corto es exactamente la decisión correcta para este objeto: los datos
cambian poco, salvo el único que no puede esperar —«perdida»—, y 60 s es el
techo de esa espera.* **No propongo cambiarlo.**

## ③ La ráfaga controlada — no se corrió, y ahora tampoco hace falta

El founder ya lo había prohibido contra el sitio público. **Y con el caché
medido y funcionando, el supuesto que motivaba la prueba se cayó**: la ráfaga
no llega al origen. *Correrla ahora sería medir el rate-limit del CDN, no el
riesgo que preocupaba.*

## ④ Dónde mirar el Firewall (es lectura del founder)

El sitio público es **otro proyecto de Vercel** que el que sirve `admin` — repo
`epetplace-web`, Astro 5 con `@astrojs/vercel`, `output: 'static'` salvo `/p/`.

```
Vercel → el proyecto de epetplace-web → Settings → Security
  · «Attack Challenge Mode»  → tiene que estar OFF
      (si estuviera ON, TODO el sitio pediría challenge, no sólo bajo ráfaga)
  · Firewall → Custom Rules  → ver si hay reglas propias sobre /p/ o sobre el sitio
  · Firewall → Observability → muestra qué mitigó y cuándo: ahí se vería si
      /p/ ya recibió alguna, y es el único lugar donde eso se puede saber
```

**Y lo mismo para el proyecto de `admin`** — ahí se confirmaría que el 403 que
me tocó figura como mitigación automática y no como una regla.

⚠️ **Lo que sigue sin poder medirse desde afuera** y por eso es lectura del
dashboard: si hay reglas propias, y el umbral. **El discriminador de la adenda 9
—mismo proyecto, dos dominios, distinto comportamiento— descarta el modo global,
pero no descarta una regla puntual.**
