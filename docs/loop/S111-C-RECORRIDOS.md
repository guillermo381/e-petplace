# S111-C · LOS RECORRIDOS, EN VOZ DE USUARIO — escritos ANTES de construir

> Quedan acá para el recorrido del founder a su vuelta. Cada bloque se construye
> **contra esto**, caminos tristes incluidos.

---

## BLOQUE 2 · «NO TENGO MASCOTA, QUIERO ADOPTAR»

### Lo que hoy pasa, medido (S110-D, LOTE 1)

> **152 de 170 usuarios no tienen ninguna mascota.** El motor los representa
> como ciudadanos de primera clase —`get_estado_onboarding_dueno` devuelve
> `mascotas_count` explícito— **y la app no los deja entrar**: `index.tsx:64`
> ramifica por `tiene_familia`, `hogar` rebota a `/`, y del onboarding sólo se
> sale **creando una mascota**. *Es un lazo cerrado.*
>
> Y `mascotas_count` **viaja del motor al wrapper y ninguna pantalla lo lee**:
> `L-318` en su forma exacta — el número que contesta la pregunta existe, viaja,
> y nadie lo mira.

### EL RECORRIDO, en mi voz

«Vi una foto de un perro en Instagram y llegué acá. Todavía no tengo mascota
—por eso vine—. Me registro con mi correo, y en vez de pedirme la especie de un
animal que no tengo, la app me pregunta **a qué vine**. Toco *«quiero adoptar»*
y entro.

Adentro no me encuentro una pantalla rota ni un formulario a medio llenar: me
encuentro **mi casa vacía, y lo dice sin disculparse** — todavía no hay nadie
acá, y hay un camino claro para conocer a los que esperan. No me apura, no me
felicita, no me cuenta cuántos pasos me faltan.

**El Coach no me habla.** No sabe nada de mí todavía y no tiene de quién
hablarme: prefiero su silencio a un saludo genérico.

El día que adopte, esa casa se llena y el resto de la app —el expediente, los
servicios, las alertas— aparece **porque ya hay de quién.**»

### LOS CAMINOS TRISTES

«**Me registro para adoptar y me arrepiento.** No pasa nada: la cuenta existe,
mi casa sigue vacía y puedo dar de alta a la mascota que ya tenía cuando quiera.
La puerta no se cierra detrás de mí.»

«**Entro sin cuenta a mirar y me gusta uno.** Al postular me pide crear cuenta —
y no pierdo lo que estaba mirando. *Que me devuelvan al principio de la lista
después de registrarme sería castigarme por haberme decidido.*»

«**Tengo cuenta desde antes, sin mascota** (soy uno de los 152). Al abrir la app
entro igual que cualquiera, a mi casa vacía, en vez de quedar dando vueltas en
un alta que no quiero completar.»

### 🔴 LO QUE ESTE BLOQUE **NO** HACE, y no es recorte

**La vidriera de adopción no se construye todavía: no tiene motor.** Medido —
cero funciones de adopción/adoptable/padrinazgo/refugio en las 369 migraciones
con `CREATE FUNCTION`, y cero wrappers en `packages/api`. *Una vidriera sin
lector es un estante vacío con nombre bonito.* Pedido a A por buzón.

**Lo que sí se construye es la mitad que no depende de nadie** — el estado
«cuenta sin mascota» — y es la que desbloquea a los 152. *Construir la vidriera
encima del freno sería fabricar la pantalla que no puede llenarse.*

### LO QUE EXIGE, concreto

1. **El guard cambia de PREGUNTA.** Hoy pregunta *«¿tiene familia?»* y manda al
   onboarding. Tiene que preguntar *«¿terminó de entrar?»* — y una cuenta sin
   mascota **ya entró**.
2. **El alta pregunta A QUÉ VINO** antes de pedir una especie, y una de las
   respuestas crea la cuenta **sin mascota**.
3. **El hogar tiene su vacío honesto**, con camino y sin disculpa (Ley 17.5).
4. **El Coach calla sin mascota** (decidido) — *un coach que saluda sin conocer
   a nadie enseña a ignorarlo.*

---

## BLOQUE 3 · EL PORTAL DEL PUBLICADOR — la voz del refugio

### EL RECORRIDO, en voz de quien maneja el refugio

«Abro la app y **lo primero que veo es cuántas solicitudes tengo por revisar**,
con su número. Ése es mi trabajo del día: gente esperando que le conteste.

Más abajo veo lo que llegó — que alguien apadrinó a Luna, que llegó una
donación —. **Eso me alegra el día, pero no me pide nada.** Por eso está abajo y
**no tiene número**: si tuviera, yo estaría mirando un contador que nunca baja y
dejaría de ver el que sí tengo que bajar a cero.

En **Mascotas** están mis animales —no «mis publicaciones»: son animales—. Subo
uno nuevo, corrijo la descripción del que ya está, **pauso** al que tiene
adopción encaminada sin bajarlo, y bajo al que ya se fue.

**Y acá está lo que ningún lado me deja hacer:** le cargo al expediente lo que
sé. La castración con su fecha. Las vacunas con su lote. El tratamiento de
sarna que terminó en marzo. Cómo se porta con otros perros. **La historia de
cómo llegó.** No para adornar la ficha: porque el día que alguien lo adopte,
**se lleva todo eso** — y hoy se lleva un animal y, con suerte, un PDF.»

### LOS CAMINOS TRISTES

«**Contesté todas las solicitudes.** El contador está en cero y la pantalla no
me inventa trabajo: me dice que estoy al día, sin fanfarria.»

«**Subí una mascota y me faltan datos.** No me frena: la ficha existe con lo que
sé, y lo que falta se ve como falta — *sin datos inventados y sin barras de
progreso que me digan que estoy al 60 % de algo.*»

«**Pausé a un animal y alguien ya había postulado.** La solicitud sigue viva:
pausar deja de mostrarlo a los que miran, **no cancela conversaciones que ya
empezaron.** *Pausar es dejar de ofrecer; cancelar es otra cosa y no la hago sin
querer.*»

---

## BLOQUE 4 · EL CLIENTE — de la solicitud a la vida nueva

### EL RECORRIDO, en mi voz

«Encontré a Luna. Postulo, y el formulario **es el que armó su refugio** — no
uno genérico. Y me llega **una respuesta automática que ellos escribieron**, así
que sé que llegó.

Después hablamos **acá adentro**. Veo en qué estado está: recibida · en
conversación · aceptada · declinada. **No es un chat perdido en Instagram donde
mi mensaje se hunde entre historias.**

🔴 **Y si no me contestan, no me quedo colgado.** A los cinco días **la app me
dice que el refugio no respondió.** No me lo maquilla ni me dice «paciencia».

Cuando me aceptan, no termina en un «felicitaciones»: **empieza el final de
verdad.** Veo los avisos del animal —lo que tengo que saber antes de llevármelo,
no después—. Firmamos el acta, ellos y yo. Y ahí pasa lo que hace distinto a
esto: **el expediente de Luna se viene conmigo.** Su castración, sus vacunas con
lote, el tratamiento que terminó en marzo, cómo se porta con otros perros. **No
empieza de cero el día que la traigo a casa.**

En su línea de vida queda el hito: **«Una vida nueva empieza»** — y vuelve cada
año. Y el refugio queda ahí para siempre como **de dónde vino**, no como un
trámite que se archiva.»

### EL PADRINAZGO, en mi voz

«No puedo adoptar, pero puedo mandarle comida. Entro a la canasta de su refugio
—**lo que ellos marcaron que necesitan**, no una lista que inventé yo— y elijo
un saco al mes.

**Recibo fotos de Luna. Nada más, y me alcanza.** No quiero un descuento: si me
dieran uno, esto sería una compra.

🔴 **Y el día que Luna sea adoptada, mi cobro se detiene solo.** Me llegan el
aviso y el correo: la adoptaron. Me agradecen. Me preguntan si quiero apadrinar
a otro. **Nadie me sigue cobrando por inercia por un animal que ya tiene casa**
— y no me cuentan quién la adoptó, que no es asunto mío.

Y si quiero cortar, lo hago **donde corto todo lo demás**: en *Pagos recurrentes
y suscripciones*. No tengo que aprender un lugar nuevo.»

### LOS CAMINOS TRISTES

«**Me declinaron.** Me lo dicen, con la voz del refugio. No me dejan viendo
«en conversación» para siempre, y **no me humillan.**»

«**Postulé a dos y me aceptaron los dos.** Son dos conversaciones distintas y
ninguna se cierra sola: *la plataforma no decide por mí ni por ellos.*»

«**Doné y quiero saber a dónde fue.** El destino es un dato del objeto —una
mascota, un refugio, o abierta— **no tres flujos distintos.** Si elegí abierta,
e-PetPlace la cruza y me dice a dónde fue.»

---

## 🔴 EL FRENO QUE COMPARTEN LOS BLOQUES 2 (mitad), 3 Y 4

**Todo esto necesita el motor de adopción, y no existe.** Medido: **0 funciones**
`adopc*`/`adoptable*`/`padrinazgo*`/`refugio*` sobre 369 migraciones con
`CREATE FUNCTION`, y **0 wrappers** en `packages/api`.

**Lo que SÍ existe y espera:** `Convivencia` de B —los tres estados, con el
tercero con voz propia— y `packages/mensajeria` de D. *Las dos piezas están y
ninguna tiene de qué hablar todavía.*

⚠️ **Y por eso estos recorridos se escriben ahora y no después:** son lo que
hace que, cuando el motor llegue, la construcción no tenga que inventar el QUÉ.
*El recorrido escrito antes es la diferencia entre montar un contrato y adivinar
un producto.*

---

# GATE DEL FOUNDER · PRIMERA PASADA — los recorridos de ⑧ y ⑨

## ⑧ · EL DURANTE DENTRO DE LA GUARDERÍA

### QUÉ SE HEREDA DE VERDAD, medido antes de escribir una línea

*El brief lo pidió así porque la letra dice «hereda su motor entero» y eso es
cierto a medias.*

| pieza | ¿existe? |
|---|---|
| `publicarMediaGuarderia({ mascotaIds: string[] })` | ✅ **multi-destino, un envío** |
| `useCapturaMedia.capturarFoto` | ✅ |
| `cola-media` con `CLIP_TECHO_S = 30` | ✅ **la cola sabe de clips** |
| `EvidenciaFoto` · reglas de `encuadre.ts` | ✅ |
| **`capturarClip` en el hook** | ❌ **falta** — la cola lo acepta, nadie lo captura |
| **chips de comportamiento de guardería** | ❌ **no hay motor** |
| **la pantalla del durante** | ❌ |

🔴 **El multi-destino ya está resuelto en el motor y es la mitad grande:** una
foto con `mascotaIds: [a, b, c]` es **UN envío con tres destinatarios**, no tres
envíos. *No hay que construirlo — hay que no romperlo.*

### EL RECORRIDO, en voz del cuidador

«Son las once y están todos en el patio. Saco el teléfono, **una foto**, y ahí
mismo **toco quiénes salen en ella** — Thor, Luna y Kira. Una foto, tres
familias, un solo toque de envío.

Si algo se ve mejor moviéndose, **grabo un clip corto**. La app me corta sola a
los treinta segundos: no tengo que mirar el reloj mientras filmo un perro.

**No me pide que escriba nada.** Estoy con los animales, no con el teléfono.

Y sé que las familias no reciben una alarma por cada foto: **les llega un
resumen**. Si mando ocho fotos en la mañana, ninguna familia recibe ocho
alertas.»

### LOS CAMINOS TRISTES

«**Saqué una foto y salió una persona.** La descarto ahí mismo, antes de enviar
— y la app me lo recuerda **antes de disparar**, no después.»

«**Me equivoqué de animal al etiquetar.** Lo corrijo mientras no haya salido.
Después no: ya está en el expediente de alguien.»

«**No hay señal en el patio.** Sigo sacando fotos y salen solas cuando vuelve.
La cola ya hace eso.»

### 🔴 LO QUE NO SE CONSTRUYE Y SU MOTIVO

**Los chips de comportamiento.** Medido: existen `cat_conductas_bitacora`
(adiestramiento) y los nueve registrables de grooming, **y ninguno es de
guardería**. *Reusar el vocabulario del adiestramiento acá sería trasplantar un
criterio correcto a otra pregunta* — el mismo error que `D-976` nombra. **Van
con su motor; pedido a A.**

---

## ⑨ · EL ORDEN DEL DÍA

### EL RECORRIDO, en voz del cuidador

«La lista sale **ordenada por la franja que cada familia acordó** — el de las
7:00 antes que el de las 8:30. Ése es el orden natural del día.

Pero yo sé que hoy conviene pasar primero por Luna porque me queda de camino.
**Muevo su tarjeta arriba con el dedo** y listo. **Ese orden es mi viaje**: la
barra y la lista lo respetan.

Si cierro y abro la app, **mi orden sigue ahí**. No vuelvo a acomodar seis
tarjetas cada vez que atiendo el teléfono.»

### LOS CAMINOS TRISTES

«**Mañana es otro día y otro orden.** El de hoy no se arrastra: cada día se
acomoda solo por franja y yo decido si lo muevo.»

«**Entró una reserva nueva a mitad del día.** Aparece en su lugar por franja,
no al final ni arriba de todo — *el orden que yo moví se respeta, y lo nuevo
entra donde le toca por hora.*»

### 🔴 LO QUE NO SE CONSTRUYE, y tiene ficha

**Ningún motor de ruteo.** Nada de optimizar recorrido, calcular distancias ni
proponer orden. *Una ruta optimizada es un producto en sí mismo* —lo dice el
brief de S107 y lo firmó el founder como «v1 sin ruta»—. **El cuidador ordena;
la app recuerda.**

### DÓNDE VIVE ESE ORDEN, y por qué ahí

**Local, junto al viaje** (`viaje-guarderia.ts`). *El orden del viaje es de ESTE
teléfono y ESTE día*, igual que el tramo que se está siguiendo: no es un dato
del negocio ni algo que otra persona del refugio deba heredar. **Y perderlo
cuesta un gesto, no un dato.**
