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
  const marca = (paso: string, d?: unknown) => console.log(`[CUADRO_C] pcId:${paso}`, d ?? '');
  try {
    const r = room as {
      engine?: { pcManager?: Record<string, unknown> };
    };
    const mgr = r.engine?.pcManager;
    if (mgr === undefined) {
      marca('sin_pcManager');
      return null;
    }

    /* Los transportes, en el orden en que sirven: el SUSCRIPTOR es el que
       recibe el video del otro lado. El publicador queda de respaldo. */
    /* 🔴 **EL EJE QUE DECIDE ES ÉSTE: CUÁL TRANSPORTE**, no cuál forma del
       `pc`. Medido en aparato (27-ago): resolvió `via: 'pc'` — *la misma
       forma que la v1 ya usaba* ⇒ **el eje `pc` vs `_pc` NO era la causa**.
       Lo que curó fue **recorrer los cuatro transportes**: la v1 miraba sólo
       `subscriber`.
       *Y la marca de la v1 reportaba el eje que NO discriminaba y callaba el
       que decide — por eso ahora el nombre del transporte va en el log:
       **sin él, el próximo que toque esto protege la forma equivocada y borra
       la que lo sostiene**.* */
    const transportes: Array<[string, unknown]> = [
      ['subscriber', mgr['subscriber']],
      ['publisher', mgr['publisher']],
      ['_subscriber', mgr['_subscriber']],
      ['_publisher', mgr['_publisher']],
    ];

    for (const [nombre, t] of transportes) {
      if (t === undefined || t === null) continue;
      const tr = t as Record<string, unknown>;
      /* Las dos formas del `pc` se conservan por prudencia —`PCTransport`
         declara `private _pc` y `private get pc()`, y un bundle minificado
         puede llevarse el getter— **pero medido, hoy gana `pc`**: no fue
         ésta la causa. Se queda como red, no como cura. */
      const pc = (tr['pc'] ?? tr['_pc']) as { _pcId?: number } | undefined;
      const id = pc?._pcId;
      if (typeof id === 'number') {
        /* **El transporte va PRIMERO**: es el eje que decide. */
        marca('resuelto', { transporte: nombre, via: tr['pc'] !== undefined ? 'pc' : '_pc', id });
        return id;
      }
    }
    /* Se dice QUÉ había, no sólo que falló: *sin esto, «no se pudo» obliga a
       la próxima sesión a re-medir lo mismo desde cero.* */
    marca('no_resuelto', { claves: Object.keys(mgr) });
    return null;
  } catch (e) {
    marca('excepcion', String(e));
    return null;
  }
}
