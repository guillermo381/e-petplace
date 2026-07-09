// extract-vacuna (S46-B1.1; v17 S48-A4) — extracción de vacunas desde la
// foto de un carnet físico. Re-target del monorepo: REEMPLAZA a la
// heredada de v2 al desplegar (mismo slug; decisión regla 74 — el caller
// de v2 escribe contra la tabla `vacunas`, que ya no existe: nada vivo
// depende del contrato viejo). La versión v2 queda intacta en disco.
//
// v17 (decisión founder+arquitecto S48): tipo_vacuna se INFIERE desde el
// nombre comercial reconocible, contra un vocabulario CERRADO que vive
// en el prompt (PROTO-CATÁLOGO — enmienda D-008: cuando cat_vacunas
// exista, esta function lo lee de DB, no del prompt). Sin base
// suficiente → null, igual que siempre. JAMÁS inferir desde fecha,
// orden en el carnet ni frecuencia estadística. El shape del contrato
// NO cambia (tipo_vacuna ya era nullable).
//
// v18 (S48-B6, gate 4 con carnet físico real): ATRIBUCIÓN DE COLUMNA de
// fecha_aplicada — el gate encontró que el modelo tomaba las fechas
// IMPRESAS de los stickers del producto (lote/vencimiento de fábrica:
// "FEB 25", "11-2023") en vez de la columna FECHA manuscrita. La única
// fuente válida es la columna FECHA; incompleta (sin año) → null, jamás
// completar desde posición, vecinas o vencimientos. Fila con nombre
// legible SE INCLUYE aunque su fecha quede null.
//
// v19 (S48-B6.2, segunda iteración): la regla sola de v18 no movió el
// output (idéntico a v17 en 3 corridas). El prompt pasa a describir la
// ANATOMÍA del carnet (sticker impreso a un lado / campo FECHA
// manuscrito con firma al otro) + procedimiento por fila: transcribir
// el manuscrito ANTES de convertir. Dos stickers de una misma dosis
// (vacuna + diluyente/fracción, p.ej. bacterina + Recombitek) = UNA fila.
//
// v22 (S48-B7.1): regla de fecha-NO-compartida (ensayada y REVERTIDA en
// el timebox): el residuo de v21 era una fila sin año heredando la
// fecha de la vecina en 1/3 corridas. La regla explícita EMPEORÓ:
// 1 corrida truncada + 1 corrida con la fecha de KC corrida de fila y
// compartida entre dos vecinas. El prompt vigente es el de v21 (la
// revisión pre-guardado es la red del residuo — decisión founder B7).
//
// Contrato:
//   POST { imageBase64: string, mediaType?: string }   (verify_jwt: true)
//   200 → { vacunas: [{ nombre, fecha_aplicada, fecha_proxima,
//           veterinario_nombre_externo, tipo_vacuna, lote }] }
//     · claves = columnas reales de evento_vacuna_aplicada
//     · dato ilegible = null — jamás '' ni inventado
//     · fila sin nombre legible se OMITE (contrato explícito del prompt:
//       una vacuna sin nombre no es registrable)
//     · vacunas: [] con 200 es un resultado HONESTO (carnet sin filas
//       legibles), no un fallback: los fallos de parseo son error abajo.
//   error → { codigo, mensaje } con status de error (regla 36 — cero
//   fallback silencioso):
//     imagen_invalida       400 — falta/está mal la imagen (o Anthropic 400)
//     configuracion_faltante 500 — sin ANTHROPIC_API_KEY (o Anthropic 401)
//     error_modelo          502 — Anthropic no-ok (429/5xx/otros)
//     extraccion_fallida    422 — la respuesta del modelo no cumple el
//                                 contrato (parse/shape/truncada)

const corsHeaders = {
  // '*' a sabiendas: los callers son apps nativas (fetch sin CORS) y no
  // existe todavía dominio web canónico que fijar. El gate real es
  // verify_jwt. Restringir cuando el web del dueño tenga dominio.
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
// Límite de imagen de la API de Anthropic: 5MB decodificados ≈ 6.7M chars base64.
const MAX_BASE64_CHARS = 7_000_000

interface VacunaExtraida {
  nombre: string
  fecha_aplicada: string | null
  fecha_proxima: string | null
  veterinario_nombre_externo: string | null
  tipo_vacuna: string | null
  lote: string | null
}

const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/

function campoTextoValido(v: unknown): v is string | null {
  return v === null || (typeof v === 'string' && v.trim().length > 0)
}

function campoFechaValido(v: unknown): v is string | null {
  return v === null || (typeof v === 'string' && RE_FECHA.test(v))
}

function esVacunaExtraida(v: unknown): v is VacunaExtraida {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  return (
    typeof o.nombre === 'string' && o.nombre.trim().length > 0 &&
    campoFechaValido(o.fecha_aplicada) &&
    campoFechaValido(o.fecha_proxima) &&
    campoTextoValido(o.veterinario_nombre_externo) &&
    campoTextoValido(o.tipo_vacuna) &&
    campoTextoValido(o.lote)
  )
}

const PROMPT = `Eres un experto en carnets de vacunación veterinaria latinoamericanos.
La imagen muestra un carnet de vacunas. Cada aplicación (fila) tiene DOS registros que NO debes mezclar:
(a) el STICKER del producto, pegado e IMPRESO de fábrica: trae el nombre comercial, el número de lote y fechas impresas de elaboración/vencimiento (p.ej. "05-2022", "10-2023", "FEB 25"). Esas fechas son del FRASCO, no de la aplicación.
(b) el campo FECHA del carnet (rotulado FECHA, usualmente al costado del sticker, junto a la FIRMA del veterinario): la fecha de APLICACIÓN, escrita A MANO o con sello fechador.
Una misma dosis puede tener DOS stickers pegados juntos (vacuna + diluyente/fracción liofilizada): es UNA sola fila.
Recorre el carnet COMPLETO, de arriba a abajo, incluidas las filas de la parte superior y las de secciones separadas. Extrae TODAS las filas cuyo nombre puedas leer.

Responde SOLO con este JSON, sin texto adicional ni backticks:
{"vacunas":[{"nombre":"","fecha_aplicada":null,"fecha_proxima":null,"veterinario_nombre_externo":null,"tipo_vacuna":null,"lote":null}]}

Reglas ESTRICTAS por campo:
- nombre: nombre comercial o denominación de la vacuna tal como está escrita (ej: Rabisin, Nobivac DHPPi). Si el nombre de una fila es ilegible, OMITE esa fila completa — no la incluyas.
- fecha_aplicada / fecha_proxima: la ÚNICA fuente es el campo FECHA manuscrito (registro b). Procedimiento OBLIGATORIO por fila: 1) ubica el campo FECHA de ESA fila; 2) transcribe EXACTAMENTE lo que está escrito a mano (p.ej. "02-4-23", "26 JUN", "3 Ago 2023"); 3) solo si la transcripción tiene día, mes Y año, conviértela a YYYY-MM-DD (meses en español: ENE=01, FEB=02, MAR=03, ABR=04, MAY=05, JUN=06, JUL=07, AGO=08, SEP=09, OCT=10, NOV=11, DIC=12). Si el manuscrito es ilegible o está incompleto (p.ej. "26 JUN" — día y mes SIN año) → null. PROHIBIDO usar las fechas impresas del sticker como fecha de aplicación, y PROHIBIDO completar el año desde la posición de la fila, las filas vecinas o los vencimientos. La próxima SOLO si está escrita: no la calcules tú.
- Una fila con nombre legible SE INCLUYE aunque su fecha quede null — la fila solo se omite cuando el NOMBRE es ilegible.
- veterinario_nombre_externo: veterinario o clínica de la cabecera de la sección (ej: CPA TEUSAQUILLO).
- tipo_vacuna: SOLO uno de estos valores exactos (vocabulario cerrado), o null:
  "antirrábica" · "múltiple" · "tos de las perreras" · "leptospirosis" · "giardia" · "triple felina" · "leucemia felina".
  Asígnalo únicamente si tienes base real: el carnet rotula el tipo (séxtuple/quíntuple/DHPP/polivalente cuentan como "múltiple") o el nombre comercial es una marca que reconoces con certeza. Ejemplos: Nobivac DHPPi → "múltiple"; Defensor o Rabisin → "antirrábica"; Bronchi-Shield o KC → "tos de las perreras"; Felocell → "triple felina".
  Sin base suficiente (nombre ilegible, marca que no reconoces) → null. PROHIBIDO deducir el tipo desde la fecha, la posición de la fila en el carnet o qué vacuna es estadísticamente más común.
- lote: número de lote si aparece junto al nombre o en su columna.
- Todo dato ilegible o ausente = null. JAMÁS inventes, completes ni uses cadena vacía.
- Si el carnet no tiene ninguna fila legible, responde {"vacunas":[]}.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return error('imagen_invalida', 'El body no es JSON válido.')
    }
    const { imageBase64, mediaType } = (body ?? {}) as {
      imageBase64?: unknown
      mediaType?: unknown
    }

    if (typeof imageBase64 !== 'string' || imageBase64.length === 0) {
      return error('imagen_invalida', 'imageBase64 requerido (string base64 no vacío).')
    }
    if (imageBase64.length > MAX_BASE64_CHARS) {
      return error('imagen_invalida', 'La imagen supera el máximo de 5MB. Reducila antes de enviar.')
    }
    const media = typeof mediaType === 'string' ? mediaType : 'image/jpeg'
    if (!MEDIA_TYPES_VALIDOS.includes(media)) {
      return error('imagen_invalida', `mediaType no soportado: ${media}.`)
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return error('configuracion_faltante', 'ANTHROPIC_API_KEY no configurada.')
    }

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        // v20 (S48-B6.2): Haiku 4.5 topeó en la atribución espacial
        // sticker↔campo FECHA (v18/v19 lo demostraron empíricamente:
        // fechas de sticker, años fabricados, filas corridas). Delta de
        // costo ≈ USD 0.01 por escaneo — decisión arquitecto regla 74,
        // análisis de costo regla 61.
        // Contrato de request para Sonnet 5 (skill claude-api, S48):
        // - temperature FUERA: Sonnet 5 rechaza sampling params no-default
        //   con 400 (el "temperature 0 queda" del arranque asumía Haiku).
        // - thinking omitido = adaptive por DEFAULT en Sonnet 5, y piensa
        //   ANTES de responder — exactamente lo que esta atribución
        //   espacial necesita. El thinking consume max_tokens: 8000 da
        //   aire (el JSON sale en ~500) y el guard de stop_reason
        //   'max_tokens' ya corta truncados (regla 36).
        model: 'claude-sonnet-5',
        max_tokens: 8000,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: media, data: imageBase64 } },
            { type: 'text', text: PROMPT },
          ],
        }],
      }),
    })

    const responseText = await anthropicRes.text()

    if (!anthropicRes.ok) {
      console.error('Anthropic non-ok:', anthropicRes.status, responseText)
      if (anthropicRes.status === 400) {
        return error('imagen_invalida', 'El modelo rechazó la imagen (formato o contenido inválido).')
      }
      if (anthropicRes.status === 401) {
        return error('configuracion_faltante', 'La API key de Anthropic fue rechazada.')
      }
      return error('error_modelo', `Anthropic respondió ${anthropicRes.status}.`)
    }

    let data: { content?: { type: string; text?: string }[]; stop_reason?: string }
    try {
      data = JSON.parse(responseText)
    } catch {
      console.error('Respuesta Anthropic no-JSON:', responseText)
      return error('error_modelo', 'La respuesta de Anthropic no es JSON.')
    }

    if (data.stop_reason === 'max_tokens') {
      console.error('Respuesta truncada por max_tokens')
      return error('extraccion_fallida', 'La respuesta del modelo quedó truncada (carnet demasiado denso).')
    }

    const text = data.content?.find((b) => b.type === 'text')?.text ?? ''
    const clean = text.replace(/```json|```/g, '').trim()

    let parsed: unknown
    try {
      parsed = JSON.parse(clean)
    } catch {
      console.error('Output del modelo no parseable:', clean)
      return error('extraccion_fallida', 'El modelo no devolvió el JSON del contrato.')
    }

    const vacunasCrudas = (parsed as Record<string, unknown> | null)?.vacunas
    if (!Array.isArray(vacunasCrudas)) {
      console.error('Output sin array vacunas:', clean)
      return error('extraccion_fallida', 'El JSON del modelo no trae el array vacunas.')
    }
    for (let i = 0; i < vacunasCrudas.length; i++) {
      if (!esVacunaExtraida(vacunasCrudas[i])) {
        console.error(`Ítem ${i} fuera de contrato:`, JSON.stringify(vacunasCrudas[i]))
        return error('extraccion_fallida', `El ítem ${i + 1} extraído no cumple el contrato.`)
      }
    }

    return new Response(JSON.stringify({ vacunas: vacunasCrudas }), {
      status: 200,
      headers: JSON_HEADERS,
    })
  } catch (err) {
    console.error('Error:', String(err))
    return error('error_modelo', 'Error inesperado procesando el carnet.')
  }
})
