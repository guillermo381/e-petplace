# S112-A · MEDICIÓN DE ALTA Y RECUPERACIÓN DE CONTRASEÑA

> **Depositada porque el founder la pidió y sólo vivía en la conversación.**
> Se localiza en qué capa muere cada flujo, con evidencia. **No se curó nada
> acá**: las dos capas rojas son de C y están en su prompt.

## CONTRA QUÉ SE MIDIÓ

- **(a) el aparato** — bundle del founder, cliente group `0ba9b6cb`→`0b885c6a`,
  ancla **`df9b1c83`** leída del OBJETO (`update:view --json`),
  `isGitWorkingTreeDirty: None`, runtime 1.0.7, publicado 1-sep 16:36 -05.
- **(b) `main`** en `cc55348b` → `c1daa214` durante la corrida.
- 🟢 **`git diff df9b1c83..HEAD` sobre los diez archivos de estos dos flujos +
  `app.json` + `app.config.ts` dio VACÍO.** ⇒ **ninguna capa se comporta distinto
  entre el aparato y `main`**: lo medido es lo que el founder tiene en la mano.
- Base: proyecto `zyltipqscdsdsxnjclhp`. Config remota por Management API —
  **no** por `config.toml`, que es del entorno local (límite de S84).

## CONTROLES (20:45 -05)

- **Positivo:** login de cuenta existente → **HTTP 200 con `access_token`**, y su
  guard (`get_estado_onboarding_dueno`) devuelve `tiene_familia: true` ⇒ `/hogar`.
- **Negativo:** misma cuenta, clave mala → **HTTP 400 `invalid_credentials`**.

*El instrumento sabe dar rojo.*

## FLUJO 1 · CREAR CUENTA — `guillo381+alta0901@gmail.com`, 20:47:34 -05

| # | capa | resultado | evidencia |
|---|---|---|---|
| 1 | fila en `auth.users` | 🟢 | `POST /auth/v1/signup` → 200 · `id 223ab623` · `created_at 01:47:34Z` |
| 2 | correo despachado | 🟢 | `confirmation_sent_at 01:47:35Z` · `auth.audit_log_entries` → **`user_confirmation_requested`**. GoTrue devuelve 500 si el SMTP rechaza; devolvió 200 ⇒ Resend aceptó |
| 2b | plantilla y remitente | 🟢 | `smtp.resend.com` · remitente `hola@epetplace.com` · asunto *«Confirma tu cuenta · Confirm your account»*, plantilla **propia y bilingüe**. **`D-628` vencida** |
| 3 | ¿link? ¿deep link o navegador? | 🟢 **no hay link** | la plantilla emite **`{{ .Token }}`**, no `{{ .ConfirmationURL }}`. La pregunta del deep link **no aplica**. Igual estaría cubierta: `uri_allow_list` tiene **`cliente://**` y `prestador://**`**, y el scheme de `app.json` es `cliente` — **coinciden** |
| 3b | largo del código | 🟢 | servidor `mailer_otp_length = **8**` · pantalla `verificar-correo.tsx` **8** · `packages/api LARGO_CODIGO_RECUPERACION` **8**. **Los tres coinciden** |
| 3c | **¿llega al buzón?** | 🟢 **medido por el founder** | pegó el código **`90396843`** de la cuenta de refugio: **8 dígitos**, exactamente lo que el servidor emite y lo que la pantalla espera |
| 4 | trigger de perfil | 🟢 | `on_auth_user_created → handle_new_user`. Fila en `profiles` con `nombre` y `email`. Toma `full_name → name → nombre` |
| 5 | guard tras el alta | 🟢 motor · **la pantalla es de C** | `registro.tsx`: sin sesión ⇒ `/verificar-correo`; con sesión ⇒ `/onboarding`. Raíz: `tiene_familia ? '/hogar' : '/onboarding'` |
| 6 | **salida del onboarding** | 🔴 | **el sospechoso queda CONFIRMADO** — ver abajo |

### 🔴 LA CAPA 6, con su literal

En `modo='primera'` el paso 1 monta `Encabezado variante="portada"` — **sin
`atras`** (`PasoEspecie.tsx:146` contra `:148`). En los cinco pasos + el
despachador: **cero `saltar`, cero `omitir`, cero `cerrarSesion`, cero ruta
alterna.** `MODO.primera.salida = '/hogar'` se alcanza **sólo por `PasoCierre`**,
o sea **después de crear la mascota**. Y la raíz devuelve ahí en cada arranque.

> **FLUJO 1 · no muere en motor: muere en la capa 6 — el onboarding no tiene
> salida que no sea crear una mascota, y no hay cómo cerrar sesión desde adentro.**

## FLUJO 2 · RESTABLECER CONTRASEÑA — 20:58 -05

| # | capa | resultado | evidencia |
|---|---|---|---|
| 1 | correo despachado | 🟢 | `POST /auth/v1/recover` → 200. Plantilla propia bilingüe, **`{{ .Token }}` de 8 dígitos**, vida 3600 s |
| 2 | ¿el link abre la app? | 🟢 **no hay link** | `resetPasswordForEmail` se llama **sin `redirectTo`** (medido: cero `emailRedirectTo`/`redirectTo` en los dos flujos) |
| 2b | rebote de código malo | 🟢 | código inventado → **403 `otp_expired`** ⇒ el wrapper lo mapea a `codigo_invalido`. **La cura de `D-659` ② está viva** |
| 3 | clave nueva + sesión viva | ⚪ **NO MEDIDO** | el OTP se guarda **hasheado** en `auth.users` (56 chars, no los 8 dígitos) ⇒ no se puede completar sin el buzón. **Se declara en vez de inferirlo** |
| 4 | **guard después** | 🔴 | `recuperar.tsx:205` → `router.replace('/')` con la sesión viva ⇒ raíz ⇒ `tiene_familia ? '/hogar' : '/onboarding'`. **Quien no tiene familia cae en el mismo pozo del flujo 1** |

> **FLUJO 2 · no muere en motor hasta donde se puede medir sin buzón; su capa 4
> desemboca en la capa 6 del flujo 1, por otra puerta.**

## VEREDICTO

**Nada que curar en motor.** Fila, envío, plantilla, largo de código,
allow-list, scheme y trigger: **los siete verdes.** **Las dos capas rojas son
de app y son LA MISMA** — y su salida es la misma del alta «quiero adoptar»
(ítem 15 del estacionamiento).

## HIGIENE, declarada

La Management API devuelve **`smtp_pass` en claro** y quedó en el output de esa
corrida. **El founder rotó la credencial el 2-sep**, y el control positivo
post-rotación dio verde (signup → 200 + `user_confirmation_requested`, 02:13:02Z).
⚠️ **No volver a leer la config de auth sin filtrar ese campo.**

## CUENTAS DE PRUEBA QUE DEJÓ ESTA MEDICIÓN

`223ab623` (`guillo381+alta0901@gmail.com`) y la del control SMTP
(`guillo381+alta0901b@gmail.com`). **Destino: decisión del founder.**
