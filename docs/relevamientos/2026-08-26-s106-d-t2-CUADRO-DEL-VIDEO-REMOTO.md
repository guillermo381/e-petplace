# ¿HAY VÍA PARA CAPTURAR UN CUADRO DEL VIDEO REMOTO?

> **Pista D · S106 tanda 2 · 26-ago-2026.** Encargo salido del cierre de C.
> **Medido contra los tarballs publicados**, no contra la doc:
> `@livekit/react-native@2.12.0` · `@livekit/react-native-webrtc@144.1.2` ·
> `livekit-client@2.22.0` · `@livekit/protocol@1.50.4`.
>
> **Respuesta corta: del lado del SDK cliente, NO HAY. Y del lado servidor hay
> una — pero es la maquinaria de grabación, que la letra ya prohibió.**

---

## §1 · EL LADO CLIENTE — confirmado, no hay

**`MediaStreamTrack` del fork, TODOS sus métodos** *(`MediaStreamTrack.d.ts`)*:
```
stop · _switchCamera · _setVideoEffects · _setVideoEffect
_setMutedInternal · _setVolume · applyConstraints
clone(): never · getCapabilities(): never · getConstraints · getSettings
_registerEvents · release
```
**Ninguno captura un cuadro.**

**Barrido por nombre en los tres paquetes** — `grabFrame`, `captureFrame`,
`takeSnapshot`, `snapshot`, `toDataURL`, `ImageCapture`, `captureImage`,
`screenshot`, `getFrame`:

| paquete | resultado |
|---|---|
| `@livekit/react-native-webrtc` (el fork) | **cero** |
| `@livekit/react-native` | **cero** |
| `livekit-client` | 3 coincidencias — **ninguna sirve** ⇣ |

🔴 **Las tres de `livekit-client` son falsos positivos, y conviene que quede
escrito para que nadie las persiga:** `getFrameMetadataFeatures`,
`isVideoFrame`, `appendPacketTrailerToEncodedFrame` — todas sobre
**`RTCEncodedVideoFrame`**, o sea **frames CODIFICADOS y CIFRADOS** del
pipeline E2EE. *Un frame codificado no es una imagen: es un bloque de bytes
comprimidos al que le falta el decodificador.*

**Y el `index.d.ts` del fork no exporta nada de captura**: `RTCView`,
`RTCPIPView`, `ScreenCapturePickerView`, `mediaDevices`, `permissions`… **y
nada de imagen.**

> ### ✅ **La medición de C se confirma de forma independiente: el SDK y el fork NO lo exponen.**

---

## §2 · EL LADO SERVIDOR — sí hay una, y por eso «no hay» habría sido incompleto

**`ImageOutput` existe** en `@livekit/protocol` (`index.d.mts:12698`), con
campos **`captureInterval`** y **`filenamePrefix`**. Es parte de **Egress**,
la maquinaria de grabación de LiveKit: saca imágenes y las deja en un bucket.

**Pero no sirve, por tres razones y en este orden:**

### 🔴 ① Choca con una firma que ya existe
`LETRA_TELEMEDICINA` **§7 firma ⓪: la teleconsulta NO SE GRABA en v1**, ni por
la plataforma ni por el proveedor. **Egress ES la grabación.**

### 🔴 ② Y nuestra propia decisión ya lo cerró — sin que nadie lo planeara
El token que emite `video-token` lleva **`roomRecord: false` explícito**, y
ese es justamente el permiso que Egress necesita. **Verificado en el token
emitido hoy**, no en el código.
> *La firma ⓪ no sólo prohíbe grabar en la letra: **ya está ejecutada en el
> claim**. Habilitar el cuadro por esta vía exigiría dar vuelta esa línea.*

### ⚠️ ③ Aunque se firmara, **no hace lo que se pide**
`captureInterval` dice todo: **saca imágenes CADA N segundos**, no *«un cuadro
cuando el veterinario toca un botón»*. **Es un intervalo, no un obturador.**
*Adjuntar a una historia clínica «la foto que tocó a los 30 s» no es lo que el
vet quiso capturar — es lo que había cuando el reloj dio la vuelta.*

---

## §3 · LO QUE C MIDIÓ, confirmado desde mi lado

C midió que el candidato de **captura de vistas** puede devolver **negro sobre
una superficie nativa**. **No lo verifiqué yo** —es de su territorio y no
tengo aparato— **pero es coherente con lo que sí medí**: el fork pinta el
video con **`RTCView`**, un componente nativo, no un `<View>` de RN.

🔴 **Y el riesgo que él nombró es el que manda:**
> *agregar la dependencia invalida las builds, y podría terminar con **un
> rectángulo negro adjuntado a una historia clínica**.*

**Eso no es un bug de UI: es un dato clínico falso.** *Una foto negra en un
expediente no se lee como «falló la captura» — se lee como que así se veía.*
**Y el modo de falla es silencioso:** se guarda, se sincroniza, y aparece años
después cuando alguien lee ese expediente para decidir algo.

---

## §4 · CONCLUSIÓN — «no hay» se deposita, y con su matiz

> ### **Del lado del SDK cliente NO HAY VÍA.** Confirmado en los tres paquetes, por método y por nombre.
> ### **Del lado servidor hay UNA (`ImageOutput`), y está cerrada por una firma que ya rige** — y encima es un intervalo, no un obturador.

⇒ **El cuadro congelado espera**, como dijo la mesa. **No hace falta agregar
ninguna dependencia ni invalidar ninguna build para llegar a esa conclusión**
— que era justamente el costo que este relevamiento existía para evitar.

---

## §5 · 🔴 LA PREGUNTA QUE PRECEDE A LA TÉCNICA — y no la contesto yo

**Antes de «cómo se captura» está «se puede capturar».**

`LETRA_TELEMEDICINA` §7 firma ⓪ dice **«la teleconsulta no se graba»**. Un
**cuadro fijo** no es un video… **pero es una captura de la consulta, y si va
a la historia clínica es un dato clínico derivado del video.**

**No lo resuelvo:** *que la vía técnica no exista hoy no vuelve la pregunta
hipotética — la vuelve barata de hacer ahora, antes de que alguien construya
la respuesta equivocada.*

**Tres cosas que la mesa querría decidir juntas, si el tema vuelve:**
1. **¿Un cuadro cuenta como grabación** a los efectos de §7 y de T&C?
2. **¿Necesita consentimiento explícito** del dueño en el momento, o basta el
   de la teleconsulta?
3. **¿Con qué marca entra al expediente?** *«evaluado por pantalla» ya cambia
   cómo se lee una historia (§7); una imagen capturada de una videollamada
   —con su compresión y su luz— cambia más.*

## §6 · LO QUE ESTE RELEVAMIENTO **NO** HIZO
- ❌ **No probé nada en dispositivo** — medí **APIs publicadas**, no
  comportamiento.
- ❌ **No evalué librerías de captura de vistas** — es territorio de C y ya
  las midió.
- ❌ **No propongo construir nada.**
