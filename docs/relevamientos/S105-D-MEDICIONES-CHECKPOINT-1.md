# S105-D · LAS MEDICIONES DEL CHECKPOINT 1 — el riel DeUna

> **Pista D** · 24-ago-2026 · depositado porque A lo nombró como **el único
> hueco abierto del Checkpoint 1**.
> **Contra qué objeto se midió, declarado una vez:** repo = `main` en
> `9760a6a0` (con el rescate de A adentro) · base y edge functions = proyecto
> `zyltipqscdsdsxnjclhp` vía CLI · ambiente del proveedor = **QA real**
> (`apis-merchant.qa.deunalab.com`), no simulador.
> **`L-418` rige:** toda respuesta del proveedor se cita **con fecha y canal**.

---

## §1.1 · LO QUE LLEGÓ DEL PROVEEDOR, contra la lista de `LETRA_DEUNA` §12

**Fuente de todo este bloque: DeUna, por WhatsApp, 24 y 25-ago-2026.**

| # | pregunta de §12 | ¿llegó? | qué dijo |
|---|---|---|---|
| 1 | 🔴 `pointOfSale` de canal digital | ✅ | **QA = `4262774`** · PDN pedirá otro, **y no se pide ahora** |
| 2 | cómo se **registra y rota** URL + headers | ⚠️ **media** | **registro**: nosotros enviamos, **ellos configuran de su lado** |
| 3 | ¿firma más fuerte que headers estáticos? | ✅ | **no existe** — solo headers estáticos |
| 4 | ¿QA simula `REVERSED` / `REVERSED_FAILED`? | ✅ | **sí se puede** ⚠️ *no dijo cómo* — ver §3 |

**Fuera de la lista, mismo canal y fecha:** ventana de reverso **24 h** ·
tamaño mínimo de marca **50 px logotipo / 16 px símbolo**, área de reserva
**1X** *(dato de B, se cita acá por completitud del canal)*.

### Lo que NO llegó — y no se supone

- 🔴 **El mecanismo de ROTACIÓN.** La pregunta 2 tenía dos mitades y volvió
  media: sabemos **cómo se registra**, no **cómo se cambia** ni **cuánto
  tarda**. *Es la mitad que dimensiona la ventana ciega*, y el buzón ya está
  escrito con dos secretos (`ACTUAL` + `SIGUIENTE`) por eso. **El diseño queda
  ratificado; la ventana sigue sin número.**
- **El `pointOfSale` de PDN**, por orden de la mesa.
- **El rate limit**: respuesta **parcial**. `LETRA_DEUNA` §2 declara «~1 req/s»
  **tomado de la doc en papel**, sin confirmar por el proveedor. El sondeo
  espació a 1400 ms y no vio un solo `429` — *lo cual no confirma el número:
  confirma que 1400 ms alcanza.*
- **Cómo se simulan los reversos** (§3).

### 🔴 La contradicción, y cómo la cerró la mesa

**«Mismo día» (22-ago) vs «24 horas» (24-ago), mismo proveedor, mismo canal.**
La pista la levantó en su turno 1 contra la §8 de entonces, que tenía tachado el
«24 horas» y celebrado el «mismo día» como *hecho confirmado*.

✅ **Ya está resuelto en el canon, y mejor de lo que la pista pedía:** `LETRA_DEUNA`
§8 fue enmendada por A el 24-ago y **la ventana pasó a ser POR RIEL — DeUna 24 h ·
Nuvei mismo día**. *La pista pedía elegir entre dos valores; la mesa midió que no
eran dos lecturas del mismo hecho sino **dos rieles distintos**, y la letra dejó
de tener que elegir.*

⚠️ **Consecuencia para superficie, ya avisada por A:** una frase que prometa una
ventana **sin nombrar el riel es falsa para la mitad de la gente.**

**No bloquea esta tanda** —§8 declara que el refund por API **no entra en v1**—
pero deja la lección:

> **Un «confirmado por mensaje» de un proveedor no es más estable que su propia
> doc: es la misma fuente con otra fecha.** De ahí `L-418` — se cita con fecha y
> canal, porque *«DeUna dijo» ya significó dos cosas opuestas.*

---

## §1.2 · EL ESTADO REAL DEL RIEL

### Las dos preguntas de `L-402`, corridas por separado

**① ¿Está alcanzable?** Sí — **las tres functions desplegadas hoy** (antes: cero).

| function | estado | `verify_jwt` | por qué ese valor, medido |
|---|---|---|---|
| `pagos-deuna-solicitud` | ACTIVE v1 | **true** | valida `getUser()` adentro; la capa de Supabase suma, no reemplaza |
| `pagos-deuna-webhook` | ACTIVE v1 | **false** | **DeUna no manda JWT de Supabase**; su guard es el header propio |
| `pagos-deuna-barrido` | ACTIVE v1 | **false** | lo llama el cron con `x-despacho-secret`; guard propio en el cuerpo |
| `pagos-webhook-stg` | ACTIVE v37 | false | redeploy con la cura de `D-912` |

**② ¿Corrió alguna vez?** **Hasta hoy, NO** — cero intentos `deuna`, cero
`webhook_events` `deuna`, cero `origen` distinto de `webhook`. **Hoy corrió por
primera vez contra QA real** (§2).

### Lo que ya estaba y se verificó

**411 → 412 migraciones, local = remoto, cero desemparejadas.** La forma DeUna
(`20260822220000`) aplicada. Columnas completas (`codigo_numerico`,
`codigo_expira_en`, `referencia_corta`, `proveedor_transaction_id`,
**`proveedor_reverso_id`**, `hallazgo`). CHECK `<= 20` al literal de §4.
Candado de idempotencia en dos índices parciales sobre
`(proveedor, proveedor_transaction_id, sujeto)`. Gate `_evento_autenticado`
conoce `deuna` en columnas, `ELSE false` fail-closed. **Sin cron de barrido**,
que es lo correcto por `§13bis ③`.

### Lo que falta, con dueño

| # | hueco | dueño |
|---|---|---|
| 1 | **`D-887`** · el aplicador del barrido. Medido en la base: `aplicar_evento_de_pago` **no menciona `origen` ni `barrido`** | **A** |
| 2 | Rama del gate para `origen` — **no escrita a propósito**: sería puerta sin motor | A |
| 3 | **Los DOS flips de `§13bis ②`** — `DEUNA_ELEGIBLE = false` **y** `deuna-estado.ts` con el bloque `ENSAYO` vivo | **C** |

---

## §2 · EL ESTRENO — el riel corrió contra QA real

**Sondeo `scripts/deuna/sondeo-qa.mjs`, 24-ago-2026, 24,7 s, contra
`apis-merchant.qa.deunalab.com`. Credenciales del keychain, nunca impresas.**

**`payment/request` responde `200`** y devuelve `transactionId`, **`numericCode`
de 6 dígitos** (la firma ① del founder), QR y deeplink. ⇒ **el bloqueante del
riel murió: con `pointOfSale = 4262774` la solicitud se puede formar.**

**7 ✅ · 1 ❌ · 1 ⚪.** Los tres que importan:

### 🔴 ① EL DISCRIMINADOR DEL FANTASMA NO SIRVE — y es una corrección a la letra

`LETRA_DEUNA` §2 dice que una transacción inexistente vuelve
`PENDING / amount 0 / date ""`, **y que por eso el fantasma se distingue por el
monto.** Medido hoy sobre una transacción **REAL, recién creada**:

```
status: "PENDING" · amount: 0 · date: "" · transferNumber: "" · posId: ""
```

> ### Una transacción real en `PENDING` es **byte por byte indistinguible** de un fantasma. El monto no aparece hasta que alguien paga.
>
> *La forma del fantasma no es «lo que devuelve una transacción inexistente»:
> es **lo que devuelve cualquier transacción que todavía no se pagó**.*

**Qué NO rompe, y conviene decirlo para no inflar el hallazgo:** la regla de
aprobación sigue siendo correcta y sigue siendo fail-closed —**`APPROVED` Y
`amount > 0`**—, y `esVerdadVerificada` la implementa bien. **Lo que se cae es
la idea de que el monto distinga *real* de *inexistente* mientras está
pendiente.** ⇒ **el corte de huérfanos lo pone NUESTRO reloj y solo nuestro
reloj**, que es justo lo que §2 ya ordenaba — ahora con la razón medida en vez
de heredada.

### 🔴 ② `refund` SOBRE UNA TRANSACCIÓN NO PAGADA **NO REBOTA** — devuelve éxito

Se esperaba un rebote `4xx` («el refund exige una transacción aprobada»). Lo que
volvió:

```
POST /merchant/v1/payment/refund → HTTP 200
{ "status": true,
  "message": "The QR with id 4262774 has been successfully cleaned",
  "transactionReverseId": null }
```

**Dos cosas graves en una sola respuesta:**

1. **`status: true` sobre algo que jamás se cobró.** *Un consumidor que lea
   `status` como «el reverso salió bien» marcaría como REVERSADA una
   transacción que nunca tuvo plata.* ⇒ **`transactionReverseId` es el
   discriminador real, y `null` significa que no hubo reverso** — la columna
   `proveedor_reverso_id` que ya existe es exactamente el lugar donde se prueba.
2. ⚠️ **El id que el mensaje nombra es `4262774` — que es el `pointOfSale`, no
   la transacción.** *Sugiere que la operación limpia el QR del punto de venta,
   no esa transacción.* **No se volvió a ejercer contra QA hasta entender el
   alcance**: si limpia el QR del POS, un `refund` mal dirigido podría invalidar
   códigos vivos de otros clientes. **Va como pregunta al proveedor, no como
   suposición** (§3).

### ③ Regenerar un código: el candado va al `transactionId`

La misma `idTransacionReference` **es aceptada** y devuelve un `transactionId`
**nuevo**; el código viejo queda `PENDING`. ⇒ **los dos conviven vivos.**
**Dato para C:** regenerar no mata el código anterior — si la pantalla muestra
uno solo, hay que decidir cuál, y el server es quien sabe.

---

## §3 · 🔴 EL FRENO — los reversos NO se pudieron ejercer, y por qué

**DeUna confirmó (WhatsApp, 24-ago-2026) que `REVERSED` y `REVERSED_FAILED` se
pueden simular en QA. No dijo CÓMO, y no se adivinó.**

**El obstáculo es concreto y medido:** `refund` necesita una transacción
**APROBADA**, y aprobar exige que una persona pague desde la app Deuna. El
sondeo puede **crear** la solicitud —lo hizo— pero **no puede aprobarla**. Sin
aprobación, `refund` no produce `REVERSED`: produce la limpieza de QR de ②.

⇒ **`REVERSED` y `REVERSED_FAILED` siguen sin ejercerse.** *Se declara como
hueco abierto en vez de darse por probado: el circuito de reverso está escrito,
y escrito no es corrido — que es la distinción que esta casa acaba de pagar dos
veces (`L-402`, y el buzón viejo de `main`).*

### Las tres preguntas al proveedor, listas para el founder

1. **¿Cómo se aprueba una transacción en QA sin la app?** ¿Hay usuario de
   prueba, endpoint o panel? *Sin esto no hay forma de ejercer `APPROVED` ni,
   por lo tanto, ningún reverso.*
2. **¿Cómo se simula `REVERSED_FAILED`?** Es 🔴 hallazgo por letra —**jamás se
   resuelve solo**— y necesitamos verlo al menos una vez.
3. 🔴 **¿Qué hace exactamente `refund` sobre una transacción no aprobada?**
   Su mensaje dice *«The QR with id 4262774 has been successfully cleaned»* y
   **4262774 es nuestro `pointOfSale`**. **¿Limpia el QR del punto de venta
   entero o solo esa transacción?** *De la respuesta depende si `refund` es
   seguro de ejercer con tráfico vivo.*

---

## §4 · LO QUE ESTA TANDA CAMBIÓ EN LA BASE

**`D-912` curada en sus dos mitades** (migración `20260824235000` + redeploy de
`pagos-webhook-stg`). Detalle en la bitácora `docs/loop/S105-D.md`.
**Reversa escrita ANTES**, con su nota de que revertir **reabre D-912**.
**Cinturón 6/6 con dos rojos producidos, residuo 0.**

⚠️ **Pendiente encadenado, de A:** el reproceso de los cuatro eventos del grupo
① de `D-912`. **Ya se puede correr** — el sellador acepta el dato.
