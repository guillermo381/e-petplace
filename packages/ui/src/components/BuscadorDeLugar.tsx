/**
 * BuscadorDeLugar — buscar una dirección y elegirla de la lista.
 *
 * `LETRA_RECORRIDO_DESPENSA_S96` §7: *"las direcciones se validan contra
 * Google Places, con alias, campo de referencia separado, instrucciones
 * de entrega y punto en el mapa. Se agregan desde el momento de comprar,
 * sin salir del flujo."*
 *
 * Pedido de D con su contrato de datos ya vivo: `buscarLugares` →
 * `PrediccionLugar {placeId, textoPrincipal, textoSecundario|null}`.
 * **Las llamadas las hace la pantalla** — esta pieza no busca nada: B no
 * toca datos, toca forma.
 *
 * ── LOS TRES ESTADOS QUE NO SE PUEDEN CONFUNDIR (Ley 13) ───────────────
 * `cargando` · con resultados · **buscó y no encontró**. El tercero es el
 * que las pantallas suelen tapar, y acá es el que más importa: **§7 dice
 * que Places falla en Quito más de lo que uno espera** —urbanizaciones
 * nuevas, casas sin numeración—, así que *"no encontramos esa
 * dirección"* no es un caso borde: es el camino por el que va a entrar
 * una parte real de las direcciones de la ciudad.
 *
 * Por eso `sinResultados` **no es un estado mudo**: la pantalla pasa su
 * voz Y su salida (*"ponelo a mano en el mapa"*). Un vacío sin camino
 * deja al usuario sin dirección y sin idea de qué hacer — Ley 17.5.
 *
 * ⚠️ **`cargando` NO es lo mismo que "sin resultados"**, y el orden del
 * render lo respeta: mientras busca, la pieza jamás dice que no encontró.
 * Es el error clásico que la Ley 13 nombra —el vacío disfrazando una
 * carga— y acá tendría una consecuencia concreta: mandar a poner el pin
 * a mano a alguien cuya dirección sí existía.
 *
 * ── LO QUE NO HACE ─────────────────────────────────────────────────────
 * No guarda, no debounce-a, no maneja la sesión de Places (que es de la
 * pantalla porque tiene costo por sesión y cierra en `resolverLugar`).
 * No dibuja el pin: eso es `PinMovible`, y son dos piezas a propósito —
 * buscar y ajustar son dos actos, y el segundo sobrevive cuando el
 * primero falla.
 */

import { View } from 'react-native'

import { Campo } from './Campo'
import { Celda } from './Celda'
import { Esqueleto } from './Esqueleto'
import { Texto } from './Texto'
import { spacing } from '../tokens/spacing'

export type PrediccionDeLugar = {
  /** El `placeId` de Places. Identidad opaca — jamás se muestra. */
  id: string
  /** "Av. Shyris N34-120" */
  principal: string
  /** "Quito, Ecuador" */
  secundaria?: string
}

export type BuscadorDeLugarProps = {
  /** El texto tipeado. La pantalla es dueña del valor. */
  valor: string
  onCambiarTexto: (texto: string) => void
  predicciones: PrediccionDeLugar[]
  onElegir: (id: string) => void
  /** Mientras Places responde. Ver la advertencia del encabezado. */
  cargando?: boolean
  /** Label del campo — voz de la casa. */
  label: string
  marcador?: string
  /**
   * La voz del "buscó y no encontró". **Con su salida**, no sola: sin
   * camino, el vacío abandona (Ley 17.5). Ausente = la pieza no dibuja
   * nada cuando no hay resultados, y eso solo es legal si la pantalla
   * pone el camino en otro lado.
   */
  sinResultados?: string
}

export function BuscadorDeLugar({
  valor,
  onCambiarTexto,
  predicciones,
  onElegir,
  cargando = false,
  label,
  marcador,
  sinResultados,
}: BuscadorDeLugarProps) {
  // Nadie buscó todavía: ni lista, ni vacío, ni esqueleto. El silencio
  // antes de la primera letra no es un estado que haya que dibujar.
  const busco = valor.trim().length > 0

  return (
    <View style={{ gap: spacing[2] }}>
      <Campo
        label={label}
        placeholder={marcador}
        value={valor}
        onChangeText={onCambiarTexto}
        autoCorrect={false}
        // La dirección la escribe una persona sobre su propia casa: el
        // teclado no la corrige ni la capitaliza a su gusto.
        autoCapitalize="none"
      />

      {!busco ? null : cargando ? (
        // Esqueleto imitando el layout final (Ley 13), jamás un spinner
        // ni un texto de "buscando" que empuje la lista al llegar.
        <View style={{ gap: spacing[2] }}>
          <Esqueleto alto={44} />
          <Esqueleto alto={44} />
        </View>
      ) : predicciones.length > 0 ? (
        <View>
          {predicciones.map((p) => (
            <Celda
              key={p.id}
              interactiva
              accessibilityRole="button"
              titulo={p.principal}
              subtitulo={p.secundaria}
              onPress={() => onElegir(p.id)}
            />
          ))}
        </View>
      ) : sinResultados === undefined ? null : (
        <Texto variante="apoyo">{sinResultados}</Texto>
      )}
    </View>
  )
}
