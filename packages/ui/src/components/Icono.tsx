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
  | 'carnet' | 'familia' | 'preferencias' | 'pagos' | 'ayuda' | 'ubicacion'
  | 'training' | 'hotel' | 'guarderia' | 'seguros' | 'telemedicina'
  | 'vacaciones' | 'equipo'
  // Prime (concepto 19): DOS candidatos — el founder elige a 21px; el perdedor muere
  | 'prime' | 'primeCorona'
  // ── LOTE S71-B2 (proceso enmendado DIRECCION_ARTE: la sesión autora,
  //    hoja de contacto de 3 variantes, firma founder POR ícono) ──
  | 'caso' | 'presupuesto'
  // ── LOS DOS PRIMEROS GLIFOS DE CONTROL (S82-B r7, importados del
  //    archivo de referencia que el founder entregó: `ficha-mascota`).
  //    GATE POR ÍCONO A 21px PENDIENTE (§2.9) · su LETRA NO SE ESCRIBE
  //    acá: la categoría "glifo de control" es §6bis de DIRECCION_ARTE,
  //    PENDIENTE desde S78 — regla 80 (la ley va DESPUÉS del gate).
  | 'lapiz' | 'compartir'
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
  pagos: ({ tinta, huella }) => (
    <>
      <Path d="M3.4 7.4h17.2a0 0 0 0 1 0 0v9.2a0 0 0 0 1 0 0H3.4a0 0 0 0 1 0 0V7.4a0 0 0 0 1 0 0Z" {...trazo(tinta)} />
      <Path d="M6.4 10.2v3.6M17.6 10.2v3.6" {...trazo(tinta)} />
      <Huella color={huella} x={8.9} y={9.2} escala={0.38} />
    </>
  ),
  // El salvavidas — ayuda que flota, con la huella a salvo adentro.
  ayuda: ({ tinta, huella }) => (
    <>
      <Circle cx={12} cy={12} r={8.4} {...trazo(tinta)} />
      <Path d="M12 3.6v3M12 17.4v3M3.6 12h3M17.4 12h3" {...trazo(tinta)} />
      <Huella color={huella} x={9.3} y={9.5} escala={0.3} />
    </>
  ),
  // El pin del hero — la huella vive en la gota (deja de ser placeholder).
  ubicacion: ({ tinta, huella }) => (
    <>
      <Path d="M12 21s-7-5.3-7-11a7 7 0 1 1 14 0c0 5.7-7 11-7 11Z" {...trazo(tinta)} />
      <Huella color={huella} x={8.9} y={6.6} escala={0.36} />
    </>
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
    // GLIFOS DE CONTROL (S82-B r7): TINTA en los dos registros — un
    // control no pertenece a una capa (no hay oficio del que tomar
    // color) y su huella no se dibuja. El `registro="capa"` de un
    // control resuelve a tinta a propósito: pedirle capa no lo tiñe.
    lapiz: { pura: colorTinta, aa: colorTinta },
    compartir: { pura: colorTinta, aa: colorTinta },
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
