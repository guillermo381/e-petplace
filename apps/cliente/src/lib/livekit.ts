/**
 * EL ARRANQUE DE LIVEKIT — `registerGlobals()`, una sola vez, en el raíz.
 *
 * ── POR QUÉ EN EL RAÍZ Y NO EN LA PANTALLA (cambio deliberado) ────────────
 * En la prueba de cable de la tanda 1 esto vivía en el módulo de la ruta,
 * porque era **dev-only** y no correspondía meter un módulo nativo en el
 * arranque de la app de una familia. **Con superficie real de producto, el
 * arranque ES su lugar**: `registerGlobals()` parchea objetos globales de
 * WebRTC y tiene que haber corrido antes de que cualquier pantalla de video
 * monte. *(Quedó escrito en §7 del recorrido de la tanda 1, justo para que
 * este cambio no se leyera como un descuido.)*
 *
 * ── EL GUARD NO ES PRUDENCIA: ES EL PRECEDENTE D-456 ──────────────────────
 * `@livekit/react-native` es **módulo NATIVO**. Un binario horneado antes de
 * esta build **no lo tiene**, y sin el try/catch importar esto **tira la app
 * entera al arrancar** en vez de degradar. Con el guard, una app vieja abre
 * normal y sólo la videoconsulta no funciona — que es exactamente lo que
 * corresponde.
 */

let listo = false;
let motivoFallo: string | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const lk = require('@livekit/react-native') as typeof import('@livekit/react-native');
  lk.registerGlobals();
  listo = true;
} catch (e) {
  // El literal se guarda: un fallo de transporte se diagnostica con su texto.
  motivoFallo = String(e);
}

export const livekitListo = listo;
export const livekitMotivoFallo = motivoFallo;
