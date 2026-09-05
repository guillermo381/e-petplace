// extract-vacuna — extracción de vacunas desde la foto de un carnet físico.
//
// ── HISTORIA CORTA HASTA v21 (S46 → S48) ────────────────────────────────────
// v17 infirió `tipo_vacuna` de un vocabulario CERRADO. v18 y v19 pelearon la
// ATRIBUCIÓN DE COLUMNA: el modelo tomaba las fechas IMPRESAS de los stickers
// (lote/vencimiento de fábrica) como fecha de aplicación. v20 movió el modelo a
// Sonnet 5 porque Haiku 4.5 topaba en esa atribución espacial. **v22 se ensayó
// y se REVIRTIÓ: más reglas EMPEORARON** (truncado + fechas compartidas entre
// filas vecinas). El prompt vigente hasta hoy era el de v21.
//
// ── v2 (S113-D, lote 1.0) — LA LÍNEA BASE QUE LA OBLIGA ─────────────────────
// Medido por E y A sobre 5 carnets reales (`D-1012`):
//   · **83 s promedio, 114 s el peor.** La familia mira la espera todo ese rato.
//   · **un carnet de UNA vacuna devolvió DOCE.** Once inventadas.
//   · **$0,0715 por carnet** — 4.036 tokens de entrada, **6.347 de salida**.
//   · exactitud: nombre 65,6 % · fecha 62,5 % · lote 81,3 % · vet 42,1 %.
//
// ── 🔴 POR QUÉ ESTE PROMPT NO ES «MÁS PROMPT», QUE YA FRACASÓ ───────────────
// `D-1012` dice, con razón, que *«no se cura con un prompt»*, y cita v22. Pero
// v22 agregó una PROHIBICIÓN más («no compartas fechas»), y v2 hace lo
// contrario: **le da un LUGAR a lo que sobra.**
//
// El carnet trae impreso, de fábrica, el PLAN de vacunación: renglones con
// nombres y espacios en blanco. El prompt viejo pedía «extraé las vacunas» y no
// ofrecía ningún destino para esos renglones. *Un modelo que ve doce nombres y
// tiene un solo canasto, los mete en el canasto.* No estaba desobedeciendo una
// regla: estaba resolviendo una ambigüedad de la única forma que podía.
//
// `plan_impreso` es ese segundo canasto. **La diferencia entre v22 y v2 no es
// cuántas reglas hay: es que ahora la respuesta correcta es expresable.**
//
// ── LO QUE TAMBIÉN CAMBIA, Y NO ES DEL PROMPT ──────────────────────────────
// `max_tokens` 16000 → **2000** y **razonamiento APAGADO** para esta pieza
// (`PENSAR.carnet = false`). Los 6.347 tokens de salida no son el JSON —el JSON
// de doce vacunas no llega a 1.000—, así que la mayor parte era razonamiento, y
// a $10/MTok de salida ahí está el 89 % del costo. **Es una inferencia, no una
// medición** (la API no separa esos tokens): el experimento que la decide es de
// E, y es correr el mismo carnet con `pensar` en true y en false.
//
// ⚠️ **Y el riesgo va en la otra dirección:** S48 midió que el razonamiento era
// justo lo que resolvía la atribución sticker↔FECHA. **E mide EXACTITUD contra
// las 32 filas de verdad, no sólo costo y latencia.** Si cae, la tercera
// variante está servida sin tocar código: `esfuerzo: 'low'` con `pensar: true`.
//
// Contrato:
//   POST { imageBase64: string, mediaType?: string, modelo?: string }
//   200 → { vacunas: [...], plan_impreso: [{ nombre }] }   (ver TIPOS abajo)
//   error → { codigo, mensaje }:
//     imagen_invalida        400 · configuracion_faltante 500
//     error_modelo           502 · extraccion_fallida     422

import { exigirSesion, rolDeSesion } from '../_shared/sesion.ts'
import { llamarModelo } from '../_shared/ia/mod.ts'

const corsHeaders = {
  // '*' a sabiendas: los callers son apps nativas (fetch sin CORS) y no existe
  // todavía dominio web canónico que fijar. El gate real es verify_jwt.
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

/**
 * 🔴 TECHO DE 2 MB, y no es un número de gusto — es una defensa MEDIDA.
 *
 * C achica el carnet a 1600 px de lado mayor en JPEG antes de mandarlo
 * (`carnet.tsx`, `LADO_CARNET = 1600`), y los cinco carnets reales del conjunto
 * de E pesan entre **107 kB y 246 kB**. O sea que 2 MB es ~8× el peor caso real.
 *
 * Pero el techo NO existe por el camino feliz: existe porque `capturaFoto.tsx`
 * declara, literal, que **si el resize falla sigue con la ORIGINAL**. Una foto
 * de 12 MP sin achicar puede llegar acá, y hoy pasaba —el techo viejo eran 5 MB—
 * costando tokens de imagen y segundos de espera por una foto que nadie pidió
 * en ese tamaño. *El límite viejo protegía a la API; éste protege a la familia.*
 */
const MAX_BYTES_IMAGEN = 2 * 1024 * 1024
const MAX_BASE64_CHARS = Math.ceil(MAX_BYTES_IMAGEN / 3) * 4

/**
 * 🔒 LISTA BLANCA DEL OVERRIDE DE MODELO — la palanca de medición de E.
 *
 * Son exactamente los dos modelos que el lote 1 compara. Cualquier otro nombre
 * rebota tipado. **Y sólo la honra un token `service_role`**: la app manda
 * `authenticated`, así que desde el teléfono el modelo NO se puede mover.
 * *Una palanca de medición que un cliente puede tocar deja de ser una palanca
 * de medición y pasa a ser una superficie.*
 */
const MODELOS_MEDIBLES = ['claude-sonnet-5', 'claude-haiku-4-5']

// ── EL CONTRATO DE SALIDA, TIPADO ───────────────────────────────────────────

/** Cerrado por el CHECK real de `evento_vacuna_aplicada.via_administracion`
 *  (medido, no copiado de un doc). Fuera de esta lista, la RPC rebota. */
const VIAS = ['subcutanea', 'intramuscular', 'intranasal', 'oral'] as const

/** Proto-catálogo de S48 (enmienda `D-008`: cuando `cat_vacunas` exista, sale
 *  de la DB y no del prompt). **Se CONSERVA a propósito**: está poblado en
 *  22 de las 32 filas reales — quitarlo sería pérdida silenciosa de un dato
 *  que un humano ya confirmó. */
const TIPOS = [
  'antirrábica', 'múltiple', 'tos de las perreras', 'leptospirosis',
  'giardia', 'triple felina', 'leucemia felina',
] as const

const CONFIANZAS = ['alta', 'media', 'baja'] as const
const EVIDENCIAS = ['sticker_con_fecha', 'sello', 'manuscrito', 'impreso'] as const

interface VacunaExtraida {
  nombre: string
  fecha_aplicada: string | null
  fecha_proxima: string | null
  lote: string | null
  laboratorio: string | null
  via: typeof VIAS[number] | null
  veterinario: string | null
  vencimiento_biologico: string | null
  tipo_vacuna: typeof TIPOS[number] | null
  confianza: typeof CONFIANZAS[number]
  evidencia: typeof EVIDENCIAS[number]
}

const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/

const textoOnull = (v: unknown): v is string | null =>
  v === null || (typeof v === 'string' && v.trim().length > 0)

const fechaOnull = (v: unknown): v is string | null =>
  v === null || (typeof v === 'string' && RE_FECHA.test(v))

const enListaOnull = (v: unknown, lista: readonly string[]): boolean =>
  v === null || (typeof v === 'string' && lista.includes(v))

function esVacunaExtraida(v: unknown): v is VacunaExtraida {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  return (
    typeof o.nombre === 'string' && o.nombre.trim().length > 0 &&
    fechaOnull(o.fecha_aplicada) &&
    fechaOnull(o.fecha_proxima) &&
    fechaOnull(o.vencimiento_biologico) &&
    textoOnull(o.lote) &&
    textoOnull(o.laboratorio) &&
    textoOnull(o.veterinario) &&
    enListaOnull(o.via, VIAS) &&
    enListaOnull(o.tipo_vacuna, TIPOS) &&
    typeof o.confianza === 'string' && (CONFIANZAS as readonly string[]).includes(o.confianza) &&
    typeof o.evidencia === 'string' && (EVIDENCIAS as readonly string[]).includes(o.evidencia)
  )
}

function esFilaPlan(v: unknown): v is { nombre: string } {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  return typeof o.nombre === 'string' && o.nombre.trim().length > 0
}

const PROMPT = `Sos un lector de carnets de vacunación veterinaria latinoamericanos.
Devolvés DATOS. No explicás, no razonás por escrito, no agregás una sola palabra fuera del JSON.

═══ LO QUE HAY QUE DISTINGUIR — ES TODO EL TRABAJO ═══

Un carnet tiene DOS cosas que se parecen y NO son lo mismo:

(A) EL PLAN IMPRESO. La lista que el carnet trae impresa de fábrica, como
    formulario: renglones con el nombre de una vacuna y los espacios al lado
    VACÍOS, esperando que alguien los llene. Es lo que la mascota DEBERÍA
    recibir algún día. NO es una aplicación. Va a "plan_impreso".

(B) LAS APLICACIONES. Los renglones que tienen una MARCA de que alguien
    efectivamente aplicó algo:
      · un STICKER del frasco pegado encima, o
      · un SELLO de la clínica, o
      · algo ESCRITO A MANO (fecha, firma, iniciales).
    Es lo que la mascota SÍ recibió. Va a "vacunas".

Cada nombre que leas va a UNO de los dos lados, nunca a los dos.
Renglón con nombre impreso y todo lo demás en blanco ⇒ "plan_impreso", siempre.
Si dudás si un renglón tiene marca o no ⇒ "plan_impreso". Es lo barato: una
aplicación que quedó como plan la agrega la familia en diez segundos; una
aplicación inventada queda en el expediente médico del animal.

═══ LA FECHA DEL STICKER NO ES LA FECHA DE APLICACIÓN ═══

El sticker es del FRASCO, impreso en la fábrica: trae el nombre comercial, el
laboratorio, el LOTE y la fecha de VENCIMIENTO del biológico.
La fecha de APLICACIÓN es la que escribió la clínica: a mano, o con sello.

Ejemplo, un renglón real:
  [sticker pegado]  Nobivac DHPPi · Zoetis · Lote 56288 · Vto 05-2025
  [al lado, a mano] 19/4/23   [firma]
Lo correcto es:
  nombre "Nobivac DHPPi" · laboratorio "Zoetis" · lote "56288"
  fecha_aplicada "2023-04-19"      <- lo manuscrito
  vencimiento_biologico null       <- "05-2025" no tiene DÍA, ver abajo
  evidencia "sticker_con_fecha" · confianza "alta"
Poner "2025-05-05" en fecha_aplicada sería el error más caro del carnet.

═══ LOS CAMPOS ═══

- nombre: el nombre comercial tal como está escrito. Si no lo podés leer, la
  fila NO va a ningún lado: se omite. Una vacuna sin nombre no es registrable.
- fecha_aplicada / fecha_proxima / vencimiento_biologico: formato YYYY-MM-DD.
  Sólo si podés leer DÍA, MES Y AÑO. Meses en español: ENE=01 FEB=02 MAR=03
  ABR=04 MAY=05 JUN=06 JUL=07 AGO=08 SEP=09 OCT=10 NOV=11 DIC=12.
  Si falta cualquiera de los tres ⇒ null. "26 JUN" sin año es null.
  "05-2025" sin día es null. NUNCA completes el año desde la fila de arriba,
  desde la de abajo, ni desde el orden del carnet. La próxima sólo si está
  escrita: no la calcules.
- lote: el número de lote del sticker.
- laboratorio: el fabricante del sticker (Zoetis, MSD, Boehringer, Virbac...).
- via: SOLO uno de estos, o null: "subcutanea" · "intramuscular" ·
  "intranasal" · "oral". Casi nunca está escrito. Si no lo dice, null.
- veterinario: el nombre del veterinario o de la clínica de esa sección.
- tipo_vacuna: SOLO uno de estos, o null: "antirrábica" · "múltiple" ·
  "tos de las perreras" · "leptospirosis" · "giardia" · "triple felina" ·
  "leucemia felina". Asignalo sólo con base real: el carnet lo rotula
  (séxtuple/quíntuple/DHPP/polivalente = "múltiple") o reconocés la marca con
  certeza (Nobivac DHPPi = "múltiple"; Defensor o Rabisin = "antirrábica";
  Bronchi-Shield o KC = "tos de las perreras"; Felocell = "triple felina").
  Si no ⇒ null. Prohibido deducirlo de la fecha, de la posición o de qué
  vacuna es más común.
- evidencia: qué viste que prueba la aplicación.
  "sticker_con_fecha" · "sello" · "manuscrito" · "impreso"
  Usá "impreso" SÓLO si la clínica imprimió el registro ya aplicado con su
  fecha. Un renglón impreso EN BLANCO no es esto: es plan_impreso.
- confianza: "alta" si leíste nombre y fecha sin esfuerzo. "media" si algo
  costó. "baja" si estás dudando. Una fila con confianza "baja" es útil: la
  familia la revisa. Una fila inventada con confianza "alta" no.

Todo campo que no leas con claridad = null. JAMÁS inventes, completes ni uses
cadena vacía. Preferir null siempre: la familia va a CORREGIR lo que devuelvas,
y no puede corregir lo que no sabe que está mal.

═══ LA SALIDA ═══

Respondé SOLO con este JSON, sin texto adicional y sin backticks:
{"vacunas":[{"nombre":"","fecha_aplicada":null,"fecha_proxima":null,"lote":null,"laboratorio":null,"via":null,"veterinario":null,"vencimiento_biologico":null,"tipo_vacuna":null,"confianza":"alta","evidencia":"sticker_con_fecha"}],"plan_impreso":[{"nombre":""}]}

Carnet sin ninguna aplicación ⇒ {"vacunas":[],"plan_impreso":[...]}.
Carnet ilegible ⇒ {"vacunas":[],"plan_impreso":[]}.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  // D-714: esta function corre Claude. `verify_jwt` acepta la anon key del
  // bundle, así que la puerta real es exigir SESIÓN de persona.
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
      return error('imagen_invalida', 'El body no es JSON válido.')
    }
    const { imageBase64, mediaType, modelo } = (body ?? {}) as {
      imageBase64?: unknown
      mediaType?: unknown
      modelo?: unknown
    }

    if (typeof imageBase64 !== 'string' || imageBase64.length === 0) {
      return error('imagen_invalida', 'imageBase64 requerido (string base64 no vacío).')
    }
    if (imageBase64.length > MAX_BASE64_CHARS) {
      return error('imagen_invalida', 'La foto es demasiado grande. Sacala de nuevo o elegí otra.')
    }
    const media = typeof mediaType === 'string' ? mediaType : 'image/jpeg'
    if (!MEDIA_TYPES_VALIDOS.includes(media)) {
      return error('imagen_invalida', `mediaType no soportado: ${media}.`)
    }

    // El override de modelo: sólo servidor, sólo la lista blanca (ver arriba).
    let modeloElegido: string | undefined
    if (modelo !== undefined) {
      if (rolDeSesion(req) !== 'service_role') {
        return error('imagen_invalida', 'El modelo no se elige desde el cliente.')
      }
      if (typeof modelo !== 'string' || !MODELOS_MEDIBLES.includes(modelo)) {
        return error('imagen_invalida', `Modelo no medible: ${String(modelo)}.`)
      }
      modeloElegido = modelo
    }

    const r = await llamarModelo({
      pieza: 'carnet',
      mensajes: [{ rol: 'user', texto: PROMPT }],
      imagenes: [{ mediaType: media, base64: imageBase64 }],
      salida: 'json',
      modelo: modeloElegido,
    })

    if (!r.ok) {
      if (r.error === 'error_proveedor') {
        if (r.detalle === 'sin_credencial') {
          return error('configuracion_faltante', 'ANTHROPIC_API_KEY no configurada.')
        }
        if (r.detalle === 'red') {
          return error('error_modelo', 'Error inesperado procesando el carnet.')
        }
        if (r.detalle === 'respuesta_no_json') {
          return error('error_modelo', 'La respuesta de Anthropic no es JSON.')
        }
        if (r.estadoHttp === 400) {
          return error('imagen_invalida', 'El modelo rechazó la imagen (formato o contenido inválido).')
        }
        if (r.estadoHttp === 401) {
          return error('configuracion_faltante', 'La API key de Anthropic fue rechazada.')
        }
        return error('error_modelo', `Anthropic respondió ${r.estadoHttp}.`)
      }
      if (r.error === 'timeout') {
        return error('error_modelo', 'La lectura tardó demasiado. Probá de nuevo.')
      }
      if (r.detalle === 'truncado') {
        return error('extraccion_fallida', 'La respuesta del modelo quedó truncada (carnet demasiado denso).')
      }
      return error('extraccion_fallida', 'El modelo no devolvió el JSON del contrato.')
    }

    // ── EL ESQUEMA SE EXIGE ENTERO: o cumple, o es error. Nunca parcial. ─────
    const datos = r.datos as Record<string, unknown> | null
    const vacunasCrudas = datos?.vacunas
    const planCrudo = datos?.plan_impreso

    if (!Array.isArray(vacunasCrudas)) {
      console.error('Output sin array vacunas')
      return error('extraccion_fallida', 'El JSON del modelo no trae el array vacunas.')
    }
    if (!Array.isArray(planCrudo)) {
      console.error('Output sin array plan_impreso')
      return error('extraccion_fallida', 'El JSON del modelo no trae el array plan_impreso.')
    }
    for (let i = 0; i < vacunasCrudas.length; i++) {
      if (!esVacunaExtraida(vacunasCrudas[i])) {
        console.error(`Ítem ${i} fuera de contrato:`, JSON.stringify(vacunasCrudas[i]))
        return error('extraccion_fallida', `El ítem ${i + 1} extraído no cumple el contrato.`)
      }
    }
    for (let i = 0; i < planCrudo.length; i++) {
      if (!esFilaPlan(planCrudo[i])) {
        console.error(`Fila ${i} de plan_impreso fuera de contrato`)
        return error('extraccion_fallida', `La fila ${i + 1} del plan impreso no cumple el contrato.`)
      }
    }

    return new Response(JSON.stringify({ vacunas: vacunasCrudas, plan_impreso: planCrudo }), {
      status: 200,
      headers: JSON_HEADERS,
    })
  } catch (err) {
    console.error('Error:', String(err))
    return error('error_modelo', 'Error inesperado procesando el carnet.')
  }
})
