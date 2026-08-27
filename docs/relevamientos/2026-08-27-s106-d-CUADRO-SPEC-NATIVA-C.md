# EL CUADRO CONGELADO · SPEC DE LA VÍA NATIVA — para C

> **De:** pista D · S106 · 27-ago-2026 · **autocontenida (76b).**
> **El disparo sonó.** Esto es lo que medí para que nadie adivine, más **un
> freno que hay que leer antes de gastar una build.**
>
> 🔴 **Y un reparto que digo de entrada: esta pieza NO tiene componente en mi
> territorio.** Ver §4. Traigo la medición, no el código.

---

# §1 · 🔴 FRENO — LA PRUEBA BARATA QUE PROPUSE **NO SIRVE PARA ESTA VÍA**

**Yo mismo escribí** que la prueba contra `expo-video` *«queda para la vía
nativa»*. **Estaba mal, y lo mido acá antes de que cueste una build.**

**Medido en `expo-video@57.0.1`:**
```
addSink: 0 · VideoSink: 0 · onFrame: 0 · MediaStreamTrack: 0
VideoTrack: 10  ← y son SUS pistas de archivo (audio/video/subtítulos),
                  NO el VideoTrack de WebRTC
```

> ### **La vía nativa se engancha con `VideoTrack.addSink()`. En `expo-video` no hay dónde enchufarlo.**
> *La prueba contra `expo-video` servía para **la captura de vistas** —que
> opera sobre cualquier superficie— y esa está **descartada por firma**. Al
> descartarla, su prueba se fue con ella; yo la reasigné a una vía que no la
> puede usar.*

## ✅ LA PRUEBA BARATA CORRECTA: **el track LOCAL de la cámara**

**`getUserMedia` del fork da un `MediaStream` con un `VideoTrack` de WebRTC —
el MISMO objeto y el MISMO `addSink` que el track remoto.**

**Y es más barata todavía que la que yo había propuesto:**

| | |
|---|---|
| dependencias nuevas | 🟢 **CERO** — `@livekit/react-native-webrtc@144.1.2` **ya está instalado en las dos apps** *(medido hoy)* |
| LiveKit / sala / cita | **no hace falta nada** |
| aparatos | **uno** |
| pantalla | una con un `<RTCView>` y un botón |

**Y el POC de 2020 lo respalda, literal:** *«On android, this PR can take
snapshot use `onFrame`, so it support both **local and remote** stream.»*

⚠️ **Su límite, declarado:** el track local viene del **encoder de cámara** y
el remoto del **decoder del peer**. **No es idéntico.** *Pero el sink es el
mismo mecanismo y `VideoFrame` es la misma clase* ⇒ **si la conversión no
funciona con el local, no va a funcionar con el remoto**; si funciona, queda
**confirmar con el remoto antes de dar verde.**

---

# §2 · LO QUE ESTÁ GARANTIZADO DISPONIBLE — medido, no supuesto

**Clases de `org.webrtc` que el fork YA importa** (o sea: están en el AAR y
compilan seguro):

```
VideoFrame · VideoSink · VideoTrack · SurfaceViewRenderer · RendererCommon
EglBase · SurfaceTextureHelper · MediaStream · MediaStreamTrack
```

⚠️ **NO verificado:** `YuvHelper` y `JavaI420Buffer` **no las referencia el
fork**. *Son parte de libwebrtc y lo normal es que estén en el AAR, pero **no
lo medí** — y si no están, la conversión hay que hacerla a mano.* **Primer
riesgo a chequear al compilar.**

**El enganche ya existe y está a la vista** (`VideoTrackAdapter.java`):
```java
videoTrack.addSink(onMuteImpl);
public void onFrame(VideoFrame frame) { frameCounter.addAndGet(1); }
```
> **No hay que inventar dónde engancharse: hay que hacer lo que esa línea NO
> hace.**

**iOS:** mismo patrón con `RTCVideoRenderer` + `CVPixelBuffer` (medidos
presentes; `UIImage`/`pngData` **ausentes** ⇒ la conversión también falta).

---

# §3 · 🔴 EL CRITERIO DE VERDE — escrito ANTES de correr

**Verde es TODO esto. Falta uno ⇒ rojo.**

| # | qué | por qué |
|---|---|---|
| ① | compila y no rompe el transporte | *el cable ya pasó su gate; esto no puede costarlo* |
| ② | produce un archivo de imagen | mínimo |
| ③ | 🔴 **la imagen es LA DEL VIDEO, verificable** | ⇣ |
| ④ | 🔴 **funciona en Android Y en iOS** | ⇣ |
| ⑤ | con el track **REMOTO**, no sólo el local | §1 |

### 🔴 ③ — cómo se prueba que es la imagen REAL, y no cualquier imagen
**Apuntar la cámara a algo identificable e irrepetible** —un papel escrito a
mano, un reloj con segundos— **y abrir el PNG: tiene que decir lo mismo.**

> *Producir «una imagen» no es producir «la imagen». **Un frame en negro, en
> gris o congelado del arranque también es un archivo válido** — pesa, abre, y
> se ve como una foto. La vara del founder es exactamente ésta: **un
> rectángulo negro en una historia clínica no es un bug de UI, es un dato
> clínico falso.***

### 🔴 ④ — las DOS plataformas, y esto no se negocia
**Si anda en una sola, es DESCARTE, no verde parcial.**

> *Es la lección que acabamos de pagar con la captura de vistas: **un fallo
> asimétrico por plataforma es peor que uno total**, porque el aparato que
> anda convence de que la función sirve. **No repitamos el mismo error con la
> otra vía.***

**Si algo de ①–⑤ falla: el resultado es «no hay vía» y se deposita** — y habrá
costado **una build de prueba**, no la teleconsulta construida encima.

---

# §4 · EL REPARTO — dicho de entrada

| pieza | de quién |
|---|---|
| módulo nativo (frame → PNG) | **C** *(o paquete nativo nuevo)* |
| subida a Storage | **C** — medido: las fotos clínicas **suben directo del cliente** (`getClient().storage.from('cita-archivos').upload(...)`), sin edge |
| `adjuntarCuadroTeleconsulta` | ✅ **ya existe** (`teleconsulta-adjuntos.ts`), toma `bucket` + `storagePath` |
| botón en la in-call | **C** |
| marca de origen | ✅ **ya existe** — `origen_captura` de A, **en su propio eje, jamás dentro de `categoria`** |

> ### 🔴 **En `supabase/functions` no hay nada que construir para esto.**
> *El camino entero es cliente → Storage → RPC, y las tres piezas de sus
> extremos ya están. Lo digo de entrada para no ocupar la tanda construyendo
> lo que no me toca ni duplicando lo que ya existe.*

**Lo que sí puedo hacer si la mesa lo pide:** medir cualquier otra API contra
el objeto, y **auditar el resultado** — que un cuadro adjuntado quede con su
`origen_captura` correcto y apuntando a la cita que corresponde.

---

# §5 · LO QUE NO SE TOCA — vigente y medido hoy

- ☠️ **La captura de vistas está DESCARTADA POR FIRMA.** No se prueba, no se
  reintenta.
- ⚠️ **NO se cambia de fork de WebRTC.** *Cambiar el cimiento del transporte
  que acaba de pasar su gate, por una función sin probar, es el orden
  inverso.* Medido hoy: el fork sigue en **144.1.2**.
- ✅ **`roomRecord: false` no se toca.** Esta vía es **de cliente, no Egress**
  ⇒ **la firma ⓪ no la bloquea**, y no hay que pedirle permiso a nada.
- 📜 **El POC de 2020 no es una dependencia: es código para copiar y hacerse
  cargo.** *Su propio autor pidió no mergearlo hasta que hubiera API oficial
  para ambas plataformas — y seis años después sigue sin haberla.*

# §6 · LAS TRES FIRMAS, para cuando produzca imagen
① **el cuadro NO cuenta como grabación** · ② **el dueño lo VE en el momento**
—*no se captura en silencio a alguien que está en cámara*— · ③ **entra con su
marca de origen**, en el eje propio que A ya creó.
