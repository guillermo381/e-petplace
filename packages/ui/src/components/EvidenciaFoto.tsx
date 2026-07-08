/**
 * EvidenciaFoto — captura y estado de la evidencia fotográfica de una
 * atención (S44-B2.5). Dos piezas (patrón EsqueletoGrupo):
 *
 *   EvidenciaFoto.Capturar  — tap abre la CÁMARA directo (quality 0.7
 *     para subida móvil); mantener presionado abre una Hoja con
 *     "Elegir de la galería" (acción secundaria, no compite con el
 *     gesto primario). Permiso denegado → estado con voz humana +
 *     "Abrir ajustes" (Linking.openSettings) + "Probar de nuevo".
 *     JAMÁS pantalla rota ni alert nativo pelado.
 *
 *   EvidenciaFoto.Thumbnail — cuadrado radius.md (expo-image, SIN
 *     transition — Ley 13). subiendo: scrim del token + spinner SOLO
 *     pasado 150ms (patrón Boton). subida: limpia, sin badge (el
 *     éxito es que esté). error: la imagen SIGUE visible + ícono de
 *     reintento (Ley 12) en la esquina; el tap dispara onReintentar —
 *     la foto jamás desaparece por un fallo de red.
 *
 * ═══════════════════════════════════════════════════════════════════
 * La subida y su cola viven en la pantalla/wrapper (B3); este
 * componente captura y muestra estado. NO sube nada: reporta URIs
 * y taps hacia arriba.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Memorial (Ley 8): overlay y acciones ya son neutrales (scrim del
 * token + text del tema, sin color de capa); la captura funciona
 * igual — una atención en memorial puede requerir evidencia.
 *
 * Contraste: sobre fotografía no hay par medible — el scrim del token
 * (palette.scrim) garantiza el piso; el peor caso (foto blanca) está
 * gateado en verify-contrast (spinner/ícono blanco ≥3:1).
 */

import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native'
import { Image, type ImageSource } from 'expo-image'
import Svg, { Path } from 'react-native-svg'

import { capturarConCamara, capturarDeGaleria } from './capturaFoto'

import { palette } from '../tokens/palette'
import { typography } from '../tokens/typography'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { motion } from '../tokens/motion'
import { opacity } from '../tokens/opacity'
import { useTheme } from '../ThemeProvider'
import { Boton } from './Boton'
import { Celda } from './Celda'
import { Hoja } from './Hoja'

// ── Íconos (Ley 12: outline 1.75, remates redondeados, UN color) ────────────

function IconoCamara({ color, tamano }: { color: string; tamano: number }) {
  const stroke = {
    stroke: color,
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  }
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24">
      <Path
        d="M4.5 8.2c0-.9.75-1.7 1.7-1.7h1.9l1.3-1.9c.2-.3.5-.45.85-.45h3.5c.35 0 .65.15.85.45l1.3 1.9h1.9c.95 0 1.7.8 1.7 1.7v8.1c0 .95-.75 1.7-1.7 1.7H6.2c-.95 0-1.7-.75-1.7-1.7V8.2z"
        {...stroke}
      />
      <Path d="M12 15.2a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" {...stroke} />
    </Svg>
  )
}

function IconoReintentar({ color, tamano }: { color: string; tamano: number }) {
  const stroke = {
    stroke: color,
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  }
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24">
      <Path d="M21 12a9 9 0 1 1-2.64-6.36" {...stroke} />
      <Path d="M21 3v5h-5" {...stroke} />
    </Svg>
  )
}

// ── Capturar ─────────────────────────────────────────────────────────────────

export interface EvidenciaFotoCapturarProps {
  onFoto: (uri: string) => void
  deshabilitado?: boolean
}

const LADO = 96 // mismo default que Thumbnail: conviven en la misma fila
const CALIDAD = 0.7

export function EvidenciaFotoCapturar({ onFoto, deshabilitado = false }: EvidenciaFotoCapturarProps) {
  const { theme } = useTheme()
  const [permisoDenegado, setPermisoDenegado] = useState(false)
  const [hojaAbierta, setHojaAbierta] = useState(false)
  // Cerrojo sincrónico: dos taps antes del próximo render no lanzan
  // dos cámaras (el state no propaga entre taps consecutivos).
  const lanzandoRef = useRef(false)

  // Captura vía la infraestructura compartida (capturaFoto, S45-B3.3) —
  // evidencia: sin recorte, calidad 0.7 (default del helper).
  async function tomarFoto() {
    if (lanzandoRef.current || deshabilitado) return
    lanzandoRef.current = true
    try {
      const r = await capturarConCamara({ calidad: CALIDAD })
      if (r.tipo === 'permiso_denegado') {
        setPermisoDenegado(true)
        return
      }
      setPermisoDenegado(false)
      if (r.tipo === 'foto') onFoto(r.foto.uri)
    } finally {
      lanzandoRef.current = false
    }
  }

  async function elegirDeGaleria() {
    if (lanzandoRef.current) return
    lanzandoRef.current = true
    setHojaAbierta(false)
    try {
      const r = await capturarDeGaleria({ calidad: CALIDAD })
      if (r.tipo === 'foto') onFoto(r.foto.uri)
    } finally {
      lanzandoRef.current = false
    }
  }

  async function probarDeNuevo() {
    setPermisoDenegado(false)
    await tomarFoto()
  }

  if (permisoDenegado) {
    return (
      <View
        style={{
          padding: spacing[4],
          borderRadius: radius.md,
          backgroundColor: theme.bg.card,
          borderWidth: theme.border.width,
          borderColor: theme.border.default,
          gap: spacing[3],
        }}
      >
        <Text
          style={{
            fontFamily: typography.family.sans.regular,
            fontSize: typography.size.base,
            lineHeight: typography.size.base * 1.4,
            color: theme.text.primary,
          }}
        >
          Necesitamos la cámara para registrar la evidencia de la atención. Podés habilitarla desde
          los ajustes del teléfono.
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing[2], flexWrap: 'wrap' }}>
          <Boton
            variante="secundario"
            tamaño="sm"
            etiqueta="Abrir ajustes"
            onPress={() => {
              void Linking.openSettings()
            }}
          />
          <Boton variante="ghost" tamaño="sm" etiqueta="Probar de nuevo" onPress={() => void probarDeNuevo()} />
        </View>
      </View>
    )
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tomar foto"
        accessibilityHint="Mantené presionado para elegir de la galería"
        accessibilityState={{ disabled: deshabilitado }}
        disabled={deshabilitado}
        onPress={() => void tomarFoto()}
        onLongPress={() => setHojaAbierta(true)}
        style={({ pressed }) => ({
          width: LADO,
          height: LADO,
          borderRadius: radius.md,
          borderWidth: theme.border.width,
          borderColor: theme.border.default,
          borderStyle: 'dashed',
          backgroundColor: pressed ? theme.bg.overlay : theme.bg.elevated,
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing[1.5],
          opacity: deshabilitado ? opacity.disabled : 1,
        })}
      >
        <IconoCamara color={theme.text.secondary} tamano={24} />
        <Text
          style={{
            fontFamily: typography.family.sans.medium,
            fontSize: typography.size.xs,
            color: theme.text.secondary,
          }}
        >
          Foto
        </Text>
      </Pressable>

      <Hoja visible={hojaAbierta} onCerrar={() => setHojaAbierta(false)} titulo="Agregar evidencia">
        <Celda
          interactiva
          onPress={() => {
            setHojaAbierta(false)
            void tomarFoto()
          }}
          accessibilityRole="button"
          titulo="Tomar foto"
        />
        <Celda
          interactiva
          onPress={() => void elegirDeGaleria()}
          accessibilityRole="button"
          titulo="Elegir de la galería"
        />
      </Hoja>
    </>
  )
}

// ── Thumbnail ────────────────────────────────────────────────────────────────

export type EvidenciaFotoEstado = 'subiendo' | 'subida' | 'error'

export interface EvidenciaFotoThumbnailProps {
  /** string en producto (uri del picker); require() solo galería/tests. */
  uri: string | number | ImageSource
  estado: EvidenciaFotoEstado
  onReintentar?: () => void
  tamano?: number
}

function SpinnerDiferido() {
  // Patrón Boton (Ley 13): spinner solo pasado el umbral de 150ms.
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), motion.duration.fast)
    return () => clearTimeout(t)
  }, [])
  if (!visible) return null
  return <ActivityIndicator size="small" color={palette.white} />
}

export function EvidenciaFotoThumbnail({
  uri,
  estado,
  onReintentar,
  tamano = LADO,
}: EvidenciaFotoThumbnailProps) {
  const conReintento = estado === 'error' && onReintentar !== undefined

  const contenido = (
    <>
      <Image
        source={typeof uri === 'string' ? { uri } : uri}
        contentFit="cover"
        transition={0}
        style={{ width: '100%', height: '100%' }}
      />
      {estado === 'subiendo' && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: palette.scrim,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SpinnerDiferido />
        </View>
      )}
      {estado === 'error' && (
        <View
          style={{
            position: 'absolute',
            right: spacing[1.5],
            bottom: spacing[1.5],
            width: 28,
            height: 28,
            borderRadius: radius.full,
            backgroundColor: palette.scrim,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconoReintentar color={palette.white} tamano={16} />
        </View>
      )}
    </>
  )

  const marco = {
    width: tamano,
    height: tamano,
    borderRadius: radius.md,
    overflow: 'hidden' as const,
  }

  if (conReintento) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="La foto no se subió. Reintentar"
        onPress={onReintentar}
        style={marco}
      >
        {contenido}
      </Pressable>
    )
  }

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={estado === 'subiendo' ? 'Evidencia, subiendo' : 'Evidencia'}
      style={marco}
    >
      {contenido}
    </View>
  )
}

/** Compuesto: EvidenciaFoto.Capturar / EvidenciaFoto.Thumbnail. */
export const EvidenciaFoto = {
  Capturar: EvidenciaFotoCapturar,
  Thumbnail: EvidenciaFotoThumbnail,
}
