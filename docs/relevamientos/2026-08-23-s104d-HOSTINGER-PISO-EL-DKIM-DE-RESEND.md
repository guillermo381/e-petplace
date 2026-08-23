# 🟠 S104-D · EL ALTA DE CORREO EN HOSTINGER BORRÓ EL DKIM DE RESEND

**23-ago-2026, 22:53 UTC · pista D.** **DMARC NO CARGADO** — la orden del founder
decía *«si algo se pisó, reportá antes de tocar»*, y **algo se pisó.**

> **La advertencia del founder era correcta y se cumplió.** *Y conviene decirlo
> al derecho: esto no se encontró por sospecha ni por un gate — se encontró
> porque él pidió que se verificara antes de cargar. Sin esa línea en la orden,
> yo habría cargado el DMARC y me habría ido.*

---

## ① LA CONDICIÓN DE CARGA: CUMPLIDA

| Vía | `MX epetplace.com` |
|---|---|
| **ns1** (autoritativo) | `5 mx1.hostinger.com` · `10 mx2.hostinger.com` |
| **ns2** (autoritativo) | idéntico |
| `8.8.8.8` | idéntico |
| Control positivo (`gmail.com`) | responde ✓ — el instrumento mide bien |

**El apex ya recibe correo.** Con la confirmación de recepción del founder por
correo de prueba, **`L-412` queda satisfecha**: la dirección se vio recibir.

---

## ② 🟠 LO QUE SE PISÓ — MEDIDO POR CINCO VÍAS

**`resend._domainkey.epetplace.com` YA NO EXISTE.**

| Vía | Resultado |
|---|---|
| **ns1 autoritativo** | **NODATA** (contesta SOA en autoridad) |
| **ns2 autoritativo** | vacío |
| `8.8.8.8` | vacío |
| `1.1.1.1` | vacío |
| como `CNAME` | vacío |

*Los resolvers públicos tampoco lo tienen ⇒ **no es propagación pendiente: el
registro se borró** y su TTL de 360 s ya venció.*

**Y el control positivo está adentro de la misma medición:** la misma consulta,
al mismo servidor, **sí encontró tres `_domainkey`** — los que Hostinger acaba de
crear:

```
hostingermail-a._domainkey → CNAME hostingermail-a.dkim.mail.hostinger.com.
hostingermail-b._domainkey → CNAME hostingermail-b.dkim.mail.hostinger.com.
hostingermail-c._domainkey → CNAME hostingermail-c.dkim.mail.hostinger.com.
```

⇒ **El instrumento lee `_domainkey` perfectamente. El de Resend no está porque no
está.** *Hostinger no «falló al escribir»: escribió los suyos y se llevó el ajeno.*

### Lo que SÍ sobrevivió (verificado uno por uno)

| Registro | Estado |
|---|---|
| `send.epetplace.com` TXT (SPF del return-path) | 🟢 **intacto** — `v=spf1 include:amazonses.com ~all` |
| `send.epetplace.com` MX (rebotes) | 🟢 **intacto** — `feedback-smtp.sa-east-1.amazonses.com` |
| `_dmarc` | 🟢 vivo — `v=DMARC1; p=none` *(perdió el `;` final; cosmético, sigue siendo válido)* |
| **SPF del apex** | 🆕 **NUEVO** — `v=spf1 include:_spf.mail.hostinger.com ~all`. *Antes no existía; ahora existe y autoriza a Hostinger. No autoriza a Resend, y no hace falta: nuestro correo sale con return-path en `send.`* |

**De los cuatro registros de Resend, se perdió UNO. Es el que firma.**

---

## ③ LA CONSECUENCIA — MEDIDA, NO TEORIZADA

**Lo primero que hice fue preguntarle al camino real si todavía funciona:**

| Prueba | Resultado |
|---|---|
| `POST /auth/v1/recover`, 22:53 UTC | **HTTP 200** |

⇒ **Resend SIGUE ACEPTANDO el envío. Nada está caído ahora mismo.** *Un 500 habría
significado que el dominio ya cayó; el 200 dice que no.*

### Severidad honesta: 🟠, no 🔴 — y por qué

**El correo NO va a ser rechazado, y la razón importa para no exagerar:** DMARC
pasa si alinea **SPF *o* DKIM**. El return-path es `send.epetplace.com` y el
`From` es `hola@epetplace.com`: en alineación **relajada** —la que rige por
defecto— comparten dominio organizativo ⇒ **SPF alinea y DMARC PASA igual.**

**Pero se perdieron tres cosas que sí importan:**

1. **La firma no se puede verificar.** Resend sigue firmando con `s=resend`, y
   quien recibe **no encuentra la clave pública** ⇒ DKIM da fallo. Correo que
   antes llegaba firmado ahora llega sin firma verificable — **mala señal de
   reputación justo en el buzón que importa.**
2. **🔴 El reenvío que se acaba de montar queda expuesto.** *Al reenviar, SPF se
   rompe siempre —el que reenvía no está autorizado por el dominio original— y lo
   único que sobrevive un reenvío es **DKIM**.* Sin DKIM, **el correo reenviado
   pierde sus dos patas.** Es una ironía exacta: **la misma acción que creó el
   reenvío rompió lo único que hace que un reenvío sobreviva.**
3. **Resend puede des-verificar el dominio en su próxima revisión** y, si lo
   hace, **dejar de enviar**. No lo puedo medir —no tengo su API key— pero es el
   riesgo con la mecha más corta: **el correo de recuperación es hoy el ÚNICO
   correo de auth que la casa manda de verdad**, y es el camino de vuelta del login.

---

## ④ LA CURA — EL VALOR EXACTO, PORQUE LO MEDÍ ANTES DE QUE LO BORRARAN

*Lo tengo por casualidad afortunada: quedó capturado en la medición de las 15:30
de hoy, horas antes del alta de correo. **Sin esa captura habría que pedírselo a
Resend.***

| Campo | Valor |
|---|---|
| **Tipo** | `TXT` |
| **Nombre / Host** | `resend._domainkey` &nbsp;*(completo: `resend._domainkey.epetplace.com`)* |
| **TTL** | el que ofrezca por defecto |

**Valor, en una sola línea, sin comillas y sin espacios:**

```
p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC8ISIFguIdpxW0J8CbPxP5Yiv7H18qpkV4DC/02GfNzRmqTOKMMTgkV6EtnfHEM8VwgKveX0EKMCo0IysQhNnnzodxOvZ1n84xHrVoR1rQb1lELmR1epCHPv+HUjKjBE8CDpq0fYE732qpmvEUU1DvU/+7r/h3CyCb0zP3O/TVmwIDAQAB
```

*Es exactamente lo que estaba publicado (clave RSA de 1024 bits, completa). Va
tal cual — sin `v=DKIM1;` adelante, porque así estaba y así lo emite Resend.*

⚠️ **Y una comprobación que conviene hacer en el panel mientras se agrega:** ver
si Hostinger dejó el dominio en modo *«yo administro tu correo»* — algunos
paneles **vuelven a barrer los registros ajenos** cada vez que se toca la
configuración de correo. *Si vuelve a desaparecer después de agregarlo, la causa
no es el valor: es que algo lo está reescribiendo.*

---

## ⑤ EL ORDEN, Y POR QUÉ NO CARGUÉ EL DMARC

**No cargué nada.** La orden decía reportar antes de tocar si algo se había
pisado. **Además, el orden correcto no es el que traía la tanda:**

1. **Restaurar el DKIM** ← esto primero, y es del founder (panel de Hostinger)
2. **Verificar que volvió** — `dig TXT resend._domainkey.epetplace.com` contra el
   autoritativo. *Yo lo corro y lo confirmo contra el objeto.*
3. **Recién ahí cargar el DMARC.**

**El porqué del orden, y no es prolijidad:** el DMARC con `rua` va a empezar a
recolectar reportes. **Si se enciende con el DKIM roto, los primeros reportes van
a venir llenos de fallos de DKIM** — y alguien que los lea sin este contexto va a
diagnosticar un problema de Resend que en realidad es un registro borrado.
*Encender el instrumento mientras el paciente está roto produce una medición que
después hay que desmentir.*

**El valor del DMARC sigue firme y listo para cargar apenas vuelva el DKIM:**

```
v=DMARC1; p=none; rua=mailto:privacidad@epetplace.com; fo=1
```

*Y ya no hace falta la variante de digest: `privacidad@` recibe, confirmado por
el founder con correo de prueba. **`L-412` satisfecha.***

---

## ⑥ RESUMEN

| # | Cosa | Estado |
|---|---|---|
| 1 | MX del apex | 🟢 **existe** — condición de carga cumplida |
| 2 | `privacidad@` recibe | 🟢 confirmado por el founder (`L-412` ✓) |
| 3 | **DKIM de Resend** | 🟠 **BORRADO** — valor exacto servido arriba |
| 4 | SPF y MX de `send.` | 🟢 intactos |
| 5 | Envío de correo | 🟢 **funciona** (HTTP 200, 22:53 UTC) |
| 6 | DMARC | ⬜ **NO cargado** — espera el paso 3 |

**Cero cambios en DNS y cero cambios en config hechos por esta pista en este
turno.** *Lo único que se ejecutó fue un `recover` de prueba contra la cuenta del
founder, para medir si el envío seguía vivo.*
