# S114-A · CENSO · el digest de los secrets es sha256 crudo del valor

> **Medición, no cura (adenda 9 ①). 7-sep-2026 ~21:00 Guayaquil.**
> No se cambió nada, no se expuso ningún valor, no se rotó nada.

## El hecho

`supabase secrets list` devuelve, por cada secreto, un `value` que **es
`sha256(valor)`** — no el valor, pero tampoco un digest salado ni con
estiramiento. **Un sha256 crudo de un valor de baja entropía es reversible por
fuerza bruta en segundos**: si el valor tiene formato conocido (un id numérico,
un teléfono, un enum), el digest **es** el valor para quien pueda leer el
listado.

*Lo cacé midiendo el WABA_ID (adenda 8 ④): comparé el digest publicado contra
los dos candidatos y uno coincidió exacto. Si el método sirve para confirmar
cuál de dos ids es, sirve para descubrir uno que no se conoce.*

## Quién lee ese listado — medido

`secrets list` exige un **access token de la Management API de Supabase**
(sesión del dashboard o del CLI logueado). **NO lo lee la anon key ni la
service_role** — probado: la anon key contra
`api.supabase.com/v1/projects/.../secrets` devuelve `JWT failed verification`.

⇒ **el público del listado es «quien tenga acceso de dashboard al proyecto»**,
no «cualquiera con el bundle». Eso acota el riesgo — pero también dice que
**quien lo lee ya es de adentro**, y para ése el digest de baja entropía es una
forma de leer valores que quizá su rol no debería.

## Clasificación — SIN exponer un solo valor, por el formato conocido del nombre

### 🟢 Alta entropía · el digest no ayuda (19)
`ANTHROPIC_API_KEY` · `DESPACHO_SECRET` · `DEUNA_API_KEY` · `DEUNA_API_SECRET` ·
`DEUNA_WEBHOOK_SECRET` · `FCM_SERVICE_ACCOUNT` · `GOOGLE_PLACES_API_KEY` ·
`LIVEKIT_API_KEY` · `LIVEKIT_API_SECRET` · `META_WHATSAPP_TOKEN` ·
`NUVEI_APP_KEY_CLIENT` · `NUVEI_APP_KEY_SERVER` · `RESEND_API_KEY` ·
`SUPABASE_ANON_KEY` · `SUPABASE_DB_URL` · `SUPABASE_JWKS` ·
`SUPABASE_PUBLISHABLE_KEYS` · `SUPABASE_SECRET_KEYS` · `SUPABASE_SERVICE_ROLE_KEY`

Son largos y aleatorios; su digest no se revierte.

### 🟡 Baja entropía **pero ya público por diseño** · el digest no agrega exposición (9)
| secreto | por qué ya es público |
|---|---|
| `SUPABASE_URL` | el `ref` viaja en cada request del bundle |
| `LIVEKIT_URL` | la URL del servidor viaja al cliente |
| `URL_APP_BASE` | es la URL de la app |
| `META_WABA_ID` | la mesa publicó los dos WABA IDs |
| `META_PHONE_NUMBER_ID` | el número de WhatsApp es público |
| `AVISOS_EMAIL` | un remitente de correo es observable |
| `PAGOS_AMBIENTE` | `stg`/`prod` no es secreto |
| `PAGOS_ORIGENES_PERMITIDOS` | los dominios permitidos son observables |
| `INVITACION_CORREO_VIVO` | flag/correo, no es una credencial |

### 🔴 Baja entropía **Y** potencialmente sensible · MIRAR (3)
| secreto | qué es | por qué mirar |
|---|---|---|
| `NUVEI_APP_CODE_CLIENT` | código de comercio Nuvei | identifica la cuenta ante el proveedor; formato conocido |
| `NUVEI_APP_CODE_SERVER` | código de comercio Nuvei (servidor) | ídem |
| `DEUNA_POINT_OF_SALE` | id de punto de venta DeUna | formato conocido, corto |

**⚠️ Estos tres no son «la llave» —esa es la `APP_KEY`/`API_SECRET`, que son
alta entropía— pero son la MITAD del par.** Un código de comercio no autoriza
un cobro solo; sí identifica la cuenta, y en un ataque es el dato que le dice al
atacante contra qué comercio probar la otra mitad.

## Lo que NO se decide acá

**Rotar, salar o mover estos tres es decisión del founder** — y no es obvia:
el `NUVEI_APP_CODE` probablemente sea observable en el tráfico del checkout de
todas formas (viaja al cliente en el alta de tarjeta). *Lo que este censo
aporta es que hoy están, además, en un listado que su digest no protege — y que
ese listado lo lee quien tenga acceso de dashboard.* La decisión de si eso
importa, con esos dos hechos sobre la mesa, es de él.
