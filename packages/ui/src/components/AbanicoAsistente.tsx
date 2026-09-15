import { Pressable, View } from 'react-native'
import Animated, { Easing, FadeIn, FadeOut } from 'react-native-reanimated'
import { medidas, SEPARACION_ASISTENTE } from '../tokens/medidas'
import { motion } from '../tokens/motion'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { Icono, type IconoNombre } from './Icono'
import { Texto } from './Texto'
import { usePresionado } from './usePresionado'

/**
 * ═══════════════════════════════════════════════════════════════════════
 * **AbanicoAsistente — LOS ATAJOS COMO LOS TENÍA EL ORBE (S116-B lote 11).**
 *
 * ☠️ **REEMPLAZA A `HojaAsistente`, QUE MUERE.** Firma del founder sobre su
 * captura del orbe: *«al tocar el botón se despliegan hacia arriba cuatro
 * botones redondos blancos con glifo, cada uno con su etiqueta en una
 * pastilla blanca a la izquierda, y arriba de todos “Pregúntale a Nexo”»*.
 *
 * ── POR QUÉ NO ERA UNA HOJA, y la diferencia no es de forma ──────────
 * Una hoja modal **tapa la pantalla desde la que se la abrió** — y el
 * contexto de lo que se va a preguntar *es esa pantalla*. El abanico **deja
 * todo a la vista**: sale del botón, ocupa su columna y se va. *Preguntar
 * sobre algo no puede empezar por esconderlo.*
 *
 * Y hay una segunda, de gesto: **una hoja pide dos manos o un pulgar que
 * viaje**; el abanico nace **donde está el dedo**, que ya está sobre el
 * botón.
 *
 * ── LO QUE SE REUSA DEL ORBE Y LO QUE NO ─────────────────────────────
 * ✅ **Su MOTION, tal cual**: `coach.escalonadoMs` para abrir y
 * `coach.cierreMs` para cerrar. Y con su regla, que es del orbe y sigue
 * siendo cierta: **se abre escalonado y se recoge de golpe** — *escalonar la
 * salida hace esperar a quien ya decidió irse.*
 * ❌ **Su GEOMETRÍA no**: el orbe abanicaba en arco de pata (`coach-geometria`).
 * El sketch pide una **columna vertical**. *Reusar el arco habría sido
 * heredar una coreografía que nadie pidió, con su costo de cálculo.*
 *
 * ── LA ETIQUETA A LA IZQUIERDA, y por qué no debajo ──────────────────
 * Debajo, cuatro etiquetas empujarían la columna a lo alto de la pantalla y
 * el último atajo quedaría fuera del alcance del pulgar. **A la izquierda la
 * columna mide lo mismo con etiqueta que sin ella.**
 * ═══════════════════════════════════════════════════════════════════════
 */

/** El disco de cada atajo. Más chico que el asistente (52): *los hijos de un
 *  botón no pueden medir lo mismo que el botón, o dejan de leerse como
 *  hijos.* Y sigue por encima del área táctil de la casa (44). */
const DISCO = 46

export interface AtajoAsistente {
  glifo: IconoNombre
  /** Ya redactado (Ley 3). */
  texto: string
  onPress: () => void
}

export interface AbanicoAsistenteProps {
  /** De abajo hacia arriba, **en el orden en que se dibujan**: el primero
   *  queda pegado al botón. *El orden es del consumidor: la pieza no sabe
   *  cuál se usa más.* */
  atajos: readonly AtajoAsistente[]
  /** «Pregúntale a Nexo» — la fila de arriba de todas. Ya redactada. */
  vozPreguntar: string
  onPreguntar: () => void
  onCerrar: () => void
}

/** Una fila: pastilla con la etiqueta a la izquierda, disco con el glifo a la
 *  derecha. **Los dos tocan lo mismo** — *una etiqueta que no se puede tocar
 *  es un cartel al lado de un botón, y el dedo va a ir a la etiqueta.* */
function FilaDelAbanico({
  texto,
  glifo,
  onPress,
  demora,
}: {
  texto: string
  glifo?: IconoNombre
  onPress: () => void
  demora: number
}) {
  const { theme } = useTheme()
  const { handlers, estiloPresionado } = usePresionado(0.97)
  return (
    <Animated.View
      entering={FadeIn.duration(motion.duration.fast)
        .delay(demora)
        .easing(Easing.bezier(...motion.easing.easeOut.bezier))}
      /* Sin `delay` al salir: se recoge de golpe (ver la cabecera). */
      exiting={FadeOut.duration(motion.coach.cierreMs)}
      style={estiloPresionado}
    >
      <Pressable
        onPress={onPress}
        {...handlers}
        accessibilityRole="button"
        accessibilityLabel={texto}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: spacing[2] }}
      >
        {/* 🔴 **LA PASTILLA SE AJUSTA AL TEXTO Y NO LO CORTA NUNCA (lote 15).**
            ⏪ Llevaba `numberOfLines={1}`, así que cuando la fila no entraba
            **el que cedía era el texto**: el founder vio «Pregúnt…», «Anotar
            s…», «Cargar s…» en su teléfono.
            ⚠️ **Truncar era la peor de las tres salidas posibles**, y por eso
            no alcanza con agrandar la pastilla: un atajo cortado *no se lee
            mal — se lee OTRA COSA*, y el dedo decide sobre una palabra a
            medias. **`flexShrink: 0`** para que la fila no la comprima.
            ⇒ Si una etiqueta no entra en el ancho disponible, **el que está
            mal es el texto, no la pastilla** (firma del founder), y por eso
            las cuatro pasaron a UNA palabra. */}
        <View
          style={{
            flexShrink: 0,
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[1.5],
            borderRadius: radius.full,
            backgroundColor: theme.bg.card,
            boxShadow: theme.elevacion.elevada,
          }}
        >
          <Texto variante="apoyo">{texto}</Texto>
        </View>

        <View
          style={{
            width: DISCO,
            height: DISCO,
            borderRadius: DISCO / 2,
            backgroundColor: theme.bg.card,
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: theme.elevacion.elevada,
          }}
        >
          {/* La fila de preguntar no lleva glifo: su pastilla ES el atajo. */}
          {glifo === undefined ? (
            <Icono nombre="ia" registro="glifo" />
          ) : (
            <Icono nombre={glifo} registro="glifo" />
          )}
        </View>
      </Pressable>
    </Animated.View>
  )
}

export function AbanicoAsistente({ atajos, vozPreguntar, onPreguntar, onCerrar }: AbanicoAsistenteProps) {
  /* 🔴 **TODA FILA CIERRA ANTES DE DELEGAR — `D-1116`, y la cura va ACÁ y no
     en el padre por una razón de forma:** cuando el que envuelve es el padre,
     **hay que acordarse de envolver cada lista nueva**, y el que no se acuerde
     no rompe nada visible — deja el abanico abierto encima de la pantalla a la
     que acaba de llevar. Envolviendo en el abanico, *una fila que no cierre se
     vuelve inexpresable*: no hay forma de agregar una sin que pase por acá.
     ⚠️ **Y el orden importa: cierra PRIMERO y navega DESPUÉS.** Al revés, la
     navegación desmonta el abanico y el `setState` del cierre cae sobre un
     componente que ya no está. */
  const cerrarYLuego = (accion: () => void) => () => {
    onCerrar()
    accion()
  }

  /* 🔴 **EL VELO ES EL QUE CIERRA, y ocupa la pantalla entera.** *«Se cierran
     tocando fuera»* sólo se puede cumplir si «fuera» es tocable — un
     contenedor del tamaño del abanico dejaría el resto de la pantalla sin
     forma de cerrarlo, y la persona tendría que acertarle otra vez al botón. */
  return (
    <Pressable
      onPress={onCerrar}
      accessibilityLabel={vozPreguntar}
      accessibilityRole="button"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          right: spacing[5],
          /* Arranca justo encima del asistente: su alto + la separación que
             el propio botón usa. **Derivado, no tecleado** — si el disco
             cambia de tamaño, el abanico lo sigue. */
          bottom: medidas.barraAlto + SEPARACION_ASISTENTE + medidas.asistenteDiametro + spacing[3],
          alignItems: 'flex-end',
          gap: spacing[3],
        }}
      >
        {/* «Pregúntale a Nexo» ARRIBA DE TODOS, y por eso se dibuja primero:
            la columna crece hacia arriba desde el botón, así que el primer
            hijo es el más alto. Su escalonado es el ÚLTIMO — *aparece al
            final, que es como se lee «y además, preguntá».* */}
        <FilaDelAbanico
          texto={vozPreguntar}
          onPress={cerrarYLuego(onPreguntar)}
          demora={atajos.length * motion.coach.escalonadoMs}
        />
        {atajos.map((a, i) => (
          <FilaDelAbanico
            key={a.texto}
            texto={a.texto}
            glifo={a.glifo}
            onPress={cerrarYLuego(a.onPress)}
            /* El de más abajo —el más cerca del dedo— sale primero. */
            demora={(atajos.length - 1 - i) * motion.coach.escalonadoMs}
          />
        ))}
      </View>
    </Pressable>
  )
}
