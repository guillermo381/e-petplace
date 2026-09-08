# DIRECCIÓN · LA POSTVENTA — «algo salió distinto»

> **Mesa founder + arquitecto, 7-sep-2026 (S114).** A la deposita en `docs/DIRECCION_POSTVENTA.md`.
> Rige para las DOS apps (familia y Negocios) y para el asiento de la casa. Escrita en voz del
> founder: **es lo que él va a juzgar en el aparato.** Lo que está acá manda; lo que no está lo
> decide la pista leyendo la skill del sistema de diseño, y lo declara.
> Obedece `DIRECCION_ARTE`, `DIRECCION_DISENO_S99` (N11 campo de escritura · N15 el movimiento se
> calla · N16 rendimiento con número · N21 superficies · N22 la «i» · N23 el color marca clase ·
> N24 el control no cambia el tamaño de lo que lo contiene), `DIRECCION_CHAT_ADOPCION` §2 (el chat
> de la casa se comporta así, sin excepción) y `MODELO_LOYALTY` §7 (memorial apaga todo).
> **Gemela:** `LETRA_POSTVENTA.md` — el motor. Se leen juntas.
>
> ### 📌 ENMIENDA (B, 7-sep-2026) — **§4 · los tiempos declarados van en color de CUERPO**
> `text.tertiary` da **2,11 en claro y 3,22 en oscuro** contra un piso de 4,5, y el gate lo tumbó.
> **El daño no era de accesibilidad: era la simetría de §4 rompiéndose por el lado que nadie mira** —
> el tiempo del banco es la frase larga, y atenuarla esconde justo el dato que esta dirección puso
> ahí para que la opción lenta no quede escondida. *La letra vieja queda en §4 y la enmienda va
> debajo, para que se lea qué se firmó y qué se corrigió.*

---

## §0 · La frase contra la que se mide todo

**Una familia que ya pagó tiene a dónde ir cuando algo sale distinto, en el mismo lugar donde está
lo que pagó — y no tiene que pelear por lo que la letra ya le prometió.**

Cada elemento que se agregue tiene que ganarse su lugar contra esa frase.

---

## §1 · LA PUERTA — desde el objeto, jamás desde un formulario suelto

«Abro el paseo de Thor del martes. Abajo del todo, después de las fotos y del parte, hay una línea
discreta: **"¿Algo salió distinto?"**. No es un botón de alarma ni está en rojo — es una puerta
que está ahí por si la necesito, no un reproche al paseador.»

- **Vive en el detalle del objeto:** la cita, la estadía y el pedido. **Nunca en el Hogar, nunca en
  la campana, nunca como tab.** Un caso sin objeto no existe.
- **Es la última fila de la pantalla**, después de todo lo que cuenta cómo fue el servicio. *Lo
  primero que ve la familia es lo que pasó; el reclamo es la salida, no la entrada.*
- **Fuera de la ventana de 7 días** la línea cambia de voz sin desaparecer: *«Este servicio ya pasó
  su ventana. Si querés, hablá con nosotros.»* → abre conversación con la casa, sin caso.
- **Con la mascota en memorial no hay línea.** Nada. *(Ley de la casa: en memorial la app no pide
  nada.)*
- **Si ya hay un caso abierto sobre ese objeto**, la línea dice el estado y lleva al caso:
  *«Tenés un caso abierto sobre este paseo · Con el paseador»*.

---

## §2 · CONTAR QUÉ PASÓ — dos toques, y si querés, tus palabras

«Toco y me pregunta **qué pasó**, con una lista corta y en mi idioma: *"No vino"*, *"Me cobraron
una ausencia que no fue"*, *"El servicio no fue como esperaba"*, *"Mi mascota volvió mal"*. Elijo
uno. Si quiero, abajo cuento con mis palabras o hablando; si no quiero, no cuento nada y sigo.»

- **Los motivos son del catálogo y se leen en una pantalla, sin scroll interno.** Cada uno con su
  glifo y su frase en tuteo. **Sin "Otro" al final de la lista**: si ninguno encaja, el último dice
  *«Es otra cosa · contame»* y abre el campo. *«Otro» es un cajón donde va a parar todo lo que no
  supimos nombrar; «contame» es una invitación.*
- **El campo de contar es N11**, crece hasta cinco líneas, con dictado. Placeholder: *«Contame qué
  pasó, con tus palabras»*.
- **Si conté algo, la casa me devuelve lo que entendió antes de crear el caso**: una tarjeta con
  *«Entendí: el paseador llegó 40 minutos tarde. ¿Está bien?»* y dos botones: **Sí, es eso** ·
  **No, corregilo** (vuelve al campo con mi texto intacto). **Nada se crea sin mi sí.**
- **Si el motivo pide una foto**, se pide acá y **se puede saltar**: *«Si tenés una foto, ayuda.
  Si no, seguimos igual.»* Una foto no es un requisito para reclamar.
- **Nada de esto pasa si el motor ya sabe que el servicio no ocurrió**: ahí el segundo paso no es
  contar, es elegir (§4).

---

## §3 · LA PANTALLA DEL CASO — la escalera de la casa y el hilo de la casa

«Arriba veo **en qué paso estoy** y **de qué servicio hablamos**. Abajo, la conversación. Es la
misma escalera del pedido de la despensa y el mismo chat de la adopción — no aprendo nada nuevo.»

### 3.1 La escalera
**La pieza del seguimiento de pedidos, reusada.** Etapas: **Recibido → Con el prestador → Con
e-PetPlace → Resuelto → Cerrado.** La etapa actual en el color primario, las pasadas marcadas, las
que faltan atenuadas. Debajo, **una sola línea**: *«Estás en: Con el paseador · responde antes del
jueves a las 14:00»*.

- **Finales alternos** (no son etapas: reemplazan la línea de abajo con una etiqueta de clase):
  *Resuelto entre ustedes* · *Lo retiraste* · *Sin lugar · 12 sep*.
- **Colapsable**, igual que en adopción: abierta muestra la fila, colapsada sólo la línea. **Se
  colapsa sola cuando empiezo a escribir.**
- **Nada magenta, nada fuera de paleta, un glifo por etapa, sin texto adentro.**
- **Si el caso se resolvió solo** (falla del prestador medida), la escalera **nace en Resuelto** y
  lo único que falta es que yo elija cómo me devuelven.

### 3.2 La cabecera
El **objeto** con su foto chica, su nombre y su fecha (*«Paseo de Thor · martes 9, 16:00»*) y la
**contraparte** con su cara y su nombre. Toco el objeto y voy a su detalle; toco al prestador y voy
a su vitrina. **La cabecera nunca dice el monto**: la plata se habla en su carta, no en el título.

### 3.3 El hilo
**Es el chat de la casa** (`DIRECCION_CHAT_ADOPCION` §2, entero: teclado que no tapa, agrupado por
remitente, separadores de día, envío optimista, «No se envió · Reintentar», sin leído, sin «está
escribiendo», sin adjuntos, sin reacciones). Lo único distinto:

- **Tres asientos.** Los míos a la derecha; el prestador y la casa a la izquierda, **cada uno con
  su cara y su nombre** — *«e-PetPlace»* con el logo, el paseador con su foto. El color marca **de
  quién es**, jamás importancia (N23).
- **Los hechos del trámite van centrados, como etiqueta:** *«El paseador respondió»* · *«e-PetPlace
  tomó el caso»* · *«Se resolvió: devolución al banco»* · *«Tu saldo ya está disponible»*.
- **Si el hecho pide algo mío, debajo va la carta con su botón** — y es UNA carta a la vez.
- **El primer mensaje lo escribe la casa cuando abro el caso.** No hay hilo vacío.
- **Cuando el caso se cierra**, la barra de escribir se reemplaza por una línea en el mismo lugar:
  *«Esta conversación quedó en lectura · Resuelto»*. Sigo pudiendo leer todo.

### 3.4 «Quiero hablar con alguien»
**En todas las pantallas del caso, siempre alcanzable, jamás escondido en un menú.** Es una línea
discreta al pie: *«¿Preferís que te atienda una persona?»*. Un toque y la casa entra al hilo.
*Nada de lo que hace la máquina puede tapar esa puerta.*

---

## §4 · LA PLATA — dos opciones parejas, y la honestidad como diseño

«Cuando hay plata para devolver, me muestran **dos tarjetas del mismo tamaño**, una al lado de la
otra, y **ninguna está preseleccionada**.»

| | **A tu banco** | **Saldo en e-PetPlace** |
|---|---|---|
| voz | *«Vuelve a la tarjeta con la que pagaste.»* | *«Queda en tu cuenta para usar cuando quieras.»* |
| tiempo, dicho | *«Depende de tu banco: en promedio 15 días hábiles.»* | *«Disponible en segundos.»* |

- **Las dos parejas, con sus tiempos declarados.** La rapidez del saldo **se informa, jamás se usa
  para esconder la opción del banco.** Cero default oscuro, cero botón más grande, cero «recomendado».
- 🔴 **ENMIENDA (B, 7-sep — medida, no supuesta): los tiempos declarados van en color de texto de
  cuerpo, jamás atenuado.** El gate tumbó `text.tertiary` con 2,11 en claro y 3,22 en oscuro contra
  un piso de 4,5, **y el daño no era de accesibilidad: era la simetría de este § rompiéndose por el
  lado que nadie mira.** El tiempo del banco es la frase larga; atenuarla deja menos legible justo
  el dato que esta letra puso ahí para que la opción lenta no quede escondida. *Un dark pattern no
  necesita un botón más grande: alcanza con que un dato pese menos de lo que dice el papel.*
- **El monto se dice antes de elegir**, en una línea sobre las tarjetas: *«Te devolvemos $12,00 —
  el total de este paseo.»* Si es parcial, dice por qué: *«Te devolvemos $6,00 — la mitad del paseo
  que no se hizo.»*
- **Elegir es un acto, y se confirma una vez.** Después, la carta del hilo se convierte en el hecho:
  *«Elegiste saldo. Ya está disponible.»*
- **Si el camino tarda porque lo hace una persona**, se dice sin adorno: *«La devolución está en
  camino. La hacemos a mano y te avisamos cuando salga.»* **Jamás una fecha que no podemos cumplir.**
- **Nada de puntos, niveles ni compensaciones «de regalo».** Un beneficio no repara una falla:
  la repara la plata (LOYALTY §3 y §7).

---

## §5 · EL PRESTADOR — la tensión se comunica con humanidad, no con un ticket

«Como paseador abro Negocios y en lo administrativo veo **Casos**, con su burbuja si hay
pendientes. Cada fila me dice **de qué servicio hablan, quién, por qué, y cuánto me queda para
responder.**»

- **El aviso, con la voz de la casa:** *«La familia de Thor abrió un caso sobre el paseo del
  martes. Motivo: el paseo duró menos de lo pagado. Podés responder, resolverlo vos, o pedirnos
  que entremos.»* **No es un ticket frío; es que hay algo que resolver.**
- **Tres acciones y nada más:** **Responder** (al hilo) · **Reconocer y resolver** (elijo devolver
  todo, una parte, o saldo) · **Pedir a e-PetPlace**.
- **El reloj se ve, y no es rojo.** Una línea bajo la cabecera: *«Te quedan 14 horas para
  responder»*. Cuando vence: *«e-PetPlace tomó el caso»* — **se le dice, no se le oculta.**
- **Mi historial de casos es una lista, no un puntaje.** Sin barras, sin porcentajes, sin
  comparación con otros prestadores. Veo los míos y cómo terminaron.
- 🔴 **Y lo que el prestador ve todos los días, aunque no haya caso:** *«Tenés 3 servicios sin
  cerrar. Cerralos para cobrarlos.»* En su Hoy, con el número, sin drama y sin countdown. **A las
  48 horas la línea cambia a la verdad:** *«El paseo del martes quedó sin cerrar. No se cobra y la
  familia recibió su devolución.»* *No es castigo: es la consecuencia dicha a tiempo, dos veces,
  antes de que ocurra.*

---

## §6 · EL ASIENTO DE LA CASA — hoy provisional, después portal

**Firma del founder (7-sep): el asiento vive en el admin, y el front de ese admin se construye
como MVP propio antes de octubre.** Hasta entonces el asiento es provisional. Lo que **no** cambia
según dónde viva:

- **La Hoja del caso muestra, en una pantalla:** el objeto con su evidencia (recorrido, fotos,
  parte, acta, escalones del pedido) · el hilo entero · **cuánto se pagó, cuánto se puede devolver
  y si ese objeto tiene devengo** · casos de esa familia y de ese prestador en 90 días · **la
  propuesta de la máquina, marcada como propuesta.**
- **Decidir es un toque:** devolver todo · devolver una parte (monto) · dar saldo · sin lugar (con
  su motivo) · pedir más información. **Cada decisión escribe el hecho en el hilo y dispara el
  aviso.**
- **La propuesta de la máquina jamás se aplica sola.** Quien decide queda escrito en el caso.
- **Los contadores de casos por familia son de la casa.** *Jamás se le dice a una familia que
  reclama seguido, ni se le niega nada por un número.*

---

## §7 · LO QUE ESTA DIRECCIÓN **NO** DECIDE

*Se escribe para que nadie la cite como si lo hubiera decidido.*

- **Los tokens concretos** de cualquier superficie nueva: los elige B con la skill en la mano y los
  declara con su contraste **verificado**, jamás asumido.
- **La voz exacta de los textos.** El lote de strings lo lee el founder aparte, y todo va en
  **tuteo neutro**.
- **El diseño del portal del admin.** Esta dirección dice **qué tiene que mostrar y permitir la
  Hoja del caso**; el MVP del portal es letra propia y sesión propia.
- **Los montos, los fees y la contabilidad.** Los dice `MODELO_FINANCIERO` y `LETRA_POSTVENTA`.
- **Nada del encendido de WhatsApp.** La llave es del founder y va última.
