/**
 * LockupMarca — EL NOMBRE DE LA CASA, EN UN SOLO LUGAR (S104-B).
 *
 * ═══════════════════════════════════════════════════════════════════
 * 🔴 POR QUÉ NACE, con el censo que lo obliga: **el nombre del producto
 * tenía TRES VARIANTES VIVAS de cara al usuario.**
 *   · `e-PetPlace` — **95** veces en los cuatro diccionarios
 *   · `ePetPlace` — **3** (una de ellas el nombre del launcher)
 *   · `e.petplace` — **UNA**… y era **el wordmark de la primera pantalla
 *     que alguien ve**.
 * *La variante más rara ocupaba el único lugar donde el nombre se
 * presenta.* Y no había pieza: el lockup estaba escrito como un `<Text>`
 * crudo dentro de la pantalla, así que **cada superficie que quisiera
 * nombrar la casa volvía a teclear el nombre.** Con eso, tres variantes
 * no son un descuido: son el resultado esperado.
 * ═══════════════════════════════════════════════════════════════════
 *
 * ── EL NOMBRE NO ES UNA PROP, Y ÉSA ES LA DECISIÓN ────────────────────
 * La forma obvia era `<LockupMarca nombre="e-PetPlace" />`. **Se
 * descartó**: una prop de texto libre es exactamente el mecanismo que
 * produjo las tres variantes — el cuarto consumidor teclea la cuarta.
 * Acá el nombre **vive adentro** y el consumidor solo declara **de qué
 * casa es**, sobre un union cerrado. *El estado malo se vuelve
 * inexpresable en vez de vigilarse.*
 *
 * ⚠️ **NO es string de voz y por eso NO viaja por i18n.** El nombre de
 * la marca es identidad: no se traduce, no se declina, no cambia con el
 * idioma. Meterlo en el diccionario habría invitado a "traducirlo".
 *
 * ── LA ANATOMÍA sale de la bienvenida, medida y no inventada ──────────
 * `typography.family.sans.medium` a `size.lg` en `text.primary` — los
 * tres valores exactos que la bienvenida del cliente ya usaba. La pieza
 * no propone una tipografía nueva: **adopta la que ya estaba y la vuelve
 * irrepetible.**
 *
 * ── EL SUFIJO DEL PRESTADOR ───────────────────────────────────────────
 * `e-PetPlace Negocios` es UNA marca, no dos palabras sueltas: el
 * `app.json` del prestador ya la nombra así desde S96-C, y **el bundle
 * `com.epetplace.prestador` NO se toca** (D-752 — si se toca, es una app
 * nueva y se pierden las instalaciones).
 *
 * ── LOS TRES TEMAS ────────────────────────────────────────────────────
 * Toma `text.primary` del tema, así que resuelve solo en claro, oscuro y
 * memorial. **No degrada ni se apaga en memorial**: a diferencia de
 * `MarcaDeAgua`, esto no es ornamento — es el nombre de la casa, y una
 * casa no deja de llamarse como se llama porque alguien esté de duelo.
 *
 * ── MOVIMIENTO ────────────────────────────────────────────────────────
 * **Ninguno.** Quien quiera que entre escalonado lo envuelve en
 * `Entrada`; quien quiera que respire, en `RespiroDeMarca`. La pieza no
 * anima nada sola — el gesto es de quien compone (condición de mesa,
 * patrón `FilaCita`/`Entrada`).
 *
 * ── LA ESCALERA (Ley 11) ──────────────────────────────────────────────
 * No muestra datos del expediente ⇒ **§4b no aplica.** Declarado.
 */

import { Text } from 'react-native'

import { typography } from '../tokens/typography'
import { useTheme } from '../ThemeProvider'

/** El nombre canónico. **Vive UNA vez en todo el producto y es acá.**
 *  ⚠️ Si algún día cambia, cambia en esta constante — no en 95 strings. */
const NOMBRE = 'e-PetPlace'

/** El de la app de negocios. Es el MISMO nombre + su sufijo, derivado y
 *  no tecleado aparte: así no pueden divergir. */
const NOMBRE_NEGOCIOS = `${NOMBRE} Negocios`

export interface LockupMarcaProps {
  /**
   * De qué casa es el lockup. **Union cerrado a propósito** — ver el
   * JSDoc: si esto fuera texto libre, volvería el problema que la pieza
   * viene a cerrar.
   */
  casa: 'cliente' | 'prestador'
  /** Escala del texto. Default `lg`, que es lo que la bienvenida usaba. */
  tamano?: 'base' | 'lg' | 'xl'
  /** Override del color, para montarlo sobre una superficie de marca
   *  (un muro de oficio, un gradiente) donde `text.primary` no contrasta. */
  color?: string
}

export function LockupMarca({ casa, tamano = 'lg', color }: LockupMarcaProps) {
  const { theme } = useTheme()
  return (
    <Text
      style={{
        fontFamily: typography.family.sans.medium,
        fontSize: typography.size[tamano],
        color: color ?? theme.text.primary,
      }}
      // El nombre de la marca se lee como una unidad, no letra por letra.
      accessibilityRole="text"
    >
      {casa === 'prestador' ? NOMBRE_NEGOCIOS : NOMBRE}
    </Text>
  )
}
