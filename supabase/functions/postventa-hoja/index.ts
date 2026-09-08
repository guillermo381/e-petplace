// postventa-hoja (S114-D, lote 2) — le resume a la casa un caso abierto y le
// **propone** una resolución con su porqué. **No aplica nada.**
//
// ── LA LEY (§11) ────────────────────────────────────────────────────────────
//   «resume hilo + objeto → propone resolución con su porqué, marcada
//    "propuesta"» · «la casa decide; queda `decidido_por`».
// Esta function no tiene cliente de escritura. La resolución la ejecuta la RPC
// de A, que exige `decidido_por` y deja el hecho en el hilo (§9.4).
//
// ── 🔴 POR QUÉ EL MATERIAL VIAJA EN EL CUERPO, Y NO ES LA MISMA DECISIÓN QUE
//    LA DE `postventa-intake` ─────────────────────────────────────────────────
// En el intake el catálogo NO viaja en el cuerpo, y la razón es que **define la
// lista blanca de salida**: si el cliente la manda, el cliente define contra qué
// se valida y «nunca un motivo fuera del catálogo» deja de significar algo.
// Acá no hay lista blanca que definir: el hilo y la evidencia son **material de
// lectura**, y la salida se valida contra su FORMA, no contra ellos. Mandarlos
// en el cuerpo no afloja ninguna defensa.
// ⚠️ Y hay una razón dura además: **al escribirse esto, las tablas del caso no
// existen** — censo del 7-sep contra la base: cero funciones y cero tablas de
// postventa. Leerlas acá sería escribir contra un esquema que todavía no está
// firmado. Cuando existan, mover la lectura adentro es un cambio de veinte
// líneas y **no cambia ninguna de las garantías de arriba**.
//
// ── LO QUE NO HACE ──────────────────────────────────────────────────────────
// No escribe estado, monto ni transición: la puerta `validarHoja` los corta, y
// su límite exacto —qué NO puede separar— está declarado ahí y no acá, para que
// nadie lea dos veces la misma promesa y crea que son dos defensas.

import { exigirSesion } from '../_shared/sesion.ts'
import { llamarModelo } from '../_shared/ia/mod.ts'
import { validarHoja } from '../_shared/postventa/contrato.ts'
import { aTuteo } from '../_shared/voz/tuteo.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const JSON_HEADERS = { ...corsHeaders, 'Content-Type': 'application/json' }

type CodigoError = 'cuerpo_invalido' | 'caso_vacio' | 'hilo_vacio'

function error(codigo: CodigoError, mensaje: string, status = 400): Response {
  return new Response(JSON.stringify({ codigo, mensaje }), { status, headers: JSON_HEADERS })
}

interface Turno { quien: 'familia' | 'prestador' | 'casa'; texto: string; cuando?: string }

const MAX_TURNOS = 40
const MAX_TEXTO_TURNO = 1500

const SISTEMA = `Sos quien prepara el material para la persona de e-PetPlace que va a resolver un caso de postventa.

Tu trabajo tiene dos partes y ninguna es decidir:
1. RESUMIR lo que pasó, leyendo el hilo y lo que el sistema sabe del servicio.
2. PROPONER un camino, con la razón por la que lo proponés.

Quien lee esto decide. Vos ordenás para que decida rápido y con todo a la vista.

Devolvé SOLO este JSON, sin texto alrededor y sin backticks:
{
  "resumen_hilo": "<qué pasó y en qué quedó, en pocas frases, en tuteo>",
  "propuesta": {
    "que": "<UN camino, en una o dos frases>",
    "porque": "<por qué ése, apoyado en lo que dice el hilo o la evidencia>"
  }
}

Reglas del resumen:
- Contá lo que las partes dijeron y lo que la evidencia muestra. Separá una cosa de la otra: "la familia dice" no es lo mismo que "la foto muestra".
- Si el prestador no respondió, decilo.
- Si falta algo para entender el caso, decí qué falta.
- No inventes hechos que no estén en el material.

Reglas de la propuesta:
- UNA sola. Si dudás entre dos, elegí la que el material sostiene mejor y decí en el porqué qué te hizo dudar.
- El porqué se apoya en el material, no en lo que suele pasar.
- Si el material no alcanza para proponer nada, proponé el paso que falta para saberlo (por ejemplo: pedirle a la familia la hora, o esperar la respuesta del prestador).

🔴 A QUIÉN LE ESCRIBÍS: a la persona de e-PetPlace que va a resolver el caso. Nunca a la familia.
Hablá de la familia y del prestador en TERCERA persona ("la familia dice", "el prestador reconoció"), jamás en segunda ("aportaste", "tu mascota", "te cobraron").
Quien lee esto tiene que poder decidir de un vistazo; si le escribís como si fuera la familia, tiene que traducirlo antes de juzgarlo.
El mensaje PARA la familia lo escribe otra pieza.

Escribí en tuteo neutro, nunca voseo.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { status: 200, headers: corsHeaders })

  const sinSesion = exigirSesion(req)
  if (sinSesion) {
    return new Response(JSON.stringify(sinSesion.body), { status: sinSesion.status, headers: JSON_HEADERS })
  }

  let cuerpo: { caso?: unknown; hilo?: unknown; evidencia?: unknown }
  try {
    cuerpo = await req.json()
  } catch {
    return error('cuerpo_invalido', 'El cuerpo no es JSON.')
  }

  const caso = cuerpo.caso
  if (typeof caso !== 'object' || caso === null) return error('caso_vacio', 'Falta `caso`.')

  const hiloCrudo = Array.isArray(cuerpo.hilo) ? cuerpo.hilo : []
  const hilo = hiloCrudo
    .filter((t): t is Turno =>
      typeof t === 'object' && t !== null &&
      typeof (t as Turno).texto === 'string' &&
      ['familia', 'prestador', 'casa'].includes((t as Turno).quien)
    )
    .slice(-MAX_TURNOS)
  if (hilo.length === 0) return error('hilo_vacio', 'El hilo no tiene ningún mensaje legible.')

  /* El material va como mensaje `user` y NO en el `system`: el `system` está
     cacheado y meterle el material de cada caso tiraría el caché en cada
     llamada — escribiría una entrada que nadie lee nunca. Es la misma razón que
     `_shared/ia/mod.ts` deja escrita para el reintento. */
  const material = [
    '## El caso',
    JSON.stringify(caso, null, 2),
    '',
    '## Lo que el sistema sabe del servicio',
    cuerpo.evidencia === undefined
      ? '(no llegó evidencia del objeto)'
      : JSON.stringify(cuerpo.evidencia, null, 2),
    '',
    '## El hilo, en orden',
    ...hilo.map((t) => `[${t.quien}${t.cuando ? ' · ' + t.cuando : ''}] ${t.texto.slice(0, MAX_TEXTO_TURNO)}`),
  ].join('\n')

  const r = await llamarModelo({
    pieza: 'postventa_hoja',
    sistema: SISTEMA,
    mensajes: [{ rol: 'user', texto: material }],
    salida: 'json',
  })

  if (!r.ok) {
    console.error(`[postventa-hoja] el modelo falló: ${r.error}/${r.detalle ?? '—'}`)
    /* Acá SÍ es un error y no un `null` silencioso, y es la diferencia con el
       intake: allá la familia tiene la lista entera para seguir sola; acá la
       casa no pierde ninguna capacidad —el hilo y el objeto los tiene a la
       vista— y lo que necesita saber es que el resumen no se generó, no una
       hoja vacía que parezca un caso sin nada que decir. */
    return new Response(
      JSON.stringify({ codigo: `modelo_${r.error}`, mensaje: 'No se pudo preparar el resumen. El caso y el hilo están completos abajo.' }),
      { status: 200, headers: JSON_HEADERS },
    )
  }

  const v = validarHoja(r.datos)
  if (!v.ok) {
    console.error(`[postventa-hoja] rechazo \`${v.rechazo}\`: ${v.detalle}`)
    return new Response(
      JSON.stringify({ codigo: `rechazo_${v.rechazo}`, mensaje: 'No se pudo preparar el resumen. El caso y el hilo están completos abajo.' }),
      { status: 200, headers: JSON_HEADERS },
    )
  }

  if (v.descartadas.length > 0) {
    console.log(`[postventa-hoja] claves de más, descartadas: ${v.descartadas.join(', ')}`)
  }

  // El cinturón único, por la misma razón que en `postventa-intake`.
  const hoja = {
    ...v.hoja,
    resumen_hilo: aTuteo(v.hoja.resumen_hilo),
    propuesta: { que: aTuteo(v.hoja.propuesta.que), porque: aTuteo(v.hoja.propuesta.porque) },
  }
  return new Response(JSON.stringify(hoja), { status: 200, headers: JSON_HEADERS })
})
