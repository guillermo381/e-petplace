// ═══════════════════════════════════════════════════════════════════════
// LÁMINA S74 — LA FUSIÓN DEL AVATAR DEL ENTITY CHIP (gate en dispositivo)
//
// El porqué del medio (orden de mesa S74): las capturas se renderizan en
// Chromium, que SÍ aplica borderCurve — el mismo medio que produjo el
// engaño no puede desmentirlo. La fusión es un fenómeno de DISPOSITIVO
// Android y se juzga ahí o no se juzga.
//
// TRES variantes montadas juntas, con las fotos REALES de las mascotas de
// la familia de la sesión, claro y oscuro, a tamaño real de uso:
//   (a) como está hoy — squircle 32% + borderCurve del AvatarMascota
//   (b) radio del avatar DERIVADO del radio del chip menos el inset
//       (22 − 4 = 18), sin borderCurve
//   (c) (b) + borderCurve 'continuous'
// Rotuladas a/b/c SIN preferencia declarada — el founder elige a ciegas.
//
// NO toca el chip de producción: la réplica vive acá. MUERE con la firma
// del founder (Ley 37 — precedente: la lámina S73, 63fe014/daf196f).
// Voz: rótulos técnicos de lámina, fuera del riel A PROPÓSITO (material
// de gate efímero, precedente galería S73; declarado, no descuido).
// Camino declarado (L-161): Cuenta → "Lámina S74 · la fusión del avatar"
// (entrada temporal) · alterno: deep link cliente://lamina-fusion.
// ═══════════════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  AvatarMascota,
  Encabezado,
  ThemeProvider,
  useTheme,
  spacing,
  radius,
  typography,
} from '@epetplace/ui'
import {
  getEstadoOnboardingDueno,
  obtenerMascotasDeFamilia,
  resolverUrlsFotos,
} from '@epetplace/api'
import { router } from 'expo-router'

// La geometría de producción, copiada LITERAL (la lámina no importa el
// chip real a propósito — compara variantes que producción no tiene).
const ALTO = 44
const TALLA = 52
const SOBRA = (TALLA - ALTO) / 2
const RADIO_DERIVADO = ALTO / 2 - SOBRA // 22 − 4 = 18

type Variante = 'a' | 'b' | 'c'

function AvatarLamina({
  variante,
  nombre,
  fotoUrl,
  sobreLleno,
}: {
  variante: Variante
  nombre: string
  fotoUrl: string | null
  sobreLleno: boolean
}) {
  const { theme } = useTheme()
  if (variante === 'a') {
    return <AvatarMascota nombre={nombre} fotoUrl={fotoUrl ?? undefined} tamano="entidad" sobreLleno={sobreLleno} />
  }
  const radio = RADIO_DERIVADO
  return (
    <View
      style={{
        width: TALLA,
        height: TALLA,
        borderRadius: radio,
        ...(variante === 'c' ? { borderCurve: 'continuous' as const } : null),
        overflow: 'hidden',
        backgroundColor: sobreLleno ? 'rgba(255,255,255,0.16)' : theme.bg.overlay,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {fotoUrl !== null ? (
        <Image source={{ uri: fotoUrl }} contentFit="cover" style={{ width: '100%', height: '100%' }} />
      ) : (
        <Text
          style={{
            fontFamily: typography.family.sans.medium,
            fontSize: 18,
            color: sobreLleno ? '#FFFFFF' : theme.text.secondary,
          }}
        >
          {nombre.slice(0, 1).toUpperCase()}
        </Text>
      )}
    </View>
  )
}

function ChipLamina({
  variante,
  nombre,
  fotoUrl,
  elegido,
}: {
  variante: Variante
  nombre: string
  fotoUrl: string | null
  elegido: boolean
}) {
  const { theme } = useTheme()
  const hayLleno = 'controlLleno' in theme.accent
  const fondo =
    elegido && hayLleno
      ? (theme.accent as { controlLleno: string }).controlLleno
      : theme.mode === 'dark'
        ? theme.bg.elevated
        : theme.bg.card
  return (
    <View style={{ flexBasis: '48%', maxWidth: 240, flexGrow: 0 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: ALTO,
          paddingLeft: TALLA + spacing[2],
          paddingRight: spacing[4],
          borderTopLeftRadius: ALTO / 2,
          borderBottomLeftRadius: ALTO / 2,
          borderTopRightRadius: radius.suave,
          borderBottomRightRadius: radius.suave,
          backgroundColor: fondo,
          boxShadow: theme.elevacion.reposo,
        }}
      >
        <View style={{ position: 'absolute', left: 0, top: -SOBRA, width: TALLA, height: TALLA }}>
          <AvatarLamina variante={variante} nombre={nombre} fotoUrl={fotoUrl} sobreLleno={elegido && hayLleno} />
        </View>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: typography.family.sans.medium,
            fontSize: 15,
            color: elegido && hayLleno ? '#FFFFFF' : theme.text.primary,
          }}
        >
          {nombre}
        </Text>
      </View>
    </View>
  )
}

function BloqueTema({
  rotulo,
  mascotas,
}: {
  rotulo: string
  mascotas: { nombre: string; fotoUrl: string | null }[]
}) {
  const { theme } = useTheme()
  const m0 = mascotas[0]
  const m1 = mascotas[1] ?? mascotas[0]
  return (
    <View style={{ backgroundColor: theme.bg.base, padding: spacing[5], gap: spacing[5], borderRadius: radius.suave }}>
      <Text style={{ fontFamily: typography.family.mono.regular, fontSize: 12, color: theme.text.secondary }}>
        {rotulo}
      </Text>
      {(['a', 'b', 'c'] as const).map((v) => (
        <View key={v} style={{ gap: spacing[2] }}>
          <Text style={{ fontFamily: typography.family.mono.medium, fontSize: 13, color: theme.text.primary }}>
            {v}
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing[3], paddingTop: SOBRA }}>
            {m0 ? <ChipLamina variante={v} nombre={m0.nombre} fotoUrl={m0.fotoUrl} elegido /> : null}
            {m1 ? <ChipLamina variante={v} nombre={m1.nombre} fotoUrl={m1.fotoUrl} elegido={false} /> : null}
          </View>
        </View>
      ))}
    </View>
  )
}

export default function LaminaFusion() {
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const [mascotas, setMascotas] = useState<{ nombre: string; fotoUrl: string | null }[] | null>(null)

  useEffect(() => {
    let vigente = true
    void (async () => {
      const estado = await getEstadoOnboardingDueno()
      if (!vigente || !estado.ok || estado.data.familia_id === null) {
        if (vigente) setMascotas([])
        return
      }
      const r = await obtenerMascotasDeFamilia(estado.data.familia_id)
      if (!vigente || !r.ok) {
        if (vigente) setMascotas([])
        return
      }
      const dos = r.data.slice(0, 2)
      const paths = dos.map((m) => m.foto_url).filter((p): p is string => typeof p === 'string' && p.length > 0)
      const urls = paths.length > 0 ? await resolverUrlsFotos(paths) : new Map<string, string>()
      if (!vigente) return
      setMascotas(
        dos.map((m) => ({
          nombre: m.nombre,
          fotoUrl: m.foto_url ? (urls.get(m.foto_url) ?? null) : null,
        })),
      )
    })()
    return () => {
      vigente = false
    }
  }, [])

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base, paddingTop: insets.top }}>
      <Encabezado variante="navegacion" titulo="Lámina S74" atras onAtras={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[6], paddingBottom: insets.bottom + spacing[8] }}>
        <Text style={{ fontFamily: typography.family.sans.regular, fontSize: 14, color: theme.text.secondary }}>
          La fusión del avatar con el chip — tres variantes, mismas fotos, tamaño real. Elegí a, b o c
          mirando la esquina donde el avatar encuentra al chip, en claro y en oscuro.
        </Text>
        {mascotas === null ? null : mascotas.length === 0 ? (
          <Text style={{ fontFamily: typography.family.sans.regular, fontSize: 14, color: theme.text.secondary }}>
            No pudimos cargar las mascotas de tu familia — la lámina necesita la sesión con Thor y Zeus.
          </Text>
        ) : (
          <>
            <ThemeProvider mode="light">
              <BloqueTema rotulo="claro" mascotas={mascotas} />
            </ThemeProvider>
            <ThemeProvider mode="dark">
              <BloqueTema rotulo="oscuro" mascotas={mascotas} />
            </ThemeProvider>
          </>
        )}
      </ScrollView>
    </View>
  )
}
