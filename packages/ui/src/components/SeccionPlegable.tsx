/**
 * SeccionPlegable — UNA SECCIÓN QUE SE ABRE Y SE CIERRA POR SU TÍTULO (S107-B).
 *
 * Para «Horarios» y «Tus precios» del taller: pantallas largas donde el
 * prestador trabaja en una cosa por vez y el resto le estorba.
 *
 * ── EL CENSO (Ley 11, protocolo 1c pregunta 2) — Y DIO PIEZA NUEVA ───────
 * **Medido antes de escribir: `packages/ui` NO tiene acordeón**, y hay al
 * menos **seis implementaciones inline en apps** (`hogar/grooming`,
 * `hogar/bitacora`, `hogar/adiestramiento`, `hogar/index`,
 * `despensa/checkout`, `citas/[mascotaId]`). *Seis copias del mismo trabajo es
 * la definición del problema que la Ley 19 existe para cerrar: lo que se
 * copia, diverge.*
 *
 * **Y no la cubre ninguna de las cercanas:**
 * · **`PieRevelar`** (19.6) revela **el resto de una lista** desde su PIE —
 *   *«no aplica a abrir un compuesto en sus partes»*, dice su propia entrada.
 *   Acá se pliega **una sección entera desde su TÍTULO**: otro control, otro
 *   lugar, otro trabajo.
 * · **`SelectorSegmentado`** cambia entre vistas EXCLUYENTES; acá las secciones
 *   conviven y pueden estar todas abiertas.
 * · **`Hoja`** saca el contenido de la pantalla; plegar lo deja en su lugar.
 *
 * ── LA ANATOMÍA ES LA 19.7, NO UNA NUEVA ────────────────────────────────
 * Sin caja · título + chevron **direccional** (`⌄` revela en el lugar · `⌃`
 * pliega) · **target 44** · la cabecera entera tapea con rol `button`.
 * **El chevron codifica una verdad del contenido** (Ley 18): acá **jamás `›`**,
 * porque no se navega a ningún lado.
 *
 * ── LO QUE NO HACE, y es deliberado ─────────────────────────────────────
 * · **No es acordeón exclusivo.** Cada sección tiene su estado y varias pueden
 *   estar abiertas. *Cerrar una sección porque el prestador abrió otra le
 *   esconde algo que no pidió esconder.* Coordinarlas, si alguna pantalla lo
 *   quiere, es de la pantalla.
 * · **No guarda el estado.** `abierta` + `onCambiar` los tiene el consumidor:
 *   una pieza que recordara por su cuenta decidiría, al volver a la pantalla,
 *   algo que no le toca.
 * · **No anima la altura** (Ley 6: el layout de listas no se anima). El
 *   contenido aparece; el chevron gira, que es el único movimiento y es el que
 *   confirma el toque.
 *
 * ── ESCALERA (§4b) · DOSIS · TEMAS ──────────────────────────────────────
 * No muestra datos del expediente. Tokens puros, cero color propio: las dos
 * apps y los tres temas sin variante.
 */

import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'

import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { Texto } from './Texto'
import { CHEVRON } from './chevron'

export type SeccionPlegableProps = {
  /** El título, en voz de la app. Es también el control. */
  titulo: string
  /**
   * Una línea de contexto que se lee CON LA SECCIÓN CERRADA — «3 franjas»,
   * «desde $12». *Es lo que hace que plegar no sea esconder:* si al cerrar no
   * queda ninguna señal de lo que hay adentro, el prestador tiene que abrir
   * cada sección para acordarse.
   */
  detalle?: string
  abierta: boolean
  onCambiar: (abierta: boolean) => void
  children: ReactNode
}

export function SeccionPlegable({
  titulo,
  detalle,
  abierta,
  onCambiar,
  children,
}: SeccionPlegableProps) {
  const { theme } = useTheme()

  return (
    <View style={{ gap: spacing[3] }}>
      <Pressable
        onPress={() => onCambiar(!abierta)}
        accessibilityRole="button"
        accessibilityState={{ expanded: abierta }}
        accessibilityLabel={[titulo, detalle].filter(Boolean).join('. ')}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing[3],
          minHeight: 44,
          paddingVertical: spacing[2],
          borderRadius: radius.suave,
          backgroundColor: pressed ? theme.bg.overlay : 'transparent',
        })}
      >
        <View style={{ flex: 1, gap: spacing[0.5] }}>
          {/* `seccion` trae `accessibilityRole="header"` de fábrica — pero acá
              el rol del PRESSABLE es `button`, así que el header quedaría
              anidado en un control. Se usa `cuerpo` con peso propio del
              Pressable: el título ya se anuncia por el label del botón. */}
          <Texto variante="seccion">{titulo}</Texto>
          {detalle === undefined ? null : (
            <Texto variante="apoyo" color="tertiary">
              {detalle}
            </Texto>
          )}
        </View>

        {/* 19.7: ⌄ revela en el lugar · ⌃ pliega. JAMÁS `›` — no se navega. */}
        <Texto variante="cuerpo" color="tertiary">
          {abierta ? CHEVRON.arriba : CHEVRON.abajo}
        </Texto>
      </Pressable>

      {abierta ? children : null}
    </View>
  )
}
