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
 * ── EL COLOR (lote 13): EL DISCO ES UNO Y VIVE EN `disco-contador` ──
 * ⏪ Decía `accent.control` sobre `bg.base`, *«el par que `TarjetaProducto`
 * ya usa en su timbre +»*. **Era correcto y dejó de alcanzar** cuando el
 * founder pidió *«misma pieza para campana y carrito»*: ese par **cambia
 * con la casa**, así que en oscuro el «círculo magenta con número blanco»
 * salía ciruela con número lienzo. Hoy el disco es **magenta de acción con
 * blanco puro, fijo**, y lo dibuja un solo módulo.
 *
 * ── LO QUE NO HACE ─────────────────────────────────────────────────
 * No sabe de carrito ni de avisos: recibe un número. **No anima** — un
 * contador que salta pide mirarlo, y la ley de la casa reserva el
 * movimiento para lo que la persona hizo (N10, lista cerrada).
 * **Cero en `0` no se dibuja** (19.9: el nulo no se pinta; *un cero en
 * un contador es ruido con forma de dato*).
 */

import { View } from 'react-native'

import { DiscoContador } from './disco-contador'
import { Icono, type IconoNombre } from './Icono'

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
      {/* 🔴 **EL DISCO ES COMPARTIDO CON LA CAMPANA (lote 13).** Antes esta
          pieza dibujaba el suyo con `accent.control` sobre `bg.base`: un par
          medido, sí, **pero distinto del de la campana y distinto en cada
          casa**. *Dos contadores que se ven distinto no son «la misma señal
          en dos lugares»: son dos señales.* */}
      <DiscoContador cuenta={cuenta} />
    </View>
  )
}
