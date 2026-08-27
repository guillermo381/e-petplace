# EL CUADRO CONGELADO · SEGUNDA PASADA, A FONDO

> **Pista D · S106 · 27-ago-2026.** Encargo del founder: volver sobre el cuadro
> y **ampliar la búsqueda más allá de lo ya descartado**.
> **Medido contra el código NATIVO del fork**, que la primera pasada no tocó —
> aquella miró los `.d.ts`; ésta abre Java, Objective-C y el bridge.

## 🔴 EL VEREDICTO, EN UNA LÍNEA

> **En el SDK no hay, y ahora está probado con el censo COMPLETO del bridge —
> no por buscar nombres.**
> **Por debajo SÍ hay: el frame decodificado está en Java y en Objective-C, a
> un módulo nativo de distancia. Y NO activa grabación.**
> **Pero es CANDIDATA SIN PROBAR**, en los términos exactos que la mesa firmó.

---

## §1 · EL SDK — cerrado con censo, no con búsqueda

**La primera pasada buscó por nombre** (`grabFrame`, `snapshot`, …). *Buscar
por nombre no puede descartar lo que se llama de otra forma.* **Ésta lista
TODO lo que el fork expone a JS** — los **50 `@ReactMethod`** de
`WebRTCModule.java`:

```
addListener · dataChannel{Close,Dispose,Send} · dataPacketCryptor{...}
enumerateDevices · frameCryptor{Dispose,GetEnabled,GetKeyIndex,Set...}
getDisplayMedia · getUserMedia · keyProvider{...}
mediaStream{AddTrack,Create,Release,RemoveTrack}
mediaStreamTrack{ApplyConstraints,Release,SetEnabled,SetVideoEffects,SetVolume}
peerConnection{...} · receiverGetStats · removeListeners · senderGetStats
senderReplaceTrack · senderSetParameters · transceiver{SetDirection,Stop}
```

> ### **Ninguno de los 50 devuelve un frame, una imagen ni un buffer de píxeles.** No es que no encontré: **es la lista entera.**

**Y `RTCView` tampoco** — sus **7 props** son `mirror` · `objectFit` ·
`streamURL` · `zOrder` · `iosPIP` · `onDimensionsChange` · `enabled`.
**Cero métodos imperativos, cero ref con captura.**

---

## §2 · 🔴 POR DEBAJO SÍ HAY — y el fork YA TIENE el frame en la mano

Busqué **por lo que hace**, no por cómo se llamaría. El resultado parte en dos
mitades limpias:

### La maquinaria de recibir frames: **existe**
| concepto | Android | iOS |
|---|---|---|
| `addSink` / `VideoSink` | ✅ 2-3 archivos | — |
| `onFrame` / `renderFrame` | ✅ 4 | ✅ 3 |
| `VideoFrame` / `CVPixelBuffer` | ✅ 7 | ✅ 5 |

### La conversión a imagen: **NO existe, en ninguna de las dos**
| concepto | Android | iOS |
|---|---|---|
| `Bitmap` · `createBitmap` · `compress` | **0 · 0 · 0** | — |
| `toI420` · `YuvHelper` · `PixelCopy` | **0 · 0 · 0** | — |
| `UIImage` · `pngData` · `jpegData` · `UIGraphics` | — | **0 · 0 · 0 · 0** |

⚠️ *`CIImage`/`CGImage` aparecen una vez cada uno en iOS — **y son de
`ScreenCapturer.m`**, o sea compartir pantalla. No es captura de frame remoto.*

### 🔴 Y el literal que lo cierra: el fork YA agrega un sink a cada track

`VideoTrackAdapter.java`:
```java
videoTrack.addSink(onMuteImpl);      // ← un sink en CADA track
...
@Override
public void onFrame(VideoFrame frame) {
    frameCounter.addAndGet(1);        // ← y lo único que hace es CONTARLO
}
```

> ### **El frame decodificado ya está ahí, en Java, en cada llamada — y el fork lo usa sólo para saber si el video sigue vivo.**
> *No falta el acceso al frame. Falta la línea que lo convierte en imagen.*

⇒ **Un módulo nativo propio podría tomar ese `VideoFrame` → `toI420()` →
`YuvHelper` → `Bitmap` → PNG.** Es el patrón estándar de WebRTC en Android, y
su equivalente en iOS con `RTCVideoRenderer` + `CVPixelBuffer`.

### ✅ Y lo importante para la letra: **esta vía NO es grabación**
Es **leer un frame en el cliente**, no `Egress`. ⇒ **la objeción de
`roomRecord: false` que cerró `ImageOutput` NO aplica acá.** *El camino que
quedaba bloqueado por la firma ⓪ era el del servidor; éste no pasa por ahí.*

---

## §3 · LA COMUNIDAD YA LO INTENTÓ — y su autor pidió no mergearlo

**`react-native-webrtc` issue #783**, *«POC: android: support snapshot through
RTCView via SurfaceViewRenderer»* — abierto **9-may-2020**, cerrado
**4-dic-2020**, sin mergear.

Su cuerpo, literal:
> *«There has been several discussions and implementations since 2016, see
> #176… On android, this PR can take snapshot use `onFrame`, so it support
> both **local and remote** stream.»*

Y el propio autor, al cerrarlo:
> *«I didn't want it to be merged either, **unless there are much more solid
> api provided officially for both ios and android**.»*

> ### 🔴 **Funcionó como POC en 2020, su autor lo frenó esperando una API oficial, y SEIS AÑOS DESPUÉS esa API sigue sin existir** — lo acabo de medir en el fork.
> *Eso no dice «es imposible»: dice que **la vía es real y que nadie la sostuvo**. Un POC de 2020 sin mantenedor no es una dependencia: es código para copiar y hacerse cargo.*

---

## §4 · LA CAPTURA DE VISTAS — es PEOR de lo que parecía, y por eso importa

C midió que **puede devolver negro sobre superficie nativa**. La comunidad
afina el dato, y el matiz lo empeora:

> **Devuelve negro en ANDROID. En iOS funciona.**

> ### 🔴 **Un fallo asimétrico por plataforma es peor que un fallo total**, y ésta es la razón:
> *Si fallara en las dos, se descarta en la primera prueba. Fallando sólo en
> una, **el iPhone del que prueba te convence de que la función sirve** — y el
> negro aparece en los Android, en producción, dentro de expedientes.*
>
> **Y la vara del founder no se mueve:** un rectángulo negro en una historia
> clínica **no es un bug de UI, es un dato clínico falso** — *se lee como que
> así se veía el animal, y aparece años después cuando alguien abre ese
> expediente para decidir algo.*

---

## §5 · ¿SE PUEDE PROBAR BARATO? — sí se puede ABARATAR mucho; **no se puede evitar el build**

**La respuesta honesta primero: no. El candidato es un módulo nativo, y
probarlo exige una build.** *Eso también es respuesta, como pidió la mesa.*

**Pero se puede abaratar muchísimo, y esto es medido:** la app **ya tiene tres
superficies nativas instaladas**:

| dependencia | cliente | prestador |
|---|---|---|
| `expo-video` ~57.0.1 | ✅ | ✅ |
| `react-native-maps` 1.27.2 | ✅ | ✅ |
| `expo-camera` ~57.0.2 | — | ✅ |

> ### **Se prueba contra `expo-video`, NO contra LiveKit.**
> Si la captura devuelve negro sobre un `expo-video` en Android, **devuelve
> negro sobre `RTCView`**: son la misma clase de superficie.

**Lo que eso ahorra, que es casi todo:**
- **no hace falta tener construida la pantalla de teleconsulta**;
- **no hace falta tocar LiveKit ni sus builds de video**;
- **no hace falta una cita, ni una sala, ni dos aparatos**;
- **la prueba dura minutos** y se corre en **un Android**, que es donde falla.

⇒ **El costo real no es «invalidar las builds»: es UNA build de prueba con una
dependencia y una pantalla de dos líneas.** *Muy distinto de descubrirlo con
toda la teleconsulta construida encima.*

---

## §6 · ¿CAMBIÓ ALGO EN LAS VERSIONES? — no

| paquete | versión | publicado |
|---|---|---|
| `@livekit/react-native-webrtc` | **144.1.2** | 23-jul-2026 *(sin cambios)* |
| `react-native-webrtc` (upstream) | 124.0.8 | 21-jul-2026 |
| `@livekit/react-native` | 2.12.0 | 23-jul-2026 |
| `livekit-client` | 2.22.1 | 26-ago-2026 *(no toca esto)* |

*(Existe un fork más nuevo, `@stream-io/react-native-webrtc@145.3.1` — **no lo
propongo**: cambiar de fork de WebRTC es cambiar el cimiento del transporte
que acaba de pasar su gate de cable, por una función que ni siquiera está
probada.)*

---

## §7 · LO QUE ESTO ES Y LO QUE NO — en los términos que la mesa firmó

| | |
|---|---|
| ❌ **NO hay vía en el SDK** | censo completo del bridge + `RTCView`. **Cerrado.** |
| ❌ **NO hay vía server-side usable** | `ImageOutput` es Egress, y `roomRecord:false` la cierra *(primera pasada)* |
| 🟡 **SÍ hay CANDIDATA por debajo** | módulo nativo con sink/renderer. **Real, conocida desde 2020, sin mantenedor.** |
| 🟡 **SÍ hay CANDIDATA por vista** | y **falla asimétrico: negro en Android, anda en iOS** |
| 🔴 **NINGUNA está probada** | ⇒ **«hay candidata sin probar», no «hay vía»** |

**Las tres firmas del founder siguen en pie para cuando haya vía:** un cuadro
**no** es grabación · **el dueño lo ve en el momento** · entra **con su marca
de origen** *(A ya creó `origen_captura` en su propio eje — y la vía nativa de
§2 encaja ahí sin inventar nada)*.

## §8 · LO QUE **NO** HICE
- ❌ **No probé nada en dispositivo.** Medí **código publicado**, no
  comportamiento. *La distinción es la que la mesa pidió sostener.*
- ❌ **No agregué ninguna dependencia** ni invalidé ninguna build.
- ❌ **No propongo construir el módulo nativo.** Digo que existe la vía, que no
  choca con la letra, y **qué costaría averiguar si sirve.**
