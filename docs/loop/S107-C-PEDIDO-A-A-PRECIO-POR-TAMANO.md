# S107-C → A · 🔴 **EL PRECIO DE PAQUETE ES EL DEL MÁS BARATO, NO EL DEL TAMAÑO ELEGIDO**

> Reportado por el founder en el gate: *«con 5 muestra su precio; al elegir 10 o 15 sigue
> mostrando el de 5»*. **Medido: no era estado de la pantalla — es que el server no puede
> saberlo.**

## LO MEDIDO

`obtener_resumen_guarderias` **no recibe el tamaño**:

```ts
obtenerResumenGuarderias({ modalidad, fecha, mascotaId, lat?, lon? })   // ← sin tamaño
```

Y el precio de paquete sale de un **mínimo sobre todos los tamaños** — en **tres migraciones**,
o sea en el filtro y en el resumen:

```sql
WHEN 'paquete' THEN (SELECT min(gp.precio) FROM guarderia_paquetes gp
                      WHERE gp.prestador_id = pr.id AND gp.activo)
```

> ### ⇒ La familia elige **15**, ve **$40** y paga **$75**. En la superficie donde se decide pagar.

**Y son DOS superficies, no una:** el resumen (el pie de «elegir cómo y cuándo») **y la fila de
cada lugar** en «quién puede», que usa `precioModalidad` de la misma fuente.

## LO QUE HICE MIENTRAS TANTO

🔴 **Dejé de pintar precio de paquete en las dos.** *Cualquier número que ponga es el de OTRO
tamaño que el que la familia eligió* — **la ausencia es honesta; el número no lo era.**

*(El precio real sigue visible donde sí es cierto: el botón de compra nombra el tamaño —
«Comprar 5 estadías y agendar este día»— y el motor congela `porDia` al comprar.)*

⚠️ **Y arreglé la mitad que sí era mía:** `tamano` **no estaba en las deps** del efecto, así que
cambiar de chip ni siquiera volvía a preguntar. *Era la mitad chica: aun preguntando de nuevo, la
respuesta habría sido el mismo mínimo.*

## LA CURA

`p_tamano integer DEFAULT NULL` en el resumen y en `_guarderia_ofertas_cobrables`:

```sql
WHEN 'paquete' THEN (SELECT gp.precio FROM guarderia_paquetes gp
                      WHERE gp.prestador_id = pr.id AND gp.activo
                        AND (p_tamano IS NULL OR gp.tamano = p_tamano)
                      ORDER BY gp.tamano LIMIT 1)
```

**Sin tamaño se conserva el mínimo de hoy** —que es un *«desde»* honesto cuando todavía no se
eligió— **y con tamaño responde el precio de ESE paquete.**

⚠️ **Si el lugar no ofrece el tamaño pedido, `NULL`** — *no el más barato.* La pantalla ya sabe
no pintar `null`; caer al de otro tamaño reintroduciría el defecto con mejor cara.
