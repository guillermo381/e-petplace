// ============================================================================
// despachar-correo — LA ÚNICA VOZ AL EXTERIOR (S88-A · Lote 2 → S89-A · foco ⑤)
//
// El dispatch firmado (S87): pg_cron toca el timbre por pg_net → esta función.
// La DB decide TODO (gates, kill switch, techo, sombra) en
// `despachar_notificaciones`; acá solo se ENTREGA lo que quedó marcado
// `para_transporte`, y se escribe de vuelta entregada/fallida con su causa.
//
// S89 · LA CARA DEL CORREO — la plantilla madre viva, consumiendo la espec de
// B VERBATIM (docs/relevamientos/2026-08-06-s89b-ESPEC-cara-del-correo.md):
// papel #FAF9F7 · tinta #221E19 · acento magentaDark #8E1F68 (7.84 en papel;
// el oro NO rige acá — el correo es superficie papel, alcance firmado) ·
// código 32px mono en caja papelTapiz con borde hairline · pie con el
// remitente firmado `hola@epetplace.com` literal · par oscuro por
// `prefers-color-scheme` como mejora progresiva (Capa 1) y NINGUNA
// información viajando solo en color (Capa 2: la inversión forzada de Gmail
// puede matar el magentaDark — 2.27 medido — jamás al eje tinta/papel).
//
// LAS TRES DECISIONES DE A (la espec las dejaba abiertas), DECLARADAS:
//  1. ISOTIPO: NO viaja imagen — la cabecera es el wordmark en TEXTO (18px
//     600 tinta). Cero imágenes = cero tracking involuntario de apertura y
//     nada que morir con el bloqueo de imágenes; el isotipo hosted queda
//     para el arco del dominio, si el founder lo pide sobre la demo.
//  2. TEXT/PLAIN ALTERNO: SÍ — todo correo viaja multipart (html + text);
//     el text lleva título, mensaje, código si hay, y el pie.
//  3. TTL DEL CÓDIGO: la plantilla dice SOLO la vigencia REAL que el
//     productor declare (`datos.codigo_vigencia_min`); sin dato, NO inventa
//     un «vence en 10 minutos» — dice cómo copiarlo y nada más (L-192: un
//     dato inventado con cara de verdad es peor que su ausencia).
//
// MODO SOMBRA DE TRANSPORTE: sin RESEND_API_KEY (el dominio todavía no
// verificó — arco propio del correo), la función corre entera, reporta qué
// HABRÍA entregado y NO toca las filas.
//
// LA LEY DE LA PANTALLA BLOQUEADA (§4) rige TAMBIÉN acá: el correo queda
// escrito en servidores ajenos. El cuerpo es la campana, jamás el contenido.
// ============================================================================

import { createClient } from 'npm:@supabase/supabase-js@2';

// Remitente FIRMADO (founder, 6-ago-2026). La verificación del dominio y su
// reputación son arco propio; hasta entonces rige el modo sombra.
const REMITENTE = 'e-PetPlace <hola@epetplace.com>';

// ── Los hex de la espec (fuente única palette.ts, transcritos por B) ────────
const PAPEL = '#FAF9F7';
const TINTA = '#221E19';
const TINTA_65 = 'rgba(34,30,25,.65)';
const HAIRLINE = 'rgba(34,30,25,.18)';
const ACENTO = '#8E1F68'; // magentaDark — 7.84 sobre papel
const TAPIZ = '#FAF2F5'; // caja del código — tinta sobre él 15.05
const SANS = "'DM Sans', -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO = "'JetBrains Mono', 'SF Mono', 'Roboto Mono', Consolas, Menlo, monospace";

function escaparHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** El código se PRESENTA en grupos de 4 — el espacio es presentación, no
 *  valor (CampoCodigo sanea al pegar; medido S88-B). */
function agrupar(codigo: string): string {
  return codigo.replace(/\s+/g, '').replace(/(.{4})(?=.)/g, '$1 ');
}

type Datos = {
  titulo?: string;
  mensaje?: string;
  codigo?: string;
  codigo_vigencia_min?: number | string;
  // S89 orden 8 ④ — el detalle de los tipos de cita (los productores los
  // portan como claves desde 20260806250000; sin ellas, cero bloque).
  mascota_nombre?: string;
  negocio?: string;
  fecha?: string;
  hora?: string;
};

/** El bloque de detalle de la cita — proporciones de la espec: etiqueta 13px
 *  tinta.65, valor 16px tinta, LA HORA EN MONO (voz de máquina de la casa).
 *  Solo se pinta con datos reales; jamás inventa una fila vacía. */
function bloqueDetalle(d: Datos): string {
  const filas: Array<[string, string, boolean]> = [];
  if (d.mascota_nombre) filas.push(['Mascota', d.mascota_nombre, false]);
  if (d.negocio) filas.push(['Con', d.negocio, false]);
  if (d.fecha) filas.push(['Fecha', d.fecha, true]);
  if (d.hora) filas.push(['Hora', d.hora, true]);
  if (filas.length === 0) return '';
  const filasHtml = filas
    .map(
      ([et, val, mono]) => `
        <tr>
          <td style="font-family:${SANS};font-size:13px;line-height:22px;color:${TINTA_65};padding-right:16px;white-space:nowrap;">${escaparHtml(et)}</td>
          <td class="texto" style="font-family:${mono ? MONO : SANS};font-size:16px;line-height:22px;color:${TINTA};">${escaparHtml(val)}</td>
        </tr>`,
    )
    .join('');
  return `
      <tr><td style="padding:16px 32px 0 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="caja-codigo" style="background:${TAPIZ};border:1px solid ${HAIRLINE};border-radius:10px;">
          <tr><td style="padding:14px 18px;">
            <table role="presentation" cellpadding="0" cellspacing="0">${filasHtml}
            </table>
          </td></tr>
        </table>
      </td></tr>`;
}

function plantillaHtml(d: Datos): string {
  const titulo = escaparHtml(d.titulo ?? 'Tienes una novedad en e-PetPlace');
  const mensaje = escaparHtml(d.mensaje ?? 'Abre la app para verla.');
  const bloqueCodigo = d.codigo
    ? `
      <tr><td style="padding:8px 32px 0 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td align="center" class="caja-codigo" style="background:${TAPIZ};border:1px solid ${HAIRLINE};border-radius:10px;padding:20px 16px;">
            <span class="texto codigo" style="font-family:${MONO};font-size:32px;font-weight:600;letter-spacing:0.12em;color:${TINTA};">${escaparHtml(agrupar(d.codigo))}</span>
          </td>
        </tr></table>
        <p class="texto-pie" style="font-family:${SANS};font-size:14px;line-height:20px;color:${TINTA_65};text-align:center;margin:10px 0 0 0;">
          Toca el código para copiarlo.${
            d.codigo_vigencia_min ? ` Vale por ${escaparHtml(String(d.codigo_vigencia_min))} minutos.` : ''
          }
        </p>
      </td></tr>`
    : '';

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<style>
  /* Capa 1 — clientes que HONRAN prefers-color-scheme (el par de la casa).
     Capa 2 (inversión forzada) no se pelea: el eje tinta/papel sobrevive
     por simetría y nada informativo viaja solo en color. */
  @media (prefers-color-scheme: dark) {
    .fondo { background: #050508 !important; }
    .texto, .codigo { color: #F0EEF8 !important; }
    .texto-pie { color: rgba(240,238,248,.65) !important; }
    .caja-codigo { background: #050508 !important; border-color: rgba(240,238,248,.18) !important; }
    .hairline { border-color: rgba(240,238,248,.18) !important; }
    a.enlace { color: #AE59FF !important; }
  }
</style>
</head>
<body class="fondo" style="margin:0;padding:0;background:${PAPEL};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="fondo" style="background:${PAPEL};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
  <tr><td style="padding:20px 32px 14px 32px;">
    <span class="texto" style="font-family:${SANS};font-size:18px;font-weight:600;color:${TINTA};">e-PetPlace</span>
  </td></tr>
  <tr><td style="padding:0 32px;"><div class="hairline" style="border-top:1px solid ${HAIRLINE};font-size:0;line-height:0;">&nbsp;</div></td></tr>
  <tr><td style="padding:22px 32px 0 32px;">
    <p class="texto" style="font-family:${SANS};font-size:22px;font-weight:500;color:${TINTA};margin:0;">${titulo}</p>
  </td></tr>
  <tr><td style="padding:12px 32px 0 32px;">
    <p class="texto" style="font-family:${SANS};font-size:16px;line-height:24px;color:${TINTA};margin:0;">${mensaje}</p>
  </td></tr>
  ${bloqueDetalle(d)}
  ${bloqueCodigo}
  <tr><td style="padding:28px 32px 24px 32px;">
    <p class="texto-pie" style="font-family:${SANS};font-size:13px;line-height:20px;color:${TINTA_65};margin:0;">
      Este aviso salió de e-PetPlace (hola@epetplace.com) porque tu cuenta lo tiene activado.
      Puedes ajustar qué te avisamos desde Preferencias, en la app.
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function plantillaTexto(d: Datos): string {
  const partes = [
    d.titulo ?? 'Tienes una novedad en e-PetPlace',
    '',
    d.mensaje ?? 'Abre la app para verla.',
  ];
  const det = [
    d.mascota_nombre && `Mascota: ${d.mascota_nombre}`,
    d.negocio && `Con: ${d.negocio}`,
    d.fecha && `Fecha: ${d.fecha}`,
    d.hora && `Hora: ${d.hora}`,
  ].filter(Boolean);
  if (det.length) partes.push('', ...det as string[]);
  if (d.codigo) {
    partes.push('', `Código: ${agrupar(d.codigo)}`);
    if (d.codigo_vigencia_min) partes.push(`Vale por ${d.codigo_vigencia_min} minutos.`);
  }
  partes.push(
    '',
    '—',
    'e-PetPlace · hola@epetplace.com',
    'Puedes ajustar qué te avisamos desde Preferencias, en la app.',
  );
  return partes.join('\n');
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'solo_post' }, { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // ① La DB decide. p_seco=false: aplica transiciones (sombra→encolada, etc.).
  const { data: corrida, error: errorRpc } = await supabase.rpc(
    'despachar_notificaciones',
    { p_seco: false },
  );
  if (errorRpc) {
    return Response.json({ error: 'despachador_fallo', causa: errorRpc.message }, { status: 500 });
  }

  // ② Lo marcado para_transporte con canal email — lo único que esta función entrega.
  const { data: pendientes, error: errorSel } = await supabase
    .from('notificacion_intencion')
    .select('id, tipo, destinatario_user_id, datos, resuelto_como')
    .eq('estado', 'encolada')
    .eq('resuelto_como->>despacho', 'para_transporte')
    .eq('resuelto_como->>canal_elegido', 'email')
    .limit(50);
  if (errorSel) {
    return Response.json({ error: 'lectura_fallo', causa: errorSel.message }, { status: 500 });
  }

  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    // MODO SOMBRA DE TRANSPORTE — declarado, no un fallo (L-197: la ausencia
    // se dice como ausencia; nada se marca entregado).
    return Response.json({
      modo: 'sin_transporte_todavia',
      nota: 'RESEND_API_KEY ausente: el dominio no verificó. Nada se entrega ni se marca.',
      corrida,
      habria_entregado: pendientes?.length ?? 0,
    });
  }

  // ③ Entregar, una por una, y escribir la verdad de cada una (§10.6).
  let entregadas = 0;
  let fallidas = 0;
  for (const i of pendientes ?? []) {
    const { data: usuario } = await supabase.auth.admin.getUserById(i.destinatario_user_id);
    const email = usuario?.user?.email;
    if (!email) {
      await supabase.from('notificacion_intencion')
        .update({ estado: 'fallida', motivo: 'destinatario_sin_email' })
        .eq('id', i.id);
      fallidas++;
      continue;
    }

    const datos = (i.datos ?? {}) as Datos;
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: REMITENTE,
        to: [email],
        subject: datos.titulo ?? 'Tienes una novedad en e-PetPlace',
        html: plantillaHtml(datos),
        text: plantillaTexto(datos),
      }),
    });

    if (r.ok) {
      const cuerpo = await r.json();
      await supabase.from('notificacion_intencion')
        .update({
          estado: 'entregada',
          resuelto_como: { ...i.resuelto_como, proveedor_id: cuerpo?.id ?? null },
        })
        .eq('id', i.id);
      entregadas++;
    } else {
      const causa = await r.text();
      await supabase.from('notificacion_intencion')
        .update({ estado: 'fallida', motivo: `resend_${r.status}: ${causa.slice(0, 180)}` })
        .eq('id', i.id);
      fallidas++;
    }
  }

  return Response.json({ modo: 'transporte_vivo', corrida, entregadas, fallidas });
});
