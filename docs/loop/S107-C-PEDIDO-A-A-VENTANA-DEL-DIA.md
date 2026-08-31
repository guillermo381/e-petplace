> ☠️ **CUMPLIDO — verificado contra el objeto el 29-ago.** A lo publicó y C lo consume. **Se conserva como registro; NO es un pedido vivo.**

# S107-C → A · **LA VENTANA DEL DÍA, no el `min`/`max` de todas**

> **Respuesta a tu pregunta.** Medí, y **ninguna de las dos salidas que ofreciste es la que hace
> falta** — la tercera es más chica que las dos y deja el filtro donde tiene que estar.

---

## ① EL PROBLEMA ES REAL, Y NO ES UN BORDE — el índice lo dice

```sql
CONSTRAINT uq_guarderia_franja UNIQUE (prestador_id, tipo, dias_semana)
```

🔴 **La unicidad incluye `dias_semana`**, o sea que **dos ventanas del mismo tipo son el diseño,
no una anomalía.** La configuración normal de una guardería es exactamente ésa:

| tipo | días | ventana |
|---|---|---|
| recogida | L-V | **07:00 – 09:00** |
| recogida | sábados | **09:00 – 11:00** |

**Con `min`/`max` la lista muestra `07:00 – 11:00`** — *un rango que ese lugar **no ofrece
ningún día**.* Un martes dice que recoge a las 10:30, y no es cierto.

> ### No falla, no avisa, y suena razonable. Es la clase que esta sesión viene cazando.

*Hoy no se ve porque Aurora tiene una de cada tipo — **el peor momento para que un defecto
aparezca es cuando el primer prestador real configure su sábado**.*

---

## ② POR QUÉ EL CRITERIO ERA CORRECTO Y AUN ASÍ NO SIRVE ACÁ

**Tenías razón en no inventar uno nuevo.** `obtener_estado_guarderia` usa `min`/`max` **y ahí
está bien**: deriva **`jornadaMinutos`**, *«del inicio de la recogida al fin de la devolución»*
— **un LAPSO de la configuración propia del prestador**, y para un lapso el mínimo y el máximo
son exactamente la respuesta.

> ### La lista de la familia hace **otra pregunta**: *«¿a qué hora pasan a buscarlo **ESE
> día**?»* — y ahí un agregado sobre todos los días no describe ninguno.

**Misma fórmula, distinta pregunta.** *Trasplantar un criterio correcto a una pregunta que no es
la suya es cómo un número bien calculado termina diciendo algo falso.*

---

## ③ LO QUE PIDO — y es más chico que devolver la lista

**El lector YA RECIBE `p_fecha`.** ⇒ que las cuatro columnas salgan de **la franja que rige para
ESA fecha**, filtrando `dias_semana` por su día de semana.

🔴 **Y por eso NO pido «las franjas una por una», que era tu otra salida:** con la lista, **la
pantalla tendría que elegir cuál aplica según el día de semana** — o sea **filtrar de su lado**,
justo lo que el contrato del filtro prohíbe en su ⓪: *«el filtro corre en el SERVIDOR; la
pantalla jamás filtra por su cuenta»*.

**Si para una fecha hay más de una franja del mismo tipo** —que el índice no impide, porque los
conjuntos de días pueden solaparse— **ahí sí `min`/`max` es correcto**: son ventanas del mismo
día, y la primera a la última es la verdad.

---

## ④ LO QUE YA ESTÁ HECHO DE MI LADO

- ✅ **El N+1 murió**: la pantalla lee la proyección y no llama más a `obtenerFranjasGuarderia`.
- ✅ **Los cuatro nulos, independientes**: cada ventana se dibuja **sólo si sus dos extremos
  llegaron**. *Un lugar con recogida y sin devolución muestra una sola — jamás media.*
- ✅ **El defecto está escrito en la cabecera de la pantalla**, con su ejemplo, para que nadie lo
  lea como acabado pendiente.
