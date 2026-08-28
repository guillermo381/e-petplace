# PARTE DE CIERRE · PISTA A · S106

> **27-ago-2026.** Lo que la próxima sesión lee para saber dónde está el
> servicio. **Las tres listas no se mezclan a propósito** — *ejercido,
> construido y diferido son tres cosas distintas, y confundirlas es cómo se
> llega a un gate creyendo que algo ya funciona.*

---

## 🟢 EJERCIDO POR EL FOUNDER, en aparato

Reserva de cero · la in-call entera **de los dos lados** · girar cámara a la
trasera · el altavoz · el temporizador · el modal con sus **tres alturas**,
dictado, historia y estructurador · **terminar** · **derivar sin diagnóstico** ·
la receta · el preset · y **la captura de cuadro en la prueba LOCAL**.

---

## 🟡 CONSTRUIDO SIN EJERCER — es lo primero de la próxima sesión

> **La ley al pie, y esta sesión la pagó cinco veces: CONSTRUIDO ≠ CURADO.**
> El verde lo da el dedo del founder, no un typecheck. *Una pieza que existe y
> no cumple su efecto no la ve ningún gate.*

### 🔴 EL CUADRO CONGELADO — el balance sin maquillar

**Se movió mucho esta noche y NO alcanza el verde.** Los cuatro renglones, cada
uno con su estado real:

| | |
|---|---|
| 🟢 **la vía nativa produce imagen real** | y **capturó en una cita real**: `resultado ok:true`, PNG en disco, aviso al dueño despachado, dos veces |
| 🔴 **NO probado que no bloquee** | **al contrario: bloqueó las dos veces** — ver abajo |
| 🔴 **NO probado QUÉ imagen salió** | *ver más abajo: no se pudo mirar el archivo, y por qué* |
| 🔴 **iOS remoto pendiente** | rebota a propósito ⇒ **sin verde de plataformas** |

**Por qué el segundo renglón es peor que «no probado»:** el bloqueo se
diagnosticó y **hay DOS defectos, no uno**.

- **① LA CAPA — real, curado, y su cura queda.** La capa se montaba después de
  `SuperficieLlamada` y se comía los toques. **B la movió al slot
  `sobreLaBarra`** ⇒ queda debajo de la barra **por construcción**, y **`R69`
  lo vigila en 0**: *nada absoluto después de `SuperficieLlamada`*.
- **② EL TRANSPORTE — encontrado hoy, SIN CURA, y es el que queda vivo.**
  🔴 **Corrección del founder que lo destapó: no es una capa que tapa** — cada
  uno sigue viendo su propia cámara **y ninguno ve la del otro**.

  > *Un `zIndex` o un `pointerEvents` no cortan video en las **dos**
  > direcciones. Eso es transporte.*

  **Medido, dos de dos, en salas distintas:**

  | | toque | `local connection quality lost while publishing → full reconnect` | Δ |
  |---|---|---|---|
  | 1ª | 22:58:11.98 | 22:58:33.44 | **+21,5 s** |
  | 2ª | 23:45:53.93 | 23:46:16.27 | **+22,3 s** |

  **Y lo ata a la captura el OBJETO, no el reloj:** la captura pide el cuadro al
  transporte **`publisher`, `pcId = 0`**, y el `removeTrack` es de **la pc `0`**.
  *No son dos hechos que pasan cerca: es uno que toca lo que el otro rompe.*

  ⇒ **La cura de la capa era correcta y el segundo defecto se llevaba su
  crédito.** *Dos defectos con síntomas que se solapan — la trampa inversa de
  `L-284`.*

  **El primer candidato de la próxima sesión**, que se cae solo si se mide:
  pedir el cuadro al **`subscriber`** —donde vive la pista remota— en vez del
  `publisher`. Hoy resuelve por `publisher` **porque `subscriber.pc` vino
  vacío**, *y por qué vino vacío es la pregunta que abre.*

**El resto del 🟡:**

- **Una reserva nueva naciendo del titular** (el motor está, con su cinturón).
- **La reasignación con su aviso a la familia** — ejercida en cinturón, **no por
  una persona**.

---

## 🔴 DIFERIDO, con su costo

- **Mirar el PNG — NO SE PUDO, y la razón importa.** El founder ordenó sacarlo
  del teléfono y verlo. **No hay puerta:** vive en el cache privado de la app y
  **el APK es release** ⇒ `run-as: package not debuggable`. **Y la subida a
  Storage NO está cableada** (el wrapper `subirCuadroTeleconsulta` existe en
  `packages/api` y **nadie lo llama** — el sexto motor-sin-puerta de la sesión).
  ⇒ **la única vía hoy es una captura de pantalla del modal con la miniatura a
  la vista.** *Queda como lo primero, junto al transporte.*

  ⚠️ **Y no lo cierra la lectura de código.** C probó que el track es **remoto**
  (con `pcId != -1` el brazo local es inalcanzable: una cámara local habría
  rebotado como `track_no_encontrado`). **Eso prueba que es remoto, no CUÁL.**
  *En una historia clínica «casi seguro que es el animal» no alcanza* — y el
  archivo lo contesta de un vistazo.

- **El brazo remoto de iOS del cuadro** — **rebota a propósito**. *Devolver el
  cuadro local cuando se pidió el remoto pondría **la imagen equivocada en una
  historia clínica**, y eso se lee años después para decidir algo.* El rebote es
  la conducta correcta, no una falta.
- **La superficie de la asignación** que quede a medias de C: ver a quién está
  asignada una cita y reasignarla, con el permiso acotado a recepción.

---

## Las fichas de hoy, cada una con su disparo

| ficha | disparo |
|---|---|
| 🔴 **el transporte que se cae al capturar** | **lo primero de la próxima sesión** — la teleconsulta se corta en las dos direcciones |
| 🔴 **el PNG no se puede mirar** | **cablear `subirCuadroTeleconsulta`**: sin eso, ninguna imagen clínica es auditable |
| **`D-944`** — ninguna build local tiene mapas ni push | **el APK del friends-and-family se hace EN LA NUBE** |
| 🔴 **los APK instalados hoy son BUILD DE PRUEBA** | *una prueba de avisos en ellos da **FALSO NEGATIVO*** — y **los de tanda 2 tampoco los tenían y nadie lo sabía** |
| **rotación del keystore** | **antes de la primera subida al Play Store** — *su log volvió a volcarlo hoy* |
| **el voseo que vuelve** (cuarta vez, distintas manos) | el próximo lote de strings |
| **los dos verbos de la pantalla de equipo** | al tocarla |
| **`D-943`** girar cámara por el plan B | más aparatos (moto g31 · friends-and-family) |
| **la grilla vs. la duración del servicio** | de negocio: *20 min en grilla de 30 desperdicia un tercio de la capacidad del vet* |
| **el desenlace como dato consultable** | la columna ya existe; falta que las pantallas la llenen |
| **el gate del código nativo** | **a mano antes de pedir una build, jamás en pre-commit** — *un gate de 15 min por commit no lo corre nadie, y uno que nadie corre da la sensación de estar cubierto* |
| 🔴 **las 6 citas nacidas por balanceo** | separar continuidad de balanceo puro, y **NO se tocan en silencio: detrás hay familias** |

---

## 🔴 LO ÚNICO QUE BLOQUEA EL ENCENDIDO

> **El consentimiento verificado en fila.** Nada de hoy lo levantó.

**Y la llave sigue ENCENDIDA**, con su criterio de apagado cambiado por firma:
**se apaga cuando haya usuarios reales** —el friends-and-family de octubre, o
antes si entra cualquier familia que no sea del equipo— **no al terminar un
gate**. Está enmendado arriba de todo en
`docs/relevamientos/2026-08-26-s106a-COREOGRAFIA-DE-LA-LLAVE.md`, *porque un
procedimiento que dice «apagá al terminar» lo obedece quien lo lee.*

---

## Las prácticas que esta sesión deja, y por qué

**① Después de `prebuild`, regenerar los tipos del router y volver a correr
`verify:diseno` ANTES de compilar.** *Si no, el gate que vigila las rutas queda
mirando un archivo vacío y el typecheck dice verde mientras mide de menos.* Me
frenó hoy con `/prueba-cuadro`.

**② `GRADLE_OPTS` no alcanza para el Metaspace.** `android/gradle.properties`
declara `org.gradle.jvmargs` **y gana**. La vía que funciona es
`GRADLE_OPTS="-Dorg.gradle.jvmargs=..."`, que **sobrescribe** en vez de competir.

**③ El manifiesto del prebuild NO es el del APK.** *Leer el insumo de un
artefacto y llamarlo el artefacto es la misma clase de error que medir una rama
en vez del objeto desplegado* — me costó una conclusión falsa y un crash latente
sin detectar.

**④ Y la que esta sesión pagó cinco veces:** *un mensaje de éxito prueba que algo
pasó, no que fuera lo tuyo.* `Already up to date` sobre un merge que no ocurrió
(tres veces, desde adentro del worktree) · `exit 0` de un wrapper sobre una build
fallida · un `exit` leído de un `ls` en vez del guard.

**⑤ PROBAR EL INSTRUMENTO ANTES DE CONFIAR EN SU SILENCIO** — pagada esta noche,
dos veces seguidas y con la misma cara. Dos capturas volvieron vacías y **declaré
«se cerró sin toques» sobre un logcat que nunca escuchó**: `ReactNativeJS:*` sin
comillas (zsh lo expande como glob y aborta, dejando el archivo ya creado) y
`timeout`, que **no existe en macOS**.

> *Un archivo vacío no dice «no hubo toques»: dice «no hay líneas», y esas son
> dos cosas distintas.*

**La receta que quedó, con su control positivo:** `adb logcat -c` +
`adb logcat -s 'ReactNativeJS:V' > archivo` **y pedir el reinicio de la app antes
de tocar** — al arrancar imprime `[update] id=…`, que **prueba el cable y el
bundle en un solo acto**. *Sin él, un toque sin log deja sin saber si el defecto
es del dedo, del bundle o del instrumento.*

**⑥ Un instrumento que informa el eje equivocado no miente: te deja concluir con
confianza sobre lo que no midió.** El marcador del `pcId` reportaba `pc` vs `_pc`
—el eje que **no** discriminaba— y callaba **cuál de los cuatro transportes**
había ganado, que era el que decidía. Con el nombre del transporte agregado, la
respuesta apareció sola: **`publisher`**. *`L-429`, ahora en el instrumento en
vez de en el mensaje.*

**⑦ Y la de esta noche, que corrige un razonamiento correcto mal aplicado:**
descarté el `full reconnect` porque *«un evento posterior al síntoma no lo
produce»*. **Es cierto como regla y fue falso acá:** el bloqueo arrancó al
capturar; lo que llegó a los 21 s fue **el diagnóstico de LiveKit**, que necesita
ventana para declarar perdida una calidad.

> *Confundí el instante del defecto con el instante en que el monitor lo nombra.*

---

## Adjudicación declarada — B y C curaron el mismo defecto

**Las dos curas eran correctas.** C conservó la capa como hermana con
`pointerEvents="box-none"` (cura **por cuidado**); B la movió al slot
`sobreLaBarra` (cura **por construcción**, y el `120` deja de copiarse: sale de
`ALTO_BARRA`).

**Gana la de B, y no por haber llegado primero:** *entre dos curas equivalentes
gana la que no depende de que alguien se acuerde* (`L-169`). El `box-none` hay
que volver a ponerlo cada vez que nazca otra capa; **el slot no se puede olvidar
porque no hay dónde montarla mal.** **C: verificá o revertí** — si tu `box-none`
cubre un caso que el slot no, vuelve.

---

## Operativo del cierre

`main` = `f061ffb4` · **OTA prestador `01a04697`** (runtime 1.0.7, ancla
`ee564f22`, árbol medido en cero antes de bundlear) · **aplicado y verificado en
el aparato por su propio marcador**, no supuesto · `verify:diseno` **VERDE con
60 reglas**, `R69` en 0 · 4 typechecks en 0.
