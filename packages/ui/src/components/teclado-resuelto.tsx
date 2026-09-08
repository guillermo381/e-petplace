/**
 * ¿QUIÉN PAGA EL TECLADO? — la frontera entre dos piezas que lo resuelven de
 * maneras OPUESTAS (S114-B, pedido de C).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * `SuperficieChat` se envuelve en `EvitaTeclado` y **se empuja entera**.
 * `ModalDosAlturas` **no se mueve: crece por dentro** reservando `altoTeclado`.
 * **Montar la primera adentro de la segunda son dos manejadores compitiendo** —
 * el alto del teclado se paga DOS VECES y la barra queda flotando sobre un
 * hueco. *Lo midió C y frenó antes de improvisar.*
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ── 🔴 QUIÉN CEDE: **LA SUPERFICIE**. Y no es preferencia, son tres hechos ──
 *
 * ① **La hoja no PUEDE ceder: su comportamiento ES el requisito.** *«El teclado
 *    no la empuja: crece por dentro»* está firmado en
 *    `DIRECCION_ARTE_VIDEOCONSULTA` §3 y es uno de los dos rojos que el founder
 *    nombró. Si cediera, el panel se movería y lo de arriba —el video, el
 *    animal— saltaría en cada toque de un campo.
 * ② **`KeyboardAvoidingView` mide contra la VENTANA, no contra su padre.**
 *    Adentro de un panel cuyo alto es un `useSharedValue` animado, su cuenta no
 *    es «de más»: **está midiendo otra caja.**
 * ③ **La hoja ya TIENE el dato.** El consumidor resuelve el alto una vez y se
 *    lo pasa (`altoTeclado`, que `R81` exige). *Quien ya tiene el número es el
 *    que puede repartirlo.*
 *
 * ── 🔴 POR QUÉ ES UN CONTEXTO Y NO UNA PROP, y es mi propia `R81` ──────────
 *
 * Una prop `tecladoYaResuelto` sería **exactamente lo que `R81` condena**:
 *
 * > *Una garantía que la pieza ofrece y el consumidor tiene que acordarse de
 * > pedir no es una garantía: es una opción con buen nombre.*
 *
 * Con una prop, olvidarla deja los dos manejadores vivos **y nada falla**: se
 * ve como un hueco raro debajo de la barra, que es justo la clase de defecto
 * que nadie reporta. **El founder lo pidió INEXPRESABLE, no documentado.**
 *
 * ⇒ **lo declara quien de verdad lo resuelve, en el subárbol donde la
 * afirmación es cierta.** No hay nada que pasar, así que no hay nada que
 * olvidar; y no se puede afirmar «ya está resuelto» sin estar adentro de la
 * pieza que lo resuelve. *La respuesta no la escribe el consumidor: la produce
 * el lugar donde montó.*
 *
 * ⚠️ **Su alcance es EXACTAMENTE el subárbol de la hoja** — por eso es un
 * contexto y no una bandera global. *Una bandera global sería la misma prop con
 * más alcance para equivocarse.*
 */
import { createContext, useContext, type ReactNode } from 'react'

const CtxTecladoResuelto = createContext(false)

/**
 * Lo monta **la pieza que resuelve el teclado por su cuenta** (hoy
 * `ModalDosAlturas`). Todo lo que caiga adentro deja de resolverlo.
 */
export function TecladoResueltoArriba({ children }: { children: ReactNode }) {
  return <CtxTecladoResuelto.Provider value={true}>{children}</CtxTecladoResuelto.Provider>
}

/**
 * `true` = **un ancestro ya reservó el alto del teclado**; quien lea esto no
 * debe montar su propio `EvitaTeclado`.
 *
 * Fuera de cualquier hoja devuelve `false`, que es el caso normal: **una
 * pantalla suelta resuelve su teclado como siempre.**
 */
export function useTecladoYaResuelto(): boolean {
  return useContext(CtxTecladoResuelto)
}
