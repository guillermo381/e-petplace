// ─────────────────────────────────────────────────────────────────────────────
// despachar-invitacion-correo — EL ÚNICO CORREO QUE LA CASA LE MANDA A ALGUIEN
// QUE NO TIENE CUENTA.
//
// Por eso NO comparte cola con `despachar-correo`, y la razón es de esquema, no
// de gusto: `notificacion_intencion.destinatario_user_id` es NOT NULL con FK a
// `auth.users` ⇒ no puede llevar un destinatario sin cuenta. Ensancharlo tocaría
// el motor que sirve a TODO el producto para habilitar un caso (medición de A,
// S104). Cola propia, chica y declarada.
//
// ⚠️ ESTO ES CORREO NO SOLICITADO SALVO POR UNA COSA: que alguien de verdad lo
// invitó. Todo lo de acá abajo existe para que esa única justificación sea
// visible y reversible por quien lo recibe:
//   ① ENVÍO ÚNICO — la PK de la cola es la invitación. Un reenvío no está
//      prohibido: es INEXPRESABLE. **Jamás se construye un recordatorio sobre
//      esta cola.**
//   ② EL CUERPO DICE DE DÓNDE SALIÓ LA DIRECCIÓN — quién invitó y cómo llegó
//      su correo. Sin eso, para quien lo recibe es un desconocido escribiéndole.
//   ③ BAJA EN UN CLIC, en el cuerpo, sin cuenta y sin login.
//   ④ CERO LISTAS — `correo_suprimido` no tiene policies; solo DEFINER.
//
// 🔴 Y LA REGLA QUE NO SE PUEDE LEER DEL ESQUEMA: se consulta `correo_suprimido`
// ACÁ, antes de cada envío, aunque el productor ya lo haya consultado al
// encolar. *La baja llega DESPUÉS de encolar — ése es justo el caso que hay que
// atrapar.* Chequear solo al encolar es chequear en el único momento en que la
// respuesta no puede haber cambiado.
//
// NACE INERTE POR DISEÑO (patrón del reloj de S103): sin `INVITACION_CORREO_VIVO`
// devuelve `invitacion_correo_apagado` y no manda nada. **El cable se tiende
// ahora; la llave es del founder.** Un canal de correo frío que se enciende solo
// porque alguien lo desplegó es la clase de cosa que quema un dominio.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from 'jsr:@supabase/supabase-js@2';

const REMITENTE = 'e-PetPlace <hola@epetplace.com>';
const TOPE = 50;

type Fila = {
  invitacion_id: string;
  email: string;
  intentos: number;
};

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Bilingüe EN UN CUERPO, y acá es donde más se justifica: este correo va a
 *  alguien de quien NO sabemos el idioma — no tiene cuenta, no tiene
 *  preferencia, no hay nada que consultar. Un cuerpo que trae los dos no
 *  necesita saber quién lee. */
function plantilla(d: {
  quienInvita: string;
  familia: string;
  nombreInvitado: string | null;
  urlInvitacion: string;
  urlBaja: string;
  expira: string;
}) {
  const hola = d.nombreInvitado ? `Hola ${esc(d.nombreInvitado)}: ` : '';
  const holaEn = d.nombreInvitado ? `Hi ${esc(d.nombreInvitado)}, ` : '';
  const btn =
    'style="background: #221E19; color: #ffffff; text-decoration: none; padding: 14px 28px; ' +
    'border-radius: 10px; display: inline-block; font-weight: bold;"';
  const pie = 'style="color: #666; font-size: 13px;"';
  const origen = 'style="color: #666; font-size: 13px; line-height: 1.5;"';

  return `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
  <div lang="es">
    <h2>${hola}te invitaron a cuidar</h2>
    <p><strong>${esc(d.quienInvita)}</strong> te invitó a <strong>${esc(d.familia)}</strong> en e-PetPlace, para que puedas ver y cuidar a sus mascotas.</p>
    <p style="text-align: center; padding: 16px 0;">
      <a href="${esc(d.urlInvitacion)}" ${btn}>Aceptar la invitación</a>
    </p>
    <p>La invitación vence el ${esc(d.expira)}.</p>
    <p ${origen}>Recibís este correo porque <strong>${esc(d.quienInvita)}</strong> escribió esta dirección al invitarte. No tenés ninguna cuenta con nosotros y no vamos a volver a escribirte por esta invitación.<br>
    ¿No esperabas esto? <a href="${esc(d.urlBaja)}">No quiero recibir correos de e-PetPlace</a> — un clic, sin cuenta.</p>
    <p ${pie}>Nadie de e-PetPlace te va a pedir tu contraseña.</p>
  </div>
  <hr style="border: none; border-top: 1px solid #eee; margin: 28px 0;">
  <div lang="en">
    <h2>${holaEn}you've been invited</h2>
    <p><strong>${esc(d.quienInvita)}</strong> invited you to <strong>${esc(d.familia)}</strong> on e-PetPlace, so you can see and care for their pets.</p>
    <p style="text-align: center; padding: 16px 0;">
      <a href="${esc(d.urlInvitacion)}" ${btn}>Accept the invitation</a>
    </p>
    <p>The invitation expires on ${esc(d.expira)}.</p>
    <p ${origen}>You're getting this because <strong>${esc(d.quienInvita)}</strong> entered this address when inviting you. You don't have an account with us, and we won't email you again about this invitation.<br>
    Not expecting this? <a href="${esc(d.urlBaja)}">Don't email me from e-PetPlace</a> — one click, no account needed.</p>
    <p ${pie}>No one from e-PetPlace will ever ask you for your password.</p>
  </div>
</div>`;
}

Deno.serve(async (req) => {
  // ── EL GUARD, gemelo del de `despachar-correo` (D-713). No alcanza con
  // `verify_jwt`: la anon key es un JWT válido y viaja en el bundle.
  const esperado = Deno.env.get('DESPACHO_SECRET');
  if (!esperado) return Response.json({ error: 'sin_secreto_configurado' }, { status: 500 });
  if (req.headers.get('x-despacho-secret') !== esperado) {
    return Response.json({ error: 'despacho_no_autorizado' }, { status: 401 });
  }

  // ── LA LLAVE DEL FOUNDER. Va ANTES de leer nada: si está apagado, esta
  // función no toca la base.
  if (Deno.env.get('INVITACION_CORREO_VIVO') !== 'true') {
    return Response.json({
      modo: 'invitacion_correo_apagado',
      nota: 'INVITACION_CORREO_VIVO no está en true. El cable está tendido; la llave es del founder.',
    });
  }

  // ── LAS DOS URLs SON FAIL-CLOSED, y es deliberado: un enlace roto en un
  // correo frío es peor que no mandarlo. Si falta la base, no sale nada.
  const base = Deno.env.get('URL_APP_BASE');
  if (!base) {
    return Response.json({
      modo: 'sin_destino',
      nota: 'URL_APP_BASE ausente. No se manda un correo con un enlace que no lleva a ningún lado.',
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: pendientes, error: errSel } = await supabase
    .from('invitacion_correo_pendiente')
    .select('invitacion_id, email, intentos')
    .eq('estado', 'pendiente')
    .limit(TOPE);
  if (errSel) return Response.json({ error: 'lectura_fallo', causa: errSel.message }, { status: 500 });

  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    // MODO SOMBRA — declarado, no un fallo. Nada se marca enviado.
    return Response.json({
      modo: 'sin_transporte',
      nota: 'RESEND_API_KEY ausente. Nada se entrega ni se marca.',
      habria_entregado: pendientes?.length ?? 0,
    });
  }

  let enviados = 0;
  let suprimidos = 0;
  let fallidos = 0;

  for (const f of (pendientes ?? []) as Fila[]) {
    // 🔴 ④ LA BAJA GANA SIEMPRE, Y SE CONSULTA ACÁ. El productor ya miró al
    // encolar; esto atrapa a quien se dio de baja DESPUÉS, que es el único
    // caso que el chequeo del productor no puede ver.
    const { data: sup } = await supabase
      .from('correo_suprimido')
      .select('email')
      .eq('email', f.email)
      .maybeSingle();
    if (sup) {
      await supabase
        .from('invitacion_correo_pendiente')
        .update({ estado: 'fallido' })
        .eq('invitacion_id', f.invitacion_id);
      suprimidos++;
      continue;
    }

    const { data: inv } = await supabase
      .from('familia_invitaciones')
      .select('token, nombre, expira_en, familia_id, invitado_por, estado')
      .eq('id', f.invitacion_id)
      .maybeSingle();

    // Una invitación que ya no está pendiente no se anuncia. Puede haberse
    // aceptado o revocado entre el encolado y ahora.
    if (!inv || inv.estado !== 'pendiente') {
      await supabase
        .from('invitacion_correo_pendiente')
        .update({ estado: 'fallido' })
        .eq('invitacion_id', f.invitacion_id);
      fallidos++;
      continue;
    }

    const [{ data: fam }, { data: quien }] = await Promise.all([
      supabase.from('familia').select('nombre').eq('id', inv.familia_id).maybeSingle(),
      supabase.from('profiles').select('nombre, email').eq('id', inv.invitado_por).maybeSingle(),
    ]);

    // ⚠️ EL NOMBRE PUEDE NO SER UN NOMBRE, y no es hipótesis: `handle_new_user`
    // cae al LOCAL-PART DEL CORREO cuando la cuenta nace sin metadata (canon
    // S81), así que `profiles.nombre` puede valer `juan.perez99`. Ese valor NO
    // es null y por lo tanto el guard de abajo no lo ve — el correo saldría
    // diciendo «juan.perez99 te invitó», que a un desconocido le lee como spam
    // y le quita credibilidad justo a la condición ② (decir quién invitó).
    //   ⇒ Se detecta comparando contra el local-part de SU PROPIO correo, que
    //     es una igualdad EXACTA y no una heurística: si coinciden, ese nombre
    //     no lo declaró nadie — lo sembró el trigger.
    //
    // 🔴 Y ACÁ NO SE CORTA, POR UNA MEDICIÓN QUE CORRIGIÓ AL PLAN: de 16
    // titulares activos, **2 tienen el local-part como nombre** (14 declarado).
    // El aviso que traía este contrato decía 0 — midió `nombre = correo
    // ENTERO`, y el trigger siembra el LOCAL-PART, que es otro predicado.
    //   ⇒ Cortar habría dejado a 2 titulares REALES sin poder invitar a nadie,
    //     **en silencio**: `invitacion_correo_pendiente` no tiene columna de
    //     motivo, así que ese `fallido` sería indistinguible de un rebote de
    //     Resend. *Un corte que no se puede leer es peor que el correo feo que
    //     evita.*
    //   ⇒ Se degrada en vez de cortar: se nombra a la FAMILIA, que es un dato
    //     declarado por una persona, y nunca el username. No se inventa nada y
    //     no se expone el correo del que invita a un desconocido.
    const local = (quien?.email ?? '').split('@')[0].toLowerCase();
    const nombreEsSembrado =
      local.length > 0 && (quien?.nombre ?? '').trim().toLowerCase() === local;

    // NULL HONESTO: si no sabemos quién invitó, NO se inventa un nombre — pero
    // tampoco se manda, porque «alguien te invitó» sin decir quién es
    // exactamente el correo que la condición ② existe para no mandar.
    if (!quien?.nombre) {
      await supabase
        .from('invitacion_correo_pendiente')
        .update({ estado: 'fallido', intentos: f.intentos + 1 })
        .eq('invitacion_id', f.invitacion_id);
      fallidos++;
      continue;
    }

    // Con el nombre sembrado se nombra a la familia; sin ella, tampoco se
    // manda: quedarían las dos referencias vacías y el correo sería anónimo.
    const familia = fam?.nombre ?? null;
    if (nombreEsSembrado && !familia) {
      await supabase
        .from('invitacion_correo_pendiente')
        .update({ estado: 'fallido', intentos: f.intentos + 1 })
        .eq('invitacion_id', f.invitacion_id);
      fallidos++;
      console.error(`sin_quien_invita: invitacion ${f.invitacion_id} — nombre sembrado y familia sin nombre`);
      continue;
    }
    if (nombreEsSembrado) {
      console.error(`nombre_sembrado: invitacion ${f.invitacion_id} — se nombra la familia, no el usuario`);
    }

    // UNA sola resolución de «quién invitó», para que el asunto y el cuerpo no
    // puedan divergir: un asunto con el username y un cuerpo sin él sería peor
    // que cualquiera de los dos solo.
    const quienTexto = nombreEsSembrado ? `alguien de ${familia}` : quien.nombre;

    const cuerpo = plantilla({
      quienInvita: quienTexto,
      familia: familia ?? 'su familia',
      nombreInvitado: inv.nombre,
      urlInvitacion: `${base}/invitacion?t=${encodeURIComponent(inv.token)}`,
      urlBaja: `${base}/baja?t=${encodeURIComponent(inv.token)}`,
      expira: new Date(inv.expira_en).toLocaleDateString('es-EC', { timeZone: 'America/Guayaquil' }),
    });

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: REMITENTE,
        to: f.email,
        subject: `${quienTexto} te invitó a e-PetPlace · ${quienTexto} invited you`,
        html: cuerpo,
      }),
    });

    if (r.ok) {
      // ① ENVÍO ÚNICO: se marca enviado y esta fila no se vuelve a mirar.
      await supabase
        .from('invitacion_correo_pendiente')
        .update({ estado: 'enviado', enviado_en: new Date().toISOString() })
        .eq('invitacion_id', f.invitacion_id);
      enviados++;
    } else {
      const causa = await r.text();
      await supabase
        .from('invitacion_correo_pendiente')
        .update({ estado: 'fallido', intentos: f.intentos + 1 })
        .eq('invitacion_id', f.invitacion_id);
      fallidos++;
      console.error(`resend_${r.status}: ${causa.slice(0, 180)}`);
    }
  }

  return Response.json({ enviados, suprimidos, fallidos, mirados: pendientes?.length ?? 0 });
});
