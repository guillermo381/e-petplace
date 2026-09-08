/**
 * LA FORMA DEL CASO — el `leerCaso` de A llega sin tipar y acá se le da forma.
 *
 * 🔴 **A devuelve `Record<string, unknown>`**, así que el tipo no protege
 * nada: si el motor renombra una clave, la pantalla lee `undefined` y **no
 * falla — dibuja un hueco**. Esta frontera existe para que ese riesgo viva en
 * UN archivo y no repartido por el render.
 *
 * ⚠️ **No inventa defaults cómodos.** Lo que no viene queda `null` y la
 * pantalla decide qué decir — `L-139`: un dato verosímil-falso es más caro que
 * un hueco declarado.
 */

import type { EtapaCaso as EtapaDelMotor, ObjetoPostventa } from '@epetplace/api';
import type { EtapaCaso as EtapaDeLaEscalera, FinalCaso } from '@epetplace/ui';

/**
 * 🔴 **DOS VOCABULARIOS PARA LO MISMO, Y SÓLO SE VEN MONTÁNDOLOS.**
 *
 * `EtapaCaso` existe en `@epetplace/api` (A) **y** en `@epetplace/ui` (B), con
 * el mismo nombre y contenido distinto. Los dos modelos **coinciden en
 * estructura** —cinco pasos en la escalera y tres finales fuera de ella,
 * `cat_estados_caso.en_escalera` lo dice— y divergen **sólo en los nombres**:
 * ```
 *   A: con_casa               ·  B: con_epetplace
 *   A: resuelto_entre_partes  ·  B: resuelto_entre_ustedes
 *   A: los tres finales DENTRO de EtapaCaso  ·  B: aparte, en FinalCaso
 * ```
 * *Lo cazó el compilador porque el choque de nombres fue exacto; con una letra
 * de diferencia habrían quedado los dos conviviendo y nadie se entera.*
 *
 * ⇒ **La traducción es TOTAL y vive acá.** `Record` completo sobre el tipo de
 * A: si mañana el motor agrega una etapa, esto no compila hasta que alguien
 * decida de qué lado va. *Un mapa parcial dejaría que una etapa nueva cayera
 * en «no está en la escalera» sin que nadie lo note.*
 */
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

const A_FINAL: Record<EtapaDelMotor, FinalCaso | null> = {
  recibido: null,
  con_prestador: null,
  con_casa: null,
  /* ⚠️ `resuelto` y `cerrado` son `es_final=true` en el catálogo del motor
     **y NO son finales alternos**: son el camino normal. El discriminador
     correcto no es `es_final` sino `en_escalera`, y por eso van en `null`. */
  resuelto: null,
  cerrado: null,
  resuelto_entre_partes: 'resuelto_entre_ustedes',
  retirado: 'retirado',
  sin_lugar: 'sin_lugar',
};

export type CasoLeido = {
  casoId: string;
  /** La etapa **en el vocabulario de la escalera**. `null` = final alterno. */
  etapa: EtapaDeLaEscalera | null;
  /**
   * El final alterno, si lo hay (§3.1).
   *
   * 🔴 **Y con él la escalera NO se dibuja, que es una degradación declarada.**
   * §3.1 quiere la fila *congelada donde estaba* con la línea de abajo
   * reemplazada — pero el motor pisa `etapa` con el final y **la etapa previa
   * se pierde**: `estado_final = p_hasta` y `etapa = p_hasta` guardan lo
   * mismo. Sin ese dato, dibujar la fila exigiría **inventar** en qué paso
   * quedó. *Se muestra la etiqueta del final sola, que es verdadera, en vez de
   * una escalera verosímil-falsa.* Pedido a A: `etapa_en_escalera`.
   */
  finalAlterno: FinalCaso | null;
  clase: 1 | 2 | 3;
  motivo: string;
  /** ¿Esta etapa se dibuja en la escalera? Lo dice el catálogo del motor. */
  enEscalera: boolean;
  /** El caso terminó ⇒ la barra pasa a lectura (§3.3). */
  cerrado: boolean;
  /** El plazo del prestador, CRUDO. La frase la compone la pantalla (i18n). */
  plazoHasta: string | null;
  objeto: { tipo: ObjetoPostventa | null; id: string | null; titulo: string | null; fecha: string | null };
  resolucion: {
    alcance: string | null;
    monto: number | null;
    camino: string | null;
    destino: string | null;
    destinoEstado: string | null;
  };
  /** §3.3: «si el hecho pide algo mío, debajo va la carta» — UNA a la vez. */
  accionPendiente: 'elegir_devolucion' | null;
};

function texto(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null;
}
function objeto(v: unknown): Record<string, unknown> {
  return v !== null && typeof v === 'object' ? (v as Record<string, unknown>) : {};
}

export function darFormaAlCaso(d: Record<string, unknown>): CasoLeido | null {
  const casoId = texto(d.caso_id);
  const etapa = texto(d.etapa) as EtapaDelMotor | null;
  if (casoId === null || etapa === null) return null;
  /* Una etapa que el mapa no conoce **no se adivina**: el caso no se dibuja y
     la pantalla dice que no pudo. Es la salida ruidosa. */
  if (!(etapa in A_ESCALERA)) return null;

  const o = objeto(d.objeto);
  const r = objeto(d.resolucion);

  return {
    casoId,
    etapa: A_ESCALERA[etapa],
    finalAlterno: A_FINAL[etapa],
    clase: (typeof d.clase === 'number' ? d.clase : 2) as 1 | 2 | 3,
    motivo: texto(d.motivo) ?? '',
    /* Si el motor no lo dice, se DIBUJA la escalera: esconderla por una clave
       ausente dejaría a la familia sin saber en qué paso está. */
    enEscalera: d.en_escalera !== false,
    cerrado: d.cerrado === true,
    plazoHasta: texto(d.plazo_hasta),
    objeto: {
      tipo: (texto(o.tipo) as ObjetoPostventa | null) ?? null,
      id: texto(o.id),
      titulo: texto(o.titulo),
      fecha: texto(o.fecha),
    },
    resolucion: {
      alcance: texto(r.alcance),
      monto: typeof r.monto === 'number' ? r.monto : null,
      camino: texto(r.camino),
      destino: texto(r.destino),
      destinoEstado: texto(r.destino_estado),
    },
    accionPendiente: texto(d.accion_pendiente) === 'elegir_devolucion' ? 'elegir_devolucion' : null,
  };
}
