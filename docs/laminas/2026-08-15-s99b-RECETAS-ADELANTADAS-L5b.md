# L5b · LAS RECETAS QUE VA A NECESITAR, ADELANTADAS

**Estatuto:** Toque 1 adelantado, por pedido de mesa — *«la vitrina es el
lote que decide octubre y no puede esperar a que sus recetas se pidan de
a una»*. **Se escriben ANTES del censo de A a propósito**, y lo que
dependa de ese censo va marcado como tal, no adivinado.

---

## §0 · LA LISTA COMPLETA — qué recetas necesita L5b

| # | receta | estado | bloqueada por |
|---|---|---|---|
| **1** | **La ficha de producto** (N19) | ✅ **§1, acá** | — |
| **2** | **El interruptor del espejo** (N17) | ✅ **§2, acá** | — |
| **3** | **La navegación en dos toques** (N20) | ⏳ **sigue bloqueada** | el censo de A: **qué ejes existen** (especie · necesidad) y con qué cardinalidad |
| **4** | **La completitud que gana alcance** (N18) | ✅ **§3, acá** — *ver la corrección de triaje* | — |
| **5** | **La grilla de la vitrina** | ✅ **§4, acá** — *ver la corrección de triaje* | — |
| **6** | **El estado `propuesto` vs `publicada`** | ⏳ pedirla | contrato de mesa de L5b (*el espejo DICE la diferencia*) |
| **7** | **La escala de botones** | ✅ **ya servida** (`…-RECETA-ESCALA-DE-BOTONES.md`) | — |

### ⏪ CORRECCIÓN DE MI PROPIO TRIAJE — dos de las tres NO estaban bloqueadas

**Esta línea decía:** *«las 3, 4 y 5 NO se adelantan… las tres dependen
de cuántas cosas hay»*. **Al releerla con la orden de adelantar lo que se
pueda, dos se cayeron:**

- **La 4 (completitud) NO depende de la lista de campos.** Lo que el
  censo de A va a decir es **CUÁLES** campos cuentan; **la forma —voz
  narrativa, un paso, sin barra, sin porcentaje, el contador que llega a
  cero— no cambia con la lista.** Confundí *el dato* con *su forma*.
- **La 5 (grilla) ya estaba decidida por una pieza viva:** `Baldosa`
  (S97) trae su patrón de grilla **como parte de su contrato**. Escribir
  su receta es en buena medida **decir que no se invente otra**.

**La 3 sigue bloqueada de verdad:** *«especie → necesidad, ambas a la
vista en la primera pantalla»* (N20) es una decisión de **layout contra
cardinalidad** — seis especies y cuatro necesidades no se componen como
doce y quince. *Ahí la cardinalidad sí es la forma.*

> *El criterio que apliqué mal: «depende del censo» no es lo mismo que
> «depende de un número del censo». La mayoría de las veces el censo
> decide el CONTENIDO y la ley decide la FORMA — y la forma es lo que yo
> escribo.*

---

## §1 · LA FICHA DE PRODUCTO — anatomía

**N19 ya fijó el ORDEN y es ley.** Esta receta no lo re-discute: resuelve
**la FORMA de cada escalón** y los bordes que el orden no cubre.

```
┌──────────────────────────────┐
│  ① FOTO — carrusel a sangre  │   4:3, control MANUAL
├──────────────────────────────┤
│  ② Nombre · 15 kg            │   una línea de lectura
│  ③ $ 62,40                   │   display
│     $ 4,16 / kg              │   mono, secondary
├──────────────────────────────┤
│  ④ Composición y alérgenos   │   ← AvisoAlergia si toca
├──────────────────────────────┤
│  ⑤ Para quién sirve          │   ← EL DIFERENCIAL
├──────────────────────────────┤
│  ⑥ Disponibilidad            │
└──────────────────────────────┘
   pie fijo: UN sólido (§ escala)
```

### Las decisiones de forma, con su razón

**① El carrusel es el de la casa, no uno nuevo.** `DIRECCION_ARTE` §12 ya
tiene el carrusel **a sangre 4:3** de la vitrina del prestador, y N17
exige que el espejo monte **las mismas piezas que ve la familia**. *Un
carrusel propio de la despensa rompería el espejo antes de existir.*

**② Nombre y presentación en LA MISMA línea de lectura** (N19), y por eso
**el nombre no se trunca**: es el criterio de elección. La pieza ya
existe — `Celda tituloEntero` en la lista; en la ficha, `Texto titulo`.

**③ EL PRECIO POR KILO ES EL ESCALÓN QUE NADIE PONE, y su forma lo dice:**
precio en display, **precio por kilo en mono `dato`** debajo. Mono porque
**es un dato derivado por una máquina** (Ley 3) — y esa diferencia
tipográfica es la que hace que se lea como *cálculo*, que es justo su
valor: nadie lo puso, nosotros sí.

**④ La alergia usa `AvisoAlergia`, que ya existe con sus cuatro estados de
composición y tres de coincidencia.** ⛔ **No se le agrega una prop para
apagarla**: la letra manda *sin composición declarada se DICE, jamás se
calla*, y `verificada`/`no_aplica` son los dos únicos silencios.

**⑤ «Para quién sirve» NO es una fila de datos: es la frase que nos
distingue.** Especie + momento vital, en voz de familia. *Si se compone
como `FilaDato` («Especie: perro · Etapa: adulto») se vuelve una tabla, y
el diferencial deja de leerse como que la app conoce a la mascota.*

**⑥ Disponibilidad: el vacío HABLA** (N9) — «Sin stock» dice cuándo
vuelve, o dice que no sabe. **Jamás desaparece el producto.**

**El pie:** UN sólido, y ahora tiene dónde vivir — el **pie fijo de
`Hoja`** si la ficha abre en Hoja, o `PieReserva` si es pantalla.

### 🔴 Lo que la ficha del ESPEJO agrega, y es lo que la vuelve espejo

En modo `Administrar`, **los mismos seis escalones**, y encima:
**qué le falta a ESTE producto para ganar alcance** (N18, voz narrativa +
un paso) y **su estado `propuesto`/`publicada` con su porqué**.

> **Se agrega ARRIBA, jamás se reemplaza abajo.** Si administrar cambia
> la anatomía, el vendedor deja de ver lo que ve la familia — y el espejo
> se convierte en una tabla con otro nombre.

---

## §2 · EL INTERRUPTOR DEL ESPEJO — `Administrar ⇄ Ver como cliente`

**N17 es literal: UNA superficie con dos modos.** Entonces la primera
decisión de forma ya está tomada — y la segunda es la que importa:

### 🔴 ES UN INTERRUPTOR DE MODO, NO UNA NAVEGACIÓN

**La pieza es `SelectorSegmentado`** (Ley 19.3: vistas exclusivas 2-3),
**jamás dos pantallas ni un tab**. Y la razón no es de inventario:

> **Si «Ver como cliente» navega, el vendedor SALE de su trabajo y tiene
> que volver.** Un interruptor conserva el lugar, el scroll y el producto
> que estaba mirando — *y sin eso el espejo no se usa: se visita una vez.*

### Dónde vive, y por qué ahí

**En el techo de la vitrina, fijo** — no scrollea con el contenido. *Un
interruptor que se va con el scroll deja al vendedor sin saber en qué
modo está justo cuando más abajo llegó.*

**Y el modo se DICE aunque el interruptor no se vea**: en `Ver como
cliente`, la superficie cambia lo suficiente como para que no haga falta
leer el interruptor —desaparecen los controles de administración— y eso
**es** la señal. *El mejor indicador de modo es que el modo se note.*

### Lo que el interruptor NO hace

- **⛔ No es un preview con marco de teléfono.** Es la vitrina de verdad,
  a tamaño real. *Un mockup dentro de la app dice «esto es una
  simulación», y N17 pide lo contrario: que no pueda no saber cómo se ve.*
- **⛔ No cambia los datos, solo lo que se muestra.** Un producto
  `propuesto` **no aparece** en «Ver como cliente» —porque la familia no
  lo ve— **y el espejo lo explica ahí mismo** (contrato de L5b). *Es el
  único caso donde el espejo habla en modo cliente, y por eso se declara.*

### La transición entre modos

**Un fundido corto, jamás un deslizamiento direccional.** El deslizamiento
dice *fuiste a otro lado*, y acá **no fuiste a ningún lado: la misma cosa
se mira de otra manera**. `motion.duration.fast`, y con reduce-motion el
cambio es instantáneo (no hay viaje que preservar).

---

## §3 · LA COMPLETITUD QUE GANA ALCANCE (N18) — la forma

**N18 ya fijó la ley entera** (qué gana lo completo: ALCANCE · qué pasa
con lo incompleto: **no se esconde, pierde alcance** · jamás ranking).
Esta receta resuelve **cómo se ve**, que es lo único que falta.

**LA VOZ, literal de N18:** narrativa + **un paso** —
*«12 productos no aparecen en búsqueda porque no tienen foto.»*

**⛔ LO PROHIBIDO, y no es opinable:** barra de progreso · «perfil 40 %
completo» · porcentaje · checklist de tareas. `MODELO_LOYALTY` §2 es
literal: *«la checklist es la chorificación del cuidado y el dark pattern
que mata el alma del producto»*.

**Dónde vive, en las DOS caras:**

- **En la vitrina (`Administrar`)** — arriba, **una sola línea**, la del
  hueco más grande. *Si dice tres cosas, es una checklist con otra
  tipografía.*
- **En la ficha del producto** — el hueco **de ESE producto**, en su
  bloque de espejo (§1). Ahí sí es específico: *«esta no aparece en
  búsqueda porque no tiene foto»*.

**Las dos guardas de la casa:** el contador **puede llegar a cero** · y
**lo que depende de e-PetPlace NO entra** (§7.5). *Un contador que nunca
cierra convierte el alcance en una condena.*

**Y su costura con el vendedor del primer día:** es **la misma fuente**
que el HOY con `haVendido = false` y que la configuración — una sola
verdad de *«qué le falta»*, leída en tres lugares
(`…-RECETA-EL-VENDEDOR-EL-PRIMER-DIA.md` §5).

---

## §4 · LA GRILLA DE LA VITRINA — la receta es *no inventes otra*

**Se monta `Baldosa`** (S97), y su patrón de grilla **es parte de su
contrato**: `width: '50%'` con el aire ADENTRO de la celda y **sin
`gap`** — *el gap no se ve en el porcentaje y la resta se hace en
píxeles*. **Dos columnas.**

**Por qué `Baldosa` y no `Celda`:** la ley de la casa lo decide sola —
***tarjetas para elegir, filas para leer*** (S97, Acto II). En la vitrina
el producto **se elige**. En el panel del vendedor, el mismo producto
**se lee** ⇒ ahí es `Celda`, **con `tituloEntero`** (S99-B), porque el
nombre es el criterio.

> **La misma cosa cambia de pieza según lo que la persona esté haciendo
> con ella.** No es inconsistencia: es la ley aplicada.

**Lo único que la grilla decide de nuevo — la anatomía de la baldosa de
producto**, y sale de N19 recortada a lo que entra en media pantalla:
**foto 4:3 · nombre (2 líneas, sin truncar) · precio + $/kg en mono**.
**⛔ La composición y los alérgenos NO entran en la baldosa** — no caben
sin volverse ilegibles, y **medio dato de alergia es peor que ninguno**:
viven en la ficha, a un toque.

---

## §5 · LO QUE NINGUNA DE ESTAS PUEDE FIRMAR

**El ojo, en el teléfono, y por la ley de método S99 se mira DONDE VIVE:**
la ficha dentro de la vitrina y el interruptor con productos reales.

Las dos preguntas concretas para ese gate:

> **Ficha:** *¿el precio por kilo se lee como el dato que decide, o como
> letra chica?*
> **Espejo:** *tocando «Ver como cliente», ¿sabés sin leer nada en qué
> modo estás?*
