# S116-B · LOTE 13 — recorrido 4: la onda con geometría, la hoja opaca, el contador y la fila pareja

**Rama `pista/s116-b-05`.**

**Gates:** `verify:diseno` VERDE (81 reglas) · `verify:contrast` **464/0** · `verify:catalogo-v5` VERDE (34 piezas en 29 entradas) · `verify:reduced-motion` VERDE · `verify:isotipo-path` VERDE · `tsc` 0 en las cuatro.

---

## ① LA ONDA — cuarta vez, y la primera con números

**La geometría dictada quedó escrita en la pieza, no descrita:**
`position:'absolute'` · `bottom:0` · `left:0` · ancho = **el de la pantalla** (`useWindowDimensions`) · **cero margen** · **cero radio abajo** · magenta hasta el piso físico, por debajo de la barra de teclas.

> 🔴 **EL CAMBIO NO ES DE VALORES: LA PIEZA DEJÓ DE OCUPAR LUGAR EN EL FLUJO.** Antes era un bloque al final de una columna, así que **el margen y el radio se los ponía quien la montaba y ella no tenía cómo impedirlo.** *Una pieza que pide «sin márgenes» en su documentación está pidiendo que el consumidor se acuerde* — y tres recorridos seguidos mostraron qué pasa cuando alguien no se acuerda. **Absoluta y anclada al piso, no hay dónde ponerle un margen.**

**Su contracara, que es el contrato nuevo:** si no ocupa lugar, **la pantalla tiene que reservárselo** — para eso está `ALTO_ONDA_ACCESO`, que ya se exportaba y ahora es obligatorio. ⚠️ Es la parte **fija**: lo dibujado es `ALTO_ONDA_ACCESO + insets.bottom`, igual que `AIRE_RAIZ` con el asistente.

**Con teclado: se desvanece y DEVUELVE `null`.** ⏪ Antes dejaba un hueco de su alto para que el contenido de arriba no saltara; **siendo absoluta no hay nada que saltar**, y ese hueco era la última forma en que un nodo suyo seguía en pantalla. *«Cero magenta» se cumple mejor no existiendo que siendo transparente.*

🔴 **Y LA GALERÍA ERA PARTE DEL DEFECTO — esto es lo que explica las cuatro vueltas.** Los tres montajes de gate envolvían la onda en un `View` con `borderRadius: radius.lg`:

> **La galería mostraba la onda con las esquinas de abajo redondeadas.** *Una galería que envuelve la pieza en algo que la pieza no tiene no la está mostrando: la está disfrazando* — y es la superficie por la que se la miraba para decidir si estaba bien.

Las maquetas ahora van **sin radio y con `marginHorizontal` negativo** para cancelar el padding de la galería: un absoluto se ancla al padding box de su padre, así que **dentro del aire de la galería la pieza volvía a tener margen**. Mismo idioma que `GRILLA_DE_DOS`.

**La onda también salió del slot `pie` de `HojaContenido`**: ese slot mide el alto del pie para reservarlo, y un absoluto mide cero. Se monta **como hermana**. *El slot no se rompió — dejó de ser su lugar.*

---

## ② LA HOJA ES OPACA — y el color nunca fue el problema

El founder vio **el wordmark del fondo a través de la hoja, bajo «Email»**.

**Medido antes de tocar: los tres temas traen `bg.base` sin alfa, y la hoja ya lo pintaba.** Mirar el color no iba a encontrar nada.

> 🔴 **Lo que dejaba pasar el fondo es el ORDEN DE PINTADO de Android.** Una `elevation` de cualquier cosa montada en el fondo sube su capa por encima de sus hermanos, sin importar el orden del árbol. **Un fondo opaco tapado por un hermano que se pinta después sigue siendo opaco y se ve transparente igual.**

⇒ La cura son **dos `zIndex` explícitos** —fondo `0`, hoja `1`— y no un color. *Sin ellos, que la hoja tape depende de que nadie monte en el fondo algo con sombra: una condición que ningún gate mira y que se cumple hasta que alguien agrega una tarjeta.*

---

## ③ EL CONTADOR — un disco, dos portadores, y la pata muere

Nace **`disco-contador.tsx`**: círculo **magenta de acción**, número **blanco puro**, **PJS 700**, pegado arriba a la derecha, **cero no dibuja**.

**Lo consumen `Badge` (la campana) y `GlifoConContador` (el carrito).** *«Misma pieza» se cumple en el DISCO, que es lo que se ve* — los dos envoltorios tienen contratos legítimamente distintos (uno recibe el ícono armado, el otro el nombre del glifo).

⚠️ **El color se fijó y dejó de leer el tema, con su razón:** los dos portadores usaban `theme.accent.control` sobre `theme.bg.base` — un par **medido** y **distinto en cada casa**. En oscuro, «círculo magenta con número blanco» salía **ciruela con número lienzo**. *Un contador que cambia de color con el tema deja de ser la misma señal en las dos casas.* **Medido: blanco sobre magenta 5,13** (el par ya vive en `verify:contrast` desde el lote 11).

☠️ **LA PATA MURIÓ, y lo que se paga queda escrito:** la huella decía la novedad **por presencia y jamás con un número**, para no invitar a vaciarla (`MODELO_LOYALTY` §3). *Esa razón sigue siendo buena; el founder decidió otra cosa — se ejecuta, y se anota que la mecánica de «bajarlo a cero» vuelve a estar a la vista.*

⚠️ `Badge` conserva `forma` y `superficie` **inertes, con fecha de muerte**: se van cuando su último consumidor migre. *Romperle el typecheck a la app a mitad de sesión cuesta más que dos props muertas declaradas.*

---

## ④ LA FILA PAREJA — y los dos eslabones no estaban donde se los buscaba

**La cadena de estiramiento tenía DOS cortes**, y ninguno en la grilla:

1. **Dentro de `TarjetaProducto`**: el `Animated.View` de `usePresionado` medía su contenido, así que el `flex: 1` de su `Pressable` —puesto hace sesiones *«para que la tarjeta ocupe el alto de su fila»*— **no tenía contra qué crecer**. *Ese eslabón lo pone la primitiva de presión, no el autor de la tarjeta: es invisible al leer la pieza.*
2. **`Entrada`**, que envuelve a la tarjeta en la grilla, también medía contenido.

**`Entrada` gana `estira?: boolean`** (default `false`). ⚠️ **No se le puso `flex: 1` a todos, y la razón es un número:** tiene **64 consumidores**, y `flexGrow` reparte espacio libre **allá donde lo haya** — encenderlo para todos cambiaría pantallas que hoy están bien, **en silencio y sin que ningún gate lo vea**. *La capacidad se ofrece; quien la necesita la pide.*

**Pedido a C, una palabra:** `<Entrada estira orden={…}>` en `grillaProductos` de la despensa. Montado y capturable en la galería: una tarjeta de nombre corto al lado de una de tres líneas.


---

## ⑤ LAS CAPTURAS — no salieron, y la causa es del instrumento

🔴 **Las dos capturas de la onda (sin teclado y con teclado) NO se tomaron.** Tercera vez que declaro un hueco de captura en esta rama, así que acá va la causa medida en vez de la disculpa:

**La galería es un scroll de ~6.200 líneas de JSX sin índice ni salto de sección**, y la única forma de llegar a una pieza es barrer a ciegas. Lo intentado, con su resultado:
- Barridos automáticos con detección de la banda magenta por color: **dos falsos positivos** (una lámina de marca a pantalla llena y el botón «Crear cuenta», los dos >80 % de ancho en magenta). Afinado a >97 % de ancho, ya no los toma — y tampoco encontró la onda antes de que la app se recargara.
- **Cada recarga del bundle devuelve la galería al tope**, así que un barrido interrumpido no se retoma: se empieza de nuevo.
- `uiautomator dump` —que permitiría buscar por texto— **falla con «could not get idle state»** mientras haya una animación corriendo, y esta galería tiene varias.

> **El problema no es la paciencia: es que recorrer a ciegas una galería sin índice no es un método.** Dos lotes seguidos terminaron con el mismo hueco por la misma razón.

⚠️ **Y una cosa SÍ se midió en el camino, que vale más que una captura fallida:** al bajar por la sección del gate de la hoja, **la onda no aparecía** — y la causa era mía, de este mismo lote: `HojaContenido` estrenó `zIndex: 1` en su scroll (punto ②) y **con eso tapó a la onda**, que es su hermana posterior sin capa declarada.

> **Dos piezas sin `zIndex` se ordenan por el árbol; en cuanto UNA lo declara, todas las demás caen debajo.** *Una cura de capa no es local: cambia el orden de todo lo que la rodea.*

Curado dándole a la onda su propio `zIndex: 2` — es el piso de la pantalla, no parte del scroll.

**Lo que queda pendiente de ojo, declarado:** que el magenta llegue **por debajo de la barra de tres botones** sólo se puede ver en una pantalla completa, y **la onda no tiene consumidor fuera de la galería** (censado: cero). *Su gate real es la pantalla de acceso, que es de C.*

**Propuesta para destrabarlo de raíz** (no hecha, para no meterla de contrabando en este lote): que `TokenGallery` acepte **saltar a una sección por parámetro de ruta**. Con eso, cualquier gate futuro es un deep link y una captura, en vez de treinta swipes y suerte.
