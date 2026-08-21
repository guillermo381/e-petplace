# PLAN_S101B_SUPERFICIE_PAGO.md — e-PetPlace

> **Nota de depósito (S101-B, 19-ago-2026):** este plan vivía solo en la orden de mesa de apertura. Se depositó **VERBATIM** — no se editó una coma del cuerpo.
>
> ✅ **La única enmienda, autorizada por la mesa el 19-ago: el encabezado subió de `v1.0` a `v1.1`.** El depósito lo había declarado como incoherencia interna y **no lo curó sin firma** —el `Historial` registraba una v1.1 con las cuatro firmas de la apertura, y el encabezado seguía en v1.0—. **La mesa dictaminó que fue omisión propia al enmendar el historial sin subir el encabezado, y que el registro correcto es el historial.** *Se cura acá, con su marca, en vez de dejar dos versiones conviviendo en el mismo archivo.*
>
> **Su regla de precedencia se aplica desde el primer día:** si este plan contradice al repo o a la letra, **gana la fuente** y el plan se enmienda con su marca.

---

> **Versión:** v1.2 · **Nace:** 19-ago-2026 · **EJECUTADO:** 21-ago-2026 · Sesión **S101-B · LA SUPERFICIE DEL PAGO** · **UNA SOLA PISTA**

---

## ✅ EJECUTADO — nota de cierre (21-ago-2026, gate del founder VERDE)

**Las seis fases corrieron.** El alta, el cobro, el webhook, la espera, los
medios de pago y el actuador están vivos y verificados en el aparato, y
**S101-C sumó la segunda puerta** (servicios) sobre el mismo motor.

🔴 **Y lo que este plan NO previó, que es lo que vale registrar:**

① **La Fase 5 no terminaba en «elegir tarjeta»: terminaba en UNA PIEZA.** El
plan trataba la sección de pago como una pantalla más; la construcción encontró
que **existía dos veces y ya divergía**. La unificación no estaba escrita acá —
la pidió el founder al verla, y hoy la vigila `R57`.

② **El motor se dio por «hasta que el pedido queda pagado», y el sujeto era
UNO.** S101-C probó que el actuador **ignora en silencio** un sujeto que no
conoce. *No falla: no hace nada* — y este plan no tenía una fase para eso.

③ **El carril externo se cumplió al revés de lo previsto:** el `vat` estaba
declarado como rojo esperado que no frena, y **resultó no ser de Nuvei sino
nuestro**. El reloj externo que sí mandó fue otro.

> *Un plan ejecutado no se archiva diciendo «se hizo»: se archiva diciendo
> **qué no vio**, porque eso es lo único que le sirve al que escriba el
> próximo.*

**Su regla de precedencia sigue rigiendo hacia atrás:** donde este plan
contradiga al repo o a la letra, **gana la fuente**.
> **Fuentes que obedece (en este orden):** el repo y su bitácora · `LETRA_MOTOR_PAGOS_S101.md` v1.2+ · acta de apertura S101-B · `LETRA_SALDO.md` v1.0 · `DIRECCION_ARTE` + skill `epetplace-design-system` (el CÓMO visual) · `POLITICAS_EPETPLACE` · `MODELO_FINANCIERO`.
> **Regla de precedencia:** si este plan contradice al repo o a cualquiera de esas fuentes, **gana la fuente y el plan se enmienda**. Este plan ORDENA el trabajo; no crea letra nueva ni firma nada.
>
> **Qué autoriza:** construir la superficie cliente del cobro — lo que la familia ve al pagar — hasta que el pedido queda pagado en pantalla, más el barrido y el actuador del webhook (condicionado).
> **Qué NO autoriza:** ledger/devengo/liquidación (S102) · impuestos (S103) · certificación y corte real (S104) · refund por API (E6) · construir el motor de saldo (S102, aunque su costura se deja prevista) · tocar diseño fuera de la ley vigente.
>
> **⚠️ Ningún nombre de pantalla, ruta o mecanismo de este plan está medido salvo los que la letra ya midió.** El censo de la Fase 1 manda sobre cualquier supuesto de acá.

---

## §0 · EL MAPA EN UNA PANTALLA

| Fase | Qué entrega | Depende de |
|---|---|---|
| 0 | La **letra de la puerta de pago** cerrada (mesa) | Nada — es lo primero y bloquea todo |
| 1 | **Censo** de `checkout.tsx` y las pantallas de pedido vivas | Fase 0 |
| 2 | **Alta de tarjeta** (host web propio + WebView + 3 desenlaces) | Fase 1 |
| 3 | **El cobro** (compuertas → voces → débito limpio) | Fase 2 |
| 4 | **La espera y la confirmación** (pantalla que cambia sola) + actuador del webhook con arnés, **apagado** | Fase 3 · el encendido espera la fila del stoken |
| 5 | **Tarjetas guardadas** (listar / borrar) | Fase 2 |
| 6 | **El barrido** programado (12:00 / 16:15 America/Guayaquil) | Fase 4 (lógica de consulta activa) |
| — | **Carril externo** (vat · stoken · Alexandra · DeUna · refund diferido) | Corre en paralelo, no bloquea 0–6 |

El orden 1→6 es el del acta §2② y **la mesa lo confirma al abrir**. El pago mixto y el saldo tienen §8 propio: contrato sí, construcción no.

---

## §1 · PROTOCOLO DE LA SESIÓN (heredado, no negociable)

- **UNA PISTA** mientras el circuito no cierre — el acta madre S101 §7 rige: *los pagos no se reparten*.
- Bitácora `docs/loop/S101-B.md` desde la primera acción · commit por pathspec · los cinco frenos de la casa.
- **Migrar / publicar / pushear piden firma del founder.** Todo corre contra **sandbox** hasta firma explícita; cualquier cosa que toque plata real pide firma **aunque sea de prueba**.
- Secretos (`app_code`, `app_key` de servidor, `ARNES_SECRET`) **solo en secrets de Edge Functions** — jamás en la app, el repo, el chat o la bitácora. El Auth-Token se genera **por request** (`Base64(APP_CODE;UNIX_TIMESTAMP;SHA256(app_key+timestamp))`, ventana 15 s).
- **El PAN jamás toca nuestro servidor** — no es doctrina: el proveedor lo verificó dos veces (rechazó el PAN server-to-server, aceptó el token del SDK). Nada de esta sesión puede erosionarlo.
- Skills obligatorias: `epetplace-db` en todo SQL/RPC · `epetplace-design-system` en toda pantalla · expo/skills en WebView, deep links y ciclo de update. **La letra manda el QUÉ; el CÓMO visual es de `DIRECCION_ARTE` §9bis + la skill** — este plan no dicta diseño.
- Leyes que S101-A pagó por aprender y acá rigen: el crudo (`payload_crudo`) se abre ANTES de diagnosticar · un rojo por la razón equivocada está tan roto como un verde por la razón equivocada · la observación de un solo tiro se protege · un cinturón que puede abortar por algo que no controla no protege, interrumpe · «publicable» no es «va commiteada» · **se publica lo incompleto, jamás lo falso**.

---

## §2 · FASE 0 — CERRAR LA LETRA DE LA PUERTA DE PAGO (mesa, antes de una línea de pista)

**Objetivo:** terminar la letra que quedó ofrecida al cierre de S101-A. Es el contrato de **estados, voces y flujos** de toda la superficie; ninguna pantalla se construye contra una letra a medias.

**Contenido mínimo, pieza por pieza (acta §2①, con las firmas de la jornada ya adentro):**

1. **La puerta existente** — qué dibuja hoy `checkout.tsx`, qué contrato de S100 se honra (*«S101 se enchufa acá sin tocar la pantalla»*), y la lápida vigente de `crear_intento_pago` (no crea intentos). La letra fija QUÉ se enchufa; el censo de la Fase 1 mide contra qué.
2. **El alta de tarjeta** — WebView sobre página propia con el SDK (la de ensayo es el prototipo probado; la de producto vive en **HOST WEB PROPIO** — Supabase degrada HTML por diseño y el parche TEXT/HTML es solo de ensayo). **Tres desenlaces: guardada / rechazada / abandonada**, cada uno con su estado y su voz. **El OTP de Diners vive ACÁ y solo acá** (tarjeta de prueba `36417002140808` · `012345` éxito / `543210` pendiente).
3. **El cobro** — las 6 compuertas ANTES del débito (letra §5.0; la #3 estructuralmente no evaluable, `no_evaluables:["cobertura"]` siempre a la vista — la cobertura se valida al elegir dirección, D-850). Cada fallo con su voz **antes de tocar la tarjeta**. El débito va **limpio: sin OTP, sin 3DS** (Erick, incluida recurrencia Diners).
4. **La espera** — caso ② de la letra §6: la respuesta síncrona es **SEÑAL OPTIMISTA, jamás confirma**. Voz propia («Estamos confirmando tu pago»), nunca spinner mudo, nunca «rechazado» por timeout. El webhook confirma; el barrido atrapa al huérfano el mismo día.
5. **El fallo con voz** — la taxonomía entera (letra §7 + fila E5): banco no autorizó ≠ OTP mal ≠ timeout ≠ datos inválidos ≠ compuerta. **«Fondos insuficientes» jamás se nombra.** El cliente jamás descubre un problema del pedido a través del cobro.
6. **El pago mixto** — saldo primero, tarjeta después (`LETRA_SALDO` §5, propuesta de mesa). La letra lo fija como contrato **sujeto a ratificación founder en esta sesión** junto con §2 (titularidad del usuario). Ver §8 de este plan.
7. **Tarjetas guardadas** — listar y borrar; la tabla ya migrada (RLS, sin policies de escritura, el cliente jamás inserta); endpoints de Nuvei identificados en la doc.

**Cierra cuando:** la letra queda depositada en `docs/` con cada pieza escrita, los estados y voces nombrados, y las dos ratificaciones pendientes marcadas con su dueño. **Firma que pide:** ratificar `LETRA_SALDO` §2 y §5 (o dejarlas explícitamente diferidas a S102 — lo que el founder decida se escribe, no se asume).

---

## §3 · FASE 1 — EL CENSO (medir antes de tocar)

**Precondición dura de toda construcción. Salida: relevamiento en `docs/relevamientos/` + transposición a la bitácora.**

Qué se mide, y el resultado se escribe aunque sea «no existe»:

1. **`checkout.tsx` hoy:** qué dibuja, qué datos consume, cómo llama a `crear_intento_pago`, qué navegación lo rodea. Decide **qué se enchufa** sin romper el contrato de S100.
2. **Las pantallas de pedido vivas:** detalle de pedido/compra, dónde se lee el estado, cuál es la pantalla que va a «cambiar sola» (letra §8). Los pedidos clavados en `pagando` **se dejan decaer** (cron job 12 activo, firma de mesa) — **el gate usa un pedido creado FRESCO**.
3. **El estado real del motor tras S101-A:** `pagos_intentos` enmendada (candado `(proveedor, proveedor_transaction_id, pedido_id)` parcial), `verificar_compuertas_pre_cobro` 5/5, orquestación compra → N pedidos, `tarjetas_guardadas`, buzón `pagos-webhook-stg` — **contra la base, no contra la memoria de la mesa**.
4. **La página Add Card de ensayo:** qué tiene, qué le falta para ser producto, y dónde vive el HOST WEB PROPIO candidato (se confirma acá, no se decide de memoria).
5. **Mecanismo de «cambia sola»:** medir si existe algún canal realtime en el monorepo (S94-PERF midió cero `.channel(` y D-739 declara el costo del realtime) — el censo entrega las dos opciones (suscripción vs polling suave con backoff en la pantalla de espera) **con su costo**, para que la Fase 4 decida con doble check, no por reflejo.
6. **Deep link / retorno del WebView:** cómo vuelve la app desde la página del alta (esquema, ruta), medido contra lo que Expo Router ya soporta en las apps.

**Cierra cuando:** el relevamiento está depositado y la mesa confirma el enchufe. **No se hace acá:** ninguna migración, ninguna pantalla.

---

## §4 · FASE 2 — EL ALTA DE TARJETA (prerequisito de todo cobro)

**Objetivo:** que una familia guarde una tarjeta desde la app, con el PAN viviendo solo en los campos alojados de Nuvei.

**Trabajo, en orden:**

1. **La página de producto** (host web propio): nace de la página de ensayo probada — SDK real, campos alojados, `stoken` del lado que corresponde. Estilo mínimo coherente con la ley (el CÓMO lo pone la skill); **cero secretos en el HTML**.
2. **El WebView en la app:** apertura desde la superficie de pago/tarjetas, canal de retorno medido en Fase 1, cierre limpio.
3. **Los tres desenlaces, cada uno con voz y destino:**
   - **Guardada** → la tarjeta aparece en la lista (persistencia server-side; el cliente jamás inserta en `tarjetas_guardadas`).
   - **Rechazada** → voz de la taxonomía (§7 letra), reintentar o corregir.
   - **Abandonada** (la familia cierra el WebView) → sin residuo: ni fila fantasma ni estado colgado.
4. **El OTP de Diners** vive en este flujo y solo en este flujo — la pantalla de cobro **no se construye esperando ningún código** (E2).
5. **Matriz de ensayo (sandbox):** éxito con OTP `012345` · pendiente con `543210` · rechazo · abandono a mitad de camino · red caída durante el WebView · reintento tras rechazo. Cada caso con su evidencia en bitácora.

**Cierra cuando:** los tres desenlaces corren contra sandbox con evidencia, y la tarjeta guardada se lee desde la app por la puerta única (`@epetplace/api`). **Firma que pide:** push de la tanda; publicación de la página en el host propio.

---

## §5 · FASE 3 — EL COBRO (compuertas → voces → débito limpio)

**Objetivo:** que el toque de «pagar» sea la última puerta de una fila de compuertas, no la primera sorpresa.

**Trabajo, en orden:**

1. **Cablear `verificar_compuertas_pre_cobro` a la superficie:** las 6 compuertas corren ANTES del débito; cada fallo se muestra con la voz de §7 **antes de tocar la tarjeta** (fila E5). `no_evaluables:["cobertura"]` se respeta a la vista — ningún llamador lee un verde como «cobertura verificada».
2. **El débito:** limpio, sin OTP ni 3DS, contra el token guardado; monto = **desglose congelado, centavo a centavo** (compuerta 2). El candado de idempotencia protege el doble toque («Tu pago anterior se está procesando» — jamás segundo débito). La orquestación compra → N pedidos ya existe: la superficie la consume, no la reimplementa.
3. **La respuesta síncrona se trata como señal optimista** y despacha a la Fase 4 — la pantalla de cobro jamás declara «pagado» por su cuenta.
4. **Los escenarios de rechazo se producen a propósito** con el override de `order.description` que el arnés ya soporta: «Denied transaction» → 9 · fraud → 11 · blacklist → 12. Cada uno debe caer en su voz exacta de §7 — un rechazo del banco dibujado como error de datos está tan roto como un timeout dibujado como rechazo.
5. **Bloqueante conocido, declarado y no maquillado — con firma founder (19-ago): SE CONSTRUYE IGUAL.** El débito **rebota hoy en `order.vat`** (staging aparenta exigir vat > 0 y el catálogo entero es `EC_IVA_0`) y la respuesta de Erick no llegó. La orden es construir el flujo completo, débito incluido, **sabiendo que el disparo va a volver rojo por vat**: ese rojo es **rojo esperado y documentado**, no hallazgo — se registra con su causa para que nadie lo diagnostique dos veces (la ley del crudo rige). Los rechazos se ensayan por override; el débito **verde** de punta a punta vive en el carril externo (§9). 🔴 Si la cuenta productiva exige vat > 0, sigue siendo **precondición de apertura de octubre**.

**Cierra cuando:** compuertas + voces + doble-toque + escenarios de rechazo corren con evidencia; el débito verde queda declarado como dependiente del vat si la respuesta no llegó. **Firma que pide:** push de la tanda.

---

## §6 · FASE 4 — LA ESPERA Y LA CONFIRMACIÓN (la pantalla que cambia sola)

**Objetivo:** que entre el toque y la confirmación haya una espera **declarada**, y que la confirmación llegue del motor, no de la mano de nadie.

**Trabajo, en orden:**

1. **La pantalla de espera:** «Estamos confirmando tu pago», con destino claro. Nunca spinner mudo; nunca «rechazado» por timeout; si la confirmación tarda, la voz lo dice y la familia puede irse — el pedido avanza solo (caso ①).
2. **El mecanismo de «cambia sola»:** decidir con la medición del censo (suscripción vs polling suave) — doble check en bitácora antes de construir; la opción elegida declara su costo (D-739 si es realtime; cadencia y tope si es polling).
3. **El actuador del webhook, construido y APAGADO:** máquina de estados **como dato** (patrón S95, 46 transiciones) con los reversos `27 · 28 · 7 · 34 · 29` como **transiciones con fila propia** (no códigos tolerados) · dedupe por `proveedor_transaction_id` · validación de monto (`monto_no_coincide` registra y no mueve) · transición idempotente · tolerancia a desconocidos (`status_detail 30`: registra, no mueve, avisa) · el cierre de lote **se identifica cuando aparezca el primero, no se cablea** (su crudo queda en `webhook_events`).
4. **Los cuatro casos de la letra §6, escritos y probados con arnés sobre fixtures** (no necesitan pasarela): webhook-sin-teléfono · teléfono-sin-webhook (consulta activa `GET /v2/transaction/<id>` con reintentos espaciados) · llegan los dos (el segundo no hace nada y deja traza; divergencia = hallazgo, jamás sobrescritura silenciosa) · no llega ninguno (lo resuelve el barrido, §7 de este plan). Más los hermanos: webhook tardío (48 h) y duplicado.
5. **El encendido del actuador NO es de esta fase:** el buzón sigue buzón **hasta que la fila del stoken dé true** (observación de un solo tiro — se protege, no se quema). El flip y el **gate ⑤** (el ojo del founder sobre la compra en pantalla pasando a pagada sola, con pedido FRESCO) viven en el carril externo (§9).

**Cierra cuando:** pantalla + mecanismo + actuador apagado + cuatro casos verdes por arnés, con la evidencia en bitácora y el estado del encendido declarado sin maquillar.

---

## §7 · FASE 5 — TARJETAS GUARDADAS · FASE 6 — EL BARRIDO

**Tarjetas guardadas (listar / borrar):**
1. Listar desde la app por puerta única (marca, `ultimos4` — jamás PAN).
2. Borrar = **acto server-side** contra el endpoint de Nuvei ya identificado + la fila local; el cliente jamás escribe la tabla. En UI, **P1 (doble confirmación destructiva)** rige.
3. Ensayo: borrar la única tarjeta · borrar con intento en vuelo (la compuerta 5 debe hablar en el próximo cobro) · lista vacía digna.

**El barrido (caso ④, mismo-día por diseño):**
1. Job programado en **America/Guayaquil**: pasada **~12:00** y **última 16:15** — 45 min antes del corte más temprano (17:00 Medianet · 17:50 Datafast). **Después del corte no hay reverso por API**: la cadencia es la protección, no un detalle.
2. Recorre pagos sin confirmar del día → consulta activa → resuelve y **registra cada hallazgo con su resolución** (`confirmado_tardio` · `reversado_mismo_dia` · `huerfano_escalado` — los nombres los fija la pista contra la base, no contra la letra).
3. Ensayo con arnés: huérfano confirmado tarde · huérfano reversado · huérfano que escala. El barrido **jamás** marca «rechazado» por su cuenta: escala.

**Cierra cuando:** listar/borrar verdes en sandbox; el barrido corre programado en staging con sus tres resoluciones ensayadas. **Firma que pide:** push + programación del job.

---

## §8 · EL SALDO Y EL PAGO MIXTO — contrato sí, construcción no

- **Nada del saldo se construye en S101** (letra §9 / E6): motor, tablas y UI del saldo son **S102**.
- Lo que esta sesión SÍ hace: (a) la letra de la puerta fija el contrato del mixto (saldo primero, tarjeta después — la porción expuesta a la pasarela es la menor posible); (b) el flujo de cobro se construye con **la costura prevista**: el monto a debitar entra como dato del desglose, no como total hardcodeado — cuando el saldo exista, se enchufa sin reformar el cobro; (c) el reverso de una compra mixta queda escrito: **cada porción vuelve por donde vino**.
- ✅ **RATIFICADAS (firma founder, 19-ago, mesa de apertura S101-B):** `LETRA_SALDO` §2 — el saldo es **del usuario que pagó**, no del hogar · §5 — **pago mixto saldo-primero**, tal como la mesa lo propuso («ok, como lo pones»). La pista transpone las dos firmas a `LETRA_SALDO.md` (pasan de propuesta a letra que RIGE) al depositar. La construcción del motor sigue siendo S102 — la firma fija el contrato, no adelanta la obra.

---

## §9 · EL CARRIL EXTERNO — llaves, dueños y relojes

Corre en paralelo; **no bloquea las Fases 0–6**. Cada llave con su consecuencia si no llega:

| Llave | Dueño | Reloj | Qué destraba | Si no llega |
|---|---|---|---|---|
| Respuesta de Erick — `order.vat` con catálogo `EC_IVA_0` | Founder persigue / Nuvei responde | 🔴 precondición de octubre | El débito verde de punta a punta (Fase 3.5) → reintento del disparo | La sesión cierra hasta la puerta del débito **y lo dice** |
| **La fila del stoken** (reintento sobre `a4f8f309` o rearme) | Pista, al llegar el vat | Un solo tiro — se protege | Buzón → **actuador** → **gate ⑤** founder | El actuador queda construido y apagado, declarado |
| Bloque comercial de **Alexandra** (fraude · tarifario · ruteo por marca · onboarding 5 días · contrato) | Founder | **Es el reloj real de octubre** | Cronograma real de lanzamiento | Octubre sin fecha confiable — se escala, no se estima |
| Documentación **DeUna** + ambiente de pruebas | Founder la persigue | **Corte firmado: 11-sep** | Análisis del segundo riel contra el mismo contrato de compra | **DeUna sale de octubre** — el corte se ejecuta, no se renegocia en silencio |
| Respuesta **refund diferido** (anulación mismo-día vs `POST /v2/transaction/refund/`) | Nuvei / Erick | — | La promesa exacta de T&C §9.2 y LETRA_SALDO §8.4 | El saldo sigue siendo la vía por defecto; **ningún flujo de refund por API se construye** (E6) |
| Credenciales productivas + D-751 (VTEX) | Founder | Pre-S104 | Certificación y corte real | S104 sigue bloqueada — ya declarado |

Cuando el circuito cierre (débito verde + stoken true + actuador encendido + gate ⑤), la pista prepara el **correo de certificación** con DF + código de autorización (letra §11 paso 9) y lo entrega al founder para envío.

---

## §10 · LO QUE NO ENTRA (con puntero, para que nadie lo «rescate» por las dudas)

Ledger / devengo / comisión / liquidación → **S102** (letra financiera v3.0; la razón está medida: tres números conviven para la misma comisión y congelar el equivocado es irreversible por diseño) · impuestos y matriz fiscal → **S103** (espera contador) · certificación y corte real → **S104** · el corte semilla/real → sesión propia pre-lanzamiento · **la cura de `inventario_reservas`** → medición propia, dos candidatas sin elegir — 🔴 **pre-lanzamiento obligatorio** (hoy un cliente que deja vencer el checkout no puede pagar nunca; esta sesión NO la resuelve y NO la olvida: queda en la cola con su bandera) · postventa y refund por API → E6 · motor de saldo → S102 · recurrencia → fuera de alcance (ya desbloqueada por Erick, no por eso entra).

---

## §11 · CRITERIOS DE CIERRE DE S101-B — y el cierre honesto

**La sesión cierra verde si:**
1. La letra de la puerta de pago depositada y completa (7 piezas).
2. Alta de tarjeta E2E en sandbox: tres desenlaces con evidencia.
3. Cobro: compuertas + voces + doble-toque + escenarios de rechazo por override, verdes.
4. Espera + actuador apagado + cuatro casos con arnés, verdes.
5. Tarjetas guardadas listar/borrar, verdes.
6. Barrido programado en staging con sus tres resoluciones ensayadas.
7. Bitácora al día · commits por pathspec · nada publicado sin firma.

**Lo que puede quedar abierto SIN romper el cierre — se declara con nombre, jamás se maquilla (letra §12):** el débito verde de punta a punta (vat) · la fila del stoken · el actuador encendido · el **gate ⑤** · el cronograma de octubre (Alexandra) · DeUna. *Se publica lo incompleto, jamás lo falso: si al cierre el circuito no cerró, la sesión entrega las fases y lo dice.*

---

## §12 · LAS FIRMAS DEL FOUNDER — cuándo las pide la sesión

| # | Firma | Cuándo |
|---|---|---|
| 1 | ✅ Confirmar el orden de construcción (§0) — **FIRMADA 19-ago** | — |
| 2 | ✅ Ratificar `LETRA_SALDO` §2 y §5 — **FIRMADAS 19-ago, como la mesa las propuso** | — |
| 3 | **Autorizar** migración / publicación / push de cada tanda. 🔴 **Enmienda de protocolo (firma founder, 19-ago): la EJECUCIÓN es de la sesión** — Code prepara, la mesa valida, el founder autoriza (hace de bus entre mesas) y **la sesión ejecuta el push/migración/deploy**. Lo que no cambia: nada se ejecuta sin esa autorización explícita, tanda por tanda, y sandbox hasta firma para cualquier cosa que toque plata real | Al cierre de cada fase |
| 4 | Publicar la página del alta en el host web propio | Fase 2 |
| 5 | Programar el job del barrido en staging | Fase 6 |
| 6 | **Gate ⑤** — su ojo sobre la compra en pantalla pasando a pagada sola (pedido fresco) | Carril externo, cuando el circuito cierre |
| 7 | Rotación de `ARNES_SECRET` al cerrar los ensayos | Cierre de sesión |
| 8 | La cura de `inventario_reservas` — solo cuando llegue su medición (no en esta sesión) | Fuera de S101-B |

---

## Historial

- **v1.2 (21-ago-2026, cierre de S101-B/C con gate del founder VERDE):** marcado **EJECUTADO** con su nota de cierre. Se registran **las tres cosas que el plan no vio** —la sección de pago como PIEZA y no como pantalla · el actuador que ignora un sujeto desconocido · el `vat` que era nuestro y no del proveedor— porque *un plan ejecutado sirve por lo que no vio, no por lo que se cumplió.*
- **v1.1 (19-ago-2026, mesa de apertura con el founder):** cuatro firmas registradas — ① orden de construcción confirmado · ② `LETRA_SALDO` §2 y §5 **ratificadas** como la mesa las propuso (la pista las transpone a la letra) · ③ el vat sin respuesta **no frena**: se construye el flujo completo y el rebote por vat queda como rojo esperado y documentado · ④ enmienda de protocolo: **la ejecución de push/migración/deploy es de la sesión**, con validación de mesa y autorización del founder tanda por tanda (el founder hace de bus, no de mano ejecutora).
- **v1.0 (19-ago-2026):** nace al abrir S101-B sobre el acta de apertura, `LETRA_MOTOR_PAGOS_S101` v1.2 y `LETRA_SALDO` v1.0. Ordena las seis fases del acta §2②, deja el actuador del webhook construido-y-apagado hasta la fila del stoken, fija la costura del saldo sin construir su motor, y tabula el carril externo con sus relojes (vat 🔴 octubre · Alexandra = reloj real · DeUna corte 11-sep).
