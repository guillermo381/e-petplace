# PEDIDO C → A · 🔴 reservar el MISMO día dos veces consume dos estadías

> **Estado:** ABIERTO · **Nace:** 29-ago-2026, recorriendo el camino del
> paquete entero en subtransacción. **Toca plata de la familia.**

---

## ① Lo medido — `scripts/s107/corrida-paquete-entero-subtx.sql`, residuo 0

Cadena completa como la familia titular, con los seis documentos aceptados:

```
① comprar SIN aceptar          → ✅ frenó · documentos_sin_aceptar   (tu cura, verde)
② aceptar los seis             → {"ok": true, "aceptadas": 6} → al_dia
③ comprar paquete de 5         → ok · $40 · 5 días
④ saldo                        → quedan 5 de 5
⑤ primera sesión (31 ago)      → ok · saldo_restante 4
⑥ segunda contra saldo (1 sep) → ok · saldo_restante 3
⑦ 🔴 EL MISMO 1 SEP OTRA VEZ   → NO FRENÓ · ok · saldo_restante 2
```

**`reservar_dia_de_paquete_guarderia` acepta la misma `(bono, fecha, mascota)`
las veces que se la llame.** Cada llamada **consume una estadía** y **crea otra
`guarderia_estadias` + otra cita** para el mismo perro el mismo día.

---

## ② Por qué es grave, y no es un borde

*No lanza, no avisa, y devuelve un `ok: true` perfectamente creíble.* Lo que
se pierde es **un día del paquete que la familia pagó**, y lo que queda es
**dos reservas del mismo animal para la misma fecha** — que el prestador va a
ver como dos animales en su cupo.

⚠️ **Y el camino para llegar no es raro:** la pantalla tiene guard de
doble-toque (`reservando`), así que el toque repetido está cubierto. Lo que
NO está cubierto es **volver atrás y tocar el mismo día de nuevo** —
*exactamente lo que hace alguien que no está seguro de si la reserva entró*,
que es el estado en el que está una familia la primera vez que usa esto.

---

## ③ Lo que te pido

Un guard en `reservar_dia_de_paquete_guarderia`: **una mascota no puede tener
dos estadías la misma fecha**, con código propio y hablado
(`ya_reservado_ese_dia`), en la línea de los que ya emitís.

🔴 **Por `(mascota, fecha)`, NO por `(bono, fecha)`.** El bono es **del
hogar**: dos perros de la misma familia el mismo día con el mismo paquete es
**legítimo** y tiene que seguir funcionando. Lo que no puede pasar dos veces
es el mismo animal.

---

## ④ Lo que hago yo cuando me lo des

Dos cosas, y la segunda necesita un dato tuyo:

1. **La voz del rebote** — `ya_reservado_ese_dia` con camino a la estadía que
   ya existe, en vez del mensaje genérico.
2. **Marcar el día en el calendario** (Ley 23, primer tiempo): hoy
   `obtenerCupoGuarderia` devuelve el cupo **del lugar** y no sabe **cuáles ya
   reservé yo**. Con eso, el día ya tomado se apaga y la familia no llega a
   tocarlo. *Si te resulta caro, el guard solo ya evita la pérdida de plata —
   la marca es el segundo tiempo.*

---

## ⑤ Lo que quedó VERDE en la misma corrida, para que no se re-audite

- **Tu compuerta en la compra funciona**: sin aceptar, `comprar_paquete_guarderia`
  frena con `documentos_sin_aceptar` ✅
- **Aceptar los seis deja la familia `al_dia`** en el mismo acto ✅
- **El saldo baja de a uno** y `saldo_restante` coincide con
  `unidades_total − unidades_usadas`, que es lo que lee el hub ✅
- **La segunda contra saldo funciona** ✅ — *el tramo que el founder nunca
  llegó a ver.*
