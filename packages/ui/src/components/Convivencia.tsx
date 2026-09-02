/**
 * Convivencia — CON QUIÉN PUEDE VIVIR, Y CON QUIÉN TODAVÍA NO SE SABE (S111-B).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **LO NO CONOCIDO SE RESPETA COMO NO CONOCIDO, JAMÁS COMO DATO FALTANTE.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * `LETRA_ADOPCION` §3, literal: *«Convivencia: TRES estados, jamás dos — sí ·
 * no · todavía no se sabe. Un refugio que rescató hace seis días no sabe cómo
 * reacciona con gatos, y volcar eso en un "no" le cuesta el hogar.»*
 *
 * Ésa es la regla que ordena la pieza entera, y el costo de romperla está
 * escrito en la letra: **un «no» inventado le cuesta el hogar a un animal.**
 * Por eso el tercer estado no es la ausencia de los otros dos — es un estado
 * con su propia voz, que OCUPA su lugar en la fila.
 *
 * ── 🔴 EL ESTADO MALO ES INEXPRESABLE, NO «PROHIBIDO» (L-222) ─────────────
 * La regla no vive en la disciplina de quien consume la pieza: vive en el
 * TIPO. `ConvivenciaCon` es una unión discriminada y **`no_se_sabe` lleva su
 * `voz` OBLIGATORIA**:
 *
 * · `{ con, estado: 'si' }`          — sin voz propia: la dice `voces.si`.
 * · `{ con, estado: 'no' }`          — ídem, `voces.no`.
 * · `{ con, estado: 'no_se_sabe', voz }` — **`voz` es OBLIGATORIA.**
 *
 * ⇒ **«todavía no se sabe, mudo» no compila.** No alcanza con que nadie lo
 * pase: hace falta que no se pueda — el mismo movimiento con el que
 * `SemaforoSanitario` no admite «falta sin camino» y `SelectorDestinoItem` no
 * admite «donación para Thor». *Un comentario no frena a un compilador
 * (L-396); y acá el comentario habría protegido justo el caso que la letra
 * dice que cuesta un hogar.*
 *
 * Y no hay estado implícito: **la fila que no se pasa, no se dibuja.** No
 * existe un cuarto valor «sin dato» — si el refugio no midió la convivencia
 * con gatos, la pantalla decide entre no listar «gatos» o listarlo con
 * `no_se_sabe`. Las dos son verdad; un hueco gris no lo sería.
 *
 * ── 🔴 LA DECISIÓN DE COLOR, DECLARADA: ESTO NO USA LA PALETA DE ESTADO ───
 * Ni `status.success` ni `status.danger` entran acá, y no es omisión.
 * **Un «no» es un hecho del animal, no un defecto suyo.** Un gato que no
 * convive con perros no está fallando ninguna validación: está siendo un
 * gato. Pintar ese hecho de rojo es la interfaz editorializando en contra
 * del animal — exactamente el daño que §3 nombra cuando prohíbe el «no»
 * inventado, sólo que por el canal del color en vez del dato.
 *
 * Lo que distingue los tres estados es ESTRUCTURA, no juicio:
 * · `si`          → punto RELLENO en `capa.comunidad` (adopción es COMUNIDAD
 *                   — ley 10 de `DIRECCION_ARTE`; el token resuelve pink en
 *                   claro y oscuro, y rose en memorial, sin hex a mano).
 * · `no`          → punto CONTORNEADO. Presente, sin peso. No condenado.
 * · `no_se_sabe`  → SIN punto, y la voz ocupa el lugar. La ausencia de marca
 *                   es la marca: no hay nada medido que marcar.
 *
 * ── 🔴 ENMIENDA S112-B · LA TARJETA DE TODO-DESCONOCIDO (el rescate de seis
 *    días) SE LEÍA COMO FICHA ROTA, Y EL DEFECTO ERA DE CARDINALIDAD ───────
 * **Medido sobre el render, no opinado.** Con UNA fila `no_se_sabe` entre
 * medidas, la ausencia de punto se lee perfecto: hay contra qué contrastarla.
 * **Con TODAS las filas en `no_se_sabe` no queda contra qué**, y el resultado
 * era estrictamente MENOS que cualquier otra tarjeta en los tres canales a la
 * vez: cero puntos en toda la columna · cero `primary` · y ningún enunciado
 * propio. *Una tarjeta que sólo se define por lo que le falta se lee rota* —
 * y es exactamente la tarjeta del refugio que rescató hace seis días: la que
 * §3 dice que cuesta un hogar.
 *
 * **La ley que lo explica ya estaba escrita, en otra ley:** N23 la nombró al
 * pasar —*un elemento correcto en su tamaño puede ser incorrecto en su
 * repetición*—. Acá es literal: la regla «la ausencia de marca es la marca»
 * es CORRECTA por fila y FALSA por bloque. Por eso la cura no toca la fila:
 * **toca el bloque**, que es donde vive el defecto.
 *
 * ⇒ **La pieza tiene DOS FORMAS y elige mirando TODAS sus filas:**
 *   · `medida`      → lo de siempre, sin un píxel de cambio.
 *   · `sin_observar`→ gana **título propio** (`voces.sinObservar`) y sus voces
 *     suben a `primary`, el mismo peso que tiene un «sí». **No se colapsa a
 *     un enunciado único**, y es decisión: colapsar habría borrado la voz de
 *     la fila que dice algo distinto (*«aún no lo vimos con chicos»* no es
 *     *«todavía no se sabe»*), que es justo el dato que esta pieza existe
 *     para respetar.
 *
 * **`voces.sinObservar` es OBLIGATORIA aunque muchas pantallas no lleguen a
 * usarla**, por el mismo criterio con el que `voces.si` ya lo es en una
 * tarjeta que no tiene ningún «sí»: *el estado que cuesta un hogar no puede
 * depender de que alguien se acuerde de pasar una prop.*
 *
 * ── CERO DICCIONARIO DE ESTADOS ADENTRO (precedente `EscaleraEstados`) ────
 * Las palabras llegan por prop. La pieza no sabe decir «Sí» ni en español ni
 * en inglés, y es deliberado: la voz es de cada casa y el riel de i18n vive
 * en las apps (Ley 3). Un diccionario acá adentro obligaría a toda superficie
 * futura a hablar igual, y una voz no se deduplica.
 *
 * ── LO QUE NO HACE, y es una decisión ─────────────────────────────────────
 * **No cuenta, no puntúa, no ordena.** No dice «convive con 2 de 3». Un
 * animal no es un porcentaje de compatibilidad, y un score visible es
 * exactamente lo que `LETRA_ADOPCION` §10.8 corta («sin score de match
 * visible»). Ordenar o filtrar la lista es trabajo de la PANTALLA — y su
 * regla también es de la letra §4: *filtrar no borra al que no se midió.*
 *
 * ── ESCALERA (§4b de DISEÑO_EXPERIENCIA) ──────────────────────────────────
 * Peldaño 0: el refugio no midió nada ⇒ la pantalla no monta la pieza (no
 * hay estado vacío decorativo). Peldaño 1: filas con `no_se_sabe` — la pieza
 * dice honestamente que falta observación. Peldaño 2: filas confirmadas.
 * **La pieza se ve igual en los tres: lo que sube es el DATO, no la forma.**
 *
 * Sin animación (Ley 6/13). Memorial degrada por token, no por rama.
 */
import { View } from 'react-native'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { Texto } from './Texto'

/**
 * LOS TRES ESTADOS, ESCRITOS UNA SOLA VEZ PARA LAS DOS CARAS.
 *
 * Vive acá —en la pieza que LEE— y lo importa la que ESCRIBE
 * (`ConvivenciaInput`), no al revés: el vocabulario es del dominio, y la
 * cara de lectura es la que ya lo tenía. *Dos listas de estados que hay que
 * acordarse de mantener iguales es exactamente cómo nace el cuarto estado
 * que una cara dibuja y la otra no.*
 *
 * ⚠️ **QUÉ ROMPE SI NACE UN CUARTO, y qué NO — dicho para que nadie lea de
 * más en este tipo (`L-459`):** `ConvivenciaInput` pide sus voces como
 * `Record<EstadoConvivencia, string>`, así que **un estado nuevo rompe TODA
 * pantalla que monte el input** y obliga a darle voz ahí donde se decide.
 * Lo que **no** rompe solo: la unión `ConvivenciaCon` de abajo y el `ORDEN`
 * del input siguen listando los tres a mano — un cuarto estado quedaría sin
 * fila y sin botón, en silencio. *Son dos líneas, y están nombradas.*
 */
export type EstadoConvivencia = 'si' | 'no' | 'no_se_sabe'

/** Una fila: con quién, y en qué estado está esa convivencia. */
export type ConvivenciaCon =
  | { con: string; estado: 'si' }
  | { con: string; estado: 'no' }
  /** 🔴 `voz` OBLIGATORIA: el tercer estado sin voz no compila. */
  | { con: string; estado: 'no_se_sabe'; voz: string }

export type ConvivenciaProps = {
  /** Las filas, en el orden en que la pantalla las quiera. */
  filas: ConvivenciaCon[]
  /**
   * Las palabras de `si` y `no`. OBLIGATORIAS: la pieza no trae diccionario
   * (precedente `EscaleraEstados`). La voz de `no_se_sabe` viaja por fila.
   *
   * `sinObservar` es el TÍTULO PROPIO del bloque cuando NINGUNA convivencia
   * fue observada todavía — el caso del rescate de seis días. Va en voz de
   * la casa y en presente: lo que pasa es que **lo están conociendo**, no
   * que falte un dato. Ej.: «Todavía lo están conociendo».
   */
  voces: { si: string; no: string; sinObservar: string }
  /** Rótulo de sección, opcional. */
  rotulo?: string
}

const PUNTO = 8

export function Convivencia({ filas, voces, rotulo }: ConvivenciaProps) {
  const { theme } = useTheme()

  /* LA FORMA SE DECIDE MIRANDO TODAS LAS FILAS, no cada una — el defecto que
   * cura era de cardinalidad (ver la enmienda S112-B arriba). Con la lista
   * vacía NO rige: sin filas no hay nada que enunciar, y la pantalla no debe
   * montar la pieza (peldaño 0 de la escalera). */
  const sinObservar =
    filas.length > 0 && filas.every((f) => f.estado === 'no_se_sabe')

  return (
    <View style={{ gap: spacing[2] }}>
      {rotulo === undefined ? null : <Texto variante="seccion">{rotulo}</Texto>}

      {/* EL TÍTULO PROPIO. Va en `cuerpo`/`primary`: el mismo peso con el que
          esta pieza dice un «sí», que es lo que lo saca del gris de vacío.
          No es un `EstadoVacio` y no debe parecerlo — acá no falta nada:
          está pasando algo, y es que todavía lo están conociendo. */}
      {sinObservar ? <Texto variante="cuerpo">{voces.sinObservar}</Texto> : null}

      <View style={{ gap: spacing[2] }}>
        {filas.map((fila) => {
          // La voz y la marca se derivan del estado — jamás se pasan sueltas,
          // que es lo que permitiría un «sí» dibujado como «no se sabe».
          const voz = fila.estado === 'no_se_sabe' ? fila.voz : voces[fila.estado]

          return (
            <View
              key={fila.con}
              accessibilityRole="text"
              accessibilityLabel={`${fila.con}: ${voz}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: spacing[3],
              }}
            >
              <Texto variante="cuerpo">{fila.con}</Texto>

              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}
                importantForAccessibility="no-hide-descendants"
              >
                {/* El tercer estado NO lleva punto: no hay nada medido que marcar. */}
                {fila.estado === 'no_se_sabe' ? null : (
                  <View
                    style={{
                      width: PUNTO,
                      height: PUNTO,
                      borderRadius: radius.full,
                      backgroundColor:
                        fila.estado === 'si' ? theme.capa.comunidad : 'transparent',
                      borderWidth: fila.estado === 'no' ? 1 : 0,
                      borderColor: theme.border.default,
                    }}
                  />
                )}
                <Texto
                  variante="apoyo"
                  /* `si` manda; `no` acompaña. Y en la tarjeta SIN OBSERVAR
                     mandan todas: ahí la voz no es el complemento de un dato
                     — es EL dato, y en `secondary` se leía como hueco. */
                  color={fila.estado === 'si' || sinObservar ? 'primary' : 'secondary'}
                >
                  {voz}
                </Texto>
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )
}
