/**
 * Campo — el input de texto del sistema (S43-B3.3).
 *
 * ═══════════════════════════════════════════════════════════════════
 * REGLA EMIL RECTORA: nada se anima mientras el usuario tipea —
 * jamás labels flotantes, jamás layout shift al enfocar o errar.
 *
 * ENMIENDA S83-B1 — LA PROTECCIÓN NO SE RETIRA, SUBE UN NIVEL.
 * El pie de altura reservada es el instrumento de esa promesa, y sigue
 * siendo el DEFAULT. Lo que la enmienda reconoce es que el pie pertenece
 * al CONTROL, y un control puede estar compuesto por más de una pieza: en
 * una fila (indicativo + número) el pie de UNO de los hijos corre al otro
 * hacia abajo por su alto exacto. Con `sinPie`, el hijo deja de reservarlo
 * y el pie lo monta el COMPUESTO, para los dos — misma promesa, un piso
 * más arriba. Sin ese pie del compuesto la promesa se pierde, y por eso
 * `sinPie` no viaja solo: viaja con `PieDeCampo` y con su guard (R29).
 * ═══════════════════════════════════════════════════════════════════
 *
 * Consecuencias de diseño:
 *   · Label SIEMPRE visible y ADENTRO de la caja (S99-B · N11 — antes
 *     iba arriba y afuera; nunca fue placeholder-como-label, y sigue sin
 *     serlo: el placeholder es solo formato, ej: "ej: Zeus").
 *   · Borde 1.5px SIEMPRE — el foco/error cambia COLOR, no grosor.
 *   · El slot de ayuda/error tiene altura reservada: el mensaje no
 *     empuja el layout al aparecer (error reemplaza a ayuda).
 *   · Única animación permitida: transición de color del borde
 *     (fast, receta SM). Nada más.
 *   · multilinea crece a alto FIJO (n líneas) — auto-grow mientras
 *     tipeás = layout shift = prohibido.
 */

import { useState, type ReactNode } from 'react'
import {
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native'
import Animated, { cubicBezier } from 'react-native-reanimated'

import { estiloDeCaja } from './caja-de-campo'
import { typography } from '../tokens/typography'
import { spacing } from '../tokens/spacing'
import { motion } from '../tokens/motion'
import { opacity } from '../tokens/opacity'
import { useTheme } from '../ThemeProvider'
import { useTraduccionUi } from '../i18n'

/** ⏪ S99-B · `BORDE` y el fondo salen ahora de `caja-de-campo.ts` — la
 *  anatomía vivía copiada en tres piezas (ver su cabecera). Acá quedan
 *  solo las medidas propias de ESTE campo. */
/** La línea de entrada: el alto del texto que se tipea. */
const ALTO_LINEA = Math.round(typography.size.base * typography.leading.normal)   // 24
/** El alto de la caja es DERIVADO, no elegido (N11 · la etiqueta entró
 *  adentro): aire + etiqueta + línea + aire = 6 + 16 + 24 + 6 + los dos
 *  bordes = **62**. Se calcula para que quien mueva la escala de N1 no
 *  tenga que acordarse de mover también este número. */
const ALTO_ETIQUETA = Math.round(typography.size.xs * typography.leading.normal)  // 16
const ALTO = Math.round(ALTO_LINEA + ALTO_ETIQUETA + spacing[1.5] * 2 + 1.5 * 2)  // 62
const LINEA_MENSAJE = typography.size.sm * typography.leading.normal  // slot reservado

/** El alto EXACTO que el pie reserva: 13 × 1.6 + 4 = **24.8 px**. Es el
 *  delta que un hermano alineado a `flex-end` recibe hacia abajo cuando su
 *  vecino es un `Campo` — medido, no estimado. Se exporta porque un
 *  compuesto puede necesitar el número, y derivarlo a mano en la pantalla
 *  es exactamente cómo se fabrican los márgenes a ojo.
 *  ⚠️ NO es constante universal: si el mensaje ENVUELVE a dos líneas, el
 *  pie crece y el delta con él. Por eso la cura correcta es `sinPie` (que
 *  lo elimina) y no "igualar el alto" en el consumidor — igualar acierta
 *  en reposo y falla justo cuando aparece el error. */
export const ALTO_PIE_CAMPO = LINEA_MENSAJE + spacing[1]

export interface PieDeCampoProps {
  /** Helper. `error` lo reemplaza en el MISMO slot. */
  ayuda?: string
  /** Mensaje de error (dangerText) — anunciado con liveRegion polite. */
  error?: string
}

/**
 * PieDeCampo — el pie de un control de formulario: altura RESERVADA y el
 * mensaje adentro. Vive acá (no en archivo propio) por el precedente de
 * `HojaScroll` dentro de `Hoja`: es la anatomía DE `Campo`, no una pieza
 * con vida propia.
 *
 * POR QUÉ EXISTE COMO PIEZA (S83-B1): esta anatomía estaba COPIADA byte
 * por byte en `Campo` y `CampoFecha` —comentario de D-605 incluido— y el
 * compuesto que necesita montarla iba a ser la tercera copia. Se ensancha,
 * no se copia (L-175). Precedente medido el mismo día: en B36 la expresión
 * del teclado vivía duplicada en dos archivos y curar uno dejaba el otro
 * roto; acá se cura de raíz antes de que pase.
 */
export function PieDeCampo({ ayuda, error }: PieDeCampoProps) {
  const { theme } = useTheme()
  const mensaje = error ?? ayuda

  return (
    // Slot de altura RESERVADA: error reemplaza a ayuda, nada empuja el layout
    <View style={{ minHeight: ALTO_PIE_CAMPO, justifyContent: 'flex-end' }}>
      {mensaje ? (
        <Text
          accessibilityLiveRegion={error ? 'polite' : 'none'}
          style={{
            fontFamily: typography.family.sans.regular,
            fontSize: typography.size.sm,
            lineHeight: LINEA_MENSAJE,
            // S83-B26 (D-605, salida ②): el helper migra de
            // `text.tertiary` a `text.secondary`. EL PORQUÉ, que es el
            // que decidió la ficha: la exención de `tertiary` se firmó
            // para un ROL —el tab inactivo, espec B3.7— y un helper NO
            // es placeholder ni está apagado: **es la instrucción de
            // cómo llenar el campo, el texto que uno lee justo cuando
            // no sabe qué poner**. Medido contra el theme resuelto, no
            // a mano: `tertiary` da 2.18 en LIGHT (el tema por defecto
            // del producto) contra un mínimo de 3:1 — dos de los tres
            // temas por debajo. `secondary` YA vive en el corpus del
            // gate (`verify-contrast.ts:97`) y pasa en los tres.
            // MÁXIMO ALCANCE POR SITIO: no es una pantalla — lo hereda
            // CADA `Campo` de la casa, en las dos apps.
            color: error ? theme.status.dangerText : theme.text.secondary,
            marginTop: spacing[1],
          }}
        >
          {mensaje}
        </Text>
      ) : null}
    </View>
  )
}

export interface CampoProps
  extends Omit<
    TextInputProps,
    | 'style'
    | 'placeholderTextColor'
    | 'secureTextEntry'
    | 'multiline'
    | 'numberOfLines'
    | 'editable'
    | 'accessibilityLabel'
    | 'accessibilityHint'
  > {
  /** Obligatorio: es el label visible Y el accessibilityLabel. */
  label: string
  /** Helper bajo el campo (`text.secondary` desde S83-B26 — ver la nota
   *  en su render). `error` lo reemplaza en el MISMO slot. */
  ayuda?: string
  /** Mensaje de error (dangerText) — anunciado con liveRegion polite. */
  error?: string
  deshabilitado?: boolean
  /** ☠️ S99-B — `sinCaja` MURIÓ, DEROGADA POR N11 y con su choque
   *  declarado en `caja-de-campo.ts`. Era `true` POR DEFAULT: borde
   *  transparente en reposo y el relleno como única señal —medido, el
   *  interior quedaba a **1.07:1** contra el fondo en claro—. N11 dice
   *  literal *«el relleno gris sólido muere… se contornea lo que se
   *  fija»*. **Costo de la derogación: CERO consumidores** (los
   *  `sinCaja` del árbol son todos de `Boton`, otra prop de otra pieza).
   *  Se deja escrito y no borrado: la próxima sesión que lea la firma de
   *  S81 tiene que encontrar acá por qué ya no rige. */
  /** S83-B1 — NO reserva el pie: lo monta el CONTROL COMPUESTO que lo
   *  contiene, con `PieDeCampo`, para todos sus hijos a la vez.
   *
   *  CUÁNDO: SOLO dentro de una fila donde este `Campo` tiene hermanos
   *  (indicativo + número). Fuera de esa fila, `sinPie` no arregla nada y
   *  rompe la promesa rectora: el mensaje empujaría el layout al aparecer.
   *
   *  ⚠️ EL MODO DE FALLA, dicho porque es silencioso: con `sinPie` este
   *  `Campo` sigue PINTANDO su borde de error —eso no se delega— pero deja
   *  de RENDERIZAR el texto. Si el compuesto no monta `PieDeCampo`, el
   *  usuario ve un borde rojo sin una palabra que explique por qué. Por eso
   *  `verify:diseno` R29 exige que las dos cosas vivan en el mismo archivo:
   *  una verificación cuyo modo de falla es el silencio no es una
   *  verificación (L-192). */
  sinPie?: boolean
  /** Password con toggle ver/ocultar integrado (ocupa el slot iconoDer). */
  secure?: boolean
  /** Líneas visibles — alto FIJO, no auto-grow. */
  multilinea?: number
  iconoIzq?: ReactNode
  iconoDer?: ReactNode
}

export function Campo({
  label,
  ayuda,
  error,
  deshabilitado = false,
  sinPie = false,
  secure = false,
  multilinea,
  iconoIzq,
  iconoDer,
  ...inputProps
}: CampoProps) {
  const { theme } = useTheme()
  const { t } = useTraduccionUi()
  const [enfocado, setEnfocado] = useState(false)
  const [oculto, setOculto] = useState(true)

  // El color del contorno y el interior salen de la anatomía compartida
  // (`caja-de-campo.ts`): tres piezas, una definición.
  const altoCampo = multilinea
    ? multilinea * ALTO_LINEA + ALTO_ETIQUETA + spacing[2] * 2 + 1.5 * 2
    : ALTO

  return (
    <View style={{ opacity: deshabilitado ? opacity.disabled : 1 }}>
      {/* ── S99-B · N11: LA ETIQUETA ENTRA A LA CAJA ──────────────────
          Estaba AFUERA, arriba. N11 la pide *«adentro de los límites de
          la caja»*, y no es capricho de estilo: una etiqueta afuera deja
          al campo vacío siendo un rectángulo sin identidad —hay que
          mirar arriba para saber qué es—, y adentro **el campo se
          explica solo**. La caja crece de 48 a 62 para alojarla; el alto
          es DERIVADO (etiqueta + línea de entrada + los dos aires), no
          un número elegido.
          ⚠️ El label NO se anima ni flota: la regla rectora de esta
          pieza sigue siendo que nada se mueve mientras alguien tipea. */}
      <Animated.View
        style={{
          ...estiloDeCaja(theme, { error: !!error, enfocado }),
          justifyContent: 'center',
          height: altoCampo,
          paddingHorizontal: spacing[3],
          paddingVertical: multilinea ? spacing[2] : spacing[1.5],
          transitionTimingFunction: cubicBezier(...motion.easing.easeOut.bezier),
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            fontFamily: typography.family.sans.medium,
            fontSize: typography.size.xs,
            color: theme.text.secondary,
          }}
        >
          {label}
        </Text>

        <View
          style={{
            flexDirection: 'row',
            alignItems: multilinea ? 'flex-start' : 'center',
            flex: multilinea ? 1 : undefined,
            gap: spacing[2],
          }}
        >
        {iconoIzq ? <View style={multilinea ? { paddingTop: spacing[1] } : null}>{iconoIzq}</View> : null}

        <TextInput
          {...inputProps}
          editable={!deshabilitado}
          secureTextEntry={secure && oculto}
          multiline={!!multilinea}
          numberOfLines={multilinea}
          placeholderTextColor={theme.text.tertiary}
          accessibilityLabel={label}
          accessibilityHint={ayuda}
          onFocus={(e) => {
            setEnfocado(true)
            inputProps.onFocus?.(e)
          }}
          onBlur={(e) => {
            setEnfocado(false)
            inputProps.onBlur?.(e)
          }}
          style={{
            flex: 1,
            fontFamily: typography.family.sans.regular,
            fontSize: typography.size.base,
            color: theme.text.primary,
            // N11: el alto del input lo da la LÍNEA, no la caja — la caja
            // ahora aloja también la etiqueta y su alto es del contenedor.
            height: multilinea ? '100%' : ALTO_LINEA,
            paddingVertical: 0,
            textAlignVertical: multilinea ? 'top' : 'center',
          }}
        />

        {secure ? (
          <Pressable
            onPress={() => setOculto((x) => !x)}
            accessibilityRole="button"
            accessibilityLabel={oculto ? t('campo.mostrarContrasena') : t('campo.ocultarContrasena')}
            hitSlop={8}
          >
            <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.sm, color: theme.text.secondary }}>
              {oculto ? t('campo.ver') : t('campo.ocultar')}
            </Text>
          </Pressable>
        ) : iconoDer ? (
          <View style={multilinea ? { paddingTop: spacing[1] } : null}>{iconoDer}</View>
        ) : null}
        </View>
      </Animated.View>

      {sinPie ? null : <PieDeCampo ayuda={ayuda} error={error} />}
    </View>
  )
}
