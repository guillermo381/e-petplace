# ENMIENDA_S101_MOTOR_v1.1.md — e-PetPlace

> **Enmienda a `LETRA_MOTOR_PAGOS_S101.md` v1.0 → v1.1** · 19-ago-2026, mesa de la tarde.
> **Se deposita como archivo de enmienda** para que la pista la aplique sobre la letra en
> el repo (la letra vive allá; esta enmienda dice qué cambia y por qué). Tres fuentes:
> **el censo B0** (midió lo que la letra suponía) · **las respuestas de Erick** (OTP en
> el alta, no en el débito · reverso mismo-día) · **las firmas de mesa de la tarde**.

---

## E1 · §3 SE DEROGA ENTERO — el motor ya existe

El censo midió `pagos_intentos`, `pagos_eventos`, `compras`, `compra_desglose`,
`cat_transiciones_pedido` y `confirmar_pago_pedido` vivos, con el enchufe de S100
declarado en el código. **Las tablas candidatas de §3 no se crean.** Rige la orden de
migración 2 ya entregada a la pista: **enmendar `pagos_intentos`**, con el UNIQUE
primero. `webhook_events` (migración 1, ya corrida) queda **condicionada al ítem ① de
esa orden**: si la medición contra `pagos_eventos` la declara duplicación, se revierte
con su reversa.

## E2 · §4 SE CORRIGE — `esperando_otp` cambia de dueño

**Fuente: Erick, 19-ago:** *«el formulario de tokenización pide el usuario el otp pero
en el débito no se debe pedir»*.

- `esperando_otp` / `en_desafio` son estados del **ALTA DE TARJETA** (Add Card en el
  WebView), no del cobro.
- **El flujo de débito no espera desafío.** Ninguna pantalla de cobro se construye
  esperando un código.
- El handler del webhook **no cambia**: los `status_detail` 1/31/32/33/35-48 se siguen
  recibiendo, registrando y tolerando — lo que cambia es qué flujo de UI los consume.

## E3 · §5 GANA UN PASO CERO — LAS VALIDACIONES PRE-COBRO

**Fuente: reverso mismo-día (Erick).** Si deshacer un cobro es caro o imposible, **la
plata que no se cobra mal no hay que devolverla**. El débito no se dispara sin pasar,
en orden, TODAS estas compuertas — y cada rechazo tiene su voz (§7 de la letra):

| # | Compuerta | Si falla |
|---|---|---|
| 0 | **La compra no tiene ya un intento en vuelo** (el candado del UNIQUE de la migración 2, verificado también en código) | «Tu pago anterior se está procesando» — jamás segundo débito |
| 1 | **La reserva de stock sigue viva** (no venció el TTL) | Se rearma el carrito contra stock actual; si ya no hay: «producto ya no disponible» (firma S99) |
| 2 | **El monto a debitar == el desglose congelado**, centavo a centavo | No se cobra. Hallazgo rojo a soporte — un monto que divergió del desglose es defecto nuestro, no del cliente |
| 3 | **La dirección está dentro de cobertura** | Se corrige antes de cobrar, no después |
| 4 | **El vendedor sigue activo** (cuenta activa, regla 7.13) | No se cobra |
| 5 | **La tarjeta/token existe y está vigente** | Voz de datos inválidos, corregir |

**Regla madre: todo lo que pueda impedir la entrega se verifica ANTES del débito.**
Cobrar y descubrir después es exactamente el caso que ya no podemos deshacer barato.

## E4 · §6 CASO ④ CAMBIA DE CADENCIA — el barrido es MISMO-DÍA

**Fuente: reverso mismo-día.** Un cobro huérfano (Nuvei debitó; ni webhook ni teléfono
nos lo contaron) detectado **hoy** se reversa; detectado **mañana** es plata del cliente
retenida y un caso de soporte.

- El barrido de intentos sin confirmar (consulta activa a `GET /v2/transaction/`) corre
  **varias veces al día**, y **la última pasada corre antes del corte del día de Nuvei**.
- ⚠️ **La hora exacta del corte no está medida** — Erick dijo que *«depende del carrier,
  la hora varía»*. Hasta tener el dato, la última pasada corre **a las 22:00
  America/Guayaquil** como supuesto declarado, y la pregunta va a la lista de Erick:
  *¿a qué hora cierra el día para efectos del reverso?*
- Todo hallazgo del barrido se registra con su resolución: `confirmado_tardio` ·
  `reversado_mismo_dia` · `huerfano_escalado` (los nombres los fija la pista contra lo
  que exista).

## E5 · §7 GANA UNA FILA — la voz del cobro casi-definitivo

A la taxonomía de fallo se agrega el caso nuevo que E3 crea:

| Causa | Qué se le dice | Salida |
|---|---|---|
| Compuerta pre-cobro falla (E3 #1-#4) | La causa real, ANTES de tocar la tarjeta: «el producto ya no está disponible», «tu dirección quedó fuera de cobertura» | Resolver y reintentar — **la tarjeta nunca se enteró** |

**El principio:** el cliente jamás descubre un problema del pedido A TRAVÉS de un cobro
fallido o de una devolución. Lo descubre antes, con su nombre.

## E6 · §9 SUMA UNA EXCLUSIÓN CONDICIONADA — la promesa del camino largo

La política de reembolsos al medio de pago original (T&C §9.2) queda **SUSPENDIDA DE
REDACCIÓN** hasta la respuesta de Erick sobre el refund diferido (anulación mismo-día vs
`POST /v2/transaction/refund/`). La pista no construye ningún flujo de refund por API
hasta esa respuesta. **El saldo (letra propia: `LETRA_SALDO.md`) no está condicionado y
se construye como vía por defecto.**

## E7 · §11 SE REORDENA — el estado real

| Paso | Estado |
|---|---|
| 1 · Censo B0 | ✅ ejecutado, con hallazgos que esta enmienda transpone |
| 2 · Buzón desplegado + URL | ✅ probado, secretos validando, URL en manos de Nuvei |
| 3 · Migración 2 (enmienda `pagos_intentos`) | 🔨 en pista, orden entregada |
| 3bis · **Las compuertas pre-cobro (E3)** | nuevo, entra después de la migración 2 |
| 4 · Máquina de estados como dato (con E2 aplicada) | pendiente |
| 5 · Webhook completo (validación, dedupe, transición) | pendiente |
| 6 · Los cuatro casos con arnés (con la cadencia de E4) | pendiente |
| 7 · Escalera de los seis clavados (semilla confirmada — el gate los mira, el corte semilla/real los marca) | pendiente |
| 8 · Fallo con voz (con E5) | pendiente |
| 9 · Correo de certificación | pendiente |
| 10 · Cobro sandbox punta a punta | ⏳ bloqueado por registro de callback (Nuvei) |

---

*Aplicación: la pista incorpora E1-E7 al cuerpo de `LETRA_MOTOR_PAGOS_S101.md`, sube la
versión a v1.1 con esta enmienda citada en el historial, y deposita `LETRA_SALDO.md` en
`docs/`. Este archivo de enmienda se conserva — el porqué no se borra.*

---

## Nota de aplicación (S101-A, 19-ago-2026)

E1-E7 aplicadas al cuerpo de `LETRA_MOTOR_PAGOS_S101.md`, que pasó a **v1.1** y ganó
sección `Historial` (no tenía). Dos precisiones que la aplicación registró y que la
enmienda no podía saber:

- **E1 · el ítem ① ya se resolvió y NO es duplicación.** `webhook_events` se queda; no se
  revierte. Lo decide la **cardinalidad** (un golpe HTTP de una compra de N pedidos deja
  1 fila allá y N en `pagos_eventos`) y que ninguna se deriva de la otra. Medido además:
  `pagos_eventos` tiene un solo escritor y un solo lector, los dos `confirmar_pago_pedido`.
- **E1 · el «UNIQUE primero» quedó descartado por prueba y reemplazado por firma de
  mesa** (19-ago, cierre): rige `UNIQUE (proveedor, proveedor_transaction_id, pedido_id)`
  parcial. El literal `(proveedor, proveedor_referencia)` es **inconstruible** junto con
  la orquestación — probado en rojo sobre la compra real `fc8e2a85`, que ya tiene dos
  pedidos: el segundo intento viola la constraint, porque `proveedor_referencia` es el
  `dev_reference` y **el dev_reference es la compra**, compartida por sus N pedidos.
