/**
 * BannerPlazo — CUÁNTO TE QUEDA, SIN ALARMA (S114-B, B5).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * *«El reloj se ve, y no es rojo. Una línea bajo la cabecera: "Te quedan 14
 * horas para responder".»* — `DIRECCION_POSTVENTA` §5.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── 🔴 JAMÁS ROJO, Y LA RAZÓN NO ES ESTÉTICA ────────────────────────────
 * **El rojo es alarma y acá no pasó nada malo.** Un prestador al que le
 * llegó un caso no hizo nada mal todavía: le pidieron que conteste. Teñir
 * eso de peligro convierte *«hay algo que resolver»* en *«estás en falta»*, y
 * es exactamente lo que §5 dice que no queremos («no es un ticket frío»).
 *
 * Es la misma doctrina con la que **un código de firma vencido no se pinta de
 * rojo** y con la que el «no se envió» de `BurbujaMensaje` va en color de
 * clase: *lo dice el texto, no el color.* Acá el color es **neutro y del
 * tema** — cero `status.danger`, cero `status.warning`, y `R75` lo mide con
 * su rojo probado.
 *
 * ── 🔴 SIN COUNTDOWN QUE LATA ───────────────────────────────────────────
 * §5 lo pide con esas palabras, y acá es **estructural**: la pieza no tiene
 * reloj. **No hay `setInterval`, no hay `useEffect`, no hay estado propio** —
 * recibe una frase ya redactada y la dibuja. *Un contador que corre en
 * pantalla mete apuro donde la letra pidió que no lo hubiera, y el apuro es
 * una forma de presión que no se ve como presión.* `R75` también lo mide.
 *
 * **Y quién decide cuándo cambia el número: la pantalla**, en su refresco
 * normal. Una hora menos aparece cuando la persona vuelve, no mientras mira.
 *
 * ── LA TIPOGRAFÍA TABULAR, y para qué sirve de verdad ───────────────────
 * §5 pide «tipografía tabular». **No es un adorno: es lo que impide que la
 * línea tiemble.** Al pasar de `14` a `13` horas, con cifras de ancho
 * variable la frase entera se corre unos píxeles — y ese temblor **se lee
 * como si la pantalla estuviera contando**, que es justo el countdown
 * prohibido. Entra por `Texto tabular`, la enmienda aditiva de esta tanda:
 * **la frase sigue en DM Sans** (Ley 3 — es voz humana, no metadata de
 * máquina), sólo los dígitos quedan de ancho fijo.
 *
 * ── LA VOZ ENTERA LLEGA REDACTADA ───────────────────────────────────────
 * *«Te quedan 14 horas para responder»* viaja como UNA cadena. No se parte en
 * número + palabras: en castellano el plural, el orden y hasta la unidad
 * cambian («queda 1 hora», «te quedan 2 días»), y una pieza que las armara
 * obligaría a cada casa a resolver la concordancia por su cuenta. *Componer
 * la frase es del riel de idioma; dibujarla es de acá.*
 *
 * ── LO QUE **NO** DECIDE, y se dice para que nadie lo espere ────────────
 * **Cuándo dejar de mostrarse.** Si el plazo venció, lo que corresponde ya no
 * es este banner sino el hecho —*«e-PetPlace tomó el caso»* (§5)—, y eso es
 * un evento del hilo, no un plazo. La pantalla no lo monta; la pieza no se
 * apaga sola. *Una pieza que decidiera cuándo desaparecer tendría que saber
 * qué la reemplaza.*
 *
 * ── LOS TRES TEMAS Y REDUCE-MOTION (N15) ────────────────────────────────
 * Cero movimiento: no hay nada que reducir, en ningún tema. La superficie es
 * neutra del tema, así que memorial degrada solo.
 *
 * ── PUERTA ──────────────────────────────────────────────────────────────
 * Bajo la cabecera del caso, en la app de Negocios (§5) y en la de la familia
 * cuando el plazo es suyo. **Entregada y no montada.**
 */
import { View } from 'react-native'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { Texto } from './Texto'

export type BannerPlazoProps = {
  /**
   * La línea ENTERA, ya redactada: «Te quedan 14 horas para responder».
   * Ver la cabecera: no se parte en número y palabras.
   */
  voz: string
}

export function BannerPlazo({ voz }: BannerPlazoProps) {
  const { theme } = useTheme()

  return (
    <View
      // `role="text"`: informa, no se toca. Un plazo no es un control.
      accessibilityRole="text"
      style={{
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[2],
        borderRadius: radius.suave,
        // NEUTRO Y DEL TEMA. La superficie hundida es la del sistema
        // diciendo algo, no la de una alerta — y en memorial resuelve a su
        // propia superficie serena sin que esta pieza sepa nada.
        backgroundColor: theme.bg.hundido,
      }}
    >
      {/* `secondary` y no `warning`: ver la primera nota de la cabecera.
          `tabular` para que la línea no tiemble al bajar el número. */}
      <Texto variante="apoyo" color="secondary" tabular>
        {voz}
      </Texto>
    </View>
  )
}
