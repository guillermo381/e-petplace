/**
 * SenalesAdoptable — LO QUE HAY QUE SABER ANTES DE ENAMORARSE (S111-B).
 *
 * `LETRA_ADOPCION` §3: la ficha del adoptable lleva *«señales operativas
 * (urgente, pareja vinculada, tiempo en rescate, ubicación aproximada —
 * **jamás la dirección exacta**)»*.
 *
 * Son cuatro hechos heterogéneos que comparten UN trabajo: **condicionan la
 * decisión antes de que se tome.** Quien se enamora de una foto y descubre
 * después que el animal viene con un hermano inseparable no tomó una decisión
 * informada; se llevó una sorpresa. Por eso viven juntas y arriba.
 *
 * ── 🔴 LA LEY DE LA UBICACIÓN, Y LO QUE ESTA PIEZA SÍ Y NO PUEDE HACER ────
 * §3 prohíbe la dirección exacta. La pieza **no acepta coordenadas ni campos
 * de dirección**: la señal de lugar es `{ tipo: 'zona', voz }`, una sola
 * cadena que la pantalla compone. ⇒ *pasar un `lat`/`lon` acá no compila.*
 *
 * ⚠️ **Y acá va el límite honesto, porque un guard que promete de más es peor
 * que ninguno:** esto **NO impide** que una pantalla escriba una dirección
 * exacta DENTRO de esa cadena. Ninguna pieza de presentación puede inspeccionar
 * un string y saber si es «Cumbayá» o «Av. Interoceánica 412». **Lo que la
 * pieza cierra es la puerta ancha —el par de coordenadas— y lo que hace con la
 * angosta es dejar la ley escrita donde el próximo la va a leer.** La
 * ofuscación real es del motor, y tiene precedente medido en la casa: S84 sacó
 * `lat`/`lon` de `v_prestadores_publicos` y desplazó el centro de forma
 * **estable por id**, porque *un ofuscado que varía no ofusca: promedia.*
 *
 * ── LAS CUATRO SEÑALES Y POR QUÉ CADA UNA SE VE COMO SE VE ────────────────
 * · `urgente` → `atencion` (ámbar). Pide acción **a favor** del animal; no es
 *   un defecto suyo. Jamás `danger`: el rojo acusaría al que necesita ayuda.
 * · `pareja_vinculada` → `capa: 'comunidad'`. **No es un aviso: es un hecho de
 *   vínculo**, y adopción es COMUNIDAD (ley 10 de `DIRECCION_ARTE`). Es la
 *   señal más cara de omitir — se descubre en la entrega, cuando ya es tarde.
 * · `tiempo_en_rescate` → `info`. Un hecho neutro. **Jamás se pinta de alarma
 *   aunque el número sea grande:** dos años esperando no es una falla del
 *   animal, y es exactamente el dato con el que §4 arma «Llevan más tiempo
 *   esperando» — *el que más lo necesita gana el mejor lugar.*
 * · `zona` → `info`. Un dato de logística, no una alerta.
 *
 * ── CERO DICCIONARIO ADENTRO (precedente `EscaleraEstados`) ───────────────
 * Las palabras llegan por prop, incluida la de `urgente`. La pieza no sabe
 * decir «Urgente» en ningún idioma: la voz es de cada casa y el riel de i18n
 * vive en las apps (Ley 3). Tampoco formatea el tiempo — `«2 años en rescate»`
 * lo arma la pantalla con `fechaCortaMono`/su riel, porque un formateo de
 * fecha artesanal acá sería el que la casa ya barrió.
 *
 * ── LO QUE NO HACE, y es una decisión ─────────────────────────────────────
 * **No ordena, no puntúa, no destaca una sobre otra.** Las señales se dibujan
 * en el orden en que la pantalla las pasa. Una jerarquía visual entre ellas
 * sería un score de urgencia, y §10.8 corta el score de match visible.
 * **Y no se monta vacía:** sin señales, la pantalla no la monta — un renglón
 * de señales en blanco afirma «no hay nada que saber», que es distinto de
 * «nadie lo midió».
 *
 * Sin animación (Ley 6/13). Memorial degrada por token, no por rama.
 */
import { View } from 'react-native'
import { spacing } from '../tokens/spacing'
import { Insignia } from './Insignia'
import { Texto } from './Texto'

export type SenalAdoptable =
  | { tipo: 'urgente'; voz: string }
  | { tipo: 'pareja_vinculada'; voz: string }
  | { tipo: 'tiempo_en_rescate'; voz: string }
  /**
   * 🔴 Ubicación APROXIMADA (§3). Una sola cadena ya compuesta por la
   * pantalla — la pieza no acepta coordenadas. Ver el límite honesto en el
   * encabezado: esto cierra la puerta ancha, no la angosta.
   */
  | { tipo: 'zona'; voz: string }

export type SenalesAdoptableProps = {
  /** En el orden en que la pantalla las quiera. Sin señales, no se monta. */
  senales: SenalAdoptable[]
  /** Rótulo de sección, opcional. */
  rotulo?: string
}

export function SenalesAdoptable({ senales, rotulo }: SenalesAdoptableProps) {
  // Regla de existencia: sin señales no hay renglón (Ley 13 — el vacío
  // decorativo afirma algo que no se midió).
  if (senales.length === 0) return null

  return (
    <View style={{ gap: spacing[2] }}>
      {rotulo === undefined ? null : <Texto variante="seccion">{rotulo}</Texto>}

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: spacing[2],
        }}
      >
        {senales.map((senal) =>
          senal.tipo === 'pareja_vinculada' ? (
            // Vínculo, no aviso: va por CAPA (comunidad), no por estado.
            <Insignia key={senal.tipo} capa="comunidad" etiqueta={senal.voz} />
          ) : (
            <Insignia
              key={senal.tipo}
              estado={senal.tipo === 'urgente' ? 'atencion' : 'info'}
              etiqueta={senal.voz}
            />
          ),
        )}
      </View>
    </View>
  )
}
