// estructurar-nota-clinica (S70-A2) — estructura el DICTADO libre de un vet
// en los campos tipados de la nota clínica. Patrón LITERAL de extract-vacuna
// (S48): server-side, verify_jwt=true, key en Deno.env, errores tipados por
// status, guard de truncado, cero fallback silencioso (regla 36).
//
// EL MURO §8.3 (MODELO_VETERINARIA) — regla madre de esta function: la IA
// ASIGNA las palabras DEL VET a campos. JAMÁS agrega, infiere ni completa
// contenido clínico no dictado. Campo no dictado = null (L-139, verbatim del
// prompt del carnet: "JAMÁS inventes, completes ni uses cadena vacía").
// Posología no parseable con certeza → dosis/frecuencia null (el vet los
// completa en la confirmación). Vitales: SOLO valores con NÚMERO dictado;
// "todo bien"/"estable" JAMÁS se traduce a mediciones. La confirmación del
// vet (pantalla de edición) es la red: esta salida es un BORRADOR asistido.
//
// Contrato:
//   POST { texto: string, especie?: string, motivo?: string }   (verify_jwt: true)
//   200 → { nota: {
//     motivo, anamnesis, examen, diagnostico, plan_terapeutico,
//     plan_diagnostico: string[],            // exámenes pedidos (texto)
//     proximo_control: string|null,          // YYYY-MM-DD si se dictó, si no null
//     vitales: { peso_kg|temperatura_c|frecuencia_cardiaca|frecuencia_respiratoria|condicion_corporal }
//                                            // SOLO los medidos (número dictado); el resto ausentes
//     formula: [{ nombre, presentacion, cantidad, dosis, frecuencia,
//                 duracion_dias, via, indicaciones }]   // uno por medicamento
//   } }
//     · todo campo de texto no dictado = null · vitales sin número = ausente
//     · formula: [] honesto si no se prescribió nada
//   error → { codigo, mensaje } con status:
//     entrada_invalida        400 — falta/está mal el texto (o Anthropic 400)
//     configuracion_faltante  500 — sin ANTHROPIC_API_KEY (o Anthropic 401)
//     error_modelo            502 — Anthropic no-ok (429/5xx/otros)
//     estructuracion_fallida  422 — la respuesta no cumple el contrato (parse/shape/truncada)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const JSON_HEADERS = { ...corsHeaders, 'Content-Type': 'application/json' }

type CodigoError =
  | 'entrada_invalida'
  | 'configuracion_faltante'
  | 'error_modelo'
  | 'estructuracion_fallida'

const STATUS: Record<CodigoError, number> = {
  entrada_invalida: 400,
  configuracion_faltante: 500,
  error_modelo: 502,
  estructuracion_fallida: 422,
}

function error(codigo: CodigoError, mensaje: string): Response {
  return new Response(JSON.stringify({ codigo, mensaje }), {
    status: STATUS[codigo],
    headers: JSON_HEADERS,
  })
}

// Techo defensivo del dictado (un dictado de consulta real cabe holgado).
const MAX_TEXTO_CHARS = 20_000

const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/
const VITALES_NUM = ['peso_kg', 'temperatura_c', 'frecuencia_cardiaca', 'frecuencia_respiratoria', 'condicion_corporal'] as const

function esTextoOnull(v: unknown): v is string | null {
  return v === null || (typeof v === 'string' && v.trim().length > 0)
}
function esFechaOnull(v: unknown): v is string | null {
  return v === null || (typeof v === 'string' && RE_FECHA.test(v))
}

interface ItemFormula {
  nombre: string
  presentacion: string | null
  cantidad: number | null
  dosis: string | null
  frecuencia: string | null
  duracion_dias: number | null
  via: string | null
  indicaciones: string | null
}

function esItemFormula(v: unknown): v is ItemFormula {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  const numOnull = (x: unknown) => x === null || typeof x === 'number'
  return (
    typeof o.nombre === 'string' && o.nombre.trim().length > 0 &&
    esTextoOnull(o.presentacion) &&
    numOnull(o.cantidad) &&
    esTextoOnull(o.dosis) &&
    esTextoOnull(o.frecuencia) &&
    numOnull(o.duracion_dias) &&
    esTextoOnull(o.via) &&
    esTextoOnull(o.indicaciones)
  )
}

function esVitalesValido(v: unknown): boolean {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  for (const k of Object.keys(o)) {
    if (!(VITALES_NUM as readonly string[]).includes(k)) return false // clave desconocida = fuera de contrato
    if (typeof o[k] !== 'number') return false                        // solo números medidos
  }
  return true
}

function esNotaValida(v: unknown): boolean {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  if (!esTextoOnull(o.motivo) || !esTextoOnull(o.anamnesis) || !esTextoOnull(o.examen) ||
      !esTextoOnull(o.diagnostico) || !esTextoOnull(o.plan_terapeutico)) return false
  if (!esFechaOnull(o.proximo_control)) return false
  if (!Array.isArray(o.plan_diagnostico) || !o.plan_diagnostico.every((x) => typeof x === 'string' && x.trim().length > 0)) return false
  if (!esVitalesValido(o.vitales)) return false
  if (!Array.isArray(o.formula) || !o.formula.every(esItemFormula)) return false
  return true
}

function construirPrompt(especie: string | null, motivo: string | null): string {
  const contexto = [
    especie ? `Especie: ${especie}.` : null,
    motivo ? `Motivo de consulta (ya conocido): ${motivo}.` : null,
  ].filter(Boolean).join(' ')

  return `Eres un asistente de un veterinario. Recibís el DICTADO en texto libre de una consulta clínica y lo ESTRUCTURAS en los campos de la historia clínica.
${contexto ? contexto + '\n' : ''}
REGLA MADRE (inviolable): solo ASIGNAS a campos las palabras que el veterinario efectivamente dictó. JAMÁS agregás, inferís, completás ni "mejorás" contenido clínico. No sos el clínico: sos su secretario.

Responde SOLO con este JSON, sin texto adicional ni backticks:
{"motivo":null,"anamnesis":null,"examen":null,"diagnostico":null,"plan_terapeutico":null,"plan_diagnostico":[],"proximo_control":null,"vitales":{},"formula":[]}

Reglas ESTRICTAS por campo:
- motivo: el motivo de consulta dictado (o el contexto conocido si el vet lo repite). Si no se dictó, null.
- anamnesis: la historia/antecedentes que el dueño o el vet relatan. No dictado → null.
- examen: los hallazgos del examen físico DICTADOS. No dictado → null.
- diagnostico: el diagnóstico o presunción diagnóstica dictada. No dictado → null.
- plan_terapeutico: el plan de tratamiento en prosa, tal como se dictó. No dictado → null.
- plan_diagnostico: lista de exámenes/estudios que el vet PIDIÓ (ej: "hemograma", "radiografía de tórax"). Cada uno un string. Si no pidió ninguno, [].
- proximo_control: SOLO si el vet dictó una fecha concreta de control; conviértela a YYYY-MM-DD. "en 15 días" u otra referencia relativa sin fecha absoluta → null (el vet la fija en la confirmación).
- vitales: objeto con SOLO los signos que traen un NÚMERO dictado. Claves permitidas: peso_kg, temperatura_c, frecuencia_cardiaca, frecuencia_respiratoria, condicion_corporal. Si el vet dice "estable" o "todo normal" SIN número, NO inventes valores: omití la clave. Nunca pongas un vital que no se midió.
- formula: un objeto por medicamento PRESCRITO. Campos: nombre (obligatorio, comercial o principio), presentacion (ej "tabletas", "suspensión", "10 mg/ml"), cantidad (NÚMERO total dispensado si se dictó, ej "Cantidad: 10" → 10; si no, null), dosis (ej "1 tableta", "5 mg/kg"), frecuencia (ej "cada 12 horas"), duracion_dias (número de días si se dictó, si no null), via (oral/subcutánea/etc si se dictó), indicaciones (notas extra dictadas). Si la posología NO se puede parsear con certeza, dejá dosis y/o frecuencia en null — el vet los completa. Un medicamento sin nombre legible NO se incluye.
- Todo dato de texto ilegible o ausente = null. JAMÁS inventes, completes ni uses cadena vacía.
- Si el dictado no contiene nada estructurable, devolvé el JSON con todos los campos en null / listas vacías.

Dictado del veterinario:
"""`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  try {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return error('entrada_invalida', 'El body no es JSON válido.')
    }
    const { texto, especie, motivo } = (body ?? {}) as {
      texto?: unknown; especie?: unknown; motivo?: unknown
    }

    if (typeof texto !== 'string' || texto.trim().length === 0) {
      return error('entrada_invalida', 'texto requerido (dictado no vacío).')
    }
    if (texto.length > MAX_TEXTO_CHARS) {
      return error('entrada_invalida', 'El dictado es demasiado largo.')
    }
    const especieStr = typeof especie === 'string' && especie.trim().length > 0 ? especie.trim() : null
    const motivoStr = typeof motivo === 'string' && motivo.trim().length > 0 ? motivo.trim() : null

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return error('configuracion_faltante', 'ANTHROPIC_API_KEY no configurada.')
    }

    const prompt = construirPrompt(especieStr, motivoStr) + texto + '\n"""'

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        // Sonnet 5 (patrón extract-vacuna S48): sin temperature (rechaza
        // sampling no-default con 400), thinking adaptive por default —
        // la asignación campo-a-campo se beneficia de pensar antes; el
        // JSON sale corto, el resto es aire de thinking. Guard de
        // stop_reason 'max_tokens' como red (regla 36).
        model: 'claude-sonnet-5',
        max_tokens: 16000,
        messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
      }),
    })

    const responseText = await anthropicRes.text()

    if (!anthropicRes.ok) {
      console.error('Anthropic non-ok:', anthropicRes.status, responseText)
      if (anthropicRes.status === 400) {
        return error('entrada_invalida', 'El modelo rechazó la entrada.')
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
      return error('estructuracion_fallida', 'La respuesta del modelo quedó truncada.')
    }

    const text = data.content?.find((b) => b.type === 'text')?.text ?? ''
    const clean = text.replace(/```json|```/g, '').trim()

    let parsed: unknown
    try {
      parsed = JSON.parse(clean)
    } catch {
      console.error('Output del modelo no parseable:', clean)
      return error('estructuracion_fallida', 'El modelo no devolvió el JSON del contrato.')
    }

    if (!esNotaValida(parsed)) {
      console.error('Output fuera de contrato:', clean)
      return error('estructuracion_fallida', 'La nota estructurada no cumple el contrato.')
    }

    return new Response(JSON.stringify({ nota: parsed }), { status: 200, headers: JSON_HEADERS })
  } catch (err) {
    console.error('Error:', String(err))
    return error('error_modelo', 'Error inesperado estructurando la nota.')
  }
})
