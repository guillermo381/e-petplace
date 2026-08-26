/**
 * `video-webhook` — EL BUZÓN DE LIVEKIT (S106-D tanda 2, acto 2).
 *
 * Recibe los eventos de sala de LiveKit, **verifica su firma**, y entrega
 * **el hecho crudo** a la puerta que construye A. Nada más.
 *
 * ── LA FIRMA QUE ORDENA ESTE ARCHIVO: REGISTRAR SIN JUZGAR ──────────────────
 * 🔴 Firma del founder (`D-931`). Este archivo **no decide nada**:
 *   · **cero consecuencia automática** — no cancela, no marca, no cobra, no
 *     devuelve plata, no toca una cita;
 *   · **cero atribución de culpa** — no dice quién faltó ni de quién fue el
 *     corte.
 *
 * *`LETRA_TELEMEDICINA` §5 sigue intacto: «no se investiga de quién fue la
 * culpa… el sistema no mide la calidad de la conexión de nadie, así que no
 * puede atribuirla». Un evento de corte dice **que pasó**, jamás **por quién**
 * — y si el sistema decidiera quién faltó, estaría decidiendo quién paga.*
 *
 * ── POR QUÉ ESTA FUNCTION NO EXIGE SESIÓN, Y CON QUÉ SE DEFIENDE ────────────
 * Un webhook de LiveKit **no trae JWT de Supabase**: lo manda su servidor, no
 * una persona. ⇒ se despliega con **`--no-verify-jwt`** y **su guard vive
 * adentro**, igual que `pagos-deuna-webhook` y `pagos-webhook-stg`.
 *
 * El guard es **doble y lo hace el SDK** (medido en el cuerpo de
 * `WebhookReceiver.receive` de `livekit-server-sdk@2.18.0`):
 *   ① verifica el **JWT firmado con nuestro API secret**, y
 *   ② compara el **sha256 del cuerpo** contra el claim `sha256` del token.
 * ⇒ *un cuerpo alterado con un token válido muere en ②.*
 *
 * ── 🔴 EL CUERPO SE LEE CRUDO, Y NO ES UN DETALLE ───────────────────────────
 * `req.text()`, **jamás `req.json()`**. El hash de ② se calcula sobre el
 * string EXACTO que llegó; parsear y volver a serializar cambia los bytes
 * (orden de claves, espacios) y **la verificación fallaría con un cuerpo
 * legítimo**. *Un guard que rechaza lo bueno se apaga a los dos días.*
 *
 * ── SECRETOS ────────────────────────────────────────────────────────────────
 * `Deno.env`, los mismos tres que ya usa `video-token`. **El `vault` de
 * `L-408` no aplica** (aceptado por la mesa): ese patrón es para el secreto
 * que `pg_cron` necesita, no para una edge llamada desde afuera.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { WebhookReceiver } from 'npm:livekit-server-sdk@2.18.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const LIVEKIT_API_KEY = Deno.env.get('LIVEKIT_API_KEY');
const LIVEKIT_API_SECRET = Deno.env.get('LIVEKIT_API_SECRET');

function json(cuerpo: unknown, status = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: false, codigo: 'metodo_no_permitido' }, 405);

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return json({ ok: false, codigo: 'servidor_sin_configurar' }, 500);
  }
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    return json({ ok: false, codigo: 'video_sin_configurar' }, 500);
  }

  /* El cuerpo CRUDO. Ver la nota de cabecera: parsearlo rompe el hash. */
  const bodyRaw = await req.text();

  /* 🔴 EL NOMBRE DEL HEADER ES AMBIGUO EN LA PROPIA FUENTE, y se declara:
     `livekit-server-sdk@2.18.0` **exporta** una constante
     `authorizeHeader = "Authorize"` que **no usa en ningún lado**, mientras el
     JSDoc de `receive()` dice literalmente «`Authorization` header from the
     request». Los dos vienen del mismo archivo.
     ⇒ Se leen **los dos**, con `Authorization` primero. *Elegir uno a ciegas
     y equivocarse produce «firma inválida» sobre webhooks legítimos, que es
     indistinguible de un ataque.* La ambigüedad sólo la cierra un webhook
     real llegando — y cuando llegue, esta línea se puede simplificar. */
  const authHeader = req.headers.get('Authorization') ?? req.headers.get('Authorize') ?? '';

  let evento: { event?: string; room?: { name?: string }; participant?: { identity?: string }; createdAt?: unknown };
  try {
    const receiver = new WebhookReceiver(LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
    evento = await receiver.receive(bodyRaw, authHeader) as typeof evento;
  } catch (_e) {
    /* Firma inválida o cuerpo alterado. **No se registra nada**: esto no es
       un evento nuestro, es alguien golpeando la puerta.
       🔴 Y el motivo NO se devuelve en el cuerpo: decirle a quien sondea si
       falló la firma o el hash le enseña cuál de las dos defensas rompió. */
    return json({ ok: false, codigo: 'firma_invalida' }, 401);
  }

  const nombreEvento = evento?.event ?? '';
  const sala = evento?.room?.name ?? null;
  const participante = evento?.participant?.identity ?? null;

  /* 🔴 NO SE FILTRA NINGÚN EVENTO ACÁ, y es la firma en acto.
     De los 12 que LiveKit publica, hoy sólo cuatro le interesan a la letra
     (`participant_joined`, `participant_left`, `room_finished`,
     `participant_connection_aborted`). **Igual se entregan los doce.**
     *Filtrar en la edge sería juzgar cuál hecho importa, y esa decisión es de
     la puerta — que además puede cambiar de opinión sin redeployar esto.* */
  const { error } = await db().rpc('registrar_evento_videollamada', {
    p_sala: sala,
    p_evento: nombreEvento,
    p_participante: participante,
    p_payload: JSON.parse(bodyRaw),
  });

  if (error) {
    /* 🔴 500 A PROPÓSITO, para que LiveKit REINTENTE.
       Un 200 acá diría «lo tengo» sobre un hecho que no se guardó, y el
       evento se perdería en silencio — que es justo lo que un buzón existe
       para que no pase.
       ⚠️ NO MEDIDO: si LiveKit reintenta, y cuántas veces. Si NO reintenta,
       este 500 no salva el evento — sólo deja la traza de que llegó. Se
       declara en vez de suponerse. */
    return json({ ok: false, codigo: 'no_se_pudo_registrar' }, 500);
  }

  return json({ ok: true });
});

function db() {
  return createClient(SUPABASE_URL!, SERVICE_ROLE!, { auth: { persistSession: false } });
}
