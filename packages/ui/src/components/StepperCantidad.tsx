/**
 * StepperCantidad — ajuste de CANTIDAD ACOTADA (S58, Ley 11 + Ley 22;
 * componente 33 — primer consumidor: el cupo "a la vez" por franja del
 * arte del paseo, B1b).
 *
 * ═══════════════════════════════════════════════════════════════════
 * QUÉ NO ES: no es un input de texto (LA REGLA DEL TECLADO, §15b: lo
 * que se ajusta no se digita), no es slider (el slider elige entre
 * PASOS con recorrido; el stepper suma/resta de a uno), no valida
 * reglas de negocio (min/max son del contrato de la pantalla; el
 * server es el juez). Presentacional puro.
 * EN LOS LÍMITES EL BOTÓN SE APAGA SERENO — voz terciaria, jamás
 * error: el tope es estado, no falla.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Anatomía: [−] valor [+] — el VALOR en mono tabular (dato de máquina,
 * Ley 3); los botones −/+ son superficies hundidas (bg.overlay,
 * rectángulo suave — Ley 21) con el glifo en el ACENTO POR REGISTRO
 * ('control' cliente · 'oficio' prestador; memorial degrada a tinta).
 * Target 44 por botón; pressed 0.99 (receta SM de Boton).
 *
 * A11y: adjustable con increment/decrement y el valor anunciado — el
 * lector y el gesto cuentan la misma historia.
 *
 * Escalera §4b: no muestra datos del expediente — control puro,
 * peldaños no aplican (declarado explícito).
 */

import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import Animated, { cubicBezier } from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'

import { Icono } from './Icono'
import { typography } from '../tokens/typography'
import { spacing } from '../tokens/spacing'
import { radius } from '../tokens/radius'
import { motion } from '../tokens/motion'
import { useTheme } from '../ThemeProvider'
import { useTraduccionUi } from '../i18n'

const BOTON = 44 // target táctil directo

/* 🔴 LA VARIANTE COMPACTA — nace de un defecto MEDIDO, no de una necesidad
   estética (S100b-B).

   **G-01 del gate: «el `+` pone 1, aparece el `−`, y no hay camino a 2».**
   La lógica del stepper estaba SANA. La causa era geométrica:

       caja interna de la tarjeta de vitrina …… 138 dp
       este stepper (44·2 + 12·2 + 32) ………… 144 dp
                                              ───────
                                              FALTAN 6 dp

   …y la tarjeta lleva `overflow: 'hidden'`, así que **el `+` —el elemento
   más a la derecha— quedaba recortado fuera del layout.** Medido en el
   aparato: en la tarjeta el contenedor quedaba en **74 dp**, `Menos`
   presente y **`Más` AUSENTE DEL ÁRBOL**. En el carrito, donde la fila es
   ancha, la misma pieza da **144.0 dp con los dos botones**. *La app se
   provee a sí misma el experimento de control.*

   ── POR QUÉ NO SE ACHICA EL BLANCO TÁCTIL ──────────────────────────
   **N8 es ley firmada: blancos de 44, y ningún consumidor la re-decide.**
   Achicar el botón a 36 y quedarse ahí habría curado el recorte rompiendo
   una ley para tapar un síntoma.

   ⇒ **Lo que se achica es el PÍXEL, no el TARGET:** 36 visuales + `hitSlop`
   4 = **44 de blanco efectivo**. *No es una excepción a N8: es la forma en
   que N8 se cumple cuando el espacio no alcanza* — y el precedente ya vivía
   tres líneas más arriba en la casa, en el timbre `+` de `TarjetaProducto`
   (36 visuales + `hitSlop` 8 = 52).

   **El gap NO baja de 8 a propósito:** con `hitSlop` 4 por lado, dos
   botones separados 8 dp tienen sus áreas táctiles *tocándose y no
   solapadas*. Bajar el gap las solaparía y el toque se volvería ambiguo
   —un stepper que a veces resta cuando quisiste sumar es peor que uno
   apretado—. *El número no es «lo que entra»: es el mínimo que mantiene
   los dos targets separados.* */
const BOTON_COMPACTO = 36
const HOLGURA_COMPACTA = (BOTON - BOTON_COMPACTO) / 2 // 4 ⇒ 36 + 4·2 = 44

export interface StepperCantidadProps {
  valor: number
  min: number
  max: number
  onCambio: (valor: number) => void
  /** accessibilityLabel del control (el label visible es de la pantalla). */
  etiqueta: string
  /** Ley 22 por registro: 'control' (cliente, default) · 'oficio' (prestador). */
  registro?: 'control' | 'oficio'
  /**
   * Para contenedores angostos — hoy, la tarjeta de vitrina (ver la nota de
   * `BOTON_COMPACTO`). **116 dp en vez de 144**, con el blanco de 44
   * intacto vía `hitSlop`.
   *
   * ⚠️ **No es «el stepper chico»: es el mismo stepper en una caja que no
   * da para 144.** Si la caja da, se usa el normal — *una variante que se
   * elige por gusto deja de ser una respuesta a una restricción y pasa a
   * ser un segundo estilo, que es lo que N11 prohíbe para los campos y vale
   * igual acá.*
   */
  compacto?: boolean
  /**
   * 🔴 EL `−` SE VUELVE PAPELERA EN EL MÍNIMO — **y solo donde corresponde**
   * (G-08, S100b-B).
   *
   * **`[SPEC]` eBay, y el matiz es el que decide dónde va:** *«the delete
   * action is only to be used when the numeric stepper is pair or
   * associated with an item tile such as item list in cart»*.
   * ⇒ **En el CARRITO sí**: bajar de 1 hace desaparecer la fila, y la
   * papelera lo anuncia. **En la GRILLA no**: ahí bajar de 1 devuelve la
   * tarjeta a su `+`, el tile no desaparece, y una papelera prometería un
   * borrado que no ocurre.
   *
   * **Presente ⇒ en el mínimo el botón BORRA, no se apaga** (Baymard/NN-g:
   * un control deshabilitado en el límite deja al usuario sin salida
   * visible). **Ausente ⇒ conducta de siempre**: apagado sereno.
   *
   * ⚠️ **Sin confirmación, a propósito.** La acción es inmediata y **el
   * deshacer es de la pantalla**, que es la única que sabe qué se borró y
   * puede reponerlo. *Un diálogo de «¿estás seguro?» por quitar un
   * producto del carrito cobra a todos el error de unos pocos.*
   */
  onBorrar?: () => void
}

function BotonPaso({
  signo,
  habilitado,
  color,
  onPress,
  etiqueta,
  compacto,
}: {
  signo: 'menos' | 'mas' | 'papelera'
  habilitado: boolean
  color: string
  onPress: () => void
  etiqueta: string
  compacto: boolean
}) {
  const { theme } = useTheme()
  const [presionado, setPresionado] = useState(false)
  return (
    <Pressable
      onPress={() => {
        if (habilitado) onPress()
      }}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ disabled: !habilitado }}
      onPressIn={() => {
        if (habilitado) setPresionado(true)
      }}
      onPressOut={() => setPresionado(false)}
      // El blanco de 44 se conserva SIEMPRE: en compacto lo completa el
      // hitSlop, porque lo que se achica es el píxel y no el target (N8).
      hitSlop={compacto ? HOLGURA_COMPACTA : 0}
    >
      <Animated.View
        style={{
          width: compacto ? BOTON_COMPACTO : BOTON,
          height: compacto ? BOTON_COMPACTO : BOTON,
          borderRadius: radius.suave,
          backgroundColor: theme.bg.hundido,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale: presionado ? 0.99 : 1 }],
          transitionProperty: 'transform',
          transitionDuration: motion.duration.fast,
          transitionTimingFunction: cubicBezier(...motion.easing.spring.bezier),
        }}
      >
        {signo === 'papelera' ? (
          <Icono nombre="papelera" tamano={20} registro="tinta" tinta={color} />
        ) : (
          <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
            {signo === 'mas' ? <Path d="M10 4v12" stroke={color} strokeWidth={2} strokeLinecap="round" /> : null}
            <Path d="M4 10h12" stroke={color} strokeWidth={2} strokeLinecap="round" />
          </Svg>
        )}
      </Animated.View>
    </Pressable>
  )
}

export function StepperCantidad({ valor, min, max, onCambio, etiqueta, registro = 'control', compacto = false, onBorrar }: StepperCantidadProps) {
  const { theme } = useTheme()
  const { t } = useTraduccionUi()
  const esMemorial = theme.mode === 'memorial'

  if (__DEV__ && min >= max) {
    console.warn(`StepperCantidad: min ${min} ≥ max ${max} — un rango sin recorrido no es un stepper.`)
  }

  const v = Math.min(Math.max(valor, min), max)
  const acento = esMemorial
    ? theme.accent.control // memorial: tinta (la marca no celebra ahí)
    : registro === 'oficio'
      ? theme.accent.primary
      : theme.accent.control

  const irA = (destino: number) => {
    const d = Math.min(Math.max(destino, min), max)
    if (d !== v) onCambio(d)
  }

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={etiqueta}
      accessibilityValue={{ min, max, now: v, text: String(v) }}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment') irA(v + 1)
        if (e.nativeEvent.actionName === 'decrement') irA(v - 1)
      }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      style={{ flexDirection: 'row', alignItems: 'center', gap: compacto ? spacing[2] : spacing[3] }}
    >
      {/* En el mínimo, con `onBorrar`, el menos es PAPELERA y ejecuta el
          borrado; sin él, se apaga sereno como siempre. */}
      <BotonPaso
        signo={onBorrar !== undefined && v <= min ? 'papelera' : 'menos'}
        habilitado={v > min || onBorrar !== undefined}
        // en el límite se apaga SERENO (voz terciaria) — jamás error
        color={v > min || onBorrar !== undefined ? acento : theme.text.tertiary}
        onPress={() => (v <= min && onBorrar !== undefined ? onBorrar() : irA(v - 1))}
        etiqueta={onBorrar !== undefined && v <= min ? t('stepperCantidad.borrar') : t('stepperCantidad.menos')}
        compacto={compacto}
      />
      <Text
        style={{
          minWidth: compacto ? spacing[7] : spacing[8],
          textAlign: 'center',
          // dato de máquina: mono tabular (Ley 3)
          fontFamily: typography.family.mono.regular,
          fontSize: typography.size.md,
          fontVariant: ['tabular-nums'],
          letterSpacing: typography.tracking.mono,
          color: theme.text.primary,
        }}
      >
        {v}
      </Text>
      <BotonPaso
        signo="mas"
        habilitado={v < max}
        color={v < max ? acento : theme.text.tertiary}
        onPress={() => irA(v + 1)}
        etiqueta={t('stepperCantidad.mas')}
        compacto={compacto}
      />
    </View>
  )
}
