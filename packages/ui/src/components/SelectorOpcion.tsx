/**
 * SelectorOpcion — chips de selección ÚNICA para 2–4 opciones cortas
 * (S45-B4.1, espec aprobada founder+arquitecto; primer consumidor:
 * sexo en el onboarding dueño).
 *
 * ═══════════════════════════════════════════════════════════════════
 * QUÉ NO ES: no es multi-select, no porta estado de datos (eso es
 * Insignia, que además es JAMÁS interactiva), no reemplaza a
 * SelectorEspecie (fichas ricas con avatar). Presentacional puro:
 * la pantalla es dueña del valor.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Mismo tratamiento de selección que SelectorEspecie: seleccionado =
 * borde 1.5 en hex PURO de capa identidad (refuerzo gráfico; el canal
 * semántico AA es accessibilityState.checked + el tint) + fondo
 * capaBg.identidad. NO consume accent.active. Borde 1.5 constante:
 * el estado cambia color, jamás mueve el layout. Pressed 0.99
 * (receta SM de Boton/Tarjeta).
 *
 * Memorial degrada solo (Ley 8): sin tinte, selección con borde en
 * text.secondary.
 *
 * A11y: radiogroup con label visible; cada chip radio con checked y
 * anuncio "Etiqueta, opción N de M".
 */

import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import Animated, { cubicBezier } from 'react-native-reanimated'

import { typography } from '../tokens/typography'
import { spacing } from '../tokens/spacing'
import { radius } from '../tokens/radius'
import { motion } from '../tokens/motion'
import { useTheme } from '../ThemeProvider'

// Mismo grosor que SelectorEspecie/Campo/CitaEnVivo.
const BORDE = 1.5
const ALTO = 44 // target táctil directo

export interface SelectorOpcionItem {
  codigo: string
  /** VOZ HUMANA — ej: "No sé" (jamás el vocabulario interno del modelo). */
  etiqueta: string
  /** ENMIENDA S56 (Hoja del plan): opción visible pero NO elegible —
   *  la honestidad de cobertura ("Andrés no pasea los jueves") se dice
   *  MOSTRANDO el día apagado, jamás escondiéndolo. La VOZ del porqué
   *  es de la pantalla (una línea bajo el selector). */
  deshabilitada?: boolean
}

export interface SelectorOpcionProps {
  /** 2–4 opciones cortas en 'fila'; conjuntos más grandes van en 'tira' o 'grilla'. */
  opciones: SelectorOpcionItem[]
  seleccionada?: string
  onSelect: (codigo: string) => void
  /** Label visible del grupo Y accessibilityLabel del radiogroup. */
  etiqueta: string
  /** ENMIENDA S55-B4 (precedente Celda S44): 'fila' (default, 2–4 chips
   *  que llenan el ancho) · 'tira' (scroll horizontal — la tira de días
   *  del CUÁNDO) · 'grilla' (chips envueltos para conjuntos grandes —
   *  los inicios disponibles). Mismo tratamiento de selección en las
   *  tres; el radiogroup y el anuncio por chip no cambian. */
  disposicion?: 'fila' | 'tira' | 'grilla'
  /** ENMIENDA S56 (Hoja del plan, D-338): selección MÚLTIPLE — los 7
   *  chips L·M·X·J·V·S·D. Cambia la semántica a checkbox-group
   *  (accessibilityRole checkbox + checked por chip); `seleccionadas`
   *  manda y onSelect entrega el código TOCADO (la pantalla es dueña
   *  del set — presentacional puro intacto). Sin `multiple`, el
   *  contrato original de selección única no cambia en nada. */
  multiple?: boolean
  seleccionadas?: string[]
}

function Chip({
  opcion,
  indice,
  total,
  seleccionada,
  onSelect,
  crecer,
  modo,
}: {
  opcion: SelectorOpcionItem
  indice: number
  total: number
  seleccionada: boolean
  onSelect: (codigo: string) => void
  crecer: boolean
  modo: 'radio' | 'checkbox'
}) {
  const { theme } = useTheme()
  const [presionada, setPresionada] = useState(false)

  const deshabilitada = opcion.deshabilitada === true
  const fondoReposo = theme.mode === 'dark' ? theme.bg.elevated : theme.bg.card
  // Patrón `'capaBg' in theme` de AvatarMascota/SelectorEspecie (memorial no tinta).
  const conCapa = seleccionada && 'capaBg' in theme
  const fondo = conCapa ? theme.capaBg.identidad : fondoReposo
  const borde = conCapa
    ? theme.capa.identidad
    : seleccionada
      ? theme.text.secondary
      : theme.border.subtle

  return (
    <Pressable
      onPress={() => {
        if (!deshabilitada) onSelect(opcion.codigo)
      }}
      onPressIn={() => {
        if (!deshabilitada) setPresionada(true)
      }}
      onPressOut={() => setPresionada(false)}
      accessibilityRole={modo}
      accessibilityState={{ checked: seleccionada, disabled: deshabilitada }}
      accessibilityLabel={`${opcion.etiqueta}, opción ${indice + 1} de ${total}`}
      style={{ flexGrow: crecer ? 1 : 0 }}
    >
      <Animated.View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          height: ALTO,
          paddingHorizontal: spacing[4],
          borderRadius: radius.full,
          backgroundColor: fondo,
          borderWidth: BORDE,
          borderColor: borde,
          // misma receta que Boton/Tarjeta (SM: CSS transition + estado)
          transform: [{ scale: presionada ? 0.99 : 1 }],
          transitionProperty: 'transform',
          transitionDuration: motion.duration.fast,
          transitionTimingFunction: cubicBezier(...motion.easing.spring.bezier),
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            fontFamily: typography.family.sans.medium,
            fontSize: typography.size.sm,
            // apagada = voz terciaria; el estado NO mueve el layout
            color: deshabilitada ? theme.text.tertiary : theme.text.primary,
          }}
        >
          {opcion.etiqueta}
        </Text>
      </Animated.View>
    </Pressable>
  )
}

export function SelectorOpcion({
  opciones,
  seleccionada,
  onSelect,
  etiqueta,
  disposicion = 'fila',
  multiple = false,
  seleccionadas,
}: SelectorOpcionProps) {
  const { theme } = useTheme()

  const chips = opciones.map((opcion, i) => (
    <Chip
      key={opcion.codigo}
      opcion={opcion}
      indice={i}
      total={opciones.length}
      seleccionada={multiple ? (seleccionadas ?? []).includes(opcion.codigo) : opcion.codigo === seleccionada}
      onSelect={onSelect}
      crecer={disposicion === 'fila'}
      modo={multiple ? 'checkbox' : 'radio'}
    />
  ))

  return (
    <View accessibilityRole={multiple ? undefined : 'radiogroup'} accessibilityLabel={etiqueta}>
      <Text
        style={{
          fontFamily: typography.family.sans.medium,
          fontSize: typography.size.sm,
          color: theme.text.secondary,
          marginBottom: spacing[3],
        }}
      >
        {etiqueta}
      </Text>
      {disposicion === 'tira' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: spacing[2] }}>
          {chips}
        </ScrollView>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: disposicion === 'grilla' ? 'wrap' : 'nowrap', gap: spacing[2] }}>
          {chips}
        </View>
      )}
    </View>
  )
}
