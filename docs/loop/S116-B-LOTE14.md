# S116-B · LOTE 14 — `D-1118` (las dos mitades a la vez), la lápida de `HuellaDeLlegada` y el catálogo a comando

**Rama `pista/s116-b-05`** (mergeado `origin/main @ ba205d8d` antes de tocar: la cura tenía que salir del objeto real, no de mi rama).

**Gates:** `verify:diseno` VERDE (81) · `verify:contrast` **464/0** · `verify:catalogo-v5` VERDE · `verify:reduced-motion` VERDE · `verify:contador-piezas` VERDE · `tsc` 0 en las cuatro.

---

## ① `D-1118` — no se resolvía eligiendo quién va arriba

**Leí primero el buzón de C, y su medición reencuadra el problema:** el volcado de accesibilidad mostraba **la flecha como último nodo —o sea arriba— y el toque igual no le llegaba**.

> ⚠️ **En Android el orden de despacho lo decide la CAPA, no el árbol que reporta el lector.** *Un volcado correcto no prueba que ese nodo reciba el toque* — y era el instrumento con el que yo habría «verificado» sin tocar nada.

**El nudo, en una línea:** la hoja tiene que **tapar** al fondo y el fondo tiene que **recibir el toque**, y las dos las gana **quien esté arriba**. Por eso mi `zIndex: 1` curó el wordmark y mató las flechas, y sacarlo las revive y devuelve el wordmark. *Las dos salidas obvias rompen la otra mitad — C las descartó a las dos y no curó nada, que fue lo correcto.*

**⇒ La cura no ordena capas: QUITA EL SOLAPE.** La hoja empieza en `arranque`; el fondo ahora **se recorta ahí** (`height: arranque` + `overflow:'hidden'`):

- **no hay solape que ordenar** ⇒ el wordmark no puede pintarse sobre la hoja, sin `zIndex`;
- el fondo **sigue después del scroll** (la cura de C, `D-1113`) ⇒ sus hijos reciben el toque;
- **el píxel resultante es idéntico al de estar debajo**, porque lo que se recorta es exactamente lo que la hoja tapaba.

🔴 **Y explica por qué el defecto no necesitaba teclado:** el solape era **permanente** —fondo `0..alto de su contenido` contra hoja `arranque..`—; con el teclado se *notaba* porque el campo subía a esa franja. *Curar «el caso del teclado» habría dejado vivo el resto y parecido un arreglo.*

**Segunda mitad, que faltaba en las dos propuestas: lo que no se ve, no se toca.** Con el fondo desvanecido, `box-none` seguía entregando sus hijos — **la flecha invisible se comería el toque de la hoja**. *Un botón que no se ve y que igual se activa es peor que uno que no responde: el primero hace algo que nadie pidió.* Ahora `pointerEvents` viaja con la opacidad.

### Probado en el aparato, no leyendo

| mitad | cómo se midió | resultado |
|---|---|---|
| **el toque** | 03 (`login`), nodo `Volver` en `[53,157][163,267]`, tap en **(108,212)** | ✅ **la pantalla cambió** — vuelve a la bienvenida |
| **el pintado** | 05 (`registro`), tres swipes con el logo debajo de la hoja | ✅ **no se ve a través**: el formulario queda sobre lienzo limpio |

Capturas: `lote14-d1118-flecha-vuelve.png` · `lote14-d1118-hoja-opaca.png`.

**De yapa, medido en la misma corrida:** con el teclado arriba, **`0` píxeles `#D10788` en toda la pantalla** (`lote14-onda-con-teclado-cero-magenta.png`) — la onda del lote 13 se desmonta de verdad.

⚠️ **Y un hallazgo que va a C por buzón:** la onda **termina donde empieza la barra de tres botones, no por debajo** — magenta hasta `y=2270`, barra desde `y=2280`. **Un absoluto no puede salirse de su padre**, así que esto se cura en el montaje. Medición y qué hacer: `docs/loop/buzon/S116-B-para-C-la-onda-no-llega-al-piso.md`.

---

## ② `D-1121` — la lápida de `HuellaDeLlegada`

Muerta: archivo sin cuerpo, lápida al lado, fuera del índice y de la galería. Con ella muere `LLEGADA` (Ley 37) **y el arbitraje pendiente sobre el tercer valor de N10** — *un número en discusión para una pieza que ya no existe no es una decisión abierta: es basura que alguien va a creer viva.*

> **Es `L-318` con el signo dado vuelta: no es un motor sin puerta, es una puerta sin nadie que entre.** Una pieza viva sin consumidores no falla — **se queda ahí, entra a los censos, suma a los contadores y alguien la lee como parte del sistema.**

🔴 **Y la lápida dice lo que no es obvio: lo que muere es ESTE USO, no el motivo.** El gesto sigue vivo y montado en `EsperaDeMarca`. *Una lápida que no distingue las dos cosas hace que el próximo no reuse el motivo por creerlo enterrado.* Si vuelve a hacer falta una celebración de llegada, hoy la hace `Confeti`, que nació después y con otra letra.

---

## ③ `D-1114` — el catálogo deja de publicar conteos

**29 líneas de `**consumidores:** N` retiradas.** El gate **los mide contra el árbol de hoy y los imprime**, y **falla si alguna entrada vuelve a publicar un número — aunque ese día sea correcto**.

> **El número correcto no existía en ninguna de las dos ramas:** en la de B los consumidores de C no existen, y en la de C el catálogo es el viejo. **El desajuste nace en `main`, que es el único lugar donde nadie estaba mirando** — y lo pagaba la conducción, a mano y en territorio ajeno.

**Tercera vez que esta casa cura esta clase igual** (contador de piezas: 53 publicado contra 171 real; migraciones: cuatro caídas). *Las dos veces la cura no fue corregirlo otra vez: fue sacarlo y declarar el comando.*

⚠️ **La diferencia que vale la pena no perder:** este número **tenía gate**, así que no envejecía en silencio — se cobraba en el merge siguiente. *El daño nunca fue desinformar: era que una persona curara a mano lo que una máquina deriva.*

**De paso, el gate ahora dice algo que antes no decía:** cuáles piezas **todavía no tienen consumidores** (hoy siete), separado de un rojo — *una pieza puede existir antes que su pantalla, y eso no es un defecto; no saberlo sí.*
