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
  // S85-B10 — EMBLEMA DE COHORTE en DOS candidatos. El censo mató a la
  //   medalla (círculo ocupado ×3), al laurel (colisiona con `equipo`) y
  //   al podio (LOYALTY §3 prohíbe el ranking). GATE POR ÍCONO A 21px.
  | 'emblemaBanderin' | 'emblemaCinta'
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
export type IconoRegistro = 'capa' | 'aa' | 'tinta'

const TRAZO = 1.9

type Pincel = { tinta: string; huella: string }

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
  // La chapita de collar — la identidad colgada (tab Cuenta y perfil;
  // la figura humana del boceto S57 quedó PROHIBIDA §2.4).
  cuenta: ({ tinta, huella }) => (
    <>
      <Circle cx={12} cy={5.6} r={1.9} {...trazo(tinta)} />
      <Circle cx={12} cy={13.6} r={6.6} {...trazo(tinta)} />
      <Huella color={huella} x={8.9} y={10.6} escala={0.38} />
    </>
  ),
  // El sol del oficio — el día de trabajo con la mascota adentro.
  hoy: ({ tinta, huella }) => (
    <>
      <Circle cx={12} cy={12} r={4.6} {...trazo(tinta)} />
      <Path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6" {...trazo(tinta)} />
      <Huella color={huella} x={9.3} y={9.5} escala={0.32} />
    </>
  ),
  // El maletín del oficio lleva su huella (tab Negocio).
  negocio: ({ tinta, huella }) => (
    <>
      <Path d="M4.4 8.6h15.2V18a1.5 1.5 0 0 1-1.5 1.5H5.9A1.5 1.5 0 0 1 4.4 18Z" {...trazo(tinta)} />
      <Path d="M9.4 8.6V6.9a1.9 1.9 0 0 1 1.9-1.9h1.4a1.9 1.9 0 0 1 1.9 1.9v1.7" {...trazo(tinta)} />
      <Huella color={huella} x={8.7} y={10.7} escala={0.4} />
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
  // ── EMBLEMA DE COHORTE (fundador / pionero) · S85-B10, DOS CANDIDATOS ──
  //
  // EL CENSO DE IDIOMAS, PRIMERO — y esta vez mató a los dos candidatos
  // obvios ANTES de que existieran, uno por idioma y el otro por LEY:
  //
  //  ☠️ LA MEDALLA / ROSETA (el candidato que cualquiera dibuja primero)
  //     cae por idioma: «círculo centrado» ya está ocupado TRES veces —
  //     `ayuda` (r 8.4 + 4 rayos) · `preferencias` (r 4.4 + 8 rayos) ·
  //     `hoy` (r 4.6 + 8 rayos). Sería la CUARTA, y a 21px un disco es un
  //     disco. Es el mismo idioma ocupado que hundió a `contactoOndas` y
  //     a `documentoSello`: tercera y cuarta vez que el censo cobra.
  //
  //  ☠️ EL LAUREL cae por una colisión que NADIE habría visto sin medir:
  //     `equipo` YA ES dos ramas curvas simétricas que suben desde abajo
  //     (`M6.2 4.4c3.6 1.5 4.2 5.4 1.2 8.8` + su espejo). Un laurel es
  //     exactamente eso. A 21px serían el mismo dibujo — y encima vecinos
  //     temáticos (equipo/pertenencia), que es la peor colisión posible.
  //
  //  ☠️ EL PODIO / EL «1º» cae por LEY, no por dibujo: MODELO_LOYALTY §3
  //     prohíbe la voz del desempeño —niveles, rankings, puntajes—, y un
  //     podio ES un ranking dibujado. Que un glifo muera por una ley de
  //     producto y no por geometría vale registrarlo: el censo de idiomas
  //     no habría dicho una palabra de éste.
  //
  // LO QUE QUEDA, Y EL CRITERIO QUE LOS ELIGE: pertenencia y LLEGADA
  // TEMPRANA, jamás mérito comparado. La cohorte fundadora no ganó una
  // competencia — estuvo antes. Los dos candidatos dicen eso sin ranking.
  // Comparten capa (COMUNIDAD): lo que el founder elige a 21px es el
  // DIBUJO, no el color.
  //
  // CANDIDATO A — EL BANDERÍN PLANTADO. El objeto del acto (§1: se dibuja
  // el OBJETO, no la idea): plantar bandera es llegar primero y quedarse.
  // La huella va al PIE del asta — quien plantó es la mascota, no un
  // logro abstracto.
  // ⚠️ SU RIESGO, declarado: a 21px un banderín puede leerse como
  // «reportar» o «marcar» (la bandera es el idioma universal del flag).
  // Se monta al lado de `hoy` y `ubicacion` para ver si compite.
  emblemaBanderin: ({ tinta, huella }) => (
    <>
      <Path d="M7.6 3.6v17" {...trazo(tinta)} />
      <Path d="M7.6 4.6h10l-2.9 3.3 2.9 3.3h-10Z" {...trazo(tinta)} />
      <Huella color={huella} x={12.6} y={14.4} escala={0.34} />
    </>
  ),

  // CANDIDATO B — LA CINTA, SIN EL DISCO. Es el movimiento que ya salvó a
  // `documento` (el retrato) y a `bancario` (las columnas): se toma el
  // objeto obvio y se le QUITA la parte que colisiona. En una escarapela
  // lo que choca es el disco; las colas de la cinta no chocan con nada
  // del registry. Nudo arriba, dos colas divergentes con su muesca.
  // ⚠️ SU RIESGO, declarado: sin el disco puede perder el significado de
  // «distinción» y leerse como un marcador o un separador. Es el riesgo
  // inverso al de A —A se confunde, B se vacía— y por eso van los dos.
  emblemaCinta: ({ tinta, huella }) => (
    <>
      <Path d="M9.4 3.8h5.2v2.8H9.4Z" {...trazo(tinta)} />
      <Path d="M10.4 6.6 8.2 15.4l2.9-1.4" {...trazo(tinta)} />
      <Path d="M13.6 6.6l2.2 8.8-2.9-1.4" {...trazo(tinta)} />
      <Huella color={huella} x={9.4} y={17.4} escala={0.32} />
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
}: {
  nombre: IconoNombre
  /** Tamaño de render; el diseño vive en la grilla 24 (gate también a 21 — §2.9). */
  tamano?: number
  /** 'capa' hex puro (dueño) · 'aa' funcional (prestador) · 'tinta' (vista con su acento ya puesto). */
  registro?: IconoRegistro
  /** Override del color de trazo (default: text.primary del tema). */
  tinta?: string
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
    prime: comunidad, primeCorona: comunidad,
    // S85-B10 — EL EMBLEMA DE COHORTE va a COMUNIDAD, y es taxonomía
    // (Ley 10), no gusto: pertenecer a la cohorte fundadora es un VÍNCULO
    // con el producto y su gente — la misma capa que `familia`, `equipo`
    // y `contacto`, que son los otros vínculos. NO va a `identidad`
    // aunque se parezca a una credencial: no acredita QUIÉN ES el
    // negocio ante nadie, dice DESDE CUÁNDO pertenece. Los dos candidatos
    // comparten capa a propósito: lo que se elige a 21px es el DIBUJO.
    emblemaBanderin: comunidad, emblemaCinta: comunidad,
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
  const colorHuella = esMemorial
    ? theme.text.secondary
    : registro === 'tinta'
      ? colorTinta
      : registro === 'aa'
        ? porConcepto[nombre].aa
        : porConcepto[nombre].pura

  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24">
      {DIBUJANTES[nombre]({ tinta: colorTinta, huella: colorHuella })}
    </Svg>
  )
}
