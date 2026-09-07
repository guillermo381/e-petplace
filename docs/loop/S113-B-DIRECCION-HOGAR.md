# El Hogar con el lenguaje del tablero — dirección para C

**Sobre capturas reales** de la cuenta del founder (`07-hogar-antes-arriba.png` ·
`08-hogar-antes-abajo.png`, 7-sep-2026, emulador). Once decisiones, cada una con
su porqué y su cómo. **Es la pantalla que más se abre y quedó con el diseño
viejo**: acá hay tres lenguajes conviviendo.

> La vara es la misma que en el perfil: **rótulo chico · dato grande · contexto
> al pie**, aire por jerarquía y no por relleno, y **ningún número que mida una
> deuda**.

---

## ① El techo se come el 37 % de la pantalla para decir cuatro cosas

Del borde superior a «Ponte al día» hay **740 px de 2000** ocupados por logo,
fecha, saludo y la tira. *Es el mismo caso que el hero del perfil, que pasó de
~340 a ~120 sin perder nada.*

**Cómo:** el saludo y la fecha en una sola línea; la tira **sale del gradiente**
y baja a papel. El gradiente queda como una banda corta de identidad, no como
media pantalla.

## ② Las fotos de las mascotas compiten contra el gradiente

Sobre un fondo saturado, cuatro retratos con borde blanco pelean por atención —
y el cuarto, cortado, **se lee como un error de recorte** en vez de como una
invitación a deslizar. Sobre papel, el corte se lee bien.

## ③ 🔴 «pulgas · 01 oct 2026» es un dato HUÉRFANO

Flota debajo de la tira, en mono, **sin decir de qué mascota es**. Y ése es el
peor tipo de dato suelto: *no parece de una, parece de todas.*

**Cómo:** o vive dentro de la ficha de su mascota, o no existe. *Un dato sin
sujeto no informa: obliga a adivinar.*

## ④ 🔴 «17 cosas» y «Ver 164 más» son contadores de DEUDA

Es exactamente lo que el tablero del perfil sacó cuando murió el anillo: *un
número que sólo puede crecer se lee como reproche, y el día que baje nadie lo
va a celebrar.* **17 cosas pendientes no es un estado: es una lista de deberes.**

**Cómo:** el rótulo dice qué hay, no cuánto falta — «Ponte al día» a secas, y el
pie revela con la voz que ya usa el resto de la casa («Ver más»), sin número.

## ⑤ Las filas de «Ponte al día» inventan una capa que no existe

Sus glifos van en **pastilla verde-agua**, un color que no aparece en ningún
otro lugar del lenguaje nuevo. En el tablero **el glifo va en tinta y sin
píldora detrás**.

## ⑥ «En vivo» lleva DOS marcas para una sola cosa

Contorno verde completo **más** la píldora encima del borde. *Dos marcas para el
mismo hecho no refuerzan: compiten, y la píldora encima del trazo se lee como
un pegote.* **Cómo:** la píldora sola, sobre tarjeta normal — es la que ya
significa «en vivo» en el resto de la casa.

## ⑦ 🔴 «Tus servicios» trunca TRES de cuatro

«Adiestramien…» · «07 sept 20…» · «Ve…». Y el dato es de una unidad distinta en
cada tarjeta —una fecha, «63 salidas», «28…»— **sin un rótulo que diga qué es**.

**Cómo:** la anatomía del tablero, tal cual: **rótulo chico arriba (Paseos) ·
dato grande (63) · contexto al pie (salidas este año)**. Con el dato en 18 y el
contexto en 11, entra sin cortar — está medido en el perfil.

## ⑧ La marca de agua compite con los chips

Los dos anillos del isotipo detrás de «Tu vida» **se leen**. A 5 % no deberían;
acá dibujan dos círculos que el ojo persigue.

## ⑨ El chip activo tiene una pata flotando fuera de su caja

En «Todo», la pata magenta cae **encima del borde superior** y se ve como un
glitch. *Un adorno que sale de su caja se lee como algo que se rompió.*

## ⑩ 🔴 «Momento de cuidado» no dice QUÉ es, ni de quién

Tres filas seguidas con la misma voz genérica y **sin nombre de mascota**. Es el
mismo defecto que el «hoy» genérico que el 2.2.1 volvió inexpresable: *si la
fila no dice qué pasó y a quién, ocupa el lugar más caro sin informar.*

**Cómo:** la voz nombra el hecho y la mascota («Zeus salió a pasear»). Si el
dato no alcanza para eso, **la fila no se dibuja**: mejor tres filas ciertas que
diez que hay que abrir para entender.

## ⑪ El orbe de Nexo tapa el contenido, dos veces

En las dos capturas se dibuja **encima** de «Ver cómo va» y de «Ver 164 más».
*Una presencia que flota tiene que respetar el pie de la lista* — el scroll
necesita su respiro inferior, como el `insets.bottom` que la casa ya aplica.

---

### El orden que yo seguiría

**⑦ y ⑩ primero** (son los que hacen que la pantalla no informe), después **④ y
⑥** (los que la hacen sonar a reproche o a ruido), después el aire (**① ② ⑧ ⑨
⑪**), y **③** cuando se decida de quién es esa fecha.

⚠️ **Lo que NO toca esta dirección:** qué secciones hay ni en qué orden. Eso lo
firma la mesa; acá sólo está cómo se ven las que hay.

---

# El ORDEN de la pantalla (pedido de la mesa, 7-sep-2026)

**Hoy:** techo · Ponte al día · En vivo · ¿Compraste en el local? · Tus
servicios · Agregar/Adoptar · Tu vida.

## 🔴 La que cambia algo de verdad: EN VIVO va ARRIBA de PONTE AL DÍA

Hoy **una lista de 17 pendientes tapa un paseo que está ocurriendo**. Eso no es
una preferencia de orden: *lo que está pasando AHORA es lo único de la pantalla
que caduca — un pendiente sigue ahí en diez minutos; un paseo en curso, no.* Y
la familia que abre la app mientras su perro está afuera abre por eso.

## El orden propuesto, con su porqué en una línea

1. **Techo corto** — saludo y fecha en una línea. Identidad, no media pantalla.
2. **Las mascotas** — *el sujeto del producto es la mascota*: es lo primero que
   la familia busca, y sobre papel las fotos dejan de pelear con el gradiente.
3. **🔴 EN VIVO** — lo único que caduca. Ver arriba.
4. **Ponte al día** — lo que pide acción, después de lo que ya está pasando.
5. **Tus servicios** — lo que ya tenés contratado: estado, no acción.
6. **Tu vida** — el sedimento. *Es para mirar, no para hacer*, y por eso va
   después de todo lo que se hace.
7. **Agregar mascota · Adoptar** — al pie: **es crecimiento, no operación.**
   *Ponerlo entre medio interrumpe a quien vino a resolver algo de la mascota
   que ya tiene.*

**«¿Compraste en el local?» sale del medio**: hoy corta la pantalla entre las
tarjetas en vivo y los servicios. Su casa es Pedidos, o el pie junto a
Agregar/Adoptar — *es una puerta de entrada de datos, no una novedad del día.*

⚠️ **Lo que este orden NO decide:** si alguna sección se retira o nace. Sólo
ordena las que hay.
