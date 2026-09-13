# S116-E · LÍNEA BASE DE LA APP CLIENTE — cómo está HOY, medido

> **Rama `pista/s116-e-00` · SHA `ca564994ee55c1f33d00dd015ee21a4286c96dd3` (`ca564994`), que es `main` == `origin/main`.**
> Medido el **13-sep-2026**, worktree `/Users/guillo381gmail.com/proyectos/ePetPlace/e-petplace-s116-e`, árbol limpio al abrir.
> **Esto MIDE. No cura, no propone, no corrige.** Lo que encontré roto queda anotado, no tocado.
>
> **Para qué existe:** cada lote del rediseño se compara contra ESTO, no contra el recuerdo.
> Todo número lleva su comando. Todo cero lleva su control positivo. Lo que no se pudo medir va **NULL con su porqué** — jamás omitido en silencio.

---

## ⓪ EL PROTOCOLO DEL APARATO, Y LAS TRES COSAS QUE HACEN VÁLIDA UNA CAPTURA

Ninguna captura de este parte vale sin las tres. Se declaran acá arriba para que se puedan auditar, no al pie.

| condición | cómo se cumplió | evidencia |
|---|---|---|
| **AVD y puerto propios, `adb -s` siempre** | AVD `s113_E` (android-37.1, arm64, 2 GB) arrancado con `-port 5560`. **Todo** comando lleva `adb -s emulator-5560`. Nunca se corrió `adb reverse --remove-all`. | `adb devices -l` → `emulator-5560 device` |
| **La línea `Bundled` fechada DESPUÉS de arrancar Metro** | Metro propio en **puerto 8091** (no 8081), desde mi worktree. | Metro arrancó **09:54:23**; `Android Bundled 10186ms node_modules/expo-router/entry.js (3066 modules)` a las **09:55:27**. |
| **El pie de Cuenta identifica el bundle** | Dice **`metro · dev`**. | `capturas-s116-antes/cuenta-index-pie.png` |

**Y el puerto se verificó del objeto, no del log de arranque:** `lsof -nP -iTCP:8091 -sTCP:LISTEN` devuelve el `node` cuyo cwd es
`…/e-petplace-s116-e/apps/cliente`. *`expo start` con el puerto ocupado no falla: saltea el dev server y el aparato queda hablando con el Metro de otra pista, que sirve otro árbol.*

### 🔴 Qué bundle fotografié, dicho sin adorno

**Es un DEV BUILD sirviendo desde MI Metro, no el APK de producción con su OTA.** El pie lo dice (`metro · dev`) y el marcador `L-160` del log también: `[update] id=ninguno (embedded/dev) · embedded=false · canal=`.

**Por qué eso igual fotografía el código publicado, medido:**

```bash
git diff --name-only 5d83a413..ca564994 -- apps packages | wc -l   # → 0
```

`5d83a413` es el ancla del último OTA del cliente (`66683587`, runtime 1.0.7, S115). Entre ese ancla y `main` **cero archivos de `apps/` o `packages/`** cambiaron — los dos commits intermedios son documentación. ⇒ **el código de app que fotografío ES el que está publicado.**

**Lo que esto NO alcanza, y por eso va acá y no en una nota:** un dev build **no** reproduce los números absolutos de un APK de producción (arranque y memoria incluidos). Ver §①.4.

---

## ① LÍNEA BASE NUMÉRICA

Todo corrido el **13-sep-2026** sobre `pista/s116-e-00` @ `ca564994`, desde la raíz del worktree. Los pesos en «MB» son **MiB** (`du -k` ÷ 1024).

### ①.1 `verify:diseno`

```bash
node scripts/verify-diseno.mjs ; echo "EXIT DEL COMANDO = $?"
```
```
verify:diseno — VERDE (auto-prueba: 80 reglas encendieron; informativas declaradas: R9)
EXIT DEL COMANDO = 0
```

| qué | número | comando |
|---|--:|---|
| reglas que imprimen línea | **81** | `grep -cE '^R[0-9]+ ' <(node scripts/verify-diseno.mjs)` |
| reglas que se auto-prueban (producen su rojo) | **80** | de la línea de cierre del propio gate |
| informativas declaradas | **1** (R9) | ídem |
| constantes de baseline | **40** | `grep -cE '^const (BASE\|BASELINE)[A-Z0-9_]* *=' scripts/verify-diseno.mjs` |

**Los baselines que un rediseño va a mover, con su valor de hoy** (son el trinquete: sólo bajan):
`BASELINE_R47` = **39** · `BASELINE_R36` = **20** · `BASE_R78` = **11** · `BASELINE_R48` = **5** · `BASELINE_R39` = **6** · `BASELINE_R38` = **5** · `BASELINE_R44` = **3** · `BASELINE_R37` = **3** · `BASELINE_FADEIN` = **2** · `BASELINE_HEX` = **1** · `BASELINE_R40` = **1**.
Los demás (`R41 R45 R46 R49 R50 R52 R54 R55 R58 R59 R60 R79`, `ACCENT_CTA`, `VACIO_ENTERING`, `SIN_MOTOR`) están **en 0 y son duros** — un rediseño que los mueva sale rojo en el commit.

> **Reproduje los 81 y el EXIT 0 de forma independiente de `S116-B`, y coinciden.** Es un control cruzado, no una cita.

### ①.2 `verify:contrast`

```bash
npx tsx scripts/verify-contrast.ts ; echo "EXIT DEL COMANDO = $?"
```
```
436 pares verificados · 0 fallo(s)
GATE WCAG: OK — los tres temas base + las DOS casas de oficio pasan.
EXIT DEL COMANDO = 0
```

| qué | número |
|---|--:|
| pares medidos | **436** |
| pares en rojo | **0** |

🔴 **Éste es el número que el rediseño tiene que volver a poner en cero, y no se hereda: la lista de pares se escribe a mano.** Un par nuevo que nadie declare **no se mide**, y su ausencia da verde. *El 0 de hoy dice «los 436 declarados pasan», jamás «la paleta es accesible».*
⚠️ Aparte corre **R12** dentro de `verify:diseno`, con **otro corpus** (168 pares) y **1 regresión abierta** del tapiz al 8 % esperando firma del founder. **Son dos gates distintos sobre la misma materia; el rediseño los mueve a los dos.**

### ①.3 Bundle del cliente, por plataforma

```bash
cd apps/cliente && npx expo export --platform android --output-dir <tmp>/dist-android
cd apps/cliente && npx expo export --platform ios     --output-dir <tmp>/dist-ios
du -sh <dist> ; find <dist> -name '*.hbc' -exec du -k {} \; ; du -sk <dist>/assets
```

| | **android** | **ios** |
|---|--:|--:|
| export completo | **13 MB** | **12 MB** |
| bundle JS (`.hbc`) | **11,03 MB** | **10,84 MB** |
| assets | **1,63 MB** | **0,70 MB** |
| **fuentes dentro del bundle** | **1392 kB · 7 archivos** | **456 kB · 6 archivos** |

**Las fuentes se identificaron POR CHECKSUM contra `node_modules`, no por nombre** — los assets del export se llaman por hash y **`strings` no lee la tabla de nombres de un TTF** (vive en UTF-16 y `strings` es ASCII: devolvió `<sin nombre legible>` en los 7).

```bash
# índice: shasum de los 51 .ttf/.otf de node_modules; después, cada asset-fuente del export contra ese índice
```

| peso | archivo (por checksum) | ¿lo declara `fonts.ts`? |
|--:|---|---|
| **936 kB** | `MaterialSymbols_400Regular.ttf` | 🔴 **NO** |
| 116 kB | `JetBrainsMono_400Regular.ttf` | sí |
| 116 kB | `JetBrainsMono_500Medium.ttf` | sí |
| 56 kB | `DMSans_300Light.ttf` | sí |
| 56 kB | `DMSans_400Regular.ttf` | sí |
| 56 kB | `DMSans_500Medium.ttf` | sí |
| 56 kB | `DMSans_700Bold.ttf` | sí |

**Las seis declaradas suman 456 kB exactos**, que es lo que pesan en disco — la cura de `S94-PERF` (importar por peso y no por familia) **sigue viva**: en `node_modules` hay **34 `.ttf`** de esas dos familias (**6,7 MB**) y sólo viajan 6.

🔴 **Y el hallazgo: `MaterialSymbols` (936 kB) viaja en Android y NO en iOS.** Es **`D-735`**, que el canon daba por muerta *«en la próxima build nativa»* — **sigue en el bundle exportado**, que es lo que publica un OTA. **Es el 67 % del peso de fuentes de Android y el 57 % de sus assets.** No la toqué.

### ①.4 Arranque hasta el Hogar y memoria a los 120 s

**Aparato:** AVD `s113_E` · emulator-5560 · android-37.1 arm64 · 2 GB RAM · **dev build 1.0.7 + Metro**.

🔴 **Lo primero, porque cambia cómo se lee todo lo de abajo: estos números NO son comparables con los de `D-1074`,** que se midieron en el **APK 1.0.7 de producción del aparato del founder**. Un dev build carga el dev-launcher y trae el bundle por red. **Lo comparable es la FORMA (plana vs. creciente), no la magnitud.**

```
ARRANQUE_HASTA_HOGAR_MS = 7793     (corrida 1)
```

**Cómo se detectó el Hogar, y por qué no con la herramienta obvia:** `uiautomator dump` **falla siempre en esta app** — `ERROR: could not get idle state`, **120 de 120 intentos**. La app **nunca queda en reposo**: el orbe del Coach anima sin parar. ⚠️ *Y su modo de falla es traicionero: `cat` del volcado imprime igual el archivo ANTERIOR, así que un arnés que no borre el archivo antes lee una pantalla vieja y no se entera.* El detector que sí sirve es **por píxel**: saturación media de la banda `y=150..700` — **Hogar = 94 · sin Hogar = 0**, umbral 50.

| s desde el lanzamiento | Dalvik PSS | Dalvik Alloc | Native PSS | TOTAL PSS | hilos |
|--:|--:|--:|--:|--:|--:|
| 10 | 19 296 kB | 35 883 kB | 508 010 kB | 763 955 kB | 105 |
| 20 | 19 776 | 35 979 | 506 730 | 763 159 | 103 |
| 30 | 19 648 | 35 947 | 506 698 | 763 046 | 103 |
| 45 | 20 672 | 36 075 | 507 866 | 764 614 | 101 |
| 60 | 20 608 | 36 043 | 507 498 | 764 166 | 100 |
| 90 | 22 304 | 36 203 | 507 818 | 763 309 | 78 |
| **120** | **22 560 kB ≈ 22,0 MB** | 36 203 | 507 866 | 763 502 | **76** |

🟢 **LA CURA DE `D-1074` ESTÁ VIVA, y esto es lo que había que dejar visto.** Dalvik va de **19,3 a 22,0 MB en 120 s** — +3,3 MB y **estable**, con los hilos **bajando** (105 → 76). El gate de `S115` sobre el APK de producción decía *«cliente 21 MB planos a los 120 s»*: **la forma coincide y la magnitud queda a 1 MB**. El defecto original hacía **67 → 485 MB con OOM a los 2 min 12 s**; nada de eso aparece.
⚠️ **Lo que este número NO prueba:** que no haya fuga en una pantalla que no visité. Mide **el Hogar en reposo**, que es donde `D-1074` reventaba, y nada más.

**Arranque, TRES corridas** (una corrida no es una medición):

```
CORRIDA 1 · 7793 ms     CORRIDA 2 · 7659 ms     CORRIDA 3 · 6859 ms
```
⇒ **rango 6,9 – 7,8 s** hasta que el Hogar pinta, en dev build sobre emulador. **No es el número del usuario**: un APK de producción no trae el bundle por red.

### ①.5 Qué corre hoy sobre el cliente

**El censo del hook se hace sobre el hook SIN COMENTARIOS**, porque un `grep` crudo lee un comentario como código (`L-170`):

```bash
sed 's/#.*$//' .githooks/pre-commit | grep -oE 'scripts/[a-z0-9_/-]+\.(mjs|mts|ts)' | sort -u | wc -l   # → 9
```

🔴 **Son NUEVE gates en el pre-commit, no once.** `verify:censo` y `verify:voz-por-tipo` aparecen en el archivo **sólo dentro de comentarios que explican por qué NO están ahí** (exigen la DB, y un gate que exige red se saltea por costumbre). Con los comentarios borrados los dos dan **cero ocurrencias**.

| control | resultado |
|---|---|
| positivo — ¿el instrumento ve lo que sí está? | `verify-diseno.mjs` aparece **3** veces con comentarios borrados ✓ |
| negativo — ¿ve lo que no está? | `censo`/`voz-por-tipo` → **0** ✓ |

> ⚠️ **`S116-B` §④ publica once.** Lo digo por el hecho, no contra la pista: **mi primer censo se equivocó en la dirección contraria** (buscando `verify:<nombre>` me perdí `verify-jornada-completa`, que el hook invoca por ruta de archivo). *El instrumento que acierta es el que borra comentarios **y** acepta las dos formas de invocación; cualquiera de las dos mitades sola miente.*

---

## ② LÍNEA BASE VISUAL

### ②.1 El universo, medido

```bash
find apps/cliente/src/app -name '*.tsx'                      | wc -l   # 112 archivos del router
find apps/cliente/src/app -name '_layout.tsx'                | wc -l   #   7 _layout
# ⇒ 105 pantallas
```

| | número |
|---|--:|
| archivos del router | 112 |
| `_layout` | 7 |
| **pantallas** | **105** |
| — de ellas, **estáticas** | **79** |
| — de ellas, **con parámetro** `[...]` | **26** |

*(Coincide con el censo de `S116-B` §⑤, medido por separado.)*

### ②.2 Cómo se recorrió: por deep link, no a dedo

**Los deep links del esquema `cliente://` navegan** — probado con `cliente:///buscar`, que abre «Buscar en tu familia». Eso es lo que hace viable recorrer 105 rutas; a dedo no se termina.

```bash
adb -s emulator-5560 shell am start -a android.intent.action.VIEW -d "cliente:///<ruta>"
sleep 4 ; adb -s emulator-5560 exec-out screencap -p > <ruta>.png
```

🔴 **Y el barrido se cayó en su primera corrida, en silencio:** capturó **1 de 79** y su última línea decía `BARRIDO TERMINADO`. **`adb` consume stdin**, así que dentro de un `while read` se come la lista y el bucle corre una sola vez. *Lo cazó contar los archivos, no leer la salida — que decía «terminado» y era verdad.* Curado con `</dev/null` en cada `adb`; queda escrito adentro del script.

### ②.3 🔴 LA APP SE CAYÓ CON `OutOfMemoryError` A MITAD DEL RECORRIDO

**No lo fui a buscar: apareció recorriendo.** A las **10:13:51**, después de ~60 navegaciones seguidas, el proceso murió:

```
09-13 10:13:51.951 E/AndroidRuntime( 6152): FATAL EXCEPTION: OkHttp Dispatcher
09-13 10:13:51.951 E/AndroidRuntime( 6152): Process: com.epetplace.cliente, PID: 6152
09-13 10:13:51.951 E/AndroidRuntime( 6152): java.lang.OutOfMemoryError: Failed to allocate a 24 byte
  allocation with 356816 free bytes and 348KB until OOM, target footprint 201326592,
  growth limit 201326592; giving up on allocation because <1% of heap free after GC.
	at okhttp3.internal.connection.RealCall$AsyncCall.run(RealCall.kt:513)
```

**Lo que quedó establecido, y nada más que eso:**
- El proceso **murió por OOM** contra un techo de heap de **192 MB** (`target footprint 201326592`).
- Android levantó **`DevLauncherErrorActivity`** en su lugar ⇒ **51 capturas salieron del dev launcher** y hubo que rehacerlas (44 detectadas en la primera pasada, **7 más que aparecieron después** — las del barrido dinámico, que corrió con la app ya caída).
- **Se reprodujo**: volvió a caer durante la re-captura, lo que obligó a un barrido que se cura solo (relanza al detectar el launcher).

🔴 **Lo que NO establecí, y no lo voy a insinuar: la causa.** *Una pila de `OutOfMemoryError` dice **dónde estaba el hilo** cuando no pudo reservar, **no quién consumió la memoria*** (`L-557`, que el canon dice haberse cobrado tres veces). Que el frame sea `OkHttp Dispatcher` **no señala a la red**: señala que a un hilo de red le tocó la asignación que ya no entraba.

**Y una distinción que importa para no leer esto como una regresión de `D-1074`:** la medición de §①.4 dejó la memoria **plana en 120 s en el Hogar en reposo**. Esto aparece **bajo navegación sostenida**, que es otro régimen. **Son dos hechos y no se contradicen.**

⚠️ **Los tres límites de este hallazgo, para que nadie lo agrande:**
1. **Es un dev build**, que carga el dev-launcher y trae el bundle por red — más pesado que un APK de producción.
2. **~60 rutas en pocos minutos no es uso normal**; es un barrido de instrumentación.
3. **No medí el crecimiento durante el barrido** — sólo tengo el techo y el momento de la caída. *Reconstruirlo pide muestrear memoria mientras se navega, y eso es otra corrida.*

**Va como anotación, no como cura.** Lo que sí deja es un método: **cualquier barrido automatizado sobre esta app necesita detectar el launcher y relanzar**, o entrega capturas falsas que se ven perfectamente creíbles.

### ②.4 Los estados difíciles: qué pude producir y qué no

**La consigna era capturarlos si podía producirlos, y declararlos NULL con su porqué si no. Acá está el reparto.**

| estado | ¿se produjo? | cómo / por qué no |
|---|---|---|
| **memorial** | ✅ **sí** | La familia tiene **dos mascotas `fallecida`** — **Sombra** (`93553b79…`) y **Bruma** (`77a209a1…`), las dos marcadas `fixture_founder_s113`. `hogar/mascota/93553b79…` monta el tema memorial. |
| **lista vacía** | ✅ **sí, varias** | Salieron solas en el barrido (`adoptar/refugios` con un solo refugio, `postventa/mis-casos`, `cuenta/recurrentes`). **No las fabriqué: son el estado real de esta familia.** |
| **sesión cortada** | ✅ **sí** | `bienvenida.png` y `login.png` se capturaron **antes de entrar**, con la app sin sesión. Es el estado real, no simulado. |
| **placa sin activar** | ✅ **sí** | La tabla `pasaporte_placa` tiene tokens en los dos estados: uno con `mascota_id` y dos sin. Capturé **los dos**. |
| **error de red** | ❌ **NULL** | **No lo produje.** Cortar la red del emulador (`svc data disable` / modo avión) es fácil, pero **la app estaba sirviéndose de Metro por `adb reverse`**: cortar la red del aparato **también corta el bundle**, y lo que se fotografía entonces es el dev-client caído, no la pantalla de error de la app. **Hacerlo bien pide un APK de producción, y no lo tengo.** Queda para quien tenga el binario. |
| **crash / pantalla caída** | ✅ **sí, sin buscarlo** | El OOM de §②.3. La pantalla que aparece es la del **dev launcher**, no una de la app — o sea que **no sé qué ve un usuario de producción cuando esto pasa**. |

### ①.5b Los gates, corridos: los 9 del hook y 15 arneses del cliente

Cada uno con **límite de 90 s** — *un arnés colgado no puede llevarse la corrida entera, y su silencio se lee igual que un verde.*

**LOS 9 DEL HOOK — los nueve VERDES (EXIT 0):**

| gate | salida |
|---|---|
| `verify:diseno` | VERDE · 80 reglas encendieron |
| `verify:vio-todo` | VERDE · los 6 casos |
| `verify:jornada-completa` | VERDE · 0 deudas declaradas |
| `verify:rutas-de-aviso` | VERDE · 4 emitibles, todas con destino |
| `_censo-hoisting-nativo` | ✅ 0 fuera de declaración |
| `verify:ref-antes-de-uso` | VERDE |
| `verify:fila-memoizada` | VERDE |
| `verify:sin-byte-nul` | ✓ 4889 archivos · sonda VERDE |
| `verify:gates-existen` | EXIT 0 |

**LOS ARNESES DEL CLIENTE — 🔴 CUATRO EN ROJO, y ninguno corre en el hook:**

| gate | EXIT | qué dice |
|---|--:|---|
| `verify:contador-piezas` | 0 | 6 fuentes · 2 sujetos |
| `verify:hooks` | 0 | ningún hook fuera de las reglas |
| `verify:tdz` | 0 | 726 archivos |
| `verify:carnet` | 0 | 143 verdes · 0 rojos |
| `verify:perfil` | 0 | 73 verdes · 0 rojos |
| `verify:vida` | 0 | 45 verdes · 0 rojos |
| **`verify:razon-muda`** | **1** | **«EL NÚMERO SUBIÓ: 139 → 140»** · trinquete solo-baja · 140 frenos mudos en 76 archivos |
| **`verify:voz-sin-hueco`** | **1** | **13 sin declarar contra baseline 10 ⇒ 3 voces NUEVAS** que pueden salir rotas. Una con nombre y línea: `apps/cliente/src/app/citas/[mascotaId].tsx:434`, donde `negocio` puede quedar vacío y la frase sale **«… algo de ,»** |
| **`censo-habla-en-presente`** | **1** | `hogar/mascota/[mascotaId].tsx:1417` dice la edad en presente («~11 años») y `:1445` el peso vigente — **de una mascota que no está** |
| **`censo-pide-en-memorial`** | **1** | 19 frases de acción, **2 fuera del guard**. Su **control positivo**: 10 frases plantadas, las ve las 10 ✓ |

🔴 **Esto es lo más accionable del parte, y no es el rediseño: son cuatro rojos VIVOS en `main` hoy.** Dos de ellos son **trinquetes que ya se dispararon** (`razon-muda` 139→140, `voz-sin-hueco` 10→13): alguien introdujo casos nuevos **después** de que se fijara el baseline, y **el trinquete hizo exactamente su trabajo — sólo que nadie estaba mirando**, porque estos cuatro **no están en el pre-commit**.

⚠️ **No los curé** (mi encargo es medir). Pero el rediseño va a tocar justo esos archivos, así que la línea base los deja nombrados con archivo y línea.
**Y uno toca directamente lo que S116 va a rediseñar** — pero acá mi propia captura corrige la lectura fácil, así que lo digo con el matiz puesto:

`censo-habla-en-presente` marca **8 sitios** de `hogar/mascota/[mascotaId].tsx` donde un dato vivo (edad, peso) viaja a una pieza sin guard de memorial. **Su línea más citable dice que la edad sale «~11 años», en presente.** 🔴 **Y la pantalla que fotografié dice «tenía ~11 años» — en pasado.** *El gate es un censo ESTÁTICO: marca el dato que fluye sin guard, no el texto que sale. Al menos el caso visible está resuelto.*
⇒ **El rojo es real y el gate hace su trabajo; lo que NO se puede leer de él es «la app habla en presente de quien no está».** Para saber cuáles de los 8 llegan a pantalla hay que caminarlos uno por uno, y eso no lo hice (§④).

### ②.5 El tema oscuro: 12 pantallas

El tema lo resuelve el sistema (`useColorScheme`, `D-305`), así que se cambia en el emulador y se vuelve a recorrer:

```bash
adb -s emulator-5560 shell "cmd uimode night yes"     # ⚠️ CON comillas
```

🔴 **Sin las comillas devuelve `Night mode: no` y NO falla** — mi primer intento produjo 0 capturas oscuras y el script decía haber corrido. *Otra que miente sin romperse.*

Cubiertas (prefijo `OSCURO-`): **hogar · explorar · despensa · pedidos · cuenta · hogar/mascota/THOR · hogar/mascota/SOMBRA (memorial) · carnet · nexo · avisos · cuenta/facturas · adoptar**.
**Verificado que el tema de verdad cambió**, no sólo el ajuste: el brillo medio del cuerpo del Hogar pasa de **~245 a 28**.
**Y hay una diferencia de marca que la línea base tenía que registrar: la pestaña activa es magenta en claro y ORO en oscuro.**
**El emulador quedó devuelto a claro** (`Night mode: no` al cerrar).

### ②.6 El recuento final, y sus controles

| | |
|---|--:|
| capturas | **118** |
| — en tema oscuro | 12 |
| imágenes distintas por checksum | **117 de 118** |
| capturas que quedaron en el dev launcher | **0** |

**El único par idéntico es `registro.png` = `verificar-correo.png`:** `/verificar-correo` muestra la pantalla de **«Crear cuenta»**. **No establecí si es un redirect por diseño o una ruta que no monta lo suyo** — las dos explicaciones producen la misma imagen y no fui al código.

**Rutas sin captura: 1 de 105.** `pedidos/serie/[serieId]` — NULL, sin id (§④.7).

---

## ③ LO QUE ENCONTRÉ Y NO TOQUÉ

**Anotado, no curado.** Cada uno con su medición; ninguno es una propuesta.

### ③.1 🔴 `D-735` sigue viva: 936 kB de `MaterialSymbols` viajan en Android

Medido por checksum en §①.3. **El canon la daba por muerta *«en la próxima build nativa»*; está en el bundle exportado, que es lo que publica un OTA.** Viaja **sólo en Android** (iOS trae 6 fuentes, Android 7). Es el **67 %** del peso de fuentes de Android.

### ③.2 🔴 Cuatro gates en rojo en `main`, y ninguno corre en el hook

Detalle en §①.5b. Dos son **trinquetes ya disparados** (`razon-muda` 139→140 · `voz-sin-hueco` 10→13). *El mecanismo funcionó; lo que falta es que alguien lo corra.*

### ③.3 🔴 La app cae con OOM bajo navegación sostenida

§②.3. Causa **no** establecida, y lo digo antes de que alguien la deduzca de la pila.

### ③.4 El censo de «mascotas reales» sobre-cuenta 4,5×

```sql
select count(*) filter (where creado_por_sistema is null)                       -- 9
     , count(*) filter (where creado_por_sistema is not null)                   -- 14
     , count(*) filter (where creado_por_sistema is null
                        and (nombre ilike 'prueba%' or nombre in ('Pp','Tt')))  -- 7
     , count(*)                                                                 -- 23
from mascotas where familia_id in (…familia de guillo381+8…);
```

La regla de la casa dice excluir `creado_por_sistema IS NOT NULL`. Aplicada acá da **9 «reales»** — pero **7 de esas 9 son de prueba por su propio nombre** (`PruebaC12896`, `PruebaC24772`, `PruebaC37493`, `PruebaC76663`, `PruebaC82896`, `Pp`, `Tt`). **Las reales son 2: Thor y Zeus**, como dice el canon.
⇒ **La marca de `S113` quedó incompleta**, y el censo que ella misma habilita **cuenta 9 donde hay 2**. *Es la misma clase que `S92` midió cuando descubrió que el 80 % de las familias eran sonda.* No las marqué: tocar datos de la familia del founder no es mío.

### ③.5 `scripts/medir-arranque-hogar.mjs` entra con la cuenta equivocada

Ese instrumento (S74, `D-497`) hace login con `EXPO_PUBLIC_DEMO_EMAIL`, que hoy vale **`demo-prestador@epetplace.dev`** — la cuenta del **prestador**. Quien lo corra creyendo que mide el Hogar de una familia **mide otra cosa**. *Además mide peticiones de red en **web** con Playwright, no arranque en Android: no es sustituto de §①.4, es otra pregunta.*

### ③.6 `uiautomator dump` no sirve en esta app, y su fallo no se nota

`ERROR: could not get idle state` — **120 de 120**. La app nunca queda en reposo. ⚠️ **Y `cat` del volcado imprime igual el archivo anterior**, así que un arnés que no borre antes lee una pantalla vieja y reporta con confianza. **El detector que sí sirve es por píxel** (§①.4).

### ③.7 Las fotos de las mascotas no cargaron en el emulador

El log lo dice con todas las letras, repetido:

```
W/ReactNativeJS: [AvatarMascota] «Thor»: la foto NO CARGÓ y el avatar cae a la huella
  — que se ve igual que «no tiene foto». Si la URL estaba firmada, la firma pudo vencer
  o el objeto no existe.
```

**No establecí si es del emulador o del dato** — por eso va como anotación. *Lo que sí vale para el rediseño: la propia pieza declara que su caída **se ve igual que «no tiene foto»**, o sea que el modo de falla es mudo.* Y en el Hogar las fotos **sí** cargaron (se ven Thor, Zeus y Jack), así que no es general.

---

## ④ LO QUE NO ALCANCÉ A MIRAR

Declarado para que nadie lo lea como medido.

1. **El tema oscuro quedó cubierto SÓLO en 12 pantallas** (§②.5), no en las 105. El resto de la línea base visual es en claro.
2. **Cero capturas de iOS.** Medí su **bundle** (§①.3) pero no lo corrí: no levanté simulador. Las 4 variantes `.web.tsx` tampoco.
3. **El estado de error de red** — NULL con su razón en §②.4.
4. **Los 8 sitios de `censo-habla-en-presente`, uno por uno.** Sé que el visible está en pasado; **no sé cuáles de los otros 7 llegan a pantalla**.
5. **Si el tema memorial se aplica como debe.** Lo medí y la pregunta queda ABIERTA con número: el fondo del cuerpo en memorial da **RGB(244,244,244)** contra **(237,237,237)** de una mascota viva en claro, y **(17,13,20)** contra **(25,21,30)** en oscuro. **Hay diferencia y es chica.** No comparé esos valores contra `memorial.ts`: **no sé si es lo firmado o es un tema que casi no se nota.** *Lo dejo medido en vez de opinado porque es justo una decisión de rediseño.*
6. **La causa del OOM.** Sólo tengo el techo y el momento. Reconstruirlo pide muestrear memoria **durante** la navegación.
7. **`pedidos/serie/[serieId]`** — **no encontré la tabla que la alimenta** (cero tablas con `recurrent|serie` en el esquema). **No inventé un id.**
8. **Rendimiento por pantalla.** No medí tiempo de render ni peticiones por pantalla. El instrumento de `S74` para eso mide en web y con la cuenta equivocada (§③.5).
9. **Accesibilidad en el aparato**: lector de pantalla, escala de fuente grande, área táctil. `verify:contrast` mide **pares declarados en el código**, que no es lo mismo que lo que se ve.
10. **La app del prestador.** Fuera de mi encargo; comparte **91 símbolos** de `packages/ui` con el cliente (censo de `S116-B`), así que el rediseño la alcanza.
11. **No verifiqué la rama de `S116-B` contra `origin`**: su worktree existe en disco pero `git ls-remote origin 'refs/heads/pista/s116-*'` **no devuelve nada** — su trabajo **no está empujado**. Leí su parte del worktree local.
12. **No corrí los ~115 `verify:*` restantes.** Corrí 24 (§①.5b). Muchos exigen DB o red y su rojo/verde depende del ambiente.

---

## ⑤ EL ÍNDICE DE LAS CAPTURAS

Viven en **`docs/loop/capturas-s116-antes/`**, una por ruta, nombradas por ruta (las barras pasan a guiones).
**El índice fila por fila —archivo · ruta · con qué datos · peso— está en `capturas-s116-antes/INDICE.md`**, y el **SHA, el aparato y el bundle van en su cabecera porque son los mismos para las 118**. No lo repito acá para que este parte se pueda leer.

**Convención de nombres:**

| forma | qué es |
|---|---|
| `hogar-bitacora.png` | ruta estática `/(tabs)/hogar/bitacora` |
| `hogar-mascota-THOR.png` | ruta con parámetro, resuelta con un id **real** — el nombre dice **cuál** |
| `hogar-mascota-SOMBRA-memorial.png` | ídem, y además nombra el **estado** que vino a producir |
| `OSCURO-*.png` | la misma pantalla con el sistema en **tema oscuro** |

**Todas son del mismo bundle**: dev build 1.0.7 + Metro en 8091, código `ca564994`, tomadas el 13-sep-2026 entre las 09:55 y las 10:45 en `emulator-5560`.

---

## ⑥ LA TABLA CONTRA LA QUE SE COMPARA CADA LOTE

Esto es el parte entero en una pantalla. **Si un lote del rediseño mueve alguno de estos números, que lo diga; si no lo dice, se lo va a encontrar el siguiente.**

| qué | valor hoy (`ca564994`) | comando |
|---|--:|---|
| reglas de `verify:diseno` · exit | **81** · **0** | `node scripts/verify-diseno.mjs` |
| baselines del lint | **40** | `grep -cE '^const (BASE\|BASELINE)…' scripts/verify-diseno.mjs` |
| pares de contraste · fallos | **436** · **0** | `npx tsx scripts/verify-contrast.ts` |
| bundle android `.hbc` | **11,03 MB** | `npx expo export --platform android` |
| bundle ios `.hbc` | **10,84 MB** | `npx expo export --platform ios` |
| fuentes en el bundle android | **1392 kB · 7** | checksum contra `node_modules` |
| fuentes en el bundle ios | **456 kB · 6** | ídem |
| arranque hasta el Hogar (dev build) | **6,9 – 7,8 s** | 3 corridas, detector por píxel |
| Dalvik a los 120 s, Hogar en reposo | **22,0 MB, plana** | `dumpsys meminfo` |
| pantallas del cliente | **105** (79 + 26) | `find apps/cliente/src/app -name '*.tsx'` |
| gates del pre-commit · en rojo | **9** · **0** | hook sin comentarios |
| arneses del cliente corridos · en rojo | **15** · **4** | §①.5b |
| typecheck api · ui · cliente · prestador | **0 · 0 · 0 · 0** | `npx tsc --noEmit` por paquete |
| typecheck `domain` | **12**, todos de `node_modules/@types` | ídem — rojo de entorno declarado desde S45 |

---

## ⑦ LOS COMANDOS, PARA QUE CUALQUIERA REHAGA LA CUENTA

```bash
# ⓪ el aparato
emulator -avd s113_E -port 5560 -no-snapshot-load
adb -s emulator-5560 reverse tcp:8091 tcp:8091
cd apps/cliente && npx expo start --port 8091          # y CONFIRMAR el "Bundled" en su log
lsof -nP -iTCP:8091 -sTCP:LISTEN                       # que el Metro sea el TUYO
adb -s emulator-5560 shell am start -a android.intent.action.VIEW \
  -d "cliente://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8091"

# ① los números
node scripts/verify-diseno.mjs ; echo "EXIT=$?"
npx tsx scripts/verify-contrast.ts ; echo "EXIT=$?"
cd apps/cliente && npx expo export --platform android --output-dir <tmp>/dist-android
cd apps/cliente && npx expo export --platform ios     --output-dir <tmp>/dist-ios
for p in packages/api packages/ui packages/domain apps/cliente apps/prestador; do
  (cd $p && npx tsc --noEmit); echo "$p EXIT=$?"; done
sed 's/#.*$//' .githooks/pre-commit | grep -oE 'scripts/[a-z0-9_/-]+\.(mjs|mts|ts)' | sort -u

# ② las capturas (una ruta)
adb -s emulator-5560 shell am start -a android.intent.action.VIEW -d "cliente:///<ruta>" </dev/null
sleep 4 ; adb -s emulator-5560 exec-out screencap -p </dev/null > <nombre>.png
adb -s emulator-5560 shell "cmd uimode night yes"      # ⚠️ CON comillas, si no el argumento no viaja

# ③ los ids reales (la familia de prueba)
npx supabase --experimental db query --linked --file <consulta>.sql
```

**Los instrumentos de este parte viven en el scratchpad de la sesión, no en el repo** — salvo los que valga la pena cablear. *Un número que se mide una vez y no tiene comando en git es lo que `D-1015` prohíbe publicar; por eso arriba está el comando de cada uno.*

### Las cuatro trampas que este parte pagó, para que el próximo no

1. **`adb` consume stdin** ⇒ dentro de un `while read` se come la lista y el bucle corre **una vez**, diciendo «terminado». `</dev/null` en cada `adb`.
2. **`uiautomator dump` nunca llega a idle en esta app** ⇒ falla siempre, y `cat` imprime el volcado **anterior**. Detector por píxel.
3. **`adb shell "cmd uimode night yes"` necesita comillas** ⇒ sin ellas devuelve `Night mode: no` **sin error**.
4. **Un barrido largo cruza el crash** ⇒ **51 capturas** salieron del dev launcher y **se veían perfectamente creíbles**. Hay que detectar el launcher por actividad en foco y relanzar.

