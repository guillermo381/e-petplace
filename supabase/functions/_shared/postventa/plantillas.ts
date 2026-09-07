// _shared/postventa/plantillas.ts — LOS TEXTOS DE LA CASA (S114-D, lote 3).
//
// ── LA LEY (§11, fila «redacción») ──────────────────────────────────────────
//   «borradores de los mensajes de la casa, en tuteo, desde plantillas con
//    variables · un humano lee y manda. **Las etiquetas del trámite son
//    plantillas fijas**.»
//
// ── LA DIVISIÓN, QUE ES LO ÚNICO IMPORTANTE DE ESTE ARCHIVO ─────────────────
// Hay DOS cosas acá y **no comparten ni una línea de código**:
//
//   ① `etiqueta()` — EL TRÁMITE. Texto FIJO con variables interpoladas. Puro,
//      determinístico, **sin una sola llamada a un modelo**. Es lo que la app
//      muestra cuando dice en qué anda el caso. *Un estado de trámite que se
//      redacta distinto cada vez deja de ser un estado: la familia no puede
//      saber si algo cambió o si sólo cambió la frase.*
//
//   ② `andamio()` — EL BORRADOR. Lo que se le da al modelo para que redacte un
//      mensaje que **un humano lee y manda**. Acá el modelo sí escribe.
//
// 🔴 Y LA RAZÓN POR LA QUE ESTÁN EN EL MISMO ARCHIVO, que parece lo contrario
// de separarlas: para que la diferencia se lea de una. Repartidas en dos
// archivos, el día que alguien necesite «que la etiqueta suene más humana» va a
// encontrar sólo una de las dos y no va a tener enfrente la razón por la que no
// se toca. *Lo que hay que poder ver junto es justamente lo que no se mezcla.*

import { aTuteo } from '../voz/tuteo.ts'

// ═══════════════════════════════════════════════════════════════════════════
// ① EL TRÁMITE — FIJO. Ningún modelo toca esto.
// ═══════════════════════════════════════════════════════════════════════════

/** Los estados de §5, más los tres finales. */
export const ESTADOS_CASO = [
  'recibido', 'con_prestador', 'con_casa', 'resuelto', 'cerrado',
  'resuelto_entre_partes', 'retirado', 'sin_lugar',
] as const
export type EstadoCaso = typeof ESTADOS_CASO[number]

export interface VariablesEtiqueta {
  /** Nombre de la mascota, cuando el caso tiene una. */
  mascota?: string
  /** Nombre del negocio. */
  prestador?: string
}

/**
 * 🔴 EL TEXTO NO NOMBRA PLAZOS QUE LA FAMILIA NO DEBE VER.
 * §2 es explícita: *«La familia no ve el reloj de 48 h… un countdown sobre el
 * incumplimiento ajeno convierte la espera en espectáculo.»* Por eso
 * `con_prestador` dice que le pedimos una respuesta y **no dice "24 h"**,
 * aunque ese plazo exista y lo cuente el motor. El plazo es del motor; la
 * espera es de la familia.
 *
 * Y `en_camino_manual` **no promete fecha** — §6 lo firma con esas palabras.
 */
const TRAMITE: Record<EstadoCaso, string> = {
  recibido: 'Recibimos lo que nos contaste. Lo estamos mirando.',
  con_prestador: 'Le pedimos una respuesta a {{prestador}}. Te avisamos apenas la tengamos.',
  con_casa: 'Lo está viendo el equipo de e-PetPlace.',
  resuelto: 'Este caso quedó resuelto.',
  cerrado: 'Este caso está cerrado.',
  resuelto_entre_partes: 'Lo resolviste con {{prestador}}.',
  retirado: 'Retiraste este caso.',
  sin_lugar: 'Revisamos lo que pasó y no encontramos algo que corresponda resolver por acá. Si querés, contanos más y lo miramos de nuevo.',
}

/** Los estados de la plata, que también son trámite y también son fijos. */
export const ESTADOS_PLATA = ['en_camino_original', 'en_camino_manual', 'saldo_acreditado'] as const
export type EstadoPlata = typeof ESTADOS_PLATA[number]

const TRAMITE_PLATA: Record<EstadoPlata, string> = {
  en_camino_original: 'La devolución va en camino al medio con el que pagaste.',
  // ⚠️ SIN FECHA, por firma de §6: «la superficie no promete fecha».
  en_camino_manual: 'Estamos haciendo la devolución a mano. Te avisamos en cuanto salga.',
  saldo_acreditado: 'Ya tenés el saldo acreditado en tu cuenta de e-PetPlace.',
}

/** Interpola `{{var}}`. Si falta una variable, la frase se reescribe sin ella
 *  — jamás sale un `{{prestador}}` crudo a pantalla, que es el modo de falla
 *  que esta casa ya midió con las llaves de i18n. */
function interpolar(plantilla: string, v: VariablesEtiqueta): string {
  return plantilla
    .replace(/\{\{prestador\}\}/g, v.prestador?.trim() || 'el prestador')
    .replace(/\{\{mascota\}\}/g, v.mascota?.trim() || 'tu mascota')
}

/** LA ETIQUETA DEL TRÁMITE. Pura. Sin modelo. Mismo estado ⇒ mismo texto. */
export function etiqueta(estado: EstadoCaso, v: VariablesEtiqueta = {}): string {
  return interpolar(TRAMITE[estado], v)
}

/** Ídem para los tres estados de la plata. */
export function etiquetaPlata(estado: EstadoPlata, v: VariablesEtiqueta = {}): string {
  return interpolar(TRAMITE_PLATA[estado], v)
}

// ═══════════════════════════════════════════════════════════════════════════
// ② EL BORRADOR — acá sí redacta el modelo, y un humano lee y manda.
// ═══════════════════════════════════════════════════════════════════════════

export const BORRADORES = [
  'pedir_evidencia', 'avisar_resolucion', 'pedir_respuesta_prestador', 'explicar_sin_lugar',
] as const
export type Borrador = typeof BORRADORES[number]

export interface VariablesBorrador extends VariablesEtiqueta {
  /** El resumen de una línea del caso — el del intake o el de la hoja. */
  resumen?: string
  /** Qué se resolvió o qué se pide, en palabras de la casa. */
  detalle?: string
}

/**
 * El andamio que se le pasa al modelo. **Es una instrucción, no un texto para
 * mandar**: el modelo escribe el borrador y una persona decide si sale.
 *
 * ⚠️ Los andamios NO dictan la frase final. Un andamio que ya trae el texto
 * hecho no es un borrador: es una etiqueta con un modelo al lado gastando
 * plata. *Si la frase se puede escribir de antemano, pertenece a `TRAMITE`.*
 */
const ANDAMIOS: Record<Borrador, string> = {
  pedir_evidencia:
    'Escribí un mensaje corto pidiéndole a la familia lo que falta para poder avanzar. Decí para qué lo necesitás. No la hagas sentir que tiene que probar nada.',
  avisar_resolucion:
    'Escribí un mensaje corto contándole a la familia cómo quedó el caso. Primero qué se resolvió, después qué va a pasar ahora. Sin justificar de más.',
  pedir_respuesta_prestador:
    'Escribí un mensaje corto al prestador contándole qué reportó la familia y pidiéndole su versión. Neutro: todavía no sabemos qué pasó.',
  explicar_sin_lugar:
    'Escribí un mensaje corto explicándole a la familia por qué esto no es algo que podamos resolver por acá, y qué sí puede hacer. Con respeto, sin sonar a formulario.',
}

/** Arma el pedido para el modelo. La voz de la casa vive acá, una sola vez. */
export function andamio(cual: Borrador, v: VariablesBorrador = {}): string {
  const datos = [
    v.mascota ? `Mascota: ${v.mascota}` : null,
    v.prestador ? `Prestador: ${v.prestador}` : null,
    v.resumen ? `Qué pasó: ${v.resumen}` : null,
    v.detalle ? `Detalle: ${v.detalle}` : null,
  ].filter(Boolean).join('\n')

  return `${ANDAMIOS[cual]}

Escribí en tuteo neutro ("tu mascota", "te cobraron"), nunca voseo. Sin saludos de formulario ("Estimado"), sin despedidas largas. Dos o tres frases.
Devolvé sólo el texto del mensaje, sin comillas y sin explicar lo que escribiste.

${datos || '(sin datos del caso)'}`
}

/**
 * La última milla del borrador: el cinturón único de la casa.
 *
 * 🔴 Se aplica ACÁ y no en cada edge por la razón que `_shared/voz/tuteo.ts`
 * deja escrita: vivía adentro de `coach/index.ts`, así que `coach-parte` —que
 * también le escribe a la familia— **no lo tenía**, y `dejá` llegó a una
 * familia con el cinturón puesto. *El remedio para «la misma regla en dos
 * lugares» no es copiarla en el segundo: es que haya un solo lugar.*
 */
export function limpiarBorrador(texto: string): string {
  return aTuteo(texto).trim()
}
