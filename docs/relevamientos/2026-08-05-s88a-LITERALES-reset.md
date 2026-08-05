# S88-A · LOS LITERALES DEL RESET — los diez minutos de dashboard del founder

> **El segundo acto del primer lote hablado** (aprobado por la mesa): cura la
> fuga más vieja de la lista — el correo de recuperación llega en inglés, de
> remitente ajeno, con el Site URL apuntando al portal viejo. **Tres pantallas
> del dashboard, listas para pegar.** Cierra **D-628** y la fuga de §10bis ④.
>
> Proyecto: `zyltipqscdsdsxnjclhp` → **Authentication**.

---

## ① URL Configuration — el destino deja de ser el portal viejo

**Site URL** (reemplaza lo que haya):

```
https://epetplace.com
```

**Redirect URLs:** revisá la lista y **borrá toda entrada del portal viejo**
(`*.vercel.app` o similar). *La app recupera por CÓDIGO (`verifyOtp`, S84) — no
necesita redirect; el Site URL queda como destino digno para cualquier link
residual, ahora que el dominio resuelve en Hostinger.*

## ② Email Templates → «Reset Password» — la voz nuestra, con el CÓDIGO

**Subject:**

```
Tu código para cambiar la contraseña — e-PetPlace
```

**Message body** (pegar tal cual — HTML):

```html
<html lang="es">
  <body style="font-family: sans-serif; color: #221E19; line-height: 1.5;">
    <p>Hola,</p>
    <p>Pediste cambiar tu contraseña en <strong>e-PetPlace</strong>.
       Tu código es:</p>
    <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">
      {{ .Token }}
    </p>
    <p>Escríbelo en la app para elegir una contraseña nueva.
       El código vence en una hora.</p>
    <p>Si no fuiste tú, ignora este correo — tu contraseña no cambia.
       Nadie de e-PetPlace te va a pedir este código.</p>
    <p style="color: #8a8378; font-size: 13px;">e-PetPlace ·
       Tu mascota no tiene un expediente. Tiene una vida documentada.</p>
  </body>
</html>
```

**Los porqués, para que nadie lo "mejore" mal después:**
- **`{{ .Token }}` y NO `{{ .ConfirmationURL }}`** — la app canjea el CÓDIGO
  (`verifyOtp`, el flujo de S84). Un link llevaría a una web que no es el flujo.
- **`lang="es"`** — la nota cosmética del gate: Gmail leyó «inglés» en el
  correo de prueba. La plantilla declara su idioma.
- **Tuteo neutro** (L-148): *escríbelo*, *si no fuiste tú* — jamás voseo.
- **«Nadie te va a pedir este código»** — la línea anti-phishing va en TODA
  plantilla que porte un código.

## ③ SMTP Settings — el reset sale por NUESTRA identidad

**Enable Custom SMTP** y cargar:

| campo | valor |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | **la RESEND_API_KEY** — la tenés vos; jamás por chat (L-130) |
| Sender email | `avisos@avisos.epetplace.com` |
| Sender name | `e-PetPlace` |

> **Con esto muere el remitente ajeno de D-628**: el reset sale por la MISMA
> identidad que el motor — un solo dominio de constancia, que es la regla de §7.

## ④ La verificación — dos minutos más, y es la que vale

1. En la app del prestador: **«Olvidé mi contraseña»** con un correo real tuyo.
2. El correo llega **en español, de `avisos@avisos.epetplace.com`, con el
   código grande**.
3. El código se canjea en la app y la contraseña cambia.

*Si el paso 2 llega viejo (inglés/remitente Supabase), el template no guardó o
el SMTP no aplicó — se re-mira el dashboard, no el código: el wrapper no cambió.*


---

## 5. GATE DEL RESET — resultado mixto (founder, 5-ago)

**✅ EL DASHBOARD FUNCIONA.** El correo llega **en español, de
`avisos@avisos.epetplace.com`, con el código**. ⇒ **D-628 muere y el remitente
ajeno también.** Esta mitad del arco está cerrada.

**🔴 EL FLUJO DE LA APP NO.** Dos defectos que se potencian —
ficha **[[D-659]]** con sus literales:
1. el código **se quema antes** de saber si la clave sirve;
2. el rebote de *«esa ya es tu contraseña»* se muestra como *«al menos 8
   caracteres»* — un `regex` sobre texto humano de GoTrue (`should be`).

**⇒ El arco del reset NO cierra hasta que el founder cambie una contraseña de
punta a punta con el flujo curado.** *El dashboard funcionando no es el arco:
es su primera mitad.*

### Los dos registros para el LOTE DE PLANTILLAS

- **El template de §2 queda FIRMADO COMO INTERINO** — funciona y se ve bien;
  no es el definitivo.
- **El definitivo lleva el código en TEXTO GRANDE COPIABLE**, con la nota
  **«tocá el código para copiarlo»**. *Se descarta el botón de copiar real:
  **los clientes de correo no ejecutan JS** — un botón que no copia es peor que
  no tenerlo.* (El pedido de **cajas por dígito** es de la PANTALLA, no del
  correo: va a la lámina de `recuperar.tsx`.)
