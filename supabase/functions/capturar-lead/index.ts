/**
 * capturar-lead — LA PUERTA ÚNICA del sitio público.
 *
 * ⚠️ DESPLEGADA Y VIVA desde el 10-ago-2026, con `--no-verify-jwt
 * --use-api`. Su fuente es ésta: cualquier cambio se hace acá y se
 * redespliega, jamás en el panel.
 *
 * ⚠️ SU FUENTE VIVE VERSIONADA. En esta casa ya hubo dos functions
 * desplegadas sin fuente en el repo (D-309, D-717); ésta nace con la suya.
 * Al desplegarla, copiar este archivo a `supabase/functions/` del monorepo
 * de la app, que es donde vive el proyecto Supabase.
 *
 * ── POR QUÉ EL GUARD ESTÁ ADENTRO ──
 * El sitio no tiene sesión, así que `verify_jwt` no protege nada: con la
 * anon key —que es pública y viaja en cualquier bundle— entraría
 * cualquiera. Es la letra de D-713/D-714 aplicada a una puerta que nace
 * pública A PROPÓSITO. El freno real es el rate limit + el origen, acá
 * dentro. Desplegar con `--no-verify-jwt`.
 */

// @ts-nocheck — Deno en el edge; los tipos viven en el runtime de Supabase.
import { createClient } from 'jsr:@supabase/supabase-js@2'

/**
 * Los orígenes que el NAVEGADOR puede usar. Incluye el preview local
 * porque el gate del founder se corre ahí y, sin esto, el formulario
 * rebota por CORS en el único lugar donde se lo puede probar antes de
 * publicar.
 *
 * ⚠️ Y hay que decir lo que esta lista NO es: **no es una barrera de
 * seguridad.** El header `Origin` lo pone el navegador, y cualquiera lo
 * falsifica con un `curl -H`. Sirve para que un sitio de terceros no
 * postee desde el navegador de un visitante, y para nada más. El freno
 * real del abuso es el rate limit por IP, que vive en la base.
 */
/**
 * ⚠️ NOMBRES EXACTOS, JAMÁS COMODINES. Un `*.vercel.app` dejaría que
 * cualquier despliegue de cualquier cuenta consuma esta puerta y facture
 * contra este proyecto — es D-558 del canon, y ya se pagó una vez.
 * Por eso entra el host ESTABLE del proyecto y no las URLs por despliegue
 * (`epetplace-<hash>-...vercel.app`), que son infinitas por diseño.
 */
const ORIGENES_PERMITIDOS = [
  'https://www.epetplace.com',
  'https://epetplace.com',
  'https://epetplace-web.vercel.app',
  'http://localhost:4321',
  'http://127.0.0.1:4321',
  'http://192.168.1.64:4321',
]

/**
 * Rate limit por IP — EN LA BASE, no en memoria.
 * El `Map` del isolate NO frenaba: medido con 8 envíos seguidos contra un
 * tope de 5, los ocho pasaron, porque las edge functions escalan a varios
 * isolates y cada uno arranca con el contador en cero.
 */
const TOPE_POR_IP = 5
const VENTANA_HORAS = 1

/** SHA-256 de la IP + salt. Nunca se guarda la IP en claro. */
async function hashDe(ip: string) {
  const salt = Deno.env.get('LIMITE_SALT') ?? 'epp'
  const datos = new TextEncoder().encode(`${salt}:${ip}`)
  const buf = await crypto.subtle.digest('SHA-256', datos)
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * El destinatario de los avisos es VARIABLE, no un valor incrustado.
 * Hoy es el correo personal del founder: montar un buzón en el dominio
 * agregaría MX y tocaría el SPF de Resend justo el día de la publicación
 * — y el DNS ya está medido sin MX. El día que exista `care@`, se cambia
 * en UN lugar: `supabase secrets set AVISOS_EMAIL=...`
 */
const AVISOS = Deno.env.get('AVISOS_EMAIL') ?? ''
const REMITENTE = 'e-PetPlace <hola@epetplace.com>'

/**
 * El asunto lleva PREFIJO FIJO para que sea filtrable: con
 * `[e-PetPlace ·` el founder arma una regla y todos los leads caen en su
 * etiqueta, separados del correo personal. El tipo y el dato
 * identificador van después, para reconocerlo sin abrirlo.
 */
const asuntoDe = (tipo: string, dato: string, ciudad: string) => {
  const etiqueta = tipo === 'prestador' ? 'PRESTADOR' : tipo === 'pet_parent' ? 'FAMILIA' : 'CONTACTO'
  return `[e-PetPlace · ${etiqueta}] ${dato} — ${ciudad}`
}

const cuando = () =>
  new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil', dateStyle: 'short', timeStyle: 'short' })

const TIPOS = ['prestador', 'pet_parent', 'contacto']
const OFICIOS = ['veterinaria', 'grooming', 'paseos', 'adiestramiento', 'otro']
const ESPECIES = ['perro', 'gato', 'conejo', 'ave', 'pez', 'roedor', 'otra']
/**
 * El código del país y el largo NACIONAL de su número. El largo hace falta
 * para no duplicar el prefijo cuando alguien pega el número entero — ver
 * `aE164`.
 */
const PAISES: Record<string, { codigo: string; nacional: number }> = {
  EC: { codigo: '593', nacional: 9 },
  CO: { codigo: '57', nacional: 10 },
}

const cabeceras = (origen: string | null) => ({
  'Access-Control-Allow-Origin': ORIGENES_PERMITIDOS.includes(origen ?? '') ? origen! : ORIGENES_PERMITIDOS[0],
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'content-type': 'application/json',
})

/** Error TIPADO, jamás un 500 mudo: el sitio muestra qué pasó. */
const rebote = (codigo: string, estado: number, origen: string | null) =>
  new Response(JSON.stringify({ ok: false, error: codigo }), { status: estado, headers: cabeceras(origen) })

const limpio = (v: unknown, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : null)

/**
 * El WhatsApp sale en E.164 ENTERO o no sale.
 *
 * ⚠️ EL PREFIJO NO SE DUPLICA. El campo pide el número nacional y el país
 * sale de un selector, pero la gente pega el número entero —con `+593` o
 * sin el `+`— porque es como lo tiene guardado. Medido en la prueba de
 * producción: `+593987654321` se guardaba como `+593593987654321`, y ese
 * es JUSTO el número que el aviso convierte en enlace `wa.me`. Un aviso
 * que existe para que el founder llame y trae un número que no existe no
 * falla a medias: falla entero, y en silencio.
 *
 * El prefijo se saca solo cuando sacarlo deja un número nacional del largo
 * correcto. Sin esa condición, un número nacional que empiece por los
 * mismos dígitos quedaría mutilado.
 */
function aE164(pais: string | null, numero: string | null): string | null {
  if (!numero) return null
  const p = PAISES[pais ?? 'EC'] ?? PAISES.EC
  let digitos = numero.replace(/\D/g, '').replace(/^0+/, '')
  if (digitos.startsWith(p.codigo) && digitos.length === p.codigo.length + p.nacional) {
    digitos = digitos.slice(p.codigo.length)
  }
  if (digitos.length < 7 || digitos.length > 12) return null
  return `+${p.codigo}${digitos}`
}

/**
 * ⚠️ EL RESULTADO SE MIRA. Hasta el 10-ago-2026 los cuatro llamados hacían
 * `await enviarCorreo(...)` y tiraban la respuesta: si Resend rechazaba,
 * el lead se guardaba, la function devolvía `ok:true` y NADIE se enteraba
 * — el founder vería una lista que crece sin recibir un solo aviso, que es
 * el peor modo de falla posible para una puerta cuyo único trabajo es
 * avisar. Una verificación cuyo modo de falla es el silencio no es una
 * verificación.
 */
async function enviarCorreo(asunto: string, html: string, para: string) {
  const key = Deno.env.get('RESEND_API_KEY')
  if (!key) return { ok: false, motivo: 'sin_api_key' }
  if (!para) return { ok: false, motivo: 'sin_destinatario' }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: REMITENTE, to: [para], subject: asunto, html }),
  })
  return { ok: r.ok, motivo: r.ok ? null : `resend_${r.status}` }
}

Deno.serve(async (req) => {
  const origen = req.headers.get('origin')
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cabeceras(origen) })
  if (req.method !== 'POST') return rebote('metodo_no_permitido', 405, origen)

  // El origen se EXIGE, no se acepta ausente: un POST sin `Origin` es
  // siempre programático, y exigirlo sube el costo del abuso trivial sin
  // romper a ningún navegador, que siempre lo manda en cross-origin.
  if (!origen || !ORIGENES_PERMITIDOS.includes(origen)) return rebote('origen_no_permitido', 403, origen)

  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'sin-ip'

  let cuerpo: Record<string, unknown>
  try {
    cuerpo = await req.json()
  } catch {
    return rebote('cuerpo_invalido', 400, origen)
  }

  const tipo = limpio(cuerpo.tipo, 20)
  if (!tipo || !TIPOS.includes(tipo)) return rebote('tipo_invalido', 400, origen)

  const nombre = limpio(cuerpo.nombre, 120)
  const ciudad = limpio(cuerpo.ciudad, 120)
  const idioma = limpio(cuerpo.idioma, 2) === 'en' ? 'en' : 'es'
  const origenLead = limpio(cuerpo.origen, 300) ?? 'desconocido'
  const email = limpio(cuerpo.email, 200)
  const negocio = limpio(cuerpo.negocio, 160)
  const oficio = limpio(cuerpo.oficio, 20)
  const especie = limpio(cuerpo.especie, 20)
  const mensaje = limpio(cuerpo.mensaje, 4000)
  const whatsapp = aE164(limpio(cuerpo.pais, 2), limpio(cuerpo.whatsapp, 40))

  if (!nombre) return rebote('nombre_faltante', 400, origen)
  // `/contacto` no pide ciudad; los otros dos sí.
  if (tipo !== 'contacto' && !ciudad) return rebote('ciudad_faltante', 400, origen)
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) return rebote('email_invalido', 400, origen)

  if (tipo === 'pet_parent') {
    if (!email) return rebote('email_faltante', 400, origen)
    if (!especie || !ESPECIES.includes(especie)) return rebote('especie_invalida', 400, origen)
  }
  if (tipo === 'prestador') {
    if (!whatsapp) return rebote('whatsapp_invalido', 400, origen)
    if (!negocio) return rebote('negocio_faltante', 400, origen)
    if (!oficio || !OFICIOS.includes(oficio)) return rebote('oficio_invalido', 400, origen)
  }
  if (tipo === 'contacto') {
    if (!email) return rebote('email_faltante', 400, origen)
    if (!mensaje) return rebote('mensaje_faltante', 400, origen)
  }

  // ── RATE LIMIT POR IP (sin captcha, decisión de mesa) ──
  // Va DESPUÉS de validar: un cuerpo mal formado no debe gastarle el cupo
  // a nadie, y así el tope cuenta intentos reales, no ruido.
  const db0 = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  })
  const { data: permitido, error: errLimite } = await db0.rpc('registrar_intento_lead', {
    p_hash: await hashDe(ip),
    p_tope: TOPE_POR_IP,
    p_horas: VENTANA_HORAS,
  })
  // Si el contador falla, se DEJA PASAR: un lead real vale más que un
  // freno perfecto, y el fallo queda en el log.
  if (errLimite) console.error('[capturar-lead] limite', errLimite.message)
  else if (permitido === false) return rebote('demasiados_intentos', 429, origen)

  // ── ESCRITURA: por la RPC de `public`, no por la tabla ──
  // PostgREST solo enruta a los schemas EXPUESTOS del proyecto, y
  // `marketing` no lo está a propósito. `public.capturar_lead` es la
  // puerta: SECURITY DEFINER, revocada a anon y authenticated, y la única
  // que toca la tabla desde afuera.
  const { error } = await db0.rpc('capturar_lead', {
    p_tipo: tipo,
    p_nombre: nombre,
    p_ciudad: ciudad ?? '—',
    p_origen: origenLead,
    p_idioma: idioma,
    p_negocio: negocio,
    p_whatsapp: whatsapp,
    p_email: email,
    p_oficio: oficio,
    p_especie: especie,
    p_mensaje: mensaje,
  })

  if (error) {
    console.error('[capturar-lead] insert', error.message)
    return rebote('no_se_pudo_guardar', 500, origen)
  }

  // ── LOS CORREOS ──
  // El lead YA está guardado. De acá en adelante nada puede devolver un
  // error al usuario: perder un lead por un fallo de correo sería cambiar
  // lo importante por lo accesorio.
  const esc = (s: string | null) => (s ?? '—').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]!)
  // El link que hace que responder sea UN clic y no un copiar-pegar.
  const wa = whatsapp ? `https://wa.me/${whatsapp.replace('+', '')}` : null

  /** Envuelve el envío para que ningún fallo pase callado. */
  const enviados: string[] = []
  const enviar = async (etiqueta: string, asunto: string, html: string, para: string) => {
    const r = await enviarCorreo(asunto, html, para)
    enviados.push(`${etiqueta}=${r.ok ? 'ok' : r.motivo}`)
    if (!r.ok) console.error(`[capturar-lead] correo ${etiqueta} FALLÓ: ${r.motivo}`)
  }

  try {
    if (tipo === 'prestador') {
      await enviar(
        'aviso',
        asuntoDe(tipo, negocio!, ciudad!),
        `<div style="font-family:system-ui,sans-serif;max-width:520px">
           <p style="margin:0 0 18px"><b>${esc(nombre)}</b> · ${esc(negocio)}<br>
              ${esc(oficio)} · ${esc(ciudad)}</p>
           ${
             wa
               ? `<p style="margin:0 0 18px"><a href="${wa}" style="display:inline-block;background:#FF00AF;color:#221E19;padding:14px 22px;border-radius:10px;text-decoration:none;font-weight:700">Abrir WhatsApp · ${esc(whatsapp)}</a></p>`
               : ''
           }
           ${email ? `<p style="margin:0 0 18px">${esc(email)}</p>` : ''}
           <p style="color:#6b6584;font-size:13px;margin:0">${esc(origenLead)} · ${cuando()}</p>
         </div>`,
        AVISOS,
      )
    }

    if (tipo === 'pet_parent') {
      const bienvenida =
        idioma === 'en'
          ? `<h2>You're on the list, ${esc(nombre)}</h2>
             <p>Thanks for joining as a founding family. We're opening city by city, and we'll write to you as soon as we open in ${esc(ciudad)}.</p>
             <p>— e-PetPlace</p>`
          : `<h2>Quedaste en la lista, ${esc(nombre)}</h2>
             <p>Gracias por sumarte como familia fundadora. Estamos abriendo de a poco, ciudad por ciudad, y te escribimos apenas abramos en ${esc(ciudad)}.</p>
             <p>— e-PetPlace</p>`
      await enviar(
        'bienvenida',
        idioma === 'en' ? 'Welcome to e-PetPlace' : 'Bienvenida a e-PetPlace',
        bienvenida,
        email!,
      )
      await enviar(
        'aviso',
        asuntoDe(tipo, nombre!, ciudad!),
        `<div style="font-family:system-ui,sans-serif;max-width:520px">
           <p style="margin:0 0 18px"><b>${esc(nombre)}</b> · ${esc(ciudad)}<br>
              ${esc(email)}<br>
              mascota: ${esc(especie)}</p>
           <p style="color:#6b6584;font-size:13px;margin:0">${esc(origenLead)} · ${cuando()}</p>
         </div>`,
        AVISOS,
      )
    }

    if (tipo === 'contacto') {
      await enviar(
        'aviso',
        asuntoDe(tipo, nombre!, ciudad ?? '—'),
        `<div style="font-family:system-ui,sans-serif;max-width:520px">
           <p style="margin:0 0 18px"><b>${esc(nombre)}</b><br>
              <a href="mailto:${esc(email)}">${esc(email)}</a></p>
           <p style="white-space:pre-wrap;margin:0 0 18px">${esc(mensaje)}</p>
           <p style="color:#6b6584;font-size:13px;margin:0">${esc(origenLead)} · ${cuando()}</p>
         </div>`,
        AVISOS,
      )
    }
  } catch (e) {
    // Se registra y se sigue: el lead está guardado, que es lo que importa.
    console.error('[capturar-lead] correo', String(e))
    enviados.push('excepcion')
  }

  console.log(`[capturar-lead] ${tipo} guardado · correos: ${enviados.join(' ') || 'ninguno'}`)

  /**
   * `correos` viaja en la respuesta para que una prueba de punta a punta
   * pueda AFIRMAR que el aviso salió, en vez de suponerlo por el 200. No
   * expone nada: son etiquetas de estado, no direcciones ni contenido.
   */
  return new Response(JSON.stringify({ ok: true, correos: enviados }), {
    status: 200,
    headers: cabeceras(origen),
  })
})
