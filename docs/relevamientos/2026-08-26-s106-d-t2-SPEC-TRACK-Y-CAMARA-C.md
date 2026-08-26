# SPEC PARA C · EL TRACK LOCAL PRE-JOIN Y EL CAMBIO DE CÁMARA

> **De:** pista D · S106 tanda 2 · 26-ago-2026 · **autocontenida.**
> **Todo medido de los tarballs publicados**, no de la doc:
> `@livekit/react-native@2.12.0` · `livekit-client@2.22.0` ·
> `@livekit/react-native-webrtc@144.1.2`.
>
> **Hiciste bien en no adivinar.** Acá está cada firma con el archivo del que
> salió.

---

# ① EL TRACK LOCAL **ANTES** DE CONECTAR — el preview del pre-join

## 1.1 · Crear el track

```ts
import { createLocalVideoTrack } from 'livekit-client';

const track = await createLocalVideoTrack({ facingMode: 'user' });
```

**Firma exacta** — `livekit-client/dist/src/room/track/create.d.ts:17`:
```ts
export declare function createLocalVideoTrack(
  options?: VideoCaptureOptions
): Promise<LocalVideoTrack>;
```

**`VideoCaptureOptions` acepta** (`room/track/options.d.ts:175-184`):
```ts
deviceId?:   ConstrainDOMString
facingMode?: 'user' | 'environment' | 'left' | 'right'
resolution?: VideoResolution
```

🔴 **`facingMode: 'user'` es la cámara frontal** — la que corresponde para
que la persona se vea antes de entrar. `'environment'` es la trasera.

⚠️ **`createLocalVideoTrack` NO publica nada y NO necesita `Room`.** Enciende
la cámara y devuelve el track. *Es exactamente lo que un pre-join necesita:
verse sin haber entrado.*

## 1.2 · Pintarlo — 🔴 **NO uses `VideoTrack`, usá `VideoView`**

**Son dos componentes distintos y sólo uno sirve acá.** Medido:

| componente | qué acepta | archivo |
|---|---|---|
| `VideoTrack` | `trackRef: **TrackReference**` | `components/VideoTrack.d.ts` |
| **`VideoView`** | `videoTrack?: **VideoTrack** (de `livekit-client`)` | `components/VideoView.d.ts` |

> 🔴 **`TrackReference` sólo existe DENTRO de una `Room` conectada** — es la
> tupla participante + publicación. **En el pre-join no hay room, así que no
> hay `TrackReference` que pasarle.**
> **`VideoView` toma el track pelado, y por eso es el del preview.**

```tsx
import { VideoView } from '@livekit/react-native';

<VideoView
  videoTrack={track}
  style={{ flex: 1 }}
  objectFit="cover"
  mirror                 // ← ver §3
/>
```

**Props exactas** (`VideoView.d.ts`):
```ts
videoTrack?: VideoTrack | undefined
style?:      ViewStyle
objectFit?:  'cover' | 'contain' | undefined
mirror?:     boolean
zOrder?:     number
```

## 1.3 · Apagarlo al salir del pre-join

```ts
track.stop();
```
⚠️ **Si no lo parás, la cámara queda encendida** — y en un teléfono eso es un
LED prendido y batería, con la persona creyendo que salió.

---

# ② `switchCamera` — 🔴 **NO EXISTE con ese nombre, y hay que elegir entre tres**

**Medido: `switchCamera` no aparece en `@livekit/react-native` ni en
`livekit-client`.** Lo que existe cuelga del **`MediaStreamTrack` del fork de
WebRTC**, y su propio JSDoc **lo desaconseja**:

```ts
// @livekit/react-native-webrtc/lib/typescript/MediaStreamTrack.d.ts:48-59
/**
 * Private / custom API for switching the cameras on the fly, without the
 * need for adding / removing tracks or doing any SDP renegotiation.
 *
 * This is how the reference application (AppRTCMobile) implements camera
 * switching.
 *
 * @deprecated Use applyConstraints instead.
 */
_switchCamera(): void;
```

## Las tres vías, con su costo

| vía | cómo | de qué cuelga | veredicto |
|---|---|---|---|
| **A** | `track.mediaStreamTrack._switchCamera()` | `MediaStreamTrack` del fork | ⚠️ **privada Y `@deprecated`** — pero **sin renegociación SDP** ⇒ instantánea |
| **B** | `track.mediaStreamTrack.applyConstraints({ facingMode: … })` | mismo objeto, **API estándar** | ✅ **la que el propio deprecation notice manda usar** |
| **C** | `track.restartTrack({ facingMode: … })` | `LocalVideoTrack` de `livekit-client` | ✅ pública y de LiveKit, pero **re-crea el track** |

**Firmas medidas:**
```ts
// MediaStreamTrack.d.ts:85
applyConstraints(constraints?: MediaTrackConstraints): Promise<void>;

// LocalVideoTrack.d.ts:47
restartTrack(options?: VideoCaptureOptions): Promise<void>;

// Track.d.ts:52  — así se llega al MediaStreamTrack desde el track de LiveKit
get mediaStreamTrack(): MediaStreamTrack;
```

## 🔴 Mi recomendación, y por qué — pero la decisión de UX es tuya

> **Empezá por B (`applyConstraints`).** Es la que el propio SDK manda usar al
> deprecar A, es API estándar de WebRTC, y **no re-crea el track** — así que
> no re-publica ni renegocia.
>
> **C (`restartTrack`) es el plan B**, y tiene un costo que se VE: re-crea el
> track ⇒ **parpadeo**, y si ya estás publicando, re-publicación. *En el botón
> más usado de la pantalla, un parpadeo por toque se nota.*
>
> **A queda como último recurso**, y sólo si B no funciona en el fork.
> ⚠️ **Si terminás en A, dejalo comentado como deuda con su literal
> `@deprecated`** — *una API privada usada sin dejar rastro es la que rompe en
> el próximo bump de versión sin que nadie sepa por qué.*

🔴 **Y esto hay que PROBARLO en el aparato, no elegirlo leyendo.** Ninguna de
las tres está verificada en dispositivo: **yo medí las firmas, no el
comportamiento.** *`applyConstraints` con `facingMode` es estándar en el
navegador; en un fork de react-native-webrtc puede estar implementada a
medias, y eso sólo lo dice un teléfono.*

**Criterio de verde, escrito antes de correr:** un toque cambia de cámara ·
**sin parpadeo perceptible** · **sin cortar el audio** · y **funciona también
ya conectado**, no sólo en el pre-join.

---

# ③ EL ESPEJO — una decisión que no es técnica

`VideoView` acepta `mirror?: boolean`.

🔴 **La cámara frontal se espeja; la trasera NO.** *Uno se ve espejado toda la
vida —así funciona un espejo— y verse "al derecho" se siente mal. Pero lo que
la cámara trasera capta es el mundo, y espejar el mundo lo vuelve ilegible: un
collar con nombre saldría al revés.*

⇒ **`mirror` tiene que seguir a `facingMode`**, no ser una constante:
`mirror={facingActual === 'user'}`.

⚠️ **Y en una teleconsulta importa más que en una videollamada común:** el vet
puede pedir *«mostrame la patita izquierda»* — **si la imagen está espejada,
la izquierda del vet es la derecha del animal.** *Esa es la razón real por la
que el espejo del remoto y el del propio no se deciden igual.*
**Es decisión de la mesa, no mía ni tuya** — la nombro para que no se resuelva
por accidente.

---

# ④ LO QUE ESTA SPEC **NO** RESUELVE

- ❌ **No probé nada en dispositivo** — medí **firmas**, no comportamiento.
- ❌ **No digo cómo se ve la pantalla** — eso es dirección de arte.
- ❌ **El bitrate no está acá:** va en `RoomOptions` al conectar, y su pedido
  es `2026-08-26-s106-d-t2-PEDIDO-BITRATE-C.md` (`adaptiveStream` y
  `dynacast` en `true`, preset `h720` por firma).
