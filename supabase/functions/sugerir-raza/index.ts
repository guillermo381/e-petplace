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
// ── 🆕 S116-A · LA ESPECIE TAMBIÉN PUEDE SER SALIDA (`D-1112`) ──────────────
// Nació pidiendo la especie como ENTRADA obligatoria: la exigía, filtraba el
// catálogo con ella y se la declaraba al modelo. ⇒ **sabía decir «eso no es un
// perro» y no sabía decir qué era.** El alta invertida del rediseño (foto → datos
// con especie y raza SUGERIDAS) necesita lo segundo.
//
// **Dos caminos, y el viejo no se movió:**
//   · `especie` PRESENTE  ⇒ exactamente el comportamiento de siempre. *El alta
//     de un acuario y toda pantalla que ya sabe la especie no cambian de camino.*
//   · `especie` AUSENTE   ⇒ la edge la PROPONE del catálogo vivo (`cat_especies`
//     activas) y, con ella, las razas como siempre.
//
// ⚠️ `especie: ''` o de otro tipo **sigue siendo cuerpo inválido**: presente y
// vacía no es lo mismo que ausente — *tratar una cadena vacía como «no la sé»
// convierte un error del llamador en un camino silencioso.*
//
// Contrato:
//   POST { imageBase64: string, mediaType?: string, especie?: string,
//          (`imagenBase64`, en español, se acepta con lápida — ver abajo)
//          modelo?: string }
//   200 → { candidatas: [{ raza_codigo, confianza }],  // máx 3, del catálogo
//           mestizo: boolean, sin_animal: boolean,
//           especie_sugerida: { codigo, confianza } | null }
//   🔴 `especie_sugerida: null` ES UNA RESPUESTA, NO UNA FALLA — la pantalla cae
//      al camino de siempre (la grilla de especies) sin decir nada. Y viene
//      SIEMPRE `null` cuando la especie se declaró: no se propone lo que ya se
//      sabe.
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

interface FilaRaza { slug: string; nombre: string; especie?: string }
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
/**
 * 🔴 NORMALIZACION (S113-D-2.7, firma del founder): minusculas, sin acentos,
 * espacios y guiones bajos a guion medio. **El modelo devolvio «American Bully»
 * y el codigo del catalogo es `american-bully`** — la fila era CORRECTA y se
 * rechazaba la respuesta entera por la forma del texto.
 *
 * *Exigir la forma exacta de un slug es exigirle al modelo que sepa una
 * convencion de base de datos. Lo que importa es que la raza este en el
 * catalogo, y eso se decide despues de normalizar.*
 */
function normalizarSlug(v: string): string {
  return v
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function construirPrompt(especie: string, catalogo: FilaRaza[]): string {
  return `Mirás la foto de una mascota y proponés a qué raza se parece, eligiendo de una lista cerrada.

La especie está DECLARADA por la persona: ${especie}.

═══ LOS ÚNICOS CÓDIGOS QUE PODÉS DEVOLVER ═══
${catalogo.map((r) => `  "${r.slug}"  —  ${r.nombre}`).join('\n')}

Devolvé el CÓDIGO de la izquierda, no el nombre de la derecha. Copialo tal cual,
aunque te parezca que está mal escrito: los tipeos del catálogo son el valor
válido. Si ninguna raza se parece, devolvés la lista de candidatas VACÍA — eso
es una respuesta correcta, no una falla.

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

interface FilaEspecie { codigo: string; nombre: string }

interface EspecieSugerida {
  codigo: string
  confianza: typeof CONFIANZAS[number]
}

/**
 * EL PROMPT SIN ESPECIE DECLARADA (S116-A). Hermano del de arriba, no su
 * reemplazo: el otro sigue corriendo tal cual cuando la especie viene.
 *
 * 🔴 **LA CONFIANZA DE LA ESPECIE ES UN CAMPO PROPIO, y eso lo pidió C con su
 * razón:** él pre-selecciona SÓLO con `alta`, porque *pre-seleccionar una
 * `baja` pone en el formulario un dato que probablemente hay que corregir, y
 * corregir cuesta más que elegir*. Si la especie heredara la confianza de la
 * raza estaría decidiendo con el número equivocado — **son dos juicios de
 * dificultad distinta**: reconocer que es un gato es fácil; reconocer que es un
 * Bombay, no.
 *
 * ⚠️ **LA VERIFICACIÓN DE ESPECIE NO SE BORRA: SE VUELVE INTERNA.** En el prompt
 * declarado, la pregunta 2 impide proponer razas de un animal que no se está
 * viendo. Sin especie declarada esa pregunta se queda sin sujeto, y la
 * tentación es sacarla por redundante. *No lo es: pasa a ser «las razas que
 * propongas tienen que ser de la especie que vos mismo elegiste».* Y además se
 * exige en el validador, que es donde un vocabulario cerrado significa algo.
 */
function construirPromptSinEspecie(
  especies: FilaEspecie[],
  porEspecie: Map<string, FilaRaza[]>,
): string {
  const bloques = especies
    .map((e) => {
      const razas = porEspecie.get(e.codigo) ?? []
      const lista = razas.length === 0
        ? '  (sin razas en el catálogo — podés elegir la especie igual)'
        : razas.map((r) => `  "${r.slug}"  —  ${r.nombre}`).join('\n')
      return `── ESPECIE "${e.codigo}" (${e.nombre}) ──\n${lista}`
    })
    .join('\n\n')

  return `Mirás la foto de una mascota y decís DE QUÉ ESPECIE es y a qué RAZA se parece, eligiendo las dos de listas cerradas.

Nadie te declaró la especie: la tenés que decidir vos.

═══ LAS ÚNICAS ESPECIES QUE PODÉS DEVOLVER ═══
${especies.map((e) => `  "${e.codigo}"  —  ${e.nombre}`).join('\n')}

Si el animal que ves no es ninguna de ésas —un caballo, un reptil, un animal
salvaje— devolvés "especie": null. **Eso es una respuesta correcta.** Es mejor
que forzar el más parecido: elegir "perro" para un zorro manda a la persona a
corregir algo que nunca debió proponerse.

═══ LOS ÚNICOS CÓDIGOS DE RAZA, AGRUPADOS POR ESPECIE ═══
${bloques}

Devolvé el CÓDIGO de la izquierda, no el nombre de la derecha. Copialo tal cual,
aunque te parezca que está mal escrito: los tipeos del catálogo son el valor
válido.

═══ LAS TRES PREGUNTAS, EN ESTE ORDEN ═══

1. ¿Hay un animal en la foto?
   Si no hay ninguno (un paisaje, una persona sola, una pantalla, algo
   irreconocible) ⇒ "sin_animal": true, "especie": null, "candidatas": [],
   "mestizo": false. Y ahí terminás.

2. ¿De cuál de las especies de la lista es?
   Elegí UNA, o null si no es ninguna. **Si devolvés null, las candidatas van
   vacías**: no se proponen razas de una especie que no está en el catálogo.

3. Recién ahí: ¿a qué raza se parece, DENTRO de la especie que elegiste?
   Hasta TRES candidatas, de la más parecida a la menos. Menos de tres está
   bien. Cero está bien — la especie sola ya es útil.
   PROHIBIDO proponer una raza de otra especie que la que elegiste en 2.
   PROHIBIDO elegir un código "para no venir con las manos vacías".
   Si el animal se ve claramente mezclado ⇒ "mestizo": true. Podés igual
   proponer las razas que más se le notan. Si la lista trae un código para
   mestizo o criollo y es lo que ves, usalo.

═══ CONFIANZA — SON DOS, Y SE JUZGAN POR SEPARADO ═══
"confianza_especie" es qué tan seguro estás de la ESPECIE.
"confianza" (dentro de cada candidata) es qué tan seguro estás de esa RAZA.
No tienen por qué coincidir, y casi nunca coinciden: podés estar segurísimo de
que es un gato y no tener idea de qué raza es. En ese caso
"confianza_especie":"alta" y las candidatas en "media" o "baja".
Copiar una confianza en la otra es peor que decir "baja".

"alta"  lo ves claro, con rasgos inequívocos.
"media" se parece, pero podría ser otro.
"baja"  es una corazonada por un rasgo suelto.

═══ LA SALIDA ═══
Respondé SOLO con este JSON, sin texto adicional y sin backticks:
{"especie":"","confianza_especie":"alta","candidatas":[{"raza_codigo":"","confianza":"alta"}],"mestizo":false,"sin_animal":false}`
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
    // ── ⚰️ LÁPIDA · `imagenBase64` (S113-D, lote 2.7) ───────────────────────
    // Esta edge nació pidiendo el campo en ESPAÑOL y `extract-vacuna` lo pide
    // en INGLÉS (`imageBase64`) desde S46. Dos grafías del mismo campo en dos
    // edges de la misma casa: **el rebote es limpio y aun así lo paga quien
    // escribe el segundo cliente, no quien escribió la inconsistencia** — a E le
    // costó 143 llamadas rebotadas antes de darse cuenta.
    //
    // Gana el nombre VIEJO (`imageBase64`), que es el que ya tiene consumidores.
    // El español se acepta **un tiempo** para no romper a nadie a mitad de
    // camino, y se avisa por log en cada uso.
    // ☠️ SE RETIRA cuando `sugerir-raza` no tenga ningún cliente mandando
    //    `imagenBase64` — se mide en el log, no se supone.
    const cuerpo = (body ?? {}) as Record<string, unknown>
    if (cuerpo.imagenBase64 !== undefined && cuerpo.imageBase64 === undefined) {
      console.warn('[sugerir-raza] ⚰️ un cliente todavía manda `imagenBase64`; el nombre vigente es `imageBase64`')
    }
    const imagenBase64 = cuerpo.imageBase64 ?? cuerpo.imagenBase64
    const { mediaType, especie, modelo } = (body ?? {}) as {
      mediaType?: unknown
      especie?: unknown
      modelo?: unknown
    }

    if (typeof imagenBase64 !== 'string' || imagenBase64.length === 0) {
      return error('cuerpo_invalido', 'imageBase64 requerido.')
    }
    if (imagenBase64.length > MAX_BASE64_CHARS) {
      return error('imagen_invalida', 'La foto es demasiado grande. Sacala de nuevo o elegí otra.')
    }
    const media = typeof mediaType === 'string' ? mediaType : 'image/jpeg'
    if (!MEDIA_TYPES_VALIDOS.includes(media)) {
      return error('imagen_invalida', `mediaType no soportado: ${media}.`)
    }
    /* 🔴 LA ESPECIE PASA A OPCIONAL (S116-A). Tres estados, no dos:
         · ausente (`undefined`/`null`) ⇒ la proponemos
         · presente y válida           ⇒ el camino de siempre, intacto
         · presente y rota (`''`, número, objeto) ⇒ CUERPO INVÁLIDO
       *La tercera es la que hay que sostener: tratar `''` como «no la sé»
        convierte el error de un llamador en un camino silencioso, y el
        llamador se entera meses después de que su campo no viajaba.* */
    const declarada = especie === undefined || especie === null
      ? null
      : (typeof especie === 'string' && especie.trim().length > 0 ? especie.trim() : undefined)
    if (declarada === undefined) {
      return error('cuerpo_invalido', 'Si mandás especie, tiene que ser texto no vacío.')
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

    /* LAS ESPECIES, sólo cuando hay que proponerlas. **La lista blanca sale de
       la misma fuente que va a validar la respuesta** — que es la razón ② de la
       cabecera: si el vocabulario que se ofrece y el que se exige no son el
       mismo objeto, «cerrado» deja de significar algo. */
    let especiesActivas: FilaEspecie[] = []
    if (declarada === null) {
      const { data: fe, error: errEsp } = await supabase
        .from('cat_especies')
        .select('codigo, nombre')
        .eq('activo', true)
        .order('codigo')
      if (errEsp) {
        console.error('[sugerir-raza] no pude leer cat_especies:', errEsp.message)
        return error('error_modelo', 'No pudimos leer el catálogo de especies.')
      }
      especiesActivas = (fe ?? []) as FilaEspecie[]
      if (especiesActivas.length === 0) {
        return error('especie_desconocida', 'No hay especies activas en el catálogo.')
      }
    }

    /* Con especie declarada se lee SOLO la suya (lo de siempre). Sin declarar
       se leen todas las de especies activas: 191 filas medidas, ~6,5 KB de
       prompt — **una sola llamada al modelo**. *Dos pasadas (especie, después
       raza) costarían el doble y además partirían el juicio en dos contextos:
       el modelo elegiría la raza sin volver a mirar por qué eligió la especie.* */
    const consulta = supabase
      .from('cat_razas')
      .select('slug, nombre, especie')
      .eq('activo', true)
      .order('slug')
    const { data: filas, error: errCat } = declarada === null
      ? await consulta.in('especie', especiesActivas.map((e) => e.codigo))
      : await consulta.eq('especie', declarada)

    if (errCat) {
      console.error('[sugerir-raza] no pude leer cat_razas:', errCat.message)
      return error('error_modelo', 'No pudimos leer el catálogo de razas.')
    }
    const catalogo = (filas ?? []) as FilaRaza[]
    const codigos = catalogo.map((f) => f.slug)
    // Índice por slug NORMALIZADO: así «American Bully» encuentra a
    // `american-bully` sin que el modelo tenga que saber la convención.
    // La lista blanca se indexa por su forma NORMALIZADA, así que el modelo
    // puede escribir `Yorkshire_Terrier` y resolver a `yorkshire-terrier`.
    // Si dos slugs del catálogo colapsaran al mismo normalizado, uno quedaría
    // inalcanzable: no puede pasar en silencio.
    const porNormalizado = new Map(codigos.map((c) => [normalizarSlug(c), c]))
    if (porNormalizado.size !== codigos.length) {
      console.error(`[sugerir-raza] COLISIÓN de slugs al normalizar: ${codigos.length} códigos → ${porNormalizado.size} claves`)
    }
    /* 🔴 SIN ESPECIE DECLARADA, EL ÍNDICE TIENE QUE SER POR ESPECIE. Con un
       índice plano, un `siames` propuesto junto a `especie: "perro"` resolvería
       y saldría — **una raza de gato con especie perro, las dos «del catálogo»
       por separado y la combinación falsa**. *La lista blanca no es de códigos:
       es de PARES.* */
    const porEspecie = new Map<string, FilaRaza[]>()
    const normalizadoPorEspecie = new Map<string, Map<string, string>>()
    if (declarada === null) {
      for (const f of catalogo) {
        const e = f.especie ?? ''
        if (!porEspecie.has(e)) {
          porEspecie.set(e, [])
          normalizadoPorEspecie.set(e, new Map())
        }
        porEspecie.get(e)!.push(f)
        normalizadoPorEspecie.get(e)!.set(normalizarSlug(f.slug), f.slug)
      }
    }
    if (declarada !== null && codigos.length === 0) {
      // Especie declarada sin razas activas: **no se llama al modelo**. Pedirle
      // que elija de una lista vacía es gastar una llamada para que devuelva
      // nada. *Sin especie declarada NO aplica: ahí la especie sola ya es útil
      // aunque su especie no tenga razas.*
      return error('especie_desconocida', `No hay razas para la especie "${declarada}".`)
    }

    const r = await llamarModelo({
      pieza: 'raza',
      mensajes: [{
        rol: 'user',
        texto: declarada === null
          ? construirPromptSinEspecie(especiesActivas, porEspecie)
          : construirPrompt(declarada, catalogo),
      }],
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
          /* ⚠️ UN 400 DEL PROVEEDOR NO DICE QUE EL PROBLEMA SEA LA IMAGEN, y
             decirlo costó caro: con `temperature: 0` Sonnet 5 devuelve 400 por
             el CUERPO, y este mensaje mandó a mirar la foto mientras la
             sugerencia de raza estaba muerta en producción (`D-1112`).
             *Un mensaje de error que nombra una causa que no midió no ayuda a
             diagnosticar: desvía.* El cuerpo real de Anthropic ya se loguea en
             `[ia] Anthropic non-ok`; acá se dice lo que se sabe. */
          return error('imagen_invalida', 'No pudimos leer la foto. Probá con otra.')
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
    // ── 🔴 UNA CANDIDATA QUE NO SIRVE SE DESCARTA; NO TUMBA LA RESPUESTA ────
    // Firma del founder (S113-D-2.7) tras verlo en vivo: el modelo devolvio
    // «American Bully» y el codigo es `american-bully`. **La raza estaba bien**
    // y se rechazaba todo por la forma del texto. Ahora se normaliza primero, y
    // lo que igual no encuentra su codigo **se descarta solo**.
    //
    // *Devolver dos candidatas buenas y decir que se descarto una es mas util
    // que devolver un error: la persona elige entre lo que hay.* Si no queda
    // ninguna, `candidatas: []` con 200 — que ya era una respuesta valida.
    /* ── LA ESPECIE PROPUESTA, CONTRA LA MISMA LISTA QUE SE OFRECIÓ ─────────
       `null` es una respuesta válida en los cuatro casos: no se declaró y el
       modelo no la supo · dijo una que no está en el catálogo · no mandó
       confianza usable · o la especie venía declarada y no hay nada que
       proponer. **En ninguno se rebota**: la pantalla cae a la grilla sin decir
       nada, y eso lo pidió C con todas las letras. */
    let especieSugerida: EspecieSugerida | null = null
    if (declarada === null && !d.sin_animal) {
      const cruda = d.especie
      if (typeof cruda === 'string' && cruda.trim().length > 0) {
        const norm = normalizarSlug(cruda)
        const resuelta = especiesActivas.find((e) => normalizarSlug(e.codigo) === norm)
        const conf = d.confianza_especie
        if (resuelta === undefined) {
          console.error(`[sugerir-raza] especie fuera del catálogo: "${cruda}"`)
        } else if (typeof conf !== 'string' || !(CONFIANZAS as readonly string[]).includes(conf)) {
          // La especie es buena y la confianza no. **No se inventa un valor**:
          // sin confianza usable, C no puede decidir si pre-seleccionar, y una
          // confianza supuesta es peor que ninguna sugerencia.
          console.error(`[sugerir-raza] "${cruda}" sin confianza usable: ${String(conf)}`)
        } else {
          especieSugerida = { codigo: resuelta.codigo, confianza: conf as EspecieSugerida['confianza'] }
        }
      }
    }

    /* Y de acá sale la lista blanca de razas que rige esta respuesta: la de la
       ESPECIE que el modelo eligió. Si no eligió ninguna válida, no hay razas
       que aceptar — *proponer razas colgando de una especie que se descartó es
       exactamente lo que la pregunta 2 del prompt declarado impedía.* */
    const blancaRazas = declarada === null
      ? (especieSugerida === null
          ? new Map<string, string>()
          : (normalizadoPorEspecie.get(especieSugerida.codigo) ?? new Map<string, string>()))
      : porNormalizado

    const candidatas: Candidata[] = []
    const descartadas: { valor: string; motivo: string }[] = []
    const vistos = new Set<string>()
    for (const c of d.candidatas) {
      if (typeof c !== 'object' || c === null) {
        descartadas.push({ valor: String(c), motivo: 'no es un objeto' })
        continue
      }
      const o = c as Record<string, unknown>
      if (typeof o.raza_codigo !== 'string') {
        descartadas.push({ valor: String(o.raza_codigo), motivo: 'el codigo no es texto' })
        continue
      }
      // Se busca por slug normalizado: «American Bully» → `american-bully`.
      const resuelto = blancaRazas.get(normalizarSlug(o.raza_codigo))
      if (resuelto === undefined) {
        descartadas.push({
          valor: o.raza_codigo,
          motivo: declarada === null && especieSugerida === null
            ? 'sin especie resuelta no se aceptan razas'
            : 'no esta en el catalogo de esa especie',
        })
        continue
      }
      if (typeof o.confianza !== 'string' || !(CONFIANZAS as readonly string[]).includes(o.confianza)) {
        descartadas.push({ valor: o.raza_codigo, motivo: 'confianza fuera del vocabulario' })
        continue
      }
      if (vistos.has(resuelto)) {
        descartadas.push({ valor: o.raza_codigo, motivo: 'repetida' })
        continue
      }
      if (candidatas.length >= TOPE_CANDIDATAS) {
        descartadas.push({ valor: o.raza_codigo, motivo: `sobra del tope de ${TOPE_CANDIDATAS}` })
        continue
      }
      vistos.add(resuelto)
      candidatas.push({ raza_codigo: resuelto, confianza: o.confianza as Candidata['confianza'] })
    }
    if (descartadas.length) {
      console.error('[sugerir-raza] candidatas descartadas: ' +
        descartadas.map((x) => `"${x.valor}" (${x.motivo})`).join(' · '))
    }

    // Coherencia: sin animal no puede haber candidatas. Si el modelo dice las
    // dos cosas, se está contradiciendo, y adivinar cuál quiso decir es
    // inventar. **Rebota.**
    if (d.sin_animal && candidatas.length > 0) {
      console.error('[sugerir-raza] sin_animal true CON candidatas')
      return error('sugerencia_fallida', 'La respuesta se contradice.')
    }

    return new Response(
      JSON.stringify({
        candidatas,
        mestizo: d.mestizo,
        sin_animal: d.sin_animal,
        especie_sugerida: especieSugerida,
        descartadas,
      }),
      { status: 200, headers: JSON_HEADERS },
    )
  } catch (err) {
    console.error('[sugerir-raza] error:', String(err))
    return error('error_modelo', 'Error inesperado mirando la foto.')
  }
})
