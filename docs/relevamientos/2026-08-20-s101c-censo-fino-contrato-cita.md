# CENSO FINO · EL CONTRATO DE LA CITA ANTE EL MOTOR DE PAGOS
> S101-C · 20-ago-2026 · **medición, cero código** · primer ítem del orden firmado
> Letra que lo manda: `LETRA_PAGO_CITAS` §1 y §2

---

## ① EL PUNTERO — `pagos_intentos` hacia una cita

**Lo que hay hoy:**

```
id · pedido_id · compra_id · proveedor · proveedor_referencia · monto · moneda ·
forma · url_redireccion · estado · motivo_rechazo · payload_crudo ·
clave_idempotencia · creado_en · actualizado_en · cerrado_en · confirmado_por ·
proveedor_transaction_id · authorization_code · marca · bin · ultimos4
```

**Dos punteros, los dos a la despensa** (`pedido_id` FK · `compra_id` FK), y
**`pedido_id` está lleno en el 100 % de las filas** (`nulls = 0`).

🔴 **Y el hallazgo que ordena la forma de la cura:** el único CHECK de forma que
tiene la tabla es

```
CHECK (forma <> 'redireccion' OR estado = 'iniciado' OR url_redireccion IS NOT NULL)
```

— que es sobre la redirección, **no sobre el objeto**. ⇒ **Hoy nada impide que un
intento apunte a un pedido Y a una compra a la vez, o a ninguno.** *El invariante
«exactamente uno» que la letra §1 pide **no existe todavía ni para la despensa**.*

⇒ **La cura no es solo agregar `cita_id`: es escribir el invariante que falta.**
Un CHECK de «exactamente uno de {pedido, cita}» — `compra_id` es agrupador, no
sujeto — y **eso mejora también el camino ya vivo**, que hoy se sostiene por
disciplina.

⚠️ **Y el candado que sí existe hay que replicarlo:**
`uq_pagos_intentos_tx_por_pedido` es lo único que impide reaplicar una
transacción del proveedor sobre otro objeto — **la versión para citas hay que
escribirla, no heredarla**: un UNIQUE sobre `pedido_id` no ve una fila cuyo
`pedido_id` es NULL.

## ② EL DESGLOSE CONGELADO

| | |
|---|---|
| `compra_desglose` | `compra_id · pedido_id · subtotal · impuesto · envio · total · congelado_en` |
| **`cita_desglose`** | 🔴 **NO EXISTE** |

**La cita tiene `precio` y nada más:** medido, `evento_cita_servicio` **no tiene
columna `moneda`** — la moneda vive en la cuenta comercial del prestador, que es
de donde `confirmar_cita_pagada` la saca hoy.

⇒ El desglose de cita necesita **su propia tabla** con la misma forma útil
(`total` + los componentes + `congelado_en`), y **la moneda resuelta al
congelar**: *un desglose sin moneda no es un desglose — es un número.*

## ③ EL HOLD ES EL ANÁLOGO DE LA RESERVA

`evento_cita_servicio` ya tiene **`expira_en`** y **`estado_reserva`**, y
`confirmar_cita_pagada` ya rebota `hold_expirado`. **La pieza que la letra §3
llama «el análogo de la reserva de inventario» ya existe y funciona** — no se
construye, se conecta.

**Hoy hay 0 citas con hold vivo** (nadie está reservando en este momento), así
que el arnés tendrá que fabricar el suyo por el camino real, como en Fase 3.

## ④ EL COSTO DE TOCAR LA CITA — 16 FKs entrantes

`evento_cita_servicio` tiene **16 claves foráneas apuntándole**. *No bloquea nada
—no se va a borrar ni renombrar— pero fija el criterio: se le AGREGAN columnas y
tablas satélite; no se la reestructura.*

---

## LO QUE ESTO FIJA PARA LAS MIGRACIONES (entregadas sin aplicar, con reversa)

1. **`pagos_intentos.cita_id`** (FK a `evento_cita_servicio`) **+ el CHECK de
   «exactamente uno»** que hoy falta — y que de paso protege el camino vivo.
2. **El UNIQUE de transacción por cita**, hermano del de pedido: *sin él, la
   defensa que ya nos rebotó una vez no cubre el objeto nuevo.*
3. **`cita_desglose`**, con `moneda` resuelta al congelar.

**Cero cambios al motor de pagos.** La letra §4 lo dice y el censo lo confirma:
el buzón, el actuador, la consulta activa, el barrido y el comprobante **no se
tocan** — lo único que cambia es qué objeto señala el intento.
