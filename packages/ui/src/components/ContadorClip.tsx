/**
 * ContadorClip — CUÁNTO LLEVA GRABADO, junto al obturador (S107-B).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * **Sube de `0:00` a `0:30` y ahí corta solo. Sin drama.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── 🔴 JAMÁS ROJO, Y LA RAZÓN YA ESTÁ FIRMADA ────────────────────────────
 * `DIRECCION_ARTE_VIDEOCONSULTA` §1.5 lo dejó escrito para el temporizador de
 * la consulta y **vale igual acá**: *«color neutro — jamás rojo: el rojo es
 * alarma y acá no pasó nada malo»*. Grabar un clip de un animal jugando no es
 * una emergencia. *Un color de alarma que se enciende cuando todo está bien
 * enseña a ignorar el rojo* — el mismo precedente que ya cobró `Insignia` en
 * S96 y que `TemporizadorLlamada` cita en su cuerpo.
 *
 * **Y por la misma razón no lleva punto parpadeante de «grabando»**: es la
 * convención heredada del video, y su trabajo lo hace el contador, que ya
 * está corriendo a la vista. *Nada pulsa, nada late* (Ley 6).
 *
 * ── EL TECHO CORTA, Y CORTA UNA SOLA VEZ ─────────────────────────────────
 * Al llegar a `techoSeg` la pieza llama a `onTecho()` **exactamente una vez**
 * y se queda quieta en el tope. El guard no es paranoia: este componente se
 * re-renderiza una vez por segundo, y sin él **el corte se dispararía en cada
 * tick posterior** — la clase de defecto que no rompe nada visible y manda N
 * clips en vez de uno.
 *
 * 🔴 **La pieza NO detiene la cámara: avisa.** Quien graba es la pantalla, y
 * es la que corta. *Un componente de presentación que apagara el hardware
 * sería un motor escondido adentro de un reloj* — el «motor sin puerta» al
 * revés (L-318).
 *
 * ── CORRE POR DIFERENCIA, JAMÁS POR ACUMULACIÓN ──────────────────────────
 * Recibe `inicioTs` y calcula `ahora − inicio`, que es el patrón que
 * `Cronometro` y `TemporizadorLlamada` ya usan en la casa. **Un contador que
 * suma 1 por tick se desfasa cuando el hilo se traba** — y el hilo se traba
 * justo cuando la cámara está codificando video. *Un clip que dice 0:30 y
 * dura 0:41 rompe el techo del motor sin que nadie vea el error.*
 *
 * ── LEY 3 · TIPOGRAFÍA ───────────────────────────────────────────────────
 * `Texto variante="dato"` = JetBrains Mono con `tabular-nums`. **El tabular no
 * es estética: sin él cada dígito tiene ancho propio y el contador BAILA una
 * vez por segundo**, al lado del obturador, que es donde el pulso del dedo
 * tiene que estar.
 *
 * ── LEY 11: POR QUÉ NACE Y NO SE REUSA `TemporizadorLlamada` ─────────────
 * Relevado antes de crear (protocolo 1c, pregunta 2). Es su hermano y **le
 * toma todo lo que se puede tomar** (la diferencia contra el inicio, el
 * tabular, el no-rojo, el no-punto). Lo que no puede dar es **el techo**: el
 * de la llamada sube sin límite **por letra** (§4: la consulta se cobra por lo
 * que dura, y una cuenta regresiva la contradice), y acá el límite es del
 * motor — el clip tiene tope duro. *Meterle un techo opcional al de la llamada
 * habría puesto en la misma pieza dos reglas de negocio opuestas.*
 *
 * ── ESCALERA (§4b) · DOSIS · TEMAS ───────────────────────────────────────
 * No muestra datos del expediente. Tokens puros; sirve a las dos apps y a los
 * tres temas sin variante. Memorial: igual — un contador no celebra nada.
 */

import { useEffect, useRef, useState } from 'react'

import { Texto } from './Texto'

export type ContadorClipProps = {
  /** `Date.now()` del momento en que empezó a grabar. */
  inicioTs: number
  /** El tope, en segundos. El motor lo fija; la pieza no lo inventa. */
  techoSeg: number
  /**
   * Se llama UNA vez, al tocar el techo. La pantalla corta la grabación —
   * ver el encabezado: esta pieza avisa, no apaga.
   */
  onTecho: () => void
}

/** `m:ss` — la forma corta, que es la que cabe al lado de un obturador. */
function reloj(totalSeg: number): string {
  const m = Math.floor(totalSeg / 60)
  const s = totalSeg % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function ContadorClip({ inicioTs, techoSeg, onTecho }: ContadorClipProps) {
  const [ahora, setAhora] = useState(() => Date.now())

  /* EL GUARD DEL DISPARO ÚNICO. En un ref y no en estado: cambiar estado acá
     dispararía otro render, y lo único que hace falta es recordar. */
  const yaCorto = useRef(false)

  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  /* Se re-arma si cambia el inicio: una segunda grabación con la misma pieza
     montada tiene que poder cortar también. Sin esto, el guard del primer clip
     dejaría al segundo sin techo. */
  useEffect(() => {
    yaCorto.current = false
  }, [inicioTs])

  const transcurrido = Math.max(0, Math.floor((ahora - inicioTs) / 1000))
  const mostrado = Math.min(transcurrido, techoSeg)

  useEffect(() => {
    if (transcurrido >= techoSeg && !yaCorto.current) {
      yaCorto.current = true
      onTecho()
    }
  }, [transcurrido, techoSeg, onTecho])

  return (
    /* `accessibilityLiveRegion` NO: un lector que anuncia el contador cada
       segundo tapa todo lo demás. El valor está en el label, que se lee cuando
       alguien lo pide. */
    <Texto variante="dato">{reloj(mostrado)}</Texto>
  )
}
