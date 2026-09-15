/**
 * GrillaSubservicios — LO QUE UN OFICIO OFRECE, en dos columnas.
 *
 * Tarjetas blancas con el glifo en ciruela arriba y el nombre debajo, dos
 * por fila, **del mismo alto por fila**.
 *
 * ── EL ALTO IGUAL NO SE PIDE: SE DERIVA ───────────────────────────────
 * 🔴 La pieza no recibe un alto ni lo mide con `onLayout`. Cada fila es un
 * `flexDirection: 'row'` con `alignItems: 'stretch'`, así que **las dos
 * tarjetas de una fila miden lo que mide la más alta, por construcción**.
 * *Un alto fijo acierta hasta el primer nombre de tres líneas; un alto
 * medido llega un frame tarde y la grilla salta.* Es la misma cura que
 * `TarjetaProducto` pagó en la rejilla de la Despensa.
 *
 * ⚠️ **Y por eso la grilla se arma por FILAS y no con `flexWrap`.** Con
 * `flexWrap` los hijos no se estiran entre sí: cada tarjeta mide lo suyo y
 * la fila queda despareja. *El envoltorio que parece equivalente es el que
 * rompe justo lo que esta pieza promete.*
 *
 * ── EL NOMBRE PUEDE SER DE DOS LÍNEAS, y está bien ────────────────────
 * Al revés que la fila de la costura —donde **una** palabra es la regla y
 * el corte es la señal—, acá la tarjeta tiene ancho de media pantalla y los
 * subservicios se llaman como se llaman («Baño y corte», «Consulta
 * general»). *Forzar una palabra acá obligaría a inventarle nombres al
 * catálogo, que es peor que una segunda línea.* Tope de dos: con tres, la
 * fila entera crece y lo que se ve son dos tarjetas altas y vacías.
 */

import { Pressable, View } from 'react-native'
import Animated from 'react-native-reanimated'

import { spacing } from '../tokens/spacing'
import { Icono, type IconoNombre } from './Icono'
import { Tarjeta } from './Tarjeta'
import { Texto } from './Texto'
import { usePresionado } from './usePresionado'

export interface Subservicio {
  clave: string
  /** El glifo, resuelto por quien monta. La pieza no traduce. */
  glifo: IconoNombre
  nombre: string
}

export interface GrillaSubserviciosProps {
  subservicios: Subservicio[]
  onElegir: (clave: string) => void
}

function Celda({ s, onElegir }: { s: Subservicio; onElegir: () => void }) {
  const presion = usePresionado()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={s.nombre}
      onPress={onElegir}
      /* `flex: 1` acá y `stretch` en la fila: los dos juntos son lo que
         iguala el alto. Uno solo no alcanza. */
      style={{ flex: 1 }}
      {...presion.handlers}
    >
      <Animated.View style={[presion.estiloPresionado, { flex: 1 }]}>
        <Tarjeta>
          <View style={{ alignItems: 'center', gap: spacing[2], paddingVertical: spacing[2] }}>
            <Icono nombre={s.glifo} tamano={30} registro="glifo" montaje="control" />
            <Texto variante="enfasis" centrado numberOfLines={2}>
              {s.nombre}
            </Texto>
          </View>
        </Tarjeta>
      </Animated.View>
    </Pressable>
  )
}

export function GrillaSubservicios({ subservicios, onElegir }: GrillaSubserviciosProps) {
  /* Se parten en pares acá y no en la pantalla: **la pieza es la que sabe
     que son dos columnas**, y pedirle a quien monta que mande filas ya
     armadas sería mudar la regla al consumidor. */
  const filas: Subservicio[][] = []
  for (let i = 0; i < subservicios.length; i += 2) filas.push(subservicios.slice(i, i + 2))

  return (
    <View style={{ gap: spacing[3] }}>
      {filas.map((fila, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'stretch', gap: spacing[3] }}>
          {fila.map((s) => (
            <Celda key={s.clave} s={s} onElegir={() => onElegir(s.clave)} />
          ))}
          {/* La fila impar del final: un hueco del mismo ancho para que la
              tarjeta huérfana **no se estire a pantalla completa**. *Una
              tarjeta sola del doble de ancho se lee como otra cosa — una
              destacada— y no lo es.* */}
          {fila.length === 1 ? <View style={{ flex: 1 }} /> : null}
        </View>
      ))}
    </View>
  )
}
