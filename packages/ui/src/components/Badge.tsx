/**
 * Badge — el contador de novedades SOBRE un ícono (S88-B).
 *
 * EXTRAÍDO de `BarraTabs`, no inventado: la anatomía vivía inline ahí
 * desde S43 (8 líneas — Insignia `atencion` sm en absolute sobre el
 * glifo) con CERO consumidores del prop. **La campana del Encabezado es
 * el segundo consumidor, y ese es el disparo que D-546 pedía**: lo que
 * se copia diverge (19.9), así que a la segunda aparición la anatomía
 * sube a pieza y `BarraTabs` pasa a consumirla.
 *
 * QUÉ ES: novedad ACUMULADA sobre un ícono — «te esperan N». Dos ejes
 * que no se pisan, y la casa ya los separó una vez en la propia barra:
 * la huella dice DÓNDE ESTÁS (§2.6, estado) · el badge dice CUÁNTO TE
 * ESPERA (novedad). QUÉ NO ES: el destello — el destello es LA MARCA de
 * la IA (§5.1), jamás un badge; y esta pieza jamás anima (Ley 6: la
 * novedad se dice con presencia, no con movimiento).
 *
 * ── LA A11Y ES PARTE DEL CONTRATO, y tiene DOS mitades ──────────────
 * ① La pill visual se ESCONDE del árbol de accesibilidad: el número
 *   viaja en el label del TOCABLE que envuelve al ícono (el contrato
 *   S43 de la barra) — leerla aparte sería anunciarlo dos veces.
 * ② Quien envuelve compone su label con `useEtiquetaBadge()` — la voz
 *   vive en el riel (namespace ui), no en un template hardcodeado.
 *   *(La extracción pagó de paso una deuda chica: el «{n} pendientes»
 *   de BarraTabs estaba HARDCODEADO en español desde S43 — la voz migra
 *   al riel al tocarse, como manda la casa.)*
 *
 * REGLA DE EXISTENCIA: con `n <= 0` la pieza rinde el ícono SOLO — cero
 * badge vacío, cero «0». La posición (top -6 / right -14) es la firmada
 * en S43 para la barra y es el DEFAULT; no hay props de geometría: un
 * badge que cada pantalla acomoda a mano es la divergencia de nuevo.
 * Sin clamp de dígitos en v1 (comportamiento S43 exacto) — si un día un
 * contador real pasa de 99, el «99+» se decide con ese caso en la mano.
 */

import type { ReactNode } from 'react'
import { View } from 'react-native'

import { Insignia } from './Insignia'
import { useTraduccionUi } from '../i18n'

export interface BadgeProps {
  /** Cuántas cosas esperan. `<= 0` = el ícono solo (regla de existencia). */
  n: number
  /** El ícono (u otro ancla visual) sobre el que se posa el contador. */
  children: ReactNode
}

export function Badge({ n, children }: BadgeProps) {
  return (
    <View>
      {children}
      {n > 0 ? (
        <View
          style={{ position: 'absolute', top: -6, right: -14 }}
          // El número viaja en el label del tocable (mitad ① del contrato);
          // la pill acá es presentación — anunciarla sería decirlo dos veces.
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          <Insignia estado="atencion" etiqueta={String(n)} tamaño="sm" />
        </View>
      ) : null}
    </View>
  )
}

/** La mitad ② del contrato: el label del tocable que porta el badge.
 *  `useEtiquetaBadge()('Avisos', 3)` → «Avisos, 3 pendientes» (es) /
 *  «Notices, 3 pending» (en); con n<=0 devuelve la etiqueta sola. */
export function useEtiquetaBadge() {
  const { t } = useTraduccionUi()
  return (etiqueta: string, n: number) =>
    n > 0 ? t('badge.pendientes', { etiqueta, n }) : etiqueta
}
