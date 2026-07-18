/**
 * SliderPrecio — selector de PASOS DISCRETOS para precio (S58, Ley 11;
 * componente 31 — pedido de depósito, la B lo consume en "el arte del
 * paseo"). La pantalla es dueña del valor: acá vive el riel, los pasos
 * y la física del thumb.
 *
 * ═══════════════════════════════════════════════════════════════════
 * QUÉ NO ES: no es un slider continuo (los pasos son DISCRETOS — el
 * precio del oficio se elige entre valores reales, jamás interpolado),
 * no valida rangos (el server es el juez). Presentacional puro.
 *
 * ENMIENDA S68-B7 (firma founder del gate, hallazgo Bloque I): el
 * componente GANA el display del valor con TAP → edición numérica con
 * teclado (prop `edicionNumerica`, default true). La entrada se clampa
 * al riel y se REDONDEA al paso más cercano al confirmar — jamás un
 * valor ilegal. Es la excepción FIRMADA a la regla del teclado §15b
 * ("lo que se ajusta no se digita"): el pulgar elige, el teclado afina.
 * Los valores numéricos se derivan de las etiquetas de `pasos` (todas
 * los consumidores hablan "$X.XX"); si alguna etiqueta no parsea, la
 * edición se apaga sola y el valor queda como display (jamás roto).
 * Los displays de valor DUPLICADOS de las pantallas murieron con esta
 * enmienda (Chanel) — el valor vive acá, UNA vez.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Anatomía: riel hundido (bg.overlay) con puntos por paso + tramo
 * recorrido en el ACENTO POR REGISTRO (patrón Icono §2.7: 'capa' hex
 * puro dueño · 'aa' funcional · 'tinta' cuando la vista ya porta su
 * acento) + THUMB apoyado (bg.card + elevacion.reposo — regla Chanel:
 * sombra, jamás borde). El thumb se desliza y la sombra viaja con él
 * (Ley 6); memorial: reemplazo directo y acento degradado adentro.
 *
 * `onStep`: hook de CADA cruce de paso — v1 VACÍO en los consumidores
 * (la háptica futura entra sin refactor; SIN expo-haptics en v1,
 * sujeto a decisión founder — L-134: cero deps nativas nuevas).
 *
 * A11y: adjustable con increment/decrement y accessibilityValue con la
 * etiqueta del paso — el gesto y el lector cuentan la misma historia.
 *
 * Escalera §4b: no muestra datos del expediente — control puro,
 * peldaños no aplican (declarado explícito).
 */

import { useMemo, useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { cubicBezier } from 'react-native-reanimated'
import { palette } from '../tokens/palette'
import { radius } from '../tokens/radius'
import { motion } from '../tokens/motion'
import { typography } from '../tokens/typography'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { useTraduccionUi } from '../i18n'
import type { IconoRegistro } from './Icono'

const ALTO_RIEL = 4
const THUMB = 28      // target táctil real: el detector cubre alto 44
const PUNTO = 6

export interface SliderPrecioProps {
  /** Los pasos DISCRETOS ya formateados en voz de la pantalla
   *  (ej. "$5.00" · "$7.50" · "$10.00"). Mínimo 2. */
  pasos: string[]
  /** Índice del paso elegido. La pantalla es dueña del valor. */
  indice: number
  onCambio: (indice: number) => void
  /** Se dispara en CADA cruce de paso durante el arrastre — hook de la
   *  háptica futura. v1: dejarlo vacío. */
  onStep?: (indice: number) => void
  /** accessibilityLabel del control (el label visible es de la pantalla). */
  etiqueta: string
  /** Acento del tramo recorrido (§2.7): 'capa' (default dueño) ·
   *  'aa' · 'tinta' (la vista ya porta su acento) · 'control' (S58,
   *  acento de controles del cliente — accent.control). */
  registro?: IconoRegistro | 'control'
  /** S68-B7 (firma founder): el valor mono integrado con TAP → edición
   *  numérica clampeada al riel y redondeada al paso. Default true;
   *  false = sin display de valor (la pantalla porta el suyo). */
  edicionNumerica?: boolean
}

// los valores numéricos derivados de las etiquetas ("$25.00" → 25) —
// si alguna no parsea, la edición se apaga sola (jamás valor ilegal)
function numeroDeEtiqueta(etiqueta: string): number {
  return Number.parseFloat(etiqueta.replace(/[^0-9.,-]/g, '').replace(',', '.'))
}

export function SliderPrecio({
  pasos,
  indice,
  onCambio,
  onStep,
  etiqueta,
  registro = 'capa',
  edicionNumerica = true,
}: SliderPrecioProps) {
  const { theme } = useTheme()
  const { t } = useTraduccionUi()
  const [ancho, setAncho] = useState(0)
  // S68-B7: la edición numérica — estado interno; la pantalla sigue
  // siendo dueña del VALOR (solo recibe onCambio con un índice legal)
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState('')

  if (__DEV__ && pasos.length < 2) {
    console.warn(`SliderPrecio: ${pasos.length} paso(s) — un slider de menos de 2 pasos no es un slider.`)
  }

  const n = Math.max(pasos.length, 2)
  const idx = Math.min(Math.max(indice, 0), n - 1)
  const esMemorial = theme.mode === 'memorial'

  // Acento por registro — memorial degrada adentro (patrón Icono §2.8).
  // Capturado ANTES del branch: el narrowing de `in` no sobrevive closures.
  const capaAA = 'capaText' in theme ? theme.capaText.cuidado : theme.capa.cuidado
  const acento = esMemorial
    ? theme.text.secondary
    : registro === 'control'
      ? theme.accent.control
      : registro === 'tinta'
        ? theme.text.primary
        : registro === 'aa'
          ? capaAA
          : theme.capa.cuidado

  const util = Math.max(ancho - THUMB, 0)
  const paso = n > 1 ? util / (n - 1) : 0
  const x = idx * paso

  const irA = (i: number) => {
    const destino = Math.min(Math.max(i, 0), n - 1)
    if (destino !== idx) {
      onCambio(destino)
      onStep?.(destino)
    }
  }

  // Índice desde la posición del toque (centro del thumb = x - THUMB/2)
  const indiceDesdeX = (px: number) => (paso > 0 ? Math.round((px - THUMB / 2) / paso) : 0)

  // CURA S58 (bug de gate del founder: arrastrar el slider CRASHEABA la
  // app en nativo y Expo recargaba): los callbacks del Pan se workletizan
  // y corrían en el hilo UI llamando indiceDesdeX — función JS común =
  // fatal ("synchronously call a non-worklet function"); la web corre los
  // gestos en JS y jamás lo delató (Ley 9). runOnJS(true) es el contrato
  // honesto del componente: el thumb se mueve por ESTADO (indice→render),
  // no hay animación de UI-thread que justifique worklets.
  const pan = Gesture.Pan()
    .minDistance(0)
    .runOnJS(true)
    .onBegin((e) => {
      irA(indiceDesdeX(e.x))
    })
    .onUpdate((e) => {
      irA(indiceDesdeX(e.x))
    })

  // S68-B7: los números del riel — memoizados de las etiquetas; NaN en
  // cualquiera apaga la edición (degradación honesta, jamás rota)
  const numeros = useMemo(() => pasos.map(numeroDeEtiqueta), [pasos])
  const editable = edicionNumerica && numeros.every((v) => Number.isFinite(v))

  const confirmarEdicion = () => {
    setEditando(false)
    const v = Number.parseFloat(texto.replace(',', '.'))
    if (!Number.isFinite(v)) return // entrada vacía/ilegal = se cancela sereno
    // clamp al riel + redondeo al paso MÁS CERCANO — jamás valor ilegal
    let mejor = 0
    for (let i = 1; i < numeros.length; i++) {
      if (Math.abs(numeros[i] - v) < Math.abs(numeros[mejor] - v)) mejor = i
    }
    irA(mejor)
  }

  const filaValor = edicionNumerica ? (
    <View style={{ alignItems: 'flex-end', marginBottom: spacing[1] }}>
      {editando ? (
        <TextInput
          value={texto}
          onChangeText={setTexto}
          keyboardType="decimal-pad"
          autoFocus
          selectTextOnFocus
          onBlur={confirmarEdicion}
          onSubmitEditing={confirmarEdicion}
          accessibilityLabel={etiqueta}
          style={{
            fontFamily: typography.family.mono.regular,
            fontSize: typography.size.lg,
            fontVariant: ['tabular-nums'],
            color: theme.text.primary,
            borderBottomWidth: 1.5,
            borderBottomColor: acento,
            paddingVertical: 2,
            minWidth: 72,
            textAlign: 'right',
          }}
        />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={etiqueta}
          accessibilityHint={editable ? t('sliderPrecio.editarHint') : undefined}
          disabled={!editable}
          onPress={() => {
            setTexto(Number.isFinite(numeros[idx]) ? String(numeros[idx]) : '')
            setEditando(true)
          }}
          style={{ paddingVertical: 2, alignItems: 'flex-end' }}
        >
          {/* S68-B9 (hallazgo founder sobre B7): la affordance VISIBLE —
              subrayado punteado del valor + el hint en secundaria, no
              solo accesible. Sin glifo nuevo. */}
          <View
            style={
              editable
                ? {
                    borderBottomWidth: 1.5,
                    borderStyle: 'dotted',
                    borderBottomColor: theme.text.secondary,
                    paddingBottom: 1,
                  }
                : null
            }
          >
            <Text
              style={{
                fontFamily: typography.family.mono.regular,
                fontSize: typography.size.lg,
                fontVariant: ['tabular-nums'],
                color: theme.text.primary,
              }}
            >
              {pasos[idx] ?? ''}
            </Text>
          </View>
          {editable && (
            <Text
              style={{
                fontFamily: typography.family.sans.regular,
                fontSize: typography.size.xs,
                color: theme.text.secondary,
                marginTop: 2,
              }}
            >
              {t('sliderPrecio.editarHint')}
            </Text>
          )}
        </Pressable>
      )}
    </View>
  ) : null

  return (
    <View>
      {filaValor}
      <GestureDetector gesture={pan}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={etiqueta}
        accessibilityValue={{ min: 0, max: n - 1, now: idx, text: pasos[idx] ?? '' }}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'increment') irA(idx + 1)
          if (e.nativeEvent.actionName === 'decrement') irA(idx - 1)
        }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
        style={{ height: 44, justifyContent: 'center' }}
      >
        {/* riel hundido con el tramo recorrido en el acento */}
        <View style={{ height: ALTO_RIEL, borderRadius: radius.full, backgroundColor: theme.bg.overlay, marginHorizontal: THUMB / 2 }}>
          <View style={{ height: ALTO_RIEL, borderRadius: radius.full, backgroundColor: acento, width: paso > 0 ? x : 0 }} />
          {/* puntos de paso — el control DICE que es discreto */}
          {pasos.map((_, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: i * paso - PUNTO / 2,
                top: (ALTO_RIEL - PUNTO) / 2,
                width: PUNTO,
                height: PUNTO,
                borderRadius: radius.full,
                backgroundColor: i <= idx ? acento : theme.bg.border,
              }}
            />
          ))}
        </View>

        {/* thumb apoyado — elevacion.reposo, sin borde (Chanel); se
            desliza la superficie y la sombra viaja (Ley 6); memorial:
            reemplazo directo */}
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              left: 0,
              width: THUMB,
              height: THUMB,
              borderRadius: radius.full,
              // Ley 22 (SÓLIDO): el thumb es blanco/papel, constante
              backgroundColor: palette.white,
              boxShadow: theme.elevacion.reposo,
              transform: [{ translateX: x }],
            },
            esMemorial
              ? null
              : {
                  transitionProperty: 'transform',
                  transitionDuration: motion.duration.fast,
                  transitionTimingFunction: cubicBezier(...motion.easing.easeOut.bezier),
                },
          ]}
        />
        </View>
      </GestureDetector>
    </View>
  )
}
