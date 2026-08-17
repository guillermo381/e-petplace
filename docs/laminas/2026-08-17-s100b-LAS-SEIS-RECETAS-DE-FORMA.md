# LAS SEIS RECETAS DE FORMA — S100-B

> **Estatuto: RECETA DE FORMA, no aprobación de pantalla.** Es el toque 1
> de la Dirección de Diseño (`DIRECCION_DISEÑO_S99` §1): *lo barato que
> evita el rediseño*. **La pantalla se aprueba en el aparato, con el ojo
> del founder.**
>
> **La pregunta de todo gate, fija:** ***¿artesano, u obrero?***
>
> **Lo que gobierna:** N1–N10 (`DIRECCION_ARTE` §13) · N11–N20
> (`DIRECCION_DISEÑO_S99`) · **N11′** (17-ago) · las firmas del día
> (premium · dos columnas · agregar sin abrir · acordeones con `+`) ·
> F2/F3/F5/F6.
>
> **Las referencias se adaptan, jamás se copian** (§0.2): de Chewy,
> Instacart, Stripe, Rappi y Uber se toma **el MECANISMO** y se deja
> afuera lo que nuestra ley prohíbe — rankings, urgencia artificial,
> moneda visible, dark patterns.

---

## 🔴 LO PRIMERO, PORQUE CAMBIA CÓMO SE LEE TODO LO DEMÁS

**Las ocho pantallas de la despensa YA EXISTEN** en `apps/cliente`
(`index` · `producto/[id]` · `carrito` · `checkout` · `pedidos` ·
`pedido/[id]` · `reclamo`). **Ninguna de estas seis recetas es
construcción desde cero: son REDISEÑO contra las firmas de hoy.**

*Se dice acá arriba porque una receta leída como «pantalla nueva» invita
a reescribir, y reescribir una pantalla que funciona es cómo se pierde el
comportamiento que ya estaba bien.* **Lo que cambia es la FORMA; el
camino ya corre.**

### Y una ratificación que ahorra trabajo

Mi predecesora ya escribió dos de estas recetas
(`…-RECETAS-ADELANTADAS-L5b.md` §1 y §4, `…-NAVEGACION-DE-LA-VITRINA-N20.md`).
**La firma del founder de hoy las RATIFICA en vez de contradecirlas** —
ya decían *dos columnas con `Baldosa`*. Lo que agrega la firma de hoy es
**el `+` que agrega sin abrir** y **los acordeones de la ficha**.
*Cuando una firma nueva coincide con un razonamiento viejo, lo que se
gana no es tiempo: es confianza en el razonamiento.*

---

# ① LA VITRINA — dos columnas · dueño: C

**Qué debe sentir quien la usa:** que la tienda es de su mascota. Entra,
ve productos de verdad con su foto, y **puede sumar uno al carrito sin
salir de donde está**. Nada de catálogos anidados: **máximo dos toques
hasta un producto** (N20).

**La referencia:** **Instacart** — grid + quick-add. Su mecanismo es que
*la decisión de comprar y la de investigar son distintas, y la grilla
sirve a la primera*. **Queda afuera** su densidad publicitaria y todo
badge de urgencia.

**Las piezas:** `TarjetaProducto` + `GRILLA_DE_DOS`/`CELDA_DE_GRILLA`
(S100-B, ya en `origin/pista-b`) · `FiltroPills` para la especie ·
`Encabezado portada` · `Esqueleto` en la lectura · `EstadoVacio`.

### Las decisiones de forma

**La grilla no se inventa: se importa.** `GRILLA_DE_DOS` trae el patrón
medido —`50 %`, aire adentro, **sin `gap`**— con su historia de dos
errores. *El `gap` no se ve en el porcentaje y la resta se hace en
píxeles.*

**El `+` es el timbre de la casa:** misma esquina en todas las tarjetas,
sin importar el alto del nombre. **La mano lo encuentra sin mirar.** Al
tocarlo **muta a stepper en el lugar** (150 ms) — no aparece un control
nuevo al lado.

**La especie es FILTRO, jamás carpeta** (hallazgo de la receta N20: al
menos un producto vive en dos especies ⇒ tabs excluyentes lo obligarían a
elegir dónde vivir). **El eje de necesidad no aparece hoy** y se enciende
solo por umbral de discriminación — *un filtro que no reparte es un
adorno con estado*.

**Sin stock: el cartel va en la puerta.** Foto atenuada + etiqueta DENTRO
de la tarjeta, sin `+`. *Avisar la falta en otro lado obliga a leer dos
lugares para saber si se puede comprar.*

**El techo dice dónde estás antes de contar nada** (gramática del techo,
S99-B): isotipo + nombre de la pantalla, y **recién después** el
contenido. La prueba: **el techo no cambia cuando cambia el contenido.**

### Lo que esta receta NO decide

El orden de los productos. **Es decisión de negocio y hoy no tiene motor**
(H-001 de C: no existe la cadena de selección). *La forma no puede
tapar un orden que no existe.*

---

# ② LA FICHA DE PRODUCTO — dueño: C

**Qué debe sentir quien la usa:** que alguien miró este producto **por su
mascota**. El orden de N19 no es una sugerencia: **es la ley**, y su
punto ⑤ —*para quién sirve*— es lo que ningún referente tiene.

**La referencia:** **Chewy** — la ficha de commerce de mascotas. Se toma
la densidad de datos reales; **queda afuera** el ranking de reseñas.

**Las piezas:** el carrusel a sangre 4:3 de `FichaPrestador` (§12.1) ·
`PrecioText registro="ficha"` con su `porUnidad` · `AvisoAlergia` ·
`Texto` · `PieReserva` para el CTA al pie.

### El orden, que es ley (N19)

**① foto** — carrusel **manual, jamás auto-rotativo**; la primera es el
producto solo, sin composición de marketing · **② nombre + presentación**
en la misma línea de lectura · **③ precio, y debajo el precio por kilo** —
*el dato que decide una compra de alimento y casi nadie lo pone* · **④
composición y alérgenos** · **⑤ para quién sirve** (especie y momento
vital) · **⑥ disponibilidad y cuándo llega**.

### 🔴 LOS ACORDEONES CON `+` — y su límite, que es lo que los hace legales

La firma del día pide acordeones con `+` en la ficha. **Con un candado
que no se negocia:**

> **EL ACORDEÓN NO ES UN ESCONDITE. N19 ①–⑥ va SIEMPRE ABIERTO, y la
> advertencia de alérgeno JAMÁS se colapsa.**

**Lo que SÍ puede plegarse:** lo que viene *después* del ⑥ — modo de uso,
guía de alimentación, devoluciones, la ficha técnica larga. *Contenido de
consulta, no de decisión.*

**El porqué, y no es de estilo:** un acordeón dice *«esto es opcional»*.
Aplicado a un alérgeno **convierte una advertencia en una nota al pie**, y
`MODELO_DESPENSA` firmó lo contrario: **la alergia ADVIERTE, no esconde**
— *un producto que desaparece sin explicación deja al dueño sin
entender; uno que advierte es la app demostrando que conoce a Thor*.

**El nombre completo vive acá** (la tarjeta lo corta a dos líneas). *La
ficha es donde el nombre largo deja de estorbar y empieza a servir.*

---

# ③ EL CHECKOUT — carrito · promesa · quién recibe · pago · dueño: A

**Qué debe sentir quien la usa:** que sabe **qué va a pasar** antes de
pagar. Un checkout premium no es uno bonito: **es uno donde nada
sorprende después del botón.**

**La referencia:** **Stripe** — formularios y pago. Su mecanismo es que
*el formulario valida contra la realidad y el error enseña*; **queda
afuera** su estética de dashboard.

**Las piezas:** `Campo` con **N11′** · `PieReserva` (el pie fijo con el
total) · `Celda`/`FilaDato` para el resumen · `SelectorVentana` para la
ventana de entrega · `BuscadorDeLugar` + `PinMovible` para la dirección ·
`EscaleraEstados` **no va acá** (todavía no hay pedido).

### 🔴 F5 — UN CARRITO, N PEDIDOS: LA DIVISIÓN SE DECLARA ANTES DE PAGAR

**Es la decisión de forma más importante de esta pantalla**, porque es la
única que puede sorprender a alguien después de cobrarle.

**Antes de pagar:** el resumen muestra **los N pedidos como N bloques**,
cada uno con su tienda y su promesa. *No es un detalle de implementación
que se cuenta después: es lo que la persona está comprando.*
**Después:** la confirmación explica que **son pedidos independientes** —
llegan por separado y se siguen por separado.

> ***Un total único sobre dos entregas distintas es una promesa que la
> pantalla no puede cumplir.*** Declararlo antes cuesta un bloque;
> descubrirlo después cuesta la confianza.

### Los campos, con N11′ entera

**Etiqueta AFUERA y arriba, siempre visible, siempre del mismo tamaño.**
**El placeholder enseña el FORMATO** (bajo «Teléfono de contacto» va
`+593 99 123 4567`, **no** «Teléfono»). **El error va debajo y dice QUÉ
está mal y CÓMO se arregla, con ejemplo real** (N12.4) — *«campo
inválido» está prohibido en toda la casa*. **Valida al salir del campo,
jamás al enviar.**

⚠️ **N11′ cuesta ~14 px de alto por campo, y su compensación firmada es
MENOS CAMPOS POR PANTALLA — jamás encoger.** En el checkout eso es
concreto: **si no entra, se parte en pasos; no se achica la letra.**

**El buscador de dirección es la ÚNICA exención de etiqueta** (lupa +
placeholder). *Poner «Buscar» arriba de una lupa es decir dos veces lo
mismo.*

---

# ④ TUS PEDIDOS + EL DETALLE — dueño: D

**Qué debe sentir quien la usa:** que puede ver **dónde está su pedido
sin abrir nada**, y que si abre, encuentra **hitos con hora** y no un
estado suelto.

**La referencia:** **PedidosYa/Rappi** — el seguimiento con nodos e
hitos. Mecanismo: *un nodo tiene adentro, y por eso dice QUÉ ES sin una
palabra*. **Queda afuera** la publicidad sobre el seguimiento.

**Las piezas:** `TarjetaPedido` (lista) · `EscaleraEstados` en sus dos
registros — `compacta` en la fila, `completa` en el detalle · `FilaDato`
para los hitos.

### La escalera: CUATRO nodos, y «pagando» no es uno

**confirmado · preparando · en camino · entregado.** **«Pagando» NO es
escalón** — es lo que pasa *antes de que exista una promesa*, y pintarlo
como paso 1 afirma que el pedido ya existe.

**Los desvíos son BANDA, no nodo** (`no llegó`, `cancelado`): no avanzan
el camino, **lo interrumpen**. Una escalera que los pinta como «paso 5 de
5» afirma que el pedido llegó al final, y es falso.

> ✅ **Curado en S100-B (H-04):** hasta hoy un pedido cancelado **no
> decía que se había cancelado** en la lista — la banda existía y no se
> montaba. La regla de existencia ahora mide contenido, no pasos.

**F6 · «Lo prepara: [tienda]»** — con F5 en la mano esto deja de ser
decoración: **con N pedidos independientes, saber cuál tienda prepara
cuál es lo que vuelve la lista legible.**

**La ventana de entrega es RANGO, jamás minuto** (N14). **Con desvío NO
se muestra:** *prometer una entrega que ya no va a pasar es peor que no
prometer.*

---

# ⑤ EN CAMINO — el mapa con identidad · dueño: D

**Qué debe sentir quien la usa:** que **eso de la pantalla es su pedido**,
no un mapa genérico con un punto. El mapa de e-PetPlace **se reconoce
como de e-PetPlace** (N14).

**La referencia:** **Uber** — ficha del conductor + mapa. Se toma la
anatomía; **queda afuera** la calificación y el ETA al minuto.

**Las piezas:** `MapaRecorrido` · `PinEnMapa variante="moto"` (S99-B, con
su clase «marca de mapa» de `DIRECCION_ARTE` §6ter) · `Hoja` inferior con
estado + acción · `EscaleraEstados completa`.

### Las decisiones de forma

**Ver es adentro; navegar paso a paso sale afuera.** El mapa es **fondo**;
la acción vive en la Hoja.

**El pin interpola entre posiciones.** El GPS llega cada ~60 s: **sin
interpolación el pin salta y parece roto.** Bezier de la casa, lado
entrada — **jamás spring** (N10: *una entrada es una duración; un rebote
es una física*).

**F3 · la ficha del repartidor: foto · nombre · vehículo · placa, y NADA
MÁS.** **Sin calificación** (no la tenemos y no se inventa) y **sin
llamada** en esta superficie. **La placa manda en la jerarquía porque es
lo que se verifica en la calle** — *el nombre lo dice él, la placa la lee
cualquiera desde la vereda.*

⛔ **Lo que no entra:** publicidad sobre el mapa · **ETA al minuto en
v1** — *prometer un minuto que no podemos cumplir es peor que no
prometer*.

**Freno declarado:** esta pantalla **depende del lector del track** (H-01,
dueño A). *La receta se puede leer hoy; la pantalla no se puede montar
hasta que el dato llegue.*

---

# ⑥ ENTREGADO — la ceremonia · dueño: D

**Qué debe sentir quien la usa:** que **llegó**, y que eso importó. Es el
único momento de la despensa que merece celebración — y **el único que
deposita en el Bio-Expediente**.

**La referencia:** ninguna externa. **La casa ya tiene su ceremonia:
`Destape`** (S97+), firmada en dispositivo.

### 🔴 LO QUE SE HEREDA ES EL MECANISMO, JAMÁS EL NÚMERO

**Los ~3000 ms son de `Destape` y de SUS CINCO ACTOS.** Trasplantarlos a
una ceremonia de tres actos **no la vuelve igual de ritual: la vuelve
lenta** — que es exactamente lo que la enmienda de N10 previene.

> ***Lo que hace un ritual no es que cada cosa tarde más: es que haya un
> beat entre una cosa y la siguiente.***

**La construcción correcta:** **abrir las PAUSAS, jamás estirar los
gestos.** Cada gesto sigue durando lo que N10 declara (150 · 300 · 520);
lo que crece son los `at:`.

✅ **D ya lo aplicó y lo declaró** —tres actos, **1700 ms**, gestos en
`grande` y `estandar`—, **y frenó el trasplante de los 3000 con su
razón.** *Eso es la enmienda funcionando: no se copió un número, se
copió el criterio.*

**La degradación se declara AL NACER, no después:** con `reduce-motion` o
en **memorial**, crossfade corto (~300 ms), sin secuencia. *Tres segundos
de espectáculo a quien pidió MENOS animación es exactamente el
espectáculo que pidió no ver.*

**F2 · el código de entrega** vive acá con su registro propio: es **dato
que se dicta en voz alta en la puerta** ⇒ **mono**, y del tamaño en que
se lee sin acercar el teléfono (precedente `CodigoAEscala`, S96-B, con su
excepción declarada al matiz S53: *en sans se confunden 0/O y 1/l/I*).

**Y lo que cierra el círculo del producto:** la entrega **es el acto que
deposita el evento en el expediente**. La ceremonia no celebra una
transacción — *celebra que algo del cuidado de esa mascota quedó
registrado*.

---

## §7 · LO QUE NINGUNA DE LAS SEIS PUEDE FIRMAR

**Todas afirman sobre FORMA. Ninguna aprueba una pantalla** — eso es el
ojo del founder en el aparato (regla 80: *el craft se ve en la pantalla
real*).

**Las tres preguntas concretas para ese gate:**

> **Vitrina:** *¿el `+` se siente como «lo quiero» o como un botón más?*
> **Ficha:** *¿el precio por kilo se lee como el dato que decide, o como
> letra chica?*
> **Formularios (N11′):** *un formulario de seis campos con la etiqueta
> afuera, **¿respira o se estira?*** — los instrumentos dicen que los
> números cumplen; **ninguno puede decir esto.**

### Y una ley de método que esta tanda deja, pagada con un rojo

> **Una receta afirma sobre la pieza que la pantalla MONTA, jamás sobre
> su hermana.**

Nació de H-04: afirmé que *«la pieza ya trata el desvío como banda»* —
cierto para `EscaleraEstados`, **falso para `TarjetaPedido`**, que es la
que la lista realmente monta. **Verificar contra el consumidor real antes
de afirmar.**

**Y su hermana, de mesa hacia abajo:** *un rojo nombra el SÍNTOMA con
certeza y la UBICACIÓN como hipótesis* — quien cura mide dónde vive antes
de curar.
