/**
 * RESPUESTA DE NEXO — lo que dijo, de dónde lo sacó, y qué se puede hacer
 * con eso (S113-B · 2.0 · B1).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **LA PRIMERA RESPUESTA NO PUEDE SALIR SIN DECIR QUE ES IA.**
 * ═══════════════════════════════════════════════════════════════════════════
 * No es un chequeo que alguien corre: **es una unión discriminada**. Con
 * `primera: true` la nota es OBLIGATORIA, y con `primera` ausente la nota es
 * `never`. *Una regla escrita en un comentario no frena a un compilador
 * (`L-396`); ésta sí.*
 *
 * La línea la trae la pantalla ya redactada —*«Soy Nexo. Puedo equivocarme;
 * para lo importante está tu vet.»*— porque la pieza no compone voz (Ley 3).
 *
 * ── 🔴 LA FUENTE ES UN ACTO, NO UNA ETIQUETA ────────────────────────────
 * *«de su carnet · 12 mar»* va debajo, chico, **y se toca**: lleva al dato del
 * que salió la frase. Por eso `fuente` exige `onPress` junto con su voz.
 * *Decir de dónde salió algo y no poder ir a mirarlo es pedir que se confíe
 * en la palabra del modelo, que es exactamente lo que la procedencia viene a
 * evitar.* Sin fuente no se dibuja nada: **una respuesta que no salió del
 * expediente no inventa una.**
 *
 * ── SIN «ESTÁ ESCRIBIENDO» (N13) ────────────────────────────────────────
 * El texto llega en vivo y **el que llegue ES la señal**. La pieza no dibuja
 * puntitos ni «pensando»: no tiene con qué saberlo, y *una actividad inventada
 * es una promesa sobre algo que no está pasando.* El latido lo cuenta
 * `CabeceraCoach` con los pulsos, que son frases reales.
 *
 * ⚠️ **Con texto vacío la burbuja NO se monta.** Antes del primer token no hay
 * nada que decir, y una burbuja vacía se lee como una respuesta en blanco.
 *
 * ── ⛔ MEMORIAL: NO SE DIBUJA ───────────────────────────────────────────
 * Igual que el resto de la familia del Coach (`MODELO_LOYALTY` §7.1).
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * El hilo de la Hoja de Nexo (C, lote 2.0). **Entregada y no montada.**
 */

import type { ReactNode } from 'react'
import { View } from 'react-native'

import { AccionQueLleva } from './AccionQueLleva'
import { Boton } from './Boton'
import { BurbujaMensaje } from './BurbujaMensaje'
import { Texto } from './Texto'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

/**
 * 🔴 **DE DÓNDE SALIÓ, Y CÓMO IR A VERLO.** Los dos campos juntos o ninguno:
 * la unión no admite la voz sin el destino.
 */
export interface FuenteDeRespuesta {
  /** *«de su carnet · 12 mar»* — ya compuesta (Ley 3). */
  voz: string
  /** Abre el dato. Lo decide la pantalla; la pieza no sabe a dónde va. */
  onPress: () => void
}

/**
 * 🔴 **LA PROPUESTA DE GUARDAR EXIGE SUS DOS SALIDAS.** No alcanza con poder
 * decir que sí: *si la única forma de sacar la pregunta de la pantalla es
 * darle la razón, dejó de ser una pregunta.*
 */
export interface PropuestaDeMemoria {
  /** *«¿Guardo que le tiene miedo a los truenos?»* — ya compuesta. */
  voz: string
  vozSi: string
  vozNo: string
  onGuardar: () => void
  onDescartar: () => void
}

type Comun = {
  /**
   * 🔴 LA SEÑAL REAL, OBLIGATORIA SIN DEFAULT: `estado_vida === 'fallecida'`,
   * resuelta por la pantalla contra el perfil que ya tiene cargado.
   *
   * ⏪ **El piso de esta pieza colgaba SÓLO de `theme.mode === 'memorial'`, y
   * ése es un interruptor que nadie aprieta** (`D-1021`: nadie monta
   * `<ThemeProvider memorial>` en ninguna de las dos apps). *La protección
   * estaba escrita, se leía como protección, y la app igual le pedía algo a
   * quien perdió a su animal.*
   *
   * **`perdida` NO es memorial** (firma del founder, 7-sep).
   */
  enMemorial: boolean

  /** Lo que dijo. **Vacío ⇒ no se monta** (ver la cabecera). */
  texto: string
  /** «14:32», ya redactada por el riel. */
  hora: string
  /** El nombre, tal cual. **Se dibuja, no se concatena.** */
  autor: string
  /** De dónde salió. Ausente = no salió del expediente y no se inventa. */
  fuente?: FuenteDeRespuesta
  /** Lo que Nexo quiere recordar, con su sí y su no. */
  propuesta?: PropuestaDeMemoria
  /** El semáforo sanitario y su acto, montados por la pantalla. **Es un SLOT
   *  y no una prop de datos**: lo que va ahí es `SemaforoSanitario`, que ya
   *  tiene sus tres estados y su ley de «falta sin camino no compila», y
   *  duplicar su contrato acá sería tener dos semáforos y un solo correcto. */
  franja?: ReactNode
  /** *«Ver a tu vet»* — **botón de la casa**, abre la telemedicina. Sin
   *  `onVerVet` no se dibuja: una salida sin destino no se ofrece. */
  onVerVet?: () => void
  vozVerVet?: string
}

/**
 * 🔴 La primera respuesta de la conversación **debe** declarar que es IA.
 * Las siguientes no pueden repetirlo: *decir «soy una IA» en cada frase deja
 * de informar y pasa a ser ruido que se aprende a saltear.*
 */
export type RespuestaNexoProps =
  | (Comun & { primera: true; notaIA: string })
  | (Comun & { primera?: false; notaIA?: never })

export function RespuestaNexo(props: RespuestaNexoProps) {
  const { theme } = useTheme()
  const { texto, hora, autor, fuente, propuesta, franja, onVerVet, vozVerVet } = props

  /* ⛔ El Coach no existe en memorial. */
    /* 🔴 **EL DATO MANDA, Y `theme.mode` SE CONSERVA EN EL `OR`** — misma cura
     que `LineaAlgoSalioDistinto`: la galería SÍ monta el sub-tema. *Lo que
     estaba mal no era mirar el tema: era mirar SÓLO el tema.* */
  if (props.enMemorial || theme.mode === 'memorial') return null

  /* 🔴 Sin texto no hay burbuja. Antes del primer token no hay nada que
     decir, y una burbuja vacía se lee como una respuesta en blanco. */
  if (texto.trim().length === 0) return null

  return (
    <View style={{ gap: spacing[2] }}>
      {/* La burbuja es la de la casa: **ajena** —viene de afuera— y por eso
          no tiene estado de envío. `BurbujaMensaje` ya lo hace inexpresable. */}
      <BurbujaMensaje mio={false} texto={texto} hora={hora} autor={autor} />

      {/* La nota de IA va DEBAJO de la primera frase y no arriba del hilo:
          *se lee cuando ya hay algo que calificar.* */}
      {props.primera === true ? <Texto variante="apoyo">{props.notaIA}</Texto> : null}

      {/* 🔴 **LA FUENTE ES `AccionQueLleva`, Y ESO LO DECIDIÓ EL EMULADOR.**
          ⏪ Acá había un `Pressable` con `Texto apoyo`: **el rol de enlace
          estaba, y el ojo no lo veía.** En la captura quedaba con la misma
          talla, el mismo color y el mismo peso que la nota de IA de arriba —
          *dos líneas grises seguidas, y una de las dos llevaba a algún lado.*
          Mi propia cabecera decía «la fuente es un ACTO, no una etiqueta» y
          los píxeles decían lo contrario.
          `AccionQueLleva` es la pieza que la casa ya tiene para esto —acción
          SUELTA que navega, con la forma nombrada de la Ley 19.7: texto +
          chevron + target 44— y su cabecera nombra justo este hueco. */}
      {fuente !== undefined ? (
        <AccionQueLleva etiqueta={fuente.voz} onPress={fuente.onPress} alineacion="inicio" />
      ) : null}

      {franja}

      {onVerVet !== undefined && vozVerVet !== undefined ? (
        <View style={{ alignItems: 'flex-start' }}>
          <Boton tamaño="sm" onPress={onVerVet} etiqueta={vozVerVet} />
        </View>
      ) : null}

      {propuesta !== undefined ? (
        <View style={{ gap: spacing[2] }}>
          <Texto variante="apoyo">{propuesta.voz}</Texto>
          {/* Las dos salidas al mismo nivel: decir que no cuesta lo mismo
              que decir que sí. */}
          <View style={{ flexDirection: 'row', gap: spacing[2] }}>
            <Boton tamaño="sm" onPress={propuesta.onGuardar} etiqueta={propuesta.vozSi} />
            <Boton variante="secundario" tamaño="sm" onPress={propuesta.onDescartar} etiqueta={propuesta.vozNo} />
          </View>
        </View>
      ) : null}
    </View>
  )
}
