/**
 * DOCUMENTOS — la bóveda de papeles de la mascota (S113-B · fase 3 · B1).
 *
 * ⏪ Esto era una **línea plegable** dentro de «Identidad y papeles». El
 * founder le dio pantalla propia, y la razón se ve en lo que entra: *acá viven
 * juntos los papeles que la familia TRAE de otra clínica y los que la casa
 * EMITE* — y eso no es una sección de un acordeón, es el lugar donde alguien va
 * a buscar un examen parado en el pasillo de una veterinaria.
 *
 * ── 🔴 NINGUNA FILA LLEVA COLOR DE ALARMA ───────────────────────────────
 * Ni una, en ningún estado. *Un papel no está «mal»: un papel dice algo. El
 * color de alarma en una lista de exámenes es una interpretación con otra
 * ropa, y la interpretación es del veterinario.* (Ver `papeles-boveda.ts`.)
 *
 * ── 🔴 SIN PAPELES NO HAY LISTA, Y TAMPOCO RÓTULOS ──────────────────────
 * Un grupo vacío **no se monta** —ni con su rótulo—: *un rótulo sobre nada le
 * dice a la familia que ahí debería haber algo y que se perdió.* Con la bóveda
 * entera vacía va la invitación sola.
 *
 * ── ⛔ MEMORIAL: SE LEE ENTERA, Y NO SE PIDE NADA ───────────────────────
 * **La lista NO se apaga** —*es lo que queda, y es justamente cuando más se
 * consulta*— y lo que desaparece es **traer papeles**: *pedirle a alguien que
 * vaya a buscar la historia clínica de quien ya no está es no haber entendido
 * dónde está parado.*
 *
 * ── LO QUE NO HACE ──────────────────────────────────────────────────────
 * **No compone voz (Ley 3)**: rótulos, título, origen y fecha llegan escritos.
 * **No sabe de dónde salió cada papel**: el grupo se lo dicen.
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * La ruta Documentos de la mascota (C). ⚠️ La puerta de A
 * (`papeles_familia`/`papel_valor`) **no estaba en `origin/main`** al
 * escribirla: la pieza recibe todo por props y **hay que cotejar nombres** el
 * día que aterrice.
 */

import { Pressable, ScrollView, View } from 'react-native'

import { Boton } from './Boton'
import { Chevron } from './chevron'
import { Icono, type IconoNombre } from './Icono'
import { Texto } from './Texto'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { bovedaVacia, gruposConPapeles, type GrupoPapel, type PapelEnLista } from './papeles-boveda'

export type { GrupoPapel, PapelEnLista } from './papeles-boveda'

/**
 * 🔴 **EL GLIFO POR GRUPO LO DECIDE LA PIEZA** (Ley 12): si entrara por prop,
 * dos pantallas podrían darle a «Exámenes» dos íconos y el mismo papel se
 * leería como dos cosas. Exhaustivo: **un grupo nuevo sin glifo no compila.**
 *
 * Los tres traídos comparten `papel` a propósito — el rótulo ya dice cuál es.
 * Los `propios` llevan `documentos`, que es la sección de la casa.
 */
const GLIFO = {
  examenes: 'papel',
  recetas: 'receta',
  informes: 'papel',
  propios: 'documentos',
} satisfies Record<GrupoPapel, IconoNombre>

export interface GrupoDePapeles {
  grupo: GrupoPapel
  /** *«Exámenes»* — ya redactado (Ley 3). */
  rotulo: string
  papeles: readonly PapelEnLista[]
}

export interface PantallaDocumentosProps {
  grupos: readonly GrupoDePapeles[]
  /**
   * 🔴 **Traer papeles: la voz Y el acto.** *Un botón grande arriba que no
   * lleva a ningún lado es la peor fila de esta pantalla.*
   * ⛔ En memorial no se dibuja aunque venga — ver la cabecera.
   */
  traer: { voz: string; onPress: () => void }
  /**
   * *«Todavía no hay papeles de Thor. Si ya tiene historia en otra clínica,
   * tráela: la leemos por vos»* — ya redactada, con el nombre adentro.
   */
  vozVacio: string
}

export function PantallaDocumentos({ grupos, traer, vozVacio }: PantallaDocumentosProps) {
  const { theme } = useTheme()
  const esMemorial = theme.mode === 'memorial'
  const conAlgo = gruposConPapeles(grupos)

  return (
    <ScrollView contentContainerStyle={{ padding: spacing[4], gap: spacing[5] }}>
      {/* ⛔ En memorial no se pide nada. Ver la cabecera. */}
      {esMemorial ? null : (
        <Boton variante="primario" etiqueta={traer.voz} onPress={traer.onPress} />
      )}

      {bovedaVacia(grupos) ? (
        /* 🔴 El vacío INVITA y no se disculpa — y no dibuja ni un rótulo. */
        <Texto variante="apoyo">{vozVacio}</Texto>
      ) : (
        conAlgo.map((g) => (
          <View key={g.grupo} style={{ gap: spacing[2] }}>
            <Texto variante="seccion">{g.rotulo}</Texto>
            <View style={{ borderRadius: radius.md, backgroundColor: theme.bg.card, overflow: 'hidden' }}>
              {g.papeles.map((p) => (
                <FilaPapel key={p.id} papel={p} glifo={GLIFO[g.grupo]} />
              ))}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  )
}

function FilaPapel({ papel, glifo }: { papel: PapelEnLista; glifo: IconoNombre }) {
  const { theme } = useTheme()
  /* El label junta las tres: quien no ve la pantalla necesita saber de dónde
     vino y de cuándo es, no sólo cómo se llama. */
  const label = [papel.titulo, papel.origen, papel.fecha].filter((x) => x !== undefined).join(' · ')

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={papel.onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        minHeight: 44,
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[4],
      }}
    >
      {/* 🔴 `registro="tinta"` y NUNCA un registro de estado: *un examen no
          está bien ni mal, y teñirlo sería interpretarlo.* */}
      <Icono nombre={glifo} tamano={21} registro="tinta" montaje="control" />
      <View style={{ flex: 1, gap: spacing[0.5] }}>
        <Texto>{papel.titulo}</Texto>
        {/* 19.9: lo que no hay no se pinta. Sin origen, no va la línea — *poner
            «origen desconocido» es escribir algo que el papel no dice.* */}
        {papel.origen !== undefined ? <Texto variante="apoyo">{papel.origen}</Texto> : null}
      </View>
      {papel.fecha !== undefined ? <Texto variante="dato">{papel.fecha}</Texto> : null}
      <Chevron color={theme.text.tertiary} direccion="derecha" />
    </Pressable>
  )
}
