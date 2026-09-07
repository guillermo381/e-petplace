/**
 * TarjetaDestinoPlata — CÓMO TE DEVOLVEMOS, SIN EMPUJARTE (S114-B, B4).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * *«Cuando hay plata para devolver, me muestran **dos tarjetas del mismo
 * tamaño, una al lado de la otra, y ninguna está preseleccionada**.»*
 * — `DIRECCION_POSTVENTA` §4.
 *
 * 🔴 **ES LA PIEZA DONDE UN DARK PATTERN ENTRARÍA SIN QUE NADIE LO NOTE**, y
 * por eso acá la simetría no se pide: **se construye.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── POR QUÉ LA PIEZA DIBUJA LAS DOS, aunque el nombre diga «tarjeta» ─────
 * **Si dibujara UNA, la simetría sería responsabilidad de quien la monta** —
 * dos llamadas, dos juegos de props, y basta que una lleve `elevacion` o un
 * `Boton primario` adentro para que el peso se desbalancee sin que ningún
 * gate lo vea. *Una ley que depende de que el consumidor la respete no está
 * puesta.*
 *
 * ⇒ la pieza recibe **las dos opciones con la MISMA forma** (`OpcionDeDevolucion`)
 * y las dibuja con **UNA sola receta de estilo**, calculada una vez. La única
 * diferencia posible entre las dos es cuál está elegida.
 *
 * ── LAS CUATRO SIMETRÍAS, Y CÓMO SE SOSTIENE CADA UNA ───────────────────
 * ```
 *   MISMO TAMAÑO …… `flex: 1` cada una + `alignItems: 'stretch'` en la fila
 *                    ⇒ la más alta manda y la otra la acompaña. Sin esto,
 *                      la que tiene la frase larga sería más grande, y en
 *                      castellano SIEMPRE es la del banco.
 *   MISMO PESO ……… una sola receta: `RECETA_TARJETA`, sin argumentos.
 *   MISMO ACENTO …… el color se resuelve UNA vez, fuera del map.
 *   MISMO ORDEN …… `[banco, saldo]`, el de la tabla de §4, y **al lado**, no
 *                    apiladas: lado a lado ninguna preside.
 * ```
 * **Ninguna rama por destino, en ningún lado.** `R73` lo mide y su rojo se
 * probó antes de cablearse.
 *
 * ── LO QUE ESTÁ PROHIBIDO Y NO SE PUEDE ESCRIBIR ────────────────────────
 * §4, literal: *«cero default oscuro, cero botón más grande, cero
 * "recomendado"»*. Acá:
 * · **no hay default de elección** — `elegido` es `DestinoPlata | null` y el
 *   consumidor está obligado a declarar el arranque, que es `null`;
 * · **no hay slot `ReactNode`** — un slot dejaría meter una insignia
 *   «recomendado» en una de las dos y la ley volvería a depender de nadie;
 * · **la rapidez del saldo se INFORMA, jamás se usa para esconder el banco**:
 *   los dos tiempos entran por el MISMO campo, así que si uno se dice el
 *   otro también. *No se puede declarar sólo el tiempo que conviene.*
 *
 * ── EL MONTO SE DICE ANTES DE ELEGIR ────────────────────────────────────
 * §4: *«el monto se dice antes de elegir, en una línea sobre las tarjetas»*,
 * y si es parcial dice por qué. **Vive acá y no en la pantalla** por la misma
 * razón que las dos tarjetas: si fuera de la pantalla podría quedar debajo,
 * o no estar. Llega **ya redactado** (Ley 3) — la pieza no formatea plata.
 *
 * ── NADA DE PUNTOS NI COMPENSACIONES ────────────────────────────────────
 * §4: *«nada de puntos, niveles ni compensaciones "de regalo". Un beneficio
 * no repara una falla: la repara la plata»* (`MODELO_LOYALTY` §3 y §7). Esta
 * pieza sólo sabe de dos destinos de PLATA — no hay tercer miembro en la
 * unión, y agregarlo es una decisión de mesa, no una prop.
 *
 * ── LOS TRES TEMAS Y REDUCE-MOTION (N15) ────────────────────────────────
 * Cero movimiento: elegir es reemplazo directo (Ley 6). El acento sale del
 * tema, así que memorial degrada solo — y la simetría no depende del tema.
 *
 * ── PUERTA ──────────────────────────────────────────────────────────────
 * La carta de la plata dentro del hilo del caso. **Entregada y no montada.**
 */
import { Pressable, View } from 'react-native'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { Texto } from './Texto'

export type DestinoPlata = 'banco' | 'saldo'

/**
 * ⚠️ **SE LLAMA `OpcionDeDevolucion` Y NO `OpcionDestino`, y no es estilo:**
 * ese nombre **YA EXISTE** en `SelectorDestinoDonacion` para *a quién va una
 * donación* (una mascota o un refugio). **Dos vocabularios distintos que se
 * llaman igual no son el mismo vocabulario** — unificarlos «por prolijidad»
 * dejaría ofrecer un refugio como destino de un reembolso. *Lo cazó el
 * compilador porque el choque fue exacto; con una letra de diferencia habrían
 * quedado los dos conviviendo y nadie se entera.*
 *
 * 🔴 LAS DOS OPCIONES TIENEN LA MISMA FORMA, Y ESO ES PARTE DE LA LEY: un
 * campo que sólo una pudiera llenar sería la asimetría por la puerta del
 * tipo.
 */
export type OpcionDeDevolucion = {
  /** «A tu banco» · «Saldo en e-PetPlace». */
  titulo: string
  /** «Vuelve a la tarjeta con la que pagaste.» */
  voz: string
  /**
   * 🔴 EL TIEMPO, DICHO. «Depende de tu banco: en promedio 15 días hábiles»
   * · «Disponible en segundos». **Obligatorio en las dos** — ver la cabecera.
   */
  tiempo: string
}

export type TarjetaDestinoPlataProps = {
  banco: OpcionDeDevolucion
  saldo: OpcionDeDevolucion
  /** 🔴 SIN DEFAULT: el arranque es `null`. Ver la cabecera. */
  elegido: DestinoPlata | null
  onElegir: (destino: DestinoPlata) => void
  /**
   * «Te devolvemos $12,00 — el total de este paseo.» Ya redactada, incluido
   * el porqué cuando es parcial (§4).
   */
  vozMonto: string
  /** `'control'` (familia) · `'oficio'` (negocio). Ley 22. */
  acento?: 'control' | 'oficio'
}

/**
 * LA RECETA — una sola, sin argumentos, para que no pueda variar entre las
 * dos. Lo único que se le suma afuera es el estado de elección.
 */
const RECETA_TARJETA = {
  flex: 1,
  gap: spacing[1],
  padding: spacing[3],
  borderRadius: radius.suave,
  minHeight: 44,
} as const

export function TarjetaDestinoPlata({
  banco,
  saldo,
  elegido,
  onElegir,
  vozMonto,
  acento = 'control',
}: TarjetaDestinoPlataProps) {
  const { theme } = useTheme()

  /* El color se resuelve UNA vez y fuera del recorrido: dos resoluciones son
     dos oportunidades de que una quede distinta. (Mismo idioma que
     `SelectorMotivo`: `controlBg` no existe en memorial.) */
  const color = acento === 'oficio' ? theme.accent.primary : theme.accent.control
  const tinte =
    acento === 'oficio'
      ? theme.accent.primaryBg
      : 'controlBg' in theme.accent
        ? (theme.accent as { controlBg: string }).controlBg
        : theme.accent.brandBg

  /* El orden es el de la tabla de §4 y son LADO A LADO: apiladas, la de
     arriba preside; al lado, ninguna. */
  const opciones: { destino: DestinoPlata; opcion: OpcionDeDevolucion }[] = [
    { destino: 'banco', opcion: banco },
    { destino: 'saldo', opcion: saldo },
  ]

  return (
    <View style={{ gap: spacing[3] }}>
      {/* EL MONTO, ARRIBA Y ANTES DE ELEGIR (§4). En `cuerpo` y no en un
          registro más grande: es el dato que ordena la decisión, no un hero
          — y agrandarlo sería empujar hacia el acto. */}
      <Texto variante="cuerpo">{vozMonto}</Texto>

      {/* `stretch` es lo que iguala el alto: sin él manda el contenido y la
          del banco —que en castellano siempre dice más— sería la grande. */}
      <View
        accessibilityRole="radiogroup"
        style={{ flexDirection: 'row', alignItems: 'stretch', gap: spacing[3] }}
      >
        {opciones.map(({ destino, opcion }) => {
          const puesta = elegido === destino
          return (
            <Pressable
              key={destino}
              onPress={() => onElegir(destino)}
              accessibilityRole="radio"
              accessibilityState={{ selected: puesta }}
              accessibilityLabel={`${opcion.titulo}. ${opcion.voz} ${opcion.tiempo}`}
              style={{
                ...RECETA_TARJETA,
                // Ley 22 — TONAL entre pares. Lo único que distingue a una de
                // la otra es estar elegida, y eso lo decide quien toca.
                borderWidth: puesta ? 1.5 : theme.border.width,
                borderColor: puesta ? color : theme.border.default,
                backgroundColor: puesta ? tinte : 'transparent',
              }}
            >
              <Texto variante="enfasis">{opcion.titulo}</Texto>
              <Texto variante="apoyo">{opcion.voz}</Texto>
              {/* EL TIEMPO, en la misma variante en las dos: decir uno en
                  apoyo y el otro en dato haría que uno pareciera más firme.

                  🔴 **`secondary` Y NO `tertiary`, Y LO DECIDIÓ UNA MEDICIÓN.**
                  La primera versión lo apagaba a terciario para que recediera
                  frente a la voz, y el gate de contraste lo tumbó en los
                  CUATRO temas medidos:
                  ```
                  text.tertiary / accent.controlBg ⊕ card
                    light 2,11 · dark 3,22 · light·oficio 2,20 · dark·oficio 3,08
                                                          (piso de TEXTO: 4,5)
                  text.secondary, el mismo par …… 4,84 · 7,18 · 5,04 · 6,18 ✅
                  ```
                  **Y no era un detalle de accesibilidad: era la simetría de
                  §4 rompiéndose por el lado que nadie mira.** El tiempo del
                  banco es la frase larga; si el tiempo se apaga, el que
                  pierde legibilidad es justo el que la letra puso ahí para
                  que la opción lenta no quede escondida. *Un dark pattern no
                  necesita un botón más grande: alcanza con que un dato pese
                  menos de lo que dice el papel.* */}
              <Texto variante="apoyo">{opcion.tiempo}</Texto>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
