/**
 * Icono — el set b′ de la casa (S53, DIRECCION_ARTE §1-§2).
 *
 * La regla madre: EN CADA ÍCONO, LA MASCOTA ESTÁ PRESENTE — objeto del
 * oficio en trazo 1.9 de tinta + UNA Huella rellena en el hex puro de
 * su capa, colocada donde la mascota está en el concepto. Nombre
 * TIPADO (cero strings mágicos); tema y memorial se resuelven ADENTRO
 * (§2.8: en memorial la huella pasa a text.secondary, el trazo se
 * conserva; el destello del coach NO destella — tinta, quieto).
 *
 * Decisión técnica (regla 74): registry de dibujantes por nombre —
 * cada ícono es una función que recibe {tinta, huella} ya resueltos
 * por tema/registro; agregar un ícono = una entrada en el registry +
 * su fila en la galería + gate founder (DIRECCION_ARTE §6).
 *
 * `registro` (§2.7, dosis prestador): 'capa' = hex PURO (gráfica,
 * default dueño) · 'aa' = color funcional AA de la capa · 'tinta' =
 * la vista ya porta su único acento.
 *
 * Ley §2.9: todo ícono se gatea a su tamaño de diseño Y a 21px.
 */

import Svg, { Circle, G, Path } from 'react-native-svg'

import { useTheme } from '../ThemeProvider'
import { Huella } from '../brand/Huella'

export type IconoNombre =
  | 'paseo' | 'veterinaria' | 'grooming' | 'refugio' | 'despensa'
  /** G-14 (S100b-B) — LA CANASTA, distinta de `despensa`: aquélla es la
   *  SECCIÓN y ésta es lo que llevás adentro. Conviven en pantalla. */
  | 'carrito'
  /** G-08 (S100b-B) — el `−` del stepper con cantidad 1, **solo en el
   *  carrito**. Familia de CONTROL: sin huella, como `lapiz`. */
  | 'papelera'
  /** S100c-B, pedido de D — LA TAB DE PEDIDOS. Distinto de `despensa` (la
   *  sección) y de `carrito` (lo que llevás sin comprar): esto es lo que YA
   *  compraste y está en camino. Las tres conviven en la misma barra. */
  | 'pedido'
  // ☠️ 'coach' MURIÓ COMO NOMBRE (S84-B11) — RENAME a 'ia', firmado.
  //    El dibujo NO cambió una línea: son las mismas tres chispas de
  //    CHISPA. Lo que cambió es qué nombra. El código decía que este
  //    glifo ES la marca de la IA ("Sin huella: el destello ES la marca
  //    de la IA", S53) y a la vez se llamaba como UNA PANTALLA. Con el
  //    botón "mejorar con IA" el equívoco se volvía visible: montar
  //    `nombre="coach"` en una acción que no es el Coach.
  //    NO SE HIZO ALIAS Y ES LA DECISIÓN: dos nombres para un dibujo es
  //    no decidir cuál es el correcto, y deja al siguiente eligiendo.
  | 'ia'
  // ── LOTE 3 (S58, D-361 — gate founder POR ÍCONO pendiente) ──
  | 'hogar' | 'explorar' | 'cuenta' | 'hoy' | 'negocio'
  // S98 — el ⓘ de «qué significa este campo». NO es `ayuda` (el
  // salvavidas): ver su dibujante para el criterio y su gate pendiente.
  | 'info'
  // S97+ — el destino central del prestador: la puerta abierta (ver su
  // dibujante para el porqué del concepto y su recambio declarado).
  | 'atender'
  | 'carnet' | 'familia' | 'preferencias' | 'pagos' | 'ayuda' | 'ubicacion'
  | 'training' | 'hotel' | 'guarderia' | 'seguros' | 'telemedicina'
  | 'vacaciones' | 'equipo'
  // Prime (concepto 19): DOS candidatos — el founder elige a 21px; el perdedor muere
  | 'prime' | 'primeCorona'
  // ── LOTE S71-B2 (proceso enmendado DIRECCION_ARTE: la sesión autora,
  //    hoja de contacto de 3 variantes, firma founder POR ícono) ──
  | 'caso' | 'presupuesto'
  /* ── LOS CUATRO NODOS DEL SEGUIMIENTO (S99-B · §6b, GATE POR ÍCONO
   *    PENDIENTE) ──────────────────────────────────────────────────
   *  Son **GLIFOS DE CONTROL**: sin huella, por la Ley 9 en su alcance
   *  S98 (*«en un glifo de control no hay mascota, hay interfaz»*).
   *  Su nombre sigue a la NARRATIVA y no a la forma, porque la frontera
   *  de la escalera son las 7 narrativas: si mañana cambia el vocabulario
   *  del motor, se ve en el nombre del glifo. */
  | 'nodoConfirmado' | 'nodoPreparando' | 'nodoEnCamino' | 'nodoEntregado'
  // ── LOS DOS PRIMEROS GLIFOS DE CONTROL (S82-B r7, importados del
  //    archivo de referencia que el founder entregó: `ficha-mascota`).
  //    GATE POR ÍCONO A 21px PENDIENTE (§2.9) · su LETRA NO SE ESCRIBE
  //    acá: la categoría "glifo de control" es §6bis de DIRECCION_ARTE,
  //    PENDIENTE desde S78 — regla 80 (la ley va DESPUÉS del gate).
  | 'lapiz' | 'compartir'
  /* ── S107-B · CERTIFICACIONES y WEARABLES — DOS CANDIDATOS CADA UNO
   *    (molde `prime`/`primeCorona`: el founder elige a 21px y el perdedor
   *    muere con su lápida). GATE POR ÍCONO PENDIENTE (§2.9).
   *
   *  ══ CERTIFICACIÓN ═══════════════════════════════════════════════════
   *  **La orden del founder trae su propio veto: «el error fácil es dibujar
   *  una medalla o un diploma — eso acredita a la persona equivocada».**
   *  Y la casa YA tenía la salida escrita, en la entrada de `documento`:
   *
   *  > *«`carnet` es el de vacunas de la MASCOTA — **su huella sobre una
   *  > cédula diría que el documento es del animal**»*
   *
   *  ⇒ **La huella no es el adorno de este glifo: es lo que resuelve el
   *  veto.** Un papel con la huella RELLENA encima dice *«la acreditada es
   *  ella»*; una medalla dice *«alguien ganó algo»*. *No se inventó un
   *  criterio: se ejerció el que la casa ya había escrito para el caso
   *  inverso.*
   *
   *  CENSO DE OBJETOS OCUPADOS (antes de dibujar): `documento` es
   *  identificación **con retrato** · `carnet` es la **placa** de vacunas ·
   *  `copiar`/`descargar` son hojas de CONTROL, sin huella. **Ninguno
   *  acredita**, y prestarlos sería la sustitución genérica que la Ley 12
   *  prohíbe.
   *
   *  ══ WEARABLE ════════════════════════════════════════════════════════
   *  **El otro veto: «jamás un corazón médico — un corazón dice consulta, y
   *  esto mide todo el tiempo».**
   *
   *  🔴 Y EL CENSO MATÓ AL CANDIDATO OBVIO: la placa del collar. **`carnet`
   *  YA es una placa colgante y `paseo` YA es el lazo del collar** — a 21px
   *  serían el mismo dibujo. ⇒ el objeto es **el DISPOSITIVO**: cuerpo
   *  redondeado con dos tramos de correa, la silueta que nadie confunde.
   *
   *  **Y la huella va ADENTRO del cuerpo**, que es lo que dice «continuo»
   *  sin órgano y sin ondas: *el aparato está mostrando a la mascota, todo
   *  el tiempo.* **Las ondas se descartaron por precedente**, no por gusto:
   *  `contactoOndas` murió en su gate porque **§1 manda dibujar el OBJETO y
   *  «el alcance» es una idea** — y encima chocaba con `ayuda` a 21px. */
  /* ☠️ `certificacionesSello` y `wearablesActividad` MURIERON EN SU GATE
     (firma del founder, 30-ago-2026) — molde `prime`/`primeCorona`: **el
     perdedor de cada par muere con su lápida**, no se guarda «por si acaso».
     *Un candidato que sobrevive a su gate es un dibujo que el próximo va a
     encontrar sin saber que ya perdió.*

     **Los ganadores son los que quedan** — `certificaciones` (papel + huella
     como SELLO) y `wearables` (el dispositivo con la huella ADENTRO)—, y **no
     se dedujo cuáles: se midió.** El consumidor ya los monta por nombre en
     `explorar/index.tsx` (`icono: 'wearables' | 'certificaciones'`), así que
     *«los que están puestos»* tenía una única lectura contra el objeto.

     Lo que perdió cada uno, para que no se re-dibuje igual: **el sello
     troquelado** (anillo con la huella adentro — su riesgo declarado era Ley 9,
     poca aire a 21 px) y **la traza de actividad** (leía a ECG, o sea clínica,
     que es justo lo que el veto del founder sacaba). */
  | 'certificaciones'
  | 'wearables'
  /** S100d-B — EL FILTRO, pedido por la pista C con su literal del founder
   *  (punto 2 del gate: *«buscador en el MISMO escalón que Filtrar, con
   *  ícono clásico de filtro»*) y con el registry censado antes de pedir:
   *  **no había candidato**. Familia de CONTROL ⇒ **sin huella**, como
   *  `lapiz`. Gate por ícono a 21 px PENDIENTE (§2.9). */
  | 'filtro'
  // ── S89-B: DESCARGAR — nace por pedido autocontenido de D (lámina
  //    `LAMINA_DOCUMENTOS_DEL_HOGAR.md`): las filas de papeles tienen su
  //    `iconoCta` cableado y NO había glifo. **Prestarle `compartir` es
  //    la sustitución genérica que la Ley 12 prohíbe** — y además serían
  //    dos ACCIONES DISTINTAS con el mismo dibujo, que es el caso peor:
  //    compartir MANDA el papel afuera, descargar lo TRAE al teléfono.
  //    Gate por ícono a 21px PENDIENTE (§2.9), como sus vecinos.
  | 'descargar'
  // ── S103-B · COPIAR — LAS DOS HOJAS, y NO nace por falta de dibujo sino
  //    por falta de OBJETO LIBRE. El censo se hizo antes de dibujar y dio
  //    un candidato real: **`documentos` YA es dos hojas apiladas**. No se
  //    reusó, y las dos razones están medidas:
  //      · **Su objeto es otro, declarado en su propia entrada:** «DÓNDE
  //        VIVEN LOS PAPELES». Copiar no es un lugar, es un ACTO —
  //        prestarlo es la sustitución genérica que la Ley 12 prohíbe (el
  //        mismo descarte con el que `compartir` no pudo servir de
  //        `contacto`).
  //      · **Su familia es otra:** `documentos` lleva Huella porque nombra
  //        un mundo; los CONTROLES no la llevan —`lapiz`, `filtro`,
  //        `compartir`, `descargar`, los cuatro sin huella y dicho en sus
  //        entradas—. `copiar` es control: nace sin huella.
  //
  //    EL DIBUJO ES EL ESPEJO EXACTO DEL APILADO, y eso es deliberado: la
  //    orden pide la de atrás asomando ARRIBA-IZQUIERDA y `documentos` la
  //    asoma arriba-derecha, así que **se mirroreó su geometría en vez de
  //    inventar una nueva** — mismas hojas de 10.5, mismo desfase de 3.5 en
  //    los dos ejes, mismo tuck de 3.5 antes del borde de la hoja de
  //    adelante. *Un hermano se construye con la métrica del hermano, no
  //    con una proporción parecida.* Re-centrado en la grilla 24 (bbox
  //    5→19 en los dos ejes, el mismo footprint que `compartir`) porque sin
  //    huella no hay que reservarle la esquina.
  //
  //    ⚠️ EL RIESGO, DECLARADO Y NO DISIMULADO: es el pariente más cercano
  //    que tiene este registry — `documentos` y `copiar` son espejo. Los
  //    separan DOS cosas y conviene saber cuáles: **la huella** (uno la
  //    lleva, el otro no) y **que jamás comparten unidad de barrido** —
  //    `documentos` vive en una fila de navegación del perfil, `copiar` al
  //    lado de un código. La Ley 12 enmendada S71 mide la colisión DENTRO
  //    de la unidad, y acá no hay una común. **Si el founder los ve juntos
  //    a 21px y no los separa, el que se mueve es éste.**
  //    ⚠️ **GATE POR ÍCONO A 21px PENDIENTE (§2.9)**, con el límite de
  //    siempre: en este entorno no hay rasterizador de SVG.
  | 'copiar'
  /* ── S104-B · EL PAR VER/OCULTAR DE LA CLAVE ────────────────────────
   *  Nacen POR PEDIDO DEL FOUNDER (la referencia web pedía «ojo, no la
   *  palabra Ver»). **El censo se hizo antes de dibujar: de los 52 glifos
   *  del registry NINGUNO es un ojo, y ninguno es prestable** — el más
   *  cercano conceptualmente sería `info`, y prestarlo sería exactamente
   *  la sustitución genérica que la Ley 12 prohíbe.
   *
   *  **SON DOS Y NO UNO, y es decisión:** el control tiene dos estados y
   *  cada uno tiene que decir el suyo. Un solo dibujo obligaría a la
   *  pantalla a comunicar el estado por otro canal (color, opacidad), que
   *  es justo lo que el texto «Ver/Ocultar» hacía bien y no queremos
   *  perder al cambiar a glifo.
   *
   *  FAMILIA DE CONTROL ⇒ **sin huella**, tinta en los dos registros —
   *  como `lapiz`, `filtro`, `compartir`, `descargar` y `copiar`.
   *
   *  EL DIBUJO, y por qué éste: almendra simétrica + pupila. El tachado
   *  **suelta la pupila a propósito** — a 21 px almendra + círculo + barra
   *  son tres trazos peleando en 21 px de lado, y la barra ya dice
   *  «apagado» sola. *Un glifo de estado se lee por su diferencia, no por
   *  su detalle.* La barra va a 45° exacto, de 4.5 a 19.5, para que la
   *  diferencia entre los dos hermanos sea UNA línea y no una silueta
   *  nueva.
   *
   *  ⚠️ **GATE POR ÍCONO A 21px PENDIENTE (§2.9)** — como sus vecinos, y
   *  acá con más razón: el trazo lo elegí yo por orden explícita del
   *  founder («elegí vos; el founder corrige después»). **No hay hoja de
   *  contacto de 2-3 variantes**, que es lo que §6b pide — se declara el
   *  atajo en vez de disimularlo: la orden fue construir directo y gatear
   *  sobre lo publicado. */
  | 'ojo' | 'ojoTachado'
  // ── S82-B r10: LA VACUNA gana su glifo (orden founder). Hasta hoy la
  //    fila de vacunas del perfil pintaba `veterinaria` (medido:
  //    `mascota/[mascotaId].tsx:863`) — la sustitución genérica que la
  //    Ley 12 prohíbe, y el mismo caso por el que lápiz y compartir se
  //    frenaron en r7. Gate por ícono a 21px PENDIENTE.
  | 'vacuna'
  // S82-B r34: LA BITÁCORA gana su glifo — adiestramiento mostraba el de
  // VACUNA (sustitución genérica, Ley 12: el mismo caso de lápiz/compartir
  // en r7 y de la vacuna en r10). Gate por ícono a 21px PENDIENTE.
  | 'bitacora'
  // ── S90-B: LA RECETA — el catálogo de papeles pasó de 2 a 4 y el set
  //    ofrecía TRES dibujos viables; A dejó `receta → 'caso'` como
  //    PRÉSTAMO DECLARADO (compila y no miente) hasta que exista el
  //    propio. Éste es el propio. ✅ FIRMADO por la mesa el 7-ago-2026 y
  //    el préstamo RETIRADO en S91-B (`apps/cliente/src/lib/papeles.ts`).
  | 'receta'
  // ── S91-B · DOCUMENTOS, en DOS CANDIDATOS (molde prime/primeCorona: el
  //    founder elige a 21px y el perdedor muere con su lápida).
  //    NACE PORQUE NO HAY GLIFO LIBRE, y está medido: `documento` hace
  //    TRIPLE turno (historia_clinica · ficha_identidad · la entrada a
  //    Documentos del hogar) y `carnet` está tomado por las vacunas. Tres
  //    iguales en una sección abierta es la clase D-546.
  //    EL OBJETO NO ES «un papel»: es DÓNDE VIVEN LOS PAPELES, y el plural
  //    es lo que lo distingue de `documento` (que es UNA cédula con
  //    retrato). Gate por ícono a 21px PENDIENTE (§2.9).
  | 'documentos'
  // ── S91-B · `correo` — NACIÓ COMO CANDIDATO B DE «Documentos» Y PERDIÓ
  //    SU GATE, y NO muere: el founder lo pasó a RESERVA DECLARADA.
  //    Su riesgo era que a 21px se lee «correo» antes que «documentos» —
  //    el rasterizado lo confirmó— y la firma lo dio vuelta: **esa lectura
  //    deja de ser el riesgo y pasa a ser el DESTINO**, para el centro de
  //    avisos cuando crezca.
  //    ⚠️ POR ESO SE RENOMBRA, y no es cosmética: `documentosSobre` decía
  //    «documentos» y el dibujo dice «correo». Un nombre que contradice a
  //    su dibujo es la clase de dato que esta casa caza (misma disciplina
  //    con la que `mascotaId` pasó a `sujetoId`). **CERO consumidores hoy,
  //    a propósito: está en reserva, no en uso.**
  | 'correo'
  // ── S84-B4/B5: CONTACTO — FIRMADO (founder, S84-B5: el GLOBO).
  //    Nace porque la sección "Cómo te contactan" del perfil quedó SIN
  //    glifo mientras sus hermanas tienen el suyo — y las dos salidas
  //    baratas están cerradas por ley: prestar `compartir` es la
  //    sustitución genérica que la Ley 12 prohíbe, y quitarles el glifo
  //    a las hermanas cumple la simetría rompiendo la misma ley (los
  //    headers que significan cosas distintas tienen que separarse).
  //    EL CRITERIO DEL DIBUJO: la sección agrupa CUATRO canales
  //    (teléfono · WhatsApp · correo · sitio), así que el objeto no
  //    puede ser ninguno de los cuatro — un auricular nombra uno y deja
  //    tres afuera. El globo nombra el ACTO, no el canal.
  //
  //    ☠️ EL CANDIDATO B —`contactoOndas`, tres arcos saliendo de un
  //    punto— MURIÓ EN SU GATE, y se registra en vez de borrarse en
  //    silencio. Su porqué, que es la letra: **§1 manda dibujar el
  //    OBJETO del oficio, y el globo es un objeto mientras que "el
  //    alcance" es una idea.** Su riesgo medido lo acompañaba y quedó
  //    confirmado como acierto de haberlo declarado: a 21px compartía
  //    familia visual con `ayuda` (círculo con rayos). Nadie lo revive
  //    sin volver a pasar por §1.
  | 'contacto'
  // ── S84-B20: DOCUMENTO, en DOS CANDIDATOS (molde prime/primeCorona: el
  //    founder elige a 21px y el perdedor muere con su lápida).
  //    Nace porque la pantalla de documentos vive SIN ícono y los dos
  //    prestados fallan POR LEY: `carnet` es el de vacunas de la MASCOTA
  //    —su huella sobre una cédula diría que el documento es del animal—
  //    y `cuenta` lo usa la celda vecina (Ley 12 directa).
  //    EL OBJETO ES IDENTIFICACIÓN (cédula · RUC · NIT), no una carpeta
  //    ni un archivo genérico. GATE POR ÍCONO A 21px PENDIENTE (§2.9).
  //
  //    ⚠️ S91-B · SU DOBLE TURNO, MEDIDO — Y EL PRESTADO NO ES EL QUE SE
  //    CREÍA. Tras cablear el apilado, `documento` queda en DOS usos:
  //    `historia_clinica` y `ficha_identidad` (`apps/cliente/src/lib/
  //    papeles.ts`). La mesa preguntó si nace el glifo propio de
  //    `ficha_identidad` o su préstamo se declara permanente — y contra el
  //    objeto la pregunta está AL REVÉS:
  //      · **`ficha_identidad` NO es la prestataria: es la dueña.** El
  //        objeto declarado dos líneas arriba es «identificación, cédula
  //        CON RETRATO», y la ficha de identidad de una mascota es
  //        exactamente eso — lleva foto. El propio `papeles.ts` ya lo dice
  //        («el objeto EXACTO del registry»).
  //      · **La que presta es `historia_clinica`.** Una historia clínica
  //        NO es una cédula: no identifica, registra. Ahí el dibujo miente
  //        el objeto, que es lo que la Ley 12 persigue.
  //    ⇒ **El glifo que faltaría es el de la HISTORIA CLÍNICA**, y darle
  //    uno propio a `ficha_identidad` dejaría a la dueña con dibujo nuevo
  //    y a la prestataria con el que no le corresponde — el problema
  //    intacto y una pieza más en el registry.
  //
  //    ✅ RATIFICADO POR LA MESA (8-ago-2026), con su letra: «la
  //    prestataria es HISTORIA_CLINICA, no ficha_identidad — una historia
  //    clínica no identifica, REGISTRA; la ficha de identidad SÍ es
  //    identificación con retrato, es dueña legítima del dibujo». Y la
  //    decisión de NO dibujar quedó firmada como correcta: **dibujar para
  //    el objetivo equivocado es más caro que no dibujar** (§6b, la regla
  //    de economía: un glifo que nadie va a montar no se pide).
  //
  //    ☠️ DISPARO DEL GLIFO DE HISTORIA CLÍNICA — firmado, y con sus dos
  //    exclusiones explícitas para que nadie lo adelante por entusiasmo:
  //    **el próximo arco que toque LOS PAPELES o EL REGISTRY DE GLIFOS.**
  //    NO S91 (nada nuevo se abre) · NO S92 (loop de seguridad, sin
  //    features). Cuando llegue: DOS candidatos con hoja de contacto a
  //    21px, misma disciplina que «Documentos» —riesgo declarado por
  //    variante, rasterizados y MIRADOS antes de dejarlos— y el gate por
  //    ícono del founder decide.
  //    ☠️ MUERTE: el día que `historia_clinica` deje de pintar el dibujo
  //    de una cédula. Hasta entonces el préstamo VIVE y está declarado —
  //    que es distinto de estar escondido: `ficha_identidad` NO se toca.
  | 'documento'
  // ── S84-B21: FISCAL y BANCARIO — las otras dos secciones de "Datos
  //    comerciales". Nacen JUNTAS y con `documento` porque el founder
  //    decidió que llevan glifo las TRES o ninguna: ponérselo a una sola
  //    la jerarquiza sin que nadie lo haya decidido.
  //    CENSO PREVIO (la orden lo pidió y encontró algo): `liquidaciones`
  //    NO EXISTE · `cuenta` es una PERSONA · `presupuesto` es documento
  //    con esquina doblada · y **`pagos` es un BILLETE** — un rectángulo
  //    ancho, o sea el idioma que estos dos tenían que esquivar.
  //    GATE POR ÍCONO A 21px PENDIENTE (§2.9).
  | 'fiscal' | 'bancario'
  // S85-B23 — los tres del gate de la barra: `datos` NACE (gráfica) ·
  //   `negocio` y `cuenta` cambian de DIBUJO sin cambiar de nombre.
  | 'datos'
  // S85-B18 — LA VENTANA TEMPORAL: `semana` y `mes`. Solo DOS porque el
  //   censo encontró la otra mitad resuelta: `hoy` ya es el calendario y
  //   `todos` ya se dice con la Huella (hilera hermana del Hogar).
  //   GATE A 21px: se separan CONTANDO barras, y contar a 21px es lo que
  //   puede fallar.
  | 'semana' | 'mes'
  // S88 — LA CAMPANA (lámina firmada 5-ago). Glifo de OBJETO en trazo:
  // su huella NO vive adentro — vive en el Badge cuando hay avisos (la
  // ley del único relleno aplicada AL PAR: campana en trazo + huella
  // rellena en la esquina). NO es «glifo de control»: §6bis sigue
  // pendiente y esta entrada no la funda ni la toca.
  | 'campana'
export type IconoRegistro = 'capa' | 'aa' | 'tinta'

const TRAZO = 1.9

type Pincel = { tinta: string; huella: string }

/* ═══ S86-B · LOS DOS EJES QUE FALTABAN — D-546 y D-645 ══════════════
 *
 * EL HUECO, declarado desde S78 en la propia skill: *"`iconos-tabs.tsx`
 * + `iconos-oficio.tsx` copian geometría del registry porque el contrato
 * no expone trazo y huella por separado (D-546) — hasta que esa prop
 * exista, todo glifo nuevo del prestador nace con este riesgo."* Tres
 * archivos vivían de copiar este dibujo, y su costo se midió: **los tres
 * glifos de la barra del CLIENTE divergieron los tres** (la casa, la
 * brújula y la chapita) mientras el registry evolucionaba sin ellos.
 *
 * ⚠️ Y ES EL DATO QUE ORDENA LA CURA: los siete del prestador estaban
 * BYTE-IDÉNTICOS. No porque el clon funcione — porque C los volvió a
 * copiar A MANO en S85, y su propia cabecera lo dice ("la tercera vez que
 * el clon cobra en una sola sesión"). **Un clon no falla por existir:
 * falla por envejecer, y solo no envejece mientras alguien lo esté
 * mirando.** El cliente no tuvo quien lo mirara.
 *
 * ── EJE 1 · EL COLOR DE LA HUELLA, INDEPENDIENTE DEL TRAZO ──────────
 * `tinta` ya existía (override del trazo). Lo que no existía era su
 * gemelo: los tres registros resuelven la huella ADENTRO y ninguno
 * produce "trazo en tinta + huella en el teal del oficio", que es la
 * composición firmada en el gate S78 y la razón literal por la que
 * `iconos-oficio` nació local. Nace `huella`, simétrica de `tinta`.
 *
 * ── EJE 2 · EL ESTADO DE LA HUELLA, DECLARADO POR EL REGISTRY ───────
 * La ley 6 de DIRECCION_ARTE (v1.5, firmada): ***la huella que es
 * ESTRUCTURA se RECOLOREA; la que es MARCA APARECE. Nunca las dos.***
 *
 * **DÓNDE SE CONTESTA ESA PREGUNTA ES LA DECISIÓN DE DISEÑO DE ESTA
 * ENMIENDA, y se declara porque diverge de cómo se pidió.** La orden
 * pedía TRES ESTADOS EN LA PROP (`'presente' | 'aparece' | 'recolorea'`),
 * con el argumento correcto de que un boolean aplana la distinción. El
 * argumento se respeta entero; lo que cambia es quién lo responde:
 *
 *   · Con el modo EN LA PROP, la pantalla elige — y puede elegir mal.
 *     `modoHuella="aparece"` sobre `negocio` (que ES una huella y nada
 *     más) **borra el glifo entero en reposo**: compila, no rompe nada,
 *     y la tab queda vacía. Es el modo de falla que esta casa nombró
 *     como el más caro (L-192: falla que produce una salida creíble).
 *   · Con el modo EN EL REGISTRY, la pregunta se contesta UNA VEZ, al
 *     lado del dibujo — que es literalmente lo que la ley 6 manda
 *     ("se contesta ANTES de dibujar") — y **ninguna pantalla puede
 *     romperla**. Precedente exacto de la casa: `FilaCita` con su canto
 *     de capa ("CERO API de color/posición/alfa: ninguna pantalla puede
 *     romper la ley").
 *
 * **LOS TRES ESTADOS SIGUEN SIENDO TRES y siguen siendo distinguibles
 * por tipo** — no se aplanó nada: `activa` sin definir = PRESENTE (todo
 * el producto fuera de una barra) · `activa` definida + huella de MARCA
 * = APARECE · `activa` definida + huella de ESTRUCTURA = RECOLOREA. El
 * boolean que la orden vetaba era el que decidía el COMPORTAMIENTO; éste
 * solo transporta el ESTADO, y el comportamiento lo dicta el registry.
 *
 * ⇒ Es un desvío de la letra de la orden, a favor de su argumento. Lo
 *   adjudica la mesa: revertir a `modoHuella` es mecánico (una prop, un
 *   switch) y esta nota dice contra qué se cambió. */

/** Glifos cuya huella ES EL DIBUJO — si no se pinta, no queda glifo.
 *  Se recolorean al activarse (ley 6); jamás desaparecen en reposo.
 *  Medido uno por uno contra su dibujante, no supuesto:
 *   · `negocio` — la pata sola, sin objeto que la sostenga (S85-B28: su
 *     regresión fue exactamente ésta, la huella tratada como marca).
 *   · `datos`   — la huella es LA BARRA MÁS ALTA de la gráfica; sin ella
 *     la gráfica pierde su barra y el dibujo dice otra cosa (S85-B23).
 *   · `ia`      — las tres chispas se pintan con el color de huella y no
 *     hay trazo debajo: es el único glifo del set sin objeto (§5.1).
 *  `familia` NO entra y es el borde que prueba la regla: tiene DOS
 *  huellas, pero la grande va en TINTA (hace de objeto) y solo la chica
 *  porta la capa — el glifo sobrevive sin ella, así que su huella es
 *  marca. */
const HUELLA_ES_ESTRUCTURA: ReadonlySet<IconoNombre> = new Set([
  'negocio',
  'datos',
  'ia',
])

const trazo = (color: string) => ({
  stroke: color,
  strokeWidth: TRAZO,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none' as const,
})

// Chispa cóncava de 4 puntas — path canónico minado del SVG de Kaxo
// (entrega/exportables/kaxo-destello.svg, S53) y RE-TOKENIZADO:
// jamás el mostaza; acá vive en magenta puro vía theme (§5.1).
const CHISPA =
  'M12 .5c.6 5.4 5.6 10.4 11.5 11.5C17.6 13.1 12.6 18.1 12 23.5 11.4 18.1 6.4 13.1.5 12 6.4 10.9 11.4 5.9 12 .5Z'

// ── El registry del set b′ ───────────────────────────────────────────
const DIBUJANTES: Record<IconoNombre, (p: Pincel) => React.JSX.Element> = {
  // La correa cae hasta la huella — la mascota tirando (capa cuidado).
  paseo: ({ tinta, huella }) => (
    <>
      <Circle cx={17} cy={5.4} r={2.5} {...trazo(tinta)} />
      <Path d="M16.7 7.8c1.1 3.4-2.7 4.6-5.8 5.4" {...trazo(tinta)} />
      <Huella color={huella} x={1.6} y={12.2} escala={0.47} />
    </>
  ),

  // El estetoscopio ESCUCHA a la huella (salud → verde vital).
  veterinaria: ({ tinta, huella }) => (
    <>
      <Path d="M7.2 3v3.5a4.8 4.8 0 0 0 9.6 0V3" {...trazo(tinta)} />
      <Path d="M12 11.3v2.1c0 2.8-1 4.8-3.1 4.8" {...trazo(tinta)} />
      <Circle cx={6.6} cy={18.2} r={2.3} {...trazo(tinta)} />
      <Huella color={huella} x={12.6} y={12.4} escala={0.46} />
    </>
  ),

  // Las tijeras trabajan; la huella espera al costado (cuidado → ocre).
  grooming: ({ tinta, huella }) => (
    <>
      <Path d="M11.8 4.6 6.4 14.2" {...trazo(tinta)} />
      <Path d="M6.8 4.6l5.4 9.6" {...trazo(tinta)} />
      <Circle cx={5.2} cy={16.6} r={2.4} {...trazo(tinta)} />
      <Circle cx={13.4} cy={16.6} r={2.4} {...trazo(tinta)} />
      <Huella color={huella} x={13.8} y={9.2} escala={0.42} />
    </>
  ),

  // La huella vive dentro del corazón (afecto → magenta).
  refugio: ({ tinta, huella }) => (
    <>
      <Path
        d="M12 20.6C7 16.6 3.4 13 3.4 9.1c0-2.9 2.3-5 4.9-5 1.5 0 2.9.7 3.7 1.9.8-1.2 2.2-1.9 3.7-1.9 2.6 0 4.9 2.1 4.9 5 0 3.9-3.6 7.5-8.6 11.5Z"
        {...trazo(tinta)}
      />
      <Huella color={huella} x={7} y={6.6} escala={0.42} />
    </>
  ),

  // La bolsa lleva su huella — lo de adentro es para ellos (consumo → ocre).
  despensa: ({ tinta, huella }) => (
    <>
      <Path
        d="M5.8 8.2h12.4v11.4a1.9 1.9 0 0 1-1.9 1.9H7.7a1.9 1.9 0 0 1-1.9-1.9V8.2Z"
        {...trazo(tinta)}
      />
      <Path d="M9 8.2V6.3a3 3 0 0 1 6 0v1.9" {...trazo(tinta)} />
      <Huella color={huella} x={7.2} y={10} escala={0.4} />
    </>
  ),

  // El destello — trío de chispas de Kaxo, re-tokenizado a magenta
  // (§5.1). Sin huella: el destello ES la marca de la IA, y por eso este
  // glifo NO obedece la ley de §1 (objeto en trazo + huella): las chispas
  // van RELLENAS y sin huella. Es excepción FIRMADA en S53, no descuido —
  // y es la razón por la que en S84-B10 NO nació un segundo glifo de
  // destellos: habrían sido dos marcas de IA con dos anatomías.
  ia: ({ huella }) => (
    <>
      <G transform="translate(2.16 6.84) scale(0.57)">
        <Path d={CHISPA} fill={huella} />
      </G>
      <G transform="translate(13.8 2.16) scale(0.3)">
        <Path d={CHISPA} fill={huella} />
      </G>
      <G transform="translate(16.5 14.4) scale(0.204)">
        <Path d={CHISPA} fill={huella} />
      </G>
    </>
  ),

  // ══ LOTE 3 (S58, D-361) — cada firma del founder poda o suma ══
  // La casa que abriga — la huella vive adentro (tab Hogar, comunidad).
  hogar: ({ tinta, huella }) => (
    <>
      <Path d="M4.2 11.3 12 4.6l7.8 6.7V19a1.4 1.4 0 0 1-1.4 1.4H5.6A1.4 1.4 0 0 1 4.2 19Z" {...trazo(tinta)} />
      <Huella color={huella} x={8} y={10.6} escala={0.42} />
    </>
  ),
  // La brújula señala; la huella es el sur que importa (tab Explorar).
  explorar: ({ tinta, huella }) => (
    <>
      <Circle cx={12} cy={12} r={8.4} {...trazo(tinta)} />
      <Path d="M15.2 8.8 13 13l-4.2 2.2L11 11Z" {...trazo(tinta)} />
      <Huella color={huella} x={9.2} y={12.6} escala={0.3} />
    </>
  ),
  /* S85-B23 · DATOS — «un símbolo con una gráfica» (founder, gate de
     019fcabf: «hoy es paw y no dice lo que la pantalla es»).
     CENSO: el idioma GRÁFICA estaba LIBRE — cero glifos de barras o
     curva en el registry (`pagos` es un billete, `presupuesto` un
     documento, `BarrasSemana` es componente y no glifo).
     LA HUELLA ES LA BARRA MÁS ALTA, y no un adorno al costado: la
     pantalla responde «a quiénes cuido», así que lo que la gráfica mide
     ES la mascota. Cumple la regla madre sin agregarle un objeto más. */
  datos: ({ tinta, huella }) => (
    <>
      <Path d="M4.4 20.2h15.2" {...trazo(tinta)} />
      <Path d="M7.6 20.2v-5.4M12 20.2v-8.6" {...trazo(tinta)} />
      <Huella color={huella} x={14.4} y={5.2} escala={0.42} />
    </>
  ),

  /* ⏪ S85-B23 · LA CHAPITA DE COLLAR MURIÓ, ENTRA LA PERSONA. Literal
     del founder: «algo que realmente parezca cuenta» — el actual no se
     entiende, y midiendo se ve por qué: eran DOS CÍRCULOS APILADOS
     (cabeza + chapa), que a 21px no leen "collar" ni leen "persona": no
     leen nada. Y de paso eran BYTE-IDÉNTICOS a `prime`, o sea que el
     registry tenía dos nombres para un dibujo.

     ⚠️⚠️ ESTO ENMIENDA UNA FIRMA SUYA, Y SE DECLARA EN VEZ DE COLARSE:
     §2.4 (S53) dice, del propio founder, «humanos = manos u objetos», y
     el comentario que estaba acá decía literalmente «la figura humana
     del boceto S57 quedó PROHIBIDA §2.4». Hoy pide una persona. **Gana
     la firma más nueva** —es su producto y su ojo— pero la anterior NO
     se borra en silencio: dos letras firmadas que se contradicen son
     peores que una equivocada, porque cualquiera cita la que le conviene
     y queda "en regla". Que la mesa enmiende §2.4 o acote su alcance
     (p. ej. "humanos como ILUSTRACIÓN, no como glifo de identidad").
     Hasta entonces, esta nota es el puente entre las dos.

     LA FORMA: cabeza + HOMBROS (arco), que es el avatar universal — no
     dos círculos. Y la huella va al costado, chica: la cuenta es de una
     PERSONA, pero la persona está acá por su mascota. */
  cuenta: ({ tinta, huella }) => (
    <>
      <Circle cx={12} cy={8.2} r={3.4} {...trazo(tinta)} />
      <Path d="M5.2 20.4a6.8 6.8 0 0 1 13.6 0" {...trazo(tinta)} />
      <Huella color={huella} x={16.4} y={3.2} escala={0.3} />
    </>
  ),
  // El sol del oficio — el día de trabajo con la mascota adentro.
  // ⏪ S85-B12 · EL SOL MURIÓ, ENTRA LA AGENDA — cura firmada por el
  //    founder EN DISPOSITIVO: «`preferencias` y `hoy` se confunden en la
  //    barra de tabs… el hoy lo podés dejar con un icono de agenda».
  //
  //    EL DEFECTO, medido antes de que él lo reportara y confirmado por
  //    él después: los dos eran EL MISMO IDIOMA — círculo r≈4.5 con rayos
  //    radiales (`preferencias` 8 rayos = engranaje · `hoy` 8 rayos =
  //    sol). A 21px la única diferencia era la cuenta de rayos, y viven
  //    UNO AL LADO DEL OTRO en la barra de tabs del prestador: la unidad
  //    de barrido donde la Ley 12 exige que el ojo separe. Es el caso más
  //    caro de esa ley porque el usuario los ve juntos todos los días.
  //
  //    NO NACE UN NOMBRE NUEVO, y es la decisión: `hoy` sigue siendo
  //    `hoy`. Lo que cambió es su DIBUJO, no lo que nombra — un alias o
  //    un `hoyAgenda` habría dejado dos nombres para una sola cosa, que
  //    es no decidir cuál es el correcto (el argumento que mató al alias
  //    de `coach`→`ia`). Cero consumidores tocados.
  //
  //    EL CENSO, porque un calendario es un RECTÁNGULO y ese idioma está
  //    ocupado CINCO VECES (`presupuesto` · `bitacora` · `caso` · `pagos`
  //    · `documento`): lo que lo saca del idioma son LAS DOS ANILLAS de
  //    arriba. Es el mismo movimiento que salvó a `documento` (el
  //    retrato) y a `bancario` (las columnas) — no se busca otro objeto,
  //    se busca el rasgo que lo saca del idioma. Sin anillas sería la
  //    sexta hoja rectangular; con anillas no se parece a ninguna.
  //
  //    Y LA HUELLA ENTRA COMO EL DÍA MARCADO, que es lo que hace que el
  //    glifo cumpla la regla madre sin decorarse: en una agenda el día
  //    marcado es EL que importa, y acá el que importa es la mascota.
  /* LA PUERTA ABIERTA — el destino central del prestador (S97+, pedido
     de C, adjudicación de mesa 13-ago). Nombra **atender a quien llegó
     por la puerta, sin turno**: el mostrador.

     POR QUÉ LA PUERTA Y NO LA CAMPANA DE MOSTRADOR, que era el objeto
     obvio: `campana` ya existe (avisos, S88) y **no se disputa** — un
     glifo con dos significados es informar sin informar. Y la mesa
     inclinó por la puerta con un argumento mejor que la legibilidad:
     **el concepto ya vive en la letra de la casa** («la puerta cambia
     permisos» · «quien está en la puerta» · «en la puerta · Thor ·
     Llegó»). El glifo no inventa vocabulario: materializa el que ya se
     habla.

     DÓNDE ESTÁ LA MASCOTA (regla madre §1): **entrando por el vano**. La
     hoja abierta deja el hueco a la derecha y la huella lo ocupa — no
     está al costado como adorno, está en el lugar por el que se entra.

     ⚠️ SU GATE ES A 21px Y NO ESTÁ DADO (Ley 9: a ese tamaño la huella
     sobrevive o es ruido). El riesgo declarado de esta forma: la
     diagonal de la hoja y la jamba izquierda pueden fundirse en una sola
     mancha vertical. Si el founder lo ve así, el recambio ya está
     elegido y es de forma, no de concepto: **el vano SIN hoja** (solo el
     marco y la huella entrando), que pierde el gesto de «abierta» pero
     gana aire. La puerta se conserva en los dos casos. */
  atender: ({ tinta, huella }) => (
    <>
      {/* el marco: jambas + dintel, abierto abajo */}
      <Path d="M5 21V5a1.6 1.6 0 0 1 1.6-1.6h10.8A1.6 1.6 0 0 1 19 5v16" {...trazo(tinta)} />
      {/* el umbral — el piso que hace leer «puerta» y no «ventana» */}
      <Path d="M3.2 21h17.6" {...trazo(tinta)} />
      {/* la hoja abierta hacia adentro: la diagonal ES el «abierta» */}
      <Path d="M5 21V7.8l6.4-2.1v15.3" {...trazo(tinta)} />
      {/* la mascota entrando por el vano que la hoja dejó libre */}
      <Huella color={huella} x={13.2} y={13.4} escala={0.42} />
    </>
  ),
  hoy: ({ tinta, huella }) => (
    <>
      <Path d="M6 6.4h12a1.6 1.6 0 0 1 1.6 1.6v11.4a1.6 1.6 0 0 1-1.6 1.6H6a1.6 1.6 0 0 1-1.6-1.6V8A1.6 1.6 0 0 1 6 6.4Z" {...trazo(tinta)} />
      <Path d="M4.4 10.8h15.2" {...trazo(tinta)} />
      <Path d="M8.6 3.4v4M15.4 3.4v4" {...trazo(tinta)} />
      <Huella color={huella} x={8.4} y={12.4} escala={0.36} />
    </>
  ),
  // El maletín del oficio lleva su huella (tab Negocio).
  /* ⏪ S85-B23 · EL MALETÍN MURIÓ, ENTRA LA PATA. Literal del founder:
     «**el negocio son mascotas**». Un maletín es el objeto de una oficina
     y este negocio no lo es.
     ⚠️ EL FRENO QUE CORRÍ ANTES DE DIBUJAR, porque en aislado esto era
     FATAL: la tab «Datos» ES `mascotas` y su glifo ERA la pata — dos
     tabs vecinas con el mismo dibujo es la Ley 12 en su peor forma. Se
     disuelve porque la misma orden MUEVE la pata: Datos gana la gráfica
     y la suelta. En aislado hubiera sido colisión; junto es una mudanza.
     ⚠️ Y LA SEGUNDA MITAD, para quien monte el wrapper de la tab: la
     barra marca el tab activo CON UNA HUELLA. Un glifo que YA es huella
     no puede recibir otra encima —sería huella entre huellas, R22— así
     que **la pata se RECOLOREA al activarse** en vez de acumular. La
     receta ya existe y es la de `IconoMascotas`. */
  negocio: ({ huella }) => (
    <>
      {/* 🔴 S85-B28 · LA HUELLA COMO SUJETO, y acá está la regresión que
          esto cura: al sacar el maletín dejé la huella en su posición de
          MARCA (x 8.7, escala 0.4) — que era su lugar ADENTRO del objeto,
          chica y al costado. Sola, en una caja de 24, se lee como nada: el
          founder reportó que «Tu espacio perdió el glifo». Y lo peor es
          que la receta correcta la escribí YO en el commit que lo rompió
          («la receta ya existe: es la de IconoMascotas») y no la apliqué
          al glifo del registry — solo la documenté para el wrapper. Una
          receta escrita y no aplicada es exactamente lo mismo que no
          tenerla. Ahora la huella es el ÍCONO: centrada y grande, los
          mismos números que `IconoMascotas`. */}
      <Huella color={huella} x={2} y={2} escala={0.84} />
    </>
  ),
  // La jeringa protege; la huella verde es la vida cuidada (carnet).
  /* A · CERTIFICACIONES — la hoja con la esquina doblada, y **la huella como
     SELLO**. Sin renglones.
     ⏪ **LOS RENGLONES SE FUERON, y los mató un censo de C que yo no había
     hecho:** su pedido avisaba *«si el papel que acredita ya tiene una forma
     acá, el tercero no la reinventa»*, y el registry lo dice más fuerte en la
     entrada de `fiscal`: **«el idioma "rectángulo con renglones" ya está
     ocupado CINCO veces en este registry»**. *Mi primer dibujo era el sexto.*

     ⇒ El diferenciador no puede ser el relleno del papel — tiene que ser
     estructural, como el **dentado** de `fiscal` o el **retrato** de
     `documento`. Acá es **el sello**, y el sello es la huella.
     🔴 **Y la cura arregló DOS cosas de una:** los renglones eran también mi
     propio riesgo declarado a 21px (*«pueden empastarse con el borde»*).
     *Sacarlos despeja la colisión y el tamaño chico al mismo tiempo.* */
  certificaciones: ({ tinta, huella }) => (
    <>
      <Path d="M5.4 2.8h9.4l4 4v14.4H5.4Z" {...trazo(tinta)} />
      <Path d="M14.6 2.9v4.1h4" {...trazo(tinta)} />
      <Huella color={huella} x={11.4} y={13.4} escala={0.46} />
    </>
  ),
  /* A · WEARABLE — el dispositivo: cuerpo redondeado + dos tramos de correa,
     y **la huella ADENTRO**. El aparato muestra a la mascota: eso dice
     «monitorea, y monitorea a ELLA» sin corazón y sin ondas.
     RIESGO DECLARADO: la silueta se parece a un reloj, y un reloj puede
     leerse como «hora». Lo desambigua la huella adentro — que es
     exactamente lo que un reloj no tiene. */
  wearables: ({ tinta, huella }) => (
    <>
      <Path d="M9 2.6h6l-.5 3.4M9 21.4h6l-.5-3.4M9.5 6h5" {...trazo(tinta)} />
      <Path d="M6.4 8.6a2 2 0 0 1 2-2h7.2a2 2 0 0 1 2 2v6.8a2 2 0 0 1-2 2H8.4a2 2 0 0 1-2-2Z" {...trazo(tinta)} />
      <Huella color={huella} x={9.6} y={9.4} escala={0.38} />
    </>
  ),
  carnet: ({ tinta, huella }) => (
    <>
      <Path d="M18.2 2.8l3 3M16.4 7.6l1.7-1.7" {...trazo(tinta)} />
      <Path d="M14 5.2l4.8 4.8-7.4 7.4H6.6v-4.8Z" {...trazo(tinta)} />
      <Huella color={huella} x={3.4} y={14.6} escala={0.36} />
    </>
  ),
  // Dos huellas, una chica — la familia camina junta. La grande es de
  // TINTA (hace de objeto); la chica porta la capa (UNA huella de capa).
  familia: ({ tinta, huella }) => (
    <>
      <Huella color={tinta} x={3.6} y={4.6} escala={0.58} />
      <Huella color={huella} x={14.2} y={12.6} escala={0.38} />
    </>
  ),
  // El engranaje con la huella en el centro — se ajusta para ellos.
  preferencias: ({ tinta, huella }) => (
    <>
      <Circle cx={12} cy={12} r={4.4} {...trazo(tinta)} />
      <Path d="M12 3.4v2.4M12 18.2v2.4M3.4 12h2.4M18.2 12h2.4M5.9 5.9l1.7 1.7M16.4 16.4l1.7 1.7M18.1 5.9l-1.7 1.7M7.6 16.4l-1.7 1.7" {...trazo(tinta)} />
      <Huella color={huella} x={9.4} y={9.6} escala={0.3} />
    </>
  ),
  // El billete con huella ocre — la plata del cuidado (pagos y
  // liquidaciones comparten dibujo).
  /* PAPELERA — G-08 (S100b-B). El `−` del stepper se vuelve papelera
     CUANDO LA CANTIDAD ES 1 **y solo en el carrito** (`[SPEC]` eBay: *«the
     delete action is only to be used when the numeric stepper is pair or
     associated with an item tile such as item list in cart»*). En la
     grilla el menos en 1 vuelve a «Agregar»: ahí el tile no desaparece.

     🔴 **SIN HUELLA, Y NO ES UN OLVIDO DE LA LEY 12: es la familia de
     CONTROL.** Medido en el registry antes de dibujarla — `lapiz`,
     `compartir` y `descargar` **no llevan huella ninguna**. ⇒ existe una
     familia exenta y la papelera pertenece a ella.
     *Y en este glifo la exención además salva el significado: una huella
     adentro de un tacho de basura diría algo que esta casa jamás querría
     decir.* La ley pedía la mascota presente en los glifos que nombran su
     mundo; un control de borrado no nombra su mundo. */
  papelera: ({ tinta }) => (
    <>
      {/* la tapa y su asa */}
      <Path d="M4.2 6.6h15.6M9.4 6.6V5.2a1.2 1.2 0 0 1 1.2-1.2h2.8a1.2 1.2 0 0 1 1.2 1.2v1.4" {...trazo(tinta)} />
      {/* el cuerpo */}
      <Path d="M6.2 6.6l.9 11.6a1.6 1.6 0 0 0 1.6 1.5h6.6a1.6 1.6 0 0 0 1.6-1.5l.9-11.6" {...trazo(tinta)} />
      {/* las dos estrías: dicen «tacho» a 21px, que es donde se gatea */}
      <Path d="M10.4 10.2v5.6M13.6 10.2v5.6" {...trazo(tinta)} />
    </>
  ),
  /* 🔴 CARRITO — G-14 (S100b-B). *«El carrito no tiene ícono en la barra:
     es un botón de texto donde la industria usa una canasta con su
     contador.»*

     POR QUÉ ES GLIFO NUEVO Y NO `despensa`, que era la salida barata:
     **`despensa` es LA SECCIÓN y el carrito es LO QUE LLEVÁS ADENTRO de
     ella.** Pueden —y van a— convivir en la misma pantalla: la tab dice
     dónde estás, el carrito dice cuánto llevás. *Con un alias, el mismo
     dibujo diría «acá se compra» y «esto es tuyo» al mismo tiempo, y en
     la barra de tabs quedarían dos bolsas idénticas con significados
     distintos* — el mismo argumento con el que `info` no fue alias de
     `ayuda` (S98).

     LA HUELLA VA ADENTRO DE LA CANASTA, y acá el lugar es el significado:
     **lo que se lleva en la canasta es para la mascota.** Ley 12 pedía la
     huella presente; este glifo es de los pocos donde además *dice algo*
     al estar donde está.

     ⚠️ **SIN GATE DE ÍCONO — §2.9 exige verlo a su tamaño de diseño Y a
     21 px, y ese gate es del founder.** Se declara pendiente en vez de
     darse por bueno. */
  /* ⏪ ENMENDADO S100c-B — N25 ①. LA CANASTA PASA A SER UN CARRITO.
     Firma del founder: *«no es un carrito, es una bolsa y se ve muy fea.
     Hay que poner un carrito, que es lo que siempre han utilizado todas
     las compañías.»*

     🔴 **LA CAUSA HAY QUE DEJARLA ESCRITA, PORQUE ES LA LECCIÓN Y NO EL
     ERROR:** el argumento de S100b para que este glifo NO fuera alias de
     `despensa` **sigue en pie y no se toca** (*la tab dice dónde estás, el
     carrito dice cuánto llevás*). Lo que falló no fue la distinción: **fue
     que la forma se eligió desde la palabra «canasta»** —que estaba en el
     texto del gate— **en vez de medirse contra el objeto.** Una canasta con
     asa de arco y cuerpo que se angosta **tiene exactamente la silueta de
     una bolsa**, y a 21 px la silueta es todo lo que queda.

     > *Es la ley de la barra de S99 en ropa nueva: **la referencia se MIDE,
     > no se describe.*** Allá cuatro traducciones en prosa mandaron a
     > construir un bulto que la referencia no tenía; acá una palabra mandó
     > a dibujar una bolsa.

     **EL DISCRIMINADOR SON LAS RUEDAS, y por eso es el correcto:** es el
     único rasgo que una bolsa y una canasta **no pueden tener**. Y
     sobrevive al gate de 21 px porque son **dos discos**, no un detalle de
     trazo (Ley 9: a 21 px la huella sobrevive o es ruido — lo mismo vale
     para cualquier rasgo).

     **La barra de empuje entra por la izquierda** —el otro rasgo que la
     industria repite (Laika, Amazon, Mercado Libre, Rappi)— y ancla la
     lectura: sin ella, un trapecio con ruedas puede leerse como changuito
     de supermercado o como zapato.

     **LA HUELLA SE QUEDA ADENTRO DE LA CESTA**, y su razón no cambió: *lo
     que se lleva es para la mascota.* Es de los pocos glifos donde el lugar
     de la huella además DICE algo.

     ⚠️ **SIN GATE DE ÍCONO — §2.9 exige verlo a su tamaño de diseño Y a
     21 px, y ese gate es del founder.** Y se declara algo más: **en este
     entorno no hay rasterizador de SVG** (ni `cairosvg`, ni `rsvg-convert`,
     ni Inkscape), así que **no se pudo verificar la legibilidad a 21 px sin
     pasar por RN-web o por un publish.** Se dice en vez de darse por bueno. */
  /* ⏪ ═══ ENMENDADO S100d-B — LA HUELLA SALE DE LA CESTA (punto 8 del gate).
     Firma del founder, verbatim: *«quedó arriba, muy pequeño y **con una
     huella ocre encima**. Hay que hacerlo mucho mejor.»*

     **Lo que sobrevive entero:** el carrito con ruedas y su barra de empuje
     (la enmienda de S100c) y la distinción `carrito` ≠ `despensa` (S100b).
     **Lo único que se va es la huella.**

     🔴 **Y LA RAZÓN NO ES «LO PIDIÓ EL FOUNDER» — es que este glifo cambió
     de familia y nadie lo había registrado.** Su propio tipo, veinte líneas
     más arriba, ya describía a `papelera` como *«familia de CONTROL: sin
     huella, como `lapiz`»*. **`carrito` es exactamente eso:** su único
     consumidor medido contra `origin/main` (`despensa/index.tsx:747`) es un
     `Pressable`, y a partir de hoy el otro es el carrito flotante. *No nombra
     una sección ni un servicio: es el botón que abre lo que llevás.*

     ⇒ **LA REGLA, y ya estaba viva sin escribirse: un glifo montado DENTRO
     de un control no lleva huella.** Ley 12 pide la mascota presente en los
     glifos que NOMBRAN algo; los verbos de la casa —`lapiz`, `papelera`,
     `compartir`, `descargar`— nunca la llevaron. *Lo que cambia hoy no es la
     ley: es que este glifo se había clasificado mal.*

     **Y la mitad medible, que es la que sobrevive a que alguien cambie de
     opinión:** la huella iba a `escala 0.38` DENTRO de la cesta —un interior
     de ~9 unidades de la grilla 24—, o sea **~7,9 px en el gate de 21 px**.
     **Ley 9 es literal: a 21 px la huella SOBREVIVE O ES RUIDO.** Acá era
     ruido, y encima ruido teñido: `carrito` hereda el ocre de `despensa`, así
     que sobre el disco ocre del flotante la huella habría desaparecido contra
     su propio fondo.

     ⚠️ **SIN GATE DE ÍCONO — §2.9 sigue exigiendo el ojo del founder a 21 px,
     y en este entorno NO hay rasterizador de SVG** (ni `cairosvg`, ni
     `rsvg-convert`, ni Inkscape). *Se declara en vez de darse por bueno.* */
  carrito: ({ tinta }) => (
    <>
      {/* la barra de empuje: entra por la izquierda y baja a la cesta */}
      <Path d="M2.4 4.2h2.3l1.2 4.4" {...trazo(tinta)} />
      {/* la cesta — trapecio abierto arriba, apoyado sobre el eje */}
      <Path
        d="M5.9 8.6h15.7l-1.6 6.6a1.7 1.7 0 0 1-1.6 1.3H9.1a1.7 1.7 0 0 1-1.7-1.3Z"
        {...trazo(tinta)}
      />
      {/* LAS RUEDAS — el rasgo que ninguna bolsa ni canasta puede tener */}
      <Circle cx={10.2} cy={20} r={1.5} {...trazo(tinta)} />
      <Circle cx={17.6} cy={20} r={1.5} {...trazo(tinta)} />
    </>
  ),
  /* 🔴 PEDIDO — S100c-B, pedido de la pista D con su defecto medido.

     **El caso:** la barra de cinco tabs entró en este bundle y **Pedidos
     quedó usando el glifo `despensa` PRESTADO** ⇒ **dos tabs vecinas con el
     MISMO dibujo.** *Dos tabs que se dibujan igual le piden al dueño que lea
     la etiqueta para saber dónde está, y la etiqueta mide 11 px.*

     **D no lo inventó y frenó bien:** un glifo se firma por gate (§2.9) y
     elegir la forma desde la palabra es la lección que S99 pagó con ocho
     gates. **Lo pidió con el caso, que es como se pide una pieza.**

     ── POR QUÉ UNA CAJA, Y NO OTRA COSA ────────────────────────────────
     La familia ya tiene los otros dos momentos de la compra y hay que
     distinguirse de ELLOS, no de una idea:
       · `despensa` = **la bolsa** — la SECCIÓN, donde se compra.
       · `carrito`  = **el carro con ruedas** — lo que llevás y todavía no
                      compraste.
       · `pedido`   = **la caja cerrada** — lo que YA compraste y viene en
                      camino.

     **El discriminador es LA TAPA**: una costura horizontal cruzando el
     cuerpo, que ni la bolsa ni el carro tienen. *Y sobrevive a 21 px porque
     es una LÍNEA RECTA de lado a lado — el rasgo más barato de leer que
     existe, al revés de un detalle de trazo* (Ley 9).

     **La huella va DENTRO de la caja**, y acá el lugar dice algo igual que
     en `carrito`: **lo que viene en la caja es para la mascota.**

     ⚠️ **SIN GATE DE ÍCONO — §2.9 pide verlo a 21 px y ese gate es del
     founder.** Y se declara el mismo límite que el `carrito` con ruedas:
     **en este entorno no hay rasterizador de SVG**, así que su legibilidad
     a 21 px **no se verificó**. Se dice en vez de darse por bueno. */
  pedido: ({ tinta, huella }) => (
    <>
      {/* el cuerpo de la caja */}
      <Path
        d="M4.2 8.6h15.6v9.3a1.6 1.6 0 0 1-1.6 1.5H5.8a1.6 1.6 0 0 1-1.6-1.5Z"
        {...trazo(tinta)}
      />
      {/* LA TAPA — el discriminador: una costura recta de lado a lado que
          ni la bolsa ni el carro tienen */}
      <Path d="M3.2 5.4h17.6v3.2H3.2Z" {...trazo(tinta)} />
      <Huella color={huella} x={9.9} y={11.6} escala={0.38} />
    </>
  ),
  pagos: ({ tinta, huella }) => (
    <>
      <Path d="M3.4 7.4h17.2a0 0 0 0 1 0 0v9.2a0 0 0 0 1 0 0H3.4a0 0 0 0 1 0 0V7.4a0 0 0 0 1 0 0Z" {...trazo(tinta)} />
      <Path d="M6.4 10.2v3.6M17.6 10.2v3.6" {...trazo(tinta)} />
      <Huella color={huella} x={8.9} y={9.2} escala={0.38} />
    </>
  ),
  // El salvavidas — ayuda que flota, con la huella a salvo adentro.
  /* ⓘ INFO — QUÉ SIGNIFICA ESTE CAMPO (S98, pedido de C con dos
     consumidores medidos).

     🔴 POR QUÉ ES UN GLIFO NUEVO Y NO UN ALIAS DE `ayuda`, que era la
     salida barata: `ayuda` es **el salvavidas** —círculo + cuatro rayos,
     con su huella al centro— y su propio comentario lo dice. **Un
     salvavidas dice CONTACTÁ SOPORTE; un ⓘ dice QUÉ SIGNIFICA ESTE
     CAMPO.** Son dos trabajos y **pueden convivir en una pantalla**: la
     ayuda del producto vive en Cuenta, la explicación de un campo vive
     pegada al campo. Resolverlo con un alias significaría que el día que
     estén juntas, el mismo dibujo pide auxilio y define una palabra —
     *un glifo con dos significados es informar sin informar* (el mismo
     criterio con el que la campana no se disputó para `atender`).

     LA PUERTA YA ESTABA ESCRITA Y SE DISPARÓ: el ⓘ vivía local en
     `hogar/mascota/[mascotaId]` con su propia condición —«candidato al
     registry por su puerta **si se repite**»— y C lo necesitó para la
     hora de corte en `ventas/configuracion`. **Copió la geometría MEDIDA
     en vez de dibujar una segunda**, así que no hay dos formas que
     reconciliar: el trazo de acá es el del precedente.

     ⚠️ SIN HUELLA, y el argumento es GEOMÉTRICO, no estético: en `ayuda`
     la huella va en `x 9.3 · y 9.5` —**el centro exacto**— y en el ⓘ ese
     centro lo ocupan la barra y el punto. Ponerla ahí es colisión
     literal, y a 18-21 px eso es ruido, no presencia (Ley 9).
     **Hay precedente firmado de glifo sin huella:** `ia` (excepción S53),
     por una razón de la misma familia — su marca ES el dibujo.

     ✅ **GATE DADO — FIRMA DEL FOUNDER (S98): EL ⓘ VA SIN HUELLA**, y con
     él cierra la categoría **«glifo de control»** que S79 dejó nombrada
     y sin gate. La regla que firmó, verbatim:

       ***«en un glifo de control no hay mascota, hay interfaz; la huella
       se reserva para donde significa.»***

     ⚡ ESO ASCIENDE EL ARGUMENTO DE ACÁ Y LO REEMPLAZA. Lo de abajo era
     geométrico —«en el ⓘ el centro lo ocupan la barra y el punto»— y
     servía para ESTE dibujo; la firma da la razón GENERAL, que vale para
     el próximo glifo de control aunque su centro esté libre. *Un
     argumento que solo explica el caso que tenés adelante no evita el
     caso siguiente.* La geometría queda escrita porque sigue siendo
     cierta y porque explica por qué éste fue el primero en pedirlo.

     ⚠️ DÓNDE QUEDA LA FRONTERA, que es lo que hay que no perder: la
     huella marca lo que TIENE MASCOTA ADENTRO —oficios, entidades,
     lugares del expediente—. Un control es andamiaje: informa, abre,
     configura. **`ia` deja de ser una excepción suelta de S53 y pasa a
     ser el primer habitante de esta categoría**, junto con este ⓘ.

     📮 LA LETRA ES DE A: `DIRECCION_ARTE` §6b / Ley 9 tienen que recibir
     la regla firmada. Acá vive el CÓDIGO y su porqué; la ley canónica no
     es territorio de esta pista. */
  info: ({ tinta }) => (
    <>
      <Circle cx={12} cy={12} r={8.6} {...trazo(tinta)} />
      <Path d="M12 11v5M12 7.7v.3" {...trazo(tinta)} />
    </>
  ),

  /* ══ LOS CUATRO NODOS DEL SEGUIMIENTO (S99-B) ══════════════════════
   *
   * 🔴 **VAN EN MASA Y NO EN TRAZO, y no es un gusto: es el tamaño.**
   * El nodo mide 20 y sostiene un glifo de **12** ⇒ el `viewBox` de 24
   * se escala a la mitad y **`TRAZO` 1.9 llega como 0.95 efectivo**.
   * A esa fineza un contorno no dibuja: susurra. *Es el mismo argumento
   * de §6ter con otra causa — allá el trazo moría por el FONDO, acá
   * muere por el TAMAÑO— y por eso la conclusión coincide: sobrevive la
   * silueta rellena.*
   *
   * **Precedente en la casa, no invención:** `ia` ya es masa pura (tres
   * chispas rellenas, sin un solo trazo). No nace una física nueva; se
   * usa la que ya existía.
   *
   * ── LA REGLA DE DIBUJO QUE LOS ORDENA ─────────────────────────────
   * **A 12 px no sobrevive el detalle interior: sobrevive la
   * ORIENTACIÓN.** Por eso los cuatro se separan por eje antes que por
   * contenido — **vertical · cuadrado · horizontal · diagonal**— que es
   * lo primero que el ojo resuelve cuando la figura es chica:
   *
   *   confirmado  la bolsa    ▮ vertical
   *   preparando  la caja     ■ cuadrada
   *   en camino   la flecha   ▶ horizontal
   *   entregado   el visto    ✓ diagonal
   *
   * ⚠️ **EL VISTO SE RESERVA PARA `entregado`, y es decisión.** Era el
   * candidato obvio para «confirmado» —el riesgo que la receta ya había
   * declarado— y se le niega: **`entregado` es el único de los cuatro
   * que COMPLETA algo**, y un visto en el primer nodo diría que el
   * camino terminó cuando recién empieza.
   *
   * ⚠️ **Y `en_camino` NO PUEDE SER UNA MOTO** (§6ter): la moto es marca
   * de MAPA, otra clase, y repetirla acá haría que el mismo objeto
   * significara dos cosas en la misma pantalla — el mapa la usa para
   * decir DÓNDE, y acá diría EN QUÉ ETAPA.
   *
   * **GATE POR ÍCONO PENDIENTE (§2.9), y se juzgan DONDE VIVEN:** la
   * galería los monta **adentro de una `EscaleraEstados` real, a 12 px**,
   * jamás sueltos en grande. *Es lo que la moto costó dos veces en esta
   * misma sesión.* Y por L-255: si el founder firma una silueta, lo que
   * cambia después es el TRATAMIENTO, jamás la silueta. */

  // LA BOLSA — el pedido existe. Cuerpo en masa; el asa es el ÚNICO
  // trazo del set y va más gruesa que `TRAZO` a propósito: a 12 px con
  // 1.9 el asa desaparecía y la bolsa se leía como un balde.
  nodoConfirmado: ({ tinta }) => (
    <>
      <Path
        d="M6.2 8.6h11.6a1.6 1.6 0 0 1 1.59 1.75l-.86 9.2A2.1 2.1 0 0 1 16.44 21.4H7.56a2.1 2.1 0 0 1-2.09-1.85l-.86-9.2A1.6 1.6 0 0 1 6.2 8.6Z"
        fill={tinta}
      />
      <Path
        d="M8.9 8.6V7.2a3.1 3.1 0 0 1 6.2 0v1.4"
        stroke={tinta}
        strokeWidth={2.4}
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),

  // LA CAJA ABIERTA — se está armando. La V de las solapas es lo que la
  // separa de la bolsa a 12 px: sin ellas las dos siluetas convergen.
  nodoPreparando: ({ tinta }) => (
    <>
      <Path
        d="M5.1 11.2h13.8v7.9a2.1 2.1 0 0 1-2.1 2.1H7.2a2.1 2.1 0 0 1-2.1-2.1Z"
        fill={tinta}
      />
      <Path d="M5.1 11.2 9.5 5.9 12 11.2Z" fill={tinta} />
      <Path d="M18.9 11.2 14.5 5.9 12 11.2Z" fill={tinta} />
    </>
  ),

  // LA FLECHA — el movimiento. Cola rectangular ancha para que a 12 px
  // la punta no se coma el cuerpo y quede leyéndose como un triángulo.
  nodoEnCamino: ({ tinta }) => (
    <Path
      d="M13.1 5.2 20.4 12l-7.3 6.8v-4.2H3.6V9.4h9.5Z"
      fill={tinta}
    />
  ),

  // EL VISTO — lo único que se completa. Polígono grueso: un check de
  // trazo a 12 px es exactamente el caso que esta nota vino a evitar.
  nodoEntregado: ({ tinta }) => (
    <Path
      d="M9.7 18.6 3.9 12.8l2.5-2.5 3.3 3.3 7.9-7.9 2.5 2.5Z"
      fill={tinta}
    />
  ),
  ayuda: ({ tinta, huella }) => (
    <>
      <Circle cx={12} cy={12} r={8.4} {...trazo(tinta)} />
      <Path d="M12 3.6v3M12 17.4v3M3.6 12h3M17.4 12h3" {...trazo(tinta)} />
      <Huella color={huella} x={9.3} y={9.5} escala={0.3} />
    </>
  ),
  /* LA GOTA — el pin de la casa. ⏪ Decía *«la huella vive en la gota»*.
     **S100d-B: LA HUELLA SALE** (punto 17 del gate, pedido por la pista A con
     su superficie exacta: la fila de dirección de la ficha de entrega).

     🔴 **LA RAZÓN ES MEDIBLE Y SOBREVIVE A QUE ALGUIEN CAMBIE DE OPINIÓN:**
     la gota es una forma **cerrada y angosta** — su interior útil son ~9
     unidades de la grilla 24 ⇒ **~7,5 px en el gate de 21** (§2.9). **Ley 9
     es literal: a 21 px la huella SOBREVIVE O ES RUIDO.** Acá era ruido.
     *«Lo pidió el founder» no habría sobrevivido a que cambiara de opinión;
     esto sí.*

     ⚡ **Y EL PEOR CASO VIVO NO ES EL GATE DE 21 — es más chico.** La pista
     D midió su consumidor nuevo: el último nodo de la escalera de estados
     dibuja este glifo a **12 px** (`TAMANO_EN_NODO`, dentro de un nodo de
     20). **A 12, el interior queda en ~4,3 px: ahí la huella no es ruido,
     es un borrón.** *El número llegó de afuera y hace más fuerte el
     argumento, no más débil — por eso entra acá y no en una bitácora.*

     ⚠️ **EL ALCANCE, CENSADO CONTRA `origin/main` Y NO CONTRA MI ÁRBOL**
     (L-305 / la enmienda de §D: un grep en el worktree propio mide la rama,
     no el producto): **8 consumidores** — `despensa/checkout.tsx:719` y
     `:1147` (los dos de A, y los dos lo quieren) + **seis del prestador**
     (`como-te-ven:283` · `cuenta/perfil:1339` · `grooming/index:308` ·
     `grooming/taller:789` · `paseo/index:289` · `seccion-sede:218`).
     **Los seis del prestador cambian de aspecto sin que nadie de esa app lo
     haya pedido, y se declara acá en vez de descubrirse en su próximo gate.**

     ── F-PIN · DÓNDE VA ESTA GOTA Y DÓNDE NO (firma del founder, 18-ago) ──
     *«El pin es una GOTA tipo Uber, no un punto»*, pedido tres veces.
     **El reparto, y lo decide `DIRECCION_ARTE` §6ter, no el gusto:**
       · una ubicación **se MUESTRA como dato** (celda, label, escalera,
         seguir el pedido) ⇒ **esta gota**.
       · el momento de **AJUSTAR** el punto (`PinMovible`) ⇒ **gota**, que
         ahí es una capa de INTERFAZ dibujada sobre el mapa.
       · el **mundo** del mapa (el destino, la moto) ⇒ **OBJETO**
         (`ObjetoDestino`, `ObjetoMoto`): *el mapa no es interfaz, es MUNDO.*
     *Meter la gota adentro del lienzo pondría dos idiomas peleando en la
     misma superficie.* */
  ubicacion: ({ tinta }) => (
    <Path d="M12 21s-7-5.3-7-11a7 7 0 1 1 14 0c0 5.7-7 11-7 11Z" {...trazo(tinta)} />
  ),
  // El silbato del adiestrador — MATA la estrella (violaba el set).
  training: ({ tinta, huella }) => (
    <>
      <Circle cx={9} cy={14.2} r={4.6} {...trazo(tinta)} />
      <Path d="M9.6 9.6h9.2a1.2 1.2 0 0 1 1.2 1.2v2l-5.6 1.6" {...trazo(tinta)} />
      <Huella color={huella} x={6.5} y={11.6} escala={0.32} />
    </>
  ),
  // La cama del hospedaje — la mascota apoyada arriba.
  hotel: ({ tinta, huella }) => (
    <>
      <Path d="M3.6 6.4v12.2M3.6 13.6h16.8v5M3.6 16.4h16.8" {...trazo(tinta)} />
      <Huella color={huella} x={12.8} y={5.8} escala={0.4} />
    </>
  ),
  // La casita de guardería — la huella espera en el techo.
  guarderia: ({ tinta, huella }) => (
    <>
      <Path d="M4.6 19.4v-7.6L12 5.2l7.4 6.6v7.6Z" {...trazo(tinta)} />
      <Path d="M9.6 19.4v-3.8a2.4 2.4 0 0 1 4.8 0v3.8" {...trazo(tinta)} />
      <Huella color={huella} x={9.5} y={7.4} escala={0.3} />
    </>
  ),
  // ☠️☠️ EL EMBLEMA DE COHORTE MURIÓ COMO GLIFO (gate founder, 3-ago).
  //    Su veredicto, literal: «**no me gusta ninguno, puede que tengamos
  //    que no usar glifo para esto, ya que es especial**».
  //
  //    LO QUE MATÓ NO FUE EL DIBUJO, FUE EL IDIOMA — y por eso la lápida
  //    va acá y no en un changelog: CINCO señales apuntaron al mismo
  //    lado antes de que alguien lo dijera. Tres candidatos murieron en
  //    el censo sin llegar a existir (la medalla, por el círculo ya
  //    ocupado tres veces · el laurel, por colisionar con `equipo` · el
  //    podio, por LOYALTY §3) y los DOS que sobrevivieron al censo
  //    rebotaron en dispositivo. Cuando un idioma mata cinco intentos
  //    seguidos, el que está mal es el idioma.
  //
  //    EL DIAGNÓSTICO, que es lo reutilizable: **un glifo de línea a
  //    21px no puede portar PERTENENCIA.** Un glifo dice de qué ES algo
  //    —es la etiqueta de un dominio— y la cohorte dice QUIÉN ES
  //    alguien. Son dos trabajos y no comparten pieza, igual que el
  //    glow y la atmósfera no comparten nombre.
  //
  //    A DÓNDE SE FUE: a `Insignia`, familia `distincion` (S85-B16) —
  //    pastilla con su fondo y la palabra entera, sobre la referencia
  //    que el propio founder dio: la pastilla «Al día» del cliente. El
  //    dibujo de los dos candidatos vive en `03ee595` si alguna vez hace
  //    falta un glifo de esta familia; su riesgo medido también.


  // ── LA FAMILIA DE LA VENTANA TEMPORAL · semana · mes (S85-B18) ──────
  //
  // EL PEDIDO venía desde S82-C: la hilera «todos · semana · mes» de los
  // hubs es la única del producto SIN glifo, y su propio código declaraba
  // el hueco («EL SET NO EXISTE… si un set necesita el MISMO glifo
  // repetido por fila, lo que falta es un set POR TIPO»). Nace ahora
  // porque con la promoción de `FiltroPills` el pedido dejó de cruzar
  // frontera: registry y pieza viven en la misma casa.
  //
  // EL CENSO ENCONTRÓ QUE LA CASA YA HABÍA RESUELTO LA MITAD, y por eso
  // nacen DOS y no cuatro (L-175: se lee el registry y se ENSANCHA):
  //  · `hoy` YA ES el calendario con el día marcado — la agenda de S85-B12.
  //    La familia ya tenía su primer miembro y él define el idioma.
  //  · `todos` YA SE RESUELVE con la Huella: la hilera hermana del Hogar
  //    (`hogar/index:1662`) monta `icono: 'huella'` para su chip «todo».
  //    No es una ventana temporal: es la AUSENCIA de ventana, y la casa
  //    ya eligió cómo se dice. Copiar esa decisión habría sido inventarla
  //    de nuevo.
  //
  // EL EJE DE LA FAMILIA, que es lo que la Ley 12 pide: los tres comparten
  // el CUERPO (calendario con sus dos anillas) y varía LO MARCADO ADENTRO
  // — el día · la semana · el mes. El glifo marca lo que VARÍA dentro de
  // la unidad de barrido, y acá lo que varía es el TRAMO. Compartir el
  // cuerpo no es colisión: es lo que los hace leerse como familia.
  //
  // ⚠️ EL RIESGO, declarado y es EL del gate a 21px: `semana` (una barra)
  // y `mes` (tres) se separan CONTANDO, y contar a 21px es exactamente lo
  // que puede fallar. Si a ese tamaño no se distinguen, la salida no es
  // engordar las barras: es que `mes` cambie de marca (una grilla de
  // puntos en vez de filas). Se monta la fila de 21px con `hoy` al lado
  // para que la comparación sea entre los TRES, no de a uno.
  // ⚠️ SEGUNDO RIESGO: sin las anillas, tres barras horizontales dentro de
  // un rectángulo son el idioma de `presupuesto`/`bitacora` — ocupado.
  // Las anillas son lo único que los mantiene calendario, igual que en
  // `hoy`. Nadie las saca "para simplificar".
  semana: ({ tinta, huella }) => (
    <>
      <Path d="M6 6.4h12a1.6 1.6 0 0 1 1.6 1.6v11.4a1.6 1.6 0 0 1-1.6 1.6H6a1.6 1.6 0 0 1-1.6-1.6V8A1.6 1.6 0 0 1 6 6.4Z" {...trazo(tinta)} />
      <Path d="M4.4 10.8h15.2" {...trazo(tinta)} />
      <Path d="M8.6 3.4v4M15.4 3.4v4" {...trazo(tinta)} />
      <Path d="M7.4 14.6h9.2" {...trazo(tinta)} />
      <Huella color={huella} x={1.8} y={16.4} escala={0.28} />
    </>
  ),

  // ── LA CAMPANA (S88, lámina firmada) ──────────────────────────────
  // Geometría: la campana S43 del Encabezado — probada a 21px en su
  // gate original — re-portada al trazo 1.9 del registry (la referencia
  // venía en 1.75; acá manda TRAZO). Domo + badajo, remates redondeados.
  // EL `huella` QUEDA SIN USAR A PROPÓSITO y no es un olvido: el par
  // campana+novedad reparte la ley del único relleno — el objeto va en
  // TRAZO y la huella RELLENA aparece en el Badge SOLO cuando hay
  // avisos sin leer (regla de existencia). Una huella fija adentro
  // diría «siempre hay novedad», que es mentir con geometría.
  campana: ({ tinta }) => (
    <>
      <Path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" {...trazo(tinta)} />
      <Path d="M13.7 20.6a2 2 0 0 1-3.4 0" {...trazo(tinta)} />
    </>
  ),

  mes: ({ tinta, huella }) => (
    <>
      <Path d="M6 6.4h12a1.6 1.6 0 0 1 1.6 1.6v11.4a1.6 1.6 0 0 1-1.6 1.6H6a1.6 1.6 0 0 1-1.6-1.6V8A1.6 1.6 0 0 1 6 6.4Z" {...trazo(tinta)} />
      <Path d="M4.4 10.8h15.2" {...trazo(tinta)} />
      <Path d="M8.6 3.4v4M15.4 3.4v4" {...trazo(tinta)} />
      <Path d="M7.4 13.2h9.2M7.4 15.8h9.2M7.4 18.4h9.2" {...trazo(tinta)} />
      <Huella color={huella} x={1.8} y={16.4} escala={0.28} />
    </>
  ),

  // El escudo — la vida protegida (verde vital, como insurance).
  //
  // ⚖️ COLISIÓN DECLARADA Y ACEPTADA (firma de mesa, S85): ESTE MISMO
  // DIBUJO tiene DOS usos en DOS apps — el SERVICIO DE SEGUROS en el
  // cliente y la SEGURIDAD DE LA CUENTA en el prestador. Se declara acá,
  // en el registry, porque es el único lugar donde alguien que vaya a
  // dibujar el próximo glifo lo va a leer.
  //
  // POR QUÉ NO ROMPE LA LEY 12, que es lo que hay que poder contestar: la
  // Ley 12 pide que el glifo separe cosas que significan distinto DENTRO
  // DE UNA MISMA UNIDAD DE BARRIDO — una fila, un menú, una hilera. Estos
  // dos usos NO comparten pantalla ni app: nadie ve nunca los dos juntos,
  // así que no hay nada que el ojo tenga que separar. La colisión es de
  // NOMBRE en el registry, no de lectura en el producto.
  //
  // ⚠️ LO QUE ESTO NO AUTORIZA, y por eso se escribe: no habilita reusar
  // un glifo por parecido temático dentro de una misma app. Si algún día
  // el cliente monta "Seguridad de la cuenta" —o el prestador vende
  // seguros—, los dos usos caen en la misma casa, y ahí SÍ hace falta un
  // segundo dibujo: el escudo se queda con el que llegó primero y el otro
  // pasa por §6b (hoja de contacto, 2-3 variantes, gate POR ÍCONO a 21px).
  // Ese día esta nota es la que dice cuál es cuál.
  seguros: ({ tinta, huella }) => (
    <>
      <Path d="M12 3.4 19 6v5.4c0 4.5-2.9 8-7 9.6-4.1-1.6-7-5.1-7-9.6V6Z" {...trazo(tinta)} />
      <Huella color={huella} x={8.8} y={7.2} escala={0.4} />
    </>
  ),
  // La pantalla que atiende — salud a distancia, la huella presente.
  telemedicina: ({ tinta, huella }) => (
    <>
      <Path d="M8 3.6h8a1.4 1.4 0 0 1 1.4 1.4v14A1.4 1.4 0 0 1 16 20.4H8A1.4 1.4 0 0 1 6.6 19V5A1.4 1.4 0 0 1 8 3.6Z" {...trazo(tinta)} />
      <Path d="M12 6.8v3.4M10.3 8.5h3.4" {...trazo(tinta)} />
      <Huella color={huella} x={9.5} y={12.8} escala={0.32} />
    </>
  ),
  // El calendario con la pausa serena — vacaciones jamás dicen error.
  vacaciones: ({ tinta, huella }) => (
    <>
      <Path d="M4.6 6.6h14.8v12.8H4.6ZM4.6 10.4h14.8M8.4 4.4v3M15.6 4.4v3" {...trazo(tinta)} />
      <Path d="M7.6 17.2l3.2-4" {...trazo(tinta)} />
      <Huella color={huella} x={12.6} y={12.2} escala={0.32} />
    </>
  ),
  // PRIME candidato A: la chapita con huella en MAGENTA PURO — la
  // membresía es de la marca (única huella magenta fuera de tabs,
  // declarada al gate).
  prime: ({ tinta, huella }) => (
    <>
      <Circle cx={12} cy={5.6} r={1.9} {...trazo(tinta)} />
      <Circle cx={12} cy={13.6} r={6.6} {...trazo(tinta)} />
      <Huella color={huella} x={8.9} y={10.6} escala={0.38} />
    </>
  ),
  // PRIME candidato B: la corona en trazo con la huella adentro.
  primeCorona: ({ tinta, huella }) => (
    <>
      <Path d="M4.6 17.6h14.8M4.6 17.6 3.8 8.4l4.7 3.2L12 5.8l3.5 5.8 4.7-3.2-.8 9.2" {...trazo(tinta)} />
      <Huella color={huella} x={9.2} y={10.8} escala={0.3} />
    </>
  ),
  // Dos correas que se cruzan — el equipo del oficio.
  equipo: ({ tinta, huella }) => (
    <>
      <Path d="M6.2 4.4c3.6 1.5 4.2 5.4 1.2 8.8M17.8 4.4c-3.6 1.5-4.2 5.4-1.2 8.8" {...trazo(tinta)} />
      <Huella color={huella} x={8.8} y={14.4} escala={0.4} />
    </>
  ),

  // ══ LOTE S71-B2 — firma founder sobre hoja de contacto (variante A
  //    en ambos; el criterio nuevo del gate: a 21px la huella SOBREVIVE
  //    o es ruido) ══
  // La carpeta del caso — la unidad que AGRUPA consultas de una misma
  // condición (S70); la huella es EL PACIENTE, vive adentro.
  caso: ({ tinta, huella }) => (
    <>
      <Path
        d="M3.6 18.3V6.2a1.5 1.5 0 0 1 1.5-1.5h3.7l1.9 2.2h7.7a1.5 1.5 0 0 1 1.5 1.5v9.9a1.5 1.5 0 0 1-1.5 1.5H5.1a1.5 1.5 0 0 1-1.5-1.5Z"
        {...trazo(tinta)}
      />
      <Huella color={huella} x={8.9} y={10.2} escala={0.38} />
    </>
  ),
  // El documento con desglose — cotización, JAMÁS cobro (cero $, cero
  // billete: la colisión con pagos quedó vetada en la hoja). Dos ítems
  // desiguales: el desglose ES el presupuesto. La huella dice para
  // quién se cotiza.
  presupuesto: ({ tinta, huella }) => (
    <>
      <Path
        d="M6.2 3.6h7.6l4.6 4.6V19a1.5 1.5 0 0 1-1.5 1.5H6.2A1.5 1.5 0 0 1 4.7 19V5.1a1.5 1.5 0 0 1 1.5-1.5Z"
        {...trazo(tinta)}
      />
      <Path d="M13.8 3.6v4.6h4.6" {...trazo(tinta)} />
      <Path d="M8 12.2h5M8 15.2h3.4" {...trazo(tinta)} />
      <Huella color={huella} x={12.4} y={13.6} escala={0.32} />
    </>
  ),

  // LA JERINGA (S82-B r10) — objeto del acto, con su huella: la vacuna
  // ES del expediente de una mascota (capa IDENTIDAD, familia de
  // carnet/vet: protección de vida). Trazo 1.9 como todo el set.
  // Anatomía pensada PARA 21px (la lección del set: a ese tamaño
  // sobrevive lo simple): cuerpo vertical + aletas + vástago con su
  // tope + aguja; CERO graduaciones (a 21 son ruido — Chanel aplicada
  // antes del gate, no después). Desplazada a la derecha del centro
  // para que la huella respire abajo-izquierda, como en `carnet`.
  vacuna: ({ tinta, huella }) => (
    <>
      <Path d="M10.6 8.6h4.8v8.6h-4.8z" {...trazo(tinta)} />
      <Path d="M9 8.6h8" {...trazo(tinta)} />
      <Path d="M13 8.6V4.8" {...trazo(tinta)} />
      <Path d="M10.8 4.8h4.4" {...trazo(tinta)} />
      <Path d="M13 17.2v3.4" {...trazo(tinta)} />
      <Huella color={huella} x={2.4} y={14.8} escala={0.32} />
    </>
  ),

  // LA BITÁCORA (S82-B r34) — el cuaderno del progreso, con su huella:
  // la bitácora ES de una mascota (capa IDENTIDAD, familia carnet/caso).
  // Anatomía PARA 21px: cuerpo + lomo + DOS renglones (tres ya son ruido
  // a ese tamaño — Chanel antes del gate, como en la jeringa).
  bitacora: ({ tinta, huella }) => (
    <>
      <Path d="M9 4h9a1.5 1.5 0 0 1 1.5 1.5v13a1.5 1.5 0 0 1-1.5 1.5H9z" {...trazo(tinta)} />
      <Path d="M11.4 4v16" {...trazo(tinta)} />
      <Path d="M13.6 9h3.2M13.6 12.4h3.2" {...trazo(tinta)} />
      <Huella color={huella} x={2} y={13.4} escala={0.3} />
    </>
  ),

  // ── LA RECETA — LA CÁPSULA (S90-B) ─────────────────────────────────
  // EL CENSO PRIMERO (§6b paso 2), porque es lo que decide el dibujo: el
  // idioma «rectángulo» está ocupado SIETE veces en este registry —
  // `presupuesto` (hoja con doblez) · `bitacora` (cuaderno con lomo) ·
  // `caso` (carpeta con pestaña) · `pagos` (billete) · `documento`
  // (retrato) · `fiscal` (dentado) · `hoy` (calendario con anillas). Una
  // OCTAVA hoja rectangular no se distingue de ninguna a 21px, que es
  // exactamente lo que la Ley 9 afilada mata.
  //
  // POR QUÉ LA CÁPSULA Y NO EL PAPEL, dicho con su conflicto a la vista:
  // el JSDoc del catálogo de papeles (`apps/cliente/src/lib/papeles.ts`)
  // pide «el glifo del OBJETO (el papel), jamás el del acto» — y esta
  // decisión NO lo cumple al pie. Se toma igual por tres razones medidas:
  //   ① El propio catálogo ya tiene una entrada que tampoco lo cumple:
  //      `carnet_vacunas → 'carnet'`, y `carnet` NO es un papel — es la
  //      PLACA (etiqueta con su anilla). La regla describe a `documento`,
  //      no al catálogo entero.
  //   ② El objeto exacto de una receta es la hoja del recetario, y esa
  //      puerta está cerrada por saturación (arriba). Entre un octavo
  //      rectángulo ilegible y un objeto legible, la Ley 9 decide.
  //   ③ Lo que la receta ORDENA es la medicación, y ahí el objeto es
  //      exacto y único en el set: nada más es una cápsula. `vacuna` es
  //      la jeringa —otra silueta, otro eje— así que no hay colisión.
  // ⚠️ EL RIESGO, declarado y no disimulado (§6b paso 3): puede leerse
  // «medicación» antes que «receta». Vive mitigado por su vecindad (una
  // LISTA de papeles rotulados por voz), pero es el riesgo real y es lo
  // que el gate del founder tenía que mirar.
  //
  // ✅ FIRMADO (mesa, 7-ago-2026): «el glifo receta firmado — la cápsula
  // construida en S90-B rige; el préstamo receta→'caso' se retira». El
  // riesgo de arriba se conserva ESCRITO a propósito: la firma dice que
  // se acepta, no que no existía. Si algún día la lista de papeles deja
  // de rotularse por voz, la mitigación se cae y esto vuelve a la mesa.
  //
  // ANATOMÍA PARA 21px: DOS trazos (densidad 2 — el piso del rango 2-4,
  // igual que la jeringa después de su Chanel). Cápsula a 45° + la línea
  // de unión de las dos mitades, que es lo que la hace cápsula y no un
  // rombo. Cero graduaciones, cero píldoras satélite: a 21px son ruido.
  // Grilla 24 · trazo 1.9 · aire 3.4 arriba (el más ajustado, medido).
  // La huella baja-izquierda con el mismo gesto que `vacuna`/`bitacora`.
  // ── S91-B · CANDIDATO A — EL APILADO. **El plural ES el dibujo**: dos
  // hojas desplazadas. Es lo único que separa «los documentos» de «un
  // documento» sin inventar un objeto que no existe.
  // ⚠️ SU PRIMERA VERSIÓN FALLÓ SU PROPIO GATE, y queda escrito porque la
  // medición es el aporte: con DOS rectángulos COMPLETOS desplazados 3, a
  // 21px se leía **un cuadrado dentro de otro** —concéntrico—, no un
  // apilado. Era el riesgo que se había declarado y resultó real.
  // LA CURA: la hoja de atrás deja de ser un rectángulo y pasa a ser lo
  // ÚNICO que se vería de ella — su esquina superior derecha (una L). Con
  // eso el ojo lee dos planos en vez de dos marcos. Rasterizado a 21px y
  // mirado antes de dejarlo, no supuesto.
  // Densidad 2 + huella; grilla 24 · trazo 1.9 · aire 3.5 arriba.
  documentos: ({ tinta, huella }) => (
    <>
      <Path d="M11 3.5H21.5V14" {...trazo(tinta)} />
      <Path d="M7.5 7H18V17.5H7.5Z" {...trazo(tinta)} />
      <Huella color={huella} x={1.8} y={14.8} escala={0.3} />
    </>
  ),
  // ── S91-B · EL SOBRE — hoy `correo`, EN RESERVA DECLARADA (sin
  // consumidores). Silueta LIBRE en todo el registry (rectángulo + V) y
  // la más legible del par: la V es un gesto grande, no un detalle.
  // ⚠️ LO QUE ERA SU RIESGO ES HOY SU RAZÓN DE SER. En el gate se declaró
  // que a 21px «se lee nítido y se lee CORREO» —confirmado rasterizando,
  // no supuesto— y eso lo descalificaba para Documentos. La firma del
  // founder lo dio vuelta: se retira SIN cablear y queda para el centro de
  // avisos. **El dibujo no cambió ni un punto; cambió qué nombra.**
  correo: ({ tinta, huella }) => (
    <>
      <Path d="M6.5 5.5H21V16H6.5Z" {...trazo(tinta)} />
      <Path d="M6.5 5.5 13.75 11.5 21 5.5" {...trazo(tinta)} />
      <Huella color={huella} x={1.8} y={14.8} escala={0.3} />
    </>
  ),
  receta: ({ tinta, huella }) => (
    <>
      <Path
        d="M8.15 10.85A2.9 2.9 0 0 0 12.25 14.95L18.85 8.35A2.9 2.9 0 0 0 14.75 4.25Z"
        {...trazo(tinta)}
      />
      <Path d="M11.45 7.55 15.55 11.65" {...trazo(tinta)} />
      <Huella color={huella} x={1.8} y={14.8} escala={0.3} />
    </>
  ),

  // ── FISCAL — LA FACTURA CON BORDE DENTADO (S84-B21) ────────────────
  // El objeto fiscal de la región no es "un papel": es LA FACTURA — el
  // RUC y el NIT existen para emitirla. Y el BORDE DENTADO es todo el
  // trabajo, igual que el retrato en `documento`: el idioma "rectángulo
  // con renglones" ya está ocupado CINCO veces en este registry
  // (`presupuesto`, `bitacora`, `caso`, `pagos` —que es un billete— y
  // el propio `documento`). Sin el dentado sería la sexta y a 21px no se
  // distinguiría de ninguna. Es el mismo descarte que hice en B4 con la
  // tarjeta de contacto y en B20 con la cédula lisa.
  fiscal: ({ tinta, huella }) => (
    <>
      <Path
        d="M6.2 3.4h11.6v15.9l-1.9-1.4-1.9 1.4-1.9-1.4-1.9 1.4-1.9-1.4-1.9 1.4V3.4Z"
        {...trazo(tinta)}
      />
      <Path d="M9.2 7.6h5.6M9.2 11.2h5.6" {...trazo(tinta)} />
      <Huella color={huella} x={3.1} y={13.4} escala={0.26} />
    </>
  ),

  // ── BANCARIO — EL EDIFICIO CON COLUMNAS (S84-B21) ──────────────────
  // La otra salida obvia era una TARJETA, y se cae por lo mismo que todo
  // lo demás: una tarjeta es un rectángulo ancho y **`pagos` ya ES un
  // rectángulo ancho con marcas** — a 21px serían el mismo dibujo, y
  // encima vecinos temáticos, que es la peor colisión posible (Ley 12
  // existe para que el ojo SEPARE cosas que significan distinto).
  // El edificio con frontón y columnas no tiene un solo pariente en el
  // registry: cero rectángulos horizontales, cero círculos grandes.
  bancario: ({ tinta, huella }) => (
    <>
      <Path d="M3.6 9.2 12 4.4l8.4 4.8" {...trazo(tinta)} />
      <Path d="M5.8 9.2v7.4M10 9.2v7.4M14 9.2v7.4M18.2 9.2v7.4" {...trazo(tinta)} />
      <Path d="M3.6 19.6h16.8" {...trazo(tinta)} />
      <Huella color={huella} x={9.4} y={11.2} escala={0.24} />
    </>
  ),

  // ── DOCUMENTO · CANDIDATO A — LA CÉDULA CON RETRATO (S84-B20) ──────
  // Rectángulo con un RETRATO (el círculo chico) y dos renglones. El
  // retrato es todo el trabajo: es lo que separa una IDENTIFICACIÓN de un
  // documento cualquiera, y es lo que la distingue del idioma
  // "rectángulo con renglones" que este registry YA tiene ocupado TRES
  // VECES (`presupuesto` con su esquina doblada, `bitacora` con su lomo
  // y, de cerca, `caso`). Sin el retrato sería la cuarta y a 21px no se
  // distinguiría de ninguna — el mismo descarte que mató a la tarjeta de
  // contacto en B4.
  //
  // ⚠️ LA HUELLA NO ES EL RETRATO, Y ES DELIBERADO: ponerla ahí diría
  // exactamente lo que la orden señala como defecto de `carnet` — que el
  // documento es del animal. Va CHICA Y AL COSTADO, como en `bitacora`:
  // presencia del set, no sujeto del documento.
  documento: ({ tinta, huella }) => (
    <>
      <Path
        d="M4.4 5.6h15.2a1.5 1.5 0 0 1 1.5 1.5v9.8a1.5 1.5 0 0 1-1.5 1.5H4.4a1.5 1.5 0 0 1-1.5-1.5V7.1a1.5 1.5 0 0 1 1.5-1.5Z"
        {...trazo(tinta)}
      />
      <Circle cx={8.6} cy={10.6} r={2.1} {...trazo(tinta)} />
      <Path d="M13.4 9.9h4.4M13.4 13.1h4.4" {...trazo(tinta)} />
      <Huella color={huella} x={4.6} y={12.6} escala={0.26} />
    </>
  ),

  // ☠️ DOCUMENTO · CANDIDATO B — EL SELLO (S84-B20) MURIÓ EN SU GATE
  //    (S85, 3-ago). Era un sello sobre una hoja: nombraba la VALIDACIÓN
  //    en vez de la identidad, con el argumento de que estos documentos
  //    EXISTEN PARA SER VERIFICADOS (el veredicto de admin de §14.2).
  //    Ganó A —la cédula con RETRATO—, que es lo que separa una
  //    identificación de un papel cualquiera.
  //
  //    LA FIRMA QUE LO RETIRA, y por qué recién ahora: el gate de 21px
  //    corrió en la mesa del 3-ago y el founder dijo, literal, «los
  //    glifos: no les vi ningún problema». Hasta ese día el sello estaba
  //    vivo A PROPÓSITO —C lo dejó sin consumidor para que el founder
  //    pudiera comparar los dos candidatos CON EL DEDO en esa fila—, así
  //    que retirarlo antes habría sido romper el instrumento del gate,
  //    no limpiar una opción muerta. Corrido el gate, el instrumento
  //    sobra y el perdedor no sobrevive: un candidato perdedor vivo es
  //    una opción que alguien va a creer disponible.
  //
  //    SU RIESGO, que queda registrado porque sigue siendo vara para el
  //    próximo glifo: a 21px un sello circular con muescas compite con
  //    el círculo de `ayuda` y el de `preferencias` — el mismo riesgo
  //    que hundió al candidato B de `contacto`. Si algún día hace falta
  //    un glifo de VALIDACIÓN, su dibujo vive en `36fd242` y este
  //    párrafo dice contra qué tiene que defenderse.

  // ── CONTACTO · CANDIDATO A — EL GLOBO (S84-B4) ─────────────────────
  // Nombra EL ACTO de contactar, no el canal: en un globo caben una
  // llamada, un WhatsApp, un correo y un mensaje del sitio, y ninguno
  // de los cuatro queda afuera. La huella va ADENTRO — quien escribe
  // es la familia, y escribe por su mascota (regla madre §1).
  // POR QUÉ NO ES UNA TARJETA DE DATOS, que era el candidato obvio: el
  // idioma "rectángulo con líneas cortas adentro" YA ESTÁ OCUPADO TRES
  // VECES en este mismo registry (`presupuesto`, `bitacora` y, de
  // cerca, `caso`). A 21px una cuarta sería indistinguible, y un glifo
  // que se confunde con otro derrota exactamente a la Ley 12 que este
  // glifo existe para cumplir.
  contacto: ({ tinta, huella }) => (
    <>
      <Path
        d="M6.5 4.5h11A2.5 2.5 0 0 1 20 7v6a2.5 2.5 0 0 1-2.5 2.5h-6l-3.6 3v-3H6.5A2.5 2.5 0 0 1 4 13V7a2.5 2.5 0 0 1 2.5-2.5Z"
        {...trazo(tinta)}
      />
      <Huella color={huella} x={7.7} y={5.7} escala={0.36} />
    </>
  ),

  // ☠️ CONTACTO · CANDIDATO B (EL ALCANCE) MURIÓ EN SU GATE (S84-B5).
  // Tres arcos saliendo de un punto, con la huella de origen. La razón
  // de la firma es de LEY y por eso queda escrita: §1 manda dibujar el
  // OBJETO del oficio — el globo es un objeto, "el alcance" es una
  // idea. Su código se va (Ley 37: lo que muere, muere con su
  // maquinaria) y su porqué se queda, para que nadie lo re-proponga
  // creyendo que nunca se miró.

  // ── GLIFOS DE CONTROL (S82-B r7) ───────────────────────────────────
  // SIN HUELLA, y el criterio VIAJÓ CON LA REFERENCIA (no lo inventa
  // esta sesión — literal del archivo del founder): *"Trazo 1.9, sin
  // huella: no son objetos del oficio, son controles."* Un lápiz no
  // tiene capa y una huella adentro de un lápiz no diría nada (Chanel).
  // CHOQUE DECLARADO, no resuelto en silencio: Ley 12 pide "objeto del
  // oficio + UNA huella rellena" — su letra habla de los glifos de
  // OFICIO; la categoría de control es §6bis de DIRECCION_ARTE,
  // PENDIENTE DESDE S78 (el glifo del micrófono la pidió primero). Estos
  // dos NO la fundan: esperan el gate por ícono y recién ahí se escribe
  // (regla 80). El `huella` del pincel queda sin usar a propósito.
  // Convergencia medida: el `stroke-width: 1.9` de la referencia es
  // EXACTAMENTE el TRAZO de este registry — cero traducción.
  //
  // El lápiz: cuerpo diagonal + la punta que toca la base. Se conserva
  // la geometría de la referencia y se le suma el CORTE de la punta
  // (la línea corta del bisel) — sin él, a 21px la punta se lee como un
  // triángulo mudo. El `carnet` (S58) usa un lápiz COMO OBJETO con su
  // huella: son distintos por rol, y por eso este no lo reusa.
  lapiz: ({ tinta }) => (
    <>
      <Path d="M15.5 4.5 19.5 8.5 8 20H4v-4z" {...trazo(tinta)} />
      <Path d="M13.6 6.4 17.6 10.4" {...trazo(tinta)} />
    </>
  ),
  /* EL FILTRO — EL EMBUDO, y la elección entre las dos formas «clásicas» no
     es de gusto: **dicen cosas distintas.**
       · **el embudo** = entra mucho, sale poco ⇒ *FILTRAR*.
       · **las tres barras con perillas** = mover valores ⇒ *AJUSTAR* (es el
         `tune` de Material, y en esta casa ese trabajo ya lo hacen
         `SliderPrecio` y `StepperCantidad`).
     El founder pidió *«el clásico de filtro»* y el clásico de FILTRAR es el
     embudo. *Montar el de ajustar diría «cambiá valores» donde la pantalla
     dice «mostrame menos».*

     **Sobrevive a 21 px por construcción:** es **una sola silueta cerrada y
     grande** —sin detalle interno que se empaste— y su rasgo (el ancho que
     se angosta hacia abajo) es geometría, no trazo fino. Ley 9.

     Sin huella: familia de CONTROL, como `lapiz` (ver el tipo).
     ⚠️ **GATE POR ÍCONO PENDIENTE (§2.9)** — y con el mismo límite declarado
     que sus vecinos de esta vuelta: **en este entorno no hay rasterizador de
     SVG**, así que no se pudo mirar chico sin publicar. */
  filtro: ({ tinta }) => (
    <Path d="M4.2 5.4h15.6l-6.1 7.2v5.1l-3.4 1.9v-7z" {...trazo(tinta)} />
  ),
  // Compartir: la flecha que SALE de la bandeja (convención de
  // plataforma iOS/Android — el trazo de la referencia, literal). La
  // bandeja abierta arriba dice "sale de acá", jamás un nodo-y-aristas
  // (ese grafo es de red social, no de un expediente que se comparte).
  compartir: ({ tinta }) => (
    <>
      <Path d="M12 15V4" {...trazo(tinta)} />
      <Path d="M8 7.6 12 3.6l4 4" {...trazo(tinta)} />
      <Path d="M5 14v5.5h14V14" {...trazo(tinta)} />
    </>
  ),
  // Descargar: EL HERMANO EXACTO DE `compartir`, con la flecha invertida
  // — la que CAE a la bandeja en vez de salir de ella. La paridad es
  // literal y deliberada: **la bandeja es el MISMO path, byte por byte**
  // (`M5 14v5.5h14V14`), y solo el asta y la punta se dan vuelta. Dos
  // acciones que son la ida y la vuelta del mismo objeto tienen que
  // leerse como pareja; si la bandeja divergiera, el par se rompería sin
  // que nada fallara (19.9: lo que se copia diverge — acá se copia A
  // PROPÓSITO y queda dicho, para que el día que una cambie, cambien las
  // dos).
  //
  // La métrica, contra su vecino: `compartir` lleva el asta de y15 a y4
  // con la punta en 3.6; acá el asta va de 3.6 a 13.4 con la punta en
  // 13.4 — **la punta se detiene ANTES del borde de la bandeja (y14)**,
  // no la penetra: la flecha *cae hacia* el papel guardado. Los brazos
  // conservan las 4 unidades del vecino, así que a 21px la punta pesa lo
  // mismo en los dos.
  //
  // Sin huella, como todo control (§6bis sigue pendiente): `huella`
  // queda sin usar a propósito.
  // Copiar: el espejo de `documentos` sin su huella (ver el tipo). La hoja
  // de adelante es un rectángulo cerrado; la de atrás asoma arriba-izquierda
  // y se dibuja SOLO con sus dos aristas visibles —el borde superior y el
  // izquierdo—, igual que el apilado dibuja las suyas: una hoja tapada no
  // muestra el contorno que queda detrás, y trazarlo entero la volvería un
  // marco flotante en vez de una hoja atrás.
  //
  // Las esquinas redondeadas salen del `strokeLinejoin: 'round'` de
  // `trazo()`, como en TODO el set — no de un `rx`. Es lo que lo vuelve
  // hermano y no injerto: mismo peso (1.9), mismos remates, misma grilla.
  copiar: ({ tinta }) => (
    <>
      <Path d="M15.5 5H5V15.5" {...trazo(tinta)} />
      <Path d="M19 8.5H8.5V19H19Z" {...trazo(tinta)} />
    </>
  ),
  descargar: ({ tinta }) => (
    <>
      <Path d="M12 3.6v9.8" {...trazo(tinta)} />
      <Path d="M8 9.4 12 13.4l4-4" {...trazo(tinta)} />
      <Path d="M5 14v5.5h14V14" {...trazo(tinta)} />
    </>
  ),
  /* S104-B · la almendra + la pupila. Simétrica en los dos ejes: el ojo
   * es la única figura del set que no tiene "arriba" propio, así que
   * cualquier asimetría se lee como error de dibujo y no como estilo. */
  ojo: ({ tinta }) => (
    <>
      <Path d="M2.8 12C2.8 12 6.9 6.2 12 6.2S21.2 12 21.2 12 17.1 17.8 12 17.8 2.8 12 2.8 12Z" {...trazo(tinta)} />
      <Path d="M14.7 12a2.7 2.7 0 1 1-5.4 0 2.7 2.7 0 0 1 5.4 0Z" {...trazo(tinta)} />
    </>
  ),
  /* La MISMA almendra, byte a byte, + la barra. **La pupila se suelta a
   * propósito** (ver la entrada del tipo): a 21 px tres trazos compiten y
   * la barra ya dice apagado sola. Copiar la almendra y no re-dibujarla es
   * lo que garantiza que los dos hermanos sean la misma silueta. */
  ojoTachado: ({ tinta }) => (
    <>
      <Path d="M2.8 12C2.8 12 6.9 6.2 12 6.2S21.2 12 21.2 12 17.1 17.8 12 17.8 2.8 12 2.8 12Z" {...trazo(tinta)} />
      <Path d="M4.5 4.5 19.5 19.5" {...trazo(tinta)} />
    </>
  ),
}

export function Icono({
  nombre,
  tamano = 24,
  registro = 'capa',
  tinta,
  huella,
  activa,
}: {
  nombre: IconoNombre
  /** Tamaño de render; el diseño vive en la grilla 24 (gate también a 21 — §2.9). */
  tamano?: number
  /** 'capa' hex puro (dueño) · 'aa' funcional (prestador) · 'tinta' (vista con su acento ya puesto). */
  registro?: IconoRegistro
  /** Override del color de trazo (default: text.primary del tema). */
  tinta?: string
  /** Override del color de la HUELLA, independiente de `tinta` (S86-B,
   *  D-546). Es lo que permite "trazo en tinta + huella en el teal del
   *  oficio" — la composición firmada en el gate S78 que ningún
   *  `registro` podía producir, y por la que nació `iconos-oficio`.
   *  Sin él, la huella la sigue resolviendo el registro por su capa. */
  huella?: string
  /** ESTADO de la barra de tabs (S86-B). Sin definir = el glifo vive
   *  PRESENTE, como en todo el resto del producto. Definido, la ley 6
   *  decide qué hace la huella **según el registry, no según quien
   *  monta**: la de MARCA aparece al activarse, la de ESTRUCTURA
   *  recolorea. Ver `HUELLA_ES_ESTRUCTURA` arriba. */
  activa?: boolean
}) {
  const { theme } = useTheme()
  const esMemorial = theme.mode === 'memorial'
  const colorTinta = tinta ?? theme.text.primary

  // capa del concepto (§2.2): paseo=cuidado(teal) · vet=identidad
  // (verde vital) · refugio/coach=comunidad(magenta) · grooming/
  // despensa=ocre (cuidado/consumo — status.warning es el ocre puro).
  const esCapa = 'capa' in theme
  const cuidado = { pura: esCapa ? theme.capa.cuidado : colorTinta, aa: 'capaText' in theme ? theme.capaText.cuidado : colorTinta }
  const identidad = { pura: esCapa ? theme.capa.identidad : colorTinta, aa: 'capaText' in theme ? theme.capaText.identidad : colorTinta }
  const comunidad = { pura: esCapa ? theme.capa.comunidad : colorTinta, aa: 'capaText' in theme ? theme.capaText.comunidad : colorTinta }
  const comunidadAmplia = { pura: esCapa ? theme.capa.comunidadAmplia : colorTinta, aa: 'capaText' in theme ? theme.capaText.comunidadAmplia : colorTinta }
  const ocre = { pura: theme.status.warning, aa: theme.status.warningText }
  const porConcepto: Record<IconoNombre, { pura: string; aa: string }> = {
    paseo: { pura: esCapa ? theme.capa.cuidado : colorTinta, aa: 'capaText' in theme ? theme.capaText.cuidado : colorTinta },
    veterinaria: { pura: esCapa ? theme.capa.identidad : colorTinta, aa: 'capaText' in theme ? theme.capaText.identidad : colorTinta },
    grooming: { pura: theme.status.warning, aa: theme.status.warningText },
    refugio: { pura: esCapa ? theme.capa.comunidad : colorTinta, aa: 'capaText' in theme ? theme.capaText.comunidad : colorTinta },
    despensa: { pura: theme.status.warning, aa: theme.status.warningText },
    /* El carrito HEREDA el color de `despensa` y no elige el suyo: es la
       misma capa (CONSUMO) y son la misma familia — la sección y lo que
       llevás adentro de ella. *Darle color propio los separaría en la
       pantalla justo donde tienen que leerse juntos.* */
    carrito: { pura: theme.status.warning, aa: theme.status.warningText },
    /* `pedido` HEREDA el ocre de la despensa por el mismo motivo que
       `carrito`: es la misma familia (comprar), en otro momento. Un color
       propio diría que es otro mundo. */
    pedido: { pura: theme.status.warning, aa: theme.status.warningText },
    /* Control puro: se viste de TINTA, no de capa — no nombra un mundo,
       ejecuta una acción. Mismo criterio que `lapiz`. */
    papelera: { pura: colorTinta, aa: colorTinta },
    // ✅ OCRE — FIRMADO (founder, S84-B17), y con esta firma se cierra la
    // pregunta que el glifo arrastraba desde que nació: **QUÉ ES el
    // destello**. No es marca (habría quedado en magenta por §5.1) ni
    // control funcional (habría ido al verde del oficio): **se viste del
    // COMERCIO**. Es una tercera respuesta, y es del founder.
    //
    // LO QUE COSTÓ CADA DESCARTE, registrado porque medirlo fue el trabajo
    // y borrarlo dejaría la firma sin su porqué:
    //  · ORO #FCBC1D — CAÍDO POR MEDICIÓN, no por gusto: **1.59 sobre el
    //    papel verde del prestador**, contra un mínimo de 3 (el glifo es
    //    gráfica, no texto). En oscuro pasaba holgado (10.79). La causa es
    //    de origen: el oro nació como RELLENO de CTA contra el papel del
    //    cliente, con label en tinta encima; acá se le pedía ser TINTA
    //    sobre papel, el trabajo inverso. Un color que sirve en un solo
    //    tema es media opción.
    //  · MAGENTA de capa (5.28 / 5.13) — contestaba "el destello es
    //    MARCA", que es lo que §5.1 implica y lo que §15b.1 permitiría.
    //  · TEAL del oficio (5.42 / 11.93) — contestaba "es CONTROL
    //    FUNCIONAL". Las dos pasaban de sobra: no se cayeron por número.
    //
    // ⚠️ Y EL ROCE QUE LA FIRMA ACEPTA, dicho para que no se descubra
    // después: el ocre es la capa del CONSUMO — la misma que descarté
    // para `contacto` con "un canal de contacto no vende nada". Un
    // destello de IA tampoco vende. La firma dice que igual se viste así.
    ia: ocre,
    // ── LOTE 3 (S58, D-361): capas por concepto — el founder poda/ajusta en gate ──
    hogar: comunidad, familia: comunidad, equipo: comunidad,
    explorar: comunidadAmplia,
    cuenta: identidad, carnet: identidad, seguros: identidad, telemedicina: identidad,
    hoy: cuidado, preferencias: cuidado, ayuda: cuidado, ubicacion: cuidado,
    // INFO comparte capa con `ayuda` PROVISIONALMENTE: los dos explican.
    // ⚠️ Si el gate de S79 firma la categoría «glifo de control», este
    // es su primer habitante y su capa la define esa firma, no esta línea.
    info: cuidado,
    /* Los cuatro nodos siguen a `info`: son CONTROL, y el control de
     * esta casa vive en `cuidado`. **En la escalera este mapa casi no
     * se usa** —el slot `icono` recibe el color del nodo y se pasa por
     * `tinta`—, pero se declara igual: un glifo sin entrada acá no
     * compila, y dejarlo resuelto evita que el próximo que lo monte
     * fuera de la escalera herede un color por descarte. */
    nodoConfirmado: cuidado, nodoPreparando: cuidado, nodoEnCamino: cuidado, nodoEntregado: cuidado,
    // ATENDER va a CUIDADO y la elección es de taxonomía (Ley 10: se
    // reparte por lo que la cosa ES, no por dónde aparece). Atender a
    // quien llegó por la puerta es EL TRABAJO DEL DÍA — la misma capa
    // que `hoy`, la jornada. NO va a `ocre` aunque una de sus dos
    // puertas sea la venta de mostrador: ocre es la capa del CONSUMO, y
    // pintar ahí la tab principal de la recepción de una clínica diría
    // que su oficio es vender. La venta es UNA de sus puertas, no su
    // naturaleza.
    atender: cuidado,
    training: cuidado, hotel: cuidado, guarderia: cuidado, vacaciones: cuidado,
    negocio: ocre, pagos: ocre,
    // S84-B4 — CONTACTO va a COMUNIDAD, y la elección es de taxonomía,
    // no de gusto: Ley 10 reparte por lo que la cosa ES, y contactar es
    // el vínculo entre la familia y el negocio (misma capa que `familia`
    // y `equipo`, que son los otros dos vínculos entre personas). NO va
    // a `ocre` con `negocio` aunque comparta pantalla con él: ocre es la
    // capa del CONSUMO —el negocio como comercio—, y un canal de
    // contacto no vende nada. Los dos candidatos comparten capa: lo que
    // el founder elige a 21px es el DIBUJO, no el color.
    contacto: comunidad,
    // DOCUMENTO va a IDENTIDAD y la elección es de taxonomía (Ley 10):
    // una cédula, un RUC o un NIT son QUIÉN ES el negocio ante el Estado
    // — el mismo eje que `cuenta` y `carnet`, que son las otras dos
    // identidades del producto. No va a `ocre`/CONSUMO aunque el trámite
    // sea comercial: el documento no vende, acredita.
    documento: identidad,
    /* CERTIFICACIÓN → `identidad`, y se ancla en el vecino en vez de
       elegirse: `documento` (identificación) YA es identidad, y una
       certificación es de esa familia — un papel que dice QUIÉN ES y para
       qué está habilitada. *No es `cuidado` como `training`: el curso es el
       servicio; el certificado es la condición que queda.* */
    certificaciones: identidad,
    /* WEARABLE → `identidad`, y **no se eligió: la casa ya lo tenía
       declarado**. `themes/light.ts` dice `services.wearable:
       palette.verdeVitalDark  // Capa 1 · monitoreo de vida`. Se lee de ahí
       (L-166) en vez de razonarlo de nuevo y arriesgar contradecirlo. */
    wearables: identidad,
    // Las tres secciones de "Datos comerciales" comparten CAPA a
    // propósito: son la identidad del negocio ante el Estado y ante el
    // banco, y tres hermanas de la misma pantalla que divergieran de
    // color dirían que son de dominios distintos. Que no diverjan es la
    // decisión, no el default.
    fiscal: identidad, bancario: identidad,
    // `datos` responde "a quiénes cuido" — es la mascota contada, capa
    // identidad como `cuenta` y `carnet`.
    datos: identidad,
    // S85-B18 — la ventana temporal comparte capa con `hoy`, que es su
    // hermana mayor: son el MISMO eje (cuándo), no dominios distintos.
    semana: cuidado, mes: cuidado,
    prime: comunidad, primeCorona: comunidad,
    // LOTE S71-B2 (firma founder): caso = historia clínica (familia de
    // carnet/vet) · presupuesto = plata del cuidado (familia pagos/negocio)
    caso: identidad, presupuesto: ocre,
    // S82-B r10: la vacuna es PROTECCIÓN DE VIDA — capa identidad, la
    // misma que carnet/vet/seguros (§ Ley 10: la taxonomía manda).
    vacuna: identidad,
    // La bitácora es del expediente de la mascota — capa identidad.
    bitacora: identidad,
    // S90-B: la receta es del expediente clínico — misma capa que
    // `caso`, `vacuna` y `carnet`. No va a `ocre`/CONSUMO aunque nombre
    // un medicamento: la receta no vende, indica.
    receta: identidad,
    // S91-B: los papeles del hogar son del EXPEDIENTE — misma capa que sus
    // hermanos (`documento`, `carnet`, `receta`), no una categoría nueva.
    documentos: identidad,
    // `correo` es un canal, no expediente — pero su capa se decide con su
    // primer consumidor REAL, no ahora: hoy hereda `identidad` para no
    // fabricar una decisión de taxonomía que nadie pidió (Ley 10).
    correo: identidad,
    // GLIFOS DE CONTROL (S82-B r7): TINTA en los dos registros — un
    // control no pertenece a una capa (no hay oficio del que tomar
    // color) y su huella no se dibuja. El `registro="capa"` de un
    // control resuelve a tinta a propósito: pedirle capa no lo tiñe.
    lapiz: { pura: colorTinta, aa: colorTinta },
    compartir: { pura: colorTinta, aa: colorTinta },
    // S100d-B — el filtro entra a la familia de los controles (mismo
    // criterio: un control no pertenece a una capa).
    filtro: { pura: colorTinta, aa: colorTinta },
    // S89-B: descargar entra a la familia de sus vecinos — mismo criterio
    // (un control no pertenece a una capa) y misma resolución.
    descargar: { pura: colorTinta, aa: colorTinta },
    /* Control: tinta en los dos registros, como sus cuatro hermanos. */
    copiar: { pura: colorTinta, aa: colorTinta },
    /* S104-B · el par ver/ocultar: control puro. Tinta en los dos
     * registros, sin huella — su `registro="capa"` resuelve a tinta a
     * propósito, igual que `lapiz` y `filtro`. */
    ojo: { pura: colorTinta, aa: colorTinta },
    ojoTachado: { pura: colorTinta, aa: colorTinta },
    // S88 — la campana: OBJETO sin capa (un aviso no pertenece a un
    // oficio) ⇒ tinta en los dos registros, como los controles — sin
    // fundar §6bis: el criterio acá es «sin capa de la que tomar color».
    campana: { pura: colorTinta, aa: colorTinta },
  }

  // §2.8 memorial: la huella a tinta secundaria, el trazo se conserva.
  // El override explícito GANA sobre memorial a propósito: quien lo pasa
  // (la barra de tabs) ya degradó el color por tema antes de entregarlo.
  const colorHuella =
    huella ??
    (esMemorial
      ? theme.text.secondary
      : registro === 'tinta'
        ? colorTinta
        : registro === 'aa'
          ? porConcepto[nombre].aa
          : porConcepto[nombre].pura)

  /* LEY 6 aplicada — y el registry es quien la contesta (ver arriba).
   * `activa === undefined` ⇒ el glifo vive PRESENTE: es todo el producto
   * fuera de una barra de tabs, y por eso es el default silencioso. */
  const huellaFinal =
    activa === undefined
      ? colorHuella
      : HUELLA_ES_ESTRUCTURA.has(nombre)
        ? // ESTRUCTURA: nunca desaparece — en reposo toma el color del
          // trazo, que es lo que hacía la pata a mano en la barra viva.
          (activa ? colorHuella : colorTinta)
        : // MARCA: aparece al activarse. 'none' y no un color de fondo:
          // el glifo se sostiene solo sin ella (por eso es marca).
          (activa ? colorHuella : 'none')

  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24">
      {DIBUJANTES[nombre]({ tinta: colorTinta, huella: huellaFinal })}
    </Svg>
  )
}
