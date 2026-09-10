/**
 * EL TILDE — el trazo de «esto está bien», escrito una vez (S115-B).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * POR QUÉ NACE, y es literalmente el caso que `chevron.tsx` documenta: el
 * trazo **ya existía**, dibujado adentro de `Casilla` y sin salida. Al
 * necesitarlo `CampoIdentificacion` para el check de «el número cierra», la
 * opción obvia era copiar el `d` — y ésa habría sido la SEGUNDA copia, que
 * es exactamente lo que **L-175** prohíbe (*se lee el registry y se
 * ENSANCHA; jamás se copia*) y lo que `caja-de-campo.ts` nació para curar
 * después de que la anatomía del campo llegara a tres copias.
 *
 * 🔴 **NO ES UN GLIFO DEL REGISTRY `Icono`, y la distinción no es formal.**
 * La Ley 12 gobierna el lenguaje b′ —objeto del oficio en trazo + huella
 * rellena en el hex de su capa— y exige gate del founder POR ÍCONO. Un tilde
 * **no tiene objeto ni oficio ni capa**: es la misma familia que el chevron,
 * *geometría de control*. Meterlo al registry obligaría a inventarle una
 * huella que no significa nada y a abrir una hoja de contacto para un trazo
 * de tres puntos.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️ **NO SE EXPORTA desde `index.ts`**, mismo criterio que `chevron`: es
 * geometría interna, no API de las apps. Una pantalla que necesite decir
 * «válido» usa la PIEZA que lo porta, jamás el path suelto.
 *
 * ── EL COLOR LO PONE QUIEN LO MONTA, Y NO TIENE DEFAULT ─────────────────
 * En `Casilla` va en PAPEL sobre un fill sólido (Ley 22); en un campo
 * validado va en `status.success` sobre el fondo del campo. *Son dos
 * registros distintos del mismo trazo, y un default haría que uno de los dos
 * consumidores herede el color del otro sin querer.*
 */

import Svg, { Path } from 'react-native-svg'

/** El path, en su caja de 14. Es **el mismo `d` que `Casilla` dibujaba** desde
 *  S104 — no se re-dibujó ni se «mejoró» al mudarlo: mudar y rediseñar en el
 *  mismo acto deja sin saber cuál de los dos cambió lo que se ve.
 *
 *  🔴 **SE LLAMA `PATH_TILDE` Y NO `TRAZO`, y no es estilo — lo cazó `R70`.**
 *  En esta casa `TRAZO` ya significa otra cosa: **el GROSOR del trazo**
 *  (`strokeWidth: TRAZO`), en ocho piezas. Y `R70` **deriva su corpus por
 *  nombre** —toda constante que arranca con `'M…'` es un path para ella—, así
 *  que mi `TRAZO` entró a ese set y la regla empezó a acusar a `Icono` y a
 *  `HuellaDelVinculo` de «poner un path en posición de texto» **en archivos
 *  que esta tanda no tocó**. *Dos vocabularios distintos que se llaman igual
 *  no son el mismo vocabulario*, y acá el costo no lo pagaba yo: lo pagaban
 *  dos piezas ajenas con un rojo falso. */
const PATH_TILDE = 'M2.5 7.5 L5.5 10.5 L11.5 3.5'
const CAJA = 14

export interface TildeProps {
  /** Sin default a propósito — ver la cabecera. */
  color: string
  /** El lado en píxeles. 14 es el de `Casilla`; un campo lo pide más chico. */
  tamano?: number
  /** El grosor. 2 sobre 14 es la proporción original; se escala con el
   *  tamaño para que a 12 px no se vea más gordo que a 14. */
  grosor?: number
}

export function Tilde({ color, tamano = CAJA, grosor }: TildeProps) {
  return (
    <Svg width={tamano} height={tamano} viewBox={`0 0 ${CAJA} ${CAJA}`}>
      <Path
        d={PATH_TILDE}
        stroke={color}
        strokeWidth={grosor ?? 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  )
}
