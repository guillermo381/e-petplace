# LETRA_PUERTA_DE_PAGO_S101B.md — e-PetPlace

> **Versión:** v1.3 · **Nace:** 19-ago-2026 · **Enmendada:** 20-ago-2026 (el alias · el alta nace al tocar) · **21-ago-2026 (la superficie es UNA — §8)** · Sesión **S101-B · LA SUPERFICIE DEL PAGO** · **Fase 0**
> **Fuentes que obedece (en este orden):** el repo y la base · `LETRA_MOTOR_PAGOS_S101.md` **v1.3** · `LETRA_SALDO.md` **v1.1** · `docs/loop/S101-A.md` · el acta de apertura S101-B · `POLITICAS_EPETPLACE` · `MODELO_FINANCIERO`.
> **Regla de precedencia:** si esta letra contradice a la fuente, **gana la fuente** y la letra se enmienda con su marca.
>
> **Qué es:** el contrato de **estados, voces y flujos** de la superficie del cobro — lo que la familia ve cuando paga.
> **Qué NO es:** una especificación de pantallas. **La letra manda el QUÉ; el CÓMO visual es de `DIRECCION_ARTE` §9bis + la skill `epetplace-design-system`.** Acá no se dicta una sola decisión de diseño.
> **Qué NO autoriza:** ledger / devengo / comisión / liquidación (S102) · el motor del saldo (S102) · refund por API (E6) · impuestos (S103) · certificación (S104).
>
> ⚠️ **NINGÚN NOMBRE DE PANTALLA, RUTA O COMPONENTE DE ESTA LETRA ESTÁ MEDIDO.** Lo mide el **censo de la Fase 1**. Lo que sí está medido acá va marcado *(medido)* con su fuente; todo lo demás es **candidato**.

---

## §0 · LA REGLA MADRE DE ESTA SUPERFICIE

**El cliente jamás descubre un problema del pedido a través del cobro.** Lo descubre antes, con su nombre.

De ahí bajan las cuatro reglas que gobiernan cada pieza:

1. **Todo lo que pueda impedir la entrega se verifica ANTES del débito** — porque el reverso es **mismo-día** *(medido: cortes 17:00 Medianet · 17:50 Datafast)*: la plata que no se cobra mal no hay que devolverla.
2. **La respuesta síncrona del débito es SEÑAL OPTIMISTA, jamás confirmación.** Confirma el webhook, o el barrido.
3. **Cada clase de fallo tiene voz propia y salida propia.** Un timeout dibujado como rechazo hace que el cliente pague dos veces lo mismo.
4. **Ningún estado se dibuja mudo.** Ni spinner sin texto, ni error genérico donde hay causa conocida.

---

## §1 · PIEZA 1 — LA PUERTA EXISTENTE: QUÉ SE ENCHUFA

**El contrato ya está puesto y es de S100** *(medido, `despensa-pedido.ts:729`)*: *«🔴 EL CONTRATO DE LA PUERTA DE PAGO — y S101 se enchufa acá sin tocar la pantalla»*.

- `checkout.tsx` llama a **`crear_intento_pago`**, que **no crea ningún intento** *(medido, censo B0 §4)*: reserva stock, congela el desglose, mueve la compra a `esperando_pago` y devuelve el sobre para el proveedor. **Su nombre miente y tiene lápida** (`COMMENT` en la base, S101-A) — **el nombre NO se toca**: hay un llamador vivo en el bundle publicado, y renombrar rompe el checkout que corre hoy hasta que aterrice un OTA.
- **Lo que S101-B agrega es lo que pasa DESPUÉS de ese sobre**, que hoy no existe: elegir medio de pago, correr compuertas, debitar, esperar, confirmar.

**Lo que esta letra fija:** el enchufe es **aditivo**. La superficie nueva **consume** el sobre; no reimplementa la reserva, ni el congelamiento, ni la orquestación compra → N pedidos, que **ya existen** *(medido)*.

> ⚠️ **Lo que la letra NO puede fijar todavía:** qué dibuja `checkout.tsx` hoy y dónde entra la pieza nueva. **Es el ítem 1 del censo (Fase 1).** *Fijar acá una pantalla que nadie midió sería exactamente lo que el encabezado prohíbe.*

---

## §2 · PIEZA 2 — EL ALTA DE TARJETA

**Principio inviolable, y no es doctrina de la casa: el proveedor lo verificó dos veces el mismo día** *(medido, S101-A: rechazó el PAN server-to-server con `401 Application is not PCI` y aceptó el token de su propio SDK)*.

> **El PAN se tokeniza en el navegador, dentro de los campos alojados de Nuvei, y jamás toca nuestro servidor.** Prohibido explícitamente: leer el número desde nuestro JS, logs del formulario, analytics sobre él, y **error-tracking con session replay** — *un replay que grabe este formulario mete el PAN en un tercero y nos vuelve PCI.*

**Dónde vive la página:** en un **HOST WEB PROPIO**. *(No es preferencia: Supabase **degrada HTML a texto plano a propósito** en el dominio compartido — anti-phishing —, y el `TEXT/HTML; charset=UTF-8` que hoy la sirve es un **rodeo frágil que deja de funcionar en silencio** el día que normalicen la comparación. `D-853`.)* La página de ensayo de S101-A es el **prototipo probado**, no el producto.

**Los tres desenlaces, cada uno con estado, voz y destino:**

| Desenlace | Qué pasó | Voz (es / en) | Destino |
|---|---|---|---|
| **`guardada`** | el SDK emitió token y el servidor lo persistió | «Listo, tu tarjeta quedó guardada.» / «Done — your card is saved.» | vuelve con la tarjeta ya elegible |
| **`rechazada`** | el emisor o el SDK rechazaron el alta | la voz de la taxonomía de §5, **según la causa** — jamás genérica si la causa se conoce | corregir datos o probar otra tarjeta |
| **`abandonada`** | **el alta VENCIÓ sin desenlace** | **sin voz de error: no falló nada.** Se vuelve donde estaba | la fila del alta queda cerrada por vencimiento — **la tarjeta nunca nace** |

**`abandonada` es el estado INICIAL, hasta que algo diga lo contrario** *(medido: así está construido el prototipo)*. *Un flujo cuyo estado inicial es «éxito pendiente de confirmar» declara guardada una tarjeta que nadie guardó.*

> 🔴 **ENMIENDA DE MESA (19-ago) — `abandonada` LA DICE EL SERVIDOR, y esto corrige la v1.0 de esta letra.**
> La v1.0 la definía como *«la familia cerró el WebView»*, deducida del retorno del navegador. **No rige.** `abandonada` es **un alta que venció sin desenlace, leída del servidor.**
>
> **La razón, y es la que hay que conservar:** deducirla del retorno confundiría **tres cosas distintas** —que la familia cerró la ventana, que el navegador falló, y que el alta de verdad venció—. **Solo la fila que expiró es un hecho.** *La casa persiste todo, incluso lo rechazado; «abandonada» solo existe si hay una fila que venció.*
>
> ⇒ **El `?desenlace=` que trae la URL de retorno es una PISTA para pintar rápido, jamás la fuente.** La app confirma contra el servidor antes de declarar nada.
>
> ⇒ **Y de acá sale la forma del alta:** el handle es el `id` de una **fila propia de altas pendientes**, emitida server-side con el usuario del auth y un TTL corto. *Sin fila no hay vencimiento, y sin vencimiento «abandonada» no se puede medir: sería una suposición con nombre de estado.*

### 🔴 REQUISITO DE LA PANTALLA REAL DE MEDIOS DE PAGO — *firma del founder, 20-ago-2026*

**El alta nace cuando la familia toca «agregar tarjeta», JAMÁS al abrir la pantalla.**
Y **la pantalla lee el estado de las altas que YA existen** (pendiente / vencida) en vez de
fabricar una nueva por mirar.

**De dónde sale este requisito, y por qué no es una preferencia:** el andamio de gate crea
un alta **al abrirse**. Medido en el aparato del founder el 20-ago: **diez altas en cuatro
minutos** (04:13→04:17), *todas* `pendiente` y *ninguna* vencida — mientras las ocho de sus
reintentos previos (03:55→03:58) **sí estaban vencidas**.

⇒ **La voz del vencimiento era INALCANZABLE por construcción:** cada reentrada nacía una
fila nueva, y la app leía siempre la recién nacida. *La derivación del servidor funcionaba
perfecto; lo que fallaba es que la pantalla miraba el objeto equivocado.*

> **La forma general, que es lo que hay que conservar:** *un estado que solo aparece con el
> paso del tiempo no se puede observar en una pantalla que reinicia su reloj cada vez que
> la abrís.* Vale para el alta, y vale para cualquier vencimiento que se quiera mostrar.

**La cura NO va al andamio** —que muere con la Fase 5—: **va acá, como requisito de la
pantalla real.**

### ✍️ EL ALIAS DE LA TARJETA — *enmienda, firma del founder 20-ago-2026*

**La familia puede nombrarla al guardarla** («Visa de Kari»). **Opcional siempre.**

| Regla | Por qué |
|---|---|
| **Nunca obligatorio** | *Una tarjeta sin nombre es perfectamente usable; exigirlo sería inventar un requisito que nadie pidió.* `NULL` es un estado normal, no un pendiente |
| **Es DATO DEL CLIENTE: se guarda tal cual y JAMÁS se usa para lógica** | no decide, no agrupa, no enruta, no se compara. *El día que algo ramifique por el alias, el texto que una persona escribió para reconocer su tarjeta pasa a ser una llave — y las llaves no se tipean a mano* |
| **Largo acotado (40)** | *un texto libre sin techo en una tabla de medios de pago es una puerta para meter cualquier cosa* |
| **El campo va FUERA del widget del SDK** | no es un dato de tarjeta. *Meterlo adentro lo pondría en el mismo formulario que el PAN, y lo que vale de ese formulario es que solo tiene datos de tarjeta* |
| **Re-presentar la misma tarjeta sin alias NO borra el que tenía** | *el silencio no es una orden de borrar* |

**El OTP vive ACÁ y solo acá.** Diners pide OTP **en la tokenización**; el débito va limpio *(confirmado por Erick — E2 + la confirmación de recurrencia)*. Tarjeta de prueba `36417002140808` · `012345` éxito / `543210` pendiente. **Lo pide el formulario del SDK — nosotros no lo leemos.**

> 🔴 **Consecuencia que ordena la pieza 3:** **ninguna pantalla de cobro se construye esperando un código.** *Construir el cobro esperando un OTP que nunca llega es un embudo que se cuelga sin que nada falle.*

---

## §3 · PIEZA 3 — EL COBRO

### §3.1 · Las compuertas corren ANTES del débito

`verificar_compuertas_pre_cobro(p_compra_id, p_token)` *(medido: existe, migración `20260821020000`)*. **Cada fallo se muestra con su voz ANTES de tocar la tarjeta.**

**Los OCHO códigos tipados que la función devuelve**, con la voz que esta letra les fija:

> 🔴 **CORRECCIÓN A LA v1.0 DE ESTA LETRA (20-ago), y es un error mío de medición:** la
> v1.0 decía **NUEVE** códigos e incluía `pedidos_sin_reserva`. **No es un código: es una
> CLAVE DEL `detalle`** dentro de `reserva_vencida`. *Grepeé identificadores sin distinguir
> el código de su detalle — medí por NOMBRE en vez de por ESTRUCTURA, que es exactamente el
> modo de falla que S95 registró con el invariante que daba verde por la razón equivocada.*
> ⇒ **La matriz es 8/8**, y los que faltaban ensayar son **DOS**, no tres: `compra_sin_pedidos`
> y `desglose_incompleto` — *y son justamente los dos que hablan hacia soporte.*

| Código | Qué pasó | Voz (es) | Salida |
|---|---|---|---|
| `pago_en_proceso` | ya hay un intento en vuelo | «Tu pago anterior se está procesando.» | esperar — **jamás un segundo débito** |
| `reserva_vencida` | venció el TTL del carrito | «Tu reserva venció. Vamos a revisar que todo siga disponible.» | rearmar contra stock actual |
| `monto_divergente` | el total no coincide con el desglose congelado | «No pudimos completar el cobro. Ya lo estamos viendo.» | **soporte — es defecto NUESTRO, no del cliente** |
| `vendedor_no_activo` | la tienda dejó de estar activa | «Esta tienda no está recibiendo pedidos en este momento.» | volver al catálogo |
| `token_ausente` | no hay medio de pago | «Elegí con qué tarjeta querés pagar.» | ir al alta / a la lista |
| `compra_no_existe` | la compra no existe | «No encontramos esta compra.» | volver, sin culpar al cliente |
| `compra_sin_pedidos` | 🟠 la compra no tiene pedidos | «No pudimos completar el cobro. Ya lo estamos viendo.» | **soporte — defecto nuestro** |
| `desglose_incompleto` | 🟠 falta desglose congelado | «No pudimos completar el cobro. Ya lo estamos viendo.» | **soporte — defecto nuestro** |

> 🔴 **HALLAZGO, corregido en la v1.2: DOS de los OCHO códigos no tienen ensayo.** El arnés de S101-A dio **7/7**, y sus casos ejercitaron **seis** más el camino feliz. **Quedan sin producir en rojo: `compra_sin_pedidos` · `desglose_incompleto`.**
> *Un 7/7 sobre una función de nueve salidas es un verde honesto de lo que probó y mudo sobre lo que no. Los tres entran a la matriz de ensayo de la Fase 3 — y los dos últimos importan porque su voz es «defecto nuestro», o sea que si alguna vez disparan, disparan hacia soporte y no hacia el cliente.*

### §3.2 · La compuerta 3 (cobertura) — no evaluable POR DISEÑO

La cobertura **se valida cuando el cliente elige la dirección, jamás al pagar** *(estatuto firmado, letra del motor §5.0 v1.3)*. Ponerla acá sería construir, con forma de compuerta, exactamente el patrón que §0 prohíbe.

⇒ La función devuelve **`no_evaluables: ["cobertura"]` SIEMPRE, incluso dentro del `ok:true`** *(medido)*. **Ningún llamador de la superficie puede leer un verde como «cobertura verificada».**

> ⚠️ **La confianza aguas arriba HOY no está respaldada** — `D-850`, dueño el flujo de elección de dirección, disparo **antes del primer pedido real de octubre**. La superficie del pago **no la cura y no la disimula**.

### §3.3 · El débito

- **Limpio: sin OTP, sin 3DS** *(Erick, incluida recurrencia Diners)*.
- **El monto es el del desglose congelado, centavo a centavo** — nunca un total recalculado en la pantalla.
- **El doble toque lo ataja el candado de idempotencia** *(medido: `UNIQUE (proveedor, proveedor_transaction_id, pedido_id)` parcial)* **y la compuerta 0**, en ese orden: primero la voz, después el candado como red.
- **El intento se registra ANTES de disparar** *(medido: así lo hace el arnés)*. *Un débito emitido sin fila previa es un cobro que, si se corta la luz en el medio, no existe para nosotros y sí para el cliente.*
- **Todo rechazo destila su motivo a una columna legible — jamás NULL**, con `http_<status>` como último recurso *(L-316: un payload jsonb no se puede listar, contar ni agrupar, y nadie lo abre cuando hay una explicación plausible a mano)*.

> 🔴 **ROJO ESPERADO Y DOCUMENTADO — no es hallazgo (firma del founder, 19-ago):** el débito **rebota hoy en `order.vat`** (`OperationNotAllowedError: order.vat Invalid`). No es nuestro código: el desglose dice `EC_IVA_0` y `vat: 0` era correcto; el choque es contra la tasa configurada en **la cuenta**. **Se construye el flujo completo igual**, y el rebote se registra con su causa **para que nadie lo re-diagnostique**. `D-852` — 🔴 **precondición de apertura de octubre**: si la cuenta productiva exige `vat > 0`, ningún producto real se cobra.

---

## §4 · PIEZA 4 — LA ESPERA Y LA CONFIRMACIÓN

**La respuesta síncrona NO confirma.** Lo que la superficie hace con ella es **pasar a espera declarada**.

| Estado | Voz (es / en) | Qué puede hacer la familia |
|---|---|---|
| **confirmando** | «Estamos confirmando tu pago.» / «We're confirming your payment.» | **irse** — el pedido avanza solo |
| **pagado** | lo dice la escalera del pedido, que ya existe *(medido)* | seguir su pedido |
| **rechazado** | la voz de §5 **según la causa medida**, nunca genérica si se conoce | reintentar por el camino que corresponda |

**Prohibiciones explícitas de esta pieza:**
- ❌ **Nunca «rechazado» por timeout.** Un timeout **no es un rechazo**.
- ❌ **Nunca un spinner mudo.** Si tarda, la voz lo dice y ofrece destino.
- ❌ **Nunca la pantalla declara «pagado» por su cuenta.** Lo declara el motor.

**La pantalla cambia sola** cuando la confirmación llega. **El mecanismo NO se elige acá**: el censo (Fase 1, ítem 5) mide las dos opciones —suscripción realtime vs. polling suave con backoff— **con su costo**, y la Fase 4 decide con doble check. *(Dato de contexto: S94-PERF midió **cero `.channel(`** en el monorepo y `D-739` declara el costo del realtime — el reflejo «usemos realtime» tiene un precio que ya está medido y hay que mirarlo antes.)*

**El caso ① es el normal, no el excepcional:** llega el webhook y el teléfono no volvió. Cuando la app vuelva, **lee un estado ya movido y no lo re-decide.**

**Y si no llega ninguno**, lo resuelve el **barrido mismo-día** (pieza operativa, §7 del plan): pasadas ~12:00 y **última 16:15 America/Guayaquil** — 45 min antes del corte más temprano. *Después del corte no hay reverso por API: la cadencia es la protección, no un detalle.*

> 🔒 **El actuador del webhook se construye APAGADO.** El buzón no pasa a actuador **hasta que la fila del `stoken` dé `true`** — es una **observación de un solo tiro** y se protege. *No se cablea un actuador sobre una fórmula no confirmada: con un `stoken` inventado, una fórmula correcta y una equivocada dan el mismo `false`.*

---

## §5 · PIEZA 5 — EL FALLO CON VOZ (la taxonomía entera)

**La casa ya pagó por confundir clases de error.** Cada causa, su voz y su salida:

| Causa | Qué se le dice (es) | Salida |
|---|---|---|
| El banco no autorizó | «El banco no autorizó el pago.» | probar otra tarjeta |
| **Fondos insuficientes** | 🔴 **NUNCA SE NOMBRA.** Se dice: «El banco no autorizó el importe.» | otra tarjeta |
| OTP incorrecto *(solo en el alta, §2)* | «El código no coincide.» | reintentar, con su límite |
| Timeout / sin respuesta | «Estamos confirmando tu pago.» — **no es rechazo** | esperar, con destino claro |
| Tarjeta vencida o datos inválidos | «Revisá los datos de la tarjeta.» | corregir |
| **Compuerta pre-cobro** | **la causa real, ANTES de tocar la tarjeta** (§3.1) | resolver y reintentar — **la tarjeta nunca se enteró** |
| Desconocido | «No pudimos completar el cobro. Ya lo estamos viendo.» | soporte |

**Por qué «fondos insuficientes» jamás se nombra:** es información del banco sobre la vida privada de una persona, dicha por nosotros en una pantalla que puede estar mirando alguien más. *El emisor no autorizó — eso es todo lo que sabemos y todo lo que corresponde decir.*

**Los escenarios se ensayan a propósito, no se esperan:** el arnés ya soporta override de `order.description` *(medido)* — «Denied transaction» → 9 · fraud → 11 · blacklist → 12. **Cada uno debe caer en su voz exacta.** *Un rechazo del banco dibujado como error de datos está tan roto como un timeout dibujado como rechazo.*

---

## §6 · PIEZA 6 — EL PAGO MIXTO

✅ **RIGE** — `LETRA_SALDO` **v1.1** §5, ratificada por el founder el 19-ago.

- **Orden fijo: primero el saldo, después la tarjeta.** La porción expuesta a la pasarela es **la menor posible**, y un eventual reverso de ese cobro es más chico. *Con reverso mismo-día contra un reloj que cierra a las 17:00, cuánta plata pasó por la pasarela deja de ser un detalle contable.*
- **Reverso de una compra mixta: cada porción vuelve por donde vino** — la porción saldo como **crédito nuevo** (movimiento, jamás edición), la porción tarjeta por la política vigente.

> 🔒 **Lo que S101-B construye de esto: LA COSTURA, no el motor.** El monto a debitar **entra como dato del desglose y jamás como total hardcodeado**, para que el día que el saldo exista se enchufe sin reformar el cobro. **El motor del saldo es S102** — acá no nace ni una tabla ni una pantalla suya.

---

## §7 · PIEZA 7 — TARJETAS GUARDADAS

`tarjetas_guardadas` existe *(medido, migración `20260821030000`)* con su forma ya decidida en S101-A:

- **La tarjeta es de la PERSONA** (`user_id`), no del hogar — **mismo criterio que `LETRA_SALDO` §2**: *el medio de pago y lo que vuelve por él pertenecen al mismo dueño.*
- **Guarda token + metadatos de reconocimiento** (marca, `bin`, últimos 4, titular). **JAMÁS PAN, CVC ni vencimiento**, con cinturón que lo vigila. *El día que alguien agregue esa columna, e-PetPlace pasa a ser PCI y ningún typecheck lo va a decir.*
- **Cero policies de INSERT/UPDATE, deliberado** *(medido)*: si el cliente pudiera insertar, **podría declararse dueño del token de otro**. Escribe el servidor.

**Lo que esta letra fija de la superficie:**

| Acto | Regla |
|---|---|
| **Listar** | por la puerta única (`@epetplace/api`). **El alias si existe, y SIEMPRE marca + últimos 4** — *el nombre ayuda a elegir, pero los cuatro dígitos son lo que deja verificar que es la que uno cree; el alias los acompaña, jamás los reemplaza.* Nada más que eso *(enmienda 20-ago)* |
| **Borrar** | **acto server-side**: endpoint del proveedor **y** la fila local. **P1 rige — doble confirmación destructiva.** El dueño sí puede borrar la suya: *quitar una tarjeta es derecho de la persona* |
| **Lista vacía** | **estado vacío digno con camino** (agregar tarjeta), jamás un hueco mudo |

**Borde que se ensaya y no se supone:** borrar una tarjeta **con un intento en vuelo**. La compuerta 5 (`token_ausente`) debe hablar en el próximo cobro — no un error crudo.

---

## §8 · EL VOCABULARIO DE LA PLATA — *(insumo obligatorio de la mesa)*

### §8.1 · Lo medido, que corrige al reporte heredado

El cierre de S101-A declaró *«cuatro sentidos de la misma palabra, dos de ellos visibles al mismo usuario en la misma app»*. **Medido de nuevo contra el objeto, la foto es más angosta — y eso abarata la decisión:**

| Dónde | Qué dice | ¿Lo lee el usuario? |
|---|---|---|
| `apps/cliente` `es.ts:1111` **`paquete.saldoActivo`** | *«…al elegir paseador **usas tu saldo**»* | ✅ **SÍ — y es la ÚNICA vez** |
| `apps/cliente` `en.ts:979` (la misma clave) | *«your **balance** is used…»* | ✅ **SÍ** |
| `railSaldo` · `notifFilaSaldoPagado` · `notifEjSaldoPagado`… | valores: «**salidas**», «Lo que ya pagaste» | ❌ **no** — «saldo» vive solo en el **nombre de la clave** |
| `salidas_saldo` · `saldo_total` · `saldo` | columnas y campos del motor | ❌ no |
| `apps/prestador` `es.ts:923` *«tu saldo por liquidar»* | plata, pero **del prestador** | ✅ sí — **otra app, otro actor: no choca** |
| `MODELO_DESPENSA` · `MODELO_NOTIFICACIONES` (`saldo_pagado`) | balance del vendedor · tipo de aviso | ❌ no (letra y motor) |

⇒ **En el texto visible de la app del cliente, «saldo» aparece EXACTAMENTE UNA VEZ, y significa salidas de un paquete.** *El costo de resolver la colisión es **una cadena por idioma**, no una campaña.*

🔴 **Y el dato más filoso, que el reporte heredado no tenía:** en inglés esa misma cadena traduce «saldo» como **«balance»** — o sea que **la palabra natural en inglés para la plata ya está tomada, en la misma app, para salidas de paseo.**

### §8.2 · La voz que esta letra elige, con su porqué

**La plata se llama «tu saldo» / «your balance».** No es preferencia: **`LETRA_SALDO` v1.1 §1 es letra firmada** y dice *«se muestra en la app como lo que es: **tu saldo**»*. Elegir otra palabra acá sería enmendar una letra firmada desde una letra de superficie.

⇒ **Lo que tiene que ceder es la otra ocupante** — y ceder le sale barato porque **su propio vecindario ya la llama por su nombre**: `railSaldo` dice literalmente «{{n}} salidas» / «{{n}} left». La cadena `paquete.saldoActivo` es la única que se salió del molde.

**Cura propuesta (UNA cadena × dos idiomas):** que `paquete.saldoActivo` diga **«usás tus salidas»** / **«your remaining walks are used»**. Resultado: **saldo = plata · salidas = salidas**, en toda la app del cliente.

### §8.3 · 🔒 DECLARADA COMO PENDIENTE CON DUEÑO — NO se cambia de paso

**Es una cadena publicada.** Por orden de mesa (19-ago): *si exige tocar strings publicados, se declara como pendiente con dueño, no se cambia de paso.*

| | |
|---|---|
| **Qué** | `paquete.saldoActivo` (es + en) deja de llamar «saldo»/«balance» a las salidas del paquete |
| **Dueño** | la sesión que escriba **la primera cadena visible del saldo** (S102) |
| **Disparo** | 🔴 **antes de esa primera cadena** — no después |
| **Por qué el disparo es ése** | mientras el saldo no tenga superficie, la colisión es **latente**: una sola palabra, un solo sentido a la vista. **El día que el saldo tenga pantalla, la misma app llama «saldo» a dos cosas distintas para la misma persona** — y ahí ya no es un string, es una familia sin saber si le devolvimos plata o paseos |

> *No se cura hoy porque hoy no hay colisión: hay una palabra ocupada y otra que todavía no llegó. Se declara hoy porque el día que llegue, quien la escriba tiene que encontrarse esto escrito y no descubrirlo con la pantalla hecha.*

---

## §9 · LO QUE ESTA LETRA **NO** DECIDE (y quién sí)

| Qué | Quién |
|---|---|
| Nombres de pantalla, rutas, navegación, dónde entra cada pieza | **el censo de la Fase 1** |
| Todo el CÓMO visual — composición, color, tipografía, motion, componentes | **`DIRECCION_ARTE` §9bis + la skill del design system** |
| Suscripción realtime vs. polling para «cambia sola» | **Fase 1 lo mide con su costo · Fase 4 decide con doble check** |
| El host web propio concreto para el Add Card | **Fase 1 ítem 4, confirmado — no elegido de memoria** |
| Los nombres de las resoluciones del barrido (`confirmado_tardio`…) | **la pista, contra lo que exista en la base** |
| Cualquier cosa de ledger, devengo, comisión, saldo-motor | **S102** |

---

## §10 · LO QUE ESTA LETRA DEJA ABIERTO, CON DUEÑO

| # | Abierto | Dueño | Disparo |
|---|---|---|---|
| 0 | **Los dos códigos sin ensayo** (`compra_sin_pedidos` · `desglose_incompleto`) | la pista | **Fase 3** |
| 1 | La cura de vocabulario de §8.3 | sesión de la primera cadena del saldo (S102) | 🔴 antes de esa cadena |
| 2 | Ensayo en rojo de los **tres códigos sin probar** (`pedidos_sin_reserva · compra_sin_pedidos · desglose_incompleto`) | la pista | Fase 3 |
| 3 | `order.vat` — el débito verde de punta a punta | Nuvei / Erick · founder persigue | 🔴 precondición de octubre (`D-852`) |
| 4 | La fila del `stoken` ⇒ encendido del actuador ⇒ **gate ⑤** | pista al llegar el vat · founder para el gate | carril externo |
| 5 | `D-850` — nadie valida cobertura en ningún punto | flujo de elección de dirección (cliente) | antes del primer pedido real de octubre |
| 6 | `D-851` — una reserva vencida no se puede rearmar ⇒ **todo gate usa compra FRESCA** | mesa (dos curas candidatas, ninguna elegida) | pre-lanzamiento |
| 7 | `D-853` — la página del Add Card a host propio | la pista | Fase 2 |
| 8 | Rotación de `ARNES_SECRET` | founder | al cerrar los ensayos |

---

## §8 · LA SUPERFICIE DE PAGO ES **UNA PIEZA** (21-ago-2026, orden del founder)

> Esta letra decía **qué** ve la familia cuando paga. Le faltaba decir
> **cuántas veces está escrito**.

**La despensa y el checkout de los cuatro oficios tenían la misma sección
escrita dos veces** —mismo estado, misma hoja, misma regla de preselección— y
**ya habían empezado a separarse**: el botón de una era `bloque` en un pie fijo
y el de la otra era chico y vivía suelto en el scroll.

> *Dos copias no divergen el día que se escriben: divergen el día que alguien
> afina una. Y la que no se afina no da error — se queda vieja.*

**Lo que rige:**

① **Un solo botón de pagar en la casa.** Mismo tamaño, misma presencia, mismo
   gate de habilitación, en las dos puertas.
② La sección vive **dentro de una superficie de tarjeta**.
③ **La fila de la elegida termina en «Cambiar ›»** — ☠️ muere «Elegido».
   *Era una etiqueta contando lo que la fila ya mostraba, y ocupaba el único
   lugar donde tenía que estar la acción.*
④ **La fila JAMÁS finge una elegida.** Sin elección hecha, no se dibuja ninguna
   tarjeta: se invita a elegir.
   🔴 **Y la cura obvia estaba prohibida:** preseleccionar la primera parece
   natural, pero el lector ordena por fecha descendente ⇒ **es la más
   reciente**, que es literalmente la regla de andamio que la Fase 5 mató.
   *Habría vuelto por la puerta de una cura de coherencia.*
⑤ Cada medio de la hoja lleva **marca a la izquierda y «›» a la derecha** —
   forma de camino. **DeUna va a ser una fila más**, y por eso la sección se
   llama «cómo quieres pagar» y no «tus tarjetas».
⑥ **El carrito flotante se calla dentro del checkout**, en las dos puertas.
⑦ **La espera tiene UNA animación para las dos**, y su regla es de honestidad:
   **el segmento no crece, viaja**. *Una barra de progreso afirma cuánto falta,
   y el tiempo lo tiene el proveedor.* Sin porcentaje, sin countdown, sin
   `value` en a11y — *anunciar «45 %» a quien no ve la pantalla sería la misma
   mentira dicha en voz alta.* **La voz escrita se queda: la animación
   acompaña, no reemplaza.**

⚠️ **Y no queda en promesa: lo vigila `R57`** de `verify:diseno`, con su límite
declarado — *mide que las dos pantallas MONTEN la misma pieza, jamás que se
vean igual.*

### §8bis · LA PÁGINA DEL ALTA TAMBIÉN ES LA CASA

**El barrido del CTA recorrió la app y la página del alta quedó afuera.**
*Un CTA que cambia de color en la casa y no en la puerta de al lado deja de ser
el CTA de la casa.* Rige: **el CTA en relleno ocre con letra tinta** (F-OCRE, y
**no se invierte con el tema**), los campos del proveedor con **el marco de la
casa y su interior respetado**, y el código de verificación en **voz de máquina
para los dígitos, voz de la casa para lo que le habla a la persona**.

---

## Historial

- **v1.3 (21-ago-2026, cierre S101-B/C · orden del founder):** nace **§8 · la superficie de pago es UNA PIEZA** (los siete puntos, con `R57` vigilándolo y su límite declarado) y **§8bis · la página del alta también es la casa**. La enmienda ④ registra la trampa medida: *preseleccionar la primera habría resucitado el andamio de «la más reciente» por la puerta de una cura de coherencia.*

- **v1.2 (20-ago-2026 — firma del founder): EL ALTA NACE AL TOCAR, NO AL ABRIR.** Requisito
  de la pantalla real de Medios de pago, nacido de un hallazgo del gate: el andamio creaba
  un alta **al abrirse** y por eso **la voz del vencimiento era inalcanzable** — diez altas
  en cuatro minutos, ninguna vencida. *La derivación del servidor estaba bien; la pantalla
  miraba el objeto equivocado.* **La forma general vale más que el caso:** un estado que
  solo aparece con el paso del tiempo no se puede observar en una pantalla que reinicia su
  reloj cada vez que se abre.

- **v1.1 (20-ago-2026 — enmienda por firma del founder): EL ALIAS DE LA TARJETA.** La
  familia puede nombrar su tarjeta al guardarla. Entra en **dos piezas**: §2 (el alta lo
  captura) y §7 (la lista lo muestra, **sin reemplazar marca + últimos 4**). Las cuatro
  reglas que la vuelven inofensiva están en §2: **opcional siempre · dato del cliente que
  jamás se usa para lógica · largo acotado · el campo va fuera del widget del SDK**. *Lo
  que se protege con eso no es el alias: es que un texto tipeado por una persona no se
  convierta nunca en una llave del sistema.*

- **v1.0 (19-ago-2026, S101-B · Fase 0):** nace como contrato de estados, voces y flujos de la superficie del cobro, con las **siete piezas** que el acta de apertura §2① pidió y el **insumo de vocabulario** que la mesa agregó al dar el visto. **Dos hallazgos propios, los dos por medición y no por herencia:** ① **tres de los nueve códigos tipados de `verificar_compuertas_pre_cobro` no tienen ensayo** —el 7/7 de S101-A ejercitó seis— y dos de ellos hablan hacia soporte, no hacia el cliente; ② **la colisión de «saldo» es de UNA cadena visible por idioma, no de dos sentidos conviviendo**, y en inglés la palabra natural para la plata (*balance*) ya está tomada por las salidas del paquete. Nace declarando que **ningún nombre de pantalla está medido** y que **si la fuente la contradice, gana la fuente** — la misma cláusula que en S101-A hizo que la letra del motor se enmendara en vez de defenderse.
