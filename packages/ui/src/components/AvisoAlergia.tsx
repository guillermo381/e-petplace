/**
 * AvisoAlergia — LA ALERGIA ADVIERTE, NO ESCONDE.
 *
 * `LETRA_RECORRIDO_DESPENSA_S96` §5.4, que es enmienda firmada a
 * `MODELO_DESPENSA` §6 y §10: **exclusión dura en la RECOMENDACIÓN,
 * advertencia dura en la BÚSQUEDA.** La app jamás sugiere pollo para
 * Thor; si el dueño lo busca y lo encuentra, *se lo dice y lo deja
 * decidir*.
 *
 * El porqué, del founder, y es lo que esta pieza tiene que hacer sentir:
 * *"esconder es invisible, y lo invisible no demuestra nada. Un producto
 * que desaparece sin explicación deja al dueño sin entender. Un producto
 * que advierte **es la app demostrando que conoce a Thor**"* — el
 * diferencial hecho pantalla en vez de hecho filtro.
 *
 * ── LOS DOS CANDADOS DE LA LETRA, HECHOS TIPO ──────────────────────────
 *
 * ① **JAMÁS SILENCIO.** `modo` es obligatorio y su unión está cerrada en
 *    DOS: `contiene` (lo sabemos y lo tiene) y `sinComposicion` (no
 *    tenemos los ingredientes). **No existe una tercera opción**, y ésa
 *    es toda la idea: una pantalla que no sabe no puede callar — tiene
 *    que decir que no sabe. La letra es explícita en por qué:
 *    *"el silencio se lee como «no tiene pollo», y esa lectura la hace el
 *    dueño, no nosotros."*
 *
 * ② **LA ADVERTENCIA NO SE APAGA POR UNA PROMOCIÓN.** Esta pieza no
 *    tiene prop para ocultarse ni para bajar de tono: el motor de alertas
 *    manda sobre el de beneficios, siempre. Quien la monte no tiene por
 *    dónde silenciarla.
 *
 * ── EL PASO EXPLÍCITO ──────────────────────────────────────────────────
 * *"Con un paso explícito de entendimiento que queda registrado"*. El
 * componente **no registra nada**: avisa con `onEntendido` y la pantalla
 * escribe. Presentacional puro — un componente que persiste es un
 * componente que va a persistir distinto en cada casa.
 *
 * ── POR QUÉ EL «NO SABEMOS» NO SE PINTA COMO ALARMA ────────────────────
 * `contiene` va en el registro de warning; `sinComposicion` va en
 * superficie neutra. **Son dos hechos distintos y pintarlos igual es
 * mentir en el tono**: uno dice *"esto le hace mal a Thor"* y el otro
 * *"no lo sabemos"*. Igualar los dos entrena a ignorar el primero, que es
 * exactamente lo que §8.2 dice de los avisos (*avisar todo enseña a
 * ignorar los avisos*).
 *
 * TINTE, JAMÁS FILL (R20: la familia alerta no se rellena).
 *
 * ── CANDIDATO A SEGUNDO CONSUMIDOR, declarado y NO construido ──────────
 * §5.5 (*"tu veterinario recomendó X para Thor, y estás eligiendo
 * otro"*) tiene la MISMA anatomía: advertencia + paso explícito. **El día
 * que llegue se ENSANCHA esta pieza con su voz, jamás se clona** (§6 del
 * método). No se construye hoy porque su candado es distinto —si el vet
 * no registró la recomendación, la app *no la menciona*: ahí el caso es
 * NO MONTAR NADA, y eso no necesita componente.
 */

import { View } from 'react-native'

import { Boton } from './Boton'
import { Texto } from './Texto'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

export type ModoAvisoAlergia =
  /** El producto declara su composición y CONTIENE el alérgeno. */
  | 'contiene'
  /** No tenemos los ingredientes. Se dice — jamás se calla (candado ①). */
  | 'sinComposicion'

export type AvisoAlergiaProps = {
  modo: ModoAvisoAlergia
  /**
   * LA VOZ DE LA CASA, con el nombre de la mascota y el del alérgeno:
   * *"Thor es alérgico al pollo y este alimento lo contiene."* La compone
   * la pantalla — acá no se arma ninguna frase sobre una mascota.
   */
  mensaje: string
  detalle?: string
  /**
   * El paso explícito ya ocurrió. Con `true` el control desaparece: la
   * decisión ya se tomó y volver a pedirla sería un muro, no un aviso.
   */
  entendido?: boolean
  /** Ausente = el aviso INFORMA y no pide nada (el caso `sinComposicion`). */
  onEntendido?: () => void
  /** La voz del control y de su confirmación. */
  etiquetaEntendido?: string
  etiquetaYaEntendido?: string
}

export function AvisoAlergia({
  modo,
  mensaje,
  detalle,
  entendido = false,
  onEntendido,
  etiquetaEntendido,
  etiquetaYaEntendido,
}: AvisoAlergiaProps) {
  const { theme } = useTheme()
  const alerta = modo === 'contiene'

  return (
    <View
      accessible
      accessibilityRole="alert"
      style={{
        gap: spacing[2],
        padding: spacing[4],
        borderRadius: radius.suave,
        // Tinte + borde, jamás fill (R20). El `sinComposicion` NO usa el
        // registro de alerta: ver el porqué en el encabezado.
        backgroundColor: alerta ? theme.status.warningBg : theme.bg.overlay,
        borderWidth: theme.border.width,
        borderColor: alerta ? theme.status.warningBorder : theme.border.default,
      }}
    >
      <Texto variante="cuerpo" color={alerta ? 'warning' : 'secondary'}>
        {mensaje}
      </Texto>
      {detalle === undefined ? null : <Texto variante="apoyo">{detalle}</Texto>}

      {onEntendido === undefined || etiquetaEntendido === undefined ? null : entendido ? (
        etiquetaYaEntendido === undefined ? null : (
          <Texto variante="apoyo">{etiquetaYaEntendido}</Texto>
        )
      ) : (
        <View style={{ alignSelf: 'flex-start', paddingTop: spacing[1] }}>
          <Boton variante="compacto" onPress={onEntendido} etiqueta={etiquetaEntendido} />
        </View>
      )}
    </View>
  )
}
