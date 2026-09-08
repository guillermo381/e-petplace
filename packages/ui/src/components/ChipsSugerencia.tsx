/**
 * CHIPS DE SUGERENCIA — tres preguntas para empezar (S113-B · 2.0 · B1).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **SON ACTOS, NO UNA SELECCIÓN — Y POR ESO NO SE REUSÓ `FiltroPills`.**
 * ═══════════════════════════════════════════════════════════════════════════
 * Tocar uno **manda la pregunta**: no queda elegido, no hay estado, no hay
 * pata. `FiltroPills` es el control de elección de la casa y tiene su marca de
 * elegido; montarlo acá haría que el chip se quede pintado después de tocarlo,
 * *como si la pregunta siguiera activa cuando lo que hay es una respuesta*.
 * **Ley 22c**: un comando con consecuencias no se viste de control de
 * selección.
 *
 * ⚠️ **No existe «elegido», y no se puede agregar desde afuera.** No hay prop
 * de estado: la pieza no tiene dónde guardar una elección que no ocurre.
 *
 * ── LO QUE NO HACE ──────────────────────────────────────────────────────
 * **No inventa preguntas** (Ley 3): las tres llegan redactadas, y las compone
 * quien conoce a la mascota. **No las recorta ni las ordena.**
 * **Sin chips no se dibuja**: un riel vacío ocupa lugar y no dice nada.
 *
 * ── ⛔ MEMORIAL: NO SE DIBUJA ───────────────────────────────────────────
 * Proponerle preguntas a una familia que despidió a su mascota es la razón
 * exacta por la que `MODELO_LOYALTY` §7.1 apaga el motor entero en M6.
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * El pie de la Hoja de Nexo, arriba de la caja (C, lote 2.0). **Entregada y
 * no montada.**
 */

import { Pressable, ScrollView } from 'react-native'

import { Texto } from './Texto'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

export interface SugerenciaNexo {
  id: string
  /** *«¿Cuándo le toca la próxima vacuna?»* — ya redactada (Ley 3). */
  texto: string
  /** 🔴 **Obligatorio.** Un chip que no hace nada al tocarlo es peor que no
   *  estar: enseña que las sugerencias son decoración. */
  onPress: () => void
}

export interface ChipsSugerenciaProps {
  sugerencias: readonly SugerenciaNexo[]
}

export function ChipsSugerencia({ sugerencias }: ChipsSugerenciaProps) {
  const { theme } = useTheme()

  /* ⛔ El Coach no existe en memorial. Ver la cabecera. */
  if (theme.mode === 'memorial') return null
  /* Sin sugerencias no hay riel: un carril vacío ocupa lugar y no dice nada. */
  if (sugerencias.length === 0) return null

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      /* El aire de los extremos va en el contenido y no en el contenedor:
         así el primer chip no nace pegado al borde y el último tampoco. */
      contentContainerStyle={{ gap: spacing[2], paddingHorizontal: spacing[4] }}
    >
      {sugerencias.map((s) => (
        <Pressable
          key={s.id}
          accessibilityRole="button"
          accessibilityLabel={s.texto}
          onPress={s.onPress}
          style={{
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[2],
            borderRadius: radius.full,
            backgroundColor: theme.bg.card,
            /* Borde y no relleno de acento: *una sugerencia es una oferta,
               y una oferta que se ve como el CTA compite con lo que la
               persona vino a hacer.* */
            borderWidth: theme.border.width,
            borderColor: theme.border.subtle,
          }}
        >
          <Texto variante="apoyo" color="primary">
            {s.texto}
          </Texto>
        </Pressable>
      ))}
    </ScrollView>
  )
}
