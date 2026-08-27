# PLAN S106 · CIERRE — telemedicina de punta a punta

> **Depositado en el repo el 27-ago-2026 por A**, por orden de la mesa y con su
> razón: *esta sesión ya pagó dos veces que un artefacto que otra pista debe
> medir se quede en un chat* — la dirección de arte de la videoconsulta y el
> texto de los consejos de preparación. **Un plan que vive en una conversación
> no lo puede leer la sesión que viene.**

> **27-ago-2026.** El servicio ya se camina entero: un dueño lo encuentra, lo
> reserva, paga, entra desde su cita, ve al veterinario, le muestra al animal
> con la cámara trasera, y el vet dicta, estructura, consulta la historia,
> receta y cierra. El transporte está firmado sin condición y el circuito quedó
> ejercido en aparatos reales.
>
> Lo que sigue no es construir el servicio: es **quitarle lo que impide
> encenderlo**. Cuatro frentes, y sólo uno es de telemedicina.

---

## §0 · El estado, sin adornos

| frente | estado |
|---|---|
| transporte (LiveKit) | ✅ firmado sin condición, ejercido en dos aparatos |
| reserva, pago, consentimiento | ✅ caminado de cero por el founder |
| la in-call de los dos lados | ✅ con altavoz, temporizador, girar cámara y sus glifos |
| el modal del vet | ✅ tres alturas, dictado, historia, estructurador, borrador |
| receta a distancia | ✅ ejercida, con respaldo legal depositado |
| cierre de la consulta | 🟡 construido, sin ejercer |
| derivar sin diagnóstico | 🟡 construido, sin ejercer |
| **el cuadro congelado** | 🔴 última pieza del servicio |
| **los dos huecos del equipo** | 🔴 no son de telemedicina y la afectan más |
| **el servicio preseleccionado** | 🔴 defecto de producción, cobra por lo que nadie eligió |
| el preset de video | 🔴 decisión del founder, pendiente desde el día uno |

---

## §1 · FRENTE 1 — lo que sólo el founder puede cerrar

Tres actos, ninguno necesita que nadie construya nada.

**① Ejercer las dos curas del último OTA.** Terminar la consulta y confirmar en
las dos apps ⇒ nadie debe poder volver a entrar. Y concluir *«necesita visita
presencial»* ⇒ el vet debe poder cerrar **sin** diagnóstico. Las dos están
construidas y **ninguna vio un dedo**.

**② Elegir el preset de video, con un animal en pantalla.** Pendiente desde el
primer día y hasta hoy no se podía hacer bien: **recién ahora la cámara trasera
funciona.** La pregunta no es «se ve bien» — es **¿se distinguiría una lesión de
piel?** Hoy corre en `h720`; `h540` más que dobla la capacidad del plan gratis y
`h360` la cuadruplica. *Se decide mirando a Thor, no una tabla.*

**③ El parpadeo al girar.** Hoy el giro corre por el plan B, así que parpadea
por diseño. Decir si eso es aceptable o si merece trabajo. *(Ver `D-943`.)*

---

## §2 · FRENTE 2 — el cuadro congelado (la última pieza del servicio)

**Dueño: C. Estado: camino medido, criterio escrito, exige build nueva.**

Todo lo que hace falta saber ya está medido por D y **no se re-mide**:

- el frame decodificado **ya llega** en cada llamada; el fork lo usa sólo para
  contar si el video vive. **No falta el acceso: falta la conversión.**
- es vía de **cliente**, no grabación ⇒ la firma ⓪ no la bloquea y
  `roomRecord:false` **no se toca**.
- ☠️ la captura de vistas está **descartada por firma** — negro en Android, anda
  en iOS. *Un fallo asimétrico por plataforma es peor que uno total.* No se
  prueba ni se reintenta.
- lo que compila seguro está verificado **contra el artefacto real**.
- la conversión la pone cada plataforma; el fork trae los dos lados ⇒ el
  criterio de las dos plataformas es alcanzable **sin cambiar de fork**.
- ⚠️ lo primero a leer en iOS: `VideoFrameProcessor.h` — si ya es punto de
  extensión, esa mitad es **cablear y no escribir**.

**El orden, y no se saltea:** ① la prueba barata contra el **track local de la
cámara** (cero dependencias nuevas, sin LiveKit, sin sala, un solo aparato) → ②
si da verde, el módulo nativo → ③ la subida → ④ el botón en la in-call.

**🔴 El criterio de verde, escrito antes de correr y sin ablandar:**

① que la imagen sea **la del video** — cámara apuntando a algo escrito a mano, y
el PNG lo dice. *Producir «una imagen» no es producir «la imagen»: un frame
negro también pesa, abre y se ve como una foto.* **Y un rectángulo negro en una
historia clínica no es un bug de UI: es un dato clínico falso, que alguien lee
años después para decidir algo.**
② **Android Y iOS.** Si anda en una sola, es **descarte**, no verde parcial.

**Las tres firmas, ya depositadas:** el cuadro no cuenta como grabación · el
dueño lo ve en el momento · entra al expediente con su marca de origen, en su
eje propio.

**Y la build:** es la única de este plan que exige compilar. Sale **una sola**,
con todo adentro, y en ella se le instala el APK al **moto g31** — que hoy no
puede recibir OTAs por estar en un runtime viejo.

---

## §3 · FRENTE 3 — los dos huecos del equipo (bloquean el encendido)

**Dueño: A. No son de telemedicina — y por eso hay que decidirlos como lo que
son.**

**`D-939` · El aviso llega sólo al titular.** En una clínica con equipo, quien
va a atender no se entera de que le reservaron. Vale para los cinco oficios.

**`D-942` · El titular no puede tomar ni reasignar.** El motor asigna a un
empleado y el prestador no tiene cómo ver quién es ni moverlo. La pantalla de
equipo existe y **no se encuentra** — sólo se llega desde otra tab.

**Por qué telemedicina no puede encender con esto abierto, y presencial sí
aguanta:** en una cita presencial hay repechaje — el dueño llega a la puerta y
alguien lo atiende. **En teleconsulta no hay puerta ni sala donde alguien note
que están esperando:** la familia mira una pantalla sola, y la consulta paga se
pierde sin que nadie se entere.

### 🔴 La firma del founder sobre la asignación — y cambia el motor

> **Toda cita se asigna al TITULAR.** Sólo alguien con rol de **recepción**
> puede pasarla a una persona del equipo. Si nadie la mueve, el titular es el
> único que puede tomarla. Y si desde la **pizarra** se asigna a otro, ése la
> atiende.

⚠️ Eso **contradice lo que el motor hace hoy**: hoy asigna sola, por balanceo, y
por eso el founder se encontró con una cita de su propia clínica que no podía
tomar ni ver a quién había ido. **La cura de `D-942` deja de ser «dejar que el
titular tome una cita ajena» y pasa a ser que las citas no nazcan ajenas.**

**Lo que hay que medir antes de tocar:**

- ¿el rol de recepción existe hoy, con qué nombre y qué puede hacer? El arco de
  empleados y roles está construido — **se mide, no se inventa**.
- ¿la pizarra existe como camino de asignación, o es un concepto que todavía no
  tiene pantalla?
- qué pasa con las citas **ya creadas** por balanceo: **no se tocan en
  silencio**, y si alguna está viva hay que decir qué se hace con ella.
- ⚠️ Y el borde que sigue en pie: las citas **sin empleado asignado** no tienen a
  quién avisarle además del titular. Con esta firma **eso deja de ser un borde y
  pasa a ser el caso normal** — `D-939` se simplifica: el aviso va al titular
  **porque la cita es del titular**, y viaja al empleado el día que alguien la
  reasigne.

⚠️ **Y una advertencia de método:** puede que el balanceo sea deliberado de una
sesión vieja. *Retirarlo sin saber por qué existe es el error inverso.* Si
aparece su razón escrita, se trae antes de borrarla.

---

## §4 · FRENTE 4 — el servicio preseleccionado (defecto de producción)

**Dueño: C, adjudicado por A. Es el más urgente de todos y no es de
telemedicina.** Ficha: **`D-941` 🔴**.

Un dueño puede **pagar por un servicio que no eligió**, y nada se lo dice. Le
pasó al founder **dos de cinco veces**, conociendo el sistema. Le pasa hoy, a
cualquiera, con cualquier oficio veterinario.

**La causa, medida** (`explorar/veterinaria/index.tsx:192`)**:** el QUÉ nace
preseleccionado en el primero de la lista, que ordenada alfabéticamente cae en
una presencial. Y el resto del flujo se comporta idéntico, así que nada avisa.
*No es una pantalla que miente: es una que no insiste.*

**Las dos curas:**

① **El QUÉ no viene elegido de fábrica.** Si el usuario no eligió servicio, no
hay servicio elegido — la pantalla se lo pide. Y si viene uno desde el catálogo,
**ése gana** y no se pisa con el primero alfabético: **lo que se retira es el
fallback, no el ancla.**
② **El checkout dice qué estás comprando, y preside.** Hoy el nombre va como
subtítulo debajo del de la clínica: está, pero no preside — *y en el momento del
pago, lo que preside es lo que se lee.* **Es cinturón, no cura:** aunque ① nunca
fallara, una pantalla de pago tiene que decir qué se paga.

**El costo, escrito:** el founder pagó **$50 por una consulta que no quería, dos
veces**, y sólo se enteró porque fue a mirar la fila. **Nadie más va a ir a
mirar la fila** — una familia se entera el día de la cita, cuando la clínica la
espera en persona o cuando no aparece nadie.

**Lo que A midió y NO hay que tocar:** el hold usa la oferta correcta, y la
ficha del prestador recibe `ofertaId` por URL y reserva lo que le pasan. **El
motor nunca eligió mal — recibió bien lo que la pantalla le dio.**

---

## §5 · El gate final, y qué significa

Cuando los cuatro frentes cierren, **un solo recorrido** de punta a punta, sin
`adb`, con las dos clínicas y los dos teléfonos:

1. **Como dueño:** encontrar el servicio · reservarlo **verificando que lo que
   se paga es lo que se eligió** · el aviso con los seis signos · la casilla ·
   pagar · los consejos.
2. **Como vet:** recibir el aviso **estando o no siendo el titular** · entrar
   desde el detalle.
3. **En llamada:** la trasera mostrando al animal · el altavoz · **capturar un
   cuadro y verlo en el expediente** · el modal con su historia y su dictado.
4. **Cerrar:** terminar ⇒ nadie vuelve a entrar · el borrador cae al Durante ·
   sedimentar · **la consulta en el expediente con su marca de teleconsulta**.
5. **D audita:** los hechos de sala cuadran, y el cuadro quedó con su origen
   correcto **apuntando a la cita que corresponde**.

**Y recién entonces el encendido**, que sigue teniendo su propia condición
firmada y **no la levanta este plan**: el consentimiento verificado en fila. La
llave queda encendida hasta que haya usuarios reales — el criterio de apagado
cambió y está depositado en
`docs/relevamientos/2026-08-26-s106a-ACTA-ENCENDIDO-DE-GATE.md`.

---

## §6 · Lo que este plan NO incluye, a propósito

*Se escribe para que nadie lo lea como olvido.*

- **La grilla de horarios vs. la duración del servicio.** El paso de la grilla y
  la duración de la oferta son **dos números independientes y nada los obliga a
  coincidir** ⇒ una teleconsulta de 20 min en una grilla de 30 **desperdicia un
  tercio de la capacidad del vet**, y el prestador pierde ingresos sin
  enterarse. Está medido y con costo dicho, y es **de negocio, no de
  lanzamiento**.
- **El desenlace clínico como dato consultable.** *Un dato en prosa se puede
  migrar; uno que no se registró, no.* **La columna ya existe** (S106 t3); lo
  que falta es que las pantallas la llenen y que alguien pueda preguntar
  *«cuántas teleconsultas derivaron a urgencias»*.
- **La rotación del keystore**, con su disparo: **antes de la primera subida al
  Play Store**.
- **La galería en web** — ya curada, pero merece la nota de por qué importó:
  **nueve piezas de videollamada estuvieron ahí y nunca se pudieron mirar** fuera
  de una llamada real. *La galería caída no costó tiempo: costó no poder ver* —
  y de ahí sale la saga entera del glifo de girar cámara.

---

## §6bis · Tres números que hay que usar bien — correcciones de B

*Se depositan acá porque son los datos con los que este plan decide, y **un
número vencido al lado de uno bueno es el mismo señuelo que la letra derogada**
— que esta sesión ya pagó tres veces.*

**① El ancho de la barra de la in-call: `300` de `320`, ~~316~~.** B bajó el
disco a 48 en t3 y está en `main`. **La conclusión sobrevive** —un sexto control
da 360 y no entra ni en un teléfono de 360— *pero el número viejo hace creer que
hay 2 px de margen cuando hay 10, y ese margen es justo el que invita a apretar
el gap en vez de decidir qué sale de la barra.* **La decisión es de mesa mirando
el número, no de quien construye.**

**② La vara de colisión de glifos: `0,361`, ~~0,306~~.** El par sano más alto de
esa fila es **cámara·altavoz**, no micrófono·cámara. *Una vara tiene que ser el
par sano MÁS ALTO: puesta en el segundo marcaría como colisión un par que está
bien.* El glifo enfermo daba **0,647** ⇒ **la separación es amplia con
cualquiera de los dos: lo que se rompe es el umbral, no el diagnóstico.**

**③ El encargo de colisiones NO está abierto: B lo contestó** (`92f70183`, en
`main`). Veredicto **(b) se puede a medias**, con el instrumento
`scripts/medir-siluetas.mjs` vivo y su guard probado en rojo. **La mitad que no
se puede:** *«convivir en una fila» no es derivable del JSX — se declara.*

---

## §7 · Lo que esta sesión enseñó, y por qué el método se queda

**Cinco defectos de producción y tres de proceso los encontró el founder con el
teléfono en la mano, y ninguno lo podía ver un gate:**

- **la vitrina caída** para toda familia logueada — el listado de prestadores de
  los cinco oficios, en producción
- **el servicio preseleccionado** que cobra por lo que nadie eligió
- **el glifo que colisionaba con su vecino** — *el founder no contaba discos:
  nombraba funciones*
- **el botón que espejaba en vez de girar**
- **una API que resuelve OK sin hacer su trabajo**, indistinguible de una que
  funciona salvo que alguien compare **lo pedido contra lo real** (`L-429`)

Y el caso que resume todo:

> **Cuatro pistas midieron cinco veces que girar cámara estaba montado, y las
> cinco tenían razón.** Cada instrumento contestó bien la pregunta que sabía
> hacer. **La que faltaba no la sabía hacer ninguno.**

Las tres leyes de proceso que quedaron, y que valen para cualquier frente:

- **`L-427`** — exigí una señal que **sólo tu código** pueda haber puesto. *Y en
  su forma más cara: el aparato equivocado con el binario equivocado da una
  señal perfectamente creíble* — el moto g31 habría producido la primera de las
  cuatro salidas del diagnóstico, encajando en el cuadro que la mesa esperaba.
- **construido ≠ curado** — el verde se ejerce con el dedo del founder.
- **entregada ≠ montada** — una pieza que existe y no cumple su efecto **no la ve
  ningún gate**. El asa, el temporizador y el dictado: los tres construidos,
  probados, sin montar, y los tres los encontró el founder usando la app.
