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

import { useState, type ReactNode } from 'react'
import { LayoutAnimation, Platform, Text, UIManager, View } from 'react-native'
import { Image, type ImageSource } from 'expo-image'

import { typography } from '../tokens/typography'
import { spacing } from '../tokens/spacing'
import { radius } from '../tokens/radius'
import { useTheme } from '../ThemeProvider'
import { useTraduccionUi } from '../i18n'
import type { uiEs } from '../i18n/es'
import type { ClaveDe } from '@epetplace/i18n'
import { Boton } from './Boton'
import { Tarjeta } from './Tarjeta'
import { Esqueleto, EsqueletoGrupo } from './Esqueleto'

type CapaNodo = 'identidad' | 'cuidado' | 'comunidad' | 'comunidadAmplia'

// ── Diccionario cerrado (Ley 3) ──────────────────────────────────────────────
// S52-P4c: el TEXTO de cada voz vive en el riel (namespace ui, lote
// es/en aprobado); la ESTRUCTURA tipo→{clave,capa} sigue cerrada acá.
// S52-P2e (capas ejercitadas): la vacuna es PROTECCIÓN DE VIDA →
// capa identidad (mismo criterio que services.insurance/wearable en
// los temas) — el timeline deja de ser todo cyan con semántica real.
type VozTimeline = ClaveDe<typeof uiEs>
type TraductorUi = (clave: VozTimeline, valores?: Record<string, string | number>) => string

const DICCIONARIO: Record<string, { clave: VozTimeline; capa: CapaNodo }> = {
  atencion_paseo_registrada: { clave: 'lineaDeVida.vozPaseo', capa: 'cuidado' },
  // S61-A11 (hallazgo con cura): el grooming cerrado YA escribía
  // atencion_grooming_registrada y degradaba a voz genérica — gana voz.
  atencion_grooming_registrada: { clave: 'lineaDeVida.vozGrooming', capa: 'cuidado' },
  // S65 (hallazgo founder, mismo patrón que el grooming S61): la sesión
  // de adiestramiento degradaba a "Momento guardado" — gana voz.
  atencion_adiestramiento_registrada: { clave: 'lineaDeVida.vozAdiestramiento', capa: 'cuidado' },
  alta_asistida_completada_por_cliente: { clave: 'lineaDeVida.vozAlta', capa: 'identidad' },
  // S71-A CURA-4 (tercera vez el mismo patrón: grooming S61, adiestramiento
  // S65, ahora la consulta): la nota clínica sedimentada por el motor S70
  // escribía historia_clinica_registrada y degradaba a "Momento guardado"
  // — el hito clínico del expediente se leía como un momento sin nombre.
  // Capa CUIDADO: la consulta es un ACTO de cuidado; la vacuna conserva
  // identidad porque es protección de vida (criterio S52-P2e).
  historia_clinica_registrada: { clave: 'lineaDeVida.vozHistoriaClinica', capa: 'cuidado' },
  // cita_servicio: intencionalmente AUSENTE — no se muestra (ver header).
}

const POR_EJE: Record<string, { clave: VozTimeline; capa: CapaNodo }> = {
  salud: { clave: 'lineaDeVida.vozMomentoCuidado', capa: 'cuidado' },
  administrativo: { clave: 'lineaDeVida.vozNovedadExpediente', capa: 'identidad' },
}

const GENERICO: { clave: VozTimeline; capa: CapaNodo } = {
  clave: 'lineaDeVida.vozMomentoGuardado',
  capa: 'identidad',
}

function vozDe(item: LineaDeVidaItem, t: TraductorUi): { titulo: string; capa: CapaNodo } {
  // vacuna_aplicada lleva el nombre ADENTRO de la voz (S47-B1.2 C) —
  // el nombre lo escribió un humano en la revisión del carnet.
  if (item.tipo === 'vacuna_aplicada') {
    return {
      titulo: item.vacuna_nombre
        ? t('lineaDeVida.vozVacuna', { nombre: item.vacuna_nombre })
        : t('lineaDeVida.vozVacunaSinNombre'),
      capa: 'identidad',
    }
  }
  const voz = DICCIONARIO[item.tipo] ?? POR_EJE[item.eje_jtbd ?? ''] ?? GENERICO
  return { titulo: t(voz.clave), capa: voz.capa }
}

// ── Fechas en voz humana ─────────────────────────────────────────────────────
// S52-P4c: el mes sale de Intl con el idioma del riel — "6 de julio"
// en es, "July 6" en en (antes: array de meses hardcodeado español).
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

function fechaHumana(iso: string, fechaSola: boolean, t: TraductorUi, idioma: string): string {
  const p = partesDia(iso, fechaSola)
  const clave = `${p.a}-${p.m}-${p.d}`
  const hoy = new Date()
  const ayer = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 1)
  if (clave === claveDia(hoy)) return t('lineaDeVida.hoy')
  if (clave === claveDia(ayer)) return t('lineaDeVida.ayer')
  const locale = idioma === 'en' ? 'en-US' : 'es-EC'
  const fecha = new Date(p.a, p.m, p.d)
  const conAnio = p.a !== hoy.getFullYear()
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    ...(conAnio ? { year: 'numeric' } : null),
  }).format(fecha)
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
  /** S61-A11: la atención detrás del evento (el acordeón la necesita). */
  atencion_id?: string | null
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
  /** S61-A11 (nota de Kary: la vida deja de ser log): COLAPSADA —
   *  muestra N nodos y crece por tandas con "Ver más" ANTES de pedir
   *  páginas nuevas al pie (la paginación existente se reusa recién
   *  cuando todo lo cargado está a la vista). Ausente = todos. */
  visiblesIniciales?: number
  /** Tamaño de la tanda del "Ver más" (default 7). */
  tandaVerMas?: number
  /** S61-A11: ACORDEÓN inline — el detalle del nodo se despliega
   *  DEBAJO, jamás navega de una. null = este nodo no tiene acordeón
   *  (el tap cae a onPressNodo, contrato viejo intacto). El nodo se
   *  monta recién al expandir: el fetch perezoso es del caller. */
  detalleDe?: (item: LineaDeVidaItem) => ReactNode | null
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
  detalle,
  expandido,
  onToggle,
}: {
  item: LineaDeVidaItem
  conAgrupador: boolean
  esUltimo: boolean
  onPress?: (item: LineaDeVidaItem) => void
  /** S61-A11: acordeón — presente = el tap expande/contrae en lugar de navegar. */
  detalle?: ReactNode | null
  expandido?: boolean
  onToggle?: () => void
}) {
  const { theme } = useTheme()
  const { t, idioma } = useTraduccionUi()
  const voz = vozDe(item, t)
  const fecha = fechaHumana(item.fecha_evento, item.fecha_sola ?? false, t, idioma)
  // Memorial no tiene registro de capa: el punto degrada a text.secondary.
  const colorPunto = theme.mode === 'memorial' ? theme.text.secondary : theme.capa[voz.capa]
  const conAcordeon = detalle !== null && detalle !== undefined && onToggle !== undefined

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
      {/* S61-A11: el detalle se despliega DEBAJO — jamás navega de una */}
      {conAcordeon && expandido ? <View style={{ marginTop: spacing[3] }}>{detalle}</View> : null}
    </>
  )

  const tarjeta = conAcordeon ? (
    <Tarjeta
      interactiva
      onPress={onToggle}
      accessibilityRole="button"
      etiqueta={`${voz.titulo}, ${fecha}`}
    >
      {contenidoTarjeta}
    </Tarjeta>
  ) : onPress ? (
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

// LayoutAnimation en Android pide el flag viejo (no-op en Fabric/web).
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

export function LineaDeVida({
  items,
  cargando = false,
  onPressNodo,
  estadoPie = 'nada',
  onCargarMas,
  visiblesIniciales,
  tandaVerMas = 7,
  detalleDe,
}: LineaDeVidaProps) {
  const { theme } = useTheme()
  // Namespace `ui` (S51-B1a): la voz del pie migrada al riel. El
  // DICCIONARIO de arriba es voz emocional: migra con gate del founder
  // (deuda de extracción), no acá.
  const { t } = useTraduccionUi()
  // S61-A11: colapsada + acordeón. Motion legal (Ley 6): expandir y
  // "Ver más" con LayoutAnimation <300ms; memorial = reemplazo directo
  // (nada rebota, solo fades — y esto ni fade necesita).
  const [visibles, setVisibles] = useState(visiblesIniciales ?? Number.POSITIVE_INFINITY)
  const [expandidoId, setExpandidoId] = useState<string | null>(null)
  const esMemorial = theme.mode === 'memorial'

  const animar = () => {
    if (esMemorial) return
    LayoutAnimation.configureNext(LayoutAnimation.create(250, 'easeInEaseOut', 'opacity'))
  }

  if (cargando) {
    return (
      <EsqueletoGrupo etiqueta={t('lineaDeVida.cargando')}>
        <EsqueletoNodo />
        <EsqueletoNodo />
        <EsqueletoNodo />
      </EsqueletoGrupo>
    )
  }

  const enVista = items.slice(0, visibles)
  const hayOcultos = items.length > enVista.length

  return (
    <View accessibilityRole="list">
      {enVista.map((item, i) => {
        const detalle = detalleDe ? detalleDe(item) : null
        return (
          <Nodo
            key={item.evento_id}
            item={item}
            conAgrupador={
              i === 0 ||
              claveDiaItem(enVista[i - 1]) !== claveDiaItem(item)
            }
            esUltimo={i === enVista.length - 1 && estadoPie === 'nada' && !hayOcultos}
            onPress={onPressNodo}
            detalle={detalle}
            expandido={expandidoId === item.evento_id}
            onToggle={
              detalle !== null
                ? () => {
                    animar()
                    setExpandidoId((id) => (id === item.evento_id ? null : item.evento_id))
                  }
                : undefined
            }
          />
        )
      })}

      {/* S61-A11: lo YA cargado se revela por tandas; el pie de páginas
          nuevas recién aparece cuando todo lo cargado está a la vista. */}
      {hayOcultos ? (
        <View style={{ marginLeft: RIEL, marginTop: spacing[1] }}>
          <Boton
            variante="compacto"
            etiqueta={t('lineaDeVida.verMas')}
            onPress={() => {
              animar()
              setVisibles((v) => v + tandaVerMas)
            }}
          />
        </View>
      ) : null}

      {!hayOcultos && estadoPie !== 'nada' ? (
        <View style={{ marginLeft: RIEL, marginTop: spacing[1] }}>
          {estadoPie === 'error' ? (
            <View style={{ gap: spacing[2] }}>
              <Text style={{ fontFamily: typography.family.sans.regular, fontSize: typography.size.sm, color: theme.text.secondary }}>
                {t('lineaDeVida.errorCargarMas')}
              </Text>
              <Boton variante="secundario" tamaño="sm" etiqueta={t('lineaDeVida.reintentar')} onPress={onCargarMas} />
            </View>
          ) : (
            <Boton
              variante="ghost"
              tamaño="sm"
              etiqueta={t('lineaDeVida.cargarMas')}
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
