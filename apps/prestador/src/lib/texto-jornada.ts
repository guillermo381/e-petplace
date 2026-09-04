/**
 * LA LÍNEA DE LA JORNADA — el descriptor del techo del HOY y su voz.
 *
 * ═══════════ S71-B1 — LA FORMA DEL DÍA (la firma del techo) ═══════════
 * El dato que CUENTA HACIA ATRÁS: se descuenta solo a medida que la jornada
 * avanza. Firma de COMPORTAMIENTO (Ley 15, lado prestador): cero acento
 * nuevo, cero componente nuevo, cero color.
 *
 * Descriptor puro → la pantalla lo traduce. Así los estados se leen de un
 * vistazo y el copy vive entero en el riel i18n.
 *
 * ⭐ **S113-C · POR QUÉ VIVE ACÁ Y NO ADENTRO DE `(tabs)/index.tsx`.**
 * La cura de la llave cruda (`{{n}}` en pantalla) pedía evidencia de sus
 * cuatro estados, y adentro de la pantalla la única evidencia posible era
 * **reimplementar la tabla en el arnés** — que es medir el eco y no la
 * pieza. Acá el archivo NO IMPORTA NADA DE RUNTIME (los dos imports son
 * `import type`), así que el arnés llama a **esta misma función** con el
 * `t` de la instancia i18next real. *La pieza que se prueba y la pieza que
 * corre son la misma.*
 */

import type { TraductorTipado } from '@epetplace/i18n';

import type { prestadorEs } from '../i18n/es';

/** El `t` tipado del prestador: una key inexistente rompe el typecheck. */
type T = TraductorTipado<typeof prestadorEs>;

export type FormaDelDia =
  | { clave: 'omitida' }
  /** S86-C · el día sin citas DICE que no hubo — jamás se calla. */
  | { clave: 'sinCitas' }
  | { clave: 'quedan'; n: number; hora: string }
  | { clave: 'queda1'; hora: string }
  | { clave: 'quedanSinHora'; n: number }
  | { clave: 'queda1SinHora' }
  | { clave: 'completa' }
  | { clave: 'porCoordinar'; n: number }
  /* ⭐ S113-C · EL DÍA LIBRE, con el conteo de la semana EN SUS TRES ESTADOS.
     `semana: null` NO es cero: es «todavía no lo sé». Un solo campo
     `number | null` vuelve INEXPRESABLE confundir carga con vacío — el
     consumidor no puede colapsarlos porque el tipo no se lo permite. */
  | { clave: 'libre'; semana: number | null }
  /* ⭐ S86-C · LAS DOS VOCES DEL PASADO (cruce 2). Un día vencido no promete:
     lo que quedó sin cerrar **es plata sin devengar** (el devengo nace al
     cerrar con calidad), y cada una es puerta a su cita — las filas de la
     Zona 2 ya navegan ahí, así que la voz nombra y la lista lleva. */
  | { clave: 'pasadoPendientes'; n: number }
  | { clave: 'pasadoCerrado'; n: number }

/**
 * 🔴→✓ S113-C · LA LLAVE CRUDA DEL TECHO.
 *
 * Estos `t()` pasaban `{ count }` y las keys dicen `{{n}}`: i18next 25 trae
 * `skipOnVariables: true` por default, así que una variable que no llega
 * **no falla ni se vacía — deja la llave literal en pantalla**. El founder
 * leyó «Hoy libre · {{n}} esta semana», y eran **SEIS brazos de esta misma
 * línea**, en español Y en inglés.
 *
 * ⚠️ Lo que lo hizo invisible tanto tiempo: `datoQuedan` interpola DOS
 * variables y **una sí y la otra no** («Te quedan {{n}} · terminas 16:30»),
 * así que la línea nunca se veía del todo rota. Y `count` no es un typo
 * inocente: **es el nombre que i18next usa para PLURALIZAR**, o sea que se
 * lee correcto al pasar. Las keys de acá pluralizan A MANO (`datoQueda1`,
 * `datoPasadoCerrado1`), así que `count` tampoco hacía ese trabajo.
 *
 * `undefined` = la línea NO se dibuja (solo `omitida`: cargando o error, o
 * sea que todavía no hay nada cierto que decir).
 */
export function textoDeLaForma(forma: FormaDelDia, t: T): string | undefined {
  return forma.clave === 'omitida'
    ? undefined
    : forma.clave === 'quedan'
      ? t('agenda.datoQuedan', { n: forma.n, hora: forma.hora })
      : forma.clave === 'queda1'
        ? t('agenda.datoQueda1', { hora: forma.hora })
        : forma.clave === 'quedanSinHora'
          ? t('agenda.datoQuedanSinHora', { n: forma.n })
          : forma.clave === 'queda1SinHora'
            ? t('agenda.datoQueda1SinHora')
            : forma.clave === 'completa'
              ? t('agenda.datoCompleta')
              : forma.clave === 'porCoordinar'
                ? t('agenda.datoPorCoordinar', { n: forma.n })
                : /* S86-C · las dos del pasado */
                  forma.clave === 'pasadoPendientes'
                  ? forma.n === 1
                    ? t('agenda.datoPasadoPendiente1')
                    : t('agenda.datoPasadoPendientes', { n: forma.n })
                  : forma.clave === 'sinCitas'
                    ? t('agenda.datoSinCitas')
                    : forma.clave === 'pasadoCerrado'
                      ? forma.n === 1
                        ? t('agenda.datoPasadoCerrado1')
                        : t('agenda.datoPasadoCerradoN', { n: forma.n })
                      : /* ⭐ S113-C · LAS TRES DEL DÍA LIBRE. `null` (no llegó)
                           y `0` (llegó vacío) son DOS HECHOS y NO comparten
                           guard: el `=== null` va PRIMERO y explícito, porque
                           un `forma.semana ? …` los colapsa en el mismo brazo
                           y volvería a decir «nada esta semana» sobre un dato
                           que todavía viaja.
                           Y el 1 y el N comparten key a propósito: en español
                           el resto de la frase no cambia con el número. */
                        forma.semana === null
                        ? t('agenda.datoLibre')
                        : forma.semana === 0
                          ? t('agenda.datoLibreSinSemana')
                          : t('agenda.datoLibreConSemana', { n: forma.semana })
}
