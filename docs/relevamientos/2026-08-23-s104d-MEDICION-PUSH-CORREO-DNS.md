# S104-D · TURNO 1 — MEDICIÓN: PUSH · DNS · PLANTILLAS DE AUTH · LA PRUEBA REAL

**23-ago-2026 · pista D · worktree `e-petplace-s104-d`, rama `pista/s104-d`.**
**Cero código, cero migraciones, cero deploys.** Un único acto con efecto hacia
afuera, y estaba ordenado: **el disparo del correo de recuperación del bloque D.**

> **La corrección del founder se verificó ANTES de medir sobre ella, y es
> correcta.** El SMTP custom está encendido: `smtp.resend.com:465`, usuario
> `resend`, remitente `hola@epetplace.com`, nombre `e-PetPlace`. Leído del objeto
> por la Management API, no del dashboard ni de memoria. **La orden decía que
> salía por el SMTP por defecto de Supabase y eso es falso.** Todo este reporte
> mide sobre la configuración real.

---

## ⓿ EL TITULAR, ANTES DE LAS TABLAS

**Los dos frentes que la orden salió a buscar están, los dos, MUCHO MÁS CERRADOS
de lo que el canon dice — y el canon no se enteró.**

1. **PUSH está VIVO.** Última entrega real: **hoy 13:00 UTC**. El cron nunca
   falló y el HTTP es 200. **Es corto, no frente.**
2. **D-628 está MATERIALMENTE CURADA y nadie cerró la ficha.** Las tres curas que
   la ficha declara pendientes «enteras para S86» — plantilla con token, destino
   correcto, SMTP propio — **están hechas las tres.** Lo que queda vivo es el
   residuo: **las dos apps siguen pidiendo disculpas por un problema que ya no
   existe.**

> **Y eso es exactamente lo que la propia lápida de D-628 predijo, palabra por
> palabra:** *«o la pantalla va a seguir disculpándose por un problema que ya no
> existe».* **La lápida acertó y aun así nadie la ejecutó** — porque quien tocó
> las plantillas (config remota) no tocó el repo, y quien lee el repo no ve el
> dashboard. `L-395` en su forma limpia: **un puente que sobrevive a su río.**

---

## A · PUSH — ¿SIGUE VIVO DESPUÉS DE S103?

### A.1 · El cron (job 8 `despachar-push-tick`, `* * * * *`, `activo=true`)

| Medición | Job 8 (push) | Job 6 (notificaciones) |
|---|---|---|
| Corridas desde 7-ago | **22.796** | 23.971 |
| `succeeded` | **22.796** | 23.971 |
| **Distintas de succeeded** | **0** | **0** |
| Primera en la ventana | 2026-08-07 19:35:00 UTC | 2026-08-07 00:00:00 UTC |
| **Última corrida** | **2026-08-23 15:30:00 UTC** | 2026-08-23 15:30:00 UTC |
| Estado de la última | **succeeded** | succeeded |

**`succeeded` acá NO alcanza y por eso no me quedé ahí (`L-402`).** El comando es
un `net.http_post`: «el SQL corrió» no es «la función contestó». **El control que
lo prueba:**

| `net._http_response`, últimas 48 h | valor |
|---|---|
| Respuestas registradas | **792** |
| **status_code = 200** | **792 (el 100 %)** |
| **status_code ≠ 200** | **0** |
| Última | 2026-08-23 15:31:00 UTC |

*(La ventana arranca el 23-ago 09:32 porque `net._http_response` se poda sola; lo
que hay dentro de la ventana es lo que hay, y es todo 200.)*

### A.2 · `push_tokens` — dos filas, y ahí está la única cosa apagada

| activo | plataforma | cuenta | creado | último uso |
|---|---|---|---|---|
| **`true`** | android | `guillo381+8@gmail.com` (cliente) | 2026-08-07 05:26 | **2026-08-23 13:00** |
| **`false`** | android | `guillo381+demovet@gmail.com` (prestador, titular) | 2026-08-07 21:40 | 2026-08-16 14:15 |

- **2 filas · 2 cuentas · 1 activo · 0 iOS.**
- Ninguna fila nueva desde el 7-ago.

**Por qué el del prestador está en `false`, medido en el cuerpo y no supuesto:**
`despachar-push/index.ts:251-256` retira el token cuando FCM lo declara muerto
—*«un token muerto se retira, no se reintenta para siempre»*—. **No es un
defecto: es el diseño funcionando.** FCM dijo que ese aparato ya no contesta.

**Y la pregunta que decide si eso es corto o frente: ¿revive?** Sí, y está
probado en el cuerpo vivo de `registrar_push_token`:

```
UPDATE push_tokens
   SET user_id = v_uid, plataforma = p_plataforma, activo = true, last_used_at = now()
 WHERE token = p_token;
```

**El `UPDATE` pone `activo = true`.** Y `sincronizarTokenSiHayPermiso()` corre en
cada montaje de la pantalla con permiso ya concedido
(`invitacion-avisos.tsx:105` prestador · `:98` cliente), llamada verificada, no
inferida. ⇒ **el token del prestador se re-registra solo la próxima vez que el
founder abra la app del prestador.**

### A.3 · Entregas

| estado | n | última | motivo de la última |
|---|---|---|---|
| **`entregada`** | **128** | **2026-08-23 13:00:00 UTC** | — |
| `diferida` | 34 | 2026-08-21 19:03 | `diferida_techo` |
| `descartada` | 21 | 2026-08-13 13:00 | `descartada_vencida` |
| `encolada` | 14 | 2026-08-20 19:42 | — |
| **`fallida`** | **14** | 2026-08-21 00:53 | **`sin_token_activo`** |
| `leida` | 4 | 2026-08-14 18:25 | — |

**La última entregada, entera:** tipo `cita_recordatorio`, categoría `operacion`,
destinatario `guillo381+8@gmail.com`, `canal_elegido: "push"`,
**`gate_que_corto: null`**, `despacho: "para_transporte"`, despachada
**2026-08-23 13:00:01 UTC** — hace poco más de dos horas.

⚠️ **Precisión que no conviene inflar:** `entregada` se estampa cuando **FCM
aceptó** el mensaje (`r.ok`), no cuando el teléfono lo mostró. Es una entrega
real al transporte; **no es un acuse del aparato.** Ese acuse no existe hoy y
esta medición no lo finge.

Las **14 `fallida` / `sin_token_activo`** son la otra cara exacta del token
apagado del prestador.

### A.4 · ¿Los OTA de S103 tocaron algo de esto? — **por diff, no por memoria**

Ancla de los OTA de S103: **`45cf3c6b`**. Desde ahí hasta `HEAD` (`0d0c2e32`):

| Medición | Resultado |
|---|---|
| Archivos tocados en `apps/` + `packages/` | **1** |
| Cuál | `packages/ui/CLAUDE.md` |
| Tocaron `registrar_push_token` | **NO** |
| Tocaron el manifest / `app.json` / `app.config` | **NO** |
| Tocaron config de notificaciones | **NO** |

**Lo único que se movió después del ancla es un documento.** Los OTA de S103 no
pudieron romper push porque no lo tocaron.

### 🟢 VEREDICTO A, EN UNA LÍNEA

**CORTO.** El tren de push está vivo, entregó hoy, el cron nunca falló, el HTTP
es 200 en el 100 % de los ticks, y el único token apagado es el del prestador —
retirado por diseño y **reversible solo, sin código, con que el founder abra esa
app**.

---

## B · DNS — TRES LECTURAS LITERALES

### Salida cruda

```
$ dig TXT epetplace.com +noall +answer
; <<>> DiG 9.10.6 <<>> TXT epetplace.com +noall +answer
;; global options: +cmd
                        ← SIN NINGUNA RESPUESTA

$ dig TXT _dmarc.epetplace.com +noall +answer
_dmarc.epetplace.com.   360  IN  TXT  "v=DMARC1; p=none;"

$ dig TXT resend._domainkey.epetplace.com +noall +answer
resend._domainkey.epetplace.com. 360 IN TXT "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC8ISIFguIdpxW0J8CbPxP5Yiv7H18qpkV4DC/02GfNzRmqTOKMMTgkV6EtnfHEM8VwgKveX0EKMCo0IysQhNnnzodxOvZ1n84xHrVoR1rQb1lELmR1epCHPv+HUjKjBE8CDpq0fYE732qpmvEUU1DvU/+7r/h3CyCb0zP3O/TVmwIDAQAB"

$ dig TXT send.epetplace.com +noall +answer
send.epetplace.com.     360  IN  TXT  "v=spf1 include:amazonses.com ~all"

$ dig MX send.epetplace.com +noall +answer
send.epetplace.com.     360  IN  MX   10 feedback-smtp.sa-east-1.amazonses.com.
```

### Tabla

| Registro | Estado | Valor |
|---|---|---|
| **SPF raíz** `epetplace.com` | 🟠 **NO EXISTE** | (sin respuesta) |
| **SPF del return-path** `send.epetplace.com` | 🟢 existe | `v=spf1 include:amazonses.com ~all` |
| **MX del return-path** | 🟢 existe | `10 feedback-smtp.sa-east-1.amazonses.com` |
| **DKIM** — selector **`resend`** | 🟢 existe, en la **RAÍZ** | clave RSA 1024, arriba completa |
| **DMARC** | 🟡 **existe pero sin dientes** | `v=DMARC1; p=none;` |
| MX raíz `epetplace.com` | (vacío) | el dominio no recibe correo |
| Residuo de `avisos.epetplace.com` | 🟢 **CERO** | TXT, MX y CNAME vacíos, y su `_domainkey` también |

**Selectores DKIM que Resend declara para el dominio: uno solo, `resend`, y vive
en la RAÍZ** (`resend._domainkey.epetplace.com`). No hay DKIM bajo `send.` y no
hace falta: la firma es `d=epetplace.com`.

### Lectura — y por qué el SPF vacío NO es la catástrofe que parece

Este es el montaje **normal y correcto** de Resend: el dominio registrado es la
raíz, y Resend crea `send.<dominio>` como **return-path** con su propio SPF y su
MX de rebotes. **SPF se evalúa contra el return-path, no contra el `From:` que ve
la persona** ⇒ SPF pasa por `send.epetplace.com`. Y **DKIM firma con
`d=epetplace.com`, que alinea con el `From: hola@epetplace.com`** ⇒ **DMARC pasa
por la pata DKIM.** *El correo está autenticado.*

**Lo que sí queda flojo, y son dos cosas distintas:**

1. **La raíz no declara SPF.** Hoy no rompe nada porque nadie manda con
   return-path `@epetplace.com`. Pero **el dominio no dice quién puede mandar en
   su nombre**, y eso es una puerta abierta a suplantación por la pata SPF.
2. **DMARC está en `p=none` y sin `rua`.** `p=none` es *«mirá y no hagas
   nada»* — pero **sin `rua` nadie está mirando**. *Un monitoreo sin destinatario
   de reportes no es monitoreo: es un registro que da la sensación de que
   alguien vigila.*

### Propuesta — **NO CARGADA, es del founder**

**No falta DMARC: falta que sirva.** Dos valores, en este orden y con semanas de
por medio:

**① Ahora — encender los reportes sin cambiar el trato del correo (riesgo cero):**
```
_dmarc.epetplace.com  TXT  "v=DMARC1; p=none; rua=mailto:dmarc@epetplace.com; fo=1"
```

**② SPF de la raíz, declarativo y cerrado (nadie manda desde la raíz hoy):**
```
epetplace.com  TXT  "v=spf1 include:amazonses.com -all"
```

**③ Solo DESPUÉS de leer reportes reales unas semanas:** subir a
`p=quarantine; pct=10` y escalar.

> ⚠️ **El orden no es prolijidad: `p=quarantine` sin haber leído reportes antes
> puede mandar a spam correo legítimo que nadie sabía que existía** — y el primero
> en caer sería justo el de recuperar la clave. **Ninguno de los tres se carga acá.**

---

## C · LAS SEIS PLANTILLAS DE AUTH — TAL COMO ESTÁN HOY

Leídas del objeto por la Management API (`/v1/projects/{ref}/config/auth`), no del
dashboard.

| # | Plantilla | Idioma **asunto** | Idioma **cuerpo** | ¿Marca ajena? | Destino |
|---|---|---|---|---|---|
| 1 | **Confirm signup** | 🔴 inglés · `Confirm Your Signup` | 🔴 **inglés, de fábrica** | sin la palabra «Supabase», pero es el texto de fábrica | `{{ .ConfirmationURL }}` |
| 2 | **Invite user** | 🔴 inglés · `You have been invited` | 🔴 **inglés, de fábrica** | ídem | `{{ .ConfirmationURL }}` |
| 3 | **Magic link** | 🔴 inglés · `Your Magic Link` | 🔴 **inglés, de fábrica** | ídem | `{{ .ConfirmationURL }}` |
| 4 | **Change email** | 🔴 inglés · `Confirm Email Change` | 🔴 **inglés, de fábrica** | ídem | `{{ .ConfirmationURL }}` |
| 5 | **Reset password** | 🟠 **inglés** · `Reset Your Password` | 🟢 **ESPAÑOL, escrito por nosotros** | **no** | **NINGUNO — no lleva enlace: lleva `{{ .Token }}`** |
| 6 | **Reauthentication** | 🔴 inglés · `Confirm Reauthentication` | 🔴 **inglés, de fábrica** | ídem | `{{ .Token }}` |

**Ninguna de las seis contiene la palabra «Supabase»** — verificado sobre los
cuerpos. La marca ajena de D-628 **era el REMITENTE, y ya no existe**: hoy sale
`e-PetPlace <hola@epetplace.com>`.

**El cuerpo de la única traducida, verbatim:**
```html
<div lang="es" style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
  <h2>Restablece tu contraseña</h2>
  <p>Usa este código en la app para crear una contraseña nueva:</p>
  <p style="font-size: 32px; …">{{ .Token }}</p>
  <p>El código vence pronto. Si no pediste este cambio, ignora este correo — tu contraseña sigue igual.</p>
  <p style="color: #666; font-size: 13px;">Nadie de e-PetPlace te va a pedir este código.</p>
</div>
```

### A dónde apunta `{{ .ConfirmationURL }}` — medido punta a punta

`ConfirmationURL` = `https://zyltipqscdsdsxnjclhp.supabase.co/auth/v1/verify?…&redirect_to={site_url}`, y:

| Config | Valor |
|---|---|
| `site_url` | **`https://epetplace.com`** |
| `uri_allow_list` | `e-petplace-v2.vercel.app/**`, `localhost:5173/**`, `e-petplace-admin-git-main-…vercel.app/**`, `e-petplace-prestadores.vercel.app/**` |

**Y qué hay hoy en ese destino, medido con `curl`:** `https://epetplace.com` →
301 → `https://www.epetplace.com/` → **HTTP 200**, título
`e-PetPlace — El ecosistema del cuidado de tu mascota`. **Es la landing.** Cero
menciones del portal viejo en el HTML.

> ⇒ **La enmienda S85 de D-628 —*«el link redirige al PORTAL DE PRESTADORES
> ANTIGUO»*— también está vencida.** El `site_url` cambió y nadie volvió a la
> ficha.

### Tres cosas más que aparecieron y no estaban en la orden

- **`mailer_autoconfirm = true`** ⇒ **la plantilla #1 «Confirm signup» no se
  envía nunca.** *Traducirla sería trabajo sobre un correo que no existe* — y
  por eso conviene saberlo antes de repartir el trabajo de traducción, no después.
- **`mailer_otp_length = 8` · `mailer_otp_exp = 3600`** (código de 8 dígitos,
  vence en 1 hora). La plantilla dice *«vence pronto»*, que con una hora es
  vago pero no falso.
- **`uri_allow_list` no contiene ningún esquema de app** (`epetplace://` o
  similar) **ni el propio `epetplace.com`.** Hoy no molesta porque el único
  camino vivo es por código; **el día que algo quiera abrir la app desde un
  correo, esa lista lo rebota.**

---

## D · LA PRUEBA REAL — LO EJECUTADO, LO MEDIDO, Y EL FRENO

### Lo ejecutado

| Acto | Dato |
|---|---|
| `POST /auth/v1/recover` a `guillo381+8@gmail.com` | **2026-08-23 15:36:44 UTC** |
| Respuesta | **HTTP 200**, cuerpo `{}` |
| Registro en `auth.audit_log_entries` | **`user_recovery_requested`**, actor `guillo381+8@gmail.com`, **15:36:45.82 UTC** |

**Y el 200 no es un verde flojo acá, y conviene decir por qué:** la propia ficha
del canon midió que **cuando Resend rechaza el envío, Supabase devuelve `500`**
(fue así el día que el dominio `avisos.epetplace.com` estaba borrado y la config
seguía apuntando ahí). ⇒ **un `200` prueba que Resend ACEPTÓ el mensaje.** Salió.

*(Y esquivé la trampa que esa misma ficha declara: `/auth/v1/recover` devuelve
200 también para direcciones sin cuenta. Por eso usé una cuenta real y crucé
contra el audit log, que solo escribe si el usuario existe.)*

### Lo medido sin la bandeja

| Pregunta de la orden | Respuesta | Cómo lo sé |
|---|---|---|
| **Remitente** | **`e-PetPlace <hola@epetplace.com>`** | config viva (`smtp_sender_name` + `smtp_admin_email`) |
| **¿A qué URL lleva el enlace?** | **NO HAY ENLACE.** El correo de recuperación lleva un **código de 8 dígitos** (`{{ .Token }}`) y ningún link | plantilla viva |
| Autenticación del correo | DKIM alineado con el `From` ⇒ **DMARC pasa** | DNS medido en B |

> **La última pregunta de la orden —«a qué URL lleva el enlace al abrirlo desde
> el TELÉFONO»— no tiene respuesta porque no tiene objeto: ese correo dejó de
> traer un enlace.** Es la cura de D-628 hecha, no un hueco de medición.

### 🔴 EL FRENO, DECLARADO Y NO MAQUILLADO

**No pude leer la bandeja, así que NO puedo decir si cayó en inbox o en spam.**
Las dos vías estaban cerradas y las dos las verifiqué antes de rendirme:

1. **Gmail** — la extensión de Chrome **no está conectada** a esta sesión
   (`Browser extension is not connected`).
2. **Resend** — la Management API devuelve `smtp_pass` **hasheado** (64 hex, no
   empieza con `re_`) ⇒ **no hay key con la que consultar la API de Resend.**

**Lo que NO hice: inferir el resultado.** *Decir «seguro llegó bien» porque la
autenticación está en orden sería exactamente el verde flojo que esta casa cobra
caro, y es el mismo modo de falla que dejó D-628 abierta un mes: dar por sabido
lo que vive del otro lado del correo.*

**Cómo se cierra, en orden de costo (cualquiera alcanza):**
- El founder abre Gmail y reporta **tres cosas**: remitente que muestra, bandeja
  o spam, y si el cuerpo llegó en español. **El correo ya está en la bandeja
  desde las 15:36 UTC.**
- O pasa la **API key de Resend** (`re_…`) y lo mido yo por API.
- O conecta la extensión de Chrome y lo leo.

---

## E · LOS DOS TEXTOS PEDIDOS — ARCHIVO Y LÍNEA

| Ficha | Archivo | Línea |
|---|---|---|
| **D-628** | `docs/DEUDAS_CANONICAS.md` | **5345** (título) · **5379** (enmienda S85) · **5373** (su lápida) |
| **D-884** | `docs/DEUDAS_CANONICAS.md` | **20228** |

### D-628 — título verbatim y el estado real

> `#### D-628 — EL CORREO DE RECUPERACIÓN LLEGA EN INGLÉS Y DE UN REMITENTE AJENO 🟠`

La ficha declara (línea 5410): *«LA CURA ES DE S86, ENTERA — hoy no se cura nada:
plantilla con el token del código + redirect al destino correcto + SMTP propio.
Las tres son config remota.»*

**Las tres están hechas, medidas hoy:**

| Cura que la ficha declara pendiente | Estado medido |
|---|---|
| Plantilla con el token del código | 🟢 **hecha** — `{{ .Token }}`, en español |
| Redirect al destino correcto | 🟢 **hecha** — `site_url = https://epetplace.com` → la landing, HTTP 200 |
| SMTP propio | 🟢 **hecha** — Resend, `hola@epetplace.com` |

**Lo que queda vivo es el residuo, y es literal:**

```
apps/cliente/src/i18n/es.ts:1735
apps/prestador/src/i18n/es.ts:778
  avisoCorreo: 'El correo puede llegar en inglés y desde una dirección que no
                es la nuestra. Si no lo ves, revisa spam.'
```

**Esa cadena hoy es falsa en dos de sus tres afirmaciones:** el cuerpo llega en
español y la dirección **sí** es la nuestra. Lo único que sobrevive es el
**asunto en inglés** (`Reset Your Password`) y el consejo del spam.

*(La misma disculpa está citada en el comentario de
`packages/api/src/wrappers/seguridad.ts:269`, que también envejeció.)*

### D-884 — título verbatim, y medido contra el objeto

> `### D-884 🟡 · EL AVISO DE LA RECURRENCIA OFRECÍA SALTAR Y MOVER, Y NINGUNA DE LAS DOS EXISTE`

**No me quedé en la ficha: leí el cuerpo VIVO de `avisar_recurrencias_proximas`
en la base** (`L-166`), y el texto que manda hoy es:

```
'puede', 'cancelar'
```

**El síntoma está curado en producción.** En el repo vive en
`supabase/migrations/20260822240000_s103_el_reloj_del_recurrente.sql:102`, con su
cinturón en `:188-192` — que **aborta la migración si el aviso vuelve a decir
`saltar` o `mover`**.

**Lo que queda abierto es de PRODUCTO, no de código:** si saltar y mover se
construyen. Ninguna de las dos tiene firma. Y la ficha deja una precisión medida
que conviene no «corregir» mal: `alternar_recurrencia` es un **toggle** de
`activo` ⇒ el motor **pausa**, aunque la palabra dictada por la mesa sea
«cancelar».

---

## ⓾ LO QUE ESTA MEDICIÓN DEJA SERVIDO (sin ejecutar nada)

| # | Qué | Dueño | Costo |
|---|---|---|---|
| 1 | **Abrir la app del prestador** para que su token reviva | founder | un toque |
| 2 | **Leer la bandeja** y cerrar el freno de D | founder | un minuto |
| 3 | **Matar `avisoCorreo`** en las dos apps — o reescribirla a lo único cierto (asunto en inglés + spam) | pista de cliente | dos líneas |
| 4 | **Cerrar o degradar D-628** con esta medición adentro | conductora | una ficha |
| 5 | **Traducir asunto+cuerpo de las 5 plantillas de fábrica** — sabiendo que **«Confirm signup» no se envía** (`mailer_autoconfirm=true`) | founder (config remota) | dashboard |
| 6 | **`rua` en el DMARC** para que el monitoreo tenga a alguien mirando | founder (DNS) | un registro |
| 7 | **SPF en la raíz** | founder (DNS) | un registro |

---

## ⓫ NOTA DE MÉTODO — DOS ERRORES PROPIOS, LOS DOS CAZADOS ANTES DE REPORTAR

1. **Busqué `registrarPushToken` y no existe: se llama `registrarTokenDeAparato`.**
   Mi primer grep dio **cero llamadores en las apps** y estuve a un paso de
   reportar un *motor sin puerta* (`L-318`) que **no existe**. La puerta está y
   está cableada. *El nombre se mide, no se adivina* — y un grep con el nombre
   equivocado no devuelve «no hay»: devuelve vacío, que se lee igual.
2. **Creé el worktree con ruta relativa y aterrizó adentro del repo principal.**
   Lo verifiqué con `ls`, lo removí y lo rehíce con ruta absoluta. `main` quedó
   limpio, verificado con `git status --porcelain` en cero.

**Y una tercera de método, que es la que ordena el reporte entero:** la orden
traía una premisa falsa sobre el SMTP y **el founder la corrigió antes de que yo
midiera**. Si no lo hubiera hecho, este reporte habría medido las plantillas
correctas contra un remitente equivocado y habría «confirmado» D-628 tal como
está. **La corrección no fue un detalle: cambió la conclusión.**
