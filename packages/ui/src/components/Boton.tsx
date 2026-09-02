/**
 * Boton — primer componente del design system (S43-B3.1).
 *
 * Variantes:
 *   primario    → el botón por defecto de TODO el producto. Fondo tinta
 *                 (text.primary), texto bg.base. Dosis prestador solo conoce este.
 *   marca       → gradientFirmaUI. SOLO dosis alta, contextos cerrados de
 *                 marca (hero onboarding, CTA principal del dueño, momento
 *                 adopción). En memorial el gradiente no existe: degrada a primario.
 *   secundario  → tonal: bg.overlay + texto primario + borde sutil.
 *   ghost       → solo texto, sin fondo. Acciones terciarias.
 *   destructivo → tonal danger (dangerBg + dangerText). NUNCA coral sólido:
 *                 la destrucción no grita, confirma (alma del portal).
 *
 * Motion (receta Software Mansion — CSS transitions de Reanimated, sin
 * worklets): pressed escala a 0.97 con el spring de motion.ts (fast 150).
 * Nada más se anima. Ni color, ni sombra, ni entrada.
 */

import { useEffect, useState, type ReactNode } from 'react'
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  View,
  type ViewStyle,
} from 'react-native'
import Animated, { cubicBezier } from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'
import { CHEVRON } from './chevron'

import { usePresionado } from './usePresionado'
import { Texto } from './Texto'
import { LinearGradient } from 'expo-linear-gradient'

import { typography } from '../tokens/typography'
import { palette } from '../tokens/palette'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { motion } from '../tokens/motion'
import { opacity } from '../tokens/opacity'
import { useTheme } from '../ThemeProvider'

// 'compacto' (S58, Ley 22c): la ACCIÓN SECUNDARIA vestida — borde
// border.default + radius suave + texto tinta + target 44. Jamás
// texto pelado, jamás Celda: comando con consecuencias viste de botón.
// S73 (enmienda 19.7 angosta): PROHIBIDO como acción DENTRO de una fila
// (ahí baja a label con la anatomía de CeldaNavegacion); ghost ídem.
// La caja del compacto migra al tocarse (D-483).
//
// 'sinCaja' (S82-B r5, orden founder — A6 CANDIDATA para el rol
// secundario): el material INTERMEDIO que el censo S81-B ya nombró
// (tinte sin borde, §7): fondo bg.overlay + CERO borde + texto tinta +
// target 44 garantizado por el sistema de tamaños (md 48 · sm compensa
// con hitSlop). CONVIVENCIA DECLARADA: el contorno de 'secundario'
// (Ley 22 TONAL) NO muere todavía — 'sinCaja' se gatea en UNA pantalla
// (bienvenida del cliente); si el founder la firma, muere el contorno
// del secundario y la enmienda a la Ley 22 pasa por la MESA. Hasta esa
// firma, código nuevo sigue usando 'secundario'.
/* ═══════════════════════════════════════════════════════════════════
 * ⭐ LA ESCALA (S99-B · ley aplicada a la pieza, orden de mesa)
 *
 * LA ESCALERA SE BAJA, NO SE ELIGE. Por superficie:
 *  ① EL COMPROMISO — `primario` (`destructivo` si destruye · `acento` si
 *    es momento de marca). **UNO. Exactamente uno.** *Si hay dos, uno de
 *    los dos no era el compromiso.*
 *  ② LA ALTERNATIVA REAL — `secundario`, **solo si la otra rama también
 *    tiene consecuencia** (el par de la Hoja de decisión, D-484).
 *  ③ LO DEMÁS BAJA A LABEL — `ghost`/`sinCaja`: con chevron si NAVEGA,
 *    sin chevron si EJECUTA (19.7).
 *  ④ LA ACCIÓN DE FILA — ☠️ ver la lápida de `compacto`.
 *
 * Y EL TAMAÑO NO ES UNA PERILLA DE ÉNFASIS: `md` es EL botón de la casa
 * (no hace falta declararlo) · `sm` es DENSIDAD, jamás jerarquía ·
 * `bloque` es del PIE (dice «esto cierra la pantalla»), no del énfasis.
 *
 * ── EL CENSO QUE LA PARIÓ (501 botones medidos en `apps/`) ──────────
 * `secundario` **184** > `primario` 146 · `ghost` 62 · **sin declarar
 * 48** · `compacto` 39 · `destructivo` 11 · `sinCaja` 5 · `acento` 4 ·
 * `marca` 2. Tamaños: `md` 415 (por default, **0 explícitos**) · `sm` 83
 * · **`lg` 3**. `bloque` 60.
 *
 * 🔴 **Más secundarios que primarios con 19.7 rigiendo solo puede
 * significar una cosa: la escala se estaba usando como PALETA, no como
 * escalera** — cada pantalla elegía un botón como quien elige un color.
 *
 * 🔴 **Y EL MECANISMO NO ERA INDISCIPLINA — ES ESTA PIEZA (L-244):** el
 * default es `primario`, o sea SÓLIDO ⇒ **48 botones son sólidos sin que
 * nadie lo decidiera**, y los sólidos reales son **211 de 501 (42 %)**.
 * *La escalera se sube sola.* **El default NO se cambia acá**, y es
 * decisión: mover el default re-significaría en silencio los 48 sitios
 * que hoy dependen de él. *Cambiar un default es editar código que nadie
 * abrió.*
 *
 * ☠️ **`lg` (56) TIENE TRES USOS EN 501.** Queda declarado, no tolerado:
 * **gana su caso escrito o muere** (Ley 37). *Un escalón que nadie sube
 * no es una opción: es una trampa esperando a que alguien la use para
 * gritar.*
 *
 * ☠️ **`sinCaja` → `apoyada` (RENOMBRADA, adjudicación de mesa S99).**
 * El nombre mentía y lo confesaba este mismo archivo: *«`sinCaja` NO ES
 * SIN CAJA: tiene `accent.sinCaja`, un slot propio que S82-B r12 le dio
 * JUSTAMENTE para darle presencia de superficie»*. **`apoyada` dice lo
 * que hace:** se apoya con elevación en vez de rellenar.
 *
 * **El viejo sigue aceptado como ALIAS** (5 usos vivos en territorio de
 * C y D) y **congelado por `R48`, solo-baja**. Mismo patrón que
 * `compacto`: se renombra en la pieza, nadie queda bloqueado, y el alias
 * muere cuando el contador llegue a 0.
 *
 * 🔴 **Y LA TRAMPA QUE ESTE RENAME TENÍA, MEDIDA — no es la que se
 * suponía.** El aviso era *«un rename por grep se lleva también el
 * `sinCaja` de `Campo`, que es otra semántica»*. **Medido: la prop de
 * `Campo` ya está MUERTA** (la derogó N11 en esta misma sesión) ⇒ **no
 * hay API que romper.** Lo que un grep ciego habría roto es otra cosa y
 * peor: **sus LÁPIDAS.** `Campo.tsx` dice hoy *«`sinCaja` MURIÓ,
 * DEROGADA POR N11»* — renombrar a ciegas lo convertiría en *«`apoyada`
 * MURIÓ»*, **que es falso**: `apoyada` está viva y es esta variante.
 * *Un rename mecánico no rompe solo código: reescribe el registro de lo
 * que murió, y ese registro es lo único que impide revivirlo.*
 * ═══════════════════════════════════════════════════════════════════ */
export type BotonVariante =
  | 'primario'
  | 'marca'
  | 'secundario'
  | 'ghost'
  | 'destructivo'
  | 'compacto'
  | 'apoyada'
  /** ☠️ ALIAS DEPRECADO de `apoyada` — ver la lápida del rename arriba.
   *  Sigue aceptado porque hay 5 usos vivos en territorio de C y D;
   *  congelado por `R48` (solo-baja) y muere en 0. */
  | 'sinCaja'
  | 'acento'
export type BotonTamaño = 'sm' | 'md' | 'lg'

// md 48 = default: target táctil. sm 36 compensa con hitSlop (target efectivo 44).
const TAMAÑOS: Record<BotonTamaño, { alto: number; padX: number; fontSize: number }> = {
  sm: { alto: 36, padX: spacing[4], fontSize: typography.size.sm },
  md: { alto: 48, padX: spacing[5], fontSize: typography.size.base },
  lg: { alto: 56, padX: spacing[6], fontSize: typography.size.md },
}

export interface BotonProps {
  /** Obligatoria: un botón sin etiqueta no existe (a11y). */
  etiqueta: string
  onPress?: () => void
  /** SOBRE QUÉ SUPERFICIE vive — el MATERIAL, no el color (S84-B19).
   *  Mismo vocabulario y mismos valores que `LogoNegocio.superficie`: la
   *  casa ya había resuelto "esta pieza puede vivir sobre el muro" y se
   *  ENSANCHA su respuesta en vez de inventar otra (L-175).
   *
   *  POR QUÉ PROP Y NO VARIANTE HERMANA: la superficie es ORTOGONAL a la
   *  jerarquía. Un primario, un acento y un ghost pueden todos vivir
   *  sobre el muro; como variantes serían `primarioMuro`, `acentoMuro`,
   *  `ghostMuro`… — la unión se multiplica por dos y cada una repite su
   *  propia jerarquía. Como prop, cruza una sola vez. Y no vuelve
   *  ambigua ninguna otra prop (criterio de B14): no cambia lo que
   *  `variante` SIGNIFICA, cambia la paleta de la que resuelve.
   *
   *  ⚠️ POR QUÉ HACÍA FALTA, con el número que lo prueba: sobre el muro,
   *  `accent.cta` del oficio y el muro son **EL MISMO HEX**
   *  (palette.tealDark #0A7268) ⇒ **contraste 1.00, invisible**. Y en
   *  oscuro NO desaparece (6.57 sobre tealDarkNoche): invisible en dos
   *  temas de tres y legible en el otro es justo el defecto que un gate
   *  en un solo tema no encuentra. §15b.2 ya lo decía —"sobre el muro el
   *  acento funcional es PAPEL"— y hasta hoy la pieza no sabía cumplirlo. */
  superficie?: 'clara' | 'muro'
  variante?: BotonVariante
  tamaño?: BotonTamaño
  /** Full-width. */
  bloque?: boolean
  cargando?: boolean
  deshabilitado?: boolean
  /** Slot de ícono — ReactNode, sin librería acoplada. */
  iconoIzq?: ReactNode
  /**
   * S91-D (cruce declarado a B) — LA FLECHA SE ATA AL ACTO, NO A LA VARIANTE.
   *
   * La flecha ya vivía acá, pero condicionada a `variante === 'acento'`. Y el
   * criterio de la casa es **E14, firmado**: *información DESPLIEGA · acción
   * LLEVA* — `›` es de lo que navega a otra pantalla, no de una variante.
   * Atada a la variante, un PRIMARIO que navega no tenía cómo decirlo, y la
   * única salida era que la pantalla dibujara el path a mano — justo lo que
   * `chevron.ts` prohíbe en su cabecera (*la pieza lo porta; la pantalla usa
   * la pieza, jamás el path suelto*).
   *
   * ⚠️ EL DEFAULT NO SE MUEVE: sin declarar, sigue siendo `acento` y solo
   * `acento`. Ningún consumidor vivo cambia de dibujo — la prop ABRE una
   * puerta, no reescribe una decisión (mismo criterio con el que `compacto`
   * quedó default en `ChipEntidad`: crecer para el uso nuevo, jamás una
   * regresión en los viejos).
   *
   * Caso que la pidió: el CTA «Completá su perfil» del cierre del alta —
   * primario, y lleva al perfil de la mascota recién creada.
   */
  chevron?: boolean
  /**
   * S82-B r14 — EL DESHABILITADO QUE EXPLICA (candidata de C, evaluada y
   * construida). El motivo por el que el botón está apagado. Cuando
   * viene: el botón se pinta apagado PERO SIGUE TOCABLE, el toque NO
   * dispara `onPress` y en su lugar llama a `onRazon`.
   *
   * POR QUÉ VIVE ACÁ Y NO EN LA PANTALLA (lo que decidió construirlo):
   * el workaround obligado era envolver el Boton en un `Pressable` padre
   * —porque un Pressable con `disabled` no recibe eventos— y eso deja
   * **DOS nodos de a11y anidados, los dos `role="button"`**: el padre
   * habilitado con el hint y el hijo deshabilitado adentro. Un lector de
   * pantalla lee el par como dos controles. Desde el componente es UN
   * nodo: `disabled` sigue siendo TRUE en `accessibilityState` (es la
   * verdad del control) y la razón viaja en `accessibilityHint`, así el
   * lector la anuncia AL ENFOCAR — sin depender del toque.
   *
   * ⏪ **S112-B · D-999 — ESTE PÁRRAFO DECÍA LO CORRECTO Y LA PIEZA NO LO
   * HACÍA, y por eso se reescribe en el mismo acto que lo cumple.** Decía:
   * *«NO REEMPLAZA A LA FORMA VISIBLE… lo preferido sigue siendo decirla
   * en la pantalla (un `Texto apoyo` bajo el botón)»* — citando el
   * precedente S63-B (*«el Confirmar apagado dice QUÉ FALTA, SIEMPRE»*) y
   * la enmienda de `SliderPrecio` (S68: la affordance es VISIBLE, no sólo
   * accesible). **Las dos leyes seguían vigentes y ninguna pantalla las
   * cumplía: mandaban el trabajo a 87 sitios que no lo hicieron.**
   *
   * ⇒ **AHORA LA FORMA VISIBLE LA PONE LA PIEZA.** Pasar esta prop DIBUJA
   * el motivo en un `Texto apoyo` bajo el botón —atenuado, nunca `danger`—
   * y su renglón queda reservado para que apagarse y encenderse no salte
   * (N24). *Lo que era una recomendación que había que recordar pasó a ser
   * el comportamiento por default de la pieza.*
   *
   * **Escribila corta y en una línea:** es lo que se lee para DECIDIR, no
   * la explicación de por qué (eso, si hace falta, es N22 con su «i»).
   */
  razonDeshabilitado?: string
  /** Qué hacer cuando tocan un botón apagado con razón: señalar el
   *  campo que falta, abrir un aviso, scrollear a la hilera. Lo decide
   *  la PANTALLA — el componente no elige cómo se cuenta.
   *
   *  🔴 **OPCIONAL, Y DESDE S112-B YA NO GOBIERNA SI LA RAZÓN SE VE.**
   *  Antes era la mitad indispensable de un par: sin ella, `Boton` ni
   *  siquiera daba el hint. Su trabajo real siempre fue el TOQUE —LLEVAR a
   *  donde se resuelve— y estaba de guardia sobre el TEXTO. Un botón que
   *  explica y no tiene a dónde llevar es el caso normal, no un defecto:
   *  pasá `razonDeshabilitado` sola y la línea se dibuja igual. */
  onRazon?: () => void
}

export function Boton({
  etiqueta,
  onPress,
  superficie = 'clara',
  variante = 'primario',
  tamaño = 'md',
  bloque = false,
  cargando = false,
  deshabilitado = false,
  iconoIzq,
  chevron,
  razonDeshabilitado,
  onRazon,
}: BotonProps) {
  const { theme } = useTheme()
  // S63 (D-401, cura en la fuente): el hundimiento vive en LA primitiva
  // usePresionado — la física del mock firmado, memorial-aware adentro.
  const { handlers, estiloPresionado } = usePresionado(0.97)
  const [enfocado, setEnfocado] = useState(false)

  const t = TAMAÑOS[tamaño]
  const inactivo = deshabilitado || cargando
  /* ═══ D-999 · EL BOTÓN DIBUJA SU RAZÓN (S112-B) ═══════════════════════
   * Hasta hoy `razonDeshabilitado` aparecía UNA sola vez en el render, y
   * era `accessibilityHint`. ⇒ **la razón no se dibujaba nunca** — ni con
   * `onRazon` ni sin él. Pasar `onRazon` hacía el botón tocable y le daba
   * hint al lector de pantalla; **no hacía aparecer ninguna palabra.**
   * Medido con control positivo el 1-sep-2026 (el label sí se pinta, así
   * que el instrumento distinguía render de no-render).
   *
   * Desde acá son DOS HECHOS DISTINTOS, y separarlos es la cura:
   *   · `hayRazon` → hay algo que DECIR   ⇒ **se dibuja la línea.**
   *   · `conRazon` → además hay a dónde LLEVAR ⇒ el toque va a `onRazon`.
   *
   * 🔴 **`onRazon` DEJA DE SER CONDICIÓN PARA QUE LA RAZÓN SE VEA**, y ése
   * es el punto: hacía falta para el TOQUE, y estaba gobernando el TEXTO.
   * Un botón que explica sin tener a dónde llevar es el caso normal.
   * Ninguno de los 12 consumidores vivos cambia de comportamiento salvo
   * ganar la línea que ya le estaba pasando a esta pieza. */
  const hayRazon = deshabilitado && !cargando && razonDeshabilitado !== undefined
  // El toque sobre el apagado: como siempre. No rige mientras carga (ahí
  // el motivo es obvio) ni sin `onRazon` (un toque que no lleva a ningún
  // lado sería el mismo botón muerto con más código).
  const conRazon = hayRazon && onRazon !== undefined

  // Regla emil: "loading solo se muestra si la operación supera 150ms;
  // debajo de eso, nada". El spinner aparece recién pasado el umbral
  // (motion.duration.fast); si la operación termina antes, jamás se vio.
  // accessibilityState.busy sí es inmediato — a la a11y no se le miente.
  const [mostrarSpinner, setMostrarSpinner] = useState(false)
  useEffect(() => {
    if (!cargando) {
      setMostrarSpinner(false)
      return
    }
    const timer = setTimeout(() => setMostrarSpinner(true), motion.duration.fast)
    return () => clearTimeout(timer)
  }, [cargando])

  /* ── EL RENGLÓN NO SE DEVUELVE — N24, y por su LETRA, no por su cura ──
   * La ley que sobrevive dice: *un control que cambia de forma según su
   * estado no cambia el tamaño ni el renglón de lo que lo contiene.* Su
   * mitad de cura —«reservá el espacio máximo desde el primer render»—
   * quedó DEROGADA por el gate del founder, y su razón medida era ésta:
   * **el hueco se pagaba en el 100 % de las tarjetas y lo usaba una
   * minoría.**
   *
   * ⇒ Acá la reserva **no se paga de entrada: se LATCHEA.** Un botón que
   * nunca recibió razón no reserva nada y su árbol queda idéntico al de
   * hoy (**87 archivos de `apps/` pasan `deshabilitado={`, 12 pasan razón**
   * — el 86 % no paga un píxel). Uno que YA mostró una razón se queda con
   * su renglón para siempre dentro de ese montaje.
   *
   * ⏪ **ACÁ DECÍA «medido: 96» Y NO LO HABÍA MEDIDO: lo heredé de la ficha
   * de `D-999`.** Medido de verdad el 1-sep sobre `main`, `HEAD` y
   * `origin/pista/s112-c` —los tres— con el criterio literal que la ficha
   * declara (`deshabilitado={` en `apps/`): **87**. No reproduce con
   * ninguna variante razonable (`deshabilitado` suelto en apps: 92 · con
   * `packages/` adentro: 102), así que o el censo original midió otra cosa
   * o el árbol se movió desde S111. **Cuál de las dos es no cambia de quién
   * es el error: escribí «medido» sobre un número que no corrí.**
   * *Un dato heredado del canon se lee exactamente igual que uno medido, y
   * encima viene con autoridad* (`L-166`; lo levantó D encontrando la misma
   * clase en su propio entregable el mismo día).
   *
   * Con eso las dos frases del founder se cumplen a la vez, sin elegir:
   *   · *«si no recibe razón, no dibuja nada»* → nunca latcheó ⇒ nada.
   *   · *«la línea se va y el botón se enciende, sin saltos: el espacio
   *      ya está reservado»* → latcheó ⇒ el renglón queda y nada salta.
   *
   * **El alto no es un número: es el texto real montado invisible**, el
   * mismo truco que el label de esta pieza usa bajo el spinner («preserva
   * el ancho exacto — cero layout shift»). Un `minHeight: 20` copiado del
   * `leading` de `Texto.apoyo` habría sido correcto hoy y falso el día que
   * la razón envuelva a dos líneas, o el día que ese token cambie sin que
   * este archivo se entere. */
  const [razonUltima, setRazonUltima] = useState<string | undefined>(undefined)
  useEffect(() => {
    if (hayRazon) setRazonUltima(razonDeshabilitado)
  }, [hayRazon, razonDeshabilitado])
  /** El texto del renglón: el vigente, o el último que hubo (ya invisible). */
  const renglon = hayRazon ? razonDeshabilitado : razonUltima

  /* «EL BOTÓN SE ENCIENDE CON LA TRANSICIÓN SUAVE DE SIEMPRE» — y el
   * literal dice *de siempre* cuando en realidad **no existía**: el
   * `opacity` de esta pieza era un reemplazo directo. Se construye acá,
   * y **ACOTADA a los botones que explican**, no a los 501 de la casa.
   *
   * 🔴 POR QUÉ ACOTADA, que es una decisión y no una tibieza: re-cronometrar
   * el encendido de todos los botones es un cambio VISIBLE en las dos apps
   * que nadie pidió y ningún gate vería — el mismo argumento con el que
   * esta pieza se niega a mover su `variante` por default (*«cambiar un
   * default es editar código que nadie abrió»*, L-244). Acá el fundido es
   * **parte del mecanismo de la razón**: ata «la razón se fue» con «el
   * botón se encendió», que es justo lo que el founder describió. El día
   * que se quiera para toda la casa, es una línea — y un gate en aparato.
   *
   * Números de la casa, ninguno inventado: `micro` 150 es el registro que
   * el propio token declara para *«crossfade de estado»*; el `transform`
   * conserva EXACTAMENTE su receta de `usePresionado` (fast 150 + spring)
   * porque este objeto pisa su `transitionProperty` y **quien pisa una
   * transición se hace cargo de las dos**. Arrays en orden, que es el
   * contrato de Reanimated 4 (referencia del stack: react-native-best-
   * practices · CSS Transitions).
   *
   * En MEMORIAL no hay fundido: `usePresionado` ya fija que ahí el cambio
   * de estado es reemplazo directo, y esta pieza no abre una excepción. */
  const enciendeSuave = renglon !== undefined && theme.mode !== 'memorial'
  /* ⚠️ TIPADO EXPLÍCITO Y SIN `as const`, y las dos mitades tienen su rojo:
   *  · `as const` los vuelve tuplas **`readonly`**, y la prop de estilo pide
   *    arrays mutables. (Lo levantó C contra su árbol; el mío lo aceptaba —
   *    ver la nota de la divergencia en el parte.)
   *  · sin anotar, `[150, 150]` infiere **`150[]`**, un array de literales que
   *    deja de servir en cuanto una de las dos duraciones cambie.
   * ⚠️ Y VAN SPREADEADOS DENTRO DEL OBJETO DE ESTILO, no como entrada suelta
   * del array: **medido, una entrada que trae SÓLO `transition*` no compila**
   * — el tipo de Reanimated las admite como parte de un estilo, jamás solas. */
  const transicionDeEncendido: {
    transitionProperty: string[]
    transitionDuration: number[]
    transitionTimingFunction: ReturnType<typeof cubicBezier>[]
  } = {
    transitionProperty: ['transform', 'opacity'],
    transitionDuration: [motion.duration.fast, motion.duration.micro],
    transitionTimingFunction: [
      cubicBezier(...motion.easing.spring.bezier),
      cubicBezier(...motion.easing.easeOut.bezier),
    ],
  }

  // En memorial el gradiente firma es transparent (B2): marca degrada a primario.
  const esMarca =
    variante === 'marca' && theme.accent.gradient.colors[0] !== 'transparent'
  /** EL ALIAS SE RESUELVE ACÁ Y EN NINGÚN OTRO LADO: si cada uso de
   *  `varianteEfectiva` tuviera que acordarse de los dos nombres, el
   *  primero que se olvide pinta distinto y nadie lo ve hasta mirarlo. */
  const varianteEfectiva: Exclude<BotonVariante, 'sinCaja'> =
    variante === 'sinCaja'
      ? 'apoyada'
      : variante === 'marca' && !esMarca
        ? 'primario'
        : variante

  // EL MURO NO SALE DEL TEMA (vive en `techo-oficio` de la app), así que
  // sus colores se resuelven ACÁ y no por slot: papel PLENO sobre el
  // muro da 5.51 — el par que TechoOficio ya usa y §15b.2 firmó. El
  // sólido invierte (papel de fondo, muro de tinta) para que el primario
  // siga leyéndose como primario sin usar el teal prohibido.
  const sobreMuro = superficie === 'muro'
  /** 🔴 `Exclude<…,'sinCaja'>` NO ES PROLIJIDAD: es lo que hace que el
   *  alias tenga que estar resuelto ANTES de llegar acá. Con el alias
   *  adentro del `Record`, el compilador pediría una entrada para él y
   *  el día que alguien la agregara habría **dos filas de color para la
   *  misma variante**, libres de divergir sin que nada avise. Así, el
   *  único camino posible pasa por `varianteEfectiva`. */
  const colores: Record<
    Exclude<BotonVariante, 'sinCaja'>,
    { fondo: string; texto: string; borde?: string }
  > = {
    // S63 — enmienda Ley 21 FIRMADA: el primario ancla al SLOT accent.cta
    // (default tinta = idéntico al de siempre; el raíz del prestador lo
    // resuelve a tealDark con ThemeProvider cta="oficio"; memorial
    // SIEMPRE tinta — el slot lo garantiza en la fuente).
    primario:    { fondo: theme.accent.cta, texto: theme.accent.ctaTexto },
    marca:       { fondo: 'transparent', texto: theme.text.onGradient },
    secundario:  { fondo: theme.bg.overlay, texto: theme.text.primary, borde: theme.border.subtle },
    ghost:       { fondo: 'transparent', texto: theme.text.primary },
    // S82-B r12 (hallazgo del founder en dispositivo: "en oscuro casi no
    // se ve, en claro se lava"). ERROR DE r12 SOBRE r5, DECLARADO: en r5
    // le puse `bg.overlay`, que es un token de HOVER (su comentario lo
    // dice) con 19 consumidores — nunca tuvo presencia de control.
    // MEDIDO: el par overlay/fondo daba 1.07 en claro y 1.18 en oscuro, y
    // el tapiz apenas lo movió (1.12→1.07): **el tapiz NO era la causa,
    // la elección del token sí.** Ahora usa su slot propio (`accent.sinCaja`,
    // un paso real de presencia por tema) + `elevacion.reposo` como
    // canal — el precedente exacto es el segmento activo de
    // SelectorSegmentado (superficie apoyada, Chanel: sombra jamás borde).
    apoyada:     { fondo: theme.accent.apoyada, texto: theme.text.primary },
    destructivo: { fondo: theme.status.dangerBg, texto: theme.status.dangerText },
    /* ☠️ ── LÁPIDA DE `compacto` — JUBILADA (S99-B, orden de mesa) ────
     * **EL CONTORNO TRANSPARENTE COMO ACCIÓN MURIÓ EN LA 19.7**, y esta
     * variante ES el contorno transparente: `fondo: 'transparent'` +
     * `borde`. La casa lo tenía escrito **en este mismo archivo** —el
     * bloque de `acento`, abajo, ya la declaraba muerta— y la variante
     * siguió viva con **39 usos**. *Una ley escrita en un comentario y
     * desobedecida cuarenta líneas más abajo, en el mismo archivo.*
     *
     * **QUÉ ERA, medido:** la acción secundaria adentro de una tarjeta —
     * «Ver completo» del acordeón del Hogar, «Ver carnet» de la vacuna,
     * los «agregar» de los pasos del alta. **Las tres NAVEGAN.**
     *
     * **QUÉ LA REEMPLAZA, por lo que la acción HACE (19.7):**
     *  · NAVEGA → label **con chevron** (`ghost` + `chevron`), o
     *    `CeldaNavegacion` si es fila de lista.
     *  · EJECUTA → label **sin chevron** (`ghost`).
     *  · Y si tiene consecuencia de verdad, no era terciaria: sube a ②
     *    `secundario` (Ley 22c).
     *
     * **NO SE BORRA HOY, y es decisión, no tibieza:** 39 sitios vivos en
     * territorio de C y de D. Sacarla del tipo les rompe el typecheck a
     * mitad de sesión. **Se jubila con lápida y su cuenta queda
     * CONGELADA por `R47` (solo-baja)** — el precedente de la casa es
     * `precio_plan` (S79): la lápida mecánica, no el borrado optimista.
     * Muere de verdad cuando `R47` llegue a 0. */
    compacto:    { fondo: 'transparent', texto: theme.text.primary, borde: theme.border.default },
    // ── ACENTO (S84-B18) — EL COMANDO QUE NO COMPITE CON LA FOTO ──────
    // Nace de un rechazo del founder con su razón: un botón SÓLIDO al
    // lado de una foto compite con la foto, y la vitrina existe para
    // mostrar la foto. Sin superficie ni borde; la presencia la da EL
    // COLOR DEL CTA + el peso.
    //
    // POR QUÉ NINGUNA DE LAS SIETE SERVÍA (censo de C, verificado acá):
    //  · `ghost` es la ÚNICA sin superficie, pero su texto va en
    //    `text.primary` — no cumple la Ley 22c (un comando con
    //    consecuencia se NOTA) y la casa ya lo tiene tomado como
    //    terciario.
    //  · `marca` es transparente pero su texto es `onGradient`: solo
    //    vive sobre el gradiente.
    //  · `compacto` es transparente CON borde — y el contorno
    //    transparente como acción está muerto desde la 19.7.
    //  · `sinCaja` NO ES SIN CAJA: tiene `accent.sinCaja`, un slot
    //    propio que S82-B r12 le dio JUSTAMENTE para darle presencia de
    //    superficie. Su nombre quedó viejo (ver la nota de abajo).
    //
    // Y POR QUÉ NO PODÍA RESOLVERSE EN LA PANTALLA: R5 prohíbe
    // `accent.cta` fuera del _layout raíz, y `TextoColor` no tiene
    // registro de CTA (primary|secondary|tertiary|danger|success).
    // Pintarlo desde el consumidor era rojo de lint POR CONSTRUCCIÓN —
    // el hueco estaba acá, no allá.
    /* 🔴 LEELE LA RECETA, NO EL NOMBRE — S100d·bis (H-207).
       **`acento` NO es «el botón del acento»: es LETRA `accent.cta` SIN
       relleno.** En el cliente ese slot es el oro, y el oro **como tinta** no
       llega en ninguna superficie clara:

           ocre sobre carta blanca ………………… 1,70     piso: texto 4,5 · grande 3,0
           ocre sobre el fondo neutro ……… 1,57
           ocre sobre papel algodón ……………… 1,62
           tinta sobre relleno ocre ………… **9,96**  ← `primario`, el otro lado del par

       ⚠️ **Y la casa YA lo tenía escrito donde nace el color:** `ctaOro`
       declara en `palette.ts` *«sobre papel 1.62 NO rige»*. **Esta variante
       hace exactamente eso.**

       🔴 **EL MODO DE FALLA ES ELEGIR POR EL NOMBRE, y se cobró el mismo día
       en que se midió:** otra pista montó `acento` para un CTA creyendo que
       era el oro RELLENO —con el par correcto ya medido y escrito encima— y
       lo cazó este censo antes del gate. *«acento» sonaba a «el del acento».*
       **Si lo que querés es el oro visible, es `primario`.**

       ✅ **En el PRESTADOR sí llega:** ahí el mismo slot resuelve a `tealDark`
       y da **5,37** sobre el fondo. *No es la variante lo que falla: es el
       color que el slot entrega en cada casa* — por eso R56 mira la app y no
       la variante sola. */
    acento:      { fondo: 'transparent', texto: theme.accent.cta },
  }

  // Sobre el muro TODA variante resuelve del par medido: las que traen
  // superficie invierten (papel/muro), las sin caja van en papel pleno.
  // Es una tabla y no un parche por variante: si mañana nace otra, cae
  // acá sola.
  if (sobreMuro) {
    const papel = palette.light0
    const muro = theme.mode === 'dark' ? palette.tealDarkNoche : palette.tealDark
    for (const k of Object.keys(colores) as Exclude<BotonVariante, 'sinCaja'>[]) {
      const traeSuperficie = colores[k].fondo !== 'transparent'
      colores[k] = traeSuperficie
        ? { fondo: papel, texto: muro }
        : { fondo: 'transparent', texto: papel }
    }
  }

  const c = colores[varianteEfectiva]

  // B3.1c — constraint del gradiente v2: la exención WCAG de la cola del
  // gradiente (location 1, teal) vale SOLO si el texto nunca la alcanza.
  // marca garantiza paddingHorizontal ≥ 24 (spacing[6]) en todo tamaño.
  const padX = esMarca ? Math.max(t.padX, spacing[6]) : t.padX

  /** El estilo del cuerpo animado, en UNA pieza: se compone con la transición
   *  o se usa tal cual (ver la nota en el `Animated.View`). */
  const cuerpoAnimado = {
    opacity: deshabilitado ? opacity.disabled : 1,
    borderRadius: radius.md,
    ...(bloque ? { alignSelf: 'stretch' as const } : null),
  }

  const esCompacto = varianteEfectiva === 'compacto'
  const cuerpo: ViewStyle = {
    height: esCompacto ? 44 : t.alto,
    paddingHorizontal: padX,
    borderRadius: esCompacto ? radius.suave : radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing[2],
    backgroundColor: esMarca ? undefined : c.fondo,
    // S82-B r12: `sinCaja` gana la ELEVACIÓN como canal (Ley 20 · el
    // patrón del segmento activo). El fill de un secundario tonal no
    // puede llegar a 3:1 contra el fondo sin volverse primario —medido:
    // ni bajando cinco pasos— así que su canal no es el color: es la
    // superficie apoyada. En memorial y dark la elevación es contacto
    // mínimo por diseño, y ahí manda el tono del slot.
    ...(varianteEfectiva === 'apoyada' ? { boxShadow: theme.elevacion.reposo } : null),
    // S82-B — LA ELEVACIÓN DEL CTA, por SLOT y solo donde hace falta: el
    // oro del cliente da 1.55 contra papel y no se recorta por color, así
    // que su canal es la superficie apoyada (la cura de `sinCaja`). El
    // prestador NO la recibe: su teal no tiene ese problema y el tema de
    // oficio pisa el slot en false — meterla a las dos apps sería arrastre.
    ...(varianteEfectiva === 'primario' && 'ctaElevado' in theme.accent && theme.accent.ctaElevado
      ? { boxShadow: theme.elevacion.reposo }
      : null),
    ...(c.borde ? { borderWidth: theme.border.width, borderColor: c.borde } : null),
    /* ⚠️ ESTA LÍNEA YA NO DECIDE DÓNDE SE PARA EL BOTÓN, y decirlo acá no
       es prolijidad: **es la línea que se cita para diagnosticar mal.**
       Desde la cura del envoltorio (ver el `return`, abajo) el `Pressable`
       vive adentro de un `flexDirection:'row'`, donde `alignSelf` gobierna
       el eje TRANSVERSAL —el vertical—: `flex-start` acá es «arriba», no
       «a la izquierda». **Quien la lea sin el envoltorio a la vista va a
       concluir que el botón no se puede centrar, y va a envolverlo en la
       pantalla** — pasó el mismo día de la cura: una pista escribió TRES
       envoltorios `alignSelf:'center'` citando esta línea por su número.
       *Medido: los escribió contra un árbol que todavía no tenía la cura;
       la observación era cierta y quedó vieja al mergear.*
       ⇒ **Un comentario no frena a un compilador —eso lo aprendimos con
       `destacada`, que se anunciaba NO-OP y se aceptó igual— pero SÍ es la
       herramienta correcta para frenar a un LECTOR, que es el modo de
       falla de acá.** Quien la mueva: el que manda es el envoltorio. */
    ...(bloque ? { alignSelf: 'stretch' as const } : { alignSelf: 'flex-start' as const }),
  }

  /* LA FLECHA DE `acento` (S85-B3) — REBOTE DEL FOUNDER EN SU GATE:
     «creo que no del todo — yo lo sé, pero no sé si cualquier persona lo
     sepa». El diagnóstico es de AFORDANCIA, no de color: sin caja ni
     contorno, lo único que decía "esto se toca" era el PESO, y el peso lo
     lee quien ya sabe que ahí hay un control. Su propuesta —flecha pegada
     al label— es la que se monta acá.

     POR QUÉ VIVE EN LA VARIANTE Y NO EN UNA PROP DE USO: si fuera opt-in,
     la afordancia volvería a ser una decisión por pantalla y el defecto
     reaparecería en el próximo `acento` que alguien monte sin acordarse.
     Y —la razón que terminó de decidir la anatomía— así los CUATRO usos
     vivos la reciben SIN TOCAR UNA LÍNEA de `apps/prestador`, que es
     territorio de otra pista.

     POR QUÉ LA FLECHA NO MIENTE, medido uno por uno y no supuesto: E14
     (FIRMADA) dice que la acción LLEVA cuando «navega a otra pantalla, O
     ABRE EL FORMULARIO QUE LA RESUELVE». Los cuatro consumidores caen ahí
     — `cuenta-comercial:248` hace router.push · el logo de
     `perfil-piezas:508` abre una Hoja · los dos del clip abren el picker
     del sistema. NINGUNO ejecuta en el lugar.

     ⚠️ EL CASO QUE NO EXISTE HOY, declarado en vez de resuelto: un
     `acento` que EJECUTE en el lugar tendría una flecha mentirosa. No le
     construyo escotilla porque no tiene un solo consumidor, y una prop
     sin consumidor DECORA — la misma regla con la que esta casa retira
     guards. El día que aparezca, se construye CON su caso en la mano;
     hasta entonces la condición es: si tu `acento` ejecuta en el lugar,
     no es `acento`.

     ✅ POSICIÓN FIRMADA (founder, 3-ago): **A LA DERECHA del label.** Su
     literal del rebote decía «justo en frente», que se leía DELANTE —y
     así se montó el default— pero también *enfrentada*; las dos se
     montaron en la galería sobre el botón real y su dedo eligió la
     derecha, que además es la convención de "esto lleva a otro lado".
     Con la firma, la prop `flecha` y la posición perdedora se BORRARON en
     el mismo commit, como estaba declarado al nacer: un candidato
     perdedor que sobrevive a su gate se vuelve una opción que alguien va
     a creer disponible (precedente `documentoSello`, misma sesión).

     LA EXCEPCIÓN QUE EL FOUNDER MIDIÓ EN PANTALLA: reportó que en
     «cambiar ícono» la flecha salía a la IZQUIERDA y pidió alinearla. Es
     el botón del LOGO (`miCuenta.logoCambiar` — "Cambiar el logo", el
     único *cambiar-algo* en `acento` y el único sobre el MURO); no existe
     el literal "cambiar ícono" en el repo, así que la atribución es
     lectura mía y queda declarada. No necesitó cura propia: su flecha
     izquierda ERA el default viejo, y fijar la posición lo alinea con los
     otros tres solo — verificado: ningún consumidor pasa `iconoIzq` ni
     nada que pinte a la izquierda.

     ⏪ S91-B · SE LLAMABA `flechaAcento` Y DEJÓ DE SER CIERTO. El nombre
     describía su ÚNICA condición de entonces (`variante === 'acento'`);
     desde que D destrabó `chevron`, la flecha es del BOTÓN y su dueño es
     lo que la acción HACE. Un nombre que sobrevive a su propia condición
     manda a leer el código equivocado — es la misma disciplina con la que
     `mascotaId` pasó a `sujetoId` cuando empezó a llevar personas.

     Geometría: `CHEVRON.derecha` de la casa (S83-B12) a 20px y trazo 2,
     los mismos números que `CeldaNavegacion` y `PieRevelar` — jamás un
     path ni una escala nuevos (L-175). El color sale de `c.texto`, o sea
     del MISMO slot que el label: la flecha es parte del control, no un
     adorno con vida propia, y sobre el muro invierte con él. */
  const flecha =
    (chevron ?? variante === 'acento') ? (
      <View
        style={[
          mostrarSpinner ? { opacity: 0 } : null,
          /* EL "JUSTO" DEL FOUNDER, hecho número: la flecha va PEGADA al
             label, no a distancia de ícono. El contenedor separa todo con
             `spacing[2]`; acá se neutraliza la mitad para dejar
             `spacing[1]` efectivo entre palabra y flecha. */
          { marginLeft: -(spacing[2] - spacing[1]) },
        ]}
      >
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
          <Path
            d={CHEVRON.derecha}
            stroke={c.texto}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    ) : null

  const contenido = (
    <>
      {iconoIzq ? <View style={mostrarSpinner ? { opacity: 0 } : null}>{iconoIzq}</View> : null}
      {/* El label queda montado invisible durante loading: preserva el ancho
          exacto — cero layout shift (equivale a medir y fijar minWidth). */}
      <Text
        numberOfLines={1}
        style={{
          // EL PESO ES LO QUE SEPARA A LAS DOS SIN CAJA: `acento` manda
          // (bold + color de CTA), `ghost` recede (medium + tinta). Sin
          // superficie que las distinga, el peso ES la jerarquía.
          fontFamily: variante === 'acento' ? typography.family.sans.bold : typography.family.sans.medium,
          fontSize: t.fontSize,
          color: c.texto,
          opacity: mostrarSpinner ? 0 : 1,
        }}
      >
        {etiqueta}
      </Text>
      {flecha}
      {mostrarSpinner ? (
        <View style={{ position: 'absolute', alignSelf: 'center' }}>
          <ActivityIndicator size="small" color={c.texto} />
        </View>
      ) : null}
    </>
  )

  /* 🔴 EL ENVOLTORIO QUE DEVUELVE LA ALINEACIÓN AL PADRE (S103-B · D de C).
   *
   * **El defecto, medido:** un `Boton` sin `bloque` forzaba
   * `alignSelf: 'flex-start'` en su propio Pressable, y **`alignSelf`
   * SIEMPRE le gana al `alignItems` del padre** — es la especificación,
   * no un detalle de RN. ⇒ un contenedor que centra **no podía centrar
   * un botón**, y el consumidor se enteraba mirando.
   *
   * **Por qué no alcanzaba curarlo por consumidor**, que es la razón por
   * la que esto sube a la pieza: se curó el 22-ago envolviendo un caso a
   * mano, y **el defecto reapareció veinte líneas más abajo, en el mismo
   * archivo, con un bloque nacido después.** *Una corrección aplicada a
   * un caso no protege al hermano que nace al día siguiente.* Censo al
   * abrir: **22 montajes vivos** dentro de un contenedor que centra.
   *
   * ── POR QUÉ UNA FILA, Y POR QUÉ NO SE PUEDE SIMPLEMENTE BORRAR ─────
   * Borrar el `flex-start` no servía: el default de un contenedor es
   * `stretch`, así que **todos los botones que hoy abrazan su contenido
   * pasarían a ocupar el ancho entero.** No hay un valor de `alignSelf`
   * que diga «no te estires PERO obedecé al padre»: el slot es uno solo
   * y quien lo escribe gana.
   *
   * **La salida es no ocupar el slot.** El envoltorio va SIN `alignSelf`,
   * así que hereda el del padre, y es una FILA para que el botón siga
   * abrazando:
   *   · padre por default (`stretch`) → el envoltorio se estira, el botón
   *     abraza y queda a la izquierda ⇒ **idéntico a hoy, cero regresión**;
   *   · padre que centra → el envoltorio abraza su contenido y **el botón
   *     queda centrado** ⇒ curado;
   *   · padre en fila → el `alignItems` del padre gobierna la vertical,
   *     que es lo que siempre quiso.
   *
   * ⚠️ **`bloque` CONSERVA su `stretch` explícito**, y no es simetría: si
   * heredara, un `bloque` adentro de un contenedor que centra dejaría de
   * ocupar el ancho — que es lo único que `bloque` promete.
   *
   * *Es la misma forma que ya existía escrita a mano en tres pantallas;
   * lo único que cambia es quién se tiene que acordar.* */
  /** LA FILA DEL BOTÓN — tal cual estaba. El renglón de la razón, si
   *  existe, la envuelve más abajo SIN tocarle una línea. */
  const fila = (
    <View
      /* 🔴 `box-none` NO ES PRUDENCIA: con el padre por default el
         envoltorio se ESTIRA a todo el ancho, y un View estirado sin esto
         recibe los toques del aire que sobra a los costados del botón.
         En una columna eso no se nota; sobre un pie flotante taparía lo
         que hay debajo — que es exactamente lo que R54 existe para cazar.
         Con `box-none` la caja no atrapa nada y sus hijos sí. */
      pointerEvents="box-none"
      style={bloque ? { alignSelf: 'stretch' } : { flexDirection: 'row' }}
    >
      <Pressable
        // conRazon: el toque va a `onRazon`, JAMÁS a `onPress` — un botón
        // apagado no ejecuta su acción por explicarse.
        onPress={conRazon ? onRazon : inactivo ? undefined : onPress}
        onPressIn={handlers.onPressIn}
        onPressOut={handlers.onPressOut}
        onFocus={() => setEnfocado(true)}
        onBlur={() => setEnfocado(false)}
        // `disabled` del Pressable mata los eventos; con razón queda vivo
        // para poder contarla (era exactamente por esto que el patrón
        // obligaba a un Pressable padre en la pantalla).
        disabled={conRazon ? false : inactivo}
        hitSlop={tamaño === 'sm' ? (44 - TAMAÑOS.sm.alto) / 2 : undefined}
        accessibilityRole="button"
        // La a11y dice LA VERDAD: sigue deshabilitado aunque acepte el
        // toque — y el hint entrega el motivo AL ENFOCAR, sin exigirlo.
        accessibilityState={{ disabled: inactivo, busy: cargando }}
        accessibilityHint={conRazon ? razonDeshabilitado : undefined}
        accessibilityLabel={etiqueta}
        style={bloque ? { alignSelf: 'stretch' } : { alignSelf: 'flex-start' }}
      >
        <Animated.View
          style={[
            estiloPresionado,
            /* 🔴 SE ELIGE ENTRE DOS OBJETOS COMPLETOS, NO SE SPREADEA UNA
             * CONDICIÓN ADENTRO — y esto NO es estilo: es lo único que compila.
             *
             * `...(cond ? obj : null)` deja las tres `transition*` declaradas
             * como **`?: T | undefined`**, y el tipo de estilo de Reanimated no
             * las acepta así: un `| undefined` explícito no es lo mismo que
             * «ausente». **Medido con su rojo**: el tsconfig de `apps/prestador`
             * lo rechaza con `TS2322` mientras `packages/ui` y `apps/cliente` lo
             * dejan pasar — el mismo defecto es visible en un árbol e invisible
             * en otro, que es por lo que estuvo commiteado en verde.
             *
             * Elegido así, ninguna rama tiene claves opcionales: **una las trae
             * todas presentes y la otra no las tiene.** Y sigue pisando a
             * `estiloPresionado`, que es su razón de ir después. */
            enciendeSuave
              ? { ...cuerpoAnimado, ...transicionDeEncendido }
              : cuerpoAnimado,
            // Focus visible en web (RN-web lo exige): outline accent.active
            Platform.OS === 'web' && enfocado
              ? ({
                  outlineWidth: 2,
                  outlineColor: 'active' in theme.accent ? theme.accent.active : theme.accent.primary,
                  outlineStyle: 'solid',
                  outlineOffset: 2,
                } as unknown as ViewStyle)
              : null,
          ]}
        >
          {esMarca ? (
            <LinearGradient
              colors={[...theme.accent.gradient.colors] as [string, string, ...string[]]}
              locations={[...theme.accent.gradient.locations] as [number, number, ...number[]]}
              start={{ x: 0.13, y: 0 }}
              end={{ x: 0.87, y: 1 }}
              style={cuerpo}
            >
              {contenido}
            </LinearGradient>
          ) : (
            <View style={cuerpo}>{contenido}</View>
          )}
        </Animated.View>
      </Pressable>
    </View>
  )

  /* 🔴 EL BOTÓN QUE NUNCA TUVO RAZÓN DEVUELVE EL MISMO ÁRBOL DE SIEMPRE.
   * No es una optimización: es lo que hace que esta cura no pueda ser una
   * regresión. El envoltorio de S103-B —el que devolvió la alineación al
   * padre— tiene un ensayo entero escrito arriba explicando por qué su
   * forma es exactamente ésa; **envolverlo para todos habría reabierto esa
   * discusión en 501 sitios para servir a 12.** */
  if (renglon === undefined) return fila

  /* ── LA COLUMNA, y por qué `flex-start` y no `center` ────────────────
   * El envoltorio nuevo NO fija `alignSelf`: lo hereda, igual que la fila,
   * así que la cura de S103-B sigue rigiendo (padre que centra → esto se
   * centra como bloque). `alignItems: 'flex-start'` gobierna el eje de
   * adentro y deja al botón abrazando su contenido, idéntico a hoy.
   * **`center` habría sido el error fácil:** con el padre por default
   * (`stretch`) esta columna ocupa todo el ancho, y centrar adentro
   * habría corrido de lugar a todo botón que gane una razón.
   * ⚠️ Consecuencia declarada, no escondida: con un padre que centra y una
   * razón MÁS ANCHA que el botón, el botón queda a la izquierda del
   * bloque. Es el caso que la letra del founder ya acota —*«en una línea
   * corta»*— y va al contrato de C en vez de a una prop nueva. */
  return (
    <View style={bloque ? { alignSelf: 'stretch' } : { alignItems: 'flex-start' }}>
      {fila}
      <View
        style={{
          marginTop: spacing[2],
          /* EL RENGLÓN SE VACÍA, NO SE VA (N24). Invisible pero montado:
             el alto lo pone el texto real —una línea o dos— y no un número
             copiado del `leading` de otra pieza. */
          opacity: hayRazon ? 1 : 0,
        }}
        /* Y VACÍO NO SE LEE: un lector de pantalla que anunciara la razón
           de un botón YA ENCENDIDO estaría diciendo algo falso. Las dos
           props porque son dos plataformas (iOS · Android/web). */
        accessibilityElementsHidden={!hayRazon}
        importantForAccessibility={hayRazon ? 'auto' : 'no-hide-descendants'}
      >
        {/* `apoyo` resuelve a `text.secondary` por default: ATENUADO, y
            jamás `danger` — N23, y la letra del founder: *no es un error
            mío, es un estado*. Sin «i» en círculo, y es lectura de N22, no
            olvido: la «i» es para lo que hace falta para ENTENDER; esto es
            lo que hace falta para DECIDIR, y eso queda a la vista. */}
        <Texto variante="apoyo">{renglon}</Texto>
      </View>
    </View>
  )
}
