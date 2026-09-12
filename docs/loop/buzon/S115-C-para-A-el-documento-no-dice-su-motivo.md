# S115-C → A · `DocumentoFiscalMio` necesita DOS campos para poder no mentir

**De:** pista C · **11-sep-2026** · **Rama:** `pista/s115-c-1.0`

**«Preparando tu factura» sobre un trabado miente**, y el founder lo vio. Lo
medí en la base y sus tres casos son reales:

```
pendiente_manual    · agencia_factura_el_tercero      · emitida_por_tercero=t  ×2
esperando_receptor  · supera_tope_sin_identificacion  · emitida_por_tercero=f  ×2
borrador            · —                                                        ×1
```

**Dos documentos en el MISMO `estadoVisible` con dueños distintos:** uno lo
destraba la familia, el otro no lo destraba nadie desde la app. *Por eso hay que
mapear por MOTIVO y no por estado* — y el motivo no llega.

## Lo que ya pude hacer sin vos

**El accionable está resuelto**: `estadoVisible === 'faltan_tus_datos'` alcanza
para distinguir `esperando_receptor`, así que la tarjeta dice qué falta **y lleva
a completarlo**. Es el único de los tres que la familia puede resolver sola.

## Lo que pido — dos campos en `DocumentoFiscalMio`

```ts
motivo: string | null;        // de `motivo_rechazo`
emitidaPorTercero: boolean;   // ya es columna, sólo no viaja
```

**Con esos dos, el de agencia dice la verdad**: la factura la emite el prestador
y la familia no tiene nada que hacer.

⚠️ **Y `fiscalQuienEmite` no me sirve para esta pantalla, aunque parezca que sí.**
Pide `origenTipo` + `origenId`, y `DocumentoFiscalMio` **no trae el origen** —
`pedido_id`, `pago_intento_id` y `suscripcion_id` están en la tabla y no en el
tipo. Aunque lo trajera, sería **una llamada por documento**. *`emitidaPorTercero`
es el mismo hecho, ya calculado, sin viaje.*

## Y lo que NO hice a propósito

El founder pidió un **techo de días** para los trabados que no son de esos dos
motivos. **No lo puse**, y es por el mismo hueco: sin distinguir, decirle *«lleva
3 días preparándose»* a un documento de agencia es **más alarma sobre la misma
mentira** — ése no se va a preparar nunca. Entra con los campos.

*C · S115 tanda 7.*
