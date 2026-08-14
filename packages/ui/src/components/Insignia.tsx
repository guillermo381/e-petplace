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

import { Pressable, Text, View } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'

import { Huella } from '../brand/Huella'

import { typography } from '../tokens/typography'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { palette } from '../tokens/palette'
import { useTraduccionUi } from '../i18n'
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
  | {
      estado: InsigniaEstado
      capa?: never
      soloPunto?: never
      etiqueta: string
      tamaño?: InsigniaTamaño
      /** S97-B · SEGUNDA FAMILIA TOCABLE — y NO es una excepción nueva: es
       *  la MISMA de S85-B24 aplicada donde su propio criterio ya la
       *  admitía.
       *
       *  Lo que la cabecera prohíbe en mayúsculas —«jamás Pressable»— es
       *  un badge que dispara una ACCIÓN: ahí el badge es un botón mal
       *  vestido y le corresponde ser `Boton`. El criterio de la ley NUNCA
       *  fue la familia, fue QUÉ HACE EL TOQUE. `distincion` entró porque
       *  el emblema no acciona: abre su propia explicación. El chip de
       *  estado entra por lo mismo — el usuario no cambia nada del sistema
       *  tocándolo, se entera de por qué está así.
       *
       *  ⚠️ LO QUE SIGUE PROHIBIDO, escrito acá porque es donde alguien va
       *  a venir a buscarlo: filtrar, navegar a otra parte, reintentar,
       *  cambiar el estado. Si el toque hace ALGO, no es esta prop — es
       *  `Boton`. Una explicación no tiene efecto secundario.
       *
       *  Sin `onPress` sigue siendo un `View` con `role="text"`: no nace un
       *  control donde no hay a dónde ir. */
      onPress?: () => void
    }
  | { capa: InsigniaCapa; estado?: never; soloPunto?: boolean; etiqueta: string; tamaño?: InsigniaTamaño }
  | {
      distincion: InsigniaDistincion
      estado?: never
      capa?: never
      soloPunto?: never
      /** ⏬ S85-B22 · RECIBE EL DATO CRUDO, NO LA ETIQUETA — y es el mismo
       *  argumento de B21 aplicado un piso más abajo, que es donde tenía
       *  que estar desde el principio.
       *
       *  EN B21 la composición bajó de las APPS a `FichaPrestador`. Pero
       *  el techo del prestador monta `Insignia` DIRECTO, sin pasar por la
       *  ficha — así que componer ahí obligaba a armar la frase en la app,
       *  en dos lenguas, al lado del diccionario de `ui`. O sea: la misma
       *  enfermedad que B21 curó, esperando en la puerta de al lado.
       *  El hallazgo es de C.
       *
       *  Ahora la frase se arma UNA VEZ, acá, donde vive la insignia. La
       *  ficha DELEGA: le pasa los dos datos crudos y no compone nada.
       *  Es la Regla de las Piezas en su forma exacta — la receta ya
       *  existía y servía a un consumidor; el techo es el segundo.
       *
       *  LOS DOS O NINGUNO: sin año no hay insignia. Un «Prestador
       *  fundador» sin año dice menos de lo que el dato sabe, y la pieza
       *  no completa lo que no le dieron. */
      cohorte: 'fundador' | 'pionero'
      cohorteAnio: number
      etiqueta?: never
      tamaño?: InsigniaTamaño
      /** ☠️ S85-B28 · SOLO EL EMBLEMA, SIN PALABRA. Firma del founder tras
       *  pedirlo TRES VECES: «te he pedido tres veces que no dejes
       *  fundador… **no quede como que los estoy reconociendo como
       *  fundadores**».
       *
       *  LO QUE MURIÓ NO ES UNA PALABRA, ES UN ACTO DE HABLA. «Prestador
       *  fundador» no describe un hecho: OTORGA un reconocimiento, y el
       *  producto no quiere estar otorgando nada — quiere decir desde
       *  cuándo alguien está. Por eso la salida no fue buscar sinónimos:
       *  **la palabra que queda es de TIEMPO, no de mérito** («Desde
       *  2026»), y en el techo no queda ninguna: la escarapela sola.
       *
       *  ⚠️ Y LA ETIQUETA NO DESAPARECE DEL TODO — sigue viva como
       *  `accessibilityLabel`. Un emblema mudo para el ojo puede ser mudo
       *  para el lector de pantalla solo si no significa nada, y éste
       *  significa. La voz completa vive en el modal (de C). */
      soloEmblema?: boolean
      /** S85-B24 · LA ÚNICA FAMILIA TOCABLE, y la excepción se explica
       *  porque la cabecera de esta pieza dice lo contrario en mayúsculas:
       *  «NO ES INTERACTIVA — jamás Pressable. Un badge que se toca es un
       *  botón disfrazado».
       *
       *  ESA REGLA SIGUE RIGIENDO, y esto no la rompe: lo que prohíbe es
       *  un badge que dispara una ACCIÓN —ahí el badge es un botón mal
       *  vestido y le corresponde ser `Boton`. El emblema no acciona:
       *  ABRE SU PROPIA EXPLICACIÓN. Es la diferencia entre un control y
       *  una nota al pie tocable; el usuario no cambia nada del sistema
       *  tocándola, se entera de qué es.
       *
       *  POR QUÉ ADENTRO Y NO ENVOLVIÉNDOLA DESDE AFUERA (pedido de C):
       *  envolver deja el ÁREA TÁCTIL, el tamaño mínimo y el foco FUERA de
       *  la pieza — o sea que cada consumidor los re-decide, y el que se
       *  olvide entrega una pastilla de 22px de alto como blanco táctil.
       *  Adentro, el target y el rol viajan con la insignia.
       *
       *  Sin `onPress` sigue siendo un `View` con `role="text"`: no nace
       *  un control donde no hay a dónde ir. */
      onPress?: () => void
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


/** LA ESCARAPELA — el peso gráfico del emblema (S85-B27).
 *
 *  NACE DE UN REBOTE EN DISPOSITIVO: «no creaste el emblema que habíamos
 *  hablado… y se ve raro debajo del nombre del negocio». Una pastilla de
 *  texto no era un emblema: decía la palabra correcta sin ser la cosa.
 *  Su referencia fue una escarapela con cinta — DIRECCIÓN, no artefacto:
 *  no se copia la imagen, se toma qué tiene que pesar.
 *
 *  ⚠️ Y ESTO REABRE ALGO QUE EL CENSO HABÍA MATADO, con su porqué medido:
 *  la roseta cayó como GLIFO porque a 21px «círculo centrado» ya está
 *  ocupado tres veces (`ayuda`, `preferencias` y el `hoy` de entonces) y
 *  a ese tamaño un disco es un disco. **Acá no es un glifo de 21px: es
 *  una pieza de VITRINA con su tamaño.** El argumento que la hundió NO
 *  aplica — y además `hoy` dejó de ser un sol, así que el idioma está
 *  menos poblado que cuando se midió. Se reabre por medición, no por
 *  insistencia.
 *
 *  ANATOMÍA: disco con canto DENTADO (lo que la separa de un círculo
 *  liso), la huella adentro —la cohorte es de quien cuida mascotas— y dos
 *  colas de cinta. La huella va DENTRO del disco y no al lado: acá el
 *  disco no es una placa de glifo (R22 gobierna las placas de la fila de
 *  filtros), es el cuerpo del emblema. */
const DIENTES = 12
function Escarapela({ color, lado }: { color: string; lado: number }) {
  const r = 8.6
  const dientes = Array.from({ length: DIENTES }, (_, i) => {
    const a = (i * 2 * Math.PI) / DIENTES
    const x1 = 12 + Math.cos(a) * r
    const y1 = 10 + Math.sin(a) * r
    const x2 = 12 + Math.cos(a) * (r + 2.2)
    const y2 = 10 + Math.sin(a) * (r + 2.2)
    return `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`
  }).join('')
  return (
    <Svg width={lado} height={lado} viewBox="0 0 24 24" aria-hidden>
      {/* las colas van PRIMERO: quedan detrás del disco */}
      <Path d="M9.2 17.4 7.4 23.4l2.9-1.5 2 1.5-1-5.4" fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
      <Path d="M14.8 17.4l1.8 6-2.9-1.5-2 1.5 1-5.4" fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
      <Path d={dientes} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Circle cx={12} cy={10} r={r} fill="none" stroke={color} strokeWidth={1.7} />
      <Huella color={color} x={8.6} y={6.6} escala={0.29} />
    </Svg>
  )
}

/** EL BLANCO TÁCTIL DE LA PIEZA, UNO SOLO PARA LAS DOS FAMILIAS TOCABLES.
 *
 *  La pastilla mide 22-26 de alto y un blanco de ese tamaño es de los que se
 *  fallan. El target de 44 lo pone LA PIEZA, jamás el consumidor: envolverla
 *  desde afuera deja el área táctil y el foco fuera, y el que se olvide
 *  entrega 22px como blanco.
 *
 *  `hitSlop` en vez de crecer, porque la insignia no puede engordar sin romper
 *  la fila que comparte con el nombre.
 *
 *  ⬆️ EXTRAÍDO EN S97-B al ganar su segundo usuario. Vivía inline en
 *  `distincion`; copiarlo a `estado` habría dejado dos blancos táctiles que
 *  divergen la primera vez que alguien afine uno. Nadie clona adentro de la
 *  pieza tampoco. */
const BLANCO_TACTIL = { top: 10, bottom: 10, left: 8, right: 8 } as const

export function Insignia(props: InsigniaProps) {
  const { tamaño = 'md' } = props
  const { theme } = useTheme()
  // `t` ya es el TAMAÑO en esta pieza (viene de arriba): el traductor entra
  // con su nombre entero para que no haya dos `t` en el mismo cuerpo.
  const { t: traducir } = useTraduccionUi()
  /* La etiqueta de `distincion` NO viene: se arma acá (ver el contrato).
     Para las otras dos familias sigue siendo la que pasa el consumidor —
     ahí la palabra es de dominio y la pieza no la conoce. */
  const etiqueta =
    'distincion' in props && props.distincion
      ? `${traducir('cohorte.desde')} ${props.cohorteAnio}`
      : (props as { etiqueta: string }).etiqueta
  const t = TAMAÑOS[tamaño]
  const capaTexto = 'capaText' in theme ? theme.capaText : theme.capa

  // ── DISTINCIÓN: pastilla PLENA de su capa, sin punto y sin borde de
  //    estado. Es la anatomía de `estado` (fondo propio + texto AA) con
  //    el vocabulario de `capa` — que es exactamente lo que la pieza no
  //    sabía decir hasta hoy.
  if ('distincion' in props && props.distincion) {
    const sobreMuro = props.superficie === 'muro'
    const alTocar = props.onPress
    // El muro NO sale del tema: vive en la app (`techo-oficio`). Su color
    // sí es token, así que la pieza puede resolverlo sin cruzar frontera
    // — el mismo camino que abrió `Boton` en S84-B19.
    const muro = theme.mode === 'dark' ? palette.tealDarkNoche : palette.tealDark
    const Contenedor = alTocar ? Pressable : View
    return (
      <Contenedor
        {...(alTocar
          ? {
              onPress: alTocar,
              accessibilityRole: 'button' as const,
              hitSlop: BLANCO_TACTIL,
            }
          : { accessibilityRole: 'text' as const })}
        accessibilityLabel={etiqueta}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing[1.5],
          justifyContent: 'center',
          height: t.alto,
          paddingLeft: spacing[1.5],
          paddingRight: props.soloEmblema ? spacing[1.5] : spacing[3],
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
        <Escarapela color={sobreMuro ? muro : capaTexto.comunidad} lado={t.alto - 6} />
        {props.soloEmblema ? null : (
        <Text
          style={{
            fontFamily: typography.family.sans.bold,
            fontSize: t.fontSize,
            color: sobreMuro ? muro : capaTexto.comunidad,
          }}
        >
          {etiqueta}
        </Text>
        )}
      </Contenedor>
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
  // S97-B — misma anatomía que `distincion`: el contenedor CAMBIA solo cuando
  // hay destino. Sin `onPress` no nace un control, y el rol sigue siendo
  // `text` — un lector de pantalla no anuncia un botón que no hace nada.
  const alTocarEstado = (props as { onPress?: () => void }).onPress
  const ContenedorEstado = alTocarEstado ? Pressable : View
  return (
    <ContenedorEstado
      {...(alTocarEstado
        ? { onPress: alTocarEstado, accessibilityRole: 'button' as const, hitSlop: BLANCO_TACTIL }
        : { accessibilityRole: 'text' as const })}
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
    </ContenedorEstado>
  )
}
