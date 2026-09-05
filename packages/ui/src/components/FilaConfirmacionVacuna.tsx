/**
 * FILA DE CONFIRMACIÓN DE VACUNA — lo que la IA leyó, antes de que sea verdad.
 *
 * **La revisión es lo único que separa a la extracción de inventar datos
 * clínicos** (`L-139`: el modelo produce cosas verosímiles y falsas, y las
 * fechas de sticker de S48 son el caso vivo). Por eso esta pieza está armada
 * para que revisar sea barato y confirmar en bloque sea imposible.
 *
 * ── 🔴 LA CONFIANZA SE VE, Y «MEDIA» TAMBIÉN CUENTA ────────────────────
 * Confianza baja **o media** ⇒ borde de atención y *«Revisá esta»*. *«Media»
 * quiere decir que el modelo dudó, y una duda que no se muestra es una
 * afirmación.* El umbral vive en `pideRevision`, no acá.
 *
 * ── 🔴 CADA FILA PIDE SU TOQUE ─────────────────────────────────────────
 * No hay «confirmar todas». El pie sólo se enciende con todas tocadas, y
 * mientras tanto **dice cuántas faltan** — *un botón apagado sin razón a la
 * vista es el defecto; éste dibuja la suya.*
 *
 * ── 🔴 LO QUE LLEGÓ `null` SE MUESTRA VACÍO, JAMÁS SUGERIDO ────────────
 * Un valor propuesto en un campo que el modelo no leyó es exactamente cómo un
 * dato inventado entra al expediente firmado por el dueño: *él ve algo
 * plausible, no lo toca, y queda como si lo hubiera confirmado.*
 *
 * ── 🔴 «ESTA NO ES» — LA SALIDA QUE HACE HONESTA A LA REVISIÓN ─────────
 * Editar corrige un dato; **descartar dice que la fila no debería existir**, y
 * son dos actos distintos. Sin la segunda, una revisión que sólo puede
 * confirmar o corregir **obliga a quedarse con lo que la IA se inventó** — y
 * ahí la pantalla deja de ser una revisión para ser un trámite con pasos.
 * *Una fila que la IA propone y que nadie puede rechazar no es una revisión*,
 * y por eso `onDescartar` **es obligatoria**: una casa que la omita no tiene
 * salida, y la omisión no daría ningún error.
 *
 * ── ⚠️ Y DESCARTAR **ES** REVISAR ──────────────────────────────────────
 * La cuenta vive en `resumenDeLaTanda`. *Si una descartada no contara como
 * revisada, el pie quedaría apagado para siempre y sin forma de encenderlo.*
 *
 * ── ⚠️ LO QUE ESTA PIEZA NO DIBUJA ─────────────────────────────────────
 * **Las filas del plan impreso.** En un carnet suele venir la tabla del plan
 * vacunal de la especie, y **esas filas NO son vacunas aplicadas**. Dibujarlas
 * acá las volvería registros con un toque. Si hay que mostrarlas, es otra
 * pieza —*«En el carnet también figuran…»*, en tinta y sin acción—.
 */

import { Pressable, View } from 'react-native'

import { Texto } from './Texto'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { detalleVisible, resumenDeLaTanda, pideRevision, type ConfianzaIA, type FilaDeLaTanda } from './vacunas-estado'

/** De dónde salió el dato en el papel. **Se dice** porque no es lo mismo un
 *  sello del veterinario que un número escrito a mano en el margen. */
export type OrigenLectura = 'sticker' | 'sello' | 'aMano'

export interface CampoLeido {
  etiqueta: string
  /** `null` = **el modelo no lo leyó**. Se dibuja vacío y editable. */
  valor: string | null
}

export interface FilaConfirmacionVacunaProps {
  nombre: string
  campos: readonly CampoLeido[]
  confianza: ConfianzaIA
  /** 🔴 La voz de la procedencia, ya compuesta (Ley 3): *«leído de un
   *  sticker»*. **Ausente ⇒ no se dibuja NINGUNA línea de procedencia**
   *  (19.9): *de un carnet donde no se distingue si fue sello o lapicera no
   *  sale una procedencia por defecto — sale ninguna.*
   *
   *  ☠️ Al lado vivía `origen: OrigenLectura`, **obligatoria y jamás leída
   *  por la pieza**: ni se desestructuraba. *Un prop que el contrato exige y
   *  el dibujo ignora es una promesa* — el que lo pasa cree estar decidiendo
   *  algo. El dato es de la pantalla y ahí se queda; el tipo sigue exportado
   *  porque es el vocabulario de esta revisión. */
  vozOrigen?: string
  /** *«Revisá esta»* — la pantalla pone su i18n. */
  vozRevisar: string
  /** *«Es correcta»*. */
  vozConfirmar: string
  /** *«Esta no es»*. */
  vozDescartar: string
  /** Ya tocada por la persona. */
  tocada: boolean
  /** La persona dijo que esta vacuna no existe. */
  descartada?: boolean
  /** La línea que lo dice mientras está descartada: *«No se va a guardar»*.
   *  Sin ella la fila se apaga y no explica por qué. */
  vozDescartada?: string
  /** El camino de vuelta. **Si la pantalla saca la fila de la lista al
   *  descartarla, no hace falta** — pero si la deja a la vista, tiene que
   *  poder deshacerse: *un toque de más en una revisión no puede costar una
   *  vacuna del carnet.* */
  onDeshacer?: () => void
  vozDeshacer?: string
  onConfirmar: () => void
  onEditar: () => void
  onDescartar: () => void
}

export function FilaConfirmacionVacuna({
  nombre,
  campos,
  confianza,
  vozOrigen,
  vozRevisar,
  vozConfirmar,
  vozDescartar,
  tocada,
  descartada = false,
  vozDescartada,
  onDeshacer,
  vozDeshacer,
  onConfirmar,
  onEditar,
  onDescartar,
}: FilaConfirmacionVacunaProps) {
  const { theme } = useTheme()
  const revisar = pideRevision(confianza)
  const conValor = detalleVisible(campos)
  const vacios = campos.filter((c) => c.valor == null || c.valor.trim() === '')

  /* 🔴 DESCARTADA: se apaga y **dice por qué**, con su camino de vuelta si la
     pantalla lo ofrece. No se dibujan ni los campos vacíos ni el confirmar —
     *ofrecer «Es correcta» sobre algo que la persona acaba de rechazar es
     pedirle que se contradiga.* Queda a la vista y no desaparece: **una fila
     que se esfuma no deja ver que el toque hizo algo.** */
  if (descartada) {
    return (
      <View
        style={{
          borderRadius: radius.md,
          padding: spacing[4],
          gap: spacing[2],
          backgroundColor: theme.bg.hundido,
        }}
      >
        <Texto variante="cuerpo" color="secondary" numberOfLines={1}>
          {nombre}
        </Texto>
        {vozDescartada !== undefined ? <Texto variante="apoyo">{vozDescartada}</Texto> : null}
        {onDeshacer !== undefined && vozDeshacer !== undefined ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={vozDeshacer}
            onPress={onDeshacer}
            style={{ minHeight: 44, justifyContent: 'center' }}
          >
            {/* La única línea viva de una tarjeta apagada: en tinta plena
                contra un nombre en secundaria, es lo que se lee primero. */}
            <Texto variante="enfasis">{vozDeshacer}</Texto>
          </Pressable>
        ) : null}
      </View>
    )
  }

  return (
    <View
      style={{
        borderRadius: radius.md,
        padding: spacing[4],
        gap: spacing[3],
        backgroundColor: theme.bg.card,
        /* El borde de atención, **sólo cuando el modelo dudó.** */
        borderWidth: revisar ? 1.5 : 0,
        borderColor: revisar ? theme.status.warningText : 'transparent',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[2] }}>
        <Texto variante="cuerpo">{nombre}</Texto>
        {revisar ? <Texto variante="apoyo" color="warning">{vozRevisar}</Texto> : null}
      </View>

      {/* Lo que el modelo SÍ leyó. */}
      {conValor.map((c) => (
        <View key={c.etiqueta} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing[3] }}>
          <Texto variante="apoyo">{c.etiqueta}</Texto>
          <Texto variante="dato">{c.valor}</Texto>
        </View>
      ))}

      {/* 🔴 Lo que NO leyó: **vacío y editable, jamás con un valor puesto.** */}
      {vacios.map((c) => (
        <Pressable
          key={c.etiqueta}
          accessibilityRole="button"
          accessibilityLabel={c.etiqueta}
          onPress={onEditar}
          style={{
            minHeight: 44,
            justifyContent: 'center',
            paddingHorizontal: spacing[3],
            borderRadius: radius.sm,
            borderWidth: 1,
            borderColor: theme.bg.border,
          }}
        >
          <Texto variante="apoyo">{c.etiqueta}</Texto>
        </Pressable>
      ))}

      {/* De dónde salió: un sello no vale lo mismo que un número a mano.
          🔴 **Sin procedencia no hay línea** — ninguna por defecto (19.9). */}
      {vozOrigen !== undefined ? <Texto variante="apoyo">{vozOrigen}</Texto> : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={vozConfirmar}
        accessibilityState={{ selected: tocada }}
        onPress={onConfirmar}
        style={{
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius.full,
          backgroundColor: tocada ? theme.bg.hundido : theme.accent.cta,
        }}
      >
        <Texto variante="enfasis" color={tocada ? 'secondary' : undefined}>
          {vozConfirmar}
        </Texto>
      </Pressable>

      {/* 🔴 «Esta no es»: **label, sin caja** (19.7 — un sólido por superficie,
          y acá el sólido es confirmar). *No va en rojo de peligro: no destruye
          nada guardado, saca de la lista algo que todavía no es verdad — y
          teñirla de alarma haría que la persona confirme por no asustarse,
          que es justo lo contrario de revisar.* */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={vozDescartar}
        onPress={onDescartar}
        style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
      >
        <Texto variante="apoyo">{vozDescartar}</Texto>
      </Pressable>
    </View>
  )
}

export interface PieConfirmacionVacunasProps {
  /** 🔴 **EL ESTADO DE CADA FILA, no un arreglo de booleanos.**
   *
   *  ⏪ Recibía `tocadas: readonly boolean[]`, y con el descarte ese arreglo
   *  dejó de alcanzar: **una tanda entera descartada daba «cero por revisar»
   *  y encendía el botón para guardar NADA.** *No es un apagado sin razón: es
   *  un encendido que no hace nada, que es peor* — la persona toca «Guardar 5
   *  vacunas» y no se guarda ninguna.
   *
   *  La cura no fue sumar un número al lado —uno que viaja aparte se puede
   *  pasar mal—: **fue que el pie derive sus dos cuentas del mismo dato**, y
   *  ahí el estado equivocado no se puede expresar. */
  filas: readonly FilaDeLaTanda[]
  /** *«Guardar 5 vacunas»* — la pantalla la compone, **con el número que el
   *  pie le pasa** y no con uno propio (mismo trato que `vozFaltan`).
   *  🔴 *Si la pantalla contara por su lado, una tanda con tres descartadas
   *  diría «Guardar 5» sobre un botón que guarda 2 — y el número de un botón
   *  es una promesa.* Acá no hay dos cuentas que puedan discrepar. */
  vozGuardar: (n: number) => string
  /** 🔴 **LA RAZÓN DEL APAGADO, ya compuesta con su número**: *«faltan 2 por
   *  revisar»*. La pieza le pasa el número; la pantalla arma la frase. */
  vozFaltan: (n: number) => string
  /** La otra razón, la que nació con el descarte: *«no queda ninguna para
   *  guardar»*. **Sin ella, una tanda toda descartada apagaría el botón en
   *  silencio** — el mismo defecto por la puerta de al lado. */
  vozNinguna: string
  onGuardar: () => void
}

/** El pie de la tanda. **Se enciende sólo con todas revisadas y al menos una
 *  que guardar, y apagado DICE cuál de las dos razones lo apaga** — *un botón
 *  apagado sin razón a la vista es el defecto.* */
export function PieConfirmacionVacunas({ filas, vozGuardar, vozFaltan, vozNinguna, onGuardar }: PieConfirmacionVacunasProps) {
  const { theme } = useTheme()
  const { faltan, aGuardar, listo } = resumenDeLaTanda(filas)

  return (
    <View style={{ gap: spacing[2] }}>
      {/* La razón va ARRIBA del botón y no adentro: el botón dice qué hace,
          la línea dice por qué todavía no. **Y las dos razones son distintas:
          «faltan 2» se resuelve tocando; «no queda ninguna» no se resuelve
          tocando, y decir la primera cuando pasa la segunda manda a la
          persona a buscar una fila que ya revisó.** */}
      {listo ? null : <Texto variante="apoyo">{faltan > 0 ? vozFaltan(faltan) : vozNinguna}</Texto>}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={vozGuardar(aGuardar)}
        accessibilityState={{ disabled: !listo }}
        disabled={!listo}
        onPress={onGuardar}
        style={{
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius.full,
          backgroundColor: listo ? theme.accent.cta : theme.bg.hundido,
        }}
      >
        <Texto variante="enfasis" color={listo ? undefined : 'tertiary'}>
          {vozGuardar(aGuardar)}
        </Texto>
      </Pressable>
    </View>
  )
}
