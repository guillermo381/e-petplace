/**
 * «CONOCIÉNDOLO · N por resolver» — la pastilla del perfil (S113-B · 2.1).
 *
 * La segunda puerta al «Contanos», y la que se ve sin buscarla. Dice cuánto
 * falta para que la casa conozca a esta mascota, y **baja sola** cuando la
 * familia responde.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **CON CERO PENDIENTES NO SE DIBUJA, Y ES LA REGLA QUE LA ORDENA.**
 * ═══════════════════════════════════════════════════════════════════════════
 * *«Conociéndolo · 0 por resolver» es una pastilla que ocupa lugar para decir
 * que no hay nada que hacer* — y el día que vuelva a haber algo, ya nadie la
 * mira. Misma doctrina que `haySeguridad` y que `D-1025`: **la firma de esta
 * pieza es su desaparición.**
 *
 * ⚠️ Y por eso `n` es **lo que FALTA**, no lo que se sabe. Un contador que
 * sube al usar el producto es un progreso; éste **baja**, y cuando llega a
 * cero se va. *Un «12 de 20» invita a completar una ficha; un «3 por
 * resolver» invita a contestar tres cosas, que es lo que de verdad se le está
 * pidiendo a la familia.*
 *
 * ── NO ES UNA ALARMA (`R20`) ────────────────────────────────────────────
 * No hay nada mal: hay algo que todavía no nos contaron. Vive en el **tinte**
 * de la casa, nunca en relleno de atención — *rellenarla la pondría a competir
 * con el CTA, y además le diría a la familia que está en falta.*
 *
 * ── ⛔ MEMORIAL: NO SE DIBUJA ───────────────────────────────────────────
 * *Pedirle a una familia que despidió a su mascota que «termine de contarnos
 * cómo era» es exactamente lo que `MODELO_LOYALTY` §7.1 apaga.*
 *
 * ── LO QUE NO HACE ──────────────────────────────────────────────────────
 * **No compone voz (Ley 3):** la frase entera llega redactada, con su número
 * adentro — *la pieza no sabe pluralizar en el idioma de nadie.*
 * **No abre la Hoja:** llama, y la pantalla decide (es la misma Hoja que abre
 * la ficha de raza, y quién la monta no es asunto de esta pieza).
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * El perfil de la mascota (C). **Entregada y no montada** — medido:
 * `git grep PastillaConociendolo -- apps/` da cero.
 */

import { Pressable, View } from 'react-native'

import { Texto } from './Texto'
import { Chevron } from './chevron'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

export interface PastillaConociendoloProps {
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

  /** **Lo que FALTA.** Con `0` la pieza no se dibuja. Ver la cabecera. */
  n: number
  /** *«Conociéndolo · 3 por resolver»* — la frase entera, ya redactada con su
   *  número adentro (Ley 3). */
  voz: string
  onPress: () => void
}

export function PastillaConociendolo({ enMemorial, n, voz, onPress }: PastillaConociendoloProps) {
  const { theme } = useTheme()

  /* ⛔ En memorial no se pide terminar de contar nada. */
    /* 🔴 **EL DATO MANDA, Y `theme.mode` SE CONSERVA EN EL `OR`** — misma cura
     que `LineaAlgoSalioDistinto`: la galería SÍ monta el sub-tema y ahí el
     guard tiene que seguir valiendo. *Lo que estaba mal no era mirar el tema:
     era mirar SÓLO el tema.* */
  if (enMemorial || theme.mode === 'memorial') return null
  /* 🔴 La firma de la pieza es su desaparición. Ver la cabecera. */
  if (n <= 0) return null

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={voz}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        alignSelf: 'flex-start',
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[2],
        borderRadius: radius.full,
        /* Tinte, no relleno de atención: no hay nada mal, hay algo que
           todavía no nos contaron (`R20`). */
        backgroundColor: theme.bg.card,
        borderWidth: theme.border.width,
        borderColor: theme.border.subtle,
      }}
    >
      <View style={{ flexShrink: 1 }}>
        <Texto variante="apoyo" color="primary">
          {voz}
        </Texto>
      </View>
      <Chevron color={theme.text.tertiary} direccion="derecha" />
    </Pressable>
  )
}
