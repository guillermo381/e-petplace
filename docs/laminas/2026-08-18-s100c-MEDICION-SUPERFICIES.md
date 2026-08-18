# S100c-B · LA MEDICIÓN DE SUPERFICIES, LA «i» Y EL CARRITO — con aparato

> **Objeto medido, verificado antes de medir nada:** APK del cliente sobre la
> OTA **`fbd7b6e0`** («S100b · la vuelta de la forma»), ancla **`f107eac9`**,
> **verificada ancestro de `origin/main`**. El pie de Cuenta declara
> `update 01a0130f · preview · 17/08 23:09`, y el group más nuevo del canal se
> publicó a esa misma hora y minuto (medido: *«59 minutes ago»* con el reloj
> del aparato en 00:08). ⇒ **lo que miré ES lo que el founder gateó.**
>
> **Aparato:** SM-S938B `R5CY201ZDVL` · `1080 × 2340 px @ 450 dpi` =
> **384 × 832 dp**. Capturas PNG + `uiautomator dump` por pantalla.
> **Laika (`com.kubo.laika`) medida en EL MISMO teléfono, el mismo día, con el
> mismo recorte** — no contra una captura de otro dispositivo.
>
> **Instrumento nuevo: `scripts/censar-superficies.py`.**

---

## §0 · EL INSTRUMENTO SE VERIFICÓ ANTES DE USARSE, Y SE CORRIGIÓ DOS VECES

**Contra geometría plantada** (fondo `#FAF9F7`, carta `#FFFFFF`, una segunda
superficie `#E6E6EB`, y una región de ruido que NO debe salir como plano):
las tres cajas salieron dentro del paso de muestreo y los tres colores
exactos. **Y el par carta/fondo dio `1.052`, que es EL MISMO número que la
casa ya había medido por otro camino y escrito en `Tarjeta.tsx:127.`** *Dos
cuentas, un número* — L-287 en su forma buena.

**Las dos correcciones, que son la parte que vale:**

1. **La primera versión cuantizaba los colores y reportaba la esquina del
   cubo.** `#FAF9F7` salía `#F8F8F0` y su contraste contra el blanco daba
   **1.005** cuando el valor verdadero es **1.052** — **un error de 10× en el
   único número que la ley usa.** *Un contraste cuantizado no es un contraste
   aproximado: es otro número.* Curado reportando el color EXACTO modal.
2. **La caja de la carta blanca se comía la región de ruido de al lado**,
   porque el ruido tiene píxeles que caen en el mismo cubo. **El área salía
   plausible y la caja, falsa.** Curado con una máscara de planitud que corre
   ANTES de contar: un píxel cuenta solo si su vecindario es uniforme.

**Lo delató un número que no coincidía con otro, no una relectura del código.**

---

## §1 · N21 · LA LEY DE SUPERFICIES

### 1.1 · El censo de nuestro recorrido

`separadores = planos distintos del fondo + reglas`. Aparato, 18-ago-2026,
mismo recorte para las siete.

| pantalla | planos | reglas | **separadores** | **% de fondo** | cobertura plana |
|---|---|---|---|---|---|
| Hogar | 5 | 8 | 13 | — (degradado) | 46,7 % |
| Tus pedidos | 2 | 11 | 13 | 19,9 % | 81,0 % |
| checkout | 3 | 4 | 7 | 62,3 % | 85,2 % |
| vitrina | 2 | 4 | 6 | 38,1 % | 84,5 % |
| carrito | 3 | 2 | **5** | **69,7 %** | 87,9 % |
| resumen del total | 2 | 3 | 5 | 50,3 % | 84,7 % |
| **detalle del pedido** | **0** | **0** | **0** | **88,5 %** | 88,5 % |

### 1.2 · 🔴 EL CASO PEOR, Y ES EL QUE EL FOUNDER NOMBRÓ

**El detalle del pedido tiene CUATRO grupos rotulados y CERO superficies:**
la escalera de estados · `Qué pediste` · `A dónde te lo llevamos` · `El total
de tu pedido`. **El 88,5 % de su área útil es un solo color.**

**Y ahí vive el código de la puerta.** `pedido/[pedidoId].tsx:396` lo monta
dentro de un `<View style={{ paddingHorizontal, gap }}>` — **padding y nada
más**. *La frase del founder —«el código se pierde porque queda entre
colores»— no es una impresión: es la descripción exacta del árbol.*

> **La regla que sale del caso: un rótulo que nombra un grupo está declarando
> un grupo. Un grupo declarado y no dibujado es un rótulo que miente.**

### 1.3 · 🔴 LO QUE **NO** ES EL DEFECTO — la cura obvia habría sido la equivocada

| | fondo | carta | **contraste** |
|---|---|---|---|
| **nosotros** | `#FAF2F5` | `#FFFFFF` | **1,10** |
| **Laika, medida en el aparato** | `#F2F2F2` | `#FFFFFF` | **1,119** |
| **Laika, captura del repo** | `#F2F2F2` | `#FFFFFF` | **1,119** |

**Cuando ponemos carta, separamos prácticamente igual que la referencia.**
⇒ subir el contraste, que es lo que «se pierde entre colores» sugiere a
primera lectura, **no habría curado nada.**

*(De paso, una confirmación que da confianza: la captura que el founder tomó
días atrás y mi medición en vivo de hoy dan el mismo `#F2F2F2` / `#FFFFFF` /
1,119. Dos objetos independientes, un número.)*

**El reparto del área es lo que sí lo dice:**

| carrito | fondo | superficie |
|---|---|---|
| **el nuestro** | **69,7 %** | **10,2 %** (y la mayor parte es la barra de tabs) |
| **el de Laika** | 22,4 % | **45,1 %** |

**Laika invierte la proporción: el doble de superficie que de fondo. Nosotros
tenemos siete veces más fondo que superficie.**

### 1.4 · ⚠️ LOS DOS CEROS NO SON EL MISMO CERO

`referencia-laika-resumen-pedido.jpeg` **también da 0 planos.** Y no significa
lo mismo: **tiene SIETE cartas**, separadas por **hairline** sobre fondo
casi-blanco. Su censo completo es **0 planos · 23 reglas**. El nuestro,
**0 · 0**.

*Apoyar la ley en esa equivalencia habría sido una conclusión correcta sobre
una premisa falsa* (L-294). **Por eso el instrumento cuenta las dos cosas y
avisa cuando da 0/0.**

⇒ **La separación puede ser RELLENO o BORDE; lo que la ley prohíbe es
NINGUNA.** La casa ya tiene las dos vías: `Tarjeta` en claro recupera su
hairline (enmienda S86, medida: `1.052`) y en oscuro usa el halo. **El
material existía desde S58; lo que faltaba era la ley que dice dónde va.**

### 1.5 · El límite del instrumento, declarado

- **No ve sombras.** Si el censo da 0/0 hay que mirar la captura antes de
  concluir, y el reporte lo dice en vez de sentenciar.
- **`reglas` NO es comparable entre formatos.** Las referencias JPEG de 540 px
  dan 22–36 donde una PNG de 1080 px de la misma clase da 4–11: es ringing de
  compresión. ⇒ **`reglas` se compara live-contra-live; el número que cruza
  formatos es el % de fondo.**

---

## §2 · N22 · LA «i» EN CÍRCULO

**Los párrafos siempre visibles que hoy cuestan alto, medidos en el aparato:**

| dónde | texto | alto |
|---|---|---|
| carrito | *«El total con envío e impuestos lo vas a ver antes de pagar.»* | **40,5 dp** |
| checkout | *«Lo que el repartidor tiene que saber: "dejar en portería"…»* | **~61 dp** (3 líneas) |
| resumen | *«Todavía no hay medio de pago real: no se cobra nada…»* | **~75 dp** (título + 3 líneas) |

**El patrón ya existe construido y funcionando** (A, S100b: `onExplicarDonacion`
en `carrito.tsx`; los dos párrafos de «que llegue solo» en `checkout.tsx`), y
**la referencia lo respalda**: el carrito de Laika usa exactamente esa forma
—«i» en círculo + chevron dentro de una carta— para su banda de membresía.
**La ley no inventa un patrón: nombra el que ya funcionó.**

⚠️ **Los tres son CANDIDATOS, no órdenes.** El de la instrucción de entrega
explica un campo que se está por llenar, así que puede pertenecer a los que
**deciden**. *Lo decide su dueño mirándolo, no yo desde la ley.*

---

## §3 · ③ EL CARRITO — cuatro cosas, y una de ellas reabre una decisión firmada

### 3.1 · 🔴 EL GLIFO: la canasta se lee como bolsa, y la causa es de método

**Firma del founder:** *«no es un carrito, es una bolsa y se ve muy fea. Hay
que poner un carrito, que es lo que siempre han utilizado todas las
compañías.»*

**Su razón es correcta y la referencia la respalda: Laika usa un CARRITO CON
RUEDAS**, no una canasta. Amazon, Mercado Libre y Rappi también.

**Y hay que decir por qué pasó, porque es la lección y no el error:** el
argumento de S100b para que `carrito` no fuera alias de `despensa` **sigue
siendo bueno** (*la tab dice dónde estás, el carrito dice cuánto llevás*). Lo
que falló no fue la distinción: **fue que la forma se eligió desde la palabra
«canasta» —que estaba en el texto del gate— en vez de medirse contra el
objeto.** Una canasta con asa de arco y cuerpo que se angosta hacia abajo
**tiene la misma silueta que una bolsa**, y a 21 px la silueta es todo lo que
queda.

> **Es la ley de la barra de S99 en ropa nueva: la referencia se MIDE, no se
> describe.** Cuatro traducciones en prosa mandaron a construir un bulto que
> la referencia no tenía; acá una palabra mandó a dibujar una bolsa.

**El discriminador de la cura, y por eso es el correcto: LAS RUEDAS.** Es el
único rasgo que una bolsa y una canasta **no pueden tener**. Sobreviven a
21 px porque son dos discos, no un detalle de trazo.

⚠️ **Gate de ícono pendiente (§2.9): verlo a 21 px es del founder.** Y se
declara algo más: **en este entorno no hay rasterizador de SVG** (ni
`cairosvg`, ni `rsvg-convert`, ni Inkscape), así que **no puedo verificar la
legibilidad a 21 px sin pasar por RN-web o por un publish.** Se dice en vez de
darse por bueno.

### 3.2 · La puerta al carrito: el founder firmó FLOTANTE, y eso reabre S100b

**Hoy hay UNA puerta: la canasta del encabezado**, medida en
`x=[344.2, 368.0] · y=[80.4, 104.2]` — **el ángulo superior derecho**, que es
la peor zona para un pulgar en una pantalla de 832 dp.
**El founder firmó: flotante, abajo a la derecha.**

**⇒ Se decide: la flotante REEMPLAZA a la del encabezado. No conviven.**
*Dos puertas al mismo cuarto no son redundancia: son dos lugares donde
aprender lo mismo, y la segunda le roba sentido a la primera.*

**Y lo que vuelve barata la decisión — el mecanismo ya está construido:** una
flotante sobre un scroll reintroduce **H-105** (el CTA fijo que tapa
contenido), que es justo lo que S100b pasó la sesión curando. **`PantallaConPie`
lo resuelve sin nada nuevo:** su reserva es DERIVADA —el pie se mide a sí
mismo y esa misma medida reserva el scroll—, así que **una flotante montada
como su `pie` no puede tapar contenido.** *La cura que ya existe resuelve el
pedido nuevo; si se monta a mano con `position:'absolute'`, vuelve el defecto
— y R53 muerde, que es lo que tiene que hacer.*

⚠️ **La flotante es de la VITRINA. En el carrito, el checkout y el resumen no
va** — ahí el carrito no es un destino: es la pantalla en la que ya estás.

### 3.3 · 🔴 EL STEPPER ROMPE LA TARJETA — con número

**Firma del founder:** *«al agregar salta un escalón por debajo de todo y
queda viéndose feo.»*

**Medido sobre la misma tarjeta, antes y después de tocar el `+`:**

| | alto de la tarjeta |
|---|---|
| **antes** (con `+`) | **309,0 dp** |
| **después** (con stepper) | **353,1 dp** |

⇒ **la tarjeta crece 44,1 dp — exactamente un blanco de 44 (N8)** — **y su
vecina de la misma fila no se mueve.** Ése es el «escalón»: la fila deja de
ser una fila.

**Por qué no entra en su renglón, con los números de S100b:** caja interna
**138 dp**; el `+` solo entra al lado del precio (68 + 8 + 44 = **120 ≤ 138**),
pero el stepper compacto no (68 + 8 + 116 = **192 > 138**). **No es un
descuido: es aritmética, y por eso la cura no puede ser «achicar un poco».**

**⇒ La cura es que el alto de la tarjeta NO DEPENDA DEL ESTADO.** El control
vive en una fila propia de alto constante, que con cantidad 0 aloja el `+` y
con cantidad ≥1 aloja el stepper. **El defecto se vuelve inexpresable** — es
el mismo movimiento que `PantallaConPie` hizo con la reserva del pie.

⚠️ **Su costo, declarado y no escondido: +44 dp en TODAS las tarjetas**, sobre
una que ya venía creciendo (el 1:1 le sumó ~41 dp en S100b). **El acreedor es
el mismo que dejó escrito S100b: el bloque de texto y el header.** *Se declara
en vez de compensarlo encogiendo la letra.*

### 3.4 · La eliminación no dice nada

La papelera borra **sin animación y sin acuse**. Firmado en S100b y sostenido:
**sin confirmación previa** —la acción es inmediata y el deshacer es de la
pantalla, que es la única que sabe qué se borró—, **pero el acuse falta**.
*Un borrado silencioso y un borrado fallido se ven igual.*

---

## §4 · N23 · EL COLOR MARCA CLASE, JAMÁS IMPORTANCIA — el censo dio bien

**Medido sobre la FUENTE, no sobre píxeles** (el código es exacto; los píxeles
no distinguen intención):

- **`Texto` no tiene color de acento.** `TextoColor` es
  `primary | secondary | tertiary | danger | success | warning` — **texto y
  STATUS, que es exactamente «otra clase».**
- **`PrecioText` no tiñe.** El precio manda por **tamaño y peso**, jamás por
  color.
- **Cero `color:` explícito sobre texto en toda la despensa del cliente.**
- Acento sobre texto en `packages/ui`: **tres familias, las tres legales** —
  **acción** (`Boton` variante `acento`, la etiqueta de `Aviso`), **estado**
  (`Badge`, `BarraTabs`, `CampoCodigo`) y **marca firmada**
  (`bienvenida.tsx:81`, con su destello, `DIRECCION_ARTE` §5).

⇒ **La ley ya se cumple por construcción, y eso cambia qué hay que hacer con
ella: no hay nada que curar, hay algo que IMPEDIR.** El riesgo es el `accent`
que alguien le agregue mañana a `TextoColor` «porque hace falta destacar un
dato».

⚠️ **Y LO QUE NO PUDE REPRODUCIR, declarado en vez de rellenado:** **el censo
no encuentra en nuestra app el patrón que el founder describe.** Los
candidatos más cercanos —`Pago simulado` en `warning`, las insignias de
estado— **son «otra clase», o sea legales bajo esta misma ley**. *El caso lo
tiene quien lo vio* (L-288): **queda como pregunta al founder, en qué pantalla
lo notó.** La ley se adopta igual: es correcta con caso o sin él, y cuesta
cero.

---

## §5 · 🔴 UN ERROR MÍO, CAZADO ANTES DE REPORTARLO — y su lección es reusable

**Reporté que el carrito del encabezado violaba N8:** el árbol da
`23,8 × 23,8 dp` y la ley pide 44.

**Es falso.** El `Pressable` lleva `hitSlop={spacing[3]}` ⇒ **24 + 12×2 = 48 dp
de blanco efectivo**, que **supera** el mínimo.

> **`uiautomator dump` NO reporta `hitSlop`.** Las `bounds` del árbol son las
> del `View`, no las del área táctil. ⇒ **ninguna auditoría de blancos de 44
> se puede hacer desde el árbol solo**: el árbol sub-reporta por exactamente
> `2 × hitSlop`, y la casa usa `hitSlop` como recurso normal (`Boton`,
> `GlifoConContador`, el timbre `+`).

**Lo cazó que dos cuentas no coincidieran** —el árbol decía 23,8 y la fuente
decía 48— **no una relectura más cuidadosa de la captura.** Es la misma
familia que la trampa que mi predecesora dejó escrita: *el árbol dice que
están; la pantalla dice que no* — acá al revés.

---

## §6 · LO QUE NO SE MIDIÓ, DECLARADO

- **Oscuro y memorial: NO medidos.** Todo lo de acá es tema claro.
- **La pantalla «en camino» y el código de entrega EN PANTALLA:** la lista de
  pedidos de esta cuenta no tiene ninguno en `en_camino` ni `entregado`, así
  que **el código no se pudo ver renderizado**. Lo que sí está medido es
  **dónde vive** (`pedido/[pedidoId].tsx:396`, en un `View` sin superficie) y
  **el censo de la pantalla que lo aloja** (0 separadores). *No se forzó dato
  vivo para verlo.*
- **La legibilidad del glifo nuevo a 21 px** (§3.1): sin rasterizador local.
- **Nada de lo que se construya hoy tiene ojo hasta un publish**, y publicar
  pide firma.
