// postventa-intake (S114-D, lote 1) — lee lo que la familia escribió o dictó y
// **PROPONE** un motivo del catálogo, un resumen de una línea y qué evidencia
// falta. **No escribe absolutamente nada.**
//
// ── LA LEY (§11 de LETRA_POSTVENTA, verbatim) ───────────────────────────────
//   «El disparo nunca es del modelo: una regla determinística decide que algo
//    exista; el modelo redacta.»
// El caso lo crea la RPC de A **después de la confirmación humana**, con
// `procedencia='ia_intake'`, `modo` y `confirmado_por`. Esta function no tiene
// cliente de escritura, no conoce la tabla de casos y no podría crearlo aunque
// se lo pidieran.
//
// ── EL CATÁLOGO SE LEE ACÁ, NO VIAJA EN EL CUERPO ───────────────────────────
// El criterio no lo inventé: es el que `sugerir-raza` ya dejó escrito para el
// catálogo de razas, y sus tres razones valen palabra por palabra acá:
//   ① el catálogo es del servidor — un bundle viejo mandaría motivos que ya no
//      rigen (y el founder puede desactivar uno con un UPDATE);
//   ② 🔴 **la lista blanca de SALIDA se valida contra la MISMA fuente que la
//      generó.** Si el catálogo viajara en el cuerpo, el cliente definiría su
//      propia lista blanca y «nunca un motivo fuera del catálogo» dejaría de
//      significar algo;
//   ③ cuesta una consulta de 19 filas.
//
// ── 🔴 EL MODO DE FALLA, Y ES UNA DECISIÓN DE PRODUCTO, NO UN CATCH ─────────
// Si el modelo falla —timeout, prosa en vez de JSON, motivo inventado— esta
// function **NO devuelve un error a la familia**: devuelve `propuesta: null`
// junto con **el catálogo entero**, y la familia elige de la lista como si la
// IA no existiera. *El intake es una ayuda para no tener que leer 19 opciones,
// jamás la puerta para abrir un caso.* Un error acá dejaría a una familia con
// la mascota lastimada mirando «probá de nuevo», y eso convierte una
// comodidad en un bloqueo. **El único camino que devuelve error es el que ni
// siquiera puede ofrecer la lista** (sin sesión, objeto inválido, catálogo
// caído).
//
// ⚠️ Y por eso la superficie (C) muestra SIEMPRE la lista completa con la
// propuesta apenas preseleccionada — no la propuesta sola. Es lo que sostiene
// la asimetría declarada en `modelos.ts`: si el modelo propone clase 2 donde la
// fila dice clase 3, la familia tiene enfrente la opción correcta.

import { createClient } from 'npm:@supabase/supabase-js@2'
import { exigirSesion } from '../_shared/sesion.ts'
import { llamarModelo } from '../_shared/ia/mod.ts'
import { EVIDENCIAS, type MotivoCatalogo, validarIntake } from '../_shared/postventa/contrato.ts'
import { aTuteo } from '../_shared/voz/tuteo.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const JSON_HEADERS = { ...corsHeaders, 'Content-Type': 'application/json' }

type CodigoError = 'cuerpo_invalido' | 'objeto_invalido' | 'texto_vacio' | 'catalogo_no_disponible'

function error(codigo: CodigoError, mensaje: string, status = 400): Response {
  return new Response(JSON.stringify({ codigo, mensaje }), { status, headers: JSON_HEADERS })
}

const OBJETOS = ['cita', 'estadia', 'pedido'] as const
type Objeto = typeof OBJETOS[number]

/** Techo de entrada. Un dictado largo es normal; una novela es un abuso. */
const MAX_TEXTO = 4000

/**
 * EL `system`. Lleva el catálogo y va CACHEADO (no cambia entre llamadas).
 *
 * 🔴 LO QUE ESTE PROMPT NO NOMBRA, A PROPÓSITO: no dice «no decidas el estado»
 * ni «no pongas montos». **Nombrar lo prohibido es enseñarlo** — y la casa ya
 * pagó esa lección en NEXO, donde el propio system decía «no das dosis» y doce
 * líneas abajo ofrecía calcularla: *dos líneas del mismo system que se
 * contradicen dejan la que invita*. Acá el JSON pedido tiene tres claves y
 * ninguna otra existe en el texto; lo que igual salga de más **lo corta la
 * puerta determinística, que es un hecho y no una promesa**.
 */
function sistema(motivos: MotivoCatalogo[]): string {
  const lista = motivos.map((m) => `- ${m.codigo}: ${m.voz}`).join('\n')
  return `Sos quien recibe el primer mensaje de una familia que tuvo un problema con un servicio para su mascota en e-PetPlace.

Tu trabajo es ORDENAR lo que contó, para que no tenga que leer una lista larga. Nada de lo que devuelvas decide nada: una persona confirma después.

MOTIVOS DISPONIBLES (elegí exactamente uno, por su código):
${lista}

Devolvé SOLO este JSON, sin texto alrededor y sin backticks:
{
  "motivo": "<uno de los códigos de arriba, tal cual>",
  "resumen": "<una sola línea, en tuteo, contando lo que pasó con las palabras de la familia>",
  "evidencia_falta": [<ninguno, uno o varios de: ${EVIDENCIAS.map((e) => `"${e}"`).join(', ')}>]
}

Sobre el resumen:
- Una línea. Es lo que va a leer quien atienda el caso para entender en tres segundos.
- Tuteo neutro ("tu mascota", "te cobraron"), nunca voseo.
- Contá lo que la familia dice que pasó. No agregues causas, ni culpas, ni consecuencias que ella no contó.
- Si contó algo que no entendés del todo, resumí lo que sí dijo y no rellenes.

Sobre la evidencia que falta:
- "foto": lo que cuenta se vería en una foto y no la mandó.
- "hora_del_hecho": el momento importa para entenderlo y no lo dijo.
- "que_paso": contó tan poco que no se entiende qué pasó.
- "monto_cobrado": habla de un cobro y no dice de cuánto.
- Si no falta nada, devolvé una lista vacía.

Si lo que contó no encaja bien en ningún motivo, usá "otra_cosa". Es mejor eso que forzar uno que no es.`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { status: 200, headers: corsHeaders })

  // Gasta dinero del proveedor ⇒ exige sesión de persona, no la anon key.
  const sinSesion = exigirSesion(req)
  if (sinSesion) {
    return new Response(JSON.stringify(sinSesion.body), { status: sinSesion.status, headers: JSON_HEADERS })
  }

  let cuerpo: { texto?: unknown; objeto?: unknown; modo?: unknown }
  try {
    cuerpo = await req.json()
  } catch {
    return error('cuerpo_invalido', 'El cuerpo no es JSON.')
  }

  const objeto = cuerpo.objeto
  if (typeof objeto !== 'string' || !(OBJETOS as readonly string[]).includes(objeto)) {
    return error('objeto_invalido', `\`objeto\` tiene que ser uno de: ${OBJETOS.join(', ')}.`)
  }
  const modo: 'texto' | 'voz' = cuerpo.modo === 'voz' ? 'voz' : 'texto'

  const texto = typeof cuerpo.texto === 'string' ? cuerpo.texto.trim() : ''
  if (texto === '') return error('texto_vacio', 'No llegó nada que leer.')

  // ── El catálogo, de la base ────────────────────────────────────────────────
  const url = Deno.env.get('SUPABASE_URL')
  const clave = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !clave) return error('catalogo_no_disponible', 'No se pudo leer el catálogo.', 500)

  /* 🔴 SE LEE `v_motivos_resueltos`, EL RESOLVEDOR DE A — NO LA TABLA CRUDA.
     La primera versión leía `cat_motivos_postventa` y armaba la herencia acá
     con un literal. La vista de A la arma desde `cat_motivos_herencia`, o sea
     desde DATO: hoy las dos dan lo mismo porque hay una sola fila de herencia,
     y ése era justamente el riesgo — *coincidir por casualidad es la forma en
     que dos verdades conviven sin que nadie las compare*. Además la vista trae
     `procedencia` (propio | heredado | universal), que la tabla no tiene.
     `objeto_resuelto` ya contempla la herencia, así que el filtro es uno solo. */
  const { data, error: errDb } = await createClient(url, clave)
    .from('v_motivos_resueltos')
    .select('codigo, objeto_origen, clase, urgente, voz, pide_foto, procedencia')
    .eq('objeto_resuelto', objeto)

  if (errDb || !Array.isArray(data) || data.length === 0) {
    console.error('[postventa-intake] catálogo no legible:', errDb?.message)
    return error('catalogo_no_disponible', 'No se pudo leer el catálogo.', 500)
  }
  /* 🔴 LO PROPIO PISA A LO HEREDADO — Y ESTO NO ES UNA PRECAUCIÓN: ES UN
     DEFECTO MEDIDO EL 7-SEP, QUE SÓLO APARECIÓ EJERCIENDO LA EDGE.
     `no_ejecutado` existe para `cita` **y** para `estadia`, y como estadía
     hereda de cita, `v_motivos_resueltos` lo devuelve DOS VECES para
     `objeto_resuelto='estadia'`, con dos voces distintas:
       · propio/estadia  → «No lo cuidaron / no me lo devolvieron»
       · heredado/cita   → «No vino / no me atendieron»
     Un `find()` sobre ese array toma la primera que venga, y **una vista sin
     `ORDER BY` no garantiza cuál es**. O sea: la familia de una guardería podía
     ver la voz de una cita, y la propuesta viajar con `objeto: 'cita'`.
     *Es la clase «coinciden por casualidad»: mientras estadía no tuviera un
     código propio repetido de cita no pasaba nada, y el día que A agregó
     `no_ejecutado` el duplicado nació sin que nada fallara.*

     ✅ ENMENDADO (7-sep, medido): **A ya aplicó el `DISTINCT ON` en la vista.**
     Verificado contra el objeto: 0 códigos duplicados, `estadia` de 13 a 12, y
     `no_ejecutado`/estadía con `procedencia='propio'`. O sea que **esto es hoy
     un no-op**, tal como se había declarado que quedaría.
     Se CONSERVA como defensa en profundidad —cuesta un Map sobre 12 filas— y,
     lo que importa: **el propio código dice si sigue haciendo falta**. La línea
     de log de abajo sólo se imprime cuando de verdad desduplica algo; si no
     aparece nunca, no está haciendo nada y se puede retirar sin medir otra vez.
     *Un guard que no puede decir si sirve es el que sobrevive a su río.* */
  const crudas = data as Array<Record<string, unknown>>
  const porCodigo = new Map<string, Record<string, unknown>>()
  for (const m of crudas) {
    const codigo = m.codigo as string
    const previa = porCodigo.get(codigo)
    // `propio` gana; entre `heredado` y `universal` gana la primera que llegue,
    // porque ésas no pueden colisionar entre sí (un código universal es único).
    if (previa === undefined || m.procedencia === 'propio') porCodigo.set(codigo, m)
  }
  if (porCodigo.size !== crudas.length) {
    console.log(`[postventa-intake] ${crudas.length - porCodigo.size} motivo(s) duplicado(s) en \`${objeto}\`, resueltos a favor de \`propio\``)
  }

  const catalogo: MotivoCatalogo[] = [...porCodigo.values()].map((m) => ({
    codigo: m.codigo as string,
    objeto: m.objeto_origen as string,
    clase: m.clase as number,
    urgente: m.urgente as boolean,
    voz: m.voz as string,
    pide_foto: m.pide_foto as boolean,
    activo: true,
  }))

  /** Lo que la familia ve pase lo que pase: la lista entera, en su voz. */
  const opciones = catalogo.map((m) => ({
    codigo: m.codigo,
    objeto: m.objeto,
    voz: m.voz,
    clase: m.clase,
    urgente: m.urgente,
    pide_foto: m.pide_foto,
  }))

  /** La salida sin propuesta — el camino en el que la IA no ayudó y no estorba. */
  const sinPropuesta = (porque: string) =>
    new Response(
      JSON.stringify({ propuesta: null, opciones, sin_propuesta_porque: porque }),
      { status: 200, headers: JSON_HEADERS },
    )

  const r = await llamarModelo({
    pieza: 'postventa_intake',
    sistema: sistema(catalogo),
    mensajes: [{ rol: 'user', texto: texto.slice(0, MAX_TEXTO) }],
    salida: 'json',
  })

  if (!r.ok) {
    console.error(`[postventa-intake] el modelo falló: ${r.error}/${r.detalle ?? '—'}`)
    return sinPropuesta(`modelo_${r.error}`)
  }

  // ── LA PUERTA. Acá es donde el modelo deja de poder decidir. ───────────────
  const v = validarIntake(r.datos, catalogo, objeto as Objeto, modo)
  if (!v.ok) {
    // Se loguea el rechazo POR NOMBRE: es el dato con el que E mide cuántas
    // veces el modelo intentó salirse, y de qué manera. «Cayó» no es un dato.
    console.error(`[postventa-intake] rechazo \`${v.rechazo}\`: ${v.detalle}`)
    return sinPropuesta(`rechazo_${v.rechazo}`)
  }

  if (v.descartadas.length > 0) {
    console.log(`[postventa-intake] claves de más, descartadas: ${v.descartadas.join(', ')}`)
  }

  /* 🔴 EL CINTURÓN ÚNICO DE LA CASA SOBRE LA ÚNICA PROSA QUE ESTA EDGE PRODUCE.
     No es una precaución nueva: `_shared/voz/tuteo.ts` documenta que vivía
     dentro de `coach/index.ts` y por eso `coach-parte` no lo tenía, y un
     «dejá» llegó a una familia con el cinturón puesto. Una pieza nueva que
     escribe prosa y no lo llama repite ese defecto exacto.
     ⚠️ Su verde dice «las formas de la lista se corrigen», jamás «está en
     tuteo»: lo que no está en la lista pasa, y eso lo mide el gate de voz. */
  const propuesta = { ...v.propuesta, resumen: aTuteo(v.propuesta.resumen) }

  return new Response(
    JSON.stringify({ propuesta, opciones, descartadas: v.descartadas }),
    { status: 200, headers: JSON_HEADERS },
  )
})
