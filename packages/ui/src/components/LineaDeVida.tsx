/**
 * LineaDeVida — el timeline del dueño (S45-B5.2). La columna
 * cronológica donde la vida de la mascota se lee de un vistazo:
 * conector vertical + nodos con punto de capa, fecha en voz humana
 * y Tarjeta del momento.
 *
 * ═══════════════════════════════════════════════════════════════════
 * LEY 3 — acá se juega todo: el diccionario tipo→{voz humana, capa}
 * es CERRADO y vive adentro. El dueño JAMÁS ve un código del modelo.
 * Tipo desconocido → nodo genérico digno por eje, jamás el código.
 *
 * DICCIONARIO (revisión de voz: reporte S45-B5.2; vacunas S47-B1.2):
 *   atencion_paseo_registrada            → "Paseo" · capa cuidado
 *   alta_asistida_completada_por_cliente → "Se sumó a la familia" · capa identidad
 *   vacuna_aplicada                      → "Recibió la vacuna {nombre}"
 *     · capa cuidado — {nombre} llega en item.vacuna_nombre (tal cual
 *     quedó en la revisión del carnet); sin nombre degrada a
 *     "Recibió una vacuna". Ley 3: cero vocabulario del modelo.
 *   cita_servicio                        → NO SE MUESTRA: el momento
 *     significativo del dueño es la atención, no su cita administrativa.
 *     El filtrado es del wrapper (leerTimelineMascota) / pantalla;
 *     queda documentado acá porque el diccionario es la fuente de voz.
 *   desconocido por eje_jtbd:
 *     salud          → "Momento de cuidado" · capa cuidado
 *     administrativo → "Novedad del expediente" · capa identidad
 *     otro/sin eje   → "Momento guardado" · capa identidad
 * ═══════════════════════════════════════════════════════════════════
 *
 * Registro de voz: título y fechas en DM Sans (seres vivos); la hora
 * y duración en mono minúsculas ("17:30 · 45 min") — voz de máquina.
 * Punto del nodo en hex PURO de su capa (registro gráfico, dosis
 * alta dueño); conector hairline en bg.border.
 *
 * Estados: carga inicial = EsqueletoGrupo imitando 3 nodos (estático,
 * Ley 13) · pie: "Cargar más" discreto / cargando (spinner del Boton,
 * umbral 150ms) / error con reintento. El VACÍO no es de acá:
 * EstadoVacio lo compone la pantalla.
 *
 * Sin animación de entrada de nodos (Ley 6). Presentacional puro.
 * A11y: lista semántica; cada nodo anuncia "{título}, {fecha}".
 */

import { Text, View } from 'react-native'
import { Image, type ImageSource } from 'expo-image'

import { typography } from '../tokens/typography'
import { spacing } from '../tokens/spacing'
import { radius } from '../tokens/radius'
import { useTheme } from '../ThemeProvider'
import { Boton } from './Boton'
import { Tarjeta } from './Tarjeta'
import { Esqueleto, EsqueletoGrupo } from './Esqueleto'

type CapaNodo = 'identidad' | 'cuidado' | 'comunidad' | 'comunidadAmplia'

// ── Diccionario cerrado (Ley 3) ──────────────────────────────────────────────
const DICCIONARIO: Record<string, { titulo: string; capa: CapaNodo }> = {
  atencion_paseo_registrada: { titulo: 'Paseo', capa: 'cuidado' },
  alta_asistida_completada_por_cliente: { titulo: 'Se sumó a la familia', capa: 'identidad' },
  // cita_servicio: intencionalmente AUSENTE — no se muestra (ver header).
}

const POR_EJE: Record<string, { titulo: string; capa: CapaNodo }> = {
  salud: { titulo: 'Momento de cuidado', capa: 'cuidado' },
  administrativo: { titulo: 'Novedad del expediente', capa: 'identidad' },
}

const GENERICO = { titulo: 'Momento guardado', capa: 'identidad' as CapaNodo }

function vozDe(item: LineaDeVidaItem): { titulo: string; capa: CapaNodo } {
  // vacuna_aplicada lleva el nombre ADENTRO de la voz (S47-B1.2 C) —
  // el nombre lo escribió un humano en la revisión del carnet.
  if (item.tipo === 'vacuna_aplicada') {
    return {
      titulo: item.vacuna_nombre ? `Recibió la vacuna ${item.vacuna_nombre}` : 'Recibió una vacuna',
      capa: 'cuidado',
    }
  }
  return DICCIONARIO[item.tipo] ?? POR_EJE[item.eje_jtbd ?? ''] ?? GENERICO
}

// ── Fechas en voz humana ─────────────────────────────────────────────────────
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

function claveDia(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

// Evento de FECHA sola (S48-B6.3): fecha_evento ancla la medianoche UTC
// del día calendario, así que sus partes se leen en UTC — leerlas en
// hora local corre el día ("25 oct" → "24 de octubre" en UTC-5). Un
// evento con hora real sigue leyéndose en hora local del dispositivo.
function partesDia(iso: string, fechaSola: boolean): { a: number; m: number; d: number } {
  const f = new Date(iso)
  return fechaSola
    ? { a: f.getUTCFullYear(), m: f.getUTCMonth(), d: f.getUTCDate() }
    : { a: f.getFullYear(), m: f.getMonth(), d: f.getDate() }
}

function claveDiaItem(item: LineaDeVidaItem): string {
  const p = partesDia(item.fecha_evento, item.fecha_sola ?? false)
  return `${p.a}-${p.m}-${p.d}`
}

function fechaHumana(iso: string, fechaSola = false): string {
  const p = partesDia(iso, fechaSola)
  const clave = `${p.a}-${p.m}-${p.d}`
  const hoy = new Date()
  const ayer = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 1)
  if (clave === claveDia(hoy)) return 'Hoy'
  if (clave === claveDia(ayer)) return 'Ayer'
  const base = `${p.d} de ${MESES[p.m]}`
  return p.a === hoy.getFullYear() ? base : `${base} de ${p.a}`
}

function horaMono(iso: string, duracionMin?: number | null): string {
  const f = new Date(iso)
  const hh = String(f.getHours()).padStart(2, '0')
  const mm = String(f.getMinutes()).padStart(2, '0')
  const dur = typeof duracionMin === 'number' && duracionMin > 0 ? ` · ${duracionMin} min` : ''
  return `${hh}:${mm}${dur}`
}

// ── API ──────────────────────────────────────────────────────────────────────

export interface LineaDeVidaItem {
  evento_id: string
  /** Código crudo de eventos_mascota.tipo — la voz la pone el diccionario. */
  tipo: string
  eje_jtbd?: string | null
  /** ISO timestamp. */
  fecha_evento: string
  /** Nombre de la fuente (prestador) o null. */
  titulo_fuente?: string | null
  duracion_min?: number | null
  /** Total real de fotos (para el "+N"). */
  fotos_count?: number
  /** Thumbnails ya resueltos (signed URLs / assets); se muestran hasta 2. */
  fotos?: Array<string | number | ImageSource>
  /** Solo tipo=vacuna_aplicada: el nombre para "Recibió la vacuna {nombre}". */
  vacuna_nombre?: string | null
  /** Evento de FECHA sola (S48-B6.3): fecha_evento ancla la medianoche
   *  UTC del día — se muestra el día calendario (partes UTC) y SIN hora.
   *  Una hora inventada + corrimiento de zona es mentirle al dueño. */
  fecha_sola?: boolean
}

export type LineaDeVidaEstadoPie = 'nada' | 'mas' | 'cargando' | 'error'

export interface LineaDeVidaProps {
  items: LineaDeVidaItem[]
  /** Carga INICIAL: esqueleto de 3 nodos. El vacío es de la pantalla. */
  cargando?: boolean
  onPressNodo?: (item: LineaDeVidaItem) => void
  /** Pie de paginación (Ley 13). */
  estadoPie?: LineaDeVidaEstadoPie
  onCargarMas?: () => void
}

// ── Piezas ───────────────────────────────────────────────────────────────────

const RIEL = 24        // ancho de la columna del conector
const PUNTO = 10       // diámetro del punto de capa (hex puro)
const LADO_THUMB = 48

function Miniaturas({ fotos, total }: { fotos: Array<string | number | ImageSource>; total: number }) {
  const { theme } = useTheme()
  const visibles = fotos.slice(0, 2)
  const resto = total - visibles.length
  if (visibles.length === 0) return null
  return (
    <View style={{ flexDirection: 'row', gap: spacing[1.5], marginTop: spacing[2] }}>
      {visibles.map((f, i) => (
        <Image
          key={i}
          source={typeof f === 'string' ? { uri: f } : f}
          contentFit="cover"
          transition={0}
          style={{ width: LADO_THUMB, height: LADO_THUMB, borderRadius: radius.sm }}
          accessibilityLabel={`Foto ${i + 1} de ${total}`}
        />
      ))}
      {resto > 0 ? (
        <View
          style={{
            width: LADO_THUMB,
            height: LADO_THUMB,
            borderRadius: radius.sm,
            backgroundColor: theme.bg.overlay,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.sm, color: theme.text.secondary }}>
            +{resto}
          </Text>
        </View>
      ) : null}
    </View>
  )
}

function Nodo({
  item,
  conAgrupador,
  esUltimo,
  onPress,
}: {
  item: LineaDeVidaItem
  conAgrupador: boolean
  esUltimo: boolean
  onPress?: (item: LineaDeVidaItem) => void
}) {
  const { theme } = useTheme()
  const voz = vozDe(item)
  const fecha = fechaHumana(item.fecha_evento, item.fecha_sola ?? false)
  // Memorial no tiene registro de capa: el punto degrada a text.secondary.
  const colorPunto = theme.mode === 'memorial' ? theme.text.secondary : theme.capa[voz.capa]

  const contenidoTarjeta = (
    <>
      <Text style={{ fontFamily: typography.family.sans.medium, fontSize: typography.size.base, color: theme.text.primary }}>
        {voz.titulo}
      </Text>
      {item.titulo_fuente ? (
        <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.secondary, marginTop: spacing[0.5] }}>
          con {item.titulo_fuente}
        </Text>
      ) : null}
      {/* fecha-sola NO tiene hora: mostrarla sería inventarla (B6.3) */}
      {!item.fecha_sola && (
        <Text
          style={{
            // voz de máquina: mono, minúsculas, tracking suave (regla de voz)
            fontFamily: typography.family.mono.regular,
            fontSize: typography.size.xs,
            letterSpacing: typography.tracking.mono,
            color: theme.text.secondary,
            marginTop: spacing[1],
          }}
        >
          {horaMono(item.fecha_evento, item.duracion_min)}
        </Text>
      )}
      <Miniaturas fotos={item.fotos ?? []} total={item.fotos_count ?? item.fotos?.length ?? 0} />
    </>
  )

  const tarjeta = onPress ? (
    <Tarjeta
      interactiva
      onPress={() => onPress(item)}
      accessibilityRole="button"
      etiqueta={`${voz.titulo}, ${fecha}`}
    >
      {contenidoTarjeta}
    </Tarjeta>
  ) : (
    <Tarjeta>{contenidoTarjeta}</Tarjeta>
  )

  return (
    <View>
      {conAgrupador ? (
        <View style={{ flexDirection: 'row' }}>
          <View style={{ width: RIEL }} />
          <Text
            accessibilityRole="header"
            style={{
              fontFamily: typography.family.sans.medium,
              fontSize: typography.size.sm,
              color: theme.text.secondary,
              marginBottom: spacing[2],
              marginTop: spacing[1],
            }}
          >
            {fecha}
          </Text>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row' }}>
        {/* riel: conector hairline + punto de capa en hex puro */}
        <View style={{ width: RIEL, alignItems: 'center' }}>
          <View
            style={{
              position: 'absolute',
              top: 0,
              bottom: esUltimo ? undefined : 0,
              height: esUltimo ? spacing[5] : undefined,
              width: 1,
              backgroundColor: theme.bg.border,
            }}
          />
          <View
            style={{
              marginTop: spacing[4],
              width: PUNTO,
              height: PUNTO,
              borderRadius: radius.full,
              backgroundColor: colorPunto,
            }}
          />
        </View>
        <View style={{ flex: 1, paddingBottom: spacing[3] }}>{tarjeta}</View>
      </View>
    </View>
  )
}

function EsqueletoNodo() {
  return (
    <View style={{ flexDirection: 'row' }}>
      <View style={{ width: RIEL, alignItems: 'center', paddingTop: spacing[4] }}>
        <Esqueleto forma="circulo" alto={PUNTO} />
      </View>
      <View style={{ flex: 1, paddingBottom: spacing[3] }}>
        <Esqueleto forma="bloque" ancho="100%" alto={88} />
      </View>
    </View>
  )
}

export function LineaDeVida({
  items,
  cargando = false,
  onPressNodo,
  estadoPie = 'nada',
  onCargarMas,
}: LineaDeVidaProps) {
  const { theme } = useTheme()

  if (cargando) {
    return (
      <EsqueletoGrupo etiqueta="Cargando la línea de vida">
        <EsqueletoNodo />
        <EsqueletoNodo />
        <EsqueletoNodo />
      </EsqueletoGrupo>
    )
  }

  return (
    <View accessibilityRole="list">
      {items.map((item, i) => (
        <Nodo
          key={item.evento_id}
          item={item}
          conAgrupador={
            i === 0 ||
            claveDiaItem(items[i - 1]) !== claveDiaItem(item)
          }
          esUltimo={i === items.length - 1 && estadoPie === 'nada'}
          onPress={onPressNodo}
        />
      ))}

      {estadoPie !== 'nada' ? (
        <View style={{ marginLeft: RIEL, marginTop: spacing[1] }}>
          {estadoPie === 'error' ? (
            <View style={{ gap: spacing[2] }}>
              <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
                No pudimos cargar más momentos.
              </Text>
              <Boton variante="secundario" tamaño="sm" etiqueta="Reintentar" onPress={onCargarMas} />
            </View>
          ) : (
            <Boton
              variante="ghost"
              tamaño="sm"
              etiqueta="Cargar más"
              cargando={estadoPie === 'cargando'}
              onPress={onCargarMas}
            />
          )}
        </View>
      ) : null}
    </View>
  )
}

/** Compuesto útil para tests/galería. */
export const LineaDeVidaNodo = Nodo
