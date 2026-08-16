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
| **3** | **La navegación en dos toques** (N20) | ⏳ pedirla | el censo de A: **qué ejes existen** (especie · necesidad) y con qué cardinalidad |
| **4** | **La completitud que gana alcance** (N18) | ⏳ pedirla | el cómputo de A: **qué campos entran al contador** |
| **5** | **La grilla de la vitrina** | ⏳ pedirla | ①: la ficha decide la tarjeta, no al revés |
| **6** | **El estado `propuesto` vs `publicada`** | ⏳ pedirla | contrato de mesa de L5b (*el espejo DICE la diferencia*) |
| **7** | **La escala de botones** | ✅ **ya servida** (`…-RECETA-ESCALA-DE-BOTONES.md`) | — |

**⚠️ Las 3, 4 y 5 NO se adelantan y digo por qué:** las tres dependen de
**cuántas cosas hay** —cuántas especies, cuántas necesidades, cuántos
campos de completitud— y una anatomía escrita contra una cardinalidad
inventada es la clase de receta que hay que rehacer entera. *Adelantar lo
que no depende del censo es ganar la carrera; adelantar lo que sí, es
correrla dos veces.*

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

## §3 · LO QUE NINGUNA DE LAS DOS PUEDE FIRMAR

**El ojo, en el teléfono, y por la ley de método S99 se mira DONDE VIVE:**
la ficha dentro de la vitrina y el interruptor con productos reales.

Las dos preguntas concretas para ese gate:

> **Ficha:** *¿el precio por kilo se lee como el dato que decide, o como
> letra chica?*
> **Espejo:** *tocando «Ver como cliente», ¿sabés sin leer nada en qué
> modo estás?*
