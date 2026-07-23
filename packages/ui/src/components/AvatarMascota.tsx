/**
 * AvatarMascota — la cara de la mascota en el sistema (S44-B2.3;
 * enmienda final founder: fallback = huella genérica digna, el set
 * ilustrado por especie llega con D-288).
 *
 * ═══════════════════════════════════════════════════════════════════
 * No porta estado: "en vivo" es de CitaEnVivo, status es de Insignia.
 * Solo mascotas. No interactivo.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Círculo 40/64/96. Cadena de presentación:
 *   fotoUrl → huella genérica (neutral, o sobre el tint capaBg si
 *   hay capa — huella en capaText, registro AA, Ley 2).
 * Con foto: expo-image contentFit cover, SIN transition (Ley 13:
 * reemplazo directo, cero fade). El error de carga NO muestra ícono
 * ni reintento: cae a la huella digna y listo.
 *
 * Huella según Ley 12: outline 1.75, remates redondeados, UN color.
 *
 * Memorial (Ley 8): la foto degrada con desaturación leve (filter
 * saturate — estático, no es animación); la huella pierde el tint
 * de capa y queda neutral.
 *
 * Accesibilidad: accessibilityLabel = nombre. La foto no es
 * decorativa: ES la mascota.
 */

import { useState } from 'react'
import { View } from 'react-native'
import { Image, type ImageSource } from 'expo-image'
import Svg, { Circle, Path } from 'react-native-svg'

import { useTheme } from '../ThemeProvider'

export type AvatarMascotaTamano = 'xs' | 'sm' | 'entidad' | 'md' | 'lg'
export type AvatarMascotaCapa = 'vida' | 'cuidado' | 'comunidad' | 'comunidadAmplia'

/** Códigos reales de cat_especies (relevados contra DB, S44-B2.3). */
export type AvatarMascotaEspecie =
  | 'perro'
  | 'gato'
  | 'conejo'
  | 'ave'
  | 'roedor'
  | 'cobaya'
  | 'pez'
  | 'huron'
  | 'reptil'
  | 'otro'
  | 'equino'

export interface AvatarMascotaProps {
  nombre: string
  /** URL remota (producto) o require() de asset local (galería/tests).
   *  OJO: require() devuelve number en nativo y objeto en web — por eso
   *  el union incluye los tres y solo el string se envuelve en {uri}. */
  fotoUrl?: string | number | ImageSource
  /** Hoy no cambia el render; el set ilustrado por especie la
   *  consumirá (D-288). Código real de cat_especies. */
  especie?: AvatarMascotaEspecie
  tamano?: AvatarMascotaTamano
  capa?: AvatarMascotaCapa
  /** S73 (entity chip): el FALLBACK sobre un chip LLENO recede — velo
   *  blanco + huella blanca (con foto no cambia nada). */
  sobreLleno?: boolean
}

// SQUIRCLE (S61-A10, dirección de arte firmada por el founder sobre el
// prototipo): el círculo MURIÓ — el radio es PROPORCIONAL al lado,
// calibrado en píxeles (L-143, variantes 32% vs 38% capturadas al
// pulgar; ELEGIDA: 32% — la tensión de esquina se lee en todas las
// tallas; 38% se acercaba a círculo en xs/sm y perdía la firma). borderCurve 'continuous' = curvatura
// continua en iOS; Android/web usan el redondeo estándar (degradación
// declarada). UNA definición: los recortes artesanales están
// prohibidos (regla 37 del clon) — SelectorAvatar la consume.
const RADIO_SQUIRCLE = 0.32
export function radioSquircle(lado: number): number {
  return Math.round(lado * RADIO_SQUIRCLE)
}

/** S74 (vara de B, E3 — clase L-159): EL número del entity chip vive UNA
 *  vez. Cerrar el provisional V2 = cambiar SOLO este valor; SelectorOpcion
 *  deriva overhang y geometría de acá. */
export const TALLA_AVATAR_ENTIDAD = 52

const DIAMETRO: Record<AvatarMascotaTamano, number> = {
  // xs (S61-A4): la cara DENTRO de un chip de 44 (adorno de
  // SelectorOpcion, el para-quién de la reserva) — sm revienta el alto.
  xs: 28,
  sm: 40,
  // entidad (S73, V2 PROVISIONAL del entity chip — la proporción se
  // cierra en dispositivo con foto real): sobresale por lado del chip
  // de 44 (dictado founder: el contorno se FUSIONA con el avatar).
  entidad: TALLA_AVATAR_ENTIDAD,
  md: 64,
  lg: 96,
}

/** S74 — LA GEOMETRÍA DE LA FUSIÓN (firma founder sobre la lámina a/b/c,
 *  en su Android): en `entidad` el radio interior se DERIVA del chip —
 *  exterior (44/2 = 22, el target táctil del chip) menos el inset
 *  (SOBRA = 4) = **18** — en lugar del squircle 32%. Se implementa C
 *  (= la B firmada + borderCurve, gratis en iOS e IDÉNTICO en Android —
 *  salvedad registrada: la lámina no podía separar b de c en el
 *  dispositivo del gate; si el founder ratifica B puro, la cura es
 *  quitar el borderCurve SOLO en entidad). El founder declaró que aún NO
 *  fusiona — B fue la mejor de tres, no un "resuelto": la sombra (D-507)
 *  y el material (D-506) siguen en la lámina v2. Las DEMÁS tallas
 *  conservan el squircle 32% intacto (censo S74: entidad solo vive en
 *  SelectorOpcion + lámina). Proporción 52/44 sigue PROVISIONAL. */
const RADIO_ENTIDAD = 44 / 2 - (TALLA_AVATAR_ENTIDAD - 44) / 2 // 18

function radioAvatar(tamano: AvatarMascotaTamano, lado: number): number {
  return tamano === 'entidad' ? RADIO_ENTIDAD : radioSquircle(lado)
}

// Tamaño óptico de la huella dentro del círculo (~55% del diámetro).
const HUELLA: Record<AvatarMascotaTamano, number> = {
  xs: 15,
  sm: 22,
  entidad: 28,
  md: 36,
  lg: 54,
}

/** Mismo vocabulario público que Insignia/CitaEnVivo; claves del tema. */
const CAPA_A_KEY = {
  vida: 'identidad',
  cuidado: 'cuidado',
  comunidad: 'comunidad',
  comunidadAmplia: 'comunidadAmplia',
} as const

// Desaturación leve memorial — que se note, sin filtro fúnebre (gate B2.3).
// Forma string de filter: la única que RN nativo (0.76+) Y RN-web aplican
// por igual (la forma array [{saturate}] se ignora silenciosa en web).
const FILTRO_MEMORIAL = 'saturate(0.55)'

// Huella genérica — Ley 12: outline 1.75, round, UN color.
function HuellaGenerica({ color, tamano }: { color: string; tamano: number }) {
  const stroke = {
    stroke: color,
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  }
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24">
      <Circle cx={6.2} cy={9.6} r={1.75} {...stroke} />
      <Circle cx={9.9} cy={7} r={1.75} {...stroke} />
      <Circle cx={14.1} cy={7} r={1.75} {...stroke} />
      <Circle cx={17.8} cy={9.6} r={1.75} {...stroke} />
      <Path
        d="M12 12c2.9 0 5.2 2.3 5.2 4.6 0 1.9-1.5 3.2-3 2.7-.9-.3-1.5-.45-2.2-.45s-1.3.15-2.2.45c-1.5.5-3-.8-3-2.7 0-2.3 2.3-4.6 5.2-4.6z"
        {...stroke}
      />
    </Svg>
  )
}

export function AvatarMascota({ nombre, fotoUrl, tamano = 'md', capa, sobreLleno = false }: AvatarMascotaProps) {
  const { theme } = useTheme()
  const [falloCarga, setFalloCarga] = useState(false)

  const d = DIAMETRO[tamano]
  const esMemorial = theme.mode === 'memorial'
  const conFoto = fotoUrl !== undefined && !falloCarga

  if (conFoto) {
    return (
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={nombre}
        style={{
          width: d,
          height: d,
          borderRadius: radioAvatar(tamano, d),
          borderCurve: 'continuous',
          overflow: 'hidden',
          ...(esMemorial ? { filter: FILTRO_MEMORIAL } : null),
        }}
      >
        <Image
          source={typeof fotoUrl === 'string' ? { uri: fotoUrl } : fotoUrl}
          contentFit="cover"
          transition={0}
          style={{ width: '100%', height: '100%' }}
          onError={() => setFalloCarga(true)}
        />
      </View>
    )
  }

  // Fallback: huella genérica. Capa solo fuera de memorial (Ley 8: neutral).
  const conCapa = capa !== undefined && !esMemorial && 'capaBg' in theme
  const k = CAPA_A_KEY[capa ?? 'vida']
  // S73 (cura del gate: "el fallback pelea con el relleno") — sobre un
  // chip LLENO, el cuadro pálido + huella se llevaban el ojo y el avatar
  // pesaba más que el nombre (que es el dato). Tratamiento POR ESTADO:
  // el fallback RECEDE en el lleno — velo blanco tenue + huella blanca.
  // (El alpha es candidato a token si el gate lo firma.)
  const fondo = sobreLleno ? 'rgba(255,255,255,0.16)' : conCapa ? theme.capaBg[k] : theme.bg.overlay
  const color = sobreLleno ? '#FFFFFF' : conCapa && 'capaText' in theme ? theme.capaText[k] : theme.text.secondary

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={nombre}
      style={{
        width: d,
        height: d,
        borderRadius: radioAvatar(tamano, d),
        borderCurve: 'continuous',
        backgroundColor: fondo,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <HuellaGenerica color={color} tamano={HUELLA[tamano]} />
    </View>
  )
}
