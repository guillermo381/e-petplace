/**
 * SelectorAvatar — la foto de identidad de la mascota (S45-B3.3,
 * onboarding dueño). Espec cerrada por arquitecto+founder.
 *
 * ═══════════════════════════════════════════════════════════════════
 * Semántica IDENTIDAD, no evidencia: cámara y galería son PARES en
 * la Hoja (no cámara-directo como EvidenciaFoto), y "Por ahora no"
 * es primera clase — la huella NO es placeholder de fracaso, es
 * cara válida (AvatarMascota).
 * Presentacional puro: entrega { uri, width, height } — la pantalla
 * es dueña del upload. No porta estados de red.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Vacío: círculo grande AvatarMascota (huella digna; `especie` del
 * contexto queda lista para el set ilustrado D-288 — cuando lleguen
 * los assets entran por AvatarMascota y este componente no cambia)
 * + invitación en voz humana.
 * Con foto: preview circular + "Cambiar" / "Quitar".
 *
 * Captura: infraestructura compartida capturaFoto (extraída de
 * EvidenciaFoto — cero módulos nativos nuevos, L-134) con recorte
 * CUADRADO nativo (allowsEditing 1:1). El resize ~800px queda como
 * costura documentada DENTRO del helper (exige expo-image-manipulator
 * → rebuild, prohibido hoy); width/height reales viajan en el valor.
 *
 * Memorial (Ley 8): sin tintes propios; la Hoja degrada sola y
 * AvatarMascota ya degrada su huella.
 *
 * A11y: botón con estado anunciado ("Sin foto" / "Foto elegida");
 * las tres acciones de la Hoja son Celdas navegables.
 */

import { useRef, useState } from 'react'
import { Linking, Pressable, Text, View } from 'react-native'
import { Image, type ImageSource } from 'expo-image'

import { typography } from '../tokens/typography'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { opacity } from '../tokens/opacity'
import { useTheme } from '../ThemeProvider'
import { AvatarMascota, type AvatarMascotaEspecie } from './AvatarMascota'
import { Boton } from './Boton'
import { Celda } from './Celda'
import { Hoja } from './Hoja'
import { capturarConCamara, capturarDeGaleria } from './capturaFoto'

const DIAMETRO = 96 // lg de AvatarMascota: el círculo grande del onboarding

export interface SelectorAvatarFoto {
  /** string en producto (uri del picker); require() solo galería/tests. */
  uri: string | number | ImageSource
  width: number
  height: number
}

export interface SelectorAvatarProps {
  /** Nombre de la mascota (a11y del avatar y del botón). */
  nombre: string
  /** Código real de cat_especies — la huella la ilustrará D-288. */
  especie?: AvatarMascotaEspecie
  /** La pantalla es dueña del valor. */
  foto?: SelectorAvatarFoto | null
  /** foto nueva al elegir · null al "Quitar". "Por ahora no" NO llama. */
  onCambiar: (foto: SelectorAvatarFoto | null) => void
  /** Invitación en voz humana bajo el círculo. */
  invitacion?: string
  deshabilitado?: boolean
}

export function SelectorAvatar({
  nombre,
  especie,
  foto = null,
  onCambiar,
  invitacion = 'Agregale una foto',
  deshabilitado = false,
}: SelectorAvatarProps) {
  const { theme } = useTheme()
  const [hojaAbierta, setHojaAbierta] = useState(false)
  const [permisoDenegado, setPermisoDenegado] = useState(false)
  // Cerrojo sincrónico (patrón EvidenciaFoto): dos taps antes del próximo
  // render no lanzan dos pickers.
  const lanzandoRef = useRef(false)

  const entregar = (r: Awaited<ReturnType<typeof capturarConCamara>>) => {
    if (r.tipo === 'permiso_denegado') {
      setPermisoDenegado(true)
      return
    }
    setPermisoDenegado(false)
    if (r.tipo === 'foto') onCambiar(r.foto)
  }

  // recorte 1:1 + resize ~800 (lección v2; costura activada S45-B5.4 —
  // en builds sin el manipulator degrada a la original sin romper)
  async function tomarFoto() {
    if (lanzandoRef.current) return
    lanzandoRef.current = true
    setHojaAbierta(false)
    try {
      entregar(await capturarConCamara({ recorteCuadrado: true, redimensionarA: 800 }))
    } finally {
      lanzandoRef.current = false
    }
  }

  async function elegirDeGaleria() {
    if (lanzandoRef.current) return
    lanzandoRef.current = true
    setHojaAbierta(false)
    try {
      entregar(await capturarDeGaleria({ recorteCuadrado: true, redimensionarA: 800 }))
    } finally {
      lanzandoRef.current = false
    }
  }

  const conFoto = foto !== null && foto !== undefined

  return (
    <View style={{ alignItems: 'center', opacity: deshabilitado ? opacity.disabled : 1 }}>
      <Pressable
        onPress={() => {
          if (!deshabilitado) setHojaAbierta(true)
        }}
        disabled={deshabilitado}
        accessibilityRole="button"
        accessibilityLabel={`Foto de ${nombre}`}
        accessibilityValue={{ text: conFoto ? 'Foto elegida' : 'Sin foto' }}
        accessibilityHint="Abre las opciones para tomar o elegir una foto"
        style={{ alignItems: 'center', gap: spacing[2] }}
      >
        {conFoto ? (
          <View
            style={{
              width: DIAMETRO,
              height: DIAMETRO,
              borderRadius: radius.full,
              overflow: 'hidden',
            }}
          >
            <Image
              source={typeof foto.uri === 'string' ? { uri: foto.uri } : foto.uri}
              contentFit="cover"
              transition={0}
              style={{ width: '100%', height: '100%' }}
            />
          </View>
        ) : (
          <AvatarMascota nombre={nombre} especie={especie} tamano="lg" />
        )}
        {!conFoto ? (
          <Text
            style={{
              fontFamily: typography.family.sans.regular,
              fontSize: typography.size.base,
              color: theme.text.secondary,
            }}
          >
            {invitacion}
          </Text>
        ) : null}
      </Pressable>

      {conFoto ? (
        <View style={{ flexDirection: 'row', gap: spacing[2] }}>
          <Boton variante="ghost" tamaño="sm" etiqueta="Cambiar" onPress={() => setHojaAbierta(true)} />
          <Boton variante="ghost" tamaño="sm" etiqueta="Quitar" onPress={() => onCambiar(null)} />
        </View>
      ) : null}

      {permisoDenegado ? (
        <View
          style={{
            marginTop: spacing[3],
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
            Necesitamos la cámara para la foto de {nombre}. Podés habilitarla desde los ajustes del
            teléfono, o elegir una foto de la galería.
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
            <Boton variante="ghost" tamaño="sm" etiqueta="Elegir de la galería" onPress={() => void elegirDeGaleria()} />
          </View>
        </View>
      ) : null}

      <Hoja visible={hojaAbierta} onCerrar={() => setHojaAbierta(false)} titulo={`Foto de ${nombre}`}>
        {/* Identidad: cámara y galería PARES; "Por ahora no" primera clase. */}
        <Celda interactiva onPress={() => void tomarFoto()} accessibilityRole="button" titulo="Tomar foto" />
        <Celda
          interactiva
          onPress={() => void elegirDeGaleria()}
          accessibilityRole="button"
          titulo="Elegir de la galería"
        />
        <Celda
          interactiva
          onPress={() => setHojaAbierta(false)}
          accessibilityRole="button"
          titulo="Por ahora no"
        />
      </Hoja>
    </View>
  )
}
