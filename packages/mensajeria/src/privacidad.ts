/**
 * LA LEY DE PRIVACIDAD DEL HILO — `LETRA_ADOPCION` §5, firma ⑧.
 *
 * > *«**Datos del solicitante:** solo los ve el publicador del animal
 * > solicitado. Jamás otro uso — ni marketing, ni scoring. **Ningún dato de un
 * > menor alimenta nada** (P5).»*
 *
 * 🔴 «EL PUBLICADOR DEL ANIMAL SOLICITADO» ES MÁS ANGOSTO QUE «EL REFUGIO».
 * La frase firmada dice *del animal solicitado*, no *de la organización*. Un
 * gate por refugio ensancharía la audiencia por encima de la letra — la clase
 * de ensanche silencioso que esta casa ya midió. **Se gatea por la PUBLICACIÓN.**
 *
 * Y de `PORTAL_PRESTADOR` §6.4.7, que acá aplica por la misma razón: **ningún
 * dato de contacto viaja en el hilo, en ninguna dirección.** El canal existe
 * para que no haga falta.
 */

export type ActorDelHilo =
  | { readonly rol: 'publicador'; readonly publicoEsteAnimal: boolean }
  | { readonly rol: 'solicitante'; readonly esSuSolicitud: boolean }
  | { readonly rol: 'admin' }
  | { readonly rol: 'otro' };

export type CampoDeSolicitud =
  | 'mensajes'
  | 'datos_solicitante'
  | 'estado'
  /** Nunca visible para nadie por el hilo: existe para que el motor pueda
   *  nombrarlo y negarlo, en vez de que alguien lo agregue sin pensar. */
  | 'contacto_directo';

const NADA: readonly CampoDeSolicitud[] = [];
const TODO_DEL_HILO: readonly CampoDeSolicitud[] = [
  'mensajes',
  'datos_solicitante',
  'estado',
];

/**
 * Qué campos de la solicitud puede ver este actor.
 *
 * **Fail-closed:** el default es NADA; ver algo exige cumplir la condición
 * exacta de la letra. `contacto_directo` no se devuelve NUNCA — ni a admin.
 */
export function camposVisibles(actor: ActorDelHilo): readonly CampoDeSolicitud[] {
  switch (actor.rol) {
    case 'publicador':
      // La condición es «publicó ESTE animal», no «pertenece al refugio».
      return actor.publicoEsteAnimal ? TODO_DEL_HILO : NADA;
    case 'solicitante':
      return actor.esSuSolicitud ? TODO_DEL_HILO : NADA;
    case 'admin':
      // Con audit, y por su gate — pero tampoco el contacto directo.
      return TODO_DEL_HILO;
    case 'otro':
      return NADA;
  }
}

export function puedeVer(actor: ActorDelHilo, campo: CampoDeSolicitud): boolean {
  return camposVisibles(actor).includes(campo);
}
