/**
 * Boton — primer componente del design system (S43-B3.1).
 *
 * Variantes:
 *   primario    → el botón por defecto de TODO el producto. Fondo tinta
 *                 (text.primary), texto bg.base. Dosis prestador solo conoce este.
 *   marca       → gradientFirmaUI. SOLO dosis alta, contextos cerrados de
 *                 marca (hero onboarding, CTA principal del dueño, momento
 *                 adopción). En memorial el gradiente no existe: degrada a primario.
 *   secundario  → tonal: bg.overlay + texto primario + borde sutil.
 *   ghost       → solo texto, sin fondo. Acciones terciarias.
 *   destructivo → tonal danger (dangerBg + dangerText). NUNCA coral sólido:
 *                 la destrucción no grita, confirma (alma del portal).
 *
 * Motion (receta Software Mansion — CSS transitions de Reanimated, sin
 * worklets): pressed escala a 0.97 con el spring de motion.ts (fast 150).
 * Nada más se anima. Ni color, ni sombra, ni entrada.
 */

import { useEffect, useState, type ReactNode } from 'react'
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  View,
  type ViewStyle,
} from 'react-native'
import Animated from 'react-native-reanimated'

import { usePresionado } from './usePresionado'
import { LinearGradient } from 'expo-linear-gradient'

import { typography } from '../tokens/typography'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { motion } from '../tokens/motion'
import { opacity } from '../tokens/opacity'
import { useTheme } from '../ThemeProvider'

// 'compacto' (S58, Ley 22c): la ACCIÓN SECUNDARIA vestida — borde
// border.default + radius suave + texto tinta + target 44. Jamás
// texto pelado, jamás Celda: comando con consecuencias viste de botón.
// S73 (enmienda 19.7 angosta): PROHIBIDO como acción DENTRO de una fila
// (ahí baja a label con la anatomía de CeldaNavegacion); ghost ídem.
// La caja del compacto migra al tocarse (D-483).
//
// 'sinCaja' (S82-B r5, orden founder — A6 CANDIDATA para el rol
// secundario): el material INTERMEDIO que el censo S81-B ya nombró
// (tinte sin borde, §7): fondo bg.overlay + CERO borde + texto tinta +
// target 44 garantizado por el sistema de tamaños (md 48 · sm compensa
// con hitSlop). CONVIVENCIA DECLARADA: el contorno de 'secundario'
// (Ley 22 TONAL) NO muere todavía — 'sinCaja' se gatea en UNA pantalla
// (bienvenida del cliente); si el founder la firma, muere el contorno
// del secundario y la enmienda a la Ley 22 pasa por la MESA. Hasta esa
// firma, código nuevo sigue usando 'secundario'.
export type BotonVariante = 'primario' | 'marca' | 'secundario' | 'ghost' | 'destructivo' | 'compacto' | 'sinCaja' | 'acento'
export type BotonTamaño = 'sm' | 'md' | 'lg'

// md 48 = default: target táctil. sm 36 compensa con hitSlop (target efectivo 44).
const TAMAÑOS: Record<BotonTamaño, { alto: number; padX: number; fontSize: number }> = {
  sm: { alto: 36, padX: spacing[4], fontSize: typography.size.sm },
  md: { alto: 48, padX: spacing[5], fontSize: typography.size.base },
  lg: { alto: 56, padX: spacing[6], fontSize: typography.size.md },
}

export interface BotonProps {
  /** Obligatoria: un botón sin etiqueta no existe (a11y). */
  etiqueta: string
  onPress?: () => void
  variante?: BotonVariante
  tamaño?: BotonTamaño
  /** Full-width. */
  bloque?: boolean
  cargando?: boolean
  deshabilitado?: boolean
  /** Slot de ícono — ReactNode, sin librería acoplada. */
  iconoIzq?: ReactNode
  /**
   * S82-B r14 — EL DESHABILITADO QUE EXPLICA (candidata de C, evaluada y
   * construida). El motivo por el que el botón está apagado. Cuando
   * viene: el botón se pinta apagado PERO SIGUE TOCABLE, el toque NO
   * dispara `onPress` y en su lugar llama a `onRazon`.
   *
   * POR QUÉ VIVE ACÁ Y NO EN LA PANTALLA (lo que decidió construirlo):
   * el workaround obligado era envolver el Boton en un `Pressable` padre
   * —porque un Pressable con `disabled` no recibe eventos— y eso deja
   * **DOS nodos de a11y anidados, los dos `role="button"`**: el padre
   * habilitado con el hint y el hijo deshabilitado adentro. Un lector de
   * pantalla lee el par como dos controles. Desde el componente es UN
   * nodo: `disabled` sigue siendo TRUE en `accessibilityState` (es la
   * verdad del control) y la razón viaja en `accessibilityHint`, así el
   * lector la anuncia AL ENFOCAR — sin depender del toque.
   *
   * NO REEMPLAZA A LA FORMA VISIBLE, y esto es letra vigente: el
   * precedente S63-B dice *"el Confirmar apagado dice QUÉ FALTA,
   * SIEMPRE"*, y la segunda enmienda de SliderPrecio (S68) fijó que la
   * affordance es VISIBLE, no solo accesible. Una razón que aparece
   * únicamente al tocar está escondida. Lo preferido sigue siendo
   * decirla en la pantalla (un `Texto apoyo` bajo el botón, o la
   * etiqueta que ya nombra lo que falta); esta prop es para cuando el
   * motivo no cabe ahí, y para que el toque JAMÁS quede muerto.
   */
  razonDeshabilitado?: string
  /** Qué hacer cuando tocan un botón apagado con razón: señalar el
   *  campo que falta, abrir un aviso, scrollear a la hilera. Lo decide
   *  la PANTALLA — el componente no elige cómo se cuenta. */
  onRazon?: () => void
}

export function Boton({
  etiqueta,
  onPress,
  variante = 'primario',
  tamaño = 'md',
  bloque = false,
  cargando = false,
  deshabilitado = false,
  iconoIzq,
  razonDeshabilitado,
  onRazon,
}: BotonProps) {
  const { theme } = useTheme()
  // S63 (D-401, cura en la fuente): el hundimiento vive en LA primitiva
  // usePresionado — la física del mock firmado, memorial-aware adentro.
  const { handlers, estiloPresionado } = usePresionado(0.97)
  const [enfocado, setEnfocado] = useState(false)

  const t = TAMAÑOS[tamaño]
  const inactivo = deshabilitado || cargando
  // Apagado CON motivo: sigue tocable y el toque cuenta el porqué. No
  // rige mientras carga (ahí el motivo es obvio y el toque no debe hacer
  // nada) ni sin `onRazon` (un toque que no lleva a ningún lado sería el
  // mismo botón muerto con más código).
  const conRazon = deshabilitado && !cargando && razonDeshabilitado !== undefined && onRazon !== undefined

  // Regla emil: "loading solo se muestra si la operación supera 150ms;
  // debajo de eso, nada". El spinner aparece recién pasado el umbral
  // (motion.duration.fast); si la operación termina antes, jamás se vio.
  // accessibilityState.busy sí es inmediato — a la a11y no se le miente.
  const [mostrarSpinner, setMostrarSpinner] = useState(false)
  useEffect(() => {
    if (!cargando) {
      setMostrarSpinner(false)
      return
    }
    const timer = setTimeout(() => setMostrarSpinner(true), motion.duration.fast)
    return () => clearTimeout(timer)
  }, [cargando])

  // En memorial el gradiente firma es transparent (B2): marca degrada a primario.
  const esMarca =
    variante === 'marca' && theme.accent.gradient.colors[0] !== 'transparent'
  const varianteEfectiva: BotonVariante =
    variante === 'marca' && !esMarca ? 'primario' : variante

  const colores: Record<BotonVariante, { fondo: string; texto: string; borde?: string }> = {
    // S63 — enmienda Ley 21 FIRMADA: el primario ancla al SLOT accent.cta
    // (default tinta = idéntico al de siempre; el raíz del prestador lo
    // resuelve a tealDark con ThemeProvider cta="oficio"; memorial
    // SIEMPRE tinta — el slot lo garantiza en la fuente).
    primario:    { fondo: theme.accent.cta, texto: theme.accent.ctaTexto },
    marca:       { fondo: 'transparent', texto: theme.text.onGradient },
    secundario:  { fondo: theme.bg.overlay, texto: theme.text.primary, borde: theme.border.subtle },
    ghost:       { fondo: 'transparent', texto: theme.text.primary },
    // S82-B r12 (hallazgo del founder en dispositivo: "en oscuro casi no
    // se ve, en claro se lava"). ERROR DE r12 SOBRE r5, DECLARADO: en r5
    // le puse `bg.overlay`, que es un token de HOVER (su comentario lo
    // dice) con 19 consumidores — nunca tuvo presencia de control.
    // MEDIDO: el par overlay/fondo daba 1.07 en claro y 1.18 en oscuro, y
    // el tapiz apenas lo movió (1.12→1.07): **el tapiz NO era la causa,
    // la elección del token sí.** Ahora usa su slot propio (`accent.sinCaja`,
    // un paso real de presencia por tema) + `elevacion.reposo` como
    // canal — el precedente exacto es el segmento activo de
    // SelectorSegmentado (superficie apoyada, Chanel: sombra jamás borde).
    sinCaja:     { fondo: theme.accent.sinCaja, texto: theme.text.primary },
    destructivo: { fondo: theme.status.dangerBg, texto: theme.status.dangerText },
    compacto:    { fondo: 'transparent', texto: theme.text.primary, borde: theme.border.default },
    // ── ACENTO (S84-B18) — EL COMANDO QUE NO COMPITE CON LA FOTO ──────
    // Nace de un rechazo del founder con su razón: un botón SÓLIDO al
    // lado de una foto compite con la foto, y la vitrina existe para
    // mostrar la foto. Sin superficie ni borde; la presencia la da EL
    // COLOR DEL CTA + el peso.
    //
    // POR QUÉ NINGUNA DE LAS SIETE SERVÍA (censo de C, verificado acá):
    //  · `ghost` es la ÚNICA sin superficie, pero su texto va en
    //    `text.primary` — no cumple la Ley 22c (un comando con
    //    consecuencia se NOTA) y la casa ya lo tiene tomado como
    //    terciario.
    //  · `marca` es transparente pero su texto es `onGradient`: solo
    //    vive sobre el gradiente.
    //  · `compacto` es transparente CON borde — y el contorno
    //    transparente como acción está muerto desde la 19.7.
    //  · `sinCaja` NO ES SIN CAJA: tiene `accent.sinCaja`, un slot
    //    propio que S82-B r12 le dio JUSTAMENTE para darle presencia de
    //    superficie. Su nombre quedó viejo (ver la nota de abajo).
    //
    // Y POR QUÉ NO PODÍA RESOLVERSE EN LA PANTALLA: R5 prohíbe
    // `accent.cta` fuera del _layout raíz, y `TextoColor` no tiene
    // registro de CTA (primary|secondary|tertiary|danger|success).
    // Pintarlo desde el consumidor era rojo de lint POR CONSTRUCCIÓN —
    // el hueco estaba acá, no allá.
    acento:      { fondo: 'transparent', texto: theme.accent.cta },
  }
  const c = colores[varianteEfectiva]

  // B3.1c — constraint del gradiente v2: la exención WCAG de la cola del
  // gradiente (location 1, teal) vale SOLO si el texto nunca la alcanza.
  // marca garantiza paddingHorizontal ≥ 24 (spacing[6]) en todo tamaño.
  const padX = esMarca ? Math.max(t.padX, spacing[6]) : t.padX

  const esCompacto = varianteEfectiva === 'compacto'
  const cuerpo: ViewStyle = {
    height: esCompacto ? 44 : t.alto,
    paddingHorizontal: padX,
    borderRadius: esCompacto ? radius.suave : radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing[2],
    backgroundColor: esMarca ? undefined : c.fondo,
    // S82-B r12: `sinCaja` gana la ELEVACIÓN como canal (Ley 20 · el
    // patrón del segmento activo). El fill de un secundario tonal no
    // puede llegar a 3:1 contra el fondo sin volverse primario —medido:
    // ni bajando cinco pasos— así que su canal no es el color: es la
    // superficie apoyada. En memorial y dark la elevación es contacto
    // mínimo por diseño, y ahí manda el tono del slot.
    ...(varianteEfectiva === 'sinCaja' ? { boxShadow: theme.elevacion.reposo } : null),
    // S82-B — LA ELEVACIÓN DEL CTA, por SLOT y solo donde hace falta: el
    // oro del cliente da 1.55 contra papel y no se recorta por color, así
    // que su canal es la superficie apoyada (la cura de `sinCaja`). El
    // prestador NO la recibe: su teal no tiene ese problema y el tema de
    // oficio pisa el slot en false — meterla a las dos apps sería arrastre.
    ...(varianteEfectiva === 'primario' && 'ctaElevado' in theme.accent && theme.accent.ctaElevado
      ? { boxShadow: theme.elevacion.reposo }
      : null),
    ...(c.borde ? { borderWidth: theme.border.width, borderColor: c.borde } : null),
    ...(bloque ? { alignSelf: 'stretch' as const } : { alignSelf: 'flex-start' as const }),
  }

  const contenido = (
    <>
      {iconoIzq ? <View style={mostrarSpinner ? { opacity: 0 } : null}>{iconoIzq}</View> : null}
      {/* El label queda montado invisible durante loading: preserva el ancho
          exacto — cero layout shift (equivale a medir y fijar minWidth). */}
      <Text
        numberOfLines={1}
        style={{
          // EL PESO ES LO QUE SEPARA A LAS DOS SIN CAJA: `acento` manda
          // (bold + color de CTA), `ghost` recede (medium + tinta). Sin
          // superficie que las distinga, el peso ES la jerarquía.
          fontFamily: variante === 'acento' ? typography.family.sans.bold : typography.family.sans.medium,
          fontSize: t.fontSize,
          color: c.texto,
          opacity: mostrarSpinner ? 0 : 1,
        }}
      >
        {etiqueta}
      </Text>
      {mostrarSpinner ? (
        <View style={{ position: 'absolute', alignSelf: 'center' }}>
          <ActivityIndicator size="small" color={c.texto} />
        </View>
      ) : null}
    </>
  )

  return (
    <Pressable
      // conRazon: el toque va a `onRazon`, JAMÁS a `onPress` — un botón
      // apagado no ejecuta su acción por explicarse.
      onPress={conRazon ? onRazon : inactivo ? undefined : onPress}
      onPressIn={handlers.onPressIn}
      onPressOut={handlers.onPressOut}
      onFocus={() => setEnfocado(true)}
      onBlur={() => setEnfocado(false)}
      // `disabled` del Pressable mata los eventos; con razón queda vivo
      // para poder contarla (era exactamente por esto que el patrón
      // obligaba a un Pressable padre en la pantalla).
      disabled={conRazon ? false : inactivo}
      hitSlop={tamaño === 'sm' ? (44 - TAMAÑOS.sm.alto) / 2 : undefined}
      accessibilityRole="button"
      // La a11y dice LA VERDAD: sigue deshabilitado aunque acepte el
      // toque — y el hint entrega el motivo AL ENFOCAR, sin exigirlo.
      accessibilityState={{ disabled: inactivo, busy: cargando }}
      accessibilityHint={conRazon ? razonDeshabilitado : undefined}
      accessibilityLabel={etiqueta}
      style={bloque ? { alignSelf: 'stretch' } : { alignSelf: 'flex-start' }}
    >
      <Animated.View
        style={[
          estiloPresionado,
          {
            opacity: deshabilitado ? opacity.disabled : 1,
            borderRadius: radius.md,
            ...(bloque ? { alignSelf: 'stretch' as const } : null),
          },
          // Focus visible en web (RN-web lo exige): outline accent.active
          Platform.OS === 'web' && enfocado
            ? ({
                outlineWidth: 2,
                outlineColor: 'active' in theme.accent ? theme.accent.active : theme.accent.primary,
                outlineStyle: 'solid',
                outlineOffset: 2,
              } as unknown as ViewStyle)
            : null,
        ]}
      >
        {esMarca ? (
          <LinearGradient
            colors={[...theme.accent.gradient.colors] as [string, string, ...string[]]}
            locations={[...theme.accent.gradient.locations] as [number, number, ...number[]]}
            start={{ x: 0.13, y: 0 }}
            end={{ x: 0.87, y: 1 }}
            style={cuerpo}
          >
            {contenido}
          </LinearGradient>
        ) : (
          <View style={cuerpo}>{contenido}</View>
        )}
      </Animated.View>
    </Pressable>
  )
}
