# CONTRATO · LA COMPUERTA DE DOCUMENTOS EN LA PUERTA DE LA COMPRA

> **Nace:** 29-ago-2026, de un hallazgo de C. **Enmienda** a
> `s107-contrato-paquetes-guarderia.md` y a `s107-contrato-documentos-y-actas.md`.
> **Migración:** `20260831020000_s107a_gate_en_las_cuatro_puertas.sql` — aplicada,
> cinturón 6/6, residuo 0.

---

## ① Lo que cambió, en una línea

**`comprar_paquete_guarderia` y `contratar_mensualidad_guarderia` ahora rebotan
si la familia no aceptó los documentos** — antes cobraban y la frenaban recién
en la reserva, *con la plata ya tomada*.

---

## ② Los códigos que puede levantar CADA UNA de las dos puertas de compra

Son **los mismos** que ya conoce la reserva. Nada nuevo que aprender:

| código | de quién es el problema | qué hace la pantalla |
|---|---|---|
| `documentos_sin_aceptar` | **de la familia** | manda a `/guarderia/documentos` — es **el paso anterior**, no un error |
| `documentos_no_disponibles` | **NUESTRO** | lo dice y **no ofrece camino**: la familia no puede resolverlo |

🔴 **`faltan` ya no llega, y antes sí llegaba.**
`reservar_dia_de_paquete_guarderia` lo emitía crudo —un código que **ningún
wrapper conoce**— y la familia veía el mensaje genérico sin saber que le
faltaba aceptar los términos. **La traducción se mudó a la fuente**, así que las
tres puertas hablan el mismo vocabulario y no pueden volver a divergir.

---

## ③ Lo que NO se puso, y por qué — porque C pidió el gate entero

En la compra se llama a **`evaluar_documentos_guarderia`** (la mitad de
FAMILIA), no a `_guarderia_puede_reservar` completo.

**El paquete es DEL HOGAR y nace sin mascota** — se elige al reservar. Forzar
una para poder evaluar lo sanitario significaría medir los requisitos de un
animal arbitrario, y **le impediría a una familia con dos perros comprar por el
que sí está al día**.

> **Lo sanitario se queda donde el sujeto existe: en la puerta del DÍA.**

⚠️ **Consecuencia visible para la pantalla:** con el gate sanitario duro
encendido (`D-968`), una familia puede **comprar** un paquete y después
encontrarse con que ese día no lo puede usar por el carnet. Eso **no es un
defecto de la compra**: es el semáforo diciendo la verdad antes, y la pantalla
de la guardería ya lo muestra. Si querés adelantarlo al momento de comprar,
es decisión de producto, no de motor.

---

## ④ Lo que sigue bloqueado, y no es de C ni de A

**`guarderia_documentos` = 0 filas.** Hoy las dos puertas rebotan con
`documentos_no_disponibles` — *fail-closed correcto*, y la familia no tiene qué
hacer. El perímetro está entero; falta el **texto legal**, que ninguna pista
redacta. Ficha **`D-977`** con su cadena de destrabe.

⇒ **Hasta que los seis textos existan, `documentos_no_disponibles` es el estado
NORMAL de todo el frente** — no un bug que reportar.
