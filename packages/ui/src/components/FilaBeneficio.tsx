import { View } from 'react-native'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { Icono, type IconoNombre } from './Icono'
import { Tarjeta } from './Tarjeta'
import { Texto } from './Texto'

/**
 * ═══════════════════════════════════════════════════════════════════════
 * **FilaBeneficio — LO QUE LA APP HACE POR VOS, y NO SE TOCA.**
 * S116-B lote 8. C la monta cuatro veces en 02, **una tarjeta por
 * beneficio**, como el sketch.
 *
 * ── 🔴 POR QUÉ ES PIEZA PROPIA Y NO `CeldaNavegacion` SIN `onPress` ───
 * Porque **lo que las separa no es el toque: es lo que ANUNCIAN.** Una
 * celda de navegación dice *«acá se entra»* con todo su cuerpo —el chevrón,
 * el rol de botón, el hundido— y quitarle el `onPress` deja **una puerta
 * que no abre**: la persona la toca, no pasa nada, y concluye que la app
 * está rota. *Un control que no responde es peor que ningún control.*
 *
 * Y para el lector de pantalla la diferencia es TOTAL: una celda se anuncia
 * *«botón»*. **Acá no hay botón que anunciar** — hay una frase sobre lo que
 * la app hace. **Ni `accessibilityRole`, ni `Pressable`, ni chevrón, ni
 * `usePresionado`:** no es que estén apagados, es que **no están**.
 *
 * ── LA ANATOMÍA, y de dónde sale cada parte ──────────────────────────
 * Glifo en **ciruela sobre su círculo ciruela-tinte** — el par
 * `accent.glifo`/`accent.glifoBg`, montado con `registro="glifo"` como en
 * toda la casa v5. **Título en negrita** y **una línea de apoyo** debajo.
 * Todo dentro de **su propia tarjeta blanca**: cuatro beneficios son cuatro
 * tarjetas, no una lista con divisores. *Una lista dice «estos ítems van
 * juntos»; cuatro tarjetas dicen «cada uno vale por sí mismo», que es lo
 * que una pantalla de propuesta necesita.*
 *
 * ⚠️ **La voz llega ya redactada** (Ley 3): la pieza no arma frases ni sabe
 * en qué idioma está.
 * ═══════════════════════════════════════════════════════════════════════
 */

/** El disco del glifo. Mismo tamaño que el de `CeldaNavegacion` a propósito:
 *  *dos columnas de glifos con distinto diámetro en la misma app se leen como
 *  un error de alineación, aunque cada una esté bien sola.* */
const DISCO = 40

export interface FilaBeneficioProps {
  glifo: IconoNombre
  /** El título, en negrita. Ya redactado. */
  titulo: string
  /** La línea de apoyo. Ya redactada. */
  apoyo: string
}

export function FilaBeneficio({ glifo, titulo, apoyo }: FilaBeneficioProps) {
  const { theme } = useTheme()
  return (
    <Tarjeta elevacion="reposo">
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] }}>
        <View
          style={{
            width: DISCO,
            height: DISCO,
            borderRadius: radius.chipV5,
            backgroundColor: theme.accent.glifoBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* El registro se fuerza: quien monta un beneficio no elige de qué
              color sale su glifo — lo decide la casa. */}
          <Icono nombre={glifo} registro="glifo" />
        </View>

        {/* `flex: 1` para que el apoyo envuelva en vez de empujar al glifo:
            **el que cede es el texto, que degrada legiblemente.** */}
        <View style={{ flex: 1, gap: spacing[1] }}>
          <Texto variante="enfasis">{titulo}</Texto>
          <Texto variante="apoyo" color="secondary">
            {apoyo}
          </Texto>
        </View>
      </View>
    </Tarjeta>
  )
}
