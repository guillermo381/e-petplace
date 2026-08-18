/**
 * GlifoConContador — UN GLIFO CON SU NÚMERO ENCIMA (S100b-B).
 *
 * ═══════════════════════════════════════════════════════════════════
 * POR QUÉ NACE, y el pedido vino **con su límite medido**: la pista D
 * montó la canasta del carrito (G-14) y **no pudo hacer el contador**.
 * Su literal: *«`Texto` no tiene color inverso —sus seis son
 * semánticos— y el par que la casa sí tiene para texto sobre acento
 * pleno vive adentro de `Boton` y no está expuesto. Pintar el número
 * con un color crudo para que se parezca al badge sería inventar
 * contraste sin medirlo, en la pieza más pública de la tienda.»*
 *
 * 🔴 **Ese freno fue correcto y por eso esta pieza existe.** *Un
 * consumidor que necesita un color que la casa no expone tiene dos
 * salidas: inventarlo —y ahí nace un contraste que ningún gate mide— o
 * pedir la pieza. Pidió la pieza.*
 * ═══════════════════════════════════════════════════════════════════
 *
 * ── LEY 11 · POR QUÉ NACE Y NO SE REUSA `Insignia` ─────────────────
 * Relevado antes de crear: `Insignia` dice **un ESTADO con palabras**
 * («Al día», «Preparando») y vive EN EL FLUJO del contenido. Esto es
 * **un NÚMERO montado SOBRE otro elemento**, y su trabajo no es
 * calificar sino **contar**. Montar `Insignia` acá obligaría a pasarle
 * un `estado` inventado para un dato que no tiene estado — *mentir una
 * prop para lograr una combinación legítima*, que es cuando la casa ya
 * declaró que **el defecto es de la pieza** (§12.2).
 *
 * ── EL COLOR: SE REUSA UN PAR YA MEDIDO, NO SE INVENTA UNO ─────────
 * `accent.control` de fondo con el número en `bg.base` — **exactamente
 * el par que `TarjetaProducto` ya usa en su timbre `+`**, y que por eso
 * ya está en el gate de contraste. *Un par nuevo acá habría sumado una
 * medición; reusar el que la casa ya firmó no suma ninguna.*
 *
 * ── LO QUE NO HACE ─────────────────────────────────────────────────
 * No sabe de carrito ni de avisos: recibe un número. **No anima** — un
 * contador que salta pide mirarlo, y la ley de la casa reserva el
 * movimiento para lo que la persona hizo (N10, lista cerrada).
 * **Cero en `0` no se dibuja** (19.9: el nulo no se pinta; *un cero en
 * un contador es ruido con forma de dato*).
 */

import { Text, View } from 'react-native'

import { Icono, type IconoNombre } from './Icono'
import { radius } from '../tokens/radius'
import { typography } from '../tokens/typography'
import { useTheme } from '../ThemeProvider'

/** El disco. 18 sostiene dos cifras sin apretarlas y no tapa el glifo. */
const DISCO = 18
/** Arriba de esto el número deja de leerse a este tamaño — y **la salida
 *  es decir «muchos», jamás encoger la letra**: un contador ilegible no
 *  cuenta nada. */
const TOPE = 99

export interface GlifoConContadorProps {
  nombre: IconoNombre
  /** El tamaño del glifo. El disco NO escala con él a propósito: es una
   *  señal, y una señal que crece con su soporte deja de ser constante. */
  tamano?: number
  /** Cuántos. **`0` no dibuja disco** — ver la nota de la cabecera. */
  cuenta: number
  /**
   * 🔴 EL LABEL COMPLETO, y es OBLIGATORIO. La voz la trae quien monta
   * —*«Carrito, 3 productos»*— porque **esta pieza no sabe qué está
   * contando**. Sin él, un lector de pantalla anuncia un número suelto.
   */
  etiqueta: string
}

export function GlifoConContador({ nombre, tamano = 24, cuenta, etiqueta }: GlifoConContadorProps) {
  const { theme } = useTheme()
  const hay = cuenta > 0
  const texto = cuenta > TOPE ? `${TOPE}+` : String(cuenta)

  return (
    <View
      accessible
      accessibilityLabel={etiqueta}
      // El número va en el label, no como texto suelto: el lector cuenta
      // la misma historia que el ojo, una sola vez.
      accessibilityRole="image"
      style={{ width: tamano, height: tamano }}
    >
      <Icono nombre={nombre} tamano={tamano} />

      {hay ? (
        <View
          // `importantForAccessibility` no hace falta: el contenedor ya es
          // `accessible`, así que este subárbol no se anuncia aparte.
          style={{
            position: 'absolute',
            // Sobresale a propósito: un disco contenido adentro del glifo
            // le come el dibujo, y el glifo es lo que dice QUÉ se cuenta.
            top: -DISCO / 3,
            right: -DISCO / 3,
            minWidth: DISCO,
            height: DISCO,
            paddingHorizontal: 4,
            borderRadius: radius.full,
            backgroundColor: theme.accent.control,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: typography.family.sans.medium,
              fontSize: typography.size.xs,
              lineHeight: DISCO,
              // El par ya medido (ver la cabecera): número en papel sobre
              // el acento. No se inventa un color acá.
              color: theme.bg.base,
              // Tabular: con 1 y 2 cifras el disco no baila al cambiar.
              fontVariant: ['tabular-nums'],
            }}
          >
            {texto}
          </Text>
        </View>
      ) : null}
    </View>
  )
}
