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
 *             "Mis pedidos" de la familia). **NODOS unidos por una línea
 *             que se rellena**, el nombre del paso y —si hay promesa— la
 *             ventana de entrega. ⏪ Decía «barras»: ver la lápida abajo.
 * `completa`  el riel vertical, para el DETALLE. Nodo por paso, con su
 *             detalle opcional ("12:40", "Lote A-33").
 *
 * ── ☠️ LAS CUATRO BARRAS MURIERON (S99-B, firma del founder) ──────────
 * Verbatim sobre las capturas de Rappi: *«nosotros tenemos cuatro líneas
 * verdes; Rappi llena con círculos cada etapa y le va diciendo al cliente
 * dónde está y cuánto falta. Es mucho más amigable.»*
 *
 * 🔴 **El diagnóstico es de GRAMÁTICA, no de estética: una barra solo
 * puede decir CUÁNTAS VAN.** No tiene adentro, así que el paso hay que
 * nombrarlo aparte y en texto. **Un nodo sí tiene adentro** — y por eso
 * puede decir QUÉ ES sin una palabra. *No se cambió de dibujo por gusto:
 * se cambió de forma porque la vieja no tenía dónde poner el
 * significado.*
 *
 * **La frontera de cuántos nodos: las NARRATIVAS (7), jamás los estados
 * internos (30).** La pieza no la conoce —recibe `pasos`— y por eso
 * funciona igual con 4 que con 7; lo que la casa firma es qué se cuenta.
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

import type { ReactNode } from 'react'
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
  /** EL ÍCONO ADENTRO DEL NODO (S99-B · firma del founder sobre Rappi):
   *  *«un círculo puede llevar un ícono adentro, así que cada etapa dice
   *  QUÉ ES sin texto»*.
   *
   *  **Es SLOT, no diccionario**, por la misma razón que la etiqueta: un
   *  set de íconos acá adentro obligaría a las dos casas a decir lo mismo
   *  con el mismo dibujo, y **el vendedor y la familia no miran el mismo
   *  hecho** (§6 del método). La pieza dice DÓNDE va el ícono; qué ícono
   *  es, lo dice quien la monta.
   *
   *  **Opcional a propósito:** sin él, el nodo es un punto — que es
   *  exactamente lo que la pieza hacía antes. *Así C y D adoptan de a una
   *  pantalla en vez de tener que dibujar siete glifos para estrenar la
   *  forma nueva.* */
  /** ⚠️ **`tamano` lo pasa LA PIEZA, derivado del nodo** (ver `NODO`): el
   *  consumidor lo recibe y no lo inventa. *Si el nodo crece y el glifo se
   *  queda, el defecto sale en la pantalla y no en ningún gate.* */
  icono?: (estado: { color: string; lleno: boolean; tamano: number }) => ReactNode
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
  /** CUÁNDO LLEGA — la ventana prometida, en `compacta` (S99-B).
   *
   *  El founder pidió que la escalera diga *«dónde está Y cuánto
   *  falta»*; los nodos contestan lo primero y **esto contesta lo
   *  segundo**. Sale de `promesa_entrega_desde/hasta`, poblado al
   *  checkout — **dato real, cero motor nuevo**.
   *
   *  🔴 **Y ES UN RANGO, JAMÁS UN MINUTO.** N14 prohíbe el ETA al minuto
   *  en v1 con su razón —*prometer un minuto que no podemos cumplir es
   *  peor que no prometer*— y una ventana **no es eso**: es lo que el
   *  vendedor se comprometió a cumplir, escrito en la base. *La ley
   *  prohíbe la precisión inventada, no la promesa que existe.*
   *
   *  La compone la pantalla (voz de máquina, mono — Ley 3); la pieza no
   *  formatea horas. */
  cuandoLlega?: string
}

const RIEL = 24 // ancho de la columna del conector — el de LineaDeVida
const PUNTO = 10 // diámetro del nodo — el de LineaDeVida
const BARRA = 3 // alto del CONECTOR entre nodos (antes: la barra suelta)
/* 🔴 EL NODO CRECE DE 20 A 32 — G-15, firma del founder sobre el gate de
   S100: *«la escalera mejoró mucho, pero el círculo de cada nodo con su
   glifo tiene que ser MÁS GRANDE»*.

   ⏪ **Lo que decía antes, y por qué su razón sigue viva a medias:** *«20
   sostiene un glifo de 12 y deja la fila por debajo del blanco de 44 —la
   escalera INFORMA, no se toca—, así que no compite con ningún target»*.
   **Esa restricción NO se deroga: 32 sigue por debajo de 44**, así que el
   nodo sigue sin leerse como tocable. *Lo que estaba mal no era el techo:
   era haberse quedado pegado al piso.*

   **De dónde sale el 32, porque no se eligió: se derivó.** Con el glifo
   en 12 el nodo estaba **por debajo del tamaño al que la propia casa
   gatea la legibilidad de un glifo** —§2.9: *todo ícono se gatea a su
   tamaño de diseño Y a 21px*—. Un glifo de 12 nunca pasó ese gate porque
   nunca se lo corrió a ese tamaño. **32 = `spacing[8]`, y su glifo
   derivado da 24, que es el default de `Icono` y está por encima del 21.**

   🔴 **Y EL PAR QUE SE DESARMA DE PASO, que vale más que el número:** el
   glifo entra por SLOT, así que su tamaño lo elegía **el consumidor** —
   hoy, un 12 tecleado en `apps/`. **Dos números que tienen que guardar
   relación, viviendo en dos archivos: eso se separa solo.** Agrandar el
   nodo sin tocar el slot habría dejado un glifo de 12 perdido en un
   círculo de 32, y el defecto habría aparecido en la pantalla y no en
   ningún gate.
   ⇒ **La pieza pasa el `tamano` al slot, DERIVADO del nodo.** El
   consumidor lo recibe; no lo inventa. *Un par que debe coincidir y sale
   de dos cuentas distintas es una bomba con temporizador; derivarlo la
   desarma* (L-284). */
const NODO = 32
/** El glifo, DERIVADO del nodo — nunca tecleado aparte. El 8 es el aire
 *  que el nodo ya tenía (20 − 12), conservado al crecer. */
const GLIFO_EN_NODO = NODO - 8

export function EscaleraEstados({
  pasos,
  registro = 'completa',
  desvio,
  acento = 'control',
  cuandoLlega,
}: EscaleraEstadosProps) {
  const { theme } = useTheme()
  const { t } = useTraduccionUi()

  /** Regla de existencia — ⏪ **ENMENDADA S100-B, y decía de menos.**
   *
   *  Decía *«sin pasos no hay escalera»* y devolvía `null` con
   *  `pasos.length === 0`. **Cierto para la escalera, FALSO para la
   *  pieza:** el desvío es una BANDA que sustituye al camino, no un
   *  peldaño suyo — así que con `pasos: []` + `desvio` esta línea se
   *  tragaba **el único contenido que había**.
   *
   *  🔴 **El caso real, medido (H-04, hallazgo de la pista D):** un
   *  pedido `cancelado` devuelve `pasos: []` **más** `desvio` ⇒ **en la
   *  lista no decía que se había cancelado.** Se veía como un pedido
   *  cualquiera al que le faltaba el progreso.
   *
   *  ⚠️ **Y el guard estaba DUPLICADO un piso más arriba** —
   *  `TarjetaPedido` tenía su propio `pasos.length === 0 ? null`—, así
   *  que curar solo allá no habría cambiado nada: la pieza volvía a
   *  tragárselo acá. *Cuando el mismo criterio vive en dos lugares, el
   *  que se cura es el que se ve, y el otro sigue mandando.*
   *
   *  ⇒ La regla correcta es sobre CONTENIDO, no sobre pasos: **sin
   *  pasos NI desvío no hay nada que decir.** Con desvío solo, la banda
   *  se monta sola — que es exactamente la verdad que hay para contar. */
  if (pasos.length === 0 && desvio === undefined) return null

  /** Sin pasos, lo único que se dibuja es la banda. No es «una escalera
   *  con cero peldaños»: es un hecho suelto — por eso más abajo no se
   *  monta el riel vacío ni se anuncia como barra de progreso. */
  const soloDesvio = pasos.length === 0

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
        {...(soloDesvio
          ? // Sin pasos NO es una barra de progreso: anunciar «0 de 0»
            // sería inventar una escala que no existe. El texto de la
            // banda ya dice el hecho, y con eso alcanza.
            {}
          : {
              accessibilityRole: 'progressbar' as const,
              accessibilityLabel: etiquetaA11y,
              accessibilityValue: { min: 0, max: pasos.length, now: alcanzado },
            })}
        style={{ gap: spacing[1.5] }}
      >
        {/* ☠️ ACÁ VIVÍAN LAS CUATRO BARRAS. Verbatim del founder sobre
            las capturas: *«nosotros tenemos cuatro líneas verdes; Rappi
            llena con círculos cada etapa y le va diciendo al cliente
            dónde está y cuánto falta»*.

            🔴 EL DIAGNÓSTICO, y es de gramática: **una barra solo puede
            decir CUÁNTAS VAN.** No tiene dónde alojar identidad, así que
            el paso hay que nombrarlo aparte y en texto. **Un nodo SÍ
            tiene adentro**: por eso puede decir QUÉ ES sin una palabra.
            *No cambiamos de dibujo por gusto: cambiamos de forma porque
            la vieja no tenía lugar donde poner el significado.* */}
        {/* El riel de nodos solo existe si hay camino. Sin pasos NO se
            monta una fila vacía: un contenedor sin hijos igual aporta su
            `gap` al de arriba, y la banda quedaría con un aire que nadie
            pidió. */}
        {soloDesvio ? null : (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {pasos.map((paso, i) => {
            const lleno = i < alcanzado
            // El conector se llena HASTA el nodo alcanzado. Binario a
            // propósito: un relleno parcial afirmaría un progreso DENTRO
            // del paso, y ese dato no existe (L-139).
            const conectorLleno = i < alcanzado - 1 + (indiceActual >= 0 && !desvio ? 1 : 0)
            return (
              <View key={paso.clave} style={{ flexDirection: 'row', alignItems: 'center', flex: i === pasos.length - 1 ? 0 : 1 }}>
                <View
                  style={{
                    width: NODO,
                    height: NODO,
                    borderRadius: radius.full,
                    alignItems: 'center',
                    justifyContent: 'center',
                    // La gramática que hereda: lo hecho se RELLENA, lo que
                    // espera se CONTORNEA (19.8 leída en el tiempo).
                    backgroundColor: lleno ? color : 'transparent',
                    borderWidth: lleno ? 0 : 1.5,
                    borderColor: theme.bg.border,
                  }}
                >
                  {paso.icono?.({ color: lleno ? theme.bg.base : theme.text.tertiary, lleno, tamano: GLIFO_EN_NODO })}
                </View>
                {i < pasos.length - 1 ? (
                  <View
                    style={{
                      flex: 1,
                      height: BARRA,
                      backgroundColor: conectorLleno ? color : theme.bg.hundido,
                    }}
                  />
                ) : null}
              </View>
            )
          })}
        </View>
        )}
        {pasoNombrado !== undefined || cuandoLlega !== undefined ? (
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing[2] }}>
            {pasoNombrado !== undefined ? (
              <Texto variante="apoyo" color={desvio?.tono === 'alerta' ? 'warning' : undefined}>
                {pasoNombrado}
              </Texto>
            ) : null}
            {/* «cuánto falta», en voz de máquina y solo si hay promesa.
                Con desvío NO se muestra: el camino se cortó y una ventana
                de entrega ahí sería prometer algo que ya no va a pasar. */}
            {cuandoLlega !== undefined && desvio === undefined ? (
              <Texto variante="dato">{cuandoLlega}</Texto>
            ) : null}
          </View>
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
