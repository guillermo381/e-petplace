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
 *   · Label SIEMPRE visible, **AFUERA Y ARRIBA de la caja** (S100-B ·
 *     **N11′**, firma del founder 17-ago — ⏪ S99-B lo había metido
 *     adentro por N11; la ley se reabrió con evidencia y volvió afuera.
 *     El porqué entero vive en `caja-de-campo.ts`). **Nunca fue
 *     placeholder-como-label y sigue sin serlo** — al contrario: N11′ le
 *     da al placeholder su trabajo propio, que es **enseñar el FORMATO**
 *     (bajo «Teléfono de contacto» va «+593 99 123 4567», no «Teléfono»).
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

import {
  estiloDeCaja,
  ALTO_CAJA_CAMPO,
  ALTO_LINEA_CAMPO,
  GAP_ETIQUETA,
  TAMANO_ETIQUETA,
} from './caja-de-campo'
import { typography } from '../tokens/typography'
import { spacing } from '../tokens/spacing'
import { motion } from '../tokens/motion'
import { opacity } from '../tokens/opacity'
import { useTheme } from '../ThemeProvider'
import { useTraduccionUi } from '../i18n'

/** ⏪ S99-B · `BORDE` y el fondo salen ahora de `caja-de-campo.ts` — la
 *  anatomía vivía copiada en tres piezas (ver su cabecera). Acá quedan
 *  solo las medidas propias de ESTE campo. */
/** ⏪ S100-B · **N11′** — el alto de la caja y la línea de entrada salen
 *  ahora de `caja-de-campo.ts`, igual que el borde y el fondo: **con la
 *  etiqueta afuera, las tres piezas vuelven a tener la MISMA caja**, y
 *  dejar el número acá sería la cuarta copia que ese archivo existe para
 *  evitar. La caja pasa de **62 a 48** (ya no aloja la etiqueta). */
const ALTO_LINEA = ALTO_LINEA_CAMPO  // 24
const ALTO = ALTO_CAJA_CAMPO         // 48
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

export interface EtiquetaDeCampoProps {
  /** El nombre del campo. Visible SIEMPRE (salvo la exención de N11′). */
  children: string
}

/**
 * EtiquetaDeCampo — el rótulo de un control de formulario: **afuera,
 * arriba, siempre visible y siempre del mismo tamaño** (N11′).
 *
 * **Vive acá y no en cada pieza por la misma razón que `PieDeCampo`**: es
 * la anatomía DE un campo, y son piezas simétricas — *el pie va abajo, la
 * etiqueta va arriba, y las dos las montan las tres piezas de campo.*
 * Escrita una vez, `Campo`, `CampoFecha` y `CampoCodigo` no pueden
 * divergir. **Y esta vez el riesgo de divergir era real, no teórico: las
 * tres tenían la etiqueta escrita distinta hasta hoy** — dos adentro a
 * `xs`, una afuera a `sm`.
 *
 * ⚠️ **Lo que esta pieza NO hace, y es deliberado: no cambia con el
 * estado.** No recibe `error` ni `enfocado`. *Si los recibiera, alguien
 * los usaría* — y N11′ dice literal que la etiqueta **jamás cambia de
 * tamaño ni de color** por foco o por contenido. **La forma más barata de
 * garantizar que un dato no se use es no pasarlo.**
 */
export function EtiquetaDeCampo({ children }: EtiquetaDeCampoProps) {
  const { theme } = useTheme()

  return (
    <Text
      numberOfLines={1}
      style={{
        fontFamily: typography.family.sans.medium,
        fontSize: TAMANO_ETIQUETA,
        lineHeight: Math.round(TAMANO_ETIQUETA * typography.leading.normal),
        color: theme.text.secondary,
        marginBottom: GAP_ETIQUETA,
      }}
    >
      {children}
    </Text>
  )
}

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
  /** **N11′ · LA EXENCIÓN DE BÚSQUEDA, y la única.** El campo de búsqueda
   *  no lleva etiqueta: **lupa + placeholder** es el patrón universal, y
   *  *«poner "Buscar" arriba de una lupa es decir dos veces lo mismo»*.
   *
   *  🔴 **`label` SIGUE SIENDO OBLIGATORIO — lo que se apaga es el PÍXEL,
   *  jamás el nombre.** El `accessibilityLabel` se monta igual, así que
   *  quien navega con lector de pantalla oye «Buscar» exactamente como
   *  antes. *Una prop que apagara el label de verdad convertiría la
   *  exención visual de N11′ en un agujero de accesibilidad, y N11′ no
   *  pidió eso.*
   *
   *  **Opt-in, y por eso el default es `true`:** el caso raro se declara;
   *  el caso normal no se puede olvidar. Precedente de la casa:
   *  `SelectorOpcion.etiquetaVisible` (S65).
   *
   *  ⚠️ **CUÁNDO:** solo en búsqueda. Usarlo para «ganar altura» en un
   *  formulario es exactamente lo que la firma prohíbe — *el costo de
   *  altura de N11′ se compensa con **menos campos por pantalla**, jamás
   *  escondiendo rótulos.* */
  etiquetaVisible?: boolean
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
  etiquetaVisible = true,
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
    ? multilinea * ALTO_LINEA + spacing[3] * 2
    : ALTO

  return (
    <View style={{ opacity: deshabilitado ? opacity.disabled : 1 }}>
      {/* ── S100-B · N11′: LA ETIQUETA SALE DE LA CAJA ────────────────
          ⏪ S99-B la había metido adentro (N11). **La ley se reabrió con
          evidencia y volvió AFUERA Y ARRIBA**: adentro tiene que
          encogerse para dejar entrar el valor, y pierde legibilidad
          justo cuando el campo está lleno — que es cuando la persona
          revisa antes de pagar. La caja vuelve de 62 a **48**, derivada.
          El razonamiento entero vive en `caja-de-campo.ts`.
          ⚠️ El label NO se anima ni flota: la regla rectora de esta
          pieza sigue siendo que nada se mueve mientras alguien tipea —
          y ahora es más fácil de cumplir, porque la etiqueta ya no
          comparte caja con el valor. */}
      {etiquetaVisible ? <EtiquetaDeCampo>{label}</EtiquetaDeCampo> : null}

      <Animated.View
        style={{
          ...estiloDeCaja(theme, { error: !!error, enfocado }),
          justifyContent: 'center',
          height: altoCampo,
          paddingHorizontal: spacing[3],
          paddingVertical: multilinea ? spacing[3] : 0,
          transitionTimingFunction: cubicBezier(...motion.easing.easeOut.bezier),
        }}
      >
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
