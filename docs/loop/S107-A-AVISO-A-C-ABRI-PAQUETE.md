# S107-A → C · **ABRÍ LA COMPUERTA A `['dia','paquete']`.**

*Depositado en el mismo acto que el motor, 29-ago-2026.*

---

> ### **El selector ya se dibuja: con dos modalidades N=1 no colapsa.**
>
> El founder lleva siete tandas viendo una pantalla que **parece a medio hacer y
> no lo está.** Con esto deja de parecerlo.

**No esperes la mensualidad.** Llega después; **con dos ya podés abrir**.

## LAS DOS PUERTAS

```ts
comprarPaqueteGuarderia({ prestadorId, tamano })
  → { bonoId, dias, total, porDia, venceEl, diasRollover, saldoTotal }

reservarDiaDePaqueteGuarderia({ bonoId, fecha, mascotaId? })
  → { citaId, estadiaId, saldoRestante }
```

**🔴 `reservarDiaDePaquete` NO recibe `prestadorId`** — firma del founder:
*cuando la familia ya tiene saldo, **el lugar está determinado por el paquete**.*
Pedirlo sería ofrecerle elegir algo que ya eligió.

**⚠️ `mascotaId` es opcional pero NO decorativo.** Con una sola mascota elegible
el motor la resuelve; **con dos o más rebota `mascota_no_determinada`** en vez de
adivinar. *El bono es del HOGAR: a cuál de los dos perros se le agenda el martes
lo elige la familia, cada vez.* **Ese rebote me lo encontró el arnés con los
datos reales de la base** — no es teórico.

**🔴 Comprar NO es reservar.** El único efecto de la compra es el bono: cero
citas. *La primera sesión se agenda al comprar **desde tu pantalla**, con la
segunda llamada.*

**El `saldoRestante` sale del MOTOR.** No restes de tu lado: *si restaras, dos
superficies podrían decir números distintos del mismo bono.*

## EL CAMINO, EJERCIDO DE PUNTA A PUNTA (arnés, con rollback)

```
compra 5 días        → saldo 5
reserva 1 día        → saldo 4
la cita              → confirmada / pagada · atada al bono
precio congelado     → 8.00  (40 ÷ 5)
eventos económicos   → 0   ← el desglose se congeló al COMPRAR
el lugar lo puso     → el BONO
```

**El `0` es el número que importa:** agendar un día de paquete **no toca plata**.
*Si ahí naciera un evento económico estaríamos cobrando dos veces el mismo día.*

## TRES COSAS QUE EL ARNÉS DESTAPÓ Y YA ESTÁN CURADAS

1. **La cita necesitaba la jornada** (`duracion_minutos` es `NOT NULL`). Yo había
   puesto `NULL` razonando que *«una estadía no dura minutos»* — cierto, y la
   columna no lo acepta. *Una razón correcta no exime de medir el destino.*
2. **El vocabulario de `bonos` se ensanchó** a `('paseo','guarderia_dia')`, con
   el censo de los siete lectores hecho **antes**.
3. 🔴 **De los siete, el único que había que ensanchar era el que NO tiene
   pantalla:** `vencer_paquetes_salidas`. Filtrando `'paseo'`, **los paquetes de
   guardería no vencían nunca** y su breakage no se registraba — *sin error, sin
   síntoma, y con plata de por medio.*

⚠️ **Lo que quedó afuera a propósito:** el AVISO de vencimiento sigue sólo para
paseo — su voz dice **«te quedan N salidas»**, palabra del paseo. *No avisar es un
hueco; avisar con la palabra de otro oficio es una mentira.* Fichado.
