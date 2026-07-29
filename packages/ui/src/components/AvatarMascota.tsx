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
import { palette } from '../tokens/palette'

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
  /** S74 — LA REGLA DE FORMA (firmada): `'chip'` = el avatar va ANIDADO
   *  dentro de un chip de `SelectorOpcion` (44) y su radio se DERIVA del
   *  contenedor; sin esta prop, el avatar es SUELTO y conserva el
   *  squircle 32%. Vocabulario CERRADO a propósito: la pantalla declara
   *  DÓNDE vive el avatar, jamás un radio crudo (Ley 1). `entidad` lo
   *  implica y no necesita pasarla. */
  anidadoEn?: 'chip'
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
 *  en su Android): el radio interior se DERIVA del chip en vez del
 *  squircle 32%. Se implementó C (= la B firmada + borderCurve, gratis en
 *  iOS e IDÉNTICO en Android — salvedad: la lámina no podía separar b de
 *  c en el dispositivo del gate; si el founder ratifica B puro, la cura
 *  es quitar el borderCurve). El founder declaró que aún NO fusiona — B
 *  fue la mejor de tres, no un "resuelto": la sombra (D-507) y el
 *  MATERIAL (D-506, confirmado en dispositivo: *"aún con fondo la
 *  imagen"*) siguen en la lámina v2. Proporción 52/44 sigue PROVISIONAL.
 *  **La regla que esta cura implicaba quedó FIRMADA en el mismo gate**
 *  (el chip chico del filtro: *"cara flotante dentro"*) — ver abajo. */

/** El alto canónico del chip (target táctil de SelectorOpcion). */
const ALTO_CHIP = 44

/** LA REGLA DE FORMA (S74, FIRMADA por el founder tras el gate del chip
 *  chico — "cara flotante dentro"): **el avatar ANIDADO deriva su radio
 *  del contenedor; el SUELTO conserva el squircle 32%.** El radio interior
 *  sigue la curva del chip: `ALTO/2 − |ALTO − d|/2`. Reproduce los dos
 *  valores firmados: entidad (52) → **18** (la variante B/C de la lámina) ·
 *  xs dentro del chip (28) → **14** (hoy squircle 9, el que flotaba). */
function radioEnChip(lado: number): number {
  return Math.round(ALTO_CHIP / 2 - Math.abs(ALTO_CHIP - lado) / 2)
}

function radioAvatar(tamano: AvatarMascotaTamano, lado: number, anidadoEnChip: boolean): number {
  return tamano === 'entidad' || anidadoEnChip ? radioEnChip(lado) : radioSquircle(lado)
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

/** ── S81 — EL .cap DEL LITERAL (fuente: epetplace-foto-onboarding-v3,
 *  S79 — la lámina NO está en el repo; su letra viajó transcrita en la
 *  orden de mesa): la SOMBRA INTERIOR sobre la foto — lo que hace que
 *  la cara se vea DENTRO del marco en vez de pegada encima. Es la
 *  fusión que D-506 persigue, por material y no por geometría.
 *  Tres capas inset en UN boxShadow (RN ≥0.76 new arch — el repo corre
 *  0.86 new arch; web CSS nativo; old-arch NO lo banca, declarado):
 *  la sombra 0 2px 5px al 34% (tinta cálida de la casa — el literal no
 *  fijó color) · la luz inferior blanca al 45% (px espejo suave,
 *  derivados) · el hairline interno al 8%. Memorial lo CONSERVA (como
 *  la elevación, Ley 20: material, no celebración). */
/** CORREGIDO CONTRA EL LITERAL (S81 — la lámina ya está archivada en
 *  docs/relevamientos/2026-07-27-s79-epetplace-foto-onboarding-v3.html,
 *  líneas 37-39 y 55): el color es rgba(23,19,28) — no tinta cálida —,
 *  la luz inferior es NÍTIDA (0 -1px 0, sin blur), y hay DOS recetas:
 *  la grande y la de los marks chicos (.mk, ≤44). El anillo del chip
 *  elegido es CAPA INSET del propio cap (:55), no borderWidth. */
const CAP_FOTO_GRANDE = [
  'inset 0 2px 5px rgba(23,19,28,0.34)',
  'inset 0 -1px 0 rgba(255,255,255,0.45)',
  'inset 0 0 0 1px rgba(23,19,28,0.08)',
].join(', ')
const CAP_FOTO_CHICO = [
  'inset 0 2px 4px rgba(23,19,28,0.3)',
  'inset 0 -1px 0 rgba(255,255,255,0.4)',
  'inset 0 0 0 1px rgba(23,19,28,0.07)',
].join(', ')
const CAP_ELEGIDO = [
  'inset 0 0 0 1.5px rgba(255,255,255,0.5)',
  'inset 0 2px 4px rgba(23,19,28,0.2)',
].join(', ')
const capFoto = (lado: number, sobreLleno: boolean) =>
  sobreLleno ? CAP_ELEGIDO : lado <= 44 ? CAP_FOTO_CHICO : CAP_FOTO_GRANDE

/** ── S81 — EL ENCUADRE DEFAULT DEL LITERAL: centro vertical 0.42 ·
 *  zoom 1.30. DEFAULT DE RENDER, jamás elección del dueño — el
 *  encuadre real (cx/cy/z persistidos) es OTRA decisión y NO se
 *  construye acá (orden de mesa §5). Derivación: alto/ancho 130%,
 *  x centrado (−15%), y = −(0.42·1.30 − 0.5) = −4.6%. */
const ZOOM_FOTO = 1.3
const CENTRO_Y_FOTO = 0.42
const FOTO_LADO = `${ZOOM_FOTO * 100}%`
const FOTO_LEFT = `-${((ZOOM_FOTO - 1) / 2) * 100}%`
const FOTO_TOP = `-${(CENTRO_Y_FOTO * ZOOM_FOTO - 0.5) * 100}%`

/** ── S81 — LA RECETA DEL CHIP ELEGIDO (el literal): sobre el lleno
 *  magenta, el avatar gana ANILLO blanco 1.5 al 50% y su fondo pasa a
 *  blanco 18% — es lo que lo despega del relleno. */
const ANILLO_SOBRE_LLENO = { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)' } as const

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

export function AvatarMascota({ nombre, fotoUrl, tamano = 'md', capa, sobreLleno = false, anidadoEn }: AvatarMascotaProps) {
  const { theme } = useTheme()
  const [falloCarga, setFalloCarga] = useState(false)

  const d = DIAMETRO[tamano]
  const esMemorial = theme.mode === 'memorial'
  const conFoto = fotoUrl !== undefined && !falloCarga

  if (conFoto) {
    const radio = radioAvatar(tamano, d, anidadoEn === 'chip')
    return (
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={nombre}
        style={{
          width: d,
          height: d,
          borderRadius: radio,
          borderCurve: 'continuous',
          overflow: 'hidden',
          ...(esMemorial ? { filter: FILTRO_MEMORIAL } : null),
        }}
      >
        {/* ⑤ el encuadre DEFAULT del literal (0.42 / 1.30) — render, no dato */}
        <Image
          source={typeof fotoUrl === 'string' ? { uri: fotoUrl } : fotoUrl}
          contentFit="cover"
          transition={0}
          style={{ position: 'absolute', width: FOTO_LADO, height: FOTO_LADO, left: FOTO_LEFT, top: FOTO_TOP }}
          onError={() => setFalloCarga(true)}
        />
        {/* ③ el .cap: la foto DENTRO del marco (fusión D-506, material).
            ④ elegido: el anillo es CAPA del cap (literal :55) */}
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: radio, borderCurve: 'continuous', boxShadow: capFoto(d, sobreLleno) }}
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
  // ④ S81 (la receta del chip elegido, literal): fondo blanco 18 (era 16)
  const fondo = sobreLleno ? 'rgba(255,255,255,0.18)' : conCapa ? theme.capaBg[k] : theme.bg.overlay
  const color = sobreLleno ? palette.white : conCapa && 'capaText' in theme ? theme.capaText[k] : theme.text.secondary

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={nombre}
      style={{
        width: d,
        height: d,
        borderRadius: radioAvatar(tamano, d, anidadoEn === 'chip'),
        borderCurve: 'continuous',
        backgroundColor: fondo,
        alignItems: 'center',
        justifyContent: 'center',
        // ④ la receta del chip elegido rige con y sin foto
        ...(sobreLleno ? ANILLO_SOBRE_LLENO : null),
      }}
    >
      <HuellaGenerica color={color} tamano={HUELLA[tamano]} />
    </View>
  )
}
