# S88-A · EL LOTE DE VOCES — 10 propuestas juntas, a la firma del founder

> **Escritas contra los criterios que el founder ya firmó en `plan_renovado`:**
> el asunto **dice qué pasó** (jamás «novedad») · si hay plata **se nombra sin
> esconderla** · se nombra **la mascota o el negocio** — es lo que hace el aviso
> del dueño y no del sistema · **tuteo neutro** · **el mismo texto sirve para
> correo y campana** (la voz es dato, no código).
>
> **Verificación declarada:** ninguna se da por buena sin leerla en la **SOMBRA
> del productor real** (L-207). *El mismo error no se comete dos veces por
> mirar el tubo.*

---

## ⚠️ EL NÚMERO CORREGIDO: son **10**, no 13 — y el porqué importa

El primer censo dijo 14 con productor; el segundo, 20; **el bueno dice 17**.
Las tres pasadas midieron cosas distintas:

| pasada | qué preguntó | error |
|---|---|---|
| ① | ¿el código aparece en un productor de un salto? | **perdió** los 6 que llegan por `_notificar_dueño_prestador` (dos saltos) |
| ② | ¿aparece siguiendo la cadena? | **sumó falsos**: el código en un comentario cuenta igual |
| ③ | ¿aparece como **`p_tipo => '<codigo>'`**? | ✅ el literal que produce de verdad |

> ### **UN CENSO POR `LIKE` CUENTA MENCIONES; UNO POR LA FORMA DE LA LLAMADA CUENTA PRODUCTORES.**
> *Es la ley del censo de esta sesión cobrándose sobre quien la escribió — dos
> veces seguidas.* **Los cuatro que se cayeron** (`cita_confirmada`,
> `sistema`, `alta_asistida_completada_por_cliente`,
> `alta_asistida_vencida_soporte` en su primera lectura) **no tienen productor:
> no pueden salir.**

**Y siete YA tienen voz** — 6 inline por `_notificar_dueño_prestador`
(`documento_*`, `prestador_*`) + `plan_renovado` por el helper.
**⚠️ Las seis inline VOSEAN** (*«Ya podés operar»*, *«Revisá el motivo»*,
*«Contactá soporte»*): son D-539 vivo, y entran al lote como **enmienda**, no
como escritura nueva.

---

## ✅ LAS SEIS QUE PUEDO ESCRIBIR (borrador a la firma)

### 1 · `plan_renovacion_proxima` — `saldo_pagado` → al **dueño**
*72 h antes de que el plan se renueve y se cobre. Tiene mascota.*

- **es** — «Tu plan de paseos se renueva en 3 días»
  «El plan de paseos de {mascota} se renueva el {fecha} y se va a cobrar con tu método habitual. Si no querés que siga, podés pausarlo desde la app antes de esa fecha.»
- **en** — "Your walk plan renews in 3 days"
  "{pet}'s walk plan renews on {date} and we'll charge your usual payment method. If you'd rather stop it, you can pause it in the app before then."

> *El «podés pausarlo» no es cortesía: la letra de la categoría dice que un
> cobro sorpresa no se deshace — avisar sin dar salida sería avisar de adorno.*

### 2 · `paquete_vence` — `saldo_pagado` → al **dueño**
*Datos que trae: `salidas_restantes`, `vence`. Tiene mascota.*

- **es** — «Te quedan {n} salidas por usar»
  «El paquete de paseos de {mascota} vence el {fecha} y todavía te quedan {n} salidas. Podés reservarlas desde la app.»
- **en** — "You have {n} walks left"
  "{pet}'s walk package expires on {date} and you still have {n} walks. You can book them in the app."

### 3 · `programa_vence` — `saldo_pagado` → al **dueño**
*Datos: `vence_el`. Tiene mascota.*

- **es** — «Al programa de {mascota} le quedan sesiones»
  «El programa de adiestramiento de {mascota} vence el {fecha}. Coordiná las sesiones que faltan desde la app.»
- **en** — "{pet}'s program still has sessions left"
  "{pet}'s training program expires on {date}. You can schedule the remaining sessions in the app."

### 4 · `programa_vencido_reembolso` — `saldo_pagado` → al **dueño**
*Datos: `sesiones_sin_usar`, `reembolso`. **Hay plata: se nombra.***

- **es** — «Te devolvimos {monto} del programa de {mascota}»
  «El programa de adiestramiento de {mascota} venció con {n} sesiones sin usar. Te devolvimos {monto} a tu método de pago.»
- **en** — "We refunded {amount} from {pet}'s program"
  "{pet}'s training program expired with {n} unused sessions. We refunded {amount} to your payment method."

### 5 · `procedimiento_agendado` — `operacion` → al **dueño** (`v_cita.user_id`)
*Datos: `cita_id`, `presupuesto_id`. Tiene mascota.*

- **es** — «Quedó agendado el procedimiento de {mascota}»
  «{negocio} confirmó la fecha: {fecha} a las {hora}. Podés ver el detalle en la app.»
- **en** — "{pet}'s procedure is scheduled"
  "{business} confirmed the date: {date} at {time}. You can see the details in the app."

> **⚠️ Depende de un dato que el productor hoy NO pasa:** el nombre del
> negocio. *O el productor lo agrega, o la voz se queda sin él — **lo que no
> haré es inventarlo**.*

### 6 · `plan_vencido_reembolso` — `saldo_pagado` → al **dueño** · **SOLO la rama normal**
*Datos: `monto`, `citas`. **Hay plata.***

- **es** — «Te devolvimos {monto} del plan de {mascota}»
  «El plan de paseos de {mascota} terminó con {n} salidas sin usar. Te devolvimos {monto} a tu método de pago.»
- **en** — "We refunded {amount} from {pet}'s plan"
  "{pet}'s walk plan ended with {n} unused walks. We refunded {amount} to your payment method."

> ### 🛑 **SU OTRA RAMA NO LA ESCRIBO — ver la lista de abajo.**

---

## 🛑 LAS CUATRO QUE **NO** ESCRIBO SIN DECISIÓN DE PRODUCTO

### A · `plan_renovacion_fallida` — *(la que la mesa ya nombró)*
**No sé qué decir porque no sé qué PASA.** ¿El plan queda activo y se
reintenta? ¿Se suspende? ¿Las citas ya agendadas siguen en pie? **La voz
depende de la respuesta, y la respuesta no está escrita.** *Un aviso que dice
«hubo un problema» sin decir qué queda vigente es peor que ninguno: obliga a
llamar.*

### B · `plan_vencido_reembolso`, **la rama del MEMORIAL**
El productor `_trg_mascotas_memorial_planes` la dispara cuando la mascota
**muere**. **La misma voz de la rama normal sería intolerable.** Y hay algo más
grande: **la letra firmada dice que el memorial CALLA**. ¿Este aviso es una
excepción —porque es plata que vuelve y callarla sería peor— o no debe salir
nunca? *Es decisión de producto, y de las delicadas.*

### C+D · `registro_completado_cliente` **y** `registro_completado_prestador`
**Medido: los DOS van al mismo destinatario** (`v_prestador_dueno_user_id`, el
dueño del negocio) **con los mismos datos**. Dos tipos, un solo receptor.

> **O uno de los dos debería ir al CLIENTE y hay un defecto de motor, o
> sobra un tipo.** *No escribo dos voces distintas para el mismo aviso al mismo
> destinatario: sería maquillar la duda.* **Se mide y se decide antes.**

---

## LO QUE HAGO CON LA FIRMA

Las seis aprobadas entran a `_voz_notificacion` **en un solo lote**, y cada una
se verifica **produciendo por el camino real y leyendo la sombra** — como se
hizo con `plan_renovado`. **Ninguna sale de sombra sin ese par.**
