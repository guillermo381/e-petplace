# S89-D · LOTE DE VOCES DEL CLIENTE — PARA FIRMA EN UNA PASADA

> **☠️ SUPERSEDED (S89-D orden 4):** la pasada de firma vive en
> **`2026-08-06-s89d-PASADA-UNICA-de-firma.md`** — consolida este
> lote + las tres voces de cita de A + los reemplazos del acento (ya
> firmado tuteo, 6-ago). **Nadie firma sobre este documento.** Queda
> como registro del censo; sus decisiones ① y ② están resueltas o
> re-presentadas allá.

> **Qué es:** las voces de SUPERFICIE del cliente nacidas en S88-D
> (campana + Preferencias), censadas contra el catálogo vivo y
> ordenadas para que el founder firme el lote entero de una pasada.
> **Qué NO es:** las voces de TIPO (asunto/cuerpo de las
> notificaciones — los 10 sin firmar de D-667 y las 6 inline del
> prestador) son del MOTOR, territorio A; este lote las ALIMENTA
> porque la misma sesión de firma puede cerrar ambos, pero no las
> contiene. **Nada sale de sombra sin voz firmada** (L-207) — y
> ninguna key de acá cambia sin esta firma.
>
> Fuente del literal: `apps/cliente/src/i18n/es.ts` / `en.ts` (vivos,
> 6-ago). Contraste: `cat_notificacion_tipos` vivo (37 tipos, medido
> en el relevamiento D-539 de esta misma fecha).

---

## ⚖️ LAS TRES DECISIONES QUE ESTA FIRMA RESUELVE (antes de las tablas)

**① EL ACENTO.** En el lote conviven tuteo y voseo, y los dos lados
tienen firma que citar: `notifLey` dice «**Elige** por dónde» (tuteo,
L-148) y los porqués de §3 —FIRMADOS en la lámina— dicen «**Elegís**
por dónde» (voseo). El literal firmado de la lámina §4 es «No
**tenés** avisos». Y el motor tiene el mismo cisma (relevamiento
D-539 §6: las voces firmadas de `_voz_notificacion` vosean, las del
prestador fueron curadas a tuteo por L-148). **Una sola decisión acá
ordena todo: ¿la voz del cliente tutea (L-148) o vosea (las láminas)?
Lo que se firme se aplica parejo — dos acentos en una pantalla no
sobreviven esta pasada.**

**② «PUSH» EN `notifPermisoNegado`.** La enmienda de lámina firmada
en el gate S88 mató «Push» como vocabulario del dueño (el canal se
dice «En el teléfono»). Pero `notifPermisoNegado` todavía dice
«…los avisos **push** no pueden llegar». **El par COMPLETO propuesto
a la firma** (espeja el vocabulario de los canales — «En el
teléfono» / "On your phone"):

> **es:** «El teléfono tiene apagadas las notificaciones de
> e-PetPlace. Hasta que las actives en los ajustes del sistema, los
> avisos en el teléfono no pueden llegar.»
>
> **en:** "Your phone has notifications turned off for e-PetPlace.
> Until you turn them on in system settings, updates on your phone
> can't arrive."

*(La palabra "updates" del en queda atada a la decisión ③ — si el
founder unifica en otra, este par la adopta en el mismo acto.
"Notifications" en la primera frase se conserva: nombra el ajuste
del SISTEMA, que sí se llama así en el teléfono.)*

**③ LA PALABRA INGLESA PARA «AVISOS».** El en vivo usa DOS:
«notices» (todo el marco `avisos.*`) y «updates» (`notifLey`,
`waConsentTitulo`). Dos palabras para el mismo objeto en la misma
app. **Propuesta a la firma:** unificar en **«updates»** (la campana:
"Updates" · "You don't have updates" · "We couldn't load your
updates."), que ya es la palabra de Preferencias y de WhatsApp.

---

## A · EL MARCO DE LA CAMPANA — `avisos.*` (10 keys)

| key | es (vivo) | en (vivo) | estado |
|---|---|---|---|
| `titulo` | Avisos | Notices | candidata *(en sujeta a ③)* |
| `vacio` | No tenés avisos | You don't have notices | **es = LITERAL FIRMADO lámina §4** *(sujeto a ①)* · en candidata |
| `errorCargar` | No pudimos cargar tus avisos. | We couldn't load your notices. | candidata |
| `sinVozTitulo` | Aviso | Notice | candidata — fallback DIGNO del null honesto del lector: se declara genérico, no se inventa |
| `noLeido` | Sin leer | Unread | candidata |
| `momentoRecien` | Recién | Just now | candidata |
| `momentoMin` | Hace {{n}} min | {{n}} min ago | candidata |
| `momentoHoras` | Hace {{n}} h | {{n}} h ago | candidata |
| `momentoAyer` | Ayer | Yesterday | candidata |

## B · LAS FILAS Y LOS PORQUÉS DE PREFERENCIAS

**Filas (lámina §1):** Tus citas y servicios · Cuidado y salud · La
seguridad de tu cuenta · Lo que ya pagaste · Mensajes y respuestas ·
Resúmenes · Novedades y ofertas — con sus 7 pares en vivos.
Candidatas (la lámina firmó la ESTRUCTURA; el string viaja acá).

**Porqués (§3, FIRMADOS en lámina — viajan para ratificar el literal
en el papel, sujetos a ①):**

| key | es (vivo) | en (vivo) |
|---|---|---|
| `notifPorqueSaludSeguridad` | Estos avisos siempre llegan. **Elegís** por dónde, no si te llegan. | These always reach you. You choose how, not whether. |
| `notifPorqueSeguridadCuenta` | Los avisos de tu cuenta siempre llegan. **Elegís** por dónde. | Account alerts always reach you. You choose how. |
| `notifPorqueSaldoPagado` | Si algo que ya pagaste está por vencer, te avisamos siempre. | If something you already paid for is about to expire, we always tell you. |

**La ley de la pantalla:** `notifLey` — «**Elige** por dónde te llegan
los avisos. Algunos siempre llegan — eliges cómo.» / "Choose how
updates reach you. Some always arrive — you choose how." *(tuteo —
el contraejemplo vivo de ① en la misma pantalla).*

## C · LOS EJEMPLOS POR FILA — `notifEj*` (6, FIRMADOS EN GATE S88)

Firmados por el founder EN PANTALLA (gate S88, con sus dos cambios:
seguridad dice lo que le importa a la persona; comercial dice qué se
gana). Viajan para que la firma del lote los RATIFIQUE en el papel.
**Cada uno respaldado por tipos del catálogo VIVO** (ninguno promete
una categoría vacía):

| key | es (vivo) | tipos vivos que lo respaldan |
|---|---|---|
| `notifEjOperacion` | Recordatorios y confirmaciones de citas, tus pagos y pedidos. | `cita_recordatorio` · `cita_confirmada` · `pago_confirmado` · `pedido_estado`… (11 de la categoría, audiencia cliente/ambas) |
| `notifEjSaludSeguridad` | Vacunas por vencer y alertas de salud de tus mascotas. | `vacuna_vencida` · `wearable_alerta` |
| `notifEjSeguridadCuenta` | Si alguien entra a tu cuenta o cambia tu contraseña. | `sistema` (seguridad_cuenta) |
| `notifEjSaldoPagado` | Paquetes o planes que pagaste y están por vencer o renovarse. | `paquete_vence` · `plan_renovacion_proxima` · `plan_vencido_reembolso`… (6) |
| `notifEjRelacional` | Mensajes nuevos de quienes cuidan a tus mascotas. | `mensaje_nuevo` |
| `notifEjComercial` | Promociones, descuentos y novedades de e-PetPlace. | `promocion` |

*(pares en vivos en `en.ts`; «Resúmenes» sigue SIN key a propósito —
cero tipos vivos en su categoría: la fila no se dibuja, y su ejemplo
se escribe cuando nazca el primer digest. DERIVADA, no lista a mano.)*

## D · LOS CANALES (enmienda de lámina FIRMADA, gate S88 — ratificación)

«En la app» / «En el teléfono» / «Por correo» / «WhatsApp» (marca) —
pares en vivos. Push no es vocabulario del dueño.

## E · EL PERMISO DEL SISTEMA — `notifPermisoNegado`

Vivo: «El teléfono tiene apagadas las notificaciones de e-PetPlace.
Hasta que las actives en los ajustes del sistema, los avisos **push**
no pueden llegar.» — **sujeta a la decisión ②** (propuesta arriba).

## F · EL CONSENTIMIENTO DE WHATSAPP (lámina §4 — BORRADOR A LA FIRMA)

| key | es (vivo) | en (vivo) |
|---|---|---|
| `waConsentTitulo` | Avisos por WhatsApp | WhatsApp updates |
| `waConsentTexto` | Quiero recibir avisos de e-PetPlace por WhatsApp en este número. Puedo desactivarlo cuando quiera desde Preferencias. | I want to receive e-PetPlace updates on WhatsApp at this number. I can turn this off anytime in Preferences. |
| `waConsentAceptar` | Sí, quiero recibirlos | Yes, I want them |
| `waConsentCancelar` | Ahora no | Not now |

*Es un CONSENTIMIENTO (opt-in D-436): el texto habla en primera
persona de quien acepta, y el camino de salida está adentro del
propio texto — las dos cosas a propósito, que la firma las ratifique
o las corrija.*

---

## LA PASADA DE FIRMA (checklist)

- [ ] Decisión ① — el acento del cliente (ordena A, B y el motor §6 del relevamiento)
- [ ] Decisión ② — `notifPermisoNegado` sin «push»
- [ ] Decisión ③ — una sola palabra en para «avisos»
- [ ] A · marco `avisos.*` (9 pares)
- [ ] B · filas (7) + porqués (3, ratificar) + `notifLey` + `notifPorDonde`
- [ ] C · ejemplos `notifEj*` (6, ratificar en papel)
- [ ] D · canales (4, ratificar)
- [ ] E · permiso del sistema (1, con ②)
- [ ] F · consentimiento WhatsApp (4 — el borrador de §4 sale de borrador ACÁ)

**Tras la firma:** los cambios que salgan de ①/②/③ se aplican en un
solo commit de diccionarios (es+en juntos, Espejo lo exige) y las
marcas de candidata mueren de los comentarios (patrón de todo lote
aprobado desde S55).

**Origen: S89-D orden de apertura ② · alimenta D-667 · 6-ago-2026.**
