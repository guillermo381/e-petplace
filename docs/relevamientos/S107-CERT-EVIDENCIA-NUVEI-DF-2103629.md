# EVIDENCIA DE CERTIFICACIÓN · `DF-2103629` — el registro del lado de Nuvei

**Fuente: Erick (Nuvei), 27-ago-2026.** No es una medición nuestra: es el
registro del PROVEEDOR. *Vale más que nuestra medición porque viene del otro
lado y no puede haber sido escrito por el código que se está auditando.*

---

## ① CIERRA EL HUECO DEL GUARD DEL IVA

Lo que se declaró como faltante esta mañana: `payload_crudo` guarda **solo la
respuesta**, y la respuesta de Nuvei **no eco-devuelve** los tres campos de
impuesto ⇒ *«tenemos prueba de que Nuvei ACEPTÓ, no de QUÉ mandamos»*.

**Lo que Erick confirmó que recibió:**

```
vat             = 1.61
taxable_amount  = 10.75
tax_percentage  = 15
order.amount    = 12.36
dev_reference   = 6ab24930-5df8-4221-88de-c26f9966e47c   (la compra)
```

**Coincide exactamente con el desglose congelado** (`compra_desglose` de
`6ab24930`: subtotal 10,75 · impuesto 1,61 · total 12,36) y con el veredicto de
`_shared/iva.ts` (`tax_percentage` **nominal 15**, jamás el recalculado 14,98).

⇒ **El guard del IVA queda verificado de punta a punta**: desglose → veredicto →
lo que salió → lo que el proveedor recibió → aprobación (`IEW0zE`). **Ya no hay
inferencia en ningún tramo.** El discriminador que faltaba llegó, y sin escribir
una línea de código.

**Estado: el caso del IVA gravado queda EJERCIDO Y VERIFICADO POR TERCERO.**

---

## ② 🔴 Y EL MISMO PAYLOAD PRUEBA `D-921` DESDE AFUERA

```
user.id = f7a7001e-d83e-46c4-8bd7-701f3ea15196
```

**Ese uuid es un ID DE ALTA, no el uid estable.** Medido en nuestra base antes de
la limpieza: `f7a7001e` era el `altas_tarjeta.id` del alta del 25-ago 15:08, la
que produjo la tarjeta `ca6cc285`. El uid estable de esa persona era
`d5d42b92-b049-4211-ad79-143805ee7dab`.

> ### **Nuvei ve un usuario distinto por cada alta, y está medido en SU base, no en la nuestra.**

*Hasta hoy `D-921` se sostenía en nuestra propia lectura del código. Esto es la
evidencia externa que faltaba: el defecto es observable desde el otro lado del
cable, que es donde importa cuando alguien pregunta «¿de quién es esta tarjeta?».*

⚠️ **Y una consecuencia de secuencia, declarada:** el alta `f7a7001e` **ya no
existe en nuestra base** — se borró en la limpieza firmada de hoy, minutos antes
de que llegara este dato. **Este documento es el único registro superviviente de
ese enlace.** *No es un error de la limpieza: es la razón por la que la evidencia
se deposita cuando llega y no cuando conviene.*

---

## ③ LO QUE ESTA EVIDENCIA **NO** DICE

- **No valida el uid nuevo.** Prueba que el viejo estaba mal, no que el nuevo
  esté bien: `usuario_proveedor_uid` tiene **1 fila** y **ninguna tarjeta viva
  cuelga de ella** (las 9 que colgaban de ids de alta se borraron hoy). La
  primera tarjeta que se guarde ahora es la que lo prueba o lo falsa.
- **No cubre el riel recurrente.** `pagos-cobro-recurrente` importa la misma
  pieza (`_shared/iva.ts:70`), pero **nunca cobró con IVA > 0**.
- **No cubre múltiples líneas.** Este cobro tenía **una sola línea gravada**; la
  tolerancia de ±1 ¢ por línea del contrato §4.② sigue **sin ejercerse**.

---

## ④ LA DECISIÓN DEL UID, FIRMADA Y CERRADA (27-ago-2026)

**Se mantiene el identificador propio ante el proveedor, no el `user_id`.**

Razones, para que no se re-litigue:

1. **Ya está construido y ejercido**, y la tabla ya tiene una fila poblada.
2. **Un identificador compartido con un tercero no se puede rotar ni retirar.**
   Una vez que sale, salió.
3. **Erick recomienda el `user_id` porque desde su lado da igual**: solo necesita
   que sea **estable por persona**, y el nuestro lo es.

**Lo que su respuesta SÍ aporta, y es lo que importa: confirma que el uid debe
ser POR PERSONA y no por alta — que es exactamente lo que `D-921` corrige.**
*La recomendación no se toma; la validación del criterio, sí.*

🔑 **Y la regla que queda escrita para el segundo proveedor: el identificador es
POR PROVEEDOR.** No se reusa el mismo ante dos terceros. *(La tabla ya lo obedece
por forma: `usuario_proveedor_uid` lleva `proveedor` en su clave.)*
