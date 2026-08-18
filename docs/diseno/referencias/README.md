# REFERENCIAS DE DISEÑO — S100b

> **Lectura obligatoria de las cuatro pistas** (`ACTA-APERTURA S100b` §6).
> Capturas del founder del **17-ago-2026, 11:34–11:38**, depositadas y
> renombradas en la apertura de S100b. Antes vivían **sin trackear** y con
> nombre de WhatsApp: no viajaban a ningún worktree y nadie podía saber qué
> mostraba cada una sin abrirla.

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

## LAIKA — el recorrido de compra completo (11 capturas)

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

## ⚠️ LO QUE ESTA CARPETA **NO** TIENE — declarado, no rellenado

**No hay ninguna captura de Rappi ni de PedidosYa.** El encargo de la mesa
nombraba «RAPPI (seguimiento con rango de entrega y código)», y el canon de
S99 §5bis reclamaba «PedidosYa (seguimiento con nodos e hitos)» como primer
ítem del pulido con dueño FOUNDER. **Se abrieron las trece y ninguna lo es:
son once de Laika y dos de Uber.**

Se declara en vez de adivinarse. *Poner el nombre equivocado en una
referencia obligatoria manda a cuatro pistas a construir contra la vara
equivocada — que es el modo de falla que S99 pasó ocho gates aprendiendo.*

**Sigue faltando** la referencia de seguimiento con **nodos e hitos con
hora** (el dato ya existe en nuestro motor). Mientras no exista, la vara de
la escalera de cuatro nodos es la que S99-B ya midió sobre Rappi y depositó
en `EscaleraEstados` — **no una captura de esta carpeta.**

---

## Dónde NO buscar

`docs/laminas/referencias/` es **otra cosa**: la vara y la medición de la
**barra de tabs de S99** (`MEDICION-BARRA-S99.md` + 5 PNG). No se toca y no
se mezcla con ésta.
