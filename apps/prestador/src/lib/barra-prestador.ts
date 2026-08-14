/**
 * LA COMPOSICIÓN DE LA BARRA — UNA SOLA FUENTE (S98-C · D-819).
 *
 * ═══ POR QUÉ EXISTE ESTE ARCHIVO ═══════════════════════════════════════
 * La barra se compone por CAPACIDAD (`LA_CASA_DEL_PRESTADOR` §2, cinco
 * casos) y **el destape del wizard enumeraba una lista escrita a mano**:
 * `Hoy · Datos · Negocio · Cuenta`, fija, para todo el mundo. Dos
 * consecuencias medidas: nunca nombraba `ATENDER` —la tab que nació en
 * esta misma sesión— y le prometía `Hoy` y `Negocio` a quien no los tiene.
 *
 * 🔴 **Y LA CURA NO ES SINCRONIZAR LAS DOS COPIAS.** Esa fue la tentación
 * y es la que deja la deuda viva: *dos copias no divergen algún día —
 * divergen la primera vez que alguien cura una sola.* Este archivo es la
 * fuente, y la barra y el destape son sus DOS consumidores.
 *
 * ═══ QUÉ VIVE ACÁ Y QUÉ NO ═════════════════════════════════════════════
 * Acá vive **el ORDEN**, y NADA MÁS. No viven los glifos ni la voz —la
 * barra pinta íconos y el destape etiquetas, y meterle un `Icono` la
 * ataría a una superficie— **ni la LECTURA**, que vive en
 * `barra-prestador-lectura`.
 *
 * 🔴 **Y esa separación no es prolijidad: es lo que vuelve auditable a la
 * fuente.** Este archivo **no importa nada**, así que la decisión se puede
 * ejercer contra una tabla de casos sin levantar app, sesión ni React
 * Native (`scripts/verify-s98c-barra-destape.ts`). Mientras el orden y la
 * lectura vivían juntos, el test arrastraba RN y no corría — *una fuente
 * única que nadie puede ejercer es una promesa, no una garantía.*
 */

/** Las cinco claves de ruta de la barra. Cerrado a propósito: la tab nueva
 *  tiene que entrar por acá y contestar dónde va. */
export type ClaveTabPrestador = 'index' | 'mascotas' | 'atender' | 'negocio' | 'cuenta';

/** Las dos preguntas que MODULAN la barra. Las otras tres tabs no dependen
 *  de nada, y por eso no son parámetros. */
export interface CapacidadDeBarra {
  /** Rol `dueño` o `administrador` — abre NEGOCIO. */
  esGestor: boolean;
  /** El **Y** de §2.1bis: rol de mostrador Y capacidad — abre ATENDER. */
  montaAtender: boolean;
}

/**
 * EL ORDEN, UNA VEZ.
 *
 * `ATENDER` va entre DATOS y NEGOCIO y no es capricho: con las cinco
 * barras de la letra el centro cae solo (titular con local →
 * `Hoy·Datos·ATENDER·Negocio·Cuenta`).
 *
 * Es PURA a propósito: se puede ejercer con una tabla de casos sin
 * levantar una app ni una sesión, que es lo que la vuelve verificable.
 */
export function ordenTabsPrestador(c: CapacidadDeBarra): ClaveTabPrestador[] {
  return [
    'index',
    'mascotas',
    ...(c.montaAtender ? (['atender'] as const) : []),
    ...(c.esGestor ? (['negocio'] as const) : []),
    'cuenta',
  ];
}

/** La key de i18n de cada tab. Tabla y no interpolación, por lo mismo que
 *  el resto de la casa: una key armada a mano compila siempre y se rompe
 *  en runtime el día que el vocabulario crezca. */
export const KEY_ETIQUETA_TAB = {
  index: 'tabs.hoy',
  mascotas: 'tabs.mascotas',
  atender: 'tabs.atender',
  negocio: 'tabs.negocio',
  cuenta: 'tabs.cuenta',
} as const satisfies Record<ClaveTabPrestador, string>;
