/**
 * ⭐ S86-C · LA DONA DEL MIX — la lámina firmada la pide DONA, y la
 * primera pasada la resolvió como barra proporcional. **El founder lo
 * gateó y la barra no era el dibujo firmado**: se corrige acá.
 *
 * ⚠️ POR QUÉ NO HACÍA FALTA UNA LIBRERÍA, que era la razón de la barra:
 * `react-native-svg` YA vive en esta app (el chevron de HOY lo usa). Una
 * dona es UN círculo con `strokeDasharray` — cero dependencia nueva, y
 * el arco se calcula con la misma regla de tres que la barra.
 *
 * ═══ N=1: LA DONA SE DIBUJA IGUAL — FIRMA DEL FOUNDER ════════════════
 * **Con un solo servicio la dona se dibuja, con el color de ese
 * servicio.** Su letra: *la dona muestra DE QUÉ está hecho el 100%; si
 * es uno solo, es uno solo — y eso también es el dato.*
 *
 * ⏪ Yo había propuesto lo contrario —no dibujar y decirlo en voz—
 * razonando que «un gráfico existe para mostrar una PROPORCIÓN y con un
 * término no hay proporción». **La firma lo corrige y el porqué se
 * conserva para que no vuelva** (L-198): el gráfico no responde *«¿en
 * qué proporción?»* sino *«¿de qué está hecho?»*, y esa pregunta tiene
 * respuesta con un solo término. *Cambiar la pregunta cambia el
 * veredicto — y la pregunta la fija quien firma.*
 *
 * Presentacional pura: recibe los tramos ya resueltos (color incluido)
 * y no sabe de servicios ni de meses. Estática (Ley 6).
 */

import Svg, { Circle } from 'react-native-svg'

export interface TramoDona {
  clave: string
  color: string
  valor: number
}

const TAMANO = 88
const GROSOR = 12

export function DonaMix({
  tramos,
  total,
  etiqueta,
}: {
  tramos: TramoDona[]
  /** El denominador viaja del motor — el % lo hace UNA superficie. */
  total: number
  etiqueta: string
}) {
  /* Lo único que impide dibujar es que NO HAYA NADA: sin total no hay
     100% del que hablar. Un solo tramo SÍ se dibuja (firma del founder,
     ver cabecera) — el anillo completo de su color. */
  if (total <= 0 || tramos.length === 0) return null

  const r = (TAMANO - GROSOR) / 2
  const circ = 2 * Math.PI * r
  let acumulado = 0

  return (
    <Svg width={TAMANO} height={TAMANO} accessibilityLabel={etiqueta}>
      {tramos.map((t) => {
        const fraccion = t.valor / total
        /* El arco se dibuja con dash = su porción y gap = el resto; el
           desfase acumulado lo corre al lugar que le toca. `-90°` para
           arrancar arriba, que es donde el ojo empieza a leer. */
        const dash = fraccion * circ
        const offset = -acumulado * circ
        acumulado += fraccion
        return (
          <Circle
            key={t.clave}
            cx={TAMANO / 2}
            cy={TAMANO / 2}
            r={r}
            stroke={t.color}
            strokeWidth={GROSOR}
            fill="none"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={offset}
            /* El giro va en la PIEZA y no en el consumidor: si cada
               pantalla lo rotara por su cuenta, dos donas de la casa
               arrancarían en puntos distintos. */
            originX={TAMANO / 2}
            originY={TAMANO / 2}
            rotation={-90}
          />
        )
      })}
    </Svg>
  )
}
