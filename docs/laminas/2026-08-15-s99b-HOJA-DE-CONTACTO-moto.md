# HOJA DE CONTACTO · el glifo `moto` — S99-B

**Estándar:** `DIRECCION_ARTE` §6b (proceso firmado S71) · **Gate: POR
ÍCONO, del founder** (§6b.5 — nunca por lote).
> # 🔴 v2 · EL GATE FALLÓ Y EL BRIEF ESTABA MAL (15-ago)
>
> **Firma del founder, verbatim:** *«no me gusta ninguno de los tres,
> copiemos el como los pone Rappi, algo que se vea bien en el mapa. Si me
> toca escoger sería el A, aunque parece más una bicicleta que una
> moto.»*
>
> **EL DIAGNÓSTICO NO ES DEL DIBUJO: ES DEL BRIEF.** Las tres se pensaron
> como **glifo de la casa** —trazo 1.9, objeto de interfaz— y su destino
> es otro: **vivir DENTRO DE UN PIN, a 21 px, sobre un mapa con calles y
> colores debajo.** A ese tamaño y sobre fondo con textura **el trazo
> desaparece y solo sobrevive la MASA.** El marcador de repartidor de la
> referencia no es un ícono de línea: es una **silueta RELLENA de alto
> contraste dentro de un pin**.
>
> **⚠️ MI ERROR, CONCRETO, porque §6b me daba la herramienta y no la usé:**
> hice el estudio de familia por los números de la casa **sin preguntarme
> si esa familia aplicaba**. §6b.1 pide declarar el desvío — declaré uno
> (la densidad de A) y **no vi que el desvío era el marco entero**. Y
> §6b.4 dice *«el glifo se juzga EN VECINDAD»*: **monté la vecindad del
> REGISTRY cuando el vecino real de este glifo es el MAPA.**
>
> **⚠️ Y ASIGNÉ MAL EL RIESGO:** puse *«puede leerse como bicicleta»* en la
> candidata **C**, y el founder lo leyó en **A**. ⇒ *no era riesgo de UNA
> candidata: era del ENFOQUE.* **Un dos-ruedas en línea se lee como
> bicicleta sea cual sea el trazo** — por eso el discriminador que la mesa
> dictó no es de detalle: **es la MASA del motor y la rueda gruesa.**
>
> ## 🔴 EL CHOQUE CONTRA LEY FIRMADA, DECLARADO
> La regla madre (Ley 12 · b′) dice **«objeto del oficio en TRAZO + UNA
> huella rellena»**. Un pin-moto de silueta la contradice. Dos salidas:
> **(a)** el pin de mapa es **CLASE APARTE** del registry, con su propia
> física, y la regla de trazo no le aplica **porque el mapa no es
> interfaz: es mundo** · **(b)** la regla se enmienda para admitir relleno
> sobre fondo no-controlado.
>
> **MI VOTO: (a), y con un argumento que no es de criterio sino MEDIDO —
> la clase (a) no hay que inventarla: el mapa YA la tenía sin escribir.**
> Las dos marcas que la casa dibuja sobre un mapa **ya son MASA, no
> trazo**: el marcador vivo de `MapaRecorrido` es `backgroundColor` +
> anillo blanco, y el punto de `PinMovible` es `backgroundColor` + anillo.
> **Ninguna de las dos es un glifo de trazo.** *(a) no abre una puerta:
> pone por escrito la que el mapa venía usando.*
>
> **Y por qué (b) es peor, que es la mitad que decide:** *«fondo
> no-controlado»* **no es una condición acotada** — toda foto, todo
> gradiente, todo póster de video lo son. Enmendar la regla madre con esa
> condición **deja entrar el relleno por una puerta que después nadie
> puede cerrar.** (a) está acotada por construcción: **el pin vive en UNA
> pieza, y las piezas se cuentan.** *(Es la tercera vez que la casa elige
> la razón angosta sobre estirar una viva: `no_aplica` como cuarto estado,
> y la huella-discriminador de esta misma sesión.)*
>
> ## LAS TRES NUEVAS, con su riesgo
> **D · scooter con caja** — la que más dice **reparto**, no solo
> vehículo. Riesgo: la caja es masa extra arriba; a 21 px puede engordar
> la silueta y perder la lectura de «moto».
> **E · la moto sola** — el vehículo puro, silueta más limpia. Riesgo: sin
> la caja dice **«alguien en moto»**, no **«tu pedido en camino»**.
> **F · la masa mínima** — lo único que sobrevive sin un detalle. Riesgo:
> puede leerse como **mancha** antes que como moto; es la apuesta a que
> la silueta sola alcance.
> **Mi voto: D**, y cambio de criterio respecto de la v1 con su razón —
> *en la v1 voté por lo que sobrevivía al tamaño; acá las tres sobreviven
> porque son masa, así que gana la que dice más: la caja es lo único que
> distingue «un repartidor» de «una moto».*
>
> ## EL MONTAJE, corregido
> **21 y 44 px · DENTRO del anillo del pin · sobre CUATRO tonos de mapa**
> (asfalto · parque · agua · mapa oscuro), **jamás sobre lienzo blanco** —
> que fue el error de la v1. ⚠️ El montaje **clona la anatomía de
> `PinEnMapa`** a propósito y se declara: la pieza no tiene la variante
> todavía —meterla antes del gate pondría un glifo sin firma en el
> registry— y **una masa juzgada fuera de su anillo no es la que se va a
> ver.**
>
> ---

**Estado:** ⏪ **LAS TRES DE ABAJO (A · B · C) FALLARON SU GATE.** Se
conservan enteras porque su estudio sigue siendo válido como método y
porque el error del brief solo se entiende viendo contra qué se dibujó.
**Estado original:** CANDIDATAS. **Ninguna está en el registry** y es a propósito:
un glifo entra a `IconoNombre` cuando pasa su gate, no antes — si entrara
ahora, R17 lo exigiría en la galería y el set crecería sin firma.

**Quién lo pide y para qué:** `PinEnMapa` (S99-B · N14) tiene hoy UNA
variante, `mascota`. N14 pide dos: *«paseo = la cara/avatar de la mascota
· entrega = la moto»*. **El pin de entrega es la mitad que falta de L6**
(pedido de D).

---

## §6b.1 · ESTUDIO DE FAMILIA, EN NÚMEROS

Leídos del registry vivo (`Icono.tsx`), no de memoria:

| parámetro | valor de la casa | las candidatas |
|---|---|---|
| grilla | **24** | 24 ✅ |
| trazo | **1.9 `round`** (`TRAZO`) | 1.9 ✅ |
| densidad | **2-4 trazos** | A: 4 · B: 3 · C: 3 ✅ |
| aire al borde | **~3.4** | ≥3.2 ✅ |
| huella | escala por tamaño | **ninguna — ver §6b.6** |

**Desvío declarado, uno:** la variante **A** llega a **4 elementos**, el
techo de la banda. No se disimula: es el precio de que una moto se lea
como moto. Si el founder la elige, queda en el techo y se dice.

---

## §6b.2 · METÁFORAS OCUPADAS (censadas antes de dibujar)

| objeto | ya lo usa | riesgo para `moto` |
|---|---|---|
| **el pin de gota** | `ubicacion` | 🔴 **ALTO** — es el vecino peligroso: `moto` va a vivir DENTRO de un pin. Ninguna candidata dibuja una gota |
| **dos círculos pares** | `prime` (2 `Circle`) · `grooming` (2, las hojas de la tijera) | 🟡 medio — las ruedas son dos círculos. Se separa por PROPORCIÓN: las ruedas van abajo y alineadas, no concéntricas ni cruzadas |
| **un círculo solo** | `training` (el silbato) | 🟢 bajo |
| **casco / cabeza** | *libre* — ningún glifo del set dibuja una cabeza humana | 🟢 y con una nota: **§2 del set prohíbe figuras humanas** (la tab Cuenta es una placa de collar, no una persona). Un casco **no es una figura humana**, pero roza la regla y por eso la variante B lo declara |

**Y la colisión que NO es de dibujo sino de sentido:** el registry ya
tiene `despensa` (el frente de productos). `moto` **no es** «la despensa»
ni «el pedido»: es **quién lo está llevando ahora**. Se dibuja el
vehículo, jamás una bolsa ni una caja — eso sería el pedido otra vez.

---

## §6b.6 · ¿ES GLIFO DE CONTROL? — LA DECISIÓN QUE VA ANTES DEL LÁPIZ

> §6b.6 (firma S98) obliga a declararlo **antes de dibujar**: *«llegar al
> gate con la huella puesta obliga a rehacer el dibujo por una decisión
> que se podía tomar antes de levantar el lápiz.»*

**🔴 PROPUESTA: `moto` VA SIN HUELLA — y NO por la razón de `info`.**

`info` e `ia` van sin huella porque **son interfaz** (*«en un glifo de
control no hay mascota, hay interfaz»*). `moto` no es interfaz: es un
objeto del mundo, como el estetoscopio o la correa. Por la Ley 12 le
tocaría huella.

**La razón por la que igual no la lleva es OTRA, y es la que pido que la
mesa juzgue:**

> **En el par de pines, la huella ES el discriminador.** `PinEnMapa`
> tiene dos variantes y su trabajo entero es decir **quién se está
> moviendo**: la de paseo lleva la cara de la mascota; la de entrega
> tiene que decir *«esto NO es tu mascota, es quien trae tu pedido»*.
> **Poner una huella en las dos anula la única diferencia que el pin
> existe para mostrar.**

Y una razón de tamaño que la respalda: el glifo vive a ~24 px **adentro
de un pin de 45**, sobre un mapa de contraste impredecible. La Ley 9
afilada dice *a 21px la huella sobrevive o es ruido*; con 3-4 trazos de
moto ya ocupados, la huella entra como cuarto o quinto elemento en la
zona más chica del set.

**⇒ A la mesa, con las dos salidas servidas:**
① **la categoría «glifo de control» se ENSANCHA** a *«glifos donde la
huella no significa»*, y `moto` entra ahí · ② **nace una segunda razón
declarada** —*la huella no se pone donde es el discriminador de un par*—
y la categoría de control queda intacta.
**Mi voto: ②.** *Ensanchar «control» para que aloje un vehículo le saca
a esa palabra lo que la hacía útil; la regla nueva es más angosta y dice
la verdad de por qué.*

---

## §6b.3 · LAS TRES VARIANTES, CON SU RIESGO

### A · LA MOTO DE PERFIL — dos ruedas + cuadro + manubrio
La silueta lateral completa. **4 elementos** (el techo de la banda).
- ✅ **Es la más inequívoca**: nadie la confunde con otra cosa.
- 🔴 **RIESGO — la densidad a 21 px.** Cuatro trazos en 24 de grilla, y
  dos de ellos son círculos chicos: es la candidata que puede empastarse
  justo en el tamaño donde va a vivir.
- 🟡 Riesgo menor: a tamaño chico las dos ruedas pueden leerse como
  `prime` (dos círculos) si el cuadro se pierde.

### B · EL CASCO — la cúpula + la visera
**3 elementos.** Dice *«el repartidor»* más que *«el vehículo»*.
- ✅ **La más limpia a 21 px** — formas grandes, cero detalle fino.
- 🔴 **RIESGO — dice la PERSONA, no el vehículo.** El pin marca dónde
  está **una moto en movimiento**; un casco puede leerse como «perfil de
  repartidor» y competir con la idea de posición.
- 🔴 **Y roza §2 del set**: no es una figura humana, pero es lo más
  cerca que el set estuvo nunca de una. **Se declara: si la mesa lee el
  casco como figura humana, B muere ahí y no se discute.**

### C · LAS DOS RUEDAS Y EL MANUBRIO — la moto reducida
**3 elementos.** Las dos ruedas abajo y el manillar arriba; el cuadro se
insinúa con una sola línea.
- ✅ **El mejor equilibrio densidad/claridad** para el tamaño en que vive.
- ✅ Conserva «vehículo» sin dibujar una persona.
- 🟡 **RIESGO — puede leerse como bicicleta.** Y hay que decir que **en
  este producto no es un error caro**: la letra dice *moto propia*, pero
  lo que el pin comunica es **«alguien está yendo hacia vos en un
  vehículo»**. Si el día de mañana entra otro vehículo, C sobrevive.
- 🟡 Riesgo de vecindad: comparte «dos círculos» con `prime`; se separa
  porque las ruedas están **alineadas abajo** y las de `prime`
  concéntricas.

**Mi voto: C**, con A como segunda. *C es la que sigue funcionando en el
único tamaño en el que este glifo va a existir de verdad.*

---

## §6b.4 · EL MONTAJE

Las tres viven en la galería, sección **«Hoja de contacto · moto
(CANDIDATAS)»**: a **21 px y 44 px**, en **claro y oscuro**, y **junto a
cinco del registry** (`paseo` · `despensa` · `ubicacion` · `training` ·
`prime`) — los cinco elegidos por vecindad real: los dos primeros son los
oficios que rodean la entrega, y los tres últimos son las colisiones
mapeadas en §6b.2. **Un glifo se juzga EN VECINDAD.**

---

## LO QUE ESTE DOCUMENTO NO HACE

**No elige.** Sirve tres candidatas con su riesgo y un voto. **La firma es
del founder, por ícono** (§6b.5), y hasta que llegue el pin de entrega
**no existe** — `PinEnMapa` tiene una sola variante y su cabecera dice por
qué, para que nadie lo lea como olvido.
