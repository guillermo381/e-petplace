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

---

## ④ ENMIENDA (misma tanda, unas horas después): el precio neto quedó cableado y MEDIDO

A lo cableó durante mi tanda (`20260912330000_s115a_precio_neto_derivado`) y mi `i13` pasó
de *«no está cableado»* a medir el hecho:

| Qué | Resultado |
|---|---|
| ítems vivos en `v_catalogo_precio_final` | **34** |
| con precio final derivado | **34** |
| con neto y **sin** final | **0** |
| desviados de `round(neto × (1+pct/100), 2)` | **0** |
| la vista usa la función única `precio_final()` | ✅ |
| precios finales guardados como dato en el catálogo | **0** |

**El brazo que importa es el último de la lista larga:** la vista **no reimplementa** la
derivación. *Si la calculara por su cuenta, el día que cambie la tarifa habría dos precios
distintos para el mismo servicio y ninguno de los dos fallaría.*

**⚠️ Y una corrección sobre mí mismo, porque este mensaje pudo haber salido mal:** la
primera versión de `i13` publicó **«la separación neto/mostrado no está cableada»** cuando
**sí lo estaba**. Buscó columnas sólo en TABLAS y la función por el nombre que yo imaginé;
A la implementó como **vista** más una función llamada **`precio_final`**. *Un censo por
nombre mide la convención que imaginó quien lo escribió, no el hecho.*

**Lo que sigue esperando firma es sólo el redondeo (② de arriba)** — el neto ya está.
