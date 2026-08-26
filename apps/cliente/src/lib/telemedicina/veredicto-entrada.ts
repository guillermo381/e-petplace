/**
 * EL VEREDICTO DE ENTRADA A LA VIDEOLLAMADA — la traducción del motivo a voz.
 * `LETRA_TELEMEDICINA` · Obra 1 de la tanda 2.
 *
 * ── POR QUÉ ES UNA FUNCIÓN PURA Y NO UN COMPONENTE ────────────────────────
 * Las **dos apps** hacen la misma pregunta y tienen que responderla igual de
 * bien; lo único que cambia es la voz. Separar la DECISIÓN (¿se dibuja el
 * botón? ¿se dice algo?) de su presentación hace que la decisión se pueda leer
 * de un vistazo y **ejercer sin montar nada**.
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
 * ── ⚠️ POR QUÉ ESTE ARCHIVO NO DEFINE SUS PROPIOS TIPOS ───────────────────
 * Consume **`ResultadoVideollamada` de `@epetplace/api`**, tal cual. La v1 de
 * este archivo tenía un tipo propio con `abreEn` OPCIONAL y una rama de
 * degradación para «fuera de ventana sin hora».
 *
 * **A lo hizo más estricto: en su wrapper `abreEn` es OBLIGATORIO** para ese
 * brazo —midió que la RPC lo devuelve incondicionalmente— y con eso *«fuera de
 * ventana sin decir cuándo abre» quedó inexpresable*. **Mi rama de degradación
 * dejó de tener un caso que la produjera**, así que se retira en vez de
 * quedarse: *un tipo local más flojo que el del wrapper mantiene vivo un
 * estado que el sistema ya volvió imposible, y el próximo lector no sabe cuál
 * de los dos manda.*
 *
 * ── LOS CÓDIGOS QUE NO SON DEL VEREDICTO ──────────────────────────────────
 * El wrapper emite además códigos de **transporte y sesión**
 * (`sin_sesion`, `veredicto_no_disponible`, `servidor_sin_configurar`…).
 * **Todos caen a UNA voz: «no pudimos verificar».** *Ninguno significa «no
 * puedes entrar» — significan «no pudimos preguntar», y confundirlos es
 * afirmar algo que no sabemos.* Su cara es distinta a propósito: los del
 * veredicto describen un HECHO de la cita; éstos describen un fallo NUESTRO.
 */

import type { ResultadoVideollamada } from '@epetplace/api';

/** Lo que la superficie tiene que dibujar. `claveVoz === null` ⇒ **no se pinta
 *  nada**: ni botón, ni mensaje, ni espacio reservado. */
export type QueDibujar =
  | { boton: true }
  | { boton: false; claveVoz: string | null; hora?: string };

/** Prefijo del namespace i18n de cada app — lo único que cambia entre las dos. */
const NS = 'veterinaria';

const CLAVE_POR_MOTIVO: Record<string, string | null> = {
  fuera_de_ventana: `${NS}.entrarFueraDeVentana`,
  cita_no_pagada: `${NS}.entrarNoPagada`,
  cita_cancelada: `${NS}.entrarCancelada`,
  cita_no_realizable: `${NS}.entrarNoRealizable`,
  cita_finalizada: `${NS}.entrarFinalizada`,
  cita_inexistente: `${NS}.entrarInexistente`,
  // Los dos silencios. `null` NO es un olvido: es la decisión.
  no_es_teleconsulta: null,
  ajeno_a_la_cita: null,
};

/** La voz única de «no pudimos preguntar». */
const VOZ_NO_SE_PUDO = `${NS}.entrarNoSePudoConsultar`;

/**
 * La hora local de apertura, en formato corto.
 *
 * El wrapper garantiza que `abreEn` viene en ese brazo, pero **puede venir
 * ilegible** (un ISO roto sigue siendo un string). En ese caso devuelve `null`
 * y el llamador cae a «no pudimos verificar»: *prometer una hora inventada es
 * peor que no dar hora — alguien se sienta a esperar un horario que no existe.*
 */
export function horaDeApertura(abreEn: string, idioma: string): string | null {
  const d = new Date(abreEn);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat(idioma === 'en' ? 'en-US' : 'es-EC', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function queDibujar(r: ResultadoVideollamada, idioma: string): QueDibujar {
  if (r.ok) return { boton: true };

  if (r.codigo === 'fuera_de_ventana') {
    const hora = horaDeApertura(r.abreEn, idioma);
    if (hora === null) return { boton: false, claveVoz: VOZ_NO_SE_PUDO };
    return { boton: false, claveVoz: CLAVE_POR_MOTIVO.fuera_de_ventana ?? null, hora };
  }

  /* Un código del veredicto tiene su voz —incluidos los dos silencios, que la
     tienen en `null`. Cualquier otro es transporte o sesión: no describe la
     cita, describe que no pudimos preguntar. */
  return Object.prototype.hasOwnProperty.call(CLAVE_POR_MOTIVO, r.codigo)
    ? { boton: false, claveVoz: CLAVE_POR_MOTIVO[r.codigo] }
    : { boton: false, claveVoz: VOZ_NO_SE_PUDO };
}
