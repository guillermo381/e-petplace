# S106-C · TANDA 3 · OBRA 0 — EL RECORRIDO DEL SERVICIO ENTERO

**Pista C · 26-ago-2026 · rama `pista/s106-c-t3` sobre `main = cccd53cc`**

---

## 🔴 PUERTA — cómo se lee esto

Este documento **no describe lo que construí**: describe **lo que un usuario
puede caminar hoy**, paso por paso, en voz de usuario. Cada paso lleva su
estado medido y su dueño.

**Los pasos que hoy no se pueden caminar SON el checklist de la tanda.** Si un
paso está en rojo y no tiene obra asignada, es un hueco sin dueño — y decirlo
es el trabajo de este documento.

⚠️ **Cada estado sale de una medición con control positivo, no de recordar lo
que construí.** Donde el control falló o no se pudo medir, se dice —
*un instrumento que no imprime no midió nada* (L-321).

---

## §A · EL RECORRIDO DEL DUEÑO

### A1 · «Quiero que un veterinario vea a Thor, pero no puedo salir de casa»

Abre la app, va a Explorar → Veterinaria, y **espera encontrar la teleconsulta
al lado de la consulta y la vacunación**, como un servicio más.

**Estado: ⚠️ DEPENDE DEL MOTOR, Y LE FALTA LA VOZ.**

- La pantalla **no tiene una lista escrita**: lee del motor las ofertas y
  pinta sus `tipo_servicio` (`explorar/veterinaria/index.tsx:193`, `:414`).
  ⇒ **si A la publicó reservable, aparece sola. Cero código de superficie**,
  que es exactamente lo que la firma ① prometía.
- 🔴 **Pero saldría sin nombre.** Medido con control: `vozServicio` **no
  conoce `'telemedicina'`** (control: `'grooming'` sí está,
  `voz-servicio.ts:16`). Un tipo sin voz cae al fallback, y el fallback del
  dueño **omite** — la fila se pinta muda.
- ⚠️ **Letra vieja que induce error, encontrada de paso:** el encabezado de esa
  pantalla dice *«telemedicina/emergencia existen pero reservable=false»*
  (`:21`). Era cierto antes de S106 y **hoy es falso**. Se marca, no se borra
  (precedente de la casa).

**Dueño: C** (la voz) · **verificación pendiente: A** (que el tipo se publique).

---

### A2 · «Elijo el día y la hora, y antes de pagar me avisan de qué se trata»

Toca el negocio, lee el aviso de §3 con sus seis signos, marca la casilla y
paga.

**Estado: ✅ CAMINABLE.** Construido en tanda 1 y ejercido:
`tocarNegocio` es la **única entrada al hold** y no deja seguir sin la
aceptación (`lib/reserva/veterinaria.ts:161`); el consentimiento viaja **dentro
del hold**, no al lado; la casilla se resetea cada vez que el aviso se abre.

---

### A3 · «Ya pagué. ¿Y ahora qué hago para estar listo a las 15:30?»

Espera que la confirmación le diga cómo prepararse: dónde pararse, qué luz,
qué tener a mano.

**Estado: 🔴 FRENO — el texto no está en el repo.**

Búsqueda ancha por las frases típicas (`buena luz`, `lugar tranquilo`, `ten a
mano`, `conexión estable`, `antes de la consulta`) sobre `docs/`, `apps/` y
`packages/`: **cero resultados de telemedicina.**
**Control positivo: los seis signos de §3 SÍ aparecen** (3 archivos), así que
el instrumento ve texto firmado cuando existe.

⚠️ **`§1` de `LETRA_TELEMEDICINA` no es lo que la asignación describe** — se
llama *«Qué es, y por qué no es un oficio nuevo para el motor»* y no contiene
consejos. Leído entero, no inferido del título.

*No invento consejos de preparación: un consejo mal escrito sobre una consulta
médica no es un texto de relleno, es una instrucción.* **Espero el texto.**

**Dueño del texto: la mesa** · **Dueño del cableado: C** (dos lugares:
confirmación y antesala; sin casilla y sin gate — es consejo, no condición).

---

### A4 · «Son las 15:28. Abro la app y entro»

Va a la ficha de Thor → sus citas → toca la de hoy → entra.

**Estado: 🔴 NO SE PUEDE CAMINAR — es la deuda D-938, y es mía.**

- `citas/[mascotaId]` **no navega a ningún lado** para una cita vet: la fila
  de «otras» sólo cambia cuál se muestra (`router.setParams`, `:396`), y el
  único `router.push` es a `/paseo/[atencionId]` para citas en vivo (`:259`).
- La antesala **existe y funciona** (`videoconsulta/[citaId]`: lee la cita,
  monta `EntradaVideollamada`, cancela con la ventana leída del motor)
  **y nadie llega a ella.** Medido: cero referencias a `videoconsulta` fuera
  de su propia ruta.

⇒ El dueño llega hoy **sólo por deep link**, que es como el founder corrió el
gate. **Un usuario no tiene adb.**

**Dueño: C · Obra 1.**

---

### A5 · «Estoy en la llamada»

Pre-join con su preview, entra, habla, cuelga.

**Estado: ✅ CAMINABLE** (tanda 2, gate verde del founder), **con dos
pendientes conocidos**: girar cámara (discriminador abierto en el parte de
tanda 2) y el altavoz (encargo de B para esta tanda).

---

### A6 · «Una semana después abro el expediente de Thor y quiero ver que esa consulta fue por pantalla»

**Estado: 🔴 HUECO DE DOS MITADES — y una ya está construida esperando.**

`LETRA_TELEMEDICINA` §7 lo exige literal: *«la marca es VISIBLE para el
dueño… dentro de tres años alguien va a leer ese expediente para decidir algo,
y "evaluado por pantalla" cambia cómo se lee»*.

- ✅ **La pieza de B ya lo hace**: `LineaDeVida` acepta `modalidad` y pinta la
  `Insignia` debajo del quién (`LineaDeVida.tsx:201`, `:312`).
- 🔴 **El dato no llega**: `wrappers/timeline.ts` **no expone `modalidad`**
  (control: `tipo` aparece 13 veces) y **ninguna pantalla la pasa**.

⇒ *Una pieza construida cuya prop nadie llena es motor sin puerta del lado de
B, y se ve exactamente igual que «todavía no lo hicimos».*

**Dueño del dato: A** (pedido §E1) · **Dueño del cableado: C.**

---

## §B · EL RECORRIDO DEL VETERINARIO

### B1 · «Quiero ofrecer videoconsultas»

Entra a su taller de veterinaria, prende el servicio, lee los mínimos y acepta.

**Estado: ✅ CAMINABLE PARA EL VET VERIFICADO · 🔴 MUDO PARA EL QUE NO LO ESTÁ.**

- ✅ El flujo §6 está construido (`veterinaria/taller.tsx:445`, la Hoja de
  mínimos, el estado combinado *prendida sin publicar*).
- 🔴 **La Obra 5 tiene hueco real, medido:** `CodigoErrorTelemedicina` **no
  tiene ningún código de certificación** — sus nueve son `acceso_denegado`,
  `cita_no_encontrada`, `cita_no_es_teleconsulta`, `cita_estado_invalido`,
  `ventana_cancelacion_vencida`, `no_es_el_prestador_de_la_cita`,
  `usar_cancelar_teleconsulta`, `servicio_invalido`, `no_access_to_prestador`.
  Ninguno dice «no estás verificado».
- Lo que **sí** existe hoy: `obtenerDocumentosVerificacion` /
  `DocumentoVerificacion` (lo consume `veterinaria/verificacion.tsx`), y el
  taller **no lo lee** (medido: cero menciones de verificación en el taller).

⇒ **Obra 5 espera el código tipado de A y el estado de B.** El resto de su
letra ya la puedo cumplir: *el toggle jamás se mueve para quien no puede, y
apagar sigue sin preguntar.*

---

### B2 · «Alguien reservó una videoconsulta conmigo. ¿Cómo me entero?»

**Estado: ⚠️ NO MEDIDO, Y SE DECLARA EN VEZ DE ADIVINARSE.**

El disparo de un aviso al prestador es **motor de notificaciones**, fuera de
mi territorio, y el grep que intenté **no imprimió nada concluyente** — así
que no midió nada. No lo doy por existente ni por faltante.

**Va al censo de A / a la mesa para que le ponga dueño.** *Un paso del
recorrido sin dueño es peor que uno en rojo: el rojo tiene quien lo mire.*

---

### B3 · «Miro mi jornada y quiero distinguir cuáles son por video»

**Estado: 🔴 OBRA — y el material está completo, sólo falta unirlo.**

- ✅ `CitaAgendaPaseo` **trae `tipo_servicio`** (`paseo.ts:307`, `:397`).
- ✅ `Insignia` acepta `modalidad='teleconsulta'` y **arma su propia etiqueta**
  (`Insignia.tsx:125`, `:346`) — no hay que escribirle texto.

⇒ Cero bloqueo. **Dueño: C.**

---

### B4 · «Entro desde el detalle de la cita»

**Estado: 🔴 LA LÍNEA QUE QUEDÓ PENDIENTE — es la otra mitad de D-938.**

`apps/prestador/src/components/entrada-videollamada.tsx` **existe, está
probado y NADIE lo monta**: medido, sus únicas apariciones son su propia
definición. La pantalla destino (`veterinaria/cita/[citaId]`) está identificada
y lee `obtenerCitaVetPorId`.

**Dueño: C · Obra 1.**

---

### B5 · «Atiendo, cuelgo, y lo que dicté no se pierde»

**Estado: ✅ CAMINABLE** (tanda 2): modal de dos alturas, `FLAG_SECURE`, y al
colgar el borrador viaja como parámetro a `veterinaria/consulta/[citaId]`, que
abre en fase de dictado con el texto puesto.

---

### B6 · «La consulta queda en el expediente con su marca»

**Estado: 🔴 EL MISMO HUECO DE A6.** Ver §A6 — es un solo hueco con dos caras,
no dos.

---

## §C · EL CHECKLIST DE LA TANDA — lo que sale de caminar el recorrido

| # | Obra | Estado del bloqueo | Dueño |
|---|---|---|---|
| 1 | **Las dos puertas** (D-938) — fila del cliente + botón del vet | ✅ **DESBLOQUEADA** (ver §D1) | C |
| 2 | La reserva por el flujo existente | ✅ sin código; **falta la voz** de `telemedicina` | C |
| 3 | Consejos de preparación | 🔴 **FRENO: el texto no está en el repo** | mesa → C |
| 4 | El silencio gana su camino | ✅ desbloqueada | C |
| 5 | Estado de certificación | 🔴 **espera código tipado de A + estado de B** | A, B → C |
| — | **La insignia en la jornada del vet** *(no estaba en la asignación)* | ✅ desbloqueada | C |
| — | **La marca §7 en el expediente** *(no estaba en la asignación)* | 🔴 **espera `modalidad` en el timeline (A)** | A → C |
| — | **El aviso al vet de una cita nueva** | ⚠️ **sin dueño** | mesa |

---

## §D · LO QUE LA MEDICIÓN CORRIGIÓ DE LA ASIGNACIÓN

### D1 · 🔴 EL BLOQUEO DE LA OBRA 1 NO EXISTE — y el wrapper nombrado no es el que alimenta la fila

La asignación dice: *«necesita `modalidad` en `leerCitaResuelta` — si no está,
tu obra espera ese hueco, no lo rodea»*. **Dos cosas, medidas:**

**① La fila NO sale de `leerCitaResuelta`.** `citas/[mascotaId]` consume
`obtenerCitasActivasMascota` → `CitaActivaMascota`. `leerCitaResuelta` alimenta
la **antesala**, que es otra pantalla. Ninguno de los dos tiene `modalidad`
(medido con control: `estado` aparece 12 veces en uno, `tipo` 13 en el otro).

**② El hecho ya viaja, con otro nombre — y lo dice el contrato de A.**
`CONTRATOS-PARA-C.md:82-84`, verbatim:

> 🔴 **La modalidad ya NO se manda desde el cliente para teleconsulta.** Se
> **deriva del tipo de servicio, server-side**.

⇒ `modalidad='telemedicina'` **⟺** `tipo_servicio='telemedicina'`, por
construcción del servidor. Y **`tipo_servicio` está en los tres tipos**:
`CitaActivaMascota:26` · `CitaResuelta.tipoServicio:62` · `CitaAgendaPaseo:307`.

**Por qué esto no es rodear el hueco:** rodear sería inventar el dato o
adivinarlo de un nombre. Acá **consumo el contrato de A tal como está escrito**.
Lo que sí pido —y no bloquea— es que `modalidad` se exponga en el wrapper
(§E1): *el día que exista una cita presencial marcada como teleconsulta, o al
revés, mi derivación mentiría y nada me avisaría.* Cuando llegue, cambio una
línea por superficie.

**Registro honesto: la asignación presumió un bloqueo que la medición
disuelve.** Es el tercer caso de la sesión, y sigue saliendo igual: el
bloqueo se mide antes de aceptarlo.

### D2 · Dos pasos del recorrido no estaban en la asignación

La insignia de la jornada del vet (§B3) y la marca §7 del expediente (§A6)
**no figuraban entre las cinco obras** y son pasos reales del servicio. La
segunda tiene la pieza de B ya construida y esperando su dato.

*Para esto existe la Obra 0: la lista de obras la escribe el recorrido, no la
memoria de lo que se construyó.*

---

## §E · PEDIDOS A A — texto autocontenido (76b)

### E1 · `modalidad` en tres lectores

**Qué:** exponer el campo `modalidad` de la cita en:

1. `obtenerCitasActivasMascota` → `CitaActivaMascota` *(y por herencia
   `CitaActivaHogar`)*
2. `obtenerCitaVetPorId` → `CitaAgendaPaseo`
3. el lector del timeline → el ítem que alimenta `LineaDeVida`

**Por qué los tres, y no uno:** son las tres superficies donde la teleconsulta
tiene que distinguirse de una presencial — la fila del dueño, la jornada del
vet, y el expediente. Las tres tienen hoy `tipo_servicio` y **ninguna tiene el
campo canónico**.

**Por qué (3) es el más urgente de los tres:** `LineaDeVida` de B **ya acepta
`modalidad` y pinta la insignia de §7**; es la única prop que separa una pieza
construida de una promesa cumplida. Los otros dos tienen el rodeo del
`tipo_servicio` disponible; ése no.

**Forma esperada:** `modalidad: 'local' | 'domicilio' | 'telemedicina' | null`,
el `null` honesto donde la fila no lo declare — **jamás degradado a `'local'`**
(criterio ya registrado por la mesa esta sesión).

### E2 · Un código tipado para «no verificado» (bloquea la Obra 5)

`CodigoErrorTelemedicina` no tiene ninguno. La Obra 5 necesita distinguir
**«no podés activar porque no estás verificado»** de los nueve códigos
actuales, que hablan de otra cosa. Sin él, la pantalla tendría que inferir el
motivo de un `acceso_denegado` genérico — *que es adivinar por qué se cerró
una puerta.*

---

## §F · LO QUE ESTE DOCUMENTO NO DICE

- **No mide el motor.** Todo lo de arriba es superficie y contratos de
  wrapper leídos del repo; si el motor publica o no la oferta de telemedicina
  hoy, lo dice el censo de A.
- **No mide el aviso al prestador** (§B2), declarado como no medido.
- **No juzga el gate del founder** de tanda 2 — sus dos hallazgos abiertos
  (girar cámara, altavoz) viven en el parte de cierre de la tanda anterior.

---

*Depositado antes de construir, como pide la Obra 0.*

---
---

# §G · EL RECORRIDO, RE-CAMINADO AL CIERRE DE LA TANDA

*Actualizado sin redondear: lo que quedó caminable, lo que no, y con quién.*

## El dueño

| Paso | Antes | Ahora |
|---|---|---|
| A1 · Encuentra la teleconsulta | ⚠️ sin voz | ✅ **camina** — `servicioVoz.telemedicina`; la pantalla no tenía lista escrita, así que el resto fue cero código |
| A2 · Reserva con aviso y casilla | ✅ | ✅ |
| A3 · Confirmación con consejos | 🔴 sin texto | ✅ **camina** — §3bis verbatim, en sus dos lugares |
| A4 · Entra desde SU cita | 🔴 sin puerta | ✅ **camina** — fila → antesala → llamada, sin deep link |
| A5 · Consulta y cuelga | ✅ | ✅ *(girar cámara y altavoz siguen abiertos, de tandas previas)* |
| A6 · La marca en el expediente | 🔴 sin dato | 🟡 **camina en el Hogar; falta el parte** — ver §G1 |

## El veterinario

| Paso | Antes | Ahora |
|---|---|---|
| B1 · Activa el servicio | ✅ verificado · 🔴 mudo si no lo está | 🔴 **sin cambio: la Obra 5 sigue bloqueada** (§G2) |
| B2 · Se entera de la cita | ⚠️ sin dueño | ⚠️ **sin dueño** — va a la mesa |
| B3 · La ve en su jornada | 🔴 | 🟡 **la dice, no la marca** — ver §G3 |
| B4 · Entra desde el detalle | 🔴 sin puerta | ✅ **camina** — con su insignia de modalidad |
| B5 · Atiende y el borrador cae al Durante | ✅ | ✅ |
| B6 · La marca en el expediente | 🔴 | 🟡 igual que A6 |

---

### §G1 · La marca del expediente quedó A MEDIAS, y la mitad que falta tiene dueño

**Lo que se descubrió al cablearla, y no estaba previsto:**

🔴 **`LineaDeVida` —la pieza donde B implementó la marca de §7— NO LA MONTA
NINGUNA APP.** Medido con control positivo (118 archivos montan `<Tarjeta>`):
sus únicos montajes en todo el repo están **en la galería**.

El cliente pinta su timeline con **componentes locales**: `EventoVida` en el
Hogar y una fila inline en el perfil de la mascota. *La prop `modalidad` de
`LineaDeVida` está en la pieza correcta por diseño y sin uso por historia* —
y su único consumidor, la galería, es justo lo que `D-940` declara caído.

**Lo hecho:** la marca vive en `EventoVida` (Hogar), sobre el `modalidad` que
A entregó hoy. El código del motor lo traduce la pantalla (Ley 3) y `null`
**no se degrada a «presencial»**.

**Lo que falta, con su razón de no haberse forzado:**
- **El perfil de la mascota** pinta cada hecho en **una sola línea**
  (`numberOfLines={1}`). Meter una insignia ahí es la aritmética de ancho que
  S97-D pagó con cuatro vueltas. Su destino natural es el parte.
- 🔴 **`parte/[eventoId]` (la pantalla MOMENTO) no puede pintarla:
  `ParteConsulta` no trae `modalidad`** (medido con control). **Pedido a A** —
  y es el lugar donde la marca más importa: es la pantalla que alguien abre
  para leer qué pasó en esa consulta.

### §G2 · La Obra 5 sigue bloqueada, re-medido al cierre

`CodigoErrorTelemedicina` sigue sin ningún código de certificación, y no
llegó un estado de B. **No se rodeó**: inferir «no estás verificado» de un
`acceso_denegado` genérico es adivinar por qué se cerró una puerta.

### §G3 · La insignia en la jornada NO se montó, y es una decisión

La fila de la jornada (`FilaCitaUi`, pieza de B) tiene su slot `fin`
**vacío A PROPÓSITO desde S97-D**, con la aritmética escrita en el código:
~92 + 96 + ~160 px pedidos contra ~340 disponibles ⇒ *con el total fuera de
rango la pieza sólo podía elegir quién se rompía*.

⇒ **Meter la insignia ahí sería reabrir un defecto medido y firmado.** La fila
igual **dice** qué es, por el nombre del servicio en su subtítulo, y la
insignia vive en el detalle. Si la mesa quiere la marca en la fila, es un
**pedido a B** (una prop en el segundo piso, que es donde S97-D dejó lugar) —
no una decisión mía reabriendo su medición.

⚠️ **Lo que no pude verificar:** qué dice exactamente
`tipos_servicio.nombre` para telemedicina — es dato vivo y la DB es de A. Si
ese nombre no fuera reconocible, este paso vuelve a quedar en rojo.

### §G4 · Pedidos vivos a A, al cierre

1. **`modalidad` en `ParteConsulta`** (§G1) — el lugar donde la marca de §7
   más importa.
2. **`modalidad` en `CitaActivaMascota` y `CitaAgendaPaseo`** — hoy las dos
   puertas derivan de `tipo_servicio` con la derivación declarada en el
   código; cuando llegue, son dos líneas.
3. **Un código tipado de «no verificado»** (§G2) — bloquea la Obra 5.

---
---

# §H · EL CIERRE DE LA CONSULTA — recorrido antes de construir

## §H0 · Lo que YA estaba, medido con literal (dos de las tres cosas pedidas)

**① EL TEMPORIZADOR SE MONTA EN LAS DOS APPS.** La cadena, entera:
`SuperficieLlamada` → `encabezado={{ …, inicioTs }}` →
`EncabezadoLlamada:58` → `<TemporizadorLlamada inicioTs={inicioTs} />`.
Cliente `:460` · prestador `:378`.

🔴 **Por qué el founder no lo vio, y no es que falte:** el temporizador vive
dentro del **chrome**, y `SuperficieLlamada` **lo esconde a los 4 s de
quietud** (`QUIETUD_MS = 4000`, `:61`; `setVisible(false)`, `:133`). Cualquier
toque lo devuelve (`despertar`, `:136`).

*Cuatro segundos alcanzan para que un reloj que arranca en `00:00` desaparezca
antes de que alguien registre que existía.* **Es decisión de la pieza de B**
—su comentario lo declara: *«se esconde la vista, no el reloj»*— así que **no
lo toco: va a B como observación**, con el número medido.

**② GIRAR CÁMARA ESTÁ MONTADO EN LAS DOS.** `onGirarCamara` + su voz:
cliente `:473`/`:482` · prestador `:390`/`:399`. Ambos llaman a
`girarCamara(propio)`. ✅ Validado antes de probar, como pidió el founder.

**③a COLGAR YA PREGUNTA, EN LOS DOS LADOS.** Cliente:
`colgar = () => setConfirmandoColgar(true)` (`:432`) + su
`HojaConfirmacionDestructiva` (`:485`). Prestador:
`salir = () => setConfirmandoSalir(true)` (`:292`) + la suya (`:474`).
⇒ **No hace falta agregarlo del lado del vet: ya estaba.**

---

## §H1 · El recorrido, en voz de cada uno

### El veterinario, al terminar

> *«Ya vi lo que necesitaba. Esto no se arregla por pantalla: que la lleven
> a urgencias ahora.»*

Abre el panel de la nota **durante** la llamada (el asa, ya curada), escribe
lo que observó, y **elige cómo termina**. Después cuelga, la app le pregunta
una vez, y el borrador cae al Durante para sedimentar.

### El dueño, al terminar

> *«¿Y ahora qué hago?»*

Cuelga (con su pregunta) y vuelve. **Lo que el vet concluyó le llega por el
parte**, que es donde ya vive el resto de la consulta — no por una pantalla
nueva al colgar.

⚠️ **Lo que este recorrido NO promete:** una alerta inmediata al dueño con la
derivación. *Eso sería un canal, no una pantalla* — y decidirlo es de la mesa.
Se declara para que nadie lo dé por hecho.

### Lo que queda escrito

La conclusión **es parte de la nota clínica** y sedimenta con ella, en el mismo
acto. No hay registro paralelo.

---

## §H2 · 🔴 LA DISTINCIÓN QUE GOBIERNA — y por eso la conclusión no es un motivo de cierre

Firma del founder, y la mesa pidió respetarla al pie:

| | **Conclusión clínica** | **No realizable** |
|---|---|---|
| ¿Ocurrió la consulta? | **SÍ** — el vet atendió | **NO** — no se pudo hacer |
| La plata | **se cobra** | **se devuelve** |
| El expediente | **dice qué pasó** | no hay acto clínico que registrar |
| Dónde vive | **dentro de la nota** | estado terminal de la cita (§5) |

*«Una consulta que termina en "llevala a urgencias" SÍ OCURRIÓ.»*

⇒ **Son opuestos para el dinero y para el registro**, y por eso la conclusión
**no puede ser un formulario al colgar**: un formulario al colgar se lee como
«motivo de cierre», y ahí la derivación empieza a parecerse a un fracaso del
servicio cuando es su resultado más valioso.

## §H3 · De dónde salen las opciones — de la LETRA, no de mi criterio

**No invento vocabulario clínico.** Los tres desenlaces salen literales de
`LETRA_TELEMEDICINA`:

1. **Se resolvió en la videoconsulta** — el caso normal.
2. **Necesita atención presencial** — §4, verbatim: *«si el veterinario entra
   y determina que el caso necesita atención presencial, eso **es** el
   servicio prestado»*.
3. 🔴 **Derivada a urgencias** — §3, la salida que el aviso previo ya nombra,
   y la que el founder pidió **visible**.

*Si el vocabulario clínico tiene que crecer, es letra y no código.*

## §H4 · Las decisiones de forma, con su razón

- **Vive en el modal, junto a la nota** — no en una pantalla al colgar, por
  §H2.
- **Ninguna opción preselecciona.** *Un default en un campo clínico es un
  diagnóstico que la app puso y el vet no.* Sin elección, la conclusión va
  vacía y la nota sigue siendo válida — **la consulta no se bloquea por esto**:
  es la nota clínica, no un peaje.
- **La derivación no grita.** Las tres opciones tienen el mismo peso visual,
  por el mismo argumento que la paridad del aviso §3: si «urgencias» presidiera,
  la app estaría empujando hacia el desenlace más caro.
- **Viaja con el borrador al colgar**, por el camino que ya existe.

---
---

# §I · LA MESA DE TRABAJO DEL VET — recorrido antes de construir

## §I0 · Los cinco, medidos con literal ANTES de tocar

| # | Veredicto | Literal |
|---|---|---|
| ① tres alturas | **La pieza tiene las TRES; yo monto DOS** | `AlturaModal = 'cerrado'\|'medio'\|'completo'` y `FRACCION` las define. Mi único `setAltura` es `('medio')` (`:630`) ⇒ **a `completo` sólo se llega ARRASTRANDO** |
| ② historia clínica | **No cableada** — el lector llegó hoy | `obtenerHistorialClinicoMascota` en main |
| ③ tarjetas | 🔴 **SE MONTAN Y NO SE VEN** | Están dentro de `{altura === 'cerrado' && …}` (`:584`) ⇒ **al abrir el modal desaparecen**. `mascotaId` sí viaja (`:365`) |
| ④ acciones | **No existen** | El modal tiene dictado + campo + conclusión. Sin cerrar, sin guardar |
| ⑤ altavoz | 🔴 **NO LO CABLEÉ** | `onAltavoz` está en la pieza (`:120`,`:305`) y **cero ocurrencias en mis dos pantallas**. *No es que detecte auriculares: no está conectado* |

### 🔴 ③ es el cuarto caso del patrón, y es de una clase DISTINTA

Los tres anteriores —asa, temporizador, dictado— eran **piezas sin montar**.
Éste **está montado** y aun así el founder no lo vio: *lo até a la altura
`cerrado`, y el momento en que el vet quiere el contexto clínico es
exactamente cuando abre el panel para escribir.*

**La distinción importa porque la cura es distinta:** «no se monta» se arregla
montando; «se monta y no se ve» se arregla **preguntando cuándo hace falta**.
Y la respuesta acá es: *siempre que el vet esté trabajando* — o sea, sobre
todo con el panel abierto.

---

## §I1 · El recorrido, en voz del vet

> *«La estoy viendo. Le miro la oreja, dicto lo que veo, y necesito saber si
> ya le dimos algo parecido el año pasado.»*

1. **Entra a la llamada.** Ve al animal, sus controles, y **las cuatro
   tarjetas del contexto** — peso, vacunas, última visita, alergias.
2. **Sube el panel a MEDIO.** Sigue viendo al animal arriba; abajo tiene el
   micrófono y el campo. **Las tarjetas siguen ahí**: son el contexto de lo
   que está por escribir.
3. **Dicta.** El micrófono de la llamada se apaga solo mientras habla.
4. **Necesita el historial** → sube a **COMPLETO** con un toque. Lee, filtra
   por fecha o por caso, y **vuelve a MEDIO** para seguir dictando.
5. **Cierra el panel** cuando quiere ver a la mascota entera.
6. **Cuelga.** La app pregunta una vez, y lo dictado cae al Durante.

## §I2 · Lo que decide cada forma

- **A `completo` se llega POR TOQUE, no sólo arrastrando.** *Un gesto que es
  el único camino a una función es una función que sólo encuentra quien ya
  sabe que está.* El arrastre queda; se le suma la puerta visible.
- **Las tarjetas viven en `cerrado` Y en `medio`.** En `completo` no: ahí la
  pantalla es la historia, y el contexto está adentro de ella.
- **La historia se lee en `completo` y sólo ahí se pide.** *Traerla al abrir
  el panel sería pagar una consulta que en la mayoría de las consultas nadie
  va a mirar.*
- **«Cerrar» es un botón, no sólo un gesto** — mismo argumento que subir.

## §I3 · 🔴 «GUARDAR» NO SE PUEDE CONSTRUIR HOY, y se dice en vez de fingirse

El founder pide *«no hay guardar»*. **Medido: no existe un borrador
persistente.** El Durante presencial sedimenta al final con
`sedimentar_nota_clinica`; **no hay dónde dejar una nota a medio escribir.**

Lo que hay hoy: la nota vive en el estado de la pantalla y **viaja al Durante
al colgar**, donde sí se sedimenta.

⇒ **Un botón «Guardar» que sólo baja el panel sería una promesa falsa** — el
vet creería que su nota está a salvo de un cierre de app, y no lo está (y
menos con el crash ① vivo). **Pedido a A: un borrador persistente por cita.**
Mientras tanto el botón dice lo que hace: **«Listo»**, que cierra el panel y
conserva lo escrito en la sesión.

## §I4 · Lo que este recorrido NO trae, declarado

**El Durante presencial completo** —sus fases, sus campos tipados, el
estructurador— **no entra al modal en esta tanda.** Es el flujo entero de otra
pantalla, y traerlo a medias sería peor que la puerta que ya existe: al
colgar, el vet aterriza en el Durante de verdad, con todo.

---
---

# §J · LA SALA QUE SE PUEDE REABRIR — medición del motor y recomendación

## §J1 · Lo medido, y da vuelta el diagnóstico

**① Colgar es PURAMENTE LOCAL.** `onSalir` hace `router.replace` / `router.back`
y **nada más**: cero llamadas al motor desde las dos pantallas de videollamada.

**② Pero el motor YA TIENE EL GATE, y es el correcto.**
`puede_entrar_a_videollamada:143` — verbatim, con el comentario de A:

> `-- *Una sala abierta después de que el vet cerró la consulta es una puerta`
> `-- sin dueño.*`
> `IF v_cita.estado IN ('completada', 'no_show', 'rechazada') THEN`
> `  RETURN … 'cita_finalizada';`

⇒ 🔴 **NO es que el motor no se entere: es que COLGAR NO TERMINA LA CONSULTA.**
El acto que la cierra es **sedimentar la nota** —completar el Durante—, y eso
es coherente con la letra: *el vet cuelga, cae al Durante, escribe, y ahí la
cita se completa y la sala se cierra sola.*

**Por eso el founder pudo volver a entrar: colgó y no completó el Durante.**
La cita quedó `confirmada`, y para el motor una cita confirmada y pagada tiene
su sala abierta — correctamente.

⇒ **No hay pedido a A por esto.** El circuito existe.

## §J2 · 🔴 EL HUECO QUE SÍ ES REAL, y es otro

**Si el vet cuelga y NUNCA completa el Durante, la sala queda abierta
indefinidamente.** Hoy nada la cierra: ni un reloj, ni la ventana de la cita,
ni un barrido.

*No es el caso que el founder reportó —él sí podía volver porque la consulta
seguía viva— pero es el que queda cuando se cure lo demás.* **Su dueño es
letra + motor**, no esta pantalla.

## §J3 · La asimetría — recomendación, no decisión

**Recomiendo que NADIE quede afuera mientras la consulta no esté cerrada, y
que al cerrarla se cierre PARA LOS DOS.** El razonamiento:

- **El dueño tiene que poder volver**, y la mesa ya lo dice: se le cayó la
  llamada, se quedó sin batería, tocó colgar sin querer. *Cerrarle la puerta
  a los dos minutos de algo que pagó es peor que dejarla abierta.*
- **El vet también, y ésta es la parte que la asimetría propuesta se pierde:**
  si el vet no pudiera volver, **un colgado accidental lo deja afuera de una
  consulta que todavía no cerró — con la familia adentro, esperando.** *El que
  paga la asimetría no sería el vet: sería el dueño mirando una sala vacía.*
- **Lo que cierra la sala no debe ser un toque, sino un acto:** sedimentar la
  nota. Eso ya es así, y tiene dos virtudes: es deliberado (nadie lo hace sin
  querer) y es **clínico** (la consulta termina cuando queda registrada).

**Y así el cobro queda protegido sin esfuerzo extra:** «terminar» no es un
botón que alguien pueda tocar para discutir la plata — es escribir la nota de
una consulta que **ya ocurrió** y que §4 dice que se cobra igual.

**Lo que la mesa tiene que decidir y yo no:**
① ¿hay un techo de tiempo para volver? (mi voto: el fin de la ventana de la
cita, no un reloj nuevo) · ② ¿qué ve el que está adentro cuando el otro
vuelve? (hay pieza: `EstadoConexion` ya distingue reconectando) · ③ el hueco
de §J2: qué cierra una consulta que nadie completó.

---
---

# §K · EL CIERRE DEFINITIVO — recorrido sobre la firma del 27-ago

**La firma:** se cierra ① cuando **cualquiera de los dos** toca terminar
—cierra para ambos— o ② **sola, 10 minutos después** del fin del tiempo de la
cita. Mientras no pase ninguna, **los dos vuelven libremente**.

## §K1 · Qué ve cada uno

**El que toca terminar** ve la confirmación, y **tiene que decir que cierra
para los dos** — hoy dice *«¿Terminar la videoconsulta?»*, que es claro sobre
la acción y **calla lo importante**: que el otro se queda afuera.

*El caso que lo vuelve grave es el que la mesa nombró: un toque accidental del
dueño termina a los dos minutos una consulta que pagó.* Con la firma vieja
—colgar era local— equivocarse costaba volver a entrar; ahora cuesta la
consulta.

**El que se queda del otro lado** ve que la llamada terminó. No hay nada nuevo
que construir: la desconexión ya llega por el transporte.

**El que vuelve a una sala CERRADA** recibe `cita_finalizada`, que ya tiene su
voz en las dos apps (*«Esta videoconsulta ya terminó»*). ✅ Cero trabajo.

**El que vuelve a una sala VIVA** entra y sigue. ✅ Es lo que ya pasa.

## §K2 · 🔴 EL BORRADOR SI EL VET CERRÓ SIN SEDIMENTAR — y acá la firma ayuda

Con el borrador de A (uno por cita, PK `cita_id`, limpieza por trigger al
sedimentar), **cerrar la sala no toca la nota**: el borrador vive en la CITA,
no en la sala.

⇒ El vet cierra, cae al Durante, y **su dictado lo está esperando**. Si
abandona ahí, sigue esperándolo la próxima vez que abra esa cita.

*Y esto vuelve al cierre menos peligroso de lo que parece: lo que se pierde al
cerrar es la sala, jamás el trabajo.*

## §K3 · Lo que la pantalla NO puede hacer, dicho en vez de simulado

🔴 **El cierre por tiempo (②) es del MOTOR y no tiene dónde vivir hoy.**
Medido: `puede_entrar_a_videollamada` corta por `estado IN (completada,
no_show, rechazada)` — **no mira el reloj de la cita**. Y ningún cron cierra
teleconsultas.

*Un temporizador en la app sólo corre mientras alguien mira la pantalla, y la
regla dice «aunque las dos apps estén cerradas».* **Una regla de tiempo que
depende de que alguien esté mirando no es una regla: es una coincidencia.**

⇒ **PEDIDO A A**, con su forma: que la RPC devuelva `cita_finalizada` cuando
`ahora > fin_de_la_cita + 10 min`. **Perezoso, no cron** — es el patrón que la
casa ya usa para el hold y para el presupuesto vencido: *el estado se calcula
al preguntarlo, y así vale aunque nadie haya mirado.*

## §K4 · Lo que sí construyo ahora

**La voz de la confirmación en las dos apps**, diciendo lo que la firma nueva
hace: **termina para los dos**. Es lo único de §K que es de superficie, y es
justo lo que la firma vuelve urgente.

---
---

# §L · EL CUADRO CONGELADO — medición previa a la prueba

## §L1 · ⚠️ EL AVISO QUE LA MESA PIDIÓ TEMPRANO: **SÍ, EXIGE BUILD NUEVA**

**Y no hay variante que lo evite.** La conversión de un frame de video a una
imagen **no existe en JS**: el frame vive del lado nativo (`VideoFrame` de
libwebrtc en Android, `RTCVideoFrame` en iOS) y lo que falta es **código
nativo que lo convierta**. *Nada de eso viaja por OTA.*

⇒ **Los binarios de anoche no sirven para probar esto.** La prueba barata
**también** necesita build, porque su parte cara —el sink que convierte— es
justo la nativa. **Vale saberlo antes de agendar el gate.**

## §L2 · 🔴 EL RIESGO QUE D NO PUDO MEDIR: MEDIDO, Y CAE

D dejó marcado: *«`YuvHelper` / `JavaI420Buffer` NO están referenciadas — D no
las midió. Si ahí frena, es dato»*.

**Medido contra el artefacto real**, el `.aar` que la app compila
(`io.github.webrtc-sdk:android:144.7559.05`, del cache de gradle de esta
máquina):

```
✅ VideoFrame   ✅ VideoSink        ✅ VideoTrack     ✅ SurfaceViewRenderer
✅ EglBase      ✅ SurfaceTextureHelper
✅ YuvHelper    ✅ JavaI420Buffer      ← los dos que faltaban por medir
```

⇒ **El primer riesgo de compilación desaparece antes de gastar una build.**
*Que el fork no las REFERENCIE no significa que no estén: están en libwebrtc,
que es su dependencia `api`, o sea que quedan en el classpath de la app.*
**La distinción importa: D midió el fork; el que las trae es el artefacto de
abajo.**

## §L3 · Y LA CONVERSIÓN NO LA PONE LIBWEBRTC — la pone cada plataforma

Medido: en el `.aar` **no hay nada de `bitmap`, `png` ni `jpeg`**. Eso **no es
un problema, es el reparto**:

- **Android:** `VideoFrame` → `YuvHelper` (I420→NV21/ARGB) → `Bitmap` →
  `compress(PNG)`. Todo con SDK estándar.
- **iOS:** `RTCVideoFrame.buffer` → `RTCCVPixelBuffer` → `CIImage` →
  `UIImage` → `UIImagePNGRepresentation`. **Sin YuvHelper**: el pixel buffer
  ya es convertible.

**Y el fork trae los dos lados**, medido: Android con `VideoSink`; iOS con
`SampleBufferVideoCallView` y `VideoFrameProcessor` (los dos usan
`RTCVideoFrame`). ⇒ **El criterio ② —Android Y iOS— es alcanzable por las dos
vías, y ninguna pide cambiar de fork.**

⚠️ **`VideoFrameProcessor.h` merece mirarse antes de escribir un sink de
cero**: si el fork ya expone un punto de extensión de frames en iOS, la mitad
de ese lado puede ser cablear en vez de escribir. *No lo doy por hecho — lo
declaro como lo primero a leer cuando la prueba arranque.*

## §L4 · Lo que sigue firme y no se toca

**No se cambia de fork.** **La captura de vistas está descartada por firma** —
negro en Android, anda en iOS: *no se prueba ni se reintenta.* **El POC de
2020 es código para copiar y hacerse cargo, no una dependencia.**

Y el criterio de verde, tal como llegó: ① **la imagen tiene que ser LA DEL
VIDEO** —cámara apuntando a algo escrito a mano, y el PNG lo dice— porque *un
frame negro también pesa, abre y se ve como una foto* · ② **las dos
plataformas, o es descarte**.

---
---

# §M · DOS COSAS QUE DECLARÉ CONSTRUIDAS Y EL APARATO NEGÓ

## §M0 · 🔴 EL CRITERIO, TOMADO — y lo escribo para mí

**Las dos las declaré construidas y las dos fallan en el aparato.**

*El criterio de verde de esta casa se ejerce con el dedo del founder, no con
un typecheck.* Cuatro typechecks en 0 y 59 reglas verdes **dicen que compila y
que no rompí ninguna ley — no dicen que la cosa haga lo que dice hacer.**

⇒ **De acá en adelante: «construido» hasta que el founder lo vea andar.**
Nunca «curado».

## §M1 · GIRAR CÁMARA — instrumentado, tercera vez

**El dato que afina el diagnóstico: NO hay parpadeo** ⇒ *probablemente ni
siquiera cae a `restartTrack`.* O las dos vías fallan silenciosamente, o el
llamador no las alcanza.

**Instrumentado con `[GIRO_C]`, una marca que sólo este código pudo poner**
(L-427), en **tres lugares** — porque son tres muertes distintas y el log dice
cuál:

| Marca | Qué prueba |
|---|---|
| `alternar:entra` | el toque llegó al handler |
| `entra` | `girarCamara` se alcanzó, y si hay track |
| `via1:existe` / `via1:corrio` | si `applyConstraints` existe, corrió, y **qué facingMode reporta el track después** |
| `via1:no_cambio_cae_a_via2` | corrió sin lanzar **y no cambió** |
| `via2:corrio` / `via2:excepcion` | el plan B |

🔴 **Y una cura que salió de instrumentar, no de leer:** `applyConstraints`
**puede resolver sin error y dejar el `facingMode` como estaba** — *una vía
que "funciona" y no hace nada, que es exactamente el síntoma*. Ahora se
verifica contra `getSettings().facingMode` y, si no cambió, **cae al plan B en
vez de devolver `true`**. *Sin esa verificación, la vía ① reportaba éxito
siempre y el plan B nunca corría — lo que explica que el founder no viera
parpadeo.*

**Falta el cable**: el founder reproduce con A y el log dice cuál de los tres
lugares muere.

## §M2 · TERMINAR NO CIERRA — medido de punta a punta, y es pedido a A

**① Colgar es PURAMENTE LOCAL.** Medido otra vez tras la firma: `onSalir`
hace `router.replace`/`router.back` y **cero llamadas al motor** en las dos
apps.

**② No existe ninguna RPC para que un actor termine la consulta.** Medido:
`terminar_teleconsulta` · `cerrar_teleconsulta` · `finalizar_videollamada` →
**cero resultados**.

**③ Lo único que existe es `_cerrar_teleconsulta_si_vencio`** — el perezoso de
A, **revocado de `authenticated`** (sólo lo llama la RPC por dentro). **Y la
mesa tiene razón: ése es para las que NADIE cerró, no para las que sí.**

⇒ **La pantalla no puede arreglarlo sola.** Confirmar en las dos apps y volver
a entrar es coherente: *para el motor, esa cita sigue confirmada y pagada, y
una cita así tiene su sala abierta.*

### El pedido, con su forma

**Una RPC que marque la teleconsulta como terminada**, llamable por **el dueño
o el profesional de esa cita** (los dos, por la firma: *cualquiera cierra para
ambos*).

**Lo que la vuelve delicada, y por eso va con su nota:**

- 🔴 **No puede confundirse con `no_show` ni con `no_realizable`.** *Acá la
  consulta OCURRIÓ, el vet atendió y COBRA.* Un cierre que aterrice en un
  estado de "no pasó" **le consumiría a la familia su derecho a la devolución
  por una consulta que sí recibió** — el mismo cuidado que A puso en su freno
  del perezoso.
- **Idempotente**: los dos pueden tocar terminar casi a la vez.
- ⚠️ **Y el borde que hay que decidir con ella:** si el DUEÑO cierra, ¿la cita
  queda `completada` aunque el vet no haya sedimentado su nota? *Mi voto: sí —
  la sala se cierra, y el Durante sigue disponible para el vet por su propia
  puerta, que no depende de la sala.* Pero es letra, no mía.

## §M3 · EL VET ATRAPADO AL DERIVAR — medido, y el guard es MÁS ANCHO QUE SU LETRA

**Dónde vive la exigencia: en el MOTOR.** `sedimentar_nota_clinica` corta con
`nota_sin_diagnostico` (`22023`), y su migración cita el literal del abogado:

> *«El sistema debe exigir el campo de diagnóstico como obligatorio **antes de
> emitir** — no por formalismo, sino porque una REV sin diagnóstico es una
> receta defectuosa.»*

🔴 **Y ahí está el hallazgo: el abogado dijo «antes de EMITIR» —una receta— y
el guard está en CERRAR LA CONSULTA.** *Son dos actos, y hoy comparten un
requisito que sólo uno de los dos necesita.* **El guard protege más de lo que
su propia letra pide, y el costo es un vet que no puede cerrar una consulta
cuyo resultado fue justamente no poder diagnosticar.**

### El pedido, con la tensión respetada y no rodeada

**Que `sedimentar_nota_clinica` exija diagnóstico SALVO cuando la conclusión
sea una derivación** — y que **la exigencia para EMITIR RECETA quede intacta**,
que es lo que el abogado pidió.

**Y el cierre del círculo, que hace que nadie pierda nada:** *una consulta
derivada sin diagnóstico no debería poder emitir receta*. Con eso el límite
legal se cumple donde fue escrito, y el vet deja de estar atrapado.

⚠️ **No es «no realizable»**, y la diferencia toca la plata: *acá la consulta
ocurrió, el vet atendió y cobra. Su resultado fue derivar.*
