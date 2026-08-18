# S100b-B · EL RECORRIDO COMPLETO CON APARATO — carrito → entregado, y la pasada de oscuro

> **Hermana de `2026-08-17-s100b-MEDICION-CON-APARATO.md`**, que cubre vitrina y ficha.
> Mismo instrumento: SM-S938B del founder (384 × 832 dp), bounds por `uiautomator`, píxeles por PIL.
> **Capturas: `docs/laminas/s100b-medicion/`.**
> **Todo lo de acá es MEDICIÓN. Lo que es impresión va rotulado como impresión.**

---

## 🔴 §1 · EL PATRÓN QUE APARECIÓ **TRES** VECES Y NO ESTÁ EN LOS DIECISÉIS

**El CTA fijo se pinta ENCIMA del contenido.**
No es una pantalla: es **la anatomía de pie de página de toda la despensa**.

| # | pantalla | qué queda tapado | solape medido |
|---|---|---|---|
| ① | **ficha de producto** | `Composición` · la lista de ingredientes · **`Declara contener: Cordero, Arroz.`** | y 1518-1592 bajo CTA 1543-1602 (ver la corrección de §1bis) |
| ② | **carrito** | *«El total con envío e impuestos lo vas a ver antes de pagar»* | **9.6 dp** (1614-1728 bajo 1701-1760) |
| ③ | **dirección y entrega** | **`Instrucciones de entrega`** — que G-11 dice que debería ser *el único campo* de la pantalla | 1682-1744 bajo CTA 1701-1760 |

> ### ⏪ ④ Y ⑤ SALEN DE ESTA TABLA — corrección de la pista D, verificada
>
> Listé aquí **el detalle del pedido** y **en camino**. **D midió la fuente: ninguno de los dos tiene
> pie fijo** —cero `position:'absolute'`; sus botones viven dentro de un `EstadoVacio` y de dos
> `Hoja`—. **Montar `PantallaConPie` ahí sería un no-op.**
>
> 🔴 **Y lo peor es que mi propio instrumento ya lo decía:** el baseline de **R53 lista 11 rutas y
> ninguna es ésas**. *Dos números míos discrepaban —la tabla decía cinco, el lint decía que esas dos
> no tenían pie— y no los crucé.* **L-287, cobrada contra mí por no leer mi propia salida.**
>
> **⑤ «EN CAMINO» SÍ TIENE CAUSA, Y ES ARITMÉTICA** — el nombre que le puse a la captura ya la decía
> (`…-eta-cortado.png`: *cortado*, no *tapado*): status ~48 + encabezado ~56 + **mapa 380** + 20 +
> escalera vertical ~176 ≈ **680 dp**, contra el filo de la barra que medí en **699**. ⇒ *«Llega
> entre»* arranca a **19 dp del borde**, y **el mapa solo se come el 54 % del alto**.
> **La cura es la que §6 ya nombra: el mapa deja de ser BANDA y pasa a ser FONDO** (N14/Uber). Es de D.
>
> ### 🔴 ④ NO TIENE CAUSA NINGUNA — y esta frase lo mantuvo vivo tres mensajes
>
> **Lo levantó D y es un defecto de MI redacción, no de la medición.** Escribí *«la causa real ahí es
> aritmética»* refiriéndome al **par ④/⑤**, **y la aritmética de arriba es SOLO la de «en camino»**.
> **El detalle del pedido nunca tuvo síntoma medido propio:** entró por mi mis-atribución en H-105 y
> salió con ella — pero **la frase que explicaba el retiro lo arrastró** como si conservara una causa,
> y así llegó a la mesa como *«nadie lo está mirando»*.
>
> **Medido por D sobre su fuente, y coherente con lo que yo medí:** cero `position:'absolute'` (sus
> tres botones viven dentro de dos `Hoja`) · el visor lo acota el navegador —**el `ScrollView` de una
> pantalla de tab termina en `y=699.0 dp`, el filo exacto**— · y el código de la puerta ya es el
> bloque 2 de 6. **Sin superficie fija y con el visor acotado, no existe el mecanismo que produce un
> corte.** ⇒ **④ se retira del todo.**
>
> ***LA LEY QUE DEJA, y es de D: un ítem retirado de una tabla puede sobrevivir en la frase que
> explica el retiro.*** *Corregir la tabla no alcanza — hay que corregir también el resumen de la
> corrección, que es donde el lector siguiente va a buscar el porqué.*

> **La causa es una sola y es de composición: el contenido no reserva el alto del pie fijo.**
> *Un CTA fijo que no descuenta su propio alto del área scrolleable no «tapa a veces»: tapa
> siempre, y solo se nota cuando lo que queda abajo importa.*
>
> **⇒ El caso ① sigue siendo el que sube solo, y es de SALUD:** lo tapado en reposo es la composición
> y los alérgenos. **⚠️ Se recuperan scrolleando — ver la corrección de §1bis**, que desarma mi primera
> lectura. Lo que queda en pie: la ley de la casa previó el acordeón —*«plegar una advertencia de salud
> la convierte en nota al pie»*— y **acá el dato de salud arranca debajo de un botón**, que es un
> escalón más abajo que plegado. *Menos grave de lo que reporté, y todavía lo primero de la lista.*

---

> ## 🔴 §1bis · CORRECCIÓN — DIJE «LA FICHA NO SCROLLEA» Y ERA FALSO
>
> **Lo escribí yo y estaba mal.** La hipótesis la levantó **la pista C leyendo la fuente** (*«el
> `ScrollView` es normal; debería scrollear»*) y **la verifiqué en el aparato: la ficha SÍ scrollea** —
> `Composición` se movió de `y=1499` a `y=860` con un swipe, y **al fondo el contenido queda entero por
> encima del pie**. ⇒ **la composición y los alérgenos NO son inalcanzables.**
>
> **Por qué me equivoqué, que es el dato que vale:** mi swipe empezó en `y=1500` — **encima del pie
> fijo, que se comió el gesto**. La captura salió idéntica y la leí como *«no scrollea»*.
>
> **LO QUE SÍ ES CIERTO, y sigue siendo defecto:**
> ① **con el pie de DOS botones el contenido queda tapado EN REPOSO** —medido: `Composición` 1518-1592
> bajo el CTA 1543-1602— porque la reserva estimada no alcanza · ② **la banda del pie es una ZONA
> MUERTA DE GESTO**: quien arrastre en el tercio inferior encuentra la pantalla trabada y puede no
> descubrir nunca que abajo hay más. *Ese segundo punto no lo tenía ninguno de los dos, y salió de
> investigar mi propio error.*
>
> **La cura NO cambia:** derivar la reserva quita ①, y con ① resuelto ② deja de costar (un pie que no
> tapa nada puede comerse el gesto sin consecuencia). **Lo que cambia es la GRAVEDAD y el mecanismo.**
> *Tenía la cura correcta apoyada en una premisa falsa — L-294, cobrada contra mí y por una pista
> vecina que leyó la fuente.*

---

## §2 · CARRITO — G-08 y G-09, con número

### G-09 · el anuncio contra la opción

| | ancho × alto | área |
|---|---|---|
| pastilla de mascota (Thor) | **107.4 × 66.8 dp** | 7.174 dp² |
| bloque **«Donar este producto»** | **343.8 × 144.7 dp** | 49.748 dp² |

> **El bloque de donación ocupa 6.9× el área de la opción con la que compite** — y el gate pide
> que sea *«una pastilla, del mismo tamaño y familia que las de mascota»*.
> *Hoy no compite con las pastillas: las preside.*

**Su contenido es un párrafo de 4 líneas** (81.1 dp de alto solo el texto explicativo).
⇒ candidato directo del bloque ③ de la adenda: **la explicación va detrás de una «i», la opción se queda.**

### G-08 · el «Quitar» que no se entiende

Medido: la fila lleva **stepper `− 1 +` (144.0 dp)** *más* un botón **`Quitar` (89.6 dp)** aparte.
Dos controles para la misma intención. El estándar que el gate pide: **con cantidad 1 el `−` se
vuelve papelera** y el botón de texto desaparece.

### 🔴 G-03 · confirmado: el destino ofrece especies imposibles

Alimento **para perro** (*Pro Pac Ultimates · Adulto Cordero y Arroz*) ofrece **seis** destinos:
Thor y Zeus (perros) · **Jack (gato) · Sol (pez) · Lolo (conejo) · Flip (loro)**.
*El producto declara `especies_aplicables` y el selector no lo mira.* **Dueño: A/C.**

---

## 🔴 §3 · LA PRUEBA CONTROLADA DE G-01 — el mismo stepper, dos contenedores

**El carrito monta `StepperCantidad` en una fila ancha. Ahí el `+` EXISTE:**

| | contenedor del stepper | `Menos` | `Más` |
|---|---|---|---|
| **carrito** (fila ancha) | **144.0 dp** — lo que la pieza necesita | ✅ 44.1 dp | ✅ **43.7 dp** |
| **tarjeta de vitrina** (caja de 138 dp) | **74 dp** — comprimido | ✅ presente | ❌ **NO EXISTE EN EL ÁRBOL** |

> **Misma pieza. Mismo código. Dos anchos. En 144 el `+` está; en 138 no.**
> *La app se provee a sí misma el experimento de control* — y cierra G-01 sin ninguna
> interpretación: **no es lógica, es geometría**, exactamente como el instrumento predijo.

---

## §4 · ENTREGA, RESUMEN Y CONFIRMACIÓN

**G-11 · confirmado en sus tres mitades:** `Cambiar la dirección` es **un botón** donde la
referencia usa la línea con chevron · **`Quién recibe` y `Teléfono de contacto` son CAMPOS DE
EDICIÓN**, y el gate pide que se muestren fijos · **el teléfono no tiene selector de indicativo**
(el valor es `+57…` sobre una dirección de Quito — *eso NO es un defecto: es el caso canónico de
P21, la cuenta es global y el país es contexto de operación*).

**G-12 · dos CTA sólidos apilados** en el resumen: `Pagar (simulado)` (y 1543-1602) y
`Volver a editar` (y 1700-1759). *Dos bloques del mismo peso significan que nadie decidió cuál
importa* — el bloque ② de la adenda en su caso más claro.

**G-13 · confirmado:** «Que llegue solo» trae **dos párrafos explicativos siempre visibles**
(60.8 + 40.5 dp) **y las frecuencias `Cada 7 / 15 / 30 días` ya dibujadas sin interruptor encendido**.

**Y el conteo que pide la adenda ③ — párrafos explicativos siempre visibles en la pantalla «Listo»:
CUATRO, ~190 dp de alto**, en una pantalla cuyo trabajo es decir *«quedó creado»*.

---

## 🔴 §5 · TUS PEDIDOS — dos hallazgos que no están en los dieciséis

### ① CUATRO DE SEIS PEDIDOS NO DICEN EN QUÉ ESTADO ESTÁN

En la lista, los pedidos recién creados muestran **título, fecha y precio, y nada más**: sin
escalera y sin etiqueta. Solo los que ya avanzaron dibujan la escalera («Preparando», «En camino»).

*La pantalla «Listo» promete «te avisamos cuando el vendedor lo confirme» — o sea que **hay** un
estado que contar.* **La lista no lo cuenta.** `EscaleraEstados` tiene su regla de existencia
(*sin pasos no hay escalera*) y es correcta como pieza; **lo que falta es que el pedido sin pasos
diga su estado de otra forma.**

### ② «TUS PEDIDOS» — LA ENTRADA EXISTE Y ESTÁ ENTERRADA ⏪ *corregido*

**G-15 dice *«falta acceso desde la primera pantalla de Despensa»*. Medido, es más ancho:**

| superficie | ¿hay entrada a pedidos? |
|---|---|
| **Despensa**, arriba del todo | ❌ solo título · chips de mascota · Buscar · dos voces · chips de categoría y especie |
| **Cuenta**, índice completo | ❌ Tu perfil · Tu dirección · Tu familia · Documentos · Preferencias · Pagos · Ayuda y legales · (galería) · Sesión |

> 🔴 **CORRECCIÓN (D, verificada):** dije *«no tiene entrada»* y **es falso en la letra**. La entrada
> **existe** — `despensa/index.tsx:763`, una `CeldaNavegacion` a `/despensa/pedidos`. Lo que es cierto
> es **dónde está: al fondo del ScrollView, detrás de la vitrina entera** (~25 filas). Por eso no la
> encontré recorriendo y tuve que entrar por deep link.
>
> *Mi advertencia de la primera versión —«si hay una entrada que no vi, esto se corrige»— era la
> correcta, y la corrección llegó.* **No hay que construirla: hay que subirla. Dueño: D.**
> **La tabla de Cuenta sí es exacta: ahí no está.**

---

## §6 · EN CAMINO — lo que sigue la vara y lo que la invierte

### ✅ Lo que está BIEN y no hay que tocar

- **La escalera vertical con hitos** es la vara de Rappi bien leída: cumplido lleno · **el actual
  en negrita y es el ÚNICO que muestra su hora** · futuro hueco y gris.
- **El rango, no la promesa:** *«Llega entre 9:00 a. m. y 1:00 p. m. — Es una ventana, no una hora
  exacta.»* Cumple N14 (*sin ETA al minuto*) y la vara de Rappi al pie de la letra.
- **El código de entrega `1402`**, grande, en mono, **con su regla pegada abajo** (*«decíselo a
  quien te lleve el pedido»*). Es exactamente el mecanismo de Rappi: *el código y la regla de cuándo
  darlo viven juntos, porque separados nadie lee la regla.*

### 🔴 Lo que INVIERTE la vara declarada

**La ficha del repartidor pone el nombre arriba y la placa abajo, chica y apagada:**

| | registro medido |
|---|---|
| `Repartidor de Pruebas` | **24.2 dp**, sans, `primary` |
| `Moto · PBA-0142` | **18.8 dp**, **mono**, `secondary` |

> Nuestro propio README de referencias dice de Uber: ***«la ficha de quien llega, con LA PLACA
> MANDANDO … porque la placa es lo que se verifica en la calle, no la cara»***.
> **Acá la placa es el elemento más chico y más apagado de la ficha.**

**Y no hay ninguna acción de contacto** — ni llamar ni chat. Uber muestra tres acciones; Rappi dos
(*una sola primaria*). `LETRA_RECORRIDO_DESPENSA_S96` firmó que **la llamada gana v1** porque es el
único canal que no exige que nadie tenga la app abierta. **En pantalla no está.**

**El mapa es una BANDA, no un fondo.** N14 y la vara de Uber piden *mapa a sangre con la hoja
inferior encima*; acá el mapa es un bloque que scrollea y desaparece. `[IMPRESIÓN]` **es un cambio
de mecanismo, no un detalle** — con el mapa como banda, el estado y el mapa compiten por el alto en
vez de superponerse.

---

## 🌓 §7 · LA PASADA DE OSCURO — dos hallazgos, y uno ya tenía nombre

### 🔴 ① EL ACENTO DE MARCA CAMBIA DE COLOR ENTRE TEMAS

Muestreado sobre el mismo píxel del disco activo de la barra:

| tema | color del disco |
|---|---|
| claro | **`rgb(142, 31, 104)`** = `#8E1F68` — magentaDark |
| oscuro | **`rgb(252, 188, 29)`** = `#FCBC1D` — el **oro** del cliente |

**El mismo elemento cambia de identidad de color según el tema.** Se declara como **medición, no
como veredicto**: puede ser deliberado (el slot `accent.activoLleno` resolviendo por tema), pero
**la letra que encontré no lo dice**, y *un acento que cambia de color entre temas deja de ser el
acento de la marca y pasa a ser el acento del tema.* **A la mesa, con su número.**

### ✅ ② EL HALO BLANCO DE LA BARRA — ES EL HUECO GRIS YA MEDIDO EN S85, NO UNO NUEVO

Alrededor del disco activo aparece, **solo en oscuro**, un arco de **`rgb(242, 242, 242)`**.

**Ese número ya tiene ficha:** el canon lo nombra desde **S85** como *el hueco gris del navegador*
—`rgb(242,242,242)` del tema de expo-router, *«literalmente blanco grisáceo»*— con la salida obvia
**descartada por costo** (transparentar rompe la transición firmada) y `tabBarStyle` **medido como
no-op** contra un tabBar custom.

**Verificado que NO es de `BarraTabs`:** su path se pinta con `theme.bg.card`, y en oscuro ese slot
resuelve a `rgb(13,13,18)` — medido en la zona plana de la barra. *La pieza cumple; lo que asoma
está detrás de ella.*

> **Lo que esta pasada agrega al expediente, y cambia el cálculo de costo:**
> **en CLARO el hueco es invisible** —`242,242,242` contra una barra blanca— **y en OSCURO es un
> halo blanco sobre negro.** *El defecto no empeoró: se hizo visible.* La decisión de no pagarlo se
> tomó mirando el tema claro. **Con este número, la mesa decide de nuevo con el caso peor a la vista.**

### ⚠️ MEMORIAL — NO MEDIDO, y se declara

El tema memorial **no se puede forzar desde el sistema**: depende del estado de una mascota. **No lo
medí y no lo infiero.** *Declarar un tema como verificado porque «resuelve por slot» es exactamente
la clase de verde flojo que esta casa persigue.* Queda como pendiente con su razón.

---

## §8 · LO QUE ESTE RECORRIDO **NO** MIDIÓ

- **La adenda de anatomía del píxel, completa.** Este recorrido cubre en parte los bloques ①, ②, ③,
  ⑤ y ⑧; **no cubre ④ (header), ⑥ (escala tipográfica por pantalla), ⑦ (glifos) ni ⑨ (movimiento)**
  con la profundidad que la adenda pide, ni sobre los referentes.
- **La pantalla «entregado»** — el envío medido está en `hacia_destino`; no hay uno entregado que
  recorrer sin mover dato vivo.
- **La donación como estado** — el gate reporta que *marcada no se puede desmarcar*. **No lo probé
  a propósito:** habría dejado el ítem en estado de donación y bloqueado el resto del recorrido.
  *Está reportado por el founder; no necesita que yo lo re-rompa.*
- **Rendimiento** (N16) y **memorial**.
