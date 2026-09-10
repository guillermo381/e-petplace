/**
 * FilaBandejaCaso — UN CASO EN LA BANDEJA, EN CUATRO DATOS (S114-B, B6).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * *«Cada fila me dice **de qué servicio hablan, quién, por qué, y cuánto me
 * queda para responder**.»* — `DIRECCION_POSTVENTA` §5. Son cuatro y son los
 * cuatro que la letra nombra: ni uno menos, ni uno de adorno.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── LEY 11 · EL CENSO, Y POR QUÉ NO ES NINGUNA DE LAS TRES CERCANAS ─────
 * Relevado antes de crear (protocolo 1c, pregunta 2):
 * · **`CeldaNavegacion`** (19.1) es glifo + título + UN detalle + chevron.
 *   Acá hay **cuatro datos y una cara**: meterlos en su `detalle` sería
 *   volver una línea de apoyo en un párrafo.
 * · **`FilaCita`** es la fila de la jornada y lleva **su canto de capa por
 *   OFICIO** adentro. Un caso **no tiene oficio**: hablar de un paseo no lo
 *   convierte en un paseo, y pintarlo con la capa del paseo diría que la
 *   bandeja de casos es una agenda.
 * · **`TarjetaPedido`** es del recorrido de la despensa y trae su escalera.
 *
 * ── LA CARA ES DEL SUJETO, NO DE LA CONTRAPARTE ─────────────────────────
 * En la bandeja del prestador la contraparte es una FAMILIA, y una familia no
 * tiene cara. **La cara que se dibuja es la de la mascota** —el sujeto del
 * servicio del que se habla— y la contraparte se dice con su nombre. *Poner
 * un monograma de la familia donde va la mascota cambiaría de qué habla la
 * fila.*
 *
 * ── EL RELOJ NO ES ROJO Y NO LATE ───────────────────────────────────────
 * Misma doctrina que `BannerPlazo` (§5: *«el reloj se ve, y no es rojo»*):
 * llega **redactado**, va en color terciario y **tabular**, para que al bajar
 * de 14 a 13 la fila no tiemble. **Acá no hay ningún reloj corriendo.**
 *
 * ── 🔴 MEMOIZADA, Y SU COMPARADOR VIVE APARTE PARA PODER MEDIRSE ────────
 * Una bandeja se refresca sola; sin memo, cada sondeo redibuja todas las
 * filas. El comparador es `mismoCaso` y **vive en su propio módulo** —
 * `mismo-caso.ts`— por la misma razón que `mismaFila`: un gate no puede
 * cargar un archivo que importa `react-native`, así que la decisión se saca
 * afuera y **se mide la función real, jamás una copia**.
 *
 * ⚠️ **Compara DOS cosas y no una**, y el porqué está escrito en ese módulo:
 * acá el `onPress` es por fila y puede cambiar. *La cura de la pieza es
 * necesaria y no suficiente — la tercera pata es cómo la pantalla arma su
 * array.*
 *
 * ── LOS TRES TEMAS Y REDUCE-MOTION (N15) ────────────────────────────────
 * Cero movimiento propio. La presión física es la primitiva `usePresionado`
 * que `Tarjeta` ya lleva adentro — no se clona.
 *
 * ── PUERTA ──────────────────────────────────────────────────────────────
 * La lista de Casos en lo administrativo de Negocios (§5), y la bandeja de la
 * familia. **Entregada y no montada.**
 */
import { memo } from 'react'
import { View } from 'react-native'
import { spacing } from '../tokens/spacing'
import { AvatarMascota } from './AvatarMascota'
import { Chevron } from './chevron'
import { mismoCaso } from './mismo-caso'
import { Tarjeta } from './Tarjeta'
import { Texto } from './Texto'

export type CasoEnBandeja = {
  /** Identidad estable. Jamás se muestra. */
  clave: string
  /** DE QUÉ SERVICIO: «Paseo de Thor · martes 9». Ya redactado (Ley 3). */
  objeto: string
  /** QUIÉN: «La familia de Thor» · «Paseos Andrés». */
  contraparte: string
  /** POR QUÉ: el motivo, en la voz del catálogo. */
  motivo: string
  /**
   * CUÁNTO QUEDA: «Te quedan 14 horas». Ya redactado y **sin reloj vivo**.
   * Ausente cuando el caso ya no espera nada mío — y entonces no se dibuja:
   * una línea vacía donde iba un plazo se lee como «sin plazo», que es otra
   * cosa.
   */
  reloj?: string
  /** La cara de la mascota. Sin ella, su huella digna. */
  fotoUrl?: string | null
  /** El avatar de la casa por raza o especie, ya resuelto. */
  fotoDeEspecie?: string | null
  /** El nombre para la cara. Ausente = la huella sin iniciales. */
  nombreMascota?: string
}

export type FilaBandejaCasoProps = {
  caso: CasoEnBandeja
  onPress: () => void
}

function FilaBandejaCasoBase({ caso, onPress }: FilaBandejaCasoProps) {
  return (
    <Tarjeta
      interactiva
      onPress={onPress}
      accessibilityRole="button"
      /* El label junta los cuatro datos en el orden en que se leen: quien no
         ve la fila necesita la misma información, no un «caso» pelado. */
      etiqueta={[caso.objeto, caso.contraparte, caso.motivo, caso.reloj]
        .filter((x): x is string => x !== undefined)
        .join('. ')}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
        <AvatarMascota
          nombre={caso.nombreMascota ?? caso.objeto}
          fotoUrl={caso.fotoUrl ?? undefined}
          fotoDeEspecie={caso.fotoDeEspecie ?? undefined}
          tamano="sm"
        />

        <View style={{ flex: 1, gap: spacing[0.5] }}>
          <Texto variante="enfasis" numberOfLines={1}>
            {caso.objeto}
          </Texto>
          <Texto variante="apoyo" numberOfLines={1}>
            {caso.contraparte}
          </Texto>
          {/* EL MOTIVO en dos líneas como techo: es la frase larga de la fila
              y truncarla a una deja «El paseo duró menos de lo…», que es
              justo el dato por el que alguien abre el caso. */}
          <Texto variante="cuerpo" numberOfLines={2}>
            {caso.motivo}
          </Texto>
          {/* 🔴 `secondary` y NO `tertiary`: la casa declara `text.tertiary`
              como **placeholder/decorativo, jamás texto funcional**, y el
              número medido lo respalda — 2,40:1 sobre tarjeta clara, debajo
              hasta del piso no-textual. *Un plazo no es decoración: es el
              dato por el que alguien abre la fila.* */}
          {caso.reloj === undefined ? null : (
            <Texto variante="apoyo" tabular>
              {caso.reloj}
            </Texto>
          )}
        </View>

        <Chevron direccion="derecha" />
      </View>
    </Tarjeta>
  )
}

/**
 * 🔴 `memo` con `mismoCaso` — ver la nota de la cabecera y el módulo del
 * comparador. La bandeja se refresca sola; sin esto, cada sondeo redibuja
 * todas las filas.
 */
export const FilaBandejaCaso = memo(FilaBandejaCasoBase, mismoCaso)
