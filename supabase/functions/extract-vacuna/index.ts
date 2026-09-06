// extract-vacuna — extracción de vacunas desde la foto de un carnet físico.
//
// ── HISTORIA CORTA HASTA v21 (S46 → S48) ────────────────────────────────────
// v17 infirió `tipo_vacuna` de un vocabulario CERRADO. v18 y v19 pelearon la
// ATRIBUCIÓN DE COLUMNA: el modelo tomaba las fechas IMPRESAS de los stickers
// (lote/vencimiento de fábrica) como fecha de aplicación. v20 movió el modelo a
// Sonnet 5 porque Haiku 4.5 topaba en esa atribución espacial. **v22 se ensayó
// y se REVIRTIÓ: más reglas EMPEORARON** (truncado + fechas compartidas entre
// filas vecinas). El prompt vigente hasta hoy era el de v21.
//
// ── v2 (S113-D, lote 1.0) — LA LÍNEA BASE QUE LA OBLIGA ─────────────────────
// Medido por E y A sobre 5 carnets reales (`D-1012`):
//   · **83 s promedio, 114 s el peor.** La familia mira la espera todo ese rato.
//   · **un carnet de UNA vacuna devolvió DOCE.** Once inventadas.
//   · **$0,0715 por carnet** — 4.036 tokens de entrada, **6.347 de salida**.
//   · exactitud: nombre 65,6 % · fecha 62,5 % · lote 81,3 % · vet 42,1 %.
//
// ── 🔴 POR QUÉ ESTE PROMPT NO ES «MÁS PROMPT», QUE YA FRACASÓ ───────────────
// `D-1012` dice, con razón, que *«no se cura con un prompt»*, y cita v22. Pero
// v22 agregó una PROHIBICIÓN más («no compartas fechas»), y v2 hace lo
// contrario: **le da un LUGAR a lo que sobra.**
//
// El carnet trae impreso, de fábrica, el PLAN de vacunación: renglones con
// nombres y espacios en blanco. El prompt viejo pedía «extraé las vacunas» y no
// ofrecía ningún destino para esos renglones. *Un modelo que ve doce nombres y
// tiene un solo canasto, los mete en el canasto.* No estaba desobedeciendo una
// regla: estaba resolviendo una ambigüedad de la única forma que podía.
//
// `plan_impreso` es ese segundo canasto. **La diferencia entre v22 y v2 no es
// cuántas reglas hay: es que ahora la respuesta correcta es expresable.**
//
// ── LO QUE TAMBIÉN CAMBIA, Y NO ES DEL PROMPT ──────────────────────────────
// `max_tokens` 16000 → **2000** y **razonamiento APAGADO** para esta pieza
// (`PENSAR.carnet = false`). Los 6.347 tokens de salida no son el JSON —el JSON
// de doce vacunas no llega a 1.000—, así que la mayor parte era razonamiento, y
// a $10/MTok de salida ahí está el 89 % del costo. **Es una inferencia, no una
// medición** (la API no separa esos tokens): el experimento que la decide es de
// E, y es correr el mismo carnet con `pensar` en true y en false.
//
// ⚠️ **Y el riesgo va en la otra dirección:** S48 midió que el razonamiento era
// justo lo que resolvía la atribución sticker↔FECHA. **E mide EXACTITUD contra
// las 32 filas de verdad, no sólo costo y latencia.** Si cae, la tercera
// variante está servida sin tocar código: `esfuerzo: 'low'` con `pensar: true`.
//
// Contrato:
//   POST { imageBase64: string, mediaType?: string, modelo?: string }
//   200 → { vacunas: [...], plan_impreso: [{ nombre }] }   (ver TIPOS abajo)
//   error → { codigo, mensaje }:
//     imagen_invalida        400 · configuracion_faltante 500
//     error_modelo           502 · extraccion_fallida     422

import { createClient } from 'npm:@supabase/supabase-js@2'
import { exigirSesion, rolDeSesion } from '../_shared/sesion.ts'
import { llamarModelo } from '../_shared/ia/mod.ts'

const corsHeaders = {
  // '*' a sabiendas: los callers son apps nativas (fetch sin CORS) y no existe
  // todavía dominio web canónico que fijar. El gate real es verify_jwt.
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const JSON_HEADERS = { ...corsHeaders, 'Content-Type': 'application/json' }

type CodigoError =
  | 'imagen_invalida'
  | 'configuracion_faltante'
  | 'error_modelo'
  | 'extraccion_fallida'

const STATUS: Record<CodigoError, number> = {
  imagen_invalida: 400,
  configuracion_faltante: 500,
  error_modelo: 502,
  extraccion_fallida: 422,
}

function error(codigo: CodigoError, mensaje: string): Response {
  return new Response(JSON.stringify({ codigo, mensaje }), {
    status: STATUS[codigo],
    headers: JSON_HEADERS,
  })
}

const MEDIA_TYPES_VALIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/**
 * 🔴 TECHO DE 2 MB, y no es un número de gusto — es una defensa MEDIDA.
 *
 * C achica el carnet a 1600 px de lado mayor en JPEG antes de mandarlo
 * (`carnet.tsx`, `LADO_CARNET = 1600`), y los cinco carnets reales del conjunto
 * de E pesan entre **107 kB y 246 kB**. O sea que 2 MB es ~8× el peor caso real.
 *
 * Pero el techo NO existe por el camino feliz: existe porque `capturaFoto.tsx`
 * declara, literal, que **si el resize falla sigue con la ORIGINAL**. Una foto
 * de 12 MP sin achicar puede llegar acá, y hoy pasaba —el techo viejo eran 5 MB—
 * costando tokens de imagen y segundos de espera por una foto que nadie pidió
 * en ese tamaño. *El límite viejo protegía a la API; éste protege a la familia.*
 */
const MAX_BYTES_IMAGEN = 2 * 1024 * 1024
const MAX_BASE64_CHARS = Math.ceil(MAX_BYTES_IMAGEN / 3) * 4

/**
 * 🔒 LISTA BLANCA DEL OVERRIDE DE MODELO — la palanca de medición de E.
 *
 * Son exactamente los dos modelos que el lote 1 compara. Cualquier otro nombre
 * rebota tipado. **Y sólo la honra un token `service_role`**: la app manda
 * `authenticated`, así que desde el teléfono el modelo NO se puede mover.
 * *Una palanca de medición que un cliente puede tocar deja de ser una palanca
 * de medición y pasa a ser una superficie.*
 */
const MODELOS_MEDIBLES = ['claude-sonnet-5', 'claude-haiku-4-5']

// ── EL CONTRATO DE SALIDA, TIPADO ───────────────────────────────────────────

/** Cerrado por el CHECK real de `evento_vacuna_aplicada.via_administracion`
 *  (medido, no copiado de un doc). Fuera de esta lista, la RPC rebota. */
const VIAS = ['subcutanea', 'intramuscular', 'intranasal', 'oral'] as const

/**
 * 🔴 `D-008` PAGADA (S113-D-2.2): el vocabulario de vacunas **sale de
 * `cat_vacunas`, no del prompt.** La enmienda decía literal *«cuando
 * `cat_vacunas` exista, sale de la DB y no del prompt»*. Existe: **7 filas.**
 *
 * Y el cambio no es de prolijidad — **quita una fragilidad medida**. El
 * proto-catálogo eran NOMBRES con tilde (`'antirrábica'`, `'múltiple'`) y el
 * validador exigía la cadena exacta: **una sola emisión sin tilde rebotaba el
 * carnet ENTERO con 422**. Los códigos no tienen tildes ni espacios
 * (`antirrabica`, `tos_perreras`), así que esa clase de falla deja de existir.
 *
 * El modelo emite **el CÓDIGO**; `tipo_vacuna` lo DERIVA esta function desde el
 * catálogo — **el mismo dato que la RPC ya escribe**, así que las 22 de 32
 * filas pobladas se siguen poblando. *Un solo juicio del modelo, dos campos de
 * salida, cero oportunidades de que se contradigan entre sí.*
 */
interface FilaCatalogo { codigo: string; nombre: string }

const CONFIANZAS = ['alta', 'media', 'baja'] as const
/**
 * 🔴 QUÉ PRUEBA LA APLICACIÓN — y nada más. `sticker_con_fecha` se jubila
 * (S113-D-2.1, firma del founder): mezclaba **qué se vio** con **dónde estaba
 * la fecha**, que son dos preguntas. La fecha ya tiene su propio campo; este
 * dice qué marca física prueba que la vacuna se aplicó.
 */
const EVIDENCIAS = ['sticker', 'sello', 'manuscrito', 'impreso'] as const

interface VacunaExtraida {
  /**
   * 🔴 NULLABLE desde S113-D-2.4, por FIRMA DEL FOUNDER (opción (b)).
   *
   * El caso medido: el documento A tiene dos renglones —el par de Recombitek de
   * 2021-02-12 y el sticker beige de 2023-03-15— **donde hay una vacuna y su
   * nombre no se puede leer**. Con `nombre` obligatorio, el modelo devolvía
   * `null` igual y **la edge rebotaba el carnet ENTERO con 422**: catorce filas
   * buenas perdidas por dos que nadie puede nombrar.
   *
   * *Una fila que dice «acá hubo una vacuna el 15/03/23 y no pude leer cuál» es
   * corregible; una que desaparece en silencio deja el expediente incompleto
   * sin que nadie lo sepa.*
   *
   * ⚠️ **La base NO cambia:** `evento_vacuna_aplicada.nombre_vacuna` sigue
   * `NOT NULL` y la RPC tampoco se toca. **Nada se guarda sin nombre** — la
   * pantalla de confirmación obliga a completarlo antes de escribir.
   */
  nombre: string | null
  fecha_aplicada: string | null
  fecha_proxima: string | null
  lote: string | null
  laboratorio: string | null
  via: typeof VIAS[number] | null
  veterinario: string | null
  vencimiento_biologico: string | null
  /**
   * Qué tan fina es `fecha_aplicada`, y **siempre coincide con su forma**.
   * `null` si y sólo si la fecha es `null`.
   */
  fecha_aplicada_precision: Precision | null
  /** La transcripción EXACTA de lo que el carnet trae: «FEB 2023», «26 JUN».
   *  Es lo que deja verificar la precisión sin creerle al modelo — y lo que la
   *  pantalla le muestra a la persona al lado del campo. */
  fecha_literal: string | null
  fecha_proxima_precision: Precision | null
  fecha_proxima_literal: string | null
  /** DERIVADO por esta function, no por el modelo: por qué la fila hay que
   *  mirarla. `null` = nada que señalar. */
  dudosa: 'fecha' | null
  /** Código de `cat_vacunas`, o `null` si el modelo no lo puede mapear. */
  vacuna_codigo: string | null
  /**
   * TODOS los códigos que esta aplicación cubre — una combinada protege contra
   * varias cosas a la vez. Lista blanca contra el mismo catálogo. **Vacía si el
   * modelo no está seguro**: una cobertura inventada le dice al plan vacunal
   * que la mascota está protegida contra algo que quizá no recibió.
   */
  cubre: string[]
  /** DERIVADO del código por esta function — el modelo no lo escribe. */
  tipo_vacuna: string | null
  confianza: typeof CONFIANZAS[number]
  evidencia: typeof EVIDENCIAS[number]
}

/**
 * 🔴 FECHAS CON PRECISIÓN (S113-D-2.5, firma del founder): el carnet trae lo
 * que trae, y **el día no se inventa**.
 *
 * El caso que lo motivó está MEDIDO y vivo: en el documento A, los renglones 7
 * y 8 dicen **«FEB 2023»** en la columna PRÓXIMA — mes y año, sin día. El
 * modelo devolvió **`2023-02-25`**, copiándole el día 25 a la fecha de
 * aplicación de esa misma fila. *Nadie escribió un 25 en ese carnet.*
 *
 * La forma DETERMINA la precisión, así que las dos no se pueden contradecir:
 *   `YYYY-MM-DD` → 'dia'   ·  `YYYY-MM` → 'mes'  ·  `--MM-DD` → 'sin_anio'
 * (`--MM-DD` es la forma ISO 8601 para mes-y-día sin año: «15/JUL» del carnet.)
 *
 * ⚠️ **ESTE VOCABULARIO NO ES EL DE LA CASA, y se declara.** `mascotas` usa
 * `chk_mascotas_fecha_nacimiento_precision` = **`exacta | aproximada |
 * estimada`**, y `CampoFecha` lo espeja. **No lo reusé porque no puede expresar
 * `sin_anio`**: una fecha de nacimiento siempre tiene año, y un carnet
 * perfectamente puede traer «26 JUN» y nada más. El mapeo, para quien tenga que
 * cruzarlos: `dia` ≈ `exacta` · `mes` ≈ `aproximada` · **`sin_anio` no tiene
 * equivalente**.
 */
const PRECISIONES = ['dia', 'mes', 'sin_anio'] as const
type Precision = typeof PRECISIONES[number]

const FORMAS: Record<Precision, RegExp> = {
  dia: /^\d{4}-\d{2}-\d{2}$/,
  mes: /^\d{4}-\d{2}$/,
  sin_anio: /^--\d{2}-\d{2}$/,
}

/** La precisión que la FORMA implica, o `null` si no es ninguna de las tres. */
function precisionDe(v: string): Precision | null {
  for (const p of PRECISIONES) if (FORMAS[p].test(v)) return p
  return null
}

/** Fecha parcial o completa, o null. **Nunca una forma libre.** */
function fechaParcialOnull(v: unknown): boolean {
  return v === null || (typeof v === 'string' && precisionDe(v) !== null)
}

const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/

/**
 * 🔴 LO QUE FALTA NO TUMBA LA TANDA (S113-D-2.8, firma del founder).
 *
 * `undefined` y `''` se leen como `null`: **un campo ausente y un campo vacío
 * son la misma cosa — «no está»** — y ninguno es razón para tirar una fila,
 * mucho menos un carnet entero. *Catorce vacunas reales no se pierden porque el
 * modelo se olvidó de escribir una clave.*
 */
const aTextoOnull = (v: unknown): string | null =>
  v === undefined || v === null || (typeof v === 'string' && v.trim().length === 0)
    ? null
    : typeof v === 'string' ? v : undefined as unknown as string | null

/** `true` si el valor es de un TIPO que no corresponde (no ausente: equivocado). */
const tipoMalo = (v: unknown): boolean =>
  v !== undefined && v !== null && typeof v !== 'string'

const fechaOnull = (v: unknown): v is string | null =>
  v === null || (typeof v === 'string' && RE_FECHA.test(v))

const enListaOnull = (v: unknown, lista: readonly string[]): boolean =>
  v === null || (typeof v === 'string' && lista.includes(v))

/** La lista blanca se exige contra el catálogo REAL, leído en esta llamada —
 *  no contra una copia en el código. *Un vocabulario cerrado que vive en el
 *  prompt es una sugerencia; el que vive en el validador es un vocabulario
 *  cerrado* (mismo criterio que `sugerir-raza`). */
/**
 * 🔴 SANEA UNA FILA — y la ley es una sola: **lo que falta se marca; sólo lo
 * MALFORMADO se descarta, y descarta ESA FILA diciendo cuál, nunca la tanda.**
 *
 * La distinción que lo ordena todo:
 * · **ausente / vacío / ilegible** ⇒ `null` y la fila sale **marcada**. El
 *   carnet no lo decía o el modelo no lo leyó: la persona lo completa mirando.
 * · **TIPO equivocado** (un número donde va texto, un texto donde va lista)
 *   ⇒ se descarta **esa fila**, con su motivo. Eso no es un dato faltante: es
 *   una respuesta rota, y no hay nada que la persona pueda corregir ahí.
 *
 * *Antes, cualquiera de los dos rebotaba el carnet entero con 422. Un carnet de
 * quince vacunas se perdía porque una fila venía sin una clave.*
 */
/**
 * 🔴 EL CONTROL DETERMINISTICO — no le creemos al `precision` del modelo: lo
 * verificamos contra **su propia transcripción**.
 *
 * El caso que lo obligó, medido dos veces: el carnet dice **«Feb/2023»** y el
 * modelo devuelve `2023-02-25` **declarando `dia`**. No es que se olvide de
 * declararlo: *afirma con confianza que leyó un día que no existe.* Pedirle el
 * literal y contar sus componentes acá **saca la decisión del modelo** — una
 * fecha completa necesita tres cosas escritas, y eso se cuenta.
 *
 * Un COMPONENTE es un grupo de dígitos o un nombre de mes:
 *   «3 Ago 2023» → 3   ·  «19-4-23» → 3   ·  «13/NOV 2022» → 3   ⇒ hay día
 *   «Feb/2023»   → 2   ·  «05-2024» → 2                          ⇒ NO hay día
 */
const MESES_ES = /\b(ene|feb|mar|abr|may|jun|jul|ago|sep|set|oct|nov|dic)\w*/gi

function componentesDe(literal: string): number {
  return (literal.match(/\d+/g) ?? []).length + (literal.match(MESES_ES) ?? []).length
}

/** Cuántos componentes EXIGE cada precisión para ser creíble. */
const COMPONENTES_MINIMOS: Record<Precision, number> = { dia: 3, mes: 2, sin_anio: 2 }

/**
 * `true` si el literal NO alcanza para sostener la precisión declarada. Es la
 * señal de que el modelo completó algo. **No corrige la fecha** —no sabemos
 * cuál es la buena— **marca la fila** para que la persona la mire.
 */
function literalNoSostiene(literal: unknown, precision: unknown): boolean {
  if (typeof literal !== 'string' || literal.trim().length === 0) return false
  if (typeof precision !== 'string' || !(PRECISIONES as readonly string[]).includes(precision)) return false
  return componentesDe(literal) < COMPONENTES_MINIMOS[precision as Precision]
}

type Saneo =
  | { ok: true; fila: Record<string, unknown>; incompleta: boolean }
  | { ok: false; motivo: string }

function sanearFila(v: unknown, codigos: readonly string[]): Saneo {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) {
    return { ok: false, motivo: 'no es un objeto' }
  }
  const o = v as Record<string, unknown>
  let incompleta = false
  const faltó = () => { incompleta = true; return null }

  // ── tipos: lo único que descarta ────────────────────────────────────────
  for (const k of ['nombre', 'fecha_aplicada', 'fecha_proxima', 'vencimiento_biologico',
                   'fecha_literal', 'fecha_proxima_literal', 'lote', 'laboratorio',
                   'veterinario', 'via', 'vacuna_codigo', 'confianza', 'evidencia',
                   'fecha_aplicada_precision', 'fecha_proxima_precision']) {
    if (tipoMalo(o[k])) return { ok: false, motivo: `\`${k}\` no es texto` }
  }
  if (o.cubre !== undefined && o.cubre !== null && !Array.isArray(o.cubre)) {
    return { ok: false, motivo: '`cubre` no es una lista' }
  }

  // ── valores: lo que no sirve se anula y MARCA ───────────────────────────
  const texto = (k: string): string | null => {
    const t = aTextoOnull(o[k])
    if (t === null && o[k] !== null && o[k] !== undefined) return faltó()
    if (t === null) { if (o[k] === undefined) incompleta = true; return null }
    return t
  }
  const fecha = (k: string): string | null => {
    const t = texto(k)
    if (t === null) return null
    if (precisionDe(t) === null) return faltó()   // formato ilegible ⇒ null + marca
    return t
  }
  const deLista = (k: string, lista: readonly string[]): string | null => {
    const t = texto(k)
    if (t === null) return null
    return lista.includes(t) ? t : faltó()
  }

  const fechaAplicada = fecha('fecha_aplicada')
  const fechaProxima = fecha('fecha_proxima')
  const nombre = texto('nombre')
  const lote = texto('lote')

  // Precisión: se DERIVA de la forma, no se le cree al modelo. Si declaró otra,
  // se marca — la forma manda porque es lo que se puede comprobar.
  const precAplicada = fechaAplicada === null ? null : precisionDe(fechaAplicada)
  const precProxima = fechaProxima === null ? null : precisionDe(fechaProxima)
  if (fechaAplicada !== null && o.fecha_aplicada_precision !== precAplicada) incompleta = true
  if (fechaAplicada === null && o.fecha_aplicada_precision != null) incompleta = true

  // Cobertura: se filtra lo que no está en el catálogo, no se tira la fila.
  const cubreCrudo = Array.isArray(o.cubre) ? o.cubre : []
  const cubre = [...new Set(cubreCrudo.filter((c): c is string => typeof c === 'string' && codigos.includes(c)))]
  if (cubre.length !== cubreCrudo.length) incompleta = true

  const confianza = deLista('confianza', CONFIANZAS) ?? 'baja'
  const evidencia = deLista('evidencia', EVIDENCIAS)
  // 🔴 TODO campo se resuelve ACÁ, jamás dentro del objeto que se devuelve:
  // `incompleta` se lee al armar ese objeto, así que un `faltó()` disparado
  // adentro llegaría tarde y la marca se perdería en silencio. Lo cazó el
  // arnés — `via` y `vacuna_codigo` anulaban el valor y NO marcaban la fila.
  const fechaLiteral = texto('fecha_literal')
  const fechaProximaLiteral = texto('fecha_proxima_literal')
  const laboratorio = texto('laboratorio')
  const veterinario = texto('veterinario')
  const via = deLista('via', VIAS)
  const vencimiento = fecha('vencimiento_biologico')
  const vacunaCodigo = deLista('vacuna_codigo', codigos)

  // 🔴 EL ANCLA sigue: sin nombre NI fecha NI lote no hay nada que registrar ni
  // que corregir. Eso NO es un dato faltante: es una fila vacía.
  if (nombre === null && fechaAplicada === null && lote === null) {
    return { ok: false, motivo: 'sin nombre, sin fecha y sin lote: no hay nada que registrar' }
  }
  if (fechaAplicada === null) incompleta = true

  return {
    ok: true,
    incompleta,
    fila: {
      nombre,
      fecha_aplicada: fechaAplicada,
      fecha_aplicada_precision: precAplicada,
      fecha_literal: fechaLiteral,
      fecha_proxima: fechaProxima,
      fecha_proxima_precision: precProxima,
      fecha_proxima_literal: fechaProximaLiteral,
      lote,
      laboratorio,
      via,
      veterinario,
      vencimiento_biologico: vencimiento,
      vacuna_codigo: vacunaCodigo,
      cubre,
      confianza,
      evidencia,
    },
  }
}

function esFilaPlan(v: unknown): v is { nombre: string } {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  return typeof o.nombre === 'string' && o.nombre.trim().length > 0
}

const PROMPT = (catalogo: FilaCatalogo[]) => `Sos un lector de carnets de vacunación veterinaria latinoamericanos.
Devolvés DATOS. No explicás, no razonás por escrito, no agregás una sola palabra fuera del JSON.

═══ LO QUE HAY QUE DISTINGUIR — ES TODO EL TRABAJO ═══

Un carnet tiene DOS cosas que se parecen y NO son lo mismo:

(A) EL PLAN IMPRESO. La lista que el carnet trae impresa de fábrica, como
    formulario: renglones con el nombre de una vacuna y los espacios al lado
    VACÍOS, esperando que alguien los llene. Es lo que la mascota DEBERÍA
    recibir algún día. NO es una aplicación. Va a "plan_impreso".

(B) LAS APLICACIONES. Los renglones que tienen una MARCA de que alguien
    efectivamente aplicó algo:
      · un STICKER del frasco pegado encima, o
      · un SELLO de la clínica, o
      · algo ESCRITO A MANO (fecha, firma, iniciales).
    Es lo que la mascota SÍ recibió. Va a "vacunas".

🔴 UNA MISMA DOSIS PUEDE TENER DOS STICKERS PEGADOS JUNTOS (la vacuna + su
diluyente o su fracción liofilizada): **es UNA SOLA FILA**, y se nombra con la
VACUNA, nunca con el diluyente. "Diluyente", "Diluente", "Fracción liofilizada"
NO son nombres de vacuna: son la mitad de un par. Si ves esos dos stickers
juntos bajo una misma fecha, la fila lleva el nombre del biológico.

Cada nombre que leas va a UNO de los dos lados, nunca a los dos.
Renglón con nombre impreso y todo lo demás en blanco ⇒ "plan_impreso", siempre.
Si dudás si un renglón tiene marca o no ⇒ "plan_impreso". Es lo barato: una
aplicación que quedó como plan la agrega la familia en diez segundos; una
aplicación inventada queda en el expediente médico del animal.

═══ LA FECHA DEL STICKER NO ES LA FECHA DE APLICACIÓN ═══

El sticker es del FRASCO, impreso en la fábrica: trae el nombre comercial, el
laboratorio, el LOTE y la fecha de VENCIMIENTO del biológico.
La fecha de APLICACIÓN es la que escribió la clínica: a mano, o con sello.

Ejemplo, un renglón real:
  [sticker pegado]  Nobivac DHPPi · Zoetis · Lote 56288 · Vto 05-2025
  [al lado, a mano] 19/4/23   [firma]
Lo correcto es:
  nombre "Nobivac DHPPi" · laboratorio "Zoetis" · lote "56288"
  fecha_aplicada "2023-04-19"      <- lo manuscrito
  vencimiento_biologico null       <- "05-2025" no tiene DÍA, ver abajo
  evidencia "sticker_con_fecha" · confianza "alta"
Poner "2025-05-05" en fecha_aplicada sería el error más caro del carnet.

═══ LOS CAMPOS ═══

- nombre: el nombre comercial tal como está escrito.
  🔴 Si NO lo podés leer, **poné null y DEJÁ LA FILA**. No la omitas.
  Una fila con fecha y sin nombre le dice a la familia <<acá hubo una vacuna el
  15/03/23 y no se lee cuál>>, y ella la completa mirando el carnet en la mano.
  Una fila omitida no le dice nada: la vacuna desaparece y nadie se entera.
  La única fila que NO va es la que no tiene NI nombre NI fecha NI lote: ahí no
  hay nada que registrar ni que corregir.
- fecha_aplicada / fecha_proxima / vencimiento_biologico: **devolvé EXACTAMENTE
  lo que el carnet trae, ni un dígito más.** Tres formas, según lo que se lea:
    día, mes y año  →  "YYYY-MM-DD"   (ej: "3 Ago 2023" → "2023-08-03")
    mes y año       →  "YYYY-MM"      (ej: "FEB 2023"   → "2023-02")
    día y mes, SIN año → "--MM-DD"    (ej: "26 JUN"     → "--06-26")
    nada legible    →  null
  Meses en español: ENE=01 FEB=02 MAR=03 ABR=04 MAY=05 JUN=06 JUL=07 AGO=08
  SEP=09 OCT=10 NOV=11 DIC=12.
  🔴 **PROHIBIDO COMPLETAR.** Si dice "FEB 2023", la respuesta es "2023-02" —
  NO le pongas el día de la fila de arriba, ni el de la fecha de aplicación de
  esa misma fila, ni ninguno. Si dice "26 JUN", la respuesta es "--06-26": el
  año NO se saca del orden del carnet ni de las filas vecinas.
  *Un día inventado se ve igual que uno leído, y por eso nadie lo corrige.*
  La próxima sólo si está escrita: no la calcules.
- fecha_aplicada_precision: "dia", "mes" o "sin_anio" — cuál de las tres formas
  usaste arriba para fecha_aplicada. null si la fecha es null.
- fecha_proxima_precision: lo mismo, para fecha_proxima.
- fecha_literal / fecha_proxima_literal: 🔴 **la transcripción EXACTA de lo que
  está escrito en el carnet**, antes de convertirla. Copiala tal cual la ves,
  con su formato y su ortografía: "FEB 2023", "26 JUN", "3 Ago 2023",
  "02-4 23", "13/NOV". No la normalices, no la completes, no la traduzcas.
  null si no hay nada escrito.
  *Esto es lo que deja comprobar tu propia lectura: si el literal dice
  "FEB 2023" y arriba pusiste un día, algo no cierra.*
- lote: el número de lote del sticker.
- laboratorio: el fabricante del sticker (Zoetis, MSD, Boehringer, Virbac...).
- via: SOLO uno de estos, o null: "subcutanea" · "intramuscular" ·
  "intranasal" · "oral". Casi nunca está escrito. Si no lo dice, null.
- veterinario: el nombre del veterinario o de la clínica de esa sección.
- vacuna_codigo: contra qué protege esta vacuna. SOLO uno de estos códigos
  EXACTOS, copiado carácter por carácter, o null:
${catalogo.map((c) => `    "${c.codigo}"  (${c.nombre})`).join('\n')}
  Se asigna sólo con base real: el carnet rotula el tipo
  (séxtuple/quíntuple/DHPP/polivalente = "multiple") o reconocés la marca
  comercial con certeza (Nobivac DHPPi = "multiple"; Defensor, Rabisin o
  Imrab = "antirrabica"; Bronchi-Shield o KC = "tos_perreras"; Felocell =
  "triple_felina"; GiardiaVax = "giardia").
  🔴 Si el nombre comercial no lo reconocés con certeza ⇒ null. **Un código
  "probable" es peor que null**: null se corrige mirando el carnet; un código
  equivocado entra al plan vacunal como si fuera un hecho y nadie lo revisa.
  PROHIBIDO deducirlo de la fecha, de la posición en el carnet o de qué vacuna
  es estadísticamente más común.
- cubre: la lista de TODOS los códigos contra los que protege esta aplicación,
  del mismo catálogo de arriba. Una combinada cubre varias cosas: por ejemplo
  una DHPPi + LR cubre "multiple", "leptospirosis" y "antirrabica" a la vez.
  Si pusiste vacuna_codigo, ese código tiene que estar en la lista.
  🔴 Lista VACÍA si no estás seguro de contra qué protege. **Una cobertura
  inventada le dice al plan vacunal que la mascota está protegida contra algo
  que quizá no recibió** — y eso no se corrige mirando: se descubre cuando el
  animal se enferma.
- evidencia: QUÉ MARCA FÍSICA prueba que se aplicó. Sólo eso — dónde está la
  fecha no es asunto de este campo, la fecha ya tiene el suyo.
  "sticker"     el sticker del frasco, pegado en el carnet.
  "sello"       un sello de la clínica.
  "manuscrito"  escritura a mano (fecha, firma, iniciales).
  "impreso"     la clínica imprimió el registro ya aplicado.
                Un renglón impreso EN BLANCO no es esto: es plan_impreso.
  Si hay más de una marca, poné la más fuerte en ese orden: sticker, sello,
  manuscrito, impreso.
- confianza: "alta" si leíste nombre y fecha sin esfuerzo. "media" si algo
  costó. "baja" si estás dudando. Una fila con confianza "baja" es útil: la
  familia la revisa. Una fila inventada con confianza "alta" no.

Todo campo que no leas con claridad = null. JAMÁS inventes, completes ni uses
cadena vacía. Preferir null siempre: la familia va a CORREGIR lo que devuelvas,
y no puede corregir lo que no sabe que está mal.

═══ LA SALIDA ═══

Respondé SOLO con este JSON, sin texto adicional y sin backticks:
{"vacunas":[{"nombre":null,"fecha_aplicada":null,"fecha_aplicada_precision":null,"fecha_literal":null,"fecha_proxima":null,"fecha_proxima_precision":null,"fecha_proxima_literal":null,"lote":null,"laboratorio":null,"via":null,"veterinario":null,"vencimiento_biologico":null,"vacuna_codigo":null,"cubre":[],"confianza":"alta","evidencia":"sticker"}],"plan_impreso":[{"nombre":""}]}

Carnet sin ninguna aplicación ⇒ {"vacunas":[],"plan_impreso":[...]}.
Carnet ilegible ⇒ {"vacunas":[],"plan_impreso":[]}.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  // D-714: esta function corre Claude. `verify_jwt` acepta la anon key del
  // bundle, así que la puerta real es exigir SESIÓN de persona.
  const sinSesion = exigirSesion(req)
  if (sinSesion) {
    return new Response(JSON.stringify(sinSesion.body), {
      status: sinSesion.status,
      headers: JSON_HEADERS,
    })
  }

  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return error('imagen_invalida', 'El body no es JSON válido.')
    }
    const { imageBase64, mediaType, modelo } = (body ?? {}) as {
      imageBase64?: unknown
      mediaType?: unknown
      modelo?: unknown
    }

    if (typeof imageBase64 !== 'string' || imageBase64.length === 0) {
      return error('imagen_invalida', 'imageBase64 requerido (string base64 no vacío).')
    }
    if (imageBase64.length > MAX_BASE64_CHARS) {
      return error('imagen_invalida', 'La foto es demasiado grande. Sacala de nuevo o elegí otra.')
    }
    const media = typeof mediaType === 'string' ? mediaType : 'image/jpeg'
    if (!MEDIA_TYPES_VALIDOS.includes(media)) {
      return error('imagen_invalida', `mediaType no soportado: ${media}.`)
    }

    // El override de modelo: sólo servidor, sólo la lista blanca (ver arriba).
    let modeloElegido: string | undefined
    if (modelo !== undefined) {
      if (rolDeSesion(req) !== 'service_role') {
        return error('imagen_invalida', 'El modelo no se elige desde el cliente.')
      }
      if (typeof modelo !== 'string' || !MODELOS_MEDIBLES.includes(modelo)) {
        return error('imagen_invalida', `Modelo no medible: ${String(modelo)}.`)
      }
      modeloElegido = modelo
    }

    // ── EL CATÁLOGO, DEL SERVIDOR ────────────────────────────────────────────
    // Mismo criterio que `sugerir-raza`: la lista blanca de SALIDA se valida
    // contra la MISMA fuente que la generó. Si viajara en el cuerpo, el cliente
    // definiría su propia lista blanca y «sólo códigos del catálogo» dejaría de
    // significar algo.
    const url = Deno.env.get('SUPABASE_URL')
    const claveServidor = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !claveServidor) {
      return error('configuracion_faltante', 'Falta la configuración del servidor.')
    }
    const { data: filasCat, error: errCat } = await createClient(url, claveServidor)
      .from('cat_vacunas').select('codigo, nombre').order('codigo')

    if (errCat || !filasCat || filasCat.length === 0) {
      // 🔴 Se FALLA, no se sigue con la lista vacía. Con el catálogo caído no
      // hay lista blanca, y sin lista blanca `vacuna_codigo` deja de estar
      // acotado — o saldría null en todas las filas y nadie sabría que fue por
      // una caída. *Una degradación silenciosa es peor que un error.* Va como
      // `error_modelo`, que es transitorio y la superficie ya ofrece reintentar.
      console.error('[extract-vacuna] no pude leer cat_vacunas:', errCat?.message ?? 'catálogo vacío')
      return error('error_modelo', 'No pudimos leer el carnet ahora. Probá de nuevo en un rato.')
    }
    const catalogo = filasCat as FilaCatalogo[]
    const codigos = catalogo.map((c) => c.codigo)

    const r = await llamarModelo({
      pieza: 'carnet',
      mensajes: [{ rol: 'user', texto: PROMPT(catalogo) }],
      imagenes: [{ mediaType: media, base64: imageBase64 }],
      salida: 'json',
      modelo: modeloElegido,
    })

    if (!r.ok) {
      if (r.error === 'error_proveedor') {
        if (r.detalle === 'sin_credencial') {
          return error('configuracion_faltante', 'ANTHROPIC_API_KEY no configurada.')
        }
        if (r.detalle === 'red') {
          return error('error_modelo', 'Error inesperado procesando el carnet.')
        }
        if (r.detalle === 'respuesta_no_json') {
          return error('error_modelo', 'La respuesta de Anthropic no es JSON.')
        }
        if (r.estadoHttp === 400) {
          return error('imagen_invalida', 'El modelo rechazó la imagen (formato o contenido inválido).')
        }
        if (r.estadoHttp === 401) {
          return error('configuracion_faltante', 'La API key de Anthropic fue rechazada.')
        }
        return error('error_modelo', `Anthropic respondió ${r.estadoHttp}.`)
      }
      if (r.error === 'timeout') {
        return error('error_modelo', 'La lectura tardó demasiado. Probá de nuevo.')
      }
      if (r.detalle === 'truncado') {
        return error('extraccion_fallida', 'La respuesta del modelo quedó truncada (carnet demasiado denso).')
      }
      return error('extraccion_fallida', 'El modelo no devolvió el JSON del contrato.')
    }

    // ── EL ESQUEMA SE EXIGE ENTERO: o cumple, o es error. Nunca parcial. ─────
    const datos = r.datos as Record<string, unknown> | null
    const vacunasCrudas = datos?.vacunas
    const planCrudo = datos?.plan_impreso

    if (!Array.isArray(vacunasCrudas)) {
      console.error('Output sin array vacunas')
      return error('extraccion_fallida', 'El JSON del modelo no trae el array vacunas.')
    }
    if (!Array.isArray(planCrudo)) {
      console.error('Output sin array plan_impreso')
      return error('extraccion_fallida', 'El JSON del modelo no trae el array plan_impreso.')
    }
    // ── SANEO FILA POR FILA · lo que falta se marca, sólo lo roto se descarta ──
    const porCodigo = new Map(catalogo.map((c) => [c.codigo, c.nombre]))
    const vacunas: Record<string, unknown>[] = []
    const filas_descartadas: { lista: 'vacunas' | 'plan_impreso'; indice: number; motivo: string }[] = []

    for (let i = 0; i < vacunasCrudas.length; i++) {
      const r = sanearFila(vacunasCrudas[i], codigos)
      if (!r.ok) {
        // Se descarta ESTA fila y se DICE cuál. El resto del carnet sigue.
        console.error(`[extract-vacuna] fila ${i + 1} descartada: ${r.motivo}`)
        filas_descartadas.push({ lista: 'vacunas', indice: i + 1, motivo: r.motivo })
        continue
      }
      const f = r.fila
      // El control determinístico del literal, sobre la fila ya saneada.
      const inventoAlgo =
        literalNoSostiene(f.fecha_literal, f.fecha_aplicada_precision) ||
        literalNoSostiene(f.fecha_proxima_literal, f.fecha_proxima_precision)
      vacunas.push({
        ...f,
        tipo_vacuna: f.vacuna_codigo === null ? null : (porCodigo.get(String(f.vacuna_codigo)) ?? null),
        // 'fecha' gana sobre 'incompleta': es la más específica y la que la
        // pantalla puede explicar mostrando el literal.
        dudosa: inventoAlgo ? 'fecha' : r.incompleta ? 'incompleta' : null,
        confianza: inventoAlgo ? 'baja' : f.confianza,
      })
    }


    // Misma ley en el otro canasto: una fila de plan sin nombre no tiene nada
    // que mostrar, así que se cae ELLA. El plan es lo menos crítico del carnet:
    // que tumbara la lectura entera de las aplicaciones sería absurdo.
    const plan_impreso: { nombre: string }[] = []
    for (let i = 0; i < planCrudo.length; i++) {
      const f = planCrudo[i]
      if (!esFilaPlan(f)) {
        console.error(`[extract-vacuna] fila ${i + 1} de plan_impreso descartada: sin nombre`)
        filas_descartadas.push({ lista: 'plan_impreso', indice: i + 1, motivo: 'fila de plan sin nombre' })
        continue
      }
      plan_impreso.push({ nombre: f.nombre })
    }

    return new Response(JSON.stringify({ vacunas, plan_impreso, filas_descartadas }), {
      status: 200,
      headers: JSON_HEADERS,
    })
  } catch (err) {
    console.error('Error:', String(err))
    return error('error_modelo', 'Error inesperado procesando el carnet.')
  }
})
