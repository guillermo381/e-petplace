/**
 * LA URL LEGAL PÚBLICA — **una sola, y por eso una constante**
 * (S103-C · mesa 104, tanda 1).
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ 🔴 ES UN ÍNDICE, NO UN DOCUMENTO — y ésa es la decisión.             │
 * │                                                                      │
 * │ Declarado por la pista A con el dato de B: **`/legales` es la única  │
 * │ URL que la app necesita conocer.** *Si mañana nace un documento      │
 * │ nuevo —custodia (P20), aviso de IA—, la app no toca una línea.*      │
 * │                                                                      │
 * │ ⏪ Esta constante nació apuntando a `/terminos` y `/privacidad` por   │
 * │ separado, que era lo medido vivo cuando C censó. **A lo corrigió con │
 * │ la fuente de B: dos enlaces a documentos sueltos es la app teniendo  │
 * │ que saber el catálogo legal del sitio.**                             │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ── ⚠️ NO ESTÁ VIVA TODAVÍA, Y SE DECLARA ────────────────────────────────
 *
 * **`/legales` da 404 en el sitio en producción al 22-ago.** Las rutas de B
 * están verificadas **contra su build, no contra producción**: esperan el gate
 * de despliegue del founder.
 *
 * ⇒ **El enchufe se construye; NO se declara gateado.** *Un enlace verificado
 * contra un build que nadie desplegó es un 404 con el nombre de la casa
 * encima.* El juez de B en tanda 2 —«ninguna URL del enchufe de C devuelve
 * 404»— es exactamente el que cierra esto, y hoy daría rojo con razón.
 *
 * ── ⚠️ LO QUE ESTA URL **NO** SIRVE PARA ─────────────────────────────────
 *
 * **No es la URL de privacidad de la ficha de Play/App Store.** Advertencia de
 * B, con su literal: la privacidad publicada *«se excluye a sí misma de la
 * app»* («No cubre las aplicaciones móviles»). *Apuntar la ficha de tienda ahí
 * sería declarar ante Apple y Google una política que dice no cubrir la
 * aplicación — y eso se descubre en la review.* **La privacidad de la app no
 * existe todavía: es D-405, con abogado.**
 */

import type { IdiomaSoportado } from '@epetplace/i18n';

/**
 * El índice legal, en el idioma de la familia.
 *
 * El sitio sirve `es` en la raíz y `en` bajo `/en/` (`prefixDefaultLocale:
 * false`, medido por B en `astro.config.mjs`) — **la forma sale de su config,
 * no de una convención supuesta.**
 */
export function urlLegales(idioma: IdiomaSoportado): string {
  return idioma === 'en'
    ? 'https://www.epetplace.com/en/legales'
    : 'https://www.epetplace.com/legales';
}
