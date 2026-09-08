// _shared/postventa/contrato.ts — LA PUERTA DETERMINÍSTICA DE LA IA DE POSTVENTA
// (S114-D, lote 0).
//
// ── LA LEY QUE ESTE ARCHIVO HACE EXIGIBLE (§11 de LETRA_POSTVENTA, verbatim) ──
//   «El disparo nunca es del modelo: una regla determinística decide que algo
//    exista; el modelo redacta. Ninguna salida de IA escribe estado, monto ni
//    transición.»
//   §4: «La clase jamás la elige una pantalla ni un modelo: viaja en la fila.»
//
// ── POR QUÉ ESTO ES CÓDIGO Y NO UNA LÍNEA DEL PROMPT ─────────────────────────
// Es la lección que la casa ya pagó en NEXO (`coach/index.ts`): el propio
// `system` se contradecía —«no das dosis» y doce líneas abajo «te digo la
// cantidad»— y *dos líneas del mismo system que se contradicen no dejan una
// regla a medias: dejan la que invita*. Un prompt es una promesa que el modelo
// puede incumplir; una puerta es un hecho. **Todo lo que acá se puede hacer
// cumplir, se hace cumplir acá, y el prompt no vuelve a nombrarlo como si
// dependiera de él.**
//
// ── LISTA BLANCA, JAMÁS LISTA NEGRA — Y ES LA DECISIÓN DE DISEÑO DEL LOTE ────
// 🔴 Una lista negra (`estado`, `monto`, `transicion`…) sólo atrapa los nombres
// que a mí se me ocurrieron hoy. `monto_devuelto`, `total`, `nuevo_estado` o
// `resolucion` pasarían enteros, y el gate daría VERDE informando que no hay
// campos de plata. *Un guard que enumera lo prohibido mide mi imaginación, no
// la salida del modelo.* Por eso la forma es al revés: **se declara lo que
// puede pasar y todo lo demás cae solo** — el estado malo se vuelve
// inexpresable en vez de vigilado (la forma de `L-439` y de la cura de `D-731`:
// no fue leer mejor, fue que el estado malo no pudiera existir).
//
// La lista negra igual existe más abajo, pero **NO como defensa: como CONTROL**
// — es el conjunto con el que se prueba que la blanca los atrapa. Si algún día
// la blanca dejara pasar uno de ésos, el arnés lo dice.

/** Una fila de `cat_motivos_postventa`, tal como la trae la base. */
export interface MotivoCatalogo {
  codigo: string
  objeto: string
  clase: number
  urgente: boolean
  voz: string
  pide_foto: boolean
  /** El lector filtra por esto: un motivo desactivado deja de ofrecerse. */
  activo?: boolean
}

/** Los rechazos, nombrados. Cada uno es uno de los rojos de §11. */
export type RechazoIntake =
  | 'forma_invalida'
  | 'motivo_fuera_de_catalogo'
  | 'campo_que_decide'
  | 'confirmacion_fabricada'
  | 'resumen_vacio'

/**
 * Lo que la edge devuelve. **No hay `confirmado_por` en este tipo, y su
 * ausencia es la ley y no un olvido**: ese campo nace del acto humano de
 * confirmar, y la RPC de A lo exige. Si viviera acá, el modelo o la edge
 * podrían llenarlo y la confirmación pasaría a ser un campo más de un JSON.
 */
export interface PropuestaIntake {
  /** Código del catálogo. Verificado contra la fila, no contra una lista mía. */
  motivo: string
  objeto: string
  /** 🔴 COPIADA DE LA FILA. Aunque el modelo la mande, se pisa con ésta. */
  clase: number
  /** 🔴 COPIADA DE LA FILA (§4: clase 3 ⟺ urgente, amarrado por CHECK). */
  urgente: boolean
  pide_foto: boolean
  /** La voz del catálogo — para que la superficie muestre la del founder. */
  voz_catalogo: string
  /** Una línea, tuteo. Lo único que el modelo REDACTA de verdad. */
  resumen: string
  /** Qué evidencia falta. Del vocabulario cerrado de abajo. */
  evidencia_falta: EvidenciaFaltante[]
  procedencia: 'ia_intake'
  modo: 'texto' | 'voz'
  /** Marca que esto es una PROPUESTA y todavía no existe ningún caso. */
  es_propuesta: true
}

/**
 * 🔴 LA EVIDENCIA TAMBIÉN ES VOCABULARIO CERRADO, por la misma razón que el
 * motivo. Si fuera texto libre, el modelo pediría «la factura del veterinario»
 * o «el número de guía» — cosas que la app no sabe pedir, y la familia quedaría
 * mirando un requisito sin camino. *Pedir evidencia que ninguna pantalla puede
 * recibir es peor que no pedir nada: parece un trámite y es un callejón.*
 */
export const EVIDENCIAS = ['foto', 'hora_del_hecho', 'que_paso', 'monto_cobrado'] as const
export type EvidenciaFaltante = typeof EVIDENCIAS[number]

/**
 * LAS CLAVES QUE EL MODELO PUEDE MANDAR. Nada más entra al objeto de salida.
 * `clase` NO está: si el modelo la manda, se descarta y se cuenta (ver abajo).
 */
const CLAVES_PERMITIDAS = new Set(['motivo', 'resumen', 'evidencia_falta'])

/**
 * 🔴 EL CONTROL, NO LA DEFENSA. Estas claves son las que §11 nombra como rojo
 * («cualquier campo de estado o de plata en la salida del modelo»), más la
 * `clase` de §4 y el `confirmado_por` del acto humano.
 *
 * La lista blanca de arriba ya las excluye a todas por construcción. Esto
 * existe para dos cosas y ninguna es filtrar:
 *   ① que el arnés pueda probar que la blanca las atrapa —una por una—, y
 *   ② que cuando aparezcan se puedan **contar por nombre**, que es dato para E:
 *      «el modelo intentó poner `monto` en 3 de 30» es una medición; «cayó por
 *      campo desconocido» no dice qué intentó.
 */
export const CAMPOS_QUE_DECIDEN = [
  'estado', 'nuevo_estado', 'transicion', 'transición', 'resolucion', 'resolución',
  'monto', 'monto_devuelto', 'total', 'importe', 'reembolso', 'devolucion', 'devolución',
  'clase', 'destino', 'decidido_por', 'aprobado',
] as const

/** Las que, si aparecen, son la confirmación fabricada — el primer rojo. */
export const CAMPOS_DE_CONFIRMACION = ['confirmado_por', 'confirmado', 'confirmado_en'] as const

export type ResultadoIntake =
  | {
    ok: true
    propuesta: PropuestaIntake
    /** Claves que el modelo mandó de más y se descartaron. Dato, no error. */
    descartadas: string[]
  }
  | { ok: false; rechazo: RechazoIntake; detalle: string }

/** Normaliza para comparar: minúsculas y sin tildes. */
const plano = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

/**
 * LA PUERTA. Toma lo que devolvió el modelo (crudo) y el catálogo VIVO, y
 * devuelve una propuesta que ya no puede decidir nada.
 *
 * `catalogo` llega de la base en cada llamada — **no se cachea ni se copia a
 * una constante**: un catálogo pegado en el código envejece solo, y el día que
 * el founder desactive un motivo la edge lo seguiría ofreciendo (es la clase de
 * `catalogo-de-arnes-envejece-solo`, ya cobrada en esta casa).
 */
export function validarIntake(
  crudo: unknown,
  catalogo: MotivoCatalogo[],
  objeto: string,
  modo: 'texto' | 'voz',
): ResultadoIntake {
  if (typeof crudo !== 'object' || crudo === null || Array.isArray(crudo)) {
    return { ok: false, rechazo: 'forma_invalida', detalle: 'la salida no es un objeto' }
  }
  const o = crudo as Record<string, unknown>
  const claves = Object.keys(o)

  // ── ROJO ①: la confirmación fabricada ────────────────────────────────────
  // Va PRIMERO y con nombre propio. Podría caer sola por la lista blanca, pero
  // entonces se reportaría como «campo desconocido» y se perdería justo la
  // señal que la letra manda vigilar.
  const conf = claves.find((k) => (CAMPOS_DE_CONFIRMACION as readonly string[]).includes(plano(k)))
  if (conf !== undefined) {
    return {
      ok: false,
      rechazo: 'confirmacion_fabricada',
      detalle: `la salida trae \`${conf}\`: la confirmación es un acto humano, no un campo`,
    }
  }

  // ── ROJO ②: un campo que decide (estado, plata, transición, clase) ───────
  const decide = claves.find((k) => (CAMPOS_QUE_DECIDEN as readonly string[]).includes(plano(k)))
  if (decide !== undefined) {
    return {
      ok: false,
      rechazo: 'campo_que_decide',
      detalle: `la salida trae \`${decide}\`: el modelo redacta, no decide`,
    }
  }

  // ── ROJO ③: el motivo fuera del catálogo ─────────────────────────────────
  const motivo = typeof o.motivo === 'string' ? o.motivo.trim() : ''
  if (motivo === '') {
    return { ok: false, rechazo: 'forma_invalida', detalle: 'falta `motivo`' }
  }
  // Se busca el par (codigo, objeto) — que es la PK real del catálogo — y se
  // acepta también `objeto='todos'`, que es donde vive `otra_cosa`.
  // ⚠️ §4: la estadía HEREDA los motivos de cita, y esa herencia la resuelve el
  // LECTOR (así lo dice el COMMENT de la tabla de A), no el catálogo. Acá está
  // el lector, así que la herencia vive acá y en un solo lugar.
  const objetosValidos = objeto === 'estadia'
    ? ['estadia', 'cita', 'todos']
    : [objeto, 'todos']
  const fila = catalogo.find(
    (m) => m.codigo === motivo && objetosValidos.includes(m.objeto) && m.activo !== false,
  )
  if (fila === undefined) {
    return {
      ok: false,
      rechazo: 'motivo_fuera_de_catalogo',
      detalle: `\`${motivo}\` no es un motivo activo de \`${objeto}\``,
    }
  }

  // ── El resumen: lo único que el modelo de verdad aporta ──────────────────
  const resumen = typeof o.resumen === 'string' ? o.resumen.trim() : ''
  if (resumen === '') {
    return { ok: false, rechazo: 'resumen_vacio', detalle: 'falta `resumen`' }
  }

  // ── La evidencia, filtrada contra el vocabulario cerrado ─────────────────
  const pedidas = Array.isArray(o.evidencia_falta) ? o.evidencia_falta : []
  const evidencia_falta = pedidas
    .filter((e): e is EvidenciaFaltante =>
      typeof e === 'string' && (EVIDENCIAS as readonly string[]).includes(e)
    )
    // Sin repetidos: el modelo a veces lista dos veces lo mismo.
    .filter((e, i, a) => a.indexOf(e) === i)

  const descartadas = claves.filter((k) => !CLAVES_PERMITIDAS.has(k))

  return {
    ok: true,
    descartadas,
    propuesta: {
      motivo: fila.codigo,
      objeto: fila.objeto,
      // 🔴 LAS TRES QUE VIENEN DE LA FILA Y NUNCA DEL MODELO.
      clase: fila.clase,
      urgente: fila.urgente,
      pide_foto: fila.pide_foto,
      voz_catalogo: fila.voz,
      resumen,
      evidencia_falta,
      procedencia: 'ia_intake',
      modo,
      es_propuesta: true,
    },
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// LA HOJA DEL CASO (§11, fila «Hoja del caso»)
//   «resume hilo + objeto → propone resolución con su porqué, marcada
//    "propuesta"» · «la casa decide; queda `decidido_por`».
// ═══════════════════════════════════════════════════════════════════════════

export type RechazoHoja =
  | 'forma_invalida'
  | 'campo_que_decide'
  | 'sin_propuesta'
  | 'propuesta_multiple'
  | 'sin_porque'

export interface PropuestaHoja {
  /** Prosa: qué pasó, leído del hilo y de la evidencia del objeto. */
  resumen_hilo: string
  /** UNA propuesta. En prosa, sin un solo campo maquinable. */
  propuesta: { que: string; porque: string }
  /** Siempre `true`. La superficie la muestra marcada, no como una decisión. */
  es_propuesta: true
}

export type ResultadoHoja =
  | { ok: true; hoja: PropuestaHoja; descartadas: string[] }
  | { ok: false; rechazo: RechazoHoja; detalle: string }

const CLAVES_HOJA = new Set(['resumen_hilo', 'propuesta'])
const CLAVES_PROPUESTA = new Set(['que', 'porque'])

/**
 * 🔴 DÓNDE ESTÁ EXACTAMENTE LA LÍNEA, Y CUÁL ES SU LÍMITE — se declara porque
 * la línea NO es «no hablar de plata», y confundirlas rompe la pieza.
 *
 * Lo que se prohíbe es el campo **MAQUINABLE**: un `monto: 45` es un valor que
 * alguien pasa a una RPC, y ahí el modelo decidió plata aunque nadie lo haya
 * querido. Lo que se permite es la **PROSA**: «devolverle lo que pagó» es una
 * sugerencia que un humano tiene que convertir en un número mirando el objeto,
 * y ése es justamente el acto que §6 le encarga a la RPC —*«la RPC le pregunta
 * al objeto si tiene evento económico»*—, no a esta lectura.
 *
 * ⚠️ **Lo que esto NO evita, y se dice para que nadie lo lea como cubierto:**
 * el modelo puede escribir «devolverle los $45» dentro de la prosa, y una
 * persona apurada puede copiar ese número. **El código no lo puede separar de
 * una frase legítima** —es la misma clase de límite que el muro de NEXO declara
 * para «alto en general» vs «el suyo está alto»—. Lo sostienen dos cosas que sí
 * existen: la propuesta va **marcada como propuesta**, y el monto real lo mide
 * la RPC contra el objeto, no contra este texto. *Un tercer detector romo que
 * cortara números en prosa mataría la mitad de las propuestas útiles y daría
 * sensación de cubierto, que es peor.*
 */
export function validarHoja(crudo: unknown): ResultadoHoja {
  if (typeof crudo !== 'object' || crudo === null || Array.isArray(crudo)) {
    return { ok: false, rechazo: 'forma_invalida', detalle: 'la salida no es un objeto' }
  }
  const o = crudo as Record<string, unknown>

  const decide = Object.keys(o).find((k) => (CAMPOS_QUE_DECIDEN as readonly string[]).includes(plano(k)))
  if (decide !== undefined) {
    return { ok: false, rechazo: 'campo_que_decide', detalle: `la salida trae \`${decide}\`` }
  }

  const resumen_hilo = typeof o.resumen_hilo === 'string' ? o.resumen_hilo.trim() : ''
  if (resumen_hilo === '') {
    return { ok: false, rechazo: 'forma_invalida', detalle: 'falta `resumen_hilo`' }
  }

  // §11 dice UNA propuesta. Un array no se recorta a su primer elemento: eso
  // elegiría por la casa cuál de las que escribió el modelo vale.
  if (Array.isArray(o.propuesta)) {
    return { ok: false, rechazo: 'propuesta_multiple', detalle: `llegaron ${o.propuesta.length} propuestas y §11 pide una` }
  }
  if (typeof o.propuesta !== 'object' || o.propuesta === null) {
    return { ok: false, rechazo: 'sin_propuesta', detalle: 'falta `propuesta`' }
  }
  const pr = o.propuesta as Record<string, unknown>

  const decideEnPropuesta = Object.keys(pr).find((k) => (CAMPOS_QUE_DECIDEN as readonly string[]).includes(plano(k)))
  if (decideEnPropuesta !== undefined) {
    return { ok: false, rechazo: 'campo_que_decide', detalle: `\`propuesta.${decideEnPropuesta}\`` }
  }

  const que = typeof pr.que === 'string' ? pr.que.trim() : ''
  const porque = typeof pr.porque === 'string' ? pr.porque.trim() : ''
  if (que === '') return { ok: false, rechazo: 'sin_propuesta', detalle: 'falta `propuesta.que`' }
  // El porqué no es adorno: es lo que la casa lee para decidir si la comparte.
  // Una propuesta sin su razón se lee como una orden.
  if (porque === '') return { ok: false, rechazo: 'sin_porque', detalle: 'falta `propuesta.porque`' }

  return {
    ok: true,
    descartadas: [
      ...Object.keys(o).filter((k) => !CLAVES_HOJA.has(k)),
      ...Object.keys(pr).filter((k) => !CLAVES_PROPUESTA.has(k)).map((k) => `propuesta.${k}`),
    ],
    hoja: { resumen_hilo, propuesta: { que, porque }, es_propuesta: true },
  }
}
