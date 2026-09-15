/**
 * IdentidadMascota — QUIÉN ES, en el techo del expediente.
 *
 * El retrato grande y redondo, la pastilla de estado montando su aro, el
 * nombre y lo que lo acompaña. Todo centrado sobre la banda.
 *
 * ⚠️ **HAY UN TIPO CON ESTE NOMBRE EN `@epetplace/api`** (`IdentidadMascota`,
 * lo que devuelve `obtenerPerfilMascota` como `mascota`). **No es un
 * descuido: son dos cosas distintas con el mismo nombre justo** —el DATO y
 * la PIEZA que lo dibuja— y la pantalla que monta ésta es exactamente la que
 * consume aquél. El compilador lo dice fuerte si alguien importa los dos en
 * el mismo archivo; la salida es una línea:
 *
 *     import type { IdentidadMascota as PerfilDeMascota } from '@epetplace/api'
 *
 * *Se declara acá y no se renombra la pieza porque el nombre es el de la
 * mesa, y el tipo vive en territorio de A.* Anotado en el buzón.
 *
 * ── EL NOMBRE VA EN BALOO, Y ESO ES UNA CORRECCIÓN MEDIDA ─────────────
 * 🔴 El expediente lo dibujaba en **`SERIF_LOCAL`** —`Platform.select({ ios:
 * 'Georgia', default: 'serif' })`—, o sea **la serif del sistema operativo**,
 * con su marcador de override local al lado. *Dos aparatos mostraban el
 * nombre de la misma mascota en dos tipografías distintas, y ninguna era la
 * de la casa.* La casa tiene Baloo 2 ExtraBold para display desde la letra
 * v5; `titulo1` es su escala. No se porta el 44/48 de la serif: **el tamaño
 * de una fuente no se traslada a otra** —Baloo tiene otra altura de x y a 44
 * el nombre de tres sílabas ya no entra en 360—, y `display` (34/38) es la
 * escala que la casa declaró para esto.
 *
 * ── LA PASTILLA MONTA EL ARO ──────────────────────────────────────────
 * Cabalga el borde inferior del retrato, como la tarjeta monta su borde. **No
 * es decoración: es lo que la ata al retrato** — una pastilla suelta debajo
 * se leería como el primer renglón del texto, y esto es el estado de la
 * mascota, no una línea más de su ficha.
 *
 * ── LO QUE VA DEBAJO DEL NOMBRE SON DOS LÍNEAS Y NO UNA ───────────────
 * `apoyo` es **una frase** (de dónde llegó) y `meta` es **metadato**
 * (raza · edad · peso). Van en registros distintos —sans y mono— y el
 * archivo viejo ya declaraba por qué: *«mezclarlas convertiría "Llegó de un
 * criadero" en un dato más»*. El encargo nombró una sola; **la segunda está
 * en el objeto y sacarla borraría la raza, la edad y el peso del techo**, así
 * que viaja, declarada. Las dos son opcionales y el silencio no se comenta.
 */

import { type ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import Animated from 'react-native-reanimated'

import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { RetratoCircular } from './retrato-mascota'
import { Texto } from './Texto'
import { usePresionado } from './usePresionado'

const RETRATO = 184
const ARO = 8

export interface PastillaDeIdentidad {
  /** La voz del estado, ya resuelta. */
  voz: string
  /** El tono. **`atencion` es lo único que tiñe** — `alDia` y `neutro` van en
   *  tinta: *un estado bueno no necesita color para ser bueno, y pintarlo
   *  de verde pone a competir la buena noticia con la que sí pide algo.* */
  tono: 'alDia' | 'atencion' | 'neutro'
  /** El glifo del estado, si lo lleva (el check del «al día»). Lo monta
   *  quien la usa: la pieza no elige glifos. */
  glifo?: ReactNode
  /** La segunda verdad, al lado y no en lugar de la primera («3 por
   *  revisar»). **En la MISMA pastilla a propósito**: dos píldoras se leerían
   *  como dos estados en competencia, y esto no compite — completa. */
  complemento?: string
}

export interface IdentidadMascotaProps {
  nombre: string
  fotoUrl?: string
  /** `null` = no hay estado que decir y **no se dibuja la pastilla**. */
  pastilla?: PastillaDeIdentidad | null
  /** La frase de apoyo bajo el nombre (el origen en humano). */
  apoyo?: string | null
  /** El metadato en mono (raza · edad · peso). */
  meta?: string | null
  /** El retrato como puerta a editar la foto. **Ausente = el retrato se
   *  MIRA**: pasa a `accessibilityRole="image"` y deja de anunciarse como
   *  botón. *Un botón deshabilitado sigue diciendo que es un botón, y sin
   *  razón visible eso es peor que no serlo* — es el caso de memorial. */
  onPressFoto?: () => void
  etiquetaFoto?: string
}

export function IdentidadMascota({
  nombre,
  fotoUrl,
  pastilla,
  apoyo,
  meta,
  onPressFoto,
  etiquetaFoto,
}: IdentidadMascotaProps) {
  const { theme } = useTheme()
  const presion = usePresionado()
  const tocable = onPressFoto !== undefined

  return (
    <View style={{ alignItems: 'center' }}>
      <Pressable
        accessibilityRole={tocable ? 'button' : 'image'}
        accessibilityLabel={tocable ? etiquetaFoto : nombre}
        disabled={!tocable}
        onPress={onPressFoto}
        {...(tocable ? presion.handlers : null)}
        /* El aire de abajo lo paga el contenedor y no la pastilla: la
           pastilla flota y no empuja, así que sin esto el nombre le subiría
           encima cuando existe y se despegaría cuando no. */
        style={{ marginBottom: spacing[5] }}
      >
        <Animated.View style={tocable ? presion.estiloPresionado : undefined}>
          <RetratoCircular
            diametro={RETRATO}
            grosorAro={ARO}
            aro={theme.bg.sobreGradiente}
            fondo={theme.bg.sobreGradiente}
            tinta={theme.text.onGradient}
            fotoUrl={fotoUrl}
          />
        </Animated.View>

        {pastilla !== null && pastilla !== undefined ? (
          <View
            style={{
              position: 'absolute',
              bottom: -spacing[2],
              alignSelf: 'center',
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing[1.5],
              borderRadius: radius.full,
              backgroundColor: theme.bg.card,
              paddingHorizontal: spacing[3],
              paddingVertical: spacing[1.5],
              boxShadow: theme.elevacion.elevada,
            }}
          >
            {pastilla.glifo}
            <Texto variante="dato" color={pastilla.tono === 'atencion' ? 'danger' : 'primary'}>
              {pastilla.voz}
            </Texto>
            {pastilla.complemento !== undefined && pastilla.complemento !== '' ? (
              <>
                <Texto variante="dato" color="tertiary">
                  ·
                </Texto>
                <Texto variante="dato" color="secondary">
                  {pastilla.complemento}
                </Texto>
              </>
            ) : null}
          </View>
        ) : null}
      </Pressable>

      {/* 🔴 **`titulo` en la casa v5 ES Baloo 28/31** —`ESCALA_V5.titulo` lo
          resuelve de `typography.escala.titulo1`—, así que el nombre pasa a
          la tipografía de la casa **sin que esta pieza elija una fuente**.
          *La serif del sistema operativo muere acá, no por gusto: era un
          `Platform.select` y mostraba el nombre distinto en iOS y en
          Android.*

          El rol de encabezado va en el `View` y no en el `Texto`: **`titulo`
          NO lo trae de fábrica** —sólo `seccion` lo hace, medido en
          `Texto.tsx:385`— y ponérselo a la variante se lo pondría a sus
          otros consumidores de una. *El nombre ES el encabezado de esta
          pantalla; que `titulo` lo sea siempre es otra discusión.* */}
      <View accessibilityRole="header">
        <Texto variante="titulo" color="sobreGradiente" centrado>
          {nombre}
        </Texto>
      </View>

      {apoyo !== null && apoyo !== undefined && apoyo !== '' ? (
        <View style={{ marginTop: spacing[1.5] }}>
          <Texto variante="cuerpo" color="sobreGradiente" centrado>
            {apoyo}
          </Texto>
        </View>
      ) : null}

      {meta !== null && meta !== undefined && meta !== '' ? (
        <View style={{ marginTop: spacing[2] }}>
          <Texto variante="dato" color="sobreGradiente" centrado>
            {meta}
          </Texto>
        </View>
      ) : null}
    </View>
  )
}
