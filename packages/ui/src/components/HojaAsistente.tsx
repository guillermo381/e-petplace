import { useState } from 'react'
import { Pressable, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { palette } from '../tokens/palette'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { BarraEscribir } from './BarraEscribir'
import { Hoja } from './Hoja'
import { Icono, type IconoNombre } from './Icono'
import { Separador } from './Separador'
import { Texto } from './Texto'
import { usePresionado } from './usePresionado'

/**
 * ═══════════════════════════════════════════════════════════════════════
 * **HojaAsistente — NEXO Y SUS ATAJOS (S116-B lote 8).**
 * *«Que el asistente al tocarse abra una hoja corta desde abajo con NEXO
 * arriba y debajo los atajos como filas de lista con glifo.»*
 *
 * ── 🔴 LOS ATAJOS VUELVEN, y de dónde venían (censo, no memoria) ─────
 * El orbe viejo abría **CUATRO** y están en un solo lugar del objeto:
 * `apps/cliente/src/lib/nexo/atajos.ts:57` —
 * `ORDEN_DE_PATA = ['peso', 'vacuna', 'antiparasitario', 'foto']`.
 *
 * ⚠️ **La mesa los nombró de memoria como «agregar recuerdo, carné de
 * vacunas y los demás», y el objeto dice otra cosa**: son Peso · Vacuna ·
 * Antiparasitario · Foto. *«Carné de vacunas» ≈ `vacuna` y «agregar
 * recuerdo» ≈ `foto`, pero **`peso` y `antiparasitario` no estaban en la
 * lista dictada y sí en el código**.* Se declara para que la mesa elija
 * sobre lo que hay, no sobre lo que recordamos.
 *
 * **Y esta pieza NO trae esa lista adentro:** *«C decide cuáles monta por
 * pantalla»*. Un atajo a «peso» en una pantalla de pago no es un atajo: es
 * ruido.
 *
 * ── POR QUÉ LOS ATAJOS SON FILAS Y NO LOS DEDOS DEL ORBE ─────────────
 * El orbe los abanicaba en posición de pata — un gesto de marca que costaba
 * su propia coreografía. **Acá son filas de lista con glifo**, por firma de
 * la mesa, y la consecuencia es buena: *una lista crece a cinco sin
 * rediseñar nada, y el abanico no podía pasar de cuatro sin dejar de ser una
 * pata.*
 *
 * ── LO QUE LA PIEZA NO HACE ──────────────────────────────────────────
 * **No pregunta nada.** Monta el campo y entrega el texto; qué se hace con
 * él es de quien la abre. *Una hoja que además consultara sería la IA metida
 * adentro de una pieza de presentación.*
 * ═══════════════════════════════════════════════════════════════════════
 */

export interface AtajoAsistente {
  glifo: IconoNombre
  /** Ya redactado (Ley 3). */
  texto: string
  onPress: () => void
}

export interface PreguntaNexo {
  /** «Preguntale a Nexo» — ya redactado. */
  placeholder: string
  /** Recibe el texto saneado. Nunca vacío: eso lo garantiza `BarraEscribir`. */
  onEnviar: (texto: string) => void
  /** accessibilityLabel del glifo de enviar. */
  etiquetaEnviar: string
}

export interface HojaAsistenteProps {
  visible: boolean
  onCerrar: () => void
  /** El título de la hoja — el nombre del asistente, ya redactado. */
  titulo: string
  pregunta: PreguntaNexo
  atajos: readonly AtajoAsistente[]
}

/** Una fila de atajo. **Sí anuncia toque** —al revés que `FilaBeneficio`—
 *  porque acá tocar ES lo que hay que hacer. */
function FilaAtajo({ atajo }: { atajo: AtajoAsistente }) {
  const { theme } = useTheme()
  const { handlers, estiloPresionado } = usePresionado(0.99)
  /* 🔴 **El hundido va en un `Animated.View`, NO en el `style` del
     `Pressable`.** Lo cazó el `tsc` de las APPS con el de `packages/ui` en
     0: `estiloPresionado` lleva `transitionProperty`, que el `ViewStyle` de
     la config de las apps no acepta. *Es la tercera vez en esta sesión que el
     paquete compila y el consumidor no — el gate que vale es el del hook,
     que compila las cuatro superficies.* */
  return (
    <Animated.View style={estiloPresionado}>
    <Pressable
      onPress={atajo.onPress}
      {...handlers}
      accessibilityRole="button"
      accessibilityLabel={atajo.texto}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[3] }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.chipV5,
          backgroundColor: theme.accent.glifoBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icono nombre={atajo.glifo} registro="glifo" />
      </View>
      <Texto variante="cuerpo">{atajo.texto}</Texto>
    </Pressable>
    </Animated.View>
  )
}

export function HojaAsistente({ visible, onCerrar, titulo, pregunta, atajos }: HojaAsistenteProps) {
  const [texto, setTexto] = useState('')
  return (
    /* `contenido` y no `completa`: la orden dice **hoja CORTA**. Con el campo
       y cuatro filas no llega ni a la mitad, y una hoja que ocupa más de lo
       que necesita tapa la pantalla desde la que se la abrió — *que es
       justamente el contexto de lo que se va a preguntar.* */
    <Hoja visible={visible} onCerrar={onCerrar} titulo={titulo} altura="contenido" apertura="marca">
      <View style={{ gap: spacing[2] }}>
        {/* NEXO ARRIBA: el campo es lo primero porque preguntar es el acto
            principal; los atajos son el camino corto para lo que se repite. */}
        <BarraEscribir
          valor={texto}
          onCambio={setTexto}
          onEnviar={(t) => {
            pregunta.onEnviar(t)
            setTexto('')
          }}
          placeholder={pregunta.placeholder}
          etiquetaEnviar={pregunta.etiquetaEnviar}
          glifoEnviar={<Icono nombre="enviar" tamano={22} registro="tinta" tinta={palette.white} />}
        />

        {atajos.length === 0 ? null : (
          <>
            <Separador />
            <View>
              {atajos.map((a) => (
                <FilaAtajo key={a.texto} atajo={a} />
              ))}
            </View>
          </>
        )}
      </View>
    </Hoja>
  )
}
