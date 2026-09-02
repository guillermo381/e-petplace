/**
 * TarjetaMascotaRefugio — SUS ANIMALES COMO ANIMALES (S112-B, B7).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **UN INTERRUPTOR QUE NO SE PUEDE MOVER Y NO DICE POR QUÉ ES EL DEFECTO
 *    QUE EL FOUNDER PIDIÓ VER EN SU RECORRIDO** (§0, ítem 16: *«Kira no se
 *    puede publicar y el interruptor dice por qué»*).
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Y por eso **el mudo no se puede expresar acá**: `publicacion` es una unión
 * discriminada — o trae `onCambio` (se puede mover) o trae `razon` (no se
 * puede, **y la razón es obligatoria**). Pasar sólo `encendido` no compila.
 *
 * *Es la misma forma que `FormularioPostulacion` le dio a su «Enviar», y por
 * la misma razón: en la superficie donde el silencio cuesta caro, la razón
 * deja de depender de que alguien se acuerde.*
 *
 * ── EL REPARTO CON `Interruptor`, y por qué son dos capas ────────────────
 * `Interruptor` ganó `deshabilitado` y `razonDeshabilitado` (→
 * `accessibilityHint`) porque es lo que él puede saber. **La línea VISIBLE
 * la dibuja esta tarjeta**, que es la única que sabe dónde termina la fila:
 * una línea colgada debajo de un riel de 28 px rompe la fila que lo contiene
 * (N24). *Dos capas, cada una con lo que sabe* — el precedente es
 * `StepperCantidad` y el ajuste al stock.
 *
 * ── EL ESTADO ES UNA ETIQUETA DE CLASE, JAMÁS UNA ALARMA (N23) ───────────
 * El mapeo estado → familia de `Insignia` **vive acá y no en la pantalla**,
 * por el defecto que `EstadoSolicitudAdopcion` ya curó en este mismo
 * vertical: dos pantallas que mapean a mano divergen, y el color termina
 * diciendo cosas distintas del mismo estado. **Ninguno de los seis estados
 * es `atencion`:** *un animal en rescate, pausado o fallecido no es un
 * problema del sistema.* `atencion` queda libre para lo que de verdad
 * reclame algo.
 *
 * ── MEMORIAL: SE REUSA, NO SE DUPLICA ────────────────────────────────────
 * `memorial` es uno de los seis estados y no una tarjeta aparte. La dignidad
 * la pone el TEMA —`<ThemeProvider memorial>` queda siempre encima y todas
 * las piezas ya responden—, así que acá alcanza con que el animal **no
 * desaparezca de la lista** (§4.2: *«la ficha no desaparece en silencio»*) y
 * con que no se le ofrezca un interruptor de publicación. *Escribir un
 * `MemorialMascotaRefugio` sería duplicar en una pieza lo que el tema ya
 * hace en todas.*
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * Tab **Mascotas** del portal del refugio (C7). **Entregada y no montada.**
 */
import { View } from 'react-native'
import { spacing } from '../tokens/spacing'
import { AvatarMascota } from './AvatarMascota'
import { Insignia, type InsigniaEstado } from './Insignia'
import { Interruptor } from './Interruptor'
import { Tarjeta } from './Tarjeta'
import { Texto } from './Texto'

/** Los seis estados en que el refugio ve a un animal suyo (§4.2). */
export type EstadoMascotaRefugio =
  | 'en_rescate'
  | 'publicada'
  | 'pausada'
  | 'en_proceso'
  | 'adoptada'
  | 'memorial'

/**
 * El interruptor de publicar/pausar.
 *
 * **Ausente** = no hay interruptor (adoptada, memorial): el ciclo terminó y
 * ofrecer un control muerto es peor que no ofrecerlo.
 * **Con `onCambio`** = se puede mover.
 * **Con `razon`** = no se puede, y se dice por qué. Los `?: never` impiden
 * mezclar las dos formas y omitir las dos.
 */
type PuedePublicar = {
  etiqueta: string
  encendido: boolean
  onCambio: (encendido: boolean) => void
  razon?: never
}
type NoPuedePublicar = {
  etiqueta: string
  encendido: boolean
  /** «Es adulto y no está esterilizado: se publica esterilizado.» */
  razon: string
  onCambio?: never
}
export type PublicacionDeMascota = PuedePublicar | NoPuedePublicar

export type TarjetaMascotaRefugioProps = {
  nombre: string
  fotoUrl?: string | null
  estado: EstadoMascotaRefugio
  /**
   * Las seis palabras. **`Record` y no un objeto a mano**: un estado nuevo
   * rompe en la pantalla que tiene que decidir cómo se llama, no en silencio
   * adentro de la pieza.
   */
  voces: Record<EstadoMascotaRefugio, string>
  publicacion?: PublicacionDeMascota
  /** Lleva a la ficha de edición. */
  onPress: () => void
  /** accessibilityLabel de la tarjeta entera. Lo compone la pantalla. */
  etiqueta: string
}

/**
 * EL MAPEO, y las seis decisiones que contiene.
 *
 * `alDia` para lo que está corriendo bien (publicada) y para el final feliz
 * (adoptada). `proximo` para lo que está en curso y va a pasar (en proceso).
 * `info` para los tres estados neutros — en rescate, pausada y memorial: son
 * hechos, no pendientes.
 *
 * 🔴 **`atencion` no aparece a propósito.** Es la familia que grita, y
 * ninguno de los seis lo merece: un animal esperando no es un error.
 */
const FAMILIA: Record<EstadoMascotaRefugio, InsigniaEstado> = {
  en_rescate: 'info',
  publicada: 'alDia',
  pausada: 'info',
  en_proceso: 'proximo',
  adoptada: 'alDia',
  memorial: 'info',
}

export function TarjetaMascotaRefugio({
  nombre,
  fotoUrl,
  estado,
  voces,
  publicacion,
  onPress,
  etiqueta,
}: TarjetaMascotaRefugioProps) {
  const bloqueado = publicacion !== undefined && publicacion.onCambio === undefined

  return (
    /* La tarjeta entera lleva a la ficha —«toco uno y edito su ficha»
       (§4.2)— con el interruptor adentro. **Es el patrón de la casa, no una
       excepción:** `TarjetaProducto` monta un `StepperCantidad` dentro de su
       propio tocable desde S99, y el sistema de toques de RN le da el
       responder al control más interno. */
    <Tarjeta interactiva onPress={onPress} accessibilityRole="button" etiqueta={etiqueta}>
      <View style={{ gap: spacing[2] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
          <AvatarMascota nombre={nombre} fotoUrl={fotoUrl ?? undefined} tamano="md" />

          <View style={{ flex: 1, gap: spacing[1] }}>
            {/* El nombre manda por tamaño y peso, jamás por color (N23). */}
            <Texto variante="enfasis" numberOfLines={1}>
              {nombre}
            </Texto>
            <View style={{ flexDirection: 'row' }}>
              <Insignia estado={FAMILIA[estado]} etiqueta={voces[estado]} tamaño="sm" />
            </View>
          </View>

          {publicacion === undefined ? null : (
            <Interruptor
              encendido={publicacion.encendido}
              /* Con `razon` no hay `onCambio`, y el control está apagado: el
               * no-op nunca se llama. Va igual porque la prop es obligatoria
               * y un `undefined` acá diría que el control es de sólo lectura,
               * que es otra cosa. */
              onCambio={publicacion.onCambio ?? (() => {})}
              etiqueta={publicacion.etiqueta}
              registro="oficio"
              deshabilitado={bloqueado}
              razonDeshabilitado={publicacion.razon}
            />
          )}
        </View>

        {/* LA RAZÓN, DEBAJO DE LA FILA ENTERA y no del riel. Atenuada, nunca
            roja: no es un error de quien mira, es el estado del animal
            (misma doctrina que `D-999` en `Boton`). */}
        {publicacion?.razon === undefined ? null : (
          <Texto variante="apoyo">{publicacion.razon}</Texto>
        )}
      </View>
    </Tarjeta>
  )
}
