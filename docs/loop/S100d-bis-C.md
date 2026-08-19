# S100d·bis — C — EL SEGUNDO VEREDICTO SOBRE LA VITRINA Y LA FICHA

> **Pista C · rama `pista-c` · worktree `e-petplace-s100-c`.**
> Territorio: `apps/cliente` — vitrina de Despensa y ficha de producto.
> Encargo: los puntos **④ · ⑨ (los tres) · ⑤ · ⑥** del segundo veredicto, más
> lo que la mesa fue sumando en vuelo (⑳ el tope, la puerta del local, H-205).

---

## ⓪ DÓNDE ESTÁ TODO — se verifica, no se cree

```bash
git ls-remote origin refs/heads/pista-c    # la verdad de dónde quedó C
git rev-parse HEAD                         # y que el worktree coincide
git status --porcelain                     # tiene que dar 0
```
**Verificado por BLOB contra `origin/main` al cerrar (19-ago): 14 de 14 archivos
míos idénticos.** *Un `git log` que no muestra commits afuera no prueba que el
contenido esté: lo prueba el hash del blob.*

---

## ① LO QUE QUEDÓ, PUNTO POR PUNTO — con su vara declarada

| # | qué pedía el founder | resultado | dónde se midió |
|---|---|---|---|
| **④** | *«no lo corrigió, los apiló»* · los tres ejes en scroll horizontal | 3 ejes en **tira** (Categoría 3 · animal 5 · Precio 4) · 2 **envueltos** (Marca 13 · Presentación 15) | web + **aparato** |
| **④** | *«no sé por qué pone el 3»* | el contador **murió**: 0 de 5 rótulos | web |
| **⑨** | *«no dejarla sobre fondo»* | carta blanca, radio 16, sombra de reposo · **72 → 106 dp** | web + **aparato** |
| **⑨** | la flecha ocre y más gruesa | **`rgb(252,188,29)` · 2,75 px**, y tras N26.1 **disco ocre con el chevron en tinta** | **aparato** |
| **⑨** | el chip que *«marca en verde»* | **`rgb(142,31,104)`** magenta | **aparato** |
| **⑤ ⑥** | el stepper menudo · la caja de imagen sin fondo | montados; lienzo en `rgba(0,0,0,0)` | **aparato** |
| **⑳** | *«pedí 3 y hay 1»* | stock 2 → pedí 3 → **quedó en 2 y lo dijo** · y el campo tipeable ruteado por el tope | **aparato** (vitrina) · web (ficha) |
| — | la puerta del local **sale** de la Despensa | fuera, con su enmienda en la letra | web |
| — | **H-205** | el nombre aparece **una sola vez** | **aparato** |

🔴 **LA VARA SE DECLARA EN CADA FILA A PROPÓSITO.** En la vuelta anterior reporté
*«ejercido en aparato»* sobre números de **RN-web** y me lo corrigió B. *Escribir
el límite en la cabecera del instrumento no impide olvidarlo en el reporte: el
instrumento lo lee quien construye, el reporte lo lee quien decide.*

---

## ② LAS FIRMAS DEL FOUNDER, VERBATIM

> *«no lo corrigió, los apiló. Mejoró pero no me termina de convencer»* — y lo
> específico: **CATEGORÍA, PARA QUÉ ANIMAL y PRECIO en scroll horizontal; «todo
> lo demás está perfecto»**. ⇒ Marca y Presentación envueltas quedaron
> **aprobadas**.

> *«categoría (que por cierto, no sé por qué pone el 3)»* — mató mi propio
> contador con una pregunta.

> *«no dejarla sobre fondo»* (la composición) · la flecha **«ocre, más gruesa»**.

> *«marca en verde y debe ser magenta»*, con el principio: **magenta = marca y
> SELECCIÓN · ocre = ACCIÓN.**

> *«afuera en ocre, adentro en magenta»* **= está mal** (el stepper de la ficha).

> **La puerta del local:** *«la Despensa es donde se compra online; el reclamo es
> para quien compró offline»* — y la forma: **tachada y no borrada.**

> **N26.1, sobre el ocre:** *«el ocre NO se usa como tinta sobre fondo — se usa
> como RELLENO con letra tinta encima»*.

---

## ③ 🔴 LO QUE NO SE HIZO, SIN MAQUILLAR

| qué | dueño | por qué |
|---|---|---|
| **Los contrastes contra el fondo nuevo** — chip magenta, ocre de la flecha, disco del carrito | **C / mesa** | **se midieron contra el fondo viejo.** Con el ojo sobre `#F6F6F6` los tres se leen, **pero «se lee» no es un número de contraste y no se presenta como si lo fuera** |
| **El tono `neutro` del chevron (2,40 / 2,22)** | **mesa** | hallazgo de B; mueve las dos apps. **Mi acordeón usa `accion`, así que hoy no me pega** — pero el argumento es general y en mi ficha es literal: *sin el chevron la sección no se anuncia como plegable* |
| **D-846** — 25 variantes con más de una oferta publicada | **mesa / motor** | **mi cura hace que se VEA** (el chip con su precio cuando la etiqueta repite); **no lo resuelve, no puede** |
| **D-850** — el `expanded` del lector | **B** | va junto o no va: parchearlo solo en mi anatomía dejaría dos comportamientos de lector para el mismo gesto |
| **D-851** — `RotuloPlegable` local | **B** | veredicto suyo: queda local con un solo consumidor |

---

## ④ MIS FRENOS — con lo que medí y CONTRA QUÉ

**① NO cambié la anatomía de los chips de la hoja** por `SelectorOpcion
disposicion="grilla"`, que envuelve y ya existía. **Contra qué medí:** el founder
había dicho *«modal de filtro genial»*. *Era la salida barata y cambiaba lo que él
acababa de aprobar — una regresión que ningún instrumento caza, porque lo que se
rompe es una aprobación y no un build.* Se le pidió a B el `envuelve` sobre su
propia pieza y lo sirvió.

**② NO apagué `verify:diseno` cuando me rebotó el ocre.** Ley 21 frenó
`color={theme.accent.cta}` en mi pantalla. **Había tres salidas fáciles**
—apagar la regla, subirle el baseline, teclear el hex— **y la excusa estaba
servida: lo pedía quien escribió la regla.** Pedí que la pieza resolviera su
propio acento; B construyó `tono="accion"` y el punto salió **entero**.
*Las tres fáciles dejaban el ocre correcto en la pantalla y la ley rota para
siempre.*

**③ NO plegué «descripción» ni «características».** **Contra qué medí:**
`descripcion` promedia **10,5 caracteres** (464 de 470, máximo 29, **cero sobre
60**) y «características» es **una frase de 25 car en 58 dp** contra un
encabezado plegable de ~56 ⇒ **plegarla ahorraría 2 dp** y escondería el único
bloque que ningún competidor tiene.

**④ NO puse la cuenta en el rótulo plegable** («Composición · 25»), aunque la casa
lo admite. **Contra qué medí:** el punto ⑩ es **sobre contar señales**. *Un punto
reportado cerrado que reaparece es rojo de método.* **Vuelve con una línea.**

**⑤ NO generalicé la cura del scroll.** Mi rojo probó **arbitraje** en los filtros;
D midió que **el mismo síntoma tiene otra causa** (scroller sin acotar) y B
encontró **una tercera** (anidamiento). *Aplicar mi causa a las otras dos no habría
hecho nada y habría llevado a concluir que el arbitraje no era el problema —
falso, lo era, en mi pieza.*

---

## ⑤ 🔴 MIS PROPIOS ERRORES — los cinco, con su forma

**① Reporté «ejercido en APARATO» sobre números de RN-web.** Me lo cazó B. *El
límite estaba escrito en la cabecera de mis propios scripts.*

**② Predije un fallo por escrito y después lo di por resuelto.** Dejé declarado
que el `Gesture.Pan` de la `Hoja` podía ganarle al arrastre horizontal; `envuelve`
volvió la hipótesis **inalcanzable**; y cuando el segundo veredicto devolvió tres
ejes a `tira`, **le devolví el gesto y traté la hipótesis como cerrada.**
⇒ **LO INALCANZABLE SE SIENTE IGUAL QUE LO RESUELTO.**

**③ Reporté un rojo que no existía y lo retiré.** Dije que la carta quedaba tapada
por el CTA. **Medido: termina en 686, el CTA arranca en 687 — cero solape**, y con
scroll se lee entera. *Miré una captura ESTÁTICA y concluí un comportamiento sin
ejercerlo* — **la misma advertencia que yo le había hecho a D horas antes.**

**④ Diagnostiqué H-205 en la pieza ajena.** Se lo pasé a B como *«`transparent` no
funciona en nativo»*. **Era la explicación cómoda: ponía la causa afuera.** La
mitad real era mía —dos strings del mismo dato— y **la otra mitad la probó un
string que yo ya tenía**: las mayúsculas del catálogo.

**⑤ El defecto más caro lo encontró MIRAR, no medir.** Cuatro varas verdes sobre
una ficha que decía **«Brilliant · Brilliant»**. Medido después: **106 de 470
(22,6 %)** con `descripcion` idéntica a `marca`.

### Y las CUATRO trampas de instrumento, todas mías
`«podés llevar»` (mi paráfrasis) contra el literal del diccionario · el selector
por TEXTO que envejeció cuando el control ganó su glifo · el `goto` que
**reiniciaba el carrito que iba a medir** · y el arrastre `900 → 200` que **se lo
comió el gesto de «atrás» del sistema** y habría reportado que la cura de B
falló. **Cuatro veces el aparato midió bien y yo pregunté mal.**

---

## ⑥ NÚMEROS

**Depositados por mí:** **D-850** 🟡 (el `expanded` del lector, dueño B) ·
**D-851** 🟢 (`RotuloPlegable` local con su condición de muerte, dueño B).
**Cerrados/curados de otros:** H-205 (mi mitad) · el chip verde → magenta · la
carta en las dos ramas · la puerta del local.
**Alimentados con mi medición:** **D-846** (A lo fichó con mis números).
⚠️ **Y una deuda de método propia, declarada: hasta este cierre yo había
depositado CERO números en el canon** — mis hallazgos vivían en mensajes y en
comentarios de código. *Es L-217 en mi versión: lo que vive solo en un mensaje
se pierde.*

---

## ⑦ COMPROMISOS CRUZADOS ABIERTOS

**Le debo a B:** nada pendiente.
**B me debe:** **D-850** (el `expanded`) y **D-851** (la prop de jerarquía que
mata mi anatomía local).
**Con D:** las keys `despensa.reclamoEntrada*` **ahora tienen consumidor fuera de
la Despensa** (el Hogar) ⇒ *si las toco, el texto cambia también allá.* **Dejaron
de ser solo mías.**
**Con la mesa:** los contrastes contra `#F6F6F6` y el tono `neutro` del chevron.

---

## ⑧ LA LECCIÓN DE MÉTODO — la que no es sobre mi pantalla

> ### 🔴 UNA HIPÓTESIS QUE SE VUELVE INALCANZABLE NO SE CIERRA: QUEDA DORMIDA ESPERANDO QUE SU CONDICIÓN REGRESE.

**Y su cura operativa:** *cuando una decisión revierte la condición que volvió
inalcanzable una hipótesis, la hipótesis se REABRE — no se hereda como resuelta.*

**Lo que la vuelve grande no es que yo fallara la disciplina: es que una hipótesis
inalcanzable y una resuelta producen exactamente la misma evidencia — ninguna.**

### Su hermana, cobrada tres veces en la jornada
> **UNA IMAGEN QUIETA NO DISTINGUE «ESTÁ ROTO» DE «HAY MÁS ABAJO».**

Una captura prueba **lo que se ve**; que algo **se alcance** hay que ejercerlo.
La primera vez me costó un rojo falso (la carta); la segunda **la frené yo misma**
(el título cortado que era scroll) y no la reporté. *El hallazgo que no se reporta
porque se ejerció antes vale tanto como el que sí.*

### Y la del cierre, que es de A y de B tanto como mía
**El mismo síntoma tuvo TRES causas distintas en tres pantallas** —arbitraje de
gestos · scroller sin acotar · anidamiento sin declarar—. *Es la clase de defecto
que se «cura» tres veces mal si uno se guía por cómo se ve.* **Lo que lo evitó
fueron dos frenos cruzados**: yo frené a B, D me frenó a mí.
