# S114-F · CIERRE — el portal del admin, y el deploy que no era un deploy

**Punta:** `738e8bb255061b8511e0de91e2e94eb4adbea608` · `pista/s114-f-1.0` · árbol
limpio · **ya es ancestro de `main`** (verificado con `merge-base --is-ancestor`
contra `814a06c1`, no declarado). Todo lo de F está mergeado: `4756e44d`,
`1af88f40`, `0f162878`.

> ⚠️ Este parte se escribió **sin** `docs/loop/buzon/S114-A-PIDE-CIERRE-A-CADA-PISTA.md`
> ni `docs/loop/S114-CIERRE.md`: medido contra el remoto, ninguno de los dos
> existe en `origin/main` (`814a06c1`) ni en `origin/pista/s114-a-1.0`
> (`cba3002a`). A los tiene sin pushear. Se avisó y se siguió — *un parte que
> espera a otro parte no se escribe nunca.* Si su letra pide ítems que acá
> faltan, entran en un segundo commit.

---

## ① QUÉ ERA F, Y QUÉ ENTREGÓ

F abrió para construir **el portal del admin**: la superficie donde la casa
opera lo que ninguna de las dos apps puede: liquidar, y meterse en un caso de
postventa cuando la familia y el prestador no se ponen de acuerdo.

**Lo que quedó vivo y alcanzable:**

- **`apps/admin`** — React web, Vite, sin i18n. Tres pantallas: Liquidaciones,
  la bandeja de Casos y la Hoja del caso.
- **`packages/api/src/admin/`** — la frontera de F dentro de la puerta única, con
  su propio barrel. `packages/api/src/index.ts` es de A y **no se tocó**.
- **La casa puede TOMAR un caso** (`tomarCaso`, sobre `caso_pedir_casa` — la
  MISMA RPC que usan familia y prestador, a propósito: una intención, una
  puerta).
- **Decidir de verdad**, con los tres alcances y sus rebotes hablando.
- **La propuesta de Nexo**, invocando la edge de A.
- **Login con email y con Google**, los dos por camino real.

---

## ② EL ARCO, POR TANDAS

### Tanda 1 — la frontera y la primera puerta

La frontera de F (`packages/api/src/admin/**`) con barrel propio, la puerta de
liquidación (`20260911500000`, con su reversa escrita antes), y las dos primeras
pantallas.

**Lo que sostiene el gate, escrito en el código para que nadie lo confunda:** el
componente de gate **no es la defensa, es la cortesía**. Lo que impide que un
no-admin vea datos es la RLS con `is_admin()`. *Si alguien parchea ese archivo en
su navegador no gana nada: las consultas siguen volviendo 0 filas o 401.* Medido
por camino real, no argumentado.

### Tanda 2 — el asiento de la casa

La bandeja y la Hoja ejercidas contra casos reales sembrados por E.

### El hilo del deploy — nueve tandas, y no era lo que parecía

El repo legado `e-petplace-admin` **no producía deployment** con los pushes. El
diagnóstico tomó nueve vueltas y **tres de mis conclusiones intermedias, todas
«bien medidas», resultaron falsas** (§⑤).

**La causa real:** el `Ignored Build Step` de Vercel tiene **DOS CAPAS** —
Project Settings y **Production Overrides por deployment** — y la de arriba, con
el Command **vacío**, manda. Un override vacío **no significa «heredá»:
significa «hacé nada»**, o sea saltear el build. Es de sólo lectura, no tiene
opción de borrar, y **es el `vercel.json` del deployment promovido, congelado**
⇒ los 10 deployments existentes vienen de commits sin el campo, así que **no
había ninguno con el override lleno para promover**. La trampa es circular: el
override saltea el build, así que la cura no entra por la puerta que ella misma
abre.

⇒ `L-526` y `L-527`.

**Decisión del founder al final del hilo: FRENAMOS.** Placas queda rota y no se
persigue más — *el costo de seguir supera al defecto*. Lo único que se hizo es
una línea: `"ignoreCommand": "exit 1"` en el `vercel.json` de `apps/admin`, para
que el proyecto nuevo no herede la trampa.

### El camino a producción — la firma cambió, y la segunda es más limpia

Primero se firmó **opción D** (proyecto propio + `operaciones.epetplace.com`,
conviviendo con el legado). Después el founder cambió la firma: **el legado se
APAGA y `admin.epetplace.com` apunta a la mesa nueva. Sin subdominio nuevo.**
La decisión y sus seis pasos viven en
`S114-F-DECISION-camino-a-produccion-del-admin.md` y
`S114-F-PASOS-proyecto-vercel-admin.md`.

### El plan de reconstrucción

Las 27 pantallas del legado, cada una con qué hace, si anda, y **si hace falta
para operar en octubre** — ordenado por eso y no por lo que está roto, como
pidió el founder. **De 27, sólo 9 hacen falta:** 2 ya existen, 3 las cubre el
monorepo, **4 por construir**. **~11.000 líneas se retiran.** El orden salió del
volumen de datos vivos, medido: `puntos_usuario` 1 fila · `planes_prime` 3 ·
`cupones` 1 · `envios` 5. Vive en `S114-F-PLAN-reconstruccion-del-admin.md`.

### Las curas del portal (encargo de A y del founder)

**El parcial no se podía hacer nunca.** El campo de motivo sólo se dibujaba en
`sin_devolucion`, así que en `parcial` viajaba `null` y el motor rebotaba
`razon_requerida`. **La pantalla era correcta el día que se escribió: la razón
obligatoria en parcial es firma del 9-sep, cableada después.** *Una firma que se
movió debajo de una pantalla ya escrita.*

Y una corrección de alcance sobre el encargo, medida del cuerpo de
`caso_resolver` y no de un reporte: `IF p_alcance IN ('parcial','sin_devolucion')`
⇒ **en `total` la razón NO es obligatoria.** El campo **se dibuja en los tres y
se exige en dos** — son dos decisiones distintas y por eso no se resuelven con
una condición sola. ⇒ `L-528`.

**La propuesta de Nexo no aparecía porque la Hoja no la pedía**, y su cabecera
afirmaba que no existía ninguna función de propuesta. **El censo era verdadero y
la conclusión falsa: una edge no vive en `pg_proc`.** `postventa-hoja` estaba
desplegada y ACTIVE mientras la pantalla afirmaba su ausencia.

Al invocarla, dos cosas que salieron de leer el cuerpo del edge y que un reporte
no habría dicho: **el fallo del modelo vuelve con HTTP 200 y `{codigo}`** —
discriminar por status daría éxito sobre un rechazo, así que se discrimina por
la presencia de `propuesta` — y el vocabulario del hilo se verificó contra
**`chk_msj_autor`**, no contra las filas de hoy.

### El login con Google

Volvía al login del mismo portal. **Ninguno de los dos candidatos nombrados era
la causa**, y el segundo se descartó primero **porque era el más barato de
medir**: `is_admin()` decide por `auth.uid()` y `activo`, no por email; la cuenta
del founder tiene **una sola fila** (`75d0798a`) con `provs=email+google` — o sea
Google ya enlazado al mismo uid — y `admin_users activo=true`.

**La causa, en tres eslabones:** `packages/api/src/client.ts` fija
`detectSessionInUrl: false` con su razón escrita al lado —*«RN no es un
browser»*, y es correcta— · el admin usa **ese mismo cliente** y sí es un
browser · con `flowType: 'pkce'` Google vuelve con `?code=…` y **nadie lo
canjeaba** (cero ocurrencias de `exchangeCodeForSession`, y `OpcionesApi` no deja
overridearlo). *Volver al login del mismo portal es exactamente lo que hace un
callback que nadie consume* — y explica el discriminador que el founder señaló
sin saberlo: **email y contraseña sí entraban porque no pasan por la URL.**

Los tres supuestos de los que depende la cura se verificaron **en la fuente de
`auth-js`**, no se asumieron: que el verifier ya se guarda hoy (depende sólo de
`flowType`), que `detectSessionInUrl` gobierna únicamente `_initialize`, y que el
canje lee ese verifier del storage que le pasamos.

**La cura vive en `apps/admin`, no en el cliente compartido** — tocar `initApi`
le movería el piso a dos apps en producción para las que ese `false` es correcto.

Y el rebote dejó de ser mudo: nace la fase `callback_fallido`, que **no** es
`sin_sesion` (ahí la persona no intentó nada; acá intentó y algo se rompió).
**«Volviste al login» es indistinguible de «no tenés permiso», y son dos cosas
distintas.**

---

## ③ 🔴 LO QUE ABRE EL PRÓXIMO QUE TOQUE ESTO — y corrige una ficha cerrada

### `D-1050` figura ☠️ RESUELTA y el sujeto que la motivó SIGUE SIN GATE

Medido contra `main` (`814a06c1`), con discriminador, no leído:

1. **`scripts/censo-voseo.mjs` no importa `lib-voz.mjs`.** Tiene su propia lista
   y su propio matcher. Sobre un JSX voseante devuelve **0**. La cura de B vive
   en `lib-voz` y es **opt-in por consumidor** (`{jsx:true}`).
2. **`verify:diseno`/R66 sí usa el matcher curado, pero su corpus no incluye al
   admin:** `RAICES = ['apps/cliente/src', 'apps/prestador/src']`.

**El discriminador, corrido:** sembré `TE PIDIERON A VOS` en
`apps/admin/src/pantallas/Casos.tsx` y **`verify:diseno` salió VERDE, exit 0**.
(Restaurado; el árbol quedó limpio.)

⇒ **la app que motivó la ficha sigue fuera de alcance de los dos instrumentos.**
Los seis voseos que se curaron en S114-F **no los encontró ningún gate**: tres
los trajo el founder y tres aparecieron trayendo `lib-voz` a mano.

**Y la razón por la que nadie lo vio es la que vale:** B curó la biblioteca
correctamente y midió su delta sobre el corpus del gate — su medición era
**verdadera y completa para lo que el gate mira**. R66 hasta **declara** su
corpus, honestamente: *«CORPUS: apps + ui + api»*. Lo que envejeció es qué
significa **«apps»**: nació una tercera. *Un corpus definido por enumeración no
falla cuando aparece un sujeto nuevo — sigue dando verde, y su nombre colectivo
se sigue leyendo como si estuviera completo.* Pariente de `L-520`.

**Dueños:** el corpus es de B (`verify-diseno.mjs`); la ficha es de A. F no
tocó ninguno de los dos — **se declara, no se cura**.

### `L-517` está depositada DOS VECES en `DEUDAS_CANONICAS.md`

Líneas **29891** y **30066**. Verificado que son **la misma ficha** (diff = una
sola línea, un `---` final), no dos textos distintos. Hoy es sólo ruido; el día
que alguien edite una copia quedan dos versiones de la misma ley que se pueden
citar distinto — *dos letras que se contradicen son peores que una equivocada*.
Barato de cerrar ahora, caro después. **Dueño: A** (`DEUDAS_CANONICAS.md` no es
territorio F).

### Lo del legado, con su firma

Placas **queda rota por decisión del founder**, no por olvido. El legado **se
apaga**; `admin.epetplace.com` pasa a la mesa nueva. Los seis pasos están
escritos.

---

## ④ LAS LECCIONES QUE DEJA F

`L-504` · `L-505` · `L-506` · `L-509` · `L-510` · `L-511` · `L-512` · `L-516` ·
`L-517` · `L-518` · `L-519` · `L-521` · `L-522` · `L-523` · `L-524` · `L-525` ·
`L-526` · `L-527` · `L-528` · `D-1050`.

**Las tres que más caro salieron:**

- **`L-521` — un artefacto que se construye con ÉXITO no prueba que contenga lo
  que uno cree.** El build del admin salía `exit 0` con **199,89 kB** en vez de
  **482,67 kB**: *no compilaba la app*. **Tres capas mintieron a la vez** — el
  exit code, el sourcemap (lista lo que Rollup **procesó**, no lo que quedó), y
  sólo grepear el bundle lo cerró. **Yo reporté ese número como «el admin
  construido» durante una tanda entera.** Curado con un guard que sale en 1 si
  faltan las variables, probado en las dos direcciones — y el criterio correcto
  **ya estaba escrito** en `apps/pagos-web/build.mjs`.
- **`L-522` — `--filter` en un lockfile lo PODA a la plataforma de quien lo
  corre.** Borró **146 líneas**, entre ellas los **30 binarios de
  `lightningcss-linux`**. *Lo cazó el `--stat`, no un error.*
- **`L-524` — para saber si algo se usa no se lee el código: se cuentan sus
  filas.** Es lo que ordenó el plan de reconstrucción y lo que evitó construir
  cuatro pantallas para tablas con una fila.

---

## ⑤ MIS ERRORES, DECLARADOS

**Tres conclusiones falsas sobre el deploy, las tres «bien medidas»:** absolví el
`ignoreCommand` con un control que vivía **dentro del mismo bloque que la causa
real** · fabriqué una heurística por tamaño del diff que un commit
(`51abbf4`) falsó · y llamé «intermitencia» a lo que no lo era: no había
regresión, era la capa del override.

**`L-523` decía de menos y se enmendó:** escribí «muestra vacío», y un `.map`
sobre un objeto **tira**. La ficha ahora dice que produce los dos desenlaces y
que no se puede saber cuál.

**Rompí el React de `cliente` y `prestador`** declarando `^19.2.5` en el admin,
que metió 19.2.8 en el árbol compartido: `main` tenía 0 ocurrencias y mi rama
81. Curado alineando a `19.2.3` exacto.

**Dos de instrumento el último día:** un `s.index` del cierre me devolvió una
posición **anterior** a la de la apertura, así que el slice salió vacío y
`replace('', …)` me **prependió un bloque al inicio del archivo** — el reemplazo
«exitoso» no avisó nada, lo cazó el typecheck. Y **leí el exit del pipe en vez
del comando por cuarta vez** (`L-191`).

**Un voseo que escribí yo** (`Podés`) el mismo día que estaba curando voseos
ajenos, y que **ningún gate podía ver** (§③).

---

## ⑥ OPERATIVO

- **Migración:** `20260911500000_s114f_puerta_liquidacion.sql`, con **reversa
  escrita antes** (`docs/relevamientos/S114-F-REVERSA-…`).
- **Typecheck:** 0 en `apps/admin` y en `packages/api`.
- **Build del admin:** `exit 0`, **481,65 kB** — y **verificado por CONTENIDO**,
  no por el ✓ verde: `exchangeCodeForSession`, `error_description`,
  `replaceState` y las cadenas de las curas presentes; las afirmaciones viejas
  ausentes. *Es mi propia `L-521` aplicada a mí.*
- **Voz:** 0 en mi territorio, medido con el matcher curado de B **y** con el
  barrido manual — porque ninguno de los dos gates del repo lo alcanza (§③).
- **`apps/admin/vercel.json`** con `"ignoreCommand": "exit 1"`, y
  `apps/admin/.gitignore` para que `dist/` y `*.tsbuildinfo` no entren al árbol.
- **Docs de F en `main`:** `S114-F-RELEVAMIENTO` · `S114-F-TANDA1` ·
  `S114-F-CIERRE-DEPLOY` · `S114-F-DECISION-camino-a-produccion-del-admin` ·
  `S114-F-PLAN-reconstruccion-del-admin` · `S114-F-PASOS-proyecto-vercel-admin` ·
  `S114-F-PEDIDOS-A` · `S114-F-AVISO-A-curas-del-portal` + 7 avisos de buzón.
- **Sin OTA:** el admin es web, viaja por deploy.

---

## ⑦ LO QUE F **NO** HIZO, SIN MAQUILLAR

- **Las 4 pantallas por construir** del plan de reconstrucción: no se
  construyeron. El plan las ordena y dice por qué.
- **El apagado del legado y el DNS de `admin.epetplace.com`**: los pasos están
  escritos, **la ejecución es del founder** (toca dashboard y dominio).
- **Placas**: rota por firma, no se persigue.
- **El corpus de R66 y la ficha `D-1050`**: declarados, no curados — tienen
  dueño y no es F.
- **Nada del portal se probó en producción**: todo lo que se verificó fue
  contra el build local, el bundle y la base. *El único juicio que falta es el
  del founder abriendo el portal desplegado.*
