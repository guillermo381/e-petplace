# LETRA_MOTOR_PAGOS_S101.md — e-PetPlace

> **Nota de depósito (S101-A, 19-ago-2026):** esta letra vivía solo en la conversación de apertura. Se depositó **VERBATIM** como v1.0. **Las enmiendas E1-E7 de la mesa de la tarde YA ESTÁN APLICADAS** en este cuerpo (v1.1) — su porqué vive completo en `docs/ENMIENDA_S101_MOTOR_v1.1.md`, que **se conserva y no se borra**. La letra vieja va **tachada, no borrada**: *quien lea esto dentro de tres sesiones tiene que poder ver qué decía antes y por qué cambió.*

---

> **Versión:** v1.2 · **Abierta:** 19-ago-2026 · **Enmendada:** 19-ago-2026 (E1-E7, después las tres calibraciones de Erick) · Sesión **S101 · LOS PAGOS** · **UNA SOLA PISTA**
> **Fuente de las decisiones:** acta de apertura S101 · `planintegracionnuveiepetplace.md` (censo ③ ejecutado 19-ago) · firmas del founder de esta jornada.
>
> **Qué autoriza:** construir el motor de cobro **hasta el punto en que el pedido queda pagado**.
> **Qué NO autoriza:** tocar el ledger, el devengo, la comisión o la liquidación. Ver §9.
>
> **⚠️ NINGÚN NOMBRE DE TABLA, COLUMNA O FUNCIÓN DE ESTE DOCUMENTO ESTÁ MEDIDO.**
> Todo lo de §3 y §4 es **candidato** hasta que el censo B0 lo confirme contra la base.
> Si la fuente contradice a esta letra, **gana la fuente** — y esta letra se enmienda.

---

## §0 · LOS DOS FRENOS PROPIOS DE ESTA SESIÓN

Además de los cinco de la casa:

1. **Todo corre contra SANDBOX.** Cualquier cosa que toque plata real —aunque sea una transacción de prueba de un dólar— **pide firma explícita del founder**.
2. **El endpoint del webhook es público por necesidad.** Desde su primera línea, **no mueve un solo estado sin validar el `stoken`**. Un endpoint público que cambia estados sin validar es una puerta para marcar pedidos como pagados desde afuera.

---

## §1 · B0 — EL CENSO, ANTES DE UNA LÍNEA

**Precondición dura. Ninguna migración antes de esto.** Se mide contra la base y el código, no contra este documento ni contra la memoria de nadie. Salida: un relevamiento en `docs/relevamientos/`.

Qué hay que medir, y el resultado se escribe aunque sea "no existe":

1. **`pagando`** — dónde vive (¿enum? ¿columna? ¿metadata?), quién lo escribe, quién lo lee, y **los cuatro pedidos clavados ahí**: sus ids, sus montos, su antigüedad.
2. **La compra y su desglose** — nombre real de las tablas, columnas del desglose, si el congelamiento al cobrar ya está implementado o solo escrito.
3. **La relación compra ↔ pedido** — ¿una compra puede tener N pedidos? La respuesta decide la forma entera de la reconciliación.
4. **El pago simulado** — dónde se registra hoy (`metadata.pago_simulado`, `pagado_en`), y **qué función lo escribe**.
5. **`confirmar_pago_pedido`** — verificar que sigue revocada de `authenticated` (D-764). Si no lo está, es hallazgo rojo y se reporta antes de seguir.
6. **Tablas que ya nacieron para esto** — cualquier `payments`, `pagos`, `transacciones`, `webhook_events` preexistente. **El peor resultado posible es crear una tabla al lado de una que ya existe.**
7. **Los estados del pedido** — la escalera de cuatro y qué los dispara.
8. **`fee_configs` y `seller_comisiones`** — solo LEER y reportar los números vivos (D-748: el 20 %). **No se toca nada:** es territorio de S102.

---

## §2 · EL PRIMER ENTREGABLE ES UNA URL

**Orden de prioridad, por encima de todo lo demás.** El founder ya pidió a Nuvei el registro de la callback de staging; ese registro **exige una URL concreta que responda**. Mientras no exista, el pedido queda esperando y la ida y vuelta se paga dos veces.

**Entregable:** la Edge Function desplegada en staging, pública, que:

- Responde **HTTP 200 inmediato** a todo POST bien formado.
- **Persiste el payload crudo** en `webhook_events` con el resultado de la validación del `stoken`.
- **No mueve ningún estado todavía.** En esta primera versión es un buzón con traza, no un actuador.

Con eso la URL existe, es real y se le puede pasar a Erick en el momento en que la pida.

**Dos funciones, no una con bandera:** staging y producción son despliegues separados con secretos separados. *(Si Nuvei solo admite una URL por cuenta, es la pregunta 5 del bloque a Erick — hasta saberlo, se construye como dos.)*

---

## §3 · ~~LAS DOS TABLAS~~ — 🔴 **DEROGADA ENTERA (E1, 19-ago)**

> **El motor ya existe: estas tablas NO se crean.** El censo B0 midió vivos
> `pagos_intentos`, `pagos_eventos`, `compras`, `compra_desglose`,
> `cat_transiciones_pedido` y `confirmar_pago_pedido` — con el enchufe de S100 declarado
> en el código (*«y S101 se enchufa acá sin tocar la pantalla»*).
>
> **Lo que rige en su lugar:** la migración 2 **enmienda `pagos_intentos`** —
> `compra_id` · `confirmado_por` · `proveedor_transaction_id` · `authorization_code` ·
> `marca` · `bin` · `ultimos4` — y agrega el candado de idempotencia.
>
> **El candado, corregido por firma de mesa (19-ago, cierre):**
> **`UNIQUE (proveedor, proveedor_transaction_id, pedido_id)` parcial.**
> ~~El literal `(proveedor, proveedor_referencia)`~~ quedó **descartado por prueba**: es
> **inconstruible** junto con la orquestación. Rojo producido sobre la compra real
> `fc8e2a85`, que ya tiene dos pedidos — el segundo intento viola la constraint, porque
> `proveedor_referencia` guarda el `dev_reference` y **el dev_reference es la COMPRA**,
> compartida por sus N pedidos. *El candado va al identificador de la pasarela y al grano
> correcto, que es lo que esta sección quería decir.*
>
> **`webhook_events` (migración 1) SE QUEDA.** La enmienda la dejó condicionada al ítem ①
> — «si la medición la declara duplicación, se revierte». **La medición se hizo y NO es
> duplicación:** ninguna de las dos se deriva de la otra, y la cardinalidad lo prueba
> (un golpe HTTP de una compra de N pedidos deja **1 fila allá y N acá**). Medido además:
> `pagos_eventos` tiene **un solo escritor y un solo lector**, los dos
> `confirmar_pago_pedido`. **La reversa de la migración 1 no se propone.**
>
> *Lo de abajo se conserva tachado porque su razonamiento sigue siendo el correcto —
> lo que estaba mal era el supuesto de que el terreno estaba vacío.*

### ~~Letra vieja de §3, conservada~~

~~**Eje `proveedor` desde la primera migración.**~~ No es previsión: DeUna está en conversación y **no está en el catálogo de APMs de Nuvei** — es una integración directa con su propio contrato y su propia certificación. Agregar un segundo proveedor después de la primera plata real es una migración con backfill sobre filas de dinero. *El esqueleto nace completo; lo que se enciende son opciones.*

### `pagos` (candidata)

| Campo | Nota |
|---|---|
| `id` | |
| `compra_id` | **La compra es el padre. `dev_reference` = compra**, jamás pedido (firma S100) |
| `proveedor` | `nuvei` · `deuna` · … — enum, no texto libre |
| `proveedor_transaction_id` | el DF de Nuvei. **Único por proveedor** — es la llave de la idempotencia |
| `estado` | estado **nuestro**, narrativo. Ver §4 |
| `proveedor_status` / `proveedor_status_detail` | crudo, **jamás interpretado en la columna** |
| `authorization_code` | requisito del correo de certificación |
| `monto` · `moneda` | el monto **congelado al cobrar** |
| `desglose_congelado` | jsonb. Existe porque el reembolso parcial probablemente no existe: si el desglose se moviera después del cobro, no habría con qué reconciliar |
| `marca` · `bin` · `ultimos4` | para el correo y para soporte |
| `intentos` | un pago puede tener N intentos; la compra no |
| `creado_en` · `confirmado_en` · `confirmado_por` | `confirmado_por` distingue **webhook** de **consulta activa**. Sin eso no se puede auditar cuál de los cuatro casos ocurrió |

### `webhook_events` (candidata)

| Campo | Nota |
|---|---|
| `id` · `recibido_en` | |
| `proveedor` | |
| `payload` | **crudo, tal cual llegó.** Nunca normalizado |
| `stoken_valido` | booleano del resultado de la verificación |
| `transaction_id` | extraído, para dedupe |
| `resultado` | `aplicado` · `duplicado` · `stoken_invalido` · `monto_no_coincide` · `desconocido` |
| `pago_id` | nullable — un evento puede llegar sin pago que lo reciba |

**Todo evento se persiste, incluso el que se rechaza.** Un webhook con `stoken` inválido es la traza de un intento de fraude: descartarlo sin guardarlo es perder la única evidencia.

---

## §4 · LA MÁQUINA DE ESTADOS, COMO DATO

**Precedente de la casa:** 46 transiciones como dato en el motor de la despensa (S95). Mismo patrón.

> 🔴 **CORRECCIÓN E2 (19-ago) — `esperando_otp` CAMBIA DE DUEÑO.** Fuente: Erick,
> *«el formulario de tokenización pide el usuario el otp pero en el débito no se debe
> pedir»*. **`esperando_otp` y `en_desafio` son estados del ALTA DE TARJETA** (Add Card
> en el WebView), **no del cobro**. El flujo de débito **no espera desafío**, y ninguna
> pantalla de cobro se construye esperando un código.
> **El handler del webhook no cambia:** los `status_detail` 1/31/32/33/35-48 se siguen
> recibiendo, registrando y tolerando — lo que cambia es **qué flujo de UI los consume**.
> *Construir la pantalla de cobro esperando un OTP que nunca llega es un embudo que se
> cuelga sin que nada falle.*

> ✅ **CONFIRMACIÓN E2 (Erick, 19-ago noche): recurrencia con Diners CONFIRMADA** —
> **OTP en la tokenización, débito limpio, las tres marcas.** *No cambia una línea de
> código: confirma que E2 leyó bien el reparto.* Y desbloquea de hecho la recurrencia,
> que §9 excluía «por depender de MIT, sin respuesta de Nuvei» — **la respuesta llegó y
> es afirmativa**; el alcance de S101 no cambia por eso (la recurrencia sigue fuera),
> pero deja de estar bloqueada por una incógnita.

> 🔴 **EL WEBHOOK NOTIFICA *TODO* EVENTO (Erick, 19-ago noche), incluidos reversos y
> cierre de lote.** Dos consecuencias que este mapa tiene que absorber:
>
> **(a) Los códigos de reverso van a llegar DE VERDAD** ⇒ `27` · `28` · `7` · `34` ·
> `29` **son TRANSICIONES del mapa, no códigos meramente tolerados.** Cuando el paso 4
> construya la máquina como dato, **estos cinco entran con su fila propia** — si cayeran
> al cajón de «desconocido: registra y no mueve», un reverso real dejaría el pedido
> confirmado con la plata ya devuelta. *La tolerancia es para lo que no conocemos; estos
> los conocemos.*
>
> **(b) El cierre de lote llega diario y NO ES UNA TRANSACCIÓN.** No mueve ningún pedido.
> **Se identifica cuando aparezca el primero** — su `payload` crudo queda guardado
> entero en `webhook_events`, que es justamente para lo que la tabla se hizo. Es
> **candidato a disparador de la conciliación diaria** en lugar de un cron a reloj —
> *un disparo que llega cuando el lote de verdad cerró es mejor que uno que adivina la
> hora*. **NO se cablea todavía: primero se mira la forma del evento real.**

**Regla madre: el handler tolera códigos desconocidos sin romper.** La doc de Nuvei tiene al menos un código sin significado definido (`status_detail 30`, "Transaction seated", solo Ecuador). Un código no mapeado **no es un error: es un evento que se registra y no mueve nada**, y dispara aviso a soporte.

Mapa de partida (del plan, sección ④ — a verificar contra la doc viva):

| `status_detail` | Significado | Nuestro estado |
|---|---|---|
| `3` | aprobada | **pagado** |
| `1` · `31` | requiere verificación / OTP | esperando_otp |
| `32` / `33` | OTP validado / no validado | pagado / rechazado |
| `35` `36` `37` `48` | ciclo 3DS | en_desafio |
| `9` `6` `11` `12` | rechazos y fraude | rechazado (con motivo distinto cada uno) |
| `27` `28` | refund pendiente / solicitado | devolucion_en_curso |
| `7` / `34` | refund total / parcial | devuelto |
| `4` | disputa | en_disputa |
| `8` | contracargo | contracargo |
| `29` | anulada | anulado |
| `30` | *(sin definición publicada)* | **desconocido — registra, no mueve** |
| *(status 2)* | cancelación de una aprobada | anulado |

**Toda transición es idempotente.** Aplicar dos veces el mismo evento deja el mismo resultado.

---

## §5 · EL WEBHOOK, EN ORDEN

### §5.0 · PASO CERO — LAS COMPUERTAS PRE-COBRO (E3, 19-ago)

**Fuente: el reverso es MISMO-DÍA (Erick).** Si deshacer un cobro es caro o imposible,
**la plata que no se cobra mal no hay que devolverla.** El débito no se dispara sin
pasar, en orden, TODAS estas compuertas — y cada rechazo tiene su voz (§7):

| # | Compuerta | Si falla |
|---|---|---|
| 0 | **La compra no tiene ya un intento en vuelo** (el candado de la migración 2, verificado también en código) | «Tu pago anterior se está procesando» — jamás segundo débito |
| 1 | **La reserva de stock sigue viva** (no venció el TTL) | Se rearma el carrito contra stock actual; si ya no hay: «producto ya no disponible» (firma S99) |
| 2 | **El monto a debitar == el desglose congelado**, centavo a centavo | No se cobra. Hallazgo rojo a soporte — un monto que divergió del desglose es defecto NUESTRO, no del cliente |
| 3 | **La dirección está dentro de cobertura** | Se corrige antes de cobrar, no después |
| 4 | **El vendedor sigue activo** (cuenta activa, regla 7.13) | No se cobra |
| 5 | **La tarjeta/token existe y está vigente** | Voz de datos inválidos, corregir |

**Regla madre: todo lo que pueda impedir la entrega se verifica ANTES del débito.**
Cobrar y descubrir después es exactamente el caso que ya no podemos deshacer barato.

### §5.1 · Y RECIÉN AHÍ, EL WEBHOOK

1. **Persistir el crudo** antes de razonar sobre él.
2. **Verificar el `stoken`** = MD5 de `transaction_id` + `_` + `application_code` + `_` + `user_id` + `_` + `app_key`. Si no coincide: registrar y **cortar**. No mueve nada.
3. **Deduplicar por `proveedor_transaction_id`.** La doc avisa que el mismo evento puede llegar repetido.
4. **Validar que el monto coincida con el de la compra.** Recomendación explícita de la doc. Si no coincide: registrar como `monto_no_coincide`, **no mover nada**, avisar. Un cobro por un monto que no es el nuestro es el defecto más caro posible.
5. **Aplicar la transición**, idempotente.
6. **Responder 200 rápido.** Si tarda, reintentan con backoff hasta 48 h. Lo pesado va asíncrono.

---

## §6 · LOS CUATRO CASOS

El acta los pide escritos **y probados**. Van con arnés sobre fixtures — no necesitan pasarela.

**① Llega el webhook, el teléfono no volvió.**
El webhook manda. El pedido avanza solo. Cuando la app vuelva, **lee un estado ya movido y no lo re-decide**. Es el caso normal, no el excepcional.

**② Vuelve el teléfono, el webhook no llegó.**
La respuesta síncrona del débito trae status — **es señal optimista, jamás confirmación**. El pedido queda en espera declarada, **con voz propia**: *"estamos confirmando tu pago"*, nunca *"pago rechazado"* ni un spinner mudo. Reconciliación por consulta activa a `GET /v2/transaction/<id>`, con reintentos espaciados.

**③ Llegan los dos.**
El segundo no hace nada, por idempotencia. **Los dos dejan traza** en `webhook_events`. Si el que llega segundo dice algo distinto del primero, es hallazgo: se registra y se avisa, no se sobrescribe en silencio.

**④ No llega ninguno.**
El pedido no avanza. Lo resuelve **un barrido por consulta activa** sobre pagos sin confirmar. Sin ese barrido, un pago cobrado por Nuvei y nunca confirmado queda invisible **con la plata ya debitada al cliente**.

> 🔴 **CADENCIA CORREGIDA — E4 (19-ago): EL BARRIDO ES MISMO-DÍA, no «mayor a un umbral».**
> Fuente: el reverso es mismo-día. Un cobro huérfano detectado **hoy** se reversa;
> detectado **mañana** es plata del cliente retenida y un caso de soporte.
> - El barrido (`GET /v2/transaction/`) corre **varias veces al día**, y **la última
>   pasada corre antes del corte del día de Nuvei**.
> - ✅ **LA HORA YA ESTÁ MEDIDA — y el supuesto quedó REFUTADO** (fuente: **Erick,
>   19-ago, noche**). Los cortes son **17:00 (Medianet)** y **17:50 (Datafast)**.
>   ~~El supuesto declarado de las 22:00 America/Guayaquil~~ estaba **casi seis horas
>   tarde**: la «última pasada» habría corrido **después de los dos cortes**, o sea que
>   el barrido pensado para reversar mismo-día no habría podido reversar nada.
>   **Cadencia que rige:** una pasada **~12:00** y la **última a las 16:15
>   America/Guayaquil** — 45 min de margen antes del corte más temprano.
>   > *Esto es la ley de S84 cobrando de nuevo: el supuesto se declaró CON SU NÚMERO,
>   > y por eso se pudo refutar con un dato. Si hubiera dicho solo «corre al final del
>   > día», nadie habría tenido contra qué contrastarlo y el barrido habría nacido
>   > inútil sin que ningún test lo notara.*
> - Todo hallazgo se registra con su resolución: `confirmado_tardio` ·
>   `reversado_mismo_dia` · `huerfano_escalado` (los nombres los fija la pista contra lo
>   que exista en la base, no contra esta letra).

**Dos casos hermanos que también se prueban:** el **webhook tardío** (puede llegar hasta 48 h después, cuando el pedido ya se resolvió por consulta activa — la idempotencia lo absorbe) y el **webhook duplicado**.

---

## §7 · EL FALLO CON VOZ

**La casa ya pagó por confundir clases de error.** Cada uno tiene voz propia y salida propia:

| Causa | Qué se le dice | Salida |
|---|---|---|
| Rechazo del banco | El banco no autorizó | Probar otra tarjeta |
| OTP incorrecto | El código no coincide | Reintentar el código, con su límite |
| Fondos insuficientes | **Nunca se nombra.** El emisor no autoriza el importe | Otra tarjeta |
| Timeout / sin respuesta | **No es rechazo.** Estamos confirmando | Esperar, con destino claro |
| Tarjeta vencida o datos inválidos | Revisar los datos | Corregir |
| Desconocido | No pudimos completar el cobro, ya lo estamos viendo | Soporte |
| **Compuerta pre-cobro falla** (§5.0 #1-#4) — *fila nueva, E5* | La causa real, **ANTES de tocar la tarjeta**: «el producto ya no está disponible», «tu dirección quedó fuera de cobertura» | Resolver y reintentar — **la tarjeta nunca se enteró** |

**Un timeout dibujado como rechazo hace que el cliente vuelva a pagar algo que ya pagó.** Es la clase de error que cuesta doble.

> **El principio que agrega E5:** el cliente **jamás descubre un problema del pedido a
> través de un cobro fallido o de una devolución**. Lo descubre antes, con su nombre.

---

## §8 · EL PEDIDO QUE CAMBIA SIN QUE NADIE LO TOQUE

Hay **cuatro pedidos clavados en `pagando`** porque no había pasarela. El día que el motor entre, **esa pantalla cambia de comportamiento sin que nadie edite una línea**.

**Un cambio que nadie hizo es el que nadie va a ir a verificar. Se mira a propósito**, con el ojo del founder, y va al gate.

Y `pagando` **es una intención, no un estado** (firma del founder, S100): la letra y el código deben decir lo mismo.

---

## §9 · LO QUE NO ENTRA, Y LA RAZÓN

**El ledger. El devengo. La comisión. La liquidación.**

No es orden de alcance: es una razón medida. `MODELO_FINANCIERO` §3.2 **congela el fee en el evento y prohíbe recalcular eventos viejos**. Hoy conviven **tres números** para la misma comisión — 10 % firmado, 14 % en la letra y en los seeds, 20 % vivo en `seller_comisiones`. **Si el webhook se cablea al ledger antes de que exista un solo número, cada cobro congela una comisión equivocada de forma irreversible por diseño.**

⇒ **El motor termina cuando el pedido queda pagado.** Lo que pasa después con esa plata es S102.

Tampoco entran: el reembolso y la postventa · el catálogo · las cinco deudas vivas de S100d · la recurrencia (depende de MIT, sin respuesta de Nuvei).

> 🔴 **EXCLUSIÓN CONDICIONADA NUEVA — E6 (19-ago).** La política de reembolsos al medio
> de pago original (T&C §9.2) queda **SUSPENDIDA DE REDACCIÓN** hasta la respuesta de
> Erick sobre el refund diferido (anulación mismo-día vs `POST /v2/transaction/refund/`).
> **La pista NO construye ningún flujo de refund por API hasta esa respuesta.**
>
> **El saldo NO está condicionado y se construye como vía por defecto** — su letra propia
> es `docs/LETRA_SALDO.md` (v1.0, 19-ago), nacida por disparo de la regla 7.16 de
> `MODELO_FINANCIERO`. *Esa letra rige con cualquier respuesta de Nuvei: por eso se
> escribió hoy en vez de esperar.* **Nada del saldo se construye en S101** — es de S102.

---

## §10 · PROTOCOLO

- **Una sola pista.** Los pagos no se reparten hasta que el flujo cierre en sandbox. *Cuatro pistas tocando un circuito de dinero es cómo se cobra dos veces.*
- Bitácora `docs/loop/S101-A.md` · commit por pathspec · los cinco frenos.
- **Migrar y publicar piden firma del founder.**
- **Cualquier cosa que toque plata real pide firma explícita, aunque sea de prueba.**
- Los secretos (`app_code`, `app_key` de servidor) viven **solo en secrets de Edge Functions**. Jamás en la app, jamás en el repo. *(Precedente: las credenciales de prueba de Nuvei están commiteadas en su repo público del SDK. Que nunca pase lo mismo con las nuestras.)*
- El **Auth-Token** se genera **en el momento de cada request**: `Base64(APP_CODE;UNIX_TIMESTAMP;SHA256(app_key+timestamp))`, con ventana de **15 segundos**. Relojes desincronizados hacen fallar cobros que no tienen nada malo.

---

## §11 · EL ORDEN DE EJECUCIÓN — **REORDENADO POR E7 (19-ago), con el estado real**

| Paso | Qué | Estado |
|---|---|---|
| 1 | **B0 — el censo** | ✅ **ejecutado**, con hallazgos transpuestos en esta v1.1 |
| 2 | **Buzón desplegado + URL** | ✅ **probado**, secretos validando, URL en manos de Nuvei |
| 3 | **Migración 2** — enmienda `pagos_intentos` (ya NO crea `pagos`) | 🔨 **entregada, sin aplicar** — la corre el founder |
| **3bis** | **Las compuertas pre-cobro (§5.0)** — *paso NUEVO de E3* | pendiente, entra **después** de la migración 2 |
| 4 | La máquina de estados como dato, **con E2 aplicada** | pendiente |
| 5 | El webhook completo — validación, dedupe, transición idempotente | pendiente |
| 6 | Los cuatro casos con arnés, **con la cadencia mismo-día de E4** | pendiente |
| 7 | La escalera de los clavados — **semilla confirmada**: el gate los mira, el corte semilla/real los marca | pendiente |
| 8 | La taxonomía de fallo con voz, **con la fila de E5** | pendiente |
| 9 | El correo de certificación con **DF + código de autorización** | pendiente |
| 10 | El cobro contra sandbox de punta a punta | ⏳ **bloqueado** por registro de callback (Nuvei) |

**Del 1 al 9 no depende de ninguna respuesta de Nuvei.** Solo el 10.

> ⚠️ **Salvo lo que E6 congeló:** ningún flujo de refund por API se construye hasta la
> respuesta sobre el refund diferido. Eso **no bloquea** ningún paso de esta tabla —
> el refund nunca estuvo en el alcance de S101 (§9).

> 🔴 **Nota sobre el paso 7, medida el 19-ago:** los pedidos clavados **se vencen solos**.
> Hay un cron **activo** (job 12, `7 * * * *`) corriendo `expirar_pedidos_sin_pago()`, y
> durante la propia sesión pasaron de 6 a 5 (`09a2f00b` → `cancelado_sistema`).
> **Firma de mesa (19-ago, cierre): camino (a) — se dejan decaer, el cron NO se toca, y
> el gate de la escalera usa un pedido creado FRESCO.** *Un gate montado sobre un
> conjunto que caduca es un gate que un día no se puede correr.*

---

## §12 · LO QUE ESTA SESIÓN DECLARA QUE NO PUDO

Se escribe al cerrar, con nombre y razón. **Se publica lo incompleto, jamás lo falso.**

Hoy ya se sabe uno: **① no cierra sin credenciales de staging verificadas y callback registrada.** Si al cierre siguen faltando, la sesión entrega del 1 al 9 y **lo dice**, en vez de declarar verde un circuito que nunca cerró.

---

## Historial

- **v1.2 (19-ago-2026, noche — las tres calibraciones de Erick):** ① **el supuesto de
  las 22:00 queda REFUTADO por dato**: los cortes son **17:00 (Medianet)** y **17:50
  (Datafast)**, y la última pasada del barrido se fija en **16:15 America/Guayaquil**
  con una previa ~12:00. *El supuesto estaba casi seis horas tarde — el barrido habría
  corrido después de los dos cortes y no habría podido reversar nada. Se pudo refutar
  porque se había declarado con su número.* · ② **recurrencia con Diners CONFIRMADA**
  (OTP en tokenización, débito limpio, las tres marcas): **cero cambio de código**,
  confirma E2 y saca a la recurrencia de «bloqueada por incógnita» sin meterla al
  alcance de S101 · ③ **el webhook notifica TODO evento**: los códigos de reverso
  (27 · 28 · 7 · 34 · 29) pasan a ser **transiciones del mapa, no códigos tolerados**,
  y el **cierre de lote** —diario, y que no es una transacción— queda como **candidato
  a disparador de la conciliación diaria**, sin cablear hasta ver la forma del evento
  real.

- **v1.1 (19-ago-2026, S101 — mesa de la tarde + cierre):** aplica **E1-E7** de
  `docs/ENMIENDA_S101_MOTOR_v1.1.md`, que **se conserva porque el porqué no se borra**.
  **E1** deroga §3 entera — el motor ya existía y la migración 2 **enmienda
  `pagos_intentos`** en vez de crear tablas · **E2** corrige §4: `esperando_otp` y
  `en_desafio` son del **alta de tarjeta**, no del cobro (fuente: Erick) · **E3** agrega
  §5.0, las **seis compuertas pre-cobro** · **E4** cambia la cadencia del caso ④ a
  **mismo-día**, con las 22:00 Guayaquil como **supuesto declarado** hasta medir el corte
  real · **E5** suma la fila de la compuerta a §7 · **E6** suspende la redacción del
  reembolso al medio de pago original y remite el saldo a `LETRA_SALDO.md` · **E7**
  reordena §11 con el estado real y el paso **3bis**.
  **Dos correcciones que la aplicación agregó y la enmienda no podía saber:**
  ① el ítem ① de E1 **se resolvió: `webhook_events` NO es duplicación y se queda**
  (la cardinalidad lo prueba); ② el «UNIQUE primero» **quedó descartado por rojo
  producido** sobre la compra real `fc8e2a85` y **reemplazado por firma de mesa** por
  `UNIQUE (proveedor, proveedor_transaction_id, pedido_id)` parcial.
  La letra vieja va **tachada, no borrada**.

- **v1.0 (19-ago-2026, S101 — apertura):** depositada **VERBATIM** desde la conversación
  de apertura, sin editar una coma. Nació declarando que **ningún nombre de tabla,
  columna o función estaba medido** y que **si la fuente la contradecía, gana la fuente**.
  *Es exactamente lo que pasó: el censo B0 la contradijo en §3 y la letra se enmendó en
  vez de defenderse.*
