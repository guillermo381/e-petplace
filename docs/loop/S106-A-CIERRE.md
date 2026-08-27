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

> **La ley al pie, y esta sesión la pagó cuatro veces: CONSTRUIDO ≠ CURADO.**
> El verde lo da el dedo del founder, no un typecheck. *Una pieza que existe y
> no cumple su efecto no la ve ningún gate.*

- **La captura sobre el video REMOTO.** Lo ejercido fue el track **local**.
- **«Cómo te ven» sin crash** — el flag viaja en el OTA `01a044ac`; **hasta
  aplicarlo, el crash sigue vivo.**
- **Una reserva nueva naciendo del titular** (el motor está, con su cinturón).
- **La reasignación con su aviso a la familia** — ejercida en cinturón, **no por
  una persona**.
- **El botón real del cuadro, con su aviso previo al dueño.**

---

## 🔴 DIFERIDO, con su costo

- **El brazo remoto de iOS del cuadro** — **rebota a propósito**. *Devolver el
  cuadro local cuando se pidió el remoto pondría **la imagen equivocada en una
  historia clínica**, y eso se lee años después para decidir algo.* El rebote
  es la conducta correcta, no una falta.
- **La superficie de la asignación** que quede a medias de C: ver a quién está
  asignada una cita y reasignarla, con el permiso acotado a recepción.

---

## Las fichas de hoy, cada una con su disparo

| ficha | disparo |
|---|---|
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
