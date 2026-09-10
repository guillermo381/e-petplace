# S115-E → MESA · dos cosas que esperan firma, no código

**De:** pista E · **Fecha:** 10-sep-2026 · **Medido sobre:** `f3737db6`

---

## ① Son DIECISÉIS tarifas pendientes de ratificación, no dos

El mandato de mi tanda decía *«hoy deben ser exactamente los de veterinaria y telemedicina,
ni uno más»*. **El objeto dice otra cosa, y `veterinaria` ni siquiera existe como código.**

`tipos_servicio` · `tarifa_estado = 'pendiente_ratificacion'` → **16**:

| Código | IVA |
|---|---|
| `certificado_apoyo` · `certificado_viaje` · `cirugia` · `consulta_especializada` · `consulta_general` · `ecografia` · `emergencia` · `laboratorio` · `procedimiento` · `radiografia` · `telemedicina` · `urgencia_domicilio` · `urgencia_local` · `vacunacion` · `vacunacion_internacional` | `EC_IVA_0` |
| **`servicio_exequial`** | **`EC_IVA_15`** ← la única gravada pendiente |

Los otros 14 códigos están `vigente`. `producto_variantes`: 538, todas `vigente`.
Ninguno sin `codigo_iva`.

**No ajusté el instrumento para que cerrara con la expectativa** — reporto la diferencia.
Es conteo informativo: `i12` sale 0 aunque el número sea alto, porque *un instrumento
informativo que corta el pipeline convierte una observación en un bloqueo, y entonces
alguien lo apaga.*

Reproducible: `node scripts/s115/i12-tarifa-pendiente.mjs`

---

## ② El redondeo del IVA sigue sin firmar: por línea o sobre el total

La cabecera de `supabase/functions/_shared/iva.ts` declara la pregunta abierta al contador.
**Mi `i05` la mide y no la resuelve:** calcula el IVA esperado **línea por línea** (que es
como lo calcula el motor hoy) y, cuando el otro criterio daría un número distinto, lo
**reporta sin llamarlo rojo**.

En el carrito mixto real que medí ($6,70 al 15 % + $20,50 al 0 %) los dos criterios
coinciden, así que **el caso que los separa todavía no existe en datos vivos**. Va a
aparecer con el primer carrito de varias líneas gravadas.

*Lo digo ahora porque cuando aparezca va a ser una diferencia de centavos en una factura
emitida, y ahí ya no es una pregunta: es una corrección.*

---

## ③ Y la que ya declaró A, para que no se pierda entre las dos de arriba

La migración `20260912240000` (e·2) declara que **el catálogo dice `EC_IVA_15` para paseo,
grooming, adiestramiento y guardería, y los desgloses congelados dicen `impuesto = 0`** —
o sea que la tarifa del catálogo y la plata que se congeló no coinciden, y la diferencia
es el 15 % del precio.

Las dos salidas son de producto: **(a)** el precio del prestador pasa a ser bruto (la
familia paga lo mismo, el prestador recibe menos) o **(b)** el IVA se suma (la familia paga
15 % más de lo que ve hoy).

**`reconciliar_lineas_con_congelado()` rebota mientras nadie firme, y eso está bien.** Mi
`i05` lo cuenta como **divergencia conocida, no como defecto** — *un instrumento que grita
sobre una decisión pendiente manda a curar lo que espera una firma.*
