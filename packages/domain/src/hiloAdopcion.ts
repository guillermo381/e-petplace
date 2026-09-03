/**
 * EL HILO, ARMADO — agrupado, separadores de día y eventos (S112-C · C3).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **DEVUELVE DEL MÁS NUEVO AL MÁS VIEJO, porque la lista es INVERTIDA.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * `SuperficieChat` monta una `FlatList` invertida: **el índice 0 se dibuja
 * ABAJO** y el arreglo avanza hacia arriba. Eso tiene dos consecuencias que
 * son fáciles de invertir sin darse cuenta, y las dos están acá:
 *
 * · **el orden es descendente** — el nombre de la prop de B lo grita
 *   (`datosDelMasNuevoAlMasViejo`) justo porque *al revés la conversación se
 *   lee de atrás para adelante sin ningún error*;
 * · **el separador de día va DESPUÉS de los mensajes de ese día en el
 *   arreglo**, para quedar ARRIBA de ellos en pantalla. *Puesto «antes», como
 *   dicta la intuición de una lista normal, cada fecha rotula el día
 *   equivocado — y se lee perfectamente bien.*
 *
 * ── POR QUÉ VIVE EN `domain` Y NO EN CADA APP ───────────────────────────
 * Es derivación pura sobre el contrato del hilo, **idéntica en las dos
 * superficies**: la familia y el refugio ven la misma conversación agrupada de
 * la misma forma. Dos copias serían dos reglas de agrupado que divergen el día
 * que alguien toque una. Y no es de `packages/ui`: no dibuja nada.
 *
 * ── LA AGRUPACIÓN, Y SU BORDE ────────────────────────────────────────────
 * §2.3: *«los mensajes seguidos de la misma persona en pocos minutos van
 * juntos, sin repetir cara ni nombre; la hora aparece chica bajo el último del
 * grupo»*. **Un grupo se corta por TRES cosas** — cambia el autor, pasan más
 * de `VENTANA_MIN` minutos, **o cambia el día**. *Sin el tercer corte, dos
 * mensajes a las 23:58 y a las 00:01 quedarían en el mismo grupo con un
 * separador de día en el medio.*
 */

/** El mensaje como lo entrega el contrato de D. Sólo lo que se necesita acá. */
export interface MensajeParaHilo {
  mensajeId: string;
  autorUserId: string;
  cuerpo: string;
  automatica: boolean;
  creadoEn: string;
}

/** Un hecho del trámite: va centrado, como etiqueta, y puede pedir una acción. */
export interface EventoParaHilo {
  eventoId: string;
  etiqueta: string;
  creadoEn: string;
  /** `true` = lleva la carta con su botón debajo (firmar el acta). */
  pideAccion?: boolean;
}

export type PosicionEnGrupo = 'solo' | 'primero' | 'medio' | 'ultimo';

export type FilaDelHilo =
  | { tipo: 'dia'; clave: string; fechaIso: string }
  | { tipo: 'evento'; clave: string; evento: EventoParaHilo }
  | {
      tipo: 'mensaje';
      clave: string;
      mensaje: MensajeParaHilo;
      /** Lo calcula acá; la pieza sólo lo dibuja. */
      posicion: PosicionEnGrupo;
      /** `true` sólo en el primero del grupo: es donde va el nombre. */
      abreGrupo: boolean;
    };

/** Minutos dentro de los cuales dos mensajes del mismo autor van juntos. */
const VENTANA_MIN = 5;

function diaDe(iso: string): string {
  const d = new Date(iso);
  /* Se compara por AÑO-MES-DÍA **local**, no por el ISO: dos mensajes del
     mismo día local pueden caer en fechas UTC distintas, y ahí el separador
     partiría una conversación por la mitad sin ninguna razón visible. */
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * Arma el hilo listo para la lista invertida.
 *
 * `mensajes` y `eventos` pueden venir en cualquier orden: acá se ordenan.
 */
export function armarHilo(
  mensajes: readonly MensajeParaHilo[],
  eventos: readonly EventoParaHilo[] = [],
): FilaDelHilo[] {
  type Cruda =
    | { k: 'm'; ts: number; m: MensajeParaHilo }
    | { k: 'e'; ts: number; e: EventoParaHilo };

  const crudas: Cruda[] = [
    ...mensajes.map((m) => ({ k: 'm' as const, ts: Date.parse(m.creadoEn), m })),
    ...eventos.map((e) => ({ k: 'e' as const, ts: Date.parse(e.creadoEn), e })),
  ]
    /* Ascendente PRIMERO —del más viejo al más nuevo— porque **la agrupación se
       razona hacia adelante**: «éste sigue al anterior». Se invierte al final,
       en un solo lugar. *Agrupar sobre la lista ya invertida es donde nacen los
       grupos dados vuelta.* */
    .sort((a, b) => a.ts - b.ts || 0);

  const filas: FilaDelHilo[] = [];
  let diaAnterior: string | null = null;

  for (let i = 0; i < crudas.length; i += 1) {
    const c = crudas[i];
    const iso = c.k === 'm' ? c.m.creadoEn : c.e.creadoEn;
    const dia = diaDe(iso);
    if (dia !== diaAnterior) {
      filas.push({ tipo: 'dia', clave: `dia:${dia}`, fechaIso: iso });
      diaAnterior = dia;
    }
    if (c.k === 'e') {
      filas.push({ tipo: 'evento', clave: `ev:${c.e.eventoId}`, evento: c.e });
      continue;
    }
    /* Vecinos SÓLO si el de al lado también es un mensaje: **un evento del
       trámite en el medio corta el grupo**, y tiene que cortarlo — dos burbujas
       pegadas con una etiqueta del sistema entre ellas se leerían como una sola
       intervención partida. */
    const previa = crudas[i - 1];
    const proxima = crudas[i + 1];
    const sigueALaAnterior =
      previa !== undefined &&
      previa.k === 'm' &&
      previa.m.autorUserId === c.m.autorUserId &&
      diaDe(previa.m.creadoEn) === dia &&
      c.ts - previa.ts <= VENTANA_MIN * 60_000;
    const sigueLaProxima =
      proxima !== undefined &&
      proxima.k === 'm' &&
      proxima.m.autorUserId === c.m.autorUserId &&
      diaDe(proxima.m.creadoEn) === dia &&
      proxima.ts - c.ts <= VENTANA_MIN * 60_000;

    const posicion: PosicionEnGrupo = sigueALaAnterior
      ? sigueLaProxima
        ? 'medio'
        : 'ultimo'
      : sigueLaProxima
        ? 'primero'
        : 'solo';

    filas.push({
      tipo: 'mensaje',
      clave: `ms:${c.m.mensajeId}`,
      mensaje: c.m,
      posicion,
      abreGrupo: !sigueALaAnterior,
    });
  }

  /* 🔴 EL ÚNICO `reverse`, y está acá para que sea el único. Con él, el
     separador de día —que se insertó ANTES de los mensajes de su día— queda
     DESPUÉS en el arreglo y por lo tanto ARRIBA en la lista invertida, que es
     donde va. */
  return filas.reverse();
}
