import { type ReactNode } from 'react'
import { Pressable, View, type ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'
import { usePresionado } from './usePresionado'
import { medidas } from '../tokens/medidas'
import { radius } from '../tokens/radius'

/**
 * ═══════════════════════════════════════════════════════════════════════
 * **DISCO DE VIDRIO (S116-B lote 12) — el círculo translúcido que se apoya
 * sobre la banda ciruela.**
 *
 * 🔴 **NACE COMO PIEZA PORQUE ESTAR EXPUESTO NO ALCANZÓ.** Vivía adentro de
 * `Cabecera.tsx` y desde el lote 2 estaba expuesto como `Cabecera.Disco`,
 * **con un comentario que pedía exactamente lo que después pasó**: *«que
 * quien monte la acción derecha use EL de la cabecera y no dibuje otro»*.
 * **C lo copió igual para el carrito de la Despensa** — y no por descuido:
 *
 * > **Exponer no es publicar.** Una propiedad estática no aparece en el
 * > índice del paquete, no tiene entrada de catálogo, no tiene fila en la
 * > galería y no sale en un autocompletado de `@epetplace/ui`. Para quien
 * > no leyó ese archivo, **es indistinguible de una pieza privada** — y la
 * > salida barata siempre es volver a dibujarla.
 *
 * ⇒ La puerta es esta pieza. `Cabecera.Disco` queda como alias y **muere
 * cuando su último consumidor migre** (no se retira hoy: hay ramas en vuelo
 * que lo usan, y romperlas a mitad de sesión cuesta más que el alias).
 *
 * ── LO QUE ES ──────────────────────────────────────────────────────────
 * Un disco de `rgba(255,255,255,.16)` del alto de la flecha de la cabecera
 * empujada. **El blanco translúcido está atado a que abajo haya ciruela**:
 * sobre lienzo no se ve, y eso no es un defecto de la pieza — es su
 * material. Quien lo monte fuera de una banda oscura está usando la pieza
 * equivocada.
 *
 * Sin `onPress` es un **contenedor** (no anuncia toque, no toma rol);
 * con `onPress` es un botón con su etiqueta obligatoria.
 */
export function DiscoVidrio({
  children,
  onPress,
  etiqueta,
}: {
  children: ReactNode
  onPress?: () => void
  etiqueta?: string
}) {
  const { handlers, estiloPresionado } = usePresionado(0.97)
  const caja: ViewStyle = {
    width: medidas.cabeceraEmpujada.flecha,
    height: medidas.cabeceraEmpujada.flecha,
    borderRadius: radius.chipV5,
    backgroundColor: 'rgba(255,255,255,.16)',
    alignItems: 'center',
    justifyContent: 'center',
  }
  if (onPress === undefined) return <View style={caja}>{children}</View>
  /* ⚠️ El `estiloPresionado` va en un `Animated.View` y NO en el `style` del
     `Pressable`: ahí compila en `packages/ui` y **rompe el typecheck de
     `apps/prestador`** (su `ViewStyle` no acepta los campos de transición
     de Reanimated). Es el molde que `Boton` ya usa. */
  return (
    <Animated.View style={[caja, estiloPresionado]}>
      <Pressable
        {...handlers}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={etiqueta}
        style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
      >
        {children}
      </Pressable>
    </Animated.View>
  )
}
