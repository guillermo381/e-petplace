/**
 * BurbujaMensaje — DE QUIÉN ES, no cuánto importa (S112-B, B3).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **NO EXISTE «LEÍDO», Y NO SE PUEDE AGREGAR DESDE AFUERA.**
 * ═══════════════════════════════════════════════════════════════════════════
 * `EstadoMensaje` tiene tres miembros y ninguno es `'leido'`. *El motor no lo
 * sabe y no se inventa* (§2.3, literal). Un doble check que no mide nada le
 * dice a una familia que el refugio leyó su postulación cuando nadie lo sabe
 * — **y en esta conversación esa mentira cambia lo que la persona hace
 * después**: esperar, o volver a escribir.
 *
 * ── 🔴 EL ESTADO ES DE LOS MÍOS, Y ES INEXPRESABLE EN LOS AJENOS ─────────
 * La unión discrimina por `mio`: la rama `false` lleva `estado?: never`. *De
 * un mensaje que me llegó no puedo saber si «se envió» — llegó, que es otra
 * cosa*, y ofrecer ese campo invitaría a llenarlo con el estado de otra cosa.
 *
 * Y `no_se_envio` **exige `onReintentar`**: un fallo sin salida es el estado
 * más caro de la pieza — la persona escribió, cree que mandó, y no mandó.
 *
 * ── N23 · EL COLOR MARCA DE QUIÉN ES ─────────────────────────────────────
 * Míos a la derecha sobre `accent.brandBg`; del otro a la izquierda sobre
 * `bg.card`. **Es clase, no importancia**, que es exactamente lo que N23
 * permite. Y el tinte de marca **se resuelve por casa en el tema**, así que
 * la misma pieza habla el color de cada app sin una segunda pieza ni una
 * prop de app.
 *
 * ⚠️ **El «no se envió» va en el color de clase de la casa, JAMÁS en rojo de
 * alarma.** No es un error de quien escribió — es el estado de ese mensaje —
 * y es la misma doctrina con la que un código de firma vencido no se pinta
 * de rojo. Lo dice el texto, no el color.
 *
 * ── EL AGRUPADO, y por qué la hora la decide la pieza ────────────────────
 * La pantalla dice **dónde cae** cada mensaje en su grupo (ella tiene la
 * lista y los minutos); la pieza decide **qué se dibuja** con eso: el nombre
 * sólo en el primero, la hora sólo en el último, y los radios que cierran el
 * grupo como un bloque.
 *
 * 🔴 **La `hora` se pasa SIEMPRE y la pieza la calla donde no va.** Si la
 * pantalla eligiera cuándo pasarla, la regla *«la hora va bajo el último del
 * grupo»* viviría repetida en cada consumidor, y basta que uno la escriba al
 * revés para que un grupo tenga cuatro horas.
 *
 * ── 🔴 EL TERCER ASIENTO — LA CASA (S114-B, B7) ──────────────────────────
 * `DIRECCION_POSTVENTA` §3.3: *«Tres asientos. Los míos a la derecha; el
 * prestador y la casa a la izquierda, **cada uno con su cara y su nombre** —
 * "e-PetPlace" con el logo, el paseador con su foto.»*
 *
 * ⇒ la rama AJENA gana **`cara`**, un slot que se dibuja **junto al primer
 * mensaje del grupo** y cuya columna queda reservada para el resto, para que
 * las burbujas del grupo no se escalonen. La variante «casa» es montar ahí
 * `LogoNegocio` en vez de la foto de una persona.
 *
 * 🔴 **`cara` VIVE SÓLO EN LA RAMA AJENA, y eso cierra un invariante:** la
 * casa **no puede hablar desde la derecha**. `mio: true` + `cara` no compila.
 * *Un asiento se define por dónde se sienta; si la pieza dejara poner la cara
 * de e-PetPlace a la derecha, el color dejaría de marcar de quién es.*
 *
 * ── ⚠️ Y LA SUPERFICIE DE LA CASA **NO** ES UN TERCER COLOR, POR MEDICIÓN ─
 * La salida obvia era darle a la casa su propio fondo. **Se midió en los tres
 * temas antes de decidir, y no se puede:**
 * ```
 *   memorial → bg.card, bg.elevated, bg.overlay y bg.hundido son EL MISMO
 *              color (`memorialDark1`).
 * ```
 * ⇒ **cualquier tercera superficie colapsa contra la del prestador en
 * memorial.** Una distinción que existe en dos temas de tres no es una
 * distinción: es un defecto que aparece en el tema donde menos se lo mira.
 * *Lo que separa los tres asientos es la CARA y el NOMBRE —que es literal lo
 * que §3.3 pide— y el color sigue diciendo sólo míos/ajenos.*
 *
 * ── SIN «VER MÁS» ────────────────────────────────────────────────────────
 * *«Un mensaje largo se lee entero»* (§2.3). No hay `numberOfLines`: plegar
 * un mensaje de una conversación de adopción esconde justo lo que alguien se
 * tomó el trabajo de explicar.
 *
 * Sin animación de entrada (N15).
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * El hilo en las dos apps (C3). **Entregada y no montada.**
 */
import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { Texto } from './Texto'

/**
 * Los TRES estados que el motor puede sostener. **`'leido'` no está y no es
 * un olvido** — ver la primera nota de la cabecera.
 */
export type EstadoMensaje = 'enviando' | 'enviado' | 'no_se_envio'

/** Dónde cae el mensaje dentro de su grupo. Lo calcula la pantalla. */
export type PosicionEnGrupo = 'solo' | 'primero' | 'medio' | 'ultimo'

type Comun = {
  texto: string
  /**
   * **Siempre**, aunque no se dibuje: la pieza la calla donde no va. Ya
   * redactada por el riel («14:32»).
   */
  hora: string
  posicion?: PosicionEnGrupo
  /** El nombre de quien escribe. Se dibuja SÓLO en el primero del grupo. */
  autor?: string
}

type Mio = Comun & {
  mio: true
  estado: EstadoMensaje
  /**
   * 🔴 OBLIGATORIA con `no_se_envio`, y el tipo lo exige abajo: un fallo sin
   * salida deja a la persona creyendo que mandó algo que no mandó.
   */
  onReintentar?: () => void
  /**
   * La línea ENTERA del fallo, ya redactada: «No se envió · Reintentar»
   * (§2.3). **No es sólo la palabra del botón** — el estado y su salida se
   * leen juntos, y separarlos dejaría el estado sin decir o el botón sin
   * decir de qué.
   */
  vozReintentar?: string
}

type Ajeno = Comun & {
  mio: false
  /**
   * 🔴 LA CARA DEL QUE HABLA — sólo del lado ajeno (ver la cabecera). Se
   * dibuja en el PRIMERO del grupo y su columna queda reservada en el resto.
   *
   * Entra por slot y no por `fotoUrl`: del otro lado puede haber **una
   * persona** (`AvatarMascota` / su foto) o **la casa** (`LogoNegocio` con su
   * monograma), y son dos piezas distintas con dos fallbacks distintos. *Una
   * prop de URL obligaría a esta pieza a elegir cuál de las dos monta, y a
   * saber cuándo el que habla es una organización.*
   *
   * **El tamaño sale de `CARA_EN_HILO`**, que se exporta justo para eso: dos
   * números que deben coincidir —el ancho de la columna y el de la cara— no
   * salen de dos cuentas distintas (L-284).
   *
   * Ausente = la burbuja se dibuja como siempre, sin columna. *Por eso los
   * dos hilos de adopción no cambian un píxel.*
   */
  cara?: ReactNode
  estado?: never
  onReintentar?: never
  vozReintentar?: never
}

/**
 * 🔴 La rama del fallo exige su salida Y su palabra: sin las dos, el estado
 * `no_se_envio` no compila.
 */
export type BurbujaMensajeProps =
  | Ajeno
  | (Mio & { estado: 'enviando' | 'enviado'; onReintentar?: never; vozReintentar?: never })
  | (Mio & { estado: 'no_se_envio'; onReintentar: () => void; vozReintentar: string })

/**
 * EL ANCHO DE LA COLUMNA DE LA CARA. Se exporta para que quien monte el
 * avatar o el logo lo pida acá en vez de teclear un 28 que después se separa
 * de esta columna (L-284). Es el mismo que usa `CabeceraHilo` para la
 * contraparte: la casa ya había resuelto «qué tamaño tiene una cara que
 * acompaña, no que presenta».
 */
export const CARA_EN_HILO = 28

/** El radio que cierra el grupo: pleno salvo del lado que sigue pegado. */
function radiosDe(mio: boolean, posicion: PosicionEnGrupo) {
  const R = radius.lg
  const PEGADO = radius.xs
  const sigueArriba = posicion === 'medio' || posicion === 'ultimo'
  const sigueAbajo = posicion === 'medio' || posicion === 'primero'
  return {
    borderTopLeftRadius: !mio && sigueArriba ? PEGADO : R,
    borderTopRightRadius: mio && sigueArriba ? PEGADO : R,
    borderBottomLeftRadius: !mio && sigueAbajo ? PEGADO : R,
    borderBottomRightRadius: mio && sigueAbajo ? PEGADO : R,
  }
}

export function BurbujaMensaje(props: BurbujaMensajeProps) {
  const { theme } = useTheme()
  const { texto, hora, posicion = 'solo', autor, mio } = props

  const abreGrupo = posicion === 'solo' || posicion === 'primero'
  const cierraGrupo = posicion === 'solo' || posicion === 'ultimo'
  const fallo = mio && props.estado === 'no_se_envio'
  /* La columna existe SÓLO si este hilo tiene caras: sin ella, el layout es
     byte por byte el de antes y los dos hilos de adopción no se mueven. */
  const cara = mio ? undefined : props.cara
  const conColumna = cara !== undefined

  const cuerpo = (
    <View
      /* `flex: 1` SIEMPRE, y no sólo cuando hay columna: sin él, dentro de
         una fila el cuerpo se encoge al ancho de su contenido y `flex-end`
         deja de empujar los míos a la derecha. **Ese era el precio escondido
         de envolver en una fila** — se vio midiendo el caso sin cara, que es
         el de los dos hilos vivos de adopción. */
      style={{ flex: 1, alignItems: mio ? 'flex-end' : 'flex-start' }}
    >
      {/* El nombre, sólo al abrir el grupo y sólo del otro lado: sobre los
          míos sería decirme cómo me llamo en cada mensaje. */}
      {abreGrupo && !mio && autor !== undefined ? (
        <View style={{ paddingBottom: spacing[1], paddingHorizontal: spacing[1] }}>
          <Texto variante="apoyo" color="secondary">
            {autor}
          </Texto>
        </View>
      ) : null}

      <View
        accessibilityRole="text"
        style={{
          maxWidth: '82%',
          paddingHorizontal: spacing[3],
          paddingVertical: spacing[2],
          backgroundColor: mio ? theme.accent.brandBg : theme.bg.card,
          borderWidth: theme.border.width,
          borderColor: mio ? theme.accent.brandBorder : theme.border.subtle,
          ...radiosDe(mio, posicion),
        }}
      >
        {/* Sin `numberOfLines`: un mensaje largo se lee entero (§2.3). */}
        <Texto variante="cuerpo">{texto}</Texto>
      </View>

      {/* LA HORA Y EL ESTADO, sólo al cerrar el grupo. La hora llegó siempre;
          acá se decide que se vea — ver la nota de la cabecera. */}
      {cierraGrupo ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing[1],
            paddingTop: spacing[1],
            paddingHorizontal: spacing[1],
          }}
        >
          <Texto variante="apoyo" color="tertiary">
            {hora}
          </Texto>
          {/* La marca de estado, en TEXTO y no en glifo — el mismo criterio
              que `SemaforoSanitario` ya lleva escrito: acá no hay objeto de
              oficio que dibujar, y un check no es ni una cosa ni una
              mascota. `·` mientras viaja, `✓` cuando llegó al servidor. */}
          {mio && !fallo ? (
            <Texto variante="apoyo" color="tertiary">
              {props.estado === 'enviando' ? '·' : '✓'}
            </Texto>
          ) : null}
        </View>
      ) : null}

      {/* EL FALLO — texto y camino, en el color de clase y jamás en rojo:
          no es un error de quien escribió, es el estado de ese mensaje. */}
      {fallo ? (
        <Pressable
          onPress={props.onReintentar}
          accessibilityRole="button"
          accessibilityLabel={props.vozReintentar}
          style={{ paddingTop: spacing[1], paddingHorizontal: spacing[1] }}
        >
          <Texto variante="apoyo" color="secondary">
            {props.vozReintentar}
          </Texto>
        </Pressable>
      ) : null}
    </View>
  )

  return (
    <View
      style={{
        flexDirection: 'row',
        // La cara acompaña al PRIMERO del grupo, así que la fila se alinea
        // arriba: alinearla abajo la pegaría al último, que es de otro
        // momento de la conversación.
        alignItems: 'flex-start',
        // El aire ENTRE grupos es mayor que el aire dentro: es lo que
        // agrupa, y por eso el agrupado no necesita ninguna caja.
        marginTop: abreGrupo ? spacing[3] : spacing[0.5],
        paddingHorizontal: spacing[4],
      }}
    >
      {/* LA COLUMNA DE LA CARA — reservada para TODO el grupo, con la cara
          sólo en el primero. Si sólo existiera donde hay cara, las burbujas
          del mismo grupo arrancarían en dos x distintas. */}
      {conColumna ? (
        <View style={{ width: CARA_EN_HILO, marginRight: spacing[2] }}>
          {abreGrupo ? cara : null}
        </View>
      ) : null}
      {cuerpo}
    </View>
  )
}
