# LETRA_SALDO.md — e-PetPlace

> **Versión:** v1.0 · **Nace:** 19-ago-2026 (S101, mesa founder + arquitecto)
> **Disparo:** `MODELO_FINANCIERO` regla 7.16 lo dejó **declarado y apagado** con la
> condición *«su letra propia nace antes del primer crédito real»*. El primer crédito
> real quedó firmado hoy (el reembolso por saldo como vía por defecto) ⇒ el disparo sonó
> y esta es la letra.
> **Destino:** capítulo de la v3.0 de `MODELO_FINANCIERO` (S102). Se deposita ahora en
> `docs/` para que la sesión lo consuma; donde esta letra y la v3.0 difieran, gana la v3.0.
>
> **⚠️ CONDICIONADA EN UN SOLO PUNTO:** la promesa exacta del camino al medio de pago
> original depende de la respuesta pendiente de Nuvei (¿existe el refund diferido o solo
> la anulación mismo-día?). **Todo lo demás rige con cualquier respuesta** — esa es la
> razón por la que esta letra se escribe hoy y no espera.

---

## §1 · QUÉ ES EL SALDO Y QUÉ NO ES

El saldo es **plata del cliente en custodia de e-PetPlace**, expresada en USD, utilizable
en cualquier compra o servicio de la app.

**No es** un programa de puntos, ni un cupón, ni un beneficio promocional. Nace de plata
real que el cliente ya pagó y no recibió lo que pagaba. Por eso:

- **No vence.** *(Firma founder, 19-ago.)*
- **No se recorta, no se condiciona a mínimos de compra, no exige "activación".**
- Se muestra en la app como lo que es: *tu saldo*.

## §2 · DE QUIÉN ES

**Del usuario que pagó.** La plata vuelve a quien la puso, no al hogar ni a la familia.

*(Propuesta de mesa con voto del arquitecto, pendiente de ratificación founder en S102.
La alternativa —saldo del hogar— mezcla plata de personas distintas en una bolsa que
nadie autorizó a compartir; si dos adultos del hogar pagan cada uno con su tarjeta, sus
reembolsos no son intercambiables.)*

## §3 · DE DÓNDE NACE (fuentes v1, lista cerrada)

| Fuente | Momento |
|---|---|
| Cancelación de pedido antes de «preparado» | Al cancelar |
| Pedido no entregado (desenlace 3 de la conciliación) | Al resolverse la conciliación |
| Cancelación de cita en ventana (≥24 h) | Al cancelar |
| Ajuste a favor del cliente resuelto por soporte | Al resolverse |

**Ninguna otra fuente en v1.** En particular: el saldo **jamás nace de una promoción,
un regalo o un incentivo** — eso sería otra figura (beneficio comercial), con otro
tratamiento contable y fiscal, y mezclarlas en la misma bolsa vuelve inauditables a las
dos. El día que exista un programa promocional, tendrá su propia letra y su propia
columna de origen.

## §4 · CÓMO VIVE EN EL MOTOR — append-only, patrón del ledger

El saldo se representa como **movimientos inmutables**, jamás como un número que se
edita. El saldo visible es la suma de los movimientos.

- **Crédito**: nace con monto, origen (catálogo de §3), y puntero a la operación que lo
  originó (la compra, la cita). Jamás huérfano.
- **Consumo**: nace al usarse, con puntero a la operación donde se usó.
- **Ningún movimiento se edita ni se borra.** Una corrección es un movimiento nuevo que
  lo compensa, con su motivo. *(Precedente: L-231 — un ledger append-only no se corrige
  borrando filas.)*
- El consumo es **FIFO sobre los créditos vigentes** — el crédito más viejo se consume
  primero. *(Precedente: Decisión T, el paquete consume FIFO a precio de origen.)*

**Contablemente el saldo es un PASIVO** de Satori Inov Latam S.A.S. (fondos de
clientes), nunca ingreso. Ver §7.

## §5 · CÓMO SE USA

- **Universal**: productos y servicios, cualquier vertical. *(Firma founder: «usar en
  la app como requieras».)*
- **Pago mixto permitido**: si el saldo no cubre el total, cubre lo que alcance y el
  resto va al medio de pago. **Orden fijo: primero el saldo, después la tarjeta** — así
  la porción expuesta a la pasarela es la menor posible, y un eventual reverso de ese
  cobro es más chico.
  - *(Propuesta de mesa pendiente de ratificación founder. La alternativa todo-o-nada es
    más simple de construir pero produce el caso absurdo: cliente con $18 de saldo no
    puede comprar algo de $20 sin ignorar su saldo.)*
- **Reverso de una compra mixta**: cada porción vuelve por donde vino — la porción saldo
  vuelve como crédito nuevo (movimiento, no edición), la porción tarjeta sigue la
  política de reembolsos vigente.

## §6 · SI SE PUEDE RETIRAR

**Sí, como excepción y por soporte — jamás como botón en la app (v1).**

El cliente que exija su plata en dinero y no en saldo tiene derecho a recibirla:
transferencia bancaria manual desde la cuenta de Satori EC, con plazo declarado de
proceso manual. Es la válvula legal — un saldo del que no se puede salir convertiría la
custodia en retención.

**El costo operativo de esa transferencia lo absorbe e-PetPlace en v1** (no se le cobra
al cliente por recuperar su plata). Si el volumen lo vuelve caro, se revisa con datos.

## §7 · TRATAMIENTO CONTABLE — reclasificación, jamás causación anticipada

*(Firma founder, 19-ago, con la mecánica corregida en mesa.)*

- El saldo es **pasivo** desde que nace hasta que se consume o se retira.
- El **ingreso de e-PetPlace nace cuando el saldo se usa** — en la operación donde se
  consume, por la vía normal de esa operación (la comisión de la compra o del servicio
  pagados con saldo). El saldo en sí **jamás genera ingreso por existir**.
- **A los 3 meses sin uso, el crédito se RECLASIFICA** — de *pasivo corriente esperado*
  a *pasivo de baja probabilidad de uso*. **No se reconoce como ingreso.** El
  reconocimiento ocurre únicamente cuando prescriba de verdad, con el plazo y la figura
  que diga el contador.
- **Razón de la mecánica** (para que nadie la "simplifique" después): causar a los 3
  meses obligaría a reversar ingreso ya declarado —con IVA semestral ya pagado— cada vez
  que un cliente aparezca en el mes 4. La reclasificación deja el mes 1 y el mes 12
  idénticos: el cliente usa su saldo, e-PetPlace entrega, el ingreso nace ahí.

## §8 · LO QUE ESTA LETRA DEJA ABIERTO, CON DUEÑO

| # | Abierto | Dueño |
|---|---|---|
| 1 | Ratificar §2 (del usuario) y §5 (mixto) | Founder, S102 |
| 2 | Régimen legal del saldo en Ecuador: ¿dinero electrónico, custodia, prescripción a favor del Estado? | Contador + abogado (pregunta 4 de la lista acumulada) |
| 3 | Plazo de prescripción real para el reconocimiento de §7 | Contador |
| 4 | La promesa del camino al medio de pago original en los T&C | Respuesta de Nuvei (refund diferido sí/no) |
| 5 | El esquema exacto de tablas (¿extiende el motor financiero o nace tabla propia?) | Censo de S102 contra la base — esta letra fija el contrato, no los nombres |

---

## Historial

- **v1.0 (19-ago-2026, S101):** nace por disparo de la regla 7.16. Deposita las firmas
  del founder de la jornada (no vence · reclasifica a 3 meses · universal) y las dos
  propuestas de mesa pendientes de ratificación (titularidad del usuario · pago mixto
  saldo-primero). Escrita durante la espera de la respuesta de Nuvei sobre el refund
  diferido, deliberadamente: rige con cualquier respuesta.
