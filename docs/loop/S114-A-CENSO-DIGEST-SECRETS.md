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


---

## ⚠️ ESTE CENSO ESPERA FIRMA — NO ESTÁ CERRADO (adenda 11 ①)

Los tres de baja entropía y sensibles —**`NUVEI_APP_CODE_CLIENT`,
`NUVEI_APP_CODE_SERVER`, `DEUNA_POINT_OF_SALE`**— están **efectivamente
publicados para quien tenga acceso al dashboard**. La decisión de rotarlos es
del **founder**, con **fecha límite antes de octubre**. No se rotó nada.

## EL COSTO DE ROTARLOS, medido (para firmar con el número delante)

### `NUVEI_APP_CODE_CLIENT` — el más barato, y probablemente innecesario
- **Lo lee UN lugar:** `apps/pagos-web/build.mjs:45`, que lo **hornea en el
  bundle** que se sirve al navegador (junto a `NUVEI_APP_KEY_CLIENT`).
- 🔴 **Ya es público por diseño**: viaja al navegador en cada alta de tarjeta.
  *El digest no lo expone más de lo que el bundle ya lo expone.* Rotarlo por el
  digest no cambia su exposición real.
- **Costo del lado nuestro:** cambiar el secret **+ rebuild de `pagos-web`** (no
  es OTA: es el deploy de esa web). **+ alta del código nuevo en Nuvei.**

### `NUVEI_APP_CODE_SERVER` — el más caro de tocar
- **Lo leen OCHO edges:** `pagos-alta-tarjeta`, `pagos-cobro`,
  `pagos-cobro-recurrente`, `pagos-reverso`, `pagos-tarjetas`, `pagos-conciliar`,
  `pagos-borrar-tarjeta`, `pagos-webhook-stg` — todas por `Deno.env.get`, así que
  **rotar el secret las alcanza a las ocho sin re-desplegar** (leen el env vivo).
- 🟡 **NO viaja al cliente**: entra dentro de un MD5 de firma
  (`MD5(token_'_app_code_'_uid_'_app_key)`, `pagos-alta-tarjeta:222`). *No es
  observable en el tráfico como el client code — su única exposición hoy es el
  digest del listado.*
- **Costo del lado nuestro:** cambiar el secret, y nada más de código (las ocho
  lo releen). **PERO el `app_code` es la identidad de la cuenta ante Nuvei**, así
  que **rotarlo EXIGE acción de Nuvei** —dar de alta el código nuevo y su
  `app_key` pareja— y **es un cambio coordinado con el proveedor, no un
  UPDATE unilateral.** Si se cambia el code sin el key nuevo, la firma MD5 deja
  de validar y **todo cobro se cae.**

### `DEUNA_POINT_OF_SALE` — intermedio
- **Lo lee UN lugar:** `pagos-deuna-solicitud:37`, por env. Rotar el secret lo
  alcanza sin re-desplegar.
- **Costo del lado nuestro:** cambiar el secret. **Pero el POS lo asigna DeUna**
  — un POS nuevo es alta del lado del proveedor, no un valor que elijamos.

## La lectura para la firma, en una línea

**Ninguno de los tres se rota con un `UPDATE` solo.** Los dos que importan
—`APP_CODE_SERVER` y `DEUNA_POINT_OF_SALE`— **exigen acción del proveedor**
(Nuvei / DeUna), así que rotarlos es coordinar un cambio de credencial con
ellos, no una operación nuestra. Y el `CLIENT` code **ya es público por el
bundle**, así que su rotación por el digest no compra nada. *El costo real no
es técnico de nuestro lado —es una gestión con el proveedor— y ese es el número
que faltaba para decidir.*
