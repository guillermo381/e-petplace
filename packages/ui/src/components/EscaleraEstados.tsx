/**
 * EscaleraEstados — DÓNDE ESTÁ Y CUÁNTO FALTA, sin abrir nada.
 *
 * Nace en S96-B para el recorrido de la despensa, y sirve a las DOS caras:
 * el panel del vendedor (`LETRA_PANEL_VENDEDOR_S96` §2.2: *"la escalera de
 * cuatro escalones a la vista — se ve dónde está y cuánto falta sin abrir
 * nada"*) y el seguimiento de la familia
 * (`LETRA_RECORRIDO_DESPENSA_S96` §8.1).
 *
 * ── LEY 11: POR QUÉ NACE Y NO SE REUSA ALGO ────────────────────────────
 * Relevado antes de crear (protocolo 1c, pregunta 2): `SelectorSegmentado`
 * ELIGE (control), no informa · `Insignia` dice UN estado puntual, no una
 * secuencia · `TarjetaEstado` es la binaria ESTÁ/ESPERA, no una cadena ·
 * `LineaDeVida` sí dibuja una secuencia vertical — **y de ella se toma el
 * lenguaje** (riel 24, punto 10, conector hairline), en vez de inventar
 * otro. El trabajo "informar el progreso de un proceso multi-paso" NO
 * estaba en el diccionario (Ley 19): entra con esta pieza.
 *
 * ── LAS DOS DECISIONES DE DISEÑO, declaradas ───────────────────────────
 *
 * ① **EL DESVÍO NO ES UN ESCALÓN.** `no_llego` y `cancelado` no avanzan
 *    el camino: lo INTERRUMPEN. Una escalera que los pinta como "paso 5
 *    de 5" afirma que el pedido llegó al final, y es falso — L-139 en su
 *    forma más barata. Por eso `desvio` es una banda aparte que sustituye
 *    al paso actual, y los pasos que quedaban se apagan enteros.
 *
 * ② **CERO DICCIONARIO DE ESTADOS ADENTRO.** Las etiquetas llegan por
 *    prop. El vendedor lee *"Empacado"* y la familia lee *"Estamos
 *    preparando tu pedido"*: **el mismo hecho contado a dos audiencias
 *    distintas** (`METODO_TRES_PISTAS` §6 — se comparte la FORMA, la VOZ
 *    es de cada casa). Un diccionario acá adentro obligaría a las dos
 *    casas a hablar igual, y no se puede deduplicar una audiencia.
 *    Lo único que vive en el namespace `ui` es el armado del label de
 *    accesibilidad, que es forma y no dominio.
 *
 * ── LOS DOS REGISTROS ──────────────────────────────────────────────────
 * `compacta`  la tira, para una FILA de lista (la lista Hoy del vendedor,
 *             "Mis pedidos" de la familia). Barras + el nombre del paso
 *             actual.
 * `completa`  el riel vertical, para el DETALLE. Nodo por paso, con su
 *             detalle opcional ("12:40", "Lote A-33").
 *
 * ── CHANEL (Ley 16) ────────────────────────────────────────────────────
 * En `compacta`, HECHO y ACTUAL se llenan IGUAL. La tentación era darle
 * al actual un tercer tratamiento (tope, punto, matiz) — y se quitó: la
 * pregunta de una fila es *cuánto falta*, que los llenos ya contestan, y
 * **cuál es el paso lo dice la etiqueta con palabras, que es más preciso
 * que un matiz de color**. Un tercer peso ahí es el accesorio que la Ley
 * 19.7 nombra: ni jerarquía ni humildad.
 * En `completa` la distinción SÍ existe y se dice con TIPOGRAFÍA, no con
 * un anillo (Ley 18: la jerarquía se dice con tipografía y aire) — el
 * anillo nítido está reservado por la Ley 7 a "en vivo", y el paso actual
 * de un pedido no es una atención en curso.
 *
 * ── LA GRAMÁTICA QUE HEREDA ────────────────────────────────────────────
 * Lo que YA PASÓ se rellena · lo que ESPERA se contornea. Es la gramática
 * ESTÁ/ESPERA de `TarjetaEstado` (§15b.0bis) aplicada a una secuencia, y
 * el eje del relleno de la Ley 19.8 leído en el tiempo: **un paso hecho
 * EXISTE; uno pendiente todavía no.**
 *
 * Sin animación: el avance de un escalón es reemplazo directo (Ley 6 —
 * el layout de listas no se anima; Ley 13 — sin layout shift).
 * Presentacional puro: cero fetch, cero estado propio.
 * Memorial degrada solo (el acento cae a tinta por el slot del tema).
 */

import { View } from 'react-native'

import { Texto } from './Texto'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'
import { useTraduccionUi } from '../i18n'

/** hecho = ya pasó · actual = donde está · pendiente = todavía no. */
export type PasoEstado = 'hecho' | 'actual' | 'pendiente'

export type PasoEscalera = {
  /** Identidad estable del paso (para la key). Jamás se muestra. */
  clave: string
  /** LA VOZ DE LA CASA que la monta. Ver decisión ② del encabezado. */
  etiqueta: string
  estado: PasoEstado
  /**
   * Dato de máquina del paso, en `completa`: la hora en que se marcó, el
   * lote, la ventana prometida. Voz de máquina (mono, Ley 3) — lo compone
   * la pantalla con el riel de fechas, jamás este componente.
   */
  detalle?: string
}

export type DesvioEscalera = {
  /** "No había nadie" · "Cancelaste este pedido". Voz de la casa. */
  etiqueta: string
  detalle?: string
  /**
   * `alerta`  algo salió mal y alguien tiene que hacer algo (entrega
   *           fallida) — tinte de warning, JAMÁS fill (R20: la familia
   *           alerta no se rellena).
   * `neutro`  terminó sin drama (cancelado). Apagado no dice error.
   */
  tono?: 'alerta' | 'neutro'
}

export type EscaleraEstadosProps = {
  /** En orden del recorrido. La pantalla los arma desde su lector. */
  pasos: PasoEscalera[]
  /** `compacta` = fila de lista · `completa` = detalle. */
  registro?: 'compacta' | 'completa'
  /**
   * El camino se interrumpió. Sustituye al paso actual y apaga lo que
   * quedaba — ver decisión ① del encabezado.
   */
  desvio?: DesvioEscalera
  /**
   * La dosis: `control` = cliente (magentaDark) · `oficio` = negocio
   * (tealDark). Mismo patrón que `SelectorOpcion` — la dosis modula
   * color, jamás la gramática.
   */
  acento?: 'control' | 'oficio'
}

const RIEL = 24 // ancho de la columna del conector — el de LineaDeVida
const PUNTO = 10 // diámetro del nodo — el de LineaDeVida
const BARRA = 4 // alto de la barra de la tira compacta

export function EscaleraEstados({
  pasos,
  registro = 'completa',
  desvio,
  acento = 'control',
}: EscaleraEstadosProps) {
  const { theme } = useTheme()
  const { t } = useTraduccionUi()

  // Regla de existencia: sin pasos no hay escalera (nunca un riel vacío).
  if (pasos.length === 0) return null

  const color = acento === 'oficio' ? theme.accent.primary : theme.accent.control
  const indiceActual = pasos.findIndex((p) => p.estado === 'actual')
  // Con desvío el camino se cortó: los llenos son los que YA pasaron.
  const hechos = pasos.filter((p) => p.estado === 'hecho').length
  const alcanzado = desvio ? hechos : hechos + (indiceActual >= 0 ? 1 : 0)

  // El label de a11y compone forma + voz de la casa: el número lo pone el
  // componente, el nombre del paso lo pone quien lo monta.
  const pasoNombrado = desvio?.etiqueta ?? (indiceActual >= 0 ? pasos[indiceActual].etiqueta : undefined)
  const etiquetaA11y =
    pasoNombrado === undefined
      ? t('escaleraEstados.progresoSinPaso', { n: alcanzado, total: pasos.length })
      : t('escaleraEstados.progreso', {
          n: alcanzado,
          total: pasos.length,
          etiqueta: pasoNombrado,
        })

  if (registro === 'compacta') {
    return (
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={etiquetaA11y}
        accessibilityValue={{ min: 0, max: pasos.length, now: alcanzado }}
        style={{ gap: spacing[1.5] }}
      >
        <View style={{ flexDirection: 'row', gap: spacing[1] }}>
          {pasos.map((paso, i) => (
            <View
              key={paso.clave}
              style={{
                flex: 1,
                height: BARRA,
                borderRadius: radius.full,
                // Ver CHANEL: hecho y actual se llenan igual a propósito.
                backgroundColor: i < alcanzado ? color : theme.bg.hundido,
              }}
            />
          ))}
        </View>
        {pasoNombrado !== undefined ? (
          <Texto variante="apoyo" color={desvio?.tono === 'alerta' ? 'warning' : undefined}>
            {pasoNombrado}
          </Texto>
        ) : null}
      </View>
    )
  }

  return (
    <View accessibilityLabel={etiquetaA11y} style={{ gap: 0 }}>
      {pasos.map((paso, i) => {
        // Con desvío, lo que no pasó queda apagado: el camino se cortó ahí
        // y prometer que sigue sería exactamente lo que L-139 prohíbe.
        const cortado = desvio !== undefined && paso.estado !== 'hecho'
        const lleno = paso.estado === 'hecho' || (paso.estado === 'actual' && !cortado)
        const esUltimo = i === pasos.length - 1 && desvio === undefined
        const preside = paso.estado === 'actual' && !cortado

        return (
          <View key={paso.clave} style={{ flexDirection: 'row' }}>
            {/* riel: punto + conector hairline — el lenguaje de LineaDeVida */}
            <View style={{ width: RIEL, alignItems: 'center' }}>
              <View
                style={{
                  width: PUNTO,
                  height: PUNTO,
                  borderRadius: radius.full,
                  marginTop: spacing[1],
                  // LO QUE PASÓ SE RELLENA · LO QUE ESPERA SE CONTORNEA
                  // (Ley 19.8 leída en el tiempo; gramática de TarjetaEstado).
                  backgroundColor: lleno ? color : 'transparent',
                  ...(lleno
                    ? null
                    : { borderWidth: theme.border.width, borderColor: theme.border.default }),
                }}
              />
              {esUltimo ? null : (
                <View
                  style={{
                    flex: 1,
                    width: theme.border.width,
                    minHeight: spacing[4],
                    backgroundColor: theme.bg.border,
                  }}
                />
              )}
            </View>

            <View style={{ flex: 1, paddingBottom: spacing[4], gap: spacing[0.5] }}>
              {/* La jerarquía del ACTUAL se dice con TIPOGRAFÍA (Ley 18),
                  jamás con un anillo: el anillo es de "en vivo" (Ley 7). */}
              <Texto variante={preside ? 'seccion' : 'cuerpo'} color={cortado ? 'tertiary' : undefined}>
                {paso.etiqueta}
              </Texto>
              {paso.detalle === undefined ? null : <Texto variante="dato">{paso.detalle}</Texto>}
            </View>
          </View>
        )
      })}

      {desvio === undefined ? null : <BandaDesvio desvio={desvio} />}
    </View>
  )
}

/**
 * La banda del desvío. Sustituye al paso actual — no lo acompaña.
 * Tinte, jamás fill (R20: la familia alerta no se rellena).
 */
function BandaDesvio({ desvio }: { desvio: DesvioEscalera }) {
  const { theme } = useTheme()
  const alerta = desvio.tono === 'alerta'

  return (
    <View style={{ flexDirection: 'row' }}>
      <View style={{ width: RIEL, alignItems: 'center' }}>
        <View
          style={{
            width: PUNTO,
            height: PUNTO,
            borderRadius: radius.full,
            marginTop: spacing[1],
            backgroundColor: alerta ? theme.status.warning : theme.text.tertiary,
          }}
        />
      </View>
      <View
        style={{
          flex: 1,
          gap: spacing[0.5],
          padding: spacing[3],
          borderRadius: radius.suave,
          backgroundColor: alerta ? theme.status.warningBg : theme.bg.overlay,
        }}
      >
        <Texto variante="cuerpo" color={alerta ? 'warning' : 'secondary'}>
          {desvio.etiqueta}
        </Texto>
        {desvio.detalle === undefined ? null : (
          <Texto variante="apoyo" color={alerta ? 'warning' : undefined}>
            {desvio.detalle}
          </Texto>
        )}
      </View>
    </View>
  )
}

// El tamaño de la tira no se re-decide por pantalla: vive acá.
export const ALTO_BARRA_ESCALERA = BARRA
