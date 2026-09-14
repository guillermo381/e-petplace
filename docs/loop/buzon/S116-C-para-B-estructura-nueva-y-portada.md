# PEDIDO A B — la estructura nueva de pantalla, y `portada`

**De:** pista C · **Para:** B · **14-sep-2026**
**Origen:** encargo del founder, lote 3f, puntos 1 y 2.

> **Medido antes de pedir, en las siete ramas `pista/s116-b*` y en `main`
> @ `dfe004a7`: NINGUNA de las cuatro cosas existe.** No es que no estén
> mergeadas — no están escritas en ningún lado, y tampoco en `docs/`
> (cero menciones de `HojaContenido` y `FilaAccionesCostura` en todo el corpus).
> Por eso esto es un pedido y no un «traé tu rama».

---

## ① `HojaContenido` — la hoja que desliza sobre el fondo

**Qué tiene que hacer:** la pantalla queda con **fondo ciruela** y el contenido
vive en una **hoja** que desliza por encima. La cabecera queda sobre el fondo, no
sobre la hoja.

**Lo que C necesita del contrato, y por qué:**

- **Quién paga el `paddingBottom`.** Hoy cada pantalla suma `insets.bottom` a
  mano y la casa ya tiene un gate por eso (`R53`, 11 casos con baseline
  congelado). Si `HojaContenido` lo paga, decilo en el contrato: *si no, cada
  consumidor lo vuelve a teclear y el baseline sube.*
- **Si es scroll o sólo superficie.** El encargo pide un GIF del scroll en Hogar
  y Expediente ⇒ **la hoja scrollea**. Si trae `ScrollView` adentro, C no puede
  montar otro encima; si no lo trae, el contrato tiene que decir que el
  consumidor pone el suyo.
- ⚠️ **El borde de la Hoja modal.** `Hoja` ya existe y es un `<Modal>` nativo.
  **Un nombre que empieza igual y no es lo mismo es la clase de cosa que se
  monta mal una vez y nadie la vuelve a mirar** — si el nombre se queda, su
  cabecera tiene que decir en la primera línea que NO es la Hoja modal.

## ② `Cabecera` — la variante `'fondo'`

Hoy `Cabecera` tiene **`variante: 'raiz' | 'empujada'`** (medido,
`Cabecera.tsx:45`). Hace falta la tercera: la que se dibuja **sobre el fondo
ciruela** en vez de sobre su propia superficie.

**Lo que C necesita saber:** si `'fondo'` **cambia el par de texto**. Las dos que
hay pintan con `color="inverso"` sobre su gradiente; sobre ciruela plana el par
puede ser otro. *Si la pieza no lo resuelve, cada pantalla lo va a elegir — y
ahí nace el desvío.*

## ③ `FilaAccionesCostura` — los accesos rápidos sobre la costura

En **Hogar** y **Expediente** los accesos rápidos pasan a una fila **montada
sobre la costura** entre el fondo y la hoja.

**Lo que C aporta del contenido**, medido hoy en el expediente:
`Citas` · `Pasaporte y QR` · `Documentos` · `Cuéntanos`.

🔴 **Y una firma del founder que es del CONTENIDO y no de la pieza: una palabra
por acceso.** «Pasaporte y QR» pasa a **«Pasaporte»**. *Si la pieza acepta dos
líneas, alguien va a volver a poner tres palabras* — conviene que el contrato
diga que el rótulo es de UNA palabra, o que trunque sin piedad.

**Lo que C necesita del contrato:** cuántas caben (¿4? ¿scroll horizontal si son
más?), y **quién decide el glifo** — si la fila los pide o los resuelve el mapeo
de oficio que ya publicaste (`glifo-de-oficio.ts`).

## ④ `LogoV5` — el tamaño `portada`

`TamanoMarca` es hoy **`'cabecera' | 'splash' | 'protagonista'`** (medido,
`Marca.tsx:78`). Falta `'portada'`, para 01, 03 y 05.

**Sugerencia, no diseño:** que salga **por fracción del ancho** como
`protagonista`, no por px. *Lo pedí así porque ya se midió una vez que un número
fijo cumple la proporción en un aparato y la incumple en los demás.*

---

## ⑤ 🔴 Y UN HALLAZGO QUE ES TUYO, del lote del movimiento

**Dos de las tres animaciones que construiste no están montadas en ninguna
pantalla del producto** — medido con grep sobre `apps/cliente`:

| pieza | prop que la enciende | consumidores en el producto |
|---|---|---|
| la pata que pisa (`MarcaEleccion` vía `SelectorOpcion`) | `marcaPata`, **default `false`** | **CERO** |
| el trío que se funde (`TrioPersonajes` vía `Confirmacion`) | `trio`, opcional | **CERO** |
| el check con destellos (`Confirmacion`) | — | **vivo**, es la pantalla 10 |

**No es un defecto tuyo**: las piezas están bien y el movimiento entró. Es que
**la prop es opt-in y nadie la declara**, así que el trabajo no se ve en
ninguna parte salvo la galería. *Es `L-318` con otra ropa — motor sin puerta.*

⇒ **por eso C sólo pudo entregar el GIF del check**: los otros dos no existen en
ningún camino real que se pueda filmar. **Quién los monta y dónde es decisión de
producto, no mía** — si la mesa dice dónde va la pata, C la monta y la filma.

---

# ADENDA · 14-sep, después de montar — TRES COSAS

## ⓵ 🔴 `logo.png` TIENE FONDO BLANCO HORNEADO — la cura del isotipo no llegó al logo

Medido en el asset, leyendo el primer pixel de cada PNG:

| archivo | esquina RGBA | alfa |
|---|---|:-:|
| `logo.png` (claro) | **(255, 255, 255, 255)** | **255 — OPACO** |
| `logo-sobre-oscuro.png` | (0, 0, 0, 57) | 57 |
| `isotipo.png` | (0, 0, 0, 0) | **0** |
| `isotipo-sobre-oscuro.png` | (0, 0, 0, 0) | **0** |

Sobre el lienzo, `LogoV5 sobre="claro" tamano="portada"` **dibuja una caja
blanca alrededor de la marca** — visto en el emulador antes de medirlo.

**Los dos isotipos están limpios y el logo claro no.** No se veía hasta hoy
porque el logo sólo aparecía en `cabecera`: chico y sobre ciruela. `portada` lo
puso grande sobre lienzo y apareció.

⇒ **mientras tanto C monta la marca sobre el CIRUELA**, donde rige el asset que
sí es transparente. El día que el claro se cure, puede moverse adentro de la
hoja.

⚠️ **Y de paso, una medida que conviene mirar junto con ésa:** los cuatro assets
miden **~200 px de ancho**. En `portada` (46 % de un ancho de 1080) se piden
**~500 px**, o sea **2,5× de upscale**. No lo reporto como defecto porque no lo
miré con el ojo a ese tamaño — lo reporto como número.

## ⓶ `HojaContenido` funciona; tres cosas del contrato que hubo que descubrir usando

- **El `paddingBottom` lo paga la hoja** ⇒ las seis pantallas migradas dejaron
  de pagarlo. **Sugerencia para el contrato: decirlo arriba de todo**, porque el
  primer reflejo de quien migra es conservar su `insets.bottom` y ahí se paga
  dos veces (y `R53` lo vigila).
- **`arranque` no tiene default útil**: la cabecera doc dice *«si no se pasa, la
  hoja se apoya justo debajo del fondo»*, pero el render es
  `<View style={{ height: arranque }} />` ⇒ con `undefined` la hoja arranca en
  **0** y tapa la cabecera. *La prosa y el objeto no dicen lo mismo.*
- **`EvitaTeclado` va por FUERA.** Vale la pena decirlo en la cabecera: es el
  error de una línea que rompe el gesto y no falla.

## ⓷ Hogar y Expediente NO tienen `Cabecera` v5 — y por eso su costura no se pudo

Medido: el Hogar poblado usa un **techo local** (`@override-s82c`) con la fecha,
el saludo **y la fila de mascotas adentro del degradado**; el Expediente, un
`LinearGradient` local con la identidad. El propio comentario del Hogar explica
por qué: *«`HeroMarca` no tiene slots para fecha-antes-del-saludo ni para la
fila de mascotas»* — y `Cabecera` tampoco.

⇒ montarles `Cabecera presentacion="fondo"` **perdería ese contenido**. Y sin
hoja no hay costura, porque la costura la monta `HojaContenido`.

**La salida más barata existe y es de composición, no de pieza:** `fondo` es
`ReactNode`, así que **el techo local puede ir como `fondo` tal cual**. Pero eso
es una decisión sobre esas dos pantallas —qué se desvanece al scrollear y qué
no— y va con firma, no de callado.

**Listo para cuando se decida**, medido: los cuatro accesos del Expediente son
`Citas · Pasaporte y QR · Documentos · Cuéntanos`
(`FilaAcciones`, `[mascotaId].tsx:1505`), y **«Pasaporte y QR» pasa a
«Pasaporte»** por firma del founder.

---

# ADENDA 2 · 14-sep — `OndaAcceso` montada, y DOS hallazgos medidos

## ⓵ 🔴 EL BRILLO DEL ASISTENTE DEJA LA PANTALLA PERMANENTEMENTE NO-IDLE

`uiautomator dump` sobre cualquier raíz del cliente devuelve:

```
ERROR: could not get idle state.
```

**Discriminado, no supuesto:** en la Hoja de confirmación de «Cerrar sesión»
—que tapa el orbe— el mismo comando responde `UI hierchary dumped`. En 03 y 04,
que no tienen orbe, también funciona. **Con el orbe a la vista, nunca.**

**Por qué importa más allá de mi arnés:** ese «idle» es el mismo que usa el
árbol de accesibilidad de Android. Una animación que **no termina nunca** deja
la ventana permanentemente ocupada, y eso afecta a todo lo que espere reposo —
herramientas de prueba automatizada y, potencialmente, tecnología asistiva.

*No lo reporto como defecto visual: el brillo se ve bien. Lo reporto como una
propiedad del sistema que una animación infinita cambia sin que nada falle.*
**Si la casa lo quiere infinito, es una decisión válida y conviene que esté
escrita** — hoy no lo está, y el próximo que vea el `ERROR` va a buscar el
problema en su arnés, como hice yo.

## ⓶ 🔴 LA ONDA NO SE APLASTA — PERO SU FUNDIDO DEJA LA OLA SOBRE EL TECLADO

La mitad del alto fijo **funciona**: con el teclado arriba la franja no se
comprime. La otra mitad no llega a cero.

**Medido por pixel, con discriminador:**

| y | 03 (con onda) | 04 (sin onda) |
|--:|---|---|
| 1505 | **(235, 142, 201)** | (248, 243, 247) |
| 1510 | **(230, 136, 198)** | (248, 243, 247) |
| 1515 | **(224, 132, 192)** | (240, 234, 238) |

Y en la captura ampliada **se reconoce la curva de la ola**.
Evidencia: `docs/loop/capturas-s116-c/onda-resto-sobre-teclado.png` (03 arriba,
04 abajo, mismo recorte).

⚠️ **Es rosa lavado, no `magentaAccion` pleno** ⇒ parece opacidad parcial, no un
trozo de banda a opacidad completa. *Pero eso último es inferencia mía: lo
medido es el color y la forma.*

**Lo que NO es:** no es mi montaje. La onda va en un `View` absoluto
`bottom: 0` sin opacidad propia — el fundido es enteramente de la pieza
(`visible` sobre el `Animated.View` raíz).

## ⓷ Y una cosa que sí funcionó y conviene decir

`ALTO_ONDA_ACCESO` exportado **resolvió el problema entero de la reserva**: las
dos pantallas reservan el hueco con el número de la pieza, sin estimarlo.
⚠️ Eso me hizo chocar con **`R53`**, que pide `PantallaConPie` — y **no aplica
acá: `PantallaConPie` trae su PROPIO `ScrollView` y `HojaContenido` ya tiene
uno**, así que son alternativas y no se componen. Declaré la excepción con
`R53-DECLARADO` y su razón.

⇒ **pedido concreto: que `HojaContenido` gane un slot `pie` con medición
propia**, como `PantallaConPie`. Con eso la declaración muere y el alto deja de
depender de que el consumidor se acuerde de reservarlo.

---

# ADENDA 3 · 14-sep — DOS DEFECTOS DEL RECORRIDO DEL FOUNDER QUE VIVEN EN PIEZAS

## ⓵ 🔴 LA HOJA NO LLEGA HASTA ABAJO — el pie queda separado por una franja del fondo

**Lo que el founder vio en el aparato**, en «Carné de vacunas»: *«una franja
ciruela atravesada entre el CTA y "Seguir sin carné", y "Seguir sin carné" queda
fuera de la hoja, pegado al borde»*.
Evidencia: `capturas-s116-c/antes/09-carnet-franja-ciruela.png` y `09-carnet.png`.

**Medido en la pieza, no supuesto:**

- el pie se dibuja **FUERA del `ScrollView`** (`PieFijo`, comentario ⑤) — correcto,
  es lo que lo hace fijo;
- la hoja es un `View` con **`minHeight: 400` y NINGÚN `flexGrow`** (línea 153);
- ⇒ con contenido corto la hoja mide lo que mide su contenido, **el
  `contentContainerStyle: { flexGrow: 1 }` que pasa el consumidor estira el
  CONTENEDOR pero no la hoja**, y entre el borde inferior de la hoja y el pie
  **asoma el degradado**.

⚠️ **Pasar el CTA al slot `pie` NO lo cura** —lo hice y lo verifiqué en el
aparato—: mueve el botón, no estira la hoja. *La franja no es del botón: es de
la hoja.*

**Sugerencia (una línea, y es tuya):** que la hoja lleve `flexGrow: 1` —o una
prop `llenarAlto`— para que ocupe el alto restante cuando el contenido no llega.
*Desde el consumidor la única salida sería un `minHeight` estimado, que es
exactamente lo que `R53` y el propio `PieFijo` existen para impedir.*

## ⓶ 🔴 `TarjetaProducto` CORTA EL BOTÓN «AGREGAR» — y es la tercera vez de esta clase

**Lo que el founder vio:** los botones de agregar de la Despensa salen cortados
abajo. Evidencia: `capturas-s116-c/antes/despensa-sin-carrito.png` — **el pill
sale rebanado en plano: sus dos esquinas inferiores están cortadas por el borde
de la tarjeta.**

**El mecanismo ya está escrito en la propia pieza**, dos veces, con sus números:
`flex: 1` incluye `flexShrink: 1`, así que cuando el contenido no entra *«el
bloque se deja ENCOGER y lo que sobra se corta en silencio»* — y el contenedor
lleva `overflow: 'hidden'` (línea 403), *«lo que no entra no se ve»*.

**Lo que cambió y lo destapó:** los nombres de dos o tres líneas
(«Aceite de Salmon Brilliant Piel y Pelaje»). *No es un caso raro: es el catálogo
real.*

⇒ **no lo curo desde el consumidor**: la rejilla (`GRILLA_DE_DOS` /
`CELDA_DE_GRILLA`) está bien —`width: 50%` y paddings, sin alto— y meterle un
`minHeight` a la celda sería tapar en la pantalla un recorte de la pieza.
**Va con su captura.**
