/**
 * TarjetaAdoptable — LA FILA DE LA VIDRIERA DE ADOPCIÓN (S112-B).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **SE PRESENTAN VIDAS, NO INVENTARIO** (`LETRA_ADOPCION` §4).
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Firma del founder, verbatim: *«Presento vidas, no inventario. La tarjeta es
 * foto grande y nombre; edad estimada y "mestizo" se leen como lo que son, sin
 * vergüenza. Nada de swipe, nada de corazones, nada de puntaje.»*
 *
 * ── LO QUE ESTA PIEZA NO TIENE, Y ES LA MITAD DE SU DISEÑO ────────────────
 * **Sin favorito. Sin swipe. Sin puntaje. Sin badge de «match».** No están
 * «pendientes»: están PROHIBIDOS por §4 (*sin swipe, sin descartes
 * gamificados, sin score de match visible*). Se declara acá porque son
 * exactamente las cuatro cosas que cualquiera agregaría a una tarjeta de
 * catálogo sin pensarlo — y esto no es un catálogo.
 *
 * ── 🔴 LA AUSENCIA NO SE DIBUJA COMO HUECO ───────────────────────────────
 * Es la misma ley que ordena a `Convivencia`, y acá se cobra dos veces:
 *
 * · **`edad = null` SE DICE.** El wrapper de adopción lo documenta —*«no se
 *   infiere una edad que nadie declaró»*— y §3 pide edad **estimada** en la
 *   ficha. ⇒ la pieza dice `voces.edadNoInformada` **en la misma línea y el
 *   mismo peso** que el resto de la identidad. *Callarla la volvería un hueco
 *   en la lista; agrisarla la volvería un defecto del animal.*
 * · **`raza = null` NO ES «falta la raza», y por eso NO SE DICE.** §3: *mestizo
 *   es categoría legítima*. Un refugio que declara «Mestizo» ve «Mestizo»
 *   escrito igual que cualquier otra raza —sin paréntesis, sin gris, sin
 *   «sin raza definida»—; uno que no declaró nada simplemente no aporta esa
 *   palabra. **La pieza jamás escribe «mestizo» por su cuenta:** null es «no
 *   lo declararon», y confundir las dos cosas es inventarle un dato al animal.
 *
 * ⇒ **Las dos ausencias son distintas y se dibujan distinto.** Tratarlas igual
 * —callar las dos, o rotular las dos— sería el error cómodo.
 *
 * ── LA FOTO PRESIDE, Y SIN FOTO HAY ESTADO PROPIO (precedente TarjetaProducto)
 * *La foto no ilustra el dato: la foto ES el dato.* Va a sangre arriba, en
 * relación fija. Sin foto, la caja NO queda vacía: lleva la **huella** de la
 * casa —el fallback digno que el founder ya firmó en `AvatarMascota`— sobre
 * `bg.hundido`. **Jamás se parece al esqueleto de carga**: *«no hay foto» y
 * «todavía no llegó» son dos cosas distintas, y dibujarlas igual es N23
 * aplicada al tiempo* (la letra es de `TarjetaProducto`, y vale idéntica acá).
 *
 * **RELACIÓN 1:1, y es una decisión medida, no una copia.** La caja recorta con
 * `cover`, y a diferencia del catálogo de la despensa **acá no podemos imponer
 * un estándar de imagen**: la foto la saca un refugio con su teléfono, casi
 * siempre en retrato. Una 3:4 metida en 1:1 pierde **~25 %** de alto; en 4:3
 * pierde **~44 %** — y lo que se recorta de la foto de un animal en retrato es
 * la cabeza. *Se elige la relación que menos lastima al asset que de verdad va
 * a llegar, no la que se ve mejor con la foto ideal.*
 *
 * ── EL LAYOUT ES DEL PADRE ────────────────────────────────────────────────
 * La pieza no fija ancho ni margen: sirve igual en columna o en grilla de dos.
 * **Sí trae su propia superficie** (N21: una lista cuyos ítems YA son cartas
 * no se anida — la carta es el ítem).
 *
 * ── CERO DICCIONARIO, CERO CÁLCULO (Ley 3 · precedente `Convivencia`) ─────
 * `especie`, `sexo` y `edad` llegan **ya redactados**. La pieza no traduce
 * códigos ni convierte fechas: el riel de i18n y los formateadores de fecha
 * viven en las apps, y una edad («2 meses» / «2 años») depende del idioma y de
 * la especie. Duplicar acá lo que el riel ya hace es cómo nacen dos verdades.
 *
 * Sin animación propia salvo el pressed de la casa (`usePresionado`).
 * Memorial degrada por token, no por rama.
 */
import { Image, Pressable, View } from 'react-native'
import Animated from 'react-native-reanimated'
import Svg from 'react-native-svg'

import { Huella, HUELLA_BOX } from '../brand/Huella'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { Texto } from './Texto'
import { usePresionado } from './usePresionado'

/** Ver la nota de la relación: 1:1 recorta menos el retrato real de refugio. */
const RELACION_FOTO = 1
const HUELLA_SIN_FOTO = 40

export type TarjetaAdoptableProps = {
  /** Siempre. Es lo que la vidriera presenta: un nombre, no un ítem. */
  nombre: string
  /** Ya en voz de la casa («Perro»), jamás el código de `cat_especies`. */
  especie: string
  /** `null` = el refugio no la declaró. **No es «mestizo»** — ver la cabecera. */
  raza?: string | null
  /** Ya redactado («Macho»). `null` = no declarado: no se dice nada. */
  sexo?: string | null
  /**
   * La edad **ya redactada** por la app («2 años»). `null` = nadie la declaró,
   * y entonces la pieza LO DICE con `voces.edadNoInformada`.
   *
   * ⚠️ Llega redactada a propósito: la pieza no convierte `fechaNacimiento`.
   * Ese cálculo depende del idioma y de la especie, y el riel ya lo tiene.
   */
  edad?: string | null
  fotoUrl?: string | null
  /** El refugio o la persona que publica. Procedencia, no protagonista. */
  publicador?: string | null
  /** OBLIGATORIA: la pieza no trae diccionario (precedente `EscaleraEstados`). */
  voces: { edadNoInformada: string }
  /** Lleva a la ficha. Una tarjeta de la vidriera SIEMPRE lleva a algún lado. */
  onPress: () => void
}

export function TarjetaAdoptable({
  nombre,
  especie,
  raza,
  sexo,
  edad,
  fotoUrl,
  publicador,
  voces,
  onPress,
}: TarjetaAdoptableProps) {
  const { theme } = useTheme()
  const { handlers, estiloPresionado } = usePresionado()

  /* LA LÍNEA DE IDENTIDAD. Lo no declarado no aporta palabra; la edad sí,
     porque su silencio se leería como hueco (ver la cabecera). El orden va de
     lo más estable a lo más variable, y la edad cierra: es el dato que más se
     busca y el único que puede venir en su forma negativa. */
  const identidad = [especie, raza, sexo, edad ?? voces.edadNoInformada]
    .filter((x): x is string => typeof x === 'string' && x.length > 0)
    .join(' · ')

  return (
    <Animated.View style={estiloPresionado}>
      <Pressable
        onPress={onPress}
        {...handlers}
        accessibilityRole="button"
        /* Un solo nodo que dice quién es y qué se sabe: el lector de pantalla
           no debería tener que recorrer cuatro textos sueltos para entenderlo. */
        accessibilityLabel={`${nombre}. ${identidad}`}
        style={{
          backgroundColor: theme.bg.card,
          borderRadius: radius.lg,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: theme.bg.border,
        }}
      >
        <View
          style={{
            aspectRatio: RELACION_FOTO,
            backgroundColor:
              fotoUrl === null || fotoUrl === undefined ? theme.bg.hundido : theme.bg.card,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {fotoUrl === null || fotoUrl === undefined ? (
            /* SIN FOTO — estado propio, estático, jamás esqueleto. La huella
               es el fallback que el founder firmó para una mascota sin foto;
               se reusa en vez de inventarle un glifo nuevo a este caso. */
            <Svg width={HUELLA_SIN_FOTO} height={HUELLA_SIN_FOTO} viewBox={`0 0 ${HUELLA_BOX} ${HUELLA_BOX}`}>
              <Huella color={theme.text.tertiary} />
            </Svg>
          ) : (
            <Image
              source={{ uri: fotoUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
              /* La foto ya está descrita por el label de la tarjeta. */
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />
          )}
        </View>

        <View style={{ padding: spacing[3], gap: spacing[1] }}>
          {/* El nombre manda por TAMAÑO y PESO, jamás por color (N23). */}
          <Texto variante="seccion">{nombre}</Texto>
          {/* Dos líneas: en una tarjeta angosta la identidad envuelve, y
              truncarla perdería justo el dato que la persona vino a buscar. */}
          <Texto variante="apoyo" numberOfLines={2}>
            {identidad}
          </Texto>
          {publicador === null || publicador === undefined ? null : (
            <Texto variante="apoyo" color="tertiary" numberOfLines={1}>
              {publicador}
            </Texto>
          )}
        </View>
      </Pressable>
    </Animated.View>
  )
}
