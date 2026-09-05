/**
 * EL ESTADO DE UNA VACUNA — fuera de los componentes A PROPÓSITO (S113-B · 1.0).
 *
 * Vive en su propio módulo **para que su gate pueda medirlo sin montar React**.
 * Las tres piezas del carnet lo consumen, así que el criterio de «al día» es
 * uno solo: *si viviera en cada pieza, el día que cambie el umbral habría tres
 * lugares donde buscarlo y dos donde olvidarlo.*
 */

/** Cuántos días antes de la fecha empieza a decir «vence en N». */
export const AVISO_DIAS = 30

export type EstadoVacuna =
  /** Tiene refuerzo y todavía falta más que el aviso. */
  | { clase: 'alDia' }
  /** Tiene refuerzo y está cerca: `dias` es lo que falta. */
  | { clase: 'porVencer'; dias: number }
  /** La fecha de refuerzo ya pasó. */
  | { clase: 'vencida'; dias: number }
  /** 🔴 **Se aplicó, pero el carnet no dice cuándo toca la próxima.**
   *  *No es «al día» ni «vencida»: es que no sabemos, y eso se dice.* */
  | { clase: 'sinRefuerzo' }
  /** Del plan: esta vacuna no figura en el carnet. */
  | { clase: 'sinRegistro' }

/** Días entre dos fechas `YYYY-MM-DD`, sin husos: **las dos son fechas de
 *  calendario, no instantes.** *Restar `Date` con hora mete el huso del
 *  aparato en una cuenta que no lo tiene, y eso corre un día entero cerca de
 *  medianoche.* */
export function diasEntre(desde: string, hasta: string): number {
  const n = (f: string) => {
    const [a, m, d] = f.split('-').map(Number)
    return Date.UTC(a, m - 1, d)
  }
  return Math.round((n(hasta) - n(desde)) / 86400000)
}

/**
 * El estado de una vacuna del carnet.
 *
 * ⚠️ **`fechaProxima` ausente NO se completa sumando un año.** El plan de la
 * especie dirá cuándo tocaría, y eso es un CÁLCULO que se dice como cálculo —
 * nunca un dato del carnet (ver `vozDelPlan`).
 */
export function estadoDeVacuna(
  { fechaAplicada, fechaProxima }: { fechaAplicada?: string | null; fechaProxima?: string | null },
  hoy: string,
): EstadoVacuna {
  if (fechaAplicada == null && fechaProxima == null) return { clase: 'sinRegistro' }
  if (fechaProxima == null) return { clase: 'sinRefuerzo' }
  const d = diasEntre(hoy, fechaProxima)
  if (d < 0) return { clase: 'vencida', dias: -d }
  return d <= AVISO_DIAS ? { clase: 'porVencer', dias: d } : { clase: 'alDia' }
}

/**
 * 🔴 **LA VOZ DEL PLAN SE DICE COMO CÁLCULO, JAMÁS COMO DATO.**
 * *«Vence el 12 de marzo» es una promesa del carnet; «según el plan, tocaría
 * en marzo» es una cuenta nuestra.* Confundirlas hace que la app afirme algo
 * que ningún papel dice — y el dueño la va a creer, porque hasta ahí todo lo
 * que leyó salía del carnet.
 *
 * La pieza no compone la frase (Ley 3): **devuelve el mes**, y la pantalla
 * pone su i18n con el «según el plan» adelante.
 */
export function esCalculoDelPlan(origen: 'carnet' | 'plan'): boolean {
  return origen === 'plan'
}

/** Los campos del detalle, **filtrados**: lo que es `null` no viaja.
 *  🔴 *Ni «—» ni «sin dato»: un guion es una respuesta, y acá no hay
 *  respuesta.* El que llama itera lo que salga y no pregunta por nada. */
export function detalleVisible(
  campos: ReadonlyArray<{ etiqueta: string; valor?: string | null }>,
): Array<{ etiqueta: string; valor: string }> {
  return campos.flatMap((c) =>
    c.valor == null || c.valor.trim() === '' ? [] : [{ etiqueta: c.etiqueta, valor: c.valor }],
  )
}

/** La confianza de la extracción, tal como la IA la reporta. */
export type ConfianzaIA = 'alta' | 'media' | 'baja'

/** ¿Esta fila pide que la miren? **Media también**: *«media» quiere decir que
 *  el modelo dudó, y una duda que no se muestra es una afirmación.* */
export function pideRevision(c: ConfianzaIA): boolean {
  return c !== 'alta'
}

/** ¿Se puede guardar la tanda? **Sólo con TODAS tocadas.**
 *  🔴 *Un «guardar todo» sobre filas que nadie miró convierte la revisión en
 *  un trámite* — y la revisión es lo único que separa a la extracción de
 *  inventar datos clínicos. */
export function faltanPorTocar(tocadas: ReadonlyArray<boolean>): number {
  return tocadas.filter((t) => !t).length
}
