/**
 * NEXO SE PRESENTA — las tres burbujas de la primera vez (S113-B · 2.1 · B4).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **SON TRES, Y ES UNA TUPLA: la pieza no puede inventar la cuarta.**
 * ═══════════════════════════════════════════════════════════════════════════
 * Quién es · qué puede hacer con ESTA mascota · la promesa honesta. *Tres
 * frases se leen; cinco se saltean, y la que se saltea es siempre la última —
 * que acá es justamente la que dice que puede equivocarse.* El compilador no
 * deja pasar una cuarta.
 *
 * ── LAS PIEZAS SON LAS DEL CHAT, SIN UNA VARIANTE NUEVA ─────────────────
 * `BurbujaMensaje` con `mio: false`, agrupadas: **el nombre sólo en la
 * primera y la hora sólo en la última**, que es lo que esa pieza ya hace con
 * `posicion`. *Una «burbuja de presentación» propia habría sido el mismo
 * dibujo con otro nombre, y el día que el chat cambie de radio quedarían dos
 * conversaciones distintas en la misma app.*
 *
 * ── 🔴 LLEGAN LAS TRES JUNTAS, NO ESCALONADAS ───────────────────────────
 * Sin temporizador y sin «está escribiendo» (N13): *simular que las escribe
 * es actuar una conversación que no está pasando, y la primera cosa que Nexo
 * hace no puede ser una actuación.* El latido del orbe lo cuenta
 * `CabeceraCoach` con frases reales.
 *
 * ── LA TERCERA ES OBLIGATORIA, Y ES LA QUE PROTEGE ──────────────────────
 * La promesa honesta —*«puedo equivocarme; para lo importante está tu vet»*—
 * no es opcional ni configurable: **está en la tupla**. Una presentación que
 * puede omitirla es una presentación que alguien va a omitir el día que
 * moleste.
 *
 * ── ⛔ MEMORIAL: NO SE DIBUJA ───────────────────────────────────────────
 * `MODELO_LOYALTY` §7.1, igual que el resto de la familia del Coach.
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * El primer abrir de la Hoja de Nexo (C). **Entregada y no montada** —
 * medido: `git grep PresentacionNexo -- apps/` da cero.
 */

import { View } from 'react-native'

import { BurbujaMensaje } from './BurbujaMensaje'
import { useTheme } from '../ThemeProvider'

/**
 * 🔴 **EXACTAMENTE TRES.** Tupla y no arreglo: *la pieza no inventa la cuarta,
 * y el compilador no la deja inventarla.* En orden: quién es · qué puede hacer
 * con esta mascota · la promesa honesta.
 */
export type TresBurbujas = readonly [string, string, string]

export interface PresentacionNexoProps {
  /** Las tres, ya redactadas con el nombre de la mascota adentro (Ley 3). */
  burbujas: TresBurbujas
  /** El nombre que firma la primera. **Se dibuja, no se concatena.** */
  autor: string
  /** «14:32» — ya redactada por el riel. Se dibuja bajo la última. */
  hora: string
}

export function PresentacionNexo({ burbujas, autor, hora }: PresentacionNexoProps) {
  const { theme } = useTheme()

  /* ⛔ El Coach no existe en memorial. */
  if (theme.mode === 'memorial') return null

  /* 🔴 **EL CONTENEDOR NO AGREGA AIRE, Y ES EL «MISMO RITMO» DEL ENCARGO.**
     `BurbujaMensaje` trae su propia separación —`spacing[3]` al abrir grupo,
     `spacing[0.5]` adentro— y **un `gap` acá se SUMA a eso**: las tres
     quedaban con más aire que el hilo de adopción, o sea con otro ritmo.
     *Cuando la pieza ya porta su espaciado, el contenedor que agrega el suyo
     no lo ajusta: lo rompe, y en la misma app conviven dos conversaciones con
     dos aires.* */
  return (
    <View>
      {burbujas.map((texto, i) => (
        <BurbujaMensaje
          key={i}
          mio={false}
          texto={texto}
          /* El agrupado lo resuelve la pieza del chat: el nombre sólo en la
             primera, la hora sólo en la última, y los radios que cierran el
             grupo como un bloque. Acá sólo se dice DÓNDE cae cada una. */
          posicion={i === 0 ? 'primero' : i === burbujas.length - 1 ? 'ultimo' : 'medio'}
          autor={autor}
          hora={hora}
        />
      ))}
    </View>
  )
}
