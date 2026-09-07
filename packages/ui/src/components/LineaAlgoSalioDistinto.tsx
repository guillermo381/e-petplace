/**
 * LineaAlgoSalioDistinto — LA PUERTA, DESDE EL OBJETO (S114-B, B8).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * *«Abajo del todo, después de las fotos y del parte, hay una línea discreta:
 * "¿Algo salió distinto?". **No es un botón de alarma ni está en rojo** — es
 * una puerta que está ahí por si la necesito, **no un reproche al
 * paseador**.»* — `DIRECCION_POSTVENTA` §1.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── DÓNDE VIVE, Y ES LA MITAD DE LA LEY ─────────────────────────────────
 * **En el detalle del objeto** —la cita, la estadía, el pedido— y **como
 * última fila**. §1: *«nunca en el Hogar, nunca en la campana, nunca como
 * tab»* · *«lo primero que ve la familia es lo que pasó; el reclamo es la
 * salida, no la entrada»*. Eso lo cumple quien la monta; la pieza no puede
 * saber dónde la pusieron.
 *
 * ── 🔴 EN MEMORIAL NO HAY LÍNEA, Y NO DEPENDE DE QUE ALGUIEN SE ACUERDE ──
 * §1: *«Con la mascota en memorial no hay línea. Nada.»* (`MODELO_LOYALTY`
 * §7: memorial apaga todo). **La pieza devuelve `null` en el tema memorial**
 * — no porque el tema sea el dato correcto, sino porque **es un piso que no
 * se puede olvidar**.
 *
 * ⚠️ **Y es un piso, no un reemplazo:** la pantalla igual no debe montarla
 * cuando la mascota está en memorial. *Si la pantalla no fuerza el tema, el
 * piso no se enciende — por eso se declara acá en vez de darlo por hecho.*
 *
 * ── LAS TRES VOCES SON TRES ESTADOS, Y LA UNIÓN LO DICE ─────────────────
 * ```
 *   disponible ……… «¿Algo salió distinto?»            → abre el caso
 *   fueraDeVentana  «Este servicio ya pasó su ventana…» → habla con la casa,
 *                                                        SIN caso (§1)
 *   casoAbierto ……  «Tenés un caso abierto…» + su estado → lleva al caso
 * ```
 * **La línea NO desaparece fuera de ventana: cambia de voz.** §1 lo pide con
 * esas palabras, y es la diferencia entre *«ya no se puede»* y *«acá no hay
 * nada»* — la segunda es la que hace que alguien busque el número de
 * teléfono de una empresa.
 *
 * 🔴 **`casoAbierto` es el único que lleva DOS datos** —la frase y el estado—
 * y por eso es el único miembro con un campo de más. *Una unión donde los
 * tres miembros tienen la misma forma no es una unión: es una prop `tipo` que
 * no hace nada.* El estado va en su propio registro: si viajara pegado dentro
 * de la frase, la pantalla tendría que elegir el separador y el estado se
 * leería como parte de la oración.
 *
 * ── NO ES UN BOTÓN DE ALARMA, Y ESO ES ANATOMÍA ─────────────────────────
 * Ley 19.7 en su forma canónica: **sin caja, texto + chevron `›` (navega),
 * target 44, sin glifo** —es el pie de la pantalla, no tiene hermanos entre
 * los que variar (Ley 12 enmendada)—. **Color de texto secundario, jamás
 * `danger` ni `warning`:** el reclamo no es un error de nadie todavía. *Un
 * botón sólido rojo al pie de un parte convierte cada servicio en una
 * invitación a quejarse.*
 *
 * ── LO QUE **NO** DECIDE ────────────────────────────────────────────────
 * **La ventana de 7 días.** Quién está adentro y quién afuera lo dice el
 * motor (`LETRA_POSTVENTA`), y la pantalla le pasa el estado ya resuelto.
 * *Una pieza que contara días tendría que saber de qué reloj, y sería el
 * segundo lugar donde vive esa cuenta.*
 *
 * ── LOS TRES TEMAS Y REDUCE-MOTION (N15) ────────────────────────────────
 * Cero movimiento. La presión es la primitiva de la casa; memorial no llega a
 * dibujarse.
 *
 * ── PUERTA ──────────────────────────────────────────────────────────────
 * Última fila del detalle de la cita, la estadía y el pedido, app de la
 * familia. **Entregada y no montada.**
 */
import { Pressable, View } from 'react-native'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { Chevron } from './chevron'
import { Texto } from './Texto'

/**
 * Los tres estados de la puerta (§1). Las voces llegan **redactadas** — la
 * familia y el prestador no leen la misma frase (Ley 3).
 */
export type EstadoDeLaPuerta =
  /** «¿Algo salió distinto?» — dentro de la ventana. */
  | { tipo: 'disponible'; voz: string }
  /** «Este servicio ya pasó su ventana. Si querés, hablá con nosotros.» */
  | { tipo: 'fueraDeVentana'; voz: string }
  /**
   * «Tenés un caso abierto sobre este paseo» + «Con el paseador».
   * 🔴 El único con dos datos — ver la cabecera.
   */
  | { tipo: 'casoAbierto'; voz: string; estado: string }

export type LineaAlgoSalioDistintoProps = {
  estado: EstadoDeLaPuerta
  /**
   * A dónde lleva. **Los tres llevan a lados distintos** —el formulario del
   * motivo, la conversación con la casa, el caso— y por eso es una sola
   * función que la pantalla resuelve según el estado que ella misma pasó.
   */
  onPress: () => void
}

export function LineaAlgoSalioDistinto({ estado, onPress }: LineaAlgoSalioDistintoProps) {
  const { theme } = useTheme()

  /* 🔴 EL PISO DE MEMORIAL — ver la cabecera. Va ANTES que cualquier otra
     cosa: en memorial no hay nada que decidir. */
  if (theme.mode === 'memorial') return null

  const label =
    estado.tipo === 'casoAbierto' ? `${estado.voz}. ${estado.estado}` : estado.voz

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        minHeight: 44, // N8 — el blanco táctil, aunque la línea sea fina
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[2],
      }}
    >
      <View style={{ flex: 1 }}>
        {/* `secondary`: discreta. NUNCA `danger` ni `warning` — ver la
            cabecera. La discreción es la letra, no una preferencia.

            🔴 **UNA SOLA LÍNEA, Y ES LA FORMA DE LA LETRA.** §1 la escribe
            así: *«Tenés un caso abierto sobre este paseo · Con el
            paseador»*. La primera versión partía el estado a un segundo
            renglón en `tertiary`, y **las dos mitades estaban mal**: el
            terciario es placeholder por doctrina de la casa —2,40:1 sobre
            tarjeta clara— y el estado de un caso **no es decoración**; y
            partirlo en dos renglones inventaba una jerarquía que la letra
            no pide. *El «·» es puntuación, no voz: lo pone la pieza, y las
            dos partes llegan redactadas por separado para que quien las
            escriba no tenga que acordarse del separador.* */}
        <Texto variante="apoyo" color="secondary">
          {estado.tipo === 'casoAbierto' ? `${estado.voz} · ${estado.estado}` : estado.voz}
        </Texto>
      </View>
      {/* `›` NAVEGA (19.7): los tres estados llevan a otra pantalla. */}
      <Chevron direccion="derecha" />
    </Pressable>
  )
}
