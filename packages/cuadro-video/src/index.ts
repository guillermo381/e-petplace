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
export type ResultadoCuadro =
  | { ok: true; ruta: string }
  /** `sin_modulo` = binario sin hornear · `sin_frame` = el techo se cumplió
   *  sin que llegara imagen · el resto son los códigos del módulo. */
  | { ok: false; codigo: string; mensaje: string };

/**
 * 🔴 **EL TECHO VIVE ACÁ, y es lo que el módulo declaró que le faltaba.**
 *
 * Su propio comentario lo dice: *«sin frames no hay promesa resuelta, y una
 * promesa que nunca resuelve es una pantalla colgada… el techo lo pone la
 * app»*. **Y la app no se lo puso** — *declarar una deuda en el lugar
 * correcto no la paga, y ésta se cobró en la primera cita real.*
 *
 * ⚠️ **El caso que lo dispara no es raro: es el normal.** `pistasRemotas > 0`
 * dice que **la pista EXISTE**, no que esté emitiendo — con la cámara del
 * otro apagada la pista sigue publicada y muteada. *El sink espera un frame
 * que no va a llegar nunca.*
 *
 * **8 s** porque un frame de una llamada viva llega en decenas de
 * milisegundos: *si a los ocho segundos no llegó, no es lentitud — es que no
 * hay imagen.*
 */
export async function capturarCuadro(trackId: string, pcId = -1): Promise<ResultadoCuadro> {
  const marca = (paso: string, detalle?: unknown) =>
    console.log(`[CUADRO_C] ${paso}`, detalle ?? '');

  marca('puerta:entra', { trackId, pcId, hayModulo: nativo !== null });
  if (nativo === null) {
    return { ok: false, codigo: 'sin_modulo', mensaje: 'El binario no trae el módulo.' };
  }
  try {
    const ruta = await Promise.race([
      nativo.capturarCuadro(trackId, pcId).then((r) => ({ tipo: 'ok' as const, r })),
      new Promise<{ tipo: 'techo' }>((res) => setTimeout(() => res({ tipo: 'techo' }), 8000)),
    ]);
    if (ruta.tipo === 'techo') {
      marca('puerta:techo', 'no llegó ningún frame en 8s');
      return { ok: false, codigo: 'sin_frame', mensaje: 'No llegó imagen del otro lado.' };
    }
    marca('puerta:ok', ruta.r);
    return { ok: true, ruta: ruta.r };
  } catch (e) {
    /* 🔴 **El código tipado YA NO SE PIERDE.** La v1 hacía `return null` y con
       eso `track_no_encontrado`, `track_no_es_video` y `fallo_conversion` se
       veían todos iguales — *tres causas distintas con el mismo síntoma es
       exactamente lo que impidió diagnosticar el fallo de la cita real.* */
    const codigo = (e as { code?: string })?.code ?? 'error_desconocido';
    marca('puerta:excepcion', { codigo, e: String(e) });
    return { ok: false, codigo, mensaje: String(e) };
  }
}
