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
 */
import { EscaleraEstados } from './EscaleraEstados'

export type EstadoSolicitud =
  | 'recibida'
  /** ⚠️ Hoy inalcanzable: no hay canal. Ver el encabezado. */
  | 'en_conversacion'
  | 'aceptada'
  | 'declinada'

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
  registro?: 'compacta' | 'completa'
}

/** El camino, sin la declinada: ésa no es un escalón. */
const CAMINO = ['recibida', 'en_conversacion', 'aceptada'] as const

export function EstadoSolicitudAdopcion({
  estado,
  voces,
  vozDeclinada,
  registro,
}: EstadoSolicitudAdopcionProps) {
  const vozDe = {
    recibida: voces.recibida,
    en_conversacion: voces.enConversacion,
    aceptada: voces.aceptada,
  }

  // Con la solicitud declinada el camino se INTERRUMPE: el paso alcanzado
  // queda hecho y lo que seguía se apaga entero — jamás se marca como
  // cumplido algo que no pasó.
  const declinada = estado === 'declinada'
  const indiceActual = declinada ? -1 : CAMINO.indexOf(estado as (typeof CAMINO)[number])

  return (
    <EscaleraEstados
      registro={registro}
      pasos={CAMINO.map((clave, i) => ({
        clave,
        etiqueta: vozDe[clave],
        estado:
          declinada
            ? // Sólo `recibida` es seguro: toda solicitud declinada fue recibida.
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
        declinada
          ? // 🔴 NEUTRO, jamás alerta: un «no» del refugio no acusa a nadie.
            { etiqueta: vozDeclinada, tono: 'neutro' }
          : undefined
      }
    />
  )
}
