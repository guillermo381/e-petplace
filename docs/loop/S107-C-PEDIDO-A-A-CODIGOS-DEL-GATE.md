# S107-C → A · **DOS DE LOS TRES MOTIVOS DEL GATE DE RESERVA NO ESTÁN TIPADOS**

> Hallado corriendo los caminos tristes contra el motor real, en subtransacción.
> **Es la misma clase de los 17 que ya cerraste** — y estos dos están **en el único camino que
> hoy funciona.**

## LO MEDIDO

`reservar_dia_guarderia` rebota con uno de **tres** motivos
(`20260829120000_s107a_documentos_y_actas.sql:389-393`):

| motivo | ¿tipado en `guarderia-reserva.ts`? | lo que ve la familia hoy |
|---|---|---|
| `requisitos_sanitarios` | ✅ sí | su voz |
| **`documentos_no_disponibles`** | ❌ **NO** | *«Ocurrió un error inesperado»* |
| **`documentos_sin_aceptar`** | ❌ **NO** | *«Ocurrió un error inesperado»* |

## 🔴 EL SEGUNDO ES EL CAMINO NORMAL DE TODA FAMILIA NUEVA

**`documentos_sin_aceptar` no es un error: es el paso anterior a reservar.** Toda familia que
toque «Reservar» por primera vez lo va a recibir.

> ### Le decimos *«ocurrió un error inesperado»* a alguien que sólo tenía que aceptar los
> términos — **y no le decimos cuáles, ni dónde.**

*Y el primero es peor de lo que parece:* `documentos_no_disponibles` significa **que la casa
todavía no cargó los documentos**. Es un estado **nuestro**, no de la familia, y hoy se le
presenta como si algo hubiera fallado de su lado.

## LA CURA — dos entradas en `MENSAJES`

Voz propuesta, en tuteo (ajustala si la letra dice otra cosa):

```ts
  documentos_sin_aceptar:    'Antes de reservar tienes que aceptar los términos de la guardería.',
  documentos_no_disponibles: 'Todavía no podemos abrir reservas de guardería. Estamos terminando de prepararlo.',
```

⚠️ **`documentos_no_disponibles` NO dice «prueba de nuevo»** — *no hay nada que la familia pueda
reintentar: falta algo nuestro.*

## LO QUE ES MÍO Y DECLARO

**La superficie de aceptación no existe todavía** (`S107-C-PEDIDO-A-A-DOCUMENTOS.md`), así que
**hoy la familia recibe el rebote y no tiene dónde ir a resolverlo.** *Tipar el código no
alcanza: hace falta la pantalla.* **Pero un rebote que nombra el problema es mejor que uno que
lo esconde**, y el código es de A.

---

## ✅ Y DE PASO, LA CORRIDA COMPLETA — los dos caminos tristes, verdes

`scripts/s107/corrida-tristes-subtx.sql`, **entre `BEGIN` y `ROLLBACK`**, con el residuo medido
después: **las cinco tablas en 0.**

| | resultado |
|---|---|
| **①.a el hold toma cupo** | ✅ `8 → 7` |
| **①.b sin pago, la cita queda `pendiente_pago`** | ✅ con su `expira_en` — la familia puede volver a pagar |
| **①.c la familia VE su reserva sin pagar** | ✅ *(D-319: el hold propio se muestra, el ajeno no)* |
| **②.a la salvedad queda `con_reserva`** | ✅ |
| **②.b el texto de la salvedad vuelve** | ✅ *una salvedad sin texto sería una queja muda* |

**El acta la levanta el PRESTADOR y la conforma el DUEÑO, cada uno con su sesión** — los dos
brazos ejercidos con claims distintos, no simulados.
