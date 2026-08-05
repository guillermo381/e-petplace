/**
 * CampoCodigo — las cajas por dígito del código de recuperación
 * (S88-B, lámina firmada por el founder).
 *
 * ═══════════════════════════════════════════════════════════════════
 * LA DECISIÓN ESTRUCTURAL, que es lo que la pieza existe para cerrar:
 * **UN solo `TextInput` invisible maneja el foco, el teclado y el
 * pegado; las cajas son PRESENTACIÓN.** N inputs con foco entre ellos
 * es el camino que parece obvio y es el malo: gestionar el salto, el
 * borrado hacia atrás y el pegado entre N piezas re-implementa a mano
 * lo que un input ya sabe hacer. Acá el valor vive en un lugar, el
 * pegado del código entero funciona gratis, y el lector de pantalla ve
 * UN campo — no ocho.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Consecuencias de diseño (todas de la casa, ninguna nueva):
 *   · `largo` es prop OBLIGATORIA sin default (corolario 19.9: la prop
 *     de identidad se declara — el código real tiene 8, pero la pieza
 *     que hardcodea un largo obliga al próximo consumidor a clonarla).
 *   · Label SIEMPRE visible arriba (anatomía de `Campo`, byte a byte).
 *   · El pie es `PieDeCampo` — el patrón S83-B1 exacto: el control
 *     COMPUESTO monta el pie para todas sus piezas; altura reservada,
 *     el error no empuja el layout.
 *   · Caja blanca (`bg.card` / dark `bg.elevated`) con borde 1.5 de la
 *     casa — la lámina pide caja, así que `sinCaja` de Campo NO aplica
 *     acá: es otra anatomía, firmada aparte.
 *   · La caja ACTIVA (la del próximo dígito) marca con `accent.active`
 *     — el campo enfocado ES el elemento activo de la vista (Ley 5,
 *     mismo criterio que Campo). El error pinta TODAS las cajas con
 *     `status.danger` y gana sobre el foco — sin gritar: el mensaje va
 *     en el pie, la caja solo cambia de color.
 *   · Dígito en `tabular-nums` (precedente Cronometro/SelectorDia).
 *     El traje es MONO: un código de recuperación es dato de máquina
 *     puro — nadie lo eligió, nadie lo pronuncia (Ley 3; Cronometro es
 *     el precedente exacto: valor de máquina a escala display).
 *   · Única animación: el color del borde (fast, receta de Campo).
 *     Nada se anima al tipear. Memorial no necesita degradación: no
 *     hay celebración que apagar.
 *   · `allowFontScaling` queda ENCENDIDO — la accesibilidad no
 *     retrocede por retícula (posición de mesa S87, relevamiento de
 *     preferencias). Un dígito a ×1.3 sigue entrando en la caja de 48.
 *
 * Autofill: `textContentType="oneTimeCode"` + `autoComplete="sms-otp"`
 * — si el SO ofrece el código recibido, el campo lo acepta como un
 * pegado más. El valor se SANEA siempre (solo dígitos, cortado a
 * `largo`): pegar "código: 1234-5678" deposita 12345678.
 *
 * Lo que NO es: no valida contra el server (el canje es del wrapper),
 * no sabe cuándo el código está completo (la pantalla mira
 * `valor.length === largo` — dueña del flujo, como en todo Campo).
 */

import { useRef, useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import Animated, { cubicBezier } from 'react-native-reanimated'

import { typography } from '../tokens/typography'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { motion } from '../tokens/motion'
import { opacity } from '../tokens/opacity'
import { useTheme } from '../ThemeProvider'
import { PieDeCampo } from './Campo'

const BORDE = 1.5
const ALTO_CAJA = 48 // md — target táctil, mismo alto que Campo

export interface CampoCodigoProps {
  /** Cuántos dígitos. OBLIGATORIA sin default — la pieza no sabe cuánto
   *  mide un código; lo declara cada consumidor (el de recuperación: 8). */
  largo: number
  /** El código tal como va (solo dígitos, ya saneado por la pieza). */
  valor: string
  /** Recibe el valor SANEADO: solo dígitos, cortado a `largo`. */
  onCambio: (valor: string) => void
  /** Obligatorio: label visible Y accessibilityLabel del campo ÚNICO. */
  etiqueta: string
  /** Helper bajo el campo. `error` lo reemplaza en el MISMO slot. */
  ayuda?: string
  /** Mensaje de error (dangerText en el pie; borde danger en las cajas,
   *  sin gritar) — anunciado con liveRegion polite vía PieDeCampo. */
  error?: string
  deshabilitado?: boolean
}

export function CampoCodigo({
  largo,
  valor,
  onCambio,
  etiqueta,
  ayuda,
  error,
  deshabilitado = false,
}: CampoCodigoProps) {
  const { theme } = useTheme()
  const inputRef = useRef<TextInput>(null)
  const [enfocado, setEnfocado] = useState(false)

  const accentActive = 'active' in theme.accent ? theme.accent.active : theme.accent.primary

  // La caja ACTIVA es la del próximo dígito a tipear; con el código
  // completo, la última (el cursor no puede pasar del final).
  const indiceActivo = Math.min(valor.length, largo - 1)

  const alTipear = (crudo: string) => {
    // Sanear SIEMPRE: solo dígitos, cortado a largo. Cubre tipeo, pegado
    // ("código: 1234-5678" → "12345678") y autofill por igual.
    onCambio(crudo.replace(/\D/g, '').slice(0, largo))
  }

  const bordeDe = (i: number): string => {
    if (error) return theme.status.danger // error gana — todas las cajas
    if (enfocado && i === indiceActivo) return accentActive
    return theme.border.default
  }

  return (
    <View style={{ opacity: deshabilitado ? opacity.disabled : 1 }}>
      {/* Label — anatomía de Campo, byte a byte */}
      <Text
        style={{
          fontFamily: typography.family.sans.medium,
          fontSize: typography.size.sm,
          color: theme.text.secondary,
          marginBottom: spacing[1.5],
        }}
      >
        {etiqueta}
      </Text>

      {/* La fila de cajas + el input invisible ENCIMA. El input cubre la
          fila entera: el tap enfoca donde sea que caiga (no hay "caja
          equivocada" que tocar), y el long-press ofrece Pegar del SO. */}
      <Pressable onPress={() => inputRef.current?.focus()} disabled={deshabilitado}>
        {/* El lector de pantalla ve UN campo (el TextInput de abajo); las
            cajas son presentación y se esconden del árbol de accesibilidad.
            ⚠️ El ocultamiento va EN ESTA FILA, no en el Pressable padre: la
            primera versión lo puso arriba y escondió también al input — el
            «un solo campo» quedó en CERO campos. Lo cazó el smoke (el
            getByLabel no encontraba nada), no el ojo. */}
        <View
          style={{ flexDirection: 'row', gap: spacing[1.5] }}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          {Array.from({ length: largo }, (_, i) => (
            <Animated.View
              key={i}
              style={{
                flex: 1,
                height: ALTO_CAJA,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: radius.md,
                borderWidth: BORDE, // SIEMPRE 1.5 — el estado cambia color, no grosor
                borderColor: bordeDe(i),
                backgroundColor: theme.mode === 'light' ? theme.bg.card : theme.bg.elevated,
                // única animación permitida: color del borde (receta Campo)
                transitionProperty: 'borderColor',
                transitionDuration: motion.duration.fast,
                transitionTimingFunction: cubicBezier(...motion.easing.easeOut.bezier),
              }}
            >
              <Text
                style={{
                  fontFamily: typography.family.mono.medium,
                  fontSize: typography.size.md,
                  fontVariant: ['tabular-nums'],
                  color: theme.text.primary,
                }}
              >
                {valor[i] ?? ''}
              </Text>
            </Animated.View>
          ))}
        </View>

        <TextInput
          ref={inputRef}
          value={valor}
          onChangeText={alTipear}
          onFocus={() => setEnfocado(true)}
          onBlur={() => setEnfocado(false)}
          editable={!deshabilitado}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          // ⚠️ SIN maxLength, y es deliberado — lo cazó el smoke: maxLength
          // trunca el texto CRUDO antes de sanear, así que pegar
          // «código: 8765-4321-99» dejaba "código: " (8 chars, cero
          // dígitos) y el campo quedaba VACÍO. El tope del contrato es
          // sobre lo SANEADO y ya vive en el slice de alTipear.
          caretHidden
          accessibilityLabel={etiqueta}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: ALTO_CAJA,
            opacity: 0, // invisible pero tocable: recibe tap, foco y Pegar
            fontSize: typography.size.md, // iOS: un input de fontSize chico hace zoom raro al enfocar en web
          }}
        />
      </Pressable>

      <PieDeCampo ayuda={ayuda} error={error} />
    </View>
  )
}
