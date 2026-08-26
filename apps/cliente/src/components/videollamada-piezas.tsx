/**
 * EL TRANSPORTE DE LA VIDEOCONSULTA — los nodos de video y la cámara.
 * Aplica la spec de D (26-ago) verificada contra el objeto.
 *
 * ── LA FRONTERA ───────────────────────────────────────────────────────────
 * **Este módulo sabe de LiveKit y no sabe de diseño.** El chrome, el tile, el
 * temporizador y la señal de la nota son de `SuperficieLlamada` (B); acá sólo
 * se resuelve de dónde sale cada imagen.
 *
 * ── ① EL PRE-JOIN NO TIENE ROOM, Y ESO DECIDE LA PIEZA ────────────────────
 * `VideoTrack` (la pieza nueva) exige un **`TrackReference`**, que sólo existe
 * **dentro de una Room conectada**. En el pre-join no hay room: hay un track
 * suelto. ⇒ **`VideoView`**, que acepta el track crudo.
 *
 * ⚠️ **`VideoView` está `@deprecated`** en su propio JSDoc («use `VideoTrack`
 * instead»). *Se usa igual porque es la única que acepta un track sin
 * referencia, que es exactamente el caso del pre-join.* **D marcó este punto
 * como donde se iba a adivinar mal, y tenía razón.**
 *
 * ── ③ EL ESPEJO — firma del founder, y es CLÍNICO ─────────────────────────
 * 🔴 **Sólo al preview propio. JAMÁS al video que recibe el otro.**
 * `mirror` es de **presentación**: no viaja en el stream, así que espejar lo
 * propio no toca lo que ve el profesional.
 *
 * *La razón no es estética: «mostrame la patita izquierda» sobre una imagen
 * espejada apunta a la pata equivocada.* Y **sigue a `facingMode`**, no es
 * constante: con la cámara trasera uno NO espera verse espejado.
 */

import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { VideoView, VideoTrack } from '@livekit/react-native';
import { createLocalVideoTrack, type LocalVideoTrack } from 'livekit-client';

export type Camara = 'user' | 'environment';

/**
 * El preview del pre-join. Crea su propio track y **lo suelta al desmontar**:
 * *una cámara que queda encendida después de salir de la pantalla es una luz
 * verde que nadie sabe apagar.*
 */
export function PreviewPropio({ activa, camara }: { activa: boolean; camara: Camara }) {
  const [track, setTrack] = useState<LocalVideoTrack | null>(null);

  useEffect(() => {
    let vigente = true;
    let creado: LocalVideoTrack | null = null;
    if (activa) {
      void createLocalVideoTrack({ facingMode: camara })
        .then((tk) => {
          if (!vigente) {
            void tk.stop();
            return;
          }
          creado = tk;
          setTrack(tk);
        })
        .catch(() => {
          /* Permiso negado o cámara ocupada. **No se disimula con un
             rectángulo negro**: el `null` sube y la pantalla lo dice. */
          if (vigente) setTrack(null);
        });
    } else {
      setTrack(null);
    }
    return () => {
      vigente = false;
      void creado?.stop();
    };
  }, [activa, camara]);

  if (track === null) return null;

  return (
    <VideoView
      style={{ flex: 1 }}
      videoTrack={track}
      objectFit="cover"
      /* ③ El espejo sigue a la cámara: frontal sí, trasera no. */
      mirror={camara === 'user'}
    />
  );
}

/**
 * Girar la cámara.
 *
 * 🔴 **`switchCamera` NO EXISTE con ese nombre** — lo midió D. Lo que hay es
 * **`_switchCamera()`** en el `MediaStreamTrack` del fork, y **está
 * `@deprecated` en su propio JSDoc**.
 *
 * ⚠️ **Declarado, no disimulado:** D midió **firmas, no comportamiento**. Esto
 * compila y existe; **que gire de verdad y sin parpadeo sólo lo cierra un
 * aparato**. Su plan B es `restartTrack`, que **re-crea el track ⇒ parpadea** —
 * y éste es *el botón más usado de la pantalla*, así que el parpadeo no es
 * detalle.
 *
 * **El criterio de verde, escrito ANTES:** ① la imagen cambia de cámara ·
 * ② **sin parpadeo negro** · ③ el espejo se apaga al pasar a trasera ·
 * ④ el profesional **sigue viendo** durante el giro.
 */
export function girarCamara(track: LocalVideoTrack | null | undefined): Camara | null {
  const mst = track?.mediaStreamTrack as unknown as { _switchCamera?: () => void } | undefined;
  if (mst?._switchCamera === undefined) return null;
  mst._switchCamera();
  return null; // el llamador alterna su propio estado de `facingMode`
}

/** El video del otro. Acá SÍ hay room ⇒ `VideoTrack` con su referencia. */
export function VideoRemoto({ referencia }: { referencia: Parameters<typeof VideoTrack>[0]['trackRef'] }) {
  return <VideoTrack trackRef={referencia} style={{ flex: 1 }} />;
}

/**
 * El propio, dentro de la llamada. **Sale de `useLocalParticipant().cameraTrack`
 * y NO de `useParticipantTracks`** — lo dejó medido §7 del recorrido de la
 * tanda 1: sobre la identidad del participante local ese hook no devuelve su
 * publicación, y el tile salía vacío en el gate del cable.
 */
export function VideoPropioEnLlamada({
  track,
  camara,
}: {
  track: LocalVideoTrack | null | undefined;
  camara: Camara;
}) {
  if (!track) return <View style={{ flex: 1 }} />;
  return (
    <VideoView style={{ flex: 1 }} videoTrack={track} objectFit="cover" mirror={camara === 'user'} />
  );
}

/** Guarda el `facingMode` actual — el espejo lo lee. */
export function useCamara(inicial: Camara = 'user') {
  const [camara, setCamara] = useState<Camara>(inicial);
  const ref = useRef(camara);
  ref.current = camara;
  return {
    camara,
    alternar: () => setCamara((c) => (c === 'user' ? 'environment' : 'user')),
  };
}
