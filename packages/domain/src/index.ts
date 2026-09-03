// @epetplace/domain — helpers puros (sin dependencias de UI ni de Supabase).
// Los helpers heredables (periodo.ts, validaciones, paises/servicios)
// migran acá cuando el flujo que los usa se construya (ESTRATEGIA_2026H2.md Sección 10).

export {
  calcularVozHogar,
  DIAS_AVISO_VACUNA,
  VENTANA_RECENCIA_MESES,
  type SenalesMascota,
  type VozEstadoHogar,
} from './vozHogar';

export {
  calcularMomentoVital,
  edadEnMeses,
  type MomentoVital,
  type UmbralesMomentoVital,
} from './momentoVital';

export {
  calcularVitales,
  distanciaTrackKm,
  type PaseoVital,
  type PuntoTrack,
  type VitalesPaseos,
} from './vitalesPaseos';

export {
  DELTA_T_CORTE_S,
  distanciaM,
  filtrarTrack,
  filtrarTrackDetalle,
  filtrarTrackTramos,
  FRACCION_SEGMENTO_MENOR,
  VELOCIDAD_MAX_MS,
  type FiltroTrackDetalle,
  type PuntoTrackFiltrable,
} from './filtroTrack';

/* S112-A2 · la voz de la vidriera de adopción — hunk aditivo.
   El motor devuelve números; la redacción vive acá y el riel la traduce.
   *Una frase en español dentro de una RPC es una pantalla en un solo idioma.* */
export { describirEspera, describirEdad, type VozRedactada } from './vozAdopcion';

/* ☠️ S112-A · AQUÍ IBA `escaleraDeSolicitud`, y murió el día que nació.
   A y C construimos **la misma derivación al mismo tiempo**, cada uno midiendo
   que no existía —era cierto para los dos— y cada uno poniéndola en `domain`
   por la misma razón. *Dos pistas aplicando bien la misma ley producen el
   duplicado que la ley existe para evitar.*

   Ganó `leerEscalera` de C **por el criterio del objeto, no por cortesía: la
   suya tenía TRES consumidores montados y la mía cero.** Se midió antes de
   elegir; borrar la que ya sostenía tres pantallas habría sido preferir la
   propia. Las dos cubrían los siete estados y el memorial igual.

   S112-C · El hilo de adopción, armado: agrupado, separadores de día y
   eventos del trámite. Derivación PURA sobre el contrato de D, idéntica en las
   dos superficies — la familia y el refugio ven la misma conversación agrupada
   de la misma forma, y dos copias serían dos reglas que divergen. */
export {
  armarHilo,
  type FilaDelHilo,
  type MensajeParaHilo,
  type EventoParaHilo,
  type PosicionEnGrupo,
  /* C2 · el estado de la solicitud → la etapa de la escalera. Va acá porque
     las DOS superficies tienen que derivarlo igual: si la familia y el refugio
     mostraran etapas distintas para la misma solicitud, una estaría mintiendo
     y no habría forma de saber cuál. */
  leerEscalera,
  type EtapaEscalera,
  type FinalEscalera,
  type LecturaDeEscalera,
} from './hiloAdopcion';
export { diaDelNegocio, horaDelActo } from './diaDelNegocio';
