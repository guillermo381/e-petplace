/**
 * HOY — una sola cosa, con su acto (S113-B · 2.2).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **NUNCA DOS, Y NO PORQUE ENTREN DOS: PORQUE ENTRA UNA DECISIÓN.**
 * ═══════════════════════════════════════════════════════════════════════════
 * El encargo lo dice literal —*«nunca dos»*— y la razón es de comportamiento:
 * *una lista de dos es la forma más rápida de que no se haga ninguna.* La
 * pieza recibe **un candidato ya elegido**, no una lista: quien elige es
 * `elDeHoy`, y su criterio está escrito y se puede discutir en un solo lugar.
 *
 * ⚠️ **Y por eso el tipo no admite un arreglo.** Si aceptara varios, el día
 * que dos parezcan importantes alguien iba a dibujar los dos «por esta vez».
 *
 * ── EL ORDEN NO ES DE IMPORTANCIA, ES DE QUÉ SE PUEDE HACER HOY ─────────
 * Lo que se adelanta y todavía se puede evitar · lo que ya está agendado · lo
 * que vence. *Un vencimiento es urgente pero ya no se puede prevenir; una
 * anticipación todavía sí.* Vive en `tablero-metrica.ts` con su gate.
 *
 * ── EL ACTO ES OBLIGATORIO ──────────────────────────────────────────────
 * *Una tarjeta que dice qué pasa hoy y no ofrece qué hacer es un recordatorio,
 * y los recordatorios se aprenden a ignorar.*
 *
 * ── ⛔ MEMORIAL: NO SE DIBUJA ───────────────────────────────────────────
 * No hay un «hoy» que resolver. (`MODELO_LOYALTY` §7.1.)
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * El tablero del perfil (C). **Entregada y no montada** — medido.
 */

import { View } from 'react-native'

import { Boton } from './Boton'
import { OrbeCoach } from './OrbeCoach'
import { Texto } from './Texto'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import type { ClaseHoy } from './tablero-metrica'

const ORBE = 28

export type { ClaseHoy } from './tablero-metrica'
export { elDeHoy } from './tablero-metrica'

export interface TarjetaHoyProps {
  /** Qué clase de cosa es. Decide el tinte, **no la importancia**. */
  clase: ClaseHoy
  /** *«Thor entra a senior en marzo»* — ya redactada. */
  titulo: string
  /** Una línea más, ya redactada. */
  detalle?: string
  /** 🔴 **Obligatorios.** Ver la cabecera. */
  onActo: () => void
  vozActo: string
}

export function TarjetaHoy({ clase, titulo, detalle, onActo, vozActo }: TarjetaHoyProps) {
  const { theme } = useTheme()

  /* ⛔ No hay un «hoy» que resolver. */
  if (theme.mode === 'memorial') return null

  /* 🔴 TINTE, NUNCA RELLENO DE ALARMA (`R20`). Lo que se adelanta y lo que
     vence llevan el ocre; una cita no lleva nada — *pintar de atención algo
     que ya está resuelto enseña a ignorar el color.* */
  const borde = clase === 'cita' ? theme.border.subtle : theme.status.warningText

  /* 🔴 **EL COLOR DEL ORBE DICE DE QUIÉN ES LA VOZ.** Violeta cuando habla
     Nexo —es su color y de nadie más— y el de atención cuando lo que habla es
     el calendario. *Un orbe violeta sobre una cita diría que la cita se la
     inventó la IA.* */
  const colorOrbe = clase === 'anticipacion' ? undefined : theme.status.warningText

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        padding: spacing[4],
        borderRadius: radius.lg,
        backgroundColor: theme.bg.card,
        borderWidth: theme.border.width,
        borderColor: borde,
      }}
    >
      {/* 🔴 **EL ORBE VA EN UNA CAJA DE TAMAÑO FIJO, y lo dijo el emulador.**
          `OrbeCoach` dibuja sus capas en `position:'absolute'`: sin caja
          colapsa a 0 en el flujo y **se dibuja encima del texto de al lado**.
          En `FilaAcciones` no pasa porque ahí vive dentro de un disco de 48.
          *Una pieza que no ocupa lugar propio no se nota rota hasta que tiene
          un vecino.* */}
      <View style={{ width: ORBE, height: ORBE }}>
        <OrbeCoach tamano={ORBE} encendido={1} color={colorOrbe} />
      </View>
      <View style={{ flex: 1, gap: spacing[0.5] }}>
        {/* La frase con el acto adentro: la pantalla la compone y la pieza no
            la parte. *Partirla obligaría a la pieza a saber cuál es el verbo.* */}
        <Texto>{titulo}</Texto>
        {detalle !== undefined ? <Texto variante="apoyo">{detalle}</Texto> : null}
      </View>
      {/* El CTA a la derecha, en la misma línea: *debajo, la tarjeta se lee
          como un bloque de texto con un botón de propina.* */}
      <Boton variante="secundario" tamaño="sm" etiqueta={vozActo} onPress={onActo} />
    </View>
  )
}
