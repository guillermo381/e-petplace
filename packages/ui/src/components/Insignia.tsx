/**
 * Insignia — el chip de estado del sistema (S43-B3.5).
 *
 * ═══════════════════════════════════════════════════════════════════
 * NO ES INTERACTIVA — jamás Pressable. Un badge que se toca es un
 * botón disfrazado: si necesita acción, es un Boton (o una Celda).
 * ═══════════════════════════════════════════════════════════════════
 *
 * TRES familias (discriminated union — el consumidor JAMÁS elige colores):
 *   estado → alDia/atencion/proximo/info: tint + texto AA del tema,
 *            la pareja completa sale de tokens.
 *   capa   → vida/cuidado/comunidad/comunidadAmplia: punto del hex
 *            PURO (registro gráfico) + texto en capaText (registro AA).
 *            La regla de dos registros cableada acá, no confiada.
 *
 *   distincion → cohorte: pastilla PLENA con la palabra entera. Es un
 *            hecho FIJO de identidad, no un estado que se gana y se
 *            pierde. Su lugar es JUNTO AL NOMBRE en el techo (firma de
 *            mesa S85) y en la ficha pública — no sobre la foto: sobre la
 *            foto una pastilla habla del estado de HOY, y además la foto
 *            puede faltar mientras el nombre siempre está.
 *
 * soloPunto (familia capa): solo el punto de 10 para celdas densas.
 * La etiqueta sigue siendo obligatoria — pasa a ser el accessibilityLabel:
 * el color jamás es el único canal (TS lo fuerza).
 */

import { Text, View } from 'react-native'

import { typography } from '../tokens/typography'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { palette } from '../tokens/palette'
import { useTheme } from '../ThemeProvider'

export type InsigniaEstado = 'alDia' | 'atencion' | 'proximo' | 'info'
export type InsigniaCapa = 'vida' | 'cuidado' | 'comunidad' | 'comunidadAmplia'
/** S85-B16 · LA TERCERA FAMILIA — DISTINCIÓN. Nace del rebote del
 *  founder sobre los dos glifos de cohorte: «no me gusta ninguno, puede
 *  que tengamos que no usar glifo para esto, YA QUE ES ESPECIAL».
 *
 *  EL DIAGNÓSTICO ES DE PIEZA, NO DE DIBUJO, y es lo que hay que leer
 *  antes de tocar esto: tres candidatos murieron por colisión de idioma
 *  (medalla · laurel · podio) y dos rebotaron en dispositivo. Cinco
 *  señales apuntando al mismo lado — **un glifo de línea a 21px no puede
 *  portar PERTENENCIA**. Un glifo dice de qué es algo; una insignia dice
 *  QUÉ ES ALGUIEN. La referencia que él dio es la pastilla «Al día» del
 *  cliente, que es esta misma pieza en su familia `estado`.
 *
 *  POR QUÉ FAMILIA NUEVA Y NO UN `estado` MÁS: `estado` es TRANSITORIO y
 *  del sistema (al día · atención · próximo · info) — se gana y se pierde
 *  solo. Meter «fundador» ahí sería pedirle prestada su semántica a un eje
 *  que no es el suyo: la misma sustitución genérica que la Ley 12 prohíbe
 *  para los glifos, un piso más arriba. Y tampoco es `capa`, que dibuja
 *  PUNTO + texto y clasifica un DOMINIO. La distinción es permanente, es
 *  de identidad, y no se pierde por no usar la app.
 *
 *  CAPA COMUNIDAD, por taxonomía (Ley 10) y no por gusto: pertenecer a la
 *  cohorte fundadora es un VÍNCULO —la misma capa que `familia`, `equipo`
 *  y `contacto`—, no una credencial ante el Estado. */
export type InsigniaDistincion = 'cohorte'
export type InsigniaTamaño = 'sm' | 'md'

const TAMAÑOS: Record<InsigniaTamaño, { alto: number; fontSize: number }> = {
  sm: { alto: 22, fontSize: typography.size.xs },
  md: { alto: 26, fontSize: typography.size.sm },
}

const ESTADO_A_STATUS = {
  alDia: 'success',
  atencion: 'danger',
  proximo: 'warning',
  info: 'info',
} as const

const CAPA_A_KEY = {
  vida: 'identidad',
  cuidado: 'cuidado',
  comunidad: 'comunidad',
  comunidadAmplia: 'comunidadAmplia',
} as const

export type InsigniaProps =
  | { estado: InsigniaEstado; capa?: never; soloPunto?: never; etiqueta: string; tamaño?: InsigniaTamaño }
  | { capa: InsigniaCapa; estado?: never; soloPunto?: boolean; etiqueta: string; tamaño?: InsigniaTamaño }
  | {
      distincion: InsigniaDistincion
      estado?: never
      capa?: never
      soloPunto?: never
      etiqueta: string
      tamaño?: InsigniaTamaño
      /** SOBRE QUÉ SUPERFICIE vive — mismo vocabulario y mismos valores
       *  que `Boton.superficie` y `LogoNegocio.superficie`: la casa ya
       *  resolvió "esta pieza puede vivir sobre el muro" y se ENSANCHA su
       *  respuesta en vez de inventar otra (L-175).
       *
       *  ⚠️ POR QUÉ HACE FALTA, con el número que lo prueba: la insignia
       *  vive JUNTO AL NOMBRE en el techo, y el techo ES el muro. Ahí el
       *  tratamiento de capa se cae — `capaText.comunidad` sobre el muro
       *  da **1.03 en claro**: invisible. Es la misma trampa que cazó a
       *  `Boton` en S84-B19, y se cura igual: sobre el muro la pieza
       *  INVIERTE (fondo papel, texto del muro), que es el par FIRMADO por
       *  §15b.2 — 5.51 en claro, 9.61 en oscuro.
       *
       *  Acotada a `distincion` a propósito: es la única familia que hoy
       *  vive en el muro. Una prop sin consumidor decora. */
      superficie?: 'clara' | 'muro'
    }

export function Insignia(props: InsigniaProps) {
  const { etiqueta, tamaño = 'md' } = props
  const { theme } = useTheme()
  const t = TAMAÑOS[tamaño]
  const capaTexto = 'capaText' in theme ? theme.capaText : theme.capa

  // ── DISTINCIÓN: pastilla PLENA de su capa, sin punto y sin borde de
  //    estado. Es la anatomía de `estado` (fondo propio + texto AA) con
  //    el vocabulario de `capa` — que es exactamente lo que la pieza no
  //    sabía decir hasta hoy.
  if ('distincion' in props && props.distincion) {
    const sobreMuro = props.superficie === 'muro'
    // El muro NO sale del tema: vive en la app (`techo-oficio`). Su color
    // sí es token, así que la pieza puede resolverlo sin cruzar frontera
    // — el mismo camino que abrió `Boton` en S84-B19.
    const muro = theme.mode === 'dark' ? palette.tealDarkNoche : palette.tealDark
    return (
      <View
        accessibilityRole="text"
        accessibilityLabel={etiqueta}
        style={{
          justifyContent: 'center',
          height: t.alto,
          paddingHorizontal: spacing[3],
          borderRadius: radius.full,
          // MEMORIAL no tiene `capaBg` — y su ausencia es la ley, no un
          // hueco: memorial tiene UNA superficie a propósito (Ley 8:
          // degrada, no celebra). Ahí la distinción se apoya en
          // `bg.elevated`, igual que la familia `capa` un poco más abajo:
          // sigue existiendo, deja de celebrar. Mismo idioma que el guard
          // de `capaText` que esta pieza ya usaba.
          backgroundColor: sobreMuro
            ? palette.light0
            : 'capaBg' in theme
              ? theme.capaBg.comunidad
              : theme.bg.elevated,
          borderWidth: sobreMuro ? 0 : theme.border.width,
          borderColor: theme.capa.comunidad,
          alignSelf: 'flex-start',
        }}
      >
        <Text
          style={{
            fontFamily: typography.family.sans.bold,
            fontSize: t.fontSize,
            color: sobreMuro ? muro : capaTexto.comunidad,
          }}
        >
          {etiqueta}
        </Text>
      </View>
    )
  }

  if ('capa' in props && props.capa) {
    const k = CAPA_A_KEY[props.capa]

    if (props.soloPunto) {
      return (
        <View
          accessibilityRole="text"
          accessibilityLabel={etiqueta}
          style={{ width: 10, height: 10, borderRadius: radius.full, backgroundColor: theme.capa[k] }}
        />
      )
    }

    return (
      <View
        accessibilityRole="text"
        accessibilityLabel={etiqueta}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing[1.5],
          height: t.alto,
          paddingHorizontal: spacing[2.5],
          borderRadius: radius.full,
          backgroundColor: theme.bg.elevated,
          borderWidth: theme.border.width,
          borderColor: theme.border.subtle,
          alignSelf: 'flex-start',
        }}
      >
        <View style={{ width: 8, height: 8, borderRadius: radius.full, backgroundColor: theme.capa[k] }} />
        <Text style={{ fontFamily: typography.family.sans.medium, fontSize: t.fontSize, color: capaTexto[k] }}>
          {etiqueta}
        </Text>
      </View>
    )
  }

  const s = ESTADO_A_STATUS[(props as { estado: InsigniaEstado }).estado]
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={etiqueta}
      style={{
        justifyContent: 'center',
        height: t.alto,
        paddingHorizontal: spacing[2.5],
        borderRadius: radius.full,
        backgroundColor: theme.status[`${s}Bg`],
        borderWidth: theme.border.width,
        borderColor: theme.status[`${s}Border`],
        alignSelf: 'flex-start',
      }}
    >
      <Text style={{ fontFamily: typography.family.sans.medium, fontSize: t.fontSize, color: theme.status[`${s}Text`] }}>
        {etiqueta}
      </Text>
    </View>
  )
}
