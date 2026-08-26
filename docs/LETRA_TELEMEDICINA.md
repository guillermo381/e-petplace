# LETRA_TELEMEDICINA.md — e-PetPlace

> **Versión:** **v1.1** · **Nace:** 25-ago-2026 (mesa founder + arquitecto) ·
> **Enmendada:** 25-ago-2026 (**Checkpoint 1 de S106**, firma del founder) en
> **§3** (tuteo + línea de tránsito) · **§4** (camino de la plata + el
> profesional que no asiste) · **§5** (camino de la plata) · **§7** (la marca
> por D13.6 + la cita del aviso de IA, que era `§14` y es **`§31`**) · **§9**
> (la receta entra partida en dos) · y la **adjudicación del FRENO DE
> DEPÓSITO** al pie. **La letra vieja se tacha, no se borra.**
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
> notas que tu mascota está en riesgo —dificultad para respirar, sangrado,
> convulsiones, golpe fuerte, dolor intenso o decaimiento repentino—
> llévala a una clínica ahora mismo.
>
> La videollamada no se graba y se transmite a través de la infraestructura
> de nuestro proveedor de video.
>
> [ Ir a urgencias ] · [ Reservar cita presencial ] · [ Continuar con la
> videoconsulta ]

🔴 **Los signos concretos no son decoración.** Decir «si creés que está en
riesgo» le pide al dueño un juicio clínico que no tiene; nombrar cinco
signos le da un criterio. *No se resume, no se acorta, no se convierte en
una línea de letra chica.*

> ### ✅ ENMIENDA — firma founder CP1 S106, 25-ago-2026
>
> **① La conjugación pasa a TUTEO NEUTRO, sin tocar el contenido.** La v1.0
> decía ~~«Si **notás** que tu mascota está en riesgo … **llevala** a una
> clínica»~~; ahora dice **«notas»** y **«llévala»**. *Los cinco signos y
> las tres acciones quedan intactos* — la prohibición de §3 es contra
> resumir y acortar, no contra hablar la voz de la casa (tuteo neutro,
> decisión founder S51; la familia `R66` vigila el voseo con baseline 0).
>
> **② Nace la línea de tránsito**, marcada **⚠️ PROVISIONAL**: *«La
> videollamada no se graba y se transmite a través de la infraestructura de
> nuestro proveedor de video.»* Rige **hasta la respuesta del abogado a la
> pregunta 4 de §10** (LOPDP), que puede exigir nombrar al proveedor, su
> país o la base de licitud. *Se escribe hoy porque decir de menos sobre a
> dónde viaja la imagen de una familia es peor que decirlo provisional.*

## §4 · EL COBRO — se cobra el criterio, no el tiempo

*(Firma ① del founder, 25-ago-2026.)*

- La consulta **se cobra aunque dure veinte segundos** y **aunque el dueño
  no asista**. Si el veterinario entra y determina que el caso necesita
  atención presencial, eso **es** el servicio prestado.
- 🔴 **Y hay una razón P11, no solo comercial:** si la consulta corta no se
  cobrara, el veterinario tendría un incentivo económico para estirarla —
  y ahí el beneficio empezó a distorsionar la decisión clínica.
- **Cancelación sin penalidad hasta 30 minutos antes.**
- ~~Si la consulta se pagó con anticipación y se cancela en ventana, **la
  plata vuelve como saldo** (`LETRA_SALDO` §3 — ⚠️ **esta letra agrega una
  fuente al catálogo cerrado de §3 y hay que anotarla ahí**).~~
  **DEROGADO — ver la enmienda del camino de la plata, abajo.**

### ✅ ENMIENDA · EL CAMINO DE LA PLATA — firma founder CP1 S106, 25-ago-2026

**La plata vuelve AL MEDIO DE PAGO, gestionada por soporte.** No vuelve como
saldo, y la razón es que **el saldo no existe**: medido contra la base en el
turno ⓪ de S106 — cero tablas, cero funciones. *`LETRA_SALDO` fija un
contrato cuyo motor todavía no nació; prometer sobre él sería prometer sobre
nada.*

Rige, en este orden:

1. **Soporte gestiona la devolución al medio de pago original**, manual y
   declarada — que es exactamente lo que `LETRA_PAGO_CITAS` §5 **firma ②**
   del founder ya mandaba para la cita clínica mientras `P22` no tenga
   letra. *Las dos letras dejan de contradecirse sin que ninguna ceda: la
   de pagos ya decía la verdad.*
2. **El reverso automático corre SOLO si la cancelación cae además dentro de
   la ventana del riel** — Nuvei **mismo día**, DeUna **24 h**. Fuera de esa
   ventana el reverso por API no existe y el camino es el trámite bancario.
3. **La voz al dueño promete «a tu medio de pago» con plazo honesto, y
   JAMÁS «al instante».** *Un plazo que depende del banco no se promete en
   una pantalla que no lo conoce.*

⚠️ **El motor de saldo no se improvisa acá: nace con su ficha** (depositada
en `DEUDAS_CANONICAS` por este mismo acto). El día que exista, la enmienda a
`LETRA_SALDO` §3 se escribe entonces — no antes.

### ✅ ENMIENDA · EL PROFESIONAL QUE NO ASISTE — firma founder CP1 S106, 25-ago-2026

§4 cobra la consulta corta y cobra la ausencia **del dueño**. Faltaba el
caso simétrico y se firma acá: **si el que no asiste es el VETERINARIO, el
dueño no paga.** Mismo camino que la consulta no realizable de §5 —
registro legible para soporte y devolución al medio de pago.

*No es simetría por elegancia: sin esta línea, el cobro por criterio de §4
se leería como que el criterio se cobra aunque nadie lo haya ejercido.*

## §5 · LA CONSULTA QUE SE CORTA

*(Firma ② del founder, 25-ago-2026.)*

Si la videollamada falla y la consulta no puede completarse, **el
veterinario la marca como no realizable y ~~la plata vuelve como saldo~~
**la plata vuelve al medio de pago, gestionada por soporte** — mismo camino
que la cancelación anticipada.

> ✅ **ENMIENDA — firma founder CP1 S106, 25-ago-2026.** Misma razón que en
> §4: el motor de saldo no existe. **El sistema REGISTRA el caso en forma
> legible para soporte; no promete la devolución por sí mismo.** *Un motor
> que promete lo que no puede ejecutar produce un reclamo, no una
> devolución.*

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

⚠️ El aviso de IA de ~~T&C §14~~ **T&C §31** rige sin cambios: la
estructuración de la nota clínica no es diagnóstico.

> ✅ **ENMIENDA — firma founder CP1 S106, 25-ago-2026.**
>
> **① La cita estaba mal y se corrige: el aviso de IA es `§31 ·
> Funcionalidades asistidas por inteligencia artificial`, no `§14`, que es
> «Comisión: tasa y base de cálculo».** Medido contra el documento en el
> turno ⓪. La frase que esta letra parafrasea es literal de **§31.3**:
> *«no constituye diagnóstico, prescripción ni criterio clínico»*.
>
> **⓪ 🔴 LA TELECONSULTA NO SE GRABA EN v1** — ni por la plataforma ni por el
> proveedor. `roomRecord` queda en **`false`**, explícito en la edge function
> del token (D lo dejó escrito, no heredado del default). *Un default que
> hoy es `false` puede cambiar con una versión del SDK; una línea que dice
> `false` no.*
>
> ⚠️ **Y por eso la estructura heredada `cita_telemedicina_detalle` no se
> «completa»: se MATA.** Trae `grabacion_url` y `grabacion_consentida`, que
> contradicen esta firma — *una columna que existe invita a llenarse.*
>
> **② CÓMO se resuelve la marca, firmado: por `BIO_EXPEDIENTE` D13.6.** El
> padre es **la propia cita**, con `modalidad='telemedicina'` —
> **no nace evento separado y NO hay columna nueva en los eventos**. Los
> lectores derivan la marca de la cita. *La letra canónica ya lo había
> decidido; acá se declara para que nadie construya la columna que no hace
> falta.*

## §8 · LA HABILITACIÓN

El veterinario **prende el servicio** y al hacerlo acepta los mínimos de
§6. Rige además la habilitación profesional de T&C §7, sin excepción.

## §9 · LO QUE NO ENTRA EN v1

Verificación técnica de red o hardware · consulta asíncrona · ~~receta a
distancia (hasta que el abogado se pronuncie)~~ **ver la enmienda de abajo:
la PRESCRIPCIÓN entra; la EMISIÓN del documento REV no** · el incentivo con
IA para evaluar criticidad (v2) · el transporte de video, que **es módulo
nativo y no viaja por OTA** — su tren de build lo decide la mesa.

### ✅ ENMIENDA · LA RECETA — firma founder CP1 S106, 25-ago-2026

**La condición de la exclusión se cumplió: el abogado se pronunció** (su
documento vive VERBATIM en `docs/legal/2026-08-25-receta-videoconsulta.md`).
La exclusión se levanta **partida en dos**, porque son dos cosas distintas y
la v1.0 las trataba como una:

**① ENTRA en v1 — la PRESCRIPCIÓN como registrable del Durante heredado.**
El veterinario prescribe en videoconsulta igual que en consulta presencial,
sobre el mismo `evento_medicacion_prescrita` que ya existe. **Cobertura
firmada: producto de venta libre.** Respaldo legal: **REV telemática,
Resolución AGROCALIDAD 0227/2024 (Anexo 9)** + **Ley 67, Arts. 2 y 14**
(la firma electrónica vale como la manuscrita).

**② NO ENTRA en v1 — la EMISIÓN del documento REV con firma electrónica
(FirmaEC).** Es fase propia, con su ficha. Arrastra: la generación del
documento, la FirmaEC **de cada veterinario**, el **diagnóstico obligatorio**
en el formato, y la decisión sobre antibióticos que el founder firma al
abrirla.

**③ El BLOQUEO DE SUSTANCIAS FISCALIZADAS se construye CON la fase ②, con su
catálogo real.** Medido en el turno ⓪: hoy **no hay catálogo, no hay CHECK, y
`principio_activo` está vacío en 4 de 4 filas vivas** ⇒ un guard construido
hoy **daría verde siempre**. *Un requisito que suena serio y no filtra nada
es exactamente lo que §6 de esta letra enseñó a no escribir.* Su ficha lleva
las fuentes oficiales y las cuatro reglas del abogado.

⚠️ **Y una consecuencia que vale más que el caso**, del mismo documento
legal: **la plataforma JAMÁS sugiere medicamentos, tratamientos ni
posologías.** Si una función de IA lo hiciera, *la responsabilidad clínica
migra a la plataforma*. Va como **ley de la casa** (candidata a firma, ficha
depositada) y **toda feature futura se contrasta contra ella — incluido el
«incentivo con IA para evaluar criticidad» que esta misma §9 difiere a v2.**

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

---

## ✅ ADJUDICACIÓN DEL FRENO — firma founder CP1 S106, 25-ago-2026

**El freno se resolvió, y NO por donde pedía.** Pedía enmendar `LETRA_SALDO`
§3; la mesa hizo otra cosa, y la razón la trajo la medición del turno ⓪:

> ### **El motor de saldo NO EXISTE — cero tablas, cero funciones en la base.**

⇒ **`LETRA_SALDO` §3 NO se enmienda hoy.** No se le agregan fuentes a un
catálogo cuyo motor no nació: *sería escribir la letra fina de una puerta que
todavía no tiene pared.*

**Lo que rige en su lugar:** la enmienda del camino de la plata en **§4** y
**§5** — la devolución va **al medio de pago, por soporte**, alineada con
`LETRA_PAGO_CITAS` §5 **firma ②**. **Con eso el cruce deja de existir**: esta
letra ya no reclama ninguna fuente de saldo, así que no contradice la lista
cerrada de §3.

🔴 **Y la enmienda que este freno pedía queda SIN OBJETO, no pendiente:** al
no reclamar ninguna fuente de saldo, esta letra **no agrega nada** a la lista
cerrada de §3. **`LETRA_SALDO` §3 NO SE TOCA en S106.** *Enmendar una lista
ajena por un choque ya cerrado es trabajo que ensucia* — dejaría en el canon
una distinción presencial/teleconsulta sobre fuentes que este oficio dejó de
usar. El día que nazca el motor de saldo (`D-926`), esa letra decidirá sus
fuentes con los casos que existan entonces.

⚠️ **Y el freno destapó algo que él mismo no había visto, y conviene que
quede:** las ventanas firmadas eran **TRES**, no dos — falta **T&C §25.1
(24 h, publicado el 24-ago-2026)**, con §25.2 (reagenda 2 h) y §26.1
(«no asistida» bajo 2 h). *La banda entre 30 min y 24 h tenía dos respuestas
opuestas, las dos firmadas.* Con esta enmienda la teleconsulta ya no promete
reembolso automático en esa banda: **promete registro y trámite**, que es lo
que el T&C y el motor pueden sostener a la vez.

## Lo que se verificó y NO choca *(para que nadie lo re-audite)*

- **§2 · comisión 10 %** — idéntica al resto de los oficios.
- **§9 · el video es módulo nativo y no viaja por OTA** — coincide con lo medido
  por B: **cero webrtc/livekit/daily/agora/twilio/jitsi en todo el monorepo**;
  `ClipSesion` reproduce un archivo grabado y no es transporte.
- **§7 · el aviso de IA de T&C §14** — se cita sin enmendarlo.
