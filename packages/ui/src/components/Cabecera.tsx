import { type ReactNode } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { BarraPasos } from './BarraPasos'
import { Chevron } from './chevron'
import { DiscoVidrio } from './DiscoVidrio'
import { GlifoConContador } from './GlifoConContador'
import { Texto } from './Texto'
import { palette } from '../tokens/palette'
import { medidas } from '../tokens/medidas'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

/**
 * ═══════════════════════════════════════════════════════════════════════
 * **CABECERA (S116-B lote 2) — la banda ciruela de la casa.**
 * Letra §2 (medidas y degradado) · punto 1 del encargo.
 *
 * **PIEZA NUEVA con nombre propio.** ⚠️ **NO reemplaza a `Encabezado`
 * todavía**, y eso es deliberado: `Encabezado` tiene **173 consumidores**
 * en las dos apps, y el plan §1 dice que una pieza vieja muere *cuando su
 * último consumidor migró*. Los consumidores los migra **C, en el lote 3**.
 * Hasta entonces las dos conviven y `Encabezado` **no lleva lápida**:
 * *poner la lápida hoy marcaría como muerta una pieza que el prestador va
 * a seguir montando después de esta letra* (§5).
 *
 * ── LO QUE HACE, y lo que decide quien la monta ────────────────────────
 * **Llega hasta arriba de todo**: la banda pinta bajo la barra de estado y
 * el contenido baja por el inset. Es el patrón que `HeroMarca` ya fijó en
 * S59 — *la safe area la absorbe la PRIMITIVA*, y por eso ninguna pantalla
 * vuelve a sumar `insets.top` por fuera.
 *
 * 🔴 **NO se achica ni se mueve al scrollear** (textual del encargo). Por
 * eso no recibe ningún valor animado ni scroll: **si mañana alguien quiere
 * una cabecera colapsable, es otra pieza** — hacerla configurable acá
 * volvería opcional lo que el encargo fijó.
 *
 * **La curva inferior y su sombra** son de la pieza. La sombra es *apenas
 * perceptible*: despega la banda del lienzo, no la levanta.
 * ═══════════════════════════════════════════════════════════════════════
 */
export type CabeceraProps = {
  variante: 'raiz' | 'empujada'
  /** La línea de arriba del título: el barrio, «ACTIVIDAD», la fecha. La
   *  pieza **no** la pone en mayúsculas: el token `antetitulo` ya trae su
   *  `textTransform` (letra §2). */
  antetitulo?: string
  /** 🔴 **EN QUÉ VOZ HABLA EL ANTETÍTULO (pedido de C, lote 3f).**
   *
   *  `'rotulo'` (default) es lo de siempre: **sans bold 11 en MAYÚSCULAS con
   *  tracking** — un rótulo que clasifica lo que viene abajo.
   *  `'dato'` lo monta en la receta `dato`: **mono, minúsculas, sin
   *  tracking** — la Ley 3, para cuando esa línea no clasifica sino que
   *  **dice un dato de máquina**.
   *
   *  **Nació de un caso real, no de simetría:** al absorber el techo del
   *  Hogar, la fecha —*«lunes, 14 de septiembre»*, mono minúscula, y así
   *  está en la lámina— cayó en el único slot que hay encima del título y
   *  **salió «LUNES, 14 DE SEPTIEMBRE»**.
   *
   *  ⚠️ **Es una unión cerrada y NO un `ReactNode`, y la razón es de C:**
   *  *un slot libre ahí deja que cada pantalla elija su tipografía encima de
   *  la banda, y eso es justo lo que la cabecera cerró.*
   *
   *  ⚠️ **Y no es que `antetitulo` estuviera mal:** nació como **rótulo** y
   *  lo dice su propio comentario. *Lo que apareció después es un segundo
   *  uso —una línea de contexto que es un dato— que cuando se escribió no
   *  existía.* */
  antetituloVoz?: 'rotulo' | 'dato'
  titulo: string
  /** Una línea de apoyo. En raíz va en blanco al 70 %; en empujada es el
   *  subtítulo. */
  apoyo?: string
  /** UN botón redondo translúcido (raíz: la campana, el avatar) o una
   *  palabra de acción / un dato (empujada: «Omitir», «2 ítems»).
   *  **Es un nodo y no una lista**: *«un lugar para UN botón»* — el plural
   *  llenaría la cabecera de acentos y la Ley 5 ya dice cuántos van. */
  accionDerecha?: ReactNode
  /** 🔴 **EL CARRITO VUELVE A LA CABECERA (S116-B lote 10, firma del
   *  founder: revierte `D-1108`).** Vive en el slot derecho de **las cinco
   *  tabs**, con su contador, como estaba antes del rediseño (S100d·bis).
   *
   *  🔴 **SÓLO SE DIBUJA EN `variante="raiz"`, y eso es la mitad que
   *  importa.** La adenda es literal: *«NO en las pantallas de checkout
   *  —carrito, pago, confirmación—: ahí no se muestra»*. Esas pantallas son
   *  EMPUJADAS, así que **la regla no se recuerda: se cumple sola.** *Una
   *  pantalla de checkout que pase `carrito` no va a dibujarlo aunque
   *  quiera, y eso es mejor que una lista de excepciones que alguien tiene
   *  que mantener.*
   *
   *  ⚠️ **Ocupa el MISMO slot que `accionDerecha`**, así que los dos a la
   *  vez no compilan: *«un lugar para UN botón»* — dos acentos en la
   *  cabecera es la Ley 5 rota. */
  carrito?: { cantidad: number; onPress: () => void; etiqueta: string }
  /** 🔴 **La campana con su contador (lote 3b).** Hermana del carrito y en el
   *  mismo slot: **el censo encontró DOS acciones-con-contador en raíz**, y la
   *  campana vivía dibujada a mano en el techo local del Hogar — el techo que
   *  este lote borra. Se dibuja **sólo en `raiz`**, igual que el carrito.
   *  ⚠️ **Prop propia y no un `accionDerecha` genérico**: *un `ReactNode`
   *  suelto deja que cada pantalla arme su disco, y ahí vuelve la copia que
   *  `DiscoVidrio` acaba de terminar.* */
  avisos?: { cantidad: number; onPress: () => void; etiqueta: string }
  /** 🔴 **EL CONTENIDO PROPIO DENTRO DE LA BANDA (`D-1106`, lote 3b).**
   *
   *  Lo pedían **los dos techos locales que quedaban**, y el censo los midió:
   *  · **el Hogar** — fecha en mono, saludo y **la fila de mascotas ADENTRO
   *    del degradado** (su propio código lo declara: *«HeroMarca no tiene
   *    slots para fecha-antes-del-saludo ni para la fila de mascotas»*);
   *  · **el Expediente** — el hero de la mascota, con su flecha de volver
   *    **dibujada con un `Path` a mano**.
   *
   *  Va **debajo del título y dentro de la banda**, así que hereda su color y
   *  su inset. *La alternativa era que cada pantalla siguiera copiando el
   *  degradado, la curva y la safe area — que es literalmente lo que las dos
   *  venían haciendo, con «COPIANDO NIVEL de la primitiva» escrito al lado.*
   *
   *  ⚠️ **Es un slot, no una pieza nueva:** el contenido lo arma la pantalla
   *  porque es suyo —una fila de mascotas no es de la cabecera—; lo que deja
   *  de ser suyo es **el techo**. */
  contenido?: ReactNode
  /** Cuando la pantalla es un paso de un flujo. Se dibuja bajo el título
   *  con la pieza `BarraPasos`, que la cabecera no redibuja. */
  pasos?: { total: number; actual: number; etiqueta: string }
  onVolver?: () => void
  /** La voz del botón de volver. Sin default (Ley 3). */
  etiquetaVolver?: string
  /* ══════════════════════════════════════════════════════════════════
   *  CÓMO SE PINTA — `'tarjeta'` (default, lo de siempre) o `'fondo'`.
   *
   * 🔴 **ES UNA PROP Y NO UN TERCER VALOR DE `variante`, y la orden misma
   * lo obliga:** pide *«mismos contenidos… **flecha en empujada**»*, o sea
   * que `raiz`/`empujada` siguen vivas. **`fondo` no es QUÉ ES la cabecera:
   * es CÓMO SE PINTA**, y son dos ejes.
   *
   * *La casa ya resolvió este caso exacto en `Boton`, y su entrada lo dejó
   * escrito: «la superficie es ORTOGONAL a la variante».* Meterlo en
   * `variante` habría obligado a `fondoRaiz` y `fondoEmpujada` el día
   * siguiente.
   *
   * QUÉ CAMBIA: **nada de contenido.** Pierde el radio inferior y la
   * sombra, porque deja de ser una tarjeta apoyada y pasa a ser el FONDO
   * de la pantalla — *una sombra sobre el fondo no despega nada: no hay
   * nada debajo.*
   *
   * ⚠️ **Default `'tarjeta'`: los siete consumidores no cambian una prop.**
   * Quien la monta como fondo es `HojaContenido`, que sabe que hay una
   * hoja encima. */
  presentacion?: 'tarjeta' | 'fondo'
}

/* ══════════════════════════════════════════════════════════════════════
 *  EL ALTO DE LA CABECERA — pedido de C (buzón S116, pedido 2)
 *
 * C lo pidió como `ALTO_CABECERA_*`, al molde de `ALTO_FILA_TABS`, para
 * que **el valor de arranque de su medición asincrónica sea el correcto**
 * en vez de un cero que salta en el primer cuadro. La razón es buena y el
 * molde es el de la casa.
 *
 * 🔴 **PERO NO HAY UN ALTO, y decirlo es más útil que inventar uno.** La
 * cabecera mide `insets.top + padding + CONTENIDO + padding`, y el
 * contenido es variable por diseño: antetítulo opcional, título de una o
 * dos líneas, apoyo opcional, barra de pasos opcional. *Un `ALTO_CABECERA`
 * único sería correcto para una combinación y falso para las otras siete —
 * y al ser un valor de arranque, su error se ve como un salto.*
 *
 * ⇒ se exporta **LA PARTE FIJA**, que es exactamente lo que
 * `ALTO_FILA_TABS` hace y lo que su nota ya declaró: *«se exporta la parte
 * que es de la pieza, no la que es del teléfono»*. Acá son **dos** las que
 * no son de la pieza: el inset **y el contenido**.
 * ══════════════════════════════════════════════════════════════════════ */

/** El padding vertical de la cabecera RAÍZ (70 arriba + 22 abajo).
 *  **No incluye `insets.top` ni el contenido**: el alto real es
 *  `inset + ALTO_CABECERA_RAIZ_FIJO + lo que midan sus líneas`. Sirve como
 *  piso de arranque para una medición con `onLayout`, no como el alto. */
export const ALTO_CABECERA_RAIZ_FIJO = medidas.cabeceraRaiz.top + medidas.cabeceraRaiz.bottom

/** Íd. para la cabecera EMPUJADA (68 + 20). */
export const ALTO_CABECERA_EMPUJADA_FIJO =
  medidas.cabeceraEmpujada.top + medidas.cabeceraEmpujada.bottom

export function Cabecera({
  variante,
  antetitulo,
  antetituloVoz = 'rotulo',
  titulo,
  apoyo,
  accionDerecha,
  carrito,
  avisos,
  contenido,
  pasos,
  onVolver,
  etiquetaVolver,
  presentacion = 'tarjeta',
}: CabeceraProps) {
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()
  const esRaiz = variante === 'raiz'
  const esFondo = presentacion === 'fondo'
  const m = esRaiz ? medidas.cabeceraRaiz : medidas.cabeceraEmpujada

  /* Memorial: ciruela noche PLANA, sin degradado (§4). El gradiente del
     tema ya resuelve eso solo —`gradients.memorialPlano` lleva el mismo
     color en los dos stops—, así que acá no hay una rama por tema: se pide
     el slot y el tema contesta. */
  const grad = theme.accent.gradient

  /* 🔴 **COMO FONDO NO PINTA NADA, Y ES LA CURA DE LA COSTURA (lote 6).**
     El founder vio *«dos tonos de ciruela con una costura horizontal justo
     debajo del logo»*. **Medido, y la causa es aritmética:** esta pieza y
     `HojaContenido` pintan **el mismo degradado** con el mismo `start`/`end`
     — pero `end={{ y: 1 }}` significa *el fondo de MI caja*. La cabecera
     completa la rampa entera en sus ~300 px; el fondo la estira sobre los
     ~2400 de la pantalla. ⇒ **al pie de la cabecera se tocan dos colores
     distintos del mismo degradado.** No es que «no empaten»: es que son dos
     superficies, y dos superficies siempre van a tener un borde.

     ⚠️ **El síntoma lo prueba solo: no se ven DOS tonos si no hay DOS
     superficies.** Igualar los números habría sido perseguir el empate en
     cada alto de cabecera y en cada teléfono; **con una sola superficie el
     borde es inexpresable.**

     Y es lo que su propio contrato ya decía —`HojaContenido`: *«el degradado
     lo pinta ESTA pieza, no la Cabecera»*—; lo que faltaba era que la
     cabecera dejara de pintarlo. ⇒ como `fondo` es un `View` transparente.
     *Quien la monte como fondo tiene que darle una superficie debajo; hoy
     el único que lo hace es `HojaContenido`, que es para lo que nació.* */
  /* 🔴 **LA CURVA INVERTIDA ES INEXPRESABLE COMO FONDO (lote 3c, firma del
     founder).** ⏪ Antes esto era UN objeto con dos ternarios —
     `borderBottomLeftRadius: esFondo ? 0 : …` y `boxShadow: esFondo ? … `—.
     **Daba el píxel correcto y aun así estaba mal**, y la diferencia es la
     que el founder pidió:

     > **Un ternario documenta la regla; dos objetos la hacen imposible.** En
     > el ternario el radio SIGUE ESTANDO en el estilo del fondo —vale `0`—,
     > así que alcanza con que alguien lo cambie, lo copie o agregue el
     > tercer caso *«fondo pero con un bordercito»* para que vuelva. **Acá el
     > estilo del fondo NO TIENE la clave**: no hay qué cambiar.

     La estructura firmada es **fondo ciruela sin radio + hoja con las
     esquinas de ARRIBA redondeadas**. *La curva de abajo es de una tarjeta
     apoyada sobre algo; el fondo no está apoyado sobre nada — es lo que está
     debajo de todo.* */
  const base = {
    paddingTop: insets.top + (esRaiz ? spacing[3] : spacing[2]),
    paddingHorizontal: m.lados,
    paddingBottom: m.bottom,
    gap: spacing[3],
  }
  /** Como TARJETA: apoyada, con su curva de abajo y su sombra apenas
   *  perceptible — despega, no levanta. */
  const estiloTarjeta = {
    ...base,
    borderBottomLeftRadius: radius.cabeceraV5,
    borderBottomRightRadius: radius.cabeceraV5,
    boxShadow: theme.elevacion.reposo,
  }
  /** Como FONDO: **`base` y nada más.** El radio y la sombra no están
   *  puestos en cero — **no existen en este objeto**. */
  const estiloSuperficie = esFondo ? base : estiloTarjeta

  /* El armado interno de la banda. Se llama `cuerpo` desde el lote 3b: el
     nombre `contenido` pasó a ser el SLOT público. */
  const cuerpo = (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] }}>
        {!esRaiz && onVolver !== undefined ? (
          <DiscoVidrio onPress={onVolver} etiqueta={etiquetaVolver}>
            {/* El chevron de la casa, en su dirección `izquierda` —que la
                tabla ya trae como reflejo exacto, no como trazo nuevo—. Se
                monta la PIEZA y no el path: R70 vigila que un path svg no
                viaje suelto. */}
            <Chevron direccion="izquierda" color={palette.white} />
          </DiscoVidrio>
        ) : null}

        <View style={{ flex: 1, gap: spacing[1] }}>
          {/* 🔴 **`sobreGradiente`, NO `inverso` (lote 16, censo del oscuro).**
              Los tres textos van sobre la banda, que es el **degradado del
              tema** — ciruela en claro, ciruela noche en oscuro: **oscura en
              los tres temas**. `'inverso'` es *«al revés del tema»*, así que
              en oscuro daba TINTA sobre ciruela y **el título de la cabecera
              desaparecía en toda pantalla del cliente**.
              ⚠️ **El slot `text.onGradient` ya existía en los tres temas** y no
              tenía puerta desde `Texto`. *El valor correcto estaba escrito
              desde hacía sesiones; lo que faltaba era poder pedirlo.* */}
          {antetitulo !== undefined ? (
            <Texto variante={antetituloVoz === 'dato' ? 'dato' : 'antetitulo'} color="sobreGradiente">
              {antetitulo}
            </Texto>
          ) : null}
          <Texto variante={esRaiz ? 'titulo' : 'seccion'} color="sobreGradiente">
            {titulo}
          </Texto>
          {apoyo !== undefined ? (
            <Texto variante="apoyo" color="sobreGradiente">
              {apoyo}
            </Texto>
          ) : null}
        </View>

        {/* 🔴 **EL SLOT DERECHO ADMITE LOS DOS DISCOS (lote 3b).** El censo
            encontró **dos** acciones-con-contador vivas en raíz —el carrito de
            las cinco tabs y la campana del Hogar— y hasta hoy sólo cabía una.
            *La campana se dibujaba en el techo local del Hogar, y ése es
            exactamente el techo que este lote viene a borrar.*
            ⚠️ **En `empujada` no se dibuja NINGUNO de los dos**: las pantallas
            de checkout son empujadas, así que *la regla «ahí no se muestra» no
            se recuerda — se cumple sola.* */}
        {esRaiz && (carrito !== undefined || avisos !== undefined) ? (
          <View style={{ flexDirection: 'row', gap: spacing[2] }}>
            {avisos !== undefined ? (
              <DiscoVidrio onPress={avisos.onPress} etiqueta={avisos.etiqueta}>
                <GlifoConContador nombre="campana" cuenta={avisos.cantidad} dentroDeTocable />
              </DiscoVidrio>
            ) : null}
            {carrito !== undefined ? (
              <DiscoVidrio onPress={carrito.onPress} etiqueta={carrito.etiqueta}>
                <GlifoConContador nombre="carrito" cuenta={carrito.cantidad} dentroDeTocable />
              </DiscoVidrio>
            ) : null}
          </View>
        ) : accionDerecha !== undefined ? (
          <View>{accionDerecha}</View>
        ) : null}
      </View>

      {/* El contenido propio va DENTRO de la banda y debajo del título:
          hereda el degradado, la curva y el inset que la pantalla copiaba. */}
      {contenido !== undefined ? <View>{contenido}</View> : null}

      {pasos !== undefined ? <BarraPasos {...pasos} /> : null}
    </>
  )

  /* Las dos ramas, explícitas: un componente elegido por variable no se
     puede tipar sin ensanchar las props de las dos (el gate lo frenó). */
  return esFondo ? (
    <View style={estiloSuperficie}>{cuerpo}</View>
  ) : (
    <LinearGradient
      colors={grad.colors as unknown as readonly [string, string, ...string[]]}
      locations={grad.locations as unknown as readonly [number, number, ...number[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.2, y: 1 }}
      style={estiloSuperficie}
    >
      {cuerpo}
    </LinearGradient>
  )
}

/** ☠️ **ALIAS CON FECHA DE MUERTE.** La puerta del disco es la pieza
 *  `DiscoVidrio`, exportada desde el índice y con entrada de catálogo.
 *  Esto queda para no romper las ramas que ya lo montan así, y **se retira
 *  cuando su último consumidor migre** — *dos puertas al mismo disco son
 *  exactamente lo que produjo la copia que esta pieza vino a borrar.* */
Cabecera.Disco = DiscoVidrio
