/**
 * TemporizadorLlamada — el tiempo de la videoconsulta (S106-B, OBRA 3).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * **SUBE. JAMÁS BAJA.** Y la razón no es de diseño: es de LETRA.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * `LETRA_TELEMEDICINA` §4, firma ① del founder:
 *
 * > *«La consulta **se cobra aunque dure veinte segundos** y aunque el dueño no
 * > asista… **Y hay una razón P11, no solo comercial:** si la consulta corta no
 * > se cobrara, el veterinario tendría un incentivo económico para estirarla —
 * > y ahí el beneficio empezó a distorsionar la decisión clínica.»*
 *
 * **Una cuenta regresiva contradice esa letra EN LA PANTALLA.** Le diría al
 * veterinario que hay un tiempo que gastar —y al dueño que hay un tiempo que
 * aprovechar—, que es exactamente el incentivo que §4 pagó por eliminar.
 * *El motor puede cobrar bien y la pantalla puede desmentirlo igual.*
 *
 * ── LO QUE NO LLEVA, y cada ausencia es una decisión ───────────────────────
 * · **NO es rojo.** El rojo es alarma y acá **no pasó nada**: una consulta que
 *   dura es una consulta, no un problema. *Un color de alarma que se enciende
 *   cuando todo está bien enseña a ignorar el rojo* (precedente S96).
 * · **NO lleva punto de «grabando».** **No se graba** — lo dice §3 al dueño
 *   («la videollamada no se graba»). Un punto rojo ahí sería una mentira con
 *   forma de convención.
 * · **NO tiene meta, ni barra, ni «restante».** No hay contra qué medirse.
 *
 * ── TIPOGRAFÍA: `dato`, y el tabular es funcional ──────────────────────────
 * `Texto variante="dato"` = JetBrains Mono con `fontVariant: tabular-nums`
 * (Ley 3: la voz de máquina). **El tabular no es estética: sin él, cada dígito
 * tiene ancho propio y el reloj BAILA una vez por segundo** — un movimiento
 * que nadie pidió, en una pantalla donde lo único que debe moverse es el video.
 *
 * ── CORRE POR DIFERENCIA CONTRA EL INICIO, jamás por acumulación ───────────
 * Recibe `inicioTs` y calcula `ahora − inicio`. **Es el patrón que `Cronometro`
 * ya usa en la casa**, y su razón vale doble acá: un contador que suma 1 por
 * tick se desfasa cuando el hilo se traba, y en una videollamada el hilo se
 * traba. *El reloj no puede mentir sobre cuánto duró algo que se cobra.*
 */

import { useEffect, useState } from 'react'

import { Texto } from './Texto'

export interface TemporizadorLlamadaProps {
  /** Epoch ms del inicio real (del servidor si se tiene). `null` = aún no arrancó. */
  inicioTs: number | null
  /** Sobre video, el color lo pone el contenedor (papel). Fuera, el del tema. */
  color?: 'sobreVideo' | 'tema'
}

function mmss(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const seg = s % 60
  const dd = (n: number) => String(n).padStart(2, '0')
  // La hora solo aparece si existe: `00:` fijo delante sería ruido durante
  // los primeros 59 minutos de TODAS las consultas.
  return h > 0 ? `${h}:${dd(m)}:${dd(seg)}` : `${dd(m)}:${dd(seg)}`
}

export function TemporizadorLlamada({ inicioTs, color = 'sobreVideo' }: TemporizadorLlamadaProps) {
  const [ahora, setAhora] = useState(() => Date.now())

  useEffect(() => {
    if (inicioTs == null) return
    // 1 s es suficiente: la unidad más chica que se muestra es el segundo.
    const id = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(id)
  }, [inicioTs])

  if (inicioTs == null) return null

  return (
    <Texto variante="dato" color={color === 'tema' ? 'secondary' : 'sobreVideo'}>
      {mmss(ahora - inicioTs)}
    </Texto>
  )
}
