# REFERENCIAS DE DISEÑO — S100b

> **Lectura obligatoria de las cuatro pistas** (`ACTA-APERTURA S100b` §6).
> **18 capturas del founder**, depositadas y renombradas en la apertura de
> S100b (13 el 17-ago 11:34–11:38 + 5 en la segunda tanda). Antes vivían
> **sin trackear** y con nombre de origen: no viajaban a ningún worktree y
> nadie podía saber qué mostraba cada una sin abrirla.
>
> **📐 NO SON TODO LO QUE HAY.** Va a entrar
> **`docs/diseno/BENCHMARK-TIENDA.md`** con **proporciones MEDIDAS** de estos
> referentes. *Una captura muestra una decisión; un número la vuelve
> comparable* — y esta casa ya pagó ocho gates por describir una referencia
> en prosa en vez de medirla (S99, la barra: cuatro traducciones —*saliente ·
> joroba · montaña · cresta*— mandaron a construir un bulto que la referencia
> no tenía). **Cuando exista, para toda proporción manda el benchmark; estas
> capturas quedan para el mecanismo.**

---

## 🔴 LA REGLA QUE GOBIERNA ESTA CARPETA

# DE LOS REFERENTES SE TOMA EL MECANISMO, JAMÁS LA SUPERFICIE.

Se mira **cómo resuelven un problema** —qué agrupan, qué ponen primero, qué
callan, cómo dejan tocar una cosa sin salir de la pantalla—. **No se copia
su estética, su voz, ni su modelo de negocio.**

**Lo que estas capturas muestran y NUESTRA LEY PROHÍBE** — está a la vista en
casi todas, y por eso se nombra acá y no en cada archivo:

- **La moneda visible y la membresía empujada en cada precio.** Laika pone
  `con membresía $65.937 👑 actívala ahora` **pegado al precio, en todas las
  superficies** — vitrina, ficha, carrito. `MODELO_LOYALTY` firma lo
  contrario: **progreso visible, ganancia visible, MONEDA INVISIBLE** — jamás
  puntos, niveles ni badges en UI. Y §2 de la apertura lo dice por otro lado:
  **el control no pesa más que el producto.**
- **La urgencia artificial y el ranking.** `BAJÓ DE PRECIO`, `OFERTA` sobre
  cada tarjeta, `7% OFF` repetido en toda la grilla. **N18: la completitud
  gana alcance — jamás ranking.**
- **El cross-sell que interrumpe.** La hoja «¿Algo más para tu peludo?» se
  interpone entre el carrito y el pago.
- **El anuncio disfrazado de opción** (G-09). En el carrito, la banda
  `Aprovecha 50% OFF en tu membresía` tiene **la misma forma que un ítem
  comprado** y está arriba del resumen.

*Si una captura te sirve para justificar cualquiera de esas cuatro cosas, la
estás leyendo como superficie.*

---

## LAIKA — el recorrido de compra completo (13 capturas)

Tienda de mascotas, Colombia. **Es nuestro competidor más directo y la
referencia principal del recorrido de la despensa.**

| Archivo | Pantalla | Qué mecanismo queremos de ahí |
|---|---|---|
| `referencia-laika-vitrina-inicio-favoritos.jpeg` | Inicio · grilla «Favoritos para tu peludo» | **La grilla de dos columnas con la foto presidiendo la tarjeta** y el nombre inmediatamente debajo. Es la vara de `TarjetaProducto` y de la ley §2 (mercadería → precio → control). ⚠️ *Su control «Agregar» ocupa el ancho completo y compite con el producto: eso es exactamente G-07, lo que venimos a NO hacer.* |
| `referencia-laika-vitrina-inicio-perfil-mascota.jpeg` | Inicio · scroll con «¡Completa el perfil de tu mascota!» | **El quick-add sin abrir el detalle**: la tarjeta ya comprada muta de botón a stepper `🗑 1 +` **en su lugar**. Y la banda de completitud del perfil de la mascota (Thor, 65%) como fila con progreso — parienta de nuestra escalera de completitud. |
| `referencia-laika-ficha-producto-completa.jpeg` | Ficha · vista de arriba | **El orden de la ficha** (N19): título → marca → carrusel con paginador → **selector de tamaño como chips** → precio → cantidad → acordeones. El carrusel muestra `1/3` y puntos. |
| `referencia-laika-ficha-producto-precio-y-cantidad.jpeg` | Ficha · scroll medio | **La cantidad como fila tocable con chevron** (`Cantidad: 1 (+60 disponibles)`) en vez de stepper suelto — y **el stock dicho sin número exacto que asuste**. ⚠️ El bloque de precio de esta captura es el anti-patrón de G-06: cuatro líneas de precio compitiendo. |
| `referencia-laika-ficha-producto-acordeones.jpeg` | Ficha · acordeones abiertos + CTA fijo | **Los acordeones con `+` / `−`** (el `+` de la firma del día) y **el CTA «Agregar al Carrito» fijo al pie mientras el contenido scrollea**. La barra de tabs sigue visible debajo. |
| `referencia-laika-carrito.jpeg` | Carrito de compras | **El resumen que desglosa** (Productos · Descuentos por promociones · Subtotal) y **la barra de envío gratis ya cumplida, con voz** («¡Cubrimos el costo de tu envío!»). El ítem lleva su stepper a la derecha con papelera en el 1. ⚠️ La banda de membresía es G-09. |
| `referencia-laika-cross-sell-algo-mas.jpeg` | Hoja inferior «¿Algo más para tu peludo?» | **La hoja de cross-sell con salida digna**: «No, gracias.» a ancho completo y como texto, no como botón gris. *El mecanismo que sirve es la SALIDA, no la interrupción.* |
| `referencia-laika-direccion.jpeg` | «Modifica tu Dirección» | **La dirección como tarjeta seleccionada con check verde y badge `PRINCIPAL`**, más «Agregar nueva dirección» al pie. Una sola dirección se muestra igual que N. |
| `referencia-laika-dia-y-hora.jpeg` | «Día y Hora» | **La tira de días como chips con día de semana arriba y número grande**, y el rango horario como tarjeta seleccionable **que dice su costo de envío** (`1:00 PM - 7:00 PM · Envío $0`). ⚠️ **Nuestro §6.2 de `LETRA_RECORRIDO_DESPENSA_S96` está DEROGADO (G-16): el motor de fecha programada vive, la puerta murió.** Esta captura sirve para la forma de una tira de días, no para reabrir esa puerta. |
| `referencia-laika-quien-recibe.jpeg` | «¿Quién recibirá tu pedido?» | **Las tres opciones como radios en tarjetas separadas**, una decisión por pantalla. Y el botón en estado `Cargando…` deshabilitado y hablado. |
| `referencia-laika-forma-de-pago.jpeg` | «Forma de Pago» | **Los medios de pago como tarjetas con logo a la derecha**, el elegido con contorno verde y check, «Otras opciones:» como grupo aparte, y **el costo adicional dicho en la opción misma** (`Efectivo · Costo adicional de $1.900`). La dirección viaja en el techo de todas las pantallas del checkout. |
| `referencia-laika-checkout-cupon.webp` | Checkout · «Confirma tu pedido» **(anotada por el founder)** | **El recuadro rojo lo puso el founder: lo que quiere de acá es EL CUPÓN** — «Redimir cupón» como fila propia, campo + botón `Validar` en la misma línea, **antes del pago y después de los datos**. Y de paso: la **escalera de tres nodos en el techo del checkout**, el resumen como filas con `Cambiar ›` (la decisión ya tomada se muestra y se deja corregir sin salir), `Ver todos mis productos` como salida al detalle, y la banda de envío gratis **pegada al CTA**. |
| `referencia-laika-resumen-pedido.jpeg` | Resumen del pedido (instancia **México**) | **El resumen que cierra: número de pedido arriba, ayuda ANTES del detalle** (WhatsApp + Llamar como dos botones grandes con su glifo — *un problema con un pedido no se busca en un menú*), y el bloque **Resumen** al pie desglosando `Subtotal · Costo de domicilio · Total`. Misma anatomía de filas con `Cambiar ›` que la anterior. |

> ⚠️ **Las dos últimas no tienen logo visible y no dicen «Laika» en pantalla.**
> Se nombran Laika por **el rótulo del founder + identidad estructural** con las
> once confirmadas (mismas filas con `Cambiar ›`, mismo «Ver mis productos»,
> mismo «Valor Domicilio», mismo violeta con verde). **`referencia-laika-resumen-pedido`
> es la instancia de MÉXICO** —pesos mexicanos, Ecatepec, «Valor Domicilio»— y
> las otras once son Colombia: *si vas a leer copy o precio, es otro mercado.*
> Para **mecanismo** sirven igual.

---

## UBER — el seguimiento en vivo (2 capturas)

Nada que ver con mascotas. **Se mira por el problema idéntico: alguien se
está moviendo hacia vos y necesitás saber cuánto falta y quién es.** Es la
vara del seguimiento del repartidor (`LETRA_RECORRIDO_DESPENSA_S96`).

| Archivo | Pantalla | Qué mecanismo queremos de ahí |
|---|---|---|
| `referencia-uber-mapa-en-camino-pin.jpeg` | Mapa con el auto en ruta + hoja inferior colapsada | **El mapa a sangre con la hoja inferior encima**, el tiempo como titular (`Pickup in 1 min`) y **el PIN como banda propia de cuatro dígitos grandes y separados** — el dato que se lee en voz alta en la puerta. Las distancias van como etiquetas SOBRE el mapa (`700 feet`, `Pickup spot`), no en una lista aparte. |
| `referencia-uber-tarjeta-del-conductor.jpeg` | Hoja inferior expandida con la tarjeta del conductor | **La ficha de quien llega, con LA PLACA MANDANDO** (`PDL8812` en grande, `Red Mazda MAZDA2` debajo) — *porque la placa es lo que se verifica en la calle, no la cara*. Cara + rating chico, nombre, y **las acciones como fila de tres: Message ancho + llamada + «…»**. El PIN queda arriba, ya en tono suave: cumplió su momento. |

---

## RAPPI — el seguimiento del pedido (3 capturas)

Delivery, no mascotas. **Es la vara del seguimiento del pedido de la
despensa** — la escalera de cuatro nodos que `EscaleraEstados` ya construyó
salió de medir esta app en S99-B. Estas tres son su fuente, ahora en el repo.

| Archivo | Pantalla | Qué mecanismo queremos de ahí |
|---|---|---|
| `referencia-rappi-seguimiento-escalera-y-rango.jpeg` | Seguimiento · escalera horizontal + mapa | **La escalera de CUATRO nodos con ícono adentro** y la línea que se rellena hasta el actual — el nodo futuro queda hueco y gris. Y arriba, **el estado narrado como titular en voz humana** («Tu Rappi va en camino a tu dirección») en vez de una etiqueta de máquina. **La hora es un RANGO, no una promesa** (`Entrega actualizada 11:40 PM – 12:05 AM`) — *un rango que se corrige no miente; una hora exacta sí.* Es la vara literal de nuestra escalera. |
| `referencia-rappi-hitos-con-hora.jpg` | Seguimiento · lista vertical de hitos | **La otra forma de lo mismo, y la que S99 §5bis venía pidiendo: los hitos apilados con SU HORA.** Cumplido = check verde lleno · en curso = anillo verde hueco **y es el único que muestra hora** (`08:42 PM`) · futuro = gris apagado y sin hora. **Ese dato ya existe en nuestro motor** — es la forma lo que faltaba. Debajo, la tarjeta del repartidor con dos acciones (`To call` en contorno, `Chat` en sólido: *una sola primaria*). |
| 🔴 `referencia-pedidosya-seguimiento-hitos-con-hora.jpg` | **PedidosYa** · seguimiento: escalera horizontal + hitos verticales con hora | **ES DE PEDIDOSYA, NO DE RAPPI** — lo dice adentro: *«Delivery a cargo de PedidosYa»*. **Cierra el hueco que el canon reclamaba desde S99.** Trae las DOS formas juntas: la **escalera horizontal de 4 nodos con glifo** arriba (tres llenos, el futuro hueco gris) y **debajo los mismos hitos apilados con su hora** (`12:13 · 12:15 · 12:32`). Tres cosas que no están en las de Rappi: ① **el hito habla POR SU NOMBRE a la persona** («Veronica, recibimos tu pedido») · ② **la acción del hito actual va INLINE en su renglón** (`Ver mapa` en rojo), no en una carta aparte — *la acción vive donde está el estado que la justifica* · ③ **la ventana va abajo, en su propia zona con reloj** (`Entrega actualizada entre 12:34 - 12:44`). ⚠️ Y difiere de Rappi en el PESO: acá los cumplidos van en texto negro y **solo el futuro recede a gris**; en Rappi los cumplidos también recibian gris. *Las dos son defendibles y no son la misma decisión.* **Llegó como `Rappi traking 1.jpg`** — nombre equivocado de app; se renombró al abrirla. |
| `referencia-rappi-repartidor-detalle-de-ruta.png` | **Rappi · app del REPARTIDOR** — detalle de la ruta con sus paradas | ⚠️ **NO es la pantalla del cliente**: es la del repartidor eligiendo ruta (`Continuar`, `¿Hay algo mal en la ruta?`). **Su valor es que muestra la gramática de nodos en su forma más limpia:** cumplido = **disco LLENO con check** y **texto GRIS** · actual = **ANILLO HUECO en color con glifo adentro** (la casita del destino) y **texto NEGRO**. *Es la vara literal de la enmienda a 19.8 que el founder firmó el 19-ago: el actual va HUECO y se distingue por color y peso, no por relleno.* **Llegó como `Rappi trakinng2 .png`** — con espacios y error de tipeo; se renombró. |
| `referencia-rappi-mapa-rango-y-codigo.png` | Seguimiento · mapa a sangre + código de entrega | **El rango de entrega como banda flotante SOBRE el mapa**, con la hora en verde y grande. **El código de entrega con su advertencia adentro** (`Código: 298 — Compártelo a tu Rappi solo cuando tus productos sean entregados`): *el código y la regla de cuándo darlo viven juntos, porque separados nadie lee la regla.* Y la honestidad operativa que nos sirve: **dice que el repartidor va a entregar otro pedido antes** en vez de esconderlo. ⚠️ **Este archivo llegó con el nombre `nuestro-barra-s99-141a372d.png`** — nombre de un archivo NUESTRO que vive en `docs/laminas/referencias/`. Se renombró en el depósito; el original sigue intacto en su carpeta. |

---

## ✅ EL HUECO DE PEDIDOSYA — **CERRADO el 19-ago-2026**

**Lo cierra `referencia-pedidosya-seguimiento-hitos-con-hora.jpg`**, que el
canon reclamaba desde **S99 §5bis** como primer ítem del pulido con dueño
FOUNDER.

🔴 **Y cómo estuvo a punto de no cerrarse nunca: llegó llamándose `Rappi
traking 1.jpg`.** Por el nombre, dos pistas la dieron por una captura de
Rappi ya existente y **el hueco siguió declarado abierto mientras el objeto
estaba en la carpeta**. Se cerró **abriendo el archivo**, no leyendo su
nombre — adentro dice *«Delivery a cargo de PedidosYa»*.

> **Un nombre de archivo es una AFIRMACIÓN, y vale exactamente lo que vale
> quien lo tipeó.** Acá el nombre afirmaba la app equivocada, y **el error no
> se propagó porque alguien miró la imagen antes de escribir la fila.**

*Se conserva el relato del hueco abajo, tachado y no borrado: el modo de
falla que lo mantuvo abierto es más útil que la fila que lo cierra.*

### ~~LO QUE ESTA CARPETA NO TIENE~~ *(VENCIDO — ver arriba)*

~~**No hay ninguna captura de PedidosYa.**~~ El canon de S99 §5bis la reclamaba
—«seguimiento con nodos e hitos»— como primer ítem del pulido con dueño
FOUNDER. **Sigue sin objeto en el repo.**

Se declara en vez de adivinarse. *Poner el nombre equivocado en una
referencia obligatoria manda a cuatro pistas a construir contra la vara
equivocada — que es el modo de falla que S99 pasó ocho gates aprendiendo.*

**Pero el hueco YA NO BLOQUEA:** lo que S99 le pedía a PedidosYa —nodos e
hitos con hora— **lo entrega `referencia-rappi-hitos-con-hora.jpg`**. Si
PedidosYa entra algún día, entra a contrastar, no a destrabar.

---

## Dónde NO buscar

`docs/laminas/referencias/` es **otra cosa**: la vara y la medición de la
**barra de tabs de S99** (`MEDICION-BARRA-S99.md` + 5 PNG). No se toca y no
se mezcla con ésta.
