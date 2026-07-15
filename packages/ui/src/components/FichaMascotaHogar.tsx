/**
 * FichaMascotaHogar v2 — la mascota PRESIDIENDO la Zona 1 del Hogar
 * (S51 Ley 11 → re-espec S52-P3 gateada por founder).
 *
 * QUÉ ES: la foto primero (AvatarMascota 64 — la foto real es el
 * gesto; la huella digna es el fallback), sobre superficie Tarjeta,
 * con el NOMBRE presidiendo (DM Sans light xl) y UNA línea de estado
 * que NO repite el nombre (las voces sin sujeto viven en el
 * diccionario del app — ficha.*; las variantes con nombre se
 * conservan para contextos sin sujeto visible). Presentacional puro:
 * la pantalla pasa el texto ya traducido; acá solo vive la SEMÁNTICA
 * (Ley 3).
 *
 * QUÉ NO ES: sin badges, sin contadores, sin CTA embebida (el tap ES
 * la acción: ir al perfil), sin metadataMono.
 *
 * SEMÁNTICA POR VOZ (intacta de v1):
 *   alDia        → punto verdeVital (status.success gráfico), voz secondary
 *   pideAtencion → punto ochre + voz warningText (pide, no grita)
 *   conociendolo → sin punto, voz secondary — neutral que invita
 *
 * Superficie: Tarjeta interactiva (pressed 0.99 — ya no es fila).
 * Diseñada para 1-3 apiladas (la pantalla pone el gap). Memorial
 * degrada: sin punto, voz neutra (la Tarjeta ya degrada sola).
 * A11y: botón "{nombre}, {texto del estado}" — completo al lector.
 */

import { Pressable, Text, View } from 'react-native'
import Animated from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'

import { typography } from '../tokens/typography'
import { spacing } from '../tokens/spacing'
import { radius } from '../tokens/radius'
import { useTheme } from '../ThemeProvider'
import { useTraduccionUi } from '../i18n'
import { AvatarMascota } from './AvatarMascota'
import { Tarjeta } from './Tarjeta'
import { usePresionado } from './usePresionado'

export type FichaMascotaHogarVoz = 'alDia' | 'pideAtencion' | 'conociendolo'

export type FichaMascotaHogarProps = {
  nombre: string
  /** URL firmada (la pantalla resuelve el path — patrón S47). */
  fotoUrl?: string
  /** La voz decide punto y color; el texto ya viene traducido y SIN nombre. */
  voz: FichaMascotaHogarVoz
  textoEstado: string
  /** S58 (patrón Hogar v2): la próxima cita de ESTA mascota, ya
   *  formateada en voz de máquina ("mar 14 jul · 09:00" —
   *  fechaCortaMono del riel). Ausente = silencio digno, cero línea. */
  proximaCitaMono?: string
  onPress: () => void
  /** S61-A11/A12 (nota de Kary + dirección firmada sobre capturas):
   *  UNA acción por precedencia — la decide la PANTALLA (en vivo >
   *  cita > alerta accionable > invitación de expediente > NADA: el
   *  silencio digno es letra). El botón MURIÓ (gate A11): la acción
   *  viste su NATURALEZA (Ley 22c revisada y declarada) —
   *   · 'vivo' = el pill de la voz única §7.1 (reuso, ui.citaEnVivo);
   *   · 'navegacion' ("ver su cita") = label en el AA de la capa del
   *     destino + chevron, derecha, SIN caja (navegar no es comando);
   *   · 'accion' ("agendar chequeo", "cargar carnet") = superficie
   *     TONAL de la capa cuidado (borde sutil + tint + texto AA,
   *     radius suave Ley 21) — abre un flujo con consecuencias.
   *  Su tap NO navega al perfil (el de la ficha sí). */
  accion?: FichaMascotaHogarAccion
}

export type FichaMascotaHogarAccion =
  | { tipo: 'vivo'; onPress: () => void }
  | { tipo: 'navegacion'; etiqueta: string; capa?: 'cuidado' | 'identidad'; onPress: () => void }
  | { tipo: 'accion'; etiqueta: string; onPress: () => void }

// S61-A12: la acción viste su naturaleza (cero Boton — gate A11).
function AccionFicha({ accion }: { accion: FichaMascotaHogarAccion }) {
  const { theme } = useTheme()
  const { t } = useTraduccionUi()
  const esMemorial = theme.mode === 'memorial'
  // D-401: la acción es un control — responde al dedo (0.97)
  const { handlers, estiloPresionado } = usePresionado(0.97)

  if (accion.tipo === 'vivo') {
    // el pill de la voz única §7.1 (mismas keys que CitaEnVivo; el
    // punto es ESTÁTICO — Ley 6). Memorial degrada a su voz serena.
    const colorPunto = esMemorial ? theme.text.secondary : theme.capa.cuidado
    const colorTexto = !esMemorial && 'capaText' in theme ? theme.capaText.cuidado : theme.text.secondary
    const voz = esMemorial ? t('citaEnVivo.estadoMemorial') : t('citaEnVivo.estado')
    return (
      <Pressable
        onPress={accion.onPress}
        {...handlers}
        accessibilityRole="button"
        accessibilityLabel={voz}
        hitSlop={8}
        style={{ marginTop: spacing[2], alignSelf: 'flex-end' }}
      >
        <Animated.View style={[estiloPresionado, { flexDirection: 'row', alignItems: 'center', gap: spacing[1.5] }]}>
          <View style={{ width: 8, height: 8, borderRadius: radius.full, backgroundColor: colorPunto }} />
          <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.sm, color: colorTexto }}>
            {voz}
          </Text>
        </Animated.View>
      </Pressable>
    )
  }

  if (accion.tipo === 'navegacion') {
    // navegar NO es comando: label en el AA de la capa del destino +
    // chevron, derecha, SIN caja. Expediente/sin capa = tinta.
    const color =
      accion.capa !== undefined && !esMemorial && 'capaText' in theme
        ? theme.capaText[accion.capa === 'cuidado' ? 'cuidado' : 'identidad']
        : theme.text.primary
    return (
      <Pressable
        onPress={accion.onPress}
        {...handlers}
        accessibilityRole="button"
        accessibilityLabel={accion.etiqueta}
        hitSlop={8}
        style={{ marginTop: spacing[2], alignSelf: 'flex-end' }}
      >
        <Animated.View style={[estiloPresionado, { flexDirection: 'row', alignItems: 'center', gap: spacing[1] }]}>
          <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.sm, color }}>
            {accion.etiqueta}
          </Text>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden>
            <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Animated.View>
      </Pressable>
    )
  }

  // 'accion': la superficie TONAL de la capa cuidado (el patrón
  // "Agendar chequeo" del prototipo) — flujo con consecuencias.
  const fondoTonal = !esMemorial && 'capaBg' in theme ? theme.capaBg.cuidado : theme.bg.overlay
  const textoTonal = !esMemorial && 'capaText' in theme ? theme.capaText.cuidado : theme.text.primary
  return (
    <Pressable
      onPress={accion.onPress}
      {...handlers}
      accessibilityRole="button"
      accessibilityLabel={accion.etiqueta}
      style={{ marginTop: spacing[2], alignSelf: 'stretch' }}
    >
      <Animated.View
        style={[
          estiloPresionado,
          {
            minHeight: 44,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: spacing[4],
            borderRadius: radius.suave,
            borderWidth: 1,
            borderColor: theme.border.subtle,
            backgroundColor: fondoTonal,
          },
        ]}
      >
        <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.sm, color: textoTonal }}>
          {accion.etiqueta}
        </Text>
      </Animated.View>
    </Pressable>
  )
}

export function FichaMascotaHogar({ nombre, fotoUrl, voz, textoEstado, proximaCitaMono, onPress, accion }: FichaMascotaHogarProps) {
  const { theme } = useTheme()
  const esMemorial = theme.mode === 'memorial'

  const punto = esMemorial
    ? null
    : voz === 'alDia'
      ? theme.status.success
      : voz === 'pideAtencion'
        ? theme.status.warning
        : null

  const colorVoz =
    !esMemorial && voz === 'pideAtencion' ? theme.status.warningText : theme.text.secondary

  return (
    <Tarjeta
      interactiva
      onPress={onPress}
      accessibilityRole="button"
      etiqueta={[nombre, textoEstado, proximaCitaMono].filter(Boolean).join(', ')}
      elevacion="reposo"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4] }}>
        <AvatarMascota nombre={nombre} fotoUrl={fotoUrl} tamano="md" />

        <View style={{ flex: 1, gap: spacing[1] }}>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{
              // el nombre PRESIDE — voz humana grande (ser vivo)
              fontFamily: typography.family.sans.light,
              fontSize: typography.size.xl,
              color: theme.text.primary,
            }}
          >
            {nombre}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
            {punto ? (
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: radius.full,
                  backgroundColor: punto,
                }}
              />
            ) : null}
            <Text
              numberOfLines={2}
              ellipsizeMode="tail"
              style={{
                flex: 1,
                fontFamily: typography.family.sans.regular,
                fontSize: typography.size.sm,
                lineHeight: typography.size.sm * typography.leading.snug,
                color: colorVoz,
              }}
            >
              {textoEstado}
            </Text>
          </View>

          {proximaCitaMono ? (
            // voz de máquina (Ley 3): mono, minúsculas, tracking suave
            <Text
              numberOfLines={1}
              style={{
                fontFamily: typography.family.mono.regular,
                fontSize: typography.size.xs,
                letterSpacing: typography.tracking.mono,
                color: theme.text.secondary,
              }}
            >
              {proximaCitaMono.toLowerCase()}
            </Text>
          ) : null}

          {accion ? <AccionFicha accion={accion} /> : null}
        </View>
      </View>
    </Tarjeta>
  )
}
