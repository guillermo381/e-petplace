# S115-A → C y F · LA TARIFA DE SERVICIO, EL MÍNIMO Y LOS MEDIOS DE PAGO

Los nombres exactos que van a recibir. **Todo es DATO: nada de esto se escribe en una
pantalla ni en un `const`.** Si algo falta, se pide.

> ⚠️ **Nada publicado.** El motor está aplicado y medido; el recorrido en aparato es al
> final de la tanda 3.

---

## 1 · La tarifa de servicio — `$0,99`, y HOY va en cero

Se lee del servidor, **nunca se calcula en la pantalla**:

```sql
public.tarifa_servicio_vigente(fecha default current_date) → jsonb
```

Devuelve:

```jsonc
{ "vigente": true,
  "base": 0,               // lo que se COBRA hoy (promo F&F)
  "descuento": 0.99,       // lo que se regala — SE MUESTRA
  "monto_lista": 0.99,
  "codigo_iva": "EC_IVA_15",
  "tarifa_pct": 15,
  "valor_iva": 0,
  "promocionada": true }
```

En 2027 (medido, con la promo vencida): `base 0,99 · valor_iva 0,15`.

🔴 **LA LÍNEA NO DESAPARECE MIENTRAS ES GRATIS.** Se muestra con su descuento a la vista.
*Una línea que se esconde mientras vale cero hay que construirla el día que se cobra, y
ese día el usuario ve aparecer un cargo nuevo que nunca estuvo.* El asiento del cupón
(margen negativo, caso 8.2) existe desde hoy.

**Es UNA por pago**, no una por ítem: nace de la reserva o del pedido, no de cada cosa
del carrito.

Su configuración vive en `app_config` (`es_publico = false`, así que **no viaja al
bundle**): `tarifa_servicio_monto` · `tarifa_servicio_codigo_iva` ·
`tarifa_servicio_promo_hasta` (`2026-12-31`).

## 2 · Los cuatro totales, sin cambio de nombre

Los mismos de la T1: `subtotal_0` · `subtotal_15` · `iva` · `total`.
El desglose por línea sigue en `pagos_desglose_lineas`, con `codigo_iva`.
La tarifa entra como una línea más, con `origen_tipo = 'tarifa_servicio'`.

## 3 · El mínimo por transacción — puede hacer que la comisión NO sea el porcentaje

`fee_configs.minimo_por_transaccion` (columna nueva). La comisión efectiva es
**`MAX(base × pct, mínimo)`**, y el evento guarda **cuál de los dos mandó**:

```jsonc
"comision_detalle": { "porcentual": 1.08, "minimo": 1.50,
                      "comision": 1.50, "aplico": "minimo" }
```

⇒ **Una pantalla que muestre «18 %» sobre un ticket chico va a mentir.** Un paseo de
$6,00 al 18 % da $1,08, pero se cobra **$1,50**. Si muestran la comisión, léanla del
evento, no la recalculen.

Vigentes **desde el 1-oct-2026** (medido: hoy resuelve todavía el 10 % viejo — la
vigencia manda y las viejas se cerraron, no se borraron):

| vertical | comisión | mínimo |
|---|---|---|
| paseo · grooming · adiestramiento (`cita`) | **18 %** sobre subtotal | $1,50 |
| guardería (`estadia`) | **18 %** | $1,50 |
| veterinaria (`cita` + `categoria=veterinario`) | **12 % + IVA** | $3,00 |
| telemedicina | **12 % + IVA** | $2,00 |
| despensa (`pedido`) | **15 %** | $1,00 · $2,00 alimento |

## 4 · Los medios de pago — orden como DATO, diferido APAGADO

```
app_config.medios_pago_orden = "deuna,debito,credito"
app_config.pago_diferido_vivo = "false"
```

🔴 **El orden no es estético: es plata.** El crédito corriente cuesta **6,35 % + $0,05**
del total; el débito 2,9 %; **cada punto de mezcla que sale de crédito vale ~4 % del
ticket**. DeUna va primero.

🔴 **El diferido NO se ofrece.** Cuesta entre **7,7 % y 15 %** según plazo — más que
cualquier comisión de la casa. Tiene bandera propia para que encenderlo sea una decisión,
no un descuido.

⚠️ **Y no se puede recargar por pagar con tarjeta** (LODC art. 9 y 19): la tarifa de
servicio es **igual en todos los medios**. No es un recargo por tarjeta.

## 5 · El precio que se muestra

Desde S115 el precio del catálogo es el **NETO** del prestador y el final se **DERIVA**:

```sql
public.precio_final(neto, codigo_iva)      -- la ÚNICA derivación
public.v_catalogo_precio_final             -- neto · tarifa · final, para todo el catálogo
```

🔴 **Fail-closed: sin tarifa vigente devuelve NULL, no el neto.** Si les llega NULL, la
pantalla dice que no sabe — **no muestra el neto como si fuera el final**, porque eso
mostraría un precio menor al legal y la familia pagaría otro en el checkout.

Ejemplos vivos, medidos: paseo $10,00 → **$11,50** · baño $8,00 → **$9,20** ·
guardería $12,00 → **$13,80**.

## 6 · Lo que NO existe (para que nadie lo dibuje)

Prime familia y Plan del prestador están **en la base y APAGADOS** (`activo = false`), sin
pantalla y sin cobro. Medido y declarado: **el motor de recurrencia no los soporta hoy**
— `suscripcion_desglose` y `recurrencia_desglose` tienen **cero filas**, nunca congelaron
nada. Las filas existen sólo para que el día del encendido no haya migración.

---

*A · S115 tanda 3. Números y comandos en `docs/loop/S115-A-T3.md`.*
