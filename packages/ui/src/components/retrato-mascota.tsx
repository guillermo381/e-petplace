/**
 * EL RETRATO CIRCULAR — la foto de una mascota, redonda, con su aro.
 *
 * ── POR QUÉ ES UNA PIEZA INTERNA Y NO UN `AvatarMascota` MÁS ───────────
 * `AvatarMascota` es **squircle 32 %** (S61-A10) y lo es a propósito: es el
 * avatar SUELTO de la casa, el que aparece en filas, chips y tarjetas. Las
 * dos superficies que este módulo sirve —el retrato del expediente y la
 * fila de mascotas del Hogar— son **circulares con aro**, y las dos lo
 * dicen de sí mismas: el expediente tiene el choque declarado en su propio
 * archivo (*«el squircle NO aplica — el retrato de la ficha es circular»*) y
 * la fila lo pedía la mesa.
 *
 * 🔴 **Que las dos lo compongan a mano es el defecto que esto cierra.** Al
 * medir el objeto, el retrato del expediente y el avatar de la fila eran
 * **dos bloques de `<View>` + `<Image>` + `<Svg><Huella/>` distintos**, con
 * dos fondos de respaldo distintos y dos escalas de huella distintas, para
 * dibujar el mismo hecho: *una mascota que todavía no tiene foto.* Nada
 * fallaba; simplemente se veían diferente sin que nadie lo hubiera decidido.
 *
 * ⚠️ **No se exporta desde el índice**, igual que `disco-contador` o
 * `chevron`: es la geometría compartida de dos piezas, no una pieza. Quien
 * necesite un retrato monta `IdentidadMascota` o `FilaMascotas`; quien
 * necesite un avatar suelto sigue montando `AvatarMascota`.
 */

import { Image } from 'expo-image'
import { View } from 'react-native'
import Svg from 'react-native-svg'

import { radius } from '../tokens/radius'
import { Huella } from '../brand/Huella'

export interface RetratoCircularProps {
  /** El diámetro de la FOTO. El aro se dibuja por fuera: el alto total es
   *  `diametro + 2 * grosorAro`. *Así el número que se pide es el que se
   *  ve, y el aro no le come el retrato.* */
  diametro: number
  grosorAro: number
  /** El color del aro. Lo decide quien monta porque **depende del estado**
   *  (elegida / no elegida), y un estado no se adivina desde acá. */
  aro: string
  /** El fondo detrás de la huella cuando no hay foto. */
  fondo: string
  /** La tinta de la huella. 🔴 Se pide y no se resuelve del tema **porque
   *  las dos superficies viven sobre la banda oscura**, donde la huella va
   *  en la tinta de la banda y no en la del lienzo — el expediente ya pagó
   *  ese defecto una vez: pintaba `capa.identidad`, que en memorial es
   *  tinta, y sobre la banda ciruela **desaparecía**. */
  tinta: string
  fotoUrl?: string
}

export function RetratoCircular({ diametro, grosorAro, aro, fondo, tinta, fotoUrl }: RetratoCircularProps) {
  const lado = diametro + grosorAro * 2
  return (
    <View
      style={{
        width: lado,
        height: lado,
        borderRadius: radius.full,
        borderWidth: grosorAro,
        borderColor: aro,
        backgroundColor: fondo,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {fotoUrl !== undefined && fotoUrl !== '' ? (
        <Image
          source={{ uri: fotoUrl }}
          style={{ width: diametro, height: diametro }}
          contentFit="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        /* La huella ocupa ~42 % del retrato en las dos escalas — el
           expediente usaba 84 sobre 200 (42 %) y la fila 52 sobre 112
           (46 %). *Se unifica en el más chico de los dos: una huella que
           llena de más se lee como un dibujo y no como una ausencia.* */
        <Svg width={Math.round(diametro * 0.42)} height={Math.round(diametro * 0.42)} viewBox="0 0 24 24">
          <Huella color={tinta} escala={0.9} x={1.2} y={1.2} />
        </Svg>
      )}
    </View>
  )
}
