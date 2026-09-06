// ═══════════════════════════════════════════════════════════════════════════
// EL PARTE DEL DÍA · Nexo cuenta lo de hoy (S113-D, lote 2.1)
//
// ── LA REGLA QUE ORDENA TODO: EL SILENCIO ES LA FUNCIÓN ────────────────────
// Si hoy no hay nada, **no hay parte**. No una frase amable, no un «todo en
// orden»: nada. `MODELO_LOYALTY` §8 y la ley de la casa sobre avisos —*avisar
// todo enseña a ignorar los avisos*— y por eso el caso más común de esta pieza
// es no producir salida.
//
// ── EL ORDEN, otra vez por costo ───────────────────────────────────────────
//   0 avisos  → 204, sin cuerpo, CERO modelo
//   1 aviso   → PLANTILLA determinística, CERO modelo
//   2+ avisos → Sonnet hilando, techo 120 palabras
//   memorial  → 204, y ni siquiera se miran los avisos
//
// **Un solo aviso no necesita que nadie lo redacte**: «la polivalente vence en
// 12 días» ya es la frase. El modelo entra sólo cuando hay que HILAR, que es el
// único trabajo que una plantilla no puede hacer — y ahí el techo de 120
// palabras no es presupuesto, es producto: *un parte que se hace largo deja de
// leerse*.
//
// ── CONTRATO CON A (pedido de este lote) ───────────────────────────────────
//   `obtener_avisos_coach(p_mascota_id uuid, p_user_id uuid)` → 0..N filas
//   `{ tipo, titulo, detalle?, dias?, severidad? }`, ya filtradas por opt-in y
//   por la ventana del día. **La edge NO decide qué es un aviso** —eso es
//   determinístico y del servidor—: decide cómo se cuenta.
//   Medido el 6-sep-2026: `coach_memoria` YA EXISTE (vacía); `avisos_coach` NO.
//   Sin la RPC, esta edge responde 204 —silencio— y **no inventa un parte**.
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { llamarModelo } from '../_shared/ia/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const JSON_HEADERS = { ...corsHeaders, 'Content-Type': 'application/json' }

export interface Aviso {
  tipo: string
  titulo: string
  detalle?: string | null
  dias?: number | null
  severidad?: 'info' | 'pronto' | 'vencido' | null
  /** 🔴 EL AVISO DE ANTICIPACIÓN (pieza 5). Lo dispara el MOTOR de A —raza ×
   *  etapa × predisposición— y acá sólo se redacta. Los campos vienen
   *  estructurados justamente para que la redacción **no tenga que inferir
   *  nada**: sin ellos, escribir «suelen tener displasia» sería el modelo
   *  hablando de patología por su cuenta. */
  anticipacion?: {
    /** «senior», «adulto»… */
    etapa: string
    /** «en marzo», «el mes que viene». Ya en voz de familia, lo arma el motor. */
    cuando?: string | null
    /** La raza en plural, tal como la nombra el catálogo: «Bulldog inglés». */
    raza: string
    /** 🔴 `cat_predisposiciones.descripcion_familia`, VERBATIM. Medido el
     *  6-sep: A ya la escribió en voz de familia («suelen tener problemas de
     *  cadera»), así que acá **se copia, no se compone**. Si esta edge la
     *  redactara de nuevo, habría dos textos para la misma cosa y el que se
     *  lee no sería el que se revisó. */
    descripcion_familia: string
    /** `cat_predisposiciones.chequeo_sugerido`, VERBATIM. Misma razón. */
    chequeo_sugerido: string
  } | null
}

/** 🔴 LA LEY DEL AVISO DE ANTICIPACIÓN, y por eso es PLANTILLA y no modelo.
 *  Dice tres cosas y ninguna es un diagnóstico: **cuándo cambia de etapa**,
 *  **qué suele pasarle a su raza** —una tendencia de la raza, no un hallazgo
 *  sobre él— y **qué conviene hablar con el veterinario**. Un modelo redactando
 *  esto libremente puede pasar de «suelen tener» a «puede tener», y esa palabra
 *  convierte una estadística de raza en una sospecha sobre este animal.
 *  *La forma fija es lo que impide ese deslizamiento.* */
export function fraseAnticipacion(nombre: string, a: NonNullable<Aviso['anticipacion']>): string {
  const cuando = a.cuando ? ` ${a.cuando}` : ''
  // 🔴 LA FORMA ES FIJA Y ES LA LEY. Sujeto de la primera oración: la MASCOTA
  // cambiando de etapa. Sujeto de la segunda: LA RAZA, en plural. **Nunca la
  // mascota + la patología en la misma oración** — «los Bulldog inglés suelen
  // tener problemas de cadera» es una estadística; «Thor tiene problemas de
  // cadera» es un diagnóstico, y entre las dos hay una sola coma de distancia.
  return `${nombre} entra a ${a.etapa}${cuando}. Los ${a.raza} ` +
    `${a.descripcion_familia}: ${a.chequeo_sugerido}.`
}

/** 🔴 EL SILENCIO TIENE SU PROPIA RESPUESTA, y es 204 y no un 200 con texto
 *  vacío: un 200 invita a que la pantalla pinte una tarjeta con nada adentro.
 *  204 no deja lugar a esa lectura. */
const silencio = () => new Response(null, { status: 204, headers: corsHeaders })

/** La plantilla del aviso único. Cada tipo dice su frase; lo que no conoce
 *  cae al título tal cual, que es lo que A escribió y ya está en voz de familia.
 *  **Nunca inventa un motivo**: si no sabe los días, no los nombra. */
export function frase(a: Aviso, nombre = 'Tu mascota'): string {
  // La anticipación tiene su propia forma y NO pasa por la de los plazos:
  // no es un vencimiento, es una etapa que llega.
  if (a.anticipacion) return fraseAnticipacion(nombre, a.anticipacion)
  const d = typeof a.dias === 'number' ? a.dias : null
  const cuando = d === null ? ''
    : d < 0 ? ` — venció hace ${-d} ${-d === 1 ? 'día' : 'días'}`
    : d === 0 ? ' — es hoy'
    : d === 1 ? ' — es mañana'
    : ` — en ${d} días`
  return `${a.titulo}${cuando}${a.detalle ? `. ${a.detalle}` : '.'}`
}

const SISTEMA = `Escribís el parte del día de una mascota para su familia, en la app
de e-PetPlace. Te doy una lista de cosas que pasan hoy y las hilás en un texto
corto.

🔴 TU TRABAJO ES HILAR, NO LISTAR. Si devolvés un título y una línea por cosa,
no hiciste nada que la app no pudiera hacer sola. Escribí UN párrafo corrido
donde las cosas se conecten: qué es lo urgente, qué puede esperar, y si dos
cosas se resuelven en la misma visita, decilo.

REGLAS
· Máximo 120 palabras. Frases cortas, tuteo neutro, sin signos de admiración.
· SIN título, sin encabezado, sin viñetas: empezás por el contenido.
· **Sólo decís lo que está en la lista.** No agregás consejos, no explicás qué
  es cada vacuna, no supones nada que no esté escrito ahí.
· 🔴 HILAR NO ES INFERIR. Podés ordenar por urgencia y sugerir resolver dos
  cosas en una misma visita. **NO podés decir que dos fechas coinciden, ni
  cuánto falta entre una y otra, ni que algo "cae en la misma semana"**: eso
  no está en la lista y suena verdadero igual. Medido: pedirte que hiles te
  hizo escribir "como coincide en fecha" sobre dos avisos con 8 días de
  diferencia.
· UN párrafo. No repitas al final lo que ya dijiste.
· No diagnosticás y no hablás de enfermedades.
· Si algo está vencido, se dice primero.
· A las personas menores de edad se les dice "niños".
· Terminás sin pregunta: esto es un aviso, no una conversación.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const auth = req.headers.get('Authorization') ?? ''
    if (!auth.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ codigo: 'sin_sesion' }), { status: 401, headers: JSON_HEADERS })
    }
    let body: unknown
    try { body = await req.json() } catch { body = {} }
    const { mascotaId } = (body ?? {}) as { mascotaId?: unknown }
    if (typeof mascotaId !== 'string' || !mascotaId) {
      return new Response(JSON.stringify({ codigo: 'cuerpo_invalido' }), { status: 400, headers: JSON_HEADERS })
    }

    const url = Deno.env.get('SUPABASE_URL')
    const srk = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !srk) return silencio()
    const sb = createClient(url, srk, { auth: { persistSession: false } })
    const { data: usuario } = await sb.auth.getUser(auth.replace('Bearer ', ''))
    const uid = usuario?.user?.id
    if (!uid) return new Response(JSON.stringify({ codigo: 'sin_sesion' }), { status: 401, headers: JSON_HEADERS })

    const { data: filas, error: err } = await sb
      .rpc('obtener_avisos_coach', { p_mascota_id: mascotaId, p_user_id: uid })
    // 🔴 Un fallo del lector NO es un parte vacío inventado: es silencio. La
    // diferencia importa porque un 204 por error y un 204 por «no hay nada» se
    // ven iguales desde afuera — por eso el error se GRITA en el log aunque la
    // respuesta sea la misma.
    if (err) { console.error('[coach-parte] obtener_avisos_coach:', err.message); return silencio() }

    // El nombre lo trae el lector con los avisos: la edge no lo adivina ni lo
    // pide al cliente. Si no viene, la frase dice «Tu mascota» y no un nombre
    // inventado — que es peor que un genérico.
    const nombre = (Array.isArray(filas) ? (filas[0] as { nombre?: unknown })?.nombre : null)
    const nom = typeof nombre === 'string' && nombre.trim() ? nombre.trim() : 'Tu mascota'
    const avisos = (Array.isArray(filas) ? filas : []) as Aviso[]
    const validos = avisos.filter((a) => a && typeof a.titulo === 'string' && a.titulo.trim())
    if (validos.length !== avisos.length) {
      console.error(`[coach-parte] ${avisos.length - validos.length} aviso(s) sin título, descartados`)
    }

    // ── silencio ─────────────────────────────────────────────────────────
    if (validos.length === 0) return silencio()

    // ── uno: la plantilla YA es la frase ─────────────────────────────────
    if (validos.length === 1) {
      return new Response(JSON.stringify({
        parte: frase(validos[0], nom), fuente: 'plantilla', avisos: validos.length,
      }), { status: 200, headers: JSON_HEADERS })
    }

    // ── dos o más: hay que hilar, y eso sólo lo hace el modelo ───────────
    const lista = validos.map((a) => `· ${frase(a, nom)}`).join('\n')
    const r = await llamarModelo({
      pieza: 'coach_parte',
      sistema: SISTEMA,
      mensajes: [{ rol: 'user', texto: `Hoy, para esta mascota:\n${lista}` }],
      salida: 'texto',
    })
    if (!r.ok) {
      // 🔴 Y si el modelo falla, el parte NO se pierde: se cae a la lista de
      // plantillas, que es peor prosa y la misma información. *Un aviso que no
      // sale porque el redactor se cayó es un vencimiento que nadie vio.*
      console.error('[coach-parte] el modelo falló:', r.error, r.detalle)
      return new Response(JSON.stringify({
        parte: lista, fuente: 'plantilla_de_respaldo', avisos: validos.length,
      }), { status: 200, headers: JSON_HEADERS })
    }
    return new Response(JSON.stringify({
      parte: String(r.datos).trim(), fuente: 'modelo', avisos: validos.length,
    }), { status: 200, headers: JSON_HEADERS })
  } catch (e) {
    console.error('[coach-parte] excepción:', e)
    return silencio()
  }
})
