/**
 * EL PADRINAZGO QUE SABE MORIR — `LETRA_ADOPCION` §6, firma ⑩.
 *
 * > *«🔴 **El padrinazgo sabe morir.** Si el ahijado es adoptado, fallece o el
 * > refugio se va, **el cobro recurrente se detiene solo — jamás sigue por
 * > inercia.** El padrino recibe correo y aviso en la app: *tu ahijado fue
 * > adoptado*, con la novedad **sin violar la privacidad de la familia que
 * > adoptó**, el agradecimiento, y la invitación a apadrinar a otro.»*
 *
 * ─────────────────────────────────────────────────────────────────────────
 * 🅿️ UNA DE LAS TRES CAUSAS ESTÁ ESTACIONADA, Y LA PUERTA NACE CERRADA.
 *
 * §6 firma las TRES causas pero **da el texto sólo para «adoptado»**. Para
 * «fallece» choca con una firma anterior: **S88 firmó que la liberación por
 * memorial CALLA** — está en el body de `_trg_mascotas_memorial_planes`:
 * *«el memorial calla, también acá… LA LIBERACIÓN SIGUE OCURRIENDO. Lo que
 * muere es el AVISO»*.
 *
 * Las dos firmas se tocan y **no las resuelve una pista**: va al estacionamiento
 * de S111 con el voto de D (avisar, con voz de duelo y sin invitación a
 * apadrinar otro en el mismo mensaje — el silencio de S88 protege a la FAMILIA,
 * y el padrino es un tercero que está pagando).
 *
 * **Fail-closed mientras tanto:** la causa `fallecido` EXISTE y su aviso NO
 * sale. El cobro se detiene igual — eso no está en duda y no depende del aviso.
 * ─────────────────────────────────────────────────────────────────────────
 */

export type CausaFinPadrinazgo = 'adoptado' | 'fallecido' | 'refugio_inactivo';

export interface ReglaFinPadrinazgo {
  readonly causa: CausaFinPadrinazgo;
  /** Siempre true: §6 dice «el cobro se detiene solo, jamás sigue por inercia». */
  readonly detieneCobro: true;
  /** ¿Sale aviso al padrino? `false` = estacionado, no = decidido que no. */
  readonly avisa: boolean;
  /** Por qué no avisa, cuando no avisa. Para que el silencio sea auditable. */
  readonly motivoSinAviso?: string;
}

export const REGLAS_FIN_PADRINAZGO: ReadonlyArray<ReglaFinPadrinazgo> = [
  { causa: 'adoptado', detieneCobro: true, avisa: true },
  {
    causa: 'fallecido',
    detieneCobro: true,
    avisa: false,
    motivoSinAviso:
      'S111-ESTACIONAMIENTO · §6 firma el aviso para las tres causas pero ' +
      'S88 firmó que el memorial calla. Sin resolver, el aviso NO sale.',
  },
  { causa: 'refugio_inactivo', detieneCobro: true, avisa: true },
];

export function reglaFin(causa: CausaFinPadrinazgo): ReglaFinPadrinazgo {
  const r = REGLAS_FIN_PADRINAZGO.find((x) => x.causa === causa);
  // Unión cerrada: si esto se rompe, es que alguien agregó una causa sin regla.
  if (!r) throw new Error(`causa_sin_regla:${causa}`);
  return r;
}

/** ¿Sale aviso al padrino por esta causa? Fail-closed. */
export function avisaAlPadrino(causa: CausaFinPadrinazgo): boolean {
  return reglaFin(causa).avisa;
}
