# DIRECCIÓN DE ARTE — LA VIDEOCONSULTA

> **Firmada en mesa por el founder, 26-ago-2026 (S106, tanda 2).**
> **Depositada VERBATIM por la pista A el mismo día.**
>
> **Es la vara contra la que el founder va a mirar la app.** Lo que está
> acá manda; lo que no está acá lo decide la pista leyendo la skill del
> sistema de diseño, y lo declara.

---

## ⚠️ PUERTA — cómo se usa este documento, y por qué vive en un archivo propio

**Se midió dónde correspondía depositarlo, no se supuso** (el founder lo
pidió así, y C ya había medido que no existía: **cero menciones** de
`videoconsulta`, `teleconsulta`, `in-call` o `pre-join` en
`DIRECCION_ARTE.md`).

**El depósito quedó partido en dos, y cada mitad en el lugar donde se lee:**

| qué | dónde | por qué |
|---|---|---|
| **La CLASE «control sobre video»** | `DIRECCION_ARTE.md` **§6septies** | es una ley general de la casa, hermana de la marca de mapa (§6ter) y de la marca ajena (§6sexies) — vive donde viven las leyes |
| **El contrato de las DOS PANTALLAS** (§1–§3) | **este archivo** | es un contrato de superficie, de la familia de las láminas y las letras — y B y C tienen que encontrarlo por su nombre, no en la línea 1838 de un documento de 1838 líneas que **ya declara una colisión de numeración adentro** |

### 🔴 Y la clase no se inventó: `DIRECCION_ARTE.md` §6ter ya había previsto este caso exacto

Cuando se firmó la marca de mapa, la mesa **descartó explícitamente** la
salida de ensanchar la Ley 12 para admitir relleno «sobre fondo
no-controlado», con este literal:

> *«esa condición no está acotada: toda foto, todo gradiente y **todo
> póster de video** son fondo no controlado. **Una regla que no puede decir
> dónde termina no es una regla** — y habría dejado entrar el relleno por
> una puerta que después nadie podía cerrar.»*
>
> *«La clase se acota sola, y por construcción: la marca de mapa vive en
> UNA pieza, y las piezas se cuentan.»*

**§1.2 de esta dirección hace exactamente lo que ese precedente dejó como
única salida legítima:** no enmienda la ley del glifo — **nombra una clase,
con su scrim propio, definida UNA vez en una pieza contable de
`packages/ui`.** *La condición de acotamiento que §6ter exigía se cumple
por construcción, igual que allá.*

### Sobre §0

El founder ordenó depositar **§1, §2 y §3**. **Se incluye además §0**,
que se firmó en la misma mesa y contiene las tres decisiones de
arquitectura de superficie — **entre ellas la que reconcilia la captura
autorizada con el bloqueo de capturas**, que gobierna directamente un
párrafo de §3. *Se declara el agregado en vez de hacerlo en silencio: sin
§0, C tendría que construir `FLAG_SECURE` contra una razón que no está
escrita en ningún lado.*

---

## §0 · Lo que entra, y las tres decisiones de arquitectura de superficie

**Entra a tanda 2:** el pre-join · la in-call real en las dos apps · el
botón «entrar» gateado por la RPC · el modal de dos alturas del
profesional (nota + historia clínica) · el cuadro congelado adjuntado a la
historia · el temporizador ascendente · el bitrate configurable ·
`FLAG_SECURE` solo en la pantalla de consulta · las cadenas de permiso
reescritas · el registro de asistencia por webhooks (registrar sin juzgar)
· y **las tres correcciones legales** que la respuesta del análisis trajo
(consentimiento con acto propio · LiveKit en la Política · T&C).

**Decisión ① — dos pantallas, no una con condicionales.** La in-call del
dueño y la del profesional viven en sus apps y **comparten solo las piezas
de video**. Las necesidades son opuestas: el profesional necesita
herramientas encima del video, el dueño necesita que no haya nada. Una
sola pantalla con `if (esVet)` termina cargando cada lado con el peso del
otro.

**Decisión ② — el cuadro congelado entra en ESTA tanda.** El video ya está
en pantalla acá; capturar un cuadro es leer lo que ya está. En tanda 3
costaría reabrir tres territorios. **Alcance cerrado:** el cuadro se
adjunta a la historia clínica como imagen del acto — no abre galería, no
abre editor, no se comparte.

**Decisión ③ — la captura autorizada y el bloqueo de capturas no se
contradicen, y la letra lo dice.** `FLAG_SECURE` impide la captura del
sistema; el cuadro congelado es una captura **del profesional, que queda
en el expediente y deja rastro**. Una sale del sistema sin registro; la
otra entra al registro. *(Y el límite honesto, que va escrito: `FLAG_SECURE`
no impide que alguien fotografíe la pantalla con otro teléfono. Bloquea el
camino fácil; no es una promesa de confidencialidad.)*

---

## ⚠️ DOS ENMIENDAS POSTERIORES A LA FIRMA — 26-ago-2026, mismo día

*Se marcan acá arriba, y la letra vieja queda **tachada en su lugar y no
borrada**. Este documento es un depósito VERBATIM: si se editara en silencio
dejaría de serlo, y la próxima pista no tendría cómo saber qué se firmó y qué
se corrigió.*

**① LOS MILISEGUNDOS SUELTOS SE REEMPLAZAN POR LOS TOKENS.** El documento
firmado decía `200 ms` y `250 ms`. **El founder ratificó los tokens por
encima de esos números:** el vocabulario del movimiento de la casa es cerrado
y firmado —`micro: 150` · `estandar: 300` · `grande: 520`— y los 200/250 eran
**intención de la mesa, no medición**. *Lo advirtió B, y tiene razón en la
forma: una pista que lee sólo este documento construye contra un número que no
existe en el sistema, y el resultado compila igual.*

**② EL TILE PROPIO SE SEPARA CON ANILLO, NO CON SOMBRA.** La mesa adoptó el
argumento de B: **una sombra no separa sobre fondo oscuro**, y un video en
vivo puede ser exactamente eso. Su anillo mide **4.11 contra negro puro**.
*La especificación original se escribió mirando un mock; el fondo no
controlado es justo lo que un mock no tiene.* **Es §1.2 aplicada a sí misma
—el video es fondo no controlado— dos párrafos después de enunciarla.**

---

## §1 · LA DIRECCIÓN DE ARTE — el contrato visual de las dos pantallas

**Esto no es sugerencia: es la vara contra la que el founder va a mirar la
app.** Lo que no esté acá lo decide la pista leyendo la skill del sistema
de diseño; lo que esté acá manda.

### 1.1 · La jerarquía, que no es negociable

**Lo que importa es que el profesional vea al animal y el dueño vea al
profesional.** Todo lo demás compite con eso. Cada elemento que se agregue
tiene que ganarse su lugar contra esa frase.

### 1.2 · El video es fondo no controlado

Un video en vivo es la misma clase de superficie que el mapa: **el fondo lo
pone la cámara de otra persona y puede ser cualquier cosa** — blanco,
negro, moteado, en movimiento. Todo control encima necesita su propio
tratamiento de contraste. **No se enmienda la ley del glifo: se nombra una
clase** —«control sobre video»— con su scrim propio, y esa clase se define
una vez y se reutiliza.

### 1.3 · El chrome se esconde

Los controles y el encabezado **se desvanecen a los 4 segundos sin toque**
y **vuelven con un toque en cualquier parte del video**. Desvanecido:
~~opacidad 0 en 200 ms~~ **opacidad 0 en `duration.micro` (150)**.
Aparición: ~~150 ms~~ **`duration.micro` (150)** *(enmienda ①)*. **Nunca se esconden:** el botón de
colgar (siempre alcanzable) y, en el profesional, el asa del modal.
*Cuando el vet está mirando una oreja, cada píxel de interfaz es una oreja
que no se ve.*

### 1.4 · El propio, en chico

Rectángulo redondeado en la **esquina superior derecha**, alto ~28 % de la
pantalla, esquinas del radio del sistema, ~~sombra suave~~ **ANILLO** para separarlo
del fondo no controlado *(enmienda ②: una sombra no separa sobre fondo
oscuro, y el video puede serlo — el anillo mide 4.11 contra negro puro)*.
**Tocarlo intercambia** propio y remoto con una transición de ~~250 ms~~
**`duration.estandar` (300)**. **Arrastrable** a cualquiera de las cuatro
esquinas, con imán: al soltar, viaja a la esquina más cercana en ~~200 ms~~
**`duration.micro` (150)** *(enmienda ①)*.

### 1.5 · El temporizador: ascendente, y por qué

**Sube, jamás baja.** `09:56`, no «te quedan 5 minutos». La letra firma que
la consulta se cobra aunque dure veinte segundos ⇒ **una cuenta regresiva
contradice la letra y presiona al profesional a estirar**. Tipografía
tabular (que no baile al cambiar el dígito), peso normal, **color neutro —
jamás rojo**: el rojo es alarma y acá no pasó nada malo. Sin punto
parpadeante de «grabando», porque no se graba.

### 1.6 · El estado de conexión: honesto y callado

Bajo el nombre, una línea discreta. Tres estados y **ninguno miente**:
buena · inestable · reconectando. **«Reconectando» es el único que puede
crecer** a una banda visible con su texto, porque es el único que el
usuario necesita entender para no colgar creyendo que se rompió.

### 1.7 · Las animaciones

Todo movimiento es **resorte suave, jamás rebote de juguete**. El modal
usa arrastre con inercia real. Entradas y salidas: ~~200–250 ms~~
**`duration.estandar` (300)** *(enmienda ①)*. **Nada
pulsa, nada late, nada llama la atención** — es una consulta médica, no una
app de juegos.

---

## §2 · LA PANTALLA DEL DUEÑO — «no hay nada, y eso es el diseño»

**Recorrido, en voz de usuario:** *«Toco entrar. Veo mi cámara y me
acomodo. Toco 'entrar a la consulta'. Aparece la doctora en toda la
pantalla y yo quedo chiquito arriba. Hablo con ella. Cuando me pide ver la
pata de Thor, giro la cámara con un botón que encuentro sin buscarlo.
Cuelgo cuando ella termina.»*

**Pre-join.** Preview de la cámara propia, nombre del profesional, un
botón primario «Entrar a la consulta», y **mic y cámara en el estado en que
van a entrar** (se pueden apagar antes). Si falta permiso, se pide acá —
nunca en medio de la llamada.

**In-call.**
- Video del profesional a pantalla completa. Propio en chico (§1.4).
- Arriba: nombre del profesional, estado de conexión, temporizador.
- Abajo, cuatro controles circulares: **micrófono · cámara · girar cámara ·
  colgar**. El de colgar es el único de color de acento; los otros son
  neutros sobre su scrim.
- 🔴 **«Girar cámara» va a ser el botón más usado de esta pantalla** —
  ambas cámaras arrancan frontales (firma del founder) y el momento de
  mostrar al animal llega en toda consulta. **Que sea obvio, grande y no se
  esconda junto al resto del chrome.**
- **La señal de la nota:** cuando el profesional está escribiendo, aparece
  una línea discreta y breve — *«La doctora está escribiendo en la historia
  de Thor»* — que **se desvanece sola a los 3 segundos**. Es una señal
  tranquilizadora («me están atendiendo de verdad»), **no un texto para
  leer**: sin el contenido de la nota, sin scroll, sin permanencia.
- **El dueño NO ve tarjetas de datos de su mascota** (firma del founder):
  ya conoce a su animal; lo que necesita es ver a la doctora.
- **Colgar pregunta una vez**, breve. Colgar sin querer en medio de una
  consulta paga es caro.

---

## §3 · LA PANTALLA DEL PROFESIONAL — el video y su mesa de trabajo

**Recorrido, en voz de usuario:** *«Entro y veo al animal. Mientras la
dueña me cuenta, subo a media altura la hoja de abajo y voy dictando lo que
observo — sigo viendo la piel en la mitad de arriba. Necesito saber si ya
tuvo esto: subo la hoja del todo, filtro la historia, leo, y la vuelvo a
bajar. Veo la lesión bien: congelo el cuadro y queda en su historia. Cierro
la nota y termino.»*

**El modal de abajo — DOS ALTURAS, no dos estados.**

| altura | qué se ve | para qué |
|---|---|---|
| **cerrado** | solo el asa | la llamada limpia |
| **medio (~50 %)** | el video sigue visible arriba | **dictar/escribir viendo al animal** — el caso real |
| **completo (~90 %)** | la mesa de trabajo | leer historia clínica |

- **Nunca sale de la pantalla ni tapa el video del todo** (firma del
  founder): aun en completo queda una franja de video arriba.
- Se arrastra por el asa **o por cualquier parte de su encabezado**, con
  imán a las tres posiciones. Arrastrar hacia abajo desde el tope lo baja;
  **jamás lo cierra por accidente si hay texto sin guardar** — ahí pide
  confirmación.
- **En medio**: la nota clínica — dictado y teclado, el mismo registro del
  Durante que ya existe. El dictado es el mismo camino ya construido, con
  su regla intacta: **la plataforma jamás sugiere medicamentos,
  tratamientos ni posologías**.
- **En completo**: la historia clínica de la mascota, **con filtros por
  fecha y por tipo de caso** (firma del founder). Lectura, no edición.
- El teclado **no empuja el video**: el modal crece por dentro.

**El cuadro congelado.** Botón en los controles del profesional. Toma el
**cuadro actual del video remoto**, muestra una confirmación mínima
(«¿Guardar en la historia de Thor?») y lo adjunta como imagen del acto, con
su marca de teleconsulta. **Un flash blanco de 120 ms** y nada más — la
llamada no se interrumpe. Si el adjunto falla, lo dice y no promete.

**`FLAG_SECURE` solo acá.** En la pantalla de consulta, encendido al
montar y **apagado al desmontar**. No en el resto de la app: si queda
encendido de más, el founder no puede sacar capturas para revisar diseño.

---

## LO QUE ESTA DIRECCIÓN **NO** DECIDE

*Se escribe para que nadie la cite como si lo hubiera decidido.*

- **El piso de calidad visual del video.** Lo firma el founder viendo un
  animal en pantalla, no un número en un documento. *(Los 1,5 Mbps de la
  §6 de `LETRA_TELEMEDICINA` son requisito de la CONEXIÓN del profesional,
  **no promesa de calidad del stream** — configurar menos bitrate no
  contradice la letra.)*
- **Los tokens concretos** de la clase «control sobre video»: los elige B
  con la skill en la mano y los declara con su contraste **verificado**,
  jamás asumido.
- **La voz de los textos**: el lote de strings lo lee el founder aparte.
- **Nada del encendido del servicio.** `tipos_servicio.telemedicina.reservable`
  sigue en `false`; **la llave es del founder y va última.**
