// sugerir-raza (S113-D, lote 1.2) — mira la foto y PROPONE hasta tres razas del
// catálogo de la casa. **Nunca escribe nada: C confirma.**
//
// ── 🔴 UNA DESVIACIÓN DEL MANDATO, DECLARADA ────────────────────────────────
// El mandato dice que la entrada es «foto, especie declarada y **el catálogo
// cerrado de razas de esa especie** (A lo sirve)». Acá el catálogo **NO viaja
// en el cuerpo: lo lee esta function de `cat_razas`** con `service_role`. Tres
// razones, y la tercera es la que decide:
//   ① El catálogo es del servidor. Un cliente con bundle viejo mandaría una
//      lista vieja, y el modelo elegiría de un vocabulario que ya no rige.
//   ② La lista blanca de SALIDA se valida contra la MISMA fuente que la generó.
//      Si el catálogo viaja en el cuerpo, **el cliente define su propia lista
//      blanca** — y entonces «nunca fuera del catálogo» deja de significar algo.
//   ③ Cuesta una consulta de ~100 filas.
// *Si la mesa prefiere que viaje en el cuerpo, es un parámetro más y son cinco
//  líneas — pero entonces ② deja de ser cierto y hay que decirlo.*
//
// ── LO QUE ESTA FUNCTION NO HACE ────────────────────────────────────────────
// No escribe en `mascotas.raza` ni en ningún lado. Devuelve candidatas y **la
// persona elige**. `D-379` es explícita: el catálogo **SUGIERE y jamás impone**
// —hay un cinturón que aborta toda migración que le ponga un FK—, y una
// sugerencia que se guarda sola dejó de ser una sugerencia.
//
// Contrato:
//   POST { imagenBase64: string, mediaType?: string, especie: string,
//          modelo?: string }
//   200 → { candidatas: [{ raza_codigo, confianza }],  // máx 3, del catálogo
//           mestizo: boolean, sin_animal: boolean }
//   error → { codigo, mensaje }:
//     cuerpo_invalido 400 · imagen_invalida 400 · especie_desconocida 400
//     configuracion_faltante 500 · error_modelo 502 · sugerencia_fallida 422

import { createClient } from 'npm:@supabase/supabase-js@2'
import { exigirSesion, rolDeSesion } from '../_shared/sesion.ts'
import { llamarModelo } from '../_shared/ia/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const JSON_HEADERS = { ...corsHeaders, 'Content-Type': 'application/json' }

type CodigoError =
  | 'cuerpo_invalido'
  | 'imagen_invalida'
  | 'especie_desconocida'
  | 'configuracion_faltante'
  | 'error_modelo'
  | 'sugerencia_fallida'

const STATUS: Record<CodigoError, number> = {
  cuerpo_invalido: 400,
  imagen_invalida: 400,
  especie_desconocida: 400,
  configuracion_faltante: 500,
  error_modelo: 502,
  sugerencia_fallida: 422,
}

function error(codigo: CodigoError, mensaje: string): Response {
  return new Response(JSON.stringify({ codigo, mensaje }), {
    status: STATUS[codigo],
    headers: JSON_HEADERS,
  })
}

const MEDIA_TYPES_VALIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
/** Mismo techo que el carnet, y por la misma razón medida: `capturaFoto.tsx`
 *  sigue con la ORIGINAL si el resize falla. */
const MAX_BASE64_CHARS = Math.ceil((2 * 1024 * 1024) / 3) * 4

/** Lista blanca del override de modelo — sólo `service_role`, ver el carnet. */
const MODELOS_MEDIBLES = ['claude-haiku-4-5', 'claude-sonnet-5']

const CONFIANZAS = ['alta', 'media', 'baja'] as const
const TOPE_CANDIDATAS = 3

interface Candidata {
  raza_codigo: string
  confianza: typeof CONFIANZAS[number]
}

/**
 * El prompt. **La lista de códigos entra acá y es la única fuente**: el modelo
 * no puede proponer nada que no esté escrito abajo, y lo que devuelva se
 * verifica contra esa misma lista antes de salir.
 */
function construirPrompt(especie: string, codigos: string[]): string {
  return `Mirás la foto de una mascota y proponés a qué raza se parece, eligiendo de una lista cerrada.

La especie está DECLARADA por la persona: ${especie}.

═══ LOS ÚNICOS CÓDIGOS QUE PODÉS DEVOLVER ═══
${codigos.join(' · ')}

Copiá el código EXACTO de esa lista, carácter por carácter, aunque te parezca
que está mal escrito. Un código que no esté en la lista invalida la respuesta
entera. Si ninguno se parece, devolvés la lista de candidatas VACÍA — eso es
una respuesta correcta, no una falla.

═══ LAS TRES PREGUNTAS, EN ESTE ORDEN ═══

1. ¿Hay un animal en la foto?
   Si no hay ninguno (un paisaje, una persona sola, una pantalla, algo
   irreconocible) ⇒ "sin_animal": true, "candidatas": [], "mestizo": false.
   Y ahí terminás.

2. ¿El animal que ves es de la especie declarada (${especie})?
   Si NO lo es —por ejemplo, la persona declaró perro y ves un gato—
   ⇒ "candidatas": [], "sin_animal": false, "mestizo": false.
   Hay un animal, así que sin_animal es FALSE; lo que pasa es que no podés
   proponer razas de una especie que no estás viendo.
   PROHIBIDO elegir un código de la lista "para no venir con las manos vacías".

3. Recién ahí: ¿a qué se parece?
   Hasta TRES candidatas, de la más parecida a la menos. Menos de tres está
   bien. Cero está bien.
   Si el animal se ve claramente mezclado ⇒ "mestizo": true. Podés igual
   proponer las razas que más se le notan. Si la lista trae un código para
   mestizo o criollo y es lo que ves, usalo.

═══ CONFIANZA ═══
"alta"  la ves clara, con rasgos inequívocos de esa raza.
"media" se parece, pero podría ser otra parecida.
"baja"  es una corazonada por un rasgo suelto.
Una candidata con confianza "baja" es útil: la persona la mira y decide.
Una candidata inventada con confianza "alta" no.

═══ LA SALIDA ═══
Respondé SOLO con este JSON, sin texto adicional y sin backticks:
{"candidatas":[{"raza_codigo":"","confianza":"alta"}],"mestizo":false,"sin_animal":false}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  // D-714: corre un modelo, o sea que gasta plata. La puerta real es la sesión.
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
      return error('cuerpo_invalido', 'El body no es JSON válido.')
    }
    const { imagenBase64, mediaType, especie, modelo } = (body ?? {}) as {
      imagenBase64?: unknown
      mediaType?: unknown
      especie?: unknown
      modelo?: unknown
    }

    if (typeof imagenBase64 !== 'string' || imagenBase64.length === 0) {
      return error('cuerpo_invalido', 'imagenBase64 requerido.')
    }
    if (imagenBase64.length > MAX_BASE64_CHARS) {
      return error('imagen_invalida', 'La foto es demasiado grande. Sacala de nuevo o elegí otra.')
    }
    const media = typeof mediaType === 'string' ? mediaType : 'image/jpeg'
    if (!MEDIA_TYPES_VALIDOS.includes(media)) {
      return error('imagen_invalida', `mediaType no soportado: ${media}.`)
    }
    if (typeof especie !== 'string' || especie.trim().length === 0) {
      return error('cuerpo_invalido', 'especie requerida.')
    }

    let modeloElegido: string | undefined
    if (modelo !== undefined) {
      if (rolDeSesion(req) !== 'service_role') {
        return error('cuerpo_invalido', 'El modelo no se elige desde el cliente.')
      }
      if (typeof modelo !== 'string' || !MODELOS_MEDIBLES.includes(modelo)) {
        return error('cuerpo_invalido', `Modelo no medible: ${String(modelo)}.`)
      }
      modeloElegido = modelo
    }

    // ── EL CATÁLOGO, DEL SERVIDOR (ver la cabecera) ──────────────────────────
    const url = Deno.env.get('SUPABASE_URL')
    const clave = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !clave) {
      return error('configuracion_faltante', 'Falta la configuración del servidor.')
    }
    const supabase = createClient(url, clave)
    const { data: filas, error: errCat } = await supabase
      .from('cat_razas')
      .select('slug')
      .eq('especie', especie.trim())
      .eq('activo', true)
      .order('slug')

    if (errCat) {
      console.error('[sugerir-raza] no pude leer cat_razas:', errCat.message)
      return error('error_modelo', 'No pudimos leer el catálogo de razas.')
    }
    const codigos = (filas ?? []).map((f) => f.slug as string)
    if (codigos.length === 0) {
      // Especie sin razas activas: **no se llama al modelo**. Pedirle que elija
      // de una lista vacía es gastar una llamada para que devuelva nada.
      return error('especie_desconocida', `No hay razas para la especie "${especie}".`)
    }

    const r = await llamarModelo({
      pieza: 'raza',
      mensajes: [{ rol: 'user', texto: construirPrompt(especie.trim(), codigos) }],
      imagenes: [{ mediaType: media, base64: imagenBase64 }],
      salida: 'json',
      modelo: modeloElegido,
    })

    if (!r.ok) {
      if (r.error === 'error_proveedor') {
        if (r.detalle === 'sin_credencial') {
          return error('configuracion_faltante', 'ANTHROPIC_API_KEY no configurada.')
        }
        if (r.detalle === 'red') return error('error_modelo', 'Error inesperado mirando la foto.')
        if (r.estadoHttp === 400) {
          return error('imagen_invalida', 'El modelo rechazó la imagen.')
        }
        if (r.estadoHttp === 401) {
          return error('configuracion_faltante', 'La API key de Anthropic fue rechazada.')
        }
        return error('error_modelo', `Anthropic respondió ${r.estadoHttp}.`)
      }
      if (r.error === 'timeout') {
        return error('error_modelo', 'La lectura tardó demasiado. Probá de nuevo.')
      }
      return error('sugerencia_fallida', 'No pudimos leer la foto.')
    }

    // ── LA LISTA BLANCA SE EXIGE ACÁ, NO SE CONFÍA AL PROMPT ─────────────────
    // *Un vocabulario cerrado que sólo vive en el prompt es una sugerencia. El
    //  que vive en el validador es un vocabulario cerrado.*
    const d = r.datos as Record<string, unknown> | null
    if (typeof d?.mestizo !== 'boolean' || typeof d?.sin_animal !== 'boolean') {
      console.error('[sugerir-raza] faltan los booleanos')
      return error('sugerencia_fallida', 'La respuesta no cumple el contrato.')
    }
    if (!Array.isArray(d.candidatas)) {
      console.error('[sugerir-raza] candidatas no es lista')
      return error('sugerencia_fallida', 'La respuesta no cumple el contrato.')
    }
    if (d.candidatas.length > TOPE_CANDIDATAS) {
      console.error(`[sugerir-raza] ${d.candidatas.length} candidatas, tope ${TOPE_CANDIDATAS}`)
      return error('sugerencia_fallida', 'La respuesta no cumple el contrato.')
    }
    const candidatas: Candidata[] = []
    const vistos = new Set<string>()
    for (const c of d.candidatas) {
      if (typeof c !== 'object' || c === null) {
        return error('sugerencia_fallida', 'La respuesta no cumple el contrato.')
      }
      const o = c as Record<string, unknown>
      if (typeof o.raza_codigo !== 'string' || !codigos.includes(o.raza_codigo)) {
        // El caso que este validador existe para cazar: una raza inventada, o
        // una de OTRA especie. Con el código fuera del catálogo no hay nada que
        // rescatar — y devolver «las que sí estaban» sería datos parciales.
        console.error(`[sugerir-raza] código fuera del catálogo: ${String(o.raza_codigo)}`)
        return error('sugerencia_fallida', 'La respuesta trae una raza que no es del catálogo.')
      }
      if (typeof o.confianza !== 'string' || !(CONFIANZAS as readonly string[]).includes(o.confianza)) {
        return error('sugerencia_fallida', 'La respuesta no cumple el contrato.')
      }
      if (vistos.has(o.raza_codigo)) {
        console.error(`[sugerir-raza] código repetido: ${o.raza_codigo}`)
        return error('sugerencia_fallida', 'La respuesta repite una raza.')
      }
      vistos.add(o.raza_codigo)
      candidatas.push({ raza_codigo: o.raza_codigo, confianza: o.confianza as Candidata['confianza'] })
    }

    // Coherencia: sin animal no puede haber candidatas. Si el modelo dice las
    // dos cosas, se está contradiciendo, y adivinar cuál quiso decir es
    // inventar. **Rebota.**
    if (d.sin_animal && candidatas.length > 0) {
      console.error('[sugerir-raza] sin_animal true CON candidatas')
      return error('sugerencia_fallida', 'La respuesta se contradice.')
    }

    return new Response(
      JSON.stringify({ candidatas, mestizo: d.mestizo, sin_animal: d.sin_animal }),
      { status: 200, headers: JSON_HEADERS },
    )
  } catch (err) {
    console.error('[sugerir-raza] error:', String(err))
    return error('error_modelo', 'Error inesperado mirando la foto.')
  }
})
