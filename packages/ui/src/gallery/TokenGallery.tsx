/**
 * TokenGallery — herramienta de VERIFICACIÓN de B2 (no pantalla de producto).
 * Montada en /gallery de ambos apps. Muestra: paleta con hex, escala
 * tipográfica con la REGLA DE VOZ demostrada, espaciado/radios/sombras,
 * los 3 temas con toggle, isotipo en variantes y las dos cards de dosis.
 */

import { Pressable, ScrollView, Text, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

import { useState } from 'react'

import { palette, gradients } from '../tokens/palette'
import { typography } from '../tokens/typography'
import { spacing } from '../tokens/spacing'
import { radius } from '../tokens/radius'
import { ThemeProvider, useTheme } from '../ThemeProvider'
import { Isotipo } from '../brand/Isotipo'
import { Boton, type BotonVariante } from '../components/Boton'
import { Tarjeta, type TarjetaTinte } from '../components/Tarjeta'
import { Campo } from '../components/Campo'
import { Celda } from '../components/Celda'
import { Separador } from '../components/Separador'
import { Insignia } from '../components/Insignia'
import { Encabezado } from '../components/Encabezado'
import { BarraTabs, type BarraTabsItem } from '../components/BarraTabs'
import { Hoja, type HojaAltura } from '../components/Hoja'
import { CitaEnVivo } from '../components/CitaEnVivo'
import { Esqueleto, EsqueletoGrupo } from '../components/Esqueleto'
import { AvatarMascota } from '../components/AvatarMascota'
import { SelectorEspecie, type SelectorEspecieOpcion } from '../components/SelectorEspecie'
import { CampoFecha, type CampoFechaValor } from '../components/CampoFecha'
import { SelectorAvatar, type SelectorAvatarFoto } from '../components/SelectorAvatar'
import { SelectorOpcion } from '../components/SelectorOpcion'
import { SelectorSegmentado } from '../components/SelectorSegmentado'
import { SliderPrecio } from '../components/SliderPrecio'
import { Interruptor } from '../components/Interruptor'
import { StepperCantidad } from '../components/StepperCantidad'
import { CeldaNavegacion } from '../components/CeldaNavegacion'
import { HeroMarca } from '../components/HeroMarca'
import { LineaDeVida, type LineaDeVidaItem } from '../components/LineaDeVida'
import { VisorFoto } from '../components/VisorFoto'
import { FichaVacuna } from '../components/FichaVacuna'
import { FichaMascotaHogar } from '../components/FichaMascotaHogar'
import { Icono, type IconoNombre } from '../components/Icono'
import { EsperaDeMarca } from '../brand/EsperaDeMarca'
import { Guijarro } from '../brand/Guijarro'
import { Cronometro } from '../components/Cronometro'
import { EvidenciaFoto, type EvidenciaFotoEstado } from '../components/EvidenciaFoto'
import { MapaRecorrido } from '../components/MapaRecorrido'

// Foto local de ejemplo (generada, sin URL remota) — demuestra cover,
// recorte circular y la desaturación memorial.
const FOTO_MASCOTA_EJEMPLO = require('../../assets/gallery/mascota-ejemplo.png')
import { AvisoProvider, useAviso } from '../components/Aviso'
import { EstadoVacio } from '../components/EstadoVacio'
import type { ThemeMode } from '../themes'

const sans = typography.family.sans
const mono = typography.family.mono

// ── swatch ────────────────────────────────────────────────────────────────────
function Swatch({ name, hex, border }: { name: string; hex: string; border?: boolean }) {
  const { theme } = useTheme()
  return (
    <View style={{ width: 104, marginBottom: spacing[3] }}>
      <View
        style={{
          height: 56,
          borderRadius: radius.sm,
          backgroundColor: hex,
          borderWidth: border ? 1 : 0,
          borderColor: theme.border.default,
        }}
      />
      <Text style={{ fontFamily: sans.medium, fontSize: typography.size.xs, color: theme.text.primary, marginTop: 4 }}>
        {name}
      </Text>
      <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.secondary }}>
        {hex.toLowerCase()}
      </Text>
    </View>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  const { theme } = useTheme()
  return (
    <View style={{ marginBottom: spacing[10] }}>
      <Text
        style={{
          fontFamily: sans.bold,
          fontSize: typography.size.md,
          color: theme.text.primary,
          marginBottom: spacing[4],
        }}
      >
        {titulo}
      </Text>
      {children}
    </View>
  )
}

function Fila({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] }}>{children}</View>
}

// ── Panel por tema: se monta bajo un ThemeProvider anidado con el modo
// fijo — las secciones que lo usan muestran los 3 temas a la vez ─────────────
function PanelTema({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  const { theme } = useTheme()
  return (
    <View
      style={{
        backgroundColor: theme.bg.base,
        borderRadius: radius.md,
        padding: spacing[5],
        paddingTop: spacing[6],
        borderWidth: 1,
        borderColor: theme.border.default,
      }}
    >
      <Text
        style={{
          fontFamily: sans.medium,
          fontSize: typography.size.xs,
          color: theme.text.secondary,
          marginBottom: spacing[4],
        }}
      >
        {etiqueta}
      </Text>
      {children}
    </View>
  )
}

function EjemploCitaEnVivo() {
  return (
    <CitaEnVivo capa="cuidado">
      <Tarjeta elevacion="plana" relleno="ninguno">
        <Celda
          titulo="Zeus"
          subtitulo="Paseo · familia González"
          inicio={<Insignia capa="cuidado" soloPunto etiqueta="Capa cuidado" />}
          metadataMono="17:30 · 45 min"
        />
      </Tarjeta>
    </CitaEnVivo>
  )
}

// Las 6 familias F1 reales de cat_especies post-D-287 (orden_display).
const ESPECIES_F1: SelectorEspecieOpcion[] = [
  { codigo: 'perro', nombre: 'Perro' },
  { codigo: 'gato', nombre: 'Gato' },
  { codigo: 'conejo', nombre: 'Conejo' },
  { codigo: 'ave', nombre: 'Ave' },
  { codigo: 'roedor', nombre: 'Roedor' },
  { codigo: 'pez', nombre: 'Pez' },
]

function EjemploSelectorEspecie() {
  const [especie, setEspecie] = useState<string | undefined>('conejo')
  return (
    <SelectorEspecie
      opciones={ESPECIES_F1}
      seleccionada={especie}
      onSelect={setEspecie}
      etiqueta="¿Qué especie es tu mascota?"
    />
  )
}

function EjemploHeroMarca() {
  const { theme } = useTheme()
  const esMemorial = theme.mode === 'memorial'
  return (
    <View style={{ gap: spacing[4], borderRadius: radius.md, overflow: 'hidden' }}>
      {/* techo={false}: en la galería se muestra fuera de posición —
          en pantalla real el techo absorbe la safe area solo (S59) */}
      <HeroMarca titulo="Bienvenido a la familia" variante="alto" techo={false}>
        <Text
          style={{
            fontFamily: sans.regular,
            fontSize: typography.size.base,
            color: esMemorial ? theme.text.secondary : theme.text.onGradient,
            marginTop: spacing[2],
          }}
        >
          Contanos de tu mascota y armamos su expediente.
        </Text>
      </HeroMarca>
      <HeroMarca titulo="Su primera foto" variante="compacto" techo={false} />
      {/* techoVivo (S58, patrón Hogar v2): la base curva 44/26 se ve
          contra el fondo — sin overflow hidden del wrapper */}
      <View>
        <HeroMarca titulo="Buenas tardes, Guillermo" variante="techoVivo" techo={false} />
      </View>
    </View>
  )
}

// Mock con el shape REAL del wrapper leerTimelineMascota (S45-B5.1):
// los 2 paseos de Zeus + un tipo desconocido para ver la degradación.
function itemsLineaDeVida(): LineaDeVidaItem[] {
  const hoy = new Date()
  const iso = (h: number, m: number, diasAtras = 0) =>
    new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - diasAtras, h, m).toISOString()
  return [
    {
      evento_id: 'mock-0',
      tipo: 'vacuna_aplicada',
      eje_jtbd: 'salud',
      fecha_evento: iso(11, 30),
      titulo_fuente: null,
      vacuna_nombre: 'Rabisin',
      // S48-B6.3: la vacuna es fecha-sola — día en partes UTC, sin hora
      fecha_sola: true,
    },
    {
      evento_id: 'mock-1',
      tipo: 'atencion_paseo_registrada',
      eje_jtbd: 'salud',
      fecha_evento: iso(9, 54),
      titulo_fuente: '[DEMO S44] Paseos Andres',
      duracion_min: 20,
      fotos_count: 1,
      fotos: [FOTO_MASCOTA_EJEMPLO],
    },
    {
      evento_id: 'mock-2',
      tipo: 'atencion_paseo_registrada',
      eje_jtbd: 'salud',
      fecha_evento: iso(4, 13),
      titulo_fuente: '[DEMO S44] Paseos Andres',
      duracion_min: 54,
      fotos_count: 3,
      fotos: [FOTO_MASCOTA_EJEMPLO, FOTO_MASCOTA_EJEMPLO],
    },
    {
      // tipo que el diccionario NO conoce → nodo genérico digno por eje
      evento_id: 'mock-3',
      tipo: 'vacuna_aplicada_v9',
      eje_jtbd: 'salud',
      fecha_evento: iso(16, 30, 1),
      titulo_fuente: null,
      duracion_min: null,
      fotos_count: 0,
    },
  ]
}

function EjemploVisorFoto() {
  const [abierto, setAbierto] = useState(false)
  return (
    <>
      <Boton variante="secundario" etiqueta="Abrir visor (2 fotos)" onPress={() => setAbierto(true)} />
      <VisorFoto
        visible={abierto}
        onCerrar={() => setAbierto(false)}
        fotos={[FOTO_MASCOTA_EJEMPLO, FOTO_MASCOTA_EJEMPLO]}
        etiqueta="Fotos del paseo"
      />
    </>
  )
}

function EjemploFichaVacuna() {
  // Los 4 casos de datos (pressed es vivo: tocá una ficha — 0.99 de Tarjeta).
  // S48: "sin tipo" es completa NEUTRA (tipo null no tiñe); dudosa = solo sin fecha.
  return (
    <View style={{ gap: spacing[3] }}>
      <FichaVacuna
        nombre="Rabisin"
        tipoVacuna="antirrábica"
        fechaAplicada="2026-05-01"
        fechaProxima="2027-05-01"
        veterinario="CPA Teusaquillo"
        lote="L-777"
        onEditar={() => {}}
        onDescartar={() => {}}
      />
      <FichaVacuna
        nombre="KC"
        tipoVacuna={null}
        fechaAplicada="2026-06-15"
        onEditar={() => {}}
        onDescartar={() => {}}
      />
      <FichaVacuna
        nombre="Nobivac DHPPi"
        tipoVacuna="séxtuple"
        fechaAplicada={null}
        onEditar={() => {}}
        onDescartar={() => {}}
      />
      <FichaVacuna
        nombre="Peeknrb"
        tipoVacuna={null}
        fechaAplicada="2026-06-15"
        rechazada
        onEditar={() => {}}
        onDescartar={() => {}}
      />
    </View>
  )
}


function EjemploSetBPrima() {
  // El lote 1 firmado (DIRECCION_ARTE §6) — cada ícono a su tamaño de
  // diseño (28) Y la fila de 21px (§2.9: el gate del founder corre acá;
  // si a 21 la huella no se lee, se simplifica el ícono).
  const LOTE: IconoNombre[] = ['paseo', 'veterinaria', 'grooming', 'refugio', 'despensa', 'coach']
  // LOTE 3 (S58, D-361 — gate founder POR ÍCONO en la fila de 21px):
  const LOTE3: IconoNombre[] = [
    'hogar', 'explorar', 'cuenta', 'hoy', 'negocio', 'carnet', 'familia',
    'preferencias', 'pagos', 'ayuda', 'ubicacion', 'training', 'hotel',
    'guarderia', 'seguros', 'telemedicina', 'vacaciones', 'equipo',
    'prime', 'primeCorona', // concepto 19: el founder ELIGE a 21px
  ]
  return (
    <View style={{ gap: spacing[4] }}>
      <View style={{ flexDirection: 'row', gap: spacing[5], alignItems: 'center', flexWrap: 'wrap' }}>
        {LOTE.map((n) => (
          <View key={n} style={{ alignItems: 'center', gap: spacing[1] }}>
            <Icono nombre={n} tamano={28} />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: spacing[5], alignItems: 'center', flexWrap: 'wrap' }}>
        {LOTE.map((n) => (
          <Icono key={n} nombre={n} tamano={21} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: spacing[5], alignItems: 'center', flexWrap: 'wrap' }}>
        {LOTE.map((n) => (
          <Icono key={n} nombre={n} tamano={28} registro="aa" />
        ))}
      </View>
      {/* LOTE 3 (S58, D-361): 28 de diseño + la fila del gate a 21px */}
      <View style={{ flexDirection: 'row', gap: spacing[4], alignItems: 'center', flexWrap: 'wrap' }}>
        {LOTE3.map((n) => (
          <Icono key={n} nombre={n} tamano={28} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: spacing[4], alignItems: 'center', flexWrap: 'wrap' }}>
        {LOTE3.map((n) => (
          <Icono key={n} nombre={n} tamano={21} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: spacing[4], alignItems: 'center', flexWrap: 'wrap' }}>
        {LOTE3.map((n) => (
          <Icono key={n} nombre={n} tamano={28} registro="aa" />
        ))}
      </View>
    </View>
  )
}

function EjemploFichaMascotaHogar() {
  // v2 (S52-P3): el nombre PRESIDE — las voces van SIN sujeto (mock
  // de galería; en producto nacen del riel i18n del app, ficha.*).
  return (
    <View style={{ gap: spacing[3] }}>
      <FichaMascotaHogar nombre="Thor" voz="alDia" textoEstado="Está al día." onPress={() => {}} />
      <FichaMascotaHogar
        nombre="Zeus"
        voz="pideAtencion"
        textoEstado="Le vence la antirrábica en 12 días."
        onPress={() => {}}
      />
      <FichaMascotaHogar
        nombre="Luna"
        voz="conociendolo"
        textoEstado="Aún nos estamos conociendo — carga su carnet."
        onPress={() => {}}
      />
    </View>
  )
}

function EjemploLineaDeVida() {
  return (
    <LineaDeVida
      items={itemsLineaDeVida()}
      estadoPie="mas"
      onCargarMas={() => {}}
      onPressNodo={() => {}}
    />
  )
}

function EjemploSelectorOpcion() {
  const [sexo, setSexo] = useState<string | undefined>('desconocido')
  // Enmienda S56 (Hoja del plan D-338): multi-selección + día apagado.
  const [dias, setDias] = useState<string[]>(['2'])
  return (
    <View style={{ gap: spacing[4] }}>
      <SelectorOpcion
        opciones={[
          { codigo: 'macho', etiqueta: 'Macho' },
          { codigo: 'hembra', etiqueta: 'Hembra' },
          { codigo: 'desconocido', etiqueta: 'No sé' },
        ]}
        seleccionada={sexo}
        onSelect={setSexo}
        etiqueta="¿Es macho o hembra?"
      />
      <SelectorOpcion
        multiple
        disposicion="tira"
        opciones={[
          { codigo: '1', etiqueta: 'L' },
          { codigo: '2', etiqueta: 'M' },
          { codigo: '3', etiqueta: 'X' },
          { codigo: '4', etiqueta: 'J', deshabilitada: true },
          { codigo: '5', etiqueta: 'V' },
          { codigo: '6', etiqueta: 'S' },
          { codigo: '0', etiqueta: 'D', deshabilitada: true },
        ]}
        seleccionadas={dias}
        onSelect={(codigo) =>
          setDias((prev) => (prev.includes(codigo) ? prev.filter((d) => d !== codigo) : [...prev, codigo]))
        }
        etiqueta="Multi + apagados (S56): ¿qué días? (J y D no cubiertos)"
      />
    </View>
  )
}

function EjemploSelectorAvatar() {
  // Vacío (huella digna + invitación) y con foto (preview + Cambiar/Quitar).
  const [sinFoto, setSinFoto] = useState<SelectorAvatarFoto | null>(null)
  const [conFoto, setConFoto] = useState<SelectorAvatarFoto | null>({
    uri: FOTO_MASCOTA_EJEMPLO,
    width: 800,
    height: 800,
  })
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[8], justifyContent: 'center' }}>
      <SelectorAvatar nombre="Zeus" especie="perro" foto={sinFoto} onCambiar={setSinFoto} />
      <SelectorAvatar nombre="Zeus" especie="perro" foto={conFoto} onCambiar={setConFoto} />
    </View>
  )
}

function EjemploCampoFecha() {
  // Los 3 estados de precisión (espejo del CHECK de la DB) + vacío + error.
  const [exacta, setExacta] = useState<CampoFechaValor | undefined>({ fecha: '2024-03-12', precision: 'exacta' })
  const [aprox, setAprox] = useState<CampoFechaValor | undefined>({ fecha: '2024-03-01', precision: 'aproximada' })
  const [estimada, setEstimada] = useState<CampoFechaValor | undefined>({ fecha: '2021-01-01', precision: 'estimada' })
  const [vacia, setVacia] = useState<CampoFechaValor | undefined>(undefined)
  return (
    <View>
      <CampoFecha label="Exacta (día completo)" valor={exacta} onChange={setExacta} />
      <CampoFecha label="Aproximada (mes y año)" valor={aprox} onChange={setAprox} />
      <CampoFecha label="Estimada (por etapa — tocá y probá «No sé la fecha»)" valor={estimada} onChange={setEstimada} />
      <CampoFecha label="Vacío" valor={vacia} onChange={setVacia} ayuda="Tocá para abrir el selector" />
      <CampoFecha label="Con error" valor={vacia} onChange={setVacia} error="Necesitamos una fecha para cuidarlo mejor" />
    </View>
  )
}

function EjemploAvatarMascota() {
  return (
    <View style={{ gap: spacing[4] }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing[4], flexWrap: 'wrap' }}>
        <AvatarMascota nombre="Zeus" fotoUrl={FOTO_MASCOTA_EJEMPLO} tamano="sm" />
        <AvatarMascota nombre="Zeus" fotoUrl={FOTO_MASCOTA_EJEMPLO} tamano="md" />
        <AvatarMascota nombre="Zeus" fotoUrl={FOTO_MASCOTA_EJEMPLO} tamano="lg" />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing[3], flexWrap: 'wrap' }}>
        <AvatarMascota nombre="Zeus" capa="vida" />
        <AvatarMascota nombre="Pati" capa="cuidado" />
        <AvatarMascota nombre="Nube" capa="comunidad" />
        <AvatarMascota nombre="Kiwi" capa="comunidadAmplia" />
        <AvatarMascota nombre="Bruno" />
        <AvatarMascota nombre="Bruno" tamano="sm" />
      </View>
    </View>
  )
}

function CaptionGaleria({ texto }: { texto: string }) {
  const { theme } = useTheme()
  return (
    <Text style={{ fontFamily: sans.regular, fontSize: typography.size.xs, color: theme.text.tertiary }}>
      {texto}
    </Text>
  )
}

// Cronometro: corriendo (12m34s y 1h02m33s atrás) + pausado congelado.
// Los inicios se fijan UNA vez por montaje (useState initializer).
function EjemploCronometro() {
  const [inicioCorto] = useState(() => Date.now() - 754_000)
  const [inicioLargo] = useState(() => Date.now() - 3_753_000)
  return (
    <View style={{ gap: spacing[4] }}>
      <View style={{ gap: spacing[1] }}>
        <CaptionGaleria texto="corriendo (tick 1s, tabular-nums)" />
        <Cronometro inicioTs={inicioCorto} />
      </View>
      <View style={{ gap: spacing[1] }}>
        <CaptionGaleria texto="pausado en 23:45 — congelado, sin parpadeo ni opacidad" />
        <Cronometro inicioTs={inicioCorto} pausadoEnMs={1_425_000} />
      </View>
      <View style={{ gap: spacing[1] }}>
        <CaptionGaleria texto="≥1h — formato h:mm:ss, corriendo" />
        <Cronometro inicioTs={inicioLargo} />
      </View>
    </View>
  )
}

// EvidenciaFoto: los 3 estados del thumbnail fijos + un demo cuyo estado
// se cicla con un Boton (gate funcional del punto 7) + captura real
// cableada: la foto tomada entra como thumbnail "subiendo" y pasa a
// "subida" a los 2s (simulación de cola — la subida real vive en B3).
function EjemploEvidenciaFoto() {
  const { theme } = useTheme()
  const [estadoDemo, setEstadoDemo] = useState<EvidenciaFotoEstado>('subiendo')
  const [capturas, setCapturas] = useState<{ uri: string; estado: EvidenciaFotoEstado }[]>([])

  function ciclarEstado() {
    setEstadoDemo((e) => (e === 'subiendo' ? 'subida' : e === 'subida' ? 'error' : 'subiendo'))
  }

  function onFoto(uri: string) {
    setCapturas((c) => [...c, { uri, estado: 'subiendo' }])
    setTimeout(() => {
      setCapturas((c) => c.map((x) => (x.uri === uri ? { ...x, estado: 'subida' } : x)))
    }, 2000)
  }

  return (
    <View style={{ gap: spacing[4] }}>
      <View style={{ flexDirection: 'row', gap: spacing[3], flexWrap: 'wrap' }}>
        <EvidenciaFoto.Capturar onFoto={onFoto} />
        <EvidenciaFoto.Capturar onFoto={() => {}} deshabilitado />
        {capturas.map((c) => (
          <EvidenciaFoto.Thumbnail key={c.uri} uri={c.uri} estado={c.estado} />
        ))}
      </View>
      <CaptionGaleria texto="captura: gate en dispositivo (la cámara no corre en la galería web)" />
      <View style={{ flexDirection: 'row', gap: spacing[3], flexWrap: 'wrap' }}>
        <EvidenciaFoto.Thumbnail uri={FOTO_MASCOTA_EJEMPLO} estado="subiendo" />
        <EvidenciaFoto.Thumbnail uri={FOTO_MASCOTA_EJEMPLO} estado="subida" />
        <EvidenciaFoto.Thumbnail
          uri={FOTO_MASCOTA_EJEMPLO}
          estado="error"
          onReintentar={() => {}}
        />
      </View>
      <CaptionGaleria texto="subiendo (spinner post-150ms) · subida (limpia) · error (la foto queda + reintento)" />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], flexWrap: 'wrap' }}>
        <EvidenciaFoto.Thumbnail uri={FOTO_MASCOTA_EJEMPLO} estado={estadoDemo} onReintentar={ciclarEstado} />
        <View style={{ gap: spacing[1] }}>
          <Boton variante="secundario" tamaño="sm" etiqueta={`estado: ${estadoDemo} → ciclar`} onPress={ciclarEstado} />
          <Text style={{ fontFamily: sans.regular, fontSize: typography.size.xs, color: theme.text.tertiary }}>
            demo del punto 7 — ciclá y mirá los 3 estados
          </Text>
        </View>
      </View>
    </View>
  )
}

// MapaRecorrido: track simulado realista — una vuelta a la manzana del
// Parque La Carolina (Quito), ~40 puntos con wobble determinístico.
const TRACK_SIMULADO: { lat: number; lng: number }[] = (() => {
  const esquinas = [
    { lat: -0.1826, lng: -78.4845 },
    { lat: -0.1826, lng: -78.4787 },
    { lat: -0.1872, lng: -78.4787 },
    { lat: -0.1872, lng: -78.4845 },
    { lat: -0.1826, lng: -78.4845 },
  ]
  const pts: { lat: number; lng: number }[] = []
  for (let i = 0; i < esquinas.length - 1; i++) {
    const a = esquinas[i]
    const b = esquinas[i + 1]
    for (let j = 0; j < 10; j++) {
      const t = j / 10
      pts.push({
        lat: a.lat + (b.lat - a.lat) * t + Math.sin((i * 10 + j) * 1.7) * 0.00008,
        lng: a.lng + (b.lng - a.lng) * t + Math.cos((i * 10 + j) * 1.3) * 0.00008,
      })
    }
  }
  pts.push(esquinas[esquinas.length - 1])
  return pts
})()

function EjemploMapaRecorrido() {
  return (
    <View style={{ gap: spacing[3] }}>
      <CaptionGaleria texto="recorrido — fitToCoordinates con aire, zoom/pan habilitados" />
      <MapaRecorrido puntos={TRACK_SIMULADO} modo="recorrido" />
      <CaptionGaleria texto="vivo — sigue el último punto, gestos apagados, punto de posición" />
      <MapaRecorrido puntos={TRACK_SIMULADO.slice(0, 18)} modo="vivo" alto={180} />
      <CaptionGaleria texto="mapa real: gate en dispositivo (en web se ve este placeholder)" />
    </View>
  )
}

// Receta canónica de Esqueleto: la fila de agenda (círculo 40 + dos líneas).
// Componer imitando el layout final — reemplazo directo al llegar los datos.
function EjemploEsqueletoFila() {
  return (
    <EsqueletoGrupo>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
        <Esqueleto forma="circulo" alto={40} />
        <View style={{ flex: 1, gap: spacing[2] }}>
          <Esqueleto forma="linea" ancho="60%" />
          <Esqueleto forma="linea" ancho="40%" />
        </View>
      </View>
    </EsqueletoGrupo>
  )
}

// campana de demo para la portada dueño (el slot accionDer es del consumidor)
// ── Elevación (Ley 20 · D-358 + D-360, S58): fondo + Tarjeta reposo +
// superficie de Hoja elevada, lado a lado. La Hoja real es un Modal y no
// se monta inline: acá se muestra SU superficie con SU token (elevada). ──
function EjemploElevacion() {
  const { theme } = useTheme()
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[4], alignItems: 'stretch' }}>
      <View style={{ flex: 1, minWidth: 160 }}>
        <Tarjeta elevacion="reposo">
          <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.secondary }}>
            tarjeta · reposo
          </Text>
          <Text style={{ fontFamily: sans.medium, fontSize: typography.size.base, color: theme.text.primary }}>
            Apoyada sobre el fondo
          </Text>
          <Text style={{ fontFamily: sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
            Sin hairline — regla Chanel del marco
          </Text>
        </Tarjeta>
      </View>
      <View
        style={{
          flex: 1,
          minWidth: 160,
          backgroundColor: theme.mode === 'light' ? theme.bg.card : theme.bg.elevated,
          boxShadow: theme.elevacion.elevada,
          borderTopLeftRadius: radius['2xl'],
          borderTopRightRadius: radius['2xl'],
          padding: spacing[4],
          alignItems: 'center',
          gap: spacing[2],
        }}
      >
        <View style={{ width: 36, height: 4, borderRadius: radius.full, backgroundColor: theme.bg.border }} />
        <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.secondary }}>
          hoja · elevada
        </Text>
        <Text style={{ fontFamily: sans.medium, fontSize: typography.size.base, color: theme.text.primary }}>
          Lo que flota
        </Text>
      </View>
    </View>
  )
}

// ── SelectorSegmentado (Ley 19.3 · D-359, S58): los dos casos del
// diccionario — 2 segmentos (Hoy/Semana del prestador) y 3 (el hub
// "Mis paseos" del cliente). Estado propio por panel. ──
function EjemploSelectorSegmentado() {
  const { theme } = useTheme()
  const [vista2, setVista2] = useState('hoy')
  const [vista3, setVista3] = useState('proximos')
  return (
    <View style={{ gap: spacing[3] }}>
      <SelectorSegmentado
        etiqueta="Vista de la agenda"
        segmentos={[
          { codigo: 'hoy', etiqueta: 'Hoy' },
          { codigo: 'semana', etiqueta: 'Semana' },
        ]}
        activo={vista2}
        onCambio={setVista2}
      />
      <SelectorSegmentado
        etiqueta="Vista de tus paseos"
        segmentos={[
          { codigo: 'proximos', etiqueta: 'Próximos' },
          { codigo: 'agenda', etiqueta: 'Agenda' },
          { codigo: 'historial', etiqueta: 'Historial' },
        ]}
        activo={vista3}
        onCambio={setVista3}
      />
      <Text style={{ fontFamily: sans.regular, fontSize: typography.size.xs, color: theme.text.tertiary }}>
        La vista activa está apoyada sobre el riel (elevacion.reposo) — tocá de verdad: se desliza la superficie, la sombra viaja con ella.
      </Text>
    </View>
  )
}

// ── SliderPrecio (S58, comp. 31): pasos discretos, acento por registro,
// thumb apoyado (elevacion.reposo). Estado propio por panel. ──
function EjemploSliderPrecio({ registro }: { registro?: 'capa' | 'aa' | 'tinta' }) {
  const { theme } = useTheme()
  const pasos = ['$5.00', '$7.50', '$10.00', '$12.50', '$15.00']
  const [i, setI] = useState(2)
  return (
    <View style={{ gap: spacing[2] }}>
      <Text style={{ fontFamily: sans.medium, fontSize: typography.size.base, color: theme.text.primary }}>
        {pasos[i]}
      </Text>
      <SliderPrecio pasos={pasos} indice={i} onCambio={setI} etiqueta="Precio por salida" registro={registro} />
    </View>
  )
}

// ── Acento de controles del cliente (S58): magentaDark claro /
// violetText dark / tinta memorial. La ELECCIÓN en rectángulo suave
// (Ley de geometría); la acción sigue en tinta. ──
function EjemploAcentoControl() {
  const { theme } = useTheme()
  const [dia, setDia] = useState('mar')
  const pasos = ['$5.00', '$7.50', '$10.00']
  const [i, setI] = useState(1)
  const [avisos, setAvisos] = useState(true)
  const [ofrece, setOfrece] = useState(true)
  return (
    <View style={{ gap: spacing[4] }}>
      {/* TONAL — selección entre pares (Ley 22) */}
      <SelectorOpcion
        acento="control"
        etiqueta="Día de la semana"
        opciones={[
          { codigo: 'lun', etiqueta: 'Lun' },
          { codigo: 'mar', etiqueta: 'Mar' },
          { codigo: 'mie', etiqueta: 'Mié' },
        ]}
        seleccionada={dia}
        onSelect={setDia}
      />
      {/* SÓLIDO — binarios y singulares (Ley 22) */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
        <Interruptor encendido={avisos} onCambio={setAvisos} etiqueta="Recordatorios" />
        <Text style={{ fontFamily: sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
          interruptor · control (sólido)
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
        <Interruptor encendido={ofrece} onCambio={setOfrece} etiqueta="Ofrecer esta duración" registro="oficio" />
        <Text style={{ fontFamily: sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
          interruptor · oficio (la B: “Ofrecer esta duración”)
        </Text>
      </View>
      <SliderPrecio pasos={pasos} indice={i} onCambio={setI} etiqueta="Precio" registro="control" />
      <EjemploStepper />
      <Text style={{ fontFamily: sans.regular, fontSize: typography.size.xs, color: theme.text.tertiary }}>
        Tonal para elegir entre pares · sólido para binarios · stepper para cantidades acotadas; la acción sigue en tinta; apagado y tope jamás dicen error.
      </Text>
    </View>
  )
}

// ── StepperCantidad (S58, comp. 33): cantidad acotada — el caso de la
// B: cupo "a la vez" por franja (1..4). En los topes se apaga sereno. ──
function EjemploStepper() {
  const { theme } = useTheme()
  const [n, setN] = useState(2)
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
      <StepperCantidad valor={n} min={1} max={4} onCambio={setN} etiqueta="Paseos a la vez" registro="oficio" />
      <Text style={{ fontFamily: sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
        stepper · oficio ("a la vez", 1–4)
      </Text>
    </View>
  )
}

// ── CeldaNavegacion (Ley 19.1 · S58): entrar a una sección — el ícono
// b′ dice a dónde va; chevron de entrada; pressed 0.99. ──
function EjemploCeldaNavegacion({ registro }: { registro?: 'capa' | 'aa' | 'tinta' }) {
  return (
    <View>
      <CeldaNavegacion icono="paseo" titulo="Mis paseos" detalle="Próximos, agenda e historial" registro={registro} onPress={() => {}} />
      <Separador />
      <CeldaNavegacion icono="veterinaria" titulo="Agregar carnet" registro={registro} onPress={() => {}} />
      <Separador />
      <CeldaNavegacion icono="refugio" titulo="Mascotas" registro={registro} onPress={() => {}} />
    </View>
  )
}

function CampanaDemo() {
  const { theme } = useTheme()
  return (
    <View accessibilityLabel="Notificaciones — hay novedades">
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path
          d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0"
          stroke={theme.text.primary}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <View style={{ position: 'absolute', top: -1, right: -2 }}>
        <Insignia capa="comunidad" soloPunto etiqueta="Notificaciones nuevas" />
      </View>
    </View>
  )
}

// iconos outline 1.75 de demo para la BarraTabs (el slot es del consumidor)
const ICONOS_TABS: BarraTabsItem[] = [
  {
    key: 'hoy',
    etiqueta: 'Hoy',
    icono: ({ color }) => (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" stroke={color} strokeWidth={1.75} strokeLinecap="round" />
        <Path d="M12 8a4 4 0 100 8 4 4 0 000-8z" stroke={color} strokeWidth={1.75} />
      </Svg>
    ),
  },
  {
    key: 'agenda',
    etiqueta: 'Agenda',
    badge: 3,
    icono: ({ color }) => (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path d="M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1zM4 9.5h16M8.5 3v4M15.5 3v4" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
  },
  {
    key: 'perfil',
    etiqueta: 'Perfil',
    icono: ({ color }) => (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path d="M12 4a4 4 0 100 8 4 4 0 000-8zM5 20c.8-3.5 3.7-5.5 7-5.5s6.2 2 7 5.5" stroke={color} strokeWidth={1.75} strokeLinecap="round" />
      </Svg>
    ),
  },
]

// ── galería ───────────────────────────────────────────────────────────────────
export function TokenGallery() {
  // Provider PROPIO (S48/D-305): el provider raíz del app está controlado
  // por el tema del sistema, y el selector manual de esta galería
  // (herramienta de verificación) necesita setMode vivo. Se siembra del
  // modo vigente del app y de ahí en más manda el toggle.
  const { mode } = useTheme()
  return (
    <ThemeProvider defaultMode={mode}>
      <AvisoProvider>
        <GaleriaInterna />
      </AvisoProvider>
    </ThemeProvider>
  )
}

function GaleriaInterna() {
  const { theme, mode, setMode } = useTheme()
  const { mostrar } = useAviso()
  const [cargandoDemo, setCargandoDemo] = useState(false)
  const [tabActivo, setTabActivo] = useState('hoy')
  const [hoja, setHoja] = useState<'ninguna' | HojaAltura | 'form' | 'confirmar' | 'scroll'>('ninguna')
  const esDark = mode === 'dark'
  const esMemorial = mode === 'memorial'
  // Capturados fuera de los callbacks: el narrowing de `in` no sobrevive closures
  const shadowLg = 'lg' in theme.shadow ? theme.shadow.lg : null
  const shadowGlow = 'glow' in theme.shadow ? theme.shadow.glow : null
  // B2.1 — dos registros: capaText para etiquetas; memorial (intacto) no lo tiene
  const capaTexto = 'capaText' in theme ? theme.capaText : theme.capa
  const accentActive = 'active' in theme.accent ? theme.accent.active : theme.accent.primary

  const modos: { key: ThemeMode; label: string }[] = [
    { key: 'light', label: 'Claro' },
    { key: 'dark', label: 'Oscuro' },
    { key: 'memorial', label: 'Memorial' },
  ]

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.bg.base }} contentContainerStyle={{ padding: spacing[6], paddingBottom: spacing[16] }}>
      <View style={{ width: '100%', maxWidth: 720, alignSelf: 'center' }}>

        {/* Header + toggle */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[8], flexWrap: 'wrap', gap: spacing[4] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
            <Isotipo size={32} variant={esDark || esMemorial ? 'blanco' : 'tinta'} />
            <View>
              <Text style={{ fontFamily: sans.bold, fontSize: typography.size.lg, color: theme.text.primary }}>
                Design Tokens v4 · s49
              </Text>
              <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.secondary }}>
                s43-b2 · galería de verificación
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', backgroundColor: theme.bg.elevated, borderRadius: radius.full, padding: 3, borderWidth: 1, borderColor: theme.border.default }}>
            {modos.map((m) => (
              <Pressable
                key={m.key}
                onPress={() => setMode(m.key)}
                style={{
                  paddingHorizontal: spacing[4],
                  paddingVertical: spacing[1.5],
                  borderRadius: radius.full,
                  backgroundColor: mode === m.key ? theme.text.primary : 'transparent',
                }}
              >
                <Text style={{ fontFamily: sans.medium, fontSize: typography.size.sm, color: mode === m.key ? theme.text.inverse : theme.text.secondary }}>
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Paleta */}
        <Seccion titulo="Paleta — marca canonizada (SVG del logo)">
          <Fila>
            <Swatch name="pink" hex={palette.pink} />
            <Swatch name="teal" hex={palette.teal} />
            <Swatch name="verdeVital" hex={palette.verdeVital} />
            <Swatch name="menta*" hex={palette.verde} />
            <Swatch name="amarillo*" hex={palette.amarillo} />
          </Fila>
          <Text style={{ fontFamily: sans.regular, fontSize: typography.size.sm, color: theme.text.secondary, marginBottom: spacing[4] }}>
            *menta y amarillo = SOLO marca/logo. La capa Vida es verdeVital (B2.1).
          </Text>
          <Fila>
            <Swatch name="pinkDark" hex={palette.pinkDark} />
            <Swatch name="tealDark" hex={palette.tealDark} />
            <Swatch name="verdeVitalDark" hex={palette.verdeVitalDark} />
          </Fila>
          <Text style={{ fontFamily: sans.regular, fontSize: typography.size.sm, color: theme.text.secondary, marginBottom: spacing[4] }}>
            Variantes AA para claro — validadas por scripts/verify-contrast.ts
          </Text>
          <Fila>
            <Swatch name="coral" hex={palette.coral} />
            <Swatch name="ochre" hex={palette.ochre} />
            <Swatch name="violet" hex={palette.violet} />
            <Swatch name="terracotta" hex={palette.terracotta} />
            <Swatch name="cream" hex={palette.cream} border />
            <Swatch name="sage" hex={palette.sage} />
            <Swatch name="rose" hex={palette.rose} />
          </Fila>
        </Seccion>

        {/* Tipografía */}
        <Seccion titulo="Tipografía — DM Sans única familia UI">
          {(
            [
              ['display', 'light'],
              ['hero', 'light'],
              ['4xl', 'light'],
              ['3xl', 'regular'],
              ['2xl', 'regular'],
              ['xl', 'regular'],
              ['lg', 'regular'],
              ['md', 'medium'],
              ['base', 'regular'],
              ['sm', 'regular'],
              ['xs', 'medium'],
            ] as const
          ).map(([size, weight]) => (
            <View key={size} style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing[3], marginBottom: spacing[2] }}>
              <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.tertiary, width: 64 }}>
                {size} · {typography.size[size]}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: sans[weight],
                  fontSize: typography.size[size],
                  lineHeight: typography.size[size] * typography.leading.tight,
                  color: theme.text.primary,
                  flexShrink: 1,
                }}
              >
                Zeus volvió feliz
              </Text>
            </View>
          ))}

          {/* Regla de voz demostrada */}
          <View style={{ backgroundColor: theme.bg.card, borderRadius: radius.md, padding: spacing[5], marginTop: spacing[5], borderWidth: 1, borderColor: theme.border.default }}>
            <Text style={{ fontFamily: sans.light, fontSize: typography.size.lg, lineHeight: typography.size.lg * typography.leading.snug, color: theme.text.primary }}>
              Buenos días, Guillermo. Zeus tuvo una gran semana.
            </Text>
            <Text style={{ fontFamily: mono.regular, fontSize: typography.size.sm, letterSpacing: typography.tracking.mono, color: theme.text.secondary, marginTop: spacing[3] }}>
              paseo #8f3a · 14:30 · 2.4 km · $12.50
            </Text>
            <Text style={{ fontFamily: sans.regular, fontSize: typography.size.sm, lineHeight: typography.size.sm * typography.leading.normal, color: theme.text.secondary, marginTop: spacing[3] }}>
              Regla de voz: lo vivo habla en DM Sans (arriba: voz humana, 300 en lg). Lo que generó una
              máquina va en JetBrains Mono — minúsculas, tracking suave, sin transform. El vocabulario
              interno del modelo (M1..M7, IDs de capa) jamás se muestra.
            </Text>
          </View>
        </Seccion>

        {/* Espaciado */}
        <Seccion titulo="Espaciado — base 4, múltiplos estrictos">
          {([1, 2, 3, 4, 6, 8, 12, 16] as const).map((k) => (
            <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], marginBottom: spacing[1.5] }}>
              <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.tertiary, width: 64 }}>
                {k} · {spacing[k]}px
              </Text>
              <View style={{ height: 12, width: spacing[k] * 3, backgroundColor: theme.accent.primary, borderRadius: radius.xs, opacity: 0.85 }} />
            </View>
          ))}
        </Seccion>

        {/* Radios */}
        <Seccion titulo="Radios">
          <Fila>
            {(['xs', 'sm', 'md', 'lg', 'xl', '2xl', 'full'] as const).map((k) => (
              <View key={k} style={{ alignItems: 'center', gap: spacing[1] }}>
                <View style={{ width: 64, height: 64, borderRadius: radius[k], backgroundColor: theme.bg.card, borderWidth: 1.5, borderColor: theme.accent.primaryBorder }} />
                <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.secondary }}>
                  {k} · {radius[k]}
                </Text>
              </View>
            ))}
          </Fila>
        </Seccion>

        {/* Sombras */}
        <Seccion titulo={esDark ? 'Sombras + glow (glow solo existe en dark)' : 'Sombras (sin glow fuera de dark)'}>
          <Fila>
            {(['sm', 'md'] as const).map((k) => (
              <View key={k} style={[{ width: 120, height: 72, borderRadius: radius.md, backgroundColor: theme.bg.card, alignItems: 'center', justifyContent: 'center' }, theme.shadow[k]]}>
                <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.secondary }}>{k}</Text>
              </View>
            ))}
            {shadowLg ? (
              <View style={[{ width: 120, height: 72, borderRadius: radius.md, backgroundColor: theme.bg.card, alignItems: 'center', justifyContent: 'center' }, shadowLg]}>
                <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.secondary }}>lg</Text>
              </View>
            ) : null}
            {shadowGlow
              ? (['teal', 'pink', 'verde'] as const).map((g) => (
                  <View key={g} style={[{ width: 120, height: 72, borderRadius: radius.md, backgroundColor: theme.bg.card, alignItems: 'center', justifyContent: 'center' }, shadowGlow[g]]}>
                    <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.secondary }}>glow {g}</Text>
                  </View>
                ))
              : null}
          </Fila>
        </Seccion>

        {/* Elevación — Ley 20 (D-358 + D-360, S58): el material papel */}
        <Seccion titulo="Elevación + fondo papel — dos niveles y solo dos (Ley 20)">
          <View style={{ gap: spacing[4] }}>
            <ThemeProvider defaultMode="light">
              <PanelTema etiqueta="claro — papel algodón #FAF9F7 + sombra de TINTA CÁLIDA (contacto + difusa); reposo pierde el hairline">
                <EjemploElevacion />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="dark">
              <PanelTema etiqueta="dark — INTACTO: la elevación la dice el paso de luminancia de bg.card; contacto mínimo, el fondo jamás se calienta">
                <EjemploElevacion />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="memorial">
              <PanelTema etiqueta="memorial — CONSERVA la elevación (la calidez es dignidad, no celebración); resuelve como superficie oscura">
                <EjemploElevacion />
              </PanelTema>
            </ThemeProvider>
          </View>
        </Seccion>

        {/* SelectorSegmentado — Ley 19.3 (D-359, S58): vistas exclusivas */}
        <Seccion titulo="SelectorSegmentado — vistas exclusivas (los chips quedaron prohibidos como segmentos)">
          <View style={{ gap: spacing[4] }}>
            <ThemeProvider defaultMode="light">
              <PanelTema etiqueta="claro — riel hundido bg.overlay; el activo es superficie blanca con elevacion.reposo, sin borde (Chanel)">
                <EjemploSelectorSegmentado />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="dark">
              <PanelTema etiqueta="dark — mismo componente sin variante; el paso de luminancia da el activo + contacto mínimo">
                <EjemploSelectorSegmentado />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="memorial">
              <PanelTema etiqueta="memorial — sin variante y sin deslizamiento: reemplazo directo (en memorial nada se desliza)">
                <EjemploSelectorSegmentado />
              </PanelTema>
            </ThemeProvider>
          </View>
        </Seccion>

        {/* CeldaNavegacion — Ley 19.1 (S58): entrar a una sección */}
        <Seccion titulo="CeldaNavegacion — entrar a una sección (la celda dice a dónde va)">
          <View style={{ gap: spacing[4] }}>
            <ThemeProvider defaultMode="light">
              <PanelTema etiqueta="claro (dosis dueño, registro capa) — ícono b′ + título + detalle opcional + chevron; pressed 0.99">
                <EjemploCeldaNavegacion />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="dark">
              <PanelTema etiqueta="dark (registro aa — dosis prestador: la dosis modula color, no gramática)">
                <EjemploCeldaNavegacion registro="aa" />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="memorial">
              <PanelTema etiqueta="memorial — degrada solo adentro de Icono (§2.8): huella a text.secondary">
                <EjemploCeldaNavegacion />
              </PanelTema>
            </ThemeProvider>
          </View>
        </Seccion>

        {/* Tinta — S58: el techo del prestador (constante en los 3 temas) */}
        <Seccion titulo="Tinta — el techo del prestador (bg.tinta, constante)">
          <View style={{ backgroundColor: theme.bg.tinta, borderRadius: radius.md, padding: spacing[5], gap: spacing[2] }}>
            <Text style={{ fontFamily: sans.medium, fontSize: typography.size.lg, color: palette.light0 }}>
              Texto papel sobre tinta
            </Text>
            <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: palette.light0 }}>
              #221E19 · papel/tinta gatea AA · tealDark/tinta CAE (reportado)
            </Text>
          </View>
        </Seccion>

        {/* SliderPrecio — S58 (comp. 31): pasos discretos por registro */}
        <Seccion titulo="SliderPrecio — pasos discretos (el precio se elige, no se interpola)">
          <View style={{ gap: spacing[4] }}>
            <ThemeProvider defaultMode="light">
              <PanelTema etiqueta="claro · registro capa (dueño) — tramo en hex puro; thumb apoyado con elevacion.reposo">
                <EjemploSliderPrecio />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="dark">
              <PanelTema etiqueta="dark · registro aa (dosis prestador) — el acento funcional de cuidado">
                <EjemploSliderPrecio registro="aa" />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="memorial">
              <PanelTema etiqueta="memorial — degrada adentro (acento a text.secondary) y el thumb no se desliza: reemplazo directo">
                <EjemploSliderPrecio />
              </PanelTema>
            </ThemeProvider>
          </View>
        </Seccion>

        {/* Acento del cliente — S58 (firma founder): accent.control */}
        <Seccion titulo="Acento — tonal y sólido (Ley 22): la elección viste tinte, el binario viste fill">
          <View style={{ gap: spacing[4] }}>
            <ThemeProvider defaultMode="light">
              <PanelTema etiqueta="claro — magentaDark #8E1F68 (registro trabajador del magenta; el puro conserva su reserva)">
                <EjemploAcentoControl />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="dark">
              <PanelTema etiqueta="dark — violetText #AE59FF (gateado S44, cero pares nuevos)">
                <EjemploAcentoControl />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="memorial">
              <PanelTema etiqueta="memorial — el control es tinta: la marca no celebra ahí">
                <EjemploAcentoControl />
              </PanelTema>
            </ThemeProvider>
          </View>
        </Seccion>

        {/* Status — Insignia estado (B3.5) */}
        <Seccion titulo="Status — Insignia · familia estado">
          <Fila>
            <Insignia estado="alDia" etiqueta="Al día" />
            <Insignia estado="proximo" etiqueta="Vacuna próxima" />
            <Insignia estado="atencion" etiqueta="Atención" />
            <Insignia estado="info" etiqueta="Nota del vet" />
          </Fila>
          <View style={{ marginTop: spacing[3] }}>
            <Fila>
              <Insignia estado="alDia" etiqueta="sm" tamaño="sm" />
              <Insignia estado="info" etiqueta="md (default)" />
            </Fila>
          </View>
        </Seccion>

        {/* Capas — Insignia capa (B3.5) */}
        <Seccion titulo="Capas — Insignia · familia capa (dos registros cableados)">
          <Fila>
            <Insignia capa="vida" etiqueta="Vida" />
            <Insignia capa="cuidado" etiqueta="Cuidado" />
            <Insignia capa="comunidad" etiqueta="Comunidad" />
            <Insignia capa="comunidadAmplia" etiqueta="Comunidad amplia" />
          </Fila>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], marginTop: spacing[3] }}>
            <Insignia capa="vida" soloPunto etiqueta="Capa vida" />
            <Insignia capa="cuidado" soloPunto etiqueta="Capa cuidado" />
            <Insignia capa="comunidad" soloPunto etiqueta="Capa comunidad" />
            <Text style={{ fontFamily: sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
              soloPunto — para celdas densas; la etiqueta sigue obligatoria (a11y)
            </Text>
          </View>
        </Seccion>

        {/* accentActive */}
        <Seccion titulo="Estado activo — accent.active (pink puro, un solo elemento por vista)">
          <View style={{ backgroundColor: theme.bg.card, borderRadius: radius.md, borderWidth: 1, borderColor: theme.border.default, padding: spacing[4] }}>
            <View style={{ flexDirection: 'row', gap: spacing[6] }}>
              {(['Hoy', 'Agenda', 'Perfil'] as const).map((tab, i) => (
                <View key={tab} style={{ alignItems: 'center', gap: spacing[1.5] }}>
                  <Text
                    style={{
                      fontFamily: i === 0 ? sans.medium : sans.regular,
                      fontSize: typography.size.base,
                      color: i === 0 ? theme.text.primary : theme.text.secondary,
                    }}
                  >
                    {tab}
                  </Text>
                  <View style={{ height: 3, alignSelf: 'stretch', borderRadius: radius.full, backgroundColor: i === 0 ? accentActive : 'transparent' }} />
                </View>
              ))}
            </View>
            <Text style={{ fontFamily: sans.regular, fontSize: typography.size.xs, color: theme.text.tertiary, marginTop: spacing[3] }}>
              Subrayado de tab, selección, paso actual — registro gráfico, no porta texto.
            </Text>
          </View>
        </Seccion>

        {/* Botón — B3.1 */}
        <Seccion titulo="Botón — variantes × estados (presioná de verdad)">
          <View style={{ backgroundColor: theme.bg.card, borderRadius: radius.md, borderWidth: 1, borderColor: theme.border.default, padding: spacing[5], gap: spacing[5] }}>
            {(
              [
                ['primario', 'Iniciar atención'],
                ['marca', 'Agendar un paseo'],
                ['secundario', 'Ver detalle'],
                ['ghost', 'Cancelar'],
                ['destructivo', 'Eliminar mascota'],
                ['compacto', 'Mover salida'],
              ] as const satisfies ReadonlyArray<readonly [BotonVariante, string]>
            ).map(([v, etiqueta]) => (
              <View key={v} style={{ gap: spacing[2] }}>
                <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.tertiary }}>
                  {v}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3], alignItems: 'center' }}>
                  <Boton variante={v} etiqueta={etiqueta} onPress={() => {}} />
                  <Boton variante={v} etiqueta={etiqueta} deshabilitado onPress={() => {}} />
                  <Boton variante={v} etiqueta={etiqueta} cargando={cargandoDemo} onPress={() => {}} />
                </View>
              </View>
            ))}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
              <Boton
                variante="secundario"
                tamaño="sm"
                etiqueta={cargandoDemo ? 'Apagar loading' : 'Prender loading'}
                onPress={() => setCargandoDemo((x) => !x)}
              />
              <Text style={{ fontFamily: sans.regular, fontSize: typography.size.xs, color: theme.text.tertiary, flexShrink: 1 }}>
                default · disabled · loading (el spinner respeta la regla de 150ms y no mueve el layout)
              </Text>
            </View>
            <View style={{ gap: spacing[3] }}>
              <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.tertiary }}>
                tamaños · sm 36 / md 48 / lg 56
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3], alignItems: 'center' }}>
                <Boton variante="primario" tamaño="sm" etiqueta="Pequeño" onPress={() => {}} />
                <Boton variante="primario" tamaño="md" etiqueta="Mediano" onPress={() => {}} />
                <Boton variante="primario" tamaño="lg" etiqueta="Grande" onPress={() => {}} />
              </View>
              <Boton variante="primario" etiqueta="Bloque — full width" bloque onPress={() => {}} />
            </View>
          </View>
        </Seccion>

        {/* Tarjeta — B3.2 */}
        <Seccion titulo="Tarjeta — superficie contenedora">
          <View style={{ gap: spacing[4] }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[4] }}>
              {(['plana', 'reposo', 'elevada'] as const).map((e) => (
                <Tarjeta key={e} elevacion={e}>
                  <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.secondary }}>
                    elevacion {e}
                  </Text>
                  <Text style={{ fontFamily: sans.medium, fontSize: typography.size.base, color: theme.text.primary }}>
                    Contenido libre
                  </Text>
                </Tarjeta>
              ))}
            </View>

            {(
              [
                ['warning', 'Vacuna próxima', theme.status.warningText],
                ['danger', 'Necesita atención', theme.status.dangerText],
                ['success', 'Todo al día', theme.status.successText],
                ['vida', 'Salud de Zeus', capaTexto.identidad],
                ['cuidado', 'Paseo agendado', capaTexto.cuidado],
                ['comunidad', '3 amigos nuevos', capaTexto.comunidad],
              ] as const satisfies ReadonlyArray<readonly [TarjetaTinte, string, string]>
            ).map(([tinte, texto, colorTexto]) => (
              <Tarjeta key={tinte} tinte={tinte}>
                <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: colorTexto, opacity: 0.7 }}>
                  tinte {tinte}
                </Text>
                <Text style={{ fontFamily: sans.medium, fontSize: typography.size.base, color: colorTexto }}>
                  {texto}
                </Text>
              </Tarjeta>
            ))}

            <Tarjeta interactiva onPress={() => {}} accessibilityRole="button" etiqueta="Abrir la atención de Zeus">
              <Text style={{ fontFamily: sans.medium, fontSize: typography.size.base, color: theme.text.primary }}>
                Interactiva — presioname
              </Text>
              <Text style={{ fontFamily: sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
                Scale 0.99 con la misma receta del Boton
              </Text>
            </Tarjeta>

            <Tarjeta relleno="ninguno">
              <View style={{ height: 96, backgroundColor: theme.capa.cuidado, opacity: 0.35 }} />
              <View style={{ padding: spacing[3] }}>
                <Text style={{ fontFamily: sans.medium, fontSize: typography.size.base, color: theme.text.primary }}>
                  relleno=ninguno — imagen edge-to-edge (el bloque simula la foto)
                </Text>
              </View>
            </Tarjeta>
          </View>
        </Seccion>

        {/* Campo — B3.3 */}
        <Seccion titulo="Campo — tocá para ver el foco (nada se anima al tipear)">
          <View style={{ backgroundColor: theme.bg.card, borderRadius: radius.md, borderWidth: 1, borderColor: theme.border.default, padding: spacing[5] }}>
            <Campo label="Nombre de la mascota" placeholder="ej: Zeus" />
            <Campo label="Con ayuda" placeholder="ej: 8 kg" ayuda="El peso aparece en el carnet" keyboardType="numeric" />
            <Campo label="Con error" defaultValue="zeus@" error="Ese correo no parece completo" />
            <Campo label="Deshabilitado" defaultValue="No editable" deshabilitado />
            <Campo label="Contraseña" placeholder="mínimo 8 caracteres" secure />
            <Campo
              label="Con iconos"
              placeholder="Buscar veterinaria"
              iconoIzq={<View style={{ width: 16, height: 16, borderRadius: radius.full, borderWidth: 2, borderColor: theme.text.tertiary }} />}
            />
            <Campo label="Notas (multilínea, alto fijo)" placeholder="Observaciones del paseo…" multilinea={3} />
          </View>

          {/* Tercer ensamble del sistema: Campo + Boton dentro de Tarjeta */}
          <View style={{ marginTop: spacing[4] }}>
            <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.tertiary, marginBottom: spacing[2] }}>
              ensamble · registrar mascota
            </Text>
            <Tarjeta elevacion="reposo" relleno="amplio">
              <Text style={{ fontFamily: sans.bold, fontSize: typography.size.lg, color: theme.text.primary, marginBottom: spacing[4] }}>
                Registrá a tu mascota
              </Text>
              <Campo label="Nombre" placeholder="ej: Zeus" autoCapitalize="words" />
              <Campo label="Notas" placeholder="Lo que su cuidador debería saber…" multilinea={3} />
              <Boton variante="primario" etiqueta="Guardar" bloque onPress={() => {}} />
            </Tarjeta>
          </View>
        </Seccion>

        {/* Celda — B3.4 */}
        <Seccion titulo="Celda — la fila de lista (el pressed resalta, no escala)">
          <View style={{ gap: spacing[4] }}>
            <Tarjeta relleno="ninguno">
              <Celda
                titulo="Normal con punto de capa"
                subtitulo="Subtítulo en secondary"
                inicio={<Insignia capa="cuidado" soloPunto etiqueta="Capa cuidado" />}
                fin={<Insignia estado="alDia" etiqueta="Al día" tamaño="sm" />}
              />
              <Separador indentacion={spacing[3] + 10 + spacing[3]} />
              <Celda titulo="Con metadata mono" subtitulo="La voz de máquina, cableada" metadataMono="17:30 · 45 MIN" />
              <Separador indentacion={spacing[3]} />
              <Celda
                titulo="Metadata + fin apilados (S44-B4.1)"
                subtitulo="Hora arriba, estado abajo — la fila de la agenda"
                metadataMono="17:30 · 30 min"
                fin={<Insignia estado="info" etiqueta="Confirmada" tamaño="sm" />}
              />
              <Separador indentacion={spacing[3]} />
              <Celda densidad="compacta" titulo="Compacta (mín 48)" metadataMono="#8f3a" />
              <Separador indentacion={spacing[3]} />
              <Celda
                interactiva
                onPress={() => {}}
                accessibilityRole="button"
                titulo="Interactiva — mantené presionado"
                subtitulo="El fondo resalta con bg.overlay, la fila no escala"
              />
              <Separador indentacion={spacing[3]} />
              <Celda
                titulo="Un título absurdamente largo que tiene que truncar en una sola línea sin romper nada"
                subtitulo="Y un subtítulo igual de charlatán que puede usar hasta dos líneas completas antes de cortarse con ellipsis como corresponde en una lista real"
                metadataMono="10:00"
              />
            </Tarjeta>
          </View>
        </Seccion>

        {/* Ensamble: Agenda de hoy — la pantalla del prestador en embrión */}
        <Seccion titulo="Ensamble — Agenda de hoy (dosis baja, componentes 100% reales)">
          <Tarjeta elevacion="reposo" relleno="ninguno">
            <View style={{ padding: spacing[4], paddingBottom: spacing[2] }}>
              <Text style={{ fontFamily: sans.bold, fontSize: typography.size.lg, color: theme.text.primary }}>
                Agenda de hoy
              </Text>
              <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.tertiary }}>
                mar 7 jul · 3 citas
              </Text>
            </View>
            <Celda
              interactiva
              onPress={() => {}}
              accessibilityRole="button"
              titulo="Zeus"
              subtitulo="Paseo · familia González"
              inicio={<Insignia capa="cuidado" soloPunto etiqueta="Capa cuidado" />}
              metadataMono="17:30 · 45 min"
            />
            <Separador indentacion={spacing[3] + 10 + spacing[3]} />
            <Celda
              interactiva
              onPress={() => {}}
              accessibilityRole="button"
              titulo="Pati"
              subtitulo="Grooming · baño y corte"
              inicio={<Insignia capa="cuidado" soloPunto etiqueta="Capa cuidado" />}
              metadataMono="jue · 10:00"
            />
            <Separador indentacion={spacing[3] + 10 + spacing[3]} />
            <Celda
              interactiva
              onPress={() => {}}
              accessibilityRole="button"
              titulo="Rocky"
              subtitulo="Primera visita — la familia pide que el paseador tenga experiencia con perros grandes y ansiosos"
              inicio={<Insignia capa="cuidado" soloPunto etiqueta="Capa cuidado" />}
              metadataMono="vie · 09:15"
            />
            <View style={{ padding: spacing[4], paddingTop: spacing[3] }}>
              <Boton variante="primario" etiqueta="Ver toda la agenda" bloque onPress={() => {}} />
            </View>
          </Tarjeta>
        </Seccion>

        {/* CitaEnVivo — S44-B2.1: los 3 temas a la vez (providers anidados) */}
        <Seccion titulo="CitaEnVivo — en vivo/en curso (UNO por pantalla, jamás decorativo)">
          <View style={{ gap: spacing[4] }}>
            <ThemeProvider defaultMode="light">
              <PanelTema etiqueta='claro (default) — anillo 1.5 del hex puro + pill "● vivo"'>
                <EjemploCitaEnVivo />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="dark">
              <PanelTema etiqueta="dark — glow real del color de capa">
                <EjemploCitaEnVivo />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="memorial">
              <PanelTema etiqueta='memorial — degrada: anillo neutral, "en curso" sin punto'>
                <EjemploCitaEnVivo />
              </PanelTema>
            </ThemeProvider>
          </View>
        </Seccion>

        {/* Esqueleto — S44-B2.2: estático (Ley 13), sin shimmer ni pulso */}
        <Seccion titulo="Esqueleto — carga estática (sin shimmer: componer imitando el layout final)">
          <View style={{ gap: spacing[4] }}>
            <View style={{ gap: spacing[3] }}>
              <Text style={{ fontFamily: sans.medium, fontSize: typography.size.xs, color: theme.text.secondary }}>
                Las 3 primitivas — linea (radius.sm) · circulo (full) · bloque (radius.md)
              </Text>
              <Esqueleto forma="linea" ancho="70%" />
              <Esqueleto forma="circulo" />
              <Esqueleto forma="bloque" alto={64} />
            </View>
            <ThemeProvider defaultMode="light">
              <PanelTema etiqueta='claro — receta canónica "fila de agenda" (circulo 40 + linea 60% + linea 40%)'>
                <EjemploEsqueletoFila />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="dark">
              <PanelTema etiqueta="dark — mismo layout, bg.overlay del tema">
                <EjemploEsqueletoFila />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="memorial">
              <PanelTema etiqueta="memorial — degrada solo por token, nada que animar">
                <EjemploEsqueletoFila />
              </PanelTema>
            </ThemeProvider>
          </View>
        </Seccion>

        {/* AvatarMascota — S44-B2.3: foto + fallbacks, los 3 temas */}
        <Seccion titulo="AvatarMascota — la cara de la mascota (no porta estado)">
          <View style={{ gap: spacing[4] }}>
            <ThemeProvider defaultMode="light">
              <PanelTema etiqueta="claro — 40/64/96 con foto · huella por capa (tint + AA) · huella neutral">
                <EjemploAvatarMascota />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="dark">
              <PanelTema etiqueta="dark — mismos registros, tints del tema">
                <EjemploAvatarMascota />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="memorial">
              <PanelTema etiqueta="memorial — foto desaturada leve, fallback neutral sin capa">
                <EjemploAvatarMascota />
              </PanelTema>
            </ThemeProvider>
          </View>
        </Seccion>

        {/* SelectorEspecie — S45-B3.1: las 6 familias F1, selección única */}
        <Seccion titulo="SelectorEspecie — grid 3×2, selección única (tocá una ficha)">
          <View style={{ gap: spacing[4] }}>
            <ThemeProvider defaultMode="light">
              <PanelTema etiqueta="claro — seleccionada: borde 1.5 capa.identidad + tint capaBg (no consume accent.active)">
                <EjemploSelectorEspecie />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="dark">
              <PanelTema etiqueta="dark — mismos registros, tints del tema">
                <EjemploSelectorEspecie />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="memorial">
              <PanelTema etiqueta="memorial — degrada solo: sin tinte, selección con borde text.secondary">
                <EjemploSelectorEspecie />
              </PanelTema>
            </ThemeProvider>
          </View>
        </Seccion>

        {/* CampoFecha — S45-B3.2: fecha con precisión honesta, Hoja JS pura */}
        <Seccion titulo="CampoFecha — fecha de nacimiento con precisión (abre Hoja, selector JS puro)">
          <View style={{ gap: spacing[4] }}>
            <ThemeProvider defaultMode="light">
              <PanelTema etiqueta="claro — exacta · aproximada · estimada · vacío · error (patrón Campo)">
                <EjemploCampoFecha />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="dark">
              <PanelTema etiqueta="dark — mismos estados, superficies del tema">
                <EjemploCampoFecha />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="memorial">
              <PanelTema etiqueta="memorial — la Hoja degrada sola (slide+fade, nada rebota)">
                <EjemploCampoFecha />
              </PanelTema>
            </ThemeProvider>
          </View>
        </Seccion>

        {/* HeroMarca — S45-B3.4: gradiente firma en contexto cerrado */}
        <Seccion titulo="HeroMarca — cabecera de marca (alto · compacto · techoVivo S58; CTAs siempre afuera)">
          <View style={{ gap: spacing[4] }}>
            <ThemeProvider defaultMode="light">
              <PanelTema etiqueta="claro — gradiente firma v2 + isotipo blanco (el UNO de la pantalla) + voz humana">
                <EjemploHeroMarca />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="dark">
              <PanelTema etiqueta="dark — mismo gradiente del tema">
                <EjemploHeroMarca />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="memorial">
              <PanelTema etiqueta="memorial — sin gradiente: bg.card plano, la marca habla bajito">
                <EjemploHeroMarca />
              </PanelTema>
            </ThemeProvider>
          </View>
        </Seccion>

        {/* VisorFoto — S45-B5.3: lightbox solo-fades */}
        <Seccion titulo="VisorFoto — una foto a la vez (solo fades; letterbox digno; swipe si hay varias)">
          <View style={{ gap: spacing[4] }}>
            <ThemeProvider defaultMode="light">
              <PanelTema etiqueta="claro — el visor es siempre fondo pleno oscurecido (tinta + scrim), X/back/tap-fondo cierran">
                <EjemploVisorFoto />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="dark">
              <PanelTema etiqueta="dark — mismo visor (no depende del tema)">
                <EjemploVisorFoto />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="memorial">
              <PanelTema etiqueta="memorial — solo fades: no hay nada que degradar">
                <EjemploVisorFoto />
              </PanelTema>
            </ThemeProvider>
          </View>
        </Seccion>

        {/* FichaVacuna — S47-B1.1 (derivación S48: tipo null no tiñe) */}
        <Seccion titulo="FichaVacuna — revisión del carnet: completa · sin tipo (neutra, S48) · dudosa (sin fecha) · rechazada (tocá una: pressed 0.99)">
          <View style={{ gap: spacing[4] }}>
            <ThemeProvider defaultMode="light">
              <PanelTema etiqueta='claro — completa y sin-tipo neutras · dudosa (sin fecha) tinte cuidado ("pide sin gritar") · rechazada danger'>
                <EjemploFichaVacuna />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="dark">
              <PanelTema etiqueta="dark — mismos registros, tints del tema; fechas y lote en mono minúsculas">
                <EjemploFichaVacuna />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="memorial">
              <PanelTema etiqueta="memorial — degrada solo: sin tinte, borde neutro; la voz de rechazo conserva dangerText">
                <EjemploFichaVacuna />
              </PanelTema>
            </ThemeProvider>
          </View>
        </Seccion>

        {/* Set b′ — DIRECCION_ARTE v1.0 (S53): la mascota presente */}
        <Seccion titulo="Iconografía b′ (S53) — objeto en trazo 1.9 + UNA huella rellena en el hex de su capa · filas: 28px diseño / 21px gate §2.9 / registro AA (dosis prestador)">
          <View style={{ gap: spacing[4] }}>
            <ThemeProvider defaultMode="light">
              <PanelTema etiqueta="claro — paseo(teal) · vet(verde vital) · grooming/despensa(ocre) · refugio/coach(magenta); el coach es el destello Kaxo re-tokenizado">
                <EjemploSetBPrima />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="dark">
              <PanelTema etiqueta="dark — mismo lenguaje, tinta del tema">
                <EjemploSetBPrima />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="memorial">
              <PanelTema etiqueta="memorial — la huella a tinta secundaria, el trazo se conserva; el destello NO destella (§2.8)">
                <EjemploSetBPrima />
              </PanelTema>
            </ThemeProvider>
          </View>
        </Seccion>

        {/* Marca S53: guijarros (§4) + espera de marca (§5.3) */}
        <Seccion titulo="Marca S53 — Guijarro (ilustración §4, cada uno rotado distinto) y EsperaDeMarca (la única animación de espera legal; memorial quieta)">
          <View style={{ gap: spacing[4] }}>
            <ThemeProvider defaultMode="light">
              <PanelTema etiqueta="claro — guijarros identidad/cuidado + la huella respirando (~1.9s, sereno)">
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[6] }}>
                  <Guijarro capa="identidad" tamano={56} rotacion={9} />
                  <Guijarro capa="cuidado" tamano={56} rotacion={-16} />
                  <EsperaDeMarca tamano={56} />
                </View>
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="memorial">
              <PanelTema etiqueta="memorial — guijarro a bg.overlay; la espera QUIETA en tinta">
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[6] }}>
                  <Guijarro capa="identidad" tamano={56} rotacion={9} />
                  <EsperaDeMarca tamano={56} />
                </View>
              </PanelTema>
            </ThemeProvider>
          </View>
        </Seccion>

        {/* FichaMascotaHogar — S51-B2.2: Zona 1 del Hogar (Ley 11 gateada) */}
        <Seccion titulo="FichaMascotaHogar v2 (S52) — la mascota preside: avatar 64 + nombre grande + voz SIN sujeto sobre Tarjeta (tocá una: pressed 0.99)">
          <View style={{ gap: spacing[4] }}>
            <ThemeProvider defaultMode="light">
              <PanelTema etiqueta="claro — alDia punto verdeVital · pideAtencion punto ochre + voz warningText (pide sin gritar) · conociendolo neutral que invita">
                <EjemploFichaMascotaHogar />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="dark">
              <PanelTema etiqueta="dark — mismos registros, tokens del tema">
                <EjemploFichaMascotaHogar />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="memorial">
              <PanelTema etiqueta="memorial — degrada solo: sin punto, voz neutra">
                <EjemploFichaMascotaHogar />
              </PanelTema>
            </ThemeProvider>
          </View>
        </Seccion>

        {/* LineaDeVida — S45-B5.2: EL componente de la sesión */}
        <Seccion titulo="LineaDeVida — el timeline del dueño (mock de los paseos de Zeus + tipo desconocido)">
          <View style={{ gap: spacing[4] }}>
            <ThemeProvider defaultMode="light">
              <PanelTema etiqueta='claro — punto hex puro por capa, fecha en voz humana, mono solo en hora/duración; el 3° nodo es un tipo desconocido degradando digno'>
                <EjemploLineaDeVida />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="dark">
              <PanelTema etiqueta="dark — mismos registros">
                <EjemploLineaDeVida />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="memorial">
              <PanelTema etiqueta="memorial — el punto degrada a text.secondary, nada rebota">
                <EjemploLineaDeVida />
              </PanelTema>
            </ThemeProvider>
          </View>
        </Seccion>

        {/* SelectorOpcion — S45-B4.1: chips de selección única */}
        <Seccion titulo="SelectorOpcion — 2-4 opciones cortas, selección única (tocá un chip)">
          <View style={{ gap: spacing[4] }}>
            <ThemeProvider defaultMode="light">
              <PanelTema etiqueta="claro — seleccionado: borde 1.5 capa.identidad + tint capaBg (no consume accent.active)">
                <EjemploSelectorOpcion />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="dark">
              <PanelTema etiqueta="dark — mismos registros">
                <EjemploSelectorOpcion />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="memorial">
              <PanelTema etiqueta="memorial — degrada: sin tinte, selección con borde text.secondary">
                <EjemploSelectorOpcion />
              </PanelTema>
            </ThemeProvider>
          </View>
        </Seccion>

        {/* SelectorAvatar — S45-B3.3: identidad, no evidencia */}
        <Seccion titulo="SelectorAvatar — la foto de identidad (tocá: cámara y galería son pares)">
          <View style={{ gap: spacing[4] }}>
            <ThemeProvider defaultMode="light">
              <PanelTema etiqueta='claro — vacío (huella digna + invitación) · con foto (Cambiar/Quitar) · "Por ahora no" primera clase'>
                <EjemploSelectorAvatar />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="dark">
              <PanelTema etiqueta="dark — mismos estados">
                <EjemploSelectorAvatar />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="memorial">
              <PanelTema etiqueta="memorial — huella neutral, foto desaturada por AvatarMascota, Hoja degrada sola">
                <EjemploSelectorAvatar />
              </PanelTema>
            </ThemeProvider>
          </View>
        </Seccion>

        {/* Cronometro — S44-B2.4: voz de máquina en display, sin baile */}
        <Seccion titulo="Cronometro — tiempo transcurrido (voz de máquina, sin label)">
          <View style={{ gap: spacing[4] }}>
            <ThemeProvider defaultMode="light">
              <PanelTema etiqueta="claro — text.primary, mono display, tick por diferencia">
                <EjemploCronometro />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="dark">
              <PanelTema etiqueta="dark — mismo token, cero caso especial">
                <EjemploCronometro />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="memorial">
              <PanelTema etiqueta="memorial — hereda por token (si corre acá, lo decide la pantalla)">
                <EjemploCronometro />
              </PanelTema>
            </ThemeProvider>
          </View>
        </Seccion>

        {/* EvidenciaFoto — S44-B2.5: captura + estados del thumbnail */}
        <Seccion titulo="EvidenciaFoto — captura y estado (la subida vive en la pantalla)">
          <View style={{ gap: spacing[4] }}>
            <ThemeProvider defaultMode="light">
              <PanelTema etiqueta="claro — Capturar (tap cámara / long-press galería) + thumbnails">
                <EjemploEvidenciaFoto />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="dark">
              <PanelTema etiqueta="dark — scrim del token, mismos estados">
                <EjemploEvidenciaFoto />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="memorial">
              <PanelTema etiqueta="memorial — overlay y acciones neutrales; la captura funciona igual">
                <EjemploEvidenciaFoto />
              </PanelTema>
            </ThemeProvider>
          </View>
        </Seccion>

        {/* MapaRecorrido — S44-B2.6: track del paseo sobre mapa real */}
        <Seccion titulo="MapaRecorrido — el track del paseo (mapa claro en F1, decisión registrada)">
          <View style={{ gap: spacing[4] }}>
            <ThemeProvider defaultMode="light">
              <PanelTema etiqueta="claro — trazo capaText.cuidado 4.5, punto vivo hex puro + anillo blanco">
                <EjemploMapaRecorrido />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="dark">
              <PanelTema etiqueta="dark — cartografía clara igual (es una foto del mundo)">
                <EjemploMapaRecorrido />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="memorial">
              <PanelTema etiqueta="memorial — ídem; el mapa no es superficie del sistema">
                <EjemploMapaRecorrido />
              </PanelTema>
            </ThemeProvider>
          </View>
        </Seccion>

        {/* Encabezado — B3.6 */}
        <Seccion titulo="Encabezado — navegación y portada">
          <View style={{ gap: spacing[4] }}>
            {[
              { k: 'solo', atras: false, accion: false, divisor: false, titulo: 'Solo título' },
              { k: 'atras', atras: true, accion: false, divisor: false, titulo: 'Con atrás (centrado óptico)' },
              { k: 'ambos', atras: true, accion: true, divisor: false, titulo: 'Atrás + acción' },
              { k: 'divisor', atras: false, accion: false, divisor: true, titulo: 'Con divisor' },
            ].map((c) => (
              <View key={c.k} style={{ borderWidth: 1, borderColor: theme.border.default, borderRadius: radius.md, overflow: 'hidden' }}>
                {c.atras ? (
                  <Encabezado
                    variante="navegacion"
                    titulo={c.titulo}
                    atras
                    onAtras={() => {}}
                    divisor={c.divisor}
                    accionDer={c.accion ? <Insignia estado="info" etiqueta="2" tamaño="sm" /> : undefined}
                  />
                ) : (
                  <Encabezado variante="navegacion" titulo={c.titulo} divisor={c.divisor} />
                )}
              </View>
            ))}

            <View style={{ borderWidth: 1, borderColor: theme.border.default, borderRadius: radius.md, overflow: 'hidden' }}>
              <Encabezado
                variante="portada"
                saludo="Buen día, Marcela."
                subtitulo="Dos atenciones hoy."
              />
            </View>
            <View style={{ borderWidth: 1, borderColor: theme.border.default, borderRadius: radius.md, overflow: 'hidden' }}>
              <Encabezado
                variante="portada"
                isotipo="gradiente"
                saludo="Zeus está listo."
                subtitulo="Su paseo empieza en 20 minutos."
                accionDer={<CampanaDemo />}
              />
            </View>
          </View>
        </Seccion>

        {/* BarraTabs — B3.7 */}
        <Seccion titulo="Barra de tabs — conmutá de verdad (el subrayado aparece, no se desliza)">
          <View style={{ borderWidth: 1, borderColor: theme.border.default, borderRadius: radius.md, overflow: 'hidden' }}>
            <BarraTabs items={ICONOS_TABS} activo={tabActivo} onCambiar={setTabActivo} />
          </View>
          <Text style={{ fontFamily: sans.regular, fontSize: typography.size.sm, color: theme.text.secondary, marginTop: spacing[3] }}>
            Activo: primary + pill accent.active 3×18 · inactivo: tertiary · badge = Insignia estado sm
          </Text>
        </Seccion>

        {/* Hoja — B3.8 */}
        <Seccion titulo="Hoja — el modal del sistema (swipe down para cerrar)">
          <Fila>
            <Boton variante="secundario" tamaño="sm" etiqueta="Contenido (auto)" onPress={() => setHoja('contenido')} />
            <Boton variante="secundario" tamaño="sm" etiqueta="Media (50%)" onPress={() => setHoja('media')} />
            <Boton variante="secundario" tamaño="sm" etiqueta="Completa (90%)" onPress={() => setHoja('completa')} />
            <Boton variante="secundario" tamaño="sm" etiqueta="Formulario" onPress={() => setHoja('form')} />
            <Boton variante="secundario" tamaño="sm" etiqueta="Confirmación" onPress={() => setHoja('confirmar')} />
            <Boton variante="secundario" tamaño="sm" etiqueta="Scroll largo" onPress={() => setHoja('scroll')} />
          </Fila>

          <Hoja
            visible={hoja === 'contenido' || hoja === 'media' || hoja === 'completa'}
            altura={hoja === 'ninguna' || hoja === 'form' || hoja === 'confirmar' || hoja === 'scroll' ? 'contenido' : hoja}
            titulo="Detalle rápido"
            conCerrar
            onCerrar={() => setHoja('ninguna')}
          >
            <Text style={{ fontFamily: sans.regular, fontSize: typography.size.base, lineHeight: typography.size.base * typography.leading.normal, color: theme.text.secondary, paddingBottom: spacing[4] }}>
              Cerrá con swipe down, tocando el fondo, la X o el back de Android. El agarre de arriba
              es la señal de swipeable.
            </Text>
          </Hoja>

          <Hoja visible={hoja === 'form'} altura="completa" titulo="Editar mascota" conCerrar onCerrar={() => setHoja('ninguna')}>
            <Campo label="Nombre" placeholder="ej: Zeus" />
            <Campo label="Notas" placeholder="Tocá acá y mirá el teclado empujar la hoja…" multilinea={3} />
            <Boton variante="primario" etiqueta="Guardar" bloque onPress={() => setHoja('ninguna')} />
          </Hoja>

          <Hoja visible={hoja === 'confirmar'} titulo="¿Cancelar el paseo?" onCerrar={() => setHoja('ninguna')}>
            <Text style={{ fontFamily: sans.regular, fontSize: typography.size.base, lineHeight: typography.size.base * typography.leading.normal, color: theme.text.secondary, paddingBottom: spacing[4] }}>
              La familia González va a recibir el aviso. Esta acción no se puede deshacer.
            </Text>
            <View style={{ gap: spacing[2], paddingBottom: spacing[2] }}>
              <Boton variante="destructivo" etiqueta="Cancelar el paseo" bloque onPress={() => setHoja('ninguna')} />
              <Boton variante="ghost" etiqueta="Volver" bloque onPress={() => setHoja('ninguna')} />
            </View>
          </Hoja>

          <Hoja visible={hoja === 'scroll'} altura="media" titulo="Scroll interno" onCerrar={() => setHoja('ninguna')}>
            {Array.from({ length: 24 }, (_, i) => (
              <Text key={i} style={{ fontFamily: sans.regular, fontSize: typography.size.base, lineHeight: typography.size.base * 2, color: theme.text.secondary }}>
                Línea {i + 1} — el swipe-down solo cierra con el scroll en top.
              </Text>
            ))}
          </Hoja>
        </Seccion>

        {/* Aviso — B3.9 */}
        <Seccion titulo="Aviso — feedback efímero (uno a la vez, cola)">
          <Fila>
            <Boton variante="secundario" tamaño="sm" etiqueta="Neutro" onPress={() => mostrar({ texto: 'Datos actualizados' })} />
            <Boton variante="secundario" tamaño="sm" etiqueta="Éxito" onPress={() => mostrar({ texto: 'Atención cerrada con calidad', variante: 'exito' })} />
            <Boton variante="secundario" tamaño="sm" etiqueta="Error" onPress={() => mostrar({ texto: 'No pudimos guardar los cambios. Revisá tu conexión.', variante: 'error' })} />
            <Boton
              variante="secundario"
              tamaño="sm"
              etiqueta="Con Deshacer"
              onPress={() =>
                mostrar({
                  texto: 'Paseo cancelado',
                  variante: 'neutro',
                  accion: { etiqueta: 'Deshacer', onPress: () => mostrar({ texto: 'Paseo restaurado', variante: 'exito' }) },
                })
              }
            />
            <Boton
              variante="secundario"
              tamaño="sm"
              etiqueta="Cola (2 seguidos)"
              onPress={() => {
                mostrar({ texto: 'Primero: guardando…' })
                mostrar({ texto: 'Segundo: esperó su turno en la cola', variante: 'exito' })
              }}
            />
          </Fila>
        </Seccion>

        {/* EstadoVacio — B3.9 */}
        <Seccion titulo="Estado vacío — dignidad, no hueco">
          <View style={{ gap: spacing[4] }}>
            <Tarjeta elevacion="reposo">
              <View style={{ minHeight: 320 }}>
                <EstadoVacio
                  icono={
                    <Svg width={56} height={56} viewBox="0 0 24 24" fill="none">
                      <Path d="M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1zM4 9.5h16M8.5 3v4M15.5 3v4" stroke={theme.text.tertiary} strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  }
                  titulo="Todavía nada por acá"
                  descripcion="Cuando agendes tu primera atención, va a aparecer acá."
                  accion={<Boton variante="primario" etiqueta="Configurar mi agenda" onPress={() => mostrar({ texto: 'Vamos a configurarla', variante: 'exito' })} />}
                />
              </View>
            </Tarjeta>
            <Tarjeta elevacion="reposo">
              <View style={{ minHeight: 240 }}>
                <EstadoVacio
                  icono={
                    <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
                      <Path d="M11 4a7 7 0 105.2 11.7L21 20.5M18 11a7 7 0 01-.3 2" stroke={theme.text.tertiary} strokeWidth={1.25} strokeLinecap="round" />
                    </Svg>
                  }
                  titulo="Sin resultados"
                  descripcion="Probá con otro nombre — a veces Zeus está guardado como Zeusito."
                />
              </View>
            </Tarjeta>
          </View>
        </Seccion>

        {/* ENSAMBLE MAYOR — pantalla embrión del prestador */}
        <Seccion titulo="Pantalla embrión — prestador (portada + agenda + CTA)">
          <View style={{ borderWidth: 1, borderColor: theme.border.default, borderRadius: radius['2xl'], overflow: 'hidden', backgroundColor: theme.bg.base }}>
            <Encabezado
              variante="portada"
              saludo="Buen día, Marcela."
              subtitulo="Dos atenciones hoy."
            />
            <View style={{ paddingHorizontal: spacing[4], paddingBottom: spacing[6], gap: spacing[4] }}>
              <Tarjeta elevacion="reposo" relleno="ninguno">
                <View style={{ padding: spacing[4], paddingBottom: spacing[2] }}>
                  <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.tertiary }}>
                    hoy · 2 citas
                  </Text>
                </View>
                <Celda
                  interactiva
                  onPress={() => {}}
                  accessibilityRole="button"
                  titulo="Zeus"
                  subtitulo="Paseo · familia González"
                  inicio={<Insignia capa="cuidado" soloPunto etiqueta="Capa cuidado" />}
                  metadataMono="17:30 · 45 min"
                />
                <Separador indentacion={spacing[3] + 10 + spacing[3]} />
                <Celda
                  interactiva
                  onPress={() => {}}
                  accessibilityRole="button"
                  titulo="Pati"
                  subtitulo="Grooming · baño y corte"
                  inicio={<Insignia capa="cuidado" soloPunto etiqueta="Capa cuidado" />}
                  metadataMono="19:00"
                />
              </Tarjeta>
              <Boton variante="primario" etiqueta="Iniciar la primera atención" bloque onPress={() => {}} />
            </View>
            <BarraTabs items={ICONOS_TABS} activo={tabActivo} onCambiar={setTabActivo} />
          </View>
          <Text style={{ fontFamily: sans.regular, fontSize: typography.size.sm, color: theme.text.secondary, marginTop: spacing[3] }}>
            Portada + Tarjeta + Celdas + Separador + Insignia + Boton + BarraTabs — la pantalla raíz completa, techo a piso. El template de S44.
          </Text>
        </Seccion>

        {/* Isotipo */}
        <Seccion titulo="Isotipo — 24 / 32 / 48 / 96">
          <View style={{ backgroundColor: theme.bg.card, borderRadius: radius.md, padding: spacing[5], borderWidth: 1, borderColor: theme.border.default, gap: spacing[5] }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing[6], flexWrap: 'wrap' }}>
              {[24, 32, 48, 96].map((s) => (
                <Isotipo key={s} size={s} variant={esDark || esMemorial ? 'blanco' : 'tinta'} />
              ))}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing[6], flexWrap: 'wrap' }}>
              {[24, 32, 48, 96].map((s) => (
                <Isotipo key={s} size={s} variant="gradiente" />
              ))}
            </View>
            <Text style={{ fontFamily: sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
              Gradiente de 6 stops = SOLO splash/logo (gradientLogo). En UI, el gradiente firma v2 es de 3 stops (violeta dominante al centro).
            </Text>
          </View>
        </Seccion>

        {/* Dosis */}
        <Seccion titulo="Dosificación asimétrica — una marca, dos dosis">
          <View style={{ gap: spacing[5] }}>
            {/* Prestador — dosis baja: primer ensamble Tarjeta+Boton del sistema */}
            <Tarjeta elevacion="reposo" relleno="amplio">
              <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.tertiary, marginBottom: spacing[2] }}>
                prestador · dosis baja
              </Text>
              <View style={{ marginBottom: spacing[3] }}>
                <Insignia capa="cuidado" etiqueta="Grooming · hoy" />
              </View>
              <Text style={{ fontFamily: sans.bold, fontSize: typography.size.lg, color: theme.text.primary, marginBottom: spacing[1] }}>Zeus — 15:00</Text>
              <Text style={{ fontFamily: sans.regular, fontSize: typography.size.base, color: theme.text.secondary, marginBottom: spacing[4] }}>
                Baño y corte · familia González
              </Text>
              <Boton variante="primario" etiqueta="Iniciar atención" bloque onPress={() => {}} />
              <Text style={{ fontFamily: sans.regular, fontSize: typography.size.xs, color: theme.text.tertiary, marginTop: spacing[2] }}>
                Un acento de capa por vista · CTA en tinta · Tarjeta plana+sm real
              </Text>
            </Tarjeta>

            {/* Dueño — dosis alta: tintes reales en las mini-cards */}
            <Tarjeta elevacion="reposo" relleno="amplio">
              <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.tertiary, marginBottom: spacing[2] }}>
                dueño · dosis alta
              </Text>
              <Text style={{ fontFamily: sans.light, fontSize: typography.size.xl, lineHeight: typography.size.xl * typography.leading.snug, color: theme.text.primary, marginBottom: spacing[3] }}>
                Zeus tuvo una gran semana
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing[2], marginBottom: spacing[4], flexWrap: 'wrap' }}>
                <Insignia capa="vida" etiqueta="Salud al día" />
                <Insignia capa="cuidado" etiqueta="Paseo hoy" />
                <Insignia capa="comunidad" etiqueta="3 amigos nuevos" />
              </View>
              <Boton
                variante="marca"
                etiqueta={esMemorial ? 'Recordar a Zeus' : 'Agendar un paseo'}
                bloque
                onPress={() => {}}
              />
              <Text style={{ fontFamily: sans.regular, fontSize: typography.size.xs, color: theme.text.tertiary, marginTop: spacing[2] }}>
                Capas visibles · gradiente firma solo en contextos cerrados{esMemorial ? ' · en memorial el gradiente no existe' : ''}
              </Text>
            </Tarjeta>
          </View>
        </Seccion>

        <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.tertiary }}>
          tema activo: {mode} · gradiente ui: {gradients.firmaUILight.angle}deg
        </Text>
      </View>
    </ScrollView>
  )
}
