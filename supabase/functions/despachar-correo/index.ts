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
const PAPEL_HEX = '#FAF9F7';
const TINTA = '#221E19';
const TINTA_65 = 'rgba(34,30,25,.65)';
const HAIRLINE = 'rgba(34,30,25,.18)';
const ACENTO = '#8E1F68'; // magentaDark — 7.84 sobre papel
const TAPIZ = '#FAF2F5'; // cliente — pink 3% · tinta sobre él 15.05
const TAPIZ_OFICIO = '#F4F8F6'; // prestador — teal 3% (bg.base de su casa) · tinta 15.46
const ORO = '#FCBC1D';
const ORO_TEXTO = '#1D1A2E'; // textLight0 — el par firmado 9.96
const TEAL_DARK = '#0A7268';
const BORDE_CAJA = 'rgba(34,30,25,.35)';
const BORDE_CTA = 'rgba(34,30,25,.45)';
/** El isotipo: PNG @2x HOSTED, URL estática SIN query params (nada que
 *  cuente aperturas). El wordmark de TEXTO queda al lado como fallback vivo:
 *  con imágenes bloqueadas, la cabecera sigue diciendo la casa. */
const ISOTIPO = 'https://zyltipqscdsdsxnjclhp.supabase.co/storage/v1/object/public/marca-publica/isotipo@2x.png';

/** LA CASA SE HEREDA ENTERA (atrape de B al generar): si el CTA cambia de
 *  casa, el TAPIZ del bloque también. Un correo al negocio con el tapiz rosa
 *  del cliente sería la casa equivocada en el correo correcto.
 *  El FILETE es marca (magentaDark en las dos casas, §15b.1); lo que hereda
 *  casa es el acento FUNCIONAL: CTA y links. */
type Casa = 'cliente' | 'prestador';
const CASA = {
  cliente:   { fill: ORO, label: ORO_TEXTO, borde: BORDE_CTA, tapiz: TAPIZ, link: ACENTO, linkDark: '#AE59FF' },
  prestador: { fill: TEAL_DARK, label: PAPEL_HEX, borde: TEAL_DARK, tapiz: TAPIZ_OFICIO, link: TEAL_DARK, linkDark: '#28E8DA' },
} as const;
/** Qué casa es cada tipo — se deriva de la AUDIENCIA del catálogo, que ya
 *  la declara; acá solo se traduce a paleta. */
const CASA_POR_TIPO: Record<string, Casa> = {
  cita_solicitada: 'prestador',
  registro_completado_prestador: 'prestador',
  registro_completado_operador: 'prestador',
};
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
  /* ═══ 🔴 S101-B · EL COMPROBANTE DE PAGO ════════════════════════════════
     **Requisito de certificación de Nuvei** (Erick, 20-ago): el correo tiene
     que llevar el **id de transacción** y el **código de autorización**
     **a la vista**.

     Medido en el gate: la intención llevaba los dos códigos, Resend entregó,
     y **el correo decía «Tienes una novedad en e-PetPlace»** — porque la
     plantilla no conocía estas claves y caía al genérico.
     *Es motor-sin-puerta en la capa de plantilla, y la lección es del
      instrumento: yo verifiqué la MATERIA PRIMA (la fila de la intención) y
      el requisito habla del ARTEFACTO (el correo renderizado).* */
  transaction_id?: string;
  authorization_code?: string;
  monto?: number | string;
  moneda?: string;
};

/** El bloque de detalle de la cita — proporciones de la espec: etiqueta 13px
 *  tinta.65, valor 16px tinta, LA HORA EN MONO (voz de máquina de la casa).
 *  Solo se pinta con datos reales; jamás inventa una fila vacía. */
/* 🔴 ESTA FUNCIÓN ESTABA MUERTA: se llamaba `bloqueDetalle`, y adentro de
   `plantillaHtml` **una const del mismo nombre la sombreaba**. Nadie la
   invocaba, y por eso sus filas nunca salieron en ningún correo.
   *Un nombre repetido en dos alcances no rompe nada, no avisa nada, y deja
    código que se lee como vivo.* Renombrada y cableada. */
function bloqueCodigosPago(d: Datos): string {
  const filas: Array<[string, string, boolean]> = [];
  if (d.mascota_nombre) filas.push(['Mascota', d.mascota_nombre, false]);
  if (d.negocio) filas.push(['Con', d.negocio, false]);
  if (d.fecha) filas.push(['Fecha', d.fecha, true]);
  /* 🔴 Los dos códigos que la certificación exige, **en MONO**: son voz de
     máquina, y el que los va a leer los está comparando carácter por carácter
     contra un estado de cuenta. */
  if (d.monto !== undefined && d.monto !== null)
    filas.push(['Monto', `${d.moneda ?? 'USD'} ${Number(d.monto).toFixed(2)}`, true]);
  if (d.transaction_id) filas.push(['Transacción', d.transaction_id, true]);
  if (d.authorization_code) filas.push(['Autorización', d.authorization_code, true]);
  if (d.hora) filas.push(['Hora', d.hora, true]);
  if (filas.length === 0) return '';
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

function plantillaHtml(d: Datos, tipo: string, idioma: string): string {
  const casa = CASA[CASA_POR_TIPO[tipo] ?? 'cliente'];
  const titulo = escaparHtml(d.titulo ?? 'Tienes una novedad en e-PetPlace');
  const mensaje = escaparHtml(d.mensaje ?? 'Abre la app para verla.');

  // EL CORAZÓN — el bloque de detalle con la MASCOTA presidiendo a 26px
  // (v2 de B). Solo se pinta con datos reales; jamás una caja vacía.
  const heroe = d.mascota_nombre ?? null;
  const cuando = [d.fecha, d.hora].filter(Boolean).join(' · ');
  const conQuien = d.negocio ?? null;
  const bloqueDetalle =
    heroe || cuando || conQuien
      ? `
  <tr><td style="padding:22px 32px 0 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td class="caja" style="background-color:${casa.tapiz};border:1px solid ${BORDE_CAJA};border-radius:12px;padding:28px;">
        ${heroe ? `<p class="txt" style="margin:0 0 6px 0;font-family:${SANS};font-size:26px;font-weight:600;line-height:32px;color:${TINTA};">${escaparHtml(heroe)}</p>` : ''}
        ${cuando ? `<p class="txt" style="margin:0 0 10px 0;font-family:${SANS};font-size:17px;font-weight:500;line-height:24px;color:${TINTA};">${escaparHtml(cuando)}</p>` : ''}
        ${conQuien ? `<p class="txt65" style="margin:0;font-family:${SANS};font-size:14px;line-height:20px;color:${TINTA_65};">${escaparHtml(conQuien)}</p>` : ''}
      </td></tr>
    </table>
  </td></tr>`
      : '';

  // EL CÓDIGO — cuando el tipo lo trae (recuperación de clave). Mono 32px.
  const bloqueCodigo = d.codigo
    ? `
  <tr><td style="padding:22px 32px 0 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td align="center" class="caja" style="background-color:${casa.tapiz};border:1px solid ${BORDE_CAJA};border-radius:12px;padding:24px 16px;">
        <span class="txt" style="font-family:${MONO};font-size:32px;font-weight:600;letter-spacing:0.12em;color:${TINTA};">${escaparHtml(agrupar(d.codigo))}</span>
      </td>
    </tr></table>
    <p class="txt65" style="margin:10px 0 0 0;font-family:${SANS};font-size:14px;line-height:20px;color:${TINTA_65};text-align:center;">
      Toca el código para copiarlo.${d.codigo_vigencia_min ? ` Vale por ${escaparHtml(String(d.codigo_vigencia_min))} minutos.` : ''}
    </p>
  </td></tr>`
    : '';

  return `<!doctype html>
<html lang="${idioma === 'en' ? 'en' : 'es'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<style>
  @media (prefers-color-scheme: dark) {
    .marco { background:#050508 !important; }
    .txt { color:#F0EEF8 !important; }
    .txt65 { color:rgba(240,238,248,.65) !important; }
    .caja { background:#12121A !important; border-color:rgba(240,238,248,.18) !important; }
    .hair { border-color:rgba(240,238,248,.18) !important; }
    .link { color:${casa.linkDark} !important; }
  }
</style>
</head>
<body style="margin:0;padding:24px 12px;background-color:#E8E6E3;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="marco" style="max-width:600px;margin:0 auto;background-color:${PAPEL_HEX};border-radius:12px;">

  <tr><td style="padding:40px 32px 0 32px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="padding-right:10px;vertical-align:middle;">
        <img src="${ISOTIPO}" width="46" height="32" alt="e-PetPlace" style="display:block;border:0;">
      </td>
      <td style="vertical-align:middle;">
        <span class="txt" style="font-family:${SANS};font-size:18px;font-weight:600;color:${TINTA};">e-PetPlace</span>
      </td>
    </tr></table>
  </td></tr>

  <tr><td style="padding:16px 32px 0 32px;">
    <div style="border-top:2px solid ${ACENTO};font-size:0;line-height:0;">&nbsp;</div>
  </td></tr>

  <tr><td style="padding:28px 32px 0 32px;">
    <p class="txt" style="margin:0 0 10px 0;font-family:${SANS};font-size:22px;font-weight:500;line-height:30px;color:${TINTA};">${titulo}</p>
    <p class="txt" style="margin:0;font-family:${SANS};font-size:16px;line-height:24px;color:${TINTA};">${mensaje}</p>
  </td></tr>
  ${bloqueDetalle}
  ${bloqueCodigosPago(d)}
  ${bloqueCodigo}

  <tr><td style="padding:32px 32px 28px 32px;">
    <div class="hair" style="border-top:1px solid ${HAIRLINE};font-size:0;line-height:0;margin-bottom:14px;">&nbsp;</div>
    <p class="txt65" style="margin:0 0 6px 0;font-family:${SANS};font-size:13px;font-weight:600;line-height:20px;color:${TINTA_65};">e-PetPlace</p>
    <p class="txt65" style="margin:0;font-family:${SANS};font-size:13px;line-height:20px;color:${TINTA_65};">
      Este correo salió de hola@epetplace.com<br>
      Puedes ajustar qué te avisamos desde Preferencias, en la app.
    </p>
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

/**
 * 🔴 D-723 — EL TERCER DESPACHADOR. Copia literal del guard de
 * `despachar-push` (D-713): misma forma, mismo secreto, mismos códigos.
 *
 * ── POR QUÉ HACÍA FALTA, medido el 9-ago ────────────────────────────────────
 * Un `POST` con la **anon key —que es pública y viaja en el bundle**— devolvía
 * **200 y PROCESABA LA COLA** (`"modo":"transporte_vivo"`). *Cualquiera podía
 * disparar el despacho de correo de la casa.*
 *
 * ── POR QUÉ NINGUNA CONFIGURACIÓN DE SUPABASE LO CUBRÍA ─────────────────────
 * Esta function tiene `verify_jwt: true`, y **eso da sensación de puerta
 * cerrada** — pero L-714 ya lo midió: **la anon key ES un JWT válido**, así que
 * `true` no frena a nadie. *Por eso el guard tiene que estar ADENTRO.*
 *
 * ── Y POR QUÉ SE ESCAPÓ DEL CENSO DE D-713 ──────────────────────────────────
 * Sus dos hermanos tienen `verify_jwt: false` y se buscaron por esa propiedad.
 * **Éste tiene `true`, así que no apareció.** *La familia se nombró por los que
 * se encontraron, no por los que existían* — y el censo se hizo por la
 * propiedad equivocada teniendo la lección escrita.
 *
 * **500 si no hay secreto configurado, jamás «pasar por las dudas»:** un guard
 * que se degrada a abierto cuando le falta su llave no es un guard.
 */
function guardDespacho(req: Request): Response | null {
  const esperado = Deno.env.get('DESPACHO_SECRET');
  if (!esperado) {
    return Response.json({ error: 'despacho_sin_secreto_configurado' }, { status: 500 });
  }
  const dado = req.headers.get('x-despacho-secret');
  if (dado !== esperado) {
    return Response.json({ error: 'despacho_no_autorizado' }, { status: 401 });
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'solo_post' }, { status: 405 });
  }

  const rechazo = guardDespacho(req);
  if (rechazo) return rechazo;

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
    // El idioma del DESTINATARIO gobierna el lang del correo (acta S88-A:
    // Gmail leyó «inglés» sobre un correo en español y ofreció traducirlo).
    const { data: pref } = await supabase
      .from('user_preferencias')
      .select('idioma')
      .eq('user_id', i.destinatario_user_id)
      .maybeSingle();
    const idioma = pref?.idioma === 'en' ? 'en' : 'es';
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: REMITENTE,
        to: [email],
        subject: datos.titulo ?? 'Tienes una novedad en e-PetPlace',
        html: plantillaHtml(datos, i.tipo, idioma),
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
