/**
 * AvisoTeleconsulta — el aviso previo del quinto oficio (S106-B, OBRA 1).
 *
 * `LETRA_TELEMEDICINA` §3: *«Antes de que el dueño confirme una
 * teleconsulta, la app le muestra…»*. Y su línea roja, que es la que
 * gobierna cada decisión de esta pieza:
 *
 *   🔴 *«Los signos concretos no son decoración. Decir "si creés que está
 *   en riesgo" le pide al dueño un juicio clínico que no tiene; nombrar
 *   cinco signos le da un criterio. **No se resume, no se acorta, no se
 *   convierte en una línea de letra chica.»***
 *
 * ── POR QUÉ TRES CELDAS Y NO TRES BOTONES ─────────────────────────────
 * **Tres botones sólidos son ILEGALES**, y no por gusto: `D-484` (pagada
 * S99-B) fijó que el pie de una Hoja lleva primario + secundario, y el
 * propio slot `pie` de `Hoja` lo dice — *«dos cajas llenas obligan a
 * elegir dos veces»*. Con tres sería peor.
 *
 * **El precedente vivo de la casa es `SelectorAvatar:214-229`**: tres
 * `Celda` en una `Hoja`, y su comentario lo declara — *«las tres acciones
 * de la Hoja son Celdas navegables»*. **Esta pieza no inventa un patrón:
 * usa el que ya existía y que el censo de S106-B midió.**
 *
 * ── 🔴 NINGUNA ACCIÓN PRESIDE (firma del founder, S106-CP1) ───────────
 * Las tres son `Celda` **de tratamiento idéntico**: misma densidad, mismo
 * color, ningún acento, ninguna `elegida`. **El orden lo fija ESTA PIEZA**
 * —urgencias · presencial · continuar— y el consumidor **no puede
 * reordenarlas**: `acciones` es un objeto nombrado, jamás un array.
 *
 * *El porqué de la firma, para que nadie lo "mejore" después: si
 * presidiera «Continuar», el deslinde empujaría justo hacia lo que vino a
 * advertir; si presidiera «Ir a urgencias», la app empujaría a irse en el
 * caso normal, que es la enorme mayoría.* **La paridad ES la decisión.**
 *
 * ── 🔴 LOS CINCO SIGNOS SON UNA TUPLA, Y ESO ES LA LEY POR CONSTRUCCIÓN ─
 * `signos: readonly [string, string, string, string, string]`.
 * **Cuatro signos NO COMPILAN.** Es el precedente de `direccion` en
 * `FilaCita` (E14: *«el tsc obliga a decidirlo»*) aplicado a la única
 * parte del aviso que la letra cuenta con un número.
 *
 * *La razón de que sea tipo y no guard de runtime: un guard que rompe la
 * pantalla en producción cambia un texto incompleto por una pantalla
 * caída. El tipo lo impide antes, y gratis.* **Es la capa barata; la capa
 * que mira el CONTENIDO de los cinco es `R67`.** Ninguna sustituye a la
 * otra: el tipo cuenta, el juez lee.
 *
 * ── LA PIEZA NO TRUNCA, NO RESUME, NO COLAPSA ─────────────────────────
 * Ningún `Texto` de acá lleva `numberOfLines`; las tres `Celda` van con
 * `tituloEntero`. **Si el contenido no entra, SCROLLEA** (`HojaScroll`,
 * obligatorio dentro de una Hoja — L-132) **y jamás se recorta.** Entre
 * una hoja larga y un signo cortado que nadie sabe que estaba cortado,
 * esta casa ya eligió: el defecto visible (la ley de `tituloEntero`).
 *
 * ── DESCARTAR NO ES CONTINUAR (fail-closed) ───────────────────────────
 * La `Hoja` cierra por swipe, backdrop y botón atrás — **no se puede
 * impedir, y está bien que no se pueda**: descartar cae en `onCerrar`, que
 * **no continúa nada**. El consumidor debe tratarlo como «no siguió».
 *
 * **SIN `conCerrar` (la X), a propósito:** la letra nombra TRES salidas y
 * una X sería una cuarta salida visible compitiendo con ellas — Chanel
 * (Ley 16). Las vías de descarte que no se pueden quitar siguen ahí.
 *
 * ── SIN GLIFOS EN LAS CELDAS, DECLARADO CON SU RAZÓN ──────────────────
 * La Ley 12 enmendada S71 diría que sí (tres destinos que VARÍAN). **No se
 * ponen, y no por olvido:** dos de los tres destinos no tienen glifo en el
 * registry, y un glifo nuevo arrastra el proceso completo (hoja de
 * contacto §6b + montaje a 21px + **gate del founder por ícono**, §2.9).
 * **Mezclar uno del registry con dos nuevos rompería la paridad que la
 * firma pide.** Queda como candidato del gate visual, no como deuda
 * silenciosa.
 *
 * ── LA ADVERTENCIA VA EN PESO, NO EN COLOR ────────────────────────────
 * `variante="enfasis"` (negrita sin `role="header"`, la variante que nació
 * para exactamente esto en S100d·bis) y **sin color de status**. La letra
 * la marca en NEGRITA, no en rojo — y pintar de rojo un aviso que en el
 * caso normal termina en «continuar» enseña a ignorar el rojo (*«avisar
 * todo enseña a ignorar los avisos»*, S96).
 *
 * ── VOZ ───────────────────────────────────────────────────────────────
 * **Todo el texto entra por props.** Esta pieza no tiene ni una cadena de
 * producto adentro: el aviso es voz de la APP y vive en el diccionario de
 * su app (el namespace `ui` es solo para lo interno de los componentes).
 * *Y hay una segunda razón, más dura: si el texto viviera acá, `R67` no
 * podría vigilar lo que el usuario realmente lee.*
 *
 * ── LOS TRES TEMAS ────────────────────────────────────────────────────
 * Cero tintes propios ⇒ **memorial degrada solo** (Ley 8): la `Hoja` ya
 * entra sin rebote y las `Celda` resuelven contra el tema. **Cero pares
 * WCAG nuevos** — no introduce ninguna combinación de color que el sistema
 * no midiera ya.
 *
 * ── ESCALERA (§4b) ────────────────────────────────────────────────────
 * **No muestra datos del expediente**: es un deslinde. No tiene peldaños.
 */

import { View } from 'react-native'
import { Celda } from './Celda'
import { Hoja, HojaScroll } from './Hoja'
import { Texto } from './Texto'
import { useTheme } from '../ThemeProvider'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'

/** Una acción del aviso: su etiqueta (voz de la app) y qué hace. */
export interface AccionAviso {
  etiqueta: string
  onPress: () => void
}

export interface AvisoTeleconsultaProps {
  visible: boolean
  /**
   * Descarte: swipe, backdrop o botón atrás. **NO es continuar** — el
   * consumidor lo trata como «no siguió» (fail-closed).
   */
  onCerrar: () => void
  /** El texto firmado, entero. Ninguna de estas cadenas la inventa la pieza. */
  texto: {
    /** «Antes de continuar» */
    titulo: string
    /** El párrafo que dice para qué SÍ sirve la videollamada. */
    intro: string
    /** La advertencia dura — el párrafo que la letra pone en negrita. */
    advertencia: string
    /** La frase que introduce los signos. */
    signosIntro: string
    /**
     * 🔴 LOS CINCO. **Tupla: cuatro no compila.** El orden es el de la
     * letra y lo conserva el consumidor — la pieza no reordena.
     */
    signos: readonly [string, string, string, string, string]
    /** El cierre después de los signos («llévala a una clínica ahora mismo»). */
    signosCierre: string
  }
  /**
   * Las tres acciones. **Objeto nombrado y no array**: el orden lo fija la
   * pieza (firma del founder), así que el consumidor no puede alterarlo ni
   * por descuido.
   */
  acciones: {
    urgencias: AccionAviso
    presencial: AccionAviso
    continuar: AccionAviso
  }
}

/** Diámetro de la viñeta del signo. Misma geometría de punto que `LineaDeVida`. */
const VINETA = 5

export function AvisoTeleconsulta({ visible, onCerrar, texto, acciones }: AvisoTeleconsultaProps) {
  const { theme } = useTheme()

  return (
    <Hoja visible={visible} onCerrar={onCerrar} titulo={texto.titulo} altura="completa">
      <HojaScroll contentContainerStyle={{ paddingBottom: spacing[4] }}>
        <View style={{ gap: spacing[3] }}>
          <Texto>{texto.intro}</Texto>

          <Texto variante="enfasis">{texto.advertencia}</Texto>

          <Texto>{texto.signosIntro}</Texto>

          {/* Los cinco, uno por línea. NUNCA colapsados en un inciso: la letra
              dice que nombrarlos «le da un criterio», y un criterio se barre
              con el ojo. Ninguno lleva numberOfLines. */}
          <View style={{ gap: spacing[2], paddingLeft: spacing[1] }}>
            {texto.signos.map((signo, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: spacing[2], alignItems: 'flex-start' }}>
                <View
                  style={{
                    width: VINETA,
                    height: VINETA,
                    borderRadius: radius.full,
                    backgroundColor: theme.text.secondary,
                    // baja la viñeta a la altura óptica de la primera línea
                    marginTop: spacing[2],
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Texto>{signo}</Texto>
                </View>
              </View>
            ))}
          </View>

          <Texto>{texto.signosCierre}</Texto>
        </View>

        {/* LAS TRES, de peso par. Orden fijado acá — el consumidor no lo elige. */}
        <View style={{ marginTop: spacing[5] }}>
          <Celda
            interactiva
            accessibilityRole="button"
            titulo={acciones.urgencias.etiqueta}
            tituloEntero
            onPress={acciones.urgencias.onPress}
          />
          <Celda
            interactiva
            accessibilityRole="button"
            titulo={acciones.presencial.etiqueta}
            tituloEntero
            onPress={acciones.presencial.onPress}
          />
          <Celda
            interactiva
            accessibilityRole="button"
            titulo={acciones.continuar.etiqueta}
            tituloEntero
            onPress={acciones.continuar.onPress}
          />
        </View>
      </HojaScroll>
    </Hoja>
  )
}
