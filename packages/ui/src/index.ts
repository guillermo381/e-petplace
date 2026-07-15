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
export { Campo, type CampoProps } from './components/Campo'
export {
  CampoFecha,
  type CampoFechaProps,
  type CampoFechaValor,
  type CampoFechaPrecision,
} from './components/CampoFecha'
export { Celda, type CeldaProps, type CeldaDensidad } from './components/Celda'
export { CeldaNavegacion, type CeldaNavegacionProps } from './components/CeldaNavegacion'
export { Separador } from './components/Separador'
export {
  Insignia,
  type InsigniaProps,
  type InsigniaEstado,
  type InsigniaCapa,
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
} from './components/MapaRecorrido.tipos'
export { AvisoProvider, useAviso, type AvisoInput, type AvisoVariante } from './components/Aviso'
export { EstadoVacio } from './components/EstadoVacio'
export { epetplaceFonts } from './fonts'
export { Isotipo, type IsotipoVariant } from './brand/Isotipo'
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
export { EsperaDeMarca } from './brand/EsperaDeMarca'
