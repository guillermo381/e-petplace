# S100d · RESUMEN DE PUBLICACIÓN — el objeto del gate

> **Escrito por la mano publicadora (pista A) ANTES de disparar las OTA.**
> Su trabajo es que el founder sepa **qué está mirando** y **cuáles de los 22
> puntos vivos están en este bundle y cuáles no** — antes de tocar, no después.
>
> 🔴 **Ningún punto de acá se declara CERRADO.** Todos dicen «construido» y
> esperan el ojo. *Un punto reportado cerrado que reaparece en el próximo gate
> es rojo de método, no de pieza* (regla de cierre de S100d).

---

## ⓪ EL OBJETO — con su comando, porque los números decaen

| | |
|---|---|
| commit del bundle | **el ancla se lee DEL OBJETO**: `cd apps/<app> && npx eas-cli update:view <updateId> --json` → `gitCommitHash` |
| ⚠️ | `update:view` **NO acepta `--non-interactive`** y **devuelve una LISTA** (una fila por plataforma). `update:list --json` **no expone el hash** |
| runtime cliente | **1.0.3** |
| runtime prestador | **1.0.5** |
| ⚠️ D-786 | un runtime equivocado **no da error**: el OTA no llega, el pie sigue diciendo el update viejo y el recorrido entero se hace sobre el bundle anterior creyendo que es el nuevo |

**Verificación del ensamble, corrida SOBRE EL ENSAMBLADO y no sobre ninguna
rama** — *cada pista compila contra el `packages/ui` de SU worktree, y esta
vuelta `packages/ui` cambió debajo de las cuatro ⇒ ningún verde de pista es
verde del conjunto*:

    packages/ui · packages/api · apps/cliente · apps/prestador → 4 typechecks exit 0
    verify:diseno                                              → VERDE · 46 reglas
    tope de compra 10/10 (rojo producido 8/10) · disponibilidad 18/18 · destinos 12/12
    árbol al bundlear                                          → 0, SIN asterisco

**Orden de ensamble, declarado:** **B → D → A → C**. B primero porque las otras
tres **consumen** sus piezas (la gota, `CarritoFlotante`, `FichaRepartidor`,
`Salida`, el stepper). D antes que A porque D solo monta piezas de B, y A además
toca `packages/api`, que D consume. C última porque monta el flotante de B sobre
su propia vitrina.

---

## ① QUÉ CAMBIA VISUALMENTE, CON SU NÚMERO DE GATE

*El founder gatea contra los 22 vivos del documento del gate. Esta tabla dice
cuáles están en este bundle.*

### Pista B — las piezas

| # | qué mirar | señal de verificación |
|---|---|---|
| **5** | el escalón del control: al dar el `+`, en el MISMO renglón quedan `−` · unidades · `+` | los tres botones enteros |
| **6** | **el `+` en OCRE** (F-OCRE) | el `+` deja de ser magenta |
| **7** | 🔴 **no era un salto: era un RECORTE, y además NO SE PODÍA USAR.** El stepper salía a **18,1 dp de sus 36**, tijado por `overflow:'hidden'` — y tocarlo **abría la ficha del producto en vez de cambiar la cantidad**: el toque atravesaba el control y lo recibía la tarjeta. *Una vez que agregabas desde la grilla, no podías corregir la cantidad desde la grilla: cada intento te sacaba de la vitrina.* | 🔴 **DOBLE, y la segunda es la que vale: el stepper mide 36 y no 18 · Y el `−` RESTA en vez de abrir la ficha.** *La primera se puede confundir con un «se ve mejor». La segunda no: o cambia el número, o no cambia.* |
| **8 · 9** | el carrito flotante abajo a la derecha, y **la canasta sale del techo** | vacío 0 puertas · con 1 unidad 1 puerta, 56×56 |
| **12** | al agregar **abre el flotante**, no un CTA de «ver carrito» | — |
| **13** | eliminar **con animación** | — |
| **15** | la donación como **chip/toggle**, no botón | — |
| **16 · 26** | 🔴 **LA GOTA tipo Uber** reemplaza al punto | la punta señala; el disco no |

### Pista C — la vitrina y la ficha

| # | qué mirar | número medido |
|---|---|---|
| **2** | «Tus pedidos» **fuera** de Despensa · buscador y «Filtrar» **en el mismo escalón** · el label «Despensa» **se pinta** | el label pasó de **0×0** a **257×42** |
| **3** | el espacio muerto entre header y chips | **78 → 32 dp** (y de esos 32, **cero son de C**: 20 del `Encabezado`, 12 para que la pata no se corte) |
| **4** | la hoja de filtros con scroll horizontal | **46 chips, 0 fuera del ancho** |
| **10 · 11** | la ficha se pliega con **UNA señal** (chevron; murió el «Ver 19 más») | ficha **704 → 562 dp** |
| **⚠️ 11** | **descripción y características NO se plegaron, y está bien** | `descripcion` promedia **10,5 caracteres** (máx 29, **cero sobre 60**) ⇒ *un «más» sobre 10 caracteres esconde nada y agrega un toque*. Lo único con cuerpo era la composición, y esa **sí** se plegó |
| — | **«Brilliant · Brilliant»** — la línea repetía la marca | marca y `descripcion` son el mismo dato en **106 de 470 vendibles (22,6 %)**. Cura **de pantalla**; el dato no se toca |

### Pista D — pedidos y el camino

| # | qué mirar |
|---|---|
| **23** | la gota en el 4.º nodo de la escalera, en «Seguir el pedido», en el rótulo de la dirección — **y la dirección DICHA en EN CAMINO** (antes se dibujaba y no se decía) |
| **24①** | `mirada="espectador"` + recentrado con `aireInferior` **medido**, no tecleado |
| **24②** | la ficha del repartidor **sale al arrastrar** — subió a lo primero que la hoja revela |
| **24③** | el código en **carta hundida**, su título en `seccion`, y **la señal de arrastre dibujada** (antes vivía solo en un `accessibilityLabel`) |
| **24④** | la hoja va `bg.card` — **con el token, no con un `#FFFFFF`** |
| **25** | **la ficha del repartidor**, que «no estaba» |
| **30** | ✅ **el único ya verificado en aparato**: los pedidos en vuelo en el Hogar, primera fila de «Ponte al día» |

### Pista A — el checkout

| # | qué mirar |
|---|---|
| **17** | **LA FICHA DE ENTREGA**: los cuatro grupos rotulados (a dónde · quién recibe · instrucciones · cuándo) pasan a vivir sobre **UNA carta**. Y el glifo de ubicación **sin huella dentro** |
| **20** | el tope de compra **en las TRES puertas** (ficha · carrito · vitrina): subir por encima del stock **lo dice en la puerta**, jamás en la caja. **Ejercido EN RN-WEB por C** (⚠️ **no en el teléfono** — ver §④) sobre producto real: `Advantage Perros 10-25 kg`, **stock 2**, `hay_stock = true` (*el caso exacto del founder: el booleano dice «sí se puede comprar» y no puede decir «no alcanza para 3»*): pedir 2 → queda 2 sin voz · pedir 3 → **queda 2 y lo dice** · bajar → sin consulta |
| **28** | el alias de dirección **es alcanzable**: con UNA sola dirección ahora se puede agregar otra |

---

## ② 🔴 TRES COSAS QUE **NO** SON REGRESIONES — leerlas antes de mirar

**① El conteo del Hogar baja de 13 a 12, y la lista pierde CUATRO tarjetas.**
Es **la cura de una fuga viva entre personas reales**, no un defecto. Bajo «Tus
pedidos» aparecían pedidos de tres cuentas ajenas —una de una persona real, no
una cuenta de prueba—. ⚠️ **Si el conteo NO baja, el problema es el ancla y no
el código**: se mira eso primero.

**② Entre las cuatro tarjetas que desaparecen hay una sin miniatura, titulada
por fecha** («Pedido del 15 de agosto»). Era uno de los pocos ejemplares vivos
del fallback de la lista ⇒ **se va con la fuga**. No es que se rompieran las
miniaturas.

**③ El punto 11 no plegó descripción ni características** — con su número
arriba. No es un punto a medias: es lo que el founder autorizó, medido.

---

## ③ LO QUE **NO** ESTÁ EN ESTE BUNDLE, SIN MAQUILLAR

| qué | por qué |
|---|---|
| **`security_invoker` en `v_pedidos_narrativa`** | **pedido a la mesa, NO firmado.** En este bundle viaja **solo el tapón** (el filtro del wrapper) ⇒ **la vista sigue abierta para cualquier consumidor NUEVO** |
| **Las SEIS vistas del admin** (`v_pitch_metrics`, `v_mrr`, `v_gmv_mensual`, `v_metricas_tiempo_real`, `v_crecimiento_usuarios`, `v_ranking_usuarios`) | congeladas **a propósito**: cerrarlas deja el tablero del founder en blanco **con certeza**. Decisión con fecha |
| **La cura estructural de `consentimientos`** | la firma era condicional y **su condición falló** (hay un escritor que inserta con `user_id` **sin sesión**). Pide turno propio: toca `e-petplace-v2` |
| **La predicción falsable de `PinMovible`** | escrita y **no corrida**: con dirección que YA tiene punto, elegir una predicción lejana NO debe mover el mapa; sin punto, sí. **Si las dos se comportan igual, el mecanismo está mal y se vuelve a empezar** |
| **`zoomControlEnabled`** | la cura del pinch es correcta bajo las dos lecturas. **Si al verificar los botones +/− tampoco aparecen, hay un SEGUNDO defecto y no es éste** |
| **Oscuro y memorial** | no medidos por ninguna pista, en toda la vuelta |

---

## ④ LO QUE UN INSTRUMENTO DE ESTA VUELTA **NO** PUEDE DECIR

- **`verify:diseno` mide FORMA y el typecheck mide TIPOS.** Ninguno mide
  jerarquía visual, y ninguno mide si algo **se entiende**.
- **Cuatro varas verdes no son cobertura.** C corrió cuatro mediciones sobre la
  ficha y las cuatro dieron verde; **el «Brilliant · Brilliant» lo encontró
  mirar la captura**, porque ninguna vara preguntaba *«¿estos dos campos dicen
  lo mismo?»*. *Lo que la vara no pregunta, la vara no lo contesta.*
- 🔴 **Y un instrumento fabricó el defecto que venía a descartar.** El detector
  de C buscaba la voz por *«podés llevar»* —**su paráfrasis**— y el diccionario
  dice *«De este producto podemos entregarte N ahora»*. Con esa regex el reporte
  decía **«(sin voz)»** en el caso acotado, o sea *«la app no le dijo nada a la
  familia»*: **exactamente el defecto que el aparato venía a descartar.** *Un
  instrumento que busca lo que uno RECUERDA del texto, y no el texto, produce el
  rojo que uno temía.* Lo cazó C y lo curó buscando el literal.

### 🔴 DÓNDE SE VERIFICÓ CADA COSA — y por qué la palabra importa

**«Aparato» en esta casa significa EL TELÉFONO del founder. Solo B lo tiene
enchufado.** Todo lo demás es **RN-web** (`:8095`, vara 384×832, cuenta `+8`),
que sirve para **comparar un antes con un después** y **jamás para declarar cómo
se ve en el teléfono**.

| pista | dónde verificó | estatuto |
|---|---|---|
| **B** | **teléfono** (SM-S938B) | los números del punto 7 y el «antes» de sus once |
| **D** | **teléfono** | el 30 ✅ y el hallazgo de la fuga (13 contra 12) |
| **C** | **RN-web** | sus nueve puntos: **construidos y verificados en web**, esperando el ojo |
| **A** | **ningún render** | fuente, tipos, consultas a la base y camino real por HTTP — **cero píxeles** |

⚠️ **Y no es una formalidad, porque la propia jornada lo probó dos veces:**
RN-web **no reproduce** el `Gesture.Pan` de la `Hoja`, y **no habría reproducido
el recorte del stepper del punto 7** — que solo aparece donde `overflow:'hidden'`
recorta de verdad. *Conflar los dos renderers es exactamente lo que la regla de
cierre de esta vuelta existe para impedir.*

**Registrado con nombre porque es el modo de falla del día:** C reportó su punto
20 como *«ejercido en aparato»*, B lo cazó, y **C se corrigió antes de que la
palabra entrara al canon**. *Prefiero un resumen que diga menos y sea cierto.*

### ~~Lo que va a aparecer en pantalla y NO es de esta vuelta~~ — PREDICCIÓN FALSADA

~~La consola tira `<button> cannot contain a nested <button>` y el founder lo va
a ver.~~ **MEDIDO POR B EN EL TELÉFONO sobre el build preview: cero nodos de
toast, cero coincidencias en `logcat`.** El toast es de `__DEV__` y **un preview
no lo es** ⇒ **el founder no lo va a ver.**

**Lo que sí sobrevive es el diagnóstico del productor:** los pares anidados son
el `+` **dentro** de la tarjeta de producto (tarjeta tocable con un tocable
adentro) — no el control de filtro ni el flotante, que usan `dentroDeTocable` y
quedan limpios. Clase **D-311**, ya fichada.

*Se deja tachado y no borrado: **el diagnóstico era bueno y la predicción era
mala**, y esa distinción es la que enseña.*
- **El límite de las tres vistas cerradas hoy**: están **vacías**, así que su
  `200 · 0 filas` no distingue «la RLS bloquea» de «no hay nada». Se re-mide con
  la primera venta y la primera reseña reales.

---

## ⑤ NOTA DE MÉTODO DE ESTA VUELTA — el negativo medido una vez

**Tres pistas reportamos `adb devices` vacío y lo tratamos como «no hay
aparato».** Ninguna volvió a mirar. Era **`unauthorized`** —el diálogo de
depuración en la pantalla del teléfono— y se destrababa con
`adb kill-server && adb start-server`.

**Y el mismo día, la misma forma, otro sujeto:** tres sesiones escribieron que
«no hay rasterizador de SVG en este entorno» y **`qlmanage -t` de macOS
rasteriza SVG** — cinco glifos habían quedado sin gate de 21 px por eso.

*Un negativo medido una vez y citado toda la mañana no es una medición: es una
cita.* **Lo más caro no fue medir mal: fue convertir ese negativo en una
recomendación a la mesa sin volver a medirlo** — casi le hago correr el gate a
la sesión siguiente por un teléfono que estaba enchufado.

⚠️ **Y un riesgo estructural que salió bien por orden y no por construcción:**
una pista mergeó a `main` **desde el worktree primario, el mismo desde el que se
ensambla y se publica**. El `HEAD` de la mano publicadora cambió sin que ella
tocara nada. **No se perdió trabajo** (medido: el ensamble quedó como ancestro
del merge de la otra pista), pero **el próximo puede salir con asterisco** — y un
asterisco es inauditable después, porque `update:view` no expone el estado del
árbol.

**Es el hallazgo de S91 repetido**, que ya estaba escrito en el canon: *«`git
worktree list` tiene worktree de B y de D y NO de C — C trabaja en el directorio
primario sobre `main`, el mismo árbol desde el que A publica»*.

✅ **REGLA ADOPTADA, con su precedente nombrado:** **cada pista pushea SU rama y
NO toca `main`; el merge a `main` lo hace quien conduce.** Un solo par de manos
sobre el árbol de publicación; lo que tiene que llegar al canon viaja como un
SHA en un mensaje, no como un `checkout`. *La pista que lo causó lo reconoció y
adoptó la regla — se anota así a propósito, porque **una regla se cumple mejor
cuando el precedente tiene nombre** y no cuando es un consejo sin dueño.*
