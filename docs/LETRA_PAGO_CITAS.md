# LETRA_PAGO_CITAS.md — e-PetPlace · S101-C

> **Versión:** v1.1 · **Nace:** 20-ago-2026 · **RIGE — enchufe EJECUTADO 21-ago-2026** (mesa founder + arquitecto, sobre el censo
> de la segunda puerta del mismo día).
> **Fuentes que obedece:** el repo y su bitácora · `LETRA_MOTOR_PAGOS_S101` (el motor
> rige entero) · `LETRA_SALDO` v1.1 · `POLITICAS_EPETPLACE` (P14 · P16 · P18 · P22) ·
> `MODELO_FINANCIERO`. **Si esta letra contradice a cualquiera, gana la fuente.**
> **Qué fija:** el contrato del OBJETO CITA ante el motor de pagos. **Qué no fija:**
> nada del motor (ya está escrito y probado) ni ventanas de cancelación (son de
> POLITICAS). Los nombres exactos de tablas y columnas los fija la pista contra la
> base — esta letra fija el contrato, no los nombres.

---

## §1 · LA CITA ES OBJETO COBRABLE PROPIO

La cita entra al motor como lo que es — **jamás disfrazada de compra o pedido**. El
puntero de `pagos_intentos` se extiende para poder señalar una cita (la forma exacta
—columna nueva con CHECK de «exactamente uno», o la que el censo fino determine— la
mide la pista). El candado de idempotencia se replica con el mismo invariante:
**una transacción del proveedor jamás se reaplica sobre otra cita.**

## §2 · EL DESGLOSE CONGELADO DE LA CITA

Nace **al reservar**, centavo a centavo: precio vigente del servicio + fee según la
configuración que las compuertas existentes ya exigen (`sin_fee_config`). La
compuerta 2 del motor compara contra él — **sin desglose congelado no hay cobro**
(fail-closed). El IVA de servicios se deriva del desglose, jamás se teclea
(la regla del cobro de despensa rige idéntica).

## §3 · EL MOMENTO DEL COBRO — al reservar

*(Firma ① del founder, 20-ago-2026.)*

El cobro corre **al reservar**: la cita confirmada es agenda comprometida del
prestador, y comprometer agenda sin plata es la deuda que esta letra viene a cerrar.
El orden es ley:

1. Las **12 compuertas existentes** de la reserva (hold, cuenta activa, fee,
   dirección…) corren primero — no se reconstruyen, ya están.
2. El **cobro** por el motor (compuertas de pago → débito) corre después.
3. La cita pasa a **confirmada/pagada solo cuando el motor confirma** — jamás por
   declaración propia. El hold de agenda es el análogo de la reserva de inventario:
   si el pago no llega, el hold vence y la agenda se libera.

## §4 · EL CIRCUITO — reusado entero, cero piezas nuevas

La puerta única server-side (extensión de `pagos-cobro` o hermana con **el mismo
contrato de seguridad**: la sesión es la autorización · el monto jamás viaja del
cliente · pertenencia verificada) → señal optimista → **la espera con voz** (jamás
spinner mudo, jamás rechazo por timeout) → webhook / consulta activa → **el actuador
transiciona la cita** (solo eventos SERVER autenticados) → **el comprobante por
correo con id de transacción + código de autorización** (requisito de certificación,
literal de Erick) → el **barrido** cubre también a los huérfanos de citas. La
pantalla que cambia sola rige igual: `checkout-reserva` deja de declarar y pasa a
esperar la verdad del servidor.

## §5 · CANCELACIÓN Y REVERSO — el camino de la plata, no las ventanas

Las **ventanas son de POLITICAS y no se tocan**: P14 (plan, 24 h) · P16 (paquete,
2 h) · P18 (paseo suelto, 24/2 h) · P22 (clínica, declarada SIN letra). Esta letra
fija solo el camino de la plata:

- La cancelación **se declara sobre el pago** (patrón 7.14; `aplicar_reembolso()`
  como puerta).
- La **vía automática es el saldo** (`LETRA_SALDO` §3 — la cancelación de cita en
  ventana ya es fuente firmada de crédito).
- El **medio de pago original** existe como vía manual: reverso por API solo el
  mismo día; pasado el cierre de lote, **trámite con el banco** (literal de Erick,
  contactos vía Alexandra). Su promesa exacta y plazos en T&C son de **S102**.
- **Mientras P22 no tenga letra, la cancelación de la cita clínica se resuelve por
  soporte, manual y declarada** — el cobro clínico entra igual; su cancelación fina
  espera su letra. *(Firma ② del founder, 20-ago-2026.)*

## §6 · LA MUERTE DE `confirmar_cita_pagada` — D-855

El REVOKE corre **con el reemplazo listo, jamás antes** (revocar sin puerta nueva
deja a los cuatro oficios sin poder reservar). Producción jamás abre con esa RPC
viva. Las **138 citas** `pago_simulado` quedan como datos declarados — las resuelve
el corte semilla/real ya firmado, no esta sesión.

## §7 · LO QUE NO ENTRA EN S101-C

Superficie nueva más allá del enchufe de `checkout-reserva` (las pantallas finas son
de la sesión siguiente — decisión founder 20-ago) · pago mixto y motor de saldo
(S102) · DeUna (corte 11-sep) · ambiente productivo (diferido a cierre de
funcionalidades — decisión founder 20-ago) · P22 (letra propia).

## §8 · FIRMAS

| # | Qué | Estado |
|---|---|---|
| ① | El cobro al reservar (§3) | ✅ **FIRMADA — founder, 20-ago-2026** |
| ② | Clínica: cancelación por soporte mientras P22 no tenga letra (§5) | ✅ **FIRMADA — founder, 20-ago-2026** |
| ③ | Todo lo demás | Rige por letra ya firmada (motor · saldo · políticas) |

> **S101-C no tiene ninguna firma pendiente: §3 y §5 rigen completos.**

---

## §9 · EL ENCHUFE, EJECUTADO (21-ago-2026)

**Esta letra RIGE y su construcción está viva.** Lo ejecutado:

| pieza | estado |
|---|---|
| `pagos_intentos` apunta a **una cita** — y a **exactamente un** sujeto | ✅ `20260822010000` |
| `cita_desglose` congelado, **con moneda** | ✅ `20260822020000` |
| El congelado por **TRIGGER**, no por productor | ✅ `20260822030000` — *cubre las SIETE puertas que insertan citas, y la octava que alguien escriba sin leer esta letra* |
| `user_tiene_acceso_a_mascota_como` — el acceso con usuario explícito | ✅ `20260822040000` |
| ☠️ `confirmar_cita_pagada` **REVOCADA** | ✅ `20260822050000` |

🔴 **LO QUE EL ENCHUFE ENSEÑÓ, y no estaba en esta letra:**

**El reemplazo no estaba listo cuando el arnés cobró una cita.** La pantalla que
montan los cuatro oficios **seguía llamando a la RPC vieja**, y las dos cosas
eran ciertas a la vez sin contradecirse — *por eso no había síntoma*.

> **Un productor probado solo por su arnés está probado como productor, no como
> reemplazo:** el arnés demuestra que la puerta nueva **abre**, jamás que la
> vieja **dejó de usarse**. Lo segundo es un censo de consumidores, y es lo
> único que autoriza cerrar la vieja.

⇒ **La precondición se escribió como CINTURÓN, no como nota:** la migración del
`REVOKE` verifica que el reemplazo esté en pie y **aborta con el agujero
todavía cerrado** si falta algo. *Una precondición que vive en un comentario se
cumple mientras alguien la lea.*

**Las 138 citas con `pago_simulado: true` siguen siendo DATOS DECLARADOS** — las
resuelve el corte semilla/real ya firmado. No se tocaron.

---

## Historial

- **v1.1 (21-ago-2026, cierre S101-B/C):** nace **§9 · el enchufe ejecutado** con sus cinco migraciones y la lección que impuso: *un productor probado solo por su arnés está probado como productor, no como reemplazo.* La precondición del `REVOKE` quedó como **cinturón**, no como nota.

- **v1.0 (20-ago-2026):** nace en mesa sobre el censo de la segunda puerta (mismo
  día): puerta única `checkout-reserva`, 12 compuertas vivas, `confirmar_cita_pagada`
  ejecutable por authenticated (D-855), 138 citas simuladas, y los tres huecos del
  contrato (puntero, desglose congelado, camino del reverso) — que esta letra cierra.
- **Nota de depósito (pista, 20-ago-2026):** depositada **VERBATIM** salvo §8, donde
  las firmas ① y ② pasan de «pendiente founder» a **firmadas con su fecha** por el
  relevo del mismo día, y §3/§5 pierden su marca de propuesta. *Ninguna otra coma se
  editó: la letra es de la mesa, no de la pista.*
