/**
 * «Paseo de Thor · martes 9» — **la app compone, el motor entrega los datos.**
 *
 * A entrega `servicio · mascotaNombre · objetoFecha · pedidoNumero` por
 * separado y **no la frase**, que es lo correcto: la voz del servicio y el
 * formato de fecha son i18n, y un motor que compusiera la frase la fijaría en
 * un idioma.
 *
 * ⚠️ **Cada pieza puede faltar, y la frase no se rompe: se acorta.** Un pedido
 * no tiene mascota; una estadía vieja puede no traer fecha. *Un separador
 * colgando —«Paseo de · »— es peor que una frase corta,* así que se arma con
 * las partes que existen y se une al final.
 */

import { fechaLargaHumana } from '@epetplace/i18n';
import type { CasoEnBandeja } from '@epetplace/api';

export function tituloDelObjeto(
  c: Pick<CasoEnBandeja, 'mascotaNombre' | 'objetoFecha' | 'pedidoNumero' | 'objetoTipo'>,
  idioma: 'es' | 'en',
  vozGenerica: string,
  vozDelServicio: string | null,
): string {
  const partes: string[] = [];

  /* El pedido se nombra por su número, no por un servicio: es lo que la
     familia y el vendedor usan para hablar de él. */
  if (c.objetoTipo === 'pedido' && c.pedidoNumero !== null) {
    partes.push(`#${c.pedidoNumero}`);
  } else {
    /* 🔴 `c.servicio` NO se lee acá: es el CÓDIGO del motor (`guarderia_dia`,
       `paseo`), y pintarlo crudo es lo que `voz-servicio.ts` prohíbe con todas
       las letras — *«el caller OMITE, jamás pinta el código crudo»*. Cuando
       ese diccionario no conoce el código, entra la voz genérica del objeto
       («Una estadía»), que dice MENOS pero no dice mal.

       Lo caminé y lo vi: la lista decía «guarderia_dia de Pepe». Es la
       TERCERA vez que esta clase se cobra en la casa (las dos notas de
       `telemedicina` y `guarderia_dia` viven en ese archivo), y la variante
       nueva es peor: no faltaba una clave — yo no pasaba por el mapa. */
    const voz = vozDelServicio ?? vozGenerica;
    partes.push(c.mascotaNombre !== null ? `${voz} de ${c.mascotaNombre}` : voz);
  }

  if (c.objetoFecha !== null) partes.push(fechaLargaHumana(c.objetoFecha, idioma));

  /* Sin ninguna parte, la voz genérica: **nunca una cadena vacía**, que
     dejaría la fila sin decir de qué es. */
  return partes.length > 0 ? partes.join(' · ') : vozGenerica;
}
