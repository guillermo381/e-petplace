# PARTE DE LA PISTA C · S106 · CIERRE

**Worktree:** `../e-petplace-s106-c-cierre` · **rama:** `pista/s106-c-cierre`
**Base:** `main = 7958fb09` · **rama en origin verificada por SHA** al abrir.

**Frenos permanentes:** la DB la escribe sólo A (todo SQL sale como pedido
autocontenido, 76b) · piezas de B por pedido, jamás inline · ninguna key en el
repo.

**⚠️ La ley que esta sesión pagó cuatro veces, y me la aplico:** una pieza
**entregada** y una pieza **montada** son dos hechos distintos. Antes de decir
«construido», verifico el montaje. **Y jamás digo «curado»: eso lo dice el
dedo del founder.**

---

## ✅ ACTO 1 · EL SERVICIO PRESELECCIONADO — construido (`a6f268c1`)

Detalle en el mensaje del commit. Los dos criterios que la mesa registró:

- *Un default en el campo que decide **qué se compra** no es una comodidad: es
  una decisión tomada en nombre de alguien que no la tomó.*
- *Un vacío que **no puede dañar** es más robusto que cuatro caminos
  auditados.*

---

## ☠️ FICHA `D-944` — EL VOSEO VUELVE, Y YA NO SON DESCUIDOS

**⚠️ Nace como `D-943` y se renumera ANTES de mergear.** Ese número lo tomó A
para su ficha del giro de cámara mientras yo escribía — *el precedente `D-757`
exacto: un número vivo en artefactos sin ficha depositada, que la sesión
siguiente encuentra ocupado.* **Corregido cuando todavía no costaba nada.**

**Re-medido contra `origin/main` fresco y contra TODAS las ramas remotas:**
`D-943` tomada · **`D-944` libre**. *Medir sólo contra el archivo de deudas no
habría alcanzado — el número de A ya vivía en su rama antes de estar en la
ficha, que es exactamente cómo se produce la colisión.*

### El hecho

**Es la CUARTA vez que el voseo reaparece después de una barrida**, con
**manos distintas** — la última fui yo, escribiendo *«Elegí qué necesita…»* en
una key nueva del cliente. `R66` lo frenó sobre su baseline de 2.

### 🔴 La lectura, que es lo que esta ficha aporta

**Cuatro veces con cuatro manos no son cuatro descuidos: es que algo lo
reintroduce.** Barrer por quinta vez trataría el síntoma otra vez.

*Y el trinquete tampoco lo explica: `R66` dice «no creció», que es su trabajo
y lo hace bien — pero un guard que frena la reincidencia no responde por qué
alguien reincide.*

**Las hipótesis de origen que alguien debería medir, ninguna verificada:**
① el español rioplatense es el registro natural de la mesa, y la voz de
producto es tuteo neutro por decisión (L-148) ⇒ **cada string nuevo nace en el
registro equivocado y depende de acordarse** · ② la regla vive en el CONTRATO
y en `L-148`, **no al lado de donde se escriben las keys** · ③ el ejemplo más
cercano a la mano —los diccionarios— tiene ~50 cadenas en voseo **en galería**,
que no cuentan para el trinquete **pero sí se leen como referencia**.

### Por qué NO se cura ahora

**El trinquete está haciendo su trabajo y no urge.** Y curar el síntoma sin
mirar el origen es exactamente lo que produjo las cuatro barridas.

**Disparo:** la próxima vez que `R66` frene a alguien — ahí hay un caso fresco
con su autor presente, que es cuando el origen se puede medir en vez de
suponer.

---

## ⚠️ ACTO 2 · EL AVISO DE LA BUILD, temprano y con su lista

### 🔴 SÍ EXIGE BUILD, y ahora está confirmado con el literal

Medido en el fork: **`VideoTrackAdapter.java:82` ya recibe
`onFrame(VideoFrame frame)`** en cada llamada, y lo usa **sólo para detectar
mute/unmute**. Exactamente lo que D dijo: *no falta el acceso, falta la
conversión.*

Y medido del otro lado: **el fork NO expone nada de frames desde JS**
(`MediaStreamTrack.d.ts` — cero `addSink`, cero `onFrame`).

⇒ **La conversión es código nativo nuevo. Nada de eso viaja por OTA**, y **la
prueba barata tampoco**: su parte cara *es* la nativa.

### 🔴 QUÉ DEBERÍA LLEVAR LA BUILD ÚNICA — para que no haya una segunda

*El moto g31 espera una, así que lo caro no es la build: es descubrir después
que le faltó algo.* Lo que hay hoy que **sólo** viaja horneado:

| # | Qué | Estado |
|---|---|---|
| ① | **El módulo del cuadro congelado** (Android + iOS) | lo que motiva la build |
| ② | ~~`softwareKeyboardLayoutMode: "pan"`~~ | ☠️ **RETIRADO — la hipótesis está descartada** |

### ☠️ EL `"pan"` SALE, y la corrección es mía

**El crash al escribir YA ESTÁ CURADO**, y no era el teclado: era **un worklet
de `ModalDosAlturas` llamando a JS desde el hilo de UI** — lo curó A en
`3797a779`, publicado en `01a041a2`.

⇒ **Mi hipótesis quedó falsada, y no tengo otra razón para el `pan`.** Es
nativo, toca toda la app, y *proponer un cambio de esa clase sin una razón
viva es pedir riesgo a cambio de nada.* **Sale de la lista.**

*Y vale registrar por qué la hipótesis era razonable y aun así falsa: el
síntoma —crash nativo al escribir, «keeps stopping», fuera de toda
ErrorBoundary— es idéntico en las dos causas. **Lo que las separa no se podía
leer: hacía falta el stack**, que es justamente lo que la mesa mandó pedir en
vez de seguir construyendo sobre la sospecha.*

⇒ **LA BUILD LLEVA UNA SOLA COSA: el módulo del cuadro congelado.**

⚠️ Sigue en pie lo del giro: `[GIRO_C]` **viaja por OTA y no espera a nadie**,
pero **si su log dijera que la causa es nativa, su cura caería en esta misma
build** — y ahí sí convendría que el log se lea antes del disparo.

*(Cerrado después: `[GIRO_C]` se capturó, la causa **no** es nativa —
`applyConstraints` mentía éxito— y su cura viajó por OTA. **La build sigue
llevando una sola cosa.**)*

---

## 🔴 ACTO 3 · FRENO — la entrada desde NEGOCIO choca con una firma viva

**No lo ejecuto y no lo rodeo. Lo declaro con su literal.**

### Lo medido

La entrada a `/negocio/equipo` **hoy sólo existe en la tab Datos**
(`(tabs)/mascotas.tsx:728`). Y en `(tabs)/negocio.tsx:718` hay una lápida que
dice **por qué**:

> `☠️ S86-C · ACÁ VIVÍA LA ENTRADA A EQUIPO, y SE MUDÓ A DATOS`
> `(firma del founder: *DATOS consulta · NEGOCIO configura*).`
> `Se retira en el MISMO commit que la construye allá — una mudanza que deja`
> `el origen puesto es una COPIA, y dos puertas a la misma pantalla envejecen`
> `distinto.`

**La firma sigue viva y no es sólo de esta pantalla:** son **los cuatro
verbos** —*HOY hace · NEGOCIO configura · DATOS consulta · CUENTA quién sos*—
firmados en el gate `019fcabf` (S85), y **han gobernado al menos tres
mudanzas**: equipo, «El movimiento» y la tienda.

⚠️ **Y hay una razón MEDIDA, no sólo estética:** en Datos la sección gatea por
`esDueno` **del lector**; el tab NEGOCIO tiene gate de gestor y Datos no ⇒
*mudarla sin su gate habría ensanchado la audiencia* (medido en S85-C32).

### 🔴 EL APORTE: el founder no se equivocó al buscarla ahí

*Su intuición es **coherente con la propia frontera firmada**: invitar a
alguien, darle roles y desvincularlo **es configurar**, no consultar.*

⇒ **El choque no es founder-contra-founder por descuido: es que la pantalla
hace LAS DOS COSAS.** Consulta —ver quién está— y configura —invitar, roles,
baja—. **Por eso ninguna de las dos ubicaciones la satisface del todo, y por
eso el defecto reaparece.**

*Un nombre que promete un verbo y una pantalla que hace dos no se arregla
moviéndola: se arregla decidiendo cuál de los dos verbos es.*

### Las tres salidas, para que la mesa elija — ninguna ejecutada

① **Una señal en NEGOCIO, no una puerta.** Una línea que diga dónde se
   gestiona el equipo, sin navegar. **Respeta la firma al pie** (no hay dos
   puertas que envejezcan distinto) y cura el hallazgo: el founder buscó y no
   encontró **ni siquiera un puntero**. *La más barata y la que no reabre
   nada.*
② **Partir la pantalla por verbo:** ver el equipo en Datos · invitar y roles
   en Negocio. **Es lo que la frontera pediría si se aplicara al contenido y
   no a la pantalla entera** — y es la más cara.
③ **Enmendar la firma para este caso** y devolver la entrada a Negocio.
   ⚠️ Cuesta el gate de audiencia medido en S85-C32: habría que llevar su
   gate con ella.

**Mi voto: ①**, y por una razón de orden más que de gusto — *es la única que
cura el hallazgo sin decidir antes la pregunta de fondo, que es la de los dos
verbos y es letra.*

### ✅ FIRMA DEL FOUNDER (27-ago): va la ① — construida

**Un puntero, no una segunda puerta.** Y la diferencia queda escrita **al lado
del código**, no sólo acá:

> *Una copia se llama **igual** que su destino y no dice de dónde es — con los
> meses las dos se editan por separado y envejecen distinto, que es
> exactamente lo que la mudanza de S86 vino a evitar. Un puntero **nombra el
> lugar**: su texto dice «se gestiona desde Datos», así que **no puede
> convertirse en la pantalla de equipo de este tab** — el día que alguien le
> agregue función acá, el texto lo delata.*

⚠️ **Y no ensancha nada:** hereda `useGateGestor`, que es **más angosto** que
el gate de Datos. *El puntero no puede deshacer lo que S85-C32 midió.*

---

## ☠️ FICHA `D-945` — PARTIR LA PANTALLA DE EQUIPO POR VERBO

**Sin disparo, por decisión de la mesa.** Se anota para que la pregunta no se
pierda, no para hacerla ahora.

**Medido:** `D-944` es la última tomada (grep contra `origin/main` **y todas
las ramas remotas** — la lección de la colisión de ayer aplicada).

### El hecho

`/negocio/equipo` **hace dos verbos**: **consulta** (ver quién está en el
equipo) y **configura** (invitar, roles, bajas). La frontera firmada —*DATOS
consulta · NEGOCIO configura*— **pediría partirla**: la vista en Datos, la
gestión en Negocio.

### 🔴 Por qué se anota aunque hoy no duela

*El defecto que el founder encontró —buscar el equipo donde el nombre lo lleva
y no hallarlo— **no fue un descuido de ubicación: fue el síntoma de esta
pregunta sin responder**.* Y por eso reaparece: **ninguna de las dos
ubicaciones satisface a una pantalla que hace las dos cosas.**

**El puntero cura el síntoma. Esta ficha nombra la causa.** *Un síntoma curado
sin su causa anotada vuelve, y la próxima vez nadie sabe que ya se había
entendido.*

### Disparo

**Ninguno hoy.** *La mesa la mira cuando la frontera vuelva a doler* — y el
indicio de que dolió será exactamente el mismo: alguien buscando una función
donde el verbo la promete.

---

### Lo que sí sigue en pie del Acto 3, sin choque

**A quién está asignada una cita** y **cómo se reasigna** son del detalle del
prestador y **no tocan esta frontera**. Ahí no hay freno — y el dato de A ya
está tomado: la pantalla **no vuelve a decidir el permiso**, consume el
rechazo tipado, y **mientras `cita_ya_asignada` siga cortando, dice la verdad
sobre por qué no se puede en vez de ofrecer un botón que rebota.**

---

## 🔴 LA BUILD FALLÓ EN MI MÓDULO — la causa, y el gate que no existía

### Lo que pasó, sin adorno

**Una build de ~20 minutos que terminó sin APK, y el defecto era mío.**

Y la lección que me habían dado hoy aplicaba al revés: **medí la API del fork
desde JS** (`MediaStreamTrack.d.ts`) **y el módulo la consume desde Kotlin, que
es otra superficie.** *Verifiqué con rigor la mitad que no iba a usar.*

### Las dos rondas de errores, y las dos eran UN solo defecto cada una

**Ronda 1 (la que costó la build):** `getNativeModule` no resolvía porque
`appContext.reactContext` está declarado **`Context?`**, no
`ReactApplicationContext` — su propio doc dice *«provides access to the react
application context»*, o sea que el tipo es el supertipo por desacople.
`getTrack` era **cascada**: sin resolver el primero, `webrtc` quedaba de tipo
inválido.

**Ronda 2 (la que encontró el compilador aislado, gratis):** `com.facebook.react.bridge`
**no resolvía en absoluto** — **faltaba `react-android` en MI `build.gradle`**.
*El fork lo declara en el suyo; yo lo di por heredado, y no se hereda: cada
módulo Gradle declara su propio classpath.* Sus **cinco** errores eran uno.

⚠️ **Y la ronda 2 sólo apareció después de curar la 1**: el compilador reporta
lo que puede resolver. *Curar el primer error de un archivo nativo no prueba
que compile — prueba que el siguiente ya se puede ver.*

### ✅ SÍ HAY FORMA DE VIGILARLO, y está probada — no propuesta

```
cd apps/prestador && npx expo prebuild --platform android --no-install
cd android && ./gradlew :epetplace-cuadro-video:compileReleaseKotlin
```

**Compila SÓLO el módulo.** Ya rindió: **encontró la ronda 2 sin gastar una
build EAS.**

**Su costo, MEDIDO en las dos corridas reales:** la primera **15m 48s** (baja
el toolchain y las dependencias); **la segunda, 6 SEGUNDOS** con el cache
caliente. *O sea que el gate es caro UNA vez y gratis siempre después* — y ya
pagó su primera corrida.

✅ **Y el resultado, verificado POR EL OBJETO y no por el exit code
(`L-191`, que casi me muerde acá):** `BUILD SUCCESSFUL` **y el
`CuadroVideoModule.class` existe** en
`packages/cuadro-video/android/build/tmp/kotlin-classes/release/`.
*La primera vez leí el exit del `| tail` y decía 0 sobre un `BUILD FAILED` —
la lección de la casa, cobrada en mi propio instrumento.*

**⚠️ SU TERCER COSTO, y lo encontró el propio gate de la casa:** correr
`expo prebuild` **se lleva puesto `.expo/types/router.d.ts`**, y `R63·C` me
frenó el commit con su literal — *«con `typedRoutes: true` y sin ese archivo,
`Href` degrada a `string` y toda ruta inventada compila en verde»*.

*O sea que el gate del nativo APAGA en silencio al gate de las rutas.* Se
regenera arrancando Metro una vez. **Queda escrito acá porque el que corra
este comando la próxima vez no va a saberlo — y el modo de falla es el peor:
el typecheck sigue diciendo verde mientras mide de menos.**

**Sus otros dos límites, declarados:**
① **compila, NO ejecuta** — que el Kotlin resuelva no dice que el frame se
   convierta. El criterio de verde sigue siendo el aparato.
② **es Android.** El equivalente iOS pide `pod install` + `xcodebuild`, que en
   esta máquina **no medí**.

### El gate que no existía, y por qué ninguno lo veía

*El typecheck de TS estaba verde porque el módulo nativo vive fuera de su
alcance, y `verify-manifest-apk` mira un APK que nunca llegó a existir.*
⇒ **el código nativo no lo cubre ningún gate de la casa** — y no por descuido:
**hasta hoy no había código nativo propio**, sólo dependencias horneadas.

**Mi propuesta, con su costo a la vista:** que el comando de arriba sea el
gate del módulo, corrido **a mano antes de pedir una build**, no en el
pre-commit. *Un gate de 15 minutos en cada commit no lo corre nadie, y un gate
que nadie corre es peor que ninguno: da la sensación de estar cubierto.*

---
---

# CIERRE DE LA PISTA C · S106

## ⓪ DÓNDE QUEDÓ CADA COSA

| Rama | SHA | Estado |
|---|---|---|
| `pista/s106-c` | `3e602fd3` | ✅ mergeada |
| `pista/s106-c-t2` | `2dde267a` | ✅ mergeada |
| `pista/s106-c-t3` | `914c0a04` | ✅ mergeada |
| **`pista/s106-c-cierre`** | **`1f54fbe5`** | 🔴 **SIN MERGEAR — es todo lo de hoy** |

*Verificado por SHA contra `origin` y con `merge-base --is-ancestor`, no por
memoria.* **Lo de hoy vive sólo en la rama de cierre.**

---

## 🔴 EL CUADRO CONGELADO — SU ESTADO EXACTO, para que nadie lo lea como verde

### ✅ Lo que SÍ está probado

**La prueba contra el TRACK LOCAL dio verde EN EL APARATO**, corrida por el
founder en `/prueba-cuadro`: **el PNG dice lo que la cámara apuntaba.**
⇒ *la vía nativa produce la imagen REAL, no un frame vacío* — que era el
criterio ① y el que separaba «producir una imagen» de «producir LA imagen».

### 🔴 Lo que NO está probado, y por qué NO es verde de plataformas

**① EL TRACK REMOTO — SIN EJERCER.** El botón está construido y pusheado
(`1f54fbe5`), pero **nadie lo corrió todavía**. *Mi propio límite, escrito
antes de empezar y que sigue rigiendo: si anda con el local, **no está
probado** con el remoto.*

**② EL BRAZO REMOTO DE iOS — REBOTA A PROPÓSITO.** `buscarTrack` resuelve
sólo el local (`localTracks` es público en `WebRTCModule.h`); con un `pcId`
distinto de `-1` **devuelve `nil` y la promesa rechaza**. *No devuelve el local
en su lugar: un `pcId` ignorado en silencio daría la imagen equivocada en una
historia clínica, que es peor que ninguna.*

⇒ **🔴 EL CRITERIO ② DE VERDE NO ESTÁ CUMPLIDO, Y NO SE ABLANDA:** *«Android
Y iOS. Si anda en una sola, es DESCARTE, no verde parcial.»* **Hoy anda en
una sola.** Lo de hoy cierra **la vía Android hasta el track local**, y **nada
más**.

**Su costo para cerrarlo:** medir cómo el fork iOS guarda las peer connections
y sus tracks remotos · escribirlo en Swift · **y una build de iOS, que esta
máquina no tiene medida** (`pod install` + `xcodebuild` sin verificar).

### ⚠️ Y la tercera pata que falta, del lado del expediente

`adjuntarCuadroTeleconsulta` existe tomando `bucket` + `storagePath`, **pero
falta el paso previo: subir el PNG a `cita-archivos`**, y no hay wrapper para
ese bucket. `packages/api` es de A ⇒ **pedido a A.**

*Hasta que exista, la captura ocurre y se ve, y NO llega al expediente.* **Se
dice; no se simula.**

---

## 🔴 EL GATE DEL CÓDIGO NATIVO — su regla de uso

**Hasta esta sesión no había código nativo propio**, sólo dependencias
horneadas ⇒ **ningún gate de la casa lo cubría**: el typecheck de TS no lo
alcanza y `verify-manifest-apk` mira un APK que puede no llegar a existir.

```
cd apps/prestador && npx expo prebuild --platform android --no-install
cd android && ./gradlew :epetplace-cuadro-video:compileReleaseKotlin
```

**Cuándo:** 🔴 **a mano, ANTES de pedir una build.** *Jamás en el pre-commit:
un gate de 15 minutos por commit no lo corre nadie, y un gate que nadie corre
es peor que ninguno — da la sensación de estar cubierto.*

**Su costo, medido en las dos corridas reales:** `15m 48s` la primera (baja el
toolchain), **`6s` la segunda** con cache. *Caro una vez, gratis después.*

**Cómo se lee su resultado:** **por el objeto** — que exista
`packages/cuadro-video/android/build/tmp/kotlin-classes/release/CuadroVideoModule.class`.
*El exit code de un pipe miente: la primera vez leí `0` sobre un `BUILD
FAILED` (L-191, cobrada en mi propio instrumento).*

### ⚠️ SUS TRES LÍMITES, y el tercero muerde en silencio

① **Compila, NO ejecuta** — el verde sigue siendo del aparato.
② **Es Android.** El equivalente iOS no está medido.
③ 🔴 **`expo prebuild` SE LLEVA `.expo/types/router.d.ts`**, y con él
   `R63·C`: *sin ese archivo `Href` degrada a `string` y toda ruta inventada
   compila en verde.* **El gate del nativo apaga en silencio al gate de las
   rutas.** Se regenera arrancando Metro una vez. *Queda escrito porque el
   próximo que corra el comando no va a saberlo, y el modo de falla es el
   peor: el typecheck sigue diciendo verde mientras mide de menos.*

---

## ACTO 3 — LO QUE QUEDA A MEDIAS, CON DUEÑO

| Qué | Estado | Dueño |
|---|---|---|
| **La señal en NEGOCIO** (firma ①) | ✅ construida | — |
| **A quién está asignada una cita** | 🔴 **NO construida** | **C** |
| **La reasignación** | 🔴 **NO construida** | **C** |
| **Partir la pantalla por verbo** (`D-945`) | ficha sin disparo | mesa |

**Lo que ya está medido para quien la retome, así no arranca de cero:**

- **El permiso NO se construye:** `asignar_cita_a_persona` ya existe y **ya
  gatea por rol** (recepción · administrador · titular). *La pantalla no
  vuelve a decidirlo: consume el rechazo tipado.*
- **Hoy reasignar rebota con `cita_ya_asignada`** — *reasignar exige el aviso
  a la familia, que A está construyendo.* ⇒ **la pantalla tiene que decir la
  verdad sobre por qué no se puede, jamás ofrecer un botón que rebota**; y
  cuando el aviso exista, **el gate se abre solo y la pantalla no cambia.**
- **No toca la frontera de los cuatro verbos** — vive en el detalle de la cita
  del prestador. *Ahí no hay freno.*

---

## LO QUE ESTA SESIÓN ME DEJÓ ESCRITO

**El criterio que más me corrigió:** *una pieza **entregada** y una pieza
**montada** son dos hechos distintos.* Lo pagué **cinco veces** —el asa, el
temporizador, el dictado, las tarjetas atadas a la altura equivocada, y la
cinta de «está escribiendo» que sigue sin llenar—. **Ningún typecheck ve una
prop que nadie llena.**

**Y su versión más cara, la de hoy:** *medí la API del fork desde JS y el
módulo la consume desde Kotlin — verifiqué con rigor la mitad que no iba a
usar*, y costó una build de veinte minutos.

**Por eso el cierre no dice «curado» en ninguna línea.** Eso lo dice el dedo
del founder.

---
---

# 🔴 EL CUADRO CONGELADO — DIAGNÓSTICO PARA LA PRÓXIMA SESIÓN

**No se cura hoy, por decisión de la mesa y con la razón compartida:** *dos
curas encima de una superficie que no se puede ejercer sin una llamada real,
a esta hora, es cómo se rompe lo que funciona.*

## ① LA ADJUDICACIÓN — verificada, y **mi `box-none` quedó FUERA de `main`**

Medido contra `origin/main`: **cero `pointerEvents` en la pantalla**. Entre mi
prop y el slot de B ganó el slot, y **la prop se perdió en la adjudicación**.

🔴 **Y las dos NO eran alternativas: eran complementarias.**
- **El slot** resuelve el **ORDEN** — colgar queda encima por construcción.
- **El `box-none`** resuelve la **OPACIDAD** — que mi `View` no se coma los
  toques de su propia franja.

*Sacar uno de los dos deja el otro trabajo sin hacer.* **Y encaja con el
agravamiento reportado:** antes bloqueaba una franja; sin el `box-none` dentro
de un slot que ahora ocupa su ancho completo, bloquea más.

⚠️ **La prop está repuesta en `pista/s106-c-cierre` (`e8e380a5`) y NO en
`main`.** *Quien retome esto: la cura de ① ya está escrita, sólo hay que
mergearla.*

## ② SI EL BLOQUEO PERSISTE — la otra causa, sin construir

Si con el `box-none` repuesto sigue bloqueando, entonces **lo que come los
toques es la vista de la imagen, no su envoltorio** — y el sospechoso es la
miniatura del modal, que monté sin `pointerEvents`.

*No lo curo a ciegas: son curas opuestas y elegir sin el dato es cómo se
encadenan tres arreglos que no arreglan.*

## 🔴 ③ LA PREGUNTA MÁS GRAVE — QUÉ IMAGEN SALIÓ

**El log dijo `transporte: 'publisher'`** — la conexión por la que el vet
MANDA su video, no por la que recibe.

**Lo que SÍ se puede afirmar, medido en el fork** (`WebRTCModule.java:461`):

```java
public MediaStreamTrack getTrack(int pcId, String trackId) {
    if (pcId == -1) { return getLocalTrack(trackId); }   // ← el ÚNICO brazo local
    PeerConnectionObserver pco = mPeerConnectionObservers.get(pcId);
    return pco.remoteTracks.get(trackId);                // ← sólo REMOTOS
}
```

⇒ **Con `pcId != -1` el brazo local es INALCANZABLE.** Si hubiera devuelto la
cámara del vet, el track sería local, `remoteTracks` no lo tendría, habría
devuelto `null` y el módulo habría rechazado con `track_no_encontrado`.
**Y capturó** (`puerta:ok` + PNG escrito) ⇒ **el track era REMOTO.**

*Y el nombre `publisher` no contradice esto: significa que
`pcManager.subscriber` estaba `undefined` —LiveKit puede operar con una sola
PC bidireccional— y esa misma PC es la que tiene los `remoteTracks`, que es
justo lo que explica que lo encontrara.*

⚠️ **PERO ESO PRUEBA QUE ES REMOTO, NO CUÁL.** *El razonamiento es fuerte y el
PNG es prueba* — **y la mesa tiene razón en pedir el PNG**: en una historia
clínica, «casi seguro que es el animal» no alcanza. **El archivo está en disco
y A tiene el cable. Es lo primero de la próxima sesión, antes de seguir
curando el bloqueo.**

## LO QUE SÍ QUEDÓ PROBADO, para que nadie lo re-mida

✅ La vía nativa produce **la imagen real** (prueba local, aparato).
✅ La captura funciona **sobre el video remoto** en una cita real: `pcId`
resuelto · aviso al dueño despachado ANTES · puerta `ok` · PNG escrito.
✅ El `pcId` sale de **recorrer los cuatro transportes** — *no del eje `pc` vs
`_pc`, que el aparato desmintió.*

## LO QUE NO

🔴 **Que no bloquee.** 🔴 **Qué imagen salió** (③). 🔴 **iOS remoto**, que sigue
rebotando ⇒ **no hay verde de plataformas.**

---

## 🔴 ENMIENDA AL DIAGNÓSTICO — dato nuevo del founder, y me obliga a corregirme

**«El pet parent ya no puede ver el video del vet después de la captura.»**

### Por qué esto NO es la capa, y cambia todo

Las curas de ① y ② eran sobre **una capa que tapa**. *Una capa tapa TOCA — no
apaga el video del otro lado, en el otro teléfono.* ⇒ **lo que se rompió es el
TRACK, y eso sólo puede venir de mi módulo nativo.**

### 🔴 EL PRIMER SOSPECHOSO, y es mi código

```kotlin
val i420 = frame.buffer.toI420()
try { … } finally { i420.release() }
```

**`VideoFrame.Buffer extends RefCounted`** (verificado con `javap` sobre el
`.aar`). **Y el contrato de `toI420()` es que, si el buffer YA es I420,
devuelve `this` con un `retain()` — el MISMO objeto.**

⇒ Mi `release()` **puede estar liberando una referencia del buffer del frame
original**, no de una copia. *Y un buffer liberado de más se destruye mientras
el renderer todavía lo usa: el pipeline de ese track se rompe.*

### 🔴 Y LO QUE ME OBLIGA A CORREGIR LO QUE DEPOSITÉ

Hace veinte minutos escribí, con un razonamiento que sigo considerando
sólido: *«el track era REMOTO, porque con `pcId != -1` el brazo local es
inalcanzable»*.

**El dato nuevo lo pone en duda por el otro extremo:** *el que perdió imagen
es el DUEÑO, y lo que dejó de ver es el video del VET.* **Si el track que
rompí es el que el vet publica, entonces el track que capturé era el del vet
— y el PNG sería su cara, no el animal.**

⚠️ **Las dos lecturas son incompatibles y no puedo resolverlas leyendo:** una
sale del código del fork, la otra de lo que pasó en dos teléfonos.

⇒ **NO doy por válido mi razonamiento anterior.** *Un argumento que se sostiene
solo hasta que aparece la primera evidencia del mundo no era una prueba: era
una hipótesis bien construida.* **Queda anotado como lo que es, para que nadie
lo lea mañana como cerrado y construya encima.**

### El orden de la próxima sesión, corregido

1. 🔴 **MIRAR EL PNG.** Ahora no es sólo «qué imagen salió»: es **el
   discriminador entre las dos lecturas**. Si es la cara del vet, la causa es
   el track equivocado y el `release()` es su consecuencia; si es el animal,
   son dos defectos y el `release()` es el único.
2. **El `release()`**, que es sospechoso en las dos ramas.
3. Recién después, el bloqueo (① ya está escrito y sin mergear).

⚠️ **Y hasta que eso se mida, el botón de capturar no debería estar al alcance
del vet en una consulta real:** *romperle el video a la familia a mitad de una
teleconsulta paga es peor que no tener la función.*

---

## ✅ EJECUTADO — el botón, retirado detrás de `__DEV__` (firma del founder)

**La razón, tal como la mesa la escribió y queda en el código:** *hoy tocarlo
le corta el video a la familia a mitad de una teleconsulta paga, y eso es peor
que no tener la función.*

⚠️ **No se retira lo que el founder pidió: se retira una VERSIÓN que rompe la
consulta.** Vuelve —sin `__DEV__`— cuando ① y ② estén medidos.

*Y lo demás queda intacto y probado: la vía nativa produce la imagen real, y
la captura llegó a escribir el PNG en una cita real.* **Lo que se apaga es la
puerta, no el trabajo.**

---

# 📋 PARA A — LO QUE HAY QUE PUBLICAR E INCLUIR EN SU PARTE

**Rama:** `pista/s106-c-cierre` · **HEAD** al cerrar: ver el último commit de C.
**Nada de esto está en `main`.**

| Commit | Qué lleva | Urgencia |
|---|---|---|
| `a6f268c1` | **ACTO 1** — el servicio ya no viene preseleccionado + el checkout dice qué se paga | 🔴 **es el defecto que hacía pagar por lo que no se eligió** |
| `4b790e6b` | la señal en NEGOCIO + ficha `D-945` | — |
| `c381fe41` | el módulo nativo **compilando** + el gate del código nativo | — |
| `e8e380a5` | 🔴 **el `box-none` repuesto** — *la cura del bloqueo, escrita y sin mergear* | 🔴 |
| **el último** | **el botón detrás de `__DEV__`** | 🔴 **lo que impide romperle el video a una familia** |

🔴 **Los dos que no pueden esperar: el `__DEV__` y el ACTO 1.** *El primero
evita un daño en vivo; el segundo evita que alguien pague por un servicio que
no eligió — y ése le pasó al founder dos de cinco veces.*

## EL ORDEN DE LA PRÓXIMA SESIÓN, firmado

1. 🔴 **EL PNG** — el discriminador entre las dos lecturas.
2. **El `release()` sobre `toI420()`** — sospechoso en las dos ramas.
3. **El bloqueo** — su cura **ya está escrita en `e8e380a5`**: *quien retome
   sólo tiene que traerla, no re-diagnosticarla.*
