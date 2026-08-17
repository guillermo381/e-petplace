/**
 * BarraTabs — la navegación raíz de ambos apps (S43-B3.7).
 * Wrapper visual del sistema para el tabBar custom de expo-router Tabs.
 *
 * ═══════════════════════════════════════════════════════════════════
 * EL GESTO (S99-B): un DISCO relleno que VIAJA bajo el tab activo, con
 * el borde superior de la barra hundiendo un valle a su paso. Es EL
 * elemento activo de la vista raíz — las pantallas bajo tabs no deben
 * usar otro marcador compitiendo.
 *
 * ⏪ Acá decía «el subrayado accent.active (pill 3×18)… aparece con
 * OPACITY, NO se desliza». **El subrayado murió con el disco** y esta
 * cabecera siguió describiéndolo. Se corrige porque la letra vencida de
 * un token es exactamente lo que hizo que esta pieza saliera negra en el
 * gate anterior — ver la nota de `colorBarra`.
 * ═══════════════════════════════════════════════════════════════════
 *
 * INTEGRACIÓN CON EXPO-ROUTER (S44 la enchufa sin pensar):
 *
 *   import { Tabs } from 'expo-router'
 *   import { BarraTabs, type BarraTabsItem } from '@epetplace/ui'
 *
 *   const ITEMS: BarraTabsItem[] = [
 *     { key: 'index',  etiqueta: 'Hoy',    icono: ({ color }) => <IconoHoy color={color} /> },
 *     { key: 'agenda', etiqueta: 'Agenda', icono: ({ color }) => <IconoAgenda color={color} />, badge: 3 },
 *     { key: 'perfil', etiqueta: 'Perfil', icono: ({ color }) => <IconoPerfil color={color} /> },
 *   ]
 *
 *   export default function Layout() {
 *     return (
 *       <Tabs
 *         tabBar={({ state, navigation }) => (
 *           <BarraTabs
 *             items={ITEMS}
 *             activo={state.routes[state.index].name}
 *             onCambiar={(key) => navigation.navigate(key)}
 *           />
 *         )}
 *       >
 *         <Tabs.Screen name="index" />
 *         <Tabs.Screen name="agenda" />
 *         <Tabs.Screen name="perfil" />
 *       </Tabs>
 *     )
 *   }
 *
 *   (los `key` de items = nombres de ruta de expo-router)
 */

import { useEffect, useState, type ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'
import Animated, {
  cubicBezier,
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { typography } from '../tokens/typography'
import { spacing } from '../tokens/spacing'
import { radius } from '../tokens/radius'
import { motion } from '../tokens/motion'
import { useTheme } from '../ThemeProvider'
import { Badge, useEtiquetaBadge } from './Badge'

const AnimatedPath = Animated.createAnimatedComponent(Path)

/** ☠️ EL LADO DE LA DESTACADA — LÁPIDA (S99-B, firma de mesa).
 *
 *  **ATENDER deja de estar destacada permanentemente. `destacada` es
 *  NO-OP: la prop se acepta y no pinta nada.**
 *
 *  **El argumento que la mató, para que nadie la reabra:** con L-251
 *  **ATENDER PUEDE NO EXISTIR** — la barra se compone por capacidad — y
 *  ***un tab que a veces no está no puede ser el centro de gravedad
 *  permanente***. La destacada nació cuando ATENDER era fija; dejó de
 *  serlo **en esta misma sesión**.
 *
 *  Y el defecto que producía, medido contra la barra nueva: con el disco
 *  del activo viajando, **una ATENDER destacada e inactiva dejaba DOS
 *  cosas pidiendo ser el centro** — importancia y ubicación peleando por
 *  el mismo píxel.
 *
 *  ⚠️ **No se borra del tipo:** C y D la pasan hoy y sacarla del tipo les
 *  rompe el typecheck para quitar algo que ya no hace nada. **Sin
 *  ratchet a propósito:** una prop no-op no crece en daño, y poner un
 *  instrumento a vigilar algo inofensivo es instrumento para nadie. Se
 *  retira al tocar cada pantalla.
 *
 *  ⚠️ Y su constante MURIÓ del todo: `DESTACADA_LADO = 44` no la lee
 *  nadie. Se borra en vez de dejarse — *una constante sin consumidor es
 *  la próxima que alguien usa creyendo que significa algo* (Ley 37). */

/** ── EL VALLE Y EL DISCO (S99-B · firma de mesa sobre la referencia) ──
 *  La barra deja de ser un rectángulo con un borde: **es UN SOLO VECTOR
 *  QUE SE DEFORMA.** Su borde superior hunde un valle bajo el tab
 *  activo, y sobre el valle flota un disco del mismo color.
 *
 *  🔴 **EL HUECO SE DISUELVE, Y LO DISOLVIÓ EL COLOR — no se «arregló».**
 *  El founder reportó que *«el espacio en blanco entre el círculo y la
 *  barra NO ESTÁ: pareciera un círculo encima»*, y ordenó medirlo
 *  **después** del cambio de color. Medido, en dos partes:
 *
 *  ① **Por qué no se veía, con aritmética:** el valle bajaba a 18 y el
 *  disco terminaba en `-10 + 28 = 18`. **Tangentes exactos: la
 *  separación era CERO en el punto donde el ojo la busca**, y solo
 *  crecía hacia los costados. Dos formas del mismo color tocándose en su
 *  punto más visible no se leen como dos: se leen como una con un bulto.
 *  *El hueco existía en la fórmula y no en la pantalla.*
 *
 *  ② **Por qué ya no hace falta, y es la propia razón del founder:**
 *  *«podemos dejar en BLANCO la barra de menú **para que se distinga**»*.
 *  El hueco era un recurso para separar **dos formas del mismo color**;
 *  con la barra en `bg.card` y el disco en `accent.activoLleno`, **la
 *  separación la hace el CONTRASTE** (5.51 en el prestador claro). ⇒ el
 *  hueco deja de tener trabajo, y **eso es exactamente lo que libera al
 *  disco para meterse**, que es lo otro que él pidió: *bajo un solo
 *  color, «que haya hueco» y «que salga muy poco» se contradicen —
 *  cuanto más metido el disco, más profundo el valle para despegarlo—.
 *  Bajo dos colores solo sobrevive uno de los dos pedidos, y sobrevive el
 *  que él quiere.*
 *
 *  **Lo que SÍ se conserva de la advertencia ③:** la barra sigue sin
 *  pintar su `View` — el color vive en el vector, para que el valle
 *  recorte de verdad y no quede una caja rectangular por detrás.
 *
 *  **La deformación es ASIMÉTRICA en el camino** (`estira`): el valle se
 *  ensancha hacia el lado del que viene, como una tela tirada. Es lo que
 *  hace que se lea como *un vector deformándose* y no como *un botón que
 *  salta*. */
/** El alto de la fila de tabs (el que ya tenía la barra). */
const ALTO_FILA = 85

/** 🔴 ⏪ LA GEOMETRÍA SE REHIZO ENTERA (gate 3, tres hallazgos del founder
 *  sobre la misma pieza: *«la gráfica aparece dentro del círculo SIN
 *  ESTAR CENTRADA»* · *«me sigue saliendo la palabra ABAJO, sobre la
 *  barra»* · *«el disco debería salir muy poco»*). Los números viejos y
 *  por qué se caen, para que nadie los reponga:
 *
 *  · `DISCO_RADIO` **28 → 18**. El disco de 28 nació para CONTENER al
 *    ícono Y a su etiqueta, y esa premisa **no cierra geométricamente**:
 *    censadas las etiquetas vivas (`Hogar · Explorar · Despensa · Cuenta`
 *    y `Hoy · Datos · Negocio · Atender`), la más ancha es **«Despensa»
 *    ≈ 49 px** a `size.xs`, y **la cuerda útil de un círculo de 56 a la
 *    altura del renglón es 43,7 px**. No entra, y subir el radio a 32
 *    para que entre justo deja un disco de 64 px en una fila de 56.
 *    ⇒ **el disco deja de ser un contenedor y vuelve a ser lo que el
 *    founder nombró: «el círculo que marca el seleccionado».** Marca al
 *    ícono; la etiqueta se queda con él, debajo, donde siempre estuvo.
 *
 *  · `DISCO_ALZA` (el centro POR ENCIMA del borde) **muere y nace
 *    `DISCO_ASOMA`**, que declara la única cosa que el founder pidió: *
 *    **cuánto sobresale**. El centro se DERIVA. Con la forma vieja, un
 *    centro «arriba» obligaba a que el disco asomara al menos su radio
 *    entero — *por eso siempre se veía «encima» y nunca «metido»: no era
 *    un ajuste fino, era que la fórmula no podía expresar lo que él
 *    pedía*. */
const DISCO_RADIO = 33
/* ☠️ `VALLE_HONDO` MURIÓ (Ley 37): el fondo del valle **ya no se elige**,
 *  se DERIVA de `DISCO_CY + DISCO_RADIO + ANILLO`. Un número suelto podía
 *  quedar más arriba o más abajo que el disco y romper la separación
 *  uniforme — que es justo lo que el gate reportó como «el hueco está muy
 *  pequeñito». */
/** 🔴 EL ANILLO DE FONDO — el pedido literal del founder:
 *  *«no dejó espacio en blanco entre la barra y el círculo: se
 *  debería ver el fondo alrededor del círculo»*. El cuerpo se dibuja
 *  con `fillRule="evenodd"` y un subpath circular MÁS GRANDE que el
 *  disco: la diferencia entre los dos radios **es** el anillo, y lo
 *  que se ve por ahí es el fondo de la pantalla —sea cual sea—.
 *  *Mismo principio que la advertencia ③: el hueco existe por
 *  AUSENCIA de material, jamás pintándolo de un color supuesto.* */
const ANILLO = 10
/** El centro del disco, DERIVADO. Positivo = hacia abajo desde el borde
 *  superior de la barra. */
/** 🔴 EL CENTRO DEL DISCO SE DERIVA DEL ANILLO, no del asomo. **Invertir
 *  la dependencia es la cura de «el hueco está muy pequeñito»:** antes el
 *  anillo era lo que SOBRABA entre el disco y el valle; ahora es un número
 *  declarado y lo que sobra es cuánto asoma.
 *  `hondo` = 0,76 del alto (proporción medida de la referencia). */
/** 🔴 LO QUE QUEDA DE BARRA DEBAJO DEL VALLE — **absoluto, no cociente**,
 *  y es la segunda vez en la misma tanda que la lección cobra: copiar el
 *  0,76 de la referencia era la misma trampa que copiar su 0,46 de anillo.
 *  Medido: la referencia deja **19 px sobre una barra de 402 de ancho** ⇒ a
 *  nuestra escala, 15,5. *Lo que hace que la barra se lea entera no es qué
 *  FRACCIÓN sobra: es cuánta barra QUEDA.* */
const BAJO_VALLE = 15.5
const DISCO_CY = ALTO_FILA - BAJO_VALLE - ANILLO - DISCO_RADIO
/** Cuánto sobresale el disco por encima del borde superior de la barra.
 *  *«Que salga muy poco»* — 4 de 36 (11 %). */
/** Cuánto asoma — **DERIVADO**. Medido de la referencia: 0,10 del
 *  diámetro. Con anillo 9 y barra 86 sale ~0,18, y ése es el precio de
 *  tener un disco de 68 en una barra de 86 (ver la nota del contrato). */
const DISCO_ASOMA_DERIVADO = DISCO_RADIO - DISCO_CY
const DISCO_ASOMA = DISCO_ASOMA_DERIVADO
/** El valle: una cuna, ya no un separador. **Su trabajo cambió con el
 *  color** — ver la nota del hueco. Más ancho que el disco a propósito:
 *  lo que se ve del valle son los HOMBROS, la caída del blanco a cada
 *  lado del disco. */
const VALLE_RADIO = 50
/* 🔴 LAS MONTAÑAS — EL DISCO **CAE** SOBRE LA BARRA, NO SE RECORTA DE ELLA
 *  (firma del founder, y es un cambio de MODELO, no de calibración):
 *  *«no es como si yo extrajera un círculo de la barra, sino que el círculo
 *  CAE en la barra… los bordes se deforman hacia el lado contrario, y ese
 *  efecto CUANDO GIRA de un lado a otro es lo que quiero. No era el círculo
 *  en sí mismo, es EL EFECTO QUE GENERA EL MOVIMIENTO.»*
 *
 *  ⇒ una piedra sobre una tela: se hunde donde cae y **la tela se levanta a
 *  los lados, porque la materia tiene que ir a algún lado.** Las montañas
 *  son el DESPLAZAMIENTO de lo que se hundió — un molde no las tiene, una
 *  tela sí.
 *
 *  ⏪ **Y por eso son MÁXIMAS EN VIAJE y MÍNIMAS EN REPOSO**, exactamente al
 *  revés de la joroba fija que se venía pidiendo. *Nadie midió mal: yo medí
 *  el video EN REPOSO —y en reposo no hay montañas— y el founder las ve
 *  MIENTRAS SE MUEVE. Se midió el cuadro equivocado.* Mi propia letra ya
 *  decía «la saliente escala con el estirón»; la corrección la enderezó
 *  hacia una joroba fija y ahí se perdió.
 *
 *  Los números son ALTURA VISIBLE. El control de la cúbica se calcula con
 *  la regla de 9/4 (una cúbica llega a 4/9 de su control), que es lo que
 *  hizo que la joroba anterior midiera 2,2 px declarando 5. */
const MONTANA_REPOSO = 2
const MONTANA_VIAJE = 9
/** 🔴 LA BARRA FLOTA — sexta corrección del gate: *«el espacio alrededor
 *  ya funciona, pero lo dejó EN BLANCO. Debería ser el VERDE DEL FONDO.»*
 *
 *  **El recorte estaba bien y el diagnóstico de mesa lo confirmó:** el
 *  hueco mostraba blanco **porque detrás había blanco** — la barra estaba
 *  APOYADA, no flotando, así que el `evenodd` dejaba ver la base. *L-252
 *  se cumplió; lo que faltaba no era el corte, era el CONTENEDOR.*
 *
 *  Con márgenes, lo que se ve por el anillo y alrededor de la barra es el
 *  fondo real de la pantalla — que en el prestador es su verde. */
const MARGEN_BARRA = spacing[4]
/** El radio del cuerpo flotante. `radius.xl` es el escalón que la casa usa
 *  para superficies grandes apoyadas; no nace un número nuevo. */
const RADIO_BARRA = radius.xl
/** ── EL BLOQUE DE LA TAB, CON ALTURAS DECLARADAS ────────────────────
 *  🔴 **Están fijas a propósito, y ésa es la cura del tercer hallazgo**
 *  (*«la gráfica aparece dentro del círculo SIN ESTAR CENTRADA»*). Antes
 *  el ícono descansaba donde lo dejara `justifyContent: 'center'` —o sea
 *  **en una posición que dependía del alto de línea de la etiqueta**— y
 *  la subida al disco era un número elegido a mano. Dos cosas que tenían
 *  que coincidir, calculadas por caminos distintos: **descentrarse era
 *  cuestión de tiempo, no un accidente.**
 *
 *  Ahora el reposo del ícono se DERIVA de las alturas, y la subida se
 *  deriva del reposo. *Si mañana cambia el renglón, el ícono sigue
 *  cayendo en el centro del disco sin que nadie se acuerde de esto.* */
const ALTO_CAJA_ICONO = 18
const ALTO_RENGLON = 14
const GAP_BLOQUE = spacing[0.5]
/* ☠️ `REPOSO_ICONO_CY` MURIÓ (Ley 37): existía para centrar el ÍCONO en
 *  el disco, y el activo ya no lleva ícono — lleva su nombre. La subida
 *  ahora se deriva del centro de la FILA contra el centro del disco, que
 *  es lo que corresponde cuando lo que sube es una sola línea de texto. */
/** Cuánto sube el bloque ENTERO (ícono + etiqueta) cuando la tab está
 *  activa. **El bloque no se parte**: ése era el defecto que el founder
 *  vio como *«la palabra abajo y la gráfica arriba»*.
 *
 *  **Derivado de las dos condiciones a la vez:** el disco asoma lo que se
 *  declaró (`DISCO_ASOMA`) **y** el ícono cae en su centro exacto. */
const SUBIDA_ACTIVA = ALTO_FILA / 2 - DISCO_CY
/** El cuerpo se dibuja MÁS ANCHO que la pantalla y viaja por transform
 *  (ver la nota del viaje). Con un margen de un ancho a cada lado, ningún
 *  desplazamiento posible descubre un borde. */

/** El path del cuerpo con su valle. Worklet: lo corre el hilo de UI en
 *  cada frame del viaje. */
/** 🔴 EL VIAJE Y EL ESTIRÓN SE SEPARARON, Y NO ES REFACTOR (S99-B, tras
 *  el 3er hallazgo del founder: *«NO HACE TRANSICIÓN, SALTA»*).
 *
 *  **Lo medido primero, porque el diagnóstico no se adivina:** el defecto
 *  visible NO estaba solo acá — el disco iba de -46 a +6, o sea **11 %
 *  adentro**, y un objeto que vive casi afuera del menú *parece* saltar
 *  aunque interpole. Esa mitad se curó en la geometría.
 *
 *  **La otra mitad es de TRANSPORTE, y no la puedo verificar desde acá:**
 *  si la posición viaja animando la cadena `d` de un `Path`, depende de
 *  que `react-native-svg` propague esa prop por el hilo de UI en cada
 *  frame — y **eso solo se comprueba en aparato**. ⇒ **la posición deja
 *  de depender de eso.**
 *
 *  · **EL VIAJE es un `transform` sobre el grupo entero** — el mecanismo
 *    más sólido que hay, el mismo que ya mueve todo lo demás de la casa.
 *  · **EL ESTIRÓN sigue animando `d`** — y si esa prop no interpolara en
 *    algún dispositivo, **se pierde la deformación, jamás el
 *    movimiento**.
 *
 *  *Una animación de dos capas donde la crítica cuelga de la frágil no es
 *  una animación arriesgada: es una que ya falló y todavía no lo sabés.*
 *
 *  El cuerpo se dibuja en coordenadas LOCALES —el valle en `x = 0`— y se
 *  extiende un ancho a cada lado, para que ningún desplazamiento
 *  descubra un borde. */
/* 🔴 ⏪ EL CUERPO DEJÓ DE VIAJAR, y es consecuencia de que FLOTE.
   Antes el grupo entero se trasladaba y el cuerpo se dibujaba más ancho
   que la pantalla para que ningún borde se descubriera. **Con un cuerpo
   flotante eso es imposible: sus esquinas redondeadas son puntos fijos de
   la pantalla y no pueden moverse con el valle.**
   ⇒ el cuerpo queda QUIETO y **el valle y su hueco viajan DENTRO del
   `d`**, que es el mecanismo que la nota anterior evitaba. *La mitigación
   se conserva y es la que importa: **el DISCO sigue viajando por
   transform**, así que si algún día `d` no interpolara en un dispositivo,
   se perdería la deformación del valle — jamás el movimiento del
   marcador.* */
function pathBarra(ancho: number, alto: number, estira: number, cx: number) {
  'worklet'
  const rc = Math.min(RADIO_BARRA, alto / 2)
  /* 🔴 EL TRAMO QUE RODEA AL DISCO ES UN ARCO CONCÉNTRICO, y volvió después
     de que la comparación lado a lado lo probara: con una U de bézier **el
     valle era más ANGOSTO que el disco a la altura de su ecuador**, así que
     no había anillo — el disco quedaba APOYADO ENCIMA del blanco. *Una
     curva libre no puede garantizar una separación; una concéntrica sí, por
     construcción.*
     Su radio se DERIVA (disco + anillo), que es lo que hace que el hueco
     mida lo mismo en todo el arco. */
  const R = DISCO_RADIO + ANILLO
  // dónde el borde del hueco cruza la línea superior de la barra
  const xe = Math.sqrt(Math.max(R * R - DISCO_CY * DISCO_CY, 1))
  const sesgo = Math.max(-1, Math.min(1, estira)) * 12
  /* LOS HOMBROS — el despegue TANGENCIAL y ancho que la referencia muestra
     (baja un píxel a lo largo de seis antes de lanzarse). Se acotan contra
     la esquina redondeada: en el primer y último tab el valle pedía barra
     donde ya no hay (defecto A). */
  const izq = Math.max(cx - xe + sesgo, rc)
  const der = Math.min(cx + xe + sesgo, ancho - rc)
  const hombroI = Math.max(izq - VALLE_RADIO, rc)
  const hombroD = Math.min(der + VALLE_RADIO, ancho - rc)
  // el arco inferior, en dos cúbicas simétricas con control calculado
  const a0 = Math.atan2(-DISCO_CY, -xe)
  const a1 = Math.PI / 2
  const k = (4 / 3) * Math.tan((a1 - a0) / 4) * R
  const px = (a: number) => cx + sesgo + R * Math.cos(a)
  const py = (a: number) => DISCO_CY + R * Math.sin(a)
  const tx = (a: number) => -Math.sin(a)
  const ty = (a: number) => Math.cos(a)
  const a2 = Math.PI - a0
  /* La montaña del lado HACIA EL QUE VIAJA crece más: es el material que el
     disco viene empujando. La de atrás queda en su altura de reposo — así
     el movimiento se lee en la FORMA, no solo en la posición. */
  const e = Math.max(-1, Math.min(1, estira))
  const mIzq = MONTANA_REPOSO + Math.max(0, -e) * (MONTANA_VIAJE - MONTANA_REPOSO)
  const mDer = MONTANA_REPOSO + Math.max(0, e) * (MONTANA_VIAJE - MONTANA_REPOSO)
  return [
    `M0 ${alto - rc}`,
    `V${rc}`,
    `a${rc} ${rc} 0 0 1 ${rc} ${-rc}`,
    `H${hombroI}`,
    /* EL HOMBRO IZQUIERDO CON SU MONTAÑA. El control va en `-m*9/4` porque
       una cúbica llega a 4/9 de su control: si se escribiera la altura
       deseada, se dibujaría menos de la mitad. */
    `C${hombroI + (izq - hombroI) * 0.55} ${-mIzq * 2.25} ${izq - (izq - hombroI) * 0.3} ${-mIzq * 0.6} ${izq} 0`,
    `C${px(a0) + k * tx(a0)} ${py(a0) + k * ty(a0)} ${px(a1) - k * tx(a1)} ${py(a1) - k * ty(a1)} ${px(a1)} ${py(a1)}`,
    `C${px(a1) + k * tx(a1)} ${py(a1) + k * ty(a1)} ${px(a2) - k * tx(a2)} ${py(a2) - k * ty(a2)} ${der} 0`,
    `C${der + (hombroD - der) * 0.3} ${-mDer * 0.6} ${hombroD - (hombroD - der) * 0.55} ${-mDer * 2.25} ${hombroD} 0`,
    `H${ancho - rc}`,
    `a${rc} ${rc} 0 0 1 ${rc} ${rc}`,
    `V${alto - rc}`,
    `a${rc} ${rc} 0 0 1 ${-rc} ${rc}`,
    `H${rc}`,
    `a${rc} ${rc} 0 0 1 ${-rc} ${-rc}`,
    `Z`,
  ].join(' ')
}

/** EL OVERSHOOT DE LA HUELLA — **FIRMADO** (mesa 14-ago-2026). Envuelve
 *  el ícono y le da un rebote corto cuando la tab pasa a activa: la
 *  huella no solo aparece, LLEGA.
 *
 *  ⏪ NACIÓ COMO PROP DE GATE APAGADA (`overshootHuella`) porque
 *  `DIRECCION_ARTE` §5.4 lo listaba como CANDIDATA SIN FIRMA mientras el
 *  Norte lo daba por vocabulario cerrado — dos letras que se
 *  contradicen. **La mesa firmó y la prop MURIÓ en el mismo acto**: el
 *  valor vive en la pieza y el consumidor no re-decide (Ley 37, y era la
 *  condición de muerte que la propia prop tenía escrita).
 *
 *  🔴 SU EXCEPCIÓN, que sobrevive a la firma y por eso queda escrita:
 *  N10 declara «UN bezier (.32,.72,0,1)» y en la misma frase pide
 *  overshoot. **Un overshoot con esa curva no hace overshoot** — termina
 *  en 1 y no lo pasa. Usa `motion.easing.spring` [.34, 1.56, .64, 1],
 *  que existe desde v3.1 para «confirmaciones táctiles»: no se inventó
 *  una curva, se usó la que la casa ya tenía. *El defecto estaba en el
 *  Norte, no en la pieza, y la mesa lo adoptó como ley mejor.*
 *
 *  Memorial y reduce-motion quedan QUIETOS por el mismo par que usan
 *  `PuertaDeOficio` y `Destape` — en memorial nada rebota (Ley 8), y esa
 *  regla no la puede saltear una candidata. */
function HuellaDeTab({ activa, children }: { activa: boolean; children: ReactNode }) {
  const { theme } = useTheme()
  const reduceMotion = useReducedMotion()
  const quieto = theme.mode === 'memorial' || reduceMotion
  const v = useSharedValue(activa ? 1 : 0)

  useEffect(() => {
    if (quieto) {
      v.value = activa ? 1 : 0
      return
    }
    v.value = withTiming(activa ? 1 : 0, {
      duration: motion.duration.overshootTab,
      // La curva del rebote — la de la casa termina en 1 y no puede
      // hacer overshoot (el choque declarado en la prop).
      easing: Easing.bezier(...motion.easing.spring.bezier),
    })
  }, [activa, quieto])

  const estilo = useAnimatedStyle(() => ({
    transform: [{ scale: quieto ? 1 : 1 + v.value * 0.06 }],
  }))

  return <Animated.View style={estilo}>{children}</Animated.View>
}

export type BarraTabsItem = {
  /** = nombre de ruta de expo-router. */
  key: string
  etiqueta: string
  /** Icono outline — recibe color del estado y `activa` (S53 §2.6:
   *  en el lenguaje b′ la tab activa se marca porque su huella APARECE). */
  icono: (estado: { color: string; activa: boolean; colorHuella: string }) => ReactNode
  /** Contador entero — "3 pendientes" del prestador. */
  badge?: number
  /** S97+-B · EL DESTINO CENTRAL (firma de arquitectura, mesa 13-ago):
   *  Mostrador sube de chip a TAB, y la tab de atender es el destino
   *  destacado de la barra del prestador.
   *
   *  LA PIEZA NO ELIGE CUÁL: la declara quien la monta, igual que
   *  `badge`. La composición por capacidad —titular con local ve cuatro,
   *  recepción tres, profesional puro dos, vendedor puro tres— es del
   *  app, que es el único que sabe qué puede cada quien. Meter esa
   *  decisión acá sería que `packages/ui` leyera roles.
   *
   *  SU FORMA, y por qué NO es un color: la destacada gana SUPERFICIE y
   *  un paso de tamaño, jamás un acento propio. N5 manda un acento por
   *  pantalla y en esta barra ya está tomado —la huella de la tab activa
   *  ES `accent.active` desde §2.6—, así que pintar la central de color
   *  pondría dos acentos peleando, y el que perdería es el que dice
   *  DÓNDE ESTOY. *Destacar no es competir con el estado: es pesar más
   *  en reposo.* */
  destacada?: boolean
}

export function BarraTabs({
  items,
  activo,
  onCambiar,
  estadoPorHuella = false,
  acento,
}: {
  /** 2 a 5 tabs.
   *
   *  ⏪ S97+-B — DECÍA «3 a 5» y la composición por capacidad la dejó
   *  falsa: el **profesional puro** ve DOS (Hoy · Cuenta). No es un caso
   *  hipotético — es uno de los cuatro perfiles de la firma del 13-ago.
   *  Se corrige acá, en el contrato, y no solo en la lámina: un rango
   *  que excluye un perfil vivo es la clase de letra que alguien cita
   *  para «arreglar» una barra que está bien. */
  items: BarraTabsItem[]
  activo: string
  onCambiar: (key: string) => void
  /** S53 (DIRECCION_ARTE §2.6): con el set b′ la HUELLA es el sistema
   *  de estado — aparece en la tab activa y el pill NO se renderiza
   *  (sin recuadros, sin pills). La huella activa hereda el rol de
   *  accent.active: sigue siendo EL elemento activo de la vista. */
  estadoPorHuella?: boolean
  /** ☠️ `huellaEnDisco` MURIÓ CON SU CONDICIÓN DE MUERTE CUMPLIDA
   *  (S99-B). Nació como prop de gate con las DOS ramas construidas
   *  porque el founder las había firmado por adelantado; el veredicto
   *  llegó y fue **SIN HUELLA, definitivamente — gana el dinamismo**.
   *
   *  ⇒ la rama ganadora se queda en la pieza y la prop se retira, que era
   *  exactamente lo que su ficha decía que iba a pasar (precedente
   *  `overshootHuella`). *Una prop de gate que sobrevive a su gate es una
   *  perilla que nadie firmó.*
   *
   *  **Y la huella no muere de la casa: muere de ACÁ.** Sigue siendo la
   *  marca donde significa; en esta barra el marcador es el disco, y dos
   *  marcadores del mismo estado no conviven. */
  /** PROP DE GATE — override del acento de la tab activa. Default:
   *  `accent.active`, que desde S83-B13 es SLOT y ya resuelve por casa
   *  (pink el cliente · el verde del oficio en sus dos registros).
   *
   *  SU PRIMER GATE YA SE FIRMÓ Y LA PROP SOBREVIVIÓ AL CAMBIO DE
   *  PREGUNTA, así que su letra se corrige en vez de dejarla mintiendo:
   *  nació (B11) para arbitrar magenta-vs-teal, y el founder firmó el
   *  verde en dispositivo. Lo que queda abierto es CUÁL verde, y para eso
   *  sigue haciendo falta montar la BARRA REAL con los tres candidatos
   *  (tealDark · puro · el par) uno al lado del otro — cosa que el slot,
   *  por definición, no puede hacer: resuelve UNO por tema.
   *
   *  ☠️ MUERTE: con la firma del REGISTRO. Gane el que gane, el valor
   *  vive en el slot y esta prop se borra en ese mismo acto — la API de
   *  una lámina no sobrevive a su lámina (Ley 37). */
  acento?: string
}) {
  const etiquetaBadge = useEtiquetaBadge()
  const { theme } = useTheme()
  const insets = useSafeAreaInsets()

  /** LA INVARIANTE DE LA BARRA: **una sola destacada**. «Destino
   *  central» en plural no significa nada — dos tabs pesando igual es
   *  ninguna pesando.
   *
   *  Por qué un aviso de DEV y no un rebote: la barra es la navegación
   *  raíz, y una barra que no monta deja la app sin piso. Un warning en
   *  desarrollo llega a quien la compone, en el momento en que la
   *  compone; un throw en producción castiga al usuario por un error de
   *  quien la montó. *(Si algún día `destacada` pasa a ser prop de la
   *  BARRA en vez del ítem, este estado se vuelve inexpresable y este
   *  guard muere — que sería mejor. Hoy no se hace porque el consumidor
   *  arma la lista con spreads condicionales por capacidad, y ahí la
   *  marca viaja NATURALMENTE con el ítem que puede o no existir.)* */
  if (__DEV__) {
    const destacadas = items.filter((i) => i.destacada === true)
    if (destacadas.length > 1) {
      console.warn(
        `[BarraTabs] ${destacadas.length} tabs marcadas como \`destacada\` (${destacadas
          .map((d) => d.key)
          .join(', ')}). El destino central es UNO: dos pesando igual es ninguna pesando. Se destacan todas — la pieza no elige por vos.`,
      )
    }
  }
  const accentActive = acento ?? ('active' in theme.accent ? theme.accent.active : theme.accent.primary)

  /** El ancho se MIDE (onLayout): el valle viaja al centro del tab
   *  activo, y con la barra compuesta por CAPACIDAD (L-251) la cantidad
   *  de destinos es variable. **Nada se calcula contra «4 tabs»** — ésa
   *  era la objeción ③, y se resuelve derivando en vez de hardcodear. */
  /** ☠️ `estadoPorHuella` QUEDA NO-OP (S99-B). Nació para decir «el pill
   *  muere, la huella ES el estado» — y **con el disco ya no hay pill que
   *  matar ni subrayado que condicionar**: el marcador es uno solo y no
   *  es opcional. Se acepta para no romper a C y a D; se retira al tocar
   *  cada layout. */
  void estadoPorHuella

  /** 🔴 LOS DOS COLORES DE LA BARRA — firma del founder en el gate 3.
   *
   *  ⏪ **MI ERROR, DECLARADO, porque su causa vale más que el color:** la
   *  vuelta anterior puso la barra ENTERA en `theme.bg.tinta` justificando
   *  que *«es el mismo token con el que `TechoOficio` pinta su muro»*. **Es
   *  falso, y era verificable con un grep.** `TechoOficio` pinta con
   *  `useMuroOficio()` → `tealDark`/`tealDarkNoche` (`techo-oficio.tsx:47`);
   *  `bg.tinta` es `palette.tinta` **#221E19**, o sea negro cálido — que es
   *  literalmente lo que el founder vio: *«lo puso prácticamente en
   *  NEGRO»*.
   *
   *  **Y la causa no fue distracción: fue creerle a un comentario.** El
   *  slot se llama a sí mismo *«S58: el techo del prestador»* en los tres
   *  temas, y la galería repite el rótulo. **Desde S61-B12 eso es falso**
   *  —«el techo del prestador dejó la tinta y GANÓ EL MURO tealDark»,
   *  `techo-oficio.tsx:4`— y el comentario nunca se corrigió. *Elegí el
   *  token por su letra, y la letra llevaba cuatro sesiones vencida: L-141
   *  en su forma más cara, porque lo derivado decae mientras el objeto
   *  no.* (El rótulo queda curado en los tres temas y en la galería.)
   *
   *  **LO QUE RIGE AHORA, con sus dos firmas:**
   *  · **La barra va en `bg.card`** — *«podemos dejar en BLANCO la barra
   *    de menú para que se distinga»*. En claro `bg.card` **ES** `#FFFFFF`,
   *    o sea el blanco pedido **por slot y no por hex**; y en oscuro
   *    resuelve solo a la superficie oscura, sin que nadie tenga que
   *    acordarse de que una barra blanca en modo noche sería un farol.
   *  · **El disco va en `accent.activoLleno`** — *«lo que queríamos en
   *    color oscuro es el VERDE DEL HEADER en el círculo»*. En el
   *    prestador claro ese slot **es** `tealDark`, el mismo hex del muro:
   *    el disco y el techo comparten verde por construcción. */
  const colorBarra = theme.bg.card
  const colorDisco = theme.accent.activoLleno
  const colorSobreDisco = theme.accent.sobreActivoLleno

  const [ancho, setAncho] = useState(0)
  const reduceMotionBarra = useReducedMotion()
  const quieto = theme.mode === 'memorial' || reduceMotionBarra
  const cx = useSharedValue(0)
  const estira = useSharedValue(0)

  const indiceActivo = Math.max(0, items.findIndex((i) => i.key === activo))
  const anchoTab = ancho / Math.max(1, items.length)
  /* 🔴 DEFECTO A · EL DISCO NUNCA SALE DE LA BARRA. En el primer y último
     tab el centro de la pestaña está a menos de un radio del borde, así que
     el disco quedaba COLGANDO afuera con su anillo cortado — que es lo que
     el founder vio en «Hoy» y en «Cuenta» y no pasaba en «Atender».
     Se acota contra la esquina redondeada. *El disco se corre unos píxeles
     de su tab en las puntas; salirse de la barra no es una alternativa.* */
  const cxCrudo = anchoTab * (indiceActivo + 0.5)
  const margenDisco = DISCO_RADIO + RADIO_BARRA * 0.35
  const cxDestino = Math.min(Math.max(cxCrudo, margenDisco), Math.max(margenDisco, ancho - margenDisco))
  /* 🔴 EL CONTENIDO SIGUE AL DISCO — pedido propio del founder: *«los de los
     extremos, izquierda y derecha, NO QUEDARON CENTRADOS LOS ÍCONOS»*.
     **Era un defecto que yo introduje con el acotado:** el disco se corría
     para no salirse de la barra y el ícono se quedaba en el centro de su
     pestaña, calculado por otro lado. *Dos cosas que tienen que coincidir
     salían de dos cuentas distintas — el mismo modo de falla que ya me
     costó el ícono descentrado hace tres gates.*
     Ahora el corrimiento se DERIVA de la misma posición del disco. */
  const corrimientoActivo = cxDestino - cxCrudo
  const altoTotal = ALTO_FILA

  useEffect(() => {
    if (ancho === 0) return
    if (quieto) {
      cx.value = cxDestino
      estira.value = 0
      return
    }
    // el ESTIRÓN: sale de la distancia y del SENTIDO del viaje, y vuelve
    // a 0 al llegar. Es lo que deforma el valle de un lado y no del otro.
    const dx = cxDestino - cx.value
    estira.value = withTiming(Math.max(-1, Math.min(1, dx / (anchoTab * 1.5))), {
      duration: motion.duration.micro,
    })
    /* 🔴 EL VIAJE SE HACE MÁS LENTO — pedido explícito del founder en el
       gate 3 (*«la transición más lenta, para que se vea mejor»*), y su
       hermana es el otro hallazgo: *«NO HACE TRANSICIÓN, SALTA»*.
       **De `estandar` (300) a `grande` (520).** No se inventa un número:
       520 es el tercer registro del vocabulario CERRADO de N10 — el de
       «la celebración» —, y **es el único paso disponible hacia arriba**
       (150 · 300 · 520). *Un movimiento que el ojo no alcanza a ver no se
       lee como rápido: se lee como que no existió.* */
    cx.value = withTiming(
      cxDestino,
      { duration: motion.duration.grande, easing: Easing.bezier(...motion.marca.aperturaBezier) },
      () => {
        estira.value = withTiming(0, { duration: motion.duration.estandar })
      },
    )
  }, [cxDestino, ancho, quieto, anchoTab])

  /** El grupo VIAJA (transform) · el path solo se DEFORMA. Ver la nota
   *  de `pathBarra`: la posición no cuelga del mecanismo frágil. */
  const estiloViaje = useAnimatedStyle(() => ({
    transform: [{ translateX: cx.value }],
  }))
  const propsCuerpo = useAnimatedProps(() => ({
    d: pathBarra(ancho, altoTotal, estira.value, cx.value),
  }))

  return (
    <View
      onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
      style={{
        flexDirection: 'row',
        /* 🔴 LA BARRA FLOTA (ver `MARGEN_BARRA`). El inset inferior queda
           como MARGEN y no como padding: así el fondo de la pantalla se ve
           TAMBIÉN debajo del cuerpo, que es lo que la vuelve una superficie
           apoyada sobre el contenido y no un zócalo pegado al borde. */
        marginHorizontal: MARGEN_BARRA,
        marginBottom: insets.bottom,
        /* ⛔ SIN `backgroundColor`, y es LA condición del hueco: si la
           caja pinta, no hay ausencia posible y el hueco tendría que
           pintarse del color del fondo — justo lo que la advertencia ③
           declaró imposible en esta casa. El color vive en el vector. */
      }}
    >
      {ancho > 0 ? (
        /* EL LIENZO ESTÁ QUIETO: el cuerpo flota y sus esquinas son
           puntos fijos. Lo único que sube es lo que el disco ASOMA. */
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            top: -DISCO_ASOMA,
            width: ancho,
            height: altoTotal + DISCO_ASOMA,
          }}
        >
          <Svg width={ancho} height={altoTotal + DISCO_ASOMA}>
            <AnimatedPath
              animatedProps={propsCuerpo}
              fill={colorBarra}
              fillRule="evenodd"
              translateY={DISCO_ASOMA}
            />
          </Svg>
          {/* EL DISCO — viaja por TRANSFORM, no por `d`. Es la mitigación
              declarada en `pathBarra`: si el `d` no interpolara en algún
              dispositivo se perdería la deformación del valle, **jamás el
              movimiento del marcador**. */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: -DISCO_RADIO,
                top: 0,
                width: DISCO_RADIO * 2,
                height: DISCO_RADIO * 2,
                borderRadius: DISCO_RADIO,
                backgroundColor: colorDisco,
              },
              estiloViaje,
            ]}
          />
        </View>
      ) : null}
      {items.map((item) => {
        const esActivo = item.key === activo
        /* 🔴 DOS SUPERFICIES, DOS COLORES DE CONTENIDO — y por eso ya no
           hay un solo `color` con dos opacidades. **El ícono activo NO
           vive sobre la barra: vive sobre el disco**, así que su color lo
           dicta el disco (`sobreActivoLleno`) y no el fondo de la barra.
           El inactivo sí vive sobre la barra y usa el secundario del
           tema, que es el par ya medido contra `bg.card` en toda la casa.
           ⏪ El `papelAtenuado` de la vuelta anterior era papel sobre un
           techo oscuro; con la barra en blanco habría quedado **casi
           invisible**. */
        const colorActivo = colorSobreDisco
        const colorInactivo = theme.text.secondary
        const color = esActivo ? colorActivo : colorInactivo
        // §2.6+§2.8: la huella activa hereda accent.active; memorial
        // degrada a tinta secundaria (jamás color en memorial).
        const colorHuella = theme.mode === 'memorial' ? theme.text.secondary : accentActive
        return (
          <Pressable
            key={item.key}
            onPress={() => onCambiar(item.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: esActivo }}
            aria-selected={esActivo}
            accessibilityLabel={etiquetaBadge(item.etiqueta, item.badge ?? 0)}
            style={{
              flex: 1,
              minHeight: Math.max(ALTO_FILA, 44),
              height: ALTO_FILA,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* S88-B: la anatomía del badge SUBIÓ a pieza (`Badge`) al ganar
                su segundo consumidor (la campana) — la barra pasa a
                consumirla: misma geometría S43, misma pill, y la voz del
                label ahora vive en el riel (antes: hardcodeada acá). */}
            <Animated.View
              style={{
                alignItems: 'center',
                gap: GAP_BLOQUE,
                /* 🔴 SUBE EL BLOQUE ENTERO — ícono Y etiqueta. Ése era el
                   defecto que el founder describió como *«me sigue
                   saliendo la palabra ABAJO, sobre la barra»*: el ícono
                   viajaba al disco y **la etiqueta se quedaba huérfana**,
                   una palabra sola sin nada encima.
                   La duración acompaña al viaje del disco (`grande`): si
                   el disco tarda 520 y el ícono 300, el ícono llega
                   primero y **espera a su propio marcador**. */
                transform: [
                  { translateY: esActivo ? -SUBIDA_ACTIVA : 0 },
                  // sigue al disco cuando éste se acotó contra el borde
                  { translateX: esActivo ? corrimientoActivo : 0 },
                ],
                transitionProperty: 'transform',
                transitionDuration: motion.duration.grande,
                transitionTimingFunction: cubicBezier(...motion.marca.aperturaBezier),
              }}
            >
              {/* 🔴 EL ACTIVO CAMBIA SU ÍCONO POR SU NOMBRE, y es la
                  firma del founder: *«dentro del círculo poner el nombre
                  del tab»*. **La aritmética dice que las dos cosas no
                  entran**: con ícono Y nombre el disco necesita r ≥ 33
                  (d 66) en una fila de 64; con el nombre solo, r 30
                  alcanza y sobra. *Y el reparto tiene sentido antes que
                  la cuenta: donde ESTÁS no necesitás el ícono —necesitás
                  saber cómo se llama—, y el ícono es lo que te dice a
                  dónde vas en los que NO estás.* */}
              <View style={{ height: ALTO_CAJA_ICONO, justifyContent: 'center' }}>
              <HuellaDeTab activa={esActivo}>
                {/* ☠️ La rama de `destacada` MURIÓ acá (ver su lápida
                    arriba): ya no hay superficie propia. El disco del
                    activo es el ÚNICO énfasis de la barra. */}
                <Badge n={item.badge ?? 0}>
                  {item.icono({
                    color,
                    /* LAS DOS RAMAS DE LA FIRMA (§2.6 enmendada): con
                       huella, la huella se MUDA adentro del disco; sin
                       ella, el disco queda como marcador único. La
                       condicional del founder está firmada por
                       adelantado, así que las dos se construyen y el
                       gate ELIGE. */
                    /* SIN HUELLA — firma del founder. El disco marca el
                       activo; la huella acá sería el segundo marcador. */
                    activa: false,
                    colorHuella,
                  })}
                </Badge>
              </HuellaDeTab>
              </View>
              {/* ☠️ EL SUBRAYADO MURIÓ (S99-B). Era el marcador del activo
                  cuando no había disco; con el disco viajando serían DOS
                  marcadores del mismo estado — exactamente lo que la firma
                  de §2.6 vino a resolver. Un marcador, un significado.
                  ⚠️ **Y la etiqueta se queda ACÁ ADENTRO, con su ícono.**
                  La mesa pidió meterla DENTRO del disco; el censo dice que
                  no entra —ver la nota de `DISCO_RADIO`— y meterla a la
                  fuerza obligaba a un disco de 64 px en una fila de 56.
                  *Lo que el founder reportó era la ORFANDAD, y la orfandad
                  se cura viajando juntos.* */}
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: typography.family.sans.medium,
                  fontSize: typography.size.xs,
                  lineHeight: ALTO_RENGLON,
                  color,
                }}
              >
                {item.etiqueta}
              </Text>
            </Animated.View>
          </Pressable>
        )
      })}
    </View>
  )
}
