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

type Base = {
  nombre: IconoNombre
  /** El tamaño del glifo. El disco NO escala con él a propósito: es una
   *  señal, y una señal que crece con su soporte deja de ser constante. */
  tamano?: number
  /** Cuántos. **`0` no dibuja disco** — ver la nota de la cabecera. */
  cuenta: number
}

/**
 * 🔴 QUIÉN ES EL NODO ACCESIBLE — UNIÓN DISCRIMINADA (S100b-B · reporte de
 * la pista D al montarla, **con su caso**).
 *
 * **El defecto que D encontró:** la pieza se declaraba `accessible` siempre,
 * y **su consumidor natural es un `Pressable`** —un contador de carrito
 * existe para tocarse—. Adentro de un tocable quedaban **DOS nodos
 * accesibles**: el que se toca y el de adentro, con la voz duplicada.
 *
 * **D resolvió bien lo urgente** (dejó el label en el `Pressable`, *porque
 * el que tiene que estar nombrado es el que se toca: un botón sin nombre no
 * se activa a ciegas*) y **declaró la redundancia en vez de esconderla**.
 * La decisión de contrato es de la pieza, y es ésta.
 *
 * **Por qué unión y no un `boolean` opcional:** con un flag suelto quedan
 * expresables los dos estados malos — *suelta y sin nombre* (muda para el
 * lector) y *anidada con nombre* (la voz duplicada que D midió). **Con la
 * unión ninguno de los dos compila.** Es el mismo movimiento que `compra`
 * en `TarjetaProducto` y que `SelectorDestinoItem`: *la forma hace
 * imposible el olvido, en vez de confiar en que nadie olvide.*
 */
export type GlifoConContadorProps = Base &
  (
    | {
        /** Suelta: **la pieza ES el nodo**, y por eso su voz es obligatoria
         *  — no sabe qué está contando, así que la trae quien la monta.
         *  *«Carrito, 3 productos»*, jamás un número suelto. */
        dentroDeTocable?: false
        etiqueta: string
      }
    | {
        /** Dentro de un `Pressable`/`Boton`: **la pieza se borra del árbol
         *  de accesibilidad** y el nombre lo pone el tocable, que es el que
         *  se activa. **No acepta `etiqueta`**: dos voces para un gesto es
         *  exactamente lo que este brazo existe para impedir. */
        dentroDeTocable: true
        etiqueta?: never
      }
  )

export function GlifoConContador(props: GlifoConContadorProps) {
  const { nombre, tamano = 24, cuenta } = props
  const anidada = props.dentroDeTocable === true
  const { theme } = useTheme()
  const hay = cuenta > 0
  const texto = cuenta > TOPE ? `${TOPE}+` : String(cuenta)

  return (
    <View
      // Anidada: la pieza NO es nodo y su subárbol no se anuncia — el
      // tocable que la contiene ya tiene la voz. Suelta: ella es el nodo.
      accessible={!anidada}
      accessibilityLabel={anidada ? undefined : props.etiqueta}
      // El número va en el label, no como texto suelto: el lector cuenta
      // la misma historia que el ojo, una sola vez.
      accessibilityRole={anidada ? undefined : 'image'}
      importantForAccessibility={anidada ? 'no-hide-descendants' : 'auto'}
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
