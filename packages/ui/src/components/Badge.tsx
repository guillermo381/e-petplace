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

import { DiscoContador } from './disco-contador'
import { useTraduccionUi } from '../i18n'

export interface BadgeProps {
  /** Cuántas cosas esperan. `<= 0` = nada se dibuja (regla de existencia). */
  n: number
  /** LA FORMA DE LA NOVEDAD (S88, firma founder — lámina de la campana):
   *  · 'contador' (default): la pill con el número — la de BarraTabs
   *    desde S43.
   *  · 'huella': UNA huella RELLENA en la esquina, JAMÁS un número — el
   *    número invita a vaciarlo (la mecánica que MODELO_LOYALTY §3
   *    prohíbe). Es NOVEDAD, no selección: la huella-marcador de los
   *    filtros (MarcaEleccion, la pata) es otro idioma y convive sin
   *    pisarse porque ésta vive en el slot del badge.
   *    Color: `accent.active` (el slot POR CASA, S83-B13 — tealDark en
   *    el prestador, pink en el cliente) — **JAMÁS rojo de alarma: un
   *    aviso no es un error** (condición firmada; por eso acá no entra
   *    ningún token de `status`).
   *    La ley del único relleno, aplicada AL PAR: el glifo que la porta
   *    va en TRAZO (la campana) y la huella va RELLENA. */
  forma?: 'contador' | 'huella'
  /** LA REGLA DE SUPERFICIE (S88, cura pre-gate — censo de C con el
   *  dato): `accent.active` del prestador en claro es tealDark #0A7268,
   *  EL MISMO HEX del muro del techo donde la lámina manda la campana —
   *  la huella podía ser invisible exactamente en su lugar firmado.
   *  Mismo vocabulario que Insignia: 'clara' (default) | 'muro'.
   *
   *  ⚖️ EL ORO, FIRMADO (S89, orden 4 — sobre la medición
   *  `2026-08-06-s89b-MEDICION-oro-campana.md`): sobre el MURO la
   *  huella pinta ORO `palette.ctaOro` #FCBC1D — rige en muro claro
   *  (3.41, con la excepción §15b.2 que A escribe con el precedente
   *  magenta S83), muro noche (5.95) y el degradado del cliente (peor
   *  punto 3.33; el montaje del cliente pasa `superficie="muro"`).
   *  **Sobre papel y en MEMORIAL la huella queda como antes — la letra
   *  ganó al número:** papel 1.62 no pasa (en 'clara' sigue el acento
   *  por casa), y memorial NO SE CELEBRA — con `superficie="muro"` en
   *  memorial la pieza conserva papel (lo de siempre), jamás oro. Los
   *  pares oro/muro viven en `verify:diseno` (clase fill, mín 3).
   *  Las tres condiciones firmadas siguen intactas: jamás un número ·
   *  jamás rojo de alarma · jamás anima.
   *  Alcance declarado: rige la forma `huella` (la campana del muro).
   *  El contador sobre el muro NO tiene consumidor hoy — la pill no
   *  cambia con esta prop, y si un día vive ahí, gana su regla con su
   *  caso en la mano (una prop sin consumidor decora). */
  superficie?: 'clara' | 'muro'
  /** El ícono (u otro ancla visual) sobre el que se posa la novedad. */
  children: ReactNode
}

export function Badge({ n, children }: BadgeProps) {
  /* 🔴 **LA PATA MURIÓ ACÁ (lote 13, orden del founder en el recorrido 4):
     *«el contador es un círculo magenta con el número adentro en blanco…
     la pata muere ahí. Misma pieza para campana y carrito.»***

     Lo que se va con ella, y conviene que quede escrito porque era letra
     firmada en su momento: la huella decía la novedad **por PRESENCIA y
     jamás con un número**, para no invitar a vaciarla (`MODELO_LOYALTY`
     §3). *Esa razón sigue siendo buena y el founder decidió otra cosa —
     se ejecuta, y se anota lo que se paga: el contador vuelve a decir
     cuántos, así que la mecánica de «bajarlo a cero» vuelve a estar a la
     vista.*

     ⚠️ **`forma` y `superficie` siguen en el tipo y ya no hacen nada.**
     No se retiran hoy porque `apps/cliente` y la galería las pasan, y
     romperles el typecheck a mitad de sesión cuesta más que dos props
     inertes — **con su fecha de muerte escrita: se van cuando su último
     consumidor migre.** */
  return (
    <View>
      {children}
      <DiscoContador cuenta={n} />
    </View>
  )
}

/** La mitad ② del contrato: el label del tocable que porta el badge.
 *  `useEtiquetaBadge()('Avisos', 3)` → «Avisos, 3 pendientes» (es) /
 *  «Notices, 3 pending» (en); con n<=0 devuelve la etiqueta sola.
 *  Con `forma='huella'` el label tampoco dice el número — la firma
 *  «jamás un número» rige entera, no solo en el píxel. */
export function useEtiquetaBadge() {
  const { t } = useTraduccionUi()
  return (etiqueta: string, n: number, forma: 'contador' | 'huella' = 'contador') =>
    n > 0
      ? forma === 'huella'
        ? t('badge.sinLeer', { etiqueta })
        : t('badge.pendientes', { etiqueta, n })
      : etiqueta
}
