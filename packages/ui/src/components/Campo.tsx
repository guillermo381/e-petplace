/**
 * Campo — el input de texto del sistema (S43-B3.3).
 *
 * ═══════════════════════════════════════════════════════════════════
 * REGLA EMIL RECTORA: nada se anima mientras el usuario tipea —
 * jamás labels flotantes, jamás layout shift al enfocar o errar.
 *
 * ENMIENDA S83-B1 — LA PROTECCIÓN NO SE RETIRA, SUBE UN NIVEL.
 * El pie de altura reservada es el instrumento de esa promesa, y sigue
 * siendo el DEFAULT. Lo que la enmienda reconoce es que el pie pertenece
 * al CONTROL, y un control puede estar compuesto por más de una pieza: en
 * una fila (indicativo + número) el pie de UNO de los hijos corre al otro
 * hacia abajo por su alto exacto. Con `sinPie`, el hijo deja de reservarlo
 * y el pie lo monta el COMPUESTO, para los dos — misma promesa, un piso
 * más arriba. Sin ese pie del compuesto la promesa se pierde, y por eso
 * `sinPie` no viaja solo: viaja con `PieDeCampo` y con su guard (R29).
 * ═══════════════════════════════════════════════════════════════════
 *
 * Consecuencias de diseño:
 *   · Label SIEMPRE visible, **AFUERA Y ARRIBA de la caja** (S100-B ·
 *     **N11′**, firma del founder 17-ago — ⏪ S99-B lo había metido
 *     adentro por N11; la ley se reabrió con evidencia y volvió afuera.
 *     El porqué entero vive en `caja-de-campo.ts`). **Nunca fue
 *     placeholder-como-label y sigue sin serlo** — al contrario: N11′ le
 *     da al placeholder su trabajo propio, que es **enseñar el FORMATO**
 *     (bajo «Teléfono de contacto» va «+593 99 123 4567», no «Teléfono»).
 *   · Borde 1.5px SIEMPRE — el foco/error cambia COLOR, no grosor.
 *   · El slot de ayuda/error tiene altura reservada: el mensaje no
 *     empuja el layout al aparecer (error reemplaza a ayuda).
 *   · Única animación permitida: transición de color del borde
 *     (fast, receta SM). Nada más.
 *   · multilinea crece a alto FIJO (n líneas) — auto-grow mientras
 *     tipeás = layout shift = prohibido.
 */

import { useState, type ReactNode } from 'react'
import {
  PixelRatio,
  Pressable,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type TextInputProps,
} from 'react-native'
import Animated, { cubicBezier } from 'react-native-reanimated'

import {
  estiloDeCaja,
  ALTO_CAJA_CAMPO,
  ALTO_LINEA_CAMPO,
  GAP_ETIQUETA,
  TAMANO_ETIQUETA,
  medidasCampoV5,
  TAMANO_ETIQUETA_FLOTANTE,
  DISCO_GLIFO_CAMPO,
  formaV5,
} from './caja-de-campo'
import { typography } from '../tokens/typography'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { motion } from '../tokens/motion'
import { opacity } from '../tokens/opacity'
import { useTheme } from '../ThemeProvider'
import { useTraduccionUi } from '../i18n'
import { Icono, type IconoNombre } from './Icono'

/** ⏪ S99-B · `BORDE` y el fondo salen ahora de `caja-de-campo.ts` — la
 *  anatomía vivía copiada en tres piezas (ver su cabecera). Acá quedan
 *  solo las medidas propias de ESTE campo. */
/** ⏪ S100-B · **N11′** — el alto de la caja y la línea de entrada salen
 *  ahora de `caja-de-campo.ts`, igual que el borde y el fondo: **con la
 *  etiqueta afuera, las tres piezas vuelven a tener la MISMA caja**, y
 *  dejar el número acá sería la cuarta copia que ese archivo existe para
 *  evitar. La caja pasa de **62 a 48** (ya no aloja la etiqueta). */
const ALTO_LINEA = ALTO_LINEA_CAMPO  // 24
const ALTO = ALTO_CAJA_CAMPO         // 48
const LINEA_MENSAJE = typography.size.sm * typography.leading.normal  // slot reservado

/** El alto EXACTO que el pie reserva: 13 × 1.6 + 4 = **24.8 px**. Es el
 *  delta que un hermano alineado a `flex-end` recibe hacia abajo cuando su
 *  vecino es un `Campo` — medido, no estimado. Se exporta porque un
 *  compuesto puede necesitar el número, y derivarlo a mano en la pantalla
 *  es exactamente cómo se fabrican los márgenes a ojo.
 *  ⚠️ NO es constante universal: si el mensaje ENVUELVE a dos líneas, el
 *  pie crece y el delta con él. Por eso la cura correcta es `sinPie` (que
 *  lo elimina) y no "igualar el alto" en el consumidor — igualar acierta
 *  en reposo y falla justo cuando aparece el error. */
export const ALTO_PIE_CAMPO = LINEA_MENSAJE + spacing[1]

export interface EtiquetaDeCampoProps {
  /** El nombre del campo. Visible SIEMPRE (salvo la exención de N11′). */
  children: string
}

/**
 * EtiquetaDeCampo — el rótulo de un control de formulario: **afuera,
 * arriba, siempre visible y siempre del mismo tamaño** (N11′).
 *
 * **Vive acá y no en cada pieza por la misma razón que `PieDeCampo`**: es
 * la anatomía DE un campo, y son piezas simétricas — *el pie va abajo, la
 * etiqueta va arriba, y las dos las montan las tres piezas de campo.*
 * Escrita una vez, `Campo`, `CampoFecha` y `CampoCodigo` no pueden
 * divergir. **Y esta vez el riesgo de divergir era real, no teórico: las
 * tres tenían la etiqueta escrita distinta hasta hoy** — dos adentro a
 * `xs`, una afuera a `sm`.
 *
 * ⚠️ **Lo que esta pieza NO hace, y es deliberado: no cambia con el
 * estado.** No recibe `error` ni `enfocado`. *Si los recibiera, alguien
 * los usaría* — y N11′ dice literal que la etiqueta **jamás cambia de
 * tamaño ni de color** por foco o por contenido. **La forma más barata de
 * garantizar que un dato no se use es no pasarlo.**
 */
export function EtiquetaDeCampo({ children }: EtiquetaDeCampoProps) {
  const { theme } = useTheme()

  return (
    <Text
      numberOfLines={1}
      style={{
        fontFamily: typography.family.sans.medium,
        fontSize: TAMANO_ETIQUETA,
        lineHeight: Math.round(TAMANO_ETIQUETA * typography.leading.normal),
        color: theme.text.secondary,
        marginBottom: GAP_ETIQUETA,
      }}
    >
      {children}
    </Text>
  )
}

/**
 * CÓMO SE LEE EL MENSAJE DEL PIE — S112-B (B4).
 *
 * `'alarma'` (default, el de siempre): **lo que escribiste no sirve.** Rojo,
 * porque hay algo que corregir y la corrección es tuya (N12.4).
 *
 * `'estado'`: **lo que pasó no depende de vos.** Un código de firma que
 * venció, o los intentos agotados, no son un error de tipeo — son el estado
 * de ese código. Pintarlos de rojo le dice a la persona que hizo algo mal
 * en el momento más cargado del recorrido, cuando lo único que hay que
 * hacer es pedir otro. **N23: el acento se reserva para lo accionable y
 * para lo que necesita ALARMA, y esto no es ninguno de los dos.**
 *
 * 🔴 **Lo que NO cambia con el tono: el anuncio.** `liveRegion` sigue en
 * `polite` en los dos casos. *Un mensaje que aparece sin anunciarse no
 * existe para quien no ve la pantalla, y bajar el color no es una razón
 * para bajar la accesibilidad.*
 */
export type TonoDelPie = 'alarma' | 'estado'

export interface PieDeCampoProps {
  /** Helper. `error` lo reemplaza en el MISMO slot. */
  ayuda?: string
  /** Mensaje de error (dangerText) — anunciado con liveRegion polite. */
  error?: string
  /** Default `'alarma'`: los consumidores viejos no cambian en un byte. */
  tono?: TonoDelPie
}

/**
 * PieDeCampo — el pie de un control de formulario: altura RESERVADA y el
 * mensaje adentro. Vive acá (no en archivo propio) por el precedente de
 * `HojaScroll` dentro de `Hoja`: es la anatomía DE `Campo`, no una pieza
 * con vida propia.
 *
 * POR QUÉ EXISTE COMO PIEZA (S83-B1): esta anatomía estaba COPIADA byte
 * por byte en `Campo` y `CampoFecha` —comentario de D-605 incluido— y el
 * compuesto que necesita montarla iba a ser la tercera copia. Se ensancha,
 * no se copia (L-175). Precedente medido el mismo día: en B36 la expresión
 * del teclado vivía duplicada en dos archivos y curar uno dejaba el otro
 * roto; acá se cura de raíz antes de que pase.
 */
export function PieDeCampo({ ayuda, error, tono = 'alarma' }: PieDeCampoProps) {
  const { theme } = useTheme()
  const mensaje = error ?? ayuda
  const v5 = formaV5(theme)

  /* ⭐ **S116-B lote 6 · EL AIRE ENTRE CAMPOS HERMANOS, y el defecto NO
     estaba donde parecía.**
     ═════════════════════════════════════════════════════════════════
     🔴 **Medido en el emulador ANTES de tocar nada: entre una caja y el
     rótulo siguiente había 121 px = 40,3 dp.** El founder lo llamó *«muy
     separados»* y pidió bajarlo al token de tarjetas hermanas (10-12).
     **Y el `gap` de las pantallas ya era 8** (`registro.tsx:228` ·
     `login.tsx:269`), o sea MENOS que lo pedido: *si sólo se hubiera
     mirado el `gap`, la conclusión habría sido que ya estaba bien.*

     **Los 40 salían de acá: este slot reserva 25 dp SIEMPRE**, tenga o
     no algo que decir. Lo reservaba por dos razones y **hoy sólo queda
     una y media**:
       · *que nada empuje el layout cuando aparece un error* — sigue
         viva, y se respeta (ver abajo);
       · *garantizar ≥24 entre un campo y el siguiente para que la
         etiqueta de afuera no se leyera como el pie del campo de
         arriba* (N11′) — ☠️ **muere con N11″: ya no hay etiqueta
         afuera.** La razón se fue con la cosa que protegía.

     ⇒ **Vacío reserva `spacing[1]` (4)**, que sumado al `gap: 8` de las
     pantallas da **12 exactos**: el token que la orden nombra, sin que
     nadie toque una pantalla.

     ⚠️ **LO QUE ESTO CUESTA, declarado y no escondido: al aparecer un
     error, el campo CRECE 21 dp y lo de abajo se corre.** *No es gratis
     y no se disimula.* Se acepta con su razón: **un error aparece al
     ENVIAR, no mientras se tipea**, y la regla rectora dice literalmente
     *«nada se mueve mientras alguien tipea»* — el mismo corte que deja
     flotar la etiqueta al enfocar. **Un campo con `ayuda` no salta
     nunca**: su pie ya está dibujado desde el principio.
     ═════════════════════════════════════════════════════════════════ */
  const reservaVacia = v5 ? spacing[1] : ALTO_PIE_CAMPO

  return (
    // Slot de altura RESERVADA: error reemplaza a ayuda, nada empuja el layout
    <View style={{ minHeight: mensaje ? ALTO_PIE_CAMPO : reservaVacia, justifyContent: 'flex-end' }}>
      {mensaje ? (
        <Text
          accessibilityLiveRegion={error ? 'polite' : 'none'}
          style={{
            fontFamily: typography.family.sans.regular,
            fontSize: typography.size.sm,
            lineHeight: LINEA_MENSAJE,
            // S83-B26 (D-605, salida ②): el helper migra de
            // `text.tertiary` a `text.secondary`. EL PORQUÉ, que es el
            // que decidió la ficha: la exención de `tertiary` se firmó
            // para un ROL —el tab inactivo, espec B3.7— y un helper NO
            // es placeholder ni está apagado: **es la instrucción de
            // cómo llenar el campo, el texto que uno lee justo cuando
            // no sabe qué poner**. Medido contra el theme resuelto, no
            // a mano: `tertiary` da 2.18 en LIGHT (el tema por defecto
            // del producto) contra un mínimo de 3:1 — dos de los tres
            // temas por debajo. `secondary` YA vive en el corpus del
            // gate (`verify-contrast.ts:97`) y pasa en los tres.
            // MÁXIMO ALCANCE POR SITIO: no es una pantalla — lo hereda
            // CADA `Campo` de la casa, en las dos apps.
            color: error && tono === 'alarma' ? theme.status.dangerText : theme.text.secondary,
            marginTop: spacing[1],
          }}
        >
          {mensaje}
        </Text>
      ) : null}
    </View>
  )
}


/* ═══════════════════════════════════════════════════════════════════
 * N11″ · QUÉ GLIFO LE TOCA A UN CAMPO — y **por qué se DERIVA en vez de
 * pedirse**.
 *
 * 🔴 **Lo decidió un censo: `iconoIzq` tiene CERO consumidores en las
 * dos apps.** Ninguna pantalla pasa un glifo hoy, y el encargo dice
 * explícito *«sin que C toque pantallas»* — así que una prop nueva
 * habría dibujado exactamente nada.
 *
 * ⚠️ **Y no es una heurística sobre el texto del rótulo, que sería
 * adivinar.** `autoComplete` es **vocabulario estándar de la
 * plataforma, declarado por el consumidor**: las tres pantallas del
 * encargo ya lo pasan (`name` · `email` · `new-password`). *Se lee lo
 * que el campo ya dijo de sí mismo, no lo que parece por cómo se llama.*
 *
 * ⚠️ **Cae a NADA, y eso es la mitad honesta.** Un campo que no declara
 * su tipo no recibe un glifo genérico: recibe ninguno. *Un genérico
 * repetido en cinco campos no informa —es la Ley 12— y además enseñaría
 * mal el vocabulario.* Quien quiera decirlo explícito tiene `iconoIzq`,
 * que **gana sobre la derivación**.
 * ═══════════════════════════════════════════════════════════════════ */
const GLIFO_POR_AUTOCOMPLETE: Record<string, IconoNombre> = {
  /* ⚠️ **`cuenta` y no `perfil`**: `perfil` es un ALIAS del registry
     (`Icono.tsx:603` → `perfil: 'cuenta'`) y no es un `IconoNombre`. *Lo
     cazó el tsc; a ojo los dos nombres parecen igual de válidos.* */
  name: 'cuenta',
  'given-name': 'cuenta',
  username: 'cuenta',
  email: 'correo',
  password: 'contrasena',
  'new-password': 'contrasena',
  'current-password': 'contrasena',
}

function glifoDelCampo(
  secure: boolean,
  autoComplete: string | undefined,
): IconoNombre | undefined {
  if (autoComplete !== undefined && autoComplete in GLIFO_POR_AUTOCOMPLETE) {
    return GLIFO_POR_AUTOCOMPLETE[autoComplete]
  }
  /* `secure` sin `autoComplete` sigue siendo inequívoco: lo que se
     escribe tapado es una clave. */
  return secure ? 'contrasena' : undefined
}


/**
 * EtiquetaFlotante — N11″, **escrita UNA vez para las dos piezas de campo.**
 *
 * 🔴 **Nace al aparecer el segundo consumidor, no antes.** El lote 6 la
 * escribió inline en `Campo` porque era el único caso; hoy `CampoFecha`
 * necesita exactamente lo mismo, y *dos inline que coinciden hoy coinciden
 * por copia — la forma más frágil de coincidir.* Es la misma disciplina con
 * la que nacieron `EtiquetaDeCampo` y `PieDeCampo`, que esta pieza reemplaza
 * y acompaña.
 *
 * ⚠️ **Lo que NO resuelve, a propósito: el CUERPO.** Uno es un `TextInput` y
 * el otro un `<Text>` que muestra una fecha; el que los envuelva decide qué
 * va debajo. *Una pieza que además dibujara el cuerpo tendría dos anatomías
 * y volveríamos al defecto que esto viene a cerrar.*
 *
 * ── LOS DOS ESTADOS ───────────────────────────────────────────────────
 * · **flotando**: rótulo chico arriba (11 px), el cuerpo debajo.
 * · **en reposo**: rótulo a tamaño base, ABSOLUTO y centrado sobre el
 *   cuerpo vacío — así el cuerpo nunca se desmonta ni cambia de alto.
 *
 * ⚠️ **Fuera del árbol de accesibilidad, las tres props juntas.** El
 * control ya dice su nombre por `accessibilityLabel`; esto es el MISMO
 * nombre dibujado. *Medido: con las props sólo en el `View` que envuelve,
 * el nodo seguía en el volcado de `uiautomator`.*
 */
export function EtiquetaFlotante({
  label,
  flotando,
  alto,
}: {
  label: string
  flotando: boolean
  /** El alto del renglón, **ya escalado por la letra del sistema**. Se
   *  pide en vez de calcularse acá para que la pieza y su contenedor usen
   *  EL MISMO número: *dos cálculos de la misma medida divergen el día que
   *  alguien toque uno.* */
  alto: number
}) {
  const { theme } = useTheme()
  const invisibleAlLector = {
    accessible: false,
    accessibilityElementsHidden: true,
    importantForAccessibility: 'no' as const,
  }
  if (flotando) {
    return (
      <Text
        numberOfLines={1}
        {...invisibleAlLector}
        style={{
          fontFamily: typography.family.sans.regular,
          fontSize: TAMANO_ETIQUETA_FLOTANTE,
          lineHeight: alto,
          /* 🔴 `secondary` = `tintaTexto65`, el 65 % que la orden fija como
             piso. `tertiary` da 2,18 en claro y sería exactamente el rótulo
             ilegible que N11′ temía. Medido contra el interior del campo:
             5,26 claro · 7,86 oscuro · 5,26 memorial. */
          color: theme.text.secondary,
        }}
      >
        {label}
      </Text>
    )
  }
  return (
    <View
      pointerEvents="none"
      {...invisibleAlLector}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center' }}
    >
      <Text
        numberOfLines={1}
        {...invisibleAlLector}
        style={{
          fontFamily: typography.family.sans.regular,
          fontSize: typography.size.base,
          color: theme.text.secondary,
        }}
      >
        {label}
      </Text>
    </View>
  )
}

export interface CampoProps
  extends Omit<
    TextInputProps,
    | 'style'
    | 'placeholderTextColor'
    | 'secureTextEntry'
    | 'multiline'
    | 'numberOfLines'
    | 'editable'
    | 'accessibilityLabel'
    | 'accessibilityHint'
  > {
  /** Obligatorio: es el label visible Y el accessibilityLabel. */
  label: string
  /** **N11′ · LA EXENCIÓN DE BÚSQUEDA, y la única.** El campo de búsqueda
   *  no lleva etiqueta: **lupa + placeholder** es el patrón universal, y
   *  *«poner "Buscar" arriba de una lupa es decir dos veces lo mismo»*.
   *
   *  🔴 **`label` SIGUE SIENDO OBLIGATORIO — lo que se apaga es el PÍXEL,
   *  jamás el nombre.** El `accessibilityLabel` se monta igual, así que
   *  quien navega con lector de pantalla oye «Buscar» exactamente como
   *  antes. *Una prop que apagara el label de verdad convertiría la
   *  exención visual de N11′ en un agujero de accesibilidad, y N11′ no
   *  pidió eso.*
   *
   *  **Opt-in, y por eso el default es `true`:** el caso raro se declara;
   *  el caso normal no se puede olvidar. Precedente de la casa:
   *  `SelectorOpcion.etiquetaVisible` (S65).
   *
   *  ⚠️ **CUÁNDO:** solo en búsqueda. Usarlo para «ganar altura» en un
   *  formulario es exactamente lo que la firma prohíbe — *el costo de
   *  altura de N11′ se compensa con **menos campos por pantalla**, jamás
   *  escondiendo rótulos.* */
  etiquetaVisible?: boolean
  /** Helper bajo el campo (`text.secondary` desde S83-B26 — ver la nota
   *  en su render). `error` lo reemplaza en el MISMO slot. */
  ayuda?: string
  /** Mensaje de error (dangerText) — anunciado con liveRegion polite. */
  error?: string
  deshabilitado?: boolean
  /** POR QUÉ está apagado. **La misma prop que `Boton`, con el mismo
   *  contrato: `string`, sin default — la voz es del riel.**
   *
   * 🔴 **Nace por pedido de C (buzón S116, pedido 1) y cierra el último
   * freno mudo de `D-1086`.** El caso vivo es `nexo.tsx`: el campo del
   * asistente se apaga mientras NEXO responde y **no puede decir por qué**.
   * *Un campo apagado que no dice nada manda a la persona a adivinar —
   * exactamente lo que `verify:razon-muda` persigue en los botones, y no
   * hay razón para que un campo esté exento.*
   *
   * SE DIBUJA EN EL PIE, y **gana sobre `ayuda`**: mientras el control está
   * apagado, la ayuda de cómo llenarlo no sirve — lo que la persona
   * necesita saber es por qué no puede. **`error` le sigue ganando a las
   * dos**: si además hay algo mal, eso es lo más urgente.
   * ⚠️ Con `sinPie` **no se dibuja**, igual que `ayuda` y `error` — el
   * compuesto que lo contiene monta su propio `PieDeCampo`. */
  razonDeshabilitado?: string
  /** ☠️ S99-B — `sinCaja` MURIÓ, DEROGADA POR N11 y con su choque
   *  declarado en `caja-de-campo.ts`. Era `true` POR DEFAULT: borde
   *  transparente en reposo y el relleno como única señal —medido, el
   *  interior quedaba a **1.07:1** contra el fondo en claro—. N11 dice
   *  literal *«el relleno gris sólido muere… se contornea lo que se
   *  fija»*. **Costo de la derogación: CERO consumidores** (los
   *  `sinCaja` del árbol son todos de `Boton`, otra prop de otra pieza).
   *  Se deja escrito y no borrado: la próxima sesión que lea la firma de
   *  S81 tiene que encontrar acá por qué ya no rige. */
  /** S83-B1 — NO reserva el pie: lo monta el CONTROL COMPUESTO que lo
   *  contiene, con `PieDeCampo`, para todos sus hijos a la vez.
   *
   *  CUÁNDO: SOLO dentro de una fila donde este `Campo` tiene hermanos
   *  (indicativo + número). Fuera de esa fila, `sinPie` no arregla nada y
   *  rompe la promesa rectora: el mensaje empujaría el layout al aparecer.
   *
   *  ⚠️ EL MODO DE FALLA, dicho porque es silencioso: con `sinPie` este
   *  `Campo` sigue PINTANDO su borde de error —eso no se delega— pero deja
   *  de RENDERIZAR el texto. Si el compuesto no monta `PieDeCampo`, el
   *  usuario ve un borde rojo sin una palabra que explique por qué. Por eso
   *  `verify:diseno` R29 exige que las dos cosas vivan en el mismo archivo:
   *  una verificación cuyo modo de falla es el silencio no es una
   *  verificación (L-192). */
  sinPie?: boolean
  /** Password con toggle ver/ocultar integrado (ocupa el slot iconoDer). */
  secure?: boolean
  /** Líneas visibles — alto FIJO, no auto-grow. */
  multilinea?: number
  iconoIzq?: ReactNode
  iconoDer?: ReactNode
}

export function Campo({
  label,
  etiquetaVisible = true,
  ayuda,
  error,
  deshabilitado = false,
  razonDeshabilitado,
  sinPie = false,
  secure = false,
  multilinea,
  iconoIzq,
  iconoDer,
  ...inputProps
}: CampoProps) {
  const { theme } = useTheme()
  const { t } = useTraduccionUi()
  const [enfocado, setEnfocado] = useState(false)
  const [oculto, setOculto] = useState(true)
  const [textoInterno, setTextoInterno] = useState(false)

  // El color del contorno y el interior salen de la anatomía compartida
  // (`caja-de-campo.ts`): tres piezas, una definición.
  const v5 = formaV5(theme)
  /* 🔴 **LAS MEDIDAS SE LEEN EN CADA RENDER, no del módulo** — el texto
     escala con la preferencia del sistema y los altos tienen que escalar
     con él (ver el porqué medido en `caja-de-campo.ts`). `useWindowDimensions`
     está sólo para que un cambio de configuración vuelva a pasar por acá.
     *Sin él, el valor se leería una vez y se quedaría con la escala del
     arranque, que es el mismo defecto con otra ropa.* */
  useWindowDimensions()
  const medidas = medidasCampoV5(PixelRatio.getFontScale())
  /* 🔴 **LA ETIQUETA FLOTA AL ENFOCAR, NO AL PRIMER CARÁCTER** — y esa
     diferencia es toda la razón por la que la regla rectora sigue
     entera: al enfocar es ANTES de tipear, así que nada se mueve
     mientras alguien escribe. Con el campo ya lleno se queda arriba.
     ⚠️ `value` se lee de las props del input **porque los tres campos del
     encargo son controlados** (medido en `registro.tsx`); para los no
     controlados, el estado interno lo sigue con `onChangeText`. *Leer sólo
     `value` habría dejado la etiqueta plantada encima del texto en
     cualquier campo sin `value`, que es un defecto sin síntoma hasta que
     aparece el primero.* */
  const valorDeProps = typeof inputProps.value === 'string' ? inputProps.value : undefined
  const hayTexto = valorDeProps !== undefined ? valorDeProps.length > 0 : textoInterno
  /* En multilínea la etiqueta flota SIEMPRE: un área de varias líneas no
     tiene un renglón donde el rótulo pueda esperar centrado. */
  const flotando = v5 && (enfocado || hayTexto || !!multilinea)
  const glifo = v5 ? glifoDelCampo(secure, inputProps.autoComplete) : undefined

  /* 🔴 **EN v5 EL ALTO ES UN PISO, NO UNA JAULA — y es la tercera forma de
     esta geometría, con su razón medida.**
     ⏪ Primero fue `height` fijo (48), después `height` derivado de la escala
     de letra… **y el valor SEGUÍA recortándose**: con `height` fijo, si el
     contenido no entra, lo que sobra se corta — y lo que sobra es siempre el
     texto que la persona está escribiendo.
     ⇒ **`minHeight`**: la caja reserva su alto de siempre y **crece si hace
     falta**. *La prioridad es que el texto se lea entero; el resto se
     acomoda* — permiso explícito de la mesa. Con la letra en 1,0 no se mueve
     un píxel, porque el contenido entra en el piso. */
  const altoCampo = multilinea ? multilinea * ALTO_LINEA + spacing[3] * 2 : ALTO

  return (
    <View style={{ opacity: deshabilitado ? opacity.disabled : 1 }}>
      {/* ── S100-B · N11′: LA ETIQUETA SALE DE LA CAJA ────────────────
          ⏪ S99-B la había metido adentro (N11). **La ley se reabrió con
          evidencia y volvió AFUERA Y ARRIBA**: adentro tiene que
          encogerse para dejar entrar el valor, y pierde legibilidad
          justo cuando el campo está lleno — que es cuando la persona
          revisa antes de pagar. La caja vuelve de 62 a **48**, derivada.
          El razonamiento entero vive en `caja-de-campo.ts`.
          ⚠️ El label NO se anima ni flota: la regla rectora de esta
          pieza sigue siendo que nada se mueve mientras alguien tipea —
          y ahora es más fácil de cumplir, porque la etiqueta ya no
          comparte caja con el valor. */}
      {/* ⭐ **N11″ · CON LA GEOMETRÍA v5 LA ETIQUETA NO VA ACÁ AFUERA: VIVE
          ADENTRO Y FLOTA.** El arco entero de esta ley —tres vueltas— y lo
          que esta enmienda contesta y lo que NO, están en la cabecera de
          `caja-de-campo.ts`. El prestador conserva la de N11′, que es lo
          que su gate midió. */}
      {etiquetaVisible && !v5 ? <EtiquetaDeCampo>{label}</EtiquetaDeCampo> : null}

      <Animated.View
        style={{
          ...estiloDeCaja(theme, { error: !!error, enfocado }),
          justifyContent: 'center',
          ...(v5 && !multilinea
            ? { minHeight: medidas.caja, paddingVertical: spacing[2] }
            : { height: altoCampo, paddingVertical: multilinea ? spacing[3] : 0 }),
          paddingHorizontal: spacing[3],
          transitionTimingFunction: cubicBezier(...motion.easing.easeOut.bezier),
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: multilinea ? 'flex-start' : 'center',
            flex: multilinea ? 1 : undefined,
            gap: spacing[2],
          }}
        >
        {/* ⭐ **N11″ · EL DISCO DEL GLIFO.** `iconoIzq` gana sobre la
            derivación: quien lo diga explícito manda. El color sale del
            par `accent.glifo`/`glifoBg`, que ya nombra al CAMPO entre sus
            cuatro empleos — no se elige acá. */}
        {iconoIzq ? (
          <View style={multilinea ? { paddingTop: spacing[1] } : null}>{iconoIzq}</View>
        ) : glifo !== undefined ? (
          <View
            style={{
              width: DISCO_GLIFO_CAMPO,
              height: DISCO_GLIFO_CAMPO,
              borderRadius: radius.full,
              backgroundColor: theme.accent.glifoBg,
              alignItems: 'center',
              justifyContent: 'center',
              ...(multilinea ? { marginTop: spacing[1] } : null),
            }}
          >
            <Icono nombre={glifo} tamano={18} registro="glifo" />
          </View>
        ) : null}

        {/* ⭐ **N11″ · LA COLUMNA DE LA ETIQUETA Y EL VALOR.** Con `flotando`
            son dos renglones (14 + 24 = 38, que es el interior exacto de la
            caja de 54); sin flotar, el rótulo se monta ABSOLUTO encima del
            input vacío y centrado en los mismos 38. *El input nunca se
            desmonta ni cambia de alto: si lo hiciera, el foco se perdería
            al primer carácter y la caja saltaría.* */}
        {/* 🔴 **`minHeight` NO ES DEFENSIVO: SIN ÉL LA COLUMNA COLAPSA A
            CERO Y EL INPUT NO SE DIBUJA.** Medido en `antiparasitario`: la
            caja salía **vacía —sin rótulo y sin campo—** y el defecto
            aparecía **sólo cuando el campo NO tiene glifo**, o sea cuando no
            declara `autoComplete` ni es `secure`. *Con el disco de 32 a la
            izquierda la fila tenía un hijo con alto propio y la columna se
            estiraba con él; sin el disco no hay de dónde sacarlo, y un
            `flex: 1` con `justifyContent: 'center'` se centra sobre cero.*

            ⚠️ **Aislado con dos corridas, y la primera hipótesis era la
            equivocada:** con `minWidth: 0` solo, el input seguía sin
            dibujarse. *El `minWidth` es el reflejo de flexbox que uno
            escribe de memoria; acá lo que faltaba era el alto.*

            ⏪ **Y el defecto no existía antes de N11″**: la columna nació en
            el lote 6 para alojar etiqueta y valor. *Lo destapó el primer
            campo sin glifo que alguien miró.*

            `minWidth: 0` se queda igual, con su propio trabajo: sin él un
            rótulo largo empuja al ojo fuera de la caja en vez de truncarse. */}
        <View
          style={{
            flex: 1,
            minWidth: 0,
            /* 🔴 **ALTO EXPLÍCITO EN v5 — los dos renglones por CONSTRUCCIÓN.**
               38 = etiqueta flotada (14) + línea de entrada (24). *Con el alto
               fijo en la suma de sus dos hijos no hay nada que `center`
               reparta, así que la etiqueta no puede comerle lugar al valor
               pase lo que pase.* ⏪ Acá había un `minHeight` de una sola línea
               y eso dejaba la decisión al reparto — que es de donde salió el
               defecto que el founder vio. */
            /* Sin alto en v5: los dos renglones son sus dos hijos y el
               contenedor mide lo que ellos midan. *Fijarlo era lo que
               permitía que uno le comiera el lugar al otro.* */
            ...(v5 ? null : { minHeight: ALTO_LINEA }),
            justifyContent: 'center',
          }}
        >
        {flotando ? <EtiquetaFlotante label={label} flotando alto={medidas.etiqueta} /> : null}

        <TextInput
          {...inputProps}
          editable={!deshabilitado}
          secureTextEntry={secure && oculto}
          multiline={!!multilinea}
          numberOfLines={multilinea}
          /* 🔴 **S116-B lote 2 · era `text.tertiary` y da 3.28:1** — bajo el
             4.5 que WCAG pide para texto. **Un placeholder no es decoración:
             es lo que la persona lee para saber qué escribir.** `secondary`
             da 5.24 sobre la superficie del campo.
             *Lo señaló la crítica de Impeccable («placeholder needs the same
             4.5:1, not the muted-gray default») y la casa ya había resuelto
             este mismo caso igual en S114: «tres piezas de esta tanda lo
             usaban y las tres pasaron a `secondary`». El token `tertiary` NO
             se toca —sigue siendo placeholder-y-decorativo por doctrina, con
             28 lectores—; lo que cambia es que un placeholder deja de contar
             como decorativo.* */
          placeholderTextColor={theme.text.secondary}
          /* ☠️ **N11″ · EL PLACEHOLDER DE EJEMPLO MUERE en la casa v5** — la
             etiqueta hace ese trabajo, y dos textos grises en el mismo
             renglón son dos. ⚠️ **Con UNA excepción viva**: la búsqueda
             (`etiquetaVisible={false}`), donde N11′ firmó *lupa +
             placeholder* y no hay etiqueta que pueda flotar. *Se apaga acá
             y no en las pantallas: el encargo dice sin que C las toque, y
             además así el que quede olvidado en un diccionario deja de
             dibujarse solo.* */
          placeholder={v5 && etiquetaVisible ? undefined : inputProps.placeholder}
          accessibilityLabel={label}
          accessibilityHint={ayuda}
          onChangeText={(texto) => {
            /* Sólo para el caso NO controlado — ver `hayTexto`. */
            setTextoInterno(texto.length > 0)
            inputProps.onChangeText?.(texto)
          }}
          onFocus={(e) => {
            setEnfocado(true)
            inputProps.onFocus?.(e)
          }}
          onBlur={(e) => {
            setEnfocado(false)
            inputProps.onBlur?.(e)
          }}
          style={{
            /* 🔴 **SIN `flex: 1`, Y ES LA CAUSA DEL DEFECTO QUE EL FOUNDER
               VIO.** Hasta el lote 6 este input era hijo directo de la FILA,
               así que `flex: 1` repartía el **ancho**. El lote 6 lo metió
               dentro de una COLUMNA para alojar la etiqueta — y ahí el mismo
               `flex: 1` pasó a repartir el **ALTO**: la etiqueta y el valor
               se peleaban el mismo renglón. **Medido en el aparato: el input
               caía de 23 dp a 11.**
               *El `flex` no se movió ni cambió de valor: cambió de eje porque
               le cambiaron el padre. Es la clase de defecto que no se ve
               leyendo el diff de la línea, porque la línea no está en el
               diff.*
               El ancho ya lo da la columna: en un contenedor columna los
               hijos se estiran solos. **Multilínea conserva su `flex`**,
               que ahí sí es el alto y es lo que se quiere. */
            flex: multilinea ? 1 : undefined,
            fontFamily: typography.family.sans.regular,
            fontSize: typography.size.base,
            color: theme.text.primary,
            // N11: el alto del input lo da la LÍNEA, no la caja — la caja
            // ahora aloja también la etiqueta y su alto es del contenedor.
            /* Sin alto fijo en v5: **un `height` menor que la línea de texto
               RECORTA el texto en vez de reacomodarlo**, y con la letra del
               sistema agrandada eso es exactamente lo que pasaba. El
               `lineHeight` da la medida y el input la respeta. */
            height: multilinea ? '100%' : v5 ? undefined : ALTO_LINEA,
            lineHeight: v5 && !multilinea ? medidas.linea : undefined,
            paddingVertical: 0,
            textAlignVertical: multilinea ? 'top' : 'center',
          }}
        />

        {v5 && etiquetaVisible && !flotando ? <EtiquetaFlotante label={label} flotando={false} alto={medidas.etiqueta} /> : null}
        </View>

        {secure ? (
          /* ── S104-B · LA PALABRA «Ver» PASA A SER EL OJO ───────────────
             Orden del founder (la referencia web pedía glifo, no palabra).
             El par `ojo`/`ojoTachado` nace en este mismo lote; el censo
             probó que **ninguno de los 52 glifos del registry servía** y
             que ninguno era prestable sin caer en la sustitución genérica
             que la Ley 12 prohíbe.

             🔴 **EL ESTADO SIGUE DICIÉNDOSE, y eso es lo que había que no
             perder.** El texto «Ver»/«Ocultar» comunicaba el estado por sí
             solo; un glifo único obligaría a decirlo por color u opacidad,
             que es peor. Por eso son DOS dibujos: ojo abierto = «tocá para
             ver» · ojo tachado = «tocá para ocultar». *La misma información,
             en menos espacio — no menos información.*

             ⚠️ **EL TARGET SUBE A 44 SIN MOVER EL LAYOUT, y el número no es
             elegido: es derivado.** El glifo se pinta a 20 y el `hitSlop`
             aporta 12 por lado ⇒ 20 + 12·2 = **44** exacto. Medido lo que
             había antes: el texto «Ver» daba ~28×18 y con `hitSlop 8`
             llegaba a ~44×34 — **ancho suficiente y alto corto**. Se
             resuelve con hitSlop y no agrandando la pieza a propósito:
             un Pressable de 44×44 real le comería 44 px de ancho al input
             dentro de una caja de 48, y el campo de clave es justo donde
             menos sobra el ancho.

             La voz accesible NO cambia: siguen `campo.mostrarContrasena` /
             `campo.ocultarContrasena`, que ya decían el ACTO y no el
             dibujo. ☠️ Las claves `campo.ver` / `campo.ocultar` quedan sin
             consumidor — **no se borran en este lote**: son del diccionario
             de `packages/ui` y su retiro es una pasada de Ley 37 propia,
             con su grep. */
          <Pressable
            onPress={() => setOculto((x) => !x)}
            accessibilityRole="button"
            accessibilityLabel={oculto ? t('campo.mostrarContrasena') : t('campo.ocultarContrasena')}
            hitSlop={12}
          >
            <Icono nombre={oculto ? 'ojo' : 'ojoTachado'} tamano={20} registro="tinta" />
          </Pressable>
        ) : iconoDer ? (
          <View style={multilinea ? { paddingTop: spacing[1] } : null}>{iconoDer}</View>
        ) : null}
        </View>
      </Animated.View>

      {/* La precedencia es `error` › `razonDeshabilitado` › `ayuda`, y se
          resuelve acá y no en `PieDeCampo`: ese pie lo montan también los
          compuestos, que no saben si su hijo está apagado. */}
      {sinPie ? null : (
        <PieDeCampo
          ayuda={deshabilitado && razonDeshabilitado ? razonDeshabilitado : ayuda}
          error={error}
        />
      )}
    </View>
  )
}
