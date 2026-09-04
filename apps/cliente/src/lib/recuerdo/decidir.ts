/**
 * EL RECUERDO — LO QUE SE DECIDE SIN REACT (S113-C · lote 0.1).
 *
 * Tres decisiones de la pantalla viven acá, **sin un solo import de runtime**
 * (el único es `import type`), para que el arnés llame a **estas** funciones y
 * no a una réplica que comparte sus supuestos (`L-459`, y el precedente de
 * `lib/nexo/*` y `texto-jornada.ts` del prestador).
 *
 * 🔴 **Y una de las tres es la que vuelve medible «cero llamadas».** Que el
 * botón no dispare nada sin foto ni texto se puede leer en el código —el
 * `return` está antes del primer `await`— *pero leer no es medir*: la única
 * forma de que un arnés lo pruebe es que la decisión sea una función que se
 * pueda llamar con las manos vacías y contestar «no».
 */

/** Por qué NO se puede guardar. `null` = se puede. */
export type FrenoRecuerdo = 'faltaAlgo' | 'fechaFutura'

/**
 * ⚠️ **EL ORDEN DE LAS DOS PREGUNTAS IMPORTA.** Primero «¿hay algo?» y después
 * «¿la fecha sirve?»: con el formulario recién abierto —vacío y con hoy— la
 * razón que corresponde es *«una foto o unas palabras»*, no una sobre la fecha
 * que nadie tocó. *La primera razón que se muestra tiene que ser la del primer
 * paso que falta.*
 */
export function frenoDelRecuerdo(e: {
  hayFoto: boolean
  texto: string
  /** `YYYY-MM-DD` */
  fecha: string
  /** `YYYY-MM-DD` — el día LOCAL, que lo resuelve la pantalla. */
  hoy: string
}): FrenoRecuerdo | null {
  if (!e.hayFoto && e.texto.trim().length === 0) return 'faltaAlgo'
  /* Comparación de cadenas ISO: `YYYY-MM-DD` ordena lexicográficamente igual
     que cronológicamente. **Jamás `new Date(iso)`**, que corre el día en UTC−5
     (D-312). */
  if (e.fecha > e.hoy) return 'fechaFutura'
  return null
}

export function puedeGuardar(e: Parameters<typeof frenoDelRecuerdo>[0]): boolean {
  return frenoDelRecuerdo(e) === null
}

/**
 * El cuerpo exacto que viaja a la puerta.
 *
 * 🔴 **UN TEXTO VACÍO NO VIAJA.** `undefined` es «no hay»; una cadena vacía
 * sería un texto que el motor tendría que descartar — y el motor rebota
 * `recuerdo_vacio` mirando si vino ALGO, así que mandar `''` con una foto
 * sería mandarle basura a una puerta que confía. *Se limpia acá, una vez, en
 * la frontera, y no en cada llamador.*
 *
 * `fotoPath` es un PATH del bucket, jamás una URL: lo devuelve el subidor y
 * acá sólo se transporta.
 */
export function cuerpoDelRecuerdo(e: {
  mascotaId: string
  texto: string
  fotoPath?: string
  fecha: string
}): { mascotaId: string; texto?: string; fotoPath?: string; fecha: string } {
  const limpio = e.texto.trim()
  return {
    mascotaId: e.mascotaId,
    ...(limpio.length > 0 ? { texto: limpio } : null),
    ...(e.fotoPath !== undefined ? { fotoPath: e.fotoPath } : null),
    fecha: e.fecha,
  }
}

/** Las cinco keys que este mapa puede devolver. **Se declaran como literales y
 *  no como `string`**, y no es prolijidad: el riel de i18n exige una clave que
 *  EXISTA, así que con `string` el typecheck deja pasar cualquier cosa y una
 *  key mal tipeada llega a pantalla como su propio nombre. */
export type KeyDeRebote =
  | 'recuerdo.faltaAlgo'
  | 'recuerdo.errFoto'
  | 'recuerdo.fechaFutura'
  | 'recuerdo.errAcceso'
  | 'recuerdo.errGenerico'

/**
 * De qué habla cada rebote del servidor, en UNA línea.
 *
 * ⚠️ **`recuerdo_vacio` cae en la MISMA key que el freno de pantalla** y es a
 * propósito: son el mismo hecho dicho por dos bocas. *Dos frases para la misma
 * causa se contradicen el día que alguien edita una.*
 *
 * 🔴 **El parámetro es `string` y no `CodigoErrorRecuerdo`, y lo dijo el
 * compilador:** el `ResultadoWrapper` de la casa **ensancha** el código con
 * `'datos_inconsistentes'`, así que tipar acá el enum angosto no compila
 * contra el `.codigo` real. *El `default` cubre todo lo que no se nombra, que
 * es exactamente lo que tiene que hacer.*
 */
export function keyDelRebote(codigo: string): KeyDeRebote {
  switch (codigo) {
    case 'recuerdo_vacio':
      return 'recuerdo.faltaAlgo'
    case 'foto_invalida':
      return 'recuerdo.errFoto'
    case 'fecha_futura':
      return 'recuerdo.fechaFutura'
    case 'sin_acceso_mascota':
    case 'acceso_denegado':
      return 'recuerdo.errAcceso'
    default:
      return 'recuerdo.errGenerico'
  }
}
