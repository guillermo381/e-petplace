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
/** El lienzo del orbe: **2,2 veces el cuerpo**, con el cuerpo en el centro.
 *  🔴 **No es holgura: es dónde vive el resplandor.** Un lienzo del tamaño
 *  del cuerpo recorta el degradé justo donde empieza a existir. */
export const LIENZO = 2.2
/** El resplandor: un círculo de **1,5 × el RADIO del cuerpo**, con un radial
 *  violeta que se disuelve. **No es una sombra** — `shadowRadius` no existe
 *  en Android y era la mitad de por qué esto no se veía. */
export const RESPLANDOR_RADIO = 1.5
/** Su opacidad en el centro. */
export const RESPLANDOR_ALFA = 0.42
/** El contorno de la esfera sobre papel blanco: 1 px del mismo lila. */
export const ANILLO = 1
/** El borde del cuerpo en reposo: el claro del Coach a esta opacidad. */
export const LILA_ALFA = 0.35
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
/** La opacidad de la brasa **en su centro, y es su techo**.
 *  ⏪ Era 0,9 y se leía como **un punto**, no como calor. */
export const BRASA_ALFA = 0.7
/** A qué fracción de su radio **ya no queda nada**.
 *  🔴 **Muere ANTES del final del gradiente a propósito:** así el corte del
 *  degradé ocurre donde no hay nada que cortar, y **no queda borde**. *El
 *  borde no era del color: era del lugar donde el color terminaba de golpe.* */
export const BRASA_MUERE = 0.6

/** Las tres cosas que pueden estar pendientes. **Crece acá y rompe en el mapa
 *  de colores de la pieza**, que es `Record` completo a propósito. */
export type ClaseCoach = 'chat' | 'pedidos' | 'avisos' | 'solicitudes'

export interface PendientesCoach {
  chat: number
  pedidos: number
  /** Las que llegan a revisar — del refugio. **Entró con el modo sin Coach**,
   *  que es el que reemplaza a `BurbujaPendientes` en el prestador. */
  solicitudes?: number
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
  if ((p.solicitudes ?? 0) > 0) vivas.push('solicitudes')
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
export type ClasePastilla = 'chat' | 'pedidos' | 'solicitudes'

export function pastillasDe(p: PendientesCoach): Array<{ clase: ClasePastilla; cuenta: number }> {
  const salida: Array<{ clase: ClasePastilla; cuenta: number }> = []
  if (p.chat > 0) salida.push({ clase: 'chat', cuenta: p.chat })
  if (p.pedidos > 0) salida.push({ clase: 'pedidos', cuenta: p.pedidos })
  if ((p.solicitudes ?? 0) > 0) salida.push({ clase: 'solicitudes', cuenta: p.solicitudes as number })
  return salida
}

/* ── LA FILA ASCENDENTE ──────────────────────────────────────────────────
 * Todo se mide desde el CENTRO DEL ORBE, que es el único punto fijo: el orbe
 * no se mueve al abrir. *Medir desde el borde de la pantalla habría atado la
 * fila al ancho del aparato, que es justo lo que no la define.* */

/** Dónde vive el orbe: esquina inferior derecha. `izquierda` y `abajo` son la
 *  caja del ORBE en reposo, no la del resplandor. */
/**
 * ¿SE DIBUJA LA PIEZA? — **D-1025**.
 *
 * · **Con Coach: SIEMPRE.** Aunque no haya nada pendiente, sus atajos están y
 *   el orbe siempre lleva a algún lado.
 * · **Sin Coach y sin nada pendiente: NO.** *Un disco que atenúa la pantalla y
 *   abre sobre el vacío es peor que uno apagado* — el apagado no promete nada;
 *   éste promete y no cumple.
 *
 * 🔴 **ESTA REGLA YA EXISTÍA Y LA PERDÍ AL ABSORBER LA PIEZA.**
 * `BurbujaPendientes` la traía escrita y citada: *«vacío o todo en cero ⇒ la
 * pieza no se dibuja (19.9: el nulo no se pinta, y no hay nada que abrir)»*.
 * Cuando `PresenciaCoach` la reemplazó **vino la forma y no vino la regla**.
 * *Reemplazar una pieza no es copiar su dibujo: es hacerse cargo de todo lo
 * que sabía* — y esto lo sabía en su PROSA, no en su geometría, así que
 * ningún gate lo vio faltar. **Por eso nace como función, no como comentario.**
 */
export function sePinta({ coach, pendientes }: { coach: boolean; pendientes: PendientesCoach }): boolean {
  return coach || clasesConAlgo(pendientes).length > 0
}

export function anclaOrbe(ancho: number, aireInferior = 0): { izquierda: number; abajo: number } {
  return { izquierda: ancho - AIRE_BORDE - ORBE, abajo: AIRE_BORDE + aireInferior }
}

/** Cuánto hay entre el eje de la fila y el BORDE DERECHO de la pantalla.
 *  Los nodos se anclan con `right`, así que éste es su origen. */
export function ejeDesdeDerecha(): number {
  return AIRE_BORDE + ORBE / 2
}

/** El eje vertical por el que sube la fila: el centro del orbe. */
export function ejeDeLaFila(ancho: number, aireInferior = 0): { x: number; abajo: number } {
  const a = anclaOrbe(ancho, aireInferior)
  return { x: a.izquierda + ORBE / 2, abajo: a.abajo + ORBE / 2 }
}

/** El orbe chico de «Preguntale a …»: ya violeta, con su brasa. */
export const ORBE_MINI = 36

export type NodoFila =
  /** 🔴 **La primera fila, pegada al orbe (lote 0.2).** Antes «Preguntale»
   *  era el toque del orbe abierto; el founder lo bajó a la lista: *un mismo
   *  toque que a veces abre y a veces pregunta enseña a no tocarlo.* Ahora el
   *  orbe abre y cierra, y preguntar es una fila más. */
  | { tipo: 'preguntar' }
  | { tipo: 'pastilla'; clase: ClasePastilla; cuenta: number }
  | { tipo: 'dedo'; indice: number }

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
export function nodosDeLaFila(
  p: PendientesCoach,
  cantidadDedos = 4,
  /** 🔴 **`false` = LA PRESENCIA SIN COACH.** No es «el Coach apagado»: es la
   *  misma presencia haciendo el otro trabajo — **la puerta a lo que te
   *  espera**, que es lo único que el prestador tiene. Sin «Preguntale» y sin
   *  dedos: *ofrecer atajos de una IA que esa app no tiene sería prometer.* */
  conCoach = true,
): Array<NodoFila & { alto: number }> {
  const nodos: Array<NodoFila & { alto: number }> = []
  /* Orden de abajo hacia arriba: orbe · Preguntale · pendientes · los cuatro. */
  if (conCoach) nodos.push({ tipo: 'preguntar', alto: ORBE_MINI })
  for (const q of pastillasDe(p)) nodos.push({ tipo: 'pastilla', clase: q.clase, cuenta: q.cuenta, alto: PASTILLA })
  if (conCoach) for (let i = 0; i < cantidadDedos; i++) nodos.push({ tipo: 'dedo', indice: i, alto: DEDO })
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
  conCoach = true,
): number[] {
  const eje = ejeDeLaFila(ancho, aireInferior)
  /* El borde de arriba del orbe abierto: desde ahí sube todo. */
  let borde = eje.abajo + ORBE_ABIERTO / 2
  return nodosDeLaFila(p, cantidadDedos, conCoach).map((n) => {
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

/**
 * La opacidad de la CAPA VIOLETA: **0 en reposo, 1 despierta.**
 *
 * 🔴 **Vive acá para que su gate la pueda asertar.** Adentro del componente
 * era un ternario en un `useEffect` y la única forma de comprobarlo era
 * mirar la pantalla — que es justo lo que este lote demostró que no alcanza:
 * *el violeta ESTABA cableado y no se veía, porque lo tapaba otra capa.*
 * Separar «¿debe estar encendida?» de «¿se dibuja bien?» hace que la próxima
 * vez el gate diga cuál de las dos falló.
 */
export function violetaEncendido(e: { abierta: boolean; estado: 'dormida' | 'atenta' | 'despierta' | 'hablando' }): 0 | 1 {
  return e.abierta || e.estado === 'despierta' || e.estado === 'hablando' ? 1 : 0
}

/**
 * LA ETIQUETA ACCESIBLE DEL ORBE — **D-1019**.
 *
 * 🔴 **En web `accessibilityState` no llega, así que la ETIQUETA es el
 * mecanismo.** Un orbe que se llama igual abierto y cerrado le dice a un
 * lector de pantalla que nada cambió cuando en realidad cambió todo: *el
 * único botón que hace dos cosas opuestas no puede tener un solo nombre.*
 *
 * ⚠️ **La pieza NO compone la frase** (Ley 3): elige CUÁL de las dos voces
 * que la pantalla ya le pasó. *Elegir no es componer.*
 */
export function vozDelOrbe(abierta: boolean, voz: { abrir: string; cerrar: string }): string {
  return abierta ? voz.cerrar : voz.abrir
}

export function movimientoCoach({ quieta, abierta }: EntornoMovimiento): MovimientoCoach {
  if (quieta) return { respira: false, barre: false, escalona: false }
  /* Abierta tampoco respira ni barre, y eso no es reduce-motion: es que la
     esfera ya no está dormida — *un cuerpo que respira mientras alguien lo
     está usando parece que no escuchó.* */
  return { respira: !abierta, barre: !abierta, escalona: true }
}
