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

import { Boton } from './Boton'
import { Insignia } from './Insignia'
import { LogoNegocio } from './LogoNegocio'
import { MapaZona } from './MapaZona'
import { Texto } from './Texto'
import { opacity } from '../tokens/opacity'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { useTheme } from '../ThemeProvider'

/** Alto de la portada. Sangra a los lados: la pieza NO le pone padding
 *  horizontal — el borde de la portada es el borde de la pantalla. */
const ALTO_PORTADA = 176
/** Cuánto monta la firma sobre la portada. El logo pisa el borde: es lo
 *  que ata la identidad a su fondo en vez de apilar dos bloques sueltos. */
const MONTA_FIRMA = 28
const LADO_FIRMA = 72
/** Diámetro del punto de paginación. */
const PUNTO = 10
/** Velo del ▶ sobre el póster del clip. Tinta con alfa: se define ACÁ y
 *  no se recibe — la app jamás pasa un color crudo (Ley 1). */
const VELO_CLIP = 'rgba(29,26,46,0.55)'

export interface FichaPrestadorProps {
  /** `nombre_comercial`. Sin él no se pinta el título ni el monograma. */
  nombre?: string | null
  /** S85-B17 · LA INSIGNIA DE COHORTE, junto al nombre (firma de mesa).
   *  Recibe la ETIQUETA YA ARMADA ("Prestador fundador · 2026"), no un
   *  booleano: el año es DATO y esta pieza no lo fabrica — el mismo
   *  contrato que `Insignia.etiqueta`, que también exige la palabra desde
   *  afuera. `null`/ausente = no hay distinción y no se monta nada: un
   *  negocio sin cohorte no ve un hueco.
   *
   *  POR QUÉ JUNTO AL NOMBRE Y NO SOBRE LA FOTO (el porqué de la mesa,
   *  escrito acá porque es donde se lee al mover algo): sobre la foto una
   *  pastilla habla del estado de HOY —ése es el precedente «Al día»— y la
   *  cohorte es un hecho FIJO. Y esta ficha es la vitrina pública: el
   *  nombre siempre está, la foto puede faltar. */
  cohorte?: string | null
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
  clipPoster?: string | null
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
  /** El anticipo del espejo ("así se va a ver"), al pie. Del consumidor:
   *  la pieza no sabe si la están mirando en un espejo o en una vitrina. */
  pie?: ReactNode
}

export function FichaPrestador({
  nombre,
  cohorte,
  logoUrl,
  portadas,
  clipPoster,
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
  const [ancho, setAncho] = useState(0)
  const [activa, setActiva] = useState(0)
  const riel = useRef<ScrollView>(null)

  // LAS POSICIONES DEL CARRUSEL: las fotos en su orden + el clip al
  // final si hay póster. Una lista sola, porque el clip es "una posición
  // más" y no un caso aparte — tratarlo aparte es cómo nacen dos
  // composiciones para la misma tira.
  const posiciones: { url: string; esClip: boolean }[] = [
    ...(portadas ?? []).map((url) => ({ url, esClip: false })),
    ...(clipPoster !== null && clipPoster !== undefined && clipPoster !== ''
      ? [{ url: clipPoster, esClip: true }]
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
            style={{ height: ALTO_PORTADA }}
          >
            {tira.map((pos, i) => (
              <View key={`${pos.url}-${i}`} style={{ width: ancho, height: ALTO_PORTADA }}>
                <Image
                  source={{ uri: pos.url }}
                  style={{ width: ancho, height: ALTO_PORTADA }}
                  resizeMode="cover"
                  accessibilityRole="image"
                  accessibilityLabel={
                    pos.esClip
                      ? `Video de ${nombre ?? 'el negocio'}`
                      : `Foto ${indiceReal(i) + 1} de ${N}, ${nombre ?? 'el negocio'}`
                  }
                />
                {pos.esClip ? (
                  // El ▶ de la lámina: MARCA el lugar, no reproduce. Sin
                  // `accessibilityRole="button"` a propósito — prometer un
                  // control que no hace nada es peor que no tenerlo.
                  <View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: 0,
                      right: 0,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: radius.full,
                        backgroundColor: VELO_CLIP,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: theme.text.onGradient, fontSize: typography.size.lg }}>▶</Text>
                    </View>
                  </View>
                ) : null}
              </View>
            ))}
          </ScrollView>

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
            height: ALTO_PORTADA,
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], flexWrap: 'wrap' }}>
            <Texto variante="titulo">{nombre}</Texto>
            {cohorte !== null && cohorte !== undefined && cohorte !== '' ? (
              <Insignia distincion="cohorte" etiqueta={cohorte} tamaño="sm" />
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
