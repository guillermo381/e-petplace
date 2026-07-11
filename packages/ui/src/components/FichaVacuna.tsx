/**
 * FichaVacuna — la ficha presentacional de UNA vacuna en la pantalla de
 * revisión del carnet (S47-B1.1, espec cerrada founder+arquitecto).
 *
 * ═══════════════════════════════════════════════════════════════════
 * QUÉ NO ES: no edita inline (la edición es una Hoja con Campo +
 * CampoFecha que abre LA PANTALLA — la ficha solo dispara onEditar);
 * no guarda ni llama wrappers. Presentacional pura: la pantalla es
 * dueña del estado (patrón SelectorAvatar/EvidenciaFoto).
 * ═══════════════════════════════════════════════════════════════════
 *
 * ESTADOS (derivados de los datos + prop):
 *   completa  — nombre y fecha presentes. Superficie neutra: "está bien"
 *               no pide atención. El tipo NO tiñe la ficha (decisión
 *               founder S48): los carnets reales no lo rotulan — tipo
 *               null es honesto y editable, no dudoso.
 *   dudosa    — SOLO fecha faltante (null honesto de la extracción).
 *               Tinte de capa cuidado (eje salud): PIDE completarse sin
 *               gritar, con voz humana ("No pudimos leer la fecha").
 *   rechazada — la RPC devolvió item_invalido con el índice de este
 *               ítem (prop `rechazada`): tinte danger, nada se pierde.
 *   pressed   — 0.99 de Tarjeta interactiva (tap = onEditar).
 *
 * REGISTROS DE VOZ: nombre de vacuna en DM Sans (lo escribió un humano
 * en un carnet); fechas y lote en mono minúsculas (voz de máquina).
 * Punto de capa cuidado en hex puro (registro gráfico) junto al nombre.
 * Memorial degrada solo (Ley 8): sin tinte, borde neutro, voces en
 * text.secondary (rechazada conserva dangerText — la honestidad no
 * degrada). Cambio de estado = reemplazo directo, sin animación de
 * entrada (Ley 6).
 */

import { Text, View } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'

import { typography } from '../tokens/typography'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { useTraduccionUi } from '../i18n'
import { fechaCortaMono } from '@epetplace/i18n'
import { Tarjeta, type TarjetaTinte } from './Tarjeta'
import { Boton } from './Boton'

export interface FichaVacunaProps {
  /** Nombre de la vacuna tal como está en el carnet — voz humana. */
  nombre: string
  /** null honesto de la extracción — NO tiñe la ficha (S48): se muestra
   *  si vino, y si no, la guía de la pantalla baja la expectativa. */
  tipoVacuna?: string | null
  /** YYYY-MM-DD; null honesto = "No pudimos leer la fecha". */
  fechaAplicada?: string | null
  /** YYYY-MM-DD; secundario: se muestra solo si vino. */
  fechaProxima?: string | null
  /** Secundarios: se muestran solo si la extracción los trajo. */
  veterinario?: string | null
  lote?: string | null
  /** La RPC devolvió item_invalido para ESTE ítem: se resalta, nada se pierde. */
  rechazada?: boolean
  /** Tap en la ficha — la pantalla abre su Hoja de edición. */
  onEditar: () => void
  /** "Esta no es" — la pantalla descarta el ítem. */
  onDescartar: () => void
}

// Fecha en voz de máquina: fechaCortaMono del riel (S53-B2c.1 —
// una sola función por idioma para TODOS los módulos).

// Ley 12: outline 1.75, remates redondeados, UN color por ícono.
function IconoAtencion({ color }: { color: string }) {
  const stroke = { stroke: color, strokeWidth: 1.75, strokeLinecap: 'round' as const, fill: 'none' as const }
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} {...stroke} />
      <Path d="M12 7.5v5.5" {...stroke} />
      <Path d="M12 16.4v.1" {...stroke} />
    </Svg>
  )
}

export function FichaVacuna({
  nombre,
  tipoVacuna,
  fechaAplicada,
  fechaProxima,
  veterinario,
  lote,
  rechazada = false,
  onEditar,
  onDescartar,
}: FichaVacunaProps) {
  const { theme } = useTheme()
  const { t, idioma } = useTraduccionUi()
  const esMemorial = theme.mode === 'memorial'

  // dudosa = SOLO fecha faltante (S48): tipo null = completa neutra.
  const faltaFecha = !fechaAplicada
  const dudosa = !rechazada && faltaFecha

  // Memorial degrada solo: sin tinte, borde neutro (Tarjeta 'ninguno').
  const tinte: TarjetaTinte = esMemorial ? 'ninguno' : rechazada ? 'danger' : dudosa ? 'cuidado' : 'ninguno'

  // Voz humana del estado (la ficha lo DICE, no lo insinúa con color solo).
  const vozEstado = rechazada
    ? 'Esta no se pudo guardar. Tocala para revisarla.'
    : faltaFecha
      ? 'No pudimos leer la fecha'
      : null

  // Texto AA sobre el tinte (regla de dos registros; memorial sin capaText).
  const colorVozEstado = rechazada
    ? theme.status.dangerText
    : esMemorial || !('capaText' in theme)
      ? theme.text.secondary
      : theme.capaText.cuidado

  // Punto de capa (registro gráfico, hex puro; memorial trae su capa degradada).
  const puntoCapa = theme.capa.cuidado

  const fechas = [
    fechaAplicada ? `${t('fichaVacuna.aplicada')} ${fechaCortaMono(fechaAplicada, idioma)}` : null,
    fechaProxima ? `${t('fichaVacuna.proxima')} ${fechaCortaMono(fechaProxima, idioma)}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const a11y = [
    `${nombre}, ${t('fichaVacuna.vacunaDelCarnet')}`,
    tipoVacuna ?? null,
    fechaAplicada ? `${t('fichaVacuna.aplicada')} ${fechaCortaMono(fechaAplicada, idioma)}` : null,
    vozEstado,
    t('fichaVacuna.tocaParaEditar'),
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <Tarjeta
      interactiva
      onPress={onEditar}
      accessibilityRole="button"
      etiqueta={a11y}
      tinte={tinte}
      relleno="amplio"
    >
      <View style={{ gap: spacing[2] }}>
        {/* nombre — un humano lo escribió en un carnet: DM Sans */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: puntoCapa }} />
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              fontFamily: typography.family.sans.medium,
              fontSize: typography.size.md,
              color: theme.text.primary,
            }}
          >
            {nombre}
          </Text>
        </View>

        {/* tipo + veterinario — voz humana secundaria */}
        {(tipoVacuna || veterinario) && (
          <Text
            numberOfLines={1}
            style={{
              fontFamily: typography.family.sans.regular,
              fontSize: typography.size.sm,
              color: theme.text.secondary,
            }}
          >
            {[tipoVacuna, veterinario].filter(Boolean).join(' · ')}
          </Text>
        )}

        {/* fechas + lote — voz de máquina: mono minúsculas */}
        {(fechas.length > 0 || lote) && (
          <Text
            numberOfLines={1}
            style={{
              fontFamily: typography.family.mono.regular,
              fontSize: typography.size.xs,
              letterSpacing: typography.tracking.mono,
              color: theme.text.secondary,
            }}
          >
            {[fechas.length > 0 ? fechas : null, lote ? `lote ${lote.toLowerCase()}` : null]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        )}

        {/* estado con voz humana + "Esta no es" */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[2] }}>
          {vozEstado ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1], flexShrink: 1 }}>
              <IconoAtencion color={colorVozEstado} />
              <Text
                style={{
                  flexShrink: 1,
                  fontFamily: typography.family.sans.medium,
                  fontSize: typography.size.sm,
                  color: colorVozEstado,
                }}
              >
                {vozEstado}
              </Text>
            </View>
          ) : (
            <View />
          )}
          <Boton variante="ghost" tamaño="sm" etiqueta="Esta no es" onPress={onDescartar} />
        </View>
      </View>
    </Tarjeta>
  )
}
