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

import { exigirSesion } from '../_shared/sesion.ts'
import { llamarModelo } from '../_shared/ia/mod.ts'

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

  // D-714: corre Claude. `verify_jwt` acepta la anon key del bundle; la puerta
  // real es exigir SESIÓN de persona.
  const sinSesion = exigirSesion(req)
  if (sinSesion) {
    return new Response(JSON.stringify(sinSesion.body), {
      status: sinSesion.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
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

    const prompt = construirPrompt(especieStr, motivoStr) + texto + '\n"""'

    // ── LA PUERTA ÚNICA (S113-D) ────────────────────────────────────────────
    // El `fetch`, la key, el parseo y el guard de truncado se fueron a
    // `_shared/ia`. **El prompt no se movió**: se sigue armando acá, con su
    // `construirPrompt` y su cierre de comillas, y viaja igual — el
    // discriminador lo prueba byte a byte.
    //
    // ⚠️ Esta pieza NO cachea, y es por medición: su prompt se arma con
    // `especie` y `motivo` y viaja CONCATENADO con el dictado en un solo
    // bloque, así que no hay prefijo estable que cachear (ver
    // `_shared/ia/modelos.ts`).
    const r = await llamarModelo({
      pieza: 'nota_clinica',
      mensajes: [{ rol: 'user', texto: prompt }],
      salida: 'json',
    })

    if (!r.ok) {
      if (r.error === 'error_proveedor') {
        if (r.detalle === 'sin_credencial') {
          return error('configuracion_faltante', 'ANTHROPIC_API_KEY no configurada.')
        }
        if (r.detalle === 'red') return error('error_modelo', 'Error inesperado estructurando la nota.')
        if (r.detalle === 'respuesta_no_json') {
          return error('error_modelo', 'La respuesta de Anthropic no es JSON.')
        }
        if (r.estadoHttp === 400) return error('entrada_invalida', 'El modelo rechazó la entrada.')
        if (r.estadoHttp === 401) {
          return error('configuracion_faltante', 'La API key de Anthropic fue rechazada.')
        }
        return error('error_modelo', `Anthropic respondió ${r.estadoHttp}.`)
      }
      // Estado NUEVO: hasta hoy un dictado que no volvía dejaba al vet
      // esperando sin nada que decirle.
      if (r.error === 'timeout') {
        return error('error_modelo', 'La estructuración tardó demasiado. Probá de nuevo.')
      }
      if (r.detalle === 'truncado') {
        return error('estructuracion_fallida', 'La respuesta del modelo quedó truncada.')
      }
      // `rechazo` cae acá porque hoy cae acá: llega sin bloque de texto y el
      // parseo falla. La fila de `ia_uso` sí lo nombra `rechazo`.
      return error('estructuracion_fallida', 'El modelo no devolvió el JSON del contrato.')
    }

    if (!esNotaValida(r.datos)) {
      console.error('Output fuera de contrato:', JSON.stringify(r.datos))
      return error('estructuracion_fallida', 'La nota estructurada no cumple el contrato.')
    }

    return new Response(JSON.stringify({ nota: r.datos }), { status: 200, headers: JSON_HEADERS })
  } catch (err) {
    console.error('Error:', String(err))
    return error('error_modelo', 'Error inesperado estructurando la nota.')
  }
})
