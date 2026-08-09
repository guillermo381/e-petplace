// ============================================================================
// despachar-whatsapp — EL TRANSPORTE, EN MODO SOMBRA (S91-A)
// ============================================================================
// GEMELO de `despachar-push`, y gemelo A PROPÓSITO: la DB decide TODO (gates
// de §5, kill switch, techo, consentimiento) y esta función solo entrega y
// trae la verdad de vuelta. Si una fila no llega acá, es porque un gate la
// cortó y eso ya está escrito en su `resuelto_como`.
//
// ── NACE APAGADO, Y NO ES UN BORRADOR ──────────────────────────────────────
// **Sin credencial corre ENTERO, reporta `habria_entregado` y NO MANDA NADA.**
// Eso no es una versión incompleta: es la forma que la LEY DE SECUENCIA de
// `MODELO_NOTIFICACIONES` §0ter exige — lector → pieza → gate → flip, y **el
// flip de `transporte_vivo` es el ÚLTIMO acto**, con go del founder y
// destinatario de prueba propio. Push se abrió así y fue el primer canal que
// la casa abrió entero.
//
// ── LO QUE ESTA FUNCIÓN **NO** HACE, y cada «no» tiene su porqué ───────────
//   · **No marca filas en modo sombra.** Una fila tocada acá sería una
//     mentira sobre una entrega que no ocurrió.
//   · **No decide a quién escribirle.** El consentimiento con evidencia ya
//     existe desde S88-D (superficie + evidencia + guard
//     `opt_in_sin_evidencia`); acá se confía en el `resuelto_como` de la DB.
//   · **No compone texto libre.** WhatsApp utility se manda POR PLANTILLA
//     aprobada; el cuerpo lo define Meta, no nosotros.
//   · **No normaliza teléfonos.** Ver el bloque E.164 más abajo: eso es del
//     MOTOR, y meterlo acá sería la enésima superficie con su propia versión.
// ============================================================================
import { createClient } from 'jsr:@supabase/supabase-js@2';

// ── LOS SECRETS QUE ESTA FUNCIÓN LEE ───────────────────────────────────────
// Mismo patrón que FCM en S90: los carga el FOUNDER como secrets de Supabase.
// JAMÁS al repo, jamás por chat. Los tres nombres son contrato:
//   META_WHATSAPP_TOKEN   · el token de acceso (System User, larga duración)
//   META_WABA_ID          · la WhatsApp Business Account
//   META_PHONE_NUMBER_ID  · el número remitente
const TOKEN = 'META_WHATSAPP_TOKEN';
const WABA = 'META_WABA_ID';
const PHONE = 'META_PHONE_NUMBER_ID';

/** E.164 estricto: `+` y 8..15 dígitos, el primero distinto de 0.
 *  Se VALIDA acá y no se ARREGLA: arreglar un teléfono en el transporte es
 *  inventar el país de alguien, y eso lo prohíbe P21 (el teléfono no implica
 *  país). Un número que no cumple **se saltea diciendo por qué**. */
function esE164(t: string | null | undefined): boolean {
  return typeof t === 'string' && /^\+[1-9][0-9]{7,14}$/.test(t);
}

/**
 * EL GUARD DEL DESPACHO (S92-BIS · D-713) — gemelo del de `despachar-push`.
 *
 * Medido el 9-ago-2026: un `POST` sin ninguna credencial devolvía **200** y
 * procesaba la cola. Acá el daño potencial es menor porque **WhatsApp está
 * congelado** (`transporte_vivo=false`, cola en 0, y el token cargado no es de
 * Meta) — pero el día que se descongele, la puerta ya está cerrada. *Curar lo
 * que hoy no muerde, mientras no muerde, es la única vez que sale barato.*
 *
 * El secreto vive en los secrets de la function; **no viaja en ningún bundle**
 * porque a esta función la llama la base o una mano, nunca la app.
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

  // ① Lo que la DB YA marcó para transporte por WhatsApp.
  const { data: pendientes, error: errorSel } = await supabase
    .from('notificacion_intencion')
    .select('id, tipo, destinatario_user_id, datos, resuelto_como')
    .eq('estado', 'encolada')
    .eq('resuelto_como->>despacho', 'para_transporte')
    .eq('resuelto_como->>canal_elegido', 'whatsapp')
    .limit(50);
  if (errorSel) {
    return Response.json({ error: 'lectura_fallo', causa: errorSel.message }, { status: 500 });
  }

  // ② El destinatario: su teléfono. Se mide la FORMA antes de intentar nada,
  //    porque un lote donde la mitad de los números no son E.164 tiene que
  //    poder decirlo en modo sombra — es justamente lo que el founder
  //    necesita saber ANTES de encender.
  const uids = [...new Set((pendientes ?? []).map((i) => i.destinatario_user_id).filter(Boolean))];
  const telPorUid = new Map<string, string | null>();
  if (uids.length > 0) {
    const { data: perfiles } = await supabase
      .from('profiles')
      .select('id, telefono')
      .in('id', uids as string[]);
    for (const p of perfiles ?? []) telPorUid.set(p.id, p.telefono ?? null);
  }

  let sinTelefono = 0;
  let telefonoNoE164 = 0;
  let entregables = 0;
  for (const i of pendientes ?? []) {
    const t = telPorUid.get(i.destinatario_user_id as string) ?? null;
    if (!t) sinTelefono++;
    else if (!esE164(t)) telefonoNoE164++;
    else entregables++;
  }

  const token = Deno.env.get(TOKEN);
  const waba = Deno.env.get(WABA);
  const phoneId = Deno.env.get(PHONE);

  // ── MODO VERIFICAR (`?verificar=1`) — LEE Meta, NO MANDA NADA ─────────────
  // Nace porque la credencial llegó y recién ahora «las plantillas están
  // aprobadas» es una afirmación VERIFICABLE contra el objeto en vez de una
  // palabra. Es todo GET: pide las plantillas y el estado del número.
  // *Existe separado del despacho a propósito: un diagnóstico que comparte
  // camino con un envío es un diagnóstico que algún día manda algo.*
  if (new URL(req.url).searchParams.get('verificar') === '1') {
    if (!token || !waba || !phoneId) {
      return Response.json({
        modo: 'verificar',
        error: 'sin_credencial',
        secrets_faltantes: [!token ? TOKEN : null, !waba ? WABA : null, !phoneId ? PHONE : null]
          .filter(Boolean),
      });
    }
    // ── FORMA del token, JAMÁS su valor ──────────────────────────────────
    // Meta contesta «Cannot parse access token» para varias causas distintas
    // —truncado, con comillas, con salto de línea, o directamente OTRO dato
    // pegado en el campo—. Ninguna se distingue del mensaje. Se reportan
    // METADATOS de forma (largo, prefijo, espacios, comillas): alcanza para
    // decirle al founder QUÉ arreglar y **no revela un solo carácter del
    // secreto**. *Un diagnóstico que exige pegar el valor en un chat para
    // entenderlo es un diagnóstico que filtra credenciales.*
    const forma = {
      largo: token.length,
      // Los tokens de System User de Meta empiezan con «EAA».
      empieza_con_EAA: token.startsWith('EAA'),
      tiene_espacios: /\s/.test(token),
      tiene_comillas: /["']/.test(token),
      tiene_salto: /[\r\n]/.test(token),
      // Si alguien pegó el WABA_ID o el PHONE_NUMBER_ID en el campo del token,
      // el valor es todo dígitos y corto — se caza sin verlo.
      parece_un_id_numerico: /^[0-9]{5,20}$/.test(token),
    };
    const cab = { Authorization: `Bearer ${token}` };
    const rT = await fetch(
      `https://graph.facebook.com/v21.0/${waba}/message_templates` +
        `?fields=name,language,category,status,quality_score&limit=50`,
      { headers: cab },
    );
    const cT = await rT.json().catch(() => ({}));
    const rP = await fetch(
      `https://graph.facebook.com/v21.0/${phoneId}` +
        `?fields=verified_name,code_verification_status,quality_rating,display_phone_number,platform_type`,
      { headers: cab },
    );
    const cP = await rP.json().catch(() => ({}));

    const plantillas = Array.isArray(cT?.data)
      ? cT.data.map((t: Record<string, unknown>) => ({
          name: t.name,
          language: t.language,
          category: t.category,
          status: t.status,
        }))
      : [];
    // El número que decide la tarea del founder: cuántas están en MARKETING
    // cuando deberían ser UTILITY (precio, ventana y riesgo de pausa).
    const enMarketing = plantillas.filter((t) => t.category === 'MARKETING').length;
    const enUtility = plantillas.filter((t) => t.category === 'UTILITY').length;
    const aprobadas = plantillas.filter((t) => t.status === 'APPROVED').length;

    return Response.json({
      modo: 'verificar',
      token_forma: forma,
      http_plantillas: rT.status,
      http_numero: rP.status,
      plantillas_total: plantillas.length,
      plantillas_aprobadas: aprobadas,
      plantillas_en_marketing: enMarketing,
      plantillas_en_utility: enUtility,
      plantillas,
      numero: {
        verified_name: cP?.verified_name ?? null,
        display_phone_number: cP?.display_phone_number ?? null,
        code_verification_status: cP?.code_verification_status ?? null,
        quality_rating: cP?.quality_rating ?? null,
        platform_type: cP?.platform_type ?? null,
      },
      error_plantillas: rT.ok ? null : String(cT?.error?.message ?? '').slice(0, 240),
      error_numero: rP.ok ? null : String(cP?.error?.message ?? '').slice(0, 240),
      // Los tres números del despacho viajan TAMBIÉN acá: el founder decide
      // el encendido con una sola lectura, no con dos llamadas.
      habria_entregado: entregables,
      encoladas: pendientes?.length ?? 0,
      sin_telefono: sinTelefono,
      telefono_no_e164: telefonoNoE164,
    });
  }

  if (!token || !waba || !phoneId) {
    // ═══ MODO SOMBRA — declarado, NO un fallo ═══════════════════════════════
    // Nada se entrega y NADA se marca. Y el reporte dice las TRES cosas que
    // el founder necesita para decidir el encendido: cuántas saldrían, cuántas
    // no pueden por falta de teléfono, y cuántas no pueden porque el teléfono
    // que hay no es E.164 (que es un problema NUESTRO, no del destinatario).
    return Response.json({
      modo: 'sin_transporte_todavia',
      nota:
        'Falta al menos uno de los secrets de Meta: nada se entrega ni se marca. ' +
        'Los nombres exactos que esta función lee están en su cabecera.',
      secrets_faltantes: [
        !token ? TOKEN : null,
        !waba ? WABA : null,
        !phoneId ? PHONE : null,
      ].filter(Boolean),
      habria_entregado: entregables,
      encoladas: pendientes?.length ?? 0,
      sin_telefono: sinTelefono,
      // ⚠️ Este número es el que importa antes de encender: un teléfono fuera
      // de E.164 es un mensaje que Meta rechaza, y la cura NO es de esta
      // función (ver E.164 abajo).
      telefono_no_e164: telefonoNoE164,
    });
  }

  // ═══ DE ACÁ PARA ABAJO: EL CAMINO VIVO, que todavía NO se ejecutó nunca ══
  // Se deja escrito y NO se declara probado. La ley de secuencia dice que el
  // flip es el último acto: cuando el founder cargue los secrets, la primera
  // corrida es una PRUEBA DIRIGIDA a un destinatario suyo, igual que push.
  const URL_META = `https://graph.facebook.com/v21.0/${phoneId}/messages`;

  let entregadas = 0;
  let fallidas = 0;
  let salteadas = 0;

  for (const i of pendientes ?? []) {
    const tel = telPorUid.get(i.destinatario_user_id as string) ?? null;

    // El teléfono inválido NO es una entrega fallida del destinatario: es un
    // dato nuestro que no sirve. Se saltea y se DICE, sin quemar la intención.
    if (!esE164(tel)) {
      salteadas++;
      continue;
    }

    // La plantilla la dice la DB (`resuelto_como`), jamás esta función: el
    // nombre y el idioma de la plantilla son dato de negocio aprobado por
    // Meta, y hardcodearlos acá sería la segunda verdad.
    const plantilla = (i.resuelto_como as Record<string, unknown> | null)?.plantilla;
    const idioma = (i.resuelto_como as Record<string, unknown> | null)?.plantilla_idioma;
    if (typeof plantilla !== 'string' || typeof idioma !== 'string') {
      await supabase
        .from('notificacion_intencion')
        .update({ estado: 'fallida', motivo: 'sin_plantilla_resuelta' })
        .eq('id', i.id);
      fallidas++;
      continue;
    }

    const res = await fetch(URL_META, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: tel,
        type: 'template',
        template: { name: plantilla, language: { code: idioma } },
      }),
    });

    if (res.ok) {
      await supabase.from('notificacion_intencion').update({ estado: 'entregada' }).eq('id', i.id);
      entregadas++;
    } else {
      const cuerpo = await res.text();
      // Igual que en push: un fallo de INFRAESTRUCTURA no se marca `fallida`
      // —quemaría la intención por una caída ajena—; solo los 4xx de negocio.
      if (res.status >= 500) {
        fallidas++; // se reintenta en el próximo tick, sin tocar la fila
        continue;
      }
      await supabase
        .from('notificacion_intencion')
        .update({ estado: 'fallida', motivo: cuerpo.slice(0, 300) })
        .eq('id', i.id);
      fallidas++;
    }
  }

  return Response.json({
    modo: 'transporte_vivo',
    encoladas: pendientes?.length ?? 0,
    entregadas,
    fallidas,
    salteadas_telefono_invalido: salteadas,
  });
});
