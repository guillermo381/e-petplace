/**
 * LA LECTURA DE LA CAPACIDAD DE BARRA (S98-C · D-819).
 *
 * Separada de `barra-prestador` a propósito: allá vive el ORDEN, que es
 * puro y se puede ejercer sin levantar nada; acá viven las TRES lecturas,
 * que necesitan sesión y red. *Juntas, la parte verificable arrastraba
 * React Native y el ejercicio no corría.*
 *
 * Sus DOS consumidores son la barra (`(tabs)/_layout`) y el destape del
 * wizard — y por eso está acá y no adentro de uno de ellos: la barra ya
 * tenía esta lectura escrita inline, y el destape la habría copiado.
 */

import { empleadoTieneRol, obtenerMiPosicionEnPrestador } from '@epetplace/api';

import { hayCapacidad, resolverCapacidadAtender } from './capacidad-atender';
import type { CapacidadDeBarra } from './barra-prestador';

/**
 * LAS DOS PREGUNTAS, EN UNA SOLA OLA — y **la asimetría de sus fallos es
 * la parte pensada**, no un descuido:
 *
 *  · **el ROL cierra** — no saber si alguien puede es no poder afirmar que
 *    puede. Un permiso no se concede por un error de red (Ley 23).
 *  · **la CAPACIDAD abre** — no saber si el negocio tiene local no es un
 *    problema de permisos: es un dato que faltó, y la portada de ATENDER
 *    sabe decirlo y ofrecer reintento, mientras que una barra sin la tab
 *    no dice nada: *el que no la ve no sabe que existe.*
 *
 * ⚠️ `empleadoTieneRol` NO se cambia por `gestiona` de
 * `obtenerMiPosicionEnPrestador` aunque contesten parecido: son predicados
 * distintos (`gestiona` incluye admin de plataforma), y cambiarlo acá
 * movería el gate de NEGOCIO de contrabando.
 *
 * ⚠️ Las tres lecturas van JUNTAS: ninguna depende de otra, y encadenarlas
 * sumaría ~300 ms al arranque de cada foco (D-738 · L-223 — el peaje es la
 * PETICIÓN, y lo que se paga en reloj es la CADENA).
 */
export async function resolverCapacidadDeBarra(prestadorId: string): Promise<CapacidadDeBarra> {
  const [rol, posicion, capacidad] = await Promise.all([
    empleadoTieneRol(prestadorId, ['dueño', 'administrador']),
    obtenerMiPosicionEnPrestador(prestadorId),
    resolverCapacidadAtender(prestadorId),
  ]);
  return {
    esGestor: rol.ok ? rol.data : false,
    montaAtender:
      (posicion.ok ? posicion.data.esMostradorOGestion : false) &&
      (capacidad.ok ? hayCapacidad(capacidad.data) : true),
  };
}
