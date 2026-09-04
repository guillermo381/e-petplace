/**
 * LA GEOMETRÍA DE LA PRESENCIA — fuera del componente A PROPÓSITO (S113-B · lote 0).
 *
 * Vive en su propio módulo **para que su gate pueda importarla sin arrastrar
 * `react-native`** — el mismo motivo por el que `clasesVivas` salió de
 * `BurbujaPendientes` y `mismaFila` de `SuperficieChat` (L-175: se ensancha,
 * no se copia).
 *
 * 🔴 **Es la mitad del rojo que los tipos NO pueden ver.** Que los atajos sean
 * exactamente cuatro lo prueba el compilador (la prop es una TUPLA); que
 * `avisos: null` y `avisos: 0` produzcan **el mismo dibujo por razones
 * distintas** es una decisión de runtime, y sin extraerla habría que montar
 * React para medirla.
 */

/* ── LOS NÚMEROS DEL ENCARGO ─────────────────────────────────────────────
 * Dictados por el founder en el lote 0. Viven acá y **ninguno se expone como
 * prop**: son la forma de la presencia, no una preferencia de la pantalla. */

/** El orbe dormido. */
export const ORBE = 48
/** El halo alrededor: 66 de diámetro, 1,5 de grosor. */
export const HALO = 66
export const HALO_GROSOR = 1.5
/** El resplandor que da presencia sin agrandar. */
export const RESPLANDOR = 24
/** La almohadilla: el orbe crecido, ya despierto. */
export const ALMOHADILLA = 58
/** Cada dedo. **≥ 44 (Ley 8): el objetivo táctil es el círculo entero.** */
export const DEDO = 48
/** Los arcos del estado atento. */
export const ARCO_GRADOS = 60
export const ARCO_SEPARACION = 12
export const ARCO_GROSOR = 3

/** El brillo interior, en fracción del diámetro: centro y radio. **Descentrado
 *  a propósito** — un brillo en el centro geométrico se lee como un botón con
 *  degradé; corrido arriba-izquierda se lee como una esfera con una fuente de
 *  luz. *Es la diferencia entre material y relleno.* */
export const BRILLO = { cx: 0.56, cy: 0.62, r: 0.54 } as const

/** Las cuatro posiciones de pata, respecto del CENTRO de la almohadilla.
 *
 *  ⚠️ **`y` positivo es HACIA ARRIBA** (los dedos suben desde la almohadilla).
 *  Se declara porque en React Native `top` crece hacia abajo: quien monte
 *  invierte el signo una vez, en la pieza, y el arnés mide estos números —
 *  *no los del layout, que ya son una traducción.* */
export const POSICIONES_DEDOS = [
  { dx: -62, dy: 58 },
  { dx: -24, dy: 96 },
  { dx: 24, dy: 96 },
  { dx: 62, dy: 58 },
] as const

/** Las tres cosas que pueden estar pendientes. **Crece acá y rompe en el mapa
 *  de colores de la pieza**, que es `Record` completo a propósito: *una cuarta
 *  clase no puede entrar sin que alguien decida su color.* */
export type ClaseCoach = 'chat' | 'pedidos' | 'avisos'

export interface PendientesCoach {
  chat: number
  pedidos: number
  /** 🔴 **`null` NO ES CERO, y es la distinción que el encargo nombró.**
   *  `0` = el motor miró y no hay avisos. `null` = **el motor no sabe**.
   *  Las dos callan el arco —*lo que el motor no sabe no se dibuja*— pero
   *  por razones opuestas, y el día que la pieza quiera decir «no pudimos
   *  leer tus avisos» la información ya está acá. *Colapsar `null` a `0` al
   *  entrar habría tirado el dato en la puerta.* */
  avisos: number | null
}

export interface Arco {
  clase: ClaseCoach
  /** Grados, **0 = las 12 en punto, creciendo en sentido horario.** */
  desde: number
  hasta: number
}

/** Cuánto de verdad hay de cada clase. `null` y `0` se van juntos. */
export function clasesConAlgo(p: PendientesCoach): ClaseCoach[] {
  const vivas: ClaseCoach[] = []
  if (p.chat > 0) vivas.push('chat')
  if (p.pedidos > 0) vivas.push('pedidos')
  if (p.avisos !== null && p.avisos > 0) vivas.push('avisos')
  return vivas
}

/**
 * Los arcos del halo, **repartidos y no tecleados**.
 *
 * El bloque de arcos se centra en las 12 en punto: ancho total
 * `n·60 + (n−1)·12`, arrancando en `−ancho/2`. Con uno queda `[−30, 30]`; con
 * tres, `[−102,−42] · [−30,30] · [42,102]`.
 *
 * 🔴 **Se DERIVA del conteo por la misma razón que el ancla de la gota se
 * deriva de la silueta (N27):** con posiciones tecleadas, pasar de dos clases
 * a tres deja el conjunto corrido y **nadie lo ve como un error** — se ve como
 * un halo un poco torcido.
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

/**
 * Las pastillas de color que acompañan a la almohadilla abierta: chat a la
 * izquierda, pedidos a la derecha. **Sólo las que tengan algo.**
 *
 * ⚠️ **Avisos NO tiene pastilla, y es una decisión.** El encargo nombra dos
 * («chat a la izquierda, pedidos a la derecha») y hay dos lados de la
 * almohadilla. *Una tercera pastilla tendría que ir arriba o abajo — arriba
 * están los dedos y abajo la voz.* Los avisos ya se dicen en el halo, que es
 * donde el encargo los puso.
 */
export function pastillasDe(p: PendientesCoach): Array<{ clase: 'chat' | 'pedidos'; cuenta: number; lado: 'izquierda' | 'derecha' }> {
  const salida: Array<{ clase: 'chat' | 'pedidos'; cuenta: number; lado: 'izquierda' | 'derecha' }> = []
  if (p.chat > 0) salida.push({ clase: 'chat', cuenta: p.chat, lado: 'izquierda' })
  if (p.pedidos > 0) salida.push({ clase: 'pedidos', cuenta: p.pedidos, lado: 'derecha' })
  return salida
}

/* ── EL MOVIMIENTO, COMO DECISIÓN Y NO COMO `if` SUELTO ──────────────────
 * 🔴 **Existe para que su gate pueda MEDIRLO.** *«Con reduce-motion no se
 * monta la animación»* es una afirmación sobre el comportamiento, y sin
 * extraerla habría que montar React para comprobarla — o creerle a un `grep`,
 * que es lo mismo que suponerlo (`L-459`: la primera prueba de un guard nuevo
 * no es que dé verde, es que dé ROJO sobre el caso real).
 *
 * ⚠️ **No es una función escrita para el test: las piezas la consumen.** Si
 * alguien vuelve a escribir el `if` a mano adentro del componente, el arnés
 * sigue verde y la pieza queda sin gate — por eso el arnés también exige que
 * **`PresenciaCoach` no contenga la palabra `withRepeat` fuera del guard**. */
export interface EntornoMovimiento {
  /** `reduce-motion` del sistema **o** memorial. */
  quieta: boolean
  /** La huella está desplegada. */
  abierta: boolean
}

export interface MovimientoCoach {
  /** La respiración de animal dormido. */
  respira: boolean
  /** El barrido de luz — la única señal de «esto es IA». */
  barre: boolean
  /** Los dedos entran escalonados. Sin esto, aparecen de una. */
  escalona: boolean
}

export function movimientoCoach({ quieta, abierta }: EntornoMovimiento): MovimientoCoach {
  /* Quieta ⇒ nada se mueve. **Abierta tampoco respira ni barre**, y eso no es
     reduce-motion: es que la esfera ya no está dormida — *un cuerpo que
     respira mientras alguien lo está usando parece que no escuchó.* */
  if (quieta) return { respira: false, barre: false, escalona: false }
  return { respira: !abierta, barre: !abierta, escalona: true }
}

/* ── EL ANCLAJE, DERIVADO DEL ANCHO REAL ─────────────────────────────────
 * 🔴 **La distancia que viaja el orbe depende de la pantalla y por eso se
 * calcula.** Tecleada, el orbe llegaría al centro en un teléfono y quedaría
 * corrido en todos los demás — *y «un poco corrido» no se lee como un error:
 * se lee como un diseño flojo.* Mismo criterio que el ancla de la gota de
 * N27: se deriva, jamás se ajusta a ojo. */

/** El aire desde el borde. **Mismo valor que `BurbujaPendientes`** —
 *  `spacing[5]` — porque **es la misma puerta**, no una segunda (N25). */
export const AIRE_BORDE = 20

/** Dónde vive el orbe dormido: esquina inferior derecha. */
export function anclaOrbe(ancho: number, aireInferior = 0): { izquierda: number; abajo: number } {
  return { izquierda: ancho - AIRE_BORDE - ORBE, abajo: AIRE_BORDE + aireInferior }
}

/** Cuánto se desliza el orbe hasta el centro inferior. */
export function desplazamientoAlCentro(ancho: number): number {
  return ancho / 2 - AIRE_BORDE - ORBE / 2
}

/** El lugar que la voz *«Preguntale a …»* se reserva DEBAJO de la almohadilla:
 *  una línea de 14 con su aire.
 *
 *  🔴 **La almohadilla no queda pegada al borde, y es por esto.** El encargo
 *  la manda *«al centro inferior»* y pone su voz debajo — **las dos cosas no
 *  caben si el disco toca el piso.** *Se hace lugar derivándolo del alto de la
 *  voz, no corriendo la almohadilla a ojo hasta que entre:* con un número
 *  tecleado, el día que la voz sea más larga y envuelva a dos líneas, la
 *  segunda se sale de la pantalla y nadie lo ve venir. */
export const ALTO_VOZ = 14 + 8 + 8

/** El centro de la almohadilla, ya despierta. **`abajo` se mide desde el
 *  borde inferior de la pantalla**, no desde arriba. */
export function centroAlmohadilla(ancho: number, aireInferior = 0): { x: number; abajo: number } {
  return { x: ancho / 2, abajo: AIRE_BORDE + aireInferior + ALTO_VOZ + ALMOHADILLA / 2 }
}

/** Cuánto SUBE el orbe al despertar: la diferencia entre las dos alturas.
 *  El viaje es en diagonal — al centro y un poco arriba, para hacerle lugar
 *  a su propia voz. */
export function ascensoAlDespertar(aireInferior = 0): number {
  return centroAlmohadilla(0, aireInferior).abajo - (AIRE_BORDE + aireInferior + ORBE / 2)
}

/** El centro de un dedo, en coordenadas de pantalla. */
export function centroDedo(
  indice: 0 | 1 | 2 | 3,
  ancho: number,
  aireInferior = 0,
): { x: number; abajo: number } {
  const c = centroAlmohadilla(ancho, aireInferior)
  const p = POSICIONES_DEDOS[indice]
  return { x: c.x + p.dx, abajo: c.abajo + p.dy }
}
