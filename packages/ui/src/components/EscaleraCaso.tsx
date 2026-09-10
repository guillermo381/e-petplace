/**
 * EscaleraCaso — EN QUÉ PASO ESTOY, CON LA PIEZA DE LA DESPENSA (S114-B, B1).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * *«Es la misma escalera del pedido de la despensa… no aprendo nada nuevo.»*
 * — `DIRECCION_POSTVENTA` §3. **Y por eso esto NO es una escalera nueva: es
 * `EscaleraEstados` con los glifos y las voces del caso**, exactamente como
 * `EscaleraSolicitud` lo hizo para la adopción.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── LEY 11 · EL CENSO, Y DIO «NO CREAR» ─────────────────────────────────
 * Relevado antes de escribir (protocolo 1c, pregunta 2): el trabajo *«informar
 * el progreso de un proceso multi-paso»* **ya tiene su pieza canónica** desde
 * S96 y **ya tiene su segundo dominio** desde S112. Escribir una tercera
 * escalera sería el clon que la Ley 19 existe para cerrar. *La pregunta no era
 * cómo dibujarla: era qué vocabulario traer.*
 *
 * ── LOS CINCO GLIFOS (§3.1: «un glifo por etapa, sin texto adentro») ─────
 * ```
 *   Recibido ………………… sobre           (lo que contaste llegó)
 *   Con el prestador …… atender         (la puerta abierta: está de su lado)
 *   Con e-PetPlace …… ayuda           (el salvavidas: la casa entró)
 *   Resuelto ………………… checkEnCirculo  (alguien decidió)
 *   Cerrado …………………… candado         (la conversación quedó en lectura)
 * ```
 * **Cuatro de los cinco ya existían**; `candado` es el único que se dibujó, y
 * su censo de metáforas —por qué no `caso` y por qué no `nodoEntregado`— vive
 * en su entrada del registry, no acá.
 *
 * 🔴 **Y NINGUNA ETAPA PUEDE QUEDAR SIN GLIFO**: `GLIFO` es un
 * `Record<EtapaCaso, IconoNombre>`, así que **una etapa nueva no compila**
 * hasta que alguien le elija uno. *Ése es el primero de los dos rojos del
 * pedido, y se cierra en el tipo, no en la disciplina.*
 *
 * ⚠️ **Lo que el tipo NO cierra, y por eso hay guard:** una etapa puede
 * existir en la unión y en `GLIFO` **y faltar en `ORDEN`** — ahí compila
 * perfecto y **el paso desaparece de la escalera sin que nada falle**. `R72`
 * mide exactamente eso, y su rojo se probó antes de cablearlo.
 *
 * ── EL SEGUNDO ROJO: NINGÚN COLOR ENTRA POR PROP ─────────────────────────
 * *«Nada magenta, nada fuera de paleta»* (§3.1). Acá **no hay por dónde
 * meterlo**: la pieza no recibe un solo color. El único eje cromático es
 * `acento: 'control' | 'oficio'`, que `EscaleraEstados` resuelve contra el
 * TEMA —`accent.hito` en el cliente, `accent.primary` en el negocio—. *Un
 * color fuera de paleta no se prohíbe: se vuelve inexpresable.*
 *
 * ── LOS FINALES ALTERNOS NO SON ETAPAS ───────────────────────────────────
 * *«Resuelto entre ustedes» · «Lo retiraste» · «Sin lugar · 12 sep»*
 * **reemplazan la línea de abajo con una etiqueta de clase** (§3.1) y dejan
 * la fila congelada donde estaba. **Conviven con `etapa`: son dos hechos y
 * los dos existen a la vez.** Nada se marca como cumplido por haberse
 * cerrado — *cerrarse no es avanzar.*
 *
 * ── COLAPSABLE, Y EL COLAPSO AUTOMÁTICO NO VIVE ACÁ ─────────────────────
 * Abierta muestra la fila y la línea; colapsada, sólo la línea. *«Se colapsa
 * sola cuando empiezo a escribir»* es un hecho **del campo**: esta pieza no
 * sabe que hay un teclado. Recibe `abierta` y avisa `onAlternar` — el estado
 * es de quien tiene los dos datos. **Idéntico a adopción, a propósito.**
 *
 * ── «NACE EN RESUELTO» ES DE LA PANTALLA ────────────────────────────────
 * §3.1: *si el caso se resolvió solo (falla del prestador medida), la escalera
 * nace en Resuelto*. Eso es **pasar `etapa='resuelto'`** — la pieza no deriva
 * la etapa de nada, igual que en adopción: *una pieza que la dedujera
 * adivinaría mal el día que el motor cambie de forma.*
 *
 * ── MEMORIAL ─────────────────────────────────────────────────────────────
 * §1: con la mascota en memorial **no hay puerta**, así que no hay caso ni
 * escalera. Eso lo cierra `LineaAlgoSalioDistinto` en su origen; si aun así
 * se montara, el tema memorial baja el acento a tinta solo por el slot.
 *
 * ── LOS TRES TEMAS Y REDUCE-MOTION (N15) ─────────────────────────────────
 * Cero movimiento: el avance de un escalón es reemplazo directo (Ley 6) y no
 * hay nada que reducir.
 *
 * ── PUERTA ───────────────────────────────────────────────────────────────
 * Arriba del hilo del caso, en las dos apps. **Entregada y no montada.**
 */
import { Pressable, View } from 'react-native'
import { spacing } from '../tokens/spacing'
import { EscaleraEstados, type PasoEscalera } from './EscaleraEstados'
import { conIconos } from './EscaleraIconos'
import { type IconoNombre } from './Icono'
import { Texto } from './Texto'

/** El camino, en su orden (§3.1). */
export type EtapaCaso =
  | 'recibido'
  | 'con_prestador'
  | 'con_epetplace'
  | 'resuelto'
  | 'cerrado'

/**
 * Los finales alternos. **No son etapas de la fila** (§3.1): reemplazan la
 * línea de abajo con una etiqueta de clase.
 */
export type FinalCaso = 'resuelto_entre_ustedes' | 'retirado' | 'sin_lugar'

/**
 * 🔴 EL ORDEN — y `R72` lo mide contra la unión. El tipo garantiza que toda
 * etapa tenga glifo; **sólo un guard puede garantizar que toda etapa esté
 * ACÁ**, porque un array de un tipo compila con menos miembros que el tipo.
 */
export const ORDEN_CASO: readonly EtapaCaso[] = [
  'recibido',
  'con_prestador',
  'con_epetplace',
  'resuelto',
  'cerrado',
]

/**
 * 🔴 EL MAPA QUE HACE IMPOSIBLE UNA ETAPA SIN GLIFO. `Record` completo: si
 * mañana nace una etapa, este objeto no compila hasta que alguien le elija
 * uno — que es el momento en que hay que elegirlo.
 */
const GLIFO: Record<EtapaCaso, IconoNombre> = {
  recibido: 'sobre',
  con_prestador: 'atender',
  con_epetplace: 'ayuda',
  resuelto: 'checkEnCirculo',
  cerrado: 'candado',
}

export type EscaleraCasoProps = {
  /** Dónde está HOY. La deriva la pantalla — ver la nota de la cabecera. */
  etapa: EtapaCaso
  /**
   * Si se cerró por otro camino. **Convive con `etapa`**: la fila queda
   * congelada donde estaba y esto reemplaza la línea de abajo.
   */
  final?: { tipo: FinalCaso; etiqueta: string }
  /** Las cinco palabras del camino, en voz de la casa que lee (Ley 3). */
  voces: Record<EtapaCaso, string>
  /**
   * La línea de abajo, ENTERA: «Estás en: Con el paseador · responde antes
   * del jueves a las 14:00». La arma la pantalla — la familia y el prestador
   * no leen la misma frase, y una pieza que la compusiera obligaría a las dos
   * casas a decir lo mismo con distinto sujeto.
   * Ignorada cuando hay `final`: ahí manda su etiqueta.
   */
  vozEstado: string
  abierta: boolean
  onAlternar: () => void
  /** accessibilityLabel del toque que abre y cierra. */
  etiquetaAlternar: string
  /** `'control'` (familia) · `'oficio'` (negocio). Ver `EscaleraEstados`. */
  acento?: 'control' | 'oficio'
}

export function EscaleraCaso({
  etapa,
  final,
  voces,
  vozEstado,
  abierta,
  onAlternar,
  etiquetaAlternar,
  acento,
}: EscaleraCasoProps) {
  const indiceActual = ORDEN_CASO.indexOf(etapa)

  const sinGlifos: PasoEscalera[] = ORDEN_CASO.map((clave, i) => ({
    clave,
    etiqueta: voces[clave],
    /* Con un final, la fila queda COMO ESTABA al cerrarse: lo alcanzado
       sigue hecho y lo que seguía queda pendiente. */
    estado:
      i < indiceActual
        ? 'hecho'
        : i === indiceActual
          ? final === undefined
            ? 'actual'
            : 'hecho'
          : 'pendiente',
  }))

  /* El mecanismo de despensa, con el vocabulario del caso. `'delNodo'` y no
     el default: los cinco glifos de acá son de TRAZO y nacen con la anatomía
     canónica del registry, así que miden lo que el nodo diga. El default 12
     es el legado de los cuatro `nodo*` de despensa (ver su lápida). */
  const pasos = conIconos(sinGlifos, GLIFO, 'delNodo')

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
        {/* Con final, la etiqueta de clase REEMPLAZA la línea (§3.1) — no se
            suma: decir «Estás en: Resuelto» debajo de «Lo retiraste» sería
            contar dos historias del mismo hecho. */}
        <Texto variante="apoyo" color={final === undefined ? 'primary' : 'secondary'}>
          {final === undefined ? vozEstado : final.etiqueta}
        </Texto>
      </Pressable>
    </View>
  )
}
