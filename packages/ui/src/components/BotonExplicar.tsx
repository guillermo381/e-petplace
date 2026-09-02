/**
 * BotonExplicar — LA «i» EN CÍRCULO, EL ESTÁNDAR DE LA CASA PARA EXPLICAR
 * (N22; promovida en S112-B).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * **LO QUE SE NECESITA PARA DECIDIR QUEDA A LA VISTA.
 *   LO QUE SE NECESITA PARA ENTENDER VA DETRÁS DE UNA «i».**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── POR QUÉ NACE AHORA Y NO ANTES ────────────────────────────────────────
 * Vivió una tanda como pieza INTERNA de `FichaAdoptable`, declarada ahí como
 * candidata con su razón: *promover un estándar de la casa es decisión de
 * mesa, no de la pieza que lo necesitó tercera.* **Lo que cambió es que ya no
 * es una: `VitrinaRefugio` la necesita para «Cómo ayudar», y son dos piezas
 * de `packages/ui` con la misma forma.** Dos implementaciones de la misma
 * forma dentro del mismo paquete es exactamente `D-645`, y la vieja no la
 * señala nada.
 *
 * *La promoción no la decide que sea linda: la decide el segundo consumidor.*
 *
 * ── LO QUE NO HACE, Y ES LA LEY ──────────────────────────────────────────
 * **No abre nada por su cuenta**: llama a `onExplicar` y la pantalla decide
 * qué mostrar (la Hoja, el texto, el destino). La «i» es el gesto; la
 * explicación es del que la tiene.
 *
 * 🔴 **Y SU LÍMITE, que viene de una ley firmada y no se reabre:** *una
 * advertencia de salud JAMÁS se pliega* (`MODELO_DESPENSA` §6/§10 — plegar
 * una advertencia la convierte en nota al pie). **La «i» es para explicar,
 * nunca para esconder un riesgo.** Si lo que va detrás cambia una decisión de
 * salud, no va detrás: va a la vista.
 *
 * ── GEOMETRÍA ────────────────────────────────────────────────────────────
 * El glifo mide 20 y el target llega a 44 por `hitSlop`, **sin que el ícono
 * crezca ni empuje la línea que lo contiene** (N24). `registro="aa"` porque
 * es andamiaje funcional —informa, no es un objeto del expediente— y la tinta
 * baja al secundario para que explique sin competir con el dato.
 */
import { Pressable } from 'react-native'
import { useTheme } from '../ThemeProvider'
import { Icono } from './Icono'

/**
 * Un dato que se explica: su texto a la vista, el porqué detrás de la «i».
 *
 * Se exporta porque **varias piezas lo reciben como una sola cosa** —el bono,
 * el publicador, «Apadrinar», «Cómo ayudar»— y partirlo en tres props sueltas
 * en cada una invita a que alguien pase el texto sin el camino.
 */
export type ConExplicacion = {
  /** Lo que se lee sin tocar nada. */
  texto: string
  /** Abre la explicación. La escribe y la muestra la pantalla. */
  onExplicar: () => void
  /** accessibilityLabel del botón «i». OBLIGATORIA: una «i» sin nombre es
   *  un control mudo para quien no ve la pantalla. */
  etiquetaExplicacion: string
}

export function BotonExplicar({ onExplicar, etiquetaExplicacion }: ConExplicacion) {
  const { theme } = useTheme()
  return (
    <Pressable
      onPress={onExplicar}
      accessibilityRole="button"
      accessibilityLabel={etiquetaExplicacion}
      hitSlop={12}
    >
      <Icono nombre="info" tamano={20} registro="aa" tinta={theme.text.secondary} />
    </Pressable>
  )
}
