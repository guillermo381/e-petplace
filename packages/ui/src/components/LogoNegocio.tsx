/**
 * LogoNegocio — el logo del negocio CONTENIDO, jamás recortado (S74,
 * componente nacido por la E2 de la vara cruzada A→B: la FIRMA lo pedía
 * y no estaba en el set — Ley 11, cero inline en apps).
 *
 * LA TRAMPA DEL LOGO (MODELO_PRESENCIA §2, hallazgo de B verificado en
 * mesa S74): los logos ANCHOS no se recortan a círculo — el recorte
 * circular es de caras/avatares; un logo horizontal recortado pierde su
 * identidad. Acá el logo se CONTIENE: caja `radius.suave` con FONDO
 * (`bg.overlay`) y AIRE interno; `contentFit="contain"` — la imagen
 * entra ENTERA, siempre. Rige en toda superficie que pinte la firma.
 *
 * Fallback honesto SIN logo: MONOGRAMA de iniciales del nombre comercial
 * en DM Sans — jamás huella (la huella es de MASCOTA, Ley 12), jamás
 * caja vacía. Sin transition al cargar (Ley 13 — patrón AvatarMascota).
 *
 * Escalera (Ley 11, declarada): este componente NO muestra datos del
 * expediente — pinta identidad de negocio (logo o monograma); la
 * invitación a cargar el logo es de la PANTALLA, no de esta pieza.
 * Temas: claro/dark por tokens; memorial degrada solo (tokens neutros,
 * cero celebración — no hay rama especial que mantener).
 * Consumidores: la FIRMA de NEGOCIO (ventana de equipo S74-B) · la
 * pieza 2 de PRESENCIA · superficies del pet parent que pinten la firma.
 * Gate en dispositivo del founder: PENDIENTE — nace con la primera
 * pantalla consumidora (la ventana de equipo de B).
 */
import { Image, type ImageSource } from 'expo-image'
import { Text, View } from 'react-native'

import { typography } from '../tokens/typography'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

export interface LogoNegocioProps {
  /** Nombre comercial — fuente del monograma y del label de a11y. */
  nombre: string
  /** Logo firmado (path resuelto). Sin él: monograma honesto. */
  logoUrl?: string | number | ImageSource | null
  /** Lado de la caja en px. Default 64. */
  tamano?: number
}

/** Iniciales del nombre comercial: primera letra de las dos primeras
 *  palabras ("Clínica Aurora" → "CA"; "Aurora" → "A"). */
function monograma(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean)
  const primera = palabras[0]?.[0] ?? ''
  const segunda = palabras[1]?.[0] ?? ''
  return (primera + segunda).toUpperCase()
}

export function LogoNegocio({ nombre, logoUrl, tamano = 64 }: LogoNegocioProps) {
  const { theme } = useTheme()
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`Logo de ${nombre}`}
      style={{
        width: tamano,
        height: tamano,
        borderRadius: radius.suave,
        backgroundColor: theme.bg.overlay,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        // EL AIRE de la trampa: el logo jamás toca el borde de su caja
        padding: spacing[2],
      }}
    >
      {logoUrl != null ? (
        <Image
          source={typeof logoUrl === 'string' ? { uri: logoUrl } : logoUrl}
          contentFit="contain"
          style={{ width: '100%', height: '100%' }}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Text
          style={{
            fontFamily: typography.family.sans.medium,
            fontSize: Math.round(tamano * 0.32),
            color: theme.text.secondary,
          }}
        >
          {monograma(nombre)}
        </Text>
      )}
    </View>
  )
}
