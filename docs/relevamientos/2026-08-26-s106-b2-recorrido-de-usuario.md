# S106-B · TANDA 2 — EL RECORRIDO DE USUARIO (OBRA 0)

> **Se escribe ANTES de construir.** No es documentación de las piezas: es la
> prueba de que se pensó **el acto** antes que el componente.
>
> *El defecto del token único de la tanda 1 no lo cazó ningún gate: lo cazó que
> contaran cómo se iba a usar la pantalla.*

---

# 🔴 FRENO DE ENTRADA — la dirección de arte «adjunta» NO existe en el repo

Medido antes de escribir una línea, contra el objeto:

| medición | comando | resultado |
|---|---|---|
| ¿hay documento de arte de tanda 2? | `ls docs/` + `grep` por *control sobre video · scrim · in-call · videollamada* | **no existe** |
| ¿`DIRECCION_ARTE.md` ganó §1-§3 nuevos? | `git log 09def031..HEAD -- docs/DIRECCION_ARTE.md` | **vacío — no se tocó en toda S106** |

**Es la tercera vez en esta sesión que el prompt afirma que algo llegó y el
objeto dice que no** (la letra «ya enmendada» en tanda 1, y ahora esto).

**Diferencia con aquella vez, y por eso NO se frena entero:** allá el repo tenía
una versión distinta que podía contradecir; **acá el repo no tiene nada, y el
prompt sí trae dirección sustantiva y numérica.** Frenar del todo perdería el
turno sin proteger ninguna letra.

⇒ **Lo que se hace:** se construye con lo que el prompt trae, **cada número
declarado con su procedencia** (prompt · skill · decisión propia), y **este
documento pasa a ser el registro de la dirección aplicada** — porque si el
documento no está, lo que se escriba acá es lo que la próxima sesión va a leer.

## 🔴 Y UN CHOQUE REAL DE NÚMEROS, que no se resuelve en silencio

El prompt pide **250 ms** (intercambio) y **200 ms** (imán, ocultar chrome).
**El vocabulario del movimiento es CERRADO y está firmado por la mesa**
(13-ago-2026, `motion.ts`):

> *«Un bezier, tres duraciones: **150 micro · 300 estándar · 520 grande**. Qué
> se anima es lista cerrada. **Nada más se mueve.**»*

| pedido | ¿existe como token? |
|---|---|
| 150 | ✅ `duration.micro` |
| 200 | ❌ **no existe** |
| 250 | ⚠️ existe como **`legacy_normal`**, marcado legado — y su propio comentario cuenta que *«una pista casi lo usa en una pieza nueva creyendo que era el estándar; la frenó un comentario, no un gate»* |

**Decisión, declarada:** se construye con **`micro` (150)** y **`estandar`
(300)**. Razón: el prompt ordena *«los tokens mandan y NINGÚN color, radio,
espaciado o tipografía se inventa»* — **una duración es lo mismo**, y el único
vocabulario firmado y depositado es el de N10.

*Si el founder ratifica 200/250, es enmienda del token y una línea: los números
no viven en las piezas.* **Se declara para que sea una firma y no un descuido.**

---

# EL RECORRIDO, EN VOZ DE USUARIO

## ① La familia, en el aviso previo (§3 + la casilla nueva)

**Qué veo primero.** Elegí veterinario y toqué reservar. Antes de cualquier otra
cosa se abre una hoja que dice **«Antes de continuar»**. No es un cartelito: me
tapa la pantalla y no puedo seguir sin leerla.

**Qué leo.** Que la videollamada sirve para orientación y seguimiento. Después,
en negrita, **que no reemplaza una atención presencial ni sirve para
emergencias**. Y después **cinco cosas concretas, una debajo de otra**:
dificultad para respirar · sangrado · convulsiones · golpe fuerte · dolor
intenso o decaimiento repentino.

> **Lo que siento:** que alguien pensó en qué me puede pasar. *No me preguntan
> si «creo que está en riesgo» —yo no sé eso, no soy veterinaria—: me dan cinco
> señales que sí puedo mirar en mi perro ahora mismo.*

**Qué toco.** Abajo hay tres caminos del mismo peso. **Ninguno está más gordo
que otro, ninguno está pintado de un color que me apure.** Y **una casilla sin
marcar** que dice que entendí.

**🔴 Lo que me confundiría, y por eso se diseñó al revés:** que la casilla
bloqueara TODO. **Si mi perro se está ahogando, la app no puede pedirme que
tilde una casilla para dejarme ir a urgencias.** Por eso **«Ir a urgencias» y
«Reservar cita presencial» andan siempre**; la casilla solo abre la tercera.

*El consentimiento se pide para lo que se consiente — no para salir corriendo.*

## ② La familia, entrando a la videollamada

**Qué veo primero.** La cara del veterinario, **a pantalla completa**. Arriba a
la derecha, un rectangulito chico con **mi propia cámara** — así sé que se me
ve, y sé cómo se me ve.

**Qué toco.** Si quiero verme grande, **toco el rectangulito y los dos se
intercambian**. Si me tapa la cara del veterinario, **lo arrastro y se pega solo
a la esquina que quiero**.

**Qué pasa cuando no toco nada.** A los cuatro segundos **los controles se
desvanecen** y me queda la cara del veterinario limpia. Toco en cualquier lado y
vuelven.

**🔴 Lo que nunca desaparece: el botón de colgar.** *Si me quiero ir, no puedo
tener que adivinar dónde tocar primero para que aparezca el botón.*

**Lo que me confundiría.** Que se escondiera todo y yo pensara que se colgó.
Por eso **el nombre y el tiempo vuelven con un toque**, y el reloj sigue
corriendo por dentro aunque no lo vea.

## ③ El tiempo

**Qué veo.** Un reloj que **sube**: 00:14, 00:15, 00:16.

**Qué siento.** Nada. **Y ese es exactamente el objetivo.**

> **🔴 Lo que sentiría si bajara:** apuro. *Y si el veterinario viera una cuenta
> regresiva, sentiría que tiene que estirar.* La letra dice que **la consulta se
> cobra aunque dure veinte segundos** — justamente para que nadie tenga
> incentivo de alargarla. **Una cuenta regresiva contradice esa letra en la
> pantalla.**

**Qué NO veo, y es decisión:** ningún punto rojo de «grabando». **No se graba**,
y un punto rojo mentiría. Tampoco el reloj es rojo: **el rojo es alarma, y acá
no pasó nada.**

## ④ Cuando la conexión se pone fea

**Qué veo.** Un puntito al lado del nombre. Verde, no lo miro. Amarillo, tampoco
mucho.

**Cuando de verdad se cae:** aparece **una banda que dice «Reconectando…»**, con
palabras.

**🔴 Por qué solo ése crece a banda:** porque *es el único que necesito
entender.* Si la imagen se congela y no me dice nada, **cuelgo pensando que se
rompió** — y perdí la consulta que pagué. Con la banda espero.

*Un estado que solo pinta un punto de color no existe para quien no distingue
colores. El que importa se dice con palabras.*

## ⑤ El veterinario, escribiendo mientras atiende

**Qué veo.** Abajo, un **asa**. La subo y aparece la ficha para escribir; el
video **se achica pero NO desaparece** — sigo viendo al animal mientras escribo.

**Qué toco.** Arrastro el asa. Se queda en tres lugares: **cerrada, a la mitad,
o casi arriba**. La suelto y se acomoda sola al más cercano.

**Qué siento.** Que responde como algo físico. **Lo que NO quiero es que rebote
como un juguete** — estoy atendiendo un animal enfermo, no jugando.

**🔴 Lo que me haría perder trabajo:** que al bajar el panel se borre lo que
escribí. **Si hay texto sin guardar, me pregunta antes.**

**Y el teclado.** Cuando escribo, el teclado sube. **El video no se mueve** — el
panel crece por dentro. *Si el video saltara cada vez que toco el campo, no
podría mirar al animal y escribir a la vez, que es exactamente lo que estoy
haciendo.*

## ⑥ Los controles sobre el video — lo que nadie nota si está bien

**Qué veo.** Botones redondos: micrófono, cámara, colgar.

**Lo que me confundiría, y es el problema que la clase resuelve:** que el
veterinario se ponga contra una pared blanca y **los botones desaparezcan**. O
que esté en una sala oscura y no se vean tampoco.

> **🔴 El fondo lo pone la cámara de otra persona. No lo elegimos, no lo
> podemos calibrar, y cambia mientras la llamada ocurre.**

Por eso cada control lleva **su propia sombra debajo**: se lee sobre una pared
blanca y sobre una sala a oscuras. **Es la misma física que la casa ya firmó
para el mapa** (`DIRECCION_ARTE` §6ter: *«a 21 px sobre fondo con textura el
trazo desaparece y solo sobrevive la silueta rellena de alto contraste»*).

**Y no se enmienda la ley del glifo**: §6ter descartó explícitamente ensanchar
la Ley 12 a «fondo no controlado» porque *«toda foto, todo gradiente y **todo
póster de video** es fondo no controlado — una regla que no puede decir dónde
termina no es una regla»*. **La letra vieja ya nombró este caso al descartarlo.
Acá se le da su nombre.**

---

# LO QUE ESTE RECORRIDO DEJA DECIDIDO ANTES DE CODIFICAR

1. **Las piezas NO importan LiveKit.** El video entra como `ReactNode`. Razón:
   `packages/ui` no depende del transporte —hoy no está en sus `peerDependencies`
   y meterlo ataría el sistema a un proveedor—, y además así las piezas se ven
   en galería sin cámara ni sala.
2. **El chrome que se esconde no esconde nunca dos cosas**: colgar y el asa.
3. **La casilla habilita UNA acción, no la hoja.**
4. **El temporizador es `Texto variante="dato"`** — mono tabular, que ya existe
   (Ley 3: el dato de máquina en mono; y tabular es lo que impide que el dígito
   baile).
5. **Un solo lugar define el «control sobre video»**, y las dos pantallas lo
   consumen. *Si cada pantalla se pinta su propio scrim, en dos meses hay dos.*

---

# ADDENDUM · LO QUE LOS GUARDS CAZARON AL CONSTRUIR

*Se anota porque es la mitad honesta del turno: cuatro clases de defecto, todas
mías, ninguna encontrada leyendo el código.*

| qué | quién lo cazó | la cura |
|---|---|---|
| **El anillo de la clase daba 2.40, no «~6.8»** — la cabecera lo tenía escrito como medido y era una **estimación en lineal en vez de sRGB** | `verify:contrast` | alpha resuelto **hacia atrás desde el piso**: 0.36 da 3.04, se toma **0.44 (4.11)** |
| **Dos hexes crudos en la galería** (`#2A2A2A`, `#3A3A3A`) | `R2` (Ley 1) | nacen `sobreVideo.extremoClaro/Oscuro` — **los extremos son la VARA de la clase, no una decoración**, y escritos a mano en cada lugar dejan de ser el mismo extremo |
| **`theme.status.warning` como FILL** en el punto de conexión | `R12` | el punto pasa a la clase: **un color de tema sobre un fondo que el tema no gobierna es una promesa que nadie cumple** |
| **Dos piezas que mueven sin mirar `useReducedMotion`** | `R41` | receta de la casa aplicada (hook suelto + `memorial \|\| reduceMotion`): **se quita el VIAJE, no el momento** |
| **Cuatro piezas exportadas y no montadas** | `R17` | las cuatro a la galería — *una pieza que nadie puede mirar no se puede firmar* |
| `estiloPresionado` sobre `View` no tipa | `tsc` de `apps/prestador` | `Animated.View`, precedente `Baldosa` |

**Ninguna la habría encontrado el recorrido de usuario, y ninguna la habrían
encontrado los guards sin el recorrido.** *El recorrido decide QUÉ construir;
los guards miden si lo construido es verdad.*
