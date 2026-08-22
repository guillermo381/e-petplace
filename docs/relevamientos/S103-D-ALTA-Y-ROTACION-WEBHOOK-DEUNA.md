# Alta y rotación del webhook de DeUna — procedimiento

> **De:** pista D (S103) · **22-ago-2026** · **Para:** el founder, cuando
> soporte conteste la pregunta #3 (cómo se registra la URL y sus headers).
> **Estado:** preparado. **Nada dado de alta, nada desplegado.**
> **Objetivo:** que el alta sea un trámite de diez minutos y no una sesión.

---

## §1 · LO QUE YA ESTÁ LISTO

| pieza | estado |
|---|---|
| **El secreto propio** | ✅ **generado**, 32 bytes aleatorios en hex (64 chars), en el keychain como `DEUNA_WEBHOOK_SECRET` / cuenta `epetplace`. **Nunca se imprimió** — verificado por largo y formato, no por lectura |
| **El buzón** | ✅ escrito, **no desplegado** — `supabase/functions/pagos-deuna-webhook/` |
| **La validación de dos secretos** | ✅ cableada (§4 explica por qué son dos) |
| **La URL** | ✅ fijada — §2 |

---

## §2 · LA URL DEFINITIVA

```
https://zyltipqscdsdsxnjclhp.supabase.co/functions/v1/pagos-deuna-webhook
```

Cumple los tres requisitos que la letra §2 cita del proveedor: **https**, **sin
IP**, **≤ 200 caracteres** (son 79).

🔴 **ESTA URL NO CAMBIA NUNCA MÁS.** El actuador vendrá después *sobre este
mismo endpoint* — precedente y razón: el buzón de Nuvei nació como buzón mudo y
se convirtió en actuador **sin cambiar de URL**, justamente para no volver a
pedirle al proveedor que registre nada.

⚠️ **QA y producción son despliegues distintos con secretos distintos.** Si
algún día hay proyecto de producción aparte, su URL será otra y se registra
aparte. *Una bandera compartida entre la prueba y la plata es un solo error de
configuración de distancia* — misma ley que ya rige para Nuvei.

### El header

| clave | valor |
|---|---|
| `x-epetplace-secret` | el contenido de `DEUNA_WEBHOOK_SECRET` |

Dentro de los límites del proveedor (key ≤ 50, value ≤ 100): la clave son 19
caracteres y el valor 64.

---

## §3 · ALTA — la primera vez

**Precondición:** que soporte conteste la **pregunta #3** — si el registro es
autogestión en el portal del comercio o lo hacen ellos. *No se adivina: es la
diferencia entre un formulario y un correo.*

1. **Cargar el secreto en Supabase** (lo hace el founder; el valor sale del
   keychain y no pasa por chat):
   ```bash
   # imprime el valor SOLO dentro del pipe, jamás en pantalla
   security find-generic-password -s DEUNA_WEBHOOK_SECRET -a epetplace -w \
     | xargs -I{} npx supabase secrets set DEUNA_WEBHOOK_SECRET={}
   ```
2. **Desplegar el buzón** — *con autorización del founder por tanda*:
   ```bash
   npx supabase functions deploy pagos-deuna-webhook --use-api
   ```
3. **Verificar que responde ANTES de registrarlo con el proveedor.** Un POST
   vacío tiene que devolver **200** (el buzón responde 200 a todo lo que puede
   persistir) y dejar una fila en `webhook_events` con
   `resultado = 'secreto_invalido'`:
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" -X POST \
     https://zyltipqscdsdsxnjclhp.supabase.co/functions/v1/pagos-deuna-webhook \
     -H 'Content-Type: application/json' -d '{}'
   ```
   > 🔴 **El `200` sin el secreto es correcto y NO es un agujero.** El buzón
   > persiste todo y **no mueve un solo estado** sin secreto válido *y* sin
   > consulta activa confirmada. *Un 401 haría que el proveedor reintente 3
   > veces algo que vamos a rechazar igual, y perderíamos la traza — que es
   > justamente la evidencia de un intento de fraude.*
4. **Registrar con DeUna** la URL de §2 + el header de §2.
5. **Verificar con un evento real**: consultar `webhook_events` y confirmar que
   la fila llegó con `stoken_valido = true` y `verificado=si` en el detalle.

---

## §4 · ROTACIÓN — dos pasos, sin ventana ciega

**El problema, dicho una vez:** el secreto viaja en un **header estático que se
registra del lado del proveedor**. Entre que desplegamos un valor nuevo y que
ellos lo cargan pasa un tiempo **que no controlamos**. Con un solo secreto, ese
tiempo es una ventana en la que **todo webhook legítimo se rechaza**.

Por eso el buzón acepta **dos**: `DEUNA_WEBHOOK_SECRET` (actual) y
`DEUNA_WEBHOOK_SECRET_SIGUIENTE`.

### Paso 1 — abrir la ventana (los dos valen)

```bash
NUEVO=$(openssl rand -hex 32)
security add-generic-password -U -s DEUNA_WEBHOOK_SECRET_SIGUIENTE -a epetplace -w "$NUEVO"
npx supabase secrets set DEUNA_WEBHOOK_SECRET_SIGUIENTE="$NUEVO"
unset NUEVO
npx supabase functions deploy pagos-deuna-webhook --use-api
```

Ahora **los dos secretos son válidos**. Recién acá se le pide al proveedor que
cambie el header al valor nuevo. **Mientras lo hacen, nada se rechaza.**

**Verificación antes de seguir** — que el nuevo efectivamente entre:
```sql
select resultado, count(*), max(recibido_en)
  from webhook_events
 where proveedor = 'deuna' and recibido_en > now() - interval '1 hour'
 group by 1;
```
Se espera **cero** `secreto_invalido` y eventos llegando normal.

### Paso 2 — cerrar la ventana (el viejo muere)

**Sólo cuando el paso 1 esté verificado.** El valor nuevo pasa a ser el actual
y el `_SIGUIENTE` se retira:

```bash
security find-generic-password -s DEUNA_WEBHOOK_SECRET_SIGUIENTE -a epetplace -w \
  | xargs -I{} sh -c '
      security add-generic-password -U -s DEUNA_WEBHOOK_SECRET -a epetplace -w "$1"
      npx supabase secrets set DEUNA_WEBHOOK_SECRET="$1"' _ {}
security delete-generic-password -s DEUNA_WEBHOOK_SECRET_SIGUIENTE -a epetplace
npx supabase secrets unset DEUNA_WEBHOOK_SECRET_SIGUIENTE
npx supabase functions deploy pagos-deuna-webhook --use-api
```

🔴 **EL PASO 2 NO ES OPCIONAL Y NO ES COSMÉTICO.** Dejar `_SIGUIENTE` cargado
para siempre es tener **dos llaves vivas sin razón**, y la vieja es la que
—hipótesis— se estaba rotando porque dejó de ser confiable. *Una rotación a
medias deja el sistema exactamente igual de expuesto que antes, con la
apariencia de haberse curado.*

**Verificación de cierre:** `npx supabase secrets list | grep SIGUIENTE` no
devuelve nada.

---

## §5 · CUÁNDO SE ROTA

- **Cualquier sospecha de filtración** — sin discutirlo primero.
- **Al pasar QA → producción**: producción nace con secreto propio, jamás
  heredado del de prueba.
- Cuando cambie quién tiene acceso a los secrets.
- ⚠️ **NO por calendario.** *Una rotación periódica sin motivo es un
  procedimiento que se corre con desgano y termina saltándose el paso 2.*

---

## §6 · LO QUE ESTE MECANISMO **NO** COMPRA — y por qué no alcanza solo

El secreto en header es **autenticación débil por naturaleza**: es un valor
estático que viaja en cada request. No firma el payload, así que **no prueba
que el contenido no fue alterado**, y quien lo obtenga puede fabricar webhooks
que pasen la capa ①.

**Por eso la letra §7 ordena dos capas y la segunda no es opcional:** el buzón
**pregunta al proveedor** (`payment/info`) y sólo esa respuesta verificada
alimenta al actuador. *Un webhook con el secreto correcto y datos falsos muere
en la consulta.*

⇒ **La pregunta #4 a soporte sigue abierta y vale la pena insistir:** si existe
firma HMAC del payload, la capa ① mejora sola. **La capa ② se queda igual** —
no se retira ni con HMAC, porque protege contra algo distinto.

---

## §7 · LAS DOS PREGUNTAS QUE BLOQUEAN ESTO

| # | pregunta | qué desbloquea |
|---|---|---|
| **3** | ¿Cómo se registra y rota la URL del webhook y sus headers en QA y PDN? ¿Autogestión o lo hacen ustedes? | **el alta entera (§3)** |
| **4** | ¿Existe autenticación del webhook más fuerte que headers estáticos? | mejora la capa ①; no cambia §3 |

*Hasta la #3, todo lo de este documento está listo y nada se puede ejecutar.*
