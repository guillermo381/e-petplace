# Paquete de alta del webhook DeUna — para el founder

> **De:** pista D (S103) · **22-ago-2026**
> **Qué es:** lo que hay que dar de alta o mandar a soporte, **copiable tal
> cual**. No hay que componer nada ni decidir nada.
> **Precondición:** la respuesta de soporte a **si el registro es autogestión en
> el portal del comercio o lo hacen ellos** (pregunta #3). *Esa es la única
> incógnita: el resto está listo.*
>
> 🔴 **Nada de este documento contiene un secreto.** El valor del secreto vive
> en el keychain y se copia en el momento, con el comando del §3.

---

## §1 · 📋 EL BLOQUE PARA MANDAR A SOPORTE — copiar y pegar

**Destinatario:** `support@deunamerchant.zendesk.com`
**Asunto:** `Registro de webhook de pagos exitosos — SATORI INOV LATAM S.A.S. (QA)`

```
Buenos días,

Somos SATORI INOV LATAM S.A.S. y estamos integrando el API de pagos en el
ambiente QA (apis-merchant.qa.deunalab.com).

Necesitamos registrar la URL de webhook de pagos exitosos con un header de
autenticación propio. Los datos son:

  URL:
  https://zyltipqscdsdsxnjclhp.supabase.co/functions/v1/pagos-deuna-webhook

  Header:
  Nombre : x-epetplace-secret
  Valor  : (se lo enviamos por el canal seguro que ustedes indiquen)

Aprovechamos para consultar cuatro cosas:

1) ¿El registro y la rotación de esta URL y su header son autogestionables
   desde el portal del comercio, o los realizan ustedes? Necesitamos poder
   rotar el valor del header periódicamente.

2) ¿Cuál es el pointOfSale numérico que corresponde a nuestro comercio en QA?
   Medimos que el campo es obligatorio en /merchant/v1/payment/request y que
   se valida contra la jerarquía del comercio, pero no lo encontramos en la
   documentación ni expuesto por ningún endpoint. ¿El de producción es el
   mismo o cambia?

3) ¿Existe alguna autenticación de webhook más fuerte que un header estático
   (por ejemplo firma HMAC del payload)? Preferimos usarla si está disponible.

4) ¿El ambiente QA permite simular los estados REVERSED y REVERSED_FAILED?
   Necesitamos probar esos caminos antes de salir a producción.

Quedamos atentos.
```

> 🔴 **El valor del header NO va en el correo.** Va por el canal seguro que
> ellos indiquen. *Un secreto mandado por el mismo canal donde se pide el
> registro deja de ser un secreto en el momento en que alguien reenvía el
> hilo.*

---

## §2 · SI ES AUTOGESTIÓN EN EL PORTAL — los cuatro campos

| campo del formulario | qué poner |
|---|---|
| **URL / Endpoint** | `https://zyltipqscdsdsxnjclhp.supabase.co/functions/v1/pagos-deuna-webhook` |
| **Método** | `POST` |
| **Header · nombre** | `x-epetplace-secret` |
| **Header · valor** | el contenido de `DEUNA_WEBHOOK_SECRET` — **§3 lo copia sin mostrarlo** |

Cumple los tres límites del proveedor: **https** · **sin IP** · **79 caracteres**
(el tope es 200). El nombre del header mide 19 (tope 50) y el valor 64 (tope 100).

---

## §3 · EL VALOR DEL SECRETO — al portapapeles sin verlo

```bash
security find-generic-password -s DEUNA_WEBHOOK_SECRET -a epetplace -w | tr -d '\n' | pbcopy
```

Queda en el portapapeles listo para pegar. **No se imprime en pantalla.**

Para verificar que está bien **sin mirarlo**:
```bash
security find-generic-password -s DEUNA_WEBHOOK_SECRET -a epetplace -w \
  | tr -d '\n' | wc -c        # → 64
```

⚠️ **Después de pegarlo, limpiá el portapapeles:** `pbcopy </dev/null`

---

## §4 · CARGARLO EN SUPABASE — un comando

**Sin esto el buzón rechaza todos los webhooks**, porque compara contra un
secreto vacío.

```bash
security find-generic-password -s DEUNA_WEBHOOK_SECRET -a epetplace -w \
  | tr -d '\n' | xargs -I{} npx supabase secrets set DEUNA_WEBHOOK_SECRET={}
```

Verificar (muestra un digest, jamás el valor):
```bash
npx supabase secrets list | grep DEUNA_WEBHOOK_SECRET
```

---

## §5 · EL ORDEN — importa, y por qué

1. **Cargar el secreto** (§4).
2. **Desplegar el buzón** — *pide tu autorización por tanda:*
   ```bash
   npx supabase functions deploy pagos-deuna-webhook --use-api
   ```
3. **Verificar que responde ANTES de registrarlo con DeUna:**
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" -X POST \
     https://zyltipqscdsdsxnjclhp.supabase.co/functions/v1/pagos-deuna-webhook \
     -H 'Content-Type: application/json' -d '{}'
   ```
   **Esperado: `200`.**
   > 🔴 **El `200` sin el secreto es correcto y NO es un agujero.** El buzón
   > persiste todo y **no mueve un solo estado** sin secreto válido *y* sin
   > consulta activa confirmada. *Un 401 haría que el proveedor reintente tres
   > veces algo que vamos a rechazar igual, y perderíamos la traza — que es
   > justamente la evidencia de un intento de fraude.*
4. **Recién ahí, registrar con DeUna** (§1 o §2).
5. **Verificar con el primer evento real:** la fila debe llegar con
   `stoken_valido = true` y `verificado=si` en el detalle.

> ⚠️ **Registrar antes de desplegar deja una ventana en la que DeUna llama a
> una URL que no existe.** Sus reintentos son 3, cada 30 s — se agotan rápido, y
> ese pago se resuelve después por barrido en vez de por webhook.

---

## §6 · ROTACIÓN — dos pasos, sin ventana ciega

**Por qué dos:** el secreto viaja en un **header estático registrado del lado
del proveedor**. Entre que desplegamos un valor nuevo y ellos lo cargan pasa un
tiempo **que no controlamos**. Con un solo secreto, ese tiempo es una ventana en
la que **todo webhook legítimo se rechaza**. Por eso el buzón acepta **dos a la
vez**.

### Paso 1 — abrir la ventana (los dos valen)

```bash
NUEVO=$(openssl rand -hex 32)
security add-generic-password -U -s DEUNA_WEBHOOK_SECRET_SIGUIENTE -a epetplace -w "$NUEVO"
npx supabase secrets set DEUNA_WEBHOOK_SECRET_SIGUIENTE="$NUEVO"
unset NUEVO
npx supabase functions deploy pagos-deuna-webhook --use-api
```

**Ahora los dos son válidos.** Recién acá se le pide a DeUna que cambie el
header al valor nuevo (`DEUNA_WEBHOOK_SECRET_SIGUIENTE`, copiado con el comando
del §3 cambiando el nombre). **Mientras lo hacen, nada se rechaza.**

**Verificar antes de seguir** — cero rechazos y eventos llegando:
```sql
select resultado, count(*), max(recibido_en)
  from webhook_events
 where proveedor = 'deuna' and recibido_en > now() - interval '1 hour'
 group by 1;
```

### Paso 2 — cerrar la ventana (el viejo muere)

**Sólo con el paso 1 verificado.**

```bash
security find-generic-password -s DEUNA_WEBHOOK_SECRET_SIGUIENTE -a epetplace -w \
  | tr -d '\n' | xargs -I{} sh -c '
      security add-generic-password -U -s DEUNA_WEBHOOK_SECRET -a epetplace -w "$1"
      npx supabase secrets set DEUNA_WEBHOOK_SECRET="$1"' _ {}
security delete-generic-password -s DEUNA_WEBHOOK_SECRET_SIGUIENTE -a epetplace
npx supabase secrets unset DEUNA_WEBHOOK_SECRET_SIGUIENTE
npx supabase functions deploy pagos-deuna-webhook --use-api
```

Verificación de cierre: `npx supabase secrets list | grep SIGUIENTE` → **vacío**.

> 🔴 **El paso 2 no es opcional.** Dejar `_SIGUIENTE` cargado es tener **dos
> llaves vivas sin razón**, y la vieja es la que —hipótesis— se estaba rotando
> porque dejó de ser confiable. *Una rotación a medias deja el sistema igual de
> expuesto que antes, con la apariencia de haberse curado.*

**Cuándo se rota:** ante cualquier sospecha de filtración · al pasar QA →
producción (producción nace con secreto propio, jamás heredado) · cuando cambie
quién tiene acceso a los secrets.
**NO por calendario** — *una rotación periódica sin motivo se corre con desgano
y termina saltándose el paso 2.*

---

## §7 · LO QUE ESTE PAQUETE NO CUBRE

- **El `pointOfSale`** — va en el mismo correo (§1, punto 2) pero **bloquea el
  riel entero**, no sólo el webhook.
- **Producción** — otra URL, otro secreto, credenciales PDN. Cuando exista.
- **Desplegar** — pide tu autorización por tanda. **Nada está desplegado.**
