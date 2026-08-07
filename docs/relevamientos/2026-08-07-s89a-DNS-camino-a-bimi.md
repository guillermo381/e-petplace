# S89-A · ORDEN 15 ② — EL CAMINO A BIMI: LO MEDIDO Y LOS REGISTROS EXACTOS

> **⚠️ LO PRIMERO, PARA QUE NADIE ESPERE LO QUE NO VA A PASAR: yo no puedo
> ejecutar esto.** El DNS de `epetplace.com` vive fuera del repo (nameservers
> `ns1/ns2.dns-parking.com` — panel de Hostinger). **Lo que entrego son los
> registros EXACTOS para pegar, en el orden seguro, y la medición que dice
> por qué ese orden.** Los publica el founder (o quien tenga el panel).

## 1 · LO MEDIDO HOY (7-ago-2026, contra el DNS vivo)

| registro | valor medido | lectura |
|---|---|---|
| `_dmarc.epetplace.com` | `v=DMARC1; p=none;` | existe, **en observación pura y SIN `rua`** |
| TXT del apex `epetplace.com` | **VACÍO — no hay SPF** | ver §2, importa menos de lo que parece |
| `send.epetplace.com` TXT | `v=spf1 include:amazonses.com ~all` | el subdominio de envío de Resend, correcto |
| `resend._domainkey` | clave pública presente | **DKIM vivo** — es lo que firma nuestros correos |
| MX del apex | **ninguno** | el dominio **no recibe** correo hoy |
| `default._bimi` | **no existe** | nada publicado todavía |

**El hallazgo que ordena el orden de los pasos: `p=none` SIN `rua` es ciego.**
La política no rompe nada, pero tampoco nos cuenta quién manda en nuestro
nombre. **Endurecer a `quarantine` sin haber mirado un solo reporte es
exactamente la clase de acto que rompe algo que nadie sabía que existía.**

**Y la buena noticia medida:** nuestros envíos alinean por **DKIM**
(`resend._domainkey` firma con `d=epetplace.com`), así que **endurecer DMARC
no los toca** — los 26 correos de hoy siguen entrando igual. El riesgo no
está en Resend: está en cualquier OTRO remitente que use el dominio sin que
lo sepamos (formularios web, un Google Workspace, un Mailchimp viejo). *Eso
es justamente lo que `rua` va a decir.*

## 2 · POR QUÉ LA FALTA DE SPF EN EL APEX NO ES EL PROBLEMA

DMARC pasa si alinea **SPF _o_ DKIM**. Nuestros correos alinean por DKIM.
Un SPF en el apex ayudaría a un correo enviado *desde* el apex por otra vía —
pero hoy no hay ninguna declarada. **Se puede publicar uno restrictivo cuando
los reportes digan quién manda; publicarlo ANTES, adivinando, es la forma
elegante de bloquearse a uno mismo.**

## 3 · LOS PASOS, EN ORDEN SEGURO

### PASO 1 — HOY, gratis y sin riesgo: abrir los ojos (`rua`)

Reemplazar el TXT de `_dmarc.epetplace.com` por:

```
v=DMARC1; p=none; rua=mailto:dmarc@epetplace.com; fo=1; adkim=r; aspf=r
```

*(La casilla `dmarc@epetplace.com` **no existe** — el dominio no tiene MX. O
se crea un buzón, o se usa un servicio gratuito de reportes que da una
dirección propia. **Decisión chica del founder**; sin buzón, este paso no
sirve de nada.)* **No cambia nada del correo: sigue en `p=none`.**

### PASO 2 — a los ~7-10 días: leer los reportes y endurecer

Con dos semanas de reportes en la mano se sabe **quién manda además de
Resend**. Recién ahí:

```
v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc@epetplace.com; fo=1
```

*Si algún remitente legítimo aparece en los reportes fallando, se declara en
SPF **antes** de endurecer — ese es todo el punto de esperar.*

### PASO 3 — el registro BIMI (necesita el asset de B)

```
default._bimi.epetplace.com  TXT  "v=BIMI1; l=https://<url del svg>; a="
```

El SVG **no es un SVG cualquiera**: es **SVG Tiny 1.2 Portable/Secure**
(`baseProfile="tiny-ps"`, `<title>` obligatorio, cuadrado, sin scripts, sin
referencias externas). **Pedido a B, con la letra del founder: fondo negro.**
El hosting ya existe y es nuestro: el bucket `marca-publica`
(`https://zyltipqscdsdsxnjclhp.supabase.co/storage/v1/object/public/marca-publica/<archivo>`),
mismo lugar del isotipo del correo.

### PASO 4 — el VMC: decisión de PLATA, a mesa

Certificado pago que **Gmail exige** para mostrar el logo. Su requisito duro
es **marca registrada**. Costos, emisores y si sirve una marca de Ecuador:
**informe aparte, en curso** (`2026-08-07-s89a-INVESTIGACION-bimi-vmc.md`).
**Nada se compra sin la firma del founder.**

## 4 · LO QUE HAY QUE SABER ANTES DE ILUSIONARSE

**Gmail no muestra el logo solo con BIMI: exige el VMC pagado.** Los pasos
1-3 son la precondición y valen por sí mismos (autenticación, reputación,
menos spam) — **pero la «E» naranja no se va hasta el paso 4**. Decirlo al
revés sería prometer un resultado que el DNS no puede dar.

## 5 · REGISTRADO PARA EL TREN — ORDEN 15 ①

**El CTA de los correos entra CON el mapa de destinos del push.** Hoy los
correos no llevan botón de acción **a propósito**: el destino digno todavía
no existe. Cuando el tren nativo cablee el toque-abre-dónde (mapas de C y
D), **el deep link del correo es el MISMO** — cada tipo gana su CTA («Ver la
cita», «Ver el plan») apuntando al lugar del hecho. *Un botón que abre la
app y te deja en el pasillo es peor que no tener botón.*
