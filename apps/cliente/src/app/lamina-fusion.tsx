// ═══════════════════════════════════════════════════════════════════════
// LÁMINA S74 v2 — EL ENTITY CHIP EN DISPOSITIVO: sombra · material
// (sobre la GEOMETRÍA YA CURADA — orden de mesa: el founder no vuelve a
// juzgar variantes que arrastran un problema resuelto)
//
// REGISTRO DE LA v1 (su trabajo está hecho, Ley 37): el founder eligió
// **B** en su Android y declaró que aún NO fusiona (B = la mejor de
// tres, no un "resuelto"). La geometría quedó CURADA EN PRODUCCIÓN
// (AvatarMascota entidad: radio derivado 18 + borderCurve = C — B más
// una mejora gratis en iOS; en Android b y c eran PÍXELES IDÉNTICOS,
// salvedad registrada: la lámina no podía separar b de c en el
// dispositivo del gate — candidata a nota del estándar de láminas).
// E4 de la vara de B (ClipPath + react-native-svg) MUERTA: la geometría
// se resolvió sin librería nueva. La sección a/b/c se retiró de la v2.
//
// SECCIÓN 1 · LA SOMBRA (gate founder: "tan sutil que no se nota, se ve
// en 2D" — L-153: el registro de B se da vuelta, pasa a cura D-507).
// Valores VIVOS relevados (tokens/elevacion.ts): claro reposo = dos
// capas tinta cálida 5%/6% blur 2/8 · oscuro reposo = SOLO contacto
// rgba(0,0,0,0.45) blur 2 (en oscuro casi no hay sombra POR DISEÑO — si
// el founder miraba en oscuro, miraba el mínimo que B midió). Tres
// escalones 1/2/3 (1 = el token actual, la referencia); la elegida entra
// al TOKEN (D-507) — estas cadenas son candidatos de lámina, no sombras
// de producto (la prohibición de artesanales sigue viva; mueren con la
// firma). Ley 20: sombra SÍ, hairline NO — cero bordes acá.
//
// SECCIÓN 2 · EL MATERIAL (diagnóstico founder: adentro del avatar hay
// una foto CON SU PROPIO FONDO — segunda materia dentro del chip).
// Prueba MANUAL, cero pipeline: el chip con la foto tal cual VS el mismo
// chip con la PNG de Thor recortada A MANO (Vision de macOS sobre la
// foto real; verificada a ojo: bordes intactos). RELEVADO ANTES
// (mandato): AvatarMascota pinta fondo SIEMPRE detrás de la foto
// (bg.overlay/capaBg) — una PNG transparente en PRODUCCIÓN mostraría ese
// fondo y la prueba no valdría; acá el contenedor del recorte es
// TRANSPARENTE (cura local de lámina, declarada; la cura real viaja con
// D-506). El avatar POR DEFECTO en PNG lo provee el founder: slot
// cableado — colocar assets/lamina/avatar-defecto.png y apuntar
// AVATAR_DEFECTO al require (un toque). Requisito de formato declarado:
// PNG con canal alpha @2x/@3x (o SVG por react-native-svg — preferible
// por densidades), gate founder POR PIEZA (DIRECCION_ARTE §6).
//
// NO toca el chip de producción (réplica local). MUERE con las firmas
// (Ley 37 — precedente lámina S73). Voz: rótulos técnicos de lámina,
// fuera del riel A PROPÓSITO (material de gate efímero, precedente
// galería S73; declarado). PROPORCIÓN 52/44: SIGUE PROVISIONAL — se
// firma cuando la forma se estabilice.
// Camino declarado (L-161): Cuenta → "Lámina S74 · la fusión del avatar"
// · alterno: deep link cliente://lamina-fusion.
// ═══════════════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { Image, type ImageSource } from 'expo-image'
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

// Geometría de producción, copiada literal (réplica de lámina).
const ALTO = 44
const TALLA = 52
const SOBRA = (TALLA - ALTO) / 2
const RADIO_CURADO = ALTO / 2 - SOBRA // 18 — la geometría firmada (C)

// PNG recortada A MANO (Vision macOS sobre la foto real de Thor,
// 256×256 con alpha). Material de lámina: muere con la firma.
const THOR_RECORTE = require('../../assets/lamina/thor-recorte.png') as number

// El avatar por defecto del founder — cuando entregue el PNG:
// colocarlo en assets/lamina/avatar-defecto.png y apuntar este require.
const AVATAR_DEFECTO: number | null = null

// Escalones de sombra (candidatos del token D-507; el 1 es el token
// vivo de reposo — la referencia). Sin hairline: Ley 20.
const ESCALONES_SOMBRA: Record<'light' | 'dark', [string, string, string]> = {
  light: [
    '0 1px 2px rgba(31,27,22,0.05), 0 2px 8px rgba(31,27,22,0.06)', // token reposo HOY
    '0 2px 4px rgba(31,27,22,0.10), 0 4px 12px rgba(31,27,22,0.12)',
    '0 3px 6px rgba(31,27,22,0.16), 0 8px 20px rgba(31,27,22,0.20)',
  ],
  dark: [
    '0 1px 2px rgba(0,0,0,0.45)', // token reposo HOY (solo contacto)
    '0 2px 6px rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.35)',
    '0 4px 10px rgba(0,0,0,0.65), 0 8px 24px rgba(0,0,0,0.45)',
  ],
}

type FotoLamina = { uri?: string; asset?: number; transparente?: boolean }
type MascotaLamina = { nombre: string; fotoUrl: string | null }

function AvatarLamina({
  nombre,
  foto,
  sobreLleno,
}: {
  nombre: string
  foto: FotoLamina | null
  sobreLleno: boolean
}) {
  const { theme } = useTheme()
  // Sin asset especial: el AvatarMascota REAL — ya porta la geometría
  // curada (radio derivado 18 + borderCurve).
  if (foto?.asset === undefined && foto?.transparente !== true) {
    return <AvatarMascota nombre={nombre} fotoUrl={foto?.uri} tamano="entidad" sobreLleno={sobreLleno} />
  }
  // Réplica con la MISMA geometría curada, contenedor TRANSPARENTE — el
  // punto de la prueba de material (producción pinta fondo: D-506).
  const source: ImageSource | number | null =
    foto?.asset !== undefined ? foto.asset : foto?.uri !== undefined ? { uri: foto.uri } : null
  return (
    <View
      style={{
        width: TALLA,
        height: TALLA,
        borderRadius: RADIO_CURADO,
        borderCurve: 'continuous',
        overflow: 'hidden',
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {source !== null ? (
        <Image source={source} contentFit="cover" style={{ width: '100%', height: '100%' }} />
      ) : null}
    </View>
  )
}

function ChipLamina({
  nombre,
  foto,
  elegido,
  sombra,
}: {
  nombre: string
  foto: FotoLamina | null
  elegido: boolean
  sombra?: string
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
          boxShadow: sombra ?? theme.elevacion.reposo,
        }}
      >
        <View style={{ position: 'absolute', left: 0, top: -SOBRA, width: TALLA, height: TALLA }}>
          <AvatarLamina nombre={nombre} foto={foto} sobreLleno={elegido && hayLleno} />
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

function Rotulo({ texto }: { texto: string }) {
  const { theme } = useTheme()
  return (
    <Text style={{ fontFamily: typography.family.mono.medium, fontSize: 13, color: theme.text.primary }}>
      {texto}
    </Text>
  )
}

function FilaPar({
  m0,
  m1,
  foto0,
  foto1,
  sombra,
}: {
  m0: MascotaLamina
  m1: MascotaLamina
  foto0?: FotoLamina | null
  foto1?: FotoLamina | null
  sombra?: string
}) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing[3], paddingTop: SOBRA }}>
      <ChipLamina
        nombre={m0.nombre}
        foto={foto0 !== undefined ? foto0 : m0.fotoUrl !== null ? { uri: m0.fotoUrl } : null}
        elegido
        sombra={sombra}
      />
      <ChipLamina
        nombre={m1.nombre}
        foto={foto1 !== undefined ? foto1 : m1.fotoUrl !== null ? { uri: m1.fotoUrl } : null}
        elegido={false}
        sombra={sombra}
      />
    </View>
  )
}

function BloqueTema({ rotulo, mascotas }: { rotulo: string; mascotas: MascotaLamina[] }) {
  const { theme } = useTheme()
  const m0 = mascotas[0]
  const m1 = mascotas[1] ?? mascotas[0]
  if (!m0 || !m1) return null
  const modo: 'light' | 'dark' = theme.mode === 'dark' ? 'dark' : 'light'
  return (
    <View style={{ backgroundColor: theme.bg.base, padding: spacing[5], gap: spacing[5], borderRadius: radius.suave }}>
      <Text style={{ fontFamily: typography.family.mono.regular, fontSize: 12, color: theme.text.secondary }}>
        {rotulo}
      </Text>

      {/* ── 1 · LA SOMBRA: escalones 1 / 2 / 3 (1 = el token de hoy) ── */}
      <Rotulo texto="1 · sombra — 1 / 2 / 3" />
      {modo === 'dark' ? (
        <Text style={{ fontFamily: typography.family.sans.regular, fontSize: 12, color: theme.text.secondary }}>
          ojo: en oscuro la elevación HOY se delega al paso de luminancia (convención deliberada
          del sistema — la sombra es solo contacto). Elegir 2 o 3 acá es una DESVIACIÓN CONSCIENTE
          de esa convención y quedará escrita en el token (D-507) — para que nadie la
          &quot;corrija&quot; después citando el sistema.
        </Text>
      ) : null}
      {ESCALONES_SOMBRA[modo].map((s, i) => (
        <View key={i} style={{ gap: spacing[2] }}>
          <Rotulo texto={String(i + 1)} />
          <FilaPar m0={m0} m1={m1} sombra={s} />
        </View>
      ))}

      {/* ── 2 · EL MATERIAL: los CUATRO — mismo sujeto (Thor), foto y
          recorte, cada uno en LLENO y NO-LLENO (el no-lleno es el caso
          MAYORITARIO de una fila: el lleno es uno, el resto no) ── */}
      <Rotulo texto="2 · material (mismo sujeto, lleno · no-lleno)" />
      <View style={{ gap: spacing[2] }}>
        <Rotulo texto="foto tal cual" />
        <FilaPar
          m0={m0}
          m1={m0}
          foto0={m0.fotoUrl !== null ? { uri: m0.fotoUrl } : null}
          foto1={m0.fotoUrl !== null ? { uri: m0.fotoUrl } : null}
        />
      </View>
      <View style={{ gap: spacing[2] }}>
        <Rotulo texto="recorte a mano (png alpha)" />
        <FilaPar
          m0={m0}
          m1={m0}
          foto0={{ asset: THOR_RECORTE, transparente: true }}
          foto1={{ asset: THOR_RECORTE, transparente: true }}
        />
      </View>
      <View style={{ gap: spacing[2] }}>
        <Rotulo texto="avatar por defecto (png del founder)" />
        {AVATAR_DEFECTO !== null ? (
          <FilaPar
            m0={m0}
            m1={m1}
            foto0={{ asset: AVATAR_DEFECTO, transparente: true }}
            foto1={{ asset: AVATAR_DEFECTO, transparente: true }}
          />
        ) : (
          <Text style={{ fontFamily: typography.family.sans.regular, fontSize: 13, color: theme.text.secondary }}>
            esperando el png del founder — el slot está cableado
            (assets/lamina/avatar-defecto.png)
          </Text>
        )}
      </View>
    </View>
  )
}

export default function LaminaFusion() {
  const insets = useSafeAreaInsets()
  const { theme } = useTheme()
  const [mascotas, setMascotas] = useState<MascotaLamina[] | null>(null)

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
          Dos preguntas, sobre la geometría ya curada, en claro y en oscuro. 1: cuánta sombra
          necesita el chip para despegar del 2D (1/2/3 — el 1 es la de hoy). 2: la materia — la
          foto con su fondo vs el recorte con fondo transparente.
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
