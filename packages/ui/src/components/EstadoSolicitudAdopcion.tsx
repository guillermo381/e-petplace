/**
 * EstadoSolicitudAdopcion — EN QUÉ ANDA MI SOLICITUD (S111-B).
 *
 * `LETRA_ADOPCION` §5, literal: *«La conversación vive en la app, con estados:
 * recibida · en conversación · aceptada · declinada.»*
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 **`declinada` NO ES EL ÚLTIMO ESCALÓN: ES UN DESVÍO.**
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Pintarla como «paso 4 de 4» afirma que la adopción llegó a su final, y es
 * falso: **la interrumpió.** Es la decisión ① de `EscaleraEstados` —*el desvío
 * no es un escalón*— aplicada al caso donde más caro sale, porque acá el
 * lector es la familia que quería a ese animal.
 *
 * **Y por eso esta pieza existe en vez de que cada pantalla componga la
 * escalera a mano:** el mapeo estado→forma vive ADENTRO. Una pantalla que
 * armara los pasos por su cuenta podría pasar `declinada` como paso `hecho`,
 * y compilaría perfecto. *Es el mismo movimiento que `FilaCita` con su canto:
 * la ley adentro, sin API para romperla.*
 *
 * ── LA DECLINADA DIGNA (§5, §10.6) ────────────────────────────────────────
 * `tono: 'neutro'`, jamás `'alerta'`. **Un «no» del refugio no es un error del
 * sistema ni una falta de la familia**, y §10.6 lo dice como límite duro: *la
 * devolución jamás humilla — ni al adoptante ni al animal.* La misma vara vale
 * para la solicitud que no prosperó. El ámbar de alerta acá acusaría a alguien.
 *
 * ── ⚠️ LA BANDA QUE HOY NO SE PUEDE PINTAR, Y POR QUÉ SE MONTA IGUAL ──────
 * **`en_conversacion` es INALCANZABLE al escribir esto**, y no por un pendiente
 * de esta pieza: **no existe mensajería entre dos cuentas** —medido por la
 * pista E de S111: 0 wrappers de 110, 0 rutas de 174— y `PORTAL_PRESTADOR`
 * §6.4.7 la excluye por diseño (*«sin servicio activo, no hay canal»*);
 * refugio y adoptante no comparten cita. Qué activa el canal para una solicitud
 * de adopción **está estacionado esperando firma**.
 *
 * ⇒ Se monta igual **porque está firmada en §5 y recortar la letra no es de
 * esta pieza**. Pero se declara acá, porque *una banda que nunca se pinta no se
 * distingue de una que todavía no le tocó*: sin esta nota, la próxima pista lee
 * cuatro estados montados y concluye que el ciclo está completo.
 *
 * **Los otros tres NO dependen del canal:** una solicitud se recibe, se acepta
 * y se declina aunque nadie escriba un mensaje. Y `recibida` es justamente el
 * que alimenta el contador del Home del publicador (§9) — *el único número que
 * tiene que poder llegar a cero.*
 *
 * ── CERO DICCIONARIO ADENTRO (precedente `EscaleraEstados`) ───────────────
 * Las palabras llegan por prop, y la razón es la de siempre y acá pesa doble:
 * **el refugio y la familia leen el mismo hecho con voces distintas** — el
 * publicador ve *«Declinada»* y la familia *«El refugio eligió otro hogar»*.
 * Una voz no se deduplica.
 *
 * Reusa `EscaleraEstados` — cero escalera nueva. Sin animación (Ley 6/13).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ⏩ ENMIENDA S112-B — LOS DOS CORTES QUE FALTABAN, Y UNO NO SE DIBUJA IGUAL
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * El motor creció y el tipo lo cazó donde tenía que cazarlo: el valor quedó
 * más ancho que la unión y `TS2322` saltó **en el sitio de llamada**, que es
 * donde alguien tiene que decidir cómo se ve cada estado nuevo.
 *
 * ── ① `desistida` — LA FAMILIA SE BAJÓ ───────────────────────────────────
 * **No es `declinada`, y reusarla habría dicho algo falso:** declinar es un
 * acto del PUBLICADOR. Con el mapeo fácil, el refugio leería *«yo la
 * decliné»* sobre alguien que se fue solo. Estructuralmente es el mismo
 * desvío —el camino se interrumpe y no se completa— así que comparte la
 * forma y cambia la voz. `tono: 'neutro'`: nadie falló.
 *
 * ── ③ `no_concretada_otra_familia` — TAMPOCO, Y POR OTRA RAZÓN ───────────
 * El animal encontró familia y no fue la tuya; el motor cierra las demás
 * solicitudes solo. **C lo leyó como desvío —hubo proceso y se interrumpió—
 * y es la lectura razonable; no es la que rige, y el porqué importa:**
 *
 * *La escalera lleva a `aceptada`. Dibujarla interrumpida dice que alguien
 * miró tu postulación y no llegaste.* En `declinada` eso es EXACTAMENTE lo
 * que pasó, y por eso ahí la escalera es información sobre tu propia
 * situación. **Acá nadie evaluó nada tuyo:** el refugio aceptó a OTRO, y tu
 * solicitud la cerró un trigger. Pintar los pasos apagados **le atribuye a
 * quien lee un juicio que nunca existió**, y encima con la forma que en toda
 * esta pieza significa rechazo.
 *
 * ⇒ Es el mismo tratamiento que el fallecimiento —la noticia y nada más— con
 * una razón distinta: **allá no hay proceso porque murió su sujeto; acá no
 * hay juicio que mostrar.** *Dos caminos al mismo dibujo no es una
 * coincidencia que se acomoda: es que el dibujo dice «esto es una noticia»,
 * y las dos lo son.*
 *
 * Y la voz las separa por completo: una es duelo, la otra es una buena
 * noticia sobre el animal que a quien lee le duele igual. **Las dos cosas
 * son ciertas y la voz sostiene las dos.**
 *
 * ── ② `no_concretada_fallecimiento` — 🔴 Y ÉSTE NO LLEVA ESCALERA ─────────
 * Firma del founder (2-sep): **el acta no se firma con el animal en
 * memorial.** Cuando el refugio marca la muerte, un trigger cierra las
 * solicitudes vivas de ese animal.
 *
 * **La escalera existe para decir DÓNDE ESTÁS EN UN PROCESO. Acá no hay
 * proceso en el que estar: murió su sujeto.** Dibujarla apagada —«recibida ✓,
 * el resto gris»— es la versión burocrática de la misma noticia: le informa a
 * alguien que perdió al animal que eligió **hasta qué paso del trámite había
 * llegado.** *Un duelo dibujado como un rechazo interrumpido dice que el
 * refugio no continuó con su postulación, y no fue eso lo que pasó.*
 *
 * ⇒ **Con este estado la pieza dibuja LA NOTICIA Y NADA MÁS.** Sin pasos, sin
 * marcas de estado, sin color de status. Es el mismo movimiento con el que
 * `Convivencia` le da título propio al bloque sin observar en vez de fingir
 * que sus filas son el contenido.
 *
 * **La mitad estructural de `D-3` (no invitar a otro animal):** esta pieza
 * **no tiene slot de acción**, ni acá ni en ningún estado. *No hay dónde
 * poner un «Ver otros animales».* La otra mitad es del texto y la cuida el
 * cinturón del motor — el diseño cierra la puerta ancha, no la angosta.
 */
import { View } from 'react-native'
import { spacing } from '../tokens/spacing'
import { EscaleraEstados } from './EscaleraEstados'
import { Texto } from './Texto'

export type EstadoSolicitud =
  | 'recibida'
  /** ⚠️ Hoy inalcanzable: no hay canal. Ver el encabezado. */
  | 'en_conversacion'
  | 'aceptada'
  /** Corte del PUBLICADOR. */
  | 'declinada'
  /** S112-B · corte de la FAMILIA: se bajó sola. Ver la enmienda. */
  | 'desistida'
  /** S112-B · el animal murió. **No lleva escalera.** Ver la enmienda. */
  | 'no_concretada_fallecimiento'
  /**
   * S112-B · el animal encontró familia — **otra**. Las demás solicitudes se
   * cierran solas. **Tampoco lleva escalera**, y la razón NO es la misma que
   * la del fallecimiento: ver la enmienda.
   */
  | 'no_concretada_otra_familia'

export type EstadoSolicitudAdopcionProps = {
  estado: EstadoSolicitud
  /**
   * Las palabras de los tres pasos del camino, en su orden. OBLIGATORIAS:
   * la pieza no trae diccionario.
   */
  voces: { recibida: string; enConversacion: string; aceptada: string }
  /**
   * 🔴 La voz de la declinada es OBLIGATORIA y va aparte: es la única que la
   * casa que lee tiene que poder escribir con sus palabras (§5 · §10.6).
   */
  vozDeclinada: string
  /**
   * 🔴 S112-B · OBLIGATORIA. La familia se bajó. *«Cancelaste tu
   * postulación»* del lado de la familia, *«Se bajó»* del lado del refugio —
   * el mismo hecho con dos voces, que es la razón de siempre.
   */
  vozDesistida: string
  /**
   * 🔴 S112-B · OBLIGATORIA. El animal encontró familia y no fue la tuya.
   *
   * **La noticia es BUENA para el animal**, que es lo que el vertical
   * entero existe para lograr, y **mala para quien lee**. Las dos cosas son
   * ciertas a la vez y la voz tiene que sostener las dos: *«Luna ya
   * encontró su hogar»* dice el hecho sin pedir perdón por él.
   *
   * ⚠️ **Con este estado esta voz es TODO lo que se dibuja.**
   */
  vozOtraFamilia: string
  /**
   * 🔴 S112-B · OBLIGATORIA, y es la más delicada de las cuatro.
   *
   * **Es una noticia que la casa DA, no una decisión que alguien tomó** — ahí
   * se separa de las otras dos, que son actos de una parte. El motor ya la
   * tiene escrita en los dos idiomas y su cinturón **falla si el mensaje
   * menciona otro animal** (`D-3`).
   *
   * ⚠️ **Con este estado esta voz es TODO lo que se dibuja** (ver la
   * enmienda): no hay escalera detrás que la acompañe. Escribila como se
   * escribe una noticia, no como se rotula un estado.
   */
  vozNoConcretada: string
  registro?: 'compacta' | 'completa'
}

/** Los tres cortes tienen prop propia en vez de un `Record` a propósito: los
 *  escribe gente distinta en registros distintos, y agruparlos invita a
 *  redactarlos como un set con un solo tono. `vozDeclinada` conserva su
 *  nombre porque cambiarlo le costaría churn a dos montajes vivos por cero
 *  ganancia. */

/** El camino, sin la declinada: ésa no es un escalón. */
const CAMINO = ['recibida', 'en_conversacion', 'aceptada'] as const

export function EstadoSolicitudAdopcion({
  estado,
  voces,
  vozDeclinada,
  vozDesistida,
  vozNoConcretada,
  vozOtraFamilia,
  registro,
}: EstadoSolicitudAdopcionProps) {
  /* 🔴 LAS NOTICIAS SALEN ANTES DE LA ESCALERA, y el `return` temprano ES la
     decisión de diseño (ver la enmienda de la cabecera).

     **Son DOS estados y llegan al mismo dibujo por caminos distintos**, que
     es la parte que no hay que perder al leer este `if`:
       · el fallecimiento — **no hay proceso** en el que estar: murió su
         sujeto. La escalera apagada le informaría a alguien que perdió al
         animal que eligió hasta qué paso del trámite había llegado.
       · la otra familia — **no hay juicio** que mostrar: nadie evaluó esta
         postulación, la cerró un trigger. Los pasos apagados le atribuirían
         a quien lee un veredicto que nunca existió, con la forma que en toda
         esta pieza significa rechazo.

     Sin color de status —ni neutro ni alerta— y sin marca: `cuerpo` en la
     tinta de siempre. La noticia se sostiene sola; teñirla la convertiría en
     una etiqueta de estado, que es exactamente lo que no es. */
  const NOTICIA: Partial<Record<EstadoSolicitud, string>> = {
    no_concretada_fallecimiento: vozNoConcretada,
    no_concretada_otra_familia: vozOtraFamilia,
  }
  const noticia = NOTICIA[estado]
  if (noticia !== undefined) {
    return (
      <View style={{ paddingVertical: spacing[2] }}>
        <Texto variante="cuerpo">{noticia}</Texto>
      </View>
    )
  }

  const vozDe = {
    recibida: voces.recibida,
    en_conversacion: voces.enConversacion,
    aceptada: voces.aceptada,
  }

  /* Los DOS cortes comparten forma y no voz: el camino se INTERRUMPE, el paso
     alcanzado queda hecho y lo que seguía se apaga entero — jamás se marca
     como cumplido algo que no pasó. Lo que cambia es QUIÉN cortó, y eso lo
     dice la voz, no el dibujo. */
  const cortada = estado === 'declinada' || estado === 'desistida'
  const indiceActual = cortada ? -1 : CAMINO.indexOf(estado as (typeof CAMINO)[number])

  return (
    <EscaleraEstados
      registro={registro}
      pasos={CAMINO.map((clave, i) => ({
        clave,
        etiqueta: vozDe[clave],
        estado:
          cortada
            ? // Sólo `recibida` es seguro: toda solicitud cortada fue recibida.
              // Los demás se apagan — no sabemos hasta dónde llegó.
              i === 0
              ? 'hecho'
              : 'pendiente'
            : i < indiceActual
              ? 'hecho'
              : i === indiceActual
                ? 'actual'
                : 'pendiente',
      }))}
      desvio={
        // 🔴 NEUTRO en los dos, jamás alerta: ni un «no» del refugio ni un
        // «me bajo» de la familia acusan a nadie.
        estado === 'declinada'
          ? { etiqueta: vozDeclinada, tono: 'neutro' }
          : estado === 'desistida'
            ? { etiqueta: vozDesistida, tono: 'neutro' }
            : undefined
      }
    />
  )
}
