/**
 * TarjetaProducto — UN PRODUCTO EN LA VITRINA, y el `+` que lo agrega
 * sin abrir nada (S100-B).
 *
 * ═══════════════════════════════════════════════════════════════════
 * LA FIRMA QUE LA ORDENA (founder, 17-ago): **premium · vitrina a DOS
 * columnas · AGREGAR SIN ABRIR DETALLE.**
 * El mecanismo se toma de **Instacart** (grid + quick-add); lo que su
 * superficie tiene y nuestra ley prohíbe —rankings, urgencia, moneda
 * visible— **queda entero afuera** (§0.2 de `DIRECCION_DISEÑO_S99`).
 * ═══════════════════════════════════════════════════════════════════
 *
 * ── LEY 11 · POR QUÉ NACE Y NO SE REUSA `Baldosa` ──────────────────
 * Relevado antes de crear: `Baldosa` es **la pieza de lo que se ELIGE**
 * y su contrato **exige `glifo` y `capa`** — un canto de CATEGORÍA de
 * oficio y un glifo de SERVICIO (Ley 10/12). Un saco de alimento no
 * tiene oficio ni servicio: **tiene foto, precio y stock.** Montarlo en
 * `Baldosa` obligaría a inventarle una capa, que es *mentir una prop
 * para lograr una combinación legítima* — y la casa ya declaró que
 * cuando eso pasa **el defecto es de la pieza** (§12.2, S91).
 *
 * ✅ **Lo que SÍ se reusa, y es lo que importaba: la GRILLA.** El patrón
 * de dos columnas sale de `grilla-de-dos.ts` —la misma geometría medida
 * que usa `Baldosa`—, así que las dos familias de tarjeta caen en la
 * misma retícula sin que nadie las sincronice a mano.
 *
 * ── EL `+` ES EL TIMBRE DE LA CASA ─────────────────────────────────
 * **Siempre en la misma esquina** (abajo a la derecha), en todas las
 * tarjetas, sin importar el alto del nombre. *La mano lo encuentra sin
 * mirar* — y por eso su posición es **ley de la pieza y no composición
 * del consumidor**: nadie lo re-ubica.
 *
 * **Al agregar, el `+` MUTA A STEPPER en el lugar** (`− 1 +`), 150 ms —
 * `motion.duration.fast`, la banda micro de N10. **No aparece un control
 * nuevo al lado: el mismo control cambia de forma**, que es lo que hace
 * que la acción se sienta directa y no como un formulario.
 *
 * ── 🔴 EL NOMBRE: DOS LÍNEAS MÁXIMO — adjudicación de mesa ─────────
 * C midió el catálogo real (563 nombres): **42 % EN MAYÚSCULAS** ·
 * **18 % pasan los 40 caracteres** · **máximo 81** · y dos categorías
 * donde es la norma (`acondicionador_agua` 88 %, `higiene` 45 %).
 *
 * ⏪ **Mi primera lectura fue que la tarjeta quedaba chica** y dejé el
 * nombre creciendo sin techo (precedente `Celda.tituloEntero`).
 * **LA MESA LO DIO VUELTA, y su razón es mejor que la mía:** esos
 * números **no dicen que la tarjeta sea chica — dicen que esos nombres
 * no están curados.** *«Acondicionador de agua para acuario Marca X
 * 250 ml» es un nombre de CATÁLOGO, no un nombre de VITRINA.*
 *
 * ⇒ **Las dos columnas se sostienen. Nombre curado en 2 líneas · la
 * presentación en SU PROPIA línea** (jamás compitiendo con el nombre
 * por el mismo renglón, porque **la presentación es dato que decide la
 * compra**) · **el nombre largo completo vive en la ficha.**
 * ⛔ Prohibido resolverlo encogiendo la letra o truncando la
 * presentación.
 *
 * > *Dimensionar la pieza para el peor dato sin curar es dejar que el
 * > dato malo decida la forma de la casa.* La medición seguía siendo
 * > correcta; lo que estaba mal era **qué concluía de ella**.
 *
 * ⚠️ **LA CONSECUENCIA HONESTA, declarada y no escondida: hasta que los
 * nombres se curen, ~18 % se va a ver cortado en la vitrina** (y en
 * `acondicionador_agua`, casi todos). **Eso es deuda de DATOS con dueño
 * fuera de esta pieza, no un defecto de forma** — y se dice acá para
 * que nadie lo lea como que la tarjeta falla.
 *
 * ✅ **EL PRECIO Y EL `+` SE ANCLAN ABAJO** (`marginTop: 'auto'`). Las
 * dos tarjetas de una fila comparten alto, así que **los precios quedan
 * alineados aunque un nombre ocupe una línea y el otro dos.** *Sin ese
 * ancla cada precio flota a la altura que le tocó, y la columna deja de
 * poder compararse de un vistazo — que es para lo que existe la grilla.*
 *
 * ── SIN STOCK: EL CARTEL VA EN LA PUERTA ───────────────────────────
 * Foto atenuada + etiqueta **DENTRO de la tarjeta**, y el `+` no se
 * dibuja. *El cartel de cerrado va en la puerta del local, no en la
 * vereda:* una lista que avisa la falta en otro lado obliga a leer dos
 * lugares para saber si se puede comprar.
 *
 * 🔴 **`hayStock` ES BOOLEANO Y JAMÁS UN NÚMERO** (firma S99): la
 * familia necesita *«¿puedo comprar esto?»*, no el inventario ajeno.
 * La prop no acepta cantidad **por construcción** — así el número no
 * puede llegar a esta superficie ni por descuido.
 *
 * ── LO QUE ESTA PIEZA NO HACE ──────────────────────────────────────
 * No sabe de carrito (recibe `cantidad` y avisa), no formatea precio
 * (`PrecioText`), no decide el orden de la grilla, y **no muestra
 * composición ni alérgenos**: no entran sin volverse ilegibles, y
 * **medio dato de alergia es peor que ninguno** — viven en la ficha, a
 * un toque (N19 ④).
 */

import { Image, Pressable, Text, View } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'

import { PrecioText } from './PrecioText'
import { StepperCantidad } from './StepperCantidad'
import { Texto } from './Texto'
import { usePresionado } from './usePresionado'
import { motion } from '../tokens/motion'
import { opacity } from '../tokens/opacity'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { useTheme } from '../ThemeProvider'
import { useTraduccionUi } from '../i18n'

/** La foto manda 4:3, la misma relación que la portada de la vitrina
 *  (§12.1): **con relación fija el marco existe antes que la foto**, así
 *  que la grilla no salta al cargar (N16 ③). */
const RELACION_FOTO = 4 / 3
/** El techo del stepper en la vitrina. Comprar 30 sacos es un caso de
 *  ficha, no de grilla: acá el gesto es «lo quiero», no «cuántos». */
const TOPE_EN_VITRINA = 12

export interface TarjetaProductoProps {
  nombre: string
  /** «2.3 kg», «Sobre 85 g» — el dato que distingue dos filas del mismo
   *  producto. Va junto al nombre porque **sin él dos variantes se ven
   *  idénticas** (N19 ②). */
  presentacion?: string
  precio: number | null
  /** Ya formateado — ver `PrecioText.porUnidad`. */
  precioPorUnidad?: string
  fotoUrl?: string
  /** 🔴 BOOLEANO, jamás un número (ver la cabecera). */
  hayStock: boolean
  /** Cuántos hay en el carrito. `0` = el control es el `+`. */
  cantidad: number
  /** El `+`. Con `cantidad > 0` la pieza monta el stepper y usa
   *  `onCambiarCantidad` en su lugar. */
  onAgregar: () => void
  onCambiarCantidad: (cantidad: number) => void
  /** Abrir la ficha. La FOTO y el NOMBRE llevan acá; el `+` no. */
  onPress: () => void
}

export function TarjetaProducto({
  nombre,
  presentacion,
  precio,
  precioPorUnidad,
  fotoUrl,
  hayStock,
  cantidad,
  onAgregar,
  onCambiarCantidad,
  onPress,
}: TarjetaProductoProps) {
  const { theme } = useTheme()
  const { t } = useTraduccionUi()
  // API real de la pieza, verificada contra su fuente: expone
  // `handlers` + `estiloPresionado` (no un `estilo` suelto).
  const { handlers, estiloPresionado } = usePresionado()

  return (
    <Animated.View style={estiloPresionado}>
      <Pressable
        onPress={onPress}
        {...handlers}
        accessibilityRole="button"
        accessibilityLabel={presentacion === undefined ? nombre : `${nombre}, ${presentacion}`}
        style={{
          // `flex: 1` es lo que deja que la tarjeta ocupe el alto de su
          // fila: sin él, el ancla de abajo no tiene contra qué anclar.
          flex: 1,
          backgroundColor: theme.bg.card,
          borderRadius: radius.lg,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: theme.bg.border,
        }}
      >
        {/* LA FOTO — a sangre arriba, relación fija (ver RELACION_FOTO). */}
        <View
          style={{
            aspectRatio: RELACION_FOTO,
            backgroundColor: theme.bg.hundido,
            opacity: hayStock ? 1 : opacity.disabled,
          }}
        >
          {fotoUrl === undefined ? null : (
            <Image source={{ uri: fotoUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          )}

          {/* Sin stock: el cartel va EN la puerta (ver la cabecera). */}
          {hayStock ? null : (
            <View
              style={{
                position: 'absolute',
                left: spacing[2],
                bottom: spacing[2],
                paddingHorizontal: spacing[2],
                paddingVertical: spacing[1],
                borderRadius: radius.sm,
                backgroundColor: theme.bg.base,
              }}
            >
              <Texto variante="apoyo">{t('tarjetaProducto.sinStock')}</Texto>
            </View>
          )}
        </View>

        <View style={{ flex: 1, padding: spacing[3], gap: spacing[1] }}>
          {/* EL NOMBRE — DOS LÍNEAS, techo de mesa (ver la cabecera).
              El nombre completo vive en la ficha, a un toque. */}
          <Texto variante="cuerpo" numberOfLines={2}>
            {nombre}
          </Texto>

          {/* LA PRESENTACIÓN, EN SU PROPIA LÍNEA y jamás pegada al
              nombre: es el dato que distingue dos variantes del mismo
              producto, así que compartir renglón con un nombre que
              puede ocupar dos líneas la volvería lo primero que se
              pierde. Nunca se trunca. */}
          {presentacion === undefined ? null : (
            <Texto variante="apoyo">{presentacion}</Texto>
          )}

          {/* EL ANCLA — esto es lo que alinea los precios de una fila
              aunque los nombres midan distinto. Ver la cabecera. */}
          <View
            style={{
              marginTop: 'auto',
              paddingTop: spacing[2],
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: spacing[2],
            }}
          >
            <PrecioText valor={precio} registro="vitrina" porUnidad={precioPorUnidad} />

            {/* EL TIMBRE. Siempre en esta esquina — ley de la pieza. */}
            {!hayStock ? null : cantidad === 0 ? (
              <Pressable
                onPress={onAgregar}
                accessibilityRole="button"
                accessibilityLabel={t('tarjetaProducto.agregar', { nombre })}
                hitSlop={8}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: radius.full,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.accent.control,
                }}
              >
                {/* El signo va sobre el acento: el papel es el contraste
                    que la casa ya usa para lo lleno (mismo criterio que
                    el nodo lleno de `EscaleraEstados`). `Texto` no tiene
                    color sobre-acento y no se le inventa uno acá: eso
                    sería ensanchar una pieza ajena de paso. */}
                <Text
                  style={{
                    fontFamily: typography.family.sans.bold,
                    fontSize: typography.size.md,
                    lineHeight: 24,
                    color: theme.bg.base,
                  }}
                >
                  +
                </Text>
              </Pressable>
            ) : (
              // La MUTACIÓN: el mismo control cambia de forma, no aparece
              // otro al lado. `fast` = 150, la banda micro de N10.
              <Animated.View entering={FadeIn.duration(motion.duration.fast)}>
                <StepperCantidad
                  valor={cantidad}
                  min={0}
                  max={TOPE_EN_VITRINA}
                  onCambio={onCambiarCantidad}
                  etiqueta={t('tarjetaProducto.cantidad', { nombre })}
                />
              </Animated.View>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  )
}
