# RECETAS — STOCK (LISTA ⇄ ÍCONOS) · Y LOS TRES HALLAZGOS DE LA CAMINATA

**Estatuto:** Toque 1. Dos frentes que llegaron juntos y se sirven juntos
porque **los dos son de la misma pantalla del vendedor**.

---

# §A · STOCK — LISTA ⇄ ÍCONOS, AL ESTILO FINDER

## A1 · 🔴 LO PRIMERO: UNA DECISIÓN MÍA SE CAE, Y LA DECLARO

**Escribí, con once productos en la base:** *«con 11 y 7, sin paginación,
sin «cargar más», sin encabezados — cualquier andamio de navegación pesa
más que el contenido que organiza»*.

**A sembró volumen: la vitrina pasó de 13 a 399 comprables.**

> ⏪ **Esa decisión se toma de nuevo, y no porque estuviera mal razonada:
> estaba bien razonada sobre una cardinalidad que ya no existe.** Es mi
> propia L-246 cobrándose en mi contra — *el censo decide el contenido, la
> ley decide la forma, y con esta cardinalidad la forma cambia.*

### Qué sobrevive y qué se cae, ítem por ítem

| lo que dije | con 399 | por qué |
|---|---|---|
| sin **encabezados de sección** | **SOBREVIVE** | seguir agrupando por especie es la navegación de N20, no un andamio |
| sin **paginación** | **SOBREVIVE** | paginar una lista de productos es de escritorio; el pulgar scrollea |
| sin **«cargar más»** | 🔴 **SE CAE** | 399 filas de una no se montan: es el techo de N16 (*primer contenido < 1 s*) reventando por volumen |

**⇒ Entra ventana + carga al llegar al final** —**jamás un botón**—, con
el precedente de la casa ya escrito: *«ventana de 10 + Cargar más, jamás
lista infinita»* (el hub del paseo, S60). **Acá la ventana es más grande
porque la unidad es más chica**, y el número lo mide C contra N16 en
aparato — *no lo invento yo desde acá.*

## A2 · LOS DOS MODOS — y qué decide cuál

**`SelectorSegmentado`** (Ley 19.3: vistas exclusivas 2-3), **en el techo
de Stock, fijo.** No es un ajuste escondido: es un cambio de vista, y
Finder lo tiene siempre a la vista por la misma razón.

| | **LISTA** (default) | **ÍCONOS** |
|---|---|---|
| pieza | `Celda` **con `tituloEntero`** | `Baldosa`, 2 columnas |
| para qué | **operar**: leer nombre, precio, stock, estado | **reconocer**: encontrar por la foto |
| lo que muestra | nombre entero · precio · stock · estado del espejo | foto · nombre (2 líneas) · precio |

**El default es LISTA, y es decisión:** Stock es la pantalla donde el
vendedor **trabaja**, y la ley de la casa ya lo dice — ***tarjetas para
elegir, filas para leer***. La grilla es para reconocer; la lista, para
operar. *Finder abre en lista por lo mismo.*

**⚠️ La elección SE RECUERDA.** Un modo que vuelve al default cada vez que
entrás no es un modo: es una preferencia que la app ignora. Vive en
preferencia local del dispositivo, no en el servidor: **es de la vista,
no de la cuenta.**

### A2bis · LA FILA COMPACTA — la anatomía que faltaba (S99-B)

*Nota de estado, primero: esta receta **SÍ está en `main`** —
`docs/laminas/2026-08-18-s99b-RECETA-STOCK-Y-LA-FILA-DEL-REPARTIDOR.md`,
verificada por contenido con `git show origin/main:…`—. La medición que
la daba por ausente se tomó antes del merge. **Lo que sí faltaba de
verdad es esto: la anatomía de la fila.***

**Por qué necesita anatomía propia y no alcanza con «`Celda` con
`tituloEntero`»:** con 11 productos una fila cómoda era gratis; con
**399**, el alto de la fila **es** la densidad, y la densidad decide si
el vendedor puede trabajar. *Una fila que era correcta a 11 no es una
decisión tomada a 399: es una que nadie volvió a tomar.*

```
[foto 40]  Pro Pac Adulto Pollo-Arroz 15 kg        $48,90
           12 en stock · Publicado                      ›
```

- **Foto 40** — la miniatura es el localizador real cuando hay 399:
  *el vendedor reconoce la bolsa antes que el nombre*. Es el paso
  siguiente de la escala del avatar, no un tamaño nuevo.
- **Dos renglones y nada más.** ① nombre entero (`tituloEntero`) +
  precio en mono a la derecha · ② stock · estado del espejo.
- **El precio en MONO y a la derecha** — se compara en columna, y la
  comparación es la razón de ser de esta vista.
- **El estado va como TEXTO, no como pill.** 399 pills es una pantalla
  de confeti; el color se reserva para el veredicto que exige acción
  (§A3).

### A2ter · 🔴 EL ALTO, Y MI PROPIA PALABRA SE CAE (S99-B, el cuello)

⏪ Escribí que el alto era *«de aparato»*. **No lo es: es aritmética**, y
la aritmética la tenía a un grep. Lo que sí es de aparato es otra cosa
—declarada al final—, pero **el alto sale de la anatomía y sale ahora**,
porque es lo que destraba los tres frentes.

**La cuenta, con los tokens que ya existen:**

| pieza | número | de dónde sale |
|---|---|---|
| miniatura | **40** | `AvatarMascota` talla `sm` — escalón vivo, no un tamaño nuevo |
| renglón ① (nombre) | 20 | `size.sm` con su interlínea |
| renglón ② (stock · estado) | 14 | `size.xs` |
| gap entre renglones | 2 | `spacing[0.5]` |
| padding vertical | 8 + 8 | `spacing[2]`, el de `Celda` |

**El contenido pesa `max(40, 20+2+14) = 40`** —manda la miniatura, no el
texto— **y el alto de fila es `40 + 16 = 56`.**

> ## 🔴 Y 56 ES, EXACTAMENTE, `ALTURA_MIN.normal` DE `Celda`.
>
> **La fila que Stock necesita no es una fila nueva: es la que la casa ya
> tiene.** *Mi palabra «compacta» fue la que confundió* — mandó a buscar
> una densidad más apretada, y lo que Stock necesita no es apretar: es
> **la fila normal CON su miniatura**, que es lo que vuelve encontrable
> un catálogo de 399.

**Y por qué no hay una fila de dos renglones más baja, medido:** la
densidad `compacta` de `Celda` es **48**, o sea **32 de contenido** — y
dos renglones piden 36. ⇒ ***`compacta` es una fila de UN renglón por
construcción.*** Quien la use acá va a perder el segundo renglón sin
darse cuenta. *No es una opción peor: es otra fila.*

### A2quater · LA VENTANA — derivada, con su supuesto a la vista

Con filas de 56 y un área de contenido de ~660 px (teléfono típico, con
techo y barra descontados): **~12 filas por pantalla.**

- **Ventana inicial: 30** (≈2,5 pantallas — hay scroll antes de que el
  cargador tenga que pensar).
- **Se pide la siguiente tanda a la fila 20**, no al final: *cargar
  cuando ya no hay nada abajo es cargar tarde.*

**⚠️ El supuesto está declarado a propósito** (660 px de área útil). *Si
el aparato dice otra cosa, el que se mueve es el 30 — la forma no.* **Y
lo único que sigue siendo de aparato es N16**: que la primera pantalla
pinte en menos de 1 s con 30 filas y 30 miniaturas. **Eso lo mide C, y
es lo único que yo no puedo.**

## A3 · 🔴 Y EL VOLUMEN TRAE ALGO MEJOR QUE UN PROBLEMA: EL ESPEJO POR FIN TIENE CON QUÉ VERSE

**Medido por A:** 27 rechazados **con motivo** · 26 sin precio · 27 en
revisión.

> Mi receta 7 partió los cinco estados en **VEREDICTO** (en revisión ·
> rechazado — se informan, no suman) y **HUECO** (sin precio — cuenta y
> tiene paso). **Hasta hoy esa frontera era un argumento; ahora hay 80
> filas para verla o desmentirla.**

**Lo que hay que mirar en la próxima pasada, y es la prueba de la
receta:** con 27 rechazados a la vista, **¿el rojo del `motivo_rechazo`
se lee como «esto es tuyo y arreglalo» o inunda la pantalla?** Si inunda,
el que está mal no es el estado: **es que en LISTA el veredicto tiene que
resumirse y su literal vivir en la ficha.** *Es exactamente la clase de
cosa que once productos no podían mostrar.*

---

# §B · LOS TRES HALLAZGOS DE LA CAMINATA DE C

*El founder ordenó mirar antes de mejorar; C caminó y trajo tres. Los
tres son de forma y por eso son míos.*

## B1 · «Agregar corte» se dibuja siempre

**Es N12.5, literal:** *«los topes viven en la construcción, no en el
texto — la puerta deja de ofrecer lo que va a rechazar»* (y Ley 23).

**La cura:** el control **desaparece** cuando ya no se puede agregar.
⛔ No se deshabilita: un botón gris obliga a la persona a averiguar por
qué está gris. **Y no lleva leyenda del tope** — la regla jamás se
escribe en pantalla.

*Precedente idéntico ya vivo: los vehículos del repartidor
(`repVehiculos.length < 2 &&`).* **Acá no hay nada que inventar: hay que
aplicar lo que la pantalla de al lado ya hace.**

## B2 · 🔴 La fila no dice que es editable — y el único control visible hace OTRA cosa

**El defecto peor de los tres**, porque no es una ausencia: **es una
señal equivocada.** El único elemento que se ve tocable es el
interruptor, así que la fila enseña *«acá lo único que se puede hacer es
prender y apagar»*, y editar queda escondido detrás de un tap que nada
anuncia.

**La cura, y sale de una ley que ya rige:** **la fila entera es tocable y
lo DICE con un chevron** (19.7: *información despliega, acción lleva*; el
chevron es de lo que navega).

**Y el interruptor se queda donde está** — es una acción distinta con su
propio control, y eso está bien. Lo que cambia es que **deja de ser el
único afordance de la fila**, que era el problema.

> **La prueba de que la cura es correcta: hoy la fila tiene UNA acción
> visible y DOS reales. Después tiene dos y dos.**

## B3 · El dato de la fila es el DOCUMENTO, y un vendedor no reconoce a nadie por su cédula

**El hallazgo es de producto y C lo pescó caminando:** un vendedor
reconoce a su repartidor por **el vehículo** o **el WhatsApp** — el
documento es dato administrativo, no identidad de trabajo.

**La cura, con la anatomía que ya escribí para la ficha:**

```
[foto]  Diego Salinas              ⌃
        Moto · AB 123 C            [◯]
```

- **Nombre** — el título.
- **Vehículo + placa** — el subtítulo, **y la placa en mono** (mismo
  argumento que en la ficha: *se dicta y se transcribe*).
- **El documento SALE de la fila** y vive en la ficha, que es donde se
  verifica. *No se pierde: se muda a donde sirve.*

**Con dos vehículos**, el subtítulo muestra **el primero y «+1»** — la
misma regla de la descripción del presupuesto (§10ter): *una fila muestra
el primero y cuenta el resto; el detalle es de la ficha.*

### ✅ FIRMADA (founder, 18-ago) — **NOMBRE · VEHÍCULO · PLACA**

⏪ Dejé la pregunta abierta a propósito y **la firma llegó con la misma
razón que yo había dado**: *es lo que el vendedor ve llegar por la
puerta*.

- **El WhatsApp queda a UN TOQUE, en la ficha** — no se pierde, cambia de
  piso.
- **El documento se muda a la ficha**, como ya estaba definido.

*Las dos cosas que salen de la fila salen al MISMO lugar, y ese lugar es
el que existe para verificarlas.*

---

# §C · LO QUE NADA DE ESTO PUEDE FIRMAR

**El ojo, y en dos preguntas concretas:**

> **Stock:** *con 399 productos, ¿el modo LISTA te deja trabajar y el de
> ÍCONOS te deja encontrar? ¿O los dos hacen lo mismo peor?*
>
> **La fila del repartidor:** *¿reconocés a tu repartidor de un vistazo?*
