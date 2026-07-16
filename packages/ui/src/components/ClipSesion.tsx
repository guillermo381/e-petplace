/**
 * ClipSesion — el clip corto de una sesión (componente 34, S63; espec
 * aprobada por el arquitecto sobre la propuesta Ley 11 del parte del
 * adiestramiento, MODELO_ADIESTRAMIENTO §5: el VIDEO es el medio del
 * oficio).
 *
 * Qué es: la superficie que reproduce UN clip (≤30s, techo del motor)
 * en el parte del dueño y en el Durante del prestador. Poster sereno +
 * tap-para-reproducir con controles nativos (expo-video). JAMÁS
 * autoplay — en ningún tema, y en memorial menos: la reproducción es
 * SIEMPRE un acto del usuario (tap), en los tres temas.
 *
 * Qué no es: un player genérico con timeline propia, ni un gestor de
 * cola de subida (eso es de la pantalla, patrón EvidenciaFoto).
 *
 * Estados: poster (reposo) · cargando (voz honesta, sin shimmer —
 * Ley 13) · reproduciendo (controles nativos) · error (voz honesta +
 * reintentar — el clip jamás se disfraza de vacío, Ley 13).
 *
 * ESCALERA (§4b): 0 clips = este componente NO se monta (la vista no
 * pinta estado vacío decorativo) · 1+ = el clip real. No muestra datos
 * del expediente más allá del propio clip.
 *
 * Dosis: tokens puros (bg.overlay / text sobre superficie) — sirve a
 * ambos temas y a la dosis del prestador sin variante; cero colores
 * propios. Memorial degrada solo (superficie y tinta del tema; sin
 * animación alguna — el reemplazo poster→video es directo).
 */

import { useCallback, useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { VideoView, useVideoPlayer } from 'expo-video'
import { useTheme } from '../ThemeProvider'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { useTraduccionUi } from '../i18n'

export interface ClipSesionProps {
  /** URL (firmada) del clip. */
  uri: string
  /** Duración en segundos si se conoce — se dice en voz de máquina. */
  duracionSegundos?: number | null
  /** Descripción corta del adiestrador (a11y + pie opcional). */
  descripcion?: string | null
}

function duracionMono(segundos: number): string {
  const m = Math.floor(segundos / 60)
  const s = segundos % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/** El video montado: nace SOLO tras el tap (jamás autoplay de montaje
 *  automático — el play es la consecuencia del gesto que lo montó).
 *  Mientras carga, la voz honesta encima (estática, sin shimmer —
 *  Ley 13); el reemplazo al video es directo. */
function ClipVideo({ uri, onError }: { uri: string; onError: () => void }) {
  const { theme } = useTheme()
  const { t } = useTraduccionUi()
  const [cargando, setCargando] = useState(true)
  const player = useVideoPlayer(uri, (p) => {
    p.play()
  })
  useEffect(() => {
    const sub = player.addListener('statusChange', ({ status }) => {
      if (status === 'error') onError()
      else if (status === 'readyToPlay') setCargando(false)
    })
    return () => {
      sub.remove()
    }
  }, [player, onError])
  return (
    <View style={{ flex: 1 }}>
      <VideoView
        player={player}
        nativeControls
        contentFit="contain"
        style={{ width: '100%', height: '100%' }}
      />
      {cargando ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: typography.family.sans.regular,
              fontSize: typography.size.sm,
              color: theme.text.secondary,
            }}
          >
            {t('clipSesion.cargando')}
          </Text>
        </View>
      ) : null}
    </View>
  )
}

export function ClipSesion({ uri, duracionSegundos, descripcion }: ClipSesionProps) {
  const { theme } = useTheme()
  const { t } = useTraduccionUi()
  const [fase, setFase] = useState<'poster' | 'video' | 'error'>('poster')

  const alError = useCallback(() => setFase('error'), [])

  return (
    <View style={{ gap: spacing[1] }}>
      <View
        style={{
          width: '100%',
          aspectRatio: 16 / 9,
          borderRadius: radius.suave,
          overflow: 'hidden',
          backgroundColor: theme.bg.overlay,
        }}
      >
        {fase === 'video' ? (
          <ClipVideo uri={uri} onError={alError} />
        ) : fase === 'error' ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing[2],
              padding: spacing[3],
            }}
          >
            <Text
              style={{
                fontFamily: typography.family.sans.regular,
                fontSize: typography.size.sm,
                color: theme.text.secondary,
                textAlign: 'center',
              }}
            >
              {t('clipSesion.error')}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('clipSesion.reintentar')}
              onPress={() => setFase('video')}
              style={({ pressed }) => ({
                minHeight: 44,
                justifyContent: 'center',
                paddingHorizontal: spacing[3],
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                style={{
                  fontFamily: typography.family.sans.medium,
                  fontSize: typography.size.sm,
                  color: theme.text.primary,
                }}
              >
                {t('clipSesion.reintentar')}
              </Text>
            </Pressable>
          </View>
        ) : (
          /* POSTER — reposo sereno: el play es la única invitación */
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              descripcion !== null && descripcion !== undefined && descripcion.length > 0
                ? `${t('clipSesion.reproducir')} — ${descripcion}`
                : t('clipSesion.reproducir')
            }
            onPress={() => setFase('video')}
            style={({ pressed }) => ({
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Svg width={40} height={40} viewBox="0 0 24 24">
              <Path d="M8.5 5.5v13l10.5-6.5z" fill={theme.text.primary} />
            </Svg>
            {typeof duracionSegundos === 'number' && duracionSegundos > 0 ? (
              <Text
                style={{
                  position: 'absolute',
                  right: spacing[2],
                  bottom: spacing[2],
                  fontFamily: typography.family.mono.regular,
                  fontSize: typography.size.xs,
                  color: theme.text.secondary,
                }}
              >
                {duracionMono(duracionSegundos)}
              </Text>
            ) : null}
          </Pressable>
        )}
      </View>
      {descripcion !== null && descripcion !== undefined && descripcion.length > 0 ? (
        <Text
          style={{
            fontFamily: typography.family.sans.regular,
            fontSize: typography.size.sm,
            color: theme.text.secondary,
          }}
        >
          {descripcion}
        </Text>
      ) : null}
    </View>
  )
}
