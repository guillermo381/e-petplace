/**
 * El gate local del formulario de registro (S88-D, adjudicado).
 *
 * POR QUÉ EXISTE: hasta hoy `puedeEnviar` aceptaba una clave de 1
 * carácter y el server la rebotaba DESPUÉS — la puerta ofrecía lo que
 * el server iba a rechazar (Ley 23). El largo viene de
 * MIN_LARGO_CONTRASENA (seguridad.ts, la regla única firmada S88):
 * un número escrito acá volvería a mentir como mintió el «6».
 *
 * VIVE EN lib/ Y NO INLINE para que el par del guard discrimine contra
 * LA FUENTE (clave de 7 no envía · de 8 envía) — un par contra una
 * copia del predicado valida la copia, no la pantalla.
 */

import { MIN_LARGO_CONTRASENA } from '@epetplace/api';

export type CausaNoEnvia = 'campos_vacios' | 'password_corta';

/** null = puede enviar; si no, LA causa (una sola, la primera que
 *  aplica — los campos vacíos preceden: sin ellos no hay cuenta que
 *  crear y la clave corta todavía no es el problema del usuario). */
export function causaNoEnvia(i: {
  nombre: string;
  email: string;
  password: string;
}): CausaNoEnvia | null {
  if (i.nombre.trim().length === 0 || i.email.trim().length === 0 || i.password.length === 0) {
    return 'campos_vacios';
  }
  if (i.password.length < MIN_LARGO_CONTRASENA) return 'password_corta';
  return null;
}
