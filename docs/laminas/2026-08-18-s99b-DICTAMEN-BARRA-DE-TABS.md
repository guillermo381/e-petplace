# DICTAMEN — LA BARRA DE TABS CON VALLE Y DISCO

**Estatuto:** poder de rojo con guarda (mi vara: un rojo nombra la ley
rota, una pieza y una referencia concreta). **Esto no es un «no me
gusta»: son cinco condiciones, y cuatro tienen respuesta.**

**La referencia, con su lectura CORREGIDA:** no es una muesca restada —
son **DOS formas**: un **valle** cóncavo en el borde superior de la barra
y un **disco separado** que flota sobre él, del mismo color que la barra,
con un **hueco del color del fondo** entre los dos. Viajan juntos al
cambiar de tab y el valle se deforma asimétricamente en el camino: **la
barra es un solo vector que se deforma, no un botón que salta.**

---

## §0 · EL VEREDICTO, primero

**La forma es buena y el mecanismo es correcto. NO se puede montar hoy, y
NO por su dificultad: por una condición nuestra que la referencia no
tiene.** De las cinco advertencias, **cuatro se resuelven** y **una es
bloqueante y estructural**.

---

## §1 · 🔴 BLOQUEANTE — DOS MARCADORES PARA UNA MISMA COSA

**La huella ya marca el activo, con ley propia y firmada** (§2.6, S53:
*el pill murió, la huella activa hereda `accent.active`*). El valle+disco
marca **exactamente lo mismo**: dónde estás.

> **Dos marcadores del mismo estado no conviven: uno gana o uno muere.**
> Si conviven, la primera vez que discrepen —y van a discrepar, porque
> son dos mecanismos— la barra va a decir dos cosas a la vez.

**El camino que la mesa nombró —la huella ADENTRO del disco— es el
correcto, y lo firmo con una condición que lo vuelve barato:**

> **La huella deja de marcar el activo y pasa a HABITAR el disco.** El
> marcador único es el **disco**; la huella es lo que hay adentro. Una
> forma, un significado.

⚠️ **Y eso es enmienda de §2.6, que está firmada** — o sea que **no la
decido yo**: la sirvo con su literal y su costo. *Lo que no se puede
hacer es montar el disco «probando» y dejar los dos marcadores
conviviendo mientras tanto: ese estado intermedio es el defecto.*

---

## §2 · 🔴 BLOQUEANTE — ATENDER YA ES EL CENTRO, PERMANENTEMENTE

`BarraTabs` tiene **destino central por FORMA** (`destacada`, S97) y
**ATENDER está destacada de manera permanente**. La referencia tiene tres
tabs iguales y un solo elemento que sobresale: el disco activo.

> **Cuando ATENDER no esté activa, van a existir DOS cosas pidiendo ser
> el centro**: la destacada por forma y el disco por estado. *No es un
> choque estético: son dos jerarquías —importancia y ubicación— peleando
> por el mismo píxel.*

**Las dos salidas, y ninguna la elijo yo:**
1. **ATENDER deja de ser destacada permanente** — y entonces la barra
   pierde el gesto que S97 firmó.
2. **El disco NO viaja a ATENDER** (se queda como marcador de las
   demás) — y entonces el mecanismo miente: hay un tab activo sin
   marcador.

*Las dos tocan letra firmada. **Es decisión de mesa, y es la que ordena
si esto se construye o no.***

---

## §3 · ✅ RESUELTA — el valle viaja entre posiciones VARIABLES

**La objeción:** la barra se compone por CAPACIDAD y con L-251 el número
de destinos varía ⇒ el valle viaja entre posiciones que cambian.

**No es un problema: es la forma correcta de construirlo.** El valle no
se posiciona en «el tab 2 de 4» sino **en el centro del tab activo**, que
la barra ya calcula para la huella. **Con 3 o con 5 destinos, el cálculo
es el mismo** — y el vector se genera, no se dibuja a mano.

*La condición: el path del valle se DERIVA del ancho por tab. Un path
hardcodeado para 4 tabs es exactamente el defecto que la objeción teme,
y es evitable escribiéndolo bien la primera vez.*

---

## §4 · ✅ RESUELTA CON NÚMERO — el valle come alto del contenido

**Sí, y es un costo real:** el valle sube ~10-12 dp sobre el borde y el
disco otros ~14 ⇒ la barra pasa a ocupar **~26 dp más de alto visual**.

**Se resuelve declarando qué NO cede:** el blanco de 44 del target y el
`insets.bottom` **no se tocan** (ley de la pieza). Lo que crece es la
zona superior, y **eso lo paga el contenido, no la accesibilidad**.

*Es un costo aceptable y medible; no es una objeción bloqueante.*

---

## §5 · 🔴 LA MÁS FINA, Y LA QUE HABRÍA EXPLOTADO EN PRODUCCIÓN — el hueco conoce el fondo

**La objeción es exacta:** el hueco entre valle y disco es **del color
del fondo**, así que **la pieza tiene que CONOCER el fondo sobre el que
se apoya**.

**Y en esta casa eso no se cumple, medido:** el fondo bajo la barra
cambia por **tema** (light/dark/memorial), por **casa de oficio**, y —lo
que lo mata— **por pantalla**: el papel tapiz del prestador, el muro del
techo, una foto a sangre. **La barra flota sobre contenido que no
elige.**

> **Un hueco pintado del color equivocado no se degrada: se ve como una
> mancha con forma de media luna.** Y su modo de falla es el peor de
> todos: **funciona en la pantalla donde se lo probó.**

**LA SALIDA, y es la única que no depende de adivinar el fondo:** el
hueco **no se pinta — se RECORTA**. Un `Path` con `fill-rule="evenodd"`
(o una máscara) que **quita** material de la barra deja pasar lo que haya
debajo, sea lo que sea.

*Y esto no es un detalle de implementación: **es la diferencia entre una
pieza que funciona sobre cualquier fondo y una que hay que revisar cada
vez que alguien cambia una pantalla.*** La referencia probablemente
pinta, porque su app controla su fondo. **Nosotros no.**

---

## §6 · LO QUE PIDO PARA MOVERME

**Dos firmas de mesa** (§1 y §2), en este orden — la segunda decide si
esto existe:

1. **¿La huella pasa a habitar el disco?** (enmienda de §2.6)
2. **¿Qué cede: la destacada permanente de ATENDER, o el viaje del
   disco?** (enmienda de §15b o de S97)

**Con esas dos, lo construyo** — §3, §4 y §5 ya tienen respuesta y el §5
además deja la pieza mejor de lo que estaba.

**⚠️ Lo que NO voy a hacer sin ellas, y lo digo ahora:** montar el disco
«para ver cómo queda» dejando la huella marcando en paralelo. *Ese
prototipo se vería bien en la pantalla donde lo mire el founder y sería
exactamente el estado que §1 declara imposible.*
