/**
 * HojaConfirmacionDestructiva — LA SEGUNDA CONFIRMACIÓN, HECHA PIEZA
 * (S104-B · P1 «la doble confirmación»).
 *
 * ═══════════════════════════════════════════════════════════════════
 * 🔴 POR QUÉ NACE: **el patrón existía y no era una pieza.** Vivía como
 * INSTANCIA en `apps/cliente/.../cuenta/medios.tsx:150`, escrito a mano
 * bajo el rótulo «P1 · LA DOBLE CONFIRMACIÓN». ⇒ cada superficie
 * destructiva de la casa volvía a re-decidir **cómo confirma, qué dice,
 * y si nombra o no lo que borra.** *El mismo hueco que `Texto` cerró: sin
 * pieza, la decisión se re-toma en cada pantalla, y la tercera se toma
 * distinto.*
 * ═══════════════════════════════════════════════════════════════════
 *
 * ── LOS DOS PASOS SON EL DISPARADOR Y ESTA HOJA ───────────────────────
 * **Paso 1 = el control que la abre** (el «Borrar» de la fila, el
 * «Eliminar cuenta» de Ajustes). **Paso 2 = esta Hoja.** No se inventa un
 * tercer paso: el patrón ratificado de la casa son dos, y el segundo
 * **dice qué se borra con su nombre**.
 *
 * 🔴 **`sujeto` ES OBLIGATORIO Y NO TIENE DEFAULT, y es la única regla
 * dura de esta pieza.** El literal de `medios.tsx` lo dice mejor que yo:
 * *«un "¿estás seguro?" sin sujeto es un botón que la gente aprende a
 * apretar sin leer»*. Y ahí el caso era peor de lo que suena — dos
 * tarjetas del mismo banco terminadas en dígitos parecidos: **sin el
 * nombre, la persona borra la que no era.** Por eso no hay forma de
 * montar esta Hoja sin nombrar el sujeto: *el estado malo se vuelve
 * inexpresable, no se vigila.*
 *
 * ── LO QUE NO HACE, Y ES DELIBERADO ───────────────────────────────────
 * **No escribe la voz.** El cuerpo lo pone el consumidor: lo que se
 * pierde al borrar una tarjeta no se parece a lo que se pierde al cerrar
 * una cuenta, y una frase genérica para las dos sería la voz que no dice
 * nada. La pieza fija la ANATOMÍA y el candado del sujeto; el contenido
 * es de quien sabe qué está destruyendo.
 *
 * ── LA JERARQUÍA (19.7 · Ley 22c) ─────────────────────────────────────
 * **UN solo sólido: el destructivo.** `Boton variante="destructivo"` es
 * tonal danger, **jamás coral pleno** — la casa no grita para pedir una
 * confirmación. Cancelar baja a `ghost`: es la salida, no una alternativa
 * simétrica. *Dos cajas llenas obligarían a elegir dos veces.*
 *
 * ⚠️ **CANCELAR ES LO QUE PASA AL CERRAR LA HOJA POR CUALQUIER VÍA** —
 * swipe, backdrop, back de Android, la X. `Hoja` ya lo garantiza y por
 * eso no hay un `onCancelar` aparte de `onCerrar`: **dos formas de
 * cancelar son dos caminos que se pueden desincronizar**, y en una
 * pantalla destructiva el que se olvide es el que deja la acción a medias.
 *
 * ── LOS TRES TEMAS · MOVIMIENTO ───────────────────────────────────────
 * Todo del tema (`status.dangerBg`/`dangerText` vía `Boton`) ⇒ resuelve
 * en claro, oscuro y memorial. **Movimiento propio: NINGUNO** — el de la
 * `Hoja` y nada más. *Nada se anima en una pantalla donde alguien está por
 * destruir algo* (Ley 6 · Ley 8: memorial no celebra, y esto tampoco).
 *
 * ── LA ESCALERA (Ley 11) ──────────────────────────────────────────────
 * No muestra datos del expediente ⇒ **§4b no aplica.** Declarado.
 */

import type { ReactNode } from 'react'
import { View } from 'react-native'

import { Boton } from './Boton'
import { Hoja } from './Hoja'
import { Texto } from './Texto'
import { spacing } from '../tokens/spacing'

export interface HojaConfirmacionDestructivaProps {
  visible: boolean
  /** Cerrar por cualquier vía = CANCELAR. Ver la cabecera. */
  onCerrar: () => void
  titulo: string
  /**
   * 🔴 **QUÉ se destruye, con su nombre.** Obligatorio y sin default:
   * «Visa ···· 4821», «tu cuenta», «el paseo del martes». Ver la cabecera
   * para el caso medido que lo volvió obligatorio.
   */
  sujeto: string
  /**
   * El cuerpo: qué se pierde, en la voz de esta superficie. Se acepta
   * `ReactNode` para que una consecuencia larga pueda montar su propia
   * pieza (p. ej. `ConsecuenciasDelCierre`) en vez de aplanarse a texto.
   */
  children?: ReactNode
  /** La etiqueta del destructivo. Verbo llano: «Borrar la tarjeta». */
  etiquetaConfirmar: string
  etiquetaCancelar: string
  onConfirmar: () => void
  /** Mientras el motor trabaja. Apaga el destructivo y no deja re-tocar. */
  trabajando?: boolean
}

export function HojaConfirmacionDestructiva({
  visible,
  onCerrar,
  titulo,
  sujeto,
  children,
  etiquetaConfirmar,
  etiquetaCancelar,
  onConfirmar,
  trabajando = false,
}: HojaConfirmacionDestructivaProps) {
  return (
    <Hoja visible={visible} onCerrar={onCerrar} titulo={titulo}>
      <View style={{ gap: spacing[4] }}>
        {/* EL SUJETO PRESIDE, y va en `titulo` y no en `cuerpo`: es lo
            único que la persona tiene que leer sí o sí antes de decidir.
            Enterrarlo en un párrafo es cómo se lee de más y se ve de
            menos. */}
        <Texto variante="titulo">{sujeto}</Texto>

        {children}

        <View style={{ gap: spacing[2] }}>
          <Boton
            variante="destructivo"
            etiqueta={etiquetaConfirmar}
            bloque
            cargando={trabajando}
            deshabilitado={trabajando}
            onPress={onConfirmar}
          />
          {/* Cancelar sigue vivo mientras el motor trabaja: si la
              operación se cuelga, cerrar la Hoja tiene que seguir siendo
              posible. Lo que se apaga es el acto destructivo, no la
              salida. */}
          <Boton variante="ghost" etiqueta={etiquetaCancelar} bloque onPress={onCerrar} />
        </View>
      </View>
    </Hoja>
  )
}
