# S109-D · TRASPASO — lo entregado, lo abierto y lo que NUNCA CORRIÓ

*Escrito por la pista D. Se lee ANTES de tocar guardería, mapas o la cara de una
mascota. Rama `pista/s109-d` en `main` (`c203c8f3`), verificada por ancestría.*

---

## ① LO ENTREGADO

| # | qué | commit |
|---|---|---|
| 1 | **La guardería entra a ATENDER** — `obtenerOficiosNegocio` la tiraba con un `continue` sobre `categoria='hospedaje'`; `OficioChip` pasa de 4 a 5 | (S109-D, tanda 1) |
| 2 | **La quinta pata del HOY** — las estadías entran a la jornada, **agrupadas arriba como bloque de presencia** | `1f26ca39` |
| 3 | **El pliegue** — la quinta pata se sumó al `Promise.all` con `obtenerEstadiasPorRango`; murió su efecto propio | `ab833f2b` |
| 4 | **`verify:jornada-completa`** — el censo del oficio faltante, con control mutante | `521c54a2` + `ab833f2b` |
| 5 | **`verify:voz-por-tipo`** — todo tipo que la familia ve tiene voz y glifo, universo por DATO | (S109-D, tanda de voz) |
| 6 | **Los mapas cerrados** — guards con voz en 5 superficies + el que faltaba en «Cómo te ven» | (S109-D, tanda de mapas) |
| 7 | **La vitrina de guardería sangra hasta el techo** — era un `Encabezado` sobre una ficha `aSangre` | `b929f2d5` |
| 8 | **El aviso del durante gana su condición de muerte** + el apoyo dice qué SÍ se puede | `449ca9aa` · `b722d858` |
| 9 | **La cara de la mascota sin foto** — dos superficies suben al genérico de su especie | `a6a08623` |
| 10 | **`MapaPunto`** — pieza nueva; el «A dónde ir» deja de sacar de la app, en los TRES oficios | `25d26cf3` |

---

## ② LAS LECCIONES, con su número

- **`L-456`** — *un mapa cerrado no falla: OMITE, y una omisión no tiene síntoma.*
  Tres veces el mismo día por tres mecanismos distintos. Trae adentro **el
  discriminador del founder**, que vale más que la cura: *dos lecturas del mismo
  día que no cierran —el header con $12 y la lista diciendo «no tienes citas»—
  localizan un mapa cerrado sin acceso al código.*
- **`L-457`** — *un gate por texto que no quita los comentarios lee una lápida
  como prueba de vida.* **Aplica a todo gate por texto de la casa**: la
  disciplina de escribir lápidas que nombran al muerto es buena y es justo la que
  alimenta el falso verde. Con su tercera parte: **un control positivo que muta
  DE MÁS absuelve al instrumento en el único caso que importa.**
- **`L-458`** — *`aSangre` y una barra fija arriba son excluyentes por
  construcción, y pedir las dos no falla: deja una franja* — que se lee como
  diseño, no como defecto.
- **`L-460`** *(nació `L-459`, chocó con la de A del mismo día; corrida y
  confirmada por A)* — *una prop que se acepta y se ignora se lee como cableado.*
  Es `L-451` un piso más adentro: un import no es un uso, **y una prop tampoco**.

**Y el método que A tomó para el canon:** la numeración se cuenta **por
encabezado**, jamás por texto suelto — `L-714` aparece **seis veces** en
`DEUDAS_CANONICAS.md` y es prosa sobre el typo histórico de `D-714`. *Un número
no está tomado porque alguien lo mencione: está tomado si tiene encabezado.*

---

## ③ LO ABIERTO, CON DUEÑO Y DISPARO

| qué | dueño | disparo |
|---|---|---|
| **El peldaño de la raza** — `raza_ruta_imagen` en los tres lectores + `especie` en el del mostrador. 111 imágenes sembradas hoy inalcanzables; `mostrador/autorizar` **no llega ni al genérico** | **A** (tomado) | al publicarse, las tres superficies suben del ② al ① sin tocar pantalla |
| **La proyección de guardería con forma de cita** — lo único que destraba `historico.tsx`, la última deuda del gate | **A** (tomado) | cuando exista: el histórico es UNA línea y la deuda sale sola |
| ✅ **`MapaZona` afirmaba una salvaguarda que su código no tenía** — **CERRADO por B** (`pista/s109-b` `5ca3882f`): eligió **el nombre**, `zonaLat`/`zonaLon`. 🔑 Y midió lo que lo volvió barato: **`FichaPrestador` ya hablaba ese idioma desde S84 y lo traducía al llamar** ⇒ el rename no impuso vocabulario, *le devolvió a la pieza el que su consumidor ya usaba*. Dos sitios, no un barrido | **B** ✅ | — |
| 🟡 **EL RIESGO ESPEJO, declarado y NO cerrado** — el rename cierra pasarle la coordenada exacta a la zona (hoy es error de tipo). **La dirección inversa sigue abierta: nada impide pasarle a `MapaPunto` un centro DESPLAZADO** ⇒ *un punto de aspecto exacto sobre una coordenada deliberadamente imprecisa* — la promesa que `MapaZona` existe para no hacer, hecha por la pieza de al lado. **No se cierra hoy a propósito**: `MapaPunto` tiene UN consumidor y su dato es inequívoco, así que un guard sería una defensa sin caso — *y un guard sin caso no es gratis: es una defensa que nadie puede probar y que la próxima sesión ablanda porque estorba* (B). ✅ **Y NO vive sólo acá: B lo escribió en el header de `MapaPunto`, sobre la prop `lat`** (`pista/s109-b` `47a4f002`) — verificado contra el objeto: **27 líneas de comentario, cero de código**. *Una condición escrita lejos del código que la cumple es una condición que nadie va a leer el día que se cumpla* | **B** (la pieza es de `packages/ui`) | **su SEGUNDO consumidor** — el candidato con nombre es *la vitrina de la familia queriendo mostrar «más o menos por acá» con un punto*; **quien llegue va a estar mirando ese bloque** |
| **El DURANTE de guardería** — objetivo de **S110**, no se empezó | **S110** | ver §④ |

**El durante, medido y no supuesto:** las 95 estadías vivas están **todas en
`reservada`**, con `a_bordo_en`/`llegada_en`/`entregada_en` en **cero**; el CHECK
declara **siete** estados y **seis son inalcanzables** — ninguna función escribe
la transición. Las tres piezas que faltan, en orden: **(1)** el escritor de
transición, que no existe · **(2)** la puerta del acta del lado del prestador
—el motor está y mis libs de S107 también, y **ninguna pantalla las importa**:
motor sin puerta (`L-318`)— · **(3)** el wrapper de tramo (`abrir`/`cerrar`), dos
RPC vivas sin puerta.

---

## ④ 🔴 LO QUE ESTÁ CORRECTO Y NUNCA CORRIÓ

*Se declara aparte de «lo que falta» a propósito: **lo no construido se sabe; lo
construido y no ejercido se lee como hecho.** Nada de esta sesión se vio en un
aparato — **no se publicó OTA ni se lanzó build**, por firma del founder.*

- **La quinta pata en el HOY** — el bloque de presencia **jamás se vio en un
  teléfono**. Lo que sí está medido es que su filtro **carga peso real**: las 95
  estadías se reparten en **23 días distintos** (31-ago → 29-sep), así que sin
  `estadiasHoy` el bloque habría mostrado a los animales de toda la ventana como
  si estuvieran hoy. *La corrección es load-bearing sobre datos vivos y aun así
  nadie la vio funcionar.*
- **El rebote de la quinta pata** (`!rEst.ok` ⇒ pantalla en error, Ley 13) —
  **cero veces ejercido**. Es el brazo que impide que un fallo de lectura se
  disfrace de «no hay nadie a bordo», y sólo corre cuando el lector falla.
- **`MapaPunto`** — **nunca renderizada en un aparato**. Y su modo más probable
  hoy es el **otro**: los binarios de prueba del founder **no tienen mapas**, así
  que en su teléfono el guard cae y la sección se ve **exactamente como antes**.
  ⚠️ *Ver la sección igual que ayer NO prueba que la pieza esté mal: prueba que el
  guard funciona.* Quien la gatee tiene que hacerlo en un binario **con
  `geo.API_KEY`**, o no está midiendo la pieza.
- **El brazo `MAPA_NATIVO_DISPONIBLE === false`** — nunca se ejerció **a
  propósito**; es la caída al estado anterior completo, no un degradado.
- **La cara por escalera** — las dos superficies curadas **no se vieron**. Y
  `mostrador/autorizar` **sigue mostrando la huella**, correctamente, hasta que su
  lector traiga `especie`.
- **La rama ROJA de `verify:jornada-completa`** — probada **sintéticamente**
  (desarmando la deuda conocida dio exit 1) y **jamás disparada por una regresión
  real**. Su rama de **deuda curada que sigue listada** tampoco corrió nunca.
- **`verify:voz-por-tipo`** — baseline **0** desde su cura; **no cazó todavía
  ningún caso nuevo**. *Un baseline en 0 no dice «no hay»: dice «no vi, con la
  lista de hoy»* (`L-425`).
- **La condición de muerte del aviso del durante** — escrita, correcta, y **por
  definición sin ejercer**: muere cuando exista un escritor de estado con puerta.
- **Los dos `Encabezado` de carga y error de la vitrina de guardería** — se
  conservaron **sin verlos**; el gate del founder pasó por la vitrina cargada.
- **`MapaPunto.web`** — existe para que la galería no rompa; **nadie abrió la
  galería en esta sesión**.

---

## ⑤ 🔴 LAS BUILDS 1.0.7 EXISTEN Y **NO LLEVAN NADA DE ESTA SESIÓN** — medido

**Las dos apps tienen 1.0.7 `FINISHED` en EAS** (`build:list`, corrido desde
`apps/<app>/`):

| app | build | ancla | hora |
|---|---|---|---|
| prestador | `6e361277` | **`28daa703`** | 01-sep 02:34 |
| cliente | `b6e7d77e` | **`28daa703`** | 01-sep 02:34 |

⚠️ **Hay un par ANTERIOR, también `1.0.7 FINISHED`, ancla `8b5def5c` (~01:20): son
las que salieron con la key MUERTA** —autorizadas con información vieja, antes de
actualizar el secret—. *Dos builds con el mismo número de versión y distinto
comportamiento de mapas: quien instale «la 1.0.7» sin mirar el ancla puede estar
instalando la que no tiene mapas.* **Las buenas son las de `28daa703`.**

🔴 **Y LO QUE NADIE MIDIÓ HASTA ACÁ: el ancla `28daa703` es de las 21:06 y NINGUNO
de los ocho commits de S109-D está adentro.** Verificado uno por uno con
`merge-base --is-ancestor`: la quinta pata, el pliegue, el censo, la vitrina, la
condición de muerte, la voz del apoyo, la cara por escalera y `MapaPunto` — **los
ocho quedaron afuera**.

> **Esas APK llevan la cura de la KEY, no las curas del DÍA.** Un gate sobre
> ellas mediría el binario correcto y el código de ayer — *la forma exacta de
> `L-138`, y esta vez con dos builds del mismo número para elegir mal.*

**El camino para que lleguen, y es una sola cosa:** un **OTA contra runtime
1.0.7**. Con `runtimeVersion: appVersion` las 1.0.7 lo reciben; el runtime ya no
es un obstáculo —lo era cuando el teléfono estaba en 1.0.6—. **No se publicó por
firma del founder** (*«sin OTA hasta que las builds estén instaladas y
verificadas»*), y esa firma sigue en pie: **es de él, no de la pista.**

---

## ⑥ OPERATIVO

`main` `c203c8f3` · rama `pista/s109-d` **ancestro de main, verificado por
`merge-base`** · typechecks **ui · api · prestador · cliente** verdes ·
`verify:diseno` **62 reglas** · `verify:jornada-completa` verde con **control
mutante rojo** · `verify:voz-por-tipo` verde · **`76(d)` declarado** (aditivo
puro en `packages/ui`: `MapaPunto` + `.web` + index + galería, cero pieza
existente modificada) · **cero OTA, cero build, cero migración, cero toque al
arco de pagos.**
