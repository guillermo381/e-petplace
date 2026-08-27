/**
 * LA PUERTA JS DEL CUADRO CONGELADO.
 *
 * ⚠️ **`require` en try/catch, precedente `D-456`.** Si el binario instalado
 * no lleva el módulo —cualquier APK anterior a la build que lo hornea— esto
 * devuelve `null` y **la app no crashea**: la pantalla simplemente no ofrece
 * el botón. *Un módulo nativo que falta tiene que ser un botón ausente, jamás
 * una app cerrada.*
 */
type ModuloNativo = {
  capturarCuadro: (trackId: string, pcId: number) => Promise<string>;
};

let nativo: ModuloNativo | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { requireNativeModule } = require('expo-modules-core');
  nativo = requireNativeModule('CuadroVideo') as ModuloNativo;
} catch {
  nativo = null;
}

/** `true` sólo si el binario trae el módulo. La pantalla lo consulta ANTES
 *  de dibujar el botón (Ley 23: la puerta no ofrece lo que va a rechazar). */
export const cuadroDisponible = nativo !== null;

/**
 * Captura UN cuadro y devuelve la ruta del PNG.
 *
 * @param pcId `-1` = el track LOCAL (la propia cámara) · el id de la
 *        PeerConnection = el REMOTO. **La misma llamada sirve para los dos**
 *        en Android (`WebRTCModule.getTrack` es público); en iOS el brazo
 *        remoto **está declarado pendiente y rebota**, jamás devuelve el
 *        local en su lugar.
 */
export async function capturarCuadro(trackId: string, pcId = -1): Promise<string | null> {
  if (nativo === null) return null;
  try {
    return await nativo.capturarCuadro(trackId, pcId);
  } catch {
    /* El error tipado se pierde a propósito en esta capa: quien decide qué
       decirle a la persona es la pantalla, y todavía no hay pantalla. */
    return null;
  }
}
