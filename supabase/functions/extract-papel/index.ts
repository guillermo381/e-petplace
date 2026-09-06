// ═══════════════════════════════════════════════════════════════════════════
// LA BÓVEDA · «Traer papeles» (S113-D, lote 2.2)
//
// Exámenes de laboratorio, recetas e informes → filas tipadas con su adjunto.
//
// ── 🔴 LA LEY, Y ES UNA SOLA: TRANSCRIBE, JAMÁS INTERPRETA ─────────────────
// Un valor fuera de rango **no se marca como alto ni como bajo**. Se copia el
// valor, se copia la unidad y se copia el rango impreso, y **quien lee decide**.
// *La app no puede decirle a una familia que un resultado está mal: eso es un
// diagnóstico con otra ropa, y el que lo lee no tiene cómo saber que se lo dijo
// un modelo.* Si el papel trae la marca (`H`, `L`, un asterisco), **se copia la
// marca tal cual como parte del literal** — eso no es interpretar, es leer.
//
// ── POR QUÉ ES UNA EDGE NUEVA Y NO `extract-documento` v2 ──────────────────
// 🔴 **El brief dice que `extract-documento` ya hace esto. Medido: no.** Esa
// edge es el extractor de **documentos de IDENTIDAD** del titular —
// `nombre` · `numero_documento` · `tipo_documento ∈ {CEDULA, PASAPORTE, RUC}`,
// vocabulario cerrado contra `cat_tipos_documento_titular`. No tiene una línea
// de exámenes, recetas ni informes.
// *Colgarle un modo clínico a una pieza que anda, y que decide con un
// vocabulario cerrado de otra cosa, es cómo una pieza correcta se vuelve dos
// piezas a medias.* Se deja intacta y nace ésta.
//
// ── EL CONTRATO ES EL DEL CARNET, a propósito ──────────────────────────────
// `evidencia` · `confianza` · el **literal** de lo que el papel dice ·
// `precision` de las fechas · `modo_captura` · `filas_descartadas`.
// Y con él viene su ley, que ya se pagó una vez en `extract-vacuna`:
// **lo que falta sale MARCADO, jamás tumba la tanda.**
// ═══════════════════════════════════════════════════════════════════════════

import { llamarModelo } from '../_shared/ia/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const JSON_HEADERS = { ...corsHeaders, 'Content-Type': 'application/json' }

type CodigoError = 'cuerpo_invalido' | 'sin_sesion' | 'archivo_invalido' | 'extraccion_fallida' | 'error_modelo'
const ESTADO: Record<CodigoError, number> = {
  cuerpo_invalido: 400, sin_sesion: 401, archivo_invalido: 400,
  extraccion_fallida: 422, error_modelo: 502,
}
const error = (codigo: CodigoError, mensaje: string) =>
  new Response(JSON.stringify({ codigo, mensaje }), { status: ESTADO[codigo], headers: JSON_HEADERS })

const MAX_BASE64_CHARS = 7_000_000
const MEDIA_OK = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const

// ── LOS VOCABULARIOS CERRADOS ──────────────────────────────────────────────
// Se validan ACÁ, nunca en el prompt: un vocabulario que sólo vive en el
// prompt es una sugerencia. (Y su gemelo del cliente lo compara
// `verify:vocabularios`, que nació porque una copia se quedó vieja.)
export const CLASES = ['examen', 'receta', 'informe'] as const
export const EVIDENCIAS = ['impreso', 'sello', 'manuscrito', 'membrete'] as const
export const CONFIANZAS = ['alta', 'media', 'baja'] as const
export const CAPTURAS = ['foto', 'pdf', 'captura_de_pantalla'] as const
const PRECISIONES = ['dia', 'mes', 'sin_anio'] as const
type Precision = typeof PRECISIONES[number]

export function precisionDe(v: string): Precision | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return 'dia'
  if (/^\d{4}-\d{2}$/.test(v)) return 'mes'
  if (/^--\d{2}-\d{2}$/.test(v)) return 'sin_anio'
  return null
}

export const aTextoOnull = (v: unknown): string | null =>
  typeof v === 'string' && v.trim() !== '' ? v.trim() : null
const tipoMalo = (v: unknown) => v !== undefined && v !== null && typeof v !== 'string'

/** 🔴 QUÉ CAMPOS APLICAN A CADA CLASE, y por qué esto no es cosmético.
 *  Un examen NO tiene dosis y una receta NO tiene unidad de referencia. Sin
 *  esta tabla, `sanearFila` marcaba `incompleta` **toda** fila de examen por no
 *  traer `dosis` — o sea que la marca dejaba de significar «no se pudo leer» y
 *  pasaba a significar «esto es un examen». *Una marca que se enciende siempre
 *  no dice nada, y la que importa se pierde adentro.*
 *  Lo cazó el arnés: la fila más completa posible salía marcada.
 *
 *  ⇒ **null porque no aplica ≠ null porque no se pudo leer.** La ley de la casa
 *  —«se dice dónde no pudimos»— es sobre lo que se INTENTÓ leer. */
const ESPERADOS: Record<string, readonly string[]> = {
  examen: ['nombre', 'valor', 'unidad', 'referencia', 'literal', 'fecha', 'evidencia'],
  receta: ['nombre', 'dosis', 'frecuencia', 'hasta_cuando', 'literal', 'fecha', 'evidencia'],
  informe: ['nombre', 'nota', 'fecha', 'evidencia'],
  // Sin clase no se sabe qué esperar: se exige lo mínimo común y nada más.
  desconocida: ['nombre', 'literal'],
}

type Saneo =
  | { ok: true; fila: Record<string, unknown>; incompleta: boolean }
  | { ok: false; motivo: string }

/** 🔴 La misma ley del carnet: lo que FALTA se marca, sólo el tipo equivocado
 *  descarta, y descarta ESA fila diciendo cuál. Se paga una vez y sirve dos. */
export function sanearFila(v: unknown, clase: string): Saneo {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return { ok: false, motivo: 'no es un objeto' }
  const o = v as Record<string, unknown>
  let incompleta = false
  const falto = () => { incompleta = true; return null }

  for (const k of ['nombre', 'valor', 'unidad', 'referencia', 'literal', 'dosis', 'frecuencia',
                   'hasta_cuando', 'fecha', 'fecha_precision', 'evidencia', 'confianza', 'nota'])
    if (tipoMalo(o[k])) return { ok: false, motivo: `\`${k}\` no es texto` }

  const esperados = ESPERADOS[clase] ?? ESPERADOS.desconocida
  const texto = (k: string): string | null => {
    const t = aTextoOnull(o[k])
    // Vino algo y no era texto útil ⇒ se intentó leer y no se pudo: marca.
    if (t === null && o[k] !== undefined) return falto()
    // No vino: sólo marca si ese campo APLICA a esta clase.
    if (t === null) { if (esperados.includes(k)) incompleta = true; return null }
    return t
  }
  const deLista = (k: string, lista: readonly string[]): string | null => {
    const t = texto(k); if (t === null) return null
    return lista.includes(t) ? t : falto()
  }

  const nombre = texto('nombre')
  const literal = texto('literal')
  let fecha = texto('fecha')
  if (fecha !== null && precisionDe(fecha) === null) fecha = falto()

  // 🔴 EL ANCLA: una fila sin nombre y sin literal no dice nada del papel — no
  // hay qué mostrar ni qué corregir. Eso no es un dato faltante: es una fila
  // vacía, y descartarla NO es lo mismo que tirar la tanda.
  if (nombre === null && literal === null) {
    return { ok: false, motivo: 'sin nombre y sin literal: no hay nada que registrar' }
  }

  // 🔴 EL OBJETO SE ARMA ANTES DEL `return`, y no es estilo.
  // `incompleta` se LEE al construir el objeto que se devuelve; si un campo se
  // resuelve adentro de `fila`, su `falto()` dispara DESPUÉS y **la marca se
  // pierde en silencio** — el valor malo sí se limpia, así que la fila se ve
  // correcta y sólo le falta decir que le sacaron algo.
  // ⚠️ Esto YA me pasó en `extract-vacuna` (lote ①) y **lo reintroduje acá
  // copiando la forma sin la cura**: el arnés lo cazó con `evidencia` y
  // `confianza`. *Una cura que vive en el cuerpo de una función no viaja con
  // el patrón que uno copia.*
  const fila = {
      nombre,
      // Del examen
      valor: texto('valor'),
      unidad: texto('unidad'),
      referencia: texto('referencia'),
      // De la receta
      dosis: texto('dosis'),
      frecuencia: texto('frecuencia'),
      hasta_cuando: texto('hasta_cuando'),
      // De los tres
      literal,
      fecha,
      fecha_precision: fecha === null ? null : precisionDe(fecha),
      evidencia: deLista('evidencia', EVIDENCIAS),
      confianza: deLista('confianza', CONFIANZAS) ?? 'baja',
      nota: texto('nota'),
      clase,
  }
  return { ok: true, incompleta, fila }
}

const PROMPT = `Leés un papel de la salud de una mascota y lo TRANSCRIBÍS. No lo interpretás.

═══ 🔴 LA ÚNICA LEY QUE NO SE NEGOCIA ═══
NO DECÍS SI UN RESULTADO ESTÁ BIEN O MAL. Ni "alto", ni "bajo", ni "elevado",
ni "dentro de lo normal", ni "preocupante". Copiás el valor, copiás la unidad,
copiás el rango de referencia si está impreso, y ahí terminás tu trabajo.
NO nombrás enfermedades, no sugerís causas, no recomendás nada.
Si el papel TRAE una marca ("H", "L", "*", "ALTO"), la copiás dentro de
"literal" tal como está: **copiar lo que el laboratorio escribió no es
interpretar; escribir lo que vos concluís, sí.**

═══ QUÉ CLASE DE PAPEL ES ═══
"examen"   resultados de laboratorio: analitos con valor y casi siempre unidad
           y rango de referencia.
"receta"   indicaciones de medicación: qué darle, cuánto y por cuánto tiempo.
"informe"  un texto clínico: informe de imagen, alta, epicrisis, derivación.
Si no es ninguno de los tres, devolvés "clase": null y "filas": [].

═══ QUÉ PONÉS EN CADA FILA ═══
Un EXAMEN da una fila POR ANALITO:
  nombre "Creatinina" · valor "1.8" · unidad "mg/dL" · referencia "0.5 - 1.6"
  literal "Creatinina 1.8 mg/dL (0.5 - 1.6) H"
Una RECETA da una fila POR MEDICAMENTO:
  nombre "Enrofloxacina 50mg" · dosis "1 comprimido" · frecuencia "cada 24 h"
  hasta_cuando "7 días" · literal la línea entera como está escrita
Un INFORME da UNA sola fila:
  nombre el título del informe · nota el resumen en TRES líneas como máximo,
  con lo que el informe dice — sin agregar tu lectura · literal null
  (el documento entero queda como adjunto: no lo transcribas completo).

═══ LOS CAMPOS DE TODOS ═══
- literal: lo que el papel dice en esa línea, tal cual. Es lo que deja
  comprobar tu lectura sin volver a abrir el papel.
- fecha: la del papel. "YYYY-MM-DD"; si sólo hay mes, "YYYY-MM"; si sólo día y
  mes, "--MM-DD". NUNCA inventes el día que falta.
- evidencia: "impreso" · "sello" · "manuscrito" · "membrete".
- confianza: "alta" · "media" · "baja".
- Lo que no puedas leer va null. **Un campo vacío se dice vacío.**

Respondé SOLO este JSON, sin texto alrededor y sin backticks:
{"clase":null,"fecha_documento":null,"emisor":null,"filas":[]}`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    if (!(req.headers.get('Authorization') ?? '').startsWith('Bearer ')) {
      return error('sin_sesion', 'Iniciá sesión para traer papeles.')
    }
    let body: unknown
    try { body = await req.json() } catch { return error('cuerpo_invalido', 'Cuerpo no es JSON.') }
    const cuerpo = (body ?? {}) as Record<string, unknown>
    // ⚰️ Mismo nombre que `extract-vacuna` desde el día uno: `imageBase64`.
    // La lápida de `sugerir-raza` existe porque esto se decidió tarde una vez.
    const base64 = cuerpo.imageBase64
    const mediaType = cuerpo.mediaType
    if (typeof base64 !== 'string' || !base64) return error('cuerpo_invalido', 'imageBase64 requerido.')
    if (base64.length > MAX_BASE64_CHARS) return error('archivo_invalido', 'El archivo es muy grande.')
    const media = typeof mediaType === 'string' && (MEDIA_OK as readonly string[]).includes(mediaType)
      ? mediaType : 'image/jpeg'

    const r = await llamarModelo({
      pieza: 'papel',
      mensajes: [{ rol: 'user', texto: PROMPT }],
      imagenes: [{ mediaType: media, base64 }],
      salida: 'json',
    })
    if (!r.ok) {
      console.error('[extract-papel] el modelo falló:', r.error, r.detalle)
      return error(r.error === 'timeout' ? 'error_modelo' : 'extraccion_fallida',
        'No pudimos leer el papel. Probá con otra foto.')
    }
    const d = r.datos as Record<string, unknown>
    const filasCrudas = d?.filas
    if (!Array.isArray(filasCrudas)) {
      console.error('[extract-papel] output sin array filas')
      return error('extraccion_fallida', 'El JSON del modelo no trae el array filas.')
    }
    const clase = aTextoOnull(d?.clase)
    const claseValida = clase !== null && (CLASES as readonly string[]).includes(clase) ? clase : null
    if (clase !== null && claseValida === null) {
      console.error('[extract-papel] clase fuera del vocabulario:', clase)
    }

    const filas: Record<string, unknown>[] = []
    const filas_descartadas: { indice: number; motivo: string }[] = []
    for (let i = 0; i < filasCrudas.length; i++) {
      const s = sanearFila(filasCrudas[i], claseValida ?? 'desconocida')
      if (!s.ok) {
        console.error(`[extract-papel] fila ${i + 1} descartada: ${s.motivo}`)
        filas_descartadas.push({ indice: i + 1, motivo: s.motivo })
        continue
      }
      filas.push({ ...s.fila, dudosa: s.incompleta ? 'incompleta' : null })
    }

    // `modo_captura` sale del mediaType REAL, no de lo que diga el cliente:
    // es un hecho del archivo, y un hecho no se declara — se deriva.
    const modo_captura = media === 'application/pdf' ? 'pdf' : 'foto'
    return new Response(JSON.stringify({
      clase: claseValida, fecha_documento: aTextoOnull(d?.fecha_documento),
      emisor: aTextoOnull(d?.emisor), modo_captura, filas, filas_descartadas,
    }), { status: 200, headers: JSON_HEADERS })
  } catch (e) {
    console.error('[extract-papel] excepción:', e)
    return error('error_modelo', 'No pudimos leer el papel.')
  }
})
