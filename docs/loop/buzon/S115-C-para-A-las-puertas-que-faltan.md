# S115-C → A · LAS SEIS PUERTAS QUE FALTAN (el motor está; falta el wrapper)

**De:** pista C · **10-sep-2026** · **Rama:** `pista/s115-c-1.0`

Leí tu contrato fiscal y construí con él. **Nada de esto es un reproche al
motor: el motor está y lo medí funcionando.** Lo que falta en las seis es el
wrapper en `packages/api`, que es tuyo — y sin él la pantalla tendría que
llamar `rpc()` directo o calcular la plata ella, que son las dos cosas que la
casa prohíbe.

**Las ordeno por lo que desbloquean, no por tamaño.**

---

## ① `tarifa_servicio_vigente(p_fecha)` — LA QUE BLOQUEA EL CHECKOUT ENTERO

**Tu RPC ya devuelve exactamente lo que la pantalla necesita, sin que yo calcule
un centavo.** Medido hoy contra el objeto:

| `p_fecha` | respuesta |
|---|---|
| `2026-09-10` | `monto_lista 0.99 · descuento 0.99 · base 0 · valor_iva 0 · promocionada true` |
| `2027-01-15` | `monto_lista 0.99 · descuento 0 · base 0.99 · valor_iva 0.15 · promocionada false` |

`monto_lista` es lo que va tachado · `base + valor_iva` lo que se cobra ·
`promocionada` decide el estilo. **Es el i17 que te quedó no concluyente: no
tenía consumidor porque no tiene puerta.**

## ② El TOPE de consumidor final

`app_config.fiscal_tope_consumidor_final = '50'`. `SelectorFacturacion` (B) lo
pide por props (`topeConsumidorFinal`, `topeFormateado`) — **con razón: la ley
lo mueve**. Sin lector, escribir `50` en la pantalla es el número de plata en el
cliente. **Es lo que hoy deja todo pago sobre $50 en `esperando_receptor`.**

## ③ La COMISIÓN del modelo nuevo — `obtenerComisionVigenteCita` quedó corta

Tu `_resolver_fee_aplicable` **ya acepta `p_categoria_origen` y
`p_fecha_referencia`**, y `comision_efectiva` **ya dice cuál de los dos mandó**
(`aplico: 'porcentual' | 'minimo'`). Medido, los seis casos salen perfectos y
coinciden con la tabla de `MODELO_ECONOMICO` §2 D-A:

| categoría | pct | mínimo |
|---|---|---|
| cuidado (paseo·grooming·adiestramiento) | 18 | 1,50 |
| guardería (`estadia`) | 18 | 1,50 |
| `veterinario` | 12 + IVA | 3,00 |
| `telemedicina` | 12 + IVA | 2,00 |
| despensa | 15 | 1,00 |
| despensa `alimento` | 15 | 2,00 |

**El wrapper vivo (`fees.ts`, S56) no pasa categoría ni fecha y no devuelve el
mínimo** ⇒ hoy una clínica vería 18 % en vez de 12 %, y nadie vería la línea de
la comisión mínima que el founder pidió. **Y el número que devuelve hoy es el
10 % viejo**, porque las filas nuevas rigen desde el 1-oct: el founder firmó que
la pantalla muestre **la comisión de la fecha en que ese precio va a regir**, así
que el wrapper necesita recibirla.

## ④ `precio_final(neto, codigo_iva)` / `v_catalogo_precio_final`

Para «Lo que ve la familia». Sin puerta, la pantalla tendría que multiplicar por
la tarifa — **que es justo la mentira que tu migración `20260912330000` vino a
matar**.

## ⑤ Las CUATRO claves de `app_config` de ② del mandato

Las cableaste (medí que pasaron de 36 a 43 claves) y **ninguna tiene lector**:

```
medios_pago_orden        = 'deuna,debito,credito'
pago_diferido_vivo       = 'false'
saldo_bono_recarga_pct   = '3'
saldo_bono_recarga_minimo = '0'
```

⚠️ **Y una divergencia con la letra, que no toco:** `MODELO_ECONOMICO` D-D dice
*«+3 % de saldo cargando $50 o más»* y `saldo_bono_recarga_minimo` está en **0**.
Con 0, el bono aplica a toda recarga. **No lo corrijo: puede ser la firma o
puede ser un default que quedó** — es tuyo decidirlo.

*(`obtenerMiSaldo` sí existe y está exportado — ésa no la pido.)*

## ⑥ `fiscal_mis_documentos` no filtra por mascota

`DocumentoFiscalMio` no trae `mascotaId`, así que **la mitad del expediente de ④
del mandato no se puede construir** (*«en el expediente de la mascota, las
suyas»*). No sé si el documento tiene esa relación en el motor; si la tiene, el
lector podría aceptar un filtro opcional.

---

## Lo que SÍ construí con lo que ya estaba

`fiscalMisDocumentos` · `fiscalUrlFirmada` · `fiscalObtenerTaxProfile` ·
`fiscalGuardarTaxProfile` **estaban exportados y funcionaron sin una sola
corrección.** Con eso salieron **Tus facturas** (Cuenta) y **Tus datos de
facturación**, que ataca el cuello de ② sin necesitar el tope: fuera de una
compra no hay total, así que no hay tope que consultar.

*C · S115 tanda 1. Todo lo de arriba está medido contra el objeto hoy; los
comandos y las respuestas crudas están en mi parte.*
