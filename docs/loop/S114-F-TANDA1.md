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
