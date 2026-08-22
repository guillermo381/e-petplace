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
import { Badge, useEtiquetaBadge } from '../components/Badge'
import { CampoCodigo } from '../components/CampoCodigo'
import { FichaPrestador } from '../components/FichaPrestador'
import { MapaZona } from '../components/MapaZona'
import { Celda } from '../components/Celda'
import { Separador } from '../components/Separador'
import { Insignia } from '../components/Insignia'
import { Encabezado } from '../components/Encabezado'
import { BarraTabs, type BarraTabsItem } from '../components/BarraTabs'
import { Hoja, HojaScroll, type HojaAltura } from '../components/Hoja'
import { HojaCaptura } from '../components/HojaCaptura'
import { MarcaDeMapa, PinEnMapa } from '../components/PinEnMapa'
import { LienzoMapa } from './LienzoMapa'
import { PuertaHermana } from '../components/PuertaHermana'
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
import { PantallaConPie } from '../components/PantallaConPie'
import { GlifoConContador } from '../components/GlifoConContador'
import { CarritoFlotante } from '../components/CarritoFlotante'
import { FichaRepartidor } from '../components/FichaRepartidor'
import { Salida } from '../components/Salida'
import { GotaUbicacion } from '../components/GotaUbicacion'
import { Mutacion } from '../components/Mutacion'
import { ALTO_STEPPER_ANCHO } from '../components/StepperCantidad'
import { EscaleraEstados } from '../components/EscaleraEstados'
import { TarjetaPedido } from '../components/TarjetaPedido'
import { TarjetaProducto } from '../components/TarjetaProducto'
import { PrecioText } from '../components/PrecioText'
import { CELDA_DE_GRILLA, GRILLA_DE_DOS } from '../components/grilla-de-dos'
import { FilaEntrega } from '../components/FilaEntrega'
import { AvisoAlergia } from '../components/AvisoAlergia'
import { CodigoAEscala } from '../components/CodigoAEscala'
import { BotonCopiar, HAY_PORTAPAPELES } from '../components/BotonCopiar'
import { BuscadorDeLugar } from '../components/BuscadorDeLugar'
import { PinMovible } from '../components/PinMovible'
import { SelectorVentana } from '../components/SelectorVentana'
import { PuertaDeOficio, type CapaDeOficio } from '../components/PuertaDeOficio'
import { Destape } from '../components/Destape'
import { Baldosa } from '../components/Baldosa'
import { SelectorDestinoItem, type DestinoItem } from '../components/SelectorDestinoItem'
import { PieReserva } from '../components/PieReserva'
import { FiltroPills, FiltroMascotas } from '../components/FiltroPills'
import { ChipEntidad } from '../components/ChipEntidad'
import { SelectorDia } from '../components/SelectorDia'
import { TresNumeros } from '../components/TresNumeros'
import { MarcaEleccion } from '../brand/MarcaEleccion'
import { HeroMarca } from '../components/HeroMarca'
import { LineaDeVida, LineaDeVidaNodo, type LineaDeVidaItem } from '../components/LineaDeVida'
import { VisorFoto } from '../components/VisorFoto'
import { FichaVacuna } from '../components/FichaVacuna'
import { FichaMascotaHogar } from '../components/FichaMascotaHogar'
import { ClipSesion } from '../components/ClipSesion'
import { Icono, type IconoNombre } from '../components/Icono'
import { EsperaDeMarca } from '../brand/EsperaDeMarca'
import { EsperaDeTrabajo } from '../brand/EsperaDeTrabajo'
import { Guijarro } from '../brand/Guijarro'
import { Cronometro } from '../components/Cronometro'
import { EvidenciaFoto, EvidenciaFotoThumbnail, type EvidenciaFotoEstado } from '../components/EvidenciaFoto'
import { BarrasSemana } from '../components/BarrasSemana'
import { CantoMarca } from '../components/CantoMarca'
import { Entrada } from '../components/Entrada'
import { Fundido } from '../components/Fundido'
import { Chevron } from '../components/chevron'
import { EntradaDeCruce } from '../components/EntradaDeCruce'
import { registrarCruce } from '../components/cruce'
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

// S96-B: el selector de ventana, VIVO. Los tres casos que el contrato
// distingue, y el tercero es el que la pieza existe para resolver: un día
// LLENO que se ve, no se puede tocar, y dice por qué.
function MuestraVentana() {
  const [elegida, setElegida] = useState<string | null>(null)
  return (
    <SelectorVentana
      rotulo="¿Cuándo te llega?"
      elegida={elegida}
      onElegir={setElegida}
      opciones={[
        { clave: 'hoy', etiqueta: 'Hoy, de 14:00 a 18:00', detalle: 'si confirmás antes de las 12:00', estado: 'elegible' },
        { clave: 'mananaAm', etiqueta: 'Mañana, de 09:00 a 13:00', estado: 'elegible' },
        { clave: 'jueves', etiqueta: 'Jueves, de 14:00 a 18:00', estado: 'sin_cupo', motivo: 'Sin lugar ese día' },
      ]}
      onProgramarOtra={() => {}}
      etiquetaProgramarOtra="Programar otra fecha"
    />
  )
}

// S96-B: el buscador y el pin, VIVOS. El buscador solo se juzga
// tipeando —sus tres estados dependen del texto— y el pin solo se juzga
// moviéndose. Las predicciones son de mentira a propósito: lo que la
// galería tiene que dejar ver es el COMPORTAMIENTO (cargando ≠ vacío),
// no el catálogo de Places.
function MuestraLugar() {
  const [texto, setTexto] = useState('')
  const [elegido, setElegido] = useState<string | null>(null)
  const [punto, setPunto] = useState({ lat: -0.1807, lon: -78.4678 })
  // «quito» devuelve resultados · «zzz» devuelve vacío · «...» carga.
  const cargando = texto.trim().endsWith('...')
  const hay = texto.trim().length > 0 && texto.toLowerCase().includes('quito')
  return (
    <View style={{ gap: spacing[4] }}>
      <BuscadorDeLugar
        label="Dirección"
        marcador="Buscá tu calle"
        valor={texto}
        onCambiarTexto={(t) => { setTexto(t); setElegido(null) }}
        cargando={cargando}
        predicciones={hay ? [
          { id: 'a', principal: 'Av. Shyris N34-120', secundaria: 'Quito, Ecuador' },
          { id: 'b', principal: 'Av. Shyris y Portugal', secundaria: 'Quito, Ecuador' },
        ] : []}
        onElegir={setElegido}
        sinResultados="No encontramos esa dirección. Podés ponerla a mano en el mapa."
      />
      <Texto variante="apoyo">
        {elegido === null ? 'probá: «quito» trae resultados · «zzz» no encuentra · terminar en «...» carga' : `elegiste: ${elegido}`}
      </Texto>
      <PinMovible
        lat={punto.lat}
        lon={punto.lon}
        onMover={(lat, lon) => setPunto({ lat, lon })}
        etiqueta="Mové el mapa para ajustar el punto de entrega"
      />
    </View>
  )
}

// S96-B: la puerta solo existe MOVIÉNDOSE — una captura estática de un
// barrido es un rectángulo de color, así que la galería la monta con su
// disparador. El recuadro la acota: en producción barre la pantalla
// entera, y ocupar la galería con un flash a pantalla completa cada vez
// que alguien scrollea sería el adorno que la Ley 16 quita.
function MuestraBarraPorCapacidad() {
  const { theme: t } = useTheme()
  const [activo, setActivo] = useState('index')
  // LOS CUATRO PERFILES DE LA FIRMA (mesa 13-ago). La barra NO los
  // conoce: los compone quien la monta. Aca se listan para que el gate
  // los vea uno al lado del otro — que es lo unico que permite juzgar si
  // el destino central se lee igual con 5, con 4 y con 2 tabs.
  const G = (n: string) => ({ color, activa, colorHuella }: { color: string; activa: boolean; colorHuella: string }) => (
    <Icono nombre={n as IconoNombre} tinta={color} huella={colorHuella} activa={activa} />
  )
  // LA TABLA FIRMADA de `docs/LA_CASA_DEL_PRESTADOR.md` §2, verbatim en
  // sus cinco filas. Se monta ENTERA porque el gate del destino central
  // no se puede juzgar en un caso: hay que ver que ATENDER pese igual
  // cuando cae al centro geometrico (5 y 3) y cuando NO cae (recepcion,
  // donde es el tercero de cuatro). El repartidor no tiene fila porque
  // §2.2 le niega la barra entera — una barra compartida es la promesa
  // de que hay mas de un lugar donde ir.
  const PERFILES: Array<{ rotulo: string; items: BarraTabsItem[] }> = [
    {
      rotulo: 'titular / administrador con local — CINCO (ATENDER cae al centro geometrico)',
      items: [
        { key: 'index', etiqueta: 'Hoy', icono: G('hoy') },
        { key: 'mascotas', etiqueta: 'Datos', icono: G('datos') },
        { key: 'atender', etiqueta: 'Atender', icono: G('atender'), destacada: true, badge: 3 },
        { key: 'negocio', etiqueta: 'Negocio', icono: G('negocio') },
        { key: 'cuenta', etiqueta: 'Cuenta', icono: G('cuenta') },
      ],
    },
    {
      rotulo: 'recepcion — CUATRO · 🔴 EL CASO QUE MANDA: ATENDER es el TERCERO DE CUATRO, NO el centro. Si el destaque dependiera de la posicion, esta fila lo rompe.',
      items: [
        { key: 'index', etiqueta: 'Hoy', icono: G('hoy') },
        { key: 'mascotas', etiqueta: 'Datos', icono: G('datos') },
        { key: 'atender', etiqueta: 'Atender', icono: G('atender'), destacada: true },
        { key: 'cuenta', etiqueta: 'Cuenta', icono: G('cuenta') },
      ],
    },
    {
      rotulo: 'vendedor puro — TRES (sin DATOS; ATENDER vuelve al centro)',
      items: [
        { key: 'index', etiqueta: 'Hoy', icono: G('hoy') },
        { key: 'atender', etiqueta: 'Atender', icono: G('atender'), destacada: true },
        { key: 'cuenta', etiqueta: 'Cuenta', icono: G('cuenta') },
      ],
    },
    {
      rotulo: 'profesional puro — TRES, SIN destino central (no hay mostrador que atender: el mismo gate que le pone visible:false a la plata del dia)',
      items: [
        { key: 'index', etiqueta: 'Hoy', icono: G('hoy') },
        { key: 'mascotas', etiqueta: 'Datos', icono: G('datos') },
        { key: 'cuenta', etiqueta: 'Cuenta', icono: G('cuenta') },
      ],
    },
  ]
  return (
    <View style={{ gap: spacing[4] }}>
      <Texto variante="apoyo">
        El overshoot de la huella (280 ms, spring) esta FIRMADO y vive adentro de la
        pieza: toca una tab y mira como LLEGA. Ya no hay toggle — la prop de gate
        murio con la firma (Ley 37).
      </Texto>
      {/* EL GATE DEL GLIFO — §6b: a 21px, junto a cinco del registry.
          A ese tamano la huella sobrevive o es ruido (Ley 9), y un glifo
          solo no dice nada: lo que se juzga es si `atender` se distingue
          de sus vecinos de un vistazo, que es como se ve en la barra. */}
      <View style={{ gap: spacing[2] }}>
        <Texto variante="apoyo">
          El glifo a 21px entre sus vecinos — atender · hoy · datos · negocio · cuenta · campana
        </Texto>
        <View style={{ flexDirection: 'row', gap: spacing[4], alignItems: 'center' }}>
          {(['atender', 'hoy', 'datos', 'negocio', 'cuenta', 'campana'] as IconoNombre[]).map((n) => (
            <Icono key={n} nombre={n} tamano={21} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: spacing[4], alignItems: 'center' }}>
          {(['atender', 'hoy', 'datos', 'negocio', 'cuenta', 'campana'] as IconoNombre[]).map((n) => (
            <Icono key={n} nombre={n} tamano={44} />
          ))}
        </View>
      </View>
      {PERFILES.map((p) => (
        <View key={p.rotulo} style={{ gap: spacing[2] }}>
          <Texto variante="apoyo">{p.rotulo}</Texto>
          <View style={{ borderWidth: 1, borderColor: t.border.default, borderRadius: radius.md, overflow: 'hidden' }}>
            <BarraTabs
              items={p.items}
              activo={p.items.some((i) => i.key === activo) ? activo : p.items[0].key}
              onCambiar={setActivo}
              estadoPorHuella
            />
          </View>
        </View>
      ))}
    </View>
  )
}

function MuestraDestape() {
  const [corriendo, setCorriendo] = useState(false)
  const [conLogo, setConLogo] = useState(false)
  const [fin, setFin] = useState<string | null>(null)
  const { theme: t } = useTheme()
  // LAS TABS DE LA MUESTRA son la composicion por capacidad del titular
  // con local (la barra mas larga): si el destape se lee bien con cuatro,
  // se lee con las de tres.
  const TABS = [
    { key: 'index', etiqueta: 'Hoy' },
    { key: 'atender', etiqueta: 'Atender' },
    { key: 'negocio', etiqueta: 'Negocio' },
    { key: 'cuenta', etiqueta: 'Cuenta' },
  ]
  return (
    <View style={{ gap: spacing[3] }}>
      <View style={{ height: 380, borderRadius: radius.suave, overflow: 'hidden', backgroundColor: t.bg.overlay }}>
        {corriendo ? (
          <Destape
            key={String(conLogo)}
            nombreNegocio="Clinica Aurora"
            logo={conLogo ? { uri: 'https://placehold.co/200x200/png' } : null}
            tabsHabilitadas={TABS}
            alTerminar={() => {
              setFin('alTerminar disparado — del ultimo gesto, no de un temporizador')
              setCorriendo(false)
            }}
          />
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', gap: spacing[2], flexWrap: 'wrap' }}>
        <Boton
          variante="compacto"
          etiqueta="Destapar (monograma)"
          onPress={() => {
            setConLogo(false)
            setFin(null)
            setCorriendo(true)
          }}
        />
        <Boton
          variante="compacto"
          etiqueta="Destapar (con logo)"
          onPress={() => {
            setConLogo(true)
            setFin(null)
            setCorriendo(true)
          }}
        />
      </View>
      {fin != null ? <Texto variante="apoyo">{fin}</Texto> : null}
    </View>
  )
}

function MuestraPuerta() {
  const [activo, setActivo] = useState(false)
  const [capa, setCapa] = useState<CapaDeOficio>('consumo')
  const { theme: t } = useTheme()
  return (
    <View style={{ gap: spacing[3] }}>
      <View
        style={{ height: 120, borderRadius: radius.suave, overflow: 'hidden', backgroundColor: t.bg.overlay }}
      >
        <PuertaDeOficio capa={capa} activo={activo} onFin={() => setActivo(false)} />
      </View>
      <View style={{ flexDirection: 'row', gap: spacing[2], flexWrap: 'wrap' }}>
        {(['consumo', 'cuidado', 'identidad', 'comunidad'] as const).map((c) => (
          <Boton
            key={c}
            variante="compacto"
            etiqueta={c}
            onPress={() => {
              setCapa(c)
              setActivo(true)
            }}
          />
        ))}
      </View>
    </View>
  )
}

// S96-B: muestra VIVA del selector de destino — la exclusión entre
// mascota y donación solo se ve tocando, y es lo que la pieza garantiza
// por TIPO (el espejo de `chk_destino_excluyente`). Arranca en `null`
// a propósito: nada viene preseleccionado, porque preseleccionar sería
// la app adivinando de quién es la compra (§4).
function MuestraSelectorDestino() {
  const [destino, setDestino] = useState<DestinoItem | null>(null)
  return (
    <SelectorDestinoItem
      mascotas={[
        { id: 'thor', nombre: 'Thor' },
        { id: 'zeus', nombre: 'Zeus' },
      ]}
      destino={destino}
      onCambiar={setDestino}
      rotulo="¿Para quién es?"
      etiquetaDonacion="Donar este producto"
      detalleDonacion="Lo entregamos a un refugio. No suma a ningún expediente."
    />
  )
}

/* S100b-B: muestra viva de PantallaConPie — y su DISCRIMINADOR es la
   última línea, no la primera.

   🔴 QUÉ HAY QUE VER: **«Declara contener: Cordero, Arroz.» tiene que
   quedar alcanzable scrolleando hasta el fondo.** Ése es exactamente el
   contenido que el pie fijo tapaba en la ficha real —composición y
   alérgenos, con la pantalla sin scroll— y por eso la muestra lo usa de
   sujeto en vez de un «ítem 12» cualquiera.

   El pie lleva DOS botones a propósito: el defecto original venía de que
   la pantalla estimaba el alto del pie en `96`, y con dos botones ese
   número se queda corto. **Si algún día la última línea vuelve a quedar
   debajo del pie, la reserva dejó de derivarse del alto medido.** */
function MuestraPantallaConPie() {
  const filas = [
    'Foto del producto',
    'Nombre y presentación',
    'Precio y precio por kilo',
    'Para quién sirve',
    'Disponibilidad',
    'Composición',
    'Declara contener: Cordero, Arroz.',
  ]
  return (
    <View style={{ gap: spacing[3] }}>
      <View style={{ height: 320, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }}>
        <PantallaConPie
          contentContainerStyle={{ padding: spacing[4], gap: spacing[3] }}
          pie={
            <>
              <Boton etiqueta="Agregar al carrito" bloque onPress={() => {}} />
              <Boton etiqueta="Ver carrito · 1" variante="secundario" bloque onPress={() => {}} />
            </>
          }
        >
          {filas.map((f) => (
            <Celda key={f} titulo={f} />
          ))}
        </PantallaConPie>
      </View>
      <Texto variante="apoyo">
        El pie se mide a sí mismo y esa misma medida reserva el scroll: no hay dos cuentas que puedan
        discrepar. Scrolleá hasta el fondo — la última línea tiene que quedar por encima del pie.
        Antes de esta pieza cinco pantallas estimaban ese alto a mano, y en la ficha lo que quedaba
        debajo era la composición y los alérgenos.
      </Texto>
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
/** S99-B · EL GATE DE LA BARRA — LAS DOS POBLACIONES JUNTAS.
 *
 *  El founder firmó las DOS ramas por adelantado (*«si la huella dentro
 *  del disco se ve mal, en ese caso quitaríamos la huella»*), así que
 *  acá no se adivina: **se montan las dos y el ojo elige.**
 *
 *  🔴 **Y SE MONTAN SOBRE FONDO CON CONTENIDO, no sobre el panel
 *  limpio**, porque lo que hay que ver es EL HUECO: la barra dejó de
 *  pintar su caja para que entre valle y disco pase lo que haya debajo.
 *  *Sobre un fondo plano el hueco se ve igual que si estuviera pintado —
 *  y ése era exactamente el modo de falla que la advertencia ③ nombró:
 *  funciona justo en la pantalla donde se lo probó.* */
function GateDeLaBarra() {
  const { theme } = useTheme()
  const [tab, setTab] = useState('a')
  return (
    <View style={{ gap: spacing[2] }}>
      {/* franjas: el hueco tiene que dejarlas pasar */}
      <View style={{ justifyContent: 'flex-end', height: 170, overflow: 'hidden', borderRadius: radius.md }}>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          {Array.from({ length: 11 }, (_, i) => (
            <View
              key={i}
              style={{ height: 16, backgroundColor: i % 2 === 0 ? theme.bg.overlay : theme.bg.card }}
            />
          ))}
        </View>
        <BarraTabs items={ICONOS_TABS} activo={tab} onCambiar={setTab} />
      </View>
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

/** Las piezas que el founder rechazó y siguen vivas en el código. */

function PiezasFaltantes() {
  const [modoFundido, setModoFundido] = useState('administrar')
  const { theme } = useTheme()
  const [remonte, setRemonte] = useState(0)
  const [hojaScrollAbierta, setHojaScrollAbierta] = useState(false)
  // S99-B · el pie fijo, en sus DOS estados: con desborde (el filete
  // aparece) y sin desborde (no hay nada tapado ⇒ no hay filete).
  const [hojaPieLarga, setHojaPieLarga] = useState(false)
  const [hojaPieCorta, setHojaPieCorta] = useState(false)
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
        <Texto variante="dato">
          Chevron — el trazo suelto para slots que NO son una fila (el `senal` de DatoAdministrable). E14: › lleva · ⌄ despliega
        </Texto>
        <Tarjeta>
          {(['derecha', 'abajo', 'arriba', 'izquierda'] as const).map((d) => (
            <View key={d} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
              <Texto variante="apoyo">{d}</Texto>
              <Chevron direccion={d} />
            </View>
          ))}
        </Tarjeta>
      </View>

      {/* Fundido — la TERCERA de la familia de entradas, y la que no tiene
          eje: nada viajó, la misma superficie pasó a decir otra cosa. Se
          muestra con el gesto REAL que la pidió (un interruptor de modo),
          porque fuera de un cambio de estado la pieza no significa nada. */}
      <View style={{ gap: spacing[2] }}>
        <Texto variante="dato">
          Fundido — 150 ms · CERO desplazamiento · reemplaza al `key` del consumidor. No anima al montar
        </Texto>
        <SelectorSegmentado
          etiqueta="Modo de la ficha"
          segmentos={[
            { codigo: 'administrar', etiqueta: 'Administrar' },
            { codigo: 'cliente', etiqueta: 'Ver como cliente' },
          ]}
          activo={modoFundido}
          onCambio={setModoFundido}
        />
        <View style={{ minHeight: 72 }}>
          <Fundido clave={modoFundido}>
            <Tarjeta>
              <Texto variante="seccion">
                {modoFundido === 'administrar' ? 'Pro Pac Adulto · $48,90 ›' : 'Pro Pac Adulto · $48,90'}
              </Texto>
              <Texto variante="apoyo">
                {modoFundido === 'administrar' ? '12 en stock · tocá para ajustar' : '12 disponibles'}
              </Texto>
            </Tarjeta>
          </Fundido>
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
        <Texto variante="dato">
          Hoja · pie fijo (S99-B) — el compromiso vive FUERA del scroll: el contenido corre por debajo y el CTA
          no se va nunca. El filete aparece SOLO cuando hay algo tapado arriba (medido, no permanente)
        </Texto>
        <Boton variante="compacto" etiqueta="Con desborde — el filete aparece" onPress={() => setHojaPieLarga(true)} />
        <Boton variante="compacto" etiqueta="Sin desborde — no hay filete" onPress={() => setHojaPieCorta(true)} />
        <Hoja
          visible={hojaPieLarga}
          onCerrar={() => setHojaPieLarga(false)}
          titulo="Ajustar stock"
          conCerrar
          pie={
            <View style={{ gap: spacing[2] }}>
              {/* La UNA línea de voz que el pie admite: el CTA apagado
                  DICE qué falta, y adentro del scroll esa frase quedaría
                  fuera de vista justo cuando el botón gris se ve (S73). */}
              <Texto variante="apoyo">Falta el motivo del ajuste.</Texto>
              <Boton variante="primario" bloque deshabilitado etiqueta="Guardar el ajuste" onPress={() => {}} />
            </View>
          }
        >
          <View style={{ gap: spacing[2], paddingBottom: spacing[4] }}>
            {Array.from({ length: 14 }, (_, i) => (
              <Texto key={i} variante="cuerpo">{`fila ${i + 1} — scrolleá: el pie no se mueve`}</Texto>
            ))}
          </View>
        </Hoja>
        <Hoja
          visible={hojaPieCorta}
          onCerrar={() => setHojaPieCorta(false)}
          titulo="Confirmar"
          conCerrar
          pie={<Boton variante="primario" bloque etiqueta="Confirmar" onPress={() => setHojaPieCorta(false)} />}
        >
          <View style={{ paddingBottom: spacing[2] }}>
            <Texto variante="cuerpo">Nada tapado arriba ⇒ el filete no se dibuja: separaría de nada.</Texto>
          </View>
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


/** S82-B r34 — LA ELECCIÓN EXCLUYENTE: tres formas de la misma pregunta
 *  (baño vs baño-y-corte · sesión vs programa). El founder pidió
 *  "toggle" pero declaró que nunca pueden estar los dos prendidos, y eso
 *  NO es dos binarios: es UNA elección. */

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
            <Boton variante="apoyada" etiqueta="Ya tengo cuenta" bloque onPress={() => {}} />
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
  const LOTE: IconoNombre[] = ['paseo', 'veterinaria', 'grooming', 'refugio', 'despensa', 'ia']
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
    // S89-B: `descargar` va PEGADO a `compartir` a propósito — lo que hay
    // que ver a 21px no es que se entienda solo, sino que **la pareja se
    // distinga**: son la ida y la vuelta del mismo papel y comparten
    // bandeja. Si a 21px la dirección de la flecha no se lee, el par
    // falla y se simplifica (el gate por ícono es EL gate).
    'lapiz', 'compartir', 'descargar',
    // S82-B r10: LA VACUNA con su glifo propio (la fila del perfil
    // pintaba `veterinaria` — sustitución genérica que Ley 12 prohíbe).
    // S90-B: `receta` va PEGADA a `vacuna` a propósito — son los dos
    // objetos CLÍNICOS del set y el riesgo declarado de la cápsula es que
    // se lea «medicación»; lo que hay que ver a 21px es que la cápsula y
    // la jeringa no se confundan entre sí. Y queda a un paso de `caso`,
    // que es el préstamo que viene a reemplazar.
    'vacuna', 'bitacora', 'receta',
    // ── S91-B · LA HOJA DE CONTACTO DE «DOCUMENTOS» (§6b), dos candidatos.
    // Van PEGADOS a `documento` y `carnet` a propósito, que es lo único
    // que este montaje tiene que dejar ver a 21px: **no que cada uno se
    // entienda solo, sino que el nuevo NO se confunda con los dos que ya
    // están** — porque nace justamente de que `documento` hace triple
    // turno. `caso` (carpeta) queda al lado por la misma razón.
    'documentos', 'documento', 'carnet', 'caso',
    // S91-B: 'correo' (ex candidato B) queda al final y APARTE — su
    // comparación con Documentos TERMINÓ; vive acá solo para que la
    // reserva se pueda mirar, no para elegir entre ellos.
    'correo',
    // S84-B5: CONTACTO — FIRMADO (el globo). Su candidato rival murió en
    // el gate; el porqué vive en el registry, no acá.
    'contacto',
    // S84-B20: DOCUMENTO en dos candidatos. Van pegados a `carnet` y
    // `cuenta` a propósito: son los dos prestados que fallaron por ley, y
    // a 21px hay que ver que el nuevo NO se confunda con ninguno.
    // S84-B21: los TRES de "Datos comerciales" JUNTOS y en orden de
    // pantalla — lo que hay que ver a 21px no es que cada uno se
    // entienda, sino que los tres SE DISTINGAN ENTRE SÍ. Y quedan
    // pegados a 'pagos' y 'presupuesto', que son sus vecinos de idioma.
    // S85-B2: `documentoSello` (candidato B) SALE — el gate de 21px corrió
    // el 3-ago y el founder firmó los vigentes. Su lápida vive en el
    // registry, que es donde se lee al dibujar el próximo.
    'documento', 'fiscal', 'bancario',
    // S85-B18: la VENTANA TEMPORAL. Van pegados a `hoy` a propósito — es
    // su hermana mayor y la que define el idioma de la familia.
    'semana', 'mes',
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


/** ☠️ ACÁ VIVÍAN LAS DOS HOJAS DE CONTACTO DEL GLIFO `moto` (v1 y v2) —
 *  seis candidatas, el helper `PinDeContacto` y la tira de cuatro tonos.
 *
 *  **Murieron con su trabajo hecho** (Ley 37): el gate cerró con la **D,
 *  con caja**, firmada por el founder. Y murieron ADEMÁS por la ley de
 *  método que ese mismo gate parió: *«la pieza se gatea DONDE VIVE, no en
 *  una lámina»* — su costo, medido por el founder: *«estamos tardando más
 *  poniéndolo en la galería y después acomodándolo, y llenando la galería
 *  de cosas que no usamos»*.
 *
 *  El dibujo ganador NO se copió acá: vive en `PinEnMapa` como su
 *  variante `moto`, y la galería lo CONSUME. *Una copia en la herramienta
 *  de verificación es la primera divergencia, y la herramienta que
 *  diverge miente con autoridad.*
 *
 *  El estudio completo queda en
 *  `docs/laminas/2026-08-15-s99b-HOJA-DE-CONTACTO-moto.md` — el papel se
 *  conserva; lo que se retira es el andamio montado. */

/** S99-B · EL ENSAYO DEL ANILLO — la duda del founder, sobre TILES.
 *
 *  Verbatim: *«me gusta el ícono, pero no el círculo que la cubre
 *  encima; necesitaría ver cómo se ve en el mapa»*. Por eso esto no es
 *  una lámina: se monta sobre `LienzoMapa`, que es un mapa de verdad.
 *
 *  Los dos pines van EN EL MISMO mapa a propósito — el juicio es la
 *  comparación, y dos capturas separadas la vuelven memoria. */
function EnsayoDelAnillo() {
  return (
    <View style={{ gap: spacing[3] }}>
      <LienzoMapa alto={240}>
        {/* LOS DOS OBJETOS JUNTOS — orden de §6ter: «el juicio es la
            comparación». Dos objetos que tienen que pertenecer al mismo
            mundo no se pueden aprobar de a uno. */}
        <PinEnMapa variante="moto" nombre="El repartidor" x={-52} y={14} />
        <PinEnMapa variante="destino" nombre="Tu casa" x={54} y={-24} />
      </LienzoMapa>
      <Texto variante="dato">
        La moto y su destino, sobre tiles reales. Lo que se mira: ¿están PARADOS en el mapa o pegados encima?
        La sombra los apoya · las ruedas y el techo comparten la perspectiva cenital · el color entra en la banda
        de saturación del terreno (0.10–0.58) en vez de gritar.
      </Texto>
      <View style={{ gap: spacing[2] }}>
        <Texto variante="dato">El «antes» — el glifo dentro del círculo que se rechazó:</Texto>
        <LienzoMapa alto={140}>
          <PinConAnilloDePrueba x={0} y={0} />
        </LienzoMapa>
      </View>

      {/* 🔴 `MarcaDeMapa` — LA MISMA MARCA, SIN SU POSICIÓN (S100c-B).
          Es el DIBUJO solo, para el slot `marcadorVivo`/`marcadorDestino`
          de `MapaRecorrido`, donde el `<Marker>` del mapa ya resolvió el
          dónde. **No es otro dibujo: `PinEnMapa` la consume**, así que lo
          que se mira acá es exactamente lo que viaja en el mapa — no hay
          dos siluetas que se puedan desincronizar.
          Fuera del mapa a propósito: lo que este cuadro juzga es la
          SILUETA, y §6ter ya firmó su integración con tiles arriba. */}
      <View style={{ gap: spacing[2] }}>
        <Texto variante="dato">
          La marca sin su posición — el mismo dibujo que monta el mapa por su slot:
        </Texto>
        <View style={{ flexDirection: 'row', gap: spacing[4], alignItems: 'center' }}>
          <MarcaDeMapa variante="moto" />
          <MarcaDeMapa variante="destino" />
        </View>
      </View>
    </View>
  )
}

/** El pin de moto CON anillo — vive SOLO acá, para la comparación del
 *  gate. No es una variante de la pieza: es el «antes». Si el founder
 *  firma el anillo, se muda a `PinEnMapa`; si no, muere con este gate. */
function PinConAnilloDePrueba({ x, y }: { x: number; y: number }) {
  const { theme } = useTheme()
  return (
    <View
      style={{
        position: 'absolute',
        transform: [{ translateX: x }, { translateY: y }],
        padding: 2.5,
        backgroundColor: palette.white,
        borderRadius: radius.full,
        boxShadow: theme.elevacion.reposo,
      }}
    >
      <Svg width={40} height={40} viewBox="0 0 24 24">
        <Path d="M2.6 5.8h7.2a1.2 1.2 0 0 1 1.2 1.2v4.6H2.6Z" fill={theme.text.primary} />
        <Path
          d="M2.6 12.4h9l3.2-4.2h3.6v2.5h-2.3l-2.7 3.5h3.5c1.9 0 3.5 1.2 4.1 2.9H4.4c-.5-1.6-1.9-2.7-3.6-2.9Z"
          fill={theme.text.primary}
        />
      </Svg>
    </View>
  )
}

/** S99-B — el pin que dice QUIÉN se está moviendo. Ahora sobre MAPA
 *  REAL (ley de método: la pieza se gatea donde vive) y con un botón que
 *  lo MUEVE: la pieza es la interpolación, y una muestra quieta
 *  mostraría el dibujo sin mostrar la pieza. */
function EjemploPinEnMapa() {
  const [lejos, setLejos] = useState(false)
  return (
    <View style={{ gap: spacing[3], alignItems: 'center' }}>
      <LienzoMapa alto={180}>
        <PinEnMapa nombre="Zeus" especie="perro" x={lejos ? 70 : -70} y={lejos ? -32 : 28} />
        <PinEnMapa variante="moto" nombre="El repartidor" x={lejos ? -60 : 60} y={lejos ? 30 : -26} />
      </LienzoMapa>
      <Boton
        variante="secundario"
        tamaño="sm"
        etiqueta="Llegó una lectura nueva"
        onPress={() => setLejos((v) => !v)}
      />
      <Texto variante="dato">
        interpola con el bezier de la casa · 300 ms · con reduce-motion o en memorial SALTA
      </Texto>
    </View>
  )
}

/** S99-B — la puerta de la foto. Se mira ABIERTA; los dos botones abren
 *  el picker del sistema, así que la verificación es de FORMA, no de
 *  toque (ver la nota de la sección). */
function EjemploHojaCaptura() {
  const [abierta, setAbierta] = useState(false)
  const [ultimo, setUltimo] = useState<string>('—')
  return (
    <View style={{ gap: spacing[3], alignItems: 'center' }}>
      <Boton variante="secundario" tamaño="sm" etiqueta="Abrir la hoja" onPress={() => setAbierta(true)} />
      <Texto variante="dato">último resultado: {ultimo}</Texto>
      <HojaCaptura
        visible={abierta}
        titulo="Su foto"
        onCerrar={() => setAbierta(false)}
        onFoto={(f) => setUltimo(`foto ${f.width}×${f.height}`)}
        onPermisoDenegado={() => setUltimo('permiso denegado (lo DICE la pantalla, no la pieza)')}
        opciones={{ redimensionarA: 800 }}
      />
    </View>
  )
}

function EjemploBadge() {
  const { theme } = useTheme()
  const etiquetaBadge = useEtiquetaBadge()
  const accentActive = 'active' in theme.accent ? theme.accent.active : theme.accent.primary
  // n=0 NO dibuja nada (regla de existencia) · la pill se esconde de a11y:
  // el número viaja en el label del tocable (mostrado abajo, literal)
  const glifo = (n: number) => (
    <Badge n={n}>
      <Icono nombre="hoy" tinta={theme.text.primary} huella={theme.text.secondary} />
    </Badge>
  )
  return (
    <View style={{ gap: spacing[4] }}>
      <View style={{ flexDirection: 'row', gap: spacing[8], alignItems: 'center' }}>
        {glifo(0)}
        {glifo(3)}
        {glifo(12)}
      </View>
      <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.tertiary }}>
        n=0 · n=3 · n=12 — label del tocable: “{etiquetaBadge('Avisos', 3)}”
      </Text>

      {/* ── LA CAMPANA + LA HUELLA-NOVEDAD (S88, lámina firmada) ─────
          El PAR de la ley del único relleno: campana en TRAZO, huella
          RELLENA solo cuando hay avisos. Jamás número, jamás rojo de
          alarma, jamás anima. */}
      <View style={{ flexDirection: 'row', gap: spacing[8], alignItems: 'center' }}>
        <Badge n={0} forma="huella"><Icono nombre="campana" tinta={theme.text.primary} huella={theme.text.secondary} /></Badge>
        <Badge n={3} forma="huella"><Icono nombre="campana" tinta={theme.text.primary} huella={theme.text.secondary} /></Badge>
        <View style={{ width: 21 }}>
          <Badge n={3} forma="huella"><Icono nombre="campana" tamano={21} tinta={theme.text.primary} huella={theme.text.secondary} /></Badge>
        </View>
      </View>

      {/* 🔴 EL PAR DE SUPERFICIE (cura pre-gate S88): accent.active del
          prestador en claro ES el hex del muro — sin la regla, la huella
          desaparecía en su lugar firmado. Sobre el muro: PAPEL (§15b.2).
          Izquierda: el DEFECTO reproducido a propósito (superficie
          'clara' sobre el muro — la huella se funde). Derecha: la cura. */}
      <View style={{ flexDirection: 'row', gap: spacing[4] }}>
        {[palette.tealDark, palette.tealDarkNoche].map((muro) => (
          <View key={muro} style={{ backgroundColor: muro, borderRadius: radius.md, padding: spacing[4], flexDirection: 'row', gap: spacing[8] }}>
            <Badge n={3} forma="huella"><Icono nombre="campana" tinta={palette.light0} huella={palette.light0} /></Badge>
            <Badge n={3} forma="huella" superficie="muro"><Icono nombre="campana" tinta={palette.light0} huella={palette.light0} /></Badge>
          </View>
        ))}
      </View>
      <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.tertiary }}>
        sobre el muro (claro · noche): izquierda el defecto (acento≡muro, invisible) · derecha superficie=&quot;muro&quot; → ORO firmado S89 (en memorial: papel — no se celebra)
      </Text>
      <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.tertiary }}>
        campana sin avisos · con avisos (huella, jamás número) · a 21px (§2.9) — label: “{etiquetaBadge('Avisos', 3, 'huella')}”
      </Text>

      {/* el estudio del MÍNIMO LEGIBLE — se firma en DISPOSITIVO (la
          condición de la lámina); acá viven las tres tallas para que el
          gate sea una mirada: 10 · 12 · 14 — LA ELEGIDA PASÓ A 14 por la
          enmienda pata-pisa (S89 orden 7: «apenas más grande»). */}
      <View style={{ flexDirection: 'row', gap: spacing[8], alignItems: 'flex-end' }}>
        {[10, 12, 14].map((lado) => (
          <View key={lado} style={{ alignItems: 'center', gap: spacing[1] }}>
            <Svg width={lado} height={lado} viewBox="0 0 24 24"><Huella color={accentActive} /></Svg>
            <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, color: theme.text.tertiary }}>{lado}</Text>
          </View>
        ))}
      </View>

      {/* ── ⚖️ EL ORO, FIRMADO (S89 orden 4, sobre la medición s89b —
          firma del founder): sobre el MURO la huella es ORO `ctaOro`
          (claro 3.41 · noche 5.95 · degradado del cliente peor punto
          3.33); sobre PAPEL (1.62, NO pasa) y en MEMORIAL (no se
          celebra) queda como antes. Las muestras de abajo son LA PIEZA
          REAL — lo que se ve acá es lo que la pantalla pinta; con el
          toggle en Memorial, el muro muestra PAPEL por construcción.
          Depósito: docs/relevamientos/2026-08-06-s89b-MEDICION-oro-campana.md */}
      <View style={{ flexDirection: 'row', gap: spacing[4], flexWrap: 'wrap' }}>
        {([
          ['muro claro · oro 3.41', palette.tealDark, 'muro'],
          ['muro noche · oro 5.95', palette.tealDarkNoche, 'muro'],
          ['papel · acento (oro 1.62 ✗ no rige)', palette.light0, 'clara'],
        ] as const).map(([rotulo, fondo, superficie]) => (
          <View key={rotulo} style={{ alignItems: 'center', gap: spacing[2] }}>
            <View style={{ backgroundColor: fondo, borderRadius: radius.md, padding: spacing[4], borderWidth: 1, borderColor: theme.bg.border }}>
              <Badge n={3} forma="huella" superficie={superficie}>
                <Icono nombre="campana" tinta={superficie === 'muro' ? palette.light0 : palette.tinta} />
              </Badge>
            </View>
            <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, color: theme.text.tertiary }}>{rotulo}</Text>
          </View>
        ))}
      </View>
      <Text style={{ fontFamily: mono.regular, fontSize: typography.size.xs, letterSpacing: typography.tracking.mono, color: theme.text.tertiary }}>
        el ORO #FCBC1D FIRMADO (S89 orden 4): rige en muro claro/noche y el degradado del cliente · papel y memorial quedan como hoy — la letra ganó al número
      </Text>
    </View>
  )
}

function EjemploCampoCodigo({ soloVivo = false }: { soloVivo?: boolean }) {
  // El probador VIVO tipea de verdad (tocá, tipeá, borrá, pegá el código
  // entero); los demás son estados congelados para el par visual.
  const [vivo, setVivo] = useState('')
  const [conError, setConError] = useState('1234')
  if (soloVivo) {
    return <CampoCodigo largo={8} valor={vivo} onCambio={setVivo} etiqueta="Código de recuperación" ayuda="Te lo enviamos por correo" />
  }
  return (
    <View>
      <CampoCodigo largo={8} valor={vivo} onCambio={setVivo} etiqueta="Código de recuperación" ayuda="Te lo enviamos por correo" />
      <CampoCodigo
        largo={8}
        valor={conError}
        onCambio={setConError}
        etiqueta="Con error"
        error="Ese código no es válido o venció. Pedí uno nuevo."
      />
      {/* largo por prop: la pieza no sabe cuánto mide un código */}
      <CampoCodigo largo={4} valor="42" onCambio={() => {}} etiqueta="Otro largo (4) — el consumidor lo declara" />
      <CampoCodigo largo={8} valor="12345678" onCambio={() => {}} etiqueta="Deshabilitado (completo)" deshabilitado />
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
  const [cruceVisible, setCruceVisible] = useState(true)
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
        {/* ═══ S85-B13 · LOS GLIFOS QUE ESPERAN SU OJO. Suben acá por el
            defecto que el founder encontró con el cuerpo: la insignia de cohorte
            estaban al FINAL de «Iconografía b′» —una sección de CATÁLOGO—,
            tres paneles de tema abajo, y no los halló. Es la regla de esta
            misma página aplicada a sí misma: *lo que espera decisión va
            arriba; el catálogo es lo que se hojea*. Siguen existiendo en
            su fila del set b′; acá están para decidir, allá para consultar. ═══ */}
        {/* ═══ S99-B · EL ÚNICO GATE VIVO DE ESTA SESIÓN, y va PRIMERO por
            firma del founder: *lo que espera firma va primero*. Se monta
            sobre TILES REALES porque la ley de método que él acaba de
            firmar lo exige — **la pieza se gatea DONDE VIVE**, y un pin
            vive sobre un mapa. En web esto NO se puede juzgar y el
            lienzo lo dice: hay que mirarlo en el teléfono. ═══ */}
        {/* 🔴 S99-B · D-833 — LO QUE ESPERA FIRMA VA PRIMERO.
            Estas dos muestras vivían enterradas: los glifos adentro de la
            sección de `EscaleraEstados` (la 40 de 90) y la transición entre
            las piezas de entrada. **Es el defecto que el founder nombró**
            —«la lámina del moto estaba en la sección 81 de 95»— repitiéndose
            con lo recién construido. Se MUEVEN, no se copian: la muestra es
            una sola y vive donde se la mira. */}
        <Seccion titulo="⭐ GATE S99 — LOS CUATRO GLIFOS DE NODO Y LA TRANSICIÓN DIRECCIONAL · qué decide: (a) si a 12 px cada nodo dice QUÉ ES sin leer, y (b) si la ventana se siente venir del lado del botón que tocaste">
          <View style={{ gap: spacing[6] }}>
            {/* 🔴 S99-B · EL GATE DE LOS CUATRO GLIFOS DE NODO — Y SE
                MONTAN **DONDE VIVEN**, a 12 px adentro de la escalera
                real, jamás sueltos en grande. *Es lo que la moto costó
                DOS veces en esta misma sesión: un glifo aprobado en una
                lámina limpia se cae cuando llega a su tamaño.*

                ⏪ Acá había SIETE pasos con puntos de demo, y su rótulo
                decía «las siete narrativas». **Las dos cosas eran
                falsas**: `pagado`, `empacado` y `despachado` son estados
                INTERNOS —no narrativas— y de las 7 narrativas solo
                CUATRO son escalones (`pagando` es antes de que exista
                promesa; `no_llego` y `cancelado` son DESVÍO, que
                sustituye la escalera). La demo enseñaba un camino de
                siete que el producto no tiene. */}
            <View style={{ gap: spacing[2] }}>
              <Texto variante="dato">
                S99-B · GATE POR ÍCONO — los cuatro nodos a 12 px, en su casa. Vertical · cuadrado · horizontal · diagonal
              </Texto>
              <EscaleraEstados
                registro="compacta"
                cuandoLlega="Llega entre 14:00 y 16:00"
                pasos={(
                  [
                    ['confirmado', 'Confirmado', 'hecho', 'nodoConfirmado'],
                    ['preparando', 'Preparando', 'hecho', 'nodoPreparando'],
                    ['en_camino', 'En camino', 'actual', 'nodoEnCamino'],
                    ['entregado', 'Entregado', 'pendiente', 'nodoEntregado'],
                  ] as const
                ).map(([clave, etiqueta, estado, glifo]) => ({
                  clave,
                  etiqueta,
                  estado,
                  icono: ({ color }: { color: string }) => (
                    <Icono nombre={glifo} tamano={12} tinta={color} />
                  ),
                }))}
              />
              {/* El mismo set a 21 px — la vara de la Ley 9 — para poder
                  decir si una silueta que funciona chica se sostiene
                  grande. NO es donde se juzga: es el control. */}
              <View style={{ flexDirection: 'row', gap: spacing[3], alignItems: 'center' }}>
                <Texto variante="apoyo">control a 21:</Texto>
                {(['nodoConfirmado', 'nodoPreparando', 'nodoEnCamino', 'nodoEntregado'] as const).map((g) => (
                  <Icono key={g} nombre={g} tamano={21} />
                ))}
              </View>
            </View>
            {/* EntradaDeCruce — hermana de Entrada por el OTRO eje. La muestra
                tiene que EMULAR el cruce entero (registrar la dirección y
                volver visible la ventana), porque la pieza no acepta una
                dirección por prop: la lee del gesto. Es exactamente lo que la
                hace difícil de mostrar y lo que la hace correcta. */}
            <View style={{ gap: spacing[2] }}>
              <Texto variante="dato">
                EntradaDeCruce — 300 ms · desde 32 (spacing[8]) · la dirección la escribe la PUERTA, no el consumidor. Sin cruce previo NO se anima
              </Texto>
              <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                <Boton
                  variante="compacto"
                  etiqueta="cruzar →"
                  onPress={() => {
                    registrarCruce('derecha')
                    setCruceVisible(false)
                    setTimeout(() => setCruceVisible(true), 16)
                  }}
                />
                <Boton
                  variante="compacto"
                  etiqueta="← cruzar"
                  onPress={() => {
                    registrarCruce('izquierda')
                    setCruceVisible(false)
                    setTimeout(() => setCruceVisible(true), 16)
                  }}
                />
                <Boton
                  variante="compacto"
                  etiqueta="sin puerta"
                  onPress={() => {
                    setCruceVisible(false)
                    setTimeout(() => setCruceVisible(true), 16)
                  }}
                />
              </View>
              <View style={{ minHeight: 56 }}>
                <EntradaDeCruce activo={cruceVisible}>
                  <Tarjeta>
                    <Texto variante="cuerpo">la ventana que llega</Texto>
                  </Tarjeta>
                </EntradaDeCruce>
              </View>
            </View>
          </View>
        </Seccion>

        <Seccion titulo="⭐ GATE S99 — LA BARRA, REHECHA · veredicto aplicado: barra BLANCA (bg.card) + disco en el VERDE DEL TECHO · el disco asoma 4 de 36 · el bloque ícono+etiqueta viaja JUNTO · transición 300→520. Qué decide: si ahora se lee el viaje, y si el disco está bien metido">
          <View style={{ gap: spacing[4] }}>
            <ThemeProvider defaultMode="light">
              <PanelTema etiqueta="claro — sobre franjas: el hueco las deja pasar, y el disco viaja CON el valle (un solo grupo)">
                <GateDeLaBarra />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="dark">
              <PanelTema etiqueta="dark — mismo mecanismo; el techo sale del slot, no de un hex">
                <GateDeLaBarra />
              </PanelTema>
            </ThemeProvider>
          </View>
          <Texto variante="dato">
            EL CRITERIO, para que no sea gusto: la huella entra si A ESE TAMAÑO SE LEE COMO HUELLA. Una huella que a
            24 px se vuelve una mancha no es identidad, es ruido — y ahí la propia condicional del founder ya la mata.
            Tocá los tabs: valle y disco viajan juntos y el valle se deforma hacia el lado del que viene (un vector
            que se deforma, no un botón que salta). ATENDER ya no está destacada: el disco es el único énfasis, y su
            razón es que con L-251 ATENDER puede no existir — un tab que a veces no está no puede ser el centro
            permanente.
          </Texto>
        </Seccion>

        <Seccion titulo="⭐ GATE S99 — LA MOTO Y SU DESTINO, RE-DIBUJADOS COMO OBJETOS DEL MUNDO · qué decide: si ahora PERTENECEN al mapa. Segundo intento: el primero se rechazó por verse pegado encima">
          <View style={{ gap: spacing[4] }}>
            <ThemeProvider defaultMode="light">
              <PanelTema etiqueta="claro — los dos pines en el MISMO mapa: el juicio es la comparación">
                <EnsayoDelAnillo />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="dark">
              <PanelTema etiqueta="dark — el mapa NO tiene tema (cero customMapStyle en la casa): los tiles son los mismos">
                <EnsayoDelAnillo />
              </PanelTema>
            </ThemeProvider>
          </View>
          <Texto variante="dato">
            🔴 LO MEDIDO DA VUELTA LA PREMISA: la silueta oscura NO desaparece sobre los tonos claros — asfalto
            11.54 · parque 11.19 · agua 9.85, todos más de 3× el piso de 3:1. El que desaparece contra esos tres
            es el ANILLO BLANCO (1.44 · 1.48 · 1.68). El cuarto tono —mapa oscuro, donde la tinta cae a 1.56 y el
            anillo sí trabaja— HOY NO EXISTE: cero customMapStyle en toda la casa, el mapa siempre se pinta claro.
            Por eso el anillo muere en la moto y SIGUE en la mascota: ahí el contenido es una FOTO, y su color no lo
            elegimos nosotros. Condición de revivir escrita en la pieza: el día que un mapa se pinte oscuro.
          </Texto>
        </Seccion>

        <Seccion titulo="① ⭐ GATE S85 — LOS GLIFOS, A 21px CONTRA SUS VECINOS · qué decide: (a) que la AGENDA de «Hoy» ya no se confunda con «Preferencias» —la cura que él firmó— y (b) LA INSIGNIA de cohorte, que reemplaza a los dos glifos rechazados — se mira que se separe de sus dos hermanas (estado y capa) y que se lea como distinción, no como estado">
          <View style={{ gap: spacing[4] }}>
            <Texto variante="apoyo">
              (a) LA CURA DE LA BARRA DE TABS. Antes los dos eran círculo con rayos y solo cambiaba
              la cuenta — a 21px, el mismo dibujo. Ahora «Hoy» es una AGENDA: lo que la saca del
              idioma «rectángulo» (ocupado 5 veces) son las dos anillas, y la huella entra como el
              día marcado. Se miran JUNTOS porque juntos viven en la barra.
            </Texto>
            <View style={{ flexDirection: 'row', gap: spacing[5], alignItems: 'center' }}>
              <Icono nombre="hoy" tamano={21} />
              <Icono nombre="datos" tamano={21} />
              <Icono nombre="negocio" tamano={21} />
              <Icono nombre="cuenta" tamano={21} />
              <Icono nombre="preferencias" tamano={21} />
            </View>
            <Texto variante="apoyo">
              ⭐ LA BARRA ENTERA A 21px (S85-B23) — los cuatro tabs en su orden real, más
              `preferencias` al final porque es con quien `hoy` se confundía. Los TRES cambios
              firmados: DATOS gana una GRÁFICA (era la pata y no decía lo que la pantalla es) ·
              NEGOCIO gana LA PATA («el negocio son mascotas») · CUENTA pasa de dos círculos
              apilados a una PERSONA. La pata se MUDA de Datos a Negocio: en aislado habrían sido
              dos tabs con el mismo dibujo, juntos es una mudanza.
            </Texto>
            <View style={{ flexDirection: 'row', gap: spacing[5], alignItems: 'center' }}>
              <Icono nombre="hoy" tamano={28} />
              <Icono nombre="preferencias" tamano={28} />
            </View>
            <Texto variante="apoyo">
              (a bis) ⭐ LA FAMILIA DE LA VENTANA TEMPORAL — `hoy · semana · mes`, que comparten el
              CUERPO (calendario con anillas) y varían LO MARCADO adentro: el día, la semana, el mes.
              Paga el pedido que la hilera «todos · semana · mes» tenía abierto desde S82. El censo
              encontró media familia ya resuelta: `todos` se dice con la Huella (la hilera hermana
              del Hogar ya lo hace) y `hoy` ya era el calendario. ⚠️ SE SEPARAN CONTANDO BARRAS, y
              contar a 21px es lo que puede fallar: si no se distinguen, `mes` cambia de marca (una
              grilla de puntos), no engordan las barras.
            </Texto>
            <View style={{ flexDirection: 'row', gap: spacing[5], alignItems: 'center' }}>
              <Icono nombre="hoy" tamano={21} />
              <Icono nombre="semana" tamano={21} />
              <Icono nombre="mes" tamano={21} />
              <Icono nombre="presupuesto" tamano={21} />
              <Icono nombre="bitacora" tamano={21} />
            </View>
            <View style={{ flexDirection: 'row', gap: spacing[5], alignItems: 'center' }}>
              <Icono nombre="hoy" tamano={28} />
              <Icono nombre="semana" tamano={28} />
              <Icono nombre="mes" tamano={28} />
            </View>
            <Texto variante="apoyo">
              ⚠️ Y el caso que lo rompía: con un NOMBRE LARGO la insignia se caía al renglón de
              abajo — que es exactamente donde el founder dijo que «se ve raro». No era ubicación,
              era `flexWrap`. Ahora el nombre cede y el emblema se queda en su línea.
            </Texto>
            <Texto variante="apoyo">
              (b) ⭐ LA INSIGNIA DE COHORTE — ☠️ SIN LA PALABRA «FUNDADOR», que el founder pidió
              retirar TRES veces: «no quede como que los estoy reconociendo como fundadores». Lo que
              murió no es una palabra, es un ACTO DE HABLA — «Prestador fundador» no describe, OTORGA.
              La que queda es de TIEMPO y no de mérito («Desde 2026»), y en el techo no queda
              ninguna: la escarapela sola (abajo, sobre el muro). La etiqueta sigue viva como
              accessibilityLabel — un emblema mudo al ojo puede serlo al lector solo si no significa
              nada, y éste significa. — reemplaza a los dos glifos que él rechazó («no me gusta
              ninguno, puede que tengamos que no usar glifo para esto, ya que es especial»). El
              diagnóstico era de PIEZA: un glifo de línea a 21px no puede portar PERTENENCIA — un
              glifo dice de qué ES algo, la cohorte dice QUIÉN ES alguien. Es la anatomía de la
              pastilla «Al día» que él mismo señaló, con vocabulario propio: familia `distincion`,
              capa COMUNIDAD (pertenecer es un vínculo, no una credencial).
            </Texto>
            <View style={{ flexDirection: 'row', gap: spacing[3], alignItems: 'center', flexWrap: 'wrap' }}>
              <Insignia distincion="cohorte" cohorte="fundador" cohorteAnio={2026} />
              <Insignia distincion="cohorte" cohorte="fundador" cohorteAnio={2026} tamaño="sm" />
            </View>
            <Texto variante="apoyo">
              Y al lado sus dos hermanas de la misma pieza, para ver que las TRES se separen: la de
              ESTADO (transitoria, se gana y se pierde) y la de CAPA (clasifica un dominio, dibuja
              punto). Si la distinción no se distingue de un estado, falló.
            </Texto>
            <View style={{ flexDirection: 'row', gap: spacing[3], alignItems: 'center', flexWrap: 'wrap' }}>
              <Insignia distincion="cohorte" cohorte="fundador" cohorteAnio={2026} />
              <Insignia estado="alDia" etiqueta="Al día" />
              <Insignia capa="comunidad" etiqueta="Comunidad" />
            </View>
            <Texto variante="apoyo">
              Y SOBRE EL MURO, que es donde va a vivir de verdad (junto al nombre, en el techo). El
              tratamiento de capa NO sirve ahí: `capaText.comunidad` sobre el muro da 1.03 en claro —
              invisible, la misma trampa que cazó a `Boton` en S84. Sobre el muro INVIERTE (fondo
              papel, texto del muro), que es el par firmado por §15b.2: 5.51 claro · 9.61 oscuro.
            </Texto>
            <View style={{ backgroundColor: palette.tealDark, padding: spacing[4], borderRadius: radius.suave, flexDirection: 'row', gap: spacing[3], alignItems: 'center', flexWrap: 'wrap' }}>
              <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.md, color: palette.light0 }}>Clínica Aurora</Text>
              <Insignia distincion="cohorte" superficie="muro" cohorte="pionero" cohorteAnio={2027} soloEmblema />
            </View>
          </View>
        </Seccion>

        {/* ═══ S85-B14 · LAS DOS PROMOVIDAS SUBEN A LA ZONA DE GATE, por
            la misma regla que movió a los emblemas y por aprobación de la
            mesa: **esperan decisión, no son catálogo**. La rueda porque su
            techo en la casa verde nunca se firmó (hasta S85 no vivía acá) y
            los chips porque nunca se vieron en el prestador. Cuando el
            founder firme, BAJAN al catálogo — no se quedan arriba ocupando
            el lugar del siguiente.

            ⚠️ LA FLECHA DEL `acento` NO SUBE, y es la misma regla aplicada
            al revés: **ya está firmada**. El founder la vio en pantalla
            —reportó que en «cambiar ícono» salía a la izquierda— y eligió
            la derecha. Subirla sería poner una decisión CERRADA en la zona
            de las abiertas, que es exactamente lo que la segunda mitad de
            la regla prohíbe. Se queda en la sección de `Boton`, que es su
            casa de catálogo. ═══ */}
        <Seccion titulo="② ⭐ GATE S85 — LOS TRES NÚMEROS DEL TECHO · qué decide: la anatomía que el founder describió (tres columnas centradas, valor grande arriba, rótulo abajo en mayúsculas pequeñas) Y el caso que la complica — la columna que NO tiene número">
          <View style={{ backgroundColor: palette.tealDark, padding: spacing[4], borderRadius: radius.suave, gap: spacing[4] }}>
            <TresNumeros
              columnas={[
                { valor: '6', rotulo: 'Carga' },
                { valor: '$ 148', rotulo: 'Hoy' },
                { valor: '12', rotulo: 'Vidas' },
              ]}
            />
            <TresNumeros
              columnas={[
                { valor: '6', rotulo: 'Carga' },
                { frase: 'Los ingresos los ve el titular', detalle: 'No tenés permiso para ver los ingresos del negocio' },
                { valor: '12', rotulo: 'Vidas' },
              ]}
            />
          </View>
          <View style={{ height: spacing[3] }} />
          <Texto variante="apoyo">
            EL SEGUNDO BLOQUE ES EL QUE IMPORTA. C había resuelto esto con UNA línea por columna, y su
            razón está documentada: cuando la plata no es visible, ese hueco dice UNA FRASE (un
            permiso), no un número con rótulo — y un layout valor+rótulo obligaría a inventar un
            valor, que se lee como CERO. La pieza acepta las dos formas y el TIPO hace imposible
            pasar un valor vacío: si no hay número, no hay campo donde ponerlo. ⚠️ El rótulo se
            «apaga» con ESCALA y MAYÚSCULAS, no con opacidad: sobre el muro la opacidad muere (regla
            S61, medida por C en este mismo techo).
          </Texto>
        </Seccion>

        <Seccion titulo="② ⭐ GATE S85 — LA RUEDA D3 EN LA CASA VERDE · qué decide: el COLOR DE LA SUPERFICIE del día (el «techo» de la rueda) en el prestador. Nunca se firmó porque hasta S85 la rueda no vivía acá: resuelve de `bg.card` como en el cliente. Su FÍSICA no se toca — está firmada y viajó verbatim">
          {/* Promovida del cliente por la Regla de las Piezas: segundo
              consumidor, el bloque «Tu día» del prestador. SU FÍSICA ESTÁ
              FIRMADA y no se recalibra — ítem 66 · paso 76 · escalas
              1.16/.94/.84/.78 · opacidades 1/.62/.34/.18 · 520ms con la
              curva de la casa. Lo que hay que mirar acá es el GESTO: se
              arrastra, y al soltar el imán la deja en un día, jamás entre
              dos. Escala, opacidad y acento siguen AL DEDO (worklet), no
              al estado de React. */}
          <SelectorDia
            dias={[
              { iso: '2026-08-03', dia: 'lun', numero: '3' },
              { iso: '2026-08-04', dia: 'mar', numero: '4' },
              { iso: '2026-08-05', dia: 'mié', numero: '5' },
              { iso: '2026-08-06', dia: 'jue', numero: '6' },
              { iso: '2026-08-07', dia: 'vie', numero: '7' },
              { iso: '2026-08-08', dia: 'sáb', numero: '8' },
            ]}
            elegido="2026-08-05"
            cerrados={new Set(['2026-08-08'])}
            etiquetaCerrado="cerrado"
            onElegir={() => {}}
          />
          <View style={{ height: spacing[3] }} />
          <Texto variante="apoyo">
            ⚠️ GATE ABIERTO, en LAS DOS casas: el color de la SUPERFICIE del día —el &quot;techo&quot; de
            la rueda— nunca se firmó en el prestador, porque hasta hoy la rueda no vivía ahí. Resuelve
            de `bg.card` como en el cliente, y el acento del número de `accent.control`, que ya se
            resuelve por casa (magenta en el cliente, verde en el prestador). El sábado va CERRADO a
            propósito: el día cerrado SE PUEDE TOCAR — un día apagado y mudo era el bug que este
            cableado vino a curar, y su estado se DICE para el lector de pantalla, que no ve
            opacidades.
          </Texto>
        </Seccion>

        <Seccion titulo="② ⭐ GATE S85 — LOS CHIPS CON PATA EN LA CASA VERDE · qué decide: cómo se ven en el prestador, donde NUNCA se vieron (nacieron en el cliente y subieron en S85). La pata sale en `accent.control`, que acá es VERDE y allá magenta — el mismo dibujo con otro acento">
          {/* Promovidos del cliente por la Regla de las Piezas: apareció el
              segundo consumidor (la portada del prestador). Se montan LOS
              DOS porque la pata es lo que comparten y es lo que hay que
              mirar: aparece SOLO en la elegida, sobre el CANTO y JAMÁS
              adentro de la placa del glifo. El aire de arriba está
              reservado por la pieza — un ScrollView recorta a sus bordes y
              la pata MONTA. */}
          <View style={{ gap: spacing[4] }}>
            <FiltroPills
              opciones={[
                { codigo: 'todo', etiqueta: 'Todo', icono: null, capa: null },
                { codigo: 'salud', etiqueta: 'Salud', icono: 'veterinaria', capa: 'identidad' },
                { codigo: 'cuidado', etiqueta: 'Paseos', icono: 'paseo', capa: 'cuidado' },
              ]}
              activo="salud"
              onCambio={() => {}}
            />
            <FiltroMascotas
              mascotas={[
                { id: '1', nombre: 'Thor' },
                { id: '2', nombre: 'Zeus' },
              ]}
              elegida="1"
              onElegir={() => {}}
            />
          </View>
          <View style={{ height: spacing[4] }} />
          <Texto variante="seccion">ChipEntidad — el chip, sin su hilera (S91-B, D-691)</Texto>
          <Texto variante="apoyo">
            La MISMA pieza que consume `FiltroMascotas` arriba. Se expone sola para que una GRILLA
            (el selector de raza del alta) use el chip firmado sin clonarlo. Abajo, los dos calibres
            y el caso que parió D-691: un nombre de 18 caracteres que en `SelectorOpcion` se cortaba
            a «Labrador retrie…» y acá envuelve a dos líneas.
          </Texto>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2.5], alignItems: 'flex-start' }}>
            <ChipEntidad nombre="Thor" elegido={false} onPress={() => {}} />
            <ChipEntidad nombre="Thor" elegido onPress={() => {}} />
            <ChipEntidad nombre="Guillermo Prueba 8" sujeto="persona" elegido={false} onPress={() => {}} />
          </View>
          <View style={{ height: spacing[3] }} />
          <Texto variante="apoyo">tamano="general" — el punto que creció, para alta/perfil:</Texto>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2.5], alignItems: 'flex-start' }}>
            <View style={{ width: 170 }}>
              <ChipEntidad nombre="Labrador retriever" sujeto="cosa" tamano="general" elegido={false} onPress={() => {}} />
            </View>
            <View style={{ width: 170 }}>
              <ChipEntidad nombre="Guacamayo Azul y Amarillo" sujeto="cosa" tamano="general" elegido onPress={() => {}} />
            </View>
          </View>
          <View style={{ height: spacing[3] }} />
          <Texto variante="apoyo">
            S91-B · «COSA + CARA» — la combinación que antes era inexpresable: `fotoUrl` decide si hay
            cara y `sujeto` decide SOLO el fallback. A la izquierda, una raza CON su imagen de la
            galería; a la derecha, la misma sin imagen, cayendo a su inicial (jamás a una huella: una
            raza no es un individuo).
          </Texto>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2.5], alignItems: 'flex-start' }}>
            <View style={{ width: 170 }}>
              <ChipEntidad
                nombre="Labrador retriever"
                sujeto="cosa"
                tamano="general"
                fotoUrl="https://zyltipqscdsdsxnjclhp.supabase.co/storage/v1/object/public/especies-razas/perro/labrador-retriever.webp"
                elegido={false}
                onPress={() => {}}
              />
            </View>
            <View style={{ width: 170 }}>
              <ChipEntidad nombre="Labrador retriever" sujeto="cosa" tamano="general" elegido={false} onPress={() => {}} />
            </View>
          </View>
          <View style={{ height: spacing[3] }} />
          <Texto variante="apoyo">
            El elegido NO se rellena: se HUNDE (pierde la elevación, baja a `bg.hundido`, se achica) y
            la pata lo pisa. Dos marcas para un mismo estado serían el tercer peso que no informa. La
            pata es la primitiva `MarcaEleccion`, no un dibujo propio — y su color sale de
            `accent.control`, o sea que cada casa la viste con su acento: magenta en el cliente, verde
            en el prestador. En memorial el slot de hundido no da paso (una sola superficie a
            propósito): ahí el estado lo cargan la elevación perdida y la escala.
          </Texto>
        </Seccion>

        {/* ═══ S83-B9: el agua en la casa verde. Va PRIMERA junto al gate
            abierto porque es decisión viva, no catálogo. ═══ */}
        /* ☠️ RETIRADA DE LA VISTA (S99-B · D-833) — su veredicto YA LLEGÓ.
         *  Literal que la descarta: «YA NO ESPERA DECISIÓN», en su propio título.
         *  Decía: «✅ FIRMADO S85 (3-ago: «llevala al 5») — CUÁNTO PAPEL VERDE EN CLARO · YA NO ESPERA DECISIÓN: corre el 5% (#F0F8F6). Queda como registro de l…»
         *  Cuánto papel verde en claro: corre el 5%, firma del 3-ago («llevala al 5»). Vive en el token.
         *  Se retira de la VISTA, no del registro: la galería es donde el
         *  founder gatea, y lo que ya tiene firma tapa lo que la espera. */

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

        {/* ☠️ LA LÁMINA DEL DESTELLO MURIÓ CON SU FIRMA (S84-B17) — y con
            ella muere la LÁMINA COMO INSTRUMENTO, incluso para variantes
            de token, que era lo último que le quedaba después de la
            enmienda de método de S83.

            LA RAZÓN, MEDIDA EN ESTA MISMA SESIÓN Y NO SUPUESTA: la galería
            viaja en el OTA igual que todo lo demás, así que nunca fue más
            barata — solo más LEJOS. Y el founder no llega a ella: su
            entrada es la última fila de una pantalla de 641 líneas y se
            llama con vocabulario nuestro. Un instrumento de gate al que el
            gate no llega no es un instrumento.

            LO QUE COSTÓ CADA DESCARTE vive en el registry, junto al color
            firmado: el oro con su 1.59 en claro, y el magenta y el teal
            con la pregunta que cada uno contestaba. Acá queda solo el
            puntero, para que nadie vuelva a montar las cuatro creyendo
            que la comparación falta. */}

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

        /* ☠️ RETIRADA DE LA VISTA (S99-B · D-833) — su veredicto YA LLEGÓ.
         *  Literal que la descarta: «SUPERSEDED por la de arriba», en su propio título.
         *  Decía: «① ⭐ GATE S83 — EL AGUA, COPIADA DEL CLIENTE (SUPERSEDED por la de arriba: su fondo es palette.light0 pintado a mano, que dejó de ser el fond…»
         *  El agua copiada del cliente: su propio título declaraba que la de arriba la reemplaza.
         *  Se retira de la VISTA, no del registro: la galería es donde el
         *  founder gatea, y lo que ya tiene firma tapa lo que la espera. */

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

        /* ☠️ RETIRADA DE LA VISTA (S99-B · D-833) — su veredicto YA LLEGÓ.
         *  Literal que la descarta: «lo FIRMADO», en su propio título.
         *  Decía: «① ⭐ GATE S83 — CUÁL VERDE PARA EL ESTADO ACTIVO · lo FIRMADO: en el prestador el focus NO es magenta, va en verde que ilumine (arbitra D-598…»
         *  Cuál verde para el estado activo. Vive en `accent.active` de las dos casas, y R27 lo vigila.
         *  Se retira de la VISTA, no del registro: la galería es donde el
         *  founder gatea, y lo que ya tiene firma tapa lo que la espera. */

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
        /* ☠️ RETIRADA DE LA VISTA (S99-B · D-833) — su veredicto YA LLEGÓ.
         *  Literal que la descarta: «FIRMADO (S82)», en su propio título.
         *  Decía: «EL HALO — FIRMADO en su forma direccional (S82). El canto de luz que separa la superficie en oscuro, donde la sombra no puede: A6 intacta po…»
         *  El halo direccional. Vive en los tokens de elevación; acá solo repetía una firma.
         *  Se retira de la VISTA, no del registro: la galería es donde el
         *  founder gatea, y lo que ya tiene firma tapa lo que la espera. */

        {/* ④ FIRMADO (S82 r37): gana SelectorSegmentado con los dos
            agregados del founder. Baja de "espera firma" a MUESTRA. */}
        /* ☠️ RETIRADA DE LA VISTA (S99-B · D-833) — su veredicto YA LLEGÓ.
         *  Literal que la descarta: «FIRMADA (S82)», en su propio título.
         *  Decía: «LA ELECCIÓN EXCLUYENTE — FIRMADA (S82): SelectorSegmentado con la letra en magenta y LA PATA pisando la elegida…»
         *  La elección excluyente. Vive en `SelectorSegmentado`; acá solo repetía una firma.
         *  Se retira de la VISTA, no del registro: la galería es donde el
         *  founder gatea, y lo que ya tiene firma tapa lo que la espera. */

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
        /* ☠️ RETIRADA DE LA VISTA (S99-B · D-833) — su veredicto YA LLEGÓ.
         *  Literal que la descarta: «RECHAZADO EN GATE», en su propio título.
         *  Decía: «⑤ ⛔ RECHAZADO EN GATE — NO espera tu firma: ya la tuvo. Es lo que sigue vivo en el código y falta curar…»
         *  Su contenido NO era historia: listaba lo que «sigue vivo en el código y falta curar». Se retira de la VISTA porque su veredicto ya llegó —«NO espera tu firma: ya la tuvo»— y lo pendiente se sigue por su deuda, no por una sección que el founder tiene que saltear cada vez.
         *  Se retira de la VISTA, no del registro: la galería es donde el
         *  founder gatea, y lo que ya tiene firma tapa lo que la espera. */


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

        <Seccion titulo="PantallaConPie (S100b) — el pie fijo RESERVA su propio lugar">
          <MuestraPantallaConPie />
        </Seccion>

        <Seccion titulo="StepperCantidad · el menos→papelera del CARRITO (S100b · G-08)">
          <View style={{ gap: spacing[3] }}>
            <View style={{ flexDirection: 'row', gap: spacing[6], alignItems: 'center' }}>
              <StepperCantidad valor={1} min={0} max={12} onCambio={() => {}} etiqueta="Con papelera" onBorrar={() => {}} />
              <StepperCantidad valor={1} min={0} max={12} onCambio={() => {}} etiqueta="Sin papelera" />
            </View>
            <Texto variante="apoyo">
              El discriminador son los DOS juntos: el de la izquierda es el del CARRITO —en 1 el menos es
              papelera y BORRA— y el de la derecha es el de la GRILLA, donde en 1 se apaga sereno porque
              bajar de 1 devuelve la tarjeta a su +, y el tile no desaparece. La distinción es [SPEC] de
              eBay: la papelera solo va donde el stepper está asociado a un tile que se va. Sin
              confirmación a propósito: la acción es inmediata y el deshacer es de la pantalla, que es la
              única que sabe qué se borró.
            </Texto>
          </View>
        </Seccion>

        <Seccion titulo="StepperCantidad · el número EDITABLE lleva la caja del campo (S103-B)">
          <View style={{ gap: spacing[3] }}>
            <View style={{ flexDirection: 'row', gap: spacing[6], alignItems: 'center' }}>
              <StepperCantidad valor={3} min={1} max={99} onCambio={() => {}} etiqueta="Editable" editable />
              <StepperCantidad valor={3} min={1} max={99} onCambio={() => {}} etiqueta="Solo muestra" />
            </View>
            <Texto variante="apoyo">
              El discriminador son los DOS juntos, y antes de esta tanda eran el MISMO objeto: el
              TextInput y el Text compartían ancho, centrado, mono tabular, tracking y color — la única
              diferencia era un padding en cero. La firma del founder: un número suelto se lee como
              resultado, no como control. El de la izquierda se puede tipear y lo dice sin decirlo; el de
              la derecha es un dato y no promete edición.
            </Texto>
            <Texto variante="apoyo">
              No nace una pastilla nueva: es la caja del campo de la casa (N11/N11′), la misma anatomía
              que llevan Campo, CampoCodigo y CampoFecha — contorno con piso de 3:1 vigilado por R43,
              interior claro, y foco con acento más elevación. Tocalo y mirá el borde: cambia de COLOR y
              nunca de grosor, que es lo que evita que el layout se corra mientras alguien tipea. El alto
              sale derivado del lado de los botones de paso, así que los tres se alinean por construcción.
            </Texto>
            <Texto variante="apoyo">
              Lo que NO está acá y se declara: sobre el bloque lleno (tamano ancho, la vitrina) la caja no
              se monta. Su interior está definido contra el fondo base y ahí pondría una caja blanca sobre
              un bloque de CTA. Es 1 de los 3 montajes editables vivos y espera decisión del founder.
            </Texto>
          </View>
        </Seccion>

        <Seccion titulo="Celda · LA ELEGIDA se dice en letra, sin huella (S103-B · §14)">
          <View style={{ gap: spacing[3] }}>
            <Tarjeta>
              <Celda titulo="Visa terminada en 4482" subtitulo="Vence 08/28" elegida interactiva accessibilityRole="radio" onPress={() => {}} />
              <Separador />
              <Celda titulo="Visa terminada en 4481" subtitulo="Vence 03/27" interactiva accessibilityRole="radio" onPress={() => {}} />
              <Separador />
              <Celda titulo="Mastercard terminada en 9010" subtitulo="Vence 11/26" interactiva accessibilityRole="radio" onPress={() => {}} />
            </Tarjeta>
            <Texto variante="apoyo">
              El caso vivo es la hoja de «Cómo quieres pagar»: con siete tarjetas y dos pares casi
              idénticos, abrir «Cambiar» sin ver cuál es la actual no es cambiar — es elegir de nuevo a
              ciegas. Los dos primeros son el discriminador: mismo banco, un dígito de diferencia.
            </Texto>
            <Texto variante="apoyo">
              SIN HUELLA a propósito (§14): una tarjeta no es alguien, es un instrumento. La huella marca
              SUJETOS. Y el peso no cambia — solo el color —, porque sumarle peso movería el ancho del
              texto y la fila saltaría al elegirla.
            </Texto>
            <Texto variante="apoyo">
              La prop es `elegida`, un booleano, no un color: N23 pide IMPEDIR que alguien tiña un texto
              «porque hace falta destacar un dato». Con un booleano semántico el tinte no está al alcance
              de quien monta la pieza, y R58 vigila que `Texto` no gane esa puerta.
            </Texto>
          </View>
        </Seccion>

        <Seccion titulo="Mutacion (S100d·bis) — lo que cambia de forma sin irse">
          <View style={{ gap: spacing[3], maxWidth: 200 }}>
            <Mutacion
              alto={ALTO_STEPPER_ANCHO}
              estado="reposo"
              reposo={<Boton etiqueta="Agregar" onPress={() => {}} bloque tamaño="sm" />}
              activo={<Texto variante="apoyo">—</Texto>}
            />
            <Mutacion
              alto={ALTO_STEPPER_ANCHO}
              estado="activo"
              reposo={<Texto variante="apoyo">—</Texto>}
              activo={
                <StepperCantidad
                  valor={2}
                  min={1}
                  max={12}
                  onCambio={() => {}}
                  etiqueta="Cantidad"
                  registro="compra"
                  tamano="ancho"
                  onBorrar={() => {}}
                />
              }
            />
          </View>
          <Texto variante="apoyo">
            Las dos formas de la tarjeta de vitrina, en la MISMA caja — que es la condición que hace
            posible la transformación (medida en Laika: botón 130,8×28,8 · control 129,0×27,4). Con
            cajas distintas no hay transformación: hay reemplazo. Acá se ven quietas y separadas; la
            pieza las cruza con un fundido de 150 ms y la inversa sale sola de `estado`.
            ⚠️ La microanimación NO se pudo medir en el aparato (screencap 400 ms, sin ffmpeg): la
            juzga el ojo del founder.
          </Texto>
        </Seccion>

        <Seccion titulo="GotaUbicacion (S100d·bis) — la marca del mapa, fuera del mapa">
          <View style={{ flexDirection: 'row', gap: spacing[6], alignItems: 'center' }}>
            <GotaUbicacion />
            <GotaUbicacion lado={20} />
            <GotaUbicacion lado={40} />
          </View>
          <Texto variante="apoyo">
            Borde grueso en ocre (firma del founder). Es el MISMO dibujo que el glifo `ubicacion` y que
            el pin del mapa — uno solo, en `gota.ts`. Y acá se ancla por el CENTRO: en el mapa la punta
            marca una coordenada y por eso sube; fuera del mapa no marca nada, y alinear por la punta
            la dejaría visualmente alta al lado de una línea de texto.
          </Texto>
        </Seccion>

        <Seccion titulo="CarritoFlotante (S100d) — la ÚNICA puerta al carrito, donde llega el pulgar">
          <View style={{ flexDirection: 'row', gap: spacing[7], alignItems: 'center' }}>
            <CarritoFlotante cuenta={1} onAbrir={() => {}} etiqueta="Ver tu carrito, 1 producto" />
            <CarritoFlotante cuenta={12} onAbrir={() => {}} etiqueta="Ver tu carrito, 12 productos" />
            <CarritoFlotante cuenta={140} onAbrir={() => {}} etiqueta="Ver tu carrito, 140 productos" />
          </View>
          <Texto variante="apoyo">
            El cuarto caso es el que NO se ve, y es el discriminador: con `cuenta={0}` la pieza no se
            dibuja — no hay nada del otro lado de esa puerta. Por eso «al agregar se abre el
            flotante»: el primer + la hace entrar. Ocre (F-OCRE, acción de compra) con el glifo en
            tinta —el par 8.40 del CTA— y el contador en tinta sobre papel, que además lo separa del
            oro. El carrito lleva ruedas y NO lleva huella: es un control.
          </Texto>
        </Seccion>

        <Seccion titulo="FichaRepartidor (S100d) — quién va a tocar el timbre">
          <View style={{ gap: spacing[4] }}>
            <FichaRepartidor
              nombre="Byron Ernesto"
              placa="PDL-8812"
              vehiculo="Moto roja"
              etiquetaFoto="Todavía no tenemos su foto"
            />
            <FichaRepartidor nombre="Byron Ernesto" etiquetaFoto="Todavía no tenemos su foto" />
          </View>
          <Texto variante="apoyo">
            Los dos casos son REALES y en la misma proporción: de los 2 pedidos en camino de hoy, uno
            tiene placa y el otro tiene CERO vehículos. Arriba la placa manda (es lo único que la
            familia puede verificar desde la puerta, y va en mono porque se lee de una moto). Abajo,
            sin placa, el nombre preside y no queda ni hueco ni guion. El círculo hundido es el hueco
            de la foto, declarado — jamás una cara genérica.
          </Texto>
        </Seccion>

        <Seccion titulo="Salida (S100d) — la cuarta de la familia: lo que estaba y ya no está">
          <View style={{ gap: spacing[2] }}>
            <Salida>
              <Tarjeta>
                <Texto variante="cuerpo">Una fila de lista cualquiera</Texto>
              </Tarjeta>
            </Salida>
          </View>
          <Texto variante="apoyo">
            Es la pieza que NO se puede mirar quieta: su trabajo ocurre al desmontarse. Se apaga en su
            lugar (micro, 150) y recién entonces las vecinas cierran el hueco (estándar, 300). Su
            gate real es el carrito, borrando. ⚠️ Exige key estable por ítem: con key=index React
            renumera en vez de desmontar y la salida no dispara, sin error y sin warning.
          </Texto>
        </Seccion>

        <Seccion titulo="GlifoConContador (S100b) — un glifo con su número encima (G-14)">
          <View style={{ flexDirection: 'row', gap: spacing[7], alignItems: 'center' }}>
            <GlifoConContador nombre="carrito" cuenta={0} etiqueta="Carrito, vacío" />
            <GlifoConContador nombre="carrito" cuenta={3} etiqueta="Carrito, 3 productos" />
            <GlifoConContador nombre="carrito" cuenta={12} etiqueta="Carrito, 12 productos" />
            <GlifoConContador nombre="carrito" cuenta={140} etiqueta="Carrito, 140 productos" />
            {/* El caso ANIDADO — el consumidor natural de esta pieza. Acá la
                voz vive en el tocable y la pieza se borra del árbol: un solo
                nodo accesible, no dos. */}
            <Pressable accessibilityRole="button" accessibilityLabel="Carrito, 3 productos" onPress={() => {}}>
              <GlifoConContador nombre="carrito" cuenta={3} dentroDeTocable />
            </Pressable>
          </View>
          <Texto variante="apoyo">
            Cuatro casos, y el primero es el discriminador: con 0 NO se dibuja disco — un cero en un
            contador es ruido con forma de dato (19.9). Con 140 dice 99+ : la salida es decir «muchos»,
            jamás encoger la letra, porque un contador ilegible no cuenta nada. El número va sobre el
            MISMO par que el timbre + de TarjetaProducto, que ya está medido en el gate de contraste: no
            se inventa un color acá. Y el disco no escala con el glifo — es una señal, y una señal que
            crece con su soporte deja de ser constante.
          </Texto>
        </Seccion>

        <Seccion titulo="SelectorVentana (S96) — cuándo llega, y por qué un día no se puede elegir (§6.2)">
          <MuestraVentana />
        </Seccion>

        <Seccion titulo="BuscadorDeLugar + PinMovible (S96) — la dirección con Places y el punto a mano (§7)">
          <MuestraLugar />
        </Seccion>

        <Seccion titulo="CodigoAEscala (S96) — el código que se lee a través de un mostrador">
          {/* Los dos consumidores con los que nace, lado a lado: el de la
              puerta (lo dice la familia) y el de reclamo (va en la
              factura del vet). El tercero muestra que los separadores
              son DEL DATO — la pieza no los inventa ni los quita. */}
          <View style={{ gap: spacing[5] }}>
            <CodigoAEscala etiqueta="Código de la puerta" codigo="4827" />
            <CodigoAEscala
              etiqueta="Código de reclamo"
              codigo="87654321"
              expira="Vence el 10 de noviembre"
            />
            <CodigoAEscala etiqueta="Con separadores del emisor" codigo="8765-4321" />
          </View>
        </Seccion>

        <Seccion titulo="copiar (S103) — el glifo, contra sus hermanos de control y contra su pariente">
          {/* LA COMPARACIÓN ES LA MUESTRA. Arriba a 24 (la grilla de
              diseño) y abajo a 21 (el gate §2.9), porque el riesgo de este
              glifo NO se ve grande: es el pariente más cercano del
              registry —`documentos` es su espejo— y lo que los separa es
              la HUELLA, que a 21px es justo lo que puede empastarse. */}
          <View style={{ gap: spacing[6] }}>
            <View style={{ gap: spacing[3] }}>
              <Texto variante="apoyo">Hermanos de CONTROL (los cinco sin huella) · 24px</Texto>
              <View style={{ flexDirection: 'row', gap: spacing[5], alignItems: 'center' }}>
                <Icono nombre="copiar" tamano={24} registro="tinta" />
                <Icono nombre="compartir" tamano={24} registro="tinta" />
                <Icono nombre="descargar" tamano={24} registro="tinta" />
                <Icono nombre="lapiz" tamano={24} registro="tinta" />
                <Icono nombre="filtro" tamano={24} registro="tinta" />
              </View>
            </View>

            <View style={{ gap: spacing[3] }}>
              <Texto variante="apoyo">Los mismos a 21px — el gate por ícono (§2.9)</Texto>
              <View style={{ flexDirection: 'row', gap: spacing[5], alignItems: 'center' }}>
                <Icono nombre="copiar" tamano={21} registro="tinta" />
                <Icono nombre="compartir" tamano={21} registro="tinta" />
                <Icono nombre="descargar" tamano={21} registro="tinta" />
                <Icono nombre="lapiz" tamano={21} registro="tinta" />
                <Icono nombre="filtro" tamano={21} registro="tinta" />
              </View>
            </View>

            <View style={{ gap: spacing[3] }}>
              <Texto variante="apoyo">
                ⚠️ El pariente: `copiar` (control, sin huella) contra `documentos` (mundo, CON
                huella). Son espejo — si a 21px no se separan, el que se mueve es `copiar`.
              </Texto>
              <View style={{ flexDirection: 'row', gap: spacing[6], alignItems: 'center' }}>
                <Icono nombre="copiar" tamano={24} />
                <Icono nombre="documentos" tamano={24} />
                <Icono nombre="copiar" tamano={21} />
                <Icono nombre="documentos" tamano={21} />
              </View>
            </View>
          </View>
        </Seccion>

        <Seccion titulo="BotonCopiar (S103) — un toque copia, y el botón mismo lo confirma">
          {/* Vive al lado de `CodigoAEscala` a propósito: su consumidor es
              el código de 6 dígitos de DeUna, y la galería debería
              mostrarlos juntos como se van a ver.

              ⚠️ SIN `expo-clipboard` en el binario, los tres salen
              APAGADOS — y eso ES la muestra: la pieza degrada honesta en
              vez de romper. El estado del módulo se dice acá arriba para
              que nadie lea el apagado como un defecto de la galería. */}
          <View style={{ gap: spacing[5] }}>
            <Texto variante="apoyo">
              {HAY_PORTAPAPELES
                ? 'Módulo de portapapeles presente: los botones copian de verdad.'
                : 'Sin `expo-clipboard` en este binario (llega con la próxima build, L-134): los botones se apagan solos.'}
            </Texto>

            {/* CON glifo: es el caso que el founder firmó — se reconoce sin
                leer, y acá la persona mira seis dígitos contra reloj. */}
            <CodigoAEscala etiqueta="Código para pagar en Deuna" codigo="482716" />
            <BotonCopiar valor="482716" etiqueta="Copiar código" etiquetaCopiado="Copiado" glifo />

            <Texto variante="apoyo">Vencido — apagado sereno, jamás en danger:</Texto>
            <BotonCopiar
              valor="482716"
              etiqueta="Copiar código"
              etiquetaCopiado="Copiado"
              vencido
              razonVencido="El código venció. Generá uno nuevo para copiarlo."
            />

            <Texto variante="apoyo">A ancho completo, para pie de pantalla:</Texto>
            <BotonCopiar
              valor="482716"
              etiqueta="Copiar código"
              etiquetaCopiado="Copiado"
              bloque
            />
          </View>
        </Seccion>

        <Seccion titulo="ⓘ info (S98) — FIRMADO: sin huella · cierra «glifo de control» (S79)">
          {/* ✅ GATE DADO (S98). Acá vivían las DOS variantes —A sin huella
              y B con una huella SIMULADA al pie— porque el gate necesitaba
              verlas juntas. El founder firmó A, así que **B SALE DEL
              CÓDIGO** (Ley 37: lo que sale de la UI sale del código). Un
              candidato rechazado que se queda montado deja de ser una
              pregunta y pasa a ser ruido que el próximo lee como opción
              viva.

              LA REGLA FIRMADA, que es lo que sobrevive al caso:
              *«en un glifo de control no hay mascota, hay interfaz; la
              huella se reserva para donde significa.»*
              ⇒ `ia` deja de ser una excepción suelta de S53 y pasa a ser
              el primer habitante de la categoría, con este ⓘ.

              ⚠️ LO QUE LA MEDICIÓN DEL GATE DEJÓ ESCRITO, y por eso no se
              pierde: B se mostraba a **23 px** —su huella era un overlay
              en `bottom/right: -2`— mientras los otros ocho estaban a 21.
              O sea que se juzgó con dos píxeles MÁS de aire de los que
              iba a tener. La firma la rechazó igual.

              QUEDA la comparación que sigue siendo útil de mirar: el ⓘ
              contra el salvavidas (`ayuda`) a 21 px — son dos trabajos
              distintos y **pueden convivir en una pantalla**. */}
          <View style={{ gap: spacing[4] }}>
            <Texto variante="apoyo">
              A 21 px — `info` (FIRMADO, sin huella) · `ayuda` (el salvavidas, CON huella al centro)
              · y cinco del registry
            </Texto>
            <View style={{ flexDirection: 'row', gap: spacing[4], alignItems: 'center' }}>
              <Icono nombre="info" tamano={21} />
              <Icono nombre="ayuda" tamano={21} />
              {(['hoy', 'cuenta', 'negocio', 'atender', 'preferencias'] as IconoNombre[]).map((n) => (
                <Icono key={n} nombre={n} tamano={21} />
              ))}
            </View>
            <Texto variante="apoyo">A 44 px — el mismo orden</Texto>
            <View style={{ flexDirection: 'row', gap: spacing[4], alignItems: 'center' }}>
              <Icono nombre="info" tamano={44} />
              <Icono nombre="ayuda" tamano={44} />
            </View>
            <Texto variante="apoyo">
              ✅ FIRMADO (S98): el ⓘ va sin huella — «en un glifo de control no hay mascota, hay
              interfaz». Cierra la categoría «glifo de control» que S79 dejó nombrada. Sus dos
              habitantes hoy: `info` e `ia`.
            </Texto>
          </View>
        </Seccion>

        <Seccion titulo="Baldosa (S97+) — lo que se ELIGE (Acto II: tarjetas para elegir, filas para leer)">
          {/* LOS DOS CONSUMIDORES JUNTOS, porque la condicion de la mesa
              fue que el segundo no la deforme: arriba ATENDER (glifo +
              nombre, sin detalle) y abajo los servicios de Negocio (con
              detalle). Que se vean iguales ES la prueba.
              La GRILLA la arma el consumidor — la pieza es UNA baldosa. */}
          <View style={{ gap: spacing[5] }}>
            {/* 🔴 EL CASO QUE ESTA GALERIA NO CAZO, y C lo encontro
                montandola de verdad: aca las baldosas eran MAS ANCHAS que
                en la pantalla real, asi que «Adiestramiento» entraba y en
                ATENDER se partia a mitad de palabra.
                ⇒ **se fija el ancho REAL de la pantalla (190 px)** y se
                monta la PALABRA REAL del oficio mas largo. *Una galeria
                que da mas aire que la pantalla no prueba la pieza: prueba
                una version comoda de la pieza.* */}
            <View style={{ gap: spacing[2] }}>
              <Texto variante="apoyo">
                🔴 EL ANCHO REAL — 190 px, dos columnas en un telefono de 420. Las palabras de
                la casa, sin acortar.
              </Texto>
              <View style={{ flexDirection: 'row', gap: spacing[4] }}>
                {([
                  { g: 'training', t: 'Adiestramiento', c: 'cuidado' },
                  { g: 'despensa', t: 'Venta de productos', c: 'consumo' },
                ] as const).map((o) => (
                  <View key={o.t} style={{ width: 190 }}>
                    <Baldosa glifo={o.g} titulo={o.t} capa={o.c} onPress={() => {}} />
                  </View>
                ))}
              </View>
            </View>
            <View style={{ gap: spacing[2] }}>
              <Texto variante="apoyo">ATENDER — cuatro oficios, sin detalle</Texto>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing[2] }}>
                {([
                  { g: 'veterinaria', t: 'Veterinaria', c: 'identidad' },
                  { g: 'grooming', t: 'Grooming', c: 'cuidado' },
                  { g: 'paseo', t: 'Paseo', c: 'cuidado' },
                  { g: 'despensa', t: 'Venta de productos', c: 'consumo' },
                ] as const).map((o, i) => (
                  <View key={o.g} style={{ width: '50%', paddingHorizontal: spacing[2], paddingBottom: spacing[4] }}>
                    <Baldosa glifo={o.g} titulo={o.t} capa={o.c} orden={i} onPress={() => {}} />
                  </View>
                ))}
              </View>
            </View>
            {/* 🔴 EL VECINO DE ABAJO NO ES ADORNO — es lo que destapa el
                colapso a altura 0. Mi galeria monto la grilla como ULTIMO
                elemento y por eso no lo cazo: **sin nada debajo, una
                altura 0 es invisible.** Lo encontro C poniendole un
                vecino en la portada real.
                ⇒ toda grilla de esta galeria lleva una fila DEBAJO. */}
            <View style={{ gap: spacing[2] }}>
              <Texto variante="apoyo">
                NEGOCIO — los mismos, CON detalle: el titulo cae a la misma altura en los dos
              </Texto>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing[2] }}>
                {([
                  { g: 'veterinaria', t: 'Consulta general', c: 'identidad', d: '$25 · 30 min' },
                  { g: 'grooming', t: 'Bano y corte', c: 'cuidado', d: 'desde $18' },
                  { g: 'paseo', t: 'Paseo de una hora con nombre largo', c: 'cuidado', d: '3 activos' },
                ] as const).map((o) => (
                  <View key={o.t} style={{ width: '50%', paddingHorizontal: spacing[2], paddingBottom: spacing[4] }}>
                    <Baldosa glifo={o.g} titulo={o.t} detalle={o.d} capa={o.c} onPress={() => {}} />
                  </View>
                ))}
              </View>
            </View>
            {/* EL TESTIGO: si la grilla de arriba colapsa a altura 0, esta
                fila se le monta encima y se ve al instante. Es el control
                que faltaba. */}
            <Celda
              titulo="Si ves esta fila ENCIMA de las baldosas, la grilla colapso a altura 0"
              subtitulo="testigo de layout — no borrar"
            />
          </View>
        </Seccion>

        <Seccion titulo="Destape (S97+) — la ceremonia de cierre del wizard de alta">
          {/* LA UNICA CASA DONDE LA RAMPA DE 6 STOPS ES LEGAL EN EL
              PRESTADOR (§9bis.3, solo-marca). Fuera del destape sigue
              prohibida — por eso la muestra vive aca y no como token
              suelto de una paleta.
              El boton de fin NO es adorno: prueba que `alTerminar` sale
              del ULTIMO GESTO REAL y no de un temporizador paralelo, que
              es la firma de mesa que gobierna esta pieza. */}
          <MuestraDestape />
        </Seccion>

        <Seccion titulo="PuertaDeOficio (S96) — el barrido al cambiar de oficio (§3)">
          <MuestraPuerta />
        </Seccion>

        <Seccion titulo="AvisoAlergia (S96) — la alergia ADVIERTE, no esconde (§5.4)">
          {/* Los DOS modos juntos, porque la comparación ES la ley: uno
              dice "esto le hace mal a Thor" y el otro "no lo sabemos".
              Que se vean distinto es el punto — igualarlos entrena a
              ignorar el primero. Y el tercero muestra el paso explícito
              YA dado: el control desaparece, no se vuelve a pedir. */}
          <View style={{ gap: spacing[4] }}>
            {/* LAS TRES RAMAS DE LA FIRMA, y la cuarta que NO se dibuja.
                Montadas juntas porque la comparación ES la ley: el dueño
                tiene que poder distinguir «le hace mal» de «no lo
                verificamos» de «no lo tenemos». */}
            {/* LAS CUATRO VOCES, y los DOS SILENCIOS que no se dibujan.
                Montadas juntas porque la comparación ES la ley: el dueño
                tiene que poder distinguir «le hace mal» de «PODRÍA hacerle
                mal» de «no lo verificamos» de «no lo tenemos». */}
            <AvisoAlergia
              composicion="verificada"
              coincidencia="exacta"
              mensaje="Thor es alérgico al pollo y este alimento lo contiene."
              onEntendido={() => {}}
              etiquetaEntendido="Entiendo, seguir igual"
            />
            <AvisoAlergia
              composicion="declarada_sin_verificar"
              coincidencia="imprecisa"
              mensaje="Este alimento contiene proteína de ave sin especificar, y podría ser pollo."
              detalle="Thor es alérgico al pollo."
              onEntendido={() => {}}
              etiquetaEntendido="Entiendo, seguir igual"
            />
            <AvisoAlergia
              composicion="declarada_sin_verificar"
              coincidencia="ninguna"
              mensaje="No verificamos la lista de ingredientes de este producto."
              detalle="Puede tener pollo sin declararlo. Thor es alérgico."
            />
            <AvisoAlergia
              composicion="ausente"
              coincidencia="ninguna"
              mensaje="No tenemos los ingredientes de este producto."
              detalle="No podemos avisarte si tiene algo que a Thor le haga mal."
            />
            <AvisoAlergia
              composicion="verificada"
              coincidencia="exacta"
              mensaje="Thor es alérgico al pollo y este alimento lo contiene."
              entendido
              onEntendido={() => {}}
              etiquetaEntendido="Entiendo, seguir igual"
              etiquetaYaEntendido="Lo tuviste en cuenta."
            />
            {/* LOS DOS SILENCIOS LEGALES, montados a propósito y sin
                dibujar nada: `verificada` sin coincidencia (cotejamos y
                está bien) y `no_aplica` (una arena sanitaria no tiene
                ingredientes que cotejar). El hueco de abajo es la pieza
                haciendo su trabajo, no dos muestras que faltan. */}
            <AvisoAlergia
              composicion="verificada"
              coincidencia="ninguna"
              mensaje="(no se dibuja: cotejamos y está bien)"
            />
            <AvisoAlergia
              composicion="no_aplica"
              coincidencia="ninguna"
              mensaje="(no se dibuja: una arena no tiene ingredientes)"
            />
          </View>
        </Seccion>

        <Seccion titulo="SelectorDestinoItem (S96) — a quién va este producto (§6.3)">
          <MuestraSelectorDestino />
        </Seccion>

        <Seccion titulo="TarjetaProducto + PrecioText (S100) — la vitrina de DOS columnas, con el + que agrega sin abrir">
          <Texto variante="apoyo">
            Firma del founder (17-ago): premium · dos columnas · AGREGAR SIN ABRIR DETALLE.
            Lo que hay que mirar acá son cuatro cosas, y las cuatro son de forma:
            ① el + está SIEMPRE en la misma esquina (la mano lo encuentra sin mirar) y
            al agregar MUTA a stepper — mismo control, mismo borde derecho ·
            ② los precios de una fila quedan ALINEADOS aunque un nombre ocupe una línea
            y el otro dos — eso lo hace el ancla de abajo, y es lo que deja comparar
            de un vistazo · ③ el sin stock dice el cartel EN la tarjeta, no en otro
            lado · ④ el $/kg sigue en mono porque es un CÁLCULO: el contraste entre
            los dos registros es lo que dice cuál es el precio y cuál la cuenta.
          </Texto>
          <Texto variante="apoyo">
            🔴 RE-DERIVACIÓN S100b — tres cosas más que mirar. ⑤ El PRECIO bajó de peso
            700 a 500: mismo cuerpo, menos grito. Medido contra Laika, que pone 20 px en
            500 sobre una tarjeta de 366 px mientras nosotros poníamos 20 px en 700 sobre
            una de 164 — casi la misma tipografía en menos de la mitad de ancho.
            ⑥ Con cantidad, el stepper baja a SU PROPIA FILA y va COMPACTO (116 dp, no
            144): en la caja de 138 el de 144 se recortaba y el + quedaba fuera del
            layout — eso era G-01. El blanco táctil sigue siendo 44 vía hitSlop: se achica
            el píxel, no el target. ⑦ NINGUNA de estas muestras pasa fotoUrl, así que
            todas exhiben el ESTADO SIN FOTO: glifo de despensa centrado sobre el fondo
            hundido. No es un placeholder de carga y no debe parecerlo — «no hay foto» y
            «todavía no llegó» son dos cosas distintas. Es el estado permanente del
            granel, la marca chica y el producto del vendedor local.
          </Texto>
          <View style={GRILLA_DE_DOS}>
            <View style={CELDA_DE_GRILLA}>
              <TarjetaProducto
                nombre="Pro Pac Adulto Pollo y Arroz"
                presentacion="15 kg"
                precio={70.9}
                precioPorUnidad="$4.73 / kg"
                compra={{ modo: 'vitrina', hayStock: true, cantidad: 0, onAgregar: () => {}, onCambiarCantidad: () => {} }}
                onPress={() => {}}
              />
            </View>
            <View style={CELDA_DE_GRILLA}>
              {/* El nombre de DOS líneas al lado del de una: acá se ve el ancla. */}
              <TarjetaProducto
                nombre="Acondicionador de agua para acuario"
                presentacion="250 ml"
                precio={8.5}
                compra={{ modo: 'vitrina', hayStock: true, cantidad: 2, onAgregar: () => {}, onCambiarCantidad: () => {} }}
                onPress={() => {}}
              />
            </View>
            <View style={CELDA_DE_GRILLA}>
              <TarjetaProducto
                nombre="Arena sanitaria aglomerante"
                presentacion="10 kg"
                precio={12.75}
                compra={{ modo: 'vitrina', hayStock: false, cantidad: 0, onAgregar: () => {}, onCambiarCantidad: () => {} }}
                onPress={() => {}}
              />
            </View>
            <View style={CELDA_DE_GRILLA}>
              {/* 🔴 LA SEÑAL DE ALERGIA — solo en BÚSQUEDA (la letra:
                  «exclusión dura en la RECOMENDACIÓN, advertencia dura en
                  la BÚSQUEDA»). Va DENTRO de la tarjeta: un aviso colgando
                  fuera de la fila no tiene qué lo ate a su producto, y en
                  dos columnas el ojo no sabe de cuál habla.
                  El naranja es de la alergia y el sin-stock queda neutro a
                  propósito: la alergia es riesgo para la mascota, el
                  agotado es un hecho del estante. */}
              <TarjetaProducto
                nombre="Pro Pac Pollo y Arroz"
                presentacion="7.5 kg"
                precio={42.5}
                alergia={{ composicion: 'declarada_sin_verificar', coincidencia: 'exacta', senal: 'Contiene pollo' }}
                compra={{ modo: 'vitrina', hayStock: true, cantidad: 0, onAgregar: () => {}, onCambiarCantidad: () => {} }}
                onPress={() => {}}
              />
            </View>
            <View style={CELDA_DE_GRILLA}>
              {/* 🔴 LA SEGUNDA TEMPERATURA (firma del founder · H-008).
                  El OTRO silencio ilegal —no sabemos qué tiene— habla
                  igual, pero SIN ámbar. Miralas juntas: si las dos
                  gritaran, con ~51% del catálogo sin composición el
                  ámbar sería fondo de pantalla y el de la alergia real
                  no significaría nada. Reservar el ámbar es lo que lo
                  mantiene con sentido. */}
              <TarjetaProducto
                nombre="Snack dental"
                presentacion="Sobre 85 g"
                alergia={{ composicion: 'ausente', coincidencia: 'ninguna', senal: 'Sin composición declarada' }}
                precio={null}
                compra={{ modo: 'vitrina', hayStock: true, cantidad: 0, onAgregar: () => {}, onCambiarCantidad: () => {} }}
                onPress={() => {}}
              />
            </View>
          </View>

          <Texto variante="apoyo">
            🔴 EL ESPEJO DEL VENDEDOR — la MISMA pieza, sin carrito (`modo: 'espejo'`).
            Es lo que hace que N17 sea verdad y no una intención: el vendedor administra
            sobre exactamente lo que ve la familia. Miralo al lado de los de arriba —
            mismo nombre truncado a dos líneas, mismo precio, misma foto. Si acá el
            nombre NO se truncara, el espejo le estaría mintiendo sobre cómo se ve su
            producto. Lo único que cambia es que no hay `+`: no hay carrito que ofrecer.
            Y el veredicto de completitud (N18) solo aparece en la cara ADMINISTRAR.
          </Texto>
          <View style={GRILLA_DE_DOS}>
            <View style={CELDA_DE_GRILLA}>
              <TarjetaProducto
                nombre="Pro Pac Adulto Pollo y Arroz"
                presentacion="15 kg"
                precio={70.9}
                compra={{ modo: 'espejo' }}
                onPress={() => {}}
              />
            </View>
            <View style={CELDA_DE_GRILLA}>
              <TarjetaProducto
                nombre="Arena sanitaria aglomerante"
                presentacion="10 kg"
                precio={null}
                alcance="Le faltan 2"
                compra={{ modo: 'espejo' }}
                onPress={() => {}}
              />
            </View>
          </View>

          <Texto variante="apoyo">
            PrecioText en sus tres registros — vitrina · ficha · línea. El símbolo y la
            cifra son UNA palabra visual ($6.70, sin espacio) y las cifras son
            tabulares: en una grilla los precios se leen en columna aunque estén en
            tarjetas distintas.
          </Texto>
          <View style={{ flexDirection: 'row', gap: spacing[6], alignItems: 'flex-end' }}>
            <PrecioText valor={6.7} registro="vitrina" />
            <PrecioText valor={70.9} registro="ficha" porUnidad="$4.73 / kg" />
            <PrecioText valor={4.5} registro="linea" />
            <PrecioText valor={9.9} anterior />
          </View>
        </Seccion>

        <Seccion titulo="TarjetaPedido (S96) — un pedido en una lista, de los DOS lados">
          {/* Las dos caras juntas, que es como se juzga la decisión "una
              pieza y no dos": misma anatomía, distinta voz y distinto
              acento. Y la tercera muestra el caso que no tiene recorrido
              (una compra de mostrador reclamada): sin pasos NI DESVÍO no
              hay escalera — un riel vacío afirmaría un camino que no
              existe.
              ⚠️ El «ni desvío» NO es una precisión de redacción: es la
              cura de H-04. Ver la cuarta tarjeta. */}
          <View style={{ gap: spacing[3] }}>
            <TarjetaPedido
              acento="oficio"
              titulo="Karina Salazar"
              detalle="hoy 14:00–18:00 · 3 productos"
              monto="$ 48.90"
              onPress={() => {}}
              etiqueta="Pedido de Karina Salazar, empacado"
              pasos={[
                { clave: 'preparado', etiqueta: 'Preparado', estado: 'hecho' },
                { clave: 'empacado', etiqueta: 'Empacado', estado: 'actual' },
                { clave: 'despachado', etiqueta: 'Despachado', estado: 'pendiente' },
                { clave: 'entregado', etiqueta: 'Entregado', estado: 'pendiente' },
              ]}
            />
            <TarjetaPedido
              titulo="Veterinaria Aurora"
              detalle="llega hoy entre 14:00 y 18:00"
              monto="$ 48.90"
              onPress={() => {}}
              etiqueta="Tu pedido de Veterinaria Aurora, en camino"
              pasos={[
                { clave: 'confirmado', etiqueta: 'Confirmado', estado: 'hecho' },
                { clave: 'preparando', etiqueta: 'Preparando', estado: 'hecho' },
                { clave: 'en_camino', etiqueta: 'Vamos hacia vos', estado: 'actual' },
                { clave: 'entregado', etiqueta: 'Entregado', estado: 'pendiente' },
              ]}
            />
            <TarjetaPedido
              titulo="Veterinaria Aurora"
              detalle="compra en el mostrador · 2 productos"
              monto="$ 21.40"
              onPress={() => {}}
              etiqueta="Compra en el mostrador de Veterinaria Aurora"
            />
            {/* 🔴 EL DISCRIMINADOR DE H-04 — la cuarta tarjeta es la que
                PROBABA el defecto, y por eso está acá y no en una nota.

                Un pedido `cancelado` llega SIN pasos y CON desvío. Hasta
                S100-B esta tarjeta se dibujaba **muda**: mismo título,
                mismo monto, y ni una palabra de que el pedido se había
                cancelado — se leía como un pedido normal al que le
                faltaba el progreso.

                Lo que hay que ver: **la banda dice "Cancelaste este
                pedido"**. Si algún día vuelve a aparecer sin ella, el
                guard de la regla de existencia volvió a mirar los pasos
                en vez del contenido. */}
            <TarjetaPedido
              titulo="Veterinaria Aurora"
              detalle="pedido del 12 de agosto · 3 productos"
              monto="$ 48.90"
              onPress={() => {}}
              etiqueta="Tu pedido de Veterinaria Aurora, cancelado"
              pasos={[]}
              desvio={{ etiqueta: 'Cancelaste este pedido' }}
            />
          </View>
        </Seccion>

        <Seccion titulo="FilaEntrega (S96) — una parada del repartidor, legible al sol">
          {/* Con instrucción y sin ella: la instrucción es el árbitro del
              caso feo (§9.3) y por eso tiene superficie propia. */}
          <View style={{ gap: spacing[6] }}>
            <FilaEntrega
              direccion="Av. Shyris N34-120 y Portugal"
              referencia="Casa verde, portón negro, frente a la panadería"
              instrucciones="Dejar en portería con Don Luis. Timbre 3B."
              onLlamar={() => {}}
            />
            <FilaEntrega direccion="Calle Cuero y Caicedo 458" onLlamar={() => {}} />
          </View>
        </Seccion>

        <Seccion titulo="EscaleraEstados (S96) — dónde está y cuánto falta, sin abrir nada">
          {/* Los CUATRO estados que el contrato distingue, montados
              juntos porque la comparación ES el gate:
              compacta (fila de lista) · completa (detalle) · el DESVÍO
              de alerta (entrega fallida) · el desvío NEUTRO (cancelado).
              La escalera de la izquierda usa la voz del NEGOCIO y la de
              abajo la de la FAMILIA — el mismo hecho, dos audiencias:
              es la decisión ② de la pieza, hecha visible. */}
          <View style={{ gap: spacing[6] }}>
            <View style={{ gap: spacing[2] }}>
              <Texto variante="apoyo">compacta · voz del negocio</Texto>
              <EscaleraEstados
                registro="compacta"
                acento="oficio"
                pasos={[
                  { clave: 'preparado', etiqueta: 'Preparado', estado: 'hecho' },
                  { clave: 'empacado', etiqueta: 'Empacado', estado: 'actual' },
                  { clave: 'despachado', etiqueta: 'Despachado', estado: 'pendiente' },
                  { clave: 'entregado', etiqueta: 'Entregado', estado: 'pendiente' },
                ]}
              />
            </View>


            <View style={{ gap: spacing[2] }}>
              <Texto variante="apoyo">compacta · voz de la familia · SIN ícono (el nodo degrada a punto)</Texto>
              <EscaleraEstados
                registro="compacta"
                pasos={[
                  { clave: 'confirmado', etiqueta: 'Confirmado', estado: 'hecho' },
                  { clave: 'preparando', etiqueta: 'Estamos preparando tu pedido', estado: 'actual' },
                  { clave: 'en_camino', etiqueta: 'En camino', estado: 'pendiente' },
                  { clave: 'entregado', etiqueta: 'Entregado', estado: 'pendiente' },
                ]}
              />
            </View>

            <View style={{ gap: spacing[2] }}>
              <Texto variante="apoyo">completa · el detalle, con dato de máquina</Texto>
              <EscaleraEstados
                acento="oficio"
                pasos={[
                  { clave: 'preparado', etiqueta: 'Preparado', estado: 'hecho', detalle: '09:12' },
                  { clave: 'empacado', etiqueta: 'Empacado', estado: 'hecho', detalle: 'lote a-33 · 4.2 kg' },
                  { clave: 'despachado', etiqueta: 'Despachado', estado: 'actual', detalle: '11:40' },
                  { clave: 'entregado', etiqueta: 'Entregado', estado: 'pendiente' },
                ]}
              />
            </View>

            <View style={{ gap: spacing[2] }}>
              <Texto variante="apoyo">completa · desvío de ALERTA — el camino se cortó</Texto>
              <EscaleraEstados
                pasos={[
                  { clave: 'confirmado', etiqueta: 'Confirmado', estado: 'hecho', detalle: '09:12' },
                  { clave: 'preparando', etiqueta: 'Preparado', estado: 'hecho', detalle: '10:05' },
                  { clave: 'en_camino', etiqueta: 'En camino', estado: 'hecho', detalle: '11:40' },
                  { clave: 'entregado', etiqueta: 'Entregado', estado: 'pendiente' },
                ]}
                desvio={{
                  etiqueta: 'No había nadie en la dirección',
                  detalle: 'Te escribimos para coordinar otro día.',
                  tono: 'alerta',
                }}
              />
            </View>

            <View style={{ gap: spacing[2] }}>
              <Texto variante="apoyo">completa · desvío NEUTRO — apagado no dice error</Texto>
              <EscaleraEstados
                pasos={[
                  { clave: 'confirmado', etiqueta: 'Confirmado', estado: 'hecho', detalle: '09:12' },
                  { clave: 'preparando', etiqueta: 'Preparando', estado: 'pendiente' },
                  { clave: 'en_camino', etiqueta: 'En camino', estado: 'pendiente' },
                  { clave: 'entregado', etiqueta: 'Entregado', estado: 'pendiente' },
                ]}
                desvio={{ etiqueta: 'Cancelaste este pedido' }}
              />
            </View>
          </View>
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
        <Seccion titulo="Tinta — superficie oscura constante (bg.tinta). ⚠️ NO es el techo del prestador: ese muro es tealDark desde S61-B12">
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
        {/* S84-B7 — LA FICHA DEL PRESTADOR. Va a la galería como CATÁLOGO,
            no como ruta de verificación: la enmienda de método (2-ago-2026)
            manda que lo nuevo viaje DIRECTO a su lugar —y esta pieza ya va
            a la vitrina de C—, pero R17 sigue exigiendo que toda pieza
            exportada se pueda MIRAR. Son dos reglas distintas y ninguna
            derogó a la otra: una dice dónde se verifica, la otra que nada
            exportado quede sin poder firmarse. */}
        <Seccion titulo="FichaPrestador — la vitrina del negocio, UNA sola vez (cliente + espejo). Los tres casos: completo · sin fotos · sin historia">
          <View style={{ gap: spacing[5] }}>
            <Texto variante="seccion">S91-B · LA VOZ DEL NOMBRE — las dos variantes al gate</Texto>
            <Texto variante="apoyo">
              Las dos van con `aSangre` (la portada llega al techo y lo que flota respeta la safe area).
              ⚠️ La franja blanca que el founder vio NO nace en esta pieza: la pone el consumidor con su
              `Encabezado` encima. La pieza gana la CAPACIDAD de vivir en el techo; el consumidor retira
              su encabezado. Las dos mitades, o no funciona — y ésa es la parte que C verifica.
            </Texto>
            <Texto variante="apoyo">(a) el nombre BAJA al bloque de identidad · sobre la imagen, solo lo que flote:</Texto>
            <View style={{ borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: theme.border.default }}>
              <FichaPrestador
                aSangre
                vozNombre="bloque"
                nombre="Paseos Andrés"
                cohorte="fundador"
                cohorteAnio={2026}
                ciudad="Quito"
                portadas={['https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800']}
                sobrePortada={<Icono nombre="cuenta" tamano={24} />}
                servicios={['Paseo']}
              />
            </View>
            <Texto variante="apoyo">(b) el nombre SOBRE la imagen con degradado inferior (y entonces NO se repite abajo):</Texto>
            <View style={{ borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: theme.border.default }}>
              <FichaPrestador
                aSangre
                vozNombre="sobrePortada"
                nombre="Paseos Andrés"
                cohorte="fundador"
                cohorteAnio={2026}
                ciudad="Quito"
                portadas={['https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800']}
                sobrePortada={<Icono nombre="cuenta" tamano={24} />}
                servicios={['Paseo']}
              />
            </View>
            <View style={{ borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: theme.border.default }}>
              <FichaPrestador
                nombre="Paseos Andrés"
                cohorte="fundador"
                cohorteAnio={2026}
                ciudad="Quito"
                historia="Paseos tranquilos por el norte, grupos chicos y reporte con fotos."
                servicios={['Paseo', 'Guardería']}
                zonaLat={-0.1807}
                zonaLon={-78.4678}
                zonaRadioM={500}
                pie={<Texto variante="apoyo">así se va a ver tu ficha en la app</Texto>}
              />
            </View>
            <Texto variante="apoyo">
              LA ZONA (S84-B16): círculo de 500 m, SIN PIN y SIN interacción. El centro viene DESPLAZADO
              del motor (D-624) — un pin diría "acá está", que es lo único que la zona no afirma. En web
              se ve el placeholder; el círculo se ve en el teléfono.
            </Texto>
            <MapaZona lat={-0.1807} lon={-78.4678} radioM={500} />
            <Texto variante="apoyo">
              SIN FOTOS · con handler = EL ESPEJO: una invitación con su CTA, jamás cuatro tarjetas de
              ausencia.
            </Texto>
            <View style={{ borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: theme.border.default }}>
              <FichaPrestador
                nombre="Clínica Aurora"
                ciudad="Quito"
                historia="Atención general y vacunación."
                servicios={['Consulta']}
                onAgregarFotos={() => undefined}
              />
            </View>
            <Texto variante="apoyo">
              SIN HISTORIA y SIN FOTOS · sin handler = LA FAMILIA: la portada NO se monta y la línea de
              historia NO se pinta. Si ahí no vería nada, ahí no hay nada — jamás un "Sin oficio".
            </Texto>
            <View style={{ borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: theme.border.default }}>
              <FichaPrestador nombre="Satori" ciudad="Guayaquil" servicios={['Grooming']} />
            </View>
          </View>
        </Seccion>

        <Seccion titulo="Campo — N11′: la etiqueta va AFUERA y ARRIBA (tocá para ver el foco; nada se anima al tipear)">
          <Texto variante="apoyo">
            S100-B · la etiqueta salió de la caja (⏪ S99 la había metido adentro). Mirá
            las tres cosas que la ley pide y que acá se pueden ver juntas: el rótulo
            NO cambia de tamaño al enfocar ni al llenarse · el placeholder enseña el
            FORMATO en vez de repetir el rótulo · y el aire de 8 contra el pie de 26
            deja a cada etiqueta inequívocamente más cerca de SU caja que de la de arriba.
          </Texto>
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
            {/* N11′ · LA ÚNICA EXENCIÓN. Va en la galería porque una prop sin
                muestra no se puede firmar — y porque su riesgo es que se use
                fuera de búsqueda para «ganar altura». Verla al lado de los de
                arriba muestra por qué no: es el único que puede prescindir del
                rótulo, y solo porque la lupa ya lo dice. */}
            <Texto variante="apoyo">
              N11′ · la exención de BÚSQUEDA — lupa + placeholder, sin etiqueta.
              El `label` sigue siendo obligatorio y lo oye el lector de pantalla:
              lo que se apaga es el píxel, jamás el nombre.
            </Texto>
            <Campo
              label="Buscar"
              etiquetaVisible={false}
              placeholder="Buscar en la despensa"
              iconoIzq={<View style={{ width: 16, height: 16, borderRadius: radius.full, borderWidth: 2, borderColor: theme.text.tertiary }} />}
            />
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

        {/* CampoCodigo — S88-B, lámina firmada */}
        <Seccion titulo="CampoCodigo — las cajas por dígito (UN input invisible: tocá y tipeá; pegá el código entero; el largo lo declara el consumidor)">
          <View style={{ gap: spacing[4] }}>
            <ThemeProvider defaultMode="light">
              <PanelTema etiqueta="claro — vacío (tocá para el foco) · con dígitos · error (borde danger, sin gritar) · deshabilitado">
                <EjemploCampoCodigo />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="dark">
              <PanelTema etiqueta="oscuro — cajas en bg.elevated, mismo contrato">
                <EjemploCampoCodigo soloVivo />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="memorial">
              <PanelTema etiqueta="memorial — sin degradación especial: no hay celebración que apagar">
                <EjemploCampoCodigo soloVivo />
              </PanelTema>
            </ThemeProvider>
          </View>
        </Seccion>

        {/* Celda — B3.4 */}
        <Seccion titulo="🔴 Celda A SU ANCHO REAL — la anatomía que rompió con «Z…» (S97+)">
          {/* ESTA MUESTRA EXISTE PORQUE LA GALERIA NO CAZO EL PEOR
              DEFECTO DE LA JORNADA. El nombre de la mascota truncaba a
              «Z…» —UNA letra— en el HOY del prestador, y aca la `Celda`
              se veia perfecta: se montaba **a ancho de viewport**, cuando
              en produccion vive con la columna de la hora al lado
              (`width: 46` + gap) ⇒ ~340 px, no 420.

              La leccion es de C, midiendo su propio instrumento: *el
              ancho de la captura es un parametro que DECIDE QUE SE PUEDE
              ENCONTRAR* — y el que no se elige midiendo, se hereda.

              ⇒ Se monta el ancho REAL y la anatomia CARGADA: la derecha
              con `metadataMono` + un `fin` de dos chips y un glifo, que
              es contenido de ancho intrinseco y NO cede. Los dos casos
              medidos del censo estan aca: el del HOY (1 chip + 1 glifo) y
              el de `veterinaria/consulta` (2 chips + 1 glifo), que es
              **mas cargado que el que rompio y no lo miro nadie.** */}
          <View style={{ gap: spacing[3] }}>
            <Texto variante="apoyo">
              340 px — el ancho que deja la columna de la hora en el HOY. Los nombres tienen que
              leerse enteros.
            </Texto>
            {([
              { t: 'Zeus', s: 'Vacunación', chips: 1 },
              { t: 'Thor', s: 'Consulta general', chips: 2 },
            ] as const).map((c) => (
              <View key={c.t} style={{ width: 340, borderWidth: 1, borderColor: theme.border.default, borderRadius: radius.md }}>
                <Celda
                  interactiva
                  onPress={() => {}}
                  accessibilityRole="button"
                  titulo={c.t}
                  subtitulo={c.s}
                  metadataMono="15 min"
                  fin={
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1.5] }}>
                      <Icono nombre="veterinaria" registro="aa" tamano={21} />
                      <Insignia estado="info" etiqueta="Mostrador" tamaño="sm" />
                      {c.chips > 1 ? <Insignia estado="alDia" etiqueta="Confirmada" tamaño="sm" /> : null}
                    </View>
                  }
                />
              </View>
            ))}
          </View>
        </Seccion>

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
              {/* S99-B · EL PAR QUE PRUEBA LA PERILLA: el MISMO nombre de
                  producto con y sin `tituloEntero`. Montado en par a
                  propósito — el defecto es la comparación, y una sola de
                  las dos filas no lo muestra. */}
              <Celda
                titulo="Pro Pac Ultimates Adulto Pollo y Arroz 15 kg"
                subtitulo="SIN tituloEntero — el nombre se corta justo donde se decide"
                metadataMono="$ 62,40"
              />
              <Separador indentacion={spacing[3]} />
              <Celda
                tituloEntero
                titulo="Pro Pac Ultimates Adulto Pollo y Arroz 15 kg"
                subtitulo="CON tituloEntero — la fila crece; ALTURA_MIN siempre fue un mínimo"
                metadataMono="$ 62,40"
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

        {/* 🔴 S98-B · EL ÚNICO PAR QUE DESTAPÓ EL BARRIDO DE LAS CASAS DE
            OFICIO — montado para que se pueda MIRAR, no solo leer su
            número. Las iniciales de la capa `comunidadAmplia` sobre su
            tinte, en el fondo BASE del prestador oscuro: **4.40 contra un
            mínimo de 4.5**, corto por 0.10.
            La causa está medida: el oficio pisa `bg.base` y nada más —
            por eso el mismo par sobre TARJETA da idéntico en las dos
            casas (4.63) y solo el de fondo diverge (`tapizDark` violáceo
            contra `tapizDarkOficio` verdoso). No es un token mal elegido:
            es un violeta sobre un fondo que dejó de ser violáceo.
            EXENTO POR MEDICIÓN, no por decisión: la capa tiene CERO
            consumidores fuera de esta galería, y la exención de
            `verify-contrast` cae sola el día que alguien la monte. */}
        <Seccion titulo="🔴 D-813bis · el par de 4.40 del prestador oscuro (exento por medición)">
          <View style={{ gap: spacing[3] }}>
            <ThemeProvider defaultMode="dark" cta="oficio">
              <PanelTema etiqueta="PRESTADOR oscuro — capa comunidadAmplia sobre bg.base: 4.40:1 (mín 4.5)">
                <View style={{ flexDirection: 'row', gap: spacing[4], alignItems: 'center' }}>
                  <AvatarMascota nombre="Violeta" capa="comunidadAmplia" tamano="md" />
                  <AvatarMascota nombre="Nube" capa="comunidadAmplia" tamano="lg" />
                </View>
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="dark">
              <PanelTema etiqueta="cliente oscuro — el MISMO par: 4.83:1. La diferencia es el tapiz, no el token">
                <View style={{ flexDirection: 'row', gap: spacing[4], alignItems: 'center' }}>
                  <AvatarMascota nombre="Violeta" capa="comunidadAmplia" tamano="md" />
                  <AvatarMascota nombre="Nube" capa="comunidadAmplia" tamano="lg" />
                </View>
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
            {/* ⏪ S98-B · LA ETIQUETA DE ESTE PANEL DECÍA «borde 1.5
                capa.identidad + tint capaBg», que es el comportamiento de
                S45 — DEROGADO dos veces desde entonces (S91 movió la
                elección a `accent.control`, y D-813 mueve el tinte a
                `accent.controlBg`). *La prosa derivada decae mientras el
                objeto no, y acá decaía adentro del instrumento que
                verifica.* */}
            <ThemeProvider defaultMode="light">
              <PanelTema etiqueta="cliente claro — elegida: borde accent.control (magentaDark) + tinte accent.controlBg">
                <EjemploSelectorEspecie />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="dark">
              <PanelTema etiqueta="cliente dark — mismos slots, registros del tema">
                <EjemploSelectorEspecie />
              </PanelTema>
            </ThemeProvider>
            {/* 🔴 S98-B (D-813) · LA CASA QUE FALTABA, Y SU AUSENCIA ERA LA
                CAUSA DE QUE EL DEFECTO NO TUVIERA SÍNTOMA.
                Esta pieza tenía tres paneles —claro, dark, memorial— y los
                tres del CLIENTE, la única casa donde `accent.control` y el
                tinte COINCIDEN. El prestador elegía con **borde teal y
                relleno magenta** y ninguna galería lo mostraba: no porque
                el espécimen estuviera mal montado, sino porque el
                espécimen de esa casa NO EXISTÍA.
                ⇒ *Una galería prueba las combinaciones que monta. La que
                no monta no da verde ni rojo: no dice nada.*
                Lo que hay que mirar acá: el borde y el relleno tienen que
                ser de LA MISMA familia. Si se ven de dos colores, D-813
                volvió. */}
            <ThemeProvider defaultMode="light" cta="oficio">
              <PanelTema etiqueta="🔴 PRESTADOR claro (D-813) — borde y tinte, LA MISMA familia: tealDark + tealAlpha16">
                <EjemploSelectorEspecie />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="dark" cta="oficio">
              <PanelTema etiqueta="🔴 PRESTADOR dark (D-813) — teal puro + tealAlpha15">
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

        {/* S101-C · LA ESPERA DEL PAGO — la rampa que trabaja. */}
        <Seccion titulo="EsperaDeTrabajo S101-C — la espera del pago en las DOS puertas (despensa y servicios). El segmento NO CRECE: VIAJA — una barra de progreso afirma cuánto falta, y el tiempo lo tiene el proveedor. Memorial y reduce-motion: quieta y centrada.">
          <View style={{ gap: spacing[4] }}>
            <ThemeProvider defaultMode="light">
              <PanelTema etiqueta="claro — la rampa de la firma cruzando (~1,6 s, easeInOut de la casa)">
                <EsperaDeTrabajo />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="dark">
              <PanelTema etiqueta="oscuro — la rampa vívida sobre la pista hundida">
                <EsperaDeTrabajo />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="memorial">
              <PanelTema etiqueta="memorial — QUIETA y en tinta: nada respira en memorial (§2.8)">
                <EsperaDeTrabajo />
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
                <Texto variante="apoyo">
                  ⭐ ENCUADRE `vitrina` (S85-B25, firma del founder) — a sangre, EN BUCLE
                  AUTOMÁTICO, SIN CONTROLES y MUDO. Su literal: «es espacio de PUBLICIDAD, no de
                  reproducción». Un clip que pide play compite por una decisión que la familia no
                  vino a tomar; uno que corre solo AMBIENTA. Se llamaba `lamina` y solo cambiaba el
                  marco: el cambio es de NATURALEZA, así que el nombre cambió con él. El mute no es
                  preferencia — un autoplay con sonido en una vitrina hace cerrar la app. En
                  `tarjeta` el «jamás autoplay» sigue rigiendo: ahí el play es consecuencia de un
                  gesto.
                </Texto>
                <View style={{ height: 180 }}>
                  <ClipSesion uri="https://example.invalid/clip.mp4" encuadre="vitrina" />
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

        {/* HojaCaptura — S99-B: la puerta única de «¿de dónde sale esta foto?» */}
        <Seccion titulo="HojaCaptura — la puerta única de la foto (dos acciones, y son todas)">
          <View style={{ gap: spacing[4] }}>
            <ThemeProvider defaultMode="light">
              <PanelTema etiqueta="claro — dos Boton secundario bloque + la X. NO hay tercera fila: la Hoja ya sale por X, swipe y back">
                <EjemploHojaCaptura />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="dark">
              <PanelTema etiqueta="dark — misma anatomía">
                <EjemploHojaCaptura />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="memorial">
              <PanelTema etiqueta="memorial — la Hoja degrada sola (fades suaves, nada rebota)">
                <EjemploHojaCaptura />
              </PanelTema>
            </ThemeProvider>
          </View>
          <Texto variante="dato">
            ⚠️ Los dos botones abren el picker DEL SISTEMA al tocarse. La anatomía se mira con la hoja abierta;
            tocar dispara permisos. (Misma clase que la exención de EvidenciaFoto.Capturar en R17 — acá la pieza SÍ
            se monta porque su forma se ve sin tocarla.)
          </Texto>
        </Seccion>

        {/* PuertaHermana — S99-B: el espejo entre las dos ventanas del HOY */}
        <Seccion titulo="PuertaHermana — la puerta entre dos ventanas hermanas (el espejo ES la pieza)">
          <View style={{ gap: spacing[4] }}>
            {(['light', 'dark', 'memorial'] as const).map((modo) => (
              <ThemeProvider key={modo} defaultMode={modo}>
                <PanelTema
                  etiqueta={
                    modo === 'light'
                      ? 'claro — las DOS montadas juntas: la de ida se apoya a la derecha, la de vuelta a la izquierda'
                      : `${modo} — mismo trazo, mismo alto, mismo aire`
                  }
                >
                  <View style={{ gap: spacing[2] }}>
                    {/* CON contador — el par espejado: el número va pegado a
                        la etiqueta, del lado del chevron, y ese lado lo
                        deriva `direccion`. */}
                    <PuertaHermana
                      etiqueta="Tus pedidos de hoy"
                      direccion="derecha"
                      sinVer={3}
                      onPress={() => {}}
                    />
                    <PuertaHermana
                      etiqueta="Tus citas de hoy"
                      direccion="izquierda"
                      sinVer={12}
                      onPress={() => {}}
                    />
                    {/* EN CERO — la regla de existencia se MONTA, no se
                        describe: una galería solo prueba lo que muestra
                        (la lección de D-813). */}
                    <PuertaHermana
                      etiqueta="Tus pedidos de hoy"
                      direccion="derecha"
                      sinVer={0}
                      onPress={() => {}}
                    />
                  </View>
                </PanelTema>
              </ThemeProvider>
            ))}
          </View>
          <Texto variante="dato">
            El contador cuenta lo NO VISTO (firma de mesa S99) en mono tabular primary: la jerarquía sale del
            registro tipográfico, no de pintura — cero acento, cero caja, cero animación. Con 0 no se dibuja nada,
            y de ahí sale que el número vaya SOLO: un total estaría siempre, éste aparece y desaparece, así que LA
            APARICIÓN ES EL SIGNIFICADO. La palabra «sin ver» vive en el label del tocable, donde no cuesta ancho.
            Sin estado deshabilitado por decisión: apagar la puerta dejaría a alguien sin llegar a su ventana justo
            el día que no tiene trabajo (Ley 23 — un día vacío no rechaza nada). Si se monta o no es del consumidor:
            es composición por capacidad.
          </Texto>
        </Seccion>


        {/* PinEnMapa — S99-B · N14: quién se está moviendo, en el mapa */}
        <Seccion titulo="PinEnMapa — quién se está moviendo (el punto de la casa, que crece para sostener una cara)">
          <View style={{ gap: spacing[4] }}>
            <ThemeProvider defaultMode="light">
              <PanelTema etiqueta="claro — anillo blanco + elevacion.reposo; la cara sale de la escalera §2.11">
                <EjemploPinEnMapa />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="dark">
              <PanelTema etiqueta="dark — el anillo blanco NO cambia: separa del mapa, que no tiene tema">
                <EjemploPinEnMapa />
              </PanelTema>
            </ThemeProvider>
            <ThemeProvider defaultMode="memorial">
              <PanelTema etiqueta="memorial — SALTA, no viaja (misma degradación que reduce-motion)">
                <EjemploPinEnMapa />
              </PanelTema>
            </ThemeProvider>
          </View>
          <Texto variante="dato">
            🔴 La variante `moto` NO está: el registry tiene 46 glifos y ninguno es moto/repartidor/entrega.
            Dibujar uno acá saltearía §6b (hoja de contacto + gate POR ÍCONO del founder).
          </Texto>
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

        <Seccion titulo="Encabezado · el buscador EN LA FILA, y el título que se apaga (S100b · G-04)">
          <View style={{ gap: spacing[4] }}>
            <View style={{ borderWidth: 1, borderColor: theme.border.default, borderRadius: radius.md, overflow: 'hidden' }}>
              <Encabezado
                variante="portada"
                saludo="Despensa"
                busqueda={
                  <Campo
                    label="Buscar"
                    etiquetaVisible={false}
                    placeholder="Nombre o marca"
                    value=""
                    onChangeText={() => {}}
                  />
                }
                accionDer={
                  <Pressable accessibilityRole="button" accessibilityLabel="Carrito, 3 productos" onPress={() => {}}>
                    <GlifoConContador nombre="carrito" cuenta={3} dentroDeTocable />
                  </Pressable>
                }
              />
            </View>
            <View style={{ borderWidth: 1, borderColor: theme.border.default, borderRadius: radius.md, overflow: 'hidden' }}>
              <Encabezado variante="navegacion" titulo="Adulto Cordero y Arroz" atras onAtras={() => {}} tituloVisible={false} />
            </View>
            <Texto variante="apoyo">
              Arriba: el buscador y el carrito viven en la MISMA fila que el isotipo, como en la
              referencia — y el nombre de la pantalla deja de gastar 41.6 dp para decir lo que la tab
              acaba de decir con su huella encendida. El nombre NO muere: sigue anunciándose como
              header para el lector. Es el patrón de Campo.etiquetaVisible: se apaga el píxel, jamás
              el nombre.
              Abajo: el mismo apagado en la ficha, donde el header repetía el nombre del producto que
              N19 ya ordena en el cuerpo. Dos veces el mismo dato en la misma pantalla.
              ⚠️ Esto NO es un header que colapsa al scrollear: ese patrón es otro y no está
              construido. Apagarlo fijo cuesta el contexto cuando bajaste mucho, y se declara.
            </Texto>
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
            {/* S99-B · PORTADA **CON VUELTA** — el caso que no era
                expresable: un MUNDO al que se entra desde otro («Tu
                tienda», desde HOY). El isotipo preside y la vuelta vive
                en su propia fila, en el mismo punto de la pantalla que en
                `navegacion`. */}
            <View style={{ borderWidth: 1, borderColor: theme.border.default, borderRadius: radius.md, overflow: 'hidden' }}>
              <Encabezado
                variante="portada"
                atras
                onAtras={() => {}}
                isotipo="gradiente"
                saludo="Tu tienda"
              />
            </View>
          </View>
        </Seccion>

        {/* BarraTabs — B3.7 */}
        <Seccion titulo="Badge (S88) — el contador de novedades sobre un ícono (extraído de BarraTabs; la campana es su 2º consumidor)">
          <EjemploBadge />
        </Seccion>

        <Seccion titulo="BarraTabs (S97+) — el destino CENTRAL y la composicion por capacidad">
          {/* LOS CINCO CASOS JUNTOS, porque la comparacion ES la ley: la
              barra tiene que leerse igual con 5, con 3 y con 2, y el
              centro de una de 4 cae ENTRE dos items. La pieza no elige
              cual destacar ni cuantas tabs hay — las compone quien sabe
              que puede cada quien.
              El toggle enciende la CANDIDATA §5.4 (overshoot 280 ms), que
              nace apagada: su gate es del founder, en dispositivo. */}
          <MuestraBarraPorCapacidad />
        </Seccion>

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
