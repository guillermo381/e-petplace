# S114-E → A · EL SUJETO DE LA MENSUALIDAD EXISTE — y sembrarlo destapó por qué tu cinturón no iba a poder salir de NO CONCLUYENTE

> **UN SOLO ASUNTO.** **Rama:** `pista/s114-e-1.0` · **script:**
> `scripts/s114/sembrar-mensualidad-guarderia.mjs` · **medido 7-sep-2026 ~22:40 Guayaquil.**
> **Todo por RPCs, cero `INSERT`.**

---

## ① LO SEMBRADO — ya hay estadías vivas de mensualidad

| | |
|---|---|
| mensualidad | `761ac1ce-3f72-4c19-a434-c04bdf70b853` · **activa** |
| familia | `guillo381+7@gmail.com` · mascota **Thor, PERRO** |
| período | **2026-09-07 → 2026-10-06** · `precio_mensual` 100,00 |
| estadías | **22**, todas `reservada` (22 días hábiles comprometidos) |

**Camino, y ninguna de las dos primeras mueve plata:**
`contratar_mensualidad_guarderia` (medido: **no toca `pagos_intentos`**) →
`cobrar_periodo_mensualidad_guarderia(susc, NULL, NULL)` (medido: **cero
`net.http`** — su nombre dice «cobrar» y es el APLICADOR).

---

## ② 🔴 EL HALLAZGO: LA RAMA DE MENSUALIDAD ES INALCANZABLE

**Tu `_devengar_estadia` elige la rama leyendo `v_c.suscripcion_servicio_id` de
la CITA** (verificado: `lee_de_cita = true`).

**Y el aplicador no lo escribe.** Medido sobre las 22 citas que acaba de crear:

```
tipo_servicio  precio  estado_reserva   n   con suscripcion_servicio_id
guarderia_dia    0      pagada         22            0
```

⇒ **Aunque entregues una de estas estadías, la rama de mensualidad NO se
ejecuta.** Cae en la rama día/paquete, que usa `cita.precio` = **0**, y ahí
espera tu propio `RAISE 'estadia_sin_precio'`.

*Por eso tu cinturón no era «no hay datos todavía»: **es que con estos datos
tampoco iba a poder**.* El sujeto faltaba y el cable también, y desde el
NO CONCLUYENTE los dos se veían igual.

**Las dos salidas, y la elección es tuya:** que el aplicador estampe
`suscripcion_servicio_id` en las citas que crea, **o** que `_devengar_estadia`
resuelva la mensualidad por otro camino (hoy **no hay ningún vínculo durable**
entre una estadía y su mensualidad: lo comprobé buscándolo).

## ③ Y un segundo requisito, para cuando cures lo anterior

`marcar_a_bordo_guarderia` rebota **`sin_tramo_abierto: no hay tramo de recogida
abierto para esta estadia`**. Entregar una estadía **exige abrir su tramo
primero**. No lo forcé: el bloqueante de ② ya estaba establecido y seguir era
conducir medio flujo operativo para llegar a un rojo que ya conocía.

---

## ④ ⚠️ NO PUDE MARCARLA COMO SIEMBRA, Y TE PIDO EL CAMPO

**`guarderia_suscripciones` no tiene ningún campo de texto** donde escribir una
marca — a diferencia de `casos_postventa`, que tiene `relato`. Intenté heredar
la marca de la mascota (`mascotas.creado_por_sistema`, la de S113), **pero la
única familia elegible tiene su Thor sin marcar**.

**Hoy la siembra se identifica sólo por su id**, y eso es más débil de lo que la
mesa pide (*«para que ninguna medición futura los lea como tráfico»*):

```sql
-- lo sembrado por S114-E
select * from guarderia_suscripciones where id = '761ac1ce-3f72-4c19-a434-c04bdf70b853';
```

**Pedido: `creado_por_sistema` en `guarderia_suscripciones`**, mismo patrón que
S113 puso en `mascotas`. *Un id escrito en un documento se pierde; una columna
la encuentra cualquier censo.*

---

## ⑤ TRES DECISIONES QUE TOMÉ, Y POR QUÉ — para que las revises o las revoques

1. **NO usé la mensualidad que ya existía, ni la cancelé.** Es la de **Pepe, un
   AVE**, y la oferta declara `especies_compatibles: ['gato','perro']` ⇒ **el
   dato está y la puerta no lo mira** — el defecto que el canon ya tiene medido,
   ahora con su evidencia exacta. Sembrar encima habría fabricado estadías que
   la regla de especie debería impedir; **cancelarla para liberar el cupo habría
   borrado la evidencia de un defecto abierto.** *Una siembra no destruye el
   sujeto de otra medición.*
2. **Llamé al aplicador con `service_role`, y lo declaro.** Medido:
   `authenticated` recibe `permission denied` — **no es puerta de cliente**. En
   producción la llama `aplicar_evento_de_pago`, que es DEFINER: **el sistema**.
   Llamarla como sistema se parece más a producción que llamarla como familia, y
   **sigue siendo la RPC real**: tu fórmula corre igual. *Lo prohibido era el
   `INSERT`, no el rol.*
3. **Verifiqué el reloj ANTES de crear el mandato.** `guarderia_recurrente_vivo()`
   está en **false**, así que ningún cron va a cobrarlo. *Dejar un mandato vivo
   que alguien pueda cobrar sería sembrar una deuda, no un sujeto.* El script
   **para** si esa llave está encendida.

## ⑥ Un dato de paso, por si te sirve

**Un solo prestador ofrece mensualidad de guardería** (Clínica Aurora), y el
guard `ya_tienes_plan_activo` es por **`(familia, prestador)`** — así que una
familia que ya tiene una **queda sin camino** para contratar otra. Por eso la
siembra fue con `guillo381+7` y no con la familia demo de siempre.
