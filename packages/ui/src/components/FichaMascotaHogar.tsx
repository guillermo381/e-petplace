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

import { Text, View } from 'react-native'

import { typography } from '../tokens/typography'
import { spacing } from '../tokens/spacing'
import { radius } from '../tokens/radius'
import { useTheme } from '../ThemeProvider'
import { AvatarMascota } from './AvatarMascota'
import { Boton } from './Boton'
import { Tarjeta } from './Tarjeta'

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
  /** S61-A11 (nota de Kary: la acción vive en la FICHA): UNA acción,
   *  la más importante por precedencia — la decide la PANTALLA (en
   *  vivo > cita > alerta accionable > invitación de expediente >
   *  NADA: el silencio digno es letra, cero CTA de relleno). Boton
   *  compacto (Ley 22c); su tap NO navega al perfil (el de la ficha sí). */
  accion?: { etiqueta: string; onPress: () => void }
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

          {accion ? (
            // S61-A11: la acción de la ficha — compacto, alineado al
            // contenido; sin accion = silencio digno (cero relleno).
            <View style={{ marginTop: spacing[2], alignSelf: 'flex-start' }}>
              <Boton variante="compacto" etiqueta={accion.etiqueta} onPress={accion.onPress} />
            </View>
          ) : null}
        </View>
      </View>
    </Tarjeta>
  )
}
