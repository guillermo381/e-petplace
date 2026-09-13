/**
 * EL CARNÉ LEÍDO, ESPERANDO A QUE LA MASCOTA EXISTA — S116-C lote 3.
 *
 * ── EL PROBLEMA QUE RESUELVE, que es de ORDEN ────────────────────────────
 * El paso 09 lee el carné **antes** de que la mascota exista: la mascota se
 * crea en el cierre (10). Pero `registrarVacunasDeCarnet` **exige
 * `mascota_id`** (medido en su firma). ⇒ lo leído tiene que esperar en algún
 * lado entre 09 y 10.
 *
 * ── POR QUÉ NO VIAJA EN LOS PARAMS, como el resto del borrador ───────────
 * El borrador del alta viaja por la URL a propósito (cada paso es alcanzable
 * solo, el back de Android funciona sin estado global). **Pero son N filas
 * con nombres, fechas, lotes y veterinarios**: meterlas en una URL es
 * frágil —ya nos pasó con `fotoUri` y los `%40` de Expo Go (`L-137`)— y
 * además larga. *Un dato que puede romperse al viajar no se manda de paseo.*
 *
 * ⇒ Vive en memoria del proceso, **keyed por `tokenIntento`**, que es la
 * identidad de ESTE llenado del formulario y ya existe para otra cosa.
 *
 * ── 🔴 LO QUE ESTO CUESTA, DICHO ─────────────────────────────────────────
 * **Si el proceso muere entre 09 y 10, el carné se pierde y la mascota se
 * crea igual.** Es degradación honesta y no silenciosa: el cierre sabe si
 * esperaba filas y no llegaron, y el apoyo de la confirmación **no dice que
 * guardó un carné que no guardó** (la ley del founder del 5-sep).
 * *El carné se puede volver a cargar desde el expediente; la alternativa
 * —bloquear el alta hasta que el carné viaje bien— costaría no poder dar de
 * alta una mascota por un problema de transporte de datos.*
 */

/** Una fila leída del carné, ya revisada por la persona. */
export type VacunaDelCarnet = {
  /** 🔴 **NULLABLE por firma del founder** (S113-D-2.4, escrita en
   *  `VacunaExtraida.nombre`): *«hay renglones donde HAY una vacuna y su
   *  nombre no se lee. La fila viaja igual … una fila corregible vale más que
   *  una que desaparece en silencio»*. ⇒ la fila llega hasta acá; **el
   *  registro filtra las sin nombre** porque la columna es `NOT NULL`, y la
   *  pantalla dice cuántas quedaron para completar en el expediente. */
  nombre: string | null
  tipo_vacuna?: string | null
  fecha_aplicada?: string | null
  fecha_proxima?: string | null
  veterinario_nombre_externo?: string | null
  lote?: string | null
}

export type CarnetDelIntento = {
  /** El path en Storage del carné ya subido. */
  archivo_url: string
  vacunas: VacunaDelCarnet[]
}

const porIntento = new Map<string, CarnetDelIntento>()

export function guardarCarnetDelIntento(token: string, carnet: CarnetDelIntento): void {
  porIntento.set(token, carnet)
}

export function leerCarnetDelIntento(token: string | undefined): CarnetDelIntento | null {
  if (token === undefined) return null
  return porIntento.get(token) ?? null
}

/** Se limpia al cerrar: un intento terminado no tiene por qué quedar en pie. */
export function olvidarCarnetDelIntento(token: string | undefined): void {
  if (token !== undefined) porIntento.delete(token)
}
