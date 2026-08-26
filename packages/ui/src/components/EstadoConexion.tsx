/**
 * EstadoConexion — cómo anda el cable, dicho sin mentir (S106-B, OBRA 5).
 *
 * **Tres estados, y ninguno afirma más de lo que sabe:**
 * · `buena`      — punto verde. No pide nada.
 * · `inestable`  — punto ámbar. **Avisa, no alarma:** la llamada sigue.
 * · `reconectando` — **BANDA CON PALABRAS.**
 *
 * ── 🔴 POR QUÉ SOLO UNO CRECE A BANDA ──────────────────────────────────────
 * **Porque es el único que el usuario NECESITA entender para no colgar.**
 *
 * Si la imagen se congela y la pantalla no dice nada, la familia **cuelga
 * creyendo que se rompió** — y pierde la consulta que ya pagó (§4: se cobra
 * igual). *El costo de no decirlo no es estético: es una consulta perdida y una
 * plata que no vuelve.* Con la banda, espera.
 *
 * Los otros dos **no crecen a propósito**: una banda permanente diciendo «buena
 * conexión» es ruido sobre la cara de un veterinario, y a los dos días nadie la
 * lee. *Avisar todo enseña a ignorar los avisos* (precedente S96).
 *
 * ── EL COLOR NUNCA VIAJA SOLO ──────────────────────────────────────────────
 * Los tres llevan `accessibilityLabel` con su voz entera. **Un estado dicho
 * únicamente en color no existe para quien no lo distingue** — y por eso el que
 * de verdad importa se dice con PALABRAS, no con un punto más rojo.
 *
 * ── LOS PUNTOS SON GRÁFICA, LA BANDA ES TEXTO ──────────────────────────────
 * El punto sale de **la clase** (`sobreVideo.estadoBueno/estadoAtencion`) y NO
 * de `theme.status.*`: R12 prohíbe el ámbar de la casa como FILL —vive como
 * tinte y rellenarlo colapsa contra el CTA de oro, que está a ~4°— y además
 * este punto no tiene ninguna superficie de la casa debajo. **Un color de tema
 * sobre un fondo que el tema no gobierna es una promesa que nadie cumple.**
 * La banda usa `sobreVideo.banda`, cuyo par con el texto está medido
 * en `verify-contrast.ts` (**8.27 sobre video blanco · 19.47 sobre negro**).
 *
 * ── LA VOZ ES DEL CONSUMIDOR ───────────────────────────────────────────────
 * Las cadenas entran por props: son voz de la app, no del sistema. *Y hay una
 * razón más dura: el texto de «reconectando» es lo que decide si alguien
 * cuelga o espera — eso lo firma quien escribe la voz del producto.*
 */

import { View } from 'react-native'

import { sobreVideo } from '../tokens/sobreVideo'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { Texto } from './Texto'

export type EstadoDeConexion = 'buena' | 'inestable' | 'reconectando'

export interface EstadoConexionProps {
  estado: EstadoDeConexion
  /** La voz de cada estado. La de `reconectando` es la que se LEE en pantalla. */
  voz: { buena: string; inestable: string; reconectando: string }
}

const PUNTO = 8

export function EstadoConexion({ estado, voz }: EstadoConexionProps) {
  const etiqueta = voz[estado]

  // ── El único que crece: banda con palabras.
  if (estado === 'reconectando') {
    return (
      <View
        accessibilityRole="text"
        accessibilityLabel={etiqueta}
        accessibilityLiveRegion="polite"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing[2],
          paddingHorizontal: spacing[3],
          paddingVertical: spacing[1.5],
          borderRadius: radius.full,
          backgroundColor: sobreVideo.banda,
          alignSelf: 'flex-start',
        }}
      >
        <View
          style={{
            width: PUNTO,
            height: PUNTO,
            borderRadius: radius.full,
            backgroundColor: sobreVideo.estadoAtencion,
          }}
        />
        <Texto variante="apoyo" color="sobreVideo">
          {etiqueta}
        </Texto>
      </View>
    )
  }

  // ── Los otros dos: punto y nada más. La voz viaja en el label.
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={etiqueta}
      style={{
        width: PUNTO + 4,
        height: PUNTO + 4,
        borderRadius: radius.full,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: PUNTO,
          height: PUNTO,
          borderRadius: radius.full,
          backgroundColor: estado === 'buena' ? sobreVideo.estadoBueno : sobreVideo.estadoAtencion,
          /* Anillo de la clase: sobre un video claro un punto de color se pierde. */
          borderWidth: sobreVideo.anilloAncho,
          borderColor: sobreVideo.anillo,
        }}
      />
    </View>
  )
}
