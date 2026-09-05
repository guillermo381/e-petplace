/**
 * SUGERENCIA DE RAZA — lo que la foto sugiere, y nada más (S113-B · 1.2).
 *
 * Bajo la foto del alta: hasta tres chips *«¿Es un Beagle?»*, más **Mestizo**
 * y **Otra**.
 *
 * 🔴 **NADA SE GUARDA SIN TOQUE.** Ni siquiera la sugerencia más alta se
 * preselecciona. *Un chip elegido de antemano es la app decidiendo la raza de
 * la mascota de otro* — y la raza no es un detalle estético: modula el plan
 * vacunal, las predisposiciones y la etapa de vida.
 *
 * 🔴 **LA CONFIANZA SE DICE EN PALABRAS, JAMÁS EN PORCENTAJE.** *«87 %» suena
 * a medición y no lo es; «muy probable» dice lo mismo sin fingir precisión.*
 * Y quien lee un 87 % no tiene forma de saber si 87 es mucho o poco para este
 * modelo — la palabra sí se entiende sola.
 *
 * ── SI NO VIO UN ANIMAL, LO DICE ───────────────────────────────────────
 * *«No pude ver a tu mascota en la foto»* y el selector de siempre. **No
 * inventa un mestizo por defecto**: un fallback silencioso es una respuesta
 * inventada con cara de resultado.
 */

import { Pressable, View } from 'react-native'

import { Texto } from './Texto'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

/** En palabras, nunca en porcentaje (ver cabecera). */
export type ConfianzaRaza = 'muyProbable' | 'probable' | 'puedeSer'

export interface CandidataRaza {
  id: string
  /** *«¿Es un Beagle?»* — ya compuesta por la pantalla (Ley 3). */
  pregunta: string
  confianza: ConfianzaRaza
  /** *«muy probable»* — la palabra, ya en el idioma de la pantalla. */
  vozConfianza: string
}

export interface SugerenciaRazaProps {
  /** 🔴 **Hasta TRES.** *Con cinco candidatas la persona deja de elegir y
   *  empieza a adivinar* — y una lista larga de sugerencias dice que el modelo
   *  no sabe, disfrazado de que ofrece opciones. */
  candidatas: readonly CandidataRaza[]
  /** `false` ⇒ **la IA no vio un animal** y se dice, con el selector de
   *  siempre debajo (lo monta la pantalla). */
  vioAnimal: boolean
  /** *«No pude ver a tu mascota en la foto»*. */
  vozSinAnimal: string
  vozMestizo: string
  vozOtra: string
  /** El elegido. **`null` mientras nadie toque** — y así arranca siempre. */
  elegida: string | null
  onElegir: (id: 'mestizo' | 'otra' | (string & {})) => void
}

export function SugerenciaRaza({
  candidatas,
  vioAnimal,
  vozSinAnimal,
  vozMestizo,
  vozOtra,
  elegida,
  onElegir,
}: SugerenciaRazaProps) {
  const { theme } = useTheme()

  /* Sin animal: se dice, y la pantalla pone su selector. **No se inventa un
     mestizo por defecto.** */
  if (!vioAnimal) return <Texto variante="apoyo">{vozSinAnimal}</Texto>

  const chip = (id: string, texto: string, voz?: string) => {
    const on = elegida === id
    return (
      <Pressable
        key={id}
        accessibilityRole="button"
        accessibilityState={{ selected: on }}
        accessibilityLabel={voz === undefined ? texto : `${texto} · ${voz}`}
        onPress={() => onElegir(id)}
        style={{
          minHeight: 44,
          justifyContent: 'center',
          paddingHorizontal: spacing[4],
          borderRadius: radius.full,
          backgroundColor: on ? theme.accent.control : theme.bg.card,
          borderWidth: on ? 0 : 1,
          borderColor: theme.bg.border,
        }}
      >
        <Texto variante="apoyo" color={on ? undefined : 'primary'}>
          {texto}
        </Texto>
        {/* La confianza, en palabras y debajo: acompaña, no titula. */}
        {voz !== undefined ? <Texto variante="apoyo">{voz}</Texto> : null}
      </Pressable>
    )
  }

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
      {/* 🔴 `slice(0, 3)`: el tope vive en la PIEZA, no en la confianza de que
          quien la monte mande tres. */}
      {candidatas.slice(0, 3).map((c) => chip(c.id, c.pregunta, c.vozConfianza))}
      {chip('mestizo', vozMestizo)}
      {chip('otra', vozOtra)}
    </View>
  )
}
