/**
 * TarjetaEstado — la anatomía portadora de la gramática "ESTÁ / ESPERA"
 * (`DISEÑO_EXPERIENCIA` §15b.0bis, firmada en el gate global del founder
 * 26-jul-2026, dentro de Hoja del miembro + turnos + recepción).
 *
 * LA GRAMÁTICA: en las listas de estado del prestador, lo que ESTÁ
 * (adentro, activo, rigiendo) es superficie apoyada; lo que ESPERA
 * (pausado, por llegar, sin regir) es contorno. Una sola distinción
 * visual para un solo significado.
 *
 * ESTÁ:    superficie de card + `elevacion.reposo` + **1px
 *          `border.presente` EN CLARO** (S86-B, firma de mesa).
 * ESPERA:  transparente + 1px `border.default`, sin sombra — sobre el
 *          papel no es una superficie: es un contorno.
 *
 * ⏪ ESTA LÍNEA DECÍA "SIN borde — regla Chanel del marco (Ley 20):
 * borde + sombra dicen lo mismo dos veces", y se enmienda en vez de
 * corregirse en silencio. **La regla Chanel no murió: ganó su condición**
 * — el límite lo pone el CONTRASTE, no el catálogo de recursos (misma
 * firma que devolvió el hairline a `Tarjeta` en S86). El argumento viejo
 * presuponía que la sombra decía algo, y la medición lo desmintió: la
 * superficie del ESTÁ vale **1.052** contra el papel y **1.079** contra
 * el tapiz del oficio. Una sombra que separa 1.07 no está diciendo lo
 * mismo dos veces: no está diciendo nada la primera vez.
 * Los dos estados se distinguen ahora por CONTRASTE de borde
 * (1.693 vs 1.234 sobre papel) — ver el porqué completo abajo.
 *
 * POR QUÉ NO ES `Tarjeta` (declarado): `Tarjeta` fija `bg.card` como
 * fondo en TODOS sus niveles y `border.subtle` como hairline
 * (`Tarjeta.tsx:104-114`); el estado ESPERA de esta anatomía no es
 * expresable con ella. Tokens puros (Ley 1) + `usePresionado` (D-401).
 *
 * DELTA DECLARADO AL GATE, VIVO (viaja desde la Hoja del miembro, S78):
 * el founder pidió radio 14 y padding 13/14 — ninguno es token (`radius`:
 * 12·16 / `spacing`: 12·16). Se usa `radius.md` 12 y `spacing[3]` 12. Al
 * promoverse la pieza, `packages/ui` dejó de ser territorio ajeno y el
 * pedido dejó de ser cruce — pero un valor que no existe en tokens se
 * DECLARA, no se deduce: queda en la lista de gate (S83-B1).
 *
 * PROMOVIDA a `packages/ui` en S83-B1 (Ley 11: cuatro superficies vivas;
 * la nota S78 en D-535 pedía coordinarla, no hacerla de arrastre).
 */

import { type ReactNode } from 'react'
import { Pressable, View, type ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'

import { usePresionado } from './usePresionado'

import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

export type TarjetaEstadoRol = 'checkbox' | 'radio' | 'button'

export type TarjetaEstadoProps = {
  /** true = ESTÁ (superficie apoyada) · false = ESPERA (contorno). */
  encendido: boolean
  etiqueta: string
  /** AUSENTE = tarjeta ESTÁTICA (S78-B recepción): pura lectura de
   *  estado, sin Pressable — un toque que no hace nada es una promesa
   *  rota (Ley 23). Presente = la física de presión de la casa. */
  onPress?: () => void
  /** checkbox = alterna algo (la fila de servicio) · radio = elige entre
   *  pares (la persona del selector de Jornadas) · button = navega/abre
   *  (el grupo de franjas: el on/off ahí es ESTADO — activa/pausada —,
   *  no lo que el toque hace). */
  rol?: TarjetaEstadoRol
  children: ReactNode
}

export function TarjetaEstado({
  encendido,
  etiqueta,
  onPress,
  rol = 'checkbox',
  children,
}: TarjetaEstadoProps) {
  const { theme } = useTheme()
  const { handlers, estiloPresionado } = usePresionado(0.99)
  const superficie: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: radius.md,
    backgroundColor: encendido ? theme.bg.card : 'transparent',
    ...(encendido
      ? { boxShadow: theme.elevacion.reposo }
      : { borderWidth: theme.border.width, borderColor: theme.border.default }),
    // ══ S86-B · LA JERARQUÍA POR CONTRASTE DE BORDE (firma de mesa) ══
    //
    // EL DEFECTO, con su número: el ESTÁ era `bg.card` sobre el fondo con
    // la sombra como ÚNICO límite — y esa superficie mide **1.052** vs
    // papel algodón y **1.079** vs el tapiz del oficio, que es el tema
    // real del taller. Es el MISMO caso que se curó en `Tarjeta` en S86;
    // la cura no había llegado acá, y por eso el founder leyó el taller
    // como *"faltan paredes"* donde sí había superficies.
    //
    // POR QUÉ NO SE LE PUSO EL MISMO `border.default` QUE AL ESPERA, que
    // era la salida corta: **habría curado la pared gastando la señal del
    // ESTADO.** Con los dos bordes iguales, la distinción entre "está
    // adentro" y "espera" quedaba apoyada en un fondo de 1.079 más una
    // sombra — exactamente lo que acabábamos de medir como insuficiente.
    // *Curar un problema consumiendo la señal de otro no es curar.*
    //
    // ⇒ LOS DOS ESTADOS LLEVAN BORDE, Y SE SEPARAN POR CONTRASTE:
    //      ESPERA  `border.default`   1.234 (papel) · 1.212 (tapiz)
    //      ESTÁ    `border.presente`  1.693 (papel) · 1.663 (tapiz)
    //    ~1.4× — el ESTÁ se lee más marcado de un vistazo, y encima suma
    //    fondo y sombra que el ESPERA no tiene. La gramática §15b.0bis
    //    queda INTACTA: sigue habiendo una distinción visual para un solo
    //    significado; lo que cambió es que ahora las DOS se ven.
    //
    // ⚠️ SOLO EN CLARO, y no es una excepción sino la MISMA condición que
    // la enmienda de `Tarjeta`: en oscuro y memorial la separación ya la
    // hace el HALO (acá abajo), que es el canal que E11 abrió justamente
    // porque ahí la luminancia está agotada por los dos lados. Meterle un
    // borde encima al ESTÁ en oscuro sería el segundo borde que la nota
    // del halo promete que nunca va a recibir.
    //
    // Ley 20 intacta: el marco que esa ley mata es el que ENCIERRA sin
    // decir nada. Acá el borde ES el dato — dice cuál de los dos estados
    // está mirando el prestador.
    ...(encendido && theme.mode === 'light'
      ? { borderWidth: theme.border.width, borderColor: theme.border.presente }
      : null),
    // EL HALO (S82 E11, firmado) llega a esta anatomía con la MISMA
    // condición que `Tarjeta` — la elevación, y nada más: en oscuro la
    // sombra no puede separar (negro sobre negro es física) y el paso de
    // luminancia está cerrado por los dos lados. Medido acá: card/base
    // 1.037 en dark y 1.100 en memorial — el ESTÁ casi no despegaba del
    // fondo, que es la mitad de la gramática viviendo a ciegas.
    //
    // ENTRA EN "ESTÁ", JAMÁS EN "ESPERA", y no hace falta criterio nuevo
    // para lograrlo: el halo va con la elevación, y acá solo el encendido
    // la tiene. Por eso las dos gramáticas no pelean — el contorno del
    // ESPERA nunca recibe un segundo borde encima.
    //
    // Ley 20 intacta: el halo NO es el hairline de marco que esa ley
    // mata. Es DIRECCIONAL —solo arriba, donde pegaría la luz— y una
    // caja necesita cuatro lados. El ESTÁ sigue sin borde.
    ...(encendido && theme.elevacion.halo !== null
      ? { borderTopWidth: 1, borderTopColor: theme.elevacion.halo }
      : null),
  }
  if (onPress === undefined) {
    return (
      <View accessible accessibilityLabel={etiqueta} style={superficie}>
        {children}
      </View>
    )
  }
  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlers.onPressIn}
      onPressOut={handlers.onPressOut}
      accessibilityRole={rol}
      accessibilityState={rol === 'button' ? undefined : { checked: encendido }}
      accessibilityLabel={etiqueta}
    >
      <Animated.View style={[superficie, estiloPresionado]}>{children}</Animated.View>
    </Pressable>
  )
}
