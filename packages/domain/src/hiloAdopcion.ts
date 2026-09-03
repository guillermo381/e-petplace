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

/* ═══════════════════════════════════════════════════════════════════════════
   EL ESTADO DE LA SOLICITUD → LA ETAPA DE LA ESCALERA (S112-C · C2)
   ═══════════════════════════════════════════════════════════════════════════

   🔴 **NO ES UN MAPA DE UNO A UNO, y por eso vive acá y no en cada pantalla.**
   `EscaleraSolicitud` recibe `etapa` **y** `final` porque son dos hechos a la
   vez: una declinada tiene la fila congelada **donde llegó** y además su
   etiqueta. Derivar eso son tres decisiones —qué etapa, si hay final, y cuál—
   y **las dos superficies tienen que tomarlas igual**: *si la familia y el
   refugio mostraran etapas distintas para la misma solicitud, una de las dos
   estaría mintiendo y no habría forma de saber cuál.*

   ⚠️ **Las dos últimas etapas NO salen del estado**, y lo dice el contrato de
   B: `acta_firmada` y `una_vida_nueva` viven en la firma y en el traspaso. Por
   eso entran como argumento y no se adivinan — *una derivación que las
   inventara acertaría hoy y fallaría el día que alguien firme sin que la
   solicitud cambie.* */

export type EtapaEscalera =
  | 'enviada'
  | 'en_conversacion'
  | 'aceptada'
  | 'acta_firmada'
  | 'una_vida_nueva';

export type FinalEscalera = 'declinada' | 'desistida' | 'no_concretada';

export interface LecturaDeEscalera {
  /** `null` = **no se dibuja nada**: el animal está en memorial. */
  etapa: EtapaEscalera | null;
  final: FinalEscalera | null;
}

export function leerEscalera(
  estado: string,
  hechos: {
    /** ¿Hubo conversación? **Sale de que existan mensajes, no de una suposición.** */
    huboMensajes: boolean;
    /** De la firma, no del estado de la solicitud. */
    actaFirmada?: boolean;
    /** Del traspaso. */
    traspasada?: boolean;
  },
): LecturaDeEscalera {
  /* 🔴 **MEMORIAL: NADA.** Ni fila ni línea — decisión tomada, y su razón es
     que *no se le dice dos veces la misma noticia a alguien que acaba de perder
     al animal que eligió.* Va PRIMERO: cualquier otra rama antes que ésta
     dibujaría algo. */
  if (estado === 'no_concretada_fallecimiento') return { etapa: null, final: null };

  /* La etapa alcanzada. **Se deriva de HECHOS y en orden descendente**: lo más
     avanzado gana. *Preguntarlo al revés haría que un traspaso quedara marcado
     como «enviada» porque la primera condición también era cierta.* */
  const etapa: EtapaEscalera =
    hechos.traspasada === true
      ? 'una_vida_nueva'
      : hechos.actaFirmada === true
        ? 'acta_firmada'
        : estado === 'aceptada'
          ? 'aceptada'
          : /* Para los terminales, la fila queda **donde llegó**: si hubo
               mensajes, la conversación ocurrió. *Es un hecho medible —existen
               mensajes— y no una suposición sobre qué tan lejos llegó.* */
            hechos.huboMensajes || estado === 'en_conversacion'
            ? 'en_conversacion'
            : 'enviada';

  const final: FinalEscalera | null =
    estado === 'declinada'
      ? 'declinada'
      : estado === 'desistida'
        ? 'desistida'
        : estado === 'no_concretada_otra_familia'
          ? 'no_concretada'
          : null;

  return { etapa, final };
}

/**
 * FUSIONA POR ID — para que un refresco NO reemplace el arreglo (S112-C · A14).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **EL PROBLEMA NO ES QUE LA LISTA CAMBIE: ES QUE CAMBIA SIN CAMBIAR.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Cada recarga del hilo devuelve **objetos nuevos** aunque el contenido sea
 * idéntico. Para React eso es una lista distinta: **todas las filas se
 * re-dibujan**, aunque ninguna cambió. Con el sondeo eso pasaba cada 5 s —el
 * parpadeo que el founder ve— y **sigue pasando en cada llegada** aunque el
 * sondeo haya muerto.
 *
 * ⇒ Esto devuelve **el objeto ANTERIOR cuando el mensaje no cambió**, así que
 * las filas que ya estaban conservan su identidad y React las deja quietas.
 *
 * ⚠️ **Compara CONTENIDO, no sólo id.** Un mensaje puede editarse —hoy no, pero
 * el tipo lo admite— y devolver el viejo por tener el mismo id **mostraría el
 * texto anterior para siempre**, sin error y sin síntoma. *Reusar por id a
 * secas es más rápido y puede mentir; reusar por id Y contenido no puede.*
 *
 * ⚠️ **Y devuelve el arreglo ANTERIOR entero si nada cambió**: sin eso, un
 * arreglo nuevo con los mismos objetos adentro igual rompe la memoización de
 * quien lo recibe. *La identidad tiene que sobrevivir en los dos niveles.*
 */
export function fusionarPorId<T extends { mensajeId: string; cuerpo: string }>(
  previos: readonly T[],
  nuevos: readonly T[],
): readonly T[] {
  const antes = new Map(previos.map((m) => [m.mensajeId, m]));
  let huboCambio = previos.length !== nuevos.length;
  const salida = nuevos.map((n, i) => {
    const v = antes.get(n.mensajeId);
    if (v !== undefined && v.cuerpo === n.cuerpo) {
      /* El orden también cuenta: si el mismo mensaje cambió de posición, el
         arreglo SÍ cambió aunque sus objetos se reusen. */
      if (previos[i] !== v) huboCambio = true;
      return v;
    }
    huboCambio = true;
    return n;
  });
  return huboCambio ? salida : previos;
}
