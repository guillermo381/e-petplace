# Guion del día 1 — cuando aparezca el `pointOfSale`

> **De:** pista D (S103) · **22-ago-2026** · **Para:** quien corra esto el día
> que llegue el dato — puede no ser yo, y por eso está escrito para ejecutarse
> **sin pensar y sin reconstruir nada de memoria.**
>
> **Precondición única:** `DEUNA_POINT_OF_SALE` en el keychain, cuenta
> `epetplace`. Todo lo demás ya está.
>
> ⚠️ **REVISADO EL 22-ago CONTRA EL ESTADO REAL.** Este guion se escribió
> cuando el riel era **sólo mediciones**. Hoy hay más piezas vivas y eso cambió
> dos cosas — ver **§11**. *Un guion que envejeció en silencio se descubre el
> día que se corre.*
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
bash scripts/deuna/correr-tests.sh     # 51/51 antes de tocar la red
node scripts/deuna/sondeo-qa.mjs       # falla limpio si falta una llave
```

**Control de arranque:** los 51 tests en verde **antes** de medir. *Si el
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
| viene `numericCode`, 6 dígitos | ✅ — **avisar a C igual**, aunque ya no la desbloquee: le CONFIRMA lo que construyó |
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

---

## §10 · ENSAYO EN SECO — corrido el 22-ago contra el simulador

**Orden de mesa: que el lunes el guion se ejecute, no se lea por primera vez.**
Se corrió entero **dos veces**. Modo:

```bash
node scripts/deuna/simulador-local.mjs 8787 &
DEUNA_SIMULADOR=http://localhost:8787 DEUNA_POS_ENSAYO=9999 \
  node scripts/deuna/sondeo-qa.mjs
```

> 🔴 **El modo ensayo NO toca el keychain.** `DEUNA_SIMULADOR` sólo acepta
> `localhost` (candado en el script) y el POS sale de `DEUNA_POS_ENSAYO`.
> *Depositar un POS falso «para probar» es exactamente cómo el lunes alguien
> mide contra QA real con un número inventado.*

### 🔴 LO QUE EL ENSAYO ENCONTRÓ — tres huecos, los tres del INSTRUMENTO

**Ninguno era del guion. Los tres habrían producido veredictos falsos.**

| # | qué pasó | por qué importaba |
|---|---|---|
| ① | El simulador devolvía **el fantasma siempre**, existiera o no la transacción ⇒ el paso del `amount` salió **❌** | **Ese ❌ se lee como una medición.** Alguien podría archivar que el supuesto del paso 1 «ya quedó refutado» cuando lo único que pasó es que el instrumento no distingue |
| ② | `transactionId` **fijo** ⇒ la regeneración salió *«mismo txId ⇒ idempotente por referencia»* | **Una conclusión falsa fabricada por el instrumento**, sobre la pregunta §12.6 que el plan manda **medir** |
| ③ | `/refund` **no existía** ⇒ 404 leído como *«rebota, correcto»* | *Un 404 de ruta inexistente y un rechazo de negocio se ven parecidos en una tabla de veredictos* |

**Curados los tres** (el simulador recuerda lo que creó, cada request nace con
su id, y `/refund` responde con el literal real). **Segunda corrida: 9 ✅ · 0 ❌
· 0 ⚪, 0,3 s.**

> 🔴 **Y ESE VERDE ES LA TRAMPA MÁS PELIGROSA DE TODAS, así que el script ahora
> la grita:** el tablero de la segunda corrida es **indistinguible** del que
> produciría una corrida real contra QA. *Un ensayo que termina en verdes se
> archiva como si hubiera medido.* El script imprime, en modo ensayo:
> **«ESTOS VEREDICTOS NO SON MEDICIONES · NO copiar a ningún reporte».**

### ⏱ Cronometraje

| tramo | ensayo | estimado contra QA |
|---|---|---|
| las 7-9 llamadas | 0,3 s | **~12 s** (espaciado 1,4 s por el rate limit) |
| pasos 1-4 y 7 | — | **minutos**, sin intervención |
| **paso 5 (regeneración)** | — | + el tiempo de leer 2 respuestas |
| **paso 6 (refund)** | — | 🔴 **no acotable — §10.2** |

**El guion sin el refund se corre en menos de diez minutos.**

### §10.1 · Lo que se puede correr SOLO — y es casi todo

**Pasos 1, 2, 3, 4, 5 y 7 no necesitan a nadie.** Se corren con el script, sin
decisión humana ni pieza de otra pista. *Ése era el objetivo y se cumplió.*

### §10.2 · 🔴 DÓNDE SE TRABA — tres puntos, y hay que saberlos hoy

**① El paso 6 (refund) EXIGE PAGAR DE VERDAD** en la app Deuna de QA.
No es una llamada más: **necesita una persona con la app instalada, una cuenta
de QA y el código de 6 dígitos en la mano, dentro de los 3 minutos que vive.**
⇒ **Es el único paso que no se puede correr solo, y su duración no depende de
nosotros.** *Si el lunes no hay quién pague, el paso 6 queda ⚪ y se declara —
no se simula.*

**② El paso 1 puede PARAR TODO** y esa parada **es decisión de mesa, no de
quien corre.** Si el `amount` viene en 0, la regla de reemplazo (fantasma por
tiempo en vez de por forma) **mueve una orden firmada**. ⇒ **Quien corra tiene
que poder alcanzar a la mesa ese día**, o el guion se detiene ahí con su
medición escrita.

**③ El paso 5 puede abrir trabajo de MOTOR.** Si los dos códigos conviven tras
regenerar, aparece **riesgo de pago doble** ⇒ decisión de mesa + posible cambio
en el actuador (**territorio de A**). *No lo resuelve quien corre el guion.*

### §10.3 · Qué se paraleliza

| en paralelo con el guion | quién | por qué se puede |
|---|---|---|
| **Mandar el correo a soporte** (`S103-D-PAQUETE-ALTA-WEBHOOK.md` §1) | founder | independiente, y **contiene el pedido del `pointOfSale`** |
| **N3 + redeploy de `pagos-conciliar`** | A | no depende de estas mediciones |
| **La pantalla del código** | C | 🔴 **salvo el nombre del campo** — se desbloquea con el **paso 3**, que corre en el primer minuto ⇒ *avisarle apenas salga, no al terminar el guion* |
| **El alta del webhook** | founder | bloqueada por soporte, no por el guion |

**Lo que NO se paraleliza:** los pasos entre sí. **El 1 puede invalidar al
resto** y el 2 decide si una cura ya aplicada era mejora o requisito.

### §10.4 · Lo que el ensayo NO probó, y hay que decirlo

**El ensayo prueba que el guion CORRE. No prueba una sola de sus respuestas.**

Lo sintético que el simulador devuelve —la respuesta entera de
`payment/request`, y **cómo se ve una transacción real sin pagar**— es
**exactamente lo que el día 1 viene a medir**. *El simulador asume lo plausible
para que el ensayo pueda correr; si asumiera otra cosa, el ensayo correría
igual.*

⇒ **El ensayo no reemplaza al día 1: lo prepara.**

---

## §11 · 🔴 LO QUE CAMBIÓ DESDE QUE ESTE GUION SE ESCRIBIÓ (revisado 22-ago)

**Medido, no recordado:**

| pieza | al escribir el guion | hoy |
|---|---|---|
| Actuador con rama DeUna | ❌ no existía | ✅ **aplicado y vivo** |
| Wrapper `pagos-deuna.ts` | ❌ | ✅ **en `main`** |
| Pantalla de espera de C | ❌ | ✅ **enchufada contra el contrato** |
| Edge `pagos-deuna-solicitud` | escrita | **escrita y SIN DESPLEGAR** ← *sigue igual* |

### ① El aviso a C cambió de naturaleza — y hay que decírselo distinto

El guion decía *«avisar a C, es su desbloqueo»*. **Ya no la desbloquea: C
construyó contra el contrato y su pantalla existe.**

⇒ Lo que el paso 3 hace hoy es **confirmarle o desmentirle** lo que ya
construyó. **El aviso sigue siendo urgente, por la razón inversa:** si el campo
se llama distinto, C tiene código escrito contra un nombre equivocado, y eso es
peor que estar esperando.

### ② 🔴 EL DÍA 1 YA NO TERMINA EN MEDICIONES — puede haber CIRCUITO

Cuando escribí esto, medir el API era todo lo que se podía hacer. **Hoy, con el
actuador vivo, el wrapper en `main` y la pantalla enchufada, falta UNA cosa para
que el circuito exista de punta a punta: desplegar la puerta.**

⇒ **Nace el `PASO 8` (abajo).** *No estaba antes porque era imposible; hoy es lo
único que separa «medimos el API» de «cobramos».*

---

## §12 · PASO 8 — EL CIRCUITO REAL *(nuevo, 22-ago)*

⚠️ **PRECONDICIÓN: desplegar `pagos-deuna-solicitud`** — y eso **pide
autorización del founder por tanda**. Sin ese deploy no hay paso 8.

⚠️ **Y una segunda: el webhook.** Si su alta no está hecha (depende de soporte,
pregunta #3), **el pago se confirma por BARRIDO y no por webhook** — más lento,
pero funciona. *Se declara para que nadie lea la demora como una falla.*

### El recorrido

1. La familia elige **Deuna** en «Cómo quieres pagar».
2. La pantalla muestra **el código de 6 dígitos** con su cuenta regresiva.
3. Se paga **de verdad** en la app Deuna de QA.
4. **La pantalla pasa sola a pagada.**
5. Llega el **comprobante** con `transactionId` + `transferNumber`.

### 🔴 El discriminador — y no es que la pantalla cambie

**La verdad la da `payment/info`, no el webhook ni la pantalla.** Antes de
cantar victoria:

```sql
select estado, proveedor_transaction_id, transfer_number, hallazgo
  from pagos_intentos where referencia_corta = '<la del intento>';
select resultado, detalle from webhook_events
 where proveedor='deuna' order by recibido_en desc limit 3;
```

**Verde exige las tres:** el intento en `aprobado` · el evento con
`verificado=si` en su detalle · el sujeto pagado.
*Una pantalla que dice «pagado» sin esas tres filas es una pantalla que se
adelantó.*

### Lo que este paso puede destapar y los anteriores no

- **El actuador ignorando el evento en silencio** — el modo de falla que `L-318`
  nombra. Sólo se ve mirando el sujeto, no la pantalla.
- **El comprobante sin `transferNumber`** (§3.6 lo exige por nombre).
- **La voz de `cita_no_existe` diciendo «compra»** — ver el hallazgo del cruce
  con C, si el gate se corre sobre una cita.

---

## §13 · 🔴 LO NO EJERCIDO — cruce con la lista de C (23-ago)

**Orden de mesa:** *lo no ejercido que no está en el guion se convierte en verde
por olvido.* Se cruzaron los cinco ítems de C contra este guion.

> ⚠️ **Declarado: busqué la lista literal en `docs/loop/S103-C.md` y NO la
> encontré con esos términos** (sí `①ter · LOS TRES GATES QUE ESPERAN APARATO`).
> **Se cruza el enunciado de la mesa**, que es la fuente autorizada acá — no se
> reconstruye de memoria un literal que no se pudo leer.

| # | lo no ejercido (C) | ¿tenía paso? | dónde queda |
|---|---|---|---|
| 1 | **que el servidor emita cada código** | 🔴 **NO** | **cerrado hoy — §13.1** |
| 2 | código de 6 dígitos real **con su `expiraEn` real** | 🟡 parcial | **paso 3**, reforzado abajo |
| 3 | transición a pagada **por consulta activa** | ✅ | **paso 8** (§12), con sus tres filas |
| 4 | **el pegado** | ⚪ **no es mío** | de C · **bloqueado por build nativa**, no por el POS |
| 5 | el recorrido en pantalla | ✅ | **paso 8** |

### §13.1 · 🔴 EL HUECO REAL — y se cerró sin esperar al lunes

**Medido:** de los 12 códigos que la puerta emite, el E2E ejercía **6**. Los
otros **6 estaban declarados** (contrato), **tipados** (wrapper) y **con voz**
(pantalla)… **y nadie había visto a la puerta emitirlos.**

> *Un código con contrato, tipo y voz se ve exactamente igual que uno que
> funciona — hasta que alguien lo provoca.* **Tres capas de acuerdo no son una
> medición.**

⇒ El simulador ganó un **endpoint de control** (`POST /sim/caso`) para forzar
escenarios. *Va por endpoint y no por header porque **la puerta hace sus propias
llamadas y no propaga headers ajenos** — un header de entrada no llega a la
salida.*

**Los 6 que faltaban, ejercidos contra la puerta real:**

| escenario forzado | código emitido |
|---|---|
| compra que no existe | `compra_no_existe` |
| **compra DE OTRO** | **`compra_no_existe`** ← *el mismo, a propósito* |
| cita que no existe | `cita_no_existe` |
| compra sin desglose | `desglose_incompleto` |
| desglose con total 0 | `monto_invalido` |
| auth no responde (500) | `sesion_no_verificable` ← *no `sin_sesion`* |
| **DeUna en puerto muerto** | **`sin_respuesta`** |

**✅ 12 de 12 ejercidos**, con control positivo (el camino feliz sigue dando
`ok:true` con su código).

🔴 **Y las dos filas que valen más que el conteo:**

- **«no existe» y «es de otro» devuelven el MISMO código.** Era una promesa
  escrita en mi contrato —*distinguirlas convertiría esto en un oráculo de
  compras ajenas*— **y nadie la había verificado.** Ahora está medida.
- **`sesion_no_verificable` y no `sin_sesion`** cuando auth cae. *La diferencia
  decide si a la persona se le dice «volvé a entrar» —mandándola a un login que
  no arregla nada— o «reintentá».*

### §13.2 · El `expiraEn` real — criterio de rojo propio (refuerza el paso 3)

El paso 3 lo tenía como nota al pie de la tensión. **Sube a criterio**, porque
la pantalla de C ya pinta su cuenta regresiva contra ese valor:

| resultado | veredicto |
|---|---|
| la respuesta trae `expiredAt` (o equivalente) | ✅ la puerta lo prefiere sobre su supuesto de 3 min — ya está cableado así |
| **no lo trae** | 🟡 la puerta cae a **3 min asumidos**. ⇒ **probar mandando `expiredTime: 5`**: si el vencimiento cambia, la doc miente y **C no puede hardcodear 3 minutos** |
| lo trae pero **≠ 3 min** | 🔴 la doc del proveedor es falsa · **la cuenta regresiva de C está mintiendo** y hay que avisarle en el momento |

### §13.3 · Lo que NO se cerró, con dueño

**El pegado (#4) no es de este guion y no debe estarlo.** Es de **C**, y su
disparo es **la próxima build nativa** (`expo-clipboard` es nativo y no viaja
por OTA) — **no el `pointOfSale`**.

⚠️ **Se anota acá igual, porque el riesgo del founder aplica: si no está en
NINGÚN guion, se da por bueno.** *Este documento no lo cubre; que quede escrito
que su dueño es C y su llave es otra.*
