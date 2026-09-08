/**
 * LA VOZ DE LA ETAPA PARA LA FAMILIA — **una sola fuente, no dos que
 * coincidan.**
 *
 * ═══ 🔴 POR QUÉ EXISTE: LO ESCRIBÍ DE DOS MANERAS DISTINTAS ════════════════
 *
 * `mis-casos.tsx` declaraba en su cabecera *«el plazo NO se muestra acá:
 * `plazoHasta` es el reloj del PRESTADOR»*, y **la pantalla del caso lo
 * mostraba** — «Estás en: Con el prestador · **responde antes del** 9/9/2026,
 * 10:27:56 AM». Dos superficies del MISMO arco, escritas por la misma persona,
 * diciéndose distinto sobre el mismo dato.
 *
 * *Lo encontré caminando, y ningún gate podía verlo: un typecheck no compara
 * lo que dos pantallas afirman.*
 *
 * ── LO QUE ESTABA MAL, y eran TRES cosas a la vez ─────────────────────────
 * ① **§2 es explícito**: la familia no ve el reloj de 48 h — *un countdown
 *    sobre el incumplimiento ajeno convierte la espera en espectáculo*.
 * ② **«responde antes del» es una instrucción AL PRESTADOR** dicha a la
 *    familia, que no responde nada ahí.
 * ③ el formato salía de un `toLocaleString()` crudo (`9/9/2026, 10:27:56 AM`),
 *    el mismo defecto de región que ya se curó una vez en esa pantalla.
 *
 * ── 🔴 LA FORMA DE LA CURA: EL PLAZO ES INEXPRESABLE, NO «NO SE PASA» ──────
 *
 * **Esta función no recibe `plazoHasta` y no puede recibirlo.** No alcanza con
 * que las dos superficies coincidan hoy: *dos lugares que coinciden son dos
 * lugares que pueden dejar de coincidir, y el que se desvíe no va a fallar —
 * va a decir algo distinto.* Acá el dato del prestador **no entra al tipo**,
 * así que mostrarlo desde una superficie del cliente exige salirse de esta
 * función, que es un acto visible en un diff.
 *
 * *Precedente de la casa: un estado malo no se documenta, se vuelve
 * inexpresable.*
 *
 * ── 🔒 Y ADEMÁS TIENE GUARD: `R83` de `verify:diseno` ─────────────────────
 * Mide que `.plazoHasta` no se USE en ninguna superficie del cliente —usos, no
 * menciones, así que este comentario no la enciende—. Nació como script suelto
 * mío y **B lo cableó a la regla y le agregó lo que le faltaba: el ancla.**
 * *Suelto, con el corpus vacío imprimía `0 archivo(s)` y salía VERDE — `L-192`
 * puro: un cero sin corpus no dice «no hay», dice «no miré».*
 */

import type { EtapaCaso as EtapaDeLaEscalera } from '@epetplace/ui';

/** Los estados que el MOTOR devuelve en `etapa`: la escalera + los finales. */
export type EstadoDeCasoDelMotor =
  | EtapaDeLaEscalera
  | 'resuelto_entre_partes'
  | 'retirado'
  | 'sin_lugar';

/** La firma angosta: el `t` tipado de la app es asignable. */
type TEtapa = (
  clave:
    | 'postventa.etapaRecibido'
    | 'postventa.etapaConPrestador'
    | 'postventa.etapaConCasa'
    | 'postventa.etapaResuelto'
    | 'postventa.etapaCerrado',
) => string;

const CLAVE: Record<EtapaDeLaEscalera, Parameters<TEtapa>[0]> = {
  recibido: 'postventa.etapaRecibido',
  con_prestador: 'postventa.etapaConPrestador',
  con_epetplace: 'postventa.etapaConCasa',
  resuelto: 'postventa.etapaResuelto',
  cerrado: 'postventa.etapaCerrado',
};

/** El nombre de la etapa, en voz de familia. */
export function vozDeEtapa(t: TEtapa, etapa: EtapaDeLaEscalera): string {
  return t(CLAVE[etapa]);
}

/**
 * La línea de estado que la familia lee: **en qué etapa está, y nada más.**
 *
 * `null` cuando la etapa no vive en la escalera (los finales alternos): ahí la
 * línea la pone el final, no esto. *Devolver una cadena vacía dejaría un
 * renglón en blanco que se lee como un defecto.*
 */
export function lineaDeEstadoParaFamilia(
  t: TEtapa & ((c: 'postventa.estasEn', v: { etapa: string }) => string),
  etapa: EtapaDeLaEscalera | null,
): string | null {
  if (etapa === null) return null;
  return t('postventa.estasEn', { etapa: vozDeEtapa(t, etapa) });
}

/**
 * El mapa completo etapa→voz, para las piezas que lo piden entero
 * (`EscaleraCaso.voces`). **Sale de la MISMA tabla que la línea de estado**:
 * el punto de este archivo es que no haya dos.
 */
export function vocesDeLaEscalera(t: TEtapa): Record<EtapaDeLaEscalera, string> {
  return {
    recibido: t(CLAVE.recibido),
    con_prestador: t(CLAVE.con_prestador),
    con_epetplace: t(CLAVE.con_epetplace),
    resuelto: t(CLAVE.resuelto),
    cerrado: t(CLAVE.cerrado),
  };
}

/**
 * 🔴 **LA VOZ DE CUALQUIER ESTADO QUE EL MOTOR DEVUELVA** — etapas Y finales.
 *
 * ⏪ **Nació de un código crudo que vi caminando**: la fila de una cita pasada
 * decía *«Tienes un caso abierto sobre este servicio · **resuelto_entre_partes**»*
 * — el valor del motor, sin traducir, saliendo a una familia. Es la TERCERA vez
 * en esta sesión que esta clase se cobra (antes fueron `guarderia_dia` y
 * `paseo`), y las tres veces por lo mismo: **el dato viajó a la pantalla y
 * nadie lo pasó por su riel.**
 *
 * Vive acá y no en la pantalla del caso —donde ya existía como `VOZ_FINAL`
 * local— porque **eso es exactamente la duplicación que este archivo vino a
 * curar**: dos tablas que hoy dicen lo mismo son dos que pueden dejar de
 * decirlo.
 */
export function vozDeEstadoDeCaso(
  t: TEtapa & ((c: 'postventa.final_resuelto_entre_partes' | 'postventa.final_retirado' | 'postventa.final_sin_lugar') => string),
  estado: EstadoDeCasoDelMotor,
): string {
  switch (estado) {
    case 'resuelto_entre_partes':
      return t('postventa.final_resuelto_entre_partes');
    case 'retirado':
      return t('postventa.final_retirado');
    case 'sin_lugar':
      return t('postventa.final_sin_lugar');
    default:
      return vozDeEtapa(t, estado);
  }
}
