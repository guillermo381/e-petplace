# S104-D → A · EL CORREO DE AUTH CONTRASTADO CONTRA `MODELO_LOGIN`

**23-ago-2026 · pista D.** Leí `MODELO_LOGIN.md` y `RITUAL_DE_ENTRADA.md` apenas
llegaron a main (`66ad3959` en mi rama). **Cero cambios en este parte: solo el
contraste, porque la letra toca mi territorio y yo ya había tocado el correo.**

> **Por qué lo hice antes de seguir:** mi tanda 1 cambió cinco asuntos y cuatro
> cuerpos **sin haber leído esta letra** — no existía cuando me la ordenaron.
> *Construir contra letra que ya rige es el error que S94-C dejó anotado, y la
> única forma de no cometerlo es contrastar cuando la letra aparece, no cuando
> alguien se queja.* **Salieron cuatro huecos, y uno es una mina.**

---

## ⓪ PRIMERO, LO QUE A NECESITA PARA SU ACTA Y SU OTA

**🔴 Lo mío NO VIAJA EN LA OTA.** Las plantillas de Auth son **config remota del
proyecto** (Management API), no bundle. **Ya están vivas en producción para todo
el mundo desde las 18:44 UTC de hoy**, sin esperar merge ni publish.

⇒ **El acta no debería contarlas dentro de «la tanda que salió en la OTA».** Son
dos trenes distintos, como la página de pagos en Vercel de S101. *Y conviene que
quede escrito, porque el día que algo del correo salga mal nadie va a ir a
buscar la causa en un lugar donde no hubo commit.*

**Lo que sí es del repo y va en el merge:** cuatro documentos en
`docs/relevamientos/` + **la reversa de las plantillas** (`…REVERSA-plantillas-auth.json`).

---

## ① 🔴 LA LETRA PIDE ALGO QUE EL CORREO NO HACE — y choca con una orden del founder

**`MODELO_LOGIN` §2.4, verbatim:**

> «El correo dice cuánto vive el código; la pantalla también.»

**Medido en el cuerpo vivo de la plantilla de recuperación:**

> «El código **vence pronto**. Si no pediste este cambio, ignora este correo — tu
> contraseña sigue igual.»

**«Vence pronto» no dice cuánto.** Y el dato existe y está medido:
**`mailer_otp_exp = 3600` ⇒ una hora.**

### Por qué NO lo cambié, y es una tensión declarada, no una omisión

La orden de la tanda 1 dice, textual: **«Asunto de Reset password en español
(el cuerpo ya está)».** *El founder declaró ese cuerpo terminado.* La letra que
lo contradice **llegó después**. ⇒ **No toco un cuerpo que el founder dio por
cerrado apoyándome en una letra que él quizá no cruzó contra esa orden.**

**La cura es una línea y queda servida, lista para pegar** (reemplaza la frase
del vencimiento, el resto del cuerpo no se toca):

```html
<p>El código vive <strong>una hora</strong>. Si no pediste este cambio, ignora este correo — tu contraseña sigue igual.</p>
```

⚠️ **Y una costura para C, que es la otra mitad de la misma línea de la letra:**
*«la pantalla también»* ⇒ **la pantalla de código tiene que decir la MISMA hora**,
y ese número **no puede quedar escrito a mano en los dos lados**. Si el correo
dice una hora y la pantalla dice quince minutos, el que pierde es el usuario.
*Hoy el único lugar donde ese número es verdad es `mailer_otp_exp`, y ninguna de
las dos superficies lo lee.*

---

## ② 💣 LA MINA: `Confirm signup` VA A ENCENDERSE, Y HOY ESTÁ EN INGLÉS Y CON ENLACE

**`MODELO_LOGIN` §2.3, verbatim:**

> «Verificación de correo: se enciende según firma 5.5 (después del gate del SMTP
> en Gmail). El flujo: crear → **código de 8 dígitos** → adentro.»

**Estado medido de esa plantilla, hoy:**

| | |
|---|---|
| Asunto | `Confirm Your Signup` — **inglés de fábrica** |
| Cuerpo | **inglés de fábrica** |
| Variable que usa | **`{{ .ConfirmationURL }}` — un ENLACE** |
| ¿Usa `{{ .Token }}`? | **NO** |
| `mailer_autoconfirm` | `true` (por eso hoy no dispara) |

**Las dos cosas que pasan el día que se apague `autoconfirm`, y pasan juntas:**

1. **Cada persona que cree una cuenta recibe un correo en inglés** — justo el
   defecto que `D-628` pasó un mes teniendo.
2. **Peor: el flujo no funciona.** La letra describe **código de 8 dígitos** y la
   plantilla manda **un enlace**. *No es que se vea feo: es que la pantalla va a
   pedir un código que ese correo no trae.* **Es exactamente el defecto que
   `D-628` tuvo en S85** — el correo traía un link y la pantalla pedía un código.

**No la traduje porque la orden de la tanda 1 decía explícitamente que no
(«Confirm signup NO, autoconfirm la apaga»), y era correcto para HOY.** Lo que
cambió es que ahora hay letra firmada diciendo que se va a encender.

> **⇒ Pido que quede atado en el canon: apagar `mailer_autoconfirm` y arreglar
> esa plantilla son EL MISMO ACTO, no dos tareas.** Si se apaga primero, el
> registro se rompe para todos y el síntoma aparece en producción, no en un gate.
> *Es la ley de secuencia de `§0ter` aplicada al correo: la pieza antes del flip.*

**Cuando se firme, la plantilla se hace con `{{ .Token }}` y en la casa de las
otras cinco — es media hora, y no bloquea a nadie si se hace ANTES.**

---

## ③ 🟢 `Cambiar correo` — la letra pide doble confirmación y YA ESTÁ ENCENDIDA

`MODELO_LOGIN` §3 la pone en **tanda 1**: *«se construye — sobre la copia curada
+ double confirm»*.

**Medido:** `mailer_secure_email_change_enabled = **true**` ⇒ Supabase manda la
confirmación **a la dirección vieja Y a la nueva**. **La pieza de config que la
letra pide ya está.**

**Lo que A y C tienen que saber, porque cambia la pantalla y no está escrito en
la letra:** con esa bandera encendida **el cambio no se completa hasta que se
confirmen LAS DOS**. ⇒ la superficie tiene que decir *«te mandamos un correo a
tu dirección actual y otro a la nueva; confirmá los dos»*. *Si dice «revisá tu
correo nuevo», la mitad de la gente queda a mitad de camino sin entender por qué.*

**Mi plantilla traducida ya sirve para los dos destinatarios** (nombra el
`{{ .Email }}` viejo y el `{{ .NewEmail }}` nuevo, así que se lee bien la reciba
quien la reciba). **Nada que cambiar de mi lado.**

---

## ④ 🟠 `Invitación de familia` — el correo aterriza donde la letra NO quiere

`MODELO_LOGIN` §2.6 (tanda 2), verbatim:

> «El enlace/correo de invitación aterriza en una **bienvenida propia**: quién te
> invitó y a cuidar a quién — con nombre y foto de la mascota. Es la única puerta
> personalizada de la casa, y **es la que más tiene que enamorar**.»

**Hoy `{{ .ConfirmationURL }}` termina en `site_url` = `https://epetplace.com`,
que es la landing** (medido con `curl`: 301 → `www`, HTTP 200, título de la
landing). **Esa bienvenida no existe.**

**Y hay una precondición de config que conviene saber ANTES de construirla, para
que no se descubra el día del gate:** el `uri_allow_list` del proyecto es hoy

```
e-petplace-v2.vercel.app/** · localhost:5173/** · e-petplace-admin-…vercel.app/** · e-petplace-prestadores.vercel.app/**
```

**No tiene ningún esquema de app** (`epetplace://…`) **ni ninguna ruta de
`epetplace.com`.** ⇒ el día que la bienvenida viva en la app o en una ruta nueva,
**Supabase va a rebotar ese `redirect_to`** salvo que se agregue a esa lista.
**Es config remota, o sea mía: decime el destino y lo dejo habilitado antes de
que C lo necesite.**

*(La invitación de FAMILIA quizá no use la plantilla `invite` de Supabase sino el
motor propio — si es así, este punto ④ cambia de dueño y lo digo yo mismo cuando
se decida. Lo dejo escrito porque el destino y la lista de permitidos son míos
en cualquiera de los dos casos.)*

---

## ⑤ RESUMEN — QUÉ PIDO Y A QUIÉN

| # | Hallazgo | Dueño | Qué necesito |
|---|---|---|---|
| ⓪ | Lo del correo **no viaja en la OTA** | A | que el acta lo separe |
| ① | El correo no dice cuánto vive el código (§2.4) | **founder** | firma para tocar un cuerpo que él dio por cerrado — la línea está lista |
| ①b | La pantalla debe decir la MISMA hora | C | que no se escriba el número a mano en dos lados |
| ② | `Confirm signup` en inglés y con enlace, y **se va a encender** | **founder + A** | que apagar `autoconfirm` y arreglar la plantilla queden atados como UN acto |
| ③ | Doble confirmación ya encendida | C | que la pantalla diga que son DOS correos |
| ④ | La bienvenida de invitación no existe y el `redirect` no está permitido | C (pantalla) / **D** (config) | el destino, para habilitarlo antes del gate |

**Cero cambios aplicados en este parte.** Lo único vivo de mi tanda 1 sigue
siendo lo ya reportado, con su reversa en
`docs/relevamientos/2026-08-23-s104d-REVERSA-plantillas-auth.json`.
