# LOS SEIS INSTRUMENTOS FALLADOS DEL DÍA — y el control que los habría cazado antes

> **S101-D** · 21-ago-2026 · **orden de mesa** (dictamen del relevo posterior al
> freno de la tanda). **Todos son míos**: los seis los escribí yo, en una sola
> jornada, y los seis dieron un resultado creíble y falso.
> **Se enlaza con `L-321`** (*un censo que devuelve vacío se prueba antes contra un
> caso con resultado conocido*) y **`L-329`** (*un snapshot se vuelve a tomar, no
> se edita*). **De acá salió `L-330`** — el control se DECLARA junto al número.
>
> ---
>
> ## 🔴 LA DISTINCIÓN QUE ORDENA TODO ESTE ARCHIVO *(dictamen de mesa)*
>
> ### **LOS CONTROLES CURAN INSTRUMENTOS · LAS LEYES CURAN LECTORES · LOS INVARIANTES CURAN RESULTADOS PLAUSIBLES.**
>
> **No son intercambiables**, y los seis casos de abajo lo prueban repartiéndose
> en las tres columnas:
>
> | remedio | qué defecto cura | casos de este archivo |
> |---|---|---|
> | **control positivo** | el instrumento **que calla** — ceros y verdes falsos | ① `\b` ASCII · ② bytecode Hermes · ④ `$REPOS` de zsh · ⑥ la columna equivocada |
> | **invariante de salida** | el **resultado plausible** — no hay cero ni verde, hay un número que se ve bien | ③ `Math.round` deformando cinco marcas |
> | **ley** | el **lector distraído** — el instrumento dijo la verdad y se leyó mal | ⑤ el exit del pipe (`L-191` **ya existía**) |
>
> ⚠️ **Y por eso la distinción no es taxonomía: elegir el remedio equivocado deja
> el defecto vivo con cara de atendido.** *A `Math.round` se le puede correr
> control positivo todo el día y nunca va a fallar — porque no está callando.*

---

## ⓪ · EL PATRÓN, antes que los casos

> ### 🔴 **CINCO DE LOS SEIS FUERON UN VERDE O UN CERO FALSO.**
> **El modo dominante no es el instrumento que grita: es el que CALLA.**

Un instrumento roto que explota se arregla en el minuto uno — el rojo se ve. El
que devuelve **0**, o **verde**, entrega un resultado con la forma exacta de una
buena noticia: *«no hay voseo» · «no hay consumidores» · «el permiso está bien» ·
«no hay citas rotas»*. **Y una buena noticia no se audita.**

De ahí la única regla que los cubre a los seis:

> ### ***Un cero sin control positivo no es evidencia de ausencia: es una medición sin probar.***

**Los seis se habrían cazado con el mismo gesto y antes de reportar:** correr el
instrumento contra **un caso cuya respuesta se conoce y NO es cero**. Cuesta una
línea. Cinco de estas seis costaron entre una corrida y un reporte equivocado ya
entregado.

⚠️ **Y el que rompe el patrón es el más incómodo:** el ⑤ **no calló — habló, y yo
leí mal lo que dijo.** Ningún control positivo lo hubiera atajado; lo atajaba
leer el exit del comando y no el del pipe, que **ya era ley escrita** (`L-191`).
*Un instrumento correcto con un lector distraído produce el mismo daño que uno
roto.*

---

## ① · `\b` es ASCII en JavaScript — el censo de voseo

| | |
|---|---|
| **Qué medía** | cuántas cadenas en voseo quedaban vivas en `apps/cliente/src/i18n/es.ts` (`D-857`) |
| **Por qué su resultado era creíble** | devolvió **5**. La ficha decía «quedaron 17, curamos 7» ⇒ **un resto chico era exactamente lo esperado**. El número no contradecía nada |
| **Qué lo cazó** | un **barrido de recall independiente** —toda palabra terminada en á/é/í dentro de comillas— que devolvió `Probá`×7 · `Elegí`×6 · `Ingresá`×2 **contra un instrumento que reportaba 0 de esas formas** |
| **Qué control lo habría cazado antes** | buscar **una forma que yo sabía que estaba** (`Probá`) **antes** de confiar en el conteo. Estaba a un `grep` de distancia |

**El defecto real:** `\b` está definido sobre el alfabeto ASCII ⇒ después de una
vocal acentuada **no hay frontera de palabra**, y `\b(probá)\b` **nunca** matchea.
**Todo imperativo voseo —que por definición termina en á/é/í— era invisible.**
Pasaban solo las formas terminadas en `s`. **5 reportadas contra 34 reales.**

---

## ② · `grep` sobre bytecode Hermes — ¿compiló el transformer de SVG?

| | |
|---|---|
| **Qué medía** | si `react-native-svg-transformer` había compilado los cinco logos **a componente** o los había dejado como asset |
| **Por qué su resultado era creíble** | 0 coincidencias del path de Visa en el bundle. Y había una **hipótesis lista que lo explicaba**: «el transformer no corrió». *Un cero que confirma la sospecha que uno ya traía es el más difícil de dudar* |
| **Qué lo cazó** | el **control positivo**: busqué `DINERS` y una voz que acababa de escribir — **también daban 0** ⇒ el problema era el instrumento, no el build |
| **Qué control lo habría cazado antes** | el mismo control, **corrido primero**. La regla no es «dudá del cero», es **«probá el instrumento antes de interpretar cualquier resultado»** |

**El defecto real:** el bundle es **bytecode Hermes** y no guarda sus strings en
forma greppable. Con bundle de texto plano y controles ASCII, la evidencia
positiva apareció entera (`17.35h-4.525` · `011340` · **`fillRule`×4**).
**Casi reporto un defecto que no existía.**

---

## ③ · `Math.round` en las dos dimensiones — el aspecto de los logos

| | |
|---|---|
| **Qué medía** | *(no medía: producía)* el tamaño de cada logo dentro de la caja 56×32 |
| **Por qué su resultado era creíble** | redondear píxeles es práctica estándar, los cinco **entraban** en la caja, y a simple vista el resultado era correcto |
| **Qué lo cazó** | **calcular el aspecto antes y después** y compararlos: desvío de hasta **0,032** en Visa (3,111 → 3,143) |
| **Qué control lo habría cazado antes** | un **invariante**, no un ojo: *el aspecto de salida debe ser idéntico al del `viewBox`*. Es una resta |

**El defecto real:** redondear **las dos dimensiones por separado** deforma.
🔴 **Y es el único de los seis que ningún control positivo alcanza**, porque **no
había cero ni verde**: había un resultado plausible. *Un logo de marca registrada
torcido no da error — se ve «casi bien», que es justo el criterio que el paso 2
del gate existe para juzgar.* Habría llegado al gate a que el ojo del founder
cazara algo que una cuenta ya decía.

---

## ④ · `$REPOS` en zsh — el censo de los cinco repos

| | |
|---|---|
| **Qué medía** | consumidores de `v_ranking_usuarios` fuera del monorepo (`D-860`, freno de `L-215`) |
| **Por qué su resultado era creíble** | **cero en los cinco** — y el censo del monorepo también había dado cero ⇒ **el resultado confirmaba la expectativa**, y encima habría **desbloqueado** la cura. *Un cero que te deja avanzar es el que menos ganas dan de auditar* |
| **Qué lo cazó** | el **control positivo** con `seller_comisiones`, que S102-B había medido como consumida por el admin: dio **0 en los cinco** ⇒ imposible |
| **Qué control lo habría cazado antes** | el mismo, **antes del censo real**. Fue lo que hice; **el mérito es del orden, no de la sagacidad** |

**El defecto real:** **zsh no divide una variable en palabras por default** ⇒
`for r in $REPOS` iteró **una sola vez** sobre la cadena entera, y `grep` buscó en
una ruta inexistente **devolviendo cero sin fallar**.
*Un cero que sale de una ruta que no existe se ve idéntico a un cero de haber
buscado bien.* **Sin ese control, el veredicto habría sido «cero consumidores,
apliquen» — y hay DOS lecturas reales en el admin.**

---

## ⑤ · El exit del pipe — el guard de manifest de la APK

| | |
|---|---|
| **Qué medía** | si la build de desarrollo podía distribuirse (`D-574`) |
| **Por qué su resultado era creíble** | `echo $?` **es** la forma canónica de leer un exit code. Dio **0** |
| **Qué lo cazó** | que el guard **había impreso `ROJO — LA BUILD NO SE DISTRIBUYE`** dos líneas arriba: **la salida contradecía al código** |
| **Qué control lo habría cazado antes** | **`L-191`, que ya estaba escrita**: el exit se lee del comando, jamás del pipe. Re-medido sin pipe: **1** |

🔴 **Éste no calla: grita, y yo leí el número equivocado.** *Casi declaro verde un
guard que estaba en rojo — en el turno en que ese guard estaba salvando la sesión
de instalar una APK sin `geo.API_KEY`, que es el crash que en S80 estuvo invisible
tres sesiones.* **Es el único de los seis que no es un instrumento roto sino un
lector roto, y por eso es el más barato de repetir.**

---

## ⑥ · La columna equivocada — las 8 citas incobrables

| | |
|---|---|
| **Qué medía** | citas `pendiente_pago` sin `cita_desglose` (hoy `D-864`) |
| **Por qué su resultado era creíble** | **0**, y `estado` es el nombre obvio de la columna. *Y cero es una respuesta perfectamente legítima para esa pregunta* |
| **Qué lo cazó** | **leer el enum en vez de suponerlo**: los valores de `estado` son `confirmada`·`completada`·`pendiente`·`cancelada`·`no_show`·`en_curso` — **`pendiente_pago` no está**. El estado de pago vive en **otra columna, `estado_reserva`** |
| **Qué control lo habría cazado antes** | consultar **un valor de estado con conteo conocido y no nulo** antes de confiar en el cero. O simplemente **listar el enum**, que es lo que terminó pasando |

**El defecto real:** filtré por un valor que **no existe en esa columna**. Un
filtro imposible devuelve cero legítimamente.
⚠️ **Y su consecuencia era peor que un número:** me iba a llevar a **contradecir
un hallazgo correcto del founder** con un cero. *La medición equivocada no solo se
equivoca: contradice a quien midió bien.*

---

## §1bis · 🔴 ADDENDUM DEL MISMO DÍA — **EL ⑥ SE REPITIÓ DESPUÉS DE ESTAR ESCRITO**

> **Se agrega y no se reescribe el cuerpo:** los seis de arriba son los que la
> mesa pidió y quedan como están. Esto es evidencia **sobre este archivo**, y por
> eso vale más acá que en la bitácora.

Horas después de escribir el ⑥ —*«filtré por un valor que no existe en esa
columna»*—, preparando el terreno del gate, **encadené tres adivinanzas de la
misma familia**:

| lo que supuse | lo que era | cómo se cazó |
|---|---|---|
| `familia_miembros` | **`familia_miembro`** (singular) | chocó: `42P01` |
| `medios_pago` | **`tarjetas_guardadas`** | chocó: `42P01` |
| `estado_vida = 'vivo'` | **`'activa'`** — 75 filas, todas | **no chocó: devolvió 0 en las 37 cuentas** |

**Las dos primeras son baratas: un nombre que no existe rebota con error.** *Un
instrumento que grita se arregla en el minuto uno.* **La tercera es la cara del
⑥ y es la cara cara:** un valor inexistente dentro de una columna que sí existe
**no rebota — filtra a cero**, y un cero tiene la forma exacta de un dato.

### 🔴 LO QUE ESTO PRUEBA, Y ES INCÓMODO

> ### **Haber escrito la lección NO evitó la repetición. La evitó el control.**

El cero salió **universal** —las 37 cuentas en 0, incluida una que otra pista ya
había medido con 6— y *esa universalidad* fue la señal, no mi memoria del ⑥. **Es
exactamente la distinción que la mesa puso en la cabecera de este archivo,
cobrándose sobre su propio autor el mismo día:** *los controles curan
instrumentos, las leyes curan lectores* — **y acá el lector era yo, con la ley
recién escrita, y falló igual.**

### ✅ Y LA MEJOR VALIDACIÓN DEL DÍA SALIÓ GRATIS

La corrección la disparó tener **una medición ajena e independiente** (S102-B, en
otro árbol, con otra consulta) que decía **6 mascotas · 7 tarjetas**. Con los
nombres medidos, mis números dieron **6 y 7**.

> ***Dos instrumentos distintos, dos manos distintas, el mismo objeto: es el
> control positivo más fuerte que tuvimos hoy — y no lo diseñó nadie, salió de
> que la otra pista hubiera medido antes y lo hubiera dicho con números.***

**Corolario práctico, y es el que conviene llevarse:** cuando otra pista publica
un número, **cotejarlo no es cortesía — es un control positivo gratis**. Y
cuando el propio resultado *no* coincide con él, **el orden correcto es sospechar
del instrumento antes que del dato ajeno.**

---

## §2 · LO QUE ESTE RELEVAMIENTO **NO** HACE

- **No funda una lección.** *(Ver §3 — se propone, no se deposita.)*
- **No revisa los instrumentos que salieron bien.** Los seis de acá son los que
  fallaron y se cazaron; **cuántos fallaron y NO se cazaron es, por definición,
  no medido.** *Que este archivo tenga seis no significa que fueran seis.*
- **No pretende que el patrón sea general.** Son seis casos de un día, de una
  sola mano. *Un patrón sobre seis puntos es una hipótesis con forma de ley.*

---

## §3 · ✅ **FUNDADA COMO `L-330`** *(la mesa la firmó el mismo día — el texto de abajo es su propuesta original, conservado)*

> ### **EL CONTROL POSITIVO VIAJA CON EL NÚMERO, NO CON LA CONFIANZA DE QUIEN LO CORRIÓ.**
>
> `L-321` ya ordena probar el instrumento contra un caso conocido cuando el censo
> devuelve vacío. **Lo que estos seis agregan es de REPORTE, no de método:** en
> los seis casos yo *sabía* que había que probar el instrumento — y en cuatro lo
> hice **después** de tener el número, no antes; en dos estuve a punto de
> reportar sin hacerlo.
>
> ⇒ **Propuesta: todo censo que se reporte declara, junto a su resultado, el
> control positivo que corrió y qué devolvió.** No como disciplina personal sino
> como **campo del reporte** — *una medición sin su control es media medición, y
> hoy la otra mitad depende de que quien la corrió se acuerde.*
>
> **Su costo:** una línea por censo. **Su prueba:** de los seis de arriba,
> **cuatro se cazaron con exactamente ese gesto**; el ③ necesitaba un invariante
> y el ⑤ no era el instrumento sino su lectura — **la propuesta no los cubre, y
> se dice.**

**Enlaza con:** `L-321` · `L-329` · `L-191` (el ⑤) · `L-192` (*una verificación
cuyo modo de falla es el silencio no es una verificación*).
