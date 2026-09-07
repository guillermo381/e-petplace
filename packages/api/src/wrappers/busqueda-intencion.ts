/**
 * LA CAJA QUE ENCUENTRA — con su segundo pase y su salida honesta.
 * S113-D · fase 3 «Encontrar, traer, llevar».
 *
 * ── LO QUE ESTA PUERTA COMPONE, Y POR QUÉ ES UNA PUERTA NUEVA Y NO UN CAMBIO
 * `buscarEnMiFamilia` (A, lote 2) hace el trabajo y **no se toca**: encuentra,
 * filtra por familia y ordena. Lo que faltaba no era buscar mejor — era qué
 * hacer **cuando no encuentra**, que es donde vive la experiencia entera.
 *
 * ── EL ORDEN, Y CADA ESCALÓN SE GANÓ MIDIENDO ──────────────────────────────
 *   ① FTS tal cual la persona escribió.        gratis · instantáneo
 *   ② FTS con las palabras ESTRUCTURALES podadas, sólo si ① dio cero. gratis
 *   ③ ni ② encontró ⇒ **se dice, y se ofrece preguntarle a Nexo.**
 *
 * 🔴 **NO HAY LLAMADA A UN MODELO EN NINGÚN ESCALÓN, y es un resultado, no una
 * omisión.** El brief pedía que «la IA entre a entender la intención cuando el
 * texto no alcanza». Se midió antes de construirla, contra la familia del
 * founder, con 23 búsquedas y 20 preguntas de cuidado:
 *
 *   · con ① solo:      18/23 búsquedas encuentran · 0/20 preguntas encuentran
 *   · con ① y ②:     **23/23** búsquedas encuentran · **0/20** preguntas
 *
 * La separación es perfecta y el escalón ② es una lista de 15 palabras. *Lo que
 * quedaba para el modelo, después de medir, era cero.* Y lo que sí sobrevive a
 * los dos pases —las preguntas— ya tiene a quién ir: el router de `coach`
 * clasifica `busqueda | dato | narrativa | fuera` y contesta. **Un modelo más
 * acá habría sido un modelo para decidir a qué modelo mandarlo.**
 *
 * ⚠️ **Lo que esta medición NO dice.** Las 43 frases las escribió quien escribió
 * la poda, sobre UNA familia: una separación perfecta sobre un conjunto propio
 * es evidencia débil, y E la vuelve a medir con frases suyas. Y **el tipeo no
 * está cubierto**: «thorr» y «muneca» dan cero en los dos pases y salen por el
 * escalón ③ — honesto, pero no es encontrar. Eso pide coincidencia difusa y es
 * trabajo aparte, con su propio número.
 *
 * ── LA LEY QUE OBLIGA A `podado` ───────────────────────────────────────────
 * Lo descartado por no casar **se registra**: sin eso, la próxima medición no
 * distingue un modelo que falla de un casamiento que se comió la respuesta. Acá
 * el «casamiento» es la poda, y `podado` dice exactamente qué se le sacó a la
 * frase de la persona antes de volver a buscar.
 */
import { podarConsulta } from '@epetplace/domain';
import { getClient } from '../client';
import { buscarEnMiFamilia, type ResultadoBusqueda, type CodigoErrorCoach } from './coach';
import type { ResultadoWrapper } from '../resultado';

/** Las clases de cosa que la edge sabe nombrar. `papel` está desde ya aunque la
 *  bóveda todavía no se busque: el día que exista, ya tiene nombre acá. */
export type TipoBuscado =
  | 'cita' | 'pedido' | 'mascota' | 'papel' | 'producto' | 'prestador' | 'cualquiera';

export type IntencionDeBusqueda = {
  tipo: TipoBuscado;
  /** `null` cuando la frase no menciona tiempo. */
  desde: string | null;
  hasta: string | null;
  /** Lo que identifica la cosa, sin las palabras de tipo ni de tiempo. */
  termino: string;
  fuente: 'modelo' | 'modelo_caido' | 'excepcion';
};

/** Por qué pase salió el resultado. **Se devuelve para poder medir después**:
 *  si mañana el escalón ② deja de rescatar, se ve en este campo antes de que
 *  alguien lo reporte como «la búsqueda ya no anda». */
export type PaseDeBusqueda = 'directo' | 'podado' | 'con_intencion' | 'sin_resultados';

export type BusquedaConIntencion = {
  /** Lo que la persona escribió, tal cual. Jamás se pisa. */
  consulta: string;
  resultados: ResultadoBusqueda[];
  pase: PaseDeBusqueda;
  /** Sólo con `pase === 'podado'`: con qué se volvió a buscar y qué se sacó.
   *  `null` en los otros dos casos — la ausencia no se disfraza de lista vacía. */
  podado: { consulta: string; quitadas: string[] } | null;
  /** 🔴 `true` cuando no hay NADA que mostrar. **La pantalla lo dice y ofrece
   *  preguntarle a Nexo; no inventa un resultado ni un «quizás quisiste decir».**
   *  *Una búsqueda que rellena el vacío con algo parecido enseña a desconfiar
   *  de todos los resultados, no sólo del inventado.* */
  ofrecer_nexo: boolean;
  /** Lo que el modelo entendió, cuando llegó a llamarse. `null` si los dos
   *  pases gratis alcanzaron — que es la mayoría, y por eso está primero. */
  intencion: IntencionDeBusqueda | null;
  /**
   * 🔴 EL PREFACIO DE LA RESPUESTA VACÍA, en UN solo lugar.
   *
   * Cuando no hay resultados, la respuesta **no es un vacío**: es «no encontré
   * "pipeta" en lo tuyo, pero puedo contarte…» y a continuación lo que conteste
   * Nexo. *Un «sin resultados» pelado le dice a la familia que su dato no
   * existe, cuando lo que pasó es que no está indexado todavía.*
   *
   * La primera mitad es determinista y vive acá para que **no la invente cada
   * pantalla**; la segunda la trae `preguntarANexo`. `null` cuando hay
   * resultados o cuando la consulta es demasiado corta para haber buscado.
   */
  prefacio_nexo: string | null;
};

/** Llama a la edge que separa la frase. **Nunca lanza**: si algo sale mal
 *  devuelve `null` y la búsqueda sigue su camino sin intención — que es
 *  exactamente el estado de antes, no un error nuevo en la cara de nadie. */
async function leerIntencion(texto: string): Promise<IntencionDeBusqueda | null> {
  const { data, error } = await getClient().functions.invoke('buscar-intencion', { body: { texto } });
  if (error || data === null || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const TIPOS: readonly string[] = ['cita', 'pedido', 'mascota', 'papel', 'producto', 'prestador', 'cualquiera'];
  return {
    // Espejo de la lista blanca de la edge: la edge ya saneó, y esto evita que
    // un valor nuevo del servidor entre a un `switch` que se cree exhaustivo.
    tipo: (typeof d.tipo === 'string' && TIPOS.includes(d.tipo) ? d.tipo : 'cualquiera') as TipoBuscado,
    desde: typeof d.desde === 'string' ? d.desde : null,
    hasta: typeof d.hasta === 'string' ? d.hasta : null,
    termino: typeof d.termino === 'string' ? d.termino : '',
    fuente: (d.fuente === 'modelo' || d.fuente === 'modelo_caido' ? d.fuente : 'excepcion'),
  };
}

/** Filtra por tipo y por ventana **sobre lo que ya vino**.
 *
 * ⚠️ **Su límite, declarado y no escondido:** filtra sobre las N filas que el
 * motor devolvió, así que si lo que se busca cae fuera del techo, no aparece.
 * Por eso, cuando hay filtro, se piden MÁS filas antes de recortar. La cura de
 * verdad es que el filtro viaje al SQL — eso es de A, y hasta entonces esto es
 * lo que se puede hacer sin tocar su función. */
function filtrar(rs: ResultadoBusqueda[], i: IntencionDeBusqueda): ResultadoBusqueda[] {
  return rs.filter((r) => {
    if (i.tipo !== 'cualquiera' && r.tipo !== i.tipo) return false;
    if (i.desde === null && i.hasta === null) return true;
    // Sin fecha no se puede filtrar por fecha: se CONSERVA. *Descartar por un
    // dato que falta esconde cosas que sí podrían ser lo que se busca.*
    if (r.fecha === null) return true;
    const f = r.fecha.slice(0, 10);
    return (i.desde === null || f >= i.desde) && (i.hasta === null || f <= i.hasta);
  });
}

/**
 * Busca, y si no encuentra, vuelve a intentar sin las palabras que nombran el
 * tipo de cosa. Si tampoco, lo dice.
 *
 * Con menos de dos caracteres el motor devuelve vacío sin error (no se rebota a
 * quien todavía está escribiendo) — y acá eso sale como `sin_resultados` con
 * `ofrecer_nexo` en `false`: **no se le ofrece Nexo a alguien que escribió una
 * letra**, que sería ruido, no ayuda.
 */
export async function buscarConIntencion(
  consulta: string,
  limite?: number,
): Promise<ResultadoWrapper<BusquedaConIntencion, CodigoErrorCoach>> {
  const cruda = consulta.trim();

  const uno = await buscarEnMiFamilia(cruda, limite);
  if (!uno.ok) return uno;
  if (uno.data.resultados.length > 0) {
    return { ok: true, data: { consulta: cruda, resultados: uno.data.resultados, pase: 'directo', podado: null, ofrecer_nexo: false, intencion: null, prefacio_nexo: null } };
  }

  const poda = podarConsulta(cruda);
  if (poda.vale_reintentar) {
    const dos = await buscarEnMiFamilia(poda.consulta, limite);
    /* 🔴 Si el SEGUNDO viaje falla, no se propaga el error: el primero ya
       respondió bien y su respuesta —«no hay nada»— sigue siendo cierta.
       *Convertir «no encontré» en «se rompió» por un reintento opcional le
       cambia el mensaje a la familia por un problema nuestro.* */
    if (dos.ok && dos.data.resultados.length > 0) {
      return {
        ok: true,
        data: {
          consulta: cruda, resultados: dos.data.resultados, pase: 'podado',
          podado: { consulta: poda.consulta, quitadas: poda.quitadas },
          ofrecer_nexo: false, intencion: null, prefacio_nexo: null,
        },
      };
    }
  }

  /* ── ③ RECIÉN ACÁ EL MODELO ────────────────────────────────────────────
     Dos pases gratis no encontraron nada. Sólo ahora se paga —$0,0006 medido—
     y sólo para separar la frase: tipo, ventana y término limpio. */
  const podadoInfo = poda.vale_reintentar ? { consulta: poda.consulta, quitadas: poda.quitadas } : null;
  const vacio = (i: IntencionDeBusqueda | null): ResultadoWrapper<BusquedaConIntencion, CodigoErrorCoach> => ({
    ok: true,
    data: {
      consulta: cruda, resultados: [], pase: 'sin_resultados', podado: podadoInfo,
      // Con menos de dos caracteres el motor ni buscó: ofrecer Nexo ahí es ruido.
      ofrecer_nexo: cruda.length >= 2,
      intencion: i,
      prefacio_nexo: cruda.length >= 2 ? `No encontré "${cruda}" en lo tuyo, pero` : null,
    },
  });

  if (cruda.length < 2) return vacio(null);

  const intencion = await leerIntencion(cruda);
  if (intencion === null || intencion.termino === '') {
    /* Sin término nuevo no hay nada que volver a buscar con texto. Pero si el
       modelo entendió un TIPO o una VENTANA, eso todavía sirve: es una lista,
       no una búsqueda — y hoy no hay puerta que la traiga sin término.
       *Se declara en vez de simularla*: pedirle a `buscar_en_mi_familia` una
       cadena vacía devuelve vacío por diseño. Cuando A acepte `tipo`/`desde`/
       `hasta`, este brazo se completa sin tocar nada más. */
    return vacio(intencion);
  }

  const tres = await buscarEnMiFamilia(intencion.termino, (limite ?? 20) * 3);
  if (!tres.ok || tres.data.resultados.length === 0) return vacio(intencion);

  const filtradas = filtrar(tres.data.resultados, intencion).slice(0, limite ?? 20);
  if (filtradas.length === 0) return vacio(intencion);

  return {
    ok: true,
    data: {
      consulta: cruda, resultados: filtradas, pase: 'con_intencion', podado: podadoInfo,
      ofrecer_nexo: false, intencion, prefacio_nexo: null,
    },
  };
}
