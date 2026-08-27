/**
 * EL CUADRO CONGELADO — la mitad JS: capturar, avisar, subir, adjuntar.
 *
 * ── LAS TRES FIRMAS, y dónde vive cada una ───────────────────────────────
 * ① **NO cuenta como grabación** — es una observación clínica capturada, de
 *    la misma clase que la foto que un vet saca en el consultorio. *Lo dice
 *    la voz de la pantalla; acá no se toca `roomRecord`.*
 * ② 🔴 **EL DUEÑO LO VE EN EL MOMENTO** — `avisarAlOtroLado`. *No se captura
 *    en silencio a alguien que está en cámara.* Va por el canal de datos de
 *    LiveKit, que es **JS puro y viaja por OTA**.
 * ③ **Entra al expediente con su marca de origen** —
 *    `adjuntarCuadroTeleconsulta` ya existe tomando bucket + path, pero
 *    ⚠️ **falta el paso previo: subir el PNG a `cita-archivos`**. No hay
 *    wrapper de subida para ese bucket y `packages/api` es de A ⇒ **pedido
 *    a A**, declarado. *Hasta que exista, la captura ocurre y se ve, y no
 *    llega al expediente — se dice, no se simula.*
 */

/** El sobre que viaja por el canal de datos. Versionado: *un mensaje sin
 *  versión no se puede cambiar sin romper a quien todavía no actualizó.* */
export const AVISO_CUADRO = 'epp.cuadro.v1';

/**
 * 🔴 EL `pcId` DEL TRACK REMOTO — y por qué se lee así, declarado.
 *
 * El módulo nativo pide `pcId` porque `WebRTCModule.getTrack(int, String)` lo
 * pide. **LiveKit crea su PeerConnection por dentro**, así que el número sale
 * de su cadena interna: `engine.pcManager.subscriber.pc._pcId`.
 *
 * ⚠️ **Es API interna de `livekit-client`, y se declara como tal.** *Si un día
 * cambia, esto devuelve `null`, el botón no se dibuja y la llamada sigue
 * intacta* — el modo de falla es un botón ausente, jamás una pantalla rota.
 */
export function pcIdDeLaSala(room: unknown): number | null {
  try {
    const r = room as { engine?: { pcManager?: { subscriber?: { pc?: { _pcId?: number } } } } };
    const id = r.engine?.pcManager?.subscriber?.pc?._pcId;
    return typeof id === 'number' ? id : null;
  } catch {
    return null;
  }
}
