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
  | 'paseo' | 'veterinaria' | 'grooming' | 'refugio' | 'despensa' | 'coach'
  // ── LOTE 3 (S58, D-361 — gate founder POR ÍCONO pendiente) ──
  | 'hogar' | 'explorar' | 'cuenta' | 'hoy' | 'negocio'
  | 'carnet' | 'familia' | 'preferencias' | 'pagos' | 'ayuda' | 'ubicacion'
  | 'training' | 'hotel' | 'guarderia' | 'seguros' | 'telemedicina'
  | 'vacaciones' | 'equipo'
  // Prime (concepto 19): DOS candidatos — el founder elige a 21px; el perdedor muere
  | 'prime' | 'primeCorona'
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

  // El destello del Coach — trío de chispas de Kaxo, re-tokenizado a
  // magenta (§5.1). Sin huella: el destello ES la marca de la IA.
  coach: ({ huella }) => (
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
  // El escudo — la vida protegida (verde vital, como insurance).
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
    coach: { pura: esCapa ? theme.capa.comunidad : colorTinta, aa: 'capaText' in theme ? theme.capaText.comunidad : colorTinta },
    // ── LOTE 3 (S58, D-361): capas por concepto — el founder poda/ajusta en gate ──
    hogar: comunidad, familia: comunidad, equipo: comunidad,
    explorar: comunidadAmplia,
    cuenta: identidad, carnet: identidad, seguros: identidad, telemedicina: identidad,
    hoy: cuidado, preferencias: cuidado, ayuda: cuidado, ubicacion: cuidado,
    training: cuidado, hotel: cuidado, guarderia: cuidado, vacaciones: cuidado,
    negocio: ocre, pagos: ocre,
    prime: comunidad, primeCorona: comunidad,
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
