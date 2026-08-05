// ============================================================================
// despachar-correo — LA ÚNICA VOZ AL EXTERIOR (S88-A · Lote 2)
//
// El dispatch firmado (S87): pg_cron toca el timbre por pg_net → esta función.
// La DB decide TODO (gates, kill switch, techo, sombra) en
// `despachar_notificaciones`; acá solo se ENTREGA lo que quedó marcado
// `para_transporte`, y se escribe de vuelta entregada/fallida con su causa.
//
// MODO SOMBRA DE TRANSPORTE: sin RESEND_API_KEY (hoy — el dominio
// avisos.epetplace.com todavía no verificó), la función corre entera, reporta
// qué HABRÍA entregado y NO toca las filas. El día que el secret exista, el
// mismo tick empieza a entregar — sin deploy nuevo.
//
// LA LEY DE LA PANTALLA BLOQUEADA (§4) rige TAMBIÉN acá, con más fuerza: el
// correo queda escrito en servidores ajenos. El cuerpo es la campana, jamás
// el contenido — título y mensaje vienen de los productores, que ya hablan
// sin dato clínico.
// ============================================================================

import { createClient } from 'npm:@supabase/supabase-js@2';

const REMITENTE = 'e-PetPlace <avisos@avisos.epetplace.com>';

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

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: REMITENTE,
        to: [email],
        subject: (i.datos?.titulo as string) ?? 'Tienes una novedad en e-PetPlace',
        text: (i.datos?.mensaje as string) ?? 'Abre la app para verla.',
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
