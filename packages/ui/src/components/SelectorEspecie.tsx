/**
 * SelectorEspecie — selección única de especie (S45-B3.1, onboarding
 * dueño). Espec cerrada por arquitecto+founder.
 *
 * ═══════════════════════════════════════════════════════════════════
 * Presentacional puro: cero fetching adentro — las opciones llegan
 * del catálogo (cat_especies post-D-287) vía la pantalla.
 * La carga NO es de este componente: la pantalla compone Esqueleto.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Grid 3×2 en teléfono (6 especies F1). Ficha = AvatarMascota
 * (especie, sin foto) + nombre en DM Sans (regla de voz: la especie
 * describe un ser vivo, jamás mono).
 *
 * Estados de la ficha:
 *   · reposo — superficie Tarjeta-like (card/elevated + borde sutil)
 *   · pressed — escala 0.99 (receta SM de Boton/Tarjeta)
 *   · seleccionada — borde 1.5 en hex PURO de capa identidad (registro
 *     gráfico; refuerzo, como el anillo de CitaEnVivo: el canal
 *     semántico AA es accessibilityState.checked + el tint) + fondo
 *     capaBg.identidad (registro de tints). NO consume accent.active.
 *   El borde es 1.5 SIEMPRE (reposo lo lleva en border.subtle): el
 *   estado cambia color, jamás mueve el layout.
 *
 * Memorial degrada solo (Ley 8): sin tinte de capa, la selección es
 * borde en text.secondary sobre la superficie de reposo.
 *
 * Accesibilidad: radiogroup con label visible; cada ficha es radio
 * con accessibilityState.checked y anuncio "Nombre, opción N de 6".
 */

import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import Animated, { cubicBezier } from 'react-native-reanimated'

import { typography } from '../tokens/typography'
import { spacing } from '../tokens/spacing'
import { radius } from '../tokens/radius'
import { motion } from '../tokens/motion'
import { useTheme } from '../ThemeProvider'
import { AvatarMascota, type AvatarMascotaEspecie } from './AvatarMascota'

export interface SelectorEspecieOpcion {
  /** Código real de cat_especies (las 6 familias F1 post-D-287). */
  codigo: AvatarMascotaEspecie
  nombre: string
  /** S91 (gate founder) — LA CARA DE LA ESPECIE. Ausente = la huella de
   *  siempre, así que la ficha no cambia para quien no la pase. */
  fotoUrl?: string
}

export interface SelectorEspecieProps {
  opciones: SelectorEspecieOpcion[]
  /** Código seleccionado; undefined = nada elegido aún. */
  seleccionada?: string
  onSelect: (codigo: AvatarMascotaEspecie) => void
  /** Label visible del grupo Y accessibilityLabel del radiogroup. */
  etiqueta: string
}

// Mismo grosor que el anillo de CitaEnVivo y el borde de Campo.
const BORDE = 1.5

function Ficha({
  opcion,
  indice,
  total,
  seleccionada,
  onSelect,
}: {
  opcion: SelectorEspecieOpcion
  indice: number
  total: number
  seleccionada: boolean
  onSelect: (codigo: AvatarMascotaEspecie) => void
}) {
  const { theme } = useTheme()
  const [presionada, setPresionada] = useState(false)

  // Superficie de reposo: la misma receta de Tarjeta plana.
  const fondoReposo = theme.mode === 'dark' ? theme.bg.elevated : theme.bg.card
  // Selección con capa solo fuera de memorial (Ley 8: memorial sin tinte,
  // borde neutral en text.secondary). Patrón `'capaBg' in theme` de AvatarMascota.
  const conCapa = seleccionada && 'capaBg' in theme
  // S81 (7bis FIRMADO — censo B #4): las especies son CATÁLOGO, siempre —
  // el reposo se RELLENA (tinte identidad SIN borde marcado, §7); la
  // elección sigue escalando por el BORDE de capa (espec S45 intacta).
  // Con 6 hermanos rige L-b: intermedio, jamás pleno. Memorial queda en
  // contorno por el mismo gate 'capaBg' in theme (sin tinta).
  // ⚠️ S91 (gate founder): EL RELLENO DEL REPOSO SE APAGA CUANDO HAY CARA.
  // El tinte de catálogo (7bis) existe para que una ficha SIN contenido no se
  // lea como un hueco. Con la foto adentro ya no hay hueco: el verde deja de
  // ser sistema y pasa a ser un velo sobre la imagen — que es exactamente lo
  // que el founder vio y llamó bug. Sin foto, la regla de 7bis sigue intacta.
  const rellenoCatalogo = !seleccionada && 'capaBg' in theme && opcion.fotoUrl === undefined

  // ⚠️ S91 (gate founder, 2ª pasada): LA ELECCIÓN SE MARCA CON EL COLOR DE
  // ELECCIÓN DE LA CASA, no con la capa de identidad.
  //
  // La tile elegida se pintaba VERDE —fondo `capaBg.identidad` y borde
  // `capa.identidad`, que es verdeVital— porque la espec S45 marcaba la
  // elección «escalando por el BORDE de capa». Eso tenía sentido cuando la
  // ficha era un catálogo sin contenido; hoy es la ÚNICA superficie de la app
  // donde elegir algo no se ve magenta, y el founder lo leyó como bug dos
  // veces seguidas. `accent.control` es lo que marca la elección en todo el
  // resto (Ley 22, `SelectorOpcion`, `FiltroPills`, la pata).
  //
  // Memorial degrada solo, como siempre: sin `capaBg` no hay tinte y la
  // señal vuelve al borde sereno (Ley 8 intacta).
  const acentoEleccion = 'control' in theme.accent ? theme.accent.control : theme.capa.identidad
  /** El TINTE de la elección — el hermano de `acentoEleccion`, resuelto
   *  con el mismo guard por la misma razón (D-813).
   *
   *  ⚠️ EL FALLBACK ES `fondoReposo` Y NO LA CAPA, y esto lo corrigió el
   *  TIPO: la primera versión caía a `theme.capaBg.comunidad` —o sea, al
   *  acoplamiento que esta cura viene a sacar, conservado como «piso»— y
   *  `tsc` lo rebotó porque memorial no tiene `capaBg`. *El compilador
   *  señaló el único tema que podía alcanzar esa rama y de paso mostró
   *  que la rama no debía existir.*
   *
   *  Este camino es INALCANZABLE hoy: el consumidor solo usa el valor
   *  bajo `conCapa`, que ya exige `'capaBg' in theme`, y los cuatro temas
   *  no-memorial portan `controlBg` (R27 lo vigila por ausencia). Es piso
   *  de tipo, no camino vivo — y si algún día se alcanza, cae en la
   *  superficie de reposo, que es honesto: sin slot no hay tinte. */
  const tinteEleccion =
    'controlBg' in theme.accent ? (theme.accent as { controlBg: string }).controlBg : fondoReposo
  const fondo = conCapa
    ? // 🔴 S98-B (D-813) · EL RELLENO SALE DEL MISMO SLOT QUE EL BORDE.
      //
      // Acá decía `theme.capaBg.comunidad`, y su comentario declaraba la
      // premisa que lo hacía parecer correcto: *«el mismo que
      // `SelectorOpcion` usa para acento="control"»*. **La premisa era
      // CIERTA** —`SelectorOpcion:238` teclea exactamente eso— y aun así
      // el resultado estaba mal: las dos piezas copiaban el mismo
      // acoplamiento. *Un error consistente entre dos piezas se lee como
      // sistema.*
      //
      // El defecto: el borde leía `accent.control` (resuelve por casa) y
      // el relleno una CAPA fija. Los temas de oficio se arman por spread
      // y pisan `accent`, jamás `capaBg` ⇒ en el prestador salía **borde
      // teal con relleno magenta**, en la app donde §15b.1 firmó que el
      // magenta vive solo en la marca.
      //
      // Ahora las dos mitades de la señal salen de la MISMA familia y
      // ninguna pantalla puede desalinearlas. El cliente no cambia un
      // píxel: el slot nace con el valor que tenía.
      tinteEleccion
    : rellenoCatalogo
      ? theme.capaBg.identidad
      : fondoReposo
  const borde = conCapa
    ? acentoEleccion
    : rellenoCatalogo
      ? 'transparent'
      : seleccionada
        ? theme.text.secondary
        : theme.border.subtle

  return (
    <Pressable
      onPress={() => onSelect(opcion.codigo)}
      onPressIn={() => setPresionada(true)}
      onPressOut={() => setPresionada(false)}
      accessibilityRole="radio"
      accessibilityState={{ checked: seleccionada }}
      accessibilityLabel={`${opcion.nombre}, opción ${indice + 1} de ${total}`}
      style={{ flexBasis: '30%', flexGrow: 1 }}
    >
      <Animated.View
        style={{
          alignItems: 'center',
          paddingVertical: spacing[4],
          paddingHorizontal: spacing[2],
          borderRadius: radius.lg,
          backgroundColor: fondo,
          borderWidth: BORDE,
          borderColor: borde,
          // misma receta que Boton/Tarjeta (SM: CSS transition + estado)
          transform: [{ scale: presionada ? 0.99 : 1 }],
          transitionProperty: 'transform',
          transitionDuration: motion.duration.fast,
          transitionTimingFunction: cubicBezier(...motion.easing.spring.bezier),
        }}
      >
        <AvatarMascota
          nombre={opcion.nombre}
          especie={opcion.codigo}
          {...(opcion.fotoUrl !== undefined ? { fotoUrl: opcion.fotoUrl } : null)}
          tamano="md"
        />
        <Text
          numberOfLines={1}
          style={{
            fontFamily: typography.family.sans.medium,
            fontSize: typography.size.sm,
            color: theme.text.primary,
            marginTop: spacing[2],
          }}
        >
          {opcion.nombre}
        </Text>
      </Animated.View>
    </Pressable>
  )
}

export function SelectorEspecie({ opciones, seleccionada, onSelect, etiqueta }: SelectorEspecieProps) {
  const { theme } = useTheme()

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={etiqueta}>
      <Text
        style={{
          fontFamily: typography.family.sans.medium,
          fontSize: typography.size.sm,
          color: theme.text.secondary,
          marginBottom: spacing[3],
        }}
      >
        {etiqueta}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] }}>
        {opciones.map((opcion, i) => (
          <Ficha
            key={opcion.codigo}
            opcion={opcion}
            indice={i}
            total={opciones.length}
            seleccionada={opcion.codigo === seleccionada}
            onSelect={onSelect}
          />
        ))}
      </View>
    </View>
  )
}
