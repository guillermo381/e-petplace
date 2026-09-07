/**
 * EL TABLERO DEL PERFIL — la lógica, aparte de las piezas (S113-B · 2.2).
 *
 * Su gate la mide **sin montar React**, que es la única forma de probar
 * *«sin dato no hay gráfico»* sin mirar una pantalla.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔴 LA LEY QUE ATRAVIESA TODO ESTE ARCHIVO: **NADA SE INVENTA.**
 * ═══════════════════════════════════════════════════════════════════════════
 * Un tablero es más peligroso que una lista, y por una razón concreta: *una
 * lista que no sabe algo lo deja en blanco y se nota; un gráfico que no sabe
 * algo dibuja una línea plana, y una línea plana se lee como «no cambió».*
 * Por eso las reglas de abajo no son de estilo — son sobre qué se puede
 * afirmar con un dibujo.
 */

/**
 * 🔴 **UNA SERIE DE UN SOLO PUNTO NO ES UNA SERIE.**
 * Un sparkline con un dato dibuja una recta horizontal, y esa recta dice
 * «estuvo estable» — que es una afirmación que nadie hizo. Con menos de dos
 * puntos **el gráfico no se dibuja** y la tarjeta se queda con su dato y su
 * contexto, que siguen siendo ciertos.
 */
export function hayLineaQueDibujar(serie: readonly number[]): boolean {
  return serie.length >= 2
}

/**
 * 🔴 **EL TRAZO SE DIBUJA CENTRADO EN SU CAMINO: LA MITAD QUEDA AFUERA.**
 *
 * Un `strokeWidth` de 2 sobre un punto en `y = 0` pinta de `-1` a `+1`, y con
 * `strokeLinecap="round"` la punta se estira otro medio grosor más allá del
 * extremo. *Una caja calculada sobre la línea IDEAL siempre queda chica por el
 * grosor entero — y el recorte no se ve como un defecto: se ve como una línea
 * que toca el borde, que es justo lo que uno esperaría de un mínimo.*
 *
 * Por eso el margen **no se elige, se deriva**: es la mitad del grosor. Un
 * número a ojo se queda viejo el día que el trazo engorde.
 */
export function margenDeTrazo(grosor: number): number {
  return grosor / 2
}

/**
 * Los puntos del sparkline, normalizados a una caja de `ancho × alto`.
 *
 * ⚠️ **`margen` achica la caja por los cuatro lados y corre los puntos.** Con
 * `margen = 0` el resultado es el de antes: *la geometría no cambió, lo que
 * cambió es que ahora se le puede pedir que entre entera.*
 *
 * 🔴 **CON TODOS LOS VALORES IGUALES, LA LÍNEA VA AL MEDIO Y NO ABAJO.**
 * El rango es cero y la división explota: si eso cae a `0` la línea se pega al
 * piso y **dibuja una caída que no existió**. *El caso degenerado de un
 * gráfico no es un detalle numérico: es la forma en que miente.*
 */
export function puntosDeLinea(
  serie: readonly number[],
  ancho: number,
  alto: number,
  margen = 0,
): readonly { x: number; y: number }[] {
  if (!hayLineaQueDibujar(serie)) return []
  const min = Math.min(...serie)
  const max = Math.max(...serie)
  const rango = max - min
  /* La caja ÚTIL: lo que queda después de reservar el margen a cada lado.
     `Math.max(0, …)` para que una caja más chica que su propio margen no
     devuelva un alto negativo — dibujaría la línea invertida. */
  const anchoUtil = Math.max(0, ancho - 2 * margen)
  const altoUtil = Math.max(0, alto - 2 * margen)
  return serie.map((v, i) => ({
    x: margen + (i / (serie.length - 1)) * anchoUtil,
    /* `y` crece hacia abajo en SVG: el máximo va arriba. */
    y: margen + (rango === 0 ? altoUtil / 2 : altoUtil - ((v - min) / rango) * altoUtil),
  }))
}

/**
 * 🔴 **EL CONTROL DE QUE NADA SE SALE**, y existe porque *«se ve bien» no es
 * una medición*: devuelve los puntos que se pintarían fuera de la caja una vez
 * contado el grosor del trazo. Vacío = entra entero.
 *
 * Su gate lo corre con la serie plana, la de un solo valor repetido y la de
 * rango cero — *los tres casos donde la línea se pega a un borde.*
 */
export function trazosFueraDeCaja(
  puntos: readonly { x: number; y: number }[],
  ancho: number,
  alto: number,
  grosor: number,
): readonly { x: number; y: number }[] {
  const m = margenDeTrazo(grosor)
  return puntos.filter((p) => p.x - m < 0 || p.y - m < 0 || p.x + m > ancho || p.y + m > alto)
}

/**
 * El radio del anillo para que **el trazo entero** entre en su caja.
 *
 * ⚠️ El anillo tenía `r = (lado - grosor) / 2`, que hace que el borde EXTERNO
 * del trazo caiga exactamente sobre el borde de la caja: no se sale, pero
 * queda pegado, y con `strokeLinecap="round"` la punta del arco muerde. *Cero
 * margen no es «justo»: es sin aire.*
 */
export function radioDeAnillo(lado: number, grosor: number, margen: number): number {
  return Math.max(0, (lado - grosor) / 2 - margen)
}

/**
 * La fracción del anillo, acotada a [0,1].
 *
 * ⚠️ **`total <= 0` devuelve 0 y no `NaN`.** Un `NaN` en un `strokeDasharray`
 * no rompe: **dibuja el anillo entero**, o sea *«completo»* sobre un plan que
 * no existe. *El peor modo de falla de un gráfico es el que se ve bien.*
 */
export function fraccionDelAnillo(hechos: number, total: number): number {
  if (total <= 0) return 0
  return Math.max(0, Math.min(1, hechos / total))
}

/**
 * 🔴 **EL PROGRESO DE «CONOCIÉNDOLO» NO TIENE NÚMERO EN PANTALLA.**
 * `MODELO_LOYALTY` §3: nada de scores. El anillo dibuja el avance y **la voz**
 * dice qué significa —*«Ya conocemos a Thor casi como vos»*—.
 *
 * Esta función existe para que la fracción **no pueda llegar a un `Texto`**:
 * devuelve el número sólo para el trazo, y su firma dice que es geometría.
 * *Un porcentaje visible convierte a una familia en una barra de progreso, y
 * el día que baje va a sentir que hizo algo mal.*
 */
export function trazoDeProgreso(fraccion: number): number {
  return Math.max(0, Math.min(1, fraccion))
}

/**
 * 🔴 **EL «HOY» ES UNA COSA SOLA, Y ACÁ SE ELIGE CUÁL.**
 * El encargo lo dice literal: *nunca dos.* La prioridad no es de importancia
 * abstracta — es **qué se puede hacer hoy**: lo que se adelanta y todavía se
 * puede evitar, después lo que ya está agendado, y al final lo que vence.
 *
 * *Dos cosas en el «hoy» convierten una decisión en una lista, y una lista de
 * dos es la forma más rápida de que no se haga ninguna.*
 */
export type ClaseHoy = 'anticipacion' | 'cita' | 'vence'

const PESO: Record<ClaseHoy, number> = { anticipacion: 0, cita: 1, vence: 2 }

export function elDeHoy<T extends { clase: ClaseHoy }>(candidatos: readonly T[]): T | null {
  if (candidatos.length === 0) return null
  return [...candidatos].sort((a, b) => PESO[a.clase] - PESO[b.clase])[0] ?? null
}
