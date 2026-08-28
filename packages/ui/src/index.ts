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
// El pie fijo que RESERVA SU PROPIO LUGAR — la cura de las cinco pantallas
// donde el pie se pintaba encima del contenido (S100b-B).
export { PantallaConPie, type PantallaConPieProps } from './components/PantallaConPie'
// Un glifo con su número encima — pedido de D con su límite medido: no
// podía hacer el contador sin inventar un color que la casa no expone.
export { GlifoConContador, type GlifoConContadorProps } from './components/GlifoConContador'
// CarritoFlotante — S100d-B (puntos 8·9·12 del gate): LA ÚNICA PUERTA al
// carrito, abajo a la derecha, donde llega el pulgar. Se pasa como `pie` de
// `PantallaConPie` para que su reserva sea DERIVADA y no tape la última
// tarjeta (L-301). **Con el carrito vacío no se dibuja** — el primer `+` la
// hace entrar, y eso ES «al agregar se abre el flotante».
// ⚠️ Su montaje y el RETIRO de la canasta del encabezado van en el MISMO
// commit: montarla sola deja dos puertas; retirar la otra sola deja cero.
export { CarritoFlotante, COLA_CARRITO_FLOTANTE, type CarritoFlotanteProps } from './components/CarritoFlotante'
// FichaRepartidor — S100d-B (punto 25): quién va a tocar el timbre. LA PLACA
// MANDA (es lo único verificable desde la puerta) · sin placa el nombre
// preside, y es 1 de 2 casos vivos · el hueco de la foto se DIBUJA, jamás se
// reemplaza por una cara genérica. La monta la pista D en EN CAMINO.
export { FichaRepartidor, type FichaRepartidorProps } from './components/FichaRepartidor'
// La GOTA — F-PIN (puntos 16·23·26): UN dibujo para el glifo `ubicacion` y
// para la marca del mapa, con su ancla derivada (la punta, no el centro).
export { GOTA_D, GOTA_OJO, GOTA_PUNTA_Y, desplazamientoDePunta } from './components/gota'
// GotaUbicacion — S100d·bis: la marca del mapa FUERA del mapa, con borde
// grueso ocre (firma del founder). Mismo dibujo que el glifo y que el pin;
// **se ancla por el CENTRO**, porque fuera del mapa la punta no marca nada.
export { GotaUbicacion, type GotaUbicacionProps } from './components/GotaUbicacion'
export { LogoNegocio, type LogoNegocioProps } from './components/LogoNegocio'
// Destape — S97+-B: la ceremonia de cierre del wizard de alta (pedido de C,
// contrato firmado de mesa). Corre UNA vez; avisa su fin por `alTerminar`,
// que sale del ultimo gesto REAL y no de un temporizador paralelo.
export { Destape, type DestapeProps, type DestapeTab } from './components/Destape'
// Baldosa — S97+-B: la pieza de lo que se ELIGE (Acto II). Tarjetas para
// elegir, filas para leer. Sube la UNIDAD, no la grilla.
export { Baldosa, type BaldosaProps } from './components/Baldosa'
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
  type InsigniaModalidad,
  type InsigniaTamaño,
} from './components/Insignia'
// ── S106-B TANDA 2 · LA VIDEOLLAMADA ──────────────────────────────────────
// La clase «control sobre video»: fondo NO controlado (lo pone la cámara de
// otro). Ver `tokens/sobreVideo.ts` — NO enmienda la Ley 12, la nombra aparte.
export { sobreVideo, type SobreVideo } from './tokens/sobreVideo'
export { ControlLlamada, type ControlLlamadaProps, type ControlLlamadaGlifo } from './components/ControlLlamada'
export { TemporizadorLlamada, type TemporizadorLlamadaProps } from './components/TemporizadorLlamada'
export { EstadoConexion, type EstadoConexionProps, type EstadoDeConexion } from './components/EstadoConexion'
export { EncabezadoLlamada, type EncabezadoLlamadaProps } from './components/EncabezadoLlamada'
export { TileVideoPropio, type TileVideoPropioProps, type EsquinaTile } from './components/TileVideoPropio'
export { SuperficieLlamada, type SuperficieLlamadaProps } from './components/SuperficieLlamada'
export { ModalDosAlturas, AsaModal, type ModalDosAlturasProps, type AlturaModal } from './components/ModalDosAlturas'

// S106-B · la acción SUELTA que saca del flujo (anatomía 19.7 sin portador)
export { AccionQueLleva, type AccionQueLlevaProps } from './components/AccionQueLleva'

// S106-B · el aviso previo de teleconsulta (LETRA_TELEMEDICINA §3)
export {
  AvisoTeleconsulta,
  type AvisoTeleconsultaProps,
  type AccionAviso,
} from './components/AvisoTeleconsulta'
export { Encabezado, type EncabezadoProps } from './components/Encabezado'
export { HeroMarca, type HeroMarcaProps, type HeroMarcaVariante } from './components/HeroMarca'
export { BarraTabs, ALTO_FILA_TABS, type BarraTabsItem } from './components/BarraTabs'
export { Hoja, HojaScroll, type HojaProps, type HojaAltura, type HojaScrollProps } from './components/Hoja'
export { HojaCaptura, type HojaCapturaProps } from './components/HojaCaptura'
export { PinEnMapa, MarcaDeMapa, LADO_PIN, type PinEnMapaProps } from './components/PinEnMapa'
export {
  PuertaHermana,
  ALTO_PUERTA_HERMANA,
  type PuertaHermanaProps,
} from './components/PuertaHermana'
export { registrarCruce, tomarCruce, type DireccionCruce } from './components/cruce'
export { EntradaDeCruce, type EntradaDeCruceProps } from './components/EntradaDeCruce'
export { Fundido, type FundidoProps } from './components/Fundido'
// Salida — S100d-B (punto 13): la CUARTA de la familia del movimiento.
// `Entrada` aparece · `EntradaDeCruce` llega · `Fundido` cambia ·
// **`Salida` se va**. Envuelve una FILA DE LISTA: se apaga en su lugar y las
// vecinas cierran el hueco. ⚠️ Exige `key` estable por ítem — con
// `key={index}` React renumera en vez de desmontar y la salida NO dispara,
// sin error y sin warning.
export { Salida, type SalidaProps } from './components/Salida'
// Mutacion — S100d·bis: la QUINTA de la familia del movimiento. Dos formas se
// turnan LA MISMA CAJA y se cruzan adentro de ella; la inversa sale sola de
// `estado`. Su condición está medida y es la que la hace posible: los dos
// estados ocupan exactamente la misma caja.
export { Mutacion, type MutacionProps } from './components/Mutacion'
// Chevron — S99-B: el portador del trazo suelto, para slots que NO son
// una fila entera (el `senal` de DatoAdministrable). El path sigue sin
// exportarse: se usa la pieza, jamás la geometría.
export { Chevron, type ChevronProps, type DireccionChevron } from './components/chevron'
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
// S104-C · la ACEPTACIÓN legal (checkbox). NO reemplaza a Interruptor (switch):
// §4.3/§38.10 del T&C exigen «casilla», y un switch no cumple ese literal.
export { Casilla, type CasillaProps } from './components/Casilla'
export { StepperCantidad, ALTO_STEPPER_COMPACTO, ALTO_STEPPER_MENUDO, ALTO_STEPPER_ANCHO, type StepperCantidadProps, type TamanoStepper } from './components/StepperCantidad'
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

/**
 * BotonCopiar — S103-B: un toque copia, y el botón mismo lo confirma.
 *
 * Pedido de C con su consumidor nombrado: el código de 6 dígitos de DeUna,
 * que la familia lleva a otra app para pagar. COMPONE `Boton` (Ley 11:
 * reusar > adaptar > crear) y le agrega lo único que `Boton` no puede
 * saber: cómo confirma, cuánto dura, qué pasa cuando el valor venció, y
 * que NO toca ningún reloj de la pantalla.
 *
 * ⚠️ DEPENDE DE `expo-clipboard`, que es NATIVO: **no viaja por OTA**
 * (L-134). Hasta la próxima build el módulo no existe en el binario y la
 * pieza **se apaga sola y honesta** en vez de romper la pantalla —
 * `HAY_PORTAPAPELES` lo dice, para que una superficie pueda explicarlo.
 */
export { BotonCopiar, HAY_PORTAPAPELES, type BotonCopiarProps } from './components/BotonCopiar'
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
// PaseoDeHuellas — S104-B: la senda que se traza y SE QUEDA. Familia de
// `MarcaDeAgua` (fondo: absoluto, sin toque, memorial la apaga en la
// fuente), no de `Entrada` — no ordena lectura, es textura. Solo `opacity`
// en hilo de UI; reduce-motion la deja TRAZADA, no más rápida.
// ⚠️ Nace con freno declarado: `RITUAL_DE_ENTRADA.md` no existe en el repo.
export { PaseoDeHuellas } from './brand/PaseoDeHuellas'
// RitualDeEntrada — S104-B: los DOS gestos de la llegada, sueltos y sin
// cablear. `RespiroDeMarca` (1.0→1.03→1.0, 520 = `duration.grande`) envuelve
// al isotipo · `HuellaDeLlegada` (~400) reusa el motivo de `EsperaDeMarca`
// UNA vez como celebración. **No componen entre sí**: dónde y en qué orden
// se montan lo dice la letra que no viajó.
export { RespiroDeMarca, HuellaDeLlegada } from './brand/RitualDeEntrada'
// LockupMarca — S104-B: el NOMBRE de la casa, en un solo lugar. Nace del
// censo que halló TRES variantes vivas (`e-PetPlace` 95 · `ePetPlace` 3 ·
// `e.petplace` 1, y esa última era el wordmark de la primera pantalla).
// ⚠️ El nombre NO es prop de texto libre —eso es lo que produjo las tres—:
// vive adentro y el consumidor declara la CASA sobre un union cerrado.
export { LockupMarca, type LockupMarcaProps } from './brand/LockupMarca'
// PantallaDeCandado — S104-B (MODELO_LOGIN §2.5): la cortina sobre la sesión
// existente, JAMÁS un factor de auth. Presentacional a propósito: no importa
// `expo-local-authentication` (que además NO está instalado y es NATIVO ⇒ no
// viaja por OTA, L-134). El fallback a contraseña se dibuja en LOS TRES
// estados, incluso verificando — es la única salida si el sensor falla.
export { PantallaDeCandado, type PantallaDeCandadoProps, type EstadoCandado } from './components/PantallaDeCandado'
// ── S104-B · LAS TRES PIEZAS DE LA SALIDA (P15) ──────────────────────────
// HojaConfirmacionDestructiva — el patrón «P1 · la doble confirmación», que
// vivía como INSTANCIA en cuenta/medios.tsx y no como pieza. `sujeto` es
// OBLIGATORIO: un «¿estás seguro?» sin sujeto es un botón que se aprende a
// apretar sin leer (y el caso medido eran dos tarjetas del mismo banco).
export {
  HojaConfirmacionDestructiva,
  type HojaConfirmacionDestructivaProps,
} from './components/HojaConfirmacionDestructiva'
// ConsecuenciasDelCierre — «esto se va, esto queda» (P15 §4). Cada
// consecuencia DECLARA su `respaldo`: el wrapper que la ejecuta, o
// 'sin_motor'. Es lo que vuelve mecanizable a `R64` — sin eso, prometer de
// más cuesta una línea y no lo nota nadie. Las DOS columnas son obligatorias:
// montar solo `seVa` daría «vamos a borrar todo», la frase que P15 §4 prohíbe.
export {
  ConsecuenciasDelCierre,
  type ConsecuenciasDelCierreProps,
  type Consecuencia,
  type RespaldoDeConsecuencia,
} from './components/ConsecuenciasDelCierre'
// CierreEnCurso — el estado mientras la ventana corre. ⚠️ NACE CON CHOQUE DE
// LETRA DECLARADO: los «30 días» NO están en P15 (sus cinco cláusulas no los
// mencionan) — viven como *Propuesta* sin firma, y su otra mitad («borrado
// duro programado») choca con el titular firmado y además es INEJECUTABLE
// (24 FKs bloqueantes). Por eso su voz dice fecha y cancelación, y NO promete
// destrucción. Toma FECHA y no días: ver el porqué medido en la pieza.
export { CierreEnCurso, type CierreEnCursoProps } from './components/CierreEnCurso'
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
export { EsperaDeTrabajo } from './brand/EsperaDeTrabajo'
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

// PrecioText — S100-B: LA VOZ DEL PRECIO, una sola para toda la casa. Nace
// porque el precio se escribia a mano en 53 sitios (`$ ${x.toFixed(2)}`) y en
// la vitrina se pintaba con `metadataMono` — el slot de la METADATA de una
// fila. El diagnostico no es tipografico sino de JERARQUIA: en una tarjeta de
// compra el precio no es metadata, es el dato que decide. NO deroga la Ley 3:
// el $/kg SE QUEDA en mono porque es un CALCULO.
export { PrecioText, formatearPrecio, type PrecioTextProps, type PrecioRegistro } from './components/PrecioText'

// TarjetaProducto — S100-B: un producto en la vitrina de dos columnas, con el
// `+` que lo agrega SIN abrir la ficha (firma del founder; mecanismo de
// Instacart, su superficie de ranking/urgencia queda afuera). El `+` vive
// SIEMPRE en la misma esquina —la mano lo encuentra sin mirar— y al agregar
// MUTA a stepper en el lugar. `hayStock` es BOOLEANO por construccion: la
// familia necesita «¿puedo comprar esto?», jamas el inventario ajeno.
export { TarjetaProducto, type TarjetaProductoProps } from './components/TarjetaProducto'

// nombreCurado — S100-B: la caja del nombre de producto, UNA para las dos
// caras. Sube desde `apps/cliente` porque el espejo del vendedor no podía
// consumirla sin duplicarla, y con 42% del catálogo EN MAYÚSCULAS una sola
// cara curando significa que vendedor y familia ven nombres distintos del
// mismo producto. Viaja con `TarjetaProducto`: la pieza y la función que
// prepara su dato son N17 aplicada a la lógica, no solo a la forma.
export { nombreCurado } from './nombre-curado'

// La grilla de dos columnas — S100-B: el patron MEDIDO, en codigo y una sola
// vez. Vivia en un comentario JSDoc de `Baldosa`: ejecutable por copia y
// verificable por nadie. Sale a `.ts` cuando aparecio su segundo consumidor,
// que es lo que ese mismo archivo pedia («no se sincronizan dos copias: se
// deja UNA»). Sin `gap`, porque el gap no se ve en el porcentaje.
export { CELDA_DE_GRILLA, GRILLA_DE_DOS } from './components/grilla-de-dos'

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
// 🔴 S96-B SEGUNDA TANDA — LA COMPOSICIÓN TIENE TRES ESTADOS (firma del
// founder): verificada · declarada_sin_verificar · ausente. SOLO LA
// VERIFICADA PUEDE CALLAR. Nació con una unión de DOS y era insuficiente:
// medido sobre el catálogo real, 133 productos tienen composición presente
// y lista INCOMPLETA (Royal Canin Medium Adulto lleva aceite de pescado y
// no declara pescado) — y SU SILENCIO SE VE IDÉNTICO AL CONFIABLE.
//
// EL CAMBIO DE FONDO: la pieza ya no recibe un `modo` que la pantalla
// elige. Recibe los HECHOS (`composicion` + `contieneAlergeno`) y DERIVA
// ella si habla. Montada con `declarada_sin_verificar`, la pantalla NO
// TIENE FORMA DE HACERLA CALLAR — no existe la prop. Antes «qué se
// muestra» era decisión de la pantalla; ahora es consecuencia del dato.
//   ⚠️ SU LÍMITE: no puede obligar a que la MONTEN. Ese hueco no se cierra
//   desde un componente — es candidato de regla de lint, no de prop.
//
// LOS TRES CANDADOS: ① jamás silencio fuera de `verificada` · ② no se apaga
// por una promoción · ③ NO SE APAGA POR EL NOMBRE DEL PRODUCTO — medido:
// 10 productos se llaman «hypoallergenic» o «sensitive» y traen un alérgeno
// común adentro, así que la pieza NO TIENE PROP DE NOMBRE: no hay por dónde
// pasarle el dato con el que alguien podría querer silenciarla.
//
// ⚠️ SU PRODUCTOR NO EXISTE TODAVÍA (medido por B y por D, coincidiendo):
// `productos` tiene `alergenos` e `ingredientes_activos` SIN marca de
// verificación ⇒ hoy nadie puede derivar `verificada`. La forma está y
// espera su dato — es el inverso del «motor sin puerta».
//
// 🔴 REABIERTA EL MISMO DÍA POR DOS FIRMAS MÁS:
//  · LA COMPOSICIÓN GANA UN CUARTO VALOR — `no_aplica` (seis arenas
//    sanitarias del catálogo real). CALLA COMO `verificada`, PERO ES OTRO
//    SILENCIO: una calla porque cotejamos y está bien, la otra porque NO
//    HAY NADA QUE COTEJAR. Meterlo en `ausente` sería peor que no tenerlo
//    — la app le pediría ingredientes a una bolsa de arena.
//  · LA COINCIDENCIA DEJA DE SER BOOLEAN y pasa a `ninguna|exacta|
//    imprecisa`. Un producto que declara `ave_no_especificada` tiene que
//    advertirle al alérgico al pollo, y la voz NO es «contiene pollo»: es
//    «contiene proteína de ave sin especificar, y podría ser pollo».
//    ⇒ Unión y no dos booleans porque «no contiene pero es imprecisa»
//      sería EXPRESABLE Y NO SIGNIFICA NADA. Mismo movimiento que
//      `DestinoItem`: el hecho tiene tres valores, el tipo tiene tres.
//    ⇒ El TONO NO BAJA en la imprecisa (mismo registro warning): bajarlo
//      la volvería ignorable y el riesgo es el mismo — si esa proteína ES
//      pollo, le hace igual de mal. Cambia la VOZ, no el matiz.
//
// DEFENSA EN PROFUNDIDAD, declarada: `no_aplica` CON coincidencia es
// incoherente y A confirmó que la puerta lo rebota. Aun así la pieza no
// asume dato limpio — si llegara, HABLA. Ante una incoherencia, el error
// barato es advertir de más y el caro es callar.
export {
  AvisoAlergia,
  type AvisoAlergiaProps,
  type EstadoComposicion,
  type CoincidenciaAlergeno,
} from './components/AvisoAlergia'

// CodigoAEscala — S96-B: el código que se lee A TRAVÉS DE UN MOSTRADOR.
// Pedido de C con DOS consumidores ya nombrados (el código de reclamo del
// mostrador y el de la puerta que la familia dice al repartidor).
//
// POR QUÉ NO ALCANZABA `Texto`: `dato` es mono de 13 y `Texto` no tiene
// escotilla de tamaño A PROPÓSITO. C lo estaba componiendo con `titulo`
// —que es SANS, o sea la Ley 3 rota para conseguir el tamaño—. El desvío
// no era de C: era el hueco del sistema, y C lo declaró en vez de taparlo.
//
// EXCEPCIÓN DECLARADA al matiz S53 (a escala display el dato viste sans):
// acá NO aplica, y la razón es funcional. Este dato se TRANSCRIBE y se
// DICTA: en sans se confunden 0/O y 1/l/I. La excepción display nació para
// números que se LEEN de un vistazo; ésta es la familia que se COPIA.
//
// Su a11y es la mitad de la pieza: lee el código DÍGITO A DÍGITO — un
// lector que dice «ochenta y siete millones» es inútil para alguien que
// tiene que repetirlo en una puerta.
export { CodigoAEscala, type CodigoAEscalaProps } from './components/CodigoAEscala'

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

// BuscadorDeLugar — S96-B: buscar una dirección y elegirla (§7). Pedido de
// D con su contrato ya vivo (`buscarLugares` → PrediccionLugar). La pieza
// NO busca: las llamadas y la sesión de Places son de la pantalla (tiene
// costo por sesión y cierra en `resolverLugar`).
//
// TRES ESTADOS QUE NO SE CONFUNDEN (Ley 13): cargando · con resultados ·
// BUSCÓ Y NO ENCONTRÓ. El tercero es el que importa — §7 dice que Places
// falla en Quito más de lo que uno espera (urbanizaciones nuevas, casas
// sin numeración), así que no es caso borde: es por donde va a entrar una
// parte real de las direcciones. Por eso `sinResultados` lleva su voz Y su
// salida: un vacío sin camino deja al usuario sin dirección y sin idea.
// El orden del render respeta que CARGANDO no es SIN RESULTADOS — mandar a
// poner el pin a mano a alguien cuya dirección sí existía es el error
// clásico de la Ley 13 con consecuencia concreta.
export { BuscadorDeLugar, type BuscadorDeLugarProps, type PrediccionDeLugar } from './components/BuscadorDeLugar'

// PinMovible — S96-B: el punto se pone a mano, Y ES OBLIGATORIO (§7: «si
// Places no encuentra la casa, el punto igual existe»).
//
// EL CHECK TIENE SU ESPEJO EN EL TIPO: A confirmó `chk_direccion_con_punto`
// (lat/lon obligatorios), y acá `lat`/`lon`/`onMover` son REQUERIDOS sin
// `null` posible — «dirección sin punto» no es expresable en la pieza,
// igual que no lo es en la tabla. Sin punto todavía, la pantalla pasa el
// centro de la ciudad como semilla.
//
// SE MUEVE EL MAPA, NO EL PIN — patrón de la industria para ajustar
// ubicación, y la razón es física: arrastrando un marcador EL DEDO TAPA
// EXACTAMENTE EL PUNTO que hay que colocar con precisión. Con el mapa
// moviéndose debajo, el punto está siempre a la vista. Consecuencia: el
// pin no es un `Marker`, es una capa encima — no puede desincronizarse del
// centro porque ES el centro. Y `onMover` sale de `onRegionChangeComplete`,
// jamás del evento continuo: un valor que tiembla mientras el dedo está
// apoyado es re-renders que nadie pidió.
export { PinMovible, type PinMovibleProps } from './components/PinMovible'

// SelectorVentana — S96-B: cuándo llega, y POR QUÉ un día no se puede
// elegir (§6.2 + §7.1 de la letra del panel). Contrato confirmado por D.
//
// 🔴 EL DÍA SIN CUPO SE DIBUJA, NO SE ESCONDE — y es la decisión. La Ley
// 23 dice que la puerta no ofrece lo que va a rechazar, y la lectura fácil
// es esconder el día lleno. Es la equivocada acá: EL CLIENTE ESTÁ BUSCANDO
// EL JUEVES. Un jueves que desaparece se lee como «el jueves no existe» y
// deja a alguien sin entender por qué su día no está — el mismo daño que
// un error disfrazado de vacío.
//   ⇒ La puerta no OFRECE lo que va a rechazar, pero tampoco puede hacer
//     DESAPARECER lo que el usuario vino a buscar. El día lleno se muestra,
//     NO es tocable (la Ley 23 intacta: el servidor jamás lo recibe) y DICE
//     POR QUÉ — que es lo único que convierte un «no» en información.
//
// `motivo` viaja VISIBLE, sin tap: un motivo detrás de un toque es un
// motivo que nadie lee. Y va al `accessibilityLabel` — quien no ve la
// pantalla también tiene que saber por qué no puede elegir ese día.
//
// APAGADO NO DICE ERROR (Ley 22): `sin_cupo` es apagado sereno, jamás
// registro de peligro. Un día lleno no es una falla del cliente ni del
// sistema — pintarlo en rojo convierte una agenda en un reproche.
//
// POR QUÉ NO ES `SelectorOpcion` ENSANCHADO: ese es el chip de VALOR y no
// tiene «no elegible con su razón». La diferencia no es cosmética — una
// opción que dice POR QUÉ necesita espacio para la razón, o sea otra
// anatomía; meterla ahí obligaría a los chips de toda la casa a cargar un
// `motivo` que ninguno usa.
export {
  SelectorVentana,
  type SelectorVentanaProps,
  type OpcionVentana,
  type EstadoVentana,
} from './components/SelectorVentana'

// ── S107-B · LAS PIEZAS DEL OFICIO ────────────────────────────────────────
//
// 🔴 CONTEXTO QUE NO SE PUEDE OMITIR: `LETRA_GUARDERIA` está **FRENADA**
// (memo del abogado, 25-ago-2026 — su §3, el reparto de responsabilidad, es
// *nula de pleno derecho*; fichas `D-918` y `D-919`). Estas piezas se
// construyen bajo el perímetro §0 de la tanda: **ninguna escribe texto que
// reparta responsabilidad — todo texto entra por prop**, y por eso ninguna
// puede afirmar algo que la letra todavía no sostiene. Es el mecanismo, no
// la disciplina: el estado malo es inexpresable (L-222).

export { FichaFranja, type FichaFranjaProps, type VentanaDeFranja } from './components/FichaFranja'

export {
  FichaMensualidad,
  type FichaMensualidadProps,
} from './components/FichaMensualidad'

export {
  SemaforoSanitario,
  type SemaforoSanitarioProps,
  type RequisitoSanitario,
} from './components/SemaforoSanitario'

export {
  CalendarioCupo,
  type CalendarioCupoProps,
  type DiaDeCupo,
  type EstadoCupo,
} from './components/CalendarioCupo'

export {
  SelectorRoster,
  type SelectorRosterProps,
  type MiembroDelRoster,
} from './components/SelectorRoster'

export { ContadorClip, type ContadorClipProps } from './components/ContadorClip'

export { MiniaturaClip, type MiniaturaClipProps } from './components/MiniaturaClip'

export { HiloDelDia, type HiloDelDiaProps, type EntradaDelHilo, type MediaDelHilo } from './components/HiloDelDia'

export {
  ActaDeEntrega,
  type ActaDeEntregaProps,
  type ItemDeActa,
  type Conformidad,
  type DireccionDelActa,
} from './components/ActaDeEntrega'

export {
  AceptacionDeDocumentos,
  type AceptacionDeDocumentosProps,
  type DocumentoAceptable,
} from './components/AceptacionDeDocumentos'

export {
  FichaPaquete,
  equivalenciaDePaquete,
  type FichaPaqueteProps,
  type EquivalenciaPaquete,
  type DireccionEquivalencia,
} from './components/FichaPaquete'
