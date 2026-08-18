/**
 * CarritoFlotante — LA ÚNICA PUERTA AL CARRITO, y está donde llega el pulgar
 * (S100d-B · puntos 8, 9 y 12 del gate).
 *
 * ═══════════════════════════════════════════════════════════════════
 * **FIRMA DEL FOUNDER, verbatim y en dispositivo:** *«no puso un carrito
 * flotante abajo a la derecha en todas las pantallas; quedó arriba, muy
 * pequeño y con una huella ocre encima. **Hay que hacerlo mucho mejor**.»*
 * · punto 9: *«carrito flotante: no está»* · punto 12: *«al agregar se abre
 * un CTA de ver carrito, y debería abrir el carrito flotante».*
 * ═══════════════════════════════════════════════════════════════════
 *
 * ── ⑫ QUÉ SIGNIFICA «SE ABRE EL FLOTANTE», Y ES LO QUE ORDENA LA PIEZA ──
 * Hay dos lecturas y una sola sirve:
 *   ⛔ *«tocar el `+` te lleva al carrito»* — eso es **sacar a la familia de
 *      la vitrina justo cuando estaba comprando**. Agregar y navegar son dos
 *      actos y confundirlos cuesta el segundo producto.
 *   ✅ *«al agregar, lo que responde es el carrito flotante — y no aparece
 *      un CTA nuevo»*. **Con el carrito vacío esta pieza NO EXISTE**
 *      (`cuenta === 0` ⇒ no se dibuja: 19.9, el nulo no se pinta, y además
 *      no hay nada que abrir). **El primer `+` la hace ENTRAR.**
 *
 * ⇒ *La puerta al carrito no es una pantalla que se abre: es una puerta que
 * aparece cuando hay algo del otro lado.* Eso es literalmente «al agregar se
 * abre el flotante», y de paso mata el CTA de *«ver carrito»* que el founder
 * vio — **no porque se lo esconda, sino porque esta pieza hace su trabajo y
 * un segundo camino al mismo cuarto sobra** (N25: una sola puerta).
 *
 * ── 🔴 N25 SE COBRA: MUERE LA PUERTA DEL ENCABEZADO ────────────────────
 * La medición de S100c ubicó la canasta del techo en `x=[344,368] ·
 * y=[80,104]` — **el peor ángulo para un pulgar en un teléfono de 832 dp de
 * alto**, y encima con 23,8 dp de dibujo. **Las dos puertas no conviven:**
 * *dos caminos al mismo cuarto ya los matamos una vez en esta casa (el hub
 * del paseo, S60), y volvieron a nacer acá.*
 *
 * ⚠️ **EL MONTAJE Y EL RETIRO VAN EN EL MISMO COMMIT** (pedido a la pista C,
 * dueña de la vitrina): si se monta esta pieza y queda la del techo, hay dos
 * puertas; si se retira la del techo sin montar ésta, **no hay ninguna**.
 * *No es coordinación de cortesía: es el intervalo en el que la tienda no se
 * puede pagar.*
 *
 * ── DÓNDE VIVE Y POR QUÉ NO SE POSICIONA A MANO ───────────────────────
 * **Se pasa como `pie` de `PantallaConPie`.** No es un capricho de armado:
 * esa pieza **mide su pie y con esa misma medida reserva el scroll**, así
 * que **este disco no puede tapar la última tarjeta de la vitrina** — que es
 * exactamente el presupuesto que L-301 dejó en **42 dp** y que un flotante
 * absoluto se habría comido sin avisar.
 *
 * ```tsx
 * <PantallaConPie pie={<CarritoFlotante cuenta={unidades} onAbrir={…} etiqueta={…} />}>
 * ```
 * 🔴 **PASALA SUELTA, jamás envuelta en un `View` tuyo** — el `box-none` de
 * `PantallaConPie` cubre UNA capa y un envoltorio reabre la zona muerta de
 * gesto (R54). Por eso esta pieza **se alinea sola a la derecha**
 * (`alignSelf`) en vez de pedirle al consumidor un contenedor.
 *
 * ── EL COLOR: F-OCRE, Y EL PAR YA ESTABA MEDIDO ───────────────────────
 * Disco en `accent.cta` (el oro del CTA del cliente) con el glifo en
 * `accent.ctaTexto` (tinta) — **8.40 en claro, 9.96 en los dos temas**; el
 * blanco sobre el oro daba 2.02 y por eso no se usa. *Cero par nuevo, cero
 * medición nueva.* **F-OCRE** (18-ago-2026): la puerta al carrito es
 * **acción de compra**, y esa es la familia del ocre.
 *
 * **Memorial y prestador degradan solos:** `accent.cta` es tinta en memorial
 * (`getTheme` — un memorial no celebra) y tealDark en el prestador
 * (`lightOficio`). *Ningún color escrito acá.*
 *
 * ── EL CONTADOR: POR QUÉ NO ES `GlifoConContador` (Ley 11) ────────────
 * Relevado antes de decidir. `GlifoConContador` monta su disco en
 * **`accent.control` (magenta)**, que es el par correcto **sobre superficie
 * neutra** — su caso es el techo. **Acá el soporte es ocre**, y un disco
 * magenta sobre un disco ocre pone **los dos acentos de la casa peleando
 * dentro de un objeto de 56 dp**, que es justo lo que N26 pone como techo:
 * *dos acentos existen, pero no se apilan.*
 * ⇒ El contador va en **tinta con el número en papel**: el mismo par que la
 * casa ya usa, y que además **separa el disco del oro** por el mismo 8.40.
 * *No es otra pieza haciendo lo mismo: es otra física.*
 *
 * ── EL MOVIMIENTO ─────────────────────────────────────────────────────
 * **Entrada `estandar` (300) — el techo de Ley 6** — porque la pieza APARECE
 * y una aparición es lo único que puede pedir la mirada. **El contador NO
 * salta**: hereda la ley de `GlifoConContador` (*un contador que salta pide
 * mirarlo*). *El acuse de haber agregado ya lo da el stepper de la tarjeta,
 * que cambia de forma bajo el dedo; repetirlo acá sería avisar dos veces lo
 * mismo.*
 *
 * **`reduce-motion`:** la entrada usa las animaciones de layout de
 * Reanimated, que respetan la preferencia del sistema. **Sin la animación la
 * pieza sigue apareciendo** — el movimiento adorna la entrada, no la
 * produce, y por eso no hay nada que degradar a mano (N15).
 *
 * ── LO QUE NO HACE ────────────────────────────────────────────────────
 * No sabe de carrito (recibe un número y avisa un toque), no navega, no
 * decide en qué pantallas vive, y **no muestra el total en plata**: la
 * pregunta que contesta es *«¿cuánto llevo?»*, no *«¿cuánto va?»* — el monto
 * es del carrito, donde se puede leer con su desglose.
 */

import { Pressable, Text, View } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'

import { Icono } from './Icono'
import { motion } from '../tokens/motion'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { typography } from '../tokens/typography'
import { useTheme } from '../ThemeProvider'
import { usePresionado } from './usePresionado'

/** 56 — el disco. **No es N8 con holgura: es el tamaño de una puerta.** El
 *  founder midió la anterior como *«muy pequeño»* con 23,8 dp de dibujo; 44
 *  es el PISO de cualquier tocable y una puerta persistente no vive en el
 *  piso. 56 es además el tamaño que la industria fijó para este objeto. */
const DISCO = 56
/** El glifo adentro. 26 deja marco sin que el carrito flote perdido. */
const GLIFO = 26
/** El contador. 20 sostiene dos cifras; ver `TOPE`. */
const CONTADOR = 20
/** Arriba de esto el número deja de leerse y **la salida es decir «muchos»,
 *  jamás encoger la letra** — la misma ley que `GlifoConContador`. */
const TOPE = 99

export interface CarritoFlotanteProps {
  /** Unidades en el carrito. **`0` ⇒ la pieza no se dibuja** (ver cabecera). */
  cuenta: number
  onAbrir: () => void
  /** La voz de la casa, compuesta por la pantalla —*«Ver tu carrito, 3
   *  productos»*—. **Obligatoria:** el nodo que se toca es éste y un botón
   *  sin nombre no se activa a ciegas. */
  etiqueta: string
}

export function CarritoFlotante({ cuenta, onAbrir, etiqueta }: CarritoFlotanteProps) {
  const { theme } = useTheme()
  const { handlers, estiloPresionado } = usePresionado()

  if (cuenta <= 0) return null

  return (
    <Animated.View
      entering={FadeIn.duration(motion.duration.estandar)}
      // La pieza se alinea SOLA — ver la nota de `box-none` en la cabecera:
      // pedirle un contenedor al consumidor reabriría la zona muerta.
      style={[{ alignSelf: 'flex-end' }, estiloPresionado]}
    >
      <Pressable
        onPress={onAbrir}
        {...handlers}
        accessibilityRole="button"
        accessibilityLabel={etiqueta}
        style={{
          width: DISCO,
          height: DISCO,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.accent.cta,
          // El disco se apoya sobre el papel y necesita despegarse de él: el
          // oro NO se recorta contra papel (1.55 medido en S82-B), y por eso
          // el propio slot del CTA nace con `ctaElevado`.
          boxShadow: theme.elevacion.elevada,
        }}
      >
        {/* El carrito CON RUEDAS y **sin huella** — punto 8: *«con una huella
            ocre encima»*. La huella salió del glifo en esta misma vuelta (ver
            `Icono`), así que acá no hay nada que apagar: el registry ya
            entrega el dibujo correcto. */}
        <Icono nombre="carrito" tamano={GLIFO} registro="tinta" tinta={theme.accent.ctaTexto} />

        {/* EL CONTADOR — tinta con el número en papel (ver la cabecera).
            Sale del disco lo justo para leerse como insignia y no como parte
            del glifo. */}
        <View
          style={{
            position: 'absolute',
            top: -spacing[1],
            right: -spacing[1],
            minWidth: CONTADOR,
            height: CONTADOR,
            paddingHorizontal: spacing[1],
            borderRadius: radius.full,
            backgroundColor: theme.text.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              // dato de máquina: mono tabular (Ley 3)
              fontFamily: typography.family.mono.regular,
              fontSize: typography.size.xs,
              fontVariant: ['tabular-nums'],
              letterSpacing: typography.tracking.mono,
              color: theme.bg.base,
            }}
          >
            {cuenta > TOPE ? `${TOPE}+` : cuenta}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  )
}
