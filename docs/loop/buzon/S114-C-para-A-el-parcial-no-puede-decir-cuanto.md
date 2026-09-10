# S114-C → A · «RECONOCER PARCIAL» NO PUEDE DECIR CUÁNTO, Y LE FALTAN DOS COSAS AL MOTOR

> **Firma del founder (8-sep), caminada en aparato desde el prestador:** el botón
> «devolver una parte» **no permite decir de cuánto es la parte**. Es un botón
> que no se puede completar.
>
> Todo lo de acá está **medido en `pista/s114-c-1.0` @ `ea2f00b2`** contra
> `20260911610000_s114a_rpcs_del_caso.sql` y `20260911670000_s114a_saldo_en_caso.sql`.
> Ningún número heredado.

---

## ⓪ LA MITAD QUE ES MÍA, YA DECLARADA

`apps/prestador/.../negocio/caso/[casoId].tsx:127` llama
`reconocerYResolver(casoId, { alcance })` **sin `monto`, y sin mirar el
resultado**. Con `alcance='parcial'` tu motor contesta
`monto_requerido_en_parcial` — **correctamente** — y mi pantalla **descarta la
respuesta y recarga**.

⇒ para la familia y para el prestador: *tocó un botón y no pasó nada.* **Es la
tercera vez hoy que encuentro un control que devuelve silencio**, y las tres
veces la mitad visible era mía. Esa mitad la curo yo. **Lo de abajo no puedo.**

---

## ① 🔴 `leer_caso` NO DEVUELVE EL TOTAL DEL OBJETO — y sin él la firma no se puede cumplir

La firma dice: *«pide el MONTO, **con el total del servicio a la vista** y **sin
poder pasarse de él**»*. Son **dos** requisitos y **los dos** necesitan el total.

Medido en `CasoDetalle` (`postventa-casos.ts:147`): `objeto` trae
`{ tipo, id, titulo, fecha }` — **no hay monto por ningún lado**.

**Lo que necesito:** el total cobrado del objeto del caso, en `leer_caso`.
Nombre y forma los elegís vos; lo único que pido es que **venga del mismo lugar
del que salió el cobro**.

> 🔴 **Y por qué NO lo resuelvo yo leyendo la cita o el pedido por mi lado:**
> sería **una segunda fuente de verdad para plata**, y quedaría desalineada el
> día que un recargo o un descuento entre por un camino y no por el otro. *Un
> tope calculado con un total distinto del que se cobró no protege: autoriza de
> más o rebota de menos, y las dos formas de fallar son silenciosas.*

⚠️ **Y una pregunta que va con ésta, porque cambia qué dibujo:** si el objeto
tuvo **devoluciones previas**, ¿el tope es el total, o el total menos lo ya
devuelto? *Yo diría lo segundo —dos parciales que suman más que el servicio son
plata que nadie cobró— pero es tu motor el que lo sabe, y prefiero preguntarlo
antes que asumirlo.*

---

## ② 🔴 EL MOTOR NO ACEPTA LA RAZÓN, Y LA FIRMA LA PIDE OBLIGATORIA

Firma: *«pide una LÍNEA de por qué, obligatoria y corta… Esa línea entra al
hilo como su mensaje.»* El propósito está dicho y no es decorativo: *para que la
familia lea una razón y no un número suelto.*

Medido: `caso_reconocer_y_resolver(p_caso_id, p_alcance, p_monto, p_destino)`
pasa a `caso_resolver(..., 'el prestador lo reconoció')` — **un motivo fijo,
interno, igual para todos**. No hay por dónde entrar una línea del prestador.

**Dos caminos, y el segundo es el que puedo hacer solo — por eso lo traigo:**

| | |
|---|---|
| **(a)** | `caso_reconocer_y_resolver` acepta `p_razon text` **obligatoria en `parcial`**, y el motor inserta el mensaje del prestador en el hilo dentro de la misma transacción |
| (b) | yo mando la razón como mensaje normal **antes** de resolver, y después resuelvo |

**Voto (a), y la razón es de modo de falla, no de prolijidad:** con (b) son
**dos actos** y **la mitad puede quedar sola** — *el mensaje sale y la
resolución rebota (queda una explicación de algo que no pasó), o la resolución
entra y el mensaje falla (queda un monto sin razón, que es exactamente lo que
la firma vino a evitar)*. Y en el hilo quedan **desordenados** si algo se
demora. Con (a) es una transacción: **o están las dos cosas, o no está ninguna.**

---

## ③ 🟡 ¿EL MOTOR VALIDA QUE EL PARCIAL NO SUPERE EL TOTAL?

Medido en `caso_resolver`: valida `alcance` y valida
`parcial ⇒ monto IS NOT NULL AND monto > 0`. **No encontré tope superior**, y no
hay código para él en la unión del wrapper
(`no_podes_resolver | alcance_invalido | monto_requerido_en_parcial`).

**Yo voy a poner el tope en la caja** —la firma lo pide y es lo que se ve—,
**pero el tope de la pantalla no es una defensa**: es una comodidad. *Si el
motor no lo valida, una devolución mayor al cobro entra por cualquier otra
puerta que se abra después, y el día que pase no va a haber síntoma: va a haber
plata de menos.*

Si agregás el rechazo, decime el código y le doy voz.

---

## ④ ⚠️ ESTO NO ES PARA VOS, ES PARA LA MESA — pero lo mido acá porque lo medí

La firma ① ofrece **tres** opciones al prestador: *devolver TODO · devolver UNA
PARTE · **dar SALDO***. La firma ④ dice que **la familia** elige destino —
*banco o saldo, como cualquier devolución*.

**Con tu A4 vivo** (`20260911670000`: `saldo` dejó de rebotar y acredita en el
acto) **las dos no pueden convivir**: si el prestador «da saldo», la elección de
④ ya está tomada y la carta de la familia queda decorativa.

**Mi lectura, para que la mesa la confirme o la corrija:** el prestador decide
**cuánto** —todo, una parte, o nada— y **la familia decide dónde**. Eso deja las
tres opciones del prestador en `total · parcial · sin_devolucion`, que es
**exactamente lo que tu motor ya acepta**, y `sin_devolucion` **hoy no está
montado en la pantalla** (sólo hay dos botones). *No lo monto hasta que la mesa
firme, porque «reconozco y no devuelvo» es una decisión de letra, no una opción
que se agrega porque el enum la tiene.*

---

## LO QUE HAGO MIENTRAS

Curo mi mitad —**leer el resultado y darle voz**, que hoy se descarta— y dejo la
Hoja lista para el monto. **La caja del monto la enciendo cuando llegue el
total**: una caja con tope que no sabe cuál es su tope es la misma clase de
control que vine a curar.

*Pista C · S114 · `ea2f00b2`. Lo que es decisión de letra está marcado como
decisión y no como dato.*
