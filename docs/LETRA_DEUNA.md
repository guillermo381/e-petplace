# LETRA_DEUNA.md — e-PetPlace · el segundo riel

> **Versión:** v1.7 · **Nace:** 21-ago-2026 (mesa 103) · **Enmendada:**
> 22-ago-2026 (mesa 104) contra el **ambiente QA real** · **Estado:** RIGE —
> firmas ①②③ del founder (§11), la ③ **ya no es supuesto: es hecho
> confirmado por el proveedor**.
> **⚠️ ESTA VERSIÓN CORRIGE AFIRMACIONES DE §2 QUE ERAN FALSAS.** La v1.1 las
> tomó de la doc en papel y las declaró re-verificables; **el censo de la pista
> D contra QA las midió y varias no sobrevivieron.** *La regla del literal
> funcionó exactamente como estaba escrita: gana la fuente viva.* Lo corregido
> va marcado ~~así~~ en su lugar, **no borrado** — quien lea un reporte anterior
> tiene que poder ver que citaba la letra vigente de su día.
> **Fuentes que obedece:** el repo y su bitácora · `LETRA_MOTOR_PAGOS_S101` (el
> motor rige entero) · `LETRA_SALDO` v1.1 · `LETRA_PAGO_CITAS` v1.1 (el patrón
> de sujeto) · `POLITICAS_EPETPLACE` · `MODELO_FINANCIERO` · **la documentación
> oficial de DeUna** (Solicitud v003 ago-2023 + doc técnica de APIs, recibidas
> 20-ago-2026). **Si esta letra contradice a cualquiera, gana la fuente.**
> **Qué fija:** el contrato de DeUna como MEDIO DE PAGO ante el motor. **Qué no
> fija:** nada del motor (probado) · los sujetos cobrables (ya tienen letra) ·
> los nombres exactos de tablas, columnas y funciones — **los fija la pista
> contra la base**; esta letra fija el contrato, no los nombres.
> **⚠️ Todo dato del proveedor citado acá sale de SU doc. En la primera sesión
> con ambiente QA, cada afirmación se re-verifica contra el ambiente real
> (regla del literal: gana la fuente viva sobre el papel).**

---

## §1 · QUÉ ES DEUNA ANTE EL MOTOR — un medio, jamás un sujeto

DeUna entra como **riel de pago** (segundo proveedor), no como objeto cobrable.
Los sujetos siguen siendo los que ya tienen letra: **compra/pedido** (despensa),
**cita** (S101-C), y las tres puertas de D-856 cuando su letra rija. La hoja de
medios de pago gana **una fila** («Deuna»); el puntero de `pagos_intentos`, el
invariante «exactamente uno», el desglose congelado y las compuertas pre-cobro
**no cambian una coma**.

La diferencia de naturaleza, dicha una vez: Nuvei es **pull** (nosotros
debitamos una tarjeta tokenizada); DeUna es **push** (el cliente paga desde SU
app Deuna y nosotros esperamos la verdad del servidor). Por eso en DeUna **no
existe alta, no existe token, no existe OTP** — la fila «Deuna» en «Cómo
quieres pagar» no gestiona nada: se elige y se paga.

## §2 · EL CONTRATO DEL PROVEEDOR (lo medido de su doc — se re-verifica en QA)

- **Ambientes:** QA `apis-merchant.qa.deunalab.com` · PDN
  `apis-merchant.pdn.deunalab.com`.
- **Autenticación:** headers `x-api-key` + `x-api-secret` en cada request.
  **`x-api-key` es la *subscription key*** (medido: no es un identificador de
  comercio). **Los secretos viven SOLO en secrets de Edge Functions** — jamás
  en cliente, jamás en el repo (la ley de Nuvei rige idéntica).
- **Rutas reales, medidas contra QA:** **`/merchant/v1/payment/*`** —
  ~~`/merchant/api/v1/payment/*`~~. *La v1.1 tenía **dos rutas mal**: el
  `request` sin `api` y el `info`/`refund` con él. Ninguna de las dos formas
  mezcladas existe.*
- **`POST /merchant/v1/payment/request`** — crea la solicitud. Campos que esta
  letra fija: `qrType: "dynamic"` (una transacción única con vencimiento) ·
  `format` según §5 · `amount` = **el total del desglose congelado, centavo a
  centavo** (compuerta 2 del motor rige) · `detail` ≤ 50 (no se muestra al
  cliente; sin datos personales) · la referencia corta según §4 ·
  `expiredTime` según §6 · `callbackUrl` según §5.
- 🔴 **EL CAMPO DE LA REFERENCIA SE LLAMA `idTransacionReference`** —
  ~~`internalTransactionReference`~~. **Es un typo del proveedor y se respeta
  tal cual**: el nombre del campo es parte de su contrato, no de nuestra
  ortografía. *Corregirlo «bien» es que la petición falle.* Se escribe con un
  comentario al lado en todo lugar donde aparezca, para que nadie lo «arregle».
- **Respuesta:** `transactionId` (UUID de DeUna) **se persiste
  obligatoriamente** en el intento — es la llave de consulta y reverso.
- **`POST /merchant/v1/payment/info`** — consulta activa. **`idType` viaja como
  TEXTO, `"0"` / `"1"`, jamás como número.** Se consulta por `idType "0"` (su
  `transactionId`); el `"1"` (nuestra referencia) queda de respaldo.
- 🔴 **`NOT_FOUND` NO EXISTE. Es la corrección más cara de esta versión.**
  Medido contra QA: **una transacción inexistente devuelve `200` con estado
  `PENDING`, `amount = 0` y `date = ""`.** ~~`NOT_FOUND` (no existe o pasaron
  >7 días)~~.

  > ### **El proveedor no distingue «todavía no pagó» de «esto no existe»: las dos son `PENDING`.**
  >
  > *Un fantasma tiene la forma exacta de un pago en curso.* ⇒ **el corte de
  > huérfanos lo pone NUESTRO reloj —el hold y la ventana de 7 días—, jamás un
  > estado del proveedor.** Esperar un `NOT_FOUND` que nunca llega es un
  > barrido que no termina nunca.

  🔴 **ENMIENDA 24-ago-2026 — LA FRASE DE ARRIBA ERA MÁS CIERTA DE LO QUE SU
  AUTOR SABÍA, Y EL PÁRRAFO QUE LA PRECEDE INDUCE A LEERLA MAL.**
  *(Medido por la pista D contra QA, sobre una transacción **REAL recién
  creada**, no sobre un id inventado.)*

  **Lo medido:** una transacción **real y todavía no pagada** devuelve
  **`amount = 0`, `date = ""` y `transferNumber = ""`** — *exactamente la misma
  forma que arriba se describe como la del fantasma.*

  ⇒ **La lista «`PENDING` + `amount 0` + `date ""`» NO ES LA FIRMA DE UN
  FANTASMA: es la firma de CUALQUIER transacción no pagada.** Leerla como
  distintiva —que es como está escrita— lleva a construir un discriminador que
  no puede funcionar.

  > ### **No hay dos estados que se confundan: hay UN estado con dos causas.**
  > **Y la consecuencia es sobre el futuro, no sobre el código de hoy: ningún
  > campo del proveedor va a poder distinguirlos NUNCA** — no es que todavía no
  > encontramos el campo bueno. *Quien vuelva a este problema no tiene que
  > buscar mejor: tiene que dejar de buscar.*

  ✅ **Lo que NO cambia, y conviene decirlo para que nadie lo reabra:** la
  conclusión de este bullet **sigue en pie** —el corte de huérfanos lo pone
  nuestro reloj— **y la regla de aprobación de abajo (`APPROVED` Y `amount > 0`)
  también**, porque discrimina *aprobado* de *no aprobado*, que sí son dos
  estados distintos, y sigue siendo fail-closed.
  *Lo que caducó es la premisa, no la conclusión.* **Es `L-418` en otra forma:
  la letra tenía razón por un motivo que no era el suyo, y eso solo se descubre
  yendo a buscar el fundamento de lo que ya está funcionando.**
- 🔴 **APROBADO EXIGE DOS COSAS: `APPROVED` **Y** `amount > 0`.** *Con el
  fantasma devolviendo `amount = 0`, un solo campo no alcanza para afirmar que
  entró plata.* **Fail-closed: si el monto es 0, no está aprobado, diga lo que
  diga el estado.**
- **Estados vivos:** `APPROVED` · `PENDING` · `REVERSED` · `REVERSED_FAILED`.
- ⏱️ **RATE LIMIT ~1 request/segundo.** El barrido **espacia sus consultas**, y
  **un `429` NO es un fallo del pago**: es nuestra prisa. Se reintenta con
  espera; jamás se traduce a rechazo ni a huérfano. *Un límite de tasa leído
  como veredicto del proveedor inventa fracasos que no ocurrieron.*
- **Webhook de pagos exitosos:** URL https (sin IP, ≤200 chars), con **headers
  opcionales** (key ≤50, value ≤100) que son nuestro único mecanismo de
  autenticación → §7. Reintentos del proveedor: 3, cada 30 s, solo ante el
  primer fallo. **El payload trae `customerIdentification` (cédula) y
  `customerFullName`** → §9.
- **`POST /merchant/v1/payment/refund`** — devolución **solo del monto total**
  (sin parciales), ~~**solo mismo día**~~ **dentro de 24 HORAS** *(enmienda
  24-ago-2026 — la ventana es POR RIEL: ver §8)* → §8.
  `transactionReverseId` se persiste.
  🔴 **El refund se pide por la MISMA PAREJA `idType` + id que el `info`** —
  ~~por `transactionId` suelto~~. *Es el mismo contrato de identificación en
  las tres rutas; tratarlo distinto en el reverso era una asimetría inventada
  por nosotros.*
- **Tarifario firmado en la solicitud comercial: 2 % + IVA** sobre ventas
  procesadas (factura mensual 15-20, corte 10 a 10, débito automático el 25).
  Este número entra a `MODELO_FINANCIERO` / letra v3.0 como **costo de riel**
  — no confundir jamás con la comisión de plataforma (10 %, fee_configs).

## §3 · EL CIRCUITO — reusado entero, con sus deltas declarados

El circuito es el del motor, pieza por pieza:

1. **Compuertas pre-cobro (E3) corren idénticas** — todas menos la #5
   (tarjeta/token vigente), que **no aplica**: no hay tarjeta. Ninguna
   compuerta nueva nace.
2. **Puerta única server-side** (extensión de la puerta existente o hermana con
   el mismo contrato: la sesión es la autorización · el monto jamás viaja del
   cliente · pertenencia verificada · `pagador_user_id` de la sesión, explícito
   — la letra de la cura 3 rige). La puerta crea el intento
   (`proveedor='deuna'`), llama `payment/request`, persiste `transactionId` y
   devuelve a la pantalla **el código y un `expira_en` TIMESTAMP absoluto** —
   jamás una duración en segundos. *Un «te quedan 180 s» se desincroniza con el
   viaje de red, con la pantalla dormida y con el reloj del teléfono; un
   instante absoluto no. La cuenta regresiva la dibuja la pantalla restando
   contra ese instante.*
3. **La espera con voz** — la misma pantalla que espera hoy, con voz nueva:
   «Abrí tu app Deuna y confirmá el pago» + botón que dispara el deeplink.
   Jamás spinner mudo, jamás rechazo por timeout: si el TTL vence, la voz lo
   dice con su nombre (§6).
4. **Confirmación:** webhook (§7) **y/o** consulta activa — la que llegue
   primero. **El actuador solo transiciona con verdad verificada del
   servidor**; la pantalla pasa sola a pagada, jamás declara.
5. **Consulta activa + barrido:** el barrido existente gana los intentos
   `deuna` pendientes. **Toda su ventana corre DENTRO de los 7 días** — y
   **el corte lo pone NUESTRO reloj**, porque ~~pasado eso el proveedor
   responde `NOT_FOUND`~~ **el proveedor nunca dice que algo no existe**
   (§2: el fantasma vuelve `PENDING`). Vencida la ventana sin `APPROVED` con
   monto > 0, el hallazgo se escala a soporte con nombre
   (`huerfano_deuna_vencido` o el que la pista fije). **El barrido espacia sus
   consultas por el límite de ~1 req/s, y un `429` no cuenta como intento
   fallido.**

   ⏰ **HORA DECLARADA (firma del founder, 22-ago-2026): `03:00` de Guayaquil**
   —lejos del cron de avisos de las 08:00—. **Su porqué, porque una hora sin
   argumento se cambia sin argumento:**
   · **El barrido es RED DE SEGURIDAD, no camino principal.** El webhook y la
     consulta activa resuelven en segundos; *si el barrido fuera lo que hace
     llegar la plata, el problema no sería su horario.*
   · **A esa hora su ventana de reintentos no compite con clientes pagando en
     vivo** — y el rate limit de ~1 req/s se reparte entre los dos si coinciden.
   · **Lo que escale a soporte espera igual a la mañana del founder**, así que
     correrlo antes no adelanta ninguna resolución: solo adelanta el hallazgo.
6. **Comprobante por correo** — el requisito de certificación de la casa rige
   para todo medio: id de transacción (su `transactionId`) + `transferNumber`
   (el análogo del código de autorización). Va **a quien pagó** (dictamen
   S102, cura 3).

## §4 · LA REFERENCIA CORTA — el delta más filoso

**`idTransacionReference`** *(el typo es del proveedor — §2)* admite
**≤ 20 caracteres** ~~< 20~~ — **firmado por la mesa el 22-ago sobre el barrido
de la pista D**, que es la fuente:

> `"internalTransactionReference must be at most 20 characters long."`
> **20 pasa · 21 · 25 · 30 · 36 · 40 · 50 · 64 · 100 rebotan, todos con ese
> mismo literal.** *Un solo 21 habría probado que 21 no entra; el barrido
> prueba que el tope es 20 y que no hay un segundo tope más arriba.*

> ### 🔴 **Y LA RAZÓN POR LA QUE UN CARÁCTER IMPORTA: un CHECK más estricto que el proveedor no es «más seguro» — es una regla NUESTRA disfrazada de regla SUYA.**
>
> *El día que alguien necesite el carácter 20 va a ir a buscar el límite a la
> doc equivocada, y la doc equivocada vamos a ser nosotros.* **Todo `CHECK` del
> generador dice `<= 20`.**
Nuestros UUID (36) **no caben** — el `dev_reference = compra` de Nuvei no se
replica acá.

La letra fija el contrato del generador; la forma exacta la fija la pista:

- **Única** (colisión imposible por construcción, no por probabilidad ingenua),
  **determinística por intento**, **< 20 chars**, **sin dato personal ni dato
  de negocio adivinable** (no es un contador global expuesto).
- **Se resuelve a intento por TABLA, jamás por parsing** del string.
- El candado de idempotencia se replica con el invariante del motor: **una
  transacción del proveedor jamás se reaplica sobre otro sujeto** — UNIQUE
  sobre (proveedor, transactionId, sujeto), el patrón ya probado en S101.

## §5 · EL CÓDIGO DE 6 DÍGITOS — el formato de v1 *(firma ① del founder, 21-ago)*

- **El cliente paga con el CÓDIGO ÚNICO de 6 dígitos** (`numericCode`): la
  pantalla de espera lo muestra grande, con su cuenta regresiva, y la voz
  dice qué hacer: «Abrí tu app Deuna e ingresá este código».
- 🔴 **Reloj del código: 3 minutos PORQUE LOS PEDIMOS NOSOTROS** —
  ~~fijos, no configurables (literal del proveedor)~~. **`expiredTime` es un
  campo del request**, medido por D y consumido por C: *la v1.1 leyó el papel y
  llamó «límite ajeno» a una elección propia.*

  > **La diferencia no es de trivia: cambia de quién es la decisión.** Un
  > límite del proveedor no se discute; **una elección nuestra se revisa** — y
  > mientras se creyó ajena, nadie iba a preguntarse si 3 minutos es el número
  > correcto.

  **Rige: pedimos 3 minutos, por elección nuestra** — coherente con su doc y
  **protege el hold** (dos relojes, y el del código tiene que morir antes).
  **Decisión revisable, no límite.**
- 🔴 **La pantalla lee el instante que devuelve el servidor, JAMÁS una
  constante.** *Si el número vive en dos lugares, el día que cambie uno la
  cuenta regresiva miente sin que nadie lo note.* La puerta devuelve `expira_en`
  (§3.2) y la pantalla resta contra eso. La ley que se deriva: **el código vive
  lo que el servidor diga; la sesión de pago vive lo que viva el hold** (§6). Código vencido con hold vivo →
  botón «Generar un código nuevo» (nueva `payment/request`, nuevo intento
  del candado o el mismo según lo que el censo determine — la pista mide el
  patrón contra el UNIQUE). Hold muerto → no nacen más códigos (compuerta 1).
- **Transposición técnica:** la solicitud pide `format: "5"` con
  `qrType: "dynamic"` (obligatorio para código, literal de su doc) — una
  sola llamada devuelve código + QR + deeplink. **La UI de v1 muestra SOLO
  el código** (la firma manda); deeplink y QR quedan en el crudo como
  reserva sin pantalla — encenderlos un día es decisión de producto, no
  obra de motor.
- **`callbackUrl` no se usa en v1** (es del flujo deeplink). Si la reserva
  se enciende, rige la ley de la vuelta cosmética: el callback jamás
  confirma nada — al volver, la pantalla consulta al servidor.

## §6 · TIEMPO DE VIDA Y ESTADOS CON VOZ

- **Ley de experiencia** *(firma ② del founder, 21-ago: «funciona exactamente
  igual que si fuera tarjeta»)*: la fila «Deuna» vive en la misma selección
  «Cómo quieres pagar», la espera es la misma pantalla con voz, la
  transición a pagada es sola, y el comprobante es el mismo — **el cliente
  jamás aprende un circuito distinto por cambiar de medio.**
- **El hold del sujeto gobierna la sesión de pago** (reserva de stock ·
  hold de agenda): mientras viva, el cliente puede regenerar códigos; muerto
  el hold, muere la sesión (compuerta 1, rearme declarado). **Cada código
  vive sus 3 minutos fijos** (§5) — dos relojes, dos voces, jamás
  confundidos.
- Mapeo de estados a la taxonomía de voces del motor (§7 de la letra madre
  gana filas):

| Estado | Estado del intento | La voz |
|---|---|---|
| `PENDING` con código vivo | en vuelo | «Ingresá el código en tu app Deuna» + cuenta regresiva |
| Código vencido, hold vivo | en vuelo, regenerable | «El código venció — generá uno nuevo» |
| Hold vencido | vencido | La del rearme existente (se rearma contra stock/agenda vigente) |
| `APPROVED` **y `amount > 0`** verificado | pagada | La del éxito vigente |
| ~~`NOT_FOUND` dentro de ventana~~ **`PENDING` con `amount = 0` y `date = ""`** | **fantasma — no es un pago** | 🔴 **jamás voz de éxito, jamás silencio.** El corte lo pone nuestro reloj (hold + 7 días), nunca el proveedor |
| `429` del proveedor | **sin cambio de estado** | Ninguna al cliente — es nuestro límite de tasa, no su respuesta |
| `REVERSED` | reversada | La del reverso, con su camino (§8) |
| `REVERSED_FAILED` | 🔴 hallazgo | Caso de soporte con nombre — **jamás se resuelve solo** |

## §6bis · EL LUGAR DE DEUNA EN LA HOJA — primera y por defecto
*(firma del founder, 22-ago-2026)*

> ### **DeUna es la PRIMERA opción de «Cómo quieres pagar» y el medio POR DEFECTO. La elección previa del cliente gana sobre el default.**

**El argumento de negocio, escrito para que la posición no se discuta cada vez:**
· **costo de riel 2 % + IVA**, contra el de tarjeta;
· **no exige alta ni token** — se elige y se paga, sin 3DS ni OTP;
· **el cliente ecuatoriano ya tiene la app.**
*No es una preferencia estética: es el medio más barato para la casa y el de
menos fricción para la familia.*

**«Por defecto» y «primera» no son lo mismo y las dos rigen:** primera es
**posición**; por defecto es **preselección**. Y **la elección previa del cliente
le gana al default** — *un default que pisa lo que la persona ya eligió deja de
ser una sugerencia y pasa a ser una corrección.*

### Sus TRES BORDES, y ninguno es opcional

| # | borde | por qué |
|---|---|---|
| ① | **No elegible sin `pointOfSale`** | es el bloqueante medido del riel (§12.1). *Ofrecer como default un medio que no puede formar la solicitud es prometer el camino más barato y entregar un rebote.* |
| ② | 🔴 **JAMÁS en cobro recurrente** | DeUna es **push**: exige que la persona confirme en su app. **No hay cobro sin presencia posible** (§8 de `LETRA_COBRO_RECURRENTE`). *Ser el default del pago único no lo vuelve default de la serie* — y ahí el default sigue siendo tarjeta tokenizada, **y así se le dice al elegir medio.** |
| ③ | **Cae a tarjeta en pago mixto con saldo** cuando ese motor exista (S102) | y **la pantalla lo DICE con voz**, jamás cambia el medio en silencio. *Un default que se reemplaza solo sin avisar es la forma más barata de que alguien pague con lo que no quería.* |

### ⚠️ ESTADO MEDIDO DE LA PANTALLA AL FIRMARSE ESTO — la letra y la superficie están invertidas

**Medido en el aparato el 22-ago, sobre `main`:** la fila «Deuna» **existe** en la
hoja, **y está ÚLTIMA** —debajo de las seis tarjetas guardadas—, **apagada**, con
voz de próximamente: *«Muy pronto vas a poder pagar desde tu app Deuna.»*
**Y queda debajo del fold: hay que scrollear para verla.**

> **No es un defecto de quien la construyó:** la letra vigente ese día **no decía
> nada del orden**, así que ponerla al final junto a «Agregar tarjeta» era una
> lectura razonable. **Lo que cambió es la letra.**

⇒ **Esta firma reordena la hoja**, y su ejecución es de la pista de superficie.
*Se declara acá para que nadie lea la pantalla de hoy como si ya cumpliera esta
sección.*

> ## ☠️ **NOTA DE VENCIMIENTO — 24-ago-2026: EL RECUADRO DE ARRIBA YA NO DESCRIBE LA PANTALLA.**
> **La fila de DeUna YA ES LA PRIMERA** (firma del founder, 24-ago). Lo que el
> recuadro mide —última, apagada, bajo el fold— **fue cierto el 22-ago y dejó de
> serlo.** Se conserva tachado y no borrado: *dice qué había que cambiar y que
> se cambió.*
>
> **Por qué se marca en vez de eliminarse, que es la parte que sirve:** un
> «estado medido» sin fecha de vencimiento **se sigue leyendo como presente**.
> Quien abriera esta sección mañana leería que la superficie contradice la letra
> —y saldría a arreglar algo que ya está arreglado—, que es exactamente el costo
> que `L-395` midió: *un puente que sobrevive a su río manda al próximo a
> construir otro.*

## §7 · EL WEBHOOK — señal, no verdad

Su autenticación son **headers estáticos** (nuestra key/value registrada) —
más débil que el HMAC de Nuvei. Por eso esta letra ordena defensa en dos
capas, y la segunda no es opcional:

1. **Secreto propio en header**, generado por nosotros, registrado con DeUna,
   validado en el buzón, **rotable** (vive en secrets, jamás en código).
2. **El webhook jamás transiciona por sí solo:** ante un webhook válido, el
   handler **verifica por consulta activa** (`payment/info` con el
   `transactionId` persistido) y solo la respuesta verificada del proveedor
   alimenta al actuador (que sigue aceptando solo eventos SERVER). Un webhook
   con secreto correcto y datos falsos muere en la consulta.

Dedupe, registro crudo y tolerancia de reintentos: el patrón del buzón de
Nuvei rige idéntico (mismo contrato, buzón hermano o extendido — la pista
mide qué existe).

## §8 · EL REVERSO — **24 horas en DeUna · mismo día en Nuvei**, total, sin parciales

- **Por API:** solo el monto **total**, y ~~solo **mismo día**~~ **dentro de la
  ventana de SU RIEL** *(DeUna 24 h · Nuvei mismo día — firma 24-ago, abajo)*.
  Los parciales NO existen en este riel.
- 🔴 **LA VENTANA ES POR RIEL — firma del founder, 24-ago-2026.**
  **DeUna: 24 HORAS** *(respuesta del proveedor del 24-ago; verbatim en
  `docs/DEUNA_RESPUESTA_2026-08-24.md` §1.4).*
  **Nuvei: MISMO DÍA** *(literal de Erick).*
  *No es un detalle de implementación: es el plazo que la casa le promete al
  cliente, y **difiere según por dónde pagó**. Una sola frase de superficie que
  no nombre el riel va a ser falsa para la mitad de la gente.*

  ⚠️ **CÓMO SE LLEGÓ ACÁ, y se escribe porque cambia el trato de toda respuesta
  futura del proveedor.** Esto decía, hasta hoy:
  > ~~✅ **RESUELTO — ya no es supuesto.** Ambigüedad de su propia doc: un
  > recuadro dice «dentro de las 24 horas», otro «solo mismo día». **El
  > proveedor lo confirmó por mensaje: MISMO DÍA.**~~

  **Eso se escribió el 22-ago y era cierto ese día.** El **24-ago el mismo
  proveedor respondió 24 horas**. ⇒ **no fue su documentación la que era
  ambigua: fue el proveedor el que dio dos respuestas distintas a la misma
  pregunta, con dos días de diferencia.**

  > ### **La más nueva rige; la vieja no se borra — un proveedor que se contradice es un dato sobre el proveedor.**
  > **Toda respuesta suya se cita con su fecha y su canal.** *«DeUna dijo» sin
  > fecha ya significó dos cosas opuestas en esta misma sección.*

  ✅ **Efecto sobre las compuertas pre-cobro, medido y no supuesto:**
  `LETRA_MOTOR_PAGOS_S101` §5.0 las funda en *«el reverso es MISMO-DÍA»*.
  Para DeUna la ventana real resultó **más ancha, no más angosta** ⇒ el motor
  venía siendo **más conservador de lo necesario**. *No hay defecto que curar
  acá: hay margen que nadie estaba usando.* **§5.0 no se toca en esta pasada.**
- **La vía automática es el saldo** (`LETRA_SALDO` rige — segunda
  ratificación medida de la arquitectura saldo-céntrica): cancelaciones en
  ventana acreditan saldo; el reverso al medio original es vía manual
  (API si está dentro de la ventana de su riel —§8— y por el monto total;
  pasado eso, gestión administrativa por
  soporte, declarada).
- `REVERSED_FAILED` (el reverso que DeUna no pudo acreditar) es **caso de
  soporte 🔴 con registro** — plata del cliente en el limbo jamás se archiva
  sola.

- 🔴 **`status: true` DEL REFUND NO SIGNIFICA QUE SE REVERSÓ NADA.**
  *(Medido por la pista D contra QA, 24-ago-2026.)*
  Un `refund` sobre una transacción **que nunca se pagó** devuelve **`200` con
  `status: true`** y el mensaje *«The QR with id 4262774 has been successfully
  cleaned»*, con **`transactionReverseId` en `null`**.

  > ### **El discriminador es `transactionReverseId`, jamás `status`.**
  > *Quien lea `status` como éxito va a marcar REVERSADA una transacción que
  > nunca tuvo plata* — y eso escribe una devolución que no existió en el
  > registro de un cliente. **Sin `transactionReverseId` no hubo reverso, diga
  > lo que diga el status.**

  ⚠️ **Y el `4262774` de ese mensaje es NUESTRO `pointOfSale`, no la
  transacción.** *La respuesta habla de «limpiar el QR» de un id que resultó ser
  el del punto de venta entero.* **No se volvió a ejercer hasta saber qué
  limpia**, y esa cautela es la correcta: **es la única pregunta abierta cuyo
  peor caso es dejar el punto de venta inutilizable.**

- ⚠️ **`REVERSED` y `REVERSED_FAILED` NO SE PUDIERON EJERCER, y se declara en
  vez de darse por probado:** `refund` exige una transacción **aprobada**, y
  aprobar exige que **una persona pague desde su app**. El proveedor dijo el
  24-ago que los reversos **se pueden simular** (`L-418`: con su fecha y su
  canal) **pero no dijo cómo** — y ésa es la pregunta que queda.

### 🔴 QUIÉN LO CONSTRUYE — dictamen de mesa, 22-ago-2026

**Lo levantó la pista D en su inventario, y con razón: no tenía dueño, y las dos
letras discrepaban.** Esta decía *«vía manual»* sin decir quién la hace;
`LETRA_MOTOR_PAGOS_S101` §9 **excluía el reembolso de su alcance**. *Entre las
dos, nadie lo construía — y eso no se descubre hasta que alguien pregunta cómo
se devuelve un cobro.*

| | |
|---|---|
| **El refund por API es de la PISTA DEL RIEL (D)** | es **una llamada al proveedor con su autenticación y su ventana** (24 h en DeUna, §8) — misma clase que la solicitud y el buzón, no una pieza de motor |
| **Lo que NO es de D** | **cuándo se reversa y qué recibe el cliente** — ya firmado en `LETRA_SALDO`: **vía automática = saldo · medio original = vía manual** |
| **NO entra en el v1** | el reverso por API es **camino manual de soporte**: se construye **después** del circuito de cobro |

> ### 🔴 ENMENDADO POR FIRMA DEL FOUNDER — 25-ago-2026
> ~~**NO entra en el v1** — el reverso por API es camino manual de soporte.~~
> **EL REVERSO PASA A SER REQUISITO DE CERTIFICACIÓN.** *El banco exige que el
> modelo de reverso sea NUESTRO, sobre todo para las pruebas productivas con
> tarjetas reales.* **`D-888` pasa a bloqueante** — dueño **D** para el riel,
> **A** para el motor.
>
> **Lo tachado no se borra:** era la letra vigente hasta hoy, y **`D-923` se
> apoya en ella para declarar que el actuador no estaba incompleto sino fuera de
> alcance.** *Borrarla convertiría una decisión en un olvido.*
>
> **Y con tres datos de Erick que la construcción obedece, y que son del
> proveedor y no nuestros:**
> · **el reverso en Ecuador es SIEMPRE TOTAL** — no hay parcial ⇒ el motor **no
>   toca el desglose congelado**: revierte el intento entero. *Es restricción del
>   país, no decisión nuestra: si algún día cambia, que se sepa qué la sostenía.*
> · **la ventana cierra a las 17:00 `America/Guayaquil`**, no «mismo día
>   calendario» ⇒ **es un reloj con huso, y se construye como restricción del
>   motor.** *El huso ya está expresado en el cron del recurrente: se reusa.*
> · **se puede ejercer en sandbox**: débito y después llamada al API de reverso.


*Dato bueno de D: `transactionReverseId` **ya tiene columna esperándolo** en su
M2, así que el día que se construya **no pide migración**.*
- La promesa exacta de cara al cliente (plazos, texto de T&C §9.2) es de la
  **letra v3.0 / S102**, con este dato adentro.

## §9 · EL DATO PERSONAL NUEVO

El webhook y la consulta traen **cédula y nombre completo del pagador**
(`customerIdentification`, `customerFullName`, `ordererName`/
`ordererIdentification`). Ley:

- Se persiste **solo en el crudo del buzón** (payload_crudo con dueño y
  retención — capítulo de la letra v3.0; D-861 rige). **No se cruza con
  perfiles, no alimenta producto, no se muestra en UI** — es dato del riel
  para conciliación y disputa, nada más.
- **Jamás en logs** de edge functions (el censo CT rige).
- D-405 gana a DeUna en su lista de encargados/transferencias cuando el riel
  encienda.

## §10 · LO QUE NO ENTRA EN v1

**UI de deeplink y de QR** (quedan en el crudo como reserva sin pantalla —
encenderlos es decisión de producto futura) · QR estático / cajas físicas ·
split de pagos · pagos mixtos saldo+Deuna (motor de saldo, S102) ·
producción (exige afiliación firmada + cuenta propia en Banco Pichincha +
credenciales PDN — carril externo del founder) · cualquier construcción
antes de las credenciales QA.

## §11 · FIRMAS

| # | Qué | Estado |
|---|---|---|
| ① | Formato v1: **el código de 6 dígitos** — «por el tipo de comercio que somos» (literal founder). Transposición: `format:"5"` + `qrType:"dynamic"`; la UI muestra SOLO el código; deeplink/QR reserva sin pantalla | ✅ **FIRMADA — founder, 21-ago-2026** |
| ② | **La experiencia es idéntica a pagar con tarjeta** — misma selección, misma espera con voz, misma transición sola, mismo comprobante. El hold gobierna la sesión; el código vive sus 3 min fijos | ✅ **FIRMADA — founder, 21-ago-2026** |
| ③ | Reverso: ~~supuesto declarado~~ ~~**mismo día — CONFIRMADO por el proveedor (22-ago)**~~ ☠️ **ENMENDADA 24-ago: la ventana es POR RIEL — DeUna 24 h, Nuvei mismo día (§8).** *El proveedor dio dos respuestas distintas con dos días de diferencia; rige la del 24-ago* | ✅ **FIRMADA — founder, 21-ago · CONFIRMADA — proveedor, 22-ago · ENMENDADA — founder, 24-ago** |
| ④ | Todo lo demás | Rige por letra ya firmada (motor · saldo · citas · curas S102) |

> **Esta letra no tiene firmas pendientes: RIGE completa.**

## §12 · PREGUNTAS ABIERTAS AL GRUPO DE SOPORTE (se preguntan, no se adivinan)

**Quedan CUATRO.** *~~La 1 (ventana del refund)~~ la contestó el proveedor por
mensaje: **mismo día** (§8). Las otras cinco se re-ordenan y una se reescribe,
porque el censo contra QA cambió lo que hay que preguntar.*

1. 🔴 **`pointOfSale`: ¿qué valor corresponde a un canal digital (app), y quién
   lo emite?** — **es el BLOQUEANTE del riel**, no una duda fina: sin él la
   solicitud no se puede formar.
2. ¿Cómo se **registra y rota** la URL del webhook y sus headers en QA y PDN?
3. ¿Existe firma/autenticación del webhook **más fuerte** que headers
   estáticos?
4. ¿El ambiente QA permite **simular** `REVERSED` y `REVERSED_FAILED`?

**Y la que dejó de ser pregunta porque se midió** *(la vieja 6 —regenerar un
código vencido)*: ya no se pregunta si la anterior queda `NOT_FOUND`, **porque
`NOT_FOUND` no existe** (§2). Lo que la pista mida sobre regeneración entra
como dato, no como consulta.

## §13 · ORDEN DE CONSTRUCCIÓN (cuando lleguen las credenciales — sesión propia)

1. **Censo** contra la base y el ambiente QA (cada afirmación de §2
   re-verificada; L-330 rige: control declarado junto a cada medición).
2. **Migraciones SIN aplicar** con reversa: fila del medio · columnas de
   proveedor que falten · UNIQUE del candado (§4).
3. **Edge functions** (solicitud + buzón), secretos en secrets, referencia
   corta con su tabla.
4. **Arnés camino real** — la pantalla que la familia usa, con QA de DeUna
   punta a punta; el discriminador es la verdad verificada del proveedor,
   no el webhook.
5. **Gates founder** por tanda, protocolo vigente (autorización → ejecución →
   evidencia).

---

## §13ter · LO QUE S103 ENMENDÓ EN EL RIEL *(S103-A + S103-D, 22-ago-2026)*

> **Donde esta letra y el código discrepen, gana el código.**

### 🔴 El gate de autenticación DEJÓ DE LEER UN CAMPO DE LOG

**§7 describe la capa ② como *«la marca `verificado=si` sólo la escribe el buzón
después de que `payment/info` confirmó»*.** Eso **ya no vive en `detalle`.**

**El defecto, reproducido en SELECT puro:** `detalle` es texto libre y el buzón
escribe ahí `analisis_fallo: ${String(e)}` ⇒ **un mensaje de excepción
autenticaba el evento** — y no sólo en DeUna: **Nuvei tenía la misma forma.**

> **Un campo que un humano lee para DIAGNOSTICAR y una función lee para AUTORIZAR
> tiene dos dueños con intereses opuestos — y el que escribe para diagnosticar no
> sabe que está firmando.**

**Severidad acotada, medida:** sin `stoken_valido` el gate da `false` en los
cinco casos ⇒ **quien lo use ya tiene el secreto.** *Erosión de defensa en
profundidad, no puerta abierta.* **(Reportarlo sin esa cota lo habría inflado, y
eso es defecto de reporte, no de medición.)**

**El gate vigente, en columnas** (`20260822260000`):

```
deuna → coalesce(stoken_valido,false) AND verificado IS TRUE
nuvei → coalesce(stoken_valido,false) AND credencial = 'SERVER'
else  → false   (fail-closed: un proveedor que nadie enseñó no se autentica)
```

**`verificado` tiene TRES estados y no dos** (decisión de D): **NULL** = sin
veredicto, todavía no preguntamos · **`false`** = preguntamos y no confirmó ·
**`true`** = `payment/info` confirmó con monto. *Colapsar los dos primeros haría
que un secreto inválido se vea igual que un evento sin analizar.*

⚠️ **Y `origen` (`webhook · barrido · consulta_activa`) ya existe** para que el
aplicador del barrido autentique **honestamente**. **Su rama del gate NO está
escrita** — sería puerta sin motor. ⛔ **Jamás `stoken_valido = true` desde el
barrido: sería firmar una verificación que no ocurrió.** El barrido no tiene
header, y la columna queda NULL con su significado correcto.

### 🔴 El actuador que este riel usa ESTABA MUERTO

`aplicar_evento_de_pago` abortaba en su **primer gate**, en **toda llamada**,
para **los dos proveedores** — `cannot cast type record to webhook_events`.
**Nunca fue llamado por un evento legítimo**, así que no hubo síntoma. Curado en
`20260822250000`; **daño CERO, medido.**

*Lo digo en esta letra porque la conclusión toca al riel entero:* **cuando D
declaró el actuador «vivo, lee `info`, fail-closed sin ella», la lectura del
código era CORRECTA.** Lo que no estaba medido es **que alguien lo hubiera
ejecutado.** ⇒ **`¿corrió alguna vez?` es una pregunta distinta de `¿está
alcanzable?`, y el riel necesita las dos antes del lunes.**

### El barrido detecta el pago y NADIE LO APLICA

**§6 dice que el barrido cubre el caso «no llega ninguno».** Hoy **no lo cubre**:
clasifica `confirmado` y ahí se acaba — **no hay aplicador** (`D-887`). *Un pago
cobrado y nunca confirmado, con la plata ya movida.* **Es la razón por la que la
regla ① de §13bis no es teórica.**

---

## §13bis · 🔴 LAS TRES REGLAS DE ENCENDIDO *(firma de la mesa, 22-ago-2026 · crédito de S103-D)*

> **Se leen ANTES de mover una sola palanca.** No son estilo: cada una nació de
> un modo de falla medido en la sesión, y las tres describen cómo se rompe esto
> **el día que anda**, no el día que se construye.

### ① LO ÚLTIMO QUE SE ENCIENDE ES LA PUERTA DEL CLIENTE — y jamás antes de que exista quien confirme

**Un pago cobrado y nunca confirmado, con la plata ya movida, es PEOR que uno
que no se puede iniciar.** *El segundo es una molestia; el primero es una
persona a la que le sacaron plata y no tiene nada a cambio, y del otro lado no
hay ningún proceso que lo note.*

⇒ **la fila de DeUna se ofrece recién cuando el circuito de confirmación está
completo y CORRIDO** — no escrito: corrido.

### ② FLIP ① SIN FLIP ② SE APAGA DE INMEDIATO — **son DOS, no uno**

Poner `DEUNA_ELEGIBLE = true` **enciende la fila pero NO conecta la pantalla**:
`useEstadoDeUna` todavía tiene el cuerpo de `ENSAYO`, y su propio archivo declara
que ese cuerpo *«muere entero»* al enchufarse.

🔴 **Quien flipee sólo el primero va a ver la fila encendida y una pantalla que
sigue simulando** — *y eso se lee como «DeUna anda» hasta que alguien mire la
base.* **Una fila que promete un medio que no existe es peor que no ofrecerlo.**

### ③ EL CRON DEL BARRIDO NO SE ENCIENDE HASTA QUE EL APLICADOR EXISTA Y HAYA CORRIDO A MANO UNA VEZ

**Un barrido que escala lo mismo en cada pasada entrena a ignorarlo.** *La
primera alerta se lee; la quinta idéntica se archiva; para la décima el canal
está muerto y nadie lo declaró muerto.*

Y su razón de fondo, que vale para todo reloj de esta casa: **agendar un barrido
es empezar a tocar plata en un horario.** Eso pide firma, no configuración.

> ⚠️ **La forma correcta de tender un cable sin encenderlo, ya con precedente en
> la casa:** el cron de `cobrar-recurrencias` (`20260822240000`) **existe y nace
> INERTE** — su timbre lee `app_config.recurrente_vivo` y sin esa clave devuelve
> `recurrente_apagado`. **El cron es el CABLE; la llave es del founder.** *Un
> cable que se tiende bajo presión se tiende mal; éste se tendió con la
> corriente cortada.*

---

## Historial

- **v1.7 (22-ago-2026, mesa 104):** **§8 gana dueño.** La pista D levantó que el
  reverso por API **no lo construía nadie** y que las dos letras discrepaban
  —ésta decía «vía manual» sin decir quién, y `LETRA_MOTOR_PAGOS_S101` §9 lo
  excluía de su alcance—. **Dictamen: el refund por API es de la pista del riel**
  (es una llamada al proveedor con su autenticación y su ventana, misma clase
  que la solicitud y el buzón); **cuándo se reversa y qué recibe el cliente ya
  está firmado en `LETRA_SALDO`**; y **no entra en v1** — es camino manual de
  soporte y se construye después del circuito de cobro.

- **v1.6 (22-ago-2026, mesa 104):** nace **§6bis — DeUna es la PRIMERA opción y
  el medio POR DEFECTO**, con la elección previa del cliente ganándole al
  default. Su argumento de negocio queda escrito (**2 % + IVA**, sin alta ni
  token, y el cliente ecuatoriano ya tiene la app) para que la posición no se
  re-litigue. **Tres bordes, ninguno opcional:** no elegible sin `pointOfSale` ·
  **jamás en cobro recurrente** —es push y no hay cobro sin presencia— · y cae a
  tarjeta en pago mixto **diciéndolo con voz**. Y se declara el estado medido de
  la pantalla ese día: **la fila existe, está ÚLTIMA, apagada y bajo el fold** —
  *la letra y la superficie quedaron invertidas, y no por defecto de quien
  construyó: la letra no decía nada del orden hasta hoy.*

- **v1.5 (22-ago-2026, mesa 104):** el barrido gana **hora declarada: `03:00`
  Guayaquil**, lejos del cron de avisos de las 08:00, con su argumento escrito
  —es red de seguridad y no camino principal; a esa hora no compite por el rate
  limit con clientes pagando en vivo; y lo que escale a soporte espera igual a
  la mañana—. *Una hora sin argumento se cambia sin argumento.*

- **v1.4 (22-ago-2026, mesa 104 — sale del parte de C):** **§5 deja de mentir
  sobre de quién es una decisión.** `expiredTime` **es un campo del request**,
  no un límite del proveedor: la v1.1 lo leyó del papel y escribió «3 minutos
  fijos, no configurables». **Rige: pedimos 3 minutos por elección propia,
  declarada REVISABLE**, coherente con su doc y elegida para que el reloj del
  código muera antes que el hold. *Mientras se creyó ajena, nadie iba a
  preguntarse si el número era el correcto.* Y entra su corolario: **la pantalla
  lee el `expira_en` que devuelve el servidor, jamás una constante** — un número
  que vive en dos lugares es una cuenta regresiva que algún día miente.

- **v1.3 (22-ago-2026, mesa 104):** la referencia corta queda en **`≤ 20`** por
  firma de la mesa, con el **barrido** de la pista D como fuente (20 pasa; 21,
  25, 30, 36, 40, 50, 64 y 100 rebotan con el literal del proveedor). Deja de
  ser una marca de pista y pasa a ley, con su porqué escrito: **un CHECK más
  estricto que el proveedor no es más seguro — es una regla nuestra disfrazada
  de regla suya**, y el día que alguien busque el límite va a leer la doc
  equivocada, que vamos a ser nosotros.

- **v1.2 (22-ago-2026, mesa 104 — la primera versión escrita contra el
  ambiente REAL):** entra con el parte de la pista D del mismo día. **La regla
  del literal que la v1.0 se puso a sí misma se cobró entera:** de las
  afirmaciones de §2 tomadas de la doc en papel, **varias eran falsas**, y la
  más cara es que **`NOT_FOUND` no existe** — una transacción inexistente vuelve
  `200 / PENDING / amount 0 / date ""`, o sea que **el fantasma tiene la forma
  exacta de un pago en curso**. De ahí salen dos leyes nuevas: **el corte de
  huérfanos lo pone nuestro reloj** (hold + 7 días), y **aprobado exige
  `APPROVED` Y `amount > 0`** — con un solo campo, fail-closed es imposible.
  Se corrigen además **las rutas** (`/merchant/v1/payment/*`, las dos formas de
  la v1.1 estaban mal), **`idType` como texto `"0"`/`"1"`**, el nombre del campo
  de la referencia — **`idTransacionReference`, con el typo del proveedor
  respetado a propósito** —, **el refund por la misma pareja `idType`+id** y no
  por `transactionId` suelto, y **`x-api-key` = subscription key**. Entran el
  **límite de ~1 req/s** con su consecuencia (`429` ≠ fallo: el barrido espacia)
  y **`expira_en` como timestamp absoluto** desde la puerta. **La firma ③ pasa
  de supuesto a hecho**: el proveedor confirmó *mismo día* por mensaje. **§12
  baja de seis preguntas a cuatro**, y la que queda primera es la que bloquea el
  riel: **`pointOfSale` para canal digital**. *Nada del motor cambia: siguen
  intactos el puntero, el invariante «exactamente uno», el desglose congelado y
  las compuertas.*

- **v1.1 (21-ago-2026, misma mesa):** **las tres firmas del founder entran y la
  letra RIGE.** La ① modifica la propuesta: el formato de v1 es **el código de
  6 dígitos**, no el deeplink («por el tipo de comercio que somos» — literal).
  §5 se reescribe alrededor del código con su **reloj fijo de 3 minutos**
  (dato del proveedor, no configurable) y la ley de regeneración bajo hold
  vivo; la transposición pide `format:"5"` para que deeplink/QR queden en el
  crudo como reserva sin pantalla. §6 gana la **ley de experiencia** de la
  firma ② (idéntico a tarjeta; dos relojes — hold y código — jamás
  confundidos) y las voces del código vencido. §11 cierra sin pendientes.
  Encabezado e historial suben juntos.
- **v1.0 (21-ago-2026, mesa 103):** nace en mesa sobre la doc oficial recibida
  el 20-ago (solicitud comercial + doc técnica). Fija: DeUna como medio push
  sin alta (§1) · el contrato del proveedor con re-verificación obligatoria en
  QA (§2) · circuito reusado con deltas (§3) · referencia corta <20 (§4) ·
  deeplink con vuelta cosmética (§5) · TTL atado al hold (§6) · webhook como
  señal con consulta activa obligatoria (§7) · reverso mismo-día/total/sin
  parciales con el saldo como vía automática (§8) · la cédula del pagador
  como dato del riel, jamás del producto (§9) · y las seis preguntas que se
  preguntan en vez de adivinarse (§12). Tres firmas pendientes (§11).
