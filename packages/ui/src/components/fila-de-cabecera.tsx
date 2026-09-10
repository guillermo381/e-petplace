/**
 * FilaDeCabecera — LA FILA DE UNA CABECERA DE HILO (S114-B, extraída).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * **No nace: SALE de `CabeceraHilo`.** La cabecera del caso (`CabeceraCaso`,
 * §3.2 de `DIRECCION_POSTVENTA`) tiene **la misma anatomía de fila** que la
 * de adopción —cara + nombre + chevron-si-lleva— y **su segunda fila es
 * idéntica**: la contraparte con su cara y su nombre.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── POR QUÉ SE EXTRAE EN VEZ DE COPIARSE (Ley 19.9) ──────────────────────
 * *«Lo que se copia, diverge.»* Los CUATRO logs del cliente probaron la
 * clase: nacieron por copia y los cuatro contestaban distinto. Dos cabeceras
 * de hilo con la misma fila escrita dos veces son ese defecto un día antes
 * de que se note — y el día que alguien arregle el chevron de una, la otra
 * se queda como está y nadie se entera.
 *
 * ⚠️ **`CabeceraHilo` NO cambia de API por esto.** La extracción es interna:
 * sus dos consumidores vivos (el hilo de adopción en las dos apps) no tocan
 * una línea. *Una promoción que obliga a migrar consumidores no es una
 * extracción: es una migración con otro nombre.*
 *
 * ── LO QUE AGREGA, y es lo único ─────────────────────────────────────────
 * `detalle`: la segunda línea, en **voz de máquina** (Ley 3). La cabecera de
 * adopción no la usa —su fila es el animal y su nombre—; la del caso sí: el
 * objeto es *«Paseo de Thor»* **y** *«martes 9, 16:00»*, y una fecha es dato
 * de máquina. **No se compone una sola cadena** con las dos: eso obligaría a
 * la pantalla a decidir el separador y perdería el registro tipográfico que
 * la Ley 3 exige.
 *
 * ── LO QUE NO HACE ───────────────────────────────────────────────────────
 * No trae superficie ni padding: la cabecera que la monta pone su carta.
 * Sin `onPress` no hay chevron ni presión — *una fila que se hunde sin
 * llevar a ningún lado es una promesa rota* (Ley 18: la estructura informa).
 */
import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { spacing } from '../tokens/spacing'
import { Chevron } from './chevron'
import { Texto } from './Texto'

export type FilaDeCabeceraProps = {
  /** El avatar, el logo o el monograma. Lo monta quien sabe qué es. */
  cara: ReactNode
  nombre: string
  /**
   * La segunda línea, ya redactada por el riel («martes 9, 16:00»). Voz de
   * máquina (Ley 3). Ausente = la fila es de una sola línea.
   */
  detalle?: string
  /** Ausente = la fila no se hunde ni dibuja chevron. */
  onPress?: () => void
  /** `preside` = el sujeto de la conversación · `apoyo` = con quién hablo. */
  jerarquia: 'preside' | 'apoyo'
}

export function FilaDeCabecera({ cara, nombre, detalle, onPress, jerarquia }: FilaDeCabeceraProps) {
  const contenido = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
      {cara}
      <View style={{ flex: 1 }}>
        <Texto variante={jerarquia === 'preside' ? 'enfasis' : 'apoyo'} numberOfLines={1}>
          {nombre}
        </Texto>
        {detalle === undefined ? null : (
          <Texto variante="dato" numberOfLines={1}>
            {detalle}
          </Texto>
        )}
      </View>
      {onPress === undefined ? null : <Chevron direccion="derecha" />}
    </View>
  )
  if (onPress === undefined) return contenido
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={nombre}>
      {contenido}
    </Pressable>
  )
}
