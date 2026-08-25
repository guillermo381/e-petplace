# LETRA_TELEMEDICINA.md — e-PetPlace

> **Versión:** v1.0 · **Nace:** 25-ago-2026 (mesa founder + arquitecto).
> **Fuentes que obedece:** el repo y su bitácora · `LETRA_PAGO_CITAS` (el
> motor de citas rige entero) · `POLITICAS_EPETPLACE` (P11) · `LETRA_SALDO`
> · `MODELO_FINANCIERO` · T&C §7 y §14. **Si esta letra contradice a
> cualquiera, gana la fuente.**
> **Qué fija:** el contrato del quinto oficio. **Qué no fija:** nada del
> motor de citas ni del de pagos, que ya están escritos y probados.

## §1 · QUÉ ES, Y POR QUÉ NO ES UN OFICIO NUEVO PARA EL MOTOR

Una teleconsulta es **una cita con hora agendada** — no una consulta
asíncrona. Por eso hereda el motor entero sin excepción: las 12 compuertas
de la reserva, el hold de agenda, el desglose congelado, el cobro al
reservar, y la confirmación por el motor y jamás por declaración propia.

*La única diferencia con una consulta presencial es que ocurre a través de
una pantalla.* Todo lo demás del oficio ya está construido.

## §2 · EL PRECIO Y LA COMISIÓN

**El precio lo fija el veterinario**, como en los otros cuatro oficios. La
comisión de e-PetPlace es del **10%**, idéntica al resto. *(Firma del
founder, 25-ago-2026.)*

## §3 · EL AVISO PREVIO — se muestra antes de confirmar, siempre

Antes de que el dueño confirme una teleconsulta, la app le muestra:

> **Antes de continuar**
>
> Las consultas por videollamada sirven para orientación, seguimiento y
> casos que el veterinario pueda evaluar viendo a tu mascota por pantalla.
>
> **No reemplazan una atención presencial ni sirven para emergencias.** Si
> notás que tu mascota está en riesgo —dificultad para respirar, sangrado,
> convulsiones, golpe fuerte, dolor intenso o decaimiento repentino—
> llevala a una clínica ahora mismo.
>
> [ Ir a urgencias ] · [ Reservar cita presencial ] · [ Continuar con la
> videoconsulta ]

🔴 **Los signos concretos no son decoración.** Decir «si creés que está en
riesgo» le pide al dueño un juicio clínico que no tiene; nombrar cinco
signos le da un criterio. *No se resume, no se acorta, no se convierte en
una línea de letra chica.*

## §4 · EL COBRO — se cobra el criterio, no el tiempo

*(Firma ① del founder, 25-ago-2026.)*

- La consulta **se cobra aunque dure veinte segundos** y **aunque el dueño
  no asista**. Si el veterinario entra y determina que el caso necesita
  atención presencial, eso **es** el servicio prestado.
- 🔴 **Y hay una razón P11, no solo comercial:** si la consulta corta no se
  cobrara, el veterinario tendría un incentivo económico para estirarla —
  y ahí el beneficio empezó a distorsionar la decisión clínica.
- **Cancelación sin penalidad hasta 30 minutos antes.**
- Si la consulta se pagó con anticipación y se cancela en ventana, **la
  plata vuelve como saldo** (`LETRA_SALDO` §3 — ⚠️ **esta letra agrega una
  fuente al catálogo cerrado de §3 y hay que anotarla ahí**).

## §5 · LA CONSULTA QUE SE CORTA

*(Firma ② del founder, 25-ago-2026.)*

Si la videollamada falla y la consulta no puede completarse, **el
veterinario la marca como no realizable y la plata vuelve como saldo** —
mismo camino que la cancelación anticipada.

🔴 **No se investiga de quién fue la culpa, y es deliberado:** el sistema no
mide la calidad de la conexión de nadie, así que no puede atribuirla.
Averiguarlo costaría más que el servicio. *Un proceso de disputa sobre un
hecho que nadie registró produce una resolución arbitraria con apariencia
de justicia.*

## §6 · LOS REQUISITOS MÍNIMOS — declarados, jamás verificados

*(Firma ③ del founder, 25-ago-2026.)* El profesional los acepta al
habilitar el servicio. **El sistema no los mide**, y la letra lo dice en
vez de prometerlo.

- **Conexión:** 1,5 Mbps de subida sostenida.
- **Cámara:** la del teléfono. **No se exige resolución mínima** — es un
  requisito que suena serio y no filtra nada.
- **Iluminación:** ambiente bien iluminado. *Un animal mal iluminado no se
  puede evaluar por más megapíxeles que tenga la cámara.*
- **Audio:** auriculares recomendados, no exigidos.

🔴 **Lo que NO se exige, y es decisión de contexto:** computadora, cámara
externa, conexión cableada, velocidad de bajada. *Todo eso es ideal de
manual y en Ecuador deja el catálogo sin veterinarios.*

## §7 · EL EXPEDIENTE — mismo registro, con su marca visible

La teleconsulta **deposita en la historia clínica y en el Bio-Expediente
exactamente igual que una consulta presencial**, y lleva la marca de haber
sido atendida por teleconsulta. *(Firma ④ del founder.)*

🔴 **La marca es VISIBLE para el dueño**, en la historia y en el expediente.
*Dentro de tres años alguien va a leer ese expediente para decidir algo, y
«evaluado por pantalla» cambia cómo se lee.*

⚠️ El aviso de IA de T&C §14 rige sin cambios: la estructuración de la nota
clínica no es diagnóstico.

## §8 · LA HABILITACIÓN

El veterinario **prende el servicio** y al hacerlo acepta los mínimos de
§6. Rige además la habilitación profesional de T&C §7, sin excepción.

## §9 · LO QUE NO ENTRA EN v1

Verificación técnica de red o hardware · consulta asíncrona · receta a
distancia (hasta que el abogado se pronuncie) · el incentivo con IA para
evaluar criticidad (v2) · el transporte de video, que **es módulo nativo y
no viaja por OTA** — su tren de build lo decide la mesa.

## §10 · AL ABOGADO, ANTES DE QUE LLEGUE A UNA PANTALLA

1. ¿Puede un veterinario recetar en una teleconsulta en Ecuador, y con qué
   límites?
2. ¿El aviso de §3 alcanza como deslinde, o hace falta consentimiento
   expreso registrado?
3. ¿La marca de teleconsulta en la historia clínica tiene efecto legal
   distinto al de una consulta presencial?

---
---

# 🔴 FRENO DE DEPÓSITO — *(nota de A, 25-ago-2026; NO es parte de la letra)*

> **La letra se depositó VERBATIM, sin editar una coma.** Esta nota va aparte
> porque el founder ordenó *«si algo contradice fuente firmada, frená y
> avisá»*, y **hay un choque medido contra `LETRA_SALDO` §3.**

**`LETRA_SALDO` §3 es una LISTA CERRADA**, y lo dice con esas palabras:
*«De dónde nace (fuentes v1, **lista cerrada**)»* … **«Ninguna otra fuente en
v1.»** Sus cuatro fuentes son: cancelación de pedido antes de «preparado» ·
pedido no entregado · **cancelación de cita en ventana (≥24 h)** · ajuste a
favor resuelto por soporte.

**Esta letra agrega DOS fuentes, no una:**

| | de dónde | dónde lo dice |
|---|---|---|
| ① | cancelación de teleconsulta en ventana | §4 |
| ② | **la consulta que se corta** (marcada no realizable) | §5 |

**La ① la declara la propia letra** y pide anotarla en `LETRA_SALDO` — eso es
una enmienda pendiente, no un conflicto oculto. **La ② no está declarada**, y
es una fuente de naturaleza distinta: *no es una cancelación, es un servicio
que no se pudo prestar.*

## 🔴 Y el choque más filoso NO es cuántas fuentes son: es LA VENTANA

**`LETRA_SALDO` §3 dice `≥24 h` para «cancelación de cita».** **§4 de esta
letra dice `30 minutos`.** **Una teleconsulta ES una cita** — lo afirma §1 de
esta misma letra, y de ahí saca el derecho a heredar el motor entero.

> ### **El mismo objeto tiene dos ventanas de cancelación según qué documento se lea, y ninguno de los dos declara al otro.**
> *No es un descuido de redacción: `≥24 h` protege la agenda de un profesional
> que reservó un espacio físico, y `30 min` reconoce que una videollamada no
> inmoviliza nada. **Las dos razones son buenas.** Lo que falta es decir que
> son dos casos y no uno.*

**Lo que NO se hizo, a propósito:** no se tocó `LETRA_SALDO`, no se eligió una
ventana, y no se «armonizó» nada. *La letra de esta mesa no puede enmendar sola
una lista que otra letra declaró cerrada — eso lo firma la mesa.*

⇒ **Lo que hace falta, y es una firma corta:** enmendar `LETRA_SALDO` §3 para
que sus fuentes de cita distingan **presencial (≥24 h)** de **teleconsulta
(30 min)**, y para que **la consulta no realizable** entre como fuente propia.
**Hasta entonces, esta letra rige en todo salvo su cruce con §3**, donde gana
la fuente — como su propio encabezado ordena.

## Lo que se verificó y NO choca *(para que nadie lo re-audite)*

- **§2 · comisión 10 %** — idéntica al resto de los oficios.
- **§9 · el video es módulo nativo y no viaja por OTA** — coincide con lo medido
  por B: **cero webrtc/livekit/daily/agora/twilio/jitsi en todo el monorepo**;
  `ClipSesion` reproduce un archivo grabado y no es transporte.
- **§7 · el aviso de IA de T&C §14** — se cita sin enmendarlo.
