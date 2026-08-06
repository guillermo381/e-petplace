# S89 · LA PASADA ÚNICA DE FIRMA — voces del cliente + voces de cita + el acento

> **EL FOUNDER LEE ESTE DOCUMENTO Y FIRMA UNA VEZ.** Consolida: el
> lote del cliente (S89-D, órdenes 1-2), las tres voces de cita de A
> (`2026-08-06-s89a-lote-voces-cita-PARA-FIRMA.md` — citadas acá con
> su literal; la letra fina del recordatorio vive allá), y los
> reemplazos que la firma del acento obliga. Los documentos previos
> de lote quedan SUPERSEDED por éste — una sola letra canónica de
> firma, para que nadie cite la vieja.
>
> **Regla que gobierna todo el lote:** nada sale de sombra sin voz
> firmada, y el primer envío real de cada tipo lleva el ojo del
> founder (L-207).

---

## §1 · EL ACENTO — YA FIRMADO; ESTA PASADA FIRMA SUS CONSECUENCIAS

**Tuteo neutro único — firma founder 6-ago-2026** (depositada en el
lote de A: «puedes», jamás «podés»). Lo que queda es ejecutar la
consecuencia sobre lo firmado ANTES con voseo — **el founder firma el
reemplazo viendo qué muere.**

### 1a · Las CINCO voces del motor que vosean (la divergencia que A declaró — D-539)

*El inglés de las cinco no cambia (nunca voseó). La migración que
aplica estos reemplazos es de A; esta firma la autoriza.*

| tipo | ☠️ MUERE (literal vivo) | ✅ NACE (tuteo neutro) |
|---|---|---|
| `plan_renovado` | «Renovamos el plan de paseos de {mascota} por un mes más. Ya está activo y el cobro se hizo con tu método habitual. **Podés** ver el detalle en la app.» | «…Ya está activo y el cobro se hizo con tu método habitual. **Puedes** ver el detalle en la app.» |
| `plan_renovacion_proxima` | «El plan de paseos de {mascota} se renueva el {fecha} y se va a cobrar con tu método habitual. Si no **querés** que siga, **podés** pausarlo desde la app antes de esa fecha.» | «…Si no **quieres** que siga, **puedes** pausarlo desde la app antes de esa fecha.» |
| `paquete_vence` | «El paquete de paseos de {mascota} vence el {fecha} y todavía te quedan {n} salidas. **Podés** reservarlas desde la app.» | «…**Puedes** reservarlas desde la app.» |
| `programa_vence` | «El programa de adiestramiento de {mascota} vence el {fecha}. **Coordiná** las sesiones que faltan desde la app.» | «…**Coordina** las sesiones que faltan desde la app.» |
| `procedimiento_agendado` | «{negocio} confirmó la fecha: {fecha} a las {hora}. **Podés** ver el detalle en la app.» | «…**Puedes** ver el detalle en la app.» |

*(Las otras 4 voces vivas del helper — los dos reembolsos y las dos
del registro — ya están en tuteo/neutro: cero cambio.)*

### 1b · Las TRES keys del cliente que vosean (misma firma, mi lado)

| key | ☠️ MUERE | ✅ NACE | nota |
|---|---|---|---|
| `avisos.vacio` | «No **tenés** avisos» | «No **tienes** avisos» | era LITERAL FIRMADO de la lámina de la campana §4 — **esta firma lo reemplaza EN SU LUGAR** (precedente magenta/plata: dos letras firmadas que se contradicen son peores que una equivocada) |
| `notifPorqueSaludSeguridad` | «Estos avisos siempre llegan. **Elegís** por dónde, no si te llegan.» | «…**Eliges** por dónde, no si te llegan.» | porqué de lámina §3 |
| `notifPorqueSeguridadCuenta` | «Los avisos de tu cuenta siempre llegan. **Elegís** por dónde.» | «…**Eliges** por dónde.» | ídem |

---

## §2 · LAS TRES VOCES DE CITA (A — cableadas en sombra, SIN firma; se firman acá)

**Requisito de D cumplido en las tres:** la intención nace portando
`mascota_id` (+ `mascota_nombre` en datos) — el mapa de destinos las
recibe con destino.

**② `cita_confirmada` — al DUEÑO** (nace cuando el pago confirma):
- es · **«Tu cita quedó confirmada»** — «La cita de {mascota} con
  {negocio} quedó confirmada para el {DD/MM} a las {HH:MM}. Puedes
  ver el detalle en la app.»
- en · **"{Mascota}'s appointment is confirmed"** — "The appointment
  for {mascota} with {negocio} is confirmed for {DD/MM} at {HH:MM}.
  You can see the details in the app."

**③ `cita_solicitada` — al NEGOCIO:**
- es · **«Te llegó una nueva reserva»** — «Reservaron para {mascota}:
  {DD/MM} a las {HH:MM}. Ya está en tu agenda como cita firme.»
- en · **"You have a new booking"** — "A booking came in for
  {mascota}: {DD/MM} at {HH:MM}. It's already on your schedule as a
  firm appointment."

**④ `cita_recordatorio` — al DUEÑO** (dos toques, un tipo):
- es · **«La cita de {mascota} es {mañana|hoy}»** — «Te recordamos la
  cita de {mascota} con {negocio}: es {mañana|hoy} a las {HH:MM}.»
- en · **"{Mascota}'s appointment is {tomorrow|today}"** — "A
  reminder: the appointment for {mascota} with {negocio} is
  {tomorrow|today} at {HH:MM}."

*La ventana del recordatorio (08:00 Guayaquil · dos toques · bordes ·
dedup con fecha) está FIRMADA y verificada en sombra — la operativa
vive en el doc de A, no se re-firma acá.*

---

## §3 · LA PALABRA INGLESA PARA «AVISOS» (decisión abierta — la única de vocabulario)

El en vivo usa DOS: «notices» (todo el marco `avisos.*`) y «updates»
(`notifLey`, `waConsentTitulo`). **Propuesta D: unificar en
«updates»** — ya es la palabra de Preferencias y WhatsApp, y las
voces de A no chocan (nombran el hecho, no el objeto). Si se firma:

| key | en vivo | en propuesto |
|---|---|---|
| `avisos.titulo` | Notices | Updates |
| `avisos.vacio` | You don't have notices | You don't have updates |
| `avisos.errorCargar` | We couldn't load your notices. | We couldn't load your updates. |
| `avisos.sinVozTitulo` | Notice | Update |

---

## §4 · EL LOTE DEL CLIENTE (grupos A-F — literal vivo en `es.ts`/`en.ts`)

**A · El marco de la campana `avisos.*`** — titulo/vacio/errorCargar/
sinVozTitulo (arriba, con §1b y §3) + `noLeido` «Sin leer»/"Unread" ·
`momentoRecien` «Recién»/"Just now" · `momentoMin` «Hace {{n}} min» ·
`momentoHoras` «Hace {{n}} h» · `momentoAyer` «Ayer»/"Yesterday".

**B · Preferencias — la ley, las filas y los porqués:**
- `notifLey` «Elige por dónde te llegan los avisos. Algunos siempre
  llegan — eliges cómo.» / "Choose how updates reach you. Some always
  arrive — you choose how."
- Las 7 filas: «Tus citas y servicios» · «Cuidado y salud» · «La
  seguridad de tu cuenta» · «Lo que ya pagaste» · «Mensajes y
  respuestas» · «Resúmenes» · «Novedades y ofertas» (pares en vivos).
- Los 3 porqués — con §1b aplicado.
- `notifPorDonde` «Por dónde» / "How they reach you".

**C · Los ejemplos por fila `notifEj*` (6)** — firmados EN PANTALLA
(gate S88); acá se RATIFICAN en papel. Cada uno respaldado por tipos
vivos del catálogo (censo en el lote original): operación ·
salud/seguridad · seguridad de cuenta · lo pagado · relacional ·
comercial. «Resúmenes» sin key A PROPÓSITO (cero tipos vivos — la
fila no se dibuja; DERIVADA).

**D · Los canales** (enmienda firmada, ratificación): «En la app» ·
«En el teléfono» · «Por correo» · «WhatsApp» (marca).

**E · El permiso del sistema — `notifPermisoNegado`, par completo
propuesto (sin «push»):**
> **es:** «El teléfono tiene apagadas las notificaciones de
> e-PetPlace. Hasta que las actives en los ajustes del sistema, los
> avisos en el teléfono no pueden llegar.»
> **en:** "Your phone has notifications turned off for e-PetPlace.
> Until you turn them on in system settings, updates on your phone
> can't arrive." *("updates" sigue a §3; "notifications" de la
> primera frase nombra el ajuste del SISTEMA y se conserva.)*

**F · El consentimiento de WhatsApp (lámina §4 — sale de borrador con
esta firma):** «Avisos por WhatsApp» / "WhatsApp updates" · «Quiero
recibir avisos de e-PetPlace por WhatsApp en este número. Puedo
desactivarlo cuando quiera desde Preferencias.» / "I want to receive
e-PetPlace updates on WhatsApp at this number. I can turn this off
anytime in Preferences." · «Sí, quiero recibirlos» / "Yes, I want
them" · «Ahora no» / "Not now". *(Primera persona de quien acepta +
la salida adentro del texto — a propósito; opt-in D-436.)*

---

## §5 · LA PASADA — qué firma, en qué orden, qué queda vivo

**EN ORDEN (una lectura, una firma):**

- [ ] **1. Los reemplazos del acento** — §1a (5 voces del motor) +
  §1b (3 keys del cliente). *Lo viejo muere a la vista.*
- [ ] **2. Las tres voces de cita** — §2.
- [ ] **3. La palabra en** — §3 (updates/notices).
- [ ] **4. El lote del cliente** — §4 grupos A-F (E con su par
  completo; F sale de borrador).

**QUÉ HABILITA CADA FIRMA (y qué NO):**

- Firmar una voz de §2 ⇒ su tipo PUEDE salir de sombra — mirando la
  sombra del productor real (L-207); el primer envío real lleva el
  ojo del founder. **La firma no saca nada de sombra por sí sola.**
- §1a ⇒ **una migración de A** re-redacta las 5 en
  `_voz_notificacion`. §1b + §3 + §4 ⇒ **un commit de D** en los dos
  diccionarios (es+en juntos — `Espejo` lo exige) y las marcas de
  candidata mueren de los comentarios.

**QUÉ QUEDA VIVO AL CERRAR LA PASADA (no lo resuelve esta firma):**

- `plan_renovacion_fallida` — su voz nace CON la cura de D-669,
  jamás antes (firmado).
- Las 6 del prestador (`documento_*`/`prestador_*`) — esperan sus
  voces bilingües (D-539 pasos 1-2, lote propio); ninguna sale de
  sombra antes.
- La rama «autorización» del mapeo — bloqueada (el dato es de A).
- El ejemplo de «Resúmenes» — se escribe cuando nazca su primer
  tipo vivo.
- Los fixtures D-671 — **se retiran tras el último dedo del
  founder** (un solo DELETE, escrito en la deuda), no con esta firma.
- La lámina de push — la diseña la mesa con el founder sobre el mapa
  de destinos ya servido (S89-D orden 3).

**Origen: S89-D orden 4 · consolida 23d6e30 + b4b0cc8 + el lote de A
(`9a350e7`) · 6-ago-2026.**
