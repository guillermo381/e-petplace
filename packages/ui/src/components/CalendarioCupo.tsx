/**
 * CalendarioCupo — QUÉ DÍAS HAY LUGAR, en la forma en que se busca (S107-B).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **EL DÍA LLENO SE VE LLENO Y LO DICE. JAMÁS DESAPARECE EN SILENCIO.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── ESTA DECISIÓN NO ES NUEVA: `SelectorVentana` YA LA FIRMÓ ──────────────
 * Y se cita en vez de re-argumentarse, porque re-decidirla es cómo dos piezas
 * hermanas terminan contestando distinto (la lección de los cuatro logs,
 * 19.9: *lo que se copia, diverge*). Su encabezado dice, literal:
 *
 * > *«La Ley 23 dice que la puerta no ofrece lo que va a rechazar, y la
 * > lectura fácil es esconder el día lleno. **Es la lectura equivocada acá**:
 * > el cliente está buscando el jueves. Un jueves que desaparece de la lista
 * > se lee como "el jueves no existe".»*
 *
 * **La Ley 23 sigue intacta y acá está el detalle fino**, heredado tal cual de
 * esa pieza: el día lleno **recibe el toque pero JAMÁS llama a `onElegir`** —
 * solo cuenta su motivo. *El servidor sigue sin poder recibir un día sin
 * cupo.* Si alguien cablea `onElegir` en esa rama, rompe la ley.
 *
 * ── 🔴 POR QUÉ NO EXISTE UNA PROP DE CUPO RESTANTE ────────────────────────
 * **No hay `quedan` y no la va a haber.** «Quedan 2 lugares» es urgencia
 * artificial, y `MODELO_LOYALTY` §7.5 la prohíbe. La pieza **no puede
 * mostrarla porque no puede recibirla** — L-222 otra vez: no alcanza con que
 * nadie la pase.
 *
 * ⚠️ Y el matiz que la vuelve honesta en vez de mojigata: **el día lleno sí
 * dice POR QUÉ** (`motivo`). Lo prohibido no es informar — es *contar hacia
 * atrás para apurar*. La diferencia está en para qué sirve el número: «sin
 * lugar» ayuda a elegir otro día; «quedan 2» ayuda a que no lo pienses.
 *
 * ── DÓNDE VIVE EL MOTIVO, y por qué no en la celda ────────────────────────
 * En una celda de calendario **no entra una frase**. Misma salida que
 * `SelectorVentana` en `tira`: **el motivo no se achica ni se pliega — se
 * MUDA** a una línea bajo la rejilla, a ancho completo y sin truncar. Y
 * **arranca mostrando el del primer día lleno**, así que el porqué está a la
 * vista **sin tocar nada**: *un motivo detrás de un tap es un motivo que nadie
 * lee.*
 *
 * ── 🔴 ESTA PIEZA NO HACE CUENTAS DE FECHA, y es una frontera ─────────────
 * No calcula en qué columna cae el primer día, ni cómo se abrevia un día de
 * semana, ni qué mes es. Recibe `columnaInicial` y `cabecerasDias` **ya
 * resueltos por el riel de i18n**. *Es la misma frontera que `FichaMensualidad`
 * traza con el patrón de días y `PrecioText` con la moneda: el calendario de
 * un idioma no arranca el mismo día que el de otro, y esa regla vive en el
 * riel — jamás en una pieza de presentación.*
 *
 * ── LEY 11: POR QUÉ NACE Y NO SE REUSA `SelectorVentana` ──────────────────
 * Relevado antes de crear (protocolo 1c, pregunta 2). `SelectorVentana` es la
 * pieza más cercana y **se le toma el vocabulario entero** (`estado` + `motivo`,
 * ver `EstadoCupo`) en vez de inventar otro. Lo que no puede dar es la FORMA:
 * sus dos disposiciones son `apilada` y `tira` —una lista—, y **una estadía se
 * elige mirando un mes**: dónde caen los fines de semana, cuántos días
 * seguidos hay lugar, si el bloque que necesito está libre entero. *Eso es una
 * rejilla o no es nada; una tira de 30 días es una lista larga con forma de
 * calendario.* El trabajo «elegir un día viendo el mes» no estaba en el
 * diccionario (Ley 19).
 *
 * ── ESCALERA (§4b) ────────────────────────────────────────────────────────
 * **Peldaño 0** — sin días la pieza no se monta (regla de existencia).
 * **Peldaño 1** — la rejilla con elegibles y llenos.
 * **Peldaño 2** — el motivo real por día (hoy lo compone la pantalla desde el
 * cupo del lugar). No muestra datos del expediente.
 *
 * ── DOSIS Y TEMAS ─────────────────────────────────────────────────────────
 * El elegido usa `accent.control` con la receta EXACTA de `SelectorVentana`
 * (tonal + `capaBg.comunidad`, con su mismo guard de memorial). Cero color
 * propio ⇒ cero pares nuevos de contraste. Sin animación (Ley 6).
 */

import { useState } from 'react'
import { Pressable, View } from 'react-native'

import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { Texto } from './Texto'

/**
 * El vocabulario es el de `SelectorVentana.EstadoVentana`, a propósito: las
 * dos piezas hablan del mismo hecho y **un segundo vocabulario para el mismo
 * hecho es cómo empiezan a divergir.**
 */
export type EstadoCupo = 'elegible' | 'sin_cupo'

export type DiaDeCupo = {
  /** Identidad estable (la fecha ISO sirve). Jamás se muestra. */
  clave: string
  /**
   * El número del día **ya formateado por el riel**: «1», «14».
   * La pieza no lo deriva de la clave — ver la frontera del encabezado.
   */
  numero: string
  estado: EstadoCupo
  /**
   * POR QUÉ no se puede elegir. Se muestra bajo la rejilla, **sin tocar
   * nada** si es el primer día lleno. Solo tiene sentido con `'sin_cupo'`.
   *
   * 🔴 **No es un contador.** Ver el encabezado: «quedan 2» no entra acá.
   */
  motivo?: string
}

export type CalendarioCupoProps = {
  /** Los días del mes, EN ORDEN. */
  dias: DiaDeCupo[]
  /**
   * En qué columna (0–6) cae el primer día de `dias`. La resuelve el riel:
   * la semana no arranca el mismo día en todos los idiomas.
   */
  columnaInicial: number
  /** Las 7 cabeceras ya abreviadas por el riel: `['L','M','X','J','V','S','D']`. */
  cabecerasDias: string[]
  /** `null` = todavía sin elegir. La pieza no preselecciona. */
  elegido: string | null
  onElegir: (clave: string) => void
  /** Rótulo del grupo, en voz de la app (el mes suele vivir acá). */
  rotulo?: string
}

const COLUMNAS = 7

export function CalendarioCupo({
  dias,
  columnaInicial,
  cabecerasDias,
  elegido,
  onElegir,
  rotulo,
}: CalendarioCupoProps) {
  const { theme } = useTheme()

  /* EL MOTIVO QUE SE ESTÁ CONTANDO. Arranca en el PRIMER día lleno para que
     el porqué esté a la vista sin tocar nada, y cambia si la persona pregunta
     por otro. Receta calcada de `SelectorVentana` en `tira`. */
  const primeroLleno = dias.find((d) => d.estado === 'sin_cupo' && d.motivo !== undefined)
  const [claveMotivo, setClaveMotivo] = useState<string | null>(null)
  const motivoALaVista = (dias.find((d) => d.clave === claveMotivo) ?? primeroLleno)?.motivo

  /* REGLA DE EXISTENCIA: sin días no hay calendario (Ley 13 — el vacío se
     confirma; un mes sin días no es una pantalla). */
  if (dias.length === 0) return null

  /* Los huecos delante del día 1. Son ESTRUCTURA, no días: no se dibujan, no
     se tocan y no entran al árbol de accesibilidad. */
  const huecos = Array.from({ length: Math.max(0, Math.min(columnaInicial, COLUMNAS - 1)) })

  return (
    <View style={{ gap: spacing[3] }}>
      {rotulo === undefined ? null : <Texto variante="seccion">{rotulo}</Texto>}

      {/* Cabeceras. `accessibilityElementsHidden`: un lector que recorre el mes
          no necesita oír «L M X J V S D» antes de cada semana — el día ya
          viaja completo en el label de su celda. */}
      <View
        style={{ flexDirection: 'row' }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {cabecerasDias.slice(0, COLUMNAS).map((c, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Texto variante="apoyo" color="tertiary">
              {c}
            </Texto>
          </View>
        ))}
      </View>

      {/* LA REJILLA. `flexWrap` sobre celdas de 1/7 del ancho: las semanas
          salen solas del envoltorio y no hay que agrupar por filas — una
          agrupación que la pieza tendría que recalcular cada vez que cambia
          `columnaInicial`. */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {huecos.map((_, i) => (
          <View
            key={`hueco-${i}`}
            style={{ width: `${100 / COLUMNAS}%`, aspectRatio: 1 }}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
        ))}

        {dias.map((d) => {
          const lleno = d.estado === 'sin_cupo'
          const activo = !lleno && d.clave === elegido

          return (
            <View key={d.clave} style={{ width: `${100 / COLUMNAS}%`, aspectRatio: 1, padding: spacing[0.5] }}>
              <Pressable
                /* LA LEY 23, heredada de `SelectorVentana`: el lleno recibe el
                   toque para poder contar SU motivo, y **jamás llama a
                   `onElegir`**. Sin esto, con dos días llenos no hay forma de
                   preguntar por el segundo. */
                onPress={() => {
                  if (lleno) {
                    setClaveMotivo(d.clave)
                    return
                  }
                  onElegir(d.clave)
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: activo, disabled: lleno }}
                /* El motivo entra al label SIEMPRE: quien no ve la pantalla
                   necesita saber por qué ese día no se puede elegir, y el
                   motivo visual vive abajo. */
                accessibilityLabel={[d.numero, d.motivo].filter(Boolean).join('. ')}
                style={({ pressed }) => ({
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: radius.suave,
                  borderWidth: theme.border.width,
                  /* TONAL para el elegido (Ley 22) · contorno neutro para el
                     elegible en reposo · el lleno pierde el borde: no compite
                     por atención, pero sigue estando. Receta exacta de
                     `SelectorVentana`. */
                  borderColor: activo
                    ? theme.accent.control
                    : lleno
                      ? 'transparent'
                      : theme.border.default,
                  backgroundColor: activo
                    ? 'capaBg' in theme
                      ? theme.capaBg.comunidad
                      : theme.bg.overlay
                    : lleno
                      ? theme.bg.overlay
                      : pressed
                        ? theme.bg.overlay
                        : 'transparent',
                })}
              >
                {/* El número del día es dato de máquina (Ley 3). El lleno baja
                    a `tertiary`: apagado sereno, JAMÁS registro de error —
                    un día sin lugar no es una falla de nadie (Ley 22). */}
                <Texto variante="dato" color={lleno ? 'tertiary' : undefined}>
                  {d.numero}
                </Texto>
              </Pressable>
            </View>
          )
        })}
      </View>

      {/* EL PORQUÉ, a ancho completo y sin truncar. Visible sin tocar nada. */}
      {motivoALaVista === undefined ? null : (
        <Texto variante="apoyo" color="tertiary">
          {motivoALaVista}
        </Texto>
      )}
    </View>
  )
}
