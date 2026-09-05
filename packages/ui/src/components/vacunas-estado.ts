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
  /** Del plan: esta vacuna no figura en el carnet. **Hay un hueco**, y puede
   *  haber algo que hacer: buscar el registro, o darla. */
  | { clase: 'sinRegistro' }
  /** 🔴 **Del plan, por EDAD: todavía no le toca** (`aun_no_corresponde`).
   *  *No es un hueco: es que su turno no llegó, y no hay nada que hacer.*
   *  Se distingue de `sinRegistro` en el dibujo y en la voz, porque leerlas
   *  igual le pone al dueño una tarea que no existe.
   *
   *  ⚠️ **La trae el MOTOR, no esta función.** `estadoDeVacuna` sólo ve
   *  fechas, y la edad del animal no está en ellas: derivarla sería inventar
   *  el dato que justamente hace la diferencia. */
  | { clase: 'aunNoCorresponde' }

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

/** Los cuatro tonos de la casa que el estado puede pedir. **Los valores los
 *  pone la pieza desde su tema**: este módulo es puro y no conoce colores. */
export interface ColoresDeEstado {
  exito: string
  aviso: string
  peligro: string
  tinta: string
}

/**
 * LA MARCA DE UNA VACUNA — **el color Y el relleno, decididos una sola vez.**
 *
 * ⏪ Vivía como un `switch` COPIADO en `FilaVacunaCarnet` y en
 * `ListaPlanVacunal`, los dos con una rama `default`. *Una regla duplicada por
 * copia se cura dos veces o no se cura* — y con un `default` de por medio, la
 * clase nueva habría caído ahí **sin un solo error**, dibujándose idéntica a
 * `sinRegistro`: exactamente lo que se pidió distinguir.
 *
 * ── 🔴 EL RELLENO ES LA SEGUNDA DIMENSIÓN, Y NO ES DECORACIÓN ──────────
 * `aunNoCorresponde` es **el único hueco**: *lo que todavía no empezó no se
 * pinta lleno.* Las dos ausencias comparten tinta —ninguna es un problema—,
 * así que si el color fuera lo único que las separa serían el mismo punto.
 * **El peso de la marca sigue a cuánto te pide:** `sinRegistro` es un hueco
 * del carnet que quizá haya que llenar y se dibuja presente; «todavía no le
 * toca» no pide nada y es apenas un contorno.
 */
export function marcaDeEstado(e: EstadoVacuna, c: ColoresDeEstado): { color: string; hueco: boolean } {
  switch (e.clase) {
    case 'alDia':
      return { color: c.exito, hueco: false }
    case 'porVencer':
      return { color: c.aviso, hueco: false }
    case 'vencida':
      return { color: c.peligro, hueco: false }
    case 'aunNoCorresponde':
      return { color: c.tinta, hueco: true }
    case 'sinRefuerzo':
    case 'sinRegistro':
      /* Tinta y llenas: **no son un problema, son una ausencia** — pintarlas
         de rojo diría que alguien hizo algo mal. */
      return { color: c.tinta, hueco: false }
  }
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

/** Una fila de la tanda de confirmación, como la ve el pie. */
export interface FilaDeLaTanda {
  tocada: boolean
  /** *«Esta no es»*: la persona dijo que la IA leyó algo que no existe. */
  descartada?: boolean
}

/** 🔴 **DESCARTAR ES REVISAR.** *Si una fila descartada no contara como
 *  revisada, el pie quedaría apagado para siempre y sin forma de encenderlo
 *  — que es exactamente el defecto que el pie existe para no tener.* */
export function revisada({ tocada, descartada }: FilaDeLaTanda): boolean {
  return tocada || descartada === true
}

/**
 * EL ESTADO DE LA TANDA — **las tres cuentas juntas, para que no puedan
 * contradecirse.**
 *
 * ⏪ El pie recibía `tocadas: boolean[]`. Con el descarte, ese arreglo dejó de
 * alcanzar: **una tanda entera descartada da «cero por revisar» y encendía el
 * botón para guardar NADA.** *No es un botón apagado sin razón: es uno
 * encendido que no hace nada, que es peor* — el dueño toca «Guardar 5
 * vacunas» y no se guarda ninguna.
 *
 * 🔴 La cura no fue sumar un número al lado: fue **que el pie deje de recibir
 * números y reciba el estado de las filas**. Un `aGuardar` que viaja aparte se
 * puede pasar mal; derivado acá, no existe la forma de pasarlo mal.
 */
export function resumenDeLaTanda(filas: readonly FilaDeLaTanda[]): {
  faltan: number
  aGuardar: number
  listo: boolean
} {
  /* Una sola regla de conteo: la de `faltanPorTocar`, alimentada con
     `revisada` (`L-175`: se ensancha lo que existe, no se copia). */
  const faltan = faltanPorTocar(filas.map(revisada))
  const aGuardar = filas.filter((f) => f.descartada !== true).length
  return { faltan, aGuardar, listo: faltan === 0 && aGuardar > 0 }
}

/* ═══ EL MOTOR DECIDE, LA CASA DIBUJA ═══════════════════════════════════════
 * Los seis códigos que `obtener_plan_vacunal` devuelve, tal como los declara
 * `EstadoPlanVacuna` en `packages/api/src/wrappers/salud.ts`.
 *
 * ⚠️ **Se redeclaran acá y NO se importan, a propósito:** el design system no
 * depende de la capa de datos. *El precio de esa independencia es que esta
 * lista puede quedar vieja el día que el motor gane un séptimo estado* — y por
 * eso no vive sola: `verify:carnet` compara las dos listas contra el archivo
 * real y **sale ROJO si el motor tiene uno que acá no está**. Una copia
 * vigilada es una copia; una copia y nada más es una bomba de tiempo.
 */
export type EstadoPlanMotor =
  | 'al_dia'
  | 'vencida'
  /** Se aplicó, pero no se puede saber cuándo toca la próxima. */
  | 'sin_fecha'
  | 'nunca_aplicada'
  /** Por EDAD todavía no toca. */
  | 'aun_no_corresponde'
  /** Vence dentro de la ventana del motor. */
  | 'vence_en'

/**
 * EL MAPEO DE LOS SEIS — **del veredicto del motor a la clase visual.**
 *
 * ── 🔴 LAS TRES REGLAS QUE LO ORDENAN ──────────────────────────────────
 * ① **`aun_no_corresponde` es el ARO, jamás la falta.** Es la razón de ser de
 *    este mapeo: *un turno que no llegó no es un hueco, y pintarlo como
 *    `sinRegistro` le inventa a la familia una tarea que no existe.*
 * ② **El motor decide la CLASE; la fecha sólo aporta el NÚMERO.** No se
 *    recalcula si está vencida o por vencer: *la ventana es del motor y es un
 *    parámetro suyo; recomputarla acá haría que dos partes de la casa
 *    contesten distinto sobre el mismo animal, y la que se ve gana.*
 * ③ **No hay `default`.** Un séptimo estado no cae en una rama muda: **no
 *    compila** —el `switch` cubre la unión entera y la función promete
 *    devolver siempre—. *Un `default` acá dibujaría el estado nuevo idéntico
 *    a otro, sin un solo error, que es exactamente cómo se pierde una
 *    distinción.*
 */
export function estadoDelPlan(
  fila: { estado: EstadoPlanMotor; proxima?: string | null },
  hoy: string,
): EstadoVacuna {
  switch (fila.estado) {
    case 'al_dia':
      return { clase: 'alDia' }
    case 'aun_no_corresponde':
      return { clase: 'aunNoCorresponde' }
    case 'nunca_aplicada':
      return { clase: 'sinRegistro' }
    case 'sin_fecha':
      return { clase: 'sinRefuerzo' }
    case 'vence_en':
      /* ⚠️ `proxima` en `null` con este estado es **el motor contradiciéndose**
         —el estado se computa DESDE esa fecha—, así que es un caso que su
         construcción no produce. Si llegara igual, la casa **no pinta un
         número**: dice lo único que sabe, que no sabe cuándo toca. *Poner un
         `0` ahí sería «vence hoy», y eso es peor que no saber.* Es la misma
         regla que `estadoDeVacuna` ya aplica sin fecha, no una rama de
         escape. */
      return fila.proxima == null
        ? { clase: 'sinRefuerzo' }
        : { clase: 'porVencer', dias: diasEntre(hoy, fila.proxima) }
    case 'vencida':
      return fila.proxima == null
        ? { clase: 'sinRefuerzo' }
        : { clase: 'vencida', dias: -diasEntre(hoy, fila.proxima) }
  }
}
