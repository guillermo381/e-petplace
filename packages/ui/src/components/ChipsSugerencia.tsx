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
  /**
   * 🔴 LA SEÑAL REAL, OBLIGATORIA SIN DEFAULT: `estado_vida === 'fallecida'`,
   * resuelta por la pantalla contra el perfil que ya tiene cargado.
   *
   * ⏪ **El piso de esta pieza colgaba SÓLO de `theme.mode === 'memorial'`, y
   * ése es un interruptor que nadie aprieta.** Medido en `D-1021`: **nadie
   * monta `<ThemeProvider memorial>` en ninguna de las dos apps** — el único
   * provider vivo es el raíz, con `mode={light|dark}`. *La protección estaba
   * escrita, se leía como protección, y la app igual le pedía algo a quien
   * perdió a su animal.*
   *
   * **`perdida` NO es memorial** (firma del founder, 7-sep): la familia que
   * busca a su mascota conserva la app entera. Por eso la prop se llama por
   * lo que la letra nombra y no por el estado.
   *
   * *No es un default que se pueda omitir: un `false` por omisión sería
   * exactamente el guard apagado que esta prop viene a curar.*
   */
  enMemorial: boolean

  sugerencias: readonly SugerenciaNexo[]
}

export function ChipsSugerencia({ enMemorial, sugerencias }: ChipsSugerenciaProps) {
  const { theme } = useTheme()

  /* ⛔ El Coach no existe en memorial. Ver la cabecera. */
    /* 🔴 **EL DATO MANDA, Y `theme.mode` SE CONSERVA EN EL `OR`** — misma cura
     que `LineaAlgoSalioDistinto`: la galería SÍ monta el sub-tema y ahí el
     guard tiene que seguir valiendo. *Lo que estaba mal no era mirar el tema:
     era mirar SÓLO el tema.* */
  if (enMemorial || theme.mode === 'memorial') return null
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
