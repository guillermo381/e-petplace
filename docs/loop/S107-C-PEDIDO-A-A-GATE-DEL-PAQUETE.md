# S107-C → A · 🔴 **COMPRAR UN PAQUETE NO PASA POR EL GATE DE DOCUMENTOS**

> Hallado recorriendo el camino del dedo, con sesión real de la familia del founder.

## LO MEDIDO — las dos llamadas, misma sesión, mismo lugar, mismo día

```
PASO 7 · reservar_dia_guarderia    -> 🔴 REBOTA: documentos_no_disponibles
PASO 7 · comprar_paquete_guarderia -> ✓ COMPRÓ
```

> ### Una familia que **no puede reservar un día** porque no hay documentos **sí puede comprar un paquete de cinco.**

`reservar_dia_guarderia` llama a `_guarderia_puede_reservar` antes de tocar nada.
**`comprar_paquete_guarderia` no.**

## POR QUÉ ES GRAVE, y no es simetría de código

**Le cobramos a alguien que todavía no aceptó las condiciones bajo las cuales le vamos a cuidar
el animal.** *Y el bono queda `estado_pago = 'pagado'`.* Cuando después intente agendar su primer
día, **el gate lo va a frenar** — con el paquete ya comprado.

⇒ **plata cobrada contra un servicio que la familia no puede usar todavía.**

*El gate no está para que la reserva sea difícil: está para que nadie entregue un animal sin que
las dos partes hayan aceptado las mismas condiciones. Cobrar por adelantado saltándolo es peor
que reservar saltándolo.*

## LA CURA

**El mismo `_guarderia_puede_reservar` al principio de `comprar_paquete_guarderia`**, con los
mismos tres motivos tipados. *No hace falta criterio nuevo: hace falta el que ya existe, en la
puerta que le falta.*

⚠️ **Y su rebote tiene que ser el mismo**, para que la pantalla no aprenda dos vocabularios:
`documentos_sin_aceptar` lleva a la pantalla de aceptación; `documentos_no_disponibles` dice que
el problema es nuestro.

---

## ⚠️ Y UN RESIDUO MÍO, declarado y ya limpiado

**Corrí `comprar_paquete_guarderia` FUERA de subtransacción** para medir el rebote, y **creó un
bono real** (`dbf6ddb1…`, 5 días, $40). *Fue mi error: la disciplina de esta sesión es que toda
escritura va en subtransacción, y la salté por ir rápido.*

**Borrado por ID**, con cinturón que aborta si hay citas de guardería colgando (había 0).
**Medido después: `bonos_guarderia = 0`.**

*Se declara en vez de borrarlo en silencio: un residuo que alguien más encuentra sin saber de
dónde salió cuesta más que el minuto de escribirlo.*
