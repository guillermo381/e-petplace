// extract-documento — S97-A · LA FOTO DEL DOCUMENTO PRE-LLENA EL ALTA
//
// Firma del founder (contrato de C): el alta del repartidor se pre-llena de
// una foto del documento; **la persona CORRIGE, no digita.**
//
// ── EL PRECEDENTE ES EXACTO Y SE COPIA, NO SE REINVENTA ─────────────────────
// `extract-vacuna` es la misma clase: Edge Function, key server-side, errores
// tipados, imagen en base64. Mismo proveedor (`ANTHROPIC_API_KEY`, ya en
// secrets), mismo contrato de request, mismos códigos de error.
// *Que sea el primero de su clase en el ALTA no lo hace el primero de su clase
//  en la CASA — y copiar el molde probado es más barato que estrenar uno.*
//
// ── 🔴 LA REGLA DEL CARNET RIGE ENTERA (L-139) ──────────────────────────────
// **Campo no legible = `null` honesto, JAMÁS inventado.**
//
// L-139 nació justo acá: el modelo tomaba fechas de stickers porque eran
// *plausibles*, y la revisión humana no las veía **porque parecían bien**.
//
// > ***Un número de cédula plausible y equivocado es peor que un campo vacío:
// > el vacío se llena, el equivocado se firma.***
//
// Por eso el prompt PROHÍBE explícitamente completar, deducir o corregir — y
// el validador rechaza la cadena vacía tanto como el campo ausente.
//
// ── LO QUE ESTA FUNCIÓN **NO** HACE ─────────────────────────────────────────
// No escribe en la base. Devuelve lo leído y **la superficie decide** — la
// persona ve, corrige y confirma. *Una extracción que persiste sola convierte
// una lectura probable en un dato firmado sin que nadie lo firme.*

import { exigirSesion } from '../_shared/sesion.ts'

const corsHeaders = {
  // '*' a sabiendas, igual que `extract-vacuna`: los callers son apps nativas
  // (fetch sin CORS) y no hay dominio web canónico que fijar. El gate real es
  // `verify_jwt` + `exigirSesion`.
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const JSON_HEADERS = { ...corsHeaders, 'Content-Type': 'application/json' }

type CodigoError =
  | 'cuerpo_invalido'
  | 'imagen_invalida'
  | 'configuracion_faltante'
  | 'error_modelo'
  | 'extraccion_fallida'

const STATUS: Record<CodigoError, number> = {
  cuerpo_invalido: 400,
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
const MAX_BASE64_CHARS = 7_000_000

/** Vocabulario CERRADO, medido contra `cat_tipos_documento_titular` — no
 *  inventado. Si el documento no permite decidir con certeza, va `null`. */
const TIPOS_VALIDOS = ['CEDULA', 'PASAPORTE', 'RUC'] as const
type TipoDocumento = (typeof TIPOS_VALIDOS)[number]

interface DocumentoExtraido {
  nombre: string | null
  numero_documento: string | null
  tipo_documento: TipoDocumento | null
}

function textoOnull(v: unknown): v is string | null {
  return v === null || (typeof v === 'string' && v.trim().length > 0)
}

function esDocumentoExtraido(v: unknown): v is DocumentoExtraido {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  return (
    textoOnull(o.nombre) &&
    textoOnull(o.numero_documento) &&
    (o.tipo_documento === null ||
      (typeof o.tipo_documento === 'string' &&
        (TIPOS_VALIDOS as readonly string[]).includes(o.tipo_documento)))
  )
}

const PROMPT = `Eres un experto en documentos de identidad latinoamericanos, con foco en Ecuador.
La imagen muestra el documento de identidad de una persona.

Responde SOLO con este JSON, sin texto adicional ni backticks:
{"documento":{"nombre":null,"numero_documento":null,"tipo_documento":null}}

Reglas ESTRICTAS por campo:
- nombre: el nombre completo de la persona, TAL COMO está impreso. Si el documento lo separa en apellidos y nombres, devuélvelo en el orden en que aparece leído de corrido. Si no es legible con certeza → null.
- numero_documento: SOLO los dígitos y caracteres del número, sin puntos ni guiones decorativos. Transcríbelo dígito por dígito de lo que ves. Si alguno de los caracteres es dudoso → null para TODO el campo. PROHIBIDO completar dígitos faltantes, corregir un número que "parece" mal formado, o inferirlo de cualquier otra parte del documento.
- tipo_documento: SOLO uno de estos valores exactos, o null: "CEDULA" · "PASAPORTE" · "RUC".
  Asígnalo únicamente si el documento lo rotula o su formato es inequívoco (p.ej. la cédula ecuatoriana está rotulada "CÉDULA DE IDENTIDAD"; un pasaporte dice "PASAPORTE"/"PASSPORT"). PROHIBIDO deducirlo de la CANTIDAD de dígitos o de qué documento es más común.

REGLA QUE GOBIERNA TODO LO ANTERIOR:
- Todo dato ilegible, dudoso, tapado, cortado o ausente = null. JAMÁS inventes, completes, corrijas ni uses cadena vacía.
- Un dato plausible pero no leído es un ERROR, no una ayuda: la persona va a CORREGIR lo que devuelvas, y no puede corregir lo que no sabe que está mal. Preferir null siempre.
- Si la imagen no es un documento de identidad o no se lee nada, responde {"documento":{"nombre":null,"numero_documento":null,"tipo_documento":null}}.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  const sinSesion = exigirSesion(req)
  if (sinSesion) {
    return new Response(JSON.stringify(sinSesion.body), {
      status: sinSesion.status,
      headers: JSON_HEADERS,
    })
  }

  try {
    let cuerpo: { imagenBase64?: unknown; mediaType?: unknown }
    try {
      cuerpo = await req.json()
    } catch {
      return error('cuerpo_invalido', 'El cuerpo no es JSON válido.')
    }

    const imageBase64 = cuerpo.imagenBase64
    const media = cuerpo.mediaType

    if (typeof imageBase64 !== 'string' || imageBase64.length === 0) {
      return error('cuerpo_invalido', 'Falta `imagenBase64`.')
    }
    if (typeof media !== 'string' || !MEDIA_TYPES_VALIDOS.includes(media)) {
      return error('imagen_invalida', `\`mediaType\` debe ser uno de: ${MEDIA_TYPES_VALIDOS.join(', ')}.`)
    }
    if (imageBase64.length > MAX_BASE64_CHARS) {
      return error('imagen_invalida', 'La imagen supera el límite de 5 MB.')
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
        // Contrato IDÉNTICO al de `extract-vacuna` (S48-B6.2/B8.2), y por las
        // mismas razones medidas allá:
        // - `temperature` FUERA: Sonnet 5 rechaza sampling params no-default
        //   con 400.
        // - `thinking` omitido = adaptive por default, y piensa ANTES de
        //   responder — que es lo que la transcripción dígito-a-dígito
        //   necesita.
        // - `max_tokens` alto porque el thinking lo consume; el JSON de acá
        //   sale en ~100 tokens, el resto es aire. Un documento es MUCHO más
        //   simple que un carnet denso, así que 4000 alcanza de sobra y el
        //   guard de `stop_reason` queda igual como red (regla 36).
        model: 'claude-sonnet-5',
        max_tokens: 4000,
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
      return error('error_modelo', 'La respuesta de Anthropic no es JSON.')
    }

    // Red de regla 36: un truncado devuelve JSON a medias que parece válido.
    if (data.stop_reason === 'max_tokens') {
      return error('extraccion_fallida', 'La lectura quedó incompleta. Probá con una foto más nítida.')
    }

    const texto = (data.content ?? []).find((b) => b.type === 'text')?.text
    if (typeof texto !== 'string') {
      return error('error_modelo', 'La respuesta del modelo no trae texto.')
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(texto.trim().replace(/^```json\s*/i, '').replace(/```$/, ''))
    } catch {
      return error('extraccion_fallida', 'El modelo no devolvió JSON.')
    }

    const doc = (parsed as { documento?: unknown })?.documento
    if (!esDocumentoExtraido(doc)) {
      return error('extraccion_fallida', 'La lectura no cumple el contrato esperado.')
    }

    return new Response(JSON.stringify({ documento: doc }), {
      status: 200,
      headers: JSON_HEADERS,
    })
  } catch (e) {
    console.error('extract-documento error:', e)
    return error('error_modelo', 'No pudimos leer el documento.')
  }
})
