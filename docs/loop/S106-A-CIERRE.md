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

### 🔴 EL CUADRO CONGELADO — DIFERIDO ENTERO A LA V2 (firma del founder, 28-ago)

> **Lo que se difiere es EL CUADRO CONGELADO ENTERO** — el botón, el módulo
> nativo, la subida a Storage y sus dos defectos abiertos. **No sólo la revisión
> del archivo.**
>
> **Disparo: la versión 2 de la app.**
> **Excepción, también firmada: si algo de teleconsulta falla y el rastro apunta
> al cuadro, vuelve antes.**

**Y ya está fuera de alcance en producción:** el botón vive detrás de `__DEV__`
(OTA `01a046c1`). *Un vet no puede tocarlo, así que no puede cortarle el video a
una familia a mitad de una consulta paga.*

**Balance al diferirlo, sin maquillar** — para que la V2 no lo re-descubra:

| | |
|---|---|
| 🟢 **la vía nativa produce imagen real** | y **capturó en cita real**: `resultado ok:true`, PNG en disco, aviso al dueño despachado, dos veces |
| 🔴 **bloquea** | y son **DOS defectos, no uno** — ver abajo |
| 🔴 **NO probado QUÉ imagen salió** | *dato barato, sin disparo: el PNG que quedó en el teléfono **sigue siendo el discriminador**. Ya no urge —el botón está fuera de alcance— pero si alguien tiene el aparato delante, mirarlo cuesta nada y contesta una pregunta que hoy queda abierta.* |
| 🔴 **iOS remoto pendiente** | rebota a propósito ⇒ **sin verde de plataformas** |

**LOS DOS DEFECTOS, y no se confunden:**

- **① LA CAPA — real, CURADA, y su cura se queda.** Se montaba después de
  `SuperficieLlamada` y se comía los toques. **B la movió al slot
  `sobreLaBarra`** ⇒ debajo de la barra **por construcción**, con **`R69` en 0**
  vigilándolo: *nada absoluto después de `SuperficieLlamada`*.
- **② EL TRANSPORTE — SIN CURA APLICADA, y es el que queda vivo.**
  🔴 **Corrección del founder que lo destapó: no es una capa que tapa** — cada
  uno ve su propia cámara **y ninguno la del otro**.

  > *Un `zIndex` no corta video en las **dos** direcciones. Eso es transporte.*

  **Medido, dos de dos, en salas distintas:**

  | | toque | `local connection quality lost while publishing → full reconnect` | Δ |
  |---|---|---|---|
  | 1ª | 22:58:11.98 | 22:58:33.44 | **+21,5 s** |
  | 2ª | 23:45:53.93 | 23:46:16.27 | **+22,3 s** |

  **Atado por el OBJETO, no por el reloj:** la captura pide el cuadro al
  transporte **`publisher`, `pcId = 0`**, y el `removeTrack` es de **la pc `0`**.
  *Es uno que toca lo que el otro rompe.*

  🔑 **LA CURA YA ESTÁ ESCRITA Y NO APLICADA: `e8e380a5`** (en `main` desde el
  merge del cierre). **La V2 la trae en vez de re-diagnosticarla.**

  **Y mi propio error, anotado porque es útil:** descarté ese evento como
  coincidencia con N=1. *Confundí el instante del defecto con el instante en que
  el monitor lo nombra* — el bloqueo arranca al capturar; los 21 s son lo que
  LiveKit tarda en **declarar** perdida una calidad.

**LAS DOS ALTERNATIVAS QUE C MIDIÓ (fichas, para que no se re-discutan):**

- ☠️ **El obturador de la cámara NO APLICA.** `takePictureAsync` tiene **dos
  fuentes y las dos son el sensor local**. *En el teléfono del vet no hay un
  sensor apuntando al animal: hay un decodificador.* **Se cierra por medición,
  no por preferencia.**
- 🟢 **La foto del dueño, como opción complementaria** — y su razón es la que la
  hace fuerte: **no toca el transporte**, que es de donde nacen los dos defectos
  abiertos. *La imagen la saca quien tiene el animal delante, que además es quien
  tiene el mejor ángulo.*

**El resto del 🟡:**

- **Una reserva nueva naciendo del titular** (el motor está, con su cinturón).
- **La reasignación con su aviso a la familia** — ejercida en cinturón, **no por
  una persona**.

---

## 🔴 DIFERIDO, con su costo

- ☠️ **EL CUADRO CONGELADO ENTERO → V2** (firma del founder, 28-ago). Su
  balance completo vive arriba, en el 🟡. **Disparo: la versión 2.** Excepción
  firmada: *si algo de teleconsulta falla y el rastro apunta al cuadro, vuelve
  antes.* **El brazo remoto de iOS y el PNG sin mirar viajan adentro de este
  diferimiento** — dejaron de ser ítems sueltos.

  ⚠️ **Y con él viaja `subirCuadroTeleconsulta`, que sigue sin puerta.** *El día
  que el cuadro vuelva, la subida es parte del alcance y no un detalle: sin ella
  ninguna imagen clínica es auditable por nadie.*

- **La superficie de la asignación** que quede a medias de C: ver a quién está
  asignada una cita y reasignarla, con el permiso acotado a recepción.

---

## Las fichas de hoy, cada una con su disparo

| ficha | disparo |
|---|---|
| ☠️ **el cuadro congelado entero** (botón · módulo nativo · subida · sus dos defectos) | **la V2** — *excepción: si algo de teleconsulta falla y el rastro apunta al cuadro, vuelve antes* |
| 🔴 **el transporte que se cae al capturar** | viaja con el cuadro; **la cura ya está escrita en `e8e380a5`** |
| ☠️ **el obturador de la cámara como alternativa** | **CERRADA POR MEDICIÓN**: `takePictureAsync` sólo tiene sensor local, y en el teléfono del vet no hay sensor apuntando al animal |
| 🟢 **la foto del dueño, complementaria** | cuando el cuadro vuelva — **no toca el transporte**, que es de donde nacen los dos defectos |
| 🟢 **el PNG en el teléfono** | *sin disparo, dato barato*: sigue siendo el discriminador de qué imagen salió |
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

# 🔴 ④ ESTADO DE APARATOS Y BINARIOS — *esto hoy no lo sabe nadie más*

> **Sin esto, la próxima sesión diagnostica un defecto que no existe.**

| aparato | qué tiene | consecuencia |
|---|---|---|
| **Samsung `R5CY201ZDVL`** (el del founder) | prestador **runtime 1.0.7** · cliente **1.0.6** · APK **de la nube, CON `geo.API_KEY`** (verificado por manifiesto) | 🟢 el de referencia — es donde se corrieron todos los gates |
| **moto g31** | sin medir esta sesión | 🔴 **no se supone nada de él** — `D-943` (girar cámara por el plan B) espera justamente más aparatos |

## 🔴 LA REGLA QUE SALE DE ESTO, y evita un falso negativo caro

**Los APK que compilé localmente en S106 NO TIENEN mapas ni push.** No fue
descuido: `GOOGLE_MAPS_API_KEY` y las credenciales de FCM son **secrets de EAS**,
y *«can only be accessed on EAS builder»* ⇒ **una build local no puede tenerlos,
y no falla: los OMITE** (`D-574` con su mecanismo por fin nombrado).

> ⚠️ **UNA PRUEBA DE AVISOS EN ESOS BINARIOS DA FALSO NEGATIVO.**
> *El push no llega porque el binario no puede recibirlo — no porque el aviso
> esté roto.* Quien lo pruebe ahí va a salir a arreglar un motor sano.

**Y el que lo vuelve peor: los APK de tanda 2 tampoco los tenían y nadie lo
sabía.** ⇒ **`D-944`: el APK del friends-and-family se hace EN LA NUBE**, y se
verifica **por manifiesto del artefacto**, jamás del prebuild.

**Los de prueba ya no están instalados** — el founder los desinstaló, que es lo
que cumplió la condición ② para que `MAPA_NATIVO_DISPONIBLE` volviera a `true`.

🔑 **Y la que va con fecha: rotar el keystore ANTES de la primera subida al Play
Store.** *Su log volvió a volcarlo hoy.*

---

# ⑤ QUÉ EJERCIÓ EL FOUNDER Y QUÉ NO — la lista consolidada

> **Estaba repartida en cuatro partes distintos. Vive acá, y separada de lo que
> cada pista construyó**: *lo que una pista entrega y lo que un dedo confirma son
> dos hechos distintos, y mezclarlos es cómo se abre una sesión creyendo que algo
> anda.*

## 🟢 Lo que el founder vio andar, en el aparato

Reserva de cero · **la in-call entera de los dos lados** · girar cámara a la
trasera · el altavoz · el temporizador · el modal con sus **tres alturas** ·
dictado · historia clínica · estructurador · **terminar** · **derivar sin
diagnóstico** · la receta · el preset · **la captura de cuadro en prueba local**
· y **los tres defectos que él mismo destapó y volvió a probar curados**: el
crash de «Cómo te ven», la vitrina que rebotaba, y la capa que lo encerró.

## 🔴 Lo que NINGÚN dedo confirmó todavía

- **Una reserva nueva naciendo del titular** — el motor está y su cinturón pasó,
  *pero un cinturón no es una persona reservando.*
- **La reasignación con su aviso a la familia** — ejercida **en cinturón**, no
  por una persona.
- **El cuadro congelado sin bloquear**, y **qué imagen sale** — diferido a V2.
- **La superficie de la asignación** (ver a quién está asignada una cita y
  reasignarla, con permiso acotado a recepción) — no existe todavía.

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
