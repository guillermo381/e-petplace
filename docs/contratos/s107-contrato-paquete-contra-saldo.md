# CONTRATO ② · EL DÍA DE PAQUETE CONTRA SALDO — *«te quedan X»*

> **Publicado por A el 29-ago-2026 apenas existió.** Todo medido contra el
> objeto. **C construye contra esto.**

## ⓪ LA FIRMA (founder)

El paquete **se compra entero a UNA guardería** (toggle obligatorio: **la primera
sesión se agenda al comprar**). Los **N−1 restantes se agendan después SIN
pago**: consumen saldo. **Cancelar un día devuelve el día al saldo** (firma ⑤,
sigue vigente).

---

## ① EL MOLDE YA EXISTE Y FUNCIONA — censado, como pediste

`reservar_salida_paquete` (paseo) hace **exactamente esto** y está vivo. Se
hereda **entero**:

| pieza del molde | qué hace |
|---|---|
| **FIFO del hogar** | el bono **más viejo** con saldo y vigencia, `FOR UPDATE` |
| **advisory lock** | `hashtextextended('agenda:'‖prestador‖fecha)` |
| **compuertas** | prestador activo · servicio activo y reservable · especie elegible · no en pasado · `_prestador_bloqueado` |
| **la cita nace CUBIERTA** | `estado='confirmada'`, `estado_reserva='pagada'`, `bono_id`, `precio = bono.precio_por_unidad` |
| **consumo** | `unidades_usadas + 1`, y `estado='agotado'` al llegar al total |
| **el saldo se devuelve** | `saldo_restante` en el retorno ⇒ **el «te quedan X» sale del motor, no de una cuenta de la pantalla** |
| **dos audiencias** | `cita_confirmada` a la familia · `cita_solicitada` al titular |

> ### 🔴 **UN SOLO CORAZÓN CAMBIA: el cupo.**
> El paseo resuelve **slot + empleado** (`prestador_horarios` · `_agenda_ocupacion`
> · `max_citas_por_slot`). **Guardería resuelve DÍA**: `cupo_guarderia_del_dia`
> + `_guarderia_dia_operativo`. *Todo lo demás se traduce sin pensar; esto es lo
> único que hay que pensar.*

**Y hereda también la víspera:** jamás HOY (`p_fecha <= hoy_local()` rebota).

---

## ② 🔴 LA DECISIÓN QUE **NO ES DE UNA PISTA** — dónde vive el saldo

**Medido:** `bonos` tiene `CHECK (tipo_servicio = 'paseo')`. **La tabla del
saldo sólo admite paseo.**

⚠️ **No lo amplié.** *Un vocabulario cerrado no se ensancha de paso: si el valor
que hace falta no está, es una decisión de letra — no un valor más que se agrega
para que la migración pase.* **Es firma de mesa, y van las dos opciones con su
costo:**

| | **(a) ensanchar `bonos`** | **(b) tabla propia `guarderia_bonos`** |
|---|---|---|
| trabajo | el CHECK admite `'guarderia_dia'` | tabla + trigger de congelado + FIFO + vencimiento, todo de nuevo |
| lo que se hereda | **todo**: FIFO, vencimiento, `estado/estado_pago`, `precio_por_unidad`, `pago_metadata`, `familia_id`, y **`_trg_bono_congela_desglose`** (la octava puerta) | nada |
| riesgo | `duracion_minutos` queda NULL (ya es nullable) y `bonos` deja de ser «de paseo» | **dos verdades de «saldo de sesiones»**, que divergen (19.9) |
| lectores vivos | hay que censar quién asume `tipo_servicio='paseo'` | ninguno se toca |

**Voto de esta pista: (a).** *El saldo de sesiones es un concepto de la casa, no
del paseo — y la prueba es que el CHECK dice «paseo» sólo porque el paseo llegó
primero.* **Con una condición: antes de ensanchar se censan los lectores que
asumen `'paseo'`**, porque un CHECK más ancho no rompe nada y **un lector que
filtra por `'paseo'` sigue dando verde mientras esconde los bonos nuevos** — la
clase de defecto que esta sesión viene cazando.

⚠️ **Mientras no haya firma, el contrato ③ (el comprador) no se construye.**
Lo que sí se puede construir sin ella: el **filtro** (contrato ①) y el **lector
de estadías** (contrato ④).

---

## ③ LA FORMA — cuando la firma exista

```
reservarDiaDePaquete({ prestadorId, mascotaId, fecha })
  → ResultadoWrapper<{ citaId, bonoId, fecha, precioOrigen, saldoRestante }>
```

**Cero cobro.** *El desglose ya se congeló en la compra* — la octava puerta
(`_trg_bono_congela_desglose`) corre al comprar el paquete, no al agendar cada
día. **Agendar un día de paquete NO toca plata.**

**Errores tipados** (heredados del molde, más el del cupo):
`sin_saldo_paquete` · `sin_lugar_ese_dia` *(nuevo: el cupo del día)* ·
`dia_no_operativo` · `mascota_no_elegible` · `slot_en_pasado` ·
`prestador_no_disponible` · `no_access_to_mascota` · `sin_familia`.

**Y el saldo legible para el hub:**
```
obtenerSaldoDeGuarderia({ mascotaId? })
  → ResultadoWrapper<{ prestadorId, prestadorNombre, quedan, total, vence }[]>
```
🔴 **`quedan` sale del motor.** *La pantalla no resta `total − usadas`: si lo
hiciera, dos superficies podrían decir números distintos del mismo bono y la que
se equivoca deja a alguien creyendo que tiene un día que no tiene.*

---

## ④ LO QUE ESTE CONTRATO **NO** HACE

- **No compra el paquete.** Comprar es el contrato ③ y **exige la firma de ②**.
- **No decide el tamaño** — 5 · 10 · 15 salen de `guarderia_paquetes`.
- **No cancela.** La devolución del día al saldo va con la **política de
  cancelación**, que se deposita aparte (P18 no cubre guardería: se acota sola
  por su encabezado, *«el paseo individual pagado»*).
- **No mira modalidad**: al llegar acá la familia ya eligió paquete (contrato ①).
