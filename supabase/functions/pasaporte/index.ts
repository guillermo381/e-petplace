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

const URL_BASE = Deno.env.get('SUPABASE_URL') ?? ''
const publica = (t: string) => `${URL_BASE}/functions/v1/pasaporte?t=${t}`

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
function pagina404(): Response {
  const html = `<!doctype html><html lang="es"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pasaporte no disponible</title>
<style>${CSS}</style>
<main class="p"><div class="c">
<h1>Este pasaporte ya no está activo</h1>
<p class="q">Puede que la familia lo haya dado de baja o que el código esté incompleto.
Si tenés al animal con vos, revisá si la chapita tiene otro código.</p>
</div></main></html>`
  return new Response(html, {
    status: 404,
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
  const formato = deRuta.endsWith('.svg') ? 'svg' : deRuta.endsWith('.png') ? 'png' : 'html'

  if (!/^[A-Za-z0-9_-]{22}$/.test(token)) return pagina404()

  const sb = createClient(URL_BASE, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
  const { data, error } = await sb.rpc('leer_pasaporte', { p_token: token })
  if (error || data === null) return pagina404()

  /* Pasado el límite se contesta 429 con la misma voz. *No se dice «demasiadas
     lecturas de ESTE token», que confirmaría que el token existe.* */
  if ((data as Record<string, unknown>).limite === true) {
    return new Response('Probá de nuevo en un minuto.', {
      status: 429,
      headers: { ...CABECERAS, 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '60' },
    })
  }

  // ── el QR ─────────────────────────────────────────────────────────────────
  // Cache LARGA: el contenido del QR es la URL, y la URL no cambia mientras el
  // token viva. Un token revocado ya cayó en el 404 de arriba.
  if (formato === 'svg') {
    return new Response(qrSvg(publica(token)), {
      headers: { ...CABECERAS, 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'public, max-age=86400' },
    })
  }
  if (formato === 'png') {
    /* `.buffer` y no el Uint8Array: el tipo de `BodyInit` de Deno no acepta un
       `Uint8Array<ArrayBufferLike>` genérico. Lo cazó `deno check` — otra vez el
       typechecker viendo lo que un `grep` no puede. */
    const png = await qrPng(publica(token))
    return new Response(png.buffer as ArrayBuffer, {
      headers: { ...CABECERAS, 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' },
    })
  }

  // ── la página ─────────────────────────────────────────────────────────────
  const d = data as Record<string, unknown>
  let foto: string | null = null
  if (typeof d.foto_path === 'string' && d.foto_path.length > 0) {
    // el bucket es privado (medido): se firma acá, corto.
    const { data: f } = await sb.storage.from('mascotas').createSignedUrl(d.foto_path, 300)
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
