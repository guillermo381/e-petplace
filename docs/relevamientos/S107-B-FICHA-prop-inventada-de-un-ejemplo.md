# FICHA (SIN NÚMERO) — LA PROP INVENTADA DE UN EJEMPLO, NO DE UN DATO

> 🔴 **VA SIN NÚMERO A PROPÓSITO, y es la enmienda recién firmada ejercida en su
> primera aplicación:** *«el número se toma en el acto de depositar en el archivo
> canónico… **una ficha sin depositar no tiene número: las reservas fuera del
> canónico no reservan**»*. **Lo numera quien la deposite**, releyendo el máximo
> en ese mismo commit.
>
> **Clase:** se lee como **LECCIÓN (`L-`)**, no como deuda (`D-`): no queda nada
> abierto — la pieza ya murió. *Lo decide quien deposita; se dice acá para que
> no se numere en la serie equivocada.*
>
> **Origen:** S107-B, tanda 5. **Autor del defecto: B.**

---

## EL HECHO

`FichaMensualidad` nació con la prop **`dias`** («Lun–Vie»), y **ningún dato del
sistema podía llenarla.**

**Medido contra el objeto:**

| pregunta | resultado |
|---|---|
| ¿el motor modela un patrón de días de la MENSUALIDAD? | **no** — `dias_semana` existe sólo en `guarderia_franjas`, y es de las ventanas de **recogida/devolución** |
| ¿el taller lo captura? | **no** — `ofreceMensual` guarda **sólo un precio** (`PASOS_MENSUAL`) |
| ¿de dónde salió entonces? | **del EJEMPLO de la orden**: *«Lun–Vie · $X el mes»* |

## POR QUÉ ES UNA CLASE Y NO UN DESCUIDO

**Es el REVERSO del cuidado que esta misma sesión venía ejerciendo.** La casa ya
vigila una punta:

> *«una prop que nadie llena no la ve ningún typecheck — se pagó cinco veces»*

⇒ ahí el riesgo es que **nadie la EJERCITE**, y la cura es la galería llenándolas
todas. **Acá el riesgo es otro y la galería no lo ve:** la prop **se ejercitó
perfectamente** —la galería le pasaba `"Lun–Vie"`— y **el defecto es que ningún
productor real podía darle ese valor.**

🔴 **Una prop inventada de un ejemplo pasa todos los gates de la casa:** compila,
tiene su demo, entra a `R17`, y su contrato se ve completo. **Lo único que la
delata es preguntar quién PRODUCE ese dato** — y esa pregunta no la hace ningún
instrumento.

## LA REGLA QUE DEJA

> **Una prop nace de un DATO QUE ALGUIEN PRODUCE, jamás del ejemplo con el que
> se pidió la pieza.** El ejemplo de una orden es voz —muestra cómo se leería—,
> y confundirlo con contrato mete en el contrato un campo que el motor no tiene.

**La pregunta exigible, al escribir el contrato de una pieza:** *«¿qué wrapper,
tabla o pantalla produce este valor HOY?»* Si la respuesta es *«lo dice el
ejemplo»*, **no es una prop: es una deuda de motor disfrazada de contrato.**

**Y su hermana, que ya rige:** cuando el dato no existe todavía, **el motor va
primero y la prop después** — es exactamente lo que se decidió al NO agregarle
`detalle?` a `FichaDeOferta` para heredar este mismo patrón de días.

## CÓMO SE ENCONTRÓ

**No la encontró un gate ni una revisión: la encontró que la pieza se quedara
sin consumidores** y hubiera que decidir si moría. *Recién ahí alguien fue a
mirar de dónde salía cada prop.* **Vivió con su demo verde toda la sesión.**

## PARIENTES

· **`D-645`** — una promoción no es una migración (la pieza muerta que nada
señala). Es el vecino: los dos son sobre **lo que sobrevive sin que nadie lo
mire**.
· **`L-424`** — el guard que acierta por coerción y no por diseño. Misma familia:
*algo que funciona por accidente y se lee como decidido.*
