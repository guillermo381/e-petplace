/**
 * HitoUnaVidaNueva — LA CARTA DEL HITO, SIN CONFETI (S112-B, B5).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **NO SE CELEBRA CON MOVIMIENTO. SE CELEBRA CON PERMANENCIA.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * El hito se escribe cuando la segunda firma cierra la adopción (A9) y **queda
 * en la línea de vida para siempre, con aniversario anual**. Eso es lo que
 * cambia todo el diseño: *no es una pantalla de felicitación que se ve una
 * vez — es una carta que la familia va a volver a encontrar dentro de tres
 * años.* Una animación de confeti se ve bien la primera vez y es ruido las
 * otras cincuenta.
 *
 * ── LO QUE ESTA PIEZA NO TIENE, y cada ausencia es una decisión ──────────
 * · **Cero animación.** Ni entrada, ni destello, ni confeti (N15). Si la
 *   pantalla quiere que aparezca escalonada, la envuelve en `Entrada` — la
 *   dosis de ceremonia es del contexto, no de la pieza.
 * · **Cero acción.** No navega, no comparte, no ofrece nada. Un hito no es
 *   una oferta; agregarle un botón lo convierte en una tarjeta de campaña.
 * · **Cero diccionario** (Ley 3): hasta el título entra por prop, porque la
 *   pantalla sabe si dice «Una vida nueva empieza» o «Hace un año empezaba
 *   una vida nueva», y la pieza no.
 *
 * ── LOS TRES TEMAS Y REDUCE-MOTION, declarados al nacer (N15) ────────────
 * · **light / dark:** el `Guijarro` toma el tinte de su capa desde el tema.
 * · **memorial:** `Guijarro` degrada solo —tinte a `bg.overlay`, sin capa— y
 *   `Tarjeta` y `Texto` ya resuelven contra el sub-tema. **No hay una rama
 *   `esMemorial` acá, y es a propósito:** la dignidad del memorial es del
 *   TEMA, no de una pieza (`<ThemeProvider memorial>` queda SIEMPRE encima).
 *   *Escribir la rama sería duplicar en una pieza lo que el tema ya hace en
 *   todas.*
 * · **reduce-motion:** trivial — no hay nada que reducir. Se declara igual
 *   porque la ley pide declararlo, no cumplirlo por casualidad.
 *
 * ── LA ILUSTRACIÓN ───────────────────────────────────────────────────────
 * `Guijarro` es el lenguaje de ilustración de la casa (`DIRECCION_ARTE` §4) y
 * su propia cabecera autoriza este uso: *«solo superficies grandes — heros,
 * Hojas educativas, cards de índice»*. Capa **`comunidad`**: el hito no es de
 * salud ni de cuidado — *es el momento en que un animal pasa a pertenecer.*
 * El motivo es la **Huella**, que es como la casa dice «la mascota está
 * presente» (b′). La rotación es un número fijo y no aleatorio: dos cartas
 * del mismo hito tienen que verse iguales, y §4 pide que dos guijarros de LA
 * MISMA VISTA se roten distinto — no que uno cambie entre renders.
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * La línea de vida de la mascota y el cierre del acta en el cliente (C8).
 * **Entregada y no montada.**
 */
import { View } from 'react-native'
import Svg from 'react-native-svg'
import { Huella } from '../brand/Huella'
import { Guijarro } from '../brand/Guijarro'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { FilaDato } from './FilaDato'
import { Tarjeta } from './Tarjeta'
import { Texto } from './Texto'

export type HitoUnaVidaNuevaProps = {
  /** «Una vida nueva empieza». La escribe la pantalla (Ley 3). */
  titulo: string
  /**
   * La fecha **YA REDACTADA** por el riel de fechas de la casa. La pieza no
   * formatea: un `Date` acá significaría que cada consumidor elige su
   * formato, y dos hitos de la misma familia se leerían distinto.
   */
  fecha: string
  /**
   * De dónde viene. `etiqueta` es el rótulo («Procedencia») y `valor` el
   * nombre del refugio — los dos de la pantalla.
   *
   * **Opcional, y no por comodidad:** el hito también se escribe en
   * adopciones sin refugio de por medio el día que existan. *Un rótulo que
   * dice «Procedencia» sobre un vacío es peor que no decirlo.*
   */
  procedencia?: { etiqueta: string; valor: string }
}

/** Fijo: dos cartas del mismo hito tienen que verse iguales. Ver la nota. */
const ROTACION = -14
const TAMANO_ILUSTRACION = 72

export function HitoUnaVidaNueva({ titulo, fecha, procedencia }: HitoUnaVidaNuevaProps) {
  const { theme } = useTheme()

  return (
    <Tarjeta>
      <View style={{ gap: spacing[3], alignItems: 'center' }}>
        <Guijarro capa="comunidad" tamano={TAMANO_ILUSTRACION} rotacion={ROTACION}>
          {/* La Huella vive dentro de un `<Svg viewBox="0 0 24 24">` porque
              se dibuja como `<G>` — es la primitiva, no un ícono suelto, y
              nadie la redibuja a mano. */}
          <Svg width={TAMANO_ILUSTRACION * 0.42} height={TAMANO_ILUSTRACION * 0.42} viewBox="0 0 24 24">
            <Huella color={theme.text.primary} />
          </Svg>
        </Guijarro>

        {/* El título en `titulo` y no en `seccion`: es lo que la persona vino
            a leer, y esta carta no tiene nada que le compita. */}
        <Texto variante="titulo">{titulo}</Texto>

        {/* La fecha en mono: es un dato de máquina, y la casa las escribe
            así en todos lados (Ley 3 del registro). */}
        <Texto variante="dato" color="secondary">
          {fecha}
        </Texto>
      </View>

      {procedencia === undefined ? null : (
        <View style={{ marginTop: spacing[4] }}>
          <FilaDato
            etiqueta={procedencia.etiqueta}
            valor={procedencia.valor}
            disposicion="horizontal"
          />
        </View>
      )}
    </Tarjeta>
  )
}
