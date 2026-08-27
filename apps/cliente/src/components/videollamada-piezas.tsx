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

import { useCallback, useEffect, useRef, useState } from 'react';
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
 * Girar la cámara — **CURA DEL GATE del 27-ago**.
 *
 * ── 🔴 QUÉ HACÍA MAL LA v1, y el síntoma lo explica entero ────────────────
 * Llamaba a `_switchCamera()` —el método del fork, `@deprecated` en su propio
 * JSDoc— y **devolvía `null` sin decir si había funcionado**. El llamador
 * alternaba su `facingMode` igual. ⇒ **el `mirror` cambiaba y la cámara no**,
 * que es exactamente lo que el founder vio: *«no cambia de cámara, invierte
 * la imagen»*.
 *
 * *Un efecto visible es el peor disfraz de una acción que no ocurrió: el botón
 * parecía andar.*
 *
 * ── LA VÍA, en el orden en que se intenta ─────────────────────────────────
 * ① **`applyConstraints({ facingMode })`** — la vía recomendada que midió D.
 *    **No re-crea el track ⇒ sin parpadeo**, y el vet no pierde la imagen.
 * ② **`restartTrack({ facingMode })`** — la API oficial de LiveKit
 *    (`LocalVideoTrack.restartTrack(options?: VideoCaptureOptions)`, medida
 *    contra el objeto). **Re-crea el track ⇒ parpadea**, y durante ese
 *    instante el otro lado no ve nada. Se acepta como plan B porque
 *    *«funciona con parpadeo» es infinitamente mejor que «no funciona»*.
 *
 * ── 🔴 LO QUE DEVUELVE ES LA MITAD DE LA CURA ─────────────────────────────
 * `true` **sólo si la cámara cambió de verdad**. El llamador mueve su estado
 * —y con él el espejo— **únicamente entonces**: así el espejo no puede
 * desincronizarse de la cámara real, que es el estado que producía el
 * síntoma. *El estado sigue al hecho, jamás al intento.*
 */
export async function girarCamara(
  track: LocalVideoTrack | null | undefined,
  destino: Camara,
): Promise<boolean> {
  if (!track) return false;

  // ① sin parpadeo
  try {
    const mst = track.mediaStreamTrack as MediaStreamTrack | undefined;
    if (mst?.applyConstraints !== undefined) {
      await mst.applyConstraints({ facingMode: destino } as MediaTrackConstraints);
      return true;
    }
  } catch {
    /* Cae al plan B. **No se reporta**: que la vía barata no sirva en este
       aparato no es un error del usuario ni algo que pueda hacer al respecto. */
  }

  // ② parpadea, pero cambia
  try {
    await track.restartTrack({ facingMode: destino });
    return true;
  } catch {
    return false;
  }
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
/**
 * Guarda el `facingMode` actual — el espejo lo lee.
 *
 * 🔴 **`alternar` YA NO mueve el estado por su cuenta.** Recibe el track y
 * **sólo cambia si el giro ocurrió de verdad** (ver `girarCamara`). *La v1
 * alternaba siempre, y por eso el espejo se daba vuelta sobre una cámara que
 * no había cambiado.*
 */
export function useCamara(inicial: Camara = 'user') {
  const [camara, setCamara] = useState<Camara>(inicial);
  const girando = useRef(false);

  /**
   * `track` OPCIONAL, y la diferencia es real:
   * · **En la llamada** el track existe y hay que pedirle el giro — si no lo
   *   hace, el estado no se mueve.
   * · **En el pre-join NO hay track que girar**: `PreviewPropio` **crea el
   *   suyo a partir de `camara`**, así que cambiar el estado ES el giro.
   *   *Pedirle a esa vía un track que todavía no le pertenece a nadie sería
   *   inventar un paso.*
   */
  const alternar = useCallback(
    async (track?: LocalVideoTrack | null) => {
      /* Un segundo toque mientras el primero está en vuelo re-crearía el track
         dos veces: *el botón más usado de la pantalla no puede pelear consigo
         mismo.* */
      if (girando.current) return;
      girando.current = true;
      const destino: Camara = camara === 'user' ? 'environment' : 'user';
      const ok = track === undefined ? true : await girarCamara(track, destino);
      if (ok) setCamara(destino);
      girando.current = false;
    },
    [camara],
  );

  return { camara, alternar };
}
