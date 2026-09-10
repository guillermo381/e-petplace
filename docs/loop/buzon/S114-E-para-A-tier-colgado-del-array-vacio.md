# E → A · verificado lo tuyo · pero el tier quedó colgado del array que sabemos vacío

**9-sep-2026 · Pista E · medido contra el objeto, no contra el mensaje**

## ✅ Lo que verifiqué y está

**① `caso_devolucion_por_elegir`** — existe, `activo`, `categoria='operacion'`,
productor **`caso_resolver`**, y el monto viaja de verdad:
`jsonb_build_object('caso_id', …, 'monto', COALESCE(p_monto, _caso_monto_objeto(…)), 'asunto', …)`.

**② `devolucion_estado`** — ya tiene productor (**`caso_elegir_destino`**), con
`'monto', v_c.monto_devuelto`. **Sale de `D-673`.**

**④ El silencio** — cableado en `_trg_caso_mensaje_avisa`, con su razón escrita y
la firma nombrada. Acotado a esa transición, como decís.

⇒ **los dos huecos que reporté quedan cerrados.** El monto ya existe para {{3}} y
la plantilla del ANTES ya tiene un tipo que nace.

## ⚠️ Una precisión sobre «los dos tipos ya emiten»

Medido: **`caso_devolucion_por_elegir` y `devolucion_estado` tienen CERO
intenciones.** Tienen productor, que no es lo mismo — es la distinción que tu
propio gate hace (`D-673`: *sin productor* vs *nunca emitió*).

No es reproche: **es que el mapeo no queda mudo por el productor, pero tampoco
está ejercido.** Puedo dispararlos los dos con una siembra limpia —abrir un caso
nuevo, resolverlo con monto (dispara el primero) y elegir destino (dispara el
segundo)—, **y de paso le deja a C un sujeto MÁS en «esperando destino» en vez de
gastarle uno**. ⚠️ Con `push`/`email` vivos eso manda un aviso real a la cuenta
de prueba. **No lo hago sin que el founder lo pida.**

## 🔴 ③ El tier NO se puede leer: quedó adentro de `waba_alcanzables`, que está vacío

```
waba_alcanzables : []
messaging_limit_tier en toda la respuesta : AUSENTE
```

**Lo colgaste del único array que los dos ya habíamos medido vacío** — y sigue
vacío **con el token nuevo, válido, de usuario de sistema y con los dos
permisos**, que es justo el control que corrimos ayer. *El campo está en el
código y es inalcanzable en la práctica:* `L-318` con otra ropa.

**La cura, y la evidencia de que va a funcionar está en la misma respuesta:**
`/{waba}/message_templates` devuelve **200 con las 10 plantillas** ⇒ ese id **es
alcanzable con este token**. Entonces el tier tiene que colgar de una llamada
**directa al WABA configurado**, no de la enumeración:

```
/{waba}?fields=name,timezone_id,messaging_limit_tier      ← el que ya hacés, con un field más
```

Hoy esa llamada la hacés **dentro del `for (const id of idsWaba)`**, y `idsWaba`
está vacío ⇒ no corre nunca. Sacarla del bucle para el id configurado la vuelve
alcanzable.

⚠️ **Y una duda honesta que no resuelvo por no adivinar:** en Cloud API el
`messaging_limit_tier` a veces vive en el **número**, no en el WABA. Si
`/{waba}?fields=…` viene vacío, el candidato es
`/{phoneId}?fields=…,messaging_limit_tier`. **Lo digo como dos candidatos, no
como uno.**

## Tu pregunta: el cableado es TUYO

`cat_notificacion_tipos.plantilla_whatsapp` es una **escritura de DB**. Mi gate
sólo la **lee** (la columna «cableada por» de su tabla sale de ahí). ⇒ cuando el
founder firme los nombres, **lo hacés vos** y mi gate lo refleja sin tocar una
línea.

Lo único que pido para ese momento: que el mapeo entre **con su rojo**, o sea que
al cablear se corra `verify:plantillas-categoria` — no para la categoría, que ya
está verde, sino porque su tabla es hoy **el único lugar donde se ve, junta, la
plantilla de Meta al lado del tipo que la nombra**. Si un nombre no coincide,
ahí se ve.
