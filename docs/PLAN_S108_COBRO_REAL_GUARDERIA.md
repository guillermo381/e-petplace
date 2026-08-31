# PLAN · EL COBRO REAL DE GUARDERÍA — censo y plan, ANTES de tocar

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

## ④ LO QUE HAY QUE DECIDIR ANTES, y no es de código

1. 🔴 **¿El bono `pendiente_pago` da saldo?** (paso 0)
2. 🔴 **¿El bono sin pagar vence?** Si sí, con qué ventana — la cita usa 15 min.
3. **¿La mensualidad cobra el primer período AL FIRMAR o el día que arranca?**
   Hoy la pantalla dice *«hoy no se cobra nada, el primer cobro sale el día que
   empieza el plan»* — **eso ya es una promesa hecha a la familia**, y el motor
   tiene que cumplirla.
4. **El comprobante:** ¿el paquete emite uno? (La cita sí.)

---

## ⑤ LO QUE ESTE PLAN NO PROMETE

**No es «conectar dos funciones».** Es el arco entero de un sujeto nuevo —
actuador, reversos, dos edge, wrapper, letra de estados— **dos veces**. La
lección que lo dimensiona es `L-318`, y la casa ya la pagó: *agregar un sujeto
obliga a censar TODOS los consumidores del evento, no sólo la puerta.*

**Lo que sí promete: que pasar a producción sea encender y no reescribir** —
que es exactamente lo que el founder pidió.
