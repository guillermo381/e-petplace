/**
 * TarjetaEstado — la anatomía portadora de la gramática "ESTÁ / ESPERA"
 * (`DISEÑO_EXPERIENCIA` §15b.0bis, firmada en el gate global del founder
 * 26-jul-2026, dentro de Hoja del miembro + turnos + recepción).
 *
 * LA GRAMÁTICA: en las listas de estado del prestador, lo que ESTÁ
 * (adentro, activo, rigiendo) es superficie apoyada; lo que ESPERA
 * (pausado, por llegar, sin regir) es contorno. Una sola distinción
 * visual para un solo significado.
 *
 * ESTÁ:    superficie de card + `elevacion.reposo`, SIN borde — regla
 *          Chanel del marco (Ley 20): borde + sombra dicen lo mismo dos
 *          veces.
 * ESPERA:  transparente + 1px `border.default`, sin sombra — sobre el
 *          papel no es una superficie: es un contorno.
 *
 * POR QUÉ NO ES `Tarjeta` (declarado): `Tarjeta` fija `bg.card` como
 * fondo en TODOS sus niveles y `border.subtle` como hairline
 * (`Tarjeta.tsx:104-114`); el estado ESPERA de esta anatomía no es
 * expresable con ella. Tokens puros (Ley 1) + `usePresionado` (D-401).
 *
 * DELTA DECLARADO AL GATE, VIVO (viaja desde la Hoja del miembro, S78):
 * el founder pidió radio 14 y padding 13/14 — ninguno es token (`radius`:
 * 12·16 / `spacing`: 12·16). Se usa `radius.md` 12 y `spacing[3]` 12. Al
 * promoverse la pieza, `packages/ui` dejó de ser territorio ajeno y el
 * pedido dejó de ser cruce — pero un valor que no existe en tokens se
 * DECLARA, no se deduce: queda en la lista de gate (S83-B1).
 *
 * PROMOVIDA a `packages/ui` en S83-B1 (Ley 11: cuatro superficies vivas;
 * la nota S78 en D-535 pedía coordinarla, no hacerla de arrastre).
 */

import { type ReactNode } from 'react'
import { Pressable, View, type ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'

import { usePresionado } from './usePresionado'

import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

export type TarjetaEstadoRol = 'checkbox' | 'radio' | 'button'

export type TarjetaEstadoProps = {
  /** true = ESTÁ (superficie apoyada) · false = ESPERA (contorno). */
  encendido: boolean
  etiqueta: string
  /** AUSENTE = tarjeta ESTÁTICA (S78-B recepción): pura lectura de
   *  estado, sin Pressable — un toque que no hace nada es una promesa
   *  rota (Ley 23). Presente = la física de presión de la casa. */
  onPress?: () => void
  /** checkbox = alterna algo (la fila de servicio) · radio = elige entre
   *  pares (la persona del selector de Jornadas) · button = navega/abre
   *  (el grupo de franjas: el on/off ahí es ESTADO — activa/pausada —,
   *  no lo que el toque hace). */
  rol?: TarjetaEstadoRol
  children: ReactNode
}

export function TarjetaEstado({
  encendido,
  etiqueta,
  onPress,
  rol = 'checkbox',
  children,
}: TarjetaEstadoProps) {
  const { theme } = useTheme()
  const { handlers, estiloPresionado } = usePresionado(0.99)
  const superficie: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: radius.md,
    backgroundColor: encendido ? theme.bg.card : 'transparent',
    ...(encendido
      ? { boxShadow: theme.elevacion.reposo }
      : { borderWidth: theme.border.width, borderColor: theme.border.default }),
  }
  if (onPress === undefined) {
    return (
      <View accessible accessibilityLabel={etiqueta} style={superficie}>
        {children}
      </View>
    )
  }
  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlers.onPressIn}
      onPressOut={handlers.onPressOut}
      accessibilityRole={rol}
      accessibilityState={rol === 'button' ? undefined : { checked: encendido }}
      accessibilityLabel={etiqueta}
    >
      <Animated.View style={[superficie, estiloPresionado]}>{children}</Animated.View>
    </Pressable>
  )
}
