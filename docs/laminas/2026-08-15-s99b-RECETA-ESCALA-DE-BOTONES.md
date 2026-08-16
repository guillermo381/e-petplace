# RECETA DE FORMA — LA ESCALA DE BOTONES

**Estatuto:** Toque 1 de la Dirección de Diseño. **Va ANTES de L5b**, por
orden de mesa: *«es la que aparece en TODAS las pantallas nuevas — la de
mayor alcance por unidad de trabajo»*. No aprueba pantallas.

**Por qué primero:** si la vitrina se construye sin esto, **estrena la
vara nueva del founder con los botones que él viene rechazando**.

---

## §1 · EL CENSO — 501 botones, medidos

| eje | medido |
|---|---|
| **total** | **501** `<Boton>` en `apps/` |
| **tamaño** | `md` **415** (por default, **0 explícitos**) · `sm` **83** · **`lg` 3** |
| **variante** | **`secundario` 184** · `primario` 146 · `ghost` 62 · **sin declarar 48** · `compacto` 39 · `destructivo` 11 · `sinCaja` 5 · `acento` 4 · `marca` 2 |
| **`bloque`** | **60** (12 %) |

### 🔴 EL DATO ESTRUCTURAL, que explica el síntoma sin culpar a nadie

**El default de `Boton` es `primario`, o sea SÓLIDO.**

⇒ **los sólidos reales son 211 de 501 — el 42 %**, contando los **48 que
nunca declararon variante** y por lo tanto son sólidos sin que nadie lo
haya decidido.

> **La escalera se sube sola.** Escribir `<Boton etiqueta="…" />` sin
> pensar produce el escalón más fuerte que la casa tiene. *No es
> indisciplina: es la pieza empujando.*

### 🔴 Y EL SEGUNDO, que es el que se ve en pantalla

**Hay más `secundario` (184) que `primario` (146).** Con 19.7 rigiendo
—*por superficie UN sólido; el resto baja a label*— eso solo puede
significar una cosa:

> **La escala no se está usando como escalera: se está usando como
> paleta.** Cada pantalla elige un botón como quien elige un color, en
> vez de bajar un escalón desde el compromiso.

**Medido en pantallas concretas** (contando solo variantes explícitas, o
sea **por lo bajo**): 7 pantallas con **4 a 7 sólidos** — `clips.tsx` 7 ·
`seccion-horarios` 6 · `equipo` 6 · `pedido/[pedidoId]` 5.

---

## §2 · LA LEY — la escalera se BAJA, no se elige

**Por superficie, en este orden y sin saltos:**

| escalón | qué es | cuántos por superficie |
|---|---|---|
| **① EL COMPROMISO** | `primario` — sólido, y `destructivo` si destruye · `acento` si es momento de marca | **UNO. Exactamente uno.** |
| **② LA ALTERNATIVA REAL** | `secundario` (contorno) — **solo si la otra rama también tiene consecuencia** (§3) | 0 o 1 |
| **③ LO DEMÁS BAJA A LABEL** | `ghost` / `sinCaja` — **con chevron si NAVEGA, sin chevron si EJECUTA** | los que hagan falta |
| **④ LA ACCIÓN DE FILA** | `compacto` | dentro de su fila |

**La prueba de que ① es ①:** *si hay dos sólidos, uno de los dos no era
el compromiso.* Preguntarse cuál sobra es más barato que discutir cuál
gana.

### La escala de TAMAÑO no es una perilla de énfasis

- **`md` (48) es EL botón de la casa.** No hace falta declararlo — y que
  415 no lo declaren está bien, no mal.
- **`sm` (36) es DENSIDAD, jamás jerarquía.** Vive donde el espacio es el
  problema (filas, cabeceras), y compensa su target con `hitSlop`.
- **☠️ `lg` (56) tiene TRES usos en 501, y se declara en vez de tolerarse:
  o gana su caso escrito, o muere** (Ley 37). *Un escalón que nadie sube
  no es una opción: es una trampa esperando a que alguien la use para
  gritar.*
- **`bloque` es del PIE, no del énfasis.** A ancho completo significa
  *esto cierra la pantalla* — sus 60 usos son coherentes con eso.

**⇒ La escala viva tiene DOS tamaños y CUATRO escalones de énfasis.** No
son seis perillas: son dos preguntas —*¿cuál es el compromiso?* y
*¿cuánto espacio hay?*— con una respuesta cada una.

---

## §3 · D-484, QUE ESTA RECETA PAGA — el par de la Hoja de decisión

**Su disparo acaba de sonar:** la ficha de D-484 dice *«dispara con el
próximo boceto que contenga una Hoja de decisión»*, y el **pie fijo de
`Hoja`** (S99-B) hace del CTA de decisión su habitante canónico.

**El problema, en su literal:** hoy la decisión binaria vive como
`primario` + `ghost` apilados —*«Rechazar» del presupuesto clínico, la
autorización, los «cancelar» de Cuenta en ambas apps*— y **eso ya es
ilegal por 22c**: *un comando con consecuencias viste de botón*, y
rechazar un presupuesto tiene consecuencias.

**Lo que colisiona, y por eso la deuda llevaba dos años abierta:** 19.7
manda UN sólido por superficie · 22c manda que lo que tiene consecuencias
no sea un label. Con dos ramas que **ambas** consecuencian, las dos leyes
tiran para lados distintos.

**LA RESOLUCIÓN: `primario` + `secundario`, jamás `primario` + `ghost`.**

- El `secundario` **tiene contorno**, así que no es un label: cumple 22c.
- **Y 19.7 no lo alcanza**, y esto es lo que destraba la deuda: su letra
  dice *«el contorno transparente MUERE **como acción de fila**»*. **El
  pie de una Hoja no es una fila.** *La prohibición nunca llegó hasta
  acá; lo que faltaba era leerla entera.*
- Sigue habiendo **UN solo sólido**: el que continúa.

**⚠️ Su gate NO es una lámina** (ley S99): se mira en **la primera Hoja
que embarque con pie**, que es donde vive.

---

## §4 · LO QUE ESTA RECETA **NO** PUEDE FIRMAR

**El ojo, y es la mitad que importa acá.** Los instrumentos dicen que la
escalera está mal usada; **ninguno dice si el botón se siente bien** — y
eso es exactamente lo que el founder viene rechazando.

Su pregunta concreta, para cuando la vitrina se mire en el teléfono:

> *Con un solo sólido por pantalla: ¿la pantalla se ve más tranquila, o
> se ve incompleta?*

**Y una salida barata señalada de antemano:** si con un solo sólido las
pantallas se sienten vacías, el escalón que falta **no es otro botón —
es jerarquía tipográfica en el label** (peso y tamaño), que no agrega
cajas.

---

## §5 · LA MECANIZACIÓN — candidata, con su trampa medida

**`R47 · un sólido por superficie`** es mecanizable y sería un ratchet
solo-baja. **No la escribí en esta tanda, y digo por qué en vez de
omitirlo:**

> **Un contador ingenuo mediría MAL, y de menos: el default de `Boton`
> ES sólido**, así que los 48 botones sin `variante` no aparecen en
> ningún grep de `variante="primario"`. Una regla que los ignore
> **bendice como preexistente lo que nunca contó** — el mismo defecto que
> R44 tuvo y que costó dos re-mediciones.

Su net honesto exige asociar atributos a cada `<Boton>` **a través de
JSX multilínea**, que es parseo y no regex. **Es una tanda propia, y se
pide antes de escribirla.**
