/**
 * MEDICACIÓN ACTIVA — qué está tomando, cuánto y hasta cuándo (S113-B · 1.1).
 *
 * ⚠️ **«Activa» lo decide la PANTALLA, no esta pieza.** Ella recibe una lista
 * y la dibuja. *Filtrar por fecha acá obligaría a la pieza a saber qué día es
 * hoy, y una lista que se filtra sola es una lista en la que no se puede
 * confiar para mostrar el histórico.*
 *
 * **La fuente se dice**, igual que en la franja: no es lo mismo que lo cargue
 * la familia a que salga de una receta.
 */

import { View } from 'react-native'

import { Texto } from './Texto'
import { spacing } from '../tokens/spacing'
import type { ProcedenciaSeguridad } from './perfil-seguridad'

export interface FilaMedicacion {
  id: string
  nombre: string
  /** *«10 mg cada 12 h»* — ya compuesta. `null` = **la receta no la decía**,
   *  y eso se calla en vez de inventarse. */
  dosis?: string | null
  /** *«hasta el 20 de septiembre»*. `null` = sin fecha de fin. */
  hasta?: string | null
  procedencia: ProcedenciaSeguridad
  /** *«lo recetó Clínica Aurora»* — ya compuesta (Ley 3). */
  vozProcedencia: string
}

export interface PiezaMedicacionActivaProps {
  filas: readonly FilaMedicacion[]
}

export function PiezaMedicacionActiva({ filas }: PiezaMedicacionActivaProps) {
  /* Sin nada, no hay pieza — la pantalla decide si dice algo en su lugar. */
  if (filas.length === 0) return null
  return (
    <View style={{ gap: spacing[3] }}>
      {filas.map((f) => (
        <View key={f.id} style={{ gap: spacing[0.5] }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing[2] }}>
            <Texto variante="cuerpo">{f.nombre}</Texto>
            {/* Lo que la receta no decía, no se dibuja. */}
            {f.dosis != null ? <Texto variante="dato">{f.dosis}</Texto> : null}
          </View>
          {f.hasta != null ? <Texto variante="apoyo">{f.hasta}</Texto> : null}
          <Texto variante="apoyo">{f.vozProcedencia}</Texto>
        </View>
      ))}
    </View>
  )
}
