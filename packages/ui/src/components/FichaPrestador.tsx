/**
 * FichaPrestador — LA VITRINA DEL NEGOCIO, una sola vez (S84-B7).
 *
 * ═══════════════════════════════════════════════════════════════════
 * POR QUÉ ES UNA PIEZA Y NO DOS DIBUJOS: hasta hoy la ficha del
 * prestador se pintaba DOS VECES —la búsqueda del cliente con `Celda`
 * genérica, y el espejo del prestador con una copia a mano— y esa copia
 * YA MINTIÓ DOS VECES EN UN MES (oficio y ciudad falsos, visibilidad
 * clavada en `true`). Mientras sean dos dibujos van a divergir otra vez.
 * Con una pieza, **"el espejo dice algo distinto de lo que ve la
 * familia" se vuelve inexpresable** — el mismo mecanismo de los ocho
 * slots y de la portada derivada del orden.
 * ═══════════════════════════════════════════════════════════════════
 *
 * SE VISTE SOLA POR CASA. Cero props de color: los ocho slots resuelven
 * el fondo, el CTA y los acentos según dónde se monte. Verificado al
 * construirla: la anatomía NO pidió un noveno slot (el vacío de portada
 * usa `bg.overlay`, que es token y no slot; el CTA usa `accent.cta` /
 * `ctaTexto`; los chips usan las capas).
 *
 * TODAS LAS PROPS SON OPCIONALES, y no por comodidad: la regla de la
 * anatomía —**si un dato falta, la línea no se pinta**— ya vuelve
 * opcional a cada campo. El efecto lateral es el que importa: la pieza
 * sobrevive a la fuente que gane sin que haya que tocarla. Hoy conviven
 * dos y ninguna es contrato: `v_prestadores_publicos` (18 columnas) NO
 * TIENE UN SOLO LECTOR en el monorepo —medido S84-B2, y ya lo decía la
 * migración de S79-A0— y lo que la familia ve sale de `prestadores` por
 * RLS. La pieza no elige entre ellas: recibe.
 *
 * ⚠️ LO QUE ESTA PIEZA NO DECIDE — D-173, SIN FIRMA. Portada + firma +
 * historia ES el modelo de identidad EXHIBIDA, y D-173 pregunta
 * justamente si el prestador se exhibe o se oculta detrás de
 * e-PetPlace (el TDR de Sellers dice una cosa y `PORTAL_PRESTADOR` §4.5
 * la contraria). La pieza no resuelve esa decisión y **tampoco la
 * espera** (enmienda de método, 2-ago-2026). Queda escrito para que
 * nadie la cite como precedente de algo que nadie firmó.
 *
 * DE DÓNDE SALE EL LOGO, porque el nombre engaña y ya costó una lectura
 * mal encaminada: NO de `logo_url` —esa columna existe y es de
 * `seller_perfil`, otra tabla— sino de `prestadores.foto_url`, que el
 * consumidor resuelve con `resolverUrlLogoNegocio` (bucket público).
 *
 * MÓVIL NO TIENE LADO A LADO: la ficha es PANTALLA COMPLETA. La pieza
 * llena su contenedor y no se auto-limita — quién la abre y con qué
 * botón es del consumidor (en el espejo, "Ver cómo te ven").
 */

import { useRef, useState, type ReactNode } from 'react'
import { Image, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'

import { Boton } from './Boton'
import { ClipSesion } from './ClipSesion'
import { Insignia } from './Insignia'
import { LogoNegocio } from './LogoNegocio'
import { MapaZona } from './MapaZona'
import { Texto } from './Texto'
import { opacity } from '../tokens/opacity'
import { palette } from '../tokens/palette'
import { typography } from '../tokens/typography'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

/** ── S91-B · LA PORTADA DEJA DE TENER ALTO FIJO Y PASA A TENER RELACIÓN.
 *
 *  EL SÍNTOMA, del founder: «la imagen se ve muy rectangular, forzada a
 *  16:9». LA CAUSA, medida: **era peor que 16:9** — `ALTO_PORTADA` era
 *  176 FIJO, y contra el ancho de un teléfono típico (~390) eso da **2.2:1**,
 *  más panorámico todavía que el 16:9 (1.78) que se le atribuía. Un alto
 *  fijo no tiene relación: la TIENE distinta en cada ancho, y en una
 *  tablet se estira hasta el absurdo.
 *
 *  LA CURA: se calibra la RELACIÓN, no el alto — y el ancho ya se medía
 *  (la pieza vive en cajas de anchos distintos). 4:3 es el marco más
 *  cuadrado que sigue leyéndose como portada y no como tarjeta, y su
 *  porqué es de contenido, no de gusto: **cuanto más cuadrado el marco,
 *  menos sufre una foto VERTICAL** — y las fotos de un negocio real
 *  llegan como llegan. Conecta con D-696 (el recorte ciego de `cover`):
 *  esto no lo cura, pero le baja el daño mientras tanto.
 *
 *  ⚠️ CON `aSangre`, EL INSET SE SUMA AL ALTO. Si no se sumara, la barra
 *  de estado se comería su parte de la foto y la relación VISIBLE sería
 *  otra —justo el error que se está curando—. Así la imagen sigue
 *  naciendo en el borde de arriba y lo que se ve debajo de la barra
 *  conserva su 4:3: *pinta desde el techo, y respira.* */
const RELACION_PORTADA = 4 / 3
/** El alto de arranque, ANTES de que `onLayout` mida. Dura un frame y no
 *  se ve; existe para que la caja no nazca en cero y salte. */
const ALTO_PORTADA = 176
/** Cuánto monta la firma sobre la portada. El logo pisa el borde: es lo
 *  que ata la identidad a su fondo en vez de apilar dos bloques sueltos. */
const MONTA_FIRMA = 28
const LADO_FIRMA = 72
/** Diámetro del punto de paginación. */
const PUNTO = 10
/* ☠️ VELO_CLIP y el import de `typography` SE RETIRAN (S85-B20): eran la
 *  maquinaria del ▶ decorativo sobre el póster, y el póster nunca existió.
 *  Los cazó el tsc al quedar huérfanos — que es la señal de que la cosa
 *  murió ENTERA y no a medias (Ley 37: nada queda "por si acaso"). */

export interface FichaPrestadorProps {
  /** `nombre_comercial`. Sin él no se pinta el título ni el monograma. */
  nombre?: string | null
  /** S85-B17/B21 · LA INSIGNIA DE COHORTE, junto al nombre (firma de mesa).
   *
   *  RECIBE EL DATO CRUDO, NO LA ETIQUETA — y el cambio de contrato es
   *  firma de mesa con su argumento: el motor selló la REGLA en un trigger
   *  (fundador ≤ 2027-03-30, después pionero) precisamente para que nadie
   *  la re-derive. Si cada app compusiera la frase, la mitad presentacional
   *  quedaría re-derivada un piso más arriba — y dos consumidores armando
   *  la misma frase NO divergen el primer día: divergen el mes que viene, y
   *  el que divergió no se entera. Es la enfermedad del pie de reserva y de
   *  la pata, cazada esta vez ANTES del segundo consumidor.
   *
   *  La etiqueta la arma la pieza con el riel de idioma de `packages/ui`,
   *  que es donde `ClipSesion` y `LineaDeVida` ya guardan su voz.
   *
   *  Los DOS tienen que venir: sin año no hay etiqueta, y un «Prestador
   *  fundador» sin año diría menos de lo que el dato sabe. Ausente o
   *  incompleto = no se monta nada — un negocio sin cohorte no ve un hueco
   *  donde otro tiene una distinción.
   *
   *  POR QUÉ JUNTO AL NOMBRE Y NO SOBRE LA FOTO (el porqué de la mesa,
   *  escrito acá porque es donde se lee al mover algo): sobre la foto una
   *  pastilla habla del estado de HOY —ése es el precedente «Al día»— y la
   *  cohorte es un hecho FIJO. Y esta ficha es la vitrina pública: el
   *  nombre siempre está, la foto puede faltar. */
  cohorte?: 'fundador' | 'pionero' | null
  /** El año del alta (`cohorte_anio`). Va aparte del código porque son dos
   *  datos y la pieza los junta — no porque la app tenga que juntarlos. */
  cohorteAnio?: number | null
  /** Logo YA RESUELTO (`resolverUrlLogoNegocio(prestadores.foto_url)`).
   *  Sin él, `LogoNegocio` cae a su monograma honesto — jamás a huella. */
  logoUrl?: string | null
  /** Portadas YA RESUELTAS (la pieza no toca storage), **en el orden que
   *  manda `prestador_fotos.orden`** — o sea `[0]` ES la portada y no hay
   *  que preguntarla (contrato de `listarFotosGaleria`, S84-A). Vacío o
   *  ausente = el estado vacío de abajo.
   *  Con más de una, se pagina: ver `CARRUSEL` abajo. */
  portadas?: string[]
  /** EL LUGAR DEL CLIP (S84-B11) — su póster ya resuelto. Entra al
   *  carrusel como UNA POSICIÓN MÁS, al final, y su punto de paginación
   *  lleva el ▶ en vez de un punto (referencia Fluvi).
   *  ⚠️ EL ▶ ESTÁ APAGADO A PROPÓSITO y no es un olvido: reproducir video
   *  exige módulo nativo, así que el play LLEGA CON LA BUILD. Lo que se
   *  reserva hoy es el LUGAR — que la composición no cambie el día que
   *  el clip funcione. Y hay una razón más para no apurarlo, medida por
   *  A: **el clip todavía no tiene casa** — `adiestramiento-clips` es
   *  privado y de otro dominio, y una vitrina PÚBLICA necesita bucket
   *  propio con su techo. Esa decisión no es de esta pieza. */
  /** ⏪ S85-B20 · ERA `clipPoster` Y PEDÍA LO QUE NADIE PRODUCE. La ficha
   *  esperaba una IMAGEN FIJA del clip para pintar su posición del
   *  carrusel — y el censo de C midió que **NADA en el sistema genera
   *  pósters: cero**. Cablearlo de la forma obvia compilaba y pintaba
   *  NADA: un `<Image>` con la uri de un video. Es la clase de contrato
   *  que se ve sano hasta que alguien lo usa.
   *
   *  AHORA RECIBE EL CLIP MISMO. La posición monta `ClipSesion` en su
   *  encuadre `vitrina` — la misma máquina poster→video→error, el mismo
   *  "jamás autoplay", los mismos controles nativos. C le pasa el uri y
   *  nada más. */
  clipUri?: string | null
  /** LA ZONA (S84-B16, motor D-624): centro DESPLAZADO dentro del radio y
   *  estable por id — **jamás la coordenada exacta**. Las tres van juntas:
   *  si falta cualquiera, el bloque NO SE MONTA, misma regla que el resto
   *  de la pieza. Si alguien ofrece la sede exacta por acá, es DEFECTO. */
  zonaLat?: number | null
  zonaLon?: number | null
  zonaRadioM?: number | null
  /** `prestadores.ciudad`. */
  ciudad?: string | null
  /** EL OFICIO — hoy NADIE lo pasa, y la línea igual lo acepta.
   *  `prestadores.tipo` existe y está en la vista, pero es el eje MUERTO
   *  D-487: pasarlo hoy sería pintar un dato que miente. La línea se
   *  compone sola el día que tenga fuente viva, **sin tocar esta pieza**
   *  — que es exactamente lo que la orden pidió que no hubiera que hacer. */
  oficio?: string | null
  /** `prestadores.descripcion`. */
  historia?: string | null
  /** Etiquetas de servicio YA en voz de familia (la pieza no traduce
   *  códigos de motor — Ley 3). */
  servicios?: string[]
  /** LA INVITACIÓN DE PORTADA — su presencia decide el estado vacío, y
   *  esa es una decisión de diseño que se declara en vez de deducirse:
   *  · CON handler (EL ESPEJO): sin fotos se muestra UNA invitación con
   *    su CTA. Jamás cuatro tarjetas de ausencia.
   *  · SIN handler (LA FAMILIA): sin fotos la portada NO SE MONTA. La
   *    familia no puede subir fotos ajenas, así que invitarla sería un
   *    final mudo — y la regla de la anatomía manda que si ahí no vería
   *    nada, ahí no haya nada.
   *  El espejo muestra entonces algo que la familia no ve, y está BIEN:
   *  la invitación es affordance DEL ESPEJO, no contenido de la vitrina. */
  onAgregarFotos?: () => void
  /** ── S91-B · LA PORTADA A SANGRE (pedido de C, firma de mesa) ────────
   *  El founder: el carrusel debe cubrir HASTA EL TECHO y de borde a borde;
   *  hoy queda una franja blanca arriba con el nombre.
   *
   *  ⚠️ LA FRANJA NO NACÍA ACÁ, y se dice porque cambia quién la cura: la
   *  raíz de esta pieza YA empieza en el carrusel. La franja la pone el
   *  CONSUMIDOR, que monta un `Encabezado` encima — su propio comentario lo
   *  dice («acá el inset superior ya lo pone el Encabezado»). Así que la
   *  pieza no puede taparla sola: gana la CAPACIDAD de vivir en el techo, y
   *  el consumidor retira su encabezado. Las dos mitades, o no funciona.
   *
   *  Con `aSangre`, lo que la pieza asume es la SAFE AREA: la imagen sangra
   *  bajo la barra de estado y lo que flota encima baja `insets.top`, para
   *  que la barra siga legible. Default `false` = los consumidores de hoy no
   *  se mueven. */
  aSangre?: boolean
  /** DÓNDE VIVE LA VOZ DEL NOMBRE — las dos variantes van al gate del
   *  founder, y las dos están construidas porque salían casi al mismo
   *  precio (la orden decía "si es barato, mostrá las dos"):
   *   · `'bloque'` (default, lo de hoy) — el nombre baja al bloque de
   *     identidad debajo del carrusel; sobre la imagen no queda nada más
   *     que lo que el consumidor flote (`sobrePortada`).
   *   · `'sobrePortada'` — el nombre va SOBRE la imagen, con degradado
   *     inferior para que se lea con cualquier foto. Y entonces NO se
   *     repite abajo: dos veces el mismo dato es la regla Chanel directa.
   *     La cohorte SIGUE en el bloque de identidad en las dos: su porqué
   *     está escrito arriba —sobre la foto una pastilla habla del HOY y la
   *     cohorte es un hecho fijo— y no cambia porque el nombre se mueva. */
  vozNombre?: 'bloque' | 'sobrePortada'
  /** LO QUE FLOTA SOBRE LA PORTADA — del consumidor, jamás de la pieza: una
   *  flecha de volver es NAVEGACIÓN, y esta pieza no sabe de dónde la
   *  abrieron. Se posiciona sola respetando la safe area. */
  sobrePortada?: ReactNode
  /** El anticipo del espejo ("así se va a ver"), al pie. Del consumidor:
   *  la pieza no sabe si la están mirando en un espejo o en una vitrina. */
  pie?: ReactNode
}

export function FichaPrestador({
  nombre,
  aSangre = false,
  vozNombre = 'bloque',
  sobrePortada,
  cohorte,
  cohorteAnio,
  logoUrl,
  portadas,
  clipUri,
  zonaLat,
  zonaLon,
  zonaRadioM,
  ciudad,
  oficio,
  historia,
  servicios,
  onAgregarFotos,
  pie,
}: FichaPrestadorProps = {}) {
  const { theme } = useTheme()
  /* ⏬ S85-B22 · LA COMPOSICIÓN BAJÓ A `Insignia` y esta ficha DELEGA.
     Acá solo se decide SI hay insignia (los dos datos o ninguno); la
     frase la arma la pieza que la porta, que es la que también monta el
     techo del prestador sin pasar por acá. */
  const hayCohorte =
    cohorte !== null && cohorte !== undefined && cohorteAnio !== null && cohorteAnio !== undefined
  const [ancho, setAncho] = useState(0)
  const [activa, setActiva] = useState(0)
  const riel = useRef<ScrollView>(null)
  const insets = useSafeAreaInsets()

  // LAS POSICIONES DEL CARRUSEL: las fotos en su orden + el clip al
  // final si hay póster. Una lista sola, porque el clip es "una posición
  // más" y no un caso aparte — tratarlo aparte es cómo nacen dos
  // composiciones para la misma tira.
  const posiciones: { url: string; esClip: boolean }[] = [
    ...(portadas ?? []).map((url) => ({ url, esClip: false })),
    ...(clipUri !== null && clipUri !== undefined && clipUri !== ''
      ? [{ url: clipUri, esClip: true }]
      : []),
  ]
  const conPortada = posiciones.length > 0
  const N = posiciones.length
  /** CIRCULAR (S84-B13, firma founder tras usarlo: "le falta"). Con UNA
   *  sola posición NO cicla y no monta puntos — un ciclo de uno es un
   *  salto sobre sí mismo, y una tira de un punto informa cero. */
  const cicla = N > 1
  /** LOS EXTREMOS CLONADOS: [última, ...reales, primera]. Es la técnica y
   *  su costo — la firma lo cobró sabiendo que son 2-3× por el
   *  reposicionamiento. Lo que NO se paga con esto es la verdad del
   *  punto: ver `indiceReal`.
   *
   *  ✅ EL FRENO DEL TIRÓN, CERRADO POR EL OJO (firma founder en
   *  dispositivo, group d139b9c0 / APK 1.0.3): **no tironea en Android**.
   *  Se registra porque al construirlo declaré que NO PODÍA afirmarlo —el
   *  tirón es observable en dispositivo y no medible desde el repo—, y una
   *  incertidumbre declarada que se cierra tiene que decir QUIÉN la cerró.
   *  La cerró el único que podía (L-153). **La variante paginada (a) queda
   *  descartada de verdad**: no dejó código vivo que retirar —el circular
   *  la reemplazó en el mismo commit— y su historia vive en `8813cbc`. */
  const tira = cicla ? [posiciones[N - 1], ...posiciones, posiciones[0]] : posiciones
  /** EL ÍNDICE REAL A PARTIR DEL VISUAL. Con extremos clonados los dos se
   *  separan, y el punto tiene que marcar el REAL — un carrusel que
   *  miente sobre en qué foto estás es peor que uno que frena. El módulo
   *  lo resuelve INCLUSO parado sobre un clon, así que el punto es
   *  correcto ANTES del reposicionamiento y no parpadea al saltar. */
  const indiceReal = (visual: number) => (cicla ? ((visual - 1) % N + N) % N : visual)
  const montaVacio = !conPortada && onAgregarFotos !== undefined
  // LA LÍNEA COMPUESTA: se arma con lo que EXISTE. Con los dos, van
  // separados por el punto medio; con uno, va ese solo; sin ninguno, la
  // línea no se pinta — jamás nace un "Sin oficio", que sería inventar
  // una ausencia donde la familia simplemente no vería nada.
  /** El alto VIVO: relación sobre el ancho medido, más el inset cuando la
   *  portada vive en el techo. Con `ancho` en 0 (el primer frame, antes de
   *  `onLayout`) cae al alto de arranque — jamás a cero. */
  const altoPortada =
    (ancho > 0 ? Math.round(ancho / RELACION_PORTADA) : ALTO_PORTADA) + (aSangre ? insets.top : 0)

  const linea = [oficio, ciudad].filter((x) => x !== null && x !== undefined && x !== '').join(' · ')

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      {conPortada ? (
        <View
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width
            if (w === ancho) return
            setAncho(w)
            // Arranca en la primera REAL (visual 1), no en el clon de la
            // última. Sin animación: nadie tiene que VER el arranque.
            if (cicla && w > 0) requestAnimationFrame(() => riel.current?.scrollTo({ x: w, animated: false }))
          }}
        >
          {/* EL ANCHO SE MIDE, no se toma de la ventana: la pieza también
              vive dentro de cajas más angostas (la galería la monta con
              borde), y un carrusel paginado contra el ancho equivocado
              para SIEMPRE entre dos fotos. */}
          <ScrollView
            ref={riel}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEnabled={cicla}
            // EL PUNTO SIGUE AL DEDO: se actualiza en onScroll, no al
            // final — si esperara al momentum, el punto llegaría tarde.
            onScroll={(e) => {
              if (ancho <= 0) return
              setActiva(indiceReal(Math.round(e.nativeEvent.contentOffset.x / ancho)))
            }}
            // EL SALTO VA EN momentum-end Y NO EN onScroll, y es LA
            // decisión que separa un ciclo limpio de uno con tirón:
            // reposicionar en medio del gesto pelea contra el scroll del
            // usuario. Acá el dedo ya soltó y la inercia terminó.
            onMomentumScrollEnd={(e) => {
              if (!cicla || ancho <= 0) return
              const v = Math.round(e.nativeEvent.contentOffset.x / ancho)
              if (v === 0) riel.current?.scrollTo({ x: ancho * N, animated: false })
              else if (v === N + 1) riel.current?.scrollTo({ x: ancho, animated: false })
            }}
            scrollEventThrottle={16}
            style={{ height: altoPortada }}
          >
            {tira.map((pos, i) => (
              <View key={`${pos.url}-${i}`} style={{ width: ancho, height: altoPortada }}>
                {pos.esClip ? (
                  /* ☠️ ACÁ VIVÍA UNA `<Image>` CON EL PÓSTER Y UN ▶ QUE NO
                     REPRODUCÍA. Las dos mitades eran el mismo defecto: el
                     póster no existía (nada en el sistema lo genera) y el
                     ▶ estaba declarado como decorativo —"MARCA el lugar,
                     no reproduce"— con el argumento correcto de que
                     prometer un control muerto es peor que no tenerlo.
                     Ahora la posición monta el CLIP, así que el control
                     hace lo que dice: `ClipSesion` trae su propio play,
                     su máquina poster→video→error y el "jamás autoplay".
                     El ▶ decorativo MUERE con su razón cumplida (Ley 37)
                     — dejarlo sería un segundo play que no es el play. */
                  <ClipSesion uri={pos.url} encuadre="vitrina" descripcion={nombre ?? undefined} />
                ) : (
                  <Image
                    source={{ uri: pos.url }}
                    style={{ width: ancho, height: altoPortada }}
                    resizeMode="cover"
                    accessibilityRole="image"
                    accessibilityLabel={`Foto ${indiceReal(i) + 1} de ${N}, ${nombre ?? 'el negocio'}`}
                  />
                )}
              </View>
            ))}
          </ScrollView>
          {/* S91-B · LO QUE VIVE SOBRE LA PORTADA. Va DENTRO del contenedor
              del carrusel para que sangre con él; su posición respeta la
              safe area cuando la pieza está en el techo. */}
          {sobrePortada ? (
            <View style={{ position: 'absolute', left: spacing[3], top: (aSangre ? insets.top : 0) + spacing[3] }}>
              {sobrePortada}
            </View>
          ) : null}
          {vozNombre === 'sobrePortada' && nombre ? (
            <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }} pointerEvents="none">
              {/* EL DEGRADADO NO ES ADORNO: es lo que hace legible el nombre
                  sobre CUALQUIER foto — sin él la voz depende de la suerte
                  de la imagen. Va de transparente a tinta, no a negro puro:
                  el negro puro no es un color de esta casa. */}
              <LinearGradient
                colors={['transparent', palette.tinta]}
                style={{ paddingTop: spacing[8], paddingHorizontal: spacing[4], paddingBottom: spacing[3] }}
              >
                <Text
                  numberOfLines={2}
                  style={{
                    fontFamily: typography.family.sans.light,
                    fontSize: typography.size.lg,
                    color: palette.light0,
                  }}
                >
                  {nombre}
                </Text>
              </LinearGradient>
            </View>
          ) : null}

          {cicla ? (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                bottom: spacing[3],
                left: 0,
                right: 0,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: spacing[1.5],
              }}
            >
              {posiciones.map((pos, i) => (
                <View
                  key={`punto-${i}`}
                  style={{
                    width: PUNTO,
                    height: PUNTO,
                    borderRadius: radius.full,
                    backgroundColor: theme.text.onGradient,
                    opacity: i === activa ? 1 : opacity.disabled,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* El punto del CLIP lleva el ▶ (referencia Fluvi): la
                      tira dice CUÁNTAS posiciones hay Y cuál es el video,
                      sin tener que llegar hasta él para enterarse. */}
                  {pos.esClip ? (
                    <Text style={{ color: theme.bg.base, fontSize: PUNTO * 0.7, lineHeight: PUNTO }}>▶</Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : montaVacio ? (
        <View
          style={{
            height: altoPortada,
            backgroundColor: theme.bg.overlay,
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing[3],
            paddingHorizontal: spacing[5],
          }}
        >
          <Texto variante="apoyo">Todavía no hay fotos de tu espacio</Texto>
          <Boton variante="primario" tamaño="sm" etiqueta="Agregar fotos" onPress={onAgregarFotos} />
        </View>
      ) : null}

      <View style={{ paddingHorizontal: spacing[5], gap: spacing[3] }}>
        {nombre ? (
          <View style={{ marginTop: conPortada || montaVacio ? -MONTA_FIRMA : spacing[5] }}>
            <LogoNegocio nombre={nombre} logoUrl={logoUrl} tamano={LADO_FIRMA} />
          </View>
        ) : null}

        {/* El nombre y su distinción viven en la MISMA fila y envuelven
            juntos: la insignia es hermana del nombre, no un renglón
            aparte — separarlos la convertiría en un dato más de la ficha
            y deja de leerse como parte de quién ES el negocio. */}
        {nombre ? (
          /* ⚠️ S85-B24 · EL RENGLÓN SE SOSTIENE CON O SIN INSIGNIA, y esto
             es una cura, no un detalle: hasta hoy la jerarquía del nombre
             DEPENDÍA de que la insignia estuviera montada — compartían fila
             y la insignia le cedía ancho. Un prestador SIN cohorte volvía
             al defecto que el founder ya había reportado: el nombre solo en
             su renglón, demasiado pesado.
             Es la misma clase de error que el ▶ decorativo: algo que se ve
             bien SOLO en la configuración en la que se lo miró. La cura es
             que el nombre no dependa de un vecino que puede faltar — el
             `flex: 1` con `flexShrink` lo hace ceder por sí mismo, haya o
             no insignia al lado. */
          /* ⚠️ S85-B27 · SIN `flexWrap`, y es una CURA no un detalle: el
             founder reportó que el emblema «se ve raro DEBAJO del nombre».
             No era la ubicación —la mesa la firmó junto al nombre— era el
             WRAP: con un nombre largo la insignia se caía al renglón
             siguiente y aterrizaba justo donde él dijo que se veía mal.
             Un layout que se ve bien con nombres cortos y se rompe con los
             largos es el mismo error del ▶ y del renglón sin insignia:
             probado en UNA configuración. Ahora el nombre CEDE
             (`flexShrink`) y el emblema se queda en su línea. */
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
            <View style={{ flexShrink: 1 }}>
              <Texto variante="titulo">{nombre}</Texto>
            </View>
            {hayCohorte ? (
              <Insignia distincion="cohorte" cohorte={cohorte} cohorteAnio={cohorteAnio} tamaño="sm" />
            ) : null}
          </View>
        ) : null}
        {linea !== '' ? <Texto variante="apoyo">{linea}</Texto> : null}
        {historia !== null && historia !== undefined && historia !== '' ? (
          <Texto variante="cuerpo">{historia}</Texto>
        ) : null}

        {zonaLat !== null && zonaLat !== undefined && zonaLon !== null && zonaLon !== undefined && zonaRadioM !== null && zonaRadioM !== undefined ? (
          <MapaZona lat={zonaLat} lon={zonaLon} radioM={zonaRadioM} />
        ) : null}

        {servicios !== undefined && servicios.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
            {servicios.map((s) => (
              <Insignia key={s} capa="cuidado" etiqueta={s} tamaño="sm" />
            ))}
          </View>
        ) : null}

        {pie !== undefined ? <View style={{ marginTop: spacing[2] }}>{pie}</View> : null}
      </View>
    </View>
  )
}

/** Radio de la portada cuando el consumidor la monta EN TARJETA en vez
 *  de a sangre. Se exporta para que nadie lo estime: la portada sangrada
 *  no lleva radio, y la que vive dentro de una tarjeta hereda el de la
 *  casa. */
export const RADIO_PORTADA_EN_TARJETA = radius.md
