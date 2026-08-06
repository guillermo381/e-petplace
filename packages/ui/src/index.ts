// @epetplace/ui — design system e-PetPlace v4.
// REGLA DE ORO: ningún componente escribe un color, tamaño o sombra
// hardcodeado. Si no está acá, no existe en el producto.

export { palette, gradients, type GradientToken } from './tokens/palette'
export { typography, type TypeSizeKey } from './tokens/typography'
export { spacing, type SpacingKey } from './tokens/spacing'
export { radius, type RadiusKey } from './tokens/radius'
export { shadows, type ShadowToken } from './tokens/shadows'
export { elevacion, type ElevacionNivel, type ElevacionTokens } from './tokens/elevacion'
export { motion } from './tokens/motion'
export { dosis, type DosisKey, type DosisNivel } from './tokens/dosis'

export {
  lightTheme,
  darkTheme,
  memorialTheme,
  getTheme,
  type Theme,
  type ThemeMode,
  type ServiceKey,
  type StatusKey,
  type CapaKey,
} from './themes'

export { opacity } from './tokens/opacity'
export { ThemeProvider, useTheme } from './ThemeProvider'
export { Boton, type BotonProps, type BotonVariante, type BotonTamaño } from './components/Boton'
export {
  Tarjeta,
  type TarjetaProps,
  type TarjetaTinte,
  type TarjetaElevacion,
  type TarjetaRelleno,
} from './components/Tarjeta'
export {
  TarjetaEstado,
  type TarjetaEstadoProps,
  type TarjetaEstadoRol,
} from './components/TarjetaEstado'
// S83-B1 — el pie como pieza: lo monta el CONTROL COMPUESTO cuando un
// `Campo` viaja con hermanos en una fila (`sinPie`). Vive dentro de
// Campo.tsx por el precedente de HojaScroll: es SU anatomía.
// ⚠️ EL COMENTARIO VA ACÁ, FUERA DE LAS LLAVES, y no es estilo: R17 parte
// el bloque por comas y un comentario ADENTRO se pega al nombre que le
// sigue, que entonces deja de parecer un identificador y ESCAPA del gate
// en silencio (medido: PieDeCampo era el único que escapaba). R17 se
// endureció en la misma tanda, pero la forma correcta se conserva igual.
export { Campo, type CampoProps, PieDeCampo, type PieDeCampoProps, ALTO_PIE_CAMPO } from './components/Campo'
export { CampoCodigo, type CampoCodigoProps } from './components/CampoCodigo'
export { Badge, type BadgeProps, useEtiquetaBadge } from './components/Badge'
export {
  CampoFecha,
  type CampoFechaProps,
  type CampoFechaValor,
  type CampoFechaPrecision,
} from './components/CampoFecha'
export { Celda, type CeldaProps, type CeldaDensidad } from './components/Celda'
export { CeldaNavegacion, type CeldaNavegacionProps } from './components/CeldaNavegacion'
export { Separador } from './components/Separador'
export { Texto, type TextoProps, type TextoVariante, type TextoColor } from './components/Texto'
export { FilaDato, type FilaDatoProps } from './components/FilaDato'
export { PieRevelar, type PieRevelarProps } from './components/PieRevelar'
export { LogoNegocio, type LogoNegocioProps } from './components/LogoNegocio'
// S84-B7 — la vitrina del negocio, UNA sola vez (cliente + espejo).
// S84-B16 — la ZONA (círculo sin pin, no interactivo). Variante .web.
export { MapaZona, type MapaZonaProps } from './components/MapaZona'
export { FichaPrestador, type FichaPrestadorProps, RADIO_PORTADA_EN_TARJETA } from './components/FichaPrestador'
// FilaCita — S80-B12 Parte 3 (dominio: la fila de cita con su canto ADENTRO;
// cero API de color/posición/alfa — el molde de "cero genéricos")
export { FilaCita, type FilaCitaProps, type FilaCitaOficio } from './components/FilaCita'
// CantoMarca — S81-B (promoción del Svg local S81-C; §9.1 dos cantos dos
// voces: MARCA = rampa turquesa→magenta, cinco sitios firmados en el censo)
export { CantoMarca } from './components/CantoMarca'
// Entrada — S81-B: el portador de §5 LA ENTRADA (45/300/translateY 15
// ADENTRO; la pantalla declara QUE entra y su orden de lectura, jamás
// los números — patrón FilaCita)
export { Entrada, type EntradaProps } from './components/Entrada'
// EvitaTeclado — S81 (D-498): la casa tiene UNA (subió del prestador S73-B)
export { EvitaTeclado } from './components/EvitaTeclado'
export {
  Insignia,
  type InsigniaProps,
  type InsigniaEstado,
  type InsigniaCapa,
  type InsigniaDistincion,
  type InsigniaTamaño,
} from './components/Insignia'
export { Encabezado, type EncabezadoProps } from './components/Encabezado'
export { HeroMarca, type HeroMarcaProps, type HeroMarcaVariante } from './components/HeroMarca'
export { BarraTabs, type BarraTabsItem } from './components/BarraTabs'
export { Hoja, HojaScroll, type HojaProps, type HojaAltura, type HojaScrollProps } from './components/Hoja'
export { CitaEnVivo, type CitaEnVivoProps, type CitaEnVivoCapa } from './components/CitaEnVivo'
export { Esqueleto, EsqueletoGrupo, type EsqueletoProps, type EsqueletoForma } from './components/Esqueleto'
export {
  AvatarMascota,
  type AvatarMascotaProps,
  type AvatarMascotaTamano,
  type AvatarMascotaCapa,
  type AvatarMascotaEspecie,
} from './components/AvatarMascota'
export {
  SelectorEspecie,
  type SelectorEspecieProps,
  type SelectorEspecieOpcion,
} from './components/SelectorEspecie'
export {
  SelectorAvatar,
  type SelectorAvatarProps,
  type SelectorAvatarFoto,
} from './components/SelectorAvatar'
export {
  SelectorOpcion,
  type SelectorOpcionProps,
  type SelectorOpcionItem,
} from './components/SelectorOpcion'
export {
  SelectorSegmentado,
  type SelectorSegmentadoProps,
  type SelectorSegmentadoItem,
} from './components/SelectorSegmentado'
export { SliderPrecio, type SliderPrecioProps } from './components/SliderPrecio'
export { Interruptor, type InterruptorProps } from './components/Interruptor'
export { StepperCantidad, type StepperCantidadProps } from './components/StepperCantidad'
export { VisorFoto, type VisorFotoProps } from './components/VisorFoto'
export { FichaVacuna, type FichaVacunaProps } from './components/FichaVacuna'
export {
  LineaDeVida,
  LineaDeVidaNodo,
  type LineaDeVidaProps,
  type LineaDeVidaItem,
  type LineaDeVidaEstadoPie,
} from './components/LineaDeVida'
export {
  capturarConCamara,
  capturarDeGaleria,
  type FotoCapturada,
  type ResultadoCaptura,
  type OpcionesCaptura,
  // S84-B14 — la gemela de VIDEO (el clip de la vitrina). Angosta a
  // propósito: ver el porqué de gemela-y-no-prop en su archivo.
  capturarVideoDeGaleria,
  type VideoCapturado,
  type ResultadoCapturaVideo,
} from './components/capturaFoto'
// S61-B10 (L-137 3ª enmienda): la frontera dual-forma de lectura de
// archivos locales — de TODAS las apps, jamás cura local por-caller
export { leerBytes, leerBase64, uriLegible } from './components/leer-archivo'
export { usePresionado } from './components/usePresionado'
export { Cronometro, type CronometroProps } from './components/Cronometro'
export {
  EvidenciaFoto,
  EvidenciaFotoCapturar,
  EvidenciaFotoThumbnail,
  type EvidenciaFotoCapturarProps,
  type EvidenciaFotoThumbnailProps,
  type EvidenciaFotoEstado,
} from './components/EvidenciaFoto'
export { MapaRecorrido } from './components/MapaRecorrido'
export {
  type MapaRecorridoProps,
  type MapaRecorridoModo,
  type MapaRecorridoCapa,
  type PuntoLatLng,
  type PuntoTrackMapa,
} from './components/MapaRecorrido.tipos'
export { AvisoProvider, useAviso, type AvisoInput, type AvisoVariante } from './components/Aviso'
export { EstadoVacio } from './components/EstadoVacio'
export { epetplaceFonts } from './fonts'
export { Isotipo, type IsotipoVariant } from './brand/Isotipo'
// S82-B r10 — el papel tapiz: pieza del FONDO compartido (el número del
// alfa vive UNA vez; el montaje lo hace ThemeProvider marcaDeAgua).
export { MarcaDeAgua } from './brand/MarcaDeAgua'
export { Atmosfera, type AtmosferaProps, type OrigenAtmosfera } from './brand/Atmosfera'
export { TokenGallery } from './gallery/TokenGallery'

// Namespace i18n del design system (S51-B1a): la voz de los componentes
// nace bilingüe ACÁ; las apps registran recursosUi al inicializar el riel.
export { recursosUi, useTraduccionUi } from './i18n'

// FichaMascotaHogar — S51-B2.2 (Ley 11, espec gateada por founder)
export {
  FichaMascotaHogar,
  type FichaMascotaHogarProps,
  type FichaMascotaHogarVoz,
  type FichaMascotaHogarAccion,
} from './components/FichaMascotaHogar'

// Lenguaje b′ — DIRECCION_ARTE v1.0 (S53): la mascota presente en cada ícono
export { Huella, HUELLA_BOX } from './brand/Huella'
export { Icono, type IconoNombre, type IconoRegistro } from './components/Icono'
export { Guijarro, type GuijarroCapa } from './brand/Guijarro'
export { BarrasSemana, type BarrasSemanaCapa } from './components/BarrasSemana'
// ClipSesion — S63 (Ley 11, espec aprobada por el arquitecto): el clip
// corto de la sesión de adiestramiento; poster + tap-para-reproducir,
// JAMÁS autoplay (en memorial menos)
export { ClipSesion, type ClipSesionProps } from './components/ClipSesion'
// VozComision — S68-B (enmienda aditiva declarada): la comisión visible
// donde se pone el precio (7.15) — subió desde sus dos copias
// byte-idénticas de los talleres de paseo y grooming; tercera copia
// prohibida.
export { VozComision, type VozComisionProps } from './components/VozComision'
export { EsperaDeMarca } from './brand/EsperaDeMarca'
// MarcaEleccion — S82 r37: LA PATA que pisa lo elegido. Sube a primitiva
// porque ya marca en TRES controles y una gramática copiada en tres
// archivos no es gramática: son tres coincidencias esperando divergir.
export { MarcaEleccion, PATA, MONTA, type MarcaEleccionProps } from './brand/MarcaEleccion'
// PieReserva — S82-B r35: el pie fijo de una reserva, componente de
// DOMINIO. Sube porque sus dos copias a mano habían perdido el PRECIO
// entero (la causa del founder: lo que se copia, diverge).
export { PieReserva, type PieReservaProps } from './components/PieReserva'

// TresNumeros — S85-B26: el bloque de cifras del techo del oficio. Sube a
// la casa porque su anatomía es de sistema (el vidrio del muro, el papel
// pleno, el rótulo que se apaga sin opacidad) y la resolvía la app.
export { TresNumeros, type TresNumerosProps, type ColumnaTecho } from './components/TresNumeros'

// FiltroPills · FiltroMascotas — S85-B7: LOS CHIPS DE FILTRO CON PATA,
// promovidos del cliente por la Regla de las Piezas (apareció el segundo
// consumidor: la portada del prestador). Eran override LOCAL declarado —
// R10 vigilaba su marcador para que nadie los generalizara desde una
// pantalla, y su promoción estaba escrita como trabajo de B post-gate.
// Cada casa las viste con su tema SIN replumbar nada: todo lo cromático
// ya resolvía de slots, y `accent.control` se resuelve por casa (R27).
// SelectorDia — S85-B8: LA RUEDA DE DÍAS (D3), promovida del cliente por
// la Regla de las Piezas (segundo consumidor: el bloque «Tu día» de la
// portada del prestador). Su FÍSICA ESTÁ FIRMADA y no se recalibra —
// los números salieron de un gate en dispositivo y viajaron verbatim.
export { SelectorDia, type SelectorDiaProps, type DiaOpcion } from './components/SelectorDia'

export {
  FiltroPills,
  type FiltroPillsProps,
  FiltroMascotas,
  type FiltroMascotasProps,
  type OpcionFiltro,
} from './components/FiltroPills'
