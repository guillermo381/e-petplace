# Guion del día 1 — cuando aparezca el `pointOfSale`

> **De:** pista D (S103) · **22-ago-2026** · **Para:** quien corra esto el día
> que llegue el dato — puede no ser yo, y por eso está escrito para ejecutarse
> **sin pensar y sin reconstruir nada de memoria.**
>
> **Precondición única:** `DEUNA_POINT_OF_SALE` en el keychain, cuenta
> `epetplace`. Todo lo demás ya está.
>
> 🔴 **EL ORDEN NO ES SUGERENCIA.** El paso 1 puede **invalidar el diseño del
> clasificador de fantasmas**. Si sale rojo, se para y se reordena — no se
> sigue midiendo lo de abajo, porque lo de abajo se interpretaría con un
> discriminador que ya sabemos falso.

---

## §0 · ARRANQUE — treinta segundos

```bash
security add-generic-password -s DEUNA_POINT_OF_SALE -a epetplace -w '<el POS>'
cd <worktree>
bash scripts/deuna/correr-tests.sh     # 45/45 antes de tocar la red
node scripts/deuna/sondeo-qa.mjs       # falla limpio si falta una llave
```

**Control de arranque:** los 45 tests en verde **antes** de medir. *Si el
código ya estaba roto, todo lo que la red conteste después se va a interpretar
mal.*

⚠️ **Espaciar ≥ 1,2 s entre llamadas.** El rate limit es real (`429`, ~1 req/s).
El script ya lo hace; si medís a mano, acordate.

---

## §1 · PASO 1 — 🔴 EL SUPUESTO QUE PUEDE TIRAR EL DISEÑO ABAJO

### La pregunta

**¿Una solicitud REAL recién creada devuelve su `amount`, o devuelve `0`?**

### Por qué va primera y por qué puede parar todo

El clasificador de fantasmas (`pagos-deuna-barrido/_reloj.ts`) reconoce «el
proveedor no sabe de esto» por **tres marcas juntas**: `PENDING` + `amount 0` +
`date ""`. Eso salió de medir una transacción **inexistente**.

**Lo que nunca pudimos medir es el otro lado:** cómo se ve una transacción que
SÍ existe y todavía no se pagó. Si se viera igual —`PENDING` con `amount 0`—
entonces **las tres marcas no discriminan nada**, y un pago legítimo consultado
en su primer segundo se clasificaría fantasma y se cerraría como huérfano.

> *Todo lo que viene después se interpreta con este discriminador. Medirlo
> segundo sería construir sobre una base sin verificar y descubrirlo tarde.*

### Qué correr

```bash
# ① crear una solicitud REAL (monto chico)
node scripts/deuna/sondeo-qa.mjs      # el paso ① del script ya hace esto
# ② anotar el transactionId que devuelve
# ③ consultarlo INMEDIATAMENTE, sin pagarlo:
#    POST /merchant/v1/payment/info  { "idType":"0", "idTransacionReference":"<txId>" }
```

### El control

Compará esa respuesta contra el fantasma ya grabado
(`supabase/functions/pagos-deuna-webhook/fixtures-qa-deuna.json` →
`fantasma_idType_0`). **Es el control positivo: sabemos exactamente cómo se ve
lo que no existe.**

### Criterio

| resultado | veredicto | qué hacer |
|---|---|---|
| `amount` > 0 (el monto que mandaste) | ✅ **el discriminador sirve** | seguir al paso 2 |
| `amount` = 0 **y** `date` = `""` | 🔴 **PARAR — el clasificador está mal** | ver abajo |
| `amount` = 0 pero `date` ≠ `""` | 🟡 parcial | el discriminador se apoya en `date`, no en `amount`. Reordenar las marcas y **volver a correr `_reloj.test.ts`** |

### 🔴 Si sale rojo — qué se hace, para no improvisarlo ese día

1. **No seguir con los pasos 3-6.** Se pueden medir después; interpretarlos con
   un discriminador falso es peor que no medirlos.
2. **El fantasma deja de reconocerse por forma y pasa a reconocerse por
   tiempo.** La regla de reemplazo: `PENDING` + `amount 0` que **persiste más
   allá de N minutos** (N ≥ el tiempo de sincronización que el proveedor
   admita) es fantasma; antes de N, es «todavía no sincronizó».
3. **Eso mueve la orden de la mesa** («fantasma desde el primer segundo»), así
   que **no se aplica sin la mesa**: se mide, se reporta con el número, y la
   mesa decide N.
4. **Preguntar a soporte** cuánto tarda una solicitud en sincronizar — pasa a
   ser pregunta bloqueante.

### Sintéticas que este paso reemplaza

| archivo | qué se reemplaza |
|---|---|
| `pagos-deuna-barrido/_reloj.test.ts` | `S_PENDIENTE_REAL` → la respuesta **medida** de una solicitud real sin pagar |
| `scripts/deuna/simulador-local.mjs` | el `PENDING` sintético del `payment/request` |

---

## §2 · PASO 2 — 🔴 ¿`idType "0"` DEVUELVE LA REFERENCIA?

### La pregunta

**Una transacción REAL consultada por `idType "0"`, ¿devuelve
`internalTransactionReference` con su valor, o lo devuelve VACÍO?**

### Por qué está acá y no más abajo

Medido el 22-ago: por `idType "0"` sobre una transacción **inexistente**, ese
campo vuelve **vacío** — y **el actuador resuelve el sujeto SÓLO por él**. Si
una transacción real hiciera lo mismo, una consulta perfecta volvería **sin la
llave para saber a quién aplicarle el pago**, y el actuador contestaría
`sin_referencia_corta` sobre un cobro que sí ocurrió.

**Por eso el buzón ya prefiere `idType "1"`** (dictamen de mesa, 22-ago): por
esa vía la referencia **vuelve por eco**, medido en la misma corrida.

⇒ **Este paso no decide si la cura se hace — ya está hecha. Decide QUÉ ES.**

### Qué correr

```
POST /merchant/v1/payment/info   { "idType":"0", "idTransacionReference":"<txId real>" }
```
Sobre la transacción **real** creada en el paso 1. Mirar `internalTransactionReference`.

### El control

Compará contra `fantasma_idType_0` de las fixtures: **ya sabemos que en una
inexistente viene vacío.** *La pregunta es si la diferencia la hace existir o no
— y eso sólo se ve teniendo una que exista.*

### 🔴 Criterio de parada

| resultado | veredicto | qué cambia |
|---|---|---|
| viene **con su valor** | ✅ | la preferencia por `"1"` es **una mejora** (redundancia sana). El fallback a `"0"` queda como camino válido |
| viene **VACÍA** | 🔴 | **la preferencia por `"1"` deja de ser mejora y pasa a ser REQUISITO** |

**Si viene vacía — qué se hace, escrito de antemano:**

1. El fallback a `idType "0"` del buzón **deja de ser aceptable como camino de
   verificación**: por ahí el actuador nunca podría resolver el sujeto.
2. ⇒ **Un webhook sin `internalTransactionReference` se vuelve INVERIFICABLE**
   por esta vía. No se puede confirmar y **no se debe rechazar**: queda
   `no_verificado` y **lo resuelve el barrido**, que consulta por nuestra
   referencia desde `pagos_intentos` y no depende del webhook.
3. **Hay que medir entonces si el webhook trae la referencia** — hoy es ⚪ (su
   forma nunca se observó). *Si no la trajera y `"0"` viniera vacío, el webhook
   quedaría inútil para resolver el sujeto y el barrido sería el ÚNICO camino
   — eso es dato de mesa, no decisión de pista.*

⚠️ **No se parchea el actuador para tolerar la referencia vacía.** La mesa ya lo
dictaminó: *agregaría tolerancia justo donde la casa acaba de decidir
fail-closed.*

### 🔴 EL OTRO LEG, QUE TAMPOCO ESTÁ MEDIDO — se verifica en la misma corrida

**¿Una transacción REAL por `idType "1"` devuelve la referencia por eco?**

Lo medido es el eco sobre una **inexistente**. *Que una real lo haga es
plausible por exactamente la misma razón por la que lo era el supuesto del
`amount` — y esa clase de supuesto ya nos costó dos fallas.*

**No se trata como confirmado en ninguna dirección** (declarado por A y
ratificado por la mesa). Es una llamada más en la misma corrida:

```
POST /merchant/v1/payment/info   { "idType":"1", "idTransacionReference":"<ref real>" }
```

| resultado | veredicto |
|---|---|
| devuelve la referencia | ✅ la cura del buzón funciona como se diseñó |
| **NO la devuelve** | 🔴 **ninguna de las dos vías resuelve el sujeto desde el webhook** ⇒ el barrido queda como **único** camino, y eso es dato de mesa |

---

## §3 · PASO 3 — EL `numericCode` (firma ① del founder)

### La pregunta

**¿`format:"5"` + `qrType:"dynamic"` devuelve un campo `numericCode` de 6
dígitos?**

Es de lo que depende **la pantalla entera de C**: si el campo se llama distinto
o no viene, su cuenta regresiva y su código no tienen de dónde salir.

### Qué mirar en la respuesta del paso ①

```
transactionId · numericCode · qr · deeplink · expiredAt (?)
```

### Criterio

| resultado | veredicto |
|---|---|
| viene `numericCode`, 6 dígitos | ✅ — **avisar a C en el momento**, es su desbloqueo |
| viene con **otro nombre** | 🟡 anotar el nombre real y corregir `pagos-deuna-solicitud` (una línea) + avisar a C |
| **no viene** | 🔴 la firma ① no es construible como está — **es de la mesa, no de la pista** |

### 🔑 Y de paso, la tensión pendiente

Mirar si la respuesta trae **`expiredAt`** (o equivalente).

- **Si viene:** el vencimiento lo dice el proveedor ⇒ la puerta ya lo prefiere
  sobre su supuesto de 3 min (está cableado así). ✅
- **Si NO viene:** queda vivo el conflicto entre su doc («3 min fijos, no
  configurables») y su API (que acepta `expiredTime`). **Probar mandando
  `expiredTime: 5`** y consultar: si el vencimiento cambia, la doc miente y
  **C no puede hardcodear 3 minutos**. Es la pregunta #10 a soporte.

### Sintéticas que reemplaza

`simulador-local.mjs` → `respuestaRequest()` **entera** (hoy toda sintética:
`numericCode`, `qr`, `deeplink`, `transactionId`).

---

## §4 · PASO 4 — `payment/info` por los dos `idType`

### La pregunta

¿`idType "1"` (nuestra referencia) devuelve lo mismo que `idType "0"` (su id)
para una transacción que **sí existe**?

Importa porque el buzón usa `"0"` y **cae a `"1"` como respaldo**: si el
respaldo devolviera menos información, el fallback estaría degradando en
silencio.

### Criterio

| resultado | veredicto |
|---|---|
| los dos traen `status` + `amount` + `transferNumber` | ✅ el respaldo sirve |
| `"1"` trae menos | 🟡 anotar **qué** falta; si falta `amount`, el respaldo **no puede** verificar (el candado exige monto) ⇒ el buzón debe declararlo, no degradar |
| `"1"` no encuentra la transacción | 🔴 el respaldo no existe — sacarlo del buzón en vez de dejar código que nunca funciona |

**Control:** compará contra el eco del fantasma — con `idType "1"` sobre algo
inexistente ya sabemos que **devuelve nuestra referencia de vuelta**. Confirmar
que con una real devuelve **más que el eco**.

---

## §5 · PASO 5 — LA REGENERACIÓN (§12.6: se mide, no se pregunta)

### La pregunta

Al pedir un segundo `payment/request` **con la misma `internalTransactionReference`**:
¿lo acepta? ¿nace un `transactionId` nuevo? ¿qué le pasa al código viejo?

### Criterio y qué decide cada resultado

| resultado | qué significa | consecuencia |
|---|---|---|
| acepta, **txId nuevo** | una referencia puede tener N transacciones | ✅ **el candado UNIQUE va al `transactionId`** — que es como ya está construido (`uq_pagos_intentos_tx_por_*`). Confirma el diseño |
| acepta, **mismo txId** | es idempotente por referencia | 🟡 la regeneración **no genera código nuevo** ⇒ el botón «Generar un código nuevo» de C necesita **referencia nueva por intento**. Cambio en `pagos-deuna-solicitud` |
| **rechaza** | la referencia se quema | 🟡 ídem: referencia nueva por regeneración |

### Y la segunda pregunta, que es la que le importa a C

Consultar el **primer** `transactionId` después de regenerar:

- sigue `PENDING` ⇒ **los dos códigos conviven** ⇒ 🔴 **riesgo de pago doble**:
  hay que declarar qué pasa si el cliente paga el viejo. **A la mesa.**
- pasó a `EXPIRED`/`CANCELLED` ⇒ el viejo muere solo ⇒ ✅ la regeneración es
  segura tal como C la va a dibujar.

> *Este es el paso que puede sumar trabajo de motor, y por eso se mide antes de
> que C termine su pantalla.*

---

## §6 · PASO 6 — EL REFUND SOBRE TRANSACCIÓN PROPIA

⚠️ **Requiere una transacción APROBADA**, o sea **pagarla de verdad en la app
Deuna de QA**. Si el ambiente no lo permite, esto queda ⚪ y **se pregunta**
(pregunta #5: ¿QA permite simular `REVERSED`?).

### La pregunta

¿El refund por API funciona el **mismo día** sobre una transacción propia
aprobada, y devuelve `transactionReverseId`?

### Qué mirar

| campo | por qué |
|---|---|
| `transactionReverseId` | la letra §2 manda persistirlo — hay columna (`proveedor_reverso_id`) esperándolo |
| el estado después | ¿pasa a `REVERSED`? |
| el monto | ¿acepta parcial o sólo total? **Probar un parcial**: si lo acepta, la letra §8 («sin parciales») está mal |

### Criterio

| resultado | veredicto |
|---|---|
| refund total OK + `transactionReverseId` | ✅ confirma §8 |
| acepta **parcial** | 🔴 **la letra §8 se enmienda** — cambia la política de reembolsos |
| rebota | anotar el mensaje literal: dice la condición real |

### Sintéticas que reemplaza

`_reloj.test.ts` → `S_REVERSED` y `S_REV_FAIL` pasan a medidas **sólo si QA
deja producirlas**. Si no, **quedan sintéticas y se declaran así** — no se
promueven por parecerse.

---

## §7 · PASO 7 — CERRAR LOS 7 ⚪

Con lo de arriba, el script cierra la tabla del §2 de la bitácora sin trabajo
extra:

```bash
node scripts/deuna/sondeo-qa.mjs | tee /tmp/sondeo-dia1.txt
grep -c "«API_KEY»\|«API_SECRET»" /tmp/sondeo-dia1.txt    # ← 0 = no hubo eco
```

Los 7 son: campos del request (⚪8) · `transactionId` (⚪9) · `numericCode`
(⚪10) · estados reales (⚪11) · la ventana de 7 días (⚪12) · el webhook y sus
reintentos (⚪13-14) · el refund (⚪15).

⚠️ **⚪13 y ⚪14 (el webhook) NO se cierran con el script:** exigen que la URL
esté dada de alta. Su procedimiento es
`S103-D-ALTA-Y-ROTACION-WEBHOOK-DEUNA.md`, y depende de la respuesta de soporte
a la pregunta #3. **Se declaran ⚪ hasta entonces, no se dan por buenos.**

---

## §8 · AL TERMINAR — tres cosas, en este orden

1. **Reemplazar las sintéticas por las medidas** y **volver a correr
   `correr-tests.sh`**. *Un test que pasó con una fixture inventada y no se
   volvió a correr con la real no probó lo que cree haber probado.*
2. **Avisar a C** el nombre real del campo del código y su vencimiento — es su
   desbloqueo y no se entera solo.
3. **Actualizar `S103-D-MEDIDO-CONTRA-QA.md`** moviendo filas de «sintético» a
   «medido», con la fecha. *Ese documento vale por su separación; si se
   ensucia, deja de servir.*

---

## §9 · LO QUE NO SE HACE ESE DÍA, aunque tiente

- **No se despliega nada** sin autorización del founder por tanda.
- **No se aplican migraciones** — las numera y deposita A.
- **No se toca `aplicar_evento_de_pago`** con la mano: el diff conceptual es
  N2 y lo escribe A contra el cuerpo vivo.
- **No se registra el webhook** antes de verificar que el buzón responde 200
  (paso 3 del procedimiento de alta).
