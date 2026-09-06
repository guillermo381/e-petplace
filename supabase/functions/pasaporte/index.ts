/**
 * LA PÁGINA DEL PASAPORTE — S113-A · 1.3
 *
 * La abre alguien que **no tiene la app, no tiene cuenta y no va a crear una**:
 * está en la calle con un animal que no conoce, con una mano ocupada.
 * *Todo lo que esta página no diga en tres segundos, no se dice.*
 *
 * ── LAS DECISIONES, y cada una tiene su porqué ──────────────────────────────
 * · **`verify_jwt: false`** — el token ES la autorización, igual que en los
 *   papeles de la casa (`documento-*`). Pedir sesión sería pedirle cuenta a
 *   quien está haciendo un favor.
 * · **Cero JavaScript.** Sin JS no hay nada que fallar, nada que esperar y nada
 *   que rastree a quien entró. La página es HTML y termina.
 * · **Sin cookies, `X-Robots-Tag: noindex`** — un pasaporte no se busca en
 *   Google: se llega por el QR de una chapita. *Indexarlo convertiría una URL
 *   privada-por-oscuridad en una pública.*
 * · **Cache corto (60 s)**: si la familia marca al animal perdido, la página
 *   tiene que decirlo casi en el acto.
 * · La foto se firma **acá**, con TTL de 5 minutos: el bucket es privado y la
 *   RPC no puede firmar.
 *
 * ── RUTAS ───────────────────────────────────────────────────────────────────
 *   /functions/v1/pasaporte?t=<token>       → la página
 *   /functions/v1/pasaporte/<token>         → la página
 *   /functions/v1/pasaporte/<token>.svg     → el QR (vectorial, para el PDF)
 *   /functions/v1/pasaporte/<token>.png     → el QR (mapa de bits, para la placa)
 */
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { qrPng, qrSvg } from './qr.ts'
import { urlPasaporte } from '../_shared/qr.ts'

const URL_BASE = Deno.env.get('SUPABASE_URL') ?? ''
/* 🔴 EL QR APUNTA AL SITIO, no a esta edge. Se importa de `_shared/qr.ts`
   para que **un solo lugar** decida qué se graba en metal: dos sitios
   escribiéndolo distinto es un lote de chapitas apuntando a ninguna parte, y
   eso no se corrige con un deploy. */
const publica = urlPasaporte

const CABECERAS = {
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'none'; img-src 'self' https: data:; style-src 'unsafe-inline'",
}

const esc = (s: unknown): string =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

/* La voz de la casa cuando no hay nada que mostrar. **No dice si el token
   existió o no**: distinguirlo le contaría a quien prueba tokens cuáles fueron
   reales alguna vez. */
/** El 404 en JSON. **No dice si el token existió**: distinguirlo le contaría a
 *  quien prueba tokens cuáles fueron reales alguna vez. */
function json404(): Response {
  return new Response(JSON.stringify({ estado: 'no_disponible' }), {
    status: 404,
    headers: { ...CABECERAS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

function pagina404(): Response {
  const html = `<!doctype html><html lang="es"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pasaporte no disponible</title>
<style>${CSS}</style>
<main class="p"><div class="c">
<h1>Este pasaporte ya no está activo</h1>
<p class="q">Puede que la familia lo haya dado de baja o que el código esté incompleto.
Si tienes al animal contigo, revisa si la chapita tiene otro código.</p>
</div></main></html>`
  return new Response(html, {
    status: 404,
    headers: { ...CABECERAS, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}


/* LA PLACA QUE TODAVÍA NO TIENE DUEÑO (S113-A · 2.1 · A5).
   Alguien acaba de comprar la chapita y la escanea antes de activarla. Un 404
   acá le diría que le vendieron algo roto. */
function paginaPlacaLibre(token: string): Response {
  const html = `<!doctype html><html lang="es"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Esta placa espera a su mascota</title>
<meta name="robots" content="noindex,nofollow">
<style>${CSS}</style>
<main class="p"><div class="c">
<h1>Esta placa espera a su mascota</h1>
<p class="q">Todavía nadie la activó. Si es tuya, abre e-PetPlace y escanea el
código para asociarla a tu mascota: desde ese momento, cualquiera que la
encuentre va a poder llamarte.</p>
<a class="cta" href="cliente:///hogar?placa=${esc(token)}">Activarla en la app</a>
<p class="msg">¿Todavía no tienes la app? Busca <strong>e-PetPlace</strong> en tu tienda.</p>
<p class="pie">e-PetPlace · placa <code>${esc(token.slice(0, 6))}…</code></p>
</div></main></html>`
  return new Response(html, {
    headers: { ...CABECERAS, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

/* El papel de la casa: tinta #221E19 sobre papel algodón #FAF9F7, la misma
   pareja de los PDF. Todo inline — una hoja externa sería un pedido más que
   puede fallar en una calle con mala señal. */
const CSS = `
:root{color-scheme:light}
*{box-sizing:border-box;margin:0}
body{background:#FAF9F7;color:#221E19;font:16px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
.p{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
.c{width:100%;max-width:420px;background:#fff;border-radius:20px;padding:28px;
   box-shadow:0 1px 2px rgba(34,30,25,.06),0 8px 24px rgba(34,30,25,.08)}
h1{font-size:28px;line-height:1.15;letter-spacing:-.01em;margin-bottom:8px}
.q{color:#6B6560;font-size:15px}
.foto{width:132px;height:132px;border-radius:66px;object-fit:cover;display:block;margin:0 auto 16px;background:#EFEDEA}
.n{text-align:center;font-size:34px;line-height:1.1;margin-bottom:4px}
.d{text-align:center;color:#6B6560;font-size:15px;margin-bottom:20px}
.alerta{background:#FDF0E7;border-left:4px solid #C2410C;border-radius:8px;padding:14px 16px;margin-bottom:18px}
.alerta strong{display:block;font-size:17px;margin-bottom:2px}
.cta{display:block;text-align:center;background:#221E19;color:#fff;text-decoration:none;
     border-radius:14px;padding:17px;font-size:18px;font-weight:600;margin-bottom:10px}
.msg{text-align:center;color:#6B6560;font-size:15px;margin-bottom:18px}
.s{border-top:1px solid #EFEDEA;padding-top:14px;margin-top:14px}
.s h2{font-size:13px;text-transform:none;color:#6B6560;font-weight:600;margin-bottom:6px}
.chip{display:inline-block;background:#FDF0E7;color:#9A3412;border-radius:999px;
      padding:4px 11px;font-size:14px;margin:0 6px 6px 0}
.med{font-size:15px;margin-bottom:3px}
.med span{color:#6B6560}
.pie{text-align:center;color:#9A948E;font-size:12px;margin-top:20px}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px}
`

function pagina(d: Record<string, unknown>, foto: string | null, token: string): string {
  const c = d.contacto as Record<string, string> | null
  const alergias = (d.alergias ?? []) as { alergeno: string; severidad: string }[]
  const medicacion = (d.medicacion ?? []) as { medicamento: string; dosis: string; frecuencia: string }[]
  const perdida = d.perdida === true

  const detalle = [d.raza, d.edad, d.sexo === 'macho' ? 'Macho' : d.sexo === 'hembra' ? 'Hembra' : null]
    .filter(Boolean).map(esc).join(' · ')

  /* 🔴 EL AVISO DE PERDIDA VA PRIMERO Y ANTES QUE EL NOMBRE. Es lo único que
     cambia lo que la persona tiene que hacer, y quien mira una pantalla en la
     calle lee el primer bloque y actúa. */
  const aviso = perdida
    ? `<div class="alerta"><strong>Esta mascota está perdida</strong>
       Su familia la está buscando. Cualquier dato ayuda.</div>` : ''

  /* El teléfono es un enlace `tel:` — en un teléfono es un toque, no una
     transcripción a mano de nueve dígitos con una mano ocupada. */
  const llamar = c?.telefono
    ? `<a class="cta" href="tel:${esc(String(c.telefono).replace(/[^\d+]/g, ''))}">Llamar${c.nombre ? ' a ' + esc(c.nombre) : ''}</a>`
    : ''
  const mensaje = c?.mensaje ? `<p class="msg">${esc(c.mensaje)}</p>` : ''

  const bloqueAlergias = alergias.length > 0
    ? `<div class="s"><h2>Cuidado con</h2>${alergias.map((a) =>
        `<span class="chip">${esc(a.alergeno)}${a.severidad ? ' · ' + esc(a.severidad) : ''}</span>`).join('')}</div>`
    : ''
  const bloqueMed = medicacion.length > 0
    ? `<div class="s"><h2>Está tomando</h2>${medicacion.map((m) =>
        `<p class="med">${esc(m.medicamento)} <span>${esc([m.dosis, m.frecuencia].filter(Boolean).join(' · '))}</span></p>`).join('')}</div>`
    : ''
  const bloqueChip = d.chip
    ? `<div class="s"><h2>Microchip</h2><code>${esc(d.chip)}</code></div>` : ''

  return `<!doctype html><html lang="es"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(d.nombre)}</title>
<meta name="robots" content="noindex,nofollow">
<style>${CSS}</style>
<main class="p"><div class="c">
${aviso}
${foto ? `<img class="foto" src="${esc(foto)}" alt="${esc(d.nombre)}">` : ''}
<h1 class="n">${esc(d.nombre)}</h1>
${detalle ? `<p class="d">${detalle}</p>` : ''}
${llamar}${mensaje}
${bloqueAlergias}${bloqueMed}${bloqueChip}
<p class="pie">e-PetPlace · pasaporte <code>${esc(token.slice(0, 6))}…</code></p>
</div></main></html>`
}

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const cola = url.pathname.split('/').filter(Boolean).pop() ?? ''
  const deRuta = /^[A-Za-z0-9_-]{22}(\.svg|\.png)?$/.test(cola) ? cola : ''
  const token = (url.searchParams.get('t') ?? deRuta).replace(/\.(svg|png)$/, '')
  /* `?formato=json` (S113-A · el sitio). La página pública dejó de servirse
     desde acá —Supabase degrada `text/html` a `text/plain` en GET, medido— y
     pasó a `www.epetplace.com/p/<token>`, que consume ESTE json.
     *La edge sigue siendo la única que sabe leer un pasaporte; lo que cambió
     es quién lo dibuja.* */
  const pedidoJson = url.searchParams.get('formato') === 'json'
  const formato = pedidoJson
    ? 'json'
    : deRuta.endsWith('.svg') ? 'svg' : deRuta.endsWith('.png') ? 'png' : 'html'

  if (!/^[A-Za-z0-9_-]{22}$/.test(token)) return pagina404()

  const sb = createClient(URL_BASE, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
  const { data, error } = await sb.rpc('leer_pasaporte', { p_token: token })

  /* Si el pasaporte no resuelve, puede ser una PLACA fabricada y todavía sin
     activar. Se pregunta en ese orden y no al revés: una placa activada tiene
     pasaporte, así que la primera consulta ya la cubre. */
  if (error || data === null) {
    const { data: placa } = await sb
      .from('pasaporte_placa')
      .select('token')
      .eq('token', token)
      .is('activada_en', null)
      .maybeSingle()
    if (placa) {
      if (formato === 'json') {
        return new Response(JSON.stringify({ estado: 'placa_libre', token }), {
          headers: { ...CABECERAS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
        })
      }
      // el QR de una placa libre igual se sirve: es el mismo código grabado
      if (formato === 'svg') {
        return new Response(qrSvg(publica(token)), {
          headers: { ...CABECERAS, 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
        })
      }
      if (formato === 'png') {
        const png = await qrPng(publica(token))
        return new Response(png.buffer as ArrayBuffer, {
          headers: { ...CABECERAS, 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' },
        })
      }
      return paginaPlacaLibre(token)
    }
    return formato === 'json' ? json404() : pagina404()
  }

  /* Pasado el límite se contesta 429 con la misma voz. *No se dice «demasiadas
     lecturas de ESTE token», que confirmaría que el token existe.* */
  if ((data as Record<string, unknown>).limite === true) {
    if (formato === 'json') {
      return new Response(JSON.stringify({ estado: 'limite' }), {
        status: 429,
        headers: { ...CABECERAS, 'Content-Type': 'application/json; charset=utf-8', 'Retry-After': '60' },
      })
    }
    return new Response('Probá de nuevo en un minuto.', {
      status: 429,
      headers: { ...CABECERAS, 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '60' },
    })
  }

  /* ── el QR ────────────────────────────────────────────────────────────────
     Cache de UNA HORA, y bajó de 24 h por una razón medida: al mover la URL de
     la edge al sitio, el CDN siguió sirviendo **el QR viejo** durante horas.
     Eso da igual para una imagen en una pantalla —se recarga— pero **este QR
     se graba en metal**: una chapita impresa desde un SVG cacheado apunta para
     siempre a una página que sale en texto plano, y eso no se corrige con un
     deploy. *Lo único de esta cadena que no se puede volver a desplegar es el
     objeto físico.*
     Hoy el riesgo es cero —cero placas fabricadas, medido— y el techo baja
     igual: cuesta nada y cubre la próxima vez que la URL se mueva. */
  if (formato === 'svg') {
    return new Response(qrSvg(publica(token)), {
      headers: { ...CABECERAS, 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
    })
  }
  if (formato === 'png') {
    /* `.buffer` y no el Uint8Array: el tipo de `BodyInit` de Deno no acepta un
       `Uint8Array<ArrayBufferLike>` genérico. Lo cazó `deno check` — otra vez el
       typechecker viendo lo que un `grep` no puede. */
    const png = await qrPng(publica(token))
    return new Response(png.buffer as ArrayBuffer, {
      headers: { ...CABECERAS, 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' },
    })
  }

  const d = data as Record<string, unknown>

  /* ── EL JSON, que es lo que consume `www.epetplace.com/p/<token>` ────────
     Se manda EXACTAMENTE lo que la mesa listó, ni un campo más: lo que no
     entra acá no puede filtrarse por una página que no controlamos del todo.
     La foto viaja ya FIRMADA y transformada (264 px, calidad 60) porque el
     bucket es privado y el sitio no tiene —ni debe tener— credenciales. */
  if (formato === 'json') {
    let fotoJson: string | null = null
    if (typeof d.foto_path === 'string' && d.foto_path.length > 0) {
      const { data: f } = await sb.storage.from('mascotas').createSignedUrl(d.foto_path, 900, {
        transform: { width: 264, height: 264, resize: 'cover', quality: 60 },
      })
      fotoJson = f?.signedUrl ?? null
    }
    return new Response(JSON.stringify({
      estado: 'activo',
      nombre: d.nombre ?? null,
      raza: d.raza ?? null,
      edad: d.edad ?? null,
      sexo: d.sexo ?? null,
      perdida: d.perdida === true,
      foto: fotoJson,
      contacto: d.contacto ?? null,
      alergias: d.alergias ?? [],
      medicacion: d.medicacion ?? [],
      chip: d.chip ?? null,
      qr_svg: `${URL_BASE}/functions/v1/pasaporte/${token}.svg`,
      qr_png: `${URL_BASE}/functions/v1/pasaporte/${token}.png`,
    }), {
      headers: {
        ...CABECERAS,
        'Content-Type': 'application/json; charset=utf-8',
        // corto: si la familia marca «perdida», la página tiene que decirlo ya
        'Cache-Control': 'public, max-age=60',
      },
    })
  }

  // ── la página ─────────────────────────────────────────────────────────────
  let foto: string | null = null
  if (typeof d.foto_path === 'string' && d.foto_path.length > 0) {
    /* El bucket es privado (medido): se firma acá, corto.
       ⚠️ **Y se pide TRANSFORMADA.** La foto original de una mascota ronda los
       60-500 kB; esta página se abre en la calle, con una mano, en la red que
       haya. Se sirve a 264 px (el doble de los 132 css que se dibujan, para
       pantallas densas) y calidad 60. *Una página que tarda no se lee: quien
       encontró al animal cierra y sigue caminando.* */
    const { data: f } = await sb.storage.from('mascotas').createSignedUrl(d.foto_path, 300, {
      transform: { width: 264, height: 264, resize: 'cover', quality: 60 },
    })
    foto = f?.signedUrl ?? null
  }

  return new Response(pagina(d, foto, token), {
    headers: {
      ...CABECERAS,
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
    },
  })
})
