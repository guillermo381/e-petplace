/**
 * CarritoFlotante — ☠️ **SUPERSEDIDO POR `BurbujaPendientes` (S112-B).**
 *
 * Sigue vivo **sólo como envoltorio delgado**, y con fecha de muerte: el
 * founder pidió una burbuja que lleve **carrito Y mensajes** con abanico
 * cuando hay dos clases, y **no pueden convivir dos discos abajo a la
 * derecha** — que es exactamente el defecto que N25 vino a matar, en su
 * versión más literal: *dos puertas peleando el mismo píxel.*
 *
 * ⚠️ **NO SE MONTA EN NADA NUEVO.** Existe para que el shell y las dos
 * pantallas de despensa sigan compilando mientras C migra.
 *
 * ☠️ **DISPARO DE MUERTE, nombrado para que no quede eterno:** el día que
 * `apps/cliente/src/app/(tabs)/_layout.tsx` monte `BurbujaPendientes`, este
 * archivo y el alias `COLA_CARRITO_FLOTANTE` se borran **en ese mismo
 * commit**. *El montaje y el retiro van juntos: si se monta la nueva y queda
 * ésta, hay dos discos; si se retira ésta sin montar la nueva, no hay
 * ninguna y la tienda no se puede pagar* — el mismo intervalo que esta pieza
 * ya declaró cuando mató la puerta del encabezado.
 *
 * **Toda la letra de por qué el disco es como es** —los 56 dp, el F-OCRE, el
 * contador en tinta, el overlay puro que derogó el montaje como `pie`, la
 * cola del scroll— **vive ahora en `BurbujaPendientes` y no se duplica acá**:
 * dos cabeceras diciendo lo mismo divergen, y la copia vieja es la que
 * alguien lee.
 */

import { BurbujaPendientes, COLA_BURBUJA_PENDIENTES } from './BurbujaPendientes'

/** ☠️ Alias de `COLA_BURBUJA_PENDIENTES`. Muere con este archivo.
 *
 *  ⚠️ **Y el nombre ya miente:** la burbuja puede existir **sin carrito**
 *  —sólo con mensajes—, así que esta cola no es del carrito. */
export const COLA_CARRITO_FLOTANTE = COLA_BURBUJA_PENDIENTES

export interface CarritoFlotanteProps {
  /** Unidades en el carrito. **`0` ⇒ la pieza no se dibuja.** */
  cuenta: number
  onAbrir: () => void
  /** La voz de la casa, compuesta por la pantalla. */
  etiqueta: string
  /** Cuánto levantarlo desde el borde inferior, en dp. */
  aireInferior?: number
}

export function CarritoFlotante({ cuenta, onAbrir, etiqueta, aireInferior }: CarritoFlotanteProps) {
  return (
    <BurbujaPendientes
      /* Una sola clase ⇒ el toque va directo y el abanico no puede nacer.
         `titulo` sólo se dibuja DENTRO del abanico, así que en este camino no
         llega a ninguna pantalla; se pasa la misma voz para no inventar texto. */
      pendientes={[{ clase: 'carrito', cuenta, onAbrir, etiqueta, titulo: etiqueta }]}
      etiquetaAbanico={etiqueta}
      aireInferior={aireInferior}
    />
  )
}
