/**
 * LISTA DEL PLAN VACUNAL — lo que la especie pide, contra lo que el carnet
 * tiene (S113-B · 1.0).
 *
 * ── 🔴 LA REGLA QUE ORDENA TODA LA PIEZA ────────────────────────────────
 * **El carnet AFIRMA; el plan CALCULA, y se dice como cálculo.**
 * *«Vence el 12 de marzo» es una promesa del papel; «según el plan, tocaría
 * en marzo» es una cuenta nuestra.* Confundirlas hace que la app afirme algo
 * que ningún documento dice — y el dueño la va a creer, porque hasta ahí todo
 * lo que leyó salía del carnet.
 *
 * ⚠️ **La pieza no compone esa frase** (Ley 3): recibe `vozPlan` ya armada por
 * la pantalla. Lo que sí garantiza es que **la voz del plan y la del carnet no
 * pueden confundirse en el dibujo**: la del plan va en apoyo, la del carnet en
 * dato.
 *
 * ── SIN BOTÓN DE ACCIÓN, y es del encargo ──────────────────────────────
 * *La acción la pone la pantalla.* Una lista de estado que además agenda es
 * dos piezas peleando: **acá se lee, no se hace.**
 */

import { View } from 'react-native'

import { Texto } from './Texto'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import type { EstadoVacuna } from './vacunas-estado'

export interface FilaPlanVacunal {
  id: string
  nombre: string
  /** **Obligatoria u opcional según el plan de la especie.** Se dice, porque
   *  no es lo mismo deberle una antirrábica que una de kennel. */
  obligatoria: boolean
  estado: EstadoVacuna
  /** La voz del estado, ya compuesta con su número. */
  vozEstado: string
  /** 🔴 *«según el plan, tocaría en marzo»* — **ya marcada como cálculo por la
   *  pantalla**. `undefined` cuando no hay nada que calcular. */
  vozPlan?: string
}

export interface ListaPlanVacunalProps {
  filas: readonly FilaPlanVacunal[]
  /** *«Obligatoria»* / *«Opcional»*, en la voz de la pantalla. */
  vozObligatoria: string
  vozOpcional: string
}

function colorDe(e: EstadoVacuna, theme: ReturnType<typeof useTheme>['theme']): string {
  switch (e.clase) {
    case 'alDia':
      return theme.status.successText
    case 'porVencer':
      return theme.status.warningText
    case 'vencida':
      return theme.status.dangerText
    default:
      /* `sinRegistro` y `sinRefuerzo` en tinta: **no son un problema, son una
         ausencia**, y pintarlas de rojo diría que alguien hizo algo mal. */
      return theme.text.tertiary
  }
}

export function ListaPlanVacunal({ filas, vozObligatoria, vozOpcional }: ListaPlanVacunalProps) {
  const { theme } = useTheme()
  return (
    <View style={{ gap: spacing[3] }}>
      {filas.map((f) => (
        <View key={f.id} style={{ gap: spacing[1] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
            <View style={{ width: 8, height: 8, borderRadius: radius.full, backgroundColor: colorDe(f.estado, theme) }} />
            <Texto variante="cuerpo" numberOfLines={1}>
              {f.nombre}
            </Texto>
            <Texto variante="apoyo">{f.obligatoria ? vozObligatoria : vozOpcional}</Texto>
          </View>
          <View style={{ paddingLeft: spacing[4], gap: spacing[0.5] }}>
            {/* El estado del CARNET: dato. */}
            <Texto variante="dato">{f.vozEstado}</Texto>
            {/* 🔴 El CÁLCULO del plan: apoyo, y sólo si hay algo que calcular.
                *Va en otro registro tipográfico a propósito — si se leyera
                igual que la línea de arriba, sería otra afirmación del
                carnet.* */}
            {f.vozPlan !== undefined ? <Texto variante="apoyo">{f.vozPlan}</Texto> : null}
          </View>
        </View>
      ))}
    </View>
  )
}
