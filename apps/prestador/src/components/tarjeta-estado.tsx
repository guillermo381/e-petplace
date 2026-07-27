/**
 * TarjetaEstado — la anatomía on/off firmada en el gate S78 (Hoja del
 * miembro), extraída al segundo consumidor (el selector de Jornadas de
 * `seccion-horarios`). UNA definición — la duplicación de la anatomía
 * recién firmada habría sido deuda el mismo día de nacer.
 *
 * ENCENDIDA: superficie de card + `elevacion.reposo`, SIN borde — regla
 *   Chanel del marco (Ley 20): borde + sombra dicen lo mismo dos veces.
 * APAGADA: transparente + 1px `border.default`, sin sombra — sobre el
 *   papel no es una superficie: es un contorno.
 *
 * POR QUÉ NO ES `Tarjeta` (declarado): `Tarjeta` fija `bg.card` como
 * fondo en TODOS sus niveles y `border.subtle` como hairline
 * (`Tarjeta.tsx:82,99-109`); el estado apagado de esta anatomía no es
 * expresable con ella. Tokens puros (Ley 1) + `usePresionado` (D-401).
 *
 * DELTA DECLARADO AL GATE (viaja de la Hoja): el founder pidió radio 14 y
 * padding 13/14 — ninguno es token (`radius`: 12·16 / `spacing`: 12·16).
 * Se usa `radius.md` 12 y `spacing[3]` 12; los exactos exigen tokens
 * nuevos en `packages/ui` ⇒ pedido a A, no deducido acá.
 */

import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { radius, spacing, usePresionado, useTheme } from '@epetplace/ui';

export function TarjetaEstado({
  encendido,
  etiqueta,
  onPress,
  rol = 'checkbox',
  children,
}: {
  encendido: boolean;
  etiqueta: string;
  /** AUSENTE = tarjeta ESTÁTICA (S78-B recepción): pura lectura de
   *  estado, sin Pressable — un toque que no hace nada es una promesa
   *  rota (Ley 23). Presente = la física de presión de la casa. */
  onPress?: () => void;
  /** checkbox = alterna algo (la fila de servicio) · radio = elige entre
   *  pares (la persona del selector de Jornadas) · button = navega/abre
   *  (el grupo de franjas: el on/off ahí es ESTADO — activa/pausada —,
   *  no lo que el toque hace). */
  rol?: 'checkbox' | 'radio' | 'button';
  children: ReactNode;
}) {
  const { theme } = useTheme();
  const { handlers, estiloPresionado } = usePresionado(0.99);
  const superficie = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: radius.md,
    backgroundColor: encendido ? theme.bg.card : 'transparent',
    ...(encendido
      ? { boxShadow: theme.elevacion.reposo }
      : { borderWidth: theme.border.width, borderColor: theme.border.default }),
  };
  if (onPress === undefined) {
    return (
      <View accessible accessibilityLabel={etiqueta} style={superficie}>
        {children}
      </View>
    );
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
  );
}
