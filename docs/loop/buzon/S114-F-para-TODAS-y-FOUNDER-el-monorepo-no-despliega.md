# Aviso de F a todas las pistas y al founder — **el proyecto Vercel del monorepo no construye desde el 6-sep**

**8-sep-2026 · S114-F.** No es mi frente; lo encontré midiendo otra cosa.
**No requiere acción de ninguna pista hoy** — se escribe porque ninguna puede verlo
desde su worktree y **no tiene síntoma**: `git push` sale verde igual.

---

## Lo medido

Contra la **API de Deployments de GitHub** de `guillermo381/e-petplace`
(no contra el dashboard de Vercel, al que no tengo acceso).

```
ventana pedida            100 deployments (el máximo por página)
rango que cubre           6-sep 23:42Z  →  8-sep 05:13Z
muestreados               46, todos en `failure`
verdes encontrados        0   ← la ventana se agotó sin encontrar uno
Production en la ventana  29, también en `failure`
```

🔴 **No son sólo previews.** El cierre de S113 en `main` —`e516a08`— tiene su
deployment de **Production** en `failure`.

**Y los previews son de las ramas de todas nosotras**, resueltas por SHA:

```
cba3002 → pista/s114-a-1.0      dcd4be0 → pista/s114-d-1.0
9363edb → pista/s114-c-1.0      b85b47f → pista/s114-c-1.0 y s114-e-1.0
```

---

## La causa (log del founder + reproducción local)

**El proyecto construye el monorepo entero con `turbo run build`, y `@epetplace/pagos-web`
aborta por variables de entorno faltantes.** Reproducido literal en mi worktree:

```
$ npx turbo run build
@epetplace/pagos-web:build: 🔴 FALTA LA VARIABLE NUVEI_APP_CODE_CLIENT.
 Tasks:    1 successful, 2 total
Failed:    @epetplace/pagos-web#build
```

🔴 **Ese guard NO se toca y NO se ablanda.** Su comentario dice por qué, y tiene razón:
*«una página de pago servida con config incompleta se ve bien y no funciona»*.
**Fail-closed a propósito.** Lo que falta es config del proyecto, no una cura de código.

### Las variables que exige (por nombre, sin valores)

**Obligatorias** — sin cualquiera de las tres, el build aborta:

```
NUVEI_APP_CODE_CLIENT
NUVEI_APP_KEY_CLIENT
PAGOS_API_ALTA
```

**Opcionales, con default en el código** (no rompen si faltan): `PAGOS_MODO` (`stg`) ·
`NUVEI_SDK_JS` · `NUVEI_SDK_CSS` · `JQUERY_URL` · `PAGOS_ESQUEMAS_VOLVER` (`cliente://`) ·
`PAGOS_EMAIL_ALTA`.

*Las tres obligatorias son config pública del SDK, no secretos de servidor — lo dice el
propio archivo. **`epetplace-pagos-stg` las tiene**, porque ese sitio sirve.*

---

## 🔴 Lo que cambia la decisión: ese proyecto no le sirve a nadie

**Lo que produce hoy `e-petplace.vercel.app`** — medido, HTTP 200, **2 476 bytes**:

```html
<title>Bienvenido a e-PetPlace</title>
… "El perfil de tu mascota"  ·  botón "Dar Premio 🦴" con un contador …
```

**Es una página de juguete**, el resto del último build que salió bien. No es ninguna
app del monorepo.

### Y las apps ni siquiera entran a ese build

```
cliente     script "build": NO TIENE
prestador   script "build": NO TIENE
```

⇒ **turbo sólo construye dos paquetes: `pagos-web` y `admin`.** Las dos apps Expo
**nunca se desplegaron a web porque nunca estuvieron en el build**, no porque fallaran.

*`epetplace.com` → `www.epetplace.com` responde 200 y es el sitio Astro de **otro repo**;
no lo sirve este proyecto.*

⇒ **La cura no es cargar variables.** Si el proyecto no tiene destino, es acotar qué
construye o retirarlo, **y eso lo firma el founder.** Cargar las credenciales de Nuvei en
un proyecto sin destino sería ensanchar dónde viven, a cambio de nada.

---

## Lo que NO se pudo medir, y por qué

| pendiente | por qué |
|---|---|
| si el proyecto tiene dominio asignado | exige el dashboard o un token de Vercel |
| **por qué falla `tsc -b` de `@epetplace/admin`** | **no se pudo reproducir**: en mi rama sale `exit 0` con turbo (199,89 kB), con el `tsc` del paquete y con el de la raíz |
| los logs de build | exigen el CLI autenticado |

**Sobre `@epetplace/admin`, lo que sí está medido:**
`pista/s114-d-1.0` **no tiene** `apps/admin` **y su preview falla igual** ⇒ *pagos-web
solo alcanza para tumbar el build*. Las versiones de A, C y E son anteriores a la mía
(13/15 archivos) pero **consistentes consigo mismas** —su `App.tsx` no importa lo que les
falta— así que compilarían.

⚠️ **Hipótesis NO medida, para quien tenga el log:** cuando turbo aborta por un fallo,
las tareas en vuelo quedan canceladas. `@epetplace/admin` podría aparecer en el log como
**tarea cancelada, no como fallo propio**. *Se distingue mirando si el log trae errores
`TS####` reales o sólo un `cancelled`.*

---

## Cómo verificarlo cualquiera, sin dashboard

```bash
gh api "/repos/guillermo381/e-petplace/deployments?per_page=5" \
  --jq '.[] | "\(.id) \(.sha[0:7]) \(.environment)"'

gh api "/repos/guillermo381/e-petplace/deployments/<id>/statuses?per_page=3" \
  --jq '.[] | "\(.state) — \(.description)"'
```

⚠️ **`gh` responde con la sesión de GitHub, no con credenciales de Vercel** — sólo lectura,
no toca nada.

---

## De dónde salió

Persiguiendo por qué **otro** repo (`e-petplace-admin`) no desplegaba. Ése es un caso
distinto y el discriminador que los separa es limpio: **acá sí hay deployments y están en
`failure`** —el build arranca y revienta—; allá **no hay deployment ninguno**, el corte es
anterior al build.
