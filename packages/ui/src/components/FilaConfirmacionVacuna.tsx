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
import { detalleVisible, faltanPorTocar, pideRevision, type ConfianzaIA } from './vacunas-estado'

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
  origen: OrigenLectura
  /** La voz del origen, ya compuesta (Ley 3): *«leído de un sticker»*. */
  vozOrigen: string
  /** *«Revisá esta»* — la pantalla pone su i18n. */
  vozRevisar: string
  /** *«Es correcta»*. */
  vozConfirmar: string
  /** Ya tocada por la persona. */
  tocada: boolean
  onConfirmar: () => void
  onEditar: () => void
}

export function FilaConfirmacionVacuna({
  nombre,
  campos,
  confianza,
  vozOrigen,
  vozRevisar,
  vozConfirmar,
  tocada,
  onConfirmar,
  onEditar,
}: FilaConfirmacionVacunaProps) {
  const { theme } = useTheme()
  const revisar = pideRevision(confianza)
  const conValor = detalleVisible(campos)
  const vacios = campos.filter((c) => c.valor == null || c.valor.trim() === '')

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

      {/* De dónde salió: un sello no vale lo mismo que un número a mano. */}
      <Texto variante="apoyo">{vozOrigen}</Texto>

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
    </View>
  )
}

export interface PieConfirmacionVacunasProps {
  /** Una por fila. **El pie no sabe de vacunas: sabe de toques.** */
  tocadas: readonly boolean[]
  /** *«Guardar 5 vacunas»* — compuesta por la pantalla. */
  vozGuardar: string
  /** 🔴 **LA RAZÓN DEL APAGADO, ya compuesta con su número**: *«faltan 2 por
   *  revisar»*. La pieza le pasa el número; la pantalla arma la frase. */
  vozFaltan: (n: number) => string
  onGuardar: () => void
}

/** El pie de la tanda. **Se enciende sólo con todas tocadas, y apagado dice
 *  cuántas faltan** — *un botón apagado sin razón a la vista es el defecto.* */
export function PieConfirmacionVacunas({ tocadas, vozGuardar, vozFaltan, onGuardar }: PieConfirmacionVacunasProps) {
  const { theme } = useTheme()
  const faltan = faltanPorTocar(tocadas)
  const listo = faltan === 0 && tocadas.length > 0

  return (
    <View style={{ gap: spacing[2] }}>
      {/* La razón va ARRIBA del botón y no adentro: el botón dice qué hace,
          la línea dice por qué todavía no. */}
      {listo ? null : <Texto variante="apoyo">{vozFaltan(faltan)}</Texto>}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={vozGuardar}
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
          {vozGuardar}
        </Texto>
      </Pressable>
    </View>
  )
}
