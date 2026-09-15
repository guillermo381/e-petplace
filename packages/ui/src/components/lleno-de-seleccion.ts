/**
 * EL RELLENO DE UNA SELECCIÓN — `accent.controlLleno`, con su respaldo.
 *
 * 🔴 **NACE DE UN ERROR QUE DESTAPÓ UNA CAPTURA, y por eso se escribe una
 * vez en vez de repetirse.** El día y la hora elegidos salieron **MAGENTA**
 * porque las dos piezas pedían `accent.activoLleno` — y la casa tiene la
 * distinción escrita desde el lote 2, en el propio tema:
 *
 *     🔴 «MAGENTA ACCIONA, CIRUELA SELECCIONA» (light.ts:56, letra §1.3)
 *
 * Un día elegido **es una selección**, así que el slot correcto es
 * `accent.controlLleno` —ciruela en claro, con `sobreControlLleno` encima—,
 * que ya existía con ese empleo declarado (`SelectorOpcion:276`). *El slot
 * no faltaba: yo estaba pidiendo el de al lado, y los dos son un relleno
 * con letra clara, así que en pantalla parecía correcto.*
 *
 * ⚠️ **`activoLleno` NO se toca, y es deliberado:** es el disco activo de
 * `BarraTabs`, firmado en el lote 1. *Cambiarlo para arreglar esto habría
 * repintado la barra de las dos apps sin que nadie la mirara.*
 *
 * ⚠️ **El guard no es decorativo:** `controlLleno` vive detrás de
 * `'controlLleno' in theme.accent` en toda la casa —así lo hace
 * `SelectorOpcion`— porque el shape del tema no lo garantiza para temas
 * futuros. El respaldo es el CTA, que siempre existe.
 */

import type { Theme } from '../themes'

export function llenoDeSeleccion(theme: Theme): string {
  const accent = theme.accent as { controlLleno?: string; cta: string }
  return accent.controlLleno ?? accent.cta
}
