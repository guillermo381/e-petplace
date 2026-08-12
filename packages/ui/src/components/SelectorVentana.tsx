/**
 * SelectorVentana — CUÁNDO LLEGA, y por qué un día no se puede elegir.
 *
 * `LETRA_RECORRIDO_DESPENSA_S96` §6.2 (*"programar la fecha de entrega
 * entra"*) y §7.1 de la letra del panel (*"la promesa es una VENTANA, no
 * una fecha"*). Contrato confirmado por D.
 *
 * ── LA REGLA QUE ORDENA LA PIEZA ───────────────────────────────────────
 * §6.2 pone la condición que la vuelve honesta: *"el cupo existe por cada
 * día futuro y la promesa lo consume. **Un día sin capacidad confirmada
 * no se puede prometer.**"* Y §7.3: *"prometer sobre un recurso que no va
 * a estar es exactamente lo que L-139 prohíbe."*
 *
 * ── 🔴 EL DÍA SIN CUPO SE DIBUJA, NO SE ESCONDE — y es la decisión ─────
 * La Ley 23 dice que *la puerta no ofrece lo que va a rechazar*, y la
 * lectura fácil es esconder el día lleno. **Es la lectura equivocada
 * acá**, por una razón concreta: el cliente **está buscando el jueves**.
 * Un jueves que desaparece de la lista se lee como *"el jueves no
 * existe"*, y deja a alguien sin entender por qué su día no está — que es
 * el mismo daño que la Ley 13 nombra cuando un error se disfraza de
 * vacío.
 *
 * > **La puerta no OFRECE lo que va a rechazar, pero tampoco puede hacer
 * > DESAPARECER lo que el usuario vino a buscar.** El día lleno se
 * > muestra, no se puede tocar, **y dice por qué** — que es lo único que
 * > convierte un "no" en información.
 *
 * Por eso `motivo` viaja al lado de `estado`, **visible sin tocar nada**:
 * un motivo detrás de un tap es un motivo que nadie lee. *La Ley 23 sigue
 * intacta: la opción llena no es tocable — el servidor jamás la va a
 * recibir. Lo que se agrega es que la negación habla.*
 *
 * ── APAGADO NO DICE ERROR (Ley 22) ─────────────────────────────────────
 * `sin_cupo` **no** usa el registro de peligro ni el de alerta: es un
 * apagado sereno. Que un día esté lleno no es una falla del cliente ni
 * del sistema — es una capacidad que se agotó, y pintarla en rojo
 * convierte una agenda en un reproche.
 *
 * ── POR QUÉ NO ES `SelectorOpcion` ENSANCHADO ──────────────────────────
 * Relevado (protocolo 1c, pregunta 2). `SelectorOpcion` es el chip de
 * VALOR y no tiene "no elegible con su razón" — y la diferencia no es
 * cosmética: **una opción que no se puede elegir y dice POR QUÉ necesita
 * espacio para la razón**, o sea otra anatomía. Meterla ahí obligaría a
 * los chips de toda la casa a cargar un `motivo` que ninguno usa, que es
 * la prop-al-pasar que la casa ya rechazó en `FilaDato`.
 *
 * La elección viste TONAL (Ley 22: selección entre pares) sobre
 * rectángulo suave (Ley 21: lo que se elige no es píldora).
 *
 * Presentacional puro: no calcula cupo, no llama a nadie. La pantalla
 * arma las opciones con `calcularPromesaDespensa` y `cupoRepartoDelDia`.
 */

import { Pressable, View } from 'react-native'

import { Boton } from './Boton'
import { Texto } from './Texto'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

export type EstadoVentana = 'elegible' | 'sin_cupo'

export type OpcionVentana = {
  /** Identidad estable. Jamás se muestra. */
  clave: string
  /** La ventana en voz de la casa: "hoy, 14:00 a 18:00". */
  etiqueta: string
  /** "llega hoy" · "mañana por la mañana". */
  detalle?: string
  estado: EstadoVentana
  /**
   * POR QUÉ no se puede elegir. **Visible sin tocar** — ver la decisión
   * del encabezado. Solo tiene sentido con `estado: 'sin_cupo'`.
   */
  motivo?: string
}

export type SelectorVentanaProps = {
  opciones: OpcionVentana[]
  /** `null` = todavía sin elegir. La pieza no preselecciona. */
  elegida: string | null
  onElegir: (clave: string) => void
  /** "Programar otra fecha" — abre el calendario de la pantalla. */
  onProgramarOtra?: () => void
  etiquetaProgramarOtra?: string
  /** Voz de la casa para el rótulo del grupo. */
  rotulo?: string
}

export function SelectorVentana({
  opciones,
  elegida,
  onElegir,
  onProgramarOtra,
  etiquetaProgramarOtra,
  rotulo,
}: SelectorVentanaProps) {
  const { theme } = useTheme()

  return (
    <View style={{ gap: spacing[3] }}>
      {rotulo === undefined ? null : <Texto variante="seccion">{rotulo}</Texto>}

      <View accessibilityRole="radiogroup" style={{ gap: spacing[2] }}>
        {opciones.map((o) => {
          const lleno = o.estado === 'sin_cupo'
          const activa = !lleno && o.clave === elegida

          return (
            <Pressable
              key={o.clave}
              // La Ley 23 vive acá: la opción llena NO es tocable, así que
              // el servidor jamás la recibe. Lo que se agregó es que habla.
              disabled={lleno}
              onPress={() => onElegir(o.clave)}
              accessibilityRole="radio"
              accessibilityState={{ checked: activa, disabled: lleno }}
              // El motivo entra al label: quien no ve la pantalla también
              // tiene que saber POR QUÉ no puede elegir ese día.
              accessibilityLabel={[o.etiqueta, o.detalle, o.motivo].filter(Boolean).join('. ')}
              style={{
                gap: spacing[0.5],
                padding: spacing[3],
                borderRadius: radius.suave,
                borderWidth: theme.border.width,
                // TONAL para la elegida (Ley 22) · contorno neutro para la
                // elegible en reposo · el lleno pierde el borde: no compite
                // por atención, pero sigue estando.
                borderColor: activa
                  ? theme.accent.control
                  : lleno
                    ? 'transparent'
                    : theme.border.default,
                // EL TINTE DE LA ELEGIDA: la receta EXACTA de
                // `SelectorOpcion` para `acento='control'`
                // (`capaBg.comunidad`), con su MISMO guard de memorial —
                // memorial no tiene `capaBg` y degrada a superficie sin
                // tinte (Ley 8). Se copia la receta y no se inventa un
                // slot: mi primer intento usó un `accent.controlBg` que NO
                // EXISTE y lo cazó el typecheck.
                backgroundColor: activa
                  ? 'capaBg' in theme
                    ? theme.capaBg.comunidad
                    : theme.bg.overlay
                  : lleno
                    ? theme.bg.overlay
                    : 'transparent',
              }}
            >
              <Texto variante="cuerpo" color={lleno ? 'tertiary' : undefined}>
                {o.etiqueta}
              </Texto>
              {o.detalle === undefined ? null : (
                <Texto variante="apoyo" color={lleno ? 'tertiary' : undefined}>
                  {o.detalle}
                </Texto>
              )}
              {/* El porqué, a la vista. Apagado sereno, JAMÁS registro de
                  error (Ley 22): un día lleno no es una falla de nadie. */}
              {lleno && o.motivo !== undefined ? (
                <Texto variante="apoyo" color="tertiary">
                  {o.motivo}
                </Texto>
              ) : null}
            </Pressable>
          )
        })}
      </View>

      {onProgramarOtra === undefined || etiquetaProgramarOtra === undefined ? null : (
        <View style={{ alignSelf: 'flex-start' }}>
          {/* Comando con consecuencias → viste de botón (Ley 22c). */}
          <Boton variante="compacto" onPress={onProgramarOtra} etiqueta={etiquetaProgramarOtra} />
        </View>
      )}
    </View>
  )
}
