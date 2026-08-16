# RECETA DE FORMA — EL CONTADOR DE `PuertaHermana`

**Estatuto:** Toque 1 de la Dirección de Diseño, sobre pieza **mía**
(`packages/ui`). La ejecución es de esta pista; esta receta existe para
que la decisión quede argumentada **antes** del código y para que D sepa
qué dato le va a pedir la pieza.

**La ley firmada por la mesa:** cuenta **lo NO VISTO** y **puede llegar a
cero** · **simetría en las dos puertas** · **cero = ausencia de insignia,
jamás un cero dibujado** · el exprés como excepción pendiente.
**Firma del founder:** *«un diseño bonito y elegante, que no se vea como
una mancha en la pantalla.»*

**La tensión que me toca resolver, en sus palabras:** *la puerta es un
LUGAR, no un aviso. El contador dice «hay algo nuevo del otro lado» sin
convertir la puerta en alarma.*

---

## §1 · 🔴 EL CHOQUE, DECLARADO — la pieza dice hoy que NO lleva contador

`PuertaHermana` nació hace horas con esto escrito en su cabecera, como
**decisión firmada de D**:

> *«**① NO lleva contador.** Dos razones, la segunda es la fuerte: un
> número tendría que ser verdad **del día que el selector compartido está
> mostrando**, y sostener eso obliga a cada ventana a traer los datos de
> la otra solo para pintar una cifra — el viaje que N16 existe para
> eliminar, en la pantalla donde D-738 se midió. Y sobre todo: **la
> puerta es un LUGAR, no un aviso.** Un contador la vuelve badge, y **un
> badge en 0 es peor que ninguno**… ☠️ CANDIDATA DECLARADA, no
> prohibida.»*

**Dos letras firmadas que se contradicen son peores que una equivocada**
—cualquiera cita la que le conviene y está «en regla»— así que esto se
reconcilia **en la pieza**, no solo acá (precedente: el magenta S83, la
plata S83 y S88).

### Y la reconciliación no es «gana la más nueva»: la razón de D SE DISUELVE al leer qué firmó la mesa

D midió bien **otra cantidad**. Su objeción vale entera contra *«los
pedidos DEL DÍA que el selector está mostrando»* — esa cifra sí obliga a
cada ventana a traer el rango de la otra.

**Pero la mesa no firmó eso: firmó LO NO VISTO.** Y lo no visto **no
tiene día**. Es un número suelto, no una consulta sobre el rango de la
ventana hermana ⇒ **el viaje que D quería evitar no aparece.**

Su segunda razón —el badge en 0— **no se refuta: se cumple**. La regla de
existencia (§3) hace que con `0` no se dibuje absolutamente nada, que es
literalmente lo que él pedía.

> **La candidata que D dejó abierta no esperaba a que las dos ventanas
> leyeran el mismo rango: esperaba a que alguien nombrara bien la
> cantidad.** La mesa la nombró.

**Su cabecera se enmienda con los dos literales a la vista** — el suyo y
el de la mesa — para que la próxima pista lea la historia y no solo el
veredicto.

---

## §2 · POR QUÉ **NO** ES UN `Badge`, aunque la casa tenga uno

La casa ya tiene UNA pieza para «cuánto te espera»: `Badge`. La regla de
esta casa manda ensanchar, jamás copiar (L-175) ⇒ **lo primero que hice
fue intentar consumirla.** No entra, por dos motivos medidos:

**① SU ANATOMÍA ES OTRA.** `Badge` se **posa sobre un ícono**: recibe
`children` (el glifo) y monta la novedad en `position:absolute` sobre él
(`top:-6 / right:-14`). **La puerta no tiene ícono** — tiene una etiqueta
de texto y un chevron de 20. No hay ancla sobre la cual posarse; forzarla
sería inventarle un glifo a la puerta para tener dónde colgar el número.

**② SU FORMA `contador` ES ROJA, y eso está medido, no opinado:**
`Badge` monta `Insignia estado="atencion"`, y en el mapa de estados
`atencion → 'danger'`. **Un pedido esperando no es un error.** Es la
misma frase que la propia cabecera de `Badge` usa para prohibirse el rojo
en su otra forma: *«jamás rojo de alarma: un aviso no es un error»*.

> Una pill roja en la puerta sería **exactamente la mancha** que el
> founder nombró, y **exactamente la alarma** que la mesa prohibió. No
> hay que discutirlo: hay que medir a qué token resuelve.

⇒ `Badge` sigue siendo la pieza de **la novedad sobre un ícono** (la
campana, la barra). Esto es otra cosa: **un conteo INLINE en una fila de
texto.** Dos anatomías, dos piezas. *No es duplicar vocabulario: es no
meter a la fuerza una pieza en un lugar que no es el suyo.*

---

## §3 · LA FORMA — el número es de la casa, y la aparición es el mensaje

**El contador es el MISMO número en mono que la casa usa para todo dato
que produjo una máquina** (Ley 3, regla de voz): `Texto variante="dato"`
—JetBrains Mono 400 · 13px · tabular— **en `color="primary"`**.

La etiqueta de la puerta es **sans medium 13 en `text.secondary`**. Con
eso, el número queda distinguido por **tres ejes a la vez —familia, peso
y color— sin una gota de acento y sin una caja.**

**Y esa es la elegancia entera: la jerarquía sale del registro
tipográfico, no de pintura.**

- **⛔ CERO acento de color.** Consideré `accent.active` (tealDark en el
  prestador) y lo descarté por dos razones, en este orden: **abriría un
  par nuevo de WCAG** que hoy no está medido (color de TEXTO a 13px ⇒
  piso 4.5:1, y afirmarlo sin correr el gate sería justo el error que
  esta pista viene cazando), y **no hace falta**: el registro mono ya
  separa. *Un color que no agrega información agrega ruido.*
- **⛔ CERO caja.** 19.8 es literal: **se contornea lo que se FIJA.** Un
  conteo no se elige ni se fija — se lee. Contornearlo lo disfrazaría de
  control tocable dentro de un control que ya es tocable entero.
- **⛔ CERO animación** (Ley 6, y la cabecera de `Badge` ya lo firmó para
  su caso): **la novedad se dice con PRESENCIA, no con movimiento.**

### La regla de existencia, y por qué resuelve la ambigüedad sola

**Con `0` no se dibuja nada** — ni pill vacía, ni «0», ni hueco
reservado. Es la ley de la mesa (*cero = ausencia de insignia*) y es la
misma que `Badge` ya tiene escrita.

De ahí sale la respuesta a la única pregunta abierta de la forma —*¿cómo
sabe el vendedor que ese 3 es «sin ver» y no «el total»?*—:

> **LA APARICIÓN ES EL SIGNIFICADO.** Un total estaría siempre; éste
> aparece y desaparece. **Un número que a veces no está solo puede querer
> decir «hay algo nuevo».**

⇒ **el número va solo, sin palabra al lado.** La puerta tiene que quedar
corta porque tiene que poder espejarse, y *«3 sin ver»* la alarga en las
dos mitades para decir lo que la aparición ya dice. **La palabra vive en
la voz de accesibilidad, donde no cuesta ancho** (§5).

### Dónde se para, y por qué no hace falta una prop para decirlo

**Pegado a la etiqueta, del lado del chevron** — o sea: **lo deriva
`direccion`, igual que el orden y el trazo.**

```
derecha    →     Tus pedidos de hoy  3  ›
izquierda  →  ‹  3  Tus citas de hoy
```

*El espejo se mantiene por construcción, que es la razón por la que esta
pieza existe: no hay forma de montarla torcida.*

---

## §4 · LA SIMETRÍA SE CIERRA HACIÉNDOLA **OBLIGATORIA**, no pidiéndola

La mesa fue precisa: *«Nace ADENTRO de la pieza, jamás compuesto por el
consumidor — si fuera local, las dos mitades del espejo podrían diferir y
nadie lo vería hasta cruzar.»*

**La forma nace adentro** (anatomía, posición, registro, regla de
existencia): cero props de geometría, cero props de color. Lo único que
la pieza no puede hacer es **leer** — así que el dato entra.

**Y entra como prop REQUERIDA, no opcional:**

```ts
sinVer: number   // requerida a propósito — ver abajo
```

*Con una prop opcional, la asimetría más probable no es que una puerta
pinte distinto: es que **una puerta lo pase y la otra se olvide**, y eso
solo se descubre cruzando. Requerida, las dos mitades están obligadas a
decidir explícitamente, y `0` es una respuesta legítima que no dibuja
nada.*

**Hoy sale gratis: la pieza tiene UN solo consumidor y es la galería**
(medido — D todavía no montó el dual). *Una prop se vuelve obligatoria el
día que no cuesta; después ya no se puede.*

---

## §5 · LA VOZ — el número viaja en el label del tocable, jamás aparte

Contrato idéntico al de `Badge`, y por la misma razón: **la puerta entera
es UN tocable**, así que el número se anuncia **dentro de su etiqueta** —
leerlo como nodo aparte lo diría dos veces.

- con `sinVer > 0` → *«Tus pedidos de hoy, 3 sin ver»* / *«…, 3 unseen»*
- con `0` → la etiqueta sola, exactamente como hoy

**La voz vive en el riel (namespace `ui`), jamás en un template
hardcodeado** — precedente literal: la extracción de `Badge` pagó de paso
un «{n} pendientes» que llevaba desde S43 clavado en español.

**⚠️ Y no reuso `useEtiquetaBadge`:** su voz dice *pendientes* y
*sin leer*, y acá la palabra firmada es **sin ver**. Meterle una tercera
forma a un hook que se llama *Badge*, para una pieza que **no es** un
Badge, es empezar a torcer la pieza equivocada. **Si un día una tercera
superficie necesita «N sin ver», ahí se consolida la voz** — que es
cuándo esta casa promueve: en el segundo consumidor, no en el primero.

---

## §6 · LO QUE ESTA RECETA **NO** RESUELVE, declarado

1. **El exprés como excepción.** La mesa lo dejó pendiente y acá queda
   pendiente: **no tiene letra**, y una excepción sin letra se implementa
   como una suposición. *La forma está lista para recibirlo —un exprés es
   otro número, no otra anatomía— pero el criterio de cuándo un pedido
   cuenta distinto es de producto.*
2. **Qué cuenta exactamente «no visto»** — es de A y de D: quién marca
   visto, cuándo se marca, y contra qué. **La pieza no lo decide y no
   debe**: recibe un número. *Lo escribo porque el riesgo real es que
   nadie lo defina y el número termine siendo «los de hoy» sin que nadie
   lo haya decidido — que es la cantidad cuya objeción D midió bien.*
3. **El ojo.** Los instrumentos dicen que el registro tipográfico separa
   sin gritar; **ninguno dice si la puerta sigue sintiéndose un lugar**.
   Va al gate con su pregunta:

> *Con el número puesto: ¿la puerta sigue pareciendo una puerta, o
> empezó a parecer un aviso?*

**Y su salida barata, señalada de antemano:** si el ojo la lee como
aviso, el número baja a `color="secondary"` —el mismo registro que la
etiqueta— y queda distinguido solo por familia. **Un token, ni un
píxel de rediseño.**
