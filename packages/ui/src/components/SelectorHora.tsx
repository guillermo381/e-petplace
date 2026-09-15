/**
 * SelectorHora — LOS CHIPS DE HORA.
 *
 * El elegido en ciruela con letra blanca; **la hora sin lugar se ve apagada
 * y no se elige**.
 *
 * ── DE DÓNDE VIENE, Y POR QUÉ NO ES UNA PROMOCIÓN LITERAL ─────────────
 * Su antecesor vive **local en el cliente**: `GrillaElegir`
 * (`apps/cliente/src/components/reserva-piezas.tsx:229`). Al medirlo antes
 * de escribir esto apareció lo que decide la forma: **`GrillaElegir` hace
 * TRES trabajos** —las horas, las duraciones («30 min», «1 h») y el QUÉ de
 * grooming a dos columnas—, y por eso tiene props de columnas y de voz.
 *
 * 🔴 **Promoverlo verbatim con el nombre `SelectorHora` habría puesto un
 * nombre que miente sobre dos de sus tres usos** — y un nombre que miente
 * en `packages/ui` lo hereda toda la casa. *Se promueve el TRABAJO, no el
 * archivo.* Acá vive el eje de la hora, con lo único que su antecesor no
 * tenía: **el estado sin lugar.**
 *
 * ⚠️ **Lo que queda abierto, declarado:** cuando el eje de la hora migre
 * acá, `GrillaElegir` pasa de tres trabajos a dos. *Los otros dos siguen
 * siendo suyos y ninguno es «hora».*
 *
 * ── LA HORA VA EN MONO, Y NO ES CAPRICHO ──────────────────────────────
 * Ley 3: **dato de máquina**. Es exactamente lo que el antecesor ya
 * declaraba al separar `voz='mono'` (la hora) de `voz='sans'` (la
 * duración), *«sin excepción por comodidad»*. Acá no hace falta la prop
 * porque la pieza es de una sola cosa.
 *
 * ── APAGADO Y NO ELEGIBLE — y la contrapartida se dice ────────────────
 * Orden del encargo: *«si un día u hora no tiene lugar, se ve apagado y no
 * se elige»*. ⚠️ **Eso cierra el camino por el que se explicaría por qué no
 * hay** — es el mismo razonamiento que llevó a la rueda de días a dejar el
 * día cerrado TOCABLE. Acá manda el encargo, y la consecuencia es de quien
 * monta: **si todas las horas de un día están apagadas, la pantalla tiene
 * que decirlo**, porque el chip ya no puede.
 */

import { Pressable, View } from 'react-native'
import Animated from 'react-native-reanimated'

import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { llenoDeSeleccion } from './lleno-de-seleccion'
import { Texto } from './Texto'
import { usePresionado } from './usePresionado'

export interface HoraOpcion {
  /** El identificador — normalmente el ISO o el `HH:mm`. */
  codigo: string
  /** Lo que se lee: la hora ya formateada por quien conoce el idioma. */
  etiqueta: string
  /** ¿Queda lugar? `false` ⇒ apagada y no elegible. */
  disponible: boolean
}

export interface SelectorHoraProps {
  horas: HoraOpcion[]
  /** `null` = todavía no eligió. **No hay preselección**: *elegir por la
   *  familia una hora que no pidió es cómo se reserva lo que no se quería.* */
  elegida: string | null
  onElegir: (codigo: string) => void
  /** Cómo se dice «sin lugar» — el lector de pantalla no ve opacidades. */
  etiquetaSinLugar: string
}

function Chip({
  hora,
  elegida,
  onElegir,
  etiquetaSinLugar,
}: {
  hora: HoraOpcion
  elegida: boolean
  onElegir: () => void
  etiquetaSinLugar: string
}) {
  const { theme } = useTheme()
  const presion = usePresionado()
  const sinLugar = !hora.disponible

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: elegida, disabled: sinLugar }}
      accessibilityLabel={sinLugar ? `${hora.etiqueta}, ${etiquetaSinLugar}` : hora.etiqueta}
      disabled={sinLugar}
      onPress={onElegir}
      {...(sinLugar ? null : presion.handlers)}
    >
      <Animated.View
        style={[
          sinLugar ? undefined : presion.estiloPresionado,
          {
            minWidth: 74,
            paddingVertical: spacing[2.5],
            paddingHorizontal: spacing[3],
            borderRadius: radius.md,
            borderCurve: 'continuous',
            alignItems: 'center',
            backgroundColor: elegida ? llenoDeSeleccion(theme) : theme.bg.card,
            boxShadow: elegida ? undefined : theme.elevacion.reposo,
            opacity: sinLugar ? 0.4 : 1,
          },
        ]}
      >
        <Texto variante="dato" color={elegida ? 'sobreControl' : 'primary'} tabular>
          {hora.etiqueta}
        </Texto>
      </Animated.View>
    </Pressable>
  )
}

export function SelectorHora({ horas, elegida, onElegir, etiquetaSinLugar }: SelectorHoraProps) {
  return (
    <View
      accessibilityRole="radiogroup"
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}
    >
      {horas.map((h) => (
        <Chip
          key={h.codigo}
          hora={h}
          elegida={h.codigo === elegida}
          onElegir={() => onElegir(h.codigo)}
          etiquetaSinLugar={etiquetaSinLugar}
        />
      ))}
    </View>
  )
}
