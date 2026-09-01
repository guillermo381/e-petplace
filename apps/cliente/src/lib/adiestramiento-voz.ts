/**
 * CÓMO SE NOMBRA UNA OFERTA DE ADIESTRAMIENTO — **una sola vez, para las dos
 * superficies que la dicen.**
 *
 * 🔴 **Nace porque a partir de S109-C son DOS los lugares que la nombran**: la
 * lista de disponibles (que ahora agrupa por prestador y resume lo que ofrece)
 * y la Hoja de elección de la vitrina. *Dos pantallas que arman la misma frase
 * por su cuenta empiezan iguales y divergen en la primera enmienda que sólo una
 * recibe* — y acá la divergencia sería cara: la familia elegiría en la vitrina
 * algo que en la lista se llamaba distinto.
 *
 * ⚠️ **La voz vive acá, los TEXTOS viven en `i18n`.** Esta función compone; no
 * inventa ni traduce.
 */

import type { OfertaAdiestrador } from '@epetplace/api';

/** El `t` de la app, tipado por su uso — no se importa el tipo del riel. */
type Traducir = (clave: never, vars?: Record<string, string>) => string;

/**
 * «Sesión suelta» · «6 sesiones básicas» · «12 sesiones completas».
 *
 * 🔴 **El nivel NO se inventa cuando falta.** `nivel` es nullable en el motor;
 * ausente, la frase queda con el nombre del programa y su N. *Un «básico»
 * puesto por defecto sería atribuirle al adiestrador una clasificación que no
 * declaró.*
 */
export function vozOfertaAdiestramiento(
  o: Pick<OfertaAdiestrador, 'comprable' | 'nombre' | 'nivel' | 'n_sesiones'>,
  t: Traducir,
): string {
  const tr = t as unknown as (c: string, v?: Record<string, string>) => string;
  if (o.comprable === 'sesion') return tr('adiestramiento.sesionSuelta');

  const nivel =
    o.nivel === 'basico' ? tr('adiestramiento.nivelBasico')
    : o.nivel === 'medio' ? tr('adiestramiento.nivelMedio')
    : o.nivel === 'experto' ? tr('adiestramiento.nivelExperto')
    : o.nivel === 'especialidad' ? tr('adiestramiento.nivelEspecialidad')
    : null;

  /* El programa dice QUÉ es antes que su número (firma de S109): nombre, nivel
     y cuántas sesiones — el contenido preside. */
  return [
    o.nombre,
    nivel,
    o.n_sesiones !== null ? tr('adiestramiento.sesionesN', { n: String(o.n_sesiones) }) : null,
  ]
    .filter((x): x is string => typeof x === 'string' && x.length > 0)
    .join(' · ');
}
