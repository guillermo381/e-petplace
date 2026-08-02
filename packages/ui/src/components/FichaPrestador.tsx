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

import type { ReactNode } from 'react'
import { Image, View } from 'react-native'

import { Boton } from './Boton'
import { Insignia } from './Insignia'
import { LogoNegocio } from './LogoNegocio'
import { Texto } from './Texto'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

/** Alto de la portada. Sangra a los lados: la pieza NO le pone padding
 *  horizontal — el borde de la portada es el borde de la pantalla. */
const ALTO_PORTADA = 176
/** Cuánto monta la firma sobre la portada. El logo pisa el borde: es lo
 *  que ata la identidad a su fondo en vez de apilar dos bloques sueltos. */
const MONTA_FIRMA = 28
const LADO_FIRMA = 72

export interface FichaPrestadorProps {
  /** `nombre_comercial`. Sin él no se pinta el título ni el monograma. */
  nombre?: string | null
  /** Logo YA RESUELTO (`resolverUrlLogoNegocio(prestadores.foto_url)`).
   *  Sin él, `LogoNegocio` cae a su monograma honesto — jamás a huella. */
  logoUrl?: string | null
  /** Portadas ya resueltas. Vacío o ausente = el estado vacío de abajo. */
  portadas?: string[]
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
  logoUrl,
  portadas,
  ciudad,
  oficio,
  historia,
  servicios,
  onAgregarFotos,
  pie,
}: FichaPrestadorProps = {}) {
  const { theme } = useTheme()

  const conPortada = portadas !== undefined && portadas.length > 0
  const montaVacio = !conPortada && onAgregarFotos !== undefined
  // LA LÍNEA COMPUESTA: se arma con lo que EXISTE. Con los dos, van
  // separados por el punto medio; con uno, va ese solo; sin ninguno, la
  // línea no se pinta — jamás nace un "Sin oficio", que sería inventar
  // una ausencia donde la familia simplemente no vería nada.
  const linea = [oficio, ciudad].filter((x) => x !== null && x !== undefined && x !== '').join(' · ')

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg.base }}>
      {conPortada ? (
        <Image
          source={{ uri: portadas[0] }}
          style={{ width: '100%', height: ALTO_PORTADA }}
          resizeMode="cover"
          accessibilityRole="image"
          accessibilityLabel={nombre ? `Portada de ${nombre}` : 'Portada del negocio'}
        />
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

        {nombre ? <Texto variante="titulo">{nombre}</Texto> : null}
        {linea !== '' ? <Texto variante="apoyo">{linea}</Texto> : null}
        {historia !== null && historia !== undefined && historia !== '' ? (
          <Texto variante="cuerpo">{historia}</Texto>
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
