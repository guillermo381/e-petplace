# S114-F · el hilo del deploy — cierre

**8-sep-2026.** Empezó como *«¿dónde queda publicado el admin?»* y terminó en una
cura estructural, un gate nuevo y cuatro lecciones. Lo que sigue es **lo medido**;
lo no medido se declara como tal y no se completa con lo que uno esperaba.

---

## ① Las dos verificaciones que originaron todo

### El bundle publicado — VERDE, medido contra producción

`https://admin.epetplace.com` sirve `assets/index-B4k1WxEH.js` (1 857 532 bytes).
Búsqueda literal sobre ese archivo:

```
✅   0  la URL de RAMA (…-git-main-…vercel.app) — la que devolvía el login de Vercel
✅   0  e-petplace-admin.vercel.app — la canónica anterior, ya superada
✅   1  admin.epetplace.com — CONTROL POSITIVO
✅  25  redirectTo — CONTROL POSITIVO
✅  21  google — CONTROL POSITIVO
```

**Los dos ceros son verdaderos**: el mismo instrumento, sobre el mismo archivo,
encuentra las otras tres cosas. Y la única ocurrencia está donde tiene que estar:

```js
signInWithOAuth({ provider:`google`, options:{ redirectTo:`https://admin.epetplace.com` } })
```

### El clic — VERDE, y hicieron falta DOS mediciones distintas

Sonda al endpoint de OAuth de Supabase con la URL canónica:

```
HTTP/2 302
location: https://accounts.google.com/o/oauth2/v2/auth?…
          &redirect_to=https%3A%2F%2Fadmin.epetplace.com
          &redirect_uri=https%3A%2F%2Fauth.epetplace.com%2Fauth%2Fv1%2Fcallback
```

🔴 **Esa sonda sola no alcanzaba, y el discriminador lo probó:**

```
① canónica  admin.epetplace.com   → accounts.google.com  ✅
② una URL INVENTADA                → accounts.google.com  ✅  ← acá se cae
③ la URL vieja que rompía           → accounts.google.com  ✅
```

Las tres pasan ⇒ **la sonda mide el DESPACHO, no la vuelta.** La allow-list se evalúa en
el *callback*, un eslabón más adelante, y ahí mi instrumento no llegaba (`L-505`).

✅ **La vuelta la midió el founder, por camino real en el navegador:** «Entrar con Google»
desde `admin.epetplace.com` **vuelve a `admin.epetplace.com/login`**.

> ***Fueron dos mediciones distintas y las dos hacían falta.*** El bundle y la sonda
> prueban que lo publicado es correcto y que el despacho sale bien; **sólo el camino real
> prueba que la vuelta aterriza en el dominio propio**. Ninguna de las dos, sola, cerraba
> el defecto.

**El defecto que originó el hilo queda CERRADO:** la URL canónica es el dominio propio, la
sesión de Supabase queda en el dominio correcto, y **nadie vuelve a encontrarse el login de
Vercel** donde esperaba entrar.

## ② La causa, y por qué costó tanto

**`Ignored Build Step` en `Automatic`.** Tres pushes a `main` —`f1db76e`,
`8934a30`, `61de31a`— no produjeron deployment, y producción sirvió el bundle
viejo **2 h 20 min** con el login roto adentro.

🔴 **Su modo de falla es el silencio.** El build moría tan temprano que **no dejó
un solo registro**: ni error, ni deployment en *Skipped*, ni línea en el Activity
log — ni siquiera del Deploy Hook disparado a mano. Y un silencio se lee igual
que «todavía no llegó».

**Los cinco candidatos descartados por medición, en orden:**

| candidato | cómo se descartó |
|---|---|
| techo de deployments | el monorepo desplegó 28 min después del push fallido |
| webhook del repo | el repo **no tiene ninguno**: la conexión es GitHub App |
| GitHub App rota | funcionaba: el push siguiente sí construyó |
| force push / amend | reflog limpio; y el force push era mío, en otro repo |
| límites de gasto | el proyecto no estaba pausado ni excedido |

⚠️ **Los tres árboles eran distintos entre sí** — medido. Así que la heurística
compara algo más que el contenido, y **el texto de la pantalla describe el caso
típico, no el contrato** (`L-504`).

---

## ③ La cura — PENDIENTE CON MEDICIÓN, no firma cumplida

**Firmada:** en un proyecto donde cada push es intencional no se deja una heurística
ajena decidiendo si construir.

🔴 **Hoy eso vive SÓLO en el dashboard.** Bajarlo a `vercel.json` con `ignoreCommand`
se intentó **en dos formas y se retiró**:

```
commit    vercel.json                push        deployment
c0aee5e   sin campo                  00:55:43Z   ✅  33 s
73b275c   sin campo                  01:54:54Z   ✅  24 s
bf6bf9b   sin campo                  04:54:23Z   ✅  2 m 21 s   ← lo produjo el HOOK
f3171cc   con  echo '…"…"…'; exit 1      —       🔴  ninguno
b5716d1   con  "exit 1" pelado       05:13:04Z   🔴  ninguno en 5 min
66cf314   sin campo (retirado)           —       🔴  ninguno en 5 min
```

**El último renglón absuelve al campo:** sin él tampoco construye. Y mi primera
hipótesis —las comillas dobles rompiendo el comando— **la falsó su propio
experimento**: la forma pelada tampoco funcionó (`L-506`).

Se descartó el schema antes de tocar nada: `ignoreCommand` existe, `type string|null`,
`maxLength 256`, mi valor 92, `additionalProperties: false` limpio ⇒ **el archivo nunca
fue inválido**.

### 🔴 Y lo que aparece en su lugar es más grande: son DOS caminos

| camino | estado | evidencia |
|---|---|---|
| **Deploy Hook** → build | ✅ curado | con `Automatic` daba `PENDING` para siempre; con construir-siempre salió en 20 s |
| **push a `main`** → deployment | 🔴 **roto** | tres pushes seguidos sin deployment **en ningún estado** |

⚠️ **`bf6bf9b` desplegó por el HOOK, no por su push.** Concluir «la GitHub App
funciona porque el push siguiente construyó» **es inválido** — es medir una rama y
concluir sobre la otra (`L-500`). *Ese error se cometió en este mismo hilo.*

**Dónde quedó escrito, para que el próximo no repita el ciclo:** `DEPLOY.md` del legado
(nuevo, y es lo que hay que leer **antes** de tocar settings), el README que lo enlaza,
la cabecera del `CLAUDE.md`, y el mensaje del gate — que ahora dice **qué valor tiene
que tener** el setting, no sólo dónde mirar.

## ④ El gate que avisa si vuelve a pasar

`.github/workflows/deploy-al-dia.yml` + `scripts/verify-deploy-al-dia.mjs`.
En cada push a `main`: espera 5 min y le pregunta a la **API de Deployments de
GitHub** si la punta tiene deployment.

```
0  al día
1  la punta no se desplegó          → ✗ roja en el commit + mail a quien pusheó
2  no concluyente                    → sin `gh`, o ventana de 100 llena
```

**El margen de 5 min es 5× el peor caso medido** (26 s · 33 s · ~60 s). Si algún
día uno tarda más, **se re-mide, no se sube por costumbre**.

**Cómo se entera el founder, en tres capas y la primera alcanza:**
① ✗ roja al lado del commit, sin entrar a Actions · ② mail automático de GitHub
al autor del push · ③ Job Summary con los tres lugares del dashboard, en orden.

### Su historial real, que es su mejor prueba

| commit | veredicto | por qué |
|---|---|---|
| `bf6bf9b` | ✅ verde | el deploy salió a los 2 min 40 s, dentro de su ventana |
| `f3171cc` | 🔴 **rojo** | **su primer caso real fue un error de su propio autor** |

⚠️ **Honestidad sobre el verde:** `bf6bf9b` **no viró de rojo a verde** — nació
verde, porque el deployment ya existía cuando verificó. *Su capacidad de dar rojo
se probó a mano antes de cablearlo, y después la ejerció sola sobre `f3171cc`.*

---

## Las cuatro lecciones

| | |
|---|---|
| `L-503` | una respuesta de éxito dice que el pedido se **aceptó**, no que el trabajo vaya a ocurrir — y esa brecha es un punto de medición |
| `L-504` | el texto de una interfaz describe el **caso típico**; el contrato son los bordes, y no está escrito |
| `L-505` | una sonda puede ser verdadera y medir el eslabón **anterior** al que importa |
| `L-506` | la prosa **no es inerte** cuando vive adentro de algo que se ejecuta |

**Y una enmienda:** `L-502` afirmaba que *«el webhook nunca llegó a Vercel»* —
falso. El evento llegaba y se descartaba sin rastro. **El hecho verdadero refuerza
la lección**: no eran dos hipótesis indistinguibles sino tres, y *la correcta no
estaba en la lista*.

---

## Lo que queda vivo, con dueño

### El legado quedó AL DÍA — y mi conclusión anterior era prematura

> 🔴 **CORRECCIÓN.** Una versión anterior de este parte decía que el push → deployment
> del legado **seguía roto**. **Falso.** `2b777e3` construyó en **26 segundos** y
> producción sirve el bundle correcto. La conclusión salió de **tres observaciones con
> una ventana que elegí yo**, y el cuarto commit la desmintió (`L-516`).

**Lo que sobrevive:** los tres commits del medio efectivamente no tienen deployment.
*Era una **intermitencia**, no un corte* — y las dos producen las mismas observaciones.
Sin explicación medida; la hipótesis viva (la heurística decidiendo por tamaño del diff)
está en `DEPLOY.md` declarada como no probada.

### El proyecto Vercel del monorepo — medido, y no es de esta pista

**No construye desde el 6-sep**, producción incluida (46 muestreados de una ventana de
100, cero verdes). **La causa: `@epetplace/pagos-web` aborta por tres variables de
entorno faltantes** —`NUVEI_APP_CODE_CLIENT`, `NUVEI_APP_KEY_CLIENT`, `PAGOS_API_ALTA`—
y su guard es fail-closed **a propósito y bien puesto**: *«una página de pago con config
incompleta se ve bien y no cobra»*. **No se toca.**

🔴 **Pero el dato que cambia la decisión es otro: ese proyecto no le sirve a nadie.**
`e-petplace.vercel.app` sirve **una página de juguete de 2 476 bytes** («Dar Premio 🦴»),
resto del último build que salió bien. Y **`cliente` y `prestador` no tienen script
`build`**: nunca se desplegaron a web porque **nunca estuvieron en el build**, no porque
fallaran. ⇒ *La cura no es cargar variables en un proyecto sin destino — es acotar qué
construye o retirarlo, y eso lo firma el founder.*

Todo en `docs/loop/buzon/S114-F-para-TODAS-y-FOUNDER-el-monorepo-no-despliega.md`.

### Firmado — el umbral y la salida del gate (8-sep)

**① El umbral es una ESTIMACIÓN y no se puede fundar, y eso es la respuesta.**
Se re-midió con la muestra más grande disponible (n=17: mín 39 s · p50 47 s ·
p90 55 s · máx 92 s ⇒ 300 s son 3,3× el máximo). **Creció de 3 a 17 y el sesgo
persistió igual** — y eso es concluyente, ***porque no puede no persistir***: un
deployment que nunca se creó no tiene latencia. *Más datos del mismo tipo no curan
un sesgo de selección, y decirlo así vale más que un umbral mejor.*

**② Firmado: cuando el umbral no se puede fundar, la salida no es afinarlo — es
dejar de hacerlo decidir solo.**

```
el proyecto NO está desplegando          → 1  ROJO
despliega y ESTA punta quedó saltada     → 2  NO CONCLUYENTE  (no falla el job)
```

Con **un discriminador que no depende del reloj**: si existe algún deployment
posterior al commit, el corte no es del proyecto. Y **el gate lo declara en su
salida** — *uno que puede gritar en falso y no lo dice entrena a ignorarlo.*

**Verificado en la Action real** (`5543b6d`, 8-sep 14:48Z): el paso «el gate se
prueba a sí mismo» corrió y dio los **cinco brazos en verde**, y después el camino
real dio `AL DÍA`. *El `success` del job no alcanzaba: hubo que abrir el log para
saber que el paso nuevo había corrido de verdad.*

**Historial del gate — su mejor prueba:**

```
bf6bf9b ✅   f3171cc 🔴   b5716d1 🔴   66cf314 🔴   2b777e3 ✅   ec79bb7 ✅   5543b6d ✅
             └─ los tres rojos fueron sobre errores de su propio autor ─┘
```

### Esperando de A, por el buzón

~~**El SHA del candidato con la renumeración.**~~ ✅ **RESUELTO.** A confirmó por el
buzón: la punta era `a28585ac`, el tope `L-515`, y **la colisión era sólo `L-507`** —D la
usa para otra lección y los dos huecos del candidato (`L-507`/`L-508`) eran suyos—.
⇒ **mi racha pasó a `L-516`**, y el resto de mi trabajo ya estaba adentro **idéntico por
md5** (`L-503`–`L-506` y la enmienda a `L-502`).

*Se conserva el texto tachado y no se borra: **el número viajó a 13 lugares en DOS repos**
—el canon, el parte, el README del legado, el script del gate y el YAML de la Action— y
quien encuentre un `L-507` viejo en algún lado necesita saber que hubo un corrimiento.*

### Anotado para cuando el founder firme

**① El proyecto Vercel del monorepo se RETIRA, no se acota** (decisión de mesa,
8-sep). *Un proyecto que construye el monorepo entero para publicar una página de
juguete sólo puede dar disgustos.* **Antes de tocarlo, el founder mira dos cosas:**
si tiene dominio asignado, y si `epetplace-pagos-stg` depende de él. **F no lo toca.**

**② TypeScript 5.9 y 6.0 conviven** — avisado a A en
`docs/loop/buzon/S114-F-para-A-typescript-59-y-60-conviven.md`, **por nombre y sin
curar**. Corrige mi propio reporte: no es `apps/cliente` sola, son **las dos apps
Expo**, y el corte limpio «apps Expo vs. todo lo demás» sugiere que puede ser
deliberado (Expo SDK 57). *Si lo es, lo que falta no es una cura sino la línea que
lo declare — para que nadie lo unifique por prolijidad y rompa las dos apps.*

### Sin reproducir, declarado

**Por qué falla `tsc -b` de `@epetplace/admin` en ese run.** En mi rama sale `exit 0`
con turbo (199,89 kB), con el `tsc` del paquete y con el de la raíz. `pista/s114-d-1.0`
**no tiene** `apps/admin` **y su preview falla igual** ⇒ pagos-web solo alcanza para
tumbar el build. *Hipótesis no medida: podría ser una tarea cancelada por el fallo de
pagos-web, no un fallo propio — se distingue mirando si el log trae errores `TS####`.*
