# PLAN · EL COBRO REAL DE GUARDERÍA — censo y plan, ANTES de tocar

> **Estado: ESPERANDO SU SESIÓN.** 🔴 **El founder FRENÓ el arranque el
> 31-ago-2026** — no por dudas sobre el objetivo, que sigue firmado, sino de
> ALCANCE: *es el arco entero de un sujeto dos veces, y S107 es la sesión del
> FLUJO de guardería.* **Se hace en su propia sesión, con este plan.**
>
> **Nace:** 31-ago-2026, por orden del founder: *«adelante, como TANDA PROPIA
> … antes de construir: censo y plan, y me lo pasás antes de tocar»*.
> **Firma que lo ordena:** nada de `pago_simulado` — el paquete y la
> mensualidad cobran por el riel de verdad, igual que el día suelto, **para que
> pasar a producción sea encender y no reescribir**.

---

## ① EL CENSO — dónde está cada pieza hoy

**La buena noticia:** `pagos_intentos` **ya tiene `bono_id`**, y está en el
CHECK XOR de sujetos junto a `pedido_id`, `cita_id`, `recurrencia_id` y
`suscripcion_servicio_id`. **La tabla ya lo contempla.**

**De ahí no pasa:**

| pieza | ¿conoce el bono? | ¿conoce la mensualidad? |
|---|---|---|
| `pagos_intentos` (tabla) | ✅ `bono_id` | ❌ — `suscripcion_servicio_id` es **otra tabla** |
| `aplicar_evento_de_pago` | ❌ (lo NOMBRA desde hoy, no lo mueve) | ❌ |
| `pagos-cobro` (edge, Nuvei) | ❌ | ❌ |
| `pagos-deuna-solicitud` (edge) | ❌ | ❌ |
| `cobrarSujeto` (wrapper) | ❌ — sólo `compra` y `cita` | ❌ |
| reversos + su trigger | ❌ | ❌ |
| `comprar_paquete_guarderia` | nace **`pagado`** con `pago_simulado: true` | — |
| `contratar_mensualidad_guarderia` | — | firma el mandato, **`cobrada: false`** |

⇒ **Son DOS sujetos nuevos, no uno.** Y la mensualidad además **no tiene
columna** en `pagos_intentos`: hay que agregarla al XOR.

---

## ② EL RIESGO QUE ORDENA EL ORDEN — ya curado, y por eso se puede construir

☠️ **El actuador ignoraba en silencio lo que no conoce**, devolviendo
`ok: true` y **sin escribir nada en el evento**. *Un cobro que no ocurrió,
reportado como ocurrido.*

✅ **CURADO ANTES DE CABLEAR** (`20260831220000`, cinturón 3/3, por orden
explícita del founder): ahora nombra el sujeto (`bono`,
`mensualidad_guarderia`), **marca el evento** `resultado='desconocido'` con su
detalle, y devuelve **`ok: false`**.

> **Eso cambia la naturaleza del riesgo de la tanda:** si el cableado queda a
> medias, **suena**. Antes, quedar a medias era indistinguible de funcionar.

---

## ③ EL PLAN, en el orden en que se puede medir cada paso

**Cada paso deja el sistema en un estado honesto** — ninguno depende del
siguiente para no mentir.

**Paso 0 · La letra del estado del bono.** Hoy `comprar_paquete_guarderia`
inserta con `estado_pago='pagado'`. Necesita nacer **`pendiente_pago`** y tener
su transición. ⚠️ **Es decisión de letra, no de código:** ¿un bono
`pendiente_pago` da saldo? (Respuesta propuesta: **NO** — reservar contra saldo
no cobrado es la palanca que S54 cerró en citas.) **Y qué pasa si el pago nunca
llega:** ¿hold con vencimiento, como la cita?

**Paso 1 · La columna de la mensualidad.** `pagos_intentos` gana
`guarderia_suscripcion_id` y entra al XOR. *Un sujeto sin columna no puede
cobrar por este riel.*

**Paso 2 · El actuador aprende a MOVER los dos sujetos.** Las **dos ramas**
—Nuvei resuelve por `dev_reference`, DeUna por `referencia_corta`— y **las dos
se prueban**. ⚠️ La rama DeUna exige consulta verificada: su arnés es más caro y
hay que presupuestarlo.

**Paso 3 · Los reversos.** `D-923` dejó escrito que **el sujeto se mueve por
TRIGGER sobre la transición del intento, no cableado por riel** — así que el
trigger tiene que saber deshacer un bono y un mandato. 🔴 *Cablear dentro de
cada registrador es cómo el segundo riel se olvida* — la lección es de S105 y
acá aplica igual.

**Paso 4 · Las dos edge y el wrapper.** `pagos-cobro`, `pagos-deuna-solicitud`
y el tipo `sujeto` de `cobrarSujeto`.

**Paso 5 · Las dos puertas dejan de simular** y el comprobante.

**Paso 6 · El recorrido real, de punta a punta**, en el ambiente que
corresponda.

---

## ④ LAS DECISIONES DE LETRA — 🟢 TRES FIRMADAS, UNA ABIERTA

**Firmadas por el founder el 31-ago-2026. La sesión que retome esto NO las
vuelve a decidir — las ejecuta.**

**① 🟢 UN BONO `pendiente_pago` NO DA SALDO.**
*Reservar contra saldo no cobrado es exactamente la palanca que S54 cerró en
citas.* `comprar_paquete_guarderia` deja de nacer `pagado`.

**② 🟢 EL BONO SIN PAGAR VENCE, con la misma ventana de 15 minutos** que la
cita. ⚠️ El bono **no toma cupo** —es saldo, no un día—, así que lo que el
vencimiento evita es otra cosa: **un `pendiente_pago` que nadie va a pagar y que
sólo se limpia a mano.** *Y la limpieza manual es la clase de cosa que nadie
corre.* Se usa la misma ventana por coherencia con lo que la familia ya conoce
del checkout.

**③ 🟢 LA MENSUALIDAD COBRA EL DÍA QUE ARRANCA EL PLAN, no al firmar.**
🔴 **Y esto NO era una decisión libre: ya está PROMETIDO.** La pantalla dice
*«hoy no se cobra nada, el primer cobro sale el día que empieza el plan»* y se
publicó así. **El motor cumple lo que la pantalla prometió** — *cobrar el día
que se firma después de haber dicho que no se cobra hoy es exactamente la
mentira que esa frase existe para evitar.*

**④ 🟡 EL COMPROBANTE DEL PAQUETE: ABIERTO — pregunta para el contador.**
La cita emite uno; el paquete es una compra de **saldo**, no de un servicio
prestado. El comprobante lleva **el concepto y los dos códigos de
certificación**, y **no está medido si un paquete de días tributa igual que un
día de guardería**. *Proponer un criterio fiscal sin medirlo sería inventar* ⇒
va con las que ya esperan al contador (IVA de servicios, redondeo por línea).

## ④bis LO QUE QUEDA ABIERTO Y NO ES DE CÓDIGO

**Sólo el comprobante (④), y espera al contador.** Las otras tres están
firmadas arriba.

---

## ⑤ LO QUE ESTE PLAN NO PROMETE

**No es «conectar dos funciones».** Es el arco entero de un sujeto nuevo —
actuador, reversos, dos edge, wrapper, letra de estados— **dos veces**. La
lección que lo dimensiona es `L-318`, y la casa ya la pagó: *agregar un sujeto
obliga a censar TODOS los consumidores del evento, no sólo la puerta.*

**Lo que sí promete: que pasar a producción sea encender y no reescribir** —
que es exactamente lo que el founder pidió.
