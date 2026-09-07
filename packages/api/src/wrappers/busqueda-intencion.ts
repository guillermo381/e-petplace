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
import { buscarEnMiFamilia, type ResultadoBusqueda, type CodigoErrorCoach } from './coach';
import type { ResultadoWrapper } from '../resultado';

/** Por qué pase salió el resultado. **Se devuelve para poder medir después**:
 *  si mañana el escalón ② deja de rescatar, se ve en este campo antes de que
 *  alguien lo reporte como «la búsqueda ya no anda». */
export type PaseDeBusqueda = 'directo' | 'podado' | 'sin_resultados';

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
};

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
    return { ok: true, data: { consulta: cruda, resultados: uno.data.resultados, pase: 'directo', podado: null, ofrecer_nexo: false } };
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
          ofrecer_nexo: false,
        },
      };
    }
  }

  return {
    ok: true,
    data: {
      consulta: cruda, resultados: [], pase: 'sin_resultados',
      podado: poda.vale_reintentar ? { consulta: poda.consulta, quitadas: poda.quitadas } : null,
      // Con menos de dos caracteres el motor ni buscó: ofrecer Nexo ahí es ruido.
      ofrecer_nexo: cruda.length >= 2,
    },
  };
}
