/**
 * LA DERIVACIÓN DE LA ESCALERA DE ADOPCIÓN — los siete estados del motor a
 * `etapa` + `final` (dirección del chat §1).
 *
 * 🔴 **POR QUÉ VIVE ACÁ Y NO EN LA PANTALLA.** B dejó el mapeo escrito en la
 * lápida de la pieza retirada **y sin implementar**. Si lo escribiera cada
 * consumidor, se escribiría **dos veces** —el hilo de la familia y el del
 * refugio— *y dos implementaciones de la misma regla se desincronizan el día
 * que el motor gane un octavo estado*: una lo dibujaría y la otra lo mandaría
 * al `default`, sin que ningún typecheck lo vea.
 *
 * Es dominio puro: se lee y se prueba sin montar nada.
 *
 * ⚠️ **LO QUE NO DECIDE:** ni las palabras ni el color. La etiqueta del final
 * la trae cada asiento —la familia lee *«Declinada»*, el refugio puede leer
 * otra cosa— y el acento lo resuelve la pieza contra su tema. *Si esta función
 * eligiera la voz, la ley del asiento se rompería de a una pantalla por vez.*
 */

export type EtapaSolicitud =
  | 'enviada'
  | 'en_conversacion'
  | 'aceptada'
  | 'acta_firmada'
  | 'una_vida_nueva';

export type FinalSolicitud = 'declinada' | 'desistida' | 'no_concretada';

/** Los SIETE del motor. Si el CHECK gana un octavo, esto no compila. */
export type EstadoSolicitudMotor =
  | 'recibida'
  | 'en_conversacion'
  | 'aceptada'
  | 'declinada'
  | 'desistida'
  | 'no_concretada_fallecimiento'
  | 'no_concretada_otra_familia';

export type EscaleraDeSolicitud =
  | { montar: false; razon: 'memorial' }
  | { montar: true; etapa: EtapaSolicitud; final: FinalSolicitud | null };

/**
 * @param estado       el estado del motor
 * @param actaFirmada  si ya se firmó el acta (el motor no lo dice en `estado`)
 * @param traspasada   si la mascota ya cambió de familia
 */
export function escaleraDeSolicitud(
  estado: EstadoSolicitudMotor,
  actaFirmada = false,
  traspasada = false,
): EscaleraDeSolicitud {
  /* 🔴 EL MEMORIAL NO MONTA NADA — ni escalera ni línea. Decisión ya firmada:
     *no se le dice dos veces la misma noticia.* Va PRIMERO: si estuviera
     después, cualquier rama de arriba lo dibujaría antes de llegar acá. */
  if (estado === 'no_concretada_fallecimiento') return { montar: false, razon: 'memorial' };

  /* La etapa ALCANZADA, que es la que la fila conserva cuando algo la cierra.
     *Un final no borra el camino recorrido: lo detiene donde estaba.* */
  const alcanzada: EtapaSolicitud = traspasada
    ? 'una_vida_nueva'
    : actaFirmada
      ? 'acta_firmada'
      : estado === 'aceptada'
        ? 'aceptada'
        : estado === 'en_conversacion'
          ? 'en_conversacion'
          : 'enviada';

  switch (estado) {
    case 'recibida':
    case 'en_conversacion':
    case 'aceptada':
      return { montar: true, etapa: alcanzada, final: null };
    case 'declinada':
      return { montar: true, etapa: alcanzada, final: 'declinada' };
    case 'desistida':
      return { montar: true, etapa: alcanzada, final: 'desistida' };
    case 'no_concretada_otra_familia':
      return { montar: true, etapa: alcanzada, final: 'no_concretada' };
  }
}
