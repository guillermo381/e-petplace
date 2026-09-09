/**
 * LA TRADUCCIÓN ENTRE LOS DOS VOCABULARIOS DEL CASO.
 *
 * ⏪ **Este archivo era una frontera de tipos**: `leerCaso` devolvía
 * `Record<string, unknown>` y acá se le daba forma a mano. **A lo tipó**
 * (`CasoDetalle`) y esa mitad se retira — *un puente que sobrevive a su río
 * manda al próximo a construir otro* (`L-395`).
 *
 * 🔴 **Lo que SÍ queda, porque no lo resuelve un tipo: `EtapaCaso` existe DOS
 * VECES**, en `@epetplace/api` y en `@epetplace/ui`, con el mismo nombre y
 * distinto contenido:
 * ```
 *   A: … con_casa      … + resuelto_entre_partes  (los finales DENTRO)
 *   B: … con_epetplace …   FinalCaso aparte: resuelto_entre_ustedes
 * ```
 * Los dos modelos coinciden en ESTRUCTURA y divergen sólo en los nombres.
 * *Lo cazó el compilador porque el choque fue exacto; con una letra de
 * diferencia habrían quedado los dos conviviendo.*
 *
 * ⇒ **la traducción es TOTAL**: `Record` completo sobre los tipos de A, así
 * una etapa o un final nuevos **no compilan** hasta que alguien decida su
 * equivalente. *Un mapa parcial dejaría una etapa nueva cayendo en silencio.*
 */

import type { CasoDetalle, EtapaCaso as EtapaDelMotor, FinalAlterno } from '@epetplace/api';
import type { EtapaCaso as EtapaDeLaEscalera, FinalCaso } from '@epetplace/ui';

const A_ESCALERA: Record<EtapaDelMotor, EtapaDeLaEscalera | null> = {
  recibido: 'recibido',
  con_prestador: 'con_prestador',
  con_casa: 'con_epetplace',
  resuelto: 'resuelto',
  cerrado: 'cerrado',
  /* Los tres finales alternos NO son etapas de la fila (§3.1). */
  resuelto_entre_partes: null,
  retirado: null,
  sin_lugar: null,
};

const A_FINAL: Record<FinalAlterno, FinalCaso> = {
  resuelto_entre_partes: 'resuelto_entre_ustedes',
  retirado: 'retirado',
  sin_lugar: 'sin_lugar',
};

export type CasoParaLaPantalla = CasoDetalle & {
  /**
   * 🔴 **EL PASO DONDE SE CONGELA LA FILA** — y ahora existe de verdad.
   *
   * ⏪ Yo dibujaba **la etiqueta del final sola, sin escalera**, porque el
   * motor pisaba `etapa` con el final y la etapa previa se perdía. Lo pedí en
   * C② y **A lo entregó** (`etapaEnEscalera`), así que §3.1 se puede cumplir
   * entero: *la fila queda congelada donde estaba y la línea de abajo la
   * reemplaza su etiqueta.*
   */
  etapaDeLaFila: EtapaDeLaEscalera | null;
  /** El final en el vocabulario de la pieza. `null` = no hay final alterno. */
  finalDeLaFila: FinalCaso | null;
};

export function traducirCaso(c: CasoDetalle): CasoParaLaPantalla {
  /* 🔴 **`etapaEnEscalera` SÓLO manda cuando hay FINAL ALTERNO, y ése era el
     defecto que el founder vio: un caso CERRADO se dibujaba como «Resuelto».**

     Ese campo existe para una cosa: congelar la fila donde estaba cuando el
     caso salió de la escalera por un final que no es un paso (resuelto entre
     ustedes, retirado, sin lugar). *Pero `cerrado` SÍ es un paso de la
     escalera* — el último—, y aplicarle el congelado lo devolvía al anterior.

     ⇒ con final alterno se usa el congelado; **sin él, manda la etapa real**,
     que es la que la familia tiene que ver. */
  const base = c.final !== null ? (c.etapaEnEscalera ?? c.etapa) : c.etapa;
  return {
    ...c,
    etapaDeLaFila: A_ESCALERA[base],
    finalDeLaFila: c.final !== null ? A_FINAL[c.final] : null,
  };
}
