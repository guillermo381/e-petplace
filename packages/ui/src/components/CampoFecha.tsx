/**
 * CampoFecha — la fecha de nacimiento con precisión honesta
 * (S45-B3.2, onboarding dueño). Espec cerrada por arquitecto.
 *
 * ═══════════════════════════════════════════════════════════════════
 * Presentacional puro: la pantalla es dueña del valor. El valor es
 * { fecha, precision } — espejo EXACTO del vocabulario de la DB
 * (chk_mascotas_fecha_nacimiento_precision, migración S45-B4):
 *   día completo → 'exacta' · mes/año → 'aproximada' ·
 *   por etapa de vida → 'estimada'.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Se ve como Campo (label visible, borde 1.5 constante, slot de
 * mensaje reservado, NADA se anima al interactuar — la única
 * animación es el color del borde, receta Campo). Al tocar abre
 * Hoja con el selector.
 *
 * Selector JS PURO (L-134: cero módulos nativos nuevos, cero
 * librerías): listas desplazables propias de día (opcional) +
 * mes + año. Camino "No sé la fecha" → etapa de vida en voz
 * humana (cachorro/joven/adulto/mayor — jamás vocabulario del
 * modelo, Ley 3) → estima el año.
 *
 * La fecha mostrada va en DM Sans: es un dato de un ser vivo,
 * no de máquina (regla de voz).
 *
 * Memorial: la Hoja ya degrada sola; acá no hay nada que degradar
 * (sin tintes de capa, sin springs propios).
 *
 * A11y: el campo (button) anuncia valor Y precisión vía
 * accessibilityValue; las listas de la Hoja son radiogroups con
 * filas radio + checked.
 */

import { useRef, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import type { ScrollView as GHScrollView } from 'react-native-gesture-handler'
import Animated, { cubicBezier } from 'react-native-reanimated'

import { typography } from '../tokens/typography'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { motion } from '../tokens/motion'
import { opacity } from '../tokens/opacity'
import { useTheme } from '../ThemeProvider'
import { Hoja, HojaScroll } from './Hoja'
import { Boton } from './Boton'

// Misma receta visual que Campo (borde constante, alto táctil, slot).
const BORDE = 1.5
const ALTO = 48
const LINEA_MENSAJE = typography.size.sm * typography.leading.normal
const ALTO_LISTA = 200 // 5 filas de 40 — las listas scrollean adentro
const ALTO_FILA = 40   // FIJO: el centrado al abrir se calcula por índice

export type CampoFechaPrecision = 'exacta' | 'aproximada' | 'estimada'

export interface CampoFechaValor {
  /** ISO 'YYYY-MM-DD' (date de la DB). aproximada ancla al día 1;
   *  estimada al 1 de enero del año estimado. */
  fecha: string
  precision: CampoFechaPrecision
}

export interface CampoFechaProps {
  /** Obligatorio: label visible Y accessibilityLabel (patrón Campo). */
  label: string
  valor?: CampoFechaValor
  onChange: (valor: CampoFechaValor) => void
  /** Placeholder en voz humana. */
  placeholder?: string
  ayuda?: string
  error?: string
  deshabilitado?: boolean
  /** Título de la Hoja. */
  tituloHoja?: string
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

// Etapas en voz humana (Ley 3) → años estimados hacia atrás.
const ETAPAS = [
  { clave: 'cachorro', etiqueta: 'Cachorro', detalle: 'menos de 1 año', aniosAtras: 0 },
  { clave: 'joven', etiqueta: 'Joven', detalle: 'entre 1 y 3 años', aniosAtras: 2 },
  { clave: 'adulto', etiqueta: 'Adulto', detalle: 'entre 3 y 7 años', aniosAtras: 5 },
  { clave: 'mayor', etiqueta: 'Mayor', detalle: 'más de 7 años', aniosAtras: 9 },
] as const

const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const diasDelMes = (mes: number, anio: number) => new Date(anio, mes + 1, 0).getDate()

function formatear(valor: CampoFechaValor): string {
  const [a, m, d] = valor.fecha.split('-').map(Number)
  if (valor.precision === 'exacta') return `${d} de ${MESES[m - 1]} de ${a}`
  if (valor.precision === 'aproximada') return `${capitalizar(MESES[m - 1])} ${a} · aproximada`
  return `${a} · estimada`
}

// ── Lista desplazable propia (JS puro): columna radiogroup.
// HojaScroll: el scroll GANA sobre el swipe-to-close de la Hoja
// (patrón SM gesture-composition · block — fix del gate S45-B3.2).
// Abre CENTRADA en el valor seleccionado (fila fija → offset por índice).
function Lista<T extends string | number>({
  titulo,
  items,
  etiquetaDe,
  seleccionado,
  onSelect,
}: {
  titulo: string
  items: T[]
  etiquetaDe: (item: T) => string
  seleccionado: T | undefined
  onSelect: (item: T) => void
}) {
  const { theme } = useTheme()
  const scrollRef = useRef<GHScrollView>(null)

  const centrarEnSeleccion = () => {
    if (seleccionado === undefined) return
    const idx = items.indexOf(seleccionado)
    if (idx < 0) return
    const y = Math.max(0, idx * ALTO_FILA - (ALTO_LISTA - ALTO_FILA) / 2)
    scrollRef.current?.scrollTo({ y, animated: false })
  }

  return (
    <View style={{ flex: 1 }} accessibilityRole="radiogroup" accessibilityLabel={titulo}>
      <Text
        style={{
          fontFamily: typography.family.sans.medium,
          fontSize: typography.size.sm,
          color: theme.text.secondary,
          marginBottom: spacing[2],
        }}
      >
        {titulo}
      </Text>
      <View
        onLayout={centrarEnSeleccion}
        style={{
          height: ALTO_LISTA,
          borderRadius: radius.md,
          borderWidth: theme.border.width,
          borderColor: theme.border.subtle,
          overflow: 'hidden',
        }}
      >
        <HojaScroll ref={scrollRef}>
          {items.map((item) => {
            const activo = item === seleccionado
            return (
              <Pressable
                key={String(item)}
                onPress={() => onSelect(item)}
                accessibilityRole="radio"
                accessibilityState={{ checked: activo }}
                accessibilityLabel={etiquetaDe(item)}
                style={{
                  height: ALTO_FILA,
                  justifyContent: 'center',
                  paddingHorizontal: spacing[3],
                  backgroundColor: activo ? theme.bg.overlay : undefined,
                }}
              >
                <Text
                  style={{
                    fontFamily: activo ? typography.family.sans.medium : typography.family.sans.regular,
                    fontSize: typography.size.base,
                    color: activo ? theme.text.primary : theme.text.secondary,
                  }}
                >
                  {etiquetaDe(item)}
                </Text>
              </Pressable>
            )
          })}
        </HojaScroll>
      </View>
    </View>
  )
}

export function CampoFecha({
  label,
  valor,
  onChange,
  placeholder = '¿Cuándo nació?',
  ayuda,
  error,
  deshabilitado = false,
  tituloHoja = 'Fecha de nacimiento',
}: CampoFechaProps) {
  const { theme } = useTheme()
  const [abierta, setAbierta] = useState(false)
  const [modoEtapa, setModoEtapa] = useState(false)

  const hoy = new Date()
  const anioActual = hoy.getFullYear()

  // Estado local del selector — se siembra del valor al abrir.
  const [dia, setDia] = useState<number | undefined>(undefined)
  const [mes, setMes] = useState<number | undefined>(undefined)
  const [anio, setAnio] = useState<number | undefined>(undefined)

  const abrir = () => {
    if (deshabilitado) return
    if (valor) {
      const [a, m, d] = valor.fecha.split('-').map(Number)
      setAnio(a)
      setMes(valor.precision === 'estimada' ? undefined : m - 1)
      setDia(valor.precision === 'exacta' ? d : undefined)
    } else {
      setDia(undefined)
      setMes(undefined)
      setAnio(undefined)
    }
    setModoEtapa(false)
    setAbierta(true)
  }

  const confirmar = () => {
    if (mes === undefined || anio === undefined) return
    const conDia = dia !== undefined && dia <= diasDelMes(mes, anio)
    const dd = conDia ? dia : 1
    onChange({
      fecha: `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dd).padStart(2, '0')}`,
      precision: conDia ? 'exacta' : 'aproximada',
    })
    setAbierta(false)
  }

  const elegirEtapa = (aniosAtras: number) => {
    onChange({ fecha: `${anioActual - aniosAtras}-01-01`, precision: 'estimada' })
    setAbierta(false)
  }

  const accentActive = 'active' in theme.accent ? theme.accent.active : theme.accent.primary
  const colorBorde = error ? theme.status.danger : abierta ? accentActive : theme.bg.border
  const texto = valor ? formatear(valor) : placeholder
  const mensaje = error ?? ayuda

  const anios = Array.from({ length: 61 }, (_, i) => anioActual - i) // longevas (ave: 40-60 años)
  const dias = mes !== undefined && anio !== undefined
    ? Array.from({ length: diasDelMes(mes, anio) }, (_, i) => i + 1)
    : []

  return (
    <View style={{ opacity: deshabilitado ? opacity.disabled : 1 }}>
      <Text
        style={{
          fontFamily: typography.family.sans.medium,
          fontSize: typography.size.sm,
          color: theme.text.secondary,
          marginBottom: spacing[1.5],
        }}
      >
        {label}
      </Text>

      <Pressable
        onPress={abrir}
        disabled={deshabilitado}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={ayuda}
        accessibilityValue={{
          text: valor ? `${texto}, precisión ${valor.precision}` : placeholder,
        }}
      >
        <Animated.View
          style={{
            justifyContent: 'center',
            height: ALTO,
            borderRadius: radius.md,
            borderWidth: BORDE, // constante — el estado cambia color, no grosor
            borderColor: colorBorde,
            backgroundColor: theme.mode === 'light' ? theme.bg.card : theme.bg.elevated,
            paddingHorizontal: spacing[3],
            // única animación permitida: color del borde (receta Campo)
            transitionProperty: 'borderColor',
            transitionDuration: motion.duration.fast,
            transitionTimingFunction: cubicBezier(...motion.easing.easeOut.bezier),
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              fontFamily: typography.family.sans.regular, // ser vivo: DM Sans, jamás mono
              fontSize: typography.size.base,
              color: valor ? theme.text.primary : theme.text.tertiary,
            }}
          >
            {texto}
          </Text>
        </Animated.View>
      </Pressable>

      {/* Slot de altura RESERVADA (patrón Campo): nada empuja el layout */}
      <View style={{ minHeight: LINEA_MENSAJE + spacing[1], justifyContent: 'flex-end' }}>
        {mensaje ? (
          <Text
            accessibilityLiveRegion={error ? 'polite' : 'none'}
            style={{
              fontFamily: typography.family.sans.regular,
              fontSize: typography.size.sm,
              lineHeight: LINEA_MENSAJE,
              color: error ? theme.status.dangerText : theme.text.tertiary,
              marginTop: spacing[1],
            }}
          >
            {mensaje}
          </Text>
        ) : null}
      </View>

      <Hoja visible={abierta} onCerrar={() => setAbierta(false)} titulo={tituloHoja} altura="completa">
        {modoEtapa ? (
          <View accessibilityRole="radiogroup" accessibilityLabel="Etapa de vida" style={{ gap: spacing[2] }}>
            <Text
              style={{
                fontFamily: typography.family.sans.regular,
                fontSize: typography.size.base,
                color: theme.text.secondary,
                marginBottom: spacing[2],
              }}
            >
              Elegí la etapa que mejor lo describe y estimamos el año.
            </Text>
            {ETAPAS.map((etapa) => (
              <Pressable
                key={etapa.clave}
                onPress={() => elegirEtapa(etapa.aniosAtras)}
                accessibilityRole="radio"
                accessibilityState={{ checked: false }}
                accessibilityLabel={`${etapa.etiqueta}, ${etapa.detalle}`}
                style={{
                  minHeight: ALTO,
                  justifyContent: 'center',
                  paddingHorizontal: spacing[3],
                  borderRadius: radius.md,
                  borderWidth: theme.border.width,
                  borderColor: theme.border.subtle,
                }}
              >
                <Text
                  style={{
                    fontFamily: typography.family.sans.medium,
                    fontSize: typography.size.base,
                    color: theme.text.primary,
                  }}
                >
                  {etapa.etiqueta}
                  <Text
                    style={{
                      fontFamily: typography.family.sans.regular,
                      fontSize: typography.size.sm,
                      color: theme.text.secondary,
                    }}
                  >
                    {'  ·  '}{etapa.detalle}
                  </Text>
                </Text>
              </Pressable>
            ))}
            <View style={{ marginTop: spacing[2] }}>
              <Boton variante="ghost" etiqueta="Volver a la fecha" onPress={() => setModoEtapa(false)} />
            </View>
          </View>
        ) : (
          <View>
            <View style={{ flexDirection: 'row', gap: spacing[3] }}>
              <Lista
                titulo="Mes"
                items={MESES.map((_, i) => i)}
                etiquetaDe={(i) => capitalizar(MESES[i])}
                seleccionado={mes}
                onSelect={setMes}
              />
              <Lista
                titulo="Año"
                items={anios}
                etiquetaDe={(a) => String(a)}
                seleccionado={anio}
                onSelect={setAnio}
              />
              <Lista
                titulo="Día · opcional"
                items={dias}
                etiquetaDe={(d) => String(d)}
                seleccionado={dia}
                onSelect={(d) => setDia(dia === d ? undefined : d)}
              />
            </View>
            <View style={{ marginTop: spacing[4], gap: spacing[2] }}>
              <Boton
                etiqueta="Listo"
                bloque
                deshabilitado={mes === undefined || anio === undefined}
                onPress={confirmar}
              />
              <Boton variante="ghost" bloque etiqueta="No sé la fecha" onPress={() => setModoEtapa(true)} />
            </View>
          </View>
        )}
      </Hoja>
    </View>
  )
}
