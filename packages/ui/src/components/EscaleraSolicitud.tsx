/**
 * EscaleraSolicitud — LOS PASOS DE LA ADOPCIÓN, CON LA PIEZA DE DESPENSA
 * (S112-B, B1).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * *«Los pasos de la adopción se ven IGUAL que el seguimiento de un pedido de
 * la despensa.»* — la letra, §1. **Y por eso esto no es una escalera nueva:
 * es `EscaleraEstados` con los glifos y las voces de la adopción.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── ☠️ LÁPIDA DE `EstadoSolicitudAdopcion` (S111-B → retirada S112-B) ─────
 * Aquélla dibujaba **tres pasos, en magenta y con nodos sin glifo**. La letra
 * nombra las dos cosas como defecto: *«nada magenta, nada de bolas sueltas»*.
 * Se retira ENTERA en el mismo acto en que entra su reemplazo (Ley 37):
 * dejarla viva al lado sería `D-645` otra vez —*una promoción no es una
 * migración*— y nada la señalaría.
 *
 * 🔴 **LO QUE SOBREVIVE DE ELLA Y VIAJA ACÁ ENTERO**, porque no era el
 * defecto sino lo que estaba bien: los finales alternos **NO son etapas de
 * la fila** —reemplazan la línea y la fila queda como estaba al cerrarse—, y
 * **con el animal en memorial no se dibuja nada**, ni escalera ni línea,
 * *porque no se le dice dos veces la misma noticia*.
 *
 * ── 🔑 EL MAPEO PARA MIGRAR, para que nadie lo deduzca ───────────────────
 * Los siete estados de solicitud del motor caen así:
 * ```
 *   recibida                     → etapa 'enviada'
 *   en_conversacion              → etapa 'en_conversacion'
 *   aceptada                     → etapa 'aceptada'
 *   declinada                    → final 'declinada'      + la etapa alcanzada
 *   desistida                    → final 'desistida'      + la etapa alcanzada
 *   no_concretada_fallecimiento  → NO SE MONTA (memorial: ni escalera ni línea)
 *   no_concretada_otra_familia   → final 'no_concretada'  + la etapa alcanzada
 * ```
 * ⚠️ **Y las dos etapas nuevas —`acta_firmada` y `una_vida_nueva`— NO salen
 * del estado de la solicitud**: viven en la firma y en el traspaso. Ver la
 * nota de abajo.
 *
 * ── 🔴 LA ETAPA LA DICE LA PANTALLA, Y NO ES DELEGAR: ES QUE NO SE DEDUCE ─
 * El motor tiene **siete estados de SOLICITUD** y ninguno dice «acta
 * firmada» ni «una vida nueva» — eso vive en la firma y en el traspaso, que
 * son otras tablas. *Una pieza que derivara la etapa del estado de la
 * solicitud tendría que adivinar dos de las cinco*, y adivinaría mal el día
 * que alguien firme sin que la solicitud cambie.
 *
 * ⇒ recibe `etapa` y `final` por separado: **el camino y su interrupción son
 * dos hechos, y los dos existen a la vez** — una declinada tiene la fila
 * congelada donde estaba Y su etiqueta.
 *
 * ── LAS VOCES SON DE CADA ASIENTO ────────────────────────────────────────
 * La familia lee *«Estás en»*; el refugio, *«La solicitud está en»* (§1).
 * Entra entero por `vozEstado` — la pieza no arma la frase: **si la armara,
 * las dos casas dirían lo mismo con distinto sujeto y una de las dos sonaría
 * ajena.**
 *
 * ── COLAPSABLE, y el colapso automático NO vive acá ──────────────────────
 * Abierta muestra la fila y la línea; colapsada, sólo la línea. *«Se colapsa
 * sola cuando empiezo a escribir»* es un hecho **del campo**, que vive en la
 * pantalla: esta pieza no sabe que hay un teclado. Recibe `abierta` y avisa
 * `onAlternar` — el estado es de quien tiene los dos datos.
 *
 * ── LOS CINCO GLIFOS (§6b, firmados 2-sep) ───────────────────────────────
 * sobre · burbujas · checkEnCirculo · pluma · **`hogar`** — el quinto **no se
 * dibujó**: el censo de metáforas encontró que la casa con huella ya existe y
 * es el mismo significado. Ver la nota en el registry.
 *
 * 🔴 **Y ninguna etapa puede quedar sin glifo**: el mapa es un
 * `Record<EtapaSolicitud, IconoNombre>`, así que una etapa nueva **no
 * compila** hasta que alguien le elija uno. *Ése era el segundo rojo del
 * pedido, y se cierra en el tipo y no en la disciplina.*
 *
 * ⚠️ **La garantía es del MAPA, no del mecanismo, y conviene saberlo:**
 * `conIconos` acepta `Record<string, …>` y **devuelve el paso sin glifo si
 * falta** —es permisivo a propósito, para que un dominio adopte de a una
 * pantalla—. *Lo que impide la etapa muda acá es que MI mapa es cerrado.*
 *
 * ── EL MECANISMO ES EL DE DESPENSA, Y ESO ES «REUSAR LA PIEZA» ───────────
 * `conIconos` resuelve el tamaño dentro del nodo, el registro y el color que
 * manda el slot. **No se re-decide nada de eso acá** — si el nodo crece,
 * crece para las dos escaleras a la vez, que es el punto entero de que el
 * mecanismo viva arriba y cada dominio traiga su vocabulario.
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * Arriba del hilo, en las dos apps (C2). **Entregada y no montada.**
 */
import { Pressable, View } from 'react-native'
import { spacing } from '../tokens/spacing'
import { EscaleraEstados, type PasoEscalera } from './EscaleraEstados'
import { conIconos } from './EscaleraIconos'
import { type IconoNombre } from './Icono'
import { Texto } from './Texto'

/** El camino feliz, en su orden (§1). */
export type EtapaSolicitud =
  | 'enviada'
  | 'en_conversacion'
  | 'aceptada'
  | 'acta_firmada'
  | 'una_vida_nueva'

/** Los finales alternos. **No son etapas de la fila** (§1). */
export type FinalSolicitud = 'declinada' | 'desistida' | 'no_concretada'

const ORDEN: readonly EtapaSolicitud[] = [
  'enviada',
  'en_conversacion',
  'aceptada',
  'acta_firmada',
  'una_vida_nueva',
]

/**
 * 🔴 EL MAPA QUE HACE IMPOSIBLE UNA ETAPA SIN GLIFO. `Record` completo: si
 * mañana nace una etapa, este objeto no compila hasta que alguien le elija
 * uno — que es el momento en que hay que elegirlo.
 */
const GLIFO: Record<EtapaSolicitud, IconoNombre> = {
  enviada: 'sobre',
  en_conversacion: 'burbujas',
  aceptada: 'checkEnCirculo',
  acta_firmada: 'pluma',
  // El único que no se dibujó: ya existía y es el mismo significado.
  una_vida_nueva: 'hogar',
}

export type EscaleraSolicitudProps = {
  /** Dónde está HOY. La deriva la pantalla — ver la nota de la cabecera. */
  etapa: EtapaSolicitud
  /**
   * Si se cerró por otro camino. **Convive con `etapa`**: la fila queda
   * congelada donde estaba y esto reemplaza la línea de abajo.
   */
  final?: { tipo: FinalSolicitud; etiqueta: string }
  /** Las cinco palabras del camino, en voz de la casa que lee. */
  voces: Record<EtapaSolicitud, string>
  /**
   * La línea de abajo, ENTERA: «Estás en: En conversación» o «La solicitud
   * está en: En conversación». La arma la pantalla — ver la cabecera.
   * Ignorada cuando hay `final`: ahí manda su etiqueta.
   */
  vozEstado: string
  abierta: boolean
  onAlternar: () => void
  /** accessibilityLabel del toque que abre y cierra. */
  etiquetaAlternar: string
  /** `'control'` (cliente) · `'oficio'` (refugio). Ver `EscaleraEstados`. */
  acento?: 'control' | 'oficio'
}

export function EscaleraSolicitud({
  etapa,
  final,
  voces,
  vozEstado,
  abierta,
  onAlternar,
  etiquetaAlternar,
  acento,
}: EscaleraSolicitudProps) {
  const indiceActual = ORDEN.indexOf(etapa)

  const sinGlifos: PasoEscalera[] = ORDEN.map((clave, i) => ({
    clave,
    etiqueta: voces[clave],
    /* Con un final, la fila queda COMO ESTABA al cerrarse: lo alcanzado
       sigue hecho y lo que seguía queda pendiente. Nada se marca como
       cumplido por haberse cerrado — cerrarse no es avanzar. */
    estado:
      i < indiceActual
        ? 'hecho'
        : i === indiceActual
          ? final === undefined
            ? 'actual'
            : 'hecho'
          : 'pendiente',
  }))
  /* El mecanismo de despensa, con el vocabulario de adopción. */
  const pasos = conIconos(sinGlifos, GLIFO)

  return (
    <View style={{ gap: spacing[2] }}>
      {abierta ? <EscaleraEstados pasos={pasos} registro="completa" acento={acento} /> : null}

      {/* LA LÍNEA — es el toque que abre y cierra. Siempre visible: colapsada
          es lo único que queda, y abierta sigue diciendo dónde estoy sin que
          haya que leer cinco nodos. */}
      <Pressable
        onPress={onAlternar}
        accessibilityRole="button"
        accessibilityLabel={etiquetaAlternar}
        accessibilityState={{ expanded: abierta }}
        style={{ paddingVertical: spacing[2] }}
      >
        {/* Con final, la etiqueta de clase REEMPLAZA la línea (§1) — no se
            suma: decir «Estás en: Aceptada» debajo de «Declinada» sería
            contar dos historias del mismo hecho. */}
        <Texto variante="apoyo" color={final === undefined ? 'primary' : 'secondary'}>
          {final === undefined ? vozEstado : final.etiqueta}
        </Texto>
      </Pressable>
    </View>
  )
}
