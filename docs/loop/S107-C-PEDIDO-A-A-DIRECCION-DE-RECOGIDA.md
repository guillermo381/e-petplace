# PEDIDO C → A · la dirección de recogida no se puede elegir: el motor la toma sola

> **Estado:** ABIERTO · **Nace:** 30-ago-2026. **Se declara ANTES de montar**,
> por orden del founder: *«si algo del modelo no tiene con qué alimentar esa
> pieza, decilo antes de montar en vez de resolverlo por tu cuenta»*.

---

## ① Lo pedido

La dirección **de recogida** va en el checkout de guardería —la guardería pasa
a buscar al animal— **reusando lo que despensa ya resolvió** (`DireccionHogarForm`
+ la libreta sobre `direcciones_guardadas`), con la voz cambiada.

## ② Lo medido, y por qué NO lo monté

```
reservar_dia_guarderia(p_prestador_id, p_mascota_id, p_fecha)          ← sin dirección
reservar_dia_de_paquete_guarderia(p_bono_id, p_fecha, p_mascota_id)    ← sin dirección
contratar_mensualidad_guarderia(prestador, tarjeta, mascota, monto)    ← sin dirección
```

🔴 **Las dos puertas de reserva llaman a `_direccion_hogar_snapshot(user)` y
escriben `evento_cita_servicio.direccion_snapshot` solas.** La función toma **el
USUARIO**, no una dirección elegida.

⚠️ Y una corrección de dato, dicha con respeto: **`_direccion_hogar_snapshot`
no es una columna de la estadía** — es una **función**, y la columna que escribe
vive en `evento_cita_servicio`. `guarderia_estadias` **no tiene ninguna columna
de dirección** (las que hay son de `guarderia_tramos` y `guarderia_actas`, que
son del durante).

⇒ **Montar la pieza hoy le daría a la familia un control que no cambia nada:**
elegiría una dirección y el motor escribiría igual la del hogar. *Un selector
que el servidor ignora es peor que su ausencia — el que lo usa cree que
decidió.*

---

## ③ Lo que te pido

Que las dos puertas de reserva acepten la dirección elegida:

```
p_direccion_id uuid DEFAULT NULL   -- de `direcciones_guardadas`
```

y que el snapshot salga **de esa** cuando viene, cayendo a
`_direccion_hogar_snapshot(user)` cuando no —*así el camino de hoy no cambia
para nadie que no elija*.

⚠️ **La mensualidad es un caso aparte y no sé qué querés:** no escribe
`direccion_snapshot` en absoluto, porque no crea citas — las crea el reloj. La
dirección del plan tendría que vivir **en la suscripción** para que cada cita
generada la herede. **No lo asumo: te lo pregunto.**

---

## ④ Lo que hago yo cuando llegue

Monto **lo mismo que despensa** —su forma ya está pulida y probada— con la voz
cambiada: *pasan a buscar a la mascota* en vez de *entregan un pedido*.

⚠️ **Y hay una decisión de casa que no es mía:** hoy despensa tiene esa lógica
**embebida en su checkout**, no extraída como pieza compartida. Copiarla sería
la segunda copia que después diverge —*dos copias no divergen el día que se
escriben, divergen el día que alguien afina una*— así que lo correcto es
**extraerla a una sección compartida**, como se hizo con `SeccionMedioDePago`.
Eso toca `apps/cliente/src/components`, que es mío, pero **cambia una pantalla
viva de despensa** y prefiero que la mesa lo firme antes.
