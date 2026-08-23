# S104-D · RE-MEDICIÓN DEL MX DEL APEX — contra qué objeto, y qué se puede afirmar

**23-ago-2026, ~19:10 UTC · pista D.** Cero cambios. **DMARC NO cargado** —
espera la confirmación del founder, como se ordenó.

> **Por qué esto lleva hora:** el serial de la zona es **`2026082305`** — formato
> fecha: **editada HOY, revisión 05**. *Una medición de DNS sobre una zona que se
> está tocando tiene fecha de vencimiento; si el founder edita después de esto,
> se vuelve a medir y no se discute contra este archivo.*

---

## ① CONTRA QUÉ OBJETO MEDÍ

No contra un resolver, que es lo que hice la primera vez y era medio dato.
**Contra el autoritativo, y con tres controles.**

| Vía | Pregunta | Respuesta |
|---|---|---|
| **`ns1.dns-parking.com`** (autoritativo) | `MX epetplace.com` | **NODATA** — contesta SOA en la sección de autoridad |
| **`ns2.dns-parking.com`** (autoritativo, control independiente) | `MX epetplace.com` | **NODATA**, idéntico |
| `8.8.8.8` (Google) | `MX epetplace.com` | vacío |
| `1.1.1.1` (Cloudflare) | `MX epetplace.com` | vacío |
| resolver del sistema | `MX epetplace.com` | vacío |

**Qué significa NODATA, con precisión:** preguntar `MX` y recibir **SOA en
autoridad** es la respuesta canónica de *«este nombre existe, pero de este tipo
no hay ningún registro»*. **No es «no sé» ni «no llegué»: es una negación
autoritativa.**

### 🔍 Y el control que hace que el vacío signifique algo

*Un instrumento que no encuentra nada puede estar roto — y un vacío se lee igual
que un «no hay».* **Control positivo, mismo comando, misma máquina, mismo
minuto:**

```
gmail.com          → 5 gmail-smtp-in.l.google.com. · 20 alt2.gmail-smtp-in.l.google.com.
mx1.hostinger.com  → 172.65.182.103
```

**El instrumento SÍ ve MX cuando hay MX.** El vacío de `epetplace.com` es del
dominio, no del `dig`.

---

## ② EL ÚNICO CAMINO QUE QUEDABA, TAMBIÉN CERRADO

Sin MX, un servidor que quiere entregar correo **cae al registro `A`** (fallback
implícito, RFC 5321 §5.1). El `A` de `epetplace.com` es `76.76.21.21` (Vercel).
**Probado por conexión TCP real, no por suposición:**

| puerto | qué es | resultado |
|---|---|---|
| **25** | SMTP de entrega entre servidores | **cerrado** |
| **587** | submission | **cerrado** |
| **465** | SMTPS | **cerrado** |

⇒ **No hay ninguna ruta de entrada. Un correo a `hola@epetplace.com` desde
afuera rebota hoy.**

---

## ③ LA PREGUNTA DEL FOUNDER, CONTESTADA DERECHO

> *«verificá si hay forwarding sin MX propio (algunos registradores lo resuelven
> fuera del DNS público)»*

**Para el correo que SALE, sí existe eso. Para el que ENTRA, no puede existir —
y no es una limitación del registrador, es cómo funciona la entrega de correo.**

El que decide a dónde entregar **no es nuestro registrador: es el servidor de
quien manda** — Gmail, Outlook, Resend. Ese tercero hace una consulta de **DNS
público** y no tiene ninguna otra forma de saber a dónde ir. **No hay canal
privado entre nuestro registrador y el mundo.** Por eso todo servicio de reenvío
—Hostinger incluido, que es el que sirve esta zona— **publica sus MX**: es el
único modo de que alguien de afuera los encuentre.

*Si el reenvío estuviera activo de verdad, el MX estaría publicado y yo lo
habría visto — igual que vi el de gmail.com.*

### Las tres formas de que las dos cosas sean ciertas a la vez

| # | Reconciliación | Qué la haría probable |
|---|---|---|
| **A** | **El reenvío se configuró en el panel pero sus MX nunca quedaron aplicados** | Es lo más común cuando un dominio se apunta a Vercel después: la pantalla de reenvío sigue mostrándose configurada y **la ruta está muerta** |
| **B** | **La landing manda los leads hacia afuera, y `hola@` es solo el remitente o el «responder a»** | Encaja con *«lo montó al armar la landing de captura de leads»*: **los leads llegan** (a un Gmail), y eso se recuerda como *«hola@ recibe»* |
| **C** | Funcionó antes y una edición posterior se llevó el MX | La zona se editó **hoy, cinco veces** |

**En las tres, lo que hay que verificar es lo mismo, y no es una opinión mía.**

### El árbitro, y toma treinta segundos

**Mandale un correo a `hola@epetplace.com` desde tu teléfono y esperá dos
minutos.**

- **Rebota** («Address not found», «no mail server») ⇒ manda mi medición, y el
  reenvío hay que montarlo de verdad.
- **Llega a algún lado** ⇒ manda tu dato, **algo tengo mal**, y con el
  encabezado `Received:` de ese correo se ve exactamente por dónde entró.

*No lo pruebo yo porque no tengo forma de mandar correo desde esta sesión — y
porque un rebote lo tenés que ver vos, que es donde llegaría.*

---

## ④ CÓMO SE SUMA `privacidad@`, SEGÚN CUÁL SEA LA RESPUESTA

**Si el árbitro dice REBOTA** — entonces `hola@` tampoco recibe, y crear
`privacidad@` «por el mismo camino» **crearía una segunda dirección que tampoco
recibe**. Hay que montar el correo de entrada una vez, y ahí nacen las dos
juntas. Cualquiera sirve: el servicio de correo de Hostinger (agrega sus MX), o
Google Workspace, o el inbound de Resend.

**Si el árbitro dice LLEGA** — el `Received:` dice por dónde, se replica ese
camino para `privacidad@`, y listo. **En ese caso mi medición está incompleta y
quiero ver ese encabezado.**

> ⚠️ **Y esto no es solo del DMARC, por eso conviene resolverlo igual:** todos
> nuestros correos salen desde `hola@epetplace.com`. **Si esa dirección no
> recibe, cada persona que le conteste a un correo nuestro le está contestando a
> un buzón que no existe** — y no se entera, y nosotros tampoco.

---

## ⑤ LA SALIDA QUE DESBLOQUEA EL DMARC HOY, SIN ESPERAR AL BUZÓN

Medida, no recordada.

**Primero, lo que NO se puede** — y es la trampa obvia: apuntar el `rua` a un
Gmail. Por RFC 7489 §7.1, un `rua` hacia **otro dominio** exige que ese dominio
publique una autorización. Medido:

```
$ dig +short TXT epetplace.com._report._dmarc.gmail.com
                        ← vacío: gmail.com NO autoriza
```

⇒ **`rua=mailto:…@gmail.com` queda descartado.** Los reportes se descartarían en
silencio.

**Lo que sí se puede:** los servicios de digest publican esa autorización con
comodín, y **eso lo verifiqué**:

```
$ dig +short TXT '*._report._dmarc.dmarc.postmarkapp.com'
"v=DMARC1;"             ← la autorización existe
```

⇒ Un servicio de digest **acepta los reportes sin que `epetplace.com` tenga
ningún MX**, y manda un resumen legible a cualquier inbox, Gmail incluido.

**Los dos valores, para elegir uno. Ninguno cargado:**

**(a) Con buzón propio — el que ya te pasé, el preferido a mediano plazo:**
```
v=DMARC1; p=none; rua=mailto:privacidad@epetplace.com; fo=1
```

**(b) Sin buzón, para empezar a ver datos esta semana:**
```
v=DMARC1; p=none; rua=mailto:<el-que-te-da-el-servicio>@dmarc.postmarkapp.com; fo=1
```

*Las dos conservan `p=none`: no cambian el trato de ningún correo, solo encienden
el reporte. Y se pueden combinar con dos `mailto:` separados por coma el día que
el buzón exista.*

---

## ⑥ ESTADO — QUÉ HICE Y QUÉ NO

| | |
|---|---|
| DMARC cargado | **NO** — espera tu confirmación, como ordenaste |
| DNS tocado | **NO**, en ningún registro |
| Correo enviado a `hola@` | **NO** — no tengo cómo, y el rebote hay que verlo del lado que recibe |
| Lo que necesito para cargar | **`privacidad@` confirmada como existente** — y con el árbitro de arriba corrido, para saber si «existe» quiere decir que recibe |

**Y una condición que agrego, porque es la que evita el trabajo inútil:** que
`privacidad@` aparezca creada en un panel **no alcanza**. Lo que hay que ver es
**un correo de prueba llegando a ella**. *Cargar un `rua` hacia una dirección que
no recibe deja el registro puesto y los reportes cayéndose en silencio — que es
exactamente el estado que este registro viene a sacar.*
