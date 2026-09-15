/**
 * TarjetaPrestador — LA FILA DE «CERCA DE TI».
 *
 * Retrato a la izquierda, nombre, oficio y distancia, la calificación
 * debajo, y a la derecha el precio «desde» con su «Ver». **Toda la tarjeta
 * se toca.**
 *
 * ── NO ES `FichaPrestador`, Y NO SE FUSIONAN ──────────────────────────
 * `FichaPrestador` es **la vitrina**: carrusel de portadas, clip, mapa de
 * zona, historia, servicios, cohorte. Existe para que el espejo del
 * prestador y lo que ve la familia **no puedan divergir**, y esa es su
 * razón entera. Esto es **una fila de resultados**: lo que hace falta para
 * decidir si tocar. *Meterle a la vitrina un modo compacto la volvería una
 * pieza con dos anatomías, y el día que alguien cambie una se rompe la
 * otra — que es exactamente el defecto del que la vitrina nació.*
 *
 * ── TODA LA TARJETA SE TOCA, Y EL «VER» NO ES UN SEGUNDO DESTINO ──────
 * 🔴 El botón y la tarjeta llevan al MISMO lugar. *Dos áreas táctiles con
 * dos destinos en una fila es cómo se toca lo que no se quería tocar.* El
 * «Ver» existe para **decir que la fila se toca** —la afordancia que una
 * tarjeta plana no tiene—, así que es `apoyada`: se lee como etiqueta y no
 * compite con el CTA de la pantalla (Ley 5). ⚠️ Y por eso **no lleva
 * `onPress` propio**: no está en el árbol de accesibilidad como control
 * aparte; el lector anuncia la fila una vez, con el nombre del negocio.
 *
 * ── EL PRECIO DICE «DESDE» O NO DICE NADA ─────────────────────────────
 * La escalera del precio honesto (S57, `DISEÑO_EXPERIENCIA`): **un agregado
 * que varía dice «desde»**. Acá varía siempre —la tarifa depende del
 * servicio y de la talla— así que el rótulo es parte de la pieza y no una
 * decisión de la pantalla. *Un número sin «desde» en una lista es una
 * promesa que el checkout va a desmentir.*
 *
 * ── LA CALIFICACIÓN SIN RESEÑAS NO SE DIBUJA ──────────────────────────
 * 🔴 `resenas === 0` ⇒ **la línea no existe**, ni siquiera como «0
 * reseñas». *Un negocio nuevo no está peor calificado: está sin calificar,
 * y un cero con una estrella al lado dice lo primero.* Es la misma doctrina
 * con la que la casa mide la cadena de selección: **sin datos, el orden
 * colapsa a antigüedad y hay que decirlo, no fingir un puntaje.**
 */

import { type ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import Animated from 'react-native-reanimated'

import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { Icono } from './Icono'
import { PrecioText } from './PrecioText'
import { Boton } from './Boton'
import { Tarjeta } from './Tarjeta'
import { Texto } from './Texto'
import { usePresionado } from './usePresionado'

/** El lado del retrato. Vive acá: es geometría de esta fila. */
const RETRATO = 56

export interface TarjetaPrestadorProps {
  nombre: string
  /** El retrato: una foto o el personaje. **El CONTENIDO lo elige la
   *  pantalla —quién tiene foto y quién no lo sabe ella, y una pieza que
   *  además resuelve storage deja de poder usarse donde el dato ya vino
   *  resuelto—; la FORMA la garantiza la pieza.**
   *
   *  🔴 **Y eso último lo enseñó la captura.** Monté `AvatarMascota` en la
   *  maqueta y salió un **squircle**: esa pieza es squircle 32 % por diseño
   *  (S61-A10) y el encargo dice *«foto o personaje a la izquierda EN
   *  CÍRCULO»*. *Si la forma dependiera de qué nodo manda cada pantalla, dos
   *  listas de la misma app tendrían retratos de distinta forma sin que
   *  nadie lo hubiera decidido.* La pieza lo recorta: lo que entre, sale
   *  redondo. */
  retrato: ReactNode
  /** Oficio y distancia, **ya en voz de familia y ya unidos**. Llega armada
   *  y no en dos props porque la pieza no sabe el idioma del separador ni
   *  qué hacer cuando falta la distancia; quien monta sí. */
  lineaOficio: string
  /** El promedio. `null` = sin calificar ⇒ **la línea no se dibuja**. */
  calificacion?: number | null
  /** Cuántas reseñas, ya en voz («12 reseñas»). Sin ella la línea tampoco
   *  se dibuja: *un promedio sin denominador es un número sin peso.* */
  vozResenas?: string | null
  /** El precio más bajo. `null` = **no se dibuja el bloque entero**, ni el
   *  «Ver»: *una fila que ofrece «Ver» sin decir desde cuánto obliga a
   *  entrar para averiguar el precio, que es lo que esta lista existe para
   *  evitar.* */
  desde?: number | null
  /** La palabra «desde» y la del botón, del diccionario de la app. */
  vozDesde: string
  vozVer: string
  onPress: () => void
}

export function TarjetaPrestador({
  nombre,
  retrato,
  lineaOficio,
  calificacion,
  vozResenas,
  desde,
  vozDesde,
  vozVer,
  onPress,
}: TarjetaPrestadorProps) {
  const presion = usePresionado()
  const hayCalificacion =
    calificacion !== null && calificacion !== undefined && vozResenas !== null && vozResenas !== undefined && vozResenas !== ''
  const hayPrecio = desde !== null && desde !== undefined

  return (
    <Pressable
      accessibilityRole="button"
      /* Una sola etiqueta con todo lo que la fila dice: *si el lector
         anuncia «Clínica Aurora» y después «Ver», quien no ve tiene que
         reconstruir a qué negocio pertenece ese «Ver».* */
      accessibilityLabel={[nombre, lineaOficio, hayCalificacion ? vozResenas : null]
        .filter((x): x is string => x !== null)
        .join('. ')}
      onPress={onPress}
      {...presion.handlers}
    >
      <Animated.View style={presion.estiloPresionado}>
        <Tarjeta>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
            {/* EL RECORTE — ver la nota de `retrato`. `overflow: 'hidden'`
                más el radio pleno: entre lo que entre, sale redondo. */}
            <View
              style={{
                width: RETRATO,
                height: RETRATO,
                borderRadius: radius.full,
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {retrato}
            </View>

            {/* `flex: 1` y `minWidth: 0`: sin el segundo, un nombre largo
                empuja al precio fuera de la tarjeta en vez de truncarse —
                en flexbox un hijo no baja de su ancho de contenido salvo que
                se lo permitan. */}
            <View style={{ flex: 1, minWidth: 0, gap: spacing[1] }}>
              <Texto variante="enfasis" numberOfLines={1}>
                {nombre}
              </Texto>
              <Texto variante="apoyo" color="secondary" numberOfLines={1}>
                {lineaOficio}
              </Texto>
              {hayCalificacion ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1] }}>
                  {/* La estrella va en `registro="glifo"` como el resto: el
                      color lo resuelve el tema, no esta pieza. */}
                  <Icono nombre="calificacion" tamano={14} registro="glifo" />
                  <Texto variante="dato">{calificacion.toFixed(1)}</Texto>
                  <Texto variante="apoyo" color="tertiary" numberOfLines={1}>
                    {vozResenas}
                  </Texto>
                </View>
              ) : null}
            </View>

            {hayPrecio ? (
              <View style={{ alignItems: 'flex-end', gap: spacing[1] }}>
                <Texto variante="apoyo" color="tertiary">
                  {vozDesde}
                </Texto>
                {/* `registro="cifra"` es Baloo — la escala de la casa para el
                    número que decide. */}
                <PrecioText valor={desde} registro="cifra" />
                {/* Sin `onPress`: es la afordancia de la fila, no un segundo
                    destino. `accessibilityElementsHidden` para que el lector
                    no lo anuncie como control aparte. */}
                <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                  <Boton variante="apoyada" tamaño="xs" etiqueta={vozVer} onPress={onPress} />
                </View>
              </View>
            ) : null}
          </View>
        </Tarjeta>
      </Animated.View>
    </Pressable>
  )
}
