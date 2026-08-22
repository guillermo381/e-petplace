# LETRA_COBRO_RECURRENTE.md — e-PetPlace · el cobro que llega solo

> **Versión:** v1.4 · **Nace:** 21-ago-2026 (mesa 103) · **Estado:** RIGE
> **v1.4 (22-ago):** nace §4bis — las compuertas del recurrente, con las DOS que no se corren y su razón (firma del founder).
> COMPLETA — las cinco firmas del founder recibidas (21-ago). Sin firmas
> pendientes.
> **Fuentes que obedece:** el repo y su bitácora · `LETRA_MOTOR_PAGOS_S101`
> (el motor rige entero) · `LETRA_PAGO_CITAS` v1.1 (el patrón de sujeto) ·
> `LETRA_SALDO` v1.1 · `POLITICAS_EPETPLACE` (P14 con la firma γ · P16 · P18) ·
> `MODELO_FINANCIERO` (Decisiones S y T) · `MODELO_NOTIFICACIONES`.
> **Si esta letra contradice a cualquiera, gana la fuente.**
> **Qué fija:** el contrato del cobro **sin presencia del cliente** — el que
> dispara un reloj, no un dedo. **Qué no fija:** nada del motor (probado) · las
> ventanas de cancelación (son de POLITICAS) · el pago a prestadores y
> vendedores (liquidaciones: letra financiera v3.0 / S102) · los nombres de
> tablas, columnas y funciones — **los fija la pista contra la base.**
>
> **⚠️ PRECONDICIÓN DE CENSO:** esta letra afirma que existe una pantalla de
> despensa recurrente («que llegue solo») **por palabra del founder**. La pista
> **mide qué promete esa pantalla hoy** antes de construir: si la pantalla
> promete algo distinto a esta letra, **gana lo que ya se le prometió al
> cliente o se corrige la pantalla — jamás se deja divergir en silencio.**

---

## §1 · QUÉ ES ESTO — y qué NO es

Es el contrato de **un cobro que corre sin sesión viva detrás**. El motor ya
sabe cobrar; lo que no sabía es cobrar **solo**. La diferencia no es técnica,
es de consentimiento: cuando el cliente aprieta «Pagar», autoriza ESE cobro.
Acá autoriza **una serie**, y la serie tiene que ser tan fácil de parar como
fue de arrancar.

**Dos sujetos, un mecanismo:**

| Sujeto | Cadencia | Qué se cobra | Fuente firmada |
|---|---|---|---|
| **Plan de paseos** | mensual (el período que su plan declare) | el precio del período completo | Decisión S (S55) · P14 con la **firma γ** (21-ago) |
| **Despensa recurrente** | la frecuencia que el cliente eligió | el desglose de esa entrega, a precio vigente | esta letra (§5) |

**NO son de esta letra:** el **paquete de salidas** (P16: pago único al
comprar; comprar ≠ reservar — no hay recurrencia, hay consumo) · el
**programa de adiestramiento** (su forma de cobro es la firma ③ de D-856,
todavía abierta) · las **liquidaciones** a prestadores y vendedores (S102).

## §2 · LA AUTORIZACIÓN — lo que el cliente firma una vez

Una serie de cobros exige una autorización explícita, guardada y revocable:

- **Se guarda el acto:** quién autorizó, cuándo, sobre qué medio de pago, con
  qué cadencia y qué monto esperado. Es dato de consentimiento — no se
  reconstruye después, se registra en el momento (patrón del desglose
  congelado).
- **La autorización nombra un medio de pago concreto** (el token guardado).
  Si ese medio muere, la serie no salta a otro por su cuenta: **jamás se
  cobra a una tarjeta que el cliente no eligió para esto** (§6).
- **Se corta desde la app, sin pedir permiso a nadie:** «Cancelar plan» /
  «Cancelar envíos» vive en la misma pantalla donde se ve la serie. Cortar
  es un acto del cliente, jamás un trámite de soporte.
- **La pantalla dice la verdad completa:** qué se va a cobrar, cuándo es el
  próximo cobro, a qué medio, y cómo se corta. *(La ley de la casa: se
  publica lo incompleto, jamás lo falso.)*

## §3 · EL AVISO — 48 horas antes *(firma ① del founder, 21-ago)*

**Todo cobro de esta letra se anuncia 48 horas antes de ejecutarse.** El aviso
no pide permiso: informa, y el cobro corre igual.

- **Qué dice:** qué se va a cobrar, cuánto exactamente, a qué medio de pago,
  qué día, y cómo cancelar si ya no lo quiere. **El monto del aviso es el
  monto que se cobra** — si entre el aviso y el cobro el monto cambiara, rige
  §5.
- **Canal:** el que `MODELO_NOTIFICACIONES` ya tenga para esta clase (la
  pista mide; no nace canal nuevo). **Medido en S103: es
  `pedido_recurrente`**, y hoy está `en_sombra = true` — se registra y no se
  entrega. *Sale de sombra AL FINAL, cuando el cobro exista* (§10.4bis).
- 🔴 **EL AVISO SE CORRIGE A SU ALCANCE REAL** *(dictamen de mesa, 22-ago)*.
  El aviso vigente promete, literal en su carga, **«saltar, mover o cancelar»**
  — y **medido: solo existe cancelar.** Las funciones de recurrencia son cuatro
  y **ninguna saltea ni mueve.**

  > ### **Dos tercios de una promesa sin camino no son una funcionalidad pendiente: son una mentira con fecha.**

  **Rige: el aviso dice lo que se puede hacer, que es cortar.** *La pantalla de
  la familia ya se construyó así —un solo botón— así que hoy el que miente es
  el payload, no la superficie.* **Saltar y mover NO se construyen en v1**: no
  están en ninguna firma y son producto nuevo (§8 · `D-869`).
- **La ventana de 48 h es también la ventana de gracia:** cancelar dentro de
  ella cancela **ese** cobro y la serie hacia adelante, sin costo — porque
  todavía no se cobró nada.
- **El aviso jamás es la confirmación.** El comprobante existe aparte, después
  del cobro, con id de transacción y código de autorización (requisito de
  certificación) y va **a quien pagó** (dictamen S102).

## §4 · EL CIRCUITO — el mismo motor, y ahora se dice CÓMO

> **⚠️ ENMIENDA DEL 22-ago-2026 (firma del founder).** Esta sección decía *«el
> mismo motor, sin nadie mirando»* y **eso era una intención, no un contrato**:
> al ir a construirlo apareció que **la puerta única no puede ser la misma
> función**. Se escribe el cómo.

### §4.0 · LA HERMANA, Y POR QUÉ NO ES LA MISMA PUERTA

**Medido en `pagos-cobro`:** su **primera compuerta es la sesión**
(`if (!auth.startsWith('Bearer ')) → sin_sesion`), y de ahí cuelga todo lo
demás — pertenencia, monto, compuertas. **El cobro recurrente no tiene sesión:
lo dispara un reloj.** Con esa función tal cual, **todo cobro automático muere
en `sin_sesion`.**

🔴 **PROHIBIDO, y es la firma más dura de esta letra: que el disparador fabrique
un JWT de usuario con `service_role`.** *No rompe una compuerta: rompe el
significado de todas.* **El día que el reloj pueda producir la misma señal que
una persona, nadie puede volver a distinguir un cobro pedido de uno inventado**
— y ese costo se paga entero el día del primer reclamo, que es cuando la
evidencia es lo único que tenemos. **Y es retroactivo:** degrada también los
cobros ya ocurridos, porque desde ese día ningún registro anterior puede probar
de qué lado nació. (`L-340`.)

> ### **La sesión es la autorización. Donde no hay sesión, la autorización es un ACTO GUARDADO — jamás una sesión simulada.**

**⇒ Se construye una HERMANA** —`pagos-cobro-recurrente` o el nombre que la
pista fije contra la base— **con el MISMO contrato de seguridad de `pagos-cobro`
y otra RAÍZ de autorización:**

| | `pagos-cobro` | la hermana |
|---|---|---|
| **raíz de autorización** | la **sesión** del cliente | **la fila de la serie** (§2: quién autorizó · cuándo · sobre qué medio · con qué cadencia) **+ secreto compartido** para el disparador (patrón `D-713`) |
| **de dónde sale el pagador** | de la sesión | **explícito, de la fila** (`pagador_user_id`, cura 3 de S102) |
| **compuertas E3** | enteras | **enteras e IDÉNTICAS** |
| **monto** | del desglose congelado | **del desglose congelado** |

**Lo único que cambia es de dónde sale el pagador.** *Todo lo demás se reusa, y
si alguna compuerta se ablandara «porque es automático», la hermana dejaría de
ser hermana.*

### §4.0bis · EL REPARTO — la base elige, la edge cobra

**Ratificado por el founder.** Una función de base **no puede cobrar**: no tiene
credenciales del proveedor ni debe tenerlas.

1. **LA BASE ELIGE Y CONGELA** — resuelve qué series vencen, y **congela el
   desglose de ESE cobro antes de que nadie debite**.
2. **LA EDGE COBRA** — la hermana, con el contrato de arriba.
3. **EL CRON LLAMA POR `net.http_post`** — el patrón que ya usan `despachar-push`,
   `despachar-whatsapp` y `pagos-conciliar`. *No nace mecanismo nuevo.*

**El desglose congelado nace POR COBRO y ANTES de debitar, fail-closed: sin
desglose no hay débito.** *Es el patrón de la cita, sin una coma de diferencia.*

---

El reloj reemplaza al dedo; **todo lo demás es idéntico**:

1. **El disparador es un cron** (cadencia y hora las fija la pista contra lo
   que exista; el barrido de pagos ya tiene precedente de cron con hora
   declarada).
2. **Las compuertas pre-cobro (E3) corren enteras** — ninguna se saltea por
   ser automático. Al contrario: **sin cliente presente, la compuerta es la
   única defensa.** La #0 (jamás dos intentos en vuelo sobre el mismo sujeto)
   es crítica: un cron que corre dos veces no cobra dos veces.
3. **Desglose congelado por cobro**: cada ejecución de la serie congela **su
   propio** desglose antes de debitar (patrón de la cita: sin desglose
   congelado no hay cobro, fail-closed).
4. **Débito con el token guardado**, por **la hermana** (§4.0), que es la
   puerta única de este camino. El pagador es el titular de la autorización,
   **explícito — jamás derivado** (`pagador_user_id`, cura 3 de S102).
   *Esa columna existe exactamente porque acá no hay sesión de la cual
   derivarlo.*
5. **Webhook / consulta activa / barrido**: idénticos. El actuador
   transiciona solo con verdad verificada del servidor.
6. **Comprobante por correo** tras cada cobro exitoso.
7. **Idempotencia por período:** un período de una serie **no puede tener dos
   cobros exitosos**. El candado es de base, no de código (el precedente:
   S101 probó que un UNIQUE bien elegido es más barato que una convención).

## §4bis · LAS COMPUERTAS DEL RECURRENTE *(firma del founder, 22-ago-2026)*

**El cobro recurrente pasa por las MISMAS compuertas que el cobro con cliente
presente — con DOS excepciones, que se escriben acá y no en un comentario.**

> 🔴 **Por qué en la letra:** *una compuerta salteada sin registro es una que
> alguien reactiva o borra sin saber qué decidió la mesa.* **Un comentario en el
> código lo lee quien toca esa función; una excepción de seguridad la tiene que
> poder leer quien audita el motor sin abrirlo.**

### Las que NO se corren, y por qué

**① `1 · reserva de stock` — NO APLICA.** *No hay pedido todavía.* **§6 manda
cobrar ANTES de que salga la entrega** ⇒ exigir una reserva viva sería **pedir
un estado que la propia letra prohíbe que exista** en ese momento.

**② `3 · cobertura` — NO EVALUABLE**, igual que en compras. **Viaja declarada en
`no_evaluables`, también cuando el resultado es `ok`.** *Que nadie lea ese `true`
como «la cobertura está verificada»: no se verificó nada de cobertura.*

### Las que SÍ, enteras

**`0 · intento en vuelo`** · **`2 · monto contra el desglose congelado`** ·
**`4 · vendedor activo` (7.13)** · **`5 · el medio autorizado`** *(el «token» de
este sujeto: la tarjeta que el cliente eligió PARA ESTA SERIE)*.

> ### 🔴 **Y la #0 es CRÍTICA acá, más que con cliente presente: sin nadie mirando la pantalla, la compuerta es la ÚNICA defensa.**
> **Un cron que corre dos veces no cobra dos veces.** *Con el dedo, la persona ve
> que ya pagó y no vuelve a apretar; acá no hay nadie que lo note hasta el
> resumen de la tarjeta.*

**Y las dos exclusiones VIAJAN EN LA RESPUESTA**, no sólo en esta letra: la de
cobertura en `no_evaluables` y la de reserva en `no_aplican`, con su razón.
*Sin eso, un lector futuro va a creer que se olvidaron.*

---

## §5 · EL MONTO — precio vigente, con aviso *(firma ② del founder, 21-ago)*

- **La despensa recurrente cobra el precio vigente al momento del cobro**, no
  el del día en que el cliente se suscribió. Si subió, **se cobra el precio
  nuevo y se avisa** — el aviso de §3 lleva el monto real, así que el cliente
  se entera 48 h antes y puede cortar sin costo.
- El **plan de paseos** cobra el precio de su período según Decisión S; un
  cambio de tarifa del plan se comunica con la misma regla.
- **El monto del aviso y el monto del cobro son el mismo número.** Si por
  cualquier causa divergieran, **no se cobra**: es hallazgo rojo a soporte
  (la compuerta 2 del motor rige idéntica — un monto que divergió del
  desglose es defecto nuestro, jamás del cliente).

## §6 · CUANDO FALLA — reintentos y voz *(firma ③ del founder, 21-ago)*

**Tres días de reintento, con aviso.** Ni silencio ni corte inmediato:

| Momento | Qué pasa | Qué se le dice |
|---|---|---|
| Día 0 — el cobro falla | Se registra con su causa (§7 del motor: la voz es por causa, no por código) | Aviso al cliente **el mismo día**: qué pasó y cómo resolverlo (actualizar el medio de pago) |
| Días 1 y 2 — reintentos | Un intento por día, con la compuerta #0 vigente | Solo se avisa de nuevo si cambia algo |
| Día 3 — último intento | Si falla, **la serie se pausa** (no se cancela) | Aviso claro: quedó pausada, qué se necesita para reanudarla |

- **Pausa ≠ cancelación.** El cliente reanuda desde la app actualizando su
  medio de pago; la serie retoma en su próximo período, **jamás cobrando los
  períodos que no corrieron** (no se acumula deuda hacia atrás).
- **Qué pasa con el servicio mientras tanto:** el período impago **no se
  presta**. Para el plan, los paseos de ese período no se agendan hasta que el
  cobro entre. Para la despensa, **esa entrega no sale**. *La casa jamás
  entrega contra un cobro que no ocurrió, y jamás cobra por algo que no
  entregó.*
- **La causa se dice con su nombre**, y acá se cobra la ficha 🔴 del censo de
  S102: mientras «no aprobado con causa conocida» y «no aprobado sin causa»
  compartan etiqueta, este aviso no puede distinguir *«tu tarjeta venció,
  actualizala»* de *«hubo un problema, escribinos»*. **Esta letra depende de
  esa separación para cumplir su §6** — y es la razón por la que esa ficha
  sube de prioridad.
- **Medio de pago muerto** (borrado o vencido): no se salta a otro medio.
  Se avisa y se pide elegir uno — la autorización nombra un medio (§2).

## §7 · LA FALTA DE STOCK — se salta la entrega
*(firma ⑤ del founder, 21-ago)*

La firma ② resolvió el precio; la falta de stock es otra cosa y no se
deduce de ella: no hay monto que cobrar por un producto que no existe.

**La letra del founder, literal:** «saltar la entrega y avisar; no se
sustituye sin que el cliente lo pida, nunca».

- **No se cobra** ese período. La serie **sigue viva** para el
  siguiente — no se pausa ni se cancela: el problema es nuestro, no
  del cliente.
- **Se avisa** con su nombre («este mes no pudimos enviar X»), y el
  aviso ofrece la salida que el cliente controla: comprar por su
  cuenta, o cambiar el producto de la serie.
- **JAMÁS se sustituye por iniciativa de la casa** — ni por
  «equivalente», ni misma marca, ni otro tamaño. La sustitución solo
  existe si **el cliente la pide explícitamente**.
- **El porqué, escrito para que nadie lo revierta creyendo que mejora
  el servicio:** un cambio de alimento no es un cambio de producto.
  Puede tener consecuencias clínicas (alergias, fórmula, momento
  vital — BIO_EXPEDIENTE rige), y **el inventario jamás decide sobre
  la salud de una mascota.** Un vendedor sin stock es un problema de
  logística; resolverlo cambiándole la comida al animal lo convierte
  en un problema del animal.

## §8 · LO QUE NO ENTRA EN v1

🔴 **SALTAR UNA ENTREGA y MOVER SU FECHA — `D-869`, dueño PRODUCTO.** *El aviso
las prometía y el motor nunca las tuvo.* **No son deuda técnica: son producto
que nadie firmó** — saltar un período plantea qué pasa con el cobro de ese
período, y mover una fecha plantea si la cadencia se corre o se mantiene. **Las
dos son decisiones de letra, no de código**, y por eso no se construyen
«mientras estamos acá». *La cura de v1 es que el aviso deje de prometerlas.* ·
Paquete de salidas (pago único, P16) · programa de adiestramiento (espera su
firma ③ en D-856) · sustitución de productos por iniciativa de la casa — prohibida por §7, no diferida · cobro
recurrente en DeUna (ese riel es push: el cliente confirma en su app — **no
hay cobro sin presencia posible**; la recurrencia es solo con tarjeta
tokenizada, y así se le dice al elegir medio) · liquidaciones (S102) ·
descuentos o promociones aplicados a la serie (motor de promos, su propia
trenza).

## §9 · FIRMAS

| # | Qué | Estado |
|---|---|---|
| ① | **Aviso 48 h antes**, el cobro corre igual; la ventana es también gracia para cancelar | ✅ **FIRMADA — founder, 21-ago-2026** |
| ② | **Precio vigente** al momento del cobro, con aviso; el monto del aviso ES el del cobro | ✅ **FIRMADA — founder, 21-ago-2026** |
| ③ | **Tres días de reintento** con aviso el día 0; al tercero, **pausa** (no cancelación) | ✅ **FIRMADA — founder, 21-ago-2026** |
| ④ | Todo lo demás | Rige por letra ya firmada (motor · saldo · citas · Decisión S · P14 con γ) |
| ⑤ | **Falta de stock: se salta la entrega y se avisa; jamás se sustituye sin pedido explícito del cliente** (§7) | ✅ **FIRMADA — founder, 21-ago-2026** |

> **Esta letra no tiene firmas pendientes: RIGE completa.**

## §10 · ORDEN DE CONSTRUCCIÓN

1. **Censo primero, y el más importante es el de la pantalla:** qué promete
   hoy la superficie de despensa recurrente (texto literal, opciones,
   frecuencias, qué botón existe y qué hace). **La letra se ajusta a la
   promesa viva o la promesa se corrige — nunca divergen en silencio.**
   Censar también: si existe algún objeto de suscripción en la base, qué
   cron corren hoy, y el estado de la ficha 🔴 de causas (§6 depende de ella).
2. **Migraciones SIN aplicar** con reversa: el objeto de la serie (con su
   autorización y su cadencia), el candado de idempotencia por período, el
   puntero del motor al sujeto nuevo (invariante «exactamente uno»).
3. **El cron y la puerta**, con las compuertas enteras y el pagador explícito.
4. **Los avisos** (48 h y fallo) por el canal que ya exista.
5. **Arnés camino real**: una serie que se crea desde la pantalla, avisa,
   cobra sola, y una segunda que **falla a propósito** y recorre los tres
   días hasta la pausa. Sin el caso de fallo recorrido, §6 no está probada.
6. **Gates founder** por tanda, protocolo vigente.

---

## Historial

- **v1.3 (22-ago-2026, mesa 104 — al ir a construir):** **§4 pasa de intención a
  contrato.** Decía *«el mismo motor, sin nadie mirando»*, y la construcción
  destapó que **la puerta única no puede ser la misma función**: la primera
  compuerta de `pagos-cobro` es la sesión, y el recurrente no tiene ninguna.
  Nacen **§4.0 (la hermana)** y **§4.0bis (el reparto)**: mismo contrato de
  seguridad, **otra raíz de autorización** —la fila de la serie como acto
  guardado, más secreto compartido para el cron—, **compuertas enteras e
  idénticas**, y **lo único que cambia es de dónde sale el pagador**. Con su
  prohibición firmada: **el disparador jamás fabrica un JWT de usuario con
  `service_role`** (`L-340`) — *no rompe una compuerta, rompe el significado de
  todas, y es retroactivo*. Reparto ratificado: **la base elige y congela, la
  edge cobra, el cron llama por `net.http_post`.**

- **v1.2 (22-ago-2026, mesa 104 — sale del censo de S103):** **§3 gana la
  corrección del aviso y §8 gana `D-869`.** El aviso vivo promete *«saltar,
  mover o cancelar»* y **solo existe cancelar** —medido: las cuatro funciones de
  recurrencia no saltean ni mueven—. *La pantalla de la familia ya se había
  construido con un solo botón, así que el que diverge es el payload.* **Saltar
  y mover salen de v1 con ficha y dueño (producto):** no son deuda técnica sino
  decisiones de letra que nadie firmó —qué pasa con el cobro del período que se
  saltea, si mover corre la cadencia o la mantiene—. Y se registra el canal
  medido: **`pedido_recurrente`, hoy `en_sombra = true`**, que sale de sombra
  **al final**, cuando el cobro exista.

- **v1.1 (21-ago-2026, misma mesa):** entra la **firma ⑤** y la letra
  queda sin pendientes. §7 pasa de dos salidas abiertas a ley: se
  salta la entrega, la serie sigue viva, y la sustitución por
  iniciativa de la casa queda **prohibida**, no diferida — el porqué
  es clínico (BIO_EXPEDIENTE), no logístico: el inventario jamás
  decide sobre la salud de una mascota.

- **v1.0 (21-ago-2026, mesa 103):** nace en mesa por pedido del founder
  («pago mensual de plan de paseos y pago de despensa que llegue solo»).
  Fija la autorización como acto guardado y revocable (§2) · el aviso de
  48 h que informa y no pide permiso, con su ventana de gracia (§3) · el
  circuito idéntico con el cron reemplazando al dedo y las compuertas
  intactas (§4) · el precio vigente con el monto del aviso como contrato
  (§5) · los tres días de reintento y la **pausa sin deuda hacia atrás**,
  con la regla de no entregar lo no cobrado ni cobrar lo no entregado (§6) ·
  y declara dos cosas que nadie había dicho: **DeUna no puede sostener
  recurrencia** (es push, exige presencia) y **la falta de stock no se
  deduce del precio** — su firma ⑤ queda abierta con la recomendación de
  saltar la entrega, porque sustituir alimento por criterio de inventario
  choca con el expediente.
