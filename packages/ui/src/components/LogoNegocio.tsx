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

import { palette } from '../tokens/palette'
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
  /** S76-B1.2 — SOBRE QUÉ SUPERFICIE vive (el material, no el color):
   *  'clara' (default) = sobre papel/tarjeta, caja `bg.overlay` y
   *  monograma en text.secondary · 'muro' = sobre el MURO DE OFICIO
   *  (§15b.2, tealDark/tealDarkNoche): la caja pasa a VIDRIO OSCURO y
   *  el monograma a papel PLENO — las dos reglas medidas del muro
   *  (S61-B12: papel 7.37 sobre el vidrio; el vidrio claro caía a
   *  4.15 y por eso NO se usa acá). El vidrio se define ADENTRO, no
   *  se recibe: la app jamás pasa un color crudo (Ley 1). */
  superficie?: 'clara' | 'muro'
}

/** El vidrio OSCURO del muro de oficio — mismo material que el techo
 *  del prestador (S61-B12). Vive acá para que ningún consumidor pase
 *  un rgba a mano. */
const VIDRIO_MURO = 'rgba(0,0,0,0.18)'

/** Iniciales del nombre comercial: primera LETRA de las dos primeras
 *  palabras que tengan una ("Clínica Aurora" → "CA"; "Aurora" → "A").
 *  S76-B1 (D-505, hallazgo founder): iniciales son LETRAS — el primer
 *  char crudo convertía "[DEMO S68] Clínica Aurora" en "[S" en su
 *  pantalla. Una palabra sin letra (un marcador, un número) no aporta
 *  inicial; un nombre sin ninguna letra cae a '' (la caja con fondo
 *  sigue siendo cara válida — jamás crashea, jamás pinta basura).
 *  S76-B1.2 (copiar-al-vecino): los MARCADORES ENTRE CORCHETES se
 *  descartan ANTES — "[DEMO S68] Clínica Aurora" da "CA", jamás "DS".
 *  El header CD del prestador ya lo resolvía así desde S61-B12 y este
 *  componente lo ignoraba: la casa tenía la respuesta, el componente
 *  nuevo la repitió mal. */
function monograma(nombre: string): string {
  const iniciales = nombre
    .replace(/\[.*?\]/g, ' ')
    .trim()
    .split(/\s+/)
    .map((palabra) => palabra.match(/\p{L}/u)?.[0] ?? '')
    .filter(Boolean)
  return iniciales.slice(0, 2).join('').toUpperCase()
}

export function LogoNegocio({ nombre, logoUrl, tamano = 64, superficie = 'clara' }: LogoNegocioProps) {
  const { theme } = useTheme()
  const sobreMuro = superficie === 'muro'
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`Logo de ${nombre}`}
      style={{
        width: tamano,
        height: tamano,
        borderRadius: radius.suave,
        backgroundColor: sobreMuro ? VIDRIO_MURO : theme.bg.overlay,
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
            // Sobre el MURO el monograma es la identidad grande de una
            // portada (DM Sans light, la voz del header CD); sobre papel
            // es una marca chica de fila (medium). El ratio 0.40 del muro
            // reproduce el tamaño firmado en S61-B12 (84 × 0.40 ≈ 34).
            fontFamily: sobreMuro ? typography.family.sans.light : typography.family.sans.medium,
            fontSize: Math.round(tamano * (sobreMuro ? 0.4 : 0.32)),
            color: sobreMuro ? palette.light0 : theme.text.secondary,
          }}
        >
          {monograma(nombre)}
        </Text>
      )}
    </View>
  )
}
