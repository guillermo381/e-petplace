/**
 * EL ESTADO DE LA PRESENCIA — prestador (S113-C · lote 0.3).
 *
 * Sin imports de runtime: el arnés llama a ESTA función, no a una copia.
 *
 * ⚠️ **Son TRES estados y no cuatro.** `'hablando'` es del Coach —la Hoja— y
 * el prestador no tiene Coach, así que **no se puede producir acá**. *Dejarlo
 * en la lista «por simetría» sería un estado que ninguna pantalla alcanza, y
 * el próximo que lo lea va a buscar dónde se enciende.*
 */
import type { PendientesCoach } from '@epetplace/ui'

/** Hay algo de alguna clase. Espejo del criterio de la pieza: `null` y `0` se
 *  van juntos, y por eso no se colapsan en la puerta. */
export function hayAlgoPresencia(p: PendientesCoach): boolean {
  return p.chat > 0 || p.pedidos > 0 || (p.solicitudes ?? 0) > 0 || (p.avisos !== null && p.avisos > 0)
}

export function estadoPresencia(args: {
  pendientes: PendientesCoach
  abierta: boolean
}): 'dormida' | 'atenta' | 'despierta' {
  if (args.abierta) return 'despierta'
  return hayAlgoPresencia(args.pendientes) ? 'atenta' : 'dormida'
}
