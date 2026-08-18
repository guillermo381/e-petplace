/**
 * FichaRepartidor — QUIÉN VA A TOCAR EL TIMBRE (S100d-B · punto 25 del gate).
 *
 * ═══════════════════════════════════════════════════════════════════
 * **Firma del founder:** punto 25, *«ficha del repartidor: **no está**»* ·
 * punto 24, *«al arrastrar no sale la ficha del conductor como en Uber»*.
 * **Pieza de B · la monta la pista D** en el seguimiento de EN CAMINO.
 * ═══════════════════════════════════════════════════════════════════
 *
 * *No es un registro: es la ficha de la persona que va a tocar el timbre de
 * una familia.* Esa frase —heredada de la receta L2 de S99— es la que decide
 * todo lo de abajo.
 *
 * ── 🔴 LA PLACA MANDA, Y NO ES UNA PREFERENCIA DE JERARQUÍA ────────────
 * **Medido sobre `docs/diseno/referencias/referencia-uber-tarjeta-del-conductor.jpeg`:**
 * la placa (`PDL8812`) es **el texto más grande de la tarjeta** —~1,25× el
 * nombre—, con el vehículo en gris debajo y el nombre abajo, más chico.
 *
 * **Y el porqué es de la calle, no del layout:** *la placa es lo único que
 * la familia puede VERIFICAR desde la puerta.* Un nombre no se comprueba —
 * quien llega dice el que quiera—; una placa se lee en la moto que está
 * estacionada ahí. **Por eso preside, y por eso va en MONO** (Ley 3: dato de
 * máquina; en sans se confunden `0/O` y `1/l/I`, y una placa mal leída es
 * una moto que nadie encuentra).
 *
 * ⏪ **Lo que corrige, medido por la pista B en S100c:** la composición a
 * mano tenía **nombre 24,2 `primary` · placa 18,8 mono `secondary`** — o sea
 * **la jerarquía invertida** respecto de la referencia y del uso real.
 *
 * ── ⛔ LA PLACA NO VA EN `CodigoAEscala`, Y ES LA DECISIÓN MÁS FINA ────
 * **Razón de la pista D, adoptada entera:** en la MISMA hoja vive **el
 * código de la puerta** en esa escala. Dos números mono grandes conviviendo,
 * donde **uno se DICE y el otro se VERIFICA**, es cómo alguien termina
 * dictándole al repartidor la placa de su propia moto. ⇒ la placa vive un
 * escalón por debajo de ese registro (`datoMd`), y **nadie la sube**.
 *
 * ── 🔴 SIN PLACA ES PRIMERA CLASE, NO UN BORDE ────────────────────────
 * **El dato vivo lo trajo D, medido contra la base el 18-ago: de los DOS
 * pedidos `en_camino`, uno tiene placa y vehículo y el otro tiene CERO
 * vehículos** ⇒ *«ficha sin placa» es 1 de 2 en la cuenta del gate.*
 *
 * ⇒ Sin placa **no queda un hueco, ni un guion, ni un «—»**: el bloque de
 * la placa no se dibuja y **el nombre sube a presidir**. *Una ficha que se
 * ve rota cuando falta un dato opcional es la pieza mal hecha, no el dato.*
 * Es 19.9 (el nulo no se pinta) aplicada al elemento que más pesa.
 *
 * ── EL HUECO DE LA FOTO: MARCADO Y DIGNO ──────────────────────────────
 * **La foto no existe todavía** (vive en el bucket de documentos y su
 * camino sale en otra sesión). Hasta entonces el círculo **se dibuja igual**,
 * hundido, con el glifo `cuenta` y su voz para el lector.
 *
 * ⛔ **JAMÁS un avatar genérico con cara.** Y es ley de la pieza, no default
 * del consumidor: *una cara inventada le dice a la familia «éste es quien
 * viene», y no lo es.* **Un hueco declarado es honesto; una cara prestada es
 * una afirmación falsa** sobre la persona que va a golpear su puerta.
 * *El hueco además hace visible la deuda: una foto que falta y no se ve, no
 * se paga nunca.*
 *
 * ── LO QUE LA REFERENCIA TIENE Y ACÁ NO ENTRA, con su razón ───────────
 * Uber trae **rating** (`★ 4.99`), **«Top-rated driver»** y una fila de
 * **acciones** (mensaje · llamada · más).
 * · **rating y distintivo: NO.** No tenemos el dato, y `MODELO_LOYALTY` §2/§3
 *   prohíbe rankear personas. *Dibujar un promedio que no existe sería la
 *   pantalla mintiendo sobre un proceso inexistente.*
 * · **acciones: slot que existe y hoy nadie pasa.** D lo confirmó: la llamada
 *   directa está excluida por letra en esta superficie. **Ausente ⇒ la fila
 *   no se dibuja** (nada de una banda vacía esperando).
 * *Se copia el principio, jamás el widget.*
 *
 * ── LOS TRES TEMAS Y `reduce-motion` (N15) ────────────────────────────
 * Sin un solo color escrito: todo sale de slots, así que claro, oscuro y
 * **memorial** resuelven solos. **No anima nada** — la ficha aparece con el
 * dato de su hoja y se va con él; no hay nada que degradar, y se declara en
 * vez de omitirse.
 */

import { type ReactNode } from 'react'
import { Image, View } from 'react-native'

import { Icono } from './Icono'
import { Tarjeta } from './Tarjeta'
import { Texto } from './Texto'
import { radius } from '../tokens/radius'
import { spacing } from '../tokens/spacing'
import { useTheme } from '../ThemeProvider'

/** El círculo de la persona. 48 es el tamaño con el que una cara se
 *  reconoce en una fila sin volverse el sujeto de la tarjeta. */
const FOTO = 48

export interface FichaRepartidorProps {
  /** Siempre hay nombre: es lo mínimo que la familia tiene que saber. */
  nombre: string
  /**
   * `null` = **no hay vehículo cargado**, y es 1 de 2 casos vivos hoy (ver
   * la cabecera). Sin placa el nombre pasa a presidir.
   */
  placa?: string | null
  /** «Moto roja» — ya compuesto por la pantalla, que es la que conoce el
   *  catálogo. La pieza no arma frases con datos que no tiene. */
  vehiculo?: string | null
  /** Hoy siempre ausente. Cuando llegue, entra por acá sin tocar nada más. */
  fotoUrl?: string
  /** La voz del hueco para el lector de pantalla — *«Todavía no tenemos su
   *  foto»*. **Obligatoria:** un círculo mudo no dice nada a quien no ve. */
  etiquetaFoto: string
  /** Mensaje / llamada, si algún día esta superficie los tiene. **Ausente ⇒
   *  no se dibuja la fila.** */
  acciones?: ReactNode
}

export function FichaRepartidor({
  nombre,
  placa = null,
  vehiculo = null,
  fotoUrl,
  etiquetaFoto,
  acciones,
}: FichaRepartidorProps) {
  const { theme } = useTheme()
  const hayPlaca = placa !== null && placa !== undefined && placa.trim() !== ''

  return (
    <Tarjeta>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
        {/* EL HUECO DE LA FOTO — dibujado, hundido y con voz. Ver la
            cabecera: jamás una cara prestada. */}
        <View
          accessible
          accessibilityLabel={etiquetaFoto}
          style={{
            width: FOTO,
            height: FOTO,
            borderRadius: radius.full,
            overflow: 'hidden',
            backgroundColor: theme.bg.hundido,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {fotoUrl === undefined ? (
            <Icono nombre="cuenta" tamano={24} registro="tinta" tinta={theme.text.tertiary} />
          ) : (
            <Image source={{ uri: fotoUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          )}
        </View>

        <View style={{ flex: 1, gap: spacing[1] }}>
          {/* LA PLACA PRESIDE — mono, y un escalón por encima del nombre.
              Sin placa este bloque NO EXISTE y el nombre queda arriba: no
              hay hueco que rellenar (ver la cabecera). */}
          {hayPlaca ? (
            <>
              <Texto variante="datoMd">{placa}</Texto>
              <Texto variante="cuerpo">{nombre}</Texto>
            </>
          ) : (
            <Texto variante="seccion">{nombre}</Texto>
          )}

          {/* EL VEHÍCULO, en apoyo. Es lo que la familia mira ANTES de leer
              la placa —el color y el tipo se ven desde la ventana—, pero no
              identifica: hay muchas motos rojas y una sola con esa placa. */}
          {vehiculo === null || vehiculo === undefined ? null : (
            <Texto variante="apoyo" color="secondary">
              {vehiculo}
            </Texto>
          )}
        </View>
      </View>

      {acciones === undefined ? null : (
        <View style={{ flexDirection: 'row', gap: spacing[2], marginTop: spacing[4] }}>{acciones}</View>
      )}
    </Tarjeta>
  )
}
