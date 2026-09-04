/**
 * LA GEOMETRÍA DE LA PRESENCIA — fuera del componente A PROPÓSITO (S113-B).
 *
 * Vive en su propio módulo **para que su gate pueda importarla sin arrastrar
 * `react-native`** (L-175, misma razón que `clasesVivas`).
 *
 * ⏪ **ACÁ VIVÍA UNA HUELLA, Y MURIÓ EN EL TELÉFONO (lote 0.1).** El orbe
 * viajaba al centro inferior, crecía a 58 y abría cuatro dedos en posiciones
 * de pata. **Lo que la reemplaza es una FILA ASCENDENTE sobre el eje del
 * orbe, que no se mueve de su esquina.** Con ella se fueron `POSICIONES_DEDOS`
 * y todo el aparato del viaje: *un puente que sobrevive a su río manda al
 * próximo a construir otro* (`L-395`).
 */

/* ── LOS NÚMEROS, dictados por el founder sobre el aparato ─────────────── */

/** El orbe en reposo. */
export const ORBE = 48
/** El orbe abierto: **crece 4 px y NO se mueve.** *Un orbe que viaja obliga
 *  al ojo a buscarlo; uno que se enciende donde está ya se encontró.* */
export const ORBE_ABIERTO = 52
/** El resplandor violeta que da presencia. **Es el único halo en reposo.** */
export const RESPLANDOR = 24
/** Cada dedo de la fila. ≥ 44 (Ley 8): el objetivo táctil es el círculo. */
export const DEDO = 48
/** La pastilla de un pendiente. **44 y no 36:** la altura visual ES el
 *  objetivo táctil, así no hay que inventar un área invisible más grande que
 *  lo que se ve. */
export const PASTILLA = 44
/** Entre un nodo y el siguiente, borde a borde. */
export const SEPARACION = 12
/** El aire desde el borde de la pantalla. **Mismo valor que
 *  `BurbujaPendientes`** — es la misma puerta, no una segunda (N25). */
export const AIRE_BORDE = 20

/** Los arcos del estado atento. */
export const ARCO_GRADOS = 60
export const ARCO_SEPARACION = 12
export const ARCO_GROSOR = 3

/** La brasa, en fracción del DIÁMETRO del cuerpo. **Tope duro: 0,40.**
 *  ⏪ El primer orbe la tenía al 54 % del RADIO —o sea más de la mitad del
 *  cuerpo— y el founder lo vio ocre en el teléfono. *No era el color: era el
 *  tamaño.* Su gate la mide en el SVG, no en este número. */
export const BRASA = { cx: 0.56, cy: 0.62, diametro: 0.4 } as const

/** Las tres cosas que pueden estar pendientes. **Crece acá y rompe en el mapa
 *  de colores de la pieza**, que es `Record` completo a propósito. */
export type ClaseCoach = 'chat' | 'pedidos' | 'avisos'

export interface PendientesCoach {
  chat: number
  pedidos: number
  /** 🔴 **`null` NO ES CERO.** `0` = el motor miró y no hay. `null` = **el
   *  motor no sabe**. Las dos callan el arco —*lo que el motor no sabe no se
   *  dibuja*— pero por razones opuestas, y el día que la pieza quiera decir
   *  «no pudimos leer tus avisos» el dato ya está acá. */
  avisos: number | null
}

export interface Arco {
  clase: ClaseCoach
  /** Grados, **0 = las 12 en punto, creciendo en sentido horario.** */
  desde: number
  hasta: number
}

/** Cuánto de verdad hay de cada clase. `null` y `0` se van juntos.
 *
 *  ⚠️ **El orden es CHAT → PEDIDOS → AVISOS y es el mismo en todos lados**
 *  —los arcos del halo y la fila de pastillas—. *El pedido enumeró las
 *  pastillas en otro orden («Carrito · 1, Chat · 2»), pero eso era un ejemplo
 *  del CONTENIDO; un orden estable en toda la pieza vale más que replicar el
 *  orden de una enumeración informal.* Se declara para que nadie lo lea como
 *  descuido. */
export function clasesConAlgo(p: PendientesCoach): ClaseCoach[] {
  const vivas: ClaseCoach[] = []
  if (p.chat > 0) vivas.push('chat')
  if (p.pedidos > 0) vivas.push('pedidos')
  if (p.avisos !== null && p.avisos > 0) vivas.push('avisos')
  return vivas
}

/**
 * Los arcos del halo, **repartidos y no tecleados**: el bloque se centra en
 * las 12 en punto, ancho `n·60 + (n−1)·12`, arrancando en `−ancho/2`.
 *
 * 🔴 **Se DERIVA del conteo** por lo mismo que el ancla de la gota de N27 se
 * deriva de la silueta: con posiciones tecleadas, pasar de dos clases a tres
 * deja el conjunto corrido y **nadie lo ve como un error** — se ve como un
 * halo un poco torcido.
 */
export function arcosDe(p: PendientesCoach): Arco[] {
  const vivas = clasesConAlgo(p)
  if (vivas.length === 0) return []
  const paso = ARCO_GRADOS + ARCO_SEPARACION
  const ancho = vivas.length * ARCO_GRADOS + (vivas.length - 1) * ARCO_SEPARACION
  const inicio = -ancho / 2
  return vivas.map((clase, i) => ({
    clase,
    desde: inicio + i * paso,
    hasta: inicio + i * paso + ARCO_GRADOS,
  }))
}

/** Las pastillas de pendiente de la fila abierta. **Sólo las que tengan
 *  algo**, en el orden estable de `clasesConAlgo`. Los avisos NO tienen
 *  pastilla: ya se dicen en el halo, que es donde el encargo los puso. */
export function pastillasDe(p: PendientesCoach): Array<{ clase: 'chat' | 'pedidos'; cuenta: number }> {
  const salida: Array<{ clase: 'chat' | 'pedidos'; cuenta: number }> = []
  if (p.chat > 0) salida.push({ clase: 'chat', cuenta: p.chat })
  if (p.pedidos > 0) salida.push({ clase: 'pedidos', cuenta: p.pedidos })
  return salida
}

/* ── LA FILA ASCENDENTE ──────────────────────────────────────────────────
 * Todo se mide desde el CENTRO DEL ORBE, que es el único punto fijo: el orbe
 * no se mueve al abrir. *Medir desde el borde de la pantalla habría atado la
 * fila al ancho del aparato, que es justo lo que no la define.* */

/** Dónde vive el orbe: esquina inferior derecha. `izquierda` y `abajo` son la
 *  caja del ORBE en reposo, no la del resplandor. */
export function anclaOrbe(ancho: number, aireInferior = 0): { izquierda: number; abajo: number } {
  return { izquierda: ancho - AIRE_BORDE - ORBE, abajo: AIRE_BORDE + aireInferior }
}

/** El eje vertical por el que sube la fila: el centro del orbe. */
export function ejeDeLaFila(ancho: number, aireInferior = 0): { x: number; abajo: number } {
  const a = anclaOrbe(ancho, aireInferior)
  return { x: a.izquierda + ORBE / 2, abajo: a.abajo + ORBE / 2 }
}

export type NodoFila = { tipo: 'pastilla'; clase: 'chat' | 'pedidos'; cuenta: number } | { tipo: 'dedo'; indice: number }

/**
 * Los nodos de la fila, **de abajo hacia arriba**: primero las pastillas de
 * pendiente pegadas al orbe, después los cuatro dedos.
 *
 * 🔴 **La altura de cada nodo SE ACUMULA, no se indexa.** Con una fórmula
 * `i * paso` habría que suponer que todos los nodos miden lo mismo —y no lo
 * miden: la pastilla es 44 y el dedo 48—. *El día que uno de los dos cambie
 * de alto, una fórmula por índice deja la fila con solapes de 4 px que nadie
 * lee como error: se leen como un espaciado descuidado.*
 */
export function nodosDeLaFila(p: PendientesCoach, cantidadDedos = 4): Array<NodoFila & { alto: number }> {
  const nodos: Array<NodoFila & { alto: number }> = []
  for (const q of pastillasDe(p)) nodos.push({ tipo: 'pastilla', clase: q.clase, cuenta: q.cuenta, alto: PASTILLA })
  for (let i = 0; i < cantidadDedos; i++) nodos.push({ tipo: 'dedo', indice: i, alto: DEDO })
  return nodos
}

/**
 * A qué altura queda el CENTRO de cada nodo, medido desde el borde inferior
 * de la pantalla. El primero arranca a `SEPARACION` del borde del orbe
 * ABIERTO —que es el que se ve mientras la fila existe—.
 */
export function alturasDeLaFila(
  p: PendientesCoach,
  ancho: number,
  aireInferior = 0,
  cantidadDedos = 4,
): number[] {
  const eje = ejeDeLaFila(ancho, aireInferior)
  /* El borde de arriba del orbe abierto: desde ahí sube todo. */
  let borde = eje.abajo + ORBE_ABIERTO / 2
  return nodosDeLaFila(p, cantidadDedos).map((n) => {
    const centro = borde + SEPARACION + n.alto / 2
    borde = centro + n.alto / 2
    return centro
  })
}

/* ── EL MOVIMIENTO, COMO DECISIÓN Y NO COMO `if` SUELTO ──────────────────
 * 🔴 **Existe para que su gate pueda MEDIRLO.** *«Con reduce-motion no se
 * monta la animación»* es una afirmación sobre el comportamiento, y sin
 * extraerla habría que montar React para comprobarla — o creerle a un `grep`,
 * que es lo mismo que suponerlo (`L-459`). */
export interface EntornoMovimiento {
  /** `reduce-motion` del sistema **o** memorial. */
  quieta: boolean
  /** La fila está desplegada. */
  abierta: boolean
}

export interface MovimientoCoach {
  respira: boolean
  barre: boolean
  /** Los nodos entran escalonados. Sin esto, aparecen de una. */
  escalona: boolean
}

export function movimientoCoach({ quieta, abierta }: EntornoMovimiento): MovimientoCoach {
  if (quieta) return { respira: false, barre: false, escalona: false }
  /* Abierta tampoco respira ni barre, y eso no es reduce-motion: es que la
     esfera ya no está dormida — *un cuerpo que respira mientras alguien lo
     está usando parece que no escuchó.* */
  return { respira: !abierta, barre: !abierta, escalona: true }
}
