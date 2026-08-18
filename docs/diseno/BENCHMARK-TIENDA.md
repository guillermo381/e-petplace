# BENCHMARK DE TIENDA — e-PetPlace

Referencia de diseño para las seis superficies. Cada afirmación lleva etiqueta de procedencia.

---

## Cómo leer este documento

**Etiquetas de procedencia.** Ninguna afirmación va sin una.

| Etiqueta | Qué significa | Cuánto le podés construir encima |
|---|---|---|
| `[MEDIDO]` | Geometría leída del DOM renderizado con Playwright, viewport declarado | Todo. Es un número, no una opinión |
| `[GUIDELINE]` | Recomendación de diseño publicada por Baymard/NN/g, o cita de un participante de testeo | Media. Es criterio experto o anécdota, **no** población |
| `[SPEC]` | Valor publicado en un design system o documentación oficial de producto (incluye docs de API) | Todo, con la fecha de la fuente a la vista |
| `[INVESTIGACIÓN]` | Estudio cuantitativo **con muestra y cifra** (Baymard, NN/g) | Alto. Es población, no anécdota |
| `[DOCUMENTADO]` | Texto literal de una política o centro de ayuda oficial | Alto para el mecanismo; no dice cómo se ve |
| `[REPORTADO]` | Prensa o teardown creíble, no verificado contra la fuente primaria | Medio. Contrastalo antes de decidir sobre esto |
| `[IMPRESIÓN]` | Deducción mía. No hay fuente | Nada. Es una hipótesis para testear |
| `NO ENCONTRADO` | Lo busqué y no está | Es un dato en sí: nadie lo publica |

**Reglas que se cumplieron sin excepción:**

1. **Ningún número sin etiqueta de procedencia**, y **ninguna estimación presentada como medición**. Donde
   hay una aproximación —«~5 toques», «~25 estados»— lleva tilde de aproximación *y* etiqueta.
2. **Dos convenciones distintas para dos huecos distintos**, y no son intercambiables:
   - `—` = **medible**. Nadie lo publica, pero el harness lo produce en tu máquina.
   - `NO ENCONTRADO` = **buscado y no publicado**. Ni el harness lo resuelve; requiere captura manual o
     verificación directa.
3. **La palabra «medido» en prosa está reservada** para geometría leída del DOM. Donde la evidencia es
   research publicado, dice «publicado» o «con research detrás», nunca «medido».

---

## Estado de las mediciones — leer antes que nada

**Las cuatro tablas de proporciones de ①–④ están armadas y vacías, más la de ⑤.** No es un olvido.

El entorno donde se investigó este documento tiene bloqueado a nivel de red el acceso del navegador a
Chewy, Instacart, Amazon, Rappi, Laika y Mercado Libre. Se verificó: el proxy solo permite
infraestructura de desarrollo. La lectura de texto (políticas, centros de ayuda, design systems) sí
funciona por otra ruta, y de ahí sale todo lo etiquetado `[DOCUMENTADO]`, `[SPEC]` e `[INVESTIGACIÓN]`.

Medir foto ÷ tarjeta o precio ÷ nombre requiere renderizar. No se pudo. Y como un número inventado en un
documento de referencia es peor que no tener el número, **las celdas quedan vacías con un script al lado
que las llena en tu máquina**, donde los sitios sí cargan.

El harness está en `harness/`. Corre, mide bounding boxes reales, y escupe la tabla en markdown lista para
pegar acá. Verificado contra una maqueta de geometría conocida: devuelve foto 62,9 %, precio÷nombre
1,286× y cromo 200 px sobre una tarjeta de 176×280 con foto 176×176, nombre 14 px y precio 18 px
`[MEDIDO]` — viewport 390×664, corrida real, artefactos en `harness/salida-test/`. **Esas seis cifras son
el único `[MEDIDO]` de todo el documento**, y no son de un referente: son de la maqueta de control.

```bash
cd harness && ./correr.sh --con-pausa       # ~20 minutos
```

**Capturas.** Por la misma razón no hay capturas de los referentes. El harness las genera con el nombre
que pediste: `chewy-vitrina.png`, `rappi-seguimiento.png`, `instacart-carrito.png`. La única imagen que
acompaña este documento es `maqueta-verificacion-medidor.png`, que no es un referente: es la maqueta con
la que se comprobó que el medidor mide bien.

**Advertencia de método que hay que arrastrar a la sesión:** el harness mide **web móvil**, no la app
nativa. Para la vitrina y la ficha suelen coincidir en intención, pero no son la misma superficie.
Cualquier número que salga de ahí se declara como *medido sobre web móvil*, nunca como *medido en la app*.

---

## ⓪ La hipótesis: veredicto

> «El control o el contenedor pesa más que el producto.»

**Se confirma como diagnóstico de falla. Se refuta como regla de diseño.** Y la reformulación que la
evidencia sí sostiene es más útil que la original.

### A favor

| Evidencia | Cifra | Fuente |
|---|---|---|
| Sitios que **no destacan** los productos que ya están en el carrito | **96 %** | `[INVESTIGACIÓN]` Baymard |
| Sitios que **no diferencian visualmente** los elementos dentro del ítem | **40 %** | `[INVESTIGACIÓN]` Baymard |
| Sitios que fallan en **consistencia de atributos** entre ítems | **64 %** | `[INVESTIGACIÓN]` Baymard |
| Ítems de lista **sin thumbnail** | *«were often completely ignored»* | `[GUIDELINE]` Baymard — cualitativo, sin cifra |

El testeo de Baymard registró esta cita de un participante después de tocar agregar: **«Oh my God, how do
I tell if I added it?»** El control se disparó y el producto no cambió. Ese es exactamente el síntoma que
describiste.

Baymard además advierte que *«empty form fields draw a disproportionate amount of user attention»*
`[GUIDELINE]`. `[IMPRESIÓN]` **Es mi deducción** —no la de Baymard— que el mecanismo se traslada del campo
de formulario al control de la tarjeta. El hallazgo original es sobre campos de cupón. Tratalo como
hipótesis, no como respaldo.

### En contra — y esto importa más

| Evidencia | Cifra | Fuente |
|---|---|---|
| Tiempo de visión en listados de producto spec-driven que va al **texto**, no a la foto | **82 %** (18 % a las fotos) | `[INVESTIGACIÓN]` NN/g, listados de TVs en Amazon |
| Precio como atributo **permanentemente visible** | Uno de los 5 atributos universales exigidos | `[INVESTIGACIÓN]` Baymard |
| Control de cantidad en la tarjeta de grilla, en grocery | **Recomendado explícitamente** | `[GUIDELINE]` Baymard, guideline de grocery |

Tres correcciones a la hipótesis original:

1. **«La foto pesa más que el nombre» es falso** para productos que se eligen por especificación —que es
   tu caso: alimento por peso, edad, raza y formato. NN/g midió 82 % del tiempo de visión en el texto.
   La imagen no gana por ser imagen; gana **cuando lleva información**. Las decorativas se ignoran.
2. **El precio no es ruido que compite con el nombre.** Es requisito.
3. **El control en la grilla es best practice en tu categoría, no vicio.** Baymard lo recomienda
   explícitamente para grocery.

### La reformulación que sí se sostiene

> El problema no es **control vs producto**. Es **control sin estado**.

`[IMPRESIÓN]` Leo el 96 % que no destaca lo que ya está en el carrito y el «how do I tell if I added
it?» como el mismo hallazgo visto dos veces: la tarjeta lleva el control pero **no lleva el estado**. El
botón grita «agregar» y no dice «ya tenés 2». La síntesis es mía; los dos insumos están medidos, el
puente entre ellos no.

De ahí sale el criterio operativo para la sesión:

- El control mide **lo mínimo táctil y nada más**: 48 dp `[SPEC]` Android Accessibility, separado ≥8 dp
  `[SPEC]`.
- Ese mismo control **se convierte en el indicador de estado** al pasar de 0 a 1 — que es literalmente
  la guideline de grocery de Baymard `[GUIDELINE]`, y `[IMPRESIÓN]` ataca directamente el mecanismo
  detrás del 96 %. Baymard no reclama resolver esa métrica; el vínculo lo hago yo.
- Con dos tercios del catálogo sin foto `[DOCUMENTADO]` brief, **la jerarquía no puede depender de la
  imagen**. Hay cobertura
  de investigación para que el texto cargue el peso.

---

## ① La tarjeta de producto en grid

### Proporciones — tabla a llenar con el harness

Corré `./correr.sh` y pegá acá la salida de `salida/tabla-proporciones.md`.

> ### ✅ CORRIDO POR S100b-B (17-ago-2026) — y el resultado es PARCIAL, con su razón medida
>
> **El harness se verificó primero contra su propia maqueta y PASÓ EXACTO:** foto **62,9 %**,
> precio÷nombre **1,286×**, cromo **200 px**. *El medidor mide bien; lo que falla es el acceso.*
>
> **Los referentes bloquean el navegador automatizado — verificado uno por uno con su código HTTP,
> no supuesto:**
>
> | referente | qué respondió | ¿medible desde acá? |
> |---|---|---|
> | **Chewy** | **403** · *«No treats beyond this point»* | ❌ muro anti-bot |
> | **Amazon** | **503** · *«Sorry! Something went wrong!»* | ❌ muro anti-bot |
> | **Instacart** | 200 pero la página es **el login** | ❌ exige sesión |
> | **Mercado Libre** | navegación fallida → **pantalla de login** | ❌ exige sesión |
> | **Rappi** | **200**, home real | ⚠️ carga, pero su listado exige dirección/sesión |
> | **Laika** | ✅ **MEDIDO** | ✅ ver fila |
>
> 🔴 **Y una corrección al propio harness:** `objetivos.json` apuntaba Laika a
> `domicilios.laika.com.co`, que **no resuelve**. El dominio vivo es `laika.com.co`, y su listado
> —el mismo camino que se caminó en el teléfono— es `/perros/alimento/concentrado`. **Corregido en
> `scripts/benchmark/objetivos.json`.** *Un objetivo con URL muerta no da un error de medición: da
> una tabla vacía que parece un bloqueo de red* (**L-293**: el nombre de un recurso es una
> afirmación no verificada hasta que se abre).
>
> **⇒ Dos entornos independientes, dos causas distintas, la misma tabla vacía:** Cowork la dejó
> vacía por un proxy de red; acá quedó vacía por los muros de los propios sitios. *Eso deja de ser
> una limitación del entorno y pasa a ser una propiedad del problema.*

| Referente | n | Foto ÷ área tarjeta | Foto ÷ alto tarjeta | Control ÷ área | Precio ÷ nombre | Productos 1ª pantalla (visibles / completos) | Cromo previo | Control ≥48 dp |
|---|---|---|---|---|---|---|---|---|
| Chewy | — | — | — | — | — | — / — | — | — |
| Instacart | — | — | — | — | — | — / — | — | — |
| Amazon | — | — | — | — | — | — / — | — | — |
| Rappi | — | — | — | — | — | — / — | — | — |
| **Laika** `[MEDIDO]` web | **12** | **39,5 %** | **99,3 %** | **5,8 %** | **1,429 ×** | **1 / 0** | **436,7 px (65,8 %)** | **0/12 — NO** |
| Mercado Libre | — | — | — | — | — | — / — | — | — |
| **e-PetPlace** `[MEDIDO]` **app nativa** | **2** | **40,3 %** | **40,3 %** | **2,6 %** | **1,25 ×** | **0 / 0** | **587,7 dp (84,1 %)** | **sí (36 + hitSlop 8 = 52)** |

> **⚠️ LAS DOS FILAS NO SON LA MISMA SUPERFICIE, y mezclarlas es el error que este documento ya
> advirtió:** la de Laika es **web móvil** (viewport 390, tarjeta de UNA columna, 366 px de ancho);
> la nuestra es **la app nativa** medida en el SM-S938B del gate (384 dp, grilla de DOS columnas,
> tarjeta de 164 dp). **Se leen juntas para el mecanismo, jamás para copiar un número.**
>
> **Lo que el par sí sostiene, porque no depende del denominador:** Laika pone **nombre 14 px /
> precio 20 px peso 500** en una tarjeta de **366 px**; nosotros ponemos **nombre 16 / precio 20
> peso 700** en una de **164 dp**. ***Casi la misma tipografía en menos de la mitad de ancho, y el
> precio dos pesos más pesado.***
>
> **Y lo que el par DERRIBA:** en tres de las cuatro razones de esta tabla **no salimos peor que
> Laika, salimos mejor** (control 2,6 % contra 5,8 % · precio÷nombre 1,25 contra 1,429 · área
> táctil: la nuestra cumple 48 y la suya no). *La hipótesis «nuestro control pesa más que el de la
> referencia» queda medida y refutada — en G-07 el caso se sostiene en nuestra ley, no en la
> comparación.*

**Qué mide cada columna, para que nadie la malinterprete después:**

| Columna | Definición exacta |
|---|---|
| Foto ÷ área tarjeta | Área del bounding box de la imagen sobre área del bounding box de la tarjeta |
| Foto ÷ alto tarjeta | Alto de la imagen sobre alto de la tarjeta. **Distinto del anterior** si la foto no ocupa todo el ancho |
| Control ÷ área | Área del bounding box del control de agregar sobre área de la tarjeta |
| Precio ÷ nombre | Cociente de **`font-size` computado**, no de ancho de texto ni de área |
| Productos 1ª pantalla | **Dos cifras, y hay que mirar las dos.** «Visibles» cuenta tarjetas cortadas por el pliegue; «completas» solo las que entran enteras. La diferencia suele ser de 2× y cambia la conclusión |
| Cromo previo | Coordenada Y del borde superior de la primera tarjeta: todo lo que consumen buscador, filtros y avisos antes del primer producto |
| Control ≥48 dp | Cuántos de los controles medidos cumplen el mínimo táctil de Android Accessibility |

### Valores duros que sí están publicados

Estos son `[SPEC]`, citables hoy, sin correr nada.

| Valor | Cifra | Fuente |
|---|---|---|
| Área táctil mínima Android | **48×48 dp**, separación ≥8 dp, ≈9 mm físicos | `[SPEC]` Android Accessibility |
| Botón Andes (Mercado Libre) — large / medium / small | **48 / 32 / 24 dp** | `[SPEC]` AndesUI, repo Android |
| Radio de esquina Andes botón | 6 / 5 / 4 dp | `[SPEC]` AndesUI |
| Padding lateral Andes botón | 16 / 12 / 8 dp | `[SPEC]` AndesUI |
| Escala tipográfica Andes — Title | XL 32 / L 28 / M 24 / S 20 / **XS 18** dp, weight 600 | `[SPEC]` AndesUI |
| Escala tipográfica Andes — Body | L 18 / **M 16** / **S 14** / **XS 12** dp, weight 400 | `[SPEC]` AndesUI |
| Andes Thumbnail — tamaños | 24 / 32 / 40 / 48 / 56 / 64 / 72 / **80** dp | `[SPEC]` AndesUI |
| Stepper eBay — alto | **40 px** default, **48 px** large | `[SPEC]` eBay Playbook |
| Relación de aspecto de imagen de producto | **1:1** — *«our dominant and recommended ratio»* | `[SPEC]` eBay Playbook |
| Thumbnail Polaris (Shopify) mobile | **40 px** default, 72 px large | `[SPEC]` Polaris |
| Imagen de catálogo Instacart | 1:1, mín 600×600, recomendado 1000×1000, fondo blanco puro, **el producto llena el 85 % del área** | `[SPEC]` docs.instacart.com |

Dos observaciones de esa tabla que valen para el rediseño:

- **El botón de Andes hereda del texto, no al revés.** `andes_text_size_button_large` está definido como
  `subhead`; `_medium` como `body`; `_small` como `caption`. `[SPEC]` No hay un token tipográfico propio
  del botón. Mercado Libre trata el control como texto vestido, no como una entidad con voz propia.
- **`andes_button_height_large` = 48 dp clava exacto el mínimo táctil de Android Accessibility.** `[SPEC]` No lo
  supera. El control mide lo mínimo y nada más — que es el criterio de la sección ⓪.

> **Caveat de fecha, declarado:** el repositorio espejo de AndesUI al que se pudo acceder tiene su último
> commit el **2020-09-30** `[DOCUMENTADO]`, mientras la versión productiva en Maven es
> `components 10.23.0` `[DOCUMENTADO]`. Los valores son
> reales pero pueden estar desactualizados. Tratalos como orden de magnitud confirmado, no como el token
> vigente de hoy.

### Densidad

**Cuántos productos entran sobre el pliegue en móvil: NO ENCONTRADO.** El benchmark de Baymard de mobile
product lists está detrás de paywall; la página pública solo expone el conteo de ejemplos
(524 páginas analizadas `[DOCUMENTADO]`) y no la cifra. Es exactamente lo que el harness resuelve: la columna «Productos 1ª pantalla»
sale medida.

Lo que sí está publicado sobre el estado del arte:

- **78 % de los sitios móviles** tienen Product List UX entre «poor» y «mediocre» (58 % en desktop).
  `[INVESTIGACIÓN]` Baymard
- **80 %** no ofrece 3 o más thumbnails por ítem. `[INVESTIGACIÓN]`
- **67 %** no muestra precio por unidad en el listado. `[INVESTIGACIÓN]`
- Títulos: **no más de 3–4 líneas en móvil**. `[INVESTIGACIÓN]`

### Jerarquía: qué encuentra el ojo primero

**Consenso publicado, con una salvedad grande.** El único dato de eye-tracking duro que encontré es el de
NN/g sobre listados spec-driven en Amazon: 82 % del tiempo de visión al texto, 18 % a las fotos
`[INVESTIGACIÓN]`. Eso invierte la intuición de que la foto manda.

**El orden primero/segundo/tercero por referente: NO ENCONTRADO.** No hay estudio de eye-tracking
publicado por referente. Cualquiera que te dé ese orden sin medirlo te lo está inventando. Se puede
aproximar con el harness —tamaño y contraste son proxies razonables de captura visual— pero **eso es un
proxy, no una medición de mirada**, y hay que decirlo así.

Los **5 atributos universales** que Baymard exige en el ítem de lista, y que son lo más cercano a un
consenso de jerarquía: precio (permanentemente visible), título/tipo, thumbnail, ratings, variaciones.
**35 % de los sitios no muestra los cinco.** `[INVESTIGACIÓN]`

> **De esos cinco, `ratings` choca con la ley del producto.** En un marketplace multi-vendedor, poner
> calificación en la tarjeta de grilla es la puerta de entrada a la comparación entre vendedores, que
> está prohibida. `[IMPRESIÓN]` La salida: si se muestra, que sea rating **del producto**, nunca del
> vendedor, y nunca presentado de forma que ordene o compare. Si eso no se puede garantizar, **son cuatro
> atributos, no cinco** — y conviene saber que se está desviando de Baymard a propósito.

### Productos sin foto — el punto crítico

Con dos tercios del catálogo sin imagen `[DOCUMENTADO]` brief del proyecto, este es el riesgo principal,
y hay research publicado que lo respalda:

> **«List items without thumbnails were often completely ignored.»** `[GUIDELINE]` Baymard

No «rinden peor». **Ignorados.** Nótese que *«often»* es una observación cualitativa de testeo, no una
cifra con muestra — por eso va `[GUIDELINE]` y no `[INVESTIGACIÓN]`. Sigue siendo el hallazgo más
importante de esta sección, pero no es un porcentaje.

**Qué hace la industria: se rinde.** Instacart lo documenta con todas las letras: *«If a retailer doesn't
supply an image you may see a gray "no image" icon instead»* `[DOCUMENTADO]`. Su cadena de fallback
publicada es: imagen preferida de marca → imagen del retailer → imagen no preferida → **placeholder**
`[SPEC]`.

La plataforma más grande de grocery delivery resuelve el ítem sin foto con un ícono gris.
`[IMPRESIÓN]` **Eso no es resolverlo con dignidad: es abandonar el slot.**

**Por qué el placeholder gris es peor que no poner nada** — encadenando dos hallazgos:

1. NN/g: los usuarios **ignoran las imágenes decorativas** que no aportan contenido. `[INVESTIGACIÓN]`
2. Un ícono de cámara gris es, por definición, decorativo: no lleva información del producto.

`[IMPRESIÓN]` De ahí se sigue que el placeholder gris ocupa el slot más prominente de la tarjeta y
devuelve cero información — el caso extremo de tu hipótesis, con el agravante de que el producto ni
siquiera está. La conclusión de diseño no es «poner un placeholder mejor»: es **reasignar ese espacio a
lo que sí lleva información**. Marco esto como impresión porque nadie lo midió; es candidato directo a
A/B test propio.

**El patrón con dignidad que sí existe, y es citable.** `[SPEC]` El enum público de `type` de
`Andes Thumbnail` (Mercado Libre) tiene **un solo valor: `ICON`**. No tiene tipo «image».
`[IMPRESIÓN]` Que sea *la primitiva que te hace falta* es juicio mío: la spec describe el componente, no
su adecuación a un catálogo con dos tercios sin foto.

| Parámetro | Valores | Para qué te sirve |
|---|---|---|
| `accentColor` | AndesColor | El color **viene por parámetro**, no se deriva de una imagen que no existe |
| `hierarchy` | `LOUD` (fondo sólido de acento) / `QUIET` (fondo tenue) / `DEFAULT` (con borde) | Tres intensidades para graduar cuánto pesa el ítem sin foto |
| `size` | 24 → 80 dp `[SPEC]` | Ocho pasos |
| `icon size` | 16 → 48 dp `[SPEC]` | El ícono adentro |

Es decir: Mercado Libre tiene un componente de miniatura **cuyo caso base es un ícono sobre un color de
acento** `[SPEC]`. `[IMPRESIÓN]` Ícono de categoría + color derivado de categoría, en tres niveles de
énfasis, es el punto de partida que yo tomaría.

**La otra mitad: que el texto haga el trabajo.** Baymard da la licencia explícita — los elementos *«can be
presented as a single line of text, as long as the individual elements are styled differently»*,
diferenciando con **tamaño, capitalización, color, bold/italic y espaciado** `[GUIDELINE]`. Y el
82 % de tiempo de visión en texto de NN/g dice que el texto puede cargar la atención. La escala de Andes
te da los pasos —Title XS 18 / Body M 16 / Body S 14 / Body XS 12 `[SPEC]`— para construir jerarquía
**dentro** del slot que hubiera ocupado la foto.

**Lo que no existe y hay que decirlo:** busqué específicamente patrones publicados de catálogo B2B,
mayorista y farmacia, donde el catálogo incompleto es la norma. **NO ENCONTRADO.** Solo aparecieron hilos
de soporte de Shopify/BigCommerce/WooCommerce sobre cómo cambiar la imagen de placeholder, y un issue
abierto de Shopware sobre listas B2B sin imágenes. **No encontré ningún patrón resuelto publicado.**
`[IMPRESIÓN]` Lo leo como un hueco real del estado del arte y no como una falla de búsqueda —pero es una
ausencia de evidencia, y una búsqueda más profunda podría refutarlo.

---

## ② La ficha de producto

### Composición de la primera pantalla — a llenar con el harness

`./correr.sh --con-pausa --solo <referente>` corre todas las superficies de ese referente que estén en
`objetivos.json`. Para una sola superficie, se llama al medidor directo:

```bash
node medir.mjs --nombre chewy --superficie ficha --url "<url del producto>" --headed --pausa
```

Devuelve cada bloque de la primera pantalla con su alto y su porcentaje de pantalla.

| Referente | Foto principal (% de pantalla) | Nombre (% ) | Precio (% ) | Control (% ) | Alto hasta el control |
|---|---|---|---|---|---|
| Chewy | — | — | — | — | — |
| Instacart | — | — | — | — | — |
| Amazon | — | — | — | — | — |
| Laika | — | — | — | — | — |
| Mercado Libre | — | — | — | — | — |

### El único orden de elementos publicado

Instacart documenta el orden exacto de su ficha. Es la fuente más precisa que existe sobre esta
superficie `[SPEC]`:

> stock → nombre → tamaño → imágenes secundarias → info → **imagen principal → precio y precio por
> unidad → control de cantidad → botón «Add to Cart»** → guardar → recomendados → tabs (Details,
> Ingredients, Nutrition, Directions, Warnings)

**El detalle que importa para tu rediseño: la cantidad viene ANTES del botón de agregar.** No es
agregar-y-después-ajustar. Es elegir cuánto y después confirmar. `[SPEC]`

### Estado del arte, publicado

| Hallazgo | Cifra | Fuente |
|---|---|---|
| Fichas con UX «mediocre or worse» | **62 % móvil**, 64 % en app, 52 % desktop | `[INVESTIGACIÓN]` Baymard |
| No muestra precio por unidad | **81 %** | `[INVESTIGACIÓN]` |
| No da imagen «in scale» (referencia de tamaño) | **37 %** — y **42 % de usuarios** intenta deducir el tamaño desde la foto | `[INVESTIGACIÓN]` |
| No hace accesible el guardado/wishlist | **89 %** | `[INVESTIGACIÓN]` |
| Sitios móviles que **no** usan thumbnails para imágenes adicionales | **76 %** — y los thumbnails dieron *«the lowest incidence of unintended taps and errors»* frente a puntos o texto | `[INVESTIGACIÓN]` |

El dato de «in scale» es directamente accionable para vos: 42 % de los usuarios usa la foto para estimar
tamaño. Con dos tercios del catálogo sin foto `[DOCUMENTADO]` brief, **ese 42 % se queda sin nada** salvo que el peso y el
formato estén en el texto con jerarquía propia.

### Quick view: qué no hacer

**50 % de los sitios con productos visuales ofrece quick view. El 21 % lo aplica mal**, poniéndolo en
productos spec-driven donde *«even the extra space afforded by Quick Views is unlikely to accommodate all
features»* `[INVESTIGACIÓN]`. Alimento para mascotas es spec-driven. **El quick view no es para tu
catálogo.**

---

## ③ El carrito

### Composición de la primera pantalla — a llenar con el harness

| Referente | Línea de ítem (alto px) | Foto ÷ línea | Control de cantidad ÷ línea | Ítems visibles sin scroll | Alto del bloque de totales |
|---|---|---|---|---|---|
| Chewy | — | — | — | — | — |
| Instacart | — | — | — | — | — |
| Rappi | — | — | — | — | — |
| Mercado Libre | — | — | — | — | — |

La línea de ítem del carrito es la superficie donde la spec de eBay **sí** autoriza la papelera, así que
medir cuánto pesa el control contra cuánto pesa el producto en esta línea es la comparación directa con
la vitrina.

### El stepper, paso a paso — la spec exacta que estás por rediseñar

Esta es la parte mejor documentada de todo el encargo. La respuesta a tu pregunta existe **como spec
oficial escrita**, no como opinión.

#### 0 → 1: el botón se transforma en el lugar

Baymard tiene una guideline específica de grocery, titulada literalmente *«Dynamically Update the "Add to
Cart" Button to a Quantity Selector after Item Added»* `[GUIDELINE]`.

Al tocar agregar, **el botón mismo se convierte en el selector de cantidad**. No aparece un control
aparte. La justificación citada es *«somewhat akin to the rapid way shoppers grab items off the shelves
in physical grocery stores»* `[GUIDELINE]`.

El fallo observado cuando no se transforma es la cita que ya vimos: **«Oh my God, how do I tell if I
added it?»** Y las etiquetas chiquitas tipo *«4 in cart»* **se pasan por alto fácilmente**
`[GUIDELINE]` — observación cualitativa de testeo, sin cifra.

Referentes citados por Baymard haciéndolo bien: **Walmart, Peapod y Ocado** (Ocado con campo de texto
abierto además de los botones). Citados negativamente: **Target**, por mantener el «Add to Cart»
estático; **Whole Foods / Amazon**, por usar etiquetas de conteo poco claras `[INVESTIGACIÓN]`.

#### 1 → 2: botones, y actualización automática

- Los botones **+/−** ganaron contra dropdown y contra campo de texto solo: *«the most efficient option
  among the alternatives, allowing participants to adjust the quantity with a single click»*, y su
  propósito fue *«immediately understood»* `[GUIDELINE]`.
- **La actualización tiene que ser automática, sin excepción:** *«any changes should apply automatically
  as soon as the value is changed. Users shouldn't be required either to leave the field or have to click
  an "Update" link»*. Los usuarios *«assume that once they have made a change it will be automatically
  registered»* `[INVESTIGACIÓN]`.
- Baymard recomienda además **campo de texto abierto junto a los +/−**, para poder escribir «6» en vez de
  tocar seis veces `[INVESTIGACIÓN]`.
- Móvil específicamente: *«quantity buttons on mobile sites require extra care to ensure buttons are
  adequately sized and have enough spacing to prevent accidental taps»* `[INVESTIGACIÓN]`.

#### 2 → 1: el control sigue siendo stepper

**Ninguna fuente dice explícitamente que el control revierta a «Agregar» al bajar de 2 a 1.** El stepper
se mantiene, y lo que cambia es únicamente el destino del siguiente «menos». `[IMPRESIÓN]` La spec de
eBay lo trata como un solo componente con un rango, no como dos estados de UI que se alternan — el
control es el mismo objeto en 1, en 2 y en 9. La reversión a «Agregar», si existe, ocurre **al llegar a
0**, no al llegar a 1.

#### 1 → menos otra vez: **la regla exacta, y depende del mínimo**

eBay publica la spec, y la bifurcación es explícita `[SPEC]`:

> **Si el mínimo es 0:** *«the decrease button transitions to a delete button when the next action
> decrements to zero»*
>
> **Si el mínimo es mayor que 0:** *«the decrement button is disabled when the value matches the minimum
> value»*

Y —esto es lo más importante— **la condición de uso de la papelera**:

> *«The delete action is only to be used when the numeric stepper is pair or associated with an item tile
> such as item list in cart»* `[SPEC]`

**Traducción a tu decisión de diseño.** La papelera solo se justifica cuando el stepper está pegado a un
tile de ítem que va a desaparecer de la pantalla — o sea, **en el carrito**. En la tarjeta de grilla el
producto sigue existiendo después de quitarlo; ahí el destino natural del menos en 1 no es una papelera,
es **volver al botón «agregar»**. Son dos superficies distintas y la spec las distingue.

**Y el menos en 1 tiene que borrar, no deshabilitarse:**

- Recomendación explícita: *«users should be able to use the "minus" button when the quantity is 1 to
  remove the item»* `[GUIDELINE]`.
- Cita de testeo: *«I tried "minus" because I thought you could get it down to zero»* `[GUIDELINE]` —
  **es un participante, no una muestra**.
  **El usuario ya espera que el menos borre.** Deshabilitarlo en 1 rompe esa expectativa.
- NN/g coincide: *«allow shoppers to remove items by changing the quantity to zero»* `[GUIDELINE]`.

#### Confirmación: no

**Ninguna spec ni estudio que se revisó recomienda diálogo de confirmación para quitar del carrito.**
eBay, Baymard y NN/g convergen en lo mismo: **acción inmediata + deshacer.**

> *«After removing the product, consider then including an option to "undo" or a link back to the recently
> removed item's product page»* `[INVESTIGACIÓN]` Baymard

#### Accesibilidad del stepper — spec completa

`[SPEC]` eBay Playbook, pestaña de accesibilidad:

- El **input numérico** recibe foco con TAB. Los botones **+/− llevan `tabIndex="-1"`** y se ocultan del
  flujo de screen reader *«as they mimic built-in functionality»*.
- Flechas ARRIBA / ABAJO ajustan el valor.
- El botón de borrar necesita nombre accesible explícito: **«Remove item from cart»**. Se activa con
  ENTER o SPACE.
- Al llegar al máximo, el botón de sumar pasa a estado deshabilitado. Máximo por defecto: `null`.
- Tocar el valor lo convierte en campo editable: *«transitions the field to a focused state that accepts a
  custom input value, similar to a text field»*.

#### Adopción — dos cifras que no concilio

- **61 %** no usa botones ni botones+campo para actualizar cantidad `[INVESTIGACIÓN]` Baymard, artículo
  de carrito.
- **97 %** no lo hace `[INVESTIGACIÓN]` Baymard, benchmark de checkout.

Son benchmarks distintos, con muestra y año distintos, y **Baymard no publica la conciliación**. Doy las
dos sin promediarlas ni elegir la que conviene.

#### Lo que NO está documentado del stepper

- **Animación de la transformación botón→stepper: NO ENCONTRADO.** Ninguna spec pública define duración
  ni curva para esta transición específica.
- **Cambio optimista: NO DOCUMENTADO como tal.** Lo más cercano es NN/g exigiendo feedback *persistente* y
  advirtiendo contra *«disappearing overlays that quickly fade from view»* y contra deshabilitar el botón
  permanentemente `[INVESTIGACIÓN]`. Un teardown propone debounce de 200–300 ms antes de commitear para
  evitar errores de doble dígito `[REPORTADO]` — **fuente débil, tratalo como hipótesis a testear, no
  como número.**
- **Stepper real de Rappi y Amazon Fresh: NO ENCONTRADO.** No hay design system publicado ni teardown
  creíble. Los resultados de búsqueda fueron help-center de usuario final y contenido SEO sin valor.
  **Si lo necesitás, capturalo a mano en el dispositivo. No lo saques de un blog.**

### Guía general de steppers

`[GUIDELINE]` NN/g: mínimo **1 cm × 1 cm**; **horizontal preferido en móvil** porque *«creates enough
space between inputs to help users avoid accidental touches»*; usar **+/−** en horizontal y chevrons en
vertical; **evitar el stepper** cuando el rango es amplio sin un valor dominante, o cuando el espacio
obliga a segmentos apretados. Son pautas de diseño, no resultados con muestra.

### El carrito de Instacart, documentado

*«Items with a thumbnail image, product name, quantity, and price for the quantity»*, con acciones
«Change item quantities» y «Remove items» `[SPEC]`. **La documentación no especifica si el menos se
convierte en papelera** — NO ENCONTRADO en fuente oficial.

Nótese que el precio que muestra es **el precio por la cantidad**, no el unitario. `[SPEC]`

---

## ④ Dirección y elección de entrega

### Composición de la primera pantalla — a llenar con el harness

| Referente | ¿Mapa? (% de pantalla) | Campos visibles sin scroll | ¿Campo de referencias visible o escondido? | Alto hasta el botón de continuar |
|---|---|---|---|---|
| Instacart | — | — | — | — |
| Rappi | — | — | — | — |
| Mercado Libre | — | — | — | — |

### La regla de oro para direccionamiento informal

Google Maps Platform publica la arquitectura de validación de dirección en checkout, y contiene la regla
más importante de esta sección `[SPEC]`:

> *«Provide customers up to two chances to enter their address, and on the second attempt, accept their
> entry, even if it does not validate.»*

Complementada con: *«flag addresses that don't validate, so that a customer service representative can
review them before the order ships.»*

**La validación no puede ser un portón. Dos intentos y pasás igual, marcado para revisión.** Para Ecuador
esto no es un detalle: es la diferencia entre capturar el pedido y perderlo.

El flujo publicado es: **autocompletado al tipear → validar al tocar Continuar → mapa de confirmación**.
Con tres desenlaces `[SPEC]`:

| Desenlace | Cuándo | Qué se le ofrece al usuario |
|---|---|---|
| **Fix** | Calidad baja | Pedir más información |
| **Confirm** | Hay una corrección disponible | Elegir entre aceptar la corrección / mantener la suya marcada para revisión / reescribir |
| **Accept** | Entregable | Sin fricción |

### El problema del direccionamiento, con cifra

> *«Billions of people don't have a precise address.»* … *«Millions of deliveries fail around the world
> every year, and a leading cause is bad or imprecise addresses.»* `[SPEC]` Google Maps Platform

**Plus Codes:** un código da ≈**13×13 m**; agregando un carácter, ≈**2,5×2,5 m** `[SPEC]`.

### Campo de referencias / «cómo llegar»

- Baymard sobre Address Line 2: **20 % de los sitios lo esconde detrás de un link**, y lo recomiendan
  porque así *«users are much less likely to second-guess their initial input»* — **pero solo si la
  mayoría no lo necesita** `[INVESTIGACIÓN]`.
- `[IMPRESIÓN]` En Ecuador la condición se invierte: si la mayoría de tus pedidos **sí** necesita el
  campo de referencias, la propia guía de Baymard indica dejarlo **visible por defecto**, no escondido.
  La regla es condicional al dato de tus pedidos, no absoluta — **medí qué porcentaje de tus direcciones
  usa referencias antes de decidir esto.**

### Marcado de campos y teléfono

| Hallazgo | Cifra | Fuente |
|---|---|---|
| No marca **ni requeridos ni opcionales** | **61 %** | `[INVESTIGACIÓN]` |
| Marca **ambos** (lo correcto) | **14 %** | `[INVESTIGACIÓN]` |
| Participantes que **no completaron campos requeridos** cuando solo se marcaban los opcionales | **32 %** | `[INVESTIGACIÓN]` |
| No explica **por qué** pide el teléfono | **49 %** | `[INVESTIGACIÓN]` |
| Encuestados **reticentes a dar el teléfono** | **más del 70 %** | `[INVESTIGACIÓN]` |

Ese último par es directamente accionable: pedís teléfono para que el repartidor llame, y **más del 70 %
tiene reticencia**. Decir para qué es, al lado del campo, es barato.

### Fecha de entrega vs velocidad de envío

| Hallazgo | Cifra | Fuente |
|---|---|---|
| Sitios que **no dan fecha de entrega**, solo velocidad | **41 %** (48 % en el benchmark de checkout — doy las dos, Baymard no las concilia) | `[INVESTIGACIÓN]` |
| No incluye todas las opciones de fulfillment dentro del selector de envío | **52 %** | `[INVESTIGACIÓN]` |

Sin fecha, los usuarios *«come to a complete halt in an attempt to extrapolate or guesstimate when their
order would arrive»* — abrieron calendarios y hicieron cuentas `[INVESTIGACIÓN]`.

- Los **rangos de fecha** («3 al 9 de abril») funcionaron mejor que rangos de velocidad.
- **Rangos mayores a 5–7 días generaron duda** `[INVESTIGACIÓN]`.
- Los usuarios interpretan la fecha como *«a clear promise or guarantee»* `[GUIDELINE]`. Eso es una
  advertencia: la fecha que muestres es una promesa, no una estimación.

### LatAm específicamente

- **Franjas operativas reales de Rappi** para comercios: Almuerzo 11:00–15:30, Tarde 16:00–19:00, Cena
  19:00–23:30, Cierre 23:30–00:30. **La hora pico concentra 20–25 % del volumen diario** `[DOCUMENTADO]`.
  Es documentación de operaciones para comercios, no design system ni UX de checkout — por eso
  `[DOCUMENTADO]` y no `[SPEC]`. Te da las franjas reales del mercado, nada más.
- **Nombres exactos de los campos de dirección de Rappi: NO ENCONTRADO.** El dominio fue inaccesible. No
  se transcriben strings de UI de memoria.
- **Mercado Libre y el modelo código-postal-primero:** hay un volumen consistente y categorizado de
  reclamos públicos — «No me deja poner mi ubicación ni mi código postal», «No acepta mi código postal»,
  «Por el momento no podemos realizar envíos a esta ubicación» `[REPORTADO]`. Es evidencia anecdótica
  agregada, **no medición**, pero es señal direccional de que la validación dura de cobertura por CP es
  un punto de falla — exactamente lo que la regla de Google de «dos intentos y aceptá» busca evitar.

---

## ⑤ El seguimiento del pedido

*Complemento. Ya tenés criterio; esto confirma proporciones y mecanismos.*

### Mapa vs banda de estado

**Ninguna de las seis publica el reparto de alto. NO ENCONTRADO × 6, sin excepción.** El design system
de Uber (Base) es el único público con componente `Sheet`, pero sus specs no son extraíbles: la página es
una SPA que no sirve contenido a un fetch.

Esto significa que **el número que pedís no está publicado por ninguno de los seis**, y el harness lo
produce. La
superficie `seguimiento` mide el alto del mapa contra el alto de la banda:

| Referente | Mapa (% del alto) | Todo lo que no es mapa (% ) | Alto mapa (px) | ¿Alcanzable con el harness? |
|---|---|---|---|---|
| Rappi | — | — | — | Sí, con pedido en curso |
| Uber Eats | — | — | — | Sí, con pedido en curso |
| DoorDash | — | — | — | Sí, con pedido en curso |
| Uber | — | — | — | Sí, con viaje en curso |
| Amazon | — | — | — | Solo con envío a ≤10 paradas |
| Mercado Libre | — | — | — | Solo con envío en reparto |

> **La segunda columna no es «banda de estado».** El harness mide *todo lo que no es mapa* —header, banda,
> hoja inferior, lo que haya. Para aislar la banda hay que mirar el bloque correspondiente en
> `composicion` dentro del JSON. Lo digo acá para que nadie pegue el número bajo el rótulo equivocado.
>
> **Las tres últimas filas requieren un pedido real en el estado correcto.** Amazon solo muestra mapa a
> ≤10 paradas y MELI solo en reparto: si no coincide la ventana, esas celdas quedan sin llenar y hay que
> decirlo, no completarlas de memoria.

Lo que sí está documentado del patrón: Uber tiene una **barra/tarjeta inferior con la info del
conductor sobre el mapa** — *«tap the bar that displays the driver's info at the bottom»* `[DOCUMENTADO]`.
`[IMPRESIÓN]` De ahí deduzco mapa + hoja inferior y no pantalla partida; la cita sostiene la barra, no la
negación de la pantalla partida. DoorDash muestra el mapa con **tres
puntos** (Dasher, comercio, destino) `[DOCUMENTADO]`.

### La escalera de estados: backend rico → UI pobre, consistentemente

| Plataforma | Estados en backend | Pasos visibles al cliente | Ratio |
|---|---|---|---|
| **DoorDash** | **9** (`created`, `confirmed`, `enroute_to_pickup`, `arrived_at_pickup`, `picked_up`, `enroute_to_dropoff`, `arrived_at_dropoff`, `delivered`, `cancelled`) `[SPEC]` | **3** — *«in the process of being confirmed»*, *«at the restaurant»*, *«the Dasher is on the way to you»* `[DOCUMENTADO]` | 3:1 |
| **Uber Eats** | **7** (`SCHEDULED` → `EN_ROUTE_TO_PICKUP` → `ARRIVED_AT_PICKUP` → `EN_ROUTE_TO_DROPOFF` → `ARRIVED_AT_DROPOFF` → `COMPLETED` / `FAILED`) `[SPEC]` | **5** secciones: confirmación, preparación, camino al comercio, recolección, llegada `[REPORTADO]` | 1,4:1 |
| **Mercado Libre** | **~25** estados y subestados `[SPEC]`, conteo propio sobre la taxonomía | **~4** — «Em trânsito», «Saiu para entrega», «Entregue», «Problemas na entrega» `[REPORTADO]` | ~6,3:1 |

**El hallazgo transversal más fuerte de esta sección:** «repartidor asignado» existe en las tres máquinas
de estado y **en ninguna es un escalón visible**. Se comunica por otra vía: **la aparición del mapa**.
`[IMPRESIÓN]`, deducida del contraste entre las fuentes de backend y las de UI en las tres.

DoorDash documenta además que el estado **puede retroceder** a `created` si el Dasher se desasigna antes
del pickup `[SPEC]`. O sea: el cliente puede **perder el mapa después de haberlo tenido**. Ese caso hay
que diseñarlo.

**Qué cuenta como paso, resumido:** «pedido confirmado» sí es paso en Uber Eats (sección 1 de 5) y en
DoorDash (etapa 1 de 3). «Repartidor asignado» no lo es en ninguna. En MELI, `out_for_delivery` es
técnicamente un **subestado**, no un estado, y aun así **sí** se muestra como escalón. La taxonomía
interna y la escalera visible **no tienen por qué coincidir** — es una decisión de producto, no una
consecuencia del modelo de datos.

### Cómo dicen el tiempo — tres respuestas distintas al mismo problema

| Plataforma | Formato | Mecanismo |
|---|---|---|
| **Uber Eats** | ETA **+ «Latest Arrival By»** (hora tope) `[REPORTADO]` | **Expone el techo** en vez de esconderlo. Respaldado a nivel modelo: DeepETA usa **pérdida asimétrica** para *«control the relative cost of underprediction vs overprediction… being a minute late is worse than being a minute early»* `[DOCUMENTADO]` blog de ingeniería de Uber |
| **DoorDash** | ETA + una de las tres etapas `[DOCUMENTADO]`. **¿Rango o exacto? NO ENCONTRADO** | Internamente producen **pronóstico probabilístico**, no punto: dos entregas con el mismo ETA de 20 min, una con *«wide spread»* y otra con *«tight grouping»*. Métrica CRPS. **20 % de mejora relativa** vs el modelo previo `[DOCUMENTADO]` blog de ingeniería de DoorDash. `[IMPRESIÓN]` Su patente sugiere un punto que se recalcula en cada hito — pero una patente describe lo reivindicado, **no lo que está en producción** |
| **Amazon** | **Elude el tiempo**: usa **paradas restantes** `[REPORTADO]` | Convierte incertidumbre temporal en una métrica discreta y honesta |
| **Mercado Libre** | *«previsão de entrega»* — **fecha**, no minutos `[REPORTADO]` | La unidad natural del e-commerce multi-día |
| **Uber (rides)** | ETA de llegada del conductor `[DOCUMENTADO]`. **¿Rango o exacto? NO ENCONTRADO** | — |
| **Rappi** | **NO ENCONTRADO** | Único dato temporal oficial: Rappi Turbo promete **10 minutos** `[DOCUMENTADO]` |

**¿Cambia el formato según cercanía? NO ENCONTRADO en las seis.** Nadie lo publica.

`[IMPRESIÓN]` El contraste más instructivo es DoorDash contra Uber Eats: DoorDash tiene la **mejor
maquinaria de incertidumbre publicada** (forecast probabilístico, CRPS, 20 % de mejora) y **la esconde**
detrás de un número puntual; Uber Eats tiene menos aparato y **publica el peor caso**. La honestidad no
salió del modelo, salió de una decisión de interfaz.

### Qué muestran del repartidor y qué no

| Dato | Uber (rides) | Uber Eats | DoorDash | Amazon | MELI | Rappi |
|---|---|---|---|---|---|---|
| Nombre | ✓ `[DOCUMENTADO]` | ✓ `[REPORTADO]` | NO ENCONTRADO | NO ENCONTRADO | NO ENCONTRADO | NO ENCONTRADO |
| Foto | NO ENCONTRADO | NO ENCONTRADO | NO ENCONTRADO | NO ENCONTRADO | NO ENCONTRADO | NO ENCONTRADO |
| Vehículo (marca/modelo) | ✓ `[DOCUMENTADO]` | En API `[SPEC]` | En API `[SPEC]` | NO ENCONTRADO | NO ENCONTRADO | NO ENCONTRADO |
| Patente | ✓ `[DOCUMENTADO]` | En API `[SPEC]` | NO ENCONTRADO | NO ENCONTRADO | NO ENCONTRADO | NO ENCONTRADO |
| **Calificación** | **NO ENCONTRADO** | **NO ENCONTRADO** | **NO ENCONTRADO** | **NO ENCONTRADO** | **NO ENCONTRADO** | **NO ENCONTRADO** |
| Llamar | ✓ `[DOCUMENTADO]` | ✓ `[DOCUMENTADO]` | ✓ `[DOCUMENTADO]` | NO ENCONTRADO | NO ENCONTRADO | NO ENCONTRADO |
| Chat | ✓ `[DOCUMENTADO]` | ✓ `[REPORTADO]` | ✓ `[DOCUMENTADO]` | NO ENCONTRADO | NO ENCONTRADO | ✓ *«at the end»* `[DOCUMENTADO]` |

**La respuesta a tu pregunta específica: ninguna de las seis _documenta_ que muestre la calificación del
repartidor al cliente.** NO ENCONTRADO × 6. `[IMPRESIÓN]` Seis ausencias de documentación no prueban seis
ausencias en la UI — pero el patrón es lo bastante consistente como para tratarlo como señal. Es notable que la propia página de Uber sobre verificación de identidad del
conductor —justo donde uno esperaría la lista completa— enumera nombre, marca/modelo y patente, y **no
menciona ni foto ni calificación** `[DOCUMENTADO]`.

`[IMPRESIÓN]` Amazon y Mercado Libre parecen no personalizar al repartidor en absoluto. Coherente con un
modelo de paquetería donde el repartidor no es una entidad de producto. Amazon compensa con **prueba de
entrega**: foto del paquete y descripción de ubicación, ej. *«Your package was left near the front door
or porch»* `[REPORTADO]`.

Advertencia de método: que un dato exista en la API **no implica que se muestre al cliente**. La API de
Uber Direct expone teléfono, patente y tipo de vehículo; eso es integración, no interfaz.

### Cuando no hay datos de posición — tres arquitecturas

Este es el caso que más te sirve, porque es el que vas a tener seguido.

| Enfoque | Plataforma | Qué hace exactamente |
|---|---|---|
| **Ilustración animada** | Uber Eats `[REPORTADO]` | El mapa **no se renderiza** hasta que hay repartidor. El hueco se llena con animación temática: «batidor y bol» para preparación, «bolsas llenas de comida» para llegada |
| **Texto de disculpa** | DoorDash `[DOCUMENTADO]` | Sin mapa antes de la asignación. Texto literal: *«Please bear with us as we may be more busy than usual»* |
| **Mapa condicionado a proximidad** | Amazon `[REPORTADO]` | **No hay mapa hasta que el conductor tiene ≤10 paradas restantes.** El mapa es una recompensa de proximidad, no el estado por defecto. Si el envío va por UPS/FedEx/USPS, **nunca** hay mapa: gráficos de progreso tradicionales |

Uber lo dice sin ambigüedad: *«A map appears showing their location»* — **aparece**, no está vacío
`[DOCUMENTADO]`.

Mensajes de fallo de asignación de Uber Eats: *«No Uber Eats Couriers Nearby»* y *«Oops, Finding Another
Delivery Driver»* `[REPORTADO]`.

Mercado Libre **modela explícitamente el fallo** en su taxonomía: `delayed`, `not_localized`,
`receiver_absent` son subestados que llegan al comprador `[SPEC]`. `[IMPRESIÓN]` Eso sugiere que en MELI
el canal principal es la banda de estado y no el mapa.

**Rappi: qué ve el cliente sin repartidor asignado, NO ENCONTRADO.** Lo único documentado es el rótulo
que ve **el comercio** en el portal de aliados: **«Buscando Repartidor para orden»** `[DOCUMENTADO]`.

**Conclusión para tu diseño:** las **tres arquitecturas documentadas** coinciden en algo — ninguna
muestra un mapa vacío. O se oculta, o se reemplaza por otra cosa. **Rappi y Mercado Libre quedan fuera de
esta conclusión**: de Rappi no hay evidencia y de MELI solo una impresión. Con esa salvedad: el mapa vacío
no aparece elegido por ninguno de los tres que sí pude verificar.

### Pedido dividido en varias entregas

Hay que separar dos cosas que se confunden:

**(a) El cliente recibe varias entregas.**

- **DoorDash / DoubleDash** `[DOCUMENTADO]`: *«Most DoubleDash orders arrive at the same time as the main
  order from one Dasher.»* Pero: *«DoubleDash items can be tracked separately in the app. If your order is
  being delivered by two different Dashers, you'll see individual tracking updates for each delivery,
  including estimated arrival times and handoff status.»* **Es el único de los seis que documenta
  explícitamente el tracking separado.** Ventana de 15–20 min post-checkout para agregar.
- **Mercado Libre** `[SPEC]`: la taxonomía es **por shipment, no por order** — cada envío tiene su propio
  `status`/`substatus` independiente. `[IMPRESIÓN]` Estructuralmente eso produce **varias escaleras
  paralelas**. Cómo se agrupan visualmente: **NO ENCONTRADO**.
- **Uber Eats multi-store** `[REPORTADO]`: existe («Bundle another store», oct 2023, dos comercios
  cercanos, sin cargo extra). Cómo se muestra el tracking de los dos: **NO ENCONTRADO**.
- **Amazon**: parte pedidos rutinariamente, pero **la representación exacta en la UI (tarjetas por envío,
  «1 de 2», fechas separadas) NO ENCONTRADO** con fuente creíble. Solo apareció contenido SEO de baja
  calidad. **No lo afirmo.**
- **Rappi: NO ENCONTRADO.**

**(b) El repartidor lleva varios pedidos (batching).** Esto es del lado del repartidor y **el cliente
normalmente no lo ve**.

- DoorDash `[SPEC]`: *«two or more offers as a batch»*, con botón **«Add to Route»**, y el Dasher **puede
  reordenar los drop-offs a su criterio**. **Qué ve el cliente: no descrito.** `[IMPRESIÓN]` El cliente ve
  un ETA que depende de un reordenamiento discrecional que la app no le expone.
- Uber Eats `[SPEC]`: el repartidor puede tomar múltiples pedidos; se le ofrece un segundo durante el
  primer pickup. En multi-entrega el cliente debe *«contact each delivery person separately»*
  `[DOCUMENTADO]` → `[IMPRESIÓN]` cada entrega tiene su propia tarjeta.
- Amazon `[IMPRESIÓN]`: es el inverso de todos. Su modelo **es** intrínsecamente multi-parada, y el
  contador de «paradas restantes» **expone** ese hecho al cliente en vez de ocultarlo.

---

## ⑥ La postventa

> ### ⚠️ INSUMO PARA UNA SESIÓN POSTERIOR
> **Esta sección no es para la sesión que arranca ahora.** Es material para el trabajo siguiente. Está
> acá porque el encargo pidió un solo archivo.

Contexto que condiciona todo: hoy la única postventa es un botón que abre WhatsApp; la pasarela
probablemente **no permite reembolsos parciales**; y los contracargos llegan a e-PetPlace aunque el error
sea del vendedor. La pregunta operativa es **cómo se resuelve sin devolver plata parcialmente.**

### La respuesta corta

**Hay tres mecanismos que resuelven un pedido incompleto sin tocar la pasarela**, y los tres están
documentados en producción:

1. **Crédito interno** — Instacart, Rappi, Amazon.
2. **Reposición / reenvío del ítem faltante** — Mercado Libre (`change_product`, `product`), Amazon.
3. **Reembolso sin devolución** («quedátelo») — Chewy, Amazon, Mercado Libre para casos de bajo valor.

El que más te sirve es el **1**, y el modelo a copiar es el de **Instacart**, no el de Rappi. Detalle
abajo.

### ⭐ Saldo o crédito interno — la pregunta central del encargo

| | **Instacart** | **Rappi** | **Mercado Libre** | **Amazon** | **Chewy** | **iFood** |
|---|---|---|---|---|---|---|
| **Nombre exacto** | *Instacart credit* / *credit towards a future order* `[DOCUMENTADO]` | *Créditos de Rappi* / Billetera de Créditos `[DOCUMENTADO]` | *Dinero en cuenta* de Mercado Pago `[DOCUMENTADO]` | *Gift Card balance* / promotional credit `[REPORTADO]` | eGift Card existe como **producto**, no como remedio `[DOCUMENTADO]` | «saldo iFood» existe como medio de pago `[REPORTADO]` |
| **¿Vence?** | NO ENCONTRADO | **SÍ** — 6 meses AR, 1 año CO `[DOCUMENTADO]` | NO ENCONTRADO (`[IMPRESIÓN]`: no, por ser dinero electrónico) | NO ENCONTRADO | NO ENCONTRADO | NO ENCONTRADO |
| **¿Se retira a efectivo?** | `[IMPRESIÓN]` No | **NO** — *«no tienen valor monetario»* `[DOCUMENTADO]` | **SÍ**, transferible a banco `[REPORTADO]` | NO ENCONTRADO | — | NO ENCONTRADO |
| **¿Simétrico al reembolso?** | **SÍ** — *«a refund **or** credit»* `[DOCUMENTADO]` | Elección, pero sesgada | No es elección: lo define el medio de pago `[DOCUMENTADO]` | NO ENCONTRADO | **No existe como remedio** | NO ENCONTRADO |
| **Tope** | **Hasta lo pagado por el ítem** `[DOCUMENTADO]` | NO ENCONTRADO | `partial_refund` **≤ 90 %** `[SPEC]` | NO ENCONTRADO | — | NO ENCONTRADO |
| **Dónde vive** | Sección *«Credits, promos & gift cards»*, **auto-aplicado en checkout** `[DOCUMENTADO]` | Billetera de Créditos `[DOCUMENTADO]` | Cuenta Mercado Pago | NO ENCONTRADO | — | «carteira» `[REPORTADO]` |

### ⚠️ Antes de seguir: el crédito interno contra nuestra propia ley

La ley del producto prohíbe **moneda visible (puntos, niveles, badges)**. Un saldo interno se le parece.
Antes de recomendar nada hay que resolver esto, porque si no la sección entera se autocontradice.

`[IMPRESIÓN]` La distinción que propongo —y es mía, no sale de ninguna fuente— es entre **reembolso
diferido** y **moneda**. Un crédito es moneda cuando acumula, cuando tiene marca propia, cuando vence, y
cuando el usuario tiene que administrarlo. Es un reembolso diferido cuando no hace nada de eso.

**Test de cinco preguntas.** Si alguna da «sí», es moneda y la ley aplica:

| Pregunta | Crédito de **Rappi** | Crédito de **Instacart** | Lo que deberíamos hacer |
|---|---|---|---|
| ¿Se **gana** haciendo cosas, además de recibirse por un problema? | Sí — concesiones comerciales, regalos `[DOCUMENTADO]` | No documentado | **Solo se emite por un problema concreto** |
| ¿**Acumula** un saldo que el usuario mira crecer? | Sí — «Billetera de Créditos» `[DOCUMENTADO]` | Vive en una sección de cuenta `[DOCUMENTADO]` | **Sin billetera. Sin saldo en el home** |
| ¿Tiene **marca propia**? | Sí — «Créditos de Rappi» `[DOCUMENTADO]` | «Instacart credit» `[DOCUMENTADO]` | **Se llama «a favor» y se expresa en dólares** |
| ¿**Vence**? | Sí — 6 meses AR `[DOCUMENTADO]` | No documentado | **Nunca vence.** El vencimiento es urgencia artificial |
| ¿El usuario tiene que **administrarlo** (canjear, elegir, recordar)? | Sí | No — auto-aplicado `[DOCUMENTADO]` | **Auto-aplicado, sin canje** |

Con esas cinco restricciones, lo que queda no es una moneda: es **un reembolso que todavía no salió de la
plataforma**, y se comporta como tal. Sin billetera, sin marca, sin vencimiento y sin canje, no hay nada
que exhibir ni que perseguir.

**Y hay que decirlo en la interfaz.** Si aparece un monto a favor, al lado va la frase que dice de qué
pedido salió y que no vence. Un saldo sin procedencia visible es exactamente lo que la ley quiere evitar.

**La alternativa que no tiene este problema y hay que preferir cuando se pueda:** **reposición o reenvío
del ítem faltante** (mecanismo 2). No involucra dinero ni saldo, resuelve el problema real de la familia
—que quería el producto, no la plata— y no toca la pasarela. **El crédito debería ser el segundo recurso,
no el primero.**

---

**Dicho eso, el modelo de crédito a copiar es Instacart.** Tres razones, todas documentadas:

1. **El crédito está publicado a la par del reembolso, no como consuelo:** *«we can issue a refund **or**
   credit towards a future order up to the amount you paid for an item»* `[DOCUMENTADO]`.
2. **Tiene tope explícito** —lo pagado por el ítem— así que no es una moneda que la plataforma emite a
   discreción.
3. **Se auto-aplica en el checkout.** No hay que canjearlo `[DOCUMENTADO]`.

Y una distinción que Instacart documenta y conviene replicar: *«No refunds display in Instacart account
balance»* — **los reembolsos van al medio de pago y no aparecen como saldo; solo los créditos viven en la
cuenta** `[DOCUMENTADO]`. Son dos carriles separados y el usuario los ve separados.

**El modelo a NO copiar: Rappi.** Está en el extremo opuesto y tiene tres piezas que en conjunto son un
patrón oscuro:

- El crédito **vence a los 6 meses** (Argentina) y *«no se suspenderá, interrumpirá, renovará, ni se
  prorrogará»*. Vencido, no se redime y **no se devuelve efectivo** `[DOCUMENTADO]`.
- **No se puede retirar:** *«Los Créditos no tienen algún valor monetario, ni constituyen un medio de
  pago, instrumento crediticio o financiero»* `[DOCUMENTADO]`.
- **El incentivo es estructural, no una elección libre:** el crédito es **inmediato** contra **20 días
  hábiles** (AR) o **30** (MX/CO) del reembolso a medio de pago. Y si pagaste en efectivo, **es la única
  opción** `[DOCUMENTADO]`.
- **La cláusula trampa:** existe una tercera vía —transferencia bancaria— pero solo *«si no ha usado
  créditos»* `[DOCUMENTADO]`. `[IMPRESIÓN]` Aceptar créditos y gastar algo **cierra la puerta** a
  recuperar dinero real.

**Eso último va directo a la lista de lo que no adoptamos.**

Dato de contraste útil: Amazon usa **el mismo incentivo de velocidad** que Rappi —gift card en **2–3
horas** contra **3–5 días hábiles** a tarjeta de crédito `[REPORTADO]`— pero **no pude verificar si vence
ni si se retira**, porque su centro de ayuda es infetcheable. Queda abierto.

### Reembolsos parciales — cómo lo instrumentan los que pueden

| Plataforma | Mecanismo | Tope |
|---|---|---|
| **Mercado Libre** | `partial_refund` es un **tipo de resolución de primera clase**, solo para reclamos PDD. Endpoint propio: `POST /marketplace/v2/claims/$ID/expected-resolutions/partial-refund` `[SPEC]` | **≤ 90 %.** *«Maximum 90% refund available; 100% refunds use full refund endpoint instead»* `[SPEC]` |
| **Instacart** | *«Instacart may issue a partial refund or credit for an item if **only a portion of an item** is missing or damaged»* `[DOCUMENTADO]` | Lo pagado por el ítem |
| **Amazon Pay** | *«in any amount up to the original charge»* `[DOCUMENTADO]` | Máximo 15 % más que el cargo original, o US$75 más, lo que sea menor; **no más de 10 reembolsos por cargo** `[DOCUMENTADO]` ⚠️ esto es **Amazon Pay**, no el retail de Amazon.com — no lo extrapoles |

**El hallazgo más aprovechable de esta subsección, dado que tu pasarela no hace parciales:** el
`partial_refund` de Mercado Libre **no es una imposición, es una oferta negociada**. Campos `status`:
`pending` / `accepted` / `rejected`. *«Buyer accepts/rejects offer; rejection allows dispute
escalation»* `[SPEC]`.

`[IMPRESIÓN]` Ese patrón —**ofrecer** una resolución, que el usuario pueda **rechazarla**, y que el
rechazo **escale** en vez de cerrar— es replicable sin tocar la pasarela, porque la oferta puede ser
crédito o reposición en vez de plata. Es la pieza estructural que te falta hoy, donde WhatsApp es todo el
protocolo.

Detalle técnico de MELI que conviene entender: en la capa de pagos, el parcial se expresa como **monto
arbitrario**, no como selección de línea de pedido — reembolso total = no se especifica `amount`; parcial
= se especifica `[SPEC]`. `[IMPRESIÓN]` La granularidad es **monetaria, no por SKU**.

### Llegó incompleto — el caso más común

| | **Instacart** | **Rappi** | **Mercado Libre** | **Chewy** | **iFood** | **Amazon** |
|---|---|---|---|---|---|---|
| **Ruta** | Order History, order details, **o desde la calificación si das <4 estrellas** `[SPEC]` | Cuenta → Ayuda → pedido → «Tengo productos incorrectos, dañados o faltantes» `[DOCUMENTADO]` | Reclamo sobre el recurso `order`, código **PDD** `[SPEC]` | **Teléfono 24/7** — 1-800-672-4399 `[DOCUMENTADO]` | Pedidos → Ajuda → «Com o pedido» `[REPORTADO]` | Your Orders → «Problem with order» `[REPORTADO]` ⚠️ fuente débil |
| **Toques** | NO ENCONTRADO | ~5 (ruta nueva) `[IMPRESIÓN]` | NO ENCONTRADO | — | ~4–5 `[REPORTADO]` | NO ENCONTRADO |
| **¿Foto?** | **NO la piden** — no figura en la política `[DOCUMENTADO]` | **SÍ, requisito explícito** `[DOCUMENTADO]` | NO ENCONTRADO | NO ENCONTRADO | **SÍ** `[REPORTADO]` | **No obligatoria** `[REPORTADO]` |
| **Granularidad** | **Por ítem y por cantidad** — *«select individual items… specify how many items were affected»* `[SPEC]` | Por producto `[DOCUMENTADO]` | Por reclamo | — | Por ítem `[REPORTADO]` | NO ENCONTRADO |
| **¿Automático o humano?** | **AUTOMÁTICO** — muestra *«a real-time calculation of refunds or credits»* antes de confirmar `[SPEC]` | **HUMANO** — soporte evalúa y aprueba; *«no estamos obligados a ofrecerte compensaciones»* `[DOCUMENTADO]` | Humano en etapa `dispute`, con `mediator` `[SPEC]` | **HUMANO**, discrecional `[DOCUMENTADO]` | **Bot primero**, humano a pedido `[REPORTADO]` | NO ENCONTRADO |
| **Ventana** | **7 días** `[DOCUMENTADO]` | *«de manera inmediata»*; tardar es causal de rechazo `[DOCUMENTADO]` | **30 días** para devolver `[REPORTADO]` | NO ENCONTRADO | **48 h** `[REPORTADO]` | ⚠️ conflicto de fuentes: 30 vs 90 días |

**El mecanismo más limpio del set, y el que más te conviene:** Instacart calcula el monto **en vivo,
antes de confirmar**, sobre una selección por ítem y por cantidad `[SPEC]`. El usuario ve exactamente qué
va a recibir antes de aceptar. Sin humano, sin foto, sin negociación.

**El detalle de diseño más interesante de todo el encargo:** en Instacart, **calificar con menos de 4
estrellas ES el flujo de reclamo** `[SPEC]`. Rating y reembolso son el mismo embudo. Ninguna de las otras
cinco lo replica.

### Llegó mal o en mal estado

- **Rappi agrupa los tres casos en un solo ítem de menú** — «Tengo productos incorrectos, dañados o
  faltantes» `[DOCUMENTADO]`. No hay flujo separado. `[IMPRESIÓN]` Es una simplificación defendible: la
  familia no distingue bien entre «faltó» y «vino mal» cuando está enojada.
- **Rappi publica la lista completa de causales de rechazo** `[DOCUMENTADO]`, que es un artefacto raro y
  útil: compartir el código de seguridad antes de recibir; dirección incorrecta; no fue posible entregar
  pese a llegar; reporte deshonesto; tardanza excesiva o falta de evidencias.
- **Chewy y la farmacia:** *«We do not accept returns or exchanges on prescription medications. However,
  if the medication you received is incorrect or damaged we will gladly exchange it… on a case-by-case
  basis»* `[DOCUMENTADO]`. Relevante para tu catálogo si vendés recetados.
- **Instacart y las sustituciones** — caso propio y bien documentado `[SPEC]`. La preferencia se fija en
  **cinco puntos distintos**: PDP, carrito, checkout, post-checkout y pantalla de estado. Tres opciones
  ante faltante: (1) ítem específico elegido por el cliente, con recomendaciones por ML; (2) *«shopper's
  best match»*, **con aprobación del cliente en tiempo real** durante la compra; (3) **reembolso** — o
  sea, «no me reemplaces» se instrumenta como refund, no como sustitución. Y la preferencia **se
  recuerda**: *«Customers' replacement items are saved so that they don't have to choose the replacement
  the next time»*.

### No llegó nunca

| Plataforma | Cuánto hay que esperar |
|---|---|
| **Amazon** | Después de la fecha estimada, **o 3 días** tras la confirmación de entrega, lo que ocurra primero. Prerrequisito: contactar al vendedor y **esperar 48 h**. Límite: **90 días** `[REPORTADO]` |
| **Mercado Libre** | **21 días** desde la fecha de entrega prevista `[REPORTADO]` |
| **Instacart** | Sin tiempo mínimo publicado. Para entregas desatendidas reportadas **<20 min**, el sistema **fuerza un chat con el shopper antes de escalar** `[SPEC]` |
| **Rappi** | NO ENCONTRADO. Pero hay una exclusión documentada: no hay reembolso si *«No fue posible entregarte el pedido a pesar de que llegó a tu dirección»* `[DOCUMENTADO]` |
| **Chewy** | NO ENCONTRADO. Cláusula relevante: *«The risk of loss and title for such items pass to you upon our delivery to the carrier»* `[DOCUMENTADO]` |
| **iFood** | NO ENCONTRADO |

`[IMPRESIÓN]` El patrón del **paso intermedio obligatorio** —Amazon te hace esperar 48 h y contactar al
vendedor; Instacart te hace chatear con el shopper primero— es un filtro de volumen barato y no es hostil
si el paso intermedio tiene chance real de resolver.

### Devoluciones: quién retira, quién paga, cuánto tarda

| Plataforma | Quién retira | Quién paga | Cuándo se acredita |
|---|---|---|---|
| **Mercado Libre** | MELI **genera la etiqueta**, el comprador despacha `[SPEC]` | **NO ENCONTRADO** en fuente primaria. El endpoint `/shipments/$ID/costs` expone el costo pero **no define la asignación** `[SPEC]` | Campo `refund_at`: `"shipped"` (al despachar), `"delivered"` (**3 días** después de que el vendedor recibe), **`"n/a"` (bajo valor, sin devolución)** `[SPEC]` |
| **Amazon** | Dropoff (ej. UPS) `[DOCUMENTADO]` | Free Returns: *«no deduction for return shipping»*. Métodos pagos: *«the cost… will be deducted from your refund»*. Error de Amazon: lo reembolsan `[DOCUMENTADO]` | Gift card **2–3 h**; crédito **3–5 días**; prepaga **hasta 30 días**; débito **hasta 10 días** `[REPORTADO]` |
| **Instacart** | **Nadie.** El cliente lleva el ítem a la tienda con el recibo digital; aplica la política **del retailer**, no de Instacart `[DOCUMENTADO]` | — | Same-day si se pide **<24 h**; estándar **5–10 días hábiles** `[DOCUMENTADO]` |
| **Chewy** | `[REPORTADO]` Chewy paga; retiro FedEx con etiqueta prepaga | `[REPORTADO]` Chewy | NO ENCONTRADO |
| **Rappi / iFood** | **No aplica.** No hay logística inversa: la resolución es económica `[IMPRESIÓN]` | — | Créditos inmediato; medio de pago **20 días hábiles** AR, **30** MX/CO `[DOCUMENTADO]` |

> **Sobre los «365 días» de Chewy: NO VERIFICADO.** Es la cifra más citada de la industria y **no pude
> confirmarla en fuente oficial** — el centro de ayuda actual es una SPA que no sirve contenido. La fuente
> secundaria que la reporta atribuye el detalle a «un representante de Chewy», no a documentación. **No la
> uses como referencia sin verificarla vos.**

### ⭐ Reembolso sin devolución — el mecanismo que resuelve tu restricción

Tres plataformas lo tienen documentado, y es la salida más limpia cuando no podés hacer parciales:

- **Chewy** `[DOCUMENTADO]`: *«At our discretion, a refund may be issued without requiring a return.»* Y
  existe un artículo de ayuda **titulado exactamente** «Donate or discard refunded items».
- **Mercado Libre** `[SPEC]`: el valor `refund_at: "n/a"` corresponde a *«casos de bajo valor sin
  generación de devolución»*. Es el equivalente estructural: te devuelven y te quedás el producto.
- **Amazon / Returnless Resolutions** `[REPORTADO]`, anunciado 13-ago-2024: ítems con precio promedio
  **> US$75 son inelegibles**; excluidos peligrosos y voluminosos; **solo clientes «without a history of
  abuse»**; **Amazon decide la elegibilidad**, no el vendedor ni el comprador.

`[IMPRESIÓN]` Los tres convergen en la misma regla implícita: **por debajo de cierto valor, la logística
inversa cuesta más que el producto**. Para tu catálogo —alimento, snacks, accesorios chicos— ese umbral
cubre casi todo. Y el filtro de Amazon («sin historial de abuso») es la pieza que hace el mecanismo
sostenible.

### Cancelar antes de que llegue

**El corte no es temporal, es de estado.** Ninguno usa un reloj; todos usan un hito operativo.

| Plataforma | Hasta cuándo |
|---|---|
| **Instacart** | *«at any time before a shopper begins shopping»* → gratis. Después: **hasta US$15** de cargo y hay que contactar a soporte `[DOCUMENTADO]` |
| **Rappi — Restaurantes** | *«si el repartidor aún no está en camino hacia tu dirección»* `[DOCUMENTADO]` |
| **Rappi — Market / Farmacia / Pets** | *«hasta el momento en el que los productos estén en proceso de pago»* `[DOCUMENTADO]` |
| **Rappi — Turbo** | *«hasta antes de que la tienda empiece a seleccionar tus productos»* `[DOCUMENTADO]` |
| **Mercado Libre** | Botón «Cancelar compra» **mientras se está preparando**. Después: rechazarlo al recibir `[REPORTADO]` |
| **iFood** | Antes de que el restaurante confirme → reembolso total. Después, **el restaurante puede rechazar la cancelación** `[REPORTADO]` |
| **Amazon** | NO ENCONTRADO en fuente primaria (help center bloqueado) |

Rappi publica la justificación del cargo por cancelación: compensar *«a quienes ya comenzaron a preparar
o gestionar tu pedido»* `[DOCUMENTADO]`. `[IMPRESIÓN]` Nombrar a quién se compensa hace el cargo mucho más
tolerable que presentarlo como penalidad.

Detalle técnico útil: Rappi documenta que **las preautorizaciones de tarjeta se cancelan de inmediato** y
los cargos ya procesados inician **reversión automática** `[DOCUMENTADO]`.

**iFood es el único donde un tercero tiene poder de veto sobre la resolución** `[REPORTADO]`. Vale
marcarlo porque tu modelo es marketplace con vendedores, igual que iFood: si el vendedor puede rechazar,
el usuario queda a merced de alguien que no eligió.

### Repetir un pedido anterior

| Plataforma | Cómo se llama | Dónde vive |
|---|---|---|
| **Instacart** | **«Buy It Again»** `[SPEC]` | Link **en el header**; **carrusel en la home** para clientes con **≥6 compras**; **badge «Buy it again»** sobre productos ya comprados al buscar o navegar; la PDP permite **quitar** un ítem del historial |
| **Amazon** | **«Buy Again»** `[DOCUMENTADO]` | **Pestaña «Me» en la barra inferior** de la app; pestaña propia en desktop. Sub-features: **Favorite Reorders** (corazón) y Deal Feed |
| **Chewy** | **Autoship = suscripción, no «repetir»** `[DOCUMENTADO]` | Botón «Add to Autoship» en la PDP. **NO ENCONTRADO** un «repetir pedido» puntual |
| **Rappi / MELI / iFood** | NO ENCONTRADO | — |

Instacart es el más elaborado y el más copiable `[SPEC]`: agrupaciones **«All items» / «Your aisles» /
«Past orders» (ítems de los últimos 20 pedidos dentro de 12 meses) / «Saved»**; ranking por **frecuencia
y recencia**; y para clientes nuevos con 0–5 pedidos muestra *«Items customers buy regularly»* en lugar
de una colección vacía.

Ese último detalle —**qué mostrar cuando no hay historial**— es el que suele faltar y el que vas a
necesitar el día uno.

### Calificar el pedido

| Plataforma | Cuándo | Qué preguntan | Qué pasa con una mala |
|---|---|---|---|
| **Instacart** | En la pantalla de estado y en la home `[SPEC]` | **5 estrellas** + calificar los **ítems de reemplazo** por separado + **ajustar la propina** | **<4 estrellas abre el flujo de reclamo**: seleccionar ítems y reportar missing/damaged/incorrect `[SPEC]` |
| **iFood** | Al finalizar la entrega, **plazo de 7 días** `[REPORTADO]` | 1–5 estrellas + comentario + **embalaje, comida, tiempo de entrega, costo/beneficio**. Restaurante y repartidor **por separado** `[REPORTADO]` | *«influencia diretamente no desempenho dos estabelecimentos»* `[REPORTADO]`, sin detallar sanciones. **Prohibido por nuestra ley** — ver «Lo que NO adoptamos» |
| **Uber (rides)** | Al final del viaje | Rating primero, **y recién después** la opción de propina `[DOCUMENTADO]` | NO ENCONTRADO |
| **Rappi** | NO ENCONTRADO | NO ENCONTRADO | Existe el sistema: la doc para comercios menciona *«malas calificaciones»* como consecuencia `[DOCUMENTADO]` |
| **Amazon / Chewy / MELI** | NO ENCONTRADO | — | — |

**Ventana del tip de Instacart, dato preciso** `[SPEC]`: **<2 h → edición completa** (subir o bajar);
**>24 h → solo aumentos**.

### Límites del autoservicio: dónde aparece un humano

| Plataforma | Se resuelve solo | Aparece un humano en |
|---|---|---|
| **Instacart** | Reportar por ítem y cantidad, ver el monto calculado, elegir refund o credit, ajustar propina, calificar `[SPEC]` | Cancelación **después** de iniciada la compra; medios de pago especiales (**EBT SNAP, OTC Network, Medicare**); reembolso que no apareció tras 5–10 días; entrega desatendida no hallada tras el chat `[DOCUMENTADO]` |
| **Rappi** | **Nada.** La app solo recolecta el reporte y las fotos | **Toda compensación requiere aprobación humana** `[DOCUMENTADO]`. Cancelaciones en efectivo requieren agente. La transferencia bancaria exige documentación |
| **Mercado Libre** | Etapa `claim`: negociación **directa comprador↔vendedor**, sin MELI `[SPEC]` | Etapa `dispute`, con `mediator` asignado. Disparador: **rechazo de la oferta de parcial** `[SPEC]`. Límite duro: **180 días** desde la aprobación del pago `[SPEC]` |
| **Chewy** | Casi nada | **Casi todo.** Teléfono/chat/email **24/7, 365 días** `[DOCUMENTADO]`, con facultad discrecional amplia |
| **iFood** | Reporte inicial | **No hay soporte telefónico.** Bot primero, chat humano a pedido `[REPORTADO]`. El restaurante tiene **5 minutos** para responder `[REPORTADO]` |
| **Amazon** | Flujos guiados | A-to-z: Amazon *«investigates internally and makes a final determination»*. **Si el vendedor no responde en ~72 h, Amazon concede automáticamente** `[REPORTADO]` |

### Lo que NADIE resuelve solo por la app

- **Ningún reembolso a un medio de pago no estándar** (EBT, OTC, Medicare en Instacart; efectivo en
  Rappi) pasa sin humano `[DOCUMENTADO]`.
- **Ninguna cancelación después del punto de no retorno operativo** es autoservicio `[DOCUMENTADO]` en
  Instacart, Rappi e iFood.
- **Ninguna plataforma deja al usuario decidir la elegibilidad para «quedátelo»**. Amazon lo dice
  explícito: *«Amazon determines eligibility»* `[REPORTADO]`.
- **Ninguna resuelve una disputa comprador↔vendedor sin mediación** cuando el vendedor rechaza `[SPEC]`.

`[IMPRESIÓN]` El patrón: **el autoservicio cubre lo barato, lo reciente y lo verificable. El humano
aparece donde hay dinero real, tiempo transcurrido o un tercero con intereses.** Los tres ejes que
definen dónde poner el límite en e-PetPlace.

### Tres arquitecturas de postventa, resumidas

`[IMPRESIÓN]` sobre base documentada:

| Modelo | Plataforma | Cómo funciona |
|---|---|---|
| **Autoservicio granular y automático** | Instacart | Por ítem, por cantidad, monto calculado en vivo, sin foto, sin humano. El rating es el embudo del reclamo |
| **Humano discrecional 24/7** | Chewy | Facultad publicada de reembolsar sin devolución. La reputación de servicio es consecuencia de la **discrecionalidad delegada al agente**, no de un motor automático |
| **Bot primero, con tercero con voto** | iFood, y en parte MELI | El comercio participa de la resolución y puede vetarla |

---

## Lo que ninguno hace

Pediste esto explícitamente porque suele ser más útil que la lista de lo que sí. Es correcto: la mayor
parte del valor de este documento está acá.

### En la tarjeta y la grilla

1. **Nadie muestra el estado del ítem en la grilla. 96 % de los sitios no destaca los productos que ya
   están en el carrito** `[INVESTIGACIÓN]`. Los usuarios volvían al listado y no podían identificar qué
   habían agregado, porque los ítems *«look very similar»*. Baymard recomienda además distinguir
   **visitados de no visitados** — que tampoco hace casi nadie.
2. **El design system público de Mercado Libre no tiene stepper de cantidad.** El set completo de
   componentes del repo es: badge, button, card, checkbox, message, progress, radiobutton, snackbar, tag,
   textfield, thumbnail, coachmark. **No hay stepper, ni quantity picker, ni control de carrito**
   `[SPEC]`, documentado por ausencia. **Nadie te va a dar este componente resuelto. Lo vas a diseñar
   vos.**
3. **Nadie resuelve el ítem sin foto con dignidad.** Instacart, la más grande de su categoría, pone un
   ícono gris `[DOCUMENTADO]`. Y no existe patrón publicado en B2B, mayorista ni farmacia. **Hueco real
   del estado del arte.**
4. **Precio por unidad: 67 % no lo muestra en el listado, 81 % no lo muestra en la ficha**
   `[INVESTIGACIÓN]`. Para catálogo con formatos variables —2 kg, 4 kg, 15 kg— es el dato ausente más
   consistente de la industria, y por lo tanto **la oportunidad más barata**.

### En el carrito

5. **Ningún spec recomienda confirmación para quitar un ítem.** eBay, Baymard y NN/g convergen: acción
   inmediata, sin diálogo, **con deshacer**.

### En el seguimiento

> **Ojo con «las seis»:** en ①–④ son Chewy, Instacart, Amazon, Rappi, Laika y Mercado Libre. En ⑤ son
> Rappi, Uber, Uber Eats, DoorDash, Amazon y Mercado Libre. Los tres puntos que siguen se refieren **a las
> seis de ⑤**.

6. **Ninguna de las seis de ⑤ publica el reparto de alto mapa/banda.** NO ENCONTRADO × 6.
7. **Ninguna de las seis de ⑤ documenta que muestre la calificación del repartidor al cliente.**
   NO ENCONTRADO × 6. No es lo mismo que probar que no la muestran.
8. **Ninguna de las tres documentadas muestra un mapa vacío.** O lo oculta (DoorDash, Uber Eats hasta la
   asignación; Amazon hasta ≤10 paradas) o lo reemplaza (animación, texto). Rappi y MELI: sin evidencia.
9. **En ninguna, «repartidor asignado» es un escalón visible de la escalera** — se comunica por la
   aparición del mapa `[IMPRESIÓN]`.

### En la postventa

10. **Ninguna deja al usuario decidir su propia elegibilidad para «quedátelo».**
11. **Ninguna resuelve medios de pago no estándar sin humano.**
12. **Solo Instacart publica el crédito como remedio simétrico al reembolso.** Chewy no documenta store
    credit como remedio en absoluto.

### Lo que no se muestra hasta la ficha

Según el orden documentado de Instacart `[SPEC]`: ingredientes, información nutricional, modo de uso,
advertencias, descripción larga, imágenes secundarias, guardar/favorito y recomendados. Todo eso vive en
tabs **debajo** de la ficha. **Nada de eso está en la tarjeta.**

---

## Lo que NO adoptamos

Separación de mecanismo y superficie, según la ley del producto. Cada uno de estos aparece en un referente
y **no se copia**.

| Referente | Qué hace | Qué prohíbe nuestra ley | Qué tomamos en su lugar |
|---|---|---|---|
| **Rappi** | Propina **preseleccionada al 10 % antes de la entrega**. **Indecopi (Perú) lo sancionó explícitamente como «dark pattern»** y método comercial coercitivo: amonestación + multa de 1,3 UIT (S/ 6.435), agravado porque la opción de rechazo **aparecía en inglés**. Medidas correctivas ordenadas: mostrarla **después** de la entrega, **monto por defecto S/ 0,00**, modificable siempre `[REPORTADO]` | **Dark patterns** | La medida correctiva **es** el patrón correcto: si algún día hay propina, va después de la entrega y arranca en cero |
| **Rappi** | Crédito interno que **vence a los 6 meses**, **no se retira a efectivo**, y cuya alternativa en dinero real solo está disponible *«si no ha usado créditos»* `[DOCUMENTADO]` | **Moneda visible** + **dark pattern** (la cláusula trampa) | El crédito de **Instacart**: tope al valor del ítem, simétrico al reembolso, auto-aplicado, sin vencimiento documentado |
| **Rappi / Amazon** | Diferencial de velocidad como incentivo hacia el crédito: **inmediato vs 20–30 días hábiles** (Rappi) `[DOCUMENTADO]`; **2–3 h vs 3–5 días** (Amazon) `[REPORTADO]` | **Dark pattern** si el diferencial es artificial | Si el crédito es más rápido porque **técnicamente lo es**, se dice. No se ralentiza el reembolso para empujar al crédito |
| **DoorDash** | Probó **advertir a quienes no dejan propina** que su pedido podría tardar. Declaración propia: *«offers that don't include a tip can be seen as less desirable»* `[REPORTADO]` | **Dark pattern** + urgencia | Nada. El tiempo de entrega no se negocia con el usuario |
| **Amazon** | Settlement de **US$2.500 millones con la FTC por dark patterns** en inscripción y cancelación de Prime (el «Iliad flow») `[REPORTADO]` | **Dark patterns** + **membresías empujadas** | Se separa explícitamente: **es sobre Prime, no sobre la pantalla de seguimiento**, que no tiene patrones cuestionables detectados |
| **Chewy** | Autoship con **35 % off el primer pedido** presentado junto al producto `[DOCUMENTADO]` | **Membresías empujadas junto al precio** | El mecanismo de recompra sí (**Buy It Again** de Instacart), la suscripción pegada al precio no |
| **Mercado Libre** | Reputación de vendedor y comparación entre vendedores del mismo ítem `[IMPRESIÓN]` — es conocimiento de producto, no lo verifiqué contra fuente porque la ayuda de MELI está bloqueada | **Rankings y comparaciones entre vendedores** | El mecanismo de **`partial_refund` negociado** —ofrecer, poder rechazar, escalar— sin la capa de reputación pública |
| **Instacart** | Ventana de propina **asimétrica**: <2 h se puede subir o bajar; **>24 h solo se puede aumentar** `[SPEC]`. Y la propina viene empaquetada en el mismo flujo que la calificación `[SPEC]` | **Dark pattern** — la asimetría solo favorece a una parte | El **embudo rating→reclamo** se adopta **desacoplado de la propina**. Es el mejor hallazgo del encargo, pero el paso de propina se saca, no «no aplica» |
| **Instacart** | **Badge «Buy it again»** sobre productos ya comprados, en búsqueda y navegación `[SPEC]` | **Moneda visible (badges)** | El ranking por frecuencia-recencia y la agrupación por «Past orders» sí. **La insignia sobre la tarjeta no** — el estado «ya lo compraste» se resuelve con tipografía o con el propio control, no con una chapa |
| **iFood** | Calificación con efecto reputacional sobre el comercio: *«influencia diretamente no desempenho dos estabelecimentos no aplicativo»* `[REPORTADO]`. Restaurante y repartidor calificados por separado | **Rankings y comparaciones entre vendedores** | La calificación se usa **para nosotros**, como señal operativa interna. No se publica ni ordena vendedores con ella |
| **Rappi** | Sistema de calificación cuya consecuencia documentada para el comercio son *«malas calificaciones»* `[DOCUMENTADO]` | **Rankings entre vendedores** | Ídem: señal interna, no vitrina |
| **Baymard** (industria) | **83 % no muestra el corte horario como cuenta regresiva** `[INVESTIGACIÓN]` | **Cuentas regresivas** | La mayoría de la industria ya no lo hace. Confirmación de que no adoptarlo no es una desventaja competitiva |

**Nota sobre gamificación, con el alcance exacto de lo que se buscó:** se buscaron puntos, niveles y
badges visibles al cliente **en las pantallas de seguimiento** de las seis plataformas de ⑤.
**NO ENCONTRADO en ninguna**, y los programas de niveles que existen (Uber Eats Pro) son **del lado del
repartidor**.

**Pero fuera de la pantalla de seguimiento sí aparecen badges**: el «Buy it again» de Instacart sobre la
tarjeta de producto `[SPEC]` es exactamente eso, y está en la tabla de arriba. La coincidencia entre la
ley del producto y la práctica de la industria vale **para el seguimiento**, no para la tienda.

---

## Huecos declarados

Lo que se buscó y no está. Ninguno se rellenó.

**Medible con el harness, en tu máquina:**

- Todas las proporciones de ①–④ (foto ÷ tarjeta, precio ÷ nombre, control ÷ tarjeta)
- Densidad: productos sobre el pliegue y alto de cromo previo
- Reparto de alto mapa/banda en ⑤ — **que además no publica nadie**

**No medible, no publicado por nadie:**

- Cuántos productos entran sobre el pliegue según Baymard — **detrás de paywall**
- Orden de jerarquía primero/segundo/tercero por referente — **no hay eye-tracking publicado por
  referente.** El harness da tamaño y contraste, que son **proxies**, no medición de mirada
- Animación de la transformación botón→stepper: duración y curva — **ninguna spec pública la define**
- Stepper real de Rappi y Amazon Fresh — **sin fuente creíble; hay que capturarlo a mano**
- Base Web de Uber en píxeles — **el theme no es público**
- Apple HIG 44 pt — la página oficial no renderiza sin JS. **Ampliamente citado en fuentes secundarias
  pero no verificado contra Apple.** Tratalo como probable, no como citable
- **Laika: nada citable.** No hay design system, teardown creíble ni research publicado. Solo cobertura
  de funding. Era un referente de tu lista y **no tengo material** — la única vía es capturarlo con el
  harness
- Conversión de tarjeta text-only vs tarjeta con placeholder gris — **sin medición publicada. Candidato
  directo a A/B test propio**

**Bloqueado por acceso, no por inexistencia:**

- **Todo el centro de ayuda de Amazon** (`robots.txt`). Consecuencia concreta: **no sé si el gift card
  balance vence ni si se retira a efectivo.** Las dos URLs que cierran el punto son
  `nodeId=GNG9PXYZUMQT72QK` y `nodeId=GKQNFKFK5CF3C54B`. **Requieren verificación manual.**
- **Todas las páginas `/ayuda/` de Mercado Libre** (`robots.txt`). Se compensó con la devsite de
  developers, que resultó ser mejor fuente para el mecanismo
- **Todo iFood** (403 antibot en los cuatro dominios oficiales). **Ni una sola fuente primaria.** Todo
  iFood en este documento es `[REPORTADO]` triangulado entre fuentes independientes que coinciden
- **El centro de ayuda actual de Chewy** (SPA que no sirve contenido). Por eso **los 365 días no están
  verificados**
- **`soporte.rappi.com`** no resuelve por DNS. Se compensó con `legal.rappi.com.co`, que resultó ser
  excelente

**Conflictos de fuentes que no concilié** (los dejo a la vista en vez de elegir el que conviene):

- Adopción de botones de cantidad: **61 %** vs **97 %** — benchmarks distintos de Baymard, sin
  conciliación publicada
- Sitios sin fecha de entrega: **41 %** vs **48 %** — ídem
- Chewy Autoship: la FAQ dice **24 h** para cambiar fecha, los Autoship Terms dicen **48 h**. **Ambas son
  páginas oficiales de Chewy**
- Ventana de reclamo de Amazon: **30** vs **90 días**. `[IMPRESIÓN]` son cosas distintas —política de
  Amazon Retail vs garantía A-to-z para terceros— pero **no pude confirmarlo**
- Instant refunds de Amazon: una fuente dice que van a gift card balance, otra que van al medio de pago
  original y que igual hay que devolver el ítem. **Sin dirimir**
- **Amazon Pay, contradicción interna en la propia página oficial:** dice *«in any amount up to the
  original charge»* y a la vez fija el tope en **15 % más que el cargo original**. «Hasta el cargo
  original» y «hasta el 115 %» no pueden ser ambas ciertas. **No lo resuelvo**; probablemente el 115 %
  cubra ajustes por impuestos o envío, pero eso sería `[IMPRESIÓN]` y no lo afirmo

---

## Anexo: el harness de medición

`harness/` — corre en tu máquina, mide geometría real, llena las tablas vacías.

```bash
cd harness
npm i playwright && npx playwright install chromium
./correr.sh --con-pausa
```

| Archivo | Qué es |
|---|---|
| `medir.mjs` | El medidor. Detecta tarjetas, mide bounding boxes, calcula proporciones |
| `objetivos.json` | Las 25 combinaciones referente × superficie. Editable |
| `correr.sh` | Orquestador. `--solo <referente>`, `--con-pausa` |
| `consolidar.mjs` | Junta los JSON en `tabla-proporciones.md`, lista para pegar acá |
| `fixture/tienda-demo.html` | Maqueta de geometría conocida para verificar que el medidor no miente |
| `LEEME.md` | Instrucciones completas |

**Cómo funciona la pausa.** Carrito, dirección y seguimiento necesitan sesión, dirección cargada o un
pedido en curso. Con `--con-pausa` (en `correr.sh`; el flag equivalente en `medir.mjs` es `--pausa`) el
navegador se abre visible, acomodás la pantalla, y cuando está como la querés medir apretás **ENTER** en
la terminal. La sesión se guarda en `perfil-navegador/`, así que no te volvés a loguear en la próxima
corrida.

**Las superficies de seguimiento necesitan un pedido real en el estado correcto.** Amazon solo muestra
mapa a ≤10 paradas y Mercado Libre solo en reparto. Si no coincide la ventana, **la celda queda vacía** —
no se completa de memoria.

**Si no detecta las tarjetas**, pasale el selector a mano:

```bash
node medir.mjs --nombre chewy --superficie vitrina \
  --url "https://www.chewy.com/b/dog-food-386" \
  --selector "[data-testid='product-card']" --headed
```

**Verificación del propio medidor.** La maqueta tiene tarjeta 176×280, foto 176×176, nombre 14 px,
precio 18 px, control 44×44, cromo 200 px. El medidor debe devolver:

| Métrica | Esperado | Devuelto |
|---|---|---|
| Foto ÷ área de tarjeta | 62,9 % | **62,9 %** ✓ |
| Foto ÷ alto de tarjeta | 62,9 % | **62,9 %** ✓ |
| Precio ÷ nombre (font-size) | 1,286 × | **1,286 ×** ✓ |
| Control ÷ área de tarjeta | 3,9 % | **3,9 %** ✓ |
| Cromo antes del primer producto | 200 px | **200 px** ✓ |
| Área táctil del control | 44×44, **no** cumple 48 dp | **44×44, cumple_48: false** ✓ |

Si alguna vez devuelve otra cosa sobre esa maqueta, el medidor está roto y **ningún número que produzca
es confiable**.

**Salida:**

- `salida/capturas/<referente>-<superficie>.png` — nombradas por lo que muestran
- `salida/datos/<referente>-<superficie>.json` — medición completa, con URL, dispositivo y timestamp
- `salida/tabla-proporciones.md` — las tres tablas (①, ②③④ composición, ⑤ mapa), con la misma precisión
  y el mismo separador decimal que usa este documento

**Qué NO hace el consolidador:** la columna «no-mapa» de ⑤ no es la banda de estado, es todo lo que no es
mapa. Para aislar la banda hay que mirar `composicion` en el JSON. Está advertido en la propia salida.

**Advertencia de método que hay que arrastrar:** mide **web móvil**, no app nativa. Cualquier número que
salga de acá se declara como *medido sobre web móvil*, nunca como *medido en la app*.

---

## Fuentes

**Design systems y documentación de producto:** [AndesUI Android (Mercado Libre)](https://github.com/lmadrazo/fury_andesui-android) · [Andes en Maven](https://mvnrepository.com/artifact/com.mercadolibre.android.andesui/components) · [eBay Numeric Stepper](https://playbook.ebay.com/design-system/components/numeric-stepper) · [eBay Stepper — accesibilidad](https://playbook.ebay.com/design-system/components/numeric-stepper?tab=accessibility) · [eBay Image ratio](https://playbook.ebay.com/foundations/layout-in-product/image-ratio) · [Shopify Polaris Thumbnail](https://polaris-react.shopify.com/components/images-and-icons/thumbnail) · [Uber Base Web](https://github.com/uber/baseweb) · [Android Accessibility 48dp](https://support.google.com/accessibility/android/answer/7101858) · [Instacart — requisitos de imagen](https://docs.instacart.com/catalog/catalog_inventory_file/specifications/image-source-requirements/) · [Instacart — PDP](https://docs.instacart.com/storefront/learn_about_your_storefront/shopping/catalog/product_details_page/) · [Instacart — carrito](https://docs.instacart.com/storefront/learn_about_your_storefront/cart_and_checkout/cart) · [Instacart — reemplazos](https://docs.instacart.com/storefront/learn_about_your_storefront/cart_and_checkout/replacements/) · [Instacart — postventa](https://docs.instacart.com/storefront/learn_about_your_storefront/fulfillment/after_fulfillment/) · [Instacart — Buy It Again](https://docs.instacart.com/storefront/learn_about_your_storefront/shopping/buy_it_again/) · [Instacart — imágenes de producto](https://company.instacart.com/instacart-ads/product-images-on-instacart)

**Research cuantitativo:** [Baymard — información en el listado](https://baymard.com/blog/product-listing-information) · [Baymard — diseño del ítem de lista](https://baymard.com/blog/list-item-design-ecommerce) · [Baymard — estado del product list 2025](https://baymard.com/blog/current-state-product-list-and-filtering) · [Baymard — estado de la ficha 2026](https://baymard.com/blog/current-state-ecommerce-product-page-ux) · [Baymard — thumbnails](https://baymard.com/blog/always-use-thumbnails-additional-images) · [Baymard — botón agregar en grocery](https://baymard.com/blog/grocery-add-to-cart-buttons) · [Baymard — cantidad en el carrito](https://baymard.com/blog/auto-update-users-quantity-changes) · [Baymard — destacar lo que ya está en el carrito](https://baymard.com/blog/highlight-products-if-in-users-cart) · [Baymard — quick views](https://baymard.com/blog/mobile-desktop-quick-views) · [Baymard — estado del checkout 2025](https://baymard.com/blog/current-state-of-checkout-ux) · [Baymard — fecha vs velocidad de envío](https://baymard.com/blog/shipping-speed-vs-delivery-date) · [Baymard — Address Line 2](https://baymard.com/blog/address-line-2) · [Baymard — benchmark grocery](https://baymard.com/blog/grocery-ecommerce-benchmark) · [Baymard — caso Chewy](https://baymard.com/ux-benchmark/case-studies/chewy) · [NN/g — input steppers](https://www.nngroup.com/articles/input-steppers/) · [NN/g — feedback del carrito](https://www.nngroup.com/articles/cart-feedback/) · [NN/g — shopping cart](https://www.nngroup.com/articles/shopping-cart/) · [NN/g — fotos como contenido](https://www.nngroup.com/articles/photos-as-web-content/)

**Seguimiento:** [Uber Direct API](https://developer.uber.com/docs/deliveries/direct/api/v1/get-eats-deliveries-orders-orderid) · [Uber — DeepETA](https://www.uber.com/us/en/blog/deepeta-how-uber-predicts-arrival-times/) · [Uber Help — seguimiento](https://help.uber.com/h/4148ea8b-c9d8-409d-b7bf-b2fcb019a498) · [Uber Help — contactar al conductor](https://help.uber.com/riders/article/contact-a-driver?nodeId=0e0bbf4e-2a95-42b6-9bc2-2566e8bd98dc) · [Uber Help — perfil del conductor](https://help.uber.com/h/5180c336-d9d7-4b71-946f-d021bcdf4586) · [Uber — propinas](https://www.uber.com/us/en/ride/how-it-works/tips/) · [Uber Newsroom — rediseño Eats](https://www.uber.com/en-PK/newsroom/eatsredesign) · [DoorDash — estados de entrega](https://developer.doordash.com/en-US/docs/drive/reference/delivery_statuses/) · [DoorDash Help — dónde está mi pedido](https://help.doordash.com/consumers/s/article/Customer-Where-is-my-order) · [DoorDash — DoubleDash](https://help.doordash.com/en-us/consumers/article/doubledash) · [DoorDash Eng — ETA probabilístico](https://careersatdoordash.com/blog/improving-etas-with-multi-task-models-deep-learning-and-probabilistic-forecasts/) · [DoorDash Eng — deep learning ETA](https://careersatdoordash.com/blog/deep-learning-for-smarter-eta-predictions/) · [Dasher Central — batched offers](https://dasher.doordash.com/en-us/blog/batched-offers-explained) · [MELI — manejo de envíos](https://developers.mercadolivre.com.br/en_us/shipment-handling) · [MELI — estados de orden](https://developers.mercadolibre.com.ar/en_us/me1-order-states) · [Marketing Dive — tracker Uber Eats](https://www.marketingdive.com/news/uber-eats-boosts-delivery-tracker-transparency-with-colorful-animations/552543/) · [Restaurant Dive — Latest Arrival By](https://www.restaurantdive.com/news/uber-eats-boosts-delivery-tracker-transparency-with-colorful-animations/552513/) · [Retail Dive — Amazon map tracking](https://www.retaildive.com/news/amazon-puts-live-mobile-tracking-feature-on-the-map/524350/) · [Rappi merchants — manejo de órdenes](https://merchants.rappi.com/es-mx/recursos/manejo-ordenes) · [Rappi merchants — sin repartidor asignado](https://merchants.rappi.com/es-mx/que-hago-si-una-orden-no-tiene-rappitendero-asignado)

**Postventa:** [Rappi — política de compensaciones AR](https://legal.rappi.com.co/argentina/politica-de-compensaciones-y-reembolsos-de-rappi-argentina/) · [Rappi — compensaciones CO](https://legal.rappi.com.co/colombia/politica-de-compensaciones-y-reembolsos-de-rappi-colombia/) · [Rappi — compensaciones MX](https://legal.rappi.com.co/mexico/politica-de-compensaciones-y-reembolsos-de-rappi-mexico/) · [Rappi — términos de créditos AR](https://legal.rappi.com.co/argentina/terminos-y-condiciones-funcionamiento-de-los-creditos-de-la-plataforma-rappi-3/) · [Rappi — funcionamiento de créditos CO](https://promos.rappi.com/colombia/funcionamiento-creditos) · [Rappi — política de cancelaciones](https://legal.rappi.com.co/global/politica-de-cancelaciones-de-rappi/) · [MELI — manejo de reclamos](https://global-selling.mercadolibre.com/devsite/manage-claims) · [MELI — resoluciones de reclamos](https://global-selling.mercadolibre.com/devsite/manage-claim-resolutions) · [MELI — devoluciones](https://global-selling.mercadolibre.com/devsite/manage-returns) · [Mercado Pago — reembolsos y cancelaciones](https://www.mercadopago.com.ar/developers/en/docs/checkout-api-orders/refunds-cancellations) · [Instacart — política de devoluciones](https://www.instacart.com/help/article/returns-policy) · [Chewy — FAQ oficial](https://cms.chewy.com/cms/help/customer/faq.html) · [Chewy — términos de uso](https://www.chewy.com/app/content/terms) · [Chewy — términos de Autoship](https://www.chewy.com/app/content/autoship-terms) · [Chewy — donar o descartar ítems reembolsados](https://www.chewy.com/customer-care/returns/return-policy/donate-or-discard-refunded-items) · [Amazon Pay — reembolsos](https://pay.amazon.com/help/201212360) · [Amazon — Buy Again y features](https://www.aboutamazon.com/news/retail/amazon-shopping-features-rufus-lens) · [Retail Dive — Returnless Resolutions](https://www.retaildive.com/news/amazon-sellers-productless-return-refunds-returnless-resolutions/724857/) · [Amazon Seller Forums — returnless refund](https://sellercentral.amazon.com/seller-forums/discussions/t/5f6743bb-2f63-4592-a7e3-32ba2a6fe53f) · [Idec — cancelar pedido iFood](https://idec.org.br/dicas-e-direitos/cancelar-pedido-ifood)

**Dirección y patrones oscuros:** [Google Maps — validación de dirección en checkout](https://developers.google.com/maps/architecture/ecommerce-checkout-address-validation) · [Google Maps Platform — direccionamiento](https://mapsplatform.google.com/resources/blog/how-enable-deliveries-people-and-places-without-traditional-addresses/) · [Plus Codes](https://maps.google.com/pluscodes/) · [Rappi merchants — franjas horarias](https://merchants.rappi.com/es-co/staffing-franja-horaria-cumplir-envios) · [El Comercio — Indecopi sanciona a Rappi por propina preseleccionada](https://elcomercio.pe/economia/dia-1/rappi-sancionada-por-indecopi-las-apps-de-delivery-pueden-sugerir-propinas-automaticas-a-sus-clientes-en-que-queda-el-caso-repartidores-delivery-envios-pedidosya-pagos-bonos-noticia/) · [TechCrunch — DoorDash advierte a no-propinantes](https://techcrunch.com/2023/11/02/doordash-tests-warning-non-tippers-that-their-order-could-be-slow-to-arrive) · [Katten — settlement FTC/Amazon US$2.500M](https://quickreads.ext.katten.com/post/102l7e6/ftcs-landmark-2-5-billion-amazon-settlement-highlights-ongoing-focus-on-dark-p)
