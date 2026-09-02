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

/**
 * Los estados en que el refugio ve a un animal suyo.
 *
 * ── DE DÓNDE SALE CADA UNO, porque NO son los del motor y eso es a propósito
 * Los cuatro de `§4.2` los nombró el founder —*«en rescate · publicado · en
 * proceso · adoptado»*— y esta unión sigue SU palabra, no la de la tabla:
 * `en_rescate` es lo que el motor llama `borrador`. **Divergimos donde el
 * founder puso otra palabra, y sólo ahí.**
 *
 * ── 🔴 `no_disponible` — EL SÉPTIMO, Y NO SE MAPEA A `pausada` (S112-B) ───
 * Lo trajo C frenando antes de mapear, y el motor le da la razón **por
 * constraint**: `chk_no_disponible_coherente` exige `retirada_en NOT NULL`, y
 * `despublicar_adoptable` escribe además `motivo_retiro`. **Es un retiro
 * DEFINITIVO del publicador**, mientras que el catálogo define `pausada` como
 * *«la retiró temporalmente. No es un rechazo»*. *Pintarlos igual le diría al
 * refugio que puede volver a publicar algo que retiró.*
 *
 * **Conserva el nombre del motor, y ésa es la decisión:** la migración
 * `20260907880000` jubiló `retirada` con la razón exacta que esta casa usa
 * —*«la palabra vieja describía el acto y no el estado»*— así que el trabajo
 * de nombrar ya estaba hecho y bien hecho. *Inventarle un sinónimo sería un
 * segundo vocabulario para el mismo hecho, sin razón.*
 *
 * ── ⚠️ `en_proceso` NO TIENE PRODUCTOR HOY, y se declara en vez de sacarse ─
 * Es letra firmada del founder (`§4.2`) y por eso queda. **Pero medido por C
 * contra el motor: después de que el refugio acepta, la publicación sigue en
 * `publicada` hasta el traspaso, que la pasa a `adoptada` — no hay estado
 * intermedio.** Lo único cerca es `solicitudesVivas`, que cuenta *«hay gente
 * escribiendo»* y **no** *«esta adopción está en curso»*: derivarlo de ahí
 * pintaría «en proceso» sobre un animal que apenas recibió una consulta.
 *
 * ⇒ **Ninguna fila lo va a usar hasta que el motor distinga «aceptada,
 * traspaso pendiente».** Queda con su costo dicho: cada pantalla tiene que
 * escribirle una voz a un estado que todavía no se dibuja. *Se paga porque la
 * alternativa —sacarlo y volver a ponerlo— rompe el `voces` de todos los
 * consumidores el día que el motor lo produzca.*
 */
export type EstadoMascotaRefugio =
  | 'en_rescate'
  | 'publicada'
  | 'pausada'
  | 'en_proceso'
  | 'adoptada'
  | 'no_disponible'
  | 'memorial'

/**
 * El interruptor de publicar/pausar.
 *
 * **Ausente** = no hay interruptor (adoptada, `no_disponible`, memorial): el
 * ciclo terminó y ofrecer un control muerto es peor que no ofrecerlo.
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
  /**
   * 🔴 S112-B · **EL AVATAR DE LA CASA** (corrección del founder, 2-sep): sin
   * foto propia va la cara de su raza —o de su especie si no hay raza
   * declarada—. URL YA RESUELTA de `especies-razas`. La huella se retiró.
   *
   * ⚠️ **Acá pesa más que en la vidriera**: ésta es la lista de trabajo del
   * refugio, y una columna de huellas idénticas no le deja distinguir a sus
   * propios animales de un vistazo. *El avatar de especie es lo que vuelve
   * la lista legible antes de leer un nombre.*
   */
  fotoDeEspecie?: string | null
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
 * EL MAPEO, y las siete decisiones que contiene.
 *
 * `alDia` para lo que está corriendo bien (publicada) y para el final feliz
 * (adoptada). `proximo` para lo que está en curso y va a pasar (en proceso).
 * `info` para los cuatro estados neutros — en rescate, pausada, no disponible
 * y memorial: son hechos, no pendientes.
 *
 * 🔴 **`atencion` no aparece a propósito.** Es la familia que grita, y
 * ninguno de los siete lo merece: un animal esperando no es un error.
 */
const FAMILIA: Record<EstadoMascotaRefugio, InsigniaEstado> = {
  en_rescate: 'info',
  publicada: 'alDia',
  pausada: 'info',
  en_proceso: 'proximo',
  adoptada: 'alDia',
  /* Retiro definitivo del publicador: un hecho, no un pendiente ni un
     problema. Va con los otros neutros — y NO con `pausada`, aunque
     compartan familia: lo que los distingue no es el color sino la
     VOZ, que la escribe la pantalla, y que el retirado no tenga
     interruptor. */
  no_disponible: 'info',
  memorial: 'info',
}

export function TarjetaMascotaRefugio({
  nombre,
  fotoUrl,
  fotoDeEspecie,
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
          <AvatarMascota
            nombre={nombre}
            fotoUrl={fotoUrl ?? undefined}
            fotoDeEspecie={fotoDeEspecie ?? undefined}
            tamano="md"
          />

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
