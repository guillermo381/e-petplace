# PEDIDO C → A · la tira de días ofrece 4 callejones de 14

> **Estado:** ABIERTO · **Nace:** 29-ago-2026, recorriendo el camino del dedo.
> **No bloquea nada**: la puerta se apaga y dice por qué. Es un paso de más.

---

## ① Lo medido, en el aparato

Recorrí la ETAPA 1 tocando **los 14 días que la tira ofrece**, uno por uno, y
leyendo el estado del CTA después de cada toque:

```
  sun 30   → CTA disabled=true   "No daycare near you is open that day."
  mon 31   → CTA habilitado
  tue 1    → CTA habilitado
  wed 2    → CTA habilitado
  thu 3    → CTA habilitado
  fri 4    → CTA habilitado
  sat 5    → CTA disabled=true   "No daycare near you is open that day."
```

**Ninguno de los 14 días viene marcado**: no hay `aria-disabled`, no hay tinte.
Los cuatro fines de semana de la ventana **se ven exactamente igual** que los
diez que sirven.

⇒ **La familia toca un domingo, espera, y recién ahí se entera.** No es un
defecto de corrección —la puerta se apaga y dice por qué, que es Ley 23
cumplida en el segundo tiempo— pero *el primer tiempo es donde la ley pide que
esté: la puerta no ofrece lo que va a rechazar.*

🔴 **Y es candidato serio a por qué el founder «nunca pudo reservar»:** si el
primer día que toca cae en fin de semana, ve un botón apagado y no vuelve.

---

## ② Por qué NO lo curo yo, y no es que no quiera

En la ETAPA 1 **todavía no hay lugar elegido**, así que `obtenerCupoGuarderia`
—que es por prestador— no aplica. Lo único que contesta la pregunta hoy es
`obtener_guarderias_disponibles`, **y es por FECHA**: pintar la tira exigiría
**14 llamadas en el montaje**, para una respuesta que casi no cambia entre
fechas.

---

## ③ Lo que te pido — y es UNA llamada, no catorce

**Qué días de la SEMANA tiene al menos un lugar abierto.** No por fecha: por
patrón — porque el dato de fondo (`guarderia_espacios.dias_operacion`) **es
semanal**.

```
qué_días_hay_lugar(especie, lat?, lon?) → int[]   -- 0=Dom … 6=Sáb
```

Con eso la tira apaga sus días de una sola consulta, y la respuesta sirve para
los 14 días de la ventana a la vez.

⚠️ **Declarado, para que nadie lea de más en el verde:** esto cubre
`no_opera`, **no `sin_lugar`**. Un día que abre y está lleno es información
**por fecha** y va a seguir apareciendo recién al tocar — *y ahí está bien que
aparezca ahí: un lugar se llena entre que la pantalla carga y la familia
toca.*

---

## ④ Mientras tanto

**No cambio nada.** El estado de hoy es honesto —se apaga y dice por qué— y
adelantar la marca con una heurística de pantalla (*«los fines de semana
seguro no abren»*) sería la pantalla inventando el calendario de un lugar que
todavía no eligió. *Justo lo que esta pista pasó la sesión cazando.*
