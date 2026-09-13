# S116-E · EL `OutOfMemoryError` BAJO NAVEGACIÓN SOSTENIDA: **NO REPRODUCIDO**, LA CURVA MEDIDA, LA CAUSA TODAVÍA HIPÓTESIS

> **Pista E · lote 01 · rama `pista/s116-e-01` · 13-sep-2026**
> 🔴 **SHA VIGENTE: `d1bb0a5a`** — la rama nació de `ca564994` y se puso al día con `origin/main` al cerrar. **Mi rama no toca una línea de `apps/` ni de `packages/`** — verificado: `git diff --name-only origin/main...HEAD -- apps packages` → **0**.
> ⚠️ **Y lo que importa para la validez de todo lo que sigue: las mediciones se tomaron sobre `ca564994`, y los nueve commits que main avanzó desde entonces NO TOCAN `apps/` ni `packages/`** — medido: `git diff --name-only ca564994..d1bb0a5a -- apps packages` → **0 archivos**. ⇒ **el código de la app que medí es byte-idéntico al de `d1bb0a5a`; ninguna curva de este parte queda vieja por el avance de main.**
> *(El rebase se pidió y el permiso de `git rebase` está bloqueado en esta sesión; se resolvió con `merge --no-ff` de `origin/main`, que para un solo commit logra el mismo objetivo —la rama contiene `d1bb0a5a`, verificado con `merge-base --is-ancestor`— y deja el registro del acto en vez de reescribirlo.)*
> **Encargo:** investigar **sin curar** el OOM que dejé sin causa atribuida en `S116-E-LINEA-BASE.md` §②.3.
> **Lo que esto NO es:** una cura, una ficha de deuda, ni una atribución de causa. **La causa queda como hipótesis con su instrumento nombrado**, y se dice cuál.

---

## EL PARTE EN SIETE LÍNEAS

1. 🔴 **El OOM es POSTERIOR a la cura de `D-1074` por tres días** (`77142c10` del 9-sep es ancestro de `ca564994` del 12-sep) **y sus magnitudes no se parecen** — `D-1074` hacía 485 MB en reposo a los 2 min; esto es contra un techo de 192 MB tras ~60 navegaciones. **No es la campana de `S115` ya resuelta.**
2. 🔴 **NO REPRODUJE LA CAÍDA. Cero caídas en ~290 navegaciones, repartidas en siete corridas.** La secuencia mínima que la produce queda **NULL**.
3. 🟢 **Sí hay retención real y está medida, y es ÍNFIMA: +2,8 MB por cada pasada completa de 89 rutas distintas ⇒ ~0,03 MB por navegación**, ya descontada la poda y **post-GC** (el recolector libera 8-21 MB por pasada y el heap vuelve a su piso). *El heap sube hasta 0,80 MB/nav mientras la pila se llena, pero eso es pico, no retención.*
4. 🔶 **HIPÓTESIS, no causa:** lo retenido son **pantallas que quedan montadas en la pila de cada tab**; la única poda del código (`popToTop` en `(tabs)/_layout.tsx:696`) **está atada al press del tab**, que ningún deep link produce.
5. 🟢 **La poda existe y es brutal cuando dispara: 42 MB y 10 000 Views en UNA navegación.** Por eso el crecimiento **no es irreversible**, y por eso la proyección honesta al techo pasa de ~218 navegaciones a **miles**.
6. 🔴 **La brecha con el original no se cerró: se agrandó a dos órdenes de magnitud.** Aquel barrido cayó con ~67 navegaciones; a 0,03 MB/nav eso son **2 MB** sobre una base de 18. **El techo es 192.** ⇒ **la hipótesis que sí medí explica el crecimiento transitorio y NO explica el OOM. Falta un factor que no encontré, y lo dejo escrito en vez de estirar lo que medí hasta que parezca alcanzar.**
7. 🔴 **El control que decide el ALCANCE corrió, y su resultado NO es el que esperaba: tocando la barra de tabs TAMBIÉN crece, +0,15 MB por toque** (pendiente por mínimos cuadrados sobre 40 taps, banda de oscilación de 10 MB). ⇒ **la navegación humana también acumula, a un quinto del ritmo del barrido — así que esto NO se puede cerrar como «artefacto de mi instrumento»**, que era la conclusión hacia la que iba.

**Descartados con medición** (para que nadie los vuelva a recorrer): el pool de OkHttp · el apilamiento de Activities · la fuga de hilos · las suscripciones Realtime · los bitmaps · el `uiautomator dump` · **el `MapView`** (escalón único de 12,7 MB, no acumula) · **el tamaño de los datos de la pantalla** (`citas/<Thor>` con 148 citas: 29,6 MB).


---

## ⓪ LO PRIMERO, PORQUE DECIDE SI ESTE PARTE EXISTE: ¿VI CAER LA APP O LEÍ UN ARCHIVO?

**Ninguna de las dos exactamente, y la distinción importa más que la respuesta corta.**

El crash fue de **mi propia corrida, en mi AVD, provocado por mi navegación** — no es un log heredado de otra época. Pero **no lo vi caer en pantalla**: corría un barrido automatizado, y lo detecté **por su efecto** —las capturas empezaron a salir del dev launcher en vez de la app— y **recién entonces** leí el logcat para saber por qué. *O sea: produje el crash y lo diagnostiqué de un log, en la misma ventana de minutos.*

| | dato | de dónde sale |
|---|---|---|
| fecha y hora | **2026-09-13 10:13:51** | logcat de esa ventana, citado literal en `S116-E-LINEA-BASE.md` §②.3 |
| binario | **dev build 1.0.7**, `DEBUGGABLE`, instalado **2026-09-07** | `adb shell dumpsys package com.epetplace.cliente` |
| árbol que servía Metro | **`ca564994`** (12-sep 15:04) | `git merge-base main origin/pista/s116-e-00` |
| techo del heap | **192 MB** = `201326592` bytes | `getprop dalvik.vm.heapgrowthlimit` → **`192m`**, que **coincide exacto** con el `target footprint` de la pila |

### La pregunta que gobierna: ¿anterior o posterior a la cura de `D-1074`?

```bash
git log -1 --format='%h %ad' --date=format:'%Y-%m-%d %H:%M' 77142c10   # → 77142c10 2026-09-09 23:36
git merge-base --is-ancestor 77142c10 ca564994 && echo POSTERIOR       # → POSTERIOR
```

🔴 **POSTERIOR A LA CURA POR TRES DÍAS.** La cura de `D-1074` es `77142c10` (9-sep 23:36) y **es ancestro** del SHA que corría. **No es la campana de `S115` ya resuelta**, así que la investigación sigue.

**Y hay una segunda razón, independiente del git, para no confundirlos — las magnitudes no se parecen:**

| | `D-1074` (curado) | esto |
|---|---|---|
| régimen | **reposo** | **navegación sostenida** |
| Dalvik | 67 → **485 MB** | contra un techo de **192 MB** |
| tiempo a la caída | **2 min 12 s** | **~60 navegaciones** |
| mecanismo conocido | pedir token → evento → pedir token | **ninguno atribuido** |

⚠️ **Y una pérdida de evidencia que declaro porque es mía:** el AVD guardaba el registro de `DevLauncherErrorActivity` del 13-sep 10:13:52, y **lo alcancé a leer hoy** antes de que **mi propia actividad de esta corrida lo sobrescribiera** (es un buffer circular de `dumpsys package`). *Lo tengo por suerte, no por método: quedó en el transcript de esta sesión y ya no es re-verificable en el aparato.* **Lo que sí sobrevive es el literal del logcat commiteado en el parte de la línea base.**

---

## ① EL APARATO Y EL MÉTODO, CON SUS COMANDOS

**Aparato:** AVD **`s113_E`** · **`emulator-5560`** (AVD y puerto propios, y **todo `adb` con `-s`** — regla de la casa: en un emulador compartido `am start` sin `-s` abre la app del vecino y la captura sale perfecta del árbol equivocado).

```bash
~/Library/Android/sdk/emulator/emulator -avd s113_E -port 5560 -no-snapshot-load -no-boot-anim
adb -s emulator-5560 shell getprop dalvik.vm.heapgrowthlimit    # → 192m
adb -s emulator-5560 shell wm size                              # → 1080x2400
adb -s emulator-5560 shell cat /proc/meminfo | head -1           # → MemTotal: 4062432 kB
```

🔴 **CORRECCIÓN A MI PROPIO PARTE ANTERIOR:** `S116-E-LINEA-BASE.md` §①.4 declara el AVD con **«2 GB RAM»**. **Medido hoy: `MemTotal` = 4 062 432 kB ≈ 3,87 GB.** *El dato estaba mal y nadie lo iba a re-medir porque venía con su aparato al lado.*

**Metro:** corrió desde **`apps/cliente` del árbol PRIMARIO**, en `main` **`ca564994`** y **limpio** (`git status --porcelain` → 0). **Dos razones declaradas, no una comodidad:** ① mi worktree no tiene `node_modules` y Metro aborta con `ENOENT` sobre él; ② **`.env.local` vive en `apps/cliente/`, no en la raíz** — las credenciales demo salen de ahí (`env: load .env.local` en el log de Metro), y desde el worktree no las habría tenido. **Es legítimo porque mi rama es byte-idéntica a `main` en `apps/` y `packages/`**: el bundle es el mismo que serviría mi rama.

**La verificación que vale, y es la única:**

```
Android Bundled 1102ms node_modules/expo-router/entry.js (3062 modules)
```

*Sin esa línea nada de lo que sigue vale: `expo start` con el puerto ocupado **saltea el dev server sin fallar** y el aparato se queda hablando con un Metro anterior que sirve otro árbol.*

### ①.1 El instrumento de muestreo, y el bug que tenía adentro

```bash
adb -s emulator-5560 shell dumpsys meminfo <pid>     # PSS, Heap Alloc, y el bloque Objects
adb -s emulator-5560 shell ls /proc/<pid>/task | wc -l
```

Mide por muestra: `dalvik_pss` · **`dalvik_alloc`** · `native_pss` · `native_alloc` · `total_pss` · **`views`** · `viewroot` · `activities` · `appcontexts` · `assets` · `bitmap_n` · `bitmap_kb` · `hilos` · `okhttp_disp` · `okhttp_task`.

🔴 **Y tuvo un bug en la única columna que decide el OOM.** El formato de `dumpsys meminfo` es `Pss Total | Priv Dirty | Priv Clean | Swap | Rss | Heap Size | Heap Alloc | Heap Free`, así que **`$NF` es `Heap FREE`, no `Heap Alloc`**. Mi parser usaba `$NF` y publicaba **24576 kB clavado en todas las muestras**. *Lo cazó que un número no se moviera nunca* — un valor fijo es sospechoso donde todo oscila. **Corregido a `$9`**, y verificado contra el valor leído a mano en el mismo instante (38 533 vs 35 925 kB, diferencia de un GC). **La corrida con el parser malo se descartó y se relanzó**: `Views` y `PSS` eran válidos ahí, pero **sin `Heap Alloc` la curva no mide lo que revienta**.

### ①.2 Dos instrumentos más que fallaron en silencio, y los dos los cazó un control

| falla | qué publicaba | qué la cazó |
|---|---|---|
| **`for r in $RUTAS`** | el bucle corrió **1 vez** con la lista entera como una ruta, y el CSV salió con su fila y todo | **leer la etiqueta**, no el exit code. **El shell es `zsh`, que NO hace word splitting** de `$VAR` sin comillas. Curado con array de bash |
| **`mapfile -t RUTAS`** | **0 rutas**, y el log habría cerrado con *«las 0 rutas únicas SIN CAER»* — un verde perfecto | **la línea `CONTROL: ${#RUTAS[@]} rutas (esperado 66)`**. `mapfile` **no existe en bash 3.2**, el de macOS |

*Las dos veces el instrumento entregó una salida creíble y terminó diciendo que todo estaba bien. Ninguna la habría visto leer el código: las vio un control que exige un número esperado.*

---

## ② LO PRIMERO QUE HABÍA QUE DESCARTAR: ¿MIDO LA APP O MI PROPIO MÉTODO?

**Si el deep link montara pantallas sin desmontar, el crecimiento sería del barrido y no de la app.** Se mide antes de cualquier otra cosa, porque cambia la lectura de todo lo demás.

**10 navegaciones por deep link, midiendo tras cada una:**

| # | ruta | Views | Activities | ViewRootImpl | AppContexts |
|--:|---|--:|--:|--:|--:|
| 0 | — | 685 | 1 | 1 | 6 |
| 2 | avisos | 1384 | **1** | **1** | **6** |
| 8 | postventa/mis-casos | **2127** | **1** | **1** | **6** |
| 9 | cuenta/perfil | 1137 | **1** | **1** | **6** |
| 10 | cuenta/facturas | **894** | **1** | **1** | **6** |

🟢 **`Activities`, `ViewRootImpl` y `AppContexts` NO se mueven: 1, 1 y 6 en las once muestras.** El deep link **no apila Activities** — expo-router vive en una sola. Y **`Views` sube a 2127 y baja a 894**: crece y se poda. ⇒ **la navegación por deep link mide la app, no el instrumento.**

---

## ③ PRIMER INTENTO DE REPRODUCCIÓN: 20 RUTAS × 5 CICLOS. **NO REPRODUCE — Y SU FRACASO ES EL HALLAZGO**

**La secuencia:** 20 rutas repetidas en ciclo, muestreando tras cada navegación, con `sleep 3` entre una y otra. Cortada en la **navegación 50** (el ciclo 3), porque a esa altura ya había contestado.

**La comparación que la cierra — la MISMA ruta en el ciclo 1 y en el ciclo 2:**

| ruta | Views c1 | Views c2 | dAlloc c1 | dAlloc c2 | nPSS c1 | nPSS c2 |
|---|--:|--:|--:|--:|--:|--:|
| avisos | 1365 | **5951** | 21 062 | **40 293** | 524 275 | 778 915 |
| postventa/mis-casos | 1876 | **6462** | 22 614 | **42 357** | 540 531 | 789 427 |
| nexo | 1969 | **6555** | 23 366 | **42 709** | 551 363 | 792 515 |
| hogar | 686 | 4489 | 19 014 | 35 493 | 560 467 | 799 315 |
| **cuenta** | **2344** | **2344** | 24 693 | 25 701 | 662 691 | 812 611 |
| hogar/veterinaria | **3045** | **3045** | 27 285 | 27 557 | 646 483 | 771 299 |
| explorar/paseo | **3328** | **3328** | 28 421 | 28 821 | 694 419 | 803 747 |
| cuenta/pagos | **5190** | **5190** | 37 877 | 37 861 | 746 643 | 798 675 |
| buscar | **5271** | **5271** | 37 445 | 37 637 | 758 787 | 809 699 |

```
Views IDENTICO entre ciclos: 11 de 20 rutas
delta dalvik_alloc c2-c1:  min -16   max  19 743 kB   (media   7 504 kB)
delta native_pss   c2-c1:  min 50 784  max 254 640 kB  (media 149 292 kB)
```

🔴 **CORRECCIÓN A UNA LECTURA MÍA DE HACE VEINTE MINUTOS, y la dejo escrita porque el error es instructivo:** al ver las últimas filas dije *«no hay fuga, el estado es cíclico y estable»*. **Eso era leer 11 filas de 20.** Las **nueve primeras crecieron fuerte** — `avisos` pasó de 1365 a 5951 Views y de 21 a 40 MB de Dalvik entre un ciclo y el siguiente. *La tabla ordenada por ciclo pone las idénticas juntas al final, y mirar el final se siente como mirar el resultado.*

**Lo que la tabla dice de verdad, en tres hechos:**

1. **Hay un punto de poda, y es la RAÍZ DE TAB.** De `cuenta` (nav 10 y 30) en adelante **todo coincide exacto** entre ciclos: llegar a una raíz de tab normaliza la pila al mismo estado, y las 10 rutas siguientes reconstruyen la misma. *`Views` volviendo a `3045`, `3328`, `5190` y `5271` al dígito no es azar: es un estado reconstruido.*
2. **Dalvik SÍ crece entre ciclos, pero despacio: +7,5 MB por cada 20 navegaciones.** A ese ritmo, desde 18 MB, el techo de 192 MB queda a **~464 navegaciones**. **El OOM original fue a ~60.** ⇒ **esta secuencia no es la que lo produce.**
3. **Lo que crece fuerte es el heap NATIVO: +149 MB de media por ciclo** (506 → ~810 MB). **Pero el OOM fue `java.lang.OutOfMemoryError` contra el `target footprint` de Dalvik**, y el nativo no corre contra ese techo.

⇒ **Repetir rutas no reproduce el defecto.** Y eso apunta a qué tenía el barrido original que este ciclo no: **recorría 105 rutas DISTINTAS, sin repetir ninguna.**

⚠️ **Y acá está la trampa de método de toda la investigación: una secuencia que repite rutas produce una curva estable, y una curva estable se lee como «no hay fuga».** *Si hubiera cerrado en la fase 3, habría reportado que el OOM no se reproduce — con 50 navegaciones de evidencia y una tabla que cierra sola.*

---

## ④ SEGUNDO INTENTO: **66 RUTAS ÚNICAS, SIN REPETIR NINGUNA.** ACÁ SÍ CRECE, Y MONÓTONO

> 🔴 **LEER CON §⑭:** el «monótono» de este título es verdadero **dentro de esta secuencia** y **falso como propiedad general**. El orden alfabético dejó las rutas raíz al final, así que la poda nunca llegó a dispararse; **cuando dispara, baja 42 MB de una vez.** *Se deja el título como estaba y se apunta a su corrección, en vez de reescribirlo: el camino por el que llegué a la conclusión equivocada es parte de lo que este parte tiene que dejar.*

**La secuencia**, que es el diseño del barrido original (el que cayó): recorrer rutas **distintas**, una vez cada una, `sleep 3` entre navegación y navegación, desde **proceso fresco**.

```bash
# las 78 estáticas del router del cliente, como ruta de deep link
find apps/cliente/src/app -name '*.tsx' | grep -v '_layout.tsx' | grep -v '\[' \
 | sed 's|apps/cliente/src/app||; s|\.tsx$||; s|/index$||; s|^/||; s|(tabs)/||' | sort -u
# menos 12 excluidas, cada una con su razón escrita  ⇒  66 rutas
adb -s emulator-5560 shell am start -a android.intent.action.VIEW -d "cliente:///<ruta>"
```

**Las 12 excluidas y por qué** (declaradas, no silenciosas): `cuenta/cerrar` y `baja` son **destructivas**; `login`·`registro`·`bienvenida`·`recuperar`·`verificar-correo`·`auth/callback`·`invitacion`·`onboarding` **sacan de la sesión**, que es el estado que quiero medir; `gallery` y `lamina-fusion` son superficies de diseño, no pantallas de producto.

**La curva** (Dalvik `Heap Alloc`, que es la que corre contra el techo de 192 MB):

| nav | ruta | dAlloc kB | Views | TOTAL PSS kB |
|--:|---|--:|--:|--:|
| 0 | *(fresco)* | **18 214** | 685 | 764 918 |
| 5 | avisos | 21 958 | 1 588 | 811 287 |
| 8 | cuenta | 19 702 | 963 | 869 042 |
| 11 | cuenta/direccion | **34 490** | 1 110 | 881 632 |
| 12 | cuenta/documentos | **40 650** | 2 872 | 932 128 |
| 17 | cuenta/pagos | 50 042 | 4 683 | 1 009 087 |
| 22 | despensa | 55 114 | 6 068 | 1 152 423 |
| 26 | explorar | 56 346 | 6 435 | 1 216 798 |
| 34 | explorar/guarderia | 59 562 | 7 165 | 1 272 814 |
| 44 | explorar/veterinaria/checkout | **62 618** | **7 942** | **1 325 678** |

**Los números que salen de ahí:**

```
dalvik_alloc:  18 214 → 62 618 kB en 44 navegaciones   ⇒  +44,4 MB  ·  1,01 MB por navegación
Views:             685 → 7 942  en 44 navegaciones      ⇒  +7 257   ·  165 Views por navegación
TOTAL PSS:     764 918 → 1 325 678 kB                   ⇒  +561 MB
Activities:          1 → 1      (no se mueve)
hilos:             103 → ~102   ·  OkHttp Dispatcher: 12 → 7  (BAJAN y se estabilizan)
```

🟢 **Lo que queda DESCARTADO con medición, y conviene no volver a mirar:** **no son los hilos** (bajan de 103 a 102) **ni el pool de OkHttp** (de 12 Dispatcher a 7, estable) **ni las Activities** (1, fija). *El frame `OkHttp Dispatcher` de la pila original sigue siendo lo que `L-557` dice que es: dónde estaba el hilo, no quién consumió.*

🔴 **Y la diferencia con la fase 3 explica el mecanismo: acá las raíces de tab NO PODAN.** En la fase 3, llegar a `hogar` bajaba Views de 1965 a 686. En la fase 6, llegar a `despensa` (nav 22) **subió** de 50 986 a 55 114 kB. *La diferencia entre las dos corridas es qué había apilado antes: en la fase 3 eran rutas RAÍZ (`avisos`, `nexo`, `carnet` — fuera de los tabs), y entrar a un tab las descarta; en la fase 6 lo apilado eran las trece subrutas de `cuenta`, **y la pila de un tab sobrevive a que te vayas a otro tab**.*

**La proyección, con lo que falta dicho:** a **1,01 MB/nav** desde 18 MB, el techo de 192 MB queda a **~172 navegaciones**. **El OOM original fue a ~60.** ⇒ **esta secuencia tampoco es la que lo produce: va en la dirección correcta y el ritmo no alcanza.**

---

## ⑤ EL MECANISMO DEL CRECIMIENTO: **LEÍDO EN EL CÓDIGO, Y COHERENTE CON LAS DOS CURVAS**

⚠️ **Esto es LECTURA, no medición. Va acá porque explica las dos curvas de arriba y porque nombra el archivo y la línea; no porque lo haya medido.**

La poda de la pila de navegación vive en **un solo lugar**:

```
apps/cliente/src/app/(tabs)/_layout.tsx:696
  navigation.dispatch({ ...StackActions.popToTop(), target: destino.state.key });
```

y está **adentro del `onCambiar` de `BarraTabs`** — o sea que **dispara con el PRESS del tab y con nada más**. `am start` con un deep link **no produce un press**: navega directo. ⇒ **un barrido por deep link nunca poda.**

**Y está así a propósito, con su razón escrita en el mismo archivo** (líneas 639-647): `popToTopOnBlur` se retiró en **S63** (`D-402` enmendada, hallazgo del founder) porque *«el blur también dispara cuando una ruta de nivel raíz se monta encima de los tabs o cuando un flujo cruza de tab — vaciaba el stack A MITAD del flujo y la flecha de atrás aterrizaba en la raíz del mundo»*. **La poda agresiva ya se probó y se retiró por romper algo peor.**

**Esa lectura explica las dos podas que las curvas mostraron y las dos que NO:**

| qué pasó | dónde | por qué, según la lectura |
|---|---|---|
| **podó**: Views 1965 → 686 | fase 3, nav 6 (`hogar`) | lo apilado eran rutas **RAÍZ** (`avisos`, `nexo`, `carnet`) **encima** de los tabs; entrar a un tab las descarta |
| **podó**: Views 2127 → 894 | fase 1, nav 9-10 | ídem |
| **NO podó**: 50 986 → 55 114 kB | fase 6, nav 22 (`despensa`) | lo apilado eran las 13 subrutas de **`cuenta`**, y **la pila de un tab sobrevive a irse a otro tab** |
| **NO podó**: Views 5063 → 5743 | fase 3, nav 21 (`hogar`, 2º ciclo) | ídem |

⇒ **Mecanismo propuesto:** cada tab conserva su pila; visitar N subrutas de los 5 tabs deja las N montadas, con sus Views y sus datos; y el único gesto que poda —el press del tab— no se produce nunca en un barrido. **`Activities: 1` es lo que lo vuelve invisible a la herramienta obvia:** quien mire Activities va a ver una sola y concluir que no se apila nada.

---

## ⑥ LO QUE QUEDA DESCARTADO CON MEDICIÓN

**Vale tanto como lo que queda vivo: son caminos que el próximo no tiene que volver a recorrer.**

| candidato | por qué parecía | **medición que lo descarta** |
|---|---|---|
| **el pool de OkHttp** | la pila del OOM es `FATAL EXCEPTION: OkHttp Dispatcher`, y `D-1074` tenía **28** hilos Dispatcher | **bajan y se estabilizan**: 12 → 7 en la fase 6 (66 navs). `OkHttp TaskRunner` 13 → 12. *`L-557` otra vez: el frame dice dónde estaba el hilo, no quién consumió.* |
| **apilamiento de Activities** | 60 navegaciones seguidas | **`Activities: 1` · `ViewRootImpl: 1` · `AppContexts: 6`**, fijos en las **~180 muestras de todas las fases** |
| **fuga de hilos** | `D-1074` los multiplicaba | **103 → 102** en 66 navegaciones |
| **suscripciones Realtime sin limpiar** | un `.channel()` vivo retiene su WebSocket | **el censo eran 2 reales, no 6** — y los dos tienen cleanup. 🔴 **Mi primer grep contó 6 porque leyó 4 comentarios como código (`L-170`)**; uno de ellos es literalmente la cita de la medición de `S94-PERF` |
| **bitmaps / imágenes** | 50 MB de bitmap aparecieron de golpe | **se estabiliza**: salta a ~50 MB en la nav 8 y se queda ahí (49 000-51 200 kB) durante 40 navegaciones más |
| **`uiautomator dump` inflando el heap de la app** | mi propio parte registró **120 intentos fallidos** | **① el barrido original NO lo usaba** — los 120 intentos eran del **detector de arranque** de §①.4, y el barrido usaba `am start` + `sleep 4` + `screencap`; **② medido igual** (fase 8, misma secuencia + dump, contra la fase 6 como control): delta **+48 a +208 kB** por navegación. 🔴 **Esta hipótesis la propuse yo y la falsé leyendo mi propio parte con cuidado** — la había construido sobre el recuerdo de una frase, no sobre lo que la frase decía |

---

## ⑦ 🔴 UNA CORRECCIÓN A LA TABLA DE MI PROPIA LÍNEA BASE, PORQUE EL MISMO BUG LA TOCÓ

`S116-E-LINEA-BASE.md` §①.4 publica una columna **«Dalvik Alloc»** con valores de **35 883 → 36 203 kB** a lo largo de 120 s. **Ese número es, con alta probabilidad, `Heap SIZE` y no `Heap Alloc`** — el mismo bug de parser de §①.1, cometido en la corrida anterior.

**El argumento, y es de comportamiento, no de sospecha:**

| | línea base (§①.4) | medido hoy |
|---|---|---|
| Dalvik **PSS** | 19 296 kB | 25 623 kB |
| su columna «Alloc» | **35 883** | *(Heap **Size** = 38 891 · Heap **Alloc** = 19 446)* |
| cómo se movió en la ventana | **+320 kB** mientras el PSS subía **+3 264** | — |

*Un `Heap Alloc` oscila con cada GC; un `Heap Size` sube en escalones y se queda quieto. La columna de la línea base se quedó quieta mientras el PSS se movía diez veces más — ése es el comportamiento de `Size`.*

⚠️ **Qué se cae y qué NO:** **la conclusión de §①.4 sobrevive intacta**, porque estaba construida sobre el **PSS** (19,3 → 22,0 MB, plano) y ése está bien medido. **Lo que no sirve es la columna extra**, que nadie iba a re-mirar porque venía en una tabla que cerraba. **Y no es re-verificable:** no conservé el script de esa corrida. *La declaro en vez de corregirla, que es lo único honesto que se puede hacer con un número cuyo instrumento ya no existe.*

---

## ⑧ TERCER INTENTO, AISLANDO UNA VARIABLE: **REPETIR RUTAS DEL MISMO TAB NO CRECE NADA**

**Bloque de control de la fase 7** — 12 navegaciones alternando 5 rutas con parámetro **del mismo tab** (`hogar/mascota`, `citas`, `hogar/vacunas`), desde proceso fresco:

| nav | ruta | dAlloc kB | Views |
|--:|---|--:|--:|
| 0 | *(fresco)* | 18 262 | 685 |
| 2 | hogar/mascota | 19 286 | 965 |
| 6 | hogar/mascota | 18 550 | 743 |
| 8 | citas | 19 302 | 955 |
| 12 | hogar/mascota | **19 430** | **965** |

🟢 **PLANO: 12 navegaciones y Dalvik oscila entre 18 262 y 19 526 kB.** `Views` vuelve a **965** y a **743** exactamente, según qué ruta esté arriba. ⇒ **la memoria no depende de CUÁNTAS navegaciones hiciste: depende de QUÉ está apilado.** *Con esto, «navegación sostenida» deja de ser la variable: la variable es **cuántas rutas distintas** quedaron montadas.*

### ⑧.1 Y el mapa cuesta un ESCALÓN, no una pendiente

**Segundo bloque de la fase 7**, misma corrida, 15 navegaciones a las rutas que montan `MapView` de Google (`prestador/[id]` y `explorar/guarderia/[prestadorId]`). **Control previo, con el ojo:** capturé `prestador/<id>` y **el mapa está vivo** — tiles de Quito cargados, el círculo de zona aproximada de `S84`, el logo de Google. *No estoy midiendo una pantalla de error.*

```
SIN mapa (15 navs):  min 18 390  max 19 526  ⇒  rango  1 136 kB   ← plano
CON mapa (15 navs):  min 29 354  max 34 634  ⇒  rango  5 280 kB
ESCALÓN al montar el primer mapa:                   +12 740 kB
crecimiento DENTRO del bloque con mapa (nav 16→30):  −1 056 kB en 14 navegaciones
```

🟢 **El mapa es un ESCALÓN de ~12,7 MB por cargarse la primera vez, y de ahí NO acumula.** Y el patrón interno **repite al kilobyte** entre ciclos:

| ciclo | prestador/P1 | prestador/P2 | prestador/P3 | guarderia/P1 | guarderia/P2 |
|---|--:|--:|--:|--:|--:|
| 2º | 32 282 | 32 554 | 33 514 | 34 538 | 31 214 |
| 3º | **32 314** | **32 570** | **33 594** | **34 570** | **31 114** |

⇒ **descartado como causa.** *Era mi candidato más fuerte —las 5 rutas con mapa son todas con parámetro y mi barrido de estáticas no tocaba ninguna— y resultó ser un costo de carga única.*

---

## ⑨ 🔴 EL ERROR DE MÉTODO QUE MÁS ME COSTÓ, Y LO ENCONTRÉ MIDIENDO LA BASE: **ESTABA NAVEGANDO A MASCOTAS VACÍAS**

Las rutas con parámetro de las fases 7 y 10 las armé con **los primeros ids que devolvió la base**. Recién después medí **cuánto dato tiene cada mascota**:

```sql
select m.nombre, (select count(*) from eventos_mascota e where e.mascota_id=m.id) as eventos, ...
from mascotas m order by eventos desc limit 8;
```

| mascota | id | eventos | citas | marca |
|---|---|--:|--:|---|
| **Thor** | `d2e31d70…` | **240** | **148** | *(real)* |
| **Zeus** | `a3332037…` | **84** | **62** | *(real)* |
| Kira Dos | `16baac39…` | 57 | 55 | `fixture_founder_s113` |
| Thor *(el otro)* | `79930830…` | 31 | 23 | *(real)* |

🔴 **Los tres ids que había usado no aparecen en el top 8: tienen menos de 23 eventos.** **El barrido original recorría la familia REAL del founder** —`hogar/mascota/<Thor>` con 240 eventos, `citas/<Thor>` con 148 citas—, y yo estaba midiendo pantallas de mascotas casi vacías. ⇒ **mi costo por navegación estaba subestimado, y ninguna de mis curvas anteriores podía saberlo.**

*Es la clase de error que no tiene síntoma: las pantallas cargaban, las curvas eran limpias, los controles pasaban. **Lo único que lo destapó fue preguntarle a la base cuánto pesa lo que estoy abriendo.*** La corrida larga se relanzó con Thor, Zeus y Kira Dos.

---

## ⑩ LA CURVA, CONSOLIDADA: **LAS SEIS CORRIDAS EN UNA TABLA**

| corrida | secuencia | navs | Dalvik `Heap Alloc` | **ritmo** | ¿cayó? |
|---|---|--:|---|---|---|
| **fase 1** | 10 rutas mixtas, deep link | 10 | 23 247 → 30 879 kB | — *(sube y baja)* | no |
| **fase 3** | 20 rutas × ciclos, **repetidas** | 50 | 18 198 → ~42 700 kB | **+7,5 MB por ciclo de 20** = 0,37 MB/nav | **no** |
| **fase 6** | **66 rutas ÚNICAS estáticas** | 66 | **18 214 → 72 330 kB** | **0,80 MB/nav** · Views 148/nav | **no** |
| **fase 7-A** | 5 rutas del mismo tab, repetidas | 15 | 18 390 → 19 526 kB | **0,00** *(rango 1,1 MB)* | no |
| **fase 7-B** | 5 rutas **con `MapView`**, repetidas | 15 | 29 354 → 34 634 kB | **escalón +12,7 MB, después −1 MB** | no |
| **fase 8** | fase 6 + `uiautomator dump` | 9 | delta **+48 a +208 kB** vs. control | ≈ igual al control | no |
| **fase 5** | **40 TOQUES de la barra de tabs** (5 raíces en ciclo) | 40 | 20 070 → 27 172 kB, **oscilando en banda de 10 MB** | **+0,15 MB/tap** *(mínimos cuadrados)* | no |
| **fase 10** | **89 rutas únicas** (66 estáticas + 23 con parámetro, ids **reales**) × 2 pasadas | **166** | 18 326 → 71 898 kB *(pico)* → **poda a 29 866** → 32 650 | **pico 0,80 · retención 0,03 MB/nav** | **no** |

**La lectura de la tabla, en una línea:** **lo único que hace crecer el heap es visitar una ruta que no visitaste antes.** Repetir no crece (0,00), los mapas son un escalón único, el dump no pesa, y el ritmo con rutas nuevas es **0,80 MB por navegación**.

**La proyección al techo, con lo que la proyección no sabe dicho:**

```
techo medido del aparato:  192 MB  (dalvik.vm.heapgrowthlimit = 192m = 201326592 bytes,
                                    idéntico al target footprint de la pila del OOM)
base con proceso fresco:    18 MB
ritmo con rutas únicas:   0,80 MB/nav
⇒  (192 − 18) / 0,80  ≈  218 navegaciones a rutas nuevas
```

⚠️ **Lo que esa proyección supone y no midió: que el ritmo se mantiene lineal hasta el techo.** *No lo sé. Puede acelerar (más pantallas montadas = más trabajo de GC) o frenar (el GC se vuelve agresivo al acercarse al límite, y el propio OOM dice `giving up … because <1% of heap free after GC`, o sea que peleó). **Extrapolar 3× más allá de donde medí es la parte más débil de este parte, y por eso la corrida larga existe.***

---

## ⑪ 🔶 LA HIPÓTESIS. **ES HIPÓTESIS, Y ACÁ ESTÁ LO QUE LA SOSTIENE Y LO QUE NO**

> **🔶 HIPÓTESIS — no medida como causa:** *el heap crece porque **cada ruta nueva que se visita queda montada** en la pila de su tab, con sus Views y sus datos; y la única poda que existe en el código —`StackActions.popToTop()` en `(tabs)/_layout.tsx:696`— **está atada al `onCambiar` de `BarraTabs`, o sea al press del tab**, que ni un deep link ni una navegación programática producen. Con suficientes rutas distintas, la suma llega al techo de 192 MB.*

**Lo que la sostiene (todo medido en este lote):**

| evidencia | número |
|---|---|
| repetir rutas **no** crece | **0,00 MB/nav** — rango de 1,1 MB en 15 navegaciones (fase 7-A) |
| rutas **nuevas** crecen, monótono | **0,80 MB/nav** en 66 navegaciones (fase 6) |
| `Views` crece con rutas nuevas y **vuelve al valor exacto** al repetir | 148/nav · y `3045`, `3328`, `5190`, `5271` **repetidos al dígito** entre ciclos |
| no es apilamiento de Activities | **`Activities: 1`** en ~180 muestras |
| la poda existe y se vio funcionar | Views **1965 → 686** cuando lo apilado eran rutas raíz |
| la poda **no** se vio funcionar entre tabs | **50 986 → 55 114 kB** al entrar a `despensa` con la pila de `cuenta` montada |
| dónde vive la poda y a qué está atada | **lectura** de `(tabs)/_layout.tsx:696` dentro de `onCambiar` |

🔴 **LO QUE LA HIPÓTESIS NO EXPLICA, Y NO LO VOY A TAPAR:** el OOM original cayó cuando el barrido llevaba **~67 de sus ~118 rutas** (118 capturas, 51 salieron del dev launcher). **Mi ritmo medido pone el techo en ~218 navegaciones.** La brecha es de **3×** y **queda abierta**. Dos candidatos **nombrados y NO medidos**:

- **(a) el acumulado real del proceso original era mayor que 67.** *Mi propio parte de la línea base dice que **«volvió a caer durante la re-captura»**, o sea que hubo al menos dos pasadas del barrido; si el proceso no se reiniciaba entre ellas, el acumulado se acerca a las ~218 proyectadas.* **No lo sé: no registré si reiniciaba.**
- **(b) las pantallas del original pesaban mucho más.** Thor tiene **240 eventos y 148 citas**; mis fixtures, menos de 23 (§⑨). **Está en medición al cerrar este parte** (corrida larga con los ids reales).

⚠️ **Y la alternativa que sigue viva y que ninguna de mis mediciones descarta:** que haya **además** una retención por pantalla que el ciclo repetido no muestra porque **reconstruye el mismo estado** en vez de acumularlo. *Mi fase 7-A prueba que repetir no crece; **no** prueba que montar y desmontar libere todo.*

---

## ⑫ QUÉ INSTRUMENTO HARÍA FALTA PARA CONFIRMARLA

**Cuatro, en orden de lo que más decide con menos trabajo.**

### 1. 🔴 El control que falta y que cambia el ALCANCE, no la causa: **navegar tocando la barra de tabs**

**Es el primero porque decide si esto le pasa a una persona o sólo a un barrido.** La poda está atada al press del tab; un deep link no lo produce. ⇒ **si tocando la barra la memoria queda plana, el OOM es un artefacto del método de instrumentación y no un defecto que un usuario alcance.**

```bash
# 5 tabs en 1080x2400 ⇒ centros en W/10, 3W/10, W/2, 7W/10, 9W/10 · Y ≈ h−110
adb -s emulator-5560 shell input tap 108 2290   # y así los cinco, en ciclo
```

✅ **CORRIDO — está en §⑮, y su resultado NO fue el esperado: tocando la barra TAMBIÉN crece, +0,15 MB por toque.** ⇒ **la navegación humana también acumula** (a un quinto del ritmo del barrido), así que **esto no se puede cerrar como artefacto del instrumento.** *Esta entrada se deja porque era la prioridad correcta, y su resultado es el que más cambió la lectura del lote.*

### 2. El heap dump comparativo — **el único que dice QUÉ retiene, no cuánto**

```bash
adb -s emulator-5560 shell am dumpheap <pid> /data/local/tmp/h.hprof
adb -s emulator-5560 pull /data/local/tmp/h.hprof
~/Library/Android/sdk/platform-tools/hprof-conv h.hprof h.conv.hprof
# contar instancias por clase, fresco vs. tras N rutas nuevas
```

**Qué probaría:** si las instancias de las clases de pantalla de React Native crecen **linealmente con N rutas nuevas**, la hipótesis queda confirmada; si crecen otras cosas, la hipótesis cae y el dump nombra al verdadero. **Las herramientas están** (`hprof-conv` en platform-tools, `python3`) **y el parser quedó escrito en este lote** — ⚠️ **pero NO lo corrí ni lo probé contra un dump real, así que no sé si funciona.** *Un parser de hprof sin probar es exactamente la clase de instrumento que da un número creíble y falso; no lo declaro disponible, lo declaro escrito.*

### 3. Un contador de montajes **dentro de la app** — el definitivo, y no es mío

Un `useEffect` de montaje/desmontaje que lleve la cuenta de pantallas vivas y la loguee. **Convierte la hipótesis en un hecho de una sola corrida**, porque mide el objeto en vez de inferirlo del heap. **Es territorio de `apps/cliente` (pista C), no mío**, y va como pedido, no como cura.

### 4. La corrida larga hasta la caída — para saber si la proyección de 218 es lineal

Es la que quedó corriendo al cerrar este parte (§⑭). **Su valor no es encontrar la causa: es decir si el techo se alcanza por acumulación** y con cuántas navegaciones — o si la curva se aplana y entonces **falta un factor que no medí**.

---

## ⑬ LA SECUENCIA: QUÉ PANTALLAS, CUÁNTAS VECES, EN CUÁNTO TIEMPO

**Dos secuencias, porque son dos cosas distintas y confundirlas sería lo mismo que hice al principio.**

### ⑬.1 La secuencia mínima que produce **EL CRECIMIENTO** — ésta sí la tengo, y es reproducible

```bash
# aparato: AVD s113_E · emulator-5560 · dev build 1.0.7 + Metro (verificar el "Android Bundled")
adb -s emulator-5560 shell am force-stop com.epetplace.cliente
adb -s emulator-5560 shell am start -a android.intent.action.VIEW \
  -d "cliente://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081"
sleep 45                                    # esperar el bundle

# y después, UNA VEZ CADA UNA, rutas DISTINTAS de dentro de los tabs:
for r in cuenta cuenta/ayuda cuenta/datos-facturacion cuenta/direccion cuenta/documentos \
         cuenta/exportar cuenta/facturas cuenta/familia cuenta/medios cuenta/pagos \
         cuenta/perfil cuenta/preferencias cuenta/recurrentes cuenta/seguridad \
         despensa despensa/carrito despensa/checkout despensa/reclamo explorar …; do
  adb -s emulator-5560 shell am start -a android.intent.action.VIEW -d "cliente:///$r" </dev/null
  sleep 3
  adb -s emulator-5560 shell dumpsys meminfo $(adb -s emulator-5560 shell pidof com.epetplace.cliente)
done
```

**Qué pantallas:** cualquier conjunto de **rutas distintas dentro de los tabs** — las 13 de `cuenta`, las 4 de `despensa`, las 20 de `explorar`, las 13 de `hogar`, `pedidos`.
**Cuántas veces:** **una vez cada una. Repetir no sirve** (fase 7-A: 0,00 MB/nav).
**En cuánto tiempo:** `sleep 3` entre navegaciones — **66 navegaciones en ~7 minutos**.
**Qué da:** **18 214 → 72 330 kB de `Dalvik Heap Alloc`** (0,80 MB/nav), `Views` 685 → 10 483. **Reproducido dos veces**: la corrida larga volvió a dar 57 674 kB en la nav 30 donde la fase 6 había dado 57 818.

🔴 **Lo que NO hay que hacer, porque tapa el efecto:** **tocar la barra de tabs** (poda) y **repetir rutas** (no crece). *Las dos cosas hacen que la curva salga plana, y una curva plana se lee como «no hay nada».*

### ⑬.2 La secuencia que reproduce **LA CAÍDA** — **NULL. No la reproduje.**

**Lo digo sin adornar: en este lote la app no se cayó ni una vez, en ~230 navegaciones repartidas en seis corridas.**

Lo que tengo en su lugar es **la curva que va hacia el techo y su proyección: ~218 navegaciones a rutas nuevas**. Y lo que falta para convertir esa proyección en una reproducción es una corrida que **agote las 89 rutas únicas y siga**, que es la que quedó en marcha al cerrar este parte.

### ⑬.3 🟢 Y una pieza de evidencia que llegó del logcat: **lo que mido es retención POST-GC**

Con Dalvik en ~64 MB, el recolector **está trabajando y liberando de verdad**:

```
Explicit concurrent mark compact GC freed  8912KB ... 27% free, 63MB/87MB
Explicit concurrent mark compact GC freed    11MB ... 27% free, 64MB/88MB
Background young  concurrent mark compact GC freed 21MB ... 19% free, 70MB/88MB
Background        concurrent mark compact GC freed 6640KB ... 27% free, 64MB/88MB
```

**Dos cosas que esto establece, y las dos importan:**

1. **El GC libera 8-21 MB en cada pasada y el heap VUELVE a su piso de ~64 MB.** ⇒ **hay un piso que no se libera, y es ese piso el que crece.** *No estoy midiendo basura pendiente de recolectar: estoy midiendo memoria retenida que el recolector ya intentó liberar y no pudo.*
2. **Los GC son `Explicit`** — los fuerza `dumpsys meminfo`, o sea **mi propia medición**. ⇒ **cada `Heap Alloc` de mis tablas es un valor post-GC.** *Eso hace la curva más fuerte, no más débil.*

**Y el `target footprint` acompaña:** arrancó en **38 MB** (`Heap Size` con proceso fresco) y a la navegación 50 ya está en **88 MB**. El techo es 192. **La trayectoria es la que la proyección describe.**


---

## ⑭ 🔴 EL HALLAZGO MÁS IMPORTANTE, Y LLEGÓ AL FINAL: **LA PILA SE PODA, Y PODA 42 MB DE UNA VEZ**

**La corrida larga (89 rutas únicas, con los ids reales) venía reproduciendo la fase 6 al kilobyte** — nav 66: **71 898 kB** contra 72 330 de la fase 6. **Y en la navegación 68 pasó esto:**

| nav | ruta | dAlloc kB | Views |
|--:|---|--:|--:|
| 66 | recuerdo | **71 898** | **10 481** |
| **68** | **hogar/mascota/`a3332037…`** *(Zeus)* | **29 866** | **352** |
| 70 | hogar/vacunas/`d2e31d70…` *(Thor)* | 27 594 | 644 |
| 72 | citas/`d2e31d70…` *(Thor, 148 citas)* | 29 626 | 1 134 |
| 76 | prestador/`ea9a88bf…` *(con mapa)* | 33 882 | 1 030 |

🟢 **Una sola navegación liberó 42 MB y descartó 10 000 Views** — y el PID no cambió (`28508`), así que **no es un reinicio: es la poda funcionando.** *Lo que se descartó fueron las ~15 rutas RAÍZ que el orden alfabético había dejado apiladas al final (`nexo`, `pagos/*`, `pedidos`, `postventa/*`, `recuerdo`): entrar a una ruta de tab las descarta a todas de golpe.*

**Y de ahí en adelante se queda abajo:** 27-34 MB durante las 10 navegaciones siguientes, **incluidas las de Thor (240 eventos, 148 citas) y una con mapa.**

**Dos consecuencias, y las dos corrigen cosas que escribí más arriba en este mismo parte:**

1. 🔴 **El candidato (b) de §⑪ queda DESCARTADO.** `citas/<Thor>` con **148 citas** da **29 626 kB**; su equivalente con un fixture de <23 eventos dio ~19 300. **Hay diferencia y es de ~10 MB, no del 3× que hacía falta.** *El costo es de la pantalla montada, no del tamaño de sus datos.*
2. 🔴 **El crecimiento NO es irreversible, y eso cambia la probabilidad de todo el hallazgo.** *Mi §④ dice «monótono» y es verdad **dentro de esa secuencia**: el orden alfabético dejó las rutas raíz al final, así que la poda nunca llegó a dispararse. **Con otro orden se dispara, y baja 42 MB.*** ⇒ **para llegar a 192 MB hay que acumular rutas nuevas SIN entrar nunca a un tab, y no encontré ninguna secuencia que lo consiga.**

**⇒ La pregunta que queda, y es LA pregunta:** ¿el piso post-poda (**~28-30 MB**) **crece entre pasadas**? *Si sube pasada a pasada, hay retención real y el techo se alcanza tarde o temprano. Si se queda en 30 MB, no hay fuga acumulativa y el OOM original tuvo un factor que no reproduje.* **Es exactamente lo que la corrida está midiendo en sus pasadas 2 y 3.**


### ⑭.1 EL PISO POST-PODA: **+2,8 MB POR PASADA DE 89 RUTAS.** La retención es real y es ÍNFIMA

**La corrida larga cerró en la navegación 166, con 83 muestras y CERO caídas.** Y contestó la pregunta que importaba, comparando **el mismo punto del recorrido en dos pasadas** — la navegación donde la poda ya disparó:

| | pasada 1 | pasada 2 | delta |
|---|--:|--:|--:|
| **post-poda** (`hogar/mascota/…`, nav 68 vs 158) | **29 866 kB** | **32 650 kB** | **+2 784 kB** |
| arranque del recorrido (`adoptar`) | 18 214 kB *(fresco)* | 36 074 kB | +17 860 kB |
| mitad del recorrido (zona `despensa`) | ~54 600 kB | 55 226 kB | ≈ +550 kB |

⚠️ **El límite de esta comparación, que es de mi diseño y lo declaro:** con **89 rutas (impar)** y muestreo **cada 2 navegaciones**, las dos pasadas caen en rutas **alternas** — la nav 68 es `hogar/mascota/<Zeus>` y la 158 es `hogar/mascota/<Kira Dos>`. **Son la misma posición del recorrido y la misma clase de pantalla, pero no la misma ruta**, y sus `Views` difieren (352 vs 1792). *El número es del orden correcto; no es una comparación exacta. Con muestreo cada navegación —o con un número par de rutas— lo sería.*

```
retención NETA post-poda:  ≈ +2,8 MB por 89 navegaciones  ⇒  ~0,03 MB/nav
⇒  proyección al techo de 192 MB:  del orden de MILES de navegaciones
```

🔴 **Y esto obliga a corregir el número más citable de este parte, por segunda vez y hacia abajo:**

| ritmo | qué mide | proyección al techo |
|---|---|--:|
| **0,80 MB/nav** (§④) | el **pico** de una pila que todavía no se podó | ~218 navs |
| **0,20 MB/nav** | el arranque de la pasada 2, **antes** de su primera poda | ~870 navs |
| **≈0,03 MB/nav** | **lo que queda cuando la poda ya pasó** — el único que es retención de verdad | **miles** |

⇒ 🔴 **LA HIPÓTESIS DEL APILAMIENTO EXPLICA EL CRECIMIENTO TRANSITORIO Y NO EXPLICA EL OOM.** *El barrido que cayó llevaba ~67 navegaciones. A 0,03 MB/nav eso son **2 MB** sobre los 18 de base. **El techo es 192.*** **Falta un factor que no encontré, y la brecha es de dos órdenes de magnitud.** *Lo dejo escrito así en vez de estirar la hipótesis que sí medí hasta que parezca alcanzar: es exactamente la clase de explicación que después nadie vuelve a revisar porque cierra.*

---

## ⑮ EL CONTROL QUE DECIDE EL ALCANCE, CORRIDO: **TOCANDO LA BARRA TAMBIÉN CRECE, a una quinta parte del ritmo**

**Corrió: 40 toques sobre los 5 tabs, en ciclo, por coordenada.**

```bash
# 5 tabs en 1080x2400 ⇒ centros en 108, 324, 540, 756, 972 · Y = 2400−110 = 2290
adb -s emulator-5560 shell input tap 108 2290
```

*(La Y salió de una cuenta, no de un volcado: **la barra vive SOBRE la gesture bar (~48 px)**, así que `H−60` habría tocado el sistema. **Verificada por efecto**: `Views` cambia con cada tap ⇒ los toques llegan.)*

🔴 **Y acá la serie NO es monótona: oscila en una banda de 10 MB.** Por eso el número no sale de los extremos:

```
banda de oscilación:                    19 750 – 29 908 kB   (10 158 kB)
pendiente por mínimos cuadrados:        +151 kB por tap      ← el número
promedio primeros 10 vs últimos 10:     24 758 → 28 850 kB   (+136 kB/tap, coincide)
delta crudo de extremos:                +178 kB/tap          ← sesgado
```

| corrida | pendiente por mínimos cuadrados | delta de extremos | banda | ¿el delta de extremos sirve? |
|---|--:|--:|--:|---|
| **fase 6** (deep link, rutas nuevas) | **+800 kB/nav** | +820 | 57 124 | **sí** — la curva es monótona |
| **fase 5** (tap de tab) | **+151 kB/tap** | +178 | 10 158 | **no** — oscila |
| **fase 7** (mapa vs sin mapa) | +665 | +428 | 16 372 | **ninguno de los dos** — son dos bloques distintos, se lee por bloque (§⑧) |

**⇒ tocando la barra: +0,15 MB por tap. Proyección al techo: ~1 160 toques.** Contra los **0,80 MB/nav** del deep link a rutas nuevas: **un quinto del ritmo.** *Y la fase 6 resiste la verificación: su pendiente por mínimos cuadrados y su delta de extremos coinciden (+800 vs +820), porque ahí la curva sí es monótona.*

### ⑮.1 🔴 ESTA SECCIÓN LA ESCRIBÍ TRES VECES, Y LAS DOS PRIMERAS ESTABAN MAL

*Lo dejo escrito porque el error es el mismo las tres veces y es el más caro de este lote.*

1. **Con 14 taps** vi `Views` **clavado en 2 782** y escribí *«la memoria queda PLANA»*. **Falso:** siguió subiendo a 3 501.
2. **Con 31 taps** calculé el delta de extremos y publiqué **0,26 MB/tap**. **Sesgado:** corté la serie en un punto alto; con 40 taps el último valor **bajó** (Views 3 662 → 2 796).
3. **Con 40 taps y mínimos cuadrados: +0,15 MB/tap.** *La mitad de lo que había dicho.*

⚠️ **La regla que sale de ahí, y vale para cualquier serie de este lote: en una serie que oscila, el delta de extremos no es la tendencia — es la tendencia más el ruido del punto donde cortaste.** *Se mide con todos los puntos o no se mide. Y el chequeo es barato: si la pendiente por mínimos cuadrados y el delta de extremos no coinciden, el delta de extremos no sirve.*

### ⑮.2 Qué queda del alcance

**Lo que el control SÍ estableció:** **la navegación humana también acumula** — ~0,15 MB por toque de tab. ⇒ **no puedo cerrar esto como «artefacto de mi instrumento»**, que era la conclusión hacia la que iba.

**Y un choque que dejo sin resolver, con su número:** tocando tabs crece **+151 kB/tap** sobre las **mismas 5 pantallas raíz**, mientras que repetir rutas **por deep link** daba **0,00** (§⑧). **Son dos formas de volver a la misma pantalla con resultados distintos, y no medí por qué.** *Candidato de lectura, sin medir: el tap hace `navigate` y puede re-montar, y `popToTop` no tenía nada que podar porque las raíces están en índice 0 (`if (destino.state.index ?? 0) > 0`).*

> **🔶 CONCLUSIÓN, marcada como hipótesis:** *el OOM es consistente con **acumulación por pantalla montada**, y esa acumulación **existe por deep link (0,80 MB/nav) y por toque (0,15 MB/tap)**. **Pero ninguno de los dos llega al techo de 192 MB en las ~67 navegaciones del barrido que cayó** (§⑭.1): harían falta ~218 o ~1 160. **Falta un factor, y no lo encontré.***

---

## ⑯ LO QUE NO ALCANCÉ A MIRAR

**Declarado para que nadie lo lea como medido.**

1. **El heap dump.** Herramientas presentes, parser escrito, **cero corridas**. No sé si mi parser funciona.
2. **Las 26 rutas con parámetro, como conjunto.** Probé 23 de ellas dentro de la corrida larga, pero **no medí el costo de cada una por separado**, así que no sé cuáles son las caras.
3. **Las tres rutas que descubrí caras y no investigué:** `cuenta/direccion` **+14,8 MB en una navegación** y `cuenta/documentos` **+6,2 MB**. *Sé que son caras y no sé por qué. `cuenta/direccion` monta el formulario con Places; `cuenta/documentos` compone papeles de mascota. Son el mejor punto de entrada si alguien quiere el detalle por pantalla.*
4. **El heap NATIVO, que crece mucho más que el de Java** (+728 MB de TOTAL PSS en 66 navegaciones) **y que no expliqué.** No corre contra el techo de 192 MB, así que **no es la causa del OOM de Java** — pero es un número grande sin dueño y podría ser lo que hace que el sistema mate el proceso por otra vía. **No lo investigué.**
5. **Un APK de producción.** Todo esto es dev build: carga el dev-launcher y trae el bundle por red. **La forma de la curva debería trasladarse; las magnitudes no.**
6. **iOS.** Cero.

---

## ⑰ LO QUE ESTE LOTE DEJA COMO MÉTODO

**Seis trampas, y las seis las pagué en esta corrida.**

1. 🔴 **Una secuencia que REPITE produce una curva plana, y una curva plana se lee como «no hay fuga».** *Si hubiera cerrado en la fase 3 —50 navegaciones, tabla que cierra sola, ciclos idénticos al kilobyte— habría reportado que el OOM no se reproduce. **El diseño de la secuencia decidía la conclusión, y era el diseño lo que estaba mal.***
2. 🔴 **Navegar a datos vacíos mide otra app.** Thor tiene **240 eventos**; mis fixtures, menos de 23. **Ninguna curva puede avisar de eso: las pantallas cargan, los controles pasan.** Lo único que lo destapa es **preguntarle a la base cuánto pesa lo que estás abriendo** (§⑨).
3. **El parser de `dumpsys meminfo` tiene una trampa en la columna que importa:** `$NF` es **Heap Free**, `$9` es **Heap Alloc**. *Lo delató un valor que no se movía nunca donde todo oscila* — y el mismo bug contaminó la tabla de la línea base (§⑦).
4. **`zsh` no hace word splitting** de `$VAR` sin comillas ⇒ un `for` corrió una vez con la lista entera como un elemento, **y el CSV salió con su fila**. **`mapfile` no existe en bash 3.2** ⇒ 0 rutas, y el log habría cerrado *«las 0 rutas sin caer»*. **Las dos las cazó una línea que imprime el conteo esperado**, no leer el código.
5. 🔴 **En una serie que OSCILA, el delta de extremos no es la tendencia — es la tendencia más el ruido del punto donde cortaste.** *Publiqué el mismo número tres veces y las dos primeras estaban mal: «plana» con 14 taps, «0,26 MB/tap» con 31 (corté en un punto alto), **0,15 MB/tap** con 40 y mínimos cuadrados.* **El chequeo es de una línea: si la pendiente por mínimos cuadrados y el delta de extremos no coinciden, el delta no sirve** — en la fase 6 coinciden (+800 vs +820) y por eso ahí el número resiste.
6. **Leer mi propio parte con cuidado falsó mi hipótesis más entusiasta.** Había construido la del `uiautomator dump` sobre el recuerdo de *«120 de 120 intentos»* — y la frase decía que eran del **detector de arranque**, no del barrido (§⑥).

---

## ⑱ LA EVIDENCIA CRUDA, PARA QUE ESTO SE PUEDA REHACER

**`docs/loop/medicion-s116-e-oom/` — 295 muestras en 7 CSV, más los scripts que las produjeron.**

| archivo | qué es | muestras |
|---|---|--:|
| `fase1.csv` | ¿el deep link apila Activities? | 11 |
| `fase3.csv` | 20 rutas **repetidas** en ciclo | 51 |
| `fase5.csv` | **40 toques de la barra de tabs** | 41 |
| `fase6.csv` | **66 rutas únicas estáticas** — la curva principal | 67 |
| `fase7.csv` | **mapa vs. sin mapa**, misma corrida | 31 |
| `fase8.csv` | fase 6 **+ `uiautomator dump`** | 10 |
| `fase10.csv` | **89 rutas únicas con ids reales × 2 pasadas** — la corrida larga | 84 |
| `muestra.sh` | el instrumento de muestreo *(con el bug de `$NF` ya curado y comentado)* | — |
| `fase5.sh` · `fase6.sh` · `fase10.sh` | los tres arneses, con sus controles de conteo adentro | — |
| `rutas-unicas.txt` · `rutas-param.txt` · `rutas-todas.txt` | las listas exactas que se recorrieron | 66 · 23 · 89 |
| `excluidas.txt` | las 12 rutas excluidas, **cada una con su razón** | 12 |

**Columnas de los CSV:** `nav · etiqueta · pid · dalvik_pss_kb · dalvik_alloc_kb · native_pss_kb · native_alloc_kb · total_pss_kb · views · viewroot · activities · appcontexts · assets · bitmap_n · bitmap_kb · hilos · okhttp_disp · okhttp_task`.

⚠️ **`dalvik_alloc_kb` es la columna que decide el OOM** (corre contra el `heapgrowthlimit` de 192 MB). `dalvik_pss_kb` oscila más y **no** es la que revienta.

---

## PIE

| | |
|---|---|
| **pista** | E |
| **rama** | `pista/s116-e-01` |
| **SHA vigente** | **`d1bb0a5a`** (`origin/main` al cerrar, traído bajo la rama) |
| **SHA de las mediciones** | **`ca564994`** — y los 9 commits que main avanzó **no tocan `apps/` ni `packages/`**, así que el código medido es el mismo |
| **código de app tocado** | **ninguno** — `git diff --name-only origin/main...HEAD -- apps packages` → **0** |
| **fecha de las mediciones** | **13-sep-2026**, entre las 11:00 y las 12:00 (-05) |
| **aparato** | AVD `s113_E` · `emulator-5560` · 1080×2400 @420dpi · `MemTotal` 4 062 432 kB · `heapgrowthlimit` **192m** |
| **binario** | `com.epetplace.cliente` **1.0.7**, `DEBUGGABLE`, instalado 2026-09-07 |
| **bundle** | servido por Metro desde `apps/cliente` del árbol primario en `main` `ca564994` **limpio** · verificado con `Android Bundled … (3062 modules)` |
| **navegaciones totales** | **~330** en siete corridas · **cero caídas** |
| **lo que este parte NO hizo** | ninguna cura, ninguna ficha de deuda, ninguna atribución de causa |
