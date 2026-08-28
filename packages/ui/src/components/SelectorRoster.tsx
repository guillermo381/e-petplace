/**
 * SelectorRoster — QUIÉNES SALEN EN ESTA FOTO (S107-B).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **ARRANCA SIN NADIE SELECCIONADO, Y ESA ES LA DECISIÓN MÁS CARA.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * *Etiquetar de más rompe más que etiquetar de menos.* Una foto que llega a
 * una familia con su perro marcado cuando su perro no estaba ahí no es un
 * error de metadatos: **es la prueba de que el hilo no dice la verdad**, y a
 * partir de ahí ninguna foto vale. Etiquetar de menos cuesta una foto que
 * alguien no recibe; etiquetar de más cuesta la credibilidad de todas.
 *
 * ⇒ **`seleccionadas` NO tiene default.** El consumidor está obligado a
 * declarar el arranque, y el arranque correcto es `[]`. *No se preselecciona
 * «están todos» por comodidad: ese atajo existe, tiene su botón, y es un ACTO
 * — no un estado por omisión.*
 *
 * ── LEY 11: EL CENSO, Y POR QUÉ NO SE COMPONE `SelectorOpcion` ────────────
 * Relevado antes de crear (protocolo 1c, pregunta 2). **`SelectorOpcion` llega
 * muy cerca**: tiene `multiple`, tiene `entidad` con `avatar`, tiene
 * `disposicion="grilla"`. Es el candidato obvio y **se descartó por una razón
 * concreta, no por gusto**:
 *
 * · En `entidad` su señal de selección es **el RELLENO** (`controlLleno`,
 *   firmado por el founder en S73). El relleno dice *«éste está elegido»* —
 *   pero **no dice «podés elegir varios»**, y eso hay que saberlo ANTES de
 *   tocar. En una rejilla de caras sin afordancia de multi-selección, la
 *   lectura por defecto es «elegí uno».
 * · Meterle a `SelectorOpcion` un slot para esa afordancia es **cambiarle la
 *   anatomía a una pieza congelada que montan ~20 pantallas** — el precedente
 *   exacto de `FilaDato` en S71: *«se decidió NO meter una prop al pasar en un
 *   componente recién congelado»*.
 *
 * ⚠️ **Y esto NO es un segundo signo para el mismo estado (Chanel, Ley 16):**
 * la casilla vacía es **AFORDANCIA** (qué se puede hacer, visible sin tocar) y
 * el relleno es **ESTADO** (qué está hecho). Son dos cosas distintas y por eso
 * conviven. *Si la casilla solo apareciera al seleccionar, entonces sí sería
 * el mismo signo dos veces y habría que sacarla.*
 *
 * Lo que SÍ se reusa de `SelectorOpcion`, sin reimplementar: **`AvatarMascota`**
 * (que ya resuelve foto → cara de raza → cara de especie → huella) y su
 * **receta de color** (`accent.control` / `capaBg.comunidad` con el mismo guard
 * de memorial). *Se copia la receta, jamás el color a mano.*
 *
 * ── 🔴 EL MÍNIMO DE UNO NO SE VALIDA ACÁ, Y SE DICE POR QUÉ ───────────────
 * **Esta pieza no valida** — precedente literal de `Casilla`: *«lo OBLIGATORIO
 * / OPCIONAL lo decide la PANTALLA: este control no valida»*. El mínimo de 1
 * es una condición **de publicar**, y publicar no ocurre acá: la pantalla
 * gatea su botón con `seleccionadas.length > 0`.
 *
 * *Meterlo adentro sería peor de lo que parece:* la pieza tendría que impedir
 * deseleccionar al último, y un control que se niega a soltar lo que el dedo
 * pidió soltar se lee como que está roto. **La restricción vive donde vive su
 * consecuencia.**
 *
 * ── «ESTÁN TODOS» ES UN ATAJO, NO UN ESTADO ──────────────────────────────
 * Es un botón que **hace** (selecciona a todos), no un interruptor que queda
 * prendido. Por eso no se apaga solo ni se re-dibuja como activo cuando todos
 * están marcados: *si fuera un estado, deseleccionar uno tendría que
 * «apagarlo», y ahí ya son dos controles discutiendo por la misma verdad.*
 * Cuando ya están todos, **se deshabilita sereno** (Ley 22: apagado jamás dice
 * error) — no desaparece, porque un control que aparece y desaparece obliga a
 * buscarlo.
 *
 * ── EL MOVIMIENTO (Ley 6 · tokens N10) ────────────────────────────────────
 * La casilla entra con **`duration.micro` (150)** y la curva `spring` de la
 * casa — *«resorte suave»*, que es exactamente el caso que la Ley 6 permite:
 * **spring SOLO como confirmación física**, y marcar a alguien lo es.
 * 🔴 **Cero milisegundos sueltos** (enmienda ① de la videoconsulta: la mesa ya
 * pagó ese error). **Nada pulsa, nada late**: no hay loop en ninguna parte.
 *
 * **MEMORIAL Y REDUCE-MOTION COMPARTEN BRAZO** (`R41`, receta firmada — el par
 * que `Destape` ya usa): se les quita **el VIAJE, no el momento**. El check
 * sigue apareciendo con el mismo fade y el mismo tempo; lo que no hace es
 * escalar. *Quien pide menos movimiento lo pide por un síntoma, no por gusto,
 * y dejarlo sin confirmación de que marcó sería curarle el mareo quitándole la
 * respuesta.* **Lo cazó el gate, no una revisión**: la primera versión miraba
 * solo memorial.
 *
 * ── ESCALERA (§4b) ────────────────────────────────────────────────────────
 * **Peldaño 0** — sin roster la pieza no se monta (regla de existencia).
 * **Peldaño 1** — las caras con nombre. **Peldaño 2** — la foto real de cada
 * animal, que ya resuelve `AvatarMascota`. Muestra identidad del expediente
 * (nombre y foto), nada clínico.
 */

import { Pressable, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'

import { motion } from '../tokens/motion'
import { palette } from '../tokens/palette'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { AvatarMascota } from './AvatarMascota'
import { Boton } from './Boton'
import { Texto } from './Texto'

export type MiembroDelRoster = {
  /** Identidad estable. Jamás se muestra. */
  clave: string
  /** El nombre, tal cual lo escribió la familia. */
  nombre: string
  /** Ya resuelta por la pantalla (URL firmada). Sin ella, la huella digna. */
  fotoUrl?: string
}

export type SelectorRosterProps = {
  /** El roster del día. Vacío = la pieza no se monta. */
  miembros: MiembroDelRoster[]
  /**
   * 🔴 **SIN DEFAULT, a propósito.** El consumidor declara el arranque, y el
   * arranque correcto es `[]` — ver el encabezado.
   */
  seleccionadas: string[]
  onCambiar: (claves: string[]) => void
  /** Rótulo del grupo, en voz de la app. */
  rotulo?: string
  /**
   * La etiqueta del atajo, en voz de la app: «Están todos».
   * Ausente = el atajo no se dibuja (un roster de 2 no lo necesita).
   * 🔴 Por prop como todo texto de esta pieza — el perímetro de la tanda.
   */
  etiquetaTodos?: string
}

const COLUMNAS = 3

/** La casilla: afordancia cuando está vacía, estado cuando está marcada.
 *
 *  🔴 `quieto` COMPARTE BRAZO ENTRE MEMORIAL Y REDUCE-MOTION, que es la receta
 *  firmada de la casa (`R41`, y el par que `Destape` y `PuertaDeOficio` ya
 *  usan). **Quien pide menos movimiento lo pide por un síntoma, no por gusto**
 *  — así que no se le quita el momento, se le quita el VIAJE: el check sigue
 *  apareciendo, con el mismo escalón, sin escala.
 *
 *  ⚠️ El hook se llama SUELTO arriba y se combina después: `memorial ||
 *  useReducedMotion()` sería una llamada condicional a un hook. */
function Casillero({ marcado, quieto }: { marcado: boolean; quieto: boolean }) {
  const { theme } = useTheme()
  const lado = spacing[5]

  const estilo = useAnimatedStyle(() => ({
    /* La opacidad SÍ se anima en los tres casos —un fade no es viaje— y con
       el MISMO tempo: lo que cambia es que el quieto no escala. */
    opacity: withTiming(marcado ? 1 : 0, {
      duration: motion.duration.micro,
      easing: Easing.bezier(...motion.easing.spring.bezier),
    }),
    transform: [
      {
        scale: quieto
          ? 1
          : withTiming(marcado ? 1 : 0.6, {
              duration: motion.duration.micro,
              easing: Easing.bezier(...motion.easing.spring.bezier),
            }),
      },
    ],
  }))

  return (
    <View
      style={{
        width: lado,
        height: lado,
        borderRadius: radius.full,
        borderWidth: 1.5,
        borderColor: marcado ? theme.accent.control : theme.border.default,
        backgroundColor: marcado ? theme.accent.control : theme.bg.card,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* EL CHECK ES LA RECETA EXACTA DE `Casilla`, no una versión parecida:
          mismo path, mismo trazo, y **el papel constante en los tres temas**
          (Ley 22 — sobre un fill de acento el contenido va en papel). Copiar
          la receta y no el color a mano es lo que evita que dentro de dos
          meses haya dos checks distintos en la misma app. */}
      <Animated.View style={estilo}>
        <Svg width={14} height={14} viewBox="0 0 14 14">
          <Path
            d="M2.5 7.5 L5.5 10.5 L11.5 3.5"
            stroke={palette.white}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </Animated.View>
    </View>
  )
}

export function SelectorRoster({
  miembros,
  seleccionadas,
  onCambiar,
  rotulo,
  etiquetaTodos,
}: SelectorRosterProps) {
  const { theme } = useTheme()
  /* El hook, SUELTO y siempre llamado — ver la nota de `Casillero`. */
  const reduceMotion = useReducedMotion()
  const quieto = theme.mode === 'memorial' || reduceMotion

  /* REGLA DE EXISTENCIA: sin roster no hay a quién elegir. */
  if (miembros.length === 0) return null

  const marcadas = new Set(seleccionadas)
  const todosMarcados = miembros.every((m) => marcadas.has(m.clave))

  const alternar = (clave: string) => {
    const proxima = new Set(marcadas)
    if (proxima.has(clave)) proxima.delete(clave)
    else proxima.add(clave)
    /* Se devuelve EN EL ORDEN DEL ROSTER y no en el de los toques: dos
       pantallas que reciban la misma selección tienen que poder compararla. */
    onCambiar(miembros.filter((m) => proxima.has(m.clave)).map((m) => m.clave))
  }

  return (
    <View style={{ gap: spacing[3] }}>
      {rotulo === undefined ? null : <Texto variante="seccion">{rotulo}</Texto>}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {miembros.map((m) => {
          const marcado = marcadas.has(m.clave)

          return (
            <View
              key={m.clave}
              style={{ width: `${100 / COLUMNAS}%`, padding: spacing[1] }}
            >
              <Pressable
                onPress={() => alternar(m.clave)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: marcado }}
                accessibilityLabel={m.nombre}
                style={({ pressed }) => ({
                  alignItems: 'center',
                  gap: spacing[1.5],
                  paddingVertical: spacing[3],
                  paddingHorizontal: spacing[2],
                  minHeight: 44,
                  borderRadius: radius.suave,
                  borderWidth: theme.border.width,
                  borderColor: marcado ? theme.accent.control : 'transparent',
                  /* TONAL para el marcado (Ley 22), con el MISMO guard de
                     memorial que `SelectorVentana`: memorial no tiene `capaBg`
                     y degrada a superficie sin tinte (Ley 8). */
                  backgroundColor: marcado
                    ? 'capaBg' in theme
                      ? theme.capaBg.comunidad
                      : theme.bg.overlay
                    : pressed
                      ? theme.bg.overlay
                      : 'transparent',
                })}
              >
                <View>
                  <AvatarMascota nombre={m.nombre} fotoUrl={m.fotoUrl} tamano="sm" />

                  {/* La casilla se apoya en el borde del avatar. `pointerEvents`
                      none: el toque es de la ficha entera, no de la casilla —
                      dos blancos táctiles para el mismo acto es cómo se falla
                      un tap. */}
                  <View
                    pointerEvents="none"
                    style={{ position: 'absolute', right: -spacing[1], bottom: -spacing[1] }}
                  >
                    <Casillero marcado={marcado} quieto={quieto} />
                  </View>
                </View>

                {/* El nombre lo escribió un humano (Ley 3): DM Sans. Una línea
                    — el roster es una rejilla y un nombre largo que envuelve
                    desalinea la fila entera. */}
                <Texto variante="apoyo" numberOfLines={1} centrado>
                  {m.nombre}
                </Texto>
              </Pressable>
            </View>
          )
        })}
      </View>

      {/* EL ATAJO. Deshabilitado sereno cuando ya están todos — ver el
          encabezado: no desaparece, porque un control que aparece y
          desaparece obliga a buscarlo. */}
      {etiquetaTodos === undefined ? null : (
        /* `secundario` y NO `compacto`: **`compacto` está JUBILADA** y `R47`
           la vigila con `ui: 0` — una pieza nueva que la monte revive una
           variante que la casa está apagando (baseline solo-baja, muere en 0).
           El atajo es una acción secundaria tonal, que es exactamente lo que
           `secundario` es. */
        <Boton
          variante="secundario"
          etiqueta={etiquetaTodos}
          deshabilitado={todosMarcados}
          onPress={() => onCambiar(miembros.map((m) => m.clave))}
        />
      )}
    </View>
  )
}
