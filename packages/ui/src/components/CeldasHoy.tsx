/**
 * LAS CUATRO CELDAS DEL HOY — vacuna · antiparasitario · peso · medicación.
 *
 * Cada una: **rótulo chico, dato grande, y una línea de contexto.** Todas
 * iguales, porque las cuatro contestan la misma pregunta —*¿cómo está hoy?*—
 * y una que se destaque diría que las otras importan menos.
 *
 * 🔴 **UNA CELDA SIN DATO NO INVENTA: DICE QUE NO HAY.** No un cero, no un
 * guion, no la última medición de hace dos años como si fuera de hoy. *Un
 * dato viejo mostrado como actual es peor que ninguno: el que lo lee toma una
 * decisión con él.*
 *
 * ⚠️ **Sin acción adentro.** La celda dice cómo está; **qué hacer lo pone la
 * pantalla**, que es la que sabe si esta familia puede agendar. *Una celda que
 * además agenda es dos piezas peleando por el mismo toque.*
 */

import { Pressable, View } from 'react-native'

import { Texto } from './Texto'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { hayCobertura, type CoberturaPlaga, type Tendencia } from './perfil-seguridad'

/** Una celda cualquiera: la anatomía es una sola. */
/**
 * 🔴 **UNA CELDA SIN `onPress` NO SE DIBUJA COMO BOTÓN.**
 * No es un detalle de estilo: *un chevron sobre algo que no lleva a ningún
 * lado enseña a desconfiar de todos los chevrones de la app.* Con destino, la
 * celda es un `Pressable` con su rol y su chevron; sin destino es una `View`
 * plana — **la misma pieza y dos naturalezas, decididas por el dato y no por
 * una prop de apariencia.**
 *
 * ⚠️ **La pantalla decide a dónde**, no la celda: cada una tiene su propio
 * destino y sólo la pantalla los conoce.
 */
function Celda({
  rotulo,
  dato,
  contexto,
  children,
  onPress,
}: {
  rotulo: string
  dato?: string
  contexto?: string
  children?: React.ReactNode
  onPress?: () => void
}) {
  const { theme } = useTheme()
  const estilo = {
    flex: 1,
    minWidth: '45%' as const,
    gap: spacing[1],
    padding: spacing[3],
    borderRadius: radius.md,
    backgroundColor: theme.bg.card,
  }
  const cuerpo = (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[1] }}>
        <Texto variante="apoyo">{rotulo}</Texto>
        {/* El chevron SÓLO con destino: es la afordance, no un adorno. */}
        {onPress !== undefined ? <Texto variante="apoyo">›</Texto> : null}
      </View>
      {dato !== undefined ? <Texto variante="seccion">{dato}</Texto> : null}
      {children}
      {contexto !== undefined ? <Texto variante="apoyo">{contexto}</Texto> : null}
    </>
  )
  if (onPress === undefined) return <View style={estilo}>{cuerpo}</View>
  return (
    <Pressable
      accessibilityRole="button"
      /* El rótulo y el dato juntos: quien no ve la celda necesita las dos
         cosas para saber a dónde va. */
      accessibilityLabel={dato === undefined ? rotulo : `${rotulo} · ${dato}`}
      onPress={onPress}
      style={estilo}
    >
      {cuerpo}
    </Pressable>
  )
}

export interface CeldasHoyProps {
  vacuna: {
    rotulo: string
    /** `null` ⇒ **la celda dice que no hay**, con `vozSinDato`. */
    nombre: string | null
    /** *«vence en 12 días»* — ya compuesta. */
    contexto?: string
    /** 🔴 **El destino lo decide la PANTALLA.** Sin él la celda se dibuja
     *  plana: *un chevron sobre algo que no lleva a ningún lado enseña a
     *  desconfiar de todos los chevrones de la app.* */
    onPress?: () => void
  }
  antiparasitario: {
    rotulo: string
    cobertura: readonly CoberturaPlaga[]
    /** El nombre de cada plaga, en la voz de la pantalla. */
    vozPlaga: (p: CoberturaPlaga['plaga']) => string
    /** 🔴 **El destino lo decide la PANTALLA.** Sin él la celda se dibuja
     *  plana: *un chevron sobre algo que no lleva a ningún lado enseña a
     *  desconfiar de todos los chevrones de la app.* */
    onPress?: () => void
  }
  peso: {
    rotulo: string
    /** `null` ⇒ sin registro. */
    valorTexto: string | null
    tendencia: Tendencia
    /** *«hace 2 meses pesaba 11,8 kg»* — sin adjetivos. */
    contexto?: string
    /** 🔴 **El destino lo decide la PANTALLA.** Sin él la celda se dibuja
     *  plana: *un chevron sobre algo que no lleva a ningún lado enseña a
     *  desconfiar de todos los chevrones de la app.* */
    onPress?: () => void
  }
  medicacion: {
    rotulo: string
    /** `null` ⇒ ninguna activa. */
    nombre: string | null
    /** *«hasta el 20 de septiembre»*. */
    contexto?: string
    /** 🔴 **El destino lo decide la PANTALLA.** Sin él la celda se dibuja
     *  plana: *un chevron sobre algo que no lleva a ningún lado enseña a
     *  desconfiar de todos los chevrones de la app.* */
    onPress?: () => void
  }
  /** *«sin registro»* — una sola voz para las cuatro. */
  vozSinDato: string
}

/** 🔴 **Las flechas son SIGNOS, no adjetivos.** *«Subió» y «bajó» juzgan; ↑ y
 *  ↓ describen.* Un perro que sube de peso puede estar recuperándose o
 *  engordando de más, y esta celda no sabe cuál — así que no opina. */
const FLECHA: Record<Exclude<Tendencia, null>, string> = { sube: '↑', baja: '↓', igual: '=' }

export function CeldasHoy({ vacuna, antiparasitario, peso, medicacion, vozSinDato }: CeldasHoyProps) {
  const { theme } = useTheme()
  const conCobertura = hayCobertura(antiparasitario.cobertura)

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
      <Celda
        rotulo={vacuna.rotulo}
        dato={vacuna.nombre ?? vozSinDato}
        contexto={vacuna.nombre === null ? undefined : vacuna.contexto}
        onPress={vacuna.onPress}
      />

      <Celda rotulo={antiparasitario.rotulo} dato={conCobertura ? undefined : vozSinDato} onPress={antiparasitario.onPress}>
        {conCobertura ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[1] }}>
            {antiparasitario.cobertura.map((c) =>
              /* 🔴 Una plaga SIN registro no dibuja chip: *un chip gris dice
                 «no cubierta», y lo que pasa es que no sabemos.* */
              c.alDia === null ? null : (
                <View
                  key={c.plaga}
                  style={{
                    paddingHorizontal: spacing[2],
                    paddingVertical: spacing[0.5],
                    borderRadius: radius.full,
                    backgroundColor: theme.bg.hundido,
                  }}
                >
                  <Texto variante="apoyo" color={c.alDia ? 'success' : 'danger'}>
                    {antiparasitario.vozPlaga(c.plaga)}
                  </Texto>
                </View>
              ),
            )}
          </View>
        ) : null}
      </Celda>

      <Celda
        rotulo={peso.rotulo}
        dato={
          peso.valorTexto === null
            ? vozSinDato
            : `${peso.valorTexto}${peso.tendencia !== null ? ` ${FLECHA[peso.tendencia]}` : ''}`
        }
        contexto={peso.valorTexto === null ? undefined : peso.contexto}
        onPress={peso.onPress}
      />

      <Celda
        rotulo={medicacion.rotulo}
        dato={medicacion.nombre ?? vozSinDato}
        contexto={medicacion.nombre === null ? undefined : medicacion.contexto}
        onPress={medicacion.onPress}
      />
    </View>
  )
}
