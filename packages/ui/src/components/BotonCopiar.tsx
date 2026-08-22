import { useCallback, useEffect, useRef, useState } from 'react'
import { View, type LayoutChangeEvent } from 'react-native'
import { Boton, type BotonTamaño, type BotonVariante } from './Boton'
import { Icono } from './Icono'

/**
 * BotonCopiar — UN TOQUE COPIA, Y EL BOTÓN MISMO LO CONFIRMA.
 *
 * Pedido de C con su consumidor nombrado: **el código de 6 dígitos de
 * DeUna**, que la familia tiene que llevar a otra app para pagar. Ahí
 * copiar no es una comodidad: es el paso del flujo. Transcribir seis
 * dígitos a mano, contra reloj, con la app de pago esperando, es donde
 * se pierden los pagos.
 *
 * ── LO QUE NO ALCANZABA ────────────────────────────────────────────────
 * `Boton` con un `onPress` que copia. Alcanza para copiar y **no alcanza
 * para nada de lo demás**: cada pantalla tendría que re-decidir cómo
 * confirma, cuánto dura la confirmación, qué pasa cuando el valor
 * venció, y cómo se lo cuenta a un lector de pantalla. Es el mismo hueco
 * que `Texto` cerró — el sistema no tenía la pieza, así que la decisión
 * se re-tomaba a mano en cada pantalla. **Por eso COMPONE `Boton` en vez
 * de reemplazarlo:** la jerarquía, el pressed, el apagado y su a11y ya
 * están resueltos ahí y no se reimplementan (Ley 11: reusar > adaptar >
 * crear).
 *
 * ── LA CONFIRMACIÓN ES EL PROPIO BOTÓN, Y ES UN DESVÍO DECLARADO ───────
 * El diccionario manda `useAviso` para todo feedback efímero, y acá **no
 * se usa, a propósito**: un toast aparece SOBRE el contenido, y el
 * contenido de esta pantalla **es el código que la persona está mirando**
 * mientras copia. Taparlo justo en ese momento es el defecto, no la
 * cortesía. La confirmación vive en el control que la produjo — que
 * además es donde el ojo ya está.
 *
 * **Sin layout shift, y no por gusto:** «Copiar» y «Copiado» miden
 * distinto, y un botón que cambia de ancho al tocarlo es exactamente lo
 * que la Ley 13 llama reemplazo con salto. El ancho se FIJA con la
 * medición del primer render (`onLayout` → `minWidth`) y no se vuelve a
 * mover. Cero animación (Ley 6): el texto se reemplaza, no se anima.
 *
 * ── ⚠️ NO TOCA NINGÚN RELOJ, Y ESO ES CONTRATO ─────────────────────────
 * Copiar **no extiende el hold, no reinicia la cuenta regresiva y no
 * pide nada al servidor.** La pieza solo escribe en el portapapeles y
 * cambia su propio texto: no tiene ninguna vía para alterar el tiempo de
 * la pantalla. `onCopiado` existe para telemetría y **jamás para
 * reiniciar un temporizador** — si una pantalla lo usara para eso,
 * estaría rompiendo el contrato desde afuera, no la pieza.
 *
 * ── APAGADA CUANDO EL CONTENIDO VENCIÓ ─────────────────────────────────
 * Con `vencido`, el botón se apaga **sereno**: apagado es estado, no
 * falla (Ley 22). No dice error ni se pinta en danger. La razón viaja en
 * `razonVencido` hacia el `accessibilityHint` de `Boton` — pero **la
 * forma preferida sigue siendo que la PANTALLA lo diga visible** (el
 * precedente del Confirmar apagado, S63-B): un código vencido necesita
 * un «generá uno nuevo» a la vista, no solo un hint.
 *
 * ── ⚠️ DEPENDE DE UN MÓDULO NATIVO, Y DEGRADA EN DOS MOMENTOS ──────────
 * `expo-clipboard` es NATIVO: **no viaja por OTA** (L-134) — llega con
 * la próxima build. Se carga con `require` en try/catch (patrón del
 * micrófono, S78: *el APK viejo no crashea*).
 *
 * **Pero el try/catch del require NO alcanza, y esto está medido:** pnpm
 * auto-instala los peers, así que en un bundle nuevo corriendo sobre un
 * **binario viejo** el JS del módulo SÍ resuelve —`require` no tira— y lo
 * que falta es la parte nativa, que recién falla **al llamar**. Un botón
 * habilitado cuyo toque no hace nada es peor que uno apagado: la persona
 * toca, no pasa nada, y no sabe si copió.
 * ⇒ Por eso hay **dos** degradaciones: `require` que falla ⇒ nace
 *   apagado · **primera llamada que falla ⇒ se apaga y NO vuelve a
 *   prometer.** En los dos casos jamás dice «Copiado».
 *
 * ── LA ETIQUETA ACCESIBLE ES LA VISIBLE, A PROPÓSITO ──────────────────
 * `Boton` hace su `etiqueta` OBLIGATORIA y la usa como nombre accesible,
 * así que un verbo llano —«Copiar código»— ya es la etiqueta correcta en
 * los dos canales. **No se agrega una prop de label aparte**, y el porqué
 * está medido en el propio `Boton`: envolverlo para sumarle a11y deja
 * **DOS nodos anidados, los dos `role="button"`**, y un lector los
 * anuncia como dos controles. **El valor tampoco se lee al enfocar** —
 * un código dictado por el lector cuando uno enfoca el botón es ruido;
 * para eso está `CodigoAEscala`, que lo lee dígito a dígito donde
 * corresponde. Al confirmar, el nombre accesible pasa a «Copiado» solo:
 * el cambio de nombre ES el anuncio.
 *
 * ── EL GLIFO ES OPT-IN, Y NO ES PEREZA ─────────────────────────────────
 * `copiar` existe en el registry desde S103-B, y aun así el default es
 * **sin glifo**: la Ley 12 enmendada dice que *el glifo marca lo que
 * VARÍA dentro de la unidad de barrido*, y un botón de copiar solo al pie
 * de un código **no tiene hermanos de los que distinguirse** — ahí el
 * glifo es adorno, y la regla Chanel lo saca. Con `glifo`, la pantalla lo
 * enciende cuando SÍ tiene vecinos (una fila de acciones donde conviven
 * copiar, compartir y descargar): esa decisión es de la pantalla, que es
 * la única que ve la vecindad.
 *
 * ── LO QUE NO HACE ─────────────────────────────────────────────────────
 * No muestra datos del expediente ⇒ **la escalera §4b no aplica** y se
 * declara en vez de omitirse.
 */

/**
 * El módulo nativo, cargado una sola vez y sin romper si no está.
 *
 * ⚠️ `require` y no `import`: un `import` estático de un módulo ausente
 * revienta al EVALUAR el bundle — o sea antes de que ninguna pantalla
 * pueda protegerse. El try/catch tiene que envolver la carga misma.
 */
let portapapeles: { setStringAsync: (v: string) => Promise<boolean> } | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  portapapeles = require('expo-clipboard')
} catch {
  portapapeles = null
}

/** ¿El binario de esta app puede copiar? Lo dice el módulo, no un supuesto. */
export const HAY_PORTAPAPELES = typeof portapapeles?.setStringAsync === 'function'

/** Cuánto dura la confirmación. Suficiente para verla, corto para no estorbar. */
const MS_CONFIRMACION = 1800

export interface BotonCopiarProps {
  /** Lo que se copia. Se copia TAL CUAL: la pieza no lo formatea ni lo limpia. */
  valor: string
  /** Qué dice en reposo. Verbo llano (Ley 17.1): «Copiar código». */
  etiqueta: string
  /** Qué dice al confirmar. «Copiado». */
  etiquetaCopiado: string
  /**
   * El contenido venció ⇒ el botón se apaga sereno. La pantalla decide
   * cuándo (el hold que expiró, el código que caducó) — la pieza no mira
   * ningún reloj.
   */
  vencido?: boolean
  /** Por qué está apagado, para el lector de pantalla. Ver el JSDoc. */
  razonVencido?: string
  /**
   * Monta el glifo `copiar` a la izquierda. **Default false a propósito**
   * — ver el JSDoc: un glifo sin vecindad es adorno.
   */
  glifo?: boolean
  /** Telemetría. **Jamás para reiniciar relojes** — ver el JSDoc. */
  onCopiado?: () => void
  variante?: BotonVariante
  tamaño?: BotonTamaño
  bloque?: boolean
}

export function BotonCopiar({
  valor,
  etiqueta,
  etiquetaCopiado,
  vencido = false,
  razonVencido,
  glifo = false,
  onCopiado,
  variante = 'compacto',
  tamaño = 'md',
  bloque = false,
}: BotonCopiarProps) {
  const [copiado, setCopiado] = useState(false)
  /**
   * El módulo cargó pero la parte nativa no responde (bundle nuevo sobre
   * binario viejo). Se descubre al PRIMER intento y ahí el botón se apaga:
   * seguir ofreciéndolo es prometer algo que ya se sabe que no pasa.
   */
  const [nativoRoto, setNativoRoto] = useState(false)
  const [anchoFijo, setAnchoFijo] = useState<number | null>(null)
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null)
  const vivo = useRef(true)

  // El temporizador de la confirmación se limpia al desmontar: si la
  // pantalla se va mientras corre, un setState sobre un componente muerto
  // es una fuga silenciosa.
  useEffect(() => {
    vivo.current = true
    return () => {
      vivo.current = false
      if (temporizador.current) clearTimeout(temporizador.current)
    }
  }, [])

  /**
   * El ancho se fija con la medida del PRIMER render (la etiqueta en
   * reposo) y no se vuelve a tocar. Sin esto el botón se encoge o se
   * estira al confirmar, que es el salto de layout que la Ley 13 prohíbe.
   */
  const alMedir = useCallback(
    (e: LayoutChangeEvent) => {
      if (anchoFijo !== null) return
      const w = e.nativeEvent.layout.width
      if (w > 0) setAnchoFijo(w)
    },
    [anchoFijo],
  )

  const copiar = useCallback(() => {
    if (!portapapeles) return
    // Copiar NO espera al servidor ni toca el hold: escribe y confirma.
    portapapeles
      .setStringAsync(valor)
      .then(() => {
        if (!vivo.current) return
        setCopiado(true)
        onCopiado?.()
        if (temporizador.current) clearTimeout(temporizador.current)
        temporizador.current = setTimeout(() => {
          if (vivo.current) setCopiado(false)
        }, MS_CONFIRMACION)
      })
      .catch(() => {
        // NO se confirma. Un «Copiado» sobre un portapapeles vacío es la
        // peor mentira posible acá: la persona se va a pegar la nada en la
        // app de pago. Y además se apaga: ya sabemos que no funciona.
        if (!vivo.current) return
        setCopiado(false)
        setNativoRoto(true)
      })
  }, [valor, onCopiado])

  const apagado = vencido || !HAY_PORTAPAPELES || nativoRoto
  // Sin módulo nativo no se da razón: no hay nada que la persona pueda
  // hacer al respecto, y un hint que culpa al usuario por una build vieja
  // es peor que el silencio.
  const razon = vencido ? razonVencido : undefined

  return (
    <View
      onLayout={alMedir}
      style={anchoFijo !== null && !bloque ? { minWidth: anchoFijo, alignSelf: 'flex-start' } : undefined}
    >
      <Boton
        etiqueta={copiado ? etiquetaCopiado : etiqueta}
        onPress={copiar}
        variante={variante}
        tamaño={tamaño}
        bloque={bloque}
        deshabilitado={apagado}
        razonDeshabilitado={razon}
        iconoIzq={glifo ? <Icono nombre="copiar" tamano={18} registro="tinta" /> : undefined}
      />
    </View>
  )
}
