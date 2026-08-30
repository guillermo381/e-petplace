# CONTRATO · LA TIRA DE DÍAS, Y UN DÍA POR MASCOTA

> **Nace:** 30-ago-2026, de dos pedidos de C. **Migración:**
> `20260831060000_s107a_un_dia_por_mascota_y_tira_semanal.sql` — aplicada,
> cinturón **4/4**, residuo 0.

---

## ① 🔴 UN ANIMAL, UN DÍA, UNA VEZ

**Medido antes de curar:**

```
1ra reserva → saldo 9  |  2da IDÉNTICA → ok, saldo 8  |  citas del mismo perro ese día: 2
```

**Y el censo lo agrandó: son DOS puertas.** El **día suelto** también pasaba
sobre un día ya tomado por paquete — *y ése cobra aparte, así que la familia
pagaba dos veces por un día que su perro sólo puede vivir una vez.*

**El código nuevo:** `mascota_ya_reservada_ese_dia` → *«Ya tienes ese día
reservado para esa mascota.»* Lo levantan **las dos** puertas de reserva.

🔑 **La llave es `(mascota, fecha)` — jamás `(bono, fecha)`.** El bono es del
hogar: **dos perros el mismo día siguen siendo legítimos**, y el cinturón lo
prueba con un brazo dedicado (*sin ese brazo, el verde no distingue cuál de los
dos guards se puso*). Tampoco lleva prestador: un animal no puede estar en dos
guarderías a la vez.

⚠️ **Hay DOS capas y las dos hacen falta:** un **índice único parcial**
(`uq_guarderia_una_por_mascota_dia`) que vuelve el estado *inexpresable* y que
ninguna puerta futura puede saltear, y el **guard tipado** en cada función para
que el rebote hable — *un guard que vive en un índice sólo puede negarse*
(`L-424`).

**Qué libera el día:** `cancelada`, `rechazada`, `no_realizable`.
**Qué NO:** `no_show` y `completada` — ese día se consumió.

---

## ② LA TIRA: UNA LLAMADA, NO CATORCE

```ts
obtenerDiasGuarderia({ prestadorId, desde, hasta, mascotaId? })
  → DiaGuarderia[]
```

| campo | qué es |
|---|---|
| `fecha` | `'YYYY-MM-DD'` |
| `opera` | el lugar abre ese día (patrón semanal **+ excepciones**) |
| `capacidad` · `disponible` | los números del día |
| `yaReservado` | **sólo con `mascotaId`**: esa mascota ya tiene ese día |
| `reservable` | **la única que la tira necesita** para habilitar o apagar |
| `motivo` | `null` si es reservable; si no, **la primera causa que frena** |

`motivo ∈ 'fecha_pasada' | 'no_opera_ese_dia' | 'mascota_ya_reservada_ese_dia' | 'sin_cupo'`

🔴 **`motivo` lo resuelve el SERVIDOR. La pantalla lo pinta, no lo deduce.**
*«No abre ese día» y «se llenó» son dos verdades distintas*, y la familia hace
cosas distintas con cada una: ante la primera elige otro día, ante la segunda
puede esperar. Deducirlas de `capacidad === 0` las confunde — **es el mismo
defecto que S107 ya curó una vez en el resumen del filtro.**

⚠️ **`mascotaId` cambia lo que se puede pintar.** Con ella, el día que la
mascota ya tiene se ve **ocupado** en vez de rebotar al tocarlo. *Sin ella, la
tira no puede saber a quién le está ofreciendo el día.*

**Medido con Aurora (L-V), 14 días:** `14 filas · 9 reservables · 3 no_opera ·
1 ya_reservado` (+ hoy, `fecha_pasada`).

**Techo:** 60 días. Más largo rebota `rango_demasiado_largo`.

---

## ③ Lo que esto NO cambia

`cupo_guarderia_del_dia` **sigue viva y sin tocar** — la usa la pantalla del
prestador. La tira de la familia deja de llamarla catorce veces; no se jubila
nada.
