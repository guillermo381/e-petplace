/**
 * EL STUB DE LIVEKIT PARA WEB — `D-940`.
 *
 * ── POR QUÉ EXISTE ────────────────────────────────────────────────────────
 * `@livekit/react-native` usa `requireNativeComponent`, **que no existe en
 * web**. Y LiveKit entra al bundle **por el árbol de rutas**: expo-router
 * bundlea TODAS las rutas, así que la pantalla de videoconsulta rompe el
 * bundle entero **aunque nadie la visite**.
 *
 * 🔴 **Lo que se llevó puesto: la GALERÍA.** Las nueve piezas de videollamada
 * de B están ahí y **nunca se pudieron mirar fuera de una llamada real** —
 * toda la saga del glifo de girar cámara sale de eso.
 *
 * *Una herramienta que se rompe en silencio no avisa: hay que ir a mirarla.*
 * Y ésta es la herramienta con la que esta casa mira sus piezas.
 *
 * ── POR QUÉ UN ALIAS Y NO UN ARCHIVO `.web` ───────────────────────────────
 * Un `.web.tsx` al lado de cada pantalla **no alcanza**, y está medido: el
 * problema no es qué pantalla se monta, es **qué entra al bundle**. Mientras
 * un solo archivo del árbol importe el módulo nativo, web rompe.
 *
 * ⇒ El alias se resuelve **en el bundler**: en web, `@livekit/react-native`
 * y `@livekit/react-native-webrtc` apuntan acá y el módulo nativo **nunca se
 * pide**.
 *
 * ── 🔴 LO QUE ESTE ARCHIVO NO ES ──────────────────────────────────────────
 * **No es una implementación web de la videollamada.** Es un stub para que
 * el resto de la app se pueda mirar. Todo lo que exporta **no hace nada** y
 * lo dice: si alguien intentara una llamada real en web, tiene que fallar
 * ruidosamente y no simular una llamada muda.
 */

import type { ReactNode } from 'react';

const NO_EN_WEB = 'La videollamada sólo funciona en la app del teléfono.';

/** Nada que registrar: en web no hay globals nativos que instalar. */
export function registerGlobals(): void {
  /* deliberadamente vacío */
}

/** El contenedor: en web **no conecta** y lo dice en consola. */
export function LiveKitRoom({ children }: { children?: ReactNode }): ReactNode {
  console.warn(`[livekit-web-stub] ${NO_EN_WEB}`);
  return children ?? null;
}

/* Las piezas de video: nada dibujado. **No devuelven un rectángulo negro** —
   un negro se lee como «la cámara está tapada» y esto es «acá no hay video».  */
export function VideoView(): null {
  return null;
}
export function VideoTrack(): null {
  return null;
}
export function BarVisualizer(): null {
  return null;
}

/* Los hooks: valores neutros con la forma que los consumidores esperan, para
   que la pantalla monte sin romper. */
export function useConnectionState(): string {
  return 'disconnected';
}
export function useLocalParticipant(): { localParticipant: unknown; cameraTrack: null } {
  return {
    localParticipant: {
      setMicrophoneEnabled: () => Promise.resolve(),
      setCameraEnabled: () => Promise.resolve(),
    },
    cameraTrack: null,
  };
}
export function useRemoteParticipants(): unknown[] {
  return [];
}
export function useParticipantTracks(): unknown[] {
  return [];
}

/** La sesión de audio: no-op. */
export const AudioSession = {
  configureAudio: () => Promise.resolve(),
  startAudioSession: () => Promise.resolve(),
  stopAudioSession: () => Promise.resolve(),
  selectAudioOutput: () => Promise.resolve(),
  getAudioOutputs: () => Promise.resolve([]),
};

export const AndroidAudioTypePresets = {
  communication: {},
  media: {},
};

/** 🔴 Crear un track **falla ruidosamente**: es la frontera donde una llamada
 *  real dejaría de ser posible, y fingir que se creó daría una pantalla que
 *  espera para siempre un video que nunca llega. */
export function createLocalVideoTrack(): Promise<never> {
  return Promise.reject(new Error(NO_EN_WEB));
}

export const Track = { Source: { Camera: 'camera', Microphone: 'microphone' } };
export const VideoPresets = { h720: { resolution: { width: 1280, height: 720 } } };
export const ConnectionState = {
  Disconnected: 'disconnected',
  Connecting: 'connecting',
  Connected: 'connected',
  Reconnecting: 'reconnecting',
};
