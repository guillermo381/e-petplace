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
  /**
   * 🔴 LA SEÑAL REAL, OBLIGATORIA SIN DEFAULT: `estado_vida === 'fallecida'`,
   * resuelta por la pantalla contra el perfil que ya tiene cargado.
   *
   * ⏪ **El piso de esta pieza colgaba SÓLO de `theme.mode === 'memorial'`, y
   * ése es un interruptor que nadie aprieta.** Medido en `D-1021`: **nadie
   * monta `<ThemeProvider memorial>` en ninguna de las dos apps** — el único
   * provider vivo es el raíz, con `mode={light|dark}`. *La protección estaba
   * escrita, se leía como protección, y la app igual le pedía algo a quien
   * perdió a su animal.*
   *
   * **`perdida` NO es memorial** (firma del founder, 7-sep): la familia que
   * busca a su mascota conserva la app entera. Por eso la prop se llama por
   * lo que la letra nombra y no por el estado.
   *
   * *No es un default que se pueda omitir: un `false` por omisión sería
   * exactamente el guard apagado que esta prop viene a curar.*
   */
  enMemorial: boolean

  /** Qué clase de cosa es. Decide el tinte, **no la importancia**. */
  clase: ClaseHoy
  /**
   * 🔴 **TIENE QUE DECIR QUÉ ES.** *«Thor entra a senior en marzo»* — la
   * compone la pantalla, que es la única que sabe de qué está hablando.
   *
   * **Vacío o en blanco ⇒ la tarjeta NO SE DIBUJA.** No es validación de
   * formulario: es que *el «hoy» del perfil es el lugar más caro de la
   * pantalla, y una tarjeta genérica ahí —«Algo para mirar», «Tenés
   * novedades»— enseña que ese lugar no vale la pena mirarlo.* Un hueco
   * ausente no cuesta nada; un hueco lleno de nada cuesta el lugar.
   */
  titulo: string
  /** Una línea más, ya redactada. */
  detalle?: string
  /**
   * 🔴 **UN ACTO CON DESTINO, y los dos obligatorios.** `vozActo` en blanco
   * apaga la tarjeta igual que el título: *un botón sin nombre es un botón que
   * no se sabe a dónde va, y el que lo toca descubre a dónde iba después.*
   */
  onActo: () => void
  vozActo: string
}

export function TarjetaHoy({ enMemorial, clase, titulo, detalle, onActo, vozActo }: TarjetaHoyProps) {
  const { theme } = useTheme()

  /* ⛔ No hay un «hoy» que resolver. */
    /* 🔴 **EL DATO MANDA, Y `theme.mode` SE CONSERVA EN EL `OR`** — misma cura
     que `LineaAlgoSalioDistinto`: la galería SÍ monta el sub-tema y ahí el
     guard tiene que seguir valiendo. *Lo que estaba mal no era mirar el tema:
     era mirar SÓLO el tema.* */
  if (enMemorial || theme.mode === 'memorial') return null

  /* 🔴 **SIN TEXTO NO HAY TARJETA.** Ver la cabecera de `titulo`. Se mide
     `.trim()` y no `.length`, porque *un espacio no es un texto*: una plantilla
     a la que le faltó la variable devuelve `' '` con la misma cara que un
     título. */
  if (titulo.trim().length === 0 || vozActo.trim().length === 0) return null

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
