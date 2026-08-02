/**
 * TokenGallery — herramienta de VERIFICACIÓN de B2 (no pantalla de producto).
 * Montada en /gallery de ambos apps. Muestra: paleta con hex, escala
 * tipográfica con la REGLA DE VOZ demostrada, espaciado/radios/sombras,
 * los 3 temas con toggle, isotipo en variantes y las dos cards de dosis.
 */

import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

import { useState } from 'react'

import { palette, gradients } from '../tokens/palette'
import { typography } from '../tokens/typography'
import { spacing } from '../tokens/spacing'
import { radius } from '../tokens/radius'
import { ThemeProvider, useTheme } from '../ThemeProvider'
import { Isotipo } from '../brand/Isotipo'
import { MarcaDeAgua } from '../brand/MarcaDeAgua'
import { Atmosfera } from '../brand/Atmosfera'
import { Boton, type BotonVariante } from '../components/Boton'
import { Tarjeta, type TarjetaTinte } from '../components/Tarjeta'
import { Campo, PieDeCampo } from '../components/Campo'
import { Celda } from '../components/Celda'
import { Separador } from '../components/Separador'
import { Insignia } from '../components/Insignia'
import { Encabezado } from '../components/Encabezado'
import { BarraTabs, type BarraTabsItem } from '../components/BarraTabs'
import { Hoja, HojaScroll, type HojaAltura } from '../components/Hoja'
import { CitaEnVivo } from '../components/CitaEnVivo'
import { Esqueleto, EsqueletoGrupo } from '../components/Esqueleto'
import { AvatarMascota } from '../components/AvatarMascota'
import { SelectorEspecie, type SelectorEspecieOpcion } from '../components/SelectorEspecie'
import { CampoFecha, type CampoFechaValor } from '../components/CampoFecha'
import { SelectorAvatar, type SelectorAvatarFoto } from '../components/SelectorAvatar'
import { SelectorOpcion } from '../components/SelectorOpcion'
import { SelectorSegmentado } from '../components/SelectorSegmentado'
import { TarjetaEstado } from '../components/TarjetaEstado'
import { SliderPrecio } from '../components/SliderPrecio'
import { VozComision } from '../components/VozComision'
import { Interruptor } from '../components/Interruptor'
import { StepperCantidad } from '../components/StepperCantidad'
import { CeldaNavegacion } from '../components/CeldaNavegacion'
import { Texto } from '../components/Texto'
import { FilaDato } from '../components/FilaDato'
import { LogoNegocio } from '../components/LogoNegocio'
import { FilaCita } from '../components/FilaCita'
import { PieRevelar } from '../components/PieRevelar'
import { PieReserva } from '../components/PieReserva'
import { MarcaEleccion } from '../brand/MarcaEleccion'
import { HeroMarca } from '../components/HeroMarca'
import { LineaDeVida, LineaDeVidaNodo, type LineaDeVidaItem } from '../components/LineaDeVida'
import { VisorFoto } from '../components/VisorFoto'
import { FichaVacuna } from '../components/FichaVacuna'
import { FichaMascotaHogar } from '../components/FichaMascotaHogar'
import { ClipSesion } from '../components/ClipSesion'
import { Icono, type IconoNombre } from '../components/Icono'
import { EsperaDeMarca } from '../brand/EsperaDeMarca'
import { Guijarro } from '../brand/Guijarro'
import { Cronometro } from '../components/Cronometro'
import { EvidenciaFoto, EvidenciaFotoThumbnail, type EvidenciaFotoEstado } from '../components/EvidenciaFoto'
import { BarrasSemana } from '../components/BarrasSemana'
import { CantoMarca } from '../components/CantoMarca'
import { Entrada } from '../components/Entrada'
import { EvitaTeclado } from '../components/EvitaTeclado'
import { Huella } from '../brand/Huella'
import { MapaRecorrido, type PuntoTrackMapa } from '../components/MapaRecorrido'

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

// S71-A3: muestra viva de PieRevelar — 3 ítems visibles, 2 plegados; el
// toggle revela y vuelve a plegar (el mismo control, el mismo lugar).
function MuestraPieRevelar() {
  const [revelado, setRevelado] = useState(false)
  const items = ['Thor · gastroenteritis', 'Zeus · profilaxis', 'Kary · control', 'Luna · vacuna', 'Rocco · herida']
  const visibles = revelado ? items : items.slice(0, 3)
  return (
    <View style={{ gap: spacing[3] }}>
      <Tarjeta elevacion="reposo" relleno="ninguno">
        {visibles.map((it, i) => (
          <View key={it}>
            {i > 0 ? <Separador /> : null}
            <Celda titulo={it} />
          </View>
        ))}
      </Tarjeta>
      <PieRevelar n={items.length - 3} revelado={revelado} onPress={() => setRevelado((v) => !v)} />
      <Texto variante="apoyo">
        La etiqueta dice el número — jamás un "Ver más" mudo. Con n=0 y sin revelar, no se dibuja.
        No es paginación (eso es el pie de LineaDeVida): solo muestra lo que ya está en memoria.
      </Texto>
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


// ── EL VERDE DEL ESTADO ACTIVO (S83-B13) — el founder ya FIRMÓ que en
// el prestador el focus va en verde (arbitra D-598 a favor de §15b.1).
// Lo que queda abierto es CUÁL verde, y la medición dice que ninguno solo
// sirve en los dos temas. Las tres candidatas sobre el CAMPO REAL y la
// BARRA REAL, en los dos temas del prestador.
function VerdeDelEstado({ acento, etiqueta }: { acento?: string; etiqueta: string }) {
  const [tab, setTab] = useState('a')
  const [txt, setTxt] = useState('')
  return (
    <View style={{ gap: spacing[2] }}>
      <Texto variante="apoyo">{etiqueta}</Texto>
      <Campo label="Nombre del negocio" value={txt} onChangeText={setTxt} placeholder="tocá para enfocar" />
      <BarraTabs items={ICONOS_TABS} activo={tab} onCambiar={setTab} estadoPorHuella acento={acento} />
    </View>
  )
}

function PataPrestador() {
  const [v, setV] = useState('baño')
  return (
    <SelectorSegmentado
      etiqueta="Qué servicio"
      proposito="eleccion"
      segmentos={[
        { codigo: 'baño', etiqueta: 'Baño' },
        { codigo: 'corte', etiqueta: 'Baño y corte' },
      ]}
      activo={v}
      onCambio={setV}
    />
  )
}

function CandidatasVerde() {
  return (
    <View style={{ gap: spacing[4] }}>
      <VerdeDelEstado acento={palette.tealDark} etiqueta="(a) tealDark #0A7268 — claro 5.51 · OSCURO 3.37 (pasa por poco, no ilumina)" />
      <VerdeDelEstado acento={palette.teal} etiqueta="(b) teal PURO #28E8DA — CLARO 1.46 (REPRUEBA el 3:1) · oscuro 12.70" />
      <VerdeDelEstado etiqueta="(c) EL PAR de dos registros — lo que el slot resuelve hoy: 5.51 en claro · 12.70 en oscuro" />
    </View>
  )
}

// ── ② EL GLOW (S83-B11, cruce armado por C) — las tres capas sobre las
// Tarjetas PLANAS del prestador en oscuro, que son las de D-589 (par
// 1.009: a efectos prácticos el mismo color que el fondo).
//
// EL BLOB es composición LOCAL de galería a propósito: es un candidato
// SIN FIRMA y la Ley 11 pide gate antes de que una pieza nazca en ui. Si
// el founder lo firma, nace ahí con su método completo. Forma 2 de S83-B8
// (RadialGradient de react-native-svg — CERO deps nuevas; el degradado ES
// el difuminado, no hace falta blur).
function TarjetasPlanasD589({ conGlow = false }: { conGlow?: boolean }) {
  return (
    <View style={{ gap: spacing[2] }}>
      {['Hoy · la jornada', 'Mascotas', 'La dirección de la sede'].map((t) => (
        <View key={t}>
          <Tarjeta elevacion="plana" luz={conGlow}>
            <Texto variante="cuerpo">{t}</Texto>
            <Texto variante="apoyo">par superficie/fondo 1.009 — D-589</Texto>
          </Tarjeta>
        </View>
      ))}
    </View>
  )
}

function GlowCasaVerde() {
  const { theme } = useTheme()
  const marco = {
    flex: 1,
    minWidth: 210,
    minHeight: 260,
    borderRadius: radius.md,
    overflow: 'hidden' as const,
    backgroundColor: theme.bg.base,
    padding: spacing[3],
    gap: spacing[2],
  }
  return (
    <View style={{ flexDirection: 'row', gap: spacing[2], flexWrap: 'wrap' }}>
      <View style={marco}>
        <Texto variante="apoyo">(a) HOY — fondo 3% + halo</Texto>
        <TarjetasPlanasD589 />
      </View>
      <View style={marco}>
        <Atmosfera color={palette.teal} origen="arriba" />
        <Texto variante="apoyo">(b) + BLOB radial por capa</Texto>
        <TarjetasPlanasD589 />
      </View>
      <View style={marco}>
        <Atmosfera color={palette.teal} origen="arriba" />
        <Texto variante="apoyo">(c) + blob Y glow en las planas</Texto>
        <TarjetasPlanasD589 conGlow />
      </View>
    </View>
  )
}

// ── S83-B33 · LA ESCALA DEL PAPEL VERDE (claro). Los hexes salen del
// MISMO método verificado del cliente: su #FAF2F5 es exactamente pink
// puro al 3% sobre light0, así que éstos son teal puro sobre light0.
const PAPEL_ESCALA: ReadonlyArray<{ pct: number; hex: string; cta: string }> = [
  { pct: 2, hex: '#F6F9F6', cta: '5.46' },
  { pct: 3, hex: '#F4F8F6', cta: '5.42' },
  { pct: 4, hex: '#F2F8F6', cta: '5.40' },
  { pct: 5, hex: '#F0F8F6', cta: '5.38' },
]

function EscalaPapelVerde() {
  return (
    <View style={{ flexDirection: 'row', gap: spacing[2], flexWrap: 'wrap' }}>
      {PAPEL_ESCALA.map((t) => (
        <View
          key={t.pct}
          style={{ flex: 1, minWidth: 130, minHeight: 128, borderRadius: radius.md, overflow: 'hidden', backgroundColor: t.hex, padding: spacing[2], gap: spacing[2] }}
        >
          <Tarjeta elevacion="reposo"><Texto variante="apoyo">tarjeta</Texto></Tarjeta>
          <Texto variante="apoyo">{t.pct}% · CTA {t.cta}</Texto>
        </View>
      ))}
    </View>
  )
}

// ── S83-B19 ① LA ESCALA DEL TAPIZ VERDE. Los hexes se derivan en HSL
// desde el ancla REAL de producción (#080D0E = "3%"), H y S fijos y L
// escalada — el mismo eje con el que nació. No son inventados acá.
const TAPIZ_ESCALA: ReadonlyArray<{ pct: number; hex: string; par: string; atm: string; luz: string }> = [
  { pct: 3, hex: '#080D0E', par: '1.009', atm: '1.008', luz: '2.30' },
  { pct: 4, hex: '#0B1113', par: '1.019', atm: '1.038', luz: '2.24' },
  { pct: 5, hex: '#0D1617', par: '1.056', atm: '1.096', luz: '2.16' },
  { pct: 6, hex: '#101A1C', par: '1.095', atm: '1.149', luz: '2.08' },
  { pct: 8, hex: '#152325', par: '1.199', atm: '1.277', luz: '1.90' },
]

function EscalaTapiz({ conLuz }: { conLuz: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing[2], flexWrap: 'wrap' }}>
      {TAPIZ_ESCALA.map((t) => (
        <View
          key={t.pct}
          style={{ flex: 1, minWidth: 128, minHeight: 132, borderRadius: radius.md, overflow: 'hidden', backgroundColor: t.hex, padding: spacing[2], gap: spacing[2] }}
        >
          <Tarjeta elevacion="plana" luz={conLuz}>
            <Texto variante="apoyo">tarjeta</Texto>
          </Tarjeta>
          <Texto variante="apoyo">{t.pct}% · crudo {t.par}</Texto>
          <Texto variante="apoyo">+atm {t.atm} · +luz {t.luz}</Texto>
        </View>
      ))}
    </View>
  )
}

// ── S83-B19 ② EL AGUA DEL CLIENTE, COPIADA. La receta que corre HOY en
// hogar/index:966 — entera, 210, centrada, 0.06 — replicada tal cual.
function AguaRecetaCliente({ color }: { color?: string }) {
  return <MarcaDeAgua tamano={210} alfa={0.06} color={color} />
}

// ── EL AGUA EN LA CASA VERDE (S83-B9) — lámina de gate. Las tres
// variantes sobre el FONDO REAL del prestador (light0 en claro ·
// tapizDarkOficio #080D0E en oscuro), montadas con la PIEZA REAL: sus
// props de gate tienen default = producción, así que lo que se firma es
// lo que corre. NO se enciende en apps/prestador: eso es de C, después.
// La CUARTA anatomía (S83-B14/B17): entera, derivada del ancho — la única
// opción que cumple "que se vea, no cortado" sin volver a un número fijo.
/** S84-B3 — un panel del agua sobre el FONDO REAL de la casa que lo
 *  envuelve. No pinta un hex: toma `theme.bg.base`, que en el prestador
 *  resuelve a `tapizDarkOficio`/`papelTapizOficio` por los ocho slots. La
 *  lámina vieja de S83 pintaba `palette.light0` a mano — correcto cuando
 *  el prestador NO tenía tinte claro, falso desde B33. */
function AguaAlfa({ alfa, rotulo, ratio }: { alfa: number; rotulo: string; ratio: string }) {
  const { theme } = useTheme()
  return (
    <View style={{ flex: 1, gap: spacing[1] }}>
      <View style={{ height: 190, borderRadius: radius.md, overflow: 'hidden', backgroundColor: theme.bg.base, justifyContent: 'flex-end' }}>
        <MarcaDeAgua alfa={alfa} />
      </View>
      <Texto variante="apoyo">{rotulo}</Texto>
      <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.tertiary }}>
        {ratio}
      </Text>
    </View>
  )
}

function MarcaDeAguaEntera({ alfa }: { alfa: number }) {
  const { width } = useWindowDimensions()
  return <MarcaDeAgua alfa={alfa} tamano={Math.round(width * 0.55)} />
}

function AguaCasaVerde() {
  const { theme } = useTheme()
  const marco = {
    height: 168,
    flex: 1,
    minWidth: 150,
    borderRadius: radius.md,
    overflow: 'hidden' as const,
    backgroundColor: theme.bg.base,
  }
  const pie = { padding: spacing[2] }
  return (
    <View style={{ gap: spacing[3] }}>
      <Texto variante="seccion">✅ FIRMADA Y APLICADA — la receta del Hogar es el DEFAULT de la pieza</Texto>
      <Texto variante="apoyo">
        FIRMADO (S83-B22): "no puedes copiar cómo quedó en cliente? Allí quedó bien". La receta del
        Hogar —entera, centrada— ES EL DEFAULT de MarcaDeAgua. Su ALFA se enmendó a 0.045 en S84-B6 (firma founder: "que se vea 25 a 40% menos").
        Lo único que cambió respecto del Hogar es la ROBUSTEZ, que es lo que la orden autorizó a
        proponer: su 210 es FIJO y en una pantalla de 320 el isotipo ocupa el 96% del ancho (roza).
        El factor 0.536 reproduce ese 210 EXACTO a 390 px y mantiene el mismo 78% en cualquier
        ancho. En el teléfono del gate se ve idéntico.
      </Texto>
      <View style={{ flexDirection: 'row', gap: spacing[2], flexWrap: 'wrap' }}>
        {[0.08, 0.1, 0.12].map((a) => (
          <View key={a} style={marco}>
            <MarcaDeAguaEntera alfa={a} />
            <View style={pie}>
              <Texto variante="apoyo">alfa {a} — {a === 0.08 ? '1.176' : a === 0.1 ? '1.240' : '1.314'} en oscuro</Texto>
            </View>
          </View>
        ))}
      </View>
      <Texto variante="apoyo">
        ⚠️ EL CHOQUE QUE ESTO ABRE, y es firma tuya: el argumento que dejó la LEY 4 INTACTA fue que
        el agua "no es un isotipo" porque cortada NO IDENTIFICA. Una silueta ENTERA sí identifica.
        Si el agua entera gana, una pantalla con agua + isotipo en el techo son DOS isotipos y la
        Ley 4 (uno por pantalla) vuelve a la mesa.
      </Texto>

      <Texto variante="seccion">Las tres que el veredicto descartó — quedan para el cotejo</Texto>
      <View style={{ flexDirection: 'row', gap: spacing[2], flexWrap: 'wrap' }}>
        <View style={marco}>
          <MarcaDeAgua />
          <View style={pie}>
            <Texto variante="apoyo">(a) TEÑIDA al oficio — tealDark</Texto>
          </View>
        </View>
        <View style={marco}>
          <MarcaDeAgua rampa />
          <View style={pie}>
            <Texto variante="apoyo">(b) LA RAMPA — lo que §15b.2 prohíbe</Texto>
          </View>
        </View>
        <View style={marco}>
          <MarcaDeAgua alfa={0.12} />
          <View style={pie}>
            <Texto variante="apoyo">(c) alfa 0.12 (hoy 0.06)</Texto>
          </View>
        </View>
      </View>

      <Texto variante="seccion">Y CONTRA QUÉ SE COMPARA: lo que las apps pintan HOY</Texto>
      <Texto variante="apoyo">
        CORRECCIÓN S83-B10 (el founder tenía la app abierta y veía el agua; mi censo decía que
        nadie la encendía). `MarcaDeAgua` de packages/ui NO CORRE EN NINGÚN LADO: su prop del
        ThemeProvider tiene default false y ninguna app la pasa. Lo que se ve son TRES inlines
        con @override-s82c, y no difieren solo en el alfa: difieren en ANATOMÍA.
      </Texto>
      <View style={{ flexDirection: 'row', gap: spacing[2], flexWrap: 'wrap' }}>
        <View style={marco}>
          <MarcaDeAgua alfa={0.06} tamano={210} />
          <View style={pie}>
            <Texto variante="apoyo">HOY · Hogar del cliente — 0.06 · 210 · ENTERA, no sangra</Texto>
          </View>
        </View>
        <View style={marco}>
          <MarcaDeAgua alfa={0.04} tamano={1000} />
          <View style={pie}>
            <Texto variante="apoyo">HOY · ficha de mascota — 0.04 · 1000 · sangrada</Texto>
          </View>
        </View>
        <View style={marco}>
          {/* réplica del inline de apps/prestador/bienvenida-dia1.tsx:141 —
              otra ANATOMÍA (esquina, no centrada), por eso no sale de la
              pieza: se muestra tal como la app la escribe. */}
          <View pointerEvents="none" style={{ position: 'absolute', right: -70, bottom: -30, opacity: 0.03 }}>
            <Isotipo size={280} variant="tinta" />
          </View>
          <View style={pie}>
            <Texto variante="apoyo">HOY · bienvenida del PRESTADOR — 0.03 · 280 · ESQUINA</Texto>
          </View>
        </View>
      </View>
      <Texto variante="apoyo">
        LAS TRES DIVERGENCIAS QUE ESTO DESTAPA, y son decisión tuya: ① los tres alfas son
        distintos (0.06 · 0.04 · 0.03); ② las tres anatomías también (entera · sangrada ·
        esquina); ③ la casa verde YA TIENE agua y no parte de cero: es la de la bienvenida.
      </Texto>
      <Texto variante="seccion">LA CONTRADICCIÓN QUE SE FIRMA ACÁ — y es la primera vez</Texto>
      <Texto variante="apoyo">
        El JSDoc de MarcaDeAgua declara que la variante COMPLETA "murió con su trabajo hecho
        (Ley 37)" y que rige la SANGRADA al 150% — firmada por vos en S82-B r15 mirando las dos.
        Y el Hogar, la pantalla que estás mirando, pinta la COMPLETA: size 210, silueta entera,
        sin overflow. La letra y la pantalla dicen cosas distintas, y ninguna de las dos está mal
        por sí sola: lo que falta es la firma que las reconcilie.
      </Texto>
      <Texto variante="apoyo">
        POR QUÉ IMPORTA MÁS DE LO QUE PARECE: el argumento que dejó la Ley 4 INTACTA fue que el
        agua "no es un isotipo" porque cortada por los cuatro bordes no identifica — sin silueta
        cerrada, sin escala legible. Ese argumento se apoya en la SANGRADA. La completa del Hogar
        tiene silueta cerrada. Elegir la anatomía es, de paso, decidir si ese argumento sigue en
        pie o si la Ley 4 vuelve a la mesa. Lo que se firma acá vale para el ECOSISTEMA: cliente y
        prestador, las tres pantallas, una sola anatomía.
      </Texto>
      <Texto variante="apoyo">
        MEDIDO, y corrige la premisa de (c): sobre el verde #080D0E el agua da 1.120, y sobre el
        magenta del cliente 1.105 — en la casa verde NO está más invisible, está apenas mejor. En
        claro da 1.125. Si 0.06 se aprobó al filo para el cliente, acá está en la misma zona: (c)
        se monta igual porque el ojo manda sobre el número, pero no hay evidencia de que el verde
        lo obligue.
      </Texto>
    </View>
  )
}

function AguaCasaVerdeTeñida() {
  // (a) necesita el color del oficio, que en el tema del CLIENTE no vive:
  // se pasa explícito el mismo tealDark que `lightOficio`/`darkOficio`
  // ponen en accent.control (S83-B6) — sin inventar un hex.
  return <MarcaDeAgua color={palette.tealDark} />
}

/** LÁMINA DE GATE S82-B r9 (orden founder): los candidatos de PAPEL
 *  TAPIZ pintados A SANGRE en un panel con contenido real, el agua del
 *  isotipo en sus dos alfas vivos, los dos glifos de control a 21px y la
 *  variante `voz`. El valor NO está decidido — esta lámina existe para
 *  que el ojo elija (regla 80: la ley después del resultado firmado). */
/** ══════════════════════════════════════════════════════════════════
 *  GATE S82 — LA GALERÍA PARA DECIDIR, no para catalogar (orden founder
 *  r13). Cada decisión abierta trae: (a) los candidatos LADO A LADO —
 *  jamás en secuencia, porque un color no se elige de memoria —, (b) el
 *  FONDO REAL del cliente (el tapiz; y el degradado del techo donde
 *  importa, porque ahí el ocre pierde: 3.11 medido), (c) su par de
 *  texto, que es la restricción que manda, y (d) UNA LÍNEA QUE DICE QUÉ
 *  DECIDE esa elección — la consecuencia en la ley, no el nombre del
 *  candidato.
 *  ══════════════════════════════════════════════════════════════════ */

/** Encabezado de decisión: el número, el asunto y la CONSECUENCIA. */
function Decision({ n, asunto, decide, children }: { n: string; asunto: string; decide: string; children: React.ReactNode }) {
  const { theme } = useTheme()
  return (
    <View style={{ gap: spacing[3], paddingTop: spacing[4] }}>
      <View style={{ gap: spacing[1] }}>
        <Texto variante="seccion">{`${n} · ${asunto}`}</Texto>
        {/* QUÉ DECIDE — en danger a propósito: no es descripción, es la
            consecuencia de firmar. */}
        <Texto variante="apoyo" color="danger">{decide}</Texto>
      </View>
      {children}
      <View style={{ height: 1, backgroundColor: theme.border.default }} />
    </View>
  )
}


/** S82-B r17 — LAS NUEVE ENTRADAS QUE FALTABAN. Cada pieza importada de
 *  packages/ui; cero clones (regla dura del founder: "una galería que
 *  muestra un botón que no es EL botón hace firmar algo que no corre"). */
/** S82-B r17 — LO RECHAZADO, MARCADO Y NO BORRADO (orden founder): si
 *  la pieza sigue viva en el código, la galería la muestra con su sello
 *  y su FECHA DE GATE — así se ve qué queda por curar en vez de
 *  desaparecer del radar. Lo que muere del código muere de la galería
 *  (Ley 37); esto es lo otro: lo que sobrevive sin haber sido firmado. */
function Rechazado({ fecha, razon, children }: { fecha: string; razon: string; children: React.ReactNode }) {
  const { theme } = useTheme()
  return (
    <View style={{ gap: spacing[2], padding: spacing[3], borderRadius: radius.md, backgroundColor: theme.status.dangerBg }}>
      <Texto variante="dato" color="danger">{`RECHAZADO en gate ${fecha}`}</Texto>
      <Texto variante="apoyo" color="danger">{razon}</Texto>
      {children}
    </View>
  )
}

/** Las piezas que el founder rechazó y siguen vivas en el código. */
function LoRechazado() {
  return (
    <View style={{ gap: spacing[4] }}>
      <Rechazado
        fecha="29-jul-2026"
        razon="EL CTA DEL CLIENTE EN TINTA (Ley 21, mitad del cliente). Enmendado en r15: el CTA pasó a ocre con label tinta. Sobrevive como `accent.cta` del PRESTADOR (tealDark) y en memorial, donde SÍ rige — por eso no se borra."
      >
        <View style={{ height: 48, borderRadius: radius.md, backgroundColor: palette.textLight0, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.base, color: palette.light0 }}>el CTA negro de antes</Text>
        </View>
      </Rechazado>

      <Rechazado
        fecha="29-jul-2026"
        razon="EL CONTORNO COMO ACCIÓN. `Boton secundario` y `compacto` siguen con borde y siguen VIVOS en decenas de pantallas: su muerte ANCHA es D-483 con mecánica al-tocarse (migra por craft, jamás por barrida). `sinCaja` es el reemplazo firmado — se ve arriba, con su sombra."
      >
        <View style={{ flexDirection: 'row', gap: spacing[2] }}>
          <View style={{ flex: 1 }}><Boton variante="secundario" etiqueta="secundario" bloque onPress={() => {}} /></View>
          <View style={{ flex: 1 }}><Boton variante="compacto" etiqueta="compacto" bloque onPress={() => {}} /></View>
        </View>
      </Rechazado>
    </View>
  )
}

function PiezasFaltantes() {
  const { theme } = useTheme()
  const [remonte, setRemonte] = useState(0)
  const [hojaScrollAbierta, setHojaScrollAbierta] = useState(false)
  return (
    <View style={{ gap: spacing[5] }}>

      <View style={{ gap: spacing[2] }}>
        <Texto variante="dato">BarrasSemana — 7 días reales; el día sin dato es barra base (la verdad tal cual, L-139)</Texto>
        <BarrasSemana valores={[38, 0, 26, 44, 0, 31, 22]} etiqueta="Kilómetros por día, últimos 7" />
      </View>

      <View style={{ gap: spacing[2] }}>
        <Texto variante="dato">CantoMarca — cero props: el ancho y la rampa son LEY (§9.1)</Texto>
        <View style={{ flexDirection: 'row', height: 60 }}>
          <CantoMarca />
          <View style={{ flex: 1, backgroundColor: theme.bg.card, justifyContent: 'center', paddingLeft: spacing[3] }}>
            <Texto variante="cuerpo">el canto al borde del portador</Texto>
          </View>
        </View>
      </View>

      <View style={{ gap: spacing[2] }}>
        <Texto variante="dato">Entrada — §5: 300 ms · escalón 120 · desde 15. REMONTABLE: se ve la animación, no una captura</Texto>
        <Boton variante="compacto" etiqueta="Verla otra vez" onPress={() => setRemonte((n) => n + 1)} />
        <View key={remonte} style={{ gap: spacing[2] }}>
          <Entrada><Texto variante="seccion">lo primero que el ojo encuentra</Texto></Entrada>
          <Entrada orden={1}><Texto variante="cuerpo">lo segundo</Texto></Entrada>
          <Entrada orden={2}><Texto variante="apoyo">lo tercero</Texto></Entrada>
        </View>
      </View>

      <View style={{ gap: spacing[2] }}>
        <Texto variante="dato">EvidenciaFoto.Thumbnail — los tres estados; la foto JAMÁS desaparece por error</Texto>
        <View style={{ flexDirection: 'row', gap: spacing[3] }}>
          {(['subiendo', 'subida', 'error'] as EvidenciaFotoEstado[]).map((e) => (
            <EvidenciaFotoThumbnail key={e} uri={FOTO_MASCOTA_EJEMPLO} estado={e} tamano={72} onReintentar={() => {}} />
          ))}
        </View>
        <Texto variante="apoyo">
          EvidenciaFoto.Capturar NO se monta: abre la CÁMARA al tocarse y dispararía permisos del sistema dentro de una herramienta de verificación (exención declarada en R17).
        </Texto>
      </View>

      <View style={{ gap: spacing[2] }}>
        <Texto variante="dato">EvitaTeclado — la casa tiene UNA (D-498); envuelve el campo para que el teclado no lo tape</Texto>
        <EvitaTeclado>
          <Campo label="Escribí para ver el patrón" placeholder="el teclado no lo tapa" />
        </EvitaTeclado>
      </View>

      <View style={{ gap: spacing[2] }}>
        <Texto variante="dato">HojaScroll — el scrollable que GANA dentro de la Hoja (patrón SM block, L-132)</Texto>
        <Boton variante="compacto" etiqueta="Abrir una Hoja con lista larga" onPress={() => setHojaScrollAbierta(true)} />
        <Hoja visible={hojaScrollAbierta} onCerrar={() => setHojaScrollAbierta(false)} titulo="HojaScroll" conCerrar>
          <HojaScroll>
            <View style={{ gap: spacing[2], paddingBottom: spacing[4] }}>
              {Array.from({ length: 14 }, (_, i) => (
                <Texto key={i} variante="cuerpo">{`fila ${i + 1} — arrastrá: el scroll gana contra el swipe-to-close`}</Texto>
              ))}
            </View>
          </HojaScroll>
        </Hoja>
      </View>

      <View style={{ gap: spacing[2] }}>
        <Texto variante="dato">Huella — LA primitiva canónica (nadie la redibuja). Devuelve un &lt;G&gt;: SIEMPRE dentro de un Svg</Texto>
        <View style={{ flexDirection: 'row', gap: spacing[4], alignItems: 'center' }}>
          {[1, 0.5, 0.35].map((e) => (
            <Svg key={e} width={24 * (e === 1 ? 1.6 : 1.6)} height={24 * 1.6} viewBox="0 0 24 24">
              <Huella color={theme.capa.comunidad} escala={e} x={e === 1 ? 0 : 12 - 12 * e} y={e === 1 ? 0 : 12 - 12 * e} />
            </Svg>
          ))}
          <Texto variante="apoyo">escala 1 · 0.5 (tabs) · 0.35 (glifos)</Texto>
        </View>
      </View>

      <View style={{ gap: spacing[2] }}>
        <Texto variante="dato">LineaDeVidaNodo — el nodo suelto (la lista entera vive en su propia sección)</Texto>
        <LineaDeVidaNodo item={itemsLineaDeVida()[0]} conAgrupador={false} esUltimo />
      </View>

    </View>
  )
}


/** S82-B r21 — LAS TRES SALIDAS DEL OSCURO, sobre EL MISMO chip de
 *  duración y lado a lado. Los dos lados del par están cerrados por
 *  medición (r19: subir card rompe 6 pares AA · r20: bajar el fondo no
 *  alcanza — el +0.05 de WCAG aplana el extremo oscuro), así que lo que
 *  se compara acá NO es un valor: son tres MANERAS de que una superficie
 *  exista en oscuro. */
function TresSalidasOscuro() {
  const { theme } = useTheme()
  const chip = (extra: object) => (
    <View style={{ height: 64, borderRadius: radius.suave, backgroundColor: theme.bg.card, alignItems: 'center', justifyContent: 'center', ...extra }}>
      <Texto variante="cuerpo">60 min</Texto>
      <Texto variante="dato">$12</Texto>
    </View>
  )
  return (
    <View style={{ gap: spacing[4], backgroundColor: theme.bg.base, padding: spacing[4], borderRadius: radius.md }}>
      <View style={{ flexDirection: 'row', gap: spacing[3] }}>
        <View style={{ flex: 1, gap: spacing[2] }}>{chip({})}<Texto variante="dato">(a) HOY · 1.05</Texto></View>
        <View style={{ flex: 1, gap: spacing[2] }}>
          {chip({ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.14)' })}
          <Texto variante="dato">(b) HALO · la masa sigue en 1.05</Texto>
        </View>
        <View style={{ flex: 1, gap: spacing[2] }}>
          <View style={{ height: 64, alignItems: 'center', justifyContent: 'center' }}>
            <Texto variante="cuerpo">60 min</Texto>
            <Texto variante="dato">$12</Texto>
          </View>
          <Texto variante="dato">(c) SIN TARJETA</Texto>
        </View>
      </View>
      <Texto variante="apoyo">
        (a) LA REFERENCIA. Cuesta: nada. Toca: ninguna ley — y es el estado que el founder cazó tres veces con el ojo.
      </Texto>
      <Texto variante="apoyo">
        (b) HALO — en oscuro la elevación se expresa como LUZ, no como sombra. Cuesta: una línea de 1px al 14% (rinde 2.09 contra el fondo: el ojo la ve, y es justo lo que la sombra no puede dar en oscuro). NO mueve el par superficie/fondo: separa por CONTORNO, no por masa, así que NO toca ni un texto ni los 178 pares. LA LEY QUE ROZA, declarada: A6 dice SIN CAJA y Ley 20 manda la sombra por token — un halo NO es caja (no rodea: es el borde superior donde pegaría la luz) y NO es sombra artesanal si nace como token de elevación oscura. Las dos cosas son de mesa, no las decido acá.
      </Texto>
      <Texto variante="apoyo">
        (c) SIN TARJETA — si la aritmética no permite separar, quizá el oscuro no deba tener tarjetas y el agrupamiento lo haga el AIRE. Cuesta: la superficie desaparece como pieza y hay que re-componer con espaciado; el contenido no pierde nada (el texto ya vive sobre el fondo con 17.73). Toca: nada firmado — pero cambia la gramática del tema, y eso es decisión de producto, no de token.
      </Texto>
      <Texto variante="apoyo" color="danger">
        LA CARA, para elegirla sabiendo que lo es: subir los textos de capa del oscuro (violetText/pinkDark) ANTES, después las superficies, y re-medir los 178 pares. Es una tanda propia con su gate.
      </Texto>
    </View>
  )
}


/** S82-B r33 — EL HALO SOBRE UNA TARJETA REAL. LA PREGUNTA QUE QUEDÓ
 *  ABIERTA SIN QUE NADIE LO NOTARA: el founder eligió sin-tarjeta sobre
 *  halo, pero eligió mirando CHIPS (la lámina montaba SelectorDia y
 *  GrillaElegir). Las TARJETAS siguen sin separarse en oscuro — que es
 *  lo que cazó CUATRO veces — y esa es OTRA pregunta.
 *  Acá el halo va sobre `Tarjeta` de verdad, con su contenido real. */
function HaloSobreTarjeta() {
  const { theme } = useTheme()
  const cuerpo = (
    <View style={{ gap: spacing[1] }}>
      <Texto variante="cuerpo">Salió a pasear</Texto>
      <Texto variante="dato">28 jul · 3,1 km en 52 min</Texto>
    </View>
  )
  return (
    <View style={{ gap: spacing[4], backgroundColor: theme.bg.base, padding: spacing[4], borderRadius: radius.md }}>
      <View style={{ gap: spacing[2] }}>
        <Texto variante="dato">(a) la Tarjeta como está — card/base 1.037 al 3%</Texto>
        <Tarjeta elevacion="reposo">{cuerpo}</Tarjeta>
      </View>
      <View style={{ gap: spacing[2] }}>
        <Texto variante="dato">(b) LA MISMA Tarjeta con halo direccional (1px al 14% arriba)</Texto>
        <View style={{ backgroundColor: theme.bg.card, borderRadius: radius.md, padding: spacing[4], borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.14)' }}>
          {cuerpo}
        </View>
      </View>
      <Texto variante="apoyo" color="danger">
        ESTA ES OTRA PREGUNTA, no la que ya firmaste: sin-tarjeta resolvió los CHIPS (día, hora, duración), donde L-b ya mandaba escala y color de texto con ≥4 hermanos. Las TARJETAS siguen sin separarse — y el halo no las toca ni toca ningún texto: solo agrega el borde donde pegaría la luz.
      </Texto>
    </View>
  )
}


/** S82-B r34 — LA ELECCIÓN EXCLUYENTE: tres formas de la misma pregunta
 *  (baño vs baño-y-corte · sesión vs programa). El founder pidió
 *  "toggle" pero declaró que nunca pueden estar los dos prendidos, y eso
 *  NO es dos binarios: es UNA elección. */
function EleccionExcluyente() {
  const [seg, setSeg] = useState('bano')
  // FIRMADO (S82 r37): gana SelectorSegmentado con los DOS agregados del
  // founder — la letra de la elegida en magenta y LA PATA pisándola. Los
  // otros dos candidatos (dos Interruptor · SelectorOpcion) MURIERON con
  // su trabajo hecho: el gate ocurrió y Ley 37 los saca del código, no
  // los deja "por si acaso". Lo que sobrevive de ellos es el ARGUMENTO,
  // que vive escrito en la cabecera de SelectorSegmentado — ahí es donde
  // lo va a buscar quien dude, no en una lámina que ya se firmó.
  return (
    <View style={{ gap: spacing[3] }}>
      <SelectorSegmentado
        etiqueta="Servicio"
        proposito="eleccion"
        segmentos={[{ codigo: 'bano', etiqueta: 'Baño' }, { codigo: 'corte', etiqueta: 'Baño y corte' }]}
        activo={seg}
        onCambio={setSeg}
      />
      <Texto variante="apoyo">
        Con la pata y el magenta deja de leerse como cambio de vista — que era el reparo de la mesa, y
        el founder lo resolvió mirando. La pata es la MISMA pieza de los otros dos controles
        (`MarcaEleccion`), no una versión nueva: PATA 24 · MONTA = PATA/3 · −14° · absoluta sobre el
        canto. Y el aire que la pata invade lo reserva EL COMPONENTE, no la pantalla.
      </Texto>
      <Texto variante="apoyo" color="danger">
        DESVÍO DECLARADO: la Ley 19.3 dice que este control cambia de VISTA y acá elige PRODUCTO. Va
        escrito en su cabecera con las dos posiciones. Si 19.3 se enmienda o nace una entrada nueva del
        diccionario es decisión de MESA — el componente no la toma; lo único que hace es no mentir en
        accesibilidad (con `proposito="eleccion"` el rol pasa de `tab` a `radio`).
      </Texto>
    </View>
  )
}

function GateS82() {
  const TAPIZ = palette.papelTapiz
  return (
    <View style={{ gap: spacing[2] }}>

      <Decision
        n="1"
        asunto="EL ORO — FIRMADO (oro A #FCBC1D, label tinta)"
        decide="YA NO SE ELIGE: se verifica. Los otros dos candidatos salieron (Ley 37: el gate ocurrió). #fff645 retirado y el estatuto solo-marca INTACTO, sin enmienda."
      >
        <View style={{ flexDirection: 'row', gap: spacing[2] }}>
          <View style={{ flex: 1, backgroundColor: TAPIZ, padding: spacing[3], borderRadius: radius.md, gap: spacing[1] }}>
            <Boton variante="primario" etiqueta="Agendar" bloque onPress={() => {}} />
            <Texto variante="dato">claro · fill 1.55</Texto>
          </View>
          <View style={{ flex: 1, backgroundColor: palette.dark0, padding: spacing[3], borderRadius: radius.md, gap: spacing[1] }}>
            <ThemeProvider defaultMode="dark"><Boton variante="primario" etiqueta="Agendar" bloque onPress={() => {}} /></ThemeProvider>
            <Texto variante="dato">oscuro · fill 11.97</Texto>
          </View>
        </View>
      </Decision>

      <Decision
        n="2"
        asunto="LO FIRMADO EN ESTA PASADA — verificación, no elección"
        decide="Ya no se elige: se comprueba que lo firmado corre. Si algo acá no coincide con lo que firmaste, es un bug mío, no una opción."
      >
        <View style={{ backgroundColor: TAPIZ, padding: spacing[3], borderRadius: radius.md, gap: spacing[3] }}>
          <Texto variante="dato">CTA del cliente — ocre con label tinta (Ley 21 enmendada en su mitad del cliente)</Texto>
          <Boton variante="primario" etiqueta="Agendar" bloque onPress={() => {}} />
          <Texto variante="dato">la VOZ del producto — sin itálica: 300 light · 18 · interlineado 1.75</Texto>
          <Texto variante="voz">Su expediente se completa de a poco. Cada dato que sumás es uno menos que hay que adivinar en una urgencia.</Texto>
          <Texto variante="dato">contra el cuerpo (400 · 15) y el apoyo (400 · 13), para ver que el registro se separa</Texto>
          <Texto variante="cuerpo">Su expediente se completa de a poco.</Texto>
          <Texto variante="apoyo">Su expediente se completa de a poco.</Texto>
          <Texto variante="dato">glifos — los DOS tamaños firmados, elegidos por componente</Texto>
          <View style={{ flexDirection: 'row', gap: spacing[4], alignItems: 'center' }}>
            <Texto variante="dato">21</Texto>
            <Icono nombre="lapiz" tamano={21} registro="tinta" />
            <Icono nombre="compartir" tamano={21} registro="tinta" />
            <Icono nombre="vacuna" tamano={21} />
            <Texto variante="dato">28</Texto>
            <Icono nombre="lapiz" tamano={28} registro="tinta" />
            <Icono nombre="compartir" tamano={28} registro="tinta" />
            <Icono nombre="vacuna" tamano={28} />
          </View>
        </View>
        <View style={{ height: 200, borderRadius: radius.md, overflow: 'hidden', backgroundColor: TAPIZ }}>
          <MarcaDeAgua />
          <View style={{ padding: spacing[3] }}>
            <Texto variante="apoyo">la marca de agua SANGRADA — la Ley 4 quedó intacta: esto es textura, no un isotipo</Texto>
          </View>
        </View>
        <ThemeProvider defaultMode="dark">
          <PanelGateTema etiqueta="oscuro — sin tinte (firmado) · y sinCaja con su presencia nueva">
            <Boton variante="sinCaja" etiqueta="Ya tengo cuenta" bloque onPress={() => {}} />
          </PanelGateTema>
        </ThemeProvider>
      </Decision>

    </View>
  )
}

/** Panel con el fondo del tema anidado (para juzgar claro vs oscuro). */
function PanelGateTema({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  const { theme } = useTheme()
  return (
    <View style={{ gap: spacing[2], padding: spacing[3], borderRadius: radius.md, backgroundColor: theme.bg.base }}>
      <Texto variante="apoyo">{etiqueta}</Texto>
      {children}
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
    // LOTE S71-B2 (firmados founder sobre hoja de contacto — carpeta del
    // caso · documento con desglose):
    'caso', 'presupuesto',
    // LOS DOS DE CONTROL (S82-B r7, del archivo de referencia del
    // founder): el gate a 21px de la fila de abajo es EL gate — si la
    // punta del lápiz o la bandeja del compartir no se leen ahí, se
    // simplifican. Sin huella (son controles, no oficios).
    'lapiz', 'compartir',
    // S82-B r10: LA VACUNA con su glifo propio (la fila del perfil
    // pintaba `veterinaria` — sustitución genérica que Ley 12 prohíbe).
    'vacuna', 'bitacora',
    // S84-B5: CONTACTO — FIRMADO (el globo). Su candidato rival murió en
    // el gate; el porqué vive en el registry, no acá.
    'contacto',
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
      {/* S61-A12: la acción por NATURALEZA — vivo (pill §7.1) ·
          navegación (chevron en capa, sin caja) · acción (tonal cuidado) */}
      <FichaMascotaHogar
        nombre="Thor"
        voz="alDia"
        textoEstado="Está al día."
        accion={{ tipo: 'vivo', onPress: () => {} }}
        onPress={() => {}}
      />
      <FichaMascotaHogar
        nombre="Thor"
        voz="alDia"
        textoEstado="Está al día."
        proximaCitaMono="mar 15 jul · 09:00"
        accion={{ tipo: 'navegacion', capa: 'cuidado', etiqueta: 'Ver su cita', onPress: () => {} }}
        onPress={() => {}}
      />
      <FichaMascotaHogar
        nombre="Zeus"
        voz="pideAtencion"
        textoEstado="Le vence la antirrábica en 12 días."
        accion={{ tipo: 'accion', etiqueta: 'Ver su carnet', onPress: () => {} }}
        onPress={() => {}}
      />
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
  // Enmienda S61-A4: el para-quién con CARA — adorno por opción
  // (AvatarMascota xs: con foto real y con huella digna de fallback).
  const [quien, setQuien] = useState<string | undefined>('thor')
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
        acento="control"
        opciones={[
          {
            codigo: 'thor',
            etiqueta: 'Thor',
            // data-URI (galería autocontenida — la web headless no sale
            // a la red): un pixel plano que LLENA el círculo = "con foto".
            adorno: (
              <AvatarMascota
                nombre="Thor"
                fotoUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNs6POsBwAFCAICLIC/vQAAAABJRU5ErkJggg=="
                tamano="xs"
                anidadoEn="chip"
              />
            ),
          },
          {
            codigo: 'zeus',
            etiqueta: 'Zeus',
            // sin foto: la huella digna de fallback
            adorno: <AvatarMascota nombre="Zeus" tamano="xs" anidadoEn="chip" />,
          },
        ]}
        seleccionada={quien}
        onSelect={setQuien}
        etiqueta="¿Para quién es? (adorno S61 — con foto y con huella)"
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
      {/* Enmienda S62: cargando POR CHIP (server-toggles del grooming) —
          el chip en carga muestra spinner sin layout shift y no responde
          a re-toques; el resto sigue interactivo. Muestra FIJA en carga
          (la galería no simula roundtrips). */}
      <SelectorOpcion
        multiple
        acento="oficio"
        opciones={[
          { codigo: 'bano', etiqueta: 'Baño' },
          { codigo: 'corte', etiqueta: 'Corte', cargando: true },
          { codigo: 'unas', etiqueta: 'Uñas' },
        ]}
        seleccionadas={['bano', 'corte']}
        onSelect={() => {}}
        etiqueta="Cargando por chip (S62): 'Corte' en roundtrip, el resto vivo"
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
      {/* S61-A10: el SQUIRCLE en TODAS las tallas — con foto y con huella */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing[4], flexWrap: 'wrap' }}>
        <AvatarMascota nombre="Zeus" fotoUrl={FOTO_MASCOTA_EJEMPLO} tamano="xs" />
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
        <AvatarMascota nombre="Bruno" tamano="xs" />
        <AvatarMascota nombre="Bruno" tamano="lg" />
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
// S81 (junta A+B): `t` es requerido en el punto de track — el fixture
// camina a ~5 s por punto desde un instante FIJO (determinístico).
const T0_TRACK = Date.parse('2026-07-29T12:00:00Z')
const enT = (n: number) => new Date(T0_TRACK + n * 5_000).toISOString()
const TRACK_SIMULADO: PuntoTrackMapa[] = (() => {
  const esquinas = [
    { lat: -0.1826, lng: -78.4845 },
    { lat: -0.1826, lng: -78.4787 },
    { lat: -0.1872, lng: -78.4787 },
    { lat: -0.1872, lng: -78.4845 },
    { lat: -0.1826, lng: -78.4845 },
  ]
  const pts: PuntoTrackMapa[] = []
  for (let i = 0; i < esquinas.length - 1; i++) {
    const a = esquinas[i]
    const b = esquinas[i + 1]
    for (let j = 0; j < 10; j++) {
      const t = j / 10
      pts.push({
        lat: a.lat + (b.lat - a.lat) * t + Math.sin((i * 10 + j) * 1.7) * 0.00008,
        lng: a.lng + (b.lng - a.lng) * t + Math.cos((i * 10 + j) * 1.3) * 0.00008,
        t: enT(i * 10 + j),
      })
    }
  }
  pts.push({ ...esquinas[esquinas.length - 1], t: enT(40) })
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

// ── TarjetaEstado (§15b.0bis, promovida S83-B1): la gramática
// "ESTÁ / ESPERA". Lo que ESTÁ es superficie apoyada; lo que ESPERA es
// contorno. Los tres roles + el modo estático, que son los cuatro usos
// vivos del prestador. Estado propio por panel. ──
function EjemploTarjetaEstado() {
  const { theme } = useTheme()
  const [alterna, setAlterna] = useState(true)
  const [elegida, setElegida] = useState('ana')
  return (
    <View style={{ gap: spacing[3] }}>
      <TarjetaEstado
        encendido={alterna}
        etiqueta="Paseo"
        onPress={() => setAlterna((v) => !v)}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: sans.regular, fontSize: typography.size.base, color: theme.text.primary }}>
            Paseo
          </Text>
          <Text style={{ fontFamily: sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
            rol checkbox — alterna algo
          </Text>
        </View>
      </TarjetaEstado>

      {[
        { id: 'ana', nombre: 'Ana' },
        { id: 'beto', nombre: 'Beto' },
      ].map((p) => (
        <TarjetaEstado
          key={p.id}
          encendido={elegida === p.id}
          rol="radio"
          etiqueta={p.nombre}
          onPress={() => setElegida(p.id)}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: sans.regular, fontSize: typography.size.base, color: theme.text.primary }}>
              {p.nombre}
            </Text>
            <Text style={{ fontFamily: sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
              rol radio — elige entre pares
            </Text>
          </View>
        </TarjetaEstado>
      ))}

      <TarjetaEstado encendido={false} etiqueta="Llegó a las 10:30">
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: sans.regular, fontSize: typography.size.base, color: theme.text.primary }}>
            Esperando
          </Text>
          <Text style={{ fontFamily: sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
            ESTÁTICA (sin onPress) — un toque que no hace nada es promesa rota
          </Text>
        </View>
      </TarjetaEstado>

      <Text style={{ fontFamily: sans.regular, fontSize: typography.size.xs, color: theme.text.tertiary }}>
        Tocá de verdad: lo que ESTÁ se apoya (superficie + elevacion.reposo, sin borde — Ley 20); lo que ESPERA es contorno.
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
      <Separador />
      {/* S83-B12 — EL ESTADO NUEVO: encabezado de sección que DESPLIEGA.
          El criterio es E14, ya firmado: información despliega ⌄/⌃, acción
          con formulario lleva ›. Se monta para que el estado exista donde
          se puede mirar; la prop sin muestra es una prop que nadie firma. */}
      <CeldaNavegacion icono="veterinaria" titulo="Sus vacunas" detalle="8 aplicadas" direccion="abajo" registro={registro} onPress={() => {}} />
      <Separador />
      <CeldaNavegacion icono="veterinaria" titulo="Sus vacunas" detalle="desplegado — el mismo control pliega" direccion="arriba" registro={registro} onPress={() => {}} />
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

        {/* ═══════════════════════════════════════════════════════════
            LO QUE ESPERA TU FIRMA — VA PRIMERO, Y ESTA VEZ DE VERDAD
            ═══════════════════════════════════════════════════════════
            S82-B: este bloque vivía en la posición 36 de 58, detrás del
            catálogo entero, con un comentario que decía "Va PRIMERA: es
            lo que el founder viene a mirar". **El comentario decía la
            intención y el orden decía otra cosa** — el founder tuvo que
            pedir los nombres porque no las encontraba.

            LA REGLA QUE DEJA, y es del founder: *una lámina de gate que
            no se encuentra no es una lámina de gate.* La galería hace
            DOS trabajos y no son el mismo: CATÁLOGO (referencia, se
            hojea cuando hace falta) y LÁMINA DE GATE (una decisión que
            espera hoy). Lo que espera decisión va arriba; el catálogo
            es lo que se hojea. Cuando un gate se firma, su sección
            BAJA al catálogo o muere (Ley 37) — no se queda arriba
            ocupando el lugar del siguiente. ═══════════════════════ */}
        {/* ═══ S83-B9: el agua en la casa verde. Va PRIMERA junto al gate
            abierto porque es decisión viva, no catálogo. ═══ */}
        <Seccion titulo="① ⭐ GATE S83 — CUÁNTO PAPEL VERDE EN CLARO · qué decide: el nivel del tinte del prestador en el tema claro. ES ENMIENDA DE LA LETRA DE S82 (que decía que el prestador NO recibe tinte), firmada por el founder en S83: un tinte por casa en LOS DOS temas. Hoy corre el 3%">
          <ThemeProvider defaultMode="light" cta="oficio">
            <PanelGateTema etiqueta="prestador CLARO — el papel verde">
              <EscalaPapelVerde />
            </PanelGateTema>
          </ThemeProvider>
          <Texto variante="apoyo">
            EL MÉTODO ES EL DEL CLIENTE, reproducido y verificado: su papelTapiz #FAF2F5 es
            EXACTAMENTE pink puro al 3% sobre light0. Éstos son teal puro sobre light0 — mismo hex
            de marca, misma dosis, mismo orden. No es un verde elegido a ojo.
          </Texto>
          <Texto variante="apoyo">
            LO QUE EL FONDO ARRASTRA, medido antes de encenderlo (la lección del 8% oscuro): el CTA
            del prestador en claro baja de 5.51 a 5.42 al 3% — sigue muy por encima del mínimo 3, y
            CERO pares nuevos caen. A diferencia del oscuro, acá el fondo se aclara poco y los
            tintes con alpha casi no se mueven.
          </Texto>
        </Seccion>

        <Seccion titulo="① ⭐ GATE S83 — CUÁNTO TAPIZ · qué decide: el founder gateó DOS VECES que el 3% es 'muy muy leve'. Acá está la escala con su par card/base, y el número DA VUELTA la premisa — ver el rótulo">
          <ThemeProvider defaultMode="dark" cta="oficio">
            <PanelGateTema etiqueta="sin glow — el par crudo">
              <EscalaTapiz conLuz={false} />
            </PanelGateTema>
            <PanelGateTema etiqueta="CON la luz de la Atmosfera sobre la tarjeta">
              <EscalaTapiz conLuz />
            </PanelGateTema>
          </ThemeProvider>
          <Texto variante="apoyo">
            ⚠️ EL NÚMERO DA VUELTA LA PREMISA, y es lo que hay que saber antes de elegir: en la casa
            VERDE subir el tapiz MEJORA la separación (1.009 → 1.196), no la empeora. Tu recuerdo
            —"al 8% el par daba 1.009 y borraba las tarjetas"— es del CLIENTE y NO se traslada: su
            magenta y este verde parten de luminancias distintas respecto de la misma tarjeta. Acá
            el 3% es el PEOR de la escala, no el más seguro.
          </Texto>
          <Texto variante="apoyo">
            LOS TRES NÚMEROS, y CORRIJO lo que dije en B19 ("la Atmosfera no mueve el par"): sí lo
            mueve, y midiéndolo bien la dirección importa. CRUDO = card contra base. +ATM = los dos
            con la Atmosfera encima en su núcleo (alfa .18): al 3% BAJA a 1.008 —cuando ya son casi
            idénticos, el glow los acerca más— y del 4% en adelante SUBE. +LUZ = la tarjeta con
            `elevacion.luz`: 2.30 al 3%, y es de lejos lo que MÁS separa.
          </Texto>
          <Texto variante="apoyo">
            LO QUE ESO DECIDE, y son DOS preguntas distintas que conviene no mezclar: si lo que
            querés es PRESENCIA DE COLOR, subí sin miedo — acá el par mejora al subir, al revés que
            en el cliente. Si lo que querés es que LAS TARJETAS SE SEPAREN, eso ya lo resolvió la
            luz: al 3% con luz (2.30) separa MÁS que el 8% crudo (1.199). El tapiz no tiene que
            cargar con ese trabajo.
          </Texto>
          <Texto variante="apoyo">
            ③ ¿PIDE RE-MEDIR AA? Medido, y la respuesta tranquiliza: NO de forma significativa.
            text.primary 17.03 → 14.08 · text.secondary 7.45 → 6.70 · text.tertiary 3.22 → 3.21
            (mín 3). El terciario apenas se mueve porque secondary y tertiary son ALPHA sobre el
            fondo, no colores fijos: suben y bajan CON él. El riesgo real no está en la escala —
            está en que tertiary ya vive a 0.22 del mínimo HOY, con tapiz o sin él.
          </Texto>
        </Seccion>

        <Seccion titulo="① ⭐ GATE S84 — CUÁNTO SE NOTA EL AGUA · qué decide: UN SOLO ALFA para las DOS casas (firma founder: 'se nota demasiado; baja en cliente y en prestador, un poco más sutil'). ENMIENDA la firma de B22 ('copiá cómo quedó en cliente, allí quedó bien'), que puso el 0.06 que corre hoy. Los cuatro fondos son los REALES y los números son compuestos, no a ojo">
          <ThemeProvider defaultMode="dark" cta="oficio">
            <PanelGateTema etiqueta="① PRESTADOR OSCURO — tapiz 5% (#0D1617)">
              <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                <AguaAlfa alfa={0.045} rotulo="0.045" ratio="1.106 · 10 pasos" />
                <AguaAlfa alfa={0.035} rotulo="0.035" ratio="1.081 · 8 pasos" />
                <AguaAlfa alfa={0.03} rotulo="0.03" ratio="1.061 · 7 pasos" />
              </View>
            </PanelGateTema>
          </ThemeProvider>

          <ThemeProvider defaultMode="light" cta="oficio">
            <PanelGateTema etiqueta="② PRESTADOR CLARO — papel verde 3% (#F4F8F6)">
              <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                <AguaAlfa alfa={0.045} rotulo="0.045" ratio="1.092 · 10 pasos" />
                <AguaAlfa alfa={0.035} rotulo="0.035" ratio="1.073 · 8 pasos" />
                <AguaAlfa alfa={0.03} rotulo="0.03" ratio="1.061 · 7 pasos" />
              </View>
            </PanelGateTema>
          </ThemeProvider>

          <ThemeProvider defaultMode="dark">
            <PanelGateTema etiqueta="③ CLIENTE OSCURO — tapiz 3% (#0D050D)">
              <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                <AguaAlfa alfa={0.045} rotulo="0.045" ratio="1.070 · 11 pasos" />
                <AguaAlfa alfa={0.035} rotulo="0.035" ratio="1.053 · 8 pasos" />
                <AguaAlfa alfa={0.03} rotulo="0.03" ratio="1.046 · 7 pasos" />
              </View>
            </PanelGateTema>
          </ThemeProvider>

          <ThemeProvider defaultMode="light">
            <PanelGateTema etiqueta="④ CLIENTE CLARO — papel magenta 3% (#FAF2F5). ES DONDE VIVE LA FIRMA QUE SE ENMIENDA">
              <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                <AguaAlfa alfa={0.045} rotulo="0.045" ratio="1.093 · 10 pasos" />
                <AguaAlfa alfa={0.035} rotulo="0.035" ratio="1.073 · 8 pasos" />
                <AguaAlfa alfa={0.03} rotulo="0.03" ratio="1.057 · 7 pasos" />
              </View>
            </PanelGateTema>
          </ThemeProvider>

          <Texto variante="apoyo">
            SUTIL NO ES AUSENTE — el piso, medido: el agua deja de existir en 8 bits cuando el color
            compuesto redondea al del fondo, y eso pasa por DEBAJO de α 0.003 en los cuatro fondos.
            Los tres candidatos van de 7 a 11 pasos de 255: ninguno se acerca al piso. El más bajo
            (0.03) sigue siendo 10 veces el umbral de existencia.
          </Texto>
          <Texto variante="apoyo">
            LO QUE UN SOLO VALOR NO PUEDE ARREGLAR, dicho antes de elegir: los dos tapices oscuros
            están a % distinto (prestador 5%, cliente 3%), así que el MISMO alfa aterriza sobre
            luminancias distintas y el agua siempre va a leerse un poco más en el prestador oscuro
            (a 0.045: 1.106 contra 1.070). Es consecuencia de un valor único, no defecto del valor
            elegido — y con 3 milésimas de diferencia entre los dos claros, es el único eje donde se
            nota.
          </Texto>
          <Texto variante="apoyo">
            FIRMADO: 0.045 (−28% de exceso sobre 1.000, dentro del rango pedido) y YA ES EL DEFAULT.
            La lámina se conserva porque su comparación ES el registro de la decisión — y porque la
            RESERVA medida y no aplicada, 0.040 (−38%), es el escalón siguiente si a 0.045 el agua
            todavía se nota.
          </Texto>
        </Seccion>

        <Seccion titulo="① ⭐ GATE S83 — EL AGUA, COPIADA DEL CLIENTE (SUPERSEDED por la de arriba: su fondo es palette.light0 pintado a mano, que dejó de ser el fondo real del prestador cuando nació papelTapizOficio en B33) · qué decidió: si la receta del cliente servía en la casa verde, y en qué color">
          <ThemeProvider defaultMode="light" cta="oficio">
            <PanelGateTema etiqueta="prestador CLARO — la receta EXACTA del cliente">
              <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                <View style={{ flex: 1, height: 168, borderRadius: radius.md, overflow: 'hidden', backgroundColor: palette.light0 }}>
                  <AguaRecetaCliente />
                  <View style={{ padding: spacing[2] }}><Texto variante="apoyo">tal cual: text.primary</Texto></View>
                </View>
                <View style={{ flex: 1, height: 168, borderRadius: radius.md, overflow: 'hidden', backgroundColor: palette.light0 }}>
                  <AguaRecetaCliente color={palette.tealDark} />
                  <View style={{ padding: spacing[2] }}><Texto variante="apoyo">con el color de la casa</Texto></View>
                </View>
              </View>
            </PanelGateTema>
          </ThemeProvider>
          <Texto variante="apoyo">
            LA AMBIGÜEDAD QUE NO RESUELVO SOLA: "copiá la del cliente" y "con el color de la casa"
            piden cosas distintas — la del cliente usa text.primary (tinta). Van las DOS; elegís
            mirando.
          </Texto>
          <Texto variante="apoyo">
            EL 210 FIJO, con su límite medido (B14): en pantalla angosta roza los bordes, que es el
            defecto que el factor derivado existía para evitar. El equivalente sin número fijo es
            ~0.55 del ancho — se propone, no se aplica: la receta de partida es la tuya.
          </Texto>
          <Texto variante="apoyo">
            ⚠️ EL CHOQUE SIGUE EN PIE: entera IDENTIFICA. El argumento que dejó la Ley 4 intacta fue
            que cortada no identificaba. Agua + isotipo del techo serían DOS.
          </Texto>
        </Seccion>

        <Seccion titulo="① ⭐ GATE S83 — LA ATMOSFERA EN LA CASA MAGENTA · qué decide: el mismo glow firmado para el prestador, del lado del cliente. NO necesitó nada nuevo: la pieza pide su color y la pantalla declara su capa">
          <ThemeProvider defaultMode="dark">
            <PanelGateTema etiqueta="cliente OSCURO — capa cuidado (teal)">
              <View style={{ height: 200, borderRadius: radius.md, overflow: 'hidden' }}>
                <Atmosfera color={palette.teal} origen="arriba" />
                <View style={{ padding: spacing[3], gap: spacing[2] }}>
                  <Tarjeta elevacion="plana" luz><Texto variante="cuerpo">una tarjeta del cliente</Texto></Tarjeta>
                </View>
              </View>
            </PanelGateTema>
          </ThemeProvider>
          <Texto variante="apoyo">
            MEDIDO: no hizo falta slot ni token nuevo. `Atmosfera` pide `color` sin default a
            propósito, así que vive en cualquier casa — la pantalla declara de qué CAPA es su
            atmósfera. En el cliente eso es la capa del contexto; en el prestador, su oficio.
            No hay nada que impida montarla.
          </Texto>
        </Seccion>

        <Seccion titulo="① ⭐ GATE S83 — LA PATA EN EL PRESTADOR · qué decide: la marca de selección del cliente sobre el segmentado REAL del prestador, en teal. Sus dos límites van declarados, no son míos">
          <ThemeProvider defaultMode="light" cta="oficio">
            <PanelGateTema etiqueta="prestador CLARO — con la pata (proposito='eleccion')">
              <PataPrestador />
            </PanelGateTema>
          </ThemeProvider>
          <ThemeProvider defaultMode="dark" cta="oficio">
            <PanelGateTema etiqueta="prestador OSCURO">
              <PataPrestador />
            </PanelGateTema>
          </ThemeProvider>
          <Texto variante="apoyo">
            LÍMITE ①: en TEAL, jamás magenta (§15b.1). Mecanizado — `accent.marcaEleccion` pasa a
            ser SLOT (el séptimo) y R27 lo vigila junto a `control` y `active`: el magenta no puede
            entrar por esta puerta ni por olvido.
          </Texto>
          <Texto variante="apoyo">
            LÍMITE ②: EL FILTRO DE OFICIOS CONSERVA SU LÍNEA VIAJERA y no se toca — el censo S82 ya
            lo declaró: cada opción es un oficio y su glifo YA porta huella, así que la pata en
            todas no señalaría a ninguna. Unificarlo es firma tuya, no arrastre de esta.
          </Texto>
          <Texto variante="apoyo">
            LO QUE FALTA PARA QUE CORRA, declarado: hoy los segmentados del prestador no pasan
            `proposito` (grep en cero) y por eso corren en 'vista', marcando con el negro suave que
            viste. Ponerles `proposito="eleccion"` es de C, en sus pantallas — acá está montado
            sobre la pieza real para que se firme antes de aplicarlo.
          </Texto>
        </Seccion>

        <Seccion titulo="① ⭐ GATE S83 — CUÁL VERDE PARA EL ESTADO ACTIVO · lo FIRMADO: en el prestador el focus NO es magenta, va en verde que ilumine (arbitra D-598: gana §15b.1). Lo que se decide acá es el REGISTRO, y la medición dice que ninguno solo sirve en los dos temas — el focus es GRÁFICA (mín 3:1), no texto">
          {/* cta="oficio" NO ES DECORACIÓN: sin él la lámina resuelve el
              tema del CLIENTE y el rótulo miente — pintaba papelTapiz
              magenta donde dice papel algodón, y tapizDark donde dice el
              verde del oficio. Defecto mío, cazado por el founder en
              dispositivo (S83-B14): una lámina de gate que pinta la casa
              equivocada no es una lámina de gate. */}
          <ThemeProvider defaultMode="light" cta="oficio">
          <PanelGateTema etiqueta="prestador CLARO — papel #FAF9F7 · montada sobre la casa VERDE (las anteriores estaban sobre el fondo del CLIENTE)">
            <CandidatasVerde />
          </PanelGateTema>
          </ThemeProvider>
          <ThemeProvider defaultMode="dark" cta="oficio">
            <PanelGateTema etiqueta="prestador OSCURO — su tapiz verde #080D0E · sobre la casa VERDE (antes: fondo del cliente)">
              <CandidatasVerde />
            </PanelGateTema>
          </ThemeProvider>
          <Texto variante="apoyo">
            (c) NO trae un color nuevo: es la regla de dos registros que la Ley 2 y §15b.2 ya
            tienen — hex PURO sobre superficie oscura, variante *Dark sobre clara. El SLOT lo
            resuelve solo, porque se declara por TEMA. Está aplicado: lo que corre hoy es (c).
          </Texto>
          <Texto variante="apoyo">
            EL ALCANCE DE LA FIRMA, medido antes de tocar — accent.active lo consumen CUATRO
            piezas y las cuatro son estado o control funcional, así que ninguna frena: focus de
            Campo (:97) · borde de CampoFecha con su Hoja abierta (:257) · outline de foco del
            Boton en web, que es accesibilidad (:274) · huella y pill de la tab (BarraTabs
            :115/:149). El founder firmó sobre el focus; el slot mueve las cuatro.
          </Texto>
        </Seccion>

        <Seccion titulo="① ⭐ GATE S83 — EL GLOW EN LA CASA VERDE · qué decide: cómo se separa la superficie del fondo cuando YA SE GATEÓ que el fondo al 3% NO COMUNICA y el halo NO ALCANZA. Las tres capas sobre las Tarjetas planas de D-589 (par 1.009: a efectos prácticos, el mismo color que el fondo)">
          <ThemeProvider defaultMode="dark" cta="oficio">
            <PanelGateTema etiqueta="prestador OSCURO — donde vive el problema · sobre la casa VERDE (antes: fondo del cliente)">
              <GlowCasaVerde />
            </PanelGateTema>
          </ThemeProvider>
          <Texto variante="apoyo">
            EL BLOB es la forma 2 del relevamiento S83-B8: RadialGradient de react-native-svg, CERO
            dependencias nuevas — el degradado ES el difuminado, no hace falta blur ni Skia. Es el
            port honesto del AmbientGlow del portal viejo (blur 80px, alfa 0.16–0.22, color por
            token de CAPA) sin traer su paleta muerta.
          </Texto>
          <Texto variante="apoyo">
            LO QUE LA FIRMA TIENE QUE SABER, declarado: (1) la Ley 7 vigente dice que el glow es
            SEMÁNTICO —reservado a "en vivo/en curso", dark only— y el blob es ATMÓSFERA; si gana,
            se enmienda esa ley o el efecto nace con nombre propio, porque son dos trabajos. (2) El
            blob NO toca A6 (gobierna controles; esto es fondo), pero el glow de (c) SÍ rodea la
            pieza y ahí el argumento que salvó al halo —"no rodea, luego no es caja"— NO lo cubre.
            (3) A favor: E11 nació de "la luminancia está agotada por los dos lados", y un blob no
            vive en esa restricción — agrega luz desde un tercer plano. Es su propio corolario:
            cuando un canal se agota, se cambia de canal.
          </Texto>
        </Seccion>

        <Seccion titulo="① ⭐ GATE S83 — EL AGUA EN LA CASA VERDE · qué decide: si el papel tapiz entra al prestador y CÓMO — teñida al oficio (a), con la rampa que §15b.2 prohíbe (b), o con más alfa (c). Se mira en los DOS temas: el fondo del prestador es distinto en cada uno">
          {/* cta="oficio" NO ES DECORACIÓN: sin él la lámina resuelve el
              tema del CLIENTE y el rótulo miente — pintaba papelTapiz
              magenta donde dice papel algodón, y tapizDark donde dice el
              verde del oficio. Defecto mío, cazado por el founder en
              dispositivo (S83-B14): una lámina de gate que pinta la casa
              equivocada no es una lámina de gate. */}
          <ThemeProvider defaultMode="light" cta="oficio">
          <PanelGateTema etiqueta="prestador CLARO — papel algodón #FAF9F7 · montada sobre la casa VERDE (las anteriores estaban sobre el fondo del CLIENTE)">
            <AguaCasaVerde />
          </PanelGateTema>
          </ThemeProvider>
          <ThemeProvider defaultMode="dark" cta="oficio">
            <PanelGateTema etiqueta="prestador OSCURO — su tapiz verde #080D0E · sobre la casa VERDE (antes: fondo del cliente)">
              <AguaCasaVerde />
            </PanelGateTema>
          </ThemeProvider>
          <Texto variante="apoyo">
            (a) TEÑIDA, aislada y en grande — el mecanismo es la prop `color` de Isotipo (S61-B8,
            nacida por letra del founder para el isotipo en tealDark):
          </Texto>
          <View style={{ height: 168, borderRadius: radius.md, overflow: 'hidden', backgroundColor: palette.light0 }}>
            <AguaCasaVerdeTeñida />
          </View>
        </Seccion>

        <Seccion titulo="① ⭐⭐ GATE S82 — LAS SEIS DECISIONES ABIERTAS · qué decide: el lote completo de la pasada (cada una con sus candidatos lado a lado sobre el fondo real, y en rojo qué se firma al elegir)">
          <GateS82 />
        </Seccion>

        <Seccion titulo="② ⭐ GATE r21 — LA SEPARACIÓN DE SUPERFICIE EN OSCURO · qué decide: CÓMO existe una superficie cuando el color ya no puede separarla (tres salidas sobre el mismo chip; los dos lados del par están cerrados por medición)">
          <ThemeProvider defaultMode="dark"><TresSalidasOscuro /></ThemeProvider>
        </Seccion>

        {/* ③ FIRMADO (S82, gate del founder): DIRECCIONAL, solo el canto
            superior. La variante que RODEA era contraste y murió con el
            gate (Ley 37). La sección baja de "espera firma" a MUESTRA DEL
            MATERIAL: ya no ofrece, muestra lo que rige.
            EL PORQUÉ, ESCRITO PARA QUE NADIE LO REABRA: **A6 (SIN CAJA)
            queda INTACTA, sin enmienda** — un halo direccional NO es una
            caja: no rodea, no encierra, no delimita. Lo que A6 prohíbe es
            el contorno que hace de caja, y una caja necesita CUATRO
            lados. El día que alguien lo dibuje en los cuatro, eso sí es
            un borde con otro nombre y ahí sí hace falta mesa. */}
        <Seccion titulo="EL HALO — FIRMADO en su forma direccional (S82). El canto de luz que separa la superficie en oscuro, donde la sombra no puede: A6 intacta porque no rodea">
          <ThemeProvider defaultMode="dark"><HaloSobreTarjeta /></ThemeProvider>
        </Seccion>

        {/* ④ FIRMADO (S82 r37): gana SelectorSegmentado con los dos
            agregados del founder. Baja de "espera firma" a MUESTRA. */}
        <Seccion titulo="LA ELECCIÓN EXCLUYENTE — FIRMADA (S82): SelectorSegmentado con la letra en magenta y LA PATA pisando la elegida">
          <EleccionExcluyente />
        </Seccion>

        {/* PROMOVIDA S83-B1 desde apps/prestador (Ley 11: cuatro
            superficies vivas). Pasó el gate global del founder el
            26-jul dentro de Hoja+turnos+recepción; no tiene gate
            por-anatomía propio, y por eso entra a la galería: para
            que pueda tenerlo. */}
        <Seccion titulo="TarjetaEstado — la gramática ESTÁ / ESPERA (§15b.0bis): lo que está adentro se apoya, lo que espera es contorno">
          <EjemploTarjetaEstado />
        </Seccion>

        {/* Lo rechazado NO se borra: se marca con su fecha de gate, para
            que se vea qué queda pendiente de curar (orden founder r16).
            No espera firma — ya la tuvo, y es la deuda que dejó. */}
        <Seccion titulo="⑤ ⛔ RECHAZADO EN GATE — NO espera tu firma: ya la tuvo. Es lo que sigue vivo en el código y falta curar">
          <LoRechazado />
        </Seccion>


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

        {/* Texto + FilaDato (S71-A2, componentes 58 y 59) */}
        <Seccion titulo="Texto (58) — las 5 variantes de la regla de voz">
          <View style={{ gap: spacing[4] }}>
            <View style={{ gap: spacing[1] }}>
              <Texto variante="titulo">Zeus</Texto>
              <Texto variante="apoyo">titulo — DM Sans 300 · lo humano a escala de voz</Texto>
            </View>
            <View style={{ gap: spacing[1] }}>
              <Texto variante="seccion">Fórmula</Texto>
              <Texto variante="apoyo">
                seccion — DM Sans 500 · rótulo de bloque; trae accessibilityRole="header" de fábrica
              </Texto>
            </View>
            <View style={{ gap: spacing[1] }}>
              <Texto variante="cuerpo">Enzimax, 1 tableta cada 12 horas.</Texto>
              <Texto variante="apoyo">cuerpo — DM Sans 400 · la prosa por default</Texto>
            </View>
            <View style={{ gap: spacing[1] }}>
              <Texto variante="apoyo">
                Dáselo con comida. Esta línea es larga a propósito: así se ve el lineHeight que la
                variante adoptó de las cuatro VozSecundaria (enmienda 2 del congelamiento).
              </Texto>
              <Texto variante="apoyo">apoyo — DM Sans 400 · secundario, con interlineado de prosa</Texto>
            </View>
            <View style={{ gap: spacing[1] }}>
              <Texto variante="dato">19 jul 2026 · 18:30</Texto>
              <Texto variante="apoyo">dato — JetBrains Mono · tabular-nums, los dígitos no bailan</Texto>
            </View>
            {/* El color es semántico y se puede forzar; la variante trae el suyo. */}
            <View style={{ gap: spacing[1] }}>
              <Texto variante="cuerpo" color="tertiary">
                Mismo cuerpo, color terciario
              </Texto>
              <Texto variante="apoyo">color — primary · secondary · tertiary (los 3 temas salen gratis)</Texto>
            </View>
          </View>
        </Seccion>

        <Seccion titulo="FilaDato (59) — etiqueta sobre valor, sin interacción">
          <Tarjeta elevacion="reposo">
            <View style={{ gap: spacing[4] }}>
              <FilaDato etiqueta="Diagnóstico" valor="Gastroenteritis aguda" />
              <Separador />
              {/* mono es del VALOR, jamás del rótulo (Ley 3) */}
              <FilaDato etiqueta="Total del presupuesto" valor="$45,00" mono />
              <Separador />
              <FilaDato etiqueta="Fecha de la consulta" valor="19 jul 2026" mono />
              <Separador />
              <FilaDato
                etiqueta="Indicaciones"
                valor="Dáselo con comida y mantené el agua siempre disponible."
              />
            </View>
          </Tarjeta>
          <View style={{ height: spacing[3] }} />
          <Texto variante="apoyo">
            No es Celda (fila de lista, tapeable) ni Campo (se edita). La prueba: si tocarlo no hace
            nada, es FilaDato. Un valor ausente NO se dibuja vacío — la pantalla omite la fila o pasa
            su voz honesta (Ley 13).
          </Texto>
        </Seccion>

        <Seccion titulo="LogoNegocio (61) — el logo contenido, jamás recortado (S74)">
          <View style={{ flexDirection: 'row', gap: spacing[4], alignItems: 'center' }}>
            <LogoNegocio nombre="Clínica Aurora" />
            <LogoNegocio nombre="Paseos Andres" tamano={48} />
            <LogoNegocio nombre="Aurora" tamano={40} />
          </View>
          <View style={{ height: spacing[3] }} />
          <Texto variante="apoyo">
            La trampa del logo (MODELO_PRESENCIA §2): los logos anchos NO se recortan a círculo —
            se contienen con AIRE y FONDO (contain). Sin logo: monograma de iniciales en DM Sans —
            jamás huella (la huella es de mascota, Ley 12), jamás caja vacía.
          </Texto>
        </Seccion>

        <Seccion titulo="MarcaEleccion (64) — LA PATA que pisa lo elegido (S82, primitiva de marca)">
          {/* Montada sobre una caja de muestra para que se vea CÓMO monta
              el canto — que es su anatomía, no un detalle: una marca que
              no monta está al lado, y al lado no marca. */}
          <View style={{ flexDirection: 'row', gap: spacing[6], paddingTop: spacing[3] }}>
            <View style={{ height: 44, width: 110, borderRadius: radius.suave, backgroundColor: theme.bg.card, boxShadow: theme.elevacion.reposo, alignItems: 'center', justifyContent: 'center' }}>
              <Texto variante="dato">elegida</Texto>
              <MarcaEleccion color={theme.accent.control} />
            </View>
            <View style={{ height: 44, width: 110, borderRadius: radius.suave, backgroundColor: theme.bg.card, boxShadow: theme.elevacion.reposo, alignItems: 'center', justifyContent: 'center' }}>
              <Texto variante="dato">no elegida</Texto>
            </View>
          </View>
          <View style={{ height: spacing[3] }} />
          <Texto variante="apoyo">
            Sube a primitiva porque ya marca en TRES controles (FiltroPills · FiltroMascotas ·
            SelectorSegmentado) y una gramática copiada en tres archivos no es gramática: son tres
            coincidencias esperando divergir. Anatomía FIRMADA: PATA 24 · MONTA = PATA/3 · −14°
            (algo que se apoya casi nunca cae recto — es lo único que la separa de un símbolo
            centrado). Sus tres condiciones: aparece SOLO en la elegida · JAMÁS adentro de la placa
            (R22 lo mecaniza: los glifos b′ ya llevan huella, y adentro sería una huella entre
            huellas) · apoyada sobre el canto, con el aire reservado por quien la porta. El COLOR es
            del consumidor: la pieza no elige dosis desde adentro (Ley 4).
          </Texto>
        </Seccion>

        <Seccion titulo="PieReserva (63) — el pie fijo de una reserva (S82, dominio)">
          {/* Los DOS estados que el contrato distingue, montados juntos
              porque la diferencia es la decisión: CON precio (paseo,
              vet, grooming) y SIN precio (adiestramiento, que no tiene
              número en esta pantalla y no lo inventa). */}
          <View style={{ gap: spacing[5] }}>
            <PieReserva
              total="$ 12.00"
              totalDesde
              cuando="jue 30 · 14:00"
              etiqueta="Ver quién puede"
              habilitado
              onPress={() => {}}
              insetBottom={0}
            />
            <PieReserva
              total={null}
              etiqueta="Ver quién puede"
              habilitado={false}
              onPress={() => {}}
              insetBottom={0}
            />
          </View>
          <View style={{ height: spacing[3] }} />
          <Texto variante="apoyo">
            Sube a la casa porque dos de sus cuatro consumidores lo tenían COPIADO A MANO y la copia
            había perdido el precio entero (S82-B r35). `total = null` no dibuja un vacío: el bloque
            no se monta y el CTA ocupa el pie — adiestramiento no tiene precio en esa pantalla y la
            pieza no lo inventa (L-139). El &quot;desde&quot; viene del DATO (`varia` resuelto
            server-side), jamás del oficio. Y el `paddingBottom` de la safe area lo pone la pieza:
            si cada pantalla lo recalcula, vuelve a divergir.
          </Texto>
        </Seccion>

        <Seccion titulo="PieRevelar (60) — revelar el resto de una sección (19.6)">
          <MuestraPieRevelar />
        </Seccion>

        <Seccion titulo="FilaCita (62) — una tarjeta = una cita, con su canto ADENTRO (S80, dominio)">
          <View style={{ gap: spacing[3] }}>
            <FilaCita
              direccion="derecha"
              oficio="paseo"
              titulo="Thor"
              subtitulo="Paseo de 60 min"
              metadataMono="09:00 · 60 min"
              mascota={{ nombre: 'Thor' }}
              onPress={() => {}}
            />
            <FilaCita
              direccion="derecha"
              oficio="veterinaria"
              titulo="Zeus"
              subtitulo="Consulta general"
              metadataMono="10:30 · 30 min"
              mascota={{ nombre: 'Zeus' }}
              onPress={() => {}}
            />
            <FilaCita
              cara={false}
              direccion="abajo"
              oficio="grooming"
              titulo="Luna"
              subtitulo="Baño y corte"
              metadataMono="11:30 · 90 min"
              mascota={{ nombre: 'Luna' }}
              onPress={() => {}}
            />
          </View>
          <View style={{ height: spacing[3] }} />
          <Texto variante="apoyo">
            Una tarjeta = una cita (B14/B15): el canto SÓLIDO es el borde izquierdo del portador del
            radio — sigue la curva por construcción, sin mordida. Tono por oficio (mapa del
            registry), cero API de color: el craft no se puede romper desde afuera.
          </Texto>
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

        {/* SliderPrecio — S58 (comp. 31): pasos discretos por registro.
            S68-B7: edición numérica integrada (firma founder) */}
        <Seccion titulo="SliderPrecio — pasos discretos + edición numérica (S68-B7: TAP en el valor → teclado, clampeado al riel y redondeado al paso)">
          <View style={{ gap: spacing[4] }}>
            <ThemeProvider defaultMode="light">
              <PanelTema etiqueta="claro · registro capa (dueño) — tramo en hex puro; el valor mono con SUBRAYADO PUNTEADO + hint visible (B9) es TAP → edición numérica (pruébalo: escribe 23.7 y confirma — redondea al paso más cercano)">
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

        {/* VozComision — S68-B (comp. 35): la comisión visible junto al
            precio (7.15) — subió de sus dos copias de los talleres */}
        <Seccion titulo="VozComision — el neto en vivo donde se pone el precio (7.15)">
          <View style={{ gap: spacing[4] }}>
            <ThemeProvider defaultMode="light">
              <PanelTema etiqueta="claro — % + neto exacto en vivo (el % es DATO leído de fee_configs, jamás hardcode)">
                <VozComision pct={12} precio={25} />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="dark">
              <PanelTema etiqueta="dark — texto secundario, cero pares nuevos">
                <VozComision pct={12} precio={25} />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="light">
              <PanelTema etiqueta="sin dato — la voz honesta (Ley 13: el % que falta se dice, jamás un 0% inventado)">
                <VozComision pct={null} precio={25} />
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

          {/* S83-B1 — EL PIE, Y POR QUÉ UN CONTROL COMPUESTO LO SUBE UN NIVEL.
              El pie de altura reservada es la promesa rectora de Campo y NO se
              retira. Lo que se ve acá es su costo cuando el control tiene más
              de una pieza: el hermano se corre 24.8 px (13×1.6 + 4) porque
              `flex-end` alinea por el BORDE DE ABAJO, y abajo del Campo está
              el pie. Los dos casos, con la misma fila y el mismo dato. */}
          <View style={{ marginTop: spacing[5], gap: spacing[4] }}>
            <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.tertiary }}>
              el pie en un control compuesto · el delta es 24.8 px
            </Text>

            <View style={{ backgroundColor: theme.bg.card, borderRadius: radius.md, borderWidth: 1, borderColor: theme.border.default, padding: spacing[5], gap: spacing[5] }}>
              <View>
                <Texto variante="apoyo">ANTES — cada hijo con su pie: el indicativo cae 24.8 abajo del número</Texto>
                <View style={{ flexDirection: 'row', gap: spacing[2], alignItems: 'flex-end' }}>
                  <View style={{ minHeight: 44, paddingHorizontal: spacing[3], borderRadius: radius.md, backgroundColor: theme.bg.overlay, justifyContent: 'center' }}>
                    <Text style={{ fontFamily: mono.regular, fontSize: typography.size.base, color: theme.text.primary }}>+593</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Campo label="Teléfono" placeholder="99 123 4567" ayuda="Así te escriben las familias" />
                  </View>
                </View>
              </View>

              <View>
                <Texto variante="apoyo">DESPUÉS — `sinPie` en el hijo, UN `PieDeCampo` para los dos: alineados</Texto>
                <View style={{ flexDirection: 'row', gap: spacing[2], alignItems: 'flex-end' }}>
                  <View style={{ minHeight: 44, paddingHorizontal: spacing[3], borderRadius: radius.md, backgroundColor: theme.bg.overlay, justifyContent: 'center' }}>
                    <Text style={{ fontFamily: mono.regular, fontSize: typography.size.base, color: theme.text.primary }}>+593</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Campo label="Teléfono" placeholder="99 123 4567" sinPie />
                  </View>
                </View>
                <PieDeCampo ayuda="Así te escriben las familias" />
              </View>

              <View>
                <Texto variante="apoyo">Y el pie sigue diciendo el error del compuesto — la promesa no se perdió</Texto>
                <View style={{ flexDirection: 'row', gap: spacing[2], alignItems: 'flex-end' }}>
                  <View style={{ minHeight: 44, paddingHorizontal: spacing[3], borderRadius: radius.md, backgroundColor: theme.bg.overlay, justifyContent: 'center' }}>
                    <Text style={{ fontFamily: mono.regular, fontSize: typography.size.base, color: theme.text.primary }}>+593</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Campo label="Teléfono" defaultValue="99 12" sinPie error="x" />
                  </View>
                </View>
                <PieDeCampo error="Faltan dígitos para un número de Ecuador" />
              </View>
            </View>
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

        {/* ══ LAS NUEVE QUE FALTABAN (S82-B r17) — R17 a cero ══
            La galería IMPORTA, jamás reimplementa: todo lo de acá es la
            pieza REAL de packages/ui. Lo que no se puede montar sin
            clonarlo quedó DECLARADO en R17 (usePresionado, la cámara de
            EvidenciaFoto.Capturar y los rieles sin forma). */}
        <Seccion titulo="Piezas que faltaban en la galería (S82-B r17) — importadas, jamás reimplementadas">
          <PiezasFaltantes />
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

        {/* ClipSesion — S63: el clip corto de la sesión (Ley 11, espec
            aprobada). Poster + tap-para-reproducir, JAMÁS autoplay; el
            URI de muestra no resuelve offline — el estado error con voz
            honesta ES parte del gate. */}
        <Seccion titulo="ClipSesion (S63) — poster sereno + tap para reproducir (jamás autoplay, en memorial menos); cargando/error con voz honesta">
          <View style={{ gap: spacing[4] }}>
            <ThemeProvider defaultMode="light">
              <PanelTema etiqueta="claro — poster con duración en mono; tap monta el video con controles nativos">
                <ClipSesion
                  uri="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                  duracionSegundos={22}
                  descripcion="El quieto de la sesión 5"
                />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="memorial">
              <PanelTema etiqueta="memorial — degrada solo (tokens); la reproducción sigue siendo un acto del usuario">
                <ClipSesion uri="https://example.invalid/clip.mp4" duracionSegundos={18} />
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
