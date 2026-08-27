# ENCARGO A C · el QUÉ no viene elegido de fábrica

**De A · 26-ago-2026 · S106 tanda 3.** Ficha: **`D-941` 🔴**.
Firma del founder. **Las dos curas son tuyas** — son superficie y ya estás
adentro de ese archivo en esta tanda; partirlas pondría dos manos sobre las
mismas líneas.

---

## Lo que pasó, con las filas medidas

El founder **pagó $50 por una consulta presencial que no quería, DOS de cinco
veces**, buscando teleconsulta. Y *sólo se enteró porque fue a mirar la fila en
la base.*

```
713aae37 · tipo_servicio=consulta_general · modalidad=presencial · $50 · 30min · 23:20
7390a25b · tipo_servicio=consulta_general · modalidad=presencial · $50 · 30min · 23:00
c6cdb345 · tipo_servicio=telemedicina     · modalidad=telemedicina · $24 · 20min · 23:00  ← la que sí quería
```

> **Nadie más va a ir a mirar la fila.** Una familia se entera el día de la
> cita — cuando la clínica la espera en persona, o cuando no aparece nadie.

## La causa, medida — una línea

`apps/cliente/src/app/(tabs)/explorar/veterinaria/index.tsx:192`

```js
pedido ?? (s !== null && r.data.some((o) => o.tipo_servicio === s) ? s : r.data[0].tipo_servicio)
```

**El QUÉ nace preseleccionado en `r.data[0]`.** El motor devuelve la oferta
**ordenada alfabéticamente** (`ORDER BY ps.tipo_servicio` en
`_vet_ofertas_cobrables`, medido) ⇒ el default cae en una presencial y
`Teleconsulta` queda más abajo.

⚠️ **Tu propio comentario, dos líneas más arriba, dice la ley correcta:**
*«preselección para ser un ancla. **Preseleccionar no es imponer**»*. El
defecto es su reverso exacto: **preseleccionar el primero alfabético hace que
quien no toca nada compre lo que la lista puso arriba.** *La intención estaba
escrita; faltaba que el default fuera «ninguno».*

## Por qué no tiene síntoma

El resto del flujo se comporta **idéntico** — día, hora, quién, pago. Nada
cambia de forma. El checkout **sí muestra el nombre**
(`checkout-reserva.tsx:432`, `subtitulo={servicioNombre}`) pero **como
subtítulo debajo del nombre de la clínica**.

> *Un dato que está pero no preside no informa. En el momento del pago, lo que
> preside es lo que se lee.*

⇒ **No es una pantalla que miente: es una que no insiste.** Y eso decide la
cura: **no es agregar texto, es que el QUÉ no venga elegido de fábrica.**

---

## ① EL QUÉ NO VIENE ELEGIDO DE FÁBRICA — la cura

**Si el usuario no eligió servicio, no hay servicio elegido**, y la pantalla se
lo pide.

⚠️ **Su borde, y no se puede perder:** **si viene un servicio desde el catálogo
(o desde «Ir a urgencias»), ÉSE gana** y no se pisa con el primero alfabético.
El `pedido ??` que ya escribiste lo respeta — **lo que se retira es el
fallback**, no el ancla.

Dos cosas que decide C y no yo, y por eso no las prescribo:
- qué se ve mientras no hay servicio elegido (¿la grilla sin selección? ¿un
  estado que invita?)
- si el CTA de continuar existe apagado o no existe. *La Ley 23 dice que la
  puerta no ofrece lo que va a rechazar; cómo se ve eso acá es tu ojo.*

## ② EL CHECKOUT DICE QUÉ ESTÁS COMPRANDO, Y PRESIDE — el cinturón

**Es cinturón, no cura:** *aunque ① nunca fallara, una pantalla de pago tiene
que decir qué se paga.* Las dos capas se sostienen solas — si mañana alguien
reintroduce un default, ② lo hace visible antes del cobro.

Hoy preside **el nombre de la clínica** y el servicio va debajo. La pregunta
que la cura contesta es: *en el instante de pagar, ¿qué es lo primero que se
lee?*

---

## Lo que NO hay que tocar, medido

- **El hold usa la oferta correcta.** `lib/reserva/veterinaria.ts` manda
  `v.prestador_servicio_id`, que viene de `obtener_veterinarios_disponibles`.
  **El motor nunca eligió mal** — recibió bien lo que la pantalla le dio.
- **La ficha del prestador tampoco.** Recibe `ofertaId` y `tipoServicio` por
  URL y reserva lo que le pasan. *Fue mi primera sospecha por coincidencia de
  tiempo con la cura de la vitrina, y la medición la descartó.*
- **`modalidad` y `tipo_servicio` coinciden hoy en las 12 citas vivas**, y las
  dos puertas la escriben. Este defecto **no es el choque de ejes** — es
  anterior: la pantalla eligió bien un servicio equivocado.
