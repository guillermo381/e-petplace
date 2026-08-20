# ACTA DE APERTURA — S101-B · LA SUPERFICIE DEL PAGO

> **Nota de depósito (S101-B, 19-ago-2026):** este acta vivía **solo en la conversación de mesa** — el reporte de apertura de la pista lo midió y lo declaró como freno (cero ocurrencias de `S101-B` en todo el árbol). La mesa la adjuntó y **se deposita VERBATIM**: no se editó una coma del cuerpo. **Su propia regla rige y está escrita en su encabezado: si este acta contradice al repo, gana el repo.**
>
> **Tres puntos del acta ya quedaron superados por hechos posteriores a su redacción. Se declaran acá para que nadie lea el cuerpo y crea que rige la versión vieja:**
>
> 1. 🔴 **`§4.5` — «El push de cada tanda — commits, migraciones y deploys siguen siendo de su mano» y `§6` — «migrar/publicar/pushear piden firma del founder»: ENMENDADOS.** Rige la firma del founder del 19-ago registrada en `PLAN_S101B_SUPERFICIE_PAGO` v1.1 **§12.3**: **la EJECUCIÓN es de la sesión** — Code prepara, la mesa valida, el founder autoriza (hace de bus entre mesas) y **la sesión ejecuta el push/migración/deploy**. *Lo que NO cambió, y es la mitad importante: nada se ejecuta sin autorización explícita del founder, tanda por tanda, y todo lo que toque plata real pide firma aunque sea de prueba.* El acta describe **quién aprieta el botón**; la enmienda cambió eso y **no** cambió la puerta.
> 2. ✅ **`§2①6` y `§4.1` — la ratificación de `LETRA_SALDO` §2 y §5: YA FIRMADA.** El acta las lista como *«pendiente de ratificación founder EN ESTA SESIÓN»*; el founder las ratificó en la **misma mesa de apertura**, las dos como la mesa las propuso. Están transpuestas a `LETRA_SALDO.md` **v1.1**, que es la fuente que rige.
> 3. ✅ **`§2②` — el orden de construcción que el acta propone «a confirmar por la mesa al abrir»: CONFIRMADO** en esa misma mesa (`PLAN_S101B_SUPERFICIE_PAGO` §12.1).
>
> *Ninguna de las tres es un error del acta: son decisiones que la mesa tomó **después** de escribirla. Se anotan acá porque un acta se lee entera y sin contexto tres sesiones más tarde — y la que más daño haría es la primera, que describe un protocolo operativo que ya no es el vigente.*

---

> Abierta por mesa el 19-ago-2026, al cierre de S101-A. La sesión anterior construyó el
> circuito del dinero hasta la anteúltima puerta; ésta construye **lo que la familia ve
> cuando paga** — y cierra lo que quedó en vuelo cuando las llaves externas lleguen.
>
> **Para la mesa que abre:** este acta es el contexto mínimo suficiente. Las fuentes
> vivas están en el repo (`LETRA_MOTOR_PAGOS_S101.md` v1.3 · `LETRA_SALDO.md` ·
> `docs/loop/S101-A.md` · los relevamientos de la jornada). **Si este acta contradice
> al repo, gana el repo** — S101-A cerró después de cada uno de sus documentos y la
> bitácora es la última palabra.

---

## §1 · DÓNDE QUEDÓ EL CIRCUITO (medido, no aspirado)

**Funciona, probado contra el objeto:**
- Buzón de webhooks desplegado (`pagos-webhook-stg`), validando stoken con `stoken_de`,
  persistiendo todo — incluso lo rechazado. Callback registrado por Nuvei.
- Credenciales propias staging (`EPETPLACESTG-EC-CLIENT`/`-SERVER`) cargadas y validando.
- Motor en la base: `pagos_intentos` enmendada (candado `(proveedor, transaction_id,
  pedido_id)`), compuertas pre-cobro 5/5 con `no_evaluables:["cobertura"]` a la vista,
  orquestación compra → N pedidos, `tarjetas_guardadas` migrada.
- Tokenización de punta a punta **validada por el proveedor dos veces el mismo día**:
  rechazó el PAN server-to-server (401 not PCI) y aceptó el token de su SDK. El PAN
  jamás toca nuestro servidor — no es doctrina, es verificación del proveedor.
- Página Add Card de ensayo funcionando (SDK real, campos alojados por Nuvei).

**En pausa externa, con su llave:**
- **El débito rebota en `order.vat`** (la cuenta staging aparenta exigir vat > 0; nuestro
  catálogo entero es `EC_IVA_0`). Llave: respuesta de Erick (correo enviado 19-ago).
  🔴 **Precondición de apertura de octubre** — si la cuenta productiva exige vat > 0,
  ningún producto real se cobra.
- **La fila del stoken**: observación intacta de un solo tiro. Sin transacción no hubo
  webhook. Se cierra en el reintento (misma URL del arnés, compra `a4f8f309` o rearme).
  **El buzón NO pasa a actuador hasta que esa fila dé true.**
- El bloque comercial (Alexandra): fraude, tarifario, ruteo por marca, onboarding de la
  sociedad de 5 días, contrato. **Es el reloj real de octubre.**

## §2 · QUÉ ABRE ESTA SESIÓN — en orden, y el orden es la ley

### ① LA LETRA DE LA PUERTA DE PAGO (mesa, antes de una línea de pista)

Quedó ofrecida y en producción al cierre de S101-A; esta sesión la termina PRIMERO.
Es el contrato de estados, voces y flujos de toda la superficie. Sus piezas, con las
firmas de la jornada ya adentro:

1. **La puerta existente** — `checkout.tsx` vive y llama `crear_intento_pago` (que no
   crea intentos — lápida vigente); el contrato de S100 dice "S101 se enchufa acá sin
   tocar la pantalla". El censo de esta sesión mide qué dibuja hoy antes de decidir qué
   se enchufa.
2. **El alta de tarjeta** — WebView cargando página propia con el SDK (la página de
   ensayo es el prototipo probado; la de producto vive en HOST WEB PROPIO — Supabase
   degrada HTML por diseño, el parche TEXT/HTML es solo de ensayo). Tres desenlaces:
   guardada / rechazada / abandonada. El OTP de Diners vive ACÁ (tarjeta de prueba
   36417002140808 · 012345 éxito / 543210 pendiente), jamás en el cobro.
3. **El cobro** — las 6 compuertas ANTES del débito (la 3 estructuralmente no evaluable
   — cobertura se valida al elegir dirección, D-850), cada fallo con su voz ANTES de
   tocar la tarjeta. El débito va limpio: sin OTP, sin 3DS (confirmado por Erick,
   incluida recurrencia Diners).
4. **La espera** — caso ②: la respuesta síncrona es SEÑAL OPTIMISTA, jamás confirma.
   "Estamos confirmando tu pago", nunca spinner mudo, nunca "rechazado" por timeout.
   El webhook confirma; el barrido (últimas pasadas 12:00 y 16:15 — cortes 17:00/17:50)
   atrapa al huérfano el mismo día, porque después del corte no hay reverso por API.
5. **El fallo con voz** — la taxonomía entera (letra §7 + E5): el banco no autorizó ≠
   OTP mal ≠ timeout ≠ datos inválidos. "Fondos insuficientes" jamás se nombra. Los
   escenarios de rechazo se prueban con `order.description` ("Denied transaction" → 9,
   fraud → 11, blacklist → 12) — el arnés ya lo soporta por override.
6. **El pago mixto** — saldo primero, tarjeta después (propuesta de mesa en LETRA_SALDO
   §5, pendiente de ratificación founder EN ESTA SESIÓN, junto con §2 titularidad).
7. **Tarjetas guardadas** — listar y borrar (tabla ya migrada: RLS, sin policies de
   escritura, el cliente jamás inserta). Endpoints de Nuvei ya identificados en la doc.

**La letra manda sobre el QUÉ; el CÓMO visual es de DIRECCION_ARTE + la skill del
design system, que la pista consume del repo. Esta acta no dicta diseño.**

### ② LA PISTA CONSTRUYE (después de la letra, y solo entonces)

Orden de construcción propuesto — la mesa lo confirma al abrir:
1. Censo de `checkout.tsx` y las pantallas de pedido vivas (medir antes de tocar).
2. Alta de tarjeta (host + WebView + desenlaces) — es el prerequisito de todo.
3. El cobro con compuertas y voces.
4. La espera y la confirmación por webhook (pantalla que cambia sola — el gate ⑤
   del founder sigue pendiente de S101-A y se ejecuta acá).
5. Tarjetas guardadas (listar/borrar).
6. El barrido programado (12:00 / 16:15 America/Guayaquil).

### ③ LO QUE SE DESTRABA SOLO CUANDO LLEGUEN LLAVES (no bloquea ①②)

- Respuesta del vat → reintento del disparo → **la fila del stoken** → si true, el
  buzón pasa a actuador → gate ⑤ founder (la compra en pantalla pasando a pagada sola).
- Respuesta de Alexandra → cronograma real de octubre.
- Documentación de DeUna (el founder la persigue) → análisis del segundo riel contra
  el mismo contrato de compra. Corte firmado: **sin ambiente de pruebas al 11-sep,
  DeUna sale de octubre.**

## §3 · LO QUE NO ENTRA

El ledger/devengo/liquidación (S102, letra financiera v3.0 — seis capítulos definidos)
· impuestos y matriz fiscal (S103, espera contador) · certificación y corte real (S104,
bloqueada por D-751 VTEX + credenciales productivas) · el corte semilla/real (firmado,
sesión propia pre-lanzamiento) · la cura de `inventario_reservas` (dos candidatas SIN
elegir — merece su medición, pero 🔴 es pre-lanzamiento obligatorio: hoy un cliente
que deja vencer el checkout no puede pagar nunca) · la postventa y el refund por API
(no existe fuera del mismo día — política reescrita: saldo como única vía automática).

## §4 · FIRMAS PENDIENTES DEL FOUNDER (la sesión las pide cuando toquen)

1. Ratificar LETRA_SALDO §2 (saldo del usuario que pagó) y §5 (pago mixto saldo-primero).
2. La cura de reservas cuando su medición llegue.
3. El gate ⑤: su ojo sobre la pantalla cuando el circuito cierre.
4. Rotación de `ARNES_SECRET` al cerrar los ensayos (quedó en historial de navegador
   y chats — sandbox, no incidente, pero se rota).
5. El push de cada tanda — commits, migraciones y deploys siguen siendo de su mano.

## §5 · LEYES QUE ESTA SESIÓN HEREDA CON NOMBRE

Las de la casa, más las que S101-A pagó por aprender:
· El crudo se abre ANTES de diagnosticar (el 403 se leyó dos veces mal desde la tabla
  genérica y una vez bien desde `payload_crudo`).
· Un rojo por la razón equivocada está tan roto como un verde por la razón equivocada.
· La observación de un solo tiro se protege: no se quema diagnosticando el problema
  equivocado.
· Un cinturón que puede abortar por algo que no controla no protege — interrumpe.
· «Publicable» no es «va commiteada».
· Se publica lo incompleto, jamás lo falso.

## §6 · PROTOCOLO

UNA PISTA mientras el circuito no cierre (el acta madre S101 §7 sigue rigiendo: los
pagos no se reparten). Bitácora `docs/loop/S101-B.md` · commit por pathspec · los
cinco frenos · migrar/publicar/pushear piden firma del founder · sandbox hasta firma
explícita · y cualquier cosa que toque plata real pide firma aunque sea de prueba.
