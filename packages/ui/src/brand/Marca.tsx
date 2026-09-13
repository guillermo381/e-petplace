import { Image, View, type ImageSourcePropType } from 'react-native'
import { medidas } from '../tokens/medidas'

/**
 * ═══════════════════════════════════════════════════════════════════════
 * **ISOTIPO Y LOGO v5 (S116-B lote 2) — la nariz es la marca.**
 * Letra §1.10 · punto 13 del encargo.
 *
 * **PIEZAS NUEVAS, en un archivo propio.** ⚠️ **No reemplazan a `Isotipo`
 * todavía** —la pieza v4, con la rampa de seis colores— y por eso **no le
 * ponen lápida**: tiene **18 consumidores** y su `ISOTIPO_PATH` es la
 * única fuente del `PinEnMapa`. El plan §1 es explícito: una pieza vieja
 * muere **cuando su último consumidor migró**, y esa migración es de C.
 *
 * ── LAS DOS VERSIONES, y cuál va dónde ────────────────────────────────
 * `sobre` declara **el fondo donde se va a parar**, no el color de la
 * pieza: `claro` sobre lienzo/superficie · `oscuro` sobre ciruela/magenta.
 * *Se pide por el FONDO y no por el color a propósito: quien monta sabe
 * dónde lo pone, no qué archivo hace falta.*
 *
 * 🔴 **La versión `oscuro` trae su placa negra en el archivo** (medido en
 * `S116-B-ASSETS.md`: `14.png` y `15.png` vienen con fondo opaco). **No se
 * le quitó** —editar el asset es del founder— así que sobre ciruela va a
 * verse su rectángulo. *Se declara acá y no se disimula: quien lo monte
 * sobre la cabecera lo va a ver, y es mejor que lo sepa antes.*
 * ═══════════════════════════════════════════════════════════════════════
 */
export type SobreFondo = 'claro' | 'oscuro'

const ISOTIPO: Record<SobreFondo, ImageSourcePropType> = {
  claro:  require('../../assets/marca/isotipo.png'),
  oscuro: require('../../assets/marca/isotipo-sobre-oscuro.png'),
}
const LOGO: Record<SobreFondo, ImageSourcePropType> = {
  claro:  require('../../assets/marca/logo.png'),
  oscuro: require('../../assets/marca/logo-sobre-oscuro.png'),
}

/** El alto del isotipo. `cabecera` es el de una barra; `splash` el de la
 *  bienvenida. Salen de `medidas`, no de números sueltos. */
export type TamanoMarca = 'cabecera' | 'splash'

export function IsotipoV5({ sobre = 'claro', tamano = 'cabecera' }: { sobre?: SobreFondo; tamano?: TamanoMarca }) {
  const alto = tamano === 'splash' ? medidas.avatarHogar : medidas.avatarFila
  /* `contain` y no `cover`: **un isotipo no se recorta.** La caja la pone
     quien lo monta; la pieza sólo garantiza que entra entero. */
  return (
    <View style={{ height: alto, aspectRatio: 1365 / 922, justifyContent: 'center' }}>
      <Image source={ISOTIPO[sobre]} style={{ width: '100%', height: '100%' }} resizeMode="contain" accessible={false} />
    </View>
  )
}

export function LogoV5({ sobre = 'claro', tamano = 'cabecera' }: { sobre?: SobreFondo; tamano?: TamanoMarca }) {
  /* El logo lleva el wordmark, así que se dimensiona por ANCHO: el alto lo
     da su proporción. Al revés —fijando el alto— el texto queda ilegible en
     `cabecera` sin que nadie lo note. */
  const ancho = tamano === 'splash' ? 200 : 120
  return (
    <View style={{ width: ancho, aspectRatio: 2090 / 1507 }}>
      <Image
        source={LOGO[sobre]}
        style={{ width: '100%', height: '100%' }}
        resizeMode="contain"
        /* El logo SÍ se nombra: es la identidad, y un lector de pantalla que
           no lo dice deja a alguien sin saber en qué app está. */
        accessible
        accessibilityRole="image"
        accessibilityLabel="e-PetPlace"
      />
    </View>
  )
}
