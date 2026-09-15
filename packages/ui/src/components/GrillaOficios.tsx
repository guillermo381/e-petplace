/**
 * GrillaOficios — LOS OFICIOS PISANDO LA COSTURA, en tres columnas.
 *
 * Círculo blanco con el glifo del oficio en ciruela, su sombra debajo, y UNA
 * palabra. Tres por fila, cabalgando el borde entre el ciruela y la hoja.
 *
 * ── ES LA HERMANA ANCHA DE `FilaAccionesCostura`, Y NO SE FUSIONAN ──────
 * Comparten el gesto —discos blancos montando la costura— y **no el
 * trabajo**: aquélla es una FILA de hasta cuatro accesos que caben en una
 * línea; ésta es una GRILLA que crece hacia abajo. *Fusionarlas obligaría a
 * una pieza a decidir si envuelve o no según cuántos le pasan, y el día que
 * alguien mande cinco accesos a la fila obtendría dos filas en vez de la
 * señal de que la palabra era demasiado larga.* Lo que sí se comparte es la
 * regla del desplazamiento: **medio disco, derivado y no escrito.**
 *
 * ── LO NO DISPONIBLE SE MARCA, NO SE ESCONDE ──────────────────────────
 * 🔴 Firma de la mesa, y es lo contrario de lo que hace casi toda vitrina.
 * *Un oficio que desaparece cuando no hay nadie cerca le enseña a la familia
 * que el producto no lo tiene — y el día que llegue el primer prestador,
 * nadie va a volver a buscarlo.* Marcado, la ausencia es de HOY y se puede
 * decir por qué.
 *
 * ⚠️ **Y por eso sigue siendo TOCABLE.** No lleva `disabled`: *un control
 * apagado no puede explicar por qué lo está*, y lo que la pantalla tiene que
 * poder decir —«todavía no hay nadie cerca»— es justamente lo que un botón
 * muerto se lleva puesto. La pieza lo dibuja apagado y **avisa al lector de
 * pantalla con `accessibilityHint`**; qué se dice al tocarlo es de la
 * pantalla.
 *
 * ── EL GLIFO LLEGA RESUELTO ───────────────────────────────────────────
 * Quien monta lo saca de `glifoDeOficio`, el mapeo único. **La pieza no
 * traduce oficio → glifo**: ese helper existe justamente para que la
 * traducción viva en UN lugar, y una pieza que además traduce se vuelve el
 * segundo.
 */

import { Pressable, View } from 'react-native'
import Animated from 'react-native-reanimated'

import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { Icono, type IconoNombre } from './Icono'
import { Texto } from './Texto'
import { usePresionado } from './usePresionado'

/** El diámetro. **Vive acá y no en `medidas`**: es geometría de esta pieza.
 *  72 y no los 64 de la fila: acá hay tres por línea y el aire sobra, y un
 *  disco más grande es lo que hace que el glifo se lea sin achicar la
 *  palabra. */
const DISCO = 72

export interface OficioDeGrilla {
  clave: string
  /** Ya resuelto con `glifoDeOficio`. */
  glifo: IconoNombre
  /** UNA palabra. **Si necesita dos, el disco NO crece: se cambia la
   *  palabra** — misma regla que la fila de la costura, y por la misma
   *  razón: tres discos de distinto ancho dejan de ser una grilla. Se dibuja
   *  en una línea, así que dos palabras **se ven cortadas**, y eso es la
   *  señal. */
  etiqueta: string
  /** ¿Hay alguien cerca que lo ofrezca? **`false` NO lo saca de la grilla**
   *  (ver arriba) ni lo apaga como control: lo dibuja callado. */
  disponible: boolean
}

export interface GrillaOficiosProps {
  oficios: OficioDeGrilla[]
  onElegir: (clave: string) => void
  /** Lo que el lector de pantalla dice de un oficio sin nadie cerca. **Es
   *  obligatorio cuando hay alguno** — *un estado que sólo existe como color
   *  más pálido es invisible para quien no ve el color*, y la pieza no puede
   *  escribir la frase porque la voz es del diccionario de la app. */
  vozSinDisponibles?: string
}

function Oficio({
  oficio,
  onElegir,
  vozSinDisponibles,
}: {
  oficio: OficioDeGrilla
  onElegir: () => void
  vozSinDisponibles?: string
}) {
  const { theme } = useTheme()
  const presion = usePresionado()
  const apagado = !oficio.disponible

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={oficio.etiqueta}
      accessibilityHint={apagado ? vozSinDisponibles : undefined}
      onPress={onElegir}
      /* 🔴 **UN TERCIO DE ANCHO, NO EL ANCHO DEL DISCO.** Con `width: DISCO`
         y `space-around` entran CUATRO en una pantalla de 360 y la grilla
         deja de ser de tres — *la cantidad por fila pasaría a depender del
         teléfono, que es exactamente lo que una grilla existe para evitar.*
         El disco se centra adentro de su tercio. */
      style={{ alignItems: 'center', gap: spacing[2], width: '33.333%' }}
      {...presion.handlers}
    >
      <Animated.View
        style={[
          presion.estiloPresionado,
          {
            width: DISCO,
            height: DISCO,
            borderRadius: radius.full,
            backgroundColor: theme.bg.card,
            alignItems: 'center',
            justifyContent: 'center',
            /* La sombra **no es adorno: es lo que los hace legibles sobre DOS
               superficies.** Un disco blanco sobre el lienzo casi no tiene
               contorno; sobre el ciruela lo tiene de sobra. */
            boxShadow: theme.elevacion.elevada,
            /* Lo no disponible **pierde presencia, no forma**: el disco sigue
               entero y del mismo tamaño. *Achicarlo o vaciarlo lo convertiría
               en otra cosa, y lo que falta no es el oficio — es alguien que
               lo preste hoy.* */
            opacity: apagado ? 0.45 : 1,
          },
        ]}
      >
        <Icono nombre={oficio.glifo} tamano={30} registro="glifo" montaje="control" />
      </Animated.View>
      <Texto variante="apoyo" centrado numberOfLines={1} color={apagado ? 'tertiary' : undefined}>
        {oficio.etiqueta}
      </Texto>
    </Pressable>
  )
}

export function GrillaOficios({ oficios, onElegir, vozSinDisponibles }: GrillaOficiosProps) {
  /* 🔴 **EL DESPLAZAMIENTO ES `DISCO / 2`, DERIVADO Y NO ESCRITO** — la misma
     regla que la fila de la costura, y por el mismo motivo: *una pantalla que
     escribe `marginTop: -36` no sabe por qué es 36, y el día que el disco
     pase a 80 nadie va a acordarse de ir a buscarla.* Sólo la PRIMERA fila
     pisa la costura; las que siguen ya están adentro de la hoja. */
  return (
    <View
      style={{
        marginTop: -DISCO / 2,
        flexDirection: 'row',
        flexWrap: 'wrap',
        rowGap: spacing[5],
        paddingHorizontal: spacing[4],
      }}
    >
      {oficios.map((o) => (
        <Oficio
          key={o.clave}
          oficio={o}
          onElegir={() => onElegir(o.clave)}
          vozSinDisponibles={vozSinDisponibles}
        />
      ))}
    </View>
  )
}
