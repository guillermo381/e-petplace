# CATÁLOGO DE PIEZAS v5 — lo que C monta

> **Este es el documento que C lee ANTES de componer cada pantalla.** Lo mantiene **B**.
> Medido contra el objeto el **13-sep-2026**, sobre `main` @ `5fa3599b`.
> **No se escribe de memoria y no se mantiene a mano: `pnpm verify:catalogo-v5` lo verifica.** Ese gate mide que cada pieza listada exista, esté exportada, y que **su cuenta de consumidores sea la de hoy** — porque esta casa ya pagó cuatro veces la clase «número publicado que envejeció en silencio» (el contador de `packages/ui` decía **53 cuando eran 171**, el de wrappers **26 cuando eran 122**).

---

## CÓMO SE LEE

- **consumidores** = archivos de `apps/` que importan la pieza desde `@epetplace/ui`. **`0` no significa «no sirve»: significa «todavía nadie la montó»** — las nueve del shell nacieron en el lote 2 para que C las monte en el 3.
- **tokens** = lo que la pieza consume. *Si una pantalla necesita un color o una medida que la pieza no expone, **no se pasa por prop**: se pide por buzón.*
- **la casa v5** = `theme.accent.formaV5`. Es UN slot que responde una sola pregunta —*¿esta casa recibió el rediseño?*— y gobierna **geometría, tipografía y huella** a la vez. Cliente `true` · prestador `false` · **memorial `false`** (§4 de la letra apaga la fiesta).

---

## ① EL SHELL — las que nacieron en el lote 2 y monta C

### `Cabecera`
La banda ciruela de arriba. **Va en TODAS las pantallas del cliente**, no solo en las del lote 3: es lo primero que se ve y lo que hace que la app parezca una sola.
- **props:** `variante` (`raiz` | `empujada`) · `antetitulo` · `titulo` · `apoyo` · `accionDerecha` · `pasos` · `onVolver` · `etiquetaVolver`
- **tokens:** `gradients` · `medidas` · `palette` · `radius` · `spacing` · `elevacion` · `theme.accent`
- **consumidores:** 0
- **captura:** `docs/loop/capturas-s116-b-lote2/piezas-v5-montadas.png`
- ⚠️ **El degradado lo resuelve el TEMA, no un `if memorial`** — memorial cae a ciruela noche plana solo.

### `BotonAsistente`
El botón flotante que abre NEXO. Va en **toda raíz**.
- **props:** `onPress` · `visible` · `etiqueta`
- **tokens:** `medidas` · `palette` · `radius` · `shadows` · `spacing` · `theme.accent`
- **consumidores:** 0

### `Opcion`
Filas con círculo de elección — **no chips**. Para elegir una de varias cosas que se leen como texto.
- **props:** `opciones[]` (`clave` · `texto` · `apoyo` · `derecha`) · `elegida` · `onElegir` · `agregar`
- **tokens:** `medidas` · `palette` · `radius` · `spacing` · `elevacion` · `theme.bg` · `theme.border`
- **consumidores:** 0
- ⚠️ **`derecha` es TEXTO, no nodo, a propósito:** una pantalla no puede meter un botón ahí.

### `Confirmacion`
La pantalla de «¡Listo!» a lienzo completo.
- **props:** `titulo` · `apoyo` · `dato` · `lineaExtra` · `primario` · `secundario` · `especies` · `exclamacion`
- **tokens:** `medidas` · `radius` · `spacing` · `motion` · `elevacion` · `theme.accent` · `theme.bg` · `theme.mode`
- **consumidores:** 0
- ⚠️ **`lineaExtra` es STRING, no nodo** — es el slot fiscal de S115 y `R74`/`R84` mantienen la plata fuera de las piezas.
- ⚠️ **Memorial no monta trío ni destellos, y lo decide el TEMA**, no el consumidor. Con `useReducedMotion` la pantalla **aparece hecha**.

### `Personaje` · `TrioPersonajes`
Las seis caras del founder. **`TrioPersonajes` es la mitad de `Confirmacion`.**
- **props:** `especie` (`perro`|`gato`|`conejo`|`ave`|`roedor`|`otro`) · `tamano` (`grande`|`hogar`|`selector`|`fila`) · `elegido` · `fondo` · (trío: `especies` de exactamente 3)
- **tokens:** `medidas` · `palette` · `radius` · `theme.bg`
- **consumidores:** 0 · 0
- 🔴 **El `ave` usa la nariz como cara** hasta que llegue su archivo — el único que entró trae el wordmark encima. Enmienda firmada de la letra §1.10.
- ⚠️ **Ninguna es vector**; el `roedor` tiene fondo blanco opaco.

### `BadgeFecha` · `BarraPasos`
El recuadro de fecha (mes sobre día) y la barra de progreso de un flujo.
- **props:** `mes` · `dia` — `total` · `actual` · `etiqueta`
- **tokens:** `radius` · `spacing` · `palette` · `theme.accent`
- **consumidores:** 0 · 0

### `IsotipoV5` · `LogoV5`
La marca v5 por imagen. **`LogoV5` lleva el wordmark y se dimensiona por ANCHO; `IsotipoV5` por alto.**
- **props:** `sobre` (`claro` | `oscuro`) · `tamano`
- **consumidores:** 0 · 0
- ⚠️ **No reemplazan a `Isotipo` todavía** — aquél sigue vivo con sus 18 consumidores.

---

## ② LAS QUE CONSERVAN CONTRATO — ya están montadas

*Se rediseñaron **en su archivo** para no tocar a sus consumidores. C las usa como siempre.*

### `Boton`
La acción de la pantalla. **Una primaria por pantalla** (Ley 5).
- **props:** `etiqueta` (**no children**) · `onPress` · `variante` · `superficie` · `tamano` (`sm`|`md`|`lg`) · `bloque` · `cargando` · `deshabilitado` · `iconoIzq` · `chevron` · `razonDeshabilitado`
- **tokens:** `medidas` · `radius` · `shadows` · `elevacion` · `motion` · `typography` · `theme.accent`
- **consumidores:** 233
- 🔴 **`razonDeshabilitado` no es opcional en la práctica:** `verify:razon-muda` cuenta los botones apagados sin razón. *Un botón que se apaga sin decir por qué manda a la persona a adivinar.*
- ⚠️ En la casa v5 la etiqueta es **PJS 700 16** (`escala.cta`); el `ghost` conserva su peso — sin superficie que las distinga, **el peso ES la jerarquía**.

### `Campo`
Entrada de texto con su pie.
- **props:** `label` · `ayuda` · `error` · `tono` (`alarma`|`estado`) · `etiquetaVisible` · `deshabilitado` · `sinPie` · `secure` · `multilinea` · `iconoIzq` · `iconoDer`
- **tokens:** `medidas` · `motion` · `spacing` · `typography` · `theme.status` · `theme.text`
- **consumidores:** 79 (+ `CampoFecha`, `CampoCodigo`, `CampoClaveAcceso`, `CampoIdentificacion`)
- ⚠️ **El error NO pinta la caja de rojo:** lo dice el pie. Y el placeholder va en `secondary` (**5,24:1**), no en `tertiary` — *un placeholder no es decoración: es lo que la persona lee para saber qué escribir.*

### `Tarjeta`
La superficie que agrupa.
- **props:** `tinte` · `elevacion` (`plana`|`reposo`|`elevada`) · `relleno` (`normal`|`amplio`|`ninguno`) · `luz`
- **tokens:** `radius` · `shadows` · `elevacion` · `spacing` · `theme.bg` · `theme.border` · `theme.capa`
- **consumidores:** 138
- ⚠️ **Tarjetas anidadas: nunca.** Y en claro la superficie en reposo conserva su hairline.

### `SelectorOpcion` · `FiltroPills` — *el chip*
`SelectorOpcion` elige (una o varias); `FiltroPills` filtra.
- **props:** `opciones[]` · `seleccionada`/`seleccionadas` · `onSelect` · `disposicion` (`fila`|`tira`|`grilla`) · `multiple` · `adorno` · `entidad` · `marcaPata` · `cargando` (por chip)
- **tokens:** `radius` · `spacing` · `motion` · `elevacion` · `theme.accent` · `theme.capa`
- **consumidores:** 57 · 16
- 🔴 **La pata que pisa ya está montada desde S91** (`MarcaEleccion`, física S62). En el chip lleno pasa a `rosaSobreCiruela` — *pintada del mismo ciruela que el relleno se volvía invisible, y los tres gates daban verde.*
- ⚠️ **Los chips NO son tabs.** Para vistas exclusivas va `SelectorSegmentado`, salvo que convivan tres ejes hermanos (ahí manda la gramática de la pantalla).

### `CeldaNavegacion` · `Celda` — *la fila de lista*
`CeldaNavegacion` entra a una sección (glifo + título + chevrón); `Celda` muestra un dato.
- **props:** `icono` · `titulo` · `detalle` · `onPress` · `registro` · `chevron` — `subtitulo` · `inicio` · `densidad` · `tituloEntero` · `elegida`
- **tokens:** `radius` · `spacing` · `motion` · `typography` · `theme.accent` · `theme.bg`
- **consumidores:** 49 · 87
- ⚠️ **El contorno transparente murió como acción de fila.** Información despliega; acción lleva. El glifo va en círculo rosa tinte.

### `Insignia` — *el estado*
Verde al día · ámbar pendiente · rosa informativo.
- **props:** `estado` (`alDia`|`atencion`|`proximo`|`info`) · `capa` · `tamano`
- **tokens:** `radius` · `spacing` · `theme.status` · `theme.capa` · `typography`
- **consumidores:** 45
- 🔴 **No se tocó una línea en el lote 2 y aun así está en v5:** lee `theme.status`, y los tokens del lote 1 la alcanzaron sola. *Es el dividendo de que la pieza lea del tema y no escriba hex.*
- ⚠️ **Ningún estado se dice solo con color** — siempre lleva palabra.

### `StepperCantidad`
Sumar y restar unidades.
- **props:** `valor` · `min` · `max` · `onCambio` · `onBorrar` · `editable` · `tamano` (`normal`|`compacto`|`menudo`|`ancho`) · `salida`
- **tokens:** `radius` · `spacing` · `motion` · `theme.accent` · `theme.border`
- **consumidores:** 8
- ⚠️ El «+» es círculo magenta lleno con el trazo invertido; el «−» queda blanco con borde fino. **La papelera aparece SOLO cuando bajar de 1 saca el ítem de la lista** — si no, prometería un borrado que no ocurre.

### `Icono` — *los glifos*
El set b′. **Nombre tipado: cero strings mágicos.**
- **props:** `nombre` (canónico **o** nombre del mock) · `tamano` · `registro` (`capa`|`aa`|`tinta`) · `tinta` · `huella` · `activa` · `montaje`
- **tokens:** `medidas` · `palette` · `theme.capa` · `theme.status` · `theme.accent`
- **consumidores:** 58
- 🔴 **En la casa v5 NINGÚN glifo lleva huella** (letra §1.1). Lo decide `resolverHuella`, no la pantalla — y lo vigila `verify:huella-por-casa`.
- ⚠️ **C puede montar los nombres del mock** (`buscar`, `agenda`, `chat`, `camara`…): 14 alias resuelven al canónico, y un alias mal escrito **rompe el compilador**.
- ⚠️ `Volver`/`Avanzar`/`Flecha` **no son del registry**: son `Chevron`, otra pieza.

### `Texto`
Toda la tipografía.
- **props:** `variante` (`titulo`|`seccion`|`cuerpo`|`apoyo`|`enfasis`|`antetitulo`|`dato`|`datoMd`|`voz`) · `color` · `numberOfLines` · `centrado` · `tabular`
- **tokens:** `typography` · `theme.text` · `theme.status`
- **consumidores:** 227
- 🔴 **En la casa v5, `titulo` y `seccion` son Baloo 2 800** (28/31 y 22/26); `cuerpo`/`apoyo`/`enfasis` son Plus Jakarta Sans. **No hay que pasar nada: la pieza resuelve por casa.**
- ⚠️ **`dato` y `datoMd` siguen en JetBrains Mono** (Ley 3: metadata de máquina) y **`voz` sigue en DM Sans 300** — la letra no nombra una variante de voz, y cambiarla sería decidir algo que nadie firmó.
- ⚠️ **`Texto` no acepta `style`.** El color sale de `color`; si hace falta uno que no está, se pide.

### `AvatarMascota`
La cara de la mascota — **el último peldaño de la escalera de la cara**.
- **props:** `nombre` · `fotoUrl` · `fotoDeEspecie` · `especie` · `tamano` (`xs`|`sm`|`entidad`|`md`|`lg`) · `capa`
- **tokens:** `palette` · `typography` · `theme.capaBg` · `theme.text`
- **consumidores:** 31

### `BarraTabs`
Las cinco tabs. **El activo es el círculo elevado.**
- **props:** `items` · `activo` · `onCambiar` · `onRepetir` · **`onMontaje`** · `estadoPorHuella` · `acento`
- **tokens:** `medidas` · `radius` · `spacing` · `motion` · `typography` · `theme.accent`
- **consumidores:** 3
- ⚠️ **Geometría 66/9, firmada — la letra se enmendó, no la pieza.** El anillo es **ausencia de material**, así que muestra el fondo real de la pantalla, sea cual sea.
- ⚠️ **`onMontaje` es el enganche del contador de montajes** que C tiene que cablear.

### `EsperaDeMarca`
La espera de la casa: la nariz respirando. **Única animación de espera legal**, y siempre con voz honesta debajo.
- **tokens:** `motion` · `theme.accent` · `theme.capa`
- **consumidores:** 8
- ⚠️ En memorial **queda quieta**.

### `NarizNotificacion`
La silueta de la marca para la bandeja de Android.
- **props:** `tamano` · `color`
- **consumidores:** 0
- 🔴 **NO es lo que Android monta** — eso es `assets/marca/nariz-notificacion.svg`, y **comparten el mismo `d`**. Esta pieza existe para poder VERLA y gatearla. *Si alguien toca una y no la otra, el founder firma una silueta y la bandeja muestra otra.*

---

## ③ LOS TOKENS — de dónde sale cada valor

| token | qué gobierna |
|---|---|
| `palette` | los 16 valores de la letra §2 · `tintaTexto65` es el secundario (el rango 50–58 **no llega a AA**, medido por `R12`) |
| `medidas` | las 22 medidas por objeto. **Viven aparte de `spacing` porque NO son múltiplos de 4** — 26, 70, 22, 17, 58, 52, 74, 78, 66 |
| `spacing` | la escala de RITMO, base 4, múltiplos estrictos |
| `typography` | `escala` trae la v5 (Baloo + PJS); `family` conserva DM Sans **como token del PRESTADOR** |
| `radius` · `shadows` · `elevacion` | radios, sombras por `elevation` (**nunca CSS**) y `halo.foco` |
| `motion` | 180–240 ms sin rebote para lo que responde al toque; entrada escalonada 45/300 para lo que llega |

---

## ④ LA REGLA

> ## 🔴 Lo que no está acá no se dibuja en la pantalla; se pide por `docs/loop/buzon/` y nace en `packages/ui`.

**Sin excepción «por esta vez».** El porqué, del founder: *«cada componente que nace mal es doble trabajo»* — y la deuda visual no se paga nunca. Un color, una medida o una forma resueltos en `apps/` compilan perfecto, pasan el typecheck, **y dejan de resolverse por tema**: quedan iguales en oscuro y en memorial, que es la mitad del sistema apagada en silencio. Lo vigila `R4` del lint, y **frena de verdad**.

**Cómo se pide:** una nota en `docs/loop/buzon/` con *qué es · qué no es · sus estados · en qué pantalla se va a montar*. Si el pedido no dice dónde se monta, no es una pieza: es una idea.

**Mientras tanto, C monta lo que hay y lo declara.** *Una pantalla con una pieza aproximada y su pedido escrito es honesta; una con un hex inline es una deuda que nadie va a encontrar.*

---

## ⑤ CÓMO SE MANTIENE

**Cada pieza que nace o muere actualiza este archivo EN EL MISMO COMMIT.** Lo mantiene **B**.

Y no depende de que B se acuerde: **`pnpm verify:catalogo-v5`** mide contra el objeto que cada pieza listada exista, esté exportada y **que su cuenta de consumidores sea la de hoy**. ⇒ *el número se desajusta solo cada vez que C monta una pieza, y el gate lo dice.*

⚠️ **Lo que el gate NO puede medir, declarado: si la descripción es cierta.** Ningún gate lee si una frase describe bien una pieza. **Eso lo sostiene quien escribe, y su verde no lo reemplaza.**
