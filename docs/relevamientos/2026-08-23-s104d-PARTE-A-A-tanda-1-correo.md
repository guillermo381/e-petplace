# S104-D · PARTE PARA A — TANDA 1 DEL CORREO, EJECUTADA

**23-ago-2026 · pista D.** Para el acta de la tanda. Todo lo de abajo está
**aplicado y verificado contra el objeto**, no contra el eco del PATCH.

**Territorio tocado: config remota de Auth (Management API). Cero código, cero
migraciones, cero deploys, cero DNS.** El árbol del repo solo gana documentos.

---

## ① LO APLICADO — 5 asuntos + 4 cuerpos

| Plantilla | Asunto | Cuerpo |
|---|---|---|
| **Reset password** | 🔄 **`Tu código para restablecer la contraseña`** | **intacto** — ya estaba en español y no se tocó |
| **Invite user** | 🔄 `Te invitaron a e-PetPlace` | 🔄 traducido |
| **Magic link** | 🔄 `Tu enlace para entrar a e-PetPlace` | 🔄 traducido |
| **Change email** | 🔄 `Confirma tu correo nuevo` | 🔄 traducido |
| **Reauthentication** | 🔄 `Tu código para confirmar` | 🔄 traducido |
| **Confirm signup** | ⬜ **NO SE TOCÓ** | ⬜ **NO SE TOCÓ** — `mailer_autoconfirm=true` la apaga |

**Verificación, tres controles, los tres verdes:**

- Los 9 campos re-leídos **del objeto** coinciden byte a byte con lo enviado.
- **Confirm signup intacto** y **el cuerpo de recovery intacto** (solo su asunto cambió).
- **SMTP sin tocar**: `smtp.resend.com` · `hola@epetplace.com`.

**Camino real:** `POST /auth/v1/recover` a las **18:44:03 UTC** → **HTTP 200**.
*Una plantilla Go malformada hace que GoTrue devuelva 500; el 200 prueba que
compiló y que Resend aceptó el mensaje con el asunto nuevo.*

**Reversa escrita ANTES de aplicar:**
`docs/relevamientos/2026-08-23-s104d-REVERSA-plantillas-auth.json` — los 12
campos (6 asuntos + 6 cuerpos) con su valor exacto de antes. Se revierte con un
`PATCH` de ese JSON.

### La casa que se siguió

Se copió la de la plantilla de recovery que ya funcionaba con Resend: el mismo
`<div lang="es" … max-width: 480px>`, el mismo bloque de código
(`font-size: 32px; letter-spacing: 6px`), la misma línea de tranquilidad
(*«si no pediste esto, ignora este correo — …»*) y el mismo pie gris
(*«Nadie de e-PetPlace te va a pedir este código/enlace»*). Los enlaces usan un
botón en **tinta `#221E19`**, que es el token de la casa.

**Voz: tuteo neutro**, verificado por control automático — cero voseo, igual que
la de recovery. Y las variables Go quedaron intactas, verificadas una por una:
`{{ .ConfirmationURL }}` · `{{ .Email }}` · `{{ .NewEmail }}` · `{{ .Token }}`.

### ⚠️ Lo que hay que saber antes de anotarlo como victoria

**Ninguna de las cuatro ha disparado NUNCA.** Medido en `auth.audit_log_entries`
sobre toda la historia del proyecto:

| Acción | veces |
|---|---|
| `user_invited` | **0** |
| `magiclink_requested` | **0** |
| `user_email_change_requested` | **0** |
| `user_reauthenticate_requested` | **0** |
| `user_confirmation_requested` | **0** (coherente con `autoconfirm=true`) |
| `user_recovery_requested` | 20 |

⇒ **La traducción es PREVENTIVA, no correctiva.** El único correo de auth que
esta casa manda de verdad es el de recuperación, y ése ya estaba en español.
*Se hace igual porque cuesta nada y evita que el día que alguna se encienda
salga en inglés — pero el acta no debería contarlo como un defecto que se curó
para nadie: se cerró una puerta antes de que se usara.*

---

## ② DMARC — EL VALOR EXACTO PARA EL FOUNDER · **NO CARGADO**

Se carga **donde se cargó el de hoy** (el registro `_dmarc` ya existe con
`v=DMARC1; p=none;`): es **editar ese mismo TXT**, no crear uno nuevo.

| Campo | Valor |
|---|---|
| **Tipo** | `TXT` |
| **Nombre / Host** | `_dmarc` &nbsp;*(si el panel pide el nombre completo: `_dmarc.epetplace.com`)* |
| **Valor** | ver abajo, en una sola línea |
| **TTL** | el que ofrezca por defecto |

**El valor, para copiar tal cual:**

```
v=DMARC1; p=none; rua=mailto:privacidad@epetplace.com; fo=1
```

**Qué cambia y qué no:** `p=none` **se conserva** — el trato del correo **no se
toca**, nada empieza a ir a spam. Lo único que se agrega es que Meta, Google y
el resto **manden su reporte diario** a esa dirección. `fo=1` pide que también
reporten los fallos parciales, que es lo que sirve para diagnosticar.

*Como `privacidad@epetplace.com` es del **mismo dominio** que el DMARC, no hace
falta ningún registro de autorización extra (el `_report._dmarc` solo se exige
cuando los reportes van a otro dominio).*

### 🔴 EL FRENO, Y ES LA RAZÓN POR LA QUE ESTO NO SE CARGÓ SOLO

**`epetplace.com` no puede RECIBIR correo hoy.** Medido:

```
$ dig MX epetplace.com +noall +answer
                        ← SIN NINGUNA RESPUESTA
$ dig +short A epetplace.com
76.76.21.21             ← Vercel, que no es un servidor de correo
```

**Sin MX, `privacidad@epetplace.com` no existe como buzón** y los reportes de
DMARC **rebotan al vacío**. *Cargar el registro igual dejaría exactamente el
problema que el registro venía a resolver: la sensación de que alguien está
mirando cuando no hay nadie del otro lado.*

**Y esto no toca solo al DMARC — toca el producto:** el remitente de todos
nuestros correos es `hola@epetplace.com`, **y esa dirección tampoco puede
recibir**. Quien conteste un correo de e-PetPlace le está contestando a un buzón
que no existe.

**⇒ El orden que propongo, y es del founder:** primero el buzón (Google
Workspace, o el inbound de Resend, o un forward del registrador a un Gmail —
cualquiera sirve), **después** el registro. **Ninguno de los dos actos lo hace
esta pista.**

---

## ③ DOS COSAS QUE NO BUSQUÉ Y APARECIERON MIDIENDO

### 🟢 El ciclo de recuperación se completó de punta a punta HOY, y no lo corrí yo

`auth.audit_log_entries`, cuenta `satorilatam@gmail.com`:

```
17:04:46  user_recovery_requested
17:05:20  login                     ← 34 segundos después
17:05:31  user_updated_password
```

**Eso cierra empíricamente el freno que dejé abierto ayer** (no pude leer la
bandeja). Y lo cierra mejor que leyéndola:

- **El correo llegó y llegó a la BANDEJA, no a spam.** *Nadie encuentra un mail
  en spam en 34 segundos.*
- **El código sirvió** y la clave se cambió.
- **Y contesta la pregunta que `D-628` dejó abierta desde S85** — su propio
  texto decía *«todavía no se sabe si `verifyOtp` funciona: no se pudo probar,
  porque nunca llegó un código que canjear»*. **Ya llegó y ya se canjeó.**

⇒ **`D-628` no tiene nada vivo del lado del correo.** Lo único que queda es el
residuo en las apps (`avisoCorreo`, ya reportado), y ahora **es falso en sus
tres afirmaciones**: no llega en inglés, no viene de una dirección ajena, y no
cayó en spam.

### 🟠 El token de push del prestador SIGUE apagado

| cuenta | activo | último uso |
|---|---|---|
| `guillo381+8` (cliente) | `true` | **hoy 16:07** ← se movió, la sincronización funciona |
| `guillo381+demovet` (prestador) | **`false`** | 16-ago |

Hubo `token_refreshed` de demovet a las 18:22, **pero eso es refresh de sesión,
no apertura de la pantalla que sincroniza.** *Mi predicción de ayer —que revive
solo al abrir la app del prestador— **sigue sin verificarse**, y lo digo así en
vez de darla por cumplida.*

---

## ④ PARA EL ACTA — RESUMEN EN UNA LÍNEA POR ÍTEM

| # | Ítem | Estado |
|---|---|---|
| 1 | Asunto de Reset password en español | ✅ **aplicado y verificado** |
| 2 | 4 plantillas de fábrica traducidas | ✅ **aplicado y verificado** — con la advertencia de que **ninguna ha disparado nunca** |
| 2b | Confirm signup | ⬜ **no tocada, por orden** (`autoconfirm` la apaga) |
| 3 | DMARC | 📋 **valor entregado, NO cargado** — y **frenado por falta de MX**: el buzón de destino no existe |
| 4 | Parte a A | ✅ este archivo |

**Reversa disponible:** `2026-08-23-s104d-REVERSA-plantillas-auth.json`.
**Lecturas previas de esta pista:** `2026-08-23-s104d-MEDICION-PUSH-CORREO-DNS.md`
y `2026-08-23-s104d-LECTURA-CANAL-WHATSAPP.md`.
