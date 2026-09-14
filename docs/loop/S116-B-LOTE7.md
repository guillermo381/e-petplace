# S116-B · LOTE 7 — las tres del cierre, y el control del path

**Rama `pista/s116-b-05`** (la misma: las piezas viven ahí sin mergear).

**Gates:** `verify:diseno` VERDE — **81 reglas, nace `R91`** · `verify:contrast` 461/0 · `verify:catalogo-v5` VERDE · `verify:reduced-motion` VERDE · **`verify:isotipo-path` VERDE (nace)** · `tsc` 0 en las cuatro superficies.

---

## ① TARJETAPRODUCTO — las tres curas YA ESTABAN

**Medido antes de tocar nada:**

| lo que el pedido pide | dónde ya estaba |
|---|---|
| nombre a dos líneas con elipsis | `numberOfLines={2}` — línea 549 |
| el botón siempre con su alto | `<Mutacion alto={ALTO_STEPPER_ANCHO}>` |
| que no ceda el bloque del control | `flexShrink: 0` — línea 741 |

Las tres se pusieron en **S100d-B con medición de aparato**: el stepper salía a **18,1 dp de sus 36** y `overflow:'hidden'` lo tijereteaba por la mitad.

⇒ **lo que faltaba no era la cura: era que nadie la estuviera mirando.** Y **su modo de falla es el silencio** — quitar cualquiera de las tres compila, se ve bien con nombres cortos, y recorta el control con los largos. El propio comentario de la pieza lo decía: *«esto se midió sobre el bundle viejo y la cura no se vio correr»*.

### Nace `R91` — «ninguna celda corta contenido en silencio»

Es la frase del founder hecha exigible. **Su fixture saca UNA sola de las tres** —`flexShrink: 0`, la que más fácil se pierde porque no tiene efecto visible con nombres cortos y parece un estilo sobrante—. *Un fixture que las saca todas prueba que el gate ve un archivo vacío; sacar una prueba que ve la regresión que de verdad puede pasar.*

⚠️ **Lo que su verde dice:** «las tres siguen puestas». **JAMÁS** «nada se corta»: `overflow:'hidden'` sigue ahí y **debe** seguir. Lo que la regla sostiene es **quién cede** — el texto, que tiene tope de líneas y degrada legiblemente, y no el control con el que se compra.

🔴 **Y la auto-prueba me cazó DOS veces escribiéndola:** primero la regla leía el disco en vez del corpus (*un gate que lee el disco no se puede probar en rojo*); después ignoraba el fixture, que llega **por argumento**, y daba verde contra su propio rojo — **«REGLA DECORATIVA»**, dijo el gate. *Las dos veces lo dijo el instrumento, no yo.*

---

## ② LA HOJA CRECE HASTA EL PIE

**La causa: `minHeight: 400` sin `flexGrow`.** Un mínimo garantiza que no sea **más chica** que 400 y **no dice nada sobre llegar abajo**.

> *Con contenido largo nadie lo notaba: el defecto sólo existe cuando SOBRA pantalla — que es justo la pantalla con la que nadie prueba.*

Son **dos mitades**: `flexGrow` en la hoja **y** en el `contentContainer` del scroll — *un hijo no puede crecer dentro de un contenedor que mide lo que su contenido*. El `contentContainerStyle` del consumidor **se compone, no se pisa**; lo que no es negociable es el crecimiento, porque de él depende que no asome el fondo.

---

## ③ LA PASTILLA SE CORRE — y medirlo eligió cuál de las dos salidas sirve

El founder ofreció dos: que el aire cubra el ancho, **o** que la pastilla se corra.

**`AIRE_RAIZ` es un `paddingBottom`: protege lo que está DEBAJO de una línea. Pero el asistente FLOTA SOBRE EL SCROLL**, así que cualquier cosa pegada al borde derecho pasa por su esquina **en algún punto del recorrido**, no sólo al final.

> **Ningún padding inferior puede proteger a algo que viaja.**

⇒ la pastilla de `CitaEnVivo` pasa a la **izquierda**, y se decide **en la pieza**: *si cada pantalla eligiera el lado, la misma señal aparecería en dos lugares distintos según dónde esté montada.* Verifiqué antes de moverla que **no había razón firmada para la derecha**.

Nace **`COLUMNA_ASISTENTE` (112)** — margen 20 + disco 52 + halo 2×16 + respiro 8 — para que la próxima pieza que toque esa esquina no lo teclee.

---

## ④ EL CONTROL DEL PATH (`D-1107`) — lo que la mesa pidió confirmar

**`verify:isotipo-path`, VERDE:**

```
✓  el archivo exporta UN `ISOTIPO_V5_PATH`
✓  es UNA sola cadena `d`
✓  NO trae markup: ni `<path`, ni `<g`, ni `clip`
✓  arranca en un `M` y cierra en `Z` — 5083 caracteres
✓  tiene subpaths (los huecos del dibujo) dentro de UN path — 2 subpaths
✓  el SVG del ilustrador NO se entregó tal cual
   — la fuente tiene 268 paths y 229 clipPaths; lo entregado, 1 path y 0 clips
✓  declara su viewBox
✓  declara la caja MEDIDA del contenido
```

**El número de A queda confirmado por el control**: 268 paths · 229 clipPaths en la fuente, y **eso es exactamente lo que `pdf-lib` no puede consumir** — su `drawSvgPath` toma UN `d` y lo dibuja: no resuelve clips, no compone capas, no tiene z-order.

🔴 **Y el control encontró algo de paso: el path no tenía NINGÚN `Z`.** Cerraba implícito por el relleno. Cerré los dos subpaths explícitamente **y verifiqué que el dibujo no cambió: 0 píxeles distintos de 250.000** entre el antes y el después. *Un cierre implícito funciona hasta que alguien lo dibuje con algo que no rellene.*

⚠️ **Lo que su verde dice:** «es UNA silueta consumible por `pdf-lib`». **JAMÁS** «el dibujo es el correcto» — eso lo dijo el ojo sobre el rasterizado. *Un gate no puede mirar.*

---

## ⑤ LO QUE QUEDA ABIERTO AL CERRAR LA RAMA

- **La captura de `OndaAcceso` con teclado** sigue sin poder tomarse: 0 consumidores acá, `/gallery` inalcanzable y el prestador instalado no es dev build (los tres medidos en el parte del lote 5b). **C tiene el consumidor en 03.**
- **Cablear las edges** al `ISOTIPO_V5_PATH`: `supabase/functions/` no es territorio de B.
- **`R53`**: su declaración muere cuando las cuatro pantallas migren al slot `pie`, no antes.
