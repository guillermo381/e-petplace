# S111-D · EL DISEÑO DE LA MENSAJERÍA — publicado ANTES de construir

> **De:** pista D (territorio `packages/mensajeria`, nuevo).
> **Para:** todos — **A** implementa el motor, **B** viste, **C** monta.
> **Rama:** `pista/s111-d` · **base:** `main` `9443da56`.
> **Sello:** 1-sep-2026, medido contra `origin/main` en ese sha.
> **Asunto único:** el diseño. El contrato de DB va en su propio archivo.

---

## §0 · LA HERENCIA — no se re-mide, se cita

**S110-D ③** (`docs/loop/S110-D-LOTE2.md`, en `main`):

- **No existe canal entre dos cuentas.** La única tabla de mensajes de `public`
  es `ticket_mensajes` — soporte usuario↔admin, gateada por
  `tickets_soporte.user_id = auth.uid()`, **0 filas**. No sirve ni adaptada: su
  eje es el ticket, no el par de cuentas.
- **Cero wrappers, cero pantallas** (medido con control positivo y negativo).
- `PORTAL_PRESTADOR` §6.4.7 lo declara él mismo: *«**CN completa.** …Queda como
  **deuda explícita** para sesión técnica posterior»*.

**Y el dato que gobierna este diseño**, del mismo censo — §6.4.7, literal:

> *«**Activación con servicio.** Solo se activa cuando hay cita / servicio /
> contrato activo entre prestador y familia. **Sin servicio activo, no hay
> canal.**»*

---

## §1 · EL ANCLA: LA SOLICITUD — y por qué eso NO choca con §6.4.7

**Decisión recibida y adoptada: el canal cuelga de la SOLICITUD**, no de la
cita ni del usuario suelto.

🔑 **Y eso disuelve la contradicción que S110-D dejó abierta, en vez de
pelearla.** Yo la había parqueado como *«§6.4.7 excluye el caso de la adopción
porque refugio y adoptante no comparten servicio»*. **Con el ancla en la
solicitud la pregunta cambia: la solicitud ES el vínculo.** §6.4.7 gobierna el
**canal de servicio** —prestador↔familia, atado a una cita— y este es **otro
objeto**: publicador↔solicitante, atado a una solicitud, con su propio ciclo de
vida y su propia ley de privacidad.

⚠️ **Lo declaro así de explícito porque las dos cosas se parecen y se van a
confundir:** son **dos canales, no uno con dos motivos.** Meterlos en la misma
tabla con un campo `tipo` obliga a toda policy futura a preguntar «¿cuál de los
dos sos?» — y ese es el molde que la casa ya pagó caro. **Van separados.**

⇒ **Lo que S110-D-LOTE2 §③ dejó estacionado —«qué abre el canal cuando no hay
servicio»— queda RESUELTO para la adopción y SIGUE ABIERTO para el canal de
servicio.** El canal de servicio no es de esta sesión.

---

## §2 · LOS ESTADOS — `LETRA_ADOPCION` §5, firma ⑧

> *«**La conversación vive en la app**, con estados: recibida · en conversación
> · aceptada · declinada.»*

```
recibida ──► en_conversacion ──► aceptada
    │              │                 │
    └──────────────┴────────────► declinada
```

**Cuatro estados, ni uno más.** `aceptada` es la que dispara el final natural de
§5 (acta → transferencia del expediente → hito). **Ese arco NO es de este
módulo**: acá termina en `aceptada`; lo que sigue lo dispara el motor de A.

**Reglas del hilo, derivadas de los estados:**
- Se **escribe** en `recibida` y en `en_conversacion`.
- `aceptada` y `declinada` son **terminales**: el hilo se **lee siempre**, no se
  escribe más. *(Espeja §6.4.7 «queda accesible al historial» sin heredar su
  ventana, que es del canal de servicio.)*
- El **primer mensaje del publicador** mueve `recibida → en_conversacion`. No es
  un botón: es una consecuencia. *Un estado que alguien tiene que acordarse de
  mover es un estado que va a estar mal.*

---

## §3 · LA LEY DE PRIVACIDAD — la RLS nace de esta frase

> **§5, literal:** *«**Datos del solicitante:** solo los ve el publicador del
> animal solicitado. Jamás otro uso — ni marketing, ni scoring. **Ningún dato de
> un menor alimenta nada** (P5).»*

**Traducción exigible, y es el corazón del pedido a A:**

| quién | qué ve |
|---|---|
| **publicador del animal solicitado** | la solicitud entera + los mensajes del hilo |
| **el solicitante** | su propia solicitud + los mensajes del hilo |
| **otro publicador** (aunque sea del mismo refugio, si no publicó ESE animal) | **nada** |
| **cualquier otro** | **nada** |
| admin | según su gate, con audit |

🔴 **«El publicador del ANIMAL SOLICITADO» es más angosto que «el refugio».** La
frase firmada dice *del animal solicitado*, no *de la organización*. **Si la RLS
gatea por refugio en vez de por publicación, ensancha la audiencia por encima de
la letra** — y es exactamente la clase de ensanche silencioso que la casa ya
midió (S110-D ①: una policy que concede por vecindad y no por decisión).
**Va gateada por la publicación.**

⚠️ **Y su corolario que no está en la frase y hay que decidir:** ¿el publicador
conserva la vista después de `declinada`? *Voto: sí, en lectura, por
trazabilidad de disputa — pero es decisión y va estacionada.*

**Lo que NUNCA viaja en el hilo** (§6.4.7, que acá sí aplica porque es la misma
razón): teléfono, email, ni dato de contacto de ninguna de las dos partes. **El
canal existe para que no haga falta.**

---

## §4 · ADJUNTOS — propuesta declarada

**§5 no los nombra.** Lo que sí nombra el vertical: §5 pide *«avisos del
animal»* dentro de la solicitud y §6 pide **fotos del ahijado** para el padrino.

**Propuesta (voto de D):** **v1 con adjunto de IMAGEN, del lado del publicador
solamente.**
- **Por qué del publicador:** las fotos que el vertical promete son **del
  animal**, y quien las tiene es quien lo tiene. Un adjunto del solicitante no
  tiene caso de uso firmado.
- **Por qué sólo imagen:** un adjunto libre abre subida de documentos entre dos
  personas que no se conocen, y eso **arrastra decisiones de retención y de
  contenido que ninguna letra tomó** (`D-405` sigue abierta).
- **Fail-closed mientras no se firme:** el módulo modela el adjunto y **el
  contrato a A pide la columna, no el bucket.** Sin bucket, no hay subida —
  la puerta no existe en vez de existir abierta.

🅿️ **Estacionado con esta propuesta adentro.**

---

## §5 · EL RELOJ DE 5 DÍAS — es DATO del motor, no un cron nuevo

> **§5, literal:** *«**El silencio tiene reloj:** al postular, respuesta
> automática configurada; **si el refugio no responde en 5 días, e-PetPlace
> avisa a la familia que el refugio no respondió.** La promesa de no repetir el
> silencio de Instagram la cumple el refugio; cuando no la cumple, la verdad la
> decimos nosotros.»*

**Cómo se modela, y es lo que evita construir un reloj nuevo:**

- **El silencio es DERIVABLE, no un estado que alguien escribe:** una solicitud
  está en silencio si `estado = 'recibida'` **y** `now() - creada_en ≥ 5 días`
  **y** no hay ningún mensaje del publicador. **Tres datos que el motor ya va a
  tener.**
- ⇒ **el módulo expone la función pura que lo decide** (`estadoDeSilencio`), y
  **el barrido que la consume es de A**, con el patrón que la casa ya usa para
  lo perecedero: **evaluación perezosa + un tick que sólo despacha avisos.**
  *No hace falta un cron por solicitud.*
- **Los 5 días son FIRMA, no parámetro** — van como constante nombrada, con su
  cita. *(Distinto de la ventana de §6.4.7, que la letra declara «configurable»
  y por eso NO lleva default — `L-180`.)*
- **La respuesta automática al postular** es del publicador y es **texto suyo**:
  el módulo la trata como el primer mensaje del hilo con `automatica: true`,
  **y NO cuenta como respuesta** para el reloj. *Si contara, el reloj no sonaría
  nunca y la promesa de §5 sería letra muerta el día uno.*

---

## §6 · LAS NOTIFICACIONES — categorías del modelo, sin inventar ninguna

Leído `MODELO_NOTIFICACIONES` §3 + ENMIENDA S87 + §3bis. **El criterio firmado
para clasificar un tipo nuevo:** *«la categoría la decide de QUIÉN es el hecho
(la cuenta · el cuerpo de la mascota · el proceso contratado · otra persona ·
el negocio), jamás quién lo mira»*.

| aviso | categoría | audiencia | por qué |
|---|---|---|---|
| solicitud nueva → publicador | **`relacional`** | prestador | otra persona te escribió. §3 la define literal: *«mensajes, respuesta a una solicitud»* |
| mensaje nuevo en el hilo | **`relacional`** | ambas | ídem |
| respuesta del publicador (aceptada/declinada) | **`relacional`** | cliente | es la respuesta de una persona a otra |
| **«el refugio no respondió en 5 días»** | **`operacion`** | cliente | **no lo dice una persona: es el ESTADO de un proceso que la familia inició.** Precedente exacto: S87 mandó `documento_aprobado`/`prestador_aprobado` a `operacion` con esa misma razón |
| padrinazgo: **ahijado adoptado** | **`relacional`** | cliente | §6 lo firma con su texto; es novedad de otra parte |
| padrinazgo: **refugio se va** | **`operacion`** | cliente | estado del proceso, no mensaje de nadie |
| padrinazgo: **ahijado fallece** | 🅿️ **ESTACIONADO** | — | ver §7 |

⚠️ **`notificaciones.tipo` tiene CHECK CERRADO de 26 valores** (medido S87) ⇒
**cada tipo nuevo es migración de A**, y va nombrado en el contrato de DB.
**`cat_notificacion_tipos` necesita su fila con `audiencia`** (S88 §3bis) — y
declaro cuáles de las mías son **MEDIDAS** (el productor dice a quién le llega)
y cuáles **RAZONADAS**: **todas las de arriba son RAZONADAS**, porque su
productor no existe todavía. *Un catálogo que no distingue lo medido de lo
supuesto invita a tratar todo como medido.*

**Digest:** **no lo pido para v1.** §8 lo justifica por volumen y acá el volumen
es de una conversación entre dos personas. *Pedirlo ahora sería construir contra
un problema que no tengo medido.*

**Silencios:** el memorial apaga (`MODELO_LOYALTY` §7.1 / §5.1 del modelo de
notificaciones). **Lo respeto por construcción: ningún aviso de este vertical se
emite sobre una mascota en memorial** — salvo el caso estacionado de §7, que es
justamente sobre eso.

---

## §7 · 🅿️ LO ESTACIONADO — decisiones de producto que NO invento

### ① El aviso al padrino cuando el ahijado FALLECE

**Qué falta:** §6 firma que *«si el ahijado es adoptado, fallece o el refugio se
va… el padrino recibe correo y aviso en la app»*, **y da el texto sólo para
«adoptado»**. Para *fallece*, choca con una firma anterior: **S88 firmó que la
liberación por memorial CALLA** (`_trg_mascotas_memorial_planes` lo dice en su
propio body: *«el memorial calla, también acá… lo que muere es el AVISO»*).

**(a)** El padrino recibe aviso también en fallecimiento — el silencio de S88 es
para **la familia**, y el padrino es un tercero que **está pagando** y merece
saber por qué se detuvo.
**(b)** El padrino NO recibe aviso en fallecimiento; sólo ve que su recurrencia
se detuvo, sin causa.

**Voto de D: (a)**, con la voz del duelo y sin invitación a apadrinar otro en el
mismo mensaje. *La razón del silencio de S88 es no hablarle de plata a una
familia en duelo; el padrino no es esa familia, y un cobro que se detiene sin
explicación es peor que la noticia.* **Pero es firma del founder, no mía.**

**Construido alrededor, fail-closed:** el módulo enumera las tres causas
(`adoptado · fallecido · refugio_inactivo`) y **`fallecido` queda marcada como
`avisa: false`** hasta la firma. La causa existe, el aviso no sale.

### ② ¿El publicador conserva la vista del hilo tras `declinada`?
**(a)** sí, en lectura (trazabilidad de disputa) · **(b)** no.
**Voto: (a).** **Fail-closed:** el módulo lo expone como parámetro explícito, sin
default.

### ③ Adjuntos (§4). **Voto: imagen, sólo publicador.** **Fail-closed:** sin
bucket pedido, la puerta no existe.

---

## §8 · EL REPARTO — qué hace cada pista

| pista | qué le toca | de dónde sale |
|---|---|---|
| **A** | tablas, RPC, RLS, tipos de notificación, el barrido del reloj | `S111-D-para-A-CONTRATO-DB.md` (autocontenido) |
| **D** | `packages/mensajeria`: la ley del canal, los estados, el reloj, la privacidad — **puro, sin Supabase y sin UI** | este diseño |
| **B** | las piezas del hilo (burbuja, composer, estado del hilo) | cuando D publique los tipos |
| **C** | montar la conversación en las dos apps | ídem |

**Qué NO hace D:** no escribe DB (es de A), no escribe UI (B), no monta
pantallas (C). **Y no decide ninguna de las tres de §7.**
