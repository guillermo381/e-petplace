# CENSO · LA SEGUNDA PUERTA DE PAGO — LOS SERVICIOS
> S101-B · 20-ago-2026 · **medición pura, cero código** · orden de mesa tras el hallazgo del founder

**El founder pagó un paseo en el aparato y el flujo NO pasa por el motor de pagos: se declara pagado a sí mismo.** Es la clase exacta que `checkout.tsx` tenía antes del enchufe de Fase 3.

---

## ① LA PUERTA ES UNA SOLA, y eso es la buena noticia

Los cuatro oficios —**paseo · grooming · veterinaria · adiestramiento**— tienen su
`checkout.tsx`, pero **los cuatro montan la misma pieza**:
`apps/cliente/src/components/checkout-reserva.tsx`.

**Un solo lugar cobra los cuatro servicios.** *El enchufe de la despensa costó lo
que costó porque había que descubrir el camino; acá el camino ya está unificado.*

## ② QUÉ HACE HOY

`checkout-reserva.tsx` → `confirmarCitaPagada({ cita_id })` → **`confirmar_cita_pagada(uuid)`**.

Y esa función **es honesta sobre lo que es**: escribe, en la misma transacción,

```
estado = 'confirmada' · estado_reserva = 'pagada'
metadata || {'pagado_en': now(), 'pago_simulado': true}
```

**`pago_simulado: true`, escrito por el motor.** No es un descuido escondido: está
declarado. Lo que cambió es el mundo alrededor — *ahora hay un motor de cobro
real al lado, y una puerta que se declara pagada sola dejó de ser un andamio
aceptable para pasar a ser la puerta por la que se sale sin pagar.*

## ③ 🔴 LO QUE MÁS IMPORTA — LA PUERTA ESTÁ ABIERTA A CUALQUIER SESIÓN

| | |
|---|---|
| `confirmar_cita_pagada` ejecutable por `authenticated` | **`true`** 🔴 |
| `confirmar_pago_compra` (despensa) ejecutable por `authenticated` | **`false`** ✅ |

**Cualquiera con una cuenta puede declarar pagada su propia cita.** La despensa
cerró esa puerta en S101-B; **servicios la tiene abierta**. *La asimetría es la
medida exacta de la deuda: el mismo producto, dos puertas, una con candado.*

## ④ LO QUE **SÍ** TIENE, Y NO HAY QUE VOLVER A CONSTRUIR

`confirmar_cita_pagada` ya corre **ocho compuertas** antes de mover nada:
`auth_required` · `cita_no_existe` · `no_es_tu_cita` · `cita_ya_confirmada`
(idempotencia) · `cita_estado_invalido` · **`hold_expirado`** · `cita_sin_precio`
· `prestador_sin_cuenta_comercial` · `cuenta_no_activa` · `cuenta_sin_rol_activo`
· `sin_fee_config` · **`direccion_requerida`**.

**Es el mismo espíritu que las compuertas pre-cobro de la despensa, y ya está
escrito.** *Lo que falta no es el criterio: es el cobro.*

## ⑤ LO QUE LE FALTA AL CONTRATO DEL MOTOR PARA RECIBIR UNA CITA

El motor de S101 orquesta **compra → pedidos**. **Una cita es otro objeto**, y la
diferencia no es de nombre:

| | despensa | servicios |
|---|---|---|
| objeto | `compras` + `pedidos` | **`evento_cita_servicio`** |
| desglose congelado | `compra_desglose` | **no existe** — el precio vive en la cita |
| intento de pago | `pagos_intentos.pedido_id` | **`pagos_intentos` NO tiene columna de cita** ⇒ hoy **0 intentos de cita** |
| `dev_reference` | el id de la compra | **sin definir** |
| reserva de stock | `inventario_reservas` | **el HOLD de agenda** — otro recurso, misma idea |
| cancelación | pedido cancelable hasta «preparado» | **ventana de POLITICAS (≥24 h)** + `LETRA_SALDO` §3 |

⇒ **Tres huecos concretos:** ① `pagos_intentos` no puede apuntar a una cita ·
② no hay desglose congelado para citas —**la compuerta 2 del motor compara contra
un desglose que acá no existe**— · ③ el reverso y el saldo tienen letra propia
(`LETRA_SALDO` §3, cancelación ≥24 h como fuente) que **el motor de despensa no
implementa**.

## ⑥ EL NÚMERO DEL PASADO

**138 citas con `pago_simulado: true`.** *No son un problema de plata —nadie pagó
nada— pero son el denominador de cualquier reporte de ingresos que alguien mire,
y la primera cita real va a convivir con ellas.*

---

## PROPUESTA — DÓNDE VIVE EL ARCO

🔴 **NO dentro de Fase 5.** Fase 5 es **la superficie del medio de pago**;
esto es **motor + contrato**, y meterlo adentro convertiría una pantalla en un
arco de dos frentes. *El precedente de esta sesión es el argumento: la Fase 3 fue
el enchufe y la Fase 5 es la pantalla — no se mezclaron, y por eso las dos
avanzaron.*

**Recomiendo `S101-C` propia**, con este orden:
1. **La letra del contrato de la cita** (qué congela, qué es su `dev_reference`,
   cómo se ancla el intento) — *el motor de despensa nació de una letra, y ese
   fue el motivo de que enchufarlo fuera un día y no una semana.*
2. **REVOKE de `confirmar_cita_pagada` a `authenticated`** — con su reemplazo
   listo, no antes. *Revocar sin puerta nueva deja a los cuatro oficios sin poder
   reservar.*
3. El enchufe, reusando **todo** lo de S101-B: `pagos-cobro` es agnóstico del
   objeto salvo por el desglose; el buzón, el actuador, el barrido y el
   comprobante **no cambian**.

**Lo que ya se puede decir sin más medición:** la parte cara —tokenización, alta
de tarjeta, webhook, stoken, actuador, reconciliación, comprobante— **ya está
construida y probada**. Lo que falta es **el contrato del objeto cita**.
