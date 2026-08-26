/**
 * EL VEREDICTO DE ENTRADA A LA VIDEOLLAMADA — la traducción del motivo a voz.
 * `LETRA_TELEMEDICINA` · Obra 1 de la tanda 2.
 *
 * ── POR QUÉ ES UNA FUNCIÓN PURA Y NO UN COMPONENTE ────────────────────────
 * Las **dos apps** hacen la misma pregunta y tienen que responderla igual de
 * bien; lo único que cambia es la voz. Separar la DECISIÓN (¿se dibuja el
 * botón? ¿se dice algo?) de su presentación hace que la decisión se pueda leer
 * de un vistazo y probar sin montar nada.
 *
 * ── 🔴 LA REGLA QUE LA GOBIERNA ───────────────────────────────────────────
 * **El botón EXISTE sólo cuando el servidor dice que sí.** Nunca se dibuja
 * apagado con un cartel al lado: *una puerta que promete y no cumple* es lo
 * que la Ley 23 prohíbe. Cuando no se puede entrar, se pinta **el motivo**.
 *
 * ── 🔴 LOS DOS MOTIVOS QUE NO PINTAN NADA, cada uno por su razón ──────────
 * · `no_es_teleconsulta` — **no es un error de nadie**: es una cita presencial
 *   y esta entrada no le corresponde. Decir algo sería ruido en el 90% de las
 *   citas.
 * · `ajeno_a_la_cita` — **jamás «no tienes permiso».** *Ese mensaje confirma
 *   que la cita existe*, que es justo lo que no se le dice a quien no es
 *   parte. Se comporta como si no hubiera nada.
 *   *(Criterio registrado por la mesa, 26-ago-2026.)*
 *
 * ── LA HORA DE `fuera_de_ventana` ─────────────────────────────────────────
 * Es **el caso que más veces va a pasar**, y por eso es el único que además
 * de decir qué pasa dice **cuándo se arregla**. La hora sale de `abre_en`,
 * que la manda el servidor — *un horario calculado en la app se desincroniza
 * con el motor y miente con toda confianza.*
 */

/** Los ocho del motor + el noveno que no es del motor: no haber podido
 *  preguntar. **Se distingue a propósito** — confundir «no pude consultar»
 *  con «no puedes entrar» es afirmar algo que no sabemos. */
export type MotivoEntrada =
  | 'fuera_de_ventana'
  | 'cita_no_pagada'
  | 'cita_cancelada'
  | 'cita_no_realizable'
  | 'cita_finalizada'
  | 'no_es_teleconsulta'
  | 'ajeno_a_la_cita'
  | 'cita_inexistente'
  | 'no_se_pudo_consultar';

export type VeredictoEntrada =
  | { puede: true }
  | { puede: false; motivo: MotivoEntrada; abreEn?: string | null };

/** Lo que la superficie tiene que dibujar. `voz === null` ⇒ **no se pinta
 *  nada**: ni botón, ni mensaje, ni espacio reservado. */
export type QueDibujar =
  | { boton: true }
  | { boton: false; claveVoz: string | null; hora?: string };

const CLAVE_POR_MOTIVO: Record<MotivoEntrada, string | null> = {
  fuera_de_ventana: 'consulta.entrarFueraDeVentana',
  cita_no_pagada: 'consulta.entrarNoPagada',
  cita_cancelada: 'consulta.entrarCancelada',
  cita_no_realizable: 'consulta.entrarNoRealizable',
  cita_finalizada: 'consulta.entrarFinalizada',
  cita_inexistente: 'consulta.entrarInexistente',
  no_se_pudo_consultar: 'consulta.entrarNoSePudoConsultar',
  // Los dos silencios. `null` NO es un olvido: es la decisión.
  no_es_teleconsulta: null,
  ajeno_a_la_cita: null,
};

/**
 * La hora local de apertura, en formato corto.
 *
 * 🔴 **Si `abre_en` no vino o no parsea, devuelve `null` y el llamador cae al
 * motivo genérico.** *Prometer una hora inventada es peor que no dar hora:
 * alguien se sienta a esperar un horario que no existe.*
 */
export function horaDeApertura(abreEn: string | null | undefined, idioma: string): string | null {
  if (typeof abreEn !== 'string' || abreEn.length === 0) return null;
  const d = new Date(abreEn);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(idioma === 'en' ? 'en-US' : 'es-EC', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function queDibujar(v: VeredictoEntrada, idioma: string): QueDibujar {
  if (v.puede) return { boton: true };

  const claveVoz = CLAVE_POR_MOTIVO[v.motivo];
  if (claveVoz === null) return { boton: false, claveVoz: null };

  if (v.motivo === 'fuera_de_ventana') {
    const hora = horaDeApertura(v.abreEn, idioma);
    /* Sin hora, `fuera_de_ventana` pierde lo único que lo hacía útil. Cae a
       «ya terminó»… no: cae al genérico de consulta fallida, porque **decir
       un estado equivocado es peor que decir que no pudimos verificar**. */
    if (hora === null) {
      return { boton: false, claveVoz: 'consulta.entrarNoSePudoConsultar' };
    }
    return { boton: false, claveVoz, hora };
  }

  return { boton: false, claveVoz };
}
