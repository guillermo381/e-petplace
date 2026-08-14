/**
 * LA COHERENCIA DE LOS CAMPOS DEL ALTA (S98-C · firma de la mesa, 14-ago:
 * *«Continuar valida los campos — COHERENCIA, no solo presencia: un nombre
 * de un carácter no es un nombre»*).
 *
 * ═══ POR QUÉ VIVE ACÁ Y NO EN CADA PANTALLA ════════════════════════════
 * Dos pasos del wizard validan un nombre de persona o de negocio. Escrita
 * dos veces, la regla se relaja en una sola —siempre la que alguien tocó
 * apurado— y a partir de ahí el wizard acepta por una puerta lo que
 * rechaza por la otra. *Una regla en dos lugares no son dos defensas: es
 * una defensa y una futura excepción.*
 *
 * ═══ DEVUELVE UN CÓDIGO, JAMÁS UN TEXTO ════════════════════════════════
 * La voz es de la pantalla (Ley 3): «escribí el nombre de tu negocio» y
 * «escribí el nombre de la persona» son la misma regla y dos frases
 * distintas. Devolver el texto desde acá obligaría a que las dos digan lo
 * mismo — o a pasarle el idioma a una función pura, que es peor.
 *
 * ═══ LO QUE NO VALIDA, DECLARADO ═══════════════════════════════════════
 * Nada de forma comercial, de país ni de formato de documento nacional.
 * **Proponer no es deducir (P21):** inventar acá que una cédula tiene diez
 * dígitos convertiría una regla de Ecuador en una ley de la app, y el
 * primer documento extranjero rebotaría sin que nadie hubiera decidido
 * que debía rebotar.
 */

/** Los rechazos posibles de un nombre. `null` = coherente. */
export type RechazoNombre = 'vacio' | 'corto' | 'sinLetras';

/**
 * ¿Esto es un nombre?
 *  · **dos caracteres mínimo** — uno solo no nombra a nadie.
 *  · **al menos una letra** — «--» y «123» pasan cualquier chequeo de
 *    largo y no son un nombre. Se mira LETRA EN UNICODE (`\p{L}`), no
 *    `[a-z]`: «Ñandú» y «Öko» son nombres válidos y un rango ASCII los
 *    rechazaría por sus acentos.
 */
export function rechazoDeNombre(valor: string): RechazoNombre | null {
  const v = valor.trim();
  if (v.length === 0) return 'vacio';
  if (v.length < 2) return 'corto';
  if (!/\p{L}/u.test(v)) return 'sinLetras';
  return null;
}

/** Los rechazos posibles de un documento de identidad. `null` = coherente. */
export type RechazoDocumento = 'vacio' | 'corto';

/**
 * ¿Esto puede ser un documento?
 *
 * **Cinco caracteres, contando sin espacios ni guiones** — y el número
 * tiene su porqué en vez de ser redondo: *ningún documento de identidad
 * del mundo tiene cuatro caracteres*, así que por debajo de cinco lo que
 * hay es un tipeo a medias, no un documento raro. Por arriba no se pone
 * techo: el largo cambia por país y poner uno sería justamente la
 * deducción que P21 prohíbe.
 */
export function rechazoDeDocumento(valor: string): RechazoDocumento | null {
  const v = valor.replace(/[\s-]/g, '').trim();
  if (v.length === 0) return 'vacio';
  if (v.length < 5) return 'corto';
  return null;
}
