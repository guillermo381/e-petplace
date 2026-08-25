# CONTRATO_APLICADOR_BARRIDO_DEUNA.md — e-PetPlace

> **De:** pista D (S103) · **23-ago-2026** · **Para:** A, que lo escribe.
> **Qué es:** el **contrato** de la pieza que falta — qué recibe, qué verifica,
> qué escribe y cómo se prueba. **No es la implementación:** el cuerpo es de
> motor y se escribe contra el objeto vivo, no contra este texto.
>
> **Por qué existe:** el inventario de circuito encontró que **el barrido de
> DeUna detecta un pago confirmado y nadie lo aplica**. El actuador exige una
> fila de `webhook_events`, y el caso que el barrido resuelve es justamente
> **el webhook que nunca llegó**.
>
> **Por qué es un documento y no un mensaje:** *un contrato que vive en un chat
> no tiene dónde ser corregido* — y esta semana eso ya nos costó dos
> traducciones incompletas.
>
> **Regla de precedencia:** si esto contradice al objeto vivo, **gana el
> objeto**, y este documento se enmienda.

---

## §1 · EL HUECO, MEDIDO

| | barrido | ¿aplica lo que encuentra? |
|---|---|---|
| **Nuvei** | llama a `resolver_consulta_activa(uuid, jsonb, text)` | ✅ |
| **DeUna** | `console.error` que **nombra el hueco** | 🔴 **nadie** |

Consecuencia: el **caso ④ de `LETRA_MOTOR_PAGOS` §6** —*«no llega ninguno»*—
**queda sin resolución para DeUna**, con la plata ya movida del lado del cliente.

---

## §2 · LO QUE LO DIFERENCIA DE `resolver_consulta_activa` — tres cosas

**No es «lo mismo con otro nombre».** Las tres diferencias son de fondo:

### ① El sujeto: recibe el INTENTO, no la compra

`resolver_consulta_activa` recibe **`p_compra_id`**. DeUna **necesita los dos
sujetos** (y hoy el CHECK ya admite cuatro — §5).

⇒ **Recibe `p_intento_id uuid`**, y de ahí sale todo: `compra_id`, `cita_id`,
`referencia_corta`, `proveedor_transaction_id`, `monto`.

> *El intento es el único objeto que conoce a los dos sujetos y al proveedor a
> la vez. Pedirle el sujeto al llamador sería obligarlo a decidir cuál es —y ése
> es exactamente el `if` que no queremos repartido por el sistema.*

### ② El crudo: es plano, y viene de `payment/info`

Nuvei anida en `transaction.*`; **DeUna es plano en la raíz**:
`status` · `amount` · `transactionId` · `transferNumber` ·
`internalTransactionReference`.

⚠️ **Y el `transferNumber` es el `authorization_code`** — `LETRA_DEUNA` §3.6 lo
exige **por nombre** en el comprobante.

🔴 **El crudo que entra tiene que ser el de `payment/info`, jamás el del
webhook.** Es §7: *el webhook es señal; sólo la respuesta verificada alimenta.*

### ③ La cita NO tiene stock que re-apartar

`resolver_consulta_activa` re-aparta stock antes de confirmar —el caso del pago
aprobado con reserva vencida—. **Una CITA no tiene stock: tiene hold de
agenda.** ⇒ ese bloque **no se copia tal cual**; la rama de cita necesita su
propia pregunta o ninguna.

*Si se copiara, se ejecutaría `reservar_stock_pedido` sobre pedidos que no
existen y el `EXCEPTION WHEN OTHERS` lo taparía como `huerfano_sin_stock` — un
diagnóstico falso sobre una cita perfectamente sana.*

---

## §3 · EL CONTRATO

```
aplicar_consulta_activa_deuna(
  p_intento_id uuid,       -- el intento, NO el sujeto
  p_crudo      jsonb,      -- la respuesta de payment/info, plana
  p_origen     text DEFAULT 'barrido'
) RETURNS jsonb
```

### Lo que verifica ANTES de aplicar, en este orden

| # | verificación | si falla |
|---|---|---|
| 1 | **Gate**: `auth.uid() IS NOT NULL AND NOT is_admin()` ⇒ rebota | `42501` — *el patrón exacto de `resolver_consulta_activa`* |
| 2 | El intento **existe** y `proveedor = 'deuna'` | error tipado |
| 3 | 🔴 **¿FANTASMA?** — §4 | `resolucion: 'fantasma'` · **no aplica nada** |
| 4 | `_pago_aprobado(p_crudo)` — su rama DeUna ya exige `APPROVED` **y** `amount > 0` | `no_aprobado` |
| 5 | **Idempotencia**: ¿el sujeto ya está pagado? | `ya_estaba_pagada` |
| 6 | 🔴 **El monto contra el DESGLOSE CONGELADO** | `monto_no_coincide` · **no aplica** |

> 🔴 **La 6 no es opcional y es la razón de ser de todo esto.** *Confirmar sin
> comparar sería creerle al proveedor un número que nosotros nunca prometimos* —
> y acá no hay webhook que ya lo haya validado.

### Cómo resuelve los dos sujetos

**Del intento, no adivinando:**

```
compra_id IS NOT NULL  → rama compra
cita_id   IS NOT NULL  → rama cita
ninguno / ambos        → 🔴 error tipado, JAMÁS un default
```

🔴 **Sin `else` que asuma.** El invariante «exactamente uno» lo garantiza en la
tabla; **la función lo verifica igual**, porque *una defensa que vive en otra
pieza no es una defensa: es una coincidencia.*

⚠️ **Y hoy el CHECK admite CUATRO sujetos** (§5): un `else` que asuma compra ya
no es una dicotomía — es una adivinanza.

---

## §4 · 🔴 QUÉ HACE SI LA CONSULTA DICE FANTASMA

**Medido (S103-D §2quater):** `payment/info` sobre algo inexistente devuelve
**`HTTP 200` · `PENDING` · `amount 0` · `date ""`**, jamás `NOT_FOUND`.

⇒ **La función tiene que reconocerlo y NO aplicar nada:**

```
status = PENDING  AND  amount = 0  AND  date = ''   →  resolucion: 'fantasma'
```

**Las tres marcas juntas**, jamás una sola: *con sólo `PENDING` estaríamos
llamando fantasma al caso más frecuente del sistema — el cliente que todavía no
pagó.*

**Qué escribe en ese caso:** el hallazgo `huerfano_deuna_vencido` en el intento,
**y nada más**. **No toca el sujeto. No emite comprobante.**

> ⚠️ **Supuesto declarado y NO medido** (`S103-D-GUION-DIA-1` paso 1): que una
> transacción **real** recién creada devuelva su `amount`. Si resultara falsa,
> **esta regla cambia** y pasa a reconocerse por tiempo. **Hasta el día 1, se
> implementa así y se sabe que está condicionada.**

---

## §5 · ⚠️ EL CUARTO SUJETO — lo que este contrato NO cubre y hay que decidir

**Medido hoy:** `chk_intento_un_solo_sujeto` ya admite **cuatro**:
`pedido_id` · `cita_id` · **`recurrencia_id`** · **`suscripcion_servicio_id`**.

**Este contrato cubre dos.** ⇒ **Decisión de A/mesa:** si el aplicador nace con
las cuatro ramas, o con dos y **fail-closed explícito** para las otras.

🔴 **Lo que NO es aceptable es un `else` que asuma**, que es la forma que hoy
tiene el actuador (§ inventario del recurrente). *Con dos sujetos era una
dicotomía correcta; con cuatro es una adivinanza que compila.*

---

## §6 · QUÉ ESCRIBE — el camino feliz

1. **El sujeto** pasa a pagado *(por su función existente, no a mano)*.
2. **El intento**: `estado='aprobado'` · `confirmado_por='consulta_activa'` ·
   `proveedor_transaction_id` · **`transfer_number`** ·
   `authorization_code` ← **el `transferNumber`** · `payload_crudo` ·
   `cerrado_en` · `hallazgo='confirmado_tardio'`.
3. **El comprobante**, con el **mismo formato que el actuador** — mismo tipo,
   mismo `sujeto_id`, misma clave `comprobante:<sujeto>`, con `concepto` y
   `ignora_techo`.

> 🔴 *La familia no tiene por qué notar si su pago se confirmó por webhook o
> porque fuimos a preguntar. **Si cada camino emite un comprobante distinto, el
> camino se le nota.***

4. **Devuelve** `{ ok, resolucion, sujeto, sujeto_id }` con `resolucion` del
   vocabulario cerrado de `hallazgo` (N4): `confirmado_tardio` ·
   `huerfano_deuna_vencido` · `monto_no_coincide` · `reverso_fallido`.

---

## §7 · 🔴 EL DISCRIMINADOR — las TRES FILAS

**Verde exige las tres. Una pantalla que diga «pagado» sin ellas se adelantó.**

```sql
-- ① el intento
select estado, confirmado_por, proveedor_transaction_id, transfer_number, hallazgo
  from pagos_intentos where id = '<intento>';
--    esperado: aprobado · consulta_activa · tx no nulo · transfer_number no nulo
--              · hallazgo = confirmado_tardio

-- ② el sujeto
select estado_reserva from evento_cita_servicio where id = '<cita>';   -- 'pagada'
--  o: select estado from compras where id = '<compra>';               -- 'pagada'

-- ③ el comprobante
select tipo, datos->>'transaction_id', datos->>'concepto'
  from notificacion_intencion
 where clave_dedup = 'comprobante:<sujeto>';
```

> ⚠️ **Y por qué NO va `webhook_events` en la lista:** *este camino existe
> precisamente porque no hubo webhook.* Exigir una fila ahí haría que el
> discriminador **nunca dé verde en el caso que vino a cubrir** — es el mismo
> error que la precondición del paso 8 tuvo hasta hoy.

### Los dos contra-casos que la prueba necesita

| caso | resultado exigido |
|---|---|
| **el fantasma REAL** (fixture `fantasma_idType_0`) | `resolucion: 'fantasma'` · **el sujeto NO se mueve** · cero comprobante |
| **aplicar dos veces el mismo crudo** | la segunda dice `ya_estaba_pagada` · **un solo comprobante** |

*Sin el segundo, «idempotente» es una palabra en un comentario.*

---

## §8 · LO QUE ESTE CONTRATO NO DECIDE

El nombre exacto · si nace hermana o si `resolver_consulta_activa` se ensancha
*(la firma `p_compra_id` empuja a hermana, pero es de motor)* · si cubre los
cuatro sujetos (§5) · el cuerpo · quién la llama además del barrido.

**Y una que no es de motor y hay que recordar:** el **cron del barrido va
último**, después de que esta función exista y haya corrido a mano una vez.
*Un barrido que escala lo mismo en cada pasada entrena a ignorarlo.*
