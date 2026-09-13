/**
 * Texto — la pieza de texto del sistema (S71-A1, componente 58).
 *
 * POR QUÉ NACE (deep research S71, Bloque 0): el design system tenía 57
 * exports y NINGUNO era texto. Consecuencia: `<Text>` de react-native con
 * `style` inline tokenizado era el único camino posible, y la receta se
 * repetía ~200 veces en el cliente (7 literales solo en `parte`). El
 * resultado no era hardcodeo — los tokens estaban bien puestos — sino algo
 * peor: **la jerarquía tipográfica se re-decidía a mano en cada pantalla**.
 * Ley 11 sobre la pieza más usada del monorepo.
 *
 * LA API ES DELIBERADAMENTE POBRE. Cuatro variantes, color semántico y
 * `numberOfLines`. Nada decorativo, y **sin prop `style`**: la escotilla de
 * estilo libre devolvería el gobierno de la jerarquía a la pantalla, que es
 * exactamente el problema que este componente existe para cerrar. Si una
 * superficie necesita algo que esta API no da, eso es una conversación de
 * mesa (Ley 11: propuesta + gate), jamás una prop nueva metida al pasar.
 *
 * EL LAYOUT ES DEL PADRE. `Texto` es una hoja: no lleva margin, flex ni
 * ancho. Para truncar, `numberOfLines`; para acomodar, la `View` que lo
 * contiene.
 *
 * Las variantes (Ley 3 — regla de voz):
 *   · titulo  → DM Sans 300 · 28px · lo humano a escala de voz.
 *   · seccion → DM Sans 500 · 18px · el rótulo de un bloque, con
 *               `accessibilityRole="header"` DE FÁBRICA.
 *   · cuerpo  → DM Sans 400 · 15px · la prosa por default. **D-482 PAGADA
 *               (S82-B, decisión FIRMADA S72-A):** nació en md/18 con 3
 *               consumidores; el censo de B halló 49 sitios en base/15
 *               que no la adoptaban porque el tamaño no coincidía — el
 *               censo corrige al diseñador (precedente VozSecundaria):
 *               la prosa real de la casa es base/15. Re-censado al pagar
 *               (L-141): 71 consumidores explícitos, cero `<Texto>` sin
 *               variante; los 68 post-S72 la adoptaron como "prosa por
 *               default", que es exactamente lo que la firma corrige.
 *               El sitio S72 más visible del cambio: el título de las
 *               tarjetas de Ponte al día (hogar) — señalado para la
 *               captura claro/oscuro del gate.
 *   · apoyo   → DM Sans 400 · 13px · secundario, subtítulos, ayudas.
 *   · dato    → JetBrains Mono 400 · 13px · metadata que generó una máquina
 *               (fechas, horas, IDs, códigos), con `tabular-nums` para que
 *               los dígitos no bailen (precedente Cronometro, S44).
 *   · voz     → DM Sans **300 light** · 18px · interlineado 1.75 · tinta
 *               secundaria. **LA VOZ DEL PRODUCTO** (S82-B r9; la itálica
 *               MURIÓ en r15 por decisión founder —estigma de texto
 *               generado por IA— y el registro se reconstruyó con peso,
 *               tamaño e interlineado). Lo que el producto piensa sobre la
 *               mascota, no lo que la interfaz explica. ADITIVA: no cambia
 *               ninguna pantalla hasta que alguien la use.
 *
 * CONGELADO S71-A2 con las cuatro enmiendas de mesa, todas MEDIDAS antes
 * de decidir (no dictadas):
 *
 *   (1) NACE `seccion`. Había **10 definiciones de `TituloBloque`**
 *       repartidas entre las dos apps — y las diez BYTE-IDÉNTICAS (medium
 *       + `size.md` + `text.primary` + `accessibilityRole="header"`), más
 *       3 `tituloSeccion` locales. Diez copias iguales no son diez
 *       decisiones: son una decisión que nadie tuvo dónde poner. El
 *       `accessibilityRole` viaja ADENTRO porque era lo primero que se
 *       perdía al re-teclear la receta.
 *
 *   (2) `apoyo` ABSORBE `VozSecundaria` — NO nace quinta variante. Las
 *       **4 copias de `VozSecundaria`** también son byte-idénticas entre
 *       sí, y difieren de `apoyo` en UNA cosa: traen
 *       `lineHeight: size.sm * leading.normal`. Cuatro implementaciones
 *       independientes que coinciden en el mismo valor son cuatro votos
 *       por el mismo interlineado, no un capricho local: `apoyo` lo
 *       adopta y las absorbe. La prosa chica sin `lineHeight` se
 *       apelmaza — el defecto estaba en la variante, no en los clones.
 *
 *   (3) `FilaDato` (componente 59) nace HERMANO, no prop de acá: es
 *       LAYOUT (etiqueta sobre valor) y compone `Texto`. Meterlo como
 *       variante habría hecho que este componente devuelva dos nodos —
 *       la puerta a que `Texto` se convierta en un mini-framework.
 *
 *   (4) `montoCorto` NO NACE (D-448). El formateo de plata es del RIEL,
 *       por idioma — igual que `fechaCortaMono`. Una variante tipográfica
 *       no arregla que haya 42 formateos con 2 divergentes; los
 *       escondería mejor.
 *
 * Los tres temas salen gratis: el color sale de `theme.text.*`.
 */

import { Text } from 'react-native'
import type { ReactNode } from 'react'

import { typography } from '../tokens/typography'
import { useTheme } from '../ThemeProvider'
import { sobreVideo } from '../tokens/sobreVideo'

/* S116-B lote 2 · entra `antetitulo` — el rótulo chiquito en mayúsculas que
   la letra §2 firma para la cabecera («la fecha, el barrio, ACTIVIDAD»).
   ⚠️ **No resucita el eyebrow que S52 mató**: aquel era mono + uppercase +
   tracking como ESTRUCTURA DECORATIVA (Ley 18); éste lo firma la letra con
   su color semántico, o sea que codifica una verdad del contenido. La
   distinción es de FUNCIÓN, no de forma — y la escala v5 ya lo trae con su
   `textTransform`, así que la pieza no lo pone en mayúsculas a mano. */
export type TextoVariante = 'titulo' | 'seccion' | 'cuerpo' | 'apoyo' | 'enfasis' | 'dato' | 'datoMd' | 'voz' | 'antetitulo'
/** S81 (pedido de C, los spreads dangerText de los cierres): entran los
 *  colores de STATUS — 'danger' y 'success' resuelven contra
 *  theme.status.*Text (los registros AA). El resto sigue en theme.text. */
/** S96-B — gana `warning`, por el MISMO motivo por el que ya tenía
 *  'danger' y 'success': el sistema tiene `status.warningText` como
 *  registro AA y `Texto` no podía decirlo, así que quien lo necesitaba
 *  tenía que salirse de la pieza. Su primer consumidor es la banda de
 *  desvío de `EscaleraEstados` (una entrega fallida no es un ERROR del
 *  sistema —vuelve y se reagenda—: 'danger' habría gritado de más). */
/** S106-B — entra `sobreVideo`, y NO es «un color más»: es la única entrada de
 *  esta lista que **no sale del tema**, porque el fondo tampoco sale del tema.
 *  Sobre un video en vivo el fondo lo pone la cámara de otra persona (la clase
 *  de `tokens/sobreVideo.ts`), así que `theme.text.*` —calibrado contra
 *  superficies que la casa pinta— ahí no aplica. **Su piso está medido en
 *  `verify-contrast.ts` contra los dos extremos, blanco y negro puros.**
 *  ⚠️ Se usa SOLO sobre video. Sobre una superficie de la casa es papel contra
 *  papel: invisible. */
/**
 * ⚠️ **`'warm'` abre una puerta que faltaba (S113-B · 2.2 · B6).** `text.warm`
 * existe en los TRES temas desde S43-B2 —donde se curó justamente porque en
 * memorial la tinta clara sobre el papel cálido daba **1.00:1**— y **ninguna
 * pieza podía pedirlo**: no estaba en esta unión. *Un token con motor y sin
 * puerta se lee como decorado hasta que alguien pinta su fondo y descubre, en
 * el aparato, que la mitad del par no existía* (`L-318`).
 *
 * 🔴 **Va SIEMPRE que se pinte `bg.warm`, y sólo ahí.** El papel cálido es
 * claro en memorial mientras la tinta del tema es clara: *el fondo y la letra
 * son un PAR, y usar medio par es cómo se fabrica un texto invisible que
 * ningún typecheck ve.* Medido en el emulador antes de curar: **1.25:1**.
 */
/* 🔴 **S116-B lote 2 · entra `inverso`** — el texto sobre superficie OSCURA
   (la cabecera ciruela, el `BadgeFecha`, la tarjeta `destacada`). Resuelve a
   `theme.text.inverse`, que los tres temas ya portan.
   ⚠️ **No lo prohíbe N23 ni R58**, y conviene decir por qué: R58 veta los
   miembros que empiezan con `accent` —el color que marca IMPORTANCIA—, y
   esto no marca importancia: es el par legible de `primary` cuando el fondo
   se da vuelta. *Sin él, cada pieza sobre ciruela tendría que escribir su
   color a mano, que es exactamente lo que `Texto` nació para cerrar.* */
export type TextoColor = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'success' | 'warning' | 'sobreVideo' | 'warm' | 'inverso'

export type TextoProps = {
  children: ReactNode
  /** Default: 'cuerpo'. */
  variante?: TextoVariante
  /** Color semántico del sistema. Default: el de la variante. */
  color?: TextoColor
  /** Truncado. Passthrough a react-native. */
  numberOfLines?: number
  /** S81 (pedido de C — el k/N de la sesión de adiestramiento, mono
   *  centrado): centra el texto. Semántica de composición, no estilo
   *  libre. */
  centrado?: boolean
  /** S81 (pedido de mesa): el texto se puede seleccionar/copiar (ids,
   *  códigos, el pie de identidad). Passthrough a react-native. */
  seleccionable?: boolean
  /**
   * ⭐ **ACHICA EL RÓTULO ANTES DE PARTIR LA PALABRA** (S113-C · enmienda
   * aditiva declarada, 76(d)). Firma del founder: *«si no entra, se achica el
   * rótulo, no la palabra»* — lo pidió viendo «Documentos» cortado en
   * «Documento» + «s» en la fila de acciones.
   *
   * 🔴 **Exige `numberOfLines`**: sin un techo de líneas, react-native no
   * tiene contra qué ajustar y la prop no hace nada. *Una prop que se puede
   * poner sin efecto es una prop que alguien va a creer que puso.*
   *
   * ⚠️ Es para ETIQUETAS, no para prosa: achicar un párrafo lo vuelve
   * ilegible. Su lugar son los rótulos cortos que comparten ancho fijo.
   */
  ajustaParaEntrar?: boolean
  /**
   * ⭐ **CIFRAS DE ANCHO FIJO EN UNA FRASE SANS** (S114-B · enmienda aditiva
   * declarada, 76(d)).
   *
   * **Para qué:** una frase que lleva un número **que cambia** — *«Te quedan
   * 14 horas para responder»* (`DIRECCION_POSTVENTA` §5). Sin ancho fijo, al
   * pasar de `14` a `13` la línea entera se corre unos píxeles en cada
   * refresco: un temblor que nadie pidió y que **se lee como si la pantalla
   * estuviera contando**, que es justo lo que esa letra prohíbe («sin
   * countdown que lata»).
   *
   * 🔴 **NO es «poner el número en mono».** La Ley 3 reserva la mono para
   * METADATA de máquina —fechas, horas, IDs—, y esto es una FRASE en voz
   * humana con una cifra adentro. Su MATIZ ya resolvió el caso hermano: *a
   * escala display el dato viste DM Sans con `tabular-nums`*; acá es la misma
   * operación un registro más abajo. **La familia tipográfica no cambia: sólo
   * el ancho de los dígitos.**
   *
   * ⚠️ **`dato` y `datoMd` ya son tabulares por receta** — poner esto ahí no
   * hace nada y no hace falta. Su lugar son las variantes SANS.
   *
   * Default `false`: cero cambio para los consumidores vivos.
   */
  tabular?: boolean
}

/* ══════════════════════════════════════════════════════════════════════
 *  S116-B · LOTE 2b — LA ESCALA v5 ENTRA A `Texto`, Y LA MEDICIÓN QUE LO
 *  OBLIGÓ ES DEL FOUNDER: **«en tus cuatro capturas ningún título está en
 *  Baloo».**
 *
 * 🔴 **LO MEDIDO, Y CORRIGE LA HIPÓTESIS OBVIA.** La sospecha natural era
 * que las pantallas leyeran un token propio. **No:** leen `Texto`, que es
 * el token de la casa — y **`Texto` nunca migró a la escala v5**. De sus
 * nueve variantes, `antetitulo` fue la única que la consumió (lote 2), y
 * las otras ocho siguieron leyendo `typography.family.sans.*`, que **es DM
 * Sans**. ⇒ *La letra §1.4 estaba firmada, el token existía con Baloo
 * adentro, y nadie lo enchufó. El rediseño tipográfico no falló: no llegó.*
 *
 * ⚠️ **Y hay un agravante que lo vuelve un defecto y no un pendiente:** la
 * enmienda de la letra §1.4 deja DM Sans viva **como token del PRESTADOR**.
 * O sea que hasta hoy **los títulos del cliente venían pintados con la
 * fuente de la otra casa**, que es justo lo que esa enmienda separaba.
 *
 * ── POR QUÉ SE RESUELVE POR CASA Y NO SE CAMBIA EL TOKEN ────────────
 * `Texto` lo montan LAS DOS APPS, y la letra §5 deja al prestador sin
 * cambios. Cambiar `RECETA` a secas le habría cambiado la tipografía al
 * prestador en silencio — **el mismo problema que el décimo slot resolvió
 * para la geometría en el lote 2, y por eso se usa el MISMO slot**:
 * `accent.formaV5` ya significa *«¿esta casa recibió el rediseño?»*.
 *
 * **No nace un slot nuevo, y es deliberado.** La nota de `formaV5` en
 * `themes/` ya dejó escrito el porqué: *«cinco booleanos de casa que
 * siempre valen lo mismo son un tema paralelo escrito de a poco»*. La
 * tipografía v5 y la geometría v5 **son la misma decisión de la misma
 * letra**; separarlas en dos banderas permitiría un estado —cliente con
 * píldoras y sin Baloo— que ninguna letra describe.
 *
 * ⚠️ **MEMORIAL NO RECIBE Baloo**, y sale gratis: su tema resuelve
 * `formaV5` en `false` (§4 de la letra apaga la fiesta). *La cifra en
 * Baloo no aparece en memorial porque no hay plata ni peso que celebrar —
 * y eso ya lo decidía el slot, no hizo falta una rama nueva.*
 * ══════════════════════════════════════════════════════════════════════ */
const ESCALA_V5: Partial<Record<TextoVariante, { fontFamily: string; fontSize: number; leading: number }>> = {
  /** «título 1 Baloo 28/31» — el título de PANTALLA. */
  titulo: {
    fontFamily: typography.escala.titulo1.familia,
    fontSize: typography.escala.titulo1.size,
    leading: typography.escala.titulo1.lineHeight,
  },
  /** «título 2 Baloo 22/26» — el título de SECCIÓN. */
  seccion: {
    fontFamily: typography.escala.titulo2.familia,
    fontSize: typography.escala.titulo2.size,
    leading: typography.escala.titulo2.lineHeight,
  },
  /** «cuerpo PJS 400 14/22». ⚠️ **BAJA de 16 a 14 y se declara**: la
   *  escala v5 fija los dos números juntos y `D-482` ya había firmado el
   *  movimiento inverso (md/18 → base/15) *para la escala vieja*. Acá
   *  manda la letra §2, que cierra los rangos del mock. */
  cuerpo: {
    fontFamily: typography.escala.cuerpo.familia,
    fontSize: typography.escala.cuerpo.size,
    leading: typography.escala.cuerpo.lineHeight,
  },
  /** «apoyo PJS 400 12/17». */
  apoyo: {
    fontFamily: typography.escala.apoyo.familia,
    fontSize: typography.escala.apoyo.size,
    leading: typography.escala.apoyo.lineHeight,
  },
  /** «fila PJS 700 14/18» — el énfasis de la casa es el peso de fila. */
  enfasis: {
    fontFamily: typography.escala.fila.familia,
    fontSize: typography.escala.fila.size,
    leading: typography.escala.fila.lineHeight,
  },
  /* ⚠️ LO QUE **NO** ENTRA, y es decisión medida, no olvido:
   *  · `dato` y `datoMd` — **la Ley 3 sigue rigiendo**: JetBrains Mono para
   *    metadata de máquina. La letra §1.4 deroga N1 y «la casa no titula en
   *    bold»; **no toca la voz del dato**, y el mono no es DM Sans.
   *  · `voz` — es DM Sans 300, *«lo humano a escala de voz»*, y la letra no
   *    nombra una variante de voz. **Cambiarla sería decidir algo que nadie
   *    firmó**; queda para el lote que toque su superficie.
   *  · `antetitulo` — ya consume la escala v5 desde el lote 2. */
}

const RECETA: Record<
  TextoVariante,
  {
    fontFamily: string
    fontSize: number
    /* S116-B · los dos que pide el antetítulo de la letra §2. Opcionales:
       ninguna receta viva los usa, así que el resto no cambia. */
    letterSpacing?: number
    textTransform?: 'uppercase'
    color: TextoColor
    tabular?: boolean
    /** Interlineado explícito — solo donde la prosa lo necesita (enmienda 2). */
    leading?: number
    /** Rótulo de bloque: el rol de a11y viaja con la variante (enmienda 1). */
    header?: boolean
  }
> = {
  /* ── N1 EJECUTADA (firma de mesa, 14-ago-2026) ──────────────────────
     La escala se movió en el TOKEN (ver `typography.size`); acá entran
     los INTERLINEADOS, que N1 pide explícitos y la casa no tenía:
     cuerpo 16/**24** · secundario 14/**20** · sección 20/**26** ·
     título 28/**34**.

     Van como número y no como `size * leading.x` porque **ninguno de los
     cuatro sale limpio de los multiplicadores** (24/16 = 1.5 y 34/28 =
     1.214 no existen en `leading`). Inventar tres ratios para que la
     cuenta cierre sería fabricar tokens que nadie más va a usar: los
     pares de N1 son la LETRA, y viven donde vive la receta.

     🔴 EL PESO DEL TÍTULO NO CAMBIA, y es la única parte de N1 que la
     mesa NO firmó: N1 pedía **700** y `titulo` sigue en **light 300**.
     La regla de voz de `typography.ts` es vinculante —«voz humana = DM
     Sans 300/400 en tamaños lg+»— y el título de pantalla ES la voz
     humana de la casa. Poner 700 ahí no era un número: invertía el
     registro. La mesa lo resolvió a favor de la voz liviana.

     EL DE `seccion` SÍ: 500 → **700**, y NO al 600 que pedía la letra.
     El 600 existe pero **no está cargado** (55 KB medidos, tres semanas
     después de que S94-PERF sacara 2,37 MB de fuentes); el 700 ya viaja
     en el bundle, cuesta CERO y contrasta más que el escalón más chico
     de la familia. *Cuando un candidato obliga a agregar peso, la salida
     barata suele ser un candidato mejor.* */
  titulo:  { fontFamily: typography.family.sans.light,   fontSize: typography.size.xl, color: 'primary', leading: 34 },
  seccion: { fontFamily: typography.family.sans.bold,    fontSize: typography.size.md, color: 'primary', header: true, leading: 26 },
  cuerpo:  { fontFamily: typography.family.sans.regular, fontSize: typography.size.base, color: 'primary', leading: 24 }, // D-482: la prosa de la casa · N1: 16/24

  apoyo:   { fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: 'secondary', leading: 20 },
  /* Sale ENTERO de `typography.escala.antetitulo` (letra §2): familia,
     tamaño, interlínea, tracking 2 y mayúsculas. No se teclea ninguno. */
  antetitulo: {
    fontFamily: typography.escala.antetitulo.familia,
    fontSize: typography.escala.antetitulo.size,
    color: 'secondary',
    leading: typography.escala.antetitulo.lineHeight,
    letterSpacing: typography.escala.antetitulo.letterSpacing,
    textTransform: typography.escala.antetitulo.textTransform,
  },
  /* 🔴 `enfasis` — EL ELEMENTO DESTACADO DE UNA LISTA, QUE NO ES UN RÓTULO
     (S100d·bis).

     **Nace de un pedido del founder sobre la escalera** —*«disminuir el tamaño
     de la letra»*— **y de un defecto que apareció al ir a cumplirlo.**

     ── 🔴 EL DEFECTO, QUE ES DE ACCESIBILIDAD Y NADIE BUSCABA ──────────
     Para destacar el hito en curso, `EscaleraEstados` usaba **`seccion`** — la
     única variante en negrita de la casa. **Y `seccion` lleva
     `accessibilityRole="header"` DE FÁBRICA** (está escrito en su propia
     cabecera: *«el rol de a11y viaja con la variante»*).

     ⇒ **un lector de pantalla venía anunciando «el paso en el que estás» como
     un ENCABEZADO**, uno por pedido en curso. *Un encabezado es el título de
     una sección; el hito actual es un elemento de una lista.* **El gesto y el
     lector contaban historias distintas** — lo mismo que esta pieza vigila en
     su propio `accessibilityLabel`.

     ── POR QUÉ NO ALCANZABA NINGUNA DE LAS SIETE ──────────────────────
     `seccion` es 20 **y es rótulo** · `cuerpo` 16 **y no tiene peso** ·
     `apoyo` 14 **y tampoco** · `dato` es mono, voz de máquina. **El trabajo
     "destacar UN elemento adentro de una lista compacta, sin ascenderlo a
     título" no existía en el diccionario** (Ley 19) — y usar el rótulo para
     eso es lo que produjo el falso encabezado.

     **`size.sm` para que la lista sea de APOYO y no de titulares** — medido en
     `referencia-pedidosya-seguimiento-hitos-con-hora`: ahí los hitos corren muy
     por debajo de un cuerpo de 16, *el peso lo carga la escalera y no la
     tipografía*. **Color `primary` y no `secondary`**, porque lo destacado se
     lee lleno; quien quiera apagarlo pasa `color`. */
  enfasis: { fontFamily: typography.family.sans.bold,    fontSize: typography.size.sm, color: 'primary', leading: 20 },
  dato:    { fontFamily: typography.family.mono.regular, fontSize: typography.size.sm, color: 'secondary', tabular: true },
  // S81 (pedido de C — "el precio mono-primary" de coordinar y los
  // cierres): el dato PROMINENTE — mono a md en primary. Sigue siendo
  // voz de máquina (Ley 3); el traje crece con el protagonismo.
  datoMd:  { fontFamily: typography.family.mono.regular, fontSize: typography.size.md, color: 'primary', tabular: true },
  // S82-B r9 — LA VOZ DEL PRODUCTO (orden founder punto 6; el reencuadre
  // que retiró la serif). NO falta tipografía: faltaba REGISTRO. Hoy "lo
  // que el producto piensa" pide prestado `apoyo` — sans secundario 13px,
  // que ES el microcopy gris que la referencia critica. Cuatro mediciones
  // independientes lo pidieron (C ×3 en S82, B ×1 en r7).
  // La receta, dentro de DM Sans: ITÁLICA real (archivo propio) · md/18
  // (por encima del cuerpo 15: la voz no es nota al pie) · interlineado
  // de PROSA (normal 1.6 — respira, es la única variante con dos o tres
  // líneas por diseño) · tinta SECUNDARIA (piensa en voz baja: no compite
  // con el título ni desaparece como el apoyo).
  // Qué NO es: no rotula (eso es `seccion`), no da datos (eso es `dato`),
  // no es la prosa de la interfaz (eso es `cuerpo`). Su prueba: *si la
  // frase la podría haber dicho el producto sobre la mascota, es `voz`;
  // si describe un control, no lo es.*
  // S82-B r15 — LA ITÁLICA MURIÓ y el REGISTRO VIVE. Decisión founder: la
  // itálica está estigmatizada como marca de texto generado por IA en su
  // mercado. La voz se reconstruye con las tres palancas que quedan:
  //  · PESO 300 (light) — la voz humana de la casa (Ley 3: "voz humana =
  //    DM Sans 300"); el `cuerpo` es 400, así que ya no comparten trazo.
  //  · TAMAÑO md/18 — por encima del cuerpo (15): la voz no es nota al pie.
  //  · INTERLINEADO relaxed 1.75 (era normal 1.6) — el aire es lo que
  //    reemplaza a la inclinación: dice "esto se lee distinto" sin inclinar.
  // El color secundario se CONSERVA. Las tres juntas separan `voz` de
  // `cuerpo` (400/15/1.6) y de `apoyo` (400/13) sin una fuente nueva.
  voz:     { fontFamily: typography.family.sans.light, fontSize: typography.size.md, color: 'secondary', leading: typography.size.md * typography.leading.relaxed },
}

export function Texto({ children, variante = 'cuerpo', color, numberOfLines, centrado, seleccionable, ajustaParaEntrar, tabular }: TextoProps) {
  const { theme } = useTheme()
  /* La casa decide la escala (ver `ESCALA_V5` arriba). `formaV5` es el
   * mismo slot que gobierna la geometría: una sola bandera para una sola
   * decisión de una sola letra. */
  const v5 = theme.accent.formaV5 ? ESCALA_V5[variante] : undefined
  const receta = RECETA[variante]
  const c = color ?? receta.color
  const colorResuelto =
    c === 'sobreVideo'
      ? sobreVideo.contenido
      : c === 'danger'
      ? theme.status.dangerText
      : c === 'success'
        ? theme.status.successText
        : c === 'warning'
          ? theme.status.warningText
          : c === 'inverso'
            /* El slot del tema se llama `inverse` (inglés, como todo el
               shape del tema) y la prop `inverso` (español, como toda la
               API pública de la casa). Se traduce acá, en un solo lugar. */
            ? theme.text.inverse
            : theme.text[c as Exclude<TextoColor, 'danger' | 'success' | 'warning' | 'sobreVideo' | 'inverso'>]

  return (
    <Text
      accessibilityRole={receta.header === true ? 'header' : undefined}
      numberOfLines={numberOfLines}
      selectable={seleccionable}
      /* Sin `numberOfLines` la prop no tiene contra qué ajustar: se ignora
         en vez de prometer. */
      adjustsFontSizeToFit={ajustaParaEntrar === true && numberOfLines !== undefined}
      style={{
        fontFamily: v5?.fontFamily ?? receta.fontFamily,
        fontSize: v5?.fontSize ?? receta.fontSize,
        color: colorResuelto,
        ...(centrado ? { textAlign: 'center' as const } : null),
        ...(v5 !== undefined
          ? { lineHeight: v5.leading }
          : receta.leading !== undefined
            ? { lineHeight: receta.leading }
            : null),
        ...(receta.letterSpacing !== undefined ? { letterSpacing: receta.letterSpacing } : null),
        ...(receta.textTransform !== undefined ? { textTransform: receta.textTransform } : null),
        ...(receta.tabular || tabular ? { fontVariant: ['tabular-nums' as const] } : null),
      }}
    >
      {children}
    </Text>
  )
}
