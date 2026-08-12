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

// ChipEntidad — S91-B (junta D-691): EL CHIP DE ENTIDAD, UNO SOLO EN TODA
// LA CASA. La referencia es la firmada por el founder (el chip de «Mis
// paseos»: avatar + nombre + pata magenta); esta pieza es ESE chip,
// extraído de `FiltroMascotas` —que ahora lo consume— para que D lo use en
// el selector de raza sin clonarlo. Sube el CHIP y no el contenedor a
// propósito: la hilera es horizontal y la grilla de razas no, así que el
// seam correcto es la unidad. `tamano='general'` es el punto que el
// founder pidió que creciera para alta/perfil; `compacto` (default) deja
// intactos a los consumidores vivos.
export {
  ChipEntidad,
  type ChipEntidadProps,
  type ChipEntidadTamano,
  type ChipEntidadSujeto,
} from './components/ChipEntidad'

export {
  FiltroPills,
  type FiltroPillsProps,
  FiltroMascotas,
  type FiltroMascotasProps,
  type OpcionFiltro,
} from './components/FiltroPills'

// sugerencias — S91-B: EL TIPEO PREDICTIVO, la FORMA una sola vez. El
// patrón vivía INLINE en `hogar/bitacora.tsx` desde S65 (probado en
// dispositivo, gate pasado) y el alta de mascota lo necesita para la
// RAZA: se GENERALIZA, no se clona (§6 del método). Lo que sube es el
// MATCHING; el render y la voz quedan en cada casa — la bitácora propone
// chips que se marcan de a muchos, el alta propone UNA raza que llena un
// campo, y un componente habría sido el de la bitácora.
//
// ⚠️ EXENTA DE R17 CON SU RAZÓN, y por eso paga otro gate: esta pieza NO
// TIENE PÍXELES. Montarla en la galería exigiría construirle un tocable
// de ejemplo — o sea CLONAR la interacción, que es exactamente lo que
// R17 prohíbe («una galería que muestra un botón que no es EL botón hace
// firmar algo que no corre»). Es la misma clase que `usePresionado`. Su
// verificación es `scripts/verify-sugerencias.ts`, con el brazo de
// REGRESIÓN sobre el vocabulario vivo: no menos gate, otro gate.
export {
  sugerir,
  coincidenciasPrimero,
  normalizarVoz,
  palabrasDeBusqueda,
  puntajeDeCoincidencia,
  type MatchingDeTexto,
  type ModoDeCoincidencia,
} from './components/sugerencias'

// EscaleraEstados — S96-B: DÓNDE ESTÁ Y CUÁNTO FALTA, sin abrir nada.
// La pieza del recorrido de la despensa, y sirve a las DOS caras: la
// escalera del panel del vendedor (`LETRA_PANEL_VENDEDOR_S96` §2.2) y el
// seguimiento de la familia (`LETRA_RECORRIDO_DESPENSA_S96` §8.1).
//
// Entra al diccionario (Ley 19) con un trabajo que no estaba: "informar
// el progreso de un proceso multi-paso". Dos decisiones declaradas en su
// encabezado y que quien la consuma NO puede deshacer desde la pantalla:
//   ① EL DESVÍO NO ES UN ESCALÓN — "no llegó" interrumpe el camino, no lo
//     avanza; pintarlo como paso 5 de 5 afirma que el pedido llegó.
//   ② CERO DICCIONARIO DE ESTADOS ADENTRO — las etiquetas son de cada
//     casa (§6 del método: se comparte la FORMA, la VOZ no).
export {
  EscaleraEstados,
  ALTO_BARRA_ESCALERA,
  type EscaleraEstadosProps,
  type PasoEscalera,
  type PasoEstado,
  type DesvioEscalera,
} from './components/EscaleraEstados'

// TarjetaPedido — S96-B: UN pedido en una lista, de los DOS lados. La fila
// de la lista Hoy del vendedor (LETRA_PANEL_VENDEDOR_S96 §2.1) y la de
// "Mis pedidos" de la familia (LETRA_RECORRIDO_DESPENSA_S96 §8.1).
//
// UNA PIEZA Y NO DOS, medido: la anatomía de las dos caras es la misma
// (identidad · línea de datos · monto · escalera) y lo único que cambia es
// QUÉ va en cada slot y con qué voz. Por eso los slots son NEUTROS —
// `titulo`, no `nombreContacto`: un slot que nombra el dato de UNA de las
// dos casas es el primer paso de la bifurcación, y la casa ya pagó ese
// precio (los cuatro logs de oficio de S82 nacieron por copia).
//
// 🔴 NO TIENE PROP DE MASCOTA, Y ES EL PUNTO: `LETRA_PANEL_VENDEDOR` §4 y
// `MODELO_DESPENSA` §7.4 prohíben la identidad de la mascota en el panel
// sin excepción. Acá no es disciplina de la pantalla — es el contrato: el
// estado malo es INEXPRESABLE (L-222).
export { TarjetaPedido, type TarjetaPedidoProps } from './components/TarjetaPedido'

// FilaEntrega — S96-B: UNA parada del repartidor (§9.1). Su vara no es la
// del resto de la casa: se lee a pleno sol, arriba de una moto.
//
// 🔴 SU CONTRATO ES LA LEY §9.2 HECHA TIPO: no existe prop de mascota, de
// pedido, de productos ni de monto — "el envío asignado a él y nada más".
// Coincide exactamente con lo que A cerró del otro lado (`EntregaAsignada`
// trae dirección, punto, referencia, instrucciones y teléfono; cero
// mascota, cero pedido) SIN que las dos capas se hayan copiado, y esa
// coincidencia es la prueba de que la línea está bien puesta.
//
// El botón usa `Boton tamaño="lg"` (alto 56) — la escala de la casa YA
// tenía el tamaño de guantes: hacía falta recorrerla, no ensancharla.
export { FilaEntrega, type FilaEntregaProps } from './components/FilaEntrega'

// AvisoAlergia — S96-B: LA ALERGIA ADVIERTE, NO ESCONDE (§5.4, enmienda
// firmada a MODELO_DESPENSA §6 y §10). Exclusión dura en la
// RECOMENDACIÓN, advertencia dura en la BÚSQUEDA.
//
// LOS DOS CANDADOS DE LA LETRA, HECHOS TIPO:
//  ① JAMÁS SILENCIO — `modo` es obligatorio y su unión está cerrada en
//    DOS ('contiene' · 'sinComposicion'). No existe una tercera opción:
//    una pantalla que no sabe NO PUEDE CALLAR, tiene que decir que no
//    sabe. La letra dice por qué: «el silencio se lee como "no tiene
//    pollo", y esa lectura la hace el dueño, no nosotros».
//  ② NO SE APAGA POR UNA PROMOCIÓN — no hay prop para ocultarla ni para
//    bajarle el tono. Quien la monte no tiene por dónde silenciarla.
//
// Los dos modos NO se pintan igual: uno dice «esto le hace mal a Thor» y
// el otro «no lo sabemos». Igualarlos entrena a ignorar el primero.
export { AvisoAlergia, type AvisoAlergiaProps, type ModoAvisoAlergia } from './components/AvisoAlergia'

// SelectorDestinoItem — S96-B: a quién va este producto (§6.3).
//
// EL CHECK DEL MOTOR TIENE SU ESPEJO EN EL TIPO: `chk_destino_excluyente`
// dice una mascota O donación, jamás las dos — y acá `destino` es una
// UNIÓN DISCRIMINADA, no dos campos sueltos. Con `mascotaId` + `donacion`
// separados, «donación para Thor» sería expresable y el rebote llegaría
// del servidor; así NO COMPILA. Un guard protege el dato; el tipo protege
// al que construye la pantalla (L-222).
//
// La donación se dibuja SEPARADA de las caras a propósito: §6.4 le pone
// dos límites duros (jamás entra a un expediente, jamás otorga beneficio
// comercial) y dos naturalezas no comparten hilera — el mismo candado
// gratis que §1 usa para separar Servicios de Venta de productos.
//
// `destino: null` es LEGAL y nada viene preseleccionado: preseleccionar
// sería la app adivinando de quién es la compra, que es justo lo que la
// regla general de §4 prohíbe.
export {
  SelectorDestinoItem,
  type SelectorDestinoItemProps,
  type DestinoItem,
  type MascotaDestino,
} from './components/SelectorDestinoItem'

// PuertaDeOficio — S96-B: el BARRIDO al cambiar de oficio (§3).
//
// 🔴 Y LO QUE **NO** HACE, escrito acá porque su modo de falla es creer
// que sí: la letra dice «cruzar la puerta cambia PERMISOS, no decoración
// — si la puerta solo cambia colores, es una animación bonita sobre un
// agujero». ESTE COMPONENTE ES EL COLOR. El cambio de alcance vive en el
// servidor (matriz acto/rol de BIO_EXPEDIENTE, cerrado en policies); esta
// pieza es su acuse de recibo visual, y nada más. Un barrido sobre un
// agujero se ve idéntico a uno sobre una puerta de verdad.
//
// 340ms por `motion.marca` — la física con la que abre el Coach desde
// S53. Resuelve sola la tensión aparente letra-vs-Ley 6: la letra pide
// «menos de medio segundo» y la Ley 6 manda <300ms EN UI; 340 no es UI
// chica sino gesto de MARCA, registro que la casa ya tiene firmado con su
// token. Cumple la letra sin inventar duración ni pedir excepción.
//
// No barre en memorial (Ley 6/8) ni con reduce motion — y en los dos
// casos `onFin` se llama IGUAL: degradar el gesto no puede degradar el
// contrato, o la pantalla que lo espera se cuelga.
//
// Recibe la CAPA (ley 10), jamás un color: aceptar un hex sería la Ley 1
// rota por la puerta de atrás.
export { PuertaDeOficio, type PuertaDeOficioProps, type CapaDeOficio } from './components/PuertaDeOficio'
