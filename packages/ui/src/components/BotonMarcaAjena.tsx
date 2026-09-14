/**
 * BotonMarcaAjena — entrar con una cuenta que no es nuestra.
 *
 * 🔴 **LA REGLA QUE GOBIERNA ESTA PIEZA: la marca ajena va TAL CUAL ES.**
 * No se redibuja, no se re-colorea, no se estira y no se le recorta el
 * logo para usarlo aparte. Por eso **el botón no lo compone la casa: lo
 * entrega su dueño entero**, con su tipografía, su caja y su padding, y
 * nosotros sólo le damos lugar.
 *
 * ── POR QUÉ SE MONTA EL BOTÓN ENTERO Y NO SÓLO EL LOGO ────────────────
 * Google permite las dos cosas. Poner sólo su logo dentro de un botón
 * nuestro **exige Google Sans Medium 14/20** (su spec, medida de la página
 * oficial), y la casa no tiene esa fuente. *Un botón «casi» conforme a las
 * guidelines de otro no es un atajo: es un incumplimiento con mejor
 * aspecto.* ⇒ se monta el asset que Google entrega, escalado
 * proporcionalmente.
 *
 * ⚠️ **SE ESCALA, NO SE ESTIRA.** El asset mide 180×40 y tiene relación
 * fija; el `alto` de la casa lo agranda por igual en los dos ejes (52 ⇒
 * 234×52). **Un `width:'100%'` acá deformaría la tipografía de otro**, que
 * es justo lo que las guidelines prohíben. *Si la pantalla necesita una
 * fila de ancho completo, el que se estira es el CONTENEDOR y este botón
 * va centrado adentro.*
 *
 * ── 🔴 APPLE: EL LUGAR ESTÁ, EL BOTÓN NO — Y ES UNA DECISIÓN ──────────
 * Firma de la mesa (13-sep-2026): *«Apple queda OCULTO en 03 y 05 hasta
 * que el founder tenga cuenta de developer: un botón que no funciona no se
 * muestra.»* Medido por C: **el motor de Apple no existe** (cero en
 * `packages/api`).
 *
 * **Cómo está preparado, que es lo que la orden pide:** `marca` ya acepta
 * `'apple'`, y la pieza **devuelve `null`** porque no hay asset. *No es un
 * `if` que alguien pueda borrar por prolijidad: sin archivo no hay qué
 * dibujar, así que el estado «Apple visible y roto» es inexpresable.* El
 * día que haya cuenta, entra el asset con su procedencia y esto se
 * enciende **sin tocar ninguna pantalla**.
 *
 * ⚠️ Y la pantalla **no tiene que preguntarse si Apple está listo**: monta
 * los dos y la pieza decide. *Un `{apple && <Boton/>}` en once pantallas
 * son once lugares donde alguien se olvida de sacarlo el día que exista.*
 */

import Animated from 'react-native-reanimated'
import { Image, Pressable, type ImageSourcePropType } from 'react-native'

import { medidas } from '../tokens/medidas'
import { usePresionado } from './usePresionado'

export type MarcaAjena = 'google' | 'apple'

/** Los assets que EXISTEN. **Apple no está y eso es el mecanismo**: sin
 *  entrada acá, la pieza no puede dibujarlo aunque alguien lo pida. */
const ASSET: Partial<Record<MarcaAjena, ImageSourcePropType>> = {
  google: require('../../assets/marcas-ajenas/google-entrar.png'),
}

/** La relación del asset de cada marca, para escalarlo sin deformarlo. */
const RELACION: Record<MarcaAjena, number> = {
  google: 180 / 40,
  apple: 180 / 40,
}

export interface BotonMarcaAjenaProps {
  marca: MarcaAjena
  onPress: () => void
  /** Qué dice el lector de pantalla. **Lo pone la pantalla**, porque es la
   *  que sabe si está entrando o creando una cuenta — y el asset trae su
   *  texto dibujado, que ningún lector puede leer. */
  etiqueta: string
  /** Alto del botón. Default: el del secundario de la letra §2. */
  alto?: number
}

export function BotonMarcaAjena({ marca, onPress, etiqueta, alto = medidas.secundarioAlto }: BotonMarcaAjenaProps) {
  const { handlers, estiloPresionado } = usePresionado()
  const fuente = ASSET[marca]
  /* Sin asset no hay botón. **Es la mitad del mecanismo de Apple**: la
     pantalla lo monta igual y acá no pasa nada. */
  if (fuente === undefined) return null

  const ancho = alto * RELACION[marca]
  return (
    <Pressable
      onPress={onPress}
      {...handlers}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      /* El área táctil la garantiza el alto (52 > 44). */
      style={{ alignSelf: 'center' }}
    >
      {/* ⚠️ `Animated.View` y no `View`: `estiloPresionado` en el array de
          estilos de un `Pressable` **compila en packages/ui y rompe el
          `ViewStyle` de las apps** — medido dos veces en el lote 2. */}
      <Animated.View style={[{ width: ancho, height: alto }, estiloPresionado]}>
        <Image
          source={fuente}
          style={{ width: '100%', height: '100%' }}
          /* `contain` y no `cover`: **una marca ajena no se recorta.** */
          resizeMode="contain"
          /* El texto ya está dibujado en el asset; el lector lo recibe por
             `accessibilityLabel` del Pressable, no por acá. */
          accessible={false}
        />
      </Animated.View>
    </Pressable>
  )
}
