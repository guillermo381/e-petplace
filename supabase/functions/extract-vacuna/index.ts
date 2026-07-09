// extract-vacuna (S46-B1.1) — extracción de vacunas desde la foto de un
// carnet físico. Re-target del monorepo: REEMPLAZA a la heredada de v2
// al desplegar (mismo slug; decisión regla 74 — el caller de v2 escribe
// contra la tabla `vacunas`, que ya no existe: nada vivo depende del
// contrato viejo). La versión v2 queda intacta en disco como referencia.
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
La imagen muestra un carnet de vacunas (formato típico: columnas FECHA, TIPO-LOTE, FIRMA; secciones con cabecera de clínica/veterinario).
Extrae TODAS las filas de vacunas que puedas leer.

Responde SOLO con este JSON, sin texto adicional ni backticks:
{"vacunas":[{"nombre":"","fecha_aplicada":null,"fecha_proxima":null,"veterinario_nombre_externo":null,"tipo_vacuna":null,"lote":null}]}

Reglas ESTRICTAS por campo:
- nombre: nombre comercial o denominación de la vacuna tal como está escrita (ej: Rabisin, Nobivac DHPPi). Si el nombre de una fila es ilegible, OMITE esa fila completa — no la incluyas.
- fecha_aplicada / fecha_proxima: en el carnet vienen como DD/MM/YY o DD/ENE/YY (meses abreviados en español: ENE=01, FEB=02, MAR=03, ABR=04, MAY=05, JUN=06, JUL=07, AGO=08, SEP=09, OCT=10, NOV=11, DIC=12). Convierte a YYYY-MM-DD. La próxima suele estar anotada ~1 año después de la aplicada, pero SOLO si está escrita: no la calcules tú.
- veterinario_nombre_externo: veterinario o clínica de la cabecera de la sección (ej: CPA TEUSAQUILLO).
- tipo_vacuna: el tipo si el carnet lo distingue del nombre comercial (ej: antirrábica, séxtuple, polivalente, KC).
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
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        temperature: 0,
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
