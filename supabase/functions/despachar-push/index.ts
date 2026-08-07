// ============================================================================
// despachar-push — EL VAGÓN QUE FALTABA (S90-C · orden 1)
//
// La GEMELA de `despachar-correo`, y a propósito: mismo dispatch firmado
// (S87), mismo reparto de responsabilidades, misma forma de escribir la
// verdad de vuelta. **La DB decide TODO** (gates de §5, kill switch, techo
// duro, sombra) en `despachar_notificaciones`; acá solo se ENTREGA lo que
// quedó marcado `para_transporte` con `canal_elegido = 'push'`.
//
// ── POR QUÉ ESTA FUNCIÓN NO LLAMA A `despachar_notificaciones` ─────────────
// `despachar-correo` SÍ la llama, y el tick de `pg_cron` (jobid 6, cada
// minuto) la alcanza por ahí. **Dos llamadores del mismo paso de decisión
// compiten por el FUSIBLE**: el techo duro hace un `UPDATE` sobre
// `notificacion_config` que apaga el despacho global, y ése es el acto que
// no quiero correr por duplicado. El transporte transporta; la decisión
// tiene UN dueño.
//   ⚠️ EL COSTO, DECLARADO Y NO ESCONDIDO: esta función depende de que
//   *algo* corra el paso de decisión. Hoy lo corre el tick del correo. **Si
//   ese tick se apaga, push deja de entregar sin dar rojo** — que es
//   exactamente la clase de falla silenciosa que L-192 nombra. Su cron
//   propio va en el mismo lote (SQL literal en el reporte de C).
//
// ── EL TOKEN ES NATIVO, NO DE EXPO (medido, y decide el transporte) ────────
// La app llama `getDevicePushTokenAsync()` ⇒ en Android eso es el token de
// registro **de FCM**, no un `ExponentPushToken`. Por eso el camino es
// **FCM v1 directo** con la llave de servicio como secret — el camino (a)
// que la mesa ya tenía registrado desde S81.
//
// ── LA LEY DE LA PANTALLA BLOQUEADA (§4) ES LA MÁS DURA ACÁ ────────────────
// Un push se lee SIN DESBLOQUEAR el teléfono, por cualquiera que lo levante.
// El cuerpo sale de `datos.titulo`/`datos.mensaje` — los MISMOS campos que
// ya pinta la campana y que ya viajan por correo. **Esta función no compone
// texto nuevo ni lee nada del expediente**: si un productor mandara algo
// clínico ahí, el defecto es del productor y se cura en el productor.
//
// ── MODO SOMBRA DE TRANSPORTE ─────────────────────────────────────────────
// Sin `FCM_SERVICE_ACCOUNT`, la función corre ENTERA, reporta a quién le
// habría entregado y **no toca una sola fila**. Es el mismo patrón con el
// que el correo vivió hasta que su dominio verificó, y el mismo de L-197:
// la ausencia se dice como ausencia, jamás se degrada a un verde.
// ============================================================================

import { createClient } from 'npm:@supabase/supabase-js@2';
import { tokenDeAcceso, type CuentaDeServicio } from './fcm-oauth.ts';

type Datos = {
  titulo?: string;
  mensaje?: string;
  mascota_nombre?: string;
};

// ── Lectura del diagnóstico de FCM ─────────────────────────────────────────

/** Las causas por las que un token está MUERTO y no se reintenta jamás.
 *  El resto (429, 5xx) es transitorio: la fila queda encolada y vuelve. */
function tokenMuerto(status: number, cuerpo: string): boolean {
  if (status === 404) return true; // UNREGISTERED — el aparato desinstaló o rotó
  if (status === 403 && cuerpo.includes('SENDER_ID_MISMATCH')) return true;
  // 400 INVALID_ARGUMENT sobre el campo `token` es un token malformado. El
  // mismo 400 sobre otro campo sería un bug NUESTRO y NO retira nada: por eso
  // se mira qué campo nombra, no solo el código.
  if (status === 400 && cuerpo.includes('INVALID_ARGUMENT') && cuerpo.includes('token')) return true;
  return false;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'solo_post' }, { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // ① Lo que la DB YA marcó para transporte por push. Esta función no decide
  //    nada: si una fila no está acá, es porque un gate la cortó y eso ya se
  //    escribió en su `resuelto_como`.
  const { data: pendientes, error: errorSel } = await supabase
    .from('notificacion_intencion')
    .select('id, tipo, destinatario_user_id, datos, resuelto_como')
    .eq('estado', 'encolada')
    .eq('resuelto_como->>despacho', 'para_transporte')
    .eq('resuelto_como->>canal_elegido', 'push')
    .limit(50);
  if (errorSel) {
    return Response.json({ error: 'lectura_fallo', causa: errorSel.message }, { status: 500 });
  }

  const crudo = Deno.env.get('FCM_SERVICE_ACCOUNT');
  if (!crudo) {
    // MODO SOMBRA DE TRANSPORTE — declarado, no un fallo. Nada se entrega y
    // NADA se marca: una fila tocada acá sería una mentira sobre una entrega
    // que no ocurrió.
    return Response.json({
      modo: 'sin_transporte_todavia',
      nota: 'FCM_SERVICE_ACCOUNT ausente: la llave de servicio no está cargada. Nada se entrega ni se marca.',
      habria_entregado: pendientes?.length ?? 0,
    });
  }

  let sa: CuentaDeServicio;
  try {
    sa = JSON.parse(crudo);
    if (!sa.project_id || !sa.client_email || !sa.private_key) throw new Error('faltan_campos');
  } catch (e) {
    return Response.json(
      { error: 'llave_ilegible', causa: String(e).slice(0, 180) },
      { status: 500 },
    );
  }

  let acceso: string;
  try {
    acceso = await tokenDeAcceso(sa);
  } catch (e) {
    // Sin token de acceso NO se toca ninguna fila: el fallo es NUESTRO (o de
    // Google), no del destinatario, y marcarlas `fallida` las quemaría para
    // siempre por una caída de infraestructura.
    return Response.json({ error: 'oauth_fallo', causa: String(e).slice(0, 200) }, { status: 502 });
  }

  const URL_FCM = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;

  let entregadas = 0;
  let fallidas = 0;
  let reintentables = 0;
  let tokensRetirados = 0;

  for (const i of pendientes ?? []) {
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('id, token, plataforma')
      .eq('user_id', i.destinatario_user_id)
      .eq('activo', true);

    // ⚠️ SOLO ANDROID, Y SE DICE POR QUÉ. `getDevicePushTokenAsync()` en iOS
    // devuelve el token CRUDO DE APNs, que NO es un token de FCM: mandarlo
    // acá da un rechazo que parecería «token muerto» y retiraría un token
    // sano. Hoy no hay ninguna fila iOS; el día que la haya, su entrega es
    // arco propio (APNs directo o el intercambio de FCM), y hasta entonces
    // esta función NO finge que puede.
    const entregables = (tokens ?? []).filter((t) => t.plataforma === 'android');

    if (entregables.length === 0) {
      // NULL HONESTO (§7, L-139): sin aparato al que entregar, esto NO es una
      // entrega. Se dice cuál de las dos ausencias es.
      //   ⚖️ Y NO DESAPARECE DE LA CAMPANA: `obtener_mis_avisos` filtra por
      //   `resuelto_como->>despacho = 'para_transporte'`, que NO se toca acá
      //   — el aviso queda visible en la app aunque el teléfono no lo reciba.
      //   (Medido contra el body vivo, 7-ago.)
      const soloIos = (tokens ?? []).length > 0;
      await supabase
        .from('notificacion_intencion')
        .update({
          estado: 'fallida',
          motivo: soloIos ? 'sin_token_entregable_ios' : 'sin_token_activo',
        })
        .eq('id', i.id);
      fallidas++;
      continue;
    }

    const datos = (i.datos ?? {}) as Datos;
    const titulo = datos.titulo ?? 'Tienes una novedad en e-PetPlace';
    const cuerpoMsg = datos.mensaje ?? 'Abre la app para verla.';

    let algunaOk = false;
    let ultimaCausa = '';
    let algunaReintentable = false;

    for (const t of entregables) {
      const r = await fetch(URL_FCM, {
        method: 'POST',
        headers: { Authorization: `Bearer ${acceso}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: {
            token: t.token,
            // `notification` (y no solo `data`) porque tiene que MOSTRARSE
            // con la app cerrada: un `data-only` en Android depende de que el
            // proceso esté vivo, y la campana que no suena no es una campana.
            notification: { title: titulo, body: cuerpoMsg },
            android: {
              priority: 'HIGH',
              // ⚠️ SIN `channel_id` A PROPÓSITO: la app no crea ningún canal
              // propio (medido: cero `setNotificationChannelAsync` en las dos
              // apps). Nombrar un canal inexistente hace que Android
              // **descarte el aviso en silencio** — la peor falla posible acá.
              // El ícono y el color los hornea el plugin en el binario.
              notification: { default_sound: true },
            },
            // El destino del toque. La app lo lee para abrir el aviso; nada
            // de esto se muestra en la pantalla bloqueada.
            data: { intencion_id: i.id, tipo: i.tipo },
          },
        }),
      });

      if (r.ok) {
        algunaOk = true;
        await supabase
          .from('push_tokens')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', t.id);
        continue;
      }

      const causa = await r.text();
      ultimaCausa = `fcm_${r.status}: ${causa.slice(0, 180)}`;

      if (tokenMuerto(r.status, causa)) {
        // UN TOKEN MUERTO SE RETIRA, NO SE REINTENTA PARA SIEMPRE (§7). Se
        // desactiva la fila, no se borra: queda el rastro de que ese aparato
        // existió y cuándo dejó de contestar.
        await supabase.from('push_tokens').update({ activo: false }).eq('id', t.id);
        tokensRetirados++;
      } else {
        // 429 / 5xx — transitorio. No se quema la intención por una caída.
        algunaReintentable = true;
      }
    }

    if (algunaOk) {
      await supabase
        .from('notificacion_intencion')
        .update({ estado: 'entregada' })
        .eq('id', i.id);
      entregadas++;
    } else if (algunaReintentable) {
      // Queda ENCOLADA tal cual: el próximo tick la vuelve a intentar.
      reintentables++;
    } else {
      await supabase
        .from('notificacion_intencion')
        .update({ estado: 'fallida', motivo: ultimaCausa || 'fcm_sin_causa' })
        .eq('id', i.id);
      fallidas++;
    }
  }

  return Response.json({
    modo: 'transporte_vivo',
    proyecto: sa.project_id,
    entregadas,
    fallidas,
    reintentables,
    tokens_retirados: tokensRetirados,
  });
});
