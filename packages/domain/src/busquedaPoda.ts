// ============================================================================
// LA PODA DE LA BÚSQUEDA — el segundo pase, gratis (S113-D · fase 3)
//
// ── QUÉ PROBLEMA RESUELVE, Y SALIÓ DE MEDIR, NO DE SUPONER ──────────────────
// `buscar_en_mi_familia` usa `plainto_tsquery`, que une los términos con AND.
// Medido sobre la familia del founder (23 mascotas · 91 pedidos · 378 citas):
//
//   «croquetas»            → 5 resultados
//   «pedido de croquetas»  → 0            ← la MISMA búsqueda, en voz de persona
//   «Thor»                 → 20
//   «la cita de Thor»      → 0
//
// La causa no es «las frases largas fallan». Es más angosta y por eso se puede
// curar sin un modelo: **una palabra que nombra el TIPO de cosa rompe la
// búsqueda cuando esa palabra no está en el texto indexado de esa cosa**. Una
// fila de `pedidos` se indexa por el nombre del producto — la palabra «pedido»
// no aparece en ningún lado —, así que `pedido & croquet` no puede casar nunca.
//
// 🔴 **Y su contra-caso es el que define la lista.** «el paseo de Zeus» → 20
// resultados, funciona perfecto: «paseo» SÍ está en el texto indexado, porque
// es el nombre del servicio. *«Paseo» es contenido; «pedido» es estructura.*
// Por eso `paseo` NO está en la lista y quien lo agregue rompe una búsqueda que
// hoy anda — su rojo está en el gate.
//
// ── POR QUÉ ES UN SEGUNDO PASE Y NO UNA NORMALIZACIÓN ───────────────────────
// Podar SIEMPRE sería peor: hay familias cuya mascota se llama «Nota», y hay
// productos con «orden» en el nombre. El primer pase busca lo que la persona
// escribió, tal cual. La poda sólo corre **cuando ese pase no encontró nada**,
// que es cuando ya no hay nada que perder.
//
// ── LO QUE MIDE Y LO QUE NO ────────────────────────────────────────────────
// Sobre 43 frases (23 búsquedas + 20 preguntas de cuidado) contra datos reales:
//   · búsquedas que encuentran: **23/23** — 18 en el pase 1, **5 rescatadas acá**
//   · preguntas que encuentran algo: **0/20** — la poda NO convierte una
//     pregunta en un resultado falso, que era el riesgo real de este atajo.
// ⚠️ Las 43 frases las escribí yo, sobre UNA familia. Una separación perfecta
// sobre un conjunto que armó el mismo que armó la poda es evidencia débil: E lo
// vuelve a medir con frases suyas. Y **los errores de tipeo no se cubren**
// («thorr», «muneca» → 0 en los dos pases): eso es otra clase y necesita
// coincidencia difusa, que hoy no existe.
// ============================================================================

/**
 * Palabras que nombran el TIPO de cosa buscada y **no viven en el texto
 * indexado de esa cosa**. Sólo éstas: cada entrada de acá es una búsqueda que
 * hoy devuelve cero, y cada entrada de más es una búsqueda que hoy anda y se
 * rompería.
 */
export const PALABRAS_ESTRUCTURALES: readonly string[] = [
  // ── lo que había, medido en la fase 3 contra la familia del founder ──
  'pedido', 'pedidos', 'orden', 'ordenes', 'órdenes',
  'compra', 'compras', 'cita', 'citas', 'turno', 'turnos',
  'recuerdo', 'recuerdos', 'nota', 'notas',
  /* ── LO QUE FALTABA, Y LO MIDIÓ E ────────────────────────────────────────
     Mis 23 frases daban 18/23 con FTS solo; **las 30 de E dieron 5/30**, y
     18 de sus 40 traían una palabra de estructura que esta lista no tenía.
     *Mi conjunto no tenía poder de resolución: una lista escrita por el mismo
     que escribió la poda mide la facilidad de sus propios ejemplos.*
     Y no es que la lista estuviera mal: **es ANTERIOR a la bóveda**. Nueve de
     estas palabras son vocabulario que se inventó esta semana. */
  // la bóveda — cómo le dice la gente a sus papeles («libreta» es el carnet)
  'examen', 'examenes', 'exámenes', 'receta', 'recetas', 'informe', 'informes',
  'analisis', 'análisis', 'estudio', 'estudios', 'resultados', 'papel', 'papeles',
  'libreta', 'documento', 'documentos',
  // la agenda
  'reserva', 'reservas', 'visita', 'visitas', 'chequeo', 'chequeos',
  // los comprables
  'plan', 'planes', 'bono', 'bonos',
  // el comercio
  'factura', 'facturas', 'comprobante', 'comprobantes',
];

/* 🔴 LAS QUE E PROPUSO Y **NO** ENTRAN, con su razón medida. No las descarté
   yo: las descartó el brazo derivado del gate, preguntándole al catálogo vivo.
     · `control`  → es un PRODUCTO («ADULTO CONTROL PH FELINE»)
     · `paquete`  → es un SERVICIO
     · `consulta` → es un SERVICIO («Consulta General», «Consulta especializada»),
       y lo avisó E antes de que yo lo probara.
   *Las tres se sienten estructurales y las tres son contenido.* Ésta es la
   razón por la que el gate le pregunta al catálogo en vez de confiar en la
   intuición de quien escribe la lista — y por la que crece sola: el día que
   nazca un servicio llamado «Chequeo», el gate se pone rojo sin que nadie
   se acuerde de venir a mirar acá. */

/** Artículos, posesivos y preposiciones. `to_tsquery` en español ya los
 *  descarta —por eso «la de thor» encuentra igual—, pero se sacan para que
 *  `podado` sea LEGIBLE en el registro: quien lea el log tiene que poder ver
 *  qué quedó de la frase, no una sopa de conectores. */
const CONECTORES: readonly string[] = [
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
  'de', 'del', 'mi', 'mis', 'su', 'sus', 'que',
];

const sinTildes = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export type Poda = {
  /** Lo que queda para volver a buscar. `''` si no quedó nada con sentido. */
  consulta: string;
  /** 🔴 **Lo que se sacó, y por eso existe este campo** (ley de la fase 3,
   *  D-1037): *sin registrar lo descartado, la próxima medición no distingue
   *  un modelo que falla de un casamiento que se comió la respuesta.* Acá el
   *  «casamiento» es esta poda: si mañana una búsqueda legítima desaparece,
   *  este campo dice si fue porque le sacamos una palabra. */
  quitadas: string[];
  /** `false` cuando la poda no cambió nada: no tiene sentido repetir la misma
   *  consulta contra la misma base y pagar otro viaje. */
  vale_reintentar: boolean;
};

/**
 * Poda una consulta para el SEGUNDO pase. No decide si hay que reintentar por
 * su cuenta —eso lo sabe quien vio el resultado del primero—; sólo dice qué
 * quedaría y qué se sacó.
 */
export function podarConsulta(consulta: string): Poda {
  const palabras = consulta.trim().split(/\s+/).filter((p) => p !== '');
  const quitadas: string[] = [];
  const quedan: string[] = [];

  for (const p of palabras) {
    // Se compara sin tildes y sin puntuación pegada; se CONSERVA la original.
    const llave = sinTildes(p.toLowerCase()).replace(/[^\p{L}\p{N}]/gu, '');
    if (PALABRAS_ESTRUCTURALES.some((e) => sinTildes(e) === llave)) quitadas.push(p);
    else if (CONECTORES.includes(llave)) continue; // ni se quita ni se cuenta: ruido
    else quedan.push(p);
  }

  const podada = quedan.join(' ');
  return {
    consulta: podada,
    quitadas,
    /* Sólo vale reintentar si de verdad sacamos una estructural Y queda algo
       con qué buscar. *Reintentar con la frase entera es pagar dos veces por
       la misma respuesta.* */
    vale_reintentar: quitadas.length > 0 && podada !== '' && podada !== consulta.trim(),
  };
}
