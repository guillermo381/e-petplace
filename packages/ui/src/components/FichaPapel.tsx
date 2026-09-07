/**
 * LA FICHA DE UN PAPEL — lo que dice, de dónde vino (S113-B · fase 3 · B3).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **TRANSCRIBE. NO INTERPRETA. Y EL TIPO NO DEJA HACER OTRA COSA.**
 * ═══════════════════════════════════════════════════════════════════════════
 * La tabla dibuja **analito · valor con su unidad · referencia si estaba
 * impresa**. No hay semáforo, no hay flecha, no hay color. Y no es que estén
 * apagados: **no se pueden expresar** —`ValorDePapel` no tiene un
 * `'alto' | 'bajo'`—. *Lo que un tipo permite, alguien lo escribe el día que
 * tiene apuro; y el que lee esto después es un veterinario decidiendo un
 * tratamiento.*
 *
 * Lo único que puede aparecer es **la marca que el propio laboratorio
 * imprimió, como texto**: *no es nuestra lectura, es lo que el papel dice.*
 *
 * ── 🔴 «BORRAR EL PAPEL» AVISA LO QUE NO SE VA ──────────────────────────
 * Los eventos que ya entraron al expediente **se quedan**, y eso se dice
 * ANTES: *alguien que borra un papel creyendo que borra la vacuna que anotó
 * descubre que no, el día que la busque y la encuentre.* La pieza exige la voz
 * de esa advertencia — sin ella no compila.
 *
 * ── LO QUE NO HACE ──────────────────────────────────────────────────────
 * **No compone voz (Ley 3)** · **no abre el documento**: recibe el acto ·
 * **no decide si se puede borrar**: eso llega resuelto.
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * La ruta del papel (C).
 */

import { View } from 'react-native'

import { Boton } from './Boton'
import { Texto } from './Texto'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import type { MedicacionDePapel, ValorDePapel } from './papeles-boveda'

export type { MedicacionDePapel, ValorDePapel } from './papeles-boveda'

/**
 * 🔴 **UN PAPEL ES UNA COSA O LA OTRA, JAMÁS LAS DOS.** Con `valores?` y
 * `medicacion?` opcionales se podía mandar un examen que además receta, y ahí
 * alguien tiene que decidir cuál gana — una decisión que nadie firmó.
 */
export type ContenidoDePapel =
  | { tipo: 'examen'; valores: readonly ValorDePapel[] }
  | { tipo: 'receta'; medicacion: readonly MedicacionDePapel[] }
  /** Un informe es prosa: se muestra como llegó, sin partir. */
  | { tipo: 'informe'; texto: string }

export interface FichaPapelProps {
  /** *«Hemograma completo»* — ya redactado. */
  titulo: string
  /** *«Clínica San Roque»* — ausente si el papel no lo dice. */
  origen?: string
  /** *«12 mar 2025»* — ya redactada. */
  fecha?: string
  contenido: ContenidoDePapel
  /** Abrir el documento entero. **Obligatorio**: *la transcripción es una
   *  lectura nuestra; el papel es la prueba, y siempre se puede ir a verla.* */
  documento: { voz: string; onPress: () => void }
  /**
   * 🔴 **Borrar, con su advertencia. Las dos o ninguna.** Ausente = este papel
   * no se puede borrar y la pieza no dibuja el botón (no uno apagado).
   */
  borrar?: {
    voz: string
    /** *«Los datos que ya entraron al expediente de Thor se quedan»* */
    vozAdvertencia: string
    onPress: () => void
  }
}

export function FichaPapel({ titulo, origen, fecha, contenido, documento, borrar }: FichaPapelProps) {
  const { theme } = useTheme()

  return (
    <View style={{ gap: spacing[5] }}>
      <View style={{ gap: spacing[1] }}>
        <Texto variante="titulo">{titulo}</Texto>
        {/* 19.9: sin origen no va la línea. */}
        {origen !== undefined ? <Texto variante="apoyo">{origen}</Texto> : null}
        {fecha !== undefined ? <Texto variante="dato">{fecha}</Texto> : null}
      </View>

      <View style={{ borderRadius: radius.md, backgroundColor: theme.bg.card, padding: spacing[4], gap: spacing[3] }}>
        {contenido.tipo === 'examen'
          ? contenido.valores.map((v) => <FilaValor key={v.id} valor={v} />)
          : contenido.tipo === 'receta'
            ? contenido.medicacion.map((m) => (
                <View key={m.id} style={{ gap: spacing[0.5] }}>
                  <Texto>{m.nombre}</Texto>
                  {/* Sin dosis, la línea NO se dibuja: *inventar «según
                      indicación» es escribir lo que el papel no dice.* */}
                  {m.dosis !== undefined ? <Texto variante="apoyo">{m.dosis}</Texto> : null}
                  {m.duracion !== undefined ? <Texto variante="dato">{m.duracion}</Texto> : null}
                </View>
              ))
            : <Texto>{contenido.texto}</Texto>}
      </View>

      <Boton variante="secundario" etiqueta={documento.voz} onPress={documento.onPress} />

      {borrar !== undefined ? (
        <View style={{ gap: spacing[2] }}>
          {/* 🔴 La advertencia va ANTES del botón y no adentro de un diálogo:
              *lo que hay que saber para decidir se lee antes de decidir.* */}
          <Texto variante="apoyo">{borrar.vozAdvertencia}</Texto>
          <Boton variante="secundario" etiqueta={borrar.voz} onPress={borrar.onPress} />
        </View>
      ) : null}
    </View>
  )
}

function FilaValor({ valor }: { valor: ValorDePapel }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] }}>
      <View style={{ flex: 1 }}>
        <Texto>{valor.analito}</Texto>
        {/* La referencia, SÓLO si estaba impresa. Su ausencia no se rellena. */}
        {valor.referencia !== undefined ? <Texto variante="dato">{valor.referencia}</Texto> : null}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        {/* 🔴 El valor va en la voz de DATO y **sin color**: teñirlo sería
            decir si está bien o mal, que es exactamente lo que no hacemos. */}
        <Texto variante="dato">{valor.unidad === undefined ? valor.valor : `${valor.valor} ${valor.unidad}`}</Texto>
        {/* 🔴 La marca del laboratorio, como TEXTO. No es nuestra lectura. */}
        {valor.marcaImpresa !== undefined ? <Texto variante="apoyo">{valor.marcaImpresa}</Texto> : null}
      </View>
    </View>
  )
}
