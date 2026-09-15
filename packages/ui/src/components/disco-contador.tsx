import { Text, View } from 'react-native'

import { palette } from '../tokens/palette'
import { radius } from '../tokens/radius'
import { typography } from '../tokens/typography'

/**
 * ═══════════════════════════════════════════════════════════════════════
 * **EL DISCO DEL CONTADOR — uno solo, para la campana y para el carrito**
 * (S116-B lote 13, recorrido 4 del founder).
 *
 * Su literal: *«el contador es un círculo magenta con el número adentro en
 * blanco, PJS 700, pegado arriba a la derecha del glifo; la pata muere ahí.
 * Con cero, no se dibuja. Misma pieza para campana y carrito.»*
 *
 * ── POR QUÉ ES UN MÓDULO COMPARTIDO Y NO UNA PIEZA MÁS ────────────────
 * Porque *«misma pieza»* se cumple de verdad o no se cumple: la campana
 * monta `Badge` (recibe el ícono ya armado) y el carrito monta
 * `GlifoConContador` (recibe el nombre del glifo). **Son dos envoltorios
 * legítimos con contratos distintos** — lo que tiene que ser uno es **el
 * disco**, y es exactamente lo que vive acá.
 *
 * ⚠️ **No se exporta desde el índice a propósito.** No es una pieza que
 * alguien monte suelta: es geometría compartida, como `caja-de-campo.ts`
 * o `grilla-de-dos.ts`. *Exportarla obligaría a darle entrada de galería a
 * algo que nunca se ve solo.*
 *
 * ── EL COLOR, Y POR QUÉ NO SE HEREDA DEL TEMA ─────────────────────────
 * **Magenta de ACCIÓN y blanco puro, fijos.** ⏪ Antes el disco usaba
 * `theme.accent.control` sobre `theme.bg.base`: un par correcto, medido…
 * **y distinto en cada casa** — en oscuro el «círculo magenta con número
 * blanco» salía ciruela con número lienzo. *Un contador que cambia de
 * color con el tema deja de ser la misma señal en las dos casas*, y la
 * orden dice «misma pieza».
 *
 * **Medido:** blanco sobre `magentaAccion` da **5,13** — pasa el 4,5 de
 * texto (el par ya vive en `verify:contrast` desde el lote 11).
 * ═══════════════════════════════════════════════════════════════════════
 */

/** El disco. **18** sostiene dos cifras sin apretarlas y no tapa el glifo. */
export const DISCO_CONTADOR = 18

/** Arriba de esto el número deja de leerse a este tamaño — y **la salida es
 *  decir «muchos», jamás encoger la letra**: un contador ilegible no cuenta
 *  nada. */
const TOPE = 99

/**
 * El disco, posicionado **arriba a la derecha del glifo que lo porta**.
 * Quien lo monta le da un padre con `position: relative` (cualquier `View`
 * lo es en RN) del tamaño del glifo.
 *
 * ⚠️ **Con `cuenta <= 0` devuelve `null`** — 19.9: *un cero en un contador
 * es ruido con forma de dato.*
 */
export function DiscoContador({ cuenta }: { cuenta: number }) {
  if (cuenta <= 0) return null
  const texto = cuenta > TOPE ? `${TOPE}+` : String(cuenta)
  return (
    <View
      /* El aviso viaja en el label del tocable que lo porta: anunciarlo acá
         sería decir el mismo número dos veces. */
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={{
        position: 'absolute',
        /* **Pegado arriba a la derecha, sobresaliendo.** Un disco contenido
           adentro del glifo le come el dibujo, y el glifo es lo que dice QUÉ
           se está contando. */
        top: -DISCO_CONTADOR / 3,
        right: -DISCO_CONTADOR / 3,
        minWidth: DISCO_CONTADOR,
        height: DISCO_CONTADOR,
        paddingHorizontal: 4,
        borderRadius: radius.full,
        backgroundColor: palette.magentaAccion,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontFamily: typography.family.texto.bold, // PJS 700
          fontSize: typography.size.xs,
          lineHeight: DISCO_CONTADOR,
          color: palette.white,
          /* Tabular: con una y dos cifras el disco no baila al cambiar. */
          fontVariant: ['tabular-nums'],
        }}
      >
        {texto}
      </Text>
    </View>
  )
}
