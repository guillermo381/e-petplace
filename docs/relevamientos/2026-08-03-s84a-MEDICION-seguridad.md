# S84-A21 · SEGURIDAD — medición, sin construir

> **Alcance firmado para S84: cambiar contraseña + recuperar contraseña.** Correo
> de ingreso y sesiones van a S85.

---

## ① QUÉ HAY HOY — y es menos de lo que el alcance supone

**El wrapper de auth tiene CUATRO funciones**, todas medidas en
`packages/api/src/wrappers/auth.ts`:

```
registrarse · iniciarSesion · cerrarSesion · obtenerSesion
```

**`resetPasswordForEmail`: 0 ocurrencias en todo el repo.**
**`updateUser`: 0 ocurrencias en todo el repo.**

⇒ **Las dos cosas del alcance hay que construirlas enteras.** Confirma lo que el
canon de S81 ya declaraba (*"recuperar contraseña NO EXISTE"*), y agrega que
**cambiar contraseña tampoco**.

### La configuración de correo — con su límite declarado

De `supabase/config.toml`:

| | |
|---|---|
| `site_url` | **`http://127.0.0.1:3000`** — el default del template |
| `additional_redirect_urls` | `["https://127.0.0.1:3000"]` — el default |
| `email_sent` (rate limit) | **2 por hora** |
| `enable_confirmations` | `false` |
| `secure_password_change` | **`false`** |
| `minimum_password_length` | 6 |
| `otp_length` · `otp_expiry` | **6 dígitos · 3600 s** |
| plantillas de correo en el repo | **ninguna** |

> **⚠️ EL LÍMITE, Y ES GRANDE: `config.toml` es la config del entorno LOCAL
> (`supabase start`), NO la del proyecto remoto `zyltipqscdsdsxnjclhp`.** La del
> remoto vive en el dashboard y **no es legible desde el repo ni por SQL**.
> **Por lo tanto NO PUEDO responder qué plantillas están puestas, en qué idioma
> ni con qué remitente** — que era la pregunta ①.
>
> **Lo que sí se puede afirmar:** si nadie las tocó, el proyecto usa **las
> plantillas por defecto de Supabase — en inglés, desde
> `noreply@mail.app.supabase.io`, con rate limit de 2-3 por hora.** *Eso es
> exactamente el correo que la orden describe como "no se abre".* **Pero es una
> inferencia sobre config no medida: quien la verifique, lo hace en el
> dashboard, en dos minutos.**

---

## ② EL DEEP LINK — **EL FRENO SE CUMPLE**

**Lo medido:**

| | |
|---|---|
| `scheme` en `app.json` | **existe**: `prestador` · `cliente` |
| `intentFilters` (Android App Links) | **CERO** |
| `associatedDomains` (iOS Universal Links) | **CERO** |
| `Linking.addEventListener` / `getInitialURL` / `createURL` | **CERO en las dos apps** |
| `expo-linking` instalado | sí (`~57.0.2`) |

**Lectura honesta, en tres capas:**

**(a) El scheme existe y expo-router lo resuelve solo.** Una URL
`prestador://recuperar` **abriría la ruta** sin código adicional — expo-router
mapea path a ruta por convención. *Que nadie llame a `getInitialURL` no es el
problema.*

**(b) El problema es que ese enlace VIAJA POR CORREO.** Un `prestador://…` **no
es un enlace clickeable** en la mayoría de los clientes de correo — el mismo
muro que D-509 midió en S79 con WhatsApp (*"scheme muerto en dispositivo:
WhatsApp no linkea, navegador busca"*). **Y no hay App Links `https` que lo
salven: cero `intentFilters` es cero.**

**(c) Y hay una segunda incógnita que tampoco es medible desde acá:** Supabase
envía el enlace como `https://<proyecto>.supabase.co/auth/v1/verify?…&redirect_to=X`,
y **`X` tiene que estar en la allowlist de Redirect URLs del proyecto remoto**.
Hoy la config local lista `127.0.0.1:3000`. **Si `prestador://` no está en la
allowlist del dashboard, Supabase rechaza el redirect** — y eso no se ve hasta
probarlo.

> ### ⇒ **FRENO CONFIRMADO: el camino del ENLACE no entra por OTA.**
> Depende de **App Links `https`** (build nativa) **o** de config remota que hay
> que verificar y probablemente cambiar. **Las dos cosas caen del lado de S85,
> con el tren de la build (D-617).**

### PERO HAY UN CAMINO QUE NO NECESITA ENLACE, y cambia la decisión

**Supabase puede mandar el token de recuperación como CÓDIGO DE 6 DÍGITOS** en
vez de link: la plantilla usa `{{ .Token }}` en lugar de `{{ .ConfirmationURL }}`,
y la app lo canjea con `verifyOtp({ type: 'recovery', email, token })`.

**El usuario recibe un código, lo tipea en la app. No hay link que abrir, no hay
scheme, no hay App Links, no hay allowlist.**

- **`otp_length = 6` y `otp_expiry = 3600` ya están configurados** (medido).
- **Todo el flujo es JS ⇒ entra por OTA.**
- **Costo:** cambiar la plantilla de recuperación en el dashboard (una vez) +
  una pantalla de "escribí el código".
- **Y de paso resuelve el idioma y el remitente**, porque tocar la plantilla es
  el mismo acto.

> **⚠️ NO ESTÁ PROBADO CONTRA EL PROYECTO.** Es la lectura del contrato de
> Supabase + la config local medida. **Lo que lo confirma es un correo real, y
> eso exige tocar la plantilla — que es decisión, no medición.** Se declara así
> en vez de darlo por hecho.

---

## ③ EL CLIENTE — no tiene nada que reusar

**Cero `resetPasswordForEmail`, cero `updateUser`, cero listeners de deep link
en `apps/cliente`.** La suposición de la orden (*"la app del cliente lleva más
camino recorrido en auth"*) **es cierta para login/registro/onboarding, no para
esto**: el cliente tiene el arco de ENTRADA construido, no el de RECUPERACIÓN.

**No hay nada que reusar. Lo que se construya nace en el prestador y se
promueve** — y conviene que nazca sabiendo que va a tener un segundo consumidor.

---

## ④ CAMBIAR CONTRASEÑA — **se puede exigir la actual, y cuesta poco**

**Supabase NO la pide por defecto:** `updateUser({ password })` cambia la clave
con la sola sesión activa. **Y `secure_password_change = false`** en la config
medida — o sea que ni siquiera exige sesión reciente.

⇒ **Hoy, una sesión robada podría cambiar la contraseña sin conocer la vieja**,
que es exactamente el riesgo que la orden nombra.

**Cómo se exige, y su costo:** re-autenticar antes de escribir —
`signInWithPassword({ email, password: laActual })` y, si pasa, `updateUser`.
**Una llamada extra, sin dependencias nuevas.** *Y el rebote es honesto y
específico: "la contraseña actual no coincide" es distinto de "no se pudo
cambiar".*

**Alternativa declarada, más barata pero de otro alcance:** poner
`secure_password_change = true` en el proyecto — exige **sesión reciente**, no la
contraseña. **Protege contra una sesión vieja robada, no contra una recién
robada.** *La re-autenticación es más fuerte; las dos pueden convivir.*

---

## ⚠️ LA REGLA QUE GOBIERNA, registrada para que no se pierda al construir

> **NUNCA se declara si un correo existe.** *"Si esa dirección tiene cuenta, te
> llega un enlace"* — **el mismo mensaje exista o no.**

**Y tiene una consecuencia técnica que es fácil violar sin querer:**
`resetPasswordForEmail` **no falla** con un email inexistente, así que el camino
feliz ya es indistinguible. **Lo que delata es todo lo demás:** un tiempo de
respuesta distinto, un `ok:false` que se filtra, o —el más común— **una
validación previa del tipo "ese correo no está registrado"** puesta con buena
intención. *Confirmarlo convierte el formulario en un censo de usuarios.*

---

## EL REPARTO QUE ESTA MEDICIÓN SUGIERE

| | dónde entra | por qué |
|---|---|---|
| **CAMBIAR contraseña** | **este OTA** | `updateUser` + re-autenticación son JS puro. **No toca deep links, ni plantillas, ni config remota.** |
| **RECUPERAR por CÓDIGO (OTP)** | **este OTA**, si se firma el camino | cero link, cero scheme. Cuesta una plantilla en el dashboard. |
| **RECUPERAR por ENLACE** | **S85, con la build** | App Links `https` = build nativa. **Es el freno.** |

**La decisión que queda es de la mesa:** si la recuperación va por **código** —y
entra ahora— o por **enlace** —y espera al tren de S85 junto con D-617.
