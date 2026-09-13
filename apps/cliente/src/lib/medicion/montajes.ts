/**
 * EL CONTADOR DE MONTAJES POR TAB — S116-C lote 3.
 *
 * Lo pidió el encargo del lote: *«cada vez que una pantalla se monta o
 * desmonta dentro de una tab, cuenta; el conteo por tab se ve en el pie de
 * Cuenta debajo del id del update, en modo dev solamente, y se escribe en el
 * logcat con un prefijo que E pueda buscar»*.
 *
 * ── 🔴 POR QUÉ NO SE USA `onMontaje` DE `BarraTabs`, QUE YA EXISTE ─────────
 *
 * **Porque mide otra cosa, y su nombre no lo dice.** El enganche que B dejó
 * en el lote 2 se dispara **en el mismo acto que `onCambiar`** (su propia
 * cabecera lo declara y explica por qué: un `useEffect` contaría también los
 * deep links). ⇒ **`onMontaje` cuenta TOQUES DE LA BARRA, no montajes de
 * pantalla.** Son dos números distintos:
 *
 *   · **toques de tab** — cuántas veces el dedo cambió de mundo.
 *   · **montajes de pantalla** — cuántas pantallas se apilaron y se soltaron
 *     adentro de cada mundo. *Éste es el que importa para `D-1090`*, porque
 *     lo que mata la app no es cambiar de tab: es apilar sin soltar.
 *
 * **Se cablean los dos y se reportan por separado.** Confundirlos habría dado
 * un número plausible y equivocado — que es la clase que esta casa persigue.
 *
 * ── CÓMO CUENTA, Y QUÉ NO PUEDE VER ───────────────────────────────────────
 *
 * Deriva de la **profundidad del stack de cada tab**, que el navegador ya
 * expone: sube ⇒ se montó una pantalla · baja ⇒ se desmontó. *No hace falta
 * tocar las 106 rutas del cliente para medirlas — y un hook por pantalla
 * habría medido sólo las pantallas que alguien se acordó de instrumentar.*
 *
 * ⚠️ **LO QUE NO VE, dicho para que su número no se lea de más:**
 *   · las rutas de **nivel raíz** (el parte, el detalle del paseo, NEXO): se
 *     montan ENCIMA de los tabs y no entran en el stack de ninguno.
 *   · un `replace` dentro del mismo nivel: la profundidad no cambia, así que
 *     cuenta **cero**, aunque una pantalla se fue y otra llegó.
 *   · la memoria. *Esto cuenta pantallas, no megabytes* — el número sirve
 *     para saber DÓNDE mirar, no para concluir que algo gotea.
 */

/** El prefijo que E busca en el logcat. Una sola cadena, acá. */
export const PREFIJO_MONTAJES = '[montajes]'

export type ConteoTab = {
  /** Cuántas pantallas se apilaron en esta tab desde que arrancó la app. */
  montajes: number
  /** Cuántas se soltaron. */
  desmontajes: number
  /** Profundidad ahora mismo (0 = sólo la raíz del mundo). */
  vivas: number
  /** La profundidad más alta que alcanzó. *El pico es el dato que importa
   *  para `D-1090`: el promedio esconde el momento malo.* */
  pico: number
}

const conteo = new Map<string, ConteoTab>()
/** Profundidad de la última lectura, por tab. Sin esto no hay delta. */
const profundidadPrevia = new Map<string, number>()
const oyentes = new Set<() => void>()

function vacio(): ConteoTab {
  return { montajes: 0, desmontajes: 0, vivas: 0, pico: 0 }
}

/**
 * Registra la profundidad ACTUAL de una tab y deriva el movimiento.
 * Idempotente: llamarla con el mismo número dos veces no cuenta nada, así que
 * el shell puede invocarla en cada render sin inflar la medición.
 */
export function registrarProfundidad(tab: string, profundidad: number): void {
  const previa = profundidadPrevia.get(tab)
  if (previa === profundidad) return
  profundidadPrevia.set(tab, profundidad)

  const c = conteo.get(tab) ?? vacio()
  /* La primera lectura fija el piso y no cuenta como montaje: la raíz del
     mundo ya estaba ahí antes de que nadie tocara nada. */
  if (previa !== undefined) {
    const delta = profundidad - previa
    if (delta > 0) c.montajes += delta
    else c.desmontajes += -delta
  }
  c.vivas = profundidad
  c.pico = Math.max(c.pico, profundidad)
  conteo.set(tab, c)

  if (__DEV__) {
    console.log(
      `${PREFIJO_MONTAJES} ${tab} · vivas=${c.vivas} · pico=${c.pico} · ` +
        `montajes=${c.montajes} · desmontajes=${c.desmontajes}`,
    )
  }
  for (const o of oyentes) o()
}

/** Los toques de la barra, que son el OTRO número (ver cabecera). */
const toques = new Map<string, number>()

export function registrarToqueDeTab(tab: string): void {
  const n = (toques.get(tab) ?? 0) + 1
  toques.set(tab, n)
  if (__DEV__) console.log(`${PREFIJO_MONTAJES} toque · ${tab} · ${n}`)
  for (const o of oyentes) o()
}

export function leerConteos(): { tab: string; conteo: ConteoTab; toques: number }[] {
  const claves = new Set([...conteo.keys(), ...toques.keys()])
  return [...claves].map((tab) => ({
    tab,
    conteo: conteo.get(tab) ?? vacio(),
    toques: toques.get(tab) ?? 0,
  }))
}

/** Para que el pie de Cuenta se entere sin sondear. */
export function escucharConteos(fn: () => void): () => void {
  oyentes.add(fn)
  return () => {
    oyentes.delete(fn)
  }
}
