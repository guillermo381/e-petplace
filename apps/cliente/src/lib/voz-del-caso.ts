/**
 * «Paseo de Thor · martes 9» — **la app compone, el motor entrega los datos.**
 *
 * A entrega `servicio · mascotaNombre · objetoFecha · pedidoNumero` por
 * separado y **no la frase**, que es lo correcto: la voz del servicio y el
 * formato de fecha son i18n, y un motor que compusiera la frase la fijaría en
 * un idioma.
 *
 * ⚠️ **Existe una copia en `apps/prestador` y es DELIBERADO** (la excepción de
 * `METODO_TRES_PISTAS`: *se comparte la FORMA, jamás la VOZ*). Las dos apps
 * componen la misma forma y **no comparten módulo** porque no comparten
 * paquete; unificarlas exigiría un `packages/` nuevo para veinte líneas. *Si
 * alguna vez divergen, es porque su voz divergió, y eso es correcto.*
 *
 * ⚠️ **Cada pieza puede faltar, y la frase no se rompe: se acorta.** Un pedido
 * no tiene mascota; una estadía vieja puede no traer fecha. *Un separador
 * colgando —«Paseo de · »— es peor que una frase corta,* así que se arma con
 * las partes que existen y se une al final.
 */

import { fechaLargaHumana } from '@epetplace/i18n';
import type { CasoEnBandeja } from '@epetplace/api';

export function tituloDelObjeto(
  c: Pick<CasoEnBandeja, 'servicio' | 'mascotaNombre' | 'objetoFecha' | 'pedidoNumero' | 'objetoTipo'>,
  idioma: 'es' | 'en',
  vozGenerica: string,
): string {
  const partes: string[] = [];

  /* El pedido se nombra por su número, no por un servicio: es lo que la
     familia y el vendedor usan para hablar de él. */
  if (c.objetoTipo === 'pedido' && c.pedidoNumero !== null) {
    partes.push(`#${c.pedidoNumero}`);
  } else if (c.servicio !== null && c.mascotaNombre !== null) {
    partes.push(`${c.servicio} de ${c.mascotaNombre}`);
  } else if (c.servicio !== null) {
    partes.push(c.servicio);
  }

  if (c.objetoFecha !== null) partes.push(fechaLargaHumana(c.objetoFecha, idioma));

  /* Sin ninguna parte, la voz genérica: **nunca una cadena vacía**, que
     dejaría la fila sin decir de qué es. */
  return partes.length > 0 ? partes.join(' · ') : vozGenerica;
}
