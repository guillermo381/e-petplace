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
  /** EL MARCO, no el significado (S85-B20). Cambia cómo se ENCUADRA el
   *  mismo clip; la máquina poster→video→error, el "jamás autoplay" y los
   *  controles nativos son idénticos en los dos.
   *   · `tarjeta` (default) — como nació: 16/9, radio suave, y su pie con
   *     duración y descripción. Es el clip DENTRO de un contenido.
   *   · `vitrina` — a sangre y **EN BUCLE AUTOMÁTICO, SIN CONTROLES**.
   *     Llena a su padre, sin radio y sin pie.
   *
   *  ⏪ `vitrina` SE LLAMABA `lamina` Y SOLO CAMBIABA EL MARCO (S85-B20).
   *  El gate del founder lo corrigió y el cambio es de NATURALEZA, no de
   *  encuadre: **«es espacio de PUBLICIDAD, no de reproducción»**. Un clip
   *  que pide play compite con el resto de la ficha por una decisión que
   *  la familia no vino a tomar; uno que corre solo AMBIENTA. Por eso el
   *  nombre cambió con el comportamiento: `lamina` describía el marco y
   *  ya no alcanza para lo que la cosa hace. Tenía UN consumidor y nació
   *  hoy, así que renombrar costó dos líneas — en un mes hubiera costado
   *  una deuda.
   *
   *  ⚠️ LO QUE `vitrina` APAGA A PROPÓSITO, para que nadie lo lea como
   *  descuido: sin controles nativos, sin fase de poster (el video nace
   *  corriendo) y **sin sonido implícito** — un autoplay que suena en una
   *  vitrina es de las cosas que hacen cerrar la app. Y NO hereda el
   *  «jamás autoplay» de `tarjeta`, que sigue rigiendo allá: ahí el play
   *  es la consecuencia de un gesto, acá el clip es el fondo.
   *
   *  POR QUÉ PROP Y NO PIEZA NUEVA: la alternativa era que
   *  `FichaPrestador` copiara la máquina del video, y eso es exactamente
   *  la copia que esta casa persigue (el pie de reserva ya costó un
   *  precio perdido por copiar). Lo que cambia entre los dos usos es el
   *  MARCO —aspecto, radio, pie—, no lo que la pieza hace ni lo que
   *  significa: el criterio de B14 para decidir prop-vs-variante.
   *
   *  El default deja a los dos consumidores existentes byte-idénticos. */
  encuadre?: 'tarjeta' | 'vitrina'
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
function ClipVideo({ uri, onError, vitrina = false }: { uri: string; onError: () => void; vitrina?: boolean }) {
  const { theme } = useTheme()
  const { t } = useTraduccionUi()
  const [cargando, setCargando] = useState(true)
  const player = useVideoPlayer(uri, (p) => {
    if (vitrina) {
      // BUCLE Y MUDO: es ambiente, no reproducción. El mute no es una
      // preferencia — un autoplay con sonido en una vitrina hace cerrar
      // la app, y acá el usuario nunca pidió que sonara.
      p.loop = true
      p.muted = true
    }
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
        nativeControls={!vitrina}
        contentFit={vitrina ? 'cover' : 'contain'}
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

export function ClipSesion({ uri, duracionSegundos, descripcion, encuadre = 'tarjeta' }: ClipSesionProps) {
  const { theme } = useTheme()
  const { t } = useTraduccionUi()
  const esVitrina = encuadre === 'vitrina'
  /* En vitrina el video NACE corriendo: no hay poster que tocar porque no
     hay decisión que tomar. En tarjeta arranca en poster — ahí el play es
     la consecuencia del gesto que lo montó. */
  const [fase, setFase] = useState<'poster' | 'video' | 'error'>(esVitrina ? 'video' : 'poster')

  const alError = useCallback(() => setFase('error'), [])

  return (
    <View style={esVitrina ? { flex: 1 } : { gap: spacing[1] }}>
      <View
        style={
          esVitrina
            ? { flex: 1, overflow: 'hidden', backgroundColor: theme.bg.overlay }
            : {
                width: '100%',
                aspectRatio: 16 / 9,
                borderRadius: radius.suave,
                overflow: 'hidden',
                backgroundColor: theme.bg.overlay,
              }
        }
      >
        {fase === 'video' ? (
          <ClipVideo uri={uri} onError={alError} vitrina={esVitrina} />
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
      {/* EL PIE NO EXISTE EN `lamina`: una lámina del carrusel es una
          posición a sangre, y un texto colgando debajo la partiría. La
          descripción sigue viajando al a11y del poster (arriba), así que
          no se pierde información — cambia de canal. */}
      {!esVitrina && descripcion !== null && descripcion !== undefined && descripcion.length > 0 ? (
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
