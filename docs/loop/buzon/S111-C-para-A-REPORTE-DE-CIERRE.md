# S111 · C → A · REPORTE DE CIERRE DE LA PISTA C

**Rama:** `pista/s111-c` · **medido el 1-sep-2026 17:27** contra `origin/main`
`67fec425315e202c338f91df834f0dd228a64a8b`.
**Al momento de medir, todo mi trabajo estaba mergeado** (`origin/main..HEAD`
vacío). ⚠️ *Este reporte agrega UN commit posterior — el sha va en el pedido de
merge, en su mensaje propio.*

> 🔴 **Todo sha citado acá es una foto del 1-sep 17:27.** La rama sigue
> caminando: verificá contra el HEAD del momento en que lo uses, no contra este
> número (`L-462` aplicada a shas — se pagó tres veces hoy).

---

## ① CONSTRUIDO Y EJERCIDO — con el camino por el que se probó

**Sólo DOS cosas mías se ejercieron por camino real.** Lo demás está en ②.

| qué | cómo se ejerció |
|---|---|
| **La puerta del acta de recogida** | **El founder la caminó en aparato** (gate 15:38–15:46). A midió el rastro: **2 actas levantadas, 3 fotos subidas y etiquetadas**. |
| **El botón de pago con DeUna** | **El founder lo intentó dos veces.** La primera destapó el defecto; la segunda corre sobre el lote con la cura (`01a05eed`). |

⚠️ **Y la segunda hay que decirla con precisión: lo que se ejerció fue el
DEFECTO, no la cura.** El founder tocó el botón apagado; **que ahora habilite
está verificado por lógica y por tipos, no por un dedo.** Hasta que alguien lo
toque, la cura pertenece a ②.

---

## ② CONSTRUIDO Y NO EJERCIDO — *se lee como hecho, y no lo es*

**Todo lo de abajo compila, está montado y alcanzable, y NADIE lo corrió por el
camino real.**

**Guardería · prestador**
· «No estaba» con su motivo y su lector · el viaje entero (abrir tramo → barra
viva → «Llegamos» → «Salgo a devolver» → cierre solo) · el punto vivo con su
freno · el orden del día reordenable y persistido · **la media del durante**
(fotos multi-destino, clip, chips) · **el acta de DEVOLUCIÓN** — su motor y su
pieza se destrabaron hoy y **nadie la levantó todavía**.

**Guardería · familia**
· El estado `no_recogida` en el hub · el en vivo con el animal pendiente.

**Adopción · cliente**
· La vidriera · la puerta sin cuenta desde el login · postular · el hilo · la
lista de conversaciones. **Cero de esto se tocó en aparato**, y hay una razón de
fondo: **no existe ninguna cuenta con rol `refugio`** (las crea el admin), así
que **la vidriera hoy está vacía por diseño** y no hay a quién postular.

**Las dos apps**
· **El toque de la push.** 🔴 **Y es el que más se lee como hecho:** los tres
estados están construidos, pero **un aviso sólo se prueba en APK de nube** — un
negativo en build local es falso. **Nadie tocó una push todavía.**

---

## ③ ENTREGADO Y NO MONTADO — con dueño de la puerta

| pieza | por qué no está montada | puerta |
|---|---|---|
| **`Convivencia`** (B) | `Adoptable` no trae convivencia **en ninguna forma**; modelarla —cuántas dimensiones, qué significa «no se sabe»— es **producto, no esquema** | **mesa**, después A |
| **`obtenerSolicitudesDeMisPublicaciones` · `contarSolicitudesPorRevisar`** (A) | son del **portal del publicador**, que no se construyó (ver ④) | **C**, cuando el portal entre |

---

## ④ NO CONSTRUIDO A PROPÓSITO — con su razón

**① El portal del publicador (§9).** Sus tres lectores existen. **No se
construyó porque su Home es *«una sola cosa cuenta: las solicitudes por
revisar»*, y sin cuentas con rol `refugio` esa pantalla nace vacía de lo único
que le da sentido.** *Montarla hoy sería entregar tres tabs para mirar un cero.*

**② El bloque «Llevan más tiempo esperando» de la vidriera.** §4 dice
**explícito** que **no es orden puro por antigüedad**. Tengo `creadaEn` y
**ordenar por él es exactamente lo que la letra prohíbe**. *Inventar el corte en
la pantalla sería decidir una regla de producto desde la UI.*

**③ Ocho de los nueve filtros de §4.** Sólo `especie` existe en el contrato.
**No se dibujan apagados:** *un filtro que no filtra es una promesa rota a un
toque de distancia.*

**④ La rama «quiero adoptar» del alta.** Estacionada esperando firma (ver ⑥).
*Sin saber qué crea, la salida del alta sería un botón que no sabe dónde deja al
usuario.*

**⑤ El arrastre para reordenar el día.** Construí subir/bajar. *El arrastre pide
gesto sobre tarjetas que ya tienen acciones adentro, y dos gestos en la misma
superficie pelean.* **Enmendé mi propio recorrido**, que prometía «con el dedo».

**⑥ Las otras siete pantallas del botón mudo.** Curé la mía. *Tocar seis
superficies ajenas al pasar sería una barrida sin gate.*

---

## ⑤ FICHAS Y LECCIONES — sin número, con su DISPARO

**FICHAS**

**F1 · El botón apagado y MUDO — 8 pantallas.** `Boton` sólo dibuja la razón si
recibe `razonDeshabilitado` **y** `onRazon`; **13 pasan la razón, 5 pasan
`onRazon`**. Curada la mía; **quedan 7**.
**Disparo:** cuando una tanda toque cualquiera de esas siete. **Y el gate que
propongo lo hace innecesario:** medir `razonDeshabilitado` sin `onRazon`,
baseline **8**, solo-baja.

**F2 · El espejo del tramo vivo tiene su retiro cumplido.**
`obtenerTramoVivoDeMiMascota` **ya existe** (`guarderia-reserva.ts:938`) y mi
`estaViajando` sigue repitiendo su criterio.
**Disparo:** la primera tanda que toque el durante del cliente. **Es reemplazar
una llamada, no un rediseño.** *No se hizo hoy porque cambiar ese lector en el
cierre es tocar el camino que el founder está por caminar.*

**F3 · La mensualidad no valida especie.** La única suscripción viva es de un
**ave** y `guarderia_mensual` es perro/gato. **No es mío** —es la puerta de la
mensualidad— pero **muerde mi prueba**: quien ejerza el cobro por ahí lo hace
sobre un dato que no debería existir.
**Disparo:** antes de la primera mensualidad real.

**LECCIONES**

**L-a · Una cola de trabajo contesta «qué falta hacer», jamás «qué tiene este
objeto».** Usé `pendientes` para pintar las fotos del acta ⇒ **la foto se subía
bien y desaparecía**, y la que fallaba se quedaba. **Corolario:** ante un «no
queda», preguntar primero si lo que se ve es **el fracaso o el éxito**.
**Disparo:** cualquier cola con estado terminal que alimente una vista.

**L-b · Un tipo que dice menos de lo que la función garantiza empuja a
castear.** `reglasSegunLugar` prometía «array que puede estar vacío» y devuelve
4 o 3. **Y la parte fina: no se afirma sobre un `filter`** —no conserva el
largo—; se enumera el primer elemento aparte y **la garantía pasa a ser del
compilador**.
**Disparo:** cuando un consumidor tenga que estrechar algo que nunca puede pasar.

**L-c · Una voz que explica un mecanismo es una afirmación más que mantener
verdadera.** Escribí *«un clip sin micrófono sale mudo»* en el código **y en la
voz al usuario**, sin medirlo. **El usuario la lee justo cuando algo no anda.**
**Disparo:** cada vez que una voz explique un porqué y no sólo un qué.

**L-d · Una verdad puede tapar otra cosa.** Tu (a) —el founder miraba el lote
anterior— era **correcta y suficiente** para el gate, y **no explicaba por qué
el botón estaba mudo**. *Cerrar con ella habría dejado F1 vivo detrás de una
explicación buena.*
**Disparo:** cuando una causa explique el síntoma reportado pero no todos sus
detalles.

---

## ⑥ LO QUE ESPERA AL FOUNDER — una línea, con evidencia y voto

**1. ¿«Quiero adoptar» crea la familia vacía?**
**Evidencia:** 24 superficies de `apps/cliente` cuelgan de `familia_id` y
**ninguna tolera `null`**. **Voto: SÍ, crearla** — con la otra opción hay que
enseñarles a las 24 un estado nuevo. *Y con ésta el guard **no** cambia de
pregunta, contra lo que el backlog suponía.*

**2. ¿Cómo se ordena la vidriera de adopción?**
**Evidencia:** §4 pide «Llevan más tiempo esperando» y dice **explícito que no
es antigüedad pura**. **Voto: que el criterio viva en el servidor** — *un orden
que sale del servidor no puede discrepar entre dos superficies.*

**3. ¿Cómo se modela «convive con perros/gatos/niños»?**
**Evidencia:** `Convivencia` de B está **entregada y no montada** por esto;
`paseo_social_ok` no sirve —es otro dato y **no tiene el tercer estado**.
**Voto: tres estados** (sí · no · **no se sabe**), porque §4 exige que *filtrar
no borre al que no se midió*.

**4. ¿Los chips se pueden marcar sobre una estadía ya ENTREGADA?**
**Evidencia:** el guard de A la rechaza; **el animal sí estuvo, y las manos del
cuidador quedan libres justo después de entregar**. **Voto: sí** — hoy no se
ofrece el botón, así que abrirlo es **un estado en mi condición y un valor en la
lista de A**.

**5. El recorrido en aparato de todo ②** — es la única firma que ninguna medición
reemplaza.
