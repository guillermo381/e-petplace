/**
 * FilaAccionesCostura — LOS ACCESOS QUE PISAN LA COSTURA.
 *
 * De dos a cuatro círculos blancos con glifo en CIRUELA y su palabra debajo,
 * **colocados de modo que la mitad de arriba pisa el ciruela y la de abajo
 * la hoja**. Firma de la mesa.
 *
 * ── POR QUÉ EXISTE COMO PIEZA Y NO COMO UN `<View>` EN LA PANTALLA ────
 * Porque su posición **no es un estilo: es una relación con otra cosa.**
 * El desplazamiento hacia arriba es exactamente medio círculo, y ese medio
 * círculo tiene que seguir siendo medio el día que el círculo cambie de
 * tamaño. *Una pantalla que escribe `marginTop: -32` no sabe por qué es
 * 32, y el día que el diámetro pase a 72 nadie va a acordarse de ir a
 * buscarla.*
 *
 * ── LA REGLA DE LA PALABRA, que es de la orden y es lo que la protege ──
 * **UNA palabra por acceso. Si necesita dos, el círculo NO crece: se
 * cambia la palabra.** *El día que un acceso se llame «Agregar mascota»,
 * la salida es «Agregar» —o «Mascota»— y no un círculo más ancho que sus
 * hermanos.* Cuatro círculos de distinto ancho dejan de ser una fila.
 * ⚠️ Lo hace exigible el tipo: la etiqueta es `string` y la pieza la
 * dibuja en **una sola línea con `numberOfLines={1}`**. No trunca por
 * casualidad: *si alguien manda dos palabras, se ve cortada, y eso es
 * mejor que verse acomodada — un defecto que se disimula no se cura.*
 *
 * ── LA SOMBRA ─────────────────────────────────────────────────────────
 * **No es adorno: es lo que los hace legibles sobre DOS superficies.** Un
 * círculo blanco sobre el lienzo casi no tiene contorno; sobre el ciruela
 * lo tiene de sobra. La sombra le da el mismo borde a las dos mitades.
 */

import { type ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import Animated from 'react-native-reanimated'

import { medidas } from '../tokens/medidas'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { Texto } from './Texto'
import { usePresionado } from './usePresionado'

/** El diámetro del círculo. **Vive acá y no en `medidas`** porque es
 *  geometría de esta pieza: nadie más monta un disco en una costura. */
const DISCO = 64

export interface AccesoCostura {
  clave: string
  /** El glifo, ya montado. **La pieza no lo elige** — quien la usa sabe
   *  qué acceso es; acá sólo se sabe que va centrado.
   *
   *  🔴 **Se monta con `registro="glifo"`, y eso NO es un detalle de
   *  estilo: es de dónde sale el color.** El par glifo/tinte vive en el
   *  tema (`accent.glifo`) y el registro es el único lugar donde la casa
   *  lo resuelve — *un `tinta={...}` acá sería el color escrito por
   *  fuera, y el día que la mesa lo mueva no habría lista de quién lo
   *  escribió.* ⏪ Esta línea decía «va magenta» y la galería los montaba
   *  en `'tinta'`: el comentario afirmaba lo que el código no hacía. */
  icono: ReactNode
  /** UNA palabra (ver la regla arriba). */
  palabra: string
  onPress: () => void
}

export interface FilaAccionesCosturaProps {
  /** De DOS a CUATRO. **El tipo no lo puede exigir sin volverse ilegible**,
   *  así que se declara: con uno no hay fila (es un botón) y con cinco los
   *  círculos se achican por debajo del área táctil. */
  accesos: AccesoCostura[]
}

function DiscoAcceso({ acceso }: { acceso: AccesoCostura }) {
  const { theme } = useTheme()
  const { handlers, estiloPresionado } = usePresionado(0.97)
  return (
    <Pressable
      onPress={acceso.onPress}
      {...handlers}
      accessibilityRole="button"
      accessibilityLabel={acceso.palabra}
      style={{ alignItems: 'center', gap: spacing[2], flex: 1 }}
    >
      <Animated.View
        style={[
          {
            width: DISCO,
            height: DISCO,
            borderRadius: DISCO / 2,
            backgroundColor: theme.bg.card,
            alignItems: 'center',
            justifyContent: 'center',
            /* Ver la nota de arriba: la sombra es lo que le da contorno
               sobre el lienzo, donde un círculo blanco no tiene ninguno.
               Sale del TEMA (`elevada`) y no de `shadows` directo: en
               memorial el material se apaga solo y acá no hace falta una
               rama por tema. */
            boxShadow: theme.elevacion.elevada,
          },
          estiloPresionado,
        ]}
      >
        {acceso.icono}
      </Animated.View>
      {/* Una línea, siempre. Si llegan dos palabras se ve cortada — y eso
          es la señal, no un defecto que haya que disimular. */}
      <Texto variante="apoyo" numberOfLines={1} centrado>
        {acceso.palabra}
      </Texto>
    </Pressable>
  )
}

export function FilaAccionesCostura({ accesos }: FilaAccionesCosturaProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: spacing[3],
        paddingHorizontal: medidas.margen,
        /* 🔴 **MEDIO DISCO HACIA ARRIBA — la costura.** No es un número
           elegido: es `DISCO / 2`, y por eso sigue siendo la mitad el día
           que el disco cambie. La mitad de arriba queda sobre el ciruela y
           la de abajo sobre la hoja, que es lo que la orden pide. */
        marginTop: -(DISCO / 2),
        marginBottom: spacing[4],
      }}
    >
      {accesos.map((a) => (
        <DiscoAcceso key={a.clave} acceso={a} />
      ))}
    </View>
  )
}
