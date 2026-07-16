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

import { useEffect, useState, type ReactNode } from 'react'
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View, type ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'

import { usePresionado } from './usePresionado'

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
  /** ENMIENDA S61-A4 (el para-quién con cara, pedido founder): nodo
   *  CHICO a la izquierda del label — el caller lo compone (el paso 0
   *  de la reserva pasa AvatarMascota xs; el componente no conoce
   *  mascotas). NO cambia la mecánica de selección ni el tratamiento
   *  tonal; sin adorno, el chip queda IDÉNTICO al de siempre. */
  adorno?: ReactNode
  /** ENMIENDA S62 (decisión founder — server-toggles del grooming): el
   *  chip INDIVIDUAL en carga. Receta de espera de Boton (Ley 13):
   *  spinner recién pasados 150ms, el label queda montado invisible —
   *  cero layout shift. El chip en carga NO responde a re-toques
   *  (anti doble-disparo); el RESTO del selector sigue interactivo.
   *  La pantalla es dueña del roundtrip (presentacional puro intacto). */
  cargando?: boolean
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
  /** ENMIENDA S58 (firma founder — acento del cliente): el color de la
   *  selección. 'control' = cliente (accent.control: magentaDark claro /
   *  violetText dark / tinta memorial) · 'oficio' = prestador (tealDark,
   *  §15b) · 'capa' (default, verdeVital) MUERE como color de control —
   *  las pantallas construidas migran AL PASO de la pasada, no como
   *  tanda; el default se retira cuando la última migre. */
  acento?: 'capa' | 'control' | 'oficio'
  /** ENMIENDA S65 (acordeón de la bitácora): cuando una fila header ya
   *  rotula el grupo (nombre + contador tocables), el label visible se
   *  apaga para no duplicar — el accessibilityLabel del grupo QUEDA
   *  (a11y intacta). Default true: nada existente cambia. */
  etiquetaVisible?: boolean
}

function Chip({
  opcion,
  indice,
  total,
  seleccionada,
  onSelect,
  crecer,
  modo,
  acento,
}: {
  opcion: SelectorOpcionItem
  indice: number
  total: number
  seleccionada: boolean
  onSelect: (codigo: string) => void
  crecer: boolean
  modo: 'radio' | 'checkbox'
  acento: 'capa' | 'control' | 'oficio'
}) {
  const { theme } = useTheme()
  // S63 (D-401): el clon muere — la física vive en LA primitiva
  const { handlers, estiloPresionado } = usePresionado(0.99)
  // S61-A5 cura 2: el anillo AZUL de la captura del founder era el
  // focus-visible DEFAULT de Chrome (rgb(0,95,204), solo web — no
  // viaja a dispositivo). Espejo del patrón de Boton: focus propio en
  // el acento de la casa (a11y intacta, el UA default muere).
  const [enfocada, setEnfocada] = useState(false)

  const deshabilitada = opcion.deshabilitada === true
  const cargando = opcion.cargando === true
  // S62: regla emil calcada de Boton — el spinner recién pasados 150ms
  // (roundtrips rápidos jamás parpadean).
  const [mostrarSpinner, setMostrarSpinner] = useState(false)
  useEffect(() => {
    if (!cargando) {
      setMostrarSpinner(false)
      return
    }
    const timer = setTimeout(() => setMostrarSpinner(true), motion.duration.fast)
    return () => clearTimeout(timer)
  }, [cargando])
  const fondoReposo = theme.mode === 'dark' ? theme.bg.elevated : theme.bg.card
  // Patrón `'capaBg' in theme` de AvatarMascota/SelectorEspecie (memorial no tinta).
  const conCapa = seleccionada && 'capaBg' in theme
  // LEY 22 (S58): la selección entre pares es TONAL — borde en el
  // acento + tinte claro + TEXTO en el acento (capturado acá: el
  // narrowing de `in` no sobrevive closures). Memorial degrada igual.
  const textoTonal =
    'capaText' in theme
      ? acento === 'control' && 'control' in theme.accent
        ? theme.accent.control
        : acento === 'oficio'
          ? theme.accent.primary
          : theme.capaText.identidad
      : theme.text.primary
  // S58 (firma founder): el ACENTO de la selección — 'control' (cliente:
  // accent.control, tint de la capa marca/afecto) · 'oficio' (prestador:
  // accent.primary/tealDark, §15b) · 'capa' (verdeVital — MUERE como
  // color de control; las pantallas migran AL PASO de la pasada).
  // Memorial degrada igual en los tres: sin tinte, borde text.secondary.
  const fondo = !conCapa
    ? fondoReposo
    : acento === 'control'
      ? theme.capaBg.comunidad
      : acento === 'oficio'
        ? theme.accent.primaryBg
        : theme.capaBg.identidad
  const borde = conCapa
    ? acento === 'control' && 'control' in theme.accent
      ? theme.accent.control
      : acento === 'oficio'
        ? theme.accent.primary
        : theme.capa.identidad
    : seleccionada
      ? theme.text.secondary
      : theme.border.subtle

  return (
    <Pressable
      onPress={() => {
        // S62: el chip en carga no responde — anti doble-disparo
        if (!deshabilitada && !cargando) onSelect(opcion.codigo)
      }}
      onPressIn={() => {
        if (!deshabilitada && !cargando) handlers.onPressIn()
      }}
      onPressOut={handlers.onPressOut}
      onFocus={() => setEnfocada(true)}
      onBlur={() => setEnfocada(false)}
      accessibilityRole={modo}
      accessibilityState={{ checked: seleccionada, disabled: deshabilitada, busy: cargando }}
      accessibilityLabel={`${opcion.etiqueta}, opción ${indice + 1} de ${total}`}
      style={[
        { flexGrow: crecer ? 1 : 0 },
        // Focus visible en web, en la voz de la casa (patrón Boton):
        // reemplaza el anillo azul del UA. `outlineStyle:none` en
        // reposo mata el default; enfocada = outline en el acento.
        Platform.OS === 'web'
          ? ({
              outlineWidth: enfocada ? 2 : 0,
              outlineColor: enfocada
                ? acento === 'control' && 'control' in theme.accent
                  ? theme.accent.control
                  : theme.accent.primary
                : 'transparent',
              outlineStyle: enfocada ? 'solid' : 'none',
              outlineOffset: 2,
            } as unknown as ViewStyle)
          : null,
      ]}
    >
      <Animated.View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing[2],
          height: ALTO,
          paddingHorizontal: spacing[4],
          // LEY DE GEOMETRÍA (S58): lo que se ELIGE es rectángulo suave —
          // la píldora quedó para lo que INFORMA (Insignia intacta)
          borderRadius: radius.suave,
          backgroundColor: fondo,
          borderWidth: BORDE,
          borderColor: borde,
          // misma receta que Boton/Tarjeta — LA primitiva (S63)
          ...estiloPresionado,
        }}
      >
        {/* S62 (receta Boton): en carga, adorno y label quedan MONTADOS
            invisibles — preservan el ancho exacto, cero layout shift. */}
        {opcion.adorno ? (
          <View style={mostrarSpinner ? { opacity: 0 } : null}>{opcion.adorno}</View>
        ) : null}
        <Text
          numberOfLines={1}
          style={{
            fontFamily: typography.family.sans.medium,
            fontSize: typography.size.sm,
            // apagada = voz terciaria; el estado NO mueve el layout.
            // Ley 22: seleccionada = texto EN el acento (tonal)
            color: deshabilitada ? theme.text.tertiary : conCapa ? textoTonal : theme.text.primary,
            opacity: mostrarSpinner ? 0 : 1,
          }}
        >
          {opcion.etiqueta}
        </Text>
        {mostrarSpinner ? (
          <View style={{ position: 'absolute', alignSelf: 'center', left: 0, right: 0, alignItems: 'center' }}>
            <ActivityIndicator
              size="small"
              color={conCapa ? textoTonal : theme.text.secondary}
            />
          </View>
        ) : null}
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
  acento = 'capa',
  etiquetaVisible = true,
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
      acento={acento}
    />
  ))

  return (
    <View accessibilityRole={multiple ? undefined : 'radiogroup'} accessibilityLabel={etiqueta}>
      {etiquetaVisible ? (
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
      ) : null}
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
