# S89-A · LOTE DE VOCES DE CITA — PARA LA PASADA DE FIRMA DE D

**Estado:** las tres voces están **CABLEADAS EN `_voz_notificacion` y EN
SOMBRA** (`en_sombra=true` en el catálogo — nada llega a campana ni correo).
**NINGUNA está firmada.** La vara de S89 rige entera: *nada sale de sombra sin
voz firmada, y el primer envío real de cada tipo lleva su ojo.*

**Acento:** tuteo neutro único (firma founder 6-ago-2026) — «puedes», jamás
«podés». ⚠️ **Divergencia declarada:** las voces firmadas del lote S88
(`plan_renovado` y compañía) dicen «Podés / Coordiná» — es territorio **D-539**
y lo arbitra esta misma pasada de firma: o el lote viejo migra a tuteo, o la
firma dice otra cosa. **Ninguna de las dos cosas se decidió acá.**

**Requisito de D (cumplido en las tres):** toda intención nace portando su
referente — `mascota_id` SIEMPRE en la fila, `mascota_nombre` en `datos`.

Los literales de abajo son EXACTOS a lo cableado (los `{…}` marcan lo que la
voz resuelve con datos vivos; sin dato, la frase cae al genérico sin inventar).

---

## 1 · `cita_confirmada` — al DUEÑO (nace cuando el pago confirma)

**es** · título: **Tu cita quedó confirmada**
> La cita de {mascota} con {negocio} quedó confirmada para el {DD/MM} a las
> {HH:MM}. Puedes ver el detalle en la app.

**en** · título: **{Mascota}'s appointment is confirmed**
> The appointment for {mascota} with {negocio} is confirmed for {DD/MM} at
> {HH:MM}. You can see the details in the app.

Productores vivos (en sombra): `confirmar_cita_pagada` (camino principal) ·
`reservar_salida_paquete`.

## 2 · `cita_solicitada` — al NEGOCIO (la reserva que le cae)

**es** · título: **Te llegó una nueva reserva**
> Reservaron para {mascota}: {DD/MM} a las {HH:MM}. Ya está en tu agenda como
> cita firme.

**en** · título: **You have a new booking**
> A booking came in for {mascota}: {DD/MM} at {HH:MM}. It's already on your
> schedule as a firm appointment.

Destinatario: el titular (`prestadores.user_id`). Mismos dos productores —
**dos avisos, dos audiencias, un instante** (firma founder). Nota medida para
la lámina: `obtener_mis_avisos` no filtra por audiencia — con cuentas
separadas por rol no sangra; se declara.

## 3 · `cita_recordatorio` — al DUEÑO (dos toques, un tipo; `toque` decide)

**es** · título: **La cita de {mascota} es {mañana|hoy}**
> Te recordamos la cita de {mascota} con {negocio}: es {mañana|hoy} a las
> {HH:MM}.

**en** · título: **{Mascota}'s appointment is {tomorrow|today}**
> A reminder: the appointment for {mascota} with {negocio} is {tomorrow|today}
> at {HH:MM}.

---

## LA LETRA FINA DEL RECORDATORIO (se deposita junto a la lámina — firma arriba, operativa acá)

Ventana firmada: **DOS toques — la mañana del día anterior y la mañana del día
de la cita**; creada con menos de un día → solo el segundo; con menos de unas
horas → un único aviso inmediato. Cómo quedó operativa en el scan
(`notificar_recordatorios_cita`, job pg_cron cada 15'):

1. **«La mañana» = 08:00 America/Guayaquil** (la tz fija de la casa, D-320).
2. **Toque DÍA:** debido en `LEAST(fecha 08:00, hora de la cita − 1 h)`; se
   envía dentro de `[debido, hora de la cita)`. La cita que NACE dentro de esa
   ventana sale al próximo tick — **ése es el «aviso inmediato»**. La cita muy
   temprana (antes de las 09:00) recibe su toque 1 h antes, no después de
   ocurrida.
3. **Toque PREVIO:** debido en `(fecha − 1) 08:00`; se envía dentro de
   `[debido, toque día)` **solo si la cita ya existía esa mañana** — el borde
   «menos de un día → solo el segundo» sale de ahí, no de restar horas.
4. Nada suena después de la hora de la cita · solo `estado='confirmada'` con
   dueño en app · **una reagenda re-suena en su fecha nueva** (la clave de
   dedup porta la fecha — declarado, no accidental) · idempotencia gratis por
   `clave_dedup` UNIQUE (el par lo probó: segunda pasada = 0 nuevas).

Verificado en sombra (fixture in-txn, ROLLBACK): día sonó · previo sonó ·
creada-hoy-para-mañana en CERO · hora pasada en CERO · dedup en 1.

---

## LO QUE ESTA PASADA DE FIRMA HABILITA

Firmar una voz ⇒ su tipo puede salir de sombra (`en_sombra=false`) **mirando
la sombra del productor real** (L-207) ⇒ el primer envío real lleva el ojo del
founder. Hasta entonces, todo lo de arriba produce y registra sin tocar a
nadie. Remitente firmado para el tren del correo: `hola@epetplace.com` (la
config de dominio/reputación es arco propio).
