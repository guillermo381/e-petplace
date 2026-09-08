# S114-A → C y E · A6 cerrado · el ledger devenga los cuatro servicios

> **A, 7-sep-2026. Destraba C8 y saca a E2 de su bloqueante.**

## Lo que cambió

Los cuatro productores de devengo que faltaban (F10) existen y devengan:

| servicio | acto que devenga | ancla | verificado |
|---|---|---|---|
| veterinaria | `completar_cita_servicio` | cita | ✅ camino real |
| telemedicina | `cerrar_teleconsulta` | cita | ✅ camino real |
| guardería día/paquete | acto `entregada` | **estadía** (§8 ②) | ✅ camino real |
| guardería mensualidad | acto `entregada`, por día ejecutado | estadía | ⚠️ **rama construida, CERO casos vivos** |
| despensa | cuarto escalón `entregado` (trigger) | pedido | ✅ camino real |

**El chasis es el de grooming, extraído a helpers** (`_devengar_cita`,
`_devengar_estadia`, `_devengar_pedido`), todos idempotentes.

## El rojo de E: 19 → 0, POR CONSTRUCCIÓN

Los cuatro productores evitan que un cierre NUEVO deje un sujeto sin evento.
Los 19 ya cerrados se **backfillearon** (no se filtró el gate): los 19
devengaron, 0 salteados. Es seguro porque `LETRA_POSTVENTA` declara que ningún
dato de servicio es real — mueve plata de sandbox.

- eventos por origen ahora: **cita 53 · estadia 1 · pedido 3** (antes: sólo cita 38)
- rojo global «cerrado sin evento»: **0**

## Para C (C8)

`obtenerServiciosSinCerrar` sigue sin existir — **C8 depende de F1**, no de A6.
Lo que A6 destraba es distinto: **ahora la línea de las 48 h del prestador puede
decir la verdad**, porque un servicio cerrado devenga de verdad en el ledger.
El «no se cobra» de F1 se apoya en que el «sí se cobra» exista, y ahora existe.

## Para E (E2)

- El ledger devenga los cuatro servicios; tu gate «pagado y cerrado sin evento»
  da **0** por construcción.
- **`devengo por sujeto`**: podés medir los tres orígenes ahora
  (`origen_tipo` ∈ cita/estadia/pedido), no sólo cita.
- 🔴 **Un caso que TE PIDO medir cuando exista**: la rama de **mensualidad** está
  construida (`precio_mensual / días del período`) pero **no tiene un solo caso
  vivo** — no la calibré contra datos que no existen (R5). Cuando nazca una
  estadía de mensualidad, tu gate es el que confirma que el reparto por día suma
  el mes. Hasta entonces, su verde sería falso.

## Un hallazgo que valió la pena, para el canon

Guardería rebotaba con «No se encontró fee_config aplicable»: existía uno para
`origen=cita` y otro para `origen=pedido`, **ninguno para `origen=estadia`**.
No inventé una tarifa (adenda 5): guardería ES `prestador_servicios`, así que
cloné la historia completa del fee de servicios (15% hasta 25-ago, 10% desde
entonces) con su origen. Misma tarifa, distinto origen.
